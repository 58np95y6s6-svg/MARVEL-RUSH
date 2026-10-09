// Asgard et le Bifrost (Thor, Loki) : pont arc-en-ciel, palais doré, montagnes flottantes,
// aurores, éclairs lointains.

import {
  type Ctx, type Painter, INK, P, SW, at, cel, cloud, defineMap, flat, gloss, glow, groundShadow, n1, pathS, polyS,
  rectS, scene, spots, stars, across,
} from './kit';

const pal = {
  bg: '#141532',
  sky1: '#1d1d4a', sky2: '#4a3f86',
  ground: '#2f3266', ground2: '#3a3d78',
  path: '#d7d0e8', pathEdge: '#8e86b8', pathDeco: '#ffffff',
  frame: '#d9aa45', frameLight: '#f6dc8a', frameShade: '#9c7130',
  cellA: '#f1eef8', cellB: '#e0dbee',
  accent: '#f2c14e', portal: '#b48cff',
  gold: '#e2b552', rock: '#6c6a92', aurora: '#7de3c0',
};

/** Île flottante avec flèche dorée. */
const floatingIsle: Painter = (x, y, s) =>
  `<ellipse cx="${n1(x)}" cy="${n1(y + 6 * s)}" rx="${n1(40 * s)}" ry="${n1(8 * s)}" fill="${INK}" opacity=".18"/>` +
  cel(pathS(`M${n1(x - 62 * s)} ${n1(y - 60 * s)} Q${n1(x)} ${n1(y - 76 * s)} ${n1(x + 62 * s)} ${n1(y - 60 * s)} Q${n1(x + 40 * s)} ${n1(y - 30 * s)} ${n1(x + 8 * s)} ${n1(y - 8 * s)} Q${n1(x)} ${n1(y)} ${n1(x - 10 * s)} ${n1(y - 10 * s)} Q${n1(x - 40 * s)} ${n1(y - 30 * s)} ${n1(x - 62 * s)} ${n1(y - 60 * s)}Z`), pal.rock, { dx: 10, dy: 0 }) +
  cel(pathS(`M${n1(x - 60 * s)} ${n1(y - 62 * s)} Q${n1(x)} ${n1(y - 80 * s)} ${n1(x + 60 * s)} ${n1(y - 62 * s)} Q${n1(x)} ${n1(y - 50 * s)} ${n1(x - 60 * s)} ${n1(y - 62 * s)}Z`), '#5d8a77', { dx: 0, dy: 4 }) +
  cel(rectS(x - 14 * s, y - 140 * s, 28 * s, 74 * s, 6 * s), pal.gold, { dx: 7, dy: 0 }) +
  cel(polyS([{ x: x - 20 * s, y: y - 138 * s }, { x, y: y - 190 * s }, { x: x + 20 * s, y: y - 138 * s }]), pal.gold, { dx: 6, dy: 0 }) +
  gloss(x - 6 * s, y - 120 * s, 3 * s, 12 * s, 0, 0.5);

const pillar: Painter = (x, y, s) =>
  groundShadow(x, y, 30 * s) + cel(rectS(x - 26 * s, y - 14 * s, 52 * s, 14 * s, 4 * s), pal.gold, { dx: 0, dy: 5 }) +
  cel(rectS(x - 16 * s, y - 92 * s, 32 * s, 80 * s, 6 * s), '#e9dcc0', { dx: 8, dy: 0 }) +
  cel(rectS(x - 24 * s, y - 104 * s, 48 * s, 14 * s, 4 * s), pal.gold, { dx: 0, dy: 5 }) +
  [-6, 4].map((d) => `<line x1="${n1(x + d * s)}" y1="${n1(y - 88 * s)}" x2="${n1(x + d * s)}" y2="${n1(y - 16 * s)}" stroke="${INK}" stroke-width="3" opacity=".3"/>`).join('');

const rune: Painter = (x, y, s) =>
  groundShadow(x, y, 26 * s) + cel(pathS(`M${n1(x - 22 * s)} ${n1(y)} Q${n1(x - 26 * s)} ${n1(y - 52 * s)} ${n1(x)} ${n1(y - 58 * s)} Q${n1(x + 26 * s)} ${n1(y - 52 * s)} ${n1(x + 22 * s)} ${n1(y)}Z`), pal.rock, { dx: 7, dy: 0 }) +
  `<path d="M${n1(x - 6 * s)} ${n1(y - 42 * s)} L${n1(x + 6 * s)} ${n1(y - 30 * s)} L${n1(x - 6 * s)} ${n1(y - 18 * s)} M${n1(x + 6 * s)} ${n1(y - 42 * s)} L${n1(x + 6 * s)} ${n1(y - 12 * s)}" stroke="${pal.aurora}" stroke-width="${n1(4 * s)}" fill="none" stroke-linecap="round"/>`;

