// Chambre d'Andy (Buzz & Woody) : circuit de petites voitures, lit, cubes, papier peint à
// nuages, jouets qui bougent.

import {
  type Ctx, type Painter, INK, SW, across, at, cel, circleS, cloud, defineMap, flat, gloss, groundShadow, n1,
  pathS, rectS, scene, spots,
} from './kit';

const pal = {
  bg: '#1d2c4a',
  sky1: '#7ab4e8', sky2: '#9cc8ee',
  ground: '#b58a5e', ground2: '#a87e54',
  path: '#f08a3a', pathEdge: '#a8521e', pathDeco: '#5a6274',
  frame: '#e04a3a', frameLight: '#f6c64a', frameShade: '#9a2a24',
  cellA: '#fbf6ec', cellB: '#efe4d0',
  accent: '#f6c64a', portal: '#7ad86a',
  red: '#e04a3a', yellow: '#f6c64a', blue: '#3c8bf0', green: '#5ab85a', bed: '#5a7ab8',
};

const block = (col: string, letter: string): Painter => (x, y, s) =>
  groundShadow(x, y, 30 * s) + cel(rectS(x - 26 * s, y - 52 * s, 52 * s, 52 * s, 8 * s), col, { dx: 10, dy: 0 }) +
  `<rect x="${n1(x - 17 * s)}" y="${n1(y - 43 * s)}" width="${n1(34 * s)}" height="${n1(34 * s)}" rx="5" fill="#fff" opacity=".85"/>` +
  `<text x="${x}" y="${n1(y - 16 * s)}" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="${n1(26 * s)}" fill="${col}">${letter}</text>`;

const bed: Painter = (x, y, s) =>
  groundShadow(x, y, 80 * s, 14 * s) +
  cel(rectS(x - 74 * s, y - 70 * s, 148 * s, 70 * s, 10 * s), '#9a6a42', { dx: 0, dy: 8 }) +
  cel(rectS(x - 70 * s, y - 96 * s, 140 * s, 40 * s, 14 * s), pal.bed, { dx: 0, dy: 8 }) +
  cel(rectS(x - 64 * s, y - 112 * s, 48 * s, 24 * s, 10 * s), '#f4f0e6', { dx: 0, dy: 5 }) +
  cel(rectS(x - 84 * s, y - 150 * s, 18 * s, 150 * s, 6 * s), '#9a6a42', { dx: 5, dy: 0 }) +
  [0, 1, 2].map((i) => `<circle cx="${n1(x - 20 * s + i * 34 * s)}" cy="${n1(y - 76 * s)}" r="${n1(6 * s)}" fill="#f4f0e6" opacity=".7"/>`).join('');

const ball: Painter = (x, y, s) =>
  groundShadow(x, y, 26 * s) + cel(circleS(x, y - 26 * s, 26 * s), pal.red, { gloss: null }) +
  `<path d="M${n1(x - 26 * s)} ${n1(y - 26 * s)} Q${n1(x)} ${n1(y - 14 * s)} ${n1(x + 26 * s)} ${n1(y - 26 * s)}" stroke="${pal.yellow}" stroke-width="${n1(8 * s)}" fill="none"/>` +
  `<circle cx="${x}" cy="${n1(y - 26 * s)}" r="${n1(8 * s)}" fill="${pal.blue}" stroke="${INK}" stroke-width="3"/>` + gloss(x - 10 * s, y - 40 * s, 7 * s, 4 * s);

const rocket: Painter = (x, y, s) =>
  groundShadow(x, y, 26 * s) + cel(pathS(`M${n1(x - 18 * s)} ${n1(y - 14 * s)} L${n1(x - 18 * s)} ${n1(y - 80 * s)} Q${n1(x)} ${n1(y - 130 * s)} ${n1(x + 18 * s)} ${n1(y - 80 * s)} L${n1(x + 18 * s)} ${n1(y - 14 * s)}Z`), '#eef1f6', { dx: 7, dy: 0 }) +
  cel(pathS(`M${n1(x - 18 * s)} ${n1(y - 40 * s)} L${n1(x - 36 * s)} ${n1(y)} L${n1(x - 18 * s)} ${n1(y - 14 * s)}Z`), pal.red, { dx: 4, dy: 0 }) +
  cel(pathS(`M${n1(x + 18 * s)} ${n1(y - 40 * s)} L${n1(x + 36 * s)} ${n1(y)} L${n1(x + 18 * s)} ${n1(y - 14 * s)}Z`), pal.red, { dx: 4, dy: 0 }) +
  flat(circleS(x, y - 72 * s, 9 * s), pal.blue, SW * 0.6);

const crayon: Painter = (x, y, s) =>
  groundShadow(x, y, 26 * s) + cel(rectS(x - 30 * s, y - 12 * s, 48 * s, 12 * s, 3), pal.green, { dx: 0, dy: 4 }) +
  flat(pathS(`M${n1(x + 18 * s)} ${n1(y - 12 * s)} L${n1(x + 32 * s)} ${n1(y - 6 * s)} L${n1(x + 18 * s)} ${n1(y)}Z`), '#f4e0b8', SW * 0.6);

