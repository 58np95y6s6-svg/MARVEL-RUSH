// Service Coop de l'application : présence du duo, invitations dans l'app, salon par code (secours) et session
// en cours. Un seul exemplaire, démarré après le chargement du profil (src/ui/app.ts).

import { getAccessKey, presenceSeed } from '../access/gate';
import { STARTER_DECKS } from '../data/units';
import type { UnitId } from '../data/types';
import { playerSetupFor } from '../meta/decks';
import { accountLevel } from '../meta/economy';
import { onMeta } from '../meta/events';
import { soloChaptersDone } from '../meta/coop';
import { coopLevelConfig, getCoopLevel } from '../campaign/coopLevels';
import { activeDeck, getProfile, onProfileChange, updateProfile } from '../meta/profile';
import { CoopGuest, CoopHost, classifyIncoming, randomId, sendInvite, type CoopSave, type IncomingInvite, type InviteHandle, type LocalPlayer } from './coop';
import { NetError, getNetwork, type Endpoint, type Link } from './peer';
import { createPresence, personalId, presenceNamespace, roomId, type Presence, type PresenceDiag, type PresenceState } from './presence';
import { msg, type CoopMode, type DeckSetup, type PresenceInfo, type PresenceStatus } from './protocol';

export type Session = CoopHost | CoopGuest;

type H<T> = Set<(v: T) => void>;
const fire = <T>(hs: H<T>, v: T) => { for (const h of [...hs]) { try { h(v); } catch (e) { console.error(e); } } };

let presence: Presence | null = null;
let ns: string | null = null;
let status: PresenceStatus = 'accueil';
let session: Session | null = null;
let room: { code: string; ep: Endpoint } | null = null;
let started = false;
let profileId: string | null = null;
const changeHs: H<void> = new Set();
const inviteHs: H<IncomingInvite> = new Set();
const sessionHs: H<Session | null> = new Set();
const resumeHs: H<CoopGuest> = new Set();
let pendingInvite: IncomingInvite | null = null;
let nsResolve: (v: string) => void = () => undefined;
const nsReady: Promise<string> = new Promise((r) => { nsResolve = r; });
async function namespace(): Promise<string> {
  if (ns) return ns;
  return Promise.race([nsReady, new Promise<string>((_, rej) => setTimeout(() => rej(new NetError('unavailable', 'Présence indisponible.')), 8000))]);
}

function deviceId(): string {
  try {
    let d = localStorage.getItem('mr-device');
    if (!d) { d = randomId(10); localStorage.setItem('mr-device', d); }
    return d;
  } catch { return 'appareil'; }
}

/** Mes informations (profil actif). */
export function myHello(): LocalPlayer['hello'] {
  const p = getProfile();
  return {
    profileId: p?.id ?? 'anonyme', name: p?.name ?? 'Joueur', avatar: p?.avatar ?? 'spiderman',
    level: accountLevel(p?.xp ?? 0).level, soloChapters: soloChaptersDone(p), peer: presence?.peerId ?? room?.ep.id ?? '',
  };
}

/** Réglages moteur d'un deck du profil actif. */
export function deckSetup(deck?: UnitId[]): DeckSetup {
  const p = getProfile();
  const d = deck ?? activeDeck(p, STARTER_DECKS.marvel);
  return { deck: d.slice(), ...playerSetupFor(p, d) };
}

const me = (): LocalPlayer => ({ hello: myHello(), setup: deckSetup() });

// ---------------------------------------------------------------------------------------------
// Mémoire locale : partie Coop sauvegardée par l'hôte (chaque vague) et session à rejoindre par l'invitée.

const SAVE_KEY = (pid: string) => `mr-coop-save-${pid}`;
const JOIN_KEY = 'mr-coop-rejoin';
/** Fenêtre de retour de l'invitée après une fermeture de l'application. */
export const REJOIN_TTL_MS = 10 * 60_000;
interface RejoinRecord { session: string; hostPeer: string; hostProfileId: string; at: number }

function readJson<T>(k: string): T | null {
  try { const t = localStorage.getItem(k); return t ? (JSON.parse(t) as T) : null; } catch { return null; }
}
function writeJson(k: string, v: unknown): void {
  try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch { /* stockage plein ou bloqué */ }
}

