// Royaume des morts (Coco) : pont de pétales de souci, ville colorée la nuit, alebrijes
// lumineux, guirlandes de papel picado.

import {
  type Ctx, type Painter, INK, SW, across, at, cel, circleS, defineMap, flat, gloss, glow, groundShadow, n1, pathS,
  rectS, scene, spots, stars,
} from './kit';

const pal = {
  bg: '#1a1030',
  sky1: '#1f1442', sky2: '#5a2f6e',
  ground: '#3e2a5e', ground2: '#4a3370',
  path: '#f0973a', pathEdge: '#a8551e', pathDeco: '#ffd06a',
  frame: '#4f9a9a', frameLight: '#86d0c6', frameShade: '#2f6468',
  cellA: '#f6f0f8', cellB: '#e8dcef',
  accent: '#f0973a', portal: '#ff7ac0',
  pink: '#e8609a', teal: '#4fc0b0', yellow: '#f2c94a', purple: '#8a5ad0', marigold: '#f39a2e',
};

const marigoldPot: Painter = (x, y, s) =>
  groundShadow(x, y, 26 * s) + cel(pathS(`M${n1(x - 22 * s)} ${n1(y - 34 * s)} L${n1(x + 22 * s)} ${n1(y - 34 * s)} L${n1(x + 16 * s)} ${n1(y)} L${n1(x - 16 * s)} ${n1(y)}Z`), '#c46a3e', { dx: 6, dy: 0 }) +
  [-14, 0, 14].map((d, i) => cel(circleS(x + d * s, y - (44 + (i % 2) * 8) * s, 12 * s), pal.marigold, { dx: 3, dy: 3, sw: SW * 0.7 })).join('');

const sugarSkull: Painter = (x, y, s) =>
  groundShadow(x, y, 20 * s) + cel(pathS(`M${n1(x - 18 * s)} ${n1(y - 8 * s)} Q${n1(x - 22 * s)} ${n1(y - 44 * s)} ${n1(x)} ${n1(y - 44 * s)} Q${n1(x + 22 * s)} ${n1(y - 44 * s)} ${n1(x + 18 * s)} ${n1(y - 8 * s)} Q${n1(x)} ${n1(y + 2 * s)} ${n1(x - 18 * s)} ${n1(y - 8 * s)}Z`), '#f4eee6', { dx: 5, dy: 0 }) +
  `<circle cx="${n1(x - 7 * s)}" cy="${n1(y - 24 * s)}" r="${n1(6 * s)}" fill="${pal.teal}" stroke="${INK}" stroke-width="2"/><circle cx="${n1(x + 7 * s)}" cy="${n1(y - 24 * s)}" r="${n1(6 * s)}" fill="${pal.pink}" stroke="${INK}" stroke-width="2"/>` +
  `<path d="M${n1(x - 6 * s)} ${n1(y - 10 * s)} h${n1(12 * s)}" stroke="${INK}" stroke-width="2" stroke-dasharray="2 2"/>`;

const candles: Painter = (x, y, s) =>
  groundShadow(x, y, 26 * s) + [-14, 0, 14].map((d, i) => {
    const h = (26 + i * 8) * s;
    return cel(rectS(x + d * s - 6 * s, y - h, 12 * s, h, 3), '#f4e6c8', { dx: 3, dy: 0, sw: SW * 0.7 }) +
      `<path d="M${n1(x + d * s)} ${n1(y - h - 14 * s)} q6 8 0 12 q-6 -4 0 -12z" fill="#ffc24a" stroke="${INK}" stroke-width="2"/>`;
  }).join('');

const tower: Painter = (x, y, s) => {
  let o = groundShadow(x, y, 50 * s);
  const cols = [pal.pink, pal.teal, pal.yellow, pal.purple];
  for (let i = 0; i < 4; i++) {
    const w = (86 - i * 12) * s, yy = y - (i + 1) * 44 * s;
    o += cel(rectS(x - w / 2 + (i % 2 ? 6 : -6) * s, yy, w, 46 * s, 6 * s), cols[i]!, { dx: 8, dy: 0, sw: SW * 0.8 });
    o += `<rect x="${n1(x - 8 * s)}" y="${n1(yy + 12 * s)}" width="${n1(14 * s)}" height="${n1(16 * s)}" rx="3" fill="#ffd27a" stroke="${INK}" stroke-width="2"/>`;
  }
  return o;
};

function city(base: number): string {
  let s = '';
  const cols = [pal.pink, pal.teal, pal.yellow, pal.purple];
  for (let i = 0; i < 16; i++) {
    const x = i * 66 - 20, h = 60 + ((i * 53) % 120), w = 70;
    s += cel(rectS(x, base - h, w, h + 30, 6), cols[i % 4]!, { dx: 10, dy: 0, sw: SW * 0.7 });
    for (let k = 0; k < 3; k++) s += `<rect x="${x + 12 + (k % 2) * 26}" y="${base - h + 14 + k * 26}" width="14" height="14" rx="3" fill="#ffd27a" opacity=".9"/>`;
  }
  // guirlande de papel picado
  s += `<path d="M-10 ${base - 170} Q250 ${base - 120} 500 ${base - 170} T1010 ${base - 170}" stroke="${INK}" stroke-width="3" fill="none"/>`;
  for (let i = 0; i < 20; i++) {
    const t = i / 19, x = -10 + t * 1020, y = base - 170 + Math.sin(t * Math.PI * 2) * 22 * -1 + 22 * Math.sin(t * Math.PI * 2) * 0 + (Math.sin(t * Math.PI * 4 - Math.PI / 2) + 1) * 12;
    s += `<rect x="${n1(x - 12)}" y="${n1(y)}" width="24" height="28" fill="${cols[i % 4]}" stroke="${INK}" stroke-width="2.5"/>`;
  }
  return s;
}

