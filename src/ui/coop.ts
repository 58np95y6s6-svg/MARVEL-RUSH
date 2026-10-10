// Écrans « Jouer à deux » (§5.2, §5.4, §5.5) :
//   #coop                 choix du mode (Coop Infini ou Coop Niveaux), « Inviter <pseudo> », autres options (code)
//   #coop/rejoindre/<code> arrivée par le lien d'invitation (secours)
//   #coop/salon           salon : decks, « Prêt », partenaire
//   #coop/combat          combat à deux (plein écran), puis récompenses de chacun
import './coop.css';
import { STARTER_DECKS, UNITS } from '../data/units';
import type { UnitId } from '../data/types';
import type { EngineEvent, EngineState, GameConfig } from '../engine/types';
import { createEngine } from '../engine';
import { createBattleTracker, type BattleStats } from '../campaign/tracker';
import {
  COOP_LEVELS, coopChapter, coopChapterLevels, coopChapterOpen, coopConstraintLabel, coopLevelConfig, coopLevelOpen, coopLevelTitle,
  evaluateCoopStars, getCoopLevel, type CoopLevel,
} from '../campaign/coopLevels';
import { CHAPTERS } from '../campaign/levels';
import { deckSlotsUnlocked } from '../meta/economy';
import { COOP_TIERS, applyCoopInfiniteGame, applyCoopLevelGame, nextCoopTier, soloChaptersDone } from '../meta/coop';
import type { InfiniteResult } from '../meta/economy';
import { emitMeta } from '../meta/events';
import { activeDeck, getProfile, onProfileChange, updateProfile, type Profile } from '../meta/profile';
import { CoopGuest, CoopHost, remoteEngine, type IncomingInvite, type InviteHandle } from '../net/coop';
import { NetError } from '../net/peer';
import type { CoopMode, CoopResult, LobbyPlayer, PresenceInfo } from '../net/protocol';
import { coopService, deckSetup, type Session } from '../net/service';
import { balanceOf, chestMiniSvg, playChests } from './chestOpening';
import { confirmBox, el, esc, icon, portraitUrl, toast, tokenUrl, type IconName } from './kit';
import { runTotals, totalsHtml } from './rewards';

type Go = (hash: string) => void;

const STATUS_LABEL: Record<string, string> = {
  accueil: 'à l’accueil', 'en partie': 'en partie', tirages: 'dans les tirages', collection: 'dans sa collection',
  campagne: 'en campagne', coop: 'sur l’écran Coop', ailleurs: 'en ligne',
};

/** Choix mémorisé sur l'écran Coop (mode et niveau). */
const pick: { mode: CoopMode; levelId: string; chapter: number } = { mode: 'coop-infini', levelId: 'cc1-n1', chapter: 1 };

function partnerLine(pr: PresenceInfo | null, p: Profile | null): { name: string; avatar: UnitId; online: boolean; text: string } {
  if (pr) return { name: pr.name, avatar: pr.avatar, online: true, text: `En ligne · ${STATUS_LABEL[pr.status] ?? 'en ligne'}` };
  const st = coopService.state;
  const last = p?.partner;
  const text = st === 'unavailable' ? 'Présence indisponible' : st === 'connecting' || st === 'off' ? 'Recherche…' : 'Hors ligne';
  return { name: last?.name ?? 'Ta partenaire', avatar: last?.avatar ?? 'hulk', online: false, text };
}

// ---------------------------------------------------------------------------------------------
// Pastille de présence (accueil)

export function presenceBadgeHtml(): string {
  const l = partnerLine(coopService.partner(), getProfile());
  return `<span class="du-badge${l.online ? ' on' : ''}"><img alt="" src="${portraitUrl(l.avatar)}"><i></i></span><span class="du-badge-t"><b>${esc(l.name)}</b><small>${esc(l.text)}</small></span>`;
}

// ---------------------------------------------------------------------------------------------
// Invitation reçue (fenêtre globale, par-dessus n'importe quel écran)

let popupOpen: HTMLElement | null = null;

