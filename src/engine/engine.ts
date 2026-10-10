// Moteur de simulation pur à pas fixe (20 ticks/s), déterministe (graine mulberry32).
// Aucune dépendance au DOM, à l'heure ou à Math.random.

import { BOSSES, BOSS_STATS, LIEUTENANTS, ROTATING_BOSSES } from '../data/bosses';
import { ENEMIES, WAVE_RULES, monsterHp, monstersInWave, spawnWeights, waveHp } from '../data/enemies';
import { activeTeams } from '../data/teams';
import { UNITS } from '../data/units';
import type { BossId, EnemyKind, UnitId } from '../data/types';
import {
  GRID_SIZE, MAX_RANK, type Command, type CreateEngine, type Engine, type EngineState, type GameConfig,
  type LaneId, type PlayerId,
} from './types';
import {
  DEFAULT_COOP_LENGTHS, DEFAULT_PATH_LENGTH, DT, EPS, MANA_UPGRADE_COSTS, MANA_UPGRADE_MAX, NO_TEAM, POWERUP_COSTS, POWERUP_MAX, START_LIVES, START_MANA,
  SUMMON_COST_START, SUMMON_COST_STEP, emit, pick, spawnRand,
  type Ctx, type PlayerInfo, type SimEnemy, type SimPlayer, type SimState, type SimUnit, type TeamAgg,
} from './internal';
import { deriveSeed } from './rng';
import { dealDamage, isAlive, manaYield, retreat, unitParams } from './combat';
import { initUnitCounters, onRankUp, onWaveStart, startRockfall, updateUnits } from './abilities';
import { pumpkinExplosion, updateBosses } from './bossPowers';
import { mapLengths } from './maps';
import { boardGeometry } from './geometry';
import { inheritedGrowth, makeCopy, sacrifice, swapCells } from './archetypes';

const SAVE_VERSION = 1;

// ───────────── Contexte dérivé de la configuration ─────────────

function buildInfo(cfg: GameConfig): PlayerInfo[] {
  return cfg.players.map((ps, idx) => {
    const teams = activeTeams(ps.deck);
    const team: Partial<Record<UnitId, TeamAgg>> = {};
    let markSlow = 0, chainIllusionChance = 0, illusionDuration = 2, manaPerWave = 0;
    for (const t of teams) {
      const prm = t.params;
      for (const u of t.units) {
        const a = (team[u] ??= { ...NO_TEAM });
        a.damage += prm.damage ?? 0;
        a.attackSpeed += prm.attackSpeed ?? 0;
        a.critChance += prm.critChance ?? 0;
        if (prm.critMul) a.critMul = prm.critMul;
        a.cooldownReduction += prm.cooldownReduction ?? 0;
        a.controlDuration += prm.controlDuration ?? 0;
        a.doubleAttackChance += prm.doubleAttackChance ?? 0;
      }
      markSlow = Math.max(markSlow, prm.markSlow ?? 0);
      if (prm.chainIllusionChance) {
        chainIllusionChance = prm.chainIllusionChance;
        illusionDuration = prm.illusionDuration ?? 2;
      }
      if (prm.manaPerWave) {
        const have = t.units.filter((u) => ps.deck.includes(u)).length;
        manaPerWave += prm.manaPerWave + (prm.manaPerExtra ?? 0) * Math.max(0, have - (prm.minCount ?? t.units.length));
      }
    }
    return {
      idx,
      teams, team, markSlow, chainIllusionChance, illusionDuration, manaPerWave,
      params: {}, levels: ps.levels ?? {}, awakening: ps.awakening ?? {}, talents: ps.talents ?? {},
    };
  });
}

function laneLengths(cfg: GameConfig): Record<LaneId, number> {
  const m = mapLengths(cfg.mapId);
  if (cfg.mode === 'coop') {
    const c = m?.pathLengthCoop ?? DEFAULT_COOP_LENGTHS;
    return { a: c.a, b: c.b, tronc: c.tronc };
  }
  return { a: m?.pathLength ?? DEFAULT_PATH_LENGTH, b: 0, tronc: 0 };
}

function buildCtx(cfg: GameConfig, st: SimState): Ctx {
  return {
    cfg, st, ev: [],
    laneLen: laneLengths(cfg),
    geo: boardGeometry(cfg.mode, mapLengths(cfg.mapId)?.shape),
    coop: cfg.mode === 'coop',
    mods: cfg.mapModifiers ?? {},
    info: buildInfo(cfg),
  };
}

// ───────────── État initial ─────────────

function shuffledBosses(ctx: Ctx): BossId[] {
  const excluded = ctx.cfg.script?.excludeBosses ?? [];
  let arr = ROTATING_BOSSES.filter((b) => !excluded.includes(b));
  if (arr.length === 0) arr = ROTATING_BOSSES.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(spawnRand(ctx) * (i + 1)));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

