// Effets du combat : particules, projectiles, rayons, anneaux et chiffres de dégâts.
// Tout est mis en réserve (pool) : aucune allocation par image une fois la réserve remplie.
import { BitmapFont, BitmapText, Container, Graphics, Sprite, Texture, type Renderer } from 'pixi.js';

export interface FxTextures { dot: Texture; spark: Texture; ring: Texture; streak: Texture; star: Texture }

/** Textures procédurales (blanches, teintées à l'usage). */
export function makeFxTextures(renderer: Renderer): FxTextures {
  const gen = (g: Graphics) => renderer.generateTexture({ target: g, resolution: 2, antialias: true });
  const dot = new Graphics();
  for (let i = 6; i >= 1; i--) dot.circle(0, 0, i * 4).fill({ color: 0xffffff, alpha: 0.12 + (6 - i) * 0.1 });
  const spark = new Graphics().circle(0, 0, 10).fill(0xffffff);
  const ring = new Graphics().circle(0, 0, 40).stroke({ color: 0xffffff, width: 7 });
  const streak = new Graphics().roundRect(-24, -5, 48, 10, 5).fill(0xffffff);
  const star = new Graphics()
    .poly([0, -22, 6, -6, 22, 0, 6, 6, 0, 22, -6, 6, -22, 0, -6, -6])
    .fill(0xffffff);
  return { dot: gen(dot), spark: gen(spark), ring: gen(ring), streak: gen(streak), star: gen(star) };
}

// ---------------------------------------------------------------- particules

interface Particle {
  s: Sprite;
  vx: number; vy: number; grav: number; drag: number;
  life: number; max: number;
  s0: number; s1: number; a0: number; spin: number;
}

export class Particles {
  private readonly pool: Particle[] = [];
  private readonly live: Particle[] = [];
  constructor(private readonly layer: Container, private readonly max = 360) {}

  emit(tex: Texture, x: number, y: number, o: {
    color?: number; vx?: number; vy?: number; grav?: number; drag?: number; life?: number;
    s0?: number; s1?: number; a0?: number; spin?: number; rot?: number; blend?: 'add' | 'normal';
  } = {}): void {
    if (this.live.length >= this.max) return;
    let p = this.pool.pop();
    if (!p) {
      const s = new Sprite(tex);
      s.anchor.set(0.5);
      this.layer.addChild(s);
      p = { s, vx: 0, vy: 0, grav: 0, drag: 0, life: 0, max: 1, s0: 1, s1: 0, a0: 1, spin: 0 };
    }
    const s = p.s;
    s.texture = tex;
    s.visible = true;
    s.position.set(x, y);
    s.tint = o.color ?? 0xffffff;
    s.rotation = o.rot ?? 0;
    s.blendMode = o.blend === 'normal' ? 'normal' : 'add';
    p.vx = o.vx ?? 0; p.vy = o.vy ?? 0; p.grav = o.grav ?? 0; p.drag = o.drag ?? 0;
    p.life = 0; p.max = o.life ?? 0.5;
    p.s0 = o.s0 ?? 1; p.s1 = o.s1 ?? 0; p.a0 = o.a0 ?? 1; p.spin = o.spin ?? 0;
    s.scale.set(p.s0);
    s.alpha = p.a0;
    this.live.push(p);
  }

  /** Gerbe radiale. */
  burst(tex: Texture, x: number, y: number, n: number, color: number, speed = 420, life = 0.45, size = 1): void {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.6;
      const v = speed * (0.5 + Math.random() * 0.6);
      this.emit(tex, x, y, { color, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: 3, life: life * (0.7 + Math.random() * 0.5), s0: size * (0.7 + Math.random() * 0.6), s1: 0, spin: (Math.random() - 0.5) * 8 });
    }
  }

  update(dt: number): void {
    const L = this.live;
    for (let i = L.length - 1; i >= 0; i--) {
      const p = L[i]!;
      p.life += dt;
      const k = p.life / p.max;
      if (k >= 1) {
        p.s.visible = false;
        L[i] = L[L.length - 1]!;
        L.pop();
        this.pool.push(p);
        continue;
      }
      const damp = Math.max(0, 1 - p.drag * dt);
      p.vx *= damp; p.vy = p.vy * damp + p.grav * dt;
      p.s.x += p.vx * dt; p.s.y += p.vy * dt;
      p.s.rotation += p.spin * dt;
      p.s.scale.set(p.s0 + (p.s1 - p.s0) * k);
      p.s.alpha = p.a0 * (k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3);
    }
  }

  clear(): void {
    for (const p of this.live) { p.s.visible = false; this.pool.push(p); }
    this.live.length = 0;
  }
}

// ---------------------------------------------------------------- projectiles et rayons

export type ShotStyle = 'orb' | 'arrow' | 'web' | 'beam' | 'chain' | 'splash' | 'slash' | 'note';

