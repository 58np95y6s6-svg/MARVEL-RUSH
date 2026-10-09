// Campagne Solo : 6 chapitres × 10 niveaux (docs/campagne.md), en données, et construction de la
// configuration moteur d'un niveau. Module pur (aucun accès au DOM ni au stockage).

import { ROTATING_BOSSES } from '../data/bosses';
import type { BossId, Pack, UnitId } from '../data/types';
import type { GameConfig, PlayerSetup } from '../engine/types';
import type { Profile } from '../meta/profile';

// ---------------------------------------------------------------------------------------------
// Contraintes de la 3e étoile

/** Contrainte bonus (★★★) : descripteur évalué par `evaluateStars` (src/campaign/stars.ts). */
export type Constraint =
  | { kind: 'merges'; min: number }                       // fusionner au moins N fois
  | { kind: 'noLifeLost' }                                // sans perdre de vie
  | { kind: 'powerup'; min: number }                      // améliorer une unité au niveau N (en partie)
  | { kind: 'maxPowerup'; max: number }                   // aucune amélioration au-delà du niveau N
  | { kind: 'rank'; min: number }                         // atteindre une unité de rang N
  | { kind: 'bossTime'; max: number }                     // boss (ou lieutenant) imposé tué en moins de N s
  | { kind: 'summonsBelow'; max: number }                 // moins de N invocations
  | { kind: 'packCount'; pack: Pack; min: number }        // au moins N unités d'un pack dans le deck
  | { kind: 'packEach' }                                  // au moins 1 unité de chaque pack
  | { kind: 'emptyCells'; min: number }                   // garder N cases vides à la fin
  | { kind: 'deckHasAny'; units: UnitId[] }               // avec l'une de ces unités dans le deck
  | { kind: 'team'; teams?: string[]; min?: number }      // bonus d'équipe actif (l'un de `teams`, ou au moins `min`)
  | { kind: 'controlUnits'; min: number }                 // au moins N unités de contrôle
  | { kind: 'endMana'; min: number }                      // finir avec N mana ou plus
  | { kind: 'noLeak'; enemy: 'blinde' | 'bouclier' }      // aucun ennemi de ce type ne passe
  | { kind: 'noBossLoss' }                                // aucune unité détruite ou rétrogradée par un boss
  | { kind: 'noRankLoss' }                                // aucune unité ne perd de rang
  | { kind: 'maxSleep'; max: number };                    // aucune unité endormie plus de N s

// ---------------------------------------------------------------------------------------------
// Chapitres

export interface ChapterDef {
  n: number;
  name: string;            // « New York »
  zone: string;            // sous-titre (maps de la zone)
  boss: BossId;            // boss du niveau 10
  /** Lieutenant imposé au niveau 5 (sbire géant du boss `lieutenantOf`). */
  lieutenant: string;
  lieutenantOf: BossId;
  /** Nom du lieutenant du niveau 10 (annonce le boss final). */
  bossLieutenant: string;
  /** Personnage garanti à la première victoire du niveau 10 (ch. 1 : Spider-Man s'il manque, sinon Venom). */
  hero: UnitId;
  heroAlt?: UnitId;
  /** Étoiles de la campagne nécessaires pour ouvrir le chapitre (en plus du niveau 10 précédent). */
  unlockStars: number;
  /** Map de l'illustration du chapitre. */
  artMap: string;
}

export const CHAPTERS: ChapterDef[] = [
  { n: 1, name: 'New York', zone: 'Toits, atelier Stark et base des Avengers', boss: 'bouffon', lieutenant: 'Citrouille-bombe géante', lieutenantOf: 'bouffon', bossLieutenant: 'Citrouille-bombe géante', hero: 'spiderman', heroAlt: 'venom', unlockStars: 0, artMap: 'toits-new-york' },
  { n: 2, name: 'Asgard et le Sanctum', zone: 'Bifrost, Sanctum et temple des Dix Anneaux', boss: 'galactus', lieutenant: 'Drone-sentinelle', lieutenantOf: 'galactus', bossLieutenant: 'Drone-sentinelle', hero: 'thor', unlockStars: 0, artMap: 'asgard-bifrost' },
  { n: 3, name: 'L’Océan', zone: 'Motunui, Atlantica et le récif', boss: 'ursula', lieutenant: 'Flotsam, la murène', lieutenantOf: 'ursula', bossLieutenant: 'Flotsam, la murène', hero: 'moana', unlockStars: 30, artMap: 'ile-motunui' },
  { n: 4, name: 'L’Empire', zone: 'Palais impérial et Zootopie', boss: 'jafar', lieutenant: 'Cobra royal', lieutenantOf: 'jafar', bossLieutenant: 'Cobra royal', hero: 'mulan', unlockStars: 60, artMap: 'palais-imperial' },
  { n: 5, name: 'Le Monde des jouets', zone: 'Chambre d’Andy et Sugar Rush', boss: 'cruella', lieutenant: 'Jasper, l’homme de main', lieutenantOf: 'cruella', bossLieutenant: 'Jasper, l’homme de main', hero: 'buzzwoody', unlockStars: 95, artMap: 'chambre-andy' },
  { n: 6, name: 'Le Royaume des morts', zone: 'Royaume des morts, tour de Raiponce et Highlands', boss: 'thanos', lieutenant: 'Capitaine gobelin', lieutenantOf: 'malefique', bossLieutenant: 'Outrider alpha', hero: 'coco', unlockStars: 130, artMap: 'royaume-des-morts' },
];

