// Statistiques affichées par la fiche de héros (onglets Principal et Stats), façon fiche d'unité de
// Rush Royale : Offensif, Intervalle d'attaque, chiffres clés de la compétence. Tout est calculé à
// partir des paramètres résolus du moteur (talents, éveil, niveau de collection), pour un rang de
// fusion et un niveau d'amélioration en partie donnés (boutons d'aperçu de l'onglet Stats).
import type { UnitDef, UnitId } from '../data/types';
import { UNITS } from '../data/units';
import { AWAKENING_ATTACK_SPEED, AWAKENING_DAMAGE, resolveUnitParams } from '../engine/talents';
import { POWERUP_ATTACK_SPEED, POWERUP_DAMAGE, levelDamageMul } from '../engine/internal';
import { growthBonus, KILL_MANA, SACRIFICE_MANA } from '../engine/archetypes';

export interface StatCtx {
  level: number;       // niveau de collection (1..10)
  rank: number;        // rang de fusion (1..7)
  powerUp: number;     // amélioration en partie (1..5)
  stars: number;       // éveil (0..10)
  talents?: readonly ('a' | 'b')[];
}

export type StatIcon = 'epee' | 'vitesse' | 'zone' | 'max' | 'cible' | 'portee' | 'temps' | 'mana' | 'aura' | 'crit' | 'controle' | 'bouclier' | 'univers' | 'type';

export interface StatTile {
  key: string;
  label: string;
  value: string;
  /** Gain au prochain niveau de collection (« +129 »), affiché en vert. */
  next?: string;
  icon: StatIcon;
}

const nf = (n: number, d = 2) => n.toLocaleString('fr-FR', { maximumFractionDigits: d });
const pct = (x: number) => `${nf(Math.round(x * 1000) / 10, 1)} %`;
const sec = (x: number) => `${nf(x, 2)} s`;
const mul = (x: number) => `×${nf(x, 2)}`;

type Fmt = (v: number, u: UnitDef, c: StatCtx, prm: Record<string, number>) => string;
interface Row { label: string; icon: StatIcon; fmt: Fmt; delta?: (dv: number) => string }

const P: Fmt = (v) => pct(v);
const S: Fmt = (v) => sec(v);
const N: Fmt = (v) => nf(v, 1);
const dP = (dv: number) => `+${pct(dv).replace(' %', '')} %`;
const dS = (dv: number) => `${dv > 0 ? '+' : '−'}${nf(Math.abs(dv), 2)} s`;
const dN = (dv: number) => `+${nf(dv, 1)}`;

