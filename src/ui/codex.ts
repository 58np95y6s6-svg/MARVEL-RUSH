// Encyclopédie : tous les héros (groupés par extension, type, rareté ou éveil) et les méchants.
// Routes : #encyclopedie (héros), #encyclopedie/mechants, #encyclopedie/heros/<id>, #encyclopedie/mechant/<id>.
// La fiche détaillée est une feuille par-dessus la grille, avec son propre défilement interne.
import './codex.css';
import { createView } from './view';
import { bossSvg, minionSvg, tokenColor, tokenPortraitSvg, RARITY_COLORS } from '../art';
import { UNIT_LIST } from '../data/units';
import { BOSS_LIST, LIEUTENANTS, THANOS_STONES } from '../data/bosses';
import { PACK_LIST } from '../data/packs';
import { TEAM_LIST } from '../data/teams';
import { talentsFor, TALENT_TIER_LEVELS } from '../data/talents';
import { passivesFor } from '../data/awakenings';
import { HERO_CATEGORIES, HERO_CATEGORY_LIST, categoriesFor, rangeLabel, rangeValue } from '../data/categories';
import { getHeroProgress, nextStep, MAX_AWAKENING, MAX_HERO_LEVEL, type HeroProgress } from '../meta/collection';
import { ficheUrl } from '../access/fiches';
import { heroCardHtml } from './heroCard';
import { getProfile } from '../meta/profile';
import type { BossDef, Rarity, Targeting, UnitDef } from '../data/types';

type Group = 'pack' | 'type' | 'rarete' | 'eveil';
type Sort = 'nom' | 'rarete' | 'eveil' | 'niveau' | 'portee' | 'degats';

const GROUPS: [Group, string][] = [['pack', 'Extension'], ['type', 'Type'], ['rarete', 'Rareté'], ['eveil', 'Éveil']];
const SORTS: [Sort, string][] = [
  ['nom', 'Nom'], ['rarete', 'Rareté'], ['eveil', 'Niveau d’éveil'], ['niveau', 'Niveau du héros'], ['portee', 'Portée'], ['degats', 'Dégâts/s'],
];
const RARITY_LABEL: Record<Rarity, string> = { rare: 'Rare', epique: 'Épique', legendaire: 'Légendaire' };
const RARITY_ORDER: Rarity[] = ['legendaire', 'epique', 'rare'];
const RARITY_RANK: Record<Rarity, number> = { legendaire: 3, epique: 2, rare: 1 };
const TARGETING_LABEL: Record<Targeting, string> = { premier: 'Le plus avancé', aleatoire: 'Au hasard', fort: 'Le plus de PV' };
const STORE = 'mr-encyclopedie';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const num = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');

/** Nom affiché d'une extension, déduit de la liste des packs (une nouvelle extension apparaît seule). */
function packLabel(id: string): string {
  const p = PACK_LIST.find((x) => x.id === id);
  if (p) return p.name.replace(/^Pack\s+/i, '');
  return id.charAt(0).toUpperCase() + id.slice(1);
}

interface Prefs { group: Group; sort: Sort }
function loadPrefs(): Prefs {
  const def: Prefs = { group: 'pack', sort: 'rarete' };
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return def;
    const j = JSON.parse(raw) as Partial<Prefs>;
    return {
      group: GROUPS.some(([g]) => g === j.group) ? j.group! : def.group,
      sort: SORTS.some(([s]) => s === j.sort) ? j.sort! : def.sort,
    };
  } catch { return def; }
}
function savePrefs(p: Prefs): void {
  try { localStorage.setItem(STORE, JSON.stringify(p)); } catch { /* stockage indisponible */ }
}

export interface CodexHandle { update(sub: string): void; destroy(): void }

