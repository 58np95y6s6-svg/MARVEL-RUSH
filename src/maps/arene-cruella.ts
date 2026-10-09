// Arène de Cruella : Manoir De Vil, Londres. Salon noir et blanc, fourrures, voiture rouge,
// brouillard vert. Pendant le boss : le décor passe en noir et blanc, seuls les effets restent colorés.

import { type Ctx, type Painter, INK, SW, across, at, cel, circleS, cloud, defineMap, flat, gloss, groundShadow, n1, pathS, rectS, scene, spots } from './kit';

const pal = {
  bg: '#141414',
  sky1: '#2a2a32', sky2: '#4a4a56',
  ground: '#3a3a42', ground2: '#2e2e36',
  path: '#e8e6ea', pathEdge: '#6a6872', pathDeco: '#2a2830',
  frame: '#2e2c34', frameLight: '#6a6874', frameShade: '#16151a',
  cellA: '#f4f4f6', cellB: '#dedde4',
  accent: '#c0263a', portal: '#7ad86a',
  fur: '#f2f0ec', red: '#c0263a', fog: '#7ad86a',
};

const furCoat: Painter = (x, y, s) =>
  groundShadow(x, y, 30 * s) + flat(rectS(x - 3 * s, y - 130 * s, 6 * s, 130 * s, 2), '#4a4852', SW * 0.6) +
  cel(pathS(`M${n1(x - 30 * s)} ${n1(y - 20 * s)} Q${n1(x - 36 * s)} ${n1(y - 90 * s)} ${n1(x - 16 * s)} ${n1(y - 116 * s)} L${n1(x + 16 * s)} ${n1(y - 116 * s)} Q${n1(x + 36 * s)} ${n1(y - 90 * s)} ${n1(x + 30 * s)} ${n1(y - 20 * s)}Z`), pal.fur, { dx: 8, dy: 0 }) +
  [[-14, -70], [10, -50], [-4, -36], [14, -90]].map(([dx, dy]) => `<ellipse cx="${n1(x + dx! * s)}" cy="${n1(y + dy! * s)}" rx="${n1(6 * s)}" ry="${n1(4 * s)}" fill="${INK}"/>`).join('');

const armchair: Painter = (x, y, s) =>
  groundShadow(x, y, 44 * s) + cel(rectS(x - 40 * s, y - 80 * s, 80 * s, 60 * s, 18 * s), pal.red, { dx: 10, dy: 0 }) +
  cel(rectS(x - 46 * s, y - 40 * s, 92 * s, 32 * s, 12 * s), pal.red, { dx: 0, dy: 6 }) +
  flat(rectS(x - 40 * s, y - 10 * s, 8 * s, 10 * s, 2), INK, 0) + flat(rectS(x + 32 * s, y - 10 * s, 8 * s, 10 * s, 2), INK, 0);

const car: Painter = (x, y, s) =>
  groundShadow(x, y, 80 * s, 12 * s) + cel(pathS(`M${n1(x - 84 * s)} ${n1(y - 14 * s)} Q${n1(x - 84 * s)} ${n1(y - 44 * s)} ${n1(x - 40 * s)} ${n1(y - 46 * s)} L${n1(x - 10 * s)} ${n1(y - 76 * s)} L${n1(x + 34 * s)} ${n1(y - 76 * s)} L${n1(x + 50 * s)} ${n1(y - 46 * s)} Q${n1(x + 86 * s)} ${n1(y - 44 * s)} ${n1(x + 86 * s)} ${n1(y - 14 * s)}Z`), pal.red, { dx: 0, dy: 10 }) +
  `<path d="M${n1(x - 2 * s)} ${n1(y - 70 * s)} L${n1(x + 28 * s)} ${n1(y - 70 * s)} L${n1(x + 40 * s)} ${n1(y - 48 * s)} L${n1(x - 14 * s)} ${n1(y - 48 * s)}Z" fill="#bfe4f6" stroke="${INK}" stroke-width="4"/>` +
  flat(circleS(x - 50 * s, y - 12 * s, 16 * s), '#1d1733') + flat(circleS(x + 52 * s, y - 12 * s, 16 * s), '#1d1733') + gloss(x - 50 * s, y - 40 * s, 14 * s, 4 * s, -5);