/** Seuils d'étoiles du chapitre ouvrant les 3 coffres d'étoiles. */
export const STAR_CHEST_THRESHOLDS = [10, 20, 30] as const;

// ---------------------------------------------------------------------------------------------
// Niveaux

export interface ImposedBoss {
  kind: 'lieutenant' | 'boss';
  id: BossId;        // boss (ou maître du lieutenant)
  wave: number;      // vague où il apparaît (la dernière du niveau)
  name: string;      // nom affiché
}

export interface CampaignLevel {
  id: string;        // 'c1-n3'
  chapter: number;
  n: number;         // 1..10
  map: string;       // map du niveau (le niveau de boss bascule dans l'arène quand le boss arrive)
  waves: number;     // vagues à tenir
  hpMul: number;     // script.enemyHpMultiplier
  /** Boss ou lieutenant imposé (niveaux 5 et 10, et niveau 8 du chapitre 6). */
  boss?: ImposedBoss;
  /** Gros boss retiré de la rotation (boss du chapitre avant sa première apparition). */
  exclude?: BossId[];
  bonus: Constraint;
}

type Row = [map: string, waves: number, hpMul: number, bonus: Constraint];

const NO_LIFE: Constraint = { kind: 'noLifeLost' };

const ROWS: Row[][] = [
  [ // Chapitre 1 — New York
    ['toits-new-york', 3, 0.55, { kind: 'merges', min: 3 }],
    ['toits-new-york', 4, 0.6, NO_LIFE],
    ['atelier-stark', 4, 0.65, { kind: 'powerup', min: 3 }],
    ['atelier-stark', 4, 0.7, { kind: 'rank', min: 3 }],
    ['toits-new-york', 5, 0.7, { kind: 'bossTime', max: 25 }],
    ['base-avengers', 6, 0.7, { kind: 'summonsBelow', max: 12 }],
    ['base-avengers', 7, 0.75, NO_LIFE],
    ['atelier-stark', 8, 0.75, { kind: 'packCount', pack: 'marvel', min: 3 }],
    ['toits-new-york', 9, 0.8, { kind: 'emptyCells', min: 2 }],
    ['toits-new-york', 10, 0.8, { kind: 'bossTime', max: 40 }],
  ],
  [ // Chapitre 2 — Asgard et le Sanctum
    ['asgard-bifrost', 6, 0.85, NO_LIFE],
    ['asgard-bifrost', 7, 0.85, { kind: 'rank', min: 4 }],
    ['sanctum-sanctorum', 8, 0.9, { kind: 'deckHasAny', units: ['strange', 'loki'] }],
    ['sanctum-sanctorum', 9, 0.9, { kind: 'summonsBelow', max: 15 }],
    ['asgard-bifrost', 5, 1.0, { kind: 'bossTime', max: 20 }],
    ['temple-dix-anneaux', 10, 0.9, { kind: 'maxPowerup', max: 2 }],
    ['temple-dix-anneaux', 11, 0.95, NO_LIFE],
    ['sanctum-sanctorum', 12, 0.95, { kind: 'team', min: 1 }],
    ['asgard-bifrost', 13, 1.0, { kind: 'noBossLoss' }],
    ['asgard-bifrost', 10, 1.0, { kind: 'bossTime', max: 35 }],
  ],
  [ // Chapitre 3 — L'Océan
    ['ile-motunui', 8, 0.95, { kind: 'packCount', pack: 'disney', min: 2 }],
    ['ile-motunui', 10, 0.95, NO_LIFE],
    ['atlantica', 11, 1.0, { kind: 'rank', min: 5 }],
    ['recif-nemo', 12, 1.0, { kind: 'controlUnits', min: 2 }],
    ['atlantica', 15, 0.95, { kind: 'bossTime', max: 20 }],
    ['recif-nemo', 13, 1.0, { kind: 'summonsBelow', max: 20 }],
    ['ile-motunui', 14, 1.0, NO_LIFE],
    ['atlantica', 15, 1.05, { kind: 'team', teams: ['ocean'] }],
    ['recif-nemo', 16, 1.05, { kind: 'endMana', min: 300 }],
    ['ile-motunui', 20, 1.0, { kind: 'bossTime', max: 35 }],
  ],
  [ // Chapitre 4 — L'Empire
    ['palais-imperial', 10, 1.05, NO_LIFE],
    ['palais-imperial', 11, 1.1, { kind: 'rank', min: 5 }],
    ['zootopie', 12, 1.1, { kind: 'packCount', pack: 'disney', min: 3 }],
    ['zootopie', 13, 1.15, { kind: 'noLeak', enemy: 'blinde' }],
    ['palais-imperial', 15, 1.15, { kind: 'bossTime', max: 20 }],
    ['highlands-rebelle', 15, 1.15, { kind: 'summonsBelow', max: 22 }],
    ['zootopie', 16, 1.2, NO_LIFE],
    ['foret-pocahontas', 17, 1.2, { kind: 'team', teams: ['princesses'] }],
    ['palais-imperial', 18, 1.25, { kind: 'rank', min: 6 }],
    ['palais-imperial', 20, 1.25, { kind: 'bossTime', max: 30 }],
  ],
  [ // Chapitre 5 — Le Monde des jouets
    ['chambre-andy', 12, 1.25, NO_LIFE],
    ['chambre-andy', 13, 1.3, { kind: 'team', teams: ['pixar', 'animaux'] }],
    ['sugar-rush', 14, 1.3, { kind: 'noLeak', enemy: 'bouclier' }],
    ['sugar-rush', 15, 1.35, { kind: 'rank', min: 6 }],
    ['chambre-andy', 15, 1.35, { kind: 'bossTime', max: 20 }],
    ['foret-rox-rouky', 16, 1.35, { kind: 'summonsBelow', max: 24 }],
    ['sugar-rush', 17, 1.4, NO_LIFE],
    ['chambre-andy', 18, 1.45, { kind: 'noRankLoss' }],
    ['bayou', 19, 1.5, { kind: 'packEach' }],
    ['sugar-rush', 20, 1.5, { kind: 'bossTime', max: 30 }],
  ],
  [ // Chapitre 6 — Le Royaume des morts
    ['royaume-des-morts', 14, 1.5, NO_LIFE],
    ['royaume-des-morts', 15, 1.55, { kind: 'rank', min: 6 }],
    ['tour-raiponce', 16, 1.55, { kind: 'maxSleep', max: 3 }],
    ['royaume-des-morts', 17, 1.6, { kind: 'summonsBelow', max: 26 }],
    ['tour-raiponce', 15, 1.6, { kind: 'bossTime', max: 20 }],
    ['royaume-des-morts', 18, 1.65, NO_LIFE],
    ['highlands-rebelle', 19, 1.7, { kind: 'rank', min: 7 }],
    ['royaume-des-morts', 20, 1.7, { kind: 'bossTime', max: 30 }],
    ['royaume-des-morts', 20, 1.75, { kind: 'team', min: 2 }],
    ['royaume-des-morts', 20, 1.8, NO_LIFE],
  ],
];

