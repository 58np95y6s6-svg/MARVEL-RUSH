// Données des 73 unités (28 Marvel et Disney, 15 DC, 15 Transformers, 15 Pixar). Octobre 2026 : chaque héros reprend le profil d'une unité Rush Royale
// (docs/rush-royale-mapping.md, données et sources dans docs/rush-royale-donnees.md). Tout est lu par le moteur.
//
// Conversion Rush Royale → Marvel Rush :
// - `damage` = dégâts du niveau de carte 7 de Rush Royale (notre niveau de collection 1). Niveau de
//   collection : `damagePerLevel` = pas du tableau par niveau de l'unité Rush Royale quand il est publié
//   (docs/rush-royale-donnees.md §1), sinon +10 % par niveau (moteur). 0 = l'unité n'attaque pas
//   (soutiens « sans cible » de Rush Royale).
// - Rang de fusion (règle Rush Royale) : intervalle ÷ rang, dégâts par coup indépendants du rang.
// - `range` : Rush Royale n'a pas de portée ; on garde notre système, choisi selon le style de combat du
//   personnage et l'attaque de l'unité Rush Royale copiée (docs/rush-royale-mapping.md « Portées »). Changer
//   de catégorie de portée multiplie les dégâts (et le pas par niveau) par le rapport des facteurs
//   globale 1 · longue 1,4 · moyenne 1,7 · courte 3 (docs/equilibrage.md §2 bis).
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
    targeting: 'premier', damage: 260, damagePerLevel: 107.25, attackInterval: 0.6, range: 'globale',
    rr: { id: 'tesla', name: 'Tesla', rarity: 'legendaire' },
    ability: {
      name: 'Surcharge Arc',
      description: 'Gagne une charge à chaque fusion ou montée de rang sur une case voisine (au plus autant que son rang). Chaque charge augmente ses dégâts (jusqu’à +38 %) ; chargé à fond, chaque tir frappe aussi 4 autres ennemis à 50 %.',
      params: { chargeMax: 1, chargeDamage: 0.385, chargedExtraTargets: 4, chargedSplash: 0.5 },
    },
  },
  {
    // Rush Royale : Catapulte (épique). Tir sur le premier ennemi : dégâts de zone et étourdissement, le même
    // ennemi ne peut être réétourdi qu'après 9 s ; le rang augmente les dégâts, pas la cadence (texte du jeu).
    // Chiffres absolus non publiés (C) : 100 dégâts, 2 s, zone 100 % sur 1 case, étourdissement 1 s.
    id: 'spiderman', name: 'Spider-Man', pack: 'marvel', rarity: 'epique', role: 'Contrôle de zone',
    targeting: 'premier', damage: 100, attackInterval: 2.0, range: 3.4,
    rr: { id: 'catapult', name: 'Catapulte', rarity: 'epique' },
    ability: {
      name: 'Boule de toile',
      description: 'Tire une boule de toile sur le premier ennemi : 100 % des dégâts autour de lui (1 case) et les ennemis touchés sont collés 1 s (sauf boss). Un même ennemi ne peut être recollé qu’après 9 s. Le rang de fusion multiplie les dégâts (rang 7 : ×7) au lieu de la cadence.',
      params: { rankDamage: 1, webSplash: 1, webRadius: 1, webStun: 1, webRestun: 9 },
    },
  },
  {
    // Rush Royale : Minotaure.
    id: 'hulk', name: 'Hulk', pack: 'marvel', rarity: 'legendaire', role: 'Dégâts de zone',
    targeting: 'premier', damage: 150, attackInterval: 1.0, range: 1.6,
    rr: { id: 'minotaur', name: 'Minotaure', rarity: 'legendaire' },
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
    // Rush Royale : Inquisiteur (fiche de l'unité : 834 dégâts au niveau 12, +129 par niveau → 189 au niveau 7,
    // notre niveau 1 ; ensuite +129 par niveau de collection, comme la fiche). Intervalle 1 s, 0,6 s actif.
    id: 'thor', name: 'Thor', pack: 'marvel', rarity: 'legendaire', role: 'Dégâts de zone',
    targeting: 'premier', damage: 189, damagePerLevel: 129, attackInterval: 1.0, range: 3.4,
    rr: { id: 'inquisitor', name: 'Inquisiteur', rarity: 'legendaire' },
    ability: {
      name: 'Mjolnir',
      description: 'Thor inflige des dégâts de zone égaux à 50 % de ses dégâts de base. Chaque coup consécutif sur une même cible augmente les dégâts qu’elle subit de 15 % (600 % au plus). Si Thor change de cible (la cible actuelle est morte ou hors de portée), l’augmentation des dégâts repart de zéro.\nSi le nombre de Thor sur ton plateau est égal à 1, 3, 5 ou 7, ils passent en mode actif : leur intervalle d’attaque passe de 1 s à 0,6 s et leurs attaques de zone infligent 100 % des dégâts. L’augmentation des dégâts est gardée au changement de mode.',
      params: {
        rampPerHit: 0.15, rampMax: 6, areaDamage: 0.5, areaRadius: 1.2,
        activeCounts: 1, activeAttackSpeed: 1 / 0.6, activeAreaDamage: 1,
      },
    },
  },
  {
    // Rush Royale : Mage du portail.
    id: 'strange', name: 'Doctor Strange', pack: 'marvel', rarity: 'epique', role: 'Contrôle',
    targeting: 'premier', damage: 90, attackInterval: 0.8, range: 'globale',
    rr: { id: 'portal-mage', name: 'Mage du portail', rarity: 'epique' },
    ability: {
      name: 'Portail',
      description: 'Chaque tir a 5 % de chance de renvoyer sa cible au début du chemin (sauf boss et volants). La chance est divisée par 2 à chaque nouveau renvoi du même ennemi.',
      params: { teleportChance: 0.05, teleportDecay: 0.5 },
    },
  },
  {
    // Rush Royale : Zélote (dégâts selon le mana en réserve : ×2 vers 1 000, ×3 vers 60 000).
    id: 'venom', name: 'Venom', pack: 'marvel', rarity: 'rare', role: 'Croissance',
    targeting: 'premier', damage: 145, attackInterval: 1.0, range: 2.4,
    rr: { id: 'zealot', name: 'Zélote', rarity: 'rare' },
    ability: {
      name: 'Symbiote',
      description: 'Le symbiote se nourrit de ton mana : plus tu gardes de mana en réserve, plus Venom frappe fort (+68 % avec 100 de mana, ×2 vers 1 000, ×3 vers 60 000). Dépenser le mana l’affaiblit aussitôt.',
      params: { growthPerMana: 1, growthScale: 0.3105, growthExponent: 0.1693 },
    },
  },
  {
    // Rush Royale : Mage de feu.
    id: 'cmarvel', name: 'Captain Marvel', pack: 'marvel', rarity: 'rare', role: 'Dégâts de zone',
    targeting: 'premier', damage: 55, damagePerLevel: 6.2, attackInterval: 0.74, range: 'globale',
    rr: { id: 'fire-mage', name: 'Mage de feu', rarity: 'commune' },
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
    rr: { id: 'knight-statue', name: 'Statue de chevalier', rarity: 'legendaire' },
    ability: {
      name: 'Leader',
      description: 'N’attaque pas. +14 % de vitesse d’attaque par rang aux 4 unités voisines. Avec un nombre pair de Captain America sur le plateau, elles gagnent aussi 5 % de chance de critique par rang (dégâts ×2).',
      params: { auraAttackSpeedPerRank: 0.14, evenCritChancePerRank: 0.05, auraCritMul: 2 },
    },
  },
  {
    // Rush Royale : Arlequin.
    id: 'loki', name: 'Loki', pack: 'marvel', rarity: 'legendaire', role: 'Copieur',
    targeting: 'aleatoire', damage: 60, attackInterval: 0.8, range: 3.4,
    rr: { id: 'harlequin', name: 'Arlequin', rarity: 'legendaire' },
    ability: {
      name: 'Illusion',
      description: 'Copieur : glisse Loki sur une alliée de même rang (autre héros) ; il devient sa copie, avec sa compétence, à −35 % de dégâts (−3,75 points par niveau de collection, −5 % au niveau 9).',
      params: { copyDamageMul: 0.65, copyDamageMulPerLevel: 0.0375 },
    },
  },
  {
    // Rush Royale : Bourreau (épique, premier). Exécute sous 17,5 % (niv. 5) → 29,5 % (niv. 13) des PV, soit
    // 20,5 % au niv. 7 (notre niveau 1) et +1,5 point par niveau ; seuil réduit de moitié contre boss et mini-boss.
    // Dégâts 104 (niv. 5) → 252 (niv. 13) : 141 au niv. 7, +18,5 par niveau. Bucky tireur d'élite : portée globale.
    id: 'bucky', name: 'Soldat de l’hiver', pack: 'marvel', rarity: 'epique', role: 'Exécution',
    targeting: 'premier', damage: 141, damagePerLevel: 18.5, attackInterval: 1.0, range: 'globale',
    rr: { id: 'executioner', name: 'Bourreau', rarity: 'epique' },
    ability: {
      name: 'Bras bionique',
      description: 'Le Soldat de l’hiver achève tout ennemi touché sous 20,5 % de ses PV (+1,5 point par niveau). Contre les boss et les mini-boss, le seuil est réduit de moitié.',
      params: { executeThreshold: 0.205, executeThresholdPerLevel: 0.015, executeBossFactor: 0.5 },
    },
  },
  {
    // Rush Royale : Archer.
    id: 'hawkeye', name: 'Œil de faucon', pack: 'marvel', rarity: 'rare', role: 'Cadence',
    targeting: 'premier', damage: 59, damagePerLevel: 5, attackInterval: 0.45, range: 'globale',
    rr: { id: 'archer', name: 'Archer', rarity: 'commune' },
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
    rr: { id: 'sharpshooter', name: 'Tireur d’élite', rarity: 'rare' },
    ability: {
      name: 'Redwing',
      description: 'Vise l’ennemi qui a le plus de PV. Pendant un boss, Tir fou : dégâts et vitesse d’attaque ×1,5.',
      params: { bossWaveDamageMul: 1.5, bossWaveAttackSpeedMul: 1.5 },
    },
  },
  {
    // Rush Royale : Prêtresse.
    id: 'widow', name: 'Black Widow', pack: 'marvel', rarity: 'rare', role: 'Mana',
    targeting: 'premier', damage: 43, damagePerLevel: 16.6, attackInterval: 0.9, range: 3.4,
    rr: { id: 'priestess', name: 'Prêtresse', rarity: 'rare' },
    ability: {
      name: 'Sacrifice',
      description: 'Fusionnée ou détruite, Black Widow rapporte 80 de mana par rang (rang 6 : 480).',
      params: { sacrificeMana: 1, sacrificeManaPerRank: 80 },
    },
  },
  {
    // Rush Royale : Tonnerre (Thunderer, épique, premier). Chaque attaque lance un éclair en chaîne : dégâts en
    // plus à la cible et aux ennemis derrière elle, autant de cibles que le rang (rang 5 : la cible et 4 derrière),
    // et les étourdit un instant (texte du jeu). Chiffres non publiés (C) : éclair 50 %, étourdissement 0,2 s.
    // Les Dix Anneaux lancés rebondissent d'ennemi en ennemi : portée longue.
    id: 'shangchi', name: 'Shang-Chi', pack: 'marvel', rarity: 'epique', role: 'Dégâts en chaîne',
    targeting: 'premier', damage: 100, attackInterval: 1.0, range: 3.4,
    rr: { id: 'thunderer', name: 'Tonnerre', rarity: 'epique' },
    ability: {
      name: 'Dix Anneaux',
      description: 'Chaque attaque lance les Dix Anneaux en chaîne : 50 % des dégâts en plus à la cible et aux ennemis qui la suivent, autant d’ennemis que son rang (rang 5 : la cible et les 4 suivants), étourdis 0,2 s (sauf boss).',
      params: { thunderDamage: 0.5, thunderTargetsPerRank: 1, thunderDaze: 0.2 },
    },
  },

  // ───────────── Pack Disney ─────────────
  {
    // Rush Royale : Archer du vent.
    id: 'moana', name: 'Vaïana & Pua', pack: 'disney', rarity: 'epique', role: 'Cadence',
    targeting: 'premier', damage: 59, damagePerLevel: 12.2, attackInterval: 0.6, range: 3.4,
    rr: { id: 'wind-archer', name: 'Archer du vent', rarity: 'epique' },
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
    rr: { id: 'boreas', name: 'Borée', rarity: 'legendaire' },
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
    rr: { id: 'banner', name: 'Bannière', rarity: 'rare' },
    ability: {
      name: 'Couleurs du vent',
      description: 'N’attaque pas. +12 % de vitesse d’attaque par rang (+0,5 point par niveau) aux 4 unités voisines.',
      params: { auraAttackSpeedPerRank: 0.12, auraAttackSpeedPerRankPerLevel: 0.005 },
    },
  },
  {
    // Rush Royale : Danse-lames (légendaire, premier). Lames qui volent jusqu'à leur cible → portée longue (dégâts
    // de la table niv. 7 ×1,4/3 : 215 → 100, +98,25 → +45,85 par niveau ; docs/rush-royale-mapping.md « Portées »).
    // Mulan, l'épée à la main, danse entre les ennemis ; Mushu souffle sur les lames.
    id: 'mulan', name: 'Mulan & Mushu', pack: 'disney', rarity: 'legendaire', role: 'Dégâts',
    targeting: 'premier', damage: 100, damagePerLevel: 45.85, attackInterval: 1.2, range: 3.4,
    rr: { id: 'blade-dancer', name: 'Danse-lames', rarity: 'legendaire' },
    ability: {
      name: 'Danse des lames',
      description: 'Sans autre Mulan sur une case voisine, elle danse : +100 % de vitesse d’attaque. Chaque Mulan qui danse donne +10 % de dégâts aux autres Mulan (8 au plus).',
      params: { aloneAttackSpeed: 1, dancerDamage: 0.1, dancerMax: 8 },
    },
  },
  {
    // Rush Royale : Chasseur.
    id: 'merida', name: 'Rebelle', pack: 'disney', rarity: 'rare', role: 'Précision',
    targeting: 'aleatoire', damage: 120, attackInterval: 1.0, range: 'globale',
    rr: { id: 'hunter', name: 'Chasseur', rarity: 'commune' },
    ability: {
      name: 'Première flèche',
      description: 'Le premier tir sur chaque nouvelle cible inflige +210 % de dégâts (+10 points par niveau et par rang au-dessus de 1).',
      params: { firstShotBonus: 2.1, firstShotBonusPerLevel: 0.1, firstShotBonusPerRank: 0.1 },
    },
  },
  {
    // Rush Royale : Stase.
    id: 'ariel', name: 'Ariel & Sébastien', pack: 'disney', rarity: 'legendaire', role: 'Contrôle',
    targeting: 'premier', damage: 60, attackInterval: 1.0, range: 3.4,
    rr: { id: 'stasis', name: 'Stase', rarity: 'legendaire' },
    ability: {
      name: 'Chant de sirène',
      description: 'Toutes les 4 s (1,8 s au rang 7), le chant fige les ennemis autour d’un ennemi au hasard pendant 2,5 s (+0,1 s par niveau ; sauf boss).',
      params: { abilityCooldown: 4, abilityCooldownPerRank: -0.3667, stasisDuration: 2.5, stasisDurationPerLevel: 0.1, stasisRadius: 1 },
    },
  },
  {
    // Rush Royale : Voleur (Rogue, commun, premier) : chaque coup ajoute un bonus aléatoire entre 1 et les
    // dégâts critiques. Morsures au contact → portée courte (dégâts ×3/1,4 de la valeur longue : 70 → 150,
    // arrondis à 140 pour qu'un ennemi de la vague 1 prenne toujours deux coups sans bonus).
    id: 'foxhound', name: 'Rox & Rouky', pack: 'disney', rarity: 'rare', role: 'Critique',
    targeting: 'premier', damage: 140, attackInterval: 0.8, range: 1.6,
    rr: { id: 'rogue', name: 'Voleur', rarity: 'commune' },
    ability: {
      name: 'Ruse du renard',
      description: 'Chaque morsure ajoute un bonus aléatoire de 0 à 200 % des dégâts (dégâts critiques ×3).',
      params: { rogueCritMul: 3 },
    },
  },
  {
    // Rush Royale : Vampire.
    id: 'tiana', name: 'Tiana & Naveen', pack: 'disney', rarity: 'epique', role: 'Mana',
    targeting: 'premier', damage: 40, attackInterval: 1.0, range: 'globale',
    rr: { id: 'vampire', name: 'Vampire', rarity: 'epique' },
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
    rr: { id: 'magic-cauldron', name: 'Chaudron magique', rarity: 'rare' },
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
    id: 'coco', name: 'Coco (Miguel)', pack: 'disney', rarity: 'legendaire', role: 'Booster de fusion',
    targeting: 'premier', damage: 50, attackInterval: 1.0, range: 3.4,
    rr: { id: 'dryad', name: 'Dryade', rarity: 'legendaire' },
    ability: {
      name: 'Remember Me',
      description: 'Booster de fusion : glisse Coco sur une alliée de même rang (y compris un autre Coco) ; Coco disparaît et l’alliée gagne 1 rang.',
      params: { promoteAlly: 1 },
    },
  },
  {
    // Rush Royale : Chimiste.
    id: 'nickjudy', name: 'Nick & Judy', pack: 'disney', rarity: 'rare', role: 'Malus',
    targeting: 'premier', damage: 55, attackInterval: 0.9, range: 2.4,
    rr: { id: 'chemist', name: 'Chimiste', rarity: 'rare' },
    ability: {
      name: 'Arrestation',
      description: 'Vise le premier ennemi qui n’est pas encore fiché : la cible subit +5 % de dégâts par rang (+0,5 point par niveau) jusqu’à sa mort.',
      params: { vulnPerRank: 0.05, vulnPerRankPerLevel: 0.005 },
    },
  },
  {
    // Rush Royale : Ingénieur.
    id: 'buzzwoody', name: 'Buzz & Woody', pack: 'disney', rarity: 'epique', role: 'Dégâts reliés',
    targeting: 'premier', damage: 70, attackInterval: 0.8, range: 3.4,
    rr: { id: 'engineer', name: 'Ingénieur', rarity: 'epique' },
    ability: {
      name: 'Vers l’infini',
      description: 'Les Buzz & Woody posés sur des cases voisines se relient : +5 % de dégâts par autre Buzz & Woody du groupe (+0,5 point par niveau, 10 au plus).',
      params: { formationDamagePerAlly: 0.05, formationDamagePerAllyPerLevel: 0.005, formationMax: 10 },
    },
  },
  {
    // Rush Royale : Meule.
    id: 'rapunzel', name: 'Raiponce & Pascal', pack: 'disney', rarity: 'rare', role: 'Soutien',
    targeting: 'aleatoire', damage: 0, attackInterval: 1.0, range: 2.4,
    rr: { id: 'grindstone', name: 'Meule', rarity: 'rare' },
    ability: {
      name: 'Cheveux magiques',
      description: 'N’attaque pas. +8 % de dégâts par rang aux 4 unités voisines.',
      params: { auraDamagePerRank: 0.08 },
    },
  },
  {
    // Rush Royale : Gardien du portail.
    id: 'vanralph', name: 'Vanellope & Ralph', pack: 'disney', rarity: 'epique', role: 'Échangeur',
    targeting: 'premier', damage: 45, damagePerLevel: 32.2, attackInterval: 0.66, range: 2.4,
    rr: { id: 'portal-keeper', name: 'Gardien du portail', rarity: 'epique' },
    ability: {
      name: 'Glitch',
      description: 'Échangeur : glisse-les sur une alliée de même rang (autre héros), elles échangent leurs cases, sans limite. L’alliée est libérée des effets de boss et de la pénalité de copie ; Vanellope, elle, bugue 2 s (ni attaque, ni fusion).',
      params: { swapAlly: 1, swapSleep: 2, swapCleanse: 1 },
    },
  },

  // ───────────── Pack DC (extension DC Comics) ─────────────
  // Raretés (revue d’octobre 2026, même rareté que l’unité Rush Royale) : 5 Légendaires, 6 Épiques, 4 Rares. Octobre 2026 :
  // profils Rush Royale non utilisés par Marvel et Disney (docs/rush-royale-mapping.md, « Extension DC »).
  {
    // Rush Royale : Chasseur de démons (légendaire, premier ; revue des raretés : le Bourreau, épique, va au Soldat
    // de l'hiver). « Attaque autant de premières cibles que son rang » (conf. B) : les batarangs du chevalier noir.
    // Dégâts du niveau 7 : 270 à portée moyenne (valeur reprise de Ironhide, extension Transformers), +10 %/niveau.
    id: 'batman', name: 'Batman', pack: 'dc', rarity: 'legendaire', role: 'Multi-cibles',
    targeting: 'premier', damage: 270, attackInterval: 1.0, range: 2.4,
    rr: { id: 'demon-hunter', name: 'Chasseur de démons', rarity: 'legendaire' },
    ability: {
      name: 'Batarangs',
      description: 'Chaque attaque lance des batarangs sur les premiers ennemis du chemin : autant d’ennemis que le rang de Batman, 4 au plus.',
      params: { targetsPerRank: 1, targetsMax: 4 },
    },
  },
  {
    // Rush Royale : Givre.
    id: 'superman', name: 'Superman', pack: 'dc', rarity: 'legendaire', role: 'Dégâts / ralentissement',
    targeting: 'fort', damage: 150, attackInterval: 1.0, range: 'globale',
    rr: { id: 'frost', name: 'Givre', rarity: 'legendaire' },
    ability: {
      name: 'Souffle glacial',
      description: 'Toutes les 6 s, le souffle glacial balaie tout le chemin : les ennemis ralentissent de 4 % par rang de Superman pendant 7 s, et le souffle se cumule 3 fois (boss compris).',
      params: { abilityCooldown: 6, blizzardSlowPerRank: 0.04, blizzardStacks: 3, blizzardDuration: 7 },
    },
  },
  {
    // Rush Royale : Moine.
    id: 'wonderwoman', name: 'Wonder Woman', pack: 'dc', rarity: 'legendaire', role: 'Dégâts / zone',
    targeting: 'premier', damage: 170, attackInterval: 1.0, range: 2.4,
    rr: { id: 'monk', name: 'Moine', rarity: 'legendaire' },
    ability: {
      name: 'Fureur amazone',
      description: 'Sans mana : toutes les 12 s, Wonder Woman entre en Fureur pendant 5 s (+60 % de vitesse d’attaque, chaque coup éclabousse à 50 % autour de la cible). Plusieurs Wonder Woman reliées entrent en Fureur ensemble.',
      params: { abilityCooldown: 12, powerDuration: 5, powerSpeed: 0.6, powerSplash: 0.5, powerSplashRadius: 1, powerShared: 1 },
    },
  },
  {
    // Rush Royale : Cultiste.
    id: 'greenlantern', name: 'Green Lantern', pack: 'dc', rarity: 'legendaire', role: 'Formation',
    targeting: 'premier', damage: 132, attackInterval: 0.8, range: 3.4,
    rr: { id: 'cultist', name: 'Cultiste', rarity: 'legendaire' },
    ability: {
      name: 'Corps des Green Lantern',
      description: 'Formation : chaque autre Green Lantern relié (cases voisines) ajoute une cible à son rayon (3 de plus au plus) ; à 5 reliés, ses dégâts doublent.',
      params: { formationTargetsPerAlly: 1, formationTargetsMax: 3, formationDoubleAt: 5, formationDoubleMul: 2, formationMax: 5 },
    },
  },
  {
    // Rush Royale : Cogneur.
    id: 'flash', name: 'Flash', pack: 'dc', rarity: 'epique', role: 'Échangeur / rage',
    targeting: 'premier', damage: 135, attackInterval: 0.6, range: 1.6,
    rr: { id: 'bruiser', name: 'Cogneur', rarity: 'legendaire' },
    ability: {
      name: 'Force véloce',
      description: 'Rage : quand plus de 7 ennemis sont sur le chemin, chaque seconde 10 % de chance par ennemi en plus d’entrer en rage 5 s (vitesse d’attaque ×2, +50 % de dégâts, coups de zone à 50 %). Échangeur : glisse Flash sur une alliée de même rang, ils échangent leurs cases ; ses nouvelles voisines gagnent +20 % de cadence 5 s.',
      params: { abilityCooldown: 1, rageFrom: 8, rageChancePerEnemy: 0.1, rageDuration: 5, rageSpeed: 1, rageDamage: 0.5, rageSplash: 0.5, swapAlly: 1, boost: 0.2, boostDuration: 5 },
    },
  },
  {
    // Rush Royale : Faucheuse.
    id: 'aquaman', name: 'Aquaman', pack: 'dc', rarity: 'epique', role: 'Élimination',
    targeting: 'aleatoire', damage: 140, attackInterval: 1.0, range: 2.4,
    rr: { id: 'reaper', name: 'Faucheuse', rarity: 'epique' },
    ability: {
      name: 'Kraken',
      description: 'Chaque coup a 5,4 % de chance (+0,2 point par niveau) que le kraken engloutisse la cible (sauf boss et lieutenants).',
      params: { reapChance: 0.054, reapChancePerLevel: 0.002 },
    },
  },
  {
    // Rush Royale : Génie.
    id: 'cyborg', name: 'Cyborg', pack: 'dc', rarity: 'epique', role: 'Soutien / vitesse',
    targeting: 'fort', damage: 90, attackInterval: 0.8, range: 'globale',
    rr: { id: 'genie', name: 'Génie', rarity: 'legendaire' },
    ability: {
      name: 'Vortex technologique',
      description: 'Chaque fusion sur ton plateau charge son vortex (10 charges au plus) : +5 % de vitesse d’attaque et de dégâts par charge pour Cyborg. Réseau : ses voisines tirent 15 % plus vite.',
      params: { vortexMax: 10, vortexSpeed: 0.05, vortexDamage: 0.05, auraAttackSpeed: 0.15 },
    },
  },
  {
    // Rush Royale : Barde.
    id: 'supergirl', name: 'Supergirl', pack: 'dc', rarity: 'epique', role: 'Croissance',
    targeting: 'fort', damage: 100, attackInterval: 1.0, range: 3.4,
    rr: { id: 'bard', name: 'Barde', rarity: 'legendaire' },
    ability: {
      name: 'Énergie solaire',
      description: 'Croissance : elle accumule l’énergie du soleil jaune (avec le temps et à chaque élimination), ses dégâts grandissent sans plafond, de plus en plus lentement ; fusionnée, elle transmet la moitié de son bonus. Toutes les 20 s, l’énergie déborde : +20 % de vitesse d’attaque pendant 10 s.',
      params: { growthPerSecond: 0.004, growthPerKill: 0.03, growthScale: 0.28, growthExponent: 0.75, growthKeepOnMerge: 0.5, abilityCooldown: 20, haste: 0.2, hasteDuration: 10 },
    },
  },
  {
    // Rush Royale : Météore (la foudre tombe du ciel → portée longue, dégâts ×1,4/1,7 : 90 → 74).
    id: 'shazam', name: 'Shazam', pack: 'dc', rarity: 'legendaire', role: 'Zone / contrôle',
    targeting: 'aleatoire', damage: 74, attackInterval: 1.0, range: 3.4,
    rr: { id: 'meteor', name: 'Météore', rarity: 'legendaire' },
    ability: {
      name: 'SHAZAM !',
      description: 'Toutes les 8 s (−0,6 s par rang), la foudre tombe sur un ennemi au hasard : 300 % des dégâts dans un rayon de 1 case, et les ennemis touchés sont étourdis 1 s (sauf boss).',
      params: { abilityCooldown: 8, abilityCooldownPerRank: -0.6, meteorDamage: 3, meteorRadius: 1, meteorStun: 1 },
    },
  },
  {
    // Rush Royale : Mime.
    id: 'martian', name: 'Martian Manhunter', pack: 'dc', rarity: 'epique', role: 'Copieur',
    targeting: 'premier', damage: 30, attackInterval: 1.0, range: 3.4,
    rr: { id: 'mime', name: 'Mime', rarity: 'epique' },
    ability: {
      name: 'Métamorphe',
      description: 'Copieur : glisse-le sur une alliée de même rang (autre héros) ; il prend sa forme, avec sa compétence, à −25 % de dégâts. Intangible : insensible à tous les pouvoirs de boss.',
      params: { copyDamageMul: 0.75, intangible: 1 },
    },
  },
  {
    // Rush Royale : Ferrailleur.
    id: 'robin', name: 'Robin', pack: 'dc', rarity: 'rare', role: 'Booster de fusion',
    targeting: 'premier', damage: 140, attackInterval: 0.8, range: 1.6,
    rr: { id: 'scrapper', name: 'Ferrailleur', rarity: 'legendaire' },
    ability: {
      name: 'Passer le relais',
      description: 'Booster de fusion : glisse Robin sur une alliée de même rang (autre héros) ; il disparaît et l’alliée gagne 1 rang, avec 20 % de chance (+2,5 points par niveau) d’en gagner 2.',
      params: { promoteAlly: 1, promoteDoubleChance: 0.2, promoteDoubleChancePerLevel: 0.025 },
    },
  },
  {
    // Rush Royale : Bombardier (batarangs lancés comme les bombes → portée longue, dégâts ×1,4/3 : 130 → 61).
    id: 'batgirl', name: 'Batgirl', pack: 'dc', rarity: 'rare', role: 'Zone',
    targeting: 'premier', damage: 61, attackInterval: 0.8, range: 3.4,
    rr: { id: 'bombardier', name: 'Bombardier', rarity: 'commune' },
    ability: {
      name: 'Batarangs explosifs',
      description: 'Chaque batarang explose : 60 % des dégâts aux ennemis autour de la cible.',
      params: { splash: 0.6, splashRadius: 1 },
    },
  },
  {
    // Rush Royale : Démonologue.
    id: 'catwoman', name: 'Catwoman', pack: 'dc', rarity: 'rare', role: 'Mana',
    targeting: 'aleatoire', damage: 140, attackInterval: 0.7, range: 1.6,
    rr: { id: 'demonologist', name: 'Démonologue', rarity: 'legendaire' },
    ability: {
      name: 'Cambriolage',
      description: 'Mana par élimination : chaque ennemi touché par Catwoman rapporte du mana en plus à sa mort, selon son rang (+2 au rang 1, jusqu’à +16 au rang 7), qui que soit le tueur.',
      params: { manaPerKill: 2 },
    },
  },
  {
    // Rush Royale : Clown.
    id: 'harley', name: 'Harley Quinn', pack: 'dc', rarity: 'epique', role: 'Sacrifice',
    targeting: 'aleatoire', damage: 150, attackInterval: 0.8, range: 1.6,
    rr: { id: 'clown', name: 'Clown', rarity: 'epique' },
    ability: {
      name: 'Grand final',
      description: 'Sacrifice : fusionnée ou détruite, elle tire sa révérence et rapporte du mana selon son rang (10, 25, 45, 70, 100, 140, 190).',
      params: { sacrificeMana: 1 },
    },
  },
  {
    // Rush Royale : Mage de glace.
    id: 'greenarrow', name: 'Green Arrow', pack: 'dc', rarity: 'rare', role: 'Ralentissement',
    targeting: 'premier', damage: 82, attackInterval: 0.5, range: 'globale',
    rr: { id: 'cold-mage', name: 'Mage de glace', rarity: 'commune' },
    ability: {
      name: 'Flèches cryogéniques',
      description: 'Chaque flèche ralentit la cible de 6 % de plus pendant 2 s (30 % au plus).',
      params: { coldSlowPerHit: 0.06, coldMaxSlow: 0.3, coldDuration: 2 },
    },
  },

  // ───────────── Pack Transformers (extension, publication le 25/10) ─────────────
  // 3 Légendaires, 5 Épiques, 7 Rares (liste définitive de docs/roadmap.md). Profils Rush Royale non utilisés
  // par Marvel, Disney et DC (docs/rush-royale-mapping.md, « Extension Transformers »).
  // Mécanique propre : la transformation (src/engine/transformers.ts). Chaque Autobot alterne toutes les
  // `transformEvery` s (ou d'un appui) entre le mode robot (lent et fort, vise le plus de PV : `robotSpeed`,
  // `robotDamage`) et le mode véhicule (rapide, vise le plus avancé : `vehicleSpeed`, `vehicleDamage`).
  {
    // Rush Royale : Banshee (attaque périodique de tous les ennemis proches).
    id: 'optimus', name: 'Optimus Prime', pack: 'transformers', rarity: 'legendaire', role: 'Dégâts de zone / transformation',
    targeting: 'fort', damage: 570, attackInterval: 1.0, range: 2.4,
    rr: { id: 'banshee', name: 'Banshee', rarity: 'legendaire' },
    ability: {
      name: 'Plus qu’il n’y paraît',
      description: 'Robot : la hache d’énergie frappe l’ennemi le plus fort et libère une onde de choc (60 % autour). Camion : charge sur l’ennemi de tête, qui recule d’une demi-case (sauf boss). Toutes les 6 s, cri de ralliement : 150 % des dégâts à tous les ennemis à portée.',
      params: {
        transformEvery: 8, robotSpeed: 0.75, robotDamage: 1.45, vehicleSpeed: 1.6, vehicleDamage: 0.7,
        shockSplash: 0.6, shockRadius: 1.2, chargePush: 0.5, abilityCooldown: 6, rallyDamage: 1.5,
      },
    },
  },
  {
    // Rush Royale : Mage de foudre (3 premières cibles à 100, 70 et 30 %).
    id: 'bumblebee', name: 'Bumblebee', pack: 'transformers', rarity: 'rare', role: 'Échangeur / transformation',
    targeting: 'fort', damage: 70, attackInterval: 0.8, range: 3.4,
    rr: { id: 'lightning-mage', name: 'Mage de foudre', rarity: 'commune' },
    ability: {
      name: 'Éclaireur',
      description: 'Robot : canon du bras. Voiture jaune : rafale sur les 3 premiers ennemis (100, 70 et 30 %). Échangeur : glisse-le sur une alliée de même rang, ils échangent leurs cases ; ses nouvelles voisines gagnent +20 % de vitesse d’attaque 5 s.',
      params: {
        transformEvery: 8, robotSpeed: 0.75, robotDamage: 1.45, vehicleSpeed: 1.6, vehicleDamage: 0.7,
        burstShares: 3, swapAlly: 1, boost: 0.2, boostDuration: 5,
      },
    },
  },
  {
    // Rush Royale : Pyrotechnicien (épique ; revue des raretés : le Chasseur de démons, légendaire, va à Batman).
    // Nombre impair : cadence réduite, cible au hasard, roquettes de zone ; nombre pair : dégâts réduits, cible du mode.
    // Lance-roquettes et canons lourds → portée longue, dégâts ×1,4/1,7 de la table niv. 7 : 229 → 189, +61,7 → +50,8.
    id: 'ironhide', name: 'Ironhide', pack: 'transformers', rarity: 'epique', role: 'Dégâts de zone / transformation',
    targeting: 'fort', damage: 189, damagePerLevel: 50.8, attackInterval: 1.0, range: 3.4,
    rr: { id: 'pyrotechnic', name: 'Pyrotechnicien', rarity: 'epique' },
    ability: {
      name: 'Lance-roquettes',
      description: 'Nombre impair d’Ironhide sur le plateau : cadence ×0,67, cible au hasard et roquettes de 100 % autour de la cible (rayon qui grandit avec le rang). Nombre pair : −40 % de dégâts, sur la cible du mode (robot : le plus de PV ; fourgon : le plus avancé).',
      params: {
        transformEvery: 8, robotSpeed: 0.75, robotDamage: 1.45, vehicleSpeed: 1.6, vehicleDamage: 0.7,
        oddSpeedMul: 0.67, oddSplash: 1, oddRadius: 0.8, oddRadiusPerRank: 0.1, evenDamageMul: 0.6,
      },
    },
  },
  {
    // Rush Royale : Sorcière (en Coop, la fusion enchante une alliée).
    id: 'ratchet', name: 'Ratchet', pack: 'transformers', rarity: 'rare', role: 'Soutien / vitesse',
    targeting: 'fort', damage: 60, attackInterval: 1.0, range: 3.4,
    rr: { id: 'witch', name: 'Sorcière', rarity: 'legendaire' },
    ability: {
      name: 'Médecin des Autobots',
      description: 'Robot : toutes les 4 s, répare ses voisines (elles se libèrent des effets de boss). Ambulance : ses 4 voisines tirent 30 % plus vite. Fusionné, il enchante une alliée au hasard : +25 % de dégâts pendant 10 s.',
      params: {
        transformEvery: 8, robotSpeed: 0.75, robotDamage: 1.45, vehicleSpeed: 1.6, vehicleDamage: 0.7,
        abilityCooldown: 4, auraAttackSpeed: 0.3, auraVehicleOnly: 1, mergeEnchant: 0.25, mergeEnchantDuration: 10,
      },
    },
  },
  {
    // Rush Royale : Loup de mer (déterre des trésors et s'en renforce).
    id: 'jazz', name: 'Jazz', pack: 'transformers', rarity: 'rare', role: 'Mana / transformation',
    targeting: 'fort', damage: 60, attackInterval: 0.9, range: 3.4,
    rr: { id: 'sea-dog', name: 'Loup de mer', rarity: 'legendaire' },
    ability: {
      name: 'Rythme et trésors',
      description: 'Mana par élimination : chaque ennemi touché par Jazz rapporte du mana à sa mort (+1 au rang 1 jusqu’à +8 au rang 7), deux fois plus en voiture de sport. Robot : le projecteur a 15 % de chance d’aveugler la cible (étourdie 0,6 s).',
      params: {
        transformEvery: 8, robotSpeed: 0.75, robotDamage: 1.45, vehicleSpeed: 1.6, vehicleDamage: 0.7,
        manaPerKill: 1, vehicleManaMul: 2, blindChance: 0.15, blindDuration: 0.6,
      },
    },
  },
  {
    // Rush Royale : Cristallomancien (dégâts qui montent à chaque coup sur la même cible). Portée moyenne (blasters du
    // bras et lames ; cristaux tirés), dégâts ×1,7/3 : 150 → 85.
    id: 'arcee', name: 'Arcee', pack: 'transformers', rarity: 'epique', role: 'Critique / transformation',
    targeting: 'fort', damage: 85, attackInterval: 0.8, range: 2.4,
    rr: { id: 'crystalmancer', name: 'Cristallomancien', rarity: 'epique' },
    ability: {
      name: 'Lames d’Arcee',
      description: 'Robot : chaque coup sur la même cible +12 % de dégâts (+120 % au plus) et 20 % de chance de critique ×2. Moto : vise l’ennemi le plus rapide.',
      params: {
        transformEvery: 8, robotSpeed: 0.75, robotDamage: 1.45, vehicleSpeed: 1.6, vehicleDamage: 0.7,
        rampPerHit: 0.12, rampMax: 1.2, bladeCritChance: 0.2, bladeCritMul: 2,
      },
    },
  },
  {
    // Rush Royale : Chaperon rouge (deux formes, la fillette et le loup).
    id: 'grimlock', name: 'Grimlock', pack: 'transformers', rarity: 'legendaire', role: 'Croissance / transformation',
    targeting: 'fort', damage: 490, attackInterval: 1.0, range: 1.6,
    rr: { id: 'riding-hood', name: 'Chaperon rouge', rarity: 'legendaire' },
    ability: {
      name: 'Moi, Grimlock !',
      description: 'Croissance : chaque élimination et chaque seconde le rendent plus fort, sans plafond (de plus en plus lentement) ; fusionné, il garde la moitié de son bonus. Robot : épée et bouclier. Dinobot T-rex : souffle de feu, 60 % autour de la cible et brûlure.',
      params: {
        transformEvery: 8, robotSpeed: 0.75, robotDamage: 1.45, vehicleSpeed: 1.6, vehicleDamage: 0.7,
        growthPerSecond: 0.004, growthPerKill: 0.03, growthScale: 0.28, growthExponent: 0.75, growthKeepOnMerge: 0.5,
        breathSplash: 0.6, breathRadius: 1.2, breathBurn: 0.2,
      },
    },
  },
  {
    // Rush Royale : Corsaire (pièges explosifs, deux sortes de bombes). Portée longue (grenades lancées, bombes du
    // Corsaire), dégâts ×1,4/1,7 : 130 → 107.
    id: 'wheeljack', name: 'Wheeljack', pack: 'transformers', rarity: 'epique', role: 'Booster de fusion',
    targeting: 'fort', damage: 107, attackInterval: 1.0, range: 3.4,
    rr: { id: 'corsair', name: 'Corsaire', rarity: 'legendaire' },
    ability: {
      name: 'Inventions',
      description: 'Booster de fusion : glisse-le sur une alliée de même rang, il disparaît et l’alliée gagne 1 rang. Robot : grenade expérimentale à effet aléatoire (étourdit, ralentit, brûle ou double dégâts). Voiture de course : toutes les 5 s, une mine explose sous l’ennemi de tête (200 % autour).',
      params: {
        transformEvery: 8, robotSpeed: 0.75, robotDamage: 1.45, vehicleSpeed: 1.6, vehicleDamage: 0.7,
        promoteAlly: 1, abilityCooldown: 5, mineDamage: 2, mineRadius: 1,
      },
    },
  },
  {
    // Rush Royale : Blazey (unité de feu).
    id: 'hotrod', name: 'Hot Rod', pack: 'transformers', rarity: 'epique', role: 'Dégâts / brûlure',
    targeting: 'fort', damage: 120, attackInterval: 0.8, range: 2.4,
    rr: { id: 'blazey', name: 'Blazey', rarity: 'legendaire' },
    ability: {
      name: 'Flamme de Rodimus',
      description: 'Robot : tir double (deux coups). Bolide : traînée de flammes, la cible et les ennemis proches brûlent (30 % des dégâts par seconde, 3 s).',
      params: {
        transformEvery: 8, robotSpeed: 0.75, robotDamage: 1.45, vehicleSpeed: 1.6, vehicleDamage: 0.7,
        doubleShot: 1, trailBurn: 0.3, trailRadius: 1, trailDuration: 3,
      },
    },
  },
  {
    // Rush Royale : Sentinelle (dégâts qui montent par paliers de 10 %).
    id: 'elita', name: 'Elita-1', pack: 'transformers', rarity: 'rare', role: 'Précision / malus',
    targeting: 'fort', damage: 85, attackInterval: 0.9, range: 'globale',
    rr: { id: 'sentry', name: 'Sentinelle', rarity: 'rare' },
    ability: {
      name: 'Tir de précision',
      description: 'Robot : chaque tir sur la même cible +10 % de dégâts (+100 % au plus). Voiture : marque l’ennemi le plus fort, qui subit +15 % de dégâts pendant 4 s.',
      params: {
        transformEvery: 8, robotSpeed: 0.75, robotDamage: 1.45, vehicleSpeed: 1.6, vehicleDamage: 0.7,
        rampPerHit: 0.1, rampMax: 1, markValue: 0.15, markDuration: 4,
      },
    },
  },
  {
    // Rush Royale : Gargouille (adaptation C).
    id: 'bulkhead', name: 'Bulkhead', pack: 'transformers', rarity: 'epique', role: 'Sacrifice',
    targeting: 'fort', damage: 130, attackInterval: 1.0, range: 1.6,
    rr: { id: 'gargoyle', name: 'Gargouille', rarity: 'epique' },
    ability: {
      name: 'Démolition',
      description: 'Sacrifice : fusionné ou détruit, il rapporte du mana selon son rang (10, 25, 45, 70, 100, 140, 190). Robot : boulet de démolition, 15 % de chance d’étourdir 0,8 s. Tout-terrain : écrase la cible et les ennemis proches (40 %).',
      params: {
        transformEvery: 8, robotSpeed: 0.75, robotDamage: 1.45, vehicleSpeed: 1.6, vehicleDamage: 0.7,
        sacrificeMana: 1, wreckStunChance: 0.15, wreckStun: 0.8, crushSplash: 0.4,
      },
    },
  },
  {
    // Rush Royale : Lanceur (cible au hasard).
    id: 'sideswipe', name: 'Sideswipe', pack: 'transformers', rarity: 'rare', role: 'Zone / transformation',
    targeting: 'aleatoire', damage: 75, attackInterval: 0.8, range: 2.4,
    rr: { id: 'thrower', name: 'Lanceur', rarity: 'commune' },
    ability: {
      name: 'Lames tournoyantes',
      description: 'Robot : les lames frappent la cible et 40 % autour. Voiture : traverse la cible et les 2 ennemis derrière elle (60 %).',
      params: {
        transformEvery: 8, robotSpeed: 0.75, robotDamage: 1.45, vehicleSpeed: 1.6, vehicleDamage: 0.7,
        bladeSplash: 0.4, pierceTargets: 2, pierceShare: 0.6,
      },
    },
  },
  {
    // Rush Royale : Maléfice (Hex : renforce les 4 voisines).
    id: 'prowl', name: 'Prowl', pack: 'transformers', rarity: 'rare', role: 'Soutien / ralentissement',
    targeting: 'fort', damage: 55, attackInterval: 1.0, range: 'globale',
    rr: { id: 'hex', name: 'Maléfice', rarity: 'legendaire' },
    ability: {
      name: 'Analyse tactique',
      description: 'Robot : ses 4 voisines font +12 % de dégâts. Voiture de police : chaque tir ralentit la cible de 25 % pendant 2 s.',
      params: {
        transformEvery: 8, robotSpeed: 0.75, robotDamage: 1.45, vehicleSpeed: 1.6, vehicleDamage: 0.7,
        auraDamage: 0.12, auraRobotOnly: 1, sirenSlow: 0.25, sirenDuration: 2,
      },
    },
  },
  {
    // Rush Royale : Wukong (clones, adaptation C).
    id: 'mirage', name: 'Mirage', pack: 'transformers', rarity: 'legendaire', role: 'Copieur',
    targeting: 'fort', damage: 95, attackInterval: 0.9, range: 2.4,
    rr: { id: 'wukong', name: 'Wukong', rarity: 'legendaire' },
    ability: {
      name: 'Hologrammes',
      description: 'Copieur : glisse Mirage sur une alliée de même rang (autre héros) ; il devient son hologramme, avec sa compétence, à −25 % de dégâts. Robot : invisible, un coup sur trois est un critique ×2,5. Voiture : ses leurres font reculer la cible 1 s (10 % de chance, sauf boss).',
      params: {
        transformEvery: 8, robotSpeed: 0.75, robotDamage: 1.45, vehicleSpeed: 1.6, vehicleDamage: 0.7,
        copyDamageMul: 0.75, stealthEvery: 3, stealthCritMul: 2.5, decoyChance: 0.1, decoyDuration: 1,
      },
    },
  },
  {
    // Rush Royale : Épées enchantées (épées bleues : bonus de dégâts aux unités).
    id: 'ultramagnus', name: 'Ultra Magnus', pack: 'transformers', rarity: 'legendaire', role: 'Formation / soutien',
    targeting: 'fort', damage: 450, attackInterval: 1.0, range: 2.4,
    rr: { id: 'enchanted-sword', name: 'Épées enchantées', rarity: 'legendaire' },
    ability: {
      name: 'Commandant de la ville',
      description: 'Formation : chaque autre Ultra Magnus relié (cases voisines) lui donne +15 % de dégâts (3 au plus) ; à 3, ses coups touchent aussi autour (50 %). Robot : marteau ; toutes les 12 s, bouclier d’équipe (ses voisines ignorent les pouvoirs de boss 4 s). Porte-voitures : toute sa ligne fait +10 % de dégâts.',
      params: {
        transformEvery: 8, robotSpeed: 0.75, robotDamage: 1.45, vehicleSpeed: 1.6, vehicleDamage: 0.7,
        formationDamagePerAlly: 0.15, formationMax: 3, formationSplashAt: 3, formationSplash: 0.5,
        abilityCooldown: 12, teamShield: 4, rowDamage: 0.1,
      },
    },
  },

  // ───────────── Pack Pixar (extension, publication le 01/11) ─────────────
  // 3 Légendaires, 6 Épiques, 6 Rares (liste définitive de docs/roadmap.md, beaucoup de duos). Profils Rush Royale
  // non utilisés par Marvel, Disney, DC et Transformers (docs/rush-royale-mapping.md, « Extension Pixar »).
  // Mécanique propre : le coup de duo (src/engine/pixar.ts). Toutes les `duoEvery` attaques, le partenaire du duo
  // (Bob, Martin, Russell, Tristesse, Linguini, EVE, Alberto, Pile-Poil, Barley, 22…) ajoute son propre coup.
  {
    // Rush Royale : Valkyrie (adaptation C).
    id: 'mrincredible', name: 'M. Indestructible', pack: 'pixar', rarity: 'legendaire', role: 'Contrôle de zone',
    targeting: 'premier', damage: 420, attackInterval: 1.0, range: 1.6,
    rr: { id: 'valkyrie', name: 'Valkyrie', rarity: 'legendaire' },
    ability: {
      name: 'Coup de poing sismique',
      description: 'Toutes les 7 s, M. Indestructible frappe le sol : toute la ligne du chemin de l’ennemi de tête subit 250 % de ses dégâts et les ennemis sont étourdis 1,2 s (sauf boss).',
      params: { abilityCooldown: 7, lineDamage: 2.5, lineStun: 1.2 },
    },
  },
  {
    // Rush Royale : Rôdeur du crépuscule (Twilight Ranger, adaptation C).
    id: 'elastigirl', name: 'Elastigirl', pack: 'pixar', rarity: 'legendaire', role: 'Tir de tête',
    targeting: 'premier', damage: 160, attackInterval: 0.9, range: 'globale',
    rr: { id: 'twilight-ranger', name: 'Rôdeur du crépuscule', rarity: 'legendaire' },
    ability: {
      name: 'Bras élastiques',
      description: 'Ses bras s’étirent sur tout le chemin : +50 % de dégâts sur l’ennemi de tête, et chaque coup le ralentit de 15 % pendant 1 s.',
      params: { leadBonus: 0.5, leadSlow: 0.15 },
    },
  },
  {
    // Rush Royale : Médecin de peste (épique ; revue des raretés : l'Alchimiste, rare, va à Rémy). Vise le premier
    // ennemi pas encore infecté ; à sa mort, il laisse un nuage (ici, de glace) qui blesse ceux qui passent : on frappe
    // et on ralentit tout de suite les ennemis autour (C). Portée longue (rafales de glace), 107 gardé.
    id: 'frozone', name: 'Frozone', pack: 'pixar', rarity: 'epique', role: 'Ralentissement / zone',
    targeting: 'premier', damage: 107, attackInterval: 1.0, range: 3.4,
    rr: { id: 'plague-doctor', name: 'Médecin de peste', rarity: 'epique' },
    ability: {
      name: 'Nuage de glace',
      description: 'Vise le premier ennemi qui n’est pas encore gelé et le gèle. Quand un ennemi gelé meurt, il éclate en nuage de glace : 150 % des dégâts du coup et 45 % de ralentissement pendant 3 s aux ennemis à 1,2 case.',
      params: { plagueCloud: 1.5, plagueRadius: 1.2, plagueSlow: 0.45, plagueSlowDuration: 3 },
    },
  },
  {
    // Rush Royale : Maître des esprits (dégâts, améliorations).
    id: 'violetflash', name: 'Violette & Flèche', pack: 'pixar', rarity: 'rare', role: 'Échangeur',
    targeting: 'premier', damage: 115, attackInterval: 0.6, range: 1.6,
    rr: { id: 'spirit-master', name: 'Maître des esprits', rarity: 'legendaire' },
    ability: {
      name: 'Champ de force',
      description: 'Échangeur : glisse-les sur une alliée de même rang, elles échangent leurs cases ; Violette protège l’alliée par un champ de force (insensible aux pouvoirs de boss 3 s). Coup de duo (1 attaque sur 3) : Flèche frappe deux fois de plus.',
      params: { swapAlly: 1, swapShield: 3, duoEvery: 3, dashHits: 2 },
    },
  },
  {
    // Rush Royale : Chaman (étourdit à la fusion).
    id: 'sullimike', name: 'Sulli & Bob', pack: 'pixar', rarity: 'epique', role: 'Mana / recul',
    targeting: 'premier', damage: 150, attackInterval: 1.0, range: 2.4,
    rr: { id: 'shaman', name: 'Chaman', rarity: 'legendaire' },
    ability: {
      name: 'Rugissement',
      description: 'Mana par élimination : Bob compte les points, chaque ennemi touché rapporte du mana à sa mort (+2 au rang 1, jusqu’à +12 au rang 7). Toutes les 8 s, Sulli rugit : les ennemis à portée reculent d’une case (sauf boss).',
      params: { manaPerKill: 1.5, abilityCooldown: 8, roarPush: 1 },
    },
  },
  {
    // Rush Royale : Dryade des montagnes (Mountain Avens, adaptation C).
    id: 'mcqueen', name: 'Flash McQueen & Martin', pack: 'pixar', rarity: 'rare', role: 'Soutien / vitesse',
    targeting: 'premier', damage: 140, attackInterval: 0.8, range: 2.4,
    rr: { id: 'mountain-avens', name: 'Dryade des montagnes', rarity: 'legendaire' },
    ability: {
      name: 'Turbo',
      description: 'Boost de vitesse : ses 4 voisines tirent 25 % plus vite. Coup de duo (1 attaque sur 5) : Martin remorque la cible en arrière pendant 1 s (sauf boss).',
      params: { auraAttackSpeed: 0.25, duoEvery: 5, towDuration: 1 },
    },
  },
  {
    // Rush Royale : Invocateur (la fusion invoque une unité).
    id: 'carlrussell', name: 'Carl & Russell', pack: 'pixar', rarity: 'rare', role: 'Booster de fusion',
    targeting: 'premier', damage: 135, attackInterval: 1.0, range: 3.4,
    rr: { id: 'summoner', name: 'Invocateur', rarity: 'legendaire' },
    ability: {
      name: 'Ballons',
      description: 'Booster de fusion : glisse-les sur une alliée de même rang, ils disparaissent et l’alliée gagne 1 rang. Toutes les 6 s, les ballons soulèvent un ennemi au hasard hors du chemin pendant 2 s (sauf boss).',
      params: { promoteAlly: 1, abilityCooldown: 6, liftDuration: 2 },
    },
  },
  {
    // Rush Royale : Empoisonneur (poison qui monte avec le rang).
    id: 'joysadness', name: 'Joie & Tristesse', pack: 'pixar', rarity: 'rare', role: 'Copieur',
    targeting: 'premier', damage: 110, attackInterval: 0.9, range: 3.4,
    rr: { id: 'poisoner', name: 'Empoisonneur', rarity: 'commune' },
    ability: {
      name: 'Souvenirs',
      description: 'Copieur : glisse-les sur une alliée de même rang (autre héros) ; elles en deviennent le souvenir, à −25 % de dégâts. Tristesse empoisonne : chaque coup inflige 8 % des dégâts par seconde et par rang pendant 3 s. Coup de duo (1 sur 4) : un souvenir au hasard, doré (+20 % de dégâts à une alliée 5 s) ou bleu (cible ralentie de 40 % 2 s).',
      params: { copyDamageMul: 0.75, poisonPerRank: 0.08, poisonDuration: 3, duoEvery: 4, memoryBuff: 0.2, memorySlow: 0.4 },
    },
  },
  {
    // Rush Royale : Alchimiste (rare ; revue des raretés : le Médecin de peste, épique, va à Frozone). Flaques d'acide
    // périodiques sur le chemin, dégâts selon le rang (ici, la soupe renversée) ; archétype Sacrifice gardé (C).
    id: 'remy', name: 'Rémy & Linguini', pack: 'pixar', rarity: 'rare', role: 'Sacrifice / mana',
    targeting: 'premier', damage: 135, attackInterval: 0.9, range: 2.4,
    rr: { id: 'alchemist', name: 'Alchimiste', rarity: 'rare' },
    ability: {
      name: 'Recette',
      description: 'Sacrifice : fusionné ou détruit, rapporte du mana selon son rang (10, 25, 45, 70, 100, 140, 190). Recette : +4 de mana par rang au début de chaque vague. Coup de duo (1 sur 4) : Linguini renverse la soupe sur un ennemi au hasard, 50 % des dégâts par rang autour de lui.',
      params: { sacrificeMana: 1, waveManaPerRank: 4, duoEvery: 4, puddleDamage: 0.5, puddleRadius: 1 },
    },
  },
  {
    // Rush Royale : Robot (adaptation C).
    id: 'walleeve', name: 'WALL-E & EVE', pack: 'pixar', rarity: 'legendaire', role: 'Dégâts / rayon',
    targeting: 'premier', damage: 360, attackInterval: 1.0, range: 'globale',
    rr: { id: 'robot', name: 'Robot', rarity: 'legendaire' },
    ability: {
      name: 'Directive',
      description: 'WALL-E lance des cubes compactés. Coup de duo (1 attaque sur 3) : le rayon d’EVE frappe la cible et tous les ennemis à 1,5 case autour (150 %).',
      params: { duoEvery: 3, eveDamage: 1.5, eveRadius: 1.5 },
    },
  },
  {
    // Rush Royale : Tréant (adaptation C).
    id: 'lucaalberto', name: 'Luca & Alberto', pack: 'pixar', rarity: 'rare', role: 'Formation',
    targeting: 'premier', damage: 125, attackInterval: 0.8, range: 2.4,
    rr: { id: 'treant', name: 'Tréant', rarity: 'legendaire' },
    ability: {
      name: 'Silenzio, Bruno !',
      description: 'Formation : chaque autre Luca & Alberto relié (cases voisines) lui donne +15 % de dégâts (3 au plus) ; à 3, ses coups touchent aussi autour (50 %). Coup de duo (1 sur 5) : une vague de mer fait reculer la cible d’une demi-case (sauf boss).',
      params: { formationDamagePerAlly: 0.15, formationMax: 3, formationSplashAt: 3, formationSplash: 0.5, duoEvery: 5, wavePush: 0.5 },
    },
  },
  {
    // Rush Royale : Élémentaire de terre (dégâts qui montent à chaque coup).
    id: 'mei', name: 'Mei (panda roux)', pack: 'pixar', rarity: 'epique', role: 'Croissance',
    targeting: 'premier', damage: 170, attackInterval: 1.0, range: 1.6,
    rr: { id: 'earth-elemental', name: 'Élémentaire de terre', rarity: 'legendaire' },
    ability: {
      name: 'Panda géant',
      description: 'Croissance : chaque élimination et chaque seconde rendent le panda plus grand, sans plafond (de plus en plus lentement) ; fusionnée, elle garde la moitié de son bonus. Chaque coup écrase aussi les ennemis autour (50 %).',
      params: { growthPerSecond: 0.004, growthPerKill: 0.03, growthScale: 0.28, growthExponent: 0.75, growthKeepOnMerge: 0.5, crushSplash: 0.5 },
    },
  },
  {
    // Rush Royale : Lierre (malus et graines).
    id: 'jessie', name: 'Jessie & Pile-Poil', pack: 'pixar', rarity: 'epique', role: 'Contrôle / malus',
    targeting: 'premier', damage: 135, attackInterval: 0.8, range: 2.4,
    rr: { id: 'ivy', name: 'Lierre', rarity: 'epique' },
    ability: {
      name: 'Lasso',
      description: 'Chaque coup marque la cible : +10 % de dégâts subis pendant 4 s. Coup de duo (1 sur 4) : Jessie lance son lasso et Pile-Poil galope, la cible recule pendant 1,5 s (sauf boss).',
      params: { lassoMark: 0.1, lassoMarkDuration: 4, duoEvery: 4, lassoPull: 1.5 },
    },
  },
  {
    // Rush Royale : Archimage (adaptation C).
    id: 'ianbarley', name: 'Ian & Barley', pack: 'pixar', rarity: 'epique', role: 'Sorts aléatoires',
    targeting: 'premier', damage: 140, attackInterval: 1.0, range: 3.4,
    rr: { id: 'archmage', name: 'Archimage', rarity: 'legendaire' },
    ability: {
      name: 'Bâton magique',
      description: 'Toutes les 6 s, un sort au hasard : boule de feu (300 % autour d’un ennemi), arrêt du temps (ennemis à portée étourdis 1,5 s), sort de croissance (+30 % de dégâts à une alliée 8 s) ou rayon (200 % à 3 ennemis).',
      params: { abilityCooldown: 6, fireball: 3, freeze: 1.5, growBuff: 0.3, growDuration: 8, rayDamage: 2, rayTargets: 3 },
    },
  },
  {
    // Rush Royale : Nécromancien (adaptation C).
    id: 'joe', name: 'Joe & 22', pack: 'pixar', rarity: 'legendaire', role: 'Soutien / galvanisation',
    targeting: 'premier', damage: 260, attackInterval: 0.8, range: 3.4,
    rr: { id: 'necromancer', name: 'Nécromancien', rarity: 'legendaire' },
    ability: {
      name: 'Musique de l’âme',
      description: 'Toutes les 10 s, Joe joue : toutes tes unités gagnent +25 % de vitesse d’attaque pendant 5 s. Coup de duo (1 sur 5) : l’étincelle de 22 double les dégâts du coup.',
      params: { abilityCooldown: 10, jazzHaste: 0.25, jazzDuration: 5, duoEvery: 5, sparkMul: 2 },
    },
  },
];


