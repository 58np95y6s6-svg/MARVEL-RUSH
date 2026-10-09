// Toits de New York (Spider-Man) — map de départ.
// Chemin : toits reliés par des passerelles (tracé en marches). Décor : château d'eau, gratte-ciel au
// coucher du soleil, toiles entre les antennes, taxis jaunes dans la rue en contrebas.

import {
  type AnimSpec, type Ctx, type Painter, INK, P, SW, cel, circleS, cloud, defineMap, ellS, flat, gloss, groundShadow,
  n1, pathS, rectS, shade, skyAndGround, light,
} from './kit';

const pal = {
  bg: '#2c2440',
  sky1: '#4b3f7e', sky2: '#f2a36b',
  ground: '#5f5374', ground2: '#54496a',
  path: '#d6cabb', pathEdge: '#9c8c88', pathDeco: '#8f9cb8',
  frame: '#aaa4ba', frameLight: '#d6d1e2', frameShade: '#79728e',
  cellA: '#eceaf2', cellB: '#dcd8e6',
  accent: '#e8413b', portal: '#6f9ff0',
  brick: '#a8644f', wood: '#9a6a48', taxi: '#f2c33c', window: '#ffd98a', building: '#5d4f86', building2: '#7a6aa3', web: '#f4f2fa',
};

// ---------------------------------------------------------------- accessoires

const waterTower: Painter = (x, y, s) => {
  const leg = (dx: number) => flat(rectS(x + dx * s - 4 * s, y - 70 * s, 8 * s, 70 * s, 3), '#5b4b5e', SW * 0.7);
  return groundShadow(x, y, 56 * s) + leg(-36) + leg(36) + leg(-14) + leg(14) +
    flat(pathS(`M${n1(x - 38 * s)} ${n1(y - 8 * s)} L${n1(x + 38 * s)} ${n1(y - 48 * s)} M${n1(x + 38 * s)} ${n1(y - 8 * s)} L${n1(x - 38 * s)} ${n1(y - 48 * s)}`), 'none', SW * 0.6) +
    cel(rectS(x - 52 * s, y - 80 * s, 104 * s, 14 * s, 5 * s), '#6a5a6e', { dx: 0, dy: 5 }) +
    cel(rectS(x - 44 * s, y - 172 * s, 88 * s, 96 * s, 12 * s), pal.wood, { dx: 14, dy: 0, gloss: null }) +
    [0.25, 0.55, 0.82].map((k) => `<line x1="${n1(x - 44 * s)}" y1="${n1(y - 172 * s + 96 * s * k)}" x2="${n1(x + 44 * s)}" y2="${n1(y - 172 * s + 96 * s * k)}" stroke="${INK}" stroke-width="${n1(4 * s)}"/>`).join('') +
    cel(pathS(`M${n1(x - 54 * s)} ${n1(y - 168 * s)} Q${n1(x - 20 * s)} ${n1(y - 222 * s)} ${n1(x)} ${n1(y - 226 * s)} Q${n1(x + 20 * s)} ${n1(y - 222 * s)} ${n1(x + 54 * s)} ${n1(y - 168 * s)}Z`), '#6b5d82') +
    flat(circleS(x, y - 230 * s, 6 * s), '#6b5d82', SW * 0.6) +
    gloss(x - 26 * s, y - 150 * s, 6 * s, 16 * s, 0, 0.35);
};

const acUnit: Painter = (x, y, s) =>
  groundShadow(x, y, 44 * s) +
  cel(rectS(x - 42 * s, y - 56 * s, 84 * s, 56 * s, 10 * s), '#9ea6b6', { dx: 10, dy: 0 }) +
  flat(circleS(x - 2 * s, y - 28 * s, 19 * s), '#69718a', SW * 0.7) +
  `<path d="M${n1(x - 2 * s)} ${n1(y - 44 * s)} L${n1(x - 2 * s)} ${n1(y - 12 * s)} M${n1(x - 18 * s)} ${n1(y - 28 * s)} L${n1(x + 14 * s)} ${n1(y - 28 * s)}" stroke="${INK}" stroke-width="${n1(4 * s)}" stroke-linecap="round"/>` +
  gloss(x - 28 * s, y - 46 * s, 8 * s, 4 * s);

