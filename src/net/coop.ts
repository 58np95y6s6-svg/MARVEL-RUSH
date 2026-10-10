// Session Coop à deux (§5.5) : salon puis partie, au-dessus d'un lien direct (src/net/peer.ts).
// L'hôte fait autorité : il fait tourner le moteur, valide et applique les commandes de l'invité, diffuse
// un instantané compact 10 fois par seconde avec les événements. L'invité envoie ses commandes et dessine.
// Reconnexion : l'invité qui perd le lien rappelle l'hôte (identifiant personnel) pendant 30 s ; l'hôte met
// la partie en pause en l'attendant, puis continue seul s'il ne revient pas.

import type { Command, Engine, EngineEvent, EngineState, GameConfig, PlayerId } from '../engine/types';
import { NetError, type Endpoint, type Link } from './peer';
import {
  msg, sanitizeCommand,
  type CoopMode, type CoopResult, type DeckSetup, type HelloInfo, type LobbyPlayer, type NetMessage,
} from './protocol';

export const SNAPSHOT_EVERY_TICKS = 2;     // 20 ticks/s → 10 instantanés/s
export const RECONNECT_WINDOW_MS = 30_000;
export const SILENCE_GAME_MS = 5_000;
export const SILENCE_LOBBY_MS = 9_000;
export const INVITE_TTL_MS = 60_000;

export type PeerStatus = 'connected' | 'lost' | 'back' | 'gone';

export interface LocalPlayer { hello: HelloInfo; setup: DeckSetup }

export interface LobbyState {
  session: string;
  mode: CoopMode;
  levelId?: string;
  mapId: string;
  hostPeer: string;
  players: LobbyPlayer[];
  /** Reprise d'une partie sauvegardée : vague où elle reprend. */
  resumeWave?: number;
}

/** Partie Coop sauvegardée par l'hôte à chaque vague (reprise plus tard par le même duo). */
export interface CoopSave {
  v: 1;
  at: number;
  mode: CoopMode;
  levelId?: string;
  mapId: string;
  wave: number;
  partnerProfileId: string;
  partnerName: string;
  config: GameConfig;
  /** Moteur sérialisé (Engine.serialize). */
  engine: string;
}

type Hs<T> = Set<(v: T) => void>;
function emit<T>(hs: Hs<T>, v: T): void { for (const h of [...hs]) { try { h(v); } catch (e) { console.error(e); } } }
function sub<T>(hs: Hs<T>, h: (v: T) => void): () => void { hs.add(h); return () => { hs.delete(h); }; }

export const randomId = (n = 8, rnd: () => number = Math.random): string => {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < n; i++) s += a[Math.floor(rnd() * a.length)]!;
  return s;
};

// ---------------------------------------------------------------------------------------------
// Instantané compact : seulement ce qu'il faut pour dessiner (pas de graine ni de file interne).

export function compactState(st: EngineState): EngineState {
  return {
    tick: st.tick, time: st.time, wave: st.wave, waveTimeLeft: st.waveTimeLeft, phase: st.phase,
    lives: st.lives, countdown: st.countdown, upcomingBoss: st.upcomingBoss, bossRageIn: st.bossRageIn, result: st.result,
    lanes: st.lanes.map((l) => ({ id: l.id, length: l.length })),
    players: st.players.map((p) => ({
      id: p.id, mana: p.mana, summonCost: p.summonCost, powerUps: p.powerUps, deck: p.deck,
      giftUsedThisWave: p.giftUsedThisWave, manaLevel: p.manaLevel,
      grid: p.grid.map((u) => u && { uid: u.uid, unit: u.unit, rank: u.rank, cooldown: 0, status: u.status, counters: u.counters }),
    })),
    enemies: st.enemies.map((e) => {
      const o: EngineState['enemies'][number] = {
        uid: e.uid, kind: e.kind, lane: e.lane, distance: e.distance, speed: e.speed, hp: e.hp, maxHp: e.maxHp,
        armor: e.armor, shieldHits: e.shieldHits, effects: e.effects,
      };
      if (e.bossId) o.bossId = e.bossId;
      if (e.minionOf) o.minionOf = e.minionOf;
      if (e.giant) o.giant = e.giant;
      return o;
    }),
  };
}

