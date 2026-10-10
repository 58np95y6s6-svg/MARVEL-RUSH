// Contrat du profil joueur (§5.4, §6). Partagé par l'agent Méta (packs, collection, decks, éveils)
// et l'agent Campagne. Les types et les signatures exportées ici sont le CONTRAT : on peut ajouter des
// champs optionnels, jamais en retirer ni en renommer sans passer par le chef de projet.
//
// Stockage : IndexedDB (idb-keyval), deux profils locaux au plus, un profil actif. Tout passe par
// `updateProfile` qui sauvegarde et notifie les écrans abonnés (`onProfileChange`).

import { get, set } from 'idb-keyval';
import type { BossId, Pack, UnitId } from '../data/types';
import { applyRetroGems, type WelcomeState } from './gems';

/** v2 (octobre 2026) : deux monnaies, l'or (montées de niveau) et les gemmes (packs), voir `migrateProfile`. */
export const PROFILE_VERSION = 2;
export const MAX_PROFILES = 2;

export interface HeroState {
  level: number;          // niveau de collection 1..10
  cards: number;          // cartes (doublons) en réserve
  awakening: number;      // ★0..★10
  talents: (0 | 1 | null)[]; // choix par palier (3 paliers), null = non débloqué
  skin?: 'classique' | 'hiver' | 'neon';
}

export interface LevelResult {
  stars: [boolean, boolean, boolean]; // ★ victoire, ★★ ≥ 2 vies, ★★★ contrainte bonus
  bestWave?: number;
  rewardTaken?: boolean;             // première victoire récompensée
}

export interface Profile {
  version: number;
  id: string;                         // identifiant local
  name: string;
  avatar: UnitId;
  createdAt: number;
  // Monnaies (§6.1, §6.6). Deux monnaies séparées, comme dans Rush Royale :
  /** GEMMES (ex-« éclats », nom de champ gardé pour la compatibilité) : ne paient que les packs. */
  shards: number;
  /** OR : ne paie que les montées de niveau des héros (avec les cartes). Ajouté en v2. */
  gold: number;
  crystals: number;                   // cristaux d'éveil ✦
  scrolls: number;                    // parchemins de talent
  xp: number;                         // XP de compte
  // Collection
  heroes: Partial<Record<UnitId, HeroState>>;
  /** Tirages depuis le dernier Légendaire, par pack (clé = Pack ou 'complet', voir src/meta/pulls.ts). */
  pity: Partial<Record<string, number>>;
  decks: UnitId[][];                  // 1 à 3 decks de 5 unités différentes
  activeDeck: number;
  // Progression
  campaign: Record<string, LevelResult>;  // clé = id de niveau (ex. 'c1-n3')
  campaignChests: Record<string, boolean>; // clé = 'c1-10' | 'c1-20' | 'c1-30'
  infiniteBest: number;               // record Solo Infini (vagues)
  infiniteTiers: Record<string, string>; // palier → date (AAAA-MM-JJ) du dernier coffre obtenu
  dailyChest?: string;                // date du dernier coffre quotidien
  firstBigBossOfDay?: string;         // date du dernier bonus « premier gros boss du jour »
  tutorialDone: boolean;
  starter?: 'marvel' | 'disney';
  /** Partie Solo en cours (sauvegarde à chaque vague, §5.1), sérialisée par le moteur. */
  savedGame?: { kind: 'campagne' | 'infini'; levelId?: string; state: unknown; savedAt: number };
  /** Tirages gratuits en attente (récompenses, tirage offert à la création), ouverts dans l'écran Tirages. */
  pendingPulls?: { pack: Pack | 'complet' | 'choix'; count: number }[];
  /** Étape du tutoriel guidé en cours (§5.0), sauvegardée étape par étape. Absent = pas commencé. */
  tutorialStep?: number;
  /** Total de tirages effectués (statistique). */
  pullsDone?: number;
  /** Tutoriel (§5.0) : héros mis en avant à l'étape « Mets ta nouvelle unité dans ton deck ». */
  tutorialUnit?: UnitId;
  /** Route des récompenses : niveaux de compte dont la récompense a été réclamée. */
  roadClaimed?: number[];
  /** Cadres d'avatar débloqués (Route des récompenses) et cadre affiché. */
  frames?: string[];
  frame?: string;
  /** Quêtes du jour et de la semaine (src/meta/quests.ts). */
  quests?: QuestState;
  /** Statistique : coffres ouverts. */
  chestsOpened?: number;
  /** Astuces contextuelles déjà vues (une seule fois chacune), clé = id de l'astuce (src/tutorial/tips.ts). */
  tips?: Record<string, boolean>;
  /** Calendrier de bienvenue (7 jours, src/meta/gems.ts). Absent = rien réclamé. */
  welcome?: WelcomeState;
  /** Rattrapage des gemmes de première victoire déjà fait (src/meta/gems.ts). */
  gemsRetro?: boolean;
  /** Packs dont le premier lot de 10 payé (Légendaire garanti) a déjà été tiré (src/meta/pulls.ts). */
  firstTen?: Record<string, boolean>;
  // ---- Coop à deux (§5.2, §5.4) ----
  /** Dernière partenaire vue en ligne (affichée hors ligne). */
  partner?: { profileId: string; name: string; avatar: UnitId; seenAt: number; chapters?: number[]; /** Dernier identifiant réseau personnel vu (connexion directe sans rendez-vous). */ peer?: string };
  /** Record du duo en Coop Infini (vagues tenues). */
  coopBest?: number;
  /** Coop Infini : palier → date (AAAA-MM-JJ) du dernier coffre obtenu (une fois par jour et par mode). */
  coopTiers?: Record<string, string>;
  /** Coop Niveaux : étoiles communes du duo, par niveau (clé 'cc1-n3'). */
  coopLevels?: Record<string, LevelResult>;
  /** Coop Niveaux : coffres d'étoiles ouverts (clé 'cc1-10'). */
  coopChests?: Record<string, boolean>;
  /** Historique des dernières parties à deux (plus récente d'abord, 10 au plus). */
  coopHistory?: { at: number; mode: 'coop-infini' | 'coop-niveaux'; levelId?: string; wave: number; won: boolean; partner: string }[];
}

