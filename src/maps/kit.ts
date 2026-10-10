// Boîte à outils des maps : couleurs, formes cel-shading façon planches, plateau (cadre, damier),
// matières de chemin, portail et porte de sortie, emplacements de décor et animations d'ambiance.
// Tout produit des chaînes SVG (converties en textures par le rendu). Aucun accès au DOM.

import type { MapDef, Point, Universe } from './types';
import {
  type AnyLayout, type BoardLayout, type CoopLayout, type SoloLayout, type Lane, type LayoutMode, type PathShape, type Rect,
  SCREEN, boardsOf, layoutFor, rectHitsPlay,
} from './layout';

export const INK = '#1d1733';
export const SW = 6; // épaisseur de contour du décor (≈ 2,3 px sur un téléphone de 390 px)

// ---------------------------------------------------------------- types publics

/**
 * Animation d'ambiance décrite en données : le rendu crée un sprite à partir de `svg`
 * (cadré sur `box`, en coordonnées écran), le pose en (box.x, box.y) et l'anime selon `kind`.
 * - drift : translation de (0,0) à (dx,dy) sur `period` s, puis retour au départ (boucle) ;
 * - bob : translation verticale sinusoïdale d'amplitude `amp` px ;
 * - sway : rotation sinusoïdale de ±`amp` degrés autour de (ox, oy) ;
 * - spin : rotation complète autour de (ox, oy) en `period` s ;
 * - blink : opacité qui oscille entre `min` et 1 ;
 * - pulse : échelle 1 ± `amp` autour de (ox, oy).
 * `sweep` est la zone balayée par l'animation : elle ne touche jamais le chemin ni les grilles.
 */
export interface AmbientAnim {
  id: string;
  label: string;
  kind: 'drift' | 'bob' | 'sway' | 'spin' | 'blink' | 'pulse';
  period: number;
  phase?: number;
  amp?: number;
  dx?: number;
  dy?: number;
  ox?: number;
  oy?: number;
  min?: number;
  box: Rect;
  sweep: Rect;
  svg: string;
}

/** Effets d'arène pendant le boss (lus par le rendu). */
export interface BossFx {
  /** Description courte, en français. */
  description: string;
  /** Teinte plein écran semi-transparente (ex. ciel rouge). */
  tint?: string;
  tintAlpha?: number;
  /** Effets d'écran à appliquer : 'grayscale' (sauf effets), 'ripple', 'shake', 'rotate-bg', 'stone-tint', 'snap-flash', 'lightning'. */
  effects: string[];
  /** Couleurs des Pierres (Thanos) ou autres couleurs d'effet. */
  colors?: Record<string, string>;
}

export interface LayerOpts { mode?: LayoutMode; shape?: PathShape }

/** MapDef complété pour le rendu. Compatible avec le contrat `MapDef`. */
export interface MapDefX extends MapDef {
  shape: PathShape;
  layers: { id: 'fond' | 'decor' | 'chemin' | 'details'; parallax: number; svg: (mode?: LayoutMode, shape?: PathShape) => string }[];
  /** Animations d'ambiance pour un mode (et, pour une arène, la forme du chemin de la map en cours). */
  anims: (mode?: LayoutMode, shape?: PathShape) => AmbientAnim[];
  /** Map dont la variante reprend le tracé. */
  basedOn?: string;
  bossFx?: BossFx;
  /** Texte court pour l'écran de choix de map. */
  tagline: string;
}

export type Painter = (x: number, y: number, s: number, rnd: () => number) => string;

export interface Palette {
  bg: string; sky1: string; sky2: string; ground: string; ground2: string;
  path: string; pathEdge: string; pathDeco: string;
  frame: string; frameLight: string; frameShade: string;
  cellA: string; cellB: string; accent: string; portal: string;
  [k: string]: string;
}

export type PathKind =
  | 'slabs' | 'roof' | 'planks' | 'belt' | 'rainbow' | 'parquet' | 'track' | 'stone' | 'sand' | 'cobble'
  | 'petals' | 'asphalt' | 'toytrack' | 'candy' | 'dirt' | 'rubble' | 'checker' | 'thorns' | 'reef' | 'cosmic'
  // Extension DC
  | 'wetcobble' | 'marble' | 'grating' | 'energy' | 'basalt';

export type FrameKind = 'stone' | 'concrete' | 'metal' | 'gold' | 'wood' | 'jade' | 'candy' | 'toy' | 'bone' | 'obsidian' | 'coral' | 'cosmic' | 'marble';

export interface Ctx {
  mode: LayoutMode;
  shape: PathShape;
  L: AnyLayout;
  boards: BoardLayout[];
  lanes: Lane[];
  pal: Palette;
  rnd: () => number;
  /** Zones libres de jeu, par mode. */
  z: Zones;
}

export interface Zones {
  /** Bande haute (sous le HUD), au-dessus du chemin. */
  sky: Rect;
  /** Bas de l'écran, sous le chemin (en partie sous les boutons). */
  low: Rect;
  /** Ligne horizontale libre pour les éléments qui traversent l'écran (taxis, bateaux…). */
  strip: { y: number; x0: number; x1: number };
  /** Zones latérales libres (Coop), sinon vides. */
  sides: Rect[];
}

export interface ThemeDef {
  id: string;
  name: string;
  tagline: string;
  universe: Universe;
  heroes: string[];
  shape: PathShape;
  pathMaterial: string;
  pathKind: PathKind;
  frameKind: FrameKind;
  palette: Palette;
  /** Fond : ciel, sol, horizon. Dessiné sur tout l'écran. */
  backdrop: (c: Ctx) => string;
  /** Accessoires posés automatiquement sur les emplacements libres du mode. */
  props: { big: Painter[]; med: Painter[]; small: Painter[] };
  /** Décor latéral sur mesure (en plus des accessoires). */
  extras?: (c: Ctx) => string;
  /** Porte de sortie dessinée au bout du chemin (point bas-centre). */
  gate?: Painter;
  /** Animations d'ambiance (2 ou 3). */
  anims: (c: Ctx) => AnimSpec[];
  sound: string;
  modifiers?: Record<string, number>;
  unlock: MapDef['unlock'];
  boss?: string;
  bossFx?: BossFx;
  basedOn?: string;
  /** Saturation du décor (0..1, 0,62 par défaut) et luminosité (0,82 par défaut). */
  mute?: { sat?: number; lum?: number };
}

export type AnimSpec = Omit<AmbientAnim, 'id' | 'sweep' | 'svg'> & { markup: string; id?: string };

// ---------------------------------------------------------------- couleurs

function hex(c: string): [number, number, number] {
  const h = c.replace('#', '');
  const v = h.length === 3 ? h.split('').map((x) => x + x).join('') : h;
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}
function toHex(r: number, g: number, b: number): string {
  const f = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${f(r)}${f(g)}${f(b)}`;
}
export function mix(a: string, b: string, t: number): string {
  const x = hex(a), y = hex(b);
  return toHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t);
}
/** Ton d'ombre cel-shading : vers l'encre violette, comme les planches. */
export const shade = (c: string, k = 0.32) => mix(c, '#2a1f4a', k);
export const light = (c: string, k = 0.35) => mix(c, '#ffffff', k);

// ---------------------------------------------------------------- aléatoire déterministe

export function rng(seed: string | number): () => number {
  let h = typeof seed === 'number' ? seed >>> 0 : 2166136261;
  if (typeof seed === 'string') for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619) >>> 0;
  return () => {
    h = (h + 0x6d2b79f5) >>> 0;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let uidN = 0;
export const uid = (p = 'm') => `${p}${(++uidN).toString(36)}`;

// ---------------------------------------------------------------- primitives SVG

const n1 = (v: number) => Math.round(v * 10) / 10;
export const pts = (p: Point[]) => p.map((q) => `${n1(q.x)},${n1(q.y)}`).join(' ');
export const dOf = (p: Point[]) => 'M' + p.map((q) => `${n1(q.x)} ${n1(q.y)}`).join(' L');

type Shape = (attrs: string) => string;
export const circleS = (cx: number, cy: number, r: number): Shape => (a) => `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(r)}" ${a}/>`;
export const ellS = (cx: number, cy: number, rx: number, ry: number): Shape => (a) => `<ellipse cx="${n1(cx)}" cy="${n1(cy)}" rx="${n1(rx)}" ry="${n1(ry)}" ${a}/>`;
export const rectS = (x: number, y: number, w: number, h: number, r = 0): Shape => (a) => `<rect x="${n1(x)}" y="${n1(y)}" width="${n1(w)}" height="${n1(h)}" rx="${n1(r)}" ${a}/>`;
export const pathS = (d: string): Shape => (a) => `<path d="${d}" ${a}/>`;
export const polyS = (p: Point[]): Shape => (a) => `<polygon points="${pts(p)}" ${a}/>`;