interface Shot {
  s: Sprite;
  style: ShotStyle;
  x0: number; y0: number; x1: number; y1: number;
  t: number; dur: number; color: number; size: number;
  target: number; // uid de l'ennemi visé (suivi), -1 si aucun
  done: boolean;
}

export type TargetLookup = (uid: number, out: { x: number; y: number }) => boolean;

export class Shots {
  private readonly pool: Shot[] = [];
  private readonly live: Shot[] = [];
  private readonly tmp = { x: 0, y: 0 };
  constructor(private readonly layer: Container, private readonly tex: FxTextures, private readonly parts: Particles, private readonly lookup: TargetLookup) {}

  private take(tex: Texture): Shot {
    let sh = this.pool.pop();
    if (!sh) {
      const s = new Sprite(tex);
      this.layer.addChild(s);
      sh = { s, style: 'orb', x0: 0, y0: 0, x1: 0, y1: 0, t: 0, dur: 0.2, color: 0xffffff, size: 1, target: -1, done: false };
    }
    sh.s.texture = tex;
    sh.s.visible = true;
    sh.s.alpha = 1;
    sh.s.blendMode = 'add';
    sh.done = false;
    sh.t = 0;
    this.live.push(sh);
    return sh;
  }

  /** Projectile qui suit sa cible. */
  fire(style: ShotStyle, x0: number, y0: number, target: number, color: number, size = 1): void {
    if (this.live.length > 160) return;
    if (!this.lookup(target, this.tmp)) return;
    const tex = style === 'arrow' ? this.tex.streak : style === 'note' ? this.tex.star : this.tex.dot;
    const sh = this.take(tex);
    sh.style = style; sh.color = color; sh.size = size; sh.target = target;
    sh.x0 = x0; sh.y0 = y0; sh.x1 = this.tmp.x; sh.y1 = this.tmp.y;
    const dist = Math.hypot(sh.x1 - x0, sh.y1 - y0);
    sh.dur = Math.min(0.32, 0.08 + dist / 2600);
    sh.s.anchor.set(0.5);
    sh.s.tint = color;
    sh.s.scale.set(size);
    sh.s.position.set(x0, y0);
    sh.s.blendMode = style === 'web' ? 'normal' : 'add';
  }

  /** Rayon instantané entre deux points (laser, éclair). */
  beam(x0: number, y0: number, x1: number, y1: number, color: number, width: number, dur = 0.22): void {
    if (this.live.length > 160) return;
    const sh = this.take(Texture.WHITE);
    sh.style = 'beam'; sh.color = color; sh.size = width; sh.target = -1; sh.dur = dur;
    sh.x0 = x0; sh.y0 = y0; sh.x1 = x1; sh.y1 = y1;
    const s = sh.s;
    s.anchor.set(0, 0.5);
    s.position.set(x0, y0);
    s.rotation = Math.atan2(y1 - y0, x1 - x0);
    s.width = Math.hypot(x1 - x0, y1 - y0);
    s.height = width;
    s.tint = color;
  }

  /** Éclair brisé entre deux points. */
  bolt(x0: number, y0: number, x1: number, y1: number, color: number, width = 8): void {
    const n = 4;
    let px = x0, py = y0;
    const nx = -(y1 - y0), ny = x1 - x0;
    const nl = Math.hypot(nx, ny) || 1;
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      const j = i === n ? 0 : (Math.random() - 0.5) * 60;
      const x = x0 + (x1 - x0) * t + (nx / nl) * j, y = y0 + (y1 - y0) * t + (ny / nl) * j;
      this.beam(px, py, x, y, color, width, 0.18);
      this.beam(px, py, x, y, 0xffffff, width * 0.35, 0.18);
      px = x; py = y;
    }
  }

  /** Anneau qui s'étend (éclaboussure, onde). */
  ring(x: number, y: number, color: number, radius = 90, dur = 0.35): void {
    if (this.live.length > 160) return;
    const sh = this.take(this.tex.ring);
    sh.style = 'splash'; sh.color = color; sh.size = radius / 40; sh.target = -1; sh.dur = dur;
    sh.x0 = x; sh.y0 = y; sh.x1 = x; sh.y1 = y;
    sh.s.anchor.set(0.5);
    sh.s.position.set(x, y);
    sh.s.tint = color;
    sh.s.scale.set(0.2);
  }

  update(dt: number): void {
    const L = this.live;
    for (let i = L.length - 1; i >= 0; i--) {
      const sh = L[i]!;
      sh.t += dt;
      const k = Math.min(1, sh.t / sh.dur);
      const s = sh.s;
      if (sh.style === 'beam') {
        s.alpha = 1 - k * k;
        s.height = sh.size * (1 - 0.6 * k);
      } else if (sh.style === 'splash') {
        s.scale.set(0.2 + (sh.size - 0.2) * (1 - (1 - k) * (1 - k)));
        s.alpha = 1 - k;
      } else {
        if (sh.target >= 0 && this.lookup(sh.target, this.tmp)) { sh.x1 = this.tmp.x; sh.y1 = this.tmp.y; }
        const x = sh.x0 + (sh.x1 - sh.x0) * k;
        const arc = sh.style === 'note' || sh.style === 'web' ? Math.sin(k * Math.PI) * 50 : 0;
        const y = sh.y0 + (sh.y1 - sh.y0) * k - arc;
        s.position.set(x, y);
        if (sh.style === 'arrow') s.rotation = Math.atan2(sh.y1 - sh.y0, sh.x1 - sh.x0);
        if (sh.style === 'note') s.rotation += dt * 10;
        if (k >= 1 && !sh.done) {
          sh.done = true;
          this.parts.burst(this.tex.spark, x, y, sh.style === 'web' ? 4 : 5, sh.color, 260, 0.25, 0.45 * sh.size);
        }
      }
      if (k >= 1) {
        s.visible = false;
        L[i] = L[L.length - 1]!;
        L.pop();
        this.pool.push(sh);
      }
    }
  }

  clear(): void {
    for (const sh of this.live) { sh.s.visible = false; this.pool.push(sh); }
    this.live.length = 0;
  }
}

