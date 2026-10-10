// Géométrie du plateau, commune à toutes les maps (écran logique 1000 × 1600, portrait).
// Calée sur l'écran de combat de Rush Royale : HUD en haut, chemin en U autour de la grille 3 × 5,
// zone du bas libre pour le mana, le bouton Invoquer et les 5 améliorations du deck.
//
// Solo : le chemin part en bas à gauche (portail), monte le long de la grille, la longe par le haut et
// redescend à droite jusqu'à la porte du château. Coop : deux plateaux empilés (partenaire en haut, moi
// en bas) ; deux portails à gauche, une branche longe chaque plateau par l'extérieur puis remonte (ou
// descend) à droite ; les deux branches se rejoignent à droite dans le tronc commun, qui passe entre les
// plateaux sur toute leur largeur jusqu'au château (à gauche). Le chemin Solo fait PATH_CELLS cases ; en Coop,
// branche + tronc est plus long (≈ 17 cases) : les boss de chaque joueur entrent par sa branche et ont le temps
// de traverser. Le moteur lit les longueurs, le rendu convertit avec `lanePoint`.
// Pur calcul : aucun accès au DOM.

import { GRID_COLS, GRID_ROWS } from '../engine/types';
import type { Point } from './types';

export const SCREEN = { w: 1000, h: 1600 } as const;
/** Longueur de tous les chemins, en cases (identique pour toutes les maps et tous les modes). */
export const PATH_CELLS = 14;

export type LayoutMode = 'solo' | 'coop';
/** Variantes de tracé : U simple, arche (pont), marches (toits), dents de scie, vague. */
export type PathShape = 'u' | 'arch' | 'steps' | 'zigzag' | 'wave';
export const PATH_SHAPES: PathShape[] = ['u', 'arch', 'steps', 'zigzag', 'wave'];

export interface Rect { x: number; y: number; w: number; h: number }

export interface BoardLayout {
  /** Pas d'une case, en pixels logiques. */
  cell: number;
  /** Rectangle de la grille entière. */
  grid: Rect;
  /** 15 cases, index = row * GRID_COLS + col (rangée 0 en haut). Rectangle de case avec une marge intérieure. */
  cells: Rect[];
  /** Largeur de la bande du chemin, en pixels. */
  pathWidth: number;
}

export interface Lane {
  points: Point[];
  /** Longueur en pixels du tracé. */
  pixels: number;
  /** Longueur en cases (= PATH_CELLS). */
  cells: number;
  /** Pas d'une case de ce chemin (pixels par case). */
  cell: number;
  width: number;
}

export interface Controls {
  /** Rangée des 5 boutons d'amélioration du deck, sous la grille. */
  upgrades: Rect[];
  /** Gros bouton Invoquer, en bas au centre. */
  summon: Rect;
  /** Compteur de mana, à gauche du bouton. */
  mana: Rect;
  /** Emplacement libre à droite du bouton (vies, offrir en coop…). */
  extra: Rect;
}

export interface SoloLayout {
  mode: 'solo';
  hud: Rect;
  board: BoardLayout;
  lane: Lane;
  controls: Controls;
}
export interface CoopLayout {
  mode: 'coop';
  hud: Rect;
  /** Plateau de la partenaire, en haut. */
  partner: BoardLayout;
  /** Mon plateau, en bas. */
  self: BoardLayout;
  /** Branche 'a' : portail en bas à gauche, longe mon plateau par le bas puis remonte à droite. */
  branchA: Lane;
  /** Branche 'b' : portail en haut à gauche, longe le plateau de la partenaire par le haut puis descend à droite. */
  branchB: Lane;
  /** Tronc commun : de la jonction (à droite) jusqu'au château (au centre), entre les deux plateaux. Les boss y arrivent. */
  trunk: Lane;
  /** Point de jonction des deux branches (= début du tronc). */
  merge: Point;
  /**
   * Début de la dernière ligne droite de chaque branche avant la jonction, en cases depuis le portail : à partir
   * de là, les ennemis de la branche de la partenaire deviennent touchables par mes unités (et inversement).
   */
  crossA: number;
  crossB: number;
  /** Bandeau d'information entre les plateaux (« 1 vague avant le boss… »). */
  banner: Rect;
  controls: Controls;
}
export type AnyLayout = SoloLayout | CoopLayout;

// ---------------------------------------------------------------- outils géométriques

export function polylineLength(pts: Point[]): number {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i]!.x - pts[i - 1]!.x, pts[i]!.y - pts[i - 1]!.y);
  return L;
}

