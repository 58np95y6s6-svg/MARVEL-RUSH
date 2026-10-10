// Interface Coop du combat (§5.2, §5.5) : pastille de la partenaire, bouton « Offrir » (une fois par vague),
// 6 emotes avec les visages des héros, attente et reconnexion de la partenaire.
import './coop.css';
import type { UnitId } from '../data/types';
import type { Engine, PlayerId } from '../engine';
import type { CoopGuest, CoopHost, PeerStatus } from '../net/coop';
import type { BattleScene } from '../render/scene';
import { esc, portraitUrl } from './kit';

export const EMOTES: { unit: UnitId; text: string }[] = [
  { unit: 'spiderman', text: 'Bien joué !' },
  { unit: 'hulk', text: 'Aide-moi !' },
  { unit: 'thor', text: 'Fusionne !' },
  { unit: 'maui', text: '😂' },
  { unit: 'cap', text: 'Merci !' },
  { unit: 'ironman', text: 'Le boss arrive !' },
];

export interface CoopHud {
  update(): void;
  armGift(on: boolean): void;
  /** Fenêtre d'attente (null pour la fermer). */
  waiting(text: string | null, buttons?: { label: string; onClick: () => void }[]): void;
  end(): void;
  destroy(): void;
}

export interface CoopHudOptions {
  stage: HTMLElement;
  wrap: HTMLElement;
  dock: HTMLElement;
  extra: HTMLElement;
  scene: BattleScene;
  engine: Engine;
  me: PlayerId;
  partner: { name: string; avatar: UnitId };
  session: CoopHost | CoopGuest;
  toast: (msg: string) => void;
  onGift: () => void;
}

const GIFT_SVG = `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="7" y="20" width="34" height="22" rx="4" fill="#ff7ab8" stroke="#1d1733" stroke-width="4"/><rect x="4" y="13" width="40" height="10" rx="4" fill="#ff9ad0" stroke="#1d1733" stroke-width="4"/><path d="M24 13 V42" stroke="#ffe27a" stroke-width="6"/><path d="M24 13 C16 2 8 8 14 13 M24 13 C32 2 40 8 34 13" fill="none" stroke="#1d1733" stroke-width="4" stroke-linecap="round"/></svg>`;
const EMOTE_SVG = `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 10 H40 A4 4 0 0 1 44 14 V30 A4 4 0 0 1 40 34 H22 L12 42 V34 H8 A4 4 0 0 1 4 30 V14 A4 4 0 0 1 8 10Z" fill="#fff" stroke="#1d1733" stroke-width="4" stroke-linejoin="round"/><circle cx="16" cy="22" r="3" fill="#1d1733"/><circle cx="24" cy="22" r="3" fill="#1d1733"/><circle cx="32" cy="22" r="3" fill="#1d1733"/></svg>`;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', html = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

