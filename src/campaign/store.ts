// Lien entre la campagne et le profil joueur (contrat src/meta/profile.ts). Sans profil actif
// (méta-jeu pas encore branché), la progression est gardée en mémoire pour la session et les
// récompenses ne sont pas créditées.

import { STARTER_DECKS } from '../data/units';
import type { UnitId } from '../data/types';
import { activeDeck, applyReward, bigBossDailyBonus, getProfile, updateProfile, type Profile } from '../meta/profile';
import { getLevel, type CampaignLevel } from './levels';
import { evaluateStars, levelRewards, recordLevel, type LevelRewards, type Progress, type Stars } from './progress';
import type { BattleOutcome } from './tracker';

const memory: Progress = { campaign: {}, campaignChests: {} };

/** Progression courante : celle du profil actif, sinon celle de la session. */
export function getProgress(): Progress {
  return getProfile() ?? memory;
}

/** Deck de combat : deck actif du profil, sinon deck de départ (Marvel par défaut). */
export function campaignDeck(profile: Profile | null = getProfile()): UnitId[] {
  const starter = STARTER_DECKS[profile?.starter ?? 'marvel'];
  return activeDeck(profile, starter);
}

export interface CommitResult {
  level: CampaignLevel;
  outcome: BattleOutcome;
  /** Étoiles gagnées pendant ce combat. */
  earned: Stars;
  rewards: LevelRewards;
  /** Faux sans profil : rien n'a été crédité. */
  credited: boolean;
  /** Cristaux du bonus « premier gros boss du jour » (contrat bigBossDailyBonus). */
  dailyCrystals: number;
}

/** Enregistre un combat de campagne : étoiles, déblocages, récompenses (via updateProfile + applyReward). */
export async function commitLevel(levelId: string, outcome: BattleOutcome): Promise<CommitResult> {
  const level = getLevel(levelId);
  if (!level) throw new Error(`Niveau inconnu : ${levelId}`);
  const earned = evaluateStars(level, outcome);
  const profile = getProfile();
  const rewards = levelRewards(level, earned, profile ?? memory, outcome.deck, outcome.seed);
  let dailyCrystals = 0;
  if (!profile) {
    if (outcome.won) recordLevel(memory, level, rewards, outcome.wave);
    return { level, outcome, earned, rewards, credited: false, dailyCrystals };
  }
  const bigBoss = outcome.bossKills.find((k) => !k.small);
  await updateProfile((p) => {
    if (outcome.won) {
      recordLevel(p, level, rewards, outcome.wave);
      applyReward(p, rewards.total);
    } else {
      const prev = p.campaign[level.id];
      if (prev) prev.bestWave = Math.max(prev.bestWave ?? 0, outcome.wave);
    }
    if (bigBoss) dailyCrystals = bigBossDailyBonus(p, bigBoss.boss);
  });
  return { level, outcome, earned, rewards, credited: true, dailyCrystals };
}

/** Tests et développement : remet la progression de session à zéro. */
export function resetMemoryProgress(): void {
  memory.campaign = {};
  memory.campaignChests = {};
}
