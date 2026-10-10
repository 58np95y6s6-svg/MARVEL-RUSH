import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEngine } from '../../src/engine';
import type { Command, Engine, GameConfig } from '../../src/engine/types';
import { CoopGuest, CoopHost, classifyIncoming, compactState, remoteEngine, sendInvite, type LocalPlayer } from '../../src/net/coop';
import { createMemoryNetwork, openRetrying, type Endpoint, type Link } from '../../src/net/peer';
import { coopLayout } from '../../src/maps/layout';
import { boardSide, coopCellCenter } from '../../src/render/sides';
import { createPresence, lobbyId, personalId, presenceNamespace } from '../../src/net/presence';
import { PROTOCOL_VERSION, decode, encode, msg, sanitizeCommand } from '../../src/net/protocol';
import { MARVEL } from '../engine/helpers';

const flush = async (n = 10) => { for (let i = 0; i < n; i++) await Promise.resolve(); };

function player(id: string, name: string): LocalPlayer {
  return {
    hello: { profileId: id, name, avatar: 'spiderman', level: 3, soloChapters: [1], peer: `peer-${id}` },
    setup: { deck: MARVEL.slice(), levels: {}, talents: {} },
  };
}

afterEach(() => { vi.useRealTimers(); });

describe('protocole v3', () => {
  it('encode / decode : aller-retour, nombres arrondis, version et type vérifiés', () => {
    const m = msg({ t: 'ping', at: 1.234567 });
    expect(m.v).toBe(PROTOCOL_VERSION);
    const d = decode(encode(m));
    expect(d).toEqual({ v: PROTOCOL_VERSION, t: 'ping', at: 1.235 });
    expect(decode('{"v":2,"t":"ping","at":1}')).toBeNull();
    expect(decode('{"v":3,"t":"pirate"}')).toBeNull();
    expect(decode('pas du json')).toBeNull();
    expect(decode(null)).toBeNull();
  });

  it('les commandes de l’invitée sont forcées à son joueur et validées', () => {
    expect(sanitizeCommand({ type: 'summon', player: 'p1' }, 'p2')).toEqual({ type: 'summon', player: 'p2' });
    expect(sanitizeCommand({ type: 'merge', player: 'p1', from: 1, to: 2 }, 'p2')).toEqual({ type: 'merge', player: 'p2', from: 1, to: 2 });
    expect(sanitizeCommand({ type: 'merge', from: 1, to: 99 }, 'p2')).toBeNull();
    expect(sanitizeCommand({ type: 'pause', paused: true }, 'p2')).toBeNull();
    expect(sanitizeCommand({ type: 'gift', slot: 3 }, 'p2')).toEqual({ type: 'gift', player: 'p2', slot: 3 });
    expect(sanitizeCommand('summon', 'p2')).toBeNull();
  });

  it('l’instantané compact garde le rendu et se transmet', () => {
    const e = createEngine({ mode: 'coop', seed: 3, mapId: 'test', players: [{ id: 'p1', deck: MARVEL, levels: {}, talents: {} }, { id: 'p2', deck: MARVEL, levels: {}, talents: {} }] });
    e.apply({ type: 'summon', player: 'p2' });
    for (let i = 0; i < 60; i++) e.tick();
    const snap = compactState(e.state);
    const back = decode(encode(msg({ t: 'snapshot', tick: snap.tick, state: snap, events: [] })));
    expect(back?.t).toBe('snapshot');
    const st = (back as { state: typeof snap }).state;
    expect(st.players[1]!.grid.filter(Boolean).length).toBe(1);
    expect(st.enemies.length).toBe(e.state.enemies.length);
    expect(JSON.stringify(st).length).toBeLessThan(e.serialize().length);
  });
});

