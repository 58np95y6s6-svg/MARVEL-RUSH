// Conversion SVG → texture PixiJS 8, nette sur les écrans haute densité.
import { CanvasSource, Texture } from 'pixi.js';

const textures = new Map<string, Promise<Texture>>();

function svgSize(svg: string): [number, number] {
  const vb = /viewBox="([-\d.]+)[ ,]+([-\d.]+)[ ,]+([-\d.]+)[ ,]+([-\d.]+)"/.exec(svg);
  const w = vb ? Number(vb[3]) : 100, h = vb ? Number(vb[4]) : 100;
  return [w > 0 ? w : 100, h > 0 ? h : 100];
}

function decode(svg: string, pw: number, ph: number): Promise<HTMLImageElement> {
  // Fixe la taille en pixels réels pour que le navigateur rastérise le vecteur à la bonne échelle.
  const sized = svg.replace(/<svg\b([^>]*?)\swidth="[^"]*"\s+height="[^"]*"/, '<svg$1').replace('<svg', `<svg width="${pw}" height="${ph}"`);
  const url = URL.createObjectURL(new Blob([sized], { type: 'image/svg+xml' }));
  const img = new Image(pw, ph);
  img.decoding = 'async';
  return new Promise<HTMLImageElement>((resolve, reject) => {
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('art: SVG illisible'));
    img.src = url;
  }).finally(() => URL.revokeObjectURL(url));
}

/**
 * Transforme une chaîne SVG en texture PixiJS mise en cache.
 * @param size largeur d'affichage en pixels CSS (la hauteur suit le ratio du viewBox).
 * @param resolution densité de pixels ; par défaut `devicePixelRatio`, plafonnée à 3.
 * La texture a cette résolution : un sprite qui l'affiche mesure `size` pixels CSS de large.
 */
export function loadTexture(svg: string, size: number, resolution?: number): Promise<Texture> {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const res = Math.min(3, Math.max(1, resolution ?? dpr));
  const key = `${size}@${res}:${svg}`;
  let p = textures.get(key);
  if (!p) {
    const [vw, vh] = svgSize(svg);
    const w = Math.max(1, Math.round(size)), h = Math.max(1, Math.round((size * vh) / vw));
    const pw = Math.round(w * res), ph = Math.round(h * res);
    p = decode(svg, pw, ph).then((img) => {
      const canvas = document.createElement('canvas');
      canvas.width = pw;
      canvas.height = ph;
      const g = canvas.getContext('2d');
      if (!g) throw new Error('art: canvas 2D indisponible');
      g.drawImage(img, 0, 0, pw, ph);
      return new Texture({ source: new CanvasSource({ resource: canvas, resolution: res }) });
    });
    p.catch(() => textures.delete(key));
    textures.set(key, p);
  }
  return p;
}

/** Libère les textures (changement d'écran, manque de mémoire). */
export function clearTextureCache(): void {
  for (const p of textures.values()) void p.then((t) => t.destroy(true)).catch(() => undefined);
  textures.clear();
}
