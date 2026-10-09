// Variante : Forêt de Rox & Rouky (tracé de la Chambre d'Andy). Forêt d'automne, terriers, feuilles mortes.

import { type Ctx, type Painter, INK, P, across, at, cel, circleS, defineMap, ellS, groundShadow, hills, n1, scene, spots } from './kit';

const pal = {
  bg: '#2a1a12',
  sky1: '#e8a06a', sky2: '#f6d6a8',
  ground: '#8a6a3a', ground2: '#9a7a44',
  path: '#c8a070', pathEdge: '#7a5a34', pathDeco: '#a8804c',
  frame: '#8a5a3a', frameLight: '#b8845a', frameShade: '#5a3a22',
  cellA: '#f8f2e4', cellB: '#ece0c6',
  accent: '#e07a3a', portal: '#f2b04a',
  maple: '#d8622e', gold: '#e8a83a',
};

const burrow: Painter = (x, y, s) =>
  groundShadow(x, y, 40 * s) + cel(ellS(x, y - 24 * s, 46 * s, 30 * s), '#7a5a3a', { dx: 6, dy: 6 }) +
  `<ellipse cx="${x}" cy="${n1(y - 16 * s)}" rx="${n1(22 * s)}" ry="${n1(14 * s)}" fill="${INK}"/>`;

const log: Painter = (x, y, s) =>
  groundShadow(x, y, 46 * s) + cel(ellS(x, y - 16 * s, 46 * s, 16 * s), '#8a5a3a', { dx: 0, dy: 5 }) +
  cel(circleS(x + 40 * s, y - 16 * s, 15 * s), '#d8a870', { gloss: null }) + `<circle cx="${n1(x + 40 * s)}" cy="${n1(y - 16 * s)}" r="${n1(7 * s)}" fill="none" stroke="${INK}" stroke-width="2"/>`;

function backdrop(c: Ctx): string {
  return scene(c, {
    texture: 'spots', pad: '#a8844a', padMargin: 0.9,
    horizon: (base) => hills(base - 20, '#a8603a', 70, 'rox', 6) + hills(base + 10, '#8a5a32', 50, 'rox2', 5),
  });
}

function anims(c: Ctx) {
  const [a, b, d] = spots(c);
  const leaf = (x: number, y: number, col: string) => `<path d="M${x} ${y} l8 -16 l4 8 l10 -6 l-4 12 l10 2 l-14 8 l2 8 l-12 -4z" fill="${col}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`;
  const fox = (x: number, y: number) => cel(circleS(x, y, 18), '#e0763a') + `<path d="M${x - 16} ${y - 8} L${x - 12} ${y - 30} L${x - 2} ${y - 14}Z M${x + 16} ${y - 8} L${x + 12} ${y - 30} L${x + 2} ${y - 14}Z" fill="#e0763a" stroke="${INK}" stroke-width="3"/><path d="M${x - 10} ${y + 6} Q${x} ${y + 18} ${x + 10} ${y + 6}" fill="#fff"/><circle cx="${x - 6}" cy="${y - 2}" r="2.5" fill="${INK}"/><circle cx="${x + 6}" cy="${y - 2}" r="2.5" fill="${INK}"/>`;
  return [
    across('Feuilles mortes', c.mode === 'solo' ? 160 : 60, 10, (x, y) => leaf(x, y, pal.maple) + leaf(x + 40, y + 20, pal.gold), { w: 80, h: 50 }),
    at('Renardeau qui guette', 'bob', a, 36, fox(a.x, a.y + 4), { period: 3, amp: 6 }),
    at('Feuilles qui tournoient', 'spin', b, 26, leaf(b.x - 10, b.y + 8, pal.gold), { period: 4 }),
    at('Feuilles qui tournoient', 'sway', d, 30, leaf(d.x - 10, d.y + 8, pal.maple), { period: 2.2, amp: 20 }),
  ];
}

export const foretRoxRouky = defineMap({
  id: 'foret-rox-rouky',
  name: 'Forêt de Rox & Rouky',
  tagline: 'Deux amis pour la vie, sous les érables d\'automne.',
  universe: 'disney',
  heroes: ['foxhound'],
  shape: 'wave',
  basedOn: 'chambre-andy',
  pathMaterial: 'Sentier de feuilles mortes',
  pathKind: 'dirt',
  frameKind: 'wood',
  palette: pal,
  backdrop,
  props: { big: [P.tree(pal.maple, '#6a4a30'), P.tree(pal.gold, '#6a4a30')], med: [burrow, log, P.bush('#b8703a')], small: [P.shroom('#c84a3a'), P.tuft('#a8843a')] },
  anims,
  sound: 'foret-automne',
  unlock: { type: 'chapitre', value: 6 },
  mute: { sat: 0.72, lum: 0.88 },
});

export default foretRoxRouky;
