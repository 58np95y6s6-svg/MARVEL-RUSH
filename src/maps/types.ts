// Contrat partagé : description d'une map (§7 bis du prompt).
// Le moteur ne lit que `pathLength` et `modifiers` ; le reste sert au rendu.

export type Universe = 'marvel' | 'disney' | 'boss';

export interface Point { x: number; y: number }

export interface MapDef {
  id: string;
  name: string;
  universe: Universe;
  /** Personnages associés (pour le choix automatique de la map en Solo). */
  heroes: string[];
  /** Tracé du chemin, en coordonnées logiques (écran 1000 × 1600, portrait). Solo : un tracé. */
  path: Point[];
  /** Tracé en Coop (chemin commun central) et en Duel (un par joueur). */
  pathCoop?: Point[];
  pathDuel?: { a: Point[]; b: Point[] };
  /** Longueur du chemin en cases, identique à ±10 % entre maps. */
  pathLength: number;
  pathMaterial: string;
  palette: Record<string, string>;
  /** Couches de décor, du fond vers l'avant : fonctions qui renvoient une chaîne SVG. */
  layers: { id: string; parallax: number; svg: () => string }[];
  ambience: string[];
  sound: string;
  modifiers?: Record<string, number>;
  unlock: { type: 'depart' | 'vagues' | 'chapitre'; value: number };
  /** Arène de boss : id du boss, sinon absent. */
  boss?: string;
}