function buildLevels(): CampaignLevel[] {
  const out: CampaignLevel[] = [];
  ROWS.forEach((rows, ci) => {
    const ch = CHAPTERS[ci]!;
    rows.forEach(([map, waves, hpMul, bonus], ni) => {
      const n = ni + 1;
      const lvl: CampaignLevel = { id: levelId(ch.n, n), chapter: ch.n, n, map, waves, hpMul, bonus };
      if (n === 5) lvl.boss = { kind: 'lieutenant', id: ch.lieutenantOf, wave: waves, name: ch.lieutenant };
      if (n === 10) lvl.boss = { kind: 'boss', id: ch.boss, wave: waves, name: bossDisplayName(ch.boss) };
      // Chapitre 6, niveau 8 : Maléfique dans son arène (boss intermédiaire).
      if (ch.n === 6 && n === 8) lvl.boss = { kind: 'boss', id: 'malefique', wave: waves, name: bossDisplayName('malefique') };
      // Le boss du chapitre n'apparaît pas avant son niveau ni avant la dernière vague de ce niveau
      // (rotation sans lui ; au ch. 6, sans Maléfique jusqu'au niveau 8, Thanos étant hors rotation).
      const firstBossLevel = ch.n === 6 ? 8 : 10;
      const rotBoss = ch.n === 6 ? 'malefique' : ch.boss;
      if (n <= firstBossLevel) lvl.exclude = [rotBoss];
      out.push(lvl);
    });
  });
  return out;
}

