// Gotham City la nuit (Batman, Catwoman, Harley Quinn, Robin) : pavés mouillés entre les toits
// gothiques, gargouilles, Bat-signal dans les nuages, pluie fine et éclairs lointains.

import {
  type AnimSpec, type Ctx, type Painter, INK, P, SW, at, cel, defineMap, flat, gloss, groundShadow, light,
  n1, pathS, polyS, rectS, scene, spots,
} from './kit';
import { batEmblem, bolt, gargoyle, rainSheet, streetLamp } from './dc-kit';

const pal = {
  bg: '#0e1020',
  sky1: '#151a36', sky2: '#3a3f6e',
  ground: '#3a3c56', ground2: '#33354e',
  path: '#a9acc0', pathEdge: '#5a5c78', pathDeco: '#8fa2d0',
  frame: '#7a7890', frameLight: '#a8a6be', frameShade: '#4e4c66',
  cellA: '#eceef6', cellB: '#d9dceb',
  accent: '#f2d27a', portal: '#f2d27a',
  stone: '#6e6c86', building: '#262a4a', building2: '#30355a', window: '#f2d27a', beam: '#fff2b8', rain: '#b8c8ee',
};

const chimney: Painter = (x, y, s) =>
  groundShadow(x, y, 26 * s) +
  cel(rectS(x - 20 * s, y - 70 * s, 40 * s, 70 * s, 5 * s), '#6a5a66', { dx: 8, dy: 0 }) +
  [18, 36, 54].map((k) => `<line x1="${n1(x - 20 * s)}" y1="${n1(y - k * s)}" x2="${n1(x + 20 * s)}" y2="${n1(y - k * s)}" stroke="${INK}" stroke-width="${n1(3 * s)}" opacity=".4"/>`).join('') +
  cel(rectS(x - 26 * s, y - 80 * s, 52 * s, 14 * s, 4 * s), '#54465a', { dx: 0, dy: 5 });

/** Flaque d'eau qui reflète le ciel. */
const puddle: Painter = (x, y, s) =>
  `<ellipse cx="${n1(x)}" cy="${n1(y - 6 * s)}" rx="${n1(34 * s)}" ry="${n1(10 * s)}" fill="#4a5486" stroke="${INK}" stroke-width="${n1(3 * s)}" opacity=".9"/>` +
  `<ellipse cx="${n1(x - 10 * s)}" cy="${n1(y - 8 * s)}" rx="${n1(12 * s)}" ry="${n1(3 * s)}" fill="#fff" opacity=".5"/>`;

/** Sortie : porche gothique en ogive. */
const gothicDoor: Painter = (x, y, s) =>
  groundShadow(x, y, 66 * s) +
  cel(pathS(`M${n1(x - 60 * s)} ${n1(y)} L${n1(x - 60 * s)} ${n1(y - 80 * s)} Q${n1(x - 60 * s)} ${n1(y - 130 * s)} ${n1(x)} ${n1(y - 160 * s)} Q${n1(x + 60 * s)} ${n1(y - 130 * s)} ${n1(x + 60 * s)} ${n1(y - 80 * s)} L${n1(x + 60 * s)} ${n1(y)}Z`), pal.stone, { dx: 12, dy: 0 }) +
  flat(pathS(`M${n1(x - 30 * s)} ${n1(y)} L${n1(x - 30 * s)} ${n1(y - 66 * s)} Q${n1(x)} ${n1(y - 116 * s)} ${n1(x + 30 * s)} ${n1(y - 66 * s)} L${n1(x + 30 * s)} ${n1(y)}Z`), '#1e1a30') +
  `<circle cx="${n1(x)}" cy="${n1(y - 118 * s)}" r="${n1(10 * s)}" fill="${pal.window}" stroke="${INK}" stroke-width="${n1(3 * s)}"/>` +
  gloss(x - 40 * s, y - 100 * s, 4 * s, 16 * s, 10, 0.3);

// ---------------------------------------------------------------- fond