function palace(base: number): string {
  let s = '';
  const tower = (x: number, w: number, h: number) =>
    cel(rectS(x - w / 2, base - h, w, h + 20, 8), pal.gold, { dx: w * 0.2, dy: 0, sw: SW * 0.8 }) +
    cel(polyS([{ x: x - w * 0.6, y: base - h + 4 }, { x, y: base - h - w * 1.4 }, { x: x + w * 0.6, y: base - h + 4 }]), '#f0cc6a', { dx: 6, dy: 0, sw: SW * 0.8 });
  for (const [x, w, h] of [[150, 40, 90], [260, 50, 140], [380, 60, 200], [500, 80, 250], [620, 60, 200], [740, 50, 140], [850, 40, 90]] as const) s += tower(x, w, h);
  return s;
}

function backdrop(c: Ctx): string {
  return scene(c, {
    texture: 'none', pad: '#3a3d7a', padMargin: 0.9,
    horizon: (base) =>
      stars(c, 50, { x: 0, y: 0, w: 1000, h: base }) +
      `<path d="M-20 ${base - 120} Q250 ${base - 210} 500 ${base - 150} T1020 ${base - 170}" stroke="${pal.aurora}" stroke-width="34" fill="none" opacity=".25" stroke-linecap="round"/>` +
      palace(base) + cel(rectS(-20, base - 6, 1040, 30, 0), '#4f4a8a', { dx: 0, dy: 8 }),
    after: stars(c, 70, { x: 0, y: horizonOf(c) + 40, w: 1000, h: 1600 }, '#d9d3ff'),
  });
}
const horizonOf = (c: Ctx) => (c.mode === 'solo' ? 270 : 118);

function anims(c: Ctx) {
  const [a, b, , d, e, f] = spots(c);
  const sky = c.mode === 'solo' ? 110 : 40;
  const bolt = (x: number, y: number) => `<path d="M${x} ${y - 30} L${x - 10} ${y} L${x + 2} ${y} L${x - 8} ${y + 30} L${x + 14} ${y - 6} L${x + 2} ${y - 6} L${x + 10} ${y - 30}Z" fill="#fff4a8" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
  return [
    across('Aurores et nuages', sky, 52, (x, y) => cloud(x, y, 0.7, '#b9a8e8'), { w: 120, h: 50 }),
    at('Éclairs lointains', 'blink', d, 34, bolt(d.x, d.y), { period: 3.3, min: 0 }),
    at('Éclairs lointains', 'blink', f, 34, bolt(f.x, f.y), { period: 4.1, min: 0, phase: 0.5 }),
    at('Rochers flottants', 'bob', a, 40, rune(a.x, a.y + 30, 0.8, () => 0), { period: 3.2, amp: 8 }),
    at('Rochers flottants', 'bob', b, 40, glow(b.x, b.y, 12, pal.aurora), { period: 2.6, amp: 10, phase: 0.4 }),
    at('Rochers flottants', 'pulse', e, 30, glow(e.x, e.y, 9, '#f6dc8a'), { period: 2.2, amp: 0.12 }),
  ];
}

export const asgardBifrost = defineMap({
  id: 'asgard-bifrost',
  name: 'Asgard et le Bifrost',
  tagline: 'Sur le pont arc-en-ciel, aux portes du palais doré.',
  universe: 'marvel',
  heroes: ['thor', 'loki'],
  shape: 'arch',
  pathMaterial: 'Pont arc-en-ciel du Bifrost',
  pathKind: 'rainbow',
  frameKind: 'gold',
  palette: pal,
  backdrop,
  props: { big: [floatingIsle], med: [pillar, rune], small: [rune, P.crystal('#9ad8ff')] },
  gate: (x, y, s) => groundShadow(x, y, 64 * s) +
    cel(pathS(`M${n1(x - 60 * s)} ${n1(y)} L${n1(x - 60 * s)} ${n1(y - 70 * s)} Q${n1(x)} ${n1(y - 150 * s)} ${n1(x + 60 * s)} ${n1(y - 70 * s)} L${n1(x + 60 * s)} ${n1(y)}Z`), pal.gold, { dx: 10, dy: 0 }) +
    flat(pathS(`M${n1(x - 32 * s)} ${n1(y)} L${n1(x - 32 * s)} ${n1(y - 56 * s)} Q${n1(x)} ${n1(y - 104 * s)} ${n1(x + 32 * s)} ${n1(y - 56 * s)} L${n1(x + 32 * s)} ${n1(y)}Z`), '#b48cff') +
    gloss(x - 14 * s, y - 70 * s, 6 * s, 14 * s, 20, 0.45),
  anims,
  sound: 'asgard-choeurs',
  modifiers: { chainesRebonds: 1 },
  unlock: { type: 'vagues', value: 10 },
  mute: { sat: 0.78, lum: 0.88 },
});

export default asgardBifrost;