const BOSS_NAMES: Record<BossId, string> = {
  jafar: 'Jafar & Iago', cruella: 'Cruella', ursula: 'Ursula', malefique: 'Maléfique',
  galactus: 'Galactus', bouffon: 'Bouffon Vert', thanos: 'Thanos',
};
export function bossDisplayName(id: BossId): string { return BOSS_NAMES[id]; }

export const levelId = (chapter: number, n: number): string => `c${chapter}-n${n}`;

export const LEVELS: CampaignLevel[] = buildLevels();
const BY_ID = new Map(LEVELS.map((l) => [l.id, l]));

export function getLevel(id: string): CampaignLevel | undefined { return BY_ID.get(id); }
export function getChapter(n: number): ChapterDef | undefined { return CHAPTERS[n - 1]; }
export function chapterLevels(chapter: number): CampaignLevel[] { return LEVELS.filter((l) => l.chapter === chapter); }
/** Niveau suivant dans la campagne (null après le dernier). */
export function nextLevel(l: CampaignLevel): CampaignLevel | null {
  return getLevel(levelId(l.chapter, l.n + 1)) ?? getLevel(levelId(l.chapter + 1, 1)) ?? null;
}

/** Personnage garanti du chapitre pour ce profil (ch. 1 : Spider-Man s'il manque, sinon Venom). */
export function guaranteedHero(ch: ChapterDef, profile: Profile | null): UnitId {
  if (ch.heroAlt && profile?.heroes[ch.hero]) return ch.heroAlt;
  return ch.hero;
}

// ---------------------------------------------------------------------------------------------
// Libellés

export function constraintLabel(c: Constraint, level?: CampaignLevel): string {
  switch (c.kind) {
    case 'merges': return `Fusionner au moins ${c.min} fois`;
    case 'noLifeLost': return level?.boss?.id === 'thanos' ? 'Thanos tué sans perdre de vie' : 'Sans perdre de vie';
    case 'powerup': return `Améliorer une unité au niveau ${c.min}`;
    case 'maxPowerup': return `Aucune amélioration au-delà du niveau ${c.max}`;
    case 'rank': return c.min === 3 ? 'Atteindre une unité de rang 3' : `Une unité de rang ${c.min}`;
    case 'bossTime': {
      const who = level?.boss ? (level.boss.kind === 'lieutenant' ? shortName(level.boss.name) : 'Boss') : 'Boss';
      return `${who} tué en moins de ${c.max} s`;
    }
    case 'summonsBelow': return `Moins de ${c.max} invocations`;
    case 'packCount': return `Avec au moins ${c.min} unités ${c.pack === 'marvel' ? 'Marvel' : 'Disney'}`;
    case 'packEach': return 'Avec au moins 1 unité de chaque pack';
    case 'emptyCells': return `Garder ${c.min} cases vides à la fin`;
    case 'deckHasAny': return c.units.length === 2 && c.units.includes('strange') ? 'Avec Doctor Strange ou Loki dans le deck' : 'Avec une unité imposée';
    case 'team': {
      if (c.teams?.length) {
        const names: Record<string, string> = { ocean: 'Océan', princesses: 'Princesses', pixar: 'Duos Pixar', animaux: 'Animaux' };
        return `Bonus d’équipe ${c.teams.map((t) => names[t] ?? t).join(' ou ')} actif`;
      }
      return (c.min ?? 1) >= 2 ? 'Deux bonus d’équipe actifs' : 'Un bonus d’équipe actif';
    }
    case 'controlUnits': return `Au moins ${c.min} unités de contrôle`;
    case 'endMana': return `Finir avec ${c.min} de mana ou plus`;
    case 'noLeak': return c.enemy === 'blinde' ? 'Aucun blindé ne passe' : 'Aucun bouclier ne passe';
    case 'noBossLoss': return 'Aucune unité détruite ou rétrogradée par un boss';
    case 'noRankLoss': return 'Aucune unité ne perd de rang';
    case 'maxSleep': return `Aucune unité endormie plus de ${c.max} s`;
  }
}

