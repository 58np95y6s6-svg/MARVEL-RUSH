// Atlantis (Aquaman) : cité engloutie, dômes de verre et flèches d'orichalque qui luisent dans le
// bleu profond, algues, rayons de lumière. Bulles qui remontent, bancs de poissons, dômes qui brillent.

import {
  type AnimSpec, type Ctx, type Painter, INK, P, SW, across, at, cel, circleS, defineMap, ellS, flat, gloss, glow, groundShadow,
  light, n1, pathS, polyS, rectS, scene, spots,
} from './kit';

const pal = {
  bg: '#08203a',
  sky1: '#0e3a5e', sky2: '#1e6a86',
  ground: '#2a5a6a', ground2: '#245262',
  path: '#c8d8cc', pathEdge: '#5a8a88', pathDeco: '#8ac8b8',
  frame: '#4a9a86', frameLight: '#86d0b8', frameShade: '#2e6a5e',
  cellA: '#eef6f2', cellB: '#d8eae4',
  accent: '#f2c33c', portal: '#5ae0d0',
  gold: '#d8b25a', dome: '#7ad8e0', kelp: '#4a8a5a', coral: '#e07a6a', shell: '#f0d8c0',
};

// ---------------------------------------------------------------- accessoires

const kelp: Painter = (x, y, s) => {
  let o = groundShadow(x, y, 24 * s);
  for (const [dx, h] of [[-12, 150], [4, 190], [18, 130]] as const)
    o += `<path d="M${n1(x + dx * s)} ${n1(y)} q${n1(-18 * s)} ${n1(-h * 0.25 * s)} 0 ${n1(-h * 0.5 * s)} t0 ${n1(-h * 0.5 * s)}" stroke="${INK}" stroke-width="${n1(16 * s)}" fill="none" stroke-linecap="round"/>` +
      `<path d="M${n1(x + dx * s)} ${n1(y)} q${n1(-18 * s)} ${n1(-h * 0.25 * s)} 0 ${n1(-h * 0.5 * s)} t0 ${n1(-h * 0.5 * s)}" stroke="${pal.kelp}" stroke-width="${n1(9 * s)}" fill="none" stroke-linecap="round"/>`;
  return o;
};

const coralFan: Painter = (x, y, s) =>
  groundShadow(x, y, 30 * s) +
  cel(pathS(`M${n1(x - 6 * s)} ${n1(y)} L${n1(x - 6 * s)} ${n1(y - 20 * s)} Q${n1(x - 40 * s)} ${n1(y - 40 * s)} ${n1(x - 30 * s)} ${n1(y - 70 * s)} Q${n1(x)} ${n1(y - 90 * s)} ${n1(x + 30 * s)} ${n1(y - 70 * s)} Q${n1(x + 40 * s)} ${n1(y - 40 * s)} ${n1(x + 6 * s)} ${n1(y - 20 * s)} L${n1(x + 6 * s)} ${n1(y)}Z`), pal.coral, { dx: 7, dy: 0 }) +
  [-16, 0, 16].map((d) => `<path d="M${n1(x)} ${n1(y - 22 * s)} L${n1(x + d * s)} ${n1(y - 72 * s)}" stroke="${INK}" stroke-width="${n1(3 * s)}" opacity=".35"/>`).join('');

const shell: Painter = (x, y, s) =>
  groundShadow(x, y, 20 * s) +
  cel(pathS(`M${n1(x - 20 * s)} ${n1(y)} Q${n1(x - 24 * s)} ${n1(y - 30 * s)} ${n1(x)} ${n1(y - 34 * s)} Q${n1(x + 24 * s)} ${n1(y - 30 * s)} ${n1(x + 20 * s)} ${n1(y)}Z`), pal.shell, { dx: 5, dy: 0, sw: SW * 0.7 }) +
  [-10, 0, 10].map((d) => `<path d="M${n1(x)} ${n1(y - 2 * s)} L${n1(x + d * s)} ${n1(y - 30 * s)}" stroke="${INK}" stroke-width="${n1(2.5 * s)}" opacity=".4"/>`).join('');

