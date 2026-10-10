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
  // Extension Pixar
  mrincredible: 0xffb347, elastigirl: 0xff6a5a, frozone: 0xc8f0ff, violetflash: 0xb08aff, sullimike: 0x4ab8e8,
  mcqueen: 0xffd23f, carlrussell: 0xff5a6a, joysadness: 0xffd23f, remy: 0xe8a03a, walleeve: 0x5ad8ff,
  lucaalberto: 0x4ac8b0, mei: 0xff8a5a, jessie: 0xe8c070, ianbarley: 0xffb83a, joe: 0x8af0d8,
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
  // Extension Pixar (coup normal, coup de duo)
  'mrincredible:poing', 'elastigirl:bras', 'frozone:glace', 'violetflash:coup', 'violetflash:duo', 'sullimike:griffe',
  'mcqueen:turbo', 'mcqueen:duo', 'carlrussell:canne', 'joysadness:souvenir', 'joysadness:duo', 'remy:louche', 'remy:duo',
  'walleeve:cube', 'walleeve:duo', 'lucaalberto:vague', 'lucaalberto:duo', 'mei:panda', 'jessie:lasso', 'jessie:duo',
  'ianbarley:baton', 'joe:notes', 'joe:duo',
] as const;