/**
 * Forme cel-shading des planches : aplat, ombre en deux tons vers le bas-droite,
 * contour épais `#1d1733` et reflet blanc optionnel.
 */
export function cel(sh: Shape, fill: string, o: { dx?: number; dy?: number; sw?: number; shadow?: string; gloss?: Shape | null } = {}): string {
  const id = uid('c');
  const dx = o.dx ?? 8, dy = o.dy ?? 10, sw = o.sw ?? SW;
  return `<clipPath id="${id}">${sh('')}</clipPath><g clip-path="url(#${id})">${sh(`fill="${o.shadow ?? shade(fill)}"`)}<g transform="translate(${-dx} ${-dy})">${sh(`fill="${fill}"`)}</g></g>${sw > 0 ? sh(`fill="none" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"`) : ''}${o.gloss ? o.gloss('fill="#fff" opacity=".55"') : ''}`;
}
/** Simple aplat contouré (sans ombre). */
export const flat = (sh: Shape, fill: string, sw = SW) => sh(`fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"`);
export const gloss = (cx: number, cy: number, rx: number, ry: number, rot = -25, op = 0.5) =>
  `<ellipse cx="${n1(cx)}" cy="${n1(cy)}" rx="${n1(rx)}" ry="${n1(ry)}" fill="#fff" opacity="${op}" transform="rotate(${rot} ${n1(cx)} ${n1(cy)})"/>`;
export const groundShadow = (x: number, y: number, rx: number, ry = rx * 0.28) =>
  `<ellipse cx="${n1(x)}" cy="${n1(y)}" rx="${n1(rx)}" ry="${n1(ry)}" fill="${INK}" opacity=".28"/>`;

// ---------------------------------------------------------------- accessoires génériques (style planches)

export const P = {
  /** Arbre rond (feuillu) : x,y = pied. */
  tree: (leaf: string, trunk = '#7a5236'): Painter => (x, y, s) => {
    const r = 46 * s;
    return groundShadow(x, y, 40 * s) +
      cel(rectS(x - 9 * s, y - 52 * s, 18 * s, 52 * s, 6 * s), trunk, { dx: 4, dy: 0 }) +
      cel(circleS(x - 26 * s, y - 70 * s, r * 0.72), leaf) + cel(circleS(x + 28 * s, y - 72 * s, r * 0.7), leaf) +
      cel(circleS(x, y - 98 * s, r), leaf, { gloss: null }) + gloss(x - 16 * s, y - 118 * s, 13 * s, 7 * s);
  },
  /** Sapin. */
  pine: (leaf: string, trunk = '#6b4a35'): Painter => (x, y, s) =>
    groundShadow(x, y, 34 * s) + cel(rectS(x - 7 * s, y - 30 * s, 14 * s, 30 * s, 4), trunk, { dx: 3, dy: 0 }) +
    [0, 1, 2].map((i) => cel(pathS(`M${n1(x - (52 - i * 12) * s)} ${n1(y - (24 + i * 34) * s)} Q${n1(x)} ${n1(y - (84 + i * 34) * s)} ${n1(x + (52 - i * 12) * s)} ${n1(y - (24 + i * 34) * s)} Q${n1(x)} ${n1(y - (12 + i * 34) * s)} ${n1(x - (52 - i * 12) * s)} ${n1(y - (24 + i * 34) * s)}Z`), leaf, { dx: 6, dy: 4 })).join(''),
  /** Rocher très arrondi. */
  rock: (c: string): Painter => (x, y, s) =>
    groundShadow(x, y, 44 * s) + cel(pathS(`M${n1(x - 44 * s)} ${n1(y)} Q${n1(x - 50 * s)} ${n1(y - 44 * s)} ${n1(x - 12 * s)} ${n1(y - 50 * s)} Q${n1(x + 30 * s)} ${n1(y - 60 * s)} ${n1(x + 44 * s)} ${n1(y - 22 * s)} Q${n1(x + 50 * s)} ${n1(y + 2 * s)} ${n1(x)} ${n1(y + 4 * s)} Q${n1(x - 30 * s)} ${n1(y + 4 * s)} ${n1(x - 44 * s)} ${n1(y)}Z`), c, { gloss: null }) +
    gloss(x - 16 * s, y - 38 * s, 10 * s, 5 * s),
  /** Buisson. */
  bush: (c: string): Painter => (x, y, s) =>
    groundShadow(x, y, 36 * s) + cel(circleS(x - 20 * s, y - 16 * s, 20 * s), c) + cel(circleS(x + 20 * s, y - 16 * s, 19 * s), c) + cel(circleS(x, y - 28 * s, 24 * s), c, { gloss: null }) + gloss(x - 8 * s, y - 40 * s, 8 * s, 4 * s),
  /** Touffe d'herbe. */
  tuft: (c: string): Painter => (x, y, s) =>
    `<path d="M${n1(x - 16 * s)} ${n1(y)} Q${n1(x - 14 * s)} ${n1(y - 18 * s)} ${n1(x - 6 * s)} ${n1(y - 26 * s)} Q${n1(x - 4 * s)} ${n1(y - 12 * s)} ${n1(x)} ${n1(y - 30 * s)} Q${n1(x + 4 * s)} ${n1(y - 12 * s)} ${n1(x + 8 * s)} ${n1(y - 24 * s)} Q${n1(x + 14 * s)} ${n1(y - 14 * s)} ${n1(x + 16 * s)} ${n1(y)}Z" fill="${c}" stroke="${INK}" stroke-width="${SW * 0.7}" stroke-linejoin="round"/>`,
  /** Caisse / cube. */
  crate: (c: string): Painter => (x, y, s) =>
    groundShadow(x, y, 34 * s) + cel(rectS(x - 30 * s, y - 56 * s, 60 * s, 56 * s, 8 * s), c, { dx: 10, dy: 0 }) +
    `<path d="M${n1(x - 22 * s)} ${n1(y - 48 * s)} L${n1(x + 22 * s)} ${n1(y - 8 * s)} M${n1(x + 22 * s)} ${n1(y - 48 * s)} L${n1(x - 22 * s)} ${n1(y - 8 * s)}" stroke="${shade(c, 0.45)}" stroke-width="${5 * s}" stroke-linecap="round"/>`,
  /** Lanterne suspendue à un poteau. */
  lantern: (c: string, pole = '#5a3b2c'): Painter => (x, y, s) =>
    groundShadow(x, y, 18 * s) + flat(rectS(x - 5 * s, y - 120 * s, 10 * s, 120 * s, 4), pole) +
    flat(pathS(`M${n1(x)} ${n1(y - 120 * s)} L${n1(x + 34 * s)} ${n1(y - 120 * s)}`), 'none') +
    cel(ellS(x + 34 * s, y - 92 * s, 17 * s, 22 * s), c) + flat(rectS(x + 26 * s, y - 118 * s, 16 * s, 8 * s, 2), INK, 0) + flat(rectS(x + 26 * s, y - 72 * s, 16 * s, 6 * s, 2), INK, 0),
  /** Champignon / champignon lumineux. */
  shroom: (cap: string, stem = '#efe2c8'): Painter => (x, y, s) =>
    groundShadow(x, y, 22 * s) + cel(rectS(x - 9 * s, y - 30 * s, 18 * s, 30 * s, 8 * s), stem, { dx: 4, dy: 0 }) +
    cel(pathS(`M${n1(x - 30 * s)} ${n1(y - 26 * s)} Q${n1(x)} ${n1(y - 70 * s)} ${n1(x + 30 * s)} ${n1(y - 26 * s)}Z`), cap) +
    `<circle cx="${n1(x - 8 * s)}" cy="${n1(y - 42 * s)}" r="${n1(5 * s)}" fill="#fff" opacity=".7"/>`,
  /** Cristal / gemme. */
  crystal: (c: string): Painter => (x, y, s) =>
    groundShadow(x, y, 26 * s) + cel(polyS([{ x: x - 18 * s, y }, { x: x - 24 * s, y: y - 40 * s }, { x: x - 6 * s, y: y - 74 * s }, { x: x + 14 * s, y: y - 50 * s }, { x: x + 18 * s, y }]), c, { dx: 8, dy: 0 }) +
    cel(polyS([{ x: x + 8 * s, y }, { x: x + 18 * s, y: y - 36 * s }, { x: x + 32 * s, y: y - 28 * s }, { x: x + 30 * s, y }]), c, { dx: 5, dy: 0 }),
};

