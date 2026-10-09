// Zootopie (Judy & Nick) : avenue de Savanna Central, quartiers climatisés (toundra et jungle),
// voitures miniatures.

import {
  type Ctx, type Painter, INK, P, SW, across, at, cel, circleS, cloud, defineMap, flat, gloss, groundShadow, n1, pathS,
  polyS, rectS, scene, spots, sparkle,
} from './kit';

const pal = {
  bg: '#14303a',
  sky1: '#6aa8d8', sky2: '#cfe6ee',
  ground: '#7e8a70', ground2: '#748064',
  path: '#6c6a78', pathEdge: '#3f3d4c', pathDeco: '#f2d24a',
  frame: '#a8aab4', frameLight: '#d8dae2', frameShade: '#72747e',
  cellA: '#f0f2ee', cellB: '#dfe4db',
  accent: '#e8913a', portal: '#7ac8ff',
  snow: '#e8f2fa', ice: '#9fd4ee', jungle: '#3f8a4e', fern: '#5aa85a', car: '#e85a5a',
};

const iceBlock: Painter = (x, y, s) =>
  groundShadow(x, y, 30 * s) + cel(polyS([{ x: x - 28 * s, y }, { x: x - 30 * s, y: y - 46 * s }, { x: x - 6 * s, y: y - 70 * s }, { x: x + 24 * s, y: y - 52 * s }, { x: x + 28 * s, y }]), pal.ice, { dx: 9, dy: 0 }) +
  `<path d="M${n1(x - 16 * s)} ${n1(y - 48 * s)} L${n1(x - 4 * s)} ${n1(y - 60 * s)}" stroke="#fff" stroke-width="${n1(5 * s)}" stroke-linecap="round"/>`;

const snowPine: Painter = (x, y, s) => P.pine('#5f8a7a')(x, y, s, () => 0) +
  `<path d="M${n1(x - 30 * s)} ${n1(y - 30 * s)} Q${n1(x)} ${n1(y - 44 * s)} ${n1(x + 30 * s)} ${n1(y - 30 * s)}" stroke="${pal.snow}" stroke-width="${n1(8 * s)}" fill="none" stroke-linecap="round"/>` +
  `<path d="M${n1(x - 18 * s)} ${n1(y - 96 * s)} Q${n1(x)} ${n1(y - 108 * s)} ${n1(x + 18 * s)} ${n1(y - 96 * s)}" stroke="${pal.snow}" stroke-width="${n1(7 * s)}" fill="none" stroke-linecap="round"/>`;

const jungleTree: Painter = P.tree('#3f8a4e', '#6a4a30');

const fern: Painter = (x, y, s) =>
  groundShadow(x, y, 26 * s) + [-50, -20, 20, 50].map((a) => {
    const r = (a * Math.PI) / 180;
    return cel(pathS(`M${n1(x)} ${n1(y)} Q${n1(x + Math.sin(r) * 50 * s - 10 * s)} ${n1(y - 40 * s)} ${n1(x + Math.sin(r) * 60 * s)} ${n1(y - Math.cos(r) * 56 * s)} Q${n1(x + Math.sin(r) * 50 * s + 10 * s)} ${n1(y - 30 * s)} ${n1(x)} ${n1(y)}Z`), pal.fern, { dx: 4, dy: 0, sw: SW * 0.7 });
  }).join('');

const hydrant: Painter = (x, y, s) =>
  groundShadow(x, y, 16 * s) + cel(rectS(x - 10 * s, y - 34 * s, 20 * s, 34 * s, 6 * s), '#d8483a', { dx: 4, dy: 0 }) +
  flat(rectS(x - 16 * s, y - 24 * s, 32 * s, 8 * s, 3), '#d8483a', SW * 0.6) + flat(circleS(x, y - 38 * s, 9 * s), '#d8483a', SW * 0.6);

const busStop: Painter = (x, y, s) =>
  groundShadow(x, y, 46 * s) + flat(rectS(x - 44 * s, y - 80 * s, 6 * s, 80 * s, 2), '#56627a', SW * 0.6) + flat(rectS(x + 38 * s, y - 80 * s, 6 * s, 80 * s, 2), '#56627a', SW * 0.6) +
  cel(rectS(x - 52 * s, y - 92 * s, 104 * s, 16 * s, 6 * s), pal.accent, { dx: 0, dy: 5 }) +
  `<rect x="${n1(x - 36 * s)}" y="${n1(y - 72 * s)}" width="${n1(72 * s)}" height="${n1(50 * s)}" fill="#9fd4ee" opacity=".5" stroke="${INK}" stroke-width="4"/>` +
  cel(rectS(x - 34 * s, y - 24 * s, 68 * s, 10 * s, 3), '#8a6a4a', { dx: 0, dy: 3 });

