// Signatures visuelles des 43 unités (28 + 15 DC) et des pouvoirs de boss : un tir, un impact et une version « compétence » propres à
// chacune, reprises des effets des planches (rayon, éclair, toile, bulles, notes…).
// Les rappels de fin (impacts) sont des fonctions de module : aucune fermeture créée par tir.
import type { BossId, UnitId } from '../../data/types';
import type { CombatFx, P } from './director';
import { ANTI_LIFE_NAME, BOOM_TUBE_NAME, SNAP_NAME, THANOS_STONES } from '../../data/bosses';
import { UNIT_FX_COLOR } from '../fxTable';
import { BeamMode, Curve, Ease, Mode, type Mote } from './pools';

const fxOf = (m: Mote) => m.o as CombatFx;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)]!;

// ---------------------------------------------------------------- traînées

/** Halo additif qui s'éteint derrière le projectile. */
function trGlow(m: Mote): void {
  const fx = fxOf(m);
  const g = fx.top.spawn(fx.tex.glow, m.x, m.y, 0.16);
  g.s.tint = m.color; g.s.blendMode = 'add'; g.s0 = 0.55; g.s1 = 0.15;
}
/** Copie fantôme (flou de mouvement : bouclier, anneaux). */
function trGhost(m: Mote): void {
  const fx = fxOf(m);
  const g = fx.shots.spawn(m.s.texture, m.x, m.y, 0.12);
  g.rot = m.s.rotation; g.a0 = 0.4; g.s0 = m.s.scale.x; g.s1 = m.s.scale.x * 0.8; g.sy = m.s.scale.y / (m.s.scale.x || 1); g.fout = 0;
}
function trSparkle(m: Mote): void {
  const fx = fxOf(m);
  const g = fx.top.spawn(fx.tex.starCore, m.x + rnd(-6, 6), m.y + rnd(-6, 6), 0.3);
  g.s.tint = m.color; g.vy = rnd(-40, 40); g.vx = rnd(-40, 40); g.s0 = 0.55; g.s1 = 0; g.spin = 8;
}
function trFire(m: Mote): void {
  const fx = fxOf(m);
  const g = fx.top.spawn(fx.tex.flame, m.x, m.y, 0.25);
  g.vy = -60; g.s0 = 0.5; g.s1 = 0.1; g.fout = 0.3;
}
function trFrost(m: Mote): void {
  const fx = fxOf(m);
  const g = fx.top.spawn(fx.tex.snowflake, m.x, m.y, 0.35);
  g.s0 = 0.5; g.s1 = 0.15; g.spin = 5; g.vy = 30;
}
function trZap(m: Mote): void {
  const fx = fxOf(m);
  const a = Math.random() * 6.28;
  const g = fx.top.spawn(fx.tex.sparkInk, m.x, m.y, 0.16);
  g.s.tint = m.color; g.vx = Math.cos(a) * 160; g.vy = Math.sin(a) * 160; g.face = true; g.s0 = 0.45; g.s1 = 0.1;
}
function trDroplet(m: Mote): void {
  const fx = fxOf(m);
  const g = fx.top.spawn(fx.tex.drop, m.x, m.y, 0.3);
  g.s.tint = 0x7fe0f0; g.vy = 40; g.grav = 600; g.face = true; g.s0 = 0.38; g.s1 = 0.15;
}
function trEmber(m: Mote): void {
  const fx = fxOf(m);
  const g = fx.top.spawn(fx.tex.flame, m.x + rnd(-6, 6), m.y + rnd(-6, 6), 0.32);
  g.vy = -90; g.vx = rnd(-30, 30); g.s0 = 0.55; g.s1 = 0.08;
}
function trStreak(m: Mote): void {
  const fx = fxOf(m);
  const g = fx.shots.spawn(fx.tex.streak, m.x, m.y, 0.12);
  g.rot = m.s.rotation; g.a0 = 0.55; g.s0 = 1; g.s1 = 0.4; g.sy = 0.5; g.fout = 0;
}
function trFirefly(m: Mote): void {
  const fx = fxOf(m);
  const g = fx.top.spawn(fx.tex.spark, m.x, m.y, 0.3);
  g.s.tint = 0xeaff7a; g.s.blendMode = 'add'; g.s0 = 0.5; g.s1 = 0; g.vy = 20;
}
function trBubbles(m: Mote): void {
  const fx = fxOf(m);
  const g = fx.top.spawn(fx.tex.bubble, m.x, m.y, 0.45);
  g.vy = -70; g.vx = rnd(-20, 20); g.s0 = 0.3; g.s1 = 0.45; g.fout = 0.5;
}
function trPetal(m: Mote): void {
  const fx = fxOf(m);
  const g = fx.top.spawn(fx.tex.petal, m.x, m.y, 0.45);
  g.s.tint = Math.random() < 0.5 ? 0xff9a1f : 0xffc23a; g.vy = 60; g.vx = rnd(-50, 50); g.spin = rnd(-8, 8); g.rot = rnd(0, 6); g.s0 = 0.55; g.s1 = 0.3;
}
function trPaw(m: Mote): void {
  const fx = fxOf(m);
  const g = fx.put('paw', m.x, m.y + 18, 0.35, 'ground');
  g.s.tint = m.color; g.rot = m.s.rotation; g.s0 = g.s1 = 0.45; g.a0 = 0.7; g.fout = 0.3;
}
function trRise(m: Mote): void {
  const fx = fxOf(m);
  const g = fx.top.spawn(fx.tex.starCore, m.x + rnd(-60, 60), m.y + rnd(0, 50), 0.6);
  g.s.tint = m.color; g.vy = -170; g.s0 = 0.7; g.s1 = 0; g.spin = 4;
}

// ---------------------------------------------------------------- impacts

