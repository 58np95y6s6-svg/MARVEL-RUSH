// Couche réseau interchangeable : un « point d'accès » par identifiant, des liens directs entre appareils.
// En production : PeerJS (serveur de signalisation public de PeerJS + STUN Google, WebRTC pair à pair).
// En test : un réseau en mémoire (`createMemoryNetwork`), sans aucun accès réseau.
//
// Limite connue : deux appareils derrière des NAT symétriques (certains réseaux 4G) ne se joignent pas en direct ;
// on passe alors par les relais TURN publics de PeerJS (sans garantie). Un TURN à soi peut être ajouté au build
// (VITE_TURN_URL, VITE_TURN_USER, VITE_TURN_PASS) ; sinon, passer un des deux téléphones en Wi-Fi règle en général
// le problème.

import { decode, encode, type NetMessage } from './protocol';

export type NetErrorCode = 'taken' | 'unavailable' | 'unreachable' | 'timeout' | 'closed';

export class NetError extends Error {
  constructor(readonly code: NetErrorCode, message: string) { super(message); }
}

/** Lien direct entre deux appareils (messages typés et versionnés). */
export interface Link {
  /** Identifiant du point d'accès distant. */
  readonly remote: string;
  readonly open: boolean;
  send(m: NetMessage): void;
  onMessage(h: (m: NetMessage) => void): () => void;
  onClose(h: () => void): () => void;
  close(): void;
}

/** Point d'accès enregistré sous un identifiant. */
export interface Endpoint {
  readonly id: string;
  onLink(h: (l: Link) => void): () => void;
  connect(id: string, timeoutMs?: number): Promise<Link>;
  /** Perte définitive du point d'accès (serveur injoignable, identifiant perdu). */
  onLost(h: () => void): () => void;
  /** Retour au premier plan : reconnexion immédiate au serveur de rendez-vous si elle a été perdue. */
  wake?(): void;
  destroy(): void;
}

export interface Network {
  /** Enregistre l'identifiant. Échec : NetError 'taken' (déjà pris) ou 'unavailable' (réseau). */
  open(id: string, timeoutMs?: number): Promise<Endpoint>;
}

// ---------------------------------------------------------------------------------------------
// Aide commune : abonnés

class Hub<T> {
  private hs = new Set<(v: T) => void>();
  add(h: (v: T) => void): () => void { this.hs.add(h); return () => { this.hs.delete(h); }; }
  emit(v: T): void { for (const h of [...this.hs]) { try { h(v); } catch (e) { console.error(e); } } }
  clear(): void { this.hs.clear(); }
  get size(): number { return this.hs.size; }
}

// ---------------------------------------------------------------------------------------------
// Réseau en mémoire (tests, et deux onglets d'une même page de développement)

interface MemLink extends Link { _deliver(m: NetMessage): void; _closed(): void; other?: MemLink }

export interface MemoryNetwork extends Network {
  /** Coupe brutalement tous les liens d'un point d'accès (simulation de perte de connexion). */
  cut(id: string): void;
  /** Rend le réseau injoignable (true) ou le rétablit. */
  setDown(down: boolean): void;
  /**
   * Simule un appareil fermé brutalement (application tuée) : ses liens tombent mais le serveur garde son
   * identifiant `holdMs` ms (comme le serveur PeerJS) ; une réouverture pendant ce temps reçoit « taken ».
   */
  kill(id: string, holdMs: number): void;
  ids(): string[];
}

export function createMemoryNetwork(o: { latencyMs?: number } = {}): MemoryNetwork {
  const eps = new Map<string, { links: Set<MemLink>; onLink: Hub<Link>; onLost: Hub<void>; dead: boolean }>();
  let down = false;
  const later = (fn: () => void) => { if (o.latencyMs) setTimeout(fn, o.latencyMs); else queueMicrotask(fn); };

  function makeLink(remote: string, owner: string): MemLink {
    const msgs = new Hub<NetMessage>();
    const closes = new Hub<void>();
    let isOpen = true;
    const l: MemLink = {
      remote,
      get open() { return isOpen; },
      send(m) {
        if (!isOpen) return;
        // Passe par le codec, comme sur le vrai réseau.
        const text = encode(m);
        const other = l.other;
        later(() => { const d = decode(text); if (d && other?.open) other._deliver(d); });
      },
      onMessage: (h) => msgs.add(h),
      onClose: (h) => closes.add(h),
      close() {
        if (!isOpen) return;
        l._closed();
        const other = l.other;
        later(() => other?._closed());
      },
      _deliver(m) { if (isOpen) msgs.emit(m); },
      _closed() {
        if (!isOpen) return;
        isOpen = false;
        eps.get(owner)?.links.delete(l);
        closes.emit();
        msgs.clear();
      },
    };
    eps.get(owner)?.links.add(l);
    return l;
  }

  return {
    async open(id) {
      await Promise.resolve();
      if (down) throw new NetError('unavailable', 'Réseau injoignable.');
      if (eps.has(id)) throw new NetError('taken', 'Identifiant déjà pris.');
      const rec = { links: new Set<MemLink>(), onLink: new Hub<Link>(), onLost: new Hub<void>(), dead: false };
      eps.set(id, rec);
      const ep: Endpoint = {
        id,
        onLink: (h) => rec.onLink.add(h),
        onLost: (h) => rec.onLost.add(h),
        async connect(target) {
          await Promise.resolve();
          if (down) throw new NetError('unavailable', 'Réseau injoignable.');
          const t = eps.get(target);
          if (!t || t.dead || rec.dead) throw new NetError('unreachable', 'Appareil introuvable.');
          const mine = makeLink(target, id);
          const theirs = makeLink(id, target);
          mine.other = theirs; theirs.other = mine;
          later(() => t.onLink.emit(theirs));
          return mine;
        },
        destroy() {
          if (rec.dead) return;
          rec.dead = true;
          for (const l of [...rec.links]) l.close();
          eps.delete(id);
        },
      };
      return ep;
    },
    kill(id, holdMs) {
      const rec = eps.get(id);
      if (!rec) return;
      rec.dead = true;
      for (const l of [...rec.links]) { l._closed(); const other = l.other; later(() => other?._closed()); }
      setTimeout(() => { if (eps.get(id) === rec) eps.delete(id); }, holdMs);
    },
    cut(id) {
      const rec = eps.get(id);
      if (!rec) return;
      for (const l of [...rec.links]) { l._closed(); const other = l.other; later(() => other?._closed()); }
    },
    setDown(d) { down = d; },
    ids: () => [...eps.keys()],
  };
}

