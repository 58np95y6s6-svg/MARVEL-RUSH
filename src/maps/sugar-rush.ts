// Sugar Rush (Vanellope & Ralph) : piste de course en bonbons, montagnes de gâteaux,
// sucettes, glitchs de pixels.

import {
  type Ctx, type Painter, INK, SW, across, at, cel, circleS, defineMap, flat, gloss, groundShadow, n1, pathS, rectS,
  scene, spots, sparkle,
} from './kit';

const pal = {
  bg: '#2a1530',
  sky1: '#f2a6c8', sky2: '#fbe0ea',
  ground: '#c99070', ground2: '#b88060',
  path: '#f6e8f0', pathEdge: '#c46a8a', pathDeco: '#e8507a',
  frame: '#f08ab0', frameLight: '#ffd0e2', frameShade: '#b04a78',
  cellA: '#fff6f8', cellB: '#fbe4ec',
  accent: '#5ad8c8', portal: '#5ad8c8',
  choco: '#7a4a32', mint: '#7ad8b8', pink: '#f08ab0', lemon: '#f6d65a', grape: '#9a6ad0',
};

const lollipop = (col: string): Painter => (x, y, s) =>
  groundShadow(x, y, 20 * s) + flat(rectS(x - 4 * s, y - 120 * s, 8 * s, 120 * s, 3), '#f4f0e6', SW * 0.7) +
  cel(circleS(x, y - 140 * s, 38 * s), col, { gloss: null }) +
  `<path d="M${x} ${n1(y - 140 * s)} m${n1(-26 * s)} 0 a${n1(26 * s)} ${n1(26 * s)} 0 1 1 ${n1(26 * s)} ${n1(26 * s)} a${n1(16 * s)} ${n1(16 * s)} 0 1 1 ${n1(-16 * s)} ${n1(-16 * s)}" stroke="#fff" stroke-width="${n1(7 * s)}" fill="none" opacity=".8"/>` +
  gloss(x - 14 * s, y - 160 * s, 9 * s, 5 * s);

const cupcake: Painter = (x, y, s) =>
  groundShadow(x, y, 30 * s) + cel(pathS(`M${n1(x - 30 * s)} ${n1(y - 40 * s)} L${n1(x + 30 * s)} ${n1(y - 40 * s)} L${n1(x + 22 * s)} ${n1(y)} L${n1(x - 22 * s)} ${n1(y)}Z`), pal.pink, { dx: 6, dy: 0 }) +
  cel(pathS(`M${n1(x - 34 * s)} ${n1(y - 40 * s)} Q${n1(x - 36 * s)} ${n1(y - 66 * s)} ${n1(x - 10 * s)} ${n1(y - 68 * s)} Q${n1(x)} ${n1(y - 92 * s)} ${n1(x + 12 * s)} ${n1(y - 68 * s)} Q${n1(x + 36 * s)} ${n1(y - 66 * s)} ${n1(x + 34 * s)} ${n1(y - 40 * s)}Z`), '#fff2e6', { dx: 6, dy: 6 }) +
  flat(circleS(x, y - 88 * s, 9 * s), '#e0483a', SW * 0.6) +
  [[-16, -52, pal.mint], [10, -56, pal.lemon], [-2, -46, pal.grape]].map(([dx, dy, col]) => `<rect x="${n1(x + (dx as number) * s)}" y="${n1(y + (dy as number) * s)}" width="${n1(8 * s)}" height="${n1(3 * s)}" rx="1.5" fill="${col}"/>`).join('');

const candy: Painter = (x, y, s) =>
  groundShadow(x, y, 22 * s) + cel(circleS(x, y - 14 * s, 14 * s), pal.lemon, { gloss: null }) +
  flat(pathS(`M${n1(x - 14 * s)} ${n1(y - 14 * s)} L${n1(x - 28 * s)} ${n1(y - 24 * s)} L${n1(x - 28 * s)} ${n1(y - 4 * s)}Z`), pal.lemon, SW * 0.6) +
  flat(pathS(`M${n1(x + 14 * s)} ${n1(y - 14 * s)} L${n1(x + 28 * s)} ${n1(y - 24 * s)} L${n1(x + 28 * s)} ${n1(y - 4 * s)}Z`), pal.lemon, SW * 0.6);

const candyCane: Painter = (x, y, s) =>
  groundShadow(x, y, 16 * s) +
  `<path d="M${x} ${y} L${x} ${n1(y - 80 * s)} Q${x} ${n1(y - 110 * s)} ${n1(x + 22 * s)} ${n1(y - 110 * s)} Q${n1(x + 44 * s)} ${n1(y - 110 * s)} ${n1(x + 44 * s)} ${n1(y - 88 * s)}" stroke="${INK}" stroke-width="${n1(20 * s)}" fill="none" stroke-linecap="round"/>` +
  `<path d="M${x} ${y} L${x} ${n1(y - 80 * s)} Q${x} ${n1(y - 110 * s)} ${n1(x + 22 * s)} ${n1(y - 110 * s)} Q${n1(x + 44 * s)} ${n1(y - 110 * s)} ${n1(x + 44 * s)} ${n1(y - 88 * s)}" stroke="#fff" stroke-width="${n1(13 * s)}" fill="none" stroke-linecap="round"/>` +
  `<path d="M${x} ${y} L${x} ${n1(y - 80 * s)} Q${x} ${n1(y - 110 * s)} ${n1(x + 22 * s)} ${n1(y - 110 * s)} Q${n1(x + 44 * s)} ${n1(y - 110 * s)} ${n1(x + 44 * s)} ${n1(y - 88 * s)}" stroke="#e0483a" stroke-width="${n1(13 * s)}" fill="none" stroke-dasharray="${n1(10 * s)} ${n1(10 * s)}"/>`;

