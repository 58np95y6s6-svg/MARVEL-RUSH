// Lien entre la campagne et le profil joueur (contrat src/meta/profile.ts). Sans profil actif
// (méta-jeu pas encore branché), la progression est gardée en mémoire pour la session et les
// récompenses ne sont pas créditées.

import { STARTER_DECKS } from '../data/units';
import type { UnitId } from '../data/types';
import { activeDeck, applyReward, bigBossDailyBonus, getProfile, updateProfile, type Profile } from '../meta/profile';
import { getLevel, hash32, type CampaignLevel } from './levels';
import { bossKillGold, openChest, seededRng, type ChestContent } from '../meta/chests';
import { trackQuests } from '../meta/quests';
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
  /** Coffre de victoire tiré et crédité (null : défaite ou pas de profil). */
  chest: ChestContent | null;
  /** Or du butin des boss vaincus pendant le combat (victoire ou défaite). */
  bossGold: number;
}

/** Enregistre un combat de campagne : étoiles, déblocages, récompenses (via updateProfile + applyReward). */
export async function commitLevel(levelId: string, outcome: BattleOutcome): Promise<CommitResult> {
  const level = getLevel(levelId);
  if (!level) throw new Error(`Niveau inconnu : ${levelId}`);
  const earned = evaluateStars(level, outcome);
  const profile = getProfile();
  const rewards = levelRewards(level, earned, profile ?? memory, outcome.deck, outcome.seed);
  let dailyCrystals = 0;
  const bossGold = bossKillGold(outcome.bossKills);
  if (!profile) {
    if (outcome.won) recordLevel(memory, level, rewards, outcome.wave);
    return { level, outcome, earned, rewards, credited: false, dailyCrystals, chest: null, bossGold };
  }
  const bigBoss = outcome.bossKills.find((k) => !k.small);
  let chest: ChestContent | null = null;
  await updateProfile((p) => {
    if (outcome.won) {
      recordLevel(p, level, rewards, outcome.wave);
      applyReward(p, rewards.total);
      const vc = rewards.chest;
      if (vc) {
        const rng = seededRng(hash32(`${level.id}:${outcome.seed}:${Date.now()}`));
        chest = openChest(p, vc.tier, rng, { scale: vc.scale, crystals: vc.crystals });
      }
    } else {
      const prev = p.campaign[level.id];
      if (prev) prev.bestWave = Math.max(prev.bestWave ?? 0, outcome.wave);
    }
    p.gold += bossGold;
    if (bigBoss) dailyCrystals = bigBossDailyBonus(p, bigBoss.boss);
    trackQuests(p, {
      merges: outcome.merges, summons: outcome.summons, bossKills: outcome.bossKills.length,
      levelsWon: outcome.won ? 1 : 0, waves: outcome.won ? outcome.wave : Math.max(0, outcome.wave - 1),
      stars: earned.filter(Boolean).length,
    });
  });
  return { level, outcome, earned, rewards, credited: true, dailyCrystals, chest, bossGold };
}

/** Tests et développement : remet la progression de session à zéro. */
export function resetMemoryProgress(): void {
  memory.campaign = {};
  memory.campaignChests = {};
}
