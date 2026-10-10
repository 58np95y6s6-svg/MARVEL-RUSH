// Campagne Solo : 6 chapitres × 10 niveaux (docs/campagne.md), en données, et construction de la
// configuration moteur d'un niveau. Module pur (aucun accès au DOM ni au stockage).

import { BOSSES } from '../data/bosses';
import type { BossId, BossPool, Pack, UnitId } from '../data/types';
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
  hpMul: number;     // script.enemyHpMultiplier (PV de tous les ennemis)
  countMul: number;  // script.enemyCountMultiplier (nombre d'ennemis par vague)
  bossHpMul: number; // script.bossHpMultiplier (PV des boss et lieutenants, en plus de hpMul)
  growth: number;    // script.waveHpGrowth (croissance des PV par vague, plus douce dans les chapitres longs)
  /** Boss ou lieutenant imposé à la dernière vague (niveaux 5 et 10, et niveau 8 du chapitre 6). */
  boss?: ImposedBoss;
  /** Gros boss retiré de la rotation (boss du chapitre avant sa première apparition). */
  exclude?: BossId[];
  bonus: Constraint;
}

type Row = [map: string, waves: number, bonus: Constraint];

const NO_LIFE: Constraint = { kind: 'noLifeLost' };

/**
 * Vagues : 10 → 15 au chapitre 1, puis de plus en plus (15-20, 20-25, 25-30, 30-40, 40-50). Dans un
 * chapitre, les vagues montent de niveau en niveau ; les niveaux de boss (5 et 10) sont en haut de la
 * fourchette du chapitre. Le dernier niveau de la campagne finit sur Thanos à la vague 50.
 */
const ROWS: Row[][] = [
  [ // Chapitre 1 — New York
    ['toits-new-york', 10, { kind: 'merges', min: 3 }],
    ['toits-new-york', 11, NO_LIFE],
    ['atelier-stark', 12, { kind: 'powerup', min: 3 }],
    ['atelier-stark', 13, { kind: 'rank', min: 3 }],
    ['toits-new-york', 15, { kind: 'bossTime', max: 25 }],
    ['base-avengers', 13, { kind: 'summonsBelow', max: 30 }],
    ['base-avengers', 14, NO_LIFE],
    ['atelier-stark', 14, { kind: 'packCount', pack: 'marvel', min: 3 }],
    ['toits-new-york', 15, { kind: 'emptyCells', min: 2 }],
    ['toits-new-york', 15, { kind: 'bossTime', max: 40 }],
  ],
  [ // Chapitre 2 — Asgard et le Sanctum
    ['asgard-bifrost', 15, NO_LIFE],
    ['asgard-bifrost', 16, { kind: 'rank', min: 4 }],
    ['sanctum-sanctorum', 17, { kind: 'deckHasAny', units: ['strange', 'loki'] }],
    ['sanctum-sanctorum', 18, { kind: 'summonsBelow', max: 40 }],
    ['asgard-bifrost', 20, { kind: 'bossTime', max: 25 }],
    ['temple-dix-anneaux', 17, { kind: 'maxPowerup', max: 2 }],
    ['temple-dix-anneaux', 18, NO_LIFE],
    ['sanctum-sanctorum', 19, { kind: 'team', min: 1 }],
    ['asgard-bifrost', 20, { kind: 'noBossLoss' }],
    ['asgard-bifrost', 20, { kind: 'bossTime', max: 40 }],
  ],
  [ // Chapitre 3 — L'Océan
    ['ile-motunui', 20, { kind: 'packCount', pack: 'disney', min: 2 }],
    ['ile-motunui', 21, NO_LIFE],
    ['atlantica', 22, { kind: 'rank', min: 5 }],
    ['recif-nemo', 23, { kind: 'controlUnits', min: 2 }],
    ['atlantica', 25, { kind: 'bossTime', max: 25 }],
    ['recif-nemo', 22, { kind: 'summonsBelow', max: 50 }],
    ['ile-motunui', 23, NO_LIFE],
    ['atlantica', 24, { kind: 'team', teams: ['ocean'] }],
    ['recif-nemo', 25, { kind: 'endMana', min: 300 }],
    ['ile-motunui', 25, { kind: 'bossTime', max: 40 }],
  ],
  [ // Chapitre 4 — L'Empire
    ['palais-imperial', 25, NO_LIFE],
    ['palais-imperial', 26, { kind: 'rank', min: 5 }],
    ['zootopie', 27, { kind: 'packCount', pack: 'disney', min: 3 }],
    ['zootopie', 28, { kind: 'noLeak', enemy: 'blinde' }],
    ['palais-imperial', 30, { kind: 'bossTime', max: 25 }],
    ['highlands-rebelle', 27, { kind: 'summonsBelow', max: 60 }],
    ['zootopie', 28, NO_LIFE],
    ['foret-pocahontas', 29, { kind: 'team', teams: ['princesses'] }],
    ['palais-imperial', 30, { kind: 'rank', min: 6 }],
    ['palais-imperial', 30, { kind: 'bossTime', max: 40 }],
  ],
  [ // Chapitre 5 — Le Monde des jouets
    ['chambre-andy', 30, NO_LIFE],
    ['chambre-andy', 32, { kind: 'team', teams: ['pixar', 'animaux'] }],
    ['sugar-rush', 34, { kind: 'noLeak', enemy: 'bouclier' }],
    ['sugar-rush', 36, { kind: 'rank', min: 6 }],
    ['chambre-andy', 40, { kind: 'bossTime', max: 25 }],
    ['foret-rox-rouky', 34, { kind: 'summonsBelow', max: 75 }],
    ['sugar-rush', 36, NO_LIFE],
    ['chambre-andy', 38, { kind: 'noRankLoss' }],
    ['bayou', 39, { kind: 'packEach' }],
    ['sugar-rush', 40, { kind: 'bossTime', max: 40 }],
  ],
  [ // Chapitre 6 — Le Royaume des morts
    ['royaume-des-morts', 40, NO_LIFE],
    ['royaume-des-morts', 41, { kind: 'rank', min: 6 }],
    ['tour-raiponce', 42, { kind: 'maxSleep', max: 3 }],
    ['royaume-des-morts', 44, { kind: 'summonsBelow', max: 90 }],
    ['tour-raiponce', 45, { kind: 'bossTime', max: 25 }],
    ['royaume-des-morts', 44, NO_LIFE],
    ['highlands-rebelle', 46, { kind: 'rank', min: 7 }],
    ['royaume-des-morts', 48, { kind: 'bossTime', max: 40 }],
    ['royaume-des-morts', 48, { kind: 'team', min: 2 }],
    ['royaume-des-morts', 50, NO_LIFE],
  ],
];

