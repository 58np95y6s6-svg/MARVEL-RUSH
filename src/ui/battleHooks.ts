// Crochets optionnels de l'écran de combat pour le tutoriel guidé et les astuces (src/tutorial/).
// Module léger (types seulement côté moteur) : l'importer n'embarque pas PixiJS.
import type { Engine, EngineEvent } from '../engine/types';

/** Rectangle en px CSS (coordonnées client). */
export interface ClientRect { x: number; y: number; w: number; h: number }
export interface BattleTutoApi {
  readonly engine: Engine;
  /** Élément racine du combat (pour y poser des calques). */
  readonly root: HTMLElement;
  /** Titre de la partie (campagne) ou undefined. */
  readonly title?: string;
  /** Rectangle écran d'une case de la grille. */
  cellRect(slot: number): ClientRect | null;
  /** Abonnement aux événements du moteur, après leur traitement par l'écran. */
  onEvents(fn: (evs: EngineEvent[]) => void): () => void;
  /** Ralenti (1 = normal, 0.25 = quart de vitesse). */
  setRate(rate: number): void;
  /** Fige la simulation (sans fenêtre de pause) ; le rendu continue. */
  hold(on: boolean): void;
  /** Illumine les unités fusionnables avec celle de `slot` (comme l'appui long). */
  showMerges(slot: number): void;
  hideMerges(): void;
  isOver(): boolean;
  isDestroyed(): boolean;
  toast(msg: string): void;
}
const battleObservers = new Set<(api: BattleTutoApi) => void>();
/** Observe chaque combat monté (astuces contextuelles). Renvoie le désabonnement. */
export function observeBattles(fn: (api: BattleTutoApi) => void): () => void {
  battleObservers.add(fn);
  return () => { battleObservers.delete(fn); };
}

export function notifyBattleReady(api: BattleTutoApi): void {
  for (const fn of battleObservers) { try { fn(api); } catch (err) { console.error(err); } }
}
