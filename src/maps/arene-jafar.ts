// Arène de Jafar & Iago : Caverne aux Merveilles. Tête de tigre en sable, trésors, fumée rouge,
// sable qui coule. Pendant le boss : spirales hypnotiques au sol, ciel rouge.

import { type Ctx, type Painter, INK, SW, at, cel, defineMap, glow, groundShadow, n1, pathS, rectS, scene, spots, sparkle } from './kit';

const pal = {
  bg: '#2a1018',
  sky1: '#3a1424', sky2: '#8a3a2a',
  ground: '#a8784a', ground2: '#b8884e',
  path: '#e8c890', pathEdge: '#a07a48', pathDeco: '#c8a46a',
  frame: '#d8a43a', frameLight: '#f6d070', frameShade: '#966a22',
  cellA: '#fbf2de', cellB: '#efdfbe',
  accent: '#c0263a', portal: '#e8413b',
  gold: '#e8b84a', gem: '#c0263a', smoke: '#c0405a',
};

const treasure: Painter = (x, y, s) =>
  groundShadow(x, y, 50 * s) + cel(pathS(`M${n1(x - 50 * s)} ${n1(y)} Q${n1(x - 40 * s)} ${n1(y - 50 * s)} ${n1(x)} ${n1(y - 56 * s)} Q${n1(x + 40 * s)} ${n1(y - 50 * s)} ${n1(x + 50 * s)} ${n1(y)}Z`), pal.gold, { dx: 10, dy: 0 }) +
  [[-24, -20], [0, -34], [20, -18], [-6, -12], [30, -6]].map(([dx, dy]) => `<circle cx="${n1(x + dx! * s)}" cy="${n1(y + dy! * s)}" r="${n1(7 * s)}" fill="#f6d070" stroke="${INK}" stroke-width="2.5"/>`).join('') +
  cel(pathS(`M${n1(x + 8 * s)} ${n1(y - 60 * s)} L${n1(x + 20 * s)} ${n1(y - 48 * s)} L${n1(x + 8 * s)} ${n1(y - 36 * s)} L${n1(x - 4 * s)} ${n1(y - 48 * s)}Z`), pal.gem, { dx: 3, dy: 0, sw: 4 });

const lamp: Painter = (x, y, s) =>
  groundShadow(x, y, 30 * s) + cel(pathS(`M${n1(x - 30 * s)} ${n1(y - 14 * s)} Q${n1(x - 30 * s)} ${n1(y - 40 * s)} ${n1(x)} ${n1(y - 40 * s)} Q${n1(x + 24 * s)} ${n1(y - 40 * s)} ${n1(x + 46 * s)} ${n1(y - 46 * s)} Q${n1(x + 30 * s)} ${n1(y - 14 * s)} ${n1(x)} ${n1(y - 10 * s)}Z`), pal.gold, { dx: 5, dy: 3 }) +
  flat(rectS(x - 12 * s, y - 10 * s, 24 * s, 10 * s, 3), pal.gold);

const urn: Painter = (x, y, s) =>
  groundShadow(x, y, 26 * s) + cel(pathS(`M${n1(x - 12 * s)} ${n1(y)} Q${n1(x - 30 * s)} ${n1(y - 30 * s)} ${n1(x - 12 * s)} ${n1(y - 56 * s)} L${n1(x + 12 * s)} ${n1(y - 56 * s)} Q${n1(x + 30 * s)} ${n1(y - 30 * s)} ${n1(x + 12 * s)} ${n1(y)}Z`), '#c47a3a', { dx: 6, dy: 0 }) +
  `<path d="M${n1(x - 20 * s)} ${n1(y - 30 * s)} h${n1(40 * s)}" stroke="${pal.gold}" stroke-width="5"/>`;

function flat(sh: (a: string) => string, fill: string): string { return sh(`fill="${fill}" stroke="${INK}" stroke-width="${SW}"`); }