/** Point du tracé à la fraction t ∈ [0, 1] de sa longueur, avec l'angle de la tangente (radians). */
export function pointAt(pts: Point[], t: number): { x: number; y: number; angle: number } {
  const total = polylineLength(pts);
  let d = Math.max(0, Math.min(1, t)) * total;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!, b = pts[i]!;
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    if (d <= seg || i === pts.length - 1) {
      const k = seg === 0 ? 0 : Math.min(1, d / seg);
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, angle: Math.atan2(b.y - a.y, b.x - a.x) };
    }
    d -= seg;
  }
  const p = pts[pts.length - 1] ?? { x: 0, y: 0 };
  return { x: p.x, y: p.y, angle: 0 };
}

/** Position d'un ennemi à `distance` cases sur un chemin de `lane.cells` cases. */
export function lanePoint(lane: Lane, distance: number): { x: number; y: number; angle: number } {
  return pointAt(lane.points, distance / lane.cells);
}

/** Arrondit les angles vifs d'une ligne brisée (arc échantillonné), rayon limité par les segments voisins. */
export function roundCorners(pts: Point[], radius: number, steps = 8): Point[] {
  if (pts.length < 3) return pts.slice();
  const out: Point[] = [pts[0]!];
  for (let i = 1; i < pts.length - 1; i++) {
    const p0 = pts[i - 1]!, p1 = pts[i]!, p2 = pts[i + 1]!;
    const l1 = Math.hypot(p1.x - p0.x, p1.y - p0.y), l2 = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const r = Math.min(radius, l1 / 2, l2 / 2);
    const cross = (p1.x - p0.x) * (p2.y - p1.y) - (p1.y - p0.y) * (p2.x - p1.x);
    if (r < 2 || Math.abs(cross) < 1e-6 * l1 * l2) { out.push(p1); continue; }
    const a = { x: p1.x + ((p0.x - p1.x) / l1) * r, y: p1.y + ((p0.y - p1.y) / l1) * r };
    const b = { x: p1.x + ((p2.x - p1.x) / l2) * r, y: p1.y + ((p2.y - p1.y) / l2) * r };
    for (let s = 0; s <= steps; s++) {
      const t = s / steps, u = 1 - t;
      out.push({ x: u * u * a.x + 2 * u * t * p1.x + t * t * b.x, y: u * u * a.y + 2 * u * t * p1.y + t * t * b.y });
    }
  }
  out.push(pts[pts.length - 1]!);
  return out.map((p) => ({ x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 }));
}

function board(x: number, y: number, cell: number): BoardLayout {
  const pad = Math.round(cell * 0.05);
  const cells: Rect[] = [];
  for (let r = 0; r < GRID_ROWS; r++)
    for (let c = 0; c < GRID_COLS; c++)
      cells.push({ x: x + c * cell + pad, y: y + r * cell + pad, w: cell - 2 * pad, h: cell - 2 * pad });
  return { cell, grid: { x, y, w: GRID_COLS * cell, h: GRID_ROWS * cell }, cells, pathWidth: Math.round(cell * 0.7) };
}

/** Tracé du haut entre (L, T) et (R, T) selon la forme ; les écarts vont vers le haut (côté HUD). */
function topRun(shape: PathShape, L: number, R: number, T: number, cell: number, bump: number): Point[] {
  const c = cell * bump;
  const W = R - L;
  const pts: Point[] = [];
  switch (shape) {
    case 'u':
      return [{ x: L, y: T }, { x: R, y: T }];
    case 'arch': {
      const h = 0.5 * c, n = 24;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        // arche plate : montée douce aux deux tiers centraux
        const s = Math.sin(Math.PI * t);
        pts.push({ x: L + W * t, y: T - h * Math.pow(s, 0.8) });
      }
      return pts;
    }
    case 'steps': {
      // toits à hauteurs différentes reliés par des passerelles
      const h = 0.38 * c;
      const xs = [0, 0.27, 0.5, 0.73, 1].map((k) => L + W * k);
      return [
        { x: xs[0]!, y: T }, { x: xs[1]!, y: T }, { x: xs[1]!, y: T - h }, { x: xs[2]!, y: T - h },
        { x: xs[2]!, y: T - h }, { x: xs[3]!, y: T - h }, { x: xs[3]!, y: T }, { x: xs[4]!, y: T },
      ].filter((p, i, a) => i === 0 || p.x !== a[i - 1]!.x || p.y !== a[i - 1]!.y);
    }
    case 'zigzag': {
      const h = 0.3 * c, teeth = 4;
      pts.push({ x: L, y: T });
      for (let i = 0; i < teeth; i++) {
        const x0 = L + W * (0.12 + (0.76 * i) / teeth);
        const x1 = L + W * (0.12 + (0.76 * (i + 0.5)) / teeth);
        const x2 = L + W * (0.12 + (0.76 * (i + 1)) / teeth);
        pts.push({ x: x0, y: T }, { x: x1, y: T - h }, { x: x2, y: T });
      }
      pts.push({ x: R, y: T });
      return pts.filter((p, i, a) => i === 0 || p.x !== a[i - 1]!.x || p.y !== a[i - 1]!.y);
    }
    case 'wave': {
      const h = 0.22 * c, n = 40;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        pts.push({ x: L + W * t, y: T - h * (1 - Math.cos(4 * Math.PI * t)) / 2 });
      }
      return pts;
    }
  }
}

