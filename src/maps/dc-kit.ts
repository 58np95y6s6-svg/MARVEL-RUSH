// Accessoires et motifs partagés par les maps et arènes DC (style planches : formes rondes,
// contours épais, ombrage en deux tons). Tout produit des chaînes SVG.

import { type Painter, INK, SW, cel, circleS, flat, gloss, groundShadow, light, n1, pathS, polyS, rectS, shade } from './kit';

/** Chauve-souris en silhouette, centrée en (x, y), envergure ≈ 52·s. */
export const batShape = (x: number, y: number, s = 1, col = INK) =>
  `<path d="M${n1(x)} ${n1(y - 4 * s)} q${n1(-10 * s)} ${n1(-12 * s)} ${n1(-26 * s)} ${n1(-8 * s)} q${n1(8 * s)} ${n1(4 * s)} ${n1(6 * s)} ${n1(12 * s)} q${n1(10 * s)} ${n1(-6 * s)} ${n1(20 * s)} ${n1(-4 * s)} q${n1(10 * s)} ${n1(-2 * s)} ${n1(20 * s)} ${n1(4 * s)} q${n1(-2 * s)} ${n1(-8 * s)} ${n1(6 * s)} ${n1(-12 * s)} q${n1(-16 * s)} ${n1(-4 * s)} ${n1(-26 * s)} ${n1(8 * s)}z" fill="${col}"/>`;

/** Emblème de chauve-souris (Bat-signal), centré, largeur ≈ 100·s. */
const BAT_HALF: [number, number][] = [[0, -5], [4, -5], [6, -14], [9, -3], [18, -6], [34, -12], [50, -18], [43, -5], [43, 7], [33, 2], [25, 11], [16, 4], [7, 9], [0, 19]];
export const batEmblem = (x: number, y: number, s: number, col = INK) => {
  const right = BAT_HALF.map(([px, py]) => `${n1(x + px * s)},${n1(y + py * s)}`);
  const left = BAT_HALF.slice(1, -1).reverse().map(([px, py]) => `${n1(x - px * s)},${n1(y + py * s)}`);
  return `<polygon points="${[...right, ...left].join(' ')}" fill="${col}" stroke-linejoin="round"/>`;
};

/** Éclair en zigzag, centré en (x, y), hauteur ≈ 60·s. */
export const bolt = (x: number, y: number, s = 1, col = '#fff4a8') =>
  `<path d="M${n1(x)} ${n1(y - 30 * s)} L${n1(x - 10 * s)} ${n1(y)} L${n1(x + 2 * s)} ${n1(y)} L${n1(x - 8 * s)} ${n1(y + 30 * s)} L${n1(x + 14 * s)} ${n1(y - 6 * s)} L${n1(x + 2 * s)} ${n1(y - 6 * s)} L${n1(x + 10 * s)} ${n1(y - 30 * s)}Z" fill="${col}" stroke="${INK}" stroke-width="${n1(3 * s)}" stroke-linejoin="round"/>`;

/** Rideau de pluie (traits obliques) dans un rectangle. */
export function rainSheet(x: number, y: number, w: number, h: number, seed: number, col = '#b8c8ee', n = 18): string {
  let s = `<g stroke="${col}" stroke-width="3" stroke-linecap="round" opacity=".7">`;
  let r = seed;
  const rnd = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
  for (let i = 0; i < n; i++) {
    const px = x + rnd() * (w - 14), py = y + rnd() * (h - 26);
    s += `<line x1="${n1(px + 10)}" y1="${n1(py)}" x2="${n1(px)}" y2="${n1(py + 24)}"/>`;
  }
  return s + '</g>';
}

