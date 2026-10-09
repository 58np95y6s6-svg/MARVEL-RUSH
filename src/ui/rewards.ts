// Fin de partie Solo Infini (§8.11) : vague atteinte, récompenses créditées (éclats par vague, coffres
// de palier, cristaux, parchemins, record), puis « Rejouer » ou « Accueil ».
import type { BossId } from '../data/types';
import { UNITS } from '../data/units';
import { applyInfiniteGame, type InfiniteResult } from '../meta/economy';
import { emitMeta } from '../meta/events';
import { getProfile, updateProfile } from '../meta/profile';
import { el, esc, fmt, icon, type IconName } from './kit';

export interface InfiniteEnd {
  won: boolean;
  wave: number;
  bossKills?: { boss: BossId; small: boolean; wave: number }[];
}

/** Crédite les récompenses (une seule fois) et affiche l'écran de fin par-dessus le combat. */
export async function showInfiniteRewards(root: HTMLElement, end: InfiniteEnd, o: { onReplay: () => void; onHome: () => void }): Promise<void> {
  const wavesCleared = end.won ? end.wave : Math.max(0, end.wave - 1);
  const bigBosses = (end.bossKills ?? []).filter((k) => !k.small && k.wave % 10 === 0).map((k) => k.boss);
  let res: InfiniteResult | null = null;
  if (getProfile()) await updateProfile((p) => { res = applyInfiniteGame(p, { wavesCleared, bigBosses }); });
  const r = res as InfiniteResult | null;
  const p = getProfile();
  const box = el('div', 'rw');
  const lines = r?.lines ?? [];
  const iconFor = (i: string): IconName => (i === 'eclats' || i === 'cristaux' || i === 'parchemins' || i === 'coffre' || i === 'record' || i === 'cartes' || i === 'xp' ? i : 'coffre') as IconName;
  box.innerHTML = `
    <div class="rw-panel">
      <h2 class="rw-title">${end.won ? 'Victoire !' : 'Fin de partie'}</h2>
      <p class="rw-wave">Vagues tenues<b>${wavesCleared}</b>${p ? `<small>Record : ${p.infiniteBest}</small>` : ''}</p>
      <ul class="rw-list">${lines.map((l, i) => `<li style="--d:${200 + i * 160}ms" class="${l.icon}">${icon(iconFor(l.icon))}<span><b>${esc(l.label)}</b>${l.detail ? `<small>${esc(l.detail)}</small>` : ''}</span></li>`).join('')
        || '<li style="--d:200ms"><span><b>Pas de récompense cette fois</b><small>Tiens au moins une vague !</small></span></li>'}</ul>
      ${r ? `<div class="rw-total">
        <span>${icon('eclats')}+${fmt(r.total.shards)}</span>
        ${r.total.crystals ? `<span>${icon('cristaux')}+${fmt(r.total.crystals)}</span>` : ''}
        ${r.total.scrolls ? `<span>${icon('parchemins')}+${r.total.scrolls}</span>` : ''}
        <span>${icon('xp')}+${fmt(r.total.xp)} XP</span></div>` : ''}
      ${r?.heroes.length ? `<p class="rw-heroes">${r.heroes.map((h) => `${esc(UNITS[h.unit].name)}${h.outcome === 'nouveau' ? ' rejoint ta collection !' : ' : +1 carte'}`).join('<br>')}</p>` : ''}
      <div class="rw-row"><button class="mr-btn yellow" data-a="replay" data-tuto="end-replay">Rejouer</button><button class="mr-btn" data-a="home" data-tuto="end-home">Accueil</button></div>
    </div>`;
  root.appendChild(box);
  box.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLElement>('[data-a]')?.dataset['a'];
    if (a === 'replay') { box.remove(); o.onReplay(); }
    if (a === 'home') { box.remove(); o.onHome(); }
  });
  emitMeta('rewards', { mode: 'infini', waves: wavesCleared });
}
