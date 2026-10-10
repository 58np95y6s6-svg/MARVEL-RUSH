// Contrat partagé : messages échangés entre deux appareils (présence, invitations, salon Coop, partie).
// L'hôte fait tourner le moteur ; l'invité envoie des commandes et dessine les instantanés reçus (§5.5).
// Toute modification passe par le chef de projet et incrémente PROTOCOL_VERSION.

import type { Command, EngineEvent, EngineState, GameConfig, PlayerId } from '../engine/types';
import type { UnitId } from '../data/types';

/** v3 (octobre 2026) : présence, invitations dans l'app, salon complet, instantanés compacts avec événements. */
export const PROTOCOL_VERSION = 3;

export type CoopMode = 'coop-infini' | 'coop-niveaux';

/** Ce que fait un joueur (affiché à sa partenaire). */
export type PresenceStatus = 'accueil' | 'en partie' | 'tirages' | 'collection' | 'campagne' | 'coop' | 'ailleurs';

export interface PresenceInfo {
  profileId: string;
  /** Appareil (aléatoire, mémorisé) : deux profils sur le même appareil s'ignorent. */
  device: string;
  /** Identifiant réseau personnel (connexions directes : invitations, parties). */
  peer: string;
  name: string;
  avatar: UnitId;
  level: number;
  status: PresenceStatus;
  /** Chapitres Solo terminés (ouverture des chapitres Coop). */
  chapters?: number[];
  /** Vrai si l'appareil tient le rendez-vous (résolution de deux rendez-vous concurrents). */
  lobby?: boolean;
}

/** Joueur du salon Coop. */
export interface LobbyPlayer {
  id: PlayerId;
  profileId: string;
  name: string;
  avatar: UnitId;
  level: number;
  deck: UnitId[];
  ready: boolean;
  /** Chapitres Solo terminés (règle d'ouverture des chapitres Coop). */
  soloChapters: number[];
}

/** Réglages du joueur pour le moteur (deck + niveaux, talents, éveils). */
export interface DeckSetup {
  deck: UnitId[];
  levels: Partial<Record<UnitId, number>>;
  talents: Partial<Record<UnitId, ('a' | 'b')[]>>;
  awakening?: Partial<Record<UnitId, number>>;
}

export interface HelloInfo {
  profileId: string;
  name: string;
  avatar: UnitId;
  level: number;
  soloChapters: number[];
  peer: string;
}

/** Bilan de fin de partie envoyé par l'hôte (chacun crédite son propre profil). */
export interface CoopResult {
  outcome: 'victoire' | 'defaite';
  wave: number;
  mode: CoopMode;
  levelId?: string;
  livesLeft: number;
  bossKills: { boss: string; small: boolean; wave?: number }[];
  /** Coop Niveaux : étoiles communes du duo (évaluées par l'hôte). */
  stars?: [boolean, boolean, boolean];
}

export type NetMessage =
  // ---- présence (rendez-vous du duo)
  | { v: number; t: 'presence'; who: PresenceInfo }
  | { v: number; t: 'roster'; list: PresenceInfo[] }
  // ---- invitations (connexion directe vers l'identifiant personnel de la partenaire)
  | { v: number; t: 'invite'; inviteId: string; from: HelloInfo; mode: CoopMode; levelId?: string; expiresAt: number; resumeWave?: number }
  | { v: number; t: 'inviteReply'; inviteId: string; accept: boolean; reason?: string }
  | { v: number; t: 'inviteCancel'; inviteId: string }
  // ---- salon
  | { v: number; t: 'hello'; who: HelloInfo; setup: DeckSetup }
  | { v: number; t: 'lobby'; session: string; mode: CoopMode; levelId?: string; mapId: string; hostPeer: string; players: LobbyPlayer[]; resumeWave?: number }
  | { v: number; t: 'deck'; setup: DeckSetup }
  | { v: number; t: 'ready'; ready: boolean }
  | { v: number; t: 'start'; session: string; config: GameConfig; you: PlayerId; startAt: number; resume?: boolean }
  // ---- partie
  | { v: number; t: 'command'; command: Command }
  | { v: number; t: 'snapshot'; tick: number; state: EngineState; events: EngineEvent[] }
  | { v: number; t: 'emote'; from: PlayerId; emote: number }
  | { v: number; t: 'hold'; waiting: boolean; left?: number }
  | { v: number; t: 'result'; result: CoopResult }
  | { v: number; t: 'rejoin'; session: string; profileId: string }
  | { v: number; t: 'ping'; at: number }
  | { v: number; t: 'pong'; at: number }
  | { v: number; t: 'bye'; reason: string };