/** Chiffres de compétence affichés, dans l'ordre (les clés absentes de l'unité sont ignorées). */
const ABILITY_ROWS: Record<string, Row> = {
  rampPerHit: { label: 'Dégâts augmentés', icon: 'epee', fmt: P, delta: dP },
  rampMax: { label: 'Limite d’augmentation de dégâts', icon: 'max', fmt: P, delta: dP },
  areaDamage: { label: 'Dégâts de zone', icon: 'zone', fmt: P, delta: dP },
  activeAttackSpeed: { label: 'Intervalle d’attaque actif', icon: 'vitesse', fmt: (v, u, c) => sec(u.attackInterval / v / Math.max(1, c.rank)) },
  growthPerMana: { label: 'Bonus avec 100 de mana', icon: 'mana', fmt: (_v, _u, _c, prm) => `+${pct(growthBonus(prm, 100 * (prm.growthPerMana ?? 1)))}` },
  chargeDamage: { label: 'Dégâts par charge (max)', icon: 'epee', fmt: P, delta: dP },
  chargedExtraTargets: { label: 'Cibles en plus (chargé)', icon: 'zone', fmt: N },
  chargedSplash: { label: 'Dégâts des cibles en plus', icon: 'zone', fmt: P },
  webSplash: { label: 'Dégâts de zone', icon: 'zone', fmt: P },
  webRadius: { label: 'Rayon de zone', icon: 'zone', fmt: (v) => `${nf(v, 1)} case${v >= 2 ? 's' : ''}` },
  webStun: { label: 'Durée du collage', icon: 'controle', fmt: S },
  webRestun: { label: 'Délai avant de recoller', icon: 'temps', fmt: S },
  thunderDamage: { label: 'Dégâts de la chaîne', icon: 'zone', fmt: P },
  thunderTargetsPerRank: { label: 'Ennemis dans la chaîne', icon: 'zone', fmt: (v, _u, c, prm) => nf(Math.round(v * c.rank + (prm.thunderTargetsAdd ?? 0)), 0) },
  thunderDaze: { label: 'Étourdissement', icon: 'controle', fmt: S },
  executeThreshold: { label: 'Seuil d’exécution', icon: 'epee', fmt: P, delta: dP },
  executeBossFactor: { label: 'Seuil contre les boss', icon: 'crit', fmt: (v, _u, _c, prm) => pct(v * (prm.executeThreshold ?? 0)) },
  netDamage: { label: 'Dégâts des toiles', icon: 'epee', fmt: N, delta: dN },
  nets: { label: 'Toiles par lancer', icon: 'controle', fmt: N },
  netSlow: { label: 'Ralentissement', icon: 'controle', fmt: P },
  netVuln: { label: 'Dégâts subis', icon: 'epee', fmt: P },
  quakeDps: { label: 'Séisme (dégâts par seconde)', icon: 'zone', fmt: P },
  quakeSlow: { label: 'Ralentissement', icon: 'controle', fmt: P },
  quakeDuration: { label: 'Durée du Séisme', icon: 'temps', fmt: S },
  teleportChance: { label: 'Chance de renvoi', icon: 'controle', fmt: P },
  splash: { label: 'Dégâts de zone', icon: 'zone', fmt: P },
  splashRadius: { label: 'Rayon de zone', icon: 'zone', fmt: (v) => `${nf(v, 1)} case${v >= 2 ? 's' : ''}` },
  auraAttackSpeedPerRank: { label: 'Vitesse aux voisines (rang)', icon: 'aura', fmt: (v, _u, c) => pct(v * c.rank), delta: dP },
  auraDamagePerRank: { label: 'Dégâts aux voisines (rang)', icon: 'aura', fmt: (v, _u, c) => pct(v * c.rank) },
  evenCritChancePerRank: { label: 'Critique en nombre pair', icon: 'crit', fmt: (v, _u, c) => pct(v * c.rank) },
  copyDamageMul: { label: 'Dégâts de la copie', icon: 'epee', fmt: P, delta: dP },
  rogueCritMul: { label: 'Bonus aléatoire max', icon: 'crit', fmt: (v) => `+${pct(v - 1)}` },
  powerUpAttackSpeed: { label: 'Vitesse par amélioration', icon: 'vitesse', fmt: P },
  bossWaveDamageMul: { label: 'Dégâts pendant un boss', icon: 'epee', fmt: (v) => mul(v) },
  sacrificeManaPerRank: { label: 'Mana du sacrifice', icon: 'mana', fmt: (v, _u, c) => nf(v * c.rank, 0) },
  aloneAttackSpeed: { label: 'Vitesse quand il danse', icon: 'vitesse', fmt: (v) => `+${pct(v)}` },
  dancerDamage: { label: 'Dégâts par danseur', icon: 'epee', fmt: P },
  hurricaneDuration: { label: 'Durée de l’Ouragan', icon: 'temps', fmt: (v, _u, c, prm) => sec(v + (prm.hurricaneDurationPerRank ?? 0) * (c.rank - 1)), delta: dS },
  hurricaneSpeedMul: { label: 'Cadence en Ouragan', icon: 'vitesse', fmt: (v) => mul(v) },
  hawkSpeed: { label: 'Vitesse (faucon)', icon: 'vitesse', fmt: (v) => `+${pct(v)}` },
  sharkSpeed: { label: 'Vitesse (requin)', icon: 'vitesse', fmt: (v) => `+${pct(v)}` },
  sharkCritChance: { label: 'Critique (requin)', icon: 'crit', fmt: P },
  oddSplash: { label: 'Zone (nombre impair)', icon: 'zone', fmt: P },
  evenDamageMul: { label: 'Dégâts (nombre pair)', icon: 'epee', fmt: P },
  firstShotBonus: { label: 'Premier tir', icon: 'epee', fmt: (v, _u, c, prm) => `+${pct(v + (prm.firstShotBonusPerRank ?? 0) * (c.rank - 1))}`, delta: dP },
  stasisDuration: { label: 'Durée du gel', icon: 'temps', fmt: S, delta: dS },
  hits: { label: 'Coups par attaque', icon: 'epee', fmt: N },
  secondHitBonus: { label: 'Bonus du 2e coup', icon: 'epee', fmt: (v) => `+${pct(v)}` },
  biteManaPerSecond: { label: 'Mana par seconde (morsure)', icon: 'mana', fmt: N },
  manaPerRank: { label: 'Mana (par rang)', icon: 'mana', fmt: (v, _u, c) => nf(v * c.rank, 0) },
  vulnPerRank: { label: 'Dégâts subis (fiche)', icon: 'epee', fmt: (v, _u, c) => `+${pct(v * c.rank)}`, delta: dP },
  formationDamagePerAlly: { label: 'Dégâts par allié relié', icon: 'aura', fmt: P, delta: dP },
  formationMax: { label: 'Alliés comptés au plus', icon: 'aura', fmt: N },
  swapSleep: { label: 'Bug après échange', icon: 'temps', fmt: S },
  // ——— Extension DC ———
  targetsMax: { label: 'Ennemis touchés', icon: 'zone', fmt: (v, _u, c, prm) => nf(Math.min(v, Math.max(1, (prm.targetsPerRank ?? 1) * c.rank)), 0) }, // Chasseur de démons (Batman)
  blizzardSlowPerRank: { label: 'Ralenti par givre', icon: 'controle', fmt: (v, _u, c) => pct(v * c.rank) },                // Givre (Superman)
  blizzardStacks: { label: 'Givre cumulé au plus', icon: 'max', fmt: N },
  blizzardDuration: { label: 'Durée du givre', icon: 'temps', fmt: S },
  powerSpeed: { label: 'Vitesse en Fureur', icon: 'vitesse', fmt: (v) => `+${pct(v)}` },                                           // Moine (Wonder Woman)
  powerSplash: { label: 'Dégâts de zone en Fureur', icon: 'zone', fmt: P },
  powerDuration: { label: 'Durée de la Fureur', icon: 'temps', fmt: S },
  formationTargetsPerAlly: { label: 'Cibles en plus par allié relié', icon: 'zone', fmt: N },                                        // Cultiste (Green Lantern)
  formationTargetsMax: { label: 'Cibles en plus au plus', icon: 'max', fmt: N },
  formationDoubleAt: { label: 'Dégâts doublés à partir de', icon: 'aura', fmt: (v) => `${nf(v, 0)} reliés` },
  rageChancePerEnemy: { label: 'Chance de rage par ennemi', icon: 'crit', fmt: P },                                                  // Cogneur (Flash)
  rageSpeed: { label: 'Vitesse en rage', icon: 'vitesse', fmt: (v) => `+${pct(v)}` },
  rageDamage: { label: 'Dégâts en rage', icon: 'epee', fmt: (v) => `+${pct(v)}` },
  rageDuration: { label: 'Durée de la rage', icon: 'temps', fmt: S },
  reapChance: { label: 'Chance de faucher', icon: 'crit', fmt: P, delta: dP },                                                      // Faucheuse (Aquaman)
  vortexSpeed: { label: 'Vitesse par charge', icon: 'vitesse', fmt: P },                                                             // Génie (Cyborg)
  vortexDamage: { label: 'Dégâts par charge', icon: 'epee', fmt: P },
  vortexMax: { label: 'Charges au plus', icon: 'max', fmt: N },
  auraAttackSpeed: { label: 'Vitesse aux voisines', icon: 'aura', fmt: P },
  growthPerKill: { label: 'Croissance par élimination', icon: 'epee', fmt: N },                                                      // Barde (Supergirl)
  growthKeepOnMerge: { label: 'Croissance gardée à la fusion', icon: 'aura', fmt: P },
  haste: { label: 'Accélération (compétence)', icon: 'vitesse', fmt: (v) => `+${pct(v)}` },
  hasteDuration: { label: 'Durée de l’accélération', icon: 'temps', fmt: S },
  meteorDamage: { label: 'Dégâts du Météore', icon: 'zone', fmt: P },                                                                // Météore (Shazam)
  meteorStun: { label: 'Étourdissement', icon: 'controle', fmt: S },
  promoteDoubleChance: { label: 'Chance de monter de 2 rangs', icon: 'crit', fmt: P, delta: dP },                                   // Ferrailleur (Robin)
  manaPerKill: { label: 'Mana par ennemi marqué', icon: 'mana', fmt: (v, _u, c) => nf(Math.round((KILL_MANA[c.rank - 1] ?? 1) * v), 0) }, // Démonologue (Catwoman)
  sacrificeMana: { label: 'Mana du sacrifice', icon: 'mana', fmt: (v, _u, c, prm) => prm.sacrificeManaPerRank ? '' : nf(Math.round((SACRIFICE_MANA[c.rank - 1] ?? 10) * v), 0) }, // Clown (Harley Quinn)
  coldSlowPerHit: { label: 'Ralentissement par flèche', icon: 'controle', fmt: P },                                                  // Flèches cryogéniques (Green Arrow)
  coldMaxSlow: { label: 'Ralentissement au plus', icon: 'max', fmt: P },
  coldDuration: { label: 'Durée du froid', icon: 'temps', fmt: S },
  // ——— Extension Transformers : transformation (mécanique propre) et profils des Autobots ———
  transformEvery: { label: 'Transformation toutes les', icon: 'temps', fmt: S, delta: dS },
  robotDamage: { label: 'Dégâts en robot', icon: 'epee', fmt: (v) => mul(v) },
  robotSpeed: { label: 'Cadence en robot', icon: 'vitesse', fmt: (v) => mul(v) },
  vehicleDamage: { label: 'Dégâts en véhicule', icon: 'epee', fmt: (v) => mul(v) },
  vehicleSpeed: { label: 'Cadence en véhicule', icon: 'vitesse', fmt: (v) => mul(v) },
  shockSplash: { label: 'Onde de choc', icon: 'zone', fmt: P },                                          // Banshee (Optimus)
  rallyDamage: { label: 'Cri de ralliement', icon: 'zone', fmt: P },
  chargePush: { label: 'Recul de la charge', icon: 'controle', fmt: (v) => `${nf(v, 1)} case` },
  burstShares: { label: 'Cibles de la rafale', icon: 'zone', fmt: N },                                   // Mage de foudre (Bumblebee)
  vanSplash: { label: 'Zone du fourgon', icon: 'zone', fmt: P },
  // Sorcière (Ratchet) — auraAttackSpeed : ligne commune (section DC)
  mergeEnchant: { label: 'Enchantement de fusion', icon: 'epee', fmt: (v) => `+${pct(v)}` },
  // Loup de mer (Jazz) — manaPerKill : ligne commune (section DC)
  blindChance: { label: 'Chance d’aveugler', icon: 'controle', fmt: P },
  bladeCritChance: { label: 'Critique des lames', icon: 'crit', fmt: P },                               // Cristallomancien (Arcee)
  // Chaperon rouge (Grimlock) — growthPerKill : ligne commune (section DC)
  breathSplash: { label: 'Souffle de feu', icon: 'zone', fmt: P },
  mineDamage: { label: 'Dégâts de la mine', icon: 'zone', fmt: P },                                     // Corsaire (Wheeljack)
  trailBurn: { label: 'Brûlure par seconde', icon: 'epee', fmt: P },                                    // Blazey (Hot Rod)
  markValue: { label: 'Dégâts subis (marque)', icon: 'epee', fmt: (v) => `+${pct(v)}` },               // Sentinelle (Elita-1)
  // Gargouille (Bulkhead) — sacrificeMana : ligne commune (section DC)
  wreckStunChance: { label: 'Chance d’étourdir', icon: 'controle', fmt: P },
  bladeSplash: { label: 'Zone des lames', icon: 'zone', fmt: P },                                       // Lanceur (Sideswipe)
  pierceTargets: { label: 'Ennemis traversés', icon: 'zone', fmt: N },
  auraDamage: { label: 'Dégâts aux voisines', icon: 'aura', fmt: P },                                   // Maléfice (Prowl)
  sirenSlow: { label: 'Ralentissement', icon: 'controle', fmt: P },
  stealthCritMul: { label: 'Critique invisible', icon: 'crit', fmt: (v) => mul(v) },                    // Wukong (Mirage)
  decoyChance: { label: 'Chance de leurre', icon: 'controle', fmt: P },
  teamShield: { label: 'Bouclier d’équipe', icon: 'temps', fmt: S },                                     // Épées enchantées (Ultra Magnus)
  rowDamage: { label: 'Dégâts à la ligne', icon: 'aura', fmt: (v) => `+${pct(v)}` },
  // ——— Extension Pixar : archétypes et profils Rush Royale ———
  // auraAttackSpeed : ligne commune (section DC ou Transformers)
  // manaPerKill : ligne commune (section DC ou Transformers)
  // growthPerKill : ligne commune (section DC ou Transformers)
  // growthKeepOnMerge : ligne commune (section DC ou Transformers)
  // sacrificeMana : ligne commune (section DC ou Transformers)
  // auraDamage : ligne commune (section DC ou Transformers)
  duoEvery: { label: 'Coup de duo toutes les', icon: 'temps', fmt: (v) => `${nf(v, 0)} attaques` },                // mécanique Pixar
  lineDamage: { label: 'Coup de poing sismique', icon: 'zone', fmt: P },                                  // Valkyrie (M. Indestructible)
  lineStun: { label: 'Étourdissement', icon: 'controle', fmt: S },
  leadBonus: { label: 'Bonus sur l’ennemi de tête', icon: 'epee', fmt: (v) => `+${pct(v)}` },             // Rôdeur (Elastigirl)
  plagueCloud: { label: 'Dégâts du nuage de glace', icon: 'zone', fmt: P },                              // Médecin de peste (Frozone)
  plagueSlow: { label: 'Ralentissement', icon: 'controle', fmt: P },
  puddleDamage: { label: 'Soupe renversée (par rang)', icon: 'zone', fmt: (v, _u, c) => pct(v * c.rank) }, // Alchimiste (Rémy)
  swapShield: { label: 'Champ de force', icon: 'temps', fmt: S },                                         // Maître des esprits (Violette)
  roarPush: { label: 'Recul du rugissement', icon: 'controle', fmt: (v) => `${nf(v, 1)} case` },          // Chaman (Sulli)
  liftDuration: { label: 'Soulevé par les ballons', icon: 'controle', fmt: S },                           // Invocateur (Carl)
  poisonPerRank: { label: 'Poison par seconde', icon: 'epee', fmt: (v, _u, c) => pct(v * c.rank) },        // Empoisonneur (Tristesse)
  waveManaPerRank: { label: 'Mana par vague', icon: 'mana', fmt: (v, _u, c) => nf(v * c.rank, 0) },        // Alchimiste (Rémy)
  eveDamage: { label: 'Rayon d’EVE', icon: 'zone', fmt: P },                                              // Robot (WALL-E)
  crushSplash: { label: 'Écrasement', icon: 'zone', fmt: P },                                             // Élémentaire de terre (Mei)
  lassoMark: { label: 'Dégâts subis (lasso)', icon: 'epee', fmt: (v) => `+${pct(v)}` },                   // Lierre (Jessie)
  fireball: { label: 'Boule de feu', icon: 'zone', fmt: P },                                              // Archimage (Ian)
  jazzHaste: { label: 'Vitesse à tout le plateau', icon: 'aura', fmt: (v) => `+${pct(v)}` },             // Nécromancien (Joe)
  jazzDuration: { label: 'Durée de la musique', icon: 'temps', fmt: S },
  abilityCooldown: { label: 'Recharge de la compétence', icon: 'temps', fmt: (v, _u, c, prm) => sec(Math.max(0.5, v + (prm.abilityCooldownPerRank ?? 0) * (c.rank - 1))), delta: dS },
};

