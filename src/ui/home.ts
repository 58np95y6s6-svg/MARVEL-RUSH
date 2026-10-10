// Accueil (§8.1) : logo, deck actif, gros bouton Campagne, Solo Infini (débloqué après le chapitre 1),
// coffre quotidien (ouverture animée), quêtes du jour, Route des récompenses, Tirages. Monté dans la coquille.
import './home.css';
import { STARTER_DECKS } from '../data/units';
import { accountLevel, claimDailyChest, dailyChestReady, infiniteUnlocked } from '../meta/economy';
import { activeDeck, getProfile, today, onProfileChange, updateProfile, type Profile } from '../meta/profile';
import { freePullsTotal } from '../meta/pulls';
import { ensureQuests, questsClaimable } from '../meta/quests';
import { roadClaimable } from '../meta/road';
import type { ChestContent } from '../meta/chests';
import { balanceOf, playChests } from './chestOpening';
import { readSavedGame, savedGameLabel } from '../meta/savegame';
import { icon, tokenUrl, toast } from './kit';
import { coopService } from '../net/service';
import { presenceBadgeHtml } from './coop';
import './coop.css';

export interface HomeOptions {
  go: (hash: string) => void;
  onInfinite: () => void;
  /** Hôte plein écran (ouverture du coffre quotidien). */
  overlay?: HTMLElement;
}

