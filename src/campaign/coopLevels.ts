// Campagne Coop : 6 chapitres × 10 niveaux à deux (docs/campagne-coop.md), en données, et configuration
// moteur d'un niveau. Même structure que la campagne Solo (src/campaign/levels.ts) : un niveau Coop reprend le
// nombre de vagues et les réglages de difficulté du niveau Solo de même numéro (refonte d'octobre 2026), avec
// sa map et sa contrainte d'entraide. Module pur.

import type { GameConfig, PlayerSetup } from '../engine/types';
import type { BattleStats } from './tracker';
import { UNITS } from '../data/units';
import { activeTeams } from '../data/teams';
import type { UnitId } from '../data/types';
import { CHAPTERS, LEVELS, bossDisplayName, constraintLabel, hash32, type CampaignLevel, type ChapterDef, type Constraint } from './levels';

/** Contrainte ★★★ d'un niveau Coop : celles du Solo, plus les contraintes d'entraide. */
export type CoopConstraint =
  | Constraint
  | { kind: 'gifts'; min: number }                   // offrir au moins N unités (à deux)
  | { kind: 'bothRank'; min: number }                // les deux joueurs ont une unité de rang N
  | { kind: 'killShare'; min: number }               // chaque joueur fait au moins N % des éliminations
  | { kind: 'summonsEach'; max: number }             // moins de N invocations chacun
  | { kind: 'teamBoth' }                             // un bonus d'équipe actif chez chaque joueur
  | { kind: 'teamAny'; teams: string[] }             // ce bonus d'équipe chez au moins un joueur
  | { kind: 'packBoth'; pack: 'marvel' | 'disney'; min: number } // N unités de ce pack chez chaque joueur
  | { kind: 'mixedPacks' };                          // un joueur Marvel majoritaire, l'autre Disney

export interface CoopLevel extends Omit<CampaignLevel, 'id' | 'bonus'> {
  id: string;            // 'cc1-n3'
  bonus: CoopConstraint;
}

type Row = [map: string, bonus: CoopConstraint];
const NO_LIFE: Constraint = { kind: 'noLifeLost' };
const BT = (max: number): Constraint => ({ kind: 'bossTime', max });

/** Maps et contraintes du doc (§2), chapitre par chapitre. « Dégâts » → éliminations (le moteur les attribue). */
const ROWS: Row[][] = [
  [
    ['toits-new-york', { kind: 'gifts', min: 1 }], ['toits-new-york', NO_LIFE], ['atelier-stark', { kind: 'killShare', min: 30 }],
    ['atelier-stark', { kind: 'bothRank', min: 3 }], ['toits-new-york', BT(20)], ['base-avengers', { kind: 'gifts', min: 2 }],
    ['base-avengers', NO_LIFE], ['atelier-stark', { kind: 'summonsEach', max: 25 }], ['toits-new-york', { kind: 'killShare', min: 30 }],
    ['toits-new-york', BT(35)],
  ],
  [
    ['asgard-bifrost', { kind: 'gifts', min: 2 }], ['asgard-bifrost', NO_LIFE], ['sanctum-sanctorum', { kind: 'teamBoth' }],
    ['sanctum-sanctorum', { kind: 'killShare', min: 30 }], ['asgard-bifrost', BT(20)], ['temple-dix-anneaux', { kind: 'summonsEach', max: 32 }],
    ['temple-dix-anneaux', NO_LIFE], ['sanctum-sanctorum', { kind: 'bothRank', min: 5 }], ['asgard-bifrost', { kind: 'noBossLoss' }],
    ['asgard-bifrost', BT(35)],
  ],
  [
    ['ile-motunui', { kind: 'packBoth', pack: 'disney', min: 2 }], ['ile-motunui', NO_LIFE], ['atlantica', { kind: 'gifts', min: 3 }],
    ['recif-nemo', { kind: 'killShare', min: 30 }], ['atlantica', BT(20)], ['recif-nemo', { kind: 'summonsEach', max: 40 }],
    ['ile-motunui', NO_LIFE], ['atlantica', { kind: 'teamAny', teams: ['ocean'] }], ['recif-nemo', { kind: 'bothRank', min: 6 }],
    ['ile-motunui', BT(35)],
  ],
  [
    ['palais-imperial', NO_LIFE], ['palais-imperial', { kind: 'gifts', min: 3 }], ['zootopie', { kind: 'noLeak', enemy: 'blinde' }],
    ['zootopie', { kind: 'killShare', min: 30 }], ['palais-imperial', BT(20)], ['highlands-rebelle', { kind: 'summonsEach', max: 48 }],
    ['zootopie', NO_LIFE], ['foret-pocahontas', { kind: 'teamAny', teams: ['princesses'] }], ['palais-imperial', { kind: 'bothRank', min: 6 }],
    ['palais-imperial', BT(30)],
  ],
  [
    ['chambre-andy', NO_LIFE], ['chambre-andy', { kind: 'teamAny', teams: ['pixar', 'animaux'] }], ['sugar-rush', { kind: 'noLeak', enemy: 'bouclier' }],
    ['sugar-rush', { kind: 'gifts', min: 4 }], ['chambre-andy', BT(20)], ['foret-rox-rouky', { kind: 'summonsEach', max: 60 }],
    ['sugar-rush', NO_LIFE], ['chambre-andy', { kind: 'noRankLoss' }], ['bayou', { kind: 'mixedPacks' }],
    ['sugar-rush', BT(30)],
  ],
  [
    ['royaume-des-morts', NO_LIFE], ['royaume-des-morts', { kind: 'bothRank', min: 6 }], ['tour-raiponce', { kind: 'maxSleep', max: 3 }],
    ['royaume-des-morts', { kind: 'gifts', min: 5 }], ['tour-raiponce', BT(20)], ['royaume-des-morts', { kind: 'killShare', min: 30 }],
    ['highlands-rebelle', NO_LIFE], ['royaume-des-morts', BT(30)], ['royaume-des-morts', { kind: 'teamBoth' }],
    ['royaume-des-morts', NO_LIFE],
  ],
];

