// Arène de Black Adam : Kahndaq, ruines de grès dans le désert sous un ciel d'orage. Obélisques,
// trône de pierre, palmiers, éclairs qui frappent les dunes. Pendant le boss : éclairs blancs et
// tempête de sable.

import { type AnimSpec, type Ctx, type Painter, INK, SW, across, at, cel, defineMap, flat, glow, groundShadow, n1, pathS, polyS, rectS, scene, spots } from './kit';
import { bolt, brazier, shardRock } from './dc-kit';

const pal = {
  bg: '#1a1420',
  sky1: '#2a2440', sky2: '#7a6a72',
  ground: '#b08e64', ground2: '#a4845c',
  path: '#e2cc9e', pathEdge: '#9a7a52', pathDeco: '#c8a46a',
  frame: '#b89a6e', frameLight: '#dcc49a', frameShade: '#86704e',
  cellA: '#faf4e6', cellB: '#efe4cc',
  accent: '#f2d23a', portal: '#f2d23a',
  sand: '#c8a46a', stone: '#c4a274', dark: '#5a4632', bolt: '#fff6c8', palm: '#4a7a4a',
};

// ---------------------------------------------------------------- accessoires

const obelisk: Painter = (x, y, s) =>
  groundShadow(x, y, 30 * s) + cel(rectS(x - 28 * s, y - 16 * s, 56 * s, 16 * s, 3), pal.stone, { dx: 0, dy: 5 }) +
  cel(polyS([{ x: x - 18 * s, y: y - 16 * s }, { x: x - 12 * s, y: y - 150 * s }, { x, y: y - 170 * s }, { x: x + 12 * s, y: y - 150 * s }, { x: x + 18 * s, y: y - 16 * s }]), pal.stone, { dx: 9, dy: 0 }) +
  [50, 80, 110].map((d) => `<path d="M${n1(x - 6 * s)} ${n1(y - d * s)} l${n1(6 * s)} ${n1(-8 * s)} l${n1(6 * s)} ${n1(8 * s)}" stroke="${INK}" stroke-width="${n1(3 * s)}" fill="none" opacity=".45"/>`).join('') +
  bolt(x, y - 130 * s, 0.3 * s, '#f2d23a');

const brokenStatue: Painter = (x, y, s) =>
  groundShadow(x, y, 40 * s) + cel(rectS(x - 34 * s, y - 30 * s, 68 * s, 30 * s, 4), pal.stone, { dx: 0, dy: 8 }) +
  cel(pathS(`M${n1(x - 22 * s)} ${n1(y - 30 * s)} L${n1(x - 20 * s)} ${n1(y - 96 * s)} L${n1(x - 6 * s)} ${n1(y - 86 * s)} L${n1(x + 8 * s)} ${n1(y - 104 * s)} L${n1(x + 22 * s)} ${n1(y - 90 * s)} L${n1(x + 22 * s)} ${n1(y - 30 * s)}Z`), pal.stone, { dx: 8, dy: 0 }) +
  `<path d="M${n1(x - 4 * s)} ${n1(y - 76 * s)} l${n1(8 * s)} ${n1(-12 * s)} l${n1(-4 * s)} ${n1(12 * s)} l${n1(8 * s)} 0 l${n1(-14 * s)} ${n1(20 * s)}" stroke="#f2d23a" stroke-width="${n1(4 * s)}" fill="none" stroke-linejoin="round"/>`;

