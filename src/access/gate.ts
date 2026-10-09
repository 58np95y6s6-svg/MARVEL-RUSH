// Accès par lien secret (§3) : https://<site>/#k=<CLE>
// Ce n'est pas une vraie sécurité, seulement de la discrétion pour un usage privé.

import { get, set } from 'idb-keyval';

const STORE_KEY = 'mr-acces';
/** Clé brute, gardée sur l'appareil pour déchiffrer les illustrations (voir fiches.ts). */
export const RAW_KEY_STORE = 'mr-cle';
const EXPECTED = (import.meta.env.VITE_ACCESS_KEY_HASH ?? '').trim().toLowerCase();

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

let sessionKey: string | null = null;

/** Clé d'accès brute (lien secret), si connue sur cet appareil. */
export async function getAccessKey(): Promise<string | null> {
  if (sessionKey) return sessionKey;
  try { return ((await get(RAW_KEY_STORE)) as string | undefined) ?? null; } catch { return null; }
}

/** Lit les paramètres du fragment d'URL (#k=…&room=…). */
export function hashParams(): URLSearchParams {
  return new URLSearchParams(location.hash.replace(/^#/, ''));
}

/** Renvoie true si l'accès est autorisé. Retire la clé de la barre d'adresse. */
export async function checkAccess(): Promise<boolean> {
  // Clé non configurée (développement ou premier déploiement) : accès libre.
  if (!EXPECTED) {
    sessionKey = hashParams().get('k');
    return true;
  }

  // La clé reste volontairement dans l'adresse : sur iPhone, « Ajouter à l'écran d'accueil »
  // enregistre l'adresse courante, et l'app installée ne partage pas la mémoire de Safari.
  const key = hashParams().get('k');
  if (key && (await tryKey(key))) return true;
  try { return (await get(STORE_KEY)) === EXPECTED; } catch { return false; }
}

/** Vérifie une clé (ou un lien complet contenant #k=…) et la mémorise si elle est bonne. */
export async function tryKey(input: string): Promise<boolean> {
  const match = input.match(/[#&]k=([^&\s]+)/);
  const key = decodeURIComponent((match ? match[1] : input) ?? '').trim();
  if (!key || (await sha256(key)) !== EXPECTED) return false;
  sessionKey = key;
  try { await set(STORE_KEY, EXPECTED); await set(RAW_KEY_STORE, key); } catch { /* stockage indisponible : accès pour cette visite seulement */ }
  return true;
}

/** Vrai quand le jeu est lancé depuis l'icône de l'écran d'accueil (PWA installée). */
export function isInstalledApp(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || nav.standalone === true;
}

/**
 * Écran de déverrouillage, seulement dans l'app installée (il faut avoir eu le lien pour l'installer).
 * On y colle la clé ou le lien secret une fois ; elle est ensuite mémorisée sur l'appareil.
 */
export function renderUnlock(root: HTMLElement, onUnlocked: () => void): void {
  document.title = 'Code d\'accès';
  root.innerHTML = `<form style="position:fixed;inset:0;display:grid;place-items:center;background:#1d1733;color:#fff;font:16px system-ui,sans-serif;padding:24px">
    <div style="width:min(340px,100%);display:grid;gap:12px;text-align:center">
      <h1 style="font-size:22px;margin:0">Code d'accès</h1>
      <p style="margin:0;opacity:.75;font-size:14px">Colle le lien secret ou le code reçu. Il ne sera demandé qu'une fois sur cet appareil.</p>
      <input id="acces-cle" name="cle" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Lien ou code" style="font:inherit;padding:14px;border-radius:14px;border:2px solid #4b4370;background:#2a2347;color:#fff;user-select:text;-webkit-user-select:text">
      <button style="font:inherit;font-weight:700;padding:14px;border:0;border-radius:14px;background:#f6c64a;color:#1d1733">Valider</button>
      <p id="acces-erreur" style="margin:0;min-height:20px;color:#ff8a80;font-size:14px"></p>
    </div></form>`;
  const form = root.querySelector('form')!;
  const input = root.querySelector<HTMLInputElement>('#acces-cle')!;
  const error = root.querySelector<HTMLElement>('#acces-erreur')!;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (await tryKey(input.value)) onUnlocked();
    else error.textContent = 'Ce code ne correspond pas. Vérifie-le et réessaie.';
  });
}

/** Dans le navigateur, sans accès : explique comment installer l'app sur l'écran d'accueil. */
export function renderInstall(root: HTMLElement, onUnlocked: () => void): void {
  document.title = 'Installer l\'app';
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const android = /Android/.test(ua);
  const step = (n: number, html: string) =>
    `<li style="display:grid;grid-template-columns:34px 1fr;gap:12px;align-items:center;text-align:left"><span style="width:34px;height:34px;border-radius:50%;background:#f6c64a;color:#1d1733;display:grid;place-items:center;font-weight:800">${n}</span><span>${html}</span></li>`;
  const share = '<svg width="18" height="18" viewBox="0 0 24 24" style="vertical-align:-3px" fill="none" stroke="#7fb8ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3M8 7l4-4 4 4"/><path d="M5 11v9h14v-9"/></svg>';
  const iosSteps = [
    `Ouvre cette page dans <b>Safari</b>.`,
    `Touche le bouton <b>Partager</b> ${share} en bas de l'écran.`,
    `Choisis <b>« Sur l'écran d'accueil »</b>, puis <b>Ajouter</b>.`,
    `Lance l'app depuis sa nouvelle icône et entre ton <b>code d'accès</b>.`,
  ];
  const androidSteps = [
    `Ouvre cette page dans <b>Chrome</b>.`,
    `Touche le menu <b>⋮</b> en haut à droite.`,
    `Choisis <b>« Installer l'application »</b> (ou « Ajouter à l'écran d'accueil »).`,
    `Lance l'app depuis sa nouvelle icône et entre ton <b>code d'accès</b>.`,
  ];
  const steps = android ? androidSteps : iosSteps;
  root.innerHTML = `<main style="position:fixed;inset:0;overflow:hidden;display:grid;place-items:center;background:radial-gradient(circle at 50% 20%,#3a2f6b,#1d1733 70%);color:#fff;font:16px system-ui,sans-serif;padding:max(24px,env(safe-area-inset-top)) 20px max(24px,env(safe-area-inset-bottom))">
    <div style="width:min(380px,100%);display:grid;gap:18px;text-align:center">
      <img src="${import.meta.env.BASE_URL}icon.svg" alt="" width="84" height="84" style="justify-self:center;border-radius:20px;box-shadow:0 8px 24px rgba(0,0,0,.4)">
      <h1 style="margin:0;font-size:24px">Installe l'app pour jouer</h1>
      <p style="margin:0;opacity:.8;font-size:15px">Le jeu se lance depuis l'écran d'accueil de ton téléphone, comme une vraie application.</p>
      <ol style="list-style:none;margin:0;padding:16px;display:grid;gap:14px;background:rgba(255,255,255,.07);border-radius:18px">${steps.map((t, i) => step(i + 1, t)).join('')}</ol>
      ${!ios && !android ? '<p style="margin:0;opacity:.7;font-size:14px">Sur ordinateur, ouvre plutôt cette page sur ton téléphone.</p>' : ''}
      <button id="acces-install" hidden style="font:inherit;font-weight:800;padding:14px;border:0;border-radius:14px;background:#f6c64a;color:#1d1733">Installer maintenant</button>
      <button id="acces-code" style="font:inherit;background:none;border:0;color:#9fc3ff;text-decoration:underline;padding:6px">J'ai déjà un code</button>
    </div></main>`;
  // Android (Chrome) : bouton d'installation direct quand le navigateur le propose.
  const installBtn = root.querySelector<HTMLButtonElement>('#acces-install')!;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    const prompt = e as Event & { prompt: () => Promise<void> };
    installBtn.hidden = false;
    installBtn.onclick = () => void prompt.prompt();
  }, { once: true });
  root.querySelector<HTMLButtonElement>('#acces-code')!.onclick = () => renderUnlock(root, onUnlocked);
}

/** Page neutre affichée sans la clé : aucune mention du jeu. */
export function renderNotFound(root: HTMLElement): void {
  document.title = 'Page introuvable';
  root.innerHTML = `<main style="font:16px system-ui,sans-serif;color:#333;background:#fff;min-height:100vh;display:grid;place-items:center;margin:0">
    <div style="text-align:center"><h1 style="font-size:20px;font-weight:600">404</h1><p>Page introuvable.</p></div></main>`;
}