// ---------------------------------------------------------------- zones et emplacements

export function zonesFor(L: AnyLayout): Zones {
  if (L.mode === 'solo') {
    return {
      sky: { x: 0, y: 0, w: 1000, h: 270 },
      low: { x: 0, y: 990, w: 1000, h: 610 },
      strip: { y: 1120, x0: -160, x1: 1160 },
      sides: [],
    };
  }
  return {
    sky: { x: 0, y: 0, w: 1000, h: 110 },
    low: { x: 0, y: 1290, w: 1000, h: 310 },
    strip: { y: 1345, x0: -160, x1: 1160 },
    sides: [{ x: 0, y: 340, w: 165, h: 260 }, { x: 0, y: 800, w: 165, h: 290 }],
  };
}

type Slot = { x: number; y: number; s: number; kind: 'big' | 'med' | 'small' };
const FOOT = { big: { w: 150, h: 170 }, med: { w: 100, h: 90 }, small: { w: 50, h: 34 } };

function slotsFor(mode: LayoutMode): Slot[] {
  const S = (x: number, y: number, kind: Slot['kind'], s = 1): Slot => ({ x, y, s, kind });
  if (mode === 'solo')
    return [
      S(130, 1190, 'big'), S(870, 1190, 'big'), S(500, 1640, 'big', 1.2),
      S(300, 1012, 'med', 0.8), S(700, 1012, 'med', 0.8), S(330, 1590, 'med'), S(680, 1590, 'med'),
      S(220, 980, 'small'), S(780, 980, 'small'), S(500, 1000, 'small', 0.8), S(420, 1150, 'small'), S(590, 1160, 'small'),
      S(40, 1060, 'small'), S(960, 1060, 'small'), S(260, 1110, 'small', 0.9), S(745, 1105, 'small', 0.9),
    ];
  return [
    S(85, 600, 'big', 0.85), S(85, 1090, 'big', 0.85), S(130, 1460, 'big'), S(870, 1460, 'big'),
    S(85, 450, 'med', 0.75), S(85, 940, 'med', 0.75), S(80, 770, 'med', 0.7), S(500, 1610, 'med'),
    S(300, 745, 'small', 0.9), S(410, 745, 'small', 0.8), S(140, 690, 'small'), S(40, 820, 'small'),
    S(330, 1290, 'small'), S(670, 1290, 'small'), S(960, 1300, 'small'),
  ];
}

function footprint(sl: Slot): Rect {
  const f = FOOT[sl.kind];
  return { x: sl.x - (f.w * sl.s) / 2, y: sl.y - f.h * sl.s, w: f.w * sl.s, h: f.h * sl.s };
}

// ---------------------------------------------------------------- plateau : cadre et damier

function frameColors(k: FrameKind, pal: Palette) {
  return { fill: pal.frame, light: pal.frameLight, dark: pal.frameShade, kind: k };
}

/** Cadre épais en relief (créneaux, biseau, lèvre basse) + damier clair de la grille. */
export function boardSvg(b: BoardLayout, pal: Palette, kind: FrameKind): string {
  const g = b.grid, c = b.cell;
  const t = Math.round(c * 0.21); // épaisseur du cadre
  const ox = g.x - t, oy = g.y - t, ow = g.w + 2 * t, oh = g.h + 2 * t, r = c * 0.24;
  const fc = frameColors(kind, pal);
  const lip = Math.max(5, c * 0.075);
  const sw = Math.max(3.5, c * 0.042);
  let s = '';
  // ombre portée et épaisseur (vue légèrement inclinée)
  s += `<rect x="${ox + 4}" y="${oy + lip + 8}" width="${ow}" height="${oh}" rx="${r}" fill="${INK}" opacity=".35"/>`;
  s += `<rect x="${ox}" y="${oy + lip}" width="${ow}" height="${oh}" rx="${r}" fill="${fc.dark}" stroke="${INK}" stroke-width="${sw}"/>`;
  s += `<rect x="${ox}" y="${oy}" width="${ow}" height="${oh}" rx="${r}" fill="${fc.fill}" stroke="${INK}" stroke-width="${sw}"/>`;
  // matière du cadre
  s += frameTexture(kind, ox, oy, ow, oh, t, r, fc, c);
  // créneaux sur le bord extérieur haut et bas
  const nM = 6, mw = c * 0.2, mh = c * 0.09;
  if (kind !== 'candy' && kind !== 'toy' && kind !== 'coral') {
    for (let i = 0; i < nM; i++) {
      const cx = ox + r + ((ow - 2 * r) * (i + 0.5)) / nM;
      for (const yy of [oy - mh * 0.6, oy + oh - mh * 0.4]) {
        s += `<rect x="${n1(cx - mw / 2)}" y="${n1(yy)}" width="${n1(mw)}" height="${n1(mh)}" rx="${n1(mh * 0.35)}" fill="${fc.light}" stroke="${INK}" stroke-width="${sw * 0.8}"/>`;
      }
    }
  }
  // biseau intérieur
  s += `<rect x="${g.x - 3}" y="${g.y - 3}" width="${g.w + 6}" height="${g.h + 6}" rx="${c * 0.12}" fill="${fc.dark}" stroke="${INK}" stroke-width="${sw}"/>`;
  // damier
  const clip = uid('g');
  s += `<clipPath id="${clip}"><rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" rx="${c * 0.1}"/></clipPath><g clip-path="url(#${clip})">`;
  s += `<rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" fill="${pal.cellA}"/>`;
  for (let i = 0; i < b.cells.length; i++) {
    const row = Math.floor(i / 5), col = i % 5;
    if ((row + col) % 2 === 1) s += `<rect x="${g.x + col * c}" y="${g.y + row * c}" width="${c}" height="${c}" fill="${pal.cellB}"/>`;
  }
  // ombre intérieure en haut (profondeur) et léger reflet
  s += `<rect x="${g.x}" y="${g.y}" width="${g.w}" height="${c * 0.09}" fill="${INK}" opacity=".16"/>`;
  s += `<rect x="${g.x}" y="${g.y}" width="${c * 0.06}" height="${g.h}" fill="${INK}" opacity=".08"/>`;
  s += `</g>`;
  return s;
}

