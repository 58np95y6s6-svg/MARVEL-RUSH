// Primitives d'effets en réserve (pool) : « motes » (sprites animés : particules, projectiles,
// incrustations qui suivent un ennemi), rayons (NineSlice étirés) et tracés (éclairs, tentacules).
// Aucune allocation par image une fois les réserves remplies ; les rappels de fin sont des
// fonctions de module (pas de fermeture par tir).
import { Container, Graphics, NineSliceSprite, Sprite, type Texture } from 'pixi.js';
import { INK } from './atlas';

/** Position (centre du corps) et largeur d'un ennemi suivi. */
export type Track = (uid: number, out: { x: number; y: number; w: number }) => boolean;

export enum Mode { Free = 0, Tween = 1, Attach = 2 }
export enum Curve { Lin = 0, Pop = 1, Pulse = 2, Out = 3, Chomp = 4, Bounce = 5 }
export enum Ease { Lin = 0, Out = 1, In = 2, InOut = 3 }

export interface Mote {
  s: Sprite;
  delay: number; t: number; dur: number;
  mode: Mode;
  x: number; y: number;
  vx: number; vy: number; grav: number; drag: number;
  x0: number; y0: number; x1: number; y1: number;
  ease: Ease; arc: number; wob: number; wobF: number;
  uid: number; ox: number; oy: number; orbR: number; orbW: number; ang: number; stick: boolean;
  s0: number; s1: number; curve: Curve; sx: number; sy: number;
  a0: number; fin: number; fout: number;
  rot: number; spin: number; face: boolean; faceOff: number;
  trail: MoteFn | null; trailEvery: number; trailAcc: number;
  end: MoteFn | null;
  color: number; p0: number; p1: number;
  /** Liste de cibles restantes (ricochets) : référence au tableau de l'événement, jamais modifié. */
  list: readonly number[] | null;
  /** Propriétaire (le directeur des effets), pour les rappels de fin. */
  o: unknown;
  live: boolean;
}

export type MoteFn = (m: Mote) => void;

const tmp = { x: 0, y: 0, w: 0 };

export function ease(e: Ease, k: number): number {
  switch (e) {
    case Ease.Out: return 1 - (1 - k) * (1 - k);
    case Ease.In: return k * k;
    case Ease.InOut: return 0.5 - 0.5 * Math.cos(Math.PI * k);
    default: return k;
  }
}

/** Compteur partagé entre toutes les réserves pour le budget global. */
export class Budget {
  live = 0;
  constructor(readonly soft: number, readonly hard: number) {}
  /** Qualité 1 → 0,3 quand la charge monte : multiplier le nombre de particules d'agrément. */
  get q(): number {
    const over = (this.live - this.soft * 0.5) / (this.soft * 0.5);
    return over <= 0 ? 1 : Math.max(0.3, 1 - over * 0.7);
  }
}

export class Motes {
  private readonly pool: Mote[] = [];
  readonly live: Mote[] = [];
  /** Mote factice rendu quand le budget est épuisé (les appelants le modifient sans effet). */
  private readonly sink: Mote;

  constructor(private readonly layer: Container, private readonly budget: Budget, private readonly track: Track, private readonly owner: unknown) {
    this.sink = this.make(null);
  }

  private make(tex: Texture | null): Mote {
    const s = new Sprite(tex ?? undefined);
    s.anchor.set(0.5);
    return {
      s, delay: 0, t: 0, dur: 1, mode: Mode.Free, x: 0, y: 0, vx: 0, vy: 0, grav: 0, drag: 0,
      x0: 0, y0: 0, x1: 0, y1: 0, ease: Ease.Lin, arc: 0, wob: 0, wobF: 1,
      uid: -1, ox: 0, oy: 0, orbR: 0, orbW: 0, ang: 0, stick: true,
      s0: 1, s1: 1, curve: Curve.Lin, sx: 1, sy: 1, a0: 1, fin: 0, fout: 0.7,
      rot: 0, spin: 0, face: false, faceOff: 0, trail: null, trailEvery: 0.03, trailAcc: 0,
      end: null, color: 0xffffff, p0: 0, p1: 0, list: null, o: null, live: false,
    };
  }

