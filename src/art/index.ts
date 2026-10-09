// API publique du module de dessin des personnages.
// Toutes les fonctions renvoient une chaîne <svg> autonome (aucune ressource externe),
// déterministe et mise en cache. Les identifiants internes (clipPath, dégradés, filtres)
// sont préfixés par le personnage, la pose et le skin : deux SVG différents n'ont jamais d'id commun.
import type { BossId, Rarity, UnitId } from '../data/types';
import { O, f, ctx, gloss, uid, withIds, type CharDef, type PoseIdx } from './primitives';
import { unitEntry, bossEntry, minionEntry, UNIT_IDS, BOSS_IDS, type Entry } from './registry';
import { drawEnemy, type EnemyLook } from './enemies';
import { neonSkin, winterSkin, snowDecor, type Skin } from './skins';

export type { Skin } from './skins';
export type { EnemyLook } from './enemies';
export { loadTexture, clearTextureCache } from './texture';
export { UNIT_IDS, BOSS_IDS };
export { STONES } from './bosses/thanos';

/* ---------- cadrages (repères des planches) ---------- */
export interface Frame {
  /** viewBox du SVG. */
  viewBox: readonly [number, number, number, number];
  /** Point d'ancrage conseillé (pieds du personnage), en fraction de la largeur et de la hauteur. */
  anchor: readonly [number, number];
}
const frame = (x: number, y: number, w: number, h: number, footY = 207): Frame => ({
  viewBox: [x, y, w, h],
  anchor: [(100 - x) / w, (footY - y) / h],
});
/** Unités : 280 × 220, pieds à (100, 207). */
export const UNIT_FRAME = frame(-40, -5, 280, 220);
/** Boss : 280 × 280. */
export const BOSS_FRAME = frame(-40, -46, 280, 280);
/** Sbires et ennemis génériques : 190 × 190. */
export const MINION_FRAME = frame(5, 44, 190, 190);
/** Jetons de plateau : 200 × 200, centre (100, 100). */
export const TOKEN_FRAME: Frame = { viewBox: [0, 0, 200, 200], anchor: [0.5, 0.5] };

const RARITY_COLORS: Record<Rarity, string> = { rare: '#3c8bf0', epique: '#9b59e6', legendaire: '#f2a93b' };
export { RARITY_COLORS };

function wrap(fr: Frame, body: string, label: string): string {
  const [x, y, w, h] = fr.viewBox;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')}">${body}</svg>`;
}

const cache = new Map<string, string>();
function cached(key: string, make: () => string): string {
  let s = cache.get(key);
  if (s === undefined) {
    s = withIds(key, make);
    cache.set(key, s);
  }
  return s;
}

function drawPose(e: Entry, pose: PoseIdx): string {
  const def: CharDef = e.def;
  return def.draw(ctx(def, pose, e.opts));
}

function applySkin(body: string, skin: Skin, kind: 'unit' | 'boss'): string {
  if (skin === 'neon') return neonSkin(body, uid);
  if (skin === 'hiver') {
    const snow = snowDecor(kind);
    return snow.back + winterSkin(body) + snow.front;
  }
  return body;
}

/* ---------- unités ---------- */
/** Une pose d'un héros : 0 repos, 1 préparation, 2 frappe (effets de la pose compris). */
export function unitSvg(id: UnitId, pose: PoseIdx, skin: Skin = 'classique'): string {
  return cached(`u-${id}-${pose}-${skin}`, () => {
    const e = unitEntry(id);
    return wrap(UNIT_FRAME, applySkin(drawPose(e, pose), skin, 'unit'), `${e.def.name}, pose ${pose}`);
  });
}

/** Rareté indiquée sur les planches (le jeu peut la surcharger dans `tokenSvg`). */
export function unitRarity(id: UnitId): Rarity {
  const r = String(unitEntry(id).def['rarity'] ?? '');
  return r.startsWith('L') ? 'legendaire' : r.startsWith('É') || r.startsWith('E') ? 'epique' : 'rare';
}
export function unitName(id: UnitId): string {
  return unitEntry(id).def.name;
}
/** Couleurs de fond des cartes de la planche (dégradé clair → foncé). */
export function unitTint(id: UnitId): readonly [string, string] {
  const d = unitEntry(id).def;
  return [String(d['tint'] ?? '#e8e8f0'), String(d['tint2'] ?? '#b8b8c8')];
}