export type MessageType = NetMessage['t'];
/** Message sans le champ de version (ajouté par `msg`). */
export type Payload = NetMessage extends infer M ? (M extends NetMessage ? Omit<M, 'v'> : never) : never;

const TYPES: ReadonlySet<string> = new Set<MessageType>([
  'presence', 'roster', 'invite', 'inviteReply', 'inviteCancel', 'hello', 'lobby', 'deck', 'ready', 'start',
  'command', 'snapshot', 'emote', 'hold', 'result', 'rejoin', 'ping', 'pong', 'bye',
]);

/** Construit un message versionné. */
export function msg<P extends Payload>(p: P): P & { v: number } {
  return { v: PROTOCOL_VERSION, ...p };
}

const round = (_k: string, v: unknown): unknown =>
  typeof v === 'number' && !Number.isInteger(v) ? Math.round(v * 1000) / 1000 : v;

/** Encode un message en texte compact (nombres arrondis au millième). */
export function encode(m: NetMessage): string {
  return JSON.stringify(m, round);
}

/** Décode et valide un message (objet ou texte) ; null si invalide ou d'une autre version. */
export function decode(raw: unknown): NetMessage | null {
  let o: unknown = raw;
  if (typeof raw === 'string') {
    try { o = JSON.parse(raw); } catch { return null; }
  }
  if (!o || typeof o !== 'object') return null;
  const r = o as { v?: unknown; t?: unknown };
  if (r.v !== PROTOCOL_VERSION || typeof r.t !== 'string' || !TYPES.has(r.t)) return null;
  return o as NetMessage;
}

/** Commandes qu'un invité peut envoyer (jamais la pause : l'hôte la gère). */
const GUEST_COMMANDS: ReadonlySet<Command['type']> = new Set(['summon', 'merge', 'copy', 'promote', 'swap', 'powerup', 'manaUpgrade', 'gift']);

/**
 * Valide une commande reçue de l'invité : type autorisé, joueur forcé à `player`, champs numériques bornés.
 * Renvoie la commande à appliquer, ou null.
 */
export function sanitizeCommand(c: unknown, player: PlayerId): Command | null {
  if (!c || typeof c !== 'object') return null;
  const x = c as Record<string, unknown>;
  const type = x['type'];
  if (typeof type !== 'string' || !GUEST_COMMANDS.has(type as Command['type'])) return null;
  const slot = (k: string): number | null => {
    const n = x[k];
    return typeof n === 'number' && Number.isInteger(n) && n >= 0 && n < 15 ? n : null;
  };
  switch (type) {
    case 'summon': return { type, player };
    case 'manaUpgrade': return { type, player };
    case 'merge': case 'copy': case 'promote': case 'swap': {
      const from = slot('from'), to = slot('to');
      return from === null || to === null ? null : { type, player, from, to };
    }
    case 'powerup': return typeof x['unit'] === 'string' ? { type, player, unit: x['unit'] as UnitId } : null;
    case 'gift': { const s = slot('slot'); return s === null ? null : { type, player, slot: s }; }
    default: return null;
  }
}

/** Transport d'une partie (lien direct entre les deux appareils). */
export interface Transport {
  readonly isHost: boolean;
  send(message: NetMessage): void;
  onMessage(handler: (message: NetMessage) => void): () => void;
  onStatus(handler: (status: 'connecting' | 'open' | 'closed' | 'error') => void): () => void;
  close(): void;
}
