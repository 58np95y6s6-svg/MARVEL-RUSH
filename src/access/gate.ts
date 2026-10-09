// Accès par lien secret (§3) : https://<site>/#k=<CLE>
// Ce n'est pas une vraie sécurité, seulement de la discrétion pour un usage privé.

import { get, set } from 'idb-keyval';

const STORE_KEY = 'mr-acces';
const EXPECTED = (import.meta.env.VITE_ACCESS_KEY_HASH ?? '').trim().toLowerCase();

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Lit les paramètres du fragment d'URL (#k=…&room=…). */
export function hashParams(): URLSearchParams {
  return new URLSearchParams(location.hash.replace(/^#/, ''));
}

/** Renvoie true si l'accès est autorisé. Retire la clé de la barre d'adresse. */
export async function checkAccess(): Promise<boolean> {
  // Clé non configurée (développement ou premier déploiement) : accès libre.
  if (!EXPECTED) return true;

  const params = hashParams();
  const key = params.get('k');
  if (key) {
    params.delete('k');
    const rest = params.toString();
    history.replaceState(null, '', location.pathname + location.search + (rest ? `#${rest}` : ''));
    if ((await sha256(key)) === EXPECTED) {
      try { await set(STORE_KEY, EXPECTED); } catch { /* stockage indisponible : accès pour cette visite seulement */ }
      return true;
    }
  }
  try { return (await get(STORE_KEY)) === EXPECTED; } catch { return false; }
}

/** Page neutre affichée sans la clé : aucune mention du jeu. */
export function renderNotFound(root: HTMLElement): void {
  document.title = 'Page introuvable';
  root.innerHTML = `<main style="font:16px system-ui,sans-serif;color:#333;background:#fff;min-height:100vh;display:grid;place-items:center;margin:0">
    <div style="text-align:center"><h1 style="font-size:20px;font-weight:600">404</h1><p>Page introuvable.</p></div></main>`;
}
