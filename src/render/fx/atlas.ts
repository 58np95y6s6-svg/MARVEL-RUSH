// Atlas des effets de combat : toutes les formes (projectiles, impacts, icônes d'état) sont dessinées
// une seule fois en Graphics, rangées sur une seule texture (un seul lot de rendu), puis découpées.
// Style des planches : contour épais #1d1733, couleurs saturées, reflets blancs.
// Les formes « teintables » sont blanches (ombre gris clair) : la teinte du sprite leur donne leur couleur
// tandis que le contour reste sombre.
import { Container, Graphics, Rectangle, Texture, type Renderer } from 'pixi.js';

export const INK = 0x1d1733;
const W = 0xffffff;
const SHADE = 0xd2d0e0;

type Draw = (g: Graphics) => void;

/** Points d'une étoile. */
function starPts(n: number, R: number, r: number, rot = -Math.PI / 2): number[] {
  const p: number[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i * Math.PI) / n;
    const k = i % 2 ? r : R;
    p.push(Math.cos(a) * k, Math.sin(a) * k);
  }
  return p;
}

/** Générateur pseudo-aléatoire déterministe (formes irrégulières reproductibles). */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// ---------------------------------------------------------------- formes

const D = {
  // --- génériques teintables
  glow: (g) => { for (let i = 9; i >= 1; i--) g.circle(0, 0, i * 4).fill({ color: W, alpha: 0.07 + (9 - i) * 0.035 }); },
  spark: (g) => { g.circle(0, 0, 9).fill(W); },
  streak: (g) => { g.roundRect(-28, -5, 56, 10, 5).fill(W); },
  sparkInk: (g) => { g.roundRect(-20, -5, 40, 10, 5).fill(W).stroke({ color: INK, width: 3.5 }); },
  dotInk: (g) => { g.circle(0, 0, 10).fill(W).stroke({ color: INK, width: 3.5 }); g.circle(-3, -3, 3).fill({ color: W }); },
  ring: (g) => { g.circle(0, 0, 40).stroke({ color: W, width: 6 }); },
  ringInk: (g) => { g.circle(0, 0, 40).stroke({ color: INK, width: 13 }); g.circle(0, 0, 40).stroke({ color: W, width: 6 }); },
  starInk: (g) => { g.poly(starPts(8, 28, 12)).fill(W).stroke({ color: INK, width: 4, join: 'round' }); },
  starCore: (g) => { g.poly(starPts(8, 15, 6, -Math.PI / 2 + 0.3)).fill(W); },
  puff: (g) => {
    const c: [number, number, number][] = [[-12, 4, 12], [0, -6, 15], [13, 3, 12], [2, 8, 11]];
    for (const [x, y, r] of c) g.circle(x, y, r + 3).fill(INK);
    for (const [x, y, r] of c) g.circle(x, y, r).fill(W);
    g.circle(-2, -10, 5).fill({ color: W });
    g.circle(6, 9, 7).fill({ color: SHADE });
  },
  shard: (g) => { g.poly([-9, -11, 14, 0, -6, 10, -2, 0]).fill(W).stroke({ color: INK, width: 3, join: 'round' }); g.poly([-6, -6, 8, 0, -2, -1]).fill(SHADE); },
  square: (g) => { g.rect(-9, -9, 18, 18).fill(W).stroke({ color: INK, width: 3 }); g.rect(-6, -6, 6, 6).fill(W); },
  beam: (g) => { g.roundRect(-32, -12, 64, 24, 12).fill(W).stroke({ color: INK, width: 4.5 }); },
  beamCore: (g) => { g.roundRect(-32, -6, 64, 12, 6).fill(W); },
  slash: (g) => {
    const p: number[] = [];
    for (let i = 0; i <= 12; i++) { const a = -1.15 + (i / 12) * 2.3; p.push(Math.cos(a) * 44, Math.sin(a) * 44); }
    for (let i = 12; i >= 0; i--) { const a = -1.0 + (i / 12) * 2.0; p.push(Math.cos(a) * 30 + 4, Math.sin(a) * 34); }
    g.poly(p).fill(W).stroke({ color: INK, width: 3.5, join: 'round' });
  },
  note: (g) => {
    const parts = (c: number, grow: number) => {
      g.ellipse(-5, 12, 9 + grow, 7 + grow).fill(c);
      g.rect(1 - grow, -16 - grow, 5 + grow * 2, 29 + grow).fill(c);
      g.poly([3, -16 - grow, 15 + grow, -9, 15 + grow, -2 + grow, 3, -8]).fill(c);
    };
    parts(INK, 3); parts(W, 0);
    g.ellipse(-7, 10, 3, 2).fill(SHADE);
  },
  petal: (g) => { g.moveTo(0, -16).bezierCurveTo(10, -8, 10, 8, 0, 14).bezierCurveTo(-10, 8, -10, -8, 0, -16).fill(W).stroke({ color: INK, width: 3 }); g.moveTo(0, -10).lineTo(0, 9).stroke({ color: SHADE, width: 2 }); },
  leaf: (g) => {
    g.moveTo(-16, 0).quadraticCurveTo(0, -12, 16, 0).quadraticCurveTo(0, 12, -16, 0).fill(W).stroke({ color: INK, width: 3 });
    g.moveTo(-12, 0).lineTo(12, 0).stroke({ color: SHADE, width: 2 });
    g.moveTo(-2, 0).lineTo(4, -5).stroke({ color: SHADE, width: 1.6 });
    g.moveTo(-6, 0).lineTo(0, 5).stroke({ color: SHADE, width: 1.6 });
  },
  drop: (g) => {
    g.moveTo(-16, 0).bezierCurveTo(-6, -6, 0, -10, 6, -10).arc(6, 0, 10, -Math.PI / 2, Math.PI / 2).bezierCurveTo(0, 10, -6, 6, -16, 0).fill(W).stroke({ color: INK, width: 3 });
    g.ellipse(9, -4, 3.5, 2.5).fill(W);
    g.ellipse(6, 5, 6, 3).fill(SHADE);
  },
  spiral: (g) => {
    const pts: number[] = [];
    for (let i = 0; i <= 60; i++) { const a = i * 0.32, r = 2 + i * 0.6; pts.push(Math.cos(a) * r, Math.sin(a) * r); }
    const path = () => { g.moveTo(pts[0]!, pts[1]!); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i]!, pts[i + 1]!); };
    path(); g.stroke({ color: INK, width: 8, cap: 'round', join: 'round' });
    path(); g.stroke({ color: W, width: 3.5, cap: 'round', join: 'round' });
  },
  gem: (g) => { g.poly([0, -14, 10, -3, 0, 14, -10, -3]).fill(W).stroke({ color: INK, width: 3, join: 'round' }); g.poly([0, -14, 4, -3, 0, 2, -4, -3]).fill(SHADE); g.circle(-3, -5, 2).fill(W); },
  bolt: (g) => { g.poly([4, -16, -8, 2, -1, 2, -5, 16, 9, -3, 1, -3]).fill(W).stroke({ color: INK, width: 3, join: 'round' }); },

  // --- Iron Man
  repulsor: (g) => { g.circle(0, 0, 14).fill(0x7fe3ff).stroke({ color: INK, width: 3.5 }); g.circle(0, 0, 8).fill(0xd8fbff); g.circle(-3, -3, 3.5).fill(W); },
  // --- Spider-Man
  webBlob: (g) => {
    g.circle(0, 0, 12).fill(0xf4f2fa).stroke({ color: INK, width: 3.5 });
    for (let i = 0; i < 3; i++) { const a = (i * Math.PI) / 3; g.moveTo(Math.cos(a) * -10, Math.sin(a) * -10).lineTo(Math.cos(a) * 10, Math.sin(a) * 10).stroke({ color: 0xb5b0d0, width: 1.8 }); }
  },
  webNet: (g) => {
    const R = [14, 28, 42], n = 8;
    const path = () => {
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; g.moveTo(0, 0).lineTo(Math.cos(a) * 50, Math.sin(a) * 50); }
      for (const r of R) for (let i = 0; i < n; i++) {
        const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, am = (a0 + a1) / 2;
        g.moveTo(Math.cos(a0) * r, Math.sin(a0) * r).quadraticCurveTo(Math.cos(am) * r * 0.8, Math.sin(am) * r * 0.8, Math.cos(a1) * r, Math.sin(a1) * r);
      }
    };
    path(); g.stroke({ color: INK, width: 5.5, cap: 'round' });
    path(); g.stroke({ color: 0xf8f6ff, width: 2.4, cap: 'round' });
  },
  // --- Hulk
  boulder: (g) => {
    const r = rng(7), p: number[] = [];
    for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2, k = 15 + r() * 6; p.push(Math.cos(a) * k, Math.sin(a) * k); }
    g.poly(p).fill(0x9c8a78).stroke({ color: INK, width: 3.5, join: 'round' });
    g.poly([-12, 6, 8, 12, 16, 2, 4, 6]).fill(0x7a6858);
    g.poly([-8, -10, -2, -14, 2, -8]).fill(0xd8ccb8);
    g.circle(6, -4, 3).fill(0x7ed957);
  },
  crack: (g) => {
    const r = rng(11);
    const lines: number[][] = [];
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + r() * 0.5;
      const pts = [0, 0];
      let x = 0, y = 0;
      const L = 60 + r() * 40;
      for (let s = 1; s <= 4; s++) { const d = (L * s) / 4, j = (r() - 0.5) * 0.7; x = Math.cos(a + j) * d; y = Math.sin(a + j) * d; pts.push(x, y); }
      lines.push(pts);
      if (i % 2 === 0) { const bx = pts[4]!, by = pts[5]!; lines.push([bx, by, bx + Math.cos(a + 0.9) * 26, by + Math.sin(a + 0.9) * 26]); }
    }
    const path = () => { for (const p of lines) { g.moveTo(p[0]!, p[1]!); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i]!, p[i + 1]!); } };
    path(); g.stroke({ color: INK, width: 9, cap: 'round', join: 'round' });
    path(); g.stroke({ color: 0x7ed957, width: 3.5, cap: 'round', join: 'round' });
  },
  // --- Doctor Strange
  rune: (g) => {
    g.circle(0, 0, 15).fill({ color: 0xffa53b, alpha: 0.35 }).stroke({ color: INK, width: 7 });
    g.circle(0, 0, 15).stroke({ color: 0xffa53b, width: 3.5 });
    g.circle(0, 0, 9).stroke({ color: 0xffe0a0, width: 2 });
    g.poly([0, -9, 9, 0, 0, 9, -9, 0]).stroke({ color: 0xffe0a0, width: 2 });
    g.circle(0, 0, 3).fill(W);
  },
  mandala: (g) => {
    g.circle(0, 0, 64).fill({ color: 0xffa53b, alpha: 0.18 });
    for (const [r, w] of [[64, 6], [50, 3.5]] as const) { g.circle(0, 0, r).stroke({ color: INK, width: w + 5 }); g.circle(0, 0, r).stroke({ color: 0xffa53b, width: w }); }
    const sq = (rot: number) => { const p: number[] = []; for (let i = 0; i < 4; i++) { const a = rot + (i * Math.PI) / 2; p.push(Math.cos(a) * 48, Math.sin(a) * 48); } return p; };
    g.poly(sq(0)).stroke({ color: 0xffd08a, width: 3 });
    g.poly(sq(Math.PI / 4)).stroke({ color: 0xffd08a, width: 3 });
    g.circle(0, 0, 26).stroke({ color: 0xffe9c0, width: 2.5 });
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; g.moveTo(Math.cos(a) * 53, Math.sin(a) * 53).lineTo(Math.cos(a) * 61, Math.sin(a) * 61).stroke({ color: 0xffe9c0, width: 2.5, cap: 'round' }); }
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.2; g.circle(Math.cos(a) * 37, Math.sin(a) * 37, 3).fill(0xffe9c0); }
  },
  // --- Venom
  claw: (g) => {
    for (let i = -1; i <= 1; i++) {
      const ox = i * 13;
      g.moveTo(ox - 10, -24).quadraticCurveTo(ox + 6, -2, ox + 10, 24).quadraticCurveTo(ox - 2, 0, ox - 10, -24).fill(0xeae4ff).stroke({ color: INK, width: 3, join: 'round' });
    }
  },
  jaw: (g) => {
    g.moveTo(-34, 0).quadraticCurveTo(0, -30, 34, 0).lineTo(-34, 0).fill(0x2a2440).stroke({ color: INK, width: 4, join: 'round' });
    for (let i = 0; i < 6; i++) { const x = -27 + i * 10.8; g.poly([x - 5, -2 - Math.abs(x) * -0.0, x + 5, -2, x, 14]).fill(W).stroke({ color: INK, width: 2.2, join: 'round' }); }
    g.moveTo(-22, -10).quadraticCurveTo(0, -24, 22, -10).stroke({ color: 0x6a5a9a, width: 3, cap: 'round' });
  },
  // --- Captain Marvel
  photon: (g) => { g.roundRect(-24, -8, 48, 16, 8).fill(0xffd34a).stroke({ color: INK, width: 3.5 }); g.roundRect(-16, -3.5, 32, 7, 3.5).fill(0xfff8d8); },
  // --- Captain America
  shield: (g) => {
    g.circle(0, 0, 21).fill(0xe8413b).stroke({ color: INK, width: 4 });
    g.circle(0, 0, 15.5).fill(0xf4f2fa);
    g.circle(0, 0, 10.5).fill(0xe8413b);
    g.circle(0, 0, 7).fill(0x2f5fd0);
    g.poly(starPts(5, 6, 2.5)).fill(W);
    g.ellipse(-8, -10, 6, 3).fill({ color: W, alpha: 0.7 });
  },
  // --- Loki
  dagger: (g) => {
    const parts = (o: number, blade: number, guard: number, grip: number) => {
      g.poly([-1, -4.5 - o, 26 + o, 0, -1, 4.5 + o]).fill(blade);
      g.rect(-4 - o, -9 - o, 5 + o * 2, 18 + o * 2).fill(guard);
      g.rect(-15 - o, -2.8 - o, 12 + o, 5.6 + o * 2).fill(grip);
      g.circle(-16, 0, 3.5 + o).fill(guard);
    };
    parts(3, INK, INK, INK);
    parts(0, 0x7fe08a, 0xf6c64a, 0x2e7a3e);
    g.poly([2, -1, 24, 0, 2, -3.5]).fill(0xd8ffe0);
  },
  // --- Hawkeye, Rebelle, Maui
  arrowBoom: (g) => arrow(g, 54, 0xff8a2a, 0x9b59e6),
  arrowIce: (g) => arrow(g, 54, 0x9fe8ff, 0x9b59e6),
  arrowZap: (g) => arrow(g, 54, 0xfff27a, 0x9b59e6),
  arrowLong: (g) => arrow(g, 76, 0xdde3ee, 0x5fbf4a),
  feather: (g) => {
    g.moveTo(-18, 0).quadraticCurveTo(0, -10, 18, 0).quadraticCurveTo(0, 10, -18, 0).fill(0xb87a48).stroke({ color: INK, width: 3 });
    g.moveTo(8, -3).quadraticCurveTo(14, 0, 8, 3).quadraticCurveTo(16, 0, 18, 0).fill(0xf4ead8);
    g.moveTo(-22, 0).lineTo(14, 0).stroke({ color: 0x5a3a22, width: 2 });
  },
  // --- Falcon
  drone: (g) => {
    const parts = (o: number, wing: number, body: number) => {
      g.poly([-4, -2, -24 - o, -12 - o, -18 - o, 2, -4, 4]).fill(wing);
      g.poly([4, -2, 24 + o, -12 - o, 18 + o, 2, 4, 4]).fill(wing);
      g.ellipse(0, 0, 9 + o, 7 + o).fill(body);
    };
    parts(3, INK, INK);
    parts(0, 0xe8413b, 0x9aa3b4);
    g.circle(0, 1, 3).fill(0xff3b3b);
    g.circle(-2, -2, 1.5).fill(W);
  },
  reticle: (g) => {
    const path = () => {
      g.circle(0, 0, 22);
      for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 2; g.moveTo(Math.cos(a) * 14, Math.sin(a) * 14).lineTo(Math.cos(a) * 30, Math.sin(a) * 30); }
    };
    path(); g.stroke({ color: INK, width: 8, cap: 'round' });
    path(); g.stroke({ color: 0xff3b3b, width: 3.5, cap: 'round' });
    g.circle(0, 0, 4).fill(0xff3b3b).stroke({ color: INK, width: 2 });
  },
  // --- Shang-Chi
  tenRing: (g) => {
    g.circle(0, 0, 13).stroke({ color: INK, width: 11 });
    g.circle(0, 0, 13).stroke({ color: 0xffcf3f, width: 5.5 });
    g.arc(0, 0, 13, -2.6, -1.2).stroke({ color: W, width: 2.2, cap: 'round' });
  },
  // --- Vaïana
  wave: (g) => {
    const crest = () => {
      g.moveTo(-70, 28)
        .bezierCurveTo(-58, -6, -18, -40, 24, -36)
        .bezierCurveTo(56, -33, 70, -8, 54, 6)
        .bezierCurveTo(44, 14, 30, 6, 36, -6)
        .bezierCurveTo(22, -8, 12, 10, 22, 28)
        .lineTo(-70, 28);
    };
    crest(); g.fill(0x2f9fd8).stroke({ color: INK, width: 4.5, join: 'round' });
    g.moveTo(-56, 26).bezierCurveTo(-44, 2, -14, -22, 18, -24).bezierCurveTo(-6, -12, -20, 8, -24, 26).fill(0x6fd8f0);
    for (const [x, y, r] of [[30, -30, 7], [44, -24, 6], [52, -12, 5], [16, -32, 5], [-60, 26, 6], [-46, 24, 5]] as const) g.circle(x, y, r).fill(W);
  },
  // --- Maui
  sharkFin: (g) => {
    g.moveTo(-20, 14).quadraticCurveTo(-4, -4, 8, -22).quadraticCurveTo(10, 0, 20, 14).lineTo(-20, 14).fill(0x5f86a8).stroke({ color: INK, width: 4, join: 'round' });
    g.moveTo(-10, 12).quadraticCurveTo(0, -2, 6, -14).stroke({ color: 0x9ec2dc, width: 3, cap: 'round' });
  },
  hook: (g) => {
    const path = () => { g.moveTo(-14, -30).lineTo(-14, 4).arc(0, 4, 14, Math.PI, 0, true).lineTo(14, -6); };
    path(); g.stroke({ color: INK, width: 13, cap: 'round', join: 'round' });
    path(); g.stroke({ color: 0xf2e6c8, width: 7, cap: 'round', join: 'round' });
    g.poly([14, -6, 20, -14, 9, -10]).fill(0xf2e6c8).stroke({ color: INK, width: 2.5, join: 'round' });
    for (const y of [-22, -12]) g.moveTo(-17, y).lineTo(-11, y + 3).stroke({ color: 0x4fd1b5, width: 2 });
  },
  // --- Rebelle
  bullseye: (g) => {
    g.circle(0, 0, 24).fill(0xe8413b).stroke({ color: INK, width: 4 });
    g.circle(0, 0, 17).fill(0xf4f2fa);
    g.circle(0, 0, 11).fill(0xe8413b);
    g.circle(0, 0, 5).fill(0xffd84a);
  },
  // --- Ariel
  bubble: (g) => {
    g.circle(0, 0, 14).fill({ color: 0x9ae8ff, alpha: 0.35 }).stroke({ color: INK, width: 2.6 });
    g.arc(0, 0, 10, 0.3, 1.4).stroke({ color: W, width: 2, cap: 'round' });
    g.ellipse(-5, -5, 4, 2.6).fill(W);
  },
  bigBubble: (g) => {
    g.circle(0, 0, 58).fill({ color: 0x9ae8ff, alpha: 0.22 }).stroke({ color: INK, width: 4.5 });
    g.circle(0, 0, 58).stroke({ color: 0xc8f4ff, width: 2 });
    g.arc(0, 0, 46, 0.2, 1.3).stroke({ color: W, width: 4, cap: 'round' });
    g.ellipse(-24, -26, 14, 8).fill({ color: W, alpha: 0.9 });
    g.circle(-6, -38, 4).fill(W);
  },
  heart: (g) => {
    const parts = (o: number, c: number) => {
      g.circle(-6.5, -3, 7.5 + o).fill(c); g.circle(6.5, -3, 7.5 + o).fill(c);
      g.poly([-13.5 - o, 0, 13.5 + o, 0, 0, 15 + o * 1.4]).fill(c);
    };
    parts(3, INK); parts(0, 0xff5f9e);
    g.ellipse(-7, -5, 3, 2).fill(W);
  },
  // --- Rox & Rouky
  bite: (g) => {
    const row = (y: number, dir: number) => {
      for (let i = 0; i < 4; i++) {
        const x = -21 + i * 14, yy = y + Math.abs(x) * 0.25 * dir;
        g.poly([x - 6, yy, x + 6, yy, x, yy + 13 * dir]).fill(W).stroke({ color: INK, width: 3, join: 'round' });
      }
    };
    row(-18, 1); row(18, -1);
  },
  paw: (g) => {
    const parts = (o: number, c: number) => {
      g.ellipse(0, 5, 9 + o, 7.5 + o).fill(c);
      for (const [x, y] of [[-9, -5], [-3, -10], [4, -10], [10, -5]] as const) g.circle(x, y, 3.6 + o).fill(c);
    };
    parts(2.6, INK); parts(0, 0xc88a52);
  },
  // --- Tiana
  firefly: (g) => {
    g.ellipse(-3, 0, 6, 4.5).fill(0x4a3a2a).stroke({ color: INK, width: 2 });
    g.circle(4, 0, 6).fill(0xf4ff9a).stroke({ color: INK, width: 2 });
    g.circle(5, -1.5, 2).fill(W);
    g.ellipse(-3, -6, 5, 3).fill({ color: W, alpha: 0.7 });
  },
  // --- Nemo & Dory
  fish: (g) => {
    const parts = (o: number, body: number, tail: number) => {
      g.poly([-14, 0, -24 - o, -10 - o, -22 - o, 10 + o]).fill(tail);
      g.ellipse(0, 0, 16 + o, 10 + o).fill(body);
    };
    parts(3, INK, INK);
    parts(0, 0xff8a2a, 0xff8a2a);
    for (const x of [-6, 5]) { g.rect(x - 2.5, -9, 5, 18).fill(W); g.rect(x - 2.5, -9, 1.2, 18).fill(INK); g.rect(x + 1.3, -9, 1.2, 18).fill(INK); }
    g.circle(10, -2, 2.5).fill(INK); g.circle(10.5, -2.6, 0.9).fill(W);
  },
  // --- Coco
  marigold: (g) => {
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; g.circle(Math.cos(a) * 9, Math.sin(a) * 9, 7.5).fill(INK); }
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; g.circle(Math.cos(a) * 9, Math.sin(a) * 9, 5.5).fill(i % 2 ? 0xff9a1f : 0xffb93a); }
    g.circle(0, 0, 6).fill(0xd8641a).stroke({ color: INK, width: 2 });
  },
  // --- Nick & Judy
  carrot: (g) => {
    g.poly([-12, -6, -18, -14, -10, -8, -14, -3]).fill(0x5fbf4a).stroke({ color: INK, width: 2.5, join: 'round' });
    g.poly([-12, 6, -18, 14, -10, 8]).fill(0x5fbf4a).stroke({ color: INK, width: 2.5, join: 'round' });
    g.poly([-12, -8, 22, 0, -12, 8]).fill(0xff8a2a).stroke({ color: INK, width: 3.5, join: 'round' });
    for (const x of [-4, 6]) g.moveTo(x, -5).lineTo(x + 3, -2).stroke({ color: 0xc8581a, width: 2 });
    g.rect(-12, -2, 10, 3).fill(0xdde3ee);
  },
  cuffs: (g) => {
    for (const x of [-15, 15]) { g.circle(x, 0, 12).stroke({ color: INK, width: 10 }); g.circle(x, 0, 12).stroke({ color: 0xc8d0dc, width: 5 }); }
    g.moveTo(-3, 0).lineTo(3, 0).stroke({ color: INK, width: 7 });
    g.moveTo(-3, 0).lineTo(3, 0).stroke({ color: 0x9aa3b4, width: 3 });
    for (const x of [-15, 15]) g.arc(x, 0, 12, -2.4, -1.4).stroke({ color: W, width: 2, cap: 'round' });
  },
  crackShield: (g) => {
    g.moveTo(0, -15).lineTo(13, -10).lineTo(12, 3).quadraticCurveTo(8, 12, 0, 16).quadraticCurveTo(-8, 12, -12, 3).lineTo(-13, -10).lineTo(0, -15).fill(0x9fb4d0).stroke({ color: INK, width: 3.5, join: 'round' });
    g.moveTo(-2, -15).lineTo(3, -6).lineTo(-3, 1).lineTo(4, 8).lineTo(1, 15).stroke({ color: INK, width: 3.4, join: 'round' });
    g.poly([-9, -8, -4, -11, -6, -4]).fill(W);
  },
  // --- Buzz & Woody
  lasso: (g) => {
    g.ellipse(0, 0, 36, 15).stroke({ color: INK, width: 10 });
    g.ellipse(0, 0, 36, 15).stroke({ color: 0xc8904a, width: 5 });
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.moveTo(Math.cos(a) * 34, Math.sin(a) * 13).lineTo(Math.cos(a + 0.15) * 38, Math.sin(a + 0.15) * 17).stroke({ color: 0x8a5a2a, width: 1.6 }); }
  },
  // --- Raiponce
  pan: (g) => {
    g.roundRect(-34, -3.5, 22, 7, 3).fill(0x7a4a32).stroke({ color: INK, width: 3 });
    g.circle(0, 0, 16).fill(0x3a3a4c).stroke({ color: INK, width: 4 });
    g.circle(0, 0, 11).fill(0x55556c);
    g.arc(0, 0, 12, -2.5, -1.2).stroke({ color: W, width: 2.5, cap: 'round' });
  },
  // --- Vanellope & Ralph
  fist: (g) => {
    g.roundRect(-18, -15, 34, 30, 11).fill(0xd99a6c).stroke({ color: INK, width: 4 });
    for (const y of [-7, 1, 9]) g.moveTo(8, y - 3).lineTo(14, y - 3).stroke({ color: INK, width: 2.4, cap: 'round' });
    g.roundRect(-14, -21, 18, 9, 4).fill(0xd99a6c).stroke({ color: INK, width: 3 });
    g.rect(-26, -10, 9, 20).fill(0xc0503a).stroke({ color: INK, width: 3 });
    g.ellipse(-4, -6, 6, 3).fill({ color: W, alpha: 0.6 });
  },
  brick: (g) => { g.rect(-10, -6, 20, 12).fill(0xc0503a).stroke({ color: INK, width: 3 }); g.rect(-8, -4, 8, 3).fill(0xe88a6a); },
  // --- Extension DC
  batarang: (g) => {
    const wing = [0, -4, 6, -9, 10, -6, 22, -12, 17, -2, 22, 6, 10, 2, 4, 6, 0, 3, -4, 6, -10, 2, -22, 6, -17, -2, -22, -12, -10, -6, -6, -9];
    g.poly(wing).fill(0x3a3f52).stroke({ color: INK, width: 3.5, join: 'round' });
    g.poly([0, -2, 5, -6, 8, -4, 4, 2, 0, 0, -4, 2, -8, -4, -5, -6]).fill(0x6a7290);
  },
  trident: (g) => {
    g.moveTo(-30, 0).lineTo(14, 0).stroke({ color: INK, width: 8, cap: 'round' });
    g.moveTo(-30, 0).lineTo(14, 0).stroke({ color: 0xf6c64a, width: 3.5, cap: 'round' });
    const head = () => { g.moveTo(10, -10).lineTo(10, 10); g.moveTo(10, -10).lineTo(26, -10); g.moveTo(10, 0).lineTo(30, 0); g.moveTo(10, 10).lineTo(26, 10); };
    head(); g.stroke({ color: INK, width: 8, cap: 'round' });
    head(); g.stroke({ color: 0xf6c64a, width: 3.5, cap: 'round' });
    for (const y of [-10, 0, 10]) { const x = y === 0 ? 30 : 26; g.poly([x, y - 4, x + 7, y, x, y + 4]).fill(0xfff0b0).stroke({ color: INK, width: 2.5, join: 'round' }); }
  },
  mallet: (g) => {
    g.roundRect(-30, -3.5, 30, 7, 3).fill(0x9a6a42).stroke({ color: INK, width: 3 });
    g.roundRect(-2, -16, 26, 32, 7).fill(0xff6ab4).stroke({ color: INK, width: 4 });
    g.rect(9, -14, 7, 28).fill(0x2a2a3a);
    g.roundRect(1, -12, 6, 6, 3).fill({ color: W, alpha: 0.6 });
  },
  pie: (g) => {
    g.ellipse(0, 4, 20, 8).fill(0xd9a05a).stroke({ color: INK, width: 3.5 });
    g.moveTo(-18, 2).bezierCurveTo(-16, -14, 16, -14, 18, 2).fill(0xfff6e8).stroke({ color: INK, width: 3.5 });
    g.circle(0, -11, 4).fill(0xff3b5a).stroke({ color: INK, width: 2 });
  },
  staff: (g) => {
    g.roundRect(-30, -4, 60, 8, 4).fill(0x7a7f90).stroke({ color: INK, width: 3.5 });
    for (const x of [-20, 16]) g.rect(x, -4, 4, 8).fill(0xe8413b);
    g.roundRect(-24, -2, 46, 2.5, 1).fill({ color: W, alpha: 0.5 });
  },
  card: (g) => {
    g.roundRect(-12, -17, 24, 34, 4).fill(W).stroke({ color: INK, width: 3.5 });
    g.roundRect(-7, -11, 14, 22, 3).fill(0x8a3fd0);
    g.circle(0, 0, 4.5).fill(0x5fd068);
    g.poly([-9, -14, -5, -14, -7, -10]).fill(0xe8413b);
  },
  omega: (g) => {
    const path = () => { g.moveTo(-17, 14).lineTo(-7, 14).arc(0, -2, 12, 1.98, 1.16, false).lineTo(7, 14).lineTo(17, 14); };
    path(); g.stroke({ color: INK, width: 11, cap: 'round', join: 'round' });
    path(); g.stroke({ color: 0xff3b3b, width: 5, cap: 'round', join: 'round' });
  },
  // --- boss
  pumpkin: (g) => {
    for (const x of [-9, 9]) g.ellipse(x, 2, 10, 14).fill(0xff8a1f).stroke({ color: INK, width: 3 });
    g.ellipse(0, 2, 11, 15).fill(0xffa040).stroke({ color: INK, width: 3 });
    g.rect(-2, -17, 5, 7).fill(0x4e9a2e).stroke({ color: INK, width: 2 });
    g.poly([-9, -2, -4, -5, -5, 1]).fill(0xffe14a); g.poly([9, -2, 4, -5, 5, 1]).fill(0xffe14a);
    g.poly([-9, 7, 9, 7, 5, 11, 0, 9, -5, 11]).fill(0xffe14a);
  },
  coin: (g) => { g.circle(0, 0, 11).fill(0xf6c64a).stroke({ color: INK, width: 3 }); g.circle(0, 0, 7).stroke({ color: 0xd89a1a, width: 2 }); g.ellipse(-4, -4, 3, 2).fill(W); },
  stunStar: (g) => { g.poly(starPts(5, 11, 5)).fill(0xffe14a).stroke({ color: INK, width: 2.8, join: 'round' }); g.circle(-2, -3, 1.8).fill(W); },
  snowflake: (g) => {
    const path = () => {
      for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI) / 3, c = Math.cos(a), s = Math.sin(a);
        g.moveTo(-c * 14, -s * 14).lineTo(c * 14, s * 14);
        for (const k of [-1, 1]) { const bx = c * 9 * k, by = s * 9 * k; g.moveTo(bx, by).lineTo(bx + Math.cos(a + 0.8 * k) * 5 * k, by + Math.sin(a + 0.8 * k) * 5 * k); g.moveTo(bx, by).lineTo(bx + Math.cos(a - 0.8 * k) * 5 * k, by + Math.sin(a - 0.8 * k) * 5 * k); }
      }
    };
    path(); g.stroke({ color: INK, width: 6.5, cap: 'round' });
    path(); g.stroke({ color: 0xd8f6ff, width: 2.8, cap: 'round' });
  },
  flame: (g) => {
    const fl = (k: number, dy: number) => g.moveTo(0, -20 * k + dy).bezierCurveTo(6 * k, -8 * k + dy, 13 * k, -2 * k + dy, 12 * k, 6 * k + dy).bezierCurveTo(11 * k, 14 * k + dy, 4 * k, 18 * k + dy, 0, 18 * k + dy).bezierCurveTo(-4 * k, 18 * k + dy, -11 * k, 14 * k + dy, -12 * k, 6 * k + dy).bezierCurveTo(-13 * k, -2 * k + dy, -6 * k, -8 * k + dy, 0, -20 * k + dy);
    fl(1, 0); g.fill(0xff7a2a).stroke({ color: INK, width: 3.5, join: 'round' });
    fl(0.6, 6); g.fill(0xffd84a);
    g.ellipse(-2, 11, 2.5, 3.5).fill(W);
  },
  fireball: (g) => {
    const parts = (o: number, c: number, r: number) => {
      g.poly([-34 - o, 0, -6, -r - o, -6, r + o]).fill(c);
      g.poly([-26 - o, -9 - o, -4, -r * 0.6 - o, -8, 0]).fill(c);
      g.circle(0, 0, r + o).fill(c);
    };
    parts(3.2, INK, 14); parts(0, 0xff7a2a, 14);
    g.poly([-20, 0, -4, -8, -4, 8]).fill(0xffd84a);
    g.circle(1, 0, 8.5).fill(0xffd84a);
    g.circle(3, -3, 3.5).fill(W);
  },
} satisfies Record<string, Draw>;

