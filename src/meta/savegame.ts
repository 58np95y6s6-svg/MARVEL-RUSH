// Sauvegarde et reprise des parties Solo longues (campagne et Solo Infini, §5.1) : à chaque début de
// vague ordinaire, l'état du moteur (`engine.serialize()`) et sa configuration vont dans
// `profile.savedGame` (contrat src/meta/profile.ts) ; l'accueil et l'écran Campagne proposent
// « Reprendre la partie », qui recrée le combat avec `createEngine(config, sauvegarde)`.
// Effacée en fin de partie (victoire ou défaite).

import type { GameConfig } from '../engine/types';
import { getProfile, updateProfile, type Profile } from './profile';

export type SavedKind = 'campagne' | 'infini';

/** Contenu de `profile.savedGame.state`. */
export interface SavedGameState {
  /** Configuration exacte de la partie (graine, deck, niveaux, script). */
  config: GameConfig;
  /** État du moteur sérialisé. */
  engine: string;
  /** Vague en cours au moment de la sauvegarde. */
  wave: number;
}

export interface SavedGame {
  kind: SavedKind;
  levelId?: string;
  state: SavedGameState;
  savedAt: number;
}

/** Construit l'entrée `savedGame` du profil (pur). */
export function makeSavedGame(kind: SavedKind, levelId: string | undefined, config: GameConfig, engine: string, wave: number, now = Date.now()): SavedGame {
  return { kind, ...(levelId ? { levelId } : {}), state: { config: JSON.parse(JSON.stringify(config)) as GameConfig, engine, wave }, savedAt: now };
}

/** Lit la sauvegarde d'un profil ; null si absente ou illisible (ancienne forme, champs manquants). */
export function readSavedGame(p: Pick<Profile, 'savedGame'> | null | undefined): SavedGame | null {
  const sg = p?.savedGame;
  if (!sg || (sg.kind !== 'campagne' && sg.kind !== 'infini')) return null;
  const st = sg.state as Partial<SavedGameState> | null | undefined;
  if (!st || typeof st.engine !== 'string' || !st.config || typeof st.wave !== 'number') return null;
  if (sg.kind === 'campagne' && !sg.levelId) return null;
  return { kind: sg.kind, levelId: sg.levelId, state: st as SavedGameState, savedAt: sg.savedAt };
}

/** « Niveau 2-4 · vague 12 / 17 » ou « Solo Infini · vague 23 ». */
export function savedGameLabel(sg: SavedGame): string {
  if (sg.kind === 'infini') return `Solo Infini · vague ${sg.state.wave}`;
  const m = /^c(\d+)-n(\d+)$/.exec(sg.levelId ?? '');
  const lvl = m ? `Niveau ${m[1]}-${m[2]}` : 'Campagne';
  const target = sg.state.config.targetWaves;
  return `${lvl} · vague ${sg.state.wave}${target ? ` / ${target}` : ''}`;
}

/** Sauvegarde (une seule partie à la fois : la nouvelle remplace l'ancienne). Sans profil : rien. */
export async function saveGame(kind: SavedKind, levelId: string | undefined, config: GameConfig, engine: string, wave: number): Promise<void> {
  if (!getProfile()) return;
  const sg = makeSavedGame(kind, levelId, config, engine, wave);
  await updateProfile((p) => { p.savedGame = sg; });
}

/** Efface la sauvegarde (fin de partie, ou partie abandonnée depuis l'accueil). */
export async function clearSavedGame(): Promise<void> {
  if (!getProfile()?.savedGame) return;
  await updateProfile((p) => { delete p.savedGame; });
}

export function currentSavedGame(): SavedGame | null {
  return readSavedGame(getProfile());
}
