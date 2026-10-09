// Directeur des effets de combat : reçoit les événements du moteur (attaque, compétence, pouvoir de
// boss, critique) et compose les primitives en réserve (motes, rayons, tracés, états, étiquettes).
// Budget global : au-delà d'une charge souple, les particules d'agrément sont réduites ; les
// projectiles porteurs d'impact passent toujours (jusqu'au plafond dur).
import type { Container, Renderer } from 'pixi.js';
import type { BossId, UnitId } from '../../data/types';
import type { EnemyInstance } from '../../engine';
import { Numbers } from '../fx';
import { bakeFxAtlas, type FxAtlas } from './atlas';
import { BeamMode, Beams, Budget, Curve, Ease, LineKind, Lines, Mode, Motes, type Mote, type MoteFn } from './pools';
import { playAbility, playAttack, playBossPower } from './signatures';
import { StatusFx } from './status';

export interface FxEnemy { x: number; y: number; width: number; enemy: EnemyInstance }

export interface FxHost {
  cell(slot: number): { x: number; y: number };
  enemy(uid: number): FxEnemy | undefined;
  enemies(): Iterable<FxEnemy>;
  shake(amp: number, dur: number): void;
  flash(alpha: number, dur: number, color?: number): void;
}

/** Couches : sol (sous les ennemis), tirs (au-dessus des unités), éclats (au-dessus des tirs). */
export interface FxLayers { ground: Container; shots: Container; top: Container }

export type Layer = 'ground' | 'shots' | 'top';

export interface P { x: number; y: number }

export class CombatFx {
  readonly tex: FxAtlas;
  readonly budget = new Budget(420, 640);
  readonly ground: Motes;
  readonly shots: Motes;
  readonly top: Motes;
  readonly beams: Beams;
  readonly lines: Lines;
  readonly labels: Numbers;
  readonly status: StatusFx;
  /** Temps passé dans `update` (ms) : moyenne glissante et pic. */
  readonly perf = { avg: 0, peak: 0 };
  private readonly tb = { x: 0, y: 0, w: 0 };

  constructor(renderer: Renderer, layers: FxLayers, readonly host: FxHost) {
    this.tex = bakeFxAtlas(renderer);
    const track = (uid: number, out: { x: number; y: number; w: number }) => {
      const v = host.enemy(uid);
      if (!v) return false;
      out.x = v.x; out.y = v.y - v.width * 0.35; out.w = v.width;
      return true;
    };
    this.ground = new Motes(layers.ground, this.budget, track, this);
    this.shots = new Motes(layers.shots, this.budget, track, this);
    this.top = new Motes(layers.top, this.budget, track, this);
    this.beams = new Beams(layers.shots, this.tex, track);
    this.lines = new Lines(layers.shots, track);
    this.status = new StatusFx(layers.shots, this.tex, (x, y, kind, w) => {
      if (kind === 0) {
        const m = this.top.spawn(this.tex.flame, x, y - w * 0.1, 0.5);
        m.vy = -110; m.vx = (Math.random() - 0.5) * 30; m.s0 = 0.32; m.s1 = 0.05; m.fout = 0.4;
      } else {
        const m = this.top.spawn(this.tex.spark, x + (Math.random() - 0.5) * w * 0.6, y + w * 0.2, 0.6);
        m.s.tint = 0xbff0ff; m.vy = -40; m.s0 = 0.45; m.s1 = 0; m.s.blendMode = 'add';
      }
    });
    this.labels = new Numbers(layers.top, 12);
  }

  get q(): number { return this.budget.q; }
  /** Nombre de particules d'agrément ajusté à la charge. */
  n(k: number): number { return Math.max(1, Math.round(k * this.budget.q)); }

  // ---------------------------------------------------------------- entrées

  attack(slot: number, unit: UnitId, fx: string, targets: readonly number[]): void {
    playAttack(this, slot, unit, fx, targets);
  }

