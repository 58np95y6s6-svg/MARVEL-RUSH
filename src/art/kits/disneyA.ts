// Primitives propres à la planche « Disney A ».
import { O, f, burst, shoulder, poseNum, type CharDef, type Num, type Pt } from '../primitives';

export const SKT = '#d99a6c', SKTD = '#b07148';
/** Point local d'un bras (repère de l'épaule) → coordonnées de scène. */
export function pt(c: CharDef, side: string, p: number, lx: number, ly: number): Pt {
  const [sx, sy] = shoulder(c, side);
  const a = (poseNum(c, p, side) * Math.PI) / 180, co = Math.cos(a), si = Math.sin(a);
  return [sx + lx * co - ly * si, sy + lx * si + ly * co];
}
export function scallop(cx: number, cy: number, rx: number, ry: number, k: number, b: number, j = 0): string {
  let d = '';
  const J = (i: number): number => 1 + j * Math.sin(i * 2.7) * 0.12;
  for (let i = 0; i <= k; i++) {
    const t = (2 * Math.PI * i) / k, q = J(i % k), X = cx + Math.cos(t) * rx * q, Y = cy + Math.sin(t) * ry * q;
    if (!i) d += `M${f(X)} ${f(Y)}`;
    else {
      const m = (2 * Math.PI * (i - 0.5)) / k, bb = b * (1 + j * Math.cos(i * 1.9) * 0.6), qm = (J(i - 1) + q) / 2;
      d += ` Q${f(cx + Math.cos(m) * (rx * qm + bb))} ${f(cy + Math.sin(m) * (ry * qm + bb))} ${f(X)} ${f(Y)}`;
    }
  }
  return d + 'Z';
}
export function curls(cx: number, cy: number, rx: number, ry: number, k: number, j = 0, bulge = 0.62): string {
  let d = '';
  let p0: Pt = [0, 0];
  for (let i = 0; i <= k; i++) {
    const t = (2 * Math.PI * i) / k + 0.15, q = 1 + j * Math.sin(i * 2.3) * 0.07, X = cx + Math.cos(t) * rx * q, Y = cy + Math.sin(t) * ry * q;
    if (!i) d += `M${f(X)} ${f(Y)}`;
    else {
      const rr = Math.hypot(X - p0[0], Y - p0[1]) * (bulge + j * 0.08 * Math.cos(i * 1.7));
      d += ` A${f(rr)} ${f(rr)} 0 0 1 ${f(X)} ${f(Y)}`;
    }
    p0 = [X, Y];
  }
  return d + 'Z';
}
export const lashes = `<path d="M74 88 L66 83 M73 93 L66 92 M126 88 L134 83 M127 93 L134 92" stroke="${O}" stroke-width="3" stroke-linecap="round"/>`;
export const leaf = (x: Num, y: Num, s: Num, r: Num, c: string): string =>
  `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(r)}) scale(${s})"><path d="M-11 0 Q0 -9 11 0 Q0 9 -11 0Z" fill="${c}" stroke="${O}" stroke-width="2.6" stroke-linejoin="round" vector-effect="non-scaling-stroke"/><path d="M-9 0 H8" stroke="${O}" stroke-width="1.3" opacity=".45" vector-effect="non-scaling-stroke"/></g>`;
