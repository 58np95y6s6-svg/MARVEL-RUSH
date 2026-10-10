// Écran Campagne (docs/campagne.md §1, modèle : écran « Donjons » de Rush Royale) :
// illustration du chapitre, bannière en bois, jauge d'étoiles et ses 3 coffres, liste des niveaux
// (défilement interne), fiche de niveau, choix du chapitre, et écran de résultats après un combat.
import './campaign.css';
import { bossSvg, enemySvg, minionSvg, tokenSvg, unitSvg } from '../art';
import { BOSSES, LIEUTENANTS } from '../data/bosses';
import type { BossId, UnitId } from '../data/types';
import { UNITS } from '../data/units';
import { getMap } from '../maps';
import { firstClearGems } from '../meta/gems';
import { getProfile, loadActiveProfile, onProfileChange, updateProfile, type Reward } from '../meta/profile';
import {
  CHAPTERS, STAR_CHEST_THRESHOLDS, chapterLevels, constraintIcon, constraintLabel, getChapter, getLevel, guaranteedHero,
  levelConfig, nextLevel, type CampaignLevel, type ChapterDef,
} from '../campaign/levels';
import {
  chapterStars, chestKey, isChapterUnlocked, isLevelUnlocked, isLevelWon, levelRewards, levelStars,
  nextLevelToPlay, starCount, totalStars, type Progress, type Stars,
} from '../campaign/progress';
import { campaignDeck, commitLevel, getProgress, type CommitResult } from '../campaign/store';
import { clearSavedGame, currentSavedGame, saveGame, savedGameLabel, type SavedGame } from '../meta/savegame'; // Sauvegarde de partie
import { ICONS as KIT } from './kit';
import { CHEST_NAMES } from '../meta/chests';
import { balanceOf, chestMiniSvg, playChests } from './chestOpening';
import { runTotals, totalsHtml } from './rewards';
import { addReward } from '../campaign/progress';

// ---------------------------------------------------------------------------------------------
// Pictogrammes

const INK = '#1d1733';
export const ICONS = {
  star: (on = true) => `<svg class="ic-star${on ? ' on' : ''}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.9l3.05 6.3 6.95.95-5.05 4.85 1.25 6.9L12 17.6l-6.2 3.3 1.25-6.9L2 9.15l6.95-.95z" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/></svg>`,
  wave: `<svg viewBox="0 0 28 24" aria-hidden="true"><path d="M3 4v18" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/><path d="M4.5 4.5c4-2.5 7 2.5 11 0s6-1.5 8.5-.5v9c-2.5-1-4.5-2-8.5.5s-7-2.5-11 0z" fill="#e8413b" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/><path d="M8 7.5c2-.8 3.5.2 5 0" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".7" fill="none"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7.5a5 5 0 0 1 10 0V10" fill="none" stroke="${INK}" stroke-width="3.2"/><path d="M7 10V7.5a5 5 0 0 1 10 0V10" fill="none" stroke="#c9c3d8" stroke-width="1.4"/><rect x="4" y="10" width="16" height="12" rx="3" fill="#b7b0c8" stroke="${INK}" stroke-width="2.6"/><circle cx="12" cy="15.5" r="2" fill="${INK}"/></svg>`,
  check: `<svg class="ic-check" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5 5L20 6" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 12.5l5 5L20 6" fill="none" stroke="#5fd34a" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  pull: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="14" rx="3" fill="#f6c64a" stroke="${INK}" stroke-width="2.2"/><path d="M3 11h18M12 7v14" stroke="${INK}" stroke-width="2"/><path d="M12 7c-2-4-7-4-6-1s6 1 6 1 5 2 6-1-4-3-6 1z" fill="#e8413b" stroke="${INK}" stroke-width="1.8"/></svg>`,
  grid: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="8" height="8" rx="2" fill="#fff"/><rect x="13" y="3" width="8" height="8" rx="2" fill="#fff"/><rect x="3" y="13" width="8" height="8" rx="2" fill="#fff"/><rect x="13" y="13" width="8" height="8" rx="2" fill="#fff"/></svg>`,
  close: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="#fff" stroke-width="3.6" stroke-linecap="round"/></svg>`,
  heart: `<svg viewBox="0 0 24 22" aria-hidden="true"><path d="M12 20C4 14 2 10.5 2 7a5 5 0 0 1 10-1.5A5 5 0 0 1 22 7c0 3.5-2 7-10 13z" fill="#ff4a5a" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/></svg>`,
};

