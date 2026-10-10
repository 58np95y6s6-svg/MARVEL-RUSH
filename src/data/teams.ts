// Bonus d'équipe (§4.6 du prompt, design/game-design.md).
// Une équipe est active si le deck contient au moins `params.minCount` de ses unités
// (toutes ses unités si `minCount` est absent). Les bonus s'appliquent aux unités de l'équipe,
// sauf `manaPerWave`, qui va au joueur. Avengers (5) remplace Avengers (3).
//
// Paramètres lus par le moteur :
//   damage            +x de dégâts (0.2 = +20 %)
//   attackSpeed       +x de vitesse d'attaque
//   critChance        chance de critique ×critMul sur chaque coup
//   cooldownReduction compétences à recharge plus rapide (0.25 = 25 %)
//   controlDuration   durée des contrôles (étourdir, arrêter, ralentir) +x
//   markSlow          les ennemis marqués par Falcon sont ralentis de x
//   chainIllusionChance chance que les coups de Thor appliquent l'illusion de Loki (recul 2 s)
//   manaPerWave, manaPerExtra  mana au début de chaque vague (+ par membre au-delà du minimum)
//   doubleAttackChance chance d'attaquer deux fois

import type { TeamBonusDef } from './types';

export const TEAM_LIST: TeamBonusDef[] = [
  {
    id: 'avengers3', name: 'Avengers (3)', units: ['ironman', 'thor', 'hulk'],
    description: '+20 % de dégâts pour les Avengers.', params: { damage: 0.2 },
  },
  {
    id: 'avengers5', name: 'Avengers (5)', units: ['ironman', 'thor', 'hulk', 'cap', 'widow'],
    description: '+35 % de dégâts et +10 % de vitesse d’attaque pour les Avengers.', params: { damage: 0.35, attackSpeed: 0.1 },
  },
  {
    id: 'asgard', name: 'Asgard', units: ['thor', 'loki'],
    description: 'Les coups de Mjolnir appliquent l’illusion de Loki (25 % de chance de faire reculer l’ennemi).', params: { chainIllusionChance: 0.25, illusionDuration: 2 },
  },
  {
    id: 'agents', name: 'Les Agents', units: ['widow', 'hawkeye', 'bucky'],
    description: '+30 % de chance de critique ×2 pour les Agents.', params: { critChance: 0.3, critMul: 2 },
  },
  {
    id: 'arcanes', name: 'Arcanes', units: ['strange', 'loki', 'shangchi'],
    description: 'Compétences rechargées 25 % plus vite.', params: { cooldownReduction: 0.25 },
  },
  {
    id: 'ailes', name: 'Les Ailes', units: ['falcon', 'cap', 'bucky'],
    description: 'Les cibles marquées par Falcon sont ralenties de 20 %.', params: { minCount: 2, markSlow: 0.2 },
  },
  {
    id: 'ocean', name: 'Océan', units: ['moana', 'maui', 'ariel', 'nemo'],
    description: 'Contrôles +50 % de durée.', params: { minCount: 3, controlDuration: 0.5 },
  },
  {
    id: 'princesses', name: 'Princesses', units: ['mulan', 'merida', 'tiana', 'rapunzel', 'pocahontas'],
    description: '+15 de mana par vague (+10 par princesse au-delà de 3).', params: { minCount: 3, manaPerWave: 15, manaPerExtra: 10 },
  },
  {
    id: 'pixar', name: 'Duos Pixar', units: ['buzzwoody', 'nemo', 'coco'],
    description: '20 % de chance de double attaque.', params: { doubleAttackChance: 0.2 },
  },
  {
    id: 'animaux', name: 'Animaux', units: ['foxhound', 'nickjudy', 'nemo'],
    description: '+15 % de vitesse d’attaque.', params: { attackSpeed: 0.15 },
  },

  // ───────────── Extension Transformers ─────────────
  {
    id: 'autobots', name: 'Autobots',
    units: ['optimus', 'bumblebee', 'ironhide', 'ratchet', 'jazz', 'arcee', 'wheeljack', 'hotrod', 'elita', 'bulkhead', 'sideswipe', 'prowl', 'mirage', 'ultramagnus'],
    description: '« Autobots, transformation ! » : +12 % de dégâts et +10 % de vitesse d’attaque pour les Autobots (4 ou plus).', params: { minCount: 4, damage: 0.12, attackSpeed: 0.1 },
  },
  {
    id: 'dinobots', name: 'Dinobots', units: ['grimlock', 'bulkhead', 'ironhide'],
    description: 'Moi Grimlock, eux gros bras : +25 % de dégâts pour les cogneurs (2 ou plus).', params: { minCount: 2, damage: 0.25 },
  },
  {
    id: 'aeriens', name: 'Aériens', units: ['hotrod', 'arcee', 'elita', 'jazz'],
    description: 'Sauts propulsés : +15 % de vitesse d’attaque et 10 % de chance d’attaquer deux fois (2 ou plus).', params: { minCount: 2, attackSpeed: 0.15, doubleAttackChance: 0.1 },
  },
  // Équipe inter-univers (Cyborg, de l'extension DC, la rejoindra : il suffit de l'ajouter à `units`).
  {
    id: 'machines', name: 'Les Machines', units: ['ironman', 'optimus'],
    description: 'Les plus belles machines de l’univers : +15 % de dégâts et compétences rechargées 15 % plus vite (2 ou plus).', params: { minCount: 2, damage: 0.15, cooldownReduction: 0.15 },
  },
];

export const TEAMS: Record<string, TeamBonusDef> = Object.fromEntries(TEAM_LIST.map((t) => [t.id, t]));

/** Équipes actives pour un deck (Avengers 5 remplace Avengers 3). */
export function activeTeams(deck: readonly string[]): TeamBonusDef[] {
  const active = TEAM_LIST.filter((t) => {
    const have = t.units.filter((u) => deck.includes(u)).length;
    return have >= (t.params.minCount ?? t.units.length);
  });
  if (active.some((t) => t.id === 'avengers5')) return active.filter((t) => t.id !== 'avengers3');
  return active;
}
