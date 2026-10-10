// Fiche de héros unique (Collection, Decks, Encyclopédie ; possédé ou non), reprise de la fiche d'unité de
// Rush Royale (design/references/ecrans/rr-fiche-unite-*.png) : panneau ardoise-bleu au-dessus d'un écran
// assombri, titre « Nom / Carte légendaire », croix rouge, flèches pour passer au héros voisin, et une barre
// de 5 onglets :
// - Principal : grande illustration (fiche chiffrée si disponible, sinon le chibi qui joue sa boucle
//   d'attaque sur une scène aux couleurs de son univers), jeton « Niv. X », barre de cartes, tuiles de
//   stats (Offensif avec le gain du niveau suivant en vert), récompense d'amélioration, boutons
//   Sélectionner / Améliorer / ▲ (éveil) ;
// - Stats : toutes les tuiles, avec aperçu en direct du rang de fusion, de l'amélioration en partie et
//   du niveau de collection ;
// - Talents : arbre façon Rush Royale (deux colonnes reliées aux nœuds de niveau, chemin choisi en vert) ;
// - Éveil : étoiles, coût, passifs ;
// - Info : description complète de la compétence (chiffres en couleur), équipes, carte.
import './heroSheet.css';
import { ficheUrl } from '../access/fiches';
import { passivesFor } from '../data/awakenings';
import { HERO_CATEGORIES, categoriesFor, rangeLabel } from '../data/categories';
import { FINAL_TALENT_LEVEL, TALENT_TIER_LEVELS, TALENT_TIER_SCROLLS, finalTalentOf, talentsFor } from '../data/talents';
import { TEAM_LIST } from '../data/teams';
import type { TalentDef, UnitId } from '../data/types';
import { UNITS, UNIT_IDS } from '../data/units';
import {
  AWAKENING_ATTACK_PER_STAR, AWAKENING_SPEED_PER_STAR, MAX_AWAKENING, MAX_HERO_LEVEL, awaken, awakeningCost, canAfford,
  chooseTalent, levelUp, levelUpCost, missingFor, talentTierState, type TalentTier,
} from '../meta/economy';
import { emitMeta } from '../meta/events';
import { getProfile, onProfileChange, updateProfile, type HeroState, type Profile } from '../meta/profile';
import { heroProgress } from './heroCard';
import { abilityStats, coreStats, type StatCtx, type StatIcon, type StatTile } from './heroStats';
import { RARITY_LABEL, attackLoop, el, esc, figureUrl, fmt, icon, packColors, packLabel, portraitUrl, toast, type Sheet } from './kit';

export type HeroSheetTab = 'principal' | 'stats' | 'talents' | 'eveil' | 'info';

export interface HeroSheetOptions {
  /** Propose « Sélectionner » (mettre dans le deck). Absent : héros déjà dans le deck affiché. */
  onDeck?: (id: UnitId) => void;
  go: (hash: string) => void;
  /** Ordre de navigation des flèches (défaut : tous les héros). */
  list?: readonly UnitId[];
  /** Appelé quand on passe à un autre héros avec les flèches (l'Encyclopédie met à jour l'adresse). */
  onBrowse?: (id: UnitId) => void;
  tab?: HeroSheetTab;
}

export interface HeroSheet extends Sheet {
  /** Affiche un autre héros dans la même fiche. */
  show(id: UnitId): void;
  readonly unit: UnitId;
}

const TARGETING: Record<string, string> = { premier: 'Premier', aleatoire: 'Au hasard', fort: 'Le plus fort' };
const TAB_LABEL: Record<HeroSheetTab, string> = { principal: 'Principal', stats: 'Stats', talents: 'Talents', eveil: 'Éveil', info: 'À propos du héros' };
const TABS: HeroSheetTab[] = ['principal', 'stats', 'talents', 'eveil', 'info'];
const pctS = (x: number) => `${Math.round(x * 100)} %`;
/** Portée en un mot (tuiles). */
const rangeWord = (r: Parameters<typeof rangeLabel>[0]) => { const l = rangeLabel(r); return l === 'toute la map' ? 'Globale' : l.charAt(0).toUpperCase() + l.slice(1); };

