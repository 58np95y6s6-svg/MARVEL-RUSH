// La Batcave (Batgirl, Cyborg, Green Arrow) : passerelles en caillebotis au-dessus de la roche,
// le Batordinateur et ses écrans, la Batmobile, la pièce géante, stalactites et chauves-souris.

import {
  type AnimSpec, type Ctx, type Painter, INK, SW, across, at, cel, circleS, defineMap, flat, gloss, groundShadow, light,
  n1, pathS, polyS, rectS, scene, spots,
} from './kit';
import { batEmblem, batShape, monitor, shardRock } from './dc-kit';

const pal = {
  bg: '#0c0f1a',
  sky1: '#141828', sky2: '#262c44',
  ground: '#2e3346', ground2: '#282c3e',
  path: '#9aa2b4', pathEdge: '#545c72', pathDeco: '#f2c33c',
  frame: '#6a7288', frameLight: '#9aa2b8', frameShade: '#454c62',
  cellA: '#eceff6', cellB: '#d8dceb',
  accent: '#f2c33c', portal: '#6fa8e8',
  rock: '#3a3f56', rock2: '#484e68', screen: '#5ab0f0', steel: '#5a627a', water: '#3a5a86', penny: '#c8844a',
};

// ---------------------------------------------------------------- accessoires

const stalagmite: Painter = (x, y, s) =>
  groundShadow(x, y, 30 * s) +
  cel(pathS(`M${n1(x - 30 * s)} ${n1(y)} Q${n1(x - 14 * s)} ${n1(y - 60 * s)} ${n1(x - 4 * s)} ${n1(y - 120 * s)} Q${n1(x + 6 * s)} ${n1(y - 70 * s)} ${n1(x + 30 * s)} ${n1(y)}Z`), pal.rock2, { dx: 8, dy: 0 }) +
  cel(pathS(`M${n1(x + 10 * s)} ${n1(y)} Q${n1(x + 22 * s)} ${n1(y - 30 * s)} ${n1(x + 28 * s)} ${n1(y - 60 * s)} Q${n1(x + 34 * s)} ${n1(y - 30 * s)} ${n1(x + 46 * s)} ${n1(y)}Z`), pal.rock, { dx: 5, dy: 0 });

/** La pièce géante (souvenir). */
const giantPenny: Painter = (x, y, s) =>
  groundShadow(x, y, 50 * s) +
  cel(rectS(x - 40 * s, y - 16 * s, 80 * s, 16 * s, 3), pal.steel, { dx: 0, dy: 5 }) +
  cel(ellS2(x, y - 86 * s, 56 * s, 70 * s), pal.penny, { dx: 12, dy: 0 }) +
  `<ellipse cx="${n1(x)}" cy="${n1(y - 86 * s)}" rx="${n1(40 * s)}" ry="${n1(52 * s)}" fill="none" stroke="${INK}" stroke-width="${n1(3 * s)}" opacity=".45"/>` +
  `<path d="M${n1(x - 10 * s)} ${n1(y - 110 * s)} q${n1(16 * s)} ${n1(-6 * s)} ${n1(18 * s)} ${n1(14 * s)} q${n1(-2 * s)} ${n1(20 * s)} ${n1(-14 * s)} ${n1(30 * s)} l${n1(-4 * s)} ${n1(16 * s)}" stroke="${INK}" stroke-width="${n1(4 * s)}" fill="none" opacity=".45" stroke-linecap="round"/>` +
  gloss(x - 24 * s, y - 110 * s, 6 * s, 16 * s, 10, 0.45);

function ellS2(cx: number, cy: number, rx: number, ry: number) {
  return (a: string) => `<ellipse cx="${n1(cx)}" cy="${n1(cy)}" rx="${n1(rx)}" ry="${n1(ry)}" ${a}/>`;
}