function frameTexture(k: FrameKind, x: number, y: number, w: number, h: number, t: number, r: number, fc: { fill: string; light: string; dark: string }, c: number): string {
  let s = '';
  // bande claire en haut du cadre (lumière)
  s += `<rect x="${x + r * 0.5}" y="${y + t * 0.18}" width="${w - r}" height="${t * 0.22}" rx="${t * 0.11}" fill="${fc.light}" opacity=".85"/>`;
  const seam = (x1: number, y1: number, x2: number, y2: number, op = 0.45, wdt = c * 0.022) =>
    `<line x1="${n1(x1)}" y1="${n1(y1)}" x2="${n1(x2)}" y2="${n1(y2)}" stroke="${INK}" stroke-width="${n1(wdt)}" stroke-linecap="round" opacity="${op}"/>`;
  if (k === 'stone' || k === 'concrete' || k === 'jade' || k === 'obsidian' || k === 'bone' || k === 'marble') {
    // joints de blocs sur les quatre côtés
    const step = c * (k === 'concrete' ? 0.62 : k === 'marble' ? 0.8 : 0.42);
    for (let xx = x + r + step * 0.5; xx < x + w - r; xx += step) {
      s += seam(xx, y + 2, xx, y + t - 2) + seam(xx + step / 2, y + h - t + 2, xx + step / 2, y + h - 2);
    }
    for (let yy = y + r; yy < y + h - r; yy += step) s += seam(x + 2, yy, x + t - 2, yy) + seam(x + w - t + 2, yy + step / 2, x + w - 2, yy + step / 2);
  } else if (k === 'metal' || k === 'cosmic') {
    // rivets
    const step = c * 0.36;
    for (let xx = x + r; xx < x + w - r * 0.6; xx += step)
      for (const yy of [y + t / 2, y + h - t / 2]) s += `<circle cx="${n1(xx)}" cy="${n1(yy)}" r="${n1(c * 0.025)}" fill="${fc.light}" stroke="${INK}" stroke-width="${n1(c * 0.012)}"/>`;
    for (let yy = y + r; yy < y + h - r * 0.6; yy += step)
      for (const xx of [x + t / 2, x + w - t / 2]) s += `<circle cx="${n1(xx)}" cy="${n1(yy)}" r="${n1(c * 0.025)}" fill="${fc.light}" stroke="${INK}" stroke-width="${n1(c * 0.012)}"/>`;
  } else if (k === 'gold') {
    // frise : losanges
    const step = c * 0.3;
    for (let xx = x + r; xx < x + w - r * 0.6; xx += step)
      for (const yy of [y + t / 2, y + h - t / 2]) s += `<rect x="${n1(xx - c * 0.035)}" y="${n1(yy - c * 0.035)}" width="${n1(c * 0.07)}" height="${n1(c * 0.07)}" transform="rotate(45 ${n1(xx)} ${n1(yy)})" fill="${fc.light}" stroke="${INK}" stroke-width="${n1(c * 0.012)}"/>`;
  } else if (k === 'wood') {
    // planches dans la longueur + clous
    s += seam(x + r, y + t / 2, x + w - r, y + t / 2, 0.3) + seam(x + r, y + h - t / 2, x + w - r, y + h - t / 2, 0.3);
    const step = c * 0.9;
    for (let xx = x + r; xx < x + w - r; xx += step) s += seam(xx, y + 2, xx, y + t - 2, 0.5) + seam(xx + step / 2, y + h - t + 2, xx + step / 2, y + h - 2, 0.5);
  } else if (k === 'candy' || k === 'toy') {
    // rayures de sucre d'orge / plastique
    const step = c * 0.22, id = uid('k');
    s += `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/></clipPath><g clip-path="url(#${id})" opacity=".55">`;
    for (let xx = x - h; xx < x + w; xx += step * 2) s += `<path d="M${n1(xx)} ${n1(y + h)} L${n1(xx + h)} ${n1(y)} L${n1(xx + h + step)} ${n1(y)} L${n1(xx + step)} ${n1(y + h)}Z" fill="${fc.light}"/>`;
    s += `</g>`;
  } else if (k === 'coral') {
    const rr = rng(x + y);
    for (let i = 0; i < 40; i++) {
      const side = i % 4;
      const px = side < 2 ? x + r + rr() * (w - 2 * r) : side === 2 ? x + t / 2 : x + w - t / 2;
      const py = side === 0 ? y + t / 2 : side === 1 ? y + h - t / 2 : y + r + rr() * (h - 2 * r);
      s += `<circle cx="${n1(px)}" cy="${n1(py)}" r="${n1(c * (0.02 + rr() * 0.03))}" fill="${fc.light}" opacity=".7"/>`;
    }
  }
  return s;
}

// ---------------------------------------------------------------- chemin