function hitRepulsor(m: Mote): void {
  const fx = fxOf(m);
  fx.pop(m.x, m.y, 0x7fe3ff, 0.75);
  fx.ring(m.x, m.y, 0x7fe3ff, 46, 0.25);
  fx.glow(m.x, m.y, 0x7fe3ff, 1.4, 0.2);
  fx.sparks(m.x, m.y, 0xbff4ff, 4, 300, 0.55);
}
function hitWeb(m: Mote): void {
  const fx = fxOf(m);
  const n = fx.attach('webNet', m.uid, 0.55, 'shots');
  n.curve = Curve.Pop; n.s0 = 0.15; n.s1 = 0.62; n.rot = rnd(0, 1); n.fout = 0.55;
  fx.sparks(m.x, m.y, 0xf4f2fa, 3, 240, 0.5);
}
function hitRock(m: Mote): void {
  const fx = fxOf(m);
  fx.pop(m.x, m.y, 0x7ed957, 0.9);
  fx.debris(m.x, m.y, 'shard', 0xb8a690, 5, 380, 0.7);
  fx.puffs(m.x, m.y + 20, 0xe8dcc8, 3, 0.7);
  const f = fx.feet(m.uid);
  if (f) fx.ring(f.x, f.y, 0x7ed957, 70, 0.32, 'ground', 0.45);
}
function hitRune(m: Mote): void {
  const fx = fxOf(m);
  const d = fx.put('mandala', m.x, m.y, 0.32);
  d.curve = Curve.Out; d.s0 = 0.1; d.s1 = 0.48; d.spin = 6; d.fout = 0.5;
  fx.sparks(m.x, m.y, 0xffa53b, 4, 260, 0.5);
}
function hitPhoton(m: Mote): void {
  const fx = fxOf(m);
  fx.pop(m.x, m.y, 0xffd34a, 0.8);
  fx.glow(m.x, m.y, 0xffd34a, 1.3, 0.2);
  fx.sparks(m.x, m.y, 0xffe27a, 4, 320, 0.55);
}
/** Bouclier de Cap : clang, puis ricochet vers la cible suivante, enfin retour au lanceur. */
function capBounce(m: Mote): void {
  const fx = fxOf(m);
  if (m.uid >= 0) {
    fx.pop(m.x, m.y, 0x9fc8ff, 0.85, 0.22);
    fx.ring(m.x, m.y, 0x5aa0ff, 44, 0.24);
    fx.sparks(m.x, m.y, 0xe8f0ff, 4, 340, 0.55);
  }
  const list = m.list;
  const next = list ? m.p0 + 1 : 0;
  const from = { x: m.x, y: m.y };
  if (list && next < list.length && fx.body(list[next])) {
    const s = fx.shot('shield', from, list[next]!, 0.13, capBounce);
    s.list = list; s.p0 = next; s.p1 = m.p1; s.spin = 26; s.sy = 0.85; s.trail = trGhost; s.trailEvery = 0.025;
  } else if (m.uid >= 0) {
    // Retour au lanceur.
    const c = fx.host.cell(m.p1);
    const s = fx.shotTo('shield', from, { x: c.x, y: c.y - 20 }, fx.travel(from, c, 2600, 0.12, 0.3), capBounce);
    s.uid = -1; s.list = null; s.spin = 26; s.sy = 0.85; s.ease = Ease.InOut; s.fout = 0.8; s.trail = trGhost; s.trailEvery = 0.025;
  }
}
function hitDagger(m: Mote): void {
  const fx = fxOf(m);
  const s = fx.put('slash', m.x, m.y, 0.22);
  s.s.tint = 0x7fe08a; s.curve = Curve.Pop; s.s0 = 0.3; s.s1 = 0.8; s.rot = rnd(-0.6, 0.6) + Math.PI; s.fout = 0.4;
  fx.puffs(m.x, m.y, 0x7fe08a, 2, 0.5, 80, 0.4);
  fx.sparks(m.x, m.y, 0xc8ffd0, 3, 260, 0.5);
}
function hitExplosive(m: Mote): void {
  const fx = fxOf(m);
  fx.pop(m.x, m.y, 0xff8a2a, 1.25, 0.3);
  fx.glow(m.x, m.y, 0xffa040, 2.6, 0.3);
  fx.puffs(m.x, m.y, 0x6a5a6a, 4, 0.9, 150, 0.55);
  fx.sparks(m.x, m.y, 0xffc040, 6, 420, 0.7);
  fx.ring(m.x, m.y, 0xff8a2a, 100, 0.32);
}
function hitIce(m: Mote): void {
  const fx = fxOf(m);
  const s = fx.put('snowflake', m.x, m.y, 0.4);
  s.curve = Curve.Pop; s.s0 = 0.4; s.s1 = 1.6; s.spin = 4; s.fout = 0.5;
  fx.debris(m.x, m.y, 'shard', 0xbff0ff, 5, 360, 0.6);
  fx.ring(m.x, m.y, 0x9fe8ff, 62, 0.3);
}
function hitZap(m: Mote): void {
  const fx = fxOf(m);
  fx.pop(m.x, m.y, 0xfff27a, 0.85);
  const list = m.list;
  if (list) {
    let a: P = { x: m.x, y: m.y };
    for (let i = 1; i < list.length; i++) {
      const b = fx.body(list[i]);
      if (!b) continue;
      fx.bolt(a, b, 0xfff27a, 8, 0.26, 1, (i - 1) * 0.05, list[i]);
      fx.later(list[i]!, 0.04 + (i - 1) * 0.05, hitSmallZap, 0xfff27a);
      a = b;
    }
  }
}
function hitSmallZap(m: Mote): void {
  const fx = fxOf(m);
  fx.sparks(m.x, m.y, m.color, 4, 280, 0.5);
  fx.glow(m.x, m.y, m.color, 1.1, 0.18);
}
function hitTracer(m: Mote): void {
  const fx = fxOf(m);
  fx.puffs(m.x, m.y, 0xd8dde6, 1, 0.45, 60, 0.3);
  fx.sparks(m.x, m.y, 0xfff2c0, 3, 300, 0.45);
}
function hitRedwing(m: Mote): void {
  const fx = fxOf(m);
  const r = fx.attach('reticle', m.uid, 0.6);
  r.curve = Curve.Out; r.s0 = 3; r.s1 = 1.3; r.spin = 5; r.fin = 0.15;
  fx.ring(m.x, m.y, 0xff3b3b, 70, 0.35);
  fx.sparks(m.x, m.y, 0xff6b5a, 4, 260, 0.5);
}
function hitRing10(m: Mote): void {
  const fx = fxOf(m);
  fx.pop(m.x, m.y, 0xffcf3f, 0.75);
  fx.ring(m.x, m.y, 0xffcf3f, 40, 0.22);
  fx.glow(m.x, m.y, 0xffe27a, 1.1, 0.18);
}
function hitKick(m: Mote): void {
  hitRing10(m);
  const fx = fxOf(m);
  const s = fx.put('slash', m.x, m.y, 0.2);
  s.s.tint = 0xffcf3f; s.curve = Curve.Pop; s.s0 = 0.3; s.s1 = 0.65; s.rot = rnd(-0.4, 0.4); s.fout = 0.4;
}
/** Anneau de Shang-Chi : fin de l'orbite autour du lanceur, il file vers sa cible. */
function ringLaunch(m: Mote): void {
  const fx = fxOf(m);
  if (!fx.body(m.p0)) return;
  const s = fx.shot('tenRing', { x: m.x, y: m.y }, m.p0, 0.2, hitRing10, 0xffcf3f);
  s.ease = Ease.In; s.spin = 20; s.sy = 0.6; s.trail = trGhost; s.trailEvery = 0.03;
}
function hitDrop(m: Mote): void {
  const fx = fxOf(m);
  fx.debris(m.x, m.y, 'drop', 0x5fd6e8, 5, 360, 0.55);
  fx.puffs(m.x, m.y, 0xe8fbff, 2, 0.55, 90, 0.35);
  const f = fx.feet(m.uid);
  if (f) fx.ring(f.x, f.y, 0x5fd6e8, 56, 0.3, 'ground', 0.45);
}
function hitFeather(m: Mote): void {
  const fx = fxOf(m);
  for (let i = 0; i < fx.n(3); i++) {
    const f = fx.top.spawn(fx.tex.feather, m.x, m.y, 0.5);
    f.vx = rnd(-140, 140); f.vy = rnd(-160, -40); f.grav = 300; f.drag = 2; f.spin = rnd(-6, 6); f.rot = rnd(0, 6); f.s0 = 0.55; f.s1 = 0.4;
  }
  fx.sparks(m.x, m.y, 0x4fd1b5, 3, 260, 0.5);
}
function hitShark(m: Mote): void {
  const fx = fxOf(m);
  const f = fx.feet(m.uid) ?? { x: m.x, y: m.y + 40 };
  const fin = fx.shotTo('sharkFin', { x: f.x - 50, y: f.y + 6 }, { x: f.x + 10, y: f.y - 22 }, 0.4);
  fin.ease = Ease.Out; fin.s0 = 1.5; fin.s1 = 1.7; fin.fout = 0.6;
  const b = fx.put('bite', m.x, m.y, 0.36);
  b.curve = Curve.Chomp; b.s1 = 1.15; b.fout = 0.6;
  fx.debris(f.x, f.y - 10, 'drop', 0x3fc7d8, 8, 520, 0.7);
  fx.puffs(f.x, f.y - 6, 0xe8fbff, 4, 0.8, 140, 0.45);
  fx.ring(f.x, f.y, 0x3fc7d8, 120, 0.38, 'ground', 0.45);
  fx.host.shake(3, 0.15);
}
function hitLeaf(m: Mote): void {
  const fx = fxOf(m);
  for (let i = 0; i < fx.n(5); i++) {
    const l = fx.top.spawn(fx.tex.leaf, m.x, m.y, 0.55);
    l.s.tint = pick([0x9be36a, 0x6fc04a, 0xffc04a]);
    const a = rnd(0, 6.28);
    l.vx = Math.cos(a) * 220; l.vy = Math.sin(a) * 220 - 60; l.drag = 4; l.grav = 120; l.spin = rnd(-10, 10); l.rot = a; l.s0 = 0.75; l.s1 = 0.45;
  }
  fx.ring(m.x, m.y, 0x9be36a, 44, 0.25);
}
function hitFire(m: Mote): void {
  const fx = fxOf(m);
  const s = fx.put('slash', m.x, m.y, 0.22);
  s.s.tint = 0xfff0d0; s.curve = Curve.Pop; s.s0 = 0.4; s.s1 = 0.95; s.rot = -2.3; s.fout = 0.4;
  for (let i = 0; i < fx.n(3); i++) {
    const f = fx.top.spawn(fx.tex.flame, m.x + rnd(-24, 24), m.y + rnd(-10, 14), 0.4);
    f.curve = Curve.Pop; f.s0 = 0.2; f.s1 = rnd(0.6, 0.9); f.vy = -50; f.fout = 0.5; f.delay = i * 0.03;
  }
  fx.glow(m.x, m.y, 0xff8a3d, 1.8, 0.25);
}
function hitSnow(m: Mote): void {
  const fx = fxOf(m);
  fx.puffs(m.x, m.y + 10, 0xf4fbff, 3, 1, 160, 0.5);
  fx.debris(m.x, m.y, 'shard', 0xdff4ff, 3, 340, 0.6);
  const f = fx.feet(m.uid);
  if (f) fx.ring(f.x, f.y, 0xeaf7ff, 70, 0.35, 'ground', 0.45);
}
function hitBullseye(m: Mote): void {
  const fx = fxOf(m);
  const b = fx.attach('bullseye', m.uid, 0.45);
  b.curve = Curve.Pop; b.s0 = 0.3; b.s1 = 1.1; b.fout = 0.55;
  fx.pop(m.x, m.y, 0xffd84a, 1.05, 0.26);
  fx.sparks(m.x, m.y, 0x8be06a, 4, 340, 0.55);
}
function hitBubble(m: Mote): void {
  const fx = fxOf(m);
  const r = fx.top.spawn(fx.tex.ring, m.x, m.y, 0.2);
  r.s.tint = 0xc8f4ff; r.curve = Curve.Out; r.s0 = 0.1; r.s1 = 0.45; r.fout = 0.3;
  fx.sparks(m.x, m.y, 0x9ae8ff, 2, 200, 0.4);
}
function hitSong(m: Mote): void {
  const fx = fxOf(m);
  const b = fx.attach('bigBubble', m.uid, 1.5);
  b.curve = Curve.Bounce; b.s0 = 0.2; b.s1 = (fx.width(m.uid) / 118) * 0.95; b.fin = 0; b.fout = 0.85;
  for (let i = 0; i < 2; i++) {
    const h = fx.attach('heart', m.uid, 1.5);
    h.orbR = 46; h.orbW = 4; h.ang = i * Math.PI; h.oy = -44; h.curve = Curve.Pulse; h.s0 = 0.75; h.s1 = 0.95; h.p1 = i; h.fout = 0.8;
  }
}
function hitBite(m: Mote): void {
  const fx = fxOf(m);
  const b = fx.attach('bite', m.uid, 0.32);
  b.curve = Curve.Chomp; b.s1 = 0.9; b.rot = rnd(-0.3, 0.3); b.fout = 0.6;
  const p = fx.put('paw', m.x + rnd(-20, 20), m.y + 24, 0.4);
  p.s.tint = m.color; p.curve = Curve.Pop; p.s0 = 0.3; p.s1 = 0.8; p.rot = rnd(-0.5, 0.5); p.fout = 0.5;
  fx.sparks(m.x, m.y, m.color === 0xffffff ? 0xffe9c8 : 0xe0a46a, 3, 260, 0.5);
}
function hitFirefly(m: Mote): void {
  const fx = fxOf(m);
  fx.glow(m.x, m.y, 0xd8ff7a, 1.8, 0.3);
  fx.sparks(m.x, m.y, 0xeaff7a, 4, 220, 0.45);
}
const NEMO_SLOW = 1, NEMO_DOUBLE = 2, NEMO_POISON = 4, NEMO_HASTE = 8;
function hitNemo(m: Mote): void {
  const fx = fxOf(m);
  fx.pop(m.x, m.y, 0xff9a3c, 0.7);
  for (let i = 0; i < fx.n(3); i++) {
    const b = fx.top.spawn(fx.tex.bubble, m.x + rnd(-20, 20), m.y, 0.5);
    b.vy = rnd(-160, -80); b.s0 = 0.4; b.s1 = 0.6; b.fout = 0.5;
  }
  const y = m.y - fx.width(m.uid) * 0.55;
  if (m.p0 & NEMO_SLOW) { const s = fx.put('snowflake', m.x - 26, y, 0.6); s.curve = Curve.Pop; s.s0 = 0.3; s.s1 = 1.1; s.vy = -30; s.spin = 3; }
  if (m.p0 & NEMO_DOUBLE) fx.label('x2', m.x + 10, y + 10, 0xff8a2a, 40);
  if (m.p0 & NEMO_POISON) {
    const d = fx.put('drop', m.x + 24, y, 0.6); d.s.tint = 0x8be04a; d.rot = -Math.PI / 2; d.curve = Curve.Pop; d.s0 = 0.3; d.s1 = 1.1; d.vy = -30;
    fx.puffs(m.x, m.y, 0x8be04a, 2, 0.5, 60, 0.45);
  }
  if (m.p0 & NEMO_HASTE) { const z = fx.put('bolt', m.x, y - 6, 0.6); z.s.tint = 0xffe14a; z.curve = Curve.Pop; z.s0 = 0.3; z.s1 = 1.2; z.vy = -60; }
}
function hitMarigold(m: Mote): void {
  const fx = fxOf(m);
  const f = fx.put('marigold', m.x, m.y, 0.36);
  f.curve = Curve.Pop; f.s0 = 0.3; f.s1 = 1; f.spin = 3; f.fout = 0.5;
  for (let i = 0; i < fx.n(5); i++) {
    const p = fx.top.spawn(fx.tex.petal, m.x, m.y, 0.5);
    const a = rnd(0, 6.28);
    p.s.tint = i % 2 ? 0xff9a1f : 0xffc23a; p.vx = Math.cos(a) * 220; p.vy = Math.sin(a) * 220; p.drag = 4; p.grav = 160; p.rot = a; p.spin = rnd(-8, 8); p.s0 = 0.6; p.s1 = 0.35;
  }
}
function hitCarrot(m: Mote): void {
  const fx = fxOf(m);
  fx.pop(m.x, m.y, 0xff9b3b, 0.7);
  const s = fx.put('crackShield', m.x + 22, m.y - fx.width(m.uid) * 0.45, 0.5);
  s.curve = Curve.Pop; s.s0 = 0.3; s.s1 = 1.2; s.vy = -40; s.fout = 0.6;
  fx.debris(m.x, m.y, 'shard', 0x9fb4d0, 3, 300, 0.5);
}
function hitBonk(m: Mote): void {
  const fx = fxOf(m);
  fx.pop(m.x, m.y, 0xffe14a, 1.35, 0.3);
  for (let i = 0; i < fx.n(4); i++) {
    const a = -Math.PI / 2 + (i - 1.5) * 0.7;
    const s = fx.top.spawn(fx.tex.stunStar, m.x, m.y - 10, 0.5);
    s.vx = Math.cos(a) * 240; s.vy = Math.sin(a) * 240; s.grav = 600; s.drag = 1.5; s.spin = 8; s.s0 = 0.9; s.s1 = 0.5;
  }
  if (Math.random() < 0.5) fx.label('BONK!', m.x, m.y - fx.width(m.uid) * 0.5, 0xffe14a, 32);
  fx.host.shake(2, 0.1);
}
function hitFist(m: Mote): void {
  const fx = fxOf(m);
  fx.pop(m.x, m.y, 0xff8a3d, 1.15, 0.28);
  fx.debris(m.x, m.y, 'brick', 0xffffff, 5, 460, 0.8);
  fx.puffs(m.x, m.y + 16, 0xd8c8b0, 3, 0.8, 140, 0.45);
  const f = fx.feet(m.uid);
  if (f) fx.ring(f.x, f.y, 0xff8a3d, 80, 0.32, 'ground', 0.45);
  fx.host.shake(2, 0.12);
}
function hitShieldBreak(m: Mote): void {
  hitFist(m);
  const fx = fxOf(m);
  fx.debris(m.x, m.y, 'shard', 0x7fc4ff, 8, 520, 0.8);
  fx.ring(m.x, m.y, 0x6fb6ff, 90, 0.3);
  fx.label('POW!', m.x, m.y - fx.width(m.uid) * 0.5, 0x7fc4ff, 34);
}
function hitGeneric(m: Mote): void {
  const fx = fxOf(m);
  fx.pop(m.x, m.y, m.color, 0.7);
  fx.sparks(m.x, m.y, m.color, 3, 260, 0.5);
}

// ---------------------------------------------------------------- attaques