function arrow(g: Graphics, len: number, tip: number, fletch: number): void {
  const h = len / 2;
  g.moveTo(-h + 4, 0).lineTo(h - 10, 0).stroke({ color: INK, width: 8, cap: 'round' });
  g.moveTo(-h + 4, 0).lineTo(h - 10, 0).stroke({ color: 0x9a6a42, width: 3.5, cap: 'round' });
  g.poly([-h, -8, -h + 14, -1, -h + 12, 0, -h + 14, 1, -h, 8, -h + 4, 0]).fill(fletch).stroke({ color: INK, width: 2.6, join: 'round' });
  g.poly([h - 13, -7, h + 3, 0, h - 13, 7, h - 9, 0]).fill(tip).stroke({ color: INK, width: 3, join: 'round' });
  g.poly([h - 10, -3, h, 0, h - 9, -0.5]).fill(W);
}

export type FxTexName = keyof typeof D;

/**
 * Agrandissement des objets (projectiles, icônes, impacts) : dessinés à taille « planche », ils
 * seraient trop petits à l'échelle d'un téléphone (~0,4 px CSS par px logique). Les primitives
 * (halo, anneau, rayon, trait) et les grands décors gardent leur taille, utilisée par les calculs de rayon.
 */
export const OBJ_SCALE = 1.6;
const UNSCALED = new Set<string>(['glow', 'spark', 'streak', 'ring', 'ringInk', 'beam', 'beamCore', 'mandala', 'crack', 'webNet', 'wave', 'bigBubble', 'jaw']);
export type FxAtlas = Record<FxTexName, Texture>;