export const UNITS: Record<UnitId, UnitDef> = Object.fromEntries(UNIT_LIST.map((u) => [u.id, u])) as Record<UnitId, UnitDef>;

export const UNIT_IDS: UnitId[] = UNIT_LIST.map((u) => u.id);

/**
 * Héros dont l'unité Rush Royale n'a pas la même rareté (docs/rush-royale-mapping.md, « Raretés ») : Rush Royale n'a
 * que 9 communes, 9 rares et 16 épiques pour 73 héros. Chaque écart est justifié ; aucun dans la version de base.
 */
export const RR_RARITY_GAPS: Partial<Record<string, string>> = {
  // Extension DC : plus aucune unité épique, rare ou commune libre qui colle au personnage, et changer leur rareté
  // déséquilibrerait le pack (déjà 5 Légendaires).
  flash: 'Épique sur le Cogneur (légendaire) : aucune épique libre ; archétype Échangeur gardé.',
  cyborg: 'Épique sur le Génie (légendaire) : aucune épique libre ; archétype Boost de vitesse gardé.',
  supergirl: 'Épique sur le Barde (légendaire) : aucune épique libre ; archétype Croissance gardé.',
  robin: 'Rare sur le Ferrailleur (légendaire) : seul profil Rush Royale qui fait monter un allié de rang (Booster de fusion).',
  catwoman: 'Rare sur la Démonologue (légendaire) : seul profil Rush Royale de mana par élimination encore libre.',
  // Extension Transformers : même manque d'épiques et de rares libres ; changer ces raretés donnerait 8 Légendaires.
  wheeljack: 'Épique sur le Corsaire (légendaire) : aucune épique libre (pièges explosifs de l’inventeur).',
  hotrod: 'Épique sur Blazey (rareté non vérifiée, supposée légendaire) : aucune épique libre.',
  ratchet: 'Rare sur la Sorcière (légendaire) : aucune rare ou commune libre (la fusion enchante une alliée).',
  jazz: 'Rare sur le Loup de mer (légendaire) : aucune rare ou commune libre.',
  prowl: 'Rare sur le Maléfice (légendaire) : aucune rare ou commune libre (renforce les 4 voisines).',
  // Extension Pixar : plus aucune unité épique, rare ou commune libre ; Élémentaire de terre, Archimage et
  // Nécromancien sont des adaptations (unités non trouvées dans une source, rareté supposée légendaire).
  sullimike: 'Épique sur le Chaman (légendaire) : aucune épique libre.',
  mei: 'Épique sur l’Élémentaire de terre (rareté non vérifiée) : aucune épique libre.',
  ianbarley: 'Épique sur l’Archimage (rareté non vérifiée) : aucune épique libre.',
  violetflash: 'Rare sur le Maître des esprits (légendaire) : aucune rare ou commune libre.',
  mcqueen: 'Rare sur la Dryade des montagnes (légendaire) : aucune rare ou commune libre.',
  carlrussell: 'Rare sur l’Invocateur (légendaire) : aucune rare ou commune libre.',
  lucaalberto: 'Rare sur le Tréant (légendaire) : aucune rare ou commune libre.',
};

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