/** Coffre : bois (niveau), or (coffre d'étoiles), rouge (boss). */
export function chestSvg(kind: 'bois' | 'or' | 'boss' = 'bois', open = false): string {
  const c = kind === 'or' ? ['#ffd45a', '#e89a1c', '#a85f10'] : kind === 'boss' ? ['#e8544e', '#b02a35', '#6e1420'] : ['#d9853b', '#b8692e', '#7a3f1a'];
  const band = kind === 'or' ? '#fff3b8' : '#f6c64a';
  const lid = open
    ? `<path d="M8 22 L14 6 H50 L56 22z" fill="${c[0]}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M14 22h36" stroke="#ffe680" stroke-width="5"/>`
    : `<path d="M6 26c0-13 9-21 26-21s26 8 26 21z" fill="${c[0]}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M18 8v18M46 8v18" stroke="${band}" stroke-width="5"/><path d="M18 8v18M46 8v18" stroke="${INK}" stroke-width="1.5" opacity=".35"/>`;
  return `<svg class="chest" viewBox="0 0 64 60" aria-hidden="true">${lid}<path d="M6 26h52v24a5 5 0 0 1-5 5H11a5 5 0 0 1-5-5z" fill="${c[1]}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M8 36h48" stroke="${c[2]}" stroke-width="3"/><path d="M18 27v27M46 27v27" stroke="${band}" stroke-width="5"/><rect x="25" y="${open ? 24 : 20}" width="14" height="16" rx="3" fill="${band}" stroke="${INK}" stroke-width="3.5"/><circle cx="32" cy="${open ? 31 : 27}" r="2.4" fill="${INK}"/><path d="M11 30h6" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".45"/></svg>`;
}

// ---------------------------------------------------------------------------------------------
// Images (URL blob mises en cache pour la session)

