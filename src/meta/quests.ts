// Quêtes quotidiennes et coffre de la semaine (façon Rush Royale). Logique pure, testée sans DOM.
// - 3 quêtes par jour, tirées au sort (graine = jour + profil), remises à zéro à minuit (heure locale) ;
// - chaque quête finie se réclame : or + gemmes ;
// - 12 quêtes réclamées dans la semaine (lundi → dimanche) ouvrent le coffre de la semaine
//   (coffre légendaire + 150 gemmes + 40 ✦ + un lot de 10 tirages offert : au moins 2 lots de 10 par semaine).

import { hash32 } from '../campaign/levels';
import { openChest, seededRng, type ChestContent, type Rng } from './chests';
import { questRookieGems } from './gems';
import { today, type Profile, type QuestState, type Reward } from './profile';

export type QuestId = 'fusions' | 'boss' | 'niveaux' | 'vagues' | 'invocations' | 'ameliorer' | 'etoiles' | 'infini';

export interface QuestDef {
  id: QuestId;
  target: number;
  /** « Fusionne 30 fois » : le nombre est remplacé par la cible. */
  label: (n: number) => string;
  reward: { gold: number; gems: number };
  /** Mode de mesure : somme sur la journée, ou meilleur score. */
  max?: boolean;
  /** Proposée seulement si le Solo Infini est ouvert. */
  needsInfinite?: boolean;
}

const s = (n: number, one: string, many: string) => (n > 1 ? many : one);
export const QUEST_DEFS: Record<QuestId, QuestDef> = {
  fusions: { id: 'fusions', target: 30, label: (n) => `Fusionne ${n} fois`, reward: { gold: 300, gems: 25 } },
  boss: { id: 'boss', target: 2, label: (n) => `Bats ${n} ${s(n, 'boss', 'boss')}`, reward: { gold: 400, gems: 30 } },
  niveaux: { id: 'niveaux', target: 3, label: (n) => `Gagne ${n} ${s(n, 'niveau', 'niveaux')} de campagne`, reward: { gold: 400, gems: 30 } },
  vagues: { id: 'vagues', target: 40, label: (n) => `Tiens ${n} vagues`, reward: { gold: 300, gems: 25 } },
  invocations: { id: 'invocations', target: 80, label: (n) => `Invoque ${n} héros`, reward: { gold: 250, gems: 25 } },
  ameliorer: { id: 'ameliorer', target: 1, label: () => 'Améliore un héros', reward: { gold: 250, gems: 25 } },
  etoiles: { id: 'etoiles', target: 3, label: (n) => `Gagne ${n} ${s(n, 'étoile', 'étoiles')}`, reward: { gold: 300, gems: 30 } },
  infini: { id: 'infini', target: 15, label: (n) => `Atteins la vague ${n} en Solo Infini`, reward: { gold: 500, gems: 35 }, max: true, needsInfinite: true },
};
export const QUESTS_PER_DAY = 3;
/** Quêtes à réclamer dans la semaine pour le coffre de la semaine. */
export const WEEKLY_GOAL = 12;
export const WEEKLY_BONUS_GEMS = 150;
export const WEEKLY_BONUS_CRYSTALS = 40;
/** Lot de 10 tirages offert par le coffre de la semaine. */
export const WEEKLY_BONUS_PULLS = 10;

/** Lundi de la semaine d'un jour AAAA-MM-JJ (heure locale). */
export function weekOf(day: string): string {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - ((dt.getDay() + 6) % 7));
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

/** Tirage des 3 quêtes du jour (déterministe pour un jour et un profil). */
export function rollQuests(day: string, profileId: string, infinite: boolean): QuestState['list'] {
  const rng = seededRng(hash32(`${day}:${profileId}:quetes`));
  const pool = (Object.values(QUEST_DEFS) as QuestDef[]).filter((q) => infinite || !q.needsInfinite);
  const out: QuestState['list'] = [];
  while (out.length < QUESTS_PER_DAY && pool.length) {
    const q = pool.splice(Math.floor(rng() * pool.length), 1)[0]!;
    out.push({ id: q.id, target: q.target, progress: 0, claimed: false });
  }
  return out;
}

