// Coquille de l'application (§8) : en-tête (avatar, niveau de compte, monnaies), zone de contenu,
// barre d'onglets en bas. Elle reste montée d'un onglet à l'autre ; seuls les écrans changent, avec un
// glissement de 220 ms. Les écrans reçoivent `host` (la zone entre l'en-tête et la barre d'onglets).
import { accountLevel } from '../meta/economy';
import { emitMeta } from '../meta/events';
import { getProfile, onProfileChange, type Profile } from '../meta/profile';
import { freePullsTotal } from '../meta/pulls';
import { createView } from './view';
import { frameColor } from '../meta/road';
import { PLUS_SVG, el, fmtShort, icon, portraitUrl, type IconName } from './kit';
import { openCurrencySheet, type Currency } from './currencySheet';

export type TabId = 'tirages' | 'collection' | 'accueil' | 'campagne' | 'encyclopedie';

export const TABS: { id: TabId; label: string; hash: string; icon: IconName }[] = [
  { id: 'tirages', label: 'Tirages', hash: '#tirages', icon: 'tirages' },
  { id: 'collection', label: 'Collection', hash: '#collection', icon: 'collection' },
  { id: 'accueil', label: 'Combat', hash: '', icon: 'combat' },
  { id: 'campagne', label: 'Campagne', hash: '#campagne', icon: 'campagne' },
  { id: 'encyclopedie', label: 'Héros', hash: '#encyclopedie', icon: 'encyclopedie' },
];
const ORDER: Record<TabId, number> = { tirages: 0, collection: 1, accueil: 2, campagne: 3, encyclopedie: 4 };

/** Monte un écran dans `host` et renvoie son nettoyage. */
export type ScreenFactory = (host: HTMLElement) => (() => void) | void;

export interface Shell {
  view: HTMLElement;
  /** Hôte des panneaux plein écran (au-dessus de l'en-tête et des onglets). */
  overlay: HTMLElement;
  show(tab: TabId, route: string, factory: ScreenFactory): void;
  destroy(): void;
}

