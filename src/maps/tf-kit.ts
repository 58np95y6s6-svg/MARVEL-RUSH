// Accessoires communs aux maps et arènes de l'extension Transformers (Cybertron, la Terre, les Decepticons) :
// cristaux d'énergon, tours de métal, écrans, insignes, épaves de véhicules, tourelles.

import { type Painter, INK, SW, cel, circleS, flat, gloss, groundShadow, n1, pathS, polyS, rectS } from './kit';

/** Cristaux d'énergon (bleu-cyan lumineux). */
export const energon = (c = '#5ad8ff'): Painter => (x, y, s) =>
  groundShadow(x, y, 30 * s) +
  `<circle cx="${n1(x)}" cy="${n1(y - 36 * s)}" r="${n1(40 * s)}" fill="${c}" opacity=".14"/>` +
  cel(polyS([{ x: x - 16 * s, y }, { x: x - 22 * s, y: y - 44 * s }, { x: x - 4 * s, y: y - 80 * s }, { x: x + 12 * s, y: y - 52 * s }, { x: x + 10 * s, y }]), c, { dx: 6, dy: 0 }) +
  cel(polyS([{ x: x + 6 * s, y }, { x: x + 20 * s, y: y - 40 * s }, { x: x + 34 * s, y: y - 30 * s }, { x: x + 30 * s, y }]), c, { dx: 4, dy: 0 }) +
  gloss(x - 8 * s, y - 50 * s, 3 * s, 12 * s, 10, 0.7);

/** Pylône de métal cybertronien à bandes lumineuses. */
export const pylon = (c: string, lit: string): Painter => (x, y, s) =>
  groundShadow(x, y, 30 * s) +
  cel(pathS(`M${n1(x - 24 * s)} ${n1(y)} L${n1(x - 14 * s)} ${n1(y - 130 * s)} L${n1(x + 14 * s)} ${n1(y - 130 * s)} L${n1(x + 24 * s)} ${n1(y)}Z`), c, { dx: 8, dy: 0 }) +
  [0, 1, 2].map((i) => `<rect x="${n1(x - 12 * s)}" y="${n1(y - (110 - i * 34) * s)}" width="${n1(24 * s)}" height="${n1(6 * s)}" rx="2" fill="${lit}"/>`).join('') +
  cel(circleS(x, y - 138 * s, 10 * s), lit, { dx: 2, dy: 2, sw: SW * 0.7 });

/** Écran de contrôle sur pied. */
export const console_ = (c: string, screen: string): Painter => (x, y, s) =>
  groundShadow(x, y, 34 * s) + cel(rectS(x - 30 * s, y - 40 * s, 60 * s, 40 * s, 6 * s), c, { dx: 8, dy: 0 }) +
  cel(rectS(x - 26 * s, y - 86 * s, 52 * s, 40 * s, 6 * s), c, { dx: 4, dy: 0 }) +
  `<rect x="${n1(x - 20 * s)}" y="${n1(y - 80 * s)}" width="${n1(40 * s)}" height="${n1(28 * s)}" rx="3" fill="${screen}" stroke="${INK}" stroke-width="${n1(3 * s)}"/>` +
  `<path d="M${n1(x - 14 * s)} ${n1(y - 66 * s)} l${n1(8 * s)} ${n1(-6 * s)} l${n1(8 * s)} ${n1(8 * s)} l${n1(10 * s)} ${n1(-10 * s)}" stroke="#fff" stroke-width="${n1(2.5 * s)}" fill="none"/>`;

/** Insigne Autobot (ou Decepticon) sur un panneau. */
export const emblem = (c: string, panel: string, deceptive = false): Painter => (x, y, s) => {
  const d = deceptive
    ? 'M0 -14 L6 -4 L15 -15 L13 2 L7 6 L4 15 L0 11 L-4 15 L-7 6 L-13 2 L-15 -15 L-6 -4Z'
    : 'M0 -15 L5 -11 L13 -14 L14 -4 L9 4 L11 13 L5 15 L0 10 L-5 15 L-11 13 L-9 4 L-14 -4 L-13 -14 L-5 -11Z';
  return groundShadow(x, y, 30 * s) + flat(rectS(x - 5 * s, y - 70 * s, 10 * s, 70 * s, 3), '#4a4f66', SW * 0.7) +
    cel(rectS(x - 32 * s, y - 120 * s, 64 * s, 56 * s, 10 * s), panel, { dx: 6, dy: 0 }) +
    `<path d="${d}" transform="translate(${n1(x)} ${n1(y - 92 * s)}) scale(${n1(1.5 * s)})" fill="${c}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`;
};