function initState(cfg: GameConfig): SimState {
  const st: SimState = {
    tick: 0, time: 0, wave: 0, waveTimeLeft: 0, phase: 'vague',
    countdown: cfg.prepTime ?? 0,
    players: cfg.players.map((ps): SimPlayer => ({
      id: ps.id,
      mana: cfg.script?.startMana ?? START_MANA,
      summonCost: SUMMON_COST_START,
      grid: Array.from({ length: GRID_SIZE }, () => null),
      powerUps: Object.fromEntries(ps.deck.map((u) => [u, 1])),
      deck: ps.deck.slice(),
      giftUsedThisWave: false,
      summons: 0,
      extraRestores: cfg.mapModifiers?.extraRevive ?? 0,
    })),
    lanes: (cfg.mode === 'coop' ? (['a', 'b', 'tronc'] as LaneId[]) : (['a'] as LaneId[]))
      .map((id) => ({ id, length: DEFAULT_PATH_LENGTH })),
    lives: START_LIVES,
    enemies: [],
    rng: deriveSeed(cfg.seed, 1),
    spawnRng: deriveSeed(cfg.seed, 2),
    nextUid: 1,
    spawnTimer: 0, spawnCount: 0, waveMonsters: 0, waveElapsed: 0,
    pendingBoss: null, nextBigBoss: null, minionMaster: null, bossOrder: [], bossIdx: 0, scriptedBossIdx: 0,
    currentBoss: null, currentBossSmall: false, bossVictory: false,
    paused: false, prevPhase: 'vague', awaitingVictory: false,
    queue: [],
  };
  return st;
}

// ───────────── Vagues et rythme des boss (§4.3) ─────────────

function rhythm(cfg: GameConfig): { small: number; big: number; thanos: number } {
  return cfg.bossRhythm ?? { small: WAVE_RULES.smallBossEvery, big: WAVE_RULES.bigBossEvery, thanos: WAVE_RULES.thanosEvery };
}

const infinite = (cfg: GameConfig) => !cfg.targetWaves && cfg.mode !== 'tutoriel';

export type BossWaveKind = 'petit' | 'gros' | null;

/** Type de boss d'une vague : gros toutes les 10, petit toutes les 5 (hors gros), plus le script. */
export function bossWaveKind(cfg: GameConfig, wave: number): BossWaveKind {
  const r = rhythm(cfg);
  const s = cfg.script;
  if (s?.miniBoss) {
    if (scriptedMiniWave(cfg, wave)) return 'petit';
  } else if (s?.bossAtWave !== undefined && wave === s.bossAtWave) {
    return 'gros';
  }
  // Rush Royale (Coop) : après la vague 60, boss aux vagues paires et mini-boss aux vagues impaires.
  if (infinite(cfg) && !cfg.bossRhythm && wave > WAVE_RULES.alternateAfter) return wave % 2 === 0 ? 'gros' : 'petit';
  if (r.big > 0 && wave % r.big === 0) return 'gros';
  if (infinite(cfg) && r.thanos > 0 && wave % r.thanos === 0) return 'gros';
  if (r.small > 0 && wave % r.small === 0) return 'petit';
  return null;
}

/** script.miniBoss : la vague `wave` est-elle celle du sbire géant imposé ? */
function scriptedMiniWave(cfg: GameConfig, wave: number): boolean {
  const s = cfg.script;
  if (!s?.miniBoss) return false;
  return wave === (s.bossAtWave ?? cfg.targetWaves);
}

function nextBigWave(cfg: GameConfig, after: number): number {
  for (let w = after; w < after + 1000; w++) if (bossWaveKind(cfg, w) === 'gros') return w;
  return after + 1000;
}

function shuffleBag(ctx: Ctx): void {
  if (ctx.st.bossIdx >= ctx.st.bossOrder.length) {
    ctx.st.bossOrder = shuffledBosses(ctx);
    ctx.st.bossIdx = 0;
  }
}

/** Gros boss d'une vague ; `consume` avance la rotation (sans répétition avant que les 6 soient passés). */
function bigBossFor(ctx: Ctx, wave: number, consume: boolean): BossId {
  const s = ctx.cfg.script;
  const r = rhythm(ctx.cfg);
  if (s?.bossId && (s.bossAtWave === undefined || s.bossAtWave === wave || s.miniBoss)) return s.bossId;
  const order = s?.bossOrder;
  if (order && ctx.st.scriptedBossIdx < order.length) {
    const id = order[ctx.st.scriptedBossIdx]!;
    if (consume) ctx.st.scriptedBossIdx++;
    return id;
  }
  if (infinite(ctx.cfg) && r.thanos > 0 && wave % r.thanos === 0 && !s?.excludeBosses?.includes('thanos')) return 'thanos';
  shuffleBag(ctx);
  const id = ctx.st.bossOrder[ctx.st.bossIdx]!;
  if (consume) ctx.st.bossIdx++;
  return id;
}

