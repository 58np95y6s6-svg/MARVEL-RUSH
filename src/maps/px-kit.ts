// Accessoires communs aux maps et arènes de l'extension Pixar : immeubles de Metroville, portes de placard de
// Monstropolis, bonbonnes de cris, maison aux ballons, tepuys, fusées et cratères de la planète Z.

import { type Painter, INK, SW, cel, circleS, ellS, flat, gloss, groundShadow, n1, pathS, polyS, rectS } from './kit';

/** Immeuble à fenêtres (Metroville). */
export const building = (c: string, win = '#ffe9a0', floors = 4): Painter => (x, y, s) => {
  const w = 70 * s, h = (34 * floors + 20) * s;
  let o = groundShadow(x, y, 44 * s) + cel(rectS(x - w / 2, y - h, w, h, 4 * s), c, { dx: 10, dy: 0 });
  for (let f = 0; f < floors; f++)
    for (const dx of [-20, 4]) o += `<rect x="${n1(x + dx * s)}" y="${n1(y - h + (14 + f * 34) * s)}" width="${n1(16 * s)}" height="${n1(20 * s)}" rx="2" fill="${win}" stroke="${INK}" stroke-width="${n1(2.5 * s)}"/>`;
  return o + cel(rectS(x - w / 2 - 4 * s, y - h - 8 * s, w + 8 * s, 10 * s, 3), c, { dx: 4, dy: 0 });
};

/** Réverbère. */
export const streetLamp = (c: string, lit = '#ffe27a'): Painter => (x, y, s) =>
  groundShadow(x, y, 16 * s) + flat(rectS(x - 4 * s, y - 110 * s, 8 * s, 110 * s, 3), c, SW * 0.7) +
  flat(pathS(`M${n1(x)} ${n1(y - 108 * s)} Q${n1(x + 20 * s)} ${n1(y - 124 * s)} ${n1(x + 30 * s)} ${n1(y - 108 * s)}`), 'none', SW * 0.7) +
  `<circle cx="${n1(x + 30 * s)}" cy="${n1(y - 100 * s)}" r="${n1(18 * s)}" fill="${lit}" opacity=".3"/>` + cel(ellS(x + 30 * s, y - 102 * s, 9 * s, 7 * s), lit, { dx: 2, dy: 2 });

/** Bouche d'incendie. */
export const hydrant = (c = '#d8322c'): Painter => (x, y, s) =>
  groundShadow(x, y, 16 * s) + cel(rectS(x - 10 * s, y - 34 * s, 20 * s, 34 * s, 6 * s), c, { dx: 4, dy: 0 }) +
  cel(rectS(x - 16 * s, y - 26 * s, 32 * s, 8 * s, 3), c, { dx: 2, dy: 0 }) + cel(circleS(x, y - 38 * s, 8 * s), c);

/** Porte de placard de Monstropolis sur son rail (porte colorée, voyant rouge). */
export const closetDoor = (c: string, lit = '#ff3b3b'): Painter => (x, y, s) =>
  groundShadow(x, y, 34 * s) + flat(rectS(x - 36 * s, y - 128 * s, 72 * s, 10 * s, 3), '#6a6a80', SW * 0.7) +
  cel(rectS(x - 28 * s, y - 116 * s, 56 * s, 116 * s, 4 * s), c, { dx: 8, dy: 0 }) +
  `<rect x="${n1(x - 20 * s)}" y="${n1(y - 106 * s)}" width="${n1(40 * s)}" height="${n1(40 * s)}" rx="3" fill="none" stroke="${INK}" stroke-width="${n1(2.5 * s)}" opacity=".4"/>` +
  `<circle cx="${n1(x + 16 * s)}" cy="${n1(y - 56 * s)}" r="${n1(4 * s)}" fill="#f6c83a" stroke="${INK}" stroke-width="2"/>` +
  `<circle cx="${n1(x)}" cy="${n1(y - 136 * s)}" r="${n1(7 * s)}" fill="${lit}" stroke="${INK}" stroke-width="3"/>`;

/** Bonbonne de cris (jaune, bouchon gris). */
export const screamCan = (c = '#f6c83a'): Painter => (x, y, s) =>
  groundShadow(x, y, 18 * s) + cel(rectS(x - 14 * s, y - 50 * s, 28 * s, 50 * s, 8 * s), c, { dx: 6, dy: 0 }) +
  cel(rectS(x - 10 * s, y - 60 * s, 20 * s, 12 * s, 3), '#8a8aa0', { dx: 3, dy: 0 }) +
  `<rect x="${n1(x - 14 * s)}" y="${n1(y - 30 * s)}" width="${n1(28 * s)}" height="${n1(8 * s)}" fill="#5ab8ff" stroke="${INK}" stroke-width="2"/>`;

/** Tepuy (mesa au sommet plat) avec une cascade. */
export const tepui = (c: string, water = '#8ad8ff'): Painter => (x, y, s) =>
  groundShadow(x, y, 60 * s) + cel(pathS(`M${n1(x - 60 * s)} ${n1(y)} L${n1(x - 44 * s)} ${n1(y - 130 * s)} Q${n1(x)} ${n1(y - 140 * s)} ${n1(x + 46 * s)} ${n1(y - 128 * s)} L${n1(x + 60 * s)} ${n1(y)}Z`), c, { dx: 12, dy: 0 }) +
  `<path d="M${n1(x - 44 * s)} ${n1(y - 130 * s)} Q${n1(x)} ${n1(y - 146 * s)} ${n1(x + 46 * s)} ${n1(y - 128 * s)}" stroke="#5aa83a" stroke-width="${n1(10 * s)}" fill="none" stroke-linecap="round"/>` +
  `<rect x="${n1(x + 10 * s)}" y="${n1(y - 128 * s)}" width="${n1(12 * s)}" height="${n1(128 * s)}" fill="${water}" opacity=".85" stroke="${INK}" stroke-width="2"/>`;