/** Événements utiles à l'invité (les autres restent chez l'hôte). */
const SKIP_EVENTS: ReadonlySet<EngineEvent['type']> = new Set<EngineEvent['type']>([]);
const relayEvents = (evs: EngineEvent[]): EngineEvent[] => (SKIP_EVENTS.size ? evs.filter((e) => !SKIP_EVENTS.has(e.type)) : evs);

// ---------------------------------------------------------------------------------------------
// Invitations

export interface InviteHandle {
  readonly id: string;
  /** Lien vers l'invitée si elle accepte ; null si elle refuse, si l'invitation expire ou est annulée. */
  readonly result: Promise<{ link: Link; early: () => NetMessage[] } | { refused: true; reason?: string } | { expired: true } | { cancelled: true } | { error: string }>;
  cancel(): void;
}

export function sendInvite(ep: Endpoint, partnerPeer: string | string[], o: { from: HelloInfo; mode: CoopMode; levelId?: string; ttlMs?: number; resumeWave?: number }): InviteHandle {
  const id = randomId(10);
  const ttl = o.ttlMs ?? INVITE_TTL_MS;
  let cancelFn: () => void = () => undefined;
  const result: InviteHandle['result'] = new Promise((resolve) => {
    let done = false;
    let link: Link | null = null;
    const finish = (r: Awaited<InviteHandle['result']>) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (!('link' in r) && link) { link.send(msg({ t: 'inviteCancel', inviteId: id })); const l = link; setTimeout(() => l.close(), 300); }
      resolve(r);
    };
    const timer = setTimeout(() => finish({ expired: true }), ttl);
    cancelFn = () => finish({ cancelled: true });
    // Plusieurs identifiants possibles (présence, profil) : le premier qui répond.
    const peers = (Array.isArray(partnerPeer) ? partnerPeer : [partnerPeer]).filter((x, i, a) => !!x && a.indexOf(x) === i);
    const connectAny = async (): Promise<Link> => {
      let err: unknown = new NetError('unreachable', 'Appareil introuvable.');
      for (const p of peers) { try { return await ep.connect(p); } catch (e) { err = e; } }
      throw err;
    };
    connectAny().then((l) => {
      link = l;
      if (done) { l.send(msg({ t: 'inviteCancel', inviteId: id })); setTimeout(() => l.close(), 300); return; }
      // Après l'acceptation, les premiers messages (hello) sont gardés jusqu'à la prise en main du lien.
      const early: NetMessage[] = [];
      let accepted = false;
      const off = l.onMessage((m) => {
        if (accepted) { early.push(m); return; }
        if (m.t !== 'inviteReply' || m.inviteId !== id) return;
        if (m.accept) { accepted = true; finish({ link: l, early: () => { off(); offClose(); return early.splice(0); } }); } else finish({ refused: true, reason: m.reason });
      });
      const offClose = l.onClose(() => finish({ error: 'Ta partenaire s’est déconnectée.' }));
      l.send(msg({ t: 'invite', inviteId: id, from: o.from, mode: o.mode, levelId: o.levelId, expiresAt: Date.now() + ttl, ...(o.resumeWave ? { resumeWave: o.resumeWave } : {}) }));
    }).catch((e: unknown) => finish({ error: e instanceof NetError && e.code === 'unreachable' ? 'Impossible de joindre ta partenaire.' : 'Connexion impossible pour le moment.' }));
  });
  return { id, result, cancel: () => cancelFn() };
}

/** Invitation reçue sur un lien entrant. */
export interface IncomingInvite {
  id: string;
  from: HelloInfo;
  mode: CoopMode;
  levelId?: string;
  /** Reprise d'une partie sauvegardée (vague). */
  resumeWave?: number;
  expiresAt: number;
  link: Link;
  accept(): Link;
  refuse(reason?: string): void;
  onCancel(h: () => void): () => void;
}

/**
 * Attend le premier message d'un lien entrant et le classe : invitation, reconnexion à une partie,
 * ou arrivée par code de salon (hello).
 */
