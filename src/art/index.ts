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

/** Centre et taille de la plaque de rang dans le repère 200 × 200 du jeton. */
export const RANK_PLATE = { cx: 100, cy: 100, r: 96 } as const;
/** Rayon du portrait rond posé sur la plaque. */
export const TOKEN_PORTRAIT_R = 56;

/**
 * Forme de la plaque selon le niveau de fusion, comme dans Rush Royale : le nombre d'angles = le niveau.
 * 1 rond, 2 amande (2 pointes), 3 triangle, 4 losange, 5 pentagone, 6 hexagone, 7 heptagone.
 * Renvoie soit un cercle, soit une liste de points, soit une amande (deux pointes à gauche et à droite).
 */
export type RankShape =
  | { kind: 'circle'; cx: number; cy: number; r: number }
  | { kind: 'lens'; cx: number; cy: number; r: number; bulge: number }
  | { kind: 'polygon'; points: [number, number][] };

export function rankShape(rank: number, cx: number = RANK_PLATE.cx, cy: number = RANK_PLATE.cy, r: number = RANK_PLATE.r): RankShape {
  const rk = Math.max(1, Math.min(7, Math.round(rank)));
  if (rk === 1) return { kind: 'circle', cx, cy, r: r * 0.86 };
  if (rk === 2) return { kind: 'lens', cx, cy, r: r * 1.02, bulge: r * 1.18 };
  const pts: [number, number][] = [];
  // Losange (4) et polygones impairs pointe en haut ; 6 pointe en haut aussi pour un hexagone « debout ».
  const off = -Math.PI / 2;
  // Les triangles et pentagones sont recentrés verticalement pour ne pas déborder en haut.
  const shiftY = rk === 3 ? r * 0.22 : rk === 5 ? r * 0.06 : 0;
  const rr = rk === 3 ? r * 1.16 : r;
  for (let i = 0; i < rk; i++) {
    const t = off + (i * 2 * Math.PI) / rk;
    pts.push([cx + Math.cos(t) * rr, cy + shiftY + Math.sin(t) * rr]);
  }
  return { kind: 'polygon', points: pts };
}

/** Tracé SVG (attribut d) d'une plaque de rang. */
export function rankShapePath(rank: number): string {
  const sh = rankShape(rank);
  if (sh.kind === 'circle') return `M${f(sh.cx - sh.r)} ${f(sh.cy)}a${f(sh.r)} ${f(sh.r)} 0 1 0 ${f(2 * sh.r)} 0a${f(sh.r)} ${f(sh.r)} 0 1 0 ${f(-2 * sh.r)} 0Z`;
  if (sh.kind === 'lens') return `M${f(sh.cx - sh.r)} ${f(sh.cy)}Q${f(sh.cx)} ${f(sh.cy - sh.bulge)} ${f(sh.cx + sh.r)} ${f(sh.cy)}Q${f(sh.cx)} ${f(sh.cy + sh.bulge)} ${f(sh.cx - sh.r)} ${f(sh.cy)}Z`;
  return 'M' + sh.points.map(([x, y]) => `${f(x)} ${f(y)}`).join('L') + 'Z';
}

/**
 * Couleur de plaque propre à chaque personnage : contraste avec ses couleurs dominantes, et assez
 * différente des autres pour qu'on reconnaisse chaque héros d'un coup d'œil sur le plateau.
 */
export const TOKEN_COLORS: Record<string, string> = {
  ironman: '#3fc9e8', spiderman: '#ffd23f', hulk: '#d94fd0', thor: '#22b5a0', strange: '#5fd068',
  venom: '#b5e83c', cmarvel: '#ff6fa8', cap: '#ff9a2e', loki: '#e8414b', bucky: '#f2b632',
  hawkeye: '#46d6a8', falcon: '#59b8ff', widow: '#3ee0e0', shangchi: '#3b62e0',
  moana: '#1fb5c9', maui: '#ffc23a', pocahontas: '#4cc96a', mulan: '#ff7aa8', merida: '#5cb3ff',
  ariel: '#ffb347', foxhound: '#4a7cf0', tiana: '#d65ad1', nemo: '#ffd84a', coco: '#9b6bff',
  nickjudy: '#a6e04a', buzzwoody: '#ef5050', rapunzel: '#5bd47a', vanralph: '#a35cf0',
};
/** Couleur de plaque d'un personnage (repli : couleur claire de sa planche). */
export function tokenColor(id: UnitId): string {
  return TOKEN_COLORS[id] ?? unitTint(id)[1];
}

/**
 * Figure seule d'un jeton (fond transparent, sans cadre) : le personnage est posé directement
 * dans sa plaque de rang, que le rendu du combat dessine et anime lui-même.
 */
export function tokenPortraitSvg(id: UnitId, pose: PoseIdx = 0, skin: Skin = 'classique', _opts: TokenOpts = {}): string {
  return cached(`tp-${id}-${pose}-${skin}`, () => wrap(TOKEN_FRAME, figureBody(id, pose, skin), `${unitEntry(id).def.name}`));
}

function figureBody(id: UnitId, pose: PoseIdx, skin: Skin): string {
  const fig = applySkin(drawPose(unitEntry(id), pose), skin, 'unit');
  return `<g transform="translate(${RANK_PLATE.cx} ${RANK_PLATE.cy + 22}) scale(.74) translate(-100 -118)">${fig}</g>`;
}

/**
 * Jeton de plateau façon Rush Royale : le personnage posé directement dans une plaque dont la FORME
 * donne le niveau de fusion (nombre d'angles = niveau, de 1 rond à 7 heptagone). La plaque a la couleur
 * propre au personnage ; un fin liseré intérieur rappelle sa rareté.
 */
export function tokenSvg(id: UnitId, rank: number, skin: Skin = 'classique', opts: TokenOpts = {}): string {
  const rk = Math.max(1, Math.min(7, Math.round(rank)));
  const rar = opts.rarity ?? unitRarity(id);
  return cached(`t-${id}-${rk}-${skin}-${rar}`, () => {
    const rc = RARITY_COLORS[rar];
    const col = skin === 'neon' ? '#2a2150' : skin === 'hiver' ? '#bfe6ff' : tokenColor(id);
    const pg = uid('tpg');
    let s = `<defs><linearGradient id="${pg}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient></defs>`;
    s += `<ellipse cx="100" cy="192" rx="66" ry="7" fill="${O}" opacity=".22"/>`;
    const d = rankShapePath(rk);
    s += `<path d="${d}" fill="${col}" stroke="${O}" stroke-width="7" stroke-linejoin="round"/>`;
    s += `<path d="${d}" fill="url(#${pg})"/>`;
    s += `<path d="${d}" fill="none" stroke="${rc}" stroke-width="4" stroke-linejoin="round" transform="translate(100 100) scale(.9) translate(-100 -100)"/>`;
    s += figureBody(id, 0, skin);
    return wrap(TOKEN_FRAME, s, `${unitEntry(id).def.name}, niveau ${rk}`);
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
