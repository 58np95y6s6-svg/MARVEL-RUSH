// Aides propres à la planche « Marvel B » (pièces articulées, trajectoires, impacts minutés),
// réduites à leur rendu statique.
import { O, f, shoulder, poseNum, poseOf, type CharDef, type Ctx, type Num, type Pt } from '../primitives';

export const rot = (px: number, py: number, ox: number, oy: number, deg: number): Pt => {
  const t = (deg * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t);
  return [ox + (px - ox) * c - (py - oy) * s, oy + (px - ox) * s + (py - oy) * c];
};
/** Point local d'un bras (après rotation du poignet puis de l'épaule) → coordonnées de scène. */
export function wpt(c: CharDef, side: string, p: number, lx: number, ly: number, d = 38): Pt {
  const [sx, sy] = shoulder(c, side);
  const w = poseOf(c, p)['w' + side];
  const ww = w == null ? 0 : typeof w === 'number' ? w : (w[0] ?? 0);
  const [ax, ay] = rot(lx, ly, sx, sy + d, ww);
  return rot(ax, ay, sx, sy, poseNum(c, p, side));
}
export type Track = Pt[] & { fr: number[] };
/** Trajectoire lissée (Catmull-Rom) rééchantillonnée à vitesse constante. */
export function track(wp: readonly (readonly number[])[], N = 30): Track {
  const pt = (q: readonly number[] | undefined): Pt => [q?.[0] ?? 0, q?.[1] ?? 0];
  const P: Pt[] = [pt(wp[0]), ...wp.map(pt), pt(wp[wp.length - 1])];
  const dense: Pt[] = [];
  for (let i = 1; i < P.length - 2; i++) {
    const p0 = P[i - 1]!, p1 = P[i]!, p2 = P[i + 1]!, p3 = P[i + 2]!;
    for (let k = 0; k < 20; k++) {
      const t = k / 20, t2 = t * t, t3 = t2 * t;
      const c = (j: 0 | 1): number =>
        0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3);
      dense.push([c(0), c(1)]);
    }
  }
  dense.push(pt(wp[wp.length - 1]));
  const L = [0];
  for (let i = 1; i < dense.length; i++) L.push(L[i - 1]! + Math.hypot(dense[i]![0] - dense[i - 1]![0], dense[i]![1] - dense[i - 1]![1]));
  const tot = L[L.length - 1] || 1;
  const out = [] as unknown as Track;
  let j = 0;
  for (let k = 0; k < N; k++) {
    const s = (tot * k) / (N - 1);
    while (j < L.length - 2 && L[j + 1]! < s) j++;
    const u = Math.min(1, (s - L[j]!) / (L[j + 1]! - L[j]! || 1));
    const a = dense[j]!, b = dense[j + 1] ?? a;
    out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
  }
  out.fr = wp.map((_, i) => L[Math.min(i * 20, L.length - 1)]! / tot);
  return out;
}
export interface FlyerOpts {
  align?: boolean;
  sc?: readonly number[];
  trail?: string;
  tw?: number;
  hold?: number;
  sp?: number;
  sm?: number;
}
/** Objet volant : en statique, posé à l'avancement `sp` de sa trajectoire, avec sa traînée. */
export function flyer(x: Ctx, _key: string, pts: readonly Pt[], _p0: number, _p1: number, obj: string, o: FlyerOpts = {}): string {
  const N = pts.length;
  const at = (i: number): Pt => pts[Math.max(0, Math.min(N - 1, i))] ?? [0, 0];
  const deg = (i: number): number => {
    const a = at(i - 1), b = at(i + 1);
    return (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  };
  const T = (i: number): string =>
    `translate(${f(at(i)[0])} ${f(at(i)[1])})` + (o.align ? ` rotate(${f(deg(i))})` : '') +
    (o.sc ? ` scale(${((o.sc[0] ?? 1) + ((o.sc[1] ?? 1) - (o.sc[0] ?? 1)) * i / (N - 1)).toFixed(2)})` : '');
  const d = 'M' + pts.map((p) => f(p[0]) + ' ' + f(p[1])).join(' L'), tw = o.tw || 16;
  const trail = (st: string): string =>
    o.trail
      ? `<path d="${d}" pathLength="100" stroke-dasharray="100 100" ${st} stroke="${o.trail}" stroke-width="${tw}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".3"/><path d="${d}" pathLength="100" stroke-dasharray="100 100" ${st} stroke="#fff" stroke-width="${f(tw * 0.3)}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>`
      : '';
  if (x.mode !== (o.sm ?? 2)) return '';
  const i = Math.round((o.sp ?? 0.5) * (N - 1));
  return trail(`stroke-dashoffset="${f(100 - (100 * i) / (N - 1))}"`) + `<g class="fly" transform="${T(i)}">${obj}</g>`;
}
export interface HitOpts {
  d?: number;
  sm?: number;
  st?: boolean;
}
/** Impact minuté : visible dans la pose de frappe (sauf `st:false`). */
export function hitAt(x: Ctx, _key: string, _p: number, svg: string, o: HitOpts = {}): string {
  return x.mode === (o.sm ?? 2) && o.st !== false ? svg : '';
}
/** Tracé qui se déforme d'une pose à l'autre (corde d'arc). */
export function morph(x: Ctx, _key: string, ds: readonly string[], attrs: string): string {
  return `<path d="${ds[x.mode] ?? ds[0] ?? ''}" ${attrs}/>`;
}
export const P2 = (a: readonly Num[]): string => a.map(f).join(' ');
export const puff = (x0: number, y0: number, s: number, c = '#a8f0a4', c2 = '#e6ffe2'): string =>
  `<g class="fx">${([[-1, 0.3, 0.8], [0, -0.5, 1], [1, 0.2, 0.85], [-0.45, 0.7, 0.7], [0.5, 0.75, 0.7]] as const)
    .map(([dx, dy, r]) => `<circle cx="${f(x0 + dx * s)}" cy="${f(y0 + dy * s)}" r="${f(r * s)}" fill="${c}" stroke="${O}" stroke-width="3"/>`)
    .join('')}${([[0, -0.6, 0.45], [-1, 0.15, 0.35]] as const)
    .map(([dx, dy, r]) => `<circle cx="${f(x0 + dx * s)}" cy="${f(y0 + dy * s)}" r="${f(r * s)}" fill="${c2}"/>`)
    .join('')}</g>`;
export const reticle = (cx: number, cy: number, r: number, c: string): string => {
  const d = `M${cx} ${cy - r - 7}V${cy - r + 7}M${cx} ${cy + r - 7}V${cy + r + 7}M${cx - r - 7} ${cy}H${cx - r + 7}M${cx + r - 7} ${cy}H${cx + r + 7}`;
  return `<g class="spin"><circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}" fill-opacity=".12" stroke="${O}" stroke-width="7"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${c}" stroke-width="3.5"/><g stroke="${O}" stroke-width="7" stroke-linecap="round"><path d="${d}"/></g><g stroke="${c}" stroke-width="3.5" stroke-linecap="round"><path d="${d}"/></g></g><circle cx="${cx}" cy="${cy}" r="4.5" fill="${c}" stroke="${O}" stroke-width="2.5"/>`;
};
