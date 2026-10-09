// Arène de Sinestro : Qward, l'univers d'antimatière. Roche violette déchiquetée, flèches noires,
// la Batterie jaune du Corps Sinestro qui brûle de peur. Pendant le boss : l'écran se teinte de jaune
// et l'énergie de la peur pulse.

import { type AnimSpec, type Ctx, type Painter, INK, SW, across, at, cel, defineMap, flat, gloss, glow, groundShadow, light, n1, pathS, polyS, rectS, scene, spots, stars } from './kit';
import { shardRock } from './dc-kit';

const pal = {
  bg: '#0c0614',
  sky1: '#120a20', sky2: '#3a1e4a',
  ground: '#2e2238', ground2: '#281e32',
  path: '#c8b8c8', pathEdge: '#5a4a62', pathDeco: '#f2d23a',
  frame: '#5a4a66', frameLight: '#8a7898', frameShade: '#3a2e46',
  cellA: '#f4f0f4', cellB: '#e4dce6',
  accent: '#f2d23a', portal: '#f2d23a',
  fear: '#f2d23a', rock: '#3e2e4a', spire: '#221a2e', red: '#c0263a',
};

// ---------------------------------------------------------------- accessoires

const spire: Painter = (x, y, s) =>
  groundShadow(x, y, 30 * s) +
  cel(polyS([{ x: x - 26 * s, y }, { x: x - 14 * s, y: y - 90 * s }, { x: x - 22 * s, y: y - 100 * s }, { x: x - 2 * s, y: y - 170 * s }, { x: x + 10 * s, y: y - 110 * s }, { x: x + 4 * s, y: y - 96 * s }, { x: x + 26 * s, y }]), pal.spire, { dx: 8, dy: 0 }) +
  `<path d="M${n1(x - 6 * s)} ${n1(y - 60 * s)} l${n1(6 * s)} ${n1(-20 * s)} l${n1(6 * s)} ${n1(20 * s)}" stroke="${pal.fear}" stroke-width="${n1(3 * s)}" fill="none" opacity=".7"/>`;

/** Petite lanterne jaune du Corps Sinestro. */
const yellowLantern: Painter = (x, y, s) =>
  groundShadow(x, y, 26 * s) + `<circle cx="${n1(x)}" cy="${n1(y - 44 * s)}" r="${n1(40 * s)}" fill="${pal.fear}" opacity=".14"/>` +
  cel(rectS(x - 22 * s, y - 14 * s, 44 * s, 14 * s, 3), '#4a3a52', { dx: 0, dy: 4 }) +
  cel(pathS(`M${n1(x - 16 * s)} ${n1(y - 14 * s)} L${n1(x - 20 * s)} ${n1(y - 66 * s)} L${n1(x)} ${n1(y - 76 * s)} L${n1(x + 20 * s)} ${n1(y - 66 * s)} L${n1(x + 16 * s)} ${n1(y - 14 * s)}Z`), pal.fear, { dx: 7, dy: 0 }) +
  `<path d="M${n1(x - 8 * s)} ${n1(y - 50 * s)} l${n1(8 * s)} ${n1(10 * s)} l${n1(8 * s)} ${n1(-10 * s)} M${n1(x)} ${n1(y - 40 * s)} l0 ${n1(18 * s)}" stroke="${INK}" stroke-width="${n1(3 * s)}" fill="none" opacity=".55"/>`;

/** Crâne de pierre (la peur). */
const skullRock: Painter = (x, y, s) =>
  groundShadow(x, y, 34 * s) +
  cel(pathS(`M${n1(x - 30 * s)} ${n1(y)} L${n1(x - 30 * s)} ${n1(y - 40 * s)} Q${n1(x - 32 * s)} ${n1(y - 80 * s)} ${n1(x)} ${n1(y - 82 * s)} Q${n1(x + 32 * s)} ${n1(y - 80 * s)} ${n1(x + 30 * s)} ${n1(y - 40 * s)} L${n1(x + 30 * s)} ${n1(y)}Z`), '#6a5a74', { dx: 8, dy: 0 }) +
  `<circle cx="${n1(x - 12 * s)}" cy="${n1(y - 46 * s)}" r="${n1(9 * s)}" fill="${pal.fear}" stroke="${INK}" stroke-width="${n1(3 * s)}"/><circle cx="${n1(x + 12 * s)}" cy="${n1(y - 46 * s)}" r="${n1(9 * s)}" fill="${pal.fear}" stroke="${INK}" stroke-width="${n1(3 * s)}"/>` +
  `<path d="M${n1(x - 14 * s)} ${n1(y - 16 * s)} h${n1(28 * s)} M${n1(x - 6 * s)} ${n1(y - 22 * s)} v${n1(10 * s)} M${n1(x + 6 * s)} ${n1(y - 22 * s)} v${n1(10 * s)}" stroke="${INK}" stroke-width="${n1(3 * s)}"/>`;

