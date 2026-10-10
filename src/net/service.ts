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
import { CoopGuest, CoopHost, classifyIncoming, randomId, sendInvite, type IncomingInvite, type InviteHandle, type LocalPlayer } from './coop';
import { NetError, getNetwork, type Endpoint, type Link } from './peer';
import { createPresence, presenceNamespace, roomId, type Presence, type PresenceState } from './presence';
import type { CoopMode, DeckSetup, PresenceInfo, PresenceStatus } from './protocol';

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

const ROUTE_STATUS: Record<string, PresenceStatus> = {
  '': 'accueil', tirages: 'tirages', collection: 'collection', decks: 'collection', campagne: 'campagne',
  combat: 'en partie', 'campagne-combat': 'en partie', coop: 'coop', 'coop-combat': 'en partie', tutoriel: 'en partie',
};

export const coopService = {
  get state(): PresenceState { return presence?.state ?? 'off'; },
  get session(): Session | null { return session; },
  get roomCode(): string | null { return room?.code ?? null; },
  partner(): PresenceInfo | null { return presence?.partner() ?? null; },
  onChange(h: () => void): () => void { changeHs.add(h); return () => { changeHs.delete(h); }; },
  onInvite(h: (i: IncomingInvite) => void): () => void { inviteHs.add(h); return () => { inviteHs.delete(h); }; },
  onSession(h: (s: Session | null) => void): () => void { sessionHs.add(h); return () => { sessionHs.delete(h); }; },
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
      if (document.hidden) { if (!session) presence.pause(); }
      else presence.resume();
    });
    await startPresence();
  },

  /** Invite la partenaire en ligne. À l'acceptation, la session hôte démarre (salon). */
  invite(mode: CoopMode, levelId?: string, mapId = 'toits-new-york'): InviteHandle | null {
    const partner = presence?.partner();
    const ep = presence?.endpoint;
    if (!partner || !ep) return null;
    const h = sendInvite(ep, partner.peer, { from: myHello(), mode, levelId });
    void h.result.then((r) => {
      if (!('link' in r)) return;
      const host = newHost(mode, levelId, mapId);
      host.attach(r.link, r.early());
    });
    return h;
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

function newHost(mode: CoopMode, levelId: string | undefined, mapId: string): CoopHost {
  const host = new CoopHost({
    me: me(), mode, levelId, mapId, hostPeer: presence?.peerId ?? room?.ep.id ?? '',
    // Coop Niveaux : vagues à tenir, difficulté et boss imposé du niveau.
    configFor: (lob) => {
      const lvl = lob.mode === 'coop-niveaux' && lob.levelId ? getCoopLevel(lob.levelId) : undefined;
      return lvl ? coopLevelConfig(lvl) : {};
    },
  });
  setSession(host);
  return host;
}

function newGuest(link: Link, ep: Endpoint | null = presence?.endpoint ?? null): CoopGuest {
  const g = new CoopGuest({ me: me(), link, endpoint: ep });
  setSession(g);
  return g;
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
    if (!(session instanceof CoopHost) || !session.rejoin(l, r.session, r.profileId)) l.close();
  } else if (r.kind === 'hello') {
    if (session instanceof CoopHost && !session.connected) session.attach(l, r.first);
    else l.close();
  }
}

async function startPresence(): Promise<void> {
  const p = getProfile();
  if (!p || !ns) return;
  profileId = p.id;
  const pr = createPresence({
    net: getNetwork(), ns,
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
    if (partner && q && (q.partner?.profileId !== partner.profileId || q.partner?.name !== partner.name || q.partner?.avatar !== partner.avatar || String(q.partner?.chapters) !== String(partner.chapters))) {
      void updateProfile((x) => { x.partner = { profileId: partner.profileId, name: partner.name, avatar: partner.avatar, seenAt: Date.now(), chapters: partner.chapters }; }).catch(() => undefined);
    }
  });
  try { await pr.start(); } catch { /* présence indisponible : l'interface l'affiche discrètement */ }
  fire(changeHs, undefined);
}