function cakes(base: number): string {
  let s = '';
  for (const [x, w, h, col] of [[120, 220, 150, pal.choco], [400, 260, 200, '#f6e8d8'], [720, 240, 170, pal.pink], [950, 200, 130, pal.choco]] as const) {
    s += cel(pathS(`M${x - w / 2} ${base + 20} L${x - w / 2 + 20} ${base - h} Q${x} ${base - h - 30} ${x + w / 2 - 20} ${base - h} L${x + w / 2} ${base + 20}Z`), col, { dx: 18, dy: 0, sw: SW * 0.8 });
    s += `<path d="M${x - w / 2 + 18} ${base - h + 4} Q${x - w / 4} ${base - h + 30} ${x} ${base - h + 10} T${x + w / 2 - 18} ${base - h + 6}" stroke="#fff" stroke-width="14" fill="none" stroke-linecap="round" opacity=".9"/>`;
    s += `<circle cx="${x}" cy="${base - h - 22}" r="14" fill="#e0483a" stroke="${INK}" stroke-width="4"/>`;
  }
  return s;
}

function backdrop(c: Ctx): string {
  return scene(c, {
    texture: 'spots', pad: '#e8b8a0', padMargin: 0.9,
    horizon: (base) => cakes(base) + cel(rectS(-20, base, 1040, 26, 0), '#f6e8d8', { dx: 0, dy: 8 }),
    after: Array.from({ length: 40 }, (_, i) => {
      const x = (i * 149) % 1000, y = horizonOf(c) + 40 + ((i * 337) % (1560 - horizonOf(c)));
      return `<rect x="${x}" y="${y}" width="12" height="4" rx="2" fill="${[pal.mint, pal.lemon, pal.grape, '#fff'][i % 4]}" transform="rotate(${(i * 47) % 180} ${x} ${y})"/>`;
    }).join(''),
  });
}
const horizonOf = (c: Ctx) => (c.mode === 'solo' ? 270 : 118);

function anims(c: Ctx) {
  const [a, b, d, e, f] = spots(c);
  const glitch = (x: number, y: number) =>
    [[-20, -14, '#5ad8c8'], [0, -6, '#f08ab0'], [12, 8, '#f6d65a'], [-8, 14, '#9a6ad0'], [20, -18, '#fff']].map(([dx, dy, col]) => `<rect x="${x + (dx as number)}" y="${y + (dy as number)}" width="12" height="12" fill="${col}" stroke="${INK}" stroke-width="2"/>`).join('');
  const swirl = (x: number, y: number) => cel(circleS(x, y, 26), pal.mint, { gloss: null }) + `<path d="M${x} ${y} m-18 0 a18 18 0 1 1 18 18 a11 11 0 1 1 -11 -11" stroke="#fff" stroke-width="6" fill="none"/>`;
  return [
    at('Glitchs de pixels', 'blink', a, 34, glitch(a.x, a.y), { period: 0.9, min: 0 }),
    at('Glitchs de pixels', 'blink', e, 34, glitch(e.x, e.y), { period: 1.3, min: 0, phase: 0.5 }),
    at('Sucettes qui tournent', 'spin', b, 32, swirl(b.x, b.y), { period: 3 }),
    at('Sucettes qui tournent', 'spin', d, 32, swirl(d.x, d.y), { period: 3.6 }),
    at('Étincelles de sucre', 'pulse', f, 24, sparkle(f.x, f.y, 16, '#fff'), { period: 1.4, amp: 0.3 }),
    across('Glitchs de pixels', c.mode === 'solo' ? 1150 : 1330, 9, (x, y) => glitch(x, y - 10), { w: 60, h: 46 }, { phase: 0.3 }),
  ];
}

export const sugarRush = defineMap({
  id: 'sugar-rush',
  name: 'Sugar Rush',
  tagline: 'La piste en bonbons, attention aux glitchs !',
  universe: 'disney',
  heroes: ['vanralph'],
  shape: 'zigzag',
  pathMaterial: 'Piste de course en bonbons',
  pathKind: 'candy',
  frameKind: 'candy',
  palette: pal,
  backdrop,
  props: { big: [lollipop(pal.mint), lollipop(pal.grape), candyCane], med: [cupcake, candyCane], small: [candy, candy] },
  gate: (x, y, s) => groundShadow(x, y, 66 * s) +
    cel(pathS(`M${n1(x - 60 * s)} ${n1(y)} L${n1(x - 56 * s)} ${n1(y - 90 * s)} Q${n1(x)} ${n1(y - 130 * s)} ${n1(x + 56 * s)} ${n1(y - 90 * s)} L${n1(x + 60 * s)} ${n1(y)}Z`), pal.choco, { dx: 10, dy: 0 }) +
    `<path d="M${n1(x - 58 * s)} ${n1(y - 86 * s)} Q${n1(x - 30 * s)} ${n1(y - 70 * s)} ${n1(x)} ${n1(y - 86 * s)} T${n1(x + 58 * s)} ${n1(y - 86 * s)}" stroke="#fff" stroke-width="${n1(12 * s)}" fill="none" stroke-linecap="round"/>` +
    flat(pathS(`M${n1(x - 26 * s)} ${n1(y)} L${n1(x - 26 * s)} ${n1(y - 50 * s)} Q${n1(x)} ${n1(y - 72 * s)} ${n1(x + 26 * s)} ${n1(y - 50 * s)} L${n1(x + 26 * s)} ${n1(y)}Z`), '#3a2018'),
  anims,
  sound: 'course-8bits',
  modifiers: { bouclierCoups: -1 },
  unlock: { type: 'vagues', value: 55 },
  mute: { sat: 0.72, lum: 0.88 },
});

export default sugarRush;
