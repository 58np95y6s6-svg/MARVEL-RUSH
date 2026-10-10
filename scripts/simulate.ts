// Simulateur d'équilibrage headless (agent Game design).
// Usage : npx vite-node scripts/simulate.ts -- <id1> <id2> <id3> <id4> <id5> <parties> [--coop] [--casual] [--no-manaup] [--max <vague>] [--seed <n>] [--level <n>] [--campagne <c1-n3|c1|all>] [--attendu]
// --attendu (avec --campagne) : chaque chapitre est joué avec le deck, le niveau de collection et les
// paliers de talents attendus à ce stade (tableau EXPECTED, docs/campagne.md §2).
// --campagne : joue un niveau de campagne (ou tous ceux d'un chapitre, ou les 60) et affiche le taux de
// victoire et la part de chaque étoile (contraintes évaluées comme en jeu, src/campaign).
// --casual : joueur « occasionnel » (réagit une fois par seconde, ne fusionne que plateau plein et au hasard,
// sans copie ni booster, n'achète pas « Mana + », améliore tard), plus proche d'un humain débutant.
// Joue N parties en Solo Infini (ou Coop Infini à deux bots avec --coop) avec un bot simple :
// invoque dès que possible, fusionne goulûment (rangs bas d'abord ; à rang égal, la paire dont une
// unité couvre le moins de chemin, fusionnée vers la case la mieux placée : §4.1 « Portées
// d'attaque »), améliore quand le plateau est plein. Affiche la vague moyenne atteinte et sa distribution.

import { createEngine } from '../src/engine/index';
import type { GameConfig, PlayerId, PlayerState } from '../src/engine/types';
import type { UnitId } from '../src/data/types';
import { UNITS } from '../src/data/units';
import { boardGeometry, coveredSpans, unitRange } from '../src/engine/geometry';
import { dropAction } from '../src/engine/archetypes';
import { MANA_UPGRADE_COSTS, MANA_UPGRADE_MAX, POWERUP_COSTS } from '../src/engine/internal';
import type { LaneId } from '../src/engine/types';
import { getMap } from '../src/maps/index';
import { LEVELS, getLevel, levelConfig, type CampaignLevel } from '../src/campaign/levels';
import { evaluateStars } from '../src/campaign/progress';
import { createBattleTracker } from '../src/campaign/tracker';

const argv = process.argv.slice(2).filter((a) => a !== '--');
const flag = (name: string): string | undefined => {
  const i = argv.indexOf(name);
  if (i < 0) return undefined;
  const v = argv[i + 1];
  argv.splice(i, 2);
  return v;
};
const coop = argv.includes('--coop');
if (coop) argv.splice(argv.indexOf('--coop'), 1);
const expected = argv.includes('--attendu');
if (expected) argv.splice(argv.indexOf('--attendu'), 1);
const casual = argv.includes('--casual');
if (casual) argv.splice(argv.indexOf('--casual'), 1);
const noManaUp = argv.includes('--no-manaup');
if (noManaUp) argv.splice(argv.indexOf('--no-manaup'), 1);
let botRng = 1;
const botRand = () => ((botRng = (botRng * 1103515245 + 12345) >>> 0) / 2 ** 32);
const maxWave = Number(flag('--max') ?? 80);
const seed0 = Number(flag('--seed') ?? 1);
const level = Number(flag('--level') ?? 1);
const campaignArg = flag('--campagne');
const games = argv.length && /^\d+$/.test(argv[argv.length - 1]!) ? Number(argv.pop()) : 20;
const deck = (argv.length ? argv : ['spiderman', 'hawkeye', 'falcon', 'cmarvel', 'widow']) as UnitId[];
for (const id of deck) if (!UNITS[id]) throw new Error(`Unité inconnue : ${id}`);

const MAP_ID = 'toits-new-york';
const geo = boardGeometry(coop ? 'coop' : 'solo', getMap(MAP_ID).shape);
const coverCache = new Map<string, number>();
/** Part du chemin du joueur couverte par une unité posée sur `slot` (0..1 par branche). */
function coverage(player: number, slot: number, unit: UnitId): number {
  const range = unitRange(unit);
  if (!Number.isFinite(range)) return 2;
  const key = `${player}:${slot}:${range}`;
  let v = coverCache.get(key);
  if (v === undefined) {
    const lanes: LaneId[] = coop ? [player === 0 ? 'a' : 'b', 'tronc'] : ['a'];
    v = 0;
    for (const l of lanes) for (const [a, b] of coveredSpans(geo, player, l, slot, range, 120)) v += b - a;
    coverCache.set(key, v);
  }
  return v;
}

