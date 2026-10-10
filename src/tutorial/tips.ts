// Astuces au bon moment (§5.0), une seule fois chacune (vues : `profile.tips`) : ciblage « fort », talents
// au premier héros niveau 5, bonus d'équipe presque complet, pouvoir de chaque boss à sa première
// apparition, archétypes (Loki copie, Coco promeut, Vanellope échange, Black Widow se sacrifie).
// Plus les rappels discrets du premier niveau de campagne (« Pense à fusionner ! »).
import { BOSSES, LIEUTENANTS } from '../data/bosses';
import { TALENT_TIER_LEVELS } from '../data/talents';
import type { BossId, UnitId } from '../data/types';
import { UNITS } from '../data/units';
import { GRID_SIZE } from '../engine/types';
import { onMeta } from '../meta/events';
import { getProfile, updateProfile } from '../meta/profile';
import { observeBattles, type BattleTutoApi } from '../ui/battleHooks';
import { tokenUrl } from '../ui/kit';
import { takeReminderFlag } from './part2';
import { archetypeOf, boardCount, guideFor, nearlyCompleteTeam, tipPending, type Archetype } from './steps';

export interface Tip { id: string; tag: string; title: string; html: string }

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
const nm = (u: UnitId) => esc(UNITS[u].name);

export function targetingTip(unit: UnitId): Tip {
  return {
    id: 'ciblage', tag: 'Astuce', title: 'Le ciblage',
    html: `<p>Chaque héros choisit sa cible à sa façon. <b>${nm(unit)}</b> vise le plus <b>fort</b> : l’ennemi qui a le plus de PV.</p>
      <ul><li><b>Premier</b> : le plus avancé sur le chemin.</li><li><b>Aléatoire</b> : au hasard.</li><li><b>Fort</b> : le plus résistant, idéal contre les boss.</li></ul>`,
  };
}

export const TALENT_TIP: Tip = {
  id: 'talents', tag: 'Nouveau', title: 'Les talents',
  html: `<p>Ton héros est niveau ${TALENT_TIER_LEVELS[1]} : il peut apprendre un <b>talent</b> ! Ouvre sa fiche et choisis entre deux options avec des <b>parchemins</b>.</p><p>Nouveaux paliers aux niveaux ${TALENT_TIER_LEVELS[2]} et ${TALENT_TIER_LEVELS[3]}.</p>`,
};

export const SPEED_TIP: Tip = {
  id: 'vitesse', tag: 'Astuce', title: 'Vitesse ×2',
  html: '<p>Le bouton <b>×1</b> en haut à droite passe la partie en <b>vitesse ×2</b>. Touche-le encore pour revenir à ×1.</p>',
};

export function teamTip(text: string, name: string, description: string): Tip {
  return {
    id: 'equipe', tag: 'Astuce', title: 'Bonus d’équipe',
    html: `<p>${esc(text)} !</p><p>Équipe complète dans le deck : <b>${esc(name)}</b>, ${esc(description.charAt(0).toLowerCase() + description.slice(1))}</p>`,
  };
}

export function bossTip(boss: BossId, small: boolean): Tip {
  const def = small ? LIEUTENANTS[boss] : BOSSES[boss];
  return {
    id: `${small ? 'lieutenant' : 'boss'}-${boss}`, tag: small ? 'Lieutenant' : 'Boss', title: def.name,
    html: `<p><b>${esc(def.power.name)}</b> : ${esc(def.power.description)}</p><p>${small ? 'Il annonce l’arrivée de son maître.' : 'Garde des héros forts en réserve et vise-le avec tes unités « fort ».'}</p>`,
  };
}

const ARCH: Record<Archetype, (u: string) => string> = {
  copie: (u) => `Glisse <b>${u}</b> sur un allié de <b>même rang</b> : il devient sa copie (un peu moins forte). Pratique pour finir une paire !`,
  promotion: (u) => `Glisse <b>${u}</b> sur un allié de <b>même rang</b> : ${u} disparaît et l’allié <b>gagne un rang</b>.`,
  echange: (u) => `Glisse <b>${u}</b> sur un allié de <b>même rang</b> : ils <b>échangent leurs cases</b>, et tu gagnes un peu de mana.`,
  sacrifice: (u) => `Quand <b>${u}</b> sert à une fusion, elle se <b>sacrifie</b> et te rend du <b>mana</b>.`,
};
export function archetypeTip(unit: UnitId, kind: Archetype): Tip {
  return { id: `arch-${kind}`, tag: 'Héros spécial', title: UNITS[unit].name, html: `<p>${ARCH[kind](nm(unit))}</p>` };
}

// ------------------------------------------------------------------------------------ affichage
const queue: { tip: Tip; api?: BattleTutoApi }[] = [];
let showing = false;
const queued = new Set<string>();

