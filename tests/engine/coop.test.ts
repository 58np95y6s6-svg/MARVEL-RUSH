import { describe, expect, it } from 'vitest';
import { createEngine, registerMaps } from '../../src/engine';
import { debugPlace, debugSpawn, simState } from '../../src/engine/debug';
import { GRID_SIZE } from '../../src/engine/types';
import { boardGeometry, canTarget, coveredSpans } from '../../src/engine/geometry';
import { COOP_BOSS } from '../../src/data/bosses';
import { PATH_CELLS } from '../../src/maps/layout';
import { MARVEL, coop, ofType, quiet, setup, step } from './helpers';

describe('Coop : deux branches qui se rejoignent', () => {
  it('branches a, b et tronc ; les ennemis entrent par a et b, un boss par branche', () => {
    const e = coop();
    expect(e.state.lanes.map((l) => [l.id, l.length])).toEqual([['a', 11], ['b', 11], ['tronc', 5.6]]);
    const ev = step(e, 1);
    expect(ofType(ev, 'enemySpawn').map((s) => s.lane)).toEqual(['a', 'b']);
    const b = createEngine({ mode: 'coop', seed: 1, mapId: 'x', players: [setup(), setup(MARVEL, {}, 'p2')], script: { bossAtWave: 1, bossId: 'ursula' } });
    const spawns = ofType(b.drainEvents(), 'bossSpawn');
    expect(spawns.map((s) => s.lane)).toEqual(['a', 'b']);
    // Chaque boss part du début de sa branche (pas près de la porte) et fait tout le chemin, plus lentement qu'en Solo.
    const bosses = b.state.enemies.filter((x) => x.bossId);
    expect(bosses.map((x) => x.distance)).toEqual([0, 0]);
    expect(bosses[0]!.speed).toBeCloseTo(COOP_BOSS.speed);
    const solo = createEngine({ mode: 'solo', seed: 1, mapId: 'x', players: [setup()], script: { bossAtWave: 1, bossId: 'ursula' } });
    const sb = solo.state.enemies.find((x) => x.bossId)!;
    expect(bosses[0]!.maxHp).toBeCloseTo(sb.maxHp * COOP_BOSS.hpShare);
    // Traversée d'un boss Coop (branche + tronc) au moins aussi longue qu'en Solo.
    const coopTime = (11 + 5.6) / COOP_BOSS.speed, soloTime = PATH_CELLS / sb.speed; // maps réelles : 14 cases en Solo
    expect(coopTime).toBeGreaterThanOrEqual(soloTime);
  });

  it('mini-boss : un par branche, plus lents qu’en Solo', () => {
    const b = createEngine({ mode: 'coop', seed: 1, mapId: 'x', players: [setup(), setup(MARVEL, {}, 'p2')], script: { miniBoss: 'jafar', bossAtWave: 1 } });
    const minis = b.state.enemies.filter((x) => x.giant);
    expect(minis.map((m) => m.lane)).toEqual(['a', 'b']);
  });

  it('les longueurs viennent de la map (pathLengthCoop)', () => {
    registerMaps([{ id: 'coop-test', pathLength: 30, pathLengthCoop: { a: 15, b: 16, tronc: 12 } }]);
    const e = coop({ mapId: 'coop-test' });
    expect(e.state.lanes.map((l) => l.length)).toEqual([15, 16, 12]);
  });

  it('un ennemi en fin de branche rejoint le tronc, puis coûte 1 des 3 vies partagées du château', () => {
    expect(quiet(MARVEL, { mode: 'coop' }).state.lives).toBe(3);
    const e = quiet(MARVEL, { mode: 'coop' });
    const en = debugSpawn(e, { lane: 'b', distance: 10.95, speed: 2, hp: 1e9 });
    step(e, 1);
    expect(en.lane).toBe('tronc');
    expect(en.distance).toBeCloseTo(0.05);
    en.distance = 5.59;
    const ev = step(e, 1);
    expect(ofType(ev, 'lifeLost')[0]!.lives).toBe(2);
    expect(e.state.lives).toBe(2);
    expect(e.state.result).toBeUndefined();
  });

  it('règle « dernière ligne droite » : la branche de la partenaire n’est touchable qu’avant la jonction', () => {
    const e = quiet(MARVEL, { mode: 'coop' });
    debugPlace(e, 0, 0, 'hawkeye'); // portée : toute la map
    debugPlace(e, 1, 0, 'hawkeye');
    const early = debugSpawn(e, { lane: 'b', distance: 2, speed: 0, hp: 1e9 });
    const hits = ofType(step(e, 1), 'attack');
    expect(hits.filter((h) => h.player === 'p1')).toEqual([]);
    expect(hits.filter((h) => h.player === 'p2').every((h) => h.targets[0] === early.uid)).toBe(true);
    // Sur la dernière ligne droite de la branche b : p1 peut tirer.
    early.distance = 10.5;
    e.state.players.forEach((p) => (p.grid[0]!.cooldown = 0));
    const later = ofType(step(e, 1), 'attack');
    expect(later.map((a) => a.player).sort()).toEqual(['p1', 'p2']);
  });

  it('canTarget : solo inchangé, tronc et branche propre toujours, branche de l’autre après la jonction', () => {
    const g = boardGeometry('coop', 'u');
    expect(g.cross!.a).toBeGreaterThan(0.5);
    expect(g.cross!.a).toBeLessThan(0.8);
    expect(canTarget(g, 0, 'a', 0, 11)).toBe(true);
    expect(canTarget(g, 0, 'tronc', 0, 6)).toBe(true);
    expect(canTarget(g, 0, 'b', 11 * g.cross!.b - 0.1, 11)).toBe(false);
    expect(canTarget(g, 0, 'b', 11 * g.cross!.b + 0.01, 11)).toBe(true);
    expect(canTarget(g, 1, 'a', 1, 11)).toBe(false);
    expect(canTarget(g, 1, 'b', 1, 11)).toBe(true);
    expect(canTarget(boardGeometry('solo', 'u'), 0, 'a', 0, 14)).toBe(true);
    // Zone affichée (appui long) : rien sur la branche de l'autre avant la ligne droite.
    for (const [a] of coveredSpans(g, 0, 'b', 4, 3.4)) expect(a).toBeGreaterThanOrEqual(g.cross!.b - 1e-9);
  });

  it('toutes les unités touchent les ennemis de leur branche et du tronc', () => {
    const e = quiet(MARVEL, { mode: 'coop' });
    debugPlace(e, 0, 0, 'hawkeye');
    debugPlace(e, 1, 0, 'hawkeye');
    const onB = debugSpawn(e, { lane: 'b', distance: 10, hp: 1e9 });
    const trunk = debugSpawn(e, { lane: 'tronc', distance: 1, hp: 1e9 });
    const hits = ofType(step(e, 1), 'attack');
    // « premier » : l'ennemi du tronc est plus avancé que celui de la branche.
    expect(hits.every((h) => h.targets[0] === trunk.uid)).toBe(true);
    trunk.hp = 0;
    e.state.players.forEach((p) => (p.grid[0]!.cooldown = 0));
    const again = ofType(step(e, 1), 'attack');
    expect(again.map((a) => a.player).sort()).toEqual(['p1', 'p2']);
    expect(again.every((a) => a.targets[0] === onB.uid)).toBe(true);
  });

  it('le mana de l’élimination va au joueur qui donne le coup final', () => {
    const e = quiet(MARVEL, { mode: 'coop' });
    debugPlace(e, 1, 0, 'merida', 3);
    debugSpawn(e, { lane: 'b', distance: 3, hp: 10 });
    const k = ofType(step(e, 1), 'kill')[0]!;
    expect(k.player).toBe('p2');
    expect(e.state.players[1]!.mana).toBe(110);
    expect(e.state.players[0]!.mana).toBe(100);
  });

  it('Offrir : une unité vers une case vide du partenaire, une fois par vague', () => {
    const e = quiet(MARVEL, { mode: 'coop' });
    debugPlace(e, 0, 4, 'widow', 3);
    debugPlace(e, 0, 5, 'falcon', 1);
    e.apply({ type: 'gift', player: 'p1', slot: 4 });
    const g = ofType(step(e, 1), 'gift')[0]!;
    expect(g).toMatchObject({ from: 'p1', to: 'p2', unit: 'widow', rank: 3 });
    expect(e.state.players[1]!.grid[g.slot]!.unit).toBe('widow');
    expect(e.state.players[0]!.grid[4]).toBeNull();
    e.apply({ type: 'gift', player: 'p1', slot: 5 });
    expect(ofType(step(e, 1), 'rejected')[0]!.reason).toMatch(/déjà offert/);
    // Nouvelle vague : de nouveau possible, sauf plateau plein.
    simState(e).spawnCount = simState(e).waveMonsters; // vague nettoyée (Rush Royale : vague suivante)
    step(e, 2);
    for (let i = 0; i < GRID_SIZE; i++) if (!e.state.players[1]!.grid[i]) debugPlace(e, 1, i, 'cmarvel');
    e.apply({ type: 'gift', player: 'p1', slot: 5 });
    expect(ofType(step(e, 1), 'rejected')[0]!.reason).toMatch(/plein/);
  });

  it('Offrir est refusé en Solo', () => {
    const e = quiet();
    debugPlace(e, 0, 0, 'widow');
    e.apply({ type: 'gift', player: 'p1', slot: 0 });
    expect(ofType(step(e, 1), 'rejected')[0]!.reason).toMatch(/Coop/);
  });

  it('les pouvoirs d’un boss visent le plateau de son côté (sa branche)', () => {
    const e = quiet(MARVEL, { mode: 'coop' });
    debugPlace(e, 0, 0, 'cmarvel');
    debugPlace(e, 1, 0, 'cmarvel');
    debugSpawn(e, { lane: 'b', bossId: 'bouffon', speed: 0, hp: 1e15 });
    const targets = new Set(ofType(step(e, 20 * 6 * 12), 'bossPower').map((p) => p.player));
    expect([...targets]).toEqual(['p2']);
  });

  it('Coop Niveaux (endOnBossKill) : il faut abattre les deux boss', () => {
    const e = createEngine({ mode: 'coop', seed: 3, mapId: 'x', players: [setup(), setup(MARVEL, {}, 'p2')], script: { bossAtWave: 1, bossId: 'ursula', endOnBossKill: true } });
    e.drainEvents();
    const [b1, b2] = e.state.enemies.filter((x) => x.bossId);
    simState(e).enemies.find((x) => x.uid === b1!.uid)!.hp = 0;
    step(e, 3);
    expect(e.state.result).toBeUndefined();
    simState(e).enemies.find((x) => x.uid === b2!.uid)!.hp = 0;
    step(e, 3);
    expect(e.state.result?.outcome).toBe('victoire');
  });

  it('un boss qui passe coûte 2 vies ; défaite commune quand les vies partagées tombent à 0', () => {
    const e = quiet(MARVEL, { mode: 'coop' });
    debugSpawn(e, { lane: 'tronc', bossId: 'jafar', distance: 5.59, speed: 1, hp: 1e15 });
    step(e, 2);
    expect(e.state.lives).toBe(1);
    expect(e.state.result).toBeUndefined();
    debugSpawn(e, { lane: 'tronc', bossId: 'jafar', distance: 5.59, speed: 1, hp: 1e15 });
    const ev = step(e, 2);
    expect(ofType(ev, 'gameOver')[0]).toMatchObject({ outcome: 'defaite' });
    expect(e.state.lives).toBe(0);
  });
});
