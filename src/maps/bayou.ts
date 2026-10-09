// Variante : Bayou de La Nouvelle-Orléans (Tiana, tracé de Zootopie). Pontons, nénuphars, lucioles.

import { type Ctx, type Painter, INK, P, SW, at, cel, circleS, defineMap, flat, glow, groundShadow, n1, pathS, rectS, scene, spots, stars } from './kit';

const pal = {
  bg: '#0f2220',
  sky1: '#25304a', sky2: '#5a6a6a',
  ground: '#3a5a4a', ground2: '#456a52',
  path: '#a8865c', pathEdge: '#6a4e30', pathDeco: '#8a6a44',
  frame: '#7a6040', frameLight: '#a8865c', frameShade: '#4f3c26',
  cellA: '#f0f2e6', cellB: '#dfe6d2',
  accent: '#e8c84a', portal: '#b0e86a',
  moss: '#7a9a6a', firefly: '#f2e86a', lily: '#5a9a5a',
};

const cypress: Painter = (x, y, s) =>
  groundShadow(x, y, 46 * s) + cel(pathS(`M${n1(x - 26 * s)} ${n1(y)} Q${n1(x - 10 * s)} ${n1(y - 40 * s)} ${n1(x - 10 * s)} ${n1(y - 150 * s)} L${n1(x + 10 * s)} ${n1(y - 150 * s)} Q${n1(x + 10 * s)} ${n1(y - 40 * s)} ${n1(x + 26 * s)} ${n1(y)}Z`), '#6a5a48', { dx: 6, dy: 0 }) +
  cel(circleS(x - 30 * s, y - 150 * s, 34 * s), '#4a6a4a') + cel(circleS(x + 30 * s, y - 156 * s, 32 * s), '#4a6a4a') + cel(circleS(x, y - 180 * s, 38 * s), '#4a6a4a') +
  [-40, -10, 22, 44].map((d) => `<path d="M${n1(x + d * s)} ${n1(y - 140 * s)} q${n1(3 * s)} ${n1(26 * s)} 0 ${n1(50 * s)}" stroke="${pal.moss}" stroke-width="${n1(6 * s)}" fill="none" stroke-linecap="round"/>`).join('');

const lilyPad: Painter = (x, y, s) =>
  `<ellipse cx="${x}" cy="${n1(y - 8 * s)}" rx="${n1(30 * s)}" ry="${n1(12 * s)}" fill="${pal.lily}" stroke="${INK}" stroke-width="${SW * 0.7}"/>` + flat(circleS(x + 8 * s, y - 14 * s, 7 * s), '#f2c0d8', SW * 0.5);

const steamboat: Painter = (x, y, s) =>
  groundShadow(x, y, 80 * s, 12 * s) + cel(rectS(x - 80 * s, y - 30 * s, 160 * s, 30 * s, 10 * s), '#e8e0d0', { dx: 0, dy: 6 }) +
  cel(rectS(x - 56 * s, y - 64 * s, 112 * s, 34 * s, 6 * s), '#e8e0d0', { dx: 0, dy: 6 }) +
  flat(rectS(x - 30 * s, y - 110 * s, 14 * s, 46 * s, 3), INK, 0) + flat(rectS(x + 16 * s, y - 110 * s, 14 * s, 46 * s, 3), INK, 0) +
  cel(circleS(x + 80 * s, y - 26 * s, 24 * s), '#c44a3a', { gloss: null });

function backdrop(c: Ctx): string {
  return scene(c, {
    texture: 'spots', pad: '#5a7a5a', padMargin: 0.9,
    horizon: (base) => stars(c, 30, { x: 0, y: 0, w: 1000, h: base - 80 }) + `<circle cx="780" cy="${base - 140}" r="46" fill="#f4eecf" stroke="${INK}" stroke-width="5"/>` +
      `<path d="M-10 ${base} Q120 ${base - 90} 260 ${base - 50} T560 ${base - 70} T1010 ${base - 40} V${base + 30} H-10Z" fill="#2f4a3e" stroke="${INK}" stroke-width="5"/>`,
  });
}

function anims(c: Ctx) {
  const [a, b, d, e, f, g] = spots(c);
  const ff = (p: { x: number; y: number }) => glow(p.x, p.y, 6, pal.firefly) + glow(p.x + 22, p.y + 14, 4, pal.firefly);
  return [
    at('Lucioles', 'bob', a, 34, ff(a), { period: 2.6, amp: 10 }),
    at('Lucioles', 'blink', b, 34, ff(b), { period: 1.6, min: 0.1 }),
    at('Lucioles', 'blink', e, 34, ff(e), { period: 1.9, min: 0.1, phase: 0.5 }),
    at('Lucioles', 'blink', f, 34, ff(f), { period: 2.3, min: 0.1, phase: 0.2 }),
    at('Lucioles', 'blink', g, 34, ff(g), { period: 1.7, min: 0.1, phase: 0.7 }),
    at('Nénuphars qui flottent', 'bob', d, 34, lilyPad(d.x, d.y + 10, 0.9, () => 0), { period: 3.4, amp: 4 }),
  ];
}

export const bayou = defineMap({
  id: 'bayou',
  name: 'Bayou de La Nouvelle-Orléans',
  tagline: 'Les lucioles s\'allument sur le bayou.',
  universe: 'disney',
  heroes: ['tiana'],
  shape: 'u',
  basedOn: 'zootopie',
  pathMaterial: 'Pontons de bois sur le marais',
  pathKind: 'planks',
  frameKind: 'wood',
  palette: pal,
  backdrop,
  props: { big: [cypress, steamboat], med: [P.bush('#4a6a4a'), lilyPad], small: [lilyPad, P.tuft('#6a8a5a')] },
  anims,
  sound: 'jazz-bayou',
  unlock: { type: 'chapitre', value: 4 },
  mute: { sat: 0.72, lum: 0.86 },
});

export default bayou;