/** Vitrine de costume. */
const suitCase: Painter = (x, y, s) =>
  groundShadow(x, y, 34 * s) +
  cel(rectS(x - 32 * s, y - 130 * s, 64 * s, 130 * s, 8 * s), pal.steel, { dx: 8, dy: 0 }) +
  `<rect x="${n1(x - 24 * s)}" y="${n1(y - 122 * s)}" width="${n1(48 * s)}" height="${n1(110 * s)}" rx="${n1(5 * s)}" fill="#7ab0d8" opacity=".35" stroke="${INK}" stroke-width="${n1(3 * s)}"/>` +
  cel(pathS(`M${n1(x - 14 * s)} ${n1(y - 20 * s)} L${n1(x - 16 * s)} ${n1(y - 80 * s)} Q${n1(x)} ${n1(y - 88 * s)} ${n1(x + 16 * s)} ${n1(y - 80 * s)} L${n1(x + 14 * s)} ${n1(y - 20 * s)}Z`), '#3a3a52', { dx: 4, dy: 0, sw: SW * 0.7 }) +
  cel(circleS(x, y - 96 * s, 11 * s), '#3a3a52', { dx: 2, dy: 2, sw: SW * 0.7 }) +
  batEmblem(x, y - 62 * s, 0.24 * s, pal.pathDeco) +
  gloss(x - 14 * s, y - 100 * s, 3 * s, 16 * s, 0, 0.4);

const toolbox: Painter = (x, y, s) =>
  groundShadow(x, y, 30 * s) + cel(rectS(x - 28 * s, y - 40 * s, 56 * s, 40 * s, 6 * s), '#a8443e', { dx: 8, dy: 0 }) +
  [-14, -26].map((d) => `<line x1="${n1(x - 28 * s)}" y1="${n1(y + d * s)}" x2="${n1(x + 28 * s)}" y2="${n1(y + d * s)}" stroke="${INK}" stroke-width="${n1(3 * s)}" opacity=".45"/>`).join('');

/** Batmobile garée. */
const batmobile: Painter = (x, y, s) =>
  groundShadow(x, y, 80 * s, 14 * s) +
  cel(pathS(`M${n1(x - 84 * s)} ${n1(y - 14 * s)} L${n1(x - 70 * s)} ${n1(y - 34 * s)} L${n1(x - 20 * s)} ${n1(y - 40 * s)} Q${n1(x)} ${n1(y - 62 * s)} ${n1(x + 26 * s)} ${n1(y - 42 * s)} L${n1(x + 76 * s)} ${n1(y - 30 * s)} L${n1(x + 86 * s)} ${n1(y - 10 * s)} L${n1(x + 80 * s)} ${n1(y)} L${n1(x - 80 * s)} ${n1(y)}Z`), '#2e3248', { dx: 0, dy: 8 }) +
  `<path d="M${n1(x - 8 * s)} ${n1(y - 42 * s)} Q${n1(x + 4 * s)} ${n1(y - 56 * s)} ${n1(x + 20 * s)} ${n1(y - 42 * s)}Z" fill="#7ab0d8" stroke="${INK}" stroke-width="${n1(3 * s)}"/>` +
  cel(polyS([{ x: x - 84 * s, y: y - 14 * s }, { x: x - 92 * s, y: y - 50 * s }, { x: x - 66 * s, y: y - 30 * s }]), '#2e3248', { dx: 3, dy: 0, sw: SW * 0.7 }) +
  flat(circleS(x - 50 * s, y, 15 * s), '#14141e', SW * 0.8) + flat(circleS(x + 50 * s, y, 15 * s), '#14141e', SW * 0.8) +
  `<circle cx="${n1(x + 82 * s)}" cy="${n1(y - 16 * s)}" r="${n1(4 * s)}" fill="${pal.pathDeco}"/>` +
  `<path d="M${n1(x - 96 * s)} ${n1(y - 16 * s)} l${n1(-14 * s)} ${n1(-3 * s)} l0 ${n1(8 * s)}z" fill="#5ab0f0"/>`;

