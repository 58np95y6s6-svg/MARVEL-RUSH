// Skins Hiver et Néon (§6.3) : palettes alternatives appliquées au SVG d'un personnage.
import { O, f, star } from './primitives';

export type Skin = 'classique' | 'hiver' | 'neon';

/* ---------- couleurs ---------- */
interface HSL {
  h: number;
  s: number;
  l: number;
}
function parseHex(hex: string): [number, number, number] {
  let h = hex.slice(1);
  if (h.length === 3) h = h.replace(/./g, (c) => c + c);
  const v = parseInt(h, 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}
function toHsl(hex: string): HSL {
  const [r, g, b] = parseHex(hex).map((v) => v / 255) as [number, number, number];
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return { h: 0, s: 0, l };
  const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: h * 60, s, l };
}
function toHex({ h, s, l }: HSL): string {
  const k = (n: number): number => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const c = (n: number): number => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
  return '#' + [c(0), c(8), c(4)].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
}
const clamp = (v: number, a = 0, b = 1): number => Math.max(a, Math.min(b, v));
const mixHue = (h: number, target: number, t: number): number => {
  const d = ((target - h + 540) % 360) - 180;
  return (h + d * t + 360) % 360;
};

/** Teintes de peau (claires à foncées) : on les garde reconnaissables dans les skins. */
const isSkin = (c: HSL): boolean => c.h >= 12 && c.h <= 36 && c.s >= 0.25 && c.l >= 0.3 && c.l <= 0.92;

/* ---------- parcours du SVG en suivant les groupes d'effets ---------- */
const FX = /\bclass="(?:[^"]*\s)?(fx|pop|ring|grow|spin|spinF|hit|fly|gather|boom|suck|float)\b/;
const COLOR_ATTR = /\b(fill|stroke|stop-color)="(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})"/g;

/** Remplace chaque couleur ; `fx` vaut vrai à l'intérieur d'un groupe d'effet (lueur, éclat, rayon…). */
function remap(svg: string, fn: (hex: string, attr: string, fx: boolean) => string): string {
  const stack: boolean[] = [];
  return svg.replace(/<[^>]+>/g, (tag) => {
    if (tag.startsWith('</')) {
      stack.pop();
      return tag;
    }
    const inFx = stack.length > 0 && stack[stack.length - 1] === true;
    const isFx = inFx || FX.test(tag);
    const out = tag.replace(COLOR_ATTR, (_m, attr: string, hex: string) => `${attr}="${fn(hex.toLowerCase(), attr, isFx)}"`);
    if (!tag.endsWith('/>') && !tag.startsWith('<?') && !tag.startsWith('<!')) stack.push(isFx);
    return out;
  });
}

/** Teinte dominante (couleurs saturées les plus fréquentes, hors contour). */
function dominantHue(svg: string): number {
  const bins = new Array<number>(12).fill(0);
  for (const m of svg.matchAll(/fill="(#[0-9a-fA-F]{6})"/g)) {
    const c = toHsl(m[1]!);
    if (c.s > 0.35 && c.l > 0.2 && c.l < 0.8) bins[Math.floor(c.h / 30) % 12]! += c.s;
  }
  let best = 0;
  bins.forEach((v, i) => {
    if (v > bins[best]!) best = i;
  });
  return best * 30 + 15;
}

/* ---------- Néon : corps sombre, contours saturés et lumineux ---------- */
export function neonSkin(svg: string, uidFn: (k: string) => string): string {
  const hue = dominantHue(svg);
  const rim = toHex({ h: hue, s: 1, l: 0.6 });
  const rim2 = toHex({ h: (hue + 180) % 360, s: 1, l: 0.62 });
  const body = remap(svg, (hex, attr, fx) => {
    if (hex === O) return attr === 'fill' ? rim2 : rim;
    const c = toHsl(hex);
    if (fx) return toHex({ h: c.h, s: c.s < 0.1 ? 0 : 1, l: clamp(0.55 + c.l * 0.3, 0, 0.92) });
    if (c.l > 0.9) return hex; // reflets et blancs
    if (isSkin(c)) return toHex({ h: c.h, s: clamp(c.s * 0.85), l: c.l * 0.9 }); // le visage reste lisible
    return toHex({ h: c.h, s: clamp(c.s * 0.75), l: 0.08 + c.l * 0.24 });
  });
  const id = uidFn('neon');
  const filter = `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  .75 .75 .75 0 -.55" result="lit"/><feGaussianBlur in="lit" stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
  return `${filter}<g filter="url(#${id})">${body}</g>`;
}

/* ---------- Hiver : bleus glacés, blancs, petits détails de neige ---------- */
function flake(x: number, y: number, r: number): string {
  let d = '';
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI) / 3;
    d += `M${f(x - Math.cos(a) * r)} ${f(y - Math.sin(a) * r)}L${f(x + Math.cos(a) * r)} ${f(y + Math.sin(a) * r)}`;
  }
  return `<path d="${d}" stroke="${O}" stroke-width="5" stroke-linecap="round"/><path d="${d}" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>`;
}
/** Neige au sol et flocons autour du personnage (repère des planches : sol à y = 207). */
export function snowDecor(kind: 'unit' | 'boss' = 'unit'): { back: string; front: string } {
  const front =
    `<path d="M40 212 Q46 198 62 200 Q72 190 86 198 Q100 190 114 198 Q128 190 138 200 Q154 198 160 212Z" fill="#f4fbff" stroke="${O}" stroke-width="4" stroke-linejoin="round"/>` +
    `<path d="M58 206 Q70 200 82 204 M118 204 Q130 200 142 206" stroke="#bfe3f7" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
  const spots: [number, number, number][] = kind === 'boss'
    ? [[-14, 10, 7], [214, 26, 6], [-24, 110, 5], [222, 130, 7], [4, 60, 4], [200, 76, 4]]
    : [[-16, 40, 6], [214, 30, 7], [-24, 128, 5], [224, 120, 6], [8, 4, 4], [196, 86, 4]];
  const back = spots.map(([x, y, r]) => flake(x, y, r)).join('') +
    `<polygon points="${star(-4, 176, 5, 1.6, 4)}" fill="#fff" stroke="${O}" stroke-width="1.6"/><polygon points="${star(206, 172, 5, 1.6, 4)}" fill="#fff" stroke="${O}" stroke-width="1.6"/>`;
  return { back, front };
}
function mixRgb(a: string, b: string, t: number): string {
  const x = parseHex(a), y = parseHex(b);
  return '#' + x.map((v, i) => Math.round(v + ((y[i] ?? 0) - v) * t).toString(16).padStart(2, '0')).join('');
}
export function winterSkin(svg: string): string {
  return remap(svg, (hex, _attr, fx) => {
    if (hex === O) return hex;
    const c = toHsl(hex);
    if (c.l > 0.92) return '#f4fbff';
    if (fx) return mixRgb(hex, '#e8fbff', 0.55);
    if (isSkin(c)) return toHex({ h: c.h, s: clamp(c.s * 0.7), l: clamp(c.l + (0.95 - c.l) * 0.18) });
    // glace : on garde la luminance (le jaune devient blanc givré, le rouge bleu moyen, le noir bleu nuit)
    const [r, g, b] = parseHex(hex);
    const Y = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    const ice = toHex({ h: 206 + (c.h > 180 && c.h < 300 ? 10 : 0), s: 0.55, l: clamp(0.2 + Y * 0.74) });
    return mixRgb(ice, hex, 0.18);
  });
}
