// Metropolis (Superman, Supergirl, Shazam, Flash) : esplanade claire au pied des gratte-ciel,
// le globe du Daily Planet, un ciel lumineux, des dirigeables et des voitures sur l'avenue.

import {
  type AnimSpec, type Ctx, type Painter, INK, P, SW, across, at, cel, circleS, defineMap, flat, gloss, groundShadow,
  light, n1, pathS, rectS, scene, sparkle, spots,
} from './kit';

const pal = {
  bg: '#2a3a66',
  sky1: '#5fa0e8', sky2: '#cfe6ff',
  ground: '#8e98b4', ground2: '#848ea8',
  path: '#e6e2da', pathEdge: '#9a96a6', pathDeco: '#b8b2c4',
  frame: '#a8b0c8', frameLight: '#d8deee', frameShade: '#76809e',
  cellA: '#f2f4fa', cellB: '#dfe4f0',
  accent: '#e8413b', portal: '#3c8bf0',
  glass: '#7ab0e0', glass2: '#9ac4ec', steel: '#6a7a9c', globe: '#f2c33c', red: '#d8443e', leaf: '#6aa86a',
};

// ---------------------------------------------------------------- accessoires

const modernLamp: Painter = (x, y, s) =>
  groundShadow(x, y, 18 * s) + flat(rectS(x - 4 * s, y - 130 * s, 8 * s, 130 * s, 3), '#5a6680', SW * 0.7) +
  cel(rectS(x - 4 * s, y - 136 * s, 44 * s, 10 * s, 4 * s), '#5a6680', { dx: 0, dy: 3, sw: SW * 0.7 }) +
  `<ellipse cx="${n1(x + 30 * s)}" cy="${n1(y - 124 * s)}" rx="${n1(10 * s)}" ry="${n1(4 * s)}" fill="#fff6c0" stroke="${INK}" stroke-width="${n1(3 * s)}"/>`;

const planter: Painter = (x, y, s) =>
  groundShadow(x, y, 40 * s) + cel(rectS(x - 38 * s, y - 34 * s, 76 * s, 34 * s, 8 * s), '#c8c2b6', { dx: 0, dy: 8 }) +
  P.bush(pal.leaf)(x, y - 26 * s, s * 0.9, () => 0);

const newsStand: Painter = (x, y, s) =>
  groundShadow(x, y, 40 * s) + cel(rectS(x - 36 * s, y - 70 * s, 72 * s, 70 * s, 6 * s), '#4a8a6a', { dx: 10, dy: 0 }) +
  cel(rectS(x - 44 * s, y - 84 * s, 88 * s, 18 * s, 6 * s), pal.red, { dx: 0, dy: 6 }) +
  `<rect x="${n1(x - 26 * s)}" y="${n1(y - 56 * s)}" width="${n1(52 * s)}" height="${n1(26 * s)}" rx="3" fill="#f4efe2" stroke="${INK}" stroke-width="${n1(3 * s)}"/>` +
  `<path d="M${n1(x - 20 * s)} ${n1(y - 48 * s)} h${n1(40 * s)} M${n1(x - 20 * s)} ${n1(y - 40 * s)} h${n1(28 * s)}" stroke="${INK}" stroke-width="${n1(2.5 * s)}" opacity=".5"/>`;

const bench: Painter = (x, y, s) =>
  groundShadow(x, y, 38 * s) + flat(rectS(x - 32 * s, y - 20 * s, 6 * s, 20 * s, 2), '#4a5268', SW * 0.6) + flat(rectS(x + 26 * s, y - 20 * s, 6 * s, 20 * s, 2), '#4a5268', SW * 0.6) +
  cel(rectS(x - 40 * s, y - 28 * s, 80 * s, 10 * s, 3), '#b07a4a', { dx: 0, dy: 3, sw: SW * 0.7 }) +
  cel(rectS(x - 40 * s, y - 50 * s, 80 * s, 10 * s, 3), '#b07a4a', { dx: 0, dy: 3, sw: SW * 0.7 });

