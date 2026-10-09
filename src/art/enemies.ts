// Ennemis génériques (§7) dans le style des sbires des planches : créatures-feuilles, slimes, petits robots.
// Repère des sbires : sol à y = 207, centre x = 100, regard vers la droite (sens de la marche).
import { O, f, shaded, gloss, glow, limb, star, shadow, clip } from './primitives';
import { scallop } from './kits/disneyA';

export type EnemyLook = 'normal' | 'rapide' | 'gros' | 'blinde' | 'bouclier';
/** 0 créature-feuille, 1 slime, 2 petit robot. */
export const ENEMY_FAMILIES = ['feuille', 'slime', 'robot'] as const;

interface Pal {
  c: string;
  d: string;
  hi: string;
}
const LEAF: Pal = { c: '#72c34c', d: '#44892c', hi: '#c9f59a' };
const SLIME: Pal = { c: '#b36ae6', d: '#7d3fb4', hi: '#f0d4ff' };
const ROBOT: Pal = { c: '#a9bad0', d: '#6c7d96', hi: '#eef4ff' };
const STEEL = '#c3cad6', STEELD = '#7f889a';

/** Yeux méchants mignons, tournés vers la droite. */
function eyes(cx: number, cy: number, s: number, glowC?: string): string {
  let r = '';
  for (const [ex, d] of [[cx - 9 * s, 1], [cx + 9 * s, -1]] as const) {
    r += `<ellipse cx="${f(ex)}" cy="${f(cy)}" rx="${f(5.4 * s)}" ry="${f(6.6 * s)}" fill="#fff" stroke="${O}" stroke-width="2.4"/>`;
    r += `<ellipse cx="${f(ex + 1.8 * s)}" cy="${f(cy + 1 * s)}" rx="${f(3 * s)}" ry="${f(4 * s)}" fill="${glowC ?? O}"/><circle cx="${f(ex + 2.8 * s)}" cy="${f(cy - 1 * s)}" r="${f(1.2 * s)}" fill="#fff"/>`;
    r += `<path d="M${f(ex - 6 * d * s)} ${f(cy - 10 * s)} L${f(ex + 5 * d * s)} ${f(cy - 6 * s)}" stroke="${O}" stroke-width="${f(3 * s)}" stroke-linecap="round"/>`;
  }
  return r;
}
const grin = (cx: number, cy: number, w: number): string =>
  `<path d="M${cx - w} ${cy} Q${cx} ${cy + w * 0.9} ${cx + w} ${cy - 2} Q${cx} ${cy + w * 0.35} ${cx - w} ${cy}Z" fill="#5c0f22" stroke="${O}" stroke-width="2.6" stroke-linejoin="round"/><path d="M${f(cx - w * 0.5)} ${f(cy + 1)} l2 4 l2 -4 M${f(cx + w * 0.3)} ${f(cy + 0.5)} l2 4 l2 -4" fill="#fff" stroke="${O}" stroke-width="1.2"/>`;