function setPhase(ctx: Ctx, phase: EngineState['phase']): void {
  if (ctx.st.paused && ctx.st.phase === 'pause') ctx.st.prevPhase = phase;
  else ctx.st.phase = phase;
}

function startWave(ctx: Ctx, wave: number): void {
  const st = ctx.st;
  const cfg = ctx.cfg;
  st.wave = wave;
  st.waveElapsed = 0;
  st.spawnTimer = 0;
  st.spawnCount = 0;
  const kind = bossWaveKind(cfg, wave);
  // Rush Royale (Coop) : 10 monstres par vague ; une vague de mini-boss en a aussi, une vague de boss non.
  // Après la vague 60 (alternance boss / mini-boss), plus de monstres communs.
  const late = infinite(cfg) && !cfg.bossRhythm && wave > WAVE_RULES.alternateAfter;
  st.waveMonsters = kind === 'gros' || late ? 0 : monstersInWave(cfg.script?.enemyCountMultiplier);
  st.pendingBoss = kind === 'gros' ? bigBossFor(ctx, wave, true) : null;
  const nb = nextBigWave(cfg, kind === 'gros' ? wave + 1 : wave);
  st.nextBigBoss = bigBossFor(ctx, nb, false);
  st.upcomingBoss = st.nextBigBoss ? { boss: st.nextBigBoss, inWaves: nb - wave } : undefined;
  // Sbires du prochain gros boss dans les 2 vagues qui le précèdent.
  st.minionMaster = !kind && nb - wave <= WAVE_RULES.minionWavesBefore ? st.nextBigBoss : null;
  setPhase(ctx, 'vague');
  emit(ctx, { type: 'waveStart', wave });
  st.players.forEach((p, i) => {
    p.giftUsedThisWave = false;
    p.mana += Math.round((onWaveStart(ctx, i) + ctx.info[i]!.manaPerWave) * manaYield(p));
  });
  st.waveTimeLeft = st.waveMonsters * spawnInterval(wave);
  if (kind === 'gros') {
    spawnBigBoss(ctx, st.pendingBoss!);
  } else if (kind === 'petit') {
    // script.miniBoss ne remplace que la vague de petit boss désignée (bossAtWave, sinon la dernière
    // vague du niveau) ; les autres vagues de petit boss gardent le lieutenant du gros boss suivant.
    const scripted = scriptedMiniWave(cfg, wave) ? cfg.script!.miniBoss : undefined;
    spawnSmallBoss(ctx, scripted ?? st.nextBigBoss!, !!scripted);
  }
}

function waveFinished(ctx: Ctx): void {
  const st = ctx.st;
  if (st.wave > 0 && st.wave % WAVE_RULES.milestoneEvery === 0) emit(ctx, { type: 'milestone', wave: st.wave });
  if (ctx.cfg.targetWaves && st.wave >= ctx.cfg.targetWaves) {
    st.awaitingVictory = true;
    return;
  }
  startWave(ctx, st.wave + 1);
}

/** PV d'un ennemi normal au début de la vague (base des boss et des sbires). */
function normalHp(ctx: Ctx, wave: number): number {
  const s = ctx.cfg.script;
  return waveHp(wave, s?.waveHpGrowth) * (s?.enemyHpMultiplier ?? 1);
}

/** PV du prochain monstre de la vague (Rush Royale : ils montent à chaque nouveau monstre). */
function nextMonsterHp(ctx: Ctx): number {
  const s = ctx.cfg.script;
  const st = ctx.st;
  return monsterHp(st.wave, st.spawnCount, st.waveMonsters, s?.waveHpGrowth) * (s?.enemyHpMultiplier ?? 1);
}

/** PV d'un boss ou d'un lieutenant : PV d'un ennemi normal × `script.bossHpMultiplier`. */
function bossHp(ctx: Ctx, wave: number): number {
  return normalHp(ctx, wave) * (ctx.cfg.script?.bossHpMultiplier ?? 1);
}

/** Branches d'entrée : 'a' en Solo, 'a' et 'b' en Coop (un flot le long de chaque plateau). */
function entryLanes(ctx: Ctx): LaneId[] {
  return ctx.coop ? ['a', 'b'] : ['a'];
}

/** Les boss entrent par le tronc commun en Coop. */
function bossLane(ctx: Ctx): LaneId {
  return ctx.coop ? 'tronc' : 'a';
}

