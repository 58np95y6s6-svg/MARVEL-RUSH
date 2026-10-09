// Temple des Dix Anneaux (Shang-Chi, Captain Marvel) : pont de pierre au-dessus de l'eau,
// forêt de bambous, lanternes, dragon d'eau en fond.

import {
  type Ctx, type Painter, INK, P, SW, across, at, cel, circleS, defineMap, flat, gloss, glow, groundShadow, n1, pathS,
  polyS, rectS, scene, spots, peaks,
} from './kit';

const pal = {
  bg: '#10262c',
  sky1: '#2d5a6a', sky2: '#a7cbbf',
  ground: '#2f6a73', ground2: '#3a7b83',
  path: '#c2b8a4', pathEdge: '#7d7462', pathDeco: '#a69b85',
  frame: '#5f9a7a', frameLight: '#9fd0b0', frameShade: '#3c6a54',
  cellA: '#eef4ee', cellB: '#dbe8de',
  accent: '#e04a3c', portal: '#56d6c6',
  bamboo: '#6fa65a', lantern: '#e0583e', roof: '#b8463a', stone: '#9a9384', dragon: '#7fd6d0',
};

const bamboo: Painter = (x, y, s) => {
  let o = groundShadow(x, y, 36 * s);
  for (const [dx, h] of [[-22, 190], [0, 230], [20, 170]] as const) {
    o += cel(rectS(x + dx * s - 7 * s, y - h * s, 14 * s, h * s, 6 * s), pal.bamboo, { dx: 4, dy: 0, sw: SW * 0.8 });
    for (let k = 40; k < h; k += 46) o += `<line x1="${n1(x + dx * s - 7 * s)}" y1="${n1(y - k * s)}" x2="${n1(x + dx * s + 7 * s)}" y2="${n1(y - k * s)}" stroke="${INK}" stroke-width="3"/>`;
    o += `<path d="M${n1(x + dx * s)} ${n1(y - h * s + 30 * s)} q${n1(24 * s)} ${n1(-10 * s)} ${n1(38 * s)} ${n1(4 * s)} q${n1(-20 * s)} ${n1(6 * s)} ${n1(-38 * s)} ${n1(-4 * s)}z" fill="#8cc070" stroke="${INK}" stroke-width="3"/>`;
  }
  return o;
};

const stoneLantern: Painter = (x, y, s) =>
  groundShadow(x, y, 28 * s) + cel(rectS(x - 22 * s, y - 14 * s, 44 * s, 14 * s, 3), pal.stone, { dx: 0, dy: 4 }) +
  cel(rectS(x - 8 * s, y - 50 * s, 16 * s, 38 * s, 3), pal.stone, { dx: 4, dy: 0 }) +
  cel(rectS(x - 20 * s, y - 76 * s, 40 * s, 28 * s, 4), pal.stone, { dx: 8, dy: 0 }) + `<rect x="${n1(x - 9 * s)}" y="${n1(y - 70 * s)}" width="${n1(18 * s)}" height="${n1(16 * s)}" fill="#ffcf6a"/>` +
  cel(polyS([{ x: x - 32 * s, y: y - 74 * s }, { x, y: y - 100 * s }, { x: x + 32 * s, y: y - 74 * s }]), pal.stone, { dx: 6, dy: 0 });

const pagoda: Painter = (x, y, s) => {
  let o = groundShadow(x, y, 60 * s);
  o += cel(rectS(x - 40 * s, y - 70 * s, 80 * s, 70 * s, 4), '#d9cbb0', { dx: 10, dy: 0 });
  o += flat(rectS(x - 14 * s, y - 46 * s, 28 * s, 46 * s, 3), '#5a3a2c');
  const roof = (yy: number, w: number) => cel(pathS(`M${n1(x - w * s)} ${n1(yy)} Q${n1(x - w * 0.5 * s)} ${n1(yy - 10 * s)} ${n1(x - w * 0.4 * s)} ${n1(yy - 30 * s)} L${n1(x + w * 0.4 * s)} ${n1(yy - 30 * s)} Q${n1(x + w * 0.5 * s)} ${n1(yy - 10 * s)} ${n1(x + w * s)} ${n1(yy)} Z`), pal.roof, { dx: 0, dy: 8 });
  o += roof(y - 66 * s, 62) + cel(rectS(x - 28 * s, y - 128 * s, 56 * s, 34 * s, 3), '#d9cbb0', { dx: 8, dy: 0 }) + roof(y - 124 * s, 48);
  return o + gloss(x - 30 * s, y - 92 * s, 14 * s, 3 * s, -10, 0.35);
};

const lily: Painter = (x, y, s) =>
  `<ellipse cx="${n1(x)}" cy="${n1(y - 8 * s)}" rx="${n1(28 * s)}" ry="${n1(11 * s)}" fill="#5ea05a" stroke="${INK}" stroke-width="${SW * 0.7}"/><path d="M${n1(x)} ${n1(y - 8 * s)} L${n1(x + 26 * s)} ${n1(y - 12 * s)}" stroke="${INK}" stroke-width="3"/>` +
  flat(circleS(x - 6 * s, y - 14 * s, 6 * s), '#f2a6c0', SW * 0.5);

const rockW: Painter = P.rock('#7f8d86');