  /** Nouveau mote ; `important` passe outre le budget souple (projectiles porteurs d'impact). */
  spawn(tex: Texture, x: number, y: number, dur: number, important = false): Mote {
    const B = this.budget;
    if (B.live >= (important ? B.hard : B.soft)) return this.reset(this.sink, tex, x, y, dur);
    let m = this.pool.pop();
    if (!m) { m = this.make(tex); this.layer.addChild(m.s); }
    this.reset(m, tex, x, y, dur);
    m.live = true;
    m.s.visible = false; // visible au premier update (après un éventuel délai)
    this.live.push(m);
    B.live++;
    return m;
  }

  private reset(m: Mote, tex: Texture, x: number, y: number, dur: number): Mote {
    m.s.texture = tex;
    m.s.tint = 0xffffff;
    m.s.blendMode = 'normal';
    m.s.rotation = 0;
    m.s.alpha = 1;
    m.delay = 0; m.t = 0; m.dur = dur; m.mode = Mode.Free;
    m.x = x; m.y = y; m.vx = 0; m.vy = 0; m.grav = 0; m.drag = 0;
    m.x0 = x; m.y0 = y; m.x1 = x; m.y1 = y; m.ease = Ease.Lin; m.arc = 0; m.wob = 0; m.wobF = 1;
    m.uid = -1; m.ox = 0; m.oy = 0; m.orbR = 0; m.orbW = 0; m.ang = 0; m.stick = true;
    m.s0 = 1; m.s1 = 1; m.curve = Curve.Lin; m.sx = 1; m.sy = 1; m.a0 = 1; m.fin = 0; m.fout = 0.7;
    m.rot = 0; m.spin = 0; m.face = false; m.faceOff = 0; m.trail = null; m.trailEvery = 0.03; m.trailAcc = 0;
    m.end = null; m.color = 0xffffff; m.p0 = 0; m.p1 = 0; m.list = null; m.o = this.owner;
    return m;
  }

  update(dt: number): void {
    const L = this.live;
    for (let i = L.length - 1; i >= 0; i--) {
      const m = L[i]!;
      if (m.delay > 0) { m.delay -= dt; if (m.delay > 0) continue; }
      m.t += dt;
      const k = m.t >= m.dur ? 1 : m.t / m.dur;
      const s = m.s;
      const px = m.x, py = m.y;
      if (m.mode === Mode.Free) {
        if (m.drag) { const d = Math.max(0, 1 - m.drag * dt); m.vx *= d; m.vy *= d; }
        m.vy += m.grav * dt;
        m.x += m.vx * dt; m.y += m.vy * dt;
      } else if (m.mode === Mode.Tween) {
        if (m.uid >= 0 && this.track(m.uid, tmp)) { m.x1 = tmp.x; m.y1 = tmp.y; }
        const e = ease(m.ease, k);
        let x = m.x0 + (m.x1 - m.x0) * e, y = m.y0 + (m.y1 - m.y0) * e;
        if (m.arc) y -= Math.sin(k * Math.PI) * m.arc;
        if (m.wob) {
          const dx = m.x1 - m.x0, dy = m.y1 - m.y0, l = Math.hypot(dx, dy) || 1;
          const w = Math.sin(k * Math.PI * 2 * m.wobF + m.p1) * m.wob * (1 - k * 0.6);
          x += (-dy / l) * w; y += (dx / l) * w;
        }
        m.x = x; m.y = y;
      } else if (m.uid < 0) {
        // Orbite autour d'un point fixe (x0, y0).
        m.ang += m.orbW * dt;
        m.x = m.x0 + m.ox + Math.cos(m.ang) * m.orbR;
        m.y = m.y0 + m.oy + Math.sin(m.ang) * m.orbR * m.p1;
      } else {
        if (m.uid >= 0 && this.track(m.uid, tmp)) {
          const sc = tmp.w / 118;
          m.ang += m.orbW * dt;
          m.x = tmp.x + m.ox * sc + Math.cos(m.ang) * m.orbR * sc;
          m.y = tmp.y + m.oy * sc + Math.sin(m.ang) * m.orbR * 0.42 * sc;
          m.x1 = m.x; m.y1 = m.y;
        } else if (!m.stick) {
          m.t = m.dur; // cible disparue : fin anticipée
        } else {
          m.ang += m.orbW * dt;
        }
      }
      s.visible = true;
      s.position.set(m.x, m.y);
      if (m.face) {
        const dx = m.x - px, dy = m.y - py;
        if (dx * dx + dy * dy > 0.01) s.rotation = Math.atan2(dy, dx) + m.faceOff;
      } else {
        m.rot += m.spin * dt;
        s.rotation = m.rot;
      }
      // Échelle.
      let sc: number, sy = 1;
      switch (m.curve) {
        case Curve.Pop: sc = k < 0.22 ? m.s0 + (m.s1 * 1.25 - m.s0) * (k / 0.22) : k < 0.4 ? m.s1 * (1.25 - 0.25 * ((k - 0.22) / 0.18)) : m.s1; break;
        case Curve.Pulse: sc = m.s0 + (m.s1 - m.s0) * (0.5 + 0.5 * Math.sin(m.t * 10 + m.p1)); break;
        case Curve.Out: sc = m.s0 + (m.s1 - m.s0) * (1 - (1 - k) * (1 - k) * (1 - k)); break;
        case Curve.Chomp: sc = m.s1; sy = k < 0.35 ? 1.9 - 1.15 * (k / 0.35) : k < 0.55 ? 0.75 + 0.25 * ((k - 0.35) / 0.2) : 1; break;
        case Curve.Bounce: { // écrasement-étirement à l'apparition
          sc = k < 0.15 ? m.s0 + (m.s1 - m.s0) * (k / 0.15) : m.s1;
          const q = k < 0.45 ? Math.sin(((k - 0.15) / 0.3) * Math.PI) : 0;
          sy = k < 0.15 ? 1 : 1 - 0.25 * q;
          sc *= k < 0.15 ? 1 : 1 + 0.18 * q;
          break;
        }
        default: sc = m.s0 + (m.s1 - m.s0) * k;
      }
      s.scale.set(sc * m.sx, sc * m.sy * sy);
      // Opacité.
      let a = m.a0;
      if (m.fin > 0 && k < m.fin) a *= k / m.fin;
      if (k > m.fout) a *= 1 - (k - m.fout) / (1 - m.fout);
      s.alpha = a;
      // Traînée.
      if (m.trail) {
        m.trailAcc += dt;
        if (m.trailAcc >= m.trailEvery) { m.trailAcc = 0; m.trail(m); }
      }
      if (k >= 1) {
        const end = m.end;
        m.end = null;
        this.free(i);
        if (end) end(m);
      }
    }
  }

