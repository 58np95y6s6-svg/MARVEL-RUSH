// Arène du Joker : l'asile d'Arkham transformé en fête foraine. Sol en damier violet et vert,
// cartes à jouer géantes, chapiteau rayé, grande roue, gaz hilarant vert. Pendant le boss : nappes de
// gaz vert sur les bords et cartes qui tombent en fond.

import { type AnimSpec, type Ctx, type Painter, INK, SW, across, at, cel, circleS, defineMap, flat, gloss, groundShadow, light, n1, pathS, polyS, rectS, scene, spots, stars } from './kit';

const pal = {
  bg: '#140a1e',
  sky1: '#1e0e32', sky2: '#4a2a5e',
  ground: '#3a2a4a', ground2: '#32243f',
  path: '#c6b6d6', pathEdge: '#5e4a72', pathDeco: '#6aa64a',
  frame: '#7a6488', frameLight: '#a892b6', frameShade: '#503e5e',
  cellA: '#f2eef6', cellB: '#e0d8ea',
  accent: '#6ad84a', portal: '#6ad84a',
  purple: '#7a3aa8', green: '#5ac83a', gas: '#8ae86a', card: '#f6f0e4', red: '#d8443e', stone: '#5e5670',
};

// ---------------------------------------------------------------- accessoires

/** Carte à jouer géante plantée dans le sol. */
const bigCard = (suit: 'heart' | 'spade', tilt: number): Painter => (x, y, s) => {
  const col = suit === 'heart' ? pal.red : INK;
  const sym = (cx: number, cy: number, r: number) => suit === 'heart'
    ? `<path d="M${n1(cx)} ${n1(cy + r)} Q${n1(cx - r * 1.4)} ${n1(cy - r * 0.2)} ${n1(cx - r * 0.6)} ${n1(cy - r)} Q${n1(cx)} ${n1(cy - r)} ${n1(cx)} ${n1(cy - r * 0.4)} Q${n1(cx)} ${n1(cy - r)} ${n1(cx + r * 0.6)} ${n1(cy - r)} Q${n1(cx + r * 1.4)} ${n1(cy - r * 0.2)} ${n1(cx)} ${n1(cy + r)}Z" fill="${col}"/>`
    : `<path d="M${n1(cx)} ${n1(cy - r)} Q${n1(cx + r * 1.4)} ${n1(cy + r * 0.2)} ${n1(cx + r * 0.6)} ${n1(cy + r * 0.7)} Q${n1(cx + r * 0.2)} ${n1(cy + r * 0.7)} ${n1(cx)} ${n1(cy + r * 0.3)} L${n1(cx + r * 0.3)} ${n1(cy + r)} L${n1(cx - r * 0.3)} ${n1(cy + r)} L${n1(cx)} ${n1(cy + r * 0.3)} Q${n1(cx - r * 0.2)} ${n1(cy + r * 0.7)} ${n1(cx - r * 0.6)} ${n1(cy + r * 0.7)} Q${n1(cx - r * 1.4)} ${n1(cy + r * 0.2)} ${n1(cx)} ${n1(cy - r)}Z" fill="${col}"/>`;
  return groundShadow(x, y, 40 * s) + `<g transform="rotate(${tilt} ${n1(x)} ${n1(y)})">` +
    cel(rectS(x - 36 * s, y - 110 * s, 72 * s, 104 * s, 8 * s), pal.card, { dx: 8, dy: 0 }) +
    sym(x, y - 58 * s, 16 * s) + sym(x - 22 * s, y - 94 * s, 6 * s) + sym(x + 22 * s, y - 22 * s, 6 * s) + `</g>`;
};

