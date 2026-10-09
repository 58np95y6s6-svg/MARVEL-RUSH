// Chiffre les illustrations de fiches avec la clé d'accès secrète.
// Usage : node scripts/encrypt-assets.mjs <clé> <dossier-des-originaux>
// Les originaux (fichiers <id>.webp) ne doivent JAMAIS être commités dans ce dépôt public :
// ils vivent dans le dépôt privé D-p-t-photo-marvel. Seules les copies chiffrées vont dans public/fiches/.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { webcrypto as crypto } from 'node:crypto';

const [key, dir] = process.argv.slice(2);
if (!key || !dir) { console.error('Usage : node scripts/encrypt-assets.mjs <clé> <dossier>'); process.exit(1); }

const SALT = 'marvel-rush-fiches-v1';
const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), 'PBKDF2', false, ['deriveKey']);
const aes = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt: new TextEncoder().encode(SALT), iterations: 150000, hash: 'SHA-256' },
  base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);

const out = 'public/fiches';
mkdirSync(out, { recursive: true });
const ids = [];
for (const f of readdirSync(dir).filter((f) => extname(f) === '.webp').sort()) {
  const id = basename(f, '.webp');
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aes, readFileSync(join(dir, f))));
  const blob = new Uint8Array(iv.length + data.length);
  blob.set(iv); blob.set(data, iv.length);
  writeFileSync(join(out, `${id}.bin`), blob);
  ids.push(id);
}
writeFileSync(join(out, 'index.json'), JSON.stringify({ version: 1, salt: SALT, ids }, null, 2) + '\n');
console.log(`${ids.length} illustrations chiffrées : ${ids.join(', ')}`);
