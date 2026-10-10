// Primitives de combat : ciblage, dégâts, effets sur les ennemis, éliminations, statistiques
// des unités (rang, niveau, améliorations, équipes, auras, talents).

import { BOSS_STATS } from '../data/bosses';
import { ENEMIES, killMana } from '../data/enemies';
import type { Targeting, UnitDef, UnitId } from '../data/types';
import { UNITS } from '../data/units';
import { GRID_COLS, GRID_ROWS, GRID_SIZE, type LaneId } from './types';
import {
  BASE_CRIT_CHANCE, DT, EPS, MANA_UPGRADE_BONUS, levelDamageMul, NO_TEAM, POWERUP_ATTACK_SPEED, POWERUP_DAMAGE, emit, pick, rand,
  type Ctx, type SimEnemy, type SimUnit, type TeamAgg,
} from './internal';
import { AWAKENING_ATTACK_SPEED, AWAKENING_DAMAGE, AWAKENING_MAX, resolveUnitParams } from './talents';
import { bossReward, formationBonus, growOnKill, growthBonus, growthPointsOf, tagForMana } from './archetypes';
import { auraActive, enchantBonus, jammed, rowBonus, tfDamageMul, tfSpeedMul } from './transformers';
import { BOSSES, REFORM_NAME } from '../data/bosses';
import { pxDamageBonus } from './pixar';

// ───────────── Ennemis du chemin ─────────────
// Solo : une branche 'a' jusqu'au château. Coop : deux branches 'a' et 'b' qui se rejoignent
// dans le tronc commun 'tronc'. Chaque unité ne vise que les ennemis de sa zone de touche (portée,
// voir geometry.ts et inRange dans abilities.ts), sur toutes les branches.

export function aliveAll(ctx: Ctx): SimEnemy[] {
  const out: SimEnemy[] = [];
  for (const e of ctx.st.enemies) if (e.hp > 0 && !e.x.gone) out.push(e);
  return out;
}

export function isAlive(e: SimEnemy): boolean {
  return e.hp > 0 && !e.x.gone;
}

export function laneLength(ctx: Ctx, lane: LaneId): number {
  return ctx.laneLen[lane] ?? 0;
}

/** Cases restantes avant le château. */
export function remaining(ctx: Ctx, e: SimEnemy): number {
  if (e.lane === 'tronc') return laneLength(ctx, 'tronc') - e.distance;
  return laneLength(ctx, e.lane) - e.distance + (ctx.coop ? laneLength(ctx, 'tronc') : 0);
}

/** Avancée vers le château (plus grand = plus avancé), pour le ciblage « premier ». */
export function progress(ctx: Ctx, e: SimEnemy): number {
  return -remaining(ctx, e);
}

/** Distance entre deux ennemis le long du chemin en Y. */
export function gap(ctx: Ctx, a: SimEnemy, b: SimEnemy): number {
  if (a.lane === b.lane) return Math.abs(a.distance - b.distance);
  if (a.lane === 'tronc') return laneLength(ctx, b.lane) - b.distance + a.distance;
  if (b.lane === 'tronc') return laneLength(ctx, a.lane) - a.distance + b.distance;
  return laneLength(ctx, a.lane) - a.distance + laneLength(ctx, b.lane) - b.distance;
}

function better(a: SimEnemy, b: SimEnemy, key: (e: SimEnemy) => number): boolean {
  const ka = key(a), kb = key(b);
  return ka > kb || (ka === kb && a.uid < b.uid);
}

export function bestBy(list: readonly SimEnemy[], key: (e: SimEnemy) => number): SimEnemy | undefined {
  let best: SimEnemy | undefined;
  for (const e of list) if (!best || better(e, best, key)) best = e;
  return best;
}

/** Les n meilleurs selon la clé (ordre décroissant, égalités par uid). */
export function topBy(list: readonly SimEnemy[], key: (e: SimEnemy) => number, n: number): SimEnemy[] {
  return list.slice().sort((a, b) => key(b) - key(a) || a.uid - b.uid).slice(0, n);
}

