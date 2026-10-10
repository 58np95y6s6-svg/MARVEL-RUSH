// Kit de dessin de l'extension Pixar : le « duo » (petit partenaire à gauche du héros, comme Woody à côté de Buzz),
// le masque des Indestructibles, l'emblème « i », les ballons de Carl, les cubes de WALL-E, les notes de Joe.
/* eslint-disable */
import { O, SK, SKD, f, gloss, limb, hand, star, type Ctx } from '../primitives';
import { shadedW } from './disneyB';

export const SKB = '#8a5a3c', SKBD = '#5e3b26'; // peau foncée (Frozone, Joe)

/** Masque façon Indestructibles sur les yeux du héros (yeux à 80 et 120, y 95). */
export const mask = (c = '#1d1733'): string =>
  `<path d="M60 92 Q62 78 82 80 Q96 82 100 90 Q104 82 118 80 Q138 78 140 92 Q138 108 120 108 Q106 108 100 100 Q94 108 80 108 Q62 108 60 92Z" fill="${c}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/>`;
/** Yeux blancs (pupilles) posés sur le masque. */
export const maskEyes = (p: number, iris = '#4a7ad8'): string =>
  [80, 120].map((x) => `<ellipse cx="${x}" cy="94" rx="9" ry="${p === 2 ? 6 : 8}" fill="#fff"/><circle cx="${x + 1}" cy="95" r="5" fill="${iris}"/><circle cx="${x + 1}" cy="95" r="2.6" fill="${O}"/><circle cx="${x + 3}" cy="92" r="1.6" fill="#fff"/>`).join('') +
  (p > 0 ? `<path d="M66 80 L92 86 M134 80 L108 86" stroke="${O}" stroke-width="5" stroke-linecap="round"/>` : '');

/** Emblème « i » des Indestructibles. */
export const iLogo = (cx: number, cy: number, s = 1): string =>
  `<g transform="translate(${cx} ${cy}) scale(${s})"><ellipse cx="0" cy="0" rx="16" ry="13" fill="#f6a21a" stroke="${O}" stroke-width="3.5"/><ellipse cx="0" cy="0" rx="10" ry="8" fill="#1d1733"/>` +
  `<circle cx="0" cy="-5" r="2.2" fill="#f6a21a"/><rect x="-2" y="-2" width="4" height="9" rx="1.5" fill="#f6a21a"/></g>`;

/** Bouche du héros secondaire selon la pose (centrée sur cx, cy). */
export const smallMouth = (p: number, cx: number, cy: number): string =>
  p === 2
    ? `<path d="M${cx - 7} ${cy - 2} Q${cx} ${cy - 3} ${cx + 7} ${cy - 2} Q${cx + 5} ${cy + 8} ${cx} ${cy + 8} Q${cx - 5} ${cy + 8} ${cx - 7} ${cy - 2}Z" fill="#7a1f2b" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>`
    : p === 1
      ? `<path d="M${cx - 6} ${cy} Q${cx} ${cy - 2} ${cx + 6} ${cy}" stroke="${O}" stroke-width="3" fill="none" stroke-linecap="round"/>`
      : `<path d="M${cx - 6} ${cy - 1} Q${cx} ${cy + 5} ${cx + 6} ${cy - 1}" stroke="${O}" stroke-width="3" fill="none" stroke-linecap="round"/>`;

export interface BuddyOpts {
  cx?: number;
  body: string; bodyD: string;
  skin?: string; skinD?: string;
  eye?: string;
  r?: number;            // rayon de la tête
  hairBack?: string;     // svg derrière la tête
  under?: string;        // svg entre la tête et les yeux (masque)
  hair?: string;         // svg devant la tête (cheveux, chapeau)
  extra?: string;        // détail du corps (logo, gilet…)
  front?: string;        // devant tout (bras, accessoire)
  glasses?: boolean;
  noBody?: boolean;
}
/**
 * Partenaire du duo : petit chibi au pied du héros, à gauche (centre `cx`, 22 par défaut), comme Woody.
 * Pose 0 sourire, 1 concentré, 2 bouche ouverte (le coup de duo).
 */
