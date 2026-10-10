// Arène de Darkseid : Apokolips, la planète-forge. Ciel rouge de fumée, forteresse colossale frappée
// du symbole Oméga, fosses de feu, rivières de lave, Parademons dans le ciel. L'arène la plus
// impressionnante de l'extension. Pendant le boss : rayons Oméga, fosses de feu qui grondent, ciel
// rouge et tremblements.

import { type AnimSpec, type Ctx, type Painter, INK, SW, across, at, cel, circleS, defineMap, glow, groundShadow, light, n1, pathS, polyS, rectS, scene, spots } from './kit';
import { flame, shardRock } from './dc-kit';

const pal = {
  bg: '#140806',
  sky1: '#2a0a0a', sky2: '#a8341e',
  ground: '#3a2a2a', ground2: '#322424',
  path: '#8a7672', pathEdge: '#4a3634', pathDeco: '#ff7a2a',
  frame: '#5a4a4a', frameLight: '#86706c', frameShade: '#3a2c2c',
  cellA: '#f4eeec', cellB: '#e4dad6',
  accent: '#ff3a2a', portal: '#ff5a2a',
  fortress: '#2a2022', fortress2: '#3a2c2e', lava: '#ff7a2a', fire: '#ffb03a', omega: '#ff3a2a', iron: '#5a4c50',
};

// ---------------------------------------------------------------- accessoires

/** Fosse de feu : cuve de fer, flammes et lueur. */
const firePit: Painter = (x, y, s) =>
  `<ellipse cx="${n1(x)}" cy="${n1(y - 20 * s)}" rx="${n1(80 * s)}" ry="${n1(46 * s)}" fill="${pal.lava}" opacity=".16"/>` +
  groundShadow(x, y, 54 * s) +
  cel(pathS(`M${n1(x - 52 * s)} ${n1(y - 30 * s)} L${n1(x - 42 * s)} ${n1(y)} L${n1(x + 42 * s)} ${n1(y)} L${n1(x + 52 * s)} ${n1(y - 30 * s)}Z`), pal.iron, { dx: 10, dy: 0 }) +
  `<ellipse cx="${n1(x)}" cy="${n1(y - 30 * s)}" rx="${n1(52 * s)}" ry="${n1(12 * s)}" fill="${pal.lava}" stroke="${INK}" stroke-width="${n1(5 * s)}"/>` +
  flame(x - 22 * s, y - 32 * s, 0.9 * s, pal.fire) + flame(x + 20 * s, y - 32 * s, 0.8 * s, pal.fire) + flame(x, y - 36 * s, 1.3 * s, pal.lava) +
  [-36, 36].map((d) => `<path d="M${n1(x + d * s)} ${n1(y - 26 * s)} l${n1(-6 * s)} ${n1(-16 * s)} l${n1(12 * s)} 0z" fill="${pal.iron}" stroke="${INK}" stroke-width="${n1(3 * s)}"/>`).join('');

/** Pylône à pointes. */
const spikePylon: Painter = (x, y, s) =>
  groundShadow(x, y, 30 * s) +
  cel(polyS([{ x: x - 24 * s, y }, { x: x - 16 * s, y: y - 140 * s }, { x, y: y - 180 * s }, { x: x + 16 * s, y: y - 140 * s }, { x: x + 24 * s, y }]), pal.fortress2, { dx: 9, dy: 0 }) +
  [40, 80, 120].map((d) => `<path d="M${n1(x - 18 * s)} ${n1(y - d * s)} l${n1(-16 * s)} ${n1(-8 * s)} l${n1(16 * s)} ${n1(-6 * s)}Z M${n1(x + 18 * s)} ${n1(y - d * s)} l${n1(16 * s)} ${n1(-8 * s)} l${n1(-16 * s)} ${n1(-6 * s)}Z" fill="${pal.iron}" stroke="${INK}" stroke-width="${n1(3 * s)}" stroke-linejoin="round"/>`).join('') +
  `<rect x="${n1(x - 5 * s)}" y="${n1(y - 110 * s)}" width="${n1(10 * s)}" height="${n1(40 * s)}" rx="${n1(4 * s)}" fill="${pal.lava}" stroke="${INK}" stroke-width="${n1(3 * s)}"/>`;

