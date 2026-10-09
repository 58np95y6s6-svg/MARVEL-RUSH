// Variante : Highlands de Rebelle (tracé d'Asgard). Landes brumeuses, pierres levées, feux follets.

import { type Ctx, type Painter, INK, P, across, at, cel, cloud, defineMap, glow, groundShadow, n1, pathS, peaks, rectS, scene, spots } from './kit';

const pal = {
  bg: '#16241f',
  sky1: '#7a8aa0', sky2: '#c9d2cf',
  ground: '#5a7a52', ground2: '#6a8a5a',
  path: '#a8a090', pathEdge: '#6a6458', pathDeco: '#8a8474',
  frame: '#8a8c86', frameLight: '#b8bab2', frameShade: '#5a5c56',
  cellA: '#f2f4ee', cellB: '#e0e6d8',
  accent: '#d8572e', portal: '#7ad0ff',
  heather: '#9a6aa8', wisp: '#8ad8ff',
};

const standingStone: Painter = (x, y, s) =>
  groundShadow(x, y, 30 * s) + cel(pathS(`M${n1(x - 22 * s)} ${n1(y)} Q${n1(x - 30 * s)} ${n1(y - 90 * s)} ${n1(x - 4 * s)} ${n1(y - 130 * s)} Q${n1(x + 26 * s)} ${n1(y - 110 * s)} ${n1(x + 24 * s)} ${n1(y)}Z`), '#8a8c86', { dx: 9, dy: 0 }) +
  `<path d="M${n1(x - 6 * s)} ${n1(y - 90 * s)} q6 -10 12 0 q-6 10 -12 0z M${n1(x)} ${n1(y - 70 * s)} v20" stroke="#5a8aa8" stroke-width="3" fill="none"/>`;

const heather: Painter = (x, y, s) => P.bush(pal.heather)(x, y, s, () => 0);

const castleRuin: Painter = (x, y, s) =>
  groundShadow(x, y, 60 * s) + cel(rectS(x - 50 * s, y - 120 * s, 40 * s, 120 * s, 4), '#8a8c86', { dx: 8, dy: 0 }) +
  cel(rectS(x - 10 * s, y - 80 * s, 60 * s, 80 * s, 4), '#8a8c86', { dx: 10, dy: 0 }) +
  `<path d="M${n1(x - 50 * s)} ${n1(y - 120 * s)} h${n1(10 * s)} v${n1(-12 * s)} h${n1(10 * s)} v${n1(12 * s)} h${n1(10 * s)} v${n1(-12 * s)} h${n1(10 * s)} v${n1(12 * s)}" fill="none" stroke="${INK}" stroke-width="5"/>` +
  `<rect x="${n1(x - 36 * s)}" y="${n1(y - 96 * s)}" width="${n1(12 * s)}" height="${n1(20 * s)}" rx="6" fill="${INK}"/>`;

function backdrop(c: Ctx): string {
  return scene(c, {
    texture: 'grass', pad: '#7a9a6a', padMargin: 0.9,
    horizon: (base) => peaks(base - 10, '#6a7a7a', 150, 'highlands', 4) + cloud(250, base - 60, 1.1, '#e4e8e6') + cloud(760, base - 80, 0.9, '#e4e8e6'),
  });
}

function anims(c: Ctx) {
  const [a, b, d, e] = spots(c);
  return [
    at('Feux follets', 'bob', a, 30, glow(a.x, a.y, 9, pal.wisp), { period: 2.4, amp: 10 }),
    at('Feux follets', 'bob', b, 30, glow(b.x, b.y, 9, pal.wisp), { period: 2.9, amp: 10, phase: 0.4 }),
    at('Feux follets', 'blink', d, 30, glow(d.x, d.y, 8, pal.wisp), { period: 1.8, min: 0.1 }),
    across('Brume des landes', c.mode === 'solo' ? 170 : 70, 40, (x, y) => cloud(x, y, 0.6, '#e4e8e6'), { w: 120, h: 50 }),
    at('Feux follets', 'blink', e, 26, glow(e.x, e.y, 7, pal.wisp), { period: 2.2, min: 0.1, phase: 0.6 }),
  ];
}

export const highlandsRebelle = defineMap({
  id: 'highlands-rebelle',
  name: 'Highlands de Rebelle',
  tagline: 'Suis les feux follets à travers la lande.',
  universe: 'disney',
  heroes: ['merida'],
  shape: 'arch',
  basedOn: 'asgard-bifrost',
  pathMaterial: 'Chemin de pierres levées',
  pathKind: 'stone',
  frameKind: 'stone',
  palette: pal,
  backdrop,
  props: { big: [castleRuin, standingStone], med: [standingStone, heather], small: [P.tuft('#7a9a5a'), heather] },
  anims,
  sound: 'cornemuse-brume',
  unlock: { type: 'chapitre', value: 2 },
  mute: { sat: 0.7, lum: 0.88 },
});

export default highlandsRebelle;
