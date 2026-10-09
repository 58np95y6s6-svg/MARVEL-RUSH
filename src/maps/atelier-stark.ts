// Atelier Stark (Iron Man) : tapis roulant métallique, hologrammes bleus, bras robotisés,
// armures en vitrine, étincelles.

import {
  type Ctx, type Painter, INK, P, SW, at, cel, circleS, defineMap, ellS, flat, gloss, glow, groundShadow, n1, pathS,
  rectS, scene, spots, sparkle,
} from './kit';

const pal = {
  bg: '#141a2c',
  sky1: '#1f2a4a', sky2: '#3d5a86',
  ground: '#3a4258', ground2: '#333a4f',
  path: '#5d6680', pathEdge: '#9aa4bb', pathDeco: '#2c3247',
  frame: '#8e98ad', frameLight: '#c9d1e0', frameShade: '#5f6880',
  cellA: '#e7ecf4', cellB: '#d4dbe8',
  accent: '#e8413b', portal: '#5fd4ff',
  holo: '#6fdcff', gold: '#e8b84a', red: '#c8443c', steel: '#8790a8',
};

const robotArm: Painter = (x, y, s) =>
  groundShadow(x, y, 44 * s) +
  cel(rectS(x - 36 * s, y - 28 * s, 72 * s, 28 * s, 10 * s), pal.steel, { dx: 0, dy: 6 }) +
  cel(rectS(x - 12 * s, y - 110 * s, 24 * s, 90 * s, 10 * s), pal.gold, { dx: 6, dy: 0 }) +
  flat(circleS(x, y - 112 * s, 16 * s), pal.steel) +
  cel(pathS(`M${n1(x)} ${n1(y - 124 * s)} L${n1(x + 74 * s)} ${n1(y - 160 * s)} L${n1(x + 84 * s)} ${n1(y - 144 * s)} L${n1(x + 8 * s)} ${n1(y - 100 * s)}Z`), pal.gold, { dx: 0, dy: 6 }) +
  flat(circleS(x + 80 * s, y - 152 * s, 11 * s), pal.steel) +
  flat(pathS(`M${n1(x + 86 * s)} ${n1(y - 146 * s)} L${n1(x + 100 * s)} ${n1(y - 128 * s)} M${n1(x + 90 * s)} ${n1(y - 158 * s)} L${n1(x + 108 * s)} ${n1(y - 152 * s)}`), 'none', SW * 0.9) +
  gloss(x - 4 * s, y - 92 * s, 4 * s, 14 * s, 0, 0.4);

const armorCase: Painter = (x, y, s) =>
  groundShadow(x, y, 50 * s) +
  cel(rectS(x - 46 * s, y - 24 * s, 92 * s, 24 * s, 6 * s), '#4b536b', { dx: 0, dy: 6 }) +
  // armure (casque + plastron) en silhouette
  cel(pathS(`M${n1(x - 26 * s)} ${n1(y - 24 * s)} L${n1(x - 30 * s)} ${n1(y - 96 * s)} Q${n1(x)} ${n1(y - 112 * s)} ${n1(x + 30 * s)} ${n1(y - 96 * s)} L${n1(x + 26 * s)} ${n1(y - 24 * s)}Z`), pal.red, { dx: 8, dy: 0 }) +
  flat(circleS(x, y - 70 * s, 9 * s), pal.holo, SW * 0.6) +
  cel(ellS(x, y - 128 * s, 22 * s, 26 * s), pal.red, { dx: 5, dy: 0 }) +
  flat(rectS(x - 14 * s, y - 136 * s, 28 * s, 16 * s, 4 * s), pal.gold, SW * 0.6) +
  `<rect x="${n1(x - 50 * s)}" y="${n1(y - 170 * s)}" width="${n1(100 * s)}" height="${n1(146 * s)}" rx="${n1(10 * s)}" fill="${pal.holo}" opacity=".14" stroke="${INK}" stroke-width="${SW}"/>` +
  `<path d="M${n1(x - 38 * s)} ${n1(y - 150 * s)} L${n1(x - 20 * s)} ${n1(y - 166 * s)}" stroke="#fff" stroke-width="${n1(6 * s)}" stroke-linecap="round" opacity=".6"/>`;

const bench: Painter = (x, y, s) =>
  groundShadow(x, y, 50 * s) +
  flat(rectS(x - 40 * s, y - 40 * s, 8 * s, 40 * s, 2), '#4b536b', SW * 0.7) + flat(rectS(x + 32 * s, y - 40 * s, 8 * s, 40 * s, 2), '#4b536b', SW * 0.7) +
  cel(rectS(x - 50 * s, y - 56 * s, 100 * s, 18 * s, 5 * s), pal.steel, { dx: 0, dy: 5 }) +
  cel(rectS(x - 30 * s, y - 76 * s, 30 * s, 20 * s, 4 * s), pal.red, { dx: 5, dy: 0 }) +
  flat(circleS(x + 22 * s, y - 64 * s, 8 * s), pal.gold, SW * 0.6);