const vase: Painter = (x, y, s) =>
  groundShadow(x, y, 20 * s) + cel(pathS(`M${n1(x - 10 * s)} ${n1(y)} Q${n1(x - 24 * s)} ${n1(y - 24 * s)} ${n1(x - 8 * s)} ${n1(y - 44 * s)} L${n1(x + 8 * s)} ${n1(y - 44 * s)} Q${n1(x + 24 * s)} ${n1(y - 24 * s)} ${n1(x + 10 * s)} ${n1(y)}Z`), '#e8e6ea', { dx: 5, dy: 0 }) +
  `<path d="M${n1(x - 14 * s)} ${n1(y - 22 * s)} h${n1(28 * s)}" stroke="${INK}" stroke-width="4"/>`;

function backdrop(c: Ctx): string {
  return scene(c, {
    texture: 'none', pad: '#4a4852', padMargin: 0.9,
    horizon: (base) => {
      let s = `<rect x="-10" y="0" width="1020" height="${base}" fill="#2a2830"/>`;
      for (let x = 0; x < 1000; x += 100) s += `<rect x="${x}" y="0" width="50" height="${base}" fill="#33313b"/>`;
      // grande fenêtre sur Londres la nuit + portrait
      s += cel(rectS(380, base - 220, 240, 190, 100), '#5a5a68') + `<rect x="396" y="${base - 206}" width="208" height="176" rx="90" fill="#8a96a8" stroke="${INK}" stroke-width="5"/>`;
      s += `<path d="M420 ${base - 30} L420 ${base - 90} L460 ${base - 90} L460 ${base - 130} L470 ${base - 170} L480 ${base - 130} L480 ${base - 90} L540 ${base - 90} L540 ${base - 30}Z" fill="#4a4a58"/>`;
      s += cel(rectS(-20, base - 6, 1040, 30, 0), '#4a4852', { dx: 0, dy: 10 });
      return s;
    },
    after: c.boards.map((b) => {
      // sol en damier noir et blanc autour du plateau
      const g = b.grid, m = b.cell * 0.9, t = b.cell * 0.45;
      let s = '';
      for (let y = g.y - m, r = 0; y < g.y + g.h + m - 1; y += t, r++) for (let x = g.x - m, k = 0; x < g.x + g.w + m - 1; x += t, k++) if ((r + k) % 2) s += `<rect x="${n1(x)}" y="${n1(y)}" width="${n1(t)}" height="${n1(t)}" fill="#26252c"/>`;
      return s;
    }).join(''),
  });
}

function anims(c: Ctx) {
  const [a, b, d] = spots(c);
  const fog = (x: number, y: number) => cloud(x, y, 0.5, pal.fog);
  return [
    across('Brouillard vert', c.mode === 'solo' ? 1150 : 1330, 22, fog, { w: 90, h: 40 }),
    across('Brouillard vert', c.mode === 'solo' ? 170 : 70, 30, fog, { w: 90, h: 40 }, { reverse: true, phase: 0.5 }),
    at('Fourrures qui frémissent', 'sway', a, 40, furCoat(a.x, a.y + 34, 0.5, () => 0), { period: 2.6, amp: 4, oy: a.y - 30 }),
    at('Fourrures qui frémissent', 'sway', b, 40, furCoat(b.x, b.y + 34, 0.5, () => 0), { period: 3, amp: 4, oy: b.y - 30, phase: 0.5 }),
    at('Fume-cigarette', 'pulse', d, 30, `<circle cx="${d.x}" cy="${d.y}" r="14" fill="${pal.fog}" opacity=".5"/><circle cx="${d.x + 14}" cy="${d.y - 14}" r="9" fill="${pal.fog}" opacity=".4"/>`, { period: 2.8, amp: 0.2 }),
  ];
}

export const areneCruella = defineMap({
  id: 'arene-cruella',
  name: 'Manoir De Vil',
  tagline: 'Le salon noir et blanc de Cruella, à Londres.',
  universe: 'boss',
  heroes: [],
  boss: 'cruella',
  shape: 'u',
  pathMaterial: 'Damier noir et blanc',
  pathKind: 'checker',
  frameKind: 'obsidian',
  palette: pal,
  backdrop,
  props: { big: [car, furCoat], med: [armchair, furCoat], small: [vase, vase] },
  anims,
  sound: 'jazz-inquietant',
  unlock: { type: 'depart', value: 0 },
  bossFx: { description: 'Le décor passe en noir et blanc ; seuls les effets et les unités restent colorés.', effects: ['grayscale'] },
  mute: { sat: 0.6, lum: 0.86 },
});

export default areneCruella;