const chimney: Painter = (x, y, s) =>
  groundShadow(x, y, 26 * s) +
  cel(rectS(x - 20 * s, y - 70 * s, 40 * s, 70 * s, 6 * s), pal.brick, { dx: 8, dy: 0 }) +
  [18, 36, 54].map((k) => `<line x1="${n1(x - 20 * s)}" y1="${n1(y - k * s)}" x2="${n1(x + 20 * s)}" y2="${n1(y - k * s)}" stroke="${INK}" stroke-width="${n1(3 * s)}" opacity=".4"/>`).join('') +
  cel(rectS(x - 26 * s, y - 80 * s, 52 * s, 14 * s, 4 * s), '#7c4a3e', { dx: 0, dy: 5 });

const antenna: Painter = (x, y, s) => {
  const top = y - 190 * s;
  let w = groundShadow(x, y, 20 * s) + flat(rectS(x - 4 * s, top, 8 * s, 190 * s, 3), '#585070', SW * 0.7);
  for (const k of [0.15, 0.32]) w += flat(rectS(x - 34 * s, top + 190 * s * k, 68 * s, 7 * s, 3), '#585070', SW * 0.6);
  // toile d'araignée accrochée aux traverses
  const cx = x - 34 * s, cy = top + 190 * s * 0.15;
  const web = `<g stroke="${pal.web}" stroke-width="${n1(2.2 * s)}" fill="none" opacity=".85">` +
    [0, 1, 2, 3, 4].map((i) => { const a = Math.PI * 0.5 + (i * Math.PI) / 8; return `<line x1="${n1(cx)}" y1="${n1(cy)}" x2="${n1(cx + Math.cos(a) * 60 * s)}" y2="${n1(cy + Math.sin(a) * 60 * s)}"/>`; }).join('') +
    [20, 38, 56].map((r) => `<path d="M${n1(cx)} ${n1(cy + r * s)} Q${n1(cx - r * 0.25 * s)} ${n1(cy + r * 0.55 * s)} ${n1(cx - r * 0.7 * s)} ${n1(cy + r * 0.7 * s)} Q${n1(cx - r * 0.7 * s)} ${n1(cy + r * 0.2 * s)} ${n1(cx - r * s)} ${n1(cy)}"/>`).join('') + `</g>`;
  return w + web + flat(circleS(x, top - 4 * s, 7 * s), '#c94b4b', SW * 0.6);
};

const skylight: Painter = (x, y, s) =>
  groundShadow(x, y, 40 * s) +
  cel(rectS(x - 40 * s, y - 22 * s, 80 * s, 22 * s, 5 * s), '#8a8399', { dx: 0, dy: 6 }) +
  cel(pathS(`M${n1(x - 34 * s)} ${n1(y - 22 * s)} L${n1(x)} ${n1(y - 58 * s)} L${n1(x + 34 * s)} ${n1(y - 22 * s)}Z`), '#8fb8d8', { dx: 10, dy: 0 }) +
  `<path d="M${n1(x - 14 * s)} ${n1(y - 30 * s)} L${n1(x - 2 * s)} ${n1(y - 46 * s)}" stroke="#fff" stroke-width="${n1(5 * s)}" stroke-linecap="round" opacity=".6"/>`;

const pipes: Painter = (x, y, s) =>
  groundShadow(x, y, 24 * s) +
  cel(rectS(x - 18 * s, y - 34 * s, 12 * s, 34 * s, 5 * s), '#8c93a6', { dx: 4, dy: 0 }) +
  cel(pathS(`M${n1(x + 2 * s)} ${n1(y)} L${n1(x + 2 * s)} ${n1(y - 26 * s)} Q${n1(x + 2 * s)} ${n1(y - 38 * s)} ${n1(x + 16 * s)} ${n1(y - 38 * s)} L${n1(x + 22 * s)} ${n1(y - 38 * s)} L${n1(x + 22 * s)} ${n1(y - 26 * s)} L${n1(x + 14 * s)} ${n1(y - 26 * s)} L${n1(x + 14 * s)} ${n1(y)}Z`), '#8c93a6', { dx: 4, dy: 0 });

