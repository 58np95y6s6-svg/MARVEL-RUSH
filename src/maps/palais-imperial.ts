// Palais impérial (Mulan) : pavés de la Cité interdite, toits rouges, lanternes, cerisiers,
// feux d'artifice.

import {
  type Ctx, type Painter, INK, SW, across, at, cel, circleS, defineMap, flat, gloss, groundShadow, n1, pathS, polyS,
  rectS, scene, spots, peaks, sparkle,
} from './kit';

const pal = {
  bg: '#2a1520',
  sky1: '#3a2550', sky2: '#d98a6a',
  ground: '#8a6a5a', ground2: '#7c5e50',
  path: '#c9bfae', pathEdge: '#857a68', pathDeco: '#ada290',
  frame: '#b8463a', frameLight: '#e07a62', frameShade: '#7a2a24',
  cellA: '#f6efe4', cellB: '#eadfcd',
  accent: '#e8b84a', portal: '#ff8a5c',
  roof: '#b8463a', tile: '#e2b14a', wall: '#d9c6a0', blossom: '#f2b2c4', lantern: '#e0483a',
};

export const cherry: Painter = (x, y, s) =>
  groundShadow(x, y, 44 * s) +
  cel(pathS(`M${n1(x - 8 * s)} ${n1(y)} Q${n1(x - 4 * s)} ${n1(y - 60 * s)} ${n1(x - 30 * s)} ${n1(y - 100 * s)} L${n1(x - 20 * s)} ${n1(y - 106 * s)} Q${n1(x + 4 * s)} ${n1(y - 76 * s)} ${n1(x + 10 * s)} ${n1(y - 100 * s)} L${n1(x + 18 * s)} ${n1(y - 96 * s)} Q${n1(x + 10 * s)} ${n1(y - 50 * s)} ${n1(x + 10 * s)} ${n1(y)}Z`), '#6e4636', { dx: 4, dy: 0 }) +
  cel(circleS(x - 36 * s, y - 112 * s, 34 * s), pal.blossom) + cel(circleS(x + 26 * s, y - 116 * s, 32 * s), pal.blossom) +
  cel(circleS(x - 4 * s, y - 142 * s, 38 * s), pal.blossom, { gloss: null }) + gloss(x - 18 * s, y - 158 * s, 12 * s, 6 * s);

const lanternPost: Painter = (x, y, s) =>
  groundShadow(x, y, 20 * s) + flat(rectS(x - 5 * s, y - 110 * s, 10 * s, 110 * s, 3), '#5a3328', SW * 0.7) +
  flat(rectS(x - 5 * s, y - 112 * s, 42 * s, 8 * s, 3), '#5a3328', SW * 0.7) +
  cel(pathS(`M${n1(x + 32 * s)} ${n1(y - 100 * s)} Q${n1(x + 54 * s)} ${n1(y - 80 * s)} ${n1(x + 32 * s)} ${n1(y - 58 * s)} Q${n1(x + 10 * s)} ${n1(y - 80 * s)} ${n1(x + 32 * s)} ${n1(y - 100 * s)}Z`), pal.lantern) +
  `<path d="M${n1(x + 32 * s)} ${n1(y - 58 * s)} v${n1(14 * s)}" stroke="${pal.tile}" stroke-width="4"/>`;

const lion: Painter = (x, y, s) =>
  groundShadow(x, y, 30 * s) + cel(rectS(x - 26 * s, y - 20 * s, 52 * s, 20 * s, 4), '#9a948a', { dx: 0, dy: 5 }) +
  cel(pathS(`M${n1(x - 20 * s)} ${n1(y - 20 * s)} Q${n1(x - 24 * s)} ${n1(y - 70 * s)} ${n1(x)} ${n1(y - 76 * s)} Q${n1(x + 24 * s)} ${n1(y - 70 * s)} ${n1(x + 20 * s)} ${n1(y - 20 * s)}Z`), '#b0aa9e', { dx: 7, dy: 0 }) +
  [-8, 8].map((d) => `<circle cx="${n1(x + d * s)}" cy="${n1(y - 56 * s)}" r="${n1(3.5 * s)}" fill="${INK}"/>`).join('') +
  `<path d="M${n1(x - 8 * s)} ${n1(y - 42 * s)} q8 6 16 0" stroke="${INK}" stroke-width="3" fill="none"/>`;

const vase: Painter = (x, y, s) =>
  groundShadow(x, y, 18 * s) + cel(pathS(`M${n1(x - 10 * s)} ${n1(y)} Q${n1(x - 24 * s)} ${n1(y - 22 * s)} ${n1(x - 8 * s)} ${n1(y - 40 * s)} L${n1(x + 8 * s)} ${n1(y - 40 * s)} Q${n1(x + 24 * s)} ${n1(y - 22 * s)} ${n1(x + 10 * s)} ${n1(y)}Z`), '#e8e2d6', { dx: 5, dy: 0 }) +
  `<path d="M${n1(x - 12 * s)} ${n1(y - 20 * s)} h${n1(24 * s)}" stroke="#3c6fc4" stroke-width="4"/>`;