/** Partie Coop sauvegardée du profil actif (hôte), ou null. */
export function coopSave(): CoopSave | null {
  const p = getProfile();
  if (!p) return null;
  const s = readJson<CoopSave>(SAVE_KEY(p.id));
  return s && s.v === 1 ? s : null;
}
export function saveCoopGame(s: CoopSave): void { const p = getProfile(); if (p) writeJson(SAVE_KEY(p.id), s); }
export function clearCoopSave(): void { const p = getProfile(); if (p) writeJson(SAVE_KEY(p.id), null); }
function rememberRejoin(r: RejoinRecord | null): void { writeJson(JOIN_KEY, r); }
let rejoining = false;

const ROUTE_STATUS: Record<string, PresenceStatus> = {
  '': 'accueil', tirages: 'tirages', collection: 'collection', decks: 'collection', campagne: 'campagne',
  combat: 'en partie', 'campagne-combat': 'en partie', coop: 'coop', 'coop-combat': 'en partie', tutoriel: 'en partie',
};

export const coopService = {
  get state(): PresenceState { return presence?.state ?? 'off'; },
  get session(): Session | null { return session; },
  get roomCode(): string | null { return room?.code ?? null; },
  partner(): PresenceInfo | null { return presence?.partner() ?? null; },
  /** Ligne de diagnostic de la présence (écran Coop). */
  diag(): PresenceDiag { return presence?.diag() ?? 'off'; },
  /** Bouton « Actualiser » : refait rendez-vous et liens directs. */
  async refresh(): Promise<void> {
    if (!presence) { await startPresence(); return; }
    await presence.refresh();
    fire(changeHs, undefined);
    void tryRejoin();
  },
  /** Partie Coop sauvegardée (hôte) : reprise possible avec la même partenaire. */
  get save(): CoopSave | null { return coopSave(); },
  onChange(h: () => void): () => void { changeHs.add(h); return () => { changeHs.delete(h); }; },
  onInvite(h: (i: IncomingInvite) => void): () => void { inviteHs.add(h); return () => { inviteHs.delete(h); }; },
  onSession(h: (s: Session | null) => void): () => void { sessionHs.add(h); return () => { sessionHs.delete(h); }; },
  /** Partie rejointe automatiquement après la réouverture de l'application (invitée) : aller au combat. */
  onRejoined(h: (s: CoopGuest) => void): () => void { resumeHs.add(h); return () => { resumeHs.delete(h); }; },
  /** Invitation reçue en attente d'affichage (arrivée pendant le chargement d'un écran). */
  takePendingInvite(): IncomingInvite | null { const i = pendingInvite; pendingInvite = null; return i; },

  async start(): Promise<void> {
    if (started) return;
    started = true;
    ns = await presenceNamespace(await presenceSeed());
    nsResolve(ns);
    onMeta('screen', ({ route }) => {
      const s = ROUTE_STATUS[route] ?? (route.startsWith('campagne') ? 'campagne' : route.startsWith('coop') ? 'coop' : 'ailleurs');
      if (s !== status) { status = s; presence?.announce(); }
    });
    onProfileChange((p) => {
      if (p && profileId && p.id !== profileId) { presence?.stop(); presence = null; void startPresence(); }
      else if (p && !presence) void startPresence();
      else presence?.announce();
    });
    document.addEventListener('visibilitychange', () => {
      if (!presence) return;
      if (document.hidden) { if (!session) presence.pause(); return; }
      // Retour au premier plan : reconnexion au serveur, présence, et partie en cours si le lien est tombé.
      presence.resume();
      if (session instanceof CoopGuest && !session.connected && !session.isOver) session.retry();
      else if (!session) void tryRejoin();
    });
    await startPresence();
  },

  /** Invite la partenaire en ligne. À l'acceptation, la session hôte démarre (salon). */
  invite(mode: CoopMode, levelId?: string, mapId = 'toits-new-york', resume?: CoopSave): InviteHandle | null {
    const partner = presence?.partner();
    const ep = presence?.endpoint;
    if (!partner || !ep) return null;
    const h = sendInvite(ep, partnerPeers(partner), { from: myHello(), mode, levelId, resumeWave: resume?.wave });
    void h.result.then((r) => {
      if (!('link' in r)) return;
      const host = newHost(mode, levelId, mapId, resume);
      host.attach(r.link, r.early());
    });
    return h;
  },

  /** « Reprendre » : invite la partenaire à reprendre la partie sauvegardée. */
  resumeSaved(): InviteHandle | null {
    const s = coopSave();
    if (!s) return null;
    return coopService.invite(s.mode, s.levelId, s.mapId, s);
  },

  /** Accepte une invitation reçue : la session invitée démarre sur le même lien. */
  accept(inv: IncomingInvite): Session {
    const link = inv.accept();
    return newGuest(link);
  },

  /** Secours : crée un salon avec un code (6 caractères) à partager. */
  async createRoom(mode: CoopMode, levelId?: string, mapId = 'toits-new-york'): Promise<{ code: string; url: string }> {
    const ns = await namespace();
    const net = getNetwork();
    closeRoom();
    let ep: Endpoint | null = null;
    let code = '';
    for (let i = 0; i < 4 && !ep; i++) {
      code = randomId(6);
      try { ep = await net.open(roomId(ns, code)); } catch (e) { if (!(e instanceof NetError) || e.code !== 'taken') throw e; }
    }
    if (!ep) throw new NetError('taken', 'Impossible de créer le salon.');
    room = { code, ep };
    const host = newHost(mode, levelId, mapId);
    ep.onLink((l) => void routeIncoming(l));
    void host;
    const key = await getAccessKey();
    const url = `${location.origin}${location.pathname}#${key ? `k=${encodeURIComponent(key)}&` : ''}room=${code}`;
    return { code, url };
  },

  /** Rejoint un salon par son code. */
  async joinRoom(code: string): Promise<Session> {
    const ns = await namespace();
    const clean = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.length !== 6) throw new NetError('unreachable', 'Le code fait 6 caractères.');
    let ep = presence?.endpoint ?? null;
    if (!ep) ep = await getNetwork().open(`mr-${ns}-g${randomId(8)}`);
    const link = await ep.connect(roomId(ns, clean), 10000);
    return newGuest(link, ep);
  },

  /** Quitte la session en cours (salon ou partie). */
  leave(): void {
    session?.close();
    setSession(null);
    closeRoom();
    rememberRejoin(null);
  },

  /** Statut affiché à la partenaire. */
  setStatus(s: PresenceStatus): void { if (s !== status) { status = s; presence?.announce(); } },
};