/** Sortie : sas blindé. */
const bunkerDoor: Painter = (x, y, s) =>
  groundShadow(x, y, 66 * s) +
  cel(rectS(x - 62 * s, y - 116 * s, 124 * s, 116 * s, 12 * s), pal.steel, { dx: 12, dy: 0 }) +
  flat(rectS(x - 40 * s, y - 92 * s, 80 * s, 92 * s, 6 * s), '#2a2e40') +
  `<path d="M${n1(x - 40 * s)} ${n1(y - 92 * s)} L${n1(x + 40 * s)} ${n1(y)} M${n1(x + 40 * s)} ${n1(y - 92 * s)} L${n1(x - 40 * s)} ${n1(y)}" stroke="${pal.pathDeco}" stroke-width="${n1(5 * s)}" opacity=".5"/>` +
  batEmblem(x, y - 104 * s, 0.32 * s, pal.pathDeco);

// ---------------------------------------------------------------- fond

/** Plafond de roche, stalactites, Batordinateur et cascade. */
function cave(c: Ctx, base: number, k: number): string {
  let s = '';
  // parois au fond, de plus en plus sombres
  s += `<path d="M-20 ${base + 30} L-20 ${n1(base - 200 * k)} Q160 ${n1(base - 120 * k)} 260 ${n1(base - 170 * k)} Q420 ${n1(base - 240 * k)} 560 ${n1(base - 180 * k)} Q760 ${n1(base - 120 * k)} 1020 ${n1(base - 210 * k)} L1020 ${base + 30}Z" fill="#1e2236"/>`;
  // cascade à gauche
  s += `<rect x="40" y="${n1(base - 250 * k)}" width="70" height="${n1(250 * k + 10)}" fill="${pal.water}" stroke="${INK}" stroke-width="5"/>`;
  for (let i = 0; i < 4; i++) s += `<line x1="${54 + i * 14}" y1="${n1(base - 240 * k)}" x2="${54 + i * 14}" y2="${base}" stroke="#a8c8ee" stroke-width="3" opacity=".5"/>`;
  s += `<ellipse cx="75" cy="${base}" rx="70" ry="14" fill="#a8c8ee" opacity=".5"/>`;
  // Batordinateur : grand écran central et deux écrans latéraux sur une estrade
  const cx = 560, sw = 300 * Math.max(k, 0.55), sh = 150 * k, top = base - 40 * k - sh;
  s += cel(rectS(cx - sw / 2 - 16, top - 12, sw + 32, sh + 24, 10), pal.steel, { dx: 12, dy: 0, sw: SW * 0.8 });
  s += `<rect x="${n1(cx - sw / 2)}" y="${n1(top)}" width="${n1(sw)}" height="${n1(sh)}" rx="6" fill="#18304e" stroke="${INK}" stroke-width="4"/>`;
  s += `<rect x="${n1(cx - sw / 2 + 12)}" y="${n1(top + 12)}" width="${n1(sw * 0.45)}" height="${n1(sh - 24)}" rx="4" fill="${pal.screen}" opacity=".55"/>`;
  s += batEmblem(cx + sw * 0.22, top + sh / 2, 0.9 * k + 0.2, pal.screen);
  for (const side of [-1, 1]) {
    const x = cx + side * (sw / 2 + 80), w = 110 * Math.max(k, 0.6), h = 80 * k;
    s += cel(rectS(x - w / 2 - 8, top + 20 * k - 8, w + 16, h + 16, 8), pal.steel, { dx: 8, dy: 0, sw: SW * 0.7 });
    s += `<rect x="${n1(x - w / 2)}" y="${n1(top + 20 * k)}" width="${n1(w)}" height="${n1(h)}" rx="4" fill="${pal.screen}" opacity=".5" stroke="${INK}" stroke-width="3"/>`;
  }
  s += cel(rectS(cx - sw / 2 - 40, base - 40 * k, sw + 80, 40 * k + 10, 8), pal.steel, { dx: 0, dy: 8, sw: SW * 0.8 });
  // stalactites au plafond (bord haut)
  for (let i = 0; i < 12; i++) {
    const x = -10 + i * 92 + (i % 3) * 14, h = (40 + ((i * 37) % 60)) * k + 20;
    s += cel(polyS([{ x: x - 22, y: -10 }, { x: x + 4, y: h }, { x: x + 24, y: -10 }]), pal.rock2, { dx: 8, dy: 0, sw: SW * 0.7 });
  }
  void c;
  return s;
}

