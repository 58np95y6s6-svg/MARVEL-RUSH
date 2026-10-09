// Données des 28 unités (§4.5 du prompt, design/game-design.md).
// Valeurs de départ, à équilibrer avec scripts/simulate.ts. Tout est lu par le moteur.
//
// Convention des paramètres de compétence (`ability.params`) :
// - `abilityCooldown` : recharge (s) de la compétence principale à déclenchement périodique ;
// - les noms reprennent ceux visés par les talents (src/data/talents.ts) : un talent `xAdd`
//   ajoute à `x`, un talent `xMul` multiplie `x`, une clé sans suffixe est une valeur directe ;
// - fractions : 0.1 = 10 %, durées en secondes, distances en cases du chemin.

import type { UnitDef, UnitId } from './types';

export const UNIT_LIST: UnitDef[] = [
  // ───────────── Pack Marvel ─────────────
  {
    id: 'ironman', name: 'Iron Man', pack: 'marvel', rarity: 'legendaire', role: 'Dégâts',
    targeting: 'premier', damage: 30, attackInterval: 0.8,
    ability: {
      name: 'Uni-Beam',
      description: 'Toutes les 10 s, un laser inflige 200 % des dégâts à tous les ennemis d’une ligne du chemin.',
      params: { abilityCooldown: 10, beamDamage: 2 },
    },
  },
  {
    id: 'spiderman', name: 'Spider-Man', pack: 'marvel', rarity: 'epique', role: 'Contrôle',
    targeting: 'premier', damage: 10, attackInterval: 0.5,
    ability: {
      name: 'Toile collante',
      description: 'Chaque coup ralentit de 10 %, cumulable 3 fois ; à 3 cumuls, l’ennemi est immobilisé 1 s.',
      params: { slowPerStack: 0.1, maxStacks: 3, slowDuration: 2, rootDuration: 1 },
    },
  },
  {
    id: 'hulk', name: 'Hulk', pack: 'marvel', rarity: 'legendaire', role: 'Dégâts de zone',
    targeting: 'premier', damage: 60, attackInterval: 1.6,
    ability: {
      name: 'Hulk Smash',
      description: 'Éclaboussure de 40 % autour de la cible. Rage : +5 % de dégâts par coup (max +50 %). Tous les 8 coups, Smash étourdit les ennemis proches 1 s.',
      params: { splash: 0.4, splashRadius: 1.5, ragePerHit: 0.05, rageMax: 0.5, smashEveryHits: 8, smashStun: 1, smashRadius: 2 },
    },
  },
  {
    id: 'thor', name: 'Thor', pack: 'marvel', rarity: 'legendaire', role: 'Dégâts en chaîne',
    targeting: 'aleatoire', damage: 25, attackInterval: 1.0,
    ability: {
      name: 'Éclair en chaîne',
      description: 'L’éclair touche 3 ennemis, +1 rebond tous les 2 rangs (max 5), −20 % de dégâts par rebond.',
      params: { chain: 3, chainPerRanks: 2, chainMax: 5, falloff: 0.2 },
    },
  },
  {
    id: 'strange', name: 'Doctor Strange', pack: 'marvel', rarity: 'epique', role: 'Soutien / contrôle',
    targeting: 'premier', damage: 15, attackInterval: 1.0,
    ability: {
      name: 'Portail',
      description: 'Toutes les 12 s, renvoie l’ennemi de tête au début du chemin (sauf boss).',
      params: { abilityCooldown: 12, portalTargets: 1 },
    },
  },
  {
    id: 'venom', name: 'Venom', pack: 'marvel', rarity: 'epique', role: 'Exécution',
    targeting: 'premier', damage: 35, attackInterval: 1.0,
    ability: {
      name: 'Dévorer',
      description: 'Exécute un ennemi sous 15 % de PV (sauf boss). +2 % de dégâts par élimination (max +40 %).',
      params: { executeThreshold: 0.15, killStack: 0.02, killStackMax: 0.4 },
    },
  },
  {
    id: 'cmarvel', name: 'Captain Marvel', pack: 'marvel', rarity: 'rare', role: 'Dégâts',
    targeting: 'fort', damage: 25, attackInterval: 0.9,
    ability: {
      name: 'Mode binaire',
      description: 'Après 10 attaques, passe en mode binaire : dégâts ×2 pendant 5 s.',
      params: { chargeAttacks: 10, binaryMul: 2, binaryDuration: 5 },
    },
  },
  {
    id: 'cap', name: 'Captain America', pack: 'marvel', rarity: 'legendaire', role: 'Soutien / rebond',
    targeting: 'premier', damage: 20, attackInterval: 1.0,
    ability: {
      name: 'Leader',
      description: 'Le bouclier rebondit sur 3 ennemis. Aura : +15 % de vitesse d’attaque aux unités adjacentes.',
      params: { bounces: 3, auraAttackSpeed: 0.15 },
    },
  },
  {
    id: 'loki', name: 'Loki', pack: 'marvel', rarity: 'epique', role: 'Trickster',
    targeting: 'aleatoire', damage: 18, attackInterval: 0.8,
    ability: {
      name: 'Illusion',
      description: 'Toutes les 15 s, se transforme 10 s en une autre unité du deck (même rang). 10 % de chance de faire reculer l’ennemi touché pendant 2 s.',
      params: { abilityCooldown: 15, transformDuration: 10, knockbackChance: 0.1, knockbackDuration: 2 },
    },
  },
  {
    id: 'bucky', name: 'Soldat de l’hiver', pack: 'marvel', rarity: 'epique', role: 'Critique',
    targeting: 'fort', damage: 30, attackInterval: 1.2,
    ability: {
      name: 'Bras bionique',
      description: 'Une attaque sur 4 est un critique ×3 qui étourdit 0,5 s.',
      params: { critEvery: 4, critMul: 3, critStun: 0.5 },
    },
  },
  {
    id: 'hawkeye', name: 'Œil de faucon', pack: 'marvel', rarity: 'rare', role: 'Polyvalent',
    targeting: 'premier', damage: 18, attackInterval: 0.7,
    ability: {
      name: 'Flèches spéciales',
      description: 'Alterne les flèches : explosive (éclaboussure 50 %), glace (ralentit de 25 % pendant 2 s), électrique (chaîne sur 2 ennemis).',
      params: { explosiveSplash: 0.5, splashRadius: 1.5, iceSlow: 0.25, iceDuration: 2, chain: 2 },
    },
  },
  {
    id: 'falcon', name: 'Falcon', pack: 'marvel', rarity: 'rare', role: 'Ciblage',
    targeting: 'fort', damage: 15, attackInterval: 0.6,
    ability: {
      name: 'Drone Redwing',
      description: 'Toutes les 6 s, Redwing marque l’ennemi le plus fort : +25 % de dégâts subis pendant 4 s.',
      params: { abilityCooldown: 6, markBonus: 0.25, markDuration: 4, markTargets: 1 },
    },
  },
  {
    id: 'widow', name: 'Black Widow', pack: 'marvel', rarity: 'epique', role: 'Anti-boss',
    targeting: 'premier', damage: 14, attackInterval: 0.5,
    ability: {
      name: 'Morsure de la veuve',
      description: 'Un coup sur 5 paralyse 1 s. Dégâts ×2 contre les boss.',
      params: { paralyzeEvery: 5, paralyzeDuration: 1, bossMul: 2 },
    },
  },
  {
    id: 'shangchi', name: 'Shang-Chi', pack: 'marvel', rarity: 'epique', role: 'Combo',
    targeting: 'aleatoire', damage: 12, attackInterval: 0.4,
    ability: {
      name: 'Dix Anneaux',
      description: 'Tous les 10 coups, 10 anneaux frappent 10 ennemis aléatoires à 100 %.',
      params: { ringsEveryHits: 10, ringCount: 10, ringDamage: 1 },
    },
  },

  // ───────────── Pack Disney ─────────────
  {
    id: 'moana', name: 'Vaïana & Pua', pack: 'disney', rarity: 'epique', role: 'Contrôle',
    targeting: 'premier', damage: 15, attackInterval: 1.0,
    ability: {
      name: 'Appel de l’océan',
      description: 'Toutes les 10 s, une vague repousse de 1,5 case les ennemis de tête (sauf boss).',
      params: { abilityCooldown: 10, push: 1.5, pushTargets: 3 },
    },
  },
  {
    id: 'maui', name: 'Maui', pack: 'disney', rarity: 'legendaire', role: 'Dégâts / transformation',
    targeting: 'premier', damage: 40, attackInterval: 1.2,
    ability: {
      name: 'Métamorphose',
      description: 'Alterne toutes les 8 s : faucon (cadence ×2, dégâts ×0,5) ou requin (dégâts ×2,5 avec éclaboussure).',
      params: { abilityCooldown: 8, sharkDuration: 8, hawkSpeedMul: 2, hawkMul: 0.5, sharkMul: 2.5, sharkSplash: 0.5, splashRadius: 1.5 },
    },
  },
  {
    id: 'pocahontas', name: 'Pocahontas & Meeko', pack: 'disney', rarity: 'rare', role: 'Soutien',
    targeting: 'aleatoire', damage: 10, attackInterval: 0.8,
    ability: {
      name: 'Couleurs du vent',
      description: '+10 % de vitesse d’attaque aux unités adjacentes (+5 % par rang). Meeko : 5 % de chance de +5 de mana par élimination.',
      params: { auraAttackSpeed: 0.1, auraPerRank: 0.05, meekoChance: 0.05, meekoMana: 5 },
    },
  },
  {
    id: 'mulan', name: 'Mulan & Mushu', pack: 'disney', rarity: 'legendaire', role: 'Dégâts / brûlure',
    targeting: 'premier', damage: 30, attackInterval: 1.0,
    ability: {
      name: 'Souffle de Mushu',
      description: 'Brûlure : 20 % des dégâts par seconde pendant 3 s. Une fois par vague, Avalanche : 300 % des dégâts à tous les ennemis.',
      params: { burnPerSecond: 0.2, burnDuration: 3, avalancheDamage: 3, avalancheUses: 1, avalancheMinEnemies: 8 },
    },
  },
  {
    id: 'merida', name: 'Rebelle', pack: 'disney', rarity: 'rare', role: 'Précision',
    targeting: 'premier', damage: 22, attackInterval: 0.9,
    ability: {
      name: 'Tir parfait',
      description: '100 % de critiques ×2 sur l’ennemi le plus avancé.',
      params: { critMul: 2 },
    },
  },
  {
    id: 'ariel', name: 'Ariel & Sébastien', pack: 'disney', rarity: 'epique', role: 'Contrôle',
    targeting: 'premier', damage: 10, attackInterval: 0.9,
    ability: {
      name: 'Chant de sirène',
      description: 'Toutes les 8 s, le chant arrête 3 ennemis pendant 1,5 s. Sébastien : saignement de 5 % des PV par seconde (réduit sur les boss).',
      params: { abilityCooldown: 8, songTargets: 3, songDuration: 1.5, bleed: 0.05, bleedDuration: 2, bleedBossFactor: 0.1 },
    },
  },
  {
    id: 'foxhound', name: 'Rox & Rouky', pack: 'disney', rarity: 'rare', role: 'Duo',
    targeting: 'premier', damage: 14, attackInterval: 0.6,
    ability: {
      name: 'Meilleurs amis',
      description: 'Double attaque ; le second coup fait +50 % si le premier a touché la même cible.',
      params: { hits: 2, secondHitBonus: 0.5 },
    },
  },
  {
    id: 'tiana', name: 'Tiana & Naveen', pack: 'disney', rarity: 'rare', role: 'Économie',
    targeting: 'aleatoire', damage: 8, attackInterval: 1.0,
    ability: {
      name: 'Restaurant',
      description: '+10 de mana au début de chaque vague (+5 par rang). Toutes les 12 s, la langue tire l’ennemi de tête 1 case en arrière.',
      params: { waveMana: 10, manaPerRank: 5, abilityCooldown: 12, pull: 1 },
    },
  },
  {
    id: 'nemo', name: 'Nemo & Dory', pack: 'disney', rarity: 'rare', role: 'Aléatoire',
    targeting: 'aleatoire', damage: 14, attackInterval: 0.7,
    ability: {
      name: 'Mémoire de poisson',
      description: 'Effet aléatoire à chaque tir : ralentissement, dégâts ×2, poison, ou +20 % de cadence à une unité alliée au hasard.',
      params: { slow: 0.2, slowDuration: 2, doubleDamageMul: 2, poison: 0.3, poisonDuration: 3, allyHaste: 0.2, allyHasteDuration: 3, effectsPerShot: 1 },
    },
  },
  {
    id: 'coco', name: 'Coco (Miguel)', pack: 'disney', rarity: 'epique', role: 'Soutien',
    targeting: 'aleatoire', damage: 10, attackInterval: 1.0,
    ability: {
      name: 'Remember Me',
      description: 'Une fois par vague, restaure une unité détruite ou rétrogradée par un boss. +5 % de dégâts aux unités adjacentes.',
      params: { restoreUses: 1, auraDamage: 0.05 },
    },
  },
  {
    id: 'nickjudy', name: 'Nick & Judy', pack: 'disney', rarity: 'epique', role: 'Contrôle / malus',
    targeting: 'premier', damage: 16, attackInterval: 0.8,
    ability: {
      name: 'Arrestation',
      description: 'Toutes les 6 s, Judy arrête l’ennemi le plus fort (sauf boss) pendant 2 s. Les coups de Nick réduisent l’armure de 20 %.',
      params: { abilityCooldown: 6, stopDuration: 2, stopTargets: 1, armorBreak: 0.2 },
    },
  },
  {
    id: 'buzzwoody', name: 'Buzz & Woody', pack: 'disney', rarity: 'legendaire', role: 'Duo / polyvalent',
    targeting: 'premier', damage: 22, attackInterval: 0.8,
    ability: {
      name: 'Vers l’infini',
      description: 'Le laser transperce toute la ligne. Toutes les 10 s, le lasso ramène l’ennemi de tête 2 cases en arrière.',
      params: { abilityCooldown: 10, pull: 2 },
    },
  },
  {
    id: 'rapunzel', name: 'Raiponce & Pascal', pack: 'disney', rarity: 'epique', role: 'Contrôle / soin',
    targeting: 'aleatoire', damage: 12, attackInterval: 1.0,
    ability: {
      name: 'Cheveux magiques',
      description: 'Retire les effets de boss (sommeil, hypnose, étourdissement) des unités adjacentes et leur donne +15 % de dégâts. Pascal la rend insensible aux pouvoirs des boss.',
      params: { auraDamage: 0.15 },
    },
  },
  {
    id: 'vanralph', name: 'Vanellope & Ralph', pack: 'disney', rarity: 'legendaire', role: 'Chaos',
    targeting: 'premier', damage: 45, attackInterval: 1.4,
    ability: {
      name: 'Glitch',
      description: 'Ralph détruit les boucliers et fait +100 % contre les blindés. Toutes les 12 s, Vanellope se téléporte sur une autre case et donne +20 % de cadence à ses voisines pendant 5 s.',
      params: { armoredMul: 2, abilityCooldown: 12, boost: 0.2, boostDuration: 5 },
    },
  },
];

export const UNITS: Record<UnitId, UnitDef> = Object.fromEntries(UNIT_LIST.map((u) => [u.id, u])) as Record<UnitId, UnitDef>;

export const UNIT_IDS: UnitId[] = UNIT_LIST.map((u) => u.id);

/** Decks de départ (§6.1). */
export const STARTER_DECKS: Record<'marvel' | 'disney', UnitId[]> = {
  marvel: ['spiderman', 'hawkeye', 'falcon', 'cmarvel', 'widow'],
  disney: ['pocahontas', 'merida', 'tiana', 'nemo', 'foxhound'],
};
