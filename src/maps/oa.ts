// Oa (Green Lantern, Martian Manhunter) : planète des Gardiens, chemin d'énergie verte construite,
// la Batterie centrale géante dans le ciel cosmique, citadelles et cristaux. Batterie qui palpite,
// anneaux en orbite et étoiles qui scintillent.

import {
  type AnimSpec, type Ctx, type Painter, INK, SW, across, at, cel, defineMap, flat, gloss, glow, groundShadow,
  light, n1, pathS, polyS, rectS, scene, sparkle, spots, stars,
} from './kit';

const pal = {
  bg: '#04140e',
  sky1: '#061a16', sky2: '#14463a',
  ground: '#1e3a36', ground2: '#24443e',
  path: '#c4e2cc', pathEdge: '#4a7a5e', pathDeco: '#5ad884',
  frame: '#4a6a62', frameLight: '#7a9a90', frameShade: '#2e4840',
  cellA: '#eef8f2', cellB: '#d8eee2',
  accent: '#5af08a', portal: '#5af08a',
  lantern: '#3ae070', steel: '#5a7a72', crystal: '#7af0a8', citadel: '#2e5a4e',
};

// ---------------------------------------------------------------- accessoires

const greenCrystal: Painter = (x, y, s) =>
  groundShadow(x, y, 28 * s) + `<circle cx="${n1(x)}" cy="${n1(y - 40 * s)}" r="${n1(40 * s)}" fill="${pal.crystal}" opacity=".12"/>` +
  cel(polyS([{ x: x - 18 * s, y }, { x: x - 24 * s, y: y - 44 * s }, { x: x - 6 * s, y: y - 84 * s }, { x: x + 12 * s, y: y - 54 * s }, { x: x + 18 * s, y }]), pal.crystal, { dx: 8, dy: 0 }) +
  cel(polyS([{ x: x + 8 * s, y }, { x: x + 20 * s, y: y - 40 * s }, { x: x + 34 * s, y: y - 30 * s }, { x: x + 32 * s, y }]), '#4ac07a', { dx: 5, dy: 0 }) +
  gloss(x - 10 * s, y - 50 * s, 3 * s, 12 * s, 15, 0.5);

/** Lanterne-batterie de Green Lantern, sur socle. */
const lanternBattery: Painter = (x, y, s) =>
  groundShadow(x, y, 32 * s) + `<circle cx="${n1(x)}" cy="${n1(y - 50 * s)}" r="${n1(46 * s)}" fill="${pal.lantern}" opacity=".15"/>` +
  cel(rectS(x - 26 * s, y - 16 * s, 52 * s, 16 * s, 4), pal.steel, { dx: 0, dy: 5 }) +
  cel(rectS(x - 20 * s, y - 70 * s, 40 * s, 54 * s, 10 * s), pal.lantern, { dx: 8, dy: 0 }) +
  [-10, 0, 10].map((d) => `<line x1="${n1(x + d * s)}" y1="${n1(y - 66 * s)}" x2="${n1(x + d * s)}" y2="${n1(y - 20 * s)}" stroke="${INK}" stroke-width="${n1(3 * s)}" opacity=".35"/>`).join('') +
  cel(rectS(x - 24 * s, y - 80 * s, 48 * s, 12 * s, 4), pal.steel, { dx: 0, dy: 4 }) +
  flat(pathS(`M${n1(x - 14 * s)} ${n1(y - 80 * s)} Q${n1(x)} ${n1(y - 104 * s)} ${n1(x + 14 * s)} ${n1(y - 80 * s)}`), 'none', SW * 0.7);

const pylon: Painter = (x, y, s) =>
  groundShadow(x, y, 30 * s) +
  cel(polyS([{ x: x - 24 * s, y }, { x: x - 10 * s, y: y - 150 * s }, { x, y: y - 170 * s }, { x: x + 10 * s, y: y - 150 * s }, { x: x + 24 * s, y }]), pal.citadel, { dx: 8, dy: 0 }) +
  `<circle cx="${n1(x)}" cy="${n1(y - 120 * s)}" r="${n1(8 * s)}" fill="${pal.pathDeco}" stroke="${INK}" stroke-width="${n1(3 * s)}"/>`;

const rockOa: Painter = (x, y, s) =>
  groundShadow(x, y, 34 * s) + cel(pathS(`M${n1(x - 34 * s)} ${n1(y)} Q${n1(x - 38 * s)} ${n1(y - 34 * s)} ${n1(x - 8 * s)} ${n1(y - 38 * s)} Q${n1(x + 28 * s)} ${n1(y - 44 * s)} ${n1(x + 34 * s)} ${n1(y)}Z`), '#3a5650', { dx: 6, dy: 0 });

