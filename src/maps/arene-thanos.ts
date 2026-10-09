// Arène de Thanos : Titan, planète en ruines au ciel orange, débris en orbite, les six Pierres
// d'infinité qui brillent en fond. Pendant le boss : la Pierre utilisée colore l'écran ; flash blanc
// et silence au Claquement de doigts.

import { type Ctx, type Painter, INK, SW, at, cel, circleS, defineMap, glow, groundShadow, n1, pathS, polyS, rectS, scene, spots } from './kit';

export const STONES = {
  puissance: '#9b4fe0', espace: '#3f7ff0', realite: '#e8413b', ame: '#f2902e', temps: '#3fc46a', esprit: '#f2d23a',
} as const;

const pal = {
  bg: '#2a1410',
  sky1: '#b8501e', sky2: '#f2a04a',
  ground: '#7a4a36', ground2: '#6a3e2e',
  path: '#b8927a', pathEdge: '#6a4a3a', pathDeco: '#8a6a58',
  frame: '#8a6a5e', frameLight: '#b8968a', frameShade: '#5a4038',
  cellA: '#f6ece4', cellB: '#e8d8cc',
  accent: '#9b4fe0', portal: '#9b4fe0',
  ruin: '#9a7a6a', rock: '#7a5a4a', gold: '#e2b552',
};

const brokenColumn: Painter = (x, y, s) =>
  groundShadow(x, y, 34 * s) + cel(rectS(x - 26 * s, y - 16 * s, 52 * s, 16 * s, 3), pal.ruin, { dx: 0, dy: 5 }) +
  cel(pathS(`M${n1(x - 18 * s)} ${n1(y - 14 * s)} L${n1(x - 18 * s)} ${n1(y - 120 * s)} L${n1(x - 4 * s)} ${n1(y - 108 * s)} L${n1(x + 6 * s)} ${n1(y - 130 * s)} L${n1(x + 18 * s)} ${n1(y - 114 * s)} L${n1(x + 18 * s)} ${n1(y - 14 * s)}Z`), pal.ruin, { dx: 8, dy: 0 }) +
  [-8, 4].map((d) => `<line x1="${n1(x + d * s)}" y1="${n1(y - 100 * s)}" x2="${n1(x + d * s)}" y2="${n1(y - 20 * s)}" stroke="${INK}" stroke-width="3" opacity=".3"/>`).join('');

const rubble: Painter = (x, y, s) =>
  groundShadow(x, y, 40 * s) + cel(polyS([{ x: x - 40 * s, y }, { x: x - 30 * s, y: y - 30 * s }, { x: x - 6 * s, y: y - 38 * s }, { x: x + 4 * s, y: y - 14 * s }, { x: x - 6 * s, y }]), pal.rock, { dx: 5, dy: 0 }) +
  cel(polyS([{ x: x - 4 * s, y }, { x: x + 10 * s, y: y - 26 * s }, { x: x + 36 * s, y: y - 22 * s }, { x: x + 40 * s, y }]), pal.ruin, { dx: 5, dy: 0 });

const shard: Painter = (x, y, s) =>
  groundShadow(x, y, 24 * s) + cel(polyS([{ x: x - 16 * s, y }, { x: x - 6 * s, y: y - 70 * s }, { x: x + 10 * s, y: y - 50 * s }, { x: x + 16 * s, y }]), '#5a3e36', { dx: 6, dy: 0 });

/** Les six Pierres dans un arc, au fond (comme sur le Gant). */
function stonesArc(cx: number, cy: number, r: number): string {
  const cols = Object.values(STONES);
  return cols.map((col, i) => {
    const a = Math.PI * (1.1 + (i * 0.8) / 5);
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.55;
    return `<circle cx="${n1(x)}" cy="${n1(y)}" r="26" fill="${col}" opacity=".25"/>` + cel(pathS(`M${n1(x)} ${n1(y - 16)} L${n1(x + 12)} ${n1(y)} L${n1(x)} ${n1(y + 16)} L${n1(x - 12)} ${n1(y)}Z`), col, { dx: 4, dy: 0, sw: 4 });
  }).join('');
}