/** Maison aux ballons (la maison de Carl). */
export const balloonHouse = (wall = '#d8a07a', roof = '#7a5aa8'): Painter => (x, y, s) => {
  const cols = ['#ff5a6a', '#ffd23f', '#5ab8ff', '#7ad86a', '#c88aff', '#ff9a3a'];
  let o = groundShadow(x, y, 46 * s);
  for (let i = 0; i < 14; i++) {
    const a = i * 2.4, r = 22 + (i % 4) * 10;
    const bx = x + Math.cos(a) * r * s, by = y - 170 * s - Math.abs(Math.sin(a)) * r * s;
    o += `<path d="M${n1(x)} ${n1(y - 96 * s)} L${n1(bx)} ${n1(by + 8 * s)}" stroke="#fff" stroke-width="1.2" opacity=".8"/>`;
    o += `<ellipse cx="${n1(bx)}" cy="${n1(by)}" rx="${n1(9 * s)}" ry="${n1(11 * s)}" fill="${cols[i % 6]}" stroke="${INK}" stroke-width="2"/>`;
  }
  o += cel(rectS(x - 36 * s, y - 60 * s, 72 * s, 60 * s, 3), wall, { dx: 8, dy: 0 });
  o += cel(polyS([{ x: x - 44 * s, y: y - 58 * s }, { x, y: y - 100 * s }, { x: x + 44 * s, y: y - 58 * s }]), roof, { dx: 6, dy: 0 });
  o += `<rect x="${n1(x - 8 * s)}" y="${n1(y - 30 * s)}" width="${n1(16 * s)}" height="${n1(30 * s)}" fill="#7a4a2a" stroke="${INK}" stroke-width="2.5"/><rect x="${n1(x - 28 * s)}" y="${n1(y - 50 * s)}" width="${n1(14 * s)}" height="${n1(14 * s)}" fill="#bfe6ff" stroke="${INK}" stroke-width="2.5"/>`;
  return o;
};

/** Fusée / tourelle de la planète Z. */
export const rocket = (c: string, fin = '#d8322c'): Painter => (x, y, s) =>
  groundShadow(x, y, 26 * s) + cel(pathS(`M${n1(x - 16 * s)} ${n1(y - 10 * s)} L${n1(x - 16 * s)} ${n1(y - 90 * s)} Q${n1(x)} ${n1(y - 130 * s)} ${n1(x + 16 * s)} ${n1(y - 90 * s)} L${n1(x + 16 * s)} ${n1(y - 10 * s)}Z`), c, { dx: 6, dy: 0 }) +
  cel(polyS([{ x: x - 16 * s, y: y - 40 * s }, { x: x - 32 * s, y }, { x: x - 16 * s, y: y - 10 * s }]), fin, { dx: 2, dy: 0 }) +
  cel(polyS([{ x: x + 16 * s, y: y - 40 * s }, { x: x + 32 * s, y }, { x: x + 16 * s, y: y - 10 * s }]), fin, { dx: 2, dy: 0 }) +
  `<circle cx="${n1(x)}" cy="${n1(y - 76 * s)}" r="${n1(8 * s)}" fill="#bfe6ff" stroke="${INK}" stroke-width="3"/>` + gloss(x - 8 * s, y - 92 * s, 3 * s, 10 * s, 0, 0.5);

/** Cratère lumineux. */
export const crater = (c: string, lit: string): Painter => (x, y, s) =>
  cel(ellS(x, y - 8 * s, 40 * s, 14 * s), c, { dx: 0, dy: -4 }) + `<ellipse cx="${n1(x)}" cy="${n1(y - 8 * s)}" rx="${n1(24 * s)}" ry="${n1(7 * s)}" fill="${lit}" opacity=".6"/>`;

/** Bloc de jouet (cube à lettre). */
export const toyBlock = (c: string, letter = 'A'): Painter => (x, y, s) =>
  groundShadow(x, y, 26 * s) + cel(rectS(x - 24 * s, y - 48 * s, 48 * s, 48 * s, 6 * s), c, { dx: 8, dy: 0 }) +
  `<text x="${n1(x)}" y="${n1(y - 14 * s)}" text-anchor="middle" font-family="'Lilita One',sans-serif" font-size="${n1(32 * s)}" fill="#fff" stroke="${INK}" stroke-width="${n1(3 * s)}" paint-order="stroke">${letter}</text>`;

/** Porte de sortie ronde en coffre-fort (repère des méchants). */
export const vaultGate = (c: string, light: string): Painter => (x, y, s) =>
  groundShadow(x, y, 66 * s) + cel(rectS(x - 62 * s, y - 120 * s, 124 * s, 120 * s, 16 * s), c, { dx: 12, dy: 0 }) +
  cel(circleS(x, y - 58 * s, 42 * s), '#3a3a50', { dx: 4, dy: 4 }) +
  `<circle cx="${n1(x)}" cy="${n1(y - 58 * s)}" r="${n1(14 * s)}" fill="${light}" stroke="${INK}" stroke-width="3"/>` +
  [0, 1, 2, 3].map((i) => `<path d="M${n1(x)} ${n1(y - 58 * s)} l${n1(Math.cos(i * 1.57) * 34 * s)} ${n1(Math.sin(i * 1.57) * 34 * s)}" stroke="${INK}" stroke-width="${n1(5 * s)}"/>`).join('');
