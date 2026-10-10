// Retour de joueuse (octobre 2026) : 7 Thor (Inquisiteur, mode actif à 7) de rangs 4 à 6 n'enlevaient que
// 20 % des PV du boss de la vague 40 en Solo Infini. On vérifie que les dégâts de Thor s'appliquent comme
// prévu (rampe +15 % par coup jusqu'à +600 %, mode actif 0,6 s à 7 exemplaires) et que le boss de la
// vague 40 de la nouvelle courbe des modes infinis (docs/equilibrage.md §10) est battu par ce plateau.
import { describe, expect, it } from 'vitest';
import { BOSS_STATS } from '../../src/data/bosses';
import { waveHp } from '../../src/data/enemies';
import { UNITS } from '../../src/data/units';
import { createEngine } from '../../src/engine';
import { thorMode } from '../../src/engine/thorMode';
import { debugNoCrit, debugNoRange, debugPlace, debugQuiet, debugSpawn, simState } from '../../src/engine/debug';
import type { Engine, GameConfig } from '../../src/engine/types';

const LEVEL = 6;
const SLOTS = [0, 1, 2, 3, 4, 5, 6];

const CONFIG: GameConfig = {
  mode: 'solo', seed: 3, mapId: 'toits-new-york',
  players: [{ id: 'p1', deck: ['thor', 'cmarvel', 'falcon', 'hawkeye', 'widow'], levels: { thor: LEVEL }, talents: {} }],
};

function board(noRange: boolean): Engine {
  const e = createEngine(CONFIG);
  debugQuiet(e);
  debugNoCrit(e);
  if (noRange) debugNoRange(e);
  for (const s of SLOTS) debugPlace(e, 0, s, 'thor', 5);
  return e;
}

describe('Thor × 7 (rang 5) contre un boss', () => {
  it('mode actif à 7, rampe au plafond (+600 %) en moins de 6 s, DPS conforme à la fiche', () => {
    const e = board(true);
    const boss = debugSpawn(e, { hp: 1e12, distance: 3, speed: 0 });
    const grid = simState(e).players[0]!.grid;
    for (let i = 0; i < 20 * 6; i++) e.tick();
    for (const s of SLOTS) {
      expect(thorMode(e.state, CONFIG, 0, s)?.active).toBe(true);
      expect(grid[s]!.counters.ramp).toBeCloseTo(6);
    }
    const before = boss.hp;
    for (let i = 0; i < 20 * 5; i++) e.tick();
    const dps = (before - boss.hp) / 5;
    // Par Thor : dégâts du niveau × (1 + 600 %) × cadence (rang 5, mode actif 1 / 0,6 s), plus sa zone à 100 %
    // des dégâts de base si la cible est dans son propre rayon.
    const perHit = UNITS.thor.damage + 129 * (LEVEL - 1);
    const rate = 5 / 0.6;
    const main = SLOTS.length * perHit * 7 * rate;
    expect(dps).toBeGreaterThan(main * 0.95);
    expect(dps).toBeLessThan(main * (8 / 7) * 1.05);
  });

  it('chemin réel : le boss de la vague 40 (Jafar, PV ×25) est battu avant la porte', () => {
    const e = board(false);
    const hp = waveHp(40) * BOSS_STATS.hpMul;
    const boss = debugSpawn(e, { hp, distance: 0, speed: BOSS_STATS.speed, bossId: 'jafar' });
    const len = simState(e).lanes[0]!.length;
    let t = 0;
    while (boss.hp > 0 && boss.distance < len && t < 120) { e.tick(); e.drainEvents(); t += 0.05; }
    expect(boss.hp).toBeLessThanOrEqual(0);
    // Avec de la marge : moins des deux tiers du temps de traversée.
    expect(t).toBeLessThan((len / BOSS_STATS.speed) * 0.67);
  });
});
