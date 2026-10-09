// Base des Avengers : piste d'entraînement, hangar, Quinjet, cibles, drapeau.

import {
  type Ctx, type Painter, INK, P, SW, across, at, cel, circleS, cloud, defineMap, flat, gloss, groundShadow, n1,
  pathS, polyS, rectS, scene, spots,
} from './kit';

const pal = {
  bg: '#1d2638',
  sky1: '#5d8fd0', sky2: '#bcd8ee',
  ground: '#68778c', ground2: '#5e6c80',
  path: '#c45a4a', pathEdge: '#7e3a32', pathDeco: '#f1ece4',
  frame: '#9aa6b8', frameLight: '#d3dbe6', frameShade: '#66738a',
  cellA: '#edf1f6', cellB: '#dbe2ec',
  accent: '#3c6fc4', portal: '#6fb2ff',
  navy: '#2f4a7a', white: '#eef1f6', red: '#c4453a', jet: '#5c6a80', stripe: '#e8c24a',
};

const target: Painter = (x, y, s) =>
  groundShadow(x, y, 30 * s) + flat(rectS(x - 4 * s, y - 50 * s, 8 * s, 50 * s, 3), '#6b4a35', SW * 0.7) +
  cel(circleS(x, y - 80 * s, 34 * s), pal.white, { gloss: null }) +
  `<circle cx="${x}" cy="${n1(y - 80 * s)}" r="${n1(24 * s)}" fill="${pal.red}"/><circle cx="${x}" cy="${n1(y - 80 * s)}" r="${n1(15 * s)}" fill="${pal.white}"/><circle cx="${x}" cy="${n1(y - 80 * s)}" r="${n1(7 * s)}" fill="${pal.red}"/>` +
  gloss(x - 14 * s, y - 98 * s, 8 * s, 4 * s);

const quinjet: Painter = (x, y, s) =>
  groundShadow(x, y, 80 * s, 14 * s) +
  cel(polyS([{ x: x - 90 * s, y: y - 30 * s }, { x: x - 20 * s, y: y - 70 * s }, { x: x + 60 * s, y: y - 60 * s }, { x: x + 96 * s, y: y - 34 * s }, { x: x + 60 * s, y: y - 14 * s }, { x: x - 60 * s, y: y - 14 * s }]), pal.jet, { dx: 0, dy: 10 }) +
  cel(polyS([{ x: x - 40 * s, y: y - 62 * s }, { x: x - 70 * s, y: y - 110 * s }, { x: x - 46 * s, y: y - 110 * s }, { x: x - 10 * s, y: y - 66 * s }]), pal.jet, { dx: 6, dy: 0 }) +
  flat(pathS(`M${n1(x + 30 * s)} ${n1(y - 58 * s)} L${n1(x + 76 * s)} ${n1(y - 40 * s)} L${n1(x + 40 * s)} ${n1(y - 42 * s)}Z`), '#9fd0f0', SW * 0.7) +
  flat(rectS(x - 50 * s, y - 14 * s, 8 * s, 14 * s, 2), INK, 0) + flat(rectS(x + 40 * s, y - 14 * s, 8 * s, 14 * s, 2), INK, 0) +
  flat(circleS(x - 10 * s, y - 40 * s, 9 * s), pal.white, SW * 0.6);

const crate: Painter = P.crate('#7b8a6a');

const cone: Painter = (x, y, s) =>
  groundShadow(x, y, 18 * s) + cel(polyS([{ x: x - 16 * s, y }, { x: x - 5 * s, y: y - 40 * s }, { x: x + 5 * s, y: y - 40 * s }, { x: x + 16 * s, y }]), '#e88a3a', { dx: 5, dy: 0 }) +
  `<rect x="${n1(x - 11 * s)}" y="${n1(y - 24 * s)}" width="${n1(22 * s)}" height="${n1(7 * s)}" fill="#fff"/>`;

const shieldStand: Painter = (x, y, s) =>
  groundShadow(x, y, 36 * s) + cel(rectS(x - 30 * s, y - 24 * s, 60 * s, 24 * s, 6 * s), '#56627a', { dx: 0, dy: 6 }) +
  cel(circleS(x, y - 64 * s, 36 * s), pal.red, { gloss: null }) + `<circle cx="${x}" cy="${n1(y - 64 * s)}" r="${n1(26 * s)}" fill="${pal.white}"/><circle cx="${x}" cy="${n1(y - 64 * s)}" r="${n1(17 * s)}" fill="${pal.red}"/><circle cx="${x}" cy="${n1(y - 64 * s)}" r="${n1(11 * s)}" fill="${pal.navy}"/>` +
  `<path d="M${x} ${n1(y - 72 * s)} l3 7 h7 l-6 4 l2 7 l-6 -4 l-6 4 l2 -7 l-6 -4 h7z" fill="#fff"/>` + gloss(x - 14 * s, y - 84 * s, 9 * s, 4 * s);