export function laneSvg(lane: Lane, pal: Palette, kind: PathKind, seed: string): string {
  const d = dOf(lane.points);
  const w = lane.width, c = lane.cell;
  const rr = rng(seed + ':' + lane.points.length + ':' + Math.round(lane.points[0]!.x));
  const st = (color: string, width: number, extra = '', cap = 'round') =>
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="${n1(width)}" stroke-linejoin="round" stroke-linecap="${cap}" ${extra}/>`;
  let s = '';
  // ombre portée (inclinaison), contour, bord, aplat
  s += `<g transform="translate(3 ${n1(c * 0.07)})">${st(INK, w + c * 0.12, 'opacity=".35"')}</g>`;
  s += st(INK, w + c * 0.1);
  s += st(pal.pathEdge, w + c * 0.03);
  s += st(pal.path, w - c * 0.08);
  const dash = (color: string, width: number, on: number, off: number, extra = '') => st(color, width, `stroke-dasharray="${n1(on)} ${n1(off)}" ${extra}`, 'butt');
  const along = (count: number, f: (p: { x: number; y: number; angle: number }, i: number) => string) => {
    let out = '';
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5 + (rr() - 0.5) * 0.6) / count;
      const p = pointAtLane(lane.points, t);
      out += f(p, i);
    }
    return out;
  };
  const inner = w - c * 0.12;
  switch (kind) {
    case 'slabs':
    case 'stone':
    case 'cobble': {
      const step = kind === 'cobble' ? c * 0.22 : kind === 'stone' ? c * 0.5 : c * 0.36;
      s += dash(INK, inner, c * 0.025, step, 'opacity=".32"');
      // joint longitudinal décalé
      s += st(INK, c * 0.02, `opacity=".22" stroke-dasharray="${n1(step)} ${n1(step)}"`, "butt");
      if (kind === 'cobble') s += st(pal.pathDeco, inner * 0.55, `opacity=".35" stroke-dasharray="${n1(step * 0.5)} ${n1(step * 1.5)}"`, "butt");
      else s += along(Math.round(lane.cells * 2), (p) => `<circle cx="${n1(p.x + (rr() - 0.5) * w * 0.5)}" cy="${n1(p.y + (rr() - 0.5) * w * 0.5)}" r="${n1(c * 0.03)}" fill="${pal.pathDeco}" opacity=".6"/>`);
      break;
    }
    case 'roof': {
      // toit en membrane + tronçons de passerelle métallique à lattes
      const on = c * 1.1, P = c * 2.4, off = `stroke-dashoffset="${n1(c * 0.4)}"`;
      // joints de dalles du toit
      s += dash(INK, inner, c * 0.02, c * 0.4, 'opacity=".22"');
      // passerelles : tôle bleutée, bords et lattes uniquement sur ces tronçons
      s += dash(INK, inner + c * 0.02, on, P - on, `${off} opacity=".5"`);
      s += dash(pal.pathDeco, inner - c * 0.03, on, P - on, off);
      const g = c * 0.14, k = Math.floor(on / g);
      const arr = [] as number[];
      for (let i = 0; i < k; i++) arr.push(c * 0.03, i === k - 1 ? P - (k - 1) * g - c * 0.03 : g - c * 0.03);
      s += st(INK, inner - c * 0.03, `stroke-dasharray="${arr.map(n1).join(' ')}" stroke-dashoffset="${n1(c * 0.4 - (on - (k - 1) * g - c * 0.03) / 2)}" opacity=".35"`, 'butt');
      s += dash(light(pal.pathDeco, 0.4), c * 0.03, on, P - on, `${off} opacity=".7"`);
      break;
    }
    case 'planks':
      s += dash(INK, inner, c * 0.025, c * 0.22, 'opacity=".38"');
      s += st(light(pal.path, 0.2), inner * 0.3, `opacity=".35" stroke-dasharray="${n1(c * 0.6)} ${n1(c * 0.5)}"`, "butt");
      break;
    case 'belt':
      s += st(pal.pathDeco, inner * 0.7);
      s += dash(INK, inner * 0.7, c * 0.06, c * 0.18, 'opacity=".45"');
      s += st(light(pal.pathEdge, 0.3), c * 0.02, `transform="translate(0 0)" opacity=".5"`);
      break;
    case 'rainbow': {
      const cols = ['#d9746a', '#e3b45c', '#d8d46f', '#77c08a', '#6aa6d6', '#9a83cf'];
      cols.forEach((col, i) => { s += st(col, inner * (1 - i / cols.length)); });
      s += dash('#ffffff', inner * 0.08, c * 0.3, c * 0.5, 'opacity=".5"');
      break;
    }
    case 'parquet':
      s += dash(pal.pathDeco, inner, c * 0.18, c * 0.18);
      s += dash(INK, inner, c * 0.02, c * 0.16, 'opacity=".35"');
      s += st(INK, c * 0.018, 'opacity=".3"');
      break;
    case 'track':
      s += st('#f1ece4', c * 0.02, `opacity=".7"`);
      s += `<g opacity=".7">${st('#f1ece4', inner * 0.62)}${st(pal.path, inner * 0.62 - c * 0.04)}</g>`;
      s += dash('#f1ece4', inner, c * 0.02, c * 1.4, 'opacity=".6"');
      break;
    case 'sand':
    case 'dirt':
    case 'rubble':
      s += st(pal.pathDeco, inner * 0.55, 'opacity=".35"');
      s += along(Math.round(lane.cells * (kind === 'rubble' ? 5 : 4)), (p) => {
        const off = (rr() - 0.5) * w * 0.7, rad = c * (kind === 'rubble' ? 0.03 + rr() * 0.04 : 0.02 + rr() * 0.02);
        const x = p.x - Math.sin(p.angle) * off, y = p.y + Math.cos(p.angle) * off;
        return `<ellipse cx="${n1(x)}" cy="${n1(y)}" rx="${n1(rad * 1.3)}" ry="${n1(rad)}" fill="${rr() < 0.5 ? pal.pathDeco : shade(pal.path, 0.25)}" stroke="${INK}" stroke-width="${n1(c * 0.01)}" stroke-opacity=".5"/>`;
      });
      break;
    case 'petals':
      s += along(Math.round(lane.cells * 7), (p) => {
        const off = (rr() - 0.5) * w * 0.8;
        const x = p.x - Math.sin(p.angle) * off, y = p.y + Math.cos(p.angle) * off;
        return `<ellipse cx="${n1(x)}" cy="${n1(y)}" rx="${n1(c * 0.05)}" ry="${n1(c * 0.025)}" transform="rotate(${Math.round(rr() * 180)} ${n1(x)} ${n1(y)})" fill="${rr() < 0.5 ? pal.pathDeco : light(pal.path, 0.25)}"/>`;
      });
      s += dash(INK, inner, c * 0.02, c * 0.5, 'opacity=".2"');
      break;
    case 'asphalt':
      s += dash(pal.pathDeco, c * 0.04, c * 0.25, c * 0.2);
      s += `<g opacity=".55">${st('#e8e6ee', inner - c * 0.02)}${st(pal.path, inner - c * 0.06)}</g>`;
      s += dash(pal.pathDeco, c * 0.04, c * 0.25, c * 0.2);
      break;
    case 'toytrack':
      s += st(pal.pathDeco, inner * 0.82);
      s += st(pal.path, inner * 0.7);
      s += dash(INK, inner * 0.82, c * 0.02, c * 0.55, 'opacity=".4"');
      s += dash('#fff', c * 0.03, c * 0.18, c * 0.18, 'opacity=".45"');
      break;
    case 'candy':
      s += dash(pal.pathDeco, inner, c * 0.2, c * 0.2);
      s += st('#ffffff', inner * 0.18, 'opacity=".25"');
      break;
    case 'checker':
      s += dash(pal.pathDeco, inner * 0.5, c * 0.25, c * 0.25, `transform="translate(0 0)"`);
      s += dash(pal.pathDeco, inner, c * 0.25, c * 0.25, `stroke-dashoffset="${n1(c * 0.25)}" opacity=".0"`);
      s += `<g opacity=".9">${dash(pal.pathDeco, inner, c * 0.25, c * 0.25)}</g>${dash(pal.path, inner * 0.5, c * 0.25, c * 0.25)}${dash(pal.pathDeco, inner * 0.5, c * 0.25, c * 0.25, `stroke-dashoffset="${n1(c * 0.25)}"`)}`;
      break;
    case 'thorns':
      s += dash(INK, inner, c * 0.025, c * 0.4, 'opacity=".35"');
      s += along(Math.round(lane.cells * 2.4), (p) => {
        const side = rr() < 0.5 ? -1 : 1, off = side * w * 0.47;
        const x = p.x - Math.sin(p.angle) * off, y = p.y + Math.cos(p.angle) * off;
        return `<path d="M${n1(x - 6)} ${n1(y)} L${n1(x)} ${n1(y - 14 * side)} L${n1(x + 6)} ${n1(y)}Z" fill="${pal.pathDeco}" stroke="${INK}" stroke-width="2"/>`;
      });
      break;
    case 'reef':
      s += st(pal.pathDeco, inner * 0.5, 'opacity=".3"');
      s += along(Math.round(lane.cells * 3), (p) => {
        const off = (rr() - 0.5) * w * 0.7;
        const x = p.x - Math.sin(p.angle) * off, y = p.y + Math.cos(p.angle) * off;
        return `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(c * (0.02 + rr() * 0.025))}" fill="${light(pal.path, 0.35)}" opacity=".7"/>`;
      });
      break;
    case 'cosmic':
      s += st(pal.pathDeco, inner * 0.4, 'opacity=".4"');
      s += dash(INK, inner, c * 0.025, c * 0.45, 'opacity=".4"');
      s += along(Math.round(lane.cells * 3), (p) => `<circle cx="${n1(p.x + (rr() - 0.5) * w * 0.6)}" cy="${n1(p.y + (rr() - 0.5) * w * 0.6)}" r="${n1(c * 0.015)}" fill="#fff" opacity=".7"/>`);
      break;
    case 'wetcobble': {
      // pavés mouillés : joints serrés et flaques qui reflètent la lumière
      const step = c * 0.24;
      s += dash(INK, inner, c * 0.022, step, 'opacity=".3"');
      s += st(pal.pathDeco, inner * 0.5, `opacity=".3" stroke-dasharray="${n1(step * 0.5)} ${n1(step * 1.5)}"`, 'butt');
      s += along(Math.round(lane.cells * 1.2), (p) => {
        const off = (rr() - 0.5) * w * 0.45;
        const x = p.x - Math.sin(p.angle) * off, y = p.y + Math.cos(p.angle) * off, rx = c * (0.1 + rr() * 0.08);
        return `<ellipse cx="${n1(x)}" cy="${n1(y)}" rx="${n1(rx)}" ry="${n1(rx * 0.42)}" fill="${light(pal.pathDeco, 0.25)}" opacity=".55"/>` +
          `<ellipse cx="${n1(x - rx * 0.3)}" cy="${n1(y - rx * 0.12)}" rx="${n1(rx * 0.35)}" ry="${n1(rx * 0.1)}" fill="#fff" opacity=".55"/>`;
      });
      break;
    }
    case 'marble': {
      // dalles de marbre : grands joints, veines grises, frise dorée au centre
      s += dash(INK, inner, c * 0.022, c * 0.5, 'opacity=".28"');
      s += along(Math.round(lane.cells * 1.6), (p) => {
        const off = (rr() - 0.5) * w * 0.55, x = p.x - Math.sin(p.angle) * off, y = p.y + Math.cos(p.angle) * off, k = c * 0.12;
        return `<path d="M${n1(x - k)} ${n1(y - k * 0.4)} q${n1(k * 0.5)} ${n1(-k * 0.5)} ${n1(k)} 0 t${n1(k)} ${n1(k * 0.2)}" stroke="${shade(pal.path, 0.35)}" stroke-width="${n1(c * 0.012)}" fill="none" opacity=".6"/>`;
      });
      s += dash(pal.pathDeco, c * 0.03, c * 0.12, c * 0.08, 'opacity=".75"');
      break;
    }
    case 'grating':
      // caillebotis métallique : lattes serrées, bordures rivetées
      s += st(shade(pal.path, 0.18), inner * 0.86);
      s += dash(INK, inner * 0.86, c * 0.02, c * 0.1, 'opacity=".38"');
      s += dash(pal.pathDeco, inner, c * 0.04, c * 0.36, 'opacity=".8"');
      s += st(INK, c * 0.016, 'opacity=".25"');
      break;
    case 'energy':
      // énergie construite : bande lumineuse, cœur blanc, chevrons
      s += st(pal.pathDeco, inner * 0.5, 'opacity=".38"');
      s += st('#ffffff', inner * 0.12, 'opacity=".45"');
      s += dash(INK, inner, c * 0.02, c * 0.48, 'opacity=".25"');
      s += along(Math.round(lane.cells * 2.5), (p) => `<circle cx="${n1(p.x + (rr() - 0.5) * w * 0.6)}" cy="${n1(p.y + (rr() - 0.5) * w * 0.6)}" r="${n1(c * 0.014)}" fill="#fff" opacity=".8"/>`);
      break;
    case 'basalt':
      // basalte sombre fendu de lave
      s += dash(INK, inner, c * 0.025, c * 0.34, 'opacity=".38"');
      s += along(Math.round(lane.cells * 1.8), (p) => {
        const off = (rr() - 0.5) * w * 0.5, x = p.x - Math.sin(p.angle) * off, y = p.y + Math.cos(p.angle) * off, k = c * 0.09;
        const d = `M${n1(x - k)} ${n1(y - k * 0.3)} L${n1(x - k * 0.3)} ${n1(y + k * 0.25)} L${n1(x + k * 0.2)} ${n1(y - k * 0.2)} L${n1(x + k)} ${n1(y + k * 0.3)}`;
        return `<path d="${d}" stroke="${pal.pathDeco}" stroke-width="${n1(c * 0.05)}" fill="none" stroke-linejoin="round" opacity=".35"/><path d="${d}" stroke="${light(pal.pathDeco, 0.4)}" stroke-width="${n1(c * 0.018)}" fill="none" stroke-linejoin="round"/>`;
      });
      break;
  }
  // reflet doux en haut à gauche de la bande
  s += `<g transform="translate(${n1(-w * 0.18)} ${n1(-w * 0.2)})">${st('#ffffff', c * 0.025, 'opacity=".22"')}</g>`;
  return s;
}