const hydrant: Painter = (x, y, s) =>
  groundShadow(x, y, 16 * s) + cel(rectS(x - 10 * s, y - 34 * s, 20 * s, 34 * s, 6 * s), pal.red, { dx: 5, dy: 0, sw: SW * 0.7 }) +
  cel(circleS(x, y - 36 * s, 11 * s), pal.red, { dx: 3, dy: 3, sw: SW * 0.7 });

/** Sortie : entrée vitrée d'immeuble avec auvent rouge. */
const towerDoor: Painter = (x, y, s) =>
  groundShadow(x, y, 66 * s) +
  cel(rectS(x - 60 * s, y - 120 * s, 120 * s, 120 * s, 8 * s), pal.steel, { dx: 12, dy: 0 }) +
  flat(rectS(x - 34 * s, y - 76 * s, 68 * s, 76 * s, 4 * s), pal.glass) +
  `<line x1="${n1(x)}" y1="${n1(y - 76 * s)}" x2="${n1(x)}" y2="${n1(y)}" stroke="${INK}" stroke-width="${n1(4 * s)}"/>` +
  cel(rectS(x - 52 * s, y - 100 * s, 104 * s, 18 * s, 6 * s), pal.red, { dx: 0, dy: 6 }) +
  gloss(x - 20 * s, y - 56 * s, 5 * s, 14 * s, 20, 0.5);

// ---------------------------------------------------------------- fond

function tower(x: number, w: number, h: number, base: number, col: string, top: 0 | 1 | 2): string {
  let s = cel(rectS(x, base - h, w, h + 30, 6), col, { dx: Math.min(18, w * 0.2), dy: 0, sw: SW * 0.8 });
  if (top === 1) s += cel(rectS(x + w * 0.2, base - h - 26, w * 0.6, 28, 4), col, { dx: 6, dy: 0, sw: SW * 0.8 }) + flat(rectS(x + w / 2 - 2, base - h - 70, 4, 46, 2), col, 3);
  if (top === 2) s += cel(pathS(`M${n1(x)} ${n1(base - h + 2)} Q${n1(x + w / 2)} ${n1(base - h - 50)} ${n1(x + w)} ${n1(base - h + 2)}Z`), col, { dx: 8, dy: 0, sw: SW * 0.8 });
  // bandes vitrées verticales
  for (let xx = x + 10; xx < x + w - 12; xx += 18) s += `<rect x="${n1(xx)}" y="${n1(base - h + 12)}" width="8" height="${n1(h - 6)}" rx="3" fill="${light(col, 0.35)}" opacity=".55"/>`;
  return s;
}

