// Contrat partagé : définitions statiques du contenu (unités, boss, ennemis, équipes, packs).
// Toute modification passe par le chef de projet (voir docs/journal.md).

export type Pack = 'marvel' | 'disney' | 'dc' | 'transformers' | 'pixar';
export type Rarity = 'rare' | 'epique' | 'legendaire';
/** Raretés de Rush Royale (la commune y existe : chez nous, une commune ou une rare donne un héros Rare). */
export type RrRarity = 'commune' | 'rare' | 'epique' | 'legendaire';
/** premier = le plus avancé sur le chemin, aleatoire = au hasard, fort = le plus de PV. */
export type Targeting = 'premier' | 'aleatoire' | 'fort';

export type UnitId =
  | 'ironman' | 'spiderman' | 'hulk' | 'thor' | 'strange' | 'venom' | 'cmarvel'
  | 'cap' | 'loki' | 'bucky' | 'hawkeye' | 'falcon' | 'widow' | 'shangchi'
  | 'moana' | 'maui' | 'pocahontas' | 'mulan' | 'merida' | 'ariel' | 'foxhound'
  | 'tiana' | 'nemo' | 'coco' | 'nickjudy' | 'buzzwoody' | 'rapunzel' | 'vanralph'
  // Extension DC Comics
  | 'batman' | 'superman' | 'wonderwoman' | 'flash' | 'aquaman' | 'greenlantern' | 'cyborg'
  | 'supergirl' | 'shazam' | 'robin' | 'batgirl' | 'catwoman' | 'harley' | 'martian' | 'greenarrow'
  // Extension Transformers (Autobots)
  | 'optimus' | 'bumblebee' | 'ironhide' | 'ratchet' | 'jazz' | 'arcee' | 'grimlock' | 'wheeljack'
  | 'hotrod' | 'elita' | 'bulkhead' | 'sideswipe' | 'prowl' | 'mirage' | 'ultramagnus'
  // Extension Pixar (beaucoup de duos)
  | 'mrincredible' | 'elastigirl' | 'frozone' | 'violetflash' | 'sullimike' | 'mcqueen' | 'carlrussell' | 'joysadness'
  | 'remy' | 'walleeve' | 'lucaalberto' | 'mei' | 'jessie' | 'ianbarley' | 'joe';

export type BossId = 'jafar' | 'cruella' | 'ursula' | 'malefique' | 'galactus' | 'bouffon' | 'thanos'
  // Extension DC Comics (Darkseid : boss final de l'extension)
  | 'joker' | 'luthor' | 'bane' | 'sinestro' | 'blackadam' | 'darkseid'
  // Extension Transformers (Decepticons ; Megatron : boss final, Unicron : boss cosmique des modes infinis)
  | 'starscream' | 'soundwave' | 'shockwave' | 'devastator' | 'blitzwing' | 'megatron' | 'unicron'
  // Extension Pixar (l'Empereur Zurg : boss final de l'extension)
  | 'syndrome' | 'randall' | 'lotso' | 'hopper' | 'muntz' | 'zurg';

/**
 * Rotation des gros boss en mode infini (option du joueur) et en campagne : tous les univers (par défaut),
 * Marvel et Disney seulement (chapitres 1 à 6, Thanos à chaque palier final), DC seul (Darkseid à chaque
 * palier final), Transformers seul (Unicron) ou Pixar seul (pas de boss final : Zurg est dans la rotation).
 */
export type BossPool = 'tous' | 'marvel-disney' | 'dc' | 'transformers' | 'pixar';

export type EnemyKind = 'normal' | 'rapide' | 'gros' | 'blinde' | 'bouclier' | 'sbire';

export interface UnitDef {
  id: UnitId;
  name: string;            // nom affiché, en français
  pack: Pack;
  rarity: Rarity;
  role: string;            // ex. « Dégâts de zone »
  targeting: Targeting;
  damage: number;          // dégâts de base au rang 1, niveau 1
  /**
   * Dégâts ajoutés par niveau de collection au-dessus de 1 (tableau par niveau de carte de Rush Royale,
   * notre niveau 1 = niveau de carte 7). Absent : +10 % des dégâts de base par niveau (LEVEL_DAMAGE).
   */
  damagePerLevel?: number;
  attackInterval: number;  // secondes entre deux attaques
  /**
   * Portée d'attaque (§4.1 bis) : 'globale' = tout le chemin, sinon un rayon en cases mesuré depuis le
   * centre de la case de l'unité jusqu'à l'ennemi (coordonnées de grille). Repères : courte 1.6,
   * moyenne 2.4, longue 3.4.
   */
  range?: number | 'globale'; // absent = 'globale'
  /**
   * Unité Rush Royale dont le héros reprend le profil (docs/rush-royale-mapping.md) : id (image chiffrée
   * public/rr/<id>.bin), nom français, rareté Rush Royale (même rareté que le héros, Rare ↔ commune ou rare).
   */
  rr?: { id: string; name: string; rarity: RrRarity };
  ability: {
    name: string;          // ex. « Uni-Beam »
    description: string;   // texte affiché
    params: Record<string, number>; // paramètres chiffrés lus par le moteur
  };
}

export interface TalentDef {
  unit: UnitId;
  tier: 1 | 2 | 3 | 4;     // paliers débloqués aux niveaux 5, 7, 9 ; 4 = talent ultime (niveau 10, option 'a' seule, gratuit)
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