const barrel: Painter = (x, y, s) =>
  groundShadow(x, y, 22 * s) + cel(rectS(x - 18 * s, y - 44 * s, 36 * s, 44 * s, 8 * s), '#6a7590', { dx: 8, dy: 0 }) +
  `<line x1="${n1(x - 18 * s)}" y1="${n1(y - 30 * s)}" x2="${n1(x + 18 * s)}" y2="${n1(y - 30 * s)}" stroke="${INK}" stroke-width="3"/><line x1="${n1(x - 18 * s)}" y1="${n1(y - 14 * s)}" x2="${n1(x + 18 * s)}" y2="${n1(y - 14 * s)}" stroke="${INK}" stroke-width="3"/>`;

function backdrop(c: Ctx): string {
  return scene(c, {
    texture: 'tiles', pad: '#454e66', padMargin: 0.9,
    horizon: (base) => {
      // baie vitrée sur l'océan de Malibu au crépuscule
      let s = `<rect x="-10" y="${base - 150}" width="1020" height="150" fill="#2b3c66"/>`;
      s += `<rect x="-10" y="${base - 46}" width="1020" height="46" fill="#284a6e"/>`;
      for (let x = 0; x < 1000; x += 125) s += flat(rectS(x - 8, base - 160, 16, 170, 4), '#4b536b', SW * 0.7);
      s += cel(rectS(-20, base - 10, 1040, 40, 0), '#4b536b', { dx: 0, dy: 10 });
      for (let x = 60; x < 1000; x += 250) s += `<rect x="${x}" y="${base + 50}" width="140" height="8" rx="4" fill="${pal.holo}" opacity=".35"/>`;
      return s;
    },
  });
}

function anims(c: Ctx) {
  const [a, b, d, e, f] = spots(c);
  const holo = (x: number, y: number) =>
    `<ellipse cx="${x}" cy="${y + 26}" rx="34" ry="10" fill="${pal.holo}" opacity=".5" stroke="${INK}" stroke-width="3"/>` +
    `<path d="M${x - 30} ${y + 24} L${x - 22} ${y - 26} L${x + 22} ${y - 26} L${x + 30} ${y + 24}Z" fill="${pal.holo}" opacity=".18"/>` +
    `<circle cx="${x}" cy="${y - 6}" r="16" fill="none" stroke="${pal.holo}" stroke-width="4"/><path d="M${x - 24} ${y - 6} h48 M${x} ${y - 30} v48" stroke="${pal.holo}" stroke-width="2.5" opacity=".8"/>`;
  return [
    at('Hologrammes bleus', 'pulse', a, 40, holo(a.x, a.y), { period: 2.4, amp: 0.08 }),
    at('Hologrammes bleus', 'blink', b, 40, holo(b.x, b.y), { period: 1.9, min: 0.35, phase: 0.3 }),
    at('Étincelles de soudure', 'blink', d, 30, sparkle(d.x, d.y, 18, '#ffe48a') + sparkle(d.x + 14, d.y + 10, 9, '#fff'), { period: 0.7, min: 0 }),
    at('Réacteurs Arc', 'pulse', e, 26, glow(e.x, e.y, 10, pal.holo), { period: 2, amp: 0.15 }),
    at('Réacteurs Arc', 'pulse', f, 26, glow(f.x, f.y, 10, pal.holo), { period: 2, amp: 0.15, phase: 0.5 }),
  ];
}

export const atelierStark = defineMap({
  id: 'atelier-stark',
  name: 'Atelier Stark',
  tagline: 'Le laboratoire de Malibu, entre deux prototypes.',
  universe: 'marvel',
  heroes: ['ironman'],
  shape: 'u',
  pathMaterial: 'Tapis roulant métallique',
  pathKind: 'belt',
  frameKind: 'metal',
  palette: pal,
  backdrop,
  props: { big: [armorCase, robotArm], med: [bench, robotArm], small: [barrel, P.crate('#6a7590'), barrel] },
  gate: (x, y, s) => groundShadow(x, y, 64 * s) +
    cel(rectS(x - 58 * s, y - 108 * s, 116 * s, 108 * s, 12 * s), '#4b536b', { dx: 12, dy: 0 }) +
    flat(rectS(x - 40 * s, y - 88 * s, 80 * s, 88 * s, 6 * s), '#242a3d') +
    [0, 1, 2, 3].map((i) => `<rect x="${n1(x - 40 * s)}" y="${n1(y - 80 * s + i * 20 * s)}" width="${n1(80 * s)}" height="${n1(8 * s)}" fill="#e8b84a" opacity=".7"/>`).join('') +
    flat(circleS(x, y - 98 * s, 6 * s), pal.holo, SW * 0.5),
  anims,
  sound: 'atelier-techno',
  modifiers: { degatsRayons: 0.1 },
  unlock: { type: 'vagues', value: 5 },
});

export default atelierStark;