function addEnemy(ctx: Ctx, e: Omit<SimEnemy, 'uid' | 'distance' | 'effects'>): SimEnemy {
  const enemy: SimEnemy = { uid: ctx.st.nextUid++, distance: 0, effects: {}, ...e };
  if (ctx.coop && (e.lane === 'a' || e.lane === 'b')) {
    enemy.x.from = e.lane;
    enemy.x.owner = e.lane === 'a' ? 0 : 1;
  }
  ctx.st.enemies.push(enemy);
  return enemy;
}

function spawnKind(ctx: Ctx, kind: EnemyKind): void {
  const def = ENEMIES[kind];
  const hp = nextMonsterHp(ctx) * def.hpMul;
  let speed = WAVE_RULES.baseSpeed * def.speedMul;
  if (kind === 'rapide') speed *= 1 + (ctx.mods.fastSpeed ?? 0);
  const shield = def.shieldHits > 0 ? Math.max(0, def.shieldHits + (ctx.mods.shieldHits ?? 0)) : 0;
  for (const lane of entryLanes(ctx)) {
    const e = addEnemy(ctx, { kind, lane, hp, maxHp: hp, speed, armor: def.armor, shieldHits: shield, x: {} });
    emit(ctx, { type: 'enemySpawn', enemy: e.uid, kind, lane });
  }
}

function spawnMinions(ctx: Ctx, boss: BossId): void {
  const prm = BOSSES[boss].minion.params;
  const hp = nextMonsterHp(ctx) * (prm.hpMul ?? 1);
  const speed = WAVE_RULES.baseSpeed * (prm.speedMul ?? 1);
  const pack = Math.max(1, Math.round(prm.packSize ?? 1));
  for (const lane of entryLanes(ctx)) {
    for (let k = 0; k < pack; k++) {
      const e = addEnemy(ctx, {
        kind: 'sbire', lane, hp, maxHp: hp, speed, armor: prm.armor ?? 0, shieldHits: prm.shieldHits ?? 0,
        minionOf: boss,
        x: { flying: prm.flying ? 1 : undefined, arrivalStun: prm.arrivalStun, arrivalStunUnits: prm.arrivalStunUnits },
      });
      e.distance = -0.4 * k; // la meute arrive en file
      emit(ctx, { type: 'enemySpawn', enemy: e.uid, kind: 'sbire', lane });
    }
  }
}

function spawnOne(ctx: Ctx): void {
  const st = ctx.st;
  if (st.minionMaster && st.spawnCount % WAVE_RULES.minionEvery === WAVE_RULES.minionEvery - 1) {
    spawnMinions(ctx, st.minionMaster);
  } else {
    const weights = spawnWeights(st.wave);
    const total = weights.reduce((sum, [, w]) => sum + w, 0);
    let r = spawnRand(ctx) * total;
    let kind: EnemyKind = 'normal';
    for (const [k, w] of weights) {
      if (r < w) { kind = k; break; }
      r -= w;
    }
    spawnKind(ctx, kind);
  }
  st.spawnCount++;
}

/** Intervalle entre deux apparitions ; `script.enemyCountMultiplier` (> 1 : plus d'ennemis par vague) le divise. */
export function spawnInterval(wave: number, countMul = 1): number {
  const base = Math.max(WAVE_RULES.spawnIntervalMin, WAVE_RULES.spawnIntervalStart - WAVE_RULES.spawnIntervalStep * (wave - 1));
  return base / Math.max(0.1, countMul);
}

/** Petit boss : sbire géant (taille ×2) du prochain gros boss, ou sbire géant imposé par le script. */
function spawnSmallBoss(ctx: Ctx, master: BossId, scripted: boolean): void {
  const st = ctx.st;
  const prm = BOSSES[master].minion.params;
  const hp = bossHp(ctx, st.wave) * (scripted ? BOSS_STATS.scriptedMiniHpMul : BOSS_STATS.smallHpMul);
  const e = addEnemy(ctx, {
    kind: 'sbire', lane: bossLane(ctx), hp, maxHp: hp, speed: BOSS_STATS.speed, armor: prm.armor ?? 0,
    shieldHits: prm.shieldHits ?? 0, minionOf: master, giant: true,
    x: {
      mini: 1, rageIn: BOSS_STATS.rageAfter, flying: prm.flying ? 1 : undefined,
      ...(scripted ? {} : { master, lieutenant: 1, powerIn: LIEUTENANTS[master].power.interval }),
    },
  });
  emit(ctx, { type: 'miniBossSpawn', enemy: e.uid, boss: master });
  st.currentBoss = master;
  st.currentBossSmall = true;
  st.bossRageIn = BOSS_STATS.rageAfter;
  setPhase(ctx, 'boss');
}