export function classifyIncoming(l: Link, timeoutMs = 8000): Promise<
  | { kind: 'invite'; invite: IncomingInvite } | { kind: 'rejoin'; session: string; profileId: string } | { kind: 'hello'; first: NetMessage }
  | { kind: 'presence'; first: NetMessage } | null
> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => { off(); resolve(null); l.close(); }, timeoutMs);
    const off = l.onMessage((m) => {
      clearTimeout(timer);
      off();
      if (m.t === 'invite') {
        const cancels = new Set<() => void>();
        let cancelled = false;
        const offC = l.onMessage((x) => { if (x.t === 'inviteCancel' && x.inviteId === m.inviteId) { cancelled = true; emit(cancels as Hs<void>, undefined); } });
        l.onClose(() => { if (!cancelled) { cancelled = true; emit(cancels as Hs<void>, undefined); } });
        resolve({
          kind: 'invite',
          invite: {
            id: m.inviteId, from: m.from, mode: m.mode, levelId: m.levelId, expiresAt: m.expiresAt, link: l, resumeWave: m.resumeWave,
            accept() { offC(); l.send(msg({ t: 'inviteReply', inviteId: m.inviteId, accept: true })); return l; },
            refuse(reason) { offC(); l.send(msg({ t: 'inviteReply', inviteId: m.inviteId, accept: false, reason })); setTimeout(() => l.close(), 400); },
            onCancel(h) { if (cancelled) { h(); return () => undefined; } cancels.add(h); return () => { cancels.delete(h); }; },
          },
        });
      } else if (m.t === 'rejoin') resolve({ kind: 'rejoin', session: m.session, profileId: m.profileId });
      else if (m.t === 'presence') resolve({ kind: 'presence', first: m });
      else if (m.t === 'hello') resolve({ kind: 'hello', first: m });
      else { l.close(); resolve(null); }
    });
  });
}

// ---------------------------------------------------------------------------------------------
// Hôte

export interface HostOptions {
  me: LocalPlayer;
  mode: CoopMode;
  levelId?: string;
  mapId: string;
  hostPeer: string;
  /** Configuration de partie fusionnée (niveau Coop : targetWaves, script…). */
  configFor?: (lobby: LobbyState) => Partial<GameConfig>;
  seed?: number;
  now?: () => number;
  /** Reprise d'une partie sauvegardée (même duo) : configuration et moteur repris tels quels. */
  resume?: CoopSave;
}

export class CoopHost {
  readonly isHost = true;
  readonly me: PlayerId = 'p1';
  private link: Link | null = null;
  private offLink: (() => void)[] = [];
  private st: LobbyState;
  private setups: Record<PlayerId, DeckSetup | null> = { p1: null, p2: null };
  private phase: 'lobby' | 'game' | 'over' = 'lobby';
  private config: GameConfig | null = null;
  private engine: Engine | null = null;
  private pendingEvents: EngineEvent[] = [];
  private ticks = 0;
  private lastHeard = 0;
  private lostAt = 0;
  private goneTimer: ReturnType<typeof setTimeout> | null = null;
  private watch: ReturnType<typeof setInterval> | null = null;
  private guestLoaded = false;
  private result: CoopResult | null = null;
  private now: () => number;
  private lobbyHs: Hs<LobbyState> = new Set();
  private startHs: Hs<GameConfig> = new Set();
  private peerHs: Hs<PeerStatus> = new Set();
  private emoteHs: Hs<{ from: PlayerId; emote: number }> = new Set();
  private loadedHs: Hs<void> = new Set();
  private closed = false;
  private byeReceived = false;
  /** L'invitée a quitté volontairement (« bye ») plutôt que perdu la connexion. */
  partnerQuit = false;

  constructor(private o: HostOptions) {
    this.now = o.now ?? Date.now;
    const h = o.me.hello;
    this.st = {
      session: randomId(8), mode: o.mode, levelId: o.levelId, mapId: o.mapId, hostPeer: o.hostPeer,
      players: [{ id: 'p1', profileId: h.profileId, name: h.name, avatar: h.avatar, level: h.level, deck: o.me.setup.deck.slice(), ready: false, soloChapters: h.soloChapters }],
    };
    if (o.resume) {
      this.st.resumeWave = o.resume.wave;
      this.st.players[0]!.deck = o.resume.config.players[0]?.deck.slice() ?? this.st.players[0]!.deck;
    }
    this.setups.p1 = o.me.setup;
  }