export function playAttack(fx: CombatFx, slot: number, unit: UnitId, key: string, targets: readonly number[]): void {
  const t0 = targets[0];
  const b0 = fx.body(t0);
  const o = fx.origin(slot, t0);
  const col = UNIT_FX_COLOR[unit] ?? 0xffffff;
  if (t0 === undefined || !b0) {
    // Cible déjà disparue : simple lueur de tir.
    fx.muzzle(o, col);
    return;
  }
  const name = key.slice(key.indexOf(':') + 1);
  switch (unit) {
    case 'ironman': {
      if (name === 'unibeam') {
        // Uni-Beam : large rayon de poitrine qui traverse toute la ligne.
        const far = farthest(fx, o, targets) ?? b0;
        const c = fx.host.cell(slot);
        const from = { x: c.x, y: c.y - 10 };
        fx.beam(from, far, 0x7fe3ff, 58, 0.5, BeamMode.Flash, -1, 220);
        fx.glow(from.x, from.y, 0x9ff0ff, 3, 0.4);
        fx.pop(from.x, from.y, 0x9ff0ff, 1.3, 0.3);
        targets.forEach((t, i) => fx.later(t, 0.03 + i * 0.03, hitRepulsor));
        fx.host.shake(5, 0.25);
        fx.host.flash(0.12, 0.2, 0x9ff0ff);
        return;
      }
      fx.muzzle(o, 0x7fe3ff);
      const m = fx.shot('repulsor', o, t0, fx.travel(o, b0, 2600), hitRepulsor, 0x7fe3ff);
      m.s0 = 0.8; m.s1 = 1.05; m.trail = trGlow; m.trailEvery = 0.016;
      return;
    }
    case 'spiderman': {
      const d = fx.travel(o, b0, 2000, 0.14, 0.4);
      const m = fx.shot('webBlob', o, t0, d, hitWeb);
      m.arc = 26; m.spin = 9;
      fx.beam(o, b0, 0xf4f2fa, 8, d + 0.18, BeamMode.Extend, t0, 0, false);
      return;
    }
    case 'hulk': {
      if (name === 'smash') { hulkSmash(fx, slot, t0, targets); return; }
      const m = fx.shot('boulder', o, t0, fx.travel(o, b0, 1500, 0.22, 0.42), hitRock);
      m.arc = 110; m.spin = 7; m.s0 = 1.05; m.s1 = 1.2;
      return;
    }
    case 'thor': {
      // Inquisiteur : Mjolnir lancé en cloche sur la cible, onde de choc de zone à l'impact ; en mode
      // actif, la foudre tombe en plus sur la cible ; Marteau de foi : marteau géant doré qui étourdit.
      if (name === 'marteau-foi') { thorFaith(fx, slot, t0, targets); return; }
      const active = name === 'foudre';
      const m = fx.shot('hammer', o, t0, fx.travel(o, b0, active ? 2100 : 1600, 0.14, 0.36), active ? thorLandActive : thorLand, 0x9fd8ff);
      m.arc = active ? 70 : 120; m.spin = 14; m.s0 = 0.9; m.s1 = active ? 1.25 : 1.1;
      targets.slice(1).forEach((t, i) => fx.later(t, 0.06 + i * 0.03 + fx.travel(o, b0, 1600, 0.14, 0.36), hitSmallZap, active ? 0xfff6c0 : 0x9fd8ff));
      return;
    }
    case 'strange': {
      const m = fx.shot('rune', o, t0, fx.travel(o, b0, 1700), hitRune, 0xffa53b);
      m.spin = 9; m.trail = trSparkle; m.trailEvery = 0.03;
      return;
    }
    case 'venom': {
      if (name === 'devorer') { venomDevour(fx, o, t0); return; }
      fx.tendril(o, t0, 0x2a2440, 20, 0.34);
      const c = fx.attach('claw', t0, 0.3);
      c.delay = 0.1; c.curve = Curve.Pop; c.s0 = 0.4; c.s1 = 0.9; c.rot = rnd(-0.5, 0.5); c.fout = 0.5;
      fx.later(t0, 0.1, hitGeneric, 0xb5b0d0);
      return;
    }
    case 'cmarvel': {
      if (name === 'binaire') {
        fx.beam(o, b0, 0xffd34a, 32, 0.32, BeamMode.Flash, t0, 20);
        fx.glow(o.x, o.y, 0xffe27a, 1.8, 0.3);
        fx.later(t0, 0.02, hitPhoton);
        fx.ring(b0.x, b0.y, 0xffd34a, 62, 0.3);
        return;
      }
      fx.muzzle(o, 0xffd34a);
      const m = fx.shot('photon', o, t0, fx.travel(o, b0, 2600), hitPhoton, 0xffd34a);
      m.face = true; m.trail = trGlow; m.trailEvery = 0.02;
      return;
    }
    case 'cap': {
      const m = fx.shot('shield', o, t0, fx.travel(o, b0, 2200, 0.12, 0.3), capBounce);
      m.list = targets; m.p0 = 0; m.p1 = slot; m.spin = 26; m.sy = 0.85; m.trail = trGhost; m.trailEvery = 0.025;
      return;
    }
    case 'loki': {
      const d = fx.travel(o, b0, 2300);
      const dx = b0.x - o.x, dy = b0.y - o.y, L = Math.hypot(dx, dy) || 1;
      for (const side of [-1, 1]) {
        // Copies illusoires : partent en éventail et s'évanouissent en fumée verte.
        const to = { x: o.x + dx * 0.6 - (dy / L) * side * 60, y: o.y + dy * 0.6 + (dx / L) * side * 60 };
        const g = fx.shotTo('dagger', o, to, d * 0.7, illusionPuff);
        g.face = true; g.a0 = 0.5; g.fout = 0.5;
      }
      const m = fx.shot('dagger', o, t0, d, hitDagger, 0x7fe08a);
      m.face = true;
      return;
    }
    case 'bucky': {
      const crit = name === 'critique';
      fx.beam(o, b0, crit ? 0xff6a5a : 0xfff2c0, crit ? 18 : 10, crit ? 0.18 : 0.12, BeamMode.Flash, t0, 0);
      fx.pop(o.x, o.y, 0xffe14a, crit ? 0.7 : 0.45, 0.12);
      const s = fx.put('square', o.x, o.y, 0.45);
      s.s.tint = 0xf6c64a; s.sx = 0.5; s.s0 = s.s1 = 0.55; s.vx = rnd(-160, -60); s.vy = -260; s.grav = 1400; s.spin = 18;
      if (crit) {
        fx.later(t0, 0.02, hitCritShot);
        fx.host.shake(3, 0.12);
      } else fx.later(t0, 0.02, hitTracer);
      return;
    }
    case 'hawkeye': {
      const d = fx.travel(o, b0, 1900, 0.14, 0.38);
      if (name === 'explosive') {
        const m = fx.shot('arrowBoom', o, t0, d, hitExplosive);
        m.face = true; m.arc = 40; m.trail = trFire; m.trailEvery = 0.025;
      } else if (name === 'glace') {
        const m = fx.shot('arrowIce', o, t0, d, hitIce);
        m.face = true; m.arc = 40; m.trail = trFrost; m.trailEvery = 0.035;
      } else {
        const m = fx.shot('arrowZap', o, t0, d, hitZap, 0xfff27a);
        m.face = true; m.arc = 40; m.list = targets; m.trail = trZap; m.trailEvery = 0.02;
      }
      return;
    }
    case 'falcon': {
      // Double rafale rouge depuis les ailes.
      const dx = b0.x - o.x, dy = b0.y - o.y, L = Math.hypot(dx, dy) || 1;
      for (const k of [-1, 1]) {
        const a = { x: o.x - (dy / L) * 14 * k, y: o.y + (dx / L) * 14 * k };
        fx.beam(a, b0, 0xff6b5a, 11, 0.13, BeamMode.Flash, t0, 0, true, k > 0 ? 0.06 : 0);
      }
      fx.later(t0, 0.02, hitGeneric, 0xff6b5a);
      fx.later(t0, 0.08, hitGeneric, 0xff6b5a);
      return;
    }
    case 'widow': {
      if (name === 'morsure') {
        fx.bolt(o, b0, 0x6fc3ff, 12, 0.34, 2, 0, t0);
        fx.later(t0, 0.03, widowSting);
        return;
      }
      // Deux dards électriques (les « morsures » des bracelets), qui grésillent en vol.
      for (let i = 0; i < 2; i++) {
        const m = fx.shot('bolt', o, t0, fx.travel(o, b0, 2400), hitSmallZap, 0x6fc3ff);
        m.s.tint = 0x6fc3ff; m.face = true; m.faceOff = Math.PI / 2; m.s0 = m.s1 = 0.9; m.delay = i * 0.08; m.wob = 12; m.wobF = 0.5; m.p1 = i * Math.PI;
        m.trail = trZap; m.trailEvery = 0.025;
      }
      fx.muzzle(o, 0x6fc3ff);
      return;
    }
    case 'shangchi': {
      if (name === 'anneaux') {
        const c = fx.host.cell(slot);
        const rings = targets.slice(1);
        rings.forEach((t, i) => {
          const m = fx.put('tenRing', c.x, c.y, 0.3 + i * 0.035, 'shots');
          m.mode = Mode.Attach; m.uid = -1; m.x0 = c.x; m.y0 = c.y; m.orbR = 88; m.orbW = 14; m.ang = (i / rings.length) * Math.PI * 2; m.p1 = 0.5;
          m.curve = Curve.Pop; m.s0 = 0.2; m.s1 = 1; m.sy = 0.6; m.fout = 1; m.end = ringLaunch; m.p0 = t;
        });
        fx.glow(c.x, c.y, 0xffcf3f, 3, 0.5, 'ground');
        fx.host.shake(3, 0.2);
        fx.host.flash(0.08, 0.2, 0xffcf3f);
      }
      const m = fx.shot('tenRing', o, t0, fx.travel(o, b0, 2200), hitKick, 0xffcf3f);
      m.spin = 18; m.sy = 0.6;
      return;
    }
    case 'moana': {
      const m = fx.shot('drop', o, t0, fx.travel(o, b0, 1500, 0.16, 0.4), hitDrop);
      m.s.tint = 0x5fd6e8; m.face = true; m.arc = 60; m.s0 = m.s1 = 1.2; m.trail = trDroplet; m.trailEvery = 0.04;
      return;
    }
    case 'maui': {
      if (name === 'requin') {
        const m = fx.shot('drop', o, t0, fx.travel(o, b0, 2400), hitShark);
        m.s.tint = 0x3fc7d8; m.face = true; m.s0 = m.s1 = 1.3; m.trail = trDroplet; m.trailEvery = 0.025;
        return;
      }
      const m = fx.shot('feather', o, t0, fx.travel(o, b0, 2600), hitFeather);
      m.face = true; m.s0 = m.s1 = 1.25; m.wob = 12; m.wobF = 1;
      return;
    }
    case 'pocahontas': {
      const d = fx.travel(o, b0, 1300, 0.22, 0.48);
      for (let i = 0; i < 3; i++) {
        const m = fx.shot('leaf', o, t0, d, i === 0 ? hitLeaf : null);
        m.s.tint = [0x9be36a, 0x6fc04a, 0xffc04a][i]!; m.delay = i * 0.05; m.wob = 26; m.wobF = 1.5; m.p1 = i * 2.1; m.spin = 10; m.s0 = m.s1 = 0.9;
      }
      return;
    }
    case 'mulan': {
      if (name === 'avalanche') { mulanAvalanche(fx, slot, targets); return; }
      fx.muzzle(o, 0xff8a3d);
      const m = fx.shot('fireball', o, t0, fx.travel(o, b0, 1700), hitFire);
      m.face = true; m.trail = trEmber; m.trailEvery = 0.025;
      return;
    }
    case 'merida': {
      const m = fx.shot('arrowLong', o, t0, fx.travel(o, b0, 3400, 0.08, 0.26), hitBullseye);
      m.face = true; m.trail = trStreak; m.trailEvery = 0.012;
      return;
    }
    case 'ariel': {
      const d = fx.travel(o, b0, 1150, 0.22, 0.5);
      for (let i = 0; i < 4; i++) {
        const m = fx.shot('bubble', o, t0, d, hitBubble);
        m.delay = i * 0.06; m.wob = 16; m.wobF = 1.2; m.p1 = i * 1.7; m.s0 = m.s1 = rnd(0.55, 0.95);
      }
      return;
    }
    case 'foxhound': {
      // Double attaque : Rox (roux) puis Rouky (crème), deux morsures.
      const t1 = targets[1] ?? t0;
      for (let i = 0; i < 2; i++) {
        const t = i ? t1 : t0;
        const b = fx.body(t);
        if (!b) continue;
        // Bond : la patte file en arc en laissant des empreintes.
        const m = fx.shot('paw', o, t, fx.travel(o, b, 2000, 0.14, 0.32), hitBite, i ? 0xf4ead8 : 0xe0a46a);
        m.s.tint = i ? 0xfff4e4 : 0xffd0a0; m.face = true; m.faceOff = Math.PI / 2; m.s0 = m.s1 = 0.75; m.arc = 60; m.delay = i * 0.15;
        m.trail = trPaw; m.trailEvery = 0.05;
      }
      return;
    }
    case 'tiana': {
      const m = fx.shot('firefly', o, t0, fx.travel(o, b0, 1300, 0.2, 0.48), hitFirefly);
      m.wob = 20; m.wobF = 2; m.s0 = m.s1 = 1.5; m.face = true;
      const h = fx.shot('glow', o, t0, m.dur);
      h.s.tint = 0xeaff7a; h.s.blendMode = 'add'; h.wob = 20; h.wobF = 2; h.s0 = h.s1 = 1; m.trail = trFirefly; m.trailEvery = 0.025;
      return;
    }
    case 'nemo': {
      let bits = 0;
      if (name.includes('ralenti')) bits |= NEMO_SLOW;
      if (name.includes('double')) bits |= NEMO_DOUBLE;
      if (name.includes('poison')) bits |= NEMO_POISON;
      if (name.includes('cadence')) bits |= NEMO_HASTE;
      const m = fx.shot('fish', o, t0, fx.travel(o, b0, 1500, 0.18, 0.45), hitNemo);
      m.face = true; m.wob = 16; m.wobF = 1.5; m.p0 = bits; m.trail = trBubbles; m.trailEvery = 0.06;
      return;
    }
    case 'coco': {
      const m = fx.shot('note', o, t0, fx.travel(o, b0, 1500, 0.18, 0.45), hitMarigold);
      m.s.tint = 0xffd16a; m.arc = 50; m.spin = 5; m.trail = trPetal; m.trailEvery = 0.045;
      return;
    }
    case 'nickjudy': {
      const m = fx.shot('carrot', o, t0, fx.travel(o, b0, 2100), hitCarrot);
      m.face = true; m.s0 = m.s1 = 1.05;
      return;
    }
    case 'buzzwoody': {
      // Laser qui transperce la ligne.
      const far = farthest(fx, o, targets) ?? b0;
      fx.beam(o, far, 0x7dff6a, 20, 0.34, BeamMode.Grow, -1, 160);
      fx.glow(o.x, o.y, 0x8dff6a, 1.4, 0.25);
      targets.forEach((t, i) => fx.later(t, 0.04 + i * 0.02, hitSmallZap, 0x8dff6a));
      return;
    }
    case 'rapunzel': {
      const c = fx.host.cell(slot);
      fx.glow(c.x, c.y - 30, 0xffe28a, 2, 0.35, 'ground');
      const m = fx.shot('pan', o, t0, fx.travel(o, b0, 1300, 0.24, 0.45), hitBonk);
      m.arc = 80; m.spin = 16; m.s0 = m.s1 = 1.1;
      return;
    }
    case 'vanralph': {
      const m = fx.shot('fist', o, t0, fx.travel(o, b0, 1700, 0.14, 0.36), name === 'brise-bouclier' ? hitShieldBreak : hitFist);
      m.face = true; m.s0 = 0.7; m.s1 = 1.25; m.ease = Ease.In;
      return;
    }
    // ───────────── Extension DC ─────────────
    case 'batman': {
      if (name === 'fumigene') { batSmoke(fx, targets); return; }
      const list = name === 'batarangs' ? targets : [t0];
      list.forEach((t, i) => {
        const b = fx.body(t);
        if (!b) return;
        const m = fx.shot('batarang', o, t, fx.travel(o, b, 2100, 0.12, 0.36), hitBatarang, 0x9aa3b8);
        m.spin = 22; m.sy = 0.7; m.arc = (i - 1) * 40; m.delay = i * 0.04; m.trail = trGhost; m.trailEvery = 0.03;
      });
      return;
    }
    case 'superman': {
      if (name === 'souffle') { frostBreath(fx, slot, targets); return; }
      // Vision thermique : deux rayons rouges depuis les yeux, la cible s'embrase.
      const dx = b0.x - o.x, dy = b0.y - o.y, L = Math.hypot(dx, dy) || 1;
      for (const k of [-1, 1]) {
        const a = { x: o.x - (dy / L) * 6 * k, y: o.y - 18 + (dx / L) * 6 * k };
        fx.beam(a, b0, 0xff3a2a, 8, 0.2, BeamMode.Flash, t0, 0, true);
      }
      fx.glow(o.x, o.y - 18, 0xff6a4a, 1.2, 0.2);
      fx.later(t0, 0.03, hitHeat);
      return;
    }
    case 'wonderwoman': {
      if (name === 'lasso') { truthLasso(fx, slot, targets); return; }
      const m = fx.shot('slash', o, t0, fx.travel(o, b0, 2600, 0.08, 0.2), hitSword, 0xffd24a);
      m.s.tint = 0xfff4c8; m.face = true; m.s0 = 0.4; m.s1 = 0.7;
      targets.slice(1).forEach((t, i) => fx.later(t, 0.1 + i * 0.03, hitSmallZap, 0xffd24a));
      return;
    }
    case 'greenlantern': {
      if (name === 'mur') { lanternWall(fx, targets); return; }
      if (name === 'marteau') {
        const f = fx.feet(t0) ?? b0;
        const h = fx.shotTo('fist', { x: f.x, y: f.y - 420 }, { x: f.x, y: f.y - 30 }, 0.28, lanternHammer, 0x4cff7a);
        h.s.tint = 0x4cff7a; h.ease = Ease.In; h.rot = Math.PI / 2; h.s0 = 1.6; h.s1 = 2.4; h.p0 = t0;
        fx.glow(fx.host.cell(slot).x, fx.host.cell(slot).y, 0x4cff7a, 2.6, 0.4, 'ground');
        return;
      }
      if (name === 'mitrailleuse') {
        fx.glow(o.x, o.y, 0x4cff7a, 1.8, 0.5);
        targets.forEach((t, i) => {
          const b = fx.body(t);
          if (!b) return;
          const m = fx.shot('streak', o, t, fx.travel(o, b, 3200, 0.06, 0.2), hitSmallZap, 0x4cff7a);
          m.s.tint = 0x4cff7a; m.s.blendMode = 'add'; m.face = true; m.delay = i * 0.045; m.s0 = m.s1 = 0.8;
        });
        return;
      }
      // Rayon de l'anneau ; en formation, la zone s'élargit.
      fx.beam(o, b0, 0x4cff7a, 12, 0.18, BeamMode.Flash, t0, 0);
      fx.glow(o.x, o.y, 0x8dffa8, 1.2, 0.2);
      fx.later(t0, 0.02, hitLantern);
      if (targets.length > 1) fx.ring(b0.x, b0.y, 0x4cff7a, 90, 0.3);
      return;
    }
    case 'flash': {
      if (name === 'tour') { flashLap(fx, slot, targets); return; }
      // Trois coups éclair : zigzags jaunes depuis la case.
      targets.forEach((t, i) => {
        const b = fx.body(t);
        if (!b) return;
        for (let k = 0; k < (i === 0 ? 2 : 1); k++) fx.bolt(o, b, 0xffe03a, 7, 0.16, 0, k * 0.07 + i * 0.05, t);
        fx.later(t, 0.03 + i * 0.05, hitSpeed);
      });
      return;
    }
    case 'aquaman': {
      if (name === 'kraken') { krakenGrab(fx, targets); return; }
      const far = farthest(fx, o, targets) ?? b0;
      const m = fx.shotTo('trident', o, far, fx.travel(o, far, 2400, 0.1, 0.3));
      m.face = true; m.trail = trDroplet; m.trailEvery = 0.03;
      targets.forEach((t, i) => fx.later(t, 0.08 + i * 0.05, hitDrop));
      return;
    }
    case 'cyborg': {
      // Canon sonique : anneaux d'onde qui filent jusqu'à la cible.
      fx.muzzle(o, 0xff3a3a);
      for (let i = 0; i < 3; i++) {
        const m = fx.shot('ring', o, t0, fx.travel(o, b0, 2200), i === 2 ? hitSonic : null, 0xff3a3a);
        m.s.tint = 0xff6a5a; m.s.blendMode = 'add'; m.delay = i * 0.05; m.s0 = 0.25; m.s1 = 0.55; m.sy = 1.6; m.face = true;
      }
      return;
    }
    case 'supergirl': {
      if (name === 'eruption') { solarFlare(fx, slot, targets); return; }
      const m = fx.shot('fist', o, t0, fx.travel(o, b0, 2400, 0.1, 0.3), hitSolarPunch, 0x5aa0ff);
      m.face = true; m.s0 = 0.7; m.s1 = 1.1; m.ease = Ease.In; m.trail = trGlow; m.trailEvery = 0.02;
      return;
    }
    case 'shazam': {
      if (name === 'foudre') { skyBolts(fx, targets, 0xfff27a); return; }
      const m = fx.shot('fist', o, t0, fx.travel(o, b0, 2200, 0.1, 0.3), hitSmallZap, 0xfff27a);
      m.face = true; m.s0 = 0.7; m.s1 = 1; m.trail = trZap; m.trailEvery = 0.03;
      return;
    }
    case 'martian': {
      // Rayons des yeux martiens : deux traits verts qui se rejoignent.
      for (const k of [-1, 1]) fx.beam({ x: o.x + k * 8, y: o.y - 18 }, b0, 0x6fe07a, 7, 0.2, BeamMode.Flash, t0, 0, true);
      fx.later(t0, 0.03, hitGeneric, 0x6fe07a);
      fx.glow(b0.x, b0.y, 0x6fe07a, 1.3, 0.2);
      return;
    }
    case 'robin': {
      targets.forEach((t, i) => {
        const b = fx.body(t);
        if (!b) return;
        const m = fx.shot('staff', o, t, fx.travel(o, b, 2000, 0.12, 0.32), hitStaff, 0xffb43a);
        m.spin = 20; m.delay = i * 0.06; m.trail = trGhost; m.trailEvery = 0.03;
      });
      return;
    }
    case 'batgirl': {
      const m = fx.shot('batarang', o, t0, fx.travel(o, b0, 2300, 0.1, 0.3), hitKickPurple, 0xb08cff);
      m.spin = 22; m.sy = 0.7; m.s.tint = 0xd8c8ff;
      return;
    }
    case 'catwoman': {
      // Coup de fouet : le fouet claque jusqu'à la cible, griffure.
      fx.beam(o, b0, 0x2a2440, 5, 0.22, BeamMode.Extend, t0, 0, false);
      const c = fx.attach('claw', t0, 0.3);
      c.delay = 0.08; c.curve = Curve.Pop; c.s0 = 0.4; c.s1 = 0.85; c.rot = rnd(-0.5, 0.5); c.fout = 0.5;
      fx.later(t0, 0.09, hitGeneric, 0xc8c8d8);
      return;
    }
    case 'harley': {
      if (name === 'confettis') {
        const m = fx.shot('dotInk', o, t0, fx.travel(o, b0, 1500, 0.16, 0.42), hitConfetti, 0xffe27a);
        m.s.tint = 0xff6ab4; m.arc = 70; m.s0 = m.s1 = 1.4;
        return;
      }
      if (name === 'tarte') {
        const m = fx.shot('pie', o, t0, fx.travel(o, b0, 1500, 0.16, 0.42), hitPie);
        m.arc = 60; m.spin = 6;
        return;
      }
      const oops = name === 'oups';
      const m = fx.shot('mallet', o, t0, fx.travel(o, b0, 1600, 0.14, 0.4), oops ? hitOops : hitMallet);
      m.arc = 70; m.spin = oops ? 20 : 12; m.s0 = m.s1 = oops ? 0.8 : 1.15;
      return;
    }
    case 'greenarrow': {
      if (name === 'salve') { arrowRain(fx, targets); return; }
      const net = name === 'filet';
      const m = fx.shot('arrowLong', o, t0, fx.travel(o, b0, 3000, 0.08, 0.28), net ? hitNet : hitTracer);
      m.face = true; m.trail = trStreak; m.trailEvery = 0.015;
      return;
    }
    default: {
      const m = fx.shot('dotInk', o, t0, fx.travel(o, b0, 2000), hitGeneric, col);
      m.s.tint = col;
    }
  }
}

