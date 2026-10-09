// Arène d'Ursula : antre sous-marin. Squelette de baleine, âmes-polypes, bulles, lumière de
// nautile. Pendant le boss : ondulation de tout l'écran, bulles qui remontent.

import { type Ctx, type Painter, INK, SW, at, cel, circleS, defineMap, ellS, glow, groundShadow, n1, pathS, scene, spots } from './kit';
import { seaweed } from './atlantica';

const pal = {
  bg: '#0e0a24',
  sky1: '#120c30', sky2: '#2a1f5a',
  ground: '#2e2a52', ground2: '#373260',
  path: '#a89ac0', pathEdge: '#5a4e7a', pathDeco: '#c8b8e0',
  frame: '#d8cfc0', frameLight: '#f4ecdc', frameShade: '#9a8e7e',
  cellA: '#f2eef8', cellB: '#e0d8ee',
  accent: '#9b59e6', portal: '#9b59e6',
  polyp: '#7ac06a', bone: '#e8e0cc', nautilus: '#f2c96a', purple: '#7a4ab0',
};

const polyp: Painter = (x, y, s) =>
  groundShadow(x, y, 24 * s) + cel(pathS(`M${n1(x - 16 * s)} ${n1(y)} Q${n1(x - 20 * s)} ${n1(y - 40 * s)} ${n1(x - 6 * s)} ${n1(y - 56 * s)} Q${n1(x + 12 * s)} ${n1(y - 66 * s)} ${n1(x + 16 * s)} ${n1(y - 44 * s)} Q${n1(x + 20 * s)} ${n1(y - 20 * s)} ${n1(x + 16 * s)} ${n1(y)}Z`), pal.polyp, { dx: 6, dy: 0 }) +
  `<circle cx="${n1(x - 2 * s)}" cy="${n1(y - 44 * s)}" r="${n1(6 * s)}" fill="#fff" stroke="${INK}" stroke-width="2"/><circle cx="${n1(x + 8 * s)}" cy="${n1(y - 42 * s)}" r="${n1(5 * s)}" fill="#fff" stroke="${INK}" stroke-width="2"/>` +
  `<path d="M${n1(x - 6 * s)} ${n1(y - 28 * s)} q6 6 12 0" stroke="${INK}" stroke-width="3" fill="none"/>`;

const rib: Painter = (x, y, s) =>
  groundShadow(x, y, 50 * s) + [-36, -12, 12, 36].map((d) =>
    `<path d="M${n1(x + d * s)} ${y} Q${n1(x + d * s - 30 * s)} ${n1(y - 90 * s)} ${n1(x + d * 0.3 * s)} ${n1(y - 150 * s)}" stroke="${INK}" stroke-width="${n1(18 * s)}" fill="none" stroke-linecap="round"/><path d="M${n1(x + d * s)} ${y} Q${n1(x + d * s - 30 * s)} ${n1(y - 90 * s)} ${n1(x + d * 0.3 * s)} ${n1(y - 150 * s)}" stroke="${pal.bone}" stroke-width="${n1(10 * s)}" fill="none" stroke-linecap="round"/>`).join('');

const shellN: Painter = (x, y, s) =>
  groundShadow(x, y, 28 * s) + cel(circleS(x, y - 26 * s, 26 * s), pal.nautilus, { gloss: null }) +
  `<path d="M${x} ${n1(y - 26 * s)} m${n1(-18 * s)} 0 a${n1(18 * s)} ${n1(18 * s)} 0 1 1 ${n1(18 * s)} ${n1(18 * s)} a${n1(11 * s)} ${n1(11 * s)} 0 1 1 ${n1(-11 * s)} ${n1(-11 * s)}" stroke="#a8742a" stroke-width="5" fill="none"/>`;

function skeleton(base: number): string {
  // squelette de baleine en arche au fond
  let s = `<path d="M60 ${base} Q500 ${base - 330} 940 ${base}" stroke="${INK}" stroke-width="40" fill="none" stroke-linecap="round" opacity=".7"/><path d="M60 ${base} Q500 ${base - 330} 940 ${base}" stroke="${pal.bone}" stroke-width="28" fill="none" stroke-linecap="round" opacity=".55"/>`;
  for (let i = 1; i < 9; i++) {
    const t = i / 9, x = 60 + 880 * t, y = base - 330 * 2 * t * (1 - t) * 0.98;
    s += `<path d="M${n1(x)} ${n1(y)} Q${n1(x + (t - 0.5) * 60)} ${n1(y + 70)} ${n1(x + (t - 0.5) * 30)} ${n1(base + 10)}" stroke="${pal.bone}" stroke-width="12" fill="none" stroke-linecap="round" opacity=".4"/>`;
  }
  return s;
}

function backdrop(c: Ctx): string {
  return scene(c, { texture: 'spots', pad: '#443e6e', padMargin: 0.9, horizon: (base) => skeleton(base) + `<rect x="-10" y="${base - 10}" width="1020" height="40" fill="${pal.ground2}"/>` });
}

function anims(c: Ctx) {
  const [a, b, d, e] = spots(c);
  const bubbles = (x: number, y: number) => [[0, 20, 9], [14, 0, 6], [-8, -18, 5], [6, -32, 4]].map(([dx, dy, r]) => `<circle cx="${x + dx!}" cy="${y + dy!}" r="${r}" fill="#d8ccff" fill-opacity=".3" stroke="#e8e0ff" stroke-width="2.5"/>`).join('');
  return [
    at('Bulles', 'bob', a, 40, bubbles(a.x, a.y), { period: 2.4, amp: 10 }),
    at('Âmes-polypes', 'sway', b, 40, polyp(b.x, b.y + 34, 0.7, () => 0), { period: 2.8, amp: 6, oy: b.y + 34 }),
    at('Lumière de nautile', 'pulse', d, 30, glow(d.x, d.y, 11, pal.nautilus), { period: 2.6, amp: 0.2 }),
    at('Lumière de nautile', 'blink', e, 30, glow(e.x, e.y, 9, '#c8a6ff'), { period: 3, min: 0.3 }),
  ];
}

export const areneUrsula = defineMap({
  id: 'arene-ursula',
  name: 'Antre d\'Ursula',
  tagline: 'Dans le squelette de baleine, les âmes-polypes murmurent.',
  universe: 'boss',
  heroes: [],
  boss: 'ursula',
  shape: 'wave',
  pathMaterial: 'Sable mauve des abysses',
  pathKind: 'reef',
  frameKind: 'bone',
  palette: pal,
  backdrop,
  props: { big: [rib, seaweed], med: [shellN, polyp], small: [polyp, shellN] },
  anims,
  sound: 'abysses-orgue',
  unlock: { type: 'depart', value: 0 },
  bossFx: { description: 'Ondulation de tout l\'écran, bulles qui remontent.', effects: ['ripple', 'bubbles'], tint: '#2a1f5a', tintAlpha: 0.12 },
  mute: { sat: 0.74, lum: 0.86 },
});

export default areneUrsula;

void SW; void ellS;
