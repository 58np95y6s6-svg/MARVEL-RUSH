// Arène de Galactus : planète dévorée, dans l'espace. Planète qui se fissure, étoiles, nébuleuse
// violette. Pendant le boss : fond qui tourne lentement, débris qui flottent, écran qui tremble.

import { type Ctx, type Painter, INK, at, cel, circleS, defineMap, glow, groundShadow, n1, polyS, scene, spots, stars, sparkle } from './kit';

const pal = {
  bg: '#0a0618',
  sky1: '#0e0828', sky2: '#3a1a5a',
  ground: '#2a2046', ground2: '#33285a',
  path: '#8a7aa8', pathEdge: '#4a3e6a', pathDeco: '#c8a6ff',
  frame: '#5a4e86', frameLight: '#9a8ac8', frameShade: '#352a5a',
  cellA: '#f0eef8', cellB: '#dedaee',
  accent: '#9b59e6', portal: '#c86aff',
  nebula: '#9b59e6', lava: '#f2803a', rock: '#5a4e70',
};

const crystalRock: Painter = (x, y, s) =>
  groundShadow(x, y, 40 * s) + cel(polyS([{ x: x - 40 * s, y }, { x: x - 30 * s, y: y - 40 * s }, { x: x - 4 * s, y: y - 50 * s }, { x: x + 30 * s, y: y - 30 * s }, { x: x + 40 * s, y }]), pal.rock, { dx: 8, dy: 0 }) +
  cel(polyS([{ x: x - 10 * s, y: y - 40 * s }, { x: x - 2 * s, y: y - 100 * s }, { x: x + 12 * s, y: y - 44 * s }]), '#c8a6ff', { dx: 4, dy: 0 });

const crater: Painter = (x, y, s) =>
  `<ellipse cx="${x}" cy="${n1(y - 10 * s)}" rx="${n1(44 * s)}" ry="${n1(16 * s)}" fill="#1e1638" stroke="${INK}" stroke-width="5"/><ellipse cx="${x}" cy="${n1(y - 6 * s)}" rx="${n1(30 * s)}" ry="${n1(9 * s)}" fill="${pal.lava}" opacity=".6"/>`;

const meteor: Painter = (x, y, s) => groundShadow(x, y, 26 * s) + cel(circleS(x, y - 24 * s, 24 * s), pal.rock) + `<circle cx="${n1(x + 6 * s)}" cy="${n1(y - 30 * s)}" r="${n1(6 * s)}" fill="#3a3050"/>`;

function planet(base: number): string {
  const cx = 500, cy = base - 40, r = 210;
  return `<circle cx="${cx}" cy="${cy}" r="${r + 40}" fill="${pal.nebula}" opacity=".18"/>` + cel(circleS(cx, cy, r), '#6a4a8a', { dx: 40, dy: 30 }) +
    `<path d="M${cx - 120} ${cy - 120} L${cx - 40} ${cy - 40} L${cx - 70} ${cy + 20} L${cx + 10} ${cy + 80} M${cx - 40} ${cy - 40} L${cx + 60} ${cy - 70} L${cx + 120} ${cy - 20}" stroke="${pal.lava}" stroke-width="10" fill="none" stroke-linejoin="round"/>` +
    `<path d="M${cx - 120} ${cy - 120} L${cx - 40} ${cy - 40} L${cx - 70} ${cy + 20} L${cx + 10} ${cy + 80} M${cx - 40} ${cy - 40} L${cx + 60} ${cy - 70} L${cx + 120} ${cy - 20}" stroke="#ffd08a" stroke-width="3" fill="none"/>`;
}

function backdrop(c: Ctx): string {
  return scene(c, {
    texture: 'spots', pad: '#3a2e60', padMargin: 0.9,
    horizon: (base) => stars(c, 70, { x: 0, y: 0, w: 1000, h: base }) + `<ellipse cx="200" cy="${base - 120}" rx="260" ry="90" fill="${pal.nebula}" opacity=".22"/><ellipse cx="820" cy="${base - 200}" rx="200" ry="70" fill="#e86ab0" opacity=".18"/>` + planet(base),
    after: stars(c, 50, { x: 0, y: c.mode === 'solo' ? 300 : 150, w: 1000, h: 1300 }, '#c8b8ff'),
  });
}

function anims(c: Ctx) {
  const [a, b, d, e, f] = spots(c);
  const rock = (p: { x: number; y: number }, r: number) => cel(polyS([{ x: p.x - r, y: p.y }, { x: p.x - r * 0.4, y: p.y - r }, { x: p.x + r * 0.8, y: p.y - r * 0.6 }, { x: p.x + r, y: p.y + r * 0.4 }, { x: p.x, y: p.y + r }]), pal.rock, { dx: 3, dy: 3, sw: 4 });
  return [
    at('Débris qui flottent', 'bob', a, 34, rock(a, 18), { period: 3.6, amp: 10 }),
    at('Débris qui flottent', 'spin', b, 28, rock(b, 14), { period: 8 }),
    at('Débris qui flottent', 'bob', d, 30, rock(d, 12), { period: 4.2, amp: 8, phase: 0.5 }),
    at('Étoiles qui scintillent', 'blink', e, 20, sparkle(e.x, e.y, 14, '#fff'), { period: 1.4, min: 0.1 }),
    at('Nébuleuse violette', 'pulse', f, 30, glow(f.x, f.y, 12, pal.nebula), { period: 3.2, amp: 0.2 }),
  ];
}

export const areneGalactus = defineMap({
  id: 'arene-galactus',
  name: 'Planète dévorée',
  tagline: 'Galactus a faim, et ce monde se fissure.',
  universe: 'boss',
  heroes: [],
  boss: 'galactus',
  shape: 'arch',
  pathMaterial: 'Roche cosmique fissurée',
  pathKind: 'cosmic',
  frameKind: 'cosmic',
  palette: pal,
  backdrop,
  props: { big: [crystalRock], med: [crater, meteor], small: [meteor, crater] },
  anims,
  sound: 'cosmos-grave',
  unlock: { type: 'depart', value: 0 },
  bossFx: { description: 'Le fond tourne lentement, des débris flottent, l\'écran tremble par moments.', effects: ['rotate-bg', 'debris', 'shake'] },
  mute: { sat: 0.78, lum: 0.88 },
});

export default areneGalactus;