/** Une décision du bot par tick et par joueur. */
function decide(p: PlayerState, pi: number): Parameters<ReturnType<typeof createEngine>['apply']>[0] | null {
  const empty = p.grid.some((g) => !g);
  if (!casual) {
    // Achats « rentables » : quand une amélioration coûte moins que la prochaine invocation.
    const ml = p.manaLevel ?? 0;
    if (!noManaUp && ml < MANA_UPGRADE_MAX && MANA_UPGRADE_COSTS[ml]! <= p.summonCost && p.mana >= MANA_UPGRADE_COSTS[ml]!) {
      return { type: 'manaUpgrade', player: p.id };
    }
    const top = mostPresent(p);
    if (top) {
      const lvl = p.powerUps[top] ?? 1;
      if (lvl < 5 && POWERUP_COSTS[lvl - 1]! <= p.summonCost && p.mana >= POWERUP_COSTS[lvl - 1]!) return { type: 'powerup', player: p.id, unit: top };
    }
  }
  if (empty && p.mana >= p.summonCost) return { type: 'summon', player: p.id };
  if (casual) return decideCasual(p, empty);
  let best: [number, number, number, number] | null = null; // from, to, rang, couverture la plus faible
  for (let i = 0; i < p.grid.length; i++) {
    const a = p.grid[i];
    if (!a || a.rank >= 7) continue;
    for (let j = i + 1; j < p.grid.length; j++) {
      const b = p.grid[j];
      if (!b || b.unit !== a.unit || b.rank !== a.rank) continue;
      const ci = coverage(pi, i, a.unit), cj = coverage(pi, j, b.unit);
      const low = Math.min(ci, cj);
      if (!best || a.rank < best[2] || (a.rank === best[2] && low < best[3] - 1e-9)) {
        best = ci <= cj ? [i, j, a.rank, low] : [j, i, a.rank, low];
      }
    }
  }
  if (best && !empty) return { type: 'merge', player: p.id, from: best[0], to: best[1] };
  // (Ancienne règle « fusionne aussi quand le mana manque » retirée : elle vidait le plateau et rendait
  // le joueur automatique plus faible qu'un joueur occasionnel.)
  // Archétypes (docs/roadmap.md) : plateau plein et aucune fusion possible, un copieur copie l'alliée
  // la plus forte de son rang et un booster fait monter l'alliée la plus forte de son rang.
  if (!best && !empty) {
    let alt: [number, number, number] | null = null; // from, to, DPS de base de la cible
    for (let i = 0; i < p.grid.length; i++) {
      for (let j = 0; j < p.grid.length; j++) {
        const kind = i === j ? null : dropAction(p.grid[i], p.grid[j]);
        if (kind !== 'copy' && kind !== 'promote') continue;
        const t = UNITS[p.grid[j]!.unit];
        const dps = t.damage / t.attackInterval;
        if (!alt || dps > alt[2]) alt = [i, j, dps];
      }
    }
    if (alt) {
      const kind = dropAction(p.grid[alt[0]], p.grid[alt[1]])!;
      return { type: kind as 'copy' | 'promote', player: p.id, from: alt[0], to: alt[1] };
    }
  }
  // Rendement du mana (« Mana + ») d'abord, puis amélioration des héros.
  const ml = p.manaLevel ?? 0;
  if (!noManaUp && ml < MANA_UPGRADE_MAX) {
    const cost = MANA_UPGRADE_COSTS[ml]!;
    if (p.mana >= cost && (!empty || p.mana >= cost + p.summonCost)) return { type: 'manaUpgrade', player: p.id };
  }
  // Amélioration : l'unité la plus présente sur le plateau, si le mana le permet.
  const weight = new Map<UnitId, number>();
  for (const u of p.grid) if (u) weight.set(u.unit, (weight.get(u.unit) ?? 0) + u.rank);
  const order = p.deck.slice().sort((x, y) => (weight.get(y) ?? 0) - (weight.get(x) ?? 0));
  for (const u of order) {
    const lvl = p.powerUps[u] ?? 1;
    if (lvl >= 5) continue;
    const cost = POWERUP_COSTS[lvl - 1]!;
    if (p.mana >= cost && (!empty || p.mana >= cost + p.summonCost)) return { type: 'powerup', player: p.id, unit: u };
    break;
  }
  return null;
}

/** Héros le plus présent sur le plateau (somme des rangs). */
function mostPresent(p: PlayerState): UnitId | undefined {
  const weight = new Map<UnitId, number>();
  for (const u of p.grid) if (u) weight.set(u.unit, (weight.get(u.unit) ?? 0) + u.rank);
  return [...weight.entries()].sort((x, y) => y[1] - x[1])[0]?.[0];
}