function closeRoom(): void {
  if (room) { const r = room; room = null; setTimeout(() => r.ep.destroy(), 500); }
}

function setSession(s: Session | null): void {
  if (session && session !== s) session.close();
  session = s;
  fire(sessionHs, s);
  fire(changeHs, undefined);
}

/** Identifiants où joindre la partenaire : présence d'abord, puis identifiants mémorisés sur le profil. */
function partnerPeers(partner?: PresenceInfo | null): string[] {
  const q = getProfile()?.partner;
  const out = [partner?.peer, q?.peer, ns && q?.profileId ? personalId(ns, q.profileId) : null];
  return out.filter((x, i, a): x is string => !!x && a.indexOf(x) === i);
}

function newHost(mode: CoopMode, levelId: string | undefined, mapId: string, resume?: CoopSave): CoopHost {
  const host = new CoopHost({
    me: me(), mode, levelId, mapId, hostPeer: presence?.peerId ?? room?.ep.id ?? '', resume,
    // Coop Niveaux : vagues à tenir, difficulté et boss imposé du niveau.
    configFor: (lob) => {
      const lvl = lob.mode === 'coop-niveaux' && lob.levelId ? getCoopLevel(lob.levelId) : undefined;
      return lvl ? coopLevelConfig(lvl) : {};
    },
  });
  setSession(host);
  return host;
}

function newGuest(link: Link, ep: Endpoint | null = null, rejoin?: { session: string; hostPeer: string }, publish = true): CoopGuest {
  const g: CoopGuest = new CoopGuest({
    me: me(), link, rejoin,
    // Point d'accès le plus récent (la présence peut l'avoir rouvert) et identifiants actuels de l'hôte.
    endpoint: () => presence?.endpoint ?? ep,
    hostPeers: (): string[] => {
      const host = g.lobby?.players.find((x) => x.id === 'p1');
      const pr = presence?.others().find((x) => x.profileId === host?.profileId) ?? null;
      return pr ? [pr.peer] : [];
    },
  });
  // Mémorise la partie en cours : si l'application est fermée, elle la rejoint à la réouverture.
  const remember = () => {
    const host = g.lobby?.players.find((x) => x.id === 'p1');
    if (g.sessionId && g.lobby && host && !g.isOver) rememberRejoin({ session: g.sessionId, hostPeer: g.lobby.hostPeer, hostProfileId: host.profileId, at: Date.now() });
  };
  g.onStart(remember);
  g.onLobby(() => { if (g.gameConfig) remember(); });
  g.onResult(() => rememberRejoin(null));
  g.onBye(() => rememberRejoin(null));
  if (publish) setSession(g);
  return g;
}

