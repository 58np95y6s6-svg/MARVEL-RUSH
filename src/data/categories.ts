// Catégories de héros (Encyclopédie, filtres de collection). Un héros peut appartenir à plusieurs
// catégories. Les clés de UNIT_CATEGORIES sont des chaînes pour qu'une extension (DC, Transformers,
// Pixar…) puisse ajouter ses héros sans toucher à UnitId ; un héros absent de la table reçoit des
// catégories déduites de sa portée, de son rôle et de ses clés d'archétype (voir categoriesFor).

import type { UnitDef } from './types';

export type HeroCategory =
  | 'tireur' | 'melee' | 'zone' | 'controle' | 'soutien'
  | 'mana' | 'manipulation' | 'antiboss' | 'croissance' | 'critique';

export interface HeroCategoryDef {
  id: HeroCategory;
  label: string;
  icon: string;
  description: string;
}

/** Ordre d'affichage des catégories. */
export const HERO_CATEGORY_LIST: HeroCategoryDef[] = [
  { id: 'tireur', label: 'Tireur', icon: '🎯', description: 'Portée globale : touche tout le chemin.' },
  { id: 'melee', label: 'Corps à corps', icon: '👊', description: 'Courte portée, mais frappe très fort.' },
  { id: 'zone', label: 'Dégâts de zone', icon: '💥', description: 'Touche plusieurs ennemis à la fois.' },
  { id: 'controle', label: 'Contrôle', icon: '🌀', description: 'Ralentit, étourdit ou repousse les ennemis.' },
  { id: 'soutien', label: 'Soutien', icon: '🤝', description: 'Renforce les unités voisines.' },
  { id: 'mana', label: 'Générateur de mana', icon: '💧', description: 'Rapporte du mana en plus.' },
  { id: 'manipulation', label: 'Déplacement & manipulation', icon: '🔀', description: 'Copie, échange de place ou booster de fusion.' },
  { id: 'antiboss', label: 'Anti-boss', icon: '👑', description: 'Spécialiste des ennemis les plus coriaces.' },
  { id: 'croissance', label: 'Croissance', icon: '📈', description: 'Devient plus fort au fil de la partie.' },
  { id: 'critique', label: 'Critique', icon: '⚡', description: 'Coups critiques dévastateurs.' },
];

export const HERO_CATEGORIES: Record<HeroCategory, HeroCategoryDef> =
  Object.fromEntries(HERO_CATEGORY_LIST.map((c) => [c.id, c])) as Record<HeroCategory, HeroCategoryDef>;

export const UNIT_CATEGORIES: Partial<Record<string, HeroCategory[]>> = {
  // ───────────── Marvel ─────────────
  ironman: ['tireur', 'zone'],
  spiderman: ['controle'],
  hulk: ['melee', 'zone', 'controle'],
  thor: ['zone'],
  strange: ['tireur', 'controle'],
  venom: ['melee', 'croissance'],
  cmarvel: ['tireur', 'antiboss'],
  cap: ['soutien', 'zone'],
  loki: ['manipulation', 'controle'],
  bucky: ['critique', 'antiboss'],
  hawkeye: ['tireur', 'zone', 'controle'],
  falcon: ['tireur', 'antiboss'],
  widow: ['mana', 'antiboss', 'controle'],
  shangchi: ['melee', 'zone'],
  // ───────────── Disney ─────────────
  moana: ['controle'],
  maui: ['melee', 'zone'],
  pocahontas: ['soutien', 'mana'],
  mulan: ['melee', 'zone'],
  merida: ['tireur', 'critique'],
  ariel: ['controle'],
  foxhound: ['melee'],
  tiana: ['tireur', 'mana', 'controle'],
  nemo: ['soutien', 'controle'],
  coco: ['manipulation', 'soutien'],
  nickjudy: ['controle', 'antiboss'],
  buzzwoody: ['zone', 'controle'],
  rapunzel: ['soutien'],
  vanralph: ['melee', 'manipulation'],
  // ───────────── DC Comics (extension) ─────────────
  batman: ['antiboss'],
  superman: ['tireur', 'controle'],
  wonderwoman: ['zone', 'antiboss'],
  greenlantern: ['zone'],
  flash: ['melee', 'manipulation', 'zone'],
  aquaman: ['critique'],
  cyborg: ['tireur', 'soutien', 'croissance'],
  supergirl: ['croissance'],
  shazam: ['zone', 'controle'],
  martian: ['manipulation'],
  robin: ['melee', 'manipulation'],
  batgirl: ['melee', 'zone'],
  catwoman: ['melee', 'mana'],
  harley: ['melee', 'mana'],
  greenarrow: ['tireur', 'controle'],
};

type CategorySource = Pick<UnitDef, 'role' | 'range'> & { id: string; ability: { params: Record<string, number> } };

/** Catégories déduites (repli) : portée, rôle et clés d'archétype de la compétence. */
export function deriveCategories(u: CategorySource): HeroCategory[] {
  const out = new Set<HeroCategory>();
  const range = u.range ?? 'globale';
  if (range === 'globale') out.add('tireur');
  else if (range <= 1.6) out.add('melee');
  const role = u.role.toLowerCase();
  const p = u.ability.params;
  if (role.includes('zone') || 'splash' in p || 'chain' in p) out.add('zone');
  if (role.includes('contrôle') || role.includes('controle')) out.add('controle');
  if (role.includes('soutien') || 'auraAttackSpeed' in p || 'auraDamage' in p) out.add('soutien');
  if (role.includes('critique') || 'critMul' in p) out.add('critique');
  if (role.includes('anti-boss') || role.includes('boss')) out.add('antiboss');
  if (role.includes('économie') || 'sacrificeMana' in p || 'manaPerKill' in p) out.add('mana');
  if ('copyDamageMul' in p || 'promoteAlly' in p || 'swapAlly' in p) out.add('manipulation');
  if ('growthPerSecond' in p || 'growthPerKill' in p) out.add('croissance');
  if (out.size === 0) out.add(typeof range === 'number' && range < 2 ? 'melee' : 'tireur');
  return [...out];
}

/** Catégories d'un héros : la table si elle le connaît, sinon le repli déduit. */
export function categoriesFor(u: CategorySource): HeroCategory[] {
  const set = UNIT_CATEGORIES[u.id];
  return set && set.length > 0 ? set : deriveCategories(u);
}

/** Libellé de portée affiché dans la fiche. */
export function rangeLabel(range: UnitDef['range']): string {
  const r = range ?? 'globale';
  if (r === 'globale') return 'toute la map';
  if (r >= 3) return 'longue';
  if (r >= 2) return 'moyenne';
  return 'courte';
}

/** Valeur numérique de la portée pour les tris (toute la map = la plus grande). */
export function rangeValue(range: UnitDef['range']): number {
  const r = range ?? 'globale';
  return r === 'globale' ? 99 : r;
}