function gothicSkyline(c: Ctx, base: number, k: number): string {
  let s = '';
  // silhouettes lointaines
  s += `<path d="M-20 ${base} ${Array.from({ length: 12 }, (_, i) => { const x = i * 92, h = (60 + ((i * 53) % 90)) * k; return `L${x} ${n1(base - h)} L${x + 30} ${n1(base - h - 26 * k)} L${x + 60} ${n1(base - h)} L${x + 92} ${n1(base - h)}`; }).join(' ')} L1020 ${base} Z" fill="${light(pal.building, 0.12)}" opacity=".8"/>`;
  const items: [number, number, number, string, 0 | 1 | 2][] = [
    [-20, 120, 130, pal.building, 1], [90, 90, 190, pal.building2, 2], [190, 110, 110, pal.building, 0],
    [430, 70, 250, pal.building2, 2], [520, 100, 80, pal.building, 1], [650, 90, 100, pal.building2, 0],
    [760, 110, 120, pal.building, 1], [880, 140, 200, pal.building2, 2],
  ];
  for (const [x, w, h0, col, roof] of items) {
    const h = h0 * k;
    s += cel(rectS(x, base - h, w, h + 30, 4), col, { dx: Math.min(18, w * 0.18), dy: 0, sw: SW * 0.8 });
    if (roof === 1) s += cel(polyS([{ x: x - 6, y: base - h + 2 }, { x: x + w / 2, y: base - h - 60 * k }, { x: x + w + 6, y: base - h + 2 }]), col, { dx: 8, dy: 0, sw: SW * 0.8 });
    if (roof === 2) {
      s += cel(polyS([{ x: x + w * 0.3, y: base - h + 2 }, { x: x + w * 0.5, y: base - h - 110 * k }, { x: x + w * 0.7, y: base - h + 2 }]), col, { dx: 5, dy: 0, sw: SW * 0.8 });
      s += cel(polyS([{ x: x + 2, y: base - h + 2 }, { x: x + w * 0.14, y: base - h - 40 * k }, { x: x + w * 0.28, y: base - h + 2 }]), col, { dx: 4, dy: 0, sw: SW * 0.7 });
      s += cel(polyS([{ x: x + w * 0.72, y: base - h + 2 }, { x: x + w * 0.86, y: base - h - 40 * k }, { x: x + w - 2, y: base - h + 2 }]), col, { dx: 4, dy: 0, sw: SW * 0.7 });
    }
    for (let yy = base - h + 14 * k + 6; yy < base; yy += 26 * k + 4)
      for (let xx = x + 12; xx < x + w - 16; xx += 22)
        if (((xx * 7 + yy * 3) | 0) % 5 < 2) s += `<path d="M${n1(xx)} ${n1(yy + 12 * k)} L${n1(xx)} ${n1(yy + 4 * k)} Q${n1(xx + 5)} ${n1(yy - 2 * k)} ${n1(xx + 10)} ${n1(yy + 4 * k)} L${n1(xx + 10)} ${n1(yy + 12 * k)}Z" fill="${pal.window}" opacity=".8"/>`;
  }
  return s;
}

/** Bat-signal : faisceau depuis un toit vers les nuages, emblème sur une tache de lumière. */
function batSignal(c: Ctx, base: number): string {
  const k = c.mode === 'solo' ? 1 : 0.5;
  const sx = 930, sy = base - 200 * k, tx = 640, ty = c.mode === 'solo' ? 150 : 60;
  let s = `<path d="M${sx - 8} ${n1(sy)} L${tx - 110} ${n1(ty - 30)} L${tx + 110} ${n1(ty + 30)} L${sx + 8} ${n1(sy)}Z" fill="${pal.beam}" opacity=".16"/>`;
  s += `<ellipse cx="${tx}" cy="${ty}" rx="${n1(130 * Math.max(k, 0.6))}" ry="${n1(64 * Math.max(k, 0.6))}" fill="#5a5f8a" opacity=".85"/>`;
  s += signalSpot(tx, ty, c.mode === 'solo' ? 1 : 0.6);
  return s;
}

function backdrop(c: Ctx): string {
  const k = c.mode === 'solo' ? 1 : 0.5;
  return scene(c, {
    texture: 'tiles', pad: '#4a4c68', padMargin: 0.9,
    horizon: (base) =>
      // nuages bas et lourds
      `<ellipse cx="200" cy="${n1(base - 210 * k)}" rx="260" ry="${n1(60 * k)}" fill="#2a2f52" opacity=".9"/><ellipse cx="820" cy="${n1(base - 240 * k)}" rx="240" ry="${n1(50 * k)}" fill="#2a2f52" opacity=".9"/>` +
      batSignal(c, base) + gothicSkyline(c, base, k) +
      cel(rectS(-20, base - 4, 1040, 26, 0), pal.stone, { dx: 0, dy: 8 }),
    after: lowStreet(c),
  });
}