/** Chemin en U inversé autour d'une grille, normalisé à PATH_CELLS cases en ajustant les jambes. */
function uLane(b: BoardLayout, shape: PathShape, bump = 1): Lane {
  const c = b.cell;
  const gap = Math.round(c * 0.25);
  const half = b.pathWidth / 2;
  const L = b.grid.x - gap - half, R = b.grid.x + b.grid.w + gap + half;
  const T = b.grid.y - gap - half;
  const target = PATH_CELLS * c;
  let E = b.grid.y + b.grid.h + c * 0.5;
  let pts: Point[] = [];
  for (let it = 0; it < 6; it++) {
    const raw = [{ x: L, y: E }, ...topRun(shape, L, R, T, c, bump), { x: R, y: E }];
    pts = roundCorners(raw, c * 0.38);
    const diff = target - polylineLength(pts);
    if (Math.abs(diff) < 0.05) break;
    E += diff / 2;
  }
  return { points: pts, pixels: polylineLength(pts), cells: PATH_CELLS, cell: c, width: b.pathWidth };
}

function mkLane(points: Point[], cell: number, width: number): Lane {
  const pixels = polylineLength(points);
  return { points, pixels, cells: Math.round((pixels / cell) * 100) / 100, cell, width };
}

/** Début de la dernière ligne droite d'un tracé (en pixels depuis son départ) : on remonte depuis la fin tant que
 * les segments gardent la direction du dernier. */
export function lastStraightStart(pts: Point[]): number {
  const n = pts.length;
  if (n < 2) return 0;
  const a = pts[n - 2]!, b = pts[n - 1]!;
  const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
  let i = n - 2;
  while (i > 0) {
    const p = pts[i - 1]!, q = pts[i]!;
    const ex = q.x - p.x, ey = q.y - p.y, m = Math.hypot(ex, ey);
    if (m < 1e-6) { i--; continue; }
    const cross = Math.abs(ex * dy - ey * dx) / (m * l), dotp = (ex * dx + ey * dy) / (m * l);
    if (cross > 0.02 || dotp < 0) break;
    i--;
  }
  return polylineLength(pts.slice(0, i + 1));
}

/** Longueur minimale du tronc commun en Coop, en cases (il longe les plateaux sur toute leur largeur). */
export const COOP_TRUNK_MIN_CELLS = 5.5;

/**
 * Coop : branches symétriques (miroir horizontal) + tronc. Chaque branche longe le plateau de son joueur par
 * l'extérieur puis rejoint la jonction (à droite, entre les plateaux) par une dernière ligne droite ; le tronc
 * commun repart vers la gauche entre les deux plateaux, sur toute leur largeur, jusqu'au château (au bord gauche des plateaux).
 * Les boss de chaque joueur entrent par sa branche et font tout le chemin, comme les monstres.
 */
function coopLanes(top: BoardLayout, bottom: BoardLayout, shape: PathShape): { a: Lane; b: Lane; trunk: Lane; merge: Point; crossA: number; crossB: number } {
  const c = top.cell;
  const gap = Math.round(c * 0.25);
  const half = top.pathWidth / 2;
  const L = top.grid.x - gap - half, R = top.grid.x + top.grid.w + gap + half;
  const T = top.grid.y - gap - half;
  const B = bottom.grid.y + bottom.grid.h + gap + half;
  const M = (top.grid.y + top.grid.h + bottom.grid.y) / 2;
  const start = c * 0.75;
  const run = topRun(shape, L, R, T, c, 0.5);
  const rawB = [{ x: L, y: T + start }, ...run, { x: R, y: M }];
  const rawA = [{ x: L, y: B - start }, ...topRun(shape, L, R, B, c, 0.4).map((p) => ({ x: p.x, y: 2 * B - p.y })), { x: R, y: M }];
  const clean = (p: Point[]) => p.filter((q, i, arr) => i === 0 || Math.hypot(q.x - arr[i - 1]!.x, q.y - arr[i - 1]!.y) > 0.5);
  const b = mkLane(roundCorners(clean(rawB), c * 0.38), c, top.pathWidth);
  const a = mkLane(roundCorners(clean(rawA), c * 0.38), c, top.pathWidth);
  const merge = { x: R, y: M };
  // Tronc : de la jonction (à droite) au château (à gauche), entre les deux plateaux.
  const end = Math.min(top.grid.x, R - COOP_TRUNK_MIN_CELLS * c);
  const trunk = mkLane([merge, { x: Math.round(end * 10) / 10, y: M }], c, Math.round(top.pathWidth * 1.15));
  const cells = (px: number) => Math.round((px / c) * 100) / 100;
  return { a, b, trunk, merge, crossA: cells(lastStraightStart(a.points)), crossB: cells(lastStraightStart(b.points)) };
}