/* ---------- les trois familles (taille normale, centre du corps vers (100, 160)) ---------- */
function leafBody(): string {
  const P = LEAF;
  let s = '';
  s += limb(86, 190, 84, 202, P.d, 9) + limb(112, 190, 116, 202, P.d, 9);
  s += `<ellipse cx="82" cy="204" rx="9" ry="4.5" fill="${O}"/><ellipse cx="118" cy="204" rx="9" ry="4.5" fill="${O}"/>`;
  const bush = (a: string): string => `<path d="${scallop(100, 162, 40, 34, 11, 7, 0.6)}" ${a}/>`;
  s += shaded(bush, P.c, P.d, -5, -5);
  s += clip(bush, `<path d="M70 150 Q80 160 76 172 M128 146 Q120 160 126 170 M96 186 Q100 176 108 186" stroke="${P.d}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`);
  s += gloss(80, 140, 9, 4, -35, 0.55);
  // pousse sur la tête
  s += `<path d="M100 130 Q98 116 104 108" stroke="${O}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M100 130 Q98 116 104 108" stroke="#5a9a30" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M104 110 Q118 96 128 104 Q118 118 104 110Z" fill="${P.c}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M106 110 Q116 104 124 105" stroke="${P.d}" stroke-width="1.6" fill="none"/>`;
  s += `<path d="M102 114 Q88 102 80 110 Q90 122 102 114Z" fill="${P.hi}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`;
  s += eyes(108, 156, 1) + grin(110, 172, 10);
  return s;
}
function slimeBody(): string {
  const P = SLIME;
  let s = '';
  const blob = (a: string): string => `<path d="M58 200 Q50 186 62 170 Q70 132 100 124 Q132 128 140 166 Q152 184 142 200 Q132 206 122 200 Q114 208 104 202 Q92 208 84 201 Q70 207 58 200Z" ${a}/>`;
  s += shaded(blob, P.c, P.d, -6, -6);
  s += clip(blob, `<ellipse cx="100" cy="206" rx="50" ry="10" fill="${P.d}" opacity=".6"/>`);
  s += gloss(78, 146, 12, 6, -35, 0.6) + `<circle cx="70" cy="166" r="3" fill="#fff" opacity=".7"/><circle cx="128" cy="140" r="4" fill="${P.hi}" opacity=".8"/>`;
  s += `<circle cx="84" cy="182" r="5" fill="${P.d}" opacity=".55"/><circle cx="122" cy="186" r="3.5" fill="${P.d}" opacity=".55"/>`;
  s += eyes(108, 158, 1.05) + grin(110, 176, 11);
  return s;
}
function robotBody(): string {
  const P = ROBOT;
  let s = '';
  // chenille
  s += shaded((a) => `<rect x="62" y="188" width="76" height="18" rx="9" ${a}/>`, '#4a4f60', '#2c2f3a', -2, -2);
  s += [74, 90, 106, 122].map((cx) => `<circle cx="${cx + 4}" cy="197" r="5" fill="#8a91a3" stroke="${O}" stroke-width="2.2"/>`).join('');
  // corps-tête
  const box = (a: string): string => `<rect x="62" y="128" width="76" height="62" rx="16" ${a}/>`;
  s += shaded(box, P.c, P.d, -5, -5) + gloss(78, 138, 9, 4, -30, 0.6);
  s += `<path d="M66 172 H134" stroke="${P.d}" stroke-width="3"/><circle cx="74" cy="181" r="2.6" fill="${P.d}"/><circle cx="126" cy="181" r="2.6" fill="${P.d}"/>`;
  // antenne
  s += `<path d="M100 128 V108" stroke="${O}" stroke-width="7" stroke-linecap="round"/><path d="M100 128 V108" stroke="${P.d}" stroke-width="3" stroke-linecap="round"/>`;
  s += `<g class="fx"><circle cx="100" cy="104" r="9" fill="#ff4f4f" opacity=".35"/></g><circle cx="100" cy="104" r="5.5" fill="#ff4f4f" stroke="${O}" stroke-width="2.5"/><circle cx="98.5" cy="102.5" r="1.6" fill="#fff"/>`;
  // visière
  s += `<rect x="76" y="140" width="56" height="22" rx="11" fill="#2a2b40" stroke="${O}" stroke-width="3.5"/>`;
  s += glow(112, 151, 12, '#ff5a4a') + `<ellipse cx="112" cy="151" rx="8" ry="5" fill="#ff5a4a"/><path d="M104 144 L120 148" stroke="${O}" stroke-width="2.6" stroke-linecap="round"/>`;
  // petits bras
  s += limb(62, 160, 52, 176, P.d, 7) + `<circle cx="52" cy="178" r="5.5" fill="${P.c}" stroke="${O}" stroke-width="2.6"/>`;
  s += limb(138, 160, 148, 174, P.d, 7) + `<circle cx="148" cy="176" r="5.5" fill="${P.c}" stroke="${O}" stroke-width="2.6"/>`;
  return s;
}
const BODIES = [leafBody, slimeBody, robotBody];
/** Haut du corps (pour poser un casque) par famille. */
const TOP = [128, 124, 128];