/** Chapiteau rayé violet et vert. */
const tent: Painter = (x, y, s) => {
  const w = 74 * s, h = 70 * s;
  let o = groundShadow(x, y, w * 1.05);
  o += cel(rectS(x - w, y - h, 2 * w, h, 4), pal.purple, { dx: 12, dy: 0 });
  for (let i = 0; i < 4; i++) o += `<rect x="${n1(x - w + (i * 2 + 1) * (w / 4))}" y="${n1(y - h + 4)}" width="${n1(w / 4)}" height="${n1(h - 6)}" fill="${pal.green}" opacity=".85"/>`;
  o += flat(pathS(`M${n1(x - 16 * s)} ${n1(y)} L${n1(x - 16 * s)} ${n1(y - 40 * s)} Q${n1(x)} ${n1(y - 52 * s)} ${n1(x + 16 * s)} ${n1(y - 40 * s)} L${n1(x + 16 * s)} ${n1(y)}Z`), '#1e0e32');
  o += cel(polyS([{ x: x - w - 10 * s, y: y - h + 4 }, { x, y: y - h - 70 * s }, { x: x + w + 10 * s, y: y - h + 4 }]), pal.purple, { dx: 10, dy: 0 });
  o += `<path d="M${n1(x - w * 0.4)} ${n1(y - h - 2)} L${n1(x)} ${n1(y - h - 66 * s)} L${n1(x + w * 0.4)} ${n1(y - h - 2)}Z" fill="${pal.green}" opacity=".85"/>`;
  o += flat(pathS(`M${n1(x)} ${n1(y - h - 70 * s)} L${n1(x)} ${n1(y - h - 100 * s)} L${n1(x + 24 * s)} ${n1(y - h - 92 * s)} L${n1(x)} ${n1(y - h - 84 * s)}`), pal.green, SW * 0.6);
  return o;
};

/** Bonbonne de gaz hilarant. */
const gasTank: Painter = (x, y, s) =>
  groundShadow(x, y, 22 * s) + cel(rectS(x - 18 * s, y - 62 * s, 36 * s, 62 * s, 16 * s), pal.green, { dx: 7, dy: 0 }) +
  flat(rectS(x - 6 * s, y - 76 * s, 12 * s, 16 * s, 3), '#8a8a9a', SW * 0.6) +
  `<path d="M${n1(x - 10 * s)} ${n1(y - 34 * s)} q${n1(10 * s)} ${n1(10 * s)} ${n1(20 * s)} 0" stroke="${INK}" stroke-width="${n1(4 * s)}" fill="none" stroke-linecap="round"/>` +
  `<circle cx="${n1(x - 6 * s)}" cy="${n1(y - 42 * s)}" r="${n1(2.6 * s)}" fill="${INK}"/><circle cx="${n1(x + 6 * s)}" cy="${n1(y - 42 * s)}" r="${n1(2.6 * s)}" fill="${INK}"/>` +
  gloss(x - 8 * s, y - 50 * s, 3 * s, 10 * s, 0, 0.45);

const balloon = (col: string): Painter => (x, y, s) =>
  `<path d="M${n1(x)} ${n1(y)} q${n1(-8 * s)} ${n1(-30 * s)} 0 ${n1(-60 * s)}" stroke="${INK}" stroke-width="${n1(2.5 * s)}" fill="none"/>` +
  cel((a: string) => `<ellipse cx="${n1(x)}" cy="${n1(y - 78 * s)}" rx="${n1(16 * s)}" ry="${n1(20 * s)}" ${a}/>`, col, { dx: 4, dy: 3, sw: SW * 0.7 }) +
  gloss(x - 5 * s, y - 86 * s, 3 * s, 6 * s);