const blobCache = new Map<string, string>();
function svgUrl(key: string, make: () => string): string {
  let u = blobCache.get(key);
  if (!u) {
    u = URL.createObjectURL(new Blob([make()], { type: 'image/svg+xml' }));
    blobCache.set(key, u);
  }
  return u;
}
/** Couches de la map en une seule image : fond et décor (+ chemin et plateau si `board`). */
function mapUrl(id: string, board = true): string {
  return svgUrl(`map:${id}:${board ? 1 : 0}`, () => {
    const m = getMap(id);
    const inner = m.layers.filter((l) => l.id === 'fond' || l.id === 'decor' || (board && l.id === 'chemin')).map((l) => l.svg('solo').replace(/^<\?xml[^>]*>/, '')).map((s) => {
      const body = s.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
      return `<g>${body}</g>`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1600" width="1000" height="1600">${inner}</svg>`;
  });
}
const unitUrl = (id: UnitId, pose: 0 | 1 | 2 = 0) => svgUrl(`u:${id}:${pose}`, () => unitSvg(id, pose));
const tokenUrl = (id: UnitId) => svgUrl(`t:${id}`, () => tokenSvg(id, 1, 'classique', { rarity: UNITS[id].rarity }));
const bossUrl = (id: BossId, pose: 0 | 1 | 2 = 0) => svgUrl(`b:${id}:${pose}`, () => bossSvg(id, pose));
const minionUrl = (id: BossId, pose: 0 | 1 | 2 = 0) => svgUrl(`m:${id}:${pose}`, () => minionSvg(id, pose));
const ENEMY_LOOKS = ['normal', 'rapide', 'gros', 'blinde', 'bouclier'] as const;
const enemyUrl = (k: (typeof ENEMY_LOOKS)[number], v: number) => svgUrl(`e:${k}:${v}`, () => enemySvg(k, v));

// ---------------------------------------------------------------------------------------------
// Outils

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', html = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const num = (n: number) => n.toLocaleString('fr-FR');
const hpLabel = (x: number) => `×${x.toFixed(2).replace(/0$/, '').replace('.', ',')}`;
const starsHtml = (s: readonly boolean[]) => `<span class="cp-stars">${[0, 1, 2].map((i) => ICONS.star(!!s[i])).join('')}</span>`;

function vibrate(ms: number): void { try { navigator.vibrate?.(ms); } catch { /* ignoré */ } }

/** Liste des « jetons » de récompense (or, gemmes, parchemins, cristaux, XP, cartes, héros, tirages). */
function rewardChips(r: Reward, opts: { big?: boolean } = {}): string {
  const out: string[] = [];
  const chip = (icon: string, text: string, cls = '') => `<span class="cp-chip${cls ? ` ${cls}` : ''}${opts.big ? ' big' : ''}">${icon}<b>${text}</b></span>`;
  if (r.gold) out.push(chip(KIT.or, `+${num(r.gold)}`, 'gold'));
  if (r.shards) out.push(chip(KIT.gemmes, `+${num(r.shards)}`, 'shards'));
  if (r.scrolls) out.push(chip(KIT.parchemins, `+${r.scrolls}`, 'scrolls'));
  if (r.crystals) out.push(chip(KIT.cristaux, `+${r.crystals}`, 'crystals'));
  if (r.xp) out.push(chip(KIT.xp, `+${r.xp}`, 'xp'));
  for (const c of r.cards ?? []) out.push(chip(`<img alt="" src="${tokenUrl(c.unit)}">`, `${esc(UNITS[c.unit].name)} ×${c.count}`, 'cards'));
  for (const u of r.heroes ?? []) out.push(chip(`<img alt="" src="${tokenUrl(u)}">`, esc(UNITS[u].name), 'hero'));
  for (const f of r.freePulls ?? []) out.push(chip(ICONS.pull, `Tirage gratuit${f.count > 1 ? ` ×${f.count}` : ''}`, 'pull'));
  return out.join('');
}

// ---------------------------------------------------------------------------------------------
// Écran Campagne

export interface CampaignOptions {
  chapter?: number;
  /** Niveau dont la fiche s'ouvre au montage (ex. après « Niveau suivant »). */
  openLevel?: string;
  /** Hôte des panneaux (fiche de niveau, chapitres) au-dessus de l'en-tête et des onglets. */
  overlay?: HTMLElement;
  onChapter: (chapter: number) => void;
  onPlay: (levelId: string) => void;
}

/** Écran Campagne, monté dans `host` (zone de contenu de la coquille) : seule la liste des niveaux défile. */
export function mountCampaign(host: HTMLElement, o: CampaignOptions): () => void {
  let destroyed = false;
  const wrap = el('section', 'cp');
  host.appendChild(wrap);
  const overlay = o.overlay ?? wrap;
  let sheet: HTMLElement | null = null;
  let sheetLevel: string | null = o.openLevel ?? null;
  const chapterN = Math.min(6, Math.max(1, o.chapter ?? currentChapterOf(getProgress())));

  function render(): void {
    if (destroyed) return;
    const prog = getProgress();
    const ch = getChapter(chapterN)!;
    const unlocked = isChapterUnlocked(prog, ch.n);
    const oldList = wrap.querySelector<HTMLElement>('.cp-list');
    const keepScroll = oldList ? oldList.scrollTop : undefined;

    const top = el('div', 'cp-top');
    top.innerHTML = `
      ${artHtml(ch)}
      <button class="cp-chsel" data-a="chapters" aria-label="Changer de chapitre">${ICONS.grid}<span>Chapitres</span></button>
      <span class="cp-pill" aria-label="Étoiles de la campagne">${ICONS.star(true)}<b>${totalStars(prog)}</b><small>/ 180</small></span>
      <div class="cp-banner">
        <span class="cp-crest l"><b class="mr-outline-s">${ch.n}</b></span>
        <h2 class="mr-outline-s"><small>Chapitre ${ch.n}</small>${esc(ch.name)}</h2>
        <span class="cp-crest r"><img alt="" src="${bossUrl(ch.boss)}"></span>
      </div>
      ${gaugeHtml(prog, ch.n)}`;

    const list = el('div', 'cp-list scroll');
    const next = unlocked ? nextLevelToPlay(prog, ch.n) : null;
    if (!unlocked) list.appendChild(el('p', 'cp-locked-note', `${ICONS.lock}<span>Chapitre verrouillé : ${esc(lockReason(prog, ch))}</span>`));
    // Sauvegarde de partie : « Reprendre la partie » en tête de liste.
    const saved = currentSavedGame();
    if (saved?.kind === 'campagne') list.appendChild(el('button', 'mr-btn yellow cp-resume', `<span class="t">Reprendre la partie</span><small>${esc(savedGameLabel(saved))}</small>`)).setAttribute('data-a', 'resume');
    for (const l of chapterLevels(ch.n)) list.appendChild(levelCard(l, prog, next?.id === l.id));
    list.appendChild(nextChapterCard(ch, prog));
    wrap.replaceChildren(top, list);

    top.querySelector('[data-a="chapters"]')!.addEventListener('click', () => openChapters());
    top.querySelectorAll<HTMLElement>('.cp-gchest').forEach((b) => b.addEventListener('click', () => {
      const t = Number(b.dataset['t']);
      const got = !!prog.campaignChests[chestKey(ch.n, t)];
      toast(wrap, `Coffre ${t} ★ : ${chestText(t)}${got ? ' (obtenu)' : ''}`);
    }));
    list.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('[data-a="resume"]')) { location.hash = '#reprendre'; return; } // Sauvegarde de partie
      const nextBtn = (e.target as HTMLElement).closest<HTMLElement>('[data-a="next-chapter"]');
      if (nextBtn) {
        if (ch.n < 6 && isChapterUnlocked(prog, ch.n + 1)) o.onChapter(ch.n + 1);
        return;
      }
      const card = (e.target as HTMLElement).closest<HTMLElement>('[data-level]');
      if (!card) return;
      const id = card.dataset['level']!;
      if (!isLevelUnlocked(prog, id)) {
        card.classList.remove('cp-shake'); void card.offsetWidth; card.classList.add('cp-shake');
        toast(wrap, unlocked ? 'Gagne le niveau précédent pour ouvrir celui-ci.' : `Chapitre verrouillé : ${lockReason(prog, ch)}.`);
        return;
      }
      openSheet(id);
    });

    // Positionné sur le prochain niveau (ou à la même place lors d'un rafraîchissement).
    requestAnimationFrame(() => {
      if (keepScroll !== undefined) { list.scrollTop = keepScroll; return; }
      const target = list.querySelector<HTMLElement>('.cp-card.next') ?? (unlocked && !next ? list.querySelector<HTMLElement>('.cp-next') : null);
      if (!target) return;
      const lr = list.getBoundingClientRect(), tr = target.getBoundingClientRect();
      list.scrollTop = Math.max(0, list.scrollTop + tr.top - lr.top - (lr.height - tr.height) / 2);
    });
  }

  function closeSheet(): void {
    const s = sheet;
    sheet = null;
    sheetLevel = null;
    if (!s) return;
    s.classList.remove('on');
    window.setTimeout(() => s.remove(), 240);
  }

  function openSheet(id: string): void {
    const level = getLevel(id);
    if (!level || !isLevelUnlocked(getProgress(), id)) return;
    sheet?.remove();
    sheetLevel = id;
    sheet = levelSheet(level, {
      onClose: closeSheet,
      onPlay: () => { const s = sheet; sheet = null; sheetLevel = null; s?.remove(); o.onPlay(id); },
    });
    overlay.appendChild(sheet);
    requestAnimationFrame(() => sheet?.classList.add('on'));
  }

  function openChapters(): void {
    sheet?.remove();
    sheet = chaptersSheet(getProgress(), chapterN, {
      onClose: closeSheet,
      onPick: (n) => { closeSheet(); if (n !== chapterN) o.onChapter(n); },
    });
    overlay.appendChild(sheet);
    requestAnimationFrame(() => sheet?.classList.add('on'));
  }

  render();
  if (sheetLevel) openSheet(sheetLevel);
  const off = onProfileChange(() => { if (!sheet) render(); });
  // Le profil n'est peut-être pas encore chargé.
  if (!getProfile()) void loadActiveProfile().catch(() => null);

  return () => {
    destroyed = true;
    off();
    sheet?.remove();
    wrap.remove();
  };
}

