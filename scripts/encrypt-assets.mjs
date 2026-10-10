// Chiffre des images avec la clé d'accès secrète.
// Usage :
//   node scripts/encrypt-assets.mjs <clé> <dossier>                    illustrations des fiches → public/fiches/
//   node scripts/encrypt-assets.mjs <clé> <dossier> public/rr          unités Rush Royale → public/rr/
// Le dossier contient des fichiers <id>.webp, <id>.png ou <id>.jpg (ids des fiches : ironman, thanos… ; ids des
// unités Rush Royale : tesla, blade-dancer… — liste dans docs/illustrations-a-fournir.md, « Unités Rush Royale »).
// Les originaux ne doivent JAMAIS être commités dans ce dépôt public : ils vivent dans le dépôt privé
// D-p-t-photo-marvel (recadrees/ pour les fiches, rr/ pour les unités Rush Royale). Seules les copies chiffrées
// vont dans public/. L'index (index.json) liste les ids et le type de chaque image ; il est réécrit à chaque fois
// avec le contenu du dossier : donner le dossier complet.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { webcrypto as crypto } from 'node:crypto';

const [key, dir, outArg] = process.argv.slice(2);
if (!key || !dir) { console.error('Usage : node scripts/encrypt-assets.mjs <clé> <dossier> [public/fiches|public/rr]'); process.exit(1); }

const SALT = 'marvel-rush-fiches-v1';
const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), 'PBKDF2', false, ['deriveKey']);
const aes = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt: new TextEncoder().encode(SALT), iterations: 150000, hash: 'SHA-256' },
  base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);

const out = outArg ?? 'public/fiches';
const TYPES = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };
mkdirSync(out, { recursive: true });
const ids = [];
const types = {};
for (const f of readdirSync(dir).filter((f) => extname(f).toLowerCase() in TYPES).sort()) {
  const ext = extname(f);
  const id = basename(f, ext);
  types[id] = TYPES[ext.toLowerCase()];
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aes, readFileSync(join(dir, f))));
  const blob = new Uint8Array(iv.length + data.length);
  blob.set(iv); blob.set(data, iv.length);
  writeFileSync(join(out, `${id}.bin`), blob);
  ids.push(id);
}
writeFileSync(join(out, 'index.json'), JSON.stringify({ version: 1, salt: SALT, ids, types }, null, 2) + '\n');
console.log(`${ids.length} images chiffrées dans ${out} : ${ids.join(', ')}`);
