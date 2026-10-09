// Statistiques de partie pour les contraintes de 3e étoile : calculées à partir de l'état du moteur
// et de ses événements, tick après tick. Pur (aucun DOM) : utilisé par l'écran de combat
// (src/ui/battle.ts) et par le simulateur.

import type { BossId, EnemyKind, UnitId } from '../data/types';
import type { EngineEvent, EngineState, PlayerId } from '../engine/types';

export interface BossKill {
  boss: BossId;
  small: boolean;     // lieutenant / sbire géant
  wave: number;
  /** Secondes entre l'apparition et la mort. */
  time: number;
}

export interface BattleStats {
  summons: number;
  merges: number;
  maxRank: number;
  /** Plus haut niveau d'amélioration en partie atteint par une unité (1 = aucune amélioration). */
  maxPowerup: number;
  bossKills: BossKill[];
  /** Ennemis arrivés au bout du chemin, par type. */
  leaked: Partial<Record<EnemyKind, number>>;
  /** Unités détruites / rétrogradées par un pouvoir de boss ou de lieutenant. */
  bossDestroyed: number;
  bossDowngraded: number;
  /** Plus long sommeil infligé à une unité (s). */
  maxSleep: number;
  /** Fin de partie : mana et cases vides. */
  endMana: number;
  emptyCells: number;
  time: number;
}

export interface BattleTracker {
  /** À appeler juste avant `engine.tick()`. */
  before(state: EngineState): void;
  /** À appeler après le tick, avec les événements qu'il a produits. */
  after(state: EngineState, events: EngineEvent[]): void;
  stats(state: EngineState): BattleStats;
}

export function createBattleTracker(player: PlayerId = 'p1'): BattleTracker {
  const s: BattleStats = {
    summons: 0, merges: 0, maxRank: 1, maxPowerup: 1, bossKills: [], leaked: {},
    bossDestroyed: 0, bossDowngraded: 0, maxSleep: 0, endMana: 0, emptyCells: 0, time: 0,
  };
  const bosses = new Map<number, { boss: BossId; small: boolean; wave: number; t: number }>();
  /** Ennemis vivants (uid → type) au tick précédent. */
  let alive = new Map<number, EnemyKind>();
  /** Plateau du joueur avant le tick : uid → rang. */
  let prevGrid = new Map<number, number>();
  let prevSlots: (number | null)[] = [];

  const me = (st: EngineState) => st.players.find((p) => p.id === player) ?? st.players[0]!;

  return {
    before(st) {
      const p = me(st);
      prevGrid = new Map();
      prevSlots = p.grid.map((u) => {
        if (!u) return null;
        prevGrid.set(u.uid, u.rank);
        return u.uid;
      });
    },
    after(st, events) {
      const p = me(st);
      const killed = new Set<number>();
      for (const ev of events) {
        switch (ev.type) {
          case 'summon': if (ev.player === player) { s.summons++; s.maxRank = Math.max(s.maxRank, ev.rank); } break;
          case 'merge': if (ev.player === player) { s.merges++; s.maxRank = Math.max(s.maxRank, ev.rank); } break;
          case 'promote': case 'copy': if (ev.player === player) s.maxRank = Math.max(s.maxRank, ev.rank); break;
          case 'powerup': if (ev.player === player) s.maxPowerup = Math.max(s.maxPowerup, ev.level); break;
          case 'bossSpawn': bosses.set(ev.enemy, { boss: ev.boss, small: false, wave: st.wave, t: st.time }); break;
          case 'miniBossSpawn': bosses.set(ev.enemy, { boss: ev.boss, small: true, wave: st.wave, t: st.time }); break;
          case 'kill': {
            killed.add(ev.enemy);
            const b = bosses.get(ev.enemy);
            if (b) { s.bossKills.push({ boss: b.boss, small: b.small, wave: b.wave, time: st.time - b.t }); bosses.delete(ev.enemy); }
            break;
          }
          case 'bossPower': {
            if (ev.player !== player) break;
            for (const slot of ev.slots) {
              const uid = prevSlots[slot];
              if (uid == null) continue;
              const now = p.grid.find((u) => u?.uid === uid);
              if (!now) s.bossDestroyed++;
              else if (now.rank < (prevGrid.get(uid) ?? now.rank)) s.bossDowngraded++;
            }
            break;
          }
          default: break;
        }
      }
      // Fuites : un ennemi disparu sans avoir été éliminé est arrivé au bout du chemin.
      const next = new Map<number, EnemyKind>();
      for (const e of st.enemies) if (e.hp > 0) next.set(e.uid, e.kind);
      for (const [uid, kind] of alive) {
        if (!next.has(uid) && !killed.has(uid)) s.leaked[kind] = (s.leaked[kind] ?? 0) + 1;
      }
      alive = next;
      for (const u of p.grid) {
        if (!u) continue;
        s.maxRank = Math.max(s.maxRank, u.rank);
        if (u.status.sleepingFor !== undefined) s.maxSleep = Math.max(s.maxSleep, u.status.sleepingFor);
      }
      for (const lv of Object.values(p.powerUps)) if (lv !== undefined) s.maxPowerup = Math.max(s.maxPowerup, lv);
    },
    stats(st) {
      const p = me(st);
      return {
        ...s,
        bossKills: s.bossKills.slice(),
        leaked: { ...s.leaked },
        endMana: Math.floor(p.mana),
        emptyCells: p.grid.filter((u) => !u).length,
        time: st.time,
      };
    },
  };
}

/** Résultat d'un combat, transmis par l'écran de combat (`BattleOptions.onEnd`). */
export interface BattleOutcome extends BattleStats {
  won: boolean;
  wave: number;
  livesLeft: number;
  deck: UnitId[];
  seed: number;
}
