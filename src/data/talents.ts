// Talents des 28 unités (§5.1 du prompt) : 3 paliers (niveaux de collection 5, 7, 9) × 2 options.
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
  ...u('spiderman', // Trappeur
    ['Toile renforcée', 'Les toiles ralentissent de 40 % au lieu de 30 %.', { netSlowAdd: 0.1 }],
    ['Double lance-toile', 'Lance 3 toiles au lieu de 2.', { netsAdd: 1 }],
    ['Toile acide', 'Chaque toile fait subir +15 % de dégâts au lieu de +10 % (Trappeur : réduction d’armure).', { netVulnAdd: 0.05 }],
    ['Toile durable', 'Les toiles durent 7 s au lieu de 5 s.', { netDurationAdd: 2 }],
    ['Toile géante', 'Les toiles couvrent un rayon de 1,5 case au lieu de 1.', { netRadiusAdd: 0.5 }],
    ['Cocon', 'Les toiles immobilisent 1 s (sauf boss).', { netStun: 1 }],
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
  ...u('bucky', // Voleur
    ['Bras de vibranium', 'Bonus aléatoire jusqu’à +250 % au lieu de +200 %.', { rogueCritMulAdd: 0.5 }],
    ['Tireur d’élite', '+15 % de vitesse d’attaque.', { attackSpeedMul: 1.15 }],
    ['Coup de crosse', '10 % de chance d’étourdir 0,5 s.', { stunDuration: 0.5, stunChance: 0.1 }],
    ['Assassin', '+30 % de dégâts contre les boss.', { bossDamageMul: 1.3 }],
    ['Soldat de l’hiver', 'Bonus aléatoire jusqu’à +300 %.', { rogueCritMulAdd: 1 }],
    ['Sans pitié', '+25 % de dégâts.', { damageMul: 1.25 }],
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
  ...u('shangchi', // Danse-lames
    ['Kung-fu', 'En dansant, +130 % de vitesse d’attaque au lieu de +100 %.', { aloneAttackSpeedAdd: 0.3 }],
    ['Dix Anneaux', 'Chaque Shang-Chi qui danse donne +15 % de dégâts au lieu de +10 %.', { dancerDamageAdd: 0.05 }],
    ['Maître', '+30 % de dégâts contre les boss et mini-boss (Danse-lames de Rush Royale).', { bossDamageMul: 1.3 }],
    ['Bâton', '+20 % de dégâts.', { damageMul: 1.2 }],
    ['Ta Lo', 'Le bonus compte jusqu’à 12 danseurs au lieu de 8.', { dancerMaxAdd: 4 }],
    ['Wenwu', 'Ignore la moitié de l’armure.', { armorPierce: 0.5 }],
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
  ...u('mulan', // Pyrotechnicien
    ['Feu d’artifice', 'Nombre impair : l’explosion fait 120 % au lieu de 100 %.', { oddSplashAdd: 0.2 }],
    ['Grande gerbe', 'Nombre impair : rayon de l’explosion +0,4 case.', { oddRadiusAdd: 0.4 }],
    ['Discipline', 'Nombre pair : −20 % de dégâts seulement au lieu de −40 %.', { evenDamageMulAdd: 0.2 }],
    ['Souffle de Mushu', 'Brûle la cible : 20 % des dégâts par seconde pendant 3 s.', { burnPerSecond: 0.2, burnDuration: 3 }],
    ['Fleur qui s’épanouit', 'Nombre impair : cadence ×0,87 au lieu de ×0,67.', { oddSpeedMulAdd: 0.2 }],
    ['Honneur', '+30 % de dégâts contre les boss.', { bossDamageMul: 1.3 }],
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
  ...u('foxhound', // Jumeaux
    ['Chasse', 'Le second coup fait +75 % au lieu de +50 %.', { secondHitBonusAdd: 0.25 }],
    ['Course', '+15 % de vitesse d’attaque.', { attackSpeedMul: 1.15 }],
    ['Flair', '+20 % de dégâts.', { damageMul: 1.2 }],
    ['Meute', '+30 % de dégâts contre les boss.', { bossDamageMul: 1.3 }],
    ['Trio', 'Une troisième attaque.', { hitsAdd: 1 }],
    ['Morsure', '10 % de chance d’étourdir 0,5 s.', { stunDuration: 0.5, stunChance: 0.1 }],
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
