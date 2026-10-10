// Tutoriel, partie 2 (§5.0) : le méta-jeu guidé dans les menus. 8 ouvrir le premier pack (10 tirages
// offerts, animation complète avec « Passer »), 9 mettre la nouvelle unité dans le deck (glisser guidé,
// bonus d'équipe expliqué), 10 lancer le niveau 1 de la campagne (rappels discrets ensuite).
//
// Le guidage se recalcule à partir de l'écran affiché (DOM) : chaque état visible a sa bulle.
import { UNITS } from '../data/units';
import { onMeta } from '../meta/events';
import { getProfile, onProfileChange, updateProfile } from '../meta/profile';
import { freePullsFor } from '../meta/pulls';
import type { CoachStep } from './coach';
import { STEP, currentStep, isPart1, onStepScreen, pickDeckSlot, pickNewUnit, routeForStep, teamBonusWith } from './steps';
import { completeTutorial, dropCoach, getCoach, go, setStep } from './state';

let screen: string | null = null;
let shownKey = '';
/** Étape 9 terminée : explication du bonus d'équipe en cours (ne pas recalculer le guidage). */
let explaining = false;
/** Le prochain combat de campagne reçoit les rappels discrets (« Pense à fusionner ! »). */
let remindNextBattle = false;
export function takeReminderFlag(): boolean { const r = remindNextBattle; remindNextBattle = false; return r; }

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
const nameOf = (u: string) => esc(UNITS[u as keyof typeof UNITS]?.name ?? u);

function show(key: string, step: CoachStep | null): void {
  if (key === shownKey) return;
  shownKey = key;
  if (step) getCoach().show(step);
  else getCoach().hide();
}

/** Recalcule le guidage de l'étape en cours d'après l'écran visible. */
function drive(): void {
  const p = getProfile();
  const s = currentStep(p);
  if (!p || s === null || isPart1(s)) return;
  if (explaining) return;
  if (screen === null || screen === 'creation' || screen === 'tutoriel' || screen === 'combat' || screen === 'campagne-combat') return;
  if (!onStepScreen(s, screen)) {
    shownKey = ''; getCoach().hide(); go(routeForStep(s));
    return;
  }

  if (s === STEP.pack) {
    const starter = p.starter ?? 'marvel';
    if (document.querySelector('.po')) { show('pack-opening', null); return; }
    if (freePullsFor(p, starter) > 0) {
      const btn = '[data-tuto="pack-open-free"]';
      if (!document.querySelector(btn)) return;
      show('pack', {
        text: 'Ouvre ton <b>premier pack</b> : <b>10 invocations offertes</b>, dont au moins un héros Épique !',
        holes: [btn], hand: { tap: btn },
      });
    } else {
      show('pack-none', {
        text: 'Ici, tu ouvres des <b>packs</b> avec tes <b>éclats</b> pour trouver de nouveaux héros.',
        next: 'Continuer', allow: 'none', place: 'center', dim: true,
        onNext: () => { void setStep(STEP.deck).then(() => { shownKey = ''; go('#collection'); }); },
      });
    }
    return;
  }

  if (s === STEP.deck) {
    const unit = p.tutorialUnit ?? pickNewUnit(p);
    const deck = p.decks[p.activeDeck] ?? [];
    if (!unit) { void setStep(STEP.campaign).then(drive); return; }
    if (deck.includes(unit)) { void finishDeckStep(unit); return; }
    const slot = pickDeckSlot(deck, unit);
    const slotSel = `.co-slot[data-slot="${slot}"]`;
    const deckName = nameOf(deck[slot] ?? '');
    // Fiche du héros ouverte (toucher au lieu de glisser) : « Au deck ».
    const toDeck = document.querySelector('[data-tuto="hero-to-deck"]');
    if (toDeck) {
      show(`deck-sheet-${unit}`, { text: `Touche <b>Au deck</b> pour prendre ${nameOf(unit)} dans ton équipe.`, holes: ['[data-tuto="hero-to-deck"]'], hand: { tap: '[data-tuto="hero-to-deck"]' } });
      return;
    }
    if (document.querySelector('.mk-sheet-wrap:not(.out)')) {
      show('deck-close', { text: 'Ferme cette fiche.', holes: ['.mk-close'], hand: { tap: '.mk-close' } });
      return;
    }
    const placing = document.querySelector('.co-place:not([hidden])');
    if (placing) {
      show(`deck-place-${slot}`, { text: `Touche la case de <b>${deckName}</b>.`, holes: [slotSel], hand: { tap: slotSel } });
      return;
    }
    const card = document.querySelector<HTMLElement>(`.co-list [data-tuto="collection-card-${unit}"]`);
    if (!card) return;
    // La carte doit être visible dans la grille (défilement interne seulement).
    const list = card.closest<HTMLElement>('.co-list');
    if (list) {
      const lr = list.getBoundingClientRect(), cr = card.getBoundingClientRect();
      if (cr.top < lr.top + 8 || cr.bottom > lr.bottom - 8) list.scrollTop += cr.top - lr.top - (lr.height - cr.height) / 2;
    }
    const cardSel = `.co-list [data-tuto="collection-card-${unit}"]`;
    show(`deck-drag-${unit}-${slot}`, {
      text: `Nouveau héros ! Maintiens <b>${nameOf(unit)}</b> puis glisse-le sur <b>${deckName}</b> pour le mettre dans ton <b>deck</b>.`,
      holes: [cardSel, slotSel], hand: { from: cardSel, to: slotSel, hold: true }, pad: 4,
    });
    return;
  }

  if (s === STEP.campaign) {
    const play = '[data-tuto="level-play"]';
    if (!document.querySelector(play)) {
      if (screen === 'campagne' && !document.querySelector('.cp-level-sheet')) { shownKey = ''; go('#campagne/1/1'); }
      return;
    }
    show('campaign', { text: 'Ton équipe est prête. Lance le <b>niveau 1</b> de la campagne !', holes: [play], hand: { tap: play } });
  }
}