function spawnBigBoss(ctx: Ctx, boss: BossId): void {
  const st = ctx.st;
  const def = BOSSES[boss];
  const hp = bossHp(ctx, st.wave) * BOSS_STATS.hpMul * (def.power.params.hpMul ?? 1);
  const lane = bossLane(ctx);
  const e = addEnemy(ctx, {
    kind: 'normal', lane, hp, maxHp: hp, speed: BOSS_STATS.speed, armor: 0, shieldHits: 0,
    bossId: boss, x: { powerIn: def.power.interval, rageIn: BOSS_STATS.rageAfter },
  });
  emit(ctx, { type: 'bossSpawn', enemy: e.uid, boss, lane });
  st.currentBoss = boss;
  st.currentBossSmall = false;
  st.pendingBoss = null;
  st.bossRageIn = BOSS_STATS.rageAfter;
  setPhase(ctx, 'boss');
}

/** script.endOnBossKill : le boss qui vient de tomber est-il le boss imposé du niveau ? */
function imposedBossDefeated(ctx: Ctx): boolean {
  const s = ctx.cfg.script!;
  const st = ctx.st;
  if (s.miniBoss && !s.bossId) return st.currentBossSmall && st.currentBoss === s.miniBoss && scriptedMiniWave(ctx.cfg, st.wave);
  if (s.bossId) return !st.currentBossSmall && st.currentBoss === s.bossId;
  if (s.bossOrder?.length) return !st.currentBossSmall && st.scriptedBossIdx >= s.bossOrder.length && st.currentBoss === s.bossOrder[s.bossOrder.length - 1];
  return !st.currentBossSmall;
}

function bossAlive(ctx: Ctx): boolean {
  return ctx.st.enemies.some((e) => isAlive(e) && (e.bossId || e.x.mini));
}

/**
 * Vague, règle de la Coop de Rush Royale : les monstres de la vague apparaissent un à un, et la vague
 * suivante ne commence qu'une fois le terrain nettoyé (monstres, mini-boss et boss).
 */
function updateWave(ctx: Ctx, spawn = true): void {
  const st = ctx.st;
  if (st.lives <= 0) return;
  if (st.phase !== 'vague' && st.phase !== 'boss') return;
  if (st.awaitingVictory) return;
  const interval = spawnInterval(st.wave, ctx.cfg.script?.enemyCountMultiplier);
  if (spawn) {
    st.waveElapsed += DT;
    if (st.spawnCount < st.waveMonsters) {
      st.spawnTimer -= DT;
      while (st.spawnTimer <= EPS && st.spawnCount < st.waveMonsters) {
        spawnOne(ctx);
        st.spawnTimer += interval;
      }
    }
    // Minuteur affiché : temps avant la dernière apparition de la vague.
    const left = st.waveMonsters - st.spawnCount;
    st.waveTimeLeft = left > 0 ? Math.max(0, st.spawnTimer) + (left - 1) * interval : 0;
  }
  // Niveaux de boss : la partie est gagnée dès que le boss imposé tombe, même avec des ennemis sur le chemin.
  if (st.phase === 'boss' && !bossAlive(ctx) && ctx.cfg.script?.endOnBossKill && imposedBossDefeated(ctx)) {
    st.bossRageIn = undefined;
    st.phase = 'vague';
    st.bossVictory = true;
    return;
  }
  if (st.spawnCount < st.waveMonsters) return;
  if (st.phase === 'boss' && bossAlive(ctx)) return;
  if (st.enemies.some((e) => isAlive(e))) return;
  if (st.phase === 'boss') {
    st.bossRageIn = undefined;
    st.phase = 'vague';
  }
  waveFinished(ctx);
}

// ───────────── Ennemis ─────────────

function dot(ctx: Ctx, e: SimEnemy, dps: number | undefined, left: number | undefined, by: number | undefined): number | undefined {
  if (!left || left <= 0 || !dps) return left;
  dealDamage(ctx, e, dps * DT, by ?? 0, { dot: true });
  return Math.max(0, left - DT);
}

function dec(v: number | undefined): number | undefined {
  return v !== undefined && v > 0 ? Math.max(0, v - DT) : v;
}