/** Sortie : bouche du Joker (entrée du train fantôme). */
const jokerMouth: Painter = (x, y, s) =>
  groundShadow(x, y, 70 * s) +
  cel(pathS(`M${n1(x - 66 * s)} ${n1(y)} L${n1(x - 66 * s)} ${n1(y - 90 * s)} Q${n1(x)} ${n1(y - 170 * s)} ${n1(x + 66 * s)} ${n1(y - 90 * s)} L${n1(x + 66 * s)} ${n1(y)}Z`), '#f0eaf2', { dx: 12, dy: 0 }) +
  `<circle cx="${n1(x - 24 * s)}" cy="${n1(y - 110 * s)}" r="${n1(10 * s)}" fill="${pal.green}" stroke="${INK}" stroke-width="${n1(3 * s)}"/><circle cx="${n1(x + 24 * s)}" cy="${n1(y - 110 * s)}" r="${n1(10 * s)}" fill="${pal.green}" stroke="${INK}" stroke-width="${n1(3 * s)}"/>` +
  flat(pathS(`M${n1(x - 46 * s)} ${n1(y - 66 * s)} Q${n1(x)} ${n1(y - 40 * s)} ${n1(x + 46 * s)} ${n1(y - 66 * s)} L${n1(x + 34 * s)} ${n1(y)} L${n1(x - 34 * s)} ${n1(y)}Z`), pal.red) +
  `<path d="M${n1(x - 30 * s)} ${n1(y - 56 * s)} L${n1(x + 30 * s)} ${n1(y - 56 * s)}" stroke="#fff" stroke-width="${n1(8 * s)}" stroke-dasharray="${n1(8 * s)} ${n1(4 * s)}"/>` +
  flat(pathS(`M${n1(x - 26 * s)} ${n1(y)} L${n1(x - 26 * s)} ${n1(y - 40 * s)} L${n1(x + 26 * s)} ${n1(y - 40 * s)} L${n1(x + 26 * s)} ${n1(y)}Z`), '#1e0e32');

// ---------------------------------------------------------------- fond

function arkham(base: number, k: number): string {
  let s = `<circle cx="830" cy="${n1(base - 200 * k)}" r="${n1(52 * Math.max(k, 0.6))}" fill="#e8f0c8" stroke="${INK}" stroke-width="5"/>`;
  // l'asile, silhouette gothique
  const b = '#2a1e3e';
  s += cel(rectS(80, base - 150 * k, 360, 150 * k + 20, 4), b, { dx: 30, dy: 0, sw: SW * 0.8 });
  s += cel(polyS([{ x: 60, y: base - 150 * k }, { x: 260, y: base - 230 * k }, { x: 460, y: base - 150 * k }]), b, { dx: 20, dy: 0, sw: SW * 0.8 });
  s += cel(rectS(230, base - 280 * k, 60, 140 * k, 3), b, { dx: 10, dy: 0, sw: SW * 0.8 }) + cel(polyS([{ x: 222, y: base - 280 * k }, { x: 260, y: base - 340 * k }, { x: 298, y: base - 280 * k }]), b, { dx: 6, dy: 0, sw: SW * 0.8 });
  for (let x = 110; x < 420; x += 44) s += `<rect x="${x}" y="${n1(base - 110 * k)}" width="16" height="${n1(26 * k + 6)}" rx="6" fill="${pal.gas}" opacity=".55"/>`;
  // grande roue
  const wx = 680, wy = k === 1 ? 130 : 40, r = k === 1 ? 56 : 28;
  s += `<path d="M${wx - r * 0.6} ${base} L${wx} ${n1(wy)} L${wx + r * 0.6} ${base}" stroke="${INK}" stroke-width="10" fill="none"/>`;
  s += `<circle cx="${wx}" cy="${n1(wy)}" r="${n1(r)}" fill="none" stroke="${INK}" stroke-width="12"/><circle cx="${wx}" cy="${n1(wy)}" r="${n1(r)}" fill="none" stroke="${pal.purple}" stroke-width="6"/>`;
  return s;
}

function backdrop(c: Ctx): string {
  const k = c.mode === 'solo' ? 1 : 0.5;
  return scene(c, {
    texture: 'tiles', pad: '#4a3a5c', padMargin: 0.9,
    horizon: (base) => stars(c, 24, { x: 0, y: 0, w: 1000, h: base - 120 }) + arkham(base, k) +
      `<rect x="-20" y="${base - 20}" width="1040" height="40" fill="${pal.gas}" opacity=".18"/>` +
      cel(rectS(-20, base - 4, 1040, 26, 0), pal.stone, { dx: 0, dy: 8 }),
  });
}

