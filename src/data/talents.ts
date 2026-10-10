// Talents des 73 unités (28 Marvel et Disney, 15 DC, 15 Transformers, 15 Pixar) (§5.1 du prompt) : 3 paliers (niveaux de collection 5, 7, 9) × 2 options.
// Auteur : agent Game design. Valeurs de départ, à équilibrer avec scripts/simulate.ts (voir docs/equilibrage.md).
//
// Convention des paramètres (lus par le moteur) :
// - suffixe `Add` : valeur ajoutée au paramètre de base de la compétence ou de l'unité
//   (secondes, nombre de cibles, fraction : 0.1 = +10 points de pourcentage) ;
// - suffixe `Mul` : multiplicateur appliqué au paramètre de base (1.2 = +20 %) ;
// - sans suffixe : nouvelle mécanique, la valeur est le paramètre direct (secondes, fraction, nombre).
// Clés génériques communes à toutes les unités :
//   damageMul        dégâts de l'attaque de base
//   attackSpeedMul   vitesse d'attaque (intervalle divisé par la valeur)
//   abilityCooldownAdd  recharge de la compétence principale, en secondes (négatif = plus rapide)
//   bossDamageMul    dégâts contre les boss
//   extraTargets     cibles supplémentaires de l'attaque de base
//   auraDiagonal     1 = les auras d'adjacence touchent aussi les diagonales
//   armorPierce      fraction d'armure ignorée (1 = toute)
//   stunDuration / stunChance  étourdissement appliqué par l'attaque
//   burnPerSecond / burnDuration  brûlure (fraction des dégâts du coup par seconde)
// Les autres clés sont propres à la compétence de l'unité : avec suffixe, elles visent un paramètre de
// `ability.params` (src/data/units.ts) ; sans suffixe, ce sont de nouvelles mécaniques
// (`…Bonus` = fraction ajoutée, `…Factor` = multiplicateur direct).

import type { TalentDef, UnitId } from './types';

type P = Record<string, number>;

function u(
  unit: UnitId,
  t1a: [string, string, P], t1b: [string, string, P],
  t2a: [string, string, P], t2b: [string, string, P],
  t3a: [string, string, P], t3b: [string, string, P],
): TalentDef[] {
  const rows: [1 | 2 | 3, 'a' | 'b', [string, string, P]][] = [
    [1, 'a', t1a], [1, 'b', t1b], [2, 'a', t2a], [2, 'b', t2b], [3, 'a', t3a], [3, 'b', t3b],
  ];
  return rows.map(([tier, option, [name, description, params]]) => ({ unit, tier, option, name, description, params }));
}

