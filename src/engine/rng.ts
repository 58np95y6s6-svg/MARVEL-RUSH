// Générateur pseudo-aléatoire à graine (mulberry32). L'état (un entier 32 bits) vit dans
// l'état du moteur, ce qui rend la sérialisation exacte.

/** Avance l'état et renvoie [valeur dans [0, 1), nouvel état]. */
export function mulberry32(state: number): [number, number] {
  const a = (state + 0x6d2b79f5) | 0;
  let t = a;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, a];
}

/** Mélange une graine pour dériver un second flux indépendant. */
export function deriveSeed(seed: number, salt: number): number {
  let h = (seed ^ Math.imul(salt, 0x9e3779b1)) | 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) | 0;
}