/** Statue au trident. */
const tridentStatue: Painter = (x, y, s) =>
  groundShadow(x, y, 36 * s) +
  cel(rectS(x - 30 * s, y - 28 * s, 60 * s, 28 * s, 4), '#6a9a8e', { dx: 0, dy: 8 }) +
  flat(rectS(x - 3 * s, y - 190 * s, 6 * s, 162 * s, 2), pal.gold, SW * 0.6) +
  flat(pathS(`M${n1(x - 22 * s)} ${n1(y - 210 * s)} L${n1(x - 22 * s)} ${n1(y - 186 * s)} L${n1(x + 22 * s)} ${n1(y - 186 * s)} L${n1(x + 22 * s)} ${n1(y - 210 * s)} M${n1(x)} ${n1(y - 216 * s)} L${n1(x)} ${n1(y - 186 * s)}`), 'none', SW * 0.9) +
  `<path d="M${n1(x - 22 * s)} ${n1(y - 210 * s)} L${n1(x - 22 * s)} ${n1(y - 186 * s)} L${n1(x + 22 * s)} ${n1(y - 186 * s)} L${n1(x + 22 * s)} ${n1(y - 210 * s)} M${n1(x)} ${n1(y - 216 * s)} L${n1(x)} ${n1(y - 186 * s)}" stroke="${pal.gold}" stroke-width="${n1(4 * s)}" fill="none"/>` +
  cel(pathS(`M${n1(x - 18 * s)} ${n1(y - 28 * s)} L${n1(x - 14 * s)} ${n1(y - 110 * s)} Q${n1(x)} ${n1(y - 122 * s)} ${n1(x + 14 * s)} ${n1(y - 110 * s)} L${n1(x + 18 * s)} ${n1(y - 28 * s)}Z`), '#8ab8aa', { dx: 6, dy: 0 }) +
  cel(circleS(x, y - 132 * s, 14 * s), '#8ab8aa', { dx: 3, dy: 3 });

/** Petit dôme lumineux. */
const smallDome: Painter = (x, y, s) =>
  groundShadow(x, y, 40 * s) +
  cel(rectS(x - 40 * s, y - 16 * s, 80 * s, 16 * s, 4), pal.gold, { dx: 0, dy: 5 }) +
  cel(pathS(`M${n1(x - 36 * s)} ${n1(y - 16 * s)} Q${n1(x - 36 * s)} ${n1(y - 70 * s)} ${n1(x)} ${n1(y - 72 * s)} Q${n1(x + 36 * s)} ${n1(y - 70 * s)} ${n1(x + 36 * s)} ${n1(y - 16 * s)}Z`), pal.dome, { dx: 10, dy: 0 }) +
  gloss(x - 14 * s, y - 50 * s, 6 * s, 12 * s, 30, 0.5);

/** Sortie : arche d'orichalque. */
const atlanteanGate: Painter = (x, y, s) =>
  groundShadow(x, y, 66 * s) +
  cel(pathS(`M${n1(x - 62 * s)} ${n1(y)} L${n1(x - 62 * s)} ${n1(y - 80 * s)} Q${n1(x)} ${n1(y - 160 * s)} ${n1(x + 62 * s)} ${n1(y - 80 * s)} L${n1(x + 62 * s)} ${n1(y)}Z`), pal.gold, { dx: 12, dy: 0 }) +
  flat(pathS(`M${n1(x - 34 * s)} ${n1(y)} L${n1(x - 34 * s)} ${n1(y - 66 * s)} Q${n1(x)} ${n1(y - 116 * s)} ${n1(x + 34 * s)} ${n1(y - 66 * s)} L${n1(x + 34 * s)} ${n1(y)}Z`), '#0e3a5e') +
  `<circle cx="${n1(x)}" cy="${n1(y - 120 * s)}" r="${n1(9 * s)}" fill="${pal.dome}" stroke="${INK}" stroke-width="${n1(3 * s)}"/>`;

// ---------------------------------------------------------------- fond

function city(base: number, k: number): string {
  let s = '';
  // rayons de lumière venus de la surface
  for (const x of [120, 380, 640, 880]) s += `<path d="M${x - 30} -10 L${x + 30} -10 L${x + 120} ${base} L${x + 10} ${base}Z" fill="#bff4ff" opacity=".08"/>`;
  // collines sous-marines
  s += `<path d="M-20 ${base} Q200 ${n1(base - 90 * k)} 420 ${n1(base - 40 * k)} Q640 ${n1(base - 10 * k)} 820 ${n1(base - 70 * k)} Q940 ${n1(base - 100 * k)} 1020 ${n1(base - 60 * k)} L1020 ${base + 30} L-20 ${base + 30}Z" fill="#1a4e66"/>`;
  // flèches et dômes
  const spire = (x: number, w: number, h: number) =>
    cel(polyS([{ x: x - w / 2, y: base }, { x: x - w * 0.3, y: base - h * k }, { x, y: base - (h + 60) * k }, { x: x + w * 0.3, y: base - h * k }, { x: x + w / 2, y: base }]), '#3a8a8a', { dx: w * 0.15, dy: 0, sw: SW * 0.8 }) +
    `<circle cx="${x}" cy="${n1(base - (h + 60) * k)}" r="${n1(16 * Math.max(k, 0.6))}" fill="${pal.dome}" opacity=".35"/><circle cx="${x}" cy="${n1(base - (h + 60) * k)}" r="${n1(7 * Math.max(k, 0.6))}" fill="${light(pal.dome, 0.4)}" stroke="${INK}" stroke-width="3"/>`;
  const dome = (x: number, r: number) =>
    cel(pathS(`M${x - r} ${base} Q${x - r} ${n1(base - r * 1.3 * k)} ${x} ${n1(base - r * 1.32 * k)} Q${x + r} ${n1(base - r * 1.3 * k)} ${x + r} ${base}Z`), pal.dome, { dx: r * 0.25, dy: 0, sw: SW * 0.8 }) +
    `<path d="M${x - r * 0.5} ${n1(base - r * 0.3 * k)} Q${x - r * 0.5} ${n1(base - r * 1.0 * k)} ${x} ${n1(base - r * 1.1 * k)}" stroke="#fff" stroke-width="5" fill="none" opacity=".5" stroke-linecap="round"/>`;
  s += spire(90, 70, 150) + dome(220, 90) + spire(380, 60, 210) + spire(500, 90, 260) + spire(620, 60, 200) + dome(780, 110) + spire(930, 70, 160);
  s += dome(500, 60);
  return s;
}