  /** Reprise : moteur sauvegardé à recharger par l'écran de combat de l'hôte. */
  get savedEngine(): string | undefined { return this.o.resume?.engine; }
  get resume(): CoopSave | undefined { return this.o.resume; }

  get lobby(): LobbyState { return this.st; }
  get session(): string { return this.st.session; }
  get connected(): boolean { return !!this.link?.open; }
  get gameConfig(): GameConfig | null { return this.config; }
  get guest(): LobbyPlayer | undefined { return this.st.players.find((p) => p.id === 'p2'); }

  onLobby(h: (s: LobbyState) => void) { return sub(this.lobbyHs, h); }
  onStart(h: (c: GameConfig) => void) { return sub(this.startHs, h); }
  onPeer(h: (s: PeerStatus) => void) { return sub(this.peerHs, h); }
  onEmote(h: (e: { from: PlayerId; emote: number }) => void) { return sub(this.emoteHs, h); }
  /** L'invitée a fini de charger la partie (l'hôte peut lancer le compte à rebours). */
  onGuestLoaded(h: () => void) { return sub(this.loadedHs, h); }
  get isGuestLoaded(): boolean { return this.guestLoaded; }

  /** Change le mode, le niveau ou la map (salon seulement) : les « Prêt » repartent à zéro. */
  setMode(mode: CoopMode, levelId: string | undefined, mapId: string): void {
    if (this.phase !== 'lobby') return;
    this.st = { ...this.st, mode, levelId, mapId, players: this.st.players.map((p) => ({ ...p, ready: false })) };
    this.pushLobby();
  }

  /** Lien de l'invitée (invitation acceptée, code de salon) ; `first` = message déjà lu (hello). */
  attach(link: Link, first?: NetMessage | NetMessage[]): void {
    if (this.closed) { link.close(); return; }
    if (this.link && this.link !== link) this.link.close();
    this.detach();
    this.link = link;
    this.lastHeard = this.now();
    this.offLink.push(link.onMessage((m) => this.onMessage(m)));
    this.offLink.push(link.onClose(() => this.onLinkClosed(link)));
    if (!this.watch) this.watch = setInterval(() => this.checkSilence(), 1000);
    for (const m of Array.isArray(first) ? first : first ? [first] : []) this.onMessage(m);
    if (this.phase === 'lobby') this.pushLobby();
  }

  /** Reconnexion de l'invitée (lien entrant classé « rejoin »). */
  rejoin(link: Link, session: string, profileId: string): boolean {
    if (session !== this.st.session || this.closed) return false;
    const g = this.guest;
    if (g && g.profileId !== profileId) return false;
    const wasLost = this.lostAt > 0;
    this.attach(link);
    this.lostAt = 0;
    if (this.goneTimer) { clearTimeout(this.goneTimer); this.goneTimer = null; }
    if (this.phase === 'game' && this.config) {
      // Invitée qui revient (coupure ou application rouverte) : salon, puis reprise de la partie en cours.
      link.send(msg({ t: 'lobby', ...this.st }));
      link.send(msg({ t: 'start', session: this.st.session, config: this.config, you: 'p2', startAt: this.now(), resume: true }));
      if (this.engine) this.sendSnapshot();
      if (this.result) link.send(msg({ t: 'result', result: this.result }));
    }
    emit(this.peerHs, wasLost ? 'back' : 'connected');
    return true;
  }

  setDeck(setup: DeckSetup): void {
    if (this.phase !== 'lobby') return;
    this.setups.p1 = setup;
    this.patchPlayer('p1', { deck: setup.deck.slice(), ready: false });
  }

  setReady(ready: boolean): void {
    if (this.phase !== 'lobby') return;
    this.patchPlayer('p1', { ready });
    this.maybeStart();
  }