export function mountCodex(root: HTMLElement, o: { onHome: () => void }, initialSub: string): CodexHandle {
  const urls = new Map<string, string>();
  const svgUrl = (key: string, make: () => string): string => {
    let u = urls.get(key);
    if (!u) { u = URL.createObjectURL(new Blob([make()], { type: 'image/svg+xml' })); urls.set(key, u); }
    return u;
  };
  const heroImg = (u: UnitDef) => svgUrl(`h-${u.id}`, () => tokenPortraitSvg(u.id));
  const bossImg = (b: BossDef) => svgUrl(`b-${b.id}`, () => bossSvg(b.id, 0));

  const prefs = loadPrefs();
  let query = '';
  let tab: 'heros' | 'mechants' = 'heros';
  let sheetPushed = false;
  let destroyed = false;
  const progress = new Map<string, HeroProgress>(UNIT_LIST.map((u) => [u.id, getHeroProgress(u.id)]));
  const prog = (id: string): HeroProgress => progress.get(id) ?? getHeroProgress(id);

  // ---------- en-tête ----------
  const header = document.createElement('header');
  header.className = 'cx-head';
  header.innerHTML = `
    <div class="cx-top">
      <button class="cx-back" data-a="home" aria-label="Retour à l’accueil"><i></i></button>
      <h1 class="cx-title">Encyclopédie</h1>
      <span class="cx-top-pad"></span>
    </div>
    <div class="cx-tabs" role="tablist">
      <button role="tab" data-tab="heros">Héros <small>${UNIT_LIST.length}</small></button>
      <button role="tab" data-tab="mechants">Méchants <small>${BOSS_LIST.length}</small></button>
    </div>
    <div class="cx-tools">
      <div class="cx-seg" role="radiogroup" aria-label="Grouper par">
        ${GROUPS.map(([g, l]) => `<button role="radio" data-g="${g}">${l}</button>`).join('')}
      </div>
      <div class="cx-row">
        <label class="cx-search"><span aria-hidden="true">🔍</span><input type="search" placeholder="Rechercher" autocomplete="off" spellcheck="false" enterkeyhint="search"></label>
        <label class="cx-sort"><span>Trier</span><select aria-label="Trier par">
          ${SORTS.map(([s, l]) => `<option value="${s}">${l}</option>`).join('')}
        </select></label>
      </div>
    </div>`;
  const content = document.createElement('div');
  content.className = 'cx-list';
  const view = createView({ header, content, scroll: true });
  view.classList.add('cx');
  const sheetHost = document.createElement('div');
  sheetHost.className = 'cx-sheet-host';
  view.appendChild(sheetHost);
  root.appendChild(view);

  const search = header.querySelector<HTMLInputElement>('.cx-search input')!;
  const sortSel = header.querySelector<HTMLSelectElement>('.cx-sort select')!;
  sortSel.value = prefs.sort;

  header.querySelector('[data-a="home"]')!.addEventListener('click', o.onHome);
  header.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((b) => b.addEventListener('click', () => {
    const t = b.dataset.tab === 'mechants' ? 'mechants' : 'heros';
    if (t !== tab) location.replace(t === 'mechants' ? '#encyclopedie/mechants' : '#encyclopedie');
  }));
  header.querySelectorAll<HTMLButtonElement>('[data-g]').forEach((b) => b.addEventListener('click', () => {
    prefs.group = b.dataset.g as Group;
    savePrefs(prefs);
    renderList();
    content.scrollTop = 0;
  }));
  sortSel.addEventListener('change', () => { prefs.sort = sortSel.value as Sort; savePrefs(prefs); renderList(); });
  search.addEventListener('input', () => { query = search.value; renderList(); });
  search.addEventListener('keydown', (e) => { if (e.key === 'Enter') search.blur(); });

  content.addEventListener('click', (e) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>('[data-id]');
    if (!card) return;
    sheetPushed = true;
    location.hash = card.dataset.kind === 'boss' ? `#encyclopedie/mechant/${card.dataset.id}` : `#encyclopedie/heros/${card.dataset.id}`;
  });

  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && sheetHost.firstChild) closeSheet(); };
  window.addEventListener('keydown', onKey);

  // ---------- grille des héros ----------
  function compare(a: UnitDef, b: UnitDef): number {
    const pa = prog(a.id), pb = prog(b.id);
    let d = 0;
    switch (prefs.sort) {
      case 'rarete': d = RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity]; break;
      case 'eveil': d = pb.awakening - pa.awakening; break;
      case 'niveau': d = pb.level - pa.level; break;
      case 'portee': d = rangeValue(b.range) - rangeValue(a.range); break;
      case 'degats': d = b.damage / b.attackInterval - a.damage / a.attackInterval; break;
      case 'nom': break;
    }
    return d || a.name.localeCompare(b.name, 'fr');
  }

  function matches(u: UnitDef): boolean {
    if (!query.trim()) return true;
    const q = norm(query.trim());
    const hay = norm([u.name, u.role, u.ability.name, packLabel(u.pack), RARITY_LABEL[u.rarity],
      ...categoriesFor(u).map((c) => HERO_CATEGORIES[c].label)].join(' '));
    return q.split(/\s+/).every((w) => hay.includes(w));
  }

  function groups(list: UnitDef[]): { key: string; title: string; icon?: string; sub?: string; cls?: string; units: UnitDef[] }[] {
    switch (prefs.group) {
      case 'pack': {
        const ids: string[] = [];
        for (const u of UNIT_LIST) if (!ids.includes(u.pack)) ids.push(u.pack);
        return ids.map((p) => ({ key: p, title: packLabel(p), cls: `pack pack-${p}`, units: list.filter((u) => u.pack === p) }));
      }
      case 'type':
        return HERO_CATEGORY_LIST.map((c) => ({
          key: c.id, title: c.label, icon: c.icon, sub: c.description,
          units: list.filter((u) => categoriesFor(u).includes(c.id)),
        }));
      case 'rarete':
        return RARITY_ORDER.map((r) => ({ key: r, title: RARITY_LABEL[r], cls: `rar r-${r}`, units: list.filter((u) => u.rarity === r) }));
      case 'eveil': {
        const out = [];
        for (let s = MAX_AWAKENING; s >= 0; s--) {
          out.push({ key: `s${s}`, title: s === 0 ? 'Pas encore éveillé' : `Éveil ★${s}`, icon: s === 0 ? '☆' : '★', units: list.filter((u) => prog(u.id).awakening === s) });
        }
        return out;
      }
    }
  }

  function card(u: UnitDef): string {
    // Carte commune (src/ui/heroCard.ts), avec le nom dessous dans l'Encyclopédie.
    const prof = getProfile();
    const p = prog(u.id);
    const state = prof ? prof.heroes[u.id] ?? null : { level: p.level, cards: p.copies, awakening: p.awakening, talents: [null, null, null] };
    return heroCardHtml({ id: u.id, state, profile: prof, inDeck: !!prof?.decks[prof.activeDeck]?.includes(u.id), showName: true, attrs: `data-id="${u.id}"` });
  }

  function renderList(): void {
    header.querySelectorAll<HTMLButtonElement>('[data-g]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.g === prefs.group)));
    header.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
    view.classList.toggle('tab-mechants', tab === 'mechants');
    view.dataset.group = prefs.group;
    if (tab === 'mechants') { renderBosses(); return; }
    const list = UNIT_LIST.filter(matches).sort(compare);
    const gs = groups(list).filter((g) => g.units.length > 0);
    if (gs.length === 0) {
      content.innerHTML = `<p class="cx-empty">Aucun héros ne correspond à « ${esc(query.trim())} ».</p>`;
      return;
    }
    content.innerHTML = gs.map((g) => `
      <section class="cx-group">
        <h2 class="cx-gh ${g.cls ?? ''}">${g.icon ? `<span class="cx-gi">${g.icon}</span>` : ''}<span class="cx-gt">${esc(g.title)}${g.sub ? `<small>${esc(g.sub)}</small>` : ''}</span><b>${g.units.length}</b></h2>
        <div class="cx-grid">${g.units.map(card).join('')}</div>
      </section>`).join('');
  }

  function renderBosses(): void {
    content.innerHTML = `<div class="cx-bosses">${BOSS_LIST.map((b) => `
      <button class="cx-boss${b.id === 'thanos' ? ' thanos' : ''}" data-kind="boss" data-id="${b.id}">
        <span class="cx-boss-art"><img src="${bossImg(b)}" alt="" loading="lazy"></span>
        <span class="cx-boss-txt">
          <b>${esc(b.name)}</b>
          <span class="cx-power">${esc(b.power.name)} <small>toutes les ${num(b.power.interval)} s</small></span>
          <span class="cx-pdesc">${esc(b.power.description)}</span>
        </span>
      </button>`).join('')}</div>`;
  }

  // ---------- fiche détaillée ----------
  function closeSheet(): void {
    if (sheetPushed) { sheetPushed = false; history.back(); }
    else location.replace(tab === 'mechants' ? '#encyclopedie/mechants' : '#encyclopedie');
  }

  function openSheet(html: string, artId: string, kind: 'hero' | 'boss'): void {
    sheetHost.innerHTML = `
      <div class="cx-veil" data-a="close"></div>
      <div class="cx-sheet ${kind}" role="dialog" aria-modal="true">
        <button class="cx-close" data-a="close" aria-label="Fermer">✕</button>
        <div class="cx-sheet-body scroll">${html}</div>
      </div>`;
    sheetHost.querySelectorAll('[data-a="close"]').forEach((el) => el.addEventListener('click', closeSheet));
    // Illustration de la fiche (chiffrée) : remplace le dessin quand elle est disponible.
    const art = sheetHost.querySelector<HTMLElement>('.cx-hero-art');
    void ficheUrl(artId).then((url) => {
      if (!url || destroyed || !art || !art.isConnected) return;
      const img = new Image();
      img.alt = '';
      img.className = 'cx-fiche';
      img.onload = () => { if (art.isConnected) { art.classList.add('has-fiche'); art.appendChild(img); } };
      img.src = url;
    });
  }

  const chip = (t: string, cls = '') => `<span class="cx-chip ${cls}">${t}</span>`;

  function heroSheet(u: UnitDef): string {
    const p = prog(u.id);
    const cats = categoriesFor(u);
    const step = nextStep(p);
    const stars = Array.from({ length: MAX_AWAKENING }, (_, i) => `<i class="${i < p.awakening ? 'on' : ''}">★</i>`).join('');
    const pct = step && step.needed > 0 ? Math.min(100, (p.copies / step.needed) * 100) : 100;
    const talents = talentsFor(u.id);
    const tiers = ([1, 2, 3] as const).map((t) => {
      const opts = talents.filter((x) => x.tier === t);
      const lockedT = p.level < TALENT_TIER_LEVELS[t];
      return `<div class="cx-tier${lockedT ? ' locked' : ''}">
        <h4>Niveau ${TALENT_TIER_LEVELS[t]} ${lockedT ? '<span>🔒</span>' : ''}</h4>
        <div class="cx-opts">${opts.map((x, i) => `${i > 0 ? '<em>ou</em>' : ''}<div class="cx-opt"><b>${esc(x.name)}</b><span>${esc(x.description)}</span></div>`).join('')}</div>
      </div>`;
    }).join('');
    const passives = passivesFor(u.id).map((x) => `
      <li class="${p.awakening >= x.star ? 'on' : ''}${x.star === 10 ? ' ult' : ''}"><span class="cx-pstar">★${x.star}</span><div><b>${esc(x.name)}</b><span>${esc(x.description)}</span></div></li>`).join('');
    const teams = TEAM_LIST.filter((t) => t.units.includes(u.id)).map((t) => `
      <li><div class="cx-team-faces">${t.units.map((m) => {
        const mu = UNIT_LIST.find((x) => x.id === m);
        return mu ? `<img src="${heroImg(mu)}" alt="${esc(mu.name)}" title="${esc(mu.name)}" class="${m === u.id ? 'me' : ''}" style="--plate:${tokenColor(mu.id)}">` : '';
      }).join('')}</div><b>${esc(t.name)}</b><span>${esc(t.description)}</span></li>`).join('');
    const dps = u.damage / u.attackInterval;
    return `
      <div class="cx-hero-art" style="--plate:${tokenColor(u.id)};--rar:${RARITY_COLORS[u.rarity]}"><img class="cx-token" src="${heroImg(u)}" alt=""></div>
      <h2 class="cx-sname">${esc(u.name)}</h2>
      <div class="cx-chips">${chip(esc(packLabel(u.pack)), 'pack')}${chip(RARITY_LABEL[u.rarity], `r-${u.rarity}`)}${chip(esc(u.role), 'role')}</div>
      <div class="cx-chips cats">${cats.map((c) => chip(`${HERO_CATEGORIES[c].icon} ${HERO_CATEGORIES[c].label}`, 'cat')).join('')}</div>

      <div class="cx-prog">
        <div class="cx-prog-top"><span class="cx-lv">Niv. <b>${p.level}</b>/${MAX_HERO_LEVEL}</span><span class="cx-stars" aria-label="Éveil ${p.awakening} sur ${MAX_AWAKENING}">${stars}</span></div>
        <div class="cx-bar"><i style="width:${pct}%"></i><span>${step ? `${p.copies}/${step.needed} copies · ${step.kind === 'niveau' ? `niveau ${step.target}` : `éveil ★${step.target}`}` : 'Maximum atteint'}</span></div>
      </div>

      <dl class="cx-stats">
        <div><dt>Portée</dt><dd>${rangeLabel(u.range)}</dd></div>
        <div><dt>Dégâts</dt><dd>${num(u.damage)}</dd></div>
        <div><dt>Attaque</dt><dd>toutes les ${num(u.attackInterval)} s</dd></div>
        <div><dt>Dégâts/s</dt><dd>${num(Math.round(dps))}</dd></div>
        <div class="wide"><dt>Cible</dt><dd>${TARGETING_LABEL[u.targeting]}</dd></div>
      </dl>

      <section class="cx-sec"><h3>Compétence</h3>
        <div class="cx-ability"><b>${esc(u.ability.name)}</b><p>${esc(u.ability.description)}</p></div></section>
      ${talents.length ? `<section class="cx-sec"><h3>Talents</h3>${tiers}</section>` : ''}
      ${passives ? `<section class="cx-sec"><h3>Éveil</h3><ul class="cx-passives">${passives}</ul></section>` : ''}
      ${teams ? `<section class="cx-sec"><h3>Équipes</h3><ul class="cx-teams">${teams}</ul></section>` : ''}`;
  }

  function bossSheet(b: BossDef): string {
    const lt = LIEUTENANTS[b.id];
    const stones = b.id === 'thanos' ? `<section class="cx-sec"><h3>Pierres d’infinité</h3><ul class="cx-stones">${THANOS_STONES.map((s) => `
      <li style="--stone:${s.color}"><i></i><div><b>${esc(s.name)}</b><span>${esc(s.description)}</span></div></li>`).join('')}</ul></section>` : '';
    const minion = svgUrl(`m-${b.id}`, () => minionSvg(b.id, 0));
    return `
      <div class="cx-hero-art boss"><img class="cx-token" src="${svgUrl(`bb-${b.id}`, () => bossSvg(b.id, 0, { bg: true }))}" alt=""></div>
      <h2 class="cx-sname">${esc(b.name)}</h2>
      <div class="cx-chips">${chip(b.id === 'thanos' ? 'Boss ultime' : 'Gros boss', 'boss')}</div>
      <section class="cx-sec"><h3>Pouvoir</h3>
        <div class="cx-ability"><b>${esc(b.power.name)} <small>toutes les ${num(b.power.interval)} s</small></b><p>${esc(b.power.description)}</p></div></section>
      ${stones}
      <section class="cx-sec"><h3>Sbires</h3>
        <div class="cx-minion"><img src="${minion}" alt=""><div><b>${esc(b.minion.name)}</b><p>${esc(b.minion.description)}</p></div></div></section>
      ${lt ? `<section class="cx-sec"><h3>Lieutenant</h3>
        <div class="cx-ability"><b>${esc(lt.name)}</b><p><b class="cx-inline">${esc(lt.power.name)}</b> (toutes les ${num(lt.power.interval)} s) : ${esc(lt.power.description)}</p>
        <p class="cx-note">Il arrive 5 vagues avant son maître.</p></div></section>` : ''}`;
  }

  // ---------- navigation ----------
  function update(sub: string): void {
    const [a = '', id = ''] = sub.split('/');
    const newTab = a === 'mechants' || a === 'mechant' ? 'mechants' : 'heros';
    if (newTab !== tab || !content.firstChild) { tab = newTab; renderList(); content.scrollTop = 0; }
    const unit = a === 'heros' ? UNIT_LIST.find((u) => u.id === id) : undefined;
    const boss = a === 'mechant' ? BOSS_LIST.find((b) => b.id === id) : undefined;
    if (unit) openSheet(heroSheet(unit), unit.id, 'hero');
    else if (boss) openSheet(bossSheet(boss), boss.id, 'boss');
    else { sheetHost.innerHTML = ''; sheetPushed = false; }
  }

  update(initialSub);

  return {
    update,
    destroy() {
      destroyed = true;
      window.removeEventListener('keydown', onKey);
      view.remove();
      for (const u of urls.values()) URL.revokeObjectURL(u);
      urls.clear();
    },
  };
}