function ready(): boolean {
  const p = getProfile();
  return !!p && p.tutorialDone;
}

export function offerTip(tip: Tip, api?: BattleTutoApi): void {
  if (!ready() || !tipPending(getProfile(), tip.id) || queued.has(tip.id)) return;
  queued.add(tip.id);
  queue.push({ tip, api });
  if (!showing) pumpTips();
}

function pumpTips(): void {
  const item = queue.shift();
  if (!item) { showing = false; return; }
  const { tip, api } = item;
  if (api && (api.isDestroyed() || api.isOver())) { queued.delete(tip.id); pumpTips(); return; }
  showing = true;
  void updateProfile((p) => { (p.tips ??= {})[tip.id] = true; }).catch(() => undefined);
  api?.hold(true);
  const w = document.createElement('div');
  w.className = 'tip';
  w.innerHTML = `<div class="tip-box" role="dialog" aria-modal="true">
    <div class="tip-head"><img src="${tokenUrl(guideFor(getProfile()?.starter))}" alt=""><div><small>${esc(tip.tag)}</small><h3>${esc(tip.title)}</h3></div></div>
    ${tip.html}<button class="mr-btn yellow" data-tuto="tip-ok">Compris !</button></div>`;
  const close = () => {
    w.remove();
    api?.hold(false);
    window.setTimeout(pumpTips, 400);
  };
  w.querySelector('button')!.addEventListener('click', close);
  document.body.appendChild(w);
}

// ------------------------------------------------------------------------------------ rappels discrets
function remind(api: BattleTutoApi, text: string): void {
  const r = document.createElement('div');
  r.className = 'tu-remind';
  r.innerHTML = `<img src="${tokenUrl(guideFor(getProfile()?.starter))}" alt=""><span>${text}</span>`;
  api.root.appendChild(r);
  window.setTimeout(() => r.remove(), 3300);
}

function watchBattle(api: BattleTutoApi): void {
  if (api.engine.config.mode === 'tutoriel') return;
  const reminders = takeReminderFlag();
  let lastRemind = -1e9;
  const seen = new Set<UnitId>();
  api.onEvents((evs) => {
    const grid = api.engine.state.players[0]?.grid ?? [];
    for (const e of evs) {
      if (e.type === 'waveStart' && e.wave === 2) offerTip(SPEED_TIP, api);
      else if (e.type === 'bossSpawn') window.setTimeout(() => offerTip(bossTip(e.boss, false), api), 2300);
      else if (e.type === 'miniBossSpawn') window.setTimeout(() => offerTip(bossTip(e.boss, true), api), 2300);
      else if ((e.type === 'summon' || e.type === 'merge') && e.player === 'p1' && !seen.has(e.unit)) {
        seen.add(e.unit);
        const kind = archetypeOf(e.unit);
        if (kind) offerTip(archetypeTip(e.unit, kind), api);
        if (UNITS[e.unit].targeting === 'fort') offerTip(targetingTip(e.unit), api);
      } else if (reminders && e.type === 'rejected' && e.command === 'summon' && boardCount(grid) >= GRID_SIZE) {
        const now = performance.now();
        if (now - lastRemind > 6000) { lastRemind = now; remind(api, 'Pense à <b>fusionner</b> !'); }
      }
    }
    if (reminders && boardCount(grid) >= GRID_SIZE) {
      const now = performance.now();
      if (now - lastRemind > 15000) { lastRemind = now; remind(api, 'Plateau plein : pense à <b>fusionner</b> !'); }
    }
  });
}

export function initTips(): void {
  observeBattles(watchBattle);
  onMeta('heroUpgraded', ({ unit, kind }) => {
    const h = getProfile()?.heroes[unit];
    if (kind === 'niveau' && h && h.level >= TALENT_TIER_LEVELS[1]) window.setTimeout(() => offerTip(TALENT_TIP), 500);
  });
  const checkTeam = (deck: readonly UnitId[]) => {
    const near = nearlyCompleteTeam(deck);
    if (near) offerTip(teamTip(near.text, near.team.name, near.team.description));
  };
  onMeta('deckChanged', ({ deck }) => checkTeam(deck));
  onMeta('screen', ({ route }) => {
    if (route !== 'collection' && route !== 'decks') return;
    const p = getProfile();
    const deck = p?.decks[p.activeDeck];
    if (deck) window.setTimeout(() => checkTeam(deck), 600);
  });
  onMeta('packOpened', ({ results }) => {
    const fort = results.find((r) => r.outcome === 'nouveau' && UNITS[r.unit].targeting === 'fort');
    if (fort) offerTip(targetingTip(fort.unit));
  });
}