export function installInvitePopup(go: Go): () => void {
  const show = (inv: IncomingInvite) => {
    popupOpen?.remove();
    const ttl = Math.max(5000, Math.min(60000, inv.expiresAt - Date.now()));
    const end = Date.now() + ttl;
    const lvl = inv.levelId ? getCoopLevel(inv.levelId) : undefined;
    const box = el('div', 'du-invite');
    box.innerHTML = `<div class="du-invite-card" role="dialog" aria-label="Invitation">
      <img alt="" src="${portraitUrl(inv.from.avatar, 1)}">
      <p><b>${esc(inv.from.name)}</b> t’invite à jouer en <b>${inv.mode === 'coop-infini' ? 'Coop Infini' : `Coop Niveaux${lvl ? ` (${esc(coopLevelTitle(lvl))})` : ''}`}</b></p>
      <div class="du-invite-bar"><i></i></div>
      <div class="du-invite-row"><button class="mr-btn grey" data-a="no">Refuser</button><button class="mr-btn green" data-a="yes">Accepter</button></div>
    </div>`;
    document.body.appendChild(box);
    popupOpen = box;
    if ((navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive) navigator.vibrate?.([120, 80, 120]);
    const bar = box.querySelector<HTMLElement>('.du-invite-bar i')!;
    const t = window.setInterval(() => {
      const left = end - Date.now();
      bar.style.width = `${Math.max(0, (left / ttl) * 100)}%`;
      if (left <= 0) { close(); toast('Invitation expirée.', 'warn'); inv.refuse('expirée'); }
    }, 250);
    const offCancel = inv.onCancel(() => { if (box.isConnected) { close(); toast(`${inv.from.name} a annulé l’invitation.`, 'warn'); } });
    function close(): void { clearInterval(t); offCancel(); box.remove(); if (popupOpen === box) popupOpen = null; }
    box.addEventListener('click', (e) => {
      const a = (e.target as HTMLElement).closest<HTMLElement>('[data-a]')?.dataset['a'];
      if (a === 'no') { close(); inv.refuse(); }
      if (a === 'yes') {
        close();
        coopService.accept(inv);
        go('#coop/salon');
      }
    });
  };
  const off = coopService.onInvite(show);
  const pending = coopService.takePendingInvite();
  if (pending) show(pending);
  return off;
}

// ---------------------------------------------------------------------------------------------
// Écran Coop

export function mountCoop(host: HTMLElement, o: { go: Go; overlay: HTMLElement; joinCode?: string }): () => void {
  const wrap = el('div', 'du scroll');
  host.appendChild(wrap);
  emitMeta('screen', { route: 'coop' });
  let invite: InviteHandle | null = null;
  let inviteEnd = 0;
  let inviteTimer = 0;
  let roomInfo: { code: string; url: string } | null = null;
  let optionsOpen = !!o.joinCode;
  let busy = false;
  let destroyed = false;

  function chapterState(p: Profile | null, partner: PresenceInfo | null): { mine: number[]; theirs: number[] } {
    // Chapitres Solo de la partenaire : annoncés par sa présence (ou mémorisés la dernière fois qu'on l'a vue).
    const mine = soloChaptersDone(p);
    return { mine, theirs: partner?.chapters ?? p?.partner?.chapters ?? [] };
  }

  function render(): void {
    if (destroyed) return;
    const p = getProfile();
    const pr = coopService.partner();
    const l = partnerLine(pr, p);
    const lvl = getCoopLevel(pick.levelId) ?? COOP_LEVELS[0]!;
    const { mine, theirs } = chapterState(p, pr);
    const best = p?.coopBest ?? 0;
    const next = nextCoopTier(best);
    const inviting = !!invite;
    const left = Math.max(0, Math.ceil((inviteEnd - Date.now()) / 1000));
    const chOpen = (n: number) => coopChapterOpen(n, mine, theirs);
    wrap.innerHTML = `
      <div class="du-head"><button class="qs-back du-back" data-a="back">‹ Accueil</button><h2 class="scr-title">Jouer à deux</h2></div>
      <section class="du-partner${l.online ? ' on' : ''}">
        <span class="du-av"><img alt="" src="${portraitUrl(l.avatar)}"><i></i></span>
        <span class="du-pt"><b>${esc(l.name)}</b><small>${esc(l.text)}</small></span>
      </section>
      <div class="rr-seg du-seg" role="tablist">
        <button role="tab" data-mode="coop-infini" aria-selected="${pick.mode === 'coop-infini'}">Coop Infini</button>
        <button role="tab" data-mode="coop-niveaux" aria-selected="${pick.mode === 'coop-niveaux'}">Coop Niveaux</button>
      </div>
      ${pick.mode === 'coop-infini' ? `
      <section class="du-panel">
        <p class="du-rec">${icon('record')} Record du duo : <b>${best} vague${best > 1 ? 's' : ''}</b></p>
        <ol class="du-tiers">${COOP_TIERS.map((t) => `<li class="${best >= t.wave ? 'got' : ''}${t.wave === next.wave ? ' next' : ''}">${chestMiniSvg(t.chest)}<b>${t.wave}</b></li>`).join('')}</ol>
        <p class="du-note">Des coffres pour chacun selon le palier atteint (une fois par jour), +20 or et +1 gemme par vague. Épique garanti à 30, Légendaire à 50.</p>
      </section>` : `
      <section class="du-panel">
        <div class="du-chapters">${CHAPTERS.map((c) => `<button data-ch="${c.n}" class="${c.n === pick.chapter ? 'on' : ''}${chOpen(c.n) ? '' : ' locked'}">${chOpen(c.n) ? c.n : icon('lock')}</button>`).join('')}</div>
        ${chOpen(pick.chapter) ? `<div class="du-levels">${coopChapterLevels(pick.chapter).map((x) => {
          const r = p?.coopLevels?.[x.id];
          const open = coopLevelOpen(x, p?.coopLevels, mine, theirs);
          const stars = r?.stars ?? [false, false, false];
          return `<button data-lvl="${x.id}" class="${x.id === lvl.id ? 'on' : ''}${open ? '' : ' locked'}${x.boss ? ' boss' : ''}"><b>${open ? x.n : '🔒'}</b><span>${stars.map((s) => (s ? '★' : '☆')).join('')}</span></button>`;
        }).join('')}</div>
        <p class="du-lvl"><b>${esc(coopLevelTitle(lvl))}</b><small>${lvl.waves} vagues · ★★★ ${esc(coopConstraintLabel(lvl.bonus, lvl))}</small></p>`
        : `<p class="du-note">Le chapitre ${pick.chapter} s’ouvre quand vous avez toutes les deux gagné le niveau 10 du chapitre ${pick.chapter} en Solo.<br>Toi : ${mine.includes(pick.chapter) ? '✓' : 'pas encore'} · ${esc(l.name)} : ${theirs.includes(pick.chapter) ? '✓' : 'pas encore'}</p>`}
      </section>`}
      ${inviting
        ? `<div class="du-inviting"><span class="co-spin"></span><span>Invitation envoyée à ${esc(l.name)}… <b>${left} s</b></span><button class="mr-btn grey" data-a="cancel">Annuler</button></div>`
        : `<button class="mr-btn green du-invite-btn${l.online ? '' : ' off'}" data-a="invite"><span class="t">Inviter ${esc(l.name)}</span><small>${l.online ? 'L’invitation arrive tout de suite' : 'Le jeu doit être ouvert de son côté'}</small></button>`}
      <details class="du-more"${optionsOpen ? ' open' : ''}>
        <summary>Autres options</summary>
        ${roomInfo ? `
          <div class="du-room"><small>Code de la partie</small><b class="du-code">${esc(roomInfo.code)}</b>
            <div class="du-row"><button class="mr-btn blue" data-a="share">Partager</button><button class="mr-btn" data-a="copy">Copier le lien</button></div>
            <small class="du-wait"><span class="co-spin"></span> En attente de ta partenaire…</small>
            <button class="du-link" data-a="room-close">Fermer le salon</button></div>`
        : `<button class="mr-btn du-wide" data-a="room">Créer une partie avec un code</button>`}
        <form class="du-join"><input name="code" maxlength="6" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Code (6 caractères)" value="${esc(o.joinCode ?? '')}"><button class="mr-btn yellow">Rejoindre</button></form>
      </details>
      ${p?.coopHistory?.length ? `<section class="du-hist"><h3>Dernières parties à deux</h3><ul>${p.coopHistory.slice(0, 4).map((h) => `<li><span>${h.mode === 'coop-infini' ? 'Infini' : esc(getCoopLevel(h.levelId ?? '')?.id.replace('cc', 'Niveau ').replace('-n', '-') ?? 'Niveau')}</span><b>${h.won ? 'Victoire' : `Vague ${h.wave}`}</b><small>avec ${esc(h.partner)}</small></li>`).join('')}</ul></section>` : ''}`;
  }

  function stopInvite(): void { clearInterval(inviteTimer); invite = null; }

  wrap.addEventListener('toggle', (e) => { if ((e.target as HTMLElement).matches('details')) optionsOpen = (e.target as HTMLDetailsElement).open; }, true);
  wrap.addEventListener('submit', (e) => {
    e.preventDefault();
    const code = (wrap.querySelector<HTMLInputElement>('.du-join input')?.value ?? '').trim();
    void join(code);
  });
  async function join(code: string): Promise<void> {
    if (busy) return;
    busy = true;
    try {
      toast('Connexion…');
      await coopService.joinRoom(code);
      o.go('#coop/salon');
    } catch (err) {
      toast(err instanceof NetError && err.code === 'unreachable' ? 'Impossible de joindre ta partenaire… Vérifie le code.' : 'Impossible de joindre ta partenaire… Réessaie dans un instant.', 'warn');
    } finally { busy = false; }
  }

  wrap.addEventListener('click', async (e) => {
    const t = e.target as HTMLElement;
    const mode = t.closest<HTMLElement>('[data-mode]')?.dataset['mode'] as CoopMode | undefined;
    if (mode) { pick.mode = mode; render(); return; }
    const ch = t.closest<HTMLElement>('[data-ch]')?.dataset['ch'];
    if (ch) { pick.chapter = Number(ch); const first = coopChapterLevels(pick.chapter)[0]; if (first) pick.levelId = first.id; render(); return; }
    const lv = t.closest<HTMLElement>('[data-lvl]');
    if (lv) { if (lv.classList.contains('locked')) toast('Gagnez d’abord le niveau précédent.', 'warn'); else { pick.levelId = lv.dataset['lvl']!; render(); } return; }
    const a = t.closest<HTMLElement>('[data-a]')?.dataset['a'];
    if (!a) return;
    if (a === 'back') o.go('');
    else if (a === 'invite') {
      const partner = coopService.partner();
      const l0 = partnerLine(partner, getProfile());
      if (!partner) { toast(coopService.state === 'unavailable' ? 'Présence indisponible : utilise un code (Autres options).' : `${l0.name} n’est pas en ligne : le jeu doit être ouvert de son côté.`, 'warn'); return; }
      const lvl = pick.mode === 'coop-niveaux' ? getCoopLevel(pick.levelId) : undefined;
      if (pick.mode === 'coop-niveaux') {
        const { mine, theirs } = chapterState(getProfile(), partner);
        if (!lvl || !coopLevelOpen(lvl, getProfile()?.coopLevels, mine, theirs)) { toast('Choisis un niveau ouvert pour vous deux.', 'warn'); return; }
      }
      const h = coopService.invite(pick.mode, lvl?.id, lvl?.map ?? 'toits-new-york');
      if (!h) return;
      invite = h;
      inviteEnd = Date.now() + 60000;
      inviteTimer = window.setInterval(() => { if (invite) render(); }, 1000);
      render();
      const r = await h.result;
      if (invite !== h) return;
      stopInvite();
      if ('link' in r) { o.go('#coop/salon'); return; }
      if ('refused' in r) toast(`${partner.name} a refusé l’invitation.`, 'warn');
      else if ('expired' in r) toast(`Pas de réponse de ${partner.name}.`, 'warn');
      else if ('error' in r) toast(r.error, 'warn');
      render();
    } else if (a === 'cancel') { invite?.cancel(); stopInvite(); render(); }
    else if (a === 'room') {
      if (busy) return;
      busy = true;
      try {
        const lvl = pick.mode === 'coop-niveaux' ? getCoopLevel(pick.levelId) : undefined;
        roomInfo = await coopService.createRoom(pick.mode, lvl?.id, lvl?.map ?? 'toits-new-york');
        optionsOpen = true;
        render();
      } catch { toast('Impossible de créer la partie : connexion indisponible.', 'warn'); } finally { busy = false; }
    } else if (a === 'room-close') { coopService.leave(); roomInfo = null; render(); }
    else if (a === 'share' && roomInfo) {
      const text = `Rejoins-moi dans Marvel Rush ! Code : ${roomInfo.code}`;
      try {
        if (navigator.share) await navigator.share({ title: 'Marvel Rush à deux', text, url: roomInfo.url });
        else { await navigator.clipboard.writeText(roomInfo.url); toast('Lien copié !'); }
      } catch { /* partage annulé */ }
    } else if (a === 'copy' && roomInfo) {
      try { await navigator.clipboard.writeText(roomInfo.url); toast('Lien copié !'); } catch { toast(`Code : ${roomInfo.code}`); }
    }
  });

  const offs = [
    coopService.onChange(() => { if (!invite) render(); }),
    onProfileChange(() => render()),
    coopService.onSession((s) => {
      // Arrivée de la partenaire dans le salon par code : on passe au salon.
      if (s instanceof CoopHost) s.onPeer((st) => { if (st === 'connected' && !destroyed) o.go('#coop/salon'); });
    }),
  ];
  const cur = coopService.session;
  if (cur instanceof CoopHost && !cur.connected && coopService.roomCode) {
    roomInfo = { code: coopService.roomCode, url: '' };
    cur.onPeer((st) => { if (st === 'connected' && !destroyed) o.go('#coop/salon'); });
  }
  render();
  if (o.joinCode && o.joinCode.length === 6) void join(o.joinCode);
  return () => { destroyed = true; stopInvite(); for (const f of offs) f(); wrap.remove(); };
}

// ---------------------------------------------------------------------------------------------
// Salon

function deckRow(deck: UnitId[]): string {
  return `<span class="du-deck">${deck.map((u) => `<img alt="${esc(UNITS[u]?.name ?? u)}" src="${tokenUrl(u)}">`).join('')}</span>`;
}

function modeLabel(mode: CoopMode, levelId?: string): string {
  if (mode === 'coop-infini') return 'Coop Infini';
  const l = levelId ? getCoopLevel(levelId) : undefined;
  return l ? coopLevelTitle(l) : 'Coop Niveaux';
}

export function mountCoopLobby(host: HTMLElement, o: { go: Go; overlay: HTMLElement }): () => void {
  const wrap = el('div', 'du scroll');
  host.appendChild(wrap);
  const s = coopService.session;
  if (!s) { o.go('#coop'); return () => wrap.remove(); }
  emitMeta('screen', { route: 'coop' });
  const p0 = getProfile();
  let deckIdx = p0?.activeDeck ?? 0;
  let ready = false;
  let destroyed = false;
  const offs: (() => void)[] = [];

  const meId = s.me;
  function render(): void {
    if (destroyed) return;
    const p = getProfile();
    const lob = s!.lobby;
    const players = lob?.players ?? [];
    const meP = players.find((x) => x.id === meId);
    const other = players.find((x) => x.id !== meId);
    ready = !!meP?.ready;
    const slots = deckSlotsUnlocked(p?.xp ?? 0);
    const decks = (p?.decks ?? []).slice(0, Math.max(1, slots));
    const card = (pl: LobbyPlayer | undefined, mine: boolean) => pl ? `
      <div class="du-pcard${pl.ready ? ' ready' : ''}">
        <img class="du-pav" alt="" src="${portraitUrl(pl.avatar)}">
        <div class="du-pinfo"><b>${esc(pl.name)}${mine ? ' <em>(toi)</em>' : ''}</b><small>Niveau ${pl.level}</small>${deckRow(pl.deck)}</div>
        <span class="du-ready">${pl.ready ? 'Prêt !' : '…'}</span>
      </div>` : `<div class="du-pcard empty"><span class="co-spin"></span><div class="du-pinfo"><b>En attente de ta partenaire…</b><small>${s instanceof CoopGuest ? 'Connexion au salon' : 'Arrivée imminente'}</small></div></div>`;
    const lvl = lob?.levelId ? getCoopLevel(lob.levelId) : undefined;
    // Coop Niveaux : le chapitre doit être fini en Solo par les deux joueuses (progression échangée au salon).
    const blocked = !!(lvl && other && meP && !coopLevelOpen(lvl, p?.coopLevels, meP.soloChapters, other.soloChapters) && !coopLevelOpen(lvl, p?.coopLevels, other.soloChapters, meP.soloChapters));
    wrap.innerHTML = `
      <div class="du-head"><button class="qs-back du-back" data-a="leave">‹ Quitter</button><h2 class="scr-title">Salon</h2></div>
      <p class="du-mode">${esc(lob ? modeLabel(lob.mode, lob.levelId) : '…')}${lvl ? `<small>${lvl.waves} vagues · ★★★ ${esc(coopConstraintLabel(lvl.bonus, lvl))}</small>` : '<small>3 vies partagées · le plus de vagues possible</small>'}</p>
      <section class="du-players">${card(other, false)}${card(meP, true)}</section>
      <section class="du-decks"><small>Ton deck</small><div class="du-deckpick">${decks.map((d, i) => `<button data-deck="${i}" class="${i === deckIdx ? 'on' : ''}"${ready ? ' disabled' : ''}><b>Deck ${i + 1}</b>${deckRow(d)}</button>`).join('')}</div></section>
      ${blocked ? `<p class="du-note du-warn">Ce niveau n’est pas encore ouvert pour vous deux : il faut avoir fini le chapitre ${lvl!.chapter} en Solo.</p>` : ''}
      <button class="mr-btn ${ready ? 'grey' : 'yellow'} du-readybtn" data-a="ready"${other && !blocked ? '' : ' disabled'}><span class="t">${ready ? 'Annuler « Prêt »' : 'Prêt !'}</span><small>${ready ? (other?.ready ? 'C’est parti !' : `On attend ${esc(other?.name ?? 'ta partenaire')}`) : 'Quand vous êtes prêts tous les deux, c’est parti'}</small></button>`;
  }

  wrap.addEventListener('click', async (e) => {
    const t = e.target as HTMLElement;
    const d = t.closest<HTMLElement>('[data-deck]')?.dataset['deck'];
    if (d !== undefined && !ready) {
      deckIdx = Number(d);
      const deck = getProfile()?.decks[deckIdx];
      if (deck) s!.setDeck(deckSetup(deck));
      render();
      return;
    }
    const a = t.closest<HTMLElement>('[data-a]')?.dataset['a'];
    if (a === 'ready') { s!.setReady(!ready); navigator.vibrate?.(15); }
    if (a === 'leave') {
      if (await confirmBox(o.overlay, 'Quitter le salon ?', 'Ta partenaire sera prévenue.', 'Quitter')) { coopService.leave(); o.go('#coop'); }
    }
  });

  // Mon deck actif d'abord.
  const deck = p0 ? activeDeck(p0, STARTER_DECKS.marvel) : STARTER_DECKS.marvel;
  s.setDeck(deckSetup(deck));
  offs.push(s.onLobby(() => render()));
  offs.push(s.onStart(() => { if (!destroyed) o.go('#coop/combat'); }));
  offs.push(s.onPeer((st) => {
    if (st === 'gone') { toast('Ta partenaire a quitté le salon.', 'warn'); render(); }
    else if (st === 'lost') render();
  }));
  if (s instanceof CoopGuest) offs.push(s.onBye(() => { toast('Ta partenaire a fermé le salon.', 'warn'); coopService.leave(); o.go('#coop'); }));
  if (s.gameConfig && !(s.isOver)) { o.go('#coop/combat'); }
  render();
  return () => { destroyed = true; for (const f of offs) f(); wrap.remove(); };
}

// ---------------------------------------------------------------------------------------------
// Combat à deux

interface DuoTracking {
  before(st: EngineState): void;
  after(st: EngineState, evs: EngineEvent[]): void;
  stats(): { players: (BattleStats & { kills: number })[]; gifts: number };
}

function duoTracking(): DuoTracking {
  const t = [createBattleTracker('p1'), createBattleTracker('p2')];
  const kills = { p1: 0, p2: 0 };
  let gifts = 0;
  let last: EngineState | null = null;
  return {
    before(st) { for (const x of t) x.before(st); },
    after(st, evs) {
      last = st;
      for (const x of t) x.after(st, evs);
      for (const e of evs) { if (e.type === 'kill') kills[e.player]++; else if (e.type === 'gift') gifts++; }
    },
    stats() {
      const st = last!;
      return { players: [{ ...t[0]!.stats(st), kills: kills.p1 }, { ...t[1]!.stats(st), kills: kills.p2 }], gifts };
    },
  };
}

export async function mountCoopBattle(root: HTMLElement, o: { go: Go }): Promise<() => void> {
  const s: Session | null = coopService.session;
  const cfg: GameConfig | null = s?.gameConfig ?? null;
  if (!s || !cfg) { o.go('#coop'); return () => undefined; }
  emitMeta('screen', { route: 'coop-combat' });
  const { mountBattle } = await import('./battle');
  const lob = s.lobby!;
  const partner = lob.players.find((x) => x.id !== s.me);
  const partnerInfo = { name: partner?.name ?? 'Partenaire', avatar: partner?.avatar ?? 'hulk' };
  const myDeck = cfg.players.find((x) => x.id === s.me)?.deck ?? STARTER_DECKS.marvel;
  const engine = s instanceof CoopGuest
    ? remoteEngine(cfg, createEngine(cfg).state, (c) => s.command(c))
    : undefined;
  const duo = duoTracking();
  let quitting = false;
  const b = mountBattle(root, {
    deck: myDeck,
    mapId: cfg.mapId,
    config: cfg,
    title: modeLabel(lob.mode, lob.levelId),
    onHome: () => { coopService.leave(); o.go(''); },
    onReplay: () => o.go('#coop/salon'),
    coop: {
      session: s,
      engine,
      partner: partnerInfo,
      observe: s instanceof CoopHost ? duo : undefined,
      onQuit: () => {
        if (!s.connected || s.isOver) { coopService.leave(); o.go('#coop'); return; } // partenaire déjà partie
        if (quitting) return;
        quitting = true;
        void confirmBox(root, 'Quitter la partie ?', `${partnerInfo.name} pourra continuer la partie.`, 'Quitter').then((ok) => {
          quitting = false;
          if (ok) { coopService.leave(); o.go('#coop'); }
        });
      },
    },
    onEnd: (r) => {
      // L'hôte établit le bilan (étoiles du duo) et l'envoie ; chacune crédite son profil.
      let result: CoopResult = {
        outcome: r.won ? 'victoire' : 'defaite', wave: r.wave, mode: lob.mode, levelId: lob.levelId, livesLeft: r.livesLeft,
        bossKills: r.bossKills.map((k) => ({ boss: k.boss, small: k.small, wave: k.wave })),
      };
      if (s instanceof CoopHost) {
        const lvl = lob.levelId ? getCoopLevel(lob.levelId) : undefined;
        if (lvl) {
          const st = duo.stats();
          result.stars = evaluateCoopStars(lvl, {
            won: r.won, livesLeft: r.livesLeft, wave: r.wave, gifts: st.gifts,
            players: st.players.map((x, i) => ({ ...x, deck: cfg.players[i]?.deck ?? [] })),
          });
        }
        s.finish(result);
        window.setTimeout(() => void showCoopEnd(root, result, r, partnerInfo.name, s, o), 900);
      } else {
        // Invitée : on attend le bilan de l'hôte (1,5 s au plus), sinon on garde le sien.
        const g = s as CoopGuest;
        const start = Date.now();
        const wait = () => {
          if (g.result) result = { ...result, ...g.result };
          if (g.result || Date.now() - start > 1500) void showCoopEnd(root, result, r, partnerInfo.name, s, o);
          else window.setTimeout(wait, 100);
        };
        window.setTimeout(wait, 900);
      }
      return true;
    },
  });
  return () => b.destroy();
}

async function showCoopEnd(
  root: HTMLElement, result: CoopResult, own: { merges: number; summons: number; bossKills: { boss: string; small: boolean; wave: number }[] },
  partnerName: string, s: Session, o: { go: Go },
): Promise<void> {
  const won = result.outcome === 'victoire';
  const wavesCleared = won ? result.wave : Math.max(0, result.wave - 1);
  let res: InfiniteResult | null = null;
  const lvl: CoopLevel | undefined = result.levelId ? getCoopLevel(result.levelId) : undefined;
  if (getProfile()) {
    await updateProfile((p) => {
      if (result.mode === 'coop-niveaux' && lvl) {
        res = applyCoopLevelGame(p, {
          levelId: lvl.id, chapter: lvl.chapter, n: lvl.n, won, wave: result.wave, stars: result.stars ?? [won, won && result.livesLeft >= 2, false],
          partnerName, merges: own.merges, summons: own.summons, bossKills: result.bossKills.length,
        });
      } else {
        res = applyCoopInfiniteGame(p, { wavesCleared, bossKills: result.bossKills, merges: own.merges, summons: own.summons, partnerName, won });
      }
    });
  }
  const r = res as InfiniteResult | null;
  if (r?.chests.length) {
    await playChests(root, r.chests.map((c) => ({ content: c.content, subtitle: `${result.mode === 'coop-infini' ? 'Coop Infini' : 'Coop Niveaux'} · ${c.name}` })), balanceOf(getProfile()));
  }
  const p = getProfile();
  const box = el('div', 'rw');
  const lines = r?.lines ?? [];
  const iconFor = (i: string): IconName => (['or', 'gemmes', 'cristaux', 'parchemins', 'coffre', 'record', 'cartes', 'xp'].includes(i) ? i : 'coffre') as IconName;
  const stars = result.stars;
  box.innerHTML = `
    <div class="rw-panel">
      <h2 class="rw-title">${won ? 'Victoire à deux !' : 'Fin de partie'}</h2>
      ${result.mode === 'coop-niveaux' && stars ? `<p class="rw-wave du-stars">${stars.map((x) => (x ? '★' : '☆')).join(' ')}<small>${esc(lvl ? coopLevelTitle(lvl) : '')}</small></p>`
        : `<p class="rw-wave">Vagues tenues avec ${esc(partnerName)}<b>${wavesCleared}</b>${p ? `<small>Record du duo : ${p.coopBest ?? 0}</small>` : ''}</p>`}
      <ul class="rw-list scroll">${lines.map((l, i) => `<li style="--d:${200 + i * 140}ms" class="${l.icon}">${icon(iconFor(l.icon))}<span><b>${esc(l.label)}</b>${l.detail ? `<small>${esc(l.detail)}</small>` : ''}</span></li>`).join('')
        || '<li style="--d:200ms"><span><b>Pas de récompense cette fois</b><small>Tenez au moins une vague !</small></span></li>'}</ul>
      ${r ? `<div class="rw-total">${totalsHtml(r.total)}</div>` : ''}
      ${r?.heroes.length ? `<p class="rw-heroes">${r.heroes.map((h) => `${esc(UNITS[h.unit].name)}${h.outcome === 'nouveau' ? ' rejoint ta collection !' : ' : +1 carte'}`).join('<br>')}</p>` : ''}
      <div class="rw-row"><button class="mr-btn yellow" data-a="replay">Rejouer ensemble</button><button class="mr-btn" data-a="home">Accueil</button></div>
    </div>`;
  root.appendChild(box);
  runTotals(box, 250 + lines.length * 140);
  box.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLElement>('[data-a]')?.dataset['a'];
    if (a === 'replay') {
      if (!s.connected) { toast('Ta partenaire n’est plus connectée.', 'warn'); coopService.leave(); box.remove(); o.go('#coop'); return; }
      if (s instanceof CoopHost) s.newRound();
      box.remove();
      o.go('#coop/salon');
    }
    if (a === 'home') { coopService.leave(); box.remove(); o.go(''); }
  });
}