function farthest(fx: CombatFx, o: P, targets: readonly number[]): P | null {
  let best: P | null = null, d = -1;
  for (const t of targets) {
    const b = fx.body(t);
    if (!b) continue;
    const k = Math.hypot(b.x - o.x, b.y - o.y);
    if (k > d) { d = k; best = b; }
  }
  return best;
}

function illusionPuff(m: Mote): void {
  const fx = fxOf(m);
  fx.puffs(m.x, m.y, 0x7fe08a, 2, 0.5, 60, 0.35);
}

function hitCritShot(m: Mote): void {
  const fx = fxOf(m);
  fx.pop(m.x, m.y, 0xff4a3a, 1.5, 0.32);
  fx.ring(m.x, m.y, 0xff6a5a, 80, 0.3);
  fx.sparks(m.x, m.y, 0xffd0a0, 7, 460, 0.7);
}

function widowSting(m: Mote): void {
  const fx = fxOf(m);
  const p = { x: m.x, y: m.y };
  for (let i = 0; i < 3; i++) {
    const a = rnd(0, 6.28);
    fx.bolt(p, { x: m.x + Math.cos(a) * 70, y: m.y + Math.sin(a) * 60 }, 0x6fc3ff, 7, 0.28, 0, i * 0.04);
  }
  fx.pop(m.x, m.y, 0x6fc3ff, 1.1);
  fx.ring(m.x, m.y, 0x6fc3ff, 70, 0.3);
  fx.glow(m.x, m.y, 0x6fc3ff, 2, 0.3);
}

