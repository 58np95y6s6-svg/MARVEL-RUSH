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

/** Page neutre affichée sans la clé : aucune mention du jeu. */
export function renderNotFound(root: HTMLElement): void {
  document.title = 'Page introuvable';
  root.innerHTML = `<main style="font:16px system-ui,sans-serif;color:#333;background:#fff;min-height:100vh;display:grid;place-items:center;margin:0">
    <div style="text-align:center"><h1 style="font-size:20px;font-weight:600">404</h1><p>Page introuvable.</p></div></main>`;
}
