// Quêtes du jour (3, remises à zéro à minuit, heure locale) et coffre de la semaine. Monté dans la
// coquille (route #quetes). Réclamer : l'or et les gemmes s'envolent vers l'en-tête.
import './quests.css';
import type { ChestContent } from '../meta/chests';
import { getProfile, onProfileChange, today, updateProfile, type Profile } from '../meta/profile';
import { QUEST_DEFS, WEEKLY_BONUS_GEMS, WEEKLY_GOAL, claimQuest, claimWeekly, ensureQuests, questDef, type QuestId } from '../meta/quests';
import { balanceOf, chestMiniSvg, flyToHeader, playChests } from './chestOpening';
import { esc, fmt, icon, toast, type IconName } from './kit';

const QUEST_ICON: Record<QuestId, IconName> = {
  fusions: 'cartes', boss: 'combat', niveaux: 'campagne', vagues: 'record', invocations: 'tirages', ameliorer: 'collection', etoiles: 'xp', infini: 'record',
};

/** « 5 h 12 » avant minuit (heure locale). */
export function untilMidnight(now = new Date()): string {
  const m = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
  const h = Math.floor(m / 3.6e6), min = Math.floor((m % 3.6e6) / 6e4);
  return h > 0 ? `${h} h ${String(min).padStart(2, '0')}` : `${min} min`;
}

export function mountQuests(host: HTMLElement, o: { overlay: HTMLElement; go: (hash: string) => void }): () => void {
  const wrap = document.createElement('div');
  wrap.className = 'qs scroll';
  host.appendChild(wrap);
  let busy = false;

  function render(p: Profile | null): void {
    if (!p || busy) return;
    const q = p.quests && p.quests.day === today() ? p.quests : null;
    if (!q) { void updateProfile((x) => { ensureQuests(x); }); return; }
    const week = Math.min(WEEKLY_GOAL, q.weekDone);
    const weekReady = !q.weekClaimed && q.weekDone >= WEEKLY_GOAL;
    wrap.innerHTML = `
      <div class="qs-head"><button class="qs-back" data-a="back">‹ Accueil</button><h2 class="scr-title">Quêtes du jour</h2></div>
      <p class="qs-timer">Nouvelles quêtes dans <b>${untilMidnight()}</b></p>
      <ul class="qs-list">${q.list.map((it, i) => {
        const def = questDef(it.id);
        if (!def) return '';
        const done = it.progress >= it.target;
        const pct = Math.min(100, (it.progress / it.target) * 100);
        return `<li class="qs-q${done ? ' done' : ''}${it.claimed ? ' claimed' : ''}" data-tuto="quest-${i}">
          <span class="qs-ic">${icon(QUEST_ICON[def.id as QuestId] ?? 'xp')}</span>
          <div class="qs-mid"><b>${esc(def.label(def.target))}</b>
            <span class="qs-bar"><i style="width:${pct}%"></i><span>${fmt(it.progress)} / ${fmt(it.target)}</span></span>
            <span class="qs-rw">${icon('or')}${fmt(def.reward.gold)} ${icon('gemmes')}${def.reward.gems}</span></div>
          ${it.claimed ? '<span class="qs-ok">✔</span>'
            : `<button class="mr-btn ${done ? 'green' : ''} qs-claim" data-q="${i}" ${done ? '' : 'disabled'}>${done ? 'Réclamer' : 'En cours'}</button>`}
        </li>`;
      }).join('')}</ul>
      <section class="qs-week${weekReady ? ' ready' : ''}${q.weekClaimed ? ' claimed' : ''}">
        <div class="qs-week-chest">${chestMiniSvg('legendaire')}</div>
        <div class="qs-mid"><b>Coffre de la semaine</b>
          <small>Réclame ${WEEKLY_GOAL} quêtes d’ici dimanche : coffre légendaire + ${WEEKLY_BONUS_GEMS} gemmes</small>
          <span class="qs-bar week"><i style="width:${(week / WEEKLY_GOAL) * 100}%"></i><span>${week} / ${WEEKLY_GOAL}</span></span></div>
        ${q.weekClaimed ? '<span class="qs-ok">✔</span>' : `<button class="mr-btn ${weekReady ? 'yellow' : ''} qs-claim" data-a="week" ${weekReady ? '' : 'disabled'}>Ouvrir</button>`}
      </section>
      <p class="qs-foot">Les quêtes avancent dans tous les modes : campagne et Solo Infini. Toutes les quêtes possibles :
        ${Object.values(QUEST_DEFS).map((d) => esc(d.label(d.target))).join(' · ')}.</p>`;
  }
  render(getProfile());
  const off = onProfileChange(render);

  wrap.addEventListener('click', async (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('[data-a="back"]')) { o.go(''); return; }
    const b = t.closest<HTMLButtonElement>('button');
    if (!b || b.disabled || busy) return;
    if (b.dataset['q'] !== undefined) {
      const i = Number(b.dataset['q']);
      const p = getProfile();
      const it = p?.quests?.list[i];
      const def = it && questDef(it.id);
      if (!p || !def || it.claimed || it.progress < it.target) return;
      busy = true;
      b.disabled = true;
      b.classList.add('pop');
      await flyToHeader(b, { gold: def.reward.gold, shards: def.reward.gems });
      busy = false;
      await updateProfile((x) => { claimQuest(x, i); });
      toast(`+${fmt(def.reward.gold)} or et +${def.reward.gems} gemmes !`);
    } else if (b.dataset['a'] === 'week') {
      let got: ChestContent | null = null;
      await updateProfile((x) => { got = claimWeekly(x); });
      const c = got as ChestContent | null;
      if (c) await playChests(o.overlay, [{ content: c, title: 'Coffre de la semaine', subtitle: `${WEEKLY_GOAL} quêtes réussies !` }], balanceOf(getProfile()));
    }
  });
  return () => { off(); wrap.remove(); };
}
