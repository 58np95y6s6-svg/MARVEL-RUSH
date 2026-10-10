// Écran des Tirages (§6.2) : Pack Complet en tête, puis un pack par univers (dérivés de PACK_LIST),
// prix, taux (à l'unité et lot de 10 boosté), garanties, tirages gratuits, calendrier de bienvenue,
// « Comment gagner des gemmes ? », contenu détaillé du pack et ouverture animée.
import './pulls.css';
import type { Rarity, UnitId } from '../data/types';
import { TEN_PULL_MIN_RARITY } from '../data/packs';
import { emitMeta } from '../meta/events';
import { getProfile, onProfileChange, today, updateProfile, type Profile } from '../meta/profile';
import {
  buyPulls, firstTenPending, freePullsFor, freePullsTotal, getPullPack, openFreePulls, packPool, pullPacks, pullPrice,
  type PullPack, type PullPackId, type PullResult,
} from '../meta/pulls';
import { WELCOME_CALENDAR, claimWelcome, welcomeReady, welcomeState } from '../meta/gems';
import { firstClearGemsLeft, openGemsSheet } from './gemsSheet';
import { playPackOpening } from './packOpening';
import { heroCardHtml } from './heroCard';
import { RARITY_LABEL, esc, fmt, icon, openSheet, packColors, portraitUrl, toast } from './kit';

const pct = (x: number, digits = 0): string => `${(x * 100).toLocaleString('fr-FR', { maximumFractionDigits: digits, minimumFractionDigits: digits })} %`;
const RARITIES: Rarity[] = ['legendaire', 'epique', 'rare'];
const RSHORT: Record<Rarity, string> = { rare: 'R', epique: 'É', legendaire: 'L' };

/** Taux d'un pack, à l'unité et en lot de 10 (boosté). */
function ratesHtml(pk: PullPack): string {
  const line = (label: string, r: Record<Rarity, number>, boost: boolean) => `<p class="pl-rates${boost ? ' boost' : ''}"><i>${label}</i>${
    (['rare', 'epique', 'legendaire'] as Rarity[]).map((x) => `<span class="r-${x}">${RSHORT[x]}\u00a0${pct(r[x]).replace(' ', '\u202f')}</span>`).join('')}</p>`;
  return line('×1', pk.rates, false) + line('×10', pk.rates10, true);
}

