// Route des récompenses (route #route) : chaque niveau de compte donne quelque chose. Liste qui défile
// (seule la liste défile), niveau atteint en surbrillance, « Réclamer » sur chaque palier atteint,
// « Tout réclamer ». Les coffres s'ouvrent avec l'animation, le reste vole vers l'en-tête.
import './quests.css';
import { accountLevel } from '../meta/economy';
import type { ChestContent } from '../meta/chests';
import { getProfile, onProfileChange, updateProfile, type Profile } from '../meta/profile';
import { FRAMES, ROAD_FIRST, claimRoad, roadClaimable, roadClaimed, roadReward, type RoadClaim, type RoadReward } from '../meta/road';
import { balanceOf, chestMiniSvg, flyToHeader, playChests, type ChestShow } from './chestOpening';
import { esc, fmt, icon, portraitUrl, toast } from './kit';

/** Pastilles d'une récompense de la route. */
function rewardHtml(r: RoadReward): string {
  const bits = [`<span class="rd-chip">${icon('or')}<b>${fmt(r.gold)}</b></span>`];
  if (r.gems) bits.push(`<span class="rd-chip">${icon('gemmes')}<b>${r.gems}</b></span>`);
  if (r.crystals) bits.push(`<span class="rd-chip">${icon('cristaux')}<b>${r.crystals}</b></span>`);
  if (r.chest) bits.push(`<span class="rd-chip big">${chestMiniSvg(r.chest)}<b>Coffre</b></span>`);
  if (r.pulls) bits.push(`<span class="rd-chip big">${icon('tirages')}<b>${r.pulls} tirages</b></span>`);
  if (r.frame) bits.push(`<span class="rd-chip big frame" style="--frame:${r.frame.color}"><i></i><b>${esc(r.frame.name)}</b></span>`);
  return bits.join('');
}

export function mountRoad(host: HTMLElement, o: { overlay: HTMLElement; go: (hash: string) => void }): () => void {
  const wrap = document.createElement('div');
  wrap.className = 'rd';
  host.appendChild(wrap);
  let busy = false;
  let scrolled = false;

  function render(p: Profile | null): void {
    if (!p || busy) return;
    const a = accountLevel(p.xp);
    const claimable = roadClaimable(p);
    const last = Math.max(30, a.level + 12, ...Object.keys(FRAMES).map(Number).filter((l) => l <= a.level + 20));
    const old = wrap.querySelector<HTMLElement>('.rd-list');
    const keep = old?.scrollTop;
    const rows: string[] = [];
    for (let l = ROAD_FIRST; l <= last; l++) {
      const r = roadReward(l);
      const reached = l <= a.level;
      const got = roadClaimed(p, l);
      const state = got ? 'got' : reached ? 'ready' : 'locked';
      rows.push(`<li class="rd-node ${state}${r.big ? ' big' : ''}${l === a.level ? ' cur' : ''}" data-l="${l}">
        <span class="rd-lv"><b>${l}</b></span>
        <div class="rd-rw">${rewardHtml(r)}</div>
        ${got ? '<span class="rd-ok">✔</span>' : reached ? `<button class="mr-btn green rd-claim" data-claim="${l}">Réclamer</button>` : `<span class="rd-lock">${icon('lock')}</span>`}
      </li>`);
    }
    wrap.innerHTML = `
      <div class="qs-head"><button class="qs-back" data-a="back">‹ Accueil</button><h2 class="scr-title">Route des récompenses</h2></div>
      <div class="rd-me"><span class="rd-av"><img src="${portraitUrl(p.avatar)}" alt=""></span>
        <div><b>Niveau de compte ${a.level}</b><span class="rd-xp"><i style="width:${(a.into / a.need) * 100}%"></i><span>${fmt(a.into)} / ${fmt(a.need)} XP</span></span>
        <small>XP : campagne, Solo Infini, montées de niveau des héros</small></div>
        ${claimable.length > 1 ? `<button class="mr-btn yellow rd-all" data-a="all">Tout (${claimable.length})</button>` : ''}</div>
      <ol class="rd-list scroll">${rows.join('')}</ol>`;
    const list = wrap.querySelector<HTMLElement>('.rd-list')!;
    requestAnimationFrame(() => {
      if (keep !== undefined && scrolled) { list.scrollTop = keep; return; }
      scrolled = true;
      const target = list.querySelector<HTMLElement>('.rd-node.ready') ?? list.querySelector<HTMLElement>('.rd-node.cur');
      if (!target) return;
      const lr = list.getBoundingClientRect(), tr = target.getBoundingClientRect();
      list.scrollTop = Math.max(0, list.scrollTop + tr.top - lr.top - lr.height / 3);
    });
  }
  render(getProfile());
  const off = onProfileChange(render);

  async function claim(levels: number[], from: Element): Promise<void> {
    if (busy || !levels.length) return;
    busy = true;
    const claims: RoadClaim[] = [];
    try {
      const sum = { gold: 0, shards: 0, crystals: 0 };
      for (const l of levels) { const r = roadReward(l); sum.gold += r.gold; sum.shards += r.gems ?? 0; sum.crystals += r.crystals ?? 0; }
      const chests = levels.some((l) => roadReward(l).chest);
      if (!chests) await flyToHeader(from, sum);
      await updateProfile((p) => { for (const l of levels) { const c = claimRoad(p, l); if (c) claims.push(c); } });
      // Le coffre montre aussi l'or, les gemmes et les cristaux du palier (déjà crédités avec lui).
      const shows: ChestShow[] = claims.filter((c) => c.chest).map((c) => ({
        content: { ...(c.chest as ChestContent), gold: c.chest!.gold + c.reward.gold, gems: c.chest!.gems + (c.reward.gems ?? 0), crystals: c.chest!.crystals + (c.reward.crystals ?? 0) },
        subtitle: `Niveau de compte ${c.reward.level}`,
      }));
      if (shows.length) await playChests(o.overlay, shows, balanceOf(getProfile()));
      const pulls = claims.reduce((n, c) => n + (c.reward.pulls ?? 0), 0);
      const frame = claims.map((c) => c.reward.frame).filter(Boolean).pop();
      if (pulls) toast(`${pulls} tirages offerts : ouvre-les dans Tirages !`);
      else if (frame) toast(`${frame.name} débloqué !`);
      else toast(`Récompense${claims.length > 1 ? 's' : ''} du niveau ${claims.map((c) => c.reward.level).join(', ')} !`);
    } finally {
      busy = false;
      render(getProfile());
    }
  }

  wrap.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('[data-a="back"]')) { o.go(''); return; }
    const p = getProfile();
    if (!p) return;
    const b = t.closest<HTMLElement>('[data-claim]');
    if (b) { void claim([Number(b.dataset['claim'])], b); return; }
    const all = t.closest<HTMLElement>('[data-a="all"]');
    if (all) void claim(roadClaimable(p), all);
  });
  return () => { off(); wrap.remove(); };
}