function hulkSmash(fx: CombatFx, slot: number, t0: number, targets: readonly number[]): void {
  const f = fx.feet(t0)!;
  const b = fx.body(t0)!;
  // Saut de la case vers la cible : rocher géant qui écrase.
  const c = fx.host.cell(slot);
  const m = fx.shotTo('boulder', { x: c.x, y: c.y - 40 }, { x: f.x, y: f.y - 20 }, 0.3, smashLand, 0x7ed957);
  m.arc = 220; m.spin = 6; m.s0 = 1.4; m.s1 = 2.2; m.ease = Ease.In;
  m.p0 = t0;
  void b; void targets;
}

function smashLand(m: Mote): void {
  const fx = fxOf(m);
  const x = m.x, y = m.y + 20;
  const cr = fx.put('crack', x, y, 1.1, 'ground');
  cr.curve = Curve.Out; cr.s0 = 0.5; cr.s1 = 1.15; cr.sy = 0.55; cr.fout = 0.6;
  fx.ring(x, y, 0x7ed957, 190, 0.45, 'ground', 0.5);
  fx.ring(x, y, 0xffffff, 130, 0.35, 'ground', 0.5);
  fx.pop(x, y - 40, 0x7ed957, 1.7, 0.32);
  fx.debris(x, y - 10, 'boulder', 0xffffff, 6, 620, 0.55, 0.7);
  fx.puffs(x, y, 0xe8dcc8, 6, 1.1, 220, 0.6);
  fx.host.shake(9, 0.35);
  fx.host.flash(0.14, 0.2, 0x7ed957);
}

function thorLand(m: Mote): void {
  const fx = fxOf(m);
  const f = fx.feet(m.uid) ?? { x: m.x, y: m.y + 20 };
  fx.ring(f.x, f.y, 0x9fd8ff, 120, 0.36, 'ground', 0.5);
  fx.ring(f.x, f.y, 0xffffff, 80, 0.26, 'ground', 0.5);
  fx.pop(m.x, m.y, 0xbfe6ff, 1.1, 0.24);
  fx.sparks(m.x, m.y, 0x9fd8ff, 6, 360, 0.6);
  fx.puffs(f.x, f.y, 0xe8eef8, 3, 0.8, 140, 0.4);
  fx.host.shake(2.5, 0.14);
}
function thorLandActive(m: Mote): void {
  const fx = fxOf(m);
  const f = fx.feet(m.uid) ?? { x: m.x, y: m.y + 20 };
  fx.bolt({ x: m.x + 10, y: m.y - 260 }, { x: m.x, y: m.y }, 0xfff6c0, 16, 0.24, 2);
  fx.ring(f.x, f.y, 0xfff6c0, 150, 0.4, 'ground', 0.5);
  fx.ring(f.x, f.y, 0x9fd8ff, 105, 0.32, 'ground', 0.5);
  fx.glow(m.x, m.y, 0xfff6c0, 2, 0.22);
  fx.sparks(m.x, m.y, 0xfff6c0, 9, 460, 0.7);
  fx.host.shake(3.5, 0.16);
}

function thorFaith(fx: CombatFx, slot: number, t0: number, targets: readonly number[]): void {
  const f = fx.feet(t0);
  if (!f) return;
  const c = fx.host.cell(slot);
  const m = fx.shotTo('hammer', { x: c.x, y: c.y - 50 }, { x: f.x, y: f.y - 24 }, 0.32, thorFaithLand, 0xffd34a);
  m.arc = 240; m.spin = 10; m.s0 = 1.4; m.s1 = 2.6; m.ease = Ease.In; m.p0 = t0;
  void targets;
}
function thorFaithLand(m: Mote): void {
  const fx = fxOf(m);
  const x = m.x, y = m.y + 24;
  const cr = fx.put('crack', x, y, 1, 'ground');
  cr.curve = Curve.Out; cr.s0 = 0.5; cr.s1 = 1.1; cr.sy = 0.55; cr.fout = 0.6;
  fx.bolt({ x: x - 20, y: y - 320 }, { x, y: y - 30 }, 0xffe27a, 22, 0.3, 3);
  fx.ring(x, y, 0xffd34a, 200, 0.45, 'ground', 0.5);
  fx.ring(x, y, 0xffffff, 140, 0.35, 'ground', 0.5);
  fx.pop(x, y - 40, 0xffe27a, 1.8, 0.32);
  fx.debris(x, y - 10, 'stunStar', 0xffffff, 5, 420, 0.8, 0.7);
  fx.host.shake(8, 0.32);
  fx.host.flash(0.14, 0.2, 0xffe27a);
}

function venomDevour(fx: CombatFx, o: P, t0: number): void {
  for (let i = 0; i < 3; i++) fx.tendril({ x: o.x + (i - 1) * 30, y: o.y }, t0, 0x2a2440, 22, 0.42, i * 0.03);
  const b = fx.body(t0)!;
  const top = fx.shotTo('jaw', { x: b.x, y: b.y - 64 }, { x: b.x, y: b.y - 14 }, 0.16, venomChomp);
  top.ease = Ease.In; top.s0 = top.s1 = 1.3; top.delay = 0.1; top.p0 = t0;
  const bot = fx.shotTo('jaw', { x: b.x, y: b.y + 64 }, { x: b.x, y: b.y + 14 }, 0.16);
  bot.ease = Ease.In; bot.s0 = bot.s1 = 1.3; bot.rot = Math.PI; bot.delay = 0.1;
}

function venomChomp(m: Mote): void {
  const fx = fxOf(m);
  const y = m.y + 14;
  fx.puffs(m.x, y, 0x2a2440, 5, 0.9, 200, 0.5);
  fx.sparks(m.x, y, 0xb5b0d0, 6, 420, 0.7);
  fx.ring(m.x, y, 0x8f84c4, 90, 0.3);
  fx.host.shake(4, 0.18);
  // Les mâchoires restent fermées un instant.
  for (const k of [-1, 1]) {
    const j = fx.put('jaw', m.x, y + k * 14, 0.22, 'shots');
    j.s0 = j.s1 = 1.3; j.rot = k > 0 ? Math.PI : 0; j.fout = 0.3;
  }
}

function mulanAvalanche(fx: CombatFx, slot: number, targets: readonly number[]): void {
  const c = fx.host.cell(slot);
  fx.glow(c.x, c.y, 0xeaf7ff, 3.2, 0.5, 'ground');
  targets.forEach((t, i) => {
    const b = fx.body(t);
    if (!b) return;
    const m = fx.shotTo('puff', { x: b.x + rnd(-60, 60), y: b.y - 520 }, b, 0.32, hitSnow);
    m.uid = t; m.s.tint = 0xf4fbff; m.ease = Ease.In; m.s0 = 1; m.s1 = 1.5; m.spin = rnd(-3, 3); m.delay = Math.min(0.4, i * 0.03 + rnd(0, 0.12));
  });
  fx.host.shake(8, 0.5);
  fx.host.flash(0.22, 0.35, 0xeaf7ff);
}

// ---------------------------------------------------------------- extension DC : impacts et grands effets

