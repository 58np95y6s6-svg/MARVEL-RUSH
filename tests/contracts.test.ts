import { describe, expect, it } from 'vitest';
import { GRID_SIZE, MAX_RANK, TICKS_PER_SECOND } from '../src/engine/types';
import { PROTOCOL_VERSION } from '../src/net/protocol';

describe('contrats', () => {
  it('grille et constantes de Rush Royale', () => {
    expect(GRID_SIZE).toBe(15);
    expect(MAX_RANK).toBe(7);
    expect(TICKS_PER_SECOND).toBe(20);
    expect(PROTOCOL_VERSION).toBeGreaterThanOrEqual(1);
  });
});