function updateEnemies(ctx: Ctx): void {
  const st = ctx.st;
  for (const e of st.enemies) {
    if (!isAlive(e)) continue;
    const f = e.effects, x = e.x;
    f.burnFor = dot(ctx, e, f.burn, f.burnFor, x.burnBy);
    x.bleedFor = dot(ctx, e, x.bleed, x.bleedFor, x.bleedBy);
    x.poisonFor = dot(ctx, e, x.poison, x.poisonFor, x.poisonBy);
    if (!isAlive(e)) continue;
    // Morsure du Vampire (Tiana) : la cible rapporte du mana tant qu'elle vit.
    if (x.bite && x.biteBy !== undefined) {
      x.biteAcc = (x.biteAcc ?? 0) + x.bite * DT;
      const whole = Math.floor(x.biteAcc + 1e-9);
      const owner = st.players[x.biteBy];
      if (whole > 0 && owner) { owner.mana += whole; x.biteAcc -= whole; }
    }
    if (x.netFor) { x.netFor = Math.max(0, x.netFor - DT); if (x.netFor === 0) { delete x.netFor; delete x.netStacks; } }
    f.slowFor = dec(f.slowFor);
    if (f.slowFor === 0) { delete f.slow; delete f.slowFor; }
    f.markedFor = dec(f.markedFor);
    if (f.markedFor === 0) { delete f.marked; delete f.markedFor; }
    if (f.burnFor === 0) { delete f.burn; delete f.burnFor; }
    const stunned = (f.stunFor ?? 0) > EPS;
    f.stunFor = dec(f.stunFor);
    if (f.stunFor === 0) delete f.stunFor;
    const knocked = (x.knockFor ?? 0) > EPS;
    x.knockFor = dec(x.knockFor);
    if (stunned) continue;
    const speed = e.speed * (1 - ((f.slowFor ?? 0) > EPS ? f.slow ?? 0 : 0));
    if (knocked) {
      retreat(ctx, e, speed * DT);
      continue;
    }
    e.distance += speed * DT;
    const len = ctx.laneLen[e.lane];
    if (e.distance < len) continue;
    if (ctx.coop && e.lane !== 'tronc') {
      // Fin de branche : l'ennemi rejoint le tronc commun.
      e.distance -= len;
      e.lane = 'tronc';
      if (e.distance >= ctx.laneLen.tronc) reachEnd(ctx, e);
    } else {
      reachEnd(ctx, e);
    }
  }
}

function reachEnd(ctx: Ctx, e: SimEnemy): void {
  e.x.gone = 1;
  const st = ctx.st;
  if (!ctx.cfg.script?.noLifeLoss && st.lives > 0) {
    // Rush Royale : un gros monstre retire 2 vies, un boss toutes.
    st.lives = e.bossId || e.x.mini ? 0 : Math.max(0, st.lives - ENEMIES[e.kind].lives);
    emit(ctx, { type: 'lifeLost', lives: st.lives });
  }
  pumpkinExplosion(ctx, e);
}

// ───────────── Commandes ─────────────

function reject(ctx: Ctx, command: Command['type'], reason: string): void {
  emit(ctx, { type: 'rejected', command, reason });
}

function playerIndex(ctx: Ctx, id: PlayerId): number {
  return ctx.st.players.findIndex((p) => p.id === id);
}

function newUnit(ctx: Ctx, player: number, unit: UnitId, rank: number): SimUnit {
  const u: SimUnit = { uid: ctx.st.nextUid++, unit, rank, cooldown: 0.3, status: {}, counters: {} };
  initUnitCounters(ctx, player, u);
  return u;
}

function emptySlots(p: SimPlayer): number[] {
  const out: number[] = [];
  for (let i = 0; i < GRID_SIZE; i++) if (!p.grid[i]) out.push(i);
  return out;
}

const validSlot = (s: number) => Number.isInteger(s) && s >= 0 && s < GRID_SIZE;

