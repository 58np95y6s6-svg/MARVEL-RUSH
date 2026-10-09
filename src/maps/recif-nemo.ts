// Variante : Récif de Nemo (Nemo & Dory, tracé de Sugar Rush). Anémones, coraux, banc de poissons.

import { type Ctx, type Painter, INK, P, across, at, cel, circleS, defineMap, groundShadow, n1, scene, spots } from './kit';
import { clam, coral, seaweed } from './atlantica';

const pal = {
  bg: '#08304a',
  sky1: '#3a9ac8', sky2: '#6ac0d8',
  ground: '#3a8aa8', ground2: '#4298b4',
  path: '#efe0b8', pathEdge: '#a8946a', pathDeco: '#d8c49a',
  frame: '#f08a6a', frameLight: '#ffc0a0', frameShade: '#b05a48',
  cellA: '#f0fafa', cellB: '#dcf0f2',
  accent: '#f08a3a', portal: '#5ae0d0',
  anemone: '#c97ad8', orange: '#f08a3a',
};

const anemone: Painter = (x, y, s) =>
  groundShadow(x, y, 34 * s) + cel(circleS(x, y - 18 * s, 22 * s), '#8a4a9a', { gloss: null }) +
  Array.from({ length: 9 }, (_, i) => {
    const a = Math.PI + (i * Math.PI) / 8;
    const ex = x + Math.cos(a) * 46 * s, ey = y - 24 * s + Math.sin(a) * 50 * s;
    return `<path d="M${x} ${n1(y - 24 * s)} Q${n1((x + ex) / 2 + 6 * s)} ${n1((y - 24 * s + ey) / 2)} ${n1(ex)} ${n1(ey)}" stroke="${INK}" stroke-width="${n1(12 * s)}" fill="none" stroke-linecap="round"/><path d="M${x} ${n1(y - 24 * s)} Q${n1((x + ex) / 2 + 6 * s)} ${n1((y - 24 * s + ey) / 2)} ${n1(ex)} ${n1(ey)}" stroke="${pal.anemone}" stroke-width="${n1(6 * s)}" fill="none" stroke-linecap="round"/>`;
  }).join('');

function backdrop(c: Ctx): string {
  return scene(c, {
    texture: 'spots', pad: '#e6d6a8', padMargin: 0.9,
    horizon: (base) => `<path d="M-10 ${base + 10} Q100 ${base - 80} 220 ${base - 40} T460 ${base - 70} T760 ${base - 50} T1010 ${base - 80} V${base + 30} H-10Z" fill="#5a7ab0" stroke="${INK}" stroke-width="5"/>` +
      `<path d="M150 0 L240 ${base} L330 ${base} L240 0Z M700 0 L740 ${base} L860 ${base} L800 0Z" fill="#e0faff" opacity=".18"/>`,
  });
}

function anims(c: Ctx) {
  const [a, b, d, e] = spots(c);
  const clown = (x: number, y: number) => `<path d="M${x - 18} ${y} Q${x} ${y - 14} ${x + 16} ${y} Q${x} ${y + 14} ${x - 18} ${y}Z M${x + 14} ${y} L${x + 28} ${y - 10} L${x + 28} ${y + 10}Z" fill="${pal.orange}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M${x - 6} ${y - 10} v20 M${x + 6} ${y - 10} v20" stroke="#fff" stroke-width="4"/><circle cx="${x - 12}" cy="${y - 2}" r="2.5" fill="${INK}"/>`;
  const blue = (x: number, y: number) => clown(x, y).replace(new RegExp(pal.orange, 'g'), '#3a6ad8').replace(/#fff/g, '#f2d24a');
  return [
    across('Banc de poissons', c.mode === 'solo' ? 160 : 60, 12, (x, y) => clown(x, y) + blue(x + 40, y + 18) + clown(x + 70, y - 6), { w: 120, h: 50 }),
    at('Anémones qui ondulent', 'sway', a, 40, anemone(a.x, a.y + 30, 0.7, () => 0), { period: 3, amp: 6, oy: a.y + 30 }),
    at('Anémones qui ondulent', 'sway', b, 40, anemone(b.x, b.y + 30, 0.7, () => 0), { period: 3.4, amp: 6, oy: b.y + 30, phase: 0.5 }),
    at('Bulles', 'bob', d, 30, [[0, 10, 7], [10, -6, 5], [-6, -20, 4]].map(([dx, dy, r]) => `<circle cx="${d.x + dx!}" cy="${d.y + dy!}" r="${r}" fill="#eafaff" fill-opacity=".35" stroke="#eafaff" stroke-width="2.5"/>`).join(''), { period: 2, amp: 10 }),
    at('Poisson curieux', 'bob', e, 30, blue(e.x, e.y), { period: 2.4, amp: 6 }),
  ];
}

export const recifNemo = defineMap({
  id: 'recif-nemo',
  name: 'Récif de Nemo',
  tagline: 'Continue de nager, continue de nager…',
  universe: 'disney',
  heroes: ['nemo'],
  shape: 'zigzag',
  basedOn: 'sugar-rush',
  pathMaterial: 'Sable fin du récif',
  pathKind: 'sand',
  frameKind: 'coral',
  palette: pal,
  backdrop,
  props: { big: [coral('#f08a6a'), anemone], med: [anemone, coral('#f2c94a'), clam], small: [seaweed, P.rock('#7a8a9a')] },
  anims,
  sound: 'recif-marimba',
  unlock: { type: 'chapitre', value: 5 },
  mute: { sat: 0.74, lum: 0.88 },
});

export default recifNemo;

void n1;