// ---------------------------------------------------------------- chiffres de dégâts

export const DMG_FONT = 'mr-degats';

/** Police bitmap des chiffres (Lilita One blanche à contour sombre, teintée à l'usage). */
export function installDamageFont(): void {
  BitmapFont.install({
    name: DMG_FONT,
    style: {
      fontFamily: '"Lilita One", "Arial Rounded MT Bold", Arial, sans-serif',
      fontSize: 64,
      fill: 0xffffff,
      stroke: { color: 0x1d1733, width: 12, join: 'round' },
    },
    chars: [['0', '9'], ',', ' ', 'k', 'M', '!', '+', '-', 'B', 'l', 'o', 'q', 'u', 'é', 'Z', 'z'],
    resolution: 2,
    padding: 6,
  });
}

/** 8 300 → « 8,3 k » ; 51 900 000 → « 51,9 M ». */
export function formatDamage(n: number): string {
  const v = Math.round(n);
  if (v < 1000) return String(v);
  if (v < 1e6) return `${(v / 1e3).toFixed(v < 1e4 ? 1 : 0).replace('.', ',')} k`;
  if (v < 1e9) return `${(v / 1e6).toFixed(v < 1e7 ? 1 : 0).replace('.', ',')} M`;
  return `${(v / 1e9).toFixed(1).replace('.', ',')} B`;
}

interface Num { t: BitmapText; life: number; max: number; vy: number; base: number; pop: number }

export class Numbers {
  private readonly pool: Num[] = [];
  private readonly live: Num[] = [];
  constructor(private readonly layer: Container, private readonly max = 48) {}

  show(text: string, x: number, y: number, o: { color?: number; size?: number; life?: number } = {}): void {
    if (this.live.length >= this.max) {
      // On recycle le plus ancien : les chiffres récents restent lisibles.
      const old = this.live.shift()!;
      old.t.visible = false;
      this.pool.push(old);
    }
    let n = this.pool.pop();
    if (!n) {
      const t = new BitmapText({ text: '', style: { fontFamily: DMG_FONT, fontSize: 40 } });
      t.anchor.set(0.5, 1);
      this.layer.addChild(t);
      n = { t, life: 0, max: 0.8, vy: -90, base: 1, pop: 0 };
    }
    n.t.text = text;
    n.t.tint = o.color ?? 0xffe14a;
    n.t.position.set(x + (Math.random() - 0.5) * 30, y);
    n.base = (o.size ?? 40) / 40;
    n.t.scale.set(n.base * 0.4);
    n.t.alpha = 1;
    n.t.visible = true;
    n.life = 0;
    n.max = o.life ?? 0.8;
    n.vy = -110;
    this.live.push(n);
  }

  update(dt: number): void {
    const L = this.live;
    for (let i = L.length - 1; i >= 0; i--) {
      const n = L[i]!;
      n.life += dt;
      const k = n.life / n.max;
      if (k >= 1) {
        n.t.visible = false;
        L.splice(i, 1);
        this.pool.push(n);
        continue;
      }
      n.t.y += n.vy * dt;
      n.vy *= Math.max(0, 1 - 2.5 * dt);
      // Pop d'apparition : 0,4 → 1,15 → 1.
      const pop = k < 0.12 ? 0.4 + (k / 0.12) * 0.75 : k < 0.25 ? 1.15 - ((k - 0.12) / 0.13) * 0.15 : 1;
      n.t.scale.set(n.base * pop);
      n.t.alpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
    }
  }

  clear(): void {
    for (const n of this.live) { n.t.visible = false; this.pool.push(n); }
    this.live.length = 0;
  }
}