function hangar(base: number): string {
  let s = cel(pathS(`M60 ${base + 10} L60 ${base - 120} Q330 ${base - 230} 600 ${base - 120} L600 ${base + 10}Z`), '#8a96aa', { dx: 18, dy: 0 });
  s += flat(pathS(`M140 ${base + 10} L140 ${base - 90} Q330 ${base - 170} 520 ${base - 90} L520 ${base + 10}Z`), '#2f3a52');
  for (let i = 0; i < 6; i++) s += `<line x1="${150 + i * 64}" y1="${base - 100}" x2="${150 + i * 64}" y2="${base + 10}" stroke="#455270" stroke-width="5"/>`;
  s += cel(rectS(640, base - 160, 240, 170, 10), '#b9c3d2', { dx: 20, dy: 0 });
  for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) s += `<rect x="${662 + i * 54}" y="${base - 140 + r * 46}" width="36" height="28" rx="4" fill="#7fb0dc" stroke="${INK}" stroke-width="3"/>`;
  s += cel(rectS(800, base - 210, 70, 52, 8), '#b9c3d2', { dx: 8, dy: 0 }) + `<text x="835" y="${base - 170}" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="34" fill="${pal.navy}">A</text>`;
  return s;
}

function backdrop(c: Ctx): string {
  return scene(c, {
    texture: 'none', pad: '#76859a', padMargin: 0.9,
    horizon: (base) => cloud(150, base - 160, 0.9) + cloud(870, base - 190, 0.7) + hangar(base) + cel(rectS(-20, base, 1040, 26, 0), '#8a96aa', { dx: 0, dy: 8 }),
    after: Array.from({ length: 9 }, (_, i) => `<rect x="${i * 120 - 10}" y="${horizonOf(c) + 60}" width="60" height="10" fill="${pal.stripe}" opacity=".5"/>`).join('') +
      Array.from({ length: 9 }, (_, i) => `<rect x="${i * 120 + 50}" y="1560" width="60" height="10" fill="${pal.stripe}" opacity=".5"/>`).join(''),
  });
}
const horizonOf = (c: Ctx) => (c.mode === 'solo' ? 270 : 118);

function anims(c: Ctx) {
  const [a, b, d, e] = spots(c);
  const flag = (x: number, y: number) =>
    `<path d="M${x - 30} ${y - 22} Q${x - 10} ${y - 30} ${x + 10} ${y - 22} T${x + 46} ${y - 22} L${x + 46} ${y + 14} Q${x + 28} ${y + 6} ${x + 10} ${y + 14} T${x - 30} ${y + 14}Z" fill="${pal.navy}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` +
    `<path d="M${x + 6} ${y - 10} l4 9 h9 l-7 6 l3 9 l-9 -6 l-9 6 l3 -9 l-7 -6 h9z" fill="#fff"/>`;
  const dish = (x: number, y: number) => `<ellipse cx="${x}" cy="${y}" rx="30" ry="12" fill="#d3dbe6" stroke="${INK}" stroke-width="4"/><path d="M${x} ${y} L${x} ${y - 20}" stroke="${INK}" stroke-width="4"/><circle cx="${x}" cy="${y - 22}" r="5" fill="${pal.red}" stroke="${INK}" stroke-width="2"/>`;
  const sky = c.mode === 'solo' ? 120 : 45;
  return [
    at('Drapeau au vent', 'sway', a, 48, `<rect x="${a.x - 34}" y="${a.y - 30}" width="6" height="80" fill="#56627a" stroke="${INK}" stroke-width="3"/>` + flag(a.x + 4, a.y - 8), { period: 2.2, amp: 4, ox: a.x - 31, oy: a.y + 50 }),
    at('Base en activité', 'sway', b, 40, dish(b.x, b.y + 10), { period: 4, amp: 18, oy: b.y + 10 }),
    across('Quinjet en patrouille', sky, 18, (x, y) => `<g transform="translate(${x} ${y}) scale(.5)">${quinjet(0, 40, 1, () => 0)}</g>`, { w: 110, h: 50 }, { phase: 0.2 }),
    at('Base en activité', 'bob', d, 36, target(d.x, d.y + 30, 0.55, () => 0), { period: 2.6, amp: 5 }),
    at('Base en activité', 'blink', e, 16, `<circle cx="${e.x}" cy="${e.y}" r="8" fill="${pal.stripe}" stroke="${INK}" stroke-width="3"/>`, { period: 1.2, min: 0.2 }),
  ];
}

export const baseAvengers = defineMap({
  id: 'base-avengers',
  name: 'Base des Avengers',
  tagline: 'Piste d\'entraînement au pied du hangar.',
  universe: 'marvel',
  heroes: ['cap', 'widow', 'falcon', 'hawkeye', 'bucky', 'hulk'],
  shape: 'u',
  pathMaterial: 'Piste d\'entraînement',
  pathKind: 'track',
  frameKind: 'metal',
  palette: pal,
  backdrop,
  props: { big: [quinjet, target], med: [shieldStand, target, crate], small: [cone, crate, cone] },
  anims,
  sound: 'base-heroique',
  unlock: { type: 'vagues', value: 20 },
  mute: { sat: 0.72, lum: 0.88 },
});

export default baseAvengers;