function pointAtLane(p: Point[], t: number) {
  // version locale (évite l'import circulaire de pointAt pour le tri des usages)
  let total = 0;
  for (let i = 1; i < p.length; i++) total += Math.hypot(p[i]!.x - p[i - 1]!.x, p[i]!.y - p[i - 1]!.y);
  let d = t * total;
  for (let i = 1; i < p.length; i++) {
    const a = p[i - 1]!, b = p[i]!, seg = Math.hypot(b.x - a.x, b.y - a.y);
    if (d <= seg) { const k = seg ? d / seg : 0; return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, angle: Math.atan2(b.y - a.y, b.x - a.x) }; }
    d -= seg;
  }
  const q = p[p.length - 1]!;
  return { x: q.x, y: q.y, angle: 0 };
}

/** Portail d'entrée (statique) au début du chemin. */
export function portalSvg(lane: Lane, color: string): string {
  const p = lane.points[0]!, q = lane.points[1]!;
  const ang = Math.atan2(q.y - p.y, q.x - p.x);
  const c = lane.cell, r = lane.width * 0.62;
  // centré juste avant le départ (dans le prolongement)
  const cx = p.x - Math.cos(ang) * r * 0.55, cy = p.y - Math.sin(ang) * r * 0.55;
  return `<g>${groundShadow(cx, cy + r * 0.55, r * 1.05, r * 0.3)}` +
    `<ellipse cx="${n1(cx)}" cy="${n1(cy)}" rx="${n1(r * 1.08)}" ry="${n1(r * 0.72)}" fill="${shade(color, 0.5)}" stroke="${INK}" stroke-width="${n1(c * 0.05)}"/>` +
    `<ellipse cx="${n1(cx)}" cy="${n1(cy)}" rx="${n1(r * 0.82)}" ry="${n1(r * 0.52)}" fill="${color}" opacity=".9"/>` +
    `<path d="M${n1(cx - r * 0.5)} ${n1(cy)} A${n1(r * 0.5)} ${n1(r * 0.32)} 0 1 1 ${n1(cx + r * 0.3)} ${n1(cy + r * 0.12)} A${n1(r * 0.3)} ${n1(r * 0.2)} 0 1 1 ${n1(cx - r * 0.05)} ${n1(cy - r * 0.05)}" fill="none" stroke="#fff" stroke-width="${n1(c * 0.03)}" stroke-linecap="round" opacity=".75"/>` +
    `<ellipse cx="${n1(cx - r * 0.35)}" cy="${n1(cy - r * 0.3)}" rx="${n1(r * 0.22)}" ry="${n1(r * 0.08)}" fill="#fff" opacity=".6"/></g>`;
}

/** Porte de château par défaut (sortie). x,y = pied. */
export const defaultGate = (stone: string, door = '#4a3348'): Painter => (x, y, s) => {
  const w = 120 * s, h = 110 * s;
  return groundShadow(x, y, w * 0.6) +
    cel(rectS(x - w / 2, y - h, w * 0.3, h, 8 * s), stone) + cel(rectS(x + w / 2 - w * 0.3, y - h, w * 0.3, h, 8 * s), stone) +
    cel(rectS(x - w * 0.36, y - h * 0.78, w * 0.72, h * 0.78, 10 * s), stone, { dx: 6, dy: 0 }) +
    flat(pathS(`M${n1(x - w * 0.22)} ${n1(y)} L${n1(x - w * 0.22)} ${n1(y - h * 0.4)} Q${n1(x)} ${n1(y - h * 0.72)} ${n1(x + w * 0.22)} ${n1(y - h * 0.4)} L${n1(x + w * 0.22)} ${n1(y)}Z`), door) +
    [0, 1, 2].map((i) => flat(rectS(x - w / 2 + i * 0.12 * w - 2, y - h - 12 * s, w * 0.09, 14 * s, 3), stone, SW * 0.7)).join('') +
    [0, 1, 2].map((i) => flat(rectS(x + w / 2 - w * 0.3 + i * 0.12 * w - 2, y - h - 12 * s, w * 0.09, 14 * s, 3), stone, SW * 0.7)).join('');
};

/** Emplacements des portes de sortie (pied de la porte) : sous la fin du chemin en Solo, au bout du tronc en Coop. */
function gatesOf(L: AnyLayout): { x: number; y: number; s: number }[] {
  if (L.mode === 'solo') {
    const p = L.lane.points[L.lane.points.length - 1]!;
    return [{ x: p.x, y: p.y + L.lane.width * 0.95, s: L.lane.cell / 144 }];
  }
  const p = L.trunk.points[L.trunk.points.length - 1]!;
  return [{ x: p.x - L.trunk.width * 0.15, y: p.y + L.trunk.width * 0.5, s: (L.trunk.cell / 144) * 0.95 }];
}

/** Départs (portails) : un en Solo, deux en Coop (les branches). */
function startsOf(L: AnyLayout): Lane[] {
  return L.mode === 'solo' ? [L.lane] : [L.branchB, L.branchA];
}

// ---------------------------------------------------------------- composition des couches

function muteFilter(id: string, sat: number, lum: number): string {
  return `<filter id="${id}" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="${sat}"/><feComponentTransfer><feFuncR type="linear" slope="${lum}"/><feFuncG type="linear" slope="${lum}"/><feFuncB type="linear" slope="${lum}"/></feComponentTransfer></filter>`;
}

const svgDoc = (inner: string, box: Rect = { x: 0, y: 0, w: SCREEN.w, h: SCREEN.h }) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box.x} ${box.y} ${box.w} ${box.h}" width="${box.w}" height="${box.h}">${inner}</svg>`;