function hitBatarang(m: Mote): void {
  const fx = fxOf(m);
  const s = fx.put('slash', m.x, m.y, 0.2);
  s.s.tint = 0xd8dde6; s.curve = Curve.Pop; s.s0 = 0.3; s.s1 = 0.7; s.rot = rnd(-0.6, 0.6); s.fout = 0.4;
  fx.sparks(m.x, m.y, 0xd8dde6, 3, 280, 0.5);
}
/** Bombe fumigène : nuage gris qui recouvre la zone, cibles exposées (réticule). */
function batSmoke(fx: CombatFx, targets: readonly number[]): void {
  targets.forEach((t, i) => {
    const b = fx.body(t);
    if (!b) return;
    if (i < 6) fx.puffs(b.x, b.y + 10, 0x6a6f80, 3, 1.2, 90, 0.9);
    const r = fx.attach('reticle', t, 0.7);
    r.s.tint = 0xffd84a; r.curve = Curve.Out; r.s0 = 2; r.s1 = 1; r.spin = 3; r.delay = 0.1 + i * 0.03; r.fout = 0.5;
  });
  const b0 = fx.body(targets[0]);
  if (b0) { fx.pop(b0.x, b0.y, 0x8a8fa0, 1.4, 0.3); fx.ring(b0.x, b0.y, 0x8a8fa0, 150, 0.45, 'ground', 0.5); }
}
function hitHeat(m: Mote): void {
  const fx = fxOf(m);
  fx.glow(m.x, m.y, 0xff6a3a, 1.5, 0.25);
  for (let i = 0; i < fx.n(2); i++) {
    const f = fx.top.spawn(fx.tex.flame, m.x + rnd(-14, 14), m.y + rnd(-6, 10), 0.35);
    f.curve = Curve.Pop; f.s0 = 0.2; f.s1 = 0.55; f.vy = -60; f.fout = 0.5; f.delay = i * 0.04;
  }
}
/** Souffle glacial : cône de givre depuis la case, les cibles gelées. */
function frostBreath(fx: CombatFx, slot: number, targets: readonly number[]): void {
  const c = fx.host.cell(slot);
  const o = { x: c.x, y: c.y - 30 };
  fx.glow(o.x, o.y, 0xbfefff, 2.2, 0.4);
  targets.forEach((t, i) => {
    const b = fx.body(t);
    if (!b) return;
    fx.beam(o, b, 0xbfefff, 26, 0.4, BeamMode.Grow, t, 0, true, i * 0.04);
    fx.later(t, 0.15 + i * 0.04, hitIce);
    for (let k = 0; k < fx.n(2); k++) {
      const s = fx.shot('snowflake', o, t, 0.3, null);
      s.delay = i * 0.04 + k * 0.08; s.spin = 6; s.s0 = 0.6; s.s1 = 1; s.wob = 14; s.wobF = 1.5;
    }
  });
  fx.host.flash(0.1, 0.3, 0xbfefff);
}
function hitSword(m: Mote): void {
  const fx = fxOf(m);
  const s = fx.put('slash', m.x, m.y, 0.24);
  s.s.tint = 0xfff4c8; s.curve = Curve.Pop; s.s0 = 0.4; s.s1 = 1.05; s.rot = -2.3; s.fout = 0.4;
  fx.ring(m.x, m.y, 0xffd24a, 64, 0.28);
  fx.sparks(m.x, m.y, 0xffe9a0, 4, 320, 0.55);
}
/** Lasso de vérité : la corde dorée part de la case, la boucle se referme et brille. */
function truthLasso(fx: CombatFx, slot: number, targets: readonly number[]): void {
  targets.forEach((t, i) => {
    const b = fx.body(t);
    if (!b) return;
    const o = fx.origin(slot, t);
    fx.beam(o, b, 0xffd24a, 7, 0.75, BeamMode.Extend, t, 0, false, i * 0.05);
    const l = fx.attach('lasso', t, 0.8);
    l.s.tint = 0xffe58a; l.delay = 0.2 + i * 0.05; l.oy = 10; l.curve = Curve.Out; l.s0 = 1.8; l.s1 = 0.9; l.fout = 0.7;
    const g = fx.attach('glow', t, 0.8);
    g.s.tint = 0xffd24a; g.s.blendMode = 'add'; g.delay = 0.2; g.s0 = 1.4; g.s1 = 1.8; g.fout = 0.7;
  });
}
function hitLantern(m: Mote): void {
  const fx = fxOf(m);
  fx.pop(m.x, m.y, 0x4cff7a, 0.8);
  fx.ring(m.x, m.y, 0x4cff7a, 44, 0.25);
  fx.sparks(m.x, m.y, 0xb8ffc8, 3, 260, 0.5);
}
/** Construction : mur d'émeraude sur la ligne de tête. */
function lanternWall(fx: CombatFx, targets: readonly number[]): void {
  targets.forEach((t, i) => {
    const b = fx.body(t);
    if (!b) return;
    const w = fx.attach('square', t, 1.4, 'shots');
    w.s.tint = 0x4cff7a; w.a0 = 0.75; w.curve = Curve.Bounce; w.s0 = 0.4; w.s1 = (fx.width(t) / 118) * 3.6; w.sy = 1.4; w.delay = i * 0.04; w.fout = 0.8;
    fx.glow(b.x, b.y, 0x4cff7a, 2, 0.6);
  });
  fx.host.shake(2, 0.12);
}
function lanternHammer(m: Mote): void {
  const fx = fxOf(m);
  const x = m.x, y = m.y + 30;
  fx.ring(x, y, 0x4cff7a, 140, 0.4, 'ground', 0.5);
  fx.pop(x, y - 30, 0x4cff7a, 1.6, 0.3);
  fx.debris(x, y - 10, 'shard', 0x4cff7a, 6, 520, 0.7);
  fx.glow(x, y - 20, 0x8dffa8, 3, 0.4);
  fx.host.shake(6, 0.25);
  fx.host.flash(0.1, 0.2, 0x4cff7a);
}
function hitSpeed(m: Mote): void {
  const fx = fxOf(m);
  fx.pop(m.x, m.y, 0xffe03a, 0.7, 0.18);
  fx.sparks(m.x, m.y, 0xfff6a0, 4, 360, 0.5, 0.2);
}
/** Tour du chemin : un éclair jaune relie tous les ennemis, d'un bout à l'autre, très vite. */
function flashLap(fx: CombatFx, slot: number, targets: readonly number[]): void {
  const c = fx.host.cell(slot);
  let a: P = { x: c.x, y: c.y - 20 };
  const list = targets.slice(0, fx.n(18));
  list.forEach((t, i) => {
    const b = fx.body(t);
    if (!b) return;
    fx.bolt(a, b, 0xffe03a, 9, 0.3, 0, i * 0.025, t);
    fx.later(t, 0.02 + i * 0.025, hitSpeed);
    a = b;
  });
  fx.bolt(a, { x: c.x, y: c.y - 20 }, 0xffe03a, 9, 0.3, 0, list.length * 0.025);
  fx.host.shake(3, 0.2);
  fx.host.flash(0.08, 0.2, 0xffe03a);
}
/** Kraken : tentacules qui jaillissent du sol sous les ennemis saisis. */
function krakenGrab(fx: CombatFx, targets: readonly number[]): void {
  targets.forEach((t, i) => {
    const f = fx.feet(t);
    if (!f) return;
    for (const k of [-1, 1]) fx.tendril({ x: f.x + k * 50, y: f.y + 30 }, t, 0x2f9fb0, 18, 0.7, i * 0.06 + (k > 0 ? 0.08 : 0));
    fx.debris(f.x, f.y, 'drop', 0x3fd8c0, 6, 420, 0.6);
    fx.ring(f.x, f.y, 0x2f9fb0, 100, 0.45, 'ground', 0.45);
  });
  fx.host.shake(3, 0.2);
}
function hitSonic(m: Mote): void {
  const fx = fxOf(m);
  for (let i = 0; i < 2; i++) fx.ring(m.x, m.y, 0xff6a5a, 40 + i * 30, 0.25 + i * 0.08);
  fx.sparks(m.x, m.y, 0xffb0a0, 3, 300, 0.5);
}
function hitSolarPunch(m: Mote): void {
  const fx = fxOf(m);
  fx.pop(m.x, m.y, 0x5aa0ff, 1, 0.24);
  fx.glow(m.x, m.y, 0xffd34a, 1.4, 0.22);
  fx.ring(m.x, m.y, 0x5aa0ff, 54, 0.26);
  fx.sparks(m.x, m.y, 0xffe9a0, 4, 340, 0.55);
}
/** Éruption solaire : soleil qui grossit sur la case, flammes sur toute la ligne. */
function solarFlare(fx: CombatFx, slot: number, targets: readonly number[]): void {
  const c = fx.host.cell(slot);
  const s = fx.put('glow', c.x, c.y - 30, 0.6);
  s.s.tint = 0xffd34a; s.s.blendMode = 'add'; s.curve = Curve.Out; s.s0 = 1; s.s1 = 4; s.fout = 0.6;
  targets.forEach((t, i) => {
    const b = fx.body(t);
    if (!b) return;
    fx.beam({ x: c.x, y: c.y - 30 }, b, 0xffc83a, 16, 0.3, BeamMode.Flash, t, 0, true, 0.1 + i * 0.02);
    fx.later(t, 0.14 + i * 0.02, hitFire);
  });
  fx.host.shake(5, 0.25);
  fx.host.flash(0.16, 0.3, 0xffd34a);
}
/** Foudre venue du ciel (Shazam, Black Adam). */
function skyBolts(fx: CombatFx, targets: readonly number[], color: number): void {
  targets.forEach((t, i) => {
    const b = fx.body(t);
    if (!b) return;
    fx.bolt({ x: b.x + rnd(-40, 40), y: b.y - 600 }, b, color, 14, 0.34, 2, i * 0.07, t);
    fx.later(t, 0.03 + i * 0.07, hitZapBig, color);
  });
  fx.host.shake(4, 0.2);
  fx.host.flash(0.14, 0.2, color);
}
function hitZapBig(m: Mote): void {
  const fx = fxOf(m);
  fx.pop(m.x, m.y, m.color, 1.3, 0.28);
  fx.glow(m.x, m.y, m.color, 2.2, 0.3);
  fx.sparks(m.x, m.y, m.color, 6, 420, 0.65);
}
function hitStaff(m: Mote): void {
  const fx = fxOf(m);
  fx.pop(m.x, m.y, 0xffb43a, 0.8, 0.2);
  const s = fx.put('slash', m.x, m.y, 0.2);
  s.s.tint = 0xffe0a0; s.curve = Curve.Pop; s.s0 = 0.3; s.s1 = 0.7; s.rot = rnd(-0.4, 0.4); s.fout = 0.4;
}
function hitKickPurple(m: Mote): void {
  const fx = fxOf(m);
  fx.pop(m.x, m.y, 0xb08cff, 0.85, 0.22);
  fx.ring(m.x, m.y, 0xb08cff, 46, 0.24);
  fx.sparks(m.x, m.y, 0xe0d4ff, 3, 280, 0.5);
}
const CONFETTI = [0xff6ab4, 0x5fd6e8, 0xffe14a, 0x8dff6a, 0xff3b3b];
function hitConfetti(m: Mote): void {
  const fx = fxOf(m);
  fx.pop(m.x, m.y, 0xffe27a, 1.2, 0.26);
  for (let i = 0; i < fx.n(10); i++) {
    const a = rnd(0, 6.28);
    const p = fx.top.spawn(fx.tex.square, m.x, m.y, 0.6);
    p.s.tint = CONFETTI[i % CONFETTI.length]!; p.vx = Math.cos(a) * rnd(160, 320); p.vy = Math.sin(a) * rnd(160, 320) - 120; p.grav = 500; p.drag = 2; p.spin = rnd(-12, 12); p.s0 = 0.5; p.s1 = 0.35;
  }
  fx.ring(m.x, m.y, 0xff6ab4, 100, 0.32);
}
function hitPie(m: Mote): void {
  const fx = fxOf(m);
  fx.puffs(m.x, m.y, 0xfff6e8, 4, 0.8, 140, 0.5);
  fx.debris(m.x, m.y, 'drop', 0xfff6e8, 5, 300, 0.5);
  fx.label('SPLAT!', m.x, m.y - fx.width(m.uid) * 0.5, 0xfff6e8, 30);
}
function hitMallet(m: Mote): void {
  const fx = fxOf(m);
  fx.pop(m.x, m.y, 0xff6ab4, 1.3, 0.28);
  for (let i = 0; i < fx.n(3); i++) {
    const a = -Math.PI / 2 + (i - 1) * 0.8;
    const s = fx.top.spawn(fx.tex.stunStar, m.x, m.y - 10, 0.5);
    s.vx = Math.cos(a) * 220; s.vy = Math.sin(a) * 220; s.grav = 600; s.drag = 1.5; s.spin = 8; s.s0 = 0.8; s.s1 = 0.5;
  }
  if (Math.random() < 0.5) fx.label('BAM!', m.x, m.y - fx.width(m.uid) * 0.5, 0xff6ab4, 32);
  fx.host.shake(2, 0.1);
}
function hitOops(m: Mote): void {
  const fx = fxOf(m);
  fx.puffs(m.x, m.y + 20, 0xd8c8b0, 2, 0.5, 60, 0.4);
  fx.label('Oups !', m.x, m.y - fx.width(m.uid) * 0.5, 0xffffff, 26);
}
function hitNet(m: Mote): void {
  const fx = fxOf(m);
  const n = fx.attach('webNet', m.uid, 1, 'shots');
  n.s.tint = 0xd8e0c8; n.curve = Curve.Bounce; n.s0 = 0.2; n.s1 = (fx.width(m.uid) / 118) * 0.9; n.fout = 0.7;
  fx.sparks(m.x, m.y, 0x8be06a, 3, 240, 0.5);
}
/** Salve : les flèches retombent du ciel sur les ennemis de tête. */
function arrowRain(fx: CombatFx, targets: readonly number[]): void {
  targets.forEach((t, i) => {
    const b = fx.body(t);
    if (!b) return;
    const m = fx.shotTo('arrowLong', { x: b.x - 120, y: b.y - 520 }, b, 0.32, hitBullseyeGreen, 0x8be06a);
    m.uid = t; m.face = true; m.ease = Ease.In; m.delay = i * 0.06; m.trail = trStreak; m.trailEvery = 0.02;
  });
}
function hitBullseyeGreen(m: Mote): void {
  const fx = fxOf(m);
  fx.pop(m.x, m.y, 0x8be06a, 0.9, 0.22);
  fx.sparks(m.x, m.y, 0xd8ffc0, 4, 300, 0.5);
}

// ---------------------------------------------------------------- compétences