/**
 * Application rouverte pendant une partie Coop (invitée) : rappelle l'hôte et rejoint la session s'il l'a encore.
 * Essaie l'identifiant actuel de l'hôte (présence), puis celui mémorisé, puis son identifiant de base.
 */
async function tryRejoin(): Promise<void> {
  const rec = readJson<RejoinRecord>(JOIN_KEY);
  if (!rec || session || rejoining || !presence?.endpoint || !ns) return;
  if (Date.now() - rec.at > REJOIN_TTL_MS) { rememberRejoin(null); return; }
  rejoining = true;
  try {
    const pr = presence.others().find((x) => x.profileId === rec.hostProfileId);
    const peers = [pr?.peer, rec.hostPeer, personalId(ns, rec.hostProfileId)].filter((x, i, a): x is string => !!x && a.indexOf(x) === i);
    for (const peer of peers) {
      const ep = presence?.endpoint;
      if (!ep || session) return;
      let link: Link;
      try { link = await ep.connect(peer, 6000); } catch { continue; }
      // Session publiée seulement si l'hôte l'accepte (sinon les écrans ne voient rien passer).
      const g = newGuest(link, ep, { session: rec.session, hostPeer: peer }, false);
      // L'hôte refuse (partie finie ou application rouverte) : le lien se ferme sans « start ».
      const ok = await new Promise<boolean>((res) => {
        const t = setTimeout(() => { off(); offClose(); offBye(); res(false); }, 6000);
        const off = g.onStart(() => { clearTimeout(t); offClose(); offBye(); res(true); });
        const offClose = g.onPeer((st) => { if (st === 'lost' || st === 'gone') { clearTimeout(t); off(); offClose(); offBye(); res(false); } });
        const offBye = g.onBye(() => { clearTimeout(t); off(); offClose(); offBye(); res(false); });
      });
      if (ok && !session) { setSession(g); fire(resumeHs, g); return; }
      g.close();
    }
  } finally {
    rejoining = false;
  }
}

/** Lien entrant (identifiant personnel ou salon) : invitation, reconnexion ou arrivée par code. */
async function routeIncoming(l: Link): Promise<void> {
  const r = await classifyIncoming(l);
  if (!r) return;
  if (r.kind === 'invite') {
    if (session && session.connected) { r.invite.refuse('déjà en partie'); return; }
    if (inviteHs.size === 0) pendingInvite = r.invite;
    fire(inviteHs, r.invite);
  } else if (r.kind === 'rejoin') {
    // Session inconnue (partie finie, application de l'hôte rouverte) : refus explicite, l'invitée arrête d'appeler.
    if (!(session instanceof CoopHost) || !session.rejoin(l, r.session, r.profileId)) { l.send(msg({ t: 'bye', reason: 'session' })); setTimeout(() => l.close(), 300); }
  } else if (r.kind === 'hello') {
    if (session instanceof CoopHost && !session.connected) session.attach(l, r.first);
    else l.close();
  } else if (r.kind === 'presence') {
    if (presence) presence.adopt(l, r.first); else l.close();
  }
}

async function startPresence(): Promise<void> {
  const p = getProfile();
  if (!p || !ns) return;
  profileId = p.id;
  const pr = createPresence({
    net: getNetwork(), ns,
    // Connexion directe à la partenaire, même sans rendez-vous commun (identifiants mémorisés sur le profil).
    knownPeers: () => partnerPeers(null),
    me: () => {
      const q = getProfile();
      return { profileId: q?.id ?? p.id, device: deviceId(), name: q?.name ?? p.name, avatar: q?.avatar ?? p.avatar, level: accountLevel(q?.xp ?? 0).level, status, chapters: soloChaptersDone(q) };
    },
  });
  presence = pr;
  pr.onLink((l) => void routeIncoming(l));
  pr.onChange(() => {
    fire(changeHs, undefined);
    const partner = pr.partner();
    const q = getProfile();
    if (partner && q && (q.partner?.profileId !== partner.profileId || q.partner?.name !== partner.name || q.partner?.avatar !== partner.avatar || String(q.partner?.chapters) !== String(partner.chapters) || (partner.peer && q.partner?.peer !== partner.peer))) {
      void updateProfile((x) => { x.partner = { profileId: partner.profileId, name: partner.name, avatar: partner.avatar, seenAt: Date.now(), chapters: partner.chapters, peer: partner.peer || x.partner?.peer }; }).catch(() => undefined);
    }
    if (partner && !session) void tryRejoin();
  });
  try { await pr.start(); } catch { /* présence indisponible : l'interface l'affiche discrètement */ }
  fire(changeHs, undefined);
}
