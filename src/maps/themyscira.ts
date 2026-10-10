// Themyscira (Wonder Woman) : chemin de marbre sur les falaises, temples grecs à colonnes, mer
// turquoise en contrebas, oliviers et braseros. Vagues, mouettes et flammes des braseros.

import {
  type AnimSpec, type Ctx, type Painter, INK, P, SW, across, at, cel, defineMap, flat, gloss, groundShadow, light,
  n1, pathS, polyS, rectS, scene, spots,
} from './kit';
import { brazier, flame, greekColumn } from './dc-kit';

const pal = {
  bg: '#1e3a5a',
  sky1: '#f2b48a', sky2: '#ffe2b8',
  ground: '#9aa874', ground2: '#8a9a68',
  path: '#efe8dc', pathEdge: '#a89c8a', pathDeco: '#d8b25a',
  frame: '#d8d0c2', frameLight: '#f4eee4', frameShade: '#a49a8a',
  cellA: '#f8f5ee', cellB: '#ebe5d8',
  accent: '#d8b25a', portal: '#5ac8d8',
  marble: '#e2dace', sea: '#3aa0c0', sea2: '#2a80a8', cliff: '#c8a882', olive: '#7a9a5a', bronze: '#c08a4a',
};

// ---------------------------------------------------------------- accessoires

const amphora: Painter = (x, y, s) =>
  groundShadow(x, y, 18 * s) +
  cel(pathS(`M${n1(x - 8 * s)} ${n1(y - 50 * s)} L${n1(x - 8 * s)} ${n1(y - 44 * s)} Q${n1(x - 24 * s)} ${n1(y - 36 * s)} ${n1(x - 18 * s)} ${n1(y - 16 * s)} Q${n1(x - 12 * s)} ${n1(y)} ${n1(x)} ${n1(y)} Q${n1(x + 12 * s)} ${n1(y)} ${n1(x + 18 * s)} ${n1(y - 16 * s)} Q${n1(x + 24 * s)} ${n1(y - 36 * s)} ${n1(x + 8 * s)} ${n1(y - 44 * s)} L${n1(x + 8 * s)} ${n1(y - 50 * s)}Z`), '#c8744a', { dx: 6, dy: 0, sw: SW * 0.7 }) +
  `<path d="M${n1(x - 16 * s)} ${n1(y - 26 * s)} h${n1(32 * s)}" stroke="${INK}" stroke-width="${n1(5 * s)}" opacity=".6"/>`;

const oliveTree = P.tree(pal.olive, '#8a6a4a');

/** Statue d'amazone (bouclier rond et lance). */
const amazonStatue: Painter = (x, y, s) =>
  groundShadow(x, y, 36 * s) +
  cel(rectS(x - 30 * s, y - 30 * s, 60 * s, 30 * s, 4), pal.marble, { dx: 0, dy: 8 }) +
  flat(rectS(x + 22 * s, y - 170 * s, 6 * s, 140 * s, 2), pal.bronze, SW * 0.6) +
  cel(pathS(`M${n1(x - 16 * s)} ${n1(y - 30 * s)} L${n1(x - 12 * s)} ${n1(y - 110 * s)} Q${n1(x)} ${n1(y - 120 * s)} ${n1(x + 12 * s)} ${n1(y - 110 * s)} L${n1(x + 16 * s)} ${n1(y - 30 * s)}Z`), pal.marble, { dx: 6, dy: 0 }) +
  cel((a: string) => `<circle cx="${n1(x)}" cy="${n1(y - 128 * s)}" r="${n1(13 * s)}" ${a}/>`, pal.marble, { dx: 3, dy: 3 }) +
  cel((a: string) => `<circle cx="${n1(x - 18 * s)}" cy="${n1(y - 76 * s)}" r="${n1(24 * s)}" ${a}/>`, pal.bronze, { dx: 6, dy: 6 }) +
  `<circle cx="${n1(x - 18 * s)}" cy="${n1(y - 76 * s)}" r="${n1(8 * s)}" fill="${light(pal.bronze, 0.4)}" stroke="${INK}" stroke-width="${n1(3 * s)}"/>`;

