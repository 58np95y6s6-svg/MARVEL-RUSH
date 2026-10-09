// Primitives de dessin extraites des planches (design/planches/*.html).
// Le code reprend les fonctions des planches à l'identique, avec des types.
// Seul le mode statique (pose 0, 1 ou 2) est conservé : les transformations CSS
// des planches deviennent des attributs SVG `transform`, lisibles par n'importe quel moteur.

/** Couleur des contours. */
export const O = '#1d1733';
export const SK = '#ffd3ad';
export const SKD = '#e9a982';

/** Nombre ou chaîne numérique (les planches passent souvent des valeurs formatées par `f`). */
export type Num = number | string;
export type Pt = [number, number];
export type PoseVal = number | readonly number[];
export interface Pose {
  [k: string]: PoseVal | undefined;
}
export type PoseIdx = 0 | 1 | 2;

export interface CharDef {
  id: string;
  name: string;
  sh?: Record<string, Pt>;
  poses: Pose[];
  parts?: string[];
  draw(this: CharDef, x: Ctx): string;
  bg?(this: CharDef): string;
  [meta: string]: unknown;
}

export const f = (v: Num): string => (+v).toFixed(1);

/* ---------- identifiants uniques par SVG ---------- */
let idPrefix = 'mr';
let n = 0;
/** Identifiant de définition (clipPath, dégradé, filtre) préfixé par le SVG en cours. */
export function uid(kind: string): string {
  return `${idPrefix}${kind}${n++}`;
}
/** Exécute `fn` avec un espace d'identifiants propre : deux SVG différents n'ont jamais d'id commun. */
export function withIds<T>(prefix: string, fn: () => T): T {
  const pp = idPrefix, pn = n;
  idPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '_') + '_';
  n = 0;
  try {
    return fn();
  } finally {
    idPrefix = pp;
    n = pn;
  }
}

/* ---------- primitives de dessin ---------- */
export type Shape = (attrs: string) => string;

export function shaded(shape: Shape, base: string, dark: string, dx: Num = -8, dy: Num = -7): string {
  const id = uid('c');
  return `<clipPath id="${id}">${shape('')}</clipPath>${shape(`fill="${dark}"`)}<g clip-path="url(#${id})"><g transform="translate(${dx} ${dy})">${shape(`fill="${base}"`)}</g></g>${shape(`fill="none" stroke="${O}" stroke-width="5" stroke-linejoin="round"`)}`;
}
export function clip(shape: Shape, content: string): string {
  const id = uid('k');
  return `<clipPath id="${id}">${shape('')}</clipPath><g clip-path="url(#${id})">${content}</g>`;
}
export const gloss = (x: Num, y: Num, rx: Num, ry: Num, r: Num = -35, o: Num = 0.55): string =>
  `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${r} ${x} ${y})" fill="#fff" opacity="${o}"/>`;
export const limb = (x1: number, y1: number, x2: number, y2: number, c: string, w: number): string =>
  `<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${O}" stroke-width="${w + 9}" stroke-linecap="round"/><path d="M${x1} ${y1}L${x2} ${y2}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/><path d="M${f(x1 - w * 0.22)} ${y1}L${f(x2 - w * 0.22)} ${y2}" stroke="#fff" stroke-width="${f(w * 0.18)}" stroke-linecap="round" opacity=".28"/>`;
export const hand = (x: number, y: number, c: string, r = 11): string =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="${O}" stroke-width="4.5"/><circle cx="${f(x - r * 0.35)}" cy="${f(y - r * 0.35)}" r="${f(r * 0.3)}" fill="#fff" opacity=".5"/>`;
export function star(x: Num, y: Num, R: number, r: number, k: number, rot = 0): string {
  const X = +x, Y = +y;
  const a: string[] = [];
  for (let i = 0; i < k * 2; i++) {
    const t = rot + (Math.PI * i) / k, rr = i % 2 ? r : R;
    a.push(f(X + Math.cos(t) * rr) + ',' + f(Y + Math.sin(t) * rr));
  }
  return a.join(' ');
}
export const glow = (x: Num, y: Num, r: number, c: string): string =>
  `<g class="fx"><circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${c}" opacity=".22"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 0.62)}" fill="${c}" opacity=".5"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 0.3)}" fill="#fff"/></g>`;