/** Sortie : portail des Gardiens (anneau vert sur deux piliers). */
const ringGate: Painter = (x, y, s) =>
  groundShadow(x, y, 66 * s) +
  cel(rectS(x - 64 * s, y - 100 * s, 22 * s, 100 * s, 4), pal.citadel, { dx: 6, dy: 0 }) +
  cel(rectS(x + 42 * s, y - 100 * s, 22 * s, 100 * s, 4), pal.citadel, { dx: 6, dy: 0 }) +
  `<circle cx="${n1(x)}" cy="${n1(y - 70 * s)}" r="${n1(48 * s)}" fill="${pal.lantern}" opacity=".25"/>` +
  `<circle cx="${n1(x)}" cy="${n1(y - 70 * s)}" r="${n1(42 * s)}" fill="none" stroke="${INK}" stroke-width="${n1(18 * s)}"/>` +
  `<circle cx="${n1(x)}" cy="${n1(y - 70 * s)}" r="${n1(42 * s)}" fill="none" stroke="${pal.lantern}" stroke-width="${n1(10 * s)}"/>` +
  `<circle cx="${n1(x)}" cy="${n1(y - 70 * s)}" r="${n1(16 * s)}" fill="none" stroke="${light(pal.lantern, 0.5)}" stroke-width="${n1(6 * s)}"/>`;

// ---------------------------------------------------------------- fond

/** La Batterie centrale : lanterne géante posée sur la citadelle. */
function centralBattery(cx: number, base: number, k: number): string {
  const w = 150 * Math.max(k, 0.55), h = 150 * k, top = base - 40 * k - h;
  let s = `<circle cx="${cx}" cy="${n1(top + h / 2)}" r="${n1(w * 1.3)}" fill="${pal.lantern}" opacity=".12"/><circle cx="${cx}" cy="${n1(top + h / 2)}" r="${n1(w * 0.95)}" fill="${pal.lantern}" opacity=".14"/>`;
  s += cel(rectS(cx - w * 0.7, base - 40 * k, w * 1.4, 40 * k + 10, 8), pal.citadel, { dx: 0, dy: 8, sw: SW * 0.8 });
  s += cel(rectS(cx - w / 2, top, w, h, 18), pal.lantern, { dx: w * 0.15, dy: 0, sw: SW * 0.9 });
  for (let i = 1; i < 4; i++) s += `<line x1="${n1(cx - w / 2 + (w * i) / 4)}" y1="${n1(top + 8)}" x2="${n1(cx - w / 2 + (w * i) / 4)}" y2="${n1(top + h - 8)}" stroke="${INK}" stroke-width="4" opacity=".35"/>`;
  s += cel(rectS(cx - w * 0.6, top - 18 * k, w * 1.2, 22 * k + 4, 6), pal.steel, { dx: 0, dy: 6, sw: SW * 0.8 });
  s += cel(rectS(cx - w * 0.6, top + h - 4, w * 1.2, 22 * k + 4, 6), pal.steel, { dx: 0, dy: 6, sw: SW * 0.8 });
  s += `<path d="M${n1(cx - w * 0.3)} ${n1(top - 18 * k)} Q${cx} ${n1(top - 70 * k)} ${n1(cx + w * 0.3)} ${n1(top - 18 * k)}" stroke="${INK}" stroke-width="10" fill="none"/>`;
  s += `<path d="M${n1(cx - w * 0.3)} ${n1(top - 18 * k)} Q${cx} ${n1(top - 70 * k)} ${n1(cx + w * 0.3)} ${n1(top - 18 * k)}" stroke="${pal.steel}" stroke-width="5" fill="none"/>`;
  s += gloss(cx - w * 0.3, top + h * 0.3, 6, h * 0.25, 0, 0.4);
  return s;
}

function citadels(base: number, k: number): string {
  let s = '';
  for (const [x, w, h] of [[60, 70, 180], [170, 50, 120], [300, 60, 150], [700, 60, 160], [820, 50, 110], [930, 80, 200]] as const) {
    s += cel(polyS([{ x: x - w / 2, y: base + 10 }, { x: x - w * 0.3, y: n1(base - h * k) }, { x, y: n1(base - (h + 40) * k) }, { x: x + w * 0.3, y: n1(base - h * k) }, { x: x + w / 2, y: base + 10 }]), pal.citadel, { dx: w * 0.15, dy: 0, sw: SW * 0.8 });
    s += `<circle cx="${x}" cy="${n1(base - (h - 20) * k)}" r="5" fill="${pal.pathDeco}"/>`;
  }
  return s;
}

