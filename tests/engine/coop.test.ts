import { describe, expect, it } from 'vitest';
import { createEngine, registerMaps } from '../../src/engine';
import { debugPlace, debugSpawn, simState } from '../../src/engine/debug';
import { GRID_SIZE } from '../../src/engine/types';
import { MARVEL, coop, ofType, quiet, setup, step } from './helpers';

describe('Coop : deux branches qui se rejoignent', () => {
  it('branches a, b et tronc ; les ennemis entrent par a et b, les boss par le tronc', () => {
    const e = coop();
    expect(e.state.lanes.map((l) => [l.id, l.length])).toEqual([['a', 18], ['b', 18], ['tronc', 14]]);
    const ev = step(e, 1);
    expect(ofType(ev, 'enemySpawn').map((s) => s.lane)).toEqual(['a', 'b']);
    const b = createEngine({ mode: 'coop', seed: 1, mapId: 'x', players: [setup(), setup(MARVEL, {}, 'p2')], script: { bossAtWave: 1, bossId: 'ursula' } });
    expect(ofType(b.drainEvents(), 'bossSpawn')[0]!.lane).toBe('tronc');
  });

  it('les longueurs viennent de la map (pathLengthCoop)', () => {
    registerMaps([{ id: 'coop-test', pathLength: 30, pathLengthCoop: { a: 15, b: 16, tronc: 12 } }]);
    const e = coop({ mapId: 'coop-test' });
    expect(e.state.lanes.map((l) => l.length)).toEqual([15, 16, 12]);
  });

  it('un ennemi en fin de branche rejoint le tronc, puis coûte une vie commune au château', () => {
    const e = quiet(MARVEL, { mode: 'coop' });
    const en = debugSpawn(e, { lane: 'b', distance: 17.95, speed: 2, hp: 1e9 });
    step(e, 1);
    expect(en.lane).toBe('tronc');
    expect(en.distance).toBeCloseTo(0.05);
    en.distance = 13.99;
    const ev = step(e, 1);
    expect(ofType(ev, 'lifeLost')[0]!.lives).toBe(2);
    expect(e.state.lives).toBe(2);
  });

  it('toutes les unités touchent tous les ennemis, sur les deux branches et le tronc', () => {
    const e = quiet(MARVEL, { mode: 'coop' });
    debugPlace(e, 0, 0, 'merida');
    debugPlace(e, 1, 0, 'merida');
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
    debugSpawn(e, { lane: 'a', distance: 3, hp: 10 });
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
    simState(e).waveTimeLeft = 0.01;
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

  it('les pouvoirs de boss visent un plateau au hasard', () => {
    const e = quiet(MARVEL, { mode: 'coop' });
    debugPlace(e, 0, 0, 'cmarvel');
    debugPlace(e, 1, 0, 'cmarvel');
    debugSpawn(e, { lane: 'tronc', bossId: 'bouffon', hp: 1e15 });
    const targets = new Set(ofType(step(e, 20 * 6 * 12), 'bossPower').map((p) => p.player));
    expect([...targets].sort()).toEqual(['p1', 'p2']);
  });

  it('défaite commune quand les vies partagées tombent à 0', () => {
    const e = quiet(MARVEL, { mode: 'coop' });
    debugSpawn(e, { lane: 'tronc', bossId: 'jafar', distance: 13.99, speed: 1, hp: 1e15 });
    const ev = step(e, 2);
    expect(ofType(ev, 'gameOver')[0]).toMatchObject({ outcome: 'defaite' });
    expect(e.state.lives).toBe(0);
  });
});
