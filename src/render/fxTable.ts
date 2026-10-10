// Couleurs d'effet des unités (reprises des planches) et liste des effets d'attaque émis par le moteur
// (`attack.fx`, « unité:effet »). Le rendu de chaque effet est dans src/render/fx/signatures.ts.
import type { UnitId } from '../data/types';

/** Couleur d'effet de chaque unité. */
export const UNIT_FX_COLOR: Record<UnitId, number> = {
  ironman: 0x7fe3ff, spiderman: 0xf4f2fa, hulk: 0x7ed957, thor: 0x9fd8ff, strange: 0xffa53b, venom: 0xb5b0d0,
  cmarvel: 0xffd34a, cap: 0x5aa0ff, loki: 0x7fe08a, bucky: 0xd8dde6, hawkeye: 0xc58cff, falcon: 0xff6b5a,
  widow: 0x6fc3ff, shangchi: 0xffcf3f, moana: 0x5fd6e8, maui: 0x4fd1b5, pocahontas: 0x9be36a, mulan: 0xff8a3d,
  merida: 0x8be06a, ariel: 0x9ae8ff, foxhound: 0xe0a46a, tiana: 0xd8ff7a, nemo: 0xff9a3c, coco: 0xffd16a,
  nickjudy: 0xff9b3b, buzzwoody: 0x7dff6a, rapunzel: 0xffe28a, vanralph: 0xff5a7a,
  // Extension Transformers
  optimus: 0xff9a2a, bumblebee: 0xffe14a, ironhide: 0xffb347, ratchet: 0x7dffb0, jazz: 0x3a8ae0,
  arcee: 0xff6fa8, grimlock: 0xff8a2a, wheeljack: 0x3fae5a, hotrod: 0xff8a2a, elita: 0xff7ad8,
  bulkhead: 0xf2c33c, sideswipe: 0xff6a5a, prowl: 0x7dffb0, mirage: 0x9adcff, ultramagnus: 0xffd34a,
};

/** Effets d'attaque ayant une signature dédiée (les `nemo:…` combinent ralenti, double, poison, cadence). */
export const ATTACK_FX = [
  'ironman:repulseur', 'ironman:unibeam', 'spiderman:toile', 'hulk:coup', 'hulk:smash', 'thor:marteau', 'thor:foudre', 'thor:marteau-foi',
  'strange:magie', 'venom:griffes', 'venom:devorer', 'cmarvel:rafale', 'cmarvel:binaire', 'cap:bouclier',
  'loki:dague', 'bucky:tir', 'bucky:critique', 'hawkeye:explosive', 'hawkeye:glace', 'hawkeye:electrique',
  'falcon:tir-aerien', 'widow:tir', 'widow:morsure', 'shangchi:combo', 'shangchi:anneaux', 'moana:rame',
  'maui:faucon', 'maui:requin', 'pocahontas:feuilles', 'mulan:souffle', 'mulan:avalanche', 'merida:tir-parfait',
  'ariel:bulles', 'foxhound:double', 'tiana:luciole', 'nemo:ralenti', 'coco:notes', 'nickjudy:carotte',
  'buzzwoody:laser', 'rapunzel:poele', 'vanralph:poing', 'vanralph:brise-bouclier',
  // Extension Transformers (mode robot, mode véhicule, compétences)
  'optimus:hache', 'optimus:charge', 'optimus:ralliement', 'bumblebee:canon', 'bumblebee:rafale',
  'ironhide:canons', 'ironhide:fourgon', 'ratchet:cle', 'ratchet:sirene', 'jazz:tir', 'jazz:projecteur', 'jazz:notes',
  'arcee:lames', 'arcee:moto', 'grimlock:epee', 'grimlock:feu', 'wheeljack:grenade', 'wheeljack:course', 'wheeljack:mine',
  'hotrod:double', 'hotrod:flammes', 'elita:precision', 'elita:marque', 'bulkhead:boulet', 'bulkhead:ecrasement',
  'sideswipe:lames', 'sideswipe:traversee', 'prowl:analyse', 'prowl:sirene', 'mirage:tir', 'mirage:invisible', 'mirage:leurre',
  'ultramagnus:marteau', 'ultramagnus:porte-voitures',
] as const;
