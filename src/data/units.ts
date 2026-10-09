// Données des 43 unités (28 Marvel et Disney, 15 DC) (§4.5 du prompt, design/game-design.md).
// Valeurs de départ, à équilibrer avec scripts/simulate.ts. Tout est lu par le moteur.
//
// Convention des paramètres de compétence (`ability.params`) :
// - `abilityCooldown` : recharge (s) de la compétence principale à déclenchement périodique ;
// - les noms reprennent ceux visés par les talents (src/data/talents.ts) : un talent `xAdd`
//   ajoute à `x`, un talent `xMul` multiplie `x`, une clé sans suffixe est une valeur directe ;
// - fractions : 0.1 = 10 %, durées en secondes, distances en cases du chemin.
// - archétypes de stratégie génériques (src/engine/archetypes.ts, docs/roadmap.md) : `sacrificeMana`,
//   `copyDamageMul`, `promoteAlly`, `growthPerSecond`/`growthPerKill`/`growthKeepOnMerge`,
//   `manaPerKill`, `auraAttackSpeed`, `swapAlly`, `formationDamagePerAlly`… ; une extension n'a qu'à poser ces clés sur ses héros.

import type { UnitDef, UnitId } from './types';

export const UNIT_LIST: UnitDef[] = [
  // ───────────── Pack Marvel ─────────────
  {
    id: 'ironman', name: 'Iron Man', pack: 'marvel', rarity: 'legendaire', role: 'Dégâts',
    targeting: 'premier', damage: 37, attackInterval: 0.8, range: 'globale',
    ability: {
      name: 'Uni-Beam',
      description: 'Toutes les 10 s, un laser inflige 200 % des dégâts à tous les ennemis d’une ligne du chemin.',
      params: { abilityCooldown: 10, beamDamage: 2 },
    },
  },
  {
    id: 'spiderman', name: 'Spider-Man', pack: 'marvel', rarity: 'epique', role: 'Contrôle',
    targeting: 'premier', damage: 21, attackInterval: 0.5, range: 2.4,
    ability: {
      name: 'Toile collante',
      description: 'Chaque coup ralentit de 10 %, cumulable 3 fois ; à 3 cumuls, l’ennemi est immobilisé 1 s.',
      params: { slowPerStack: 0.1, maxStacks: 3, slowDuration: 2, rootDuration: 1 },
    },
  },
  {
    id: 'hulk', name: 'Hulk', pack: 'marvel', rarity: 'legendaire', role: 'Dégâts de zone',
    targeting: 'premier', damage: 220, attackInterval: 1.6, range: 1.6,
    ability: {
      name: 'Hulk Smash',
      description: 'Éclaboussure de 40 % autour de la cible. Rage : +5 % de dégâts par coup (max +50 %). Tous les 8 coups, Smash étourdit les ennemis proches 1 s.',
      params: { splash: 0.4, splashRadius: 1.5, ragePerHit: 0.05, rageMax: 0.5, smashEveryHits: 8, smashStun: 1, smashRadius: 2 },
    },
  },
  {
    id: 'thor', name: 'Thor', pack: 'marvel', rarity: 'legendaire', role: 'Dégâts en chaîne',
    targeting: 'aleatoire', damage: 43, attackInterval: 1.0, range: 3.4,
    ability: {
      name: 'Éclair en chaîne',
      description: 'L’éclair touche 3 ennemis, +1 rebond tous les 2 rangs (max 5), −20 % de dégâts par rebond.',
      params: { chain: 3, chainPerRanks: 2, chainMax: 5, falloff: 0.2 },
    },
  },
  {
    id: 'strange', name: 'Doctor Strange', pack: 'marvel', rarity: 'epique', role: 'Soutien / contrôle',
    targeting: 'premier', damage: 18, attackInterval: 1.0, range: 'globale',
    ability: {
      name: 'Portail',
      description: 'Toutes les 12 s, renvoie l’ennemi de tête au début du chemin (sauf boss).',
      params: { abilityCooldown: 12, portalTargets: 1 },
    },
  },
  {
    id: 'venom', name: 'Venom', pack: 'marvel', rarity: 'epique', role: 'Exécution',
    targeting: 'premier', damage: 128, attackInterval: 1.0, range: 1.6,
    ability: {
      name: 'Dévorer',
      description: 'Exécute un ennemi sous 15 % de PV (sauf boss). Croissance sans plafond, qui ralentit avec le temps : ses dégâts grandissent tant qu’il reste sur le plateau et à chaque élimination (≈ +20 % après 2 min, +100 % vers la vague 30, +200 % vers la vague 60). Fusionné, il transmet la moitié de son bonus à la nouvelle unité.',
      params: { executeThreshold: 0.15, growthPerSecond: 0.005, growthPerKill: 0.02, growthScale: 0.28, growthExponent: 0.75, growthKeepOnMerge: 0.5 },
    },
  },
  {
    id: 'cmarvel', name: 'Captain Marvel', pack: 'marvel', rarity: 'rare', role: 'Dégâts',
    targeting: 'fort', damage: 30, attackInterval: 0.9, range: 'globale',
    ability: {
      name: 'Mode binaire',
      description: 'Après 10 attaques, passe en mode binaire : dégâts ×2 pendant 5 s.',
      params: { chargeAttacks: 10, binaryMul: 2, binaryDuration: 5 },
    },
  },
  {
    id: 'cap', name: 'Captain America', pack: 'marvel', rarity: 'legendaire', role: 'Soutien / rebond',
    targeting: 'premier', damage: 41, attackInterval: 1.0, range: 2.4,
    ability: {
      name: 'Leader',
      description: 'Le bouclier rebondit sur 3 ennemis. Boost de vitesse : +15 % de vitesse d’attaque aux unités adjacentes.',
      params: { bounces: 3, auraAttackSpeed: 0.15 },
    },
  },
  {
    id: 'loki', name: 'Loki', pack: 'marvel', rarity: 'epique', role: 'Trickster',
    targeting: 'aleatoire', damage: 31, attackInterval: 0.8, range: 3.4,
    ability: {
      name: 'Illusion',
      description: 'Copieur : glisse Loki sur une alliée de même rang (autre héros) ; il devient sa copie, avec sa compétence, à −25 % de dégâts. Formation : +15 % de dégâts par autre Loki aligné à côté de lui (rangée ou colonne, +30 % au plus) ; à 3 alignés, ses dagues touchent aussi les ennemis autour de la cible (40 %). 10 % de chance de faire reculer l’ennemi touché pendant 2 s.',
      params: { copyDamageMul: 0.75, formationDamagePerAlly: 0.15, formationMax: 3, formationSplashAt: 3, formationSplash: 0.4, knockbackChance: 0.1, knockbackDuration: 2 },
    },
  },
  {
    id: 'bucky', name: 'Soldat de l’hiver', pack: 'marvel', rarity: 'epique', role: 'Critique',
    targeting: 'fort', damage: 51, attackInterval: 1.2, range: 3.4,
    ability: {
      name: 'Bras bionique',
      description: 'Une attaque sur 4 est un critique ×3 qui étourdit 0,5 s.',
      params: { critEvery: 4, critMul: 3, critStun: 0.5 },
    },
  },
  {
    id: 'hawkeye', name: 'Œil de faucon', pack: 'marvel', rarity: 'rare', role: 'Polyvalent',
    targeting: 'premier', damage: 22, attackInterval: 0.7, range: 'globale',
    ability: {
      name: 'Flèches spéciales',
      description: 'Alterne les flèches : explosive (éclaboussure 50 %), glace (ralentit de 25 % pendant 2 s), électrique (chaîne sur 2 ennemis).',
      params: { explosiveSplash: 0.5, splashRadius: 1.5, iceSlow: 0.25, iceDuration: 2, chain: 2 },
    },
  },
  {
    id: 'falcon', name: 'Falcon', pack: 'marvel', rarity: 'rare', role: 'Ciblage',
    targeting: 'fort', damage: 18, attackInterval: 0.6, range: 'globale',
    ability: {
      name: 'Drone Redwing',
      description: 'Toutes les 6 s, Redwing marque l’ennemi le plus fort : +25 % de dégâts subis pendant 4 s.',
      params: { abilityCooldown: 6, markBonus: 0.25, markDuration: 4, markTargets: 1 },
    },
  },
  {
    id: 'widow', name: 'Black Widow', pack: 'marvel', rarity: 'epique', role: 'Anti-boss',
    targeting: 'premier', damage: 24, attackInterval: 0.5, range: 3.4,
    ability: {
      name: 'Morsure de la veuve',
      description: 'Un coup sur 5 paralyse 1 s. Sacrifice : fusionnée ou détruite, elle rapporte du mana selon son rang (10, 25, 45, 70, 100, 140, 190).',
      params: { paralyzeEvery: 5, paralyzeDuration: 1, sacrificeMana: 1 },
    },
  },
  {
    id: 'shangchi', name: 'Shang-Chi', pack: 'marvel', rarity: 'epique', role: 'Combo',
    targeting: 'aleatoire', damage: 44, attackInterval: 0.4, range: 1.6,
    ability: {
      name: 'Dix Anneaux',
      description: 'Tous les 10 coups, 10 anneaux frappent 10 ennemis aléatoires à 100 %.',
      params: { ringsEveryHits: 10, ringCount: 10, ringDamage: 1 },
    },
  },

  // ───────────── Pack Disney ─────────────
  {
    id: 'moana', name: 'Vaïana & Pua', pack: 'disney', rarity: 'epique', role: 'Contrôle',
    targeting: 'premier', damage: 26, attackInterval: 1.0, range: 3.4,
    ability: {
      name: 'Appel de l’océan',
      description: 'Toutes les 10 s, une vague repousse de 1,5 case les ennemis de tête (sauf boss).',
      params: { abilityCooldown: 10, push: 1.5, pushTargets: 3 },
    },
  },
  {
    id: 'maui', name: 'Maui', pack: 'disney', rarity: 'legendaire', role: 'Dégâts / transformation',
    targeting: 'premier', damage: 146, attackInterval: 1.2, range: 1.6,
    ability: {
      name: 'Métamorphose',
      description: 'Alterne toutes les 8 s : faucon (cadence ×2, dégâts ×0,5) ou requin (dégâts ×2,5 avec éclaboussure).',
      params: { abilityCooldown: 8, sharkDuration: 8, hawkSpeedMul: 2, hawkMul: 0.5, sharkMul: 2.5, sharkSplash: 0.5, splashRadius: 1.5 },
    },
  },
  {
    id: 'pocahontas', name: 'Pocahontas & Meeko', pack: 'disney', rarity: 'rare', role: 'Soutien',
    targeting: 'aleatoire', damage: 17, attackInterval: 0.8, range: 3.4,
    ability: {
      name: 'Couleurs du vent',
      description: 'Boost de vitesse : +10 % de vitesse d’attaque aux unités adjacentes (+5 % par rang). Meeko : 5 % de chance de +5 de mana par élimination.',
      params: { auraAttackSpeed: 0.1, auraPerRank: 0.05, meekoChance: 0.05, meekoMana: 5 },
    },
  },
  {
    id: 'mulan', name: 'Mulan & Mushu', pack: 'disney', rarity: 'legendaire', role: 'Dégâts / brûlure',
    targeting: 'premier', damage: 110, attackInterval: 1.0, range: 1.6,
    ability: {
      name: 'Souffle de Mushu',
      description: 'Brûlure : 20 % des dégâts par seconde pendant 3 s. Une fois par vague, Avalanche : 300 % des dégâts à tous les ennemis.',
      params: { burnPerSecond: 0.2, burnDuration: 3, avalancheDamage: 3, avalancheUses: 1, avalancheMinEnemies: 8 },
    },
  },
  {
    id: 'merida', name: 'Rebelle', pack: 'disney', rarity: 'rare', role: 'Précision',
    targeting: 'premier', damage: 32, attackInterval: 0.9, range: 'globale',
    ability: {
      name: 'Tir parfait',
      description: '100 % de critiques ×2 sur l’ennemi le plus avancé.',
      params: { critMul: 2 },
    },
  },
  {
    id: 'ariel', name: 'Ariel & Sébastien', pack: 'disney', rarity: 'epique', role: 'Contrôle',
    targeting: 'premier', damage: 17, attackInterval: 0.9, range: 3.4,
    ability: {
      name: 'Chant de sirène',
      description: 'Toutes les 8 s, le chant arrête 3 ennemis pendant 1,5 s. Sébastien : saignement de 5 % des PV par seconde (réduit sur les boss).',
      params: { abilityCooldown: 8, songTargets: 3, songDuration: 1.5, bleed: 0.05, bleedDuration: 2, bleedBossFactor: 0.1 },
    },
  },
  {
    id: 'foxhound', name: 'Rox & Rouky', pack: 'disney', rarity: 'rare', role: 'Duo',
    targeting: 'premier', damage: 51, attackInterval: 0.6, range: 1.6,
    ability: {
      name: 'Meilleurs amis',
      description: 'Double attaque ; le second coup fait +50 % si le premier a touché la même cible.',
      params: { hits: 2, secondHitBonus: 0.5 },
    },
  },
  {
    id: 'tiana', name: 'Tiana & Naveen', pack: 'disney', rarity: 'rare', role: 'Économie',
    targeting: 'aleatoire', damage: 11, attackInterval: 1.0, range: 'globale',
    ability: {
      name: 'Restaurant',
      description: 'Chaque ennemi touché par Tiana rapporte du mana en plus quand il est éliminé : +1 au rang 1, jusqu’à +8 au rang 7. Toutes les 12 s, la langue tire l’ennemi de tête 1 case en arrière.',
      params: { manaPerKill: 1, abilityCooldown: 12, pull: 1 },
    },
  },
  {
    id: 'nemo', name: 'Nemo & Dory', pack: 'disney', rarity: 'rare', role: 'Aléatoire',
    targeting: 'aleatoire', damage: 26, attackInterval: 0.7, range: 3.4,
    ability: {
      name: 'Mémoire de poisson',
      description: 'Effet aléatoire à chaque tir : ralentissement, dégâts ×2, poison, ou +20 % de cadence à une unité alliée au hasard.',
      params: { slow: 0.2, slowDuration: 2, doubleDamageMul: 2, poison: 0.3, poisonDuration: 3, allyHaste: 0.2, allyHasteDuration: 3, effectsPerShot: 1 },
    },
  },
  {
    id: 'coco', name: 'Coco (Miguel)', pack: 'disney', rarity: 'epique', role: 'Soutien',
    targeting: 'aleatoire', damage: 17, attackInterval: 1.0, range: 3.4,
    ability: {
      name: 'Remember Me',
      description: 'Booster de fusion : glisse Coco sur une alliée de même rang (autre héros) ; Coco disparaît et l’alliée gagne 1 rang. Une fois par vague, restaure une unité détruite ou rétrogradée par un boss. +5 % de dégâts aux unités adjacentes.',
      params: { restoreUses: 1, auraDamage: 0.05, promoteAlly: 1 },
    },
  },
  {
    id: 'nickjudy', name: 'Nick & Judy', pack: 'disney', rarity: 'epique', role: 'Contrôle / malus',
    targeting: 'premier', damage: 33, attackInterval: 0.8, range: 2.4,
    ability: {
      name: 'Arrestation',
      description: 'Toutes les 6 s, Judy arrête l’ennemi le plus fort (sauf boss) pendant 2 s. Les coups de Nick réduisent l’armure de 20 %.',
      params: { abilityCooldown: 6, stopDuration: 2, stopTargets: 1, armorBreak: 0.2 },
    },
  },
  {
    id: 'buzzwoody', name: 'Buzz & Woody', pack: 'disney', rarity: 'legendaire', role: 'Duo / polyvalent',
    targeting: 'premier', damage: 38, attackInterval: 0.8, range: 3.4,
    ability: {
      name: 'Vers l’infini',
      description: 'Le laser transperce toute la ligne. Toutes les 10 s, le lasso ramène l’ennemi de tête 2 cases en arrière.',
      params: { abilityCooldown: 10, pull: 2 },
    },
  },
  {
    id: 'rapunzel', name: 'Raiponce & Pascal', pack: 'disney', rarity: 'epique', role: 'Contrôle / soin',
    targeting: 'aleatoire', damage: 25, attackInterval: 1.0, range: 2.4,
    ability: {
      name: 'Cheveux magiques',
      description: 'Retire les effets de boss (sommeil, hypnose, étourdissement) des unités adjacentes et leur donne +15 % de dégâts. Pascal la rend insensible aux pouvoirs des boss.',
      params: { auraDamage: 0.15 },
    },
  },
  {
    id: 'vanralph', name: 'Vanellope & Ralph', pack: 'disney', rarity: 'legendaire', role: 'Chaos',
    targeting: 'premier', damage: 165, attackInterval: 1.4, range: 1.6,
    ability: {
      name: 'Glitch',
      description: 'Ralph détruit les boucliers et fait +100 % contre les blindés. Échangeur : glisse-les sur une alliée de même rang (autre héros), elles échangent leurs cases, sans limite ; Vanellope donne alors +20 % de cadence à ses nouvelles voisines pendant 5 s.',
      params: { armoredMul: 2, swapAlly: 1, boost: 0.2, boostDuration: 5 },
    },
  },

  // ───────────── Pack DC (extension DC Comics) ─────────────
  // Répartition des raretés comme les autres packs : 4 Légendaires, 6 Épiques, 5 Rares.
  {
    id: 'batman', name: 'Batman', pack: 'dc', rarity: 'legendaire', role: 'Gadgets / malus',
    targeting: 'premier', damage: 55, attackInterval: 0.9, range: 2.4,
    ability: {
      name: 'Batceinture',
      description: 'Une attaque sur 3 lance 3 batarangs à 80 % sur la cible et ses voisins. Toutes les 10 s, une bombe fumigène ralentit de 40 % les ennemis autour de l’ennemi de tête et les expose (+20 % de dégâts subis) pendant 3 s.',
      params: { batarangEvery: 3, batarangTargets: 3, batarangDamage: 0.8, abilityCooldown: 10, smokeRadius: 2, smokeSlow: 0.4, smokeMark: 0.2, smokeDuration: 3 },
    },
  },
  {
    id: 'superman', name: 'Superman', pack: 'dc', rarity: 'legendaire', role: 'Dégâts / contrôle',
    targeting: 'fort', damage: 59, attackInterval: 1.2, range: 'globale',
    ability: {
      name: 'Homme d’acier',
      description: 'Vision thermique : chaque coup brûle 15 % des dégâts par seconde pendant 2 s. Toutes les 12 s, le souffle glacial gèle les 4 ennemis de tête pendant 1,5 s (les boss sont ralentis de 30 % pendant 3 s).',
      params: { burnPerSecond: 0.15, burnDuration: 2, abilityCooldown: 12, breathTargets: 4, freezeDuration: 1.5, breathBossSlow: 0.3, breathBossSlowDuration: 3 },
    },
  },
  {
    id: 'wonderwoman', name: 'Wonder Woman', pack: 'dc', rarity: 'legendaire', role: 'Zone / anti-boss',
    targeting: 'premier', damage: 83, attackInterval: 1.1, range: 2.4,
    ability: {
      name: 'Lasso de vérité',
      description: 'L’épée éclabousse à 35 % autour de la cible. Toutes les 10 s, le lasso ligote l’ennemi de tête 1,5 s ; sur un boss, il l’expose : +30 % de dégâts subis pendant 4 s.',
      params: { splash: 0.35, splashRadius: 1, abilityCooldown: 10, lassoStop: 1.5, lassoBossMark: 0.3, lassoMarkDuration: 4 },
    },
  },
  {
    id: 'greenlantern', name: 'Green Lantern', pack: 'dc', rarity: 'legendaire', role: 'Constructions',
    targeting: 'aleatoire', damage: 41, attackInterval: 0.8, range: 3.4,
    ability: {
      name: 'Construction de l’anneau',
      description: 'Toutes les 8 s, l’anneau crée une construction, à tour de rôle : un mur qui arrête 1,5 s les ennemis de la ligne de tête, un marteau géant (300 % au plus fort, étourdit 1 s), puis une mitrailleuse (8 tirs à 60 % au hasard). Formation du Corps : +15 % de dégâts par autre Green Lantern aligné à côté de lui (rangée ou colonne, +30 % au plus) ; à 3 alignés, ses rayons touchent aussi les ennemis autour de la cible (40 %).',
      params: { abilityCooldown: 8, wallDuration: 1.5, hammerDamage: 3, hammerStun: 1, gatlingShots: 8, gatlingDamage: 0.6, formationDamagePerAlly: 0.15, formationMax: 3, formationSplashAt: 3, formationSplash: 0.4 },
    },
  },
  {
    id: 'flash', name: 'Flash', pack: 'dc', rarity: 'epique', role: 'Multi-coups',
    targeting: 'premier', damage: 18, attackInterval: 0.5, range: 1.6,
    ability: {
      name: 'Super-vitesse',
      description: 'Chaque attaque frappe 3 fois (idéal contre les boucliers). Toutes les 12 s, Flash fait le tour du chemin et frappe chaque ennemi à 300 %. Échangeur : glisse Flash sur une alliée de même rang (autre héros), ils échangent leurs cases en un éclair, sans limite ; la Force véloce donne alors +20 % de cadence à ses nouvelles voisines pendant 5 s.',
      params: { hitsPerAttack: 3, abilityCooldown: 12, lapDamage: 3, swapAlly: 1, boost: 0.2, boostDuration: 5 },
    },
  },
  {
    id: 'aquaman', name: 'Aquaman', pack: 'dc', rarity: 'epique', role: 'Perçant / contrôle',
    targeting: 'premier', damage: 58, attackInterval: 1.1, range: 2.4,
    ability: {
      name: 'Roi d’Atlantis',
      description: 'Le trident transperce : l’ennemi juste derrière la cible subit 50 %. Toutes les 10 s, un kraken saisit les 2 ennemis de tête (sauf boss) : 150 % des dégâts et arrêt de 2 s.',
      params: { pierce: 0.5, abilityCooldown: 10, krakenTargets: 2, krakenDamage: 1.5, krakenStop: 2 },
    },
  },
  {
    id: 'cyborg', name: 'Cyborg', pack: 'dc', rarity: 'epique', role: 'Soutien technologique',
    targeting: 'fort', damage: 26, attackInterval: 0.8, range: 'globale',
    ability: {
      name: 'Surcharge système',
      description: 'Boost de vitesse : +15 % de vitesse d’attaque aux unités adjacentes (réseau). Toutes les 12 s, Surcharge système : toutes tes unités gagnent +20 % de vitesse d’attaque pendant 4 s. Le canon sonique réduit l’armure de 10 %.',
      params: { auraAttackSpeed: 0.15, abilityCooldown: 12, haste: 0.2, hasteDuration: 4, armorBreak: 0.1 },
    },
  },
  {
    id: 'supergirl', name: 'Supergirl', pack: 'dc', rarity: 'epique', role: 'Montée en puissance',
    targeting: 'fort', damage: 48, attackInterval: 1.0, range: 3.4,
    ability: {
      name: 'Énergie solaire',
      description: 'Croissance : elle absorbe le soleil jaune, ses dégâts grandissent sans plafond (de plus en plus lentement) tant qu’elle reste sur le plateau et à chaque élimination ; fusionnée, elle transmet la moitié de son bonus. Chaque élimination donne aussi une charge solaire : à 8 charges, Éruption solaire, 400 % à tous les ennemis de la ligne de la cible.',
      params: { growthPerSecond: 0.004, growthPerKill: 0.03, growthScale: 0.28, growthExponent: 0.75, growthKeepOnMerge: 0.5, maxCharges: 8, flareDamage: 4 },
    },
  },
  {
    id: 'shazam', name: 'Shazam', pack: 'dc', rarity: 'epique', role: 'Transformation',
    targeting: 'aleatoire', damage: 38, attackInterval: 1.0, range: 2.4,
    ability: {
      name: 'SHAZAM !',
      description: 'Toutes les 12 s, la foudre frappe 3 ennemis au hasard à 200 % et Billy devient Shazam pendant 6 s : dégâts ×2 et chaque coup rebondit sur 2 ennemis à 60 %.',
      params: { abilityCooldown: 12, boltTargets: 3, boltDamage: 2, powerDuration: 6, powerMul: 2, powerChain: 2, powerChainDamage: 0.6 },
    },
  },
  {
    id: 'martian', name: 'Martian Manhunter', pack: 'dc', rarity: 'epique', role: 'Anti-boss / contrôle',
    targeting: 'premier', damage: 41, attackInterval: 1.0, range: 3.4,
    ability: {
      name: 'Télépathie',
      description: 'Copieur métamorphe : glisse-le sur une alliée de même rang (autre héros) ; il prend sa forme, avec sa compétence, à −25 % de dégâts. Intangible : insensible à tous les pouvoirs de boss. Toutes les 10 s, il trouble l’esprit des 2 ennemis de tête (sauf boss et volants), qui reculent pendant 2,5 s.',
      params: { copyDamageMul: 0.75, intangible: 1, abilityCooldown: 10, telepathyTargets: 2, confuseDuration: 2.5 },
    },
  },
  {
    id: 'robin', name: 'Robin', pack: 'dc', rarity: 'rare', role: 'Acrobate',
    targeting: 'premier', damage: 55, attackInterval: 0.7, range: 1.6,
    ability: {
      name: 'Bâton de combat',
      description: 'Booster de fusion : glisse Robin sur une alliée de même rang (autre héros) ; il lui passe le relais, disparaît et l’alliée gagne 1 rang. Une attaque sur 3 balaie 2 ennemis. Disciple : +20 % de dégâts s’il est à côté de Batman ou de Batgirl.',
      params: { promoteAlly: 1, sweepEvery: 3, sweepTargets: 2, mentorBonus: 0.2 },
    },
  },
  {
    id: 'batgirl', name: 'Batgirl', pack: 'dc', rarity: 'rare', role: 'Malus / anti-armure',
    targeting: 'fort', damage: 61, attackInterval: 0.75, range: 1.6,
    ability: {
      name: 'Piratage d’Oracle',
      description: 'Toutes les 8 s, elle pirate l’ennemi le plus fort : son bouclier tombe et son armure baisse de 30 %.',
      params: { abilityCooldown: 8, hackArmor: 0.3, hackShield: 1 },
    },
  },
  {
    id: 'catwoman', name: 'Catwoman', pack: 'dc', rarity: 'rare', role: 'Économie / ralentissement',
    targeting: 'aleatoire', damage: 52, attackInterval: 0.6, range: 1.6,
    ability: {
      name: 'Cambriolage',
      description: 'Cambriolage : chaque ennemi touché par Catwoman rapporte du mana en plus quand il est éliminé (+1 au rang 1, jusqu’à +8 au rang 7). Un coup de fouet sur 5 ralentit de 30 % pendant 2 s.',
      params: { manaPerKill: 1, whipEvery: 5, whipSlow: 0.3, whipDuration: 2 },
    },
  },
  {
    id: 'harley', name: 'Harley Quinn', pack: 'dc', rarity: 'rare', role: 'Chaos',
    targeting: 'aleatoire', damage: 52, attackInterval: 0.8, range: 1.6,
    ability: {
      name: 'Maillet chaotique',
      description: 'Effet au hasard à chaque coup : gros maillet (×2,5 et recul d’une case), bombe à confettis (éclaboussure 60 %), tarte à la crème (étourdit 1 s) ou « Oups ! » (×0,5). Sacrifice : fusionnée ou détruite, elle tire sa révérence et rapporte du mana selon son rang (10, 25, 45, 70, 100, 140, 190).',
      params: { malletMul: 2.5, malletKnockback: 1, confettiSplash: 0.6, splashRadius: 1.5, pieStun: 1, oopsMul: 0.5, sacrificeMana: 1 },
    },
  },
  {
    id: 'greenarrow', name: 'Green Arrow', pack: 'dc', rarity: 'rare', role: 'Salves',
    targeting: 'premier', damage: 20, attackInterval: 0.8, range: 'globale',
    ability: {
      name: 'Carquois truqué',
      description: 'Une flèche sur 4 est une flèche-filet qui arrête la cible 1 s. Toutes les 8 s, une salve de 5 flèches frappe les 5 ennemis de tête à 70 %.',
      params: { netEvery: 4, netDuration: 1, abilityCooldown: 8, volleyArrows: 5, volleyDamage: 0.7 },
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

/**
 * Decks de référence de l'extension DC (simulateur, docs/equilibrage.md). Le deck de départ
 * reste Marvel ou Disney : `dc-rares` sert de témoin « deck de départ » pour les héros DC.
 */
export const DC_REFERENCE_DECKS: Record<'dc-rares' | 'meta-dc' | 'bat-famille' | 'cosmiques', UnitId[]> = {
  'dc-rares': ['robin', 'batgirl', 'catwoman', 'harley', 'greenarrow'],
  'meta-dc': ['superman', 'batman', 'wonderwoman', 'greenlantern', 'flash'],
  'bat-famille': ['batman', 'robin', 'batgirl', 'catwoman', 'harley'],
  'cosmiques': ['greenlantern', 'martian', 'superman', 'supergirl', 'shazam'],
};
