// Mises à jour de l'app (PWA) :
// 1. dès qu'une nouvelle version est en ligne, une fenêtre propose « Mettre à jour » ;
// 2. après la mise à jour, « Quoi de neuf » liste les nouveautés, une seule fois par version.

import { registerSW } from 'virtual:pwa-register';
import { CHANGELOG, LATEST, type ReleaseNote } from './changelog';

const SEEN_KEY = 'mr-version-vue';
const CHECK_EVERY_MS = 20 * 60 * 1000;

const STYLE = `
.mr-sheet-bg{position:fixed;inset:0;z-index:9999;background:rgba(14,10,31,.6);display:flex;align-items:flex-end;justify-content:center;animation:mr-fade .2s ease-out}
.mr-sheet{width:min(440px,100%);max-height:85dvh;display:grid;grid-template-rows:auto minmax(0,1fr) auto;gap:14px;background:#2a2347;color:#fff;font:16px 'Nunito',system-ui,sans-serif;border:3px solid #4b4370;border-bottom:0;border-radius:26px 26px 0 0;padding:22px 20px calc(18px + env(safe-area-inset-bottom));box-shadow:0 -10px 40px rgba(0,0,0,.45);animation:mr-up .25s cubic-bezier(.2,.9,.3,1.2)}
.mr-sheet h2{margin:0;font:400 24px 'Lilita One','Arial Rounded MT Bold',system-ui,sans-serif;color:#f6c64a;text-shadow:0 2px 0 #1d1733}
.mr-sheet p{margin:4px 0 0;opacity:.8;font-size:14px}
.mr-sheet .mr-list{overflow-y:auto;overscroll-behavior:contain;margin:0;padding:0 2px;list-style:none;display:grid;gap:10px}
.mr-sheet .mr-list li{display:grid;grid-template-columns:22px 1fr;gap:10px;align-items:start;line-height:1.35}
.mr-sheet .mr-list li::before{content:'★';color:#f6c64a;font-size:18px;line-height:1.2}
.mr-sheet .mr-ver{font-size:13px;opacity:.65;margin:8px 0 2px;font-weight:700;text-transform:uppercase;letter-spacing:.06em}
.mr-actions{display:grid;gap:8px}
.mr-btn{font:400 19px 'Lilita One','Arial Rounded MT Bold',system-ui,sans-serif;letter-spacing:.02em;color:#fff;border:3px solid #1d1733;border-radius:16px;padding:13px;background:linear-gradient(#ffd45a,#f2a93b);text-shadow:0 2px 0 #1d1733;box-shadow:0 5px 0 #1d1733;cursor:pointer}
.mr-btn:active{transform:translateY(3px);box-shadow:0 2px 0 #1d1733}
.mr-btn.mr-secondary{background:linear-gradient(#5d9cff,#3c6fe0)}
.mr-link{font:inherit;font-size:14px;background:none;border:0;color:#b9b2d8;padding:6px;cursor:pointer}
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
    <div><h2>Nouvelle version disponible</h2><p>Une mise à jour de Marvel Rush est prête. Elle s'installe en quelques secondes ; ta progression est conservée.</p></div>
    <div></div>
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
      showUpdateAvailable(() => void updateSW(true));
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
