// Correspondance entre les effets d'attaque du moteur (`attack.fx`, « unité:effet ») et leur rendu.
import type { UnitId } from '../data/types';
import type { ShotStyle } from './fx';

/** Couleur d'effet de chaque unité (reprise des planches). */
export const UNIT_FX_COLOR: Record<UnitId, number> = {
  ironman: 0x7fe3ff, spiderman: 0xf4f2fa, hulk: 0x7ed957, thor: 0x9fd8ff, strange: 0xffa53b, venom: 0xb5b0d0,
  cmarvel: 0xffd34a, cap: 0x5aa0ff, loki: 0x7fe08a, bucky: 0xd8dde6, hawkeye: 0xc58cff, falcon: 0xff6b5a,
  widow: 0x6fc3ff, shangchi: 0xffcf3f, moana: 0x5fd6e8, maui: 0x4fd1b5, pocahontas: 0x9be36a, mulan: 0xff8a3d,
  merida: 0x8be06a, ariel: 0x9ae8ff, foxhound: 0xe0a46a, tiana: 0xd8ff7a, nemo: 0xff9a3c, coco: 0xffd16a,
  nickjudy: 0xff9b3b, buzzwoody: 0x7dff6a, rapunzel: 0xffe28a, vanralph: 0xff5a7a,
};

export interface FxSpec {
  style: ShotStyle;
  color?: number;
  size?: number;
  /** Anneau d'impact sur la première cible (éclaboussure). */
  ring?: number;
  /** Rayon depuis l'unité vers la cible la plus lointaine (laser qui transperce). */
  beam?: number;
  /** Éclair qui rebondit de cible en cible. */
  chain?: boolean;
  /** Toutes les cibles reçoivent un projectile (sinon la première seulement, les autres un petit impact). */
  all?: boolean;
  /** Petit tremblement d'écran. */
  shake?: number;
}

const T: Record<string, FxSpec> = {
  'ironman:unibeam': { style: 'beam', beam: 34, color: 0x9ff0ff, shake: 4 },
  'ironman:repulseur': { style: 'orb', size: 1.1 },
  'spiderman:toile': { style: 'web', size: 0.9 },
  'hulk:smash': { style: 'orb', size: 1.6, ring: 170, shake: 7 },
  'hulk:coup': { style: 'orb', size: 1.4, ring: 90 },
  'thor:chaine': { style: 'chain', chain: true },
  'venom:devorer': { style: 'orb', size: 1.6, color: 0x2a2440, ring: 80 },
  'cmarvel:binaire': { style: 'beam', beam: 22, color: 0xffe27a },
  'cap:bouclier': { style: 'orb', size: 1.3, all: true, chain: true, color: 0x6aa8ff },
  'loki:dague': { style: 'arrow' },
  'bucky:critique': { style: 'arrow', size: 1.6, color: 0xff6a5a, shake: 2 },
  'bucky:tir': { style: 'arrow' },
  'hawkeye:explosive': { style: 'arrow', color: 0xffa040, ring: 100 },
  'hawkeye:glace': { style: 'arrow', color: 0x9fe8ff },
  'hawkeye:electrique': { style: 'arrow', color: 0xfff27a, chain: true },
  'widow:morsure': { style: 'chain', chain: true, color: 0x7fd0ff },
  'shangchi:anneaux': { style: 'orb', all: true, color: 0xffd84a, size: 1.1, shake: 3 },
  'maui:requin': { style: 'orb', size: 1.5, ring: 120, color: 0x3fc7d8 },
  'maui:faucon': { style: 'arrow', color: 0xd9b27a },
  'mulan:avalanche': { style: 'orb', all: true, color: 0xeaf7ff, ring: 70, shake: 8 },
  'mulan:souffle': { style: 'orb', size: 1.2 },
  'merida:tir-parfait': { style: 'arrow', size: 1.2 },
  'ariel:bulles': { style: 'orb', size: 1 },
  'foxhound:double': { style: 'orb', all: true },
  'buzzwoody:laser': { style: 'beam', beam: 16, color: 0x8dff6a },
  'vanralph:brise-bouclier': { style: 'orb', size: 1.5, ring: 110, shake: 3 },
  'vanralph:poing': { style: 'orb', size: 1.4 },
  'falcon:tir-aerien': { style: 'arrow' },
  'coco:notes': { style: 'note' },
  'tiana:luciole': { style: 'orb', size: 0.8 },
};

export function fxSpec(fx: string, unit: UnitId): FxSpec & { color: number } {
  const s = T[fx] ?? (fx.startsWith('nemo:') ? { style: 'orb' as const, size: 1 } : { style: 'orb' as const });
  return { ...s, color: s.color ?? UNIT_FX_COLOR[unit] ?? 0xffffff };
}