function dragon(base: number): string {
  // dragon d'eau qui ondule à l'horizon (silhouette translucide)
  const d = `M60 ${base - 40} C160 ${base - 160} 240 ${base - 10} 340 ${base - 110} S520 ${base - 170} 600 ${base - 90} S780 ${base - 10} 900 ${base - 120}`;
  return `<path d="${d}" stroke="${INK}" stroke-width="58" fill="none" stroke-linecap="round" opacity=".5"/><path d="${d}" stroke="${pal.dragon}" stroke-width="46" fill="none" stroke-linecap="round" opacity=".55"/>` +
    `<path d="${d}" stroke="#ffffff" stroke-width="8" fill="none" stroke-linecap="round" stroke-dasharray="20 30" opacity=".5"/>` +
    cel(circleS(910, base - 128, 40), pal.dragon, { dx: 8, dy: 8 }) + `<circle cx="924" cy="${base - 138}" r="7" fill="#fff" stroke="${INK}" stroke-width="3"/>` +
    `<path d="M890 ${base - 160} q-10 -40 -40 -50 M930 ${base - 160} q10 -40 40 -50" stroke="${INK}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
}

function backdrop(c: Ctx): string {
  return scene(c, {
    texture: 'none', pad: '#5c7d62', padMargin: 0.8,
    horizon: (base) => peaks(base - 40, '#7aa59a', 130, 'dix-anneaux', 5) + dragon(base) + `<rect x="-10" y="${base - 10}" width="1020" height="40" fill="${pal.ground2}"/>`,
    after: Array.from({ length: 26 }, (_, i) => {
      const x = (i * 137) % 1000, y = horizonOf(c) + 50 + ((i * 263) % (1600 - horizonOf(c)));
      return `<path d="M${x - 30} ${y} q15 -8 30 0 t30 0" stroke="#7fc0c4" stroke-width="5" fill="none" stroke-linecap="round" opacity=".6"/>`;
    }).join(''),
  });
}
const horizonOf = (c: Ctx) => (c.mode === 'solo' ? 270 : 118);

function anims(c: Ctx) {
  const [a, b, d, e, f] = spots(c);
  const lantern = (x: number, y: number) => `<line x1="${x}" y1="${y - 34}" x2="${x}" y2="${y - 20}" stroke="${INK}" stroke-width="3"/>` + cel(circleS(x, y, 20), pal.lantern) + `<rect x="${x - 10}" y="${y - 24}" width="20" height="6" rx="2" fill="${INK}"/><rect x="${x - 10}" y="${y + 18}" width="20" height="6" rx="2" fill="${INK}"/><circle cx="${x}" cy="${y}" r="8" fill="#ffd27a" opacity=".7"/>`;
  const petal = (x: number, y: number) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="5" fill="#f4b6c8" stroke="${INK}" stroke-width="2" transform="rotate(30 ${x} ${y})"/><ellipse cx="${x + 26}" cy="${y + 12}" rx="7" ry="4" fill="#f4b6c8" stroke="${INK}" stroke-width="2"/>`;
  const sky = c.mode === 'solo' ? 140 : 50;
  return [
    at('Lanternes', 'bob', a, 40, lantern(a.x, a.y), { period: 3, amp: 6 }),
    at('Lanternes', 'bob', b, 40, lantern(b.x, b.y), { period: 3.4, amp: 6, phase: 0.5 }),
    at('Ronds dans l\'eau', 'pulse', d, 40, `<ellipse cx="${d.x}" cy="${d.y}" rx="30" ry="12" fill="none" stroke="#bfe8e8" stroke-width="4"/><ellipse cx="${d.x}" cy="${d.y}" rx="16" ry="6" fill="none" stroke="#bfe8e8" stroke-width="3"/>`, { period: 2.4, amp: 0.15 }),
    across('Pétales au vent', sky, 16, (x, y) => petal(x, y), { w: 60, h: 40 }),
    at('Lanternes', 'blink', e, 22, glow(e.x, e.y, 8, '#ffcf6a'), { period: 1.8, min: 0.4 }),
    at('Lanternes', 'blink', f, 22, glow(f.x, f.y, 8, '#ffcf6a'), { period: 2.1, min: 0.4, phase: 0.6 }),
  ];
}

export const templeDixAnneaux = defineMap({
  id: 'temple-dix-anneaux',
  name: 'Temple des Dix Anneaux',
  tagline: 'Un pont de pierre sur le lac, sous l\'œil du dragon.',
  universe: 'marvel',
  heroes: ['shangchi', 'cmarvel'],
  shape: 'arch',
  pathMaterial: 'Pont de pierre au-dessus de l\'eau',
  pathKind: 'stone',
  frameKind: 'jade',
  palette: pal,
  backdrop,
  props: { big: [bamboo, pagoda, bamboo], med: [stoneLantern, rockW], small: [lily, rockW, lily] },
  gate: (x, y, s) => groundShadow(x, y, 70 * s) +
    cel(rectS(x - 54 * s, y - 120 * s, 16 * s, 120 * s, 4), pal.roof, { dx: 5, dy: 0 }) + cel(rectS(x + 38 * s, y - 120 * s, 16 * s, 120 * s, 4), pal.roof, { dx: 5, dy: 0 }) +
    cel(pathS(`M${n1(x - 80 * s)} ${n1(y - 116 * s)} Q${n1(x)} ${n1(y - 134 * s)} ${n1(x + 80 * s)} ${n1(y - 116 * s)} L${n1(x + 80 * s)} ${n1(y - 102 * s)} L${n1(x - 80 * s)} ${n1(y - 102 * s)}Z`), pal.roof, { dx: 0, dy: 5 }) +
    cel(rectS(x - 64 * s, y - 92 * s, 128 * s, 12 * s, 3), pal.roof, { dx: 0, dy: 4 }),
  anims,
  sound: 'temple-zen',
  modifiers: { combos: 0.1 },
  unlock: { type: 'vagues', value: 25 },
  mute: { sat: 0.72, lum: 0.88 },
});

export default templeDixAnneaux;