const pigeon: Painter = (x, y, s) =>
  groundShadow(x, y, 14 * s) + cel(ellS(x, y - 12 * s, 15 * s, 11 * s), '#9b97ad', { dx: 4, dy: 3 }) +
  cel(circleS(x + 12 * s, y - 24 * s, 7 * s), '#8a86a0', { dx: 2, dy: 2 }) +
  `<path d="M${n1(x + 18 * s)} ${n1(y - 24 * s)} l7 2 l-7 2z" fill="#e7a23c"/>` + `<circle cx="${n1(x + 13 * s)}" cy="${n1(y - 26 * s)}" r="${n1(1.8 * s)}" fill="${INK}"/>`;

/** Sortie : cage d'escalier en briques avec porte. */
const stairDoor: Painter = (x, y, s) =>
  groundShadow(x, y, 66 * s) +
  cel(rectS(x - 58 * s, y - 104 * s, 116 * s, 104 * s, 10 * s), pal.brick, { dx: 12, dy: 0 }) +
  cel(rectS(x - 64 * s, y - 116 * s, 128 * s, 18 * s, 6 * s), '#7c4a3e', { dx: 0, dy: 6 }) +
  flat(rectS(x - 26 * s, y - 72 * s, 52 * s, 72 * s, 6 * s), '#4a3a58') +
  `<circle cx="${n1(x + 14 * s)}" cy="${n1(y - 36 * s)}" r="${n1(4 * s)}" fill="${pal.taxi}"/>` +
  flat(rectS(x - 20 * s, y - 92 * s, 40 * s, 14 * s, 4 * s), '#e8413b', SW * 0.6);

// ---------------------------------------------------------------- fond

function building(x: number, w: number, h: number, base: number, col: string, spire = 0): string {
  let s = cel(rectS(x, base - h, w, h + 40, 6), col, { dx: Math.min(18, w * 0.18), dy: 0, sw: SW * 0.8 });
  if (spire === 1) s += cel(pathS(`M${n1(x + w * 0.2)} ${n1(base - h)} L${n1(x + w * 0.5)} ${n1(base - h - 70)} L${n1(x + w * 0.8)} ${n1(base - h)}Z`), col, { dx: 6, dy: 0, sw: SW * 0.8 }) + flat(rectS(x + w * 0.5 - 2, base - h - 100, 4, 32, 2), col, 3);
  if (spire === 2) s += cel(rectS(x + w * 0.22, base - h - 30, w * 0.56, 32, 4), col, { dx: 6, dy: 0, sw: SW * 0.8 }) + cel(rectS(x + w * 0.38, base - h - 58, w * 0.24, 30, 3), col, { dx: 4, dy: 0, sw: SW * 0.8 }) + flat(rectS(x + w * 0.5 - 2, base - h - 98, 4, 42, 2), col, 3);
  for (let yy = base - h + 16; yy < base + 30; yy += 22)
    for (let xx = x + 10; xx < x + w - 14; xx += 20)
      if (((xx * 7 + yy * 13) | 0) % 5 < 2) s += `<rect x="${n1(xx)}" y="${n1(yy)}" width="9" height="11" rx="2" fill="${pal.window}" opacity=".85"/>`;
  return s;
}

function skyline(c: Ctx, base: number): string {
  // couche lointaine (silhouettes) puis couche proche
  let s = `<circle cx="760" cy="${base - 30}" r="70" fill="#ffd27d" opacity=".9"/><circle cx="760" cy="${base - 30}" r="100" fill="#ffd27d" opacity=".25"/>`;
  s += `<path d="M0 ${base - 60} ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => `L${i * 110} ${base - 60 - ((i * 37) % 70)} L${i * 110 + 80} ${base - 60 - ((i * 37) % 70)}`).join(' ')} L1000 ${base - 80} L1000 ${base + 40} L0 ${base + 40}Z" fill="${light(pal.building, 0.25)}" opacity=".7"/>`;
  const items: [number, number, number, string, number][] = [
    [-10, 120, 120, pal.building, 0], [110, 90, 170, pal.building2, 2], [205, 110, 100, pal.building, 0],
    [330, 80, 210, pal.building2, 1], [420, 130, 130, pal.building, 0], [560, 90, 160, pal.building2, 0],
    [660, 120, 110, pal.building, 0], [790, 80, 190, pal.building2, 1], [880, 130, 130, pal.building, 0],
  ];
  for (const [x, w, h, col, sp] of items) s += building(x, w, h, base, col, sp);
  return s;
}

