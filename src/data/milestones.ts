// Paliers des modes infinis (Solo Infini et Coop Infini, §5.1 et §5.2 du prompt, extension DC).
// Un palier est atteint quand sa vague est terminée (boss compris). Le moteur émet l'événement
// `milestone` à chaque palier de cette liste et tous les `WAVE_RULES.milestoneEvery` vagues ;
// les récompenses sont données par la méta (une fois par jour et par mode, docs/equilibrage.md §5).

export type ChestId = 'bronze' | 'argent' | 'or' | 'heroique' | 'legendaire' | 'cosmique';

export interface InfiniteMilestoneDef {
  wave: number;
  chest: ChestId;
  name: string;            // nom affiché du coffre
  shards: number;          // éclats
  scrolls: number;         // parchemins de talent
  cards: number;           // cartes d'unités possédées
  crystals: number;        // cristaux d'éveil ✦ (§6.6)
  /** Garanties : 'epique' (1 carte Épique), 'legendaire' (1 Légendaire), 'skin' (1 skin au hasard). */
  guaranteed?: 'epique' | 'legendaire' | 'skin';
  /** Cadre de profil débloqué. */
  frame?: string;
}

export const INFINITE_MILESTONES: InfiniteMilestoneDef[] = [
  { wave: 10, chest: 'bronze', name: 'Coffre bronze', shards: 150, scrolls: 0, cards: 10, crystals: 5 },
  { wave: 20, chest: 'argent', name: 'Coffre argent', shards: 300, scrolls: 1, cards: 20, crystals: 10 },
  { wave: 30, chest: 'or', name: 'Coffre or', shards: 500, scrolls: 2, cards: 0, crystals: 20, guaranteed: 'epique' },
  { wave: 40, chest: 'heroique', name: 'Coffre héroïque', shards: 800, scrolls: 3, cards: 0, crystals: 30, guaranteed: 'skin' },
  { wave: 50, chest: 'legendaire', name: 'Coffre légendaire', shards: 1500, scrolls: 0, cards: 0, crystals: 60, guaranteed: 'legendaire', frame: 'Vainqueur de Thanos' },
  // Extension DC : paliers prolongés jusqu'à Darkseid (vague 100).
  { wave: 75, chest: 'cosmique', name: 'Coffre cosmique', shards: 2000, scrolls: 4, cards: 30, crystals: 80, guaranteed: 'legendaire' },
  { wave: 100, chest: 'cosmique', name: 'Coffre cosmique suprême', shards: 3000, scrolls: 5, cards: 40, crystals: 150, guaranteed: 'legendaire', frame: 'Vainqueur de Darkseid' },
];

/** Au-delà de la vague 50, tous les 10 (hors paliers ci-dessus) : +300 éclats, 1 parchemin, +10 ✦. */
export const MILESTONE_EVERY_10 = { shards: 300, scrolls: 1, crystals: 10 };

/** Paliers qui ne tombent pas sur un multiple de 10 (le moteur émet aussi `milestone` pour eux). */
export const EXTRA_MILESTONE_WAVES: number[] = INFINITE_MILESTONES.map((m) => m.wave).filter((w) => w % 10 !== 0);

/** Palier défini pour une vague, s'il existe. */
export function milestoneAt(wave: number): InfiniteMilestoneDef | undefined {
  return INFINITE_MILESTONES.find((m) => m.wave === wave);
}
