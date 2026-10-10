// La base Autobot (Ratchet, Wheeljack, Bulkhead, Jazz) : le hangar creusé dans le canyon, sur Terre.
// Parois de roche rouge, grands écrans, établis de Wheeljack, rampes et caisses de pièces.

import { type AnimSpec, type Ctx, INK, P, across, at, cel, defineMap, glow, hills, n1, rectS, scene, spots, sparkle } from './kit';
import { barrel, blastDoor, console_, emblem, energon } from './tf-kit';

const pal = {
  bg: '#3a2420',
  sky1: '#e88a4a', sky2: '#ffd8a0',
  ground: '#9a6a4a', ground2: '#906244',
  path: '#d8d2c8', pathEdge: '#8a8070', pathDeco: '#f2c33c',
  frame: '#8a90a6', frameLight: '#c8ccd8', frameShade: '#5a6080',
  cellA: '#f4efe6', cellB: '#e6dfd2',
  accent: '#f2c33c', portal: '#d8322c',
  rock: '#b8643a', rock2: '#a05430', steel: '#7a8098', red: '#d8322c', screen: '#5ad8ff',
};

function backdrop(c: Ctx): string {
  const k = c.mode === 'solo' ? 1 : 0.5;
  return scene(c, {
    texture: 'spots', pad: '#7a5a44', padMargin: 0.9,
    horizon: (base) => {
      let s = `<circle cx="780" cy="${n1(base - 200 * k)}" r="54" fill="#fff0c0" opacity=".7"/>`;
      s += hills(base - 60 * k, pal.rock2, 120 * k, 'canyon', 5) + hills(base - 10 * k, pal.rock, 80 * k, 'canyon2', 6);
      // hangar : grande porte et écrans
      s += cel(rectS(300, base - 170 * k, 400, 170 * k + 20, 14), pal.steel, { dx: 14, dy: 0 });
      s += `<rect x="330" y="${n1(base - 140 * k)}" width="150" height="${n1(80 * k)}" rx="6" fill="${pal.screen}" stroke="${INK}" stroke-width="5"/><rect x="520" y="${n1(base - 140 * k)}" width="150" height="${n1(80 * k)}" rx="6" fill="${pal.screen}" stroke="${INK}" stroke-width="5"/>`;
      s += `<path d="M350 ${n1(base - 100 * k)} l30 -20 l30 30 l40 -26" stroke="#fff" stroke-width="5" fill="none"/>`;
      s += cel(rectS(-20, base - 4, 1040, 26, 0), '#8a6a50', { dx: 0, dy: 8 });
      return s;
    },
  });
}

function anims(c: Ctx): AnimSpec[] {
  const [a, b, , d] = spots(c);
  const solo = c.mode === 'solo';
  const bird = (x: number, y: number) => `<path d="M${x - 16} ${y} q8 -8 16 0 q8 -8 16 0" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  return [
    across('Oiseaux du canyon', solo ? 190 : 56, 22, (x, y) => bird(x, y), { w: 40, h: 20 }),
    at('Gyrophare de Ratchet', 'blink', a, 24, glow(a.x, a.y, 9, pal.red), { period: 1.1, min: 0.1 }),
    at('Étincelles de l’établi', 'blink', b, 22, sparkle(b.x, b.y, 12, '#ffe27a'), { period: 0.9, min: 0 }),
    at('Gyrophare de Ratchet', 'pulse', d, 30, glow(d.x, d.y, 10, pal.screen), { period: 2.4, amp: 0.15 }),
  ];
}

export const baseAutobot = defineMap({
  id: 'base-autobot',
  name: 'Base Autobot',
  tagline: 'Le repaire des Autobots, au cœur du canyon.',
  universe: 'transformers',
  heroes: ['ratchet', 'wheeljack', 'bulkhead', 'jazz'],
  shape: 'u',
  pathMaterial: 'Sol bétonné du hangar',
  pathKind: 'slabs',
  frameKind: 'concrete',
  palette: pal,
  backdrop,
  props: {
    big: [emblem(pal.red, '#c8ccd8'), console_(pal.steel, pal.screen), P.rock(pal.rock)],
    med: [P.crate('#c8a070'), barrel('#d8322c'), console_(pal.steel, '#7dffb0')],
    small: [barrel('#f2c33c'), energon('#5ad8ff')],
  },
  gate: blastDoor(pal.steel, pal.accent),
  anims,
  sound: 'base-hangar',
  modifiers: { controlDuration: 0.1 },
  unlock: { type: 'chapitre', value: 11 },
  mute: { sat: 0.78, lum: 0.9 },
});

export default baseAutobot;
