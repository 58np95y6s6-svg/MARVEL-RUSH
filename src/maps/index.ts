// Registre des maps et des arènes de boss (§7 bis).

import type { BossId, UnitId } from '../data/types';
import type { MapDefX } from './kit';
import type { Universe } from './types';
import { toitsNewYork } from './toits-new-york';
import { atelierStark } from './atelier-stark';
import { asgardBifrost } from './asgard-bifrost';
import { sanctumSanctorum } from './sanctum-sanctorum';
import { baseAvengers } from './base-avengers';
import { templeDixAnneaux } from './temple-dix-anneaux';
import { ileMotunui } from './ile-motunui';
import { palaisImperial } from './palais-imperial';
import { royaumeDesMorts } from './royaume-des-morts';
import { zootopie } from './zootopie';
import { chambreAndy } from './chambre-andy';
import { sugarRush } from './sugar-rush';
import { foretPocahontas } from './foret-pocahontas';
import { highlandsRebelle } from './highlands-rebelle';
import { atlantica } from './atlantica';
import { bayou } from './bayou';
import { recifNemo } from './recif-nemo';
import { tourRaiponce } from './tour-raiponce';
import { foretRoxRouky } from './foret-rox-rouky';
import { areneJafar } from './arene-jafar';
import { areneCruella } from './arene-cruella';
import { areneUrsula } from './arene-ursula';
import { areneMalefique } from './arene-malefique';
import { areneGalactus } from './arene-galactus';
import { areneBouffon } from './arene-bouffon';
import { areneThanos } from './arene-thanos';
import { gothamNuit } from './gotham-nuit';
import { metropolis } from './metropolis';
import { themyscira } from './themyscira';
import { atlantis } from './atlantis';
import { batcave } from './batcave';
import { oa } from './oa';
import { areneJoker } from './arene-joker';
import { areneLuthor } from './arene-luthor';
import { areneBane } from './arene-bane';
import { areneSinestro } from './arene-sinestro';
import { areneBlackadam } from './arene-blackadam';
import { areneDarkseid } from './arene-darkseid';
import { cybertron } from './cybertron';
import { baseAutobot } from './base-autobot';
import { missionCity } from './mission-city';
import { areneBlitzwing, areneDevastator, areneMegatron, areneShockwave, areneSoundwave, areneStarscream, areneUnicron } from './arenes-transformers';

/** Maps de l'extension DC (débloquées par les chapitres 7 à 9). */
export const DC_MAPS: MapDefX[] = [gothamNuit, batcave, metropolis, themyscira, atlantis, oa];

/** Maps de l'extension Transformers (débloquées par les chapitres 10 à 12). */
export const TF_MAPS: MapDefX[] = [cybertron, baseAutobot, missionCity];

/** Maps d'univers (12), variantes Disney (7), maps DC (6) puis maps Transformers (3), dans l'ordre de déblocage. */
export const MAPS: MapDefX[] = [
  toitsNewYork, atelierStark, asgardBifrost, sanctumSanctorum, baseAvengers, templeDixAnneaux,
  ileMotunui, palaisImperial, royaumeDesMorts, zootopie, chambreAndy, sugarRush,
  foretPocahontas, highlandsRebelle, atlantica, bayou, recifNemo, tourRaiponce, foretRoxRouky,
  ...DC_MAPS,
  ...TF_MAPS,
];

/** Arènes des boss DC (Darkseid en dernier : boss final de l'extension). */
export const DC_ARENAS: MapDefX[] = [areneJoker, areneLuthor, areneBane, areneSinestro, areneBlackadam, areneDarkseid];

/** Arènes des Decepticons (Unicron en dernier : boss cosmique des modes infinis). */
export const TF_ARENAS: MapDefX[] = [areneStarscream, areneSoundwave, areneShockwave, areneDevastator, areneBlitzwing, areneMegatron, areneUnicron];

/** Arènes de boss, une par boss. */
export const ARENAS: MapDefX[] = [areneJafar, areneCruella, areneUrsula, areneMalefique, areneGalactus, areneBouffon, areneThanos, ...DC_ARENAS, ...TF_ARENAS];

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
  joker: 'arene-joker',
  luthor: 'arene-luthor',
  bane: 'arene-bane',
  sinestro: 'arene-sinestro',
  blackadam: 'arene-blackadam',
  darkseid: 'arene-darkseid',
  starscream: 'arene-starscream',
  soundwave: 'arene-soundwave',
  shockwave: 'arene-shockwave',
  devastator: 'arene-devastator',
  blitzwing: 'arene-blitzwing',
  megatron: 'arene-megatron',
  unicron: 'arene-unicron',
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
  // Aucun héros associé à une map débloquée : on prend la première map débloquée de l'univers majoritaire
  // (à égalité, l'ordre marvel, disney, dc, transformers).
  const count = (u: Universe) => deck.filter((id) => MAPS.some((m) => m.universe === u && m.heroes.includes(id))).length;
  let u: Universe = 'marvel';
  for (const v of ['disney', 'dc', 'transformers'] as const) if (count(v) > count(u)) u = v;
  return candidates.find((m) => m.universe === u) ?? best;
}