/** Quêtes du jour : remises à zéro si le jour (ou la semaine) a changé. Mutation. */
export function ensureQuests(p: Profile, day = today()): QuestState {
  const infinite = p.campaign['c1-n10']?.stars[0] === true;
  let q = p.quests;
  const week = weekOf(day);
  if (!q || q.week !== week) q = { day: '', list: [], week, weekDone: 0, weekClaimed: false };
  if (q.day !== day) { q.day = day; q.list = rollQuests(day, p.id, infinite); }
  p.quests = q;
  return q;
}

/** Ce qu'une partie (ou une action) fait avancer. */
export interface QuestEvent {
  merges?: number;
  summons?: number;
  bossKills?: number;
  levelsWon?: number;
  waves?: number;
  stars?: number;
  upgrades?: number;
  /** Vague atteinte en Solo Infini (meilleur score du jour). */
  infiniteWave?: number;
}

const FIELD: Record<QuestId, keyof QuestEvent> = {
  fusions: 'merges', boss: 'bossKills', niveaux: 'levelsWon', vagues: 'waves', invocations: 'summons',
  ameliorer: 'upgrades', etoiles: 'stars', infini: 'infiniteWave',
};

/** Fait avancer les quêtes du jour. Renvoie les quêtes qui viennent d'être terminées. Mutation. */
export function trackQuests(p: Profile, ev: QuestEvent, day = today()): QuestId[] {
  const q = ensureQuests(p, day);
  const done: QuestId[] = [];
  for (const it of q.list) {
    const def = QUEST_DEFS[it.id as QuestId];
    if (!def || it.progress >= it.target) continue;
    const v = Math.max(0, Math.floor(ev[FIELD[def.id]] ?? 0));
    if (!v) continue;
    it.progress = Math.min(it.target, def.max ? Math.max(it.progress, v) : it.progress + v);
    if (it.progress >= it.target) done.push(def.id);
  }
  return done;
}

export const questDef = (id: string): QuestDef | undefined => QUEST_DEFS[id as QuestId];

/** Réclame la récompense d'une quête terminée. null si impossible. Mutation. */
export function claimQuest(p: Profile, index: number, day = today()): Reward | null {
  const q = ensureQuests(p, day);
  const it = q.list[index];
  const def = it && questDef(it.id);
  if (!it || !def || it.claimed || it.progress < it.target) return null;
  it.claimed = true;
  q.weekDone += 1;
  // Débutant (compte sous le niveau 15) : +20 gemmes par quête.
  const gems = def.reward.gems + questRookieGems(p.xp);
  p.gold = (p.gold ?? 0) + def.reward.gold;
  p.shards += gems;
  return { gold: def.reward.gold, shards: gems };
}

export function weeklyReady(p: Profile, day = today()): boolean {
  const q = ensureQuests(p, day);
  return !q.weekClaimed && q.weekDone >= WEEKLY_GOAL;
}

/** Coffre de la semaine : coffre légendaire + 150 gemmes + 40 ✦ + 10 tirages offerts. null s'il n'est pas prêt. Mutation. */
export function claimWeekly(p: Profile, rng: Rng = Math.random, day = today()): ChestContent | null {
  if (!weeklyReady(p, day)) return null;
  p.quests!.weekClaimed = true;
  return openChest(p, 'legendaire', rng, { gems: WEEKLY_BONUS_GEMS, crystals: WEEKLY_BONUS_CRYSTALS, freePulls: WEEKLY_BONUS_PULLS });
}

/** Nombre de récompenses à réclamer (pastille de l'accueil). Lecture seule. */
export function questsClaimable(p: Profile, day = today()): number {
  const q = p.quests;
  if (!q || q.day !== day) return 0;
  const n = q.list.filter((x) => !x.claimed && x.progress >= x.target).length;
  return n + (q.week === weekOf(day) && !q.weekClaimed && q.weekDone >= WEEKLY_GOAL ? 1 : 0);
}
