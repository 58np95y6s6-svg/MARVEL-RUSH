// Decks (§6.4) : 5 héros différents possédés, jusqu'à 3 decks, bonus d'équipe actifs ou presque.
// Logique pure, testable sans DOM.

import type { TeamBonusDef, UnitId } from '../data/types';
import { TEAM_LIST, activeTeams } from '../data/teams';
import { UNITS, STARTER_DECKS } from '../data/units';
import type { PlayerSetup } from '../engine/types';
import { addHero, type Profile } from './profile';

export const DECK_SIZE = 5;
export const MAX_DECKS = 3;

/** null si le deck est valide, sinon la raison. */
export function deckError(p: Profile, deck: readonly UnitId[]): string | null {
  if (deck.length !== DECK_SIZE) return `Un deck compte ${DECK_SIZE} héros.`;
  if (new Set(deck).size !== deck.length) return 'Les 5 héros doivent être différents.';
  const missing = deck.find((u) => !p.heroes[u]);
  if (missing) return `${UNITS[missing]?.name ?? missing} n’est pas dans ta collection.`;
  return null;
}

/** S'assure que le profil a `count` decks (copies du premier deck valide). */
export function ensureDecks(p: Profile, count: number): void {
  const base = p.decks[0] ?? [];
  while (p.decks.length < Math.min(count, MAX_DECKS)) p.decks.push(base.slice());
}

/**
 * Place `unit` à la case `slot` du deck `index`. Si le héros est déjà dans ce deck, les deux cases
 * s'échangent (le deck reste fait de 5 héros différents). Renvoie false si c'est impossible.
 */
export function setDeckSlot(p: Profile, index: number, slot: number, unit: UnitId): boolean {
  const deck = p.decks[index];
  if (!deck || slot < 0 || slot >= DECK_SIZE || !p.heroes[unit]) return false;
  const cur = deck[slot];
  if (cur === undefined) return false;
  const already = deck.indexOf(unit);
  if (already === slot) return true;
  if (already >= 0) deck[already] = cur;
  deck[slot] = unit;
  return true;
}

/** Échange deux cases d'un deck. */
export function swapDeckSlots(p: Profile, index: number, a: number, b: number): boolean {
  const deck = p.decks[index];
  if (!deck || a === b) return false;
  const x = deck[a], y = deck[b];
  if (x === undefined || y === undefined) return false;
  deck[a] = y; deck[b] = x;
  return true;
}

export interface TeamHint {
  team: TeamBonusDef;
  active: boolean;
  have: number;
  need: number;
  /** Héros qui manquent (tous les membres absents si `minCount` laisse le choix). */
  missing: UnitId[];
  /** Phrase prête à afficher. */
  text: string;
}

const nameOf = (u: UnitId) => UNITS[u]?.name ?? u;
function list(names: string[], joiner = 'et'): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} ${joiner} ${names[names.length - 1]}`;
}

/** Bonus d'équipe actifs, puis ceux à qui il manque 1 ou 2 héros (« Il manque Thor pour Avengers (3) »). */
export function teamHints(deck: readonly UnitId[], maxMissing = 2): TeamHint[] {
  const active = new Set(activeTeams(deck).map((t) => t.id));
  const out: TeamHint[] = [];
  for (const team of TEAM_LIST) {
    const have = team.units.filter((u) => deck.includes(u)).length;
    const need = team.params.minCount ?? team.units.length;
    const missing = team.units.filter((u) => !deck.includes(u));
    if (active.has(team.id)) { out.push({ team, active: true, have, need, missing, text: team.description }); continue; }
    if (have >= need) continue; // Avengers (3) remplacé par Avengers (5)
    const gap = need - have;
    if (have === 0 || gap > maxMissing) continue;
    const text = team.params.minCount != null && missing.length > gap
      ? `Il manque ${gap} héros parmi ${list(missing.map(nameOf), 'ou')} pour ${team.name}`
      : `Il manque ${list(missing.map(nameOf))} pour ${team.name}`;
    out.push({ team, active: false, have, need, missing, text });
  }
  return out.sort((a, b) => Number(b.active) - Number(a.active) || (a.need - a.have) - (b.need - b.have));
}

// ------------------------------------------------------------------------------- départ et combat

export type Starter = 'marvel' | 'disney';

/** Deck de départ (§6.1) : 5 héros possédés, 1er deck actif, tirage de 10 offert dans l'univers choisi. */
export function applyStarter(p: Profile, starter: Starter): void {
  if (p.starter) return;
  p.starter = starter;
  const deck = STARTER_DECKS[starter].slice();
  for (const u of deck) if (!p.heroes[u]) addHero(p, u);
  p.decks = [deck];
  p.activeDeck = 0;
  (p.pendingPulls ??= []).push({ pack: starter, count: 10 });
}

/** Réglages de combat du joueur lus sur le profil : niveaux, talents (a/b par palier), éveils. */
export function playerSetupFor(p: Profile | null, deck: readonly UnitId[]): Pick<PlayerSetup, 'levels' | 'talents' | 'awakening'> {
  const levels: PlayerSetup['levels'] = {};
  const talents: PlayerSetup['talents'] = {};
  const awakening: NonNullable<PlayerSetup['awakening']> = {};
  for (const u of deck) {
    const h = p?.heroes[u];
    if (!h) continue;
    levels[u] = h.level;
    const t: ('a' | 'b')[] = [];
    for (const c of h.talents) { if (c == null) break; t.push(c === 0 ? 'a' : 'b'); }
    if (t.length) talents[u] = t;
    if (h.awakening > 0) awakening[u] = h.awakening;
  }
  return { levels, talents, awakening };
}
