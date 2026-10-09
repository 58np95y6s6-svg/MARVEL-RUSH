// Écran des Tirages (§6.2) : Pack Complet en tête, puis un pack par univers (dérivés de PACK_LIST),
// prix, taux, compteur de garantie, tirages gratuits, contenu détaillé du pack et ouverture animée.
import type { Rarity, UnitId } from '../data/types';
import { TEN_PULL_MIN_RARITY } from '../data/packs';
import { emitMeta } from '../meta/events';
import { getProfile, onProfileChange, updateProfile, type Profile } from '../meta/profile';
import {
  buyPulls, freePullsFor, freePullsTotal, getPullPack, openFreePulls, packPool, pullPacks, pullPrice,
  type PullPack, type PullPackId, type PullResult,
} from '../meta/pulls';
import { playPackOpening } from './packOpening';
import { heroCardHtml } from './heroCard';
import { RARITY_LABEL, esc, fmt, icon, openSheet, packColors, portraitUrl, toast } from './kit';

const pct = (x: number, digits = 0): string => `${(x * 100).toLocaleString('fr-FR', { maximumFractionDigits: digits, minimumFractionDigits: digits })} %`;
const RARITIES: Rarity[] = ['legendaire', 'epique', 'rare'];

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
      <p class="pl-rates"><span class="r-rare">Rare ${pct(pk.rates.rare)}</span><span class="r-epique">Épique ${pct(pk.rates.epique)}</span><span class="r-legendaire">Légendaire ${pct(pk.rates.legendaire)}</span></p>
      <div class="pl-pity" title="Garantie Légendaire"><i style="width:${(pity / pk.pityLegendary) * 100}%"></i><span>Légendaire garanti dans <b>${left}</b> tirage${left > 1 ? 's' : ''}</span></div>
      <div class="pl-buy">
        ${free ? `<button class="mr-btn green pl-btn wide" data-a="free" data-tuto="pack-open-free-${pk.id}"><span>Ouvrir ${Math.min(10, free)} gratuit${Math.min(10, free) > 1 ? 's' : ''}</span><small>${free >= 10 ? '1 Épique garantie' : 'offert'}</small></button>` : `
        <button class="mr-btn pl-btn" data-a="1" data-tuto="pack-open-1-${pk.id}" ${p.shards < pullPrice(pk.id, 1) ? 'disabled' : ''}><span>×1</span><small>${icon('eclats')}${fmt(pk.price1)}</small></button>
        <button class="mr-btn yellow pl-btn" data-a="10" data-tuto="pack-open-10-${pk.id}" ${p.shards < pullPrice(pk.id, 10) ? 'disabled' : ''}><span>×10</span><small>${icon('eclats')}${fmt(pk.price10)}</small></button>`}
      </div>
      <p class="pl-guar">Lot de 10 : au moins 1 ${RARITY_LABEL[TEN_PULL_MIN_RARITY]}</p>
      <button class="pl-info" data-a="info" data-tuto="pack-info-${pk.id}">ℹ️ Contenu et probabilités</button>
    </article>`;
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
      ${free ? `<div class="pl-banner">${icon('tirages')}<span>Tu as <b>${free} tirage${free > 1 ? 's' : ''} offert${free > 1 ? 's' : ''}</b> à ouvrir !</span>${freePack ? `<button class="mr-btn yellow pl-banner-go" data-a="free-go" data-tuto="pack-open-free">Ouvrir</button>` : ''}</div>` : ''}
      ${first ? packCard(first, p) : ''}
      <p class="pl-hint">Les packs d’univers, pour viser l’univers dont tu as besoin :</p>
      <div class="pl-row">${rest.map((pk) => packCard(pk, p)).join('')}</div>
      <p class="pl-foot">Doublon → +1 carte de niveau. Au maximum (niveau 10, ★10) → +5 ✦.<br>Aucun achat réel : les éclats se gagnent en jouant.</p>`;
    wrap.scrollTop = top;
  }
  render(getProfile());
  const off = onProfileChange(render);

  async function open(packId: PullPackId, kind: '1' | '10' | 'free'): Promise<void> {
    if (busy) return;
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
    if (!res || !res.length) { toast('Pas assez d’éclats.', 'warn'); render(getProfile()); return; }
    busy = true;
    await playPackOpening(o.overlay, getPullPack(packId), res);
    busy = false;
    render(getProfile());
    emitMeta('packOpened', { pack: packId, results: res, free: kind === 'free' });
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
      const each = pk.rates[r] / list.length;
      return `<section class="pc-group r-${r}">
        <h4><span>${RARITY_LABEL[r]}</span><b>${pct(pk.rates[r])}</b><small>${list.length} héros · ${pct(each, 2)} chacun</small></h4>
        <div class="pc-grid hc-grid">${list.map((u) => heroCardHtml({ id: u.id, state: p.heroes[u.id], profile: p, newBadge: !p.heroes[u.id], showName: true, noBar: true })).join('')}</div></section>`;
    }).join('');
    const s = openSheet(o.overlay, {
      title: `${esc(pk.name)} · contenu`, tall: true,
      html: `
        <ul class="pc-rules">
          <li>${icon('tirages')}<span><b>${pool.length} héros</b> dans ce pack. Taux : Rare ${pct(pk.rates.rare)}, Épique ${pct(pk.rates.epique)}, Légendaire ${pct(pk.rates.legendaire)}.</span></li>
          <li>${icon('record')}<span>Légendaire garanti au plus tard au <b>${pk.pityLegendary}e tirage</b> : encore <b>${left}</b> dans ce pack (${pity}/${pk.pityLegendary}).</span></li>
          <li>${icon('cartes')}<span>Lot de 10 : au moins <b>1 Épique</b> garantie.</span></li>
          <li>${icon('eclats')}<span>Doublon → <b>+1 carte</b> de niveau (au maximum : +5 ✦).</span></li>
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
    const pack = b?.closest<HTMLElement>('[data-pack]')?.dataset['pack'] as PullPackId | undefined;
    if (!b || !pack || b.disabled) return;
    const a = b.dataset['a'];
    if (a === 'info') contentSheet(pack);
    else if (a === '1' || a === '10' || a === 'free') void open(pack, a);
  });

  return () => { off(); wrap.remove(); };
}