function backdrop(c: Ctx): string {
  const k = c.mode === 'solo' ? 1 : 0.5;
  return scene(c, {
    texture: 'spots', pad: '#3a7080', padMargin: 0.9,
    horizon: (base) => city(base, k) + cel(rectS(-20, base - 4, 1040, 26, 0), '#6a9a8e', { dx: 0, dy: 8 }),
    after: c.mode === 'solo' ? sandBank(c.z.strip.y) : '',
  });
}

function sandBank(y: number): string {
  let s = `<path d="M-20 ${y - 30} Q300 ${y - 60} 500 ${y - 40} Q760 ${y - 20} 1020 ${y - 44} L1020 ${y + 60} L-20 ${y + 60}Z" fill="#c8b890" opacity=".45"/>`;
  for (let i = 0; i < 12; i++) s += `<ellipse cx="${40 + i * 84}" cy="${y + 10 + (i % 3) * 10}" rx="10" ry="4" fill="#e8dcc0" opacity=".6"/>`;
  return s;
}

// ---------------------------------------------------------------- animations

const bubbles = (x: number, y: number) =>
  [[0, 0, 9], [12, -22, 6], [-6, -40, 5], [8, -56, 4]].map(([dx, dy, r]) => `<circle cx="${x + dx!}" cy="${y + dy!}" r="${r}" fill="#dff8ff" opacity=".55" stroke="${INK}" stroke-width="2.5"/><circle cx="${x + dx! - r! * 0.35}" cy="${y + dy! - r! * 0.35}" r="${r! * 0.3}" fill="#fff"/>`).join('');

const fish = (x: number, y: number, col: string) =>
  cel(ellS(x, y, 18, 9), col, { dx: 0, dy: 3, sw: 3.5 }) + `<path d="M${x - 16} ${y} l-12 -9 l0 18z" fill="${col}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><circle cx="${x + 9}" cy="${y - 2}" r="2.2" fill="${INK}"/>`;

function anims(c: Ctx): AnimSpec[] {
  const [a, b, d, e, f] = spots(c);
  const solo = c.mode === 'solo';
  const school = (x: number, y: number) => fish(x - 26, y, '#f2c33c') + fish(x + 14, y - 16, '#f2a03a') + fish(x + 22, y + 14, '#f2c33c');
  return [
    across('Bancs de poissons', solo ? 230 : 64, 16, (x, y) => school(x, y), { w: 110, h: 60 }),
    { label: 'Bulles qui remontent', kind: 'drift', period: 3, dx: 0, dy: -24, box: { x: a.x - 20, y: a.y - 40, w: 40, h: 70 }, markup: bubbles(a.x, a.y + 20) },
    { label: 'Bulles qui remontent', kind: 'drift', period: 3.6, phase: 0.5, dx: 0, dy: -24, box: { x: b.x - 20, y: b.y - 40, w: 40, h: 70 }, markup: bubbles(b.x, b.y + 20) },
    at('Dômes qui luisent', 'pulse', d, 30, glow(d.x, d.y, 10, pal.dome), { period: 2.4, amp: 0.15 }),
    at('Dômes qui luisent', 'blink', e, 26, glow(e.x, e.y, 8, pal.dome), { period: 2.9, min: 0.3 }),
    at('Dômes qui luisent', 'blink', f, 26, glow(f.x, f.y, 8, pal.gold), { period: 3.3, min: 0.3, phase: 0.5 }),
  ];
}

export const atlantis = defineMap({
  id: 'atlantis',
  name: 'Atlantis',
  tagline: 'La cité engloutie, royaume d\'Aquaman.',
  universe: 'dc',
  heroes: ['aquaman'],
  shape: 'zigzag',
  pathMaterial: 'Dalles d\'orichalque couvertes de sable',
  pathKind: 'stone',
  frameKind: 'jade',
  palette: pal,
  backdrop,
  props: {
    big: [tridentStatue, kelp, smallDome],
    med: [smallDome, coralFan, kelp],
    small: [shell, P.rock('#4a7a7a'), shell],
  },
  gate: atlanteanGate,
  anims,
  sound: 'atlantis-profondeurs',
  modifiers: { ralentissements: 0.1 },
  unlock: { type: 'chapitre', value: 8 },
  mute: { sat: 0.78, lum: 0.88 },
});

export default atlantis;
