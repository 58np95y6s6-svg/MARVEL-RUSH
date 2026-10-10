// Page de prévisualisation des maps (#dev/maps) : chaque map à taille de téléphone, en Solo et en Coop
// avec la grille et le chemin dessinés par-dessus, les animations d'ambiance et la
// transition vers l'arène du boss.

import { ARENAS, DC_ARENAS, MAPS, PIXAR_ARENAS, TF_ARENAS, arenaForBoss, getMap } from './index';
import type { AmbientAnim, MapDefX } from './kit';
import { type AnyLayout, type LayoutMode, type PathShape, boardsOf, lanePoint, layoutFor } from './layout';

const PHONE_W = 390;
const K = PHONE_W / 1000;

interface View { mode: LayoutMode; overlay: boolean; enemies: boolean; ui: boolean; focus: string | null }

const urls: string[] = [];
function svgUrl(svg: string): string {
  const u = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  urls.push(u);
  return u;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, css = '', html = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (css) e.style.cssText = css;
  if (html) e.innerHTML = html;
  return e;
}

/** Dessine une map (couches + animations) dans un conteneur à taille de téléphone. */
function mapStage(map: MapDefX, mode: LayoutMode, shape: PathShape): { node: HTMLElement; anims: { a: AmbientAnim; img: HTMLImageElement }[] } {
  const stage = el('div', `position:absolute;inset:0;transform-origin:0 0;transform:scale(${K});width:1000px;height:1600px`);
  for (const layer of map.layers) {
    if (layer.id === 'details') continue; // remplacé par les sprites animés
    const img = el('img', 'position:absolute;left:0;top:0;width:1000px;height:1600px;pointer-events:none');
    img.src = svgUrl(layer.svg(mode, shape));
    img.alt = '';
    stage.appendChild(img);
  }
  const anims = map.anims(mode, shape).map((a) => {
    const img = el('img', `position:absolute;left:${a.box.x}px;top:${a.box.y}px;width:${a.box.w}px;height:${a.box.h}px;pointer-events:none;will-change:transform`);
    img.src = svgUrl(a.svg);
    img.alt = '';
    stage.appendChild(img);
    return { a, img };
  });
  return { node: stage, anims };
}