function skyline(base: number): string {
  let s = '';
  // toundra à gauche, jungle à droite, tours de Savanna Central au centre
  s += `<path d="M-20 ${base + 10} L-20 ${base - 90} Q80 ${base - 150} 180 ${base - 100} Q240 ${base - 70} 300 ${base - 60} L300 ${base + 10}Z" fill="#dbe8f2" stroke="${INK}" stroke-width="5"/>`;
  s += `<path d="M700 ${base + 10} L700 ${base - 70} Q780 ${base - 170} 860 ${base - 110} Q930 ${base - 180} 1020 ${base - 100} L1020 ${base + 10}Z" fill="#4f8a58" stroke="${INK}" stroke-width="5"/>`;
  for (const [x, w, h, col] of [[310, 70, 150, '#e8b26a'], [390, 90, 210, '#d8d0c4'], [490, 60, 260, '#9fc4e0'], [560, 80, 180, '#e8b26a'], [645, 60, 130, '#c8b8d8']] as const) {
    s += cel(rectS(x, base - h, w, h + 20, 8), col, { dx: w * 0.2, dy: 0, sw: SW * 0.8 });
    for (let yy = base - h + 18; yy < base; yy += 26) s += `<rect x="${x + 12}" y="${yy}" width="${w - 24}" height="10" rx="4" fill="#fff" opacity=".45"/>`;
  }
  return s;
}

function backdrop(c: Ctx): string {
  const base = c.mode === 'solo' ? 270 : 118;
  // sol : neige à gauche, jungle à droite, avenue au centre
  const split = `<rect x="0" y="${base}" width="330" height="${1600 - base}" fill="#c9d6dc"/><rect x="670" y="${base}" width="330" height="${1600 - base}" fill="#567e4e"/>`;
  return scene(c, {
    texture: 'none', pad: '#a0a49a', padMargin: 0.9,
    horizon: (b) => cloud(220, b - 190, 0.7) + skyline(b) + split,
  });
}

function anims(c: Ctx) {
  const [a, b, d, e] = spots(c);
  const car = (x: number, y: number) =>
    groundShadow(x, y + 12, 26, 6) + cel(rectS(x - 26, y - 10, 52, 22, 9), pal.car, { dx: 0, dy: 5, sw: 4 }) +
    cel(rectS(x - 14, y - 24, 28, 16, 6), pal.car, { dx: 0, dy: 3, sw: 4 }) + `<rect x="${x - 10}" y="${y - 21}" width="20" height="9" rx="3" fill="#bfe4f6"/>` +
    flat(circleS(x - 15, y + 12, 6), '#2b2540', 3) + flat(circleS(x + 15, y + 12, 6), '#2b2540', 3);
  const flake = (x: number, y: number) => sparkle(x, y, 10, '#ffffff') + sparkle(x + 22, y + 18, 7, '#ffffff') + sparkle(x - 18, y + 24, 6, '#ffffff');
  const lowY = c.mode === 'solo' ? 1130 : 1320;
  return [
    across('Voitures miniatures', lowY, 8, car, { w: 64, h: 40 }),
    across('Voitures miniatures', lowY + 30, 11, (x, y) => car(x, y).replace(new RegExp(pal.car, 'g'), '#4a8ad8'), { w: 64, h: 40 }, { reverse: true, phase: 0.4 }),
    at('Flocons de la toundra', 'bob', a, 36, flake(a.x, a.y - 10), { period: 3.2, amp: 8 }),
    at('Brume de la jungle', 'pulse', b, 40, `<ellipse cx="${b.x}" cy="${b.y}" rx="34" ry="14" fill="#dff0e6" opacity=".55"/><ellipse cx="${b.x + 12}" cy="${b.y - 10}" rx="20" ry="10" fill="#dff0e6" opacity=".45"/>`, { period: 4, amp: 0.12 }),
    at('Feux de circulation', 'blink', e, 16, `<circle cx="${e.x}" cy="${e.y}" r="8" fill="#6ae06a" stroke="${INK}" stroke-width="3"/>`, { period: 2.4, min: 0.2 }),
    at('Flocons de la toundra', 'blink', d, 30, flake(d.x - 4, d.y - 12), { period: 2, min: 0.3 }),
  ];
}

export const zootopie = defineMap({
  id: 'zootopie',
  name: 'Zootopie',
  tagline: 'Savanna Central, entre toundra et forêt tropicale.',
  universe: 'disney',
  heroes: ['nickjudy'],
  shape: 'u',
  pathMaterial: 'Avenue de Savanna Central',
  pathKind: 'asphalt',
  frameKind: 'concrete',
  palette: pal,
  backdrop,
  props: { big: [snowPine, jungleTree], med: [iceBlock, busStop, fern], small: [hydrant, fern, iceBlock] },
  anims,
  sound: 'ville-groove',
  modifiers: { ralentissements: 0.1 },
  unlock: { type: 'vagues', value: 45 },
  mute: { sat: 0.72, lum: 0.88 },
});

export default zootopie;

void gloss;