type Cmd = Parameters<ReturnType<typeof createEngine>['apply']>[0];
/** Joueur occasionnel : fusion au hasard seulement plateau plein, amélioration tardive. */
function decideCasual(p: PlayerState, empty: boolean): Cmd | null {
  if (!empty) {
    const pairs: [number, number][] = [];
    for (let i = 0; i < p.grid.length; i++) for (let j = 0; j < p.grid.length; j++) {
      const a = p.grid[i], b = p.grid[j];
      if (i !== j && a && b && a.unit === b.unit && a.rank === b.rank && a.rank < 7) pairs.push([i, j]);
    }
    if (pairs.length) {
      const [from, to] = pairs[Math.floor(botRand() * pairs.length)]!;
      return { type: 'merge', player: p.id, from, to };
    }
  }
  const u = p.deck[Math.floor(botRand() * p.deck.length)]!;
  const lvl = p.powerUps[u] ?? 1;
  if (lvl < 5 && p.mana >= POWERUP_COSTS[lvl - 1]! + 100) return { type: 'powerup', player: p.id, unit: u };
  return null;
}

function play(seed: number): number {
  botRng = seed * 7919 + 17;
  const levels = Object.fromEntries(deck.map((u) => [u, level]));
  const players: GameConfig['players'] = [{ id: 'p1', deck, levels, talents: {} }];
  if (coop) players.push({ id: 'p2', deck, levels, talents: {} });
  const engine = createEngine({ mode: coop ? 'coop' : 'solo', seed, mapId: MAP_ID, players });
  while (!engine.state.result && engine.state.wave <= maxWave) {
    for (const [pi, p] of engine.state.players.entries()) {
      if (casual && engine.state.tick % 20 !== 0) break;
      const c = decide(p, pi);
      if (c) engine.apply(c);
    }
    engine.tick();
    engine.drainEvents();
  }
  const st = engine.state as typeof engine.state & { currentBoss?: string | null };
  if (process.env.SIM_TRACE) console.log(`  graine ${seed} : vague ${engine.state.wave}, boss ${st.currentBoss ?? '—'}`);
  return engine.state.result?.wave ?? engine.state.wave;
}

/** Collection attendue par chapitre (docs/campagne.md §2) : deck, niveau de collection, paliers de talents (option a). */
const EXPECTED: Record<number, { deck: UnitId[]; level: number; tiers: number; stars?: number }> = {
  1: { deck: ['spiderman', 'hawkeye', 'falcon', 'cmarvel', 'widow'], level: 1, tiers: 0 },   // deck de départ
  2: { deck: ['spiderman', 'hawkeye', 'cmarvel', 'widow', 'bucky'], level: 2, tiers: 0 },    // + 1 Épique
  3: { deck: ['thor', 'spiderman', 'hawkeye', 'cmarvel', 'bucky'], level: 4, tiers: 0 },     // + Thor (ch. 2)
  4: { deck: ['thor', 'ironman', 'spiderman', 'bucky', 'widow'], level: 5, tiers: 1 },       // 2 Légendaires, palier 1
  5: { deck: ['ironman', 'thor', 'hulk', 'cap', 'widow'], level: 6, tiers: 2 },              // équipe complète, palier 2
  6: { deck: ['ironman', 'thor', 'hulk', 'cap', 'widow'], level: 8, tiers: 3 },              // deck « méta », palier 3
  // Extension Pixar (chapitres 13 à 15, après le dernier chapitre installé) : premiers héros Pixar, éveils.
  13: { deck: ['ironman', 'thor', 'hulk', 'cap', 'walleeve'], level: 10, tiers: 3, stars: 2 },          // méta + 1 Légendaire Pixar, ★2
  14: { deck: ['ironman', 'thor', 'mrincredible', 'cap', 'mcqueen'], level: 10, tiers: 3, stars: 4 },   // + M. Indestructible (13-10), McQueen
  15: { deck: ['ironman', 'thor', 'mrincredible', 'walleeve', 'cap'], level: 10, tiers: 3, stars: 6 },  // + WALL-E & EVE (14-10), ★6
};