function currentChapterOf(p: Progress): number {
  let c = 1;
  for (const ch of CHAPTERS) if (isChapterUnlocked(p, ch.n)) c = ch.n;
  return c;
}

function lockReason(p: Progress, ch: ChapterDef): string {
  const bits: string[] = [];
  if (ch.n > 1 && !isLevelWon(p, `c${ch.n - 1}-n10`)) bits.push(`battre le niveau ${ch.n - 1}-10`);
  const t = totalStars(p);
  if (t < ch.unlockStars) bits.push(`${t} / ${ch.unlockStars} étoiles`);
  return bits.join(' et ');
}

function toast(host: HTMLElement, msg: string): void {
  host.querySelector('.cp-toast')?.remove();
  const t = el('div', 'cp-toast', esc(msg));
  host.appendChild(t);
  window.setTimeout(() => t.remove(), 2200);
}

function chestText(t: number): string {
  if (t === 10) return '1 000 or, 100 gemmes, 5 cartes, 1 parchemin';
  if (t === 20) return '2 000 or, 150 gemmes, 10 cartes, 1 parchemin';
  return '3 000 or, 250 gemmes, 1 tirage gratuit au choix, 2 parchemins';
}

// ---------------------------------------------------------------------------------------------
// Morceaux de l'écran

function artHtml(ch: ChapterDef): string {
  const deck = campaignDeck();
  const heroes = deck.slice(0, 3).map((u, i) => `<img class="cp-art-hero h${i}" alt="" src="${unitUrl(u, 0)}">`).join('');
  return `<div class="cp-art">
    <img class="cp-art-map" alt="" src="${mapUrl(ch.artMap)}">
    <div class="cp-art-sky"></div>
    <img class="cp-art-boss" alt="" src="${bossUrl(ch.boss, 0)}">
    <div class="cp-art-heroes">${heroes}</div>
  </div>`;
}

function gaugeHtml(prog: Progress, chapter: number): string {
  const s = chapterStars(prog, chapter);
  const chests = STAR_CHEST_THRESHOLDS.map((t) => {
    const taken = !!prog.campaignChests[chestKey(chapter, t)];
    return `<button class="cp-gchest${taken ? ' taken' : ''}${s >= t ? ' reached' : ''}" style="left:${(t / 30) * 100}%" data-t="${t}" aria-label="Coffre ${t} étoiles">${chestSvg(t === 30 ? 'boss' : 'or', taken)}${taken ? ICONS.check : ''}<small>${t}</small></button>`;
  }).join('');
  return `<div class="cp-gauge">
    <span class="cp-gauge-n">${ICONS.star(true)}<b>${s}</b>/30</span>
    <div class="cp-track"><i style="width:${(Math.min(30, s) / 30) * 100}%"></i>${chests}</div>
  </div>`;
}

function sceneHtml(l: CampaignLevel): string {
  const looks: (typeof ENEMY_LOOKS)[number][] = [
    ENEMY_LOOKS[(l.n + l.chapter) % 5]!, ENEMY_LOOKS[(l.n * 2 + 1) % 5]!, ENEMY_LOOKS[(l.n + 3) % 5]!,
  ];
  const variant = l.chapter % 3;
  const count = l.boss ? 2 : 3;
  const foes = looks.slice(0, count).map((k, i) => `<img class="cp-foe f${i}" alt="" src="${enemyUrl(k, variant + i)}">`).join('');
  let boss = '';
  if (l.boss?.kind === 'lieutenant') boss = `<span class="cp-portrait silver"><img alt="" src="${minionUrl(l.boss.id, 0)}"></span>`;
  else if (l.boss) boss = `<span class="cp-portrait red"><img alt="" src="${bossUrl(l.boss.id, 0)}"></span>`;
  return `<div class="cp-scene">
    <img class="cp-scene-map" alt="" src="${mapUrl(l.map, false)}" style="object-position:50% ${8 + ((l.n * 37) % 70)}%">
    <div class="cp-foes">${foes}</div>${boss}
  </div>`;
}