  // ---------------- partie
  /** Le moteur de la partie (créé par l'écran de combat de l'hôte avec `gameConfig`). */
  bindEngine(engine: Engine): void { this.engine = engine; }
  get boundEngine(): Engine | null { return this.engine; }

  /** À appeler après chaque tick du moteur : diffuse un instantané tous les 2 ticks. */
  afterTick(events: EngineEvent[]): void {
    if (events.length) for (const e of relayEvents(events)) this.pendingEvents.push(e);
    if (++this.ticks % SNAPSHOT_EVERY_TICKS === 0) this.sendSnapshot();
  }

  /** Instantané immédiat (pause, reprise). */
  sendSnapshot(): void {
    if (!this.engine || !this.link?.open) { if (this.pendingEvents.length > 400) this.pendingEvents = []; return; }
    const st = this.engine.state;
    this.link.send(msg({ t: 'snapshot', tick: st.tick, state: compactState(st), events: this.pendingEvents }));
    this.pendingEvents = [];
  }

  emote(n: number): void { this.link?.send(msg({ t: 'emote', from: 'p1', emote: n })); }

  /** Attente de l'invitée (pause) affichée chez elle aussi. */
  hold(waiting: boolean, left?: number): void { this.link?.send(msg({ t: 'hold', waiting, left })); }

  finish(r: CoopResult): void {
    this.phase = 'over';
    this.result = r;
    this.sendSnapshot();
    this.link?.send(msg({ t: 'result', result: r }));
  }

  /** Nouvelle manche avec la même partenaire : retour au salon (decks gardés, « Prêt » à refaire). */
  newRound(): void {
    if (this.closed) return;
    this.phase = 'lobby';
    this.config = null;
    this.engine = null;
    this.result = null;
    this.guestLoaded = false;
    this.ticks = 0;
    this.pendingEvents = [];
    this.st = { ...this.st, session: randomId(8), players: this.st.players.map((p) => ({ ...p, ready: false })) };
    this.pushLobby();
  }

  get isOver(): boolean { return this.phase === 'over'; }

  close(reason = 'fin'): void {
    if (this.closed) return;
    this.closed = true;
    this.link?.send(msg({ t: 'bye', reason }));
    const l = this.link;
    setTimeout(() => l?.close(), 300);
    this.detach();
    if (this.watch) clearInterval(this.watch);
    if (this.goneTimer) clearTimeout(this.goneTimer);
    this.watch = null;
  }

  // ---------------- interne
  private detach(): void { for (const f of this.offLink.splice(0)) f(); }

  private checkSilence(): void {
    if (!this.link?.open) return;
    const limit = this.phase === 'lobby' ? SILENCE_LOBBY_MS : SILENCE_GAME_MS;
    if (this.phase === 'lobby') this.link.send(msg({ t: 'ping', at: this.now() }));
    if (this.now() - this.lastHeard > limit) this.link.close();
  }

  private onLinkClosed(link: Link): void {
    if (link !== this.link || this.closed) return;
    this.link = null;
    this.detach();
    if (this.phase === 'lobby') {
      this.st = { ...this.st, players: this.st.players.map((p) => ({ ...p, ready: false })) };
      emit(this.lobbyHs, this.st);
    }
    if (this.phase === 'over') return;
    if (this.byeReceived) { this.byeReceived = false; this.partnerQuit = true; emit(this.peerHs, 'gone'); return; }
    this.partnerQuit = false;
    this.lostAt = this.now();
    emit(this.peerHs, 'lost');
    if (this.goneTimer) clearTimeout(this.goneTimer);
    this.goneTimer = setTimeout(() => {
      this.goneTimer = null;
      if (!this.link) emit(this.peerHs, 'gone');
    }, RECONNECT_WINDOW_MS);
  }