// ---------------------------------------------------------------------------------------------
// PeerJS (WebRTC)

type PeerCtor = typeof import('peerjs').Peer;
type PeerT = InstanceType<PeerCtor>;
type DataConn = ReturnType<PeerT['connect']>;

/** Serveur de signalisation : le serveur public de PeerJS, ou un serveur choisi au build (VITE_PEER_HOST…). */
function peerOptions(): Record<string, unknown> {
  const env = import.meta.env as Record<string, string | undefined>;
  const iceServers: RTCIceServer[] = [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
    // Relais TURN publics fournis par PeerJS (configuration par défaut de la bibliothèque, identifiants publics) :
    // ils dépannent quand la connexion directe échoue (certains réseaux 4G), sans garantie de disponibilité.
    { urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478'], username: 'peerjs', credential: 'peerjsp' },
  ];
  if (env['VITE_TURN_URL']) iceServers.push({ urls: env['VITE_TURN_URL'], username: env['VITE_TURN_USER'] ?? '', credential: env['VITE_TURN_PASS'] ?? '' });
  const o: Record<string, unknown> = { debug: 0, config: { iceServers } };
  if (env['VITE_PEER_HOST']) {
    o['host'] = env['VITE_PEER_HOST'];
    o['port'] = Number(env['VITE_PEER_PORT'] ?? 443);
    o['path'] = env['VITE_PEER_PATH'] ?? '/';
    o['secure'] = (env['VITE_PEER_SECURE'] ?? 'true') !== 'false';
    if (env['VITE_PEER_KEY']) o['key'] = env['VITE_PEER_KEY'];
  }
  return o;
}

function wrapConn(c: DataConn): Link {
  const msgs = new Hub<NetMessage>();
  const closes = new Hub<void>();
  let isOpen = c.open;
  let closed = false;
  const fireClose = () => {
    if (closed) return;
    closed = true;
    isOpen = false;
    closes.emit();
    msgs.clear();
  };
  c.on('open', () => { isOpen = true; });
  c.on('data', (d: unknown) => { const m = decode(d); if (m) msgs.emit(m); });
  c.on('close', fireClose);
  c.on('error', fireClose);
  // Détection rapide d'une coupure WebRTC (téléphone qui perd le réseau).
  const pc = (c as unknown as { peerConnection?: RTCPeerConnection }).peerConnection;
  // « disconnected » peut se rétablir seul (changement de réseau) : 5 s de grâce avant de fermer le lien.
  let grace: ReturnType<typeof setTimeout> | null = null;
  pc?.addEventListener?.('iceconnectionstatechange', () => {
    const st = pc.iceConnectionState;
    if (st === 'failed' || st === 'closed') { if (grace) clearTimeout(grace); fireClose(); return; }
    if (st === 'disconnected') {
      if (!grace) grace = setTimeout(() => { grace = null; if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') { try { c.close(); } catch { /* */ } fireClose(); } }, 5000);
    } else if (grace) { clearTimeout(grace); grace = null; }
  });
  return {
    remote: c.peer,
    get open() { return isOpen && !closed; },
    send(m) {
      if (!isOpen || closed) return;
      try { c.send(encode(m)); } catch { fireClose(); }
    },
    onMessage: (h) => msgs.add(h),
    onClose: (h) => closes.add(h),
    close() { try { c.close(); } catch { /* déjà fermé */ } fireClose(); },
  };
}

let peerCtor: Promise<PeerCtor> | null = null;
const loadPeer = (): Promise<PeerCtor> => (peerCtor ??= import('peerjs').then((m) => m.Peer));

export function createPeerNetwork(): Network {
  return {
    async open(id, timeoutMs = 12000) {
      const Peer = await loadPeer();
      const peer: PeerT = new Peer(id, peerOptions());
      const onLink = new Hub<Link>();
      const onLost = new Hub<void>();
      const pending = new Map<string, (e: NetError) => void>();
      let destroyed = false;
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => { reject(new NetError('timeout', 'Serveur de rendez-vous trop lent.')); try { peer.destroy(); } catch { /* */ } }, timeoutMs);
        peer.once('open', () => { clearTimeout(timer); resolve(); });
        peer.once('error', (err: { type?: string }) => {
          clearTimeout(timer);
          try { peer.destroy(); } catch { /* */ }
          reject(err.type === 'unavailable-id' ? new NetError('taken', 'Identifiant déjà pris.') : new NetError('unavailable', 'Serveur de rendez-vous injoignable.'));
        });
      });
      peer.on('error', (err: { type?: string; message?: string }) => {
        if (err.type === 'peer-unavailable') {
          // « Could not connect to peer <id> »
          for (const [target, fail] of pending) if (err.message?.includes(target)) { pending.delete(target); fail(new NetError('unreachable', 'Appareil introuvable.')); }
          return;
        }
        if (err.type === 'unavailable-id' || err.type === 'invalid-id' || err.type === 'browser-incompatible') {
          if (!destroyed) { destroyed = true; onLost.emit(); try { peer.destroy(); } catch { /* */ } }
        }
        // 'network', 'server-error', 'socket-error' : PeerJS signale aussi « disconnected », traité plus bas.
      });
      // Signalisation perdue (réseau coupé, page en arrière-plan) : on se reconnecte avec une attente croissante
      // (les liens directs déjà ouverts restent valables). Après 8 échecs, le point d'accès est déclaré perdu
      // (la présence en rouvre un, au besoin sous un nouvel identifiant).
      let retry = 0;
      let retryTimer: ReturnType<typeof setTimeout> | null = null;
      const lose = () => { if (!destroyed) { destroyed = true; onLost.emit(); try { peer.destroy(); } catch { /* */ } } };
      const reconnectNow = () => {
        if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
        if (destroyed || !peer.disconnected) return;
        if (peer.destroyed) { lose(); return; }
        try { peer.reconnect(); } catch { lose(); }
      };
      peer.on('disconnected', () => {
        if (destroyed) return;
        if (retry >= 8) { lose(); return; }
        const wait = Math.min(15000, 1000 * 2 ** retry++);
        if (retryTimer) clearTimeout(retryTimer);
        retryTimer = setTimeout(reconnectNow, wait);
      });
      peer.on('close', () => { if (!destroyed) lose(); });
      peer.on('open', () => { retry = 0; });
      peer.on('connection', (c: DataConn) => {
        const l = wrapConn(c);
        const deliver = () => onLink.emit(l);
        if (c.open) deliver(); else c.once('open', deliver);
      });
      return {
        id,
        onLink: (h) => onLink.add(h),
        onLost: (h) => onLost.add(h),
        wake() { if (!destroyed && peer.disconnected) { retry = 0; reconnectNow(); } },
        connect(target, ms = 10000) {
          return new Promise<Link>((resolve, reject) => {
            if (destroyed) { reject(new NetError('closed', 'Connexion fermée.')); return; }
            let done = false;
            const fail = (e: NetError) => { if (done) return; done = true; clearTimeout(timer); pending.delete(target); reject(e); try { c.close(); } catch { /* */ } };
            const c = peer.connect(target, { reliable: true, serialization: 'raw' });
            const timer = setTimeout(() => fail(new NetError('timeout', 'Pas de réponse.')), ms);
            pending.set(target, fail);
            c.once('open', () => { if (done) return; done = true; clearTimeout(timer); pending.delete(target); resolve(wrapConn(c)); });
            c.once('error', () => fail(new NetError('unreachable', 'Connexion impossible.')));
          });
        },
        destroy() {
          if (destroyed) return;
          destroyed = true;
          if (retryTimer) clearTimeout(retryTimer);
          try { peer.destroy(); } catch { /* */ }
        },
      };
    },
  };
}

/**
 * Ouvre `id` en réessayant quand il est encore « pris » : après une fermeture brutale de l'application, le
 * serveur de rendez-vous garde l'ancien identifiant quelques secondes (jusqu'à ~1 min). Renvoie null si l'id
 * reste pris après toutes les attentes ; les autres erreurs remontent.
 */
export async function openRetrying(net: Network, id: string, waitsMs: readonly number[] = [1500, 3000, 5000]): Promise<Endpoint | null> {
  for (let i = 0; ; i++) {
    try {
      return await net.open(id);
    } catch (e) {
      if (!(e instanceof NetError) || e.code !== 'taken') throw e;
      const w = waitsMs[i];
      if (w === undefined) return null;
      await new Promise((r) => setTimeout(r, w));
    }
  }
}

// ---------------------------------------------------------------------------------------------
// Réseau de l'application (remplaçable par les tests)

let appNet: Network | null = null;
export function getNetwork(): Network { return (appNet ??= createPeerNetwork()); }
export function setNetwork(n: Network): void { appNet = n; }
