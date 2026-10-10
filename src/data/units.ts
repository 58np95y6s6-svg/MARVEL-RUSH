// Données des 43 unités (28 Marvel et Disney, 15 DC). Octobre 2026 : chaque héros reprend le profil d'une unité Rush Royale
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
    // Rush Royale : Inquisiteur (fiche de l'unité : 834 dégâts au niveau 12, +129 par niveau → 189 au niveau 7,
    // notre niveau 1 ; ensuite +129 par niveau de collection, comme la fiche). Intervalle 1 s, 0,6 s actif.
    id: 'thor', name: 'Thor', pack: 'marvel', rarity: 'legendaire', role: 'Dégâts de zone',
    targeting: 'premier', damage: 189, damagePerLevel: 129, attackInterval: 1.0, range: 3.4,
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
    ability: {
      name: 'Portail',
      description: 'Chaque tir a 5 % de chance de renvoyer sa cible au début du chemin (sauf boss et volants). La chance est divisée par 2 à chaque nouveau renvoi du même ennemi.',
      params: { teleportChance: 0.05, teleportDecay: 0.5 },
    },
  },
  {
    // Rush Royale : Zélote (dégâts selon le mana en réserve : ×2 vers 1 000, ×3 vers 60 000).
    id: 'venom', name: 'Venom', pack: 'marvel', rarity: 'epique', role: 'Croissance',
    targeting: 'premier', damage: 145, attackInterval: 1.0, range: 2.4,
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
    // Rush Royale : Voleur (Bucky tireur d'élite → portée globale, dégâts ÷1,4 : 70 → 50).
    id: 'bucky', name: 'Soldat de l’hiver', pack: 'marvel', rarity: 'epique', role: 'Critique',
    targeting: 'premier', damage: 50, attackInterval: 0.8, range: 'globale',
    ability: {
      name: 'Bras bionique',
      description: 'Chaque coup ajoute un bonus aléatoire de 0 à 200 % des dégâts (dégâts critiques ×3).',
      params: { rogueCritMul: 3 },
    },
  },
  {
    // Rush Royale : Archer.
    id: 'hawkeye', name: 'Œil de faucon', pack: 'marvel', rarity: 'rare', role: 'Cadence',
    targeting: 'premier', damage: 59, damagePerLevel: 5, attackInterval: 0.45, range: 'globale',
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
    targeting: 'premier', damage: 43, damagePerLevel: 16.6, attackInterval: 0.9, range: 3.4,
    ability: {
      name: 'Sacrifice',
      description: 'Fusionnée ou détruite, Black Widow rapporte 80 de mana par rang (rang 6 : 480).',
      params: { sacrificeMana: 1, sacrificeManaPerRank: 80 },
    },
  },
  {
    // Rush Royale : Danse-lames (lames lancées → portée longue, dégâts ×1,4/3 de la table niv. 7 : 215 → 100,
    // +98,25 → +45,85 par niveau ; docs/rush-royale-mapping.md « Portées »).
    id: 'shangchi', name: 'Shang-Chi', pack: 'marvel', rarity: 'epique', role: 'Dégâts',
    targeting: 'premier', damage: 100, damagePerLevel: 45.85, attackInterval: 1.2, range: 3.4,
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
    targeting: 'premier', damage: 59, damagePerLevel: 12.2, attackInterval: 0.6, range: 3.4,
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
    // Rush Royale : Pyrotechnicien (fusées → portée longue, dégâts ×1,4/1,7 : 229 → 189, +61,7 → +50,8 par niveau).
    id: 'mulan', name: 'Mulan & Mushu', pack: 'disney', rarity: 'legendaire', role: 'Dégâts de zone',
    targeting: 'premier', damage: 189, damagePerLevel: 50.8, attackInterval: 1.0, range: 3.4,
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
      description: 'Booster de fusion : glisse Coco sur une alliée de même rang (y compris un autre Coco) ; Coco disparaît et l’alliée gagne 1 rang.',
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
    targeting: 'premier', damage: 45, damagePerLevel: 32.2, attackInterval: 0.66, range: 2.4,
    ability: {
      name: 'Glitch',
      description: 'Échangeur : glisse-les sur une alliée de même rang (autre héros), elles échangent leurs cases, sans limite. L’alliée est libérée des effets de boss et de la pénalité de copie ; Vanellope, elle, bugue 2 s (ni attaque, ni fusion).',
      params: { swapAlly: 1, swapSleep: 2, swapCleanse: 1 },
    },
  },

  // ───────────── Pack DC (extension DC Comics) ─────────────
  // Répartition des raretés comme les autres packs : 4 Légendaires, 6 Épiques, 5 Rares. Octobre 2026 :
  // profils Rush Royale non utilisés par Marvel et Disney (docs/rush-royale-mapping.md, « Extension DC »).
  {
    // Rush Royale : Bourreau.
    id: 'batman', name: 'Batman', pack: 'dc', rarity: 'legendaire', role: 'Exécution',
    targeting: 'premier', damage: 200, attackInterval: 1.0, range: 2.4,
    ability: {
      name: 'Justicier',
      description: 'Batman met hors d’état de nuire tout ennemi touché sous 20,5 % de ses PV (+1,5 point par niveau). Contre les boss et les lieutenants, le seuil est réduit de moitié.',
      params: { executeThreshold: 0.205, executeThresholdPerLevel: 0.015, executeBossFactor: 0.5 },
    },
  },
  {
    // Rush Royale : Givre.
    id: 'superman', name: 'Superman', pack: 'dc', rarity: 'legendaire', role: 'Dégâts / ralentissement',
    targeting: 'fort', damage: 150, attackInterval: 1.0, range: 'globale',
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
    ability: {
      name: 'Énergie solaire',
      description: 'Croissance : elle accumule l’énergie du soleil jaune (avec le temps et à chaque élimination), ses dégâts grandissent sans plafond, de plus en plus lentement ; fusionnée, elle transmet la moitié de son bonus. Toutes les 20 s, l’énergie déborde : +20 % de vitesse d’attaque pendant 10 s.',
      params: { growthPerSecond: 0.004, growthPerKill: 0.03, growthScale: 0.28, growthExponent: 0.75, growthKeepOnMerge: 0.5, abilityCooldown: 20, haste: 0.2, hasteDuration: 10 },
    },
  },
  {
    // Rush Royale : Météore (la foudre tombe du ciel → portée longue, dégâts ×1,4/1,7 : 90 → 74).
    id: 'shazam', name: 'Shazam', pack: 'dc', rarity: 'epique', role: 'Zone / contrôle',
    targeting: 'aleatoire', damage: 74, attackInterval: 1.0, range: 3.4,
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
    ability: {
      name: 'Cambriolage',
      description: 'Mana par élimination : chaque ennemi touché par Catwoman rapporte du mana en plus à sa mort, selon son rang (+2 au rang 1, jusqu’à +16 au rang 7), qui que soit le tueur.',
      params: { manaPerKill: 2 },
    },
  },
  {
    // Rush Royale : Clown.
    id: 'harley', name: 'Harley Quinn', pack: 'dc', rarity: 'rare', role: 'Sacrifice',
    targeting: 'aleatoire', damage: 150, attackInterval: 0.8, range: 1.6,
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
    ability: {
      name: 'Flèches cryogéniques',
      description: 'Chaque flèche ralentit la cible de 6 % de plus pendant 2 s (30 % au plus).',
      params: { coldSlowPerHit: 0.06, coldMaxSlow: 0.3, coldDuration: 2 },
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