/** Quêtes quotidiennes (3 par jour) et coffre de la semaine (src/meta/quests.ts). */
export interface QuestState {
  day: string;
  list: { id: string; target: number; progress: number; claimed: boolean }[];
  /** Lundi de la semaine en cours (AAAA-MM-JJ). */
  week: string;
  /** Quêtes réclamées cette semaine. */
  weekDone: number;
  weekClaimed: boolean;
}

/** Récompenses à créditer (fin de partie, coffres, paliers). Tous les champs sont optionnels. */
export interface Reward {
  /** Gemmes (packs). */
  shards?: number;
  /** Or (montées de niveau). */
  gold?: number;
  crystals?: number;
  scrolls?: number;
  xp?: number;
  cards?: { unit: UnitId; count: number }[];
  /** Personnage offert : ajouté à la collection, ou converti en cartes s'il est déjà possédé. */
  heroes?: UnitId[];
  freePulls?: { pack: Pack | 'complet' | 'choix'; count: number }[];
}

// ---------------------------------------------------------------------------------------------
// Stockage

const KEY_LIST = 'mr-profiles';      // string[] des ids
const KEY_ACTIVE = 'mr-active-profile';
const keyOf = (id: string): string => `mr-profile-${id}`;

let current: Profile | null = null;
const listeners = new Set<(p: Profile | null) => void>();