// ---------------------------------------------------------------- animations

const wheelSpokes = (x: number, y: number, r: number) => {
  let s = '';
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    s += `<line x1="${x}" y1="${y}" x2="${n1(x + Math.cos(a) * r)}" y2="${n1(y + Math.sin(a) * r)}" stroke="${INK}" stroke-width="4"/>`;
    s += cel(circleS(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.13), i % 2 ? pal.green : pal.red, { dx: 2, dy: 2, sw: 3 });
  }
  return s + `<circle cx="${x}" cy="${y}" r="${n1(r * 0.12)}" fill="${pal.card}" stroke="${INK}" stroke-width="4"/>`;
};
const smallCard = (x: number, y: number) =>
  cel(rectS(x - 14, y - 20, 28, 40, 4), pal.card, { dx: 3, dy: 0, sw: 3.5 }) + `<circle cx="${x}" cy="${y}" r="6" fill="${pal.red}"/>`;
const gasPuff = (x: number, y: number, r: number) =>
  `<circle cx="${x - r * 0.5}" cy="${y}" r="${r * 0.7}" fill="${pal.gas}" opacity=".4"/><circle cx="${x + r * 0.4}" cy="${y - r * 0.2}" r="${r * 0.8}" fill="${pal.gas}" opacity=".4"/><circle cx="${x}" cy="${y - r * 0.5}" r="${r * 0.6}" fill="${light(pal.gas, 0.3)}" opacity=".45"/>`;

function anims(c: Ctx): AnimSpec[] {
  const [a, b, d, e, f] = spots(c);
  const solo = c.mode === 'solo';
  const wy = solo ? 130 : 40, r = solo ? 56 : 28;
  return [
    at('Grande roue', 'spin', { x: 680, y: wy }, r + 14, wheelSpokes(680, wy, r), { period: 16 }),
    at('Cartes qui tournoient', 'spin', a, 32, smallCard(a.x + 12, a.y), { period: 3 }),
    at('Cartes qui tournoient', 'sway', d, 30, smallCard(d.x, d.y), { period: 2.2, amp: 18 }),
    at('Gaz hilarant', 'pulse', b, 34, gasPuff(b.x, b.y + 6, 22), { period: 2.6, amp: 0.15 }),
    at('Gaz hilarant', 'blink', e, 30, gasPuff(e.x, e.y + 6, 20), { period: 3.4, min: 0.2 }),
    at('Gaz hilarant', 'pulse', f, 30, gasPuff(f.x, f.y + 6, 18), { period: 2.9, amp: 0.15, phase: 0.5 }),
    ...(solo ? [across('Gaz hilarant', c.z.strip.y, 18, (x, y) => gasPuff(x, y - 20, 30), { w: 100, h: 60 })] : []),
  ];
}

export const areneJoker = defineMap({
  id: 'arene-joker',
  name: 'Arkham en fête',
  tagline: 'L\'asile d\'Arkham, devenu la fête foraine du Joker.',
  universe: 'boss',
  heroes: [],
  boss: 'joker',
  shape: 'zigzag',
  pathMaterial: 'Damier de fête foraine',
  pathKind: 'checker',
  frameKind: 'stone',
  palette: pal,
  backdrop,
  props: { big: [tent, bigCard('heart', -8), bigCard('spade', 7)], med: [bigCard('spade', 10), gasTank, bigCard('heart', -12)], small: [gasTank, balloon(pal.green), balloon(pal.purple)] },
  gate: jokerMouth,
  anims,
  sound: 'fete-foraine-grincante',
  unlock: { type: 'depart', value: 0 },
  bossFx: { description: 'Nappes de gaz hilarant vert sur les bords, cartes à jouer qui tombent en fond.', effects: ['laughing-gas', 'cards-rain'], tint: '#3aa04a', tintAlpha: 0.12, colors: { gas: pal.gas, card: pal.card } },
  mute: { sat: 0.76, lum: 0.88 },
});

export default areneJoker;
