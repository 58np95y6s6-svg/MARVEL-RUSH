// Petits outils d'interface partagés par les écrans du méta-jeu : icônes, images des héros,
// panneaux qui montent du bas, messages brefs, texte échappé.
import './meta.css';
import { tokenPortraitSvg, tokenSvg, unitSvg } from '../art';
import type { Pack, Rarity, UnitId } from '../data/types';
import { UNITS } from '../data/units';

export const esc = (s: string): string => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
export const fmt = (n: number): string => Math.floor(n).toLocaleString('fr-FR');

export const RARITY_LABEL: Record<Rarity, string> = { rare: 'Rare', epique: 'Épique', legendaire: 'Légendaire' };
export const RARITY_ORDER: Record<Rarity, number> = { legendaire: 0, epique: 1, rare: 2 };

/** Couleurs d'univers (fond des fiches sans illustration, packs). */
export const PACK_COLORS: Record<string, [string, string]> = {
  marvel: ['#e8413b', '#7a1630'],
  disney: ['#3fa8f0', '#23307a'],
  complet: ['#f6c64a', '#8a3fd0'],
  dc: ['#3b62e0', '#141f52'],
};
export const packColors = (id: Pack | string): [string, string] => PACK_COLORS[id] ?? ['#7b6be0', '#2c2458'];
export const packLabel = (id: Pack | string): string => id === 'complet' ? 'Tous univers' : id === 'dc' ? 'DC' : id.charAt(0).toUpperCase() + id.slice(1);

// ------------------------------------------------------------------ images (URL d'objet en cache)
const urlCache = new Map<string, string>();
export function svgUrl(key: string, make: () => string): string {
  let u = urlCache.get(key);
  if (!u) { u = URL.createObjectURL(new Blob([make()], { type: 'image/svg+xml' })); urlCache.set(key, u); }
  return u;
}
/** Buste du héros sans plaque (cartes, avatar). */
export const portraitUrl = (id: UnitId, pose: 0 | 1 | 2 = 0): string => svgUrl(`p-${id}-${pose}`, () => tokenPortraitSvg(id, pose));
/** Jeton complet (plaque ronde + héros). */
export const tokenUrl = (id: UnitId): string => svgUrl(`t-${id}`, () => tokenSvg(id, 1, 'classique', { rarity: UNITS[id].rarity }));
/** Personnage en pied (fiche, ouverture de pack), poses 0 repos, 1 préparation, 2 frappe. */
export const figureUrl = (id: UnitId, pose: 0 | 1 | 2): string => svgUrl(`u-${id}-${pose}`, () => unitSvg(id, pose));

/** Boucle d'attaque : alterne les poses d'une image. Renvoie l'arrêt. */
export function attackLoop(img: HTMLImageElement, id: UnitId): () => void {
  const seq: (0 | 1 | 2)[] = [0, 0, 0, 1, 2, 2, 0, 0];
  let i = 0;
  const t = window.setInterval(() => {
    if (!img.isConnected) { window.clearInterval(t); return; }
    i = (i + 1) % seq.length;
    img.src = figureUrl(id, seq[i]!);
    img.classList.toggle('hit', seq[i] === 2);
  }, 140);
  return () => window.clearInterval(t);
}