/** Bord de toit (parapet) horizontal. */
const parapet = (y: number, x0 = -20, x1 = 1020) =>
  cel(rectS(x0, y - 22, x1 - x0, 30, 6), '#8a8399', { dx: 0, dy: 8 }) +
  Array.from({ length: Math.ceil((x1 - x0) / 60) }, (_, i) => `<line x1="${x0 + i * 60}" y1="${y - 20}" x2="${x0 + i * 60}" y2="${y + 6}" stroke="${INK}" stroke-width="3" opacity=".35"/>`).join('');

/** Rue en contrebas entre deux immeubles, avec trottoirs. */
function street(y: number, h = 90): string {
  // l'immeuble d'en face, toit en briques, sous la rue
  let s = `<rect x="-20" y="${y + h / 2}" width="1040" height="700" fill="#6e4b57"/>`;
  for (let yy = y + h / 2 + 30; yy < 1600; yy += 34) s += `<line x1="-20" y1="${yy}" x2="1020" y2="${yy}" stroke="#5c3d4a" stroke-width="5"/>`;
  s += `<rect x="-20" y="${y - h / 2}" width="1040" height="${h}" fill="#3b3550"/>`;
  s += `<rect x="-20" y="${y - h / 2}" width="1040" height="12" fill="#57506e"/><rect x="-20" y="${y + h / 2 - 12}" width="1040" height="12" fill="#57506e"/>`;
  for (let x = 0; x < 1000; x += 90) s += `<rect x="${x}" y="${y - 3}" width="46" height="6" rx="3" fill="#d9c27a" opacity=".7"/>`;
  return s;
}

function backdrop(c: Ctx): string {
  let s = skyAndGround(c, { groundTexture: 'none' });
  // membrane de toit : lés et joints, quelques taches de gravier
  for (let y = c.z.sky.h; y < 1600; y += 110) s += `<rect x="-10" y="${y}" width="1020" height="55" fill="${pal.ground2}" opacity=".55"/>`;
  for (let i = 0; i < 70; i++) {
    const x = c.rnd() * 1000, y = c.z.sky.h + c.rnd() * (1600 - c.z.sky.h);
    s += `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(3 + c.rnd() * 4)}" fill="${light(pal.ground, 0.12)}"/>`;
  }
  // dalle claire de l'immeuble sous chaque plateau
  for (const b of c.boards) {
    const g = b.grid, m = b.cell * 0.95;
    s += `<rect x="${n1(g.x - m)}" y="${n1(g.y - m)}" width="${n1(g.w + 2 * m)}" height="${n1(g.h + 2 * m)}" rx="${n1(b.cell * 0.4)}" fill="${light(pal.ground, 0.1)}"/>`;
  }
  if (c.mode === 'solo') {
    s += skyline(c, 250);
    s += parapet(276);
    s += street(c.z.strip.y, 100) + parapet(c.z.strip.y - 56) + parapet(c.z.strip.y + 66);
  } else if (c.mode === 'coop') {
    s += skyline(c, 150) + parapet(176);
    s += street(c.z.strip.y, 76) + parapet(c.z.strip.y - 44) + parapet(c.z.strip.y + 52);
    // ruelle profonde entre les deux immeubles (sous la passerelle)
    s += `<rect x="-20" y="${c.boards[0]!.grid.y + c.boards[0]!.grid.h + 40}" width="1040" height="${c.boards[1]!.grid.y - c.boards[0]!.grid.y - c.boards[0]!.grid.h - 80}" fill="#3b3550"/>`;
    s += parapet(c.boards[0]!.grid.y + c.boards[0]!.grid.h + 44) + parapet(c.boards[1]!.grid.y - 30);
  } else {
    s += skyline(c, 175) + parapet(196);
    s += street(c.z.strip.y, 70) + parapet(c.z.strip.y - 40) + parapet(c.z.strip.y + 48);
  }
  return s;
}

// ---------------------------------------------------------------- animations

