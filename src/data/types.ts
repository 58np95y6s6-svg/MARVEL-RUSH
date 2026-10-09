// Contrat partagé : définitions statiques du contenu (unités, boss, ennemis, équipes, packs).
// Toute modification passe par le chef de projet (voir docs/journal.md).

export type Pack = 'marvel' | 'disney' | 'dc';
export type Rarity = 'rare' | 'epique' | 'legendaire';
/** premier = le plus avancé sur le chemin, aleatoire = au hasard, fort = le plus de PV. */
export type Targeting = 'premier' | 'aleatoire' | 'fort';

export type UnitId =
  | 'ironman' | 'spiderman' | 'hulk' | 'thor' | 'strange' | 'venom' | 'cmarvel'
  | 'cap' | 'loki' | 'bucky' | 'hawkeye' | 'falcon' | 'widow' | 'shangchi'
  | 'moana' | 'maui' | 'pocahontas' | 'mulan' | 'merida' | 'ariel' | 'foxhound'
  | 'tiana' | 'nemo' | 'coco' | 'nickjudy' | 'buzzwoody' | 'rapunzel' | 'vanralph'
  // Extension DC Comics
  | 'batman' | 'superman' | 'wonderwoman' | 'flash' | 'aquaman' | 'greenlantern' | 'cyborg'
  | 'supergirl' | 'shazam' | 'robin' | 'batgirl' | 'catwoman' | 'harley' | 'martian' | 'greenarrow';

export type BossId = 'jafar' | 'cruella' | 'ursula' | 'malefique' | 'galactus' | 'bouffon' | 'thanos'
  // Extension DC Comics (Darkseid : boss final de l'extension)
  | 'joker' | 'luthor' | 'bane' | 'sinestro' | 'blackadam' | 'darkseid';

export type EnemyKind = 'normal' | 'rapide' | 'gros' | 'blinde' | 'bouclier' | 'sbire';

export interface UnitDef {
  id: UnitId;
  name: string;            // nom affiché, en français
  pack: Pack;
  rarity: Rarity;
  role: string;            // ex. « Dégâts de zone »
  targeting: Targeting;
  damage: number;          // dégâts de base au rang 1, niveau 1
  attackInterval: number;  // secondes entre deux attaques
  ability: {
    name: string;          // ex. « Uni-Beam »
    description: string;   // texte affiché
    params: Record<string, number>; // paramètres chiffrés lus par le moteur
  };
}

export interface TalentDef {
  unit: UnitId;
  tier: 1 | 2 | 3;         // paliers débloqués aux niveaux 5, 7, 9
  option: 'a' | 'b';
  name: string;
  description: string;
  params: Record<string, number>;
}

export interface BossDef {
  id: BossId;
  name: string;
  power: { name: string; description: string; interval: number; params: Record<string, number> };
  minion: { name: string; description: string; params: Record<string, number> };
  arenaMapId: string;
}

export interface TeamBonusDef {
  id: string;
  name: string;
  units: UnitId[];         // l'équipe est active si le deck contient toutes ces unités
  description: string;
  params: Record<string, number>;
}

export interface PackDef {
  id: Pack;
  name: string;
  price1: number;
  price10: number;
  rates: Record<Rarity, number>; // somme = 1
  pityLegendary: number;         // Légendaire garanti au plus tard à ce tirage
}

export interface AwakeningPassiveDef {
  unit: UnitId;
  star: 2 | 4 | 6 | 8 | 10;   // étoile d'éveil qui débloque ce passif
  name: string;
  description: string;
  params: Record<string, number>;
}