  private onMessage(m: NetMessage): void {
    this.lastHeard = this.now();
    switch (m.t) {
      case 'hello': {
        const h = m.who;
        this.setups.p2 = m.setup;
        const prev = this.guest;
        const p: LobbyPlayer = { id: 'p2', profileId: h.profileId, name: h.name, avatar: h.avatar, level: h.level, deck: m.setup.deck.slice(), ready: false, soloChapters: h.soloChapters };
        this.st = { ...this.st, players: [this.st.players[0]!, p] };
        if (!prev) emit(this.peerHs, 'connected');
        this.pushLobby();
        break;
      }
      case 'deck':
        if (this.phase !== 'lobby') break;
        this.setups.p2 = m.setup;
        this.patchPlayer('p2', { deck: m.setup.deck.slice(), ready: false });
        break;
      case 'ready':
        if (this.phase === 'lobby') { this.patchPlayer('p2', { ready: m.ready }); this.maybeStart(); }
        else if (this.phase === 'game' && m.ready && !this.guestLoaded) { this.guestLoaded = true; emit(this.loadedHs, undefined); }
        break;
      case 'command': {
        if (this.phase !== 'game' || !this.engine) break;
        const c = sanitizeCommand(m.command, 'p2');
        if (c) this.engine.apply(c);
        break;
      }
      case 'emote':
        if (Number.isInteger(m.emote) && m.emote >= 0 && m.emote < 6) emit(this.emoteHs, { from: 'p2', emote: m.emote });
        break;
      case 'ping': this.link?.send(msg({ t: 'pong', at: m.at })); break;
      case 'bye':
        // Départ volontaire : au salon, sa place se libère ; en partie, on continue seule.
        if (this.phase === 'lobby') {
          this.st = { ...this.st, players: this.st.players.filter((p) => p.id === 'p1') };
          this.setups.p2 = null;
        }
        this.byeReceived = true;
        this.link?.close();
        break;
      default: break;
    }
  }

  private patchPlayer(id: PlayerId, patch: Partial<LobbyPlayer>): void {
    this.st = { ...this.st, players: this.st.players.map((p) => (p.id === id ? { ...p, ...patch } : p)) };
    this.pushLobby();
  }

  private pushLobby(): void {
    emit(this.lobbyHs, this.st);
    this.link?.send(msg({ t: 'lobby', ...this.st }));
  }

  private maybeStart(): void {
    const ps = this.st.players;
    if (this.phase !== 'lobby' || ps.length < 2 || !ps.every((p) => p.ready) || !this.link?.open) return;
    const s1 = this.setups.p1, s2 = this.setups.p2;
    if (!s1 || !s2) return;
    const base: GameConfig = {
      mode: 'coop',
      seed: this.o.seed ?? (Math.random() * 2 ** 31) >>> 0,
      mapId: this.st.mapId,
      prepTime: 3,
      players: [
        { id: 'p1', deck: s1.deck.slice(), levels: s1.levels, talents: s1.talents, awakening: s1.awakening },
        { id: 'p2', deck: s2.deck.slice(), levels: s2.levels, talents: s2.talents, awakening: s2.awakening },
      ],
    };
    const extra = this.o.configFor?.(this.st) ?? {};
    this.config = this.o.resume
      ? { ...this.o.resume.config, mode: 'coop' }
      : { ...base, ...extra, players: base.players, mapId: extra.mapId ?? base.mapId, mode: 'coop' };
    this.phase = 'game';
    this.link.send(msg({ t: 'start', session: this.st.session, config: this.config, you: 'p2', startAt: this.now() }));
    emit(this.startHs, this.config);
  }
}

// ---------------------------------------------------------------------------------------------
// Invitée

export interface GuestOptions {
  me: LocalPlayer;
  link: Link;
  /** Point d'accès personnel, pour rappeler l'hôte après une coupure (fonction : le plus récent). */
  endpoint: Endpoint | null | (() => Endpoint | null);
  /** Identifiants actuels de l'hôte (présence : il a pu changer d'identifiant en rouvrant l'application). */
  hostPeers?: () => (string | null | undefined)[];
  /** Application rouverte pendant une partie : on rejoint la session au lieu de dire bonjour. */
  rejoin?: { session: string; hostPeer: string };
  now?: () => number;
}

export interface Snapshot { state: EngineState; events: EngineEvent[]; at: number }

