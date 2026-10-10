// Calque du tutoriel guidé (§5.0) : assombrissement avec des trous de lumière autour des cibles, main
// animée (toucher ou glisser), bulle courte dite par le guide (Spider-Man ou Vaïana), et filtre des
// touches : pendant une étape, seule l'action demandée passe. « Passer le tutoriel » avec confirmation.
import './tutorial.css';
import type { UnitId } from '../data/types';
import { tokenUrl } from '../ui/kit';

export interface Rect { x: number; y: number; w: number; h: number }

/** Cible : sélecteur CSS (ex. '[data-tuto="summon"]'), élément, ou rectangle calculé (case du plateau). */
export type Target = string | (() => Element | Rect | null | undefined);

export interface CoachStep {
  /** Texte de la bulle (HTML court, déjà échappé). Vide = pas de bulle. */
  text?: string;
  /** Cibles éclairées (trous dans l'assombrissement). */
  holes?: Target[];
  /** Zones où les touches passent : 'all' (tout), 'none' (rien), ou des cibles (par défaut : les trous). */
  allow?: Target[] | 'all' | 'none';
  /** Main animée : toucher une cible, ou glisser de l'une à l'autre (appui long d'abord si `hold`). */
  hand?: { tap: Target } | { from: Target; to: Target; hold?: boolean };
  /** Assombrir le reste de l'écran (par défaut : oui s'il y a des trous). */
  dim?: boolean;
  /** Bouton de la bulle (« Continuer ») ; sa touche appelle `onNext`. */
  next?: string;
  onNext?: () => void;
  /** Position de la bulle : automatique (à l'opposé du trou), en haut, en bas, au centre. */
  place?: 'auto' | 'top' | 'bottom' | 'center';
  /** Marge autour des trous (px). */
  pad?: number;
  /** Proposer « Passer le tutoriel » dans la bulle (par défaut : oui). */
  skippable?: boolean;
}

const SVGNS = 'http://www.w3.org/2000/svg';
const HAND_SVG = `<svg viewBox="0 0 64 72" aria-hidden="true"><path d="M24 6c4 0 6 3 6 6v20l3-1c3-5 9-4 10 0 3-3 9-2 10 3 3-1 7 1 7 5v12c0 12-8 20-20 20h-6c-7 0-11-3-15-9L7 42c-2-4 0-8 4-8 3 0 5 2 7 4V12c0-3 2-6 6-6z" fill="#fff" stroke="#1d1733" stroke-width="4.5" stroke-linejoin="round"/><path d="M30 32v10M43 32v10M53 36v8" stroke="#1d1733" stroke-width="3.5" stroke-linecap="round"/></svg>`;

function rectOf(t: Target | undefined): Rect | null {
  if (!t) return null;
  const v = typeof t === 'string' ? document.querySelector(t) : t();
  if (!v) return null;
  if (v instanceof Element) {
    if (!v.isConnected) return null;
    const r = v.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return null;
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  }
  return v;
}

const inside = (r: Rect, x: number, y: number, pad = 0) => x >= r.x - pad && x <= r.x + r.w + pad && y >= r.y - pad && y <= r.y + r.h + pad;

export class Coach {
  readonly el: HTMLElement;
  private dimPath: SVGPathElement;
  private rings: HTMLElement;
  private hand: HTMLElement;
  private bubble: HTMLElement;
  private confirmEl: HTMLElement | null = null;
  private step: CoachStep | null = null;
  private raf = 0;
  private t0 = performance.now();
  private holes: Rect[] = [];
  private allowRects: Rect[] = [];
  private destroyed = false;
  private bubbleKey = '';
  private readonly filter = (e: Event) => this.onInput(e);

  constructor(private guide: UnitId, private onSkip: () => void) {
    this.el = document.createElement('div');
    this.el.className = 'tu';
    this.el.innerHTML = `<svg class="tu-dim" width="100%" height="100%"><path class="tu-dim-r" fill-rule="evenodd" d=""/></svg>
      <div class="tu-rings"></div><div class="tu-hand">${HAND_SVG}<i class="tu-tapfx"></i></div><div class="tu-bubble" role="status" aria-live="polite"></div>`;
    this.dimPath = this.el.querySelector('.tu-dim-r')!;
    this.rings = this.el.querySelector('.tu-rings')!;
    this.hand = this.el.querySelector('.tu-hand')!;
    this.bubble = this.el.querySelector('.tu-bubble')!;
    this.bubble.addEventListener('click', (e) => {
      const a = (e.target as HTMLElement).closest<HTMLElement>('[data-tu]')?.dataset['tu'];
      if (a === 'next') { const fn = this.step?.onNext; fn?.(); }
      if (a === 'skip') this.askSkip();
    });
    document.body.appendChild(this.el);
    for (const type of ['pointerdown', 'mousedown', 'touchstart', 'click', 'dblclick', 'contextmenu']) {
      window.addEventListener(type, this.filter, { capture: true, passive: false });
    }
    this.hide();
    this.raf = requestAnimationFrame(this.frame);
  }

  setGuide(guide: UnitId): void { this.guide = guide; this.bubbleKey = ''; }

