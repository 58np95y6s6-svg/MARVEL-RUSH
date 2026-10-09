// Arène du Bouffon Vert : New York, nuit d'Halloween, tour Oscorp. Pleine lune, citrouilles,
// chauves-souris. Pendant le boss : éclairs verts, explosions de citrouilles en fond.

import { type Ctx, type Painter, INK, across, at, cel, circleS, defineMap, flat, glow, groundShadow, n1, pathS, rectS, scene, spots, stars, SW } from './kit';

const pal = {
  bg: '#0e0c1c',
  sky1: '#141230', sky2: '#2e2a5a',
  ground: '#33304a', ground2: '#2c2942',
  path: '#a8a2b8', pathEdge: '#5a5470', pathDeco: '#6a7488',
  frame: '#6a6880', frameLight: '#9a98ae', frameShade: '#44425a',
  cellA: '#eeedf4', cellB: '#dcdae6',
  accent: '#6ae04a', portal: '#6ae04a',
  pumpkin: '#e8782a', goblin: '#6ae04a', moon: '#f4ecc8', tower: '#3a3a56',
};

const pumpkin: Painter = (x, y, s) =>
  groundShadow(x, y, 30 * s) + cel(pathS(`M${n1(x)} ${n1(y - 50 * s)} Q${n1(x - 40 * s)} ${n1(y - 52 * s)} ${n1(x - 36 * s)} ${n1(y - 22 * s)} Q${n1(x - 30 * s)} ${n1(y + 2 * s)} ${n1(x)} ${n1(y)} Q${n1(x + 30 * s)} ${n1(y + 2 * s)} ${n1(x + 36 * s)} ${n1(y - 22 * s)} Q${n1(x + 40 * s)} ${n1(y - 52 * s)} ${n1(x)} ${n1(y - 50 * s)}Z`), pal.pumpkin, { dx: 7, dy: 3 }) +
  `<path d="M${n1(x - 18 * s)} ${n1(y - 30 * s)} l6 -8 l6 8z M${n1(x + 6 * s)} ${n1(y - 30 * s)} l6 -8 l6 8z M${n1(x - 16 * s)} ${n1(y - 16 * s)} q16 10 32 0 l-4 6 q-12 6 -24 0z" fill="#ffd27a" stroke="${INK}" stroke-width="2"/>` +
  flat(rectS(x - 4 * s, y - 60 * s, 8 * s, 12 * s, 2), '#5a7a3a', SW * 0.6);

const gargoyle: Painter = (x, y, s) =>
  groundShadow(x, y, 30 * s) + cel(rectS(x - 26 * s, y - 20 * s, 52 * s, 20 * s, 3), '#5a586e', { dx: 0, dy: 5 }) +
  cel(pathS(`M${n1(x - 20 * s)} ${n1(y - 20 * s)} Q${n1(x - 26 * s)} ${n1(y - 66 * s)} ${n1(x)} ${n1(y - 70 * s)} Q${n1(x + 26 * s)} ${n1(y - 66 * s)} ${n1(x + 20 * s)} ${n1(y - 20 * s)}Z`), '#6a6880', { dx: 7, dy: 0 }) +
  `<path d="M${n1(x - 30 * s)} ${n1(y - 60 * s)} L${n1(x - 14 * s)} ${n1(y - 50 * s)} M${n1(x + 30 * s)} ${n1(y - 60 * s)} L${n1(x + 14 * s)} ${n1(y - 50 * s)}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>` +
  `<circle cx="${n1(x - 7 * s)}" cy="${n1(y - 50 * s)}" r="${n1(3 * s)}" fill="${pal.goblin}"/><circle cx="${n1(x + 7 * s)}" cy="${n1(y - 50 * s)}" r="${n1(3 * s)}" fill="${pal.goblin}"/>`;

const vent: Painter = (x, y, s) =>
  groundShadow(x, y, 26 * s) + cel(rectS(x - 20 * s, y - 50 * s, 40 * s, 50 * s, 6 * s), '#5a586e', { dx: 7, dy: 0 }) + cel(rectS(x - 26 * s, y - 60 * s, 52 * s, 12 * s, 4 * s), '#4a4860', { dx: 0, dy: 4 });

