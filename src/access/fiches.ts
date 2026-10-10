// Images chiffrées publiées dans le dépôt public : illustrations des fiches personnages (public/fiches/) et
// images des unités Rush Royale copiées par les héros (public/rr/). Elles se déchiffrent sur l'appareil avec la
// clé du lien secret. Sans la clé (ou sans image), rien : la fiche affiche le chibi, l'unité Rush Royale un
// cadre neutre avec ses initiales.

import { getAccessKey } from './gate';

const SALT = 'marvel-rush-fiches-v1';
let aesKey: Promise<CryptoKey> | null = null;

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

interface EncryptedIndex { ids: string[]; types: Record<string, string> }

/** Dossier d'images chiffrées (index.json : { ids, types? }, puis <id>.bin). */
function encryptedFolder(folder: string) {
  const cache = new Map<string, Promise<string | null>>();
  let index: Promise<EncryptedIndex> | null = null;
  const url = (file: string) => `${import.meta.env.BASE_URL}${folder}/${file}`;
  const ids = (): Promise<EncryptedIndex> => {
    index ??= fetch(url('index.json'))
      .then((r) => (r.ok ? r.json() : {}))
      .then((j: { ids?: string[]; types?: Record<string, string> }) => ({ ids: j.ids ?? [], types: j.types ?? {} }))
      .catch(() => ({ ids: [], types: {} }));
    return index;
  };
  const get = (id: string): Promise<string | null> => {
    let p = cache.get(id);
    if (!p) {
      p = (async () => {
        const idx = await ids();
        if (!idx.ids.includes(id)) return null;
        const key = await getAccessKey();
        if (!key) return null;
        aesKey ??= deriveFicheKey(key);
        const res = await fetch(url(`${id}.bin`));
        if (!res.ok) return null;
        const plain = await decryptFiche(await res.arrayBuffer(), await aesKey);
        return URL.createObjectURL(new Blob([plain], { type: idx.types[id] ?? 'image/webp' }));
      })().catch(() => null);
      cache.set(id, p);
    }
    return p;
  };
  return { ids: () => ids().then((i) => i.ids), get };
}

const FICHES = encryptedFolder('fiches');
const RR = encryptedFolder('rr');

/** Ids des personnages qui ont une illustration (ex. 'ironman', 'thanos'). */
export function ficheIds(): Promise<string[]> {
  return FICHES.ids();
}

/** URL d'objet (blob:) de l'illustration déchiffrée, ou null si absente ou clé inconnue. */
export function ficheUrl(id: string): Promise<string | null> {
  return FICHES.get(id);
}

/** URL d'objet (blob:) de l'image de l'unité Rush Royale `id` (ex. 'tesla'), ou null (cadre neutre). */
export function rrUrl(id: string): Promise<string | null> {
  return RR.get(id);
}
