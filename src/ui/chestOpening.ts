// Ouverture de coffre (façon Rush Royale), dans le même style premium que l'ouverture de pack :
// 1. le coffre tombe et rebondit, il frétille en attendant le doigt (« Touche le coffre ! ») ;
// 2. au toucher : il tremble de plus en plus fort, la lueur de son rang monte, puis il ÉCLATE
//    (flash, couvercle qui s'envole, rayons, étincelles ; Légendaire : secousse de l'écran et vibration) ;
// 3. le butin sort du coffre, objet par objet, et vient se ranger en grille (montants qui défilent) ;
// 4. l'or, les gemmes, les cristaux et les parchemins s'envolent vers la barre des monnaies en haut, dont
//    les compteurs montent ;
// 5. « Continuer » (ou « Coffre suivant » s'il en reste). « Passer » montre tout d'un coup.
// Les récompenses sont déjà créditées (et sauvegardées) avant l'animation : fermer l'app ne perd rien.
import './chest.css';
import type { Rarity, UnitId } from '../data/types';
import { UNITS } from '../data/units';
import { CHEST_NAMES, type ChestContent, type ChestTier } from '../meta/chests';
import { el, esc, fmt, fmtShort, icon, portraitUrl, type IconName } from './kit';

const INK = '#1d1733';
export type ChestLook = ChestTier | 'cadeau';

/** Couleurs par rang : couvercle, corps, ombre, ferrures, lueur. */
const PALETTE: Record<ChestLook, { lid: string; body: string; dark: string; band: string; glow: string }> = {
  bois: { lid: '#d9853b', body: '#b8692e', dark: '#7a3f1a', band: '#f6c64a', glow: '#ffb35a' },
  argent: { lid: '#d6deef', body: '#9aa7c2', dark: '#5b6680', band: '#ffffff', glow: '#bfe1ff' },
  or: { lid: '#ffd45a', body: '#e89a1c', dark: '#a85f10', band: '#fff3b8', glow: '#ffd34d' },
  heroique: { lid: '#b07cff', body: '#7b3fd0', dark: '#4a1f8a', band: '#ffd45a', glow: '#c98bff' },
  legendaire: { lid: '#ff9a4a', body: '#e0531f', dark: '#8a2a10', band: '#ffe46a', glow: '#ffcf3d' },
  cadeau: { lid: '#ff5a7a', body: '#e8413b', dark: '#8a1a30', band: '#ffd84a', glow: '#ffd34d' },
};

/** Couvercle (dessiné à part pour s'envoler). */
function lidSvg(look: ChestLook): string {
  const c = PALETTE[look];
  if (look === 'cadeau') {
    return `<svg viewBox="0 0 140 60" aria-hidden="true"><path d="M70 30 C50 0 26 6 38 22 C44 30 62 30 70 30 C78 30 96 30 102 22 C114 6 90 0 70 30Z" fill="${c.band}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
      <rect x="10" y="28" width="120" height="30" rx="8" fill="${c.lid}" stroke="${INK}" stroke-width="5"/><rect x="60" y="28" width="20" height="30" fill="${c.band}" stroke="${INK}" stroke-width="4"/><path d="M20 36 h24" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".5"/></svg>`;
  }
  const gems = look === 'legendaire' || look === 'heroique'
    ? `<path d="M70 14 l7 8 -7 9 -7 -9z" fill="${look === 'legendaire' ? '#7ff0ff' : '#ff6fb5'}" stroke="${INK}" stroke-width="3"/>` : '';
  return `<svg viewBox="0 0 140 60" aria-hidden="true">
    <path d="M8 58 C8 22 30 6 70 6 S132 22 132 58Z" fill="${c.lid}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M36 12 V58 M104 12 V58" stroke="${c.band}" stroke-width="9"/><path d="M36 12 V58 M104 12 V58" stroke="${INK}" stroke-width="2" opacity=".3"/>
    <path d="M22 30 q14 -16 36 -18" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".45"/>${gems}</svg>`;
}