function levelCard(l: CampaignLevel, prog: Progress, isNext: boolean): HTMLElement {
  const won = isLevelWon(prog, l.id);
  const open = isLevelUnlocked(prog, l.id);
  const stars = levelStars(prog, l.id);
  const bossy = !!l.boss;
  const card = el('div', `cp-card${bossy ? ' boss' : ''}${isNext ? ' next' : ''}${won ? ' done' : ''}${open ? '' : ' locked'}`);
  card.dataset['level'] = l.id;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `Niveau ${l.n}${open ? '' : ', verrouillé'}`);
  const btn = !open
    ? `<span class="cp-play lock">${ICONS.lock}</span>`
    : `<span class="cp-play ${isNext || !won ? 'yellow' : 'blue'}">${won ? 'Rejouer' : 'Jouer'}</span>`;
  const tag = l.boss ? `<span class="cp-tag ${l.boss.kind === 'boss' ? 'red' : 'silver'}">${l.boss.kind === 'boss' ? 'BOSS' : 'LIEUTENANT'}</span>` : '';
  card.innerHTML = `${sceneHtml(l)}
    <div class="cp-card-ui">
      <div class="cp-card-title"><h3 class="mr-outline-s">Niveau ${l.n}</h3>${tag}</div>
      <div class="cp-card-stars">${starsHtml(stars)}<span class="cp-cicon" title="${esc(constraintLabel(l.bonus, l))}">${constraintIcon(l.bonus)}</span></div>
      <span class="cp-waves" title="${l.waves} vagues">${ICONS.wave}<b class="mr-outline-s">${l.waves}</b></span>
      <span class="cp-reward">${chestSvg(l.n === 10 ? 'boss' : l.n === 5 ? 'or' : 'bois', won)}${won ? ICONS.check : ''}</span>
      ${btn}
    </div>
    <div class="cp-rivets"><i></i><i></i><i></i><i></i></div>`;
  return card;
}

function nextChapterCard(ch: ChapterDef, prog: Progress): HTMLElement {
  const last = ch.n === 6;
  const nextCh = getChapter(ch.n + 1);
  const hero = guaranteedHero(ch, getProfile());
  const owned = !!getProfile()?.heroes[hero] && isLevelWon(prog, `c${ch.n}-n10`);
  const bossWon = isLevelWon(prog, `c${ch.n}-n10`);
  const need = nextCh?.unlockStars ?? 0;
  const total = totalStars(prog);
  const open = nextCh ? isChapterUnlocked(prog, nextCh.n) : false;
  const card = el('div', `cp-next${open ? ' open' : ''}`);
  card.innerHTML = `
    <div class="cp-next-hero${owned || bossWon ? ' revealed' : ''}"><img alt="" src="${unitUrl(hero, 0)}"></div>
    <div class="cp-next-txt">
      <small>${last ? 'Fin de la campagne' : 'Chapitre suivant'}</small>
      <h3 class="mr-outline-s">${last ? 'Vainqueur de Thanos' : `${nextCh!.n} · ${esc(nextCh!.name)}`}</h3>
      <p>Personnage garanti : <b>${bossWon ? esc(UNITS[hero].name) : '???'}</b></p>
      <ul>
        <li class="${bossWon ? 'ok' : ''}">${bossWon ? ICONS.check : '•'} Battre ${esc(ch.n === 6 ? 'Thanos' : (BOSSES[ch.boss].name))} (niveau 10)</li>
        ${last ? '<li>Cadre de profil « Vainqueur de Thanos »</li>' : need > 0 ? `<li class="${total >= need ? 'ok' : ''}">${total >= need ? ICONS.check : '•'} ${ICONS.star(true)} ${Math.min(total, need)} / ${need} étoiles</li>` : ''}
      </ul>
    </div>
    ${!last ? `<button class="cp-play ${open ? 'yellow' : 'lock'}" data-a="next-chapter" ${open ? '' : 'disabled'}>${open ? 'Ouvrir' : ICONS.lock}</button>` : ''}`;
  return card;
}

// ---------------------------------------------------------------------------------------------
// Fiche de niveau (panneau qui monte du bas)

function sheetShell(cls: string, title: string, onClose: () => void): { root: HTMLElement; body: HTMLElement; foot: HTMLElement } {
  const root = el('div', `cp-sheet ${cls}`);
  root.innerHTML = `<div class="cp-sheet-bg"></div><div class="cp-sheet-panel" role="dialog" aria-modal="true">
    <div class="cp-sheet-grip"></div>
    <div class="cp-sheet-head"><h2 class="mr-outline-s">${title}</h2><button class="cp-round small" data-a="close" aria-label="Fermer">${ICONS.close}</button></div>
    <div class="cp-sheet-body scroll"></div><div class="cp-sheet-foot"></div></div>`;
  root.querySelector('.cp-sheet-bg')!.addEventListener('click', onClose);
  root.querySelector('[data-a="close"]')!.addEventListener('click', onClose);
  return { root, body: root.querySelector('.cp-sheet-body')!, foot: root.querySelector('.cp-sheet-foot')! };
}