describe('présence', () => {
  it('espace de noms privé : dérivé de la clé, jamais la clé elle-même', async () => {
    const a = await presenceNamespace('cle-secrete');
    expect(a).toMatch(/^[0-9a-f]{10}$/);
    expect(a).toBe(await presenceNamespace('cle-secrete'));
    expect(a).not.toBe(await presenceNamespace('autre'));
    expect(lobbyId(a)).not.toContain('cle');
  });

  it('élection du rendez-vous, liste des présents, réélection quand le détenteur part', async () => {
    const net = createMemoryNetwork();
    const mk = (id: string, name: string, device: string) => createPresence({
      net, ns: 'ns', heartbeatMs: 50, dropAfterMs: 400, backoff: [5, 10],
      me: () => ({ profileId: id, device, name, avatar: 'spiderman', level: 2, status: 'accueil' }),
    });
    const a = mk('pa', 'Alice', 'd1');
    const b = mk('pb', 'Bob', 'd2');
    await a.start();
    await b.start();
    await vi.waitFor(() => expect(b.partner()?.name).toBe('Alice'));
    await vi.waitFor(() => expect(a.partner()?.name).toBe('Bob'));
    expect(a.isLobbyHolder()).toBe(true);
    expect(b.isLobbyHolder()).toBe(false);
    expect(a.partner()?.peer).toBe(personalId('ns', 'pb'));
    // Le détenteur s'en va : Bob reprend le rendez-vous, puis Alice revient et le retrouve.
    a.stop();
    await vi.waitFor(() => expect(b.isLobbyHolder()).toBe(true));
    expect(b.partner()).toBeNull();
    await a.start();
    await vi.waitFor(() => expect(a.partner()?.name).toBe('Bob'));
    // Pause (page cachée) puis reprise.
    a.pause();
    await vi.waitFor(() => expect(b.partner()).toBeNull());
    a.resume();
    await vi.waitFor(() => expect(b.partner()?.name).toBe('Alice'));
    a.stop(); b.stop();
  });

  it('même appareil : l’autre profil est ignoré ; réseau injoignable : « indisponible » sans planter', async () => {
    const net = createMemoryNetwork();
    const a = createPresence({ net, ns: 'n2', heartbeatMs: 50, backoff: [5, 10], me: () => ({ profileId: 'x', device: 'same', name: 'X', avatar: 'hulk', level: 1, status: 'accueil' }) });
    const b = createPresence({ net, ns: 'n2', heartbeatMs: 50, backoff: [5, 10], me: () => ({ profileId: 'y', device: 'same', name: 'Y', avatar: 'hulk', level: 1, status: 'accueil' }) });
    await a.start(); await b.start();
    await flush(50);
    await new Promise((r) => setTimeout(r, 60));
    expect(a.partner()).toBeNull();
    a.stop(); b.stop();
    const down = createMemoryNetwork();
    down.setDown(true);
    const c = createPresence({ net: down, ns: 'n3', me: () => ({ profileId: 'z', device: 'd', name: 'Z', avatar: 'hulk', level: 1, status: 'accueil' }) });
    await c.start();
    expect(c.state).toBe('unavailable');
    c.stop();
  });
});

async function pair(): Promise<{ net: ReturnType<typeof createMemoryNetwork>; hostEp: Endpoint; guestEp: Endpoint }> {
  const net = createMemoryNetwork();
  const hostEp = await net.open('host');
  const guestEp = await net.open('guest');
  return { net, hostEp, guestEp };
}

describe('invitations', () => {
  it('invitation acceptée : le lien sert ensuite au salon', async () => {
    const { hostEp, guestEp } = await pair();
    let got: Awaited<ReturnType<typeof classifyIncoming>> = null;
    guestEp.onLink((l) => { void classifyIncoming(l).then((r) => { got = r; }); });
    const inv = sendInvite(hostEp, 'guest', { from: player('h', 'Hôte').hello, mode: 'coop-infini' });
    await vi.waitFor(() => expect(got?.kind).toBe('invite'));
    const invite = (got as unknown as { invite: { from: { name: string }; mode: string; accept(): Link } }).invite;
    expect(invite.from.name).toBe('Hôte');
    expect(invite.mode).toBe('coop-infini');
    invite.accept();
    const r = await inv.result;
    expect('link' in r).toBe(true);
  });

  it('refus, expiration et annulation', async () => {
    const { hostEp, guestEp } = await pair();
    const seen: { refuse(): void; onCancel(h: () => void): void }[] = [];
    guestEp.onLink((l) => { void classifyIncoming(l).then((r) => { if (r?.kind === 'invite') seen.push(r.invite); }); });
    const a = sendInvite(hostEp, 'guest', { from: player('h', 'H').hello, mode: 'coop-infini' });
    await vi.waitFor(() => expect(seen.length).toBe(1));
    seen[0]!.refuse();
    expect(await a.result).toMatchObject({ refused: true });

    const b = sendInvite(hostEp, 'guest', { from: player('h', 'H').hello, mode: 'coop-infini', ttlMs: 30 });
    expect(await b.result).toMatchObject({ expired: true });

    const c = sendInvite(hostEp, 'guest', { from: player('h', 'H').hello, mode: 'coop-niveaux', levelId: 'cc1-n1' });
    await vi.waitFor(() => expect(seen.length).toBe(3));
    let cancelled = false;
    seen[2]!.onCancel(() => { cancelled = true; });
    c.cancel();
    expect(await c.result).toMatchObject({ cancelled: true });
    await vi.waitFor(() => expect(cancelled).toBe(true));

    const d = sendInvite(hostEp, 'personne', { from: player('h', 'H').hello, mode: 'coop-infini' });
    expect(await d.result).toMatchObject({ error: expect.stringMatching(/joindre/) });
  });
});