/** Statue de Parademon. */
const parademonStatue: Painter = (x, y, s) =>
  groundShadow(x, y, 40 * s) + cel(rectS(x - 30 * s, y - 24 * s, 60 * s, 24 * s, 3), pal.iron, { dx: 0, dy: 6 }) +
  cel(pathS(`M${n1(x - 8 * s)} ${n1(y - 60 * s)} Q${n1(x - 70 * s)} ${n1(y - 110 * s)} ${n1(x - 60 * s)} ${n1(y - 150 * s)} Q${n1(x - 40 * s)} ${n1(y - 110 * s)} ${n1(x - 6 * s)} ${n1(y - 96 * s)}Z`), pal.fortress2, { dx: 6, dy: 0 }) +
  cel(pathS(`M${n1(x + 8 * s)} ${n1(y - 60 * s)} Q${n1(x + 70 * s)} ${n1(y - 110 * s)} ${n1(x + 60 * s)} ${n1(y - 150 * s)} Q${n1(x + 40 * s)} ${n1(y - 110 * s)} ${n1(x + 6 * s)} ${n1(y - 96 * s)}Z`), pal.fortress2, { dx: 6, dy: 0 }) +
  cel(pathS(`M${n1(x - 18 * s)} ${n1(y - 24 * s)} L${n1(x - 16 * s)} ${n1(y - 100 * s)} Q${n1(x)} ${n1(y - 110 * s)} ${n1(x + 16 * s)} ${n1(y - 100 * s)} L${n1(x + 18 * s)} ${n1(y - 24 * s)}Z`), pal.iron, { dx: 6, dy: 0 }) +
  cel(circleS(x, y - 116 * s, 14 * s), pal.iron, { dx: 3, dy: 3 }) +
  `<circle cx="${n1(x - 5 * s)}" cy="${n1(y - 118 * s)}" r="${n1(3 * s)}" fill="${pal.omega}"/><circle cx="${n1(x + 5 * s)}" cy="${n1(y - 118 * s)}" r="${n1(3 * s)}" fill="${pal.omega}"/>`;

/** Symbole Oméga (Ω), centré, rayon r. */
const omega = (x: number, y: number, r: number, col: string, w: number) => {
  const d = `M${n1(x - r)} ${n1(y + r)} L${n1(x - r * 0.4)} ${n1(y + r)} L${n1(x - r * 0.45)} ${n1(y + r * 0.62)} A${n1(r * 0.82)} ${n1(r * 0.82)} 0 1 1 ${n1(x + r * 0.45)} ${n1(y + r * 0.62)} L${n1(x + r * 0.4)} ${n1(y + r)} L${n1(x + r)} ${n1(y + r)}`;
  return `<path d="${d}" stroke="${INK}" stroke-width="${n1(w + 8)}" fill="none" stroke-linejoin="round"/><path d="${d}" stroke="${col}" stroke-width="${n1(w)}" fill="none" stroke-linejoin="round"/>`;
};

/** Sortie : tube boom (portail en anneau de fer). */
const boomGate: Painter = (x, y, s) =>
  groundShadow(x, y, 70 * s) +
  cel(rectS(x - 70 * s, y - 120 * s, 140 * s, 120 * s, 6 * s), pal.fortress2, { dx: 12, dy: 0 }) +
  `<circle cx="${n1(x)}" cy="${n1(y - 58 * s)}" r="${n1(42 * s)}" fill="#1a0806" stroke="${INK}" stroke-width="${n1(6 * s)}"/>` +
  `<circle cx="${n1(x)}" cy="${n1(y - 58 * s)}" r="${n1(28 * s)}" fill="none" stroke="${pal.lava}" stroke-width="${n1(5 * s)}" opacity=".8"/>` +
  omega(x, y - 108 * s, 9 * s, pal.omega, 4 * s);

// ---------------------------------------------------------------- fond

/** Centre et rayon du symbole Oméga sur le donjon (assez bas pour rester visible sous le HUD en Solo). */
const omegaSpot = (k: number, base: number) => (k === 1 ? { y: 165, r: 44 } : { y: base - 230 * k * 0.55, r: 54 * 0.55 });

