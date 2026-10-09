// Ouverture d'un pack (§6.2), façon booster :
// 1. le pack (sachet métallisé aux couleurs de l'univers, holographique pour le Pack Complet) arrive,
//    reflet qui glisse, inclinaison au doigt ;
// 2. on le DÉCHIRE en glissant le doigt sur le haut (ou bouton « Ouvrir ») : la ligne de déchirure suit
//    le doigt, la bande s'envole avec des confettis de papier, la lumière qui jaillit annonce la meilleure
//    rareté (bleu, violet, or avec rayons ; Légendaire : secousse, étincelles, vibration) ;
// 3. les cartes sortent du pack. 1 carte : elle vient au centre, on la retourne. Lot : distribution en
//    grille, on retourne une à une (Épique et Légendaire en grand, Légendaire au ralenti) ou « Tout retourner » ;
// 4. récapitulatif (cartes de héros communes), nouveaux héros en tête, « Encore ! » et « Terminé ».
// « Passer » mène directement au récapitulatif. prefers-reduced-motion : version courte, sans secousse.
import './packOpening.css';
import { ficheUrl } from '../access/fiches';
import { UNITS } from '../data/units';
import type { Rarity, UnitId } from '../data/types';
import { getPullPack, packPool, type PullPack, type PullPackId, type PullResult } from '../meta/pulls';
import { getProfile } from '../meta/profile';
import { heroCardHtml, heroProgress } from './heroCard';
import { RARITY_LABEL, attackLoop, el, esc, figureUrl, packColors, packLabel, portraitUrl } from './kit';

export interface PackOpeningOptions {
  /** Bouton « Encore ! » du récapitulatif (HTML du libellé), absent si on ne peut pas retirer. */
  again?: string | null;
}
/** 'again' : le joueur a demandé « Encore ! ». */
export type PackOpeningEnd = 'done' | 'again';

const RANK: Record<Rarity, number> = { rare: 0, epique: 1, legendaire: 2 };
/** Couleur de la lumière (déchirure, éclat, halo des cartes) selon la rareté. */
const LIGHT: Record<Rarity, string> = { rare: '#7cc4ff', epique: '#c98bff', legendaire: '#ffd34d' };
const TEAR_Y = 17; // % de la hauteur du pack
const TEAR_DONE = 0.6; // part de la largeur à déchirer

interface PackLook { c1: string; c2: string; accent: string; holo: boolean; title: string }

/** Apparence du pack : dérivée des couleurs d'univers (packs futurs compris). */
export function packLook(pack: PullPack): PackLook {
  const [c1, c2] = packColors(pack.id);
  const accent = pack.id === 'marvel' ? '#ffffff' : '#ffd75a';
  const title = pack.name.replace(/^pack\s+/i, '');
  return { c1, c2, accent, holo: pack.id === 'complet', title };
}