function taxi(x: number, y: number, flip = false): string {
  const t = flip ? ` transform="translate(${n1(2 * x)} 0) scale(-1 1)"` : '';
  return `<g${t}>` + groundShadow(x, y + 14, 44, 8) +
    cel(rectS(x - 46, y - 14, 92, 28, 10), pal.taxi, { dx: 0, dy: 6, sw: 5 }) +
    cel(rectS(x - 24, y - 32, 50, 22, 8), pal.taxi, { dx: 0, dy: 4, sw: 5 }) +
    `<rect x="${x - 18}" y="${y - 28}" width="18" height="12" rx="3" fill="#7fb6e0"/><rect x="${x + 3}" y="${y - 28}" width="18" height="12" rx="3" fill="#7fb6e0"/>` +
    `<rect x="${x - 10}" y="${y - 40}" width="20" height="8" rx="3" fill="#fff" stroke="${INK}" stroke-width="3"/>` +
    `<path d="M${x - 46} ${y - 2} h92" stroke="${INK}" stroke-width="3" stroke-dasharray="6 6" opacity=".6"/>` +
    flat(circleS(x - 26, y + 14, 9), '#2b2540', 4) + flat(circleS(x + 26, y + 14, 9), '#2b2540', 4) +
    `<circle cx="${x + 44}" cy="${y - 6}" r="4" fill="#fff6c0"/></g>`;
}

function anims(c: Ctx): AnimSpec[] {
  const st = c.z.strip;
  const span = st.x1 - st.x0;
  const list: AnimSpec[] = [
    {
      label: 'Taxis jaunes dans la rue', kind: 'drift', period: 9, dx: span, dy: 0,
      box: { x: st.x0 - 60, y: st.y - 48, w: 120, h: 76 }, markup: taxi(st.x0, st.y + 4),
    },
    {
      label: 'Taxis jaunes dans la rue', kind: 'drift', period: 13, phase: 0.45, dx: -span, dy: 0,
      box: { x: st.x1 - 60, y: st.y - 48, w: 120, h: 76 }, markup: taxi(st.x1, st.y - 6, true),
    },
  ];
  // nuage et pigeons qui passent dans le ciel du couchant
  const skyY = c.mode === 'solo' ? 205 : c.mode === 'coop' ? 70 : 95;
  list.push({
    label: 'Nuages du couchant', kind: 'drift', period: 46, dx: 1200, dy: 0,
    box: { x: -180, y: skyY - 70, w: 160, h: 80 }, markup: cloud(-100, skyY, 0.8, '#f6d0c4'),
  });
  // feux rouges clignotants au sommet des gratte-ciel
  const base = c.mode === 'solo' ? 250 : c.mode === 'coop' ? 150 : 175;
  const lights = [[370, base - 210 - 100], [830, base - 190 - 100], [160, base - 170 - 98]] as const;
  for (const [i, [x, y]] of lights.entries())
    list.push({
      label: 'Balises rouges des antennes', kind: 'blink', period: 1.6, phase: i * 0.33, min: 0.15,
      box: { x: x - 14, y: y - 14, w: 28, h: 28 },
      markup: `<circle cx="${x}" cy="${y}" r="11" fill="#ff5a4e" opacity=".45"/><circle cx="${x}" cy="${y}" r="6" fill="#ff7a6e" stroke="${INK}" stroke-width="2.5"/>`,
    });
  return list;
}

export const toitsNewYork = defineMap({
  id: 'toits-new-york',
  name: 'Toits de New York',
  tagline: 'Au coucher du soleil, de toit en toit.',
  universe: 'marvel',
  heroes: ['spiderman', 'venom'],
  shape: 'steps',
  pathMaterial: 'Toits en béton reliés par des passerelles métalliques',
  pathKind: 'roof',
  frameKind: 'concrete',
  palette: pal,
  backdrop,
  props: {
    big: [waterTower, antenna, waterTower, antenna],
    med: [acUnit, chimney, skylight, acUnit],
    small: [pipes, pigeon, pipes, P.crate('#8a7f9a'), pigeon],
  },
  gate: stairDoor,
  anims,
  sound: 'ville-crepuscule',
  modifiers: { vitesseRapides: 0.1 },
  unlock: { type: 'depart', value: 0 },
  mute: { sat: 0.8, lum: 0.9 },
});

export default toitsNewYork;