// ------------------------------------------------------------------ icônes
export const ICONS = {
  eclats: `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3 L33 15 L20 37 L7 15Z" fill="#ffd84a" stroke="#1d1733" stroke-width="3.5" stroke-linejoin="round"/><path d="M20 3 L26 15 L20 37 L14 15Z" fill="#ffe98f"/><path d="M7 15 H33" stroke="#1d1733" stroke-width="3" /><path d="M13 9 l3 -2" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>`,
  cristaux: `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 2 C22 14 26 18 38 20 C26 22 22 26 20 38 C18 26 14 22 2 20 C14 18 18 14 20 2Z" fill="#c17bff" stroke="#1d1733" stroke-width="3.5" stroke-linejoin="round"/><path d="M20 9 C21 16 23 18 29 20 C23 21 21 23 20 30" fill="none" stroke="#f1dcff" stroke-width="3" stroke-linecap="round"/></svg>`,
  parchemins: `<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="8" y="7" width="22" height="26" rx="3" fill="#f7e2b0" stroke="#1d1733" stroke-width="3.5"/><path d="M6 9 a4 4 0 0 1 8 0 v2 h-8z M26 31 a4 4 0 0 0 8 0 v-2 h-8z" fill="#e0b56a" stroke="#1d1733" stroke-width="3"/><path d="M13 15 h12 M13 20 h12 M13 25 h8" stroke="#b07a3a" stroke-width="2.6" stroke-linecap="round"/></svg>`,
  xp: `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3 l5 11 12 1 -9 8 3 12 -11 -6 -11 6 3 -12 -9 -8 12 -1z" fill="#5fe08a" stroke="#1d1733" stroke-width="3.5" stroke-linejoin="round"/></svg>`,
  coffre: `<svg viewBox="0 0 48 44" aria-hidden="true"><path d="M5 18 Q5 5 24 5 Q43 5 43 18 Z" fill="#ffb53d" stroke="#1d1733" stroke-width="3.5" stroke-linejoin="round"/><rect x="5" y="18" width="38" height="22" rx="4" fill="#d9822b" stroke="#1d1733" stroke-width="3.5"/><path d="M5 25 H43" stroke="#1d1733" stroke-width="3"/><rect x="19" y="20" width="10" height="11" rx="2" fill="#ffe46a" stroke="#1d1733" stroke-width="3"/><path d="M11 10 q5 -3 10 -3" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".7"/></svg>`,
  cartes: `<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="5" y="9" width="18" height="25" rx="3" fill="#78b7ff" stroke="#1d1733" stroke-width="3.2" transform="rotate(-12 14 21)"/><rect x="16" y="6" width="18" height="25" rx="3" fill="#ffd84a" stroke="#1d1733" stroke-width="3.2" transform="rotate(10 25 18)"/></svg>`,
  record: `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M10 5 h20 v8 a10 10 0 0 1 -20 0z" fill="#ffd84a" stroke="#1d1733" stroke-width="3.5" stroke-linejoin="round"/><path d="M10 8 h-5 a5 5 0 0 0 6 8 M30 8 h5 a5 5 0 0 1 -6 8" fill="none" stroke="#1d1733" stroke-width="3"/><path d="M17 23 h6 v6 h4 v5 h-14 v-5 h4z" fill="#d9822b" stroke="#1d1733" stroke-width="3" stroke-linejoin="round"/></svg>`,
  lock: `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M12 18 v-5 a8 8 0 0 1 16 0 v5" fill="none" stroke="#1d1733" stroke-width="5"/><path d="M12 18 v-5 a8 8 0 0 1 16 0 v5" fill="none" stroke="#c9c2e8" stroke-width="2.5"/><rect x="8" y="17" width="24" height="19" rx="4" fill="#ffc23a" stroke="#1d1733" stroke-width="3.5"/><circle cx="20" cy="26" r="3" fill="#1d1733"/></svg>`,
  // Barre d'onglets
  tirages: `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="7" y="9" width="22" height="31" rx="4" fill="#9b59e6" stroke="#1d1733" stroke-width="3.5" transform="rotate(-14 18 24)"/><rect x="18" y="7" width="22" height="31" rx="4" fill="#f2a93b" stroke="#1d1733" stroke-width="3.5" transform="rotate(10 29 22)"/><path d="M29 15 l2.5 5 5.5 .8 -4 3.8 1 5.4 -5 -2.6 -5 2.6 1 -5.4 -4 -3.8 5.5 -.8z" fill="#fff" stroke="#1d1733" stroke-width="2" stroke-linejoin="round" transform="rotate(10 29 22)"/></svg>`,
  collection: `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="5" y="5" width="17" height="17" rx="4" fill="#3c8bf0" stroke="#1d1733" stroke-width="3.5"/><rect x="26" y="5" width="17" height="17" rx="4" fill="#9b59e6" stroke="#1d1733" stroke-width="3.5"/><rect x="5" y="26" width="17" height="17" rx="4" fill="#f2a93b" stroke="#1d1733" stroke-width="3.5"/><rect x="26" y="26" width="17" height="17" rx="4" fill="#5fd068" stroke="#1d1733" stroke-width="3.5"/></svg>`,
  combat: `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 6 L30 28 L26 32 L4 10 L4 6Z" fill="#dfe6f2" stroke="#1d1733" stroke-width="3.5" stroke-linejoin="round"/><path d="M40 6 L18 28 L22 32 L44 10 L44 6Z" fill="#dfe6f2" stroke="#1d1733" stroke-width="3.5" stroke-linejoin="round"/><path d="M12 30 l6 6 M36 30 l-6 6" stroke="#1d1733" stroke-width="7" stroke-linecap="round"/><path d="M12 30 l6 6 M36 30 l-6 6" stroke="#e8413b" stroke-width="3.5" stroke-linecap="round"/><circle cx="11" cy="39" r="4" fill="#ffd84a" stroke="#1d1733" stroke-width="3"/><circle cx="37" cy="39" r="4" fill="#ffd84a" stroke="#1d1733" stroke-width="3"/></svg>`,
  campagne: `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M5 10 L17 5 L31 10 L43 5 V38 L31 43 L17 38 L5 43Z" fill="#f7e2b0" stroke="#1d1733" stroke-width="3.5" stroke-linejoin="round"/><path d="M17 5 V38 M31 10 V43" stroke="#1d1733" stroke-width="2.5" opacity=".5"/><path d="M10 33 q6 -10 12 -6 t12 -12" fill="none" stroke="#e8413b" stroke-width="3" stroke-dasharray="3 4" stroke-linecap="round"/><path d="M33 11 l4 4 m0 -4 l-4 4" stroke="#e8413b" stroke-width="3.5" stroke-linecap="round"/></svg>`,
  encyclopedie: `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 11 C18 6 10 6 5 8 V40 C10 38 18 38 24 43 C30 38 38 38 43 40 V8 C38 6 30 6 24 11Z" fill="#78b7ff" stroke="#1d1733" stroke-width="3.5" stroke-linejoin="round"/><path d="M24 11 V43" stroke="#1d1733" stroke-width="3"/><path d="M10 15 q6 -2 10 1 M10 22 q6 -2 10 1 M28 16 q4 -3 10 -1 M28 23 q4 -3 10 -1" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round"/></svg>`,
} as const;
export type IconName = keyof typeof ICONS;
export const icon = (n: IconName, cls = ''): string => `<i class="ic ${cls}">${ICONS[n]}</i>`;

