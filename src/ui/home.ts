// Accueil (§8.1) : logo, deck actif, gros bouton Campagne, Solo Infini (débloqué après le chapitre 1),
// coffre quotidien, raccourcis Tirages / Collection / Decks / Encyclopédie. Monté dans la coquille.
import './home.css';
import { STARTER_DECKS } from '../data/units';
import { claimDailyChest, dailyChestReady, infiniteUnlocked } from '../meta/economy';
import { activeDeck, getProfile, onProfileChange, updateProfile, type Profile } from '../meta/profile';
import { freePullsTotal } from '../meta/pulls';
import { readSavedGame, savedGameLabel } from '../meta/savegame';
import { icon, tokenUrl, toast } from './kit';

export interface HomeOptions {
  go: (hash: string) => void;
  onInfinite: () => void;
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
    <div class="hm-grid">
      <button class="hm-tile chest" data-a="coffre" data-tuto="home-coffre">${icon('coffre')}<b>Coffre</b><small class="chest-sub"></small></button>
      <button class="hm-tile" data-a="tirages" data-tuto="home-tirages">${icon('tirages')}<b>Tirages</b><span class="hm-badge" hidden></span></button>
      <button class="hm-tile" data-a="collection" data-tuto="home-collection">${icon('collection')}<b>Collection</b></button>
      <button class="hm-tile" data-a="decks" data-tuto="home-decks">${icon('cartes')}<b>Decks</b></button>
    </div>`;
  host.appendChild(wrap);

  const deckEl = wrap.querySelector<HTMLElement>('.hm-deck')!;
  const infBtn = wrap.querySelector<HTMLButtonElement>('[data-a="infini"]')!;
  const infSub = infBtn.querySelector<HTMLElement>('.sub')!;
  const chest = wrap.querySelector<HTMLButtonElement>('[data-a="coffre"]')!;
  const chestSub = chest.querySelector<HTMLElement>('.chest-sub')!;
  const badge = wrap.querySelector<HTMLElement>('.hm-badge')!;
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
  }
  render(getProfile());
  const off = onProfileChange(render);

  wrap.addEventListener('click', async (e) => {
    const a = (e.target as HTMLElement).closest<HTMLElement>('[data-a]')?.dataset['a'];
    const p = getProfile();
    if (!a || !p) return;
    if (a === 'reprendre') o.go('#reprendre');
    else if (a === 'campagne') o.go('#campagne');
    else if (a === 'tirages') o.go('#tirages');
    else if (a === 'collection') o.go('#collection');
    else if (a === 'decks') o.go('#decks');
    else if (a === 'infini') {
      if (infiniteUnlocked(p)) o.onInfinite();
      else { infBtn.classList.remove('nope'); void infBtn.offsetWidth; infBtn.classList.add('nope'); toast('Termine le chapitre 1 de la campagne pour débloquer le Solo Infini.', 'warn'); }
    } else if (a === 'coffre') {
      if (!dailyChestReady(p)) { toast('Le coffre quotidien revient demain.', 'warn'); return; }
      await updateProfile((q) => { claimDailyChest(q); });
      chest.classList.add('open');
      window.setTimeout(() => chest.classList.remove('open'), 900);
      toast('Coffre quotidien : +150 éclats et +5 ✦ !');
    }
  });

  return () => { off(); wrap.remove(); };
}