  private free(i: number): void {
    const L = this.live, m = L[i]!;
    m.s.visible = false;
    m.live = false;
    m.trail = null;
    L[i] = L[L.length - 1]!;
    L.pop();
    this.pool.push(m);
    this.budget.live--;
  }

  clear(): void {
    for (let i = this.live.length - 1; i >= 0; i--) this.free(i);
  }
}

// ---------------------------------------------------------------- rayons

export enum BeamMode { Flash = 0, Extend = 1, Grow = 2 }

interface Beam {
  body: NineSliceSprite; core: NineSliceSprite;
  x0: number; y0: number; x1: number; y1: number; uid: number; over: number;
  t: number; dur: number; delay: number; w: number; mode: BeamMode; coreOn: boolean;
}

export class Beams {
  private readonly pool: Beam[] = [];
  private readonly live: Beam[] = [];
  private readonly t = { x: 0, y: 0, w: 0 };
  constructor(private readonly layer: Container, private readonly tex: { beam: Texture; beamCore: Texture }, private readonly track: Track) {}

  get count(): number { return this.live.length; }

  /**
   * Rayon de (x0, y0) vers (x1, y1) ou vers l'ennemi `uid` (suivi), prolongé de `over`.
   * Flash : apparaît plein puis s'amincit. Extend : s'allonge, tient, se rétracte (langue, lasso, toile).
   * Grow : s'allonge puis s'éteint (laser).
   */
  fire(x0: number, y0: number, x1: number, y1: number, color: number, w: number, dur: number, mode = BeamMode.Flash, uid = -1, over = 0, core = true, delay = 0): void {
    if (this.live.length >= 48) return;
    let b = this.pool.pop();
    if (!b) {
      const mk = (t: Texture, h: number) => {
        const n = new NineSliceSprite({ texture: t, leftWidth: h / 2, rightWidth: h / 2, topHeight: 0, bottomHeight: 0 });
        n.pivot.set(0, 0);
        return n;
      };
      b = { body: mk(this.tex.beam, 24), core: mk(this.tex.beamCore, 12), x0: 0, y0: 0, x1: 0, y1: 0, uid: -1, over: 0, t: 0, dur: 1, delay: 0, w: 1, mode: BeamMode.Flash, coreOn: true };
      this.layer.addChild(b.body, b.core);
    }
    b.x0 = x0; b.y0 = y0; b.x1 = x1; b.y1 = y1; b.uid = uid; b.over = over;
    b.t = 0; b.dur = dur; b.delay = delay; b.w = w; b.mode = mode; b.coreOn = core;
    b.body.tint = color;
    b.body.visible = b.core.visible = false;
    this.live.push(b);
  }

