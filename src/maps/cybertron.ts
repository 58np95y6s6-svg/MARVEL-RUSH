// Cybertron (Optimus Prime, Ultra Magnus, Elita-1, Ironhide, Prowl) : la planète de métal des Transformers.
// Tours d'acier violet-bleu, ciel d'orage cosmique, lunes, cristaux d'énergon et ponts lumineux.

import { type AnimSpec, type Ctx, INK, across, at, cel, circleS, defineMap, glow, light, n1, rectS, scene, spots, sparkle } from './kit';
import { blastDoor, console_, emblem, energon, pylon } from './tf-kit';

const pal = {
  bg: '#141a3a',
  sky1: '#2a2a6a', sky2: '#7a6ad0',
  ground: '#4a5070', ground2: '#444a68',
  path: '#c8cee0', pathEdge: '#7a80a0', pathDeco: '#5ad8ff',
  frame: '#8a90b0', frameLight: '#c0c6de', frameShade: '#5a6088',
  cellA: '#e8ecf6', cellB: '#d4dae8',
  accent: '#5ad8ff', portal: '#8a5ad0',
  steel: '#6a70a0', steel2: '#545a88', energon: '#5ad8ff', red: '#d8322c',
};

function tower(x: number, w: number, h: number, base: number, col: string): string {
  let s = cel(rectS(x, base - h, w, h + 30, 4), col, { dx: Math.min(16, w * 0.2), dy: 0 });
  s += cel(rectS(x + w * 0.25, base - h - 30, w * 0.5, 32, 4), col, { dx: 6, dy: 0 });
  for (let yy = base - h + 16; yy < base; yy += 26) s += `<rect x="${n1(x + 8)}" y="${n1(yy)}" width="${n1(w - 16)}" height="6" rx="3" fill="${pal.energon}" opacity=".45"/>`;
  return s;
}

function backdrop(c: Ctx): string {
  const k = c.mode === 'solo' ? 1 : 0.5;
  return scene(c, {
    texture: 'tiles', pad: '#5a6088', padMargin: 0.9,
    horizon: (base) => {
      let s = `<circle cx="820" cy="${n1(base - 220 * k)}" r="${n1(60 * Math.max(k, 0.6))}" fill="#c8b0ff" opacity=".55"/><circle cx="170" cy="${n1(base - 250 * k)}" r="${n1(28 * Math.max(k, 0.6))}" fill="#ffd0a0" opacity=".5"/>`;
      for (const [x, w, h, col] of [[-10, 100, 170, pal.steel2], [110, 70, 230, pal.steel], [200, 120, 140, pal.steel2], [340, 90, 260, pal.steel], [450, 130, 170, pal.steel2], [600, 80, 220, pal.steel], [700, 120, 150, pal.steel2], [840, 90, 240, pal.steel], [940, 80, 160, pal.steel2]] as const)
        s += tower(x, w, h * k, base, col);
      s += `<path d="M-20 ${n1(base - 120 * k)} Q500 ${n1(base - 200 * k)} 1020 ${n1(base - 110 * k)}" stroke="${INK}" stroke-width="14" fill="none"/><path d="M-20 ${n1(base - 120 * k)} Q500 ${n1(base - 200 * k)} 1020 ${n1(base - 110 * k)}" stroke="${pal.energon}" stroke-width="6" fill="none" opacity=".8"/>`;
      s += cel(rectS(-20, base - 4, 1040, 26, 0), light(pal.steel, 0.2), { dx: 0, dy: 8 });
      return s;
    },
  });
}

function anims(c: Ctx): AnimSpec[] {
  const [a, b, , d, e] = spots(c);
  const solo = c.mode === 'solo';
  const ship = (x: number, y: number) => cel(rectS(x - 40, y - 10, 80, 20, 10), '#c0c6de', { dx: 0, dy: 5, sw: 4 }) + `<rect x="${x - 50}" y="${y - 4}" width="12" height="8" fill="${pal.energon}"/>`;
  return [
    across('Navette dans le ciel de Cybertron', solo ? 200 : 60, 18, (x, y) => ship(x, y), { w: 120, h: 40 }),
    at('Énergon qui palpite', 'pulse', a, 34, glow(a.x, a.y, 12, pal.energon), { period: 1.8, amp: 0.18 }),
    at('Énergon qui palpite', 'pulse', b, 34, glow(b.x, b.y, 12, pal.energon), { period: 2.3, amp: 0.18, phase: 0.4 }),
    at('Signaux des tours', 'blink', d, 22, sparkle(d.x, d.y, 12, '#fff'), { period: 2.2, min: 0 }),
    at('Signaux des tours', 'blink', e, 22, sparkle(e.x, e.y, 10, '#c8b0ff'), { period: 2.8, min: 0, phase: 0.5 }),
  ];
}

export const cybertron = defineMap({
  id: 'cybertron',
  name: 'Cybertron',
  tagline: 'La planète de métal, berceau des Autobots.',
  universe: 'transformers',
  heroes: ['optimus', 'ultramagnus', 'elita', 'ironhide', 'prowl'],
  shape: 'steps',
  pathMaterial: 'Dalles de métal parcourues d’énergon',
  pathKind: 'belt',
  frameKind: 'metal',
  palette: pal,
  backdrop,
  props: {
    big: [pylon(pal.steel, pal.energon), emblem(pal.red, '#c0c6de'), pylon(pal.steel2, pal.energon)],
    med: [energon(pal.energon), console_(pal.steel, '#5ad8ff'), energon('#8a5ad0')],
    small: [energon(pal.energon), energon('#c8b0ff')],
  },
  gate: blastDoor(pal.steel, pal.energon),
  anims,
  sound: 'cybertron-metal',
  modifiers: { cooldownReduction: 0.1 },
  unlock: { type: 'chapitre', value: 10 },
  mute: { sat: 0.8, lum: 0.9 },
});

export default cybertron;
void circleS;
