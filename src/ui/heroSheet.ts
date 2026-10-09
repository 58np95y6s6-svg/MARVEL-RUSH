// Fiche d'un héros de la collection (§6.5, §8.4, §8.7) : illustration (fiche chiffrée si disponible,
// sinon le personnage sur les couleurs de son univers) avec le chibi qui joue sa boucle d'attaque,
// niveau et cartes, « Améliorer », Éveil (écran dédié et animation), talents (3 paliers), statistiques.
import { ficheUrl } from '../access/fiches';
import { passivesFor } from '../data/awakenings';
import { rangeLabel } from '../data/categories';
import { TALENT_TIER_LEVELS, TALENT_TIER_SCROLLS, talentsFor } from '../data/talents';
import type { UnitId } from '../data/types';
import { UNITS } from '../data/units';
import {
  AWAKENING_ATTACK_PER_STAR, AWAKENING_SPEED_PER_STAR, MAX_AWAKENING, MAX_HERO_LEVEL, awaken, awakeningCost, canAfford,
  chooseTalent, levelUp, levelUpCost, missingFor, talentTierState, type TalentTier,
} from '../meta/economy';
import { emitMeta } from '../meta/events';
import { getProfile, onProfileChange, updateProfile, type HeroState, type Profile } from '../meta/profile';
import { heroProgress } from './heroCard';
import { RARITY_LABEL, attackLoop, el, esc, fmt, figureUrl, icon, openSheet, packColors, toast, type Sheet } from './kit';

const TARGETING: Record<string, string> = { premier: 'Le plus avancé', aleatoire: 'Au hasard', fort: 'Le plus résistant' };
const LEVEL_DAMAGE = 0.1; // +10 % de dégâts par niveau de collection (src/engine/internal.ts)
const pctS = (x: number) => `${Math.round(x * 100)} %`;

export interface HeroSheetOptions {
  /** Propose « Mettre dans le deck » (absent si déjà dans le deck affiché). */
  onDeck?: (id: UnitId) => void;
  go: (hash: string) => void;
}

