// Packs de tirage (§6.2 du prompt).

import type { Pack, PackDef } from './types';

export const PACK_LIST: PackDef[] = [
  {
    id: 'marvel', name: 'Pack Marvel', price1: 100, price10: 900,
    rates: { rare: 0.72, epique: 0.24, legendaire: 0.04 }, pityLegendary: 30,
  },
  {
    id: 'disney', name: 'Pack Disney', price1: 100, price10: 900,
    rates: { rare: 0.72, epique: 0.24, legendaire: 0.04 }, pityLegendary: 30,
  },
  // Extension DC Comics : mêmes prix, taux et garantie (compteur de garantie propre au pack).
  {
    id: 'dc', name: 'Pack DC', price1: 100, price10: 900,
    rates: { rare: 0.72, epique: 0.24, legendaire: 0.04 }, pityLegendary: 30,
  },
  // Extension Transformers : mêmes prix, taux et garantie (compteur de garantie propre au pack).
  {
    id: 'transformers', name: 'Pack Transformers', price1: 100, price10: 900,
    rates: { rare: 0.72, epique: 0.24, legendaire: 0.04 }, pityLegendary: 30,
  },
];

export const PACKS: Record<Pack, PackDef> = Object.fromEntries(PACK_LIST.map((p) => [p.id, p])) as Record<Pack, PackDef>;

/** Taux par carte d'un lot de 10 (boostés ; un tirage à l'unité garde `rates`, 72 / 24 / 4). */
export const TEN_PULL_RATES = { rare: 0.6, epique: 0.3, legendaire: 0.1 } as const;

/** Un lot de 10 contient au moins une Épique (ou mieux). */
export const TEN_PULL_MIN_RARITY = 'epique' as const;