function backdrop(c: Ctx): string {
  const k = c.mode === 'solo' ? 1 : 0.5;
  return scene(c, {
    texture: 'spots', pad: '#3e4458', padMargin: 0.9,
    horizon: (base) => cave(c, base, k) + cel(rectS(-20, base - 4, 1040, 26, 0), pal.steel, { dx: 0, dy: 8 }),
    after: c.mode === 'solo' ? chasm(c.z.strip.y) : '',
  });
}

/** En Solo : gouffre et rivière souterraine sous la passerelle. */
function chasm(y: number): string {
  return `<path d="M-20 ${y - 40} Q260 ${y - 56} 500 ${y - 36} Q760 ${y - 20} 1020 ${y - 44} L1020 ${y + 46} Q760 ${y + 60} 500 ${y + 40} Q260 ${y + 24} -20 ${y + 50}Z" fill="#141828" stroke="${INK}" stroke-width="5"/>` +
    `<path d="M-20 ${y + 8} Q260 ${y - 6} 500 ${y + 10} Q760 ${y + 24} 1020 ${y + 4}" stroke="${pal.water}" stroke-width="18" fill="none" opacity=".8"/>`;
}

// ---------------------------------------------------------------- animations

function anims(c: Ctx): AnimSpec[] {
  const [a, b, , d, e] = spots(c);
  const solo = c.mode === 'solo';
  const colony = (x: number, y: number) => batShape(x, y, 1) + batShape(x + 36, y + 14, 0.8) + batShape(x + 14, y - 16, 0.7) + batShape(x - 26, y + 10, 0.6);
  const k = solo ? 1 : 0.5, base = solo ? 270 : 118, cx = 560, top = base - 40 * k - 150 * k;
  const screenBlink = (x: number, y: number, w: number, h: number) => `<rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" rx="3" fill="${light(pal.screen, 0.4)}" opacity=".7"/>`;
  const list: AnimSpec[] = [
    across('Chauves-souris', solo ? 240 : 66, 7, (x, y) => colony(x, y), { w: 110, h: 50 }),
    across('Chauves-souris', solo ? 1100 : 1330, 10, (x, y) => colony(x, y), { w: 110, h: 50 }, { reverse: true, phase: 0.3 }),
    at('Écrans du Batordinateur', 'blink', { x: cx - 60, y: top + 40 }, 30, screenBlink(cx - 130, top + 24, 100, 12) + screenBlink(cx - 130, top + 46, 70, 12), { period: 1.3, min: 0.2 }),
    at('Écrans du Batordinateur', 'blink', d, 20, screenBlink(d.x - 18, d.y - 8, 36, 16), { period: 1.7, min: 0.2, phase: 0.5 }),
    at('Écrans du Batordinateur', 'blink', e, 20, screenBlink(e.x - 18, e.y - 8, 36, 16), { period: 2.1, min: 0.2, phase: 0.2 }),
  ];
  if (!solo) {
    list.push(at('Chauves-souris', 'bob', a, 30, batShape(a.x, a.y, 1.1), { period: 2, amp: 8 }));
    list.push(at('Chauves-souris', 'bob', b, 30, batShape(b.x, b.y, 1), { period: 2.4, amp: 8, phase: 0.5 }));
  }
  return list;
}

export const batcave = defineMap({
  id: 'batcave',
  name: 'La Batcave',
  tagline: 'Sous le manoir, le repaire secret de la Bat-famille.',
  universe: 'dc',
  heroes: ['batgirl', 'cyborg', 'greenarrow'],
  shape: 'u',
  pathMaterial: 'Passerelles en caillebotis au-dessus du gouffre',
  pathKind: 'grating',
  frameKind: 'metal',
  palette: pal,
  backdrop,
  props: {
    big: [batmobile, stalagmite, suitCase],
    med: [giantPenny, monitor(pal.steel, pal.screen), stalagmite],
    small: [shardRock(pal.rock2), toolbox, shardRock(pal.rock)],
  },
  gate: bunkerDoor,
  anims,
  sound: 'batcave-echo',
  modifiers: { rechargesCompetences: -0.1 },
  unlock: { type: 'chapitre', value: 7 },
  mute: { sat: 0.8, lum: 0.9 },
});

export default batcave;
