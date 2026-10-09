// Île de Motunui (Vaïana, Maui) : sable et rochers au bord du lagon, cocotiers, pirogue,
// vagues animées, Te Fiti en fond.

import {
  type Ctx, type Painter, INK, P, SW, across, at, cel, circleS, cloud, defineMap, ellS, flat, gloss, groundShadow, n1,
  pathS, rectS, scene, spots,
} from './kit';

const pal = {
  bg: '#0f3a4a',
  sky1: '#6ec0e0', sky2: '#d6f0ee',
  ground: '#2f9aa8', ground2: '#3bb0b8',
  path: '#ecd7a4', pathEdge: '#b49662', pathDeco: '#d1b67c',
  frame: '#a8724a', frameLight: '#d39f6c', frameShade: '#6e4628',
  cellA: '#fbf4e2', cellB: '#efe2c2',
  accent: '#e85a3c', portal: '#4fe0c8',
  sand: '#e6cf98', palm: '#4f9a52', trunk: '#9a6a42', tefiti: '#5aa86a',
};

export const palm: Painter = (x, y, s) => {
  let o = groundShadow(x + 20 * s, y, 44 * s);
  o += cel(pathS(`M${n1(x - 8 * s)} ${n1(y)} Q${n1(x - 4 * s)} ${n1(y - 90 * s)} ${n1(x + 26 * s)} ${n1(y - 170 * s)} L${n1(x + 40 * s)} ${n1(y - 166 * s)} Q${n1(x + 14 * s)} ${n1(y - 90 * s)} ${n1(x + 10 * s)} ${n1(y)}Z`), pal.trunk, { dx: 5, dy: 0 });
  const top = { x: x + 33 * s, y: y - 170 * s };
  for (const [ang, len] of [[-160, 80], [-120, 70], [-60, 72], [-20, 82], [20, 64], [160, 64]] as const) {
    const a = (ang * Math.PI) / 180, ex = top.x + Math.cos(a) * len * s, ey = top.y + Math.sin(a) * len * s + 26 * s;
    const mx = top.x + Math.cos(a) * len * 0.5 * s, my = top.y + Math.sin(a) * len * 0.5 * s - 16 * s;
    o += cel(pathS(`M${n1(top.x)} ${n1(top.y)} Q${n1(mx - 10 * s)} ${n1(my)} ${n1(ex)} ${n1(ey)} Q${n1(mx + 10 * s)} ${n1(my + 18 * s)} ${n1(top.x)} ${n1(top.y)}Z`), pal.palm, { dx: 0, dy: 6, sw: SW * 0.8 });
  }
  return o + flat(circleS(top.x - 8 * s, top.y + 8 * s, 9 * s), '#7a5232', SW * 0.6) + flat(circleS(top.x + 8 * s, top.y + 10 * s, 9 * s), '#7a5232', SW * 0.6);
};

const canoe: Painter = (x, y, s) =>
  groundShadow(x, y, 70 * s, 10 * s) +
  cel(pathS(`M${n1(x - 76 * s)} ${n1(y - 26 * s)} Q${n1(x)} ${n1(y + 6 * s)} ${n1(x + 76 * s)} ${n1(y - 26 * s)} L${n1(x + 60 * s)} ${n1(y - 12 * s)} Q${n1(x)} ${n1(y + 2 * s)} ${n1(x - 60 * s)} ${n1(y - 12 * s)}Z`), '#9a5e3a', { dx: 0, dy: 5 }) +
  flat(rectS(x - 3 * s, y - 110 * s, 6 * s, 96 * s, 2), '#6e4628', SW * 0.6) +
  cel(pathS(`M${n1(x + 3 * s)} ${n1(y - 106 * s)} Q${n1(x + 50 * s)} ${n1(y - 80 * s)} ${n1(x + 40 * s)} ${n1(y - 30 * s)} L${n1(x + 3 * s)} ${n1(y - 30 * s)}Z`), '#e8d2a8', { dx: 6, dy: 0 }) +
  `<path d="M${n1(x + 14 * s)} ${n1(y - 76 * s)} q8 -8 16 0 q-8 8 -16 0" fill="${pal.accent}"/>`;

const shell: Painter = (x, y, s) =>
  groundShadow(x, y, 16 * s) + cel(pathS(`M${n1(x - 16 * s)} ${n1(y)} Q${n1(x)} ${n1(y - 34 * s)} ${n1(x + 16 * s)} ${n1(y)}Z`), '#f2b3a0', { dx: 4, dy: 0 }) +
  `<path d="M${n1(x)} ${n1(y - 2)} L${n1(x)} ${n1(y - 22 * s)} M${n1(x - 7 * s)} ${n1(y - 2)} L${n1(x - 4 * s)} ${n1(y - 18 * s)} M${n1(x + 7 * s)} ${n1(y - 2)} L${n1(x + 4 * s)} ${n1(y - 18 * s)}" stroke="${INK}" stroke-width="2" opacity=".5"/>`;

const sandIsle: Painter = (x, y, s) =>
  cel(ellS(x, y - 18 * s, 54 * s, 22 * s), pal.sand, { dx: 0, dy: 6 }) + P.bush('#5ea85a')(x - 10 * s, y - 20 * s, 0.6 * s, () => 0);

