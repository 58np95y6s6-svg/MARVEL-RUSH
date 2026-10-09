// Échantillonnage précalculé d'un chemin : position (x, y) à une distance en cases, sans allocation.
import type { Lane } from '../maps/layout';

export class LaneSampler {
  readonly cells: number;
  private readonly step: number;
  private readonly xs: Float32Array;
  private readonly ys: Float32Array;
  private readonly n: number;
  /** Résultat du dernier `at` (réutilisé pour éviter les allocations). */
  x = 0;
  y = 0;

  constructor(lane: Lane, perCell = 24) {
    this.cells = lane.cells;
    const pts = lane.points;
    const segLen: number[] = [];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      const l = Math.hypot(pts[i]!.x - pts[i - 1]!.x, pts[i]!.y - pts[i - 1]!.y);
      segLen.push(l);
      total += l;
    }
    this.n = Math.max(2, Math.ceil(lane.cells * perCell) + 1);
    this.step = lane.cells / (this.n - 1);
    this.xs = new Float32Array(this.n);
    this.ys = new Float32Array(this.n);
    let seg = 0, acc = 0;
    for (let k = 0; k < this.n; k++) {
      const d = (k / (this.n - 1)) * total;
      while (seg < segLen.length - 1 && acc + segLen[seg]! < d) { acc += segLen[seg]!; seg++; }
      const a = pts[seg] ?? pts[0]!, b = pts[seg + 1] ?? a;
      const L = segLen[seg] ?? 0;
      const t = L > 0 ? Math.min(1, Math.max(0, (d - acc) / L)) : 0;
      this.xs[k] = a.x + (b.x - a.x) * t;
      this.ys[k] = a.y + (b.y - a.y) * t;
    }
  }

  /** Place (x, y) à `distance` cases du départ (bornée au chemin). */
  at(distance: number): this {
    const f = Math.min(this.n - 1, Math.max(0, distance / this.step));
    const i = Math.min(this.n - 2, Math.floor(f));
    const t = f - i;
    this.x = this.xs[i]! + (this.xs[i + 1]! - this.xs[i]!) * t;
    this.y = this.ys[i]! + (this.ys[i + 1]! - this.ys[i]!) * t;
    return this;
  }

  /** Direction horizontale du chemin à cette distance (−1 vers la gauche, 1 vers la droite, 0 vertical). */
  dirX(distance: number): number {
    const f = Math.min(this.n - 1, Math.max(0, distance / this.step));
    const i = Math.min(this.n - 2, Math.floor(f));
    const dx = this.xs[i + 1]! - this.xs[i]!;
    return Math.abs(dx) < 0.5 ? 0 : Math.sign(dx);
  }
}
