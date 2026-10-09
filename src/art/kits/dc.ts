// Pièces communes aux personnages DC (capes, cagoules, masques, emblèmes, projectiles),
// dessinées avec les primitives des planches : contours #1d1733, cel-shading en deux tons, reflets.
import { O, f, shaded, gloss, mirror, type Num, type Shape } from '../primitives';

/** Peau mate (Black Adam, Shazam bronzé…) et peau foncée (Cyborg). */
export const SKT = '#e8b48a', SKTD = '#c2855d';
export const SKB = '#8a5636', SKBD = '#5f3620';

/** Cape dans le dos, qui dépasse du buste (à dessiner avant le torse). */
export function cape(c: string, d: string, spread = 0, top = 140): string {
  const l = 28 - spread, r = 172 + spread;
  return shaded((a) => `<path d="M56 ${top} Q${l - 2} ${top + 36} ${l} 204 L${r} 204 Q${r + 2} ${top + 36} 144 ${top}Z" ${a}/>`, c, d, 8, -4) +
    `<path d="M${l + 16} 170 Q${l + 12} 190 ${l + 14} 204 M${r - 16} 170 Q${r - 12} 190 ${r - 14} 204" stroke="${d}" stroke-width="3" fill="none"/>`;
}
/** Agrafes de cape aux épaules. */
export const clasps = (c: string): string =>
  `<circle cx="72" cy="140" r="6" fill="${c}" stroke="${O}" stroke-width="3"/><circle cx="128" cy="140" r="6" fill="${c}" stroke="${O}" stroke-width="3"/>`;

/** Cagoule couvrant le haut de la tête jusqu'au nez (Batman, Batgirl, Flash, Catwoman). */
export const cowlS: Shape = (a) =>
  `<path d="M44 86 Q44 28 100 28 Q156 28 156 86 L154 104 Q150 118 134 121 Q120 108 100 110 Q80 108 66 121 Q50 118 46 104Z" ${a}/>`;
export function cowl(c: string, d: string): string {
  return shaded(cowlS, c, d) + gloss(76, 50, 14, 7, -35, 0.4);
}
/** Oreilles pointues de la cagoule (chauve-souris ou chat). */
export function ears(c: string, d: string, kind: 'bat' | 'cat' = 'bat'): string {
  const e = kind === 'bat'
    ? shaded((a) => `<path d="M58 54 L60 8 L84 36Z" ${a}/>`, c, d, -2, -2)
    : shaded((a) => `<path d="M52 62 L56 18 L86 40Z" ${a}/>`, c, d, -2, -2) + `<path d="M59 50 L61 30 L74 40Z" fill="#e88aa8" stroke="${O}" stroke-width="2"/>`;
  return e + mirror(e);
}
/** Yeux blancs en fente sous la cagoule ou le masque (p : pose). */
export function lenses(p: number, glowC?: string): string {
  const e = p === 2
    ? `<path d="M66 90 L94 98 Q92 104 84 104 Q70 102 66 90Z"/>`
    : p === 1
      ? `<path d="M67 90 L94 96 Q93 104 84 104 Q70 103 67 90Z"/>`
      : `<path d="M68 88 L94 95 Q94 105 84 105 Q70 104 68 88Z"/>`;
  const g = glowC ? `<g class="fx"><ellipse cx="82" cy="98" rx="16" ry="9" fill="${glowC}" opacity=".45"/>${mirror(`<ellipse cx="82" cy="98" rx="16" ry="9" fill="${glowC}" opacity=".45"/>`)}</g>` : '';
  return g + `<g fill="#fbfdff" stroke="${O}" stroke-width="3.5" stroke-linejoin="round">${e}${mirror(e)}</g>`;
}
/** Bouche sous la cagoule : 0 sérieux, 1 dents serrées, 2 cri. */
export function jaw(p: number, y = 126): string {
  if (p == 0) return `<path d="M90 ${y} Q100 ${y - 3} 110 ${y}" stroke="${O}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  if (p == 1) return `<rect x="89" y="${y - 4}" width="22" height="8" rx="3" fill="#fff" stroke="${O}" stroke-width="3"/><path d="M96 ${y - 4} V${y + 4} M104 ${y - 4} V${y + 4}" stroke="${O}" stroke-width="1.6"/>`;
  return `<path d="M88 ${y - 4} Q100 ${y - 6} 112 ${y - 4} Q110 ${y + 9} 100 ${y + 10} Q90 ${y + 9} 88 ${y - 4}Z" fill="#7a1f2b" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/><path d="M90 ${y - 3} H110" stroke="#fff" stroke-width="3"/>`;
}
/** Loup (masque domino) posé sous les yeux de `face`. */
export function domino(c: string, d: string): string {
  const m = `<path d="M62 86 Q80 78 98 90 Q101 98 98 104 Q84 110 66 106 Q58 96 62 86Z"/>`;
  return `<g fill="${c}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round">${m}${mirror(m)}</g><path d="M66 90 Q78 85 90 90" stroke="${d}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
}

