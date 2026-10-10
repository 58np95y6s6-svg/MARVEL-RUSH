// Feuilles « D'où vient… ? » ouvertes par les ➕ de la barre de monnaies (en-tête de la coquille) :
// or, cristaux d'éveil, parchemins de talent. Les gemmes ont leur feuille détaillée (gemsSheet.ts).
// Les montants sont lus dans les constantes du jeu.
import { DAILY_CHEST, INFINITE_GOLD_PER_WAVE, INFINITE_TIERS, MAXED_DUPLICATE_CRYSTALS } from '../meta/economy';
import { CHESTS } from '../meta/chests';
import type { Profile } from '../meta/profile';
import { QUEST_DEFS, WEEKLY_BONUS_CRYSTALS } from '../meta/quests';
import { openGemsSheet } from './gemsSheet';
import { fmt, icon, openSheet, type IconName } from './kit';

export type Currency = 'gems' | 'gold' | 'crystals' | 'scrolls';

interface Src { ic: IconName; title: string; amount: string; detail: string; go?: string }

function sources(c: Exclude<Currency, 'gems'>): { title: string; intro: string; list: Src[] } {
  const q = Object.values(QUEST_DEFS).map((d) => d.reward.gold);
  const tierC = INFINITE_TIERS.map((t) => t.crystals);
  const tierS = INFINITE_TIERS.filter((t) => t.scrolls > 0);
  if (c === 'gold') return {
    title: 'Gagner de l’or', intro: 'L’or sert à monter tes héros de niveau (avec leurs cartes).',
    list: [
      { ic: 'cartes', title: 'Quêtes du jour', amount: `+${Math.min(...q)} – ${Math.max(...q)}`, detail: 'Trois quêtes par jour, à réclamer.', go: '#quetes' },
      { ic: 'coffre', title: 'Coffres', amount: `+${CHESTS.bois.gold} – ${fmt(CHESTS.legendaire.gold)}`, detail: 'Coffre quotidien, coffres de victoire et de palier.', go: '' },
      { ic: 'campagne', title: 'Campagne', amount: 'par ★', detail: 'Chaque étoile gagnée rapporte de l’or, et les boss laissent du butin.', go: '#campagne' },
      { ic: 'xp', title: 'Route des récompenses', amount: 'par niv.', detail: 'De l’or à chaque niveau de compte.', go: '#route' },
      { ic: 'record', title: 'Solo Infini', amount: `+${INFINITE_GOLD_PER_WAVE} / vague`, detail: 'Plus tu tiens, plus tu gagnes.' },
    ],
  };
  if (c === 'crystals') return {
    title: 'Gagner des cristaux', intro: 'Les cristaux ✦ servent à l’Éveil des héros au niveau maximum.',
    list: [
      { ic: 'coffre', title: 'Coffre quotidien', amount: `+${DAILY_CHEST.crystals}`, detail: 'Tous les jours, à minuit.', go: '' },
      { ic: 'combat', title: 'Boss de campagne', amount: '+10 / +20', detail: 'Première victoire sur un lieutenant ou un boss.', go: '#campagne' },
      { ic: 'xp', title: 'Route des récompenses', amount: '+30', detail: 'Un niveau de compte sur deux.', go: '#route' },
      { ic: 'record', title: 'Paliers du Solo Infini', amount: `+${Math.min(...tierC)} – ${Math.max(...tierC)}`, detail: 'Vagues 10, 20… 50, une fois par jour chacun.' },
      { ic: 'coffre', title: 'Coffre de la semaine', amount: `+${WEEKLY_BONUS_CRYSTALS}`, detail: 'Au bout des quêtes de la semaine.', go: '#quetes' },
      { ic: 'cartes', title: 'Doublon d’un héros au maximum', amount: `+${MAXED_DUPLICATE_CRYSTALS}`, detail: 'Par carte en trop.', go: '#tirages' },
    ],
  };
  return {
    title: 'Gagner des parchemins', intro: 'Les parchemins servent à choisir les talents des héros.',
    list: [
      { ic: 'campagne', title: 'Coffres d’étoiles de chapitre', amount: '+1 / +1 / +2', detail: 'À 10, 20 et 30 ★ dans chaque chapitre.', go: '#campagne' },
      { ic: 'record', title: 'Paliers du Solo Infini', amount: `+${Math.min(...tierS.map((t) => t.scrolls))} – ${Math.max(...tierS.map((t) => t.scrolls))}`, detail: `Vagues ${tierS.map((t) => t.wave).join(', ')}, puis 1 toutes les 10 vagues après 50.` },
    ],
  };
}

export function openCurrencySheet(overlay: HTMLElement, p: Profile, c: Currency, go: (hash: string) => void): void {
  if (c === 'gems') { openGemsSheet(overlay, p, go); return; }
  const s = sources(c);
  const ic: IconName = c === 'gold' ? 'or' : c === 'crystals' ? 'cristaux' : 'parchemins';
  const sheet = openSheet(overlay, {
    title: s.title, cls: 'cur-sheet',
    html: `<p class="cur-intro">${icon(ic)}<span>${s.intro}</span></p>
      <ul class="cur-list">${s.list.map((x) => `<li class="rr-row">${icon(x.ic)}<div><b>${x.title}</b><small>${x.detail}</small></div>
        <span class="cur-amt">${x.amount}</span>${x.go !== undefined ? `<button class="mr-btn blue cur-go" data-go="${x.go}" aria-label="Y aller">➜</button>` : ''}</li>`).join('')}</ul>`,
  });
  sheet.body.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-go]');
    if (!b) return;
    sheet.close();
    go(b.dataset['go']!);
  });
}