if (campaignArg) {
  const targets: CampaignLevel[] = campaignArg === 'all' ? LEVELS
    : /^c\d+$/.test(campaignArg) ? LEVELS.filter((l) => `c${l.chapter}` === campaignArg)
      : [getLevel(campaignArg)].filter((l): l is CampaignLevel => !!l);
  if (!targets.length) throw new Error(`Niveau de campagne inconnu : ${campaignArg}`);
  console.log(`Campagne · ${expected ? 'collection attendue par chapitre' : `deck ${deck.join(', ')} · niveau de collection ${level}`} · ${games} parties par niveau${casual ? ' · joueur occasionnel' : ''}`);
  const byChapter = new Map<number, number[]>();
  for (const lv of targets) {
    const exp = expected ? EXPECTED[lv.chapter]! : null;
    const d = exp ? exp.deck : deck;
    const lvlN = exp ? exp.level : level;
    const talents = exp && exp.tiers ? Object.fromEntries(d.map((u) => [u, Array.from({ length: exp.tiers }, () => 'a' as const)])) : {};
    let wins = 0, waveSum = 0;
    const st = [0, 0, 0];
    for (let g = 0; g < games; g++) {
      const seed = seed0 + g;
      botRng = seed * 7919 + 17;
      const cfg = levelConfig(lv, d, null, seed);
      cfg.players[0]!.levels = Object.fromEntries(d.map((u) => [u, lvlN]));
      cfg.players[0]!.talents = talents;
      if (exp?.stars) cfg.players[0]!.awakening = Object.fromEntries(d.map((u) => [u, exp.stars!]));
      const engine = createEngine(cfg);
      const tr = createBattleTracker();
      while (!engine.state.result) {
        const p = engine.state.players[0]!;
        if (!casual || engine.state.tick % 20 === 0) { const c = decide(p, 0); if (c) engine.apply(c); }
        tr.before(engine.state);
        engine.tick();
        tr.after(engine.state, engine.drainEvents());
      }
      const res = engine.state.result!;
      const stars = evaluateStars(lv, { ...tr.stats(engine.state), won: res.outcome === 'victoire', wave: res.wave, livesLeft: engine.state.lives, deck: d, seed });
      waveSum += res.wave;
      if (stars[0]) wins++;
      stars.forEach((x, i) => { if (x) st[i]!++; });
    }
    const pc = (n: number) => `${String(Math.round((100 * n) / games)).padStart(3)} %`;
    (byChapter.get(lv.chapter) ?? byChapter.set(lv.chapter, []).get(lv.chapter)!).push(wins / games);
    console.log(`${lv.id.padEnd(7)} ${String(lv.waves).padStart(2)} vagues PV×${lv.hpMul.toFixed(2)} eff×${lv.countMul.toFixed(2)} boss×${lv.bossHpMul.toFixed(2)} g${lv.growth} · vague moy. ${(waveSum / games).toFixed(1)} · victoire ${pc(wins)} · ★★ ${pc(st[1]!)} · ★★★ ${pc(st[2]!)}${wins ? ` (${Math.round((100 * st[2]!) / wins)} % des victoires)` : ''}`);
  }
  for (const [c, rates] of byChapter) {
    const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
    console.log(`Chapitre ${c}${expected ? ` (niveau ${EXPECTED[c]!.level}, ${EXPECTED[c]!.tiers} palier(s))` : ''} : victoire moyenne ${Math.round(100 * avg)} % · pire niveau ${Math.round(100 * Math.min(...rates))} %`);
  }
  process.exit(0);
}

const t0 = performance.now();
const waves: number[] = [];
for (let g = 0; g < games; g++) {
  const w = play(seed0 + g);
  waves.push(w);
}
const ms = performance.now() - t0;
waves.sort((a, b) => a - b);
const avg = waves.reduce((s, w) => s + w, 0) / waves.length;
const median = waves[Math.floor(waves.length / 2)]!;
const hist = new Map<number, number>();
for (const w of waves) hist.set(w, (hist.get(w) ?? 0) + 1);

console.log(`Deck : ${deck.join(', ')} · ${coop ? 'Coop' : 'Solo'} Infini${casual ? ' · joueur occasionnel' : ''} · niveau ${level} · ${games} parties (graines ${seed0}..${seed0 + games - 1})`);
const pass = (w: number) => Math.round((100 * waves.filter((x) => x > w).length) / waves.length);
console.log(`Passent la vague 5 (lieutenant) : ${pass(5)} % · la vague 10 (gros boss) : ${pass(10)} % · la vague 15 : ${pass(15)} %`);
console.log(`Vague moyenne : ${avg.toFixed(2)} · médiane : ${median} · min : ${waves[0]} · max : ${waves[waves.length - 1]}${waves.some((w) => w > maxWave) ? ` (plafond ${maxWave})` : ''}`);
console.log('Distribution :');
const peak = Math.max(...hist.values());
for (const [w, n] of [...hist.entries()].sort((a, b) => a[0] - b[0])) {
  console.log(`  vague ${String(w).padStart(3)} : ${'█'.repeat(Math.max(1, Math.round((n / peak) * 30)))} ${n}`);
}
console.log(`Durée : ${(ms / 1000).toFixed(1)} s (${(ms / games).toFixed(0)} ms par partie)`);
