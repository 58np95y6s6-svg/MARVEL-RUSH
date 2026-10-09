// Contrat partagé : messages échangés entre l'hôte (qui fait tourner le moteur) et l'invité.
// Toute modification passe par le chef de projet et incrémente PROTOCOL_VERSION.

import type { Command, EngineEvent, GameConfig, PlayerId } from '../engine/types';
import type { UnitId } from '../data/types';

export const PROTOCOL_VERSION = 2;

export type NetMessage =
  | { v: number; t: 'hello'; profileId: string; pseudo: string; avatar: UnitId }
  | { v: number; t: 'lobby'; mode: 'coop-niveaux' | 'coop-infini'; levelId?: string; mapId: string; players: { id: PlayerId; pseudo: string; ready: boolean }[] }
  | { v: number; t: 'deck'; deck: UnitId[]; levels: Partial<Record<UnitId, number>>; talents: Partial<Record<UnitId, ('a' | 'b')[]>> }
  | { v: number; t: 'ready'; ready: boolean }
  | { v: number; t: 'start'; config: GameConfig; you: PlayerId; resumeFrom?: string }
  | { v: number; t: 'command'; command: Command }
  | { v: number; t: 'snapshot'; tick: number; state: string }
  | { v: number; t: 'events'; tick: number; events: EngineEvent[] }
  | { v: number; t: 'emote'; from: PlayerId; emote: string }
  | { v: number; t: 'ping'; at: number }
  | { v: number; t: 'pong'; at: number }
  | { v: number; t: 'bye'; reason: string };

export interface Transport {
  readonly isHost: boolean;
  send(message: NetMessage): void;
  onMessage(handler: (message: NetMessage) => void): () => void;
  onStatus(handler: (status: 'connecting' | 'open' | 'closed' | 'error') => void): () => void;
  close(): void;
}