export function mountShell(root: HTMLElement, o: { onProfile: () => void; go: (hash: string) => void }): Shell {
  // ---------- en-tête
  const header = el('header', 'sh-head');
  // Barre de monnaies façon Rush Royale : gemmes, or, cristaux et parchemins, chacun avec son ➕ (d'où ça vient).
  const cur = (key: string, cls: string, ic: IconName, c: Currency, title: string) =>
    `<span class="sh-cur sh-pill ${cls}" data-m="${key}" title="${title}">${icon(ic)}<b>0</b><button class="sh-plus" data-cur="${c}" aria-label="${title} : comment en gagner">${PLUS_SVG}</button></span>`;
  header.innerHTML = `
    <button class="sh-me" data-tuto="profile" aria-label="Profil et réglages">
      <span class="sh-avatar"><img alt=""></span>
      <span class="sh-lv"><b>1</b></span>
      <span class="sh-xp"><i></i></span>
    </button>
    <div class="sh-money">
      ${cur('shards', 'gems', 'gemmes', 'gems', 'Gemmes : ouvre des packs')}
      ${cur('gold', 'gold', 'or', 'gold', 'Or : monte tes héros de niveau')}
      <span class="sh-mini">
        ${cur('crystals', 'crystals', 'cristaux', 'crystals', 'Cristaux d’éveil')}
        ${cur('scrolls', 'scrolls', 'parchemins', 'scrolls', 'Parchemins de talent')}
      </span>
    </div>`;
  const avatar = header.querySelector<HTMLImageElement>('.sh-avatar img')!;
  const lvB = header.querySelector<HTMLElement>('.sh-lv b')!;
  const meBtn = header.querySelector<HTMLElement>('.sh-me')!;
  const xpBar = header.querySelector<HTMLElement>('.sh-xp i')!;
  header.addEventListener('click', (e) => {
    const c = (e.target as HTMLElement).closest<HTMLElement>('[data-cur]')?.dataset['cur'] as Currency | undefined;
    const p = getProfile();
    if (c && p) openCurrencySheet(overlay, p, c, o.go);
  });
  header.querySelector('.sh-me')!.addEventListener('click', o.onProfile);

  // ---------- contenu
  const content = el('div', 'sh-body');

  // ---------- barre d'onglets
  const footer = el('nav', 'sh-tabs');
  footer.setAttribute('aria-label', 'Navigation');
  footer.innerHTML = TABS.map((t) => `<button class="sh-tab${t.id === 'accueil' ? ' main' : ''}" data-tab="${t.id}" data-tuto="tab-${t.id}">
      <span class="sh-ic">${icon(t.icon)}</span><span class="sh-tl">${t.label}</span><span class="sh-badge rr-badge" hidden></span></button>`).join('');
  footer.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-tab]');
    const t = TABS.find((x) => x.id === b?.dataset['tab']);
    if (t) o.go(t.hash);
  });

  const view = createView({ header, content, footer });
  view.classList.add('sh');
  const overlay = el('div', 'sh-overlay');
  view.appendChild(overlay);
  root.appendChild(view);

  // ---------- mise à jour depuis le profil
  const last: Record<string, number> = {};
  function bump(key: string, value: number): void {
    const pill = header.querySelector<HTMLElement>(`[data-m="${key}"]`)!;
    pill.querySelector('b')!.textContent = fmtShort(value);
    if (last[key] !== undefined && last[key] !== value) {
      pill.classList.remove('up', 'down'); void pill.offsetWidth;
      pill.classList.add(value > last[key]! ? 'up' : 'down');
    }
    last[key] = value;
  }
  function render(p: Profile | null): void {
    if (!p) return;
    avatar.src = portraitUrl(p.avatar);
    const a = accountLevel(p.xp);
    lvB.textContent = String(a.level);
    meBtn.setAttribute('aria-label', `Profil et réglages : ${p.name}`);
    xpBar.style.width = `${Math.round((a.into / a.need) * 100)}%`;
    bump('gold', p.gold ?? 0); bump('shards', p.shards); bump('crystals', p.crystals); bump('scrolls', p.scrolls);
    const fc = frameColor(p.frame);
    header.querySelector<HTMLElement>('.sh-avatar')!.style.setProperty('--frame', fc ?? '');
    header.querySelector<HTMLElement>('.sh-avatar')!.classList.toggle('framed', !!fc);
    const free = freePullsTotal(p);
    const badge = footer.querySelector<HTMLElement>('[data-tab="tirages"] .sh-badge')!;
    badge.hidden = free === 0;
    badge.textContent = free > 0 ? String(free) : '';
  }
  render(getProfile());
  const off = onProfileChange(render);

  // ---------- écrans
  let current: { tab: TabId; route: string; layer: HTMLElement; cleanup: (() => void) | void } | null = null;
  function show(tab: TabId, route: string, factory: ScreenFactory): void {
    if (current && current.route === route) return;
    footer.querySelectorAll<HTMLElement>('[data-tab]').forEach((b) => b.classList.toggle('on', b.dataset['tab'] === tab));
    const layer = el('div', 'sh-screen');
    const dir = current ? Math.sign(ORDER[tab] - ORDER[current.tab]) : 0;
    layer.style.setProperty('--from', dir === 0 ? '0px' : `${dir * 36}px`);
    content.appendChild(layer);
    const prev = current;
    current = { tab, route, layer, cleanup: factory(layer) };
    if (prev) {
      prev.layer.style.setProperty('--to', dir === 0 ? '0px' : `${-dir * 36}px`);
      prev.layer.classList.add('leave');
      prev.cleanup?.();
      window.setTimeout(() => prev.layer.remove(), 230);
    }
    emitMeta('screen', { route });
  }

  return {
    view, overlay, show,
    destroy() { off(); current?.cleanup?.(); view.remove(); },
  };
}