function palaceRow(base: number): string {
  let s = '';
  const hall = (x: number, w: number, h: number) =>
    cel(rectS(x - w / 2, base - h, w, h + 20, 4), pal.wall, { dx: 12, dy: 0, sw: SW * 0.8 }) +
    Array.from({ length: Math.floor(w / 40) }, (_, i) => `<rect x="${x - w / 2 + 12 + i * 40}" y="${base - h + 20}" width="16" height="${h - 20}" fill="${pal.roof}" opacity=".85"/>`).join('') +
    cel(pathS(`M${x - w * 0.66} ${base - h + 6} Q${x - w * 0.55} ${base - h - 6} ${x - w * 0.42} ${base - h - 40} L${x + w * 0.42} ${base - h - 40} Q${x + w * 0.55} ${base - h - 6} ${x + w * 0.66} ${base - h + 6}Z`), pal.tile, { dx: 0, dy: 10, sw: SW * 0.8 });
  s += hall(150, 200, 60) + hall(850, 200, 60) + hall(500, 300, 90);
  return s;
}

function backdrop(c: Ctx): string {
  return scene(c, {
    texture: 'tiles', pad: '#a08474', padMargin: 0.9,
    horizon: (base) => peaks(base - 40, '#6e5a7e', 120, 'palais', 6) + palaceRow(base) + cel(rectS(-20, base, 1040, 26, 0), pal.roof, { dx: 0, dy: 8 }),
  });
}

function anims(c: Ctx) {
  const [a, b, d, e, f, g] = spots(c);
  const fw = (x: number, y: number, col: string) =>
    [0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const ang = (i * Math.PI) / 4; return `<line x1="${n1(x + Math.cos(ang) * 10)}" y1="${n1(y + Math.sin(ang) * 10)}" x2="${n1(x + Math.cos(ang) * 30)}" y2="${n1(y + Math.sin(ang) * 30)}" stroke="${col}" stroke-width="6" stroke-linecap="round"/>`; }).join('') + sparkle(x, y, 10, '#fff');
  const lantern = (x: number, y: number) => `<line x1="${x}" y1="${y - 34}" x2="${x}" y2="${y - 22}" stroke="${INK}" stroke-width="3"/>` + cel(pathS(`M${x} ${y - 24} Q${x + 22} ${y} ${x} ${y + 24} Q${x - 22} ${y} ${x} ${y - 24}Z`), pal.lantern) + `<circle cx="${x}" cy="${y}" r="7" fill="#ffd27a" opacity=".8"/>`;
  const petal = (x: number, y: number) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="5" fill="${pal.blossom}" stroke="${INK}" stroke-width="2"/><ellipse cx="${x + 30}" cy="${y + 14}" rx="7" ry="4" fill="${pal.blossom}" stroke="${INK}" stroke-width="2"/>`;
  return [
    at('Feux d\'artifice', 'pulse', e, 40, fw(e.x, e.y, '#f6c64a'), { period: 1.8, amp: 0.25 }),
    at('Feux d\'artifice', 'blink', f, 40, fw(f.x, f.y, '#ff7a8a'), { period: 2.3, min: 0, phase: 0.4 }),
    at('Feux d\'artifice', 'blink', g, 40, fw(g.x, g.y, '#8ad0ff'), { period: 2.9, min: 0, phase: 0.7 }),
    at('Lanternes', 'sway', a, 40, lantern(a.x, a.y), { period: 3, amp: 8, oy: a.y - 34 }),
    at('Lanternes', 'sway', b, 40, lantern(b.x, b.y), { period: 3.4, amp: 8, oy: b.y - 34, phase: 0.5 }),
    across('Pétales de cerisier', d.y - 20, 15, (x, y) => petal(x, y), { w: 60, h: 40 }, { x0: c.mode === 'solo' ? 160 : 180, x1: c.mode === 'solo' ? 820 : 420 }),
  ];
}

export const palaisImperial = defineMap({
  id: 'palais-imperial',
  name: 'Palais impérial',
  tagline: 'Les pavés de la Cité interdite, un soir de fête.',
  universe: 'disney',
  heroes: ['mulan'],
  shape: 'steps',
  pathMaterial: 'Pavés de la Cité interdite',
  pathKind: 'cobble',
  frameKind: 'stone',
  palette: pal,
  backdrop,
  props: { big: [cherry, lanternPost, cherry], med: [lion, lanternPost], small: [vase, vase] },
  gate: (x, y, s) => groundShadow(x, y, 70 * s) +
    cel(rectS(x - 60 * s, y - 100 * s, 120 * s, 100 * s, 4), pal.roof, { dx: 12, dy: 0 }) +
    flat(pathS(`M${n1(x - 26 * s)} ${n1(y)} L${n1(x - 26 * s)} ${n1(y - 56 * s)} Q${n1(x)} ${n1(y - 80 * s)} ${n1(x + 26 * s)} ${n1(y - 56 * s)} L${n1(x + 26 * s)} ${n1(y)}Z`), '#3a1d1a') +
    cel(polyS([{ x: x - 84 * s, y: y - 96 * s }, { x: x - 52 * s, y: y - 132 * s }, { x: x + 52 * s, y: y - 132 * s }, { x: x + 84 * s, y: y - 96 * s }]), pal.tile, { dx: 0, dy: 8 }),
  anims,
  sound: 'palais-cordes',
  modifiers: { brulures: 0.1 },
  unlock: { type: 'vagues', value: 35 },
  mute: { sat: 0.72, lum: 0.86 },
});

export default palaisImperial;