/**
 * Difficulté (docs/campagne.md §2) : le nombre d'ennemis (`countMul`) et leurs PV (`hpMul`, et
 * `bossHpMul` pour les boss et lieutenants) montent régulièrement sur les 60 niveaux. La croissance
 * des PV d'une vague à l'autre (`growth`) est plus douce dans les chapitres longs, pour que la 50e
 * vague reste à la portée d'une collection de fin de campagne.
 */
export const DIFFICULTY = {
  hp: [1.3, 1.9] as const,         // PV× du niveau 1-1 au niveau 6-10
  count: [1.1, 1.4] as const,      // effectif× (apparitions par vague)
  bossHp: [1.0, 1.3] as const,     // PV× des boss et lieutenants, en plus
  /** Croissance des PV par vague, par chapitre (Solo Infini : 1,18), réglée au simulateur. */
  growth: [1.14, 1.10, 1.10, 1.09, 1.07, 1.0425] as const,
};

const lerp = (a: readonly [number, number], t: number): number => Math.round((a[0] + (a[1] - a[0]) * t) * 100) / 100;

function buildLevels(): CampaignLevel[] {
  const out: CampaignLevel[] = [];
  ROWS.forEach((rows, ci) => {
    const ch = CHAPTERS[ci]!;
    rows.forEach(([map, waves, bonus], ni) => {
      const n = ni + 1;
      const t = (ci * 10 + ni) / 59;
      const lvl: CampaignLevel = {
        id: levelId(ch.n, n), chapter: ch.n, n, map, waves, bonus,
        hpMul: lerp(DIFFICULTY.hp, t), countMul: lerp(DIFFICULTY.count, t), bossHpMul: lerp(DIFFICULTY.bossHp, t),
        growth: DIFFICULTY.growth[ci]!,
      };
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

const BOSS_NAMES: Partial<Record<BossId, string>> = {
  jafar: 'Jafar & Iago', cruella: 'Cruella', ursula: 'Ursula', malefique: 'Maléfique',
  galactus: 'Galactus', bouffon: 'Bouffon Vert', thanos: 'Thanos',
};
export function bossDisplayName(id: BossId): string { return BOSS_NAMES[id] ?? BOSSES[id].name; }

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
 * - Difficulté : `enemyHpMultiplier`, `enemyCountMultiplier`, `bossHpMultiplier` et `waveHpGrowth`.
 * - Niveau 5 : le lieutenant du boss du chapitre (`miniBoss`) à la dernière vague (`bossAtWave`),
 *   victoire à sa mort (`endOnBossKill`). Les autres vagues de petit boss gardent le lieutenant du
 *   gros boss suivant, et les gros boss d'avant sont tirés dans la rotation sans le boss du chapitre.
 * - Niveau 10 (et 8 du ch. 6) : boss imposé à la dernière vague + `endOnBossKill` ; la scène bascule
 *   dans son arène à son arrivée.
 */
export function levelConfig(level: CampaignLevel, deck: UnitId[], profile: Profile | null, seed?: number): GameConfig {
  const s = seed ?? (hash32(`${level.id}:${Date.now()}`) >>> 0);
  const script: NonNullable<GameConfig['script']> = {
    enemyHpMultiplier: level.hpMul,
    enemyCountMultiplier: level.countMul,
    bossHpMultiplier: level.bossHpMul,
    waveHpGrowth: level.growth,
  };
  if (level.exclude?.length) script.excludeBosses = level.exclude.slice();
  const b = level.boss;
  if (b?.kind === 'lieutenant') {
    script.miniBoss = b.id;
    script.bossAtWave = b.wave;
    script.endOnBossKill = true;
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