function fortress(base: number, k: number): string {
  let s = '';
  // colonnes de fumée et lueur des forges
  for (const x of [80, 300, 720, 930]) s += `<path d="M${x - 30} ${base} Q${x - 50} ${n1(base - 150 * k)} ${x} ${n1(base - 260 * k)} Q${x + 40} ${n1(base - 340 * k)} ${x + 10} -20 L${x + 80} -20 Q${x + 90} ${n1(base - 200 * k)} ${x + 30} ${base}Z" fill="#1a0a0a" opacity=".45"/>`;
  s += `<ellipse cx="500" cy="${base}" rx="560" ry="${n1(90 * k + 20)}" fill="${pal.lava}" opacity=".25"/>`;
  // tours latérales
  const tower = (x: number, w: number, h: number, col: string) =>
    cel(polyS([{ x: x - w / 2, y: base + 10 }, { x: x - w * 0.36, y: base - h * k }, { x: x - w * 0.12, y: base - (h + 40) * k }, { x: x + w * 0.12, y: base - (h + 40) * k }, { x: x + w * 0.36, y: base - h * k }, { x: x + w / 2, y: base + 10 }]), col, { dx: w * 0.15, dy: 0, sw: SW * 0.8 }) +
    Array.from({ length: 3 }, (_, i) => `<rect x="${x - 6}" y="${n1(base - (h - 30 - i * 40) * k)}" width="12" height="${n1(16 * k + 4)}" rx="3" fill="${pal.lava}" opacity=".8"/>`).join('');
  s += tower(60, 110, 170, pal.fortress) + tower(190, 80, 120, pal.fortress2) + tower(810, 80, 130, pal.fortress2) + tower(940, 110, 180, pal.fortress);
  // donjon central avec le symbole Oméga
  const w = 300, h = 230 * k;
  s += cel(polyS([{ x: 500 - w / 2, y: base + 10 }, { x: 500 - w * 0.38, y: base - h }, { x: 500 - w * 0.2, y: base - h - 40 * k }, { x: 500 + w * 0.2, y: base - h - 40 * k }, { x: 500 + w * 0.38, y: base - h }, { x: 500 + w / 2, y: base + 10 }]), pal.fortress, { dx: 40, dy: 0, sw: SW * 0.9 });
  const o = omegaSpot(k, base);
  s += `<circle cx="500" cy="${n1(o.y)}" r="${n1(o.r * 1.5)}" fill="${pal.omega}" opacity=".18"/>`;
  s += omega(500, o.y, o.r, pal.omega, 16 * Math.max(k, 0.6));
  // rempart avec créneaux
  s += cel(rectS(-20, base - 40 * k, 1040, 40 * k + 20, 0), pal.fortress2, { dx: 0, dy: 10, sw: SW * 0.8 });
  for (let x = -10; x < 1000; x += 64) s += cel(rectS(x, base - 40 * k - 18, 34, 22, 3), pal.fortress2, { dx: 0, dy: 6, sw: SW * 0.6 });
  // coulées de lave sur le rempart
  for (const x of [130, 370, 640, 880]) s += `<path d="M${x} ${n1(base - 38 * k)} q-8 ${n1(20 * k)} 4 ${n1(40 * k)} l10 0 q-6 ${n1(-20 * k)} 0 ${n1(-40 * k)}z" fill="${pal.lava}" stroke="${INK}" stroke-width="3"/>`;
  return s;
}

/** Texture de basalte : fissures de lave au sol, hors du chemin et des plateaux (sous la dalle). */
function cracks(c: Ctx): string {
  let s = '';
  for (let i = 0; i < 26; i++) {
    const x = c.rnd() * 1000, y = 320 + c.rnd() * 1260, l = 30 + c.rnd() * 40;
    s += `<path d="M${n1(x)} ${n1(y)} l${n1(l * 0.4)} ${n1(-8)} l${n1(l * 0.3)} ${n1(10)} l${n1(l * 0.3)} ${n1(-6)}" stroke="${pal.lava}" stroke-width="5" fill="none" opacity=".45" stroke-linecap="round"/>`;
  }
  return s;
}

function backdrop(c: Ctx): string {
  const k = c.mode === 'solo' ? 1 : 0.5;
  const pre = cracks(c);
  return scene(c, {
    texture: 'spots', pad: '#4a3836', padMargin: 0.9,
    horizon: (base) => fortress(base, k) + pre,
    after: c.mode === 'solo' ? lavaRiver(c.z.strip.y) : '',
  });
}

function lavaRiver(y: number): string {
  return cel(pathS(`M-20 ${y - 30} Q250 ${y - 50} 500 ${y - 26} Q760 ${y - 6} 1020 ${y - 34} L1020 ${y + 36} Q760 ${y + 50} 500 ${y + 30} Q250 ${y + 14} -20 ${y + 40}Z`), pal.lava, { dx: 0, dy: 10, sw: SW * 0.8, shadow: '#c83a1a' }) +
    `<path d="M-20 ${y + 2} Q250 ${y - 14} 500 ${y + 4} T1020 ${y - 2}" stroke="${pal.fire}" stroke-width="8" fill="none" opacity=".8"/>`;
}

// ---------------------------------------------------------------- animations

