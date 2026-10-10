// Feuille « Comment gagner des gemmes ? » (écran Tirages) : toutes les sources de gemmes avec leurs montants,
// ce qu'il reste à prendre (premières victoires, calendrier, route) et des raccourcis vers les quêtes et la campagne.
// Les montants sont lus dans les constantes du jeu : la feuille suit l'équilibrage sans retouche.
import { CHAPTERS, STAR_CHEST_THRESHOLDS, chapterLevels } from '../campaign/levels';
import { BOSS_FIRST_GEMS, GEMS_PER_NEW_STAR, chestReward } from '../campaign/progress';
import { CHESTS } from '../meta/chests';
import { DAILY_CHEST, INFINITE_RECORD_BONUS, accountLevel } from '../meta/economy';
import { FIRST_CLEAR_GEMS, QUEST_ROOKIE_GEMS, QUEST_ROOKIE_LEVEL, WELCOME_CALENDAR, firstClearGems, threeStarGems, welcomeState } from '../meta/gems';
import type { Profile } from '../meta/profile';
import { QUEST_DEFS, WEEKLY_BONUS_GEMS, WEEKLY_GOAL } from '../meta/quests';
import { ROAD_ROOKIE_MAX, roadReward } from '../meta/road';
import { fmt, icon, openSheet, type IconName } from './kit';

const G = '💎';

/** Gemmes de première victoire encore à prendre (niveaux des chapitres 1 à 3 pas encore gagnés). */
export function firstClearGemsLeft(p: Profile): { gems: number; levels: number } {
  let gems = 0, levels = 0;
  for (let c = 1; c <= FIRST_CLEAR_GEMS.length; c++) {
    for (const l of chapterLevels(c)) {
      if (p.campaign[l.id]?.stars[0]) continue;
      gems += firstClearGems(c); levels++;
    }
  }
  return { gems, levels };
}

/** Gemmes (et lots de 10) encore à prendre sur la Route jusqu'au niveau ROAD_ROOKIE_MAX. */
function roadRookieLeft(p: Profile): { gems: number; pulls: number } {
  let gems = 0, pulls = 0;
  for (let l = 2; l <= ROAD_ROOKIE_MAX; l++) {
    if ((p.roadClaimed ?? []).includes(l)) continue;
    const r = roadReward(l);
    gems += r.gems ?? 0; pulls += r.pulls ?? 0;
  }
  return { gems, pulls };
}