export class CoopGuest {
  readonly isHost = false;
  readonly me: PlayerId = 'p2';
  private link: Link | null;
  private offLink: (() => void)[] = [];
  private st: LobbyState | null = null;
  private config: GameConfig | null = null;
  private phase: 'lobby' | 'game' | 'over' = 'lobby';
  private lastHeard = 0;
  private watch: ReturnType<typeof setInterval> | null = null;
  private reconnecting = false;
  private closed = false;
  private now: () => number;
  private queue: Snapshot[] = [];
  private lobbyHs: Hs<LobbyState> = new Set();
  private startHs: Hs<GameConfig> = new Set();
  private peerHs: Hs<PeerStatus> = new Set();
  private emoteHs: Hs<{ from: PlayerId; emote: number }> = new Set();
  private holdHs: Hs<{ waiting: boolean; left?: number }> = new Set();
  private resultHs: Hs<CoopResult> = new Set();
  private byeHs: Hs<string> = new Set();
  result: CoopResult | null = null;

  constructor(private o: GuestOptions) {
    this.now = o.now ?? Date.now;
    this.link = o.link;
    this.bind(o.link);
    this.watch = setInterval(() => this.checkSilence(), 1000);
    if (o.rejoin) { this.phase = 'game'; o.link.send(msg({ t: 'rejoin', session: o.rejoin.session, profileId: o.me.hello.profileId })); }
    else o.link.send(msg({ t: 'hello', who: o.me.hello, setup: o.me.setup }));
  }

  /** Session à rejoindre après une coupure (salon ou partie). */
  get sessionId(): string | null { return this.st?.session ?? this.o.rejoin?.session ?? null; }

  get lobby(): LobbyState | null { return this.st; }
  get gameConfig(): GameConfig | null { return this.config; }
  get isOver(): boolean { return this.phase === 'over'; }
  get connected(): boolean { return !!this.link?.open; }

  onLobby(h: (s: LobbyState) => void) { return sub(this.lobbyHs, h); }
  onStart(h: (c: GameConfig) => void) { return sub(this.startHs, h); }
  onPeer(h: (s: PeerStatus) => void) { return sub(this.peerHs, h); }
  onEmote(h: (e: { from: PlayerId; emote: number }) => void) { return sub(this.emoteHs, h); }
  onHold(h: (e: { waiting: boolean; left?: number }) => void) { return sub(this.holdHs, h); }
  onResult(h: (r: CoopResult) => void) { return sub(this.resultHs, h); }
  onBye(h: (reason: string) => void) { return sub(this.byeHs, h); }

  setDeck(setup: DeckSetup): void { this.o.me.setup = setup; this.link?.send(msg({ t: 'deck', setup })); }
  setReady(ready: boolean): void { this.link?.send(msg({ t: 'ready', ready })); }
  /** Partie chargée : l'hôte peut lancer le compte à rebours. */
  loaded(): void { this.link?.send(msg({ t: 'ready', ready: true })); }
  command(c: Command): void { this.link?.send(msg({ t: 'command', command: { ...c, player: 'p2' } as Command })); }
  emote(n: number): void { this.link?.send(msg({ t: 'emote', from: 'p2', emote: n })); }

  /** Relance la reconnexion (fenêtre de 30 s) si le lien est coupé. */
  retry(): void {
    if (this.closed || this.link?.open || this.reconnecting) return;
    emit(this.peerHs, 'lost');
    void this.reconnect();
  }