/** Sortie : arche d'antimatière. */
const qwardGate: Painter = (x, y, s) =>
  groundShadow(x, y, 66 * s) +
  cel(polyS([{ x: x - 66 * s, y }, { x: x - 54 * s, y: y - 120 * s }, { x: x, y: y - 170 * s }, { x: x + 54 * s, y: y - 120 * s }, { x: x + 66 * s, y }]), pal.spire, { dx: 12, dy: 0 }) +
  flat(pathS(`M${n1(x - 32 * s)} ${n1(y)} L${n1(x - 28 * s)} ${n1(y - 80 * s)} L${n1(x)} ${n1(y - 116 * s)} L${n1(x + 28 * s)} ${n1(y - 80 * s)} L${n1(x + 32 * s)} ${n1(y)}Z`), '#5a2a12') +
  `<path d="M${n1(x - 20 * s)} ${n1(y - 70 * s)} L${n1(x)} ${n1(y - 96 * s)} L${n1(x + 20 * s)} ${n1(y - 70 * s)}" stroke="${pal.fear}" stroke-width="${n1(5 * s)}" fill="none"/>`;

// ---------------------------------------------------------------- fond

/** La grande Batterie jaune de Qward. */
function yellowBattery(cx: number, base: number, k: number): string {
  const w = 130 * Math.max(k, 0.55), h = 140 * k, top = base - 50 * k - h;
  let s = `<circle cx="${cx}" cy="${n1(top + h / 2)}" r="${n1(w * 1.5)}" fill="${pal.fear}" opacity=".1"/><circle cx="${cx}" cy="${n1(top + h / 2)}" r="${n1(w)}" fill="${pal.fear}" opacity=".14"/>`;
  s += cel(polyS([{ x: cx - w, y: base + 10 }, { x: cx - w * 0.5, y: base - 50 * k }, { x: cx + w * 0.5, y: base - 50 * k }, { x: cx + w, y: base + 10 }]), pal.rock, { dx: 20, dy: 0, sw: SW * 0.8 });
  s += cel(pathS(`M${n1(cx - w * 0.45)} ${n1(top + h)} L${n1(cx - w * 0.55)} ${n1(top + h * 0.15)} L${cx} ${n1(top - h * 0.15)} L${n1(cx + w * 0.55)} ${n1(top + h * 0.15)} L${n1(cx + w * 0.45)} ${n1(top + h)}Z`), pal.fear, { dx: w * 0.15, dy: 0, sw: SW * 0.9 });
  s += `<path d="M${n1(cx - w * 0.2)} ${n1(top + h * 0.35)} L${cx} ${n1(top + h * 0.55)} L${n1(cx + w * 0.2)} ${n1(top + h * 0.35)} M${cx} ${n1(top + h * 0.55)} L${cx} ${n1(top + h * 0.9)}" stroke="${INK}" stroke-width="6" fill="none" opacity=".55"/>`;
  s += gloss(cx - w * 0.3, top + h * 0.3, 5, h * 0.2, 0, 0.4);
  return s;
}