/* ---------- variantes de type ---------- */
function helmet(top: number): string {
  const y = top + 2;
  const dome = (a: string): string => `<path d="M62 ${y + 22} Q60 ${y - 14} 100 ${y - 16} Q140 ${y - 14} 138 ${y + 22} Q100 ${y + 12} 62 ${y + 22}Z" ${a}/>`;
  return shaded(dome, STEEL, STEELD, -4, -4) + gloss(80, y - 6, 9, 3.5, -20, 0.7) +
    `<path d="M64 ${y + 16} Q100 ${y + 6} 136 ${y + 16}" stroke="${STEELD}" stroke-width="3" fill="none"/>` +
    [70, 85, 115, 130].map((cx) => `<circle cx="${cx}" cy="${y + 14 - (cx > 80 && cx < 120 ? 3 : 0)}" r="2.2" fill="${STEELD}" stroke="${O}" stroke-width="1.4"/>`).join('') +
    `<polygon points="100,${y - 30} 94,${y - 14} 106,${y - 14}" fill="${STEEL}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`;
}
function plate(): string {
  return shaded((a) => `<path d="M70 168 Q100 160 130 168 L126 192 Q100 200 74 192Z" ${a}/>`, STEEL, STEELD, -3, -3) +
    `<path d="M100 164 V196" stroke="${STEELD}" stroke-width="2.5"/>` +
    [[78, 174], [122, 174], [80, 188], [120, 188]].map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="2.2" fill="#fff" stroke="${O}" stroke-width="1.4"/>`).join('');
}
function shield(family: number): string {
  if (family === 2) {
    // bouclier d'énergie hexagonal
    const hex = (a: string): string => `<polygon points="${star(152, 166, 30, 30, 3, Math.PI / 6)}" ${a}/>`;
    return `<g class="fx"><polygon points="${star(152, 166, 38, 38, 3, Math.PI / 6)}" fill="#7fd8ff" opacity=".25"/></g>` +
      hex(`fill="#7fd8ff" fill-opacity=".55" stroke="${O}" stroke-width="4" stroke-linejoin="round"`) +
      `<polygon points="${star(152, 166, 18, 18, 3, Math.PI / 6)}" fill="none" stroke="#fff" stroke-width="2.5" opacity=".8"/>` + gloss(142, 152, 7, 3, -30, 0.8);
  }
  const disc = (a: string): string => `<circle cx="150" cy="168" r="27" ${a}/>`;
  return shaded(disc, '#b5773e', '#7f4f22', -4, -4) +
    `<circle cx="150" cy="168" r="20" fill="none" stroke="#7f4f22" stroke-width="3"/><path d="M128 168 H172 M150 146 V190" stroke="#7f4f22" stroke-width="2.5"/>` +
    `<circle cx="150" cy="168" r="27" fill="none" stroke="${STEEL}" stroke-width="5"/><circle cx="150" cy="168" r="27" fill="none" stroke="${O}" stroke-width="2" opacity=".5"/>` +
    shaded((a) => `<circle cx="150" cy="168" r="8" ${a}/>`, STEEL, STEELD, -2, -2) + gloss(140, 154, 7, 3, -35, 0.6);
}
function speedLines(): string {
  let s = '';
  for (const [y, len] of [[146, 30], [164, 40], [182, 28]] as const) {
    s += `<path d="M${54 - len} ${y} H48" stroke="${O}" stroke-width="7" stroke-linecap="round"/><path d="M${54 - len} ${y} H48" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;
  }
  return s;
}

/** Dessin (sans balise <svg>) d'un ennemi générique. */
export function drawEnemy(kind: EnemyLook, variant = 0): string {
  const fam = ((Math.floor(variant) % 3) + 3) % 3;
  const body = BODIES[fam]!();
  const top = TOP[fam]!;
  switch (kind) {
    case 'rapide':
      return shadow(32, 207, 0.16) + `<g transform="translate(100 207) scale(.8) rotate(8) translate(-100 -207)">${speedLines()}${body}</g>`;
    case 'gros':
      return shadow(58, 207, 0.18) + `<g transform="translate(100 207) scale(1.3) translate(-100 -207)">${body}</g>`;
    case 'blinde':
      return shadow(44, 207, 0.17) + body + plate() + helmet(top);
    case 'bouclier':
      return shadow(46, 207, 0.17) + body + shield(fam);
    default:
      return shadow(42, 207, 0.16) + body;
  }
}