export function selectTarget(ctx: Ctx, list: readonly SimEnemy[], targeting: Targeting): SimEnemy | undefined {
  if (list.length === 0) return undefined;
  if (targeting === 'premier') return bestBy(list, (e) => progress(ctx, e));
  if (targeting === 'fort') return bestBy(list, (e) => e.hp);
  return pick(ctx, list);
}

/** Les ennemis les plus proches de `from` sur le chemin (hors exclus). */
export function nearest(ctx: Ctx, list: readonly SimEnemy[], from: SimEnemy, n: number, exclude: ReadonlySet<number>): SimEnemy[] {
  return list
    .filter((e) => !exclude.has(e.uid))
    .map((e) => [e, gap(ctx, e, from)] as const)
    .sort((a, b) => a[1] - b[1] || a[0].uid - b[0].uid)
    .slice(0, n)
    .map(([e]) => e);
}

export function within(ctx: Ctx, list: readonly SimEnemy[], from: SimEnemy, radius: number): SimEnemy[] {
  return list.filter((e) => e !== from && gap(ctx, e, from) <= radius);
}

/** Chaque branche est découpée en 3 lignes (montée, traversée, descente), comme le U de Rush Royale. */
export function segmentOf(ctx: Ctx, e: SimEnemy): string {
  const len = laneLength(ctx, e.lane);
  return `${e.lane}${Math.min(2, Math.max(0, Math.floor(e.distance / (len / 3))))}`;
}

/** Recule un ennemi (en repassant du tronc à sa branche d'origine si besoin). */
export function retreat(ctx: Ctx, e: SimEnemy, cells: number): void {
  const d = e.distance - cells;
  if (d >= 0) { e.distance = d; return; }
  if (e.lane === 'tronc' && e.x.from) {
    e.lane = e.x.from;
    e.distance = Math.max(0, laneLength(ctx, e.lane) + d);
    return;
  }
  e.distance = 0;
}

/** Renvoie un ennemi au début de son chemin (portail de Doctor Strange). */
export function sendToStart(e: SimEnemy): void {
  if (e.lane === 'tronc' && e.x.from) e.lane = e.x.from;
  e.distance = 0;
}

// ───────────── Effets ─────────────

export function applyStun(e: SimEnemy, duration: number): boolean {
  if (e.bossId || e.x.mini || duration <= 0) return false;
  e.effects.stunFor = Math.max(e.effects.stunFor ?? 0, duration);
  return true;
}

export function applySlow(ctx: Ctx, e: SimEnemy, value: number, duration: number): void {
  if (e.x.flying || value <= 0) return;
  const v = Math.min(0.9, value * (1 + (ctx.mods.slowPower ?? 0)));
  const active = (e.effects.slowFor ?? 0) > EPS;
  e.effects.slow = active ? Math.max(e.effects.slow ?? 0, v) : v;
  e.effects.slowFor = Math.max(active ? e.effects.slowFor ?? 0 : 0, duration);
}

/** Déplace un ennemi vers le début du chemin (sauf boss et volants). */
export function pushBack(ctx: Ctx, e: SimEnemy, cells: number): boolean {
  if (e.bossId || e.x.mini || e.x.flying) return false;
  retreat(ctx, e, cells);
  return true;
}

export function applyBurn(e: SimEnemy, dps: number, duration: number, player: number): void {
  if (dps <= 0) return;
  const active = (e.effects.burnFor ?? 0) > EPS;
  e.effects.burn = active ? Math.max(e.effects.burn ?? 0, dps) : dps;
  e.effects.burnFor = Math.max(active ? e.effects.burnFor ?? 0 : 0, duration);
  e.x.burnBy = player;
}

// ───────────── Dégâts et éliminations ─────────────

export interface HitOpts {
  crit?: boolean;
  shieldBreak?: boolean;
  armorPierce?: number;
  /** Dégâts sur la durée : ignorent boucliers et armure. */
  dot?: boolean;
  /** Unité à l'origine du coup (archétype Croissance : elle compte ses éliminations). */
  unit?: SimUnit;
}