/** Gargouille gothique accroupie sur un socle. */
export const gargoyle = (stone: string, eye = '#f2d27a'): Painter => (x, y, s) =>
  groundShadow(x, y, 34 * s) +
  cel(rectS(x - 30 * s, y - 22 * s, 60 * s, 22 * s, 4 * s), shade(stone, 0.15), { dx: 0, dy: 6 }) +
  // ailes repliées
  cel(pathS(`M${n1(x - 22 * s)} ${n1(y - 22 * s)} Q${n1(x - 52 * s)} ${n1(y - 60 * s)} ${n1(x - 40 * s)} ${n1(y - 96 * s)} Q${n1(x - 26 * s)} ${n1(y - 70 * s)} ${n1(x - 10 * s)} ${n1(y - 58 * s)}Z`), shade(stone, 0.1), { dx: 6, dy: 0 }) +
  cel(pathS(`M${n1(x + 22 * s)} ${n1(y - 22 * s)} Q${n1(x + 52 * s)} ${n1(y - 60 * s)} ${n1(x + 40 * s)} ${n1(y - 96 * s)} Q${n1(x + 26 * s)} ${n1(y - 70 * s)} ${n1(x + 10 * s)} ${n1(y - 58 * s)}Z`), shade(stone, 0.1), { dx: 6, dy: 0 }) +
  // corps et tête à cornes
  cel(pathS(`M${n1(x - 22 * s)} ${n1(y - 22 * s)} Q${n1(x - 26 * s)} ${n1(y - 64 * s)} ${n1(x)} ${n1(y - 66 * s)} Q${n1(x + 26 * s)} ${n1(y - 64 * s)} ${n1(x + 22 * s)} ${n1(y - 22 * s)}Z`), stone, { dx: 7, dy: 0 }) +
  cel(circleS(x, y - 76 * s, 17 * s), stone, { dx: 4, dy: 4 }) +
  `<path d="M${n1(x - 12 * s)} ${n1(y - 88 * s)} l${n1(-8 * s)} ${n1(-16 * s)} l${n1(14 * s)} ${n1(8 * s)} M${n1(x + 12 * s)} ${n1(y - 88 * s)} l${n1(8 * s)} ${n1(-16 * s)} l${n1(-14 * s)} ${n1(8 * s)}" fill="${stone}" stroke="${INK}" stroke-width="${n1(3.5 * s)}" stroke-linejoin="round"/>` +
  `<circle cx="${n1(x - 6 * s)}" cy="${n1(y - 78 * s)}" r="${n1(3.2 * s)}" fill="${eye}"/><circle cx="${n1(x + 6 * s)}" cy="${n1(y - 78 * s)}" r="${n1(3.2 * s)}" fill="${eye}"/>` +
  `<path d="M${n1(x - 7 * s)} ${n1(y - 68 * s)} q${n1(7 * s)} ${n1(5 * s)} ${n1(14 * s)} 0" stroke="${INK}" stroke-width="${n1(3 * s)}" fill="none" stroke-linecap="round"/>`;

/** Lampadaire à l'ancienne (bec de gaz). */
export const streetLamp = (pole: string, glowCol: string): Painter => (x, y, s) =>
  groundShadow(x, y, 20 * s) +
  cel(rectS(x - 12 * s, y - 14 * s, 24 * s, 14 * s, 3), pole, { dx: 0, dy: 4 }) +
  flat(rectS(x - 4 * s, y - 130 * s, 8 * s, 118 * s, 3), pole, SW * 0.7) +
  `<circle cx="${n1(x)}" cy="${n1(y - 146 * s)}" r="${n1(34 * s)}" fill="${glowCol}" opacity=".22"/>` +
  cel(pathS(`M${n1(x - 14 * s)} ${n1(y - 130 * s)} L${n1(x - 18 * s)} ${n1(y - 158 * s)} L${n1(x + 18 * s)} ${n1(y - 158 * s)} L${n1(x + 14 * s)} ${n1(y - 130 * s)}Z`), glowCol, { dx: 4, dy: 0, sw: SW * 0.7 }) +
  flat(pathS(`M${n1(x - 22 * s)} ${n1(y - 158 * s)} L${n1(x)} ${n1(y - 172 * s)} L${n1(x + 22 * s)} ${n1(y - 158 * s)}Z`), pole, SW * 0.7);

/** Colonne grecque (entière). */
export const greekColumn = (marble: string, h = 120): Painter => (x, y, s) =>
  groundShadow(x, y, 32 * s) +
  cel(rectS(x - 28 * s, y - 14 * s, 56 * s, 14 * s, 3), marble, { dx: 0, dy: 5 }) +
  cel(rectS(x - 18 * s, y - (h - 12) * s, 36 * s, (h - 26) * s, 4), marble, { dx: 9, dy: 0 }) +
  [-9, 0, 9].map((d) => `<line x1="${n1(x + d * s)}" y1="${n1(y - (h - 18) * s)}" x2="${n1(x + d * s)}" y2="${n1(y - 20 * s)}" stroke="${INK}" stroke-width="${n1(2.5 * s)}" opacity=".3"/>`).join('') +
  cel(rectS(x - 26 * s, y - (h + 4) * s, 52 * s, 18 * s, 5 * s), marble, { dx: 0, dy: 6 }) +
  gloss(x - 8 * s, y - (h - 30) * s, 3 * s, 16 * s, 0, 0.4);