// ------------------------------------------------------------------ icônes (contour encre, style des planches)
const INK = '#1d1733';
const SVG = (body: string, vb = '0 0 48 48') => `<svg viewBox="${vb}" aria-hidden="true">${body}</svg>`;
const SWORD = `<path d="M33 7 L41 7 L41 15 L22 34 L14 26Z" fill="#cfe6ff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M35 11 L24 22" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><path d="M10 24 L24 38" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M10 24 L24 38" stroke="#f6c64a" stroke-width="4" stroke-linecap="round"/><path d="M15 33 L8 40" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M15 33 L8 40" stroke="#e8823a" stroke-width="4" stroke-linecap="round"/>`;
const STAT_SVG: Record<StatIcon, string> = {
  epee: SVG(SWORD),
  vitesse: SVG(`<g transform="translate(4 2) scale(.85)">${SWORD}</g><path d="M4 12 h9 M2 19 h8 M6 5 h8" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/><path d="M4 12 h9 M2 19 h8 M6 5 h8" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`),
  zone: SVG(`<path d="M24 3 l5 11 12 -4 -5 12 11 6 -12 4 3 12 -12 -6 -6 11 -4 -12 -12 1 7 -10 -9 -9 12 -2z" fill="#ffb53d" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><circle cx="24" cy="25" r="7" fill="#fff3b0" stroke="${INK}" stroke-width="2.5"/>`),
  max: SVG(`<g transform="translate(0 -3)">${SWORD}</g><rect x="16" y="33" width="30" height="13" rx="4" fill="#5fd068" stroke="${INK}" stroke-width="2.6"/><text x="31" y="43.5" text-anchor="middle" font-family="Lilita One, sans-serif" font-size="11" fill="#fff" stroke="${INK}" stroke-width="2.4" paint-order="stroke">MAX</text>`),
  cible: SVG(`<circle cx="24" cy="24" r="14" fill="none" stroke="${INK}" stroke-width="7"/><circle cx="24" cy="24" r="14" fill="none" stroke="#e8f2ff" stroke-width="3.5"/><path d="M24 2 v12 M24 34 v12 M2 24 h12 M34 24 h12" stroke="${INK}" stroke-width="7" stroke-linecap="round"/><path d="M24 4 v9 M24 35 v9 M4 24 h9 M35 24 h9" stroke="#e8f2ff" stroke-width="3" stroke-linecap="round"/><circle cx="24" cy="24" r="4" fill="#e8413b" stroke="${INK}" stroke-width="2.5"/>`),
  portee: SVG(`<circle cx="24" cy="24" r="19" fill="#bfe0ff" stroke="${INK}" stroke-width="3" stroke-dasharray="5 4"/><path d="M10 38 L36 12" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M10 38 L36 12" stroke="#c8925a" stroke-width="2.6" stroke-linecap="round"/><path d="M30 10 L40 8 L38 18Z" fill="#dfe8f0" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>`),
  temps: SVG(`<circle cx="24" cy="26" r="17" fill="#fff6d8" stroke="${INK}" stroke-width="3.5"/><path d="M24 15 v11 l7 5" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/><rect x="19" y="3" width="10" height="6" rx="2" fill="#f6c64a" stroke="${INK}" stroke-width="2.5"/>`),
  mana: SVG(`<path d="M24 4 C32 16 39 23 39 31 a15 15 0 0 1 -30 0 C9 23 16 16 24 4Z" fill="#4fb0ff" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/><path d="M16 30 a8 8 0 0 0 6 8" fill="none" stroke="#dff2ff" stroke-width="3" stroke-linecap="round"/>`),
  aura: SVG(`<path d="M14 40 V24 H7 L18 10 L29 24 H22 V40Z" fill="#5fd068" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M30 40 V30 H25 L34 18 L43 30 H38 V40Z" fill="#9cf06a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`),
  crit: SVG(`<path d="M27 3 L10 27 H22 L18 45 L38 18 H26Z" fill="#ffe14a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`),
  controle: SVG(`<path d="M24 24 m0 -3 a3 3 0 1 1 -3 3 a7 7 0 0 1 7 -7 a10 10 0 0 1 10 10 a14 14 0 0 1 -14 14 a17 17 0 0 1 -17 -17" fill="none" stroke="${INK}" stroke-width="6.5" stroke-linecap="round"/><path d="M24 24 m0 -3 a3 3 0 1 1 -3 3 a7 7 0 0 1 7 -7 a10 10 0 0 1 10 10 a14 14 0 0 1 -14 14 a17 17 0 0 1 -17 -17" fill="none" stroke="#b58cff" stroke-width="3" stroke-linecap="round"/>`),
  bouclier: SVG(`<path d="M24 4 L40 10 V24 C40 34 32 41 24 44 C16 41 8 34 8 24 V10Z" fill="#5aa0ff" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/><path d="M24 10 L34 14 V24 C34 30 30 35 24 38Z" fill="#9fd0ff"/>`),
  univers: SVG(`<path d="M24 3 L42 12 V36 L24 45 L6 36 V12Z" fill="#3fb8a8" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/><path d="M24 11 l4 8 9 1 -7 6 2 9 -8 -5 -8 5 2 -9 -7 -6 9 -1z" fill="#ffd84a" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>`),
  type: SVG(`<path d="M15 6 C22 12 24 20 24 26 a9 9 0 0 1 -18 0 C6 20 9 12 15 6Z" fill="#f2793b" stroke="${INK}" stroke-width="2.8"/><path d="M33 6 C40 12 42 20 42 26 a9 9 0 0 1 -18 0 C24 20 27 12 33 6Z" fill="#9b59e6" stroke="${INK}" stroke-width="2.8"/><path d="M24 18 C31 24 33 32 33 37 a9 9 0 0 1 -18 0 C15 32 18 24 24 18Z" fill="#3c8bf0" stroke="${INK}" stroke-width="2.8"/>`),
};
const statIcon = (k: StatIcon) => `<i class="fs-si">${STAT_SVG[k]}</i>`;

