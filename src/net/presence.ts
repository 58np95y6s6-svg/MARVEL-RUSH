// Présence du duo (§5.4) : savoir si sa partenaire est en ligne et ce qu'elle fait, l'inviter d'un geste.
//
// Seuls les deux joueurs ont la clé secrète : on en dérive un espace de noms privé
// `ns` = 10 premiers caractères hexadécimaux de SHA-256('marvel-rush-presence|' + graine), la graine étant le
// hash de la clé fixé au build (ou, à défaut, la clé) : la clé brute n'apparaît jamais dans un identifiant. Rendez-vous : l'identifiant fixe `mr-<ns>-lobby`. À l'ouverture, chaque appareil
// tente de le prendre ; s'il est déjà pris, il s'y connecte comme client. Le détenteur relaie la liste des
// présents (« roster »). S'il disparaît, les clients se réélisent après une attente aléatoire.
// Chaque appareil enregistre aussi son identifiant personnel `mr-<ns>-<profil>` pour les connexions directes
// (invitations, parties). Battement toutes les 10 s, oubli après 30 s, pause quand la page est cachée.
//
// Robustesse (retours sur deux téléphones, octobre 2026) :
// - réouverture de l'application : le serveur garde l'ancien identifiant personnel quelques secondes ; on
//   réessaie avec une attente croissante, puis on prend un identifiant de secours `…-g<n>` annoncé par la présence ;
// - « tous les deux en ligne sans se voir » (deux rendez-vous, ou un détenteur fantôme) : chaque appareil se
//   connecte AUSSI directement à l'identifiant personnel connu de sa partenaire (mémorisé sur le profil) et
//   échange sa présence sur ce lien ; nouvelle vérification toutes les 15 s ; un client qui ne reçoit plus la
//   liste du détenteur le quitte et relance l'élection ; si deux appareils tiennent chacun un rendez-vous, celui
//   dont l'identifiant est le plus petit cède le sien ;
// - « Actualiser » (bouton) : tout est refait à la main ; `diag()` donne une ligne d'état lisible.

import { NetError, openRetrying, type Endpoint, type Link, type Network } from './peer';
import { msg, type NetMessage, type PresenceInfo } from './protocol';

export const HEARTBEAT_MS = 10_000;
export const DROP_AFTER_MS = 30_000;

export async function presenceNamespace(accessKey: string | null): Promise<string> {
  const text = `marvel-rush-presence|${accessKey ?? 'dev'}`;
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 10);
}

/** Identifiant réseau sûr (lettres, chiffres, tirets). */
export const safeId = (s: string): string => s.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 40) || 'x';
export const lobbyId = (ns: string): string => `mr-${ns}-lobby`;
export const personalId = (ns: string, profileId: string): string => `mr-${ns}-${safeId(profileId)}`;
export const roomId = (ns: string, code: string): string => `mr-${ns}-room-${code.toUpperCase()}`;

export type PresenceState = 'off' | 'connecting' | 'online' | 'unavailable';
/** Ligne de diagnostic : relié au salon, lien direct avec la partenaire, en attente, en connexion, erreur. */
export type PresenceDiag = 'off' | 'connexion' | 'salon' | 'direct' | 'attente' | 'erreur';
export const RECHECK_MS = 15_000;

export interface PresenceOptions {
  net: Network;
  ns: string;
  /** Mes informations actuelles (sans `peer`, complété par le service). */
  me: () => Omit<PresenceInfo, 'peer'>;
  heartbeatMs?: number;
  dropAfterMs?: number;
  /** Attente avant réélection, en ms (aléatoire entre min et max). */
  backoff?: [number, number];
  random?: () => number;
  /** Identifiants personnels connus de la partenaire (profil), essayés en connexion directe. */
  knownPeers?: () => (string | null | undefined)[];
  /** Nouvelle vérification (liens directs, détenteur muet), en ms. */
  recheckMs?: number;
  /** Attentes avant de réessayer l'identifiant personnel encore « pris » (réouverture de l'application). */
  openWaits?: number[];
}