/** Petite flamme ronde (torche, brasero). */
export const flame = (x: number, y: number, s: number, col = '#f2a03a') =>
  `<path d="M${n1(x)} ${n1(y - 40 * s)} Q${n1(x + 22 * s)} ${n1(y - 14 * s)} ${n1(x + 14 * s)} ${n1(y)} Q${n1(x)} ${n1(y + 8 * s)} ${n1(x - 14 * s)} ${n1(y)} Q${n1(x - 22 * s)} ${n1(y - 14 * s)} ${n1(x)} ${n1(y - 40 * s)}Z" fill="${col}" stroke="${INK}" stroke-width="${n1(3.5 * s)}" stroke-linejoin="round"/>` +
  `<path d="M${n1(x)} ${n1(y - 20 * s)} Q${n1(x + 9 * s)} ${n1(y - 6 * s)} ${n1(x + 5 * s)} ${n1(y)} Q${n1(x)} ${n1(y + 3 * s)} ${n1(x - 5 * s)} ${n1(y)} Q${n1(x - 9 * s)} ${n1(y - 6 * s)} ${n1(x)} ${n1(y - 20 * s)}Z" fill="${light(col, 0.6)}"/>`;

/** Brasero sur pied. */
export const brazier = (metal: string, fire = '#f2a03a'): Painter => (x, y, s) =>
  groundShadow(x, y, 28 * s) +
  flat(pathS(`M${n1(x - 16 * s)} ${n1(y)} L${n1(x - 6 * s)} ${n1(y - 40 * s)} M${n1(x + 16 * s)} ${n1(y)} L${n1(x + 6 * s)} ${n1(y - 40 * s)}`), 'none', SW * 0.8) +
  cel(pathS(`M${n1(x - 30 * s)} ${n1(y - 58 * s)} L${n1(x + 30 * s)} ${n1(y - 58 * s)} Q${n1(x + 26 * s)} ${n1(y - 36 * s)} ${n1(x)} ${n1(y - 34 * s)} Q${n1(x - 26 * s)} ${n1(y - 36 * s)} ${n1(x - 30 * s)} ${n1(y - 58 * s)}Z`), metal, { dx: 6, dy: 0 }) +
  `<circle cx="${n1(x)}" cy="${n1(y - 76 * s)}" r="${n1(34 * s)}" fill="${fire}" opacity=".2"/>` +
  flame(x, y - 58 * s, s * 0.9, fire);

/** Rocher anguleux (ruines, roche volcanique). */
export const shardRock = (c: string): Painter => (x, y, s) =>
  groundShadow(x, y, 38 * s) +
  cel(polyS([{ x: x - 38 * s, y }, { x: x - 30 * s, y: y - 34 * s }, { x: x - 8 * s, y: y - 46 * s }, { x: x + 8 * s, y: y - 22 * s }, { x: x - 2 * s, y }]), c, { dx: 6, dy: 0 }) +
  cel(polyS([{ x: x - 4 * s, y }, { x: x + 12 * s, y: y - 30 * s }, { x: x + 34 * s, y: y - 26 * s }, { x: x + 40 * s, y }]), shade(c, 0.12), { dx: 5, dy: 0 });

/** Écran / moniteur rétroéclairé. */
export const monitor = (frame: string, screen: string): Painter => (x, y, s) =>
  groundShadow(x, y, 34 * s) +
  flat(rectS(x - 5 * s, y - 34 * s, 10 * s, 34 * s, 2), frame, SW * 0.7) +
  cel(rectS(x - 40 * s, y - 92 * s, 80 * s, 60 * s, 8 * s), frame, { dx: 6, dy: 0 }) +
  `<rect x="${n1(x - 32 * s)}" y="${n1(y - 85 * s)}" width="${n1(64 * s)}" height="${n1(45 * s)}" rx="${n1(4 * s)}" fill="${screen}" stroke="${INK}" stroke-width="${n1(3 * s)}"/>` +
  [0, 1, 2].map((i) => `<rect x="${n1(x - 26 * s)}" y="${n1(y - (78 - i * 12) * s)}" width="${n1((28 + i * 9) * s)}" height="${n1(4 * s)}" rx="2" fill="${light(screen, 0.55)}" opacity=".85"/>`).join('');
