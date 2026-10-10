// Arène de Lex Luthor : le laboratoire au sommet de la tour LexCorp. Sol technique blanc, baies
// vitrées sur Metropolis, kryptonite sous cloche, armure de combat en vitrine, drones. Pendant le
// boss : lueur verte de kryptonite qui palpite et gyrophares d'alarme.

import { type AnimSpec, type Ctx, type Painter, INK, SW, across, at, cel, circleS, defineMap, flat, gloss, glow, groundShadow, n1, pathS, polyS, rectS, scene, spots } from './kit';
import { monitor } from './dc-kit';

const pal = {
  bg: '#141a2a',
  sky1: '#2a3a5e', sky2: '#6a86b0',
  ground: '#4e5468', ground2: '#474d61',
  path: '#dfe2ea', pathEdge: '#8a90a6', pathDeco: '#7a5ab0',
  frame: '#9aa0b6', frameLight: '#cdd2e2', frameShade: '#6a7088',
  cellA: '#f4f5fa', cellB: '#e2e5ee',
  accent: '#5af06a', portal: '#7a5ab0',
  kryptonite: '#5af06a', purple: '#7a5ab0', steel: '#7a8298', glass: '#9ac0e0', alarm: '#e8413b',
};

// ---------------------------------------------------------------- accessoires

/** Kryptonite sous cloche de verre. */
const kryptoJar: Painter = (x, y, s) =>
  groundShadow(x, y, 34 * s) +
  cel(rectS(x - 32 * s, y - 20 * s, 64 * s, 20 * s, 4), pal.steel, { dx: 0, dy: 6 }) +
  `<circle cx="${n1(x)}" cy="${n1(y - 54 * s)}" r="${n1(46 * s)}" fill="${pal.kryptonite}" opacity=".16"/>` +
  cel(polyS([{ x: x - 14 * s, y: y - 20 * s }, { x: x - 18 * s, y: y - 52 * s }, { x: x - 4 * s, y: y - 80 * s }, { x: x + 8 * s, y: y - 56 * s }, { x: x + 14 * s, y: y - 20 * s }]), pal.kryptonite, { dx: 6, dy: 0 }) +
  `<path d="M${n1(x - 26 * s)} ${n1(y - 20 * s)} L${n1(x - 26 * s)} ${n1(y - 76 * s)} Q${n1(x)} ${n1(y - 106 * s)} ${n1(x + 26 * s)} ${n1(y - 76 * s)} L${n1(x + 26 * s)} ${n1(y - 20 * s)}" fill="${pal.glass}" fill-opacity=".25" stroke="${INK}" stroke-width="${n1(4 * s)}"/>` +
  gloss(x - 16 * s, y - 70 * s, 3 * s, 14 * s, 10, 0.6);

/** Armure de combat de Luthor en vitrine. */
const warsuit: Painter = (x, y, s) =>
  groundShadow(x, y, 44 * s) +
  cel(rectS(x - 40 * s, y - 16 * s, 80 * s, 16 * s, 4), pal.steel, { dx: 0, dy: 5 }) +
  cel(pathS(`M${n1(x - 26 * s)} ${n1(y - 16 * s)} L${n1(x - 20 * s)} ${n1(y - 70 * s)} L${n1(x - 40 * s)} ${n1(y - 120 * s)} Q${n1(x)} ${n1(y - 140 * s)} ${n1(x + 40 * s)} ${n1(y - 120 * s)} L${n1(x + 20 * s)} ${n1(y - 70 * s)} L${n1(x + 26 * s)} ${n1(y - 16 * s)}Z`), pal.purple, { dx: 10, dy: 0 }) +
  cel(pathS(`M${n1(x - 24 * s)} ${n1(y - 120 * s)} L${n1(x)} ${n1(y - 90 * s)} L${n1(x + 24 * s)} ${n1(y - 120 * s)}Z`), '#5aa86a', { dx: 3, dy: 0, sw: SW * 0.7 }) +
  cel(circleS(x, y - 150 * s, 18 * s), pal.purple, { dx: 4, dy: 4 }) +
  `<rect x="${n1(x - 12 * s)}" y="${n1(y - 156 * s)}" width="${n1(24 * s)}" height="${n1(7 * s)}" rx="3" fill="${pal.kryptonite}" stroke="${INK}" stroke-width="${n1(2.5 * s)}"/>`;