export const burst = (x: Num, y: Num, R: number, c: string, c2 = '#fff'): string =>
  `<g class="fx"><polygon points="${star(x, y, R, R * 0.5, 9)}" fill="${c}" stroke="${O}" stroke-width="4" stroke-linejoin="round"/><polygon points="${star(x, y, R * 0.58, R * 0.3, 9, 0.35)}" fill="${c2}"/></g>`;
export const beam = (x1: Num, y1: Num, x2: Num, y2: Num, w: number, c: string): string => {
  const d = `M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`;
  return `<g class="fx"><path d="${d}" stroke="${c}" stroke-width="${w + 18}" stroke-linecap="round" opacity=".25"/><path d="${d}" stroke="${O}" stroke-width="${w + 8}" stroke-linecap="round"/><path d="${d}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/><path d="${d}" stroke="#fff" stroke-width="${f(w * 0.38)}" stroke-linecap="round"/></g>`;
};
export const bolt = (pts: readonly (readonly Num[])[], c = '#7fd8ff'): string => {
  const d = 'M' + pts.map((p) => p.map(f).join(' ')).join(' L');
  return `<g class="fx"><path d="${d}" stroke="${O}" stroke-width="10" fill="none" stroke-linejoin="round" stroke-linecap="round"/><path d="${d}" stroke="${c}" stroke-width="6" fill="none" stroke-linejoin="round" stroke-linecap="round"/><path d="${d}" stroke="#fff" stroke-width="2" fill="none" stroke-linejoin="round"/></g>`;
};
export function sparks(x: Num, y: Num, r: number, c: string, k = 8): string {
  const X = +x, Y = +y;
  let s = '';
  for (let i = 0; i < k; i++) {
    const a = (i * 2 * Math.PI) / k + 0.2;
    const d = `M${f(X + Math.cos(a) * r * 0.6)} ${f(Y + Math.sin(a) * r * 0.6)}L${f(X + Math.cos(a) * r)} ${f(Y + Math.sin(a) * r)}`;
    s += `<path d="${d}" stroke="${O}" stroke-width="6" stroke-linecap="round"/><path d="${d}" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`;
  }
  return `<g class="fx">${s}</g>`;
}
export function mandala(x: number, y: number, r: number): string {
  let t = '';
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8;
    t += `<path d="M${f(x + Math.cos(a) * r * 0.8)} ${f(y + Math.sin(a) * r * 0.8)}L${f(x + Math.cos(a) * r * 0.94)} ${f(y + Math.sin(a) * r * 0.94)}"/>`;
  }
  return `<g class="spin"><circle cx="${x}" cy="${y}" r="${r}" fill="#ff9b2f" fill-opacity=".16" stroke="#ff9b2f" stroke-opacity=".35" stroke-width="${f(r * 0.18)}"/><g stroke="#ffad40" stroke-width="2.6" fill="none"><circle cx="${x}" cy="${y}" r="${r}"/><circle cx="${x}" cy="${y}" r="${f(r * 0.7)}"/><polygon points="${star(x, y, r * 0.7, r * 0.7, 4)}"/><polygon points="${star(x, y, r * 0.7, r * 0.7, 4, Math.PI / 4)}"/>${t}</g><circle cx="${x}" cy="${y}" r="${f(r * 0.18)}" fill="#fff3d6"/></g>`;
}
export const torsoD = 'M58 202 C56 160 70 138 100 136 C130 138 144 160 142 202Z';
export const torso = (c: string, d: string, path = torsoD): string => shaded((a) => `<path d="${path}" ${a}/>`, c, d, -10, -4);
export const headS: Shape = (a) => `<circle cx="100" cy="84" r="56" ${a}/>`;
export const head = (c: string, d: string): string => shaded(headS, c, d) + gloss(76, 50, 14, 8);
export const cheeks = `<ellipse cx="70" cy="108" rx="8" ry="5" fill="#ff7c7c" opacity=".38"/><ellipse cx="130" cy="108" rx="8" ry="5" fill="#ff7c7c" opacity=".38"/>`;
export const mirror = (s: string): string => `<g transform="translate(200 0) scale(-1 1)">${s}</g>`;
export const shadow = (rx = 60, cy = 207, o = 0.16): string => `<ellipse cx="100" cy="${cy}" rx="${rx}" ry="8" fill="${O}" opacity="${o}"/>`;