/** « Flotsam, la murène » → « Flotsam » ; « Cobra royal » → « Cobra » (libellé court de contrainte). */
function shortName(name: string): string {
  if (name.includes(',')) return name.split(',')[0]!;
  if (name.startsWith('Citrouille')) return 'Lieutenant';
  if (name.startsWith('Drone')) return 'Lieutenant';
  return name.split(' ')[0]!;
}

/** Pictogramme de la contrainte (carte de niveau). */
export function constraintIcon(c: Constraint): string {
  switch (c.kind) {
    case 'merges': return '🔗';
    case 'noLifeLost': return '❤️';
    case 'powerup': case 'maxPowerup': return '⬆️';
    case 'rank': return '🎖️';
    case 'bossTime': return '⏱️';
    case 'summonsBelow': return '🎲';
    case 'packCount': case 'packEach': case 'deckHasAny': return '🃏';
    case 'emptyCells': return '⬜';
    case 'team': return '🤝';
    case 'controlUnits': return '🌀';
    case 'endMana': return '💧';
    case 'noLeak': return '🛡️';
    case 'noBossLoss': case 'noRankLoss': return '🔰';
    case 'maxSleep': return '💤';
  }
}

// ---------------------------------------------------------------------------------------------
// Configuration moteur

/** Petit hachage déterministe (choix du boss de rotation imposé, cartes au hasard). */
export function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Joueur moteur à partir du deck et du profil (niveaux de collection, talents, éveils). */
export function playerSetup(deck: UnitId[], profile: Profile | null): PlayerSetup {
  const levels: PlayerSetup['levels'] = {};
  const talents: PlayerSetup['talents'] = {};
  const awakening: NonNullable<PlayerSetup['awakening']> = {};
  for (const u of deck) {
    const h = profile?.heroes[u];
    if (!h) continue;
    levels[u] = h.level;
    const picks: ('a' | 'b')[] = [];
    for (const t of h.talents) { if (t === null) break; picks.push(t === 0 ? 'a' : 'b'); }
    if (picks.length) talents[u] = picks;
    if (h.awakening > 0) awakening[u] = h.awakening;
  }
  return { id: 'p1', deck: deck.slice(), levels, talents, awakening };
}

/**
 * Configuration moteur d'un niveau. Campagne : modificateurs de map désactivés.
 * - Niveau 5 (lieutenant à la vague 5) : `miniBoss` + `endOnBossKill`.
 * - Niveau 5 à 15 vagues : le lieutenant du boss du chapitre arrive à la vague 15 par `bossOrder`
 *   (le gros boss de la vague 10 est tiré dans la rotation sans le boss du chapitre). `miniBoss`
 *   n'est pas utilisé ici car le moteur l'applique à toutes les vagues de petit boss (5 et 15).
 *   La partie se gagne à la fin de la vague 15, c'est-à-dire à la mort du lieutenant.
 * - Niveau 10 (et 8 du ch. 6) : boss imposé à la dernière vague + `endOnBossKill` ; la scène bascule
 *   dans son arène à son arrivée.
 */
export function levelConfig(level: CampaignLevel, deck: UnitId[], profile: Profile | null, seed?: number): GameConfig {
  const s = seed ?? (hash32(`${level.id}:${Date.now()}`) >>> 0);
  const script: NonNullable<GameConfig['script']> = { enemyHpMultiplier: level.hpMul };
  if (level.exclude?.length) script.excludeBosses = level.exclude.slice();
  const b = level.boss;
  if (b?.kind === 'lieutenant') {
    if (b.wave < 10) {
      script.miniBoss = b.id;
      script.bossAtWave = b.wave;
      script.endOnBossKill = true;
    } else {
      const pool = ROTATING_BOSSES.filter((x) => x !== b.id && !(level.exclude ?? []).includes(x));
      const rot = pool[hash32(`${level.id}:${s}`) % pool.length]!;
      script.bossOrder = [rot, b.id];
    }
  } else if (b?.kind === 'boss') {
    script.bossId = b.id;
    script.bossAtWave = b.wave;
    script.endOnBossKill = true;
  }
  return {
    mode: 'solo',
    seed: s,
    mapId: level.map,
    players: [playerSetup(deck, profile)],
    targetWaves: level.waves,
    mapModifiers: {},
    script,
  };
}
