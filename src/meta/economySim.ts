// Simulation de l'économie (docs/equilibrage.md §6) avec les VRAIES règles du jeu : coffres, récompenses
// de campagne, Solo Infini, quêtes, Route des récompenses, tirages, montées de niveau et éveils.
// Joueur « régulier » (30 à 45 min par jour), jour par jour, hasard à graine. Pur : aucun DOM ni stockage.
// Utilisé par `scripts/economie.ts` (tableau) et par tests/meta/economySim.test.ts (garde-fous de rythme).

import type { BossId, UnitId } from '../data/types';
import { STARTER_DECKS, UNITS } from '../data/units';
import { LEVELS, getLevel, hash32 } from '../campaign/levels';
import { addReward, levelRewards, recordLevel, type Stars } from '../campaign/progress';
import { bossKillGold, openChest, seededRng } from './chests';
import { applyStarter } from './decks';
import { accountLevel, applyInfiniteGame, awaken, awakeningCost, canAfford, claimDailyChest, levelUp, levelUpCost } from './economy';
import { applyReward, blankProfile, type Profile } from './profile';
import { claimWelcome } from './gems';
import { buyPulls, firstTenPending, openFreePulls, pullPacks } from './pulls';
import { claimQuest, claimWeekly, ensureQuests } from './quests';
import { claimRoad, roadClaimable } from './road';

export interface SimOptions {
  days: number;
  seed: number;
  /** Héros à éveiller en priorité : le meilleur Rare du deck, ou le premier Légendaire obtenu. */
  focus: 'rare' | 'legendaire';
  /** Multiplicateur de la vague atteinte en Solo Infini (sensibilité, docs §6). */
  k?: number;
  /** Niveaux de campagne gagnés par jour (3 : campagne finie en 3 semaines). */
  levelsPerDay?: number;
}

export interface SimDay { day: number; gold: number; gems: number; crystals: number; pulls: number; level: number; deckLevel: number }

export interface SimResult {
  /** Jour du premier ★1 (n'importe quel héros), du ★5 sur un Rare, du ★10 sur un Légendaire (null : pas atteint). */
  firstStar1: number | null;
  rareStar5: number | null;
  legendaryStar10: number | null;
  /** Lots de 10 achetés avec des gemmes, et jour de chacun. */
  tenPulls: number[];
  /** Revenus moyens par jour sur trois périodes (or, gemmes, cristaux). */
  income: { from: number; to: number; gold: number; gems: number; crystals: number }[];
  days: SimDay[];
  /** Revenus des jours 1 à 30 par source (or, gemmes, ✦, total sur 30 jours). */
  sources: Record<string, { gold: number; gems: number; crystals: number }>;
  /** Niveau de compte final, et collection. */
  accountLevel: number;
  heroes: number;
}

/** Vague atteinte en Solo Infini selon le jour (docs §6 : 15 sem. 1, 20 sem. 2, 30 au mois 2, 40 au mois 4, 50 au mois 8). */
export function infiniteWave(day: number, k = 1): number {
  const pts: [number, number][] = [[3, 15], [14, 20], [60, 30], [120, 40], [240, 50], [400, 55]];
  let w = 15;
  for (let i = 1; i < pts.length; i++) {
    const [d0, w0] = pts[i - 1]!, [d1, w1] = pts[i]!;
    if (day <= d1) { w = w0 + ((w1 - w0) * Math.max(0, day - d0)) / (d1 - d0); break; }
    w = w1;
  }
  return Math.max(0, Math.floor(w * k));
}

/** Boss rencontrés en tenant `waves` vagues : lieutenants aux 5, 15… et gros boss aux 10, 20… */
function bossesIn(waves: number): { boss: BossId; small: boolean }[] {
  const out: { boss: BossId; small: boolean }[] = [];
  for (let w = 5; w <= waves; w += 5) out.push({ boss: 'galactus', small: w % 10 !== 0 });
  return out;
}

const rarityOf = (u: UnitId) => UNITS[u].rarity;
/** Campagne de base (chapitres 1 à 6), sans les chapitres des extensions. */
const BASE_LEVELS = LEVELS.filter((l) => l.chapter <= 6);

