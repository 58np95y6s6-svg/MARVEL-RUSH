// Données des 28 unités. Octobre 2026 : chaque héros reprend le profil d'une unité Rush Royale
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
];

export const UNITS: Record<UnitId, UnitDef> = Object.fromEntries(UNIT_LIST.map((u) => [u.id, u])) as Record<UnitId, UnitDef>;

export const UNIT_IDS: UnitId[] = UNIT_LIST.map((u) => u.id);

/**
 * Héros dont l'unité Rush Royale n'a pas la même rareté (docs/rush-royale-mapping.md, « Raretés ») : Rush Royale n'a
 * que 9 communes, 9 rares et 16 épiques pour 73 héros. Chaque écart est justifié ; aucun dans la version de base.
 */
export const RR_RARITY_GAPS: Partial<Record<string, string>> = {};

/** Decks de départ (§6.1). */
export const STARTER_DECKS: Record<'marvel' | 'disney', UnitId[]> = {
  marvel: ['spiderman', 'hawkeye', 'falcon', 'cmarvel', 'widow'],
  disney: ['pocahontas', 'merida', 'tiana', 'nemo', 'foxhound'],
};