describe('session Coop : hôte et invitée en boucle locale', () => {
  async function lobby() {
    const { net, hostEp, guestEp } = await pair();
    const host = new CoopHost({ me: player('h', 'Hôte'), mode: 'coop-infini', mapId: 'test', hostPeer: 'host', seed: 11 });
    hostEp.onLink((l) => {
      void classifyIncoming(l).then((r) => {
        if (r?.kind === 'hello') host.attach(l, r.first);
        if (r?.kind === 'rejoin') host.rejoin(l, r.session, r.profileId);
      });
    });
    const link = await guestEp.connect('host');
    const guest = new CoopGuest({ me: player('g', 'Invitée'), link, endpoint: guestEp });
    await vi.waitFor(() => expect(guest.lobby?.players.length).toBe(2));
    return { net, host, guest, hostEp, guestEp };
  }

  it('salon : decks, « Prêt » des deux, départ avec la même configuration', async () => {
    const { host, guest } = await lobby();
    expect(guest.lobby?.players[0]!.name).toBe('Hôte');
    expect(host.lobby.players[1]!.name).toBe('Invitée');
    const starts: GameConfig[] = [];
    host.onStart((c) => starts.push(c));
    guest.onStart((c) => starts.push(c));
    guest.setDeck({ deck: ['hulk', 'thor', 'ironman', 'cap', 'widow'], levels: { hulk: 4 }, talents: {} });
    await vi.waitFor(() => expect(host.lobby.players[1]!.deck[0]).toBe('hulk'));
    host.setReady(true);
    guest.setReady(true);
    await vi.waitFor(() => expect(starts.length).toBe(2));
    expect(starts[0]).toEqual(starts[1]);
    expect(starts[0]!.mode).toBe('coop');
    expect(starts[0]!.players[1]).toMatchObject({ id: 'p2', deck: ['hulk', 'thor', 'ironman', 'cap', 'widow'], levels: { hulk: 4 } });
    host.close(); guest.close();
  });

  it('partie : les commandes de l’invitée sont appliquées comme en local (déterminisme)', async () => {
    const { host, guest } = await lobby();
    let cfg: GameConfig | null = null;
    host.onStart((c) => { cfg = c; });
    host.setReady(true); guest.setReady(true);
    await vi.waitFor(() => expect(cfg).not.toBeNull());
    const engine = createEngine(cfg!);
    host.bindEngine(engine);
    const ref: Engine = createEngine(cfg!);
    // Script de commandes des deux joueurs, appliqué au même tick côté hôte et sur la référence locale.
    const script: [number, Command][] = [
      [1, { type: 'summon', player: 'p1' }], [1, { type: 'summon', player: 'p2' }], [5, { type: 'summon', player: 'p2' }],
      [12, { type: 'manaUpgrade', player: 'p2' }],
    ];
    const snaps: ReturnType<typeof guest.drain> = [];
    const view = remoteEngine(cfg!, compactState(engine.state), (c) => guest.command(c));
    for (let t = 0; t < 120; t++) {
      if (t === 20) script.push([20, { type: 'gift', player: 'p2', slot: engine.state.players[1]!.grid.findIndex(Boolean) }]);
      for (const [at, c] of script) if (at === t) {
        if ('player' in c && c.player === 'p2') view.apply(c); else engine.apply(c);
        ref.apply(c);
      }
      await flush(20); // la commande traverse le réseau avant le tick
      engine.tick();
      host.afterTick(engine.drainEvents());
      ref.tick(); ref.drainEvents();
      snaps.push(...guest.drain());
    }
    expect(engine.serialize()).toBe(ref.serialize());
    await flush(20);
    snaps.push(...guest.drain());
    expect(snaps.length).toBe(60);
    const last = snaps[snaps.length - 1]!;
    expect(last.state.tick).toBe(engine.state.tick);
    expect(last.state.players[1]!.manaLevel).toBe(1);
    expect(snaps.flatMap((s) => s.events).some((e) => e.type === 'gift')).toBe(true);
    // Une commande pour p1 envoyée par l'invitée est ramenée à p2.
    guest.command({ type: 'summon', player: 'p1' });
    await flush(20);
    const before = engine.state.players[0]!.summonCost;
    engine.tick();
    expect(engine.state.players[0]!.summonCost).toBe(before);
    host.close(); guest.close();
  });

  it('coupure : l’hôte attend, l’invitée revient dans les 30 s et reprend la partie', async () => {
    const { net, host, guest } = await lobby();
    let cfg: GameConfig | null = null;
    host.onStart((c) => { cfg = c; });
    host.setReady(true); guest.setReady(true);
    await vi.waitFor(() => expect(cfg).not.toBeNull());
    const engine = createEngine(cfg!);
    host.bindEngine(engine);
    const hostPeer: string[] = [], guestPeer: string[] = [];
    host.onPeer((s) => hostPeer.push(s));
    guest.onPeer((s) => guestPeer.push(s));
    net.cut('guest');
    await vi.waitFor(() => expect(hostPeer).toContain('lost'));
    await vi.waitFor(() => expect(guestPeer).toEqual(['lost', 'back']));
    await vi.waitFor(() => expect(hostPeer).toEqual(['lost', 'back']));
    engine.tick(); engine.tick();
    host.afterTick(engine.drainEvents());
    await vi.waitFor(() => expect(guest.drain().length).toBeGreaterThan(0));
    host.finish({ outcome: 'defaite', wave: 7, mode: 'coop-infini', livesLeft: 0, bossKills: [] });
    await vi.waitFor(() => expect(guest.result?.wave).toBe(7));
    host.close(); guest.close();
  });
});