/** Inflige des dégâts ; renvoie les dégâts réellement infligés. */
export function dealDamage(ctx: Ctx, e: SimEnemy, amount: number, player: number, opts: HitOpts = {}): number {
  if (!isAlive(e) || amount <= 0) return 0;
  let dmg = amount;
  if (!opts.dot) {
    if (e.shieldHits > 0) {
      if (opts.shieldBreak) {
        e.shieldHits = 0;
      } else {
        e.shieldHits -= 1;
        emit(ctx, { type: 'hit', enemy: e.uid, damage: 0, crit: false });
        return 0;
      }
    }
    const armor = Math.max(0, e.armor - (e.effects.armorBreak ?? 0)) * (1 - Math.min(1, opts.armorPierce ?? 0));
    dmg *= 1 - armor;
    if ((e.effects.markedFor ?? 0) > EPS) dmg *= 1 + (e.effects.marked ?? 0);
    dmg *= 1 + vulnerability(e);
  }
  e.hp -= dmg;
  emit(ctx, { type: 'hit', enemy: e.uid, damage: dmg, crit: !!opts.crit });
  if (e.hp <= EPS && reform(ctx, e)) return dmg;
  if (e.hp <= EPS) killEnemy(ctx, e, player, opts.unit);
  return dmg;
}

/** Devastator (extension Transformers) : formé de 6 Constructicons, il se reforme une fois. */
function reform(ctx: Ctx, e: SimEnemy): boolean {
  if (e.bossId !== 'devastator' || e.x.reformed) return false;
  e.x.reformed = 1;
  e.hp = e.maxHp * (BOSSES.devastator.power.params.reformHp ?? 0.4);
  emit(ctx, { type: 'bossPower', boss: 'devastator', player: ctx.st.players[0]!.id, slots: [], name: REFORM_NAME });
  return true;
}

/** Dégâts subis en plus : fiche du Chimiste (Nick & Judy) et toiles du Trappeur (clés génériques). */
export function vulnerability(e: SimEnemy): number {
  let v = e.x.vuln ?? 0;
  if ((e.x.netFor ?? 0) > EPS) v += (e.x.netVuln ?? 0) * (e.x.netStacks ?? 0);
  return v;
}

export function killEnemy(ctx: Ctx, e: SimEnemy, player: number, unit?: SimUnit): void {
  if (e.x.gone) return;
  e.hp = 0;
  e.x.gone = 1;
  const p = ctx.st.players[player];
  if (!p) return;
  // Rush Royale (Coop) : mana d'élimination de la vague (10, +10 toutes les 10 vagues, 50 au plus) × type.
  // Mini-boss : ×5 (Rush Royale).
  const kindMana = e.x.mini ? BOSS_STATS.smallMana : ENEMIES[e.kind].mana;
  let mana = e.bossId ? BOSS_STATS.mana : kindMana * killMana(Math.max(1, ctx.st.wave));
  // Potion de Nemo (Chaudron magique) : mana des éliminations augmenté pendant quelques secondes.
  let potion = 0;
  for (const u of p.grid) if (u && (u.counters.killManaFor ?? 0) > EPS) potion = Math.max(potion, u.counters.killMana ?? 0);
  mana *= 1 + potion;
  if (unit) growOnKill(ctx, player, unit);
  // Mana par élimination (Tiana) : versé au joueur de l'unité qui a touché l'ennemi.
  const tag = e.x.manaTag ?? 0;
  if (tag > 0) {
    const by = e.x.manaTagBy ?? player;
    if (by === player || !ctx.st.players[by]) mana += tag;
    else ctx.st.players[by]!.mana += tag;
  }
  mana = Math.round(mana * manaYield(p));
  p.mana += mana;
  emit(ctx, { type: 'kill', enemy: e.uid, player: p.id, mana });
  bossReward(ctx, e);
}

/** Multiplicateur du rendement du mana (« Mana + ») d'un joueur. */
export function manaYield(p: { manaLevel?: number }): number {
  return 1 + MANA_UPGRADE_BONUS * (p.manaLevel ?? 0);
}

// ───────────── Unités ─────────────

export function effectiveId(u: SimUnit): UnitId {
  return u.status.transformedInto ?? u.unit;
}

export function effectiveDef(u: SimUnit): UnitDef {
  return UNITS[effectiveId(u)];
}