async function finishDeckStep(unit: string): Promise<void> {
  if (explaining) return;
  explaining = true;
  const p = getProfile();
  const deck = p?.decks[p.activeDeck] ?? [];
  const team = teamBonusWith(deck, unit as never);
  await setStep(STEP.campaign);
  const done = () => { explaining = false; shownKey = ''; go('#campagne/1/1'); };
  if (team) {
    shownKey = 'team';
    getCoach().show({
      text: `Bonus d’équipe <b>${esc(team.team.name)}</b> activé : ${esc(team.team.description)}`,
      holes: ['[data-tuto="deck-teams"]'], allow: 'none', next: 'Super !', onNext: done,
    });
  } else {
    shownKey = 'deck-ok';
    getCoach().show({ text: `${nameOf(unit)} rejoint ton deck !`, holes: ['[data-tuto="deck-panel"]'], allow: 'none', next: 'Continuer', onNext: done });
  }
}

export function initPart2(): void {
  onMeta('screen', ({ route }) => {
    screen = route;
    shownKey = '';
    // Fin : le niveau 1 est lancé.
    const s = currentStep(getProfile());
    if (s === STEP.campaign && route === 'campagne-combat') {
      remindNextBattle = true;
      void completeTutorial();
      return;
    }
    window.setTimeout(drive, 60);
  });
  onMeta('packOpened', ({ results }) => {
    const p = getProfile();
    if (currentStep(p) !== STEP.pack || !p) return;
    const unit = pickNewUnit(p, results);
    void updateProfile((q) => { q.tutorialStep = STEP.deck; if (unit) q.tutorialUnit = unit; else delete q.tutorialUnit; })
      .then(() => { shownKey = ''; go('#collection'); });
  });
  onMeta('deckChanged', ({ deck }) => {
    const p = getProfile();
    if (currentStep(p) !== STEP.deck || !p?.tutorialUnit) return;
    if (deck.includes(p.tutorialUnit)) void finishDeckStep(p.tutorialUnit);
  });
  onMeta('heroSheet', () => { shownKey = ''; window.setTimeout(drive, 250); });
  onProfileChange((p) => {
    if (!p || currentStep(p) === null) { if (getProfile() === p) dropCoachIfIdle(); }
  });
  // Ouvertures et fermetures de fiches, défilement : on recalcule régulièrement.
  window.setInterval(drive, 300);
}

function dropCoachIfIdle(): void {
  shownKey = '';
  explaining = false;
  dropCoach();
}