export function mountPulls(host: HTMLElement, o: { overlay: HTMLElement; go: (hash: string) => void }): () => void {
  const wrap = document.createElement('div');
  wrap.className = 'pl scroll';
  host.appendChild(wrap);
  let busy = false;
  /** Premier pack sur lequel des tirages gratuits attendent (bouton du bandeau). */
  let freePack: PullPackId | null = null;

  function packCard(pk: PullPack, p: Profile): string {
    const pool = packPool(pk.id);
    const [c1, c2] = packColors(pk.id);
    const pity = p.pity[pk.id] ?? 0;
    const left = pk.pityLegendary - pity;
    const free = freePullsFor(p, pk.id);
    const fan = pool.filter((u) => u.rarity === 'legendaire').slice(0, 3);
    const owned = pool.filter((u) => p.heroes[u.id]).length;
    return `
    <article class="pl-pack${pk.featured ? ' featured' : ''}" data-pack="${pk.id}" style="--c1:${c1};--c2:${c2}">
      <div class="pl-art">
        <span class="pl-rays"></span>
        ${fan.map((u, i) => `<img src="${portraitUrl(u.id)}" alt="" style="--i:${i - (fan.length - 1) / 2}">`).join('')}
        <span class="pl-count">${pool.length} héros</span>
        ${free ? `<span class="pl-free-tag">${free} gratuit${free > 1 ? 's' : ''} !</span>` : ''}
      </div>
      <h3 class="pl-name">${esc(pk.name)}</h3>
      <p class="pl-blurb">${pk.blurb ? `${esc(pk.blurb)} · ` : ''}${owned}/${pool.length} possédés</p>
      ${ratesHtml(pk)}
      <div class="pl-pity" title="Garantie Légendaire"><i style="width:${(pity / pk.pityLegendary) * 100}%"></i><span>Légendaire garanti dans <b>${left}</b> tirage${left > 1 ? 's' : ''}</span></div>
      <div class="pl-buy">
        ${free ? `<button class="mr-btn green pl-btn wide" data-a="free" data-tuto="pack-open-free-${pk.id}"><span>Ouvrir ${Math.min(10, free)} gratuit${Math.min(10, free) > 1 ? 's' : ''}</span><small>${free >= 10 ? '1 Épique garantie' : 'offert'}</small></button>` : `
        <button class="mr-btn pl-btn" data-a="1" data-tuto="pack-open-1-${pk.id}" ${p.shards < pullPrice(pk.id, 1) ? 'disabled' : ''}><span>×1</span><small>${icon('gemmes')}${fmt(pk.price1)}</small></button>
        <button class="mr-btn yellow pl-btn" data-a="10" data-tuto="pack-open-10-${pk.id}" ${p.shards < pullPrice(pk.id, 10) ? 'disabled' : ''}><span>×10</span><small>${icon('gemmes')}${fmt(pk.price10)}</small></button>`}
      </div>
      ${firstTenPending(p, pk.id) ? `<p class="pl-first">⭐ 1<sup>er</sup> lot de 10 : <b>Légendaire garanti !</b></p>` : `<p class="pl-guar">Lot de 10 : taux boostés et au moins 1 ${RARITY_LABEL[TEN_PULL_MIN_RARITY]}</p>`}
      <button class="pl-info" data-a="info" data-tuto="pack-info-${pk.id}">ℹ️ Contenu et probabilités</button>
    </article>`;
  }

  /** Bandeau « Comment gagner des gemmes ? » + raccourci. */
  function gemsBar(p: Profile): string {
    const fc = firstClearGemsLeft(p);
    return `<div class="pl-gems">
      <button class="pl-gems-how" data-a="gems-how">💎 Comment gagner des gemmes ?</button>
      <button class="mr-btn green pl-gems-go" data-a="gems-go">Gagner des gemmes${fc.levels ? `<small>+${fmt(fc.gems)} en campagne</small>` : ''}</button>
    </div>`;
  }

  /** Calendrier de bienvenue (7 jours) tant qu'il n'est pas fini. */
  function welcomeHtml(p: Profile): string {
    const ws = welcomeState(p);
    if (ws.claimed >= WELCOME_CALENDAR.length) return '';
    const ready = welcomeReady(p, today());
    return `<section class="pl-welcome" data-tuto="welcome">
      <header><b>Calendrier de bienvenue</b><small>${ready ? 'Cadeau du jour à prendre !' : 'Suite demain'}</small></header>
      <div class="pl-wdays">${WELCOME_CALENDAR.map((d, i) => {
        const st = i < ws.claimed ? 'done' : i === ws.claimed && ready ? 'next' : '';
        return `<button class="pl-wday ${st}" ${st === 'next' ? 'data-a="welcome"' : 'disabled'}><small>Jour ${d.day}</small>${d.gems ? `<b>${fmt(d.gems)}💎</b>` : ''}${d.pulls ? `<em>${d.pulls} tirages</em>` : ''}${i < ws.claimed ? '<i>✔</i>' : ''}</button>`;
      }).join('')}</div>
    </section>`;
  }

  async function claimWelcomeDay(): Promise<void> {
    let got: ReturnType<typeof claimWelcome> = null;
    await updateProfile((q) => { got = claimWelcome(q, today()); });
    const d = got as ReturnType<typeof claimWelcome>;
    if (d) toast(`Jour ${d.day} : ${[d.gems ? `+${fmt(d.gems)} gemmes` : '', d.pulls ? `${d.pulls} tirages offerts` : ''].filter(Boolean).join(' et ')} !`);
  }

  function render(p: Profile | null): void {
    if (!p || busy) return;
    const packs = pullPacks();
    const [first, ...rest] = packs;
    const free = freePullsTotal(p);
    freePack = packs.find((pk) => freePullsFor(p, pk.id) > 0)?.id ?? null;
    const top = wrap.scrollTop;
    wrap.innerHTML = `
      <h2 class="scr-title">Tirages</h2>
      ${gemsBar(p)}
      ${welcomeHtml(p)}
      ${free ? `<div class="pl-banner">${icon('tirages')}<span>Tu as <b>${free} tirage${free > 1 ? 's' : ''} offert${free > 1 ? 's' : ''}</b> à ouvrir !</span>${freePack ? `<button class="mr-btn yellow pl-banner-go" data-a="free-go" data-tuto="pack-open-free">Ouvrir</button>` : ''}</div>` : ''}
      ${first ? packCard(first, p) : ''}
      <p class="pl-hint">Les packs d’univers, pour viser l’univers dont tu as besoin :</p>
      <div class="pl-row">${rest.map((pk) => packCard(pk, p)).join('')}</div>
      <p class="pl-foot">Doublon → +1 carte de niveau. Au maximum (niveau 10, ★10) → +5 ✦.<br>Les gemmes ne servent qu’aux packs. Aucun achat réel.</p>`;
    wrap.scrollTop = top;
  }
  render(getProfile());
  const off = onProfileChange(render);

  /** Libellé du bouton « Encore ! » du récapitulatif, ou null si on ne peut pas retirer le même lot. */
  function againLabel(packId: PullPackId, kind: '1' | '10' | 'free'): string | null {
    const p = getProfile();
    if (!p || !wrap.isConnected) return null;
    // Pendant le tutoriel guidé, on ne propose pas d'enchaîner (l'étape suivante attend).
    if (!p.tutorialDone) return null;
    if (kind === 'free') {
      const left = freePullsFor(p, packId);
      return left > 0 ? `Encore !<small>${Math.min(10, left)} offert${Math.min(10, left) > 1 ? 's' : ''}</small>` : null;
    }
    const n = kind === '10' ? 10 : 1;
    const price = pullPrice(packId, n);
    return p.shards >= price ? `Encore ×${n}<small>${icon('gemmes')}${fmt(price)}</small>` : null;
  }

  async function open(packId: PullPackId, kind: '1' | '10' | 'free'): Promise<void> {
    if (busy) return;
    // « Encore ! » relance le même tirage tant que le joueur le demande (et peut le payer).
    for (;;) {
      const p = getProfile();
      if (!p) return;
      let results: PullResult[] | null = null;
      // L'achat est enregistré avant l'animation : fermer l'app en plein tirage ne perd rien.
      busy = true;
      try {
        await updateProfile((q) => {
          results = kind === 'free' ? openFreePulls(q, packId) : buyPulls(q, packId, kind === '10' ? 10 : 1);
        });
      } finally { busy = false; }
      const res = results as PullResult[] | null;
      if (!res || !res.length) { toast('Pas assez de gemmes : gagne-en avec les coffres, les quêtes et la Route des récompenses.', 'warn'); render(getProfile()); return; }
      busy = true;
      const end = await playPackOpening(o.overlay, getPullPack(packId), res, { again: againLabel(packId, kind) });
      busy = false;
      render(getProfile());
      emitMeta('packOpened', { pack: packId, results: res, free: kind === 'free' });
      if (end !== 'again' || !wrap.isConnected || !againLabel(packId, kind)) return;
    }
  }

  function contentSheet(packId: PullPackId): void {
    const p = getProfile();
    if (!p) return;
    const pk = getPullPack(packId);
    const pool = packPool(packId);
    const pity = p.pity[packId] ?? 0;
    const left = pk.pityLegendary - pity;
    const groups = RARITIES.map((r) => {
      const list = pool.filter((u) => u.rarity === r).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
      if (!list.length) return '';
      const each = pk.rates[r] / list.length, each10 = pk.rates10[r] / list.length;
      return `<section class="pc-group r-${r}">
        <h4><span>${RARITY_LABEL[r]}</span><b>${pct(pk.rates[r])}</b><b class="pc-10">×10 : ${pct(pk.rates10[r])}</b><small>${list.length} héros</small></h4>
        <p class="pc-each">Chaque héros : <b>${pct(each, 2)}</b> à l’unité · <b>${pct(each10, 2)}</b> par carte d’un lot de 10</p>
        <div class="pc-grid hc-grid">${list.map((u) => heroCardHtml({ id: u.id, state: p.heroes[u.id], profile: p, newBadge: !p.heroes[u.id], showName: true, noBar: true })).join('')}</div></section>`;
    }).join('');
    const s = openSheet(o.overlay, {
      title: `${esc(pk.name)} · contenu`, tall: true,
      html: `
        <ul class="pc-rules">
          <li>${icon('tirages')}<span><b>${pool.length} héros</b> dans ce pack.</span></li>
        </ul>
        <table class="pc-odds"><thead><tr><th>Par carte</th><th class="r-rare">Rare</th><th class="r-epique">Épique</th><th class="r-legendaire">Légendaire</th></tr></thead>
          <tbody><tr><td>Tirage ×1</td>${(['rare', 'epique', 'legendaire'] as Rarity[]).map((r) => `<td>${pct(pk.rates[r])}</td>`).join('')}</tr>
          <tr class="boost"><td>Lot de 10 <small>boosté</small></td>${(['rare', 'epique', 'legendaire'] as Rarity[]).map((r) => `<td>${pct(pk.rates10[r])}</td>`).join('')}</tr></tbody></table>
        <ul class="pc-rules">
          ${firstTenPending(p, packId) ? `<li class="pc-first">${icon('record')}<span>Ton <b>1<sup>er</sup> lot de 10</b> payé dans ce pack contient <b>un Légendaire garanti</b>.</span></li>` : ''}
          <li>${icon('record')}<span>Légendaire garanti au plus tard au <b>${pk.pityLegendary}e tirage</b> : encore <b>${left}</b> dans ce pack (${pity}/${pk.pityLegendary}).</span></li>
          <li>${icon('cartes')}<span>Lot de 10 : au moins <b>1 Épique</b> garantie.</span></li>
          <li>${icon('cartes')}<span>Doublon → <b>+1 carte</b> de niveau (au maximum : +5 ✦).</span></li>
        </ul>
        ${groups}`,
    });
    s.body.addEventListener('click', (e) => {
      const id = (e.target as HTMLElement).closest<HTMLElement>('[data-hero]')?.dataset['hero'] as UnitId | undefined;
      if (!id) return;
      s.close();
      o.go(`#encyclopedie/heros/${id}`);
    });
  }

  wrap.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-a]');
    if (b?.dataset['a'] === 'free-go' && freePack) { void open(freePack, 'free'); return; }
    if (b?.dataset['a'] === 'welcome') { void claimWelcomeDay(); return; }
    if (b?.dataset['a'] === 'gems-how') { const p = getProfile(); if (p) openGemsSheet(o.overlay, p, o.go); return; }
    if (b?.dataset['a'] === 'gems-go') { const p = getProfile(); o.go(p && firstClearGemsLeft(p).levels ? '#campagne' : '#quetes'); return; }
    const pack = b?.closest<HTMLElement>('[data-pack]')?.dataset['pack'] as PullPackId | undefined;
    if (!b || !pack || b.disabled) return;
    const a = b.dataset['a'];
    if (a === 'info') contentSheet(pack);
    else if (a === '1' || a === '10' || a === 'free') void open(pack, a);
  });

  return () => { off(); wrap.remove(); };
}