const TAB_SVG: Record<HeroSheetTab, string> = {
  principal: SVG(`<path d="M24 5 C36 5 42 16 42 28 V40 H6 V28 C6 16 12 5 24 5Z" fill="#fff" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><path d="M13 30 C16 22 32 22 35 30 L32 36 H16Z" fill="${INK}"/><circle cx="19" cy="30" r="2.4" fill="#9fd8ff"/><circle cx="29" cy="30" r="2.4" fill="#9fd8ff"/>`),
  stats: SVG(`<rect x="5" y="22" width="10" height="20" rx="3" fill="#fff" stroke="${INK}" stroke-width="3.5"/><rect x="19" y="8" width="10" height="34" rx="3" fill="#fff" stroke="${INK}" stroke-width="3.5"/><rect x="33" y="16" width="10" height="26" rx="3" fill="#fff" stroke="${INK}" stroke-width="3.5"/>`),
  talents: SVG(`<path d="M24 3 L45 24 L24 45 L3 24Z" fill="#fff" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><circle cx="24" cy="13" r="3.4" fill="${INK}"/><circle cx="24" cy="35" r="3.4" fill="${INK}"/><circle cx="13" cy="24" r="3.4" fill="${INK}"/><circle cx="35" cy="24" r="3.4" fill="${INK}"/>`),
  eveil: SVG(`<path d="M24 6 L32 18 H27 V40 H21 V18 H16Z" fill="#fff" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/><path d="M19 26 C12 24 7 18 4 10 C10 13 15 14 19 18" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M29 26 C36 24 41 18 44 10 C38 13 33 14 29 18" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`),
  info: SVG(`<rect x="7" y="5" width="34" height="38" rx="7" fill="#fff" stroke="${INK}" stroke-width="3.5"/><circle cx="24" cy="14" r="3.5" fill="${INK}"/><path d="M24 21 V35" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`),
};

/** Formes de rang de fusion (pips façon dé, 1 à 7). */
const PIPS: Record<number, [number, number][]> = {
  1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]],
  5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
  7: [[0, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [2, 2]],
};
const rankShape = (r: number) => SVG((PIPS[r] ?? PIPS[1]!).map(([x, y]) => `<circle cx="${10 + x * 14}" cy="${10 + y * 14}" r="5.2" fill="#fff" stroke="${INK}" stroke-width="2.6"/>`).join(''), '0 0 48 48');
const POTION = SVG(`<path d="M19 4 h10 v9 C38 16 42 23 42 30 a18 18 0 0 1 -36 0 C6 23 10 16 19 13Z" fill="#7fd6ff" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/><path d="M8 30 a16 16 0 0 0 32 0Z" fill="#2f9be0"/><rect x="17" y="2" width="14" height="6" rx="2" fill="#c8925a" stroke="${INK}" stroke-width="2.6"/><circle cx="17" cy="24" r="3" fill="#fff"/>`);
const UP_ARROW = SVG(`<path d="M24 3 L45 24 H33 V44 H15 V24 H3Z" fill="#5ab4ff" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><path d="M24 10 L36 22" stroke="#d6efff" stroke-width="3" stroke-linecap="round"/>`);

/** Icône d'un talent : buste du héros + pictogramme selon ses paramètres. */
function talentGlyph(t: TalentDef): StatIcon {
  const k = Object.keys(t.params).join(' ');
  if (/immune|shield|bossEffect/i.test(k)) return 'bouclier';
  if (/mana|Mana/.test(k)) return 'mana';
  if (/attackSpeed|Speed|speed/.test(k)) return 'vitesse';
  if (/crit|Crit|rogue/.test(k)) return 'crit';
  if (/stun|Stun|slow|Slow|teleport|net|stasis|knock/.test(k)) return 'controle';
  if (/aura|formation|unity|boost/i.test(k)) return 'aura';
  if (/splash|area|Area|radius|Radius|Targets|extra|chain|hammer/.test(k)) return 'zone';
  if (/rampMax/.test(k)) return 'max';
  if (/Cooldown|Duration|duration/.test(k)) return 'temps';
  return 'epee';
}

/** Texte de compétence : chiffres en bleu, mots-clés et noms en orange (fiche Rush Royale). */
function rich(text: string, names: readonly string[] = []): string {
  // Découpe le texte brut (avant échappement) : chiffres, puis mots-clés et noms.
  const keys = ['mode actif', ...names].filter(Boolean).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const re = new RegExp(`(1, 3, 5 ou 7|×\\s?\\d+(?:,\\d+)?|[+−-]?\\d+(?:[,.]\\d+)?(?:\\s?%|\\s?s\\b|\\s?cases?\\b)?)|(${keys.join('|') || '$^'})`, 'g');
  const para = (t: string) => {
    let out = '', last = 0;
    for (const m of t.matchAll(re)) {
      out += esc(t.slice(last, m.index));
      out += m[1] ? `<b class="n">${esc(m[1].replace(/\s/g, '\u00a0'))}</b>` : `<b class="k">${esc(m[0])}</b>`;
      last = (m.index ?? 0) + m[0].length;
    }
    return out + esc(t.slice(last));
  };
  return text.split('\n').map((p) => `<p>${para(p)}</p>`).join('');
}