export function openGemsSheet(overlay: HTMLElement, p: Profile, go: (hash: string) => void): void {
  const fc = firstClearGemsLeft(p);
  const ws = welcomeState(p);
  const road = roadRookieLeft(p);
  const lv = accountLevel(p.xp).level;
  const qGems = Object.values(QUEST_DEFS).map((d) => d.reward.gems);
  const starChests = STAR_CHEST_THRESHOLDS.map((t) => chestReward(t, null).shards ?? 0);
  const row = (ic: IconName, title: string, amount: string, detail: string, extra = '') =>
    `<li class="gs-row${extra}">${icon(ic)}<div><b>${title}</b><small>${detail}</small></div><span class="gs-amt">${amount}</span></li>`;
  const cal = WELCOME_CALENDAR.map((d, i) =>
    `<span class="gs-cal${i < ws.claimed ? ' done' : ''}"><small>J${d.day}</small><b>${d.gems ? fmt(d.gems) : ''}</b>${d.pulls ? '<em>+×10</em>' : ''}</span>`).join('');
  const s = openSheet(overlay, {
    title: `${G} Gagner des gemmes`, tall: true, cls: 'gs-sheet',
    html: `
      <p class="gs-intro">Les gemmes ne servent qu’aux packs (×1 : ${fmt(100)} ${G}, ×10 : ${fmt(900)} ${G}). Le début de partie en donne <b>beaucoup</b> :</p>
      <h4 class="gs-h">Début de partie</h4>
      <ul class="gs-list">
        ${row('campagne', 'Première victoire d’un niveau', `+${FIRST_CLEAR_GEMS.join(' / ')}`, `Chapitres 1 / 2 / 3, chaque niveau. ${fc.levels ? `Encore <b>${fmt(fc.gems)} ${G}</b> à prendre (${fc.levels} niveaux).` : 'Tout est pris !'}`, fc.levels ? ' hot' : '')}
        ${row('coffre', 'Calendrier de bienvenue', `${fmt(WELCOME_CALENDAR.reduce((n, d) => n + d.gems, 0))} + 3×10`, ws.claimed >= WELCOME_CALENDAR.length ? 'Terminé.' : `Un jour par connexion (${ws.claimed}/7 réclamés).`, ws.claimed < 7 ? ' hot' : '')}
        ${ws.claimed < WELCOME_CALENDAR.length ? `<li class="gs-calrow">${cal}</li>` : ''}
        ${row('xp', 'Route des récompenses, niveaux 2 à 15', '150 – 300', `Lots de 10 offerts aux niveaux 5, 10 et 15. ${road.gems || road.pulls ? `Encore <b>${fmt(road.gems)} ${G}</b> et ${road.pulls / 10} lot${road.pulls > 10 ? 's' : ''} de 10.` : 'Tout est pris !'}`, lv <= ROAD_ROOKIE_MAX ? ' hot' : '')}
        ${row('cartes', 'Quêtes du jour, bonus débutant', `+${QUEST_ROOKIE_GEMS}`, `Par quête, jusqu’au niveau de compte ${QUEST_ROOKIE_LEVEL}${lv < QUEST_ROOKIE_LEVEL ? ` (tu es niveau ${lv})` : ' (terminé)'}.`)}
      </ul>
      <h4 class="gs-h">Tous les jours</h4>
      <ul class="gs-list">
        ${row('coffre', 'Coffre quotidien', `+${DAILY_CHEST.gems + CHESTS[DAILY_CHEST.tier].gems}`, `Coffre d’argent + ${DAILY_CHEST.gems} ${G}, à minuit.`)}
        ${row('cartes', 'Quêtes du jour (3)', `+${Math.min(...qGems)} – ${Math.max(...qGems)}`, `Chacune. Coffre de la semaine (${WEEKLY_GOAL} quêtes) : +${WEEKLY_BONUS_GEMS + CHESTS.legendaire.gems} ${G} et un lot de 10 tirages offert.`)}
        ${row('record', 'Solo Infini', `+${INFINITE_RECORD_BONUS.gems}`, `Par nouveau record. Coffres de palier (10, 20… 50) : +${CHESTS.bois.gems} à +${CHESTS.legendaire.gems} ${G}.`)}
      </ul>
      <h4 class="gs-h">Campagne</h4>
      <ul class="gs-list">
        ${row('xp', 'Étoiles nouvelles', `+${GEMS_PER_NEW_STAR}`, `Par étoile. Premières 3 ★ d’un niveau : +${threeStarGems(1)} (ch. 1-2), +${threeStarGems(3)} (ch. 3), +${threeStarGems(4)} ensuite.`)}
        ${row('coffre', 'Coffres d’étoiles du chapitre', `+${starChests.join(' / ')}`, `À ${STAR_CHEST_THRESHOLDS.join(', ')} ★ dans chaque chapitre (${CHAPTERS.length} chapitres).`)}
        ${row('combat', 'Boss de chapitre', `+${BOSS_FIRST_GEMS}`, 'Première victoire sur le boss du niveau 10.')}
        ${row('coffre', 'Coffres de victoire', `+${CHESTS.bois.gems} – ${CHESTS.legendaire.gems}`, 'Bois, argent, or, héroïque ou légendaire selon le niveau.')}
        ${row('xp', 'Route, ensuite', '+40', 'Un niveau de compte sur deux ; lot de 10 offert tous les 10 niveaux.')}
      </ul>
      <div class="gs-go">
        <button class="mr-btn yellow" data-go="#campagne">${icon('campagne')}Campagne</button>
        <button class="mr-btn green" data-go="#quetes">${icon('cartes')}Quêtes du jour</button>
        <button class="mr-btn" data-go="#route">${icon('xp')}Route</button>
      </div>`,
  });
  s.body.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-go]');
    if (!b) return;
    s.close();
    go(b.dataset['go']!);
  });
}