/** Vagues Coop plus fortes que le Solo (en plus du double flot des deux portails). */
export const COOP_HP_FACTOR = 1.1;

export const coopLevelId = (chapter: number, n: number): string => `cc${chapter}-n${n}`;

/** Chapitres Coop codés : ceux qui ont leurs maps et contraintes ci-dessus (1 à 6). Les chapitres Coop des
 *  extensions (DC 7 à 9…) ne sont pour l'instant que dans le document : ils n'apparaissent pas dans l'écran Coop. */
export const COOP_CHAPTERS: number[] = ROWS.map((_, i) => i + 1);

export const COOP_LEVELS: CoopLevel[] = LEVELS.filter((l) => !!ROWS[l.chapter - 1]).map((l) => {
  const row = ROWS[l.chapter - 1]?.[l.n - 1];
  return { ...l, id: coopLevelId(l.chapter, l.n), map: row?.[0] ?? l.map, bonus: row?.[1] ?? l.bonus, hpMul: Math.round(l.hpMul * COOP_HP_FACTOR * 100) / 100 };
});
const BY_ID = new Map(COOP_LEVELS.map((l) => [l.id, l]));
export const getCoopLevel = (id: string): CoopLevel | undefined => BY_ID.get(id);
export const coopChapterLevels = (ch: number): CoopLevel[] => COOP_LEVELS.filter((l) => l.chapter === ch);
export const coopChapter = (n: number): ChapterDef | undefined => CHAPTERS[n - 1];

export function coopConstraintLabel(c: CoopConstraint, level?: CoopLevel): string {
  switch (c.kind) {
    case 'gifts': return `Offrir au moins ${c.min} unité${c.min > 1 ? 's' : ''}`;
    case 'bothRank': return `Les deux joueurs ont une unité de rang ${c.min}`;
    case 'killShare': return `Chaque joueur fait au moins ${c.min} % des éliminations`;
    case 'summonsEach': return `Moins de ${c.max} invocations chacun`;
    case 'teamBoth': return 'Un bonus d’équipe actif chez chaque joueur';
    case 'teamAny': return `Bonus d’équipe ${c.teams.map((t) => ({ ocean: 'Océan', princesses: 'Princesses', pixar: 'Duos Pixar', animaux: 'Animaux' } as Record<string, string>)[t] ?? t).join(' ou ')} chez l’un de vous`;
    case 'packBoth': return `Au moins ${c.min} unités ${c.pack === 'disney' ? 'Disney' : 'Marvel'} chacun`;
    case 'mixedPacks': return 'Un deck Marvel, l’autre Disney (majoritaires)';
    default: return constraintLabel(c, level as unknown as CampaignLevel);
  }
}

/** Statistiques du duo pour les étoiles (évaluées par l'hôte). */
export interface DuoStats {
  won: boolean;
  livesLeft: number;
  wave: number;
  players: (BattleStats & { deck: UnitId[]; kills: number })[];
  gifts: number;
}