const parademon = (x: number, y: number) =>
  `<path d="M${x} ${y} Q${x - 22} ${y - 22} ${x - 40} ${y - 12} Q${x - 26} ${y - 6} ${x - 24} ${y + 6} Q${x - 12} ${y - 2} ${x} ${y + 4} Q${x + 12} ${y - 2} ${x + 24} ${y + 6} Q${x + 26} ${y - 6} ${x + 40} ${y - 12} Q${x + 22} ${y - 22} ${x} ${y}Z" fill="#3a2c2e" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>` +
  `<circle cx="${x}" cy="${y - 2}" r="7" fill="${pal.iron}" stroke="${INK}" stroke-width="3"/><circle cx="${x - 2}" cy="${y - 3}" r="1.8" fill="${pal.omega}"/><circle cx="${x + 2}" cy="${y - 3}" r="1.8" fill="${pal.omega}"/>`;

function anims(c: Ctx): AnimSpec[] {
  const [a, b, d, e, f] = spots(c);
  const solo = c.mode === 'solo';
  const k = solo ? 1 : 0.5, base = solo ? 270 : 118, { y: oy, r } = omegaSpot(k, base);
  const pit = (p: { x: number; y: number }, s: number) => flame(p.x, p.y + 18 * s, s, pal.lava) + flame(p.x, p.y + 14 * s, s * 0.55, pal.fire);
  return [
    at('Symbole Oméga', 'blink', { x: 500, y: oy }, r * 1.6, `<circle cx="500" cy="${n1(oy)}" r="${n1(r * 1.5)}" fill="${pal.omega}" opacity=".35"/>` + omega(500, oy, r, light(pal.omega, 0.35), 16 * Math.max(k, 0.6)), { period: 2.4, min: 0.15 }),
    across('Parademons', solo ? 204 : 70, 7, (x, y) => parademon(x, y) + parademon(x + 50, y + 18), { w: 130, h: 50 }),
    across('Parademons', solo ? 150 : 40, 11, (x, y) => parademon(x, y), { w: 90, h: 40 }, { reverse: true, phase: 0.4 }),
    at('Fosses de feu', 'pulse', a, 34, pit(a, 0.9), { period: 0.8, amp: 0.1, oy: a.y + 18 }),
    at('Fosses de feu', 'pulse', b, 34, pit(b, 0.9), { period: 0.9, amp: 0.1, oy: b.y + 18, phase: 0.3 }),
    at('Fosses de feu', 'pulse', d, 32, pit(d, 0.8), { period: 0.7, amp: 0.1, oy: d.y + 16, phase: 0.6 }),
    at('Symbole Oméga', 'blink', e, 24, glow(e.x, e.y, 9, pal.omega), { period: 1.8, min: 0.2 }),
    at('Fosses de feu', 'blink', f, 24, glow(f.x, f.y, 9, pal.fire), { period: 1.2, min: 0.3 }),
    ...(solo ? [{ label: 'Fosses de feu', kind: 'blink' as const, period: 1.6, min: 0.4, box: { x: 0, y: c.z.strip.y - 30, w: 1000, h: 50 }, markup: `<path d="M-20 ${c.z.strip.y + 2} Q250 ${c.z.strip.y - 14} 500 ${c.z.strip.y + 4} T1020 ${c.z.strip.y - 2}" stroke="#ffe08a" stroke-width="6" fill="none" opacity=".8"/>` }] : []),
  ];
}

export const areneDarkseid = defineMap({
  id: 'arene-darkseid',
  name: 'Apokolips',
  tagline: 'La planète-forge de Darkseid, sous le signe de l\'Oméga.',
  universe: 'boss',
  heroes: [],
  boss: 'darkseid',
  shape: 'u',
  pathMaterial: 'Basalte fendu de lave',
  pathKind: 'basalt',
  frameKind: 'obsidian',
  palette: pal,
  backdrop,
  props: { big: [firePit, spikePylon, parademonStatue], med: [firePit, spikePylon, shardRock(pal.fortress2)], small: [shardRock(pal.iron), shardRock(pal.fortress2)] },
  gate: boomGate,
  anims,
  sound: 'apokolips-forge',
  unlock: { type: 'depart', value: 0 },
  bossFx: {
    description: 'Ciel rouge sang, rayons Oméga qui zèbrent le fond, fosses de feu qui grondent et écran qui tremble.',
    effects: ['red-sky', 'omega-beams', 'fire-pits', 'shake'],
    tint: '#c0263a', tintAlpha: 0.18,
    colors: { omega: pal.omega, lava: pal.lava, fire: pal.fire },
  },
  mute: { sat: 0.82, lum: 0.9 },
});

export default areneDarkseid;
