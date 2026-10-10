// Tutoriel guidé (§5.0) et astuces contextuelles : point d'entrée pour l'application (src/ui/app.ts).
import { getProfile, updateProfile } from '../meta/profile';
import { initPart2 } from './part2';
import { STEP, currentStep, isPart1, shouldAutoComplete } from './steps';
import { setNav } from './state';
import { initTips } from './tips';

export { replayTutorial, skipTutorial } from './state';

let started = false;
export function initTutorial(o: { go: (hash: string) => void }): void {
  setNav(o.go);
  if (started) return;
  started = true;
  initPart2();
  initTips();
}

/** Joueurs existants avec de la progression : tutoriel marqué comme fait, sans le forcer. */
export async function migrateTutorial(): Promise<void> {
  const p = getProfile();
  if (p && shouldAutoComplete(p)) await updateProfile((q) => { q.tutorialDone = true; });
}

/** Le combat du tutoriel (partie 1) doit-il être affiché à la place de l'écran demandé ? */
export function wantsTutorialBattle(): boolean {
  const s = currentStep(getProfile());
  return s !== null && isPart1(s);
}

/** Route à prendre juste après le choix du deck de départ. */
export function afterOnboardingRoute(): string {
  const s = currentStep(getProfile());
  if (s === null) return '#tirages';
  return isPart1(s) ? '#tutoriel' : s === STEP.pack ? '#tirages' : '';
}
