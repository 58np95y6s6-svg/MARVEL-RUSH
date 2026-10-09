// Registre des maps et des arènes de boss (§7 bis).

import type { BossId, UnitId } from '../data/types';
import type { MapDefX } from './kit';
import type { Universe } from './types';
import { toitsNewYork } from './toits-new-york';

/** Maps d'univers (12) puis variantes Disney (7), dans l'ordre de déblocage. */
export const MAPS: MapDefX[] = [toitsNewYork];

/** Arènes de boss, une par boss. */
export const ARENAS: MapDefX[] = [];

export const ALL_MAPS: MapDefX[] = [...MAPS, ...ARENAS];

const byId = new Map(ALL_MAPS.map((m) => [m.id, m]));

export const DEFAULT_MAP_ID = 'toits-new-york';

/** Map par identifiant ; repli sur la map de départ si l'id est inconnu. */
export function getMap(id: string): MapDefX {
  return byId.get(id) ?? byId.get(DEFAULT_MAP_ID)!;
}

export function hasMap(id: string): boolean {
  return byId.has(id);
}

/** Maps jouables d'un univers (sans les arènes). */
export function mapsForUniverse(u: Universe): MapDefX[] {
  return u === 'boss' ? ARENAS.slice() : MAPS.filter((m) => m.universe === u);
}

/** Identifiant de l'arène de chaque boss (à reprendre dans BossDef.arenaMapId). */
export const ARENA_OF_BOSS: Record<BossId, string> = {
  jafar: 'arene-jafar',
  cruella: 'arene-cruella',
  ursula: 'arene-ursula',
  malefique: 'arene-malefique',
  galactus: 'arene-galactus',
  bouffon: 'arene-bouffon',
  thanos: 'arene-thanos',
};

export function arenaForBoss(boss: BossId | string): MapDefX | null {
  const id = (ARENA_OF_BOSS as Record<string, string>)[boss];
  return (id && byId.get(id)) || null;
}

/**
 * Map choisie pour un deck en Solo : celle qui réunit le plus de héros du deck (univers majoritaire) ;
 * à égalité, la première dans l'ordre de déblocage. `unlocked` limite le choix aux maps débloquées.
 */
export function mapForDeck(deck: readonly UnitId[], unlocked?: readonly string[]): MapDefX {
  const pool = MAPS.filter((m) => !unlocked || unlocked.includes(m.id));
  const candidates = pool.length ? pool : [getMap(DEFAULT_MAP_ID)];
  let best = candidates[0]!, bestScore = -1;
  for (const m of candidates) {
    const score = deck.filter((u) => m.heroes.includes(u)).length;
    if (score > bestScore) { best = m; bestScore = score; }
  }
  if (bestScore > 0) return best;
  // Aucun héros associé : on prend la première map de l'univers majoritaire.
  const marvel = deck.filter((u) => MAPS.some((m) => m.universe === 'marvel' && m.heroes.includes(u))).length;
  const disney = deck.filter((u) => MAPS.some((m) => m.universe === 'disney' && m.heroes.includes(u))).length;
  const u: Universe = disney > marvel ? 'disney' : 'marvel';
  return candidates.find((m) => m.universe === u) ?? best;
}
