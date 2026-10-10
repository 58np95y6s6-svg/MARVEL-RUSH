// Données des 43 unités (28 Marvel et Disney, 15 DC). Octobre 2026 : chaque héros reprend le profil d'une unité Rush Royale
// (docs/rush-royale-mapping.md, données et sources dans docs/rush-royale-donnees.md). Tout est lu par le moteur.
//
// Conversion Rush Royale → Marvel Rush :
// - `damage` = dégâts du niveau de carte 7 de Rush Royale (notre niveau de collection 1) ; +10 % par
//   niveau de collection (moteur). 0 = l'unité n'attaque pas (soutiens « sans cible » de Rush Royale).
// - Rang de fusion (règle Rush Royale) : intervalle ÷ rang, dégâts par coup indépendants du rang.
// - `range` : Rush Royale n'a pas de portée ; on garde notre système, cohérent avec le type d'unité.
//
// Convention des paramètres de compétence (`ability.params`) :
// - `abilityCooldown` : recharge (s) de la compétence périodique ; `abilityCooldownPerRank` l'ajuste par rang
//   au-dessus de 1 ;
// - suffixe `PerLevel` : ajouté au paramètre de même nom par niveau de collection au-dessus de 1
//   (tableaux par niveau de Rush Royale) ; suffixe `PerRank` : valeur × rang de fusion ;
// - les talents (src/data/talents.ts) : `xAdd` ajoute à `x`, `xMul` multiplie `x`, sans suffixe = valeur directe ;
// - fractions : 0.1 = 10 %, durées en secondes, distances en cases du chemin.
// - archétypes de stratégie génériques (src/engine/archetypes.ts, docs/roadmap.md) : `sacrificeMana`,
//   `copyDamageMul`, `promoteAlly`, `growthPerHit`/`growthPerSecond`/`growthPerKill`, `manaPerKill`,
//   `auraAttackSpeed`, `swapAlly`, `formationDamagePerAlly`… ; une extension n'a qu'à poser ces clés sur ses héros.

import type { UnitDef, UnitId } from './types';