// ------------------------------------------------------------------ panneaux et messages

export interface Sheet { el: HTMLElement; body: HTMLElement; close(): void; onClose(fn: () => void): void }

/** Panneau qui monte du bas, fond assombri ; seul son contenu défile. */
export function openSheet(host: HTMLElement, o: { title?: string; cls?: string; html?: string; tall?: boolean }): Sheet {
  const wrap = document.createElement('div');
  wrap.className = `mk-sheet-wrap ${o.cls ?? ''}`;
  wrap.innerHTML = `<div class="mk-veil"></div>
    <div class="mk-sheet${o.tall ? ' tall' : ''}" role="dialog" aria-modal="true">
      <div class="mk-grab"></div>
      ${o.title ? `<h2 class="mk-sheet-title">${o.title}</h2>` : ''}
      <button class="mk-close" aria-label="Fermer" data-tuto="sheet-close">✕</button>
      <div class="mk-sheet-body scroll"></div>
    </div>`;
  const body = wrap.querySelector<HTMLElement>('.mk-sheet-body')!;
  if (o.html) body.innerHTML = o.html;
  host.appendChild(wrap);
  const closers: (() => void)[] = [];
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    wrap.classList.add('out');
    window.setTimeout(() => wrap.remove(), 220);
    for (const f of closers) f();
  };
  wrap.querySelector('.mk-veil')!.addEventListener('click', close);
  wrap.querySelector('.mk-close')!.addEventListener('click', close);
  return { el: wrap, body, close, onClose: (fn) => closers.push(fn) };
}

/** Message bref en haut de l'écran. */
export function toast(msg: string, kind: 'ok' | 'warn' = 'ok'): void {
  const t = document.createElement('div');
  t.className = `mk-toast ${kind}`;
  t.textContent = msg;
  document.getElementById('app')?.appendChild(t);
  window.setTimeout(() => t.classList.add('out'), 1800);
  window.setTimeout(() => t.remove(), 2100);
}

/** Confirmation dans la page (jamais de confirm() natif). */
export function confirmBox(host: HTMLElement, title: string, text: string, ok = 'Valider'): Promise<boolean> {
  return new Promise((resolve) => {
    const m = document.createElement('div');
    m.className = 'mk-modal';
    m.innerHTML = `<div class="mk-panel"><h3>${title}</h3><p>${text}</p><div class="mk-row"><button class="mr-btn" data-v="0">Annuler</button><button class="mr-btn green" data-v="1">${ok}</button></div></div>`;
    host.appendChild(m);
    m.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-v]');
      if (!b && e.target !== m) return;
      m.remove();
      resolve(b?.dataset['v'] === '1');
    });
  });
}

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', html = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}