export function playAbility(fx: CombatFx, slot: number, unit: UnitId, name: string, targets: readonly number[]): void {
  const col = UNIT_FX_COLOR[unit] ?? 0xffffff;
  const c = fx.host.cell(slot);
  const t0 = targets[0];
  switch (unit) {
    case 'strange': {
      // Portail : mandala orange à l'endroit où l'ennemi disparaît, et un second qui le suit au départ.
      fx.cellFlare(slot, col);
      for (const t of targets) {
        const b = fx.body(t);
        if (!b) continue;
        const a = fx.put('mandala', b.x, b.y, 0.9);
        a.curve = Curve.Out; a.s0 = 0.1; a.s1 = 1.15; a.spin = 3; a.sy = 0.8; a.fout = 0.6;
        fx.glow(b.x, b.y, 0xffa53b, 3, 0.5);
        const f = fx.attach('mandala', t, 0.8);
        f.curve = Curve.Out; f.s0 = 0.1; f.s1 = 0.9; f.spin = -3; f.sy = 0.8; f.delay = 0.08; f.fout = 0.55;
        for (let i = 0; i < fx.n(8); i++) {
          const s = fx.put('starCore', b.x, b.y, 0.6);
          s.mode = Mode.Attach; s.uid = -1; s.x0 = b.x; s.y0 = b.y; s.orbR = 70; s.orbW = 9; s.ang = (i / 8) * Math.PI * 2; s.p1 = 0.8;
          s.s.tint = 0xffc070; s.s0 = 0.8; s.s1 = 0.1;
        }
      }
      return;
    }
    case 'falcon': {
      // Drone Redwing : décolle de la case et va verrouiller l'ennemi le plus fort.
      for (const t of targets) {
        const b = fx.body(t);
        if (!b) continue;
        const m = fx.shot('drone', { x: c.x, y: c.y - 50 }, t, 0.55, hitRedwing, 0xff6b5a);
        m.arc = 120; m.ease = Ease.InOut; m.s0 = 0.8; m.s1 = 1.15; m.trail = trGlow; m.trailEvery = 0.03; m.wob = 20; m.wobF = 1;
      }
      fx.glow(c.x, c.y - 40, 0xff6b5a, 1.6, 0.3);
      return;
    }
    case 'moana': {
      fx.cellFlare(slot, col);
      for (const t of targets) {
        const b = fx.body(t);
        if (!b) continue;
        const w = fx.attach('wave', t, 0.8, 'shots');
        w.oy = 30; w.curve = Curve.Bounce; w.s0 = 0.3; w.s1 = 1.1; w.fout = 0.6;
        fx.debris(b.x, b.y + 20, 'drop', 0x5fd6e8, 6, 460, 0.6);
        fx.puffs(b.x, b.y + 30, 0xffffff, 3, 0.8, 140, 0.5);
        const f = fx.feet(t);
        if (f) fx.ring(f.x, f.y, 0x5fd6e8, 100, 0.45, 'ground', 0.45);
      }
      return;
    }
    case 'ariel': {
      fx.cellFlare(slot, 0x5fe0d0);
      targets.forEach((t, j) => {
        const b = fx.body(t);
        if (!b) return;
        const o = fx.origin(slot, t);
        const d = fx.travel(o, b, 1200, 0.25, 0.5);
        for (let i = 0; i < 3; i++) {
          const m = fx.shot('note', o, t, d, i === 0 ? hitSong : null);
          m.s.tint = (i + j) % 2 ? 0xff7ac8 : 0x5fe0d0; m.arc = 50; m.wob = 18; m.wobF = 1; m.p1 = i * 2; m.delay = j * 0.06 + i * 0.07; m.spin = 3;
        }
      });
      return;
    }
    case 'tiana': {
      if (name === 'Restaurant') {
        // Mana de début de vague : pièces qui jaillissent.
        fx.glow(c.x, c.y, 0xf6c64a, 2.2, 0.4, 'ground');
        for (let i = 0; i < fx.n(6); i++) {
          const m = fx.put('coin', c.x + rnd(-30, 30), c.y - 20, 0.7);
          m.vx = rnd(-160, 160); m.vy = rnd(-520, -360); m.grav = 1300; m.s0 = m.s1 = 0.9; m.sx = 1; m.spin = rnd(-4, 4); m.delay = i * 0.04;
        }
        return;
      }
      // Langue de Naveen : la langue rose attrape l'ennemi de tête et le tire en arrière.
      if (t0 === undefined || !fx.body(t0)) return;
      const o = fx.origin(slot, t0);
      fx.beam(o, fx.body(t0)!, 0xff7aa8, 13, 0.6, BeamMode.Extend, t0, 0);
      const tip = fx.attach('dotInk', t0, 0.5);
      tip.s.tint = 0xff7aa8; tip.s0 = tip.s1 = 1.4; tip.delay = 0.14;
      fx.later(t0, 0.16, hitGeneric, 0xff7aa8);
      fx.glow(c.x, c.y, 0x8be04a, 1.8, 0.4, 'ground');
      return;
    }
    case 'nickjudy': {
      fx.cellFlare(slot, 0x5aa0ff);
      for (const t of targets) {
        const k = fx.width(t) / 118;
        const cu = fx.attach('cuffs', t, 2);
        cu.curve = Curve.Out; cu.s0 = 2.4 * k; cu.s1 = 1.05 * k; cu.oy = 6; cu.spin = 0; cu.rot = -0.2; cu.fout = 0.88;
        for (let i = 0; i < 2; i++) {
          const g = fx.attach('glow', t, 2);
          g.s.tint = i ? 0x3b6bff : 0xff3b3b; g.s.blendMode = 'add'; g.orbR = 52; g.orbW = 9; g.ang = i * Math.PI; g.oy = -40; g.s0 = g.s1 = 0.9; g.fout = 0.85;
        }
        const b = fx.body(t);
        if (b) fx.ring(b.x, b.y, 0x5aa0ff, 80, 0.35);
      }
      return;
    }
    case 'buzzwoody': {
      // Lasso de Woody : la corde part de la case, la boucle se referme et ramène l'ennemi.
      if (t0 === undefined || !fx.body(t0)) return;
      const o = fx.origin(slot, t0);
      fx.beam(o, fx.body(t0)!, 0xc8904a, 7, 0.75, BeamMode.Extend, t0, 0, false);
      const l = fx.attach('lasso', t0, 0.6);
      l.delay = 0.2; l.oy = 18; l.curve = Curve.Out; l.s0 = 1.8; l.s1 = 0.9; l.fout = 0.7;
      fx.later(t0, 0.22, hitGeneric, 0xc8904a);
      return;
    }
    case 'vanralph': {
      // Glitch : la case de départ se pixelise, les pixels se rassemblent sur la nouvelle case.
      const from = t0 !== undefined ? fx.host.cell(t0) : c;
      const cols = [0x5fe8ff, 0xff5aa8, 0xffe14a, 0x8dff6a];
      for (let i = 0; i < fx.n(12); i++) {
        const a = fx.put('square', from.x + rnd(-50, 50), from.y + rnd(-50, 50), 0.45);
        a.s.tint = cols[i % 4]!; a.vx = rnd(-200, 200); a.vy = rnd(-260, 60); a.drag = 3; a.s0 = rnd(0.6, 1.1); a.s1 = 0;
        const b = fx.shotTo('square', { x: c.x + rnd(-110, 110), y: c.y + rnd(-110, 110) }, { x: c.x + rnd(-20, 20), y: c.y + rnd(-20, 20) }, 0.3);
        b.s.tint = cols[(i + 1) % 4]!; b.ease = Ease.In; b.s0 = 0.4; b.s1 = 1; b.delay = 0.12 + i * 0.015; b.fout = 0.6;
      }
      for (const [dx, cc] of [[-14, 0xff3bd0], [14, 0x3bf0ff]] as const) fx.glow(c.x + dx, c.y, cc, 1.5, 0.3, 'ground').delay = 0.25;
      fx.ring(c.x, c.y, 0xff5a7a, 90, 0.35);
      return;
    }
    case 'cmarvel': {
      // Mode binaire : aura dorée pendant 5 s autour de la case.
      fx.cellFlare(slot, 0xffd34a);
      const a = fx.put('glow', c.x, c.y, 5, 'ground');
      a.s.tint = 0xffc83a; a.s.blendMode = 'add'; a.curve = Curve.Pulse; a.s0 = 2.3; a.s1 = 2.8; a.fin = 0.03; a.fout = 0.9;
      const r = fx.put('ringInk', c.x, c.y, 5, 'ground');
      r.s.tint = 0xffd34a; r.curve = Curve.Pulse; r.s0 = 1.75; r.s1 = 1.9; r.a0 = 0.8; r.fin = 0.03; r.fout = 0.9; r.sy = 1;
      const e = fx.put('spark', c.x, c.y, 5, 'ground');
      e.a0 = 0; e.color = 0xffe27a; e.trail = trRise; e.trailEvery = 0.12;
      fx.host.flash(0.1, 0.25, 0xffd34a);
      return;
    }
    case 'loki': {
      if (targets.length) {
        for (const t of targets) {
          const s = fx.attach('spiral', t, 0.6);
          s.s.tint = 0x7fe08a; s.curve = Curve.Out; s.s0 = 0.3; s.s1 = 1.3; s.spin = -10; s.fout = 0.5;
          const b = fx.body(t);
          if (b) fx.puffs(b.x, b.y, 0x7fe08a, 4, 0.7, 140, 0.45);
        }
        return;
      }
      // Transformation : volute verte et fumée sur la case.
      const s = fx.put('spiral', c.x, c.y, 0.6);
      s.s.tint = 0x7fe08a; s.curve = Curve.Out; s.s0 = 0.4; s.s1 = 2.2; s.spin = 10; s.fout = 0.5;
      fx.puffs(c.x, c.y, 0x7fe08a, 6, 1, 200, 0.5);
      fx.sparks(c.x, c.y, 0xc8ffd0, 6, 300, 0.6);
      return;
    }
    case 'maui': {
      // Métamorphose : l'hameçon tournoie autour de Maui, l'icône de la forme apparaît.
      const shark = name.includes('requin');
      const h = fx.put('hook', c.x, c.y, 0.45, 'shots');
      h.mode = Mode.Attach; h.uid = -1; h.x0 = c.x; h.y0 = c.y; h.orbR = 70; h.orbW = 15; h.p1 = 0.7; h.spin = 15; h.s0 = h.s1 = 1.3; h.fout = 0.7;
      const s = fx.put('slash', c.x, c.y, 0.3);
      s.s.tint = 0x4fd1b5; s.curve = Curve.Out; s.s0 = 0.6; s.s1 = 2.1; s.spin = 12; s.fout = 0.4;
      // Pastille de la forme (aileron de requin ou plume de faucon) au-dessus de Maui.
      const bg = fx.put('dotInk', c.x, c.y - 96, 0.8);
      bg.s.tint = 0x4fd1b5; bg.curve = Curve.Pop; bg.s0 = 0.3; bg.s1 = 2.3; bg.vy = -40; bg.delay = 0.12; bg.fout = 0.7;
      const i = fx.put(shark ? 'sharkFin' : 'feather', c.x, c.y - 98, 0.8);
      i.curve = Curve.Pop; i.s0 = 0.2; i.s1 = shark ? 0.8 : 1; i.rot = shark ? 0 : -0.6; i.vy = -40; i.delay = 0.12; i.fout = 0.7;
      fx.glow(c.x, c.y, 0x4fd1b5, 2.4, 0.4, 'ground');
      for (const t of targets) fx.later(t, 0.1, hitGeneric, 0x4fd1b5);
      return;
    }
    case 'spiderman': {
      // Toile collante (3 cumuls) : cocon de toile qui immobilise.
      for (const t of targets) {
        const k = fx.width(t) / 118;
        for (let i = 0; i < 2; i++) {
          const n = fx.attach('webNet', t, 1.1, 'shots');
          n.curve = Curve.Bounce; n.s0 = 0.2; n.s1 = (i ? 0.85 : 1.15) * k; n.rot = i * 0.4; n.a0 = i ? 0.9 : 1; n.fout = 0.75;
        }
        const b = fx.body(t);
        if (b) fx.ring(b.x, b.y, 0xf4f2fa, 80, 0.32);
      }
      return;
    }
    case 'coco': {
      // Remember Me : tourbillon de pétales de cempasúchil et colonne dorée.
      fx.cellFlare(slot, 0xffd16a);
      const g = fx.put('glow', c.x, c.y - 60, 1, 'top');
      g.s.tint = 0xffc23a; g.s.blendMode = 'add'; g.sx = 0.6; g.sy = 2.6; g.s0 = 1.2; g.s1 = 1.6; g.fout = 0.5;
      for (let i = 0; i < fx.n(12); i++) {
        const p = fx.put('petal', c.x, c.y, 1);
        p.mode = Mode.Attach; p.uid = -1; p.x0 = c.x; p.y0 = c.y; p.orbR = 76; p.orbW = 7; p.ang = (i / 12) * Math.PI * 2; p.p1 = 0.55; p.oy = -i * 6;
        p.s.tint = i % 2 ? 0xff9a1f : 0xffc23a; p.spin = 6; p.s0 = 0.9; p.s1 = 0.5; p.fout = 0.6;
      }
      const f = fx.put('marigold', c.x, c.y - 80, 0.9);
      f.curve = Curve.Pop; f.s0 = 0.3; f.s1 = 1.8; f.spin = 2; f.fout = 0.7;
      return;
    }
    // ───────────── Extension DC ─────────────
    case 'flash': {
      if (name === 'Tour du chemin') { fx.cellFlare(slot, 0xffe03a); return; }
      // Échangeur : Flash file de son ancienne case à la nouvelle dans un éclair.
      const from = t0 !== undefined ? fx.host.cell(t0) : c;
      fx.bolt({ x: from.x, y: from.y - 20 }, { x: c.x, y: c.y - 20 }, 0xffe03a, 12, 0.35, 1);
      for (let i = 0; i < fx.n(6); i++) {
        const k = i / 5;
        const s = fx.put('streak', from.x + (c.x - from.x) * k, from.y + (c.y - from.y) * k - 20, 0.3);
        s.s.tint = 0xffe03a; s.s.blendMode = 'add'; s.rot = Math.atan2(c.y - from.y, c.x - from.x); s.delay = i * 0.03; s.s0 = 1.2; s.s1 = 0.3;
      }
      fx.glow(c.x, c.y, 0xffe03a, 2.2, 0.4, 'ground');
      fx.ring(c.x, c.y, 0xffe03a, 90, 0.35);
      return;
    }
    case 'cyborg': {
      // Surcharge système : onde rouge sur la case, impulsions sur tout le plateau.
      fx.cellFlare(slot, 0xff3a3a);
      fx.ring(c.x, c.y, 0xff3a3a, 160, 0.5, 'ground', 0.6);
      for (let i = 0; i < 15; i++) {
        const k = fx.host.cell(i);
        const g = fx.put('glow', k.x, k.y, 0.5, 'ground');
        g.s.tint = 0xff5a4a; g.s.blendMode = 'add'; g.curve = Curve.Pulse; g.s0 = 1.2; g.s1 = 1.6; g.delay = 0.05 + Math.hypot(k.x - c.x, k.y - c.y) / 2400; g.fout = 0.6;
      }
      return;
    }
    case 'martian': {
      for (const t of targets) {
        const s = fx.attach('spiral', t, 0.8);
        s.s.tint = 0x6fe07a; s.curve = Curve.Out; s.s0 = 0.3; s.s1 = 1.2; s.spin = -8; s.fout = 0.6;
        const b = fx.body(t);
        if (b) fx.glow(b.x, b.y, 0x6fe07a, 2, 0.5);
      }
      fx.glow(c.x, c.y - 30, 0x6fe07a, 2, 0.4);
      return;
    }
    case 'batgirl': {
      // Piratage d'Oracle : pixels violets et bouclier fêlé sur la cible.
      for (const t of targets) {
        const b = fx.body(t);
        if (!b) continue;
        for (let i = 0; i < fx.n(8); i++) {
          const p = fx.shotTo('square', { x: c.x + rnd(-30, 30), y: c.y - 30 }, { x: b.x + rnd(-30, 30), y: b.y + rnd(-30, 30) }, 0.35);
          p.s.tint = i % 2 ? 0xb08cff : 0x5fe8ff; p.ease = Ease.InOut; p.delay = i * 0.025; p.s0 = 0.6; p.s1 = 0.4; p.fout = 0.5;
        }
        const s = fx.attach('crackShield', t, 0.7);
        s.delay = 0.3; s.curve = Curve.Pop; s.s0 = 0.4; s.s1 = 1.2; s.oy = -40; s.fout = 0.6;
      }
      return;
    }
    case 'shazam': {
      // SHAZAM ! : la foudre frappe Billy, qui se transforme.
      fx.bolt({ x: c.x + rnd(-30, 30), y: c.y - 700 }, { x: c.x, y: c.y - 10 }, 0xfff27a, 18, 0.4, 2);
      fx.pop(c.x, c.y - 20, 0xfff27a, 1.6, 0.3);
      fx.glow(c.x, c.y, 0xfff27a, 3, 0.5, 'ground');
      fx.host.flash(0.18, 0.25, 0xfff27a);
      return;
    }
    // Compétences déjà portées par l'attaque (Uni-Beam, Smash, Dévorer, Bras bionique, Morsure, Dix Anneaux, Avalanche) :
    default:
      fx.cellFlare(slot, col);
  }
}

