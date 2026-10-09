// Simulateur d'équilibrage headless (agent Game design).
// Usage : npx vite-node scripts/simulate.ts -- <id1> <id2> <id3> <id4> <id5> <parties> [--coop] [--max <vague>] [--seed <n>] [--level <n>]
// Joue N parties en Solo Infini (ou Coop Infini à deux bots avec --coop) avec un bot simple :
// invoque dès que possible, fusionne goulûment (rangs bas d'abord), améliore quand le plateau est
// plein. Affiche la vague moyenne atteinte et sa distribution.

import { createEngine } from '../src/engine/index';
import type { GameConfig, PlayerId, PlayerState } from '../src/engine/types';
import type { UnitId } from '../src/data/types';
import { UNITS } from '../src/data/units';

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
const maxWave = Number(flag('--max') ?? 80);
const seed0 = Number(flag('--seed') ?? 1);
const level = Number(flag('--level') ?? 1);
const games = argv.length && /^\d+$/.test(argv[argv.length - 1]!) ? Number(argv.pop()) : 20;
const deck = (argv.length ? argv : ['spiderman', 'hawkeye', 'falcon', 'cmarvel', 'widow']) as UnitId[];
for (const id of deck) if (!UNITS[id]) throw new Error(`Unité inconnue : ${id}`);

const POWERUP_COSTS = [100, 200, 400, 700];

/** Une décision du bot par tick et par joueur. */
function decide(p: PlayerState): Parameters<ReturnType<typeof createEngine>['apply']>[0] | null {
  const empty = p.grid.some((g) => !g);
  if (empty && p.mana >= p.summonCost) return { type: 'summon', player: p.id };
  let best: [number, number, number] | null = null;
  for (let i = 0; i < p.grid.length; i++) {
    const a = p.grid[i];
    if (!a || a.rank >= 7) continue;
    for (let j = i + 1; j < p.grid.length; j++) {
      const b = p.grid[j];
      if (b && b.unit === a.unit && b.rank === a.rank && (!best || a.rank < best[2])) best = [i, j, a.rank];
    }
  }
  if (best && !empty) return { type: 'merge', player: p.id, from: best[0], to: best[1] };
  if (best && p.mana < p.summonCost) return { type: 'merge', player: p.id, from: best[0], to: best[1] };
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

function play(seed: number): number {
  const levels = Object.fromEntries(deck.map((u) => [u, level]));
  const players: GameConfig['players'] = [{ id: 'p1', deck, levels, talents: {} }];
  if (coop) players.push({ id: 'p2', deck, levels, talents: {} });
  const engine = createEngine({ mode: coop ? 'coop' : 'solo', seed, mapId: 'toits-new-york', players });
  while (!engine.state.result && engine.state.wave <= maxWave) {
    for (const p of engine.state.players) {
      const c = decide(p);
      if (c) engine.apply(c);
    }
    engine.tick();
    engine.drainEvents();
  }
  return engine.state.result?.wave ?? engine.state.wave;
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

console.log(`Deck : ${deck.join(', ')} · ${coop ? 'Coop' : 'Solo'} Infini · niveau ${level} · ${games} parties (graines ${seed0}..${seed0 + games - 1})`);
console.log(`Vague moyenne : ${avg.toFixed(2)} · médiane : ${median} · min : ${waves[0]} · max : ${waves[waves.length - 1]}${waves.some((w) => w > maxWave) ? ` (plafond ${maxWave})` : ''}`);
console.log('Distribution :');
const peak = Math.max(...hist.values());
for (const [w, n] of [...hist.entries()].sort((a, b) => a[0] - b[0])) {
  console.log(`  vague ${String(w).padStart(3)} : ${'█'.repeat(Math.max(1, Math.round((n / peak) * 30)))} ${n}`);
}
console.log(`Durée : ${(ms / 1000).toFixed(1)} s (${(ms / games).toFixed(0)} ms par partie)`);