export function openHeroSheet(host: HTMLElement, first: UnitId, o: HeroSheetOptions): HeroSheet {
  const order = (o.list && o.list.length ? o.list : UNIT_IDS).slice();
  let id: UnitId = first;
  let tab: HeroSheetTab = o.tab ?? 'principal';
  // Aperçus de l'onglet Stats (rang de fusion, amélioration en partie, niveau de collection).
  let pv = { rank: 1, powerUp: 1, level: 0 };
  let selTalent: { tier: 1 | 2 | 3 | 4; opt: 0 | 1 } | null = null;
  let infoTab: 'competence' | 'equipes' | 'carte' = 'competence';
  let stopLoop: (() => void) | null = null;

  const wrap = el('div', 'fs-wrap');
  wrap.innerHTML = `<div class="fs-veil"></div>
    <button class="fs-arrow prev" data-a="prev" aria-label="Héros précédent"></button>
    <button class="fs-arrow next" data-a="next" aria-label="Héros suivant"></button>
    <div class="fs-panel" role="dialog" aria-modal="true">
      <header class="fs-head"><span class="fs-mini"></span><div class="fs-titles"><h2></h2><small></small></div>
        <button class="fs-close" data-a="close" aria-label="Fermer" data-tuto="sheet-close">${SVG(`<path d="M14 14 L34 34 M34 14 L14 34" stroke="${INK}" stroke-width="11" stroke-linecap="round"/><path d="M14 14 L34 34 M34 14 L14 34" stroke="#fff" stroke-width="5.5" stroke-linecap="round"/>`)}</button></header>
      <div class="fs-body"></div>
      <nav class="fs-tabs" role="tablist">${TABS.map((t) => `<button role="tab" data-tab="${t}" aria-label="${TAB_LABEL[t]}">${TAB_SVG[t]}<span>${t === 'info' ? 'Info' : TAB_LABEL[t]}</span></button>`).join('')}</nav>
    </div>`;
  host.appendChild(wrap);
  const body = wrap.querySelector<HTMLElement>('.fs-body')!;
  const panel = wrap.querySelector<HTMLElement>('.fs-panel')!;
  const closers: (() => void)[] = [];
  let closed = false;

  const profile = (): Profile | null => getProfile();
  const hero = (p: Profile | null): HeroState | null => p?.heroes[id] ?? null;
  const ctxOf = (h: HeroState | null, preview = false): StatCtx => ({
    level: preview && pv.level ? pv.level : h?.level ?? 1,
    rank: preview ? pv.rank : 1,
    powerUp: preview ? pv.powerUp : 1,
    stars: h?.awakening ?? 0,
    talents: (h?.talents ?? []).map((x) => (x === 0 ? 'a' : x === 1 ? 'b' : undefined)).filter((x): x is 'a' | 'b' => !!x),
  });

  function tile(t: StatTile, cls = ''): string {
    return `<div class="fs-tile ${cls}${t.next ? ' up' : ''}">${statIcon(t.icon)}<span class="fs-tl">${esc(t.label)}\u00a0:</span><b class="fs-tv">${esc(t.value)}${t.next ? ` <em>${esc(t.next)}</em>` : ''}</b></div>`;
  }

  // ---------------------------------------------------------------- Principal
  function mainTab(p: Profile | null, h: HeroState | null): string {
    const u = UNITS[id];
    const [c1, c2] = packColors(u.pack);
    const c = ctxOf(h);
    const core = coreStats(id, c);
    const ab = abilityStats(id, c);
    const tiles = [core.offense, core.interval, ...ab.slice(0, 1), { key: 'range', label: 'Portée', value: rangeWord(u.range), icon: 'portee' as StatIcon }];
    const g = h ? heroProgress(h, p) : null;
    const lc = h ? levelUpCost(h) : null;
    const miss = h && p && lc ? missingFor(p, h, lc) : 'Non possédé';
    const w = g && g.need ? Math.min(100, (g.have / g.need) * 100) : 100;
    const stars = h && h.awakening ? `<span class="fs-stars">★${h.awakening}</span>` : '';
    const bar = !h ? '<span class="fs-cbar off"><span>À trouver dans les tirages</span></span>'
      : g!.kind === 'max' ? '<span class="fs-cbar max"><i style="width:100%"></i><span>MAX</span></span>'
        : `<span class="fs-cbar ${g!.kind}${g!.ready ? ' ready' : ''}"><i style="width:${w}%"></i><b class="fs-cup">${g!.kind === 'eveil' ? '★' : UP_ARROW}</b><span>${g!.have}/${g!.need}</span></span>`;
    const inDeck = !o.onDeck;
    const reward = h && lc ? `<p class="fs-reward">Récompense d’amélioration : ${icon('xp')}<b>${10 * (h.level + 1)} XP</b></p>` : `<p class="fs-reward">${h ? 'Niveau maximal : place à l’éveil !' : 'Trouve ce héros dans les tirages.'}</p>`;
    const upBtn = !h ? `<button class="fs-btn grey" aria-disabled="true"><span>Améliorer</span><small>Non possédé</small></button>`
      : lc ? `<button class="fs-btn ${miss ? 'grey' : 'gold'}" data-a="up" data-tuto="hero-upgrade" ${miss ? 'aria-disabled="true"' : ''}><span>Améliorer</span><small>${icon('or')}<b class="${(p?.gold ?? 0) < lc.gold ? 'no' : ''}">${fmt(lc.gold)}</b>${icon('cartes')}<b class="${h.cards < lc.cards ? 'no' : ''}">${lc.cards}</b></small></button>`
        : `<button class="fs-btn purple" data-a="tab" data-to="eveil" data-tuto="hero-awaken"><span>Éveil</span><small>★${h.awakening}/${MAX_AWAKENING}</small></button>`;
    const selBtn = !h ? `<button class="fs-btn orange" data-a="packs"><span>Trouver</span></button>`
      : inDeck ? `<button class="fs-btn orange on" aria-disabled="true"><span>✔ Dans le deck</span></button>`
        : `<button class="fs-btn orange" data-a="deck" data-tuto="hero-to-deck"><span>Sélectionner</span></button>`;
    return `<div class="fs-main">
      <div class="fs-art" style="--u1:${c1};--u2:${c2}">
        <div class="fs-scene"><i class="fs-rays"></i><i class="fs-pod"></i></div>
        <div class="fs-bgimg"></div>
        <img class="fs-fig${h ? '' : ' unowned'}" alt="" src="${figureUrl(id, 0)}">
        <div class="fs-badge"><span class="fs-token"><img src="${portraitUrl(id)}" alt=""></span>${stars}<span class="fs-lv">${h ? `Niv. ${h.level}` : 'Niv. —'}</span></div>
        <div class="fs-cards">${bar}<button class="fs-plus" data-a="packs" aria-label="Obtenir des cartes">＋</button></div>
        <div class="fs-side"><span title="${esc(packLabel(u.pack))}">${STAT_SVG.univers}</span><span title="${esc(TARGETING[u.targeting] ?? '')}">${STAT_SVG.cible}</span></div>
      </div>
      <div class="fs-tiles">${tiles.map((t) => tile(t)).join('')}</div>
      ${reward}
      <div class="fs-btns">${selBtn}${upBtn}<button class="fs-btn blue fs-eveil" data-a="tab" data-to="eveil" aria-label="Éveil">${SVG(`<path d="M6 34 L24 12 L42 34Z" fill="#fff" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`)}</button></div>
    </div>`;
  }

  // ---------------------------------------------------------------- Stats
  function statsTab(h: HeroState | null): string {
    const u = UNITS[id];
    const c = ctxOf(h, true);
    const core = coreStats(id, c);
    const cats = categoriesFor(u);
    const tiles: string[] = [
      tile({ key: 'pack', label: 'Univers', value: packLabel(u.pack), icon: 'univers' }, 'wide2'),
      tile({ key: 'type', label: 'Type d’unité', value: u.role, icon: 'type' }),
      tile({ key: 'target', label: 'Cible', value: TARGETING[u.targeting] ?? u.targeting, icon: 'cible' }),
      tile(core.offense),
      tile(core.interval),
      tile({ key: 'range', label: 'Portée', value: rangeWord(u.range), icon: 'portee' }),
      tile({ key: 'cats', label: 'Catégories', value: cats.map((k) => HERO_CATEGORIES[k].icon).join(' ') || '—', icon: 'aura' }),
      ...abilityStats(id, c).map((t) => tile(t)),
    ];
    const lvl = c.level;
    return `<div class="fs-content scroll"><div class="fs-grid">${tiles.join('')}</div></div>
      <div class="fs-prev">
        <button class="fs-pbtn" data-a="pv-rank" aria-label="Rang de fusion ${pv.rank}">${rankShape(pv.rank)}<span>Rang ${pv.rank}</span></button>
        <button class="fs-pbtn" data-a="pv-pu" aria-label="Amélioration en partie ${pv.powerUp}">${POTION}<span>L.${pv.powerUp}</span></button>
        <button class="fs-pbtn" data-a="pv-lv" aria-label="Niveau de collection ${lvl}">${UP_ARROW}<span>L.${lvl}</span></button>
      </div>`;
  }

  // ---------------------------------------------------------------- Talents
  function talentsTab(p: Profile | null, h: HeroState | null): string {
    const all = talentsFor(id);
    const fin = finalTalentOf(id);
    const level = h?.level ?? 0;
    const tiers = [1, 2, 3] as TalentTier[];
    const state = (t: TalentTier) => (h && p ? talentTierState(p, h, t) : 'niveau');
    const chosen = (t: TalentTier) => h?.talents[t - 1] ?? null;
    if (!selTalent) {
      const last = tiers.filter((t) => chosen(t) != null).pop();
      selTalent = last ? { tier: last, opt: chosen(last) as 0 | 1 } : { tier: 1, opt: 0 };
    }
    const sel = selTalent.tier === 4 ? fin : all.filter((x) => x.tier === selTalent!.tier)[selTalent.opt];
    const tileOf = (t: TalentDef | undefined, tier: TalentTier | 4, opt: 0 | 1, picked: boolean, locked: boolean) => !t ? '<span></span>' : `
      <button class="fs-tal ${opt ? 'b' : 'a'}${picked ? ' picked' : ''}${locked ? ' locked' : ''}${selTalent!.tier === tier && selTalent!.opt === opt ? ' sel' : ''}" data-a="tal" data-tier="${tier}" data-opt="${opt}" data-tuto="talent-${tier}-${opt}">
        <span class="fs-tico"><img src="${portraitUrl(id, opt ? 2 : 1)}" alt=""><i>${STAT_SVG[talentGlyph(t)]}</i>${locked ? `<em class="fs-lock">${icon('lock')}</em>` : ''}</span>
        <b>${esc(t.name)}</b></button>`;
    const rows = tiers.map((t, i) => {
      const opts = all.filter((x) => x.tier === t);
      const ch = chosen(t);
      const st = state(t);
      const locked = st === 'niveau';
      const nextPicked = i < 2 ? chosen(tiers[i + 1]!) != null : !!(fin && level >= FINAL_TALENT_LEVEL && ch != null);
      return `<div class="fs-trow t${t}${ch === 0 ? ' pick-a' : ch === 1 ? ' pick-b' : ''}${nextPicked ? ' down' : ''}${locked ? ' locked' : ''}${st === 'ouvrable' ? ' open' : ''}">
        <i class="fs-hl a"></i><i class="fs-hl b"></i>
        ${tileOf(opts[0], t, 0, ch === 0, locked)}
        <span class="fs-node n${t}${locked ? ' locked' : ''}"><b>${TALENT_TIER_LEVELS[t]}</b></span>
        ${tileOf(opts[1], t, 1, ch === 1, locked)}
      </div>`;
    }).join('');
    const finRow = fin ? `<div class="fs-trow fin${level >= FINAL_TALENT_LEVEL && chosen(3) != null ? ' pick-f' : ''}">
        <span class="fs-deco l"></span>${tileOf(fin, 4, 0, level >= FINAL_TALENT_LEVEL && chosen(3) != null, level < FINAL_TALENT_LEVEL)}<span class="fs-deco r"></span>
        <span class="fs-node nf${level < FINAL_TALENT_LEVEL ? ' locked' : ''}"><b>${FINAL_TALENT_LEVEL}</b></span></div>` : '';
    // Action du talent sélectionné.
    let action = '';
    if (sel && selTalent.tier !== 4 && h && p) {
      const t = selTalent.tier as TalentTier;
      const st = talentTierState(p, h, t);
      const isChosen = chosen(t) === selTalent.opt;
      action = isChosen ? '<span class="fs-tstate ok">✔ Talent choisi</span>'
        : st === 'choisi' ? `<button class="fs-btn small green" data-a="choose">Changer (gratuit)</button>`
          : st === 'ouvrable' ? `<button class="fs-btn small gold" data-a="choose">Choisir · ${icon('parchemins')} ${TALENT_TIER_SCROLLS[t]}</button>`
            : st === 'niveau' ? `<span class="fs-tstate">${icon('lock')} Niveau ${TALENT_TIER_LEVELS[t]}</span>`
              : st === 'precedent' ? '<span class="fs-tstate">Choisis d’abord le palier précédent</span>'
                : `<span class="fs-tstate">${icon('parchemins')} ${TALENT_TIER_SCROLLS[t]} requis (tu en as ${p.scrolls})</span>`;
    } else if (sel && selTalent.tier === 4) {
      action = level >= FINAL_TALENT_LEVEL && chosen(3) != null ? '<span class="fs-tstate ok">✔ Talent ultime actif</span>'
        : `<span class="fs-tstate">${icon('lock')} Niveau ${FINAL_TALENT_LEVEL}, après les 3 paliers</span>`;
    }
    const nextLock = tiers.find((t) => level < TALENT_TIER_LEVELS[t]);
    const foot = !h ? 'Trouve ce héros pour débloquer ses talents.'
      : level < TALENT_TIER_LEVELS[1] ? `Les talents sont disponibles à partir du niveau ${TALENT_TIER_LEVELS[1]}`
        : nextLock ? `Palier suivant au niveau ${TALENT_TIER_LEVELS[nextLock]} · ${p?.scrolls ?? 0} parchemin${(p?.scrolls ?? 0) > 1 ? 's' : ''}`
          : `Tous les paliers sont ouverts · ${p?.scrolls ?? 0} parchemin${(p?.scrolls ?? 0) > 1 ? 's' : ''}`;
    return `<div class="fs-content scroll fs-tcontent">
        <div class="fs-tdesc">${sel ? `<h4>${esc(sel.name)}${selTalent.tier === 4 ? ' <small>Ultime</small>' : ''}</h4>${rich(sel.description, [UNITS[id].name])}` : ''}<div class="fs-tact">${action}</div></div>
        <div class="fs-tree">${rows}${finRow}</div>
      </div>
      <p class="fs-foot">${esc(foot)}</p>`;
  }

  // ---------------------------------------------------------------- Éveil
  function eveilTab(p: Profile | null, h: HeroState | null): string {
    const list = passivesFor(id).map((x) => `<li class="${(h?.awakening ?? 0) >= x.star ? 'on' : ''}${x.star === 10 ? ' ult' : ''}"><span>★${x.star}</span><div><b>${esc(x.name)}</b><small>${esc(x.description)}</small></div></li>`).join('');
    if (!h || !p) return `<div class="fs-content scroll"><div class="aw"><h3 class="aw-title">Éveil</h3><p class="aw-why">L’éveil s’ouvre au niveau ${MAX_HERO_LEVEL}.</p><ul class="aw-list">${list}</ul></div></div>`;
    const c = awakeningCost(h);
    const stars = Array.from({ length: MAX_AWAKENING }, (_, i) => `<i class="${i < h.awakening ? 'on' : ''}" style="--i:${i}">★</i>`).join('');
    const next = passivesFor(id).find((x) => x.star > h.awakening);
    const cur = h.awakening, nx = Math.min(MAX_AWAKENING, cur + 1);
    const ok = c && canAfford(p, h, c);
    const reason = !c ? (h.level < MAX_HERO_LEVEL ? `L’éveil s’ouvre au niveau ${MAX_HERO_LEVEL} (niveau ${h.level} pour l’instant).` : 'Éveil maximal atteint !') : missingFor(p, h, c);
    return `<div class="fs-content scroll"><div class="aw">
      <div class="aw-stars">${stars}</div>
      ${c ? `<div class="aw-costs">
        <div class="${h.cards >= c.cards ? 'ok' : ''}">${icon('cartes')}<b>${h.cards}/${c.cards}</b><span>copies</span></div>
        <div class="${p.crystals >= c.crystals ? 'ok' : ''}">${icon('cristaux')}<b>${fmt(p.crystals)}/${fmt(c.crystals)}</b><span>cristaux ✦</span></div>
      </div>
      <div class="aw-gain"><span>Attaque <b>+${pctS(AWAKENING_ATTACK_PER_STAR * cur)}</b> → <b class="up">+${pctS(AWAKENING_ATTACK_PER_STAR * nx)}</b></span>
        <span>Vitesse <b>+${pctS(AWAKENING_SPEED_PER_STAR * cur)}</b> → <b class="up">+${pctS(AWAKENING_SPEED_PER_STAR * nx)}</b></span></div>` : ''}
      ${next ? `<div class="aw-passive"><small>Prochain passif · ★${next.star}${next.star === 10 ? ' (ultime)' : ''}</small><b>${esc(next.name)}</b><span>${esc(next.description)}</span></div>` : ''}
      ${reason && !ok ? `<p class="aw-why">${esc(reason)}</p>` : ''}
      ${c ? `<button class="fs-btn ${ok ? 'gold' : 'grey'} aw-go" data-a="awaken" data-tuto="hero-awaken-go" ${ok ? '' : 'aria-disabled="true"'}><span>Éveiller ★${nx}</span></button>` : ''}
      <ul class="aw-list">${list}</ul>
    </div></div>`;
  }

  // ---------------------------------------------------------------- Info
  function infoTabHtml(p: Profile | null, h: HeroState | null): string {
    const u = UNITS[id];
    let inner = '';
    if (infoTab === 'competence') {
      inner = `<h4 class="fs-ih">${esc(u.ability.name)}</h4><div class="fs-itext">${rich(u.ability.description, [u.name])}</div>`;
    } else if (infoTab === 'equipes') {
      const teams = TEAM_LIST.filter((t) => t.units.includes(id));
      inner = teams.length ? `<ul class="fs-teams">${teams.map((t) => `<li><div class="fs-tf">${t.units.map((m) => `<img src="${portraitUrl(m)}" alt="${esc(UNITS[m].name)}" title="${esc(UNITS[m].name)}" class="${m === id ? 'me' : ''}${h && p && (p.decks[p.activeDeck] ?? []).includes(m) ? ' deck' : ''}">`).join('')}</div><b>${esc(t.name)}</b><span>${rich(t.description)}</span></li>`).join('')}</ul>`
        : '<p class="fs-empty">Ce héros n’a pas d’équipe.</p>';
    } else {
      const cats = categoriesFor(u);
      inner = `<dl class="fs-card">
        <div><dt>Univers</dt><dd>${esc(packLabel(u.pack))}</dd></div>
        <div><dt>Rareté</dt><dd class="r-${u.rarity}">${RARITY_LABEL[u.rarity]}</dd></div>
        <div><dt>Rôle</dt><dd>${esc(u.role)}</dd></div>
        <div><dt>Cible</dt><dd>${TARGETING[u.targeting] ?? ''}</dd></div>
        <div><dt>Niveau</dt><dd>${h ? `${h.level}/${MAX_HERO_LEVEL}` : 'Non possédé'}</dd></div>
        <div><dt>Éveil</dt><dd>${h ? `★${h.awakening}/${MAX_AWAKENING}` : '—'}</dd></div>
      </dl>
      <div class="fs-cats">${cats.map((k) => `<span><i>${HERO_CATEGORIES[k].icon}</i><b>${esc(HERO_CATEGORIES[k].label)}</b><small>${esc(HERO_CATEGORIES[k].description)}</small></span>`).join('')}</div>`;
    }
    const sub = (k: typeof infoTab, svg: string, label: string) => `<button class="${infoTab === k ? 'on' : ''}" data-a="itab" data-k="${k}" aria-label="${label}">${svg}</button>`;
    return `<div class="fs-content scroll fs-info">${inner}</div>
      <div class="fs-isub">${sub('competence', TAB_SVG.info, 'Compétence')}${sub('equipes', STAT_SVG.epee, 'Équipes')}${sub('carte', icon('cartes'), 'Carte')}</div>`;
  }

  // ---------------------------------------------------------------- rendu
  function render(): void {
    if (closed) return;
    const p = profile();
    const h = hero(p);
    const u = UNITS[id];
    wrap.className = `fs-wrap r-${u.rarity}`;
    wrap.dataset['tab'] = tab;
    wrap.querySelector('h2')!.textContent = u.name;
    wrap.querySelector('.fs-titles small')!.textContent = tab === 'principal' ? `Carte ${RARITY_LABEL[u.rarity].toLowerCase()}` : TAB_LABEL[tab];
    wrap.querySelector('.fs-mini')!.innerHTML = `<img src="${portraitUrl(id)}" alt="">${h ? `<b>${h.level}</b>` : ''}`;
    wrap.querySelectorAll<HTMLElement>('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset['tab'] === tab)));
    stopLoop?.(); stopLoop = null;
    body.innerHTML = tab === 'principal' ? mainTab(p, h)
      : tab === 'stats' ? statsTab(h)
        : tab === 'talents' ? talentsTab(p, h)
          : tab === 'eveil' ? eveilTab(p, h)
            : infoTabHtml(p, h);
    if (tab === 'principal') {
      const img = body.querySelector<HTMLImageElement>('.fs-fig');
      if (img) stopLoop = attackLoop(img, id);
      const art = body.querySelector<HTMLElement>('.fs-art');
      const shown = id;
      void ficheUrl(id).then((url) => {
        if (!url || !art || !art.isConnected || shown !== id) return;
        art.querySelector<HTMLElement>('.fs-bgimg')!.style.backgroundImage = `url("${url}")`;
        art.classList.add('has-fiche');
      });
    }
  }

  function show(next: UnitId): void {
    if (next === id) return;
    id = next;
    selTalent = null;
    pv = { rank: 1, powerUp: 1, level: 0 };
    emitMeta('heroSheet', { unit: id });
    panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap');
    render();
  }
  function browse(dir: 1 | -1): void {
    const i = order.indexOf(id);
    const n = order[(i + dir + order.length) % order.length] ?? id;
    show(n);
    o.onBrowse?.(n);
  }

  const close = () => {
    if (closed) return;
    closed = true;
    stopLoop?.();
    wrap.classList.add('out');
    window.setTimeout(() => wrap.remove(), 200);
    for (const f of closers) f();
  };
  const off = onProfileChange(() => render());
  closers.push(off);

  function burst(text: string, cls = ''): void {
    const art = body.querySelector<HTMLElement>('.fs-art') ?? panel;
    const b = el('div', `hs-burst ${cls}`, `<span>${text}</span>`);
    art.appendChild(b);
    art.classList.remove('flash'); void art.offsetWidth; art.classList.add('flash');
    window.setTimeout(() => b.remove(), 1400);
  }

  // Balayage horizontal sur l'illustration : héros voisin.
  let sx = 0, sy = 0;
  panel.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; });
  panel.addEventListener('pointerup', (e) => {
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (tab === 'principal' && Math.abs(dx) > 70 && Math.abs(dx) > 2 * Math.abs(dy) && (e.target as HTMLElement).closest('.fs-art')) browse(dx < 0 ? 1 : -1);
  });

  wrap.addEventListener('click', async (e) => {
    const t = e.target as HTMLElement;
    if (t.classList.contains('fs-veil')) { close(); return; }
    const tb = t.closest<HTMLElement>('[data-tab]');
    if (tb && tb.closest('.fs-tabs')) { tab = tb.dataset['tab'] as HeroSheetTab; render(); return; }
    const btn = t.closest<HTMLElement>('[data-a]');
    if (!btn || btn.getAttribute('aria-disabled') === 'true' && btn.dataset['a'] !== 'up' && btn.dataset['a'] !== 'awaken') return;
    const a = btn.dataset['a'];
    if (a === 'close') { close(); return; }
    if (a === 'prev' || a === 'next') { browse(a === 'next' ? 1 : -1); return; }
    if (a === 'tab') { tab = (btn.dataset['to'] as HeroSheetTab) ?? 'principal'; render(); return; }
    if (a === 'packs') { close(); o.go('#tirages'); return; }
    if (a === 'deck') { close(); o.onDeck?.(id); return; }
    if (a === 'pv-rank') { pv.rank = pv.rank % 7 + 1; render(); return; }
    if (a === 'pv-pu') { pv.powerUp = pv.powerUp % 5 + 1; render(); return; }
    if (a === 'pv-lv') { const cur = pv.level || (hero(profile())?.level ?? 1); pv.level = cur % MAX_HERO_LEVEL + 1; render(); return; }
    if (a === 'itab') { infoTab = btn.dataset['k'] as typeof infoTab; render(); return; }
    if (a === 'tal') { selTalent = { tier: Number(btn.dataset['tier']) as 1 | 2 | 3 | 4, opt: Number(btn.dataset['opt']) as 0 | 1 }; render(); return; }
    if (a === 'choose' && selTalent && selTalent.tier !== 4) {
      const tier = selTalent.tier as TalentTier, op = selTalent.opt;
      let ok = false;
      await updateProfile((q) => { ok = chooseTalent(q, id, tier, op); });
      if (ok) { emitMeta('heroUpgraded', { unit: id, kind: 'talent' }); toast('Talent choisi !'); }
      else toast('Il te faut plus de parchemins.', 'warn');
      return;
    }
    if (a === 'up') {
      const p = profile(), h = hero(p), c = h && levelUpCost(h);
      if (!p || !h || !c) return;
      const miss = missingFor(p, h, c);
      if (miss) { toast(miss, 'warn'); return; }
      let ok = false;
      await updateProfile((q) => { ok = levelUp(q, id); });
      if (ok) { burst(`Niveau ${hero(profile())!.level} !`); emitMeta('heroUpgraded', { unit: id, kind: 'niveau' }); navigator.vibrate?.(30); }
      return;
    }
    if (a === 'awaken') {
      const p = profile(), h = hero(p), c = h && awakeningCost(h);
      const miss = p && h && c ? missingFor(p, h, c) : 'Éveil impossible.';
      if (miss) { toast(miss, 'warn'); return; }
      let ok = false;
      await updateProfile((q) => { ok = awaken(q, id); });
      if (!ok) return;
      const star = hero(profile())!.awakening;
      burst(`★${star}`, 'star');
      const passive = passivesFor(id).find((x) => x.star === star);
      if (passive) window.setTimeout(() => toast(`Passif débloqué : ${passive.name}`), 900);
      body.querySelector(`.aw-stars i:nth-child(${star})`)?.classList.add('pop');
      emitMeta('heroUpgraded', { unit: id, kind: 'eveil' });
      navigator.vibrate?.([30, 40, 60]);
    }
  });

  emitMeta('heroSheet', { unit: id });
  render();
  return {
    el: wrap, body, close, onClose: (fn) => closers.push(fn), show,
    get unit() { return id; },
  };
}
