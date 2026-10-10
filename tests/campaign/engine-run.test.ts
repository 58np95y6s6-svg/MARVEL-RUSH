// Parties complètes « sans ennemis » (tout meurt dès son apparition) : on vérifie, pour chacun des
// 60 niveaux, la suite réelle des boss et la victoire à la dernière vague.
import { describe, expect, it } from 'vitest';
import { STARTER_DECKS } from '../../src/data/units';
import { createEngine } from '../../src/engine';
import { debugPlace, simState } from '../../src/engine/debug';
import { CHAPTERS, LEVELS, levelConfig } from '../../src/campaign/levels';
import { createBattleTracker } from '../../src/campaign/tracker';

describe('niveaux joués de bout en bout', () => {
  for (const l of LEVELS) {
    it(l.id, () => {
      const ch = CHAPTERS[l.chapter - 1]!;
      const e = createEngine(levelConfig(l, STARTER_DECKS.marvel, null, 11 + l.n));
      const tr = createBattleTracker();
      debugPlace(e, 0, 7, 'cmarvel', 3); // tireur à portée globale : achève les boss (événement « kill »)
      const age = new Map<number, number>();
      const seen: { wave: number; boss: string; small: boolean }[] = [];
      let end: { outcome: string; wave: number } | null = null;
      for (let i = 0; i < 20 * 40 * 55 && !end; i++) {
        for (const en of simState(e).enemies) if (!en.bossId && !en.x.mini) en.hp = 0;
        // Les boss sont à 1 PV après 2 s.
        for (const en of simState(e).enemies) {
          if (!en.bossId && !en.x.mini) continue;
          const a = (age.get(en.uid) ?? 0) + 0.05;
          age.set(en.uid, a);
          if (a > 2) en.hp = Math.min(en.hp, 1);
        }
        tr.before(e.state);
        e.tick();
        const evs = e.drainEvents();
        tr.after(e.state, evs);
        for (const ev of evs) {
          if (ev.type === 'bossSpawn') seen.push({ wave: e.state.wave, boss: ev.boss, small: false });
          if (ev.type === 'miniBossSpawn') seen.push({ wave: e.state.wave, boss: ev.boss, small: true });
          if (ev.type === 'gameOver') end = ev;
        }
      }
      expect(end, 'fin de partie').toMatchObject({ outcome: 'victoire', wave: l.waves });
      // Rythme §4.3 (lieutenant toutes les 5 vagues, gros boss toutes les 10), le boss ou le lieutenant
      // imposé remplaçant la dernière vague des niveaux de boss.
      const expected = Array.from({ length: l.waves }, (_, i) => i + 1).filter((w) => w % 5 === 0 || w === l.boss?.wave);
      expect(seen.map((s) => s.wave)).toEqual(expected);
      for (const s of seen) {
        const small = s.wave === l.boss?.wave ? l.boss.kind === 'lieutenant' : s.wave % 10 !== 0;
        expect(s.small, `${l.id} vague ${s.wave}`).toBe(small);
      }
      const last = seen[seen.length - 1];
      if (l.boss) {
        expect(last).toMatchObject({ wave: l.boss.wave, boss: l.boss.id, small: l.boss.kind === 'lieutenant' });
        // Le boss imposé n'apparaît pas avant (en gros boss).
        expect(seen.slice(0, -1).filter((s) => !s.small).map((s) => s.boss)).not.toContain(l.boss.id);
      } else {
        const banned = l.exclude ?? [];
        expect(seen.filter((s) => !s.small).map((s) => s.boss).some((b) => banned.includes(b as never))).toBe(false);
      }
      expect(seen.some((s) => !s.small && s.boss === 'thanos')).toBe(l.id === 'c6-n10');
      if (l.boss) expect(tr.stats(e.state).bossKills.at(-1)).toMatchObject({ wave: l.boss.wave, boss: l.boss.id });
      void ch;
    });
  }
});