  update(dt: number): void {
    const L = this.live;
    for (let i = L.length - 1; i >= 0; i--) {
      const b = L[i]!;
      if (b.delay > 0) { b.delay -= dt; if (b.delay > 0) continue; }
      b.t += dt;
      const k = Math.min(1, b.t / b.dur);
      if (k >= 1) {
        b.body.visible = b.core.visible = false;
        L[i] = L[L.length - 1]!; L.pop(); this.pool.push(b);
        continue;
      }
      if (b.uid >= 0 && this.track(b.uid, this.t)) { b.x1 = this.t.x; b.y1 = this.t.y; }
      const dx = b.x1 - b.x0, dy = b.y1 - b.y0, L0 = Math.hypot(dx, dy) || 1;
      let len = L0 + b.over, wk = 1;
      if (b.mode === BeamMode.Flash) { wk = k < 0.12 ? 0.5 + 4.2 * k : 1 - 0.75 * ((k - 0.12) / 0.88); }
      else if (b.mode === BeamMode.Extend) { len *= k < 0.3 ? ease(Ease.Out, k / 0.3) : k > 0.75 ? 1 - ease(Ease.In, (k - 0.75) / 0.25) : 1; }
      else { len *= k < 0.25 ? ease(Ease.Out, k / 0.25) : 1; wk = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4; }
      const h = Math.max(2, b.w * wk);
      const rot = Math.atan2(dy, dx);
      const set = (n: NineSliceSprite, hh: number) => {
        const l = Math.max(hh + 2, len);
        n.leftWidth = n.rightWidth = hh * 0.5;
        n.width = l; n.height = hh;
        n.rotation = rot;
        // Le rayon est centré sur sa ligne.
        n.position.set(b.x0 + Math.sin(rot) * hh * 0.5, b.y0 - Math.cos(rot) * hh * 0.5);
        n.visible = len > 4;
      };
      set(b.body, h);
      if (b.coreOn) set(b.core, h * 0.42); else b.core.visible = false;
      const a = b.mode === BeamMode.Extend ? 1 : k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
      b.body.alpha = b.core.alpha = a;
    }
  }

  clear(): void {
    for (const b of this.live) { b.body.visible = b.core.visible = false; this.pool.push(b); }
    this.live.length = 0;
  }
}

// ---------------------------------------------------------------- tracés (éclairs, tentacules)

export enum LineKind { Bolt = 0, Tendril = 1 }

interface Line {
  g: Graphics; kind: LineKind;
  x0: number; y0: number; x1: number; y1: number; uid: number;
  t: number; dur: number; delay: number; color: number; w: number; acc: number; seed: number; branches: number;
}

export class Lines {
  private readonly pool: Line[] = [];
  private readonly live: Line[] = [];
  private readonly t = { x: 0, y: 0, w: 0 };
  private readonly pts = new Float32Array(64);
  constructor(private readonly layer: Container, private readonly track: Track) {}

  get count(): number { return this.live.length; }

  add(kind: LineKind, x0: number, y0: number, x1: number, y1: number, color: number, w: number, dur: number, uid = -1, branches = 0, delay = 0): void {
    if (this.live.length >= 24) return;
    let l = this.pool.pop();
    if (!l) {
      l = { g: new Graphics(), kind, x0, y0, x1, y1, uid, t: 0, dur, delay: 0, color, w, acc: 0, seed: 0, branches: 0 };
      this.layer.addChild(l.g);
    }
    l.kind = kind; l.x0 = x0; l.y0 = y0; l.x1 = x1; l.y1 = y1; l.uid = uid;
    l.t = 0; l.dur = dur; l.delay = delay; l.color = color; l.w = w; l.acc = 1; l.seed = Math.random() * 1000; l.branches = branches;
    l.g.visible = false;
    l.g.clear();
    this.live.push(l);
  }

