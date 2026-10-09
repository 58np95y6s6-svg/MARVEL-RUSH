// Ouverture d'un pack (§6.2) : la carte tombe et tremble, la lueur prend la couleur de la rareté
// (bleu, violet, or avec des rayons), la carte se retourne sur l'illustration du personnage (fiche
// chiffrée si disponible, sinon le personnage sur les couleurs de son univers) qui joue sa boucle
// d'attaque. « Passer » révèle tout le lot d'un coup. Toucher fait avancer.
import { ficheUrl } from '../access/fiches';
import { UNITS } from '../data/units';
import type { UnitId } from '../data/types';
import type { PullPack, PullResult } from '../meta/pulls';
import { getProfile } from '../meta/profile';
import { heroCardHtml } from './heroCard';
import { RARITY_LABEL, attackLoop, el, esc, figureUrl, packColors } from './kit';

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

function outcomeTag(r: PullResult): string {
  if (r.outcome === 'nouveau') return '<span class="po-tag new">Nouveau !</span>';
  if (r.outcome === 'cristaux') return '<span class="po-tag dup">+5 ✦</span>';
  return '<span class="po-tag dup">+1 carte</span>';
}

export function playPackOpening(host: HTMLElement, pack: PullPack, results: PullResult[]): Promise<void> {
  return new Promise((resolve) => {
    const [c1, c2] = packColors(pack.id);
    const multi = results.length > 1;
    const root = el('div', 'po');
    root.style.setProperty('--c1', c1);
    root.style.setProperty('--c2', c2);
    root.innerHTML = `
      <div class="po-bg"></div>
      <div class="po-top"><span class="po-pack">${esc(pack.name)}</span><span class="po-n"></span>
        ${multi ? '<button class="po-skip" data-tuto="pack-skip">Passer ⏭</button>' : ''}</div>
      <div class="po-stage"></div>
      <p class="po-hint">Touche pour continuer</p>`;
    host.appendChild(root);
    const stage = root.querySelector<HTMLElement>('.po-stage')!;
    const counter = root.querySelector<HTMLElement>('.po-n')!;
    const hint = root.querySelector<HTMLElement>('.po-hint')!;

    // Illustrations des fiches : chargées pendant la chute de la première carte.
    const fiches = new Map<UnitId, string | null>();
    const ids = [...new Set(results.map((r) => r.unit))];
    for (const id of ids) void ficheUrl(id).then((u) => fiches.set(id, u)).catch(() => fiches.set(id, null));

    let index = 0;
    let phase: 'fall' | 'reveal' | 'summary' | 'done' = 'fall';
    let skipFall: (() => void) | null = null;
    const stops: (() => void)[] = [];

    function frontHtml(r: PullResult): string {
      const u = UNITS[r.unit];
      const [u1, u2] = packColors(u.pack);
      return `<div class="po-front r-${r.rarity}" style="--u1:${u1};--u2:${u2}">
        <div class="po-art"></div>
        <img class="po-fig" src="${figureUrl(r.unit, 0)}" alt="">
        <div class="po-info"><span class="po-rar">${RARITY_LABEL[r.rarity]}</span><b class="po-name">${esc(u.name)}</b>${outcomeTag(r)}</div>
      </div>`;
    }

    function applyFiche(card: HTMLElement, id: UnitId): void {
      const set = (url: string | null | undefined) => {
        if (!url || !card.isConnected) return;
        const art = card.querySelector<HTMLElement>('.po-art');
        if (!art) return;
        art.style.backgroundImage = `url("${url}")`;
        card.querySelector('.po-front')?.classList.add('has-fiche');
      };
      if (fiches.has(id)) set(fiches.get(id));
      else void ficheUrl(id).then(set);
    }

    async function showCard(i: number): Promise<void> {
      const r = results[i]!;
      phase = 'fall';
      counter.textContent = multi ? `${i + 1} / ${results.length}` : '';
      hint.classList.remove('on');
      stage.innerHTML = '';
      const card = el('div', `po-card g-${r.rarity}`);
      card.innerHTML = `${r.rarity === 'legendaire' ? '<span class="po-burst"></span>' : ''}<span class="po-glow"></span>
        <div class="po-inner">
          <div class="po-back"><span class="po-emblem">MR</span><span class="po-back-name">${esc(pack.name)}</span></div>
          ${frontHtml(r)}
        </div>`;
      stage.appendChild(card);
      let skipped = false;
      const skippable = (ms: number) => new Promise<void>((res) => {
        const t = window.setTimeout(res, ms);
        skipFall = () => { skipped = true; window.clearTimeout(t); res(); };
      });
      card.classList.add('fall');
      await skippable(560);
      if (!skipped) { card.classList.add('shake'); await skippable(r.rarity === 'legendaire' ? 1100 : r.rarity === 'epique' ? 850 : 600); }
      skipFall = null;
      if (phase !== 'fall' || !card.isConnected) return;
      card.classList.add('shake', 'flip');
      applyFiche(card, r.unit);
      const fig = card.querySelector<HTMLImageElement>('.po-fig');
      if (fig) window.setTimeout(() => stops.push(attackLoop(fig, r.unit)), 450);
      navigator.vibrate?.(r.rarity === 'legendaire' ? [40, 40, 80] : 25);
      phase = 'reveal';
      window.setTimeout(() => hint.classList.add('on'), 700);
      if (!multi) hint.textContent = 'Touche pour fermer';
    }

    function summary(): void {
      phase = 'summary';
      stops.splice(0).forEach((f) => f());
      counter.textContent = '';
      hint.classList.remove('on');
      root.querySelector('.po-skip')?.remove();
      const news = results.filter((r) => r.outcome === 'nouveau').length;
      stage.innerHTML = `<div class="po-sum">
        <h3>${news ? `${news} nouveau${news > 1 ? 'x' : ''} héros !` : 'Ton lot'}</h3>
        <div class="po-grid">${results.map((r, i) => `<div class="po-mini" style="--d:${i * 70}ms">${heroCardHtml({ id: r.unit, state: getProfile()?.heroes[r.unit], newBadge: r.outcome === 'nouveau', noBar: true })}<span class="po-out ${r.outcome}">${r.outcome === 'nouveau' ? UNITS[r.unit].name : r.outcome === 'cristaux' ? '+5 ✦' : '+1 carte'}</span></div>`).join('')}</div>
        <button class="mr-btn yellow po-done" data-tuto="pack-done">Continuer</button></div>`;
      stage.querySelector('.po-done')!.addEventListener('click', (e) => { e.stopPropagation(); finish(); });
    }

    function finish(): void {
      if (phase === 'done') return;
      phase = 'done';
      stops.splice(0).forEach((f) => f());
      root.classList.add('out');
      window.setTimeout(() => { root.remove(); resolve(); }, 230);
    }

    root.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('.po-skip')) { skipFall = null; summary(); return; }
      if (phase === 'fall') { skipFall?.(); return; }
      if (phase === 'reveal') {
        stops.splice(0).forEach((f) => f());
        index += 1;
        if (index < results.length) void showCard(index);
        else if (multi) summary();
        else finish();
      }
    });

    void wait(80).then(() => showCard(0));
  });
}