export function openHeroSheet(overlay: HTMLElement, id: UnitId, o: HeroSheetOptions): Sheet {
  const u = UNITS[id];
  const [c1, c2] = packColors(u.pack);
  const sheet = openSheet(overlay, { cls: `hs-wrap r-${u.rarity}`, tall: true });
  emitMeta('heroSheet', { unit: id });
  const stops: (() => void)[] = [];
  let mode: 'fiche' | 'eveil' = 'fiche';

  const art = el('div', 'hs-art');
  art.style.setProperty('--u1', c1);
  art.style.setProperty('--u2', c2);
  art.innerHTML = `<div class="hs-bgimg"></div><img class="hs-fig" alt="" src="${figureUrl(id, 0)}">
    <div class="hs-id"><span class="hs-rar r-${u.rarity}">${RARITY_LABEL[u.rarity]}</span><h2>${esc(u.name)}</h2><span class="hs-role">${esc(u.role)}</span></div>`;
  sheet.body.before(art);
  stops.push(attackLoop(art.querySelector<HTMLImageElement>('.hs-fig')!, id));
  void ficheUrl(id).then((url) => {
    if (!url || !art.isConnected) return;
    art.querySelector<HTMLElement>('.hs-bgimg')!.style.backgroundImage = `url("${url}")`;
    art.classList.add('has-fiche');
  });

  function levelBlock(p: Profile, h: HeroState): string {
    const g = heroProgress(h, p);
    const lc = levelUpCost(h);
    const w = g.need ? Math.min(100, (g.have / g.need) * 100) : 100;
    const stars = Array.from({ length: MAX_AWAKENING }, (_, i) => `<i class="${i < h.awakening ? 'on' : ''}">★</i>`).join('');
    const miss = lc ? missingFor(p, h, lc) : null;
    return `<div class="hs-lvrow">
        <span class="hs-lv">Niv. <b>${h.level}</b><small>/${MAX_HERO_LEVEL}</small></span>
        <div class="hs-bar ${g.ready ? 'ready' : ''} ${g.kind}"><i style="width:${w}%"></i><span>${g.kind === 'max' ? 'Maximum atteint' : `${g.have}/${g.need} cartes · ${g.kind === 'niveau' ? `niveau ${h.level + 1}` : `éveil ★${h.awakening + 1}`}`}</span></div>
      </div>
      <div class="hs-stars" aria-label="Éveil ${h.awakening} sur ${MAX_AWAKENING}">${stars}</div>
      <div class="hs-actions">
        ${lc ? `<button class="mr-btn ${miss ? '' : 'yellow'} hs-up" data-a="up" data-tuto="hero-upgrade" ${miss ? 'aria-disabled="true"' : ''}>
            <span>Améliorer</span><small>${icon('cartes')}${lc.cards} · ${icon('eclats')}${fmt(lc.shards)}</small></button>`
        : `<button class="mr-btn hs-up eveil" data-a="eveil" data-tuto="hero-awaken"><span>Éveil ★</span><small>${h.awakening}/${MAX_AWAKENING}</small></button>`}
        ${o.onDeck ? '<button class="mr-btn hs-deck" data-a="deck" data-tuto="hero-to-deck"><span>Au deck</span></button>' : ''}
      </div>
      ${lc ? `<button class="hs-eveil-link" data-a="eveil">${icon('cristaux')} Éveil : s’ouvre au niveau 10</button>` : ''}`;
  }

  function talentBlock(p: Profile, h: HeroState): string {
    const all = talentsFor(id);
    return ([1, 2, 3] as TalentTier[]).map((t) => {
      const st = talentTierState(p, h, t);
      const opts = all.filter((x) => x.tier === t);
      const chosen = h.talents[t - 1];
      const note = st === 'choisi' ? 'Changement gratuit'
        : st === 'niveau' ? `${icon('lock')} Niveau ${TALENT_TIER_LEVELS[t]}`
        : st === 'precedent' ? 'Choisis d’abord le palier précédent'
        : st === 'parchemins' ? `${icon('parchemins')} ${TALENT_TIER_SCROLLS[t]} requis (tu en as ${p.scrolls})`
        : `${icon('parchemins')} Coûte ${TALENT_TIER_SCROLLS[t]}`;
      const open = st === 'choisi' || st === 'ouvrable';
      return `<div class="hs-tier ${st}">
        <h4><span>Palier ${t} · niv. ${TALENT_TIER_LEVELS[t]}</span><small>${note}</small></h4>
        <div class="hs-opts">${opts.map((x, i) => `<button class="hs-opt${chosen === i ? ' on' : ''}" data-tier="${t}" data-opt="${i}" data-tuto="talent-${t}-${i}" ${open ? '' : 'disabled'}>
          <b>${esc(x.name)}</b><span>${esc(x.description)}</span></button>`).join('<em>ou</em>')}</div>
      </div>`;
    }).join('');
  }

  function statsBlock(h: HeroState | undefined): string {
    const lvl = h?.level ?? 1, aw = h?.awakening ?? 0;
    const dmg = u.damage * (1 + LEVEL_DAMAGE * (lvl - 1)) * (1 + AWAKENING_ATTACK_PER_STAR * aw);
    const interval = u.attackInterval / (1 + AWAKENING_SPEED_PER_STAR * aw);
    return `<dl class="hs-stats">
      <div><dt>Dégâts</dt><dd>${fmt(Math.round(dmg))}</dd></div>
      <div><dt>Attaque</dt><dd>${interval.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} s</dd></div>
      <div><dt>Portée</dt><dd>${rangeLabel(u.range)}</dd></div>
      <div><dt>Cible</dt><dd>${TARGETING[u.targeting] ?? u.targeting}</dd></div>
    </dl>
    <section class="hs-sec"><h3>${esc(u.ability.name)}</h3><p>${esc(u.ability.description)}</p></section>`;
  }

  function awakeningView(p: Profile, h: HeroState): string {
    const c = awakeningCost(h);
    const stars = Array.from({ length: MAX_AWAKENING }, (_, i) => `<i class="${i < h.awakening ? 'on' : ''}" style="--i:${i}">★</i>`).join('');
    const next = passivesFor(id).find((x) => x.star > h.awakening);
    const cur = h.awakening, nx = Math.min(MAX_AWAKENING, cur + 1);
    const ok = c && canAfford(p, h, c);
    const reason = !c ? (h.level < MAX_HERO_LEVEL ? `L’éveil s’ouvre au niveau ${MAX_HERO_LEVEL} (niveau ${h.level} pour l’instant).` : 'Éveil maximal atteint !') : missingFor(p, h, c);
    return `<div class="aw">
      <button class="aw-back" data-a="fiche">‹ Fiche</button>
      <h3 class="aw-title">Éveil</h3>
      <div class="aw-stars">${stars}</div>
      ${c ? `<div class="aw-costs">
        <div class="${h.cards >= c.cards ? 'ok' : ''}">${icon('cartes')}<b>${h.cards}/${c.cards}</b><span>copies</span></div>
        <div class="${p.crystals >= c.crystals ? 'ok' : ''}">${icon('cristaux')}<b>${fmt(p.crystals)}/${fmt(c.crystals)}</b><span>cristaux ✦</span></div>
      </div>
      <div class="aw-gain"><span>Attaque <b>+${pctS(AWAKENING_ATTACK_PER_STAR * cur)}</b> → <b class="up">+${pctS(AWAKENING_ATTACK_PER_STAR * nx)}</b></span>
        <span>Vitesse <b>+${pctS(AWAKENING_SPEED_PER_STAR * cur)}</b> → <b class="up">+${pctS(AWAKENING_SPEED_PER_STAR * nx)}</b></span></div>` : ''}
      ${next ? `<div class="aw-passive"><small>Prochain passif · ★${next.star}${next.star === 10 ? ' (ultime)' : ''}</small><b>${esc(next.name)}</b><span>${esc(next.description)}</span></div>` : ''}
      ${reason && !ok ? `<p class="aw-why">${esc(reason)}</p>` : ''}
      ${c ? `<button class="mr-btn ${ok ? 'yellow' : ''} aw-go" data-a="awaken" data-tuto="hero-awaken-go" ${ok ? '' : 'aria-disabled="true"'}>Éveiller ★${nx}</button>` : ''}
      <ul class="aw-list">${passivesFor(id).map((x) => `<li class="${h.awakening >= x.star ? 'on' : ''}"><span>★${x.star}</span><div><b>${esc(x.name)}</b><small>${esc(x.description)}</small></div></li>`).join('')}</ul>
    </div>`;
  }

  function render(): void {
    const p = getProfile();
    if (!p) return;
    const h = p.heroes[id];
    sheet.el.classList.toggle('eveil-mode', mode === 'eveil');
    if (!h) {
      sheet.body.innerHTML = `<div class="hs-unowned"><p>Tu n’as pas encore ce héros.</p>
        <button class="mr-btn yellow" data-a="packs">Le trouver dans les tirages</button></div>${statsBlock(undefined)}`;
      return;
    }
    if (mode === 'eveil') { sheet.body.innerHTML = awakeningView(p, h); return; }
    sheet.body.innerHTML = `${levelBlock(p, h)}
      <section class="hs-sec"><h3>Talents</h3>${talentBlock(p, h)}</section>
      ${statsBlock(h)}`;
  }
  render();
  const off = onProfileChange(() => render());
  sheet.onClose(() => { off(); stops.forEach((f) => f()); });

  function burst(text: string, cls = ''): void {
    const b = el('div', `hs-burst ${cls}`, `<span>${text}</span>`);
    art.appendChild(b);
    art.classList.remove('flash'); void art.offsetWidth; art.classList.add('flash');
    window.setTimeout(() => b.remove(), 1400);
  }

  sheet.body.addEventListener('click', async (e) => {
    const t = e.target as HTMLElement;
    const opt = t.closest<HTMLButtonElement>('[data-tier]');
    if (opt && !opt.disabled) {
      const tier = Number(opt.dataset['tier']) as TalentTier, op = Number(opt.dataset['opt']) as 0 | 1;
      let ok = false;
      await updateProfile((q) => { ok = chooseTalent(q, id, tier, op); });
      if (ok) { emitMeta('heroUpgraded', { unit: id, kind: 'talent' }); toast('Talent choisi !'); }
      else toast('Il te faut plus de parchemins.', 'warn');
      return;
    }
    const a = t.closest<HTMLElement>('[data-a]')?.dataset['a'];
    if (a === 'up') {
      const p = getProfile()!, h = p.heroes[id]!, c = levelUpCost(h);
      const miss = c && missingFor(p, h, c);
      if (miss) { toast(miss, 'warn'); return; }
      let ok = false;
      await updateProfile((q) => { ok = levelUp(q, id); });
      if (ok) { burst(`Niveau ${getProfile()!.heroes[id]!.level} !`); emitMeta('heroUpgraded', { unit: id, kind: 'niveau' }); navigator.vibrate?.(30); }
    } else if (a === 'deck') { sheet.close(); o.onDeck?.(id); }
    else if (a === 'packs') { sheet.close(); o.go('#tirages'); }
    else if (a === 'eveil') { mode = 'eveil'; render(); }
    else if (a === 'fiche') { mode = 'fiche'; render(); }
    else if (a === 'awaken') {
      const p = getProfile()!, h = p.heroes[id]!, c = awakeningCost(h);
      const miss = c && missingFor(p, h, c);
      if (!c || miss) { toast(miss ?? 'Éveil impossible.', 'warn'); return; }
      let ok = false;
      await updateProfile((q) => { ok = awaken(q, id); });
      if (!ok) return;
      const star = getProfile()!.heroes[id]!.awakening;
      art.classList.add('awakening');
      burst(`★${star}`, 'star');
      const passive = passivesFor(id).find((x) => x.star === star);
      if (passive) window.setTimeout(() => toast(`Passif débloqué : ${passive.name}`), 900);
      window.setTimeout(() => art.classList.remove('awakening'), 1600);
      sheet.body.querySelector(`.aw-stars i:nth-child(${star})`)?.classList.add('pop');
      emitMeta('heroUpgraded', { unit: id, kind: 'eveil' });
      navigator.vibrate?.([30, 40, 60]);
    }
  });
  return sheet;
}