export interface FaceOpts {
  eye?: string;
  brow?: string;
  noMouth?: boolean;
  noCheeks?: boolean;
}
export function face(p: number, o: FaceOpts = {}): string {
  let s = '';
  const ec = o.eye || O, br = o.brow || O;
  for (const [x, d] of [[80, 1], [120, -1]] as const) {
    const ry = p == 2 ? 8.5 : 10;
    s += `<ellipse cx="${x}" cy="95" rx="7.5" ry="${ry}" fill="${ec}"/>`;
    if (ec !== O) s += `<ellipse cx="${x}" cy="${f(95 - ry * 0.45)}" rx="6.5" ry="${f(ry * 0.45)}" fill="${O}" opacity=".45"/>`;
    s += `<circle cx="${x + 2.5}" cy="${p == 2 ? 91 : 90}" r="3.2" fill="#fff"/><circle cx="${x - 2.5}" cy="99" r="1.5" fill="#fff" opacity=".85"/>`;
    s += p > 0
      ? `<path d="M${x - 11 * d} 78 L${x + 9 * d} 85" stroke="${br}" stroke-width="5.5" stroke-linecap="round"/>`
      : `<path d="M${x - 9} 80 Q${x} 74 ${x + 9} 80" stroke="${br}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
  }
  if (!o.noMouth) {
    if (p == 0) s += `<path d="M92 115 Q100 121 108 115" stroke="${O}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    else if (p == 1) s += `<path d="M91 117 Q100 114 109 116" stroke="${O}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    else s += `<path d="M89 111 Q100 109 111 111 Q109 128 100 129 Q91 128 89 111Z" fill="#7a1f2b" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/><path d="M91 112 H109" stroke="#fff" stroke-width="3"/><path d="M94 123 Q100 120 106 123" stroke="#e85a6e" stroke-width="3" fill="none"/>`;
  }
  return s + (o.noCheeks ? '' : cheeks);
}

/* ---------- pose : lecture des angles ---------- */
export function poseOf(c: CharDef, p: number): Pose {
  return c.poses[p] ?? c.poses[0] ?? {};
}
export function poseNum(c: CharDef, p: number, key: string): number {
  const v = poseOf(c, p)[key];
  return typeof v === 'number' ? v : 0;
}
export function poseArr(c: CharDef, p: number, key: string): readonly number[] | undefined {
  const v = poseOf(c, p)[key];
  return v == null ? undefined : typeof v === 'number' ? [v] : v;
}
export function shoulder(c: CharDef, side: string): Pt {
  return c.sh?.[side] ?? [100, 150];
}
export function tip(c: CharDef, side: string, p: number, d: number): Pt {
  const [sx, sy] = shoulder(c, side);
  const a = (poseNum(c, p, side) * Math.PI) / 180;
  return [sx - Math.sin(a) * d, sy + Math.cos(a) * d];
}
export function dirOf(c: CharDef, side: string, p: number): Pt {
  const a = (poseNum(c, p, side) * Math.PI) / 180;
  return [-Math.sin(a), Math.cos(a)];
}

