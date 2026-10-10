// Paradise Falls (Carl & Russell, WALL-E & EVE, Flash McQueen & Martin, Luca & Alberto, Jessie & Pile-Poil) :
// les chutes du Paradis, des tepuys dans la brume, la maison aux ballons posée au bord de la falaise.

import { type AnimSpec, type Ctx, INK, P, across, at, cel, cloud, defineMap, glow, hills, light, n1, rectS, scene, sparkle, spots } from './kit';
import { balloonHouse, tepui } from './px-kit';

const pal = {
  bg: '#1a2a2a',
  sky1: '#7ac8e8', sky2: '#e0f4ff',
  ground: '#7ab85a', ground2: '#6aa84a',
  path: '#e8d8b0', pathEdge: '#a8885a', pathDeco: '#ff5a6a',
  frame: '#a8885a', frameLight: '#d8c098', frameShade: '#7a5a3a',
  cellA: '#f4f0e0', cellB: '#e4dcc4',
  accent: '#ff5a6a', portal: '#7a5aa8',
  rock: '#a87a5a', rock2: '#8a6a4a', water: '#8ad8ff',
};

function backdrop(c: Ctx): string {
  const k = c.mode === 'solo' ? 1 : 0.5;
  return scene(c, {
    texture: 'grass', pad: '#6a9a4a', padMargin: 0.9,
    horizon: (base) => {
      let s = [120, 460, 820].map((x, i) => cloud(x, base - (190 + (i % 2) * 40) * k, 1.2)).join('');
      for (const [x, w, h] of [[40, 180, 180], [300, 220, 240], [640, 200, 200], [880, 160, 160]] as const) {
        s += cel(rectS(x - w / 2, base - h * k, w, h * k + 20, 10), pal.rock2, { dx: 14, dy: 0 });
        s += `<path d="M${x - w / 2} ${n1(base - h * k)} H${x + w / 2}" stroke="#5aa83a" stroke-width="12" stroke-linecap="round"/>`;
      }
      s += `<rect x="290" y="${n1(base - 240 * k)}" width="22" height="${n1(240 * k)}" fill="${pal.water}" opacity=".85" stroke="${INK}" stroke-width="3"/>`;
      s += hills(base - 6, '#5a9a4a', 40, 'paradise', 6);
      s += cel(rectS(-20, base - 4, 1040, 26, 0), light(pal.ground, 0.1), { dx: 0, dy: 8 });
      return s;
    },
  });
}

function anims(c: Ctx): AnimSpec[] {
  const [a, , cc, d] = spots(c);
  const solo = c.mode === 'solo';
  const kevin = (x: number, y: number) => `<ellipse cx="${x}" cy="${y}" rx="22" ry="12" fill="#5a6ad8" stroke="${INK}" stroke-width="3.5"/><path d="M${x + 18} ${y - 6} q12 -18 16 -4" stroke="${INK}" stroke-width="6" fill="none"/><path d="M${x + 18} ${y - 6} q12 -18 16 -4" stroke="#ff8a3a" stroke-width="3" fill="none"/><path d="M${x - 20} ${y - 4} l-14 -10 M${x - 20} ${y} l-16 0" stroke="#ffd23f" stroke-width="4" stroke-linecap="round"/>`;
  return [
    across('Kevin traverse le ciel', solo ? 210 : 60, 16, (x, y) => kevin(x, y), { w: 90, h: 50 }),
    at('Ballons qui dansent', 'bob', a, 30, glow(a.x, a.y, 12, pal.accent), { period: 2.2, amp: 6 }),
    at('Ballons qui dansent', 'bob', cc, 30, glow(cc.x, cc.y, 10, '#ffd23f'), { period: 2.7, amp: 6, phase: 0.5 }),
    at('Embruns des chutes', 'blink', d, 22, sparkle(d.x, d.y, 12, '#fff'), { period: 2.0, min: 0 }),
  ];
}

export const paradiseFalls = defineMap({
  id: 'paradise-falls',
  name: 'Paradise Falls',
  tagline: 'Les chutes du Paradis, au bout d’un voyage en ballons.',
  universe: 'pixar',
  heroes: ['carlrussell', 'walleeve', 'mcqueen', 'lucaalberto', 'jessie'],
  shape: 'wave',
  pathMaterial: 'Sentier de terre battue entre les rochers',
  pathKind: 'dirt',
  frameKind: 'wood',
  palette: pal,
  backdrop,
  props: {
    big: [tepui(pal.rock), balloonHouse(), tepui(pal.rock2)],
    med: [P.rock(pal.rock), P.bush('#5aa83a'), P.tree('#6ab84a')],
    small: [P.tuft('#5aa83a'), P.rock('#c89a7a')],
  },
  gate: tepui(pal.rock2, pal.water),
  anims,
  sound: 'chutes-oiseaux',
  modifiers: { degatsRayons: 0.1 },
  unlock: { type: 'chapitre', value: 14 },
  mute: { sat: 0.8, lum: 0.92 },
});

export default paradiseFalls;