/** Corps du coffre. */
function bodySvg(look: ChestLook): string {
  const c = PALETTE[look];
  if (look === 'cadeau') {
    return `<svg viewBox="0 0 140 84" aria-hidden="true"><rect x="16" y="4" width="108" height="76" rx="8" fill="${c.body}" stroke="${INK}" stroke-width="5"/>
      <rect x="60" y="4" width="20" height="76" fill="${c.band}" stroke="${INK}" stroke-width="4"/><path d="M26 16 v30" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".35"/></svg>`;
  }
  return `<svg viewBox="0 0 140 84" aria-hidden="true">
    <path d="M8 4 H132 V70 a10 10 0 0 1 -10 10 H18 a10 10 0 0 1 -10 -10Z" fill="${c.body}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M12 26 H128" stroke="${c.dark}" stroke-width="5"/><path d="M12 50 H128" stroke="${c.dark}" stroke-width="3" opacity=".6"/>
    <path d="M36 6 V78 M104 6 V78" stroke="${c.band}" stroke-width="9"/><path d="M36 6 V78 M104 6 V78" stroke="${INK}" stroke-width="2" opacity=".3"/>
    <rect x="56" y="0" width="28" height="32" rx="6" fill="${c.band}" stroke="${INK}" stroke-width="5"/><circle cx="70" cy="14" r="4.5" fill="${INK}"/><path d="M70 16 v8" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    <path d="M16 36 h12" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".4"/></svg>`;
}

/** Petit coffre fermé (listes, boutons, aperçus). */
export function chestMiniSvg(look: ChestLook): string {
  return `<span class="ch-mini ${look}"><span class="ch-mini-lid">${lidSvg(look)}</span><span class="ch-mini-body">${bodySvg(look)}</span></span>`;
}

export interface ChestShow {
  content: ChestContent;
  /** Titre (par défaut : nom du coffre). */
  title?: string;
  /** Ligne sous le titre (« Victoire · niveau 1-3 », « Palier 20 »…). */
  subtitle?: string;
  look?: ChestLook;
}

/** Soldes affichés dans la barre des monnaies du coffre. */
export interface Balance { gold: number; shards: number; crystals: number; scrolls: number }

type Money = keyof Balance;
const MONEY: { key: Money; icon: IconName; title: string }[] = [
  { key: 'gold', icon: 'or', title: 'Or' },
  { key: 'shards', icon: 'gemmes', title: 'Gemmes' },
  { key: 'crystals', icon: 'cristaux', title: 'Cristaux' },
  { key: 'scrolls', icon: 'parchemins', title: 'Parchemins' },
];

interface Item { kind: 'money' | 'card' | 'hero' | 'pull'; money?: Money; amount: number; unit?: UnitId; rarity?: Rarity; label: string; html: string }

function itemsOf(c: ChestContent): Item[] {
  const out: Item[] = [];
  const money = (key: Money, amount: number, label: string, ic: IconName) => {
    if (amount > 0) out.push({ kind: 'money', money: key, amount, label, html: icon(ic) });
  };
  money('gold', c.gold, 'Or', 'or');
  money('shards', c.gems, 'Gemmes', 'gemmes');
  money('crystals', c.crystals, 'Cristaux ✦', 'cristaux');
  money('scrolls', c.scrolls, c.scrolls > 1 ? 'Parchemins' : 'Parchemin', 'parchemins');
  for (const u of c.heroes) out.push({ kind: 'hero', amount: 1, unit: u, rarity: UNITS[u].rarity, label: UNITS[u].name, html: `<img src="${portraitUrl(u)}" alt="">` });
  const rank: Record<Rarity, number> = { legendaire: 0, epique: 1, rare: 2 };
  for (const x of [...c.cards].sort((a, b) => rank[UNITS[a.unit].rarity] - rank[UNITS[b.unit].rarity] || b.count - a.count)) {
    out.push({ kind: 'card', amount: x.count, unit: x.unit, rarity: UNITS[x.unit].rarity, label: UNITS[x.unit].name, html: `<img src="${portraitUrl(x.unit)}" alt="">` });
  }
  if (c.freePulls) out.push({ kind: 'pull', amount: c.freePulls, label: `Tirage${c.freePulls > 1 ? 's' : ''} offert${c.freePulls > 1 ? 's' : ''}`, html: icon('tirages') });
  return out;
}

