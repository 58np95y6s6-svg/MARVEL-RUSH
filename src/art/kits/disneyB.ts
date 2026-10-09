// Primitives ajoutées par la planche « Disney B ».
import { O, f, gloss, star, uid, type Num } from '../primitives';

export function shadedW(shape: (a: string) => string, base: string, dark: string, dx: Num = -4, dy: Num = -4, w: Num = 4): string {
  const id = uid('c');
  return `<clipPath id="${id}">${shape('')}</clipPath>${shape(`fill="${dark}"`)}<g clip-path="url(#${id})"><g transform="translate(${dx} ${dy})">${shape(`fill="${base}"`)}</g></g>${shape(`fill="none" stroke="${O}" stroke-width="${w}" stroke-linejoin="round"`)}`;
}
/** Objet qui arrive d'un décalage (fx, fy) : en statique, il est à sa place finale. */
export const fly = (_fx: Num, _fy: Num, s: string, _dl = 0): string => `<g class="fly">${s}</g>`;
/** Objet aspiré vers (tx, ty) : en statique, il est à son point de départ. */
export const gather = (_tx: Num, _ty: Num, s: string, _dl = 0): string => `<g class="gather">${s}</g>`;
export const rope = (d: string, c: string, w: number, cls = ''): string =>
  `<path d="${d}" pathLength="1" class="${cls}" stroke="${O}" stroke-width="${w + 7}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" pathLength="1" class="${cls}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
export const word = (x: Num, y: Num, t: string, size: number, c: string, rot: Num = 0): string =>
  `<text x="${x}" y="${y}" transform="rotate(${rot} ${x} ${y})" text-anchor="middle" font-family="'Lilita One','Arial Rounded MT Bold','Trebuchet MS',sans-serif" font-size="${size}" fill="${c}" stroke="${O}" stroke-width="${f(size * 0.3)}" stroke-linejoin="round" paint-order="stroke" letter-spacing=".5">${t}</text>`;
export const dot = (x: Num, y: Num, r: Num, c: string): string => `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${c}" stroke="${O}" stroke-width="2.5"/>`;
export const pix = (x: number, y: number, s: number, c: string): string =>
  `<rect x="${f(x - s / 2)}" y="${f(y - s / 2)}" width="${s}" height="${s}" fill="${c}" stroke="${O}" stroke-width="2.5"/>`;
export const plus = (x: number, y: number, s: number, c: string): string => {
  const d = `M${f(x - s)} ${f(y)}H${f(x + s)}M${f(x)} ${f(y - s)}V${f(y + s)}`;
  return `<path d="${d}" stroke="${O}" stroke-width="${f(s * 0.9 + 5)}" stroke-linecap="round"/><path d="${d}" stroke="${c}" stroke-width="${f(s * 0.9)}" stroke-linecap="round"/>`;
};
export const twinkle = (x: Num, y: Num, r: number, c = '#fff'): string =>
  `<polygon points="${star(x, y, r, r * 0.3, 4)}" fill="${c}" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>`;
export const note = (x: Num, y: Num, s: Num, c: string): string =>
  `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path d="M5 6 V-16 Q15 -12 15 -3" stroke="${O}" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="-1" cy="7" rx="7.5" ry="5.5" transform="rotate(-22 -1 7)" fill="${c}" stroke="${O}" stroke-width="3.5"/><path d="M5 5 V-16 Q15 -12 15 -3" stroke="${c}" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="-3" cy="5" rx="2.4" ry="1.4" fill="#fff" opacity=".7"/></g>`;
export const petal = (x: number, y: number, r: number, rot: Num, c = '#ff9a1f'): string =>
  `<g transform="rotate(${rot} ${f(x)} ${f(y)})"><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 0.6)}" ry="${r}" fill="${c}" stroke="${O}" stroke-width="2.2"/><path d="M${f(x)} ${f(y - r * 0.6)} V${f(y + r * 0.5)}" stroke="#d9680f" stroke-width="1.4"/></g>`;
export const coin = (x: number, y: number, r: number): string =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="#f6c64a" stroke="${O}" stroke-width="4"/><circle cx="${x}" cy="${y}" r="${f(r * 0.68)}" fill="none" stroke="#cf962a" stroke-width="2.5"/><polygon points="${star(x, y, r * 0.5, r * 0.22, 5, -Math.PI / 2)}" fill="#fff3c4" stroke="#cf962a" stroke-width="1.5"/>${gloss(x - r * 0.4, y - r * 0.45, r * 0.28, r * 0.14, -35, 0.7)}`;
export const enemy = (x: Num, y: Num, s: Num = 1): string =>
  `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path d="M-14 8 Q-17 -12 0 -14 Q17 -12 14 8 Q7 12 0 9 Q-7 12 -14 8Z" fill="#9b6bd6" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/><path d="M-9 -4 L-3 -1 M9 -4 L3 -1" stroke="${O}" stroke-width="2.5" stroke-linecap="round"/><circle cx="-5" cy="2.5" r="2.2" fill="${O}"/><circle cx="5" cy="2.5" r="2.2" fill="${O}"/><ellipse cx="-6" cy="-8" rx="3.5" ry="1.8" fill="#fff" opacity=".5"/></g>`;
export const bigMouth = `<path d="M89 111 Q100 109 111 111 Q109 128 100 129 Q91 128 89 111Z" fill="#7a1f2b" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/><path d="M91 112 H109" stroke="#fff" stroke-width="3"/><path d="M94 123 Q100 120 106 123" stroke="#e85a6e" stroke-width="3" fill="none"/>`;
export const strand = (d: string, c: string, w: number, hl: string): string =>
  `<path d="${d}" stroke="${O}" stroke-width="${w + 9}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" stroke="${hl}" stroke-width="${f(w * 0.2)}" fill="none" stroke-linecap="round" opacity=".8"/>`;
