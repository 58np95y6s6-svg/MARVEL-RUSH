import { describe, expect, it } from 'vitest';
import { createEngine } from '../../src/engine';
import { simState } from '../../src/engine/debug';
import { getLevel, levelConfig } from '../../src/campaign/levels';
import { STARTER_DECKS } from '../../src/data/units';
import { makeSavedGame, readSavedGame, savedGameLabel } from '../../src/meta/savegame';
import type { Engine } from '../../src/engine/types';

/** Avance jusqu'au début de la vague `w` en tuant tout. */
function reachWave(e: Engine, w: number): void {
  let guard = 0;
  while (e.state.wave < w && guard++ < 20 * 40 * w) {
    for (const en of simState(e).enemies) en.hp = 0;
    e.tick();
    e.drainEvents();
  }
}

describe('sauvegarde de partie Solo', () => {
  it('campagne : sauvegarde au début d’une vague, reprise identique (aller-retour comme dans le profil)', () => {
    const level = getLevel('c2-n4')!;
    const cfg = levelConfig(level, STARTER_DECKS.marvel, null, 1234);
    const e = createEngine(cfg);
    reachWave(e, 7);
    const sg = makeSavedGame('campagne', level.id, cfg, e.serialize(), e.state.wave, 1000);
    // Le profil passe par IndexedDB (clone structuré) : un aller-retour JSON suffit à le simuler.
    const stored = JSON.parse(JSON.stringify({ savedGame: sg })) as { savedGame: typeof sg };
    const back = readSavedGame(stored)!;
    expect(back).toMatchObject({ kind: 'campagne', levelId: 'c2-n4', savedAt: 1000, state: { wave: 7 } });
    expect(savedGameLabel(back)).toBe(`Niveau 2-4 · vague 7 / ${level.waves}`);
    const r = createEngine(back.state.config, back.state.engine);
    expect(r.serialize()).toBe(e.serialize());
    for (let t = 0; t < 20 * 45; t++) { e.tick(); r.tick(); e.drainEvents(); r.drainEvents(); }
    expect(r.serialize()).toBe(e.serialize());
  });

  it('Solo Infini et sauvegardes illisibles', () => {
    const cfg = { mode: 'solo' as const, seed: 5, mapId: 'toits-new-york', players: [{ id: 'p1' as const, deck: STARTER_DECKS.disney, levels: {}, talents: {} }] };
    const sg = makeSavedGame('infini', undefined, cfg, createEngine(cfg).serialize(), 23);
    expect(savedGameLabel(readSavedGame({ savedGame: sg })!)).toBe('Solo Infini · vague 23');
    expect(readSavedGame({})).toBeNull();
    expect(readSavedGame(null)).toBeNull();
    expect(readSavedGame({ savedGame: { kind: 'campagne', state: { engine: 'x', config: cfg, wave: 2 }, savedAt: 0 } })).toBeNull(); // sans niveau
    expect(readSavedGame({ savedGame: { kind: 'infini', state: 'ancien format', savedAt: 0 } })).toBeNull();
  });
});