/** Immeuble du Daily Planet avec son globe doré. */
function dailyPlanet(x: number, base: number, k: number): string {
  const w = 130, h = 50 * k + 20, gy = base - h - 54 * k, r = 46 * Math.max(k, 0.6);
  let s = cel(rectS(x - w / 2, base - h, w, h + 30, 6), '#c8b89a', { dx: 16, dy: 0, sw: SW * 0.8 });
  for (let yy = base - h + 12; yy < base; yy += 22) s += `<rect x="${x - w / 2 + 12}" y="${n1(yy)}" width="${w - 30}" height="8" rx="3" fill="#8a7a6a" opacity=".5"/>`;
  s += cel(rectS(x - 24, base - h - 16, 48, 18, 4), '#b0a080', { dx: 4, dy: 0, sw: SW * 0.7 });
  // globe et anneau
  s += `<ellipse cx="${x}" cy="${n1(gy)}" rx="${n1(r * 1.55)}" ry="${n1(r * 0.42)}" fill="none" stroke="${INK}" stroke-width="12"/>`;
  s += cel(circleS(x, gy, r), pal.globe, { dx: r * 0.3, dy: r * 0.2 });
  s += `<path d="M${n1(x - r * 0.6)} ${n1(gy - r * 0.5)} q${n1(r * 0.3)} ${n1(r * 0.4)} ${n1(r * 0.1)} ${n1(r * 0.8)} M${n1(x + r * 0.2)} ${n1(gy - r * 0.8)} q${n1(r * 0.5)} ${n1(r * 0.4)} ${n1(r * 0.3)} ${n1(r)}" stroke="#c8902a" stroke-width="${n1(r * 0.22)}" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M${n1(x - r * 1.55)} ${n1(gy)} A${n1(r * 1.55)} ${n1(r * 0.42)} 0 0 0 ${n1(x + r * 1.55)} ${n1(gy)}" fill="none" stroke="${INK}" stroke-width="12"/>`;
  s += `<path d="M${n1(x - r * 1.55)} ${n1(gy)} A${n1(r * 1.55)} ${n1(r * 0.42)} 0 0 0 ${n1(x + r * 1.55)} ${n1(gy)}" fill="none" stroke="${pal.globe}" stroke-width="6"/>`;
  s += gloss(x - r * 0.4, gy - r * 0.45, r * 0.22, r * 0.12);
  return s;
}

function backdrop(c: Ctx): string {
  const k = c.mode === 'solo' ? 1 : 0.5;
  return scene(c, {
    texture: 'tiles', pad: '#a4acc6', padMargin: 0.9,
    horizon: (base) => {
      let s = `<circle cx="860" cy="${n1(base - 210 * k)}" r="70" fill="#fff6d0" opacity=".55"/>`;
      s += `<path d="M-20 ${base} ${Array.from({ length: 11 }, (_, i) => `L${i * 100} ${n1(base - (90 + ((i * 41) % 80)) * k)} L${i * 100 + 70} ${n1(base - (90 + ((i * 41) % 80)) * k)}`).join(' ')} L1020 ${base} Z" fill="${light(pal.glass, 0.4)}" opacity=".8"/>`;
      const items: [number, number, number, string, 0 | 1 | 2][] = [
        [-10, 110, 150, pal.glass, 1], [300, 80, 220, pal.glass2, 2], [390, 120, 130, pal.steel, 0],
        [530, 90, 250, pal.glass, 1], [630, 110, 160, pal.glass2, 0], [760, 90, 210, pal.steel, 2], [860, 150, 140, pal.glass, 0],
      ];
      for (const [x, w, h, col, top] of items) s += tower(x, w, h * k, base, col, top);
      s += dailyPlanet(190, base, k);
      s += cel(rectS(-20, base - 4, 1040, 26, 0), '#b8b0a4', { dx: 0, dy: 8 });
      return s;
    },
    after: c.mode === 'solo' ? avenue(c.z.strip.y) : '',
  });
}

function avenue(y: number): string {
  const h = 96;
  let s = `<rect x="-20" y="${y - h / 2}" width="1040" height="${h}" fill="#5a6280"/>`;
  s += `<rect x="-20" y="${y - h / 2}" width="1040" height="12" fill="#c8c2b6"/><rect x="-20" y="${y + h / 2 - 12}" width="1040" height="12" fill="#c8c2b6"/>`;
  for (let x = 0; x < 1000; x += 90) s += `<rect x="${x}" y="${y - 3}" width="46" height="6" rx="3" fill="#f4efe2" opacity=".8"/>`;
  return s;
}

// ---------------------------------------------------------------- animations

