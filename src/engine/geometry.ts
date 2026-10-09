// Géométrie des portées d'attaque (§4.1, « Portées d'attaque ») : position des ennemis en
// coordonnées de grille, pour chaque joueur.
//
// Repère : une unité de la case (col, row) est au point (col, row) ; une case = 1. Un point logique
// (x, y) de l'écran 1000 × 1600 devient col = (x − grid.x) / cell − 0.5, row = (y − grid.y) / cell − 0.5,
// avec la grille du joueur (src/maps/layout.ts, pur calcul). Un ennemi à `distance` cases sur une branche
// de longueur L est au point de fraction distance / L de la ligne brisée, comme `lanePoint` du rendu.
//
// Solo et tutoriel : le plateau unique. Coop : p1 a le plateau du bas (branche 'a'), p2 celui du haut
// (branche 'b'), retourné verticalement pour que chaque joueur voie son plateau comme p1 (rangée 0 côté
// tronc commun). Tout dérive de la configuration (mode + forme du chemin de la map) : rien à sérialiser.

import type { UnitDef, UnitId } from '../data/types';
import { UNITS } from '../data/units';
import { type BoardLayout, type PathShape, PATH_SHAPES, layoutFor } from '../maps/layout';
import type { GameMode, LaneId } from './types';
import { GRID_COLS } from './types';

export interface GridPoint { col: number; row: number }

/** Ligne brisée en coordonnées de grille, avec longueurs cumulées (en pixels logiques d'origine). */
export interface GridPolyline { pts: GridPoint[]; cum: number[]; total: number }

export interface PlayerGeometry {
  lanes: Partial<Record<LaneId, GridPolyline>>;
}

export interface BoardGeometry {
  mode: 'solo' | 'coop';
  shape: PathShape;
  /** Index = index du joueur dans la configuration. */
  players: PlayerGeometry[];
}

/** Repères de portée, en cases. */
export const RANGE_SHORT = 1.6;
export const RANGE_MEDIUM = 2.4;
export const RANGE_LONG = 3.4;

export type RangeClass = 'courte' | 'moyenne' | 'longue' | 'globale';

/** Portée d'une unité, en cases (Infinity = toute la map). */
export function unitRange(def: Pick<UnitDef, 'range'> | UnitId): number {
  const d = typeof def === 'string' ? UNITS[def] : def;
  const r = d?.range;
  return r === undefined || r === 'globale' ? Infinity : r;
}

export function rangeClass(def: Pick<UnitDef, 'range'> | UnitId): RangeClass {
  const r = unitRange(def);
  if (!Number.isFinite(r)) return 'globale';
  if (r <= (RANGE_SHORT + RANGE_MEDIUM) / 2) return 'courte';
  if (r <= (RANGE_MEDIUM + RANGE_LONG) / 2) return 'moyenne';
  return 'longue';
}

/** Libellé affiché dans la fiche (« Portée : courte »). */
export function rangeLabel(def: Pick<UnitDef, 'range'> | UnitId): string {
  const c = rangeClass(def);
  return c === 'globale' ? 'toute la map' : c;
}

function toGrid(board: BoardLayout, flip: boolean, pts: readonly { x: number; y: number }[]): GridPolyline {
  const out: GridPoint[] = pts.map((p) => {
    const col = (p.x - board.grid.x) / board.cell - 0.5;
    const row = (p.y - board.grid.y) / board.cell - 0.5;
    return { col, row: flip ? 2 - row : row };
  });
  const cum: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1]! + Math.hypot(pts[i]!.x - pts[i - 1]!.x, pts[i]!.y - pts[i - 1]!.y));
  }
  return { pts: out, cum, total: cum[cum.length - 1] ?? 0 };
}

const cache = new Map<string, BoardGeometry>();

/** Géométrie d'un mode et d'une forme de chemin (mémorisée : pur calcul). */
export function boardGeometry(mode: GameMode, shape: string | undefined): BoardGeometry {
  const s: PathShape = (PATH_SHAPES as string[]).includes(shape ?? '') ? (shape as PathShape) : 'u';
  const m = mode === 'coop' ? 'coop' : 'solo';
  const key = `${m}:${s}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const L = layoutFor(m, s);
  let geo: BoardGeometry;
  if (L.mode === 'solo') {
    geo = { mode: 'solo', shape: s, players: [{ lanes: { a: toGrid(L.board, false, L.lane.points) } }] };
  } else {
    const lanes = (b: BoardLayout, flip: boolean): PlayerGeometry => ({
      lanes: {
        a: toGrid(b, flip, L.branchA.points),
        b: toGrid(b, flip, L.branchB.points),
        tronc: toGrid(b, flip, L.trunk.points),
      },
    });
    geo = { mode: 'coop', shape: s, players: [lanes(L.self, false), lanes(L.partner, true)] };
  }
  cache.set(key, geo);
  return geo;
}

/** Point de la ligne brisée à la fraction t ∈ [0, 1] de sa longueur. */
export function polylineAt(pl: GridPolyline, t: number): GridPoint {
  const n = pl.pts.length;
  if (n === 0) return { col: 0, row: 0 };
  const d = Math.max(0, Math.min(1, t)) * pl.total;
  // Recherche dichotomique du segment.
  let lo = 1, hi = n - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (pl.cum[mid]! < d) lo = mid + 1; else hi = mid;
  }
  const i = Math.max(1, lo);
  const a = pl.pts[i - 1]!, b = pl.pts[i]!;
  const seg = pl.cum[i]! - pl.cum[i - 1]!;
  const k = seg <= 0 ? 0 : Math.min(1, Math.max(0, (d - pl.cum[i - 1]!) / seg));
  return { col: a.col + (b.col - a.col) * k, row: a.row + (b.row - a.row) * k };
}

/** Position d'un ennemi (branche, distance) en coordonnées de la grille du joueur. */
export function enemyGridPos(
  geo: BoardGeometry, player: number, lane: LaneId, distance: number, laneLength: number,
): GridPoint | null {
  const pl = (geo.players[player] ?? geo.players[0])!.lanes[lane];
  if (!pl) return null;
  return polylineAt(pl, laneLength > 0 ? distance / laneLength : 0);
}

/** Centre de la case `slot` en coordonnées de grille. */
export function slotCenter(slot: number): GridPoint {
  return { col: slot % GRID_COLS, row: Math.floor(slot / GRID_COLS) };
}

/** Vrai si le point est dans la portée d'une unité posée sur `slot`. */
export function inReach(slot: number, range: number, p: GridPoint | null): boolean {
  if (!Number.isFinite(range)) return true;
  if (!p) return false;
  const c = slotCenter(slot);
  return Math.hypot(p.col - c.col, p.row - c.row) <= range + 1e-9;
}

/**
 * Parties couvertes d'une branche, en fractions [début, fin] de sa longueur (échantillonnage fin) :
 * sert au rendu (chemin surligné) et aux tests.
 */
export function coveredSpans(geo: BoardGeometry, player: number, lane: LaneId, slot: number, range: number, samples = 240): [number, number][] {
  const pl = (geo.players[player] ?? geo.players[0])!.lanes[lane];
  if (!pl) return [];
  if (!Number.isFinite(range)) return [[0, 1]];
  const out: [number, number][] = [];
  let start = -1;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const ok = inReach(slot, range, polylineAt(pl, t));
    if (ok && start < 0) start = t;
    if (!ok && start >= 0) { out.push([start, (i - 1) / samples]); start = -1; }
  }
  if (start >= 0) out.push([start, 1]);
  return out;
}