export function unitParams(ctx: Ctx, player: number, unit: UnitId): Record<string, number> {
  const info = ctx.info[player]!;
  let p = info.params[unit];
  if (!p) {
    p = resolveUnitParams(unit, UNITS[unit].ability.params, info.levels[unit] ?? 1, info.talents[unit], awakeningOf(ctx, player, unit));
    info.params[unit] = p;
  }
  return p;
}

/** Étoiles d'éveil (0..10) d'une unité pour un joueur. */
export function awakeningOf(ctx: Ctx, player: number, unit: UnitId): number {
  return Math.max(0, Math.min(AWAKENING_MAX, ctx.info[player]!.awakening[unit] ?? 0));
}

export function teamFor(ctx: Ctx, player: number, unit: UnitId): TeamAgg {
  return ctx.info[player]!.team[unit] ?? NO_TEAM;
}

export function isDisabled(u: SimUnit): boolean {
  const s = u.status;
  return (s.stunnedFor ?? 0) > EPS || (s.sleepingFor ?? 0) > EPS || (s.hypnotizedFor ?? 0) > EPS;
}

export function slotXY(slot: number): [number, number] {
  return [slot % GRID_COLS, Math.floor(slot / GRID_COLS)];
}

export function neighbors(slot: number, diagonal: boolean): number[] {
  const [c, r] = slotXY(slot);
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      if (!diagonal && dr !== 0 && dc !== 0) continue;
      const nc = c + dc, nr = r + dr;
      if (nc < 0 || nc >= GRID_COLS || nr < 0 || nr >= GRID_ROWS) continue;
      out.push(nr * GRID_COLS + nc);
    }
  }
  return out;
}

export interface Auras { damage: number; attackSpeed: number; critChance: number; critMul: number }

/**
 * Bonus reçus des unités voisines (haut, bas, gauche, droite ; diagonales avec `auraDiagonal`) :
 * Statue de chevalier (Captain America), Bannière (Pocahontas), Meule (Raiponce), talents.
 * Rush Royale : l'effet d'un soutien monte avec son rang (`…PerRank` × rang).
 */
export function aurasAt(ctx: Ctx, player: number, slot: number): Auras {
  const grid = ctx.st.players[player]!.grid;
  const out: Auras = { damage: 0, attackSpeed: 0, critChance: 0, critMul: 2 };
  for (const j of neighbors(slot, true)) {
    const n = grid[j];
    if (!n) continue;
    const id = effectiveId(n);
    const prm = unitParams(ctx, player, id);
    const [c1, r1] = slotXY(slot), [c2, r2] = slotXY(j);
    const diag = c1 !== c2 && r1 !== r2;
    if (diag && !prm.auraDiagonal) continue;
    if (!auraActive(prm, n)) continue; // Autobots : aura du mode robot ou du mode véhicule seulement
    out.attackSpeed += (prm.auraAttackSpeed ?? 0) + (prm.auraAttackSpeedPerRank ?? 0) * n.rank;
    out.damage += (prm.auraDamage ?? 0) + (prm.auraDamagePerRank ?? 0) * n.rank;
    if (prm.evenCritChancePerRank && countOnBoard(ctx, player, id) % 2 === 0) {
      out.critChance += prm.evenCritChancePerRank * n.rank;
      out.critMul = Math.max(out.critMul, prm.auraCritMul ?? 2);
    }
  }
  return out;
}

/** Nombre d'exemplaires d'une unité sur le plateau d'un joueur. */
export function countOnBoard(ctx: Ctx, player: number, unit: UnitId): number {
  let n = 0;
  for (const u of ctx.st.players[player]!.grid) if (u && effectiveId(u) === unit) n++;
  return n;
}

/** Une autre unité identique est-elle sur une case voisine (haut, bas, gauche, droite) ? */
export function hasSameNeighbor(ctx: Ctx, player: number, slot: number, unit: UnitId): boolean {
  const grid = ctx.st.players[player]!.grid;
  return neighbors(slot, false).some((j) => { const n = grid[j]; return !!n && effectiveId(n) === unit; });
}

/** Nombres d'exemplaires qui mettent l'Inquisiteur (Thor) en mode actif (fiche Rush Royale : 1, 3, 5 ou 7). */
export const ACTIVE_COUNTS: readonly number[] = [1, 3, 5, 7];