function levelSheet(l: CampaignLevel, h: { onClose: () => void; onPlay: () => void }): HTMLElement {
  const prog = getProgress();
  const profile = getProfile();
  const stars = levelStars(prog, l.id);
  const won = stars[0];
  const map = getMap(l.map);
  const { root, body, foot } = sheetShell('cp-level-sheet', `Niveau ${l.chapter}-${l.n}`, h.onClose);
  const deck = campaignDeck(profile);
  const preview = levelRewards(l, [true, true, true], prog, deck);
  const rows: [boolean, string, string][] = [
    [stars[0], 'Victoire', `<small>${l.waves} vagues</small>`],
    [stars[1], 'Garder au moins 2 vies', `${ICONS.heart}${ICONS.heart}`],
    [stars[2], esc(constraintLabel(l.bonus, l)), constraintIcon(l.bonus)],
  ];
  let bossBlock: string;
  if (l.boss) {
    const small = l.boss.kind === 'lieutenant';
    const power = small ? LIEUTENANTS[l.boss.id].power : BOSSES[l.boss.id].power;
    bossBlock = `<div class="cp-boss ${small ? 'silver' : 'red'}"><span class="cp-portrait ${small ? 'silver' : 'red'}"><img alt="" src="${small ? minionUrl(l.boss.id, 0) : bossUrl(l.boss.id, 0)}"></span>
      <div><b>${esc(l.boss.name)}</b><small>${small ? 'Lieutenant' : 'Boss'} · vague ${l.boss.wave}${small ? '' : ' · dans son arène'}</small><p>${esc(power.name)} : ${esc(power.description)}</p><p class="win">Le niveau est gagné quand ${small ? 'il' : 'le boss'} tombe.</p></div></div>`;
  } else if (l.waves >= 5) {
    // Rythme §4.3 : lieutenant toutes les 5 vagues, gros boss toutes les 10.
    const at = (from: number) => { const w: number[] = []; for (let x = from; x <= l.waves; x += 10) w.push(x); return w; };
    const list = (w: number[]) => (w.length > 1 ? `aux vagues ${w.slice(0, -1).join(', ')} et ${w[w.length - 1]}` : `à la vague ${w[0]}`);
    const smalls = at(5), bigs = at(10);
    const bits = [
      smalls.length ? `${smalls.length > 1 ? 'des lieutenants' : 'un lieutenant'} ${list(smalls)}` : '',
      bigs.length ? `${bigs.length > 1 ? 'des gros boss' : 'un gros boss'} ${list(bigs)}` : '',
    ].filter(Boolean);
    bossBlock = `<p class="cp-muted">Boss surprise : ${bits.join(' ; ')}.</p>`;
  } else bossBlock = '<p class="cp-muted">Pas de boss : idéal pour apprendre.</p>';
  const decks = profile?.decks.filter((d) => d.length === 5) ?? [];
  const deckTabs = decks.length > 1
    ? `<div class="cp-deck-tabs">${decks.map((_, i) => `<button class="${i === profile!.activeDeck ? 'on' : ''}" data-deck="${i}">Deck ${i + 1}</button>`).join('')}</div>` : '';
  body.innerHTML = `
    ${sceneHtml(l)}
    <div class="cp-obj"><span class="cp-waves">${ICONS.wave}<b class="mr-outline-s">${l.waves}</b></span>
      <div><b>Objectif : tenir ${l.waves} vagues</b><small>Environ ${Math.round(l.waves * 0.55)} min · la partie est sauvegardée à chaque vague</small><small>${esc(map.name)} · PV des ennemis ${hpLabel(l.hpMul)} · ennemis ${hpLabel(l.countMul)}</small></div></div>
    <h4>Étoiles</h4>
    <ul class="cp-star-rows">${rows.map(([on, t, ic], i) => `<li class="${on ? 'on' : ''}">${starsHtml([0, 1, 2].map((k) => k <= i))}<span>${t}</span><i>${on ? ICONS.check : ic}</i></li>`).join('')}</ul>
    <h4>${l.boss ? (l.boss.kind === 'boss' ? 'Boss du niveau' : 'Lieutenant du niveau') : 'Boss'}</h4>
    ${bossBlock}
    <h4>Récompenses ${won ? '(en rejouant, 3 étoiles)' : '(première victoire, 3 étoiles)'}</h4>
    ${firstClearGems(l.chapter) ? `<p class="cp-firstgems${won ? ' done' : ''}">💎 Première victoire : +${firstClearGems(l.chapter)} gemmes${won ? ' (déjà gagnées)' : ''}</p>` : ''}
    <div class="cp-chips">${preview.chest ? `<span class="cp-chip chest">${chestMiniSvg(preview.chest.tier)}<b>${esc(CHEST_NAMES[preview.chest.tier])}</b></span>` : ''}${rewardChips(preview.total)}</div>
    <h4>Ton deck${deckTabs ? '' : ' actif'}</h4>${deckTabs}
    <div class="cp-deck">${deck.map((u) => `<span><img alt="" src="${tokenUrl(u)}"><small>${esc(UNITS[u].name)}</small></span>`).join('')}</div>`;
  foot.innerHTML = `<button class="mr-btn ${won ? '' : 'yellow'} cp-go" data-a="play" data-tuto="level-play">${won ? 'Rejouer' : 'Jouer'}</button>`;
  foot.querySelector('[data-a="play"]')!.addEventListener('click', () => { vibrate(10); h.onPlay(); });
  body.querySelectorAll<HTMLElement>('[data-deck]').forEach((b) => b.addEventListener('click', () => {
    const i = Number(b.dataset['deck']);
    void updateProfile((p) => { p.activeDeck = i; }).then(() => {
      const fresh = levelSheet(l, h);
      fresh.classList.add('on', 'instant');
      root.replaceWith(fresh);
    });
  }));
  return root;
}