/* ---------- emblèmes (dessinés autour de l'origine, à placer avec translate/scale) ---------- */
/** Bouclier de Superman (losange jaune et S rouge). */
export function sShield(x: Num, y: Num, s = 1, r = '#d42e35', bg = '#f6c64a'): string {
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-17 -12 H17 L22 -5 L0 18 L-22 -5Z" fill="${r}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/>` +
    `<path d="M-12 -8 H12 L15 -4 L0 12 L-15 -4Z" fill="${bg}"/>` +
    `<path d="M9 -5 H-5 Q-10 -5 -9 -1 Q-8 2 -3 2 H4 Q8 2 6 6 L1 10 M-12 -1 L-8 4" stroke="${r}" stroke-width="3.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`;
}
/** Silhouette de chauve-souris (largeur ≈ 40 × s). */
export const batPath = 'M-20 0 Q-14 -7 -7 -5 L-5 -10 L-2.5 -5 H2.5 L5 -10 L7 -5 Q14 -7 20 0 Q13 -1 11 5 Q7 1 3 5 L0 10 L-3 5 Q-7 1 -11 5 Q-13 -1 -20 0Z';
export const batSym = (x: Num, y: Num, s: number, c: string, sw = 2): string =>
  `<path d="${batPath}" transform="translate(${x} ${y}) scale(${s})" fill="${c}" stroke="${O}" stroke-width="${f(sw / s)}" stroke-linejoin="round"/>`;
/** Éclair d'emblème (Flash, Shazam, Black Adam). */
export const boltPath = 'M3 -18 L-10 2 H-1 L-6 18 L11 -4 H2 L8 -18Z';
export const boltSym = (x: Num, y: Num, s: number, c: string, sw = 3): string =>
  `<path d="${boltPath}" transform="translate(${x} ${y}) scale(${s})" fill="${c}" stroke="${O}" stroke-width="${f(sw / s)}" stroke-linejoin="round"/>`;

/** Lignes de vitesse horizontales (traînée derrière un objet ou un coup). */
export function speedLines(x: number, y: number, len: number, c = '#fff', k = 3, gap = 9): string {
  let s = '';
  for (let i = 0; i < k; i++) {
    const yy = y + (i - (k - 1) / 2) * gap, l = len * (i % 2 ? 0.7 : 1);
    s += `<path d="M${f(x)} ${f(yy)} H${f(x - l)}" stroke="${O}" stroke-width="7" stroke-linecap="round"/><path d="M${f(x)} ${f(yy)} H${f(x - l)}" stroke="${c}" stroke-width="3.4" stroke-linecap="round"/>`;
  }
  return s;
}
/** Arc de mouvement (coup de bâton, de marteau, de fouet). */
export function swoosh(d: string, c = '#fff', w = 12): string {
  return `<path d="${d}" stroke="${c}" stroke-width="${w + 10}" fill="none" stroke-linecap="round" opacity=".22"/><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" opacity=".55"/><path d="${d}" stroke="#fff" stroke-width="${f(w * 0.35)}" fill="none" stroke-linecap="round"/>`;
}
/** Onde de choc (anneaux elliptiques). */
export const shock = (x: Num, y: Num, rx: number, ry: number, c: string): string =>
  `<g class="ring"><ellipse cx="${f(x)}" cy="${f(y)}" rx="${rx}" ry="${ry}" fill="none" stroke="${O}" stroke-width="9"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${rx}" ry="${ry}" fill="none" stroke="${c}" stroke-width="5"/></g>`;
/** Gouttelettes d'eau. */
export const drops = (pts: readonly (readonly [number, number, number])[], c = '#7fd4ff'): string =>
  `<g class="fx">${pts.map(([x, y, r]) => `<path d="M${x} ${f(y - r * 1.6)} Q${f(x + r)} ${f(y - r * 0.2)} ${x} ${f(y + r)} Q${f(x - r)} ${f(y - r * 0.2)} ${x} ${f(y - r * 1.6)}Z" fill="${c}" stroke="${O}" stroke-width="2.5"/><circle cx="${f(x - r * 0.3)}" cy="${f(y - r * 0.2)}" r="${f(r * 0.28)}" fill="#fff"/>`).join('')}</g>`;