// ---------------------------------------------------------------- pouvoirs de boss

const BOSS_COLOR: Record<BossId, number> = {
  jafar: 0xc06aff, cruella: 0x8fcf3a, ursula: 0x9a5ad0, malefique: 0x6fe07a, galactus: 0xb07aff, bouffon: 0xff8a1f, thanos: 0xf6c64a,
  joker: 0x5fd068, luthor: 0x5fff6a, bane: 0xc8a070, sinestro: 0xffe03a, blackadam: 0xffd34a, darkseid: 0xff3b3b,
};

function bossLand(m: Mote): void {
  const fx = fxOf(m);
  const x = m.x, y = m.y, col = m.color;
  switch (m.p0) {
    case 0: { // Jafar : spirale hypnotique
      const s = fx.put('spiral', x, y, 0.9);
      s.s.tint = col; s.curve = Curve.Out; s.s0 = 0.3; s.s1 = 1.9; s.spin = -9; s.fout = 0.6;
      break;
    }
    case 1: // Cruella : fumée verdâtre
    case 2: // Ursula : encre
      fx.puffs(x, y, m.p0 === 1 ? 0x5a6a3a : 0x3a2a5a, 6, 1.1, 180, 0.7);
      if (m.p0 === 2) for (let i = 0; i < fx.n(4); i++) { const b = fx.put('bubble', x + rnd(-40, 40), y, 0.6); b.vy = rnd(-200, -100); b.s0 = 0.6; b.s1 = 0.9; }
      break;
    case 3: // Maléfique : brume verte
      fx.puffs(x, y, 0x6fe07a, 5, 1, 140, 0.8);
      fx.glow(x, y, 0x6fe07a, 2.5, 0.6);
      break;
    case 4: // Galactus : déflagration cosmique
      fx.debris(x, y, 'shard', 0xb07aff, 7, 480, 0.8);
      fx.glow(x, y, 0xb07aff, 3, 0.5);
      break;
    case 5: // Bouffon : citrouille qui explose
      fx.pop(x, y, 0xff8a1f, 1.5, 0.32);
      fx.puffs(x, y, 0x5a4a5a, 5, 1, 180, 0.6);
      fx.sparks(x, y, 0xffc040, 7, 460, 0.7);
      fx.host.shake(4, 0.2);
      break;
    default: { // Thanos : gemme
      const g = fx.put('gem', x, y - 40, 0.7);
      g.s.tint = col; g.curve = Curve.Pop; g.s0 = 0.4; g.s1 = 2; g.vy = -40; g.fout = 0.6;
      fx.glow(x, y, col, 2.6, 0.5);
    }
  }
  fx.ring(x, y, col, 96, 0.42);
}

export function playBossPower(fx: CombatFx, boss: BossId, slots: readonly number[], name: string): void {
  let col = BOSS_COLOR[boss] ?? 0xc0263a;
  const snap = name === SNAP_NAME;
  const stone = THANOS_STONES.find((s) => s.name === name);
  if (stone) col = Number.parseInt(stone.color.slice(1), 16);
  // Source : le boss (ou son lieutenant) s'il est visible.
  let src: P | null = null;
  for (const e of fx.host.enemies()) {
    if (e.enemy.bossId === boss || (e.enemy.minionOf === boss && e.enemy.giant)) { src = { x: e.x, y: e.y - e.width * 0.45 }; break; }
  }
  if (src) {
    fx.glow(src.x, src.y, col, 3.2, 0.5);
    fx.ring(src.x, src.y, col, 140, 0.45);
  }
  if (DC_BOSSES.includes(boss)) { dcBossPower(fx, boss, src, slots, name, col); return; }
  const code = ['jafar', 'cruella', 'ursula', 'malefique', 'galactus', 'bouffon'].indexOf(boss);
  const tex = boss === 'bouffon' ? 'pumpkin' : boss === 'jafar' ? 'spiral' : boss === 'thanos' ? 'gem' : boss === 'ursula' ? 'bubble' : 'glow';
  slots.forEach((s, i) => {
    const c = fx.host.cell(s);
    if (snap) {
      // Claquement de doigts : l'unité se désagrège en poussière dorée.
      fx.glow(c.x, c.y, 0xf6c64a, 2.6, 0.5, 'ground');
      for (let k = 0; k < fx.n(10); k++) {
        const p = fx.put('puff', c.x + rnd(-50, 50), c.y + rnd(-50, 40), 0.9);
        p.s.tint = 0xc8a070; p.vx = rnd(40, 160); p.vy = rnd(-140, -40); p.drag = 1; p.s0 = rnd(0.3, 0.6); p.s1 = 0.05; p.delay = k * 0.03;
      }
      return;
    }
    if (!src) { const m = fx.put('spark', c.x, c.y, 0.01); m.a0 = 0; m.p0 = code < 0 ? 6 : code; m.color = col; m.end = bossLand; return; }
    const m = fx.shotTo(tex, src, c, fx.travel(src, c, 1600, 0.3, 0.55), bossLand, col);
    m.p0 = code < 0 ? 6 : code; m.arc = 80; m.delay = i * 0.08; m.spin = 6;
    if (tex === 'glow' || tex === 'gem') { m.s.tint = col; if (tex === 'glow') { m.s.blendMode = 'add'; m.s0 = m.s1 = 1.4; } }
    m.trail = trGlow; m.trailEvery = 0.03;
  });
  if (snap) fx.host.flash(0.35, 0.4, 0xf6c64a);
}

// ---------------------------------------------------------------- extension DC : pouvoirs des boss

const DC_BOSSES: readonly BossId[] = ['joker', 'luthor', 'bane', 'sinestro', 'blackadam', 'darkseid'];

function dcBossLand(m: Mote): void {
  const fx = fxOf(m);
  const x = m.x, y = m.y, col = m.color;
  switch (m.p0) {
    case 0: { // Joker : carte qui explose en confettis, rire
      fx.pop(x, y, 0x8a3fd0, 1.2, 0.28);
      for (let i = 0; i < fx.n(8); i++) {
        const a = rnd(0, 6.28);
        const p = fx.top.spawn(fx.tex.square, x, y, 0.6);
        p.s.tint = i % 2 ? 0x8a3fd0 : 0x5fd068; p.vx = Math.cos(a) * 260; p.vy = Math.sin(a) * 260 - 100; p.grav = 500; p.drag = 2; p.spin = rnd(-10, 10); p.s0 = 0.5; p.s1 = 0.3;
      }
      fx.label('HA HA!', x, y - 70, 0x5fd068, 30);
      break;
    }
    case 1: // Lex Luthor : la kryptonite irradie
      fx.glow(x, y, 0x5fff6a, 2.6, 0.6, 'ground');
      fx.debris(x, y, 'gem', 0x5fff6a, 5, 380, 0.6);
      break;
    case 2: // Bane : le sol se fissure sous l'unité
    {
      const cr = fx.put('crack', x, y + 20, 0.9, 'ground');
      cr.curve = Curve.Out; cr.s0 = 0.4; cr.s1 = 0.8; cr.sy = 0.55; cr.fout = 0.6;
      fx.debris(x, y, 'brick', 0xffffff, 5, 460, 0.8);
      fx.puffs(x, y + 10, 0xd8c8b0, 4, 0.9, 160, 0.5);
      fx.host.shake(5, 0.2);
      break;
    }
    case 3: { // Sinestro : cage jaune de la peur
      const r = fx.put('ringInk', x, y, 2, 'shots');
      r.s.tint = 0xffe03a; r.curve = Curve.Pulse; r.s0 = 1.1; r.s1 = 1.25; r.sy = 1.2; r.fout = 0.85;
      for (const dx of [-36, -12, 12, 36]) {
        const b = fx.put('streak', x + dx, y, 2, 'shots');
        b.s.tint = 0xffe03a; b.rot = Math.PI / 2; b.s0 = b.s1 = 1.6; b.sy = 0.5; b.fout = 0.85;
      }
      fx.glow(x, y, 0xffe03a, 2.2, 0.5);
      break;
    }
    case 4: // Black Adam : impact de foudre dorée
      fx.pop(x, y, 0xffd34a, 1.4, 0.3);
      fx.sparks(x, y, 0xfff27a, 6, 420, 0.6);
      break;
    default: { // Darkseid : Oméga
      const o = fx.put('omega', x, y - 30, 0.8);
      o.curve = Curve.Pop; o.s0 = 0.3; o.s1 = 1.6; o.vy = -30; o.fout = 0.6;
      fx.glow(x, y, 0xff3b3b, 2.6, 0.5);
    }
  }
  fx.ring(x, y, col, 96, 0.42);
}

function dcBossPower(fx: CombatFx, boss: BossId, src: P | null, slots: readonly number[], name: string, col: number): void {
  const code = DC_BOSSES.indexOf(boss);
  if (name === ANTI_LIFE_NAME) {
    // Équation d'Anti-Vie : le plateau s'assombrit, des oméga partout.
    fx.host.flash(0.45, 0.6, 0x1d0a10);
    fx.host.shake(6, 0.4);
  }
  if (name === BOOM_TUBE_NAME && src) {
    // Boom Tube : grand anneau blanc et bleu d'où jaillissent les Parademons.
    for (let i = 0; i < 3; i++) fx.ring(src.x, src.y, i % 2 ? 0x9fd8ff : 0xffffff, 120 + i * 50, 0.5 + i * 0.1);
    fx.glow(src.x, src.y, 0x9fd8ff, 4, 0.6);
    fx.host.flash(0.15, 0.3, 0x9fd8ff);
    return;
  }
  slots.forEach((s, i) => {
    const c = fx.host.cell(s);
    if (boss === 'blackadam') {
      fx.bolt({ x: c.x + rnd(-40, 40), y: c.y - 700 }, c, 0xffd34a, 16, 0.38, 2, i * 0.08);
      const m = fx.put('spark', c.x, c.y, 0.01); m.a0 = 0; m.p0 = code; m.color = col; m.delay = i * 0.08; m.end = dcBossLand;
      return;
    }
    if ((boss === 'luthor' || boss === 'darkseid') && src) {
      // Rayon de kryptonite (vert) ou Rayons Oméga (rouges, en zigzag) depuis le boss.
      if (boss === 'darkseid') fx.bolt(src, c, 0xff3b3b, 14, 0.4, 1, i * 0.1);
      else fx.beam(src, c, 0x5fff6a, 16, 0.4, BeamMode.Grow, -1, 0, true, i * 0.1);
      const m = fx.put('spark', c.x, c.y, 0.01); m.a0 = 0; m.p0 = code; m.color = col; m.delay = 0.2 + i * 0.1; m.end = dcBossLand;
      return;
    }
    if (!src) { const m = fx.put('spark', c.x, c.y, 0.01); m.a0 = 0; m.p0 = code; m.color = col; m.end = dcBossLand; return; }
    const tex = boss === 'joker' ? 'card' : boss === 'bane' ? 'fist' : boss === 'darkseid' ? 'omega' : 'glow';
    const m = fx.shotTo(tex, src, c, fx.travel(src, c, 1600, 0.3, 0.55), dcBossLand, col);
    m.p0 = code; m.arc = boss === 'bane' ? 160 : 80; m.delay = i * 0.08; m.spin = boss === 'joker' ? 10 : 0; m.face = boss === 'bane';
    if (tex === 'glow') { m.s.tint = col; m.s.blendMode = 'add'; m.s0 = m.s1 = 1.4; }
    m.trail = trGlow; m.trailEvery = 0.03;
  });
}