  /** Affiche une étape (remplace la précédente). */
  show(step: CoachStep): void {
    if (this.destroyed) return;
    this.step = step;
    this.t0 = performance.now();
    this.bubbleKey = '';
    this.el.classList.add('on');
    this.el.classList.toggle('no-dim', !(step.dim ?? !!step.holes?.length));
    this.hand.classList.toggle('on', !!step.hand);
    this.hand.classList.remove('nudge');
    this.layout();
  }

  /** Retire l'étape : plus d'assombrissement, plus de filtre (le jeu redevient libre). */
  hide(): void {
    this.step = null;
    this.el.classList.remove('on');
    this.hand.classList.remove('on');
    this.bubble.classList.remove('on');
    this.rings.innerHTML = '';
    delete this.dimPath.dataset['k'];
    this.holes = [];
  }

  get active(): boolean { return !!this.step; }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    for (const type of ['pointerdown', 'mousedown', 'touchstart', 'click', 'dblclick', 'contextmenu']) {
      window.removeEventListener(type, this.filter, { capture: true });
    }
    this.el.remove();
  }

  // ------------------------------------------------------------------ filtre des touches
  private onInput(e: Event): void {
    if (!this.step && !this.confirmEl) return;
    const t = e.target as Node | null;
    // La bulle, la confirmation et les fenêtres de pause du combat restent toujours utilisables.
    if (t instanceof Node && (this.bubble.contains(t) || this.confirmEl?.contains(t))) return;
    if (t instanceof Element && t.closest('.mr-modal.on, .mr-sheet-bg, .tip')) return;
    if (this.confirmEl) { this.block(e); return; }
    const allow = this.step!.allow ?? this.step!.holes ?? [];
    if (allow === 'all') return;
    if (allow !== 'none') {
      const pt = pointOf(e);
      if (pt && this.allowRects.some((r) => inside(r, pt.x, pt.y, 4))) return;
    }
    this.block(e);
  }

  private block(e: Event): void {
    e.stopPropagation();
    e.stopImmediatePropagation();
    if (e.cancelable) e.preventDefault();
    if (e.type === 'pointerdown' && this.step) {
      // Petit rappel : la main et la bulle sautillent.
      this.hand.classList.remove('nudge'); void this.hand.offsetWidth; this.hand.classList.add('nudge');
      this.bubble.classList.remove('nudge'); void this.bubble.offsetWidth; this.bubble.classList.add('nudge');
    }
  }

  // ------------------------------------------------------------------ « Passer le tutoriel »
  private askSkip(): void {
    if (this.confirmEl) return;
    const c = document.createElement('div');
    c.className = 'tu-confirm';
    c.innerHTML = `<div class="tu-confirm-box" role="dialog" aria-modal="true">
      <img src="${tokenUrl(this.guide)}" alt="">
      <h3>Passer le tutoriel ?</h3>
      <p>Tu pourras le revoir quand tu veux depuis ton profil.</p>
      <div class="tu-confirm-row"><button class="mr-btn" data-c="no">Continuer</button><button class="mr-btn yellow" data-c="yes">Passer</button></div></div>`;
    c.addEventListener('click', (e) => {
      const a = (e.target as HTMLElement).closest<HTMLElement>('[data-c]')?.dataset['c'];
      if (!a) return;
      c.remove();
      this.confirmEl = null;
      if (a === 'yes') this.onSkip();
    });
    this.el.appendChild(c);
    this.confirmEl = c;
  }

  // ------------------------------------------------------------------ mise en page (chaque image)
  private frame = (now: number): void => {
    if (this.destroyed) return;
    this.raf = requestAnimationFrame(this.frame);
    if (!this.step) return;
    this.layout();
    this.animateHand(now);
  };

  private layout(): void {
    const s = this.step;
    if (!s) return;
    const pad = s.pad ?? 8;
    this.holes = (s.holes ?? []).map(rectOf).filter((r): r is Rect => !!r).map((r) => ({ x: r.x - pad, y: r.y - pad, w: r.w + pad * 2, h: r.h + pad * 2 }));
    const allow = s.allow ?? s.holes ?? [];
    this.allowRects = Array.isArray(allow) ? allow.map(rectOf).filter((r): r is Rect => !!r) : [];
    // Trous de l'assombrissement (chemin SVG pair-impair, sans référence url(#…) sensible au fragment
    // d'adresse) et anneaux lumineux.
    const key = `${window.innerWidth}x${window.innerHeight}|` + this.holes.map((h) => `${h.x | 0},${h.y | 0},${h.w | 0},${h.h | 0}`).join(';');
    if (key !== this.dimPath.dataset['k']) {
      this.dimPath.dataset['k'] = key;
      const W = window.innerWidth, H = window.innerHeight;
      let d = `M0 0H${W}V${H}H0Z`;
      this.rings.innerHTML = '';
      for (const h of this.holes) {
        const r = Math.min(22, Math.min(h.w, h.h) / 2);
        const x0 = h.x, y0 = h.y, x1 = h.x + h.w, y1 = h.y + h.h;
        d += `M${x0 + r} ${y0}H${x1 - r}A${r} ${r} 0 0 1 ${x1} ${y0 + r}V${y1 - r}A${r} ${r} 0 0 1 ${x1 - r} ${y1}H${x0 + r}A${r} ${r} 0 0 1 ${x0} ${y1 - r}V${y0 + r}A${r} ${r} 0 0 1 ${x0 + r} ${y0}Z`;
        const ring = document.createElement('i');
        ring.style.cssText = `left:${h.x}px;top:${h.y}px;width:${h.w}px;height:${h.h}px;border-radius:${r}px`;
        this.rings.appendChild(ring);
      }
      this.dimPath.setAttribute('d', d);
    }
    this.layoutBubble();
  }

  private layoutBubble(): void {
    const s = this.step!;
    const text = s.text ?? '';
    const k = `${text}|${s.next ?? ''}|${s.skippable !== false}|${this.guide}`;
    if (k !== this.bubbleKey) {
      this.bubbleKey = k;
      this.bubble.innerHTML = text ? `<img class="tu-guide" src="${tokenUrl(this.guide)}" alt="">
        <div class="tu-txt"><p>${text}</p>
        <div class="tu-actions">${s.skippable !== false ? '<button class="tu-skip" data-tu="skip">Passer le tutoriel</button>' : '<span></span>'}${s.next ? `<button class="mr-btn yellow tu-next" data-tu="next">${s.next}</button>` : ''}</div></div>` : '';
      this.bubble.classList.toggle('on', !!text);
    }
    if (!text) return;
    const vh = window.innerHeight;
    const bh = this.bubble.offsetHeight;
    const u = union(this.holes);
    let place = s.place ?? 'auto';
    let top: number;
    if (place === 'auto') place = !u ? 'center' : u.y + u.h / 2 > vh * 0.5 ? 'top' : 'bottom';
    if (place === 'center') top = (vh - bh) * 0.42;
    else if (place === 'top') top = u ? u.y - bh - 18 : 70;
    else top = u ? u.y + u.h + 18 : vh - bh - 90;
    // Pas de place du côté choisi : de l'autre côté, sinon contre le bord.
    if (u && place === 'top' && top < 8) top = u.y + u.h + 18;
    if (u && place === 'bottom' && top + bh > vh - 8) top = u.y - bh - 18;
    top = Math.max(8, Math.min(vh - bh - 8, top));
    this.bubble.style.top = `${Math.round(top)}px`;
  }

  private animateHand(now: number): void {
    const h = this.step?.hand;
    if (!h) return;
    const t = (now - this.t0) / 1000;
    let x = 0, y = 0, press = 0, alpha = 1;
    if ('tap' in h) {
      const r = rectOf(h.tap);
      if (!r) { this.hand.style.opacity = '0'; return; }
      const k = (t % 1.1) / 1.1;
      press = k < 0.35 ? k / 0.35 : k < 0.55 ? 1 : Math.max(0, 1 - (k - 0.55) / 0.3);
      x = r.x + r.w * 0.5; y = r.y + r.h * 0.55;
    } else {
      const a = rectOf(h.from), b = rectOf(h.to);
      if (!a || !b) { this.hand.style.opacity = '0'; return; }
      const dur = h.hold ? 2.4 : 1.9;
      const k = (t % dur) / dur;
      const ax = a.x + a.w / 2, ay = a.y + a.h / 2, bx = b.x + b.w / 2, by = b.y + b.h / 2;
      const p0 = h.hold ? 0.32 : 0.16, p1 = p0 + 0.45;
      if (k < p0) { x = ax; y = ay; press = Math.min(1, k / 0.1); alpha = Math.min(1, k / 0.08); }
      else if (k < p1) { const m = ease((k - p0) / (p1 - p0)); x = ax + (bx - ax) * m; y = ay + (by - ay) * m; press = 1; }
      else { x = bx; y = by; press = Math.max(0, 1 - (k - p1) / 0.1); alpha = Math.max(0, 1 - (k - p1 - 0.1) / 0.2); }
    }
    this.hand.style.opacity = String(alpha);
    this.hand.style.transform = `translate(${x - 16}px, ${y - 4}px) scale(${1 - press * 0.14})`;
    this.hand.style.setProperty('--press', String(press));
  }
}

const ease = (k: number) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);

function union(rs: Rect[]): Rect | null {
  if (!rs.length) return null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const r of rs) { x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.x + r.w); y1 = Math.max(y1, r.y + r.h); }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

function pointOf(e: Event): { x: number; y: number } | null {
  if (typeof TouchEvent !== 'undefined' && e instanceof TouchEvent) {
    const t = e.touches[0] ?? e.changedTouches[0];
    return t ? { x: t.clientX, y: t.clientY } : null;
  }
  if (e instanceof MouseEvent) {
    // Clic clavier (Entrée) : pas de coordonnées, on le laisse passer s'il vise une cible autorisée.
    if (e.type === 'click' && e.detail === 0 && e.target instanceof Element) {
      const r = e.target.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
    return { x: e.clientX, y: e.clientY };
  }
  return null;
}
