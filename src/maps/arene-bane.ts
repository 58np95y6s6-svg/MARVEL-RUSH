// Arène de Bane : la cour de la prison de Blackgate, avec la jungle de Santa Prisca au loin.
// Miradors et projecteurs, grillages barbelés, barils de Venin. Pendant le boss : projecteurs qui
// balaient l'écran, pulsations vertes du Venin et tremblements.

import { type AnimSpec, type Ctx, type Painter, INK, SW, across, at, cel, defineMap, flat, glow, groundShadow, hills, n1, pathS, polyS, rectS, scene, spots } from './kit';
import { shardRock } from './dc-kit';

const pal = {
  bg: '#141614',
  sky1: '#1e2430', sky2: '#4a5260',
  ground: '#5a5a58', ground2: '#525250',
  path: '#b4b0a6', pathEdge: '#6a665e', pathDeco: '#8a867c',
  frame: '#8a867e', frameLight: '#b4b0a8', frameShade: '#5e5a54',
  cellA: '#f2f0ea', cellB: '#e2dfd6',
  accent: '#6ad84a', portal: '#6ad84a',
  concrete: '#8a867e', fence: '#3a3c40', venom: '#6ad84a', jungle: '#2e4a32', beam: '#fff6c8', orange: '#e8823a',
};

// ---------------------------------------------------------------- accessoires

/** Mirador de la prison. */
const watchtower: Painter = (x, y, s) =>
  groundShadow(x, y, 44 * s) +
  [-28, 28].map((d) => flat(rectS(x + d * s - 4 * s, y - 110 * s, 8 * s, 110 * s, 2), '#4a4c52', SW * 0.6)).join('') +
  flat(pathS(`M${n1(x - 28 * s)} ${n1(y - 10 * s)} L${n1(x + 28 * s)} ${n1(y - 90 * s)} M${n1(x + 28 * s)} ${n1(y - 10 * s)} L${n1(x - 28 * s)} ${n1(y - 90 * s)}`), 'none', SW * 0.5) +
  cel(rectS(x - 44 * s, y - 150 * s, 88 * s, 44 * s, 4), pal.concrete, { dx: 10, dy: 0 }) +
  `<rect x="${n1(x - 32 * s)}" y="${n1(y - 142 * s)}" width="${n1(64 * s)}" height="${n1(18 * s)}" rx="3" fill="${pal.beam}" opacity=".6" stroke="${INK}" stroke-width="${n1(3 * s)}"/>` +
  cel(polyS([{ x: x - 54 * s, y: y - 150 * s }, { x, y: y - 180 * s }, { x: x + 54 * s, y: y - 150 * s }]), '#5a5650', { dx: 0, dy: 6 });

/** Baril de Venin. */
const venomBarrel: Painter = (x, y, s) =>
  groundShadow(x, y, 26 * s) +
  cel(rectS(x - 22 * s, y - 56 * s, 44 * s, 56 * s, 8 * s), '#3e5a3a', { dx: 8, dy: 0 }) +
  [-40, -18].map((d) => `<line x1="${n1(x - 22 * s)}" y1="${n1(y + d * s)}" x2="${n1(x + 22 * s)}" y2="${n1(y + d * s)}" stroke="${INK}" stroke-width="${n1(3.5 * s)}" opacity=".5"/>`).join('') +
  `<ellipse cx="${n1(x)}" cy="${n1(y - 56 * s)}" rx="${n1(20 * s)}" ry="${n1(6 * s)}" fill="${pal.venom}" stroke="${INK}" stroke-width="${n1(3 * s)}"/>` +
  `<path d="M${n1(x - 8 * s)} ${n1(y - 30 * s)} l${n1(8 * s)} ${n1(-12 * s)} l${n1(8 * s)} ${n1(12 * s)}z" fill="${pal.venom}" stroke="${INK}" stroke-width="${n1(2.5 * s)}"/>`;

