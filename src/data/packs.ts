// Packs de tirage (§6.2 du prompt).

import type { Pack, PackDef } from './types';

export const PACK_LIST: PackDef[] = [
  {
    id: 'marvel', name: 'Pack Marvel', price1: 100, price10: 900,
    rates: { rare: 0.72, epique: 0.24, legendaire: 0.04 }, pityLegendary: 40,
  },
  {
    id: 'disney', name: 'Pack Disney', price1: 100, price10: 900,
    rates: { rare: 0.72, epique: 0.24, legendaire: 0.04 }, pityLegendary: 40,
  },
];

export const PACKS: Record<Pack, PackDef> = Object.fromEntries(PACK_LIST.map((p) => [p.id, p])) as Record<Pack, PackDef>;

/** Un lot de 10 contient au moins une Épique (ou mieux). */
export const TEN_PULL_MIN_RARITY = 'epique' as const;
