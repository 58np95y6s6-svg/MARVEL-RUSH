// Sanctum Sanctorum (Doctor Strange) : parquet qui se replie (kaléidoscope), bibliothèque,
// artefacts flottants, portails orange.

import {
  type Ctx, type Painter, INK, P, SW, at, cel, circleS, defineMap, ellS, flat, gloss, glow, groundShadow, n1, pathS,
  rectS, scene, spots,
} from './kit';

const pal = {
  bg: '#1f1424',
  sky1: '#2b1b33', sky2: '#4a2f3e',
  ground: '#5a3a36', ground2: '#4f3330',
  path: '#c9925e', pathEdge: '#7d4f35', pathDeco: '#a8723f',
  frame: '#7b4a34', frameLight: '#b77e55', frameShade: '#4f2e22',
  cellA: '#f3ebe2', cellB: '#e4d6c6',
  accent: '#f39a2e', portal: '#ff9a3c',
  carpet: '#8a2f3a', book1: '#5b7bb4', book2: '#b8574a', book3: '#5e9a6a', mystic: '#ffae42',
};

const shelf: Painter = (x, y, s) => {
  let o = groundShadow(x, y, 60 * s) + cel(rectS(x - 56 * s, y - 170 * s, 112 * s, 170 * s, 10 * s), '#6b3f2c', { dx: 12, dy: 0 });
  for (let r = 0; r < 3; r++) {
    const yy = y - 160 * s + r * 52 * s;
    o += `<rect x="${n1(x - 46 * s)}" y="${n1(yy)}" width="${n1(92 * s)}" height="${n1(42 * s)}" fill="#3e2219"/>`;
    for (let i = 0; i < 7; i++) {
      const col = [pal.book1, pal.book2, pal.book3, '#c9a24a'][(i + r) % 4]!;
      const h = (30 + ((i * 7 + r * 3) % 10)) * s;
      o += `<rect x="${n1(x - 44 * s + i * 13 * s)}" y="${n1(yy + 42 * s - h)}" width="${n1(11 * s)}" height="${n1(h)}" rx="2" fill="${col}" stroke="${INK}" stroke-width="2"/>`;
    }
  }
  return o;
};

const globeStand: Painter = (x, y, s) =>
  groundShadow(x, y, 28 * s) + flat(rectS(x - 4 * s, y - 50 * s, 8 * s, 50 * s, 3), '#6b3f2c', SW * 0.7) +
  flat(ellS(x, y - 4 * s, 22 * s, 6 * s), '#6b3f2c', SW * 0.7) +
  cel(circleS(x, y - 74 * s, 26 * s), '#7da7c4', { gloss: null }) +
  `<path d="M${n1(x - 26 * s)} ${n1(y - 74 * s)} Q${n1(x)} ${n1(y - 60 * s)} ${n1(x + 26 * s)} ${n1(y - 74 * s)}" stroke="${INK}" stroke-width="3" fill="none" opacity=".4"/>` +
  gloss(x - 9 * s, y - 86 * s, 7 * s, 4 * s);

const candle: Painter = (x, y, s) =>
  groundShadow(x, y, 16 * s) + cel(rectS(x - 8 * s, y - 32 * s, 16 * s, 32 * s, 4 * s), '#efe2c8', { dx: 4, dy: 0 }) +
  `<path d="M${n1(x)} ${n1(y - 50 * s)} Q${n1(x + 8 * s)} ${n1(y - 38 * s)} ${n1(x)} ${n1(y - 33 * s)} Q${n1(x - 8 * s)} ${n1(y - 38 * s)} ${n1(x)} ${n1(y - 50 * s)}Z" fill="#ffc24a" stroke="${INK}" stroke-width="2.5"/>`;

const books: Painter = (x, y, s) =>
  groundShadow(x, y, 30 * s) +
  cel(rectS(x - 30 * s, y - 14 * s, 60 * s, 14 * s, 3), pal.book2, { dx: 0, dy: 4 }) +
  cel(rectS(x - 24 * s, y - 27 * s, 52 * s, 13 * s, 3), pal.book1, { dx: 0, dy: 4 }) +
  cel(rectS(x - 28 * s, y - 40 * s, 50 * s, 13 * s, 3), pal.book3, { dx: 0, dy: 4 });

const relic: Painter = (x, y, s) =>
  groundShadow(x, y, 30 * s) + cel(rectS(x - 22 * s, y - 50 * s, 44 * s, 50 * s, 6 * s), '#6b3f2c', { dx: 8, dy: 0 }) +
  cel(circleS(x, y - 72 * s, 18 * s), '#5ec27e', { gloss: null }) + flat(circleS(x, y - 72 * s, 7 * s), '#c9a24a', SW * 0.6) + gloss(x - 6 * s, y - 80 * s, 5 * s, 3 * s);