function makeCtx(t: ThemeDef, mode: LayoutMode, shape: PathShape, salt: string): Ctx {
  const L = layoutFor(mode, shape);
  const { boards, lanes } = boardsOf(L);
  return { mode, shape, L, boards, lanes, pal: t.palette, rnd: rng(`${t.id}:${mode}:${shape}:${salt}`), z: zonesFor(L) };
}

/** Accessoires placés sur les emplacements libres du mode (ceux qui touchent le jeu sont écartés). */
export function placeProps(t: ThemeDef, c: Ctx): string {
  const r = rng(`${t.id}:${c.mode}:${c.shape}:props`);
  const counters = { big: 0, med: 0, small: 0 };
  const slots = slotsFor(c.mode).filter((sl) => !rectHitsPlay(footprint(sl), c.L)).sort((a, b) => a.y - b.y);
  let s = '';
  for (const sl of slots) {
    const list = t.props[sl.kind];
    if (!list.length) continue;
    const painter = list[counters[sl.kind]++ % list.length]!;
    s += painter(sl.x, sl.y, sl.s, r);
  }
  return s;
}

function animSweep(a: AnimSpec): Rect {
  const b = a.box;
  switch (a.kind) {
    case 'drift': {
      const dx = a.dx ?? 0, dy = a.dy ?? 0;
      return { x: Math.min(b.x, b.x + dx), y: Math.min(b.y, b.y + dy), w: b.w + Math.abs(dx), h: b.h + Math.abs(dy) };
    }
    case 'bob': { const m = a.amp ?? 0; return { x: b.x, y: b.y - m, w: b.w, h: b.h + 2 * m }; }
    case 'sway': case 'spin': {
      // rayon maximal autour du pivot
      const ox = a.ox ?? b.x + b.w / 2, oy = a.oy ?? b.y + b.h / 2;
      const R = Math.max(...[[b.x, b.y], [b.x + b.w, b.y], [b.x, b.y + b.h], [b.x + b.w, b.y + b.h]].map(([x, y]) => Math.hypot(x! - ox, y! - oy)));
      if (a.kind === 'spin') return { x: ox - R, y: oy - R, w: 2 * R, h: 2 * R };
      const m = R * Math.sin(((a.amp ?? 10) * Math.PI) / 180);
      return { x: b.x - m, y: b.y - m, w: b.w + 2 * m, h: b.h + 2 * m };
    }
    case 'pulse': { const m = (a.amp ?? 0.1) * Math.max(b.w, b.h); return { x: b.x - m, y: b.y - m, w: b.w + 2 * m, h: b.h + 2 * m }; }
    default: return b;
  }
}

/** Construit un MapDef complet à partir d'un thème. */
export function defineMap(t: ThemeDef): MapDefX {
  const sat = t.mute?.sat ?? 0.72, lum = t.mute?.lum ?? 0.86;
  const muted = (inner: string) => {
    const f = uid('mute');
    return `<defs>${muteFilter(f, sat, lum)}</defs><g filter="url(#${f})">${inner}</g>`;
  };
  const solo = layoutFor('solo', t.shape) as SoloLayout;
  const coop = layoutFor('coop', t.shape) as CoopLayout;

  const anims = (mode: LayoutMode = 'solo', shape: PathShape = t.shape): AmbientAnim[] => {
    const c = makeCtx(t, mode, shape, 'anims');
    return t.anims(c).map((a, i) => {
      const id = a.id ?? `${t.id}-${mode}-${i}`;
      const box = { x: Math.floor(a.box.x), y: Math.floor(a.box.y), w: Math.ceil(a.box.w), h: Math.ceil(a.box.h) };
      const { markup, ...rest } = a;
      return { ...rest, id, box, sweep: animSweep(a), svg: svgDoc(muted(markup), box) };
    });
  };

  const layers: MapDefX['layers'] = [
    { id: 'fond', parallax: 0.3, svg: (mode = 'solo', shape = t.shape) => svgDoc(muted(t.backdrop(makeCtx(t, mode, shape, 'fond')))) },
    {
      id: 'decor', parallax: 0.6, svg: (mode = 'solo', shape = t.shape) => {
        const c = makeCtx(t, mode, shape, 'decor');
        let s = (t.extras ? t.extras(c) : '') + placeProps(t, c);
        return svgDoc(muted(s));
      },
    },
    {
      id: 'chemin', parallax: 1, svg: (mode = 'solo', shape = t.shape) => {
        const c = makeCtx(t, mode, shape, 'chemin');
        let s = '';
        // Le chemin et le plateau restent plus saturés et plus clairs que le décor.
        for (const lane of c.lanes) s += laneSvg(lane, t.palette, t.pathKind, t.id);
        for (const lane of startsOf(c.L)) s += portalSvg(lane, t.palette.portal);
        const gate = t.gate ?? defaultGate(t.palette.frame);
        for (const g of gatesOf(c.L)) s += gate(g.x, g.y, g.s, c.rnd);
        for (const b of c.boards) s += boardSvg(b, t.palette, t.frameKind);
        const f = uid('pm');
        return svgDoc(`<defs>${muteFilter(f, Math.min(1, sat + 0.25), Math.min(1, lum + 0.12))}</defs><g filter="url(#${f})">${s}</g>`);
      },
    },
    {
      id: 'details', parallax: 1, svg: (mode = 'solo', shape = t.shape) => {
        const c = makeCtx(t, mode, shape, 'anims');
        return svgDoc(muted(t.anims(c).map((a) => a.markup).join('')));
      },
    },
  ];

  return {
    id: t.id,
    name: t.name,
    tagline: t.tagline,
    universe: t.universe,
    heroes: t.heroes,
    shape: t.shape,
    path: solo.lane.points,
    pathCoop: { a: coop.branchA.points, b: coop.branchB.points, tronc: coop.trunk.points },
    pathLength: solo.lane.cells,
    pathLengthCoop: { a: coop.branchA.cells, b: coop.branchB.cells, tronc: coop.trunk.cells },
    pathMaterial: t.pathMaterial,
    palette: t.palette,
    layers,
    anims,
    ambience: t.anims(makeCtx(t, 'solo', t.shape, 'anims')).map((a) => a.label),
    sound: t.sound,
    ...(t.modifiers ? { modifiers: t.modifiers } : {}),
    unlock: t.unlock,
    ...(t.boss ? { boss: t.boss } : {}),
    ...(t.bossFx ? { bossFx: t.bossFx } : {}),
    ...(t.basedOn ? { basedOn: t.basedOn } : {}),
  };
}

// ---------------------------------------------------------------- aides de fond

/** Ciel en dégradé vertical + sol plein, avec texture de taches. */
export function skyAndGround(c: Ctx, o: { skyTo?: number; groundTexture?: 'spots' | 'grass' | 'none' | 'tiles' } = {}): string {
  const id = uid('sky');
  const skyTo = o.skyTo ?? c.z.sky.h + 40;
  let s = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.pal.sky1}"/><stop offset="1" stop-color="${c.pal.sky2}"/></linearGradient></defs>`;
  s += `<rect width="1000" height="1600" fill="${c.pal.ground}"/>`;
  s += `<rect width="1000" height="${skyTo}" fill="url(#${id})"/>`;
  const tex = o.groundTexture ?? 'spots';
  if (tex === 'spots' || tex === 'grass') {
    for (let i = 0; i < 70; i++) {
      const x = c.rnd() * 1000, y = skyTo + c.rnd() * (1600 - skyTo), r = 10 + c.rnd() * 26;
      s += tex === 'grass'
        ? `<path d="M${n1(x - 8)} ${n1(y)} l4 -12 l4 9 l4 -14 l4 17z" fill="${c.pal.ground2}" opacity=".8"/>`
        : `<ellipse cx="${n1(x)}" cy="${n1(y)}" rx="${n1(r)}" ry="${n1(r * 0.55)}" fill="${c.pal.ground2}" opacity=".7"/>`;
    }
  }
  if (tex === 'tiles') {
    for (let y = skyTo; y < 1600; y += 80) for (let x = (y / 80) % 2 ? 0 : 40; x < 1000; x += 80)
      s += `<rect x="${x}" y="${n1(y)}" width="80" height="80" fill="${c.pal.ground2}" opacity=".5"/>`;
  }
  return s;
}