function backdrop(c: Ctx): string {
  return scene(c, {
    texture: 'spots', pad: '#56407a', padMargin: 0.9,
    horizon: (base) => stars(c, 40, { x: 0, y: 0, w: 1000, h: base - 100 }) + city(base) + cel(rectS(-20, base, 1040, 26, 0), '#6a4a8a', { dx: 0, dy: 8 }),
  });
}

function anims(c: Ctx) {
  const [a, b, , e, f, g] = spots(c);
  const alebrije = (x: number, y: number) =>
    cel(pathS(`M${x - 30} ${y} Q${x - 10} ${y - 24} ${x + 20} ${y - 10} Q${x + 34} ${y - 22} ${x + 36} ${y - 4} Q${x + 30} ${y + 10} ${x + 14} ${y + 8} Q${x - 10} ${y + 16} ${x - 30} ${y}Z`), pal.teal) +
    `<path d="M${x - 6} ${y - 12} Q${x - 20} ${y - 40} ${x + 6} ${y - 34}Z" fill="${pal.pink}" stroke="${INK}" stroke-width="3"/><circle cx="${x + 26}" cy="${y - 6}" r="3" fill="${INK}"/>` +
    `<path d="M${x - 20} ${y} q6 -6 12 0 M${x} ${y - 2} q6 -6 12 0" stroke="${pal.yellow}" stroke-width="3" fill="none"/>`;
  const sky = c.mode === 'solo' ? 140 : 50;
  return [
    across('Alebrijes lumineux', sky, 17, (x, y) => alebrije(x, y), { w: 90, h: 60 }),
    at('Alebrijes lumineux', 'bob', a, 40, alebrije(a.x - 4, a.y + 6), { period: 2.6, amp: 8 }),
    at('Lumières de la ville', 'blink', b, 24, glow(b.x, b.y, 8, '#ffd27a'), { period: 1.4, min: 0.3 }),
    at('Lumières de la ville', 'blink', e, 24, glow(e.x, e.y, 8, pal.pink), { period: 1.9, min: 0.3, phase: 0.3 }),
    at('Lumières de la ville', 'blink', f, 24, glow(f.x, f.y, 8, pal.teal), { period: 1.6, min: 0.3, phase: 0.6 }),
    at('Lumières de la ville', 'blink', g, 24, glow(g.x, g.y, 8, pal.yellow), { period: 2.2, min: 0.3, phase: 0.1 }),
  ];
}

export const royaumeDesMorts = defineMap({
  id: 'royaume-des-morts',
  name: 'Royaume des morts',
  tagline: 'Un pont de pétales vers la ville qui ne dort jamais.',
  universe: 'disney',
  heroes: ['coco'],
  shape: 'arch',
  pathMaterial: 'Pont de pétales de souci',
  pathKind: 'petals',
  frameKind: 'stone',
  palette: pal,
  backdrop,
  props: { big: [tower], med: [marigoldPot, candles], small: [sugarSkull, candles, sugarSkull] },
  gate: (x, y, s) => groundShadow(x, y, 66 * s) +
    cel(pathS(`M${n1(x - 60 * s)} ${n1(y)} L${n1(x - 60 * s)} ${n1(y - 80 * s)} Q${n1(x)} ${n1(y - 140 * s)} ${n1(x + 60 * s)} ${n1(y - 80 * s)} L${n1(x + 60 * s)} ${n1(y)}Z`), pal.teal, { dx: 10, dy: 0 }) +
    flat(pathS(`M${n1(x - 30 * s)} ${n1(y)} L${n1(x - 30 * s)} ${n1(y - 60 * s)} Q${n1(x)} ${n1(y - 96 * s)} ${n1(x + 30 * s)} ${n1(y - 60 * s)} L${n1(x + 30 * s)} ${n1(y)}Z`), '#ffb24a') +
    [-40, -20, 0, 20, 40].map((d) => `<circle cx="${n1(x + d * s)}" cy="${n1(y - 110 * s + Math.abs(d) * 0.5 * s)}" r="${n1(6 * s)}" fill="${pal.marigold}" stroke="${INK}" stroke-width="2"/>`).join('') + gloss(x - 36 * s, y - 90 * s, 5 * s, 12 * s, 0, 0.35),
  anims,
  sound: 'mariachi-nuit',
  modifiers: { resurrections: 1 },
  unlock: { type: 'vagues', value: 40 },
  mute: { sat: 0.8, lum: 0.88 },
});

export default royaumeDesMorts;