const palm: Painter = (x, y, s) =>
  groundShadow(x, y, 30 * s) +
  `<path d="M${n1(x)} ${n1(y)} q${n1(-10 * s)} ${n1(-60 * s)} ${n1(8 * s)} ${n1(-130 * s)}" stroke="${INK}" stroke-width="${n1(16 * s)}" fill="none" stroke-linecap="round"/>` +
  `<path d="M${n1(x)} ${n1(y)} q${n1(-10 * s)} ${n1(-60 * s)} ${n1(8 * s)} ${n1(-130 * s)}" stroke="#8a6a4a" stroke-width="${n1(9 * s)}" fill="none" stroke-linecap="round"/>` +
  [[-60, -10], [-50, 30], [60, -6], [50, 34], [0, -50]].map(([dx, dy]) =>
    `<path d="M${n1(x + 8 * s)} ${n1(y - 130 * s)} q${n1(dx! * 0.5 * s)} ${n1((dy! - 30) * s)} ${n1(dx! * s)} ${n1(dy! * s)}" stroke="${INK}" stroke-width="${n1(14 * s)}" fill="none" stroke-linecap="round"/><path d="M${n1(x + 8 * s)} ${n1(y - 130 * s)} q${n1(dx! * 0.5 * s)} ${n1((dy! - 30) * s)} ${n1(dx! * s)} ${n1(dy! * s)}" stroke="${pal.palm}" stroke-width="${n1(8 * s)}" fill="none" stroke-linecap="round"/>`).join('');

const jar: Painter = (x, y, s) =>
  groundShadow(x, y, 18 * s) + cel(pathS(`M${n1(x - 10 * s)} ${n1(y - 44 * s)} Q${n1(x - 24 * s)} ${n1(y - 30 * s)} ${n1(x - 18 * s)} ${n1(y - 10 * s)} Q${n1(x)} ${n1(y + 4 * s)} ${n1(x + 18 * s)} ${n1(y - 10 * s)} Q${n1(x + 24 * s)} ${n1(y - 30 * s)} ${n1(x + 10 * s)} ${n1(y - 44 * s)}Z`), '#a8643e', { dx: 5, dy: 0, sw: SW * 0.7 });

/** Sortie : porte du palais, avec le trône au-dessus. */
const throneGate: Painter = (x, y, s) =>
  groundShadow(x, y, 70 * s) +
  cel(rectS(x - 66 * s, y - 110 * s, 132 * s, 110 * s, 4), pal.stone, { dx: 12, dy: 0 }) +
  flat(pathS(`M${n1(x - 30 * s)} ${n1(y)} L${n1(x - 30 * s)} ${n1(y - 70 * s)} L${n1(x)} ${n1(y - 90 * s)} L${n1(x + 30 * s)} ${n1(y - 70 * s)} L${n1(x + 30 * s)} ${n1(y)}Z`), '#2a1e14') +
  cel(rectS(x - 74 * s, y - 124 * s, 148 * s, 18 * s, 3), pal.dark, { dx: 0, dy: 6 }) +
  bolt(x, y - 104 * s, 0.35 * s, '#f2d23a');

// ---------------------------------------------------------------- fond

function ruins(base: number, k: number): string {
  let s = '';
  // nuages d'orage
  for (const [x, y, r] of [[160, 220, 120], [420, 250, 150], [760, 210, 140]] as const) s += `<ellipse cx="${x}" cy="${n1(base - y * k)}" rx="${r}" ry="${n1(40 * Math.max(k, 0.6))}" fill="#3a3450" opacity=".9"/>`;
  // dunes lointaines
  s += `<path d="M-20 ${base} Q160 ${n1(base - 60 * k)} 360 ${n1(base - 20 * k)} Q560 ${n1(base + 10)} 760 ${n1(base - 50 * k)} Q900 ${n1(base - 80 * k)} 1020 ${n1(base - 40 * k)} L1020 ${base + 30} L-20 ${base + 30}Z" fill="#9a7a54"/>`;
  // palais en ruines : colonnes cassées et grand portique
  const col = (x: number, h: number) => cel(rectS(x - 14, base - h * k, 28, h * k, 2), pal.stone, { dx: 6, dy: 0, sw: SW * 0.7 });
  s += col(120, 120) + col(180, 80) + col(820, 140) + col(880, 90);
  s += cel(polyS([{ x: 380, y: base }, { x: 400, y: base - 170 * k }, { x: 600, y: base - 170 * k }, { x: 620, y: base }]), pal.stone, { dx: 24, dy: 0, sw: SW * 0.8 });
  s += cel(rectS(370, base - 190 * k, 260, 26 * k + 4, 3), pal.dark, { dx: 0, dy: 6, sw: SW * 0.8 });
  s += `<path d="M450 ${base} L450 ${n1(base - 110 * k)} L500 ${n1(base - 140 * k)} L550 ${n1(base - 110 * k)} L550 ${base}Z" fill="#2a1e14" stroke="${INK}" stroke-width="5"/>`;
  s += bolt(500, base - 160 * k, 0.5 * Math.max(k, 0.6), '#f2d23a');
  return s;
}