// ---------------------------------------------------------------------------------------------
// Retours sur deux téléphones (octobre 2026) : reconnexion, présence, plateau de l'invitée.

describe('reconnexion et présence robustes', () => {
  const info = (id: string, name: string, device: string) => () => ({ profileId: id, device, name, avatar: 'spiderman' as const, level: 2, status: 'accueil' as const });

  it('application rouverte : l’ancien identifiant encore pris, on réessaie puis on le retrouve', async () => {
    const net = createMemoryNetwork();
    const old = await net.open('mr-ns-pa');
    net.kill(old.id, 60); // le serveur garde l'identifiant 60 ms
    const ep = await openRetrying(net, 'mr-ns-pa', [30, 30, 30]);
    expect(ep?.id).toBe('mr-ns-pa');
    // Toujours pris après toutes les attentes : null (la présence prend alors un identifiant de secours).
    await net.open('mr-ns-pb');
    expect(await openRetrying(net, 'mr-ns-pb', [5])).toBeNull();
  });

  it('les deux appareils redémarrent : ils se retrouvent (identifiants retenus, rendez-vous réélu)', async () => {
    const net = createMemoryNetwork();
    const opts = { net, ns: 'rs', heartbeatMs: 40, dropAfterMs: 200, recheckMs: 80, backoff: [5, 10] as [number, number], openWaits: [40, 40, 40] };
    const a = createPresence({ ...opts, me: info('pa', 'Alice', 'd1'), knownPeers: () => [personalId('rs', 'pb')] });
    const b = createPresence({ ...opts, me: info('pb', 'Bob', 'd2'), knownPeers: () => [personalId('rs', 'pa')] });
    await a.start(); await b.start();
    await vi.waitFor(() => expect(a.partner()?.name).toBe('Bob'));
    // Les deux applications sont tuées : le serveur garde leurs identifiants (et le rendez-vous) un moment.
    for (const id of net.ids()) net.kill(id, 90);
    a.stop(); b.stop();
    const a2 = createPresence({ ...opts, me: info('pa', 'Alice', 'd1'), knownPeers: () => [personalId('rs', 'pb')] });
    const b2 = createPresence({ ...opts, me: info('pb', 'Bob', 'd2'), knownPeers: () => [personalId('rs', 'pa')] });
    void a2.start(); void b2.start();
    await vi.waitFor(() => { expect(a2.partner()?.name).toBe('Bob'); expect(b2.partner()?.name).toBe('Alice'); }, { timeout: 3000 });
    expect(a2.peerId).toBe(personalId('rs', 'pa'));
    expect(['salon', 'direct']).toContain(a2.diag());
    a2.stop(); b2.stop();
  });

  it('rendez-vous fantôme (détenteur muet) : liens directs, chacune voit l’autre', async () => {
    const net = createMemoryNetwork();
    await net.open(lobbyId('zs')); // ancien onglet figé : tient le rendez-vous sans jamais répondre
    const opts = { net, ns: 'zs', heartbeatMs: 40, dropAfterMs: 200, recheckMs: 80, backoff: [5, 10] as [number, number], openWaits: [] };
    const a = createPresence({ ...opts, me: info('pa', 'Alice', 'd1'), knownPeers: () => [personalId('zs', 'pb')] });
    const b = createPresence({ ...opts, me: info('pb', 'Bob', 'd2'), knownPeers: () => [personalId('zs', 'pa')] });
    for (const p of [a, b]) p.onLink((l) => { void classifyIncoming(l).then((r) => { if (r?.kind === 'presence') p.adopt(l, r.first); }); });
    await a.start(); await b.start();
    await vi.waitFor(() => { expect(a.partner()?.name).toBe('Bob'); expect(b.partner()?.name).toBe('Alice'); }, { timeout: 3000 });
    expect(a.diag()).toBe('direct');
    a.stop(); b.stop();
  });

  it('deux rendez-vous : le plus petit identifiant cède le sien ; « Actualiser » refait tout', async () => {
    const net = createMemoryNetwork();
    const a = createPresence({ net, ns: 'ys', heartbeatMs: 40, dropAfterMs: 400, backoff: [5, 10], openWaits: [], me: info('pa', 'Alice', 'd1') });
    a.onLink((l) => { void classifyIncoming(l).then((r) => { if (r?.kind === 'presence') a.adopt(l, r.first); }); });
    await a.start();
    await vi.waitFor(() => expect(a.isLobbyHolder()).toBe(true));
    let yielded = false;
    a.onChange(() => { if (!a.isLobbyHolder()) yielded = true; });
    // Un autre appareil qui tient lui aussi « un » rendez-vous (autre état du serveur) se présente en direct.
    const other = await net.open('mr-ys-zz');
    const l = await other.connect(a.peerId!);
    l.send(msg({ t: 'presence', who: { profileId: 'pz', device: 'd9', name: 'Zoé', avatar: 'hulk', level: 1, status: 'accueil', peer: 'mr-ys-zz', lobby: true } }));
    await vi.waitFor(() => expect(yielded).toBe(true));
    expect(a.partner()?.name).toBe('Zoé');
    await a.refresh();
    await vi.waitFor(() => expect(a.state).toBe('online'));
    a.stop();
  });
});