export interface Presence {
  readonly state: PresenceState;
  /** Mon identifiant personnel (une fois en ligne). */
  readonly peerId: string | null;
  /** Point d'accès personnel (connexions directes). */
  readonly endpoint: Endpoint | null;
  /** Présents autres que moi (même appareil exclu). */
  others(): PresenceInfo[];
  /** Ma partenaire en ligne (le premier autre profil vu), ou null. */
  partner(): PresenceInfo | null;
  isLobbyHolder(): boolean;
  onChange(h: () => void): () => void;
  /** Lien direct entrant (invitation, reconnexion à une partie). */
  onLink(h: (l: Link) => void): () => void;
  /** Lien direct entrant dont le premier message est une présence (classé par le service). */
  adopt(l: Link, first?: NetMessage): void;
  /** Annonce immédiate (changement de statut). */
  announce(): void;
  /** Bouton « Actualiser » : quitte et refait rendez-vous et liens directs. */
  refresh(): Promise<void>;
  diag(): PresenceDiag;
  start(): Promise<void>;
  /** Pause (page cachée) : quitte le rendez-vous, garde l'identifiant personnel. */
  pause(): void;
  resume(): void;
  stop(): void;
}

export function createPresence(o: PresenceOptions): Presence {
  const hb = o.heartbeatMs ?? HEARTBEAT_MS;
  const recheck = o.recheckMs ?? RECHECK_MS;
  const direct = new Map<Link, { info: PresenceInfo | null; seen: number }>();
  let lastRoster = 0;
  let rosterSeen = false;
  let lastRecheck = 0;
  let dialing = false;
  const dropAfter = o.dropAfterMs ?? DROP_AFTER_MS;
  const [bmin, bmax] = o.backoff ?? [400, 2500];
  const rnd = o.random ?? Math.random;
  let state: PresenceState = 'off';
  let personal: Endpoint | null = null;
  let lobby: Endpoint | null = null;          // si je tiens le rendez-vous
  let lobbyLink: Link | null = null;          // si je suis client
  const clients = new Map<Link, { info: PresenceInfo | null; seen: number }>();
  let roster: PresenceInfo[] = [];
  let stopped = true;
  let paused = false;
  let timer: ReturnType<typeof setInterval> | null = null;
  let electTimer: ReturnType<typeof setTimeout> | null = null;
  let electing = false;
  const changeHs = new Set<() => void>();
  const linkHs = new Set<(l: Link) => void>();
  const changed = () => { for (const h of [...changeHs]) { try { h(); } catch (e) { console.error(e); } } };

  const meInfo = (): PresenceInfo => ({ ...o.me(), peer: personal?.id ?? '', ...(lobby ? { lobby: true } : {}) });

  function setState(s: PresenceState): void { if (s !== state) { state = s; changed(); } }

  function setRoster(list: PresenceInfo[]): void {
    const key = (l: PresenceInfo[]) => JSON.stringify(l.map((p) => [p.profileId, p.device, p.status, p.name, p.avatar, p.level, p.peer]).sort());
    if (key(list) === key(roster)) { roster = list; return; }
    roster = list;
    changed();
  }

  // ---------------- détenteur du rendez-vous
  function holderRoster(): PresenceInfo[] {
    const list = [meInfo()];
    for (const c of clients.values()) if (c.info) list.push(c.info);
    return list;
  }
  function broadcast(): void {
    const list = holderRoster();
    setRoster(list);
    const m = msg({ t: 'roster', list });
    for (const l of clients.keys()) l.send(m);
  }
  function acceptClient(l: Link): void {
    clients.set(l, { info: null, seen: Date.now() });
    l.onMessage((m: NetMessage) => {
      const c = clients.get(l);
      if (!c) return;
      c.seen = Date.now();
      if (m.t === 'presence') { c.info = m.who; broadcast(); }
      else if (m.t === 'ping') l.send(msg({ t: 'pong', at: m.at }));
    });
    l.onClose(() => { clients.delete(l); broadcast(); });
  }

  // ---------------- client
  function asClient(l: Link): void {
    lobbyLink = l;
    lastRoster = Date.now();
    rosterSeen = false;
    l.onMessage((m: NetMessage) => { if (m.t === 'roster') { lastRoster = Date.now(); rosterSeen = true; setRoster(m.list); } });
    l.onClose(() => {
      if (lobbyLink !== l) return;
      lobbyLink = null;
      setRoster([]);
      scheduleElection();
    });
    l.send(msg({ t: 'presence', who: meInfo() }));
  }

  function scheduleElection(): void {
    if (stopped || paused || electTimer) return;
    const wait = bmin + rnd() * (bmax - bmin);
    electTimer = setTimeout(() => { electTimer = null; void elect(); }, wait);
  }

  async function elect(): Promise<void> {
    if (stopped || paused || electing || lobby || lobbyLink) return;
    electing = true;
    try {
      try {
        const ep = await o.net.open(lobbyId(o.ns));
        if (stopped || paused) { ep.destroy(); return; }
        lobby = ep;
        ep.onLink(acceptClient);
        ep.onLost(() => { if (lobby === ep) { lobby = null; clients.clear(); setRoster([]); scheduleElection(); } });
        broadcast();
        setState('online');
        return;
      } catch (e) {
        if (!(e instanceof NetError) || e.code !== 'taken') { setState('unavailable'); scheduleElection(); return; }
      }
      if (!personal) return;
      try {
        const l = await personal.connect(lobbyId(o.ns));
        if (stopped || paused) { l.close(); return; }
        asClient(l);
        setState('online');
      } catch {
        // Identifiant pris mais détenteur muet (fermeture en cours) : on réessaie.
        scheduleElection();
      }
    } finally {
      electing = false;
    }
  }

  function tick(): void {
    if (paused || stopped) return;
    const now = Date.now();
    if (lobby) {
      for (const [l, c] of clients) if (now - c.seen > dropAfter) { clients.delete(l); l.close(); }
      broadcast();
    } else if (lobbyLink) {
      // Détenteur muet (fantôme d'une ancienne page, réseau coupé) : on le quitte et on réélit.
      if (now - lastRoster > dropAfter) lobbyLink.close();
      else lobbyLink.send(msg({ t: 'presence', who: meInfo() }));
    } else {
      scheduleElection();
    }
    const me = meInfo();
    for (const [l, d] of direct) {
      if (now - d.seen > dropAfter) { direct.delete(l); l.close(); changed(); continue; }
      l.send(msg({ t: 'presence', who: me }));
    }
    if (now - lastRecheck >= recheck) { lastRecheck = now; void dial(); }
  }

  // ---------------- liens directs avec la partenaire (en plus du rendez-vous)
  function directPartner(): PresenceInfo | null {
    const me = o.me();
    for (const d of direct.values()) if (d.info && d.info.device !== me.device && d.info.profileId !== me.profileId) return d.info;
    return null;
  }

  function adoptDirect(l: Link, first?: NetMessage): void {
    direct.set(l, { info: null, seen: Date.now() });
    l.onMessage((m) => onDirect(l, m));
    l.onClose(() => { if (direct.delete(l)) changed(); });
    l.send(msg({ t: 'presence', who: meInfo() }));
    if (first) onDirect(l, first);
  }

  function onDirect(l: Link, m: NetMessage): void {
    const d = direct.get(l);
    if (!d) return;
    d.seen = Date.now();
    if (m.t === 'presence') {
      const before = JSON.stringify(d.info);
      d.info = m.who;
      if (JSON.stringify(m.who) !== before) changed();
      // Deux rendez-vous (états différents du serveur) : le plus petit identifiant cède le sien.
      if (m.who.lobby && lobby && personal && m.who.peer && personal.id < m.who.peer) {
        leaveLobby();
        scheduleElection();
        changed();
      }
    } else if (m.t === 'ping') l.send(msg({ t: 'pong', at: m.at }));
  }

  /** Connexion directe aux identifiants connus de la partenaire, s'il n'y a pas déjà un lien direct. */
  async function dial(): Promise<void> {
    if (dialing || stopped || paused || !personal || directPartner()) return;
    dialing = true;
    try {
      const me = o.me();
      const fromRoster = roster.filter((p) => p.device !== me.device && p.profileId !== me.profileId).map((p) => p.peer);
      const targets = [...new Set([...fromRoster, ...(o.knownPeers?.() ?? [])])].filter((t): t is string => !!t && t !== personal?.id);
      for (const t of targets) {
        if (stopped || paused || !personal || directPartner()) return;
        try {
          const l = await personal.connect(t, 6000);
          if (stopped || paused) { l.close(); return; }
          adoptDirect(l);
          // Attend sa présence un court instant avant d'essayer l'identifiant suivant.
          await new Promise((r) => setTimeout(r, Math.min(1500, hb)));
        } catch { /* identifiant périmé ou appareil hors ligne */ }
      }
    } finally {
      dialing = false;
    }
  }

  function leaveLobby(): void {
    if (electTimer) { clearTimeout(electTimer); electTimer = null; }
    if (lobby) { for (const l of clients.keys()) l.close(); clients.clear(); lobby.destroy(); lobby = null; }
    if (lobbyLink) { const l = lobbyLink; lobbyLink = null; l.close(); }
    setRoster([]);
  }

  async function openPersonal(): Promise<void> {
    const me = o.me();
    const base = personalId(o.ns, me.profileId);
    // Réouverture : l'ancien identifiant peut rester « pris » quelques secondes sur le serveur.
    personal = await openRetrying(o.net, base, o.openWaits ?? [1000, 2000, 3000]);
    for (let i = 0; i < 3 && !personal; i++) {
      const id = `${base}-g${Math.floor(rnd() * 1e6).toString(36)}`;
      try {
        personal = await o.net.open(id);
      } catch (e) {
        if (e instanceof NetError && e.code === 'taken') continue;
        throw e;
      }
    }
    if (!personal) throw new NetError('taken', 'Identifiant personnel indisponible.');
    if (stopped) { personal.destroy(); personal = null; return; }
    personal.onLink((l) => { for (const h of [...linkHs]) h(l); });
    const ep = personal;
    personal.onLost(() => {
      if (personal !== ep) return;
      personal = null;
      for (const l of [...direct.keys()]) l.close();
      direct.clear();
      if (!stopped) { setState('unavailable'); setTimeout(() => void restart(), 3000); }
    });
  }

  async function restart(): Promise<void> {
    if (stopped) return;
    try {
      if (!personal) await openPersonal();
      if (!paused) await elect();
      if (!paused) void dial();
    } catch {
      setState('unavailable');
      setTimeout(() => void restart(), 8000 + rnd() * 4000);
    }
  }

  const self: Presence = {
    get state() { return state; },
    get peerId() { return personal?.id ?? null; },
    get endpoint() { return personal; },
    others() {
      const me = o.me();
      const out = new Map<string, PresenceInfo>();
      for (const p of roster) out.set(p.device, p);
      for (const d of direct.values()) if (d.info) out.set(d.info.device, d.info); // le lien direct est le plus frais
      return [...out.values()].filter((p) => p.device !== me.device && p.profileId !== me.profileId);
    },
    partner() { return self.others()[0] ?? null; },
    isLobbyHolder: () => !!lobby,
    onChange(h) { changeHs.add(h); return () => { changeHs.delete(h); }; },
    onLink(h) { linkHs.add(h); return () => { linkHs.delete(h); }; },
    adopt(l, first) { if (stopped) { l.close(); return; } adoptDirect(l, first); },
    announce() {
      if (lobby) broadcast();
      else lobbyLink?.send(msg({ t: 'presence', who: meInfo() }));
      const me = meInfo();
      for (const l of direct.keys()) l.send(msg({ t: 'presence', who: me }));
    },
    async refresh() {
      if (stopped) return;
      paused = false;
      leaveLobby();
      for (const l of [...direct.keys()]) l.close();
      direct.clear();
      personal?.wake?.();
      setState('connecting');
      lastRecheck = Date.now();
      await restart();
    },
    diag() {
      if (stopped) return 'off';
      if (state === 'unavailable') return 'erreur';
      if (lobby || (lobbyLink && rosterSeen)) return 'salon';
      if (directPartner()) return 'direct';
      if (state === 'connecting') return 'connexion';
      return 'attente';
    },
    async start() {
      if (!stopped) return;
      stopped = false;
      paused = false;
      setState('connecting');
      timer = setInterval(tick, hb);
      await restart();
    },
    pause() {
      if (stopped || paused) return;
      paused = true;
      leaveLobby();
      for (const l of [...direct.keys()]) l.close();
      direct.clear();
    },
    resume() {
      if (stopped || !paused) { personal?.wake?.(); return; }
      paused = false;
      personal?.wake?.();
      void restart();
    },
    stop() {
      stopped = true;
      if (timer) clearInterval(timer);
      timer = null;
      leaveLobby();
      for (const l of [...direct.keys()]) l.close();
      direct.clear();
      personal?.destroy();
      personal = null;
      setState('off');
    },
  };
  return self;
}