export function mountHome(host: HTMLElement, o: HomeOptions): () => void {
  const wrap = document.createElement('div');
  wrap.className = 'hm';
  wrap.innerHTML = `
    <div class="hm-sky"><i class="c1"></i><i class="c2"></i><i class="c3"></i></div>
    <h1 class="mr-logo hm-logo"><span>MARVEL</span> <em>RUSH</em></h1>
    <div class="hm-deck" data-tuto="home-deck" aria-label="Ton deck"></div>
    <button class="mr-btn green hm-resume" data-a="reprendre" hidden>
      <span class="t">Reprendre la partie</span><small class="sub"></small>
    </button>
    <button class="mr-btn yellow hm-campaign" data-a="campagne" data-tuto="home-campagne">
      <span class="t">Campagne</span><small>Chapitres, étoiles et boss</small>
    </button>
    <button class="mr-btn hm-infinite" data-a="infini" data-tuto="home-infini">
      <span class="t">Solo Infini</span><small class="sub"></small>
    </button>
    <button class="mr-btn hm-duo" data-a="duo" data-tuto="home-duo">
      <span class="hm-duo-b"></span><span class="hm-duo-r"><span class="t">Jouer à deux</span><small class="duo-sub"></small></span>
    </button>
    <div class="hm-grid">
      <button class="hm-tile chest" data-a="coffre" data-tuto="home-coffre">${icon('coffre')}<b>Coffre</b><small class="chest-sub"></small></button>
      <button class="hm-tile quests" data-a="quetes" data-tuto="home-quetes">${icon('record')}<b>Quêtes</b><small class="q-sub"></small><span class="hm-badge q-badge" hidden></span></button>
      <button class="hm-tile road" data-a="route" data-tuto="home-route">${icon('xp')}<b>Route</b><small class="r-sub"></small><span class="hm-badge r-badge" hidden></span></button>
      <button class="hm-tile" data-a="tirages" data-tuto="home-tirages">${icon('tirages')}<b>Tirages</b><small>Packs</small><span class="hm-badge p-badge" hidden></span></button>
    </div>`;
  host.appendChild(wrap);

  const deckEl = wrap.querySelector<HTMLElement>('.hm-deck')!;
  const infBtn = wrap.querySelector<HTMLButtonElement>('[data-a="infini"]')!;
  const infSub = infBtn.querySelector<HTMLElement>('.sub')!;
  const chest = wrap.querySelector<HTMLButtonElement>('[data-a="coffre"]')!;
  const chestSub = chest.querySelector<HTMLElement>('.chest-sub')!;
  const badge = wrap.querySelector<HTMLElement>('.p-badge')!;
  const qBadge = wrap.querySelector<HTMLElement>('.q-badge')!;
  const rBadge = wrap.querySelector<HTMLElement>('.r-badge')!;
  const qSub = wrap.querySelector<HTMLElement>('.q-sub')!;
  const rSub = wrap.querySelector<HTMLElement>('.r-sub')!;
  const resumeBtn = wrap.querySelector<HTMLButtonElement>('[data-a="reprendre"]')!;
  let deckKey = '';

  function render(p: Profile | null): void {
    if (!p) return;
    const deck = activeDeck(p, STARTER_DECKS.marvel);
    const key = deck.join(',');
    if (key !== deckKey) {
      deckKey = key;
      deckEl.innerHTML = deck.map((id, i) => `<img src="${tokenUrl(id)}" alt="" style="--i:${i}">`).join('');
    }
    const saved = readSavedGame(p);
    resumeBtn.hidden = !saved;
    if (saved) resumeBtn.querySelector<HTMLElement>('.sub')!.textContent = savedGameLabel(saved);
    const unlocked = infiniteUnlocked(p);
    infBtn.classList.toggle('locked', !unlocked);
    infSub.innerHTML = unlocked
      ? (p.infiniteBest > 0 ? `${icon('record')} Record : ${p.infiniteBest} vagues` : 'Tiens le plus de vagues possible')
      : `${icon('lock')} Termine le chapitre 1 de la campagne`;
    const ready = dailyChestReady(p);
    chest.classList.toggle('ready', ready);
    chestSub.textContent = ready ? 'Prêt !' : 'Demain';
    const free = freePullsTotal(p);
    badge.hidden = free === 0;
    badge.textContent = String(free);
    const q = p.quests;
    const qc = questsClaimable(p);
    qBadge.hidden = qc === 0;
    qBadge.textContent = String(qc);
    const doneToday = q && q.day === today() ? q.list.filter((x) => x.claimed).length : 0;
    qSub.textContent = `${doneToday}/3`;
    const rc = roadClaimable(p).length;
    rBadge.hidden = rc === 0;
    rBadge.textContent = String(rc);
    rSub.textContent = `Niv. ${accountLevel(p.xp).level}`;
    wrap.querySelector('.quests')!.classList.toggle('ready', qc > 0);
    wrap.querySelector('.road')!.classList.toggle('ready', rc > 0);
  }
  // Quêtes du jour : tirées dès l'arrivée sur l'accueil (minuit, heure locale).
  { const p = getProfile(); if (p && p.quests?.day !== today()) void updateProfile((q) => { ensureQuests(q); }); }
  render(getProfile());
  const off = onProfileChange(render);
  // Présence de la partenaire (avatar, point vert, ce qu'elle fait).
  const duoB = wrap.querySelector<HTMLElement>('.hm-duo-b')!, duoSub = wrap.querySelector<HTMLElement>('.duo-sub')!;
  const renderDuo = () => {
    const tmp = document.createElement('div');
    tmp.innerHTML = presenceBadgeHtml();
    duoB.replaceChildren(tmp.firstElementChild!);
    const pr = coopService.partner();
    duoSub.textContent = pr ? `${pr.name} est en ligne !` : (tmp.querySelector('small')?.textContent ?? '');
  };
  renderDuo();
  const offDuo = coopService.onChange(renderDuo);

  wrap.addEventListener('click', async (e) => {
    const a = (e.target as HTMLElement).closest<HTMLElement>('[data-a]')?.dataset['a'];
    const p = getProfile();
    if (!a || !p) return;
    if (a === 'reprendre') o.go('#reprendre');
    else if (a === 'campagne') o.go('#campagne');
    else if (a === 'tirages') o.go('#tirages');
    else if (a === 'quetes') o.go('#quetes');
    else if (a === 'route') o.go('#route');
    else if (a === 'duo') o.go('#coop');
    else if (a === 'infini') {
      if (infiniteUnlocked(p)) o.onInfinite();
      else { infBtn.classList.remove('nope'); void infBtn.offsetWidth; infBtn.classList.add('nope'); toast('Termine le chapitre 1 de la campagne pour débloquer le Solo Infini.', 'warn'); }
    } else if (a === 'coffre') {
      if (!dailyChestReady(p)) { toast('Le coffre quotidien revient demain, à minuit.', 'warn'); return; }
      let got: ChestContent | null = null;
      await updateProfile((q) => { got = claimDailyChest(q); });
      const c = got as ChestContent | null;
      if (!c) return;
      chest.classList.add('open');
      window.setTimeout(() => chest.classList.remove('open'), 900);
      await playChests(o.overlay ?? host, [{ content: c, subtitle: 'Coffre quotidien' }], balanceOf(getProfile()));
    }
  });

  return () => { off(); offDuo(); wrap.remove(); };
}