function backdrop(c: Ctx): string {
  const k = c.mode === 'solo' ? 1 : 0.5;
  return scene(c, {
    texture: 'spots', pad: '#c4a476', padMargin: 0.9,
    horizon: (base) => ruins(base, k) + cel(rectS(-20, base - 4, 1040, 26, 0), pal.dark, { dx: 0, dy: 8 }),
    after: c.mode === 'solo' ? `<path d="M-20 ${c.z.strip.y + 30} Q250 ${c.z.strip.y - 20} 500 ${c.z.strip.y + 20} T1020 ${c.z.strip.y}" stroke="${pal.ground2}" stroke-width="40" fill="none" opacity=".8"/>` : '',
  });
}

// ---------------------------------------------------------------- animations

const dust = (x: number, y: number) =>
  `<g opacity=".55"><path d="M${x - 50} ${y} q25 -16 50 0 t50 0" stroke="#f2dcae" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M${x - 30} ${y + 16} q20 -12 40 0 t40 0" stroke="#e6c890" stroke-width="7" fill="none" stroke-linecap="round"/></g>`;

function anims(c: Ctx): AnimSpec[] {
  const [a, b, d, e, f] = spots(c);
  const solo = c.mode === 'solo';
  const sky = solo ? 170 : 55, br = solo ? 50 : 40;
  return [
    at('Éclairs sur les ruines', 'blink', { x: 250, y: sky }, br, bolt(250, sky, solo ? 1.5 : 0.9, pal.bolt), { period: 2.8, min: 0 }),
    at('Éclairs sur les ruines', 'blink', { x: 740, y: sky }, br, bolt(740, sky, solo ? 1.5 : 0.9, pal.bolt), { period: 3.5, min: 0, phase: 0.5 }),
    at('Éclairs sur les ruines', 'blink', d, 34, bolt(d.x, d.y, 1, pal.bolt), { period: 2.3, min: 0, phase: 0.2 }),
    across('Sable qui vole', solo ? c.z.strip.y : 1340, 6, (x, y) => dust(x, y - 20), { w: 110, h: 40 }),
    at('Sable qui vole', 'bob', a, 30, dust(a.x, a.y) , { period: 2, amp: 6 }),
    at('Braseros du palais', 'pulse', b, 34, brazier('#6a5038')(b.x, b.y + 30, 0.6, () => 0), { period: 1, amp: 0.06, oy: b.y + 30 }),
    at('Braseros du palais', 'blink', e, 22, glow(e.x, e.y, 8, '#f2a03a'), { period: 1.3, min: 0.3 }),
    at('Braseros du palais', 'blink', f, 22, glow(f.x, f.y, 8, '#f2a03a'), { period: 1.6, min: 0.3, phase: 0.5 }),
  ];
}

export const areneBlackadam = defineMap({
  id: 'arene-blackadam',
  name: 'Ruines de Kahndaq',
  tagline: 'Le royaume de Black Adam, frappé par la foudre.',
  universe: 'boss',
  heroes: [],
  boss: 'blackadam',
  shape: 'arch',
  pathMaterial: 'Sable et dalles de grès',
  pathKind: 'sand',
  frameKind: 'stone',
  palette: pal,
  backdrop,
  props: { big: [obelisk, palm, brokenStatue], med: [brokenStatue, obelisk, shardRock(pal.stone)], small: [jar, shardRock(pal.stone), jar] },
  gate: throneGate,
  anims,
  sound: 'kahndaq-tonnerre',
  unlock: { type: 'depart', value: 0 },
  bossFx: { description: 'Des éclairs blancs frappent les dunes et une tempête de sable traverse l\'écran.', effects: ['lightning', 'sandstorm', 'shake'], tint: '#5a4020', tintAlpha: 0.12, colors: { bolt: pal.bolt, sand: pal.sand } },
  mute: { sat: 0.76, lum: 0.88 },
});

export default areneBlackadam;
