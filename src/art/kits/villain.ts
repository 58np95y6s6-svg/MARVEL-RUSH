// Primitives « méchant » de la planche des boss et des sbires.
import { O, f, clip, gloss, mirror, star, uid, shoulder, poseNum, poseOf, type CharDef, type Num, type Pt, type Shape } from '../primitives';

export const rot = (p: readonly number[], c: readonly number[], deg: number): Pt => {
  const a = (deg * Math.PI) / 180, px = p[0] ?? 0, py = p[1] ?? 0, cx = c[0] ?? 0, cy = c[1] ?? 0;
  const dx = px - cx, dy = py - cy;
  return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)];
};
/** Point d'un accessoire tenu en main (pièce « part » imbriquée dans le bras). */
export function held(c: CharDef, side: string, key: string, p: number, ptIn: readonly number[], origin: readonly number[]): Pt {
  const v = poseOf(c, p)[key];
  const pr = Array.isArray(v) ? ((v as readonly number[])[2] ?? 0) : 0;
  return rot(rot(ptIn, origin, pr), shoulder(c, side), poseNum(c, p, side));
}
/** Ombre portée sur le visage (capuche, chapeau) : dégradé sombre du haut vers le bas, découpé à la forme. */
export function hoodShade(shape: Shape, y0: number, y1: number, o = 0.7, col = '#0a0716'): string {
  const g = uid('g');
  return `<linearGradient id="${g}" gradientUnits="userSpaceOnUse" x1="0" y1="${y0}" x2="0" y2="${y1}"><stop offset="0" stop-color="${col}" stop-opacity="${o}"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient>` +
    clip(shape, `<rect x="-60" y="${y0 - 200}" width="320" height="${y1 - y0 + 200}" fill="url(#${g})"/>`);
}
export interface GeyesOpts {
  x?: number;
  y?: number;
  s?: number;
  sq?: number;
  lid?: string;
}
/** Yeux lumineux en amande, sourcils froncés intégrés à la forme. */
export function geyes(c: string, o: GeyesOpts = {}): string {
  const x = o.x || 82, y = o.y || 96, s = o.s || 1, sq = o.sq || 1;
  const e = `<g transform="translate(${x} ${y}) scale(${s} ${f(s * sq)})"><path d="M-12 -6 L11 1 Q9 9 0 9 Q-11 8 -12 -6Z" fill="${c}"/><path d="M-12 -6 L11 1" stroke="${o.lid || O}" stroke-width="3.2" stroke-linecap="round"/><ellipse cx="-1" cy="3.5" rx="4.6" ry="2.6" fill="#fffbe6"/></g>`;
  const h = `<ellipse cx="${x}" cy="${y + 2}" rx="${f(19 * s)}" ry="${f(13 * s * sq)}" fill="${c}" opacity=".32"/>`;
  return `<g class="fx">${h}${mirror(h)}</g>` + e + mirror(e);
}
export function evilMouth(p: number, cx = 100, cy = 120, w = 12): string {
  if (p == 0) return `<path d="M${cx - w} ${cy} Q${cx - 2} ${cy + 6} ${cx + w} ${cy - 5}" stroke="${O}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  if (p == 1)
    return `<path d="M${cx - w} ${cy - 3} Q${cx} ${cy + 11} ${cx + w} ${cy - 3} Q${cx} ${cy + 3} ${cx - w} ${cy - 3}Z" fill="#fff" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M${f(cx - w * 0.5)} ${cy + 1} V${cy + 4.5} M${cx} ${cy + 2} V${cy + 6.5} M${f(cx + w * 0.5)} ${cy + 1} V${cy + 4.5}" stroke="${O}" stroke-width="1.6"/>`;
  return `<path d="M${cx - w} ${cy - 3} Q${cx} ${cy - 5} ${cx + w} ${cy - 3} Q${f(cx + w * 0.75)} ${cy + 15} ${cx} ${cy + 16} Q${f(cx - w * 0.75)} ${cy + 15} ${cx - w} ${cy - 3}Z" fill="#5c0f22" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/><path d="M${cx - w + 3} ${cy - 2} Q${cx} ${cy - 3} ${cx + w - 3} ${cy - 2} L${cx + w - 5} ${cy + 3} Q${cx} ${cy + 1} ${cx - w + 5} ${cy + 3}Z" fill="#fff"/><path d="M${cx - 5} ${cy + 12} Q${cx} ${cy + 8} ${cx + 5} ${cy + 12}" stroke="#e85a6e" stroke-width="3" fill="none"/>`;
}
export function spiral(x: number, y: number, r: number, c: string, turns = 3): string {
  let d = '';
  const N = 64;
  for (let i = 0; i <= N; i++) {
    const t = i / N, a = t * turns * 2 * Math.PI, rr = r * t;
    d += (i ? 'L' : 'M') + f(x + Math.cos(a) * rr) + ' ' + f(y + Math.sin(a) * rr);
  }
  return `<path d="${d}" stroke="${O}" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" stroke="${c}" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
}
export const txt = (x: Num, y: Num, s: number, c: string, t: string, r: Num = 0): string =>
  `<text x="${x}" y="${y}" transform="rotate(${r} ${x} ${y})" text-anchor="middle" font-family="Lilita One, Arial Rounded MT Bold, sans-serif" font-size="${s}" fill="${c}" stroke="${O}" stroke-width="5" stroke-linejoin="round" paint-order="stroke">${t}</text>`;
export const tentacle = (d: string, c: string, w = 16, hl?: string): string =>
  `<path d="${d}" stroke="${O}" stroke-width="${w + 9}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>` +
  (hl ? `<path d="${d}" stroke="${hl}" stroke-width="${f(w * 0.22)}" fill="none" stroke-linecap="round" opacity=".7" transform="translate(-2 -3)"/>` : '');
export const ringPts = (cx: number, cy: number, rx: number, ry: number, k: number, a0 = 0, a1 = 2 * Math.PI, closed = true): Pt[] => {
  const p: Pt[] = [];
  for (let i = 0; i < k; i++) {
    const t = a0 + ((a1 - a0) * i) / (closed ? k : k - 1);
    p.push([cx + Math.cos(t) * rx, cy + Math.sin(t) * ry]);
  }
  return p;
};
/** Fourrure : contour de bulles avec ombrage cel. */
export function fluffy(pts: readonly Pt[], r: number, base: string, dark: string, fillPoly = true): string {
  let s = pts.map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="${r + 4}" fill="${O}"/>`).join('');
  s += pts.map(([x, y]) => `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${dark}"/>`).join('');
  s += pts.map(([x, y]) => `<circle cx="${f(x - 2.5)}" cy="${f(y - 3)}" r="${r - 2.5}" fill="${base}"/>`).join('');
  if (fillPoly) s += `<polygon points="${pts.map((p) => p.map(f).join(',')).join(' ')}" fill="${base}"/>`;
  return s;
}
export const twinkle = (x: Num, y: Num, r: Num, c: string, o = 0.8): string => `<polygon points="${star(x, y, +r, +r * 0.28, 4)}" fill="${c}" opacity="${o}"/>`;
export function rnd(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
/** Petit pion de héros (cible des pouvoirs). */
export const token = (x: number, y: number, r: number, c: string, eyes = ''): string =>
  `<circle cx="${x}" cy="${y}" r="${r + 5}" fill="#fff" stroke="${O}" stroke-width="4"/><circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>${gloss(x - r * 0.35, y - r * 0.45, r * 0.35, r * 0.2, -30, 0.6)}${eyes}`;
