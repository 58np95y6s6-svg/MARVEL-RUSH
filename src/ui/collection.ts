// Collection et Decks (§6.4, §8.7-8) : deck actif en haut (3 decks, glisser-déposer ou toucher pour
// échanger, bonus d'équipe actifs ou presque), grille de tous les héros (non possédés en silhouette),
// fiche du héros (niveau, cartes, « Améliorer », Éveil, talents, statistiques).
import type { UnitId } from '../data/types';
import { UNIT_LIST, UNITS } from '../data/units';
import { MAX_DECKS, ensureDecks, setDeckSlot, swapDeckSlots, teamHints } from '../meta/decks';
import { DECK_SLOT_LEVELS, accountLevel, deckSlotsUnlocked } from '../meta/economy';
import { emitMeta } from '../meta/events';
import { getProfile, onProfileChange, updateProfile, type Profile } from '../meta/profile';
import { heroCardHtml } from './heroCard';
import { openHeroSheet } from './heroSheet';
import { RARITY_ORDER, el, esc, icon, openSheet, toast } from './kit';

export function mountCollection(host: HTMLElement, o: { overlay: HTMLElement; go: (hash: string) => void; focusDeck?: boolean }): () => void {
  const wrap = el('div', 'co');
  wrap.innerHTML = `
    <section class="co-deck" data-tuto="deck-panel">
      <div class="co-deck-top">
        <h2 class="co-h">Deck</h2>
        <div class="co-tabs" role="tablist"></div>
        <button class="co-use" data-a="use" data-tuto="deck-use"></button>
      </div>
      <div class="co-slots hc-row"></div>
      <button class="co-teams" data-a="teams" data-tuto="deck-teams"></button>
    </section>
    <div class="co-place" hidden><span></span><button data-a="cancel">Annuler</button></div>
    <div class="co-list scroll"></div>`;
  host.appendChild(wrap);
  const tabsEl = wrap.querySelector<HTMLElement>('.co-tabs')!;
  const useBtn = wrap.querySelector<HTMLButtonElement>('.co-use')!;
  const slotsEl = wrap.querySelector<HTMLElement>('.co-slots')!;
  const teamsEl = wrap.querySelector<HTMLButtonElement>('.co-teams')!;
  const placeEl = wrap.querySelector<HTMLElement>('.co-place')!;
  const listEl = wrap.querySelector<HTMLElement>('.co-list')!;

  let viewDeck = getProfile()?.activeDeck ?? 0;
  /** Héros en attente de placement (« Mettre dans le deck »). */
  let placing: UnitId | null = null;

  function deckOf(p: Profile): UnitId[] { return p.decks[viewDeck] ?? p.decks[0] ?? []; }

  function render(p: Profile | null): void {
    if (!p) return;
    const unlocked = deckSlotsUnlocked(p.xp);
    if (viewDeck >= p.decks.length && viewDeck >= unlocked) viewDeck = 0;
    tabsEl.innerHTML = Array.from({ length: MAX_DECKS }, (_, i) => {
      const lock = i >= unlocked;
      return `<button role="tab" data-deck="${i}" data-tuto="deck-tab-${i + 1}" aria-selected="${i === viewDeck}" class="${lock ? 'lock' : ''}${i === p.activeDeck ? ' active' : ''}">${lock ? icon('lock') : i + 1}</button>`;
    }).join('');
    const isActive = viewDeck === p.activeDeck;
    useBtn.className = `co-use${isActive ? ' on' : ''}`;
    useBtn.innerHTML = isActive ? '✔ Deck actif' : 'Utiliser';
    const deck = deckOf(p);
    slotsEl.innerHTML = deck.map((id, i) => heroCardHtml({
      id, state: p.heroes[id], profile: p, cls: `co-slot${placing ? ' target' : ''}`, attrs: `data-slot="${i}" data-tuto="deck-slot-${i}"`,
    })).join('');
    const hints = teamHints(deck);
    const active = hints.filter((h) => h.active);
    const near = hints.find((h) => !h.active);
    teamsEl.innerHTML = [
      ...active.map((h) => `<span class="co-team on">✔ ${esc(h.team.name)}</span>`),
      near ? `<span class="co-team near">${esc(near.text)}</span>` : '',
      !active.length && !near ? '<span class="co-team">Aucun bonus d’équipe : touche pour les voir</span>' : '',
    ].join('');

    const inDeck = new Set(deck);
    const sorted = UNIT_LIST.slice().sort((a, b) => RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity] || a.name.localeCompare(b.name, 'fr'));
    const owned = sorted.filter((u) => p.heroes[u.id]);
    const unowned = sorted.filter((u) => !p.heroes[u.id]);
    const top = listEl.scrollTop;
    listEl.innerHTML = `
      <h3 class="co-sub">Ma collection <small>${owned.length}/${UNIT_LIST.length}</small></h3>
      <div class="hc-grid">${owned.map((u) => heroCardHtml({ id: u.id, state: p.heroes[u.id], profile: p, inDeck: inDeck.has(u.id), attrs: `data-tuto="collection-card-${u.id}"` })).join('')}</div>
      ${unowned.length ? `<h3 class="co-sub">À découvrir <small>${unowned.length}</small></h3>
      <div class="hc-grid">${unowned.map((u) => heroCardHtml({ id: u.id, attrs: `data-tuto="collection-card-${u.id}"` })).join('')}</div>
      <button class="mr-btn yellow co-topacks" data-a="packs">Trouver des héros</button>` : ''}`;
    listEl.scrollTop = top;
    placeEl.hidden = !placing;
    if (placing) placeEl.querySelector('span')!.innerHTML = `Touche une case du deck pour y mettre <b>${esc(UNITS[placing].name)}</b>`;
  }
  render(getProfile());
  const off = onProfileChange(render);
  if (o.focusDeck) wrap.classList.add('focus-deck');

  async function place(slot: number, unit: UnitId): Promise<void> {
    const p = getProfile();
    if (!p) return;
    let ok = false;
    await updateProfile((q) => { ensureDecks(q, viewDeck + 1); ok = setDeckSlot(q, viewDeck, slot, unit); });
    if (ok) {
      const d = getProfile()!.decks[viewDeck]!;
      emitMeta('deckChanged', { index: viewDeck, deck: d.slice() });
      const s = slotsEl.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
      s?.classList.add('pop');
    }
  }

  function startPlacing(unit: UnitId): void {
    placing = unit;
    render(getProfile());
    wrap.classList.add('placing');
  }
  function stopPlacing(): void { placing = null; wrap.classList.remove('placing'); render(getProfile()); }

  function teamsSheet(p: Profile): void {
    const hints = teamHints(deckOf(p), 9);
    openSheet(o.overlay, {
      title: 'Bonus d’équipe',
      html: `<ul class="co-team-list">${hints.map((h) => `<li class="${h.active ? 'on' : ''}">
        <b>${h.active ? '✔ ' : ''}${esc(h.team.name)}</b> <small>${h.have}/${h.need}</small>
        <span>${esc(h.team.description)}</span>${h.active ? '' : `<em>${esc(h.text)}</em>`}</li>`).join('') || '<li>Aucune équipe en vue avec ce deck.</li>'}</ul>`,
    });
  }

  // ---------------------------------------------------------------- toucher
  wrap.addEventListener('click', async (e) => {
    if (dragged) return;
    const t = e.target as HTMLElement;
    const p = getProfile();
    if (!p) return;
    const deckTab = t.closest<HTMLElement>('[data-deck]');
    if (deckTab) {
      const i = Number(deckTab.dataset['deck']);
      if (i >= deckSlotsUnlocked(p.xp)) { toast(`Emplacement débloqué au niveau de compte ${DECK_SLOT_LEVELS[i]} (tu es niveau ${accountLevel(p.xp).level}).`, 'warn'); return; }
      viewDeck = i;
      if (!p.decks[i]) await updateProfile((q) => ensureDecks(q, i + 1));
      render(getProfile());
      return;
    }
    const a = t.closest<HTMLElement>('[data-a]')?.dataset['a'];
    if (a === 'use') {
      if (viewDeck !== p.activeDeck) {
        await updateProfile((q) => { ensureDecks(q, viewDeck + 1); q.activeDeck = viewDeck; });
        emitMeta('deckChanged', { index: viewDeck, deck: deckOf(getProfile()!).slice() });
        toast(`Deck ${viewDeck + 1} actif`);
      }
      return;
    }
    if (a === 'teams') { teamsSheet(p); return; }
    if (a === 'cancel') { stopPlacing(); return; }
    if (a === 'packs') { o.go('#tirages'); return; }
    const slot = t.closest<HTMLElement>('[data-slot]');
    if (slot) {
      const i = Number(slot.dataset['slot']);
      if (placing) { const u = placing; stopPlacing(); await place(i, u); return; }
      const id = slot.dataset['hero'] as UnitId;
      openHeroSheet(o.overlay, id, { onDeck: startPlacing, go: o.go });
      return;
    }
    const card = t.closest<HTMLElement>('[data-hero]');
    if (card) {
      const id = card.dataset['hero'] as UnitId;
      if (placing) stopPlacing();
      openHeroSheet(o.overlay, id, { onDeck: deckOf(p).includes(id) ? undefined : startPlacing, go: o.go });
    }
  });

  // ---------------------------------------------------------------- glisser-déposer (appui long puis glisser)
  let dragged = false;
  let drag: { id: UnitId; from: number | null; ghost: HTMLElement | null; x: number; y: number; timer: number; pid: number } | null = null;
  const blockScroll = (e: TouchEvent) => { if (drag?.ghost) e.preventDefault(); };
  wrap.addEventListener('touchmove', blockScroll, { passive: false });

  function slotAt(x: number, y: number): HTMLElement | null {
    for (const s of slotsEl.querySelectorAll<HTMLElement>('[data-slot]')) {
      const r = s.getBoundingClientRect();
      if (x >= r.left - 6 && x <= r.right + 6 && y >= r.top - 6 && y <= r.bottom + 6) return s;
    }
    return null;
  }
  function startGhost(src: HTMLElement): void {
    if (!drag) return;
    const r = src.getBoundingClientRect();
    const g = src.cloneNode(true) as HTMLElement;
    g.classList.add('co-ghost');
    g.style.width = `${r.width}px`;
    document.body.appendChild(g);
    drag.ghost = g;
    moveGhost(drag.x, drag.y);
    wrap.classList.add('dragging');
    navigator.vibrate?.(15);
  }
  function moveGhost(x: number, y: number): void {
    if (!drag?.ghost) return;
    drag.ghost.style.transform = `translate(${x}px, ${y}px) translate(-50%, -60%) scale(1.08)`;
    slotsEl.querySelectorAll('.over').forEach((s) => s.classList.remove('over'));
    slotAt(x, y)?.classList.add('over');
  }
  wrap.addEventListener('pointerdown', (e) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>('[data-hero]');
    const p = getProfile();
    if (!card || !p || !p.heroes[card.dataset['hero'] as UnitId] || e.button > 0) return;
    const slot = card.dataset['slot'];
    dragged = false;
    drag = { id: card.dataset['hero'] as UnitId, from: slot != null ? Number(slot) : null, ghost: null, x: e.clientX, y: e.clientY, pid: e.pointerId, timer: 0 };
    // Souris : on glisse tout de suite ; doigt : appui long (le défilement de la grille reste libre).
    const delay = e.pointerType === 'mouse' ? 0 : 260;
    drag.timer = window.setTimeout(() => { if (drag && delay > 0) startGhost(card); }, delay);
    if (delay === 0) drag.timer = -1;
    (drag as { src?: HTMLElement }).src = card;
  });
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onCancel);
  function onMove(e: PointerEvent): void {
    if (!drag || e.pointerId !== drag.pid) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.ghost) {
      if (Math.hypot(dx, dy) > 8) {
        if (drag.timer === -1) startGhost((drag as { src?: HTMLElement }).src!);
        else { window.clearTimeout(drag.timer); drag = null; return; }
      } else return;
    }
    drag.x = e.clientX; drag.y = e.clientY;
    moveGhost(e.clientX, e.clientY);
  }
  async function onUp(e: PointerEvent): Promise<void> {
    if (!drag || e.pointerId !== drag.pid) return;
    window.clearTimeout(drag.timer);
    const d = drag;
    drag = null;
    if (!d.ghost) return;
    dragged = true;
    window.setTimeout(() => { dragged = false; }, 50);
    d.ghost.remove();
    wrap.classList.remove('dragging');
    const target = slotAt(e.clientX, e.clientY);
    slotsEl.querySelectorAll('.over').forEach((s) => s.classList.remove('over'));
    if (!target) return;
    const to = Number(target.dataset['slot']);
    if (d.from != null) {
      let ok = false;
      await updateProfile((q) => { ok = swapDeckSlots(q, viewDeck, d.from!, to); });
      if (ok) emitMeta('deckChanged', { index: viewDeck, deck: deckOf(getProfile()!).slice() });
    } else await place(to, d.id);
  }
  function onCancel(): void {
    if (!drag) return;
    window.clearTimeout(drag.timer);
    drag.ghost?.remove();
    drag = null;
    wrap.classList.remove('dragging');
  }

  return () => {
    off();
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onCancel);
    onCancel();
    wrap.remove();
  };
}