describe('partie : l’invitée rouvre l’application, unités sur le bon plateau', () => {
  async function game() {
    const net = createMemoryNetwork();
    const hostEp = await net.open('host');
    const guestEp = await net.open('guest');
    const host = new CoopHost({ me: player('h', 'Hôte'), mode: 'coop-infini', mapId: 'toits-new-york', hostPeer: 'host', seed: 5 });
    hostEp.onLink((l) => {
      void classifyIncoming(l).then((r) => {
        if (r?.kind === 'hello') host.attach(l, r.first);
        if (r?.kind === 'rejoin' && !host.rejoin(l, r.session, r.profileId)) { l.send(msg({ t: 'bye', reason: 'session' })); setTimeout(() => l.close(), 30); }
      });
    });
    const guest = new CoopGuest({ me: player('g', 'Invitée'), link: await guestEp.connect('host'), endpoint: guestEp });
    await vi.waitFor(() => expect(guest.lobby?.players.length).toBe(2));
    let cfg: GameConfig | null = null;
    host.onStart((c) => { cfg = c; });
    host.setReady(true); guest.setReady(true);
    await vi.waitFor(() => expect(cfg).not.toBeNull());
    await vi.waitFor(() => expect(guest.gameConfig).not.toBeNull());
    const engine = createEngine(cfg!);
    host.bindEngine(engine);
    return { net, host, guest, guestEp, engine, cfg: cfg! };
  }

  it('l’invitée invoque : l’unité est dans SA grille, en bas chez elle et en haut chez l’hôte', async () => {
    const { host, guest, engine, cfg } = await game();
    const view = remoteEngine(cfg, compactState(engine.state), (c) => guest.command(c));
    view.apply({ type: 'summon', player: 'p2' });
    await flush(20);
    for (let i = 0; i < 2; i++) { engine.tick(); host.afterTick(engine.drainEvents()); }
    await flush(20);
    const snaps = guest.drain();
    view.setState(snaps[snaps.length - 1]!.state);
    expect(engine.state.players[0]!.grid.filter(Boolean)).toHaveLength(0);
    expect(engine.state.players[1]!.grid.filter(Boolean)).toHaveLength(1);
    expect(view.state.players[1]!.grid.filter(Boolean)).toHaveLength(1);
    const slot = view.state.players[1]!.grid.findIndex(Boolean);
    const ev = snaps.flatMap((s) => s.events).find((e) => e.type === 'summon');
    expect(ev).toMatchObject({ player: 'p2', slot });
    const L = coopLayout('u');
    // Chez l'invitée (p2) : son plateau, en bas.
    expect(boardSide('p2', 'p2')).toBe('self');
    const mine = coopCellCenter(L, boardSide('p2', 'p2'), slot);
    expect(mine.y).toBeGreaterThan(L.self.grid.y);
    // Chez l'hôte (p1) : le plateau de la partenaire, en haut.
    expect(boardSide('p1', 'p2')).toBe('partner');
    const theirs = coopCellCenter(L, boardSide('p1', 'p2'), slot);
    expect(theirs.y).toBeLessThan(L.partner.grid.y + L.partner.grid.h);
    host.close(); guest.close();
  });

  it('application de l’invitée tuée puis rouverte : elle rejoint la partie en cours (session mémorisée)', async () => {
    const { net, host, guest, guestEp, engine } = await game();
    const peers: string[] = [];
    host.onPeer((s) => peers.push(s));
    const session = guest.sessionId!;
    net.kill(guestEp.id, 50);
    guest.close();
    await vi.waitFor(() => expect(peers).toContain('lost'));
    // Réouverture : nouveau point d'accès (l'ancien identifiant peut encore être pris), puis « rejoin ».
    const ep2 = (await openRetrying(net, 'guest', [30, 30, 30]))!;
    const back = new CoopGuest({ me: player('g', 'Invitée'), link: await ep2.connect('host'), endpoint: ep2, rejoin: { session, hostPeer: 'host' } });
    const started: GameConfig[] = [];
    back.onStart((c) => started.push(c));
    await vi.waitFor(() => expect(started).toHaveLength(1));
    expect(back.lobby?.players.map((p) => p.id)).toEqual(['p1', 'p2']);
    await vi.waitFor(() => expect(peers).toContain('back'));
    engine.tick(); engine.tick();
    host.afterTick(engine.drainEvents());
    await vi.waitFor(() => expect(back.drain().length).toBeGreaterThan(0));
    // Mauvaise session (partie terminée côté hôte) : refusée.
    const ep3 = await net.open('guest3');
    const stale = new CoopGuest({ me: player('g', 'Invitée'), link: await ep3.connect('host'), endpoint: null, rejoin: { session: 'AUTRE', hostPeer: 'host' } });
    let refused = '';
    stale.onBye((r) => { refused = r; });
    await vi.waitFor(() => expect(refused).toBe('session'));
    host.close(); back.close(); stale.close();
  });

  it('reprise d’une partie sauvegardée : même configuration, moteur repris à la vague sauvegardée', async () => {
    const { host, guest, engine, cfg } = await game();
    for (let i = 0; i < 20 * 40; i++) engine.tick();
    const save = { v: 1 as const, at: 0, mode: 'coop-infini' as const, mapId: cfg.mapId, wave: engine.state.wave, partnerProfileId: 'g', partnerName: 'Invitée', config: cfg, engine: engine.serialize() };
    host.close(); guest.close();
    const net = createMemoryNetwork();
    const hEp = await net.open('h2');
    const gEp = await net.open('g2');
    const h2 = new CoopHost({ me: player('h', 'Hôte'), mode: 'coop-infini', mapId: cfg.mapId, hostPeer: 'h2', resume: save });
    hEp.onLink((l) => { void classifyIncoming(l).then((r) => { if (r?.kind === 'hello') h2.attach(l, r.first); }); });
    const g2 = new CoopGuest({ me: player('g', 'Invitée'), link: await gEp.connect('h2'), endpoint: gEp });
    await vi.waitFor(() => expect(g2.lobby?.resumeWave).toBe(save.wave));
    let c2: GameConfig | null = null;
    h2.onStart((c) => { c2 = c; });
    h2.setReady(true); g2.setReady(true);
    await vi.waitFor(() => expect(c2).not.toBeNull());
    expect(c2!.seed).toBe(cfg.seed);
    const resumed = createEngine(c2!, h2.savedEngine);
    expect(resumed.state.wave).toBe(save.wave);
    h2.close(); g2.close();
  });
});