/* ---------- jetons de plateau ---------- */
export interface TokenOpts {
  /** Surcharge la rareté de la planche (bordure). */
  rarity?: Rarity;
}
/**
 * Jeton de plateau façon Rush Royale : disque avec le buste du personnage,
 * liseré de la couleur de rareté et pastilles de rang (1 à 7) en bas.
 */
export function tokenSvg(id: UnitId, rank: number, skin: Skin = 'classique', opts: TokenOpts = {}): string {
  const rk = Math.max(1, Math.min(7, Math.round(rank)));
  const rar = opts.rarity ?? unitRarity(id);
  return cached(`t-${id}-${rk}-${skin}-${rar}`, () => {
    const e = unitEntry(id);
    const rc = RARITY_COLORS[rar];
    const [t1, t2] = skin === 'neon' ? ['#4a3f7a', '#120d24'] : skin === 'hiver' ? ['#eaf7ff', '#9cc8ea'] : unitTint(id);
    const g = uid('tg'), c = uid('tc'), rg = uid('tr');
    const fig = applySkin(drawPose(e, 0), skin, 'unit');
    let s = `<defs><radialGradient id="${g}" cx=".5" cy=".38" r=".7"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="${t1}"/><stop offset="1" stop-color="${t2}"/></radialGradient>` +
      `<linearGradient id="${rg}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
      `<clipPath id="${c}"><circle cx="100" cy="96" r="80"/></clipPath></defs>`;
    s += `<ellipse cx="100" cy="190" rx="70" ry="9" fill="${O}" opacity=".25"/>`;
    s += `<circle cx="100" cy="96" r="92" fill="${rc}" stroke="${O}" stroke-width="7"/>`;
    s += `<circle cx="100" cy="96" r="92" fill="url(#${rg})"/>`;
    s += `<circle cx="100" cy="96" r="80" fill="url(#${g})" stroke="${O}" stroke-width="5"/>`;
    s += `<g clip-path="url(#${c})"><g transform="translate(100 110) scale(.78) translate(-100 -118)">${fig}</g></g>`;
    s += `<circle cx="100" cy="96" r="80" fill="none" stroke="${O}" stroke-width="5"/>`;
    s += gloss(58, 40, 20, 8, -38, 0.45);
    // pastilles de rang
    const gap = 17, w = rk * gap + 12, x0 = 100 - w / 2;
    s += `<rect x="${f(x0)}" y="166" width="${f(w)}" height="26" rx="13" fill="${O}" stroke="${rc}" stroke-width="3"/>`;
    for (let i = 0; i < rk; i++) {
      const cx = x0 + 6 + gap / 2 + i * gap;
      s += `<circle cx="${f(cx)}" cy="179" r="6.2" fill="#fff4c2" stroke="${rc}" stroke-width="2.4"/><circle cx="${f(cx - 1.8)}" cy="177.2" r="1.8" fill="#fff"/>`;
    }
    return wrap(TOKEN_FRAME, s, `${e.def.name}, rang ${rk}`);
  });
}

/* ---------- boss ---------- */
export interface BossOpts {
  /** Ajoute le décor d'arrière-plan de la planche (étoiles, rochers…). */
  bg?: boolean;
}
/** Une pose d'un boss : 0 repos, 1 préparation, 2 pouvoir. Thanos : 1 gant levé, 2 claquement. */
export function bossSvg(id: BossId, pose: PoseIdx, opts: BossOpts = {}): string {
  return cached(`b-${id}-${pose}-${opts.bg ? 'bg' : 'nb'}`, () => {
    const e = bossEntry(id);
    const bg = opts.bg && e.def.bg ? e.def.bg() : '';
    return wrap(BOSS_FRAME, bg + drawPose(e, pose), `${e.def.name}, pose ${pose}`);
  });
}
export function bossName(id: BossId): string {
  return bossEntry(id).def.name;
}
/** Couleurs de fond de la carte du boss (planche). */
export function bossTint(id: BossId): readonly [string, string] {
  const d = bossEntry(id).def;
  return [String(d['tint'] ?? '#5a4a8a'), String(d['tint2'] ?? '#1a1030')];
}

/* ---------- sbires ---------- */
const MOTION: Record<BossId, 'walk' | 'float'> = {
  jafar: 'walk', cruella: 'walk', ursula: 'float', malefique: 'walk', galactus: 'float', bouffon: 'float', thanos: 'walk',
  joker: 'walk', luthor: 'walk', bane: 'walk', sinestro: 'float', blackadam: 'walk', darkseid: 'float',
};
/** Pas de marche : jambes « legA » / « legB » inclinées, pivot en haut de la jambe. */
function walkLegs(svg: string, frameNo: 0 | 1): string {
  return svg.replace(/<g class="(legA|legB)">(<path d="M([-\d.]+) ([-\d.]+))/g, (_m, cls: string, rest: string, x: string, y: string) => {
    const sgn = (cls === 'legA' ? -1 : 1) * (frameNo === 0 ? 1 : -1);
    return `<g class="${cls}" transform="rotate(${16 * sgn} ${x} ${y})">${rest}`;
  });
}
/**
 * Sbire d'un boss. Poses 0 et 1 : les deux images du cycle de marche (ou de vol) ;
 * pose 2 : l'action de la planche (morsure, coup, explosion…).
 */
export function minionSvg(bossId: BossId, pose: PoseIdx = 0): string {
  return cached(`m-${bossId}-${pose}`, () => {
    const e = minionEntry(bossId);
    let body: string;
    if (pose === 2) body = drawPose(e, 2);
    else {
      const fr = pose as 0 | 1;
      body = walkLegs(drawPose(e, 0), fr);
      body = body.replace(/<g class="flap" style="transform-origin:([-\d.]+)px ([-\d.]+)px">/g, (_m, ox: string, oy: string) =>
        fr === 1 ? `<g class="flap" transform="translate(${ox} ${oy}) scale(1 .55) translate(${-ox} ${-oy})">` : `<g class="flap">`);
      const t = MOTION[bossId] === 'walk'
        ? (fr === 0 ? 'rotate(-3 100 207)' : 'translate(0 -5) rotate(3 100 207)')
        : (fr === 0 ? 'translate(0 -4)' : 'translate(0 4)');
      body = `<g transform="${t}">${body}</g>`;
    }
    return wrap(MINION_FRAME, body, `${e.def.name}, pose ${pose}`);
  });
}
export function minionName(bossId: BossId): string {
  return minionEntry(bossId).def.name;
}

/* ---------- ennemis génériques ---------- */
/**
 * Ennemi générique : `kind` donne la silhouette (normal, rapide, gros, blindé, bouclier),
 * `variant` la famille (0 créature-feuille, 1 slime, 2 petit robot ; au-delà, on boucle).
 */
export function enemySvg(kind: EnemyLook, variant = 0): string {
  const v = ((Math.floor(variant) % 3) + 3) % 3;
  return cached(`e-${kind}-${v}`, () => wrap(MINION_FRAME, drawEnemy(kind, v), `ennemi ${kind}`));
}

/* ---------- insertion dans le DOM ---------- */
let domSeq = 0;
/**
 * Pour insérer plusieurs fois le même SVG dans une page : renomme ses identifiants
 * avec un suffixe unique (inutile pour les textures, chaque image étant isolée).
 */
export function uniqueSvg(svg: string): string {
  const sfx = `-d${(domSeq++).toString(36)}`;
  const ids = new Set<string>();
  for (const m of svg.matchAll(/\bid="([^"]+)"/g)) ids.add(m[1]!);
  if (!ids.size) return svg;
  return svg.replace(/\bid="([^"]+)"|url\(#([^)]+)\)/g, (m, a: string | undefined, b: string | undefined) => {
    if (a !== undefined) return ids.has(a) ? `id="${a}${sfx}"` : m;
    return b !== undefined && ids.has(b) ? `url(#${b}${sfx})` : m;
  });
}
