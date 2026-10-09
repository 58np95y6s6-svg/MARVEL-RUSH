// Variante : Forêt de Pocahontas (tracé de l'île de Motunui). Rivière, grands arbres, feuilles au vent.

import { type Ctx, INK, P, across, at, cel, circleS, defineMap, groundShadow, hills, n1, pathS, rectS, scene, spots } from './kit';

const pal = {
  bg: '#13281f',
  sky1: '#d98a5a', sky2: '#f2d0a0',
  ground: '#4f7a4a', ground2: '#5a8a52',
  path: '#c9a878', pathEdge: '#7d6040', pathDeco: '#a88a5c',
  frame: '#8a6a4a', frameLight: '#b8946a', frameShade: '#5a4028',
  cellA: '#f6f2e4', cellB: '#e6e2c8',
  accent: '#e07a3a', portal: '#7ad8a0',
  leaf: '#d8833a', leaf2: '#e8b84a', river: '#5aa8b8',
};

const willow = (x: number, y: number, s: number) =>
  groundShadow(x, y, 50 * s) + cel(rectS(x - 12 * s, y - 80 * s, 24 * s, 80 * s, 8 * s), '#6a4a32', { dx: 6, dy: 0 }) +
  cel(pathS(`M${n1(x - 70 * s)} ${n1(y - 40 * s)} Q${n1(x - 80 * s)} ${n1(y - 160 * s)} ${n1(x)} ${n1(y - 170 * s)} Q${n1(x + 80 * s)} ${n1(y - 160 * s)} ${n1(x + 70 * s)} ${n1(y - 40 * s)} Q${n1(x)} ${n1(y - 70 * s)} ${n1(x - 70 * s)} ${n1(y - 40 * s)}Z`), '#5e8a4a') +
  [-40, -14, 14, 40].map((d) => `<path d="M${n1(x + d * s)} ${n1(y - 110 * s)} q${n1(4 * s)} ${n1(30 * s)} 0 ${n1(56 * s)}" stroke="#79a85a" stroke-width="${n1(6 * s)}" fill="none" stroke-linecap="round"/>`).join('');

function backdrop(c: Ctx): string {
  return scene(c, {
    texture: 'grass', pad: '#6a9a5a', padMargin: 0.9,
    horizon: (base) => hills(base - 30, '#6a7a5a', 70, 'poca', 5) + `<path d="M-10 ${base - 10} Q300 ${base - 40} 500 ${base - 14} T1010 ${base - 20} V${base + 30} H-10Z" fill="${pal.river}" stroke="${INK}" stroke-width="5"/>`,
  });
}

function anims(c: Ctx) {
  const [a, b, d] = spots(c);
  const leaf = (x: number, y: number, col: string) => `<path d="M${x} ${y} q10 -14 22 -2 q-10 14 -22 2z" fill="${col}" stroke="${INK}" stroke-width="2.5"/>`;
  const leaves = (x: number, y: number) => leaf(x, y, pal.leaf) + leaf(x + 34, y + 16, pal.leaf2) + leaf(x + 12, y + 30, pal.leaf);
  return [
    across('Feuilles colorées dans le vent', c.mode === 'solo' ? 150 : 56, 11, leaves, { w: 70, h: 50 }),
    across('Feuilles colorées dans le vent', d.y, 14, leaves, { w: 70, h: 50 }, { phase: 0.5, x0: c.mode === 'solo' ? 150 : 170, x1: c.mode === 'solo' ? 800 : 420 }),
    at('Raton laveur curieux', 'bob', a, 34, cel(circleS(a.x, a.y + 6, 20), '#8a8a92') + `<path d="M${a.x - 14} ${a.y} h28" stroke="${INK}" stroke-width="8"/><circle cx="${a.x - 7}" cy="${a.y}" r="3" fill="#fff"/><circle cx="${a.x + 7}" cy="${a.y}" r="3" fill="#fff"/>`, { period: 2.8, amp: 6 }),
    at('Reflets de la rivière', 'blink', b, 34, `<path d="M${b.x - 26} ${b.y} q13 -8 26 0 t26 0" stroke="#e8f8f8" stroke-width="5" fill="none" stroke-linecap="round"/>`, { period: 2, min: 0.2 }),
  ];
}

export const foretPocahontas = defineMap({
  id: 'foret-pocahontas',
  name: 'Forêt de Pocahontas',
  tagline: 'Écoute le vent qui chante dans les feuilles.',
  universe: 'disney',
  heroes: ['pocahontas'],
  shape: 'wave',
  basedOn: 'ile-motunui',
  pathMaterial: 'Sentier de terre au bord de la rivière',
  pathKind: 'dirt',
  frameKind: 'wood',
  palette: pal,
  backdrop,
  props: { big: [willow, P.pine('#4f7a52')], med: [P.bush('#6a9a52'), P.rock('#8a8a80')], small: [P.tuft('#79a85a'), P.shroom('#d8833a')] },
  anims,
  sound: 'foret-vent',
  modifiers: { dureeControles: 0.1 },
  unlock: { type: 'chapitre', value: 1 },
  mute: { sat: 0.72, lum: 0.86 },
});

export default foretPocahontas;