/** Fait défiler un nombre de `from` à `to` dans `node`. */
export function countUp(node: HTMLElement, from: number, to: number, ms: number, format: (n: number) => string = fmt, prefix = ''): void {
  const t0 = performance.now();
  const step = (t: number) => {
    const k = Math.min(1, (t - t0) / Math.max(1, ms));
    const e = 1 - (1 - k) ** 3;
    node.textContent = prefix + format(Math.round(from + (to - from) * e));
    if (k < 1 && node.isConnected) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

/**
 * Joue l'ouverture d'un ou plusieurs coffres. `after` : soldes APRÈS crédit (la barre part de
 * `after` moins le contenu des coffres et remonte au fil des ouvertures).
 */
export function playChests(host: HTMLElement, chests: ChestShow[], after: Balance): Promise<void> {
  return new Promise((resolve) => {
    if (!chests.length) { resolve(); return; }
    const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const T = (ms: number) => (rm ? Math.min(ms, 120) : ms);
    const bal: Balance = { ...after };
    for (const c of chests) {
      bal.gold -= c.content.gold; bal.shards -= c.content.gems; bal.crystals -= c.content.crystals; bal.scrolls -= c.content.scrolls;
    }
    const root = el('div', 'ch');
    root.innerHTML = `<div class="ch-bg"></div><div class="ch-rays"></div>
      <div class="ch-bar">${MONEY.map((m) => `<span class="ch-pill ${m.key}" data-m="${m.key}" title="${m.title}">${icon(m.icon)}<b>${fmtShort(bal[m.key])}</b></span>`).join('')}</div>
      <div class="ch-top"><div class="ch-titles"><h2 class="ch-title"></h2><p class="ch-sub"></p></div><button class="ch-skip" data-ch="skip">Passer</button></div>
      <div class="ch-stage">
        <button class="ch-chest" data-ch="open" aria-label="Ouvrir le coffre"><span class="ch-glow"></span><span class="ch-lid"></span><span class="ch-body"></span><span class="ch-shadow"></span></button>
        <div class="ch-items"></div>
      </div>
      <div class="ch-bottom"><p class="ch-hint"></p><div class="ch-actions"></div></div>
      <div class="ch-fx"></div><div class="ch-flash"></div>`;
    host.appendChild(root);
    const $ = <T extends HTMLElement>(s: string) => root.querySelector<T>(s)!;
    const chestBtn = $('.ch-chest'), lidEl = $('.ch-lid'), bodyEl = $('.ch-body'), items = $('.ch-items');
    const hint = $('.ch-hint'), actions = $('.ch-actions'), fx = $('.ch-fx'), flash = $('.ch-flash');
    let index = 0;
    let phase: 'idle' | 'opening' | 'reveal' | 'done' = 'idle';
    let skip = false;

    function setup(): void {
      const show = chests[index]!;
      const look = show.look ?? show.content.tier;
      root.className = `ch look-${look}${show.content.small ? ' small' : ''}`; // retire opened / done / quake
      root.style.setProperty('--glow', PALETTE[look].glow);
      $('.ch-title').textContent = show.title ?? (look === 'cadeau' ? 'Récompense' : CHEST_NAMES[show.content.tier]);
      $('.ch-sub').innerHTML = `${show.subtitle ? esc(show.subtitle) : ''}${chests.length > 1 ? `<span class="ch-count">${index + 1} / ${chests.length}</span>` : ''}`;
      lidEl.innerHTML = lidSvg(look);
      bodyEl.innerHTML = bodySvg(look);
      items.innerHTML = '';
      actions.innerHTML = '';
      chestBtn.className = 'ch-chest in';
      hint.textContent = look === 'cadeau' ? 'Touche le cadeau !' : 'Touche le coffre !';
      hint.classList.remove('on');
      phase = 'idle';
      window.setTimeout(() => { if (phase === 'idle') hint.classList.add('on'); }, T(700));
      window.setTimeout(() => chestBtn.classList.replace('in', 'idle'), T(650));
    }

    function sparks(n: number, big: boolean): void {
      if (rm) return;
      const r = chestBtn.getBoundingClientRect(), base = root.getBoundingClientRect();
      const cx = r.left - base.left + r.width / 2, cy = r.top - base.top + r.height * 0.45;
      for (let i = 0; i < n; i++) {
        const s = el('i', `ch-spark${i % 3 === 0 ? ' star' : ''}`);
        const a = Math.random() * Math.PI * 2, d = (big ? 140 : 90) + Math.random() * (big ? 160 : 90);
        s.style.cssText = `left:${cx}px;top:${cy}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d - 60}px;--r:${Math.random() * 720 - 360}deg;--d:${Math.random() * 120}ms;--s:${0.6 + Math.random() * 0.9}`;
        fx.appendChild(s);
        window.setTimeout(() => s.remove(), 1300);
      }
    }

    async function open(): Promise<void> {
      if (phase !== 'idle') return;
      phase = 'opening';
      const show = chests[index]!;
      const look = show.look ?? show.content.tier;
      const big = look === 'legendaire' || look === 'heroique';
      hint.classList.remove('on');
      if (!skip) {
        chestBtn.className = 'ch-chest shake';
        try { navigator.vibrate?.(big ? [20, 40, 20, 40, 60] : 25); } catch { /* ignoré */ }
        await wait(T(big ? 900 : 650));
      }
      chestBtn.className = 'ch-chest burst';
      root.classList.add('opened');
      if (big && !rm) root.classList.add('quake');
      flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go');
      sparks(big ? 34 : 20, big);
      await wait(T(skip ? 60 : 420));
      await reveal(show.content);
    }

    async function reveal(c: ChestContent): Promise<void> {
      phase = 'reveal';
      const list = itemsOf(c);
      items.innerHTML = list.map((it, i) => `<div class="ch-item ${it.kind}${it.rarity ? ` r-${it.rarity}` : ''}" style="--i:${i}">
          <span class="ch-ipic">${it.html}${it.kind === 'hero' ? '<em>Nouveau !</em>' : ''}</span>
          <b class="ch-iamt">${it.kind === 'hero' ? '' : it.kind === 'money' ? '+0' : `×${it.amount}`}</b>
          <small>${esc(it.label)}</small></div>`).join('');
      const tiles = [...items.querySelectorAll<HTMLElement>('.ch-item')];
      const cr = chestBtn.getBoundingClientRect();
      const step = skip ? 0 : T(list.length > 6 ? 170 : 240);
      for (let i = 0; i < tiles.length; i++) {
        const tile = tiles[i]!, it = list[i]!;
        const tr = tile.getBoundingClientRect();
        tile.style.setProperty('--fx', `${cr.left + cr.width / 2 - (tr.left + tr.width / 2)}px`);
        tile.style.setProperty('--fy', `${cr.top + cr.height * 0.4 - (tr.top + tr.height / 2)}px`);
        tile.classList.add('out');
        const amt = tile.querySelector<HTMLElement>('.ch-iamt')!;
        if (it.kind === 'money') countUp(amt, 0, it.amount, skip ? 0 : T(650), fmt, '+');
        if (it.kind === 'hero' || it.rarity === 'legendaire') { tile.classList.add('wow'); if (!skip) sparks(14, false); }
        if (step && !skip) await wait(step);
      }
      await wait(skip ? 0 : T(500));
      await flyToBar(list, tiles);
      phase = 'done';
      root.classList.add('done');
      const last = index >= chests.length - 1;
      actions.innerHTML = `<button class="mr-btn yellow ch-next" data-ch="next">${last ? 'Continuer' : 'Coffre suivant'}</button>`;
      if (!last) skip = false;
    }

    /** Les monnaies s'envolent vers la barre ; ses compteurs montent. */
    async function flyToBar(list: Item[], tiles: HTMLElement[]): Promise<void> {
      const base = root.getBoundingClientRect();
      const jobs: Promise<void>[] = [];
      list.forEach((it, i) => {
        if (it.kind !== 'money' || !it.money) return;
        const key = it.money;
        const pill = root.querySelector<HTMLElement>(`.ch-pill[data-m="${key}"]`)!;
        const from = tiles[i]!.querySelector<HTMLElement>('.ch-ipic')!.getBoundingClientRect();
        const to = pill.querySelector<HTMLElement>('.ic')!.getBoundingClientRect();
        const n = skip || rm ? 1 : Math.min(7, 3 + Math.floor(Math.log10(it.amount + 1)));
        jobs.push(new Promise<void>((done) => {
          for (let k = 0; k < n; k++) {
            const f = el('i', 'ch-fly', icon(MONEY.find((m) => m.key === key)!.icon));
            f.style.cssText = `left:${from.left - base.left + from.width / 2 - 12}px;top:${from.top - base.top + from.height / 2 - 12}px;--tx:${to.left - from.left - from.width / 2 + 12}px;--ty:${to.top - from.top - from.height / 2 + 12}px;--d:${k * 70}ms;--jx:${Math.random() * 40 - 20}px`;
            fx.appendChild(f);
            window.setTimeout(() => f.remove(), 900 + k * 70);
          }
          const land = skip || rm ? 0 : 560;
          window.setTimeout(() => {
            const b = pill.querySelector<HTMLElement>('b')!;
            countUp(b, bal[key], bal[key] + it.amount, skip ? 0 : T(500), fmtShort);
            bal[key] += it.amount;
            pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump');
            done();
          }, land);
        }));
      });
      await Promise.all(jobs);
      await wait(skip ? 0 : T(450));
    }

    function finish(): void {
      root.classList.add('out');
      window.setTimeout(() => { root.remove(); resolve(); }, 220);
    }

    root.addEventListener('click', (e) => {
      // Le coffre peut s'ouvrir dans un écran qui écoute aussi les clics (résultats de campagne).
      e.stopPropagation();
      const a = (e.target as HTMLElement).closest<HTMLElement>('[data-ch]')?.dataset['ch'];
      if (a === 'open') void open();
      else if (a === 'skip') {
        skip = true;
        if (phase === 'idle') void open();
        else if (phase === 'done') { /* déjà fini */ }
      } else if (a === 'next') {
        if (index < chests.length - 1) { index += 1; setup(); if (skip) void open(); }
        else finish();
      }
    });
    setup();
  });
}

/**
 * Petites icônes qui s'envolent d'un bouton vers les pastilles de l'en-tête de la coquille
 * (réclamer une quête, une récompense de la route). Se résout quand elles arrivent.
 */
export function flyToHeader(from: Element, r: Partial<Balance>): Promise<void> {
  const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const src = from.getBoundingClientRect();
  const host = document.getElementById('app') ?? document.body;
  let longest = 0;
  for (const m of MONEY) {
    const amount = r[m.key] ?? 0;
    if (amount <= 0) continue;
    const pill = document.querySelector<HTMLElement>(`.sh-pill[data-m="${m.key}"]`);
    if (!pill || rm) continue;
    const to = (pill.querySelector('.ic') ?? pill).getBoundingClientRect();
    const n = Math.min(6, 2 + Math.floor(Math.log10(amount + 1)));
    for (let k = 0; k < n; k++) {
      const f = el('i', 'fly-ic', icon(m.icon));
      const x = src.left + src.width / 2 - 13 + (Math.random() * 30 - 15), y = src.top + src.height / 2 - 13;
      f.style.cssText = `left:${x}px;top:${y}px;--tx:${to.left + to.width / 2 - 13 - x}px;--ty:${to.top + to.height / 2 - 13 - y}px;--d:${k * 70}ms;--jx:${Math.random() * 40 - 20}px`;
      host.appendChild(f);
      window.setTimeout(() => f.remove(), 750 + k * 70);
    }
    longest = Math.max(longest, 600 + (n - 1) * 70);
  }
  return wait(longest);
}

/** Soldes d'un profil, pour la barre des monnaies. */
export function balanceOf(p: { gold?: number; shards: number; crystals: number; scrolls: number } | null): Balance {
  return { gold: p?.gold ?? 0, shards: p?.shards ?? 0, crystals: p?.crystals ?? 0, scrolls: p?.scrolls ?? 0 };
}