export const TALENTS: TalentDef[] = [
  // Octobre 2026 : talents des unités Rush Royale correspondantes (docs/rush-royale-mapping.md) ; paliers
  // 1/2/3 = talents des niveaux 9/11/13 de Rush Royale quand ils sont publiés, sinon talent de même famille.
  // ───────────── Pack Marvel ─────────────
  ...u('ironman', // Tesla
    ['Bobines', 'Chaque charge donne plus de dégâts : jusqu’à +53 % au lieu de +38 %.', { chargeDamageAdd: 0.15 }],
    ['Arc étendu', 'Chargé, le tir frappe 6 ennemis de plus au lieu de 4.', { chargedExtraTargetsAdd: 2 }],
    ['Réacteur Ark', '+15 % de vitesse d’attaque.', { attackSpeedMul: 1.15 }],
    ['Décharge', 'Chargé, les ennemis en plus subissent 75 % des dégâts au lieu de 50 %.', { chargedSplashAdd: 0.25 }],
    ['Surtension', 'Iron Man arrive sur le plateau avec 1 charge.', { chargeStart: 1 }],
    ['Mark LXXXV', '+30 % de dégâts contre les boss.', { bossDamageMul: 1.3 }],
  ),
  ...u('spiderman', // Catapulte (talents Rush Royale non publiés : même famille, C)
    ['Toile renforcée', 'Les ennemis restent collés 1,5 s au lieu de 1 s.', { webStunAdd: 0.5 }],
    ['Double lance-toile', '+15 % de vitesse d’attaque.', { attackSpeedMul: 1.15 }],
    ['Toile géante', 'La boule de toile couvre un rayon de 1,5 case au lieu de 1.', { webRadiusAdd: 0.5 }],
    ['Sens d’araignée', 'Un même ennemi peut être recollé après 6 s au lieu de 9 s.', { webRestunAdd: -3 }],
    ['Toile acide', '+25 % de dégâts.', { damageMul: 1.25 }],
    ['Ami du quartier', '+30 % de dégâts contre les boss.', { bossDamageMul: 1.3 }],
  ),
  ...u('hulk', // Minotaure
    ['Berserker', 'À son arrivée et à la fusion, Hulk passe 15 s en Berserker : Séisme +50 % de dégâts.', { berserkDuration: 15, berserkQuake: 0.5 }],
    ['Berserker furieux', 'À son arrivée et à la fusion, 20 s de Berserker : vitesse d’attaque ×5 et coups de zone (100 % du Séisme), mais plus de Séisme.', { berserkDuration: 20, berserkSpeed: 4 }],
    ['Onde de choc', 'Le Séisme couvre un rayon de 2 cases au lieu de 1,5.', { quakeRadiusAdd: 0.5 }],
    ['Fracas', 'Le Séisme étourdit 1 s (sauf boss).', { quakeStun: 1 }],
    ['Brèche', 'Le Séisme inflige 150 % des dégâts par seconde au lieu de 100 %.', { quakeDpsAdd: 0.5 }],
    ['Fureur', 'Chaque coup sur la même cible : +10 % de dégâts (+400 % au plus), remis à zéro au changement de cible.', { rampPerHit: 0.1, rampMax: 4 }],
  ),
  ...u('thor', // Inquisiteur (fiche de l'unité, arbre des niveaux 9/11/13/15 ; recherches : voir docs/rush-royale-mapping.md)
    ['Chevalier de lumière', 'Thor combat en Chevalier de lumière : +6,5 % de dégâts par boss éliminé pendant la partie (20 % de chance par petit boss). Fusionner n’importe quel Thor met tous les Thor en mode actif pendant 10 s.', { bossKillDamage: 0.065, miniKillChance: 0.2, mergeActiveDuration: 10 }],
    ['Chevalier des ténèbres', 'Le premier Thor du plateau est un Chevalier des ténèbres : toujours en mode actif ; toutes les 25 s, il prend 1 rang à un autre Thor (rang 7 au plus).', { darkKnight: 1, darkStealEvery: 25 }],
    ['Purification', 'En mode actif, les coups consécutifs font monter les dégâts deux fois plus vite : +30 % par coup au lieu de +15 %.', { activeRampMul: 2 }],
    ['Bouclier de foi', 'Toutes les 15 s, un bouclier de foi protège chaque Thor pendant 5 s : les pouvoirs de boss ne le touchent pas.', { shieldEvery: 15, shieldDuration: 5 }],
    ['Ronin', 'Limite d’augmentation des dégâts : 800 % au lieu de 600 %.', { rampMaxAdd: 2 }],
    ['Unité', 'Avec 4 Thor ou plus sur le plateau : +15 % de dégâts ; avec 7 ou plus : 8 % de chance de coup critique (dégâts ×2,35).', { unityDamage: 0.15, unityAt: 4, unityCritChance: 0.08, unityCritAt: 7, unityCritMul: 2.35 }],
  ),
  // Talent ultime (niveau 15 de Rush Royale → notre niveau 10) : gratuit, une fois les 3 paliers choisis.
  { unit: 'thor', tier: 4, option: 'a', name: 'Marteau de foi', description: 'Toutes les 8 s, Mjolnir s’abat sur l’ennemi de tête : 500 % des dégâts autour de lui et étourdissement de 1 s.', params: { abilityCooldown: 8, hammerDamage: 5, hammerStun: 1 } },
  ...u('strange', // Mage du portail
    ['Portails multiples', '8 % de chance de renvoi au lieu de 5 %.', { teleportChanceAdd: 0.03 }],
    ['Main de sorcier', '+20 % de vitesse d’attaque.', { attackSpeedMul: 1.2 }],
    ['Œil d’Agamotto', 'Les renvois suivants du même ennemi gardent 80 % de la chance au lieu de 50 %.', { teleportDecayAdd: 0.3 }],
    ['Dimension miroir', 'L’ennemi renvoyé subit 200 % des dégâts.', { portalDamage: 2 }],
    ['Bandes de Cyttorak', 'L’ennemi renvoyé est ralenti de 30 % pendant 3 s.', { teleportSlow: 0.3 }],
    ['Sorcier suprême', '+30 % de dégâts.', { damageMul: 1.3 }],
  ),
  ...u('venom', // Zélote (talents introuvables : même famille, (C))
    ['Faim', 'Le symbiote profite mieux du mana : bonus de croissance +15 %.', { growthScaleMul: 1.15 }],
    ['Symbiote agile', '+15 % de vitesse d’attaque.', { attackSpeedMul: 1.15 }],
    ['Toxine', 'Empoisonne la cible : 20 % des dégâts du coup par seconde pendant 3 s.', { burnPerSecond: 0.2, burnDuration: 3 }],
    ['Carnage', '+30 % de dégâts contre les boss.', { bossDamageMul: 1.3 }],
    ['Nous sommes Venom', 'Chaque point de mana en réserve compte double pour la croissance.', { growthPerManaMul: 2 }],
    ['Dévorer', 'Exécute un ennemi sous 10 % de PV (sauf boss).', { executeThreshold: 0.1 }],
  ),
  ...u('cmarvel', // Mage de feu
    ['Supernova', 'L’explosion fait 93 % des dégâts au lieu de 78 %.', { splashAdd: 0.15 }],
    ['Mode binaire', '+15 % de vitesse d’attaque.', { attackSpeedMul: 1.15 }],
    ['Onde photonique', 'L’explosion couvre 1,6 case au lieu de 1,2.', { splashRadiusAdd: 0.4 }],
    ['Brûlure Kree', 'Brûle la cible : 20 % des dégâts par seconde pendant 3 s.', { burnPerSecond: 0.2, burnDuration: 3 }],
    ['Puissance cosmique', '+25 % de dégâts.', { damageMul: 1.25 }],
    ['Avengeuse', '+40 % de dégâts contre les boss.', { bossDamageMul: 1.4 }],
  ),
  ...u('cap', // Statue de chevalier
    ['Discours', '+17 % de vitesse d’attaque par rang au lieu de +14 %.', { auraAttackSpeedPerRankAdd: 0.03 }],
    ['Bouclier de vibranium', 'L’aura touche aussi les cases en diagonale.', { auraDiagonal: 1 }],
    ['Stratège', 'Chance de critique : 7 % par rang au lieu de 5 %.', { evenCritChancePerRankAdd: 0.02 }],
    ['Frappe héroïque', 'Les critiques font ×2,5 au lieu de ×2.', { auraCritMulAdd: 0.5 }],
    ['Avengers, rassemblement', 'Les voisines gagnent aussi +4 % de dégâts par rang.', { auraDamagePerRank: 0.04 }],
    ['Le premier Avenger', 'Captain America est insensible aux pouvoirs de boss.', { immuneBossControl: 1 }],
  ),
  ...u('loki', // Arlequin
    ['Dieu de la malice', 'La copie garde 10 points de dégâts de plus.', { copyDamageMulAdd: 0.1 }],
    ['Sceptre', 'Chaque copie rapporte 30 de mana.', { copyMana: 30 }],
    ['Illusion parfaite', 'La copie arrive avec sa compétence prête.', { copyReady: 1 }],
    ['Roi d’Asgard', '+20 % de dégâts.', { damageMul: 1.2 }],
    ['Glorious Purpose', 'La copie garde 15 points de dégâts de plus.', { copyDamageMulAdd: 0.15 }],
    ['Variant', 'La copie arrive avec 1 rang de plus.', { copyRankBonus: 1 }],
  ),
  ...u('bucky', // Bourreau
    ['Interrogatoire', 'Seuil d’exécution +5 points.', { executeThresholdAdd: 0.05 }],
    ['Entraînement de l’Hydra', '+15 % de vitesse d’attaque.', { attackSpeedMul: 1.15 }],
    ['Cible prioritaire', 'Contre les boss et les mini-boss, le seuil n’est réduit que d’un quart.', { executeBossFactorAdd: 0.25 }],
    ['Bras de vibranium', '+20 % de dégâts.', { damageMul: 1.2 }],
    ['Assassin', '+30 % de dégâts contre les boss.', { bossDamageMul: 1.3 }],
    ['Coup de crosse', 'Chaque coup a 10 % de chance d’étourdir 0,5 s.', { stunChance: 0.1, stunDuration: 0.5 }],
  ),
  ...u('hawkeye', // Archer
    ['Flèches empoisonnées', '15 % de chance de toucher aussi 2 ennemis au hasard (talent de l’Archer de Rush Royale).', { poisonArrowChance: 0.15 }],
    ['Flèches explosives', '15 % de chance d’une flèche de zone sur un ennemi au hasard (talent de l’Archer de Rush Royale).', { explosiveArrowChance: 0.15 }],
    ['Ronin', 'Chaque amélioration donne +27 % de vitesse au lieu de +22 %.', { powerUpAttackSpeedAdd: 0.05 }],
    ['Pointe lourde', '+20 % de dégâts.', { damageMul: 1.2 }],
    ['Œil de faucon', '+20 % de vitesse d’attaque.', { attackSpeedMul: 1.2 }],
    ['Flèche Pym', '+30 % de dégâts contre les boss.', { bossDamageMul: 1.3 }],
  ),
  ...u('falcon', // Tireur d'élite
    ['Tir fou', 'Pendant un boss, dégâts ×1,75 au lieu de ×1,5.', { bossWaveDamageMulAdd: 0.25 }],
    ['Ailes', '+15 % de vitesse d’attaque.', { attackSpeedMul: 1.15 }],
    ['Rafale', 'Pendant un boss, vitesse d’attaque ×1,75 au lieu de ×1,5.', { bossWaveAttackSpeedMulAdd: 0.25 }],
    ['Redwing armé', '+20 % de dégâts.', { damageMul: 1.2 }],
    ['Balles perforantes', 'Ignore l’armure.', { armorPierce: 1 }],
    ['Captain America', '+30 % de dégâts contre les boss.', { bossDamageMul: 1.3 }],
  ),
  ...u('widow', // Prêtresse
    ['Red Room', 'Sacrifice : 100 de mana par rang au lieu de 80.', { sacrificeManaPerRankAdd: 20 }],
    ['Double jeu', '25 % de chance de doubler le mana du sacrifice.', { sacrificeDoubleChance: 0.25 }],
    ['Inspiration', 'Recevoir son mana donne +15 % de vitesse d’attaque à toutes les unités pendant 6 s (talent de la Prêtresse).', { sacrificeHaste: 0.15, sacrificeHasteDuration: 6 }],
    ['Morsure', '+30 % de dégâts.', { damageMul: 1.3 }],
    ['Veuve noire', 'Sacrifice : 40 de mana par rang en plus.', { sacrificeManaPerRankAdd: 40 }],
    ['Espionne', '+30 % de vitesse d’attaque.', { attackSpeedMul: 1.3 }],
  ),
  ...u('shangchi', // Tonnerre (talents Rush Royale non publiés : même famille, C)
    ['Kung-fu', 'La chaîne fait 70 % des dégâts au lieu de 50 %.', { thunderDamageAdd: 0.2 }],
    ['Anneaux rapides', '+15 % de vitesse d’attaque.', { attackSpeedMul: 1.15 }],
    ['Ta Lo', 'La chaîne touche 1 ennemi de plus.', { thunderTargetsAdd: 1 }],
    ['Bâton', '+20 % de dégâts.', { damageMul: 1.2 }],
    ['Maître', '+30 % de dégâts contre les boss.', { bossDamageMul: 1.3 }],
    ['Wenwu', 'Étourdissement de la chaîne 0,4 s au lieu de 0,2 s.', { thunderDazeAdd: 0.2 }],
  ),

  // ───────────── Pack Disney ─────────────
  ...u('moana', // Archer du vent
    ['Vent du large', 'L’Ouragan dure 1 s de plus.', { hurricaneDurationAdd: 1 }],
    ['Pua', 'Chaque rang ajoute 45 dégâts au lieu de 30.', { rankDamageFlatAdd: 15 }],
    ['Tempête', 'Pendant l’Ouragan, vitesse ×3,5 au lieu de ×3.', { hurricaneSpeedMulAdd: 0.5 }],
    ['Te Fiti', 'L’Ouragan revient 1 s plus tôt.', { abilityCooldownAdd: -1 }],
    ['Navigatrice', '+25 % de dégâts.', { damageMul: 1.25 }],
    ['Cœur de l’océan', '+30 % de dégâts contre les boss.', { bossDamageMul: 1.3 }],
  ),
  ...u('maui', // Borée
    ['Faucon', 'Forme faucon : +50 % de vitesse d’attaque au lieu de +30 %.', { hawkSpeedAdd: 0.2 }],
    ['Requin', 'Forme requin : 45 % de chance de critique au lieu de 30 %.', { sharkCritChanceAdd: 0.15 }],
    ['Volée', 'Forme requin : 20 % de chance de tirer une 2e flèche qui ralentit (talent de Borée).', { sharkDoubleArrow: 0.2 }],
    ['Pluie de flèches', 'Forme requin : 30 % de chance d’une pluie sur 3 ennemis, toujours critique (talent de Borée).', { sharkRain: 0.3 }],
    ['Demi-dieu', 'Forme requin : +90 % de vitesse d’attaque au lieu de +60 %.', { sharkSpeedAdd: 0.3 }],
    ['Hameçon magique', '+25 % de dégâts.', { damageMul: 1.25 }],
  ),
  ...u('pocahontas', // Bannière
    ['Vent du nord', '+15 % de vitesse d’attaque par rang au lieu de +12 %.', { auraAttackSpeedPerRankAdd: 0.03 }],
    ['Grand-mère Feuillage', 'L’aura touche aussi les cases en diagonale.', { auraDiagonal: 1 }],
    ['Flit', 'Les voisines gagnent aussi +3 % de dégâts par rang.', { auraDamagePerRank: 0.03 }],
    ['Meeko', 'Pocahontas est insensible aux pouvoirs de boss.', { immuneBossControl: 1 }],
    ['Couleurs du vent', '+5 points de vitesse d’attaque par rang en plus.', { auraAttackSpeedPerRankAdd: 0.05 }],
    ['L’esprit de la forêt', 'Les voisines gagnent +6 % de dégâts par rang.', { auraDamagePerRank: 0.06 }],
  ),
  ...u('mulan', // Danse-lames
    ['Danse de l’épée', 'En dansant, +130 % de vitesse d’attaque au lieu de +100 %.', { aloneAttackSpeedAdd: 0.3 }],
    ['Fleur qui s’épanouit', 'Chaque Mulan qui danse donne +15 % de dégâts au lieu de +10 %.', { dancerDamageAdd: 0.05 }],
    ['Honneur', '+30 % de dégâts contre les boss et mini-boss (Danse-lames de Rush Royale).', { bossDamageMul: 1.3 }],
    ['Souffle de Mushu', 'Brûle la cible : 20 % des dégâts par seconde pendant 3 s.', { burnPerSecond: 0.2, burnDuration: 3 }],
    ['Armée impériale', 'Le bonus compte jusqu’à 12 danseuses au lieu de 8.', { dancerMaxAdd: 4 }],
    ['Sauveuse de la Chine', '+25 % de dégâts.', { damageMul: 1.25 }],
  ),
  ...u('merida', // Chasseur
    ['Trophée', 'Chaque boss ou mini-boss qu’elle achève : +4 % de dégâts pour la partie (talent du Chasseur).', { bossTrophy: 0.04 }],
    ['Gland', '7 % de chance de tirer aussi sur un ennemi au hasard (talent du Chasseur).', { acornChance: 0.07 }],
    ['Traque', 'Garde sa cible et n’en change que tous les 15 tirs (talent du Chasseur).', { retargetEvery: 15 }],
    ['Flèche lourde', '50 % de chance que le premier tir fasse encore +150 % (talent du Chasseur).', { firstShotExtraChance: 0.5, firstShotExtra: 1.5 }],
    ['Volée', 'Dès le rang 3, chaque tir éclabousse à 50 % (talent du Chasseur).', { splashFromRank: 3, rankSplash: 0.5 }],
    ['Œil de lynx', 'Dès le rang 3, +10 % de chance de critique ×2 (talent du Chasseur).', { critFromRank: 3, critChanceBonus: 0.1 }],
  ),
  ...u('ariel', // Stase
    ['Voix d’or', 'Le chant fige 0,5 s de plus.', { stasisDurationAdd: 0.5 }],
    ['Écho', 'Le chant couvre 1,5 case au lieu de 1.', { stasisRadiusAdd: 0.5 }],
    ['Partir là-bas', 'Le chant revient 0,5 s plus tôt.', { abilityCooldownAdd: -0.5 }],
    ['Sébastien', 'Les ennemis figés subissent 200 % des dégâts d’Ariel.', { stasisDamage: 2 }],
    ['Trident', 'Les boss pris par le chant sont ralentis de 50 %.', { stasisBossSlow: 0.5 }],
    ['Sous l’océan', 'Deux sphères de chant au lieu d’une.', { stasisTargets: 2 }],
  ),
  ...u('foxhound', // Voleur
    ['Flair', 'Bonus aléatoire jusqu’à +250 % au lieu de +200 %.', { rogueCritMulAdd: 0.5 }],
    ['Course', '+15 % de vitesse d’attaque.', { attackSpeedMul: 1.15 }],
    ['Morsure', '10 % de chance d’étourdir 0,5 s.', { stunDuration: 0.5, stunChance: 0.1 }],
    ['Meute', '+30 % de dégâts contre les boss.', { bossDamageMul: 1.3 }],
    ['Meilleurs amis', 'Bonus aléatoire jusqu’à +300 %.', { rogueCritMulAdd: 1 }],
    ['Chasse', '+25 % de dégâts.', { damageMul: 1.25 }],
  ),
  ...u('tiana', // Vampire
    ['Gumbo', 'Mana à l’élimination ×1,3 (talent du Vampire : +30 % de mana).', { manaPerKillMul: 1.3 }],
    ['Ray la luciole', 'La morsure rapporte 0,75 mana par seconde au lieu de 0,5.', { biteManaPerSecondAdd: 0.25 }],
    ['Lucioles', 'Chaque coup ajoute 1 % des PV actuels de la cible (talent du Vampire : chauves-souris).', { batPctHp: 0.01 }],
    ['Prince Naveen', '+20 % de vitesse d’attaque.', { attackSpeedMul: 1.2 }],
    ['Docteur Facilier', 'Un boss touché par Tiana rapporte 20 de mana en plus.', { bossKillMana: 20 }],
    ['Le Palais de Tiana', 'Mana à l’élimination ×1,5.', { manaPerKillMul: 1.5 }],
  ),
  ...u('nemo', // Chaudron magique
    ['Marlin', '7 de mana par rang au lieu de 5.', { manaPerRankAdd: 2 }],
    ['Courant marin', 'Le mana arrive toutes les 6 s au lieu de 8.', { abilityCooldownAdd: -2 }],
    ['Élixir', 'La potion de force donne +40 % au lieu de +25 %.', { potionBuffAdd: 0.15 }],
    ['Dory', '30 % de chance d’une seconde potion (talent du Chaudron).', { potionTwice: 0.3 }],
    ['Potion de croissance', '10 % de chance qu’une potion fasse aussi monter une alliée d’un rang (Chaudron, Ascension max).', { potionRankUp: 0.1 }],
    ['Crush', 'La potion explosive fait 500 % au lieu de 300 %.', { potionDamageAdd: 2 }],
  ),
  ...u('coco', // Dryade
    ['Guitare', 'Chaque montée de rang donnée par Coco rapporte 20 de mana.', { promoteMana: 20 }],
    ['Pétales de souci', '+30 % de dégâts.', { damageMul: 1.3 }],
    ['Remember Me', 'Une fois par vague, Coco restaure une unité détruite ou rétrogradée par un boss.', { restoreUses: 1 }],
    ['Mariachi', '+20 % de vitesse d’attaque.', { attackSpeedMul: 1.2 }],
    ['Pont de pétales', 'L’alliée qui monte de rang gagne +20 % de vitesse d’attaque pendant 10 s.', { promoteBoost: 0.2 }],
    ['Souvenir vivant', 'Remember Me deux fois par vague.', { restoreUses: 2 }],
  ),
  ...u('nickjudy', // Chimiste
    ['Arnaque', 'La fiche fait subir +6 % de dégâts par rang au lieu de +5 %.', { vulnPerRankAdd: 0.01 }],
    ['Pawpsicle', '+20 % de vitesse d’attaque.', { attackSpeedMul: 1.2 }],
    ['Menottes', 'Ignore la moitié de l’armure.', { armorPierce: 0.5 }],
    ['Contravention', '10 % de chance d’arrêter la cible 1 s.', { stunDuration: 1, stunChance: 0.1 }],
    ['ZPD', '+30 % de dégâts.', { damageMul: 1.3 }],
    ['Affaire classée', '+30 % de dégâts contre les boss.', { bossDamageMul: 1.3 }],
  ),
  ...u('buzzwoody', // Ingénieur
    ['Vers l’infini', '+2 points de dégâts par jouet relié.', { formationDamagePerAllyAdd: 0.02 }],
    ['Lasso rapide', '+15 % de vitesse d’attaque.', { attackSpeedMul: 1.15 }],
    ['Laser', '+20 % de dégâts.', { damageMul: 1.2 }],
    ['Et au-delà', '+30 % de dégâts contre les boss.', { bossDamageMul: 1.3 }],
    ['Pizza Planet', 'Le laser brûle : 10 % par seconde pendant 3 s.', { burnPerSecond: 0.1, burnDuration: 3 }],
    ['Chambre d’Andy', 'Le bonus compte jusqu’à 15 jouets reliés au lieu de 10.', { formationMaxAdd: 5 }],
  ),
  ...u('rapunzel', // Meule
    ['Fleur magique', '+10 % de dégâts par rang aux voisines au lieu de +8 %.', { auraDamagePerRankAdd: 0.02 }],
    ['Cheveux de 20 m', 'L’aura touche aussi les cases en diagonale.', { auraDiagonal: 1 }],
    ['Cheveux magiques', 'Retire les effets de boss (sommeil, hypnose, étourdissement) des unités voisines.', { cleanseNeighbors: 1 }],
    ['Pascal', 'Raiponce est insensible aux pouvoirs de boss.', { immuneBossControl: 1 }],
    ['Lanternes flottantes', 'Les voisines gagnent aussi +3 % de vitesse d’attaque par rang.', { auraAttackSpeedPerRank: 0.03 }],
    ['Pascal camouflé', 'Les effets de boss durent 50 % moins longtemps sur tout le plateau.', { bossEffectDurationFactor: 0.5 }],
  ),
  ...u('vanralph', // Gardien du portail
    ['Turbo', 'Vanellope ne bugue qu’1 s après un échange.', { swapSleepAdd: -1 }],
    ['Glitch', 'Après un échange, ses nouvelles voisines gagnent +20 % de vitesse d’attaque pendant 5 s.', { boost: 0.2, boostDuration: 5 }],
    ['Pièces d’or', 'Chaque échange rapporte 20 de mana.', { swapMana: 20 }],
    ['Démolisseur', '+30 % de dégâts.', { damageMul: 1.3 }],
    ['Reine de Sugar Rush', 'Vanellope ne bugue plus après un échange.', { swapSleepAdd: -2 }],
    ['Fix-it Félix', 'Après un échange, l’alliée échangée et les nouvelles voisines gagnent +30 % de vitesse d’attaque pendant 5 s.', { swapBoostPartner: 1, boost: 0.3, boostDuration: 5 }],
  ),

  // ───────────── Pack DC (extension) : talents de même famille que l’unité Rush Royale (C) ─────────────
  ...u('batman', // Chasseur de démons (talents Rush Royale : critiques et cibles, même famille, C)
    ['Batarangs affûtés', '+20 % de dégâts.', { damageMul: 1.2 }],
    ['Entraînement de la Ligue des Ombres', '+15 % de vitesse d’attaque.', { attackSpeedMul: 1.15 }],
    ['Ceinture utilitaire', 'Les batarangs touchent 5 ennemis au plus au lieu de 4.', { targetsMaxAdd: 1 }],
    ['Le plus grand détective', 'Les coups ignorent 50 % de l’armure.', { armorPierce: 0.5 }],
    ['Bat-signal', '+30 % de dégâts contre les boss.', { bossDamageMul: 1.3 }],
    ['Gaz incapacitant', 'Chaque coup a 10 % de chance d’étourdir 0,5 s.', { stunChance: 0.1, stunDuration: 0.5 }],
  ),
  ...u('superman', // Givre
    ['Souffle arctique', 'Le souffle ralentit de 5 % par rang au lieu de 4 %.', { blizzardSlowPerRankAdd: 0.01 }],
    ['Plus rapide qu’une balle', '+15 % de vitesse d’attaque.', { attackSpeedMul: 1.15 }],
    ['Blizzard', 'Le ralentissement dure 9 s au lieu de 7 s.', { blizzardDurationAdd: 2 }],
    ['Vision thermique', 'Chaque coup brûle 15 % des dégâts par seconde pendant 2 s.', { burnPerSecond: 0.15, burnDuration: 2 }],
    ['Hiver éternel', 'Le souffle se cumule 5 fois au lieu de 3.', { blizzardStacksAdd: 2 }],
    ['Fils de Krypton', 'Le souffle inflige aussi 100 % des dégâts à tous les ennemis.', { blizzardDamage: 1 }],
  ),
  ...u('wonderwoman', // Moine
    ['Bracelets de la soumission', '+20 % de dégâts.', { damageMul: 1.2 }],
    ['Endurance amazone', 'La Fureur dure 7 s au lieu de 5 s.', { powerDurationAdd: 2 }],
    ['Épée de Héphaïstos', 'En Fureur, l’éclaboussure passe à 75 %.', { powerSplashAdd: 0.25 }],
    ['Princesse amazone', 'Fureur toutes les 9 s au lieu de 12 s.', { abilityCooldownAdd: -3 }],
    ['Déesse de la guerre', '+30 % de dégâts contre les boss.', { bossDamageMul: 1.3 }],
    ['Lasso de vérité', 'En Fureur, +100 % de vitesse d’attaque au lieu de +60 %.', { powerSpeedAdd: 0.4 }],
  ),
  ...u('greenlantern', // Cultiste
    ['Serment du Corps', '+20 % de dégâts.', { damageMul: 1.2 }],
    ['Batterie chargée', '+15 % de vitesse d’attaque.', { attackSpeedMul: 1.15 }],
    ['Mitrailleuse d’émeraude', 'Jusqu’à 5 cibles de plus au lieu de 3.', { formationTargetsMaxAdd: 2 }],
    ['Corps uni', 'Les dégâts doublent dès 4 Green Lantern reliés.', { formationDoubleAtAdd: -1 }],
    ['Volonté inébranlable', 'Groupe complet : dégâts ×2,5 au lieu de ×2.', { formationDoubleMulAdd: 0.5 }],
    ['Lumière d’Oa', '+30 % de dégâts contre les boss.', { bossDamageMul: 1.3 }],
  ),
  ...u('flash', // Cogneur
    ['Force véloce', 'La rage dure 7 s au lieu de 5 s.', { rageDurationAdd: 2 }],
    ['Course-poursuite', 'La rage peut se déclencher dès 6 ennemis sur le chemin.', { rageFromAdd: -2 }],
    ['Coup de foudre', 'En rage, +80 % de dégâts au lieu de +50 %.', { rageDamageAdd: 0.3 }],
    ['Relais', 'Chaque échange rapporte 15 de mana.', { swapMana: 15 }],
    ['Tornade', 'En rage, les coups de zone frappent à 80 %.', { rageSplashAdd: 0.3 }],
    ['Vitesse partagée', 'Après un échange, +35 % de cadence au lieu de +20 %, à l’alliée échangée aussi.', { boostAdd: 0.15, swapBoostPartner: 1 }],
  ),
  ...u('aquaman', // Faucheuse
    ['Kraken affamé', '+2 points de chance d’engloutir.', { reapChanceAdd: 0.02 }],
    ['Force des abysses', '+15 % de vitesse d’attaque.', { attackSpeedMul: 1.15 }],
    ['Trident de Poséidon', '+20 % de dégâts.', { damageMul: 1.2 }],
    ['Marée montante', 'Les coups ralentissent de 15 % pendant 1,5 s.', { slow: 0.15, slowDuration: 1.5 }],
    ['Roi des sept mers', '+3 points de chance d’engloutir.', { reapChanceAdd: 0.03 }],
    ['Atlante', '+30 % de dégâts contre les boss.', { bossDamageMul: 1.3 }],
  ),
  ...u('cyborg', // Génie
    ['Batterie étendue', 'Le vortex garde jusqu’à 15 charges.', { vortexMaxAdd: 5 }],
    ['Overclocking', 'Le réseau donne +25 % de vitesse d’attaque aux voisines au lieu de +15 %.', { auraAttackSpeedAdd: 0.1 }],
    ['Processeur quantique', 'Chaque charge donne +7 % de vitesse d’attaque au lieu de +5 %.', { vortexSpeedAdd: 0.02 }],
    ['Canon amélioré', '+20 % de dégâts.', { damageMul: 1.2 }],
    ['Wi-Fi de la Tour', 'Le réseau touche aussi les cases en diagonale.', { auraDiagonal: 1 }],
    ['Arsenal de S.T.A.R. Labs', '+35 % de dégâts contre les boss.', { bossDamageMul: 1.35 }],
  ),
  ...u('supergirl', // Barde
    ['Fille d’Argo', 'Sa croissance avec le temps va deux fois plus vite.', { growthPerSecondAdd: 0.004 }],
    ['Vol supersonique', '+15 % de vitesse d’attaque.', { attackSpeedMul: 1.15 }],
    ['Surcharge solaire', 'Quand l’énergie déborde, +35 % de vitesse d’attaque au lieu de +20 %.', { hasteAdd: 0.15 }],
    ['Soleil de midi', 'L’énergie déborde toutes les 14 s au lieu de 20 s.', { abilityCooldownAdd: -6 }],
    ['Éruption solaire', 'Quand l’énergie déborde, 400 % des dégâts autour de l’ennemi de tête.', { flareDamage: 4 }],
    ['Kryptonienne', '+35 % de dégâts contre les boss.', { bossDamageMul: 1.35 }],
  ),
  ...u('shazam', // Météore
    ['Puissance de Zeus', 'La foudre frappe à 400 % au lieu de 300 %.', { meteorDamageAdd: 1 }],
    ['Force d’Hercule', '+20 % de dégâts.', { damageMul: 1.2 }],
    ['Sagesse de Salomon', 'La foudre touche 1,5 case autour au lieu de 1.', { meteorRadiusAdd: 0.5 }],
    ['Endurance d’Atlas', 'La foudre étourdit 1,5 s au lieu de 1 s.', { meteorStunAdd: 0.5 }],
    ['Courage d’Achille', 'Deux éclairs tombent à chaque fois.', { meteors: 2 }],
    ['Vitesse de Mercure', 'SHAZAM ! 2 s plus tôt.', { abilityCooldownAdd: -2 }],
  ),
  ...u('martian', // Mime
    ['Forme parfaite', 'La copie garde 85 % des dégâts au lieu de 75 %.', { copyDamageMulAdd: 0.1 }],
    ['J’onn J’onzz', '+30 % de dégâts.', { damageMul: 1.3 }],
    ['Esprit collectif', 'Chaque copie rapporte 20 de mana.', { copyMana: 20 }],
    ['Instinct martien', 'La copie a sa compétence prête tout de suite.', { copyReady: 1 }],
    ['Lien psychique', 'La copie garde 100 % des dégâts.', { copyDamageMulAdd: 0.25 }],
    ['Dernier fils de Mars', 'La copie gagne 1 rang (au plus 7).', { copyRankBonus: 1 }],
  ),
  ...u('robin', // Ferrailleur
    ['Passer le relais', 'Chaque fois que Robin fait monter une alliée, il rapporte 25 de mana.', { promoteMana: 25 }],
    ['Acrobaties', '+20 % de vitesse d’attaque.', { attackSpeedMul: 1.2 }],
    ['Double salto', '+10 points de chance de faire monter l’alliée de 2 rangs.', { promoteDoubleChanceAdd: 0.1 }],
    ['Bâton télescopique', '+30 % de dégâts.', { damageMul: 1.3 }],
    ['Fils de la nuit', 'L’alliée promue gagne +30 % de vitesse d’attaque pendant 10 s.', { promoteBoost: 0.3 }],
    ['Nightwing', '+20 points de chance de faire monter l’alliée de 2 rangs.', { promoteDoubleChanceAdd: 0.2 }],
  ),
  ...u('batgirl', // Bombardier
    ['Charge renforcée', 'L’explosion frappe à 80 % au lieu de 60 %.', { splashAdd: 0.2 }],
    ['Coups de pied rapides', '+15 % de vitesse d’attaque.', { attackSpeedMul: 1.15 }],
    ['Souffle large', 'L’explosion touche 1,5 case autour au lieu de 1.', { splashRadiusAdd: 0.5 }],
    ['Faille de sécurité', 'Les coups ignorent 50 % de l’armure.', { armorPierce: 0.5 }],
    ['Flash aveuglant', 'Chaque coup a 10 % de chance d’étourdir 0,5 s.', { stunChance: 0.1, stunDuration: 0.5 }],
    ['Oracle', '+30 % de dégâts contre les boss.', { bossDamageMul: 1.3 }],
  ),
  ...u('catwoman', // Démonologue
    ['Neuf vies', '+15 % de dégâts.', { damageMul: 1.15 }],
    ['Doigts de fée', 'Les ennemis touchés rapportent 50 % de mana en plus.', { manaPerKillMul: 1.5 }],
    ['Butin de choix', 'Un boss ou un lieutenant touché par Catwoman rapporte 50 de mana en plus.', { bossKillMana: 50 }],
    ['Fouet', 'Les coups ralentissent de 20 % pendant 2 s.', { slow: 0.2, slowDuration: 2 }],
    ['Griffes', '+20 % de vitesse d’attaque.', { attackSpeedMul: 1.2 }],
    ['Vol du siècle', 'Les ennemis touchés rapportent encore 1 de mana de plus par rang.', { manaPerKillAdd: 1 }],
  ),
  ...u('harley', // Clown
    ['Grand final', 'Le sacrifice rapporte 30 % de mana en plus.', { sacrificeManaMul: 1.3 }],
    ['Ma batte préférée', '+25 % de dégâts.', { damageMul: 1.25 }],
    ['Folie douce', '+20 % de vitesse d’attaque.', { attackSpeedMul: 1.2 }],
    ['Tour de magie', '25 % de chance que le sacrifice rapporte deux fois plus de mana.', { sacrificeDoubleChance: 0.25 }],
    ['Rideau !', 'Son sacrifice donne +15 % de vitesse d’attaque à toutes tes unités pendant 6 s.', { sacrificeHaste: 0.15, sacrificeHasteDuration: 6 }],
    ['Tarte à la crème', 'Chaque coup a 15 % de chance d’étourdir 0,8 s.', { stunChance: 0.15, stunDuration: 0.8 }],
  ),
  ...u('greenarrow', // Mage de glace
    ['Givre', 'Chaque flèche ralentit de 9 % de plus au lieu de 6 %.', { coldSlowPerHitAdd: 0.03 }],
    ['Tir rapide', '+15 % de vitesse d’attaque.', { attackSpeedMul: 1.15 }],
    ['Flèche-glaçon', 'Ralentissement de 45 % au plus au lieu de 30 %.', { coldMaxSlowAdd: 0.15 }],
    ['Flèches perforantes', 'Les flèches ignorent 50 % de l’armure.', { armorPierce: 0.5 }],
    ['Gel durable', 'Le ralentissement dure 3,5 s au lieu de 2 s.', { coldDurationAdd: 1.5 }],
    ['Archer émérite', '+30 % de dégâts.', { damageMul: 1.3 }],
  ),

  // ───────────── Pack Transformers (extension) : talents de même famille que l’unité Rush Royale (C) ─────────────
  ...u('optimus', // Banshee
    ['Matrice du commandement', '+20 % de dégâts.', { damageMul: 1.2 }],
    ['Leader des Autobots', 'Se transforme toutes les 6 s au lieu de 8 s.', { transformEveryAdd: -2 }],
    ['Hache d’énergie', 'L’onde de choc frappe à 90 % au lieu de 60 %.', { shockSplashAdd: 0.3 }],
    ['Charge du camion', 'En camion, la cible recule d’une case au lieu d’une demi-case.', { chargePushAdd: 0.5 }],
    ['Un pour tous', 'Cri de ralliement toutes les 4 s au lieu de 6 s.', { abilityCooldownAdd: -2 }],
    ['Prime', '+30 % de dégâts contre les boss.', { bossDamageMul: 1.3 }],
  ),
  ...u('bumblebee', // Mage de foudre
    ['Canon chargé', '+20 % de dégâts.', { damageMul: 1.2 }],
    ['Radio', 'Chaque échange rapporte 15 de mana.', { swapMana: 15 }],
    ['Rafale continue', '+15 % de vitesse d’attaque.', { attackSpeedMul: 1.15 }],
    ['Coccinelle', 'Après un échange, +35 % de cadence au lieu de +20 %, à l’alliée échangée aussi.', { boostAdd: 0.15, swapBoostPartner: 1 }],
    ['Gardien de Sam', 'En voiture, la rafale touche 3 ennemis à 100, 70 et 30 %, plus fort de 25 %.', { vehicleDamageAdd: 0.175 }],
    ['Éclaireur', '+30 % de dégâts contre les boss.', { bossDamageMul: 1.3 }],
  ),
  ...u('ironhide', // Pyrotechnicien
    ['Feu d’artifice', 'Nombre impair : les roquettes font 120 % au lieu de 100 %.', { oddSplashAdd: 0.2 }],
    ['Grande gerbe', 'Nombre impair : rayon des roquettes +0,4 case.', { oddRadiusAdd: 0.4 }],
    ['Discipline', 'Nombre pair : −20 % de dégâts seulement au lieu de −40 %.', { evenDamageMulAdd: 0.2 }],
    ['Blindage', 'Ironhide ignore les pouvoirs de boss.', { immuneBossControl: 1 }],
    ['Chargeur rapide', 'Nombre impair : cadence ×0,87 au lieu de ×0,67.', { oddSpeedMulAdd: 0.2 }],
    ['Tank', '+30 % de dégâts contre les boss.', { bossDamageMul: 1.3 }],
  ),
  ...u('ratchet', // Sorcière
    ['Trousse de secours', 'Répare ses voisines toutes les 3 s au lieu de 4 s.', { abilityCooldownAdd: -1 }],
    ['Sirène hurlante', 'En ambulance, +30 % de vitesse aux voisines au lieu de +22 %.', { auraAttackSpeedAdd: 0.08 }],
    ['Enchantement durable', 'L’enchantement de fusion dure 15 s.', { mergeEnchantDurationAdd: 5 }],
    ['Soins d’urgence', 'L’aura touche aussi les cases en diagonale.', { auraDiagonal: 1 }],
    ['Clé à molette', 'L’enchantement de fusion donne +40 % de dégâts.', { mergeEnchantAdd: 0.15 }],
    ['Médecin-chef', 'L’ambulance garde sa sirène en robot aussi.', { auraVehicleOnly: 0 }],
  ),
  ...u('jazz', // Loup de mer
    ['Fan de musique terrienne', 'Les ennemis touchés rapportent 50 % de mana en plus.', { manaPerKillMul: 1.5 }],
    ['Projecteur', 'Aveugle 25 % du temps au lieu de 15 %.', { blindChanceAdd: 0.1 }],
    ['Trésor de guerre', 'Un boss ou un lieutenant touché par Jazz rapporte 50 de mana en plus.', { bossKillMana: 50 }],
    ['Do it with style', '+20 % de vitesse d’attaque.', { attackSpeedMul: 1.2 }],
    ['Coffre au trésor', 'Les ennemis touchés rapportent encore 1 de mana de plus par rang.', { manaPerKillAdd: 1 }],
    ['Lieutenant d’Optimus', '+25 % de dégâts.', { damageMul: 1.25 }],
  ),
  ...u('arcee', // Cristallomancien
    ['Lames jumelles', 'Chaque coup sur la même cible +16 % au lieu de +12 %.', { rampPerHitAdd: 0.04 }],
    ['Moto de course', '+15 % de vitesse d’attaque.', { attackSpeedMul: 1.15 }],
    ['Acrobate', 'En robot, 30 % de chance de critique au lieu de 20 %.', { bladeCritChanceAdd: 0.1 }],
    ['Concentration', 'Rampe jusqu’à +180 % au lieu de +120 %.', { rampMaxAdd: 0.6 }],
    ['Guerrière', 'Critiques ×2,5 au lieu de ×2.', { bladeCritMulAdd: 0.5 }],
    ['Fil du rasoir', '+30 % de dégâts contre les boss.', { bossDamageMul: 1.3 }],
  ),
  ...u('grimlock', // Chaperon rouge
    ['Moi Grimlock, roi !', 'Chaque élimination le fait grandir 50 % plus vite.', { growthPerKillAdd: 0.015 }],
    ['Épée énergétique', '+20 % de dégâts.', { damageMul: 1.2 }],
    ['Souffle de feu', 'En T-rex, la zone frappe à 85 % au lieu de 60 %.', { breathSplashAdd: 0.25 }],
    ['Dinobot', 'Fusionné, il garde 75 % de son bonus au lieu de 50 %.', { growthKeepOnMergeAdd: 0.25 }],
    ['Mâchoires', 'En T-rex, +25 % de vitesse d’attaque.', { vehicleSpeedAdd: 0.4 }],
    ['Roi des Dinobots', '+30 % de dégâts contre les boss.', { bossDamageMul: 1.3 }],
  ),
  ...u('wheeljack', // Corsaire
    ['Ingénieur', 'Chaque fois qu’il fait monter une alliée, il rapporte 25 de mana.', { promoteMana: 25 }],
    ['Mines améliorées', 'La mine frappe à 300 % au lieu de 200 %.', { mineDamageAdd: 1 }],
    ['Prototype', 'L’alliée promue gagne +30 % de vitesse d’attaque pendant 10 s.', { promoteBoost: 0.3 }],
    ['Course-poursuite', 'Une mine toutes les 3,5 s au lieu de 5 s.', { abilityCooldownAdd: -1.5 }],
    ['Explosion contrôlée', 'La mine touche 1,5 case autour au lieu de 1.', { mineRadiusAdd: 0.5 }],
    ['Génie fou', '+25 % de dégâts.', { damageMul: 1.25 }],
  ),
  ...u('hotrod', // Blazey
    ['Flammes', 'Les brûlures font 45 % des dégâts par seconde au lieu de 30 %.', { trailBurnAdd: 0.15 }],
    ['Jeune fougueux', '+15 % de vitesse d’attaque.', { attackSpeedMul: 1.15 }],
    ['Tir double', '+20 % de dégâts.', { damageMul: 1.2 }],
    ['Traînée large', 'Les flammes touchent 1,5 case autour.', { trailRadiusAdd: 0.5 }],
    ['Rodimus Prime', 'Se transforme toutes les 6 s au lieu de 8 s.', { transformEveryAdd: -2 }],
    ['Feu éternel', 'Les brûlures durent 5 s.', { trailDurationAdd: 2 }],
  ),
  ...u('elita', // Sentinelle
    ['Œil de lynx', 'Chaque tir sur la même cible +15 % au lieu de +10 %.', { rampPerHitAdd: 0.05 }],
    ['Commandante', '+15 % de vitesse d’attaque.', { attackSpeedMul: 1.15 }],
    ['Marque profonde', 'La marque donne +25 % de dégâts subis au lieu de +15 %.', { markValueAdd: 0.1 }],
    ['Patience', 'Rampe jusqu’à +150 % au lieu de +100 %.', { rampMaxAdd: 0.5 }],
    ['Perce-blindage', 'Les tirs ignorent 50 % de l’armure.', { armorPierce: 0.5 }],
    ['Elita One', '+35 % de dégâts contre les boss.', { bossDamageMul: 1.35 }],
  ),
  ...u('bulkhead', // Gargouille
    ['Démolisseur', 'Le sacrifice rapporte 30 % de mana en plus.', { sacrificeManaMul: 1.3 }],
    ['Gros bras', '+25 % de dégâts.', { damageMul: 1.25 }],
    ['Boulet', 'En robot, 25 % de chance d’étourdir au lieu de 15 %.', { wreckStunChanceAdd: 0.1 }],
    ['Coup de chance', '25 % de chance que le sacrifice rapporte deux fois plus de mana.', { sacrificeDoubleChance: 0.25 }],
    ['Wrecker', 'Son sacrifice donne +15 % de vitesse d’attaque à toutes tes unités pendant 6 s.', { sacrificeHaste: 0.15, sacrificeHasteDuration: 6 }],
    ['Tout-terrain', 'En tout-terrain, l’écrasement frappe à 70 %.', { crushSplashAdd: 0.3 }],
  ),
  ...u('sideswipe', // Lanceur
    ['Lames affûtées', 'Les lames frappent à 60 % autour au lieu de 40 %.', { bladeSplashAdd: 0.2 }],
    ['Frère de Sunstreaker', '+15 % de vitesse d’attaque.', { attackSpeedMul: 1.15 }],
    ['Dérapage', 'En voiture, traverse 3 ennemis au lieu de 2.', { pierceTargetsAdd: 1 }],
    ['Casse-cou', '+20 % de dégâts.', { damageMul: 1.2 }],
    ['Pare-chocs', 'En voiture, la traversée frappe à 90 %.', { pierceShareAdd: 0.3 }],
    ['Lame rouge', '+30 % de dégâts contre les boss.', { bossDamageMul: 1.3 }],
  ),
  ...u('prowl', // Maléfice
    ['Logique', 'En robot, ses voisines font +18 % de dégâts au lieu de +12 %.', { auraDamageAdd: 0.06 }],
    ['Barrage routier', 'En voiture, ralentit de 35 % au lieu de 25 %.', { sirenSlowAdd: 0.1 }],
    ['Stratège', 'L’analyse touche aussi les cases en diagonale.', { auraDiagonal: 1 }],
    ['Course-poursuite', 'Le ralentissement dure 3 s.', { sirenDurationAdd: 1 }],
    ['Calculateur', 'L’analyse reste active en voiture.', { auraRobotOnly: 0 }],
    ['Officier', '+25 % de dégâts.', { damageMul: 1.25 }],
  ),
  ...u('mirage', // Wukong
    ['Hologramme parfait', 'L’hologramme garde 85 % des dégâts au lieu de 75 %.', { copyDamageMulAdd: 0.1 }],
    ['Invisible', 'En robot, un coup sur deux est un critique.', { stealthEveryAdd: -1 }],
    ['Illusionniste', 'Chaque copie rapporte 20 de mana.', { copyMana: 20 }],
    ['Leurres', 'En voiture, 20 % de chance de faire reculer au lieu de 10 %.', { decoyChanceAdd: 0.1 }],
    ['Double fantôme', 'La copie a sa compétence prête tout de suite.', { copyReady: 1 }],
    ['Maître des illusions', 'La copie gagne 1 rang (au plus 7).', { copyRankBonus: 1 }],
  ),
  ...u('ultramagnus', // Épées enchantées
    ['Commandant', 'Chaque Ultra Magnus relié donne +20 % au lieu de +15 %.', { formationDamagePerAllyAdd: 0.05 }],
    ['Marteau', '+20 % de dégâts.', { damageMul: 1.2 }],
    ['Bouclier d’équipe', 'Le bouclier dure 6 s au lieu de 4 s.', { teamShieldAdd: 2 }],
    ['Porte-voitures', 'En porte-voitures, la ligne fait +18 % de dégâts au lieu de +10 %.', { rowDamageAdd: 0.08 }],
    ['Ligne parfaite', 'La formation complète frappe autour à 80 %.', { formationSplashAdd: 0.3 }],
    ['Gardien de la ville', '+30 % de dégâts contre les boss.', { bossDamageMul: 1.3 }],
  ),

  // ───────────── Pack Pixar (extension) : talents de même famille que l’unité Rush Royale (C) ─────────────
  ...u('mrincredible', // Valkyrie
    ['Force brute', '+20 % de dégâts.', { damageMul: 1.2 }],
    ['Coup de poing tonnerre', 'Le coup de poing sismique frappe à 350 %.', { lineDamageAdd: 1 }],
    ['Bob Parr', 'Coup de poing sismique toutes les 5 s au lieu de 7 s.', { abilityCooldownAdd: -2 }],
    ['Onde de choc', 'L’étourdissement dure 1,8 s.', { lineStunAdd: 0.6 }],
    ['Super-héros', '+30 % de dégâts contre les boss.', { bossDamageMul: 1.3 }],
    ['Infatigable', '+20 % de vitesse d’attaque.', { attackSpeedMul: 1.2 }],
  ),
  ...u('elastigirl', // Rôdeur du crépuscule
    ['Extension maximale', '+80 % sur l’ennemi de tête au lieu de +50 %.', { leadBonusAdd: 0.3 }],
    ['Souplesse', '+15 % de vitesse d’attaque.', { attackSpeedMul: 1.15 }],
    ['Prise ferme', 'Ralentit de 25 % au lieu de 15 %.', { leadSlowAdd: 0.1 }],
    ['Hélène', '+20 % de dégâts.', { damageMul: 1.2 }],
    ['Maman au volant', '+30 % de dégâts contre les boss.', { bossDamageMul: 1.3 }],
    ['Parachute', 'Les coups ignorent 50 % de l’armure.', { armorPierce: 0.5 }],
  ),
  ...u('frozone', // Médecin de peste
    ['Verglas', 'Le nuage ralentit de 55 % au lieu de 45 %.', { plagueSlowAdd: 0.1 }],
    ['Glace dure', 'Le nuage frappe à 200 % au lieu de 150 %.', { plagueCloudAdd: 0.5 }],
    ['Patinoire', 'Le nuage s’étend à 1,7 case.', { plagueRadiusAdd: 0.5 }],
    ['Lucius', '+20 % de dégâts.', { damageMul: 1.2 }],
    ['Blizzard', '+15 % de vitesse d’attaque.', { attackSpeedMul: 1.15 }],
    ['Givre durable', 'Le ralentissement dure 5 s.', { plagueSlowDurationAdd: 2 }],
  ),
  ...u('violetflash', // Maître des esprits
    ['Champ renforcé', 'Le champ de force dure 5 s.', { swapShieldAdd: 2 }],
    ['Super-vitesse', '+20 % de vitesse d’attaque.', { attackSpeedMul: 1.2 }],
    ['Course folle', 'Coup de duo une attaque sur 2.', { duoEveryAdd: -1 }],
    ['Relais familial', 'Chaque échange rapporte 15 de mana.', { swapMana: 15 }],
    ['Invisible', 'Après un échange, les nouvelles voisines gagnent +25 % de cadence 5 s.', { boost: 0.25, boostDuration: 5 }],
    ['Flèche', '+25 % de dégâts.', { damageMul: 1.25 }],
  ),
  ...u('sullimike', // Chaman
    ['Bob compte bien', 'Les ennemis touchés rapportent 50 % de mana en plus.', { manaPerKillMul: 1.5 }],
    ['Rugissement terrible', 'Le rugissement fait reculer de 1,5 case.', { roarPushAdd: 0.5 }],
    ['Énergie de rire', 'Un boss ou un lieutenant touché rapporte 50 de mana en plus.', { bossKillMana: 50 }],
    ['Sulli', '+20 % de dégâts.', { damageMul: 1.2 }],
    ['Cris en série', 'Rugissement toutes les 6 s.', { abilityCooldownAdd: -2 }],
    ['Monstre n° 1', 'Les ennemis touchés rapportent encore 1 de mana de plus par rang.', { manaPerKillAdd: 1 }],
  ),
  ...u('mcqueen', // Dryade des montagnes
    ['Ka-tchow !', 'Ses voisines tirent 35 % plus vite au lieu de 25 %.', { auraAttackSpeedAdd: 0.1 }],
    ['Pneus neufs', 'L’aura touche aussi les cases en diagonale.', { auraDiagonal: 1 }],
    ['Remorquage', 'Martin remorque 2 s.', { towDurationAdd: 1 }],
    ['Flash', '+20 % de dégâts.', { damageMul: 1.2 }],
    ['Piston Cup', '+15 % de vitesse d’attaque.', { attackSpeedMul: 1.15 }],
    ['Meilleurs amis', 'Coup de duo une attaque sur 3.', { duoEveryAdd: -2 }],
  ),
  ...u('carlrussell', // Invocateur
    ['Badge d’explorateur', 'Chaque promotion rapporte 25 de mana.', { promoteMana: 25 }],
    ['Plus de ballons', 'Les ballons soulèvent 3 s.', { liftDurationAdd: 1 }],
    ['Doug', 'L’alliée promue gagne +30 % de vitesse d’attaque pendant 10 s.', { promoteBoost: 0.3 }],
    ['Canne de Carl', '+25 % de dégâts.', { damageMul: 1.25 }],
    ['Lâcher de ballons', 'Ballons toutes les 4 s.', { abilityCooldownAdd: -2 }],
    ['Aventure', '+15 % de vitesse d’attaque.', { attackSpeedMul: 1.15 }],
  ),
  ...u('joysadness', // Empoisonneur
    ['Souvenir fidèle', 'La copie garde 85 % des dégâts.', { copyDamageMulAdd: 0.1 }],
    ['Tristesse contagieuse', 'Le poison fait 12 % par rang.', { poisonPerRankAdd: 0.04 }],
    ['Îlots de personnalité', 'Chaque copie rapporte 20 de mana.', { copyMana: 20 }],
    ['Souvenir doré', 'Le souvenir doré donne +35 % de dégâts.', { memoryBuffAdd: 0.15 }],
    ['Souvenir central', 'La copie a sa compétence prête tout de suite.', { copyReady: 1 }],
    ['Joie', '+20 % de dégâts.', { damageMul: 1.2 }],
  ),
  ...u('remy', // Alchimiste
    ['Ratatouille', 'Le sacrifice rapporte 30 % de mana en plus.', { sacrificeManaMul: 1.3 }],
    ['Chef étoilé', 'La recette rapporte 6 de mana par rang.', { waveManaPerRankAdd: 2 }],
    ['Coup de chance', '25 % de chance que le sacrifice rapporte deux fois plus.', { sacrificeDoubleChance: 0.25 }],
    ['Marmite', 'La soupe renversée frappe à 75 % par rang au lieu de 50 %.', { puddleDamageAdd: 0.25 }],
    ['Gusteau', '+25 % de dégâts.', { damageMul: 1.25 }],
    ['Service', 'Son sacrifice donne +15 % de vitesse d’attaque à toutes tes unités pendant 6 s.', { sacrificeHaste: 0.15, sacrificeHasteDuration: 6 }],
  ),
  ...u('walleeve', // Robot
    ['Compacteur', '+20 % de dégâts.', { damageMul: 1.2 }],
    ['Directive', 'Le rayon d’EVE frappe à 220 %.', { eveDamageAdd: 0.7 }],
    ['Plante', 'Coup de duo une attaque sur 2.', { duoEveryAdd: -1 }],
    ['Panneaux solaires', '+15 % de vitesse d’attaque.', { attackSpeedMul: 1.15 }],
    ['Axiom', 'Le rayon touche 2 cases autour.', { eveRadiusAdd: 0.5 }],
    ['EVE', '+30 % de dégâts contre les boss.', { bossDamageMul: 1.3 }],
  ),
  ...u('lucaalberto', // Tréant
    ['Portorosso', 'Chaque Luca & Alberto relié donne +20 %.', { formationDamagePerAllyAdd: 0.05 }],
    ['Vespa', '+15 % de vitesse d’attaque.', { attackSpeedMul: 1.15 }],
    ['Grosse vague', 'La vague fait reculer d’une case.', { wavePushAdd: 0.5 }],
    ['Monstre marin', '+20 % de dégâts.', { damageMul: 1.2 }],
    ['Amitié', 'La formation complète frappe autour à 80 %.', { formationSplashAdd: 0.3 }],
    ['Marée', 'Coup de duo une attaque sur 3.', { duoEveryAdd: -2 }],
  ),
  ...u('mei', // Élémentaire de terre
    ['Panda affamé', 'Chaque élimination la fait grandir 50 % plus vite.', { growthPerKillAdd: 0.015 }],
    ['Gros câlin', 'L’écrasement frappe à 75 %.', { crushSplashAdd: 0.25 }],
    ['Fan de 4*Town', 'Fusionnée, elle garde 75 % de son bonus.', { growthKeepOnMergeAdd: 0.25 }],
    ['Panda géant', '+20 % de dégâts.', { damageMul: 1.2 }],
    ['Émotions fortes', 'Sa croissance avec le temps va deux fois plus vite.', { growthPerSecondAdd: 0.004 }],
    ['Lune rouge', '+30 % de dégâts contre les boss.', { bossDamageMul: 1.3 }],
  ),
  ...u('jessie', // Lierre
    ['Yodel', 'La marque donne +15 % de dégâts subis.', { lassoMarkAdd: 0.05 }],
    ['Pile-Poil au galop', '+15 % de vitesse d’attaque.', { attackSpeedMul: 1.15 }],
    ['Lasso long', 'La cible recule pendant 2,5 s.', { lassoPullAdd: 1 }],
    ['Cow-girl', '+20 % de dégâts.', { damageMul: 1.2 }],
    ['Rodéo', 'Coup de duo une attaque sur 3.', { duoEveryAdd: -1 }],
    ['Hue !', '+30 % de dégâts contre les boss.', { bossDamageMul: 1.3 }],
  ),
  ...u('ianbarley', // Archimage
    ['Feu magique', 'La boule de feu frappe à 400 %.', { fireballAdd: 1 }],
    ['Arrêt du temps', 'L’arrêt du temps dure 2 s.', { freezeAdd: 0.5 }],
    ['Quête', 'Un sort toutes les 4,5 s.', { abilityCooldownAdd: -1.5 }],
    ['Croissance', 'Le sort de croissance donne +45 % de dégâts.', { growBuffAdd: 0.15 }],
    ['Barley', '+20 % de dégâts.', { damageMul: 1.2 }],
    ['Rayon arcanique', 'Le rayon touche 5 ennemis.', { rayTargetsAdd: 2 }],
  ),
  ...u('joe', // Nécromancien
    ['Swing', 'La musique donne +35 % de vitesse d’attaque.', { jazzHasteAdd: 0.1 }],
    ['La zone', 'La musique dure 7 s.', { jazzDurationAdd: 2 }],
    ['Étincelle', 'L’étincelle de 22 triple les dégâts.', { sparkMulAdd: 1 }],
    ['Concert', 'Musique toutes les 8 s.', { abilityCooldownAdd: -2 }],
    ['Le Grand Avant', '+20 % de dégâts.', { damageMul: 1.2 }],
    ['Âme sœur', 'Coup de duo une attaque sur 3.', { duoEveryAdd: -2 }],
  ),
];

/** Les talents d'une unité (6, plus l'éventuel talent ultime de palier 4), triés par palier puis option. */
export function talentsFor(unit: UnitId): TalentDef[] {
  return TALENTS.filter((t) => t.unit === unit).sort((a, b) => a.tier - b.tier || a.option.localeCompare(b.option));
}

/** Niveau de collection requis pour chaque palier (§5.1). */
export const TALENT_TIER_LEVELS: Record<1 | 2 | 3, number> = { 1: 5, 2: 7, 3: 9 };

/** Talent ultime (palier 4, niveau 15 de Rush Royale) : actif au niveau 10, une fois les 3 paliers choisis. */
export const FINAL_TALENT_LEVEL = 10;

/** Talent ultime d'une unité, s'il existe. */
export function finalTalentOf(unit: UnitId): TalentDef | undefined {
  return TALENTS.find((t) => t.unit === unit && t.tier === 4);
}

/** Parchemins de talent nécessaires pour ouvrir chaque palier (voir docs/campagne.md). */
export const TALENT_TIER_SCROLLS: Record<1 | 2 | 3, number> = { 1: 1, 2: 2, 3: 3 };