/**
 * Decks de référence de l'extension Transformers (simulateur, docs/equilibrage.md). Le deck de départ
 * reste Marvel ou Disney : `tf-rares` sert de témoin « deck de départ » pour les Autobots.
 */
export const TF_REFERENCE_DECKS: Record<'tf-rares' | 'meta-tf' | 'autobots' | 'machines', UnitId[]> = {
  'tf-rares': ['bumblebee', 'jazz', 'elita', 'bulkhead', 'sideswipe'],
  'meta-tf': ['optimus', 'grimlock', 'ultramagnus', 'ironhide', 'ratchet'],
  autobots: ['optimus', 'bumblebee', 'ironhide', 'ratchet', 'jazz'],
  machines: ['ironman', 'optimus', 'grimlock', 'thor', 'ratchet'],
};

/** Decks de référence de l'extension Pixar (simulateur, docs/equilibrage.md). */
export const PIXAR_REFERENCE_DECKS: Record<'pixar-rares' | 'meta-pixar' | 'indestructibles' | 'toy-story', UnitId[]> = {
  'pixar-rares': ['violetflash', 'mcqueen', 'carlrussell', 'remy', 'jessie'],
  'meta-pixar': ['mrincredible', 'walleeve', 'joe', 'frozone', 'mcqueen'],
  indestructibles: ['mrincredible', 'elastigirl', 'frozone', 'violetflash', 'mcqueen'],
  'toy-story': ['buzzwoody', 'jessie', 'walleeve', 'joe', 'mcqueen'],
};