const majority = (deck: UnitId[], pack: string) => deck.filter((u) => UNITS[u]?.pack === pack).length >= 3;

/** ★ victoire, ★★ au moins 2 vies partagées, ★★★ contrainte d'entraide. */
export function evaluateCoopStars(level: CoopLevel, d: DuoStats): [boolean, boolean, boolean] {
  if (!d.won) return [false, false, false];
  const [a, b] = d.players;
  if (!a || !b) return [true, d.livesLeft >= 2, false];
  const c = level.bonus;
  const totalKills = a.kills + b.kills;
  let ok: boolean;
  switch (c.kind) {
    case 'gifts': ok = d.gifts >= c.min; break;
    case 'bothRank': ok = a.maxRank >= c.min && b.maxRank >= c.min; break;
    case 'killShare': ok = totalKills > 0 && Math.min(a.kills, b.kills) / totalKills >= c.min / 100; break;
    case 'summonsEach': ok = a.summons < c.max && b.summons < c.max; break;
    case 'teamBoth': ok = activeTeams(a.deck).length > 0 && activeTeams(b.deck).length > 0; break;
    case 'teamAny': ok = [a, b].some((p) => activeTeams(p.deck).some((t) => c.teams.includes(t.id))); break;
    case 'packBoth': ok = [a, b].every((p) => p.deck.filter((u) => UNITS[u]?.pack === c.pack).length >= c.min); break;
    case 'mixedPacks': ok = (majority(a.deck, 'marvel') && majority(b.deck, 'disney')) || (majority(a.deck, 'disney') && majority(b.deck, 'marvel')); break;
    case 'noLifeLost': ok = d.livesLeft >= 3; break;
    case 'bossTime': {
      const bw = level.boss;
      const kill = [...a.bossKills, ...b.bossKills].find((k) => (bw ? k.wave === bw.wave : true));
      ok = !!kill && kill.time < c.max; break;
    }
    case 'noBossLoss': ok = [a, b].every((p) => p.bossDestroyed === 0 && p.bossDowngraded === 0); break;
    case 'noRankLoss': ok = a.bossDowngraded === 0 && b.bossDowngraded === 0; break;
    case 'maxSleep': ok = Math.max(a.maxSleep, b.maxSleep) <= c.max + 1e-6; break;
    case 'noLeak': ok = ((a.leaked[c.enemy] ?? 0) + (b.leaked[c.enemy] ?? 0)) === 0; break;
    default: ok = false;
  }
  return [true, d.livesLeft >= 2, ok];
}

/** Configuration moteur d'un niveau Coop (fusionnée par l'hôte dans la configuration de la partie). */
export function coopLevelConfig(level: CoopLevel, seed?: number): Partial<GameConfig> & { players?: PlayerSetup[] } {
  const script: NonNullable<GameConfig['script']> = {
    enemyHpMultiplier: level.hpMul, enemyCountMultiplier: level.countMul, bossHpMultiplier: level.bossHpMul, waveHpGrowth: level.growth,
  };
  if (level.exclude?.length) script.excludeBosses = level.exclude.slice();
  const b = level.boss;
  if (b?.kind === 'lieutenant') { script.miniBoss = b.id; script.bossAtWave = b.wave; script.endOnBossKill = true; }
  else if (b?.kind === 'boss') { script.bossId = b.id; script.bossAtWave = b.wave; script.endOnBossKill = true; }
  return { mapId: level.map, targetWaves: level.waves, mapModifiers: {}, script, seed: seed ?? hash32(`${level.id}:${Date.now()}`) };
}

/** Chapitre Coop ouvert : les deux joueurs ont fini le chapitre Solo correspondant. */
export function coopChapterOpen(ch: number, mine: number[], partner: number[]): boolean {
  return mine.includes(ch) && partner.includes(ch);
}

/** Niveau ouvert : chapitre ouvert, et niveau précédent gagné (le niveau 1 est ouvert d'office). */
export function coopLevelOpen(level: CoopLevel, results: Record<string, { stars: boolean[] }> | undefined, mine: number[], partner: number[]): boolean {
  if (!coopChapterOpen(level.chapter, mine, partner)) return false;
  if (level.n === 1) return true;
  return !!results?.[coopLevelId(level.chapter, level.n - 1)]?.stars[0];
}

export const coopLevelTitle = (l: CoopLevel): string => `Coop ${l.chapter}-${l.n}${l.boss ? ` · ${l.boss.kind === 'boss' ? bossDisplayName(l.boss.id) : l.boss.name}` : ''}`;