export function createCoopHud(o: CoopHudOptions): CoopHud {
  const offs: (() => void)[] = [];
  const meIdx = Math.max(0, o.engine.state.players.findIndex((p) => p.id === o.me));
  const host = o.session.isHost ? (o.session as CoopHost) : null;
  const guest = o.session.isHost ? null : (o.session as CoopGuest);
  let ended = false;

  // Pastille de la partenaire, entre les deux plateaux.
  const chip = el('div', 'co-chip', `<img alt="" src="${portraitUrl(o.partner.avatar)}"><span class="mr-outline-s">${esc(o.partner.name)}</span><i class="co-dot"></i>`);
  o.stage.appendChild(chip);
  const dot = chip.querySelector('i')!;

  // Bulles d'emote : celle de la partenaire près de sa pastille, la mienne près de mon plateau.
  const bubbleP = el('div', 'co-bubble partner');
  const bubbleMe = el('div', 'co-bubble me');
  o.stage.append(bubbleP, bubbleMe);
  const timers = new Map<HTMLElement, number>();
  function bubble(b: HTMLElement, n: number): void {
    const e = EMOTES[n];
    if (!e) return;
    b.innerHTML = `<img alt="" src="${portraitUrl(e.unit, 1)}"><span>${esc(e.text)}</span>`;
    b.classList.remove('on'); void b.offsetWidth; b.classList.add('on');
    clearTimeout(timers.get(b));
    timers.set(b, window.setTimeout(() => b.classList.remove('on'), 2600));
  }

  // Bouton emote (en haut à droite) et sa palette.
  const emoteBtn = el('button', 'co-emote-btn', EMOTE_SVG);
  emoteBtn.setAttribute('aria-label', 'Emotes');
  emoteBtn.dataset['coop'] = 'emote';
  o.stage.querySelector('.mr-top-r')?.prepend(emoteBtn);
  const palette = el('div', 'co-palette', EMOTES.map((e, i) => `<button data-e="${i}" aria-label="${esc(e.text)}"><img alt="" src="${portraitUrl(e.unit, 1)}"><span>${esc(e.text)}</span></button>`).join(''));
  o.stage.appendChild(palette);
  let lastEmote = 0;
  emoteBtn.addEventListener('click', () => palette.classList.toggle('on'));
  palette.addEventListener('click', (ev) => {
    const b = (ev.target as HTMLElement).closest<HTMLElement>('[data-e]');
    if (!b) return;
    palette.classList.remove('on');
    const n = Number(b.dataset['e']);
    const now = performance.now();
    if (now - lastEmote < 1200) return; // anti-spam
    lastEmote = now;
    bubble(bubbleMe, n);
    o.session.emote(n);
  });
  offs.push(o.session.onEmote((e) => { if (e.from !== o.me) { bubble(bubbleP, e.emote); if ((navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive) navigator.vibrate?.(25); } }));

  // Offrir (une fois par vague).
  const gift = el('button', 'co-gift', `${GIFT_SVG}<span class="mr-outline-s">Offrir</span>`);
  gift.setAttribute('aria-label', 'Offrir une unité à ta partenaire');
  gift.dataset['coop'] = 'gift';
  o.extra.appendChild(gift);
  gift.addEventListener('click', o.onGift);

  // Attente / reconnexion.
  const wait = el('div', 'mr-modal co-wait');
  o.wrap.appendChild(wait);
  function waiting(text: string | null, buttons: { label: string; onClick: () => void }[] = []): void {
    if (!text) { wait.classList.remove('on'); wait.innerHTML = ''; return; }
    wait.innerHTML = `<div class="mr-panel"><div class="co-spin"${buttons.length ? ' hidden' : ''}></div><p>${esc(text)}</p>${buttons.length ? `<div class="row">${buttons.map((b, i) => `<button class="mr-btn ${i === 0 ? 'yellow' : ''}" data-i="${i}">${esc(b.label)}</button>`).join('')}</div>` : ''}</div>`;
    wait.classList.add('on');
    wait.querySelectorAll<HTMLButtonElement>('button[data-i]').forEach((el) => { el.onclick = () => buttons[Number(el.dataset['i'])]?.onClick(); });
  }
  const quit = () => o.wrap.dispatchEvent(new CustomEvent('coop-quit', { bubbles: true }));

  // Hôte : partenaire perdue → pause et attente 30 s ; de retour → reprise ; partie → on continue.
  let countdown = 0;
  let paused = false;
  const stopCount = () => { clearInterval(countdown); countdown = 0; };
  const setPause = (p: boolean) => { if (paused === p) return; paused = p; o.engine.apply({ type: 'pause', paused: p }); };
  const onPeer = (s: PeerStatus) => {
    if (ended) return;
    dot.classList.toggle('off', s === 'lost' || s === 'gone');
    if (host) {
      if (s === 'lost') {
        setPause(true);
        let left = 30;
        waiting(`${o.partner.name} a perdu la connexion. On l’attend… (${left} s)`);
        stopCount();
        countdown = window.setInterval(() => {
          left = Math.max(0, left - 1);
          if (left > 0) waiting(`${o.partner.name} a perdu la connexion. On l’attend… (${left} s)`);
        }, 1000);
      } else if (s === 'back' || s === 'connected') {
        stopCount(); waiting(null); setPause(false); host.hold(false);
        o.toast(`${o.partner.name} est de retour !`);
      } else if (s === 'gone') {
        stopCount(); waiting(null); setPause(false);
        o.toast(`${o.partner.name} a quitté la partie : on continue !`);
      }
    } else {
      if (s === 'lost') waiting('Connexion perdue. Reconnexion en cours…');
      else if (s === 'back') { waiting(null); o.toast('Reconnectée !'); }
      else if (s === 'gone') waiting(`Impossible de joindre ${o.partner.name}… Vérifie ta connexion.`, [
        { label: 'Réessayer', onClick: () => { waiting('Reconnexion en cours…'); guest?.retry(); } },
        { label: 'Quitter', onClick: quit },
      ]);
    }
  };
  offs.push(o.session.onPeer(onPeer));
  if (guest) {
    offs.push(guest.onHold((h) => { if (!ended) waiting(h.waiting ? `${o.partner.name} t’attend…` : null); }));
    offs.push(guest.onBye(() => {
      if (ended) return;
      waiting(`${o.partner.name} a quitté la partie.`, [{ label: 'Accueil', onClick: quit }]);
    }));
  }

  // Retour au premier plan (écran verrouillé, autre appli) : l'invitée relance la reconnexion si besoin.
  const onVis = () => { if (!document.hidden && guest && !guest.connected && !ended) guest.retry(); };
  document.addEventListener('visibilitychange', onVis);
  offs.push(() => document.removeEventListener('visibilitychange', onVis));

  let giftKey = '';
  return {
    update() {
      const p = o.engine.state.players[meIdx];
      const used = !!p?.giftUsedThisWave;
      const key = used ? 'u' : 'f';
      if (key !== giftKey) { giftKey = key; gift.classList.toggle('used', used); }
    },
    armGift(on) { gift.classList.toggle('armed', on); o.wrap.classList.toggle('co-gifting', on); },
    waiting,
    end() { ended = true; stopCount(); waiting(null); palette.classList.remove('on'); },
    destroy() {
      for (const f of offs.splice(0)) f();
      stopCount();
      for (const t of timers.values()) clearTimeout(t);
      chip.remove(); bubbleP.remove(); bubbleMe.remove(); emoteBtn.remove(); palette.remove(); gift.remove(); wait.remove();
    },
  };
}