function tigerHead(base: number): string {
  const cx = 500, cy = base - 70;
  return cel(pathS(`M${cx - 200} ${base + 20} Q${cx - 220} ${cy - 120} ${cx - 120} ${cy - 150} L${cx - 150} ${cy - 210} L${cx - 70} ${cy - 165} Q${cx} ${cy - 190} ${cx + 70} ${cy - 165} L${cx + 150} ${cy - 210} L${cx + 120} ${cy - 150} Q${cx + 220} ${cy - 120} ${cx + 200} ${base + 20}Z`), '#c89a5a', { dx: 30, dy: 0 }) +
    `<path d="M${cx - 100} ${cy - 70} Q${cx - 70} ${cy - 100} ${cx - 40} ${cy - 70}Z M${cx + 40} ${cy - 70} Q${cx + 70} ${cy - 100} ${cx + 100} ${cy - 70}Z" fill="#f6d070" stroke="${INK}" stroke-width="5"/>` +
    `<path d="M${cx - 110} ${base + 20} Q${cx} ${cy - 40} ${cx + 110} ${base + 20}Z" fill="#2a1018" stroke="${INK}" stroke-width="6"/>`;
}

function backdrop(c: Ctx): string {
  return scene(c, {
    texture: 'spots', pad: '#c8985a', padMargin: 0.9,
    horizon: (base) => `<path d="M-10 ${base + 10} L-10 ${base - 160} Q200 ${base - 260} 500 ${base - 270} Q800 ${base - 260} 1010 ${base - 160} L1010 ${base + 10}Z" fill="#5a2a2a"/>` + tigerHead(base),
  });
}

function anims(c: Ctx) {
  const [a, b, d, e, f] = spots(c);
  const smoke = (x: number, y: number) => `<circle cx="${x - 12}" cy="${y + 6}" r="18" fill="${pal.smoke}" opacity=".55"/><circle cx="${x + 10}" cy="${y - 6}" r="22" fill="${pal.smoke}" opacity=".45"/><circle cx="${x}" cy="${y - 24}" r="12" fill="${pal.smoke}" opacity=".4"/>`;
  const sand = (x: number, y: number) => `<path d="M${x - 4} ${y - 34} Q${x + 6} ${y} ${x - 2} ${y + 34}" stroke="#e8c890" stroke-width="8" fill="none" stroke-linecap="round" stroke-dasharray="10 8"/>`;
  return [
    at('Fumée rouge', 'pulse', a, 40, smoke(a.x, a.y), { period: 3.4, amp: 0.15 }),
    at('Fumée rouge', 'bob', b, 40, smoke(b.x, b.y), { period: 3, amp: 8, phase: 0.5 }),
    at('Sable qui coule', 'blink', e, 36, sand(e.x, e.y), { period: 1.2, min: 0.4 }),
    at('Sable qui coule', 'blink', f, 36, sand(f.x, f.y), { period: 1.4, min: 0.4, phase: 0.5 }),
    at('Trésors qui scintillent', 'pulse', d, 26, sparkle(d.x, d.y, 16, '#fff6c0') + glow(d.x + 14, d.y + 10, 5, pal.gem), { period: 1.6, amp: 0.3 }),
  ];
}

export const areneJafar = defineMap({
  id: 'arene-jafar',
  name: 'Caverne aux Merveilles',
  tagline: 'Seul un diamant d\'innocence peut entrer…',
  universe: 'boss',
  heroes: [],
  boss: 'jafar',
  shape: 'wave',
  pathMaterial: 'Sable doré de la caverne',
  pathKind: 'sand',
  frameKind: 'gold',
  palette: pal,
  backdrop,
  props: { big: [treasure, urn], med: [treasure, lamp, urn], small: [lamp, urn] },
  anims,
  sound: 'agrabah-menace',
  unlock: { type: 'depart', value: 0 },
  bossFx: { description: 'Spirales hypnotiques au sol (hors chemin et grille), ciel rouge.', tint: '#c0263a', tintAlpha: 0.18, effects: ['hypno-spirals', 'red-sky'] },
  mute: { sat: 0.74, lum: 0.86 },
});

export default areneJafar;