export const heart = (x: Num, y: Num, s: Num, c = '#ff5f8f'): string =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M0 8 C-14 -2 -10 -14 0 -7 C10 -14 14 -2 0 8Z" fill="${c}" stroke="${O}" stroke-width="2.8" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
export const note = (x: number, y: number, c = '#ffd23f'): string => {
  const d = `M${x + 5} ${y} V${y - 22} Q${x + 15} ${y - 19} ${x + 16} ${y - 9}`;
  return `<path d="${d}" stroke="${O}" stroke-width="7.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><ellipse cx="${x}" cy="${y}" rx="7.5" ry="5.8" transform="rotate(-22 ${x} ${y})" fill="${c}" stroke="${O}" stroke-width="3"/><path d="${d}" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
};
export const bubble = (x: number, y: number, r: number): string =>
  `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="#d4f8ff" fill-opacity=".6" stroke="${O}" stroke-width="3"/><path d="M${f(x + r * 0.7)} ${f(y - r * 0.1)} A${f(r * 0.72)} ${f(r * 0.72)} 0 0 1 ${f(x)} ${f(y + r * 0.72)}" stroke="#7fd8ff" stroke-width="2.4" fill="none" stroke-linecap="round"/><ellipse cx="${f(x - r * 0.36)}" cy="${f(y - r * 0.38)}" rx="${f(r * 0.3)}" ry="${f(r * 0.17)}" transform="rotate(-38 ${f(x - r * 0.36)} ${f(y - r * 0.38)})" fill="#fff"/>`;
type Circ = readonly [number, number, number];
export const foam = (pts: readonly Circ[]): string =>
  pts.map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r + 3}" fill="${O}"/>`).join('') +
  pts.map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff"/>`).join('') +
  pts.map(([cx, cy, r]) => `<circle cx="${f(cx + r * 0.25)}" cy="${f(cy + r * 0.3)}" r="${f(r * 0.5)}" fill="#c9f3f7"/>`).join('');
