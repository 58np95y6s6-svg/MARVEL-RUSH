// Petit bus d'événements du méta-jeu, pour le tutoriel guidé (§5.0) et les astuces contextuelles.
// Les écrans émettent ; le tutoriel s'abonne avec `onMeta` et attend l'action demandée.

import type { UnitId } from '../data/types';
import type { PullPackId, PullResult } from './pulls';

export interface MetaEvents {
  /** Un écran vient de s'afficher (route : '', 'tirages', 'collection', 'campagne', 'combat'…). */
  screen: { route: string };
  /** Un pack vient d'être ouvert (animation terminée ou passée). */
  packOpened: { pack: PullPackId; results: PullResult[]; free: boolean };
  /** Un deck a changé (placement, échange, deck actif). */
  deckChanged: { index: number; deck: UnitId[] };
  /** Un héros est monté de niveau, a été éveillé, ou a reçu un talent. */
  heroUpgraded: { unit: UnitId; kind: 'niveau' | 'eveil' | 'talent' };
  /** La fiche d'un héros s'est ouverte. */
  heroSheet: { unit: UnitId };
  /** Profil créé (pseudo, avatar) puis deck de départ choisi. */
  profileCreated: { id: string };
  starterChosen: { starter: 'marvel' | 'disney' };
  /** Récompenses de fin de partie affichées. */
  rewards: { mode: 'infini'; waves: number };
}

type Handler<K extends keyof MetaEvents> = (detail: MetaEvents[K]) => void;
const handlers = new Map<keyof MetaEvents, Set<Handler<never>>>();

export function onMeta<K extends keyof MetaEvents>(type: K, fn: Handler<K>): () => void {
  let set = handlers.get(type);
  if (!set) { set = new Set(); handlers.set(type, set); }
  set.add(fn as Handler<never>);
  return () => { set.delete(fn as Handler<never>); };
}

export function emitMeta<K extends keyof MetaEvents>(type: K, detail: MetaEvents[K]): void {
  for (const fn of handlers.get(type) ?? []) {
    try { (fn as Handler<K>)(detail); } catch (e) { console.error(e); }
  }
  // Aussi en événement DOM (window, 'mr-meta') pour les modules qui préfèrent addEventListener.
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('mr-meta', { detail: { type, ...detail } }));
}
