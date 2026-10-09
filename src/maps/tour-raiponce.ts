// Variante : Tour de Raiponce (tracé du Palais impérial). Vallée cachée, tour, lanternes volantes.

import { type Ctx, type Painter, INK, P, SW, at, cel, circleS, defineMap, flat, glow, groundShadow, n1, pathS, polyS, rectS, scene, spots, stars, hills } from './kit';

const pal = {
  bg: '#1a1838',
  sky1: '#2a2860', sky2: '#8a6aa8',
  ground: '#5a7a5a', ground2: '#668a62',
  path: '#c8bca8', pathEdge: '#857a68', pathDeco: '#a89c88',
  frame: '#9a8ab8', frameLight: '#c8bce0', frameShade: '#665a86',
  cellA: '#f6f2fa', cellB: '#e6def0',
  accent: '#f6c64a', portal: '#f6c64a',
  lantern: '#f2a83a', stone: '#c8bca8', roof: '#7a5aa8',
};

const tower: Painter = (x, y, s) =>
  groundShadow(x, y, 50 * s) + cel(rectS(x - 28 * s, y - 210 * s, 56 * s, 210 * s, 10 * s), pal.stone, { dx: 12, dy: 0 }) +
  cel(rectS(x - 40 * s, y - 250 * s, 80 * s, 46 * s, 12 * s), pal.stone, { dx: 14, dy: 0 }) +
  flat(rectS(x - 12 * s, y - 240 * s, 24 * s, 28 * s, 10 * s), '#f2d07a', SW * 0.7) +
  cel(polyS([{ x: x - 50 * s, y: y - 248 * s }, { x, y: y - 310 * s }, { x: x + 50 * s, y: y - 248 * s }]), pal.roof, { dx: 10, dy: 0 }) +
  `<path d="M${n1(x - 26 * s)} ${n1(y - 60 * s)} q20 -30 0 -70 q-16 -30 10 -60" stroke="#5a8a4a" stroke-width="${n1(8 * s)}" fill="none" stroke-linecap="round"/>`;

const flowers: Painter = (x, y, s) =>
  groundShadow(x, y, 26 * s) + P.bush('#5a8a52')(x, y, s * 0.8, () => 0) +
  [[-14, -26, '#f2a6c8'], [10, -32, '#f6d65a'], [0, -16, '#c8a6f2']].map(([dx, dy, col]) => `<circle cx="${n1(x + (dx as number) * s)}" cy="${n1(y + (dy as number) * s)}" r="${n1(5 * s)}" fill="${col}" stroke="${INK}" stroke-width="2"/>`).join('');

function backdrop(c: Ctx): string {
  return scene(c, {
    texture: 'grass', pad: '#729a6a', padMargin: 0.9,
    horizon: (base) => stars(c, 40, { x: 0, y: 0, w: 1000, h: base - 60 }) + hills(base - 20, '#4a5a6a', 80, 'raiponce', 5) +
      `<rect x="-10" y="${base - 20}" width="1020" height="40" fill="#3a4a6a"/>` +
      Array.from({ length: 14 }, (_, i) => glow((i * 173) % 1000, 40 + ((i * 97) % (base - 100)), 5, pal.lantern)).join(''),
  });
}

function anims(c: Ctx) {
  const [a, b, d, e, f, g] = spots(c);
  const lantern = (x: number, y: number) =>
    `<circle cx="${x}" cy="${y}" r="26" fill="${pal.lantern}" opacity=".25"/>` + cel(pathS(`M${x - 13} ${y - 16} L${x + 13} ${y - 16} L${x + 10} ${y + 14} L${x - 10} ${y + 14}Z`), pal.lantern) +
    `<rect x="${x - 7}" y="${y + 6}" width="14" height="6" fill="#ffe08a"/>`;
  return [
    at('Lanternes volantes', 'bob', a, 40, lantern(a.x, a.y), { period: 3.6, amp: 12 }),
    at('Lanternes volantes', 'bob', b, 40, lantern(b.x, b.y), { period: 4, amp: 12, phase: 0.3 }),
    at('Lanternes volantes', 'bob', e, 40, lantern(e.x, e.y), { period: 3.2, amp: 10, phase: 0.6 }),
    at('Lanternes volantes', 'bob', f, 40, lantern(f.x, f.y), { period: 3.8, amp: 10, phase: 0.1 }),
    at('Lanternes volantes', 'bob', g, 40, lantern(g.x, g.y), { period: 4.4, amp: 10, phase: 0.8 }),
    at('Caméléon farceur', 'sway', d, 30, cel(circleS(d.x, d.y, 16), '#7ad86a') + `<circle cx="${d.x + 6}" cy="${d.y - 4}" r="4" fill="#fff" stroke="${INK}" stroke-width="2"/>`, { period: 2, amp: 12, oy: d.y + 16 }),
  ];
}

export const tourRaiponce = defineMap({
  id: 'tour-raiponce',
  name: 'Tour de Raiponce',
  tagline: 'La vallée secrète, le soir des lanternes.',
  universe: 'disney',
  heroes: ['rapunzel'],
  shape: 'steps',
  basedOn: 'palais-imperial',
  pathMaterial: 'Pavés du sentier de la vallée',
  pathKind: 'cobble',
  frameKind: 'stone',
  palette: pal,
  backdrop,
  props: { big: [tower, P.tree('#5a8a52')], med: [flowers, P.rock('#9a9488')], small: [flowers, P.tuft('#6a9a5a')] },
  anims,
  sound: 'lanternes-guitare',
  unlock: { type: 'chapitre', value: 6 },
  mute: { sat: 0.74, lum: 0.88 },
});

export default tourRaiponce;