const serverRack: Painter = (x, y, s) =>
  groundShadow(x, y, 30 * s) + cel(rectS(x - 26 * s, y - 120 * s, 52 * s, 120 * s, 6 * s), '#3a4058', { dx: 8, dy: 0 }) +
  [0, 1, 2, 3, 4].map((i) => `<rect x="${n1(x - 18 * s)}" y="${n1(y - (108 - i * 20) * s)}" width="${n1(36 * s)}" height="${n1(10 * s)}" rx="2" fill="#5a6280"/><circle cx="${n1(x + 12 * s)}" cy="${n1(y - (103 - i * 20) * s)}" r="${n1(2.5 * s)}" fill="${i % 2 ? pal.kryptonite : '#5ab0f0'}"/>`).join('');

const labCrate: Painter = (x, y, s) =>
  groundShadow(x, y, 30 * s) + cel(rectS(x - 28 * s, y - 40 * s, 56 * s, 40 * s, 6 * s), '#c8ccd8', { dx: 8, dy: 0 }) +
  `<path d="M${n1(x - 20 * s)} ${n1(y - 20 * s)} l${n1(8 * s)} ${n1(-12 * s)} l${n1(8 * s)} ${n1(12 * s)}z" fill="#f2c33c" stroke="${INK}" stroke-width="${n1(2.5 * s)}"/>`;

/** Sortie : porte coulissante blindée au logo. */
const labDoor: Painter = (x, y, s) =>
  groundShadow(x, y, 66 * s) +
  cel(rectS(x - 62 * s, y - 118 * s, 124 * s, 118 * s, 10 * s), pal.steel, { dx: 12, dy: 0 }) +
  flat(rectS(x - 40 * s, y - 92 * s, 38 * s, 92 * s, 3), '#3a4058') + flat(rectS(x + 2 * s, y - 92 * s, 38 * s, 92 * s, 3), '#3a4058') +
  cel(rectS(x - 22 * s, y - 112 * s, 44 * s, 16 * s, 4), pal.purple, { dx: 0, dy: 4, sw: SW * 0.7 }) +
  `<rect x="${n1(x - 44 * s)}" y="${n1(y - 62 * s)}" width="${n1(88 * s)}" height="${n1(6 * s)}" fill="${pal.kryptonite}" opacity=".7"/>`;

// ---------------------------------------------------------------- fond

/** Baie vitrée sur Metropolis, au sommet de la tour. */
function windows(base: number, k: number): string {
  let s = '';
  // ville vue d'en haut
  for (const [x, w, h] of [[0, 90, 120], [100, 70, 170], [190, 110, 90], [320, 80, 200], [420, 120, 130], [560, 90, 180], [660, 100, 110], [780, 80, 210], [880, 120, 140]] as const)
    s += `<rect x="${x}" y="${n1(base - h * k)}" width="${w}" height="${n1(h * k + 20)}" fill="#4a6088" opacity=".85"/>`;
  s += `<circle cx="360" cy="${n1(base - 230 * k)}" r="${n1(26 * Math.max(k, 0.6))}" fill="#f2c33c" opacity=".55"/>`;
  // montants de la baie et reflets
  for (let x = 0; x <= 1000; x += 125) s += cel(rectS(x - 10, -10, 20, base + 20, 2), pal.steel, { dx: 5, dy: 0, sw: SW * 0.7 });
  for (let x = 40; x < 1000; x += 250) s += `<path d="M${x} ${n1(base - 20)} L${x + 60} 0" stroke="#fff" stroke-width="16" opacity=".12"/>`;
  s += cel(rectS(-20, base - 30 * k - 10, 1040, 30 * k + 14, 0), '#c8ccd8', { dx: 0, dy: 8, sw: SW * 0.8 });
  // grand logo lumineux
  s += `<rect x="440" y="${n1(base - 30 * k - 6)}" width="120" height="${n1(22 * k + 4)}" rx="4" fill="${pal.purple}" stroke="${INK}" stroke-width="4"/>`;
  return s;
}