function backdrop(c: Ctx): string {
  const k = c.mode === 'solo' ? 1 : 0.5;
  return scene(c, {
    texture: 'spots', pad: '#2c4c46', padMargin: 0.9,
    horizon: (base) =>
      stars(c, 60, { x: 0, y: 0, w: 1000, h: base }, '#c8ffd8') +
      `<ellipse cx="220" cy="${n1(base - 170 * k)}" rx="260" ry="70" fill="${pal.lantern}" opacity=".12"/><ellipse cx="820" cy="${n1(base - 230 * k)}" rx="200" ry="60" fill="#3a8aa0" opacity=".16"/>` +
      citadels(base, k) + centralBattery(500, base, k) + cel(rectS(-20, base - 4, 1040, 26, 0), pal.steel, { dx: 0, dy: 8 }),
    after: stars(c, 40, { x: 0, y: c.mode === 'solo' ? 300 : 150, w: 1000, h: 1300 }, '#9af0b8'),
  });
}

// ---------------------------------------------------------------- animations

const ring = (x: number, y: number, r: number) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${INK}" stroke-width="${n1(r * 0.55)}"/><circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${pal.lantern}" stroke-width="${n1(r * 0.3)}"/>` +
  `<rect x="${n1(x - r * 0.45)}" y="${n1(y - r * 1.5)}" width="${n1(r * 0.9)}" height="${n1(r * 0.7)}" rx="2" fill="${pal.lantern}" stroke="${INK}" stroke-width="2.5"/>`;

function anims(c: Ctx): AnimSpec[] {
  const [a, b, d, e, f] = spots(c);
  const solo = c.mode === 'solo';
  const k = solo ? 1 : 0.5, base = solo ? 270 : 118, cy = base - 40 * k - 75 * k;
  return [
    at('Batterie centrale qui palpite', 'pulse', { x: 500, y: n1(cy) }, solo ? 66 : 36, `<circle cx="500" cy="${n1(cy)}" r="${solo ? 64 : 34}" fill="${pal.lantern}" opacity=".22"/><circle cx="500" cy="${n1(cy)}" r="${solo ? 46 : 28}" fill="${light(pal.lantern, 0.4)}" opacity=".22"/>`, { period: 2.2, amp: 0.1 }),
    at('Anneaux en orbite', 'spin', a, 34, ring(a.x + 18, a.y, 10), { period: 4 }),
    at('Anneaux en orbite', 'spin', b, 34, ring(b.x - 18, b.y, 10), { period: 5 }),
    at('Anneaux en orbite', 'bob', d, 30, ring(d.x, d.y + 4, 11), { period: 2.6, amp: 8 }),
    at('Batterie centrale qui palpite', 'blink', e, 24, glow(e.x, e.y, 8, pal.lantern), { period: 2.2, min: 0.3 }),
    at('Batterie centrale qui palpite', 'blink', f, 24, sparkle(f.x, f.y, 14, '#c8ffd8'), { period: 1.6, min: 0.1, phase: 0.4 }),
    ...(solo ? [across('Anneaux en orbite', c.z.strip.y, 14, (x, y) => ring(x, y - 20, 12) + `<path d="M${x - 60} ${y - 20} h40" stroke="${pal.lantern}" stroke-width="6" stroke-linecap="round" opacity=".5"/>`, { w: 120, h: 50 })] : []),
  ];
}

export const oa = defineMap({
  id: 'oa',
  name: 'Oa',
  tagline: 'Au centre de l\'univers, la Batterie des Green Lanterns.',
  universe: 'dc',
  heroes: ['greenlantern', 'martian'],
  shape: 'arch',
  pathMaterial: 'Pont d\'énergie verte construite',
  pathKind: 'energy',
  frameKind: 'cosmic',
  palette: pal,
  backdrop,
  props: {
    big: [pylon, lanternBattery, pylon],
    med: [greenCrystal, lanternBattery, rockOa],
    small: [greenCrystal, rockOa],
  },
  gate: ringGate,
  anims,
  sound: 'oa-cosmique',
  modifiers: { combos: 0.1 },
  unlock: { type: 'chapitre', value: 9 },
  mute: { sat: 0.82, lum: 0.9 },
});

export default oa;
