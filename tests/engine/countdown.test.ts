// Compte à rebours de début de partie (GameConfig.prepTime) : on invoque déjà, rien ne bouge.
import { describe, expect, it } from 'vitest';
import { TICKS_PER_SECOND } from '../../src/engine';
import { ofType, solo, step } from './helpers';

describe('compte à rebours de début de partie', () => {
  it('3 s sans ennemis ni écoulement du temps, mais les invocations passent', () => {
    const e = solo(undefined, { prepTime: 3 });
    e.drainEvents();
    e.apply({ type: 'summon', player: 'p1' });
    const ev = step(e, 3 * TICKS_PER_SECOND - 1);
    expect(ofType(ev, 'summon').length).toBe(1);
    expect(e.state.enemies.length).toBe(0);
    expect(e.state.tick).toBe(0);
    expect(e.state.countdown).toBeGreaterThan(0);
    step(e, 1 + 2 * TICKS_PER_SECOND);
    expect(e.state.countdown).toBe(0);
    expect(e.state.tick).toBeGreaterThan(0);
    expect(e.state.enemies.length).toBeGreaterThan(0);
  });

  it('absent = la partie commence tout de suite', () => {
    const e = solo();
    step(e, 1);
    expect(e.state.tick).toBe(1);
  });
});
