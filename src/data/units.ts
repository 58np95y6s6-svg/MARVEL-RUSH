// Données des 43 unités (28 Marvel et Disney, 15 Pixar). Octobre 2026 : chaque héros reprend le profil d'une unité Rush Royale
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
    // Rush Royale : Inquisiteur (fiche de l'unité : 834 dégâts au niveau 12, +129 par niveau → 189 au niveau 7,
    // notre niveau 1 ; ensuite +10 % par niveau de collection comme toutes les unités). Intervalle 1 s, 0,6 s actif.
    id: 'thor', name: 'Thor', pack: 'marvel', rarity: 'legendaire', role: 'Dégâts de zone',
    targeting: 'premier', damage: 189, attackInterval: 1.0, range: 3.4,
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
  // ───────────── Pack Pixar (extension, publication le 01/11) ─────────────
  // 3 Légendaires, 6 Épiques, 6 Rares (liste définitive de docs/roadmap.md, beaucoup de duos). Profils Rush Royale
  // non utilisés par Marvel, Disney, DC et Transformers (docs/rush-royale-mapping.md, « Extension Pixar »).
  // Mécanique propre : le coup de duo (src/engine/pixar.ts). Toutes les `duoEvery` attaques, le partenaire du duo
  // (Bob, Martin, Russell, Tristesse, Linguini, EVE, Alberto, Pile-Poil, Barley, 22…) ajoute son propre coup.
  {
    // Rush Royale : Valkyrie (adaptation C).
    id: 'mrincredible', name: 'M. Indestructible', pack: 'pixar', rarity: 'legendaire', role: 'Contrôle de zone',
    targeting: 'premier', damage: 420, attackInterval: 1.0, range: 1.6,
    ability: {
      name: 'Coup de poing sismique',
      description: 'Toutes les 7 s, M. Indestructible frappe le sol : toute la ligne du chemin de l’ennemi de tête subit 250 % de ses dégâts et les ennemis sont étourdis 1,2 s (sauf boss).',
      params: { abilityCooldown: 7, lineDamage: 2.5, lineStun: 1.2 },
    },
  },
  {
    // Rush Royale : Rôdeur du crépuscule (Twilight Ranger, adaptation C).
    id: 'elastigirl', name: 'Elastigirl', pack: 'pixar', rarity: 'epique', role: 'Tir de tête',
    targeting: 'premier', damage: 160, attackInterval: 0.9, range: 'globale',
    ability: {
      name: 'Bras élastiques',
      description: 'Ses bras s’étirent sur tout le chemin : +50 % de dégâts sur l’ennemi de tête, et chaque coup le ralentit de 15 % pendant 1 s.',
      params: { leadBonus: 0.5, leadSlow: 0.15 },
    },
  },
  {
    // Rush Royale : Alchimiste (flaque périodique sur le chemin).
    id: 'frozone', name: 'Frozone', pack: 'pixar', rarity: 'epique', role: 'Ralentissement / zone',
    targeting: 'premier', damage: 130, attackInterval: 1.0, range: 2.4,
    ability: {
      name: 'Pont de glace',
      description: 'Toutes les 5 s, un pont de glace gèle le chemin autour de l’ennemi de tête : 120 % des dégâts et 45 % de ralentissement pendant 3 s.',
      params: { abilityCooldown: 5, iceDamage: 1.2, iceSlow: 0.45, iceDuration: 3, iceRadius: 1.2 },
    },
  },
  {
    // Rush Royale : Maître des esprits (dégâts, améliorations).
    id: 'violetflash', name: 'Violette & Flèche', pack: 'pixar', rarity: 'rare', role: 'Échangeur',
    targeting: 'premier', damage: 75, attackInterval: 0.6, range: 1.6,
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
    ability: {
      name: 'Rugissement',
      description: 'Mana par élimination : Bob compte les points, chaque ennemi touché rapporte du mana à sa mort (+2 au rang 1, jusqu’à +12 au rang 7). Toutes les 8 s, Sulli rugit : les ennemis à portée reculent d’une case (sauf boss).',
      params: { manaPerKill: 1.5, abilityCooldown: 8, roarPush: 1 },
    },
  },
  {
    // Rush Royale : Dryade des montagnes (Mountain Avens, adaptation C).
    id: 'mcqueen', name: 'Flash McQueen & Martin', pack: 'pixar', rarity: 'rare', role: 'Soutien / vitesse',
    targeting: 'premier', damage: 90, attackInterval: 0.8, range: 2.4,
    ability: {
      name: 'Turbo',
      description: 'Boost de vitesse : ses 4 voisines tirent 25 % plus vite. Coup de duo (1 attaque sur 5) : Martin remorque la cible en arrière pendant 1 s (sauf boss).',
      params: { auraAttackSpeed: 0.25, duoEvery: 5, towDuration: 1 },
    },
  },
  {
    // Rush Royale : Invocateur (la fusion invoque une unité).
    id: 'carlrussell', name: 'Carl & Russell', pack: 'pixar', rarity: 'rare', role: 'Booster de fusion',
    targeting: 'premier', damage: 85, attackInterval: 1.0, range: 3.4,
    ability: {
      name: 'Ballons',
      description: 'Booster de fusion : glisse-les sur une alliée de même rang, ils disparaissent et l’alliée gagne 1 rang. Toutes les 6 s, les ballons soulèvent un ennemi au hasard hors du chemin pendant 2 s (sauf boss).',
      params: { promoteAlly: 1, abilityCooldown: 6, liftDuration: 2 },
    },
  },
  {
    // Rush Royale : Empoisonneur (poison qui monte avec le rang).
    id: 'joysadness', name: 'Joie & Tristesse', pack: 'pixar', rarity: 'epique', role: 'Copieur',
    targeting: 'premier', damage: 110, attackInterval: 0.9, range: 3.4,
    ability: {
      name: 'Souvenirs',
      description: 'Copieur : glisse-les sur une alliée de même rang (autre héros) ; elles en deviennent le souvenir, à −25 % de dégâts. Tristesse empoisonne : chaque coup inflige 8 % des dégâts par seconde et par rang pendant 3 s. Coup de duo (1 sur 4) : un souvenir au hasard, doré (+20 % de dégâts à une alliée 5 s) ou bleu (cible ralentie de 40 % 2 s).',
      params: { copyDamageMul: 0.75, poisonPerRank: 0.08, poisonDuration: 3, duoEvery: 4, memoryBuff: 0.2, memorySlow: 0.4 },
    },
  },
  {
    // Rush Royale : Médecin de peste (nuage).
    id: 'remy', name: 'Rémy & Linguini', pack: 'pixar', rarity: 'rare', role: 'Sacrifice / mana',
    targeting: 'premier', damage: 90, attackInterval: 0.9, range: 2.4,
    ability: {
      name: 'Recette',
      description: 'Sacrifice : fusionné ou détruit, rapporte du mana selon son rang (10, 25, 45, 70, 100, 140, 190). Recette : +4 de mana par rang au début de chaque vague. Coup de duo (1 sur 4) : Linguini renverse la marmite, 60 % des dégâts autour de la cible.',
      params: { sacrificeMana: 1, waveManaPerRank: 4, duoEvery: 4, potSplash: 0.6 },
    },
  },
  {
    // Rush Royale : Robot (adaptation C).
    id: 'walleeve', name: 'WALL-E & EVE', pack: 'pixar', rarity: 'legendaire', role: 'Dégâts / rayon',
    targeting: 'premier', damage: 360, attackInterval: 1.0, range: 'globale',
    ability: {
      name: 'Directive',
      description: 'WALL-E lance des cubes compactés. Coup de duo (1 attaque sur 3) : le rayon d’EVE frappe la cible et tous les ennemis à 1,5 case autour (150 %).',
      params: { duoEvery: 3, eveDamage: 1.5, eveRadius: 1.5 },
    },
  },
  {
    // Rush Royale : Tréant (adaptation C).
    id: 'lucaalberto', name: 'Luca & Alberto', pack: 'pixar', rarity: 'rare', role: 'Formation',
    targeting: 'premier', damage: 90, attackInterval: 0.8, range: 2.4,
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
    ability: {
      name: 'Panda géant',
      description: 'Croissance : chaque élimination et chaque seconde rendent le panda plus grand, sans plafond (de plus en plus lentement) ; fusionnée, elle garde la moitié de son bonus. Chaque coup écrase aussi les ennemis autour (50 %).',
      params: { growthPerSecond: 0.004, growthPerKill: 0.03, growthScale: 0.28, growthExponent: 0.75, growthKeepOnMerge: 0.5, crushSplash: 0.5 },
    },
  },
  {
    // Rush Royale : Lierre (malus et graines).
    id: 'jessie', name: 'Jessie & Pile-Poil', pack: 'pixar', rarity: 'rare', role: 'Contrôle / malus',
    targeting: 'premier', damage: 90, attackInterval: 0.8, range: 2.4,
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
    ability: {
      name: 'Musique de l’âme',
      description: 'Toutes les 10 s, Joe joue : toutes tes unités gagnent +25 % de vitesse d’attaque pendant 5 s. Coup de duo (1 sur 5) : l’étincelle de 22 double les dégâts du coup.',
      params: { abilityCooldown: 10, jazzHaste: 0.25, jazzDuration: 5, duoEvery: 5, sparkMul: 2 },
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

/** Decks de référence de l'extension Pixar (simulateur, docs/equilibrage.md). */
export const PIXAR_REFERENCE_DECKS: Record<'pixar-rares' | 'meta-pixar' | 'indestructibles' | 'toy-story', UnitId[]> = {
  'pixar-rares': ['violetflash', 'mcqueen', 'carlrussell', 'remy', 'jessie'],
  'meta-pixar': ['mrincredible', 'walleeve', 'joe', 'frozone', 'mcqueen'],
  indestructibles: ['mrincredible', 'elastigirl', 'frozone', 'violetflash', 'mcqueen'],
  'toy-story': ['buzzwoody', 'jessie', 'walleeve', 'joe', 'mcqueen'],
};