function overlaySvg(L: AnyLayout, v: View): string {
  const { boards, lanes } = boardsOf(L);
  let s = '';
  if (v.overlay) {
    for (const b of boards) for (const [i, c] of b.cells.entries())
      s += `<rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" rx="${b.cell * 0.12}" fill="none" stroke="#3c8bf0" stroke-width="3" opacity=".8"/><text x="${c.x + 8}" y="${c.y + 24}" font-size="${b.cell * 0.15}" fill="#3c8bf0" font-family="system-ui">${i}</text>`;
    for (const l of lanes)
      s += `<polyline points="${l.points.map((p) => `${p.x},${p.y}`).join(' ')}" fill="none" stroke="#e8413b" stroke-width="4" stroke-dasharray="14 10"/>` +
        Array.from({ length: l.cells + 1 }, (_, d) => { const p = lanePoint(l, d); return `<circle cx="${p.x}" cy="${p.y}" r="6" fill="#e8413b"/>`; }).join('');
  }
  if (v.ui) {
    const hud = L.hud;
    s += `<rect x="${hud.x}" y="${hud.y}" width="${hud.w}" height="${hud.h}" fill="#1d1733" opacity=".45"/><text x="500" y="${hud.h / 2 + 12}" text-anchor="middle" font-size="36" fill="#fff" font-family="system-ui">HUD</text>`;
    const c = L.controls;
    for (const r of c.upgrades) s += `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="22" fill="#3c8bf0" opacity=".55" stroke="#1d1733" stroke-width="5"/>`;
    s += `<rect x="${c.summon.x}" y="${c.summon.y}" width="${c.summon.w}" height="${c.summon.h}" rx="34" fill="#f6c64a" opacity=".8" stroke="#1d1733" stroke-width="6"/><text x="500" y="${c.summon.y + c.summon.h / 2 + 14}" text-anchor="middle" font-size="40" fill="#1d1733" font-family="system-ui" font-weight="800">INVOQUER</text>`;
    s += `<rect x="${c.mana.x}" y="${c.mana.y}" width="${c.mana.w}" height="${c.mana.h}" rx="30" fill="#1d1733" opacity=".55"/><text x="${c.mana.x + c.mana.w / 2}" y="${c.mana.y + c.mana.h / 2 + 12}" text-anchor="middle" font-size="34" fill="#9be7ff" font-family="system-ui">mana</text>`;
    if (L.mode === 'coop') {
      const r = L.banner;
      s += `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="${r.h / 2}" fill="#1d1733" opacity=".55"/><text x="${r.x + r.w / 2}" y="${r.y + r.h / 2 + 10}" text-anchor="middle" font-size="28" fill="#fff" font-family="system-ui">1 vague avant le boss</text>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1600" width="1000" height="1600" style="position:absolute;left:0;top:0;pointer-events:none">${s}<g class="foes"></g></svg>`;
}

function phone(map: MapDefX, v: View, shape: PathShape, arena: MapDefX | null): { node: HTMLElement; tick: (t: number) => void } {
  const box = el('div', `position:relative;width:${PHONE_W}px;height:${1600 * K}px;overflow:hidden;border-radius:18px;background:${map.palette.bg ?? '#1d1733'};box-shadow:0 0 0 4px #1d1733,0 8px 0 #000`);
  const base = mapStage(map, v.mode, shape);
  box.appendChild(base.node);
  let boss: ReturnType<typeof mapStage> | null = null;
  if (arena) {
    boss = mapStage(arena, v.mode, shape);
    boss.node.style.opacity = '0';
    boss.node.style.transition = 'opacity 1s';
    box.appendChild(boss.node);
  }
  const L = layoutFor(v.mode, shape);
  const ov = el('div', `position:absolute;inset:0;transform-origin:0 0;transform:scale(${K});width:1000px;height:1600px;pointer-events:none`);
  ov.innerHTML = overlaySvg(L, v);
  box.appendChild(ov);
  const foes = ov.querySelector('.foes');
  const lanes = boardsOf(L).lanes;
  const all = [...base.anims, ...(boss?.anims ?? [])];
  const tick = (t: number) => {
    for (const { a, img } of all) animate(a, img, t);
    if (boss) boss.node.style.opacity = Math.floor(t / 4) % 2 === 1 ? '1' : '0';
    if (foes && v.enemies) {
      let s = '';
      for (const l of lanes) for (let k = 0; k < 6; k++) {
        const d = ((t * 1.2 + k * 2.3) % l.cells);
        const p = lanePoint(l, d), r = l.cell * 0.2;
        s += `<g transform="translate(${p.x} ${p.y})"><ellipse cx="0" cy="${r * 0.8}" rx="${r}" ry="${r * 0.3}" fill="#1d1733" opacity=".3"/><circle r="${r}" fill="${k % 3 ? '#7ccf5a' : '#c0263a'}" stroke="#1d1733" stroke-width="${r * 0.22}"/><circle cx="${-r * 0.35}" cy="${-r * 0.35}" r="${r * 0.25}" fill="#fff" opacity=".6"/></g>`;
      }
      foes.innerHTML = s;
    }
  };
  return { node: box, tick };
}

/** Applique une animation d'ambiance (même règles que celles que le rendu doit suivre). */
export function animate(a: AmbientAnim, img: HTMLElement, t: number): void {
  const ph = ((t / a.period + (a.phase ?? 0)) % 1 + 1) % 1;
  const sin = Math.sin(ph * Math.PI * 2);
  const ox = (a.ox ?? a.box.x + a.box.w / 2) - a.box.x, oy = (a.oy ?? a.box.y + a.box.h / 2) - a.box.y;
  img.style.transformOrigin = `${ox}px ${oy}px`;
  switch (a.kind) {
    case 'drift': img.style.transform = `translate(${(a.dx ?? 0) * ph}px,${(a.dy ?? 0) * ph}px)`; break;
    case 'bob': img.style.transform = `translateY(${(a.amp ?? 6) * sin}px)`; break;
    case 'sway': img.style.transform = `rotate(${(a.amp ?? 8) * sin}deg)`; break;
    case 'spin': img.style.transform = `rotate(${ph * 360}deg)`; break;
    case 'pulse': img.style.transform = `scale(${1 + (a.amp ?? 0.1) * sin})`; break;
    case 'blink': img.style.opacity = String((a.min ?? 0.2) + (1 - (a.min ?? 0.2)) * (0.5 + 0.5 * sin)); break;
  }
}

/** Arène montée pour la transition : une arène de l'extension pour une map DC, Transformers ou Pixar, sinon Marvel ou Disney. */
function previewArena(map: MapDefX): MapDefX | null {
  const hash = location.hash.match(/#dev\/maps\/[\w-]+\/(?:solo|coop)\/([\w-]+)/);
  if (hash?.[1]) return getMap(hash[1]);
  const ext = map.universe === 'dc' ? DC_ARENAS : map.universe === 'transformers' ? TF_ARENAS : map.universe === 'pixar' ? PIXAR_ARENAS : null;
  const pool = ext ?? ARENAS.filter((a) => !DC_ARENAS.includes(a) && !TF_ARENAS.includes(a) && !PIXAR_ARENAS.includes(a));
  const list = MAPS.filter((m) => m.universe === map.universe || (!ext && (m.universe === 'marvel' || m.universe === 'disney')));
  return pool[Math.max(0, list.indexOf(map)) % pool.length] ?? arenaForBoss('thanos');
}

export function mountMapPreview(root: HTMLElement): () => void {
  const v: View = { mode: 'solo', overlay: false, enemies: true, ui: false, focus: null };
  try { const s = JSON.parse(localStorage.getItem('dev-maps') ?? '{}') as Partial<View>; Object.assign(v, s); } catch { /* stockage indisponible */ }
  const hash = location.hash.match(/#dev\/maps\/?([\w-]+)?(?:\/(solo|coop))?/);
  if (hash?.[1]) v.focus = hash[1];
  if (hash?.[2]) v.mode = hash[2] as LayoutMode;

  root.innerHTML = '';
  const page = el('div', 'min-height:100vh;background:#e2e2e8;color:#1d1733;font-family:Nunito,system-ui,sans-serif;padding:16px;box-sizing:border-box');
  root.appendChild(page);
  let ticks: ((t: number) => void)[] = [];
  let raf = 0;
  const t0 = performance.now();
  const loop = () => { const t = (performance.now() - t0) / 1000; for (const f of ticks) f(t); raf = requestAnimationFrame(loop); };

  const render = () => {
    for (const u of urls.splice(0)) URL.revokeObjectURL(u);
    try { localStorage.setItem('dev-maps', JSON.stringify({ mode: v.mode, overlay: v.overlay, enemies: v.enemies, ui: v.ui })); } catch { /* ignoré */ }
    ticks = [];
    page.innerHTML = '';
    const bar = el('div', 'display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:16px');
    bar.appendChild(el('h1', 'margin:0 12px 0 0;font-family:"Lilita One",system-ui;font-weight:400;font-size:28px;color:#f6c64a;text-shadow:2px 2px 0 #1d1733,-2px -2px 0 #1d1733,2px -2px 0 #1d1733,-2px 2px 0 #1d1733', 'Maps'));
    const btn = (label: string, on: boolean, f: () => void) => {
      const b = el('button', `font:inherit;font-weight:800;border:0;border-radius:999px;padding:8px 14px;cursor:pointer;background:${on ? '#1d1733' : '#fff'};color:${on ? '#f6c64a' : '#1d1733'};box-shadow:0 3px 0 #1d1733`, label);
      b.onclick = () => { f(); render(); };
      bar.appendChild(b);
    };
    for (const m of ['solo', 'coop'] as LayoutMode[]) btn(m === 'solo' ? 'Solo' : 'Coop', v.mode === m, () => { v.mode = m; });
    btn('Grille et chemin', v.overlay, () => { v.overlay = !v.overlay; });
    btn('Ennemis', v.enemies, () => { v.enemies = !v.enemies; });
    btn('Interface', v.ui, () => { v.ui = !v.ui; });
    if (v.focus) btn('← Toutes', false, () => { v.focus = null; });
    page.appendChild(bar);

    const grid = el('div', 'display:flex;flex-wrap:wrap;gap:28px 22px');
    page.appendChild(grid);
    const list: MapDefX[] = v.focus ? [getMap(v.focus)] : [...MAPS, ...ARENAS.filter((a) => !MAPS.includes(a))];
    for (const map of list) {
      const card = el('div', 'display:flex;flex-direction:column;gap:8px;width:' + PHONE_W + 'px');
      const arena = !map.boss && v.focus ? previewArena(map) : null;
      const ph = phone(map, v, map.shape, arena ?? null);
      ticks.push(ph.tick);
      const title = el('div', 'display:flex;justify-content:space-between;align-items:baseline;gap:8px');
      const h = el('a', 'font-family:"Lilita One",system-ui;font-size:20px;color:#1d1733;text-decoration:none', map.name);
      h.href = `#dev/maps/${map.id}/${v.mode}`;
      h.onclick = (e) => { e.preventDefault(); v.focus = map.id; history.replaceState(null, '', h.href); render(); };
      title.appendChild(h);
      title.appendChild(el('span', 'font-size:12px;color:#5e5976', `${map.universe} · ${map.shape} · ${map.pathLength} cases`));
      card.appendChild(title);
      card.appendChild(ph.node);
      card.appendChild(el('div', 'font-size:12px;line-height:1.4;color:#5e5976',
        `<b>Chemin</b> ${map.pathMaterial}<br><b>Ambiance</b> ${[...new Set(map.ambience)].join(' · ')}<br><b>Son</b> ${map.sound}` +
        (map.modifiers ? `<br><b>Modificateur</b> ${Object.entries(map.modifiers).map(([k, x]) => `${k} ${x > 0 ? '+' : ''}${Math.abs(x) >= 1 ? x : `${Math.round(x * 100)} %`}`).join(', ')}` : '') +
        (map.bossFx ? `<br><b>Boss</b> ${map.bossFx.description}` : '') +
        (arena ? `<br><b>Transition</b> vers ${arena.name} toutes les 4 s` : '')));
      grid.appendChild(card);
    }
  };
  render();
  raf = requestAnimationFrame(loop);
  return () => { cancelAnimationFrame(raf); for (const u of urls.splice(0)) URL.revokeObjectURL(u); root.innerHTML = ''; };
}