function applyCommand(ctx: Ctx, c: Command): void {
  const st = ctx.st;
  if (c.type === 'pause') {
    if (st.result) return reject(ctx, c.type, 'La partie est terminée.');
    if (c.paused && !st.paused) {
      st.paused = true;
      st.prevPhase = st.phase;
      st.phase = 'pause';
    } else if (!c.paused && st.paused) {
      st.paused = false;
      st.phase = st.prevPhase;
    }
    return;
  }
  if (st.result) return reject(ctx, c.type, 'La partie est terminée.');
  const pi = playerIndex(ctx, c.player);
  const p = st.players[pi];
  if (!p) return reject(ctx, c.type, 'Joueur inconnu.');

  switch (c.type) {
    case 'summon': {
      const empties = emptySlots(p);
      if (empties.length === 0) return reject(ctx, c.type, 'Plateau plein : fusionne des unités !');
      if (p.mana < p.summonCost) return reject(ctx, c.type, 'Pas assez de mana.');
      const forced = ctx.cfg.script?.forcedSummons?.[p.summons];
      const unit = forced ?? pick(ctx, p.deck)!;
      const slot = pick(ctx, empties)!;
      p.mana -= p.summonCost;
      p.summonCost += SUMMON_COST_STEP;
      p.summons++;
      p.grid[slot] = newUnit(ctx, pi, unit, 1);
      emit(ctx, { type: 'summon', player: p.id, slot, unit, rank: 1 });
      return;
    }
    case 'merge': {
      if (!validSlot(c.from) || !validSlot(c.to)) return reject(ctx, c.type, 'Case invalide.');
      if (c.from === c.to) return reject(ctx, c.type, 'Choisis une autre unité.');
      const a = p.grid[c.from], b = p.grid[c.to];
      if (!a || !b) return reject(ctx, c.type, 'Il faut deux unités pour fusionner.');
      if (a.unit !== b.unit) return reject(ctx, c.type, 'Seules deux unités identiques peuvent fusionner.');
      if (a.rank !== b.rank) return reject(ctx, c.type, 'Les deux unités doivent avoir le même rang.');
      if (a.rank >= MAX_RANK) return reject(ctx, c.type, 'Rang maximal atteint.');
      const unit = pick(ctx, p.deck)!;
      const rank = a.rank + 1;
      // Archétypes : sacrifice (une fois par fusion) et croissance gardée en partie.
      sacrifice(ctx, pi, c.to, a);
      const growth = inheritedGrowth(ctx, pi, a, b, unit);
      p.grid[c.from] = null;
      const merged = newUnit(ctx, pi, unit, rank);
      if (growth > 0) merged.counters.growth = growth;
      p.grid[c.to] = merged;
      // Profils Rush Royale : Éboulement du Minotaure (Hulk), charges de la Tesla (Iron Man) voisine.
      if (a.unit === 'hulk') startRockfall(ctx, pi, merged);
      onRankUp(ctx, pi, c.to);
      emit(ctx, { type: 'merge', player: p.id, from: c.from, to: c.to, unit, rank });
      return;
    }
    case 'copy':
    case 'promote':
    case 'swap': {
      if (!validSlot(c.from) || !validSlot(c.to)) return reject(ctx, c.type, 'Case invalide.');
      if (c.from === c.to) return reject(ctx, c.type, 'Choisis une autre unité.');
      const a = p.grid[c.from], b = p.grid[c.to];
      if (!a || !b) return reject(ctx, c.type, 'Il faut deux unités.');
      if (a.unit === b.unit) return reject(ctx, c.type, 'Deux unités identiques fusionnent.');
      if (a.rank !== b.rank) return reject(ctx, c.type, 'Les deux unités doivent avoir le même rang.');
      const prm = unitParams(ctx, pi, a.unit);
      if (c.type === 'copy') {
        if (!((prm.copyDamageMul ?? 0) > 0)) return reject(ctx, c.type, 'Cette unité ne sait pas copier.');
        makeCopy(ctx, pi, a, b, (u) => initUnitCounters(ctx, pi, u));
        emit(ctx, { type: 'copy', player: p.id, from: c.from, to: c.to, unit: a.unit, rank: a.rank });
        return;
      }
      if (c.type === 'swap') {
        if (!prm.swapAlly) return reject(ctx, c.type, 'Cette unité ne sait pas échanger sa place.');
        swapCells(ctx, pi, c.from, c.to);
        // Gardien du portail (Vanellope) : l'alliée est nettoyée, Vanellope s'endort un moment.
        if (prm.swapCleanse) {
          delete b.status.stunnedFor; delete b.status.sleepingFor; delete b.status.hypnotizedFor;
          if (b.status.copyMul !== undefined) b.status.copyMul = 1;
        }
        if (prm.swapSleep && prm.swapSleep > 0) a.status.sleepingFor = Math.max(a.status.sleepingFor ?? 0, prm.swapSleep);
        emit(ctx, { type: 'swap', player: p.id, from: c.from, to: c.to, unit: a.unit, rank: a.rank });
        // Effet visuel du Glitch : `slot` = nouvelle case, `targets` = ancienne case.
        emit(ctx, { type: 'ability', player: p.id, slot: c.to, unit: a.unit, name: UNITS[a.unit].ability.name, targets: [c.from] });
        return;
      }
      if (!prm.promoteAlly) return reject(ctx, c.type, 'Cette unité ne peut pas faire monter une alliée.');
      if (b.rank >= MAX_RANK) return reject(ctx, c.type, 'Rang maximal atteint.');
      sacrifice(ctx, pi, c.from, a);
      p.grid[c.from] = null;
      b.rank += 1;
      if (prm.promoteMana) p.mana += prm.promoteMana;
      if (prm.promoteBoost) { b.counters.boost = prm.promoteBoost; b.counters.boostFor = 10; }
      onRankUp(ctx, pi, c.to);
      emit(ctx, { type: 'promote', player: p.id, from: c.from, to: c.to, unit: b.unit, rank: b.rank });
      return;
    }
    case 'powerup': {
      if (!p.deck.includes(c.unit)) return reject(ctx, c.type, 'Cette unité n’est pas dans ton deck.');
      const level = p.powerUps[c.unit] ?? 1;
      if (level >= POWERUP_MAX) return reject(ctx, c.type, 'Amélioration maximale atteinte.');
      const cost = POWERUP_COSTS[level - 1]!;
      if (p.mana < cost) return reject(ctx, c.type, 'Pas assez de mana.');
      p.mana -= cost;
      p.powerUps[c.unit] = level + 1;
      emit(ctx, { type: 'powerup', player: p.id, unit: c.unit, level: level + 1 });
      return;
    }
    case 'manaUpgrade': {
      const level = p.manaLevel ?? 0;
      if (level >= MANA_UPGRADE_MAX) return reject(ctx, c.type, 'Rendement du mana au maximum.');
      const cost = MANA_UPGRADE_COSTS[level]!;
      if (p.mana < cost) return reject(ctx, c.type, 'Pas assez de mana.');
      p.mana -= cost;
      p.manaLevel = level + 1;
      emit(ctx, { type: 'manaUpgrade', player: p.id, level: level + 1 });
      return;
    }
    case 'gift': {
      if (ctx.cfg.mode !== 'coop') return reject(ctx, c.type, 'Le cadeau n’existe qu’en Coop.');
      if (p.giftUsedThisWave) return reject(ctx, c.type, 'Tu as déjà offert une unité pendant cette vague.');
      if (!validSlot(c.slot)) return reject(ctx, c.type, 'Case invalide.');
      const u = p.grid[c.slot];
      if (!u) return reject(ctx, c.type, 'Aucune unité sur cette case.');
      const qi = pi === 0 ? 1 : 0;
      const q = st.players[qi];
      if (!q) return reject(ctx, c.type, 'Pas de partenaire.');
      const empties = emptySlots(q);
      if (empties.length === 0) return reject(ctx, c.type, 'Le plateau de ton partenaire est plein.');
      const slot = pick(ctx, empties)!;
      p.grid[c.slot] = null;
      delete u.status.transformedInto;
      delete u.status.transformFor;
      q.grid[slot] = u;
      const growth = u.counters.growth;
      initUnitCounters(ctx, qi, u);
      if (growth) u.counters.growth = growth; // la croissance voyage avec l'unité
      p.giftUsedThisWave = true;
      emit(ctx, { type: 'gift', from: p.id, to: q.id, slot, unit: u.unit, rank: u.rank });
      return;
    }
  }
}

