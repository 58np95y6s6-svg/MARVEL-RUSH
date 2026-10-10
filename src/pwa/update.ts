// Mises à jour de l'app (PWA) :
// 1. dès qu'une nouvelle version est en ligne, une fenêtre propose « Mettre à jour » ;
// 2. après la mise à jour, « Quoi de neuf » liste les nouveautés, une seule fois par version.

import { registerSW } from 'virtual:pwa-register';
import { CHANGELOG, LATEST, type ReleaseNote } from './changelog';

const SEEN_KEY = 'mr-version-vue';
const CHECK_EVERY_MS = 20 * 60 * 1000;

// Jamais de fenêtre de mise à jour en pleine partie : l'écran de combat émet
// window 'mr-game' { running: boolean } au début et à la fin d'une partie.
let gameRunning = false;
let pendingUpdate: (() => void) | null = null;
window.addEventListener('mr-game', (e) => {
  gameRunning = !!(e as CustomEvent<{ running?: boolean }>).detail?.running;
  if (!gameRunning && pendingUpdate) { const show = pendingUpdate; pendingUpdate = null; show(); }
});

// Même direction artistique que le reste de l'app (src/ui/rr.css) : cadre ardoise-bleu, titre blanc cerné,
// contenu bleu très clair, bouton orange. Couleurs en dur : la feuille peut s'afficher avant le chargement de l'app.
const STYLE = `
.mr-sheet-bg{position:fixed;inset:0;z-index:9999;background:rgba(8,12,26,.72);display:flex;align-items:flex-end;justify-content:center;animation:mr-fade .2s ease-out}
.mr-sheet{width:min(440px,calc(100% - 8px));max-height:85dvh;display:grid;grid-template-rows:auto minmax(0,1fr) auto;gap:10px;background:#4b6a9b;color:#fff;font:16px 'Nunito',system-ui,sans-serif;border:4px solid #1d1733;border-bottom:0;border-radius:24px 24px 0 0;padding:16px 12px calc(14px + env(safe-area-inset-bottom));box-shadow:0 -6px 0 rgba(0,0,0,.3),inset 0 3px 0 rgba(255,255,255,.22);animation:mr-up .25s cubic-bezier(.2,.9,.3,1.2)}
.mr-sheet h2{margin:0;text-align:center;font:400 27px 'Lilita One','Arial Rounded MT Bold',system-ui,sans-serif;color:#fff;paint-order:stroke fill;-webkit-text-stroke:6px #1d1733;filter:drop-shadow(0 2px 0 #1d1733)}
.mr-sheet h2 + p{margin:4px 0 0;text-align:center;font:400 15px 'Lilita One','Arial Rounded MT Bold',system-ui,sans-serif;color:#ffd23f;paint-order:stroke fill;-webkit-text-stroke:3.5px #1d1733}
.mr-sheet .mr-list,.mr-sheet .mr-note{overflow-y:auto;overscroll-behavior:contain;margin:0;padding:10px 10px 12px;list-style:none;display:grid;align-content:start;gap:8px;background:#dfe8f0;color:#2b3a5c;border:3px solid #2c4268;border-radius:16px;box-shadow:inset 0 3px 0 rgba(0,0,0,.08)}
.mr-sheet .mr-note{display:block;font-weight:700;font-size:14.5px;line-height:1.4;color:#3a4a6c}
.mr-sheet .mr-list li{display:grid;grid-template-columns:22px 1fr;gap:8px;align-items:start;line-height:1.35;font-weight:700;font-size:14.5px;padding:7px 9px;border-radius:12px;background:linear-gradient(#dbe4ee 0 50%,#ccd7e4 50%);border:2.5px solid #8b9cb9}
.mr-sheet .mr-list li::before{content:'★';color:#f59a1f;font-size:18px;line-height:1.1;-webkit-text-stroke:1.5px #1d1733}
.mr-sheet .mr-ver{font:400 15px 'Lilita One','Arial Rounded MT Bold',system-ui,sans-serif;color:#f08a1a;margin:6px 2px 0}
.mr-actions{display:grid;gap:6px}
.mr-sheet .mr-btn{font:400 22px 'Lilita One','Arial Rounded MT Bold',system-ui,sans-serif;color:#fff;border:3px solid #1d1733;border-radius:14px;padding:11px 13px 13px;background:linear-gradient(#ffc84a,#f59a1f);paint-order:stroke fill;-webkit-text-stroke:5px #1d1733;box-shadow:0 5px 0 #a8461b,inset 0 3px 0 rgba(255,255,255,.35);cursor:pointer}
.mr-sheet .mr-btn:active{transform:translateY(3px);box-shadow:0 2px 0 #a8461b}
.mr-sheet .mr-btn:disabled{background:linear-gradient(#d3dae4,#a2adbd);box-shadow:0 5px 0 #626d80}
.mr-sheet .mr-link{font:400 16px 'Lilita One','Arial Rounded MT Bold',system-ui,sans-serif;background:none;border:0;color:#fff;padding:6px;cursor:pointer;paint-order:stroke fill;-webkit-text-stroke:3.5px #1d1733}
@keyframes mr-fade{from{opacity:0}}
@keyframes mr-up{from{transform:translateY(100%)}}
`;

