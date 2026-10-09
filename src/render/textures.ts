// Textures du combat : jetons (3 poses, sans pastilles), ennemis, sbires, boss, couches de map.
// Tout passe par l'API de src/art (chaînes SVG → loadTexture), avec un cache local par clé
// pour pouvoir lire une texture de façon synchrone dans la boucle de rendu.
import { Texture } from 'pixi.js';
import { bossSvg, enemySvg, loadTexture, minionSvg, tokenSvg, unitSvg, type EnemyLook } from '../art';
import type { BossId, EnemyKind, Rarity, UnitId } from '../data/types';
import { UNITS } from '../data/units';

export type Pose = 0 | 1 | 2;

/** Taille d'affichage (px logiques) des éléments, sur l'écran logique 1000 × 1600. */
export const SIZES = {
  token: 142,
  enemy: 118,
  enemyGros: 150,
  enemyRapide: 104,
  minion: 120,
  giant: 236,
  boss: 300,
} as const;

const ready = new Map<string, Texture>();
const pending = new Map<string, Promise<Texture>>();

let worldScale = 0.4;
let resolution = 2;
/** Échelle écran (px CSS par px logique) et densité, pour rastériser les SVG à la bonne taille. */
export function setRasterScale(scale: number, dpr: number): void {
  worldScale = scale;
  resolution = Math.min(3, Math.max(1, dpr));
}

function get(key: string, make: () => string, logicalW: number, res = resolution): Texture | null {
  const t = ready.get(key);
  if (t) return t;
  if (!pending.has(key)) {
    const p = loadTexture(make(), Math.max(8, Math.round(logicalW * worldScale)), res);
    pending.set(key, p);
    p.then((tex) => { ready.set(key, tex); }).catch(() => { pending.delete(key); });
  }
  return null;
}

async function load(key: string, make: () => string, logicalW: number, res = resolution): Promise<Texture | null> {
  get(key, make, logicalW, res);
  try { return await pending.get(key)!; } catch { return null; }
}

/**
 * Jeton d'une pose : on reprend `tokenSvg` (disque, liseré de rareté, reflet) et on remplace la figure
 * de repos par celle de la pose demandée. Les pastilles de rang sont retirées : le rendu les dessine
 * lui-même, ce qui évite une texture par rang.
 */
export function tokenPoseSvg(id: UnitId, pose: Pose): string {
  const rarity: Rarity = UNITS[id]?.rarity ?? 'rare';
  let svg = tokenSvg(id, 1, 'classique', { rarity });
  // Retire les pastilles de rang (pilule à y = 166 puis points).
  const pip = svg.search(/<rect x="[-\d.]+" y="166"/);
  if (pip > 0) svg = svg.slice(0, pip) + '</svg>';
  if (pose === 0) return svg;
  const open = 'scale(.78) translate(-100 -118)">';
  const a = svg.indexOf(open);
  const close = svg.indexOf('</g></g><circle cx="100" cy="96" r="80" fill="none"', a);
  if (a < 0 || close < 0) return svg;
  const body = unitSvg(id, pose).replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  return svg.slice(0, a + open.length) + body + svg.slice(close);
}

export function tokenTex(id: UnitId, pose: Pose): Texture | null {
  return get(`tok-${id}-${pose}`, () => tokenPoseSvg(id, pose), SIZES.token);
}
export function loadToken(id: UnitId, pose: Pose): Promise<Texture | null> {
  return load(`tok-${id}-${pose}`, () => tokenPoseSvg(id, pose), SIZES.token);
}

const LOOK: Record<Exclude<EnemyKind, 'sbire'>, EnemyLook> = {
  normal: 'normal', rapide: 'rapide', gros: 'gros', blinde: 'blinde', bouclier: 'bouclier',
};
export function enemyWidth(kind: EnemyKind): number {
  return kind === 'gros' ? SIZES.enemyGros : kind === 'rapide' ? SIZES.enemyRapide : kind === 'sbire' ? SIZES.minion : SIZES.enemy;
}
export function enemyTex(kind: Exclude<EnemyKind, 'sbire'>, variant: number): Texture | null {
  return get(`en-${kind}-${variant}`, () => enemySvg(LOOK[kind], variant), enemyWidth(kind));
}
export function minionTex(boss: BossId, pose: Pose, giant = false): Texture | null {
  const w = giant ? SIZES.giant : SIZES.minion;
  return get(`mi-${boss}-${pose}-${giant ? 'g' : 'n'}`, () => minionSvg(boss, pose), w);
}
export function bossTex(boss: BossId, pose: Pose): Texture | null {
  return get(`bo-${boss}-${pose}`, () => bossSvg(boss, pose), SIZES.boss);
}

/** Couche de map plein écran (1000 × 1600). Résolution plafonnée à 2 pour la mémoire. */
export function loadLayer(key: string, svg: () => string, logicalW = 1000): Promise<Texture | null> {
  return load(`map-${key}`, svg, logicalW, Math.min(2, resolution));
}

/** Précharge ce qu'il faut pour démarrer un combat sans à-coups. */
export async function preloadBattle(deck: UnitId[]): Promise<void> {
  const jobs: Promise<unknown>[] = [];
  for (const id of deck) for (const p of [0, 1, 2] as Pose[]) jobs.push(loadToken(id, p));
  for (const k of ['normal', 'rapide', 'gros', 'blinde', 'bouclier'] as const)
    for (const v of [0, 1, 2]) jobs.push(load(`en-${k}-${v}`, () => enemySvg(LOOK[k], v), enemyWidth(k)));
  await Promise.all(jobs);
}

/** Précharge les textures d'un boss (ou de son lieutenant) dès qu'il est annoncé. */
export function preloadBoss(boss: BossId): void {
  for (const p of [0, 1, 2] as Pose[]) {
    bossTex(boss, p);
    minionTex(boss, p);
    minionTex(boss, p, true);
  }
}

/** Vide le cache local (les textures restent dans le cache de src/art). */
export function forgetTextures(): void {
  ready.clear();
  pending.clear();
}
