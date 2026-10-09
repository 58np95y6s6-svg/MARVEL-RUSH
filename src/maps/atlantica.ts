// Variante : Atlantica (Ariel, tracé de l'île de Motunui). Palais sous-marin, coraux, bulles.

import { type Ctx, type Painter, INK, SW, at, cel, circleS, defineMap, gloss, groundShadow, n1, pathS, rectS, scene, spots } from './kit';

const pal = {
  bg: '#0a2240',
  sky1: '#1f5a8a', sky2: '#3a8ab0',
  ground: '#2a6a8a', ground2: '#2f789a',
  path: '#e8d6b0', pathEdge: '#a08a64', pathDeco: '#f0b0a0',
  frame: '#e88a8a', frameLight: '#ffc0b8', frameShade: '#a85a62',
  cellA: '#eef8fa', cellB: '#d8ecf2',
  accent: '#5ad8c8', portal: '#9a7aff',
  coral: '#e8707a', coral2: '#f2a050', weed: '#4aa87a', pearl: '#f4f0f8',
};

export const coral = (col: string): Painter => (x, y, s) =>
  groundShadow(x, y, 30 * s) + `<path d="M${x} ${y} V${n1(y - 50 * s)} M${x} ${n1(y - 30 * s)} Q${n1(x - 26 * s)} ${n1(y - 40 * s)} ${n1(x - 26 * s)} ${n1(y - 70 * s)} M${x} ${n1(y - 40 * s)} Q${n1(x + 24 * s)} ${n1(y - 48 * s)} ${n1(x + 22 * s)} ${n1(y - 84 * s)} M${x} ${n1(y - 50 * s)} V${n1(y - 90 * s)}" stroke="${INK}" stroke-width="${n1(18 * s)}" fill="none" stroke-linecap="round"/>` +
  `<path d="M${x} ${y} V${n1(y - 50 * s)} M${x} ${n1(y - 30 * s)} Q${n1(x - 26 * s)} ${n1(y - 40 * s)} ${n1(x - 26 * s)} ${n1(y - 70 * s)} M${x} ${n1(y - 40 * s)} Q${n1(x + 24 * s)} ${n1(y - 48 * s)} ${n1(x + 22 * s)} ${n1(y - 84 * s)} M${x} ${n1(y - 50 * s)} V${n1(y - 90 * s)}" stroke="${col}" stroke-width="${n1(11 * s)}" fill="none" stroke-linecap="round"/>`;

export const seaweed: Painter = (x, y, s) =>
  [-10, 8].map((d, i) => `<path d="M${n1(x + d * s)} ${y} q${n1(-16 * s)} ${n1(-30 * s)} 0 ${n1(-60 * s)} t0 ${n1(-60 * s + i * 20 * s)}" stroke="${INK}" stroke-width="${n1(14 * s)}" fill="none" stroke-linecap="round"/><path d="M${n1(x + d * s)} ${y} q${n1(-16 * s)} ${n1(-30 * s)} 0 ${n1(-60 * s)} t0 ${n1(-60 * s + i * 20 * s)}" stroke="${pal.weed}" stroke-width="${n1(8 * s)}" fill="none" stroke-linecap="round"/>`).join('');

export const clam: Painter = (x, y, s) =>
  groundShadow(x, y, 24 * s) + cel(pathS(`M${n1(x - 24 * s)} ${n1(y - 6 * s)} Q${n1(x)} ${n1(y - 44 * s)} ${n1(x + 24 * s)} ${n1(y - 6 * s)}Z`), '#c9a0d8', { dx: 5, dy: 0 }) +
  cel(circleS(x, y - 10 * s, 8 * s), pal.pearl, { gloss: null }) + gloss(x - 3 * s, y - 13 * s, 3 * s, 2 * s);

function palace(base: number): string {
  let s = '';
  for (const [x, w, h] of [[300, 50, 120], [400, 60, 170], [500, 80, 230], [600, 60, 170], [700, 50, 120]] as const) {
    s += cel(rectS(x - w / 2, base - h, w, h + 20, w / 2), '#e8b06a', { dx: 8, dy: 0, sw: SW * 0.8 });
    s += cel(pathS(`M${x - w / 2 - 4} ${base - h + 20} Q${x} ${base - h - w} ${x + w / 2 + 4} ${base - h + 20}Z`), '#f2c88a', { dx: 6, dy: 0, sw: SW * 0.8 });
  }
  return s;
}

function backdrop(c: Ctx): string {
  return scene(c, {
    texture: 'spots', pad: '#e0cca0', padMargin: 0.9,
    horizon: (base) => `<path d="M100 0 L220 ${base} L320 ${base} L200 0Z M640 0 L700 ${base} L820 ${base} L760 0Z" fill="#cfefff" opacity=".18"/>` + palace(base),
  });
}

function anims(c: Ctx) {
  const [a, b, d, e] = spots(c);
  const bubbles = (x: number, y: number) => [[0, 20, 9], [14, 0, 6], [-8, -18, 5], [6, -32, 4]].map(([dx, dy, r]) => `<circle cx="${x + dx!}" cy="${y + dy!}" r="${r}" fill="#dff6ff" fill-opacity=".35" stroke="#eafaff" stroke-width="2.5"/>`).join('');
  const fish = (x: number, y: number, col: string) => `<path d="M${x - 18} ${y} Q${x} ${y - 14} ${x + 16} ${y} Q${x} ${y + 14} ${x - 18} ${y}Z M${x + 14} ${y} L${x + 28} ${y - 10} L${x + 28} ${y + 10}Z" fill="${col}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><circle cx="${x - 8}" cy="${y - 2}" r="2.5" fill="${INK}"/>`;
  return [
    at('Bulles qui remontent', 'bob', a, 40, bubbles(a.x, a.y), { period: 2.2, amp: 10 }),
    at('Bulles qui remontent', 'bob', b, 40, bubbles(b.x, b.y), { period: 2.6, amp: 10, phase: 0.4 }),
    at('Poissons', 'sway', d, 40, fish(d.x - 10, d.y, '#f2c94a') + fish(d.x + 14, d.y + 18, '#5ad8c8'), { period: 3, amp: 10 }),
    at('Rayons de lumière', 'blink', e, 30, `<path d="M${e.x - 10} ${e.y - 28} L${e.x + 10} ${e.y - 28} L${e.x + 22} ${e.y + 28} L${e.x - 2} ${e.y + 28}Z" fill="#eafaff" opacity=".4"/>`, { period: 4, min: 0.2 }),
  ];
}

export const atlantica = defineMap({
  id: 'atlantica',
  name: 'Atlantica',
  tagline: 'Sous l\'océan, au pied du palais du roi Triton.',
  universe: 'disney',
  heroes: ['ariel'],
  shape: 'wave',
  basedOn: 'ile-motunui',
  pathMaterial: 'Sable blond semé de coquillages',
  pathKind: 'reef',
  frameKind: 'coral',
  palette: pal,
  backdrop,
  props: { big: [coral(pal.coral), seaweed], med: [coral(pal.coral2), clam], small: [clam, seaweed] },
  anims,
  sound: 'sous-marin-harpe',
  modifiers: { ralentissements: 0.1 },
  unlock: { type: 'chapitre', value: 3 },
  mute: { sat: 0.72, lum: 0.86 },
});

export default atlantica;