function backdrop(c: Ctx): string {
  return scene(c, {
    texture: 'none', pad: pal.carpet, padMargin: 0.75,
    horizon: (base) => {
      // fenêtre ronde au sceau du Sanctum, boiseries
      let s = `<rect x="-10" y="0" width="1020" height="${base}" fill="#3b2329"/>`;
      for (let x = 30; x < 1000; x += 120) s += `<rect x="${x}" y="0" width="60" height="${base}" fill="#45292f"/>`;
      const cx = 500, cy = base - 90, r = 80;
      s += cel(circleS(cx, cy, r + 14), '#6b3f2c') + `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#9fb6d6" stroke="${INK}" stroke-width="${SW}"/>`;
      s += `<g stroke="${INK}" stroke-width="7" fill="none"><circle cx="${cx}" cy="${cy}" r="${r * 0.55}"/>` +
        [0, 1, 2].map((i) => `<path d="M${cx} ${cy} Q${n1(cx + Math.cos(i * 2.09) * r * 1.1)} ${n1(cy + Math.sin(i * 2.09) * r * 0.2)} ${n1(cx + Math.cos(i * 2.09 + 1) * r)} ${n1(cy + Math.sin(i * 2.09 + 1) * r)}"/>`).join('') + `</g>`;
      s += cel(rectS(-20, base - 6, 1040, 30, 0), '#6b3f2c', { dx: 0, dy: 10 });
      return s;
    },
    after: c.boards.map((b) => {
      // motif de tapis
      const g = b.grid, m = b.cell * 0.62;
      return `<rect x="${g.x - m}" y="${g.y - m}" width="${g.w + 2 * m}" height="${g.h + 2 * m}" rx="${b.cell * 0.3}" fill="none" stroke="#c9a24a" stroke-width="6" opacity=".6" stroke-dasharray="18 10"/>`;
    }).join(''),
  });
}

function anims(c: Ctx) {
  const [a, b, d, e, f] = spots(c);
  const ring = (x: number, y: number, r: number) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="#2b1b33" opacity=".7"/><circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${pal.mystic}" stroke-width="7" stroke-dasharray="10 6"/>` +
    `<circle cx="${x}" cy="${y}" r="${r - 9}" fill="none" stroke="#ffd27a" stroke-width="3" stroke-dasharray="4 8"/>` +
    [0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${n1(x + Math.cos(i) * (r + 4))}" cy="${n1(y + Math.sin(i) * (r + 4))}" r="3" fill="#ffe08a"/>`).join('');
  const book = (x: number, y: number) =>
    `<path d="M${x - 26} ${y - 6} Q${x - 13} ${y - 16} ${x} ${y - 8} Q${x + 13} ${y - 16} ${x + 26} ${y - 6} L${x + 26} ${y + 14} Q${x + 13} ${y + 6} ${x} ${y + 14} Q${x - 13} ${y + 6} ${x - 26} ${y + 14}Z" fill="#f3e6c8" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><path d="M${x} ${y - 8} V${y + 14}" stroke="${INK}" stroke-width="2.5"/>`;
  return [
    at('Portails orange', 'spin', a, 40, ring(a.x, a.y, 34), { period: 6 }),
    at('Portails orange', 'spin', b, 40, ring(b.x, b.y, 34), { period: 7, phase: 0.3 }),
    at('Artefacts flottants', 'bob', d, 36, book(d.x, d.y), { period: 3, amp: 8 }),
    at('Bougies', 'blink', e, 22, glow(e.x, e.y, 7, '#ffc24a'), { period: 1.3, min: 0.5 }),
    at('Bougies', 'blink', f, 22, glow(f.x, f.y, 7, '#ffc24a'), { period: 1.7, min: 0.5, phase: 0.4 }),
  ];
}

export const sanctumSanctorum = defineMap({
  id: 'sanctum-sanctorum',
  name: 'Sanctum Sanctorum',
  tagline: 'Le parquet se replie sur lui-même, gare aux portails.',
  universe: 'marvel',
  heroes: ['strange'],
  shape: 'zigzag',
  pathMaterial: 'Parquet qui se replie (kaléidoscope)',
  pathKind: 'parquet',
  frameKind: 'wood',
  palette: pal,
  backdrop,
  props: { big: [shelf, shelf], med: [globeStand, relic], small: [candle, books, candle, P.crystal('#ffb062')] },
  gate: (x, y, s) => groundShadow(x, y, 60 * s) +
    cel(rectS(x - 50 * s, y - 120 * s, 100 * s, 120 * s, 50 * s), '#6b3f2c', { dx: 10, dy: 0 }) +
    flat(rectS(x - 34 * s, y - 100 * s, 68 * s, 100 * s, 34 * s), '#2b1b33') +
    `<circle cx="${n1(x)}" cy="${n1(y - 50 * s)}" r="${n1(24 * s)}" fill="none" stroke="${pal.mystic}" stroke-width="${n1(5 * s)}"/>`,
  anims,
  sound: 'sanctum-mystique',
  modifiers: { rechargesCompetences: -0.1 },
  unlock: { type: 'vagues', value: 15 },
  mute: { sat: 0.75, lum: 0.88 },
});

export default sanctumSanctorum;
