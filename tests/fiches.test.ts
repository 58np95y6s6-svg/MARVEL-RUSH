import { describe, expect, it } from 'vitest';
import { decryptFiche, deriveFicheKey } from '../src/access/fiches';

describe('illustrations chiffrées', () => {
  it('déchiffre ce qui a été chiffré avec la même clé, refuse une autre clé', async () => {
    const key = await deriveFicheKey('cle-de-test');
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const data = new TextEncoder().encode('image');
    const enc = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data));
    const blob = new Uint8Array(12 + enc.length); blob.set(iv); blob.set(enc, 12);
    expect(new TextDecoder().decode(await decryptFiche(blob.buffer, key))).toBe('image');
    await expect(decryptFiche(blob.buffer, await deriveFicheKey('mauvaise'))).rejects.toBeTruthy();
  });
});