/** Face du pack (dessinée deux fois : bande du haut et corps, découpées le long de la déchirure). */
function packFaceHtml(pack: PullPack, look: PackLook, count: number): string {
  const legends = packPool(pack.id).filter((u) => u.rarity === 'legendaire').slice(0, 3);
  return `<div class="pk-face">
    <span class="pk-foil"><span class="pk-holo"></span></span>
    <span class="pk-lines"></span>
    <span class="pk-ridge t"></span><span class="pk-ridge b"></span>
    <span class="pk-brand">MARVEL RUSH</span>
    <span class="pk-art"><span class="pk-sun"></span>${legends.map((u, i) => `<img src="${portraitUrl(u.id)}" alt="" draggable="false" style="--i:${i - (legends.length - 1) / 2}">`).join('')}</span>
    <span class="pk-kicker">Pack</span>
    <b class="pk-title">${esc(look.title)}</b>
    <span class="pk-count">${count} carte${count > 1 ? 's' : ''}</span>
    <span class="pk-gems"><i class="r"></i><i class="e"></i><i class="l"></i></span>
    <span class="pk-sheen"></span>
  </div>`;
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pts = (list: [number, number][]) => list.map(([x, y]) => `${x.toFixed(2)}% ${y.toFixed(2)}%`).join(',');

/** Rangées de la distribution : 10 → 3-4-3. */
function rowsFor(n: number): number[] {
  if (n <= 4) return [n];
  if (n === 9) return [3, 3, 3];
  if (n === 10) return [3, 4, 3];
  const a = Math.ceil(n / 2);
  return [a, n - a];
}

export function playPackOpening(host: HTMLElement, pack: PullPack, results: PullResult[], opts: PackOpeningOptions = {}): Promise<PackOpeningEnd> {
  return new Promise((resolve) => {
    const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const look = packLook(pack);
    const n = results.length;
    const multi = n > 1;
    const best: Rarity = results.reduce<Rarity>((b, r) => (RANK[r.rarity] > RANK[b] ? r.rarity : b), 'rare');
    const T = (ms: number) => (rm ? Math.min(ms, 140) : ms);

    const root = el('div', `po${rm ? ' rm' : ''}${look.holo ? ' holo' : ''}`);
    root.style.setProperty('--c1', look.c1);
    root.style.setProperty('--c2', look.c2);
    root.style.setProperty('--acc', look.accent);
    root.style.setProperty('--lc', LIGHT[best]);
    root.innerHTML = `
      <div class="po-bg"><span class="po-bgrays"></span></div>
      <div class="po-top"><span class="po-pack">${esc(pack.name)}</span><span class="po-n"></span>
        <button class="po-skip" data-act="skip" data-tuto="pack-skip">Passer ⏭</button></div>
      <div class="po-stage"></div>
      <div class="po-bottom"><p class="po-hint"></p><div class="po-actions"></div></div>
      <div class="po-fx"></div>`;
    host.appendChild(root);
    const stage = root.querySelector<HTMLElement>('.po-stage')!;
    const counter = root.querySelector<HTMLElement>('.po-n')!;
    const hint = root.querySelector<HTMLElement>('.po-hint')!;
    const actions = root.querySelector<HTMLElement>('.po-actions')!;
    const fxLayer = root.querySelector<HTMLElement>('.po-fx')!;

    // Illustrations des fiches : chargées pendant l'ouverture du pack.
    const fiches = new Map<UnitId, string | null>();
    for (const id of new Set(results.map((r) => r.unit))) {
      void ficheUrl(id).then((u) => fiches.set(id, u)).catch(() => fiches.set(id, null));
    }

    type Phase = 'pack' | 'rip' | 'deal' | 'reveal' | 'summary' | 'done';
    let phase: Phase = 'pack';
    /** Incrémenté par « Passer » / la fin : les séquences en cours s'arrêtent. */
    let epoch = 0;
    const timers = new Set<number>();
    const stops: (() => void)[] = [];
    const wait = (ms: number) => new Promise<void>((res) => {
      const t = window.setTimeout(() => { timers.delete(t); res(); }, T(ms));
      timers.add(t);
    });
    const killTimers = () => { timers.forEach((t) => window.clearTimeout(t)); timers.clear(); stops.splice(0).forEach((f) => f()); };
    const vibrate = (p: number | number[]) => { try { navigator.vibrate?.(p); } catch { /* non pris en charge */ } };

    function setHint(text: string, on = true): void {
      hint.textContent = text;
      hint.classList.toggle('on', on && !!text);
    }

    // ------------------------------------------------------------------ effets
    function fxAt(x: number, y: number, color: string, count: number, o: { dist?: number; size?: number; star?: boolean; life?: number } = {}): void {
      if (rm || !root.isConnected) return;
      const box = root.getBoundingClientRect();
      const frag = document.createDocumentFragment();
      const made: HTMLElement[] = [];
      for (let i = 0; i < count; i++) {
        const s = el('span', o.star ? 'fx-star' : 'fx-p');
        made.push(s);
        const a = Math.random() * Math.PI * 2;
        const d = (o.dist ?? 120) * rnd(0.45, 1.1);
        s.style.cssText = `left:${x - box.left}px;top:${y - box.top}px;--dx:${(Math.cos(a) * d).toFixed(1)}px;--dy:${(Math.sin(a) * d).toFixed(1)}px;--s:${((o.size ?? 8) * rnd(0.6, 1.3)).toFixed(1)}px;--c:${color};--t:${((o.life ?? 800) * rnd(0.75, 1.2)).toFixed(0)}ms;--r:${rnd(-200, 200).toFixed(0)}deg`;
        frag.appendChild(s);
      }
      fxLayer.appendChild(frag);
      window.setTimeout(() => made.forEach((s) => s.remove()), (o.life ?? 800) * 1.3);
    }
    function ring(x: number, y: number, color: string, big = false): void {
      if (rm || !root.isConnected) return;
      const box = root.getBoundingClientRect();
      const s = el('span', `fx-ring${big ? ' big' : ''}`);
      s.style.cssText = `left:${x - box.left}px;top:${y - box.top}px;--c:${color}`;
      fxLayer.appendChild(s);
      window.setTimeout(() => s.remove(), 900);
    }
    function quake(strong = false): void {
      if (rm) return;
      root.classList.remove('quake', 'quake2');
      void root.offsetWidth;
      root.classList.add(strong ? 'quake2' : 'quake');
      window.setTimeout(() => root.classList.remove('quake', 'quake2'), 700);
    }
    function flash(color: string): void {
      if (rm) return;
      const f = el('div', 'po-flash');
      f.style.setProperty('--c', color);
      root.appendChild(f);
      window.setTimeout(() => f.remove(), 700);
    }
    const center = (e: Element) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };

    // ------------------------------------------------------------------ 1. le pack
    // Bords sertis en dents de scie, déchirure irrégulière.
    const teeth = 22;
    const topEdge: [number, number][] = [];
    const botEdge: [number, number][] = [];
    for (let i = 0; i <= teeth * 2; i++) {
      const x = (i / (teeth * 2)) * 100;
      topEdge.push([x, i % 2 ? 1.3 : 0]);
      botEdge.push([100 - x, i % 2 ? 98.7 : 100]);
    }
    const tear: [number, number][] = [];
    const SEG = 28;
    for (let i = 0; i <= SEG; i++) tear.push([(i / SEG) * 100 + (i > 0 && i < SEG ? rnd(-1, 1) : 0), TEAR_Y + (i % 2 ? rnd(0.2, 1.1) : -rnd(0.2, 1.1)) + Math.sin(i * 0.7) * 0.5]);
    const topClip = `polygon(${pts(topEdge)},${pts([...tear].reverse())})`;
    const bodyClip = `polygon(${pts(tear)},${pts(botEdge)})`;

    const face = packFaceHtml(pack, look, n);
    const backs = Math.min(n, 4);
    const pk = el('div', 'pk enter');
    pk.innerHTML = `
      <span class="pk-shadow"></span>
      <div class="pk-rays"></div>
      <div class="pk-tilt">
        <div class="pk-cards">${Array.from({ length: backs }, (_, i) => `<span class="pk-cb" style="--k:${i}">${backHtml()}</span>`).join('')}</div>
        <div class="pk-glowin"></div>
        <div class="pk-part pk-body" style="clip-path:${bodyClip}">${face}</div>
        <div class="pk-part pk-strip" style="clip-path:${topClip}">${face}</div>
        <svg class="pk-tear" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline class="g" points=""/><polyline class="c" points=""/></svg>
        <div class="pk-guide"><span class="pk-dots"></span><span class="pk-finger"></span></div>
        <span class="pk-beam"></span>
      </div>`;
    stage.appendChild(pk);
    const tilt = pk.querySelector<HTMLElement>('.pk-tilt')!;
    const strip = pk.querySelector<HTMLElement>('.pk-strip')!;
    const tearG = pk.querySelector<SVGPolylineElement>('.pk-tear .g')!;
    const tearC = pk.querySelector<SVGPolylineElement>('.pk-tear .c')!;
    setHint('Glisse le doigt sur le haut du pack pour le déchirer');
    actions.innerHTML = `<button class="mr-btn yellow po-rip" data-act="rip" data-tuto="pack-rip">Ouvrir</button>`;
    counter.textContent = multi ? `×${n}` : '';
    window.setTimeout(() => pk.classList.remove('enter'), T(700));

    function backHtml(): string {
      return `<span class="cb"><span class="cb-in"><span class="cb-emb">MR</span></span></span>`;
    }

    /** Déchirure couverte, en fraction de la largeur : [de, à]. */
    let t0 = -1, t1 = -1, dir = 1;
    function drawTear(): void {
      const a = t0 * 100, b = t1 * 100;
      const p: [number, number][] = [];
      const yAt = (x: number) => {
        let i = 0;
        while (i < SEG - 1 && tear[i + 1]![0] < x) i++;
        const [x1, y1] = tear[i]!; const [x2, y2] = tear[i + 1]!;
        return y1 + ((y2 - y1) * (x - x1)) / Math.max(0.01, x2 - x1);
      };
      p.push([a, yAt(a)]);
      for (const q of tear) if (q[0] > a && q[0] < b) p.push(q);
      p.push([b, yAt(b)]);
      const s = p.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
      tearG.setAttribute('points', s);
      tearC.setAttribute('points', s);
      const prog = t1 - t0;
      pk.style.setProperty('--tp', prog.toFixed(3));
      strip.style.transformOrigin = `${dir > 0 ? 100 : 0}% ${TEAR_Y}%`;
      strip.style.transform = `translateY(${(-prog * 7).toFixed(1)}px) rotate(${(-dir * prog * 9).toFixed(2)}deg)`;
    }
    function tearTo(f: number): void {
      f = Math.max(0, Math.min(1, f));
      if (t0 < 0) { t0 = t1 = f; dir = f < 0.5 ? 1 : -1; pk.classList.add('tearing'); }
      t0 = Math.min(t0, f); t1 = Math.max(t1, f);
      drawTear();
      if (t1 - t0 >= TEAR_DONE) void rip();
    }

    // Glisser : en haut = déchirer, ailleurs = incliner le pack.
    let drag: { id: number; mode: 'tear' | 'tilt'; x: number; y: number; moved: boolean } | null = null;
    let lastBuzz = 0;
    pk.addEventListener('pointerdown', (e) => {
      if (phase !== 'pack') return;
      const r = tilt.getBoundingClientRect();
      const fy = (e.clientY - r.top) / r.height;
      drag = { id: e.pointerId, mode: fy < 0.36 ? 'tear' : 'tilt', x: e.clientX, y: e.clientY, moved: false };
      try { pk.setPointerCapture(e.pointerId); } catch { /* pointeur déjà relâché */ }
      tilt.classList.remove('spring');
      if (drag.mode === 'tear') tearTo((e.clientX - r.left) / r.width);
      e.preventDefault();
    });
    pk.addEventListener('pointermove', (e) => {
      if (!drag || drag.id !== e.pointerId || phase !== 'pack') return;
      const r = tilt.getBoundingClientRect();
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true;
      if (drag.mode === 'tear') {
        tearTo((e.clientX - r.left) / r.width);
        const now = performance.now();
        if (now - lastBuzz > 90) { lastBuzz = now; vibrate(4); }
      } else {
        const ry = Math.max(-22, Math.min(22, dx * 0.22));
        const rx = Math.max(-16, Math.min(16, -dy * 0.18));
        tilt.style.transform = `rotateX(${rx.toFixed(1)}deg) rotateY(${ry.toFixed(1)}deg)`;
        pk.style.setProperty('--sx', `${(ry * 4).toFixed(0)}%`);
      }
    });
    const endDrag = (e: PointerEvent) => {
      if (!drag || drag.id !== e.pointerId) return;
      const d = drag;
      drag = null;
      if (phase !== 'pack') return;
      if (d.mode === 'tilt') {
        tilt.classList.add('spring');
        tilt.style.transform = '';
        pk.style.setProperty('--sx', '0%');
        if (!d.moved) { pk.classList.remove('nudge'); void pk.offsetWidth; pk.classList.add('nudge'); hint.classList.add('pulse'); }
      }
    };
    pk.addEventListener('pointerup', endDrag);
    pk.addEventListener('pointercancel', endDrag);

    /** Bouton « Ouvrir » : la déchirure se fait toute seule. */
    function autoTear(): void {
      if (phase !== 'pack') return;
      const start = performance.now();
      const dur = T(420);
      const step = (now: number) => {
        if (phase !== 'pack') return;
        const k = Math.min(1, (now - start) / dur);
        tearTo(0.02 + k * 0.96);
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }

    // ------------------------------------------------------------------ 2. déchirure
    async function rip(): Promise<void> {
      if (phase !== 'pack') return;
      phase = 'rip';
      const e = epoch;
      drag = null;
      t0 = 0; t1 = 1; drawTear();
      pk.classList.add('ripped', `best-${best}`);
      setHint('', false);
      actions.innerHTML = '';
      vibrate(best === 'legendaire' ? [30, 40, 30, 40, 140] : 35);
      // Confettis de papier le long de la déchirure.
      const tr = tilt.getBoundingClientRect();
      const ty = tr.top + (tr.height * TEAR_Y) / 100;
      if (!rm) {
        const box = root.getBoundingClientRect();
        const frag = document.createDocumentFragment();
        for (let i = 0; i < 16; i++) {
          const s = el('span', 'fx-paper');
          const x = tr.left + Math.random() * tr.width;
          s.style.cssText = `left:${x - box.left}px;top:${ty - box.top}px;--dx:${rnd(-110, 110).toFixed(0)}px;--dy:${rnd(-170, -50).toFixed(0)}px;--r:${rnd(-540, 540).toFixed(0)}deg;--c:${i % 3 ? look.c1 : i % 2 ? '#ffffff' : look.accent}`;
          frag.appendChild(s);
        }
        fxLayer.appendChild(frag);
        window.setTimeout(() => fxLayer.querySelectorAll('.fx-paper').forEach((s) => s.remove()), 1300);
      }
      strip.style.transform = '';
      strip.style.setProperty('--fx', `${dir * 190}px`);
      strip.style.setProperty('--fr', `${dir * 38}deg`);
      strip.classList.add('fly');
      const mid = { x: tr.left + tr.width / 2, y: ty };
      fxAt(mid.x, mid.y, LIGHT[best], best === 'rare' ? 10 : best === 'epique' ? 18 : 30, { dist: best === 'legendaire' ? 220 : 140, size: 7 });
      if (best === 'legendaire') {
        root.classList.add('leg');
        quake(true);
        flash('#ffe9a0');
        fxAt(mid.x, mid.y - 40, '#fff4c4', 22, { star: true, dist: 240, size: 16, life: 1300 });
        window.setTimeout(() => vibrate([60, 50, 120]), 380);
      } else if (best === 'epique') quake();
      await wait(best === 'legendaire' ? 1200 : best === 'epique' ? 850 : 650);
      if (e !== epoch) return;
      // 3. Les cartes sortent du pack.
      pk.classList.add('rise');
      await wait(750);
      if (e !== epoch) return;
      pk.classList.add('drop');
      await wait(380);
      if (e !== epoch) return;
      const top = pk.querySelector('.pk-cb:last-child');
      const from = top ? top.getBoundingClientRect() : null;
      pk.remove();
      root.classList.remove('leg');
      if (multi) deal(from);
      else { phase = 'reveal'; void focus(0, 'flip', from).then(() => { if (e === epoch) summary(); }); }
    }

    // ------------------------------------------------------------------ 3. cartes
    const revealed = new Set<number>();
    let focusOpen = false;

    function outcomeHtml(r: PullResult, short = false): string {
      if (r.outcome === 'nouveau') return `<span class="tag new">${short ? 'Nouveau' : 'Nouveau !'}</span>`;
      if (r.outcome === 'cristaux') return '<span class="tag dup">+5 ✦</span>';
      return '<span class="tag dup">+1</span>';
    }

    function gridCardHtml(r: PullResult, i: number): string {
      const u = UNITS[r.unit];
      const [u1, u2] = packColors(u.pack);
      const gar = r.guaranteed ? `<span class="gc-gar">${r.guaranteed === 'pity' ? 'Garanti' : 'Garantie'}</span>` : '';
      return `<button class="gc r-${r.rarity}${r.guaranteed ? ' gar' : ''}" data-i="${i}" style="--i:${i};--u1:${u1};--u2:${u2};--rl:${LIGHT[r.rarity]}" aria-label="Carte ${i + 1}">
        <span class="gc-in">
          ${backHtml().replace('class="cb"', 'class="cb gc-back"')}
          <span class="gc-front"><img src="${portraitUrl(r.unit)}" alt="" draggable="false"><span class="gc-name">${esc(u.name)}</span>${outcomeHtml(r, true)}</span>
        </span>${gar}
      </button>`;
    }

    function deal(from: DOMRect | null): void {
      phase = 'deal';
      const e = epoch;
      const rows = rowsFor(n);
      const grid = el('div', 'po-deal');
      let k = 0;
      grid.innerHTML = rows.map((c) => `<div class="po-row">${Array.from({ length: c }, () => gridCardHtml(results[k]!, k++)).join('')}</div>`).join('');
      stage.appendChild(grid);
      const sr = stage.getBoundingClientRect();
      const per = Math.max(...rows);
      const cw = Math.min(108, (sr.width - 24 - 10 * (per - 1)) / per, ((sr.height - 30 - 12 * (rows.length - 1)) / rows.length) / 1.42);
      grid.style.setProperty('--cw', `${Math.floor(cw)}px`);
      const cards = [...grid.querySelectorAll<HTMLElement>('.gc')];
      if (from && !rm) {
        const fx = from.left + from.width / 2, fy = from.top + from.height / 2;
        for (const c of cards) {
          const r = c.getBoundingClientRect();
          const s = from.width / r.width;
          c.style.transform = `translate(${(fx - (r.left + r.width / 2)).toFixed(0)}px, ${(fy - (r.top + r.height / 2)).toFixed(0)}px) scale(${s.toFixed(2)}) rotate(${rnd(-8, 8).toFixed(0)}deg)`;
        }
        void grid.offsetWidth;
        cards.forEach((c, i) => {
          c.style.transitionDelay = `${i * 75}ms`;
          c.classList.add('dealt');
          c.style.transform = '';
        });
        cards.forEach((_, i) => window.setTimeout(() => { if (e === epoch) vibrate(6); }, i * 75 + 300));
      } else cards.forEach((c) => c.classList.add('dealt'));
      void wait(n * 75 + 450).then(() => {
        if (e !== epoch) return;
        cards.forEach((c) => { c.style.transitionDelay = ''; });
        phase = 'reveal';
        grid.classList.add('ready');
        setHint('Touche une carte pour la retourner');
        actions.innerHTML = `<button class="mr-btn po-all" data-act="all">Tout retourner</button>`;
      });
    }

    function gridCard(i: number): HTMLElement | null { return stage.querySelector<HTMLElement>(`.gc[data-i="${i}"]`); }

    function afterReveal(): void {
      if (phase !== 'reveal' || !multi) return;
      counter.textContent = `${revealed.size} / ${n}`;
      if (revealed.size >= n && !focusOpen) {
        setHint('');
        actions.innerHTML = `<button class="mr-btn yellow po-next" data-act="next">Voir le lot</button>`;
      }
    }

    /** Retourne une carte dans la grille (petit éclat selon la rareté). */
    function flipSmall(i: number): void {
      const c = gridCard(i);
      if (!c || revealed.has(i)) return;
      revealed.add(i);
      c.classList.add('up');
      const r = results[i]!;
      const p = center(c);
      window.setTimeout(() => {
        ring(p.x, p.y, LIGHT[r.rarity]);
        fxAt(p.x, p.y, LIGHT[r.rarity], r.rarity === 'rare' ? 6 : r.rarity === 'epique' ? 12 : 20, { dist: r.rarity === 'rare' ? 50 : 80, size: 6, life: 600 });
      }, T(180));
      vibrate(r.rarity === 'rare' ? 8 : 20);
      afterReveal();
    }

    function onGridTap(i: number): void {
      if (phase !== 'reveal' || focusOpen) return;
      const c = gridCard(i);
      if (!c) return;
      const r = results[i]!;
      if (revealed.has(i)) { void focus(i, 'open', c.getBoundingClientRect()); return; }
      if (r.rarity === 'rare') { flipSmall(i); return; }
      revealed.add(i);
      const rect = c.getBoundingClientRect();
      c.classList.add('up', 'hold');
      void focus(i, 'flip', rect).then(() => { c.classList.remove('hold'); afterReveal(); });
    }

    async function revealAll(): Promise<void> {
      if (phase !== 'reveal' || focusOpen) return;
      const e = epoch;
      actions.innerHTML = '';
      const hidden = results.map((_, i) => i).filter((i) => !revealed.has(i));
      const legs = hidden.filter((i) => results[i]!.rarity === 'legendaire');
      for (const i of hidden) {
        if (legs.includes(i)) continue;
        flipSmall(i);
        await wait(110);
        if (e !== epoch) return;
      }
      for (const i of legs) {
        await wait(250);
        if (e !== epoch) return;
        const c = gridCard(i);
        if (!c) continue;
        revealed.add(i);
        const rect = c.getBoundingClientRect();
        c.classList.add('up', 'hold');
        await focus(i, 'flip', rect);
        c.classList.remove('hold');
        if (e !== epoch) return;
      }
      afterReveal();
    }

    /** Valeur de la barre de cartes juste après ce tirage (pour les doublons). */
    function barAfter(i: number): { have: number; need: number } | null {
      const r = results[i]!;
      const h = getProfile()?.heroes[r.unit];
      if (!h || r.outcome !== 'carte') return null;
      const g = heroProgress(h);
      if (g.kind === 'max' || g.need <= 0) return null;
      const later = results.slice(i + 1).filter((x) => x.unit === r.unit && x.outcome === 'carte').length;
      return { have: Math.max(1, g.have - later), need: g.need };
    }

    function bigCardHtml(r: PullResult, i: number): string {
      const u = UNITS[r.unit];
      const [u1, u2] = packColors(u.pack);
      const bar = barAfter(i);
      const below = r.outcome === 'nouveau'
        ? '<div class="bc-stamp">NOUVEAU !</div>'
        : r.outcome === 'cristaux'
          ? '<div class="bc-dup"><b>+5 ✦</b><small>héros au maximum</small></div>'
          : `<div class="bc-dup"><b>+1 carte</b>${bar ? `<span class="bc-bar${bar.have >= bar.need ? ' ready' : ''}" style="--from:${Math.min(1, (bar.have - 1) / bar.need).toFixed(3)};--to:${Math.min(1, bar.have / bar.need).toFixed(3)}"><i></i><span>${bar.have}/${bar.need}</span></span>${bar.have >= bar.need ? '<small>Prêt à monter de niveau !</small>' : ''}` : ''}</div>`;
      return `<div class="bc r-${r.rarity}" style="--u1:${u1};--u2:${u2};--rl:${LIGHT[r.rarity]}">
        <span class="bc-glow"></span>
        <div class="bc-in">
          ${backHtml().replace('class="cb"', 'class="cb bc-back"')}
          <div class="bc-front">
            <div class="bc-art"></div>
            <img class="bc-fig" src="${figureUrl(r.unit, 0)}" alt="" draggable="false">
            <div class="bc-banner">${RARITY_LABEL[r.rarity]}</div>
            <div class="bc-info"><b class="bc-name">${esc(u.name)}</b><span class="bc-univ">${esc(packLabel(u.pack))}</span></div>
            <span class="bc-shine"></span>
          </div>
        </div>
        ${below}
      </div>`;
    }

    /** Carte en grand. 'flip' : arrive de dos, suspense selon la rareté, puis se retourne. */
    async function focus(i: number, mode: 'flip' | 'open', from: DOMRect | null): Promise<void> {
      const e = epoch;
      const r = results[i]!;
      const leg = r.rarity === 'legendaire';
      focusOpen = true;
      root.classList.add('focusing');
      const f = el('div', `po-focus r-${r.rarity}${mode === 'open' ? ' shown' : ''}`);
      f.innerHTML = `<div class="pf-dim"></div><div class="pf-rays"></div><div class="pf-card">${bigCardHtml(r, i)}</div><p class="pf-hint"></p>`;
      root.insertBefore(f, fxLayer);
      const card = f.querySelector<HTMLElement>('.bc')!;
      const pfHint = f.querySelector<HTMLElement>('.pf-hint')!;
      if (mode === 'open') card.classList.add('up', 'done');
      // Arrivée depuis la carte de la grille (ou du pack).
      const to = card.getBoundingClientRect();
      if (from && !rm) {
        const s = from.width / to.width;
        card.style.transform = `translate(${(from.left + from.width / 2 - (to.left + to.width / 2)).toFixed(0)}px, ${(from.top + from.height / 2 - (to.top + to.height / 2)).toFixed(0)}px) scale(${s.toFixed(3)})`;
        void card.offsetWidth;
        card.classList.add('move');
        card.style.transform = '';
      }
      requestAnimationFrame(() => f.classList.add('on'));
      if (multi) counter.textContent = `${revealed.size} / ${n}`;
      let startedLoop = false;
      const startShow = () => {
        if (startedLoop) return;
        startedLoop = true;
        applyFiche(card, r.unit);
        const fig = card.querySelector<HTMLImageElement>('.bc-fig');
        if (fig) stops.push(attackLoop(fig, r.unit));
      };

      if (mode === 'flip') {
        await wait(leg ? 520 : 380);
        if (e !== epoch) return;
        // Suspense : la carte tremble, la lueur monte. Légendaire : ralenti, fond noir, rayons dorés.
        f.classList.add('charge');
        if (leg) { f.classList.add('slowmo'); vibrate([20, 60, 20, 60, 20]); }
        await wait(leg ? 1500 : r.rarity === 'epique' ? 700 : 260);
        if (e !== epoch) return;
        f.classList.remove('charge');
        card.classList.add('up');
        if (leg) { flash('#fff3c4'); quake(true); vibrate([80, 40, 160]); }
        else if (r.rarity === 'epique') { flash('#e7d0ff'); vibrate(30); }
        await wait(leg ? 520 : 260);
        if (e !== epoch) return;
        const p = center(card);
        ring(p.x, p.y, LIGHT[r.rarity], r.rarity !== 'rare');
        fxAt(p.x, p.y, LIGHT[r.rarity], r.rarity === 'rare' ? 12 : r.rarity === 'epique' ? 24 : 40, { dist: r.rarity === 'rare' ? 120 : r.rarity === 'epique' ? 180 : 260, size: 8 });
        if (leg) {
          fxAt(p.x, p.y, '#fff6d0', 26, { star: true, dist: 220, size: 18, life: 1500 });
          window.setTimeout(() => { if (e === epoch) fxAt(p.x, p.y, '#ffd34d', 16, { star: true, dist: 180, size: 12, life: 1400 }); }, 500);
        }
        startShow();
        await wait(leg ? 700 : 350);
        if (e !== epoch) return;
        card.classList.add('done');
      } else startShow();

      pfHint.textContent = multi ? 'Touche pour revenir' : 'Touche pour continuer';
      f.classList.add('tap');
      await new Promise<void>((res) => {
        f.addEventListener('click', (ev) => { ev.stopPropagation(); res(); }, { once: true });
        const t = window.setInterval(() => { if (e !== epoch) { window.clearInterval(t); res(); } }, 200);
        f.addEventListener('click', () => window.clearInterval(t), { once: true });
      });
      stops.splice(0).forEach((s) => s());
      if (e !== epoch) { f.remove(); focusOpen = false; root.classList.remove('focusing'); return; }
      // Retour vers la grille.
      f.classList.remove('on', 'tap');
      f.classList.add('off');
      if (multi && !rm) {
        const back = gridCard(i)?.getBoundingClientRect();
        if (back) {
          const now = card.getBoundingClientRect();
          card.classList.add('move');
          card.style.transform = `translate(${(back.left + back.width / 2 - (now.left + now.width / 2)).toFixed(0)}px, ${(back.top + back.height / 2 - (now.top + now.height / 2)).toFixed(0)}px) scale(${(back.width / now.width).toFixed(3)})`;
        }
      }
      await wait(multi ? 300 : 200);
      f.remove();
      focusOpen = false;
      root.classList.remove('focusing');
    }

    function applyFiche(scope: HTMLElement, id: UnitId): void {
      const set = (url: string | null | undefined) => {
        if (!url || !scope.isConnected) return;
        const art = scope.querySelector<HTMLElement>('.bc-art');
        if (!art) return;
        art.style.backgroundImage = `url("${url}")`;
        scope.classList.add('has-fiche');
      };
      if (fiches.has(id)) set(fiches.get(id));
      else void ficheUrl(id).then(set).catch(() => undefined);
    }

    // ------------------------------------------------------------------ 4. récapitulatif
    function summary(): void {
      if (phase === 'summary' || phase === 'done') return;
      phase = 'summary';
      epoch += 1;
      killTimers();
      root.classList.remove('leg', 'quake', 'quake2');
      root.querySelectorAll('.po-focus, .po-flash').forEach((x) => x.remove());
      fxLayer.innerHTML = '';
      focusOpen = false;
      counter.textContent = '';
      setHint('', false);
      root.querySelector('.po-skip')?.remove();
      root.classList.add('sum');
      const p = getProfile();
      // Un héros par case : nouveaux d'abord, puis par rareté.
      const groups = new Map<UnitId, { r: PullResult; isNew: boolean; cards: number; crystals: number; i: number }>();
      results.forEach((r, i) => {
        const g = groups.get(r.unit) ?? { r, isNew: false, cards: 0, crystals: 0, i };
        if (r.outcome === 'nouveau') g.isNew = true;
        else if (r.outcome === 'carte') g.cards += 1;
        else g.crystals += 5;
        groups.set(r.unit, g);
      });
      const list = [...groups.values()].sort((a, b) => Number(b.isNew) - Number(a.isNew) || RANK[b.r.rarity] - RANK[a.r.rarity] || a.i - b.i);
      const news = list.filter((g) => g.isNew).length;
      const label = (g: (typeof list)[number]) => [
        g.isNew ? 'Nouveau !' : '',
        g.cards ? `+${g.cards} carte${g.cards > 1 ? 's' : ''}` : '',
        g.crystals ? `+${g.crystals} ✦` : '',
      ].filter(Boolean).join(' · ');
      const cols = list.length <= 3 ? list.length : list.length === 4 ? 4 : list.length <= 6 ? 3 : 5;
      stage.innerHTML = `<div class="po-sum" style="--cols:${cols}">
        <h3>${news ? `${news} nouveau${news > 1 ? 'x' : ''} héros !` : 'Ton lot'}</h3>
        <div class="po-grid">${list.map((g, k) => `<div class="po-mini${g.isNew ? ' is-new' : ''} r-${g.r.rarity}" style="--d:${k * 70}ms">${heroCardHtml({ id: g.r.unit, state: p?.heroes[g.r.unit], profile: p, newBadge: g.isNew })}<span class="po-out">${esc(UNITS[g.r.unit].name)}<small>${label(g)}</small></span></div>`).join('')}</div>
      </div>`;
      actions.innerHTML = `${opts.again ? `<button class="mr-btn po-again" data-act="again">${opts.again}</button>` : ''}<button class="mr-btn yellow po-done" data-act="done" data-tuto="pack-done">Terminé</button>`;
      if (!rm && list.some((g) => g.isNew)) {
        window.setTimeout(() => {
          if (phase !== 'summary') return;
          for (const m of stage.querySelectorAll('.po-mini.is-new')) {
            const c = center(m);
            fxAt(c.x, c.y, '#ffe27a', 6, { star: true, dist: 50, size: 10, life: 700 });
          }
        }, list.length * 70 + 350);
      }
    }

    function finish(end: PackOpeningEnd): void {
      if (phase === 'done') return;
      phase = 'done';
      epoch += 1;
      killTimers();
      root.classList.add('out');
      window.setTimeout(() => { root.remove(); resolve(end); }, 230);
    }

    root.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      const act = t.closest<HTMLElement>('[data-act]')?.dataset['act'];
      if (act === 'skip') { summary(); return; }
      if (act === 'rip') { autoTear(); return; }
      if (act === 'all') { void revealAll(); return; }
      if (act === 'next') { summary(); return; }
      if (act === 'done') { finish('done'); return; }
      if (act === 'again') { finish('again'); return; }
      const gc = t.closest<HTMLElement>('.gc');
      if (gc) { onGridTap(Number(gc.dataset['i'])); return; }
    });
  });
}

// Démo de développement : window.__mrPackDemo('marvel', ['legendaire', 'rare', …]) joue l'animation
// avec des résultats fabriqués (le profil n'est pas modifié).
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>)['__mrPackDemo'] = (packId: PullPackId = 'complet', rarities: Rarity[] = ['legendaire']) => {
    const pool = packPool(packId);
    const results: PullResult[] = rarities.map((rarity, i) => {
      const c = pool.filter((u) => u.rarity === rarity);
      const u = c[Math.floor(Math.random() * c.length)] ?? pool[0]!;
      return { unit: u.id, rarity: u.rarity, outcome: i % 3 === 1 ? 'carte' : 'nouveau', ...(rarities.length >= 10 && i === rarities.length - 1 && rarity === 'epique' ? { guaranteed: 'lot' as const } : {}) };
    });
    const host = document.querySelector<HTMLElement>('.sh-overlay') ?? document.body;
    return playPackOpening(host, getPullPack(packId), results, { again: 'Encore !' });
  };
}