export const UNIT_LIST: UnitDef[] = [
  // ───────────── Pack Marvel ─────────────
  {
    // Rush Royale : Tesla.
    id: 'ironman', name: 'Iron Man', pack: 'marvel', rarity: 'legendaire', role: 'Dégâts / charges',
    targeting: 'premier', damage: 260, attackInterval: 0.6, range: 'globale',
    ability: {
      name: 'Surcharge Arc',
      description: 'Gagne une charge à chaque fusion ou montée de rang sur une case voisine (au plus autant que son rang). Chaque charge augmente ses dégâts (jusqu’à +38 %) ; chargé à fond, chaque tir frappe aussi 4 autres ennemis à 50 %.',
      params: { chargeMax: 1, chargeDamage: 0.385, chargedExtraTargets: 4, chargedSplash: 0.5 },
    },
  },
  {
    // Rush Royale : Trappeur.
    id: 'spiderman', name: 'Spider-Man', pack: 'marvel', rarity: 'epique', role: 'Contrôle / malus',
    targeting: 'premier', damage: 40, attackInterval: 1.0, range: 3.4,
    ability: {
      name: 'Toiles',
      description: 'Toutes les 6 s (−0,3 s par niveau), lance 2 toiles sur le chemin : 123 dégâts (+19 par niveau), les ennemis pris ralentissent de 30 % et subissent +10 % de dégâts pendant 5 s. Les toiles se cumulent (3 au plus).',
      params: {
        abilityCooldown: 6, abilityCooldownPerLevel: -0.3, nets: 2, netRadius: 1, netDamage: 123, netDamagePerLevel: 19,
        netSlow: 0.3, netVuln: 0.1, netMaxStacks: 3, netDuration: 5,
      },
    },
  },
  {
    // Rush Royale : Minotaure.
    id: 'hulk', name: 'Hulk', pack: 'marvel', rarity: 'legendaire', role: 'Dégâts de zone',
    targeting: 'premier', damage: 150, attackInterval: 1.0, range: 1.6,
    ability: {
      name: 'Séisme',
      description: 'Toutes les 5 s, Hulk frappe le sol : séisme autour de l’ennemi de tête, qui ralentit de 30 % et inflige 100 % de ses dégâts par seconde pendant 3 s. Éboulement : quand deux Hulk fusionnent, les ennemis à portée de la case perdent 5 % des PV qu’ils ont déjà perdus chaque seconde pendant 4 s.',
      params: {
        abilityCooldown: 5, quakeRadius: 1.5, quakeSlow: 0.3, quakeDps: 1, quakeDuration: 3,
        rockfallLostHp: 0.05, rockfallDuration: 4,
      },
    },
  },
  {
    // Rush Royale : Thunderer (pas de « Paladin » dans Rush Royale ; le Marteau de la foi est un talent).
    id: 'thor', name: 'Thor', pack: 'marvel', rarity: 'legendaire', role: 'Dégâts en chaîne',
    targeting: 'premier', damage: 80, attackInterval: 1.0, range: 3.4,
    ability: {
      name: 'Éclair en chaîne',
      description: 'L’éclair rebondit sur 1 ennemi de plus par rang (rang 1 : 2 ennemis, rang 7 : 8) ; les ennemis touchés par rebond subissent 119 % des dégâts.',
      params: { chainPerRank: 1, chainDamage: 1.19 },
    },
  },
  {
    // Rush Royale : Mage du portail.
    id: 'strange', name: 'Doctor Strange', pack: 'marvel', rarity: 'epique', role: 'Contrôle',
    targeting: 'premier', damage: 90, attackInterval: 0.8, range: 'globale',
    ability: {
      name: 'Portail',
      description: 'Chaque tir a 5 % de chance de renvoyer sa cible au début du chemin (sauf boss et volants). La chance est divisée par 2 à chaque nouveau renvoi du même ennemi.',
      params: { teleportChance: 0.05, teleportDecay: 0.5 },
    },
  },
  {
    // Rush Royale : Inquisitrice.
    id: 'venom', name: 'Venom', pack: 'marvel', rarity: 'epique', role: 'Croissance',
    targeting: 'premier', damage: 145, attackInterval: 1.0, range: 2.4,
    ability: {
      name: 'Symbiote',
      description: 'Ses dégâts montent à chaque coup sur la même cible (×2 après 23 coups, ×3 après 154), et retombent quand il change de cible. Quand il y a 1, 4, 7 ou 10 Venom sur le plateau, le symbiote s’active : cadence ×1,67 et éclaboussure de 50 %.',
      params: {
        growthPerHit: 1, growthResetOnRetarget: 1, growthScale: 0.319, growthExponent: 0.3646,
        activeCounts: 1, activeAttackSpeed: 1.667, activeSplash: 0.5, activeSplashRadius: 1.5,
      },
    },
  },
  {
    // Rush Royale : Mage de feu.
    id: 'cmarvel', name: 'Captain Marvel', pack: 'marvel', rarity: 'rare', role: 'Dégâts de zone',
    targeting: 'premier', damage: 55, attackInterval: 0.74, range: 'globale',
    ability: {
      name: 'Rafale photonique',
      description: 'Chaque tir explose autour de la cible : 78 % des dégâts aux ennemis proches.',
      params: { splash: 0.78, splashRadius: 1.2 },
    },
  },
  {
    // Rush Royale : Statue de chevalier.
    id: 'cap', name: 'Captain America', pack: 'marvel', rarity: 'legendaire', role: 'Soutien',
    targeting: 'premier', damage: 0, attackInterval: 1.0, range: 2.4,
    ability: {
      name: 'Leader',
      description: 'N’attaque pas. +14 % de vitesse d’attaque par rang aux 4 unités voisines. Avec un nombre pair de Captain America sur le plateau, elles gagnent aussi 5 % de chance de critique par rang (dégâts ×2).',
      params: { auraAttackSpeedPerRank: 0.14, evenCritChancePerRank: 0.05, auraCritMul: 2 },
    },
  },
  {
    // Rush Royale : Arlequin.
    id: 'loki', name: 'Loki', pack: 'marvel', rarity: 'epique', role: 'Copieur',
    targeting: 'aleatoire', damage: 60, attackInterval: 0.8, range: 3.4,
    ability: {
      name: 'Illusion',
      description: 'Copieur : glisse Loki sur une alliée de même rang (autre héros) ; il devient sa copie, avec sa compétence, à −35 % de dégâts (−3,75 points par niveau de collection, −5 % au niveau 9).',
      params: { copyDamageMul: 0.65, copyDamageMulPerLevel: 0.0375 },
    },
  },
  {
    // Rush Royale : Voleur.
    id: 'bucky', name: 'Soldat de l’hiver', pack: 'marvel', rarity: 'epique', role: 'Critique',
    targeting: 'premier', damage: 70, attackInterval: 0.8, range: 3.4,
    ability: {
      name: 'Bras bionique',
      description: 'Chaque coup ajoute un bonus aléatoire de 0 à 200 % des dégâts (dégâts critiques ×3).',
      params: { rogueCritMul: 3 },
    },
  },
  {
    // Rush Royale : Archer.
    id: 'hawkeye', name: 'Œil de faucon', pack: 'marvel', rarity: 'rare', role: 'Cadence',
    targeting: 'premier', damage: 59, attackInterval: 0.45, range: 'globale',
    ability: {
      name: 'Carquois',
      description: 'Archer rapide : chaque amélioration en partie lui donne +22 % de vitesse d’attaque (au lieu de +6 %).',
      params: { powerUpAttackSpeed: 0.22 },
    },
  },
  {
    // Rush Royale : Tireur d'élite.
    id: 'falcon', name: 'Falcon', pack: 'marvel', rarity: 'rare', role: 'Anti-boss',
    targeting: 'fort', damage: 80, attackInterval: 1.0, range: 'globale',
    ability: {
      name: 'Redwing',
      description: 'Vise l’ennemi qui a le plus de PV. Pendant un boss, Tir fou : dégâts et vitesse d’attaque ×1,5.',
      params: { bossWaveDamageMul: 1.5, bossWaveAttackSpeedMul: 1.5 },
    },
  },
  {
    // Rush Royale : Prêtresse.
    id: 'widow', name: 'Black Widow', pack: 'marvel', rarity: 'epique', role: 'Mana',
    targeting: 'premier', damage: 43, attackInterval: 0.9, range: 3.4,
    ability: {
      name: 'Sacrifice',
      description: 'Fusionnée ou détruite, Black Widow rapporte 80 de mana par rang (rang 6 : 480).',
      params: { sacrificeMana: 1, sacrificeManaPerRank: 80 },
    },
  },
  {
    // Rush Royale : Danse-lames.
    id: 'shangchi', name: 'Shang-Chi', pack: 'marvel', rarity: 'epique', role: 'Dégâts',
    targeting: 'premier', damage: 215, attackInterval: 1.2, range: 1.6,
    ability: {
      name: 'Dix Anneaux',
      description: 'Sans autre Shang-Chi sur une case voisine, il danse : +100 % de vitesse d’attaque. Chaque Shang-Chi qui danse donne +10 % de dégâts aux autres Shang-Chi (8 au plus).',
      params: { aloneAttackSpeed: 1, dancerDamage: 0.1, dancerMax: 8 },
    },
  },

  // ───────────── Pack Disney ─────────────
  {
    // Rush Royale : Archer du vent.
    id: 'moana', name: 'Vaïana & Pua', pack: 'disney', rarity: 'epique', role: 'Cadence',
    targeting: 'premier', damage: 59, attackInterval: 0.6, range: 3.4,
    ability: {
      name: 'Appel du vent',
      description: 'Toutes les 4 s, Ouragan : vitesse d’attaque ×3 pendant 3,6 s (+0,3 s par niveau et par rang). Chaque rang au-dessus de 1 ajoute 30 dégâts.',
      params: {
        abilityCooldown: 4, hurricaneDuration: 3.6, hurricaneDurationPerLevel: 0.3, hurricaneDurationPerRank: 0.3,
        hurricaneSpeedMul: 3, rankDamageFlat: 30,
      },
    },
  },
  {
    // Rush Royale : Borée.
    id: 'maui', name: 'Maui', pack: 'disney', rarity: 'legendaire', role: 'Dégâts / formes',
    targeting: 'premier', damage: 120, attackInterval: 0.9, range: 2.4,
    ability: {
      name: 'Métamorphose',
      description: 'Alterne deux formes toutes les 6 s : faucon (+30 % de vitesse d’attaque) puis requin (+60 % de vitesse d’attaque et 30 % de chance de critique ×2).',
      params: { abilityCooldown: 6, hawkSpeed: 0.3, sharkSpeed: 0.6, sharkCritChance: 0.3, sharkCritMul: 2 },
    },
  },
  {
    // Rush Royale : Bannière.
    id: 'pocahontas', name: 'Pocahontas & Meeko', pack: 'disney', rarity: 'rare', role: 'Soutien',
    targeting: 'aleatoire', damage: 0, attackInterval: 1.0, range: 3.4,
    ability: {
      name: 'Couleurs du vent',
      description: 'N’attaque pas. +12 % de vitesse d’attaque par rang (+0,5 point par niveau) aux 4 unités voisines.',
      params: { auraAttackSpeedPerRank: 0.12, auraAttackSpeedPerRankPerLevel: 0.005 },
    },
  },
  {
    // Rush Royale : Pyrotechnicien.
    id: 'mulan', name: 'Mulan & Mushu', pack: 'disney', rarity: 'legendaire', role: 'Dégâts de zone',
    targeting: 'premier', damage: 229, attackInterval: 1.0, range: 2.4,
    ability: {
      name: 'Feu de Mushu',
      description: 'Nombre impair de Mulan sur le plateau : cadence ×0,67, cible au hasard et explosion de 100 % autour de la cible (rayon qui grandit avec le rang). Nombre pair : −40 % de dégâts, tir sur le premier.',
      params: { oddSpeedMul: 0.67, oddSplash: 1, oddRadius: 0.8, oddRadiusPerRank: 0.1, evenDamageMul: 0.6 },
    },
  },
  {
    // Rush Royale : Chasseur.
    id: 'merida', name: 'Rebelle', pack: 'disney', rarity: 'rare', role: 'Précision',
    targeting: 'aleatoire', damage: 120, attackInterval: 1.0, range: 'globale',
    ability: {
      name: 'Première flèche',
      description: 'Le premier tir sur chaque nouvelle cible inflige +210 % de dégâts (+10 points par niveau et par rang au-dessus de 1).',
      params: { firstShotBonus: 2.1, firstShotBonusPerLevel: 0.1, firstShotBonusPerRank: 0.1 },
    },
  },
  {
    // Rush Royale : Stase.
    id: 'ariel', name: 'Ariel & Sébastien', pack: 'disney', rarity: 'epique', role: 'Contrôle',
    targeting: 'premier', damage: 60, attackInterval: 1.0, range: 3.4,
    ability: {
      name: 'Chant de sirène',
      description: 'Toutes les 4 s (1,8 s au rang 7), le chant fige les ennemis autour d’un ennemi au hasard pendant 2,5 s (+0,1 s par niveau ; sauf boss).',
      params: { abilityCooldown: 4, abilityCooldownPerRank: -0.3667, stasisDuration: 2.5, stasisDurationPerLevel: 0.1, stasisRadius: 1 },
    },
  },
  {
    // Rush Royale : Jumeaux (mécanique chiffrée introuvable : double attaque gardée).
    id: 'foxhound', name: 'Rox & Rouky', pack: 'disney', rarity: 'rare', role: 'Duo',
    targeting: 'premier', damage: 70, attackInterval: 0.6, range: 1.6,
    ability: {
      name: 'Meilleurs amis',
      description: 'Double attaque ; le second coup fait +50 % si le premier a touché la même cible.',
      params: { hits: 2, secondHitBonus: 0.5 },
    },
  },
  {
    // Rush Royale : Vampire.
    id: 'tiana', name: 'Tiana & Naveen', pack: 'disney', rarity: 'rare', role: 'Mana',
    targeting: 'premier', damage: 40, attackInterval: 1.0, range: 'globale',
    ability: {
      name: 'Restaurant',
      description: 'Chaque ennemi touché par Tiana rapporte 0,5 mana par seconde tant qu’il vit, et du mana en plus quand il est éliminé : +1 au rang 1, jusqu’à +8 au rang 7.',
      params: { manaPerKill: 1, biteManaPerSecond: 0.5 },
    },
  },
  {
    // Rush Royale : Chaudron magique.
    id: 'nemo', name: 'Nemo & Dory', pack: 'disney', rarity: 'rare', role: 'Aléatoire / mana',
    targeting: 'aleatoire', damage: 30, attackInterval: 1.0, range: 3.4,
    ability: {
      name: 'Mémoire de poisson',
      description: 'Toutes les 8 s, 5 de mana par rang. À son arrivée sur le plateau, une potion au hasard : +25 % de dégâts à une alliée pendant 15 s, 300 % des dégâts à 3 ennemis, +50 % de mana des éliminations pendant 10 s, ou ralentissement de 50 % des ennemis à portée pendant 3 s.',
      params: {
        abilityCooldown: 8, manaPerRank: 5, potionBuff: 0.25, potionBuffDuration: 15, potionDamage: 3, potionTargets: 3,
        potionKillMana: 0.5, potionKillManaDuration: 10, potionSlow: 0.5, potionSlowDuration: 3,
      },
    },
  },
  {
    // Rush Royale : Dryade.
    id: 'coco', name: 'Coco (Miguel)', pack: 'disney', rarity: 'epique', role: 'Booster de fusion',
    targeting: 'premier', damage: 50, attackInterval: 1.0, range: 3.4,
    ability: {
      name: 'Remember Me',
      description: 'Booster de fusion : glisse Coco sur une alliée de même rang (autre héros) ; Coco disparaît et l’alliée gagne 1 rang.',
      params: { promoteAlly: 1 },
    },
  },
  {
    // Rush Royale : Chimiste.
    id: 'nickjudy', name: 'Nick & Judy', pack: 'disney', rarity: 'epique', role: 'Malus',
    targeting: 'premier', damage: 55, attackInterval: 0.9, range: 2.4,
    ability: {
      name: 'Arrestation',
      description: 'Vise le premier ennemi qui n’est pas encore fiché : la cible subit +5 % de dégâts par rang (+0,5 point par niveau) jusqu’à sa mort.',
      params: { vulnPerRank: 0.05, vulnPerRankPerLevel: 0.005 },
    },
  },
  {
    // Rush Royale : Ingénieur.
    id: 'buzzwoody', name: 'Buzz & Woody', pack: 'disney', rarity: 'legendaire', role: 'Dégâts reliés',
    targeting: 'premier', damage: 70, attackInterval: 0.8, range: 3.4,
    ability: {
      name: 'Vers l’infini',
      description: 'Les Buzz & Woody posés sur des cases voisines se relient : +5 % de dégâts par autre Buzz & Woody du groupe (+0,5 point par niveau, 10 au plus).',
      params: { formationDamagePerAlly: 0.05, formationDamagePerAllyPerLevel: 0.005, formationMax: 10 },
    },
  },
  {
    // Rush Royale : Meule.
    id: 'rapunzel', name: 'Raiponce & Pascal', pack: 'disney', rarity: 'epique', role: 'Soutien',
    targeting: 'aleatoire', damage: 0, attackInterval: 1.0, range: 2.4,
    ability: {
      name: 'Cheveux magiques',
      description: 'N’attaque pas. +8 % de dégâts par rang aux 4 unités voisines.',
      params: { auraDamagePerRank: 0.08 },
    },
  },
  {
    // Rush Royale : Gardien du portail.
    id: 'vanralph', name: 'Vanellope & Ralph', pack: 'disney', rarity: 'legendaire', role: 'Échangeur',
    targeting: 'premier', damage: 45, attackInterval: 0.66, range: 2.4,
    ability: {
      name: 'Glitch',
      description: 'Échangeur : glisse-les sur une alliée de même rang (autre héros), elles échangent leurs cases, sans limite. L’alliée est libérée des effets de boss et de la pénalité de copie ; Vanellope, elle, bugue 2 s (ni attaque, ni fusion).',
      params: { swapAlly: 1, swapSleep: 2, swapCleanse: 1 },
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
    targeting: 'premier', damage: 22, attackInterval: 0.5, range: 1.6,
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
    targeting: 'premier', damage: 96, attackInterval: 0.7, range: 1.6,
    ability: {
      name: 'Bâton de combat',
      description: 'Booster de fusion : glisse Robin sur une alliée de même rang (autre héros) ; il lui passe le relais, disparaît et l’alliée gagne 1 rang. Une attaque sur 3 balaie 2 ennemis. Disciple : +20 % de dégâts s’il est à côté de Batman ou de Batgirl.',
      params: { promoteAlly: 1, sweepEvery: 3, sweepTargets: 2, mentorBonus: 0.2 },
    },
  },
  {
    id: 'batgirl', name: 'Batgirl', pack: 'dc', rarity: 'rare', role: 'Malus / anti-armure',
    targeting: 'fort', damage: 100, attackInterval: 0.75, range: 1.6,
    ability: {
      name: 'Piratage d’Oracle',
      description: 'Toutes les 8 s, elle pirate l’ennemi le plus fort : son bouclier tombe et son armure baisse de 30 %.',
      params: { abilityCooldown: 8, hackArmor: 0.3, hackShield: 1 },
    },
  },
  {
    id: 'catwoman', name: 'Catwoman', pack: 'dc', rarity: 'rare', role: 'Économie / ralentissement',
    targeting: 'aleatoire', damage: 86, attackInterval: 0.6, range: 1.6,
    ability: {
      name: 'Cambriolage',
      description: 'Cambriolage : chaque ennemi touché par Catwoman rapporte du mana en plus quand il est éliminé (+1 au rang 1, jusqu’à +8 au rang 7). Un coup de fouet sur 5 ralentit de 30 % pendant 2 s.',
      params: { manaPerKill: 1, whipEvery: 5, whipSlow: 0.3, whipDuration: 2 },
    },
  },
  {
    id: 'harley', name: 'Harley Quinn', pack: 'dc', rarity: 'rare', role: 'Chaos',
    targeting: 'aleatoire', damage: 90, attackInterval: 0.8, range: 1.6,
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
