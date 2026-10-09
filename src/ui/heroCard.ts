// Carte de héros commune (Collection, Decks, contenu et résultats de pack, Encyclopédie), façon Rush Royale :
// fenêtre carrée sombre au cadre de rareté avec le personnage en grand, ruban « Niv. 7 » de la couleur de
// la rareté, barre de cartes avec flèche d'amélioration (verte quand on peut monter), petits badges
// (★ éveil, coche « dans le deck », « Nouveau ! »). Héros non possédé = silhouette assombrie.
import './heroCard.css';
import type { UnitId } from '../data/types';
import { UNITS } from '../data/units';
import { awakeningCost, canAfford, levelUpCost } from '../meta/economy';
import type { HeroState, Profile } from '../meta/profile';
import { esc, portraitUrl } from './kit';

export interface HeroCardOptions {
  id: UnitId;
  /** État possédé (null/absent = non possédé). */
  state?: HeroState | null;
  /** Profil, pour savoir si l'amélioration est payable (flèche verte). */
  profile?: Profile | null;
  /** Coche verte : dans le deck actif. */
  inDeck?: boolean;
  /** Badge « Nouveau ! » (aperçu de pack, héros non possédé). */
  newBadge?: boolean;
  /** Nom sous la barre (Encyclopédie). */
  showName?: boolean;
  /** Sans barre de cartes (résultats de tirage, emplacements de deck compacts). */
  noBar?: boolean;
  /** Classe et attributs en plus sur le bouton (data-*, data-tuto…). */
  cls?: string;
  attrs?: string;
}

const ARROW = `<svg class="hc-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 L22 13 H16 V22 H8 V13 H2Z" fill="currentColor" stroke="#1d1733" stroke-width="2.6" stroke-linejoin="round"/></svg>`;

/** Barre de progression : cartes pour le prochain niveau, puis copies pour le prochain éveil. */
export function heroProgress(h: HeroState, p?: Profile | null): { have: number; need: number; ready: boolean; kind: 'niveau' | 'eveil' | 'max' } {
  const lc = levelUpCost(h);
  if (lc) return { have: h.cards, need: lc.cards, ready: p ? canAfford(p, h, lc) : h.cards >= lc.cards, kind: 'niveau' };
  const ac = awakeningCost(h);
  if (ac) return { have: h.cards, need: ac.cards, ready: p ? canAfford(p, h, ac) : h.cards >= ac.cards, kind: 'eveil' };
  return { have: 0, need: 0, ready: false, kind: 'max' };
}

export function heroCardHtml(o: HeroCardOptions): string {
  const u = UNITS[o.id];
  const h = o.state ?? null;
  const owned = !!h;
  const cls = ['hc', `r-${u.rarity}`, owned ? '' : 'unowned', o.cls ?? ''].filter(Boolean).join(' ');
  let bar = '';
  if (!o.noBar) {
    if (h) {
      const g = heroProgress(h, o.profile);
      const w = g.need > 0 ? Math.min(100, (g.have / g.need) * 100) : 100;
      bar = g.kind === 'max'
        ? `<span class="hc-bar max"><i style="width:100%"></i><span>MAX</span></span>`
        : `<span class="hc-bar ${g.kind}${g.ready ? ' ready' : ''}"><i style="width:${w}%"></i>${g.kind === 'eveil' ? '<b class="hc-bstar">★</b>' : ARROW}<span>${g.have}/${g.need}</span></span>`;
    } else bar = `<span class="hc-bar off"><span>À trouver</span></span>`;
  }
  const ribbon = h ? `Niv. ${h.level}` : '?';
  return `<button class="${cls}" data-hero="${o.id}" aria-label="${esc(u.name)}${h ? `, niveau ${h.level}` : ', non possédé'}" ${o.attrs ?? ''}>
    <span class="hc-win"><img src="${portraitUrl(o.id)}" alt="" loading="lazy" decoding="async" draggable="false">${o.inDeck ? '<span class="hc-check" title="Dans le deck">✔</span>' : ''}</span>
    ${h && h.awakening > 0 ? `<span class="hc-star">★${h.awakening}</span>` : ''}
    ${o.newBadge ? '<span class="hc-new">Nouveau !</span>' : ''}
    <span class="hc-lv">${ribbon}</span>
    ${bar}
    ${o.showName ? `<span class="hc-name">${esc(u.name)}</span>` : ''}
  </button>`;
}