function backdrop(c: Ctx): string {
  const k = c.mode === 'solo' ? 1 : 0.5;
  return scene(c, {
    texture: 'spots', pad: '#3e3048', padMargin: 0.9,
    horizon: (base) => {
      let s = stars(c, 30, { x: 0, y: 0, w: 1000, h: base - 60 }, '#f2e08a');
      s += `<ellipse cx="250" cy="${n1(base - 200 * k)}" rx="300" ry="60" fill="${pal.red}" opacity=".14"/><ellipse cx="800" cy="${n1(base - 160 * k)}" rx="240" ry="50" fill="${pal.fear}" opacity=".1"/>`;
      // crêtes déchiquetées
      s += `<path d="M-20 ${base + 10} ${Array.from({ length: 14 }, (_, i) => `L${i * 76 + 20} ${n1(base - (40 + ((i * 47) % 110)) * k)} L${i * 76 + 50} ${n1(base - (20 + ((i * 29) % 50)) * k)}`).join(' ')} L1020 ${base + 10}Z" fill="${pal.spire}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`;
      s += yellowBattery(500, base, k);
      s += cel(rectS(-20, base - 4, 1040, 26, 0), pal.rock, { dx: 0, dy: 8 });
      return s;
    },
    after: c.mode === 'solo' ? `<path d="M-20 ${c.z.strip.y} Q250 ${c.z.strip.y - 30} 500 ${c.z.strip.y} T1020 ${c.z.strip.y}" stroke="${pal.fear}" stroke-width="10" fill="none" opacity=".25"/>` : '',
  });
}

// ---------------------------------------------------------------- animations

const wisp = (x: number, y: number) =>
  `<path d="M${x} ${y + 20} Q${x - 18} ${y} ${x - 4} ${y - 14} Q${x + 8} ${y - 26} ${x + 2} ${y - 36} Q${x + 22} ${y - 18} ${x + 12} ${y + 4} Q${x + 8} ${y + 18} ${x} ${y + 20}Z" fill="${pal.fear}" opacity=".7" stroke="${INK}" stroke-width="3"/>` +
  `<circle cx="${x + 2}" cy="${y - 4}" r="6" fill="${light(pal.fear, 0.6)}"/>`;

function anims(c: Ctx): AnimSpec[] {
  const [a, b, d, e, f] = spots(c);
  const solo = c.mode === 'solo';
  const k = solo ? 1 : 0.5, base = solo ? 270 : 118, cy = base - 50 * k - 70 * k;
  return [
    at('Batterie de la peur', 'pulse', { x: 500, y: n1(cy) }, solo ? 66 : 36, `<circle cx="500" cy="${n1(cy)}" r="${solo ? 64 : 34}" fill="${pal.fear}" opacity=".2"/>`, { period: 1.8, amp: 0.12 }),
    at('Feux follets jaunes', 'bob', a, 36, wisp(a.x, a.y), { period: 2.2, amp: 8 }),
    at('Feux follets jaunes', 'bob', b, 36, wisp(b.x, b.y), { period: 2.6, amp: 8, phase: 0.5 }),
    at('Feux follets jaunes', 'blink', d, 30, wisp(d.x, d.y), { period: 3, min: 0.2 }),
    at('Batterie de la peur', 'blink', e, 24, glow(e.x, e.y, 8, pal.fear), { period: 1.4, min: 0.2 }),
    at('Batterie de la peur', 'blink', f, 24, glow(f.x, f.y, 8, pal.red), { period: 1.9, min: 0.2, phase: 0.5 }),
    ...(solo ? [across('Feux follets jaunes', c.z.strip.y, 12, (x, y) => wisp(x, y - 26), { w: 60, h: 60 })] : []),
  ];
}

export const areneSinestro = defineMap({
  id: 'arene-sinestro',
  name: 'Qward',
  tagline: 'L\'univers d\'antimatière où brûle la lumière jaune de la peur.',
  universe: 'boss',
  heroes: [],
  boss: 'sinestro',
  shape: 'wave',
  pathMaterial: 'Roche d\'antimatière veinée de jaune',
  pathKind: 'energy',
  frameKind: 'obsidian',
  palette: pal,
  backdrop,
  props: { big: [spire, yellowLantern, spire], med: [skullRock, yellowLantern, shardRock(pal.rock)], small: [shardRock(pal.rock), yellowLantern] },
  gate: qwardGate,
  anims,
  sound: 'qward-dissonances',
  unlock: { type: 'depart', value: 0 },
  bossFx: { description: 'L\'écran se teinte du jaune de la peur et l\'énergie pulse au rythme de la Batterie.', effects: ['fear-tint', 'yellow-pulse'], tint: '#f2d23a', tintAlpha: 0.16, colors: { fear: pal.fear } },
  mute: { sat: 0.8, lum: 0.88 },
});

export default areneSinestro;