function ensureStyle(): void {
  if (document.getElementById('mr-update-style')) return;
  const el = document.createElement('style');
  el.id = 'mr-update-style';
  el.textContent = STYLE;
  document.head.append(el);
}

function sheet(html: string): { bg: HTMLElement; close: () => void } {
  ensureStyle();
  document.querySelector('.mr-sheet-bg')?.remove();
  const bg = document.createElement('div');
  bg.className = 'mr-sheet-bg';
  bg.innerHTML = `<div class="mr-sheet" role="dialog" aria-modal="true">${html}</div>`;
  document.body.append(bg);
  return { bg, close: () => bg.remove() };
}

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function readSeen(): string | null {
  try { return localStorage.getItem(SEEN_KEY); } catch { return null; }
}
function markSeen(): void {
  try { localStorage.setItem(SEEN_KEY, LATEST.id); } catch { /* stockage indisponible */ }
}

/** Notes publiées depuis la dernière version vue (au plus 3 versions). */
function unseenNotes(seen: string): ReleaseNote[] {
  return CHANGELOG.filter((n) => n.id > seen).slice(0, 3);
}

function showWhatsNew(notes: ReleaseNote[]): void {
  const body = notes.map((n, i) =>
    `${notes.length > 1 || i > 0 ? `<p class="mr-ver">${esc(n.title)} · ${esc(n.date)}</p>` : ''}${n.items.map((t) => `<li>${esc(t)}</li>`).join('')}`).join('');
  const { bg, close } = sheet(`
    <div><h2>Quoi de neuf ?</h2><p>${notes.length === 1 ? `${esc(LATEST.title)} · ${esc(LATEST.date)}` : 'Les nouveautés depuis ta dernière visite'}</p></div>
    <ul class="mr-list">${body}</ul>
    <div class="mr-actions"><button class="mr-btn" data-act="ok">C'est parti !</button></div>`);
  bg.querySelector<HTMLButtonElement>('[data-act="ok"]')!.onclick = () => { markSeen(); close(); };
}

function showUpdateAvailable(apply: () => void): void {
  const { bg, close } = sheet(`
    <div><h2>Nouvelle version</h2><p>Mise à jour disponible</p></div>
    <p class="mr-note">Une mise à jour de Marvel Rush est prête. Elle s'installe en quelques secondes ; ta progression est conservée.</p>
    <div class="mr-actions">
      <button class="mr-btn" data-act="update">Mettre à jour</button>
      <button class="mr-link" data-act="later">Plus tard</button>
    </div>`);
  const btn = bg.querySelector<HTMLButtonElement>('[data-act="update"]')!;
  btn.onclick = () => { btn.disabled = true; btn.textContent = 'Mise à jour…'; apply(); };
  bg.querySelector<HTMLButtonElement>('[data-act="later"]')!.onclick = close;
}

/** À appeler une fois l'accès vérifié. */
export function setupUpdates(): void {
  // Demande un stockage permanent : Android (Chrome) ne pourra plus effacer seul les données du jeu
  // quand le téléphone manque de place. Accordé d'office aux apps installées sur la plupart des appareils.
  void navigator.storage?.persist?.().catch(() => false);

  // « Quoi de neuf » après une mise à jour (pas au tout premier lancement).
  const seen = readSeen();
  if (seen === null) markSeen();
  else if (seen < LATEST.id) {
    const notes = unseenNotes(seen);
    if (notes.length) setTimeout(() => showWhatsNew(notes), 600);
    else markSeen();
  }

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      const show = () => showUpdateAvailable(() => void updateSW(true));
      if (gameRunning) pendingUpdate = show;
      else show();
    },
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      // Les apps installées restent ouvertes longtemps : on vérifie régulièrement et au retour dans l'app.
      const check = () => { if (navigator.onLine) void registration.update().catch(() => undefined); };
      setInterval(check, CHECK_EVERY_MS);
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
    },
  });
}
