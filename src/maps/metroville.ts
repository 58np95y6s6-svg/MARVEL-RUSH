// Metroville (M. Indestructible, Elastigirl, Frozone, Violette & Flèche, Joe & 22) : la ville des Indestructibles.
// Gratte-ciel rétro, ciel orangé du soir, réverbères, bouches d'incendie et la silhouette du monorail.

import { type AnimSpec, type Ctx, INK, across, at, cel, defineMap, glow, light, n1, rectS, scene, sparkle, spots } from './kit';
import { building, hydrant, streetLamp, vaultGate } from './px-kit';

const pal = {
  bg: '#2a1a3a',
  sky1: '#f08a4a', sky2: '#ffd8a0',
  ground: '#8a8aa0', ground2: '#8090a0',
  path: '#d8d4e0', pathEdge: '#6a6a80', pathDeco: '#f6a21a',
  frame: '#8a7a98', frameLight: '#c8bcd8', frameShade: '#5a4a6a',
  cellA: '#f0ecf4', cellB: '#dcd6e6',
  accent: '#f6a21a', portal: '#d8322c',
  wall: '#5a6a98', wall2: '#7a6aa8', red: '#d8322c',
};

function backdrop(c: Ctx): string {
  const k = c.mode === 'solo' ? 1 : 0.5;
  return scene(c, {
    texture: 'tiles', pad: '#6a6a88', padMargin: 0.9,
    horizon: (base) => {
      let s = `<circle cx="760" cy="${n1(base - 150 * k)}" r="${n1(70 * Math.max(k, 0.6))}" fill="#ffe0a0" opacity=".7"/>`;
      for (const [x, w, h, col] of [[-10, 90, 200, pal.wall], [90, 70, 260, pal.wall2], [170, 110, 170, pal.wall], [290, 80, 300, pal.wall2], [380, 120, 210, pal.wall], [510, 70, 250, pal.wall2], [590, 110, 180, pal.wall], [710, 90, 280, pal.wall2], [810, 100, 200, pal.wall], [920, 90, 240, pal.wall2]] as const) {
        s += cel(rectS(x, base - h * k, w, h * k + 20, 4), col, { dx: Math.min(12, w * 0.15), dy: 0 });
        for (let yy = base - h * k + 14; yy < base - 10; yy += 24) s += `<rect x="${x + 10}" y="${n1(yy)}" width="${w - 20}" height="8" rx="2" fill="#ffe9a0" opacity=".45"/>`;
      }
      // monorail
      s += `<path d="M-20 ${n1(base - 90 * k)} L1020 ${n1(base - 110 * k)}" stroke="${INK}" stroke-width="16"/><path d="M-20 ${n1(base - 90 * k)} L1020 ${n1(base - 110 * k)}" stroke="#c8c8d6" stroke-width="8"/>`;
      s += cel(rectS(-20, base - 4, 1040, 26, 0), light(pal.wall, 0.3), { dx: 0, dy: 8 });
      return s;
    },
  });
}

function anims(c: Ctx): AnimSpec[] {
  const [a, b, , d] = spots(c);
  const solo = c.mode === 'solo';
  const train = (x: number, y: number) => cel(rectS(x - 50, y - 12, 100, 24, 10), '#e8e8f0', { dx: 0, dy: 5, sw: 4 }) + [-30, -6, 18].map((dx) => `<rect x="${x + dx}" y="${y - 6}" width="14" height="8" rx="2" fill="#5ab8ff"/>`).join('');
  return [
    across('Monorail de Metroville', solo ? 170 : 50, 14, (x, y) => train(x, y), { w: 120, h: 40 }),
    at('Signal des Indestructibles', 'pulse', a, 34, glow(a.x, a.y, 12, pal.accent), { period: 1.8, amp: 0.18 }),
    at('Signal des Indestructibles', 'pulse', b, 34, glow(b.x, b.y, 12, pal.red), { period: 2.3, amp: 0.18, phase: 0.4 }),
    at('Fenêtres qui s’allument', 'blink', d, 22, sparkle(d.x, d.y, 12, '#ffe9a0'), { period: 2.4, min: 0 }),
  ];
}

export const metroville = defineMap({
  id: 'metroville',
  name: 'Metroville',
  tagline: 'La ville des Indestructibles, au coucher du soleil.',
  universe: 'pixar',
  heroes: ['mrincredible', 'elastigirl', 'frozone', 'violetflash', 'joe'],
  shape: 'zigzag',
  pathMaterial: 'Avenue goudronnée aux passages piétons',
  pathKind: 'asphalt',
  frameKind: 'concrete',
  palette: pal,
  backdrop,
  props: {
    big: [building(pal.wall), building(pal.wall2, '#ffd8a0', 3), building('#8a6aa8')],
    med: [streetLamp('#4a4a60'), hydrant(pal.red), streetLamp('#4a4a60', '#ffd8a0')],
    small: [hydrant(pal.red), hydrant('#f6a21a')],
  },
  gate: vaultGate('#7a7a98', pal.accent),
  anims,
  sound: 'ville-sirenes',
  modifiers: { dureeControles: 0.1 },
  unlock: { type: 'chapitre', value: 13 },
  mute: { sat: 0.8, lum: 0.92 },
});

export default metroville;