function oscorp(base: number): string {
  let s = `<circle cx="200" cy="${base - 170}" r="62" fill="${pal.moon}" stroke="${INK}" stroke-width="5"/><circle cx="180" cy="${base - 186}" r="10" fill="#e0d8b0"/><circle cx="222" cy="${base - 150}" r="7" fill="#e0d8b0"/>`;
  for (const [x, w, h] of [[-10, 110, 110], [100, 90, 150], [300, 100, 130], [700, 110, 140], [820, 90, 170], [910, 100, 110]] as const) {
    s += cel(rectS(x, base - h, w, h + 20, 4), '#2a2844', { dx: w * 0.2, dy: 0, sw: SW * 0.8 });
    for (let yy = base - h + 16; yy < base; yy += 24) for (let xx = x + 10; xx < x + w - 14; xx += 22) if (((xx * 3 + yy * 7) | 0) % 4 === 0) s += `<rect x="${xx}" y="${yy}" width="10" height="12" rx="2" fill="#f2d27a" opacity=".7"/>`;
  }
  // tour Oscorp
  s += cel(pathS(`M440 ${base + 20} L450 ${base - 250} L500 ${base - 300} L550 ${base - 250} L560 ${base + 20}Z`), pal.tower, { dx: 20, dy: 0 });
  s += `<rect x="470" y="${base - 230}" width="60" height="22" rx="4" fill="${pal.goblin}" opacity=".7" stroke="${INK}" stroke-width="4"/>`;
  for (let yy = base - 190; yy < base; yy += 30) s += `<rect x="465" y="${yy}" width="70" height="8" fill="#6a7aa8" opacity=".6"/>`;
  return s;
}

function backdrop(c: Ctx): string {
  return scene(c, { texture: 'none', pad: '#45425e', padMargin: 0.9, horizon: (base) => stars(c, 30, { x: 0, y: 0, w: 1000, h: base - 120 }) + oscorp(base) + cel(rectS(-20, base, 1040, 26, 0), '#5a586e', { dx: 0, dy: 8 }) });
}

function anims(c: Ctx) {
  const [a, b, , e, f] = spots(c);
  const bat = (x: number, y: number) => `<path d="M${x} ${y} q-10 -12 -26 -8 q8 4 6 12 q10 -6 20 -4 q10 -2 20 4 q-2 -8 6 -12 q-16 -4 -26 8z" fill="${INK}"/>`;
  return [
    across('Chauves-souris', c.mode === 'solo' ? 150 : 56, 9, (x, y) => bat(x, y) + bat(x + 40, y + 16) + bat(x + 20, y - 14), { w: 100, h: 50 }),
    at('Citrouilles qui luisent', 'pulse', a, 36, pumpkin(a.x, a.y + 26, 0.7, () => 0), { period: 1.6, amp: 0.06, oy: a.y + 26 }),
    at('Citrouilles qui luisent', 'blink', b, 36, glow(b.x, b.y, 10, pal.pumpkin), { period: 1.2, min: 0.4 }),
    at('Éclairs verts', 'blink', e, 34, `<path d="M${e.x} ${e.y - 30} L${e.x - 10} ${e.y} L${e.x + 2} ${e.y} L${e.x - 8} ${e.y + 30} L${e.x + 14} ${e.y - 6} L${e.x + 2} ${e.y - 6} L${e.x + 10} ${e.y - 30}Z" fill="${pal.goblin}" stroke="${INK}" stroke-width="3"/>`, { period: 2.7, min: 0 }),
    at('Éclairs verts', 'blink', f, 30, glow(f.x, f.y, 9, pal.goblin), { period: 3.1, min: 0, phase: 0.5 }),
  ];
}

export const areneBouffon = defineMap({
  id: 'arene-bouffon',
  name: 'Nuit d\'Halloween',
  tagline: 'Sur les toits, face à la tour Oscorp.',
  universe: 'boss',
  heroes: [],
  boss: 'bouffon',
  shape: 'steps',
  pathMaterial: 'Toits de New York, la nuit',
  pathKind: 'roof',
  frameKind: 'concrete',
  palette: pal,
  backdrop,
  props: { big: [gargoyle, vent], med: [pumpkin, vent, gargoyle], small: [pumpkin] },
  anims,
  sound: 'halloween-cuivres',
  unlock: { type: 'depart', value: 0 },
  bossFx: { description: 'Éclairs verts et explosions de citrouilles en fond.', effects: ['lightning', 'pumpkin-blasts'], tint: '#1a3a10', tintAlpha: 0.1 },
  mute: { sat: 0.75, lum: 0.88 },
});

export default areneBouffon;

void circleS;