function wall(base: number): string {
  // papier peint bleu à nuages blancs (sans plinthe en bas)
  let s = `<rect x="-10" y="0" width="1020" height="${base}" fill="#7ab4e8"/>`;
  for (const [x, y, k] of [[110, base - 170, 0.9], [420, base - 210, 0.7], [700, base - 150, 0.8], [930, base - 220, 0.6], [270, base - 70, 0.6], [590, base - 60, 0.7], [860, base - 60, 0.5]] as const)
    s += cloud(x, y, k, '#ffffff');
  s += cel(rectS(-20, base - 14, 1040, 34, 0), '#f4f0e6', { dx: 0, dy: 10 });
  return s;
}

function backdrop(c: Ctx): string {
  return scene(c, {
    texture: 'none', pad: '#5a7ab8', padMargin: 0.95,
    horizon: wall,
    after: Array.from({ length: 40 }, (_, i) => `<line x1="-10" y1="${horizonOf(c) + 20 + i * 40}" x2="1010" y2="${horizonOf(c) + 20 + i * 40}" stroke="${pal.ground2}" stroke-width="4"/>`).join('') +
      c.boards.map((b) => { const g = b.grid, m = b.cell * 0.95; return `<rect x="${g.x - m + 18}" y="${g.y - m + 18}" width="${g.w + 2 * m - 36}" height="${g.h + 2 * m - 36}" rx="${b.cell * 0.35}" fill="none" stroke="#f6c64a" stroke-width="10" opacity=".7"/>`; }).join(''),
  });
}
const horizonOf = (c: Ctx) => (c.mode === 'solo' ? 270 : 118);

function anims(c: Ctx) {
  const [a, b, d, e] = spots(c);
  const top = (x: number, y: number) =>
    cel(pathS(`M${x - 26} ${y - 4} Q${x} ${y - 30} ${x + 26} ${y - 4} L${x} ${y + 26}Z`), pal.yellow) +
    `<path d="M${x - 22} ${y - 6} L${x + 22} ${y - 6}" stroke="${pal.red}" stroke-width="6"/><rect x="${x - 3}" y="${y - 32}" width="6" height="14" fill="${INK}"/>`;
  const car = (x: number, y: number) =>
    groundShadow(x, y + 12, 24, 6) + cel(rectS(x - 24, y - 8, 48, 18, 8), pal.blue, { dx: 0, dy: 4, sw: 4 }) +
    `<rect x="${x - 8}" y="${y - 18}" width="20" height="12" rx="4" fill="#bfe4f6" stroke="${INK}" stroke-width="3"/>` +
    flat(circleS(x - 14, y + 10, 6), '#2b2540', 3) + flat(circleS(x + 14, y + 10, 6), '#2b2540', 3);
  return [
    at('Jouets qui bougent', 'sway', a, 40, top(a.x, a.y), { period: 0.9, amp: 10, oy: a.y + 26 }),
    at('Jouets qui bougent', 'bob', b, 40, ball(b.x, b.y + 26, 0.85, () => 0), { period: 1.2, amp: 10 }),
    across('Voiture téléguidée', c.mode === 'solo' ? 1135 : 1320, 7, car, { w: 60, h: 36 }),
    at('Jouets qui bougent', 'sway', d, 34, block(pal.green, 'B')(d.x, d.y + 26, 0.8, () => 0), { period: 1.6, amp: 5, oy: d.y + 26 }),
    at('Jouets qui bougent', 'pulse', e, 24, `<path d="M${e.x} ${e.y - 18} l5 11 h12 l-9 8 l4 12 l-12 -7 l-12 7 l4 -12 l-9 -8 h12z" fill="${pal.yellow}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`, { period: 2, amp: 0.12 }),
  ];
}

export const chambreAndy = defineMap({
  id: 'chambre-andy',
  name: 'Chambre d\'Andy',
  tagline: 'Quand Andy n\'est pas là, les jouets s\'animent.',
  universe: 'disney',
  heroes: ['buzzwoody'],
  shape: 'wave',
  pathMaterial: 'Circuit de petites voitures',
  pathKind: 'toytrack',
  frameKind: 'toy',
  palette: pal,
  backdrop,
  props: { big: [bed, rocket], med: [block(pal.red, 'A'), block(pal.blue, 'C'), ball], small: [crayon, block(pal.yellow, 'D'), crayon] },
  gate: (x, y, s) => groundShadow(x, y, 66 * s) +
    cel(rectS(x - 60 * s, y - 100 * s, 120 * s, 100 * s, 8 * s), '#c9a46a', { dx: 12, dy: 0 }) +
    flat(pathS(`M${n1(x - 26 * s)} ${n1(y)} L${n1(x - 26 * s)} ${n1(y - 50 * s)} Q${n1(x)} ${n1(y - 76 * s)} ${n1(x + 26 * s)} ${n1(y - 50 * s)} L${n1(x + 26 * s)} ${n1(y)}Z`), '#5a3a2a') +
    [0, 1, 2].map((i) => flat(rectS(x - 60 * s + i * 44 * s, y - 116 * s, 32 * s, 18 * s, 4), [pal.red, pal.yellow, pal.blue][i]!, SW * 0.6)).join(''),
  anims,
  sound: 'jouets-joyeux',
  unlock: { type: 'vagues', value: 50 },
  mute: { sat: 0.74, lum: 0.9 },
});

export default chambreAndy;