/** Pan de grillage barbelé. */
const fence: Painter = (x, y, s) => {
  const w = 120 * s, h = 90 * s;
  let o = groundShadow(x, y, w * 0.5, 8 * s) + `<g stroke="${pal.fence}" stroke-width="${n1(2.5 * s)}" opacity=".85">`;
  for (let i = 0; i <= 8; i++) o += `<line x1="${n1(x - w / 2 + (i * w) / 8)}" y1="${n1(y)}" x2="${n1(x - w / 2 + ((i + 2) * w) / 8)}" y2="${n1(y - h)}"/><line x1="${n1(x - w / 2 + (i * w) / 8)}" y1="${n1(y)}" x2="${n1(x - w / 2 + ((i - 2) * w) / 8)}" y2="${n1(y - h)}"/>`;
  o += `</g>`;
  o += flat(rectS(x - w / 2 - 4 * s, y - h - 10 * s, 8 * s, h + 10 * s, 2), pal.fence, SW * 0.6) + flat(rectS(x + w / 2 - 4 * s, y - h - 10 * s, 8 * s, h + 10 * s, 2), pal.fence, SW * 0.6);
  o += `<path d="M${n1(x - w / 2)} ${n1(y - h - 6 * s)} ${Array.from({ length: 8 }, (_, i) => `q${n1(w / 16)} ${n1(-10 * s)} ${n1(w / 8)} 0`).join(' ')}" stroke="#9a9ca4" stroke-width="${n1(3 * s)}" fill="none"/>`;
  return o;
};

const cone: Painter = (x, y, s) =>
  groundShadow(x, y, 16 * s) + cel(polyS([{ x: x - 14 * s, y }, { x: x - 4 * s, y: y - 36 * s }, { x: x + 4 * s, y: y - 36 * s }, { x: x + 14 * s, y }]), pal.orange, { dx: 4, dy: 0, sw: SW * 0.6 }) +
  `<rect x="${n1(x - 9 * s)}" y="${n1(y - 22 * s)}" width="${n1(18 * s)}" height="${n1(6 * s)}" fill="#fff"/>`;

/** Sortie : grille de la prison. */
const prisonGate: Painter = (x, y, s) =>
  groundShadow(x, y, 66 * s) +
  cel(rectS(x - 64 * s, y - 120 * s, 128 * s, 120 * s, 6 * s), pal.concrete, { dx: 12, dy: 0 }) +
  flat(rectS(x - 40 * s, y - 94 * s, 80 * s, 94 * s, 3), '#20221e') +
  [-28, -14, 0, 14, 28].map((d) => `<rect x="${n1(x + d * s - 3 * s)}" y="${n1(y - 94 * s)}" width="${n1(6 * s)}" height="${n1(94 * s)}" fill="#7a7c84" stroke="${INK}" stroke-width="${n1(2 * s)}"/>`).join('') +
  cel(rectS(x - 54 * s, y - 116 * s, 108 * s, 16 * s, 3), '#c8a03a', { dx: 0, dy: 4, sw: SW * 0.7 });

// ---------------------------------------------------------------- fond

function prisonWalls(base: number, k: number): string {
  let s = hills(base - 60 * k, pal.jungle, 50 * k, 'santa-prisca', 7);
  // palmiers lointains de Santa Prisca
  for (const x of [80, 260, 760, 920]) s += `<path d="M${x} ${n1(base - 50 * k)} q-6 ${n1(-50 * k)} 4 ${n1(-100 * k)}" stroke="${INK}" stroke-width="7" fill="none"/><path d="M${x + 4} ${n1(base - 150 * k)} q-40 6 -54 30 M${x + 4} ${n1(base - 150 * k)} q40 6 54 30 M${x + 4} ${n1(base - 150 * k)} q-20 -30 -46 -26 M${x + 4} ${n1(base - 150 * k)} q24 -30 50 -22" stroke="#2e5a3a" stroke-width="10" fill="none" stroke-linecap="round"/>`;
  // mur d'enceinte
  s += cel(rectS(-20, base - 90 * k, 1040, 90 * k + 30, 0), pal.concrete, { dx: 0, dy: 10, sw: SW * 0.8 });
  for (let x = 30; x < 1000; x += 120) s += `<line x1="${x}" y1="${n1(base - 88 * k)}" x2="${x}" y2="${base}" stroke="${INK}" stroke-width="3" opacity=".3"/>`;
  s += `<path d="M-20 ${n1(base - 96 * k)} ${Array.from({ length: 26 }, () => `q20 -12 40 0`).join(' ')}" stroke="#9a9ca4" stroke-width="4" fill="none"/>`;
  s += `<rect x="380" y="${n1(base - 70 * k)}" width="240" height="${n1(28 * k + 6)}" rx="4" fill="#2a2c28" stroke="${INK}" stroke-width="4"/>`;
  return s;
}