/* ---------- transformations (équivalents SVG des transformations CSS des planches) ---------- */
const r3 = (v: number): string => String(Math.round(v * 1000) / 1000);
/** CSS `transform-origin:ox oy; transform: translate(tx,ty) rotate(r) scale(sx,sy)` → attribut SVG. */
export function bodyAttr(b: readonly number[] | undefined, ox: number, oy: number): string {
  const [tx = 0, ty = 0, r = 0, sx = 1, sy = 1] = b ?? [];
  if (!tx && !ty && !r && sx === 1 && sy === 1) return '';
  return ` transform="translate(${r3(ox + tx)} ${r3(oy + ty)}) rotate(${r}) scale(${sx} ${sy}) translate(${-ox} ${-oy})"`;
}
/** CSS `translate(tx,ty) scale(s)` autour de (ox, oy). */
export function headAttr(h: readonly number[] | undefined, ox: number, oy: number): string {
  const [tx = 0, ty = 0, s = 1] = h ?? [];
  if (!tx && !ty && s === 1) return '';
  return ` transform="translate(${r3(ox + tx)} ${r3(oy + ty)}) scale(${s}) translate(${-ox} ${-oy})"`;
}
/** Planche B : pièce articulée = angle seul, ou [angle, sx, sy]. */
export function partTAttr(v: PoseVal | undefined, ox: number, oy: number): string {
  if (v == null) return '';
  if (typeof v === 'number') return v ? ` transform="rotate(${v} ${ox} ${oy})"` : '';
  const [r = 0, sx = 1, sy = sx] = v;
  return ` transform="translate(${ox} ${oy}) rotate(${r}) scale(${sx} ${sy}) translate(${-ox} ${-oy})"`;
}

/* ---------- contexte de pose (statique) ---------- */
export interface Ctx {
  A: boolean;
  mode: PoseIdx;
  clone?: boolean;
  when(list: readonly number[], svg: string): string;
  byPose(fn: (p: PoseIdx) => string): string;
  arm(side: string, inner: (sx: number, sy: number) => string): string;
  body(svg: string): string;
  head(svg: string): string;
  part(key: string, ox: Num, oy: Num, svg: string): string;
  kick(svg: string, ox?: number, oy?: number): string;
  mv(cls: string, T: readonly string[], svg: string): string;
}

export interface CtxOpts {
  /** Planche B : les pièces prennent un angle ou [angle, sx, sy] ; boss : [tx, ty, r, sx, sy]. */
  partMode?: 'partT' | 'bodyT';
}

export function ctx(c: CharDef, mode: PoseIdx, opts: CtxOpts = {}): Ctx {
  const P = poseOf(c, mode);
  const arr = (k: string): readonly number[] | undefined => {
    const v = P[k];
    return v == null ? undefined : typeof v === 'number' ? [v] : v;
  };
  return {
    A: false,
    mode,
    when: (list, svg) => (list.includes(mode) ? svg : ''),
    byPose: (fn) => fn(mode),
    arm: (side, inner) => {
      const [sx, sy] = shoulder(c, side);
      const a = poseNum(c, mode, side);
      return `<g class="arm arm${side}"${a ? ` transform="rotate(${a} ${sx} ${sy})"` : ''}>${inner(sx, sy)}</g>`;
    },
    body: (svg) => `<g class="body"${bodyAttr(arr('body'), 100, 206)}>${svg}</g>`,
    head: (svg) => `<g class="headT"${headAttr(arr('head'), 100, 132)}>${svg}</g>`,
    part: (key, ox, oy, svg) =>
      `<g class="part p-${key}"${opts.partMode === 'bodyT' ? bodyAttr(arr(key), +ox, +oy) : partTAttr(P[key], +ox, +oy)}>${svg}</g>`,
    kick: (svg, ox = 100, oy = 206) => `<g class="kick"${bodyAttr(arr('sk'), ox, oy)}>${svg}</g>`,
    mv: (_cls, T, svg) => `<g style="transform-box:fill-box;transform-origin:center;transform:${T[mode] ?? 'none'}">${svg}</g>`,
  };
}

export function beamFrom(c: CharDef, side: string, d: number, len: number, w: number, col: string): string {
  const [x0, y0] = tip(c, side, 2, d), [dx, dy] = dirOf(c, side, 2);
  return `<g class="grow">${beam(x0, y0, x0 + dx * len, y0 + dy * len, w, col)}</g><g class="pop">${burst(f(x0), f(y0), 19, col)}</g>`;
}
