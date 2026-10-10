import { describe, expect, it } from 'vitest';
import { STARTER_DECKS } from '../../src/data/units';
import { applyStarter } from '../../src/meta/decks';
import { blankProfile } from '../../src/meta/profile';
import type { PullResult } from '../../src/meta/pulls';
import {
  LAST_STEP, STEP, archetypeOf, currentStep, findPair, forcedSummons, hasProgress, isPart1, mostPresent, nextStep,
  onStepScreen, pickDeckSlot, pickNewUnit, resumeBoard, routeForStep, shouldAutoComplete, tipPending, tutorialPair,
} from '../../src/tutorial/steps';

function fresh(starter: 'marvel' | 'disney' = 'marvel') {
  const p = blankProfile('Test', 'spiderman');
  applyStarter(p, starter);
  return p;
}

describe('tutoriel : étapes', () => {
  it('commence à l’étape 1 après le deck de départ, rien avant', () => {
    const p = blankProfile('Test', 'spiderman');
    expect(currentStep(p)).toBeNull();
    applyStarter(p, 'marvel');
    expect(currentStep(p)).toBe(STEP.summon);
    p.tutorialStep = 9;
    expect(currentStep(p)).toBe(STEP.deck);
    p.tutorialDone = true;
    expect(currentStep(p)).toBeNull();
  });

  it('enchaîne les 10 étapes, partie 1 puis partie 2', () => {
    let s = STEP.summon as number;
    const seen: number[] = [s];
    for (let n = nextStep(STEP.summon); n !== null; n = nextStep(n)) { seen.push(n); s = n; }
    expect(seen).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(s).toBe(LAST_STEP);
    expect(isPart1(STEP.victory)).toBe(true);
    expect(isPart1(STEP.pack)).toBe(false);
  });

  it('associe chaque étape à son écran', () => {
    expect(routeForStep(STEP.merge)).toBe('#tutoriel');
    expect(routeForStep(STEP.pack)).toBe('#tirages');
    expect(routeForStep(STEP.deck)).toBe('#collection');
    expect(routeForStep(STEP.campaign)).toBe('#campagne/1/1');
    expect(onStepScreen(STEP.deck, 'decks')).toBe(true);
    expect(onStepScreen(STEP.campaign, 'campagne/1/1')).toBe(true);
    expect(onStepScreen(STEP.pack, '')).toBe(false);
  });

  it('dispense les joueurs existants qui ont de la progression', () => {
    const p = fresh();
    expect(hasProgress(p)).toBe(false);
    expect(shouldAutoComplete(p)).toBe(false);
    p.pullsDone = 10;
    expect(shouldAutoComplete(p)).toBe(true);
    p.tutorialStep = 9; // tutoriel en cours : on ne l'arrête pas (le tirage offert compte dans pullsDone)
    expect(shouldAutoComplete(p)).toBe(false);
    const q = fresh();
    q.campaign['c1-n1'] = { stars: [true, false, false] };
    expect(shouldAutoComplete(q)).toBe(true);
  });
});

describe('tutoriel : combat scénarisé', () => {
  it('les invocations imposées donnent une paire dès la 3e', () => {
    const deck = STARTER_DECKS.marvel;
    const f = forcedSummons(deck);
    const [a] = tutorialPair(deck);
    expect(f.slice(0, 3)).toEqual([a, deck[1], a]);
    const grid = [{ unit: f[0]!, rank: 1 }, { unit: f[1]!, rank: 1 }, null, { unit: f[2]!, rank: 1 }];
    expect(findPair(grid)).toEqual([0, 3]);
    expect(findPair(grid.slice(0, 2))).toBeNull();
  });

  it('reprise : un plateau cohérent pour chaque étape', () => {
    const deck = STARTER_DECKS.disney;
    expect(resumeBoard(STEP.summon, deck).units).toHaveLength(0);
    const m = resumeBoard(STEP.merge, deck);
    expect(findPair(Array.from({ length: 15 }, (_, i) => m.units.find((u) => u.slot === i) ?? null))).not.toBeNull();
    const m2 = resumeBoard(STEP.merge2, deck);
    expect(m2.summons).toBe(3); // la 4e invocation imposée refait la paire
    expect(forcedSummons(deck)[3]).toBe(m2.units[0]!.unit);
  });

  it('améliore le héros le plus présent', () => {
    const deck = STARTER_DECKS.marvel;
    expect(mostPresent([{ unit: 'falcon', rank: 2 }, { unit: 'hawkeye', rank: 1 }, null], deck)).toBe('falcon');
  });
});

describe('tutoriel : menus', () => {
  it('choisit le meilleur nouveau héros du lot, hors deck', () => {
    const p = fresh();
    p.heroes.ironman = { level: 1, cards: 0, awakening: 0, talents: [null, null, null] };
    p.heroes.loki = { level: 1, cards: 0, awakening: 0, talents: [null, null, null] };
    const res: PullResult[] = [
      { unit: 'loki', rarity: 'epique', outcome: 'nouveau' },
      { unit: 'ironman', rarity: 'legendaire', outcome: 'nouveau' },
      { unit: 'hawkeye', rarity: 'rare', outcome: 'carte' },
    ];
    expect(pickNewUnit(p, res)).toBe('ironman');
    expect(pickNewUnit(p)).toBe('ironman');
    expect(pickNewUnit(fresh())).toBeNull();
  });

  it('pose le héros sur une case valide, de préférence à la place d’un Rare', () => {
    const deck = STARTER_DECKS.marvel;
    const slot = pickDeckSlot(deck, 'ironman');
    expect(slot).toBeGreaterThanOrEqual(0);
    expect(slot).toBeLessThan(5);
    expect(pickDeckSlot(deck, 'falcon')).toBe(deck.indexOf('falcon'));
  });

  it('archétypes et astuces vues une seule fois', () => {
    expect(archetypeOf('loki')).toBe('copie');
    expect(archetypeOf('coco')).toBe('promotion');
    expect(archetypeOf('vanralph')).toBe('echange');
    expect(archetypeOf('widow')).toBe('sacrifice');
    expect(archetypeOf('hawkeye')).toBeNull();
    const p = fresh();
    expect(tipPending(p, 'talents')).toBe(true);
    p.tips = { talents: true };
    expect(tipPending(p, 'talents')).toBe(false);
  });
});