/** Dégâts d'un coup (sans compétence) au niveau, à l'amélioration en partie et à l'éveil donnés. */
export function offense(u: UnitDef, c: StatCtx, prm: Record<string, number>): number {
  return u.damage * (prm.rankDamage ? c.rank : 1) * levelDamageMul(u, c.level) * (1 + POWERUP_DAMAGE * (c.powerUp - 1))
    * (1 + AWAKENING_DAMAGE * c.stars) * (prm.damageMul ?? 1);
}

/** Intervalle d'attaque (règle Rush Royale : ÷ rang). */
export function interval(u: UnitDef, c: StatCtx, prm: Record<string, number>): number {
  const puSpeed = prm.powerUpAttackSpeed ?? POWERUP_ATTACK_SPEED;
  return u.attackInterval / ((prm.rankDamage ? 1 : c.rank) * (1 + puSpeed * (c.powerUp - 1)) * (1 + AWAKENING_ATTACK_SPEED * c.stars) * (prm.attackSpeedMul ?? 1));
}

export function paramsFor(id: UnitId, c: StatCtx): Record<string, number> {
  return resolveUnitParams(id, UNITS[id].ability.params, c.level, c.talents, c.stars);
}

/** Offensif et Intervalle d'attaque, avec le gain du prochain niveau de collection. */
export function coreStats(id: UnitId, c: StatCtx): { offense: StatTile; interval: StatTile } {
  const u = UNITS[id];
  const prm = paramsFor(id, c);
  const dmg = offense(u, c, prm);
  const nextDmg = c.level < 10 ? offense(u, { ...c, level: c.level + 1 }, paramsFor(id, { ...c, level: c.level + 1 })) : dmg;
  return {
    offense: {
      key: 'offense', label: 'Offensif', icon: 'epee',
      value: u.damage > 0 ? nf(Math.round(dmg), 0) : '—',
      ...(u.damage > 0 && nextDmg > dmg ? { next: `+${nf(Math.round(nextDmg) - Math.round(dmg), 0)}` } : {}),
    },
    interval: { key: 'interval', label: 'Intervalle d’attaque', icon: 'vitesse', value: u.damage > 0 ? sec(interval(u, c, prm)) : 'Pas d’attaque' },
  };
}

/** Chiffres de la compétence (onglets Principal et Stats). */
export function abilityStats(id: UnitId, c: StatCtx): StatTile[] {
  const u = UNITS[id];
  const base = u.ability.params;
  const prm = paramsFor(id, c);
  const nxt = c.level < 10 ? paramsFor(id, { ...c, level: c.level + 1 }) : prm;
  const out: StatTile[] = [];
  for (const [key, row] of Object.entries(ABILITY_ROWS)) {
    const v = prm[key];
    if (v === undefined || !(key in base)) continue;
    const value = row.fmt(v, u, c, prm);
    if (!value) continue;
    const tile: StatTile = { key, label: row.label, value, icon: row.icon };
    const nv = nxt[key];
    if (row.delta && nv !== undefined && Math.abs(nv - v) > 1e-9) tile.next = row.delta(nv - v);
    out.push(tile);
  }
  return out;
}