export function onProfileChange(fn: (p: Profile | null) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(): void { for (const fn of listeners) fn(current); }

// ---------------------------------------------------------------------------------------------
// Migration (additive et versionnée)

/** Or de départ d'un nouveau profil, gemmes de départ (le premier lot de 10 est en plus offert). */
export const START_GOLD = 2000;
export const START_GEMS = 1000;

/**
 * Or offert à un profil d'avant la v2, proportionnel à sa progression : 2 000 + 120 par étoile de
 * campagne + 60 par vague du record Solo Infini + 1 par point d'XP, plafonné à 40 000.
 */
export function migrationGold(p: Pick<Profile, 'campaign' | 'infiniteBest' | 'xp'>): number {
  const stars = Object.values(p.campaign ?? {}).reduce((n, l) => n + (l?.stars ?? []).filter(Boolean).length, 0);
  return Math.min(40000, START_GOLD + 120 * stars + 60 * Math.max(0, p.infiniteBest ?? 0) + Math.max(0, Math.floor(p.xp ?? 0)));
}

/**
 * Met un profil lu sur le stockage à la version courante (mutation). Renvoie true s'il a changé.
 * v1 → v2 : les éclats deviennent des gemmes (même champ `shards`, rien ne se perd) et l'or apparaît.
 */
export function migrateProfile(p: Profile): boolean {
  let changed = false;
  if ((p.version ?? 1) < 2 || typeof (p as Partial<Profile>).gold !== 'number') {
    if (typeof (p as Partial<Profile>).gold !== 'number') p.gold = migrationGold(p);
    p.version = 2;
    changed = true;
  }
  // Gemmes de première victoire (chapitres 1 à 3) pour les niveaux déjà gagnés : une seule fois.
  if (!p.gemsRetro) { applyRetroGems(p); changed = true; }
  return changed;
}

async function readProfile(id: string): Promise<Profile | null> {
  const p = (await get<Profile>(keyOf(id))) ?? null;
  if (p && migrateProfile(p)) await set(keyOf(id), p);
  return p;
}

export async function listProfiles(): Promise<Profile[]> {
  const ids = (await get<string[]>(KEY_LIST)) ?? [];
  const out: Profile[] = [];
  for (const id of ids) {
    const p = await readProfile(id);
    if (p) out.push(p);
  }
  return out;
}

/** Charge le profil actif (au démarrage). null s'il n'y en a pas encore. */
export async function loadActiveProfile(): Promise<Profile | null> {
  const id = await get<string>(KEY_ACTIVE);
  current = id ? await readProfile(id) : null;
  emit();
  return current;
}

export function getProfile(): Profile | null { return current; }

export async function switchProfile(id: string): Promise<Profile | null> {
  await set(KEY_ACTIVE, id);
  return loadActiveProfile();
}

/** Profil neuf, non sauvegardé (1 000 gemmes et 2 000 or offerts, §6.1). Utile aussi aux tests. */
export function blankProfile(name: string, avatar: UnitId): Profile {
  return {
    version: PROFILE_VERSION,
    id: Math.random().toString(36).slice(2, 10),
    name, avatar, createdAt: Date.now(),
    shards: START_GEMS, gold: START_GOLD, crystals: 0, scrolls: 0, xp: 0,
    heroes: {}, pity: {}, decks: [], activeDeck: 0,
    campaign: {}, campaignChests: {}, infiniteBest: 0, infiniteTiers: {},
    tutorialDone: false, gemsRetro: true,
  };
}

export async function createProfile(name: string, avatar: UnitId): Promise<Profile> {
  const ids = (await get<string[]>(KEY_LIST)) ?? [];
  if (ids.length >= MAX_PROFILES) throw new Error('Deux profils au maximum.');
  const p = blankProfile(name, avatar);
  await set(keyOf(p.id), p);
  await set(KEY_LIST, [...ids, p.id]);
  await set(KEY_ACTIVE, p.id);
  current = p;
  emit();
  return p;
}

/** Seule façon de modifier le profil : la mutation est appliquée, sauvegardée, puis notifiée. */
export async function updateProfile(mutate: (p: Profile) => void): Promise<Profile> {
  if (!current) throw new Error('Aucun profil actif.');
  mutate(current);
  await set(keyOf(current.id), current);
  emit();
  return current;
}

// ---------------------------------------------------------------------------------------------
// Outils communs

export const today = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Ajoute un personnage (ou ses cartes s'il est déjà possédé : 20 cartes, §campagne). */
export function addHero(p: Profile, unit: UnitId, dupCards = 1): void {
  const h = p.heroes[unit];
  if (h) h.cards += dupCards;
  else p.heroes[unit] = { level: 1, cards: 0, awakening: 0, talents: [null, null, null] };
}

/** Crédite une récompense sur le profil (sans sauvegarder : à appeler dans updateProfile). */
export function applyReward(p: Profile, r: Reward): void {
  p.shards += r.shards ?? 0;
  p.gold = (p.gold ?? 0) + (r.gold ?? 0);
  p.crystals += r.crystals ?? 0;
  p.scrolls += r.scrolls ?? 0;
  p.xp += r.xp ?? 0;
  for (const c of r.cards ?? []) {
    const h = p.heroes[c.unit];
    if (h) h.cards += c.count;
  }
  for (const u of r.heroes ?? []) addHero(p, u, 20);
  // freePulls : traités par l'écran des tirages (agent Méta) ; on les met de côté.
  if (r.freePulls?.length) {
    const q = (p.pendingPulls ??= []);
    q.push(...r.freePulls.map((f) => ({ ...f })));
  }
}

/** Gros boss vaincu : 5 ✦ la première fois de la journée (§6.6). Renvoie les cristaux gagnés. */
export function bigBossDailyBonus(p: Profile, boss: BossId): number {
  let gain = 0;
  if (p.firstBigBossOfDay !== today()) { p.firstBigBossOfDay = today(); gain += 5; }
  if (boss === 'thanos') gain += 50;
  p.crystals += gain;
  return gain;
}

/** Deck de combat du profil actif (repli : deck de départ fourni par l'appelant). */
export function activeDeck(p: Profile | null, fallback: UnitId[]): UnitId[] {
  const d = p?.decks[p.activeDeck];
  return d && d.length === 5 ? d.slice() : fallback.slice();
}