function teFiti(base: number): string {
  return cel(pathS(`M260 ${base} Q330 ${base - 70} 420 ${base - 120} Q500 ${base - 160} 580 ${base - 120} Q670 ${base - 70} 740 ${base}Z`), pal.tefiti, { dx: 20, dy: 0 }) +
    `<path d="M440 ${base - 110} Q470 ${base - 140} 500 ${base - 120} Q520 ${base - 150} 560 ${base - 112}" stroke="#a6dc8a" stroke-width="10" fill="none" stroke-linecap="round"/>` +
    [[420, base - 96], [520, base - 130], [610, base - 84]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="#f28fb0" stroke="${INK}" stroke-width="3"/>`).join('');
}

function backdrop(c: Ctx): string {
  return scene(c, {
    texture: 'none', pad: pal.sand, padMargin: 0.95,
    horizon: (base) => cloud(160, base - 160, 0.8, '#ffffff') + cloud(860, base - 190, 0.6, '#ffffff') +
      `<rect x="-10" y="${base - 60}" width="1020" height="90" fill="#3fb4c4"/>` + teFiti(base - 40) +
      `<path d="M-10 ${base - 20} Q250 ${base - 34} 500 ${base - 20} T1010 ${base - 20} V${base + 30} H-10Z" fill="#53c3cc"/>`,
    after: Array.from({ length: 22 }, (_, i) => {
      const x = (i * 163) % 1000, y = horizonOf(c) + 80 + ((i * 271) % (1520 - horizonOf(c)));
      return `<path d="M${x - 26} ${y} q13 -9 26 0 t26 0" stroke="#bdf0ee" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>`;
    }).join(''),
  });
}
const horizonOf = (c: Ctx) => (c.mode === 'solo' ? 270 : 118);

function anims(c: Ctx) {
  const [a, b, d, e] = spots(c);
  const wave = (x: number, y: number) => `<path d="M${x - 34} ${y} q17 -16 34 0 t34 0" stroke="#e8fbfa" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M${x - 20} ${y + 14} q10 -8 20 0 t20 0" stroke="#bdf0ee" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  const gull = (x: number, y: number) => `<path d="M${x - 22} ${y} q11 -12 22 0 q11 -12 22 0" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  const sky = c.mode === 'solo' ? 150 : 50;
  return [
    at('Vagues du lagon', 'bob', a, 40, wave(a.x, a.y), { period: 2.4, amp: 6 }),
    at('Vagues du lagon', 'bob', b, 40, wave(b.x, b.y), { period: 2.8, amp: 6, phase: 0.5 }),
    at('Vagues du lagon', 'pulse', d, 40, wave(d.x, d.y), { period: 3, amp: 0.12 }),
    across('Mouettes', sky, 14, (x, y) => gull(x, y) + gull(x + 30, y + 16), { w: 90, h: 40 }),
    at('Écume', 'blink', e, 20, `<circle cx="${e.x}" cy="${e.y}" r="6" fill="#fff"/><circle cx="${e.x + 12}" cy="${e.y + 6}" r="4" fill="#fff"/>`, { period: 1.6, min: 0.2 }),
  ];
}

export const ileMotunui = defineMap({
  id: 'ile-motunui',
  name: 'Île de Motunui',
  tagline: 'Le sable chaud, le lagon et Te Fiti à l\'horizon.',
  universe: 'disney',
  heroes: ['moana', 'maui'],
  shape: 'wave',
  pathMaterial: 'Sable et rochers au bord du lagon',
  pathKind: 'sand',
  frameKind: 'wood',
  palette: pal,
  backdrop,
  props: { big: [palm, palm], med: [canoe, sandIsle, P.rock('#8a8f86')], small: [shell, P.rock('#8a8f86'), shell] },
  gate: (x, y, s) => groundShadow(x, y, 66 * s) +
    cel(pathS(`M${n1(x - 66 * s)} ${n1(y)} L${n1(x - 50 * s)} ${n1(y - 70 * s)} Q${n1(x)} ${n1(y - 150 * s)} ${n1(x + 50 * s)} ${n1(y - 70 * s)} L${n1(x + 66 * s)} ${n1(y)}Z`), '#c9a46a', { dx: 10, dy: 0 }) +
    flat(pathS(`M${n1(x - 26 * s)} ${n1(y)} L${n1(x - 22 * s)} ${n1(y - 52 * s)} Q${n1(x)} ${n1(y - 70 * s)} ${n1(x + 22 * s)} ${n1(y - 52 * s)} L${n1(x + 26 * s)} ${n1(y)}Z`), '#4a2f22') +
    `<path d="M${n1(x - 50 * s)} ${n1(y - 76 * s)} L${n1(x + 50 * s)} ${n1(y - 76 * s)}" stroke="${INK}" stroke-width="4" stroke-dasharray="8 6"/>` + gloss(x - 30 * s, y - 100 * s, 10 * s, 5 * s),
  anims,
  sound: 'ocean-tambours',
  modifiers: { dureeControles: 0.1 },
  unlock: { type: 'vagues', value: 30 },
  mute: { sat: 0.7, lum: 0.86 },
});

export default ileMotunui;