function lowStreet(c: Ctx): string {
  if (c.mode !== 'solo') return '';
  const y = c.z.strip.y, h = 96;
  let s = `<rect x="-20" y="${y - h / 2}" width="1040" height="${h}" fill="#262840"/>`;
  s += `<rect x="-20" y="${y - h / 2}" width="1040" height="12" fill="#4a4c68"/><rect x="-20" y="${y + h / 2 - 12}" width="1040" height="12" fill="#4a4c68"/>`;
  for (let x = 20; x < 1000; x += 140) s += `<ellipse cx="${x + 40}" cy="${y + 8}" rx="46" ry="9" fill="#4a5486" opacity=".6"/><ellipse cx="${x + 30}" cy="${y + 6}" rx="14" ry="3" fill="${pal.window}" opacity=".5"/>`;
  return s;
}

// ---------------------------------------------------------------- animations

const signalSpot = (x: number, y: number, k: number) =>
  `<ellipse cx="${x}" cy="${y}" rx="${n1(84 * k)}" ry="${n1(48 * k)}" fill="${pal.beam}" stroke="${INK}" stroke-width="4"/>` + batEmblem(x, y, 1.3 * k);

function anims(c: Ctx): AnimSpec[] {
  const [a, b, , d] = spots(c);
  const solo = c.mode === 'solo';
  const rain = (x: number, y: number, w: number, h: number, seed: number, phase = 0): AnimSpec => ({
    label: 'Pluie fine', kind: 'drift', period: 0.55, phase, dx: -10, dy: 26,
    box: { x, y, w, h }, markup: rainSheet(x, y, w, h, seed, pal.rain, Math.round((w * h) / 2600)),
  });
  const list: AnimSpec[] = [
    // pluie dans le ciel et dans la rue en contrebas (jamais sur le chemin ni sur la grille)
    rain(20, solo ? 140 : 10, 960, solo ? 84 : 60, 7),
    // Bat-signal qui palpite dans les nuages
    at('Bat-signal dans les nuages', 'pulse', { x: 640, y: solo ? 150 : 60 }, solo ? 70 : 42, signalSpot(640, solo ? 150 : 60, solo ? 1 : 0.6), { period: 3.2, amp: 0.08 }),
    at('Éclairs lointains', 'blink', d, 34, bolt(d.x, d.y, 1, '#e8ecff'), { period: 3.7, min: 0 }),
  ];
  if (solo) list.push(rain(20, c.z.strip.y - 40, 960, 70, 13, 0.4));
  else list.push(rain(a.x - 30, a.y - 40, 60, 60, 3, 0.3));
  list.push(at('Éclairs lointains', 'blink', b, 30, bolt(b.x, b.y, 0.8, '#e8ecff'), { period: 4.4, min: 0, phase: 0.5 }));
  return list;
}

export const gothamNuit = defineMap({
  id: 'gotham-nuit',
  name: 'Gotham City la nuit',
  tagline: 'Sous la pluie, le Bat-signal veille sur la ville.',
  universe: 'dc',
  heroes: ['batman', 'catwoman', 'harley', 'robin'],
  shape: 'steps',
  pathMaterial: 'Pavés mouillés entre les toits gothiques',
  pathKind: 'wetcobble',
  frameKind: 'stone',
  palette: pal,
  backdrop,
  props: {
    big: [gargoyle(pal.stone), streetLamp('#3e3c56', pal.window), gargoyle(pal.stone)],
    med: [chimney, gargoyle(pal.stone), streetLamp('#3e3c56', pal.window)],
    small: [puddle, P.crate('#5a5670'), puddle],
  },
  gate: gothicDoor,
  anims,
  sound: 'gotham-pluie-orgue',
  modifiers: { critiques: 0.1 },
  unlock: { type: 'chapitre', value: 7 },
  mute: { sat: 0.78, lum: 0.88 },
});

export default gothamNuit;