function backdrop(c: Ctx): string {
  return scene(c, {
    texture: 'spots', pad: '#8e6250', padMargin: 0.85,
    horizon: (base) => {
      // ciel orange, planète Titan fendue, anneau de débris
      let s = `<circle cx="250" cy="${base - 150}" r="90" fill="#e8783a" stroke="${INK}" stroke-width="5"/><path d="M180 ${base - 210} L240 ${base - 150} L210 ${base - 100}" stroke="${INK}" stroke-width="5" fill="none"/>`;
      s += `<ellipse cx="250" cy="${base - 150}" rx="150" ry="22" fill="none" stroke="#c8784a" stroke-width="8" opacity=".7"/>`;
      s += stonesArc(700, base - 30, 220);
      s += `<path d="M-10 ${base + 10} L40 ${base - 70} L120 ${base - 40} L170 ${base - 110} L250 ${base - 50} L330 ${base - 80} L380 ${base - 30} L470 ${base - 90} L560 ${base - 40} L640 ${base - 100} L720 ${base - 50} L800 ${base - 120} L880 ${base - 60} L940 ${base - 90} L1010 ${base - 40} L1010 ${base + 30} L-10 ${base + 30}Z" fill="#5a3426" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`;
      return s;
    },
  });
}

function anims(c: Ctx) {
  const [a, b, d, e, f, g] = spots(c);
  const debris = (x: number, y: number) => cel(polyS([{ x: x - 16, y: y - 6 }, { x: x - 4, y: y - 16 }, { x: x + 14, y: y - 8 }, { x: x + 10, y: y + 10 }, { x: x - 10, y: y + 10 }]), '#6a4a3a', { dx: 4, dy: 4, sw: 4 });
  const stone = (p: { x: number; y: number }, col: string) => glow(p.x, p.y, 9, col);
  return [
    at('Débris en orbite', 'spin', a, 30, debris(a.x + 10, a.y), { period: 9, ox: a.x, oy: a.y }),
    at('Débris en orbite', 'bob', b, 30, debris(b.x, b.y), { period: 4, amp: 10 }),
    at('Les six Pierres qui brillent', 'pulse', e, 24, stone(e, STONES.espace), { period: 2.2, amp: 0.18 }),
    at('Les six Pierres qui brillent', 'pulse', f, 24, stone(f, STONES.realite), { period: 2.6, amp: 0.18, phase: 0.3 }),
    at('Les six Pierres qui brillent', 'pulse', g, 24, stone(g, STONES.ame), { period: 2.4, amp: 0.18, phase: 0.6 }),
    at('Les six Pierres qui brillent', 'blink', d, 24, stone(d, STONES.puissance), { period: 3, min: 0.4 }),
  ];
}

export const areneThanos = defineMap({
  id: 'arene-thanos',
  name: 'Titan',
  tagline: 'La planète en ruines de Thanos, sous un ciel orange.',
  universe: 'boss',
  heroes: [],
  boss: 'thanos',
  shape: 'u',
  pathMaterial: 'Gravats de Titan',
  pathKind: 'rubble',
  frameKind: 'stone',
  palette: pal,
  backdrop,
  props: { big: [brokenColumn], med: [rubble, shard], small: [shard, rubble] },
  gate: (x, y, s) => groundShadow(x, y, 66 * s) +
    cel(pathS(`M${n1(x - 60 * s)} ${n1(y)} L${n1(x - 50 * s)} ${n1(y - 110 * s)} L${n1(x + 50 * s)} ${n1(y - 110 * s)} L${n1(x + 60 * s)} ${n1(y)}Z`), pal.ruin, { dx: 10, dy: 0 }) +
    flat2(x, y, s),
  anims,
  sound: 'titan-orchestre',
  unlock: { type: 'depart', value: 0 },
  bossFx: {
    description: 'La Pierre utilisée colore tout l\'écran ; flash blanc et silence d\'une seconde au Claquement de doigts.',
    effects: ['stone-tint', 'snap-flash'],
    tintAlpha: 0.22,
    colors: { ...STONES },
  },
  mute: { sat: 0.75, lum: 0.86 },
});

function flat2(x: number, y: number, s: number): string {
  return `<path d="M${n1(x - 26 * s)} ${n1(y)} L${n1(x - 26 * s)} ${n1(y - 60 * s)} L${n1(x + 26 * s)} ${n1(y - 60 * s)} L${n1(x + 26 * s)} ${n1(y)}Z" fill="#2a1410" stroke="${INK}" stroke-width="${SW}"/>` +
    cel(circleS(x, y - 86 * s, 12 * s), STONES.ame, { dx: 3, dy: 3, sw: 4 });
}

export default areneThanos;