/** Sortie : petit temple à fronton. */
const templeGate: Painter = (x, y, s) => {
  const col = (dx: number) => cel(rectS(x + dx * s - 9 * s, y - 96 * s, 18 * s, 84 * s, 3), pal.marble, { dx: 5, dy: 0, sw: SW * 0.8 });
  return groundShadow(x, y, 70 * s) +
    cel(rectS(x - 70 * s, y - 14 * s, 140 * s, 14 * s, 3), pal.marble, { dx: 0, dy: 5 }) +
    flat(rectS(x - 34 * s, y - 96 * s, 68 * s, 84 * s, 2), '#3a3248') +
    col(-56) + col(-30) + col(30) + col(56) +
    cel(rectS(x - 72 * s, y - 112 * s, 144 * s, 18 * s, 3), pal.marble, { dx: 0, dy: 6 }) +
    cel(polyS([{ x: x - 76 * s, y: y - 112 * s }, { x, y: y - 150 * s }, { x: x + 76 * s, y: y - 112 * s }]), pal.marble, { dx: 0, dy: 8 }) +
    `<circle cx="${n1(x)}" cy="${n1(y - 126 * s)}" r="${n1(7 * s)}" fill="${pal.pathDeco}" stroke="${INK}" stroke-width="${n1(3 * s)}"/>` +
    gloss(x - 50 * s, y - 70 * s, 3 * s, 16 * s, 0, 0.4);
};

// ---------------------------------------------------------------- fond

function temple(x: number, base: number, w: number, k: number): string {
  const h = 70 * k, n = 5;
  let s = cel(rectS(x - w / 2, base - 10, w, 14, 3), pal.marble, { dx: 0, dy: 4, sw: SW * 0.7 });
  for (let i = 0; i < n; i++) {
    const cx = x - w / 2 + 14 + (i * (w - 28)) / (n - 1);
    s += cel(rectS(cx - 6, base - 10 - h, 12, h, 2), pal.marble, { dx: 4, dy: 0, sw: SW * 0.6 });
  }
  s += cel(rectS(x - w / 2 - 4, base - 22 - h, w + 8, 14, 3), pal.marble, { dx: 0, dy: 4, sw: SW * 0.7 });
  s += cel(polyS([{ x: x - w / 2 - 8, y: base - 22 - h }, { x, y: base - 22 - h - 34 * k }, { x: x + w / 2 + 8, y: base - 22 - h }]), pal.marble, { dx: 0, dy: 6, sw: SW * 0.7 });
  return s;
}

function backdrop(c: Ctx): string {
  const k = c.mode === 'solo' ? 1 : 0.5;
  return scene(c, {
    texture: 'grass', pad: '#b2bc90', padMargin: 0.9,
    horizon: (base) => {
      const sea = base - 120 * k;
      let s = `<circle cx="760" cy="${n1(sea - 30 * k)}" r="${n1(60 * Math.max(k, 0.6))}" fill="#fff2c8" opacity=".9"/>`;
      s += `<rect x="-20" y="${n1(sea)}" width="1040" height="${n1(base - sea + 30)}" fill="${pal.sea}"/>`;
      for (let i = 0; i < 6; i++) s += `<path d="M${-20 + i * 180} ${n1(sea + 20 * k + (i % 2) * 18 * k)} q30 -10 60 0 t60 0" stroke="#bfeaf2" stroke-width="5" fill="none" opacity=".7" stroke-linecap="round"/>`;
      // îlots et falaises lointaines
      s += cel(pathS(`M-20 ${n1(sea + 6)} L-20 ${n1(sea - 70 * k)} Q60 ${n1(sea - 110 * k)} 140 ${n1(sea - 80 * k)} L220 ${n1(sea + 6)}Z`), pal.cliff, { dx: 20, dy: 0, sw: SW * 0.8 });
      s += temple(70, sea - 80 * k, 120, k);
      // falaise principale au premier plan
      s += cel(pathS(`M-20 ${base + 30} L-20 ${n1(base - 50 * k)} Q200 ${n1(base - 70 * k)} 380 ${n1(base - 40 * k)} Q560 ${n1(base - 20 * k)} 700 ${n1(base - 60 * k)} Q860 ${n1(base - 90 * k)} 1020 ${n1(base - 60 * k)} L1020 ${base + 30}Z`), pal.cliff, { dx: 0, dy: 16, sw: SW * 0.8 });
      s += temple(560, base - 30 * k, 200, k) + temple(870, base - 66 * k, 150, k);
      s += `<path d="M-20 ${n1(base - 44 * k)} Q200 ${n1(base - 64 * k)} 380 ${n1(base - 34 * k)}" stroke="${pal.olive}" stroke-width="14" fill="none" opacity=".8"/>`;
      return s;
    },
    after: c.mode === 'solo' ? bay(c) : '',
  });
}

