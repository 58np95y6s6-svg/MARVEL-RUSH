// Monstropolis (Sulli & Bob, Joie & Tristesse, Rémy & Linguini, Mei, Ian & Barley) : l'usine à cris de
// Monstres & Cie. Portes de placard sur rails, bonbonnes de cris, néons, et le grand logo à l'œil vert.

import { type AnimSpec, type Ctx, INK, across, at, cel, circleS, defineMap, glow, light, n1, rectS, scene, sparkle, spots } from './kit';
import { closetDoor, screamCan, vaultGate } from './px-kit';

const pal = {
  bg: '#1a1a30',
  sky1: '#3a4a8a', sky2: '#8a9ad8',
  ground: '#6a7aa0', ground2: '#6070a0',
  path: '#d0d8ec', pathEdge: '#6a7090', pathDeco: '#8ae04a',
  frame: '#7a8098', frameLight: '#b8c0d8', frameShade: '#4a5068',
  cellA: '#eef0f8', cellB: '#d8dcec',
  accent: '#8ae04a', portal: '#4ab8e8',
  wall: '#4a5a8a', door1: '#e85a8a', door2: '#4ab8e8', door3: '#f6c83a',
};

function backdrop(c: Ctx): string {
  const k = c.mode === 'solo' ? 1 : 0.5;
  return scene(c, {
    texture: 'tiles', pad: '#5a6a90', padMargin: 0.9,
    horizon: (base) => {
      let s = cel(rectS(-20, base - 280 * k, 1040, 280 * k, 0), pal.wall, { dx: 0, dy: 0 });
      s += `<path d="M-20 ${n1(base - 230 * k)} H1020" stroke="${INK}" stroke-width="10"/><path d="M-20 ${n1(base - 230 * k)} H1020" stroke="#9aa0b8" stroke-width="5"/>`;
      // logo de l'usine : l'œil de Bob
      s += cel(circleS(500, base - 150 * k, 70 * k), '#8ae04a', { dx: 6, dy: 6 }) + `<circle cx="500" cy="${n1(base - 150 * k)}" r="${n1(40 * k)}" fill="#fff" stroke="${INK}" stroke-width="5"/><circle cx="500" cy="${n1(base - 150 * k)}" r="${n1(18 * k)}" fill="#4ab84a" stroke="${INK}" stroke-width="4"/>`;
      for (const [x, col] of [[90, pal.door1], [210, pal.door2], [330, pal.door3], [670, pal.door2], [790, pal.door1], [910, pal.door3]] as const)
        s += cel(rectS(x - 30, base - 200 * k, 60, 200 * k, 4), col, { dx: 8, dy: 0 });
      s += cel(rectS(-20, base - 4, 1040, 26, 0), light(pal.wall, 0.3), { dx: 0, dy: 8 });
      return s;
    },
  });
}

function anims(c: Ctx): AnimSpec[] {
  const [a, b, , d] = spots(c);
  const solo = c.mode === 'solo';
  const door = (x: number, y: number) => cel(rectS(x - 16, y - 30, 32, 60, 3), '#c88aff', { dx: 4, dy: 0, sw: 4 }) + `<path d="M${x - 24} ${y - 34} H${x + 24}" stroke="${INK}" stroke-width="5"/>`;
  return [
    across('Portes sur les rails', solo ? 180 : 54, 12, (x, y) => door(x, y), { w: 60, h: 80 }),
    at('Bonbonnes de cris', 'pulse', a, 34, glow(a.x, a.y, 12, '#f6c83a'), { period: 1.7, amp: 0.2 }),
    at('Bonbonnes de cris', 'pulse', b, 34, glow(b.x, b.y, 12, '#f6c83a'), { period: 2.1, amp: 0.2, phase: 0.4 }),
    at('Voyants des portes', 'blink', d, 22, sparkle(d.x, d.y, 12, '#ff3b3b'), { period: 1.5, min: 0 }),
  ];
}

export const monstropolis = defineMap({
  id: 'monstropolis',
  name: 'Monstropolis',
  tagline: 'L’usine à cris de Monstres & Cie… et à rires.',
  universe: 'pixar',
  heroes: ['sullimike', 'joysadness', 'remy', 'mei', 'ianbarley'],
  shape: 'steps',
  pathMaterial: 'Carrelage de l’étage des cris',
  pathKind: 'checker',
  frameKind: 'metal',
  palette: pal,
  backdrop,
  props: {
    big: [closetDoor(pal.door1), closetDoor(pal.door2, '#8ae04a'), closetDoor(pal.door3)],
    med: [screamCan(), screamCan('#e8d84a'), closetDoor('#c88aff')],
    small: [screamCan(), screamCan('#f0a03a')],
  },
  gate: vaultGate('#7a8098', '#8ae04a'),
  anims,
  sound: 'usine-cris',
  modifiers: { combos: 0.1 },
  unlock: { type: 'chapitre', value: 13 },
  mute: { sat: 0.8, lum: 0.92 },
});

export default monstropolis;