function controls(top: number, bottom: number, upH = 130): Controls {
  // Rangée de 5 améliorations juste sous la zone de jeu, puis le bouton Invoquer centré.
  const gapX = 14, w = (SCREEN.w - 2 * 60 - 4 * gapX) / 5;
  const upgrades: Rect[] = [];
  for (let i = 0; i < 5; i++) upgrades.push({ x: 60 + i * (w + gapX), y: top, w, h: upH });
  const sy = top + upH + 24, sh = Math.min(170, bottom - sy);
  return {
    upgrades,
    summon: { x: 330, y: sy, w: 340, h: sh },
    mana: { x: 60, y: sy + 20, w: 240, h: sh - 40 },
    extra: { x: 700, y: sy + 20, w: 240, h: sh - 40 },
  };
}

// ---------------------------------------------------------------- dispositions par mode

/** Solo (et tutoriel) : un plateau, un chemin en U. */
export function soloLayout(shape: PathShape = 'u'): SoloLayout {
  const cell = 140;
  const b = board((SCREEN.w - 5 * cell) / 2, 440, cell);
  return { mode: 'solo', hud: { x: 0, y: 0, w: 1000, h: 200 }, board: b, lane: uLane(b, shape), controls: controls(1190, 1560) };
}

/** Coop : plateau de la partenaire en haut, le mien en bas ; deux branches qui se rejoignent dans le tronc. */
export function coopLayout(shape: PathShape = 'u'): CoopLayout {
  const cell = 120;
  const x = (SCREEN.w - 5 * cell) / 2;
  const partner = board(x, 250, cell);
  const self = board(x, 250 + 3 * cell + 180, cell);
  const { a, b, trunk, merge, crossA, crossB } = coopLanes(partner, self, shape);
  return {
    mode: 'coop', hud: { x: 0, y: 0, w: 1000, h: 136 }, partner, self,
    branchA: a, branchB: b, trunk, merge, crossA, crossB,
    banner: { x: 150, y: merge.y - 32, w: 700, h: 64 },
    controls: controls(1290, 1590, 104),
  };
}

export function layoutFor(mode: LayoutMode, shape: PathShape = 'u'): AnyLayout {
  return mode === 'solo' ? soloLayout(shape) : coopLayout(shape);
}

/** Tous les plateaux et chemins d'une disposition (utile au rendu des décors). */
export function boardsOf(l: AnyLayout): { boards: BoardLayout[]; lanes: Lane[] } {
  if (l.mode === 'solo') return { boards: [l.board], lanes: [l.lane] };
  return { boards: [l.partner, l.self], lanes: [l.branchB, l.branchA, l.trunk] };
}

/** Distance minimale d'un point à une ligne brisée. */
export function distToPolyline(p: Point, pts: Point[]): number {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!, b = pts[i]!;
    const dx = b.x - a.x, dy = b.y - a.y;
    const l2 = dx * dx + dy * dy;
    const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
    best = Math.min(best, Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy)));
  }
  return best;
}

/** Vrai si le rectangle touche la bande du chemin ou une grille (sert à vérifier les animations d'ambiance). */
export function rectHitsPlay(r: Rect, l: AnyLayout): boolean {
  const { boards, lanes } = boardsOf(l);
  for (const b of boards) {
    const g = b.grid;
    if (r.x < g.x + g.w && r.x + r.w > g.x && r.y < g.y + g.h && r.y + r.h > g.y) return true;
  }
  for (const lane of lanes) {
    const m = lane.width / 2;
    // échantillonne le rectangle
    for (let i = 0; i <= 6; i++)
      for (let j = 0; j <= 6; j++) {
        const p = { x: r.x + (r.w * i) / 6, y: r.y + (r.h * j) / 6 };
        if (distToPolyline(p, lane.points) < m) return true;
      }
    // et le chemin contre le rectangle
    for (const p of lane.points) if (p.x > r.x - m && p.x < r.x + r.w + m && p.y > r.y - m && p.y < r.y + r.h + m) {
      const cx = Math.max(r.x, Math.min(p.x, r.x + r.w)), cy = Math.max(r.y, Math.min(p.y, r.y + r.h));
      if (Math.hypot(p.x - cx, p.y - cy) < m) return true;
    }
  }
  return false;
}