  ability(slot: number, unit: UnitId, name: string, targets: readonly number[]): void {
    playAbility(this, slot, unit, name, targets);
  }

  bossPower(boss: BossId, slots: readonly number[], name: string): void {
    playBossPower(this, boss, slots, name);
  }

  /** Coup critique : étoile qui claque derrière le chiffre. */
  crit(x: number, y: number): void {
    this.pop(x, y, 0xffc83a, 1.25, 0.3);
    this.ring(x, y, 0xffe14a, 60, 0.3);
    for (let i = 0; i < this.n(4); i++) {
      const a = -Math.PI / 2 + (i - 1.5) * 0.6;
      const m = this.top.spawn(this.tex.stunStar, x, y, 0.45);
      m.vx = Math.cos(a) * 260; m.vy = Math.sin(a) * 260; m.grav = 700; m.drag = 1.5; m.s0 = 0.9; m.s1 = 0.4; m.spin = 8;
    }
  }

  update(dt: number): void {
    const t0 = performance.now();
    this.ground.update(dt);
    this.shots.update(dt);
    this.top.update(dt);
    this.beams.update(dt);
    this.lines.update(dt);
    this.status.update(dt, this.host.enemies(), this.budget.q);
    this.labels.update(dt);
    const ms = performance.now() - t0;
    this.perf.avg += (ms - this.perf.avg) * 0.05;
    this.perf.peak = Math.max(this.perf.peak * 0.995, ms);
  }

  clear(): void {
    this.ground.clear(); this.shots.clear(); this.top.clear();
    this.beams.clear(); this.lines.clear(); this.status.clear(); this.labels.clear();
  }

  get count(): number { return this.budget.live + this.beams.count + this.lines.count; }

  // ---------------------------------------------------------------- repères

  /** Centre du corps d'un ennemi (null s'il a disparu). */
  body(uid: number | undefined): P | null {
    if (uid === undefined) return null;
    const v = this.host.enemy(uid);
    return v ? { x: v.x, y: v.y - v.width * 0.35 } : null;
  }
  feet(uid: number | undefined): P | null {
    if (uid === undefined) return null;
    const v = this.host.enemy(uid);
    return v ? { x: v.x, y: v.y } : null;
  }
  width(uid: number): number { return this.host.enemy(uid)?.width ?? 118; }

  /** Départ d'un tir : bord du jeton, du côté de la cible (l'effet ne couvre pas le personnage). */
  origin(slot: number, uid?: number): P {
    const c = this.host.cell(slot);
    const t = this.body(uid);
    if (!t) return { x: c.x, y: c.y - 40 };
    const dx = t.x - c.x, dy = t.y - c.y, L = Math.hypot(dx, dy) || 1;
    return { x: c.x + (dx / L) * 58, y: c.y + (dy / L) * 58 };
  }

  /** Durée de vol pour une vitesse donnée (px logiques par seconde). */
  travel(a: P, b: P | null, speed: number, min = 0.08, max = 0.42): number {
    if (!b) return min;
    return Math.min(max, Math.max(min, Math.hypot(b.x - a.x, b.y - a.y) / speed));
  }

  // ---------------------------------------------------------------- primitives

  motes(layer: Layer): Motes { return layer === 'ground' ? this.ground : layer === 'shots' ? this.shots : this.top; }

  /** Projectile qui suit sa cible ; `end` est appelé à l'arrivée. */
  shot(tex: keyof FxAtlas, from: P, uid: number, dur: number, end: MoteFn | null = null, color = 0xffffff): Mote {
    const m = this.shots.spawn(this.tex[tex], from.x, from.y, dur, true);
    m.mode = Mode.Tween; m.uid = uid; m.x0 = from.x; m.y0 = from.y;
    const b = this.body(uid);
    if (b) { m.x1 = b.x; m.y1 = b.y; }
    m.end = end; m.color = color; m.fout = 1;
    return m;
  }

