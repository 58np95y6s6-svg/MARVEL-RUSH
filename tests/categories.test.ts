import { describe, expect, it } from 'vitest';
import { UNIT_LIST } from '../src/data/units';
import { HERO_CATEGORIES, UNIT_CATEGORIES, categoriesFor, deriveCategories, rangeLabel } from '../src/data/categories';
import { AWAKENING_COPY_COSTS, LEVEL_COPY_COSTS, getHeroProgress, nextStep } from '../src/meta/collection';

describe('catégories de héros', () => {
  it('chaque héros a au moins une catégorie connue', () => {
    for (const u of UNIT_LIST) {
      const cats = categoriesFor(u);
      expect(cats.length, u.id).toBeGreaterThan(0);
      for (const c of cats) expect(HERO_CATEGORIES[c], `${u.id}:${c}`).toBeDefined();
    }
  });

  it('la table couvre les 28 héros actuels et les catégories sont valides', () => {
    for (const u of UNIT_LIST) expect(UNIT_CATEGORIES[u.id], u.id).toBeDefined();
    for (const [id, cats] of Object.entries(UNIT_CATEGORIES)) {
      expect(cats?.length, id).toBeGreaterThan(0);
      for (const c of cats ?? []) expect(HERO_CATEGORIES[c], `${id}:${c}`).toBeDefined();
    }
  });

  it('archétypes de stratégie', () => {
    expect(UNIT_CATEGORIES.widow).toContain('mana');
    expect(UNIT_CATEGORIES.tiana).toContain('mana');
    expect(UNIT_CATEGORIES.loki).toContain('manipulation');
    expect(UNIT_CATEGORIES.coco).toContain('manipulation');
    expect(UNIT_CATEGORIES.vanralph).toContain('manipulation');
    expect(UNIT_CATEGORIES.venom).toContain('croissance');
  });

  it('un héros inconnu reçoit des catégories déduites', () => {
    const base = { id: 'inconnu', role: 'Dégâts', ability: { params: {} } };
    expect(categoriesFor({ ...base, range: 'globale' })).toEqual(['tireur']);
    expect(categoriesFor({ ...base, range: 1.6 })).toEqual(['melee']);
    expect(deriveCategories({ ...base, range: 2.4, ability: { params: { swapAlly: 1 } } })).toEqual(['manipulation']);
    expect(deriveCategories({ ...base, range: 2.4 }).length).toBeGreaterThan(0);
    expect(rangeLabel(undefined)).toBe('toute la map');
    expect(rangeLabel(1.6)).toBe('courte');
  });
});

describe('progression de collection (accroche)', () => {
  it('valeur par défaut et coûts', () => {
    const p = getHeroProgress('ironman');
    expect(p).toEqual({ owned: true, level: 1, awakening: 0, copies: 0 });
    expect(LEVEL_COPY_COSTS.reduce((a, b) => a + b, 0)).toBe(21);
    expect(AWAKENING_COPY_COSTS.reduce((a, b) => a + b, 0)).toBe(130);
    expect(nextStep(p)).toEqual({ kind: 'niveau', target: 2, needed: 1 });
    expect(nextStep({ ...p, level: 10 })).toEqual({ kind: 'eveil', target: 1, needed: 2 });
    expect(nextStep({ ...p, level: 10, awakening: 10 })).toBeNull();
  });
});
