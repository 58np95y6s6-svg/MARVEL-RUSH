// Statistiques affichées par la fiche de héros (onglets Principal et Stats), façon fiche d'unité de
// Rush Royale : Offensif, Intervalle d'attaque, chiffres clés de la compétence. Tout est calculé à
// partir des paramètres résolus du moteur (talents, éveil, niveau de collection), pour un rang de
// fusion et un niveau d'amélioration en partie donnés (boutons d'aperçu de l'onglet Stats).
import type { UnitDef, UnitId } from '../data/types';
import { UNITS } from '../data/units';
import { AWAKENING_ATTACK_SPEED, AWAKENING_DAMAGE, resolveUnitParams } from '../engine/talents';
import { POWERUP_ATTACK_SPEED, POWERUP_DAMAGE, levelDamageMul } from '../engine/internal';
import { growthBonus } from '../engine/archetypes';

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
  abilityCooldown: { label: 'Recharge de la compétence', icon: 'temps', fmt: (v, _u, c, prm) => sec(Math.max(0.5, v + (prm.abilityCooldownPerRank ?? 0) * (c.rank - 1))), delta: dS },
};

/** Dégâts d'un coup (sans compétence) au niveau, à l'amélioration en partie et à l'éveil donnés. */
export function offense(u: UnitDef, c: StatCtx, prm: Record<string, number>): number {
  return u.damage * levelDamageMul(u, c.level) * (1 + POWERUP_DAMAGE * (c.powerUp - 1))
    * (1 + AWAKENING_DAMAGE * c.stars) * (prm.damageMul ?? 1);
}

/** Intervalle d'attaque (règle Rush Royale : ÷ rang). */
export function interval(u: UnitDef, c: StatCtx, prm: Record<string, number>): number {
  const puSpeed = prm.powerUpAttackSpeed ?? POWERUP_ATTACK_SPEED;
  return u.attackInterval / (c.rank * (1 + puSpeed * (c.powerUp - 1)) * (1 + AWAKENING_ATTACK_SPEED * c.stars) * (prm.attackSpeedMul ?? 1));
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
    const tile: StatTile = { key, label: row.label, value: row.fmt(v, u, c, prm), icon: row.icon };
    const nv = nxt[key];
    if (row.delta && nv !== undefined && Math.abs(nv - v) > 1e-9) tile.next = row.delta(nv - v);
    out.push(tile);
  }
  return out;
}