  /** Projectile vers un point fixe. */
  shotTo(tex: keyof FxAtlas, from: P, to: P, dur: number, end: MoteFn | null = null, color = 0xffffff): Mote {
    const m = this.shots.spawn(this.tex[tex], from.x, from.y, dur, true);
    m.mode = Mode.Tween; m.x0 = from.x; m.y0 = from.y; m.x1 = to.x; m.y1 = to.y;
    m.end = end; m.color = color; m.fout = 1;
    return m;
  }

  /** Rappel différé à la position d'un ennemi (porteur invisible). */
  later(uid: number, delay: number, end: MoteFn, color = 0xffffff, p0 = 0): Mote {
    const b = this.body(uid);
    const m = this.top.spawn(this.tex.spark, b?.x ?? 0, b?.y ?? 0, Math.max(0.001, delay), true);
    m.mode = Mode.Attach; m.uid = uid; m.stick = true; m.a0 = 0; m.end = end; m.color = color; m.p0 = p0;
    return m;
  }

  /** Incrustation qui suit un ennemi. */
  attach(tex: keyof FxAtlas, uid: number, dur: number, layer: Layer = 'top'): Mote {
    const b = this.body(uid);
    const m = this.motes(layer).spawn(this.tex[tex], b?.x ?? -9999, b?.y ?? -9999, dur);
    m.mode = Mode.Attach; m.uid = uid; m.stick = true;
    return m;
  }

  /** Sprite posé (statique, éventuellement animé en échelle / rotation). */
  put(tex: keyof FxAtlas, x: number, y: number, dur: number, layer: Layer = 'top'): Mote {
    return this.motes(layer).spawn(this.tex[tex], x, y, dur);
  }

  /** Étoile d'impact à contour sombre, cœur blanc. */
  pop(x: number, y: number, color: number, size = 1, life = 0.24): void {
    const r = Math.random() * 6;
    const a = this.top.spawn(this.tex.starInk, x, y, life);
    a.s.tint = color; a.curve = Curve.Pop; a.s0 = 0.25 * size; a.s1 = size; a.rot = r; a.spin = 2; a.fout = 0.45;
    const b = this.top.spawn(this.tex.starCore, x, y, life * 0.8);
    b.curve = Curve.Pop; b.s0 = 0.2 * size; b.s1 = size; b.rot = r + 0.2; b.spin = 2; b.fout = 0.4;
  }

  /** Éclats en traits (lignes de vitesse) orientés selon leur vitesse. */
  sparks(x: number, y: number, color: number, n: number, speed = 380, size = 0.7, life = 0.3): void {
    const c = this.n(n);
    for (let i = 0; i < c; i++) {
      const a = (i / c) * Math.PI * 2 + Math.random() * 0.8;
      const v = speed * (0.55 + Math.random() * 0.6);
      const m = this.top.spawn(this.tex.sparkInk, x, y, life * (0.75 + Math.random() * 0.5));
      m.s.tint = color; m.vx = Math.cos(a) * v; m.vy = Math.sin(a) * v; m.drag = 5; m.face = true;
      m.s0 = size; m.s1 = size * 0.2; m.sy = 0.8; m.fout = 0.5;
    }
  }

  /** Onde qui s'étend (anneau à contour). `flat` < 1 : couchée au sol. */
  ring(x: number, y: number, color: number, radius: number, life = 0.32, layer: Layer = 'top', flat = 1): void {
    const m = this.motes(layer).spawn(this.tex.ringInk, x, y, life);
    m.s.tint = color; m.curve = Curve.Out; m.s0 = 0.15; m.s1 = radius / 40; m.sy = flat; m.fout = 0.35;
  }