/** En Solo, une crique en contrebas sous le chemin. */
function bay(c: Ctx): string {
  const y = c.z.strip.y;
  return cel(pathS(`M-20 ${y - 40} Q250 ${y - 64} 500 ${y - 44} Q760 ${y - 24} 1020 ${y - 50} L1020 ${y + 50} Q760 ${y + 70} 500 ${y + 50} Q250 ${y + 30} -20 ${y + 54}Z`), pal.sea2, { dx: 0, dy: 10, sw: SW * 0.8 }) +
    Array.from({ length: 6 }, (_, i) => `<path d="M${40 + i * 170} ${y + (i % 2 ? 10 : -6)} q24 -9 48 0 t48 0" stroke="#bfeaf2" stroke-width="5" fill="none" opacity=".75" stroke-linecap="round"/>`).join('');
}

// ---------------------------------------------------------------- animations

const gull = (x: number, y: number) => `<path d="M${x - 20} ${y} q10 -12 20 0 q10 -12 20 0" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
const crest = (x: number, y: number, w: number) => `<path d="M${x} ${y} q${w / 4} -14 ${w / 2} 0 t${w / 2} 0" stroke="#ffffff" stroke-width="6" fill="none" stroke-linecap="round"/>`;

function anims(c: Ctx): AnimSpec[] {
  const [a, b, , d] = spots(c);
  const solo = c.mode === 'solo';
  const list: AnimSpec[] = [
    across('Mouettes au-dessus de la mer', solo ? 210 : 56, 22, (x, y) => gull(x - 20, y) + gull(x + 26, y + 14), { w: 110, h: 40 }),
    at('Braseros allumés', 'pulse', a, 34, flame(a.x, a.y + 16, 0.9, '#f2a03a'), { period: 0.9, amp: 0.08, oy: a.y + 16 }),
    at('Braseros allumés', 'pulse', b, 34, flame(b.x, b.y + 16, 0.9, '#f2a03a'), { period: 1.1, amp: 0.08, oy: b.y + 16, phase: 0.4 }),
  ];
  if (solo) {
    const y = c.z.strip.y;
    for (const [i, x] of [120, 520, 860].entries())
      list.push({ label: 'Vagues de la crique', kind: 'bob', period: 2.4, phase: i * 0.3, amp: 6, box: { x: x - 6, y: y - 20, w: 112, h: 26 }, markup: crest(x, y - 4, 100) });
  } else {
    list.push(at('Vagues de la crique', 'bob', d, 30, crest(d.x - 40, d.y + 10, 80), { period: 2.4, amp: 5 }));
  }
  return list;
}

export const themyscira = defineMap({
  id: 'themyscira',
  name: 'Themyscira',
  tagline: 'L\'île des Amazones, entre temples et falaises.',
  universe: 'dc',
  heroes: ['wonderwoman'],
  shape: 'wave',
  pathMaterial: 'Dalles de marbre à frise dorée',
  pathKind: 'marble',
  frameKind: 'marble',
  palette: pal,
  backdrop,
  props: {
    big: [oliveTree, greekColumn(pal.marble, 130), amazonStatue],
    med: [brazier(pal.bronze), greekColumn(pal.marble, 90), amphora],
    small: [amphora, P.rock('#c8b8a0'), P.tuft(pal.olive)],
  },
  gate: templeGate,
  anims,
  sound: 'themyscira-lyres',
  modifiers: { dureeControles: 0.1 },
  unlock: { type: 'chapitre', value: 8 },
  mute: { sat: 0.78, lum: 0.9 },
});

export default themyscira;