/** Thor (Inquisiteur) : mode actif selon le nombre d'exemplaires sur le plateau (`activeCounts`). */
export function inquisitorActive(ctx: Ctx, player: number, unit: UnitId): boolean {
  return ACTIVE_COUNTS.includes(countOnBoard(ctx, player, unit));
}

/**
 * Mode actif d'une unité (Inquisiteur) : nombre d'exemplaires, ou mode forcé par un talent
 * (Chevalier de lumière : 10 s après une fusion ; Chevalier des ténèbres : toujours).
 */
export function unitActive(ctx: Ctx, player: number, u: SimUnit): boolean {
  const prm = unitParams(ctx, player, effectiveId(u));
  if (!prm.activeCounts) return false;
  return (u.counters.dark ?? 0) > 0 || (u.counters.activeFor ?? 0) > EPS || inquisitorActive(ctx, player, effectiveId(u));
}

/** Mulan (Danse-lames) : nombre d'exemplaires qui dansent (sans voisin identique). */
export function dancers(ctx: Ctx, player: number, unit: UnitId): number {
  const grid = ctx.st.players[player]!.grid;
  let n = 0;
  for (let i = 0; i < GRID_SIZE; i++) {
    const u = grid[i];
    if (u && effectiveId(u) === unit && !hasSameNeighbor(ctx, player, i, unit)) n++;
  }
  return n;
}

/**
 * Rang de fusion, règle de Rush Royale : « intervalle ÷ rang » (le rang 3 tire 3 fois plus vite que le
 * rang 1), dégâts par coup indépendants du rang. Vitesse = 1 + RANK_ATTACK_SPEED × (rang − 1) = rang.
 */
export const RANK_ATTACK_SPEED = 1;
export const RANK_DAMAGE = 0;

/** Multiplicateur de vitesse d'attaque d'une unité. */
export function attackSpeedOf(ctx: Ctx, player: number, slot: number, u: SimUnit): number {
  const id = effectiveId(u);
  const prm = unitParams(ctx, player, id);
  const team = teamFor(ctx, player, id);
  let bonus = aurasAt(ctx, player, slot).attackSpeed + team.attackSpeed;
  if ((u.counters.hasteFor ?? 0) > EPS) bonus += u.counters.haste ?? 0;
  if ((u.counters.boostFor ?? 0) > EPS) bonus += u.counters.boost ?? 0;
  const puSpeed = prm.powerUpAttackSpeed ?? POWERUP_ATTACK_SPEED;
  let mul = (1 + bonus) * (prm.attackSpeedMul ?? 1) * (1 + AWAKENING_ATTACK_SPEED * awakeningOf(ctx, player, id))
    * (prm.rankDamage ? 1 : 1 + RANK_ATTACK_SPEED * (u.rank - 1)) // Catapulte (Spider-Man) : le rang monte les dégâts
    * (1 + puSpeed * Math.max(0, (jammed(u) ? 1 : ctx.st.players[player]!.powerUps[id] ?? 1) - 1));
  mul *= tfSpeedMul(prm, u);                                                                              // Transformation (Autobots)
  // Compétences de cadence des profils Rush Royale.
  if (prm.hawkSpeed !== undefined) mul *= 1 + (u.counters.form ? prm.sharkSpeed ?? 0 : prm.hawkSpeed);   // Borée (Maui)
  if ((u.counters.hurricaneFor ?? 0) > EPS) mul *= prm.hurricaneSpeedMul ?? 1;                           // Archer du vent (Vaïana)
  if (prm.activeCounts && unitActive(ctx, player, u)) mul *= prm.activeAttackSpeed ?? 1;                // Inquisiteur (Thor)
  if (prm.aloneAttackSpeed && !hasSameNeighbor(ctx, player, slot, id)) mul *= 1 + prm.aloneAttackSpeed;  // Danse-lames (Mulan)
  if (prm.oddSpeedMul && countOnBoard(ctx, player, id) % 2 === 1) mul *= prm.oddSpeedMul;               // Pyrotechnicien (clés génériques)
  if (prm.bossWaveAttackSpeedMul && ctx.st.phase === 'boss') mul *= prm.bossWaveAttackSpeedMul;          // Tireur d'élite (Falcon)
  // Extension DC.
  if (prm.vortexSpeed) mul *= 1 + prm.vortexSpeed * (u.counters.vortex ?? 0);                            // Génie (Cyborg)
  if (prm.rageSpeed && (u.counters.rageFor ?? 0) > EPS) mul *= 1 + prm.rageSpeed;                        // Cogneur (Flash)
  if (prm.powerSpeed && (u.counters.powerFor ?? 0) > EPS) mul *= 1 + prm.powerSpeed;                     // Moine (Wonder Woman)
  return mul;
}