function car(x: number, y: number, col: string, flip = false): string {
  const t = flip ? ` transform="translate(${n1(2 * x)} 0) scale(-1 1)"` : '';
  return `<g${t}>` + groundShadow(x, y + 14, 44, 8) +
    cel(rectS(x - 46, y - 14, 92, 28, 12), col, { dx: 0, dy: 6, sw: 5 }) +
    cel(pathS(`M${x - 26} ${y - 12} Q${x - 20} ${y - 34} ${x} ${y - 34} Q${x + 20} ${y - 34} ${x + 28} ${y - 12}Z`), col, { dx: 0, dy: 4, sw: 5 }) +
    `<path d="M${x - 18} ${y - 14} Q${x - 14} ${y - 28} ${x} ${y - 28} L${x} ${y - 14}Z" fill="#bfe0f6"/>` +
    flat(circleS(x - 26, y + 14, 9), '#2b2540', 4) + flat(circleS(x + 26, y + 14, 9), '#2b2540', 4) +
    `<circle cx="${x + 44}" cy="${y - 4}" r="4" fill="#fff6c0"/></g>`;
}

function anims(c: Ctx): AnimSpec[] {
  const [, , , d, e] = spots(c);
  const solo = c.mode === 'solo';
  const st = c.z.strip;
  const ship = (x: number, y: number) =>
    cel(pathS(`M${x - 60} ${y} Q${x - 60} ${y - 26} ${x} ${y - 26} Q${x + 60} ${y - 26} ${x + 62} ${y} Q${x + 60} ${y + 26} ${x} ${y + 26} Q${x - 60} ${y + 26} ${x - 60} ${y}Z`), '#e8e4f0', { dx: 0, dy: 8, sw: 5 }) +
    cel(pathS(`M${x - 66} ${y} L${x - 82} ${y - 18} L${x - 82} ${y + 18}Z`), pal.red, { dx: 0, dy: 3, sw: 4 }) +
    flat(rectS(x - 16, y + 24, 32, 12, 4), pal.steel, 4) +
    `<rect x="${x - 34}" y="${y - 8}" width="68" height="14" rx="5" fill="${pal.red}" opacity=".85"/>`;
  return [
    across('Dirigeable au-dessus des tours', solo ? 236 : 70, 40, (x, y) => ship(x, y), { w: 170, h: 70 }),
    { label: 'Voitures sur l\'avenue', kind: 'drift', period: 8, dx: st.x1 - st.x0, dy: 0, box: { x: st.x0 - 60, y: st.y - 48, w: 120, h: 76 }, markup: car(st.x0, st.y + 4, '#3c8bf0') },
    { label: 'Voitures sur l\'avenue', kind: 'drift', period: 11, phase: 0.5, dx: st.x0 - st.x1, dy: 0, box: { x: st.x1 - 60, y: st.y - 52, w: 120, h: 76 }, markup: car(st.x1, st.y - 4, pal.red, true) },
    at('Reflets du globe', 'blink', solo ? { x: 172, y: 140 } : d, 22, sparkle(solo ? 172 : d.x, solo ? 140 : d.y, 16, '#fff'), { period: 2.2, min: 0 }),
    at('Reflets du globe', 'blink', e, 20, sparkle(e.x, e.y, 12, '#fff'), { period: 2.9, min: 0, phase: 0.4 }),
  ];
}

export const metropolis = defineMap({
  id: 'metropolis',
  name: 'Metropolis',
  tagline: 'La cité de demain, sous le globe du Daily Planet.',
  universe: 'dc',
  heroes: ['superman', 'supergirl', 'shazam', 'flash'],
  shape: 'u',
  pathMaterial: 'Dalles claires de l\'esplanade',
  pathKind: 'slabs',
  frameKind: 'concrete',
  palette: pal,
  backdrop,
  props: {
    big: [modernLamp, planter, modernLamp],
    med: [newsStand, planter, bench],
    small: [hydrant, P.bush(pal.leaf), hydrant],
  },
  gate: towerDoor,
  anims,
  sound: 'metropolis-fanfare',
  modifiers: { degatsRayons: 0.1 },
  unlock: { type: 'chapitre', value: 8 },
  mute: { sat: 0.8, lum: 0.92 },
});

export default metropolis;