function backdrop(c: Ctx): string {
  const k = c.mode === 'solo' ? 1 : 0.5;
  return scene(c, {
    texture: 'tiles', pad: '#6a7088', padMargin: 0.9,
    horizon: (base) => windows(base, k),
    after: c.mode === 'solo' ? labStrip(c.z.strip.y) : '',
  });
}

/** En Solo : bandes lumineuses au sol, sous le chemin. */
function labStrip(y: number): string {
  return `<rect x="-20" y="${y - 36}" width="1040" height="72" fill="#4a5068" stroke="${INK}" stroke-width="5"/>` +
    `<rect x="-20" y="${y - 4}" width="1040" height="8" fill="${pal.kryptonite}" opacity=".45"/>`;
}

// ---------------------------------------------------------------- animations

const drone = (x: number, y: number) =>
  cel(rectS(x - 22, y - 10, 44, 20, 8), '#c8ccd8', { dx: 0, dy: 4, sw: 4 }) +
  `<path d="M${x - 30} ${y - 14} h18 M${x + 12} ${y - 14} h18" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>` +
  `<circle cx="${x}" cy="${y}" r="5" fill="${pal.alarm}" stroke="${INK}" stroke-width="2"/>`;

function anims(c: Ctx): AnimSpec[] {
  const [a, b, d, e, f] = spots(c);
  const solo = c.mode === 'solo';
  return [
    across('Drones de surveillance', solo ? 214 : 64, 12, (x, y) => drone(x, y - 10), { w: 70, h: 40 }),
    at('Kryptonite qui luit', 'pulse', a, 34, glow(a.x, a.y, 12, pal.kryptonite), { period: 1.8, amp: 0.18 }),
    at('Kryptonite qui luit', 'pulse', b, 34, glow(b.x, b.y, 12, pal.kryptonite), { period: 2.2, amp: 0.18, phase: 0.4 }),
    at('Gyrophares d\'alarme', 'blink', d, 24, glow(d.x, d.y, 9, pal.alarm), { period: 1, min: 0.1 }),
    at('Gyrophares d\'alarme', 'blink', e, 24, glow(e.x, e.y, 9, pal.alarm), { period: 1, min: 0.1, phase: 0.5 }),
    at('Kryptonite qui luit', 'blink', f, 24, glow(f.x, f.y, 8, pal.kryptonite), { period: 2.6, min: 0.3 }),
  ];
}

export const areneLuthor = defineMap({
  id: 'arene-luthor',
  name: 'Tour LexCorp',
  tagline: 'Le laboratoire secret de Lex Luthor, au-dessus de Metropolis.',
  universe: 'boss',
  heroes: [],
  boss: 'luthor',
  shape: 'u',
  pathMaterial: 'Sol technique du laboratoire',
  pathKind: 'slabs',
  frameKind: 'metal',
  palette: pal,
  backdrop,
  props: { big: [warsuit, serverRack, kryptoJar], med: [kryptoJar, monitor(pal.steel, '#5ab0f0'), serverRack], small: [labCrate, labCrate] },
  gate: labDoor,
  anims,
  sound: 'lexcorp-synthes',
  unlock: { type: 'depart', value: 0 },
  bossFx: { description: 'Lueur verte de kryptonite qui palpite sur tout l\'écran, gyrophares d\'alarme rouges.', effects: ['kryptonite-glow', 'alarm'], tint: '#5af06a', tintAlpha: 0.1, colors: { kryptonite: pal.kryptonite, alarm: pal.alarm } },
  mute: { sat: 0.78, lum: 0.9 },
});

export default areneLuthor;