/** Dégâts d'un coup de base (avant armure, marque, crit, bonus contre les boss). */
export function baseDamage(ctx: Ctx, player: number, slot: number, u: SimUnit): number {
  const def = effectiveDef(u);
  const id = def.id;
  const prm = unitParams(ctx, player, id);
  const p = ctx.st.players[player]!;
  const info = ctx.info[player]!;
  const level = info.levels[id] ?? 1;
  const pu = jammed(u) ? 1 : p.powerUps[id] ?? 1; // Brouillage de Soundwave : améliorations en partie perdues
  const flat = (prm.rankDamageFlat ?? 0) * (u.rank - 1); // Archer du vent (Vaïana) : +30 dégâts par rang
  let dmg = (def.damage + flat) * (prm.rankDamage ? u.rank : 1 + RANK_DAMAGE * (u.rank - 1)) * levelDamageMul(def, level) * (1 + POWERUP_DAMAGE * Math.max(0, pu - 1));
  dmg *= 1 + teamFor(ctx, player, id).damage;
  dmg *= 1 + aurasAt(ctx, player, slot).damage;
  if ((u.counters.boostFor ?? 0) > EPS) dmg *= 1 + (u.counters.boostDamage ?? 0);
  if ((u.counters.restoredFor ?? 0) > EPS) dmg *= 1 + (u.counters.restoredBonus ?? 0);
  // Rayon de kryptonite (Lex Luthor) : dégâts réduits pendant la durée.
  if ((u.counters.weakenFor ?? 0) > EPS) dmg *= 1 - Math.min(1, u.counters.weaken ?? 0);
  dmg *= prm.damageMul ?? 1;
  // Extension Transformers : mode robot / véhicule, enchantement de Ratchet, porte-voitures d'Ultra Magnus.
  dmg *= tfDamageMul(prm, u) * (1 + enchantBonus(u) + rowBonus(ctx, player, slot, GRID_COLS));
  dmg *= 1 + pxDamageBonus(u); // extension Pixar : souvenir doré (Joie), sort de croissance (Ian & Barley)
  dmg *= 1 + AWAKENING_DAMAGE * awakeningOf(ctx, player, id);
  // Archétypes : croissance sans plafond (Venom : mana en réserve, ou héritée d'une fusion) et malus de la copie (Loki).
  dmg *= 1 + growthBonus(prm, growthPointsOf(prm, u, p.mana));
  dmg *= u.status.copyMul ?? 1;
  dmg *= 1 + formationBonus(ctx, player, slot, u);
  // Profils Rush Royale.
  if (prm.bossWaveDamageMul && ctx.st.phase === 'boss') dmg *= prm.bossWaveDamageMul;                    // Tireur d'élite
  if (prm.dancerDamage) {                                                                                  // Danse-lames
    const others = Math.min(dancers(ctx, player, id), prm.dancerMax ?? 8) - (hasSameNeighbor(ctx, player, slot, id) ? 0 : 1);
    dmg *= 1 + prm.dancerDamage * Math.max(0, others);
  }
  if (prm.bossKillDamage) dmg *= 1 + prm.bossKillDamage * (p.bossKills?.[id] ?? 0);                      // Chevalier de lumière (Thor)
  if (prm.unityDamage && countOnBoard(ctx, player, id) >= (prm.unityAt ?? 4)) dmg *= 1 + prm.unityDamage;  // Unité (Thor)
  if (prm.evenDamageMul && countOnBoard(ctx, player, id) % 2 === 0) dmg *= prm.evenDamageMul;             // Pyrotechnicien
  if (prm.vortexDamage) dmg *= 1 + prm.vortexDamage * (u.counters.vortex ?? 0);                          // Génie (Cyborg)
  if (prm.rageDamage && (u.counters.rageFor ?? 0) > EPS) dmg *= 1 + prm.rageDamage;                       // Cogneur (Flash)
  if (prm.chargeDamage) {                                                                                  // Tesla
    const max = Math.max(1, (prm.chargeMax ?? 1) * u.rank);
    dmg *= 1 + prm.chargeDamage * Math.min(1, (u.counters.charges ?? 0) / max);
  }
  return dmg;
}