function chaptersSheet(prog: Progress, current: number, h: { onClose: () => void; onPick: (n: number) => void }): HTMLElement {
  const { root, body, foot } = sheetShell('cp-chapters-sheet', 'Chapitres', h.onClose);
  foot.remove();
  const total = totalStars(prog);
  body.innerHTML = `<div class="cp-chapters">${CHAPTERS.map((c) => {
    const open = isChapterUnlocked(prog, c.n);
    const s = chapterStars(prog, c.n);
    const prevWon = c.n === 1 || isLevelWon(prog, `c${c.n - 1}-n10`);
    const req = open ? '' : `<small class="req">${prevWon ? '' : `Battre le niveau ${c.n - 1}-10`}${!prevWon && total < c.unlockStars ? ' · ' : ''}${total < c.unlockStars ? `${total} / ${c.unlockStars} ★` : ''}</small>`;
    return `<button class="cp-chap${open ? '' : ' locked'}${c.n === current ? ' cur' : ''}" data-ch="${c.n}" ${open ? '' : 'aria-disabled="true"'}>
      <img class="cp-chap-map" alt="" src="${mapUrl(c.artMap)}">
      <img class="cp-chap-boss" alt="" src="${bossUrl(c.boss)}">
      <span class="cp-chap-txt"><small>Chapitre ${c.n}</small><b class="mr-outline-s">${esc(c.name)}</b>${req || `<span class="cp-chap-stars">${ICONS.star(true)} ${s} / 30</span>`}</span>
      ${open ? '' : `<span class="cp-chap-lock">${ICONS.lock}</span>`}
    </button>`;
  }).join('')}</div>`;
  body.querySelectorAll<HTMLElement>('[data-ch]').forEach((b) => b.addEventListener('click', () => {
    const n = Number(b.dataset['ch']);
    if (!isChapterUnlocked(prog, n)) { b.classList.remove('cp-shake'); void b.offsetWidth; b.classList.add('cp-shake'); return; }
    h.onPick(n);
  }));
  return root;
}

// ---------------------------------------------------------------------------------------------
// Combat de campagne et écran de résultats

export interface CampaignBattleOptions {
  speed?: number;
  seed?: number;
  /** Retour à l'écran du chapitre. */
  onExit: (chapter: number) => void;
  onReplay: () => void;
  /** Niveau suivant : ouvre sa fiche. */
  onNext: (levelId: string) => void;
  /** Sauvegarde de partie : reprise d'une partie sauvegardée de ce niveau. */
  resume?: SavedGame;
}

export async function mountCampaignBattle(root: HTMLElement, levelId: string, o: CampaignBattleOptions): Promise<() => void> {
  const level = getLevel(levelId);
  if (!level || !isLevelUnlocked(getProgress(), levelId)) {
    o.onExit(level?.chapter ?? 1);
    return () => undefined;
  }
  const { mountBattle } = await import('./battle');
  const profile = getProfile();
  const deck = campaignDeck(profile);
  const resume = o.resume?.kind === 'campagne' && o.resume.levelId === level.id ? o.resume : undefined; // Sauvegarde de partie
  const config = resume ? resume.state.config : levelConfig(level, deck, profile, o.seed);
  let overlay: HTMLElement | null = null;
  let gone = false;
  const b = mountBattle(root, {
    deck,
    mapId: level.map,
    seed: config.seed,
    speed: o.speed,
    config,
    title: `Niveau ${level.chapter}-${level.n} · ${getChapter(level.chapter)!.name}`,
    saved: resume?.state.engine, // Sauvegarde de partie
    onWaveSave: (wave, state) => { void saveGame('campagne', level.id, config, state, wave).catch(() => undefined); },
    onHome: () => o.onExit(level.chapter),
    onReplay: o.onReplay,
    onEnd: (result) => {
      void clearSavedGame().catch(() => undefined); // Sauvegarde de partie : partie finie
      const done = commitLevel(level.id, result).catch((err: unknown) => {
        console.error(err);
        return null;
      });
      window.setTimeout(() => {
        void done.then((res) => {
          if (gone || !res) return;
          overlay = resultsScreen(res, o);
          root.appendChild(overlay);
          requestAnimationFrame(() => overlay?.classList.add('on'));
        });
      }, 900);
      return true;
    },
  });
  return () => { gone = true; overlay?.remove(); b.destroy(); };
}