  /** Instantanés reçus depuis le dernier appel (le plus ancien d'abord). */
  drain(): Snapshot[] { const q = this.queue; this.queue = []; return q; }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.link?.send(msg({ t: 'bye', reason: 'quitte' }));
    const l = this.link;
    setTimeout(() => l?.close(), 300);
    this.unbind();
    if (this.watch) clearInterval(this.watch);
    this.watch = null;
  }

  private bind(l: Link): void {
    this.lastHeard = this.now();
    this.offLink.push(l.onMessage((m) => this.onMessage(m)));
    this.offLink.push(l.onClose(() => this.onLinkClosed(l)));
  }
  private unbind(): void { for (const f of this.offLink.splice(0)) f(); }

  private checkSilence(): void {
    if (!this.link?.open) return;
    this.link.send(msg({ t: 'ping', at: this.now() }));
    const limit = this.phase === 'game' ? SILENCE_GAME_MS : SILENCE_LOBBY_MS;
    if (this.now() - this.lastHeard > limit) this.link.close();
  }

  private onLinkClosed(l: Link): void {
    if (l !== this.link || this.closed) return;
    this.link = null;
    this.unbind();
    if (this.phase === 'over') return;
    emit(this.peerHs, 'lost');
    void this.reconnect();
  }

  private endpoint(): Endpoint | null {
    const e = this.o.endpoint;
    return typeof e === 'function' ? e() : e;
  }

  private async reconnect(): Promise<void> {
    if (this.reconnecting || this.closed) return;
    const session = this.sessionId;
    if (!session) { emit(this.peerHs, 'gone'); return; }
    this.reconnecting = true;
    const until = this.now() + RECONNECT_WINDOW_MS;
    try {
      while (!this.closed && this.now() < until) {
        const ep = this.endpoint();
        const peers = [...(this.o.hostPeers?.() ?? []), this.st?.hostPeer, this.o.rejoin?.hostPeer]
          .filter((x, i, a): x is string => !!x && a.indexOf(x) === i);
        for (const peer of ep ? peers : []) {
          try {
            const l = await ep!.connect(peer, 6000);
            if (this.closed) { l.close(); return; }
            this.link = l;
            this.bind(l);
            l.send(msg({ t: 'rejoin', session, profileId: this.o.me.hello.profileId }));
            if (this.phase === 'lobby') l.send(msg({ t: 'hello', who: this.o.me.hello, setup: this.o.me.setup }));
            emit(this.peerHs, 'back');
            return;
          } catch { /* identifiant suivant */ }
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
      if (!this.closed) emit(this.peerHs, 'gone');
    } finally {
      this.reconnecting = false;
    }
  }

  private onMessage(m: NetMessage): void {
    this.lastHeard = this.now();
    switch (m.t) {
      case 'lobby': {
        const { v: _v, t: _t, ...rest } = m;
        if (this.st && rest.session !== this.st.session && this.phase !== 'lobby') {
          // Nouvelle manche lancée par l'hôte.
          this.phase = 'lobby';
          this.config = null;
          this.result = null;
          this.queue = [];
        }
        this.st = rest;
        emit(this.lobbyHs, this.st);
        break;
      }
      case 'start':
        if (this.st && m.session !== this.st.session) break;
        if (!this.st && this.o.rejoin && m.session !== this.o.rejoin.session) break;
        if (m.resume && this.config) break; // reprise après coupure : la partie continue
        this.config = m.config;
        this.phase = 'game';
        emit(this.startHs, m.config);
        break;
      case 'snapshot':
        this.queue.push({ state: m.state, events: m.events, at: this.now() });
        if (this.queue.length > 30) this.queue.splice(0, this.queue.length - 30);
        break;
      case 'emote':
        if (Number.isInteger(m.emote) && m.emote >= 0 && m.emote < 6) emit(this.emoteHs, { from: 'p1', emote: m.emote });
        break;
      case 'hold': emit(this.holdHs, { waiting: m.waiting, left: m.left }); break;
      case 'result':
        this.phase = 'over';
        this.result = m.result;
        emit(this.resultHs, m.result);
        break;
      case 'ping': this.link?.send(msg({ t: 'pong', at: m.at })); break;
      case 'bye':
        this.closed = true;
        emit(this.byeHs, m.reason);
        this.link?.close();
        break;
      default: break;
    }
  }
}

/** Engine « à distance » pour l'écran de combat de l'invitée : état = dernier instantané reçu. */
export function remoteEngine(config: GameConfig, initial: EngineState, send: (c: Command) => void): Engine & { setState(s: EngineState): void } {
  let state = initial;
  return {
    config,
    get state() { return state; },
    setState(s: EngineState) { state = s; },
    tick() { /* l'hôte fait avancer la partie */ },
    apply(c: Command) { if (c.type !== 'pause') send(c); },
    drainEvents() { return []; },
    serialize() { return JSON.stringify(state); },
  };
}