/** Épave de voiture (Mission City). */
export const wreck = (c: string): Painter => (x, y, s) =>
  groundShadow(x, y, 50 * s) +
  cel(pathS(`M${n1(x - 48 * s)} ${n1(y)} L${n1(x - 44 * s)} ${n1(y - 22 * s)} L${n1(x - 20 * s)} ${n1(y - 28 * s)} L${n1(x - 8 * s)} ${n1(y - 46 * s)} L${n1(x + 26 * s)} ${n1(y - 44 * s)} L${n1(x + 40 * s)} ${n1(y - 22 * s)} L${n1(x + 50 * s)} ${n1(y - 16 * s)} L${n1(x + 48 * s)} ${n1(y)}Z`), c, { dx: 8, dy: 0 }) +
  `<path d="M${n1(x - 4 * s)} ${n1(y - 40 * s)} L${n1(x + 22 * s)} ${n1(y - 38 * s)} L${n1(x + 30 * s)} ${n1(y - 24 * s)} L${n1(x - 10 * s)} ${n1(y - 24 * s)}Z" fill="#8fb8d8" stroke="${INK}" stroke-width="${n1(3 * s)}"/>` +
  flat(circleS(x - 26 * s, y, 10 * s), '#2b2540', 3) + flat(circleS(x + 28 * s, y, 10 * s), '#2b2540', 3) +
  `<circle cx="${n1(x + 10 * s)}" cy="${n1(y - 60 * s)}" r="${n1(10 * s)}" fill="#7a7a8a" opacity=".5"/>`;

/** Bloc de béton / bidon. */
export const barrel = (c: string): Painter => (x, y, s) =>
  groundShadow(x, y, 20 * s) + cel(rectS(x - 16 * s, y - 40 * s, 32 * s, 40 * s, 6 * s), c, { dx: 6, dy: 0 }) +
  `<path d="M${n1(x - 16 * s)} ${n1(y - 26 * s)} H${n1(x + 16 * s)} M${n1(x - 16 * s)} ${n1(y - 12 * s)} H${n1(x + 16 * s)}" stroke="${INK}" stroke-width="${n1(2.5 * s)}" opacity=".5"/>`;

/** Porte de sortie : sas métallique à deux battants. */
export const blastDoor = (c: string, light: string): Painter => (x, y, s) =>
  groundShadow(x, y, 66 * s) +
  cel(rectS(x - 62 * s, y - 120 * s, 124 * s, 120 * s, 12 * s), c, { dx: 12, dy: 0 }) +
  flat(polyS([{ x: x - 44 * s, y }, { x: x - 44 * s, y: y - 92 * s }, { x: x, y: y - 100 * s }, { x: x, y }]), '#3a4058') +
  flat(polyS([{ x: x + 44 * s, y }, { x: x + 44 * s, y: y - 92 * s }, { x: x, y: y - 100 * s }, { x: x, y }]), '#4a5068') +
  `<rect x="${n1(x - 30 * s)}" y="${n1(y - 114 * s)}" width="${n1(60 * s)}" height="${n1(8 * s)}" rx="3" fill="${light}" stroke="${INK}" stroke-width="${n1(2.5 * s)}"/>`;

/** Tourelle Decepticon. */
export const turret = (c: string, lit: string): Painter => (x, y, s) =>
  groundShadow(x, y, 34 * s) + cel(rectS(x - 30 * s, y - 34 * s, 60 * s, 34 * s, 6 * s), c, { dx: 8, dy: 0 }) +
  cel(circleS(x, y - 44 * s, 22 * s), c, { dx: 5, dy: 5 }) +
  flat(rectS(x + 6 * s, y - 52 * s, 48 * s, 12 * s, 4), '#3a3550', SW * 0.7) +
  `<circle cx="${n1(x)}" cy="${n1(y - 46 * s)}" r="${n1(7 * s)}" fill="${lit}" stroke="${INK}" stroke-width="${n1(2.5 * s)}"/>`;