// ───────────── Fin de partie ─────────────

function checkEnd(ctx: Ctx): void {
  const st = ctx.st;
  if (st.result) return;
  let res: EngineState['result'];
  if (st.lives <= 0) res = { outcome: 'defaite', wave: st.wave };
  if (!res && st.bossVictory) res = { outcome: 'victoire', wave: st.wave };
  if (!res && st.awaitingVictory && !st.enemies.some(isAlive)) {
    res = { outcome: 'victoire', wave: st.wave };
  }
  if (!res) return;
  st.result = res;
  st.phase = 'fin';
  st.paused = false;
  emit(ctx, { type: 'gameOver', outcome: res.outcome, winner: res.winner, wave: res.wave });
}

// ───────────── Boucle ─────────────

function step(ctx: Ctx): void {
  const st = ctx.st;
  const queue = st.queue;
  st.queue = [];
  for (const c of queue) applyCommand(ctx, c);
  if (st.result || st.paused) return;
  // Compte à rebours de début de partie : les commandes passent, rien ne bouge encore.
  if ((st.countdown ?? 0) > EPS) {
    st.countdown = Math.max(0, st.countdown! - DT);
    if (st.countdown <= EPS) st.countdown = 0;
    return;
  }
  st.tick++;
  st.time = st.tick * DT;
  updateWave(ctx);
  updateEnemies(ctx);
  for (let i = 0; i < st.players.length; i++) updateUnits(ctx, i);
  updateBosses(ctx);
  st.enemies = st.enemies.filter((e) => !e.x.gone && e.hp > 0);
  updateWave(ctx, false);
  checkEnd(ctx);
}

export const createEngine: CreateEngine = (config: GameConfig, saved?: string): Engine => {
  let st: SimState;
  if (saved) {
    const data = JSON.parse(saved) as { v: number; st: SimState };
    if (data.v !== SAVE_VERSION) throw new Error('Sauvegarde incompatible.');
    st = data.st;
  } else {
    st = initState(config);
  }
  const ctx = buildCtx(config, st);
  for (const lane of st.lanes) lane.length = ctx.laneLen[lane.id];
  if (!saved) {
    st.bossOrder = shuffledBosses(ctx);
    if (config.script?.paused) {
      st.paused = true;
      st.prevPhase = 'vague';
    }
    startWave(ctx, 1);
    if (st.paused) st.phase = 'pause';
  }
  const engine: Engine & { readonly _ctx: Ctx } = {
    _ctx: ctx,
    config,
    get state() { return ctx.st; },
    tick() { step(ctx); },
    apply(command: Command) { ctx.st.queue.push({ ...command }); },
    drainEvents() { const ev = ctx.ev; ctx.ev = []; return ev; },
    serialize() { return JSON.stringify({ v: SAVE_VERSION, st: ctx.st }); },
  };
  return engine;
};