export function buddy(x: Ctx, o: BuddyOpts): string {
  const cx = o.cx ?? 22, r = o.r ?? 24, hy = 144, sk = o.skin ?? SK, skd = o.skinD ?? SKD, eye = o.eye ?? '#4a2a1a';
  return x.byPose((p) => {
    let s = '';
    if (!o.noBody) {
      const bodyS = (a: string) => `<path d="M${cx - 24} 206 C${cx - 25} 184 ${cx - 15} 168 ${cx} 168 C${cx + 15} 168 ${cx + 25} 184 ${cx + 24} 206Z" ${a}/>`;
      s += shadedW(bodyS, o.body, o.bodyD, -4, -3, 4.5) + (o.extra ?? '');
    }
    s += o.hairBack ?? '';
    s += shadedW((a) => `<circle cx="${cx}" cy="${hy}" r="${r}" ${a}/>`, sk, skd, -5, -4, 4.5) + gloss(cx - r * 0.45, hy - r * 0.5, 4, 2, -30, 0.5);
    s += o.under ?? '';
    const ey = hy + 2;
    s += [cx - 8, cx + 8].map((ex) => `<ellipse cx="${ex}" cy="${ey}" rx="4.2" ry="${p === 2 ? 4.4 : 5.4}" fill="${eye}"/><circle cx="${ex + 1.4}" cy="${ey - 2}" r="1.6" fill="#fff"/>`).join('');
    if (o.glasses) s += `<g fill="none" stroke="${O}" stroke-width="2.5"><circle cx="${cx - 8}" cy="${ey}" r="7.5"/><circle cx="${cx + 8}" cy="${ey}" r="7.5"/><path d="M${cx - 0.5} ${ey} H${cx + 0.5}"/></g>`;
    s += p === 1
      ? `<path d="M${cx - 14} ${ey - 9} Q${cx - 8} ${ey - 13} ${cx - 3} ${ey - 9} M${cx + 3} ${ey - 9} Q${cx + 8} ${ey - 13} ${cx + 14} ${ey - 9}" stroke="${O}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
      : '';
    s += smallMouth(p, cx, hy + 13);
    s += `<ellipse cx="${cx - 13}" cy="${hy + 8}" rx="4" ry="2.5" fill="#ff7c7c" opacity=".4"/><ellipse cx="${cx + 13}" cy="${hy + 8}" rx="4" ry="2.5" fill="#ff7c7c" opacity=".4"/>`;
    s += o.hair ?? '';
    s += o.front ?? '';
    return s;
  });
}
/** Petit bras du partenaire (à droite de son corps), levé en pose 2. */
export const buddyArm = (x: Ctx, cx: number, c: string, fist = SK, extra = ''): string =>
  x.byPose((p) => {
    const sx = cx + 18, sy = 178, ex = p === 2 ? sx + 14 : sx + 4, ey = p === 2 ? sy - 14 : sy + 16;
    return limb(sx, sy, ex, ey, c, 8) + hand(ex, ey + (p === 2 ? -3 : 3), fist, 6.5) + (p === 2 ? extra.replace(/\$X/g, f(ex)).replace(/\$Y/g, f(ey - 6)) : '');
  });

/** Ballon de baudruche (Carl). */
export const balloon = (x: number, y: number, r: number, c: string, sx = 100, sy = 160): string =>
  `<path d="M${f(x)} ${f(y + r)} Q${f((x + sx) / 2 + 6)} ${f((y + sy) / 2)} ${sx} ${sy}" stroke="#f4f4f8" stroke-width="1.6" fill="none" opacity=".9"/>` +
  `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 0.86)}" ry="${f(r)}" fill="${c}" stroke="${O}" stroke-width="2.6"/>` + gloss(x - r * 0.35, y - r * 0.4, r * 0.22, r * 0.12, -35, 0.7);
export const BALLOON_COLORS = ['#ff5a6a', '#ffd23f', '#5ab8ff', '#7ad86a', '#c88aff', '#ff9a3a'];

/** Cube de déchets compactés (WALL-E). */
export const trashCube = (x: number, y: number, s: number): string =>
  `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><rect x="-12" y="-12" width="24" height="24" rx="3" fill="#a8885a" stroke="${O}" stroke-width="3"/>` +
  `<path d="M-12 -4 H12 M-12 5 H12 M-4 -12 V12" stroke="#6e5434" stroke-width="2"/><rect x="2" y="-9" width="6" height="4" fill="#d84a4a"/><rect x="-9" y="6" width="5" height="4" fill="#4a8ad8"/></g>`;

/** Étincelle bleue de 22 / notes de jazz. */
export const sparkle = (x: number, y: number, r: number, c = '#8af0ff'): string =>
  `<polygon points="${star(x, y, r, r * 0.32, 4)}" fill="${c}" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>`;

/** Flocons / cristaux de glace (Frozone). */
export const iceShard = (x: number, y: number, s: number, rot = 0): string =>
  `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot}) scale(${s})"><path d="M0 -20 L7 -2 L0 14 L-7 -2Z" fill="#c8f0ff" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M0 -14 L3 -2 L0 6" stroke="#fff" stroke-width="2" fill="none"/></g>`;

/** Cheveux/coiffure générique : forme pleine ombrée (contour 4,5). */
export const hairS = (d: string, c: string, cd: string, dx = -3, dy = -3): string => shadedW((a) => `<path d="${d}" ${a}/>`, c, cd, dx, dy, 4.5);

/** Bouche du héros principal selon la pose (repos, concentré, cri). */
export const mouth = (p: number): string =>
  p === 0 ? `<path d="M92 115 Q100 121 108 115" stroke="${O}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
    : p === 1 ? `<path d="M91 117 Q100 114 109 116" stroke="${O}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
      : `<path d="M89 111 Q100 109 111 111 Q109 128 100 129 Q91 128 89 111Z" fill="#7a1f2b" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/><path d="M91 112 H109" stroke="#fff" stroke-width="3"/>`;