function backdrop(c: Ctx): string {
  const k = c.mode === 'solo' ? 1 : 0.5;
  return scene(c, {
    texture: 'spots', pad: '#6e6c66', padMargin: 0.9,
    horizon: (base) => `<circle cx="160" cy="${n1(base - 210 * k)}" r="${n1(46 * Math.max(k, 0.6))}" fill="#e8e4cc" opacity=".8"/>` + prisonWalls(base, k),
    after: c.mode === 'solo' ? yardLines(c.z.strip.y) : '',
  });
}

function yardLines(y: number): string {
  return `<rect x="-20" y="${y - 40}" width="1040" height="80" fill="#4a4a48"/>` +
    Array.from({ length: 12 }, (_, i) => `<path d="M${i * 90} ${y + 36} l40 -72 l20 0 l-40 72z" fill="#e8c23a" opacity=".55"/>`).join('');
}

// ---------------------------------------------------------------- animations

function anims(c: Ctx): AnimSpec[] {
  const [a, b, d, e] = spots(c);
  const solo = c.mode === 'solo';
  const k = solo ? 1 : 0.5, base = solo ? 270 : 118, top = base - 96 * k;
  const beam = (x: number) => `<path d="M${x} ${n1(top)} L${x - 70} ${n1(top - 160 * k)} L${x + 70} ${n1(top - 160 * k)}Z" fill="${pal.beam}" opacity=".3"/><circle cx="${x}" cy="${n1(top)}" r="10" fill="${pal.beam}" stroke="${INK}" stroke-width="3"/>`;
  return [
    { label: 'Projecteurs qui balaient', kind: 'sway', period: 5, amp: 12, ox: 300, oy: top, box: { x: 230, y: top - 160 * k, w: 140, h: 160 * k + 12 }, markup: beam(300) },
    { label: 'Projecteurs qui balaient', kind: 'sway', period: 6, phase: 0.5, amp: 12, ox: 700, oy: top, box: { x: 630, y: top - 160 * k, w: 140, h: 160 * k + 12 }, markup: beam(700) },
    at('Venin qui bouillonne', 'pulse', a, 32, glow(a.x, a.y, 11, pal.venom), { period: 1.6, amp: 0.2 }),
    at('Venin qui bouillonne', 'pulse', b, 32, glow(b.x, b.y, 11, pal.venom), { period: 1.9, amp: 0.2, phase: 0.4 }),
    at('Venin qui bouillonne', 'bob', d, 30, shardRock('#6a6862')(d.x, d.y + 20, 0.5, () => 0) + glow(d.x, d.y - 4, 6, pal.venom), { period: 2.2, amp: 4 }),
    at('Projecteurs qui balaient', 'blink', e, 22, glow(e.x, e.y, 8, '#e8413b'), { period: 1.2, min: 0.1 }),
    ...(solo ? [across('Projecteurs qui balaient', c.z.strip.y, 9, (x, y) => `<ellipse cx="${x}" cy="${y - 20}" rx="56" ry="22" fill="${pal.beam}" opacity=".3"/>`, { w: 120, h: 50 })] : []),
  ];
}

export const areneBane = defineMap({
  id: 'arene-bane',
  name: 'Cour de Blackgate',
  tagline: 'La prison de Blackgate, comme la forteresse de Santa Prisca.',
  universe: 'boss',
  heroes: [],
  boss: 'bane',
  shape: 'steps',
  pathMaterial: 'Béton fissuré de la cour',
  pathKind: 'slabs',
  frameKind: 'concrete',
  palette: pal,
  backdrop,
  props: { big: [watchtower, fence, watchtower], med: [venomBarrel, fence, venomBarrel], small: [cone, shardRock('#6a6862'), cone] },
  gate: prisonGate,
  anims,
  sound: 'blackgate-tambours',
  unlock: { type: 'depart', value: 0 },
  bossFx: { description: 'Les projecteurs balaient l\'écran, le Venin pulse en vert et l\'écran tremble à chaque coup de Bane.', effects: ['searchlights', 'venom-pulse', 'shake'], tint: '#1a2a10', tintAlpha: 0.1, colors: { venom: pal.venom, beam: pal.beam } },
  mute: { sat: 0.74, lum: 0.88 },
});

export default areneBane;