function resultsScreen(res: CommitResult, o: CampaignBattleOptions): HTMLElement {
  const { level, outcome, earned, rewards, chest } = res;
  const won = outcome.won;
  const prog = getProgress();
  const next = nextLevel(level);
  const nextOpen = !!next && won && isLevelUnlocked(prog, next.id);
  const labels = ['Victoire', '2 vies ou plus', constraintLabel(level.bonus, level)];
  const prevBest = rewards.stars; // meilleur résultat après ce combat
  const wrap = el('div', `cp-results${won ? ' win' : ' lose'}`);
  const starsBig = [0, 1, 2].map((i) => {
    const isNew = earned[i] && !rewards.prev[i];
    return `<div class="cp-rstar s${i}${earned[i] ? ' on' : ''}" style="--d:${0.45 + i * 0.45}s">${ICONS.star(earned[i])}${isNew ? '<em>Nouveau !</em>' : ''}<small>${esc(labels[i]!)}</small></div>`;
  }).join('');
  // Lignes détaillées : récompenses fixes, coffre de victoire, butin des boss, cristaux du jour, XP.
  const fixed = rewards.lines.filter((x) => x.kind !== 'xp');
  const extra: { label: string; html: string }[] = [];
  if (chest) {
    extra.push({
      label: `${CHEST_NAMES[chest.tier]}${chest.small ? ' (rejouer)' : ''}`,
      // Les cartes, déjà montrées une à une à l'ouverture, sont résumées en une pastille.
      html: rewardChips({ gold: chest.gold, shards: chest.gems, crystals: chest.crystals, scrolls: chest.scrolls, heroes: chest.heroes })
        + (chest.cards.length ? `<span class="cp-chip cards">${KIT.cartes}<b>+${chest.cards.reduce((n, c) => n + c.count, 0)} cartes</b></span>` : ''),
    });
  }
  if (res.bossGold) extra.push({ label: `Butin des boss (${outcome.bossKills.length})`, html: rewardChips({ gold: res.bossGold }) });
  if (res.dailyCrystals) extra.push({ label: 'Premier gros boss du jour', html: rewardChips({ crystals: res.dailyCrystals }) });
  let total = rewards.total;
  if (chest) total = addReward(total, { gold: chest.gold, shards: chest.gems, crystals: chest.crystals, scrolls: chest.scrolls });
  total = addReward(total, { gold: res.bossGold, crystals: res.dailyCrystals });
  const rows = [
    ...extra.map((x) => `<div class="cp-rline"><span>${esc(x.label)}</span><div class="cp-chips">${x.html}</div></div>`),
    ...fixed.map((x) => `<div class="cp-rline"><span>${x.kind === 'coffre' ? chestSvg('or', true) : ''}${esc(x.label)}</span><div class="cp-chips">${rewardChips(x.reward)}</div></div>`),
  ];
  const listHtml = `<div class="cp-rlines">${rows.map((r, i) => r.replace('class="cp-rline"', `class="cp-rline" style="--d:${0.1 + 0.12 * i}s"`)).join('')}</div>
    <div class="cp-rsum rw-total">${totalsHtml({ gold: total.gold, shards: total.shards, crystals: total.crystals, scrolls: total.scrolls, xp: total.xp })}</div>`;
  const chestBlock = chest
    ? `<button class="cp-rchest" data-a="chest" data-tuto="results-chest">${chestMiniSvg(chest.tier)}<span><b>${esc(CHEST_NAMES[chest.tier])}</b><small>${chest.small ? 'Coffre réduit (niveau rejoué)' : earned.every(Boolean) ? '3 étoiles : coffre amélioré !' : 'Touche pour l’ouvrir'}</small></span><em>Ouvrir</em></button>`
    : '';
  const rewardsHtml = won
    ? `<div class="cp-rreward">${chest && res.credited ? chestBlock : listHtml}</div>
       ${res.credited ? '' : '<p class="cp-muted">Aucun profil actif : les récompenses ne sont pas créditées.</p>'}`
    : `<p class="cp-lose-txt">Vague ${outcome.wave} / ${level.waves} atteinte.<br><small>Fusionne plus tôt et améliore l’unité la plus présente.</small></p>
       ${res.bossGold ? `<div class="cp-rlines"><div class="cp-rline" style="--d:.3s"><span>Butin des boss (${outcome.bossKills.length})</span><div class="cp-chips">${rewardChips({ gold: res.bossGold })}</div></div></div>` : ''}`;
  wrap.innerHTML = `<div class="cp-results-panel">
    <div class="cp-rhead"><small>Niveau ${level.chapter}-${level.n} · ${esc(getMap(level.map).name)}</small><h2 class="mr-outline-s">${won ? 'Victoire !' : 'Défaite'}</h2></div>
    <div class="cp-rstars">${starsBig}</div>
    <div class="cp-rtotal">${starsHtml(prevBest)} <span>Meilleur résultat : ${starCount(prevBest)} / 3</span></div>
    ${rewardsHtml}
    <div class="cp-rbtns">
      ${nextOpen ? `<button class="mr-btn yellow" data-a="next">Niveau suivant</button>` : ''}
      <button class="mr-btn ${won && nextOpen ? '' : 'yellow'}" data-a="replay">Rejouer</button>
      <button class="mr-btn ghost" data-a="exit">Campagne</button>
    </div></div>`;
  const showList = () => {
    const box = wrap.querySelector<HTMLElement>('.cp-rreward');
    if (!box) return;
    box.innerHTML = listHtml;
    box.classList.add('revealed');
    runTotals(box, 150 + rows.length * 120);
  };
  if (won && !(chest && res.credited)) runTotals(wrap, 1900 + rows.length * 120);
  let opening = false;
  wrap.addEventListener('click', async (e) => {
    const a = (e.target as HTMLElement).closest<HTMLElement>('[data-a]')?.dataset['a'];
    if (a === 'chest' && chest && !opening) {
      opening = true;
      await playChests(wrap, [{ content: chest, subtitle: `Victoire · niveau ${level.chapter}-${level.n}` }], balanceOf(getProfile()));
      showList();
      return;
    }
    if (a === 'next' && next) o.onNext(next.id);
    if (a === 'replay') o.onReplay();
    if (a === 'exit') o.onExit(level.chapter);
  });
  if (won) window.setTimeout(() => vibrate(30), 500);
  return wrap;
}

export type { Stars };