/** Durée d'un contrôle posé par une unité (équipe Océan, modificateur de map). */
export function controlMul(ctx: Ctx, player: number, unit: UnitId): number {
  return (1 + teamFor(ctx, player, unit).controlDuration) * (1 + (ctx.mods.controlDuration ?? 0));
}

/** Recharge des compétences : vitesse de décompte (équipe Arcanes, modificateur de map). */
export function cooldownRate(ctx: Ctx, player: number, unit: UnitId): number {
  const red = teamFor(ctx, player, unit).cooldownReduction + (ctx.mods.cooldownReduction ?? 0);
  return 1 / Math.max(0.1, 1 - red);
}

/**
 * Coup d'une unité sur un ennemi : bonus contre les boss, critiques d'équipe, puis effets
 * génériques des paramètres (brûlure, étourdissement, ralentissement des talents).
 */
export function unitHit(
  ctx: Ctx, player: number, u: SimUnit, e: SimEnemy, amount: number,
  opts: { crit?: boolean; shieldBreak?: boolean; noOnHit?: boolean } = {},
): number {
  const id = effectiveId(u);
  const prm = unitParams(ctx, player, id);
  let dmg = amount;
  let crit = !!opts.crit;
  if (e.bossId) dmg *= prm.bossDamageMul ?? 1;
  tagForMana(ctx, player, u, e);
  if (prm.biteManaPerSecond && !e.bossId) { // Vampire (Tiana) : la cible mordue donne du mana tant qu'elle vit
    e.x.bite = Math.max(e.x.bite ?? 0, prm.biteManaPerSecond);
    e.x.biteBy = player;
  }
  const team = teamFor(ctx, player, id);
  if ((e.bossId || e.x.mini) && team.bossDamage) dmg *= 1 + team.bossDamage;
  // Critique : 5 % de chance par défaut (Rush Royale), plus les bonus d'équipe.
  const critChance = (ctx.debugNoCrit ? 0 : BASE_CRIT_CHANCE) + team.critChance;
  if (!crit && critChance > 0 && rand(ctx) < critChance) {
    crit = true;
    dmg *= team.critMul;
  }
  if (!crit) { // Statue de chevalier (Captain America) : chance de critique des voisines
    const slot = ctx.st.players[player]!.grid.indexOf(u);
    const aura = slot >= 0 ? aurasAt(ctx, player, slot) : undefined;
    if (aura && aura.critChance > 0 && rand(ctx) < aura.critChance) {
      crit = true;
      dmg *= aura.critMul;
    }
  }
  const dealt = dealDamage(ctx, e, dmg, player, {
    crit, shieldBreak: opts.shieldBreak, armorPierce: prm.armorPierce ?? 0, unit: u,
  });
  if (opts.noOnHit || !isAlive(e)) return dealt;
  if (prm.burnPerSecond && dealt > 0) {
    applyBurn(e, dealt * prm.burnPerSecond * (1 + (ctx.mods.burnDamage ?? 0)), prm.burnDuration ?? 3, player);
  }
  if (prm.stunDuration) {
    const every = prm.stunEveryAttacks ?? 0;
    if (!every || ((u.counters.attacks ?? 0) % every === 0)) {
      if (rand(ctx) < (prm.stunChance ?? 1)) applyStun(e, prm.stunDuration * controlMul(ctx, player, id));
    }
  }
  if (prm.slow && !UNITS[id].ability.params.slow) {
    applySlow(ctx, e, prm.slow, (prm.slowDuration ?? 1) * controlMul(ctx, player, id));
  }
  return dealt;
}

export function tickDown(obj: Record<string, number | undefined>, key: string): void {
  const v = obj[key];
  if (v !== undefined && v > 0) obj[key] = Math.max(0, v - DT);
}
