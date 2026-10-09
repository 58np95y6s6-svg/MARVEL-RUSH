// Illustrations des fiches personnages, publiées chiffrées dans public/fiches/ (dépôt public).
// Elles se déchiffrent sur l'appareil avec la clé du lien secret. Sans la clé, aucune illustration :
// la fiche affiche alors le personnage chibi.

import { getAccessKey } from './gate';

const SALT = 'marvel-rush-fiches-v1';
const cache = new Map<string, Promise<string | null>>();
let aesKey: Promise<CryptoKey> | null = null;
let index: Promise<string[]> | null = null;

export async function deriveFicheKey(key: string, salt = SALT): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 150000, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['decrypt', 'encrypt']);
}

/** Format : 12 octets d'IV puis le contenu chiffré AES-GCM. */
export async function decryptFiche(blob: ArrayBuffer, key: CryptoKey): Promise<ArrayBuffer> {
  const bytes = new Uint8Array(blob);
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12) }, key, bytes.slice(12));
}

const url = (file: string) => `${import.meta.env.BASE_URL}fiches/${file}`;

/** Ids des personnages qui ont une illustration (ex. 'ironman', 'thanos'). */
export function ficheIds(): Promise<string[]> {
  index ??= fetch(url('index.json')).then((r) => (r.ok ? r.json() : { ids: [] })).then((j: { ids?: string[] }) => j.ids ?? []).catch(() => []);
  return index;
}

/** URL d'objet (blob:) de l'illustration déchiffrée, ou null si absente ou clé inconnue. */
export function ficheUrl(id: string): Promise<string | null> {
  let p = cache.get(id);
  if (!p) {
    p = (async () => {
      if (!(await ficheIds()).includes(id)) return null;
      const key = await getAccessKey();
      if (!key) return null;
      aesKey ??= deriveFicheKey(key);
      const res = await fetch(url(`${id}.bin`));
      if (!res.ok) return null;
      const plain = await decryptFiche(await res.arrayBuffer(), await aesKey);
      return URL.createObjectURL(new Blob([plain], { type: 'image/webp' }));
    })().catch(() => null);
    cache.set(id, p);
  }
  return p;
}
