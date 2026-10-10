// Fin de partie Solo Infini (§8.11) : les coffres de palier s'ouvrent d'abord (animation de coffre,
// l'or et les gemmes montent dans la barre des monnaies), puis le récapitulatif : vague atteinte,
// lignes de récompenses (or par vague, butin des boss, coffres, cristaux, record), totaux qui défilent,
// « Rejouer » ou « Accueil ».
import type { BossId } from '../data/types';
import { UNITS } from '../data/units';
import { bossKillGold } from '../meta/chests';
import { applyInfiniteGame, type InfiniteResult } from '../meta/economy';
import { emitMeta } from '../meta/events';
import { getProfile, updateProfile } from '../meta/profile';
import { balanceOf, countUp, playChests } from './chestOpening';
import { el, esc, fmt, icon, type IconName } from './kit';

export interface InfiniteEnd {
  won: boolean;
  wave: number;
  bossKills?: { boss: BossId; small: boolean; wave: number }[];
  merges?: number;
  summons?: number;
}

/** Totaux d'une fin de partie, comptés de 0 au montant (pastilles « +1 250 »). */
export function totalsHtml(t: { gold?: number; shards?: number; crystals?: number; scrolls?: number; xp?: number }): string {
  const chip = (ic: IconName, v: number | undefined, suffix = '') =>
    (v ? `<span class="rw-chip">${icon(ic)}<b data-to="${v}" data-suffix="${suffix}">+0${suffix}</b></span>` : '');
  return `${chip('or', t.gold)}${chip('gemmes', t.shards)}${chip('cristaux', t.crystals)}${chip('parchemins', t.scrolls)}${chip('xp', t.xp, ' XP')}`;
}

/** Lance le défilement des totaux d'un conteneur (après `delay` ms). */
export function runTotals(box: HTMLElement, delay: number): void {
  window.setTimeout(() => {
    box.querySelectorAll<HTMLElement>('[data-to]').forEach((b) => {
      const to = Number(b.dataset['to']);
      const suffix = b.dataset['suffix'] ?? '';
      countUp(b, 0, to, 900, (n) => `${fmt(n)}${suffix}`, '+');
      b.closest('.rw-chip')?.classList.add('go');
    });
  }, delay);
}

/** Crédite les récompenses (une seule fois) et affiche l'écran de fin par-dessus le combat. */
export async function showInfiniteRewards(root: HTMLElement, end: InfiniteEnd, o: { onReplay: () => void; onHome: () => void }): Promise<void> {
  const wavesCleared = end.won ? end.wave : Math.max(0, end.wave - 1);
  const kills = end.bossKills ?? [];
  const bigBosses = kills.filter((k) => !k.small && k.wave % 10 === 0).map((k) => k.boss);
  let res: InfiniteResult | null = null;
  if (getProfile()) {
    await updateProfile((p) => {
      res = applyInfiniteGame(p, { wavesCleared, bigBosses, bossGold: bossKillGold(kills), bossKills: kills.length, merges: end.merges, summons: end.summons });
    });
  }
  const r = res as InfiniteResult | null;
  // 1. Les coffres de palier, l'un après l'autre.
  if (r?.chests.length) {
    await playChests(root, r.chests.map((c) => ({ content: c.content, subtitle: `Solo Infini · ${c.name}` })), balanceOf(getProfile()));
  }
  // 2. Le récapitulatif.
  const p = getProfile();
  const box = el('div', 'rw');
  const lines = r?.lines ?? [];
  const iconFor = (i: string): IconName => (['or', 'gemmes', 'cristaux', 'parchemins', 'coffre', 'record', 'cartes', 'xp'].includes(i) ? i : 'coffre') as IconName;
  box.innerHTML = `
    <div class="rw-panel">
      <h2 class="rw-title">${end.won ? 'Victoire !' : 'Fin de partie'}</h2>
      <p class="rw-wave">Vagues tenues<b>${wavesCleared}</b>${p ? `<small>Record : ${p.infiniteBest}</small>` : ''}</p>
      <ul class="rw-list scroll">${lines.map((l, i) => `<li style="--d:${200 + i * 140}ms" class="${l.icon}">${icon(iconFor(l.icon))}<span><b>${esc(l.label)}</b>${l.detail ? `<small>${esc(l.detail)}</small>` : ''}</span></li>`).join('')
        || '<li style="--d:200ms"><span><b>Pas de récompense cette fois</b><small>Tiens au moins une vague !</small></span></li>'}</ul>
      ${r ? `<div class="rw-total">${totalsHtml(r.total)}</div>` : ''}
      ${r?.heroes.length ? `<p class="rw-heroes">${r.heroes.map((h) => `${esc(UNITS[h.unit].name)}${h.outcome === 'nouveau' ? ' rejoint ta collection !' : ' : +1 carte'}`).join('<br>')}</p>` : ''}
      <div class="rw-row"><button class="mr-btn yellow" data-a="replay" data-tuto="end-replay">Rejouer</button><button class="mr-btn" data-a="home" data-tuto="end-home">Accueil</button></div>
    </div>`;
  root.appendChild(box);
  runTotals(box, 250 + lines.length * 140);
  box.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLElement>('[data-a]')?.dataset['a'];
    if (a === 'replay') { box.remove(); o.onReplay(); }
    if (a === 'home') { box.remove(); o.onHome(); }
  });
  emitMeta('rewards', { mode: 'infini', waves: wavesCleared });
}
