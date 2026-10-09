// Usage : npm run hash-key -- <clé>
// Affiche le hash SHA-256 à mettre dans le secret GitHub VITE_ACCESS_KEY_HASH.
import { createHash, randomBytes } from 'node:crypto';
const key = process.argv[2] ?? randomBytes(12).toString('base64url');
console.log('Clé      :', key);
console.log('Hash     :', createHash('sha256').update(key).digest('hex'));