/** Dessine toutes les formes et les range sur une seule texture. */
export function bakeFxAtlas(renderer: Renderer): FxAtlas {
  const root = new Container();
  const PAD = 4, MAXW = 900;
  const boxes: { name: FxTexName; x: number; y: number; w: number; h: number }[] = [];
  let cx = PAD, cy = PAD, rowH = 0;
  for (const name of Object.keys(D) as FxTexName[]) {
    const g = new Graphics();
    (D[name] as Draw)(g);
    if (!UNSCALED.has(name)) g.scale.set(OBJ_SCALE);
    const lb = g.getLocalBounds();
    const k = g.scale.x;
    const b = { x: lb.x * k, y: lb.y * k, width: lb.width * k, height: lb.height * k };
    const w = Math.ceil(b.width) + 2, h = Math.ceil(b.height) + 2;
    if (cx + w + PAD > MAXW) { cx = PAD; cy += rowH + PAD; rowH = 0; }
    g.position.set(cx - b.x + 1, cy - b.y + 1);
    root.addChild(g);
    boxes.push({ name, x: cx, y: cy, w, h });
    cx += w + PAD;
    rowH = Math.max(rowH, h);
  }
  const H = cy + rowH + PAD;
  const big = renderer.generateTexture({ target: root, resolution: 2, antialias: true, frame: new Rectangle(0, 0, MAXW, H) });
  root.destroy({ children: true });
  const out = {} as FxAtlas;
  for (const b of boxes) out[b.name] = new Texture({ source: big.source, frame: new Rectangle(b.x, b.y, b.w, b.h) });
  return out;
}
