// Arène de Maléfique : Montagne interdite. Château noir, ronces, corbeaux, flammes vertes.
// Pendant le boss : ronces qui poussent sur les bords, flammes vertes.

import { type Ctx, type Painter, INK, across, at, cel, defineMap, glow, groundShadow, n1, pathS, polyS, rectS, scene, spots, peaks } from './kit';

const pal = {
  bg: '#0c0c14',
  sky1: '#1a1428', sky2: '#3a2a4a',
  ground: '#2e2a38', ground2: '#262230',
  path: '#8a8494', pathEdge: '#4a4454', pathDeco: '#4a6a3a',
  frame: '#3a3644', frameLight: '#6a6476', frameShade: '#1e1c26',
  cellA: '#eeecf2', cellB: '#dcd8e4',
  accent: '#5ae05a', portal: '#5ae05a',
  thorn: '#3a4a2e', flame: '#6ae86a', castle: '#24202e',
};

const thornBush: Painter = (x, y, s) => {
  const d = `M${n1(x - 40 * s)} ${y} Q${n1(x - 50 * s)} ${n1(y - 60 * s)} ${n1(x - 10 * s)} ${n1(y - 90 * s)} M${n1(x)} ${y} Q${n1(x + 10 * s)} ${n1(y - 80 * s)} ${n1(x + 40 * s)} ${n1(y - 110 * s)} M${n1(x + 30 * s)} ${y} Q${n1(x + 50 * s)} ${n1(y - 40 * s)} ${n1(x + 20 * s)} ${n1(y - 60 * s)}`;
  return groundShadow(x, y, 46 * s) + `<path d="${d}" stroke="${INK}" stroke-width="${n1(18 * s)}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${pal.thorn}" stroke-width="${n1(10 * s)}" fill="none" stroke-linecap="round"/>` +
    [[-30, -40], [-20, -70], [10, -50], [28, -88], [36, -30]].map(([dx, dy]) => `<path d="M${n1(x + dx! * s)} ${n1(y + dy! * s)} l${n1(10 * s)} ${n1(-4 * s)} l${n1(-6 * s)} ${n1(8 * s)}z" fill="${pal.thorn}" stroke="${INK}" stroke-width="2"/>`).join('');
};

const brazier: Painter = (x, y, s) =>
  groundShadow(x, y, 26 * s) + cel(polyS([{ x: x - 24 * s, y: y - 40 * s }, { x: x + 24 * s, y: y - 40 * s }, { x: x + 10 * s, y }, { x: x - 10 * s, y }]), '#3a3644', { dx: 5, dy: 0 }) +
  `<path d="M${n1(x - 20 * s)} ${n1(y - 40 * s)} Q${n1(x - 18 * s)} ${n1(y - 80 * s)} ${n1(x)} ${n1(y - 96 * s)} Q${n1(x + 4 * s)} ${n1(y - 70 * s)} ${n1(x + 20 * s)} ${n1(y - 40 * s)}Z" fill="${pal.flame}" stroke="${INK}" stroke-width="3"/>`;

const spike: Painter = (x, y, s) =>
  groundShadow(x, y, 22 * s) + cel(polyS([{ x: x - 18 * s, y }, { x: x - 2 * s, y: y - 70 * s }, { x: x + 18 * s, y }]), '#3a3644', { dx: 6, dy: 0 });

function castle(base: number): string {
  let s = '';
  for (const [x, w, h] of [[360, 50, 170], [440, 60, 230], [520, 70, 280], [600, 56, 210], [670, 44, 150]] as const) {
    s += cel(rectS(x - w / 2, base - h, w, h + 20, 4), pal.castle, { dx: 10, dy: 0 });
    s += cel(polyS([{ x: x - w * 0.7, y: base - h + 4 }, { x, y: base - h - w * 1.6 }, { x: x + w * 0.7, y: base - h + 4 }]), '#2e2838', { dx: 8, dy: 0 });
    s += `<rect x="${x - 5}" y="${base - h + 30}" width="10" height="16" rx="5" fill="${pal.flame}" opacity=".8"/>`;
  }
  return s;
}

function backdrop(c: Ctx): string {
  return scene(c, {
    texture: 'spots', pad: '#3a3644', padMargin: 0.9,
    horizon: (base) => `<circle cx="160" cy="${base - 170}" r="40" fill="#c8f0b8" opacity=".6"/>` + peaks(base - 10, '#2a2436', 160, 'malefique', 4) + castle(base),
  });
}

function anims(c: Ctx) {
  const [a, b, d, e] = spots(c);
  const crow = (x: number, y: number) => `<path d="M${x - 26} ${y} q13 -16 26 -2 q13 -14 26 2 q-14 -4 -26 8 q-12 -12 -26 -8z" fill="${INK}"/><circle cx="${x + 2}" cy="${y - 2}" r="3" fill="${pal.flame}"/>`;
  const flame = (p: { x: number; y: number }) => `<path d="M${p.x - 16} ${p.y + 20} Q${p.x - 18} ${p.y - 10} ${p.x} ${p.y - 30} Q${p.x + 4} ${p.y - 6} ${p.x + 16} ${p.y + 20}Z" fill="${pal.flame}" stroke="${INK}" stroke-width="3"/>` + glow(p.x, p.y + 6, 5, '#c8ffb8');
  return [
    across('Corbeaux', c.mode === 'solo' ? 150 : 56, 13, (x, y) => crow(x, y) + crow(x + 46, y + 20), { w: 110, h: 50 }),
    at('Flammes vertes', 'pulse', a, 36, flame(a), { period: 1.1, amp: 0.12, oy: a.y + 20 }),
    at('Flammes vertes', 'pulse', b, 36, flame(b), { period: 1.3, amp: 0.12, oy: b.y + 20, phase: 0.4 }),
    at('Flammes vertes', 'blink', e, 30, glow(e.x, e.y, 8, pal.flame), { period: 1.8, min: 0.3 }),
    at('Ronces', 'sway', d, 40, thornBush(d.x, d.y + 36, 0.6, () => 0), { period: 3.4, amp: 4, oy: d.y + 36 }),
  ];
}

export const areneMalefique = defineMap({
  id: 'arene-malefique',
  name: 'Montagne interdite',
  tagline: 'Le château noir de Maléfique, cerné de ronces.',
  universe: 'boss',
  heroes: [],
  boss: 'malefique',
  shape: 'zigzag',
  pathMaterial: 'Dalles noires bordées de ronces',
  pathKind: 'thorns',
  frameKind: 'obsidian',
  palette: pal,
  backdrop,
  props: { big: [thornBush, spike], med: [brazier, thornBush], small: [spike, brazier] },
  anims,
  sound: 'malefique-choeurs',
  unlock: { type: 'depart', value: 0 },
  bossFx: { description: 'Des ronces poussent sur les bords de l\'écran, flammes vertes.', effects: ['thorns-edges', 'green-flames'], tint: '#2a4a1a', tintAlpha: 0.12 },
  mute: { sat: 0.72, lum: 0.88 },
});

export default areneMalefique;

void pathS;