  update(dt: number): void {
    const L = this.live;
    for (let i = L.length - 1; i >= 0; i--) {
      const l = L[i]!;
      if (l.delay > 0) { l.delay -= dt; if (l.delay > 0) continue; }
      l.t += dt;
      const k = l.t / l.dur;
      if (k >= 1) {
        l.g.visible = false; l.g.clear();
        L[i] = L[L.length - 1]!; L.pop(); this.pool.push(l);
        continue;
      }
      if (l.uid >= 0 && this.track(l.uid, this.t)) { l.x1 = this.t.x; l.y1 = this.t.y; }
      l.g.visible = true;
      l.acc += dt;
      if (l.kind === LineKind.Bolt) {
        // Nouvel éclair toutes les 0,05 s (scintillement), épaisseur qui décroît.
        if (l.acc >= 0.05) { l.acc = 0; this.drawBolt(l, 1 - k * 0.6); }
        l.g.alpha = k > 0.6 ? 1 - (k - 0.6) / 0.4 : 1;
      } else {
        l.g.alpha = 1;
        this.drawTendril(l, k);
      }
    }
  }

  private drawBolt(l: Line, wk: number): void {
    const g = l.g, P = this.pts;
    const dx = l.x1 - l.x0, dy = l.y1 - l.y0, len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const n = Math.max(3, Math.min(14, Math.round(len / 38)));
    const amp = Math.min(34, len * 0.14);
    for (let i = 0; i <= n; i++) {
      const t = i / n, j = i === 0 || i === n ? 0 : (Math.random() - 0.5) * 2 * amp * Math.sin(t * Math.PI);
      P[i * 2] = l.x0 + dx * t + nx * j;
      P[i * 2 + 1] = l.y0 + dy * t + ny * j;
    }
    g.clear();
    const w = l.w * wk;
    const path = () => {
      g.moveTo(P[0]!, P[1]!);
      for (let i = 1; i <= n; i++) g.lineTo(P[i * 2]!, P[i * 2 + 1]!);
      // Ramifications : départ sur un point intermédiaire, courte branche qui s'écarte.
      for (let b = 0; b < l.branches; b++) {
        const s = 1 + Math.floor(Math.random() * (n - 1));
        let bx = P[s * 2]!, by = P[s * 2 + 1]!;
        g.moveTo(bx, by);
        const side = Math.random() < 0.5 ? -1 : 1;
        for (let q = 0; q < 2; q++) {
          bx += (dx / len) * 22 + nx * side * (14 + Math.random() * 14);
          by += (dy / len) * 22 + ny * side * (14 + Math.random() * 14);
          g.lineTo(bx, by);
        }
      }
    };
    path(); g.stroke({ color: INK, width: w + 7, cap: 'round', join: 'round' });
    path(); g.stroke({ color: l.color, width: w, cap: 'round', join: 'round' });
    path(); g.stroke({ color: 0xffffff, width: Math.max(1.5, w * 0.36), cap: 'round', join: 'round' });
  }

  private drawTendril(l: Line, k: number): void {
    const g = l.g;
    // Le fouet sort (0 → 0,35), claque, puis se rétracte (0,6 → 1).
    const ext = k < 0.35 ? ease(Ease.Out, k / 0.35) : k > 0.6 ? 1 - ease(Ease.In, (k - 0.6) / 0.4) : 1;
    const dx = l.x1 - l.x0, dy = l.y1 - l.y0, len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const bend = Math.sin(l.seed) * 0.35 * len * (1 - ext * 0.5) + Math.sin(l.t * 30 + l.seed) * 8;
    const cx = l.x0 + dx * 0.5 + nx * bend, cy = l.y0 + dy * 0.5 + ny * bend;
    const n = 12, P = this.pts;
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * ext, u = 1 - t;
      P[i * 2] = u * u * l.x0 + 2 * u * t * cx + t * t * l.x1;
      P[i * 2 + 1] = u * u * l.y0 + 2 * u * t * cy + t * t * l.y1;
    }
    g.clear();
    // Épaisseur décroissante : on dessine par tronçons.
    for (const [c, f] of [[INK, 1], [l.color, 0.62], [0x8f84c4, 0.2]] as const) {
      for (let i = 0; i < n; i++) {
        const w = (l.w * (1 - (i / n) * 0.65)) * f + (c === INK ? 6 : 0);
        g.moveTo(P[i * 2]!, P[i * 2 + 1]!).lineTo(P[i * 2 + 2]!, P[i * 2 + 3]!).stroke({ color: c, width: w, cap: 'round' });
      }
    }
  }

  clear(): void {
    for (const l of this.live) { l.g.visible = false; l.g.clear(); this.pool.push(l); }
    this.live.length = 0;
  }
}