export function simulateEconomy(o: SimOptions): SimResult {
  const rng = seededRng(o.seed);
  const k = o.k ?? 1;
  const perDay = o.levelsPerDay ?? 3;
  const p: Profile = blankProfile('Sim', 'spiderman');
  p.id = `sim${o.seed}`;
  applyStarter(p, 'marvel');
  p.tutorialDone = true;
  applyReward(p, { gold: 300, shards: 100, xp: 60 }); // tutoriel
  const res: SimResult = { firstStar1: null, rareStar5: null, legendaryStar10: null, tenPulls: [], income: [], days: [], accountLevel: 1, heroes: 0, sources: {} };
  let curDay = 0;
  /** Mesure ce que rapporte une étape (jours 1 à 30 seulement). */
  const src = (name: string, fn: () => void) => {
    const b = { gold: p.gold, gems: p.shards, crystals: p.crystals };
    fn();
    if (curDay > 30) return;
    const e = (res.sources[name] ??= { gold: 0, gems: 0, crystals: 0 });
    e.gold += p.gold - b.gold; e.gems += p.shards - b.gems; e.crystals += p.crystals - b.crystals;
  };
  let campaignIdx = 0;
  let focusUnit: UnitId | null = o.focus === 'rare' ? 'hawkeye' : null;
  const dayStr = (d: number) => { const dt = new Date(2027, 0, d); return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`; };

  /** Deck : le héros visé d'abord, puis les meilleurs niveaux (rareté en départage). */
  const refreshDeck = () => {
    const owned = Object.keys(p.heroes) as UnitId[];
    if (o.focus === 'legendaire' && !focusUnit) focusUnit = owned.find((u) => rarityOf(u) === 'legendaire') ?? null;
    const rank = { legendaire: 0, epique: 1, rare: 2 } as const;
    const sorted = owned.filter((u) => u !== focusUnit).sort((a, b) => (p.heroes[b]!.level - p.heroes[a]!.level) || (rank[rarityOf(a)] - rank[rarityOf(b)]));
    p.decks[0] = [...(focusUnit ? [focusUnit] : []), ...sorted].slice(0, 5);
    p.activeDeck = 0;
  };

  const spend = (day: number, ds: string) => {
    // Packs : tous les tirages offerts, puis un lot de 10 dès que les gemmes le permettent.
    for (let g = 0; g < 50 && (p.pendingPulls ?? []).length; g++) {
      const f = p.pendingPulls![0]!;
      openFreePulls(p, f.pack === 'choix' ? 'complet' : f.pack, rng);
    }
    // Le premier lot de 10 de chaque pack garantit un Légendaire : le joueur les prend d'abord.
    while (p.shards >= 900) {
      const pack = pullPacks().find((pk) => firstTenPending(p, pk.id))?.id ?? 'complet';
      buyPulls(p, pack, 10, rng); res.tenPulls.push(day);
    }
    refreshDeck();
    // Or : le héros visé, puis le deck (niveau le plus bas d'abord), puis le reste si l'or déborde.
    const deck = p.decks[0]!;
    for (let guard = 0; guard < 200; guard++) {
      const order = [...deck].sort((a, b) => (a === focusUnit ? -1 : b === focusUnit ? 1 : p.heroes[a]!.level - p.heroes[b]!.level));
      // Le héros visé passe d'abord : les autres ne prennent que l'or qui dépasse son prochain niveau.
      const fh = focusUnit ? p.heroes[focusUnit] : undefined;
      const reserve = fh ? (levelUpCost(fh)?.gold ?? 0) : 0;
      const u = order.find((x) => {
        const h = p.heroes[x]!; const c = levelUpCost(h);
        return c && canAfford(p, h, c) && (x === focusUnit || p.gold - c.gold >= reserve);
      });
      if (!u || !levelUp(p, u, ds)) break;
    }
    if (p.gold > 30000) {
      for (const u of Object.keys(p.heroes) as UnitId[]) { while (p.gold > 30000 && levelUp(p, u, ds)) { /* surplus */ } }
    }
    // Cristaux : seulement le héros visé (le rythme du §6.6 se mesure héros par héros).
    if (focusUnit) while (p.heroes[focusUnit] && awakeningCost(p.heroes[focusUnit]!) && awaken(p, focusUnit, ds)) { /* éveil */ }
    // Le premier ★1 se mesure sur le premier héros qui peut l'avoir.
    if (res.firstStar1 === null) {
      for (const u of Object.keys(p.heroes) as UnitId[]) {
        const h = p.heroes[u]!;
        if (h.awakening >= 1 || (h.level >= 10 && h.cards >= 2 && p.crystals >= 50)) { res.firstStar1 = day; break; }
      }
    }
    for (const u of Object.keys(p.heroes) as UnitId[]) {
      const h = p.heroes[u]!;
      if (res.rareStar5 === null && rarityOf(u) === 'rare' && h.awakening >= 5) res.rareStar5 = day;
      if (res.legendaryStar10 === null && rarityOf(u) === 'legendaire' && h.awakening >= 10) res.legendaryStar10 = day;
    }
  };

  const earned = { gold: 0, gems: 0, crystals: 0 };
  const track = (before: { gold: number; gems: number; crystals: number }) => {
    earned.gold += p.gold - before.gold; earned.gems += p.shards - before.gems; earned.crystals += p.crystals - before.crystals;
  };
  const periods: [number, number][] = [[1, 7], [8, 14], [15, 30], [31, 90], [91, 240], [241, o.days]];
  let pStart = { ...earned };

  for (let day = 1; day <= o.days; day++) {
    const ds = dayStr(day);
    curDay = day;
    const before = { gold: p.gold, gems: p.shards, crystals: p.crystals };
    ensureQuests(p, ds);
    src('coffre quotidien', () => claimDailyChest(p, rng, ds));
    src('calendrier de bienvenue', () => claimWelcome(p, ds));
    // Campagne : 3 niveaux gagnés à 3 étoiles par jour, puis 2 niveaux rejoués. Seule la campagne de base
    // (chapitres 1 à 6) est jouée : les chapitres des extensions (50 à 200 vagues) demandent une collection
    // de fin de campagne, hors du rythme d'un joueur régulier sur 4 mois (sinon les garde-fous de
    // docs/equilibrage.md §6 dépendraient du nombre d'extensions installées).
    const plays = campaignIdx < BASE_LEVELS.length ? perDay : 2;
    for (let i = 0; i < plays; i++) {
      const level = campaignIdx < BASE_LEVELS.length ? BASE_LEVELS[campaignIdx++]! : getLevel(`c6-n${1 + ((day + i) % 9)}`)!;
      const now: Stars = [true, true, true];
      const rw = levelRewards(level, now, p, p.decks[0]!, hash32(`${o.seed}:${day}:${i}`));
      recordLevel(p, level, rw, level.waves);
      const stars = rw.lines.filter((l) => l.kind === 'coffre');
      src('campagne : étoiles, boss, bonus', () => applyReward(p, rw.lines.filter((l) => l.kind !== 'coffre').reduce((a, l) => addReward(a, l.reward), {})));
      src('campagne : coffres d’étoiles', () => { for (const l of stars) applyReward(p, l.reward); });
      src('campagne : coffres de victoire', () => { if (rw.chest) openChest(p, rw.chest.tier, rng, { scale: rw.chest.scale, crystals: rw.chest.crystals }); });
      src('butin des boss', () => { p.gold += bossKillGold(bossesIn(level.waves)); });
    }
    // Solo Infini : une partie par jour dès qu'il est ouvert.
    if (p.campaign['c1-n10']?.stars[0]) {
      const w = infiniteWave(day, k);
      const bigs = w >= 50 ? ['galactus', 'thanos'] as const : w >= 10 ? ['galactus'] as const : [];
      src('Solo Infini', () => applyInfiniteGame(p, { wavesCleared: w, bigBosses: [...bigs], bossGold: bossKillGold(bossesIn(w)), bossKills: bossesIn(w).length }, rng, ds));
    }
    // Quêtes : les 3 du jour sont faites (joueur régulier), coffre de la semaine dès qu'il est prêt.
    const q = ensureQuests(p, ds);
    for (const it of q.list) it.progress = it.target;
    src('quêtes du jour', () => q.list.forEach((_, i) => claimQuest(p, i, ds)));
    src('coffre de la semaine', () => claimWeekly(p, rng, ds));
    src('Route des récompenses', () => { for (const l of roadClaimable(p)) claimRoad(p, l, rng); });
    track(before);
    spend(day, ds);
    // Les montées de niveau donnent de l'XP : la route peut encore avancer.
    src('Route des récompenses', () => { for (const l of roadClaimable(p)) claimRoad(p, l, rng); });
    res.days.push({ day, gold: p.gold, gems: p.shards, crystals: p.crystals, pulls: p.pullsDone ?? 0, level: accountLevel(p.xp).level, deckLevel: p.decks[0]!.reduce((n, u) => n + (p.heroes[u]?.level ?? 0), 0) / 5 });
    for (const [a, b] of periods) {
      if (day === b) {
        const n = b - a + 1;
        res.income.push({ from: a, to: b, gold: Math.round((earned.gold - pStart.gold) / n), gems: Math.round((earned.gems - pStart.gems) / n), crystals: Math.round((earned.crystals - pStart.crystals) / n) });
        pStart = { ...earned };
      }
    }
  }
  res.accountLevel = accountLevel(p.xp).level;
  res.heroes = Object.keys(p.heroes).length;
  return res;
}

/** Jours moyens entre deux lots de 10 achetés avec des gemmes, sur [from, to]. */
export function daysPerTenPull(r: SimResult, from: number, to: number): number {
  const n = r.tenPulls.filter((d) => d >= from && d <= to).length;
  return n ? (to - from + 1) / n : Infinity;
}

/** Démarrage : STARTER_DECKS est importé pour garder le deck de référence visible ici. */
export const SIM_DECK = STARTER_DECKS.marvel;
