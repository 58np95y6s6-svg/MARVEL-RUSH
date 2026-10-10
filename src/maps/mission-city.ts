// Mission City (Bumblebee, Arcee, Hot Rod, Sideswipe, Mirage, Grimlock) : la ville prise dans la bataille
// des Autobots contre les Decepticons. Immeubles, fumée, épaves de voitures et rubalise.

import { type AnimSpec, type Ctx, INK, across, at, cel, defineMap, glow, light, n1, rectS, scene, spots, sparkle } from './kit';
import { barrel, emblem, wreck } from './tf-kit';

const pal = {
  bg: '#2a2a3a',
  sky1: '#e8a06a', sky2: '#ffe0b0',
  ground: '#7a7a88', ground2: '#727280',
  path: '#5a5a68', pathEdge: '#3a3a48', pathDeco: '#f2c33c',
  frame: '#9a9aaa', frameLight: '#c8c8d6', frameShade: '#6a6a7a',
  cellA: '#eceaf0', cellB: '#dcd8e2',
  accent: '#f2c33c', portal: '#8a3fd0',
  glass: '#8aa8c8', brick: '#a8644a', smoke: '#6a6a7a', red: '#d8322c', yellow: '#f6c83a',
};

function building(x: number, w: number, h: number, base: number, col: string): string {
  let s = cel(rectS(x, base - h, w, h + 30, 4), col, { dx: Math.min(14, w * 0.2), dy: 0 });
  for (let yy = base - h + 14; yy < base - 10; yy += 24)
    for (let xx = x + 10; xx < x + w - 16; xx += 22) s += `<rect x="${n1(xx)}" y="${n1(yy)}" width="12" height="14" rx="2" fill="${light(col, 0.4)}" opacity=".7"/>`;
  return s;
}

function backdrop(c: Ctx): string {
  const k = c.mode === 'solo' ? 1 : 0.5;
  return scene(c, {
    texture: 'tiles', pad: '#6a6a78', padMargin: 0.9,
    horizon: (base) => {
      let s = '';
      for (const [x, w, h, col] of [[-10, 120, 200, pal.glass], [120, 90, 150, pal.brick], [220, 110, 240, pal.glass], [340, 80, 130, pal.brick], [430, 140, 210, pal.glass], [580, 100, 160, pal.brick], [690, 120, 230, pal.glass], [820, 90, 140, pal.brick], [920, 100, 190, pal.glass]] as const)
        s += building(x, w, h * k, base, col);
      for (const [x, y, r] of [[260, 160, 40], [300, 130, 30], [700, 170, 46], [740, 140, 32]] as const)
        s += `<circle cx="${x}" cy="${n1(base - y * k)}" r="${n1(r * Math.max(k, 0.6))}" fill="${pal.smoke}" opacity=".55"/>`;
      s += cel(rectS(-20, base - 4, 1040, 26, 0), '#8a8a96', { dx: 0, dy: 8 });
      s += `<path d="M-20 ${base + 10} H1020" stroke="${pal.yellow}" stroke-width="6" stroke-dasharray="26 18"/>`;
      return s;
    },
  });
}

function anims(c: Ctx): AnimSpec[] {
  const [a, b, , d, e] = spots(c);
  const solo = c.mode === 'solo';
  const heli = (x: number, y: number) => cel(rectS(x - 30, y - 10, 60, 22, 10), '#5a6a4a', { dx: 0, dy: 4, sw: 4 }) + `<path d="M${x - 44} ${y - 16} H${x + 44}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M${x + 30} ${y} H${x + 54}" stroke="${INK}" stroke-width="5"/>`;
  return [
    across('Hélicoptère au-dessus de la ville', solo ? 210 : 60, 16, (x, y) => heli(x, y), { w: 110, h: 44 }, { reverse: true }),
    at('Incendie', 'pulse', a, 30, glow(a.x, a.y, 11, '#ff8a2a'), { period: 0.9, amp: 0.2 }),
    at('Incendie', 'pulse', b, 30, glow(b.x, b.y, 11, '#ff8a2a'), { period: 1.2, amp: 0.2, phase: 0.3 }),
    at('Étincelles', 'blink', d, 22, sparkle(d.x, d.y, 12, '#ffe27a'), { period: 1.4, min: 0 }),
    at('Étincelles', 'blink', e, 22, sparkle(e.x, e.y, 10, '#fff'), { period: 1.9, min: 0, phase: 0.5 }),
  ];
}

export const missionCity = defineMap({
  id: 'mission-city',
  name: 'Mission City',
  tagline: 'La grande bataille dans les rues de la ville.',
  universe: 'transformers',
  heroes: ['bumblebee', 'arcee', 'hotrod', 'sideswipe', 'mirage', 'grimlock'],
  shape: 'zigzag',
  pathMaterial: 'Asphalte de l’avenue',
  pathKind: 'asphalt',
  frameKind: 'concrete',
  palette: pal,
  backdrop,
  props: {
    big: [wreck(pal.red), emblem(pal.red, '#c8c8d6'), wreck('#3a6ad0')],
    med: [wreck(pal.yellow), barrel('#f2c33c'), barrel('#d8322c')],
    small: [barrel('#8a8a96'), barrel('#f2c33c')],
  },
  anims,
  sound: 'mission-city-bataille',
  modifiers: { burnDamage: 0.15 },
  unlock: { type: 'chapitre', value: 12 },
  mute: { sat: 0.8, lum: 0.9 },
});

export default missionCity;