export function flower(cx: number, cy: number, r: number, c: string, c2 = '#ffd23f'): string {
  let s = '';
  for (let i = 0; i < 5; i++) {
    const a = i * 72 - 90, px = f(cx + Math.cos((a * Math.PI) / 180) * r * 0.6), py = f(cy + Math.sin((a * Math.PI) / 180) * r * 0.6);
    s += `<ellipse cx="${px}" cy="${py}" rx="${f(r * 0.52)}" ry="${f(r * 0.38)}" transform="rotate(${a} ${px} ${py})" fill="${c}" stroke="${O}" stroke-width="2.5"/>`;
  }
  return s + `<circle cx="${cx}" cy="${cy}" r="${f(r * 0.32)}" fill="${c2}" stroke="${O}" stroke-width="2"/>`;
}
export interface MfaceOpts {
  sp?: number;
  happy?: boolean;
  ring?: boolean;
  brow?: string;
}
/** Yeux de compagnon : p0 doux, p1 concentré, p2 joie (fermés) ou grands ouverts. */
export function mface(x: number, y: number, s: number, p: number, o: MfaceOpts = {}): string {
  const e = o.sp || 6 * s;
  let r = '';
  for (const [ex, d] of [[x - e, 1], [x + e, -1]] as const) {
    if (p == 2 && o.happy) {
      r += `<path d="M${f(ex - 3.6 * s)} ${f(y + 1.2 * s)} Q${f(ex)} ${f(y - 4.4 * s)} ${f(ex + 3.6 * s)} ${f(y + 1.2 * s)}" stroke="${O}" stroke-width="${f(2.8 * s)}" fill="none" stroke-linecap="round"/>`;
      continue;
    }
    if (o.ring) r += `<ellipse cx="${f(ex)}" cy="${f(y)}" rx="${f(4.8 * s)}" ry="${f(5.8 * s)}" fill="#fff"/>`;
    r += `<ellipse cx="${f(ex)}" cy="${f(y)}" rx="${f(3.4 * s)}" ry="${f((p == 1 ? 3.6 : 4.4) * s)}" fill="${O}"/><circle cx="${f(ex + 1.2 * s)}" cy="${f(y - 1.6 * s)}" r="${f(1.4 * s)}" fill="#fff"/>`;
    if (p == 1) r += `<path d="M${f(ex - 4.5 * d * s)} ${f(y - 8 * s)} L${f(ex + 3.5 * d * s)} ${f(y - 5 * s)}" stroke="${o.brow || O}" stroke-width="${f(2.4 * s)}" stroke-linecap="round"/>`;
  }
  return r;
}
/** Traînée d'arc (angles écran en degrés, sens horaire). */
export function swoosh(cx: number, cy: number, R: number, w: number, a0: number, a1: number, c: string): string {
  const P = (r: number, a: number): [string, string] => [f(cx + Math.cos((a * Math.PI) / 180) * r), f(cy + Math.sin((a * Math.PI) / 180) * r)];
  const [x0, y0] = P(R, a0), [x1, y1] = P(R, a1), [x2, y2] = P(R - w, a1), [x3, y3] = P(R - 3, a0);
  const d = `M${x0} ${y0} A${R} ${R} 0 0 1 ${x1} ${y1} L${x2} ${y2} A${R - w * 0.6} ${R - w * 0.6} 0 0 0 ${x3} ${y3}Z`;
  const [m0, m1] = P(R - 4, a0 + (a1 - a0) * 0.25), [m2, m3] = P(R - 4, a1 - 4);
  return `<path d="${d}" fill="${c}" opacity=".3" stroke="${c}" stroke-width="12" stroke-linejoin="round"/><path d="${d}" fill="${c}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/><path d="M${m0} ${m1} A${R - 4} ${R - 4} 0 0 1 ${m2} ${m3}" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
}
/** Jet de flammes. */
export function fire(x0: number, y0: number, x1: number, y1: number): string {
  const L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L, nx = -uy, ny = ux;
  const poly = (wk: number, wob: number): string => {
    const a: Pt[] = [], b: Pt[] = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8, w = (3 + 15 * t) * wk * (1 + (i % 2 ? wob : 0));
      a.push([x0 + ux * L * t + nx * w, y0 + uy * L * t + ny * w]);
      const m = 1 + (i % 2 ? 0 : wob * 0.6);
      b.unshift([x0 + ux * L * t - nx * w * m, y0 + uy * L * t - ny * w * m]);
    }
    return [...a, [x1 + ux * 16 * wk, y1 + uy * 16 * wk] as Pt, ...b].map((p) => f(p[0]) + ',' + f(p[1])).join(' ');
  };
  return `<g class="fx"><polygon points="${poly(1.45, 0)}" fill="#ff7a1e" opacity=".28" stroke-linejoin="round"/></g><polygon points="${poly(1, 0.35)}" fill="#ff7a1e" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/><polygon points="${poly(0.64, 0.3)}" fill="#ffc23a"/><polygon points="${poly(0.3, 0.2)}" fill="#fff3b0"/>`;
}
/** Morsure : deux mâchoires de crocs qui claquent. */
export function bite(x: number, y: number, c: string): string {
  let up = '', dn = '';
  for (let i = 0; i < 5; i++) {
    const tx = x - 20 + i * 10;
    up += `<polygon points="${tx - 4.5},${y - 6} ${tx + 4.5},${y - 6} ${tx},${y + 5}"/>`;
    dn += `<polygon points="${tx + 1},${y + 8} ${tx + 9},${y + 8} ${tx + 5},${y - 2}"/>`;
  }
  return burst(x, y, 30, c) + `<path d="M${x - 28} ${y - 8} Q${x} ${y - 24} ${x + 28} ${y - 8} M${x - 28} ${y + 10} Q${x} ${y + 26} ${x + 28} ${y + 10}" stroke="${O}" stroke-width="5" fill="none" stroke-linecap="round"/><g fill="#fff" stroke="${O}" stroke-width="2.4" stroke-linejoin="round">${up}${dn}</g>`;
}
export const puff = (pts: readonly Circ[]): string =>
  pts.map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r + 3}" fill="${O}"/>`).join('') +
  pts.map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#f3e7cc"/>`).join('') +
  pts.map(([cx, cy, r]) => `<circle cx="${f(cx - r * 0.3)}" cy="${f(cy - r * 0.3)}" r="${f(r * 0.35)}" fill="#fff"/>`).join('');
export const speed = (x: number, y: number, dx: number, len: number, k: number, c = '#fff'): string => {
  let s = '';
  for (let i = 0; i < k; i++) {
    const yy = y + (i - (k - 1) / 2) * 9, xx = x + (i % 2) * 8;
    s += `<path d="M${xx} ${yy} h${dx * len}" stroke="${O}" stroke-width="6" stroke-linecap="round"/><path d="M${xx} ${yy} h${dx * len}" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/>`;
  }
  return s;
};