/** Nuage arrondi. */
export const cloud = (x: number, y: number, s: number, col = '#f4eef8') =>
  cel(pathS(`M${n1(x - 60 * s)} ${n1(y)} Q${n1(x - 70 * s)} ${n1(y - 30 * s)} ${n1(x - 38 * s)} ${n1(y - 30 * s)} Q${n1(x - 30 * s)} ${n1(y - 58 * s)} ${n1(x)} ${n1(y - 52 * s)} Q${n1(x + 30 * s)} ${n1(y - 70 * s)} ${n1(x + 44 * s)} ${n1(y - 34 * s)} Q${n1(x + 74 * s)} ${n1(y - 30 * s)} ${n1(x + 64 * s)} ${n1(y)}Z`), col, { dx: 0, dy: 10, sw: SW * 0.8 });

/** Étoile à 4 branches (scintillement). */
export const sparkle = (x: number, y: number, r: number, col = '#fff') =>
  `<path d="M${n1(x)} ${n1(y - r)} Q${n1(x + r * 0.18)} ${n1(y - r * 0.18)} ${n1(x + r)} ${n1(y)} Q${n1(x + r * 0.18)} ${n1(y + r * 0.18)} ${n1(x)} ${n1(y + r)} Q${n1(x - r * 0.18)} ${n1(y + r * 0.18)} ${n1(x - r)} ${n1(y)} Q${n1(x - r * 0.18)} ${n1(y - r * 0.18)} ${n1(x)} ${n1(y - r)}Z" fill="${col}"/>`;

/** Rectangle englobant pour une animation ; marge en px. */
export const boxAround = (x: number, y: number, w: number, h: number, m = 8): Rect => ({ x: x - m, y: y - m, w: w + 2 * m, h: h + 2 * m });

export { n1 };

// ---------------------------------------------------------------- aides de scène communes

/** Points libres (ni chemin ni grille) pour les petites animations, par mode. Rayon utile ≈ 40 px. */
export type Spots = [Point, Point, Point, Point, Point, Point];
export function spots(c: Ctx): Spots {
  return c.mode === 'solo'
    ? [{ x: 230, y: 1065 }, { x: 770, y: 1065 }, { x: 500, y: 1090 }, { x: 140, y: 160 }, { x: 860, y: 160 }, { x: 500, y: 150 }]
    : [{ x: 70, y: 480 }, { x: 70, y: 950 }, { x: 70, y: 700 }, { x: 140, y: 60 }, { x: 860, y: 60 }, { x: 500, y: 60 }];
}

/** Base du ciel (horizon) selon le mode. */
export const horizonY = (c: Ctx) => (c.mode === 'solo' ? 270 : 118);

/** Dalle de sol plus claire sous chaque plateau (le plateau reste la zone la plus lisible). */
export function boardPads(c: Ctx, color: string, margin = 0.85, op = 1): string {
  return c.boards.map((b) => {
    const g = b.grid, m = b.cell * margin;
    return `<rect x="${n1(g.x - m)}" y="${n1(g.y - m)}" width="${n1(g.w + 2 * m)}" height="${n1(g.h + 2 * m)}" rx="${n1(b.cell * 0.45)}" fill="${color}" opacity="${op}"/>`;
  }).join('');
}

/** Collines arrondies (silhouette) posées sur `base`. */
export function hills(base: number, color: string, amp: number, seed: string, n = 6, outline = true): string {
  const r = rng(seed);
  let d = `M-20 ${base + 200} L-20 ${base}`;
  const step = 1040 / n;
  for (let i = 0; i < n; i++) {
    const x0 = -20 + i * step, h = amp * (0.55 + r() * 0.45);
    d += ` Q${n1(x0 + step * 0.5)} ${n1(base - h * 2)} ${n1(x0 + step)} ${n1(base)}`;
  }
  d += ` L1020 ${base + 200}Z`;
  return `<path d="${d}" fill="${color}" ${outline ? `stroke="${INK}" stroke-width="${SW * 0.8}" stroke-linejoin="round"` : ''}/>`;
}

/** Montagnes pointues arrondies. */
export function peaks(base: number, color: string, amp: number, seed: string, n = 5, snow?: string): string {
  const r = rng(seed);
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = -60 + (i + r() * 0.4) * (1120 / n), w = 1120 / n * 0.9, h = amp * (0.6 + r() * 0.5);
    s += cel(pathS(`M${n1(x - w * 0.7)} ${n1(base + 30)} Q${n1(x - w * 0.15)} ${n1(base - h * 0.7)} ${n1(x)} ${n1(base - h)} Q${n1(x + w * 0.15)} ${n1(base - h * 0.7)} ${n1(x + w * 0.7)} ${n1(base + 30)}Z`), color, { dx: 16, dy: 0, sw: SW * 0.8 });
    if (snow) s += `<path d="M${n1(x - w * 0.16)} ${n1(base - h * 0.72)} Q${n1(x)} ${n1(base - h * 1.04)} ${n1(x + w * 0.16)} ${n1(base - h * 0.72)} Q${n1(x)} ${n1(base - h * 0.62)} ${n1(x - w * 0.16)} ${n1(base - h * 0.72)}Z" fill="${snow}"/>`;
  }
  return s;
}

/** Étoiles fixes dans une zone. */
export function stars(c: Ctx, n: number, area: Rect, col = '#fff'): string {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = area.x + c.rnd() * area.w, y = area.y + c.rnd() * area.h, r = 1.5 + c.rnd() * 3;
    s += i % 5 === 0 ? sparkle(x, y, r * 3, col) : `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r)}" fill="${col}" opacity="${n1(0.5 + c.rnd() * 0.5)}"/>`;
  }
  return s;
}

/** Fond standard : ciel en dégradé, sol texturé, horizon personnalisé, dalles sous les plateaux. */
export function scene(c: Ctx, o: { horizon?: (base: number) => string; texture?: 'spots' | 'grass' | 'none' | 'tiles'; pad?: string; padMargin?: number; after?: string }): string {
  const base = horizonY(c);
  let s = skyAndGround(c, { skyTo: base + 30, groundTexture: o.texture ?? 'spots' });
  if (o.horizon) s += o.horizon(base);
  if (o.pad) s += boardPads(c, o.pad, o.padMargin ?? 0.85);
  return s + (o.after ?? '');
}

/** Anim : un élément qui traverse l'écran sur une ligne horizontale libre. */
export function across(label: string, y: number, period: number, markup: (x: number, y: number) => string, size: { w: number; h: number }, o: { phase?: number; reverse?: boolean; x0?: number; x1?: number } = {}): AnimSpec {
  const x0 = o.x0 ?? -size.w - 20, x1 = o.x1 ?? 1000 + 20;
  const start = o.reverse ? x1 : x0;
  return {
    label, kind: 'drift', period, phase: o.phase ?? 0, dx: o.reverse ? x0 - x1 : x1 - x0, dy: 0,
    box: { x: start, y: y - size.h, w: size.w, h: size.h + 10 }, markup: markup(start + size.w / 2, y),
  };
}

/** Anim ponctuelle centrée sur un point (blink, bob, sway, spin, pulse). */
export function at(label: string, kind: AmbientAnim['kind'], p: Point, r: number, markup: string, o: Partial<AmbientAnim> = {}): AnimSpec {
  return { label, kind, period: o.period ?? 3, phase: o.phase ?? 0, amp: o.amp, min: o.min, ox: o.ox ?? p.x, oy: o.oy ?? p.y, box: { x: p.x - r, y: p.y - r, w: 2 * r, h: 2 * r }, markup };
}

/** Lueur douce (halo + cœur), pour lanternes, cristaux, étoiles. */
export const glow = (x: number, y: number, r: number, col: string) =>
  `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r * 2)}" fill="${col}" opacity=".18"/><circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r * 1.3)}" fill="${col}" opacity=".3"/><circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r)}" fill="${light(col, 0.4)}" stroke="${INK}" stroke-width="2.5"/>`;