  /** Halo additif. */
  glow(x: number, y: number, color: number, size: number, life: number, layer: Layer = 'top'): Mote {
    const m = this.motes(layer).spawn(this.tex.glow, x, y, life);
    m.s.tint = color; m.s.blendMode = 'add'; m.s0 = size * 0.6; m.s1 = size; m.curve = Curve.Out; m.fout = 0.3;
    return m;
  }

  /** Petits nuages (fumée, poussière, écume). */
  puffs(x: number, y: number, color: number, n: number, size = 0.8, speed = 120, life = 0.5): void {
    const c = this.n(n);
    for (let i = 0; i < c; i++) {
      const a = (i / c) * Math.PI * 2 + Math.random();
      const m = this.top.spawn(this.tex.puff, x + Math.cos(a) * 12, y + Math.sin(a) * 8, life * (0.8 + Math.random() * 0.4));
      m.s.tint = color; m.vx = Math.cos(a) * speed; m.vy = Math.sin(a) * speed * 0.6 - 40; m.drag = 3;
      m.s0 = size * 0.5; m.s1 = size * (0.9 + Math.random() * 0.3); m.curve = Curve.Out; m.rot = Math.random() * 6; m.fout = 0.45;
    }
  }

  /** Débris qui retombent en tournant. */
  debris(x: number, y: number, tex: keyof FxAtlas, color: number, n: number, speed = 420, size = 0.8, life = 0.55): void {
    const c = this.n(n);
    for (let i = 0; i < c; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.6;
      const v = speed * (0.5 + Math.random() * 0.6);
      const m = this.top.spawn(this.tex[tex], x, y, life * (0.8 + Math.random() * 0.4));
      m.s.tint = color; m.vx = Math.cos(a) * v; m.vy = Math.sin(a) * v; m.grav = 1500; m.drag = 0.6;
      m.s0 = size * (0.7 + Math.random() * 0.5); m.s1 = m.s0 * 0.7; m.spin = (Math.random() - 0.5) * 16; m.rot = Math.random() * 6; m.fout = 0.7;
    }
  }

  beam(a: P, b: P, color: number, w: number, dur: number, mode = BeamMode.Flash, uid = -1, over = 0, core = true, delay = 0): void {
    this.beams.fire(a.x, a.y, b.x, b.y, color, w, dur, mode, uid, over, core, delay);
  }

  bolt(a: P, b: P, color: number, w: number, dur: number, branches = 1, delay = 0, uid = -1): void {
    this.lines.add(LineKind.Bolt, a.x, a.y, b.x, b.y, color, w, dur, uid, branches, delay);
  }

  tendril(a: P, uid: number, color: number, w: number, dur: number, delay = 0): void {
    const b = this.body(uid);
    if (!b) return;
    this.lines.add(LineKind.Tendril, a.x, a.y, b.x, b.y, color, w, dur, uid, 0, delay);
  }

  label(text: string, x: number, y: number, color: number, size = 34): void {
    this.labels.show(text, x, y, { color, size, life: 0.7, crit: true });
  }

  /** Lueur de départ du tir. */
  muzzle(p: P, color: number, size = 0.9): void {
    this.glow(p.x, p.y, color, size, 0.14);
  }

  /** Éclat sur la case de l'unité qui déclenche sa compétence. */
  cellFlare(slot: number, color: number): void {
    const c = this.host.cell(slot);
    this.ring(c.x, c.y, color, 92, 0.42);
    this.glow(c.x, c.y, color, 2.4, 0.35, 'ground');
    for (let i = 0; i < this.n(5); i++) {
      const m = this.top.spawn(this.tex.starCore, c.x + (Math.random() - 0.5) * 110, c.y + 30, 0.6);
      m.s.tint = color; m.vy = -220 - Math.random() * 120; m.drag = 1.5; m.s0 = 0.9; m.s1 = 0.2; m.spin = 6; m.delay = i * 0.04;
    }
  }

  static readonly Curve = Curve;
  static readonly Ease = Ease;
  static readonly Mode = Mode;
  static readonly BeamMode = BeamMode;
}
