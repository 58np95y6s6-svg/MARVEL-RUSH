// Tutoriel, partie 1 (§5.0) : premier combat scénarisé, impossible à perdre. Invoquer, obtenir une paire
// (invocations truquées), fusion guidée, deuxième fusion, amélioration, boss faible au pouvoir montré au
// ralenti, puis victoire qui explique l'or, les gemmes et l'XP.
import { BOSSES } from '../data/bosses';
import type { BossId, UnitId } from '../data/types';
import { STARTER_DECKS, UNITS } from '../data/units';
import { POWERUP_COSTS, type EngineEvent } from '../engine';
import { debugPlace, simState } from '../engine/debug';
import { getProfile } from '../meta/profile';
import type { BattleTutoApi } from '../ui/battleHooks';
import { icon } from '../ui/kit';
import type { Target } from './coach';
import { STEP, TUTORIAL_REWARD, currentStep, findPair, forcedSummons, mostPresent, resumeBoard, tutorialBoss, tutorialMap, type StepId } from './steps';
import { getCoach, grantTutorialReward, onSkip, setStep } from './state';

const SUMMON = '[data-tuto="summon"]';
const name = (u: UnitId) => UNITS[u].name;

/** Le pouvoir du boss, en une phrase. */
const POWER_EXPLAIN: Partial<Record<BossId, string>> = {
  bouffon: 'le Bouffon Vert lance des bombes qui <b>étourdissent</b> tes héros 2 secondes. Pas de panique : ils repartent tout seuls !',
  malefique: 'Maléfique <b>endort</b> une ligne de héros pendant 3 secondes. Ils se réveillent tout seuls !',
};

export function mountTutorialBattle(root: HTMLElement, o: { onDone: () => void; onExit: () => void }): () => void {
  const p = getProfile();
  const starter = p?.starter ?? 'marvel';
  const deck = STARTER_DECKS[starter].slice();
  const startAt: StepId = currentStep(p) ?? STEP.summon;
  let alive = true;
  let cleanupBattle: (() => void) | null = null;
  const timers: number[] = [];
  const offs: (() => void)[] = [];
  const coach = getCoach();

  // Reprise après la victoire : direction la partie 2.
  if (startAt >= STEP.victory) {
    void grantTutorialReward().then(() => setStep(STEP.pack)).then(() => { if (alive) o.onDone(); });
    return () => { alive = false; };
  }

  const boss = tutorialBoss(starter);
  void import('../ui/battle').then(({ mountBattle }) => {
    if (!alive) return;
    const b = mountBattle(root, {
      deck,
      mapId: tutorialMap(starter),
      seed: 20240917,
      title: 'Tutoriel',
      onHome: o.onExit,
      onReplay: o.onExit,
      config: {
        mode: 'tutoriel',
        prepTime: 0,
        players: [{ id: 'p1', deck: deck.slice(), levels: {}, talents: {} }],
        script: {
          forcedSummons: forcedSummons(deck),
          enemyHpMultiplier: 0.35,
          startMana: 400,
          noLifeLoss: true,
          bossAtWave: 2,
          bossId: boss,
          endOnBossKill: true,
        },
      },
      onEnd: () => { void victory(); return true; },
      onReady: (api) => { void run(api).catch((err: unknown) => { if (alive) console.error(err); }); },
    });
    cleanupBattle = () => b.destroy();
  });

  let api: BattleTutoApi | null = null;
  let stepNow: StepId = startAt;
  const waiters: { test: () => boolean; done: () => void }[] = [];
  const evWaiters: { test: (e: EngineEvent) => boolean; done: (e: EngineEvent) => void }[] = [];

  function pump(): void {
    for (const w of waiters.slice()) if (w.test()) { waiters.splice(waiters.indexOf(w), 1); w.done(); }
  }
  const until = (test: () => boolean) => new Promise<void>((done) => { waiters.push({ test, done }); pump(); });
  const untilEvent = <T extends EngineEvent['type']>(type: T, extra: (e: Extract<EngineEvent, { type: T }>) => boolean = () => true) =>
    new Promise<Extract<EngineEvent, { type: T }>>((done) => {
      evWaiters.push({ test: (e) => e.type === type && extra(e as Extract<EngineEvent, { type: T }>), done: done as (e: EngineEvent) => void });
    });
  const tap = (text: string, target: Target, extra: Partial<Parameters<typeof coach.show>[0]> = {}) =>
    coach.show({ text, holes: [target], hand: { tap: target }, ...extra });
  const next = (text: string, label: string, extra: Partial<Parameters<typeof coach.show>[0]> = {}) =>
    new Promise<void>((done) => coach.show({ text, next: label, allow: 'none', onNext: done, ...extra }));
  const go = async (s: StepId) => { stepNow = s; await setStep(s); };
  const cell = (slot: number): Target => () => api?.cellRect(slot) ?? null;

  async function run(a: BattleTutoApi): Promise<void> {
    api = a;
    const eng = a.engine;
    const st = simState(eng);
    const me = st.players[0]!;
    offs.push(a.onEvents((evs) => {
      for (const e of evs) for (const w of evWaiters.slice()) if (w.test(e)) { evWaiters.splice(evWaiters.indexOf(w), 1); w.done(e); }
      pump();
    }));
    // Avant le boss, la vague 1 ne finit pas : le joueur prend son temps.
    timers.push(window.setInterval(() => {
      if (!alive) return;
      if (stepNow < STEP.boss && st.phase !== 'fin' && st.wave === 1) st.waveTimeLeft = Math.max(st.waveTimeLeft, 20);
      pump();
    }, 120));

    if (startAt > STEP.summon) {
      const rb = resumeBoard(startAt, deck);
      for (const u of rb.units) debugPlace(eng, 0, u.slot, u.unit, u.rank);
      me.summons = rb.summons;
      me.summonCost = 10 + 10 * rb.summons;
    }

    // 1. Invoquer
    if (stepNow <= STEP.summon) {
      tap('Des ennemis arrivent ! Touche <b>Invoquer</b> pour appeler un héros.', SUMMON);
      await until(() => me.summons >= 1);
      await go(STEP.summonMore);
    }
    // 2. Jusqu'à une paire
    if (stepNow <= STEP.summonMore) {
      tap('Encore ! Invoque jusqu’à avoir <b>deux héros identiques</b>.', SUMMON);
      await until(() => !!findPair(me.grid));
      await go(STEP.merge);
    }
    // 3. Première fusion
    if (stepNow <= STEP.merge) {
      const m = await guidedMerge(a, 'Fais glisser {u} sur son <b>jumeau</b> pour les <b>fusionner</b> !');
      await go(STEP.merge2);
      if (m) {
        await new Promise<void>((r) => window.setTimeout(r, 450));
        await next('Fusionné ! Le nouveau héros a <b>2 pastilles</b> : plus il en a, plus il est fort. Il est tiré au hasard dans ton deck.', 'OK', {
          holes: [cell(m.to)], dim: true, place: 'bottom', pad: 4,
        });
      }
    }
    // 4. Pastilles, puis deuxième fusion
    if (stepNow <= STEP.merge2) {
      if (!findPair(me.grid)) {
        tap('Invoque encore une fois !', SUMMON);
        await until(() => !!findPair(me.grid));
      }
      await guidedMerge(a, 'Plus de pastilles = plus fort ! Fusionne aussi {u}.');
      await go(STEP.powerup);
    }
    // 5. Amélioration
    if (stepNow <= STEP.powerup) {
      const unit = mostPresent(me.grid, me.deck);
      if (me.mana < POWERUP_COSTS[0]!) me.mana = POWERUP_COSTS[0]! + 20;
      const sel = `[data-tuto="powerup-${unit}"]`;
      tap(`Touche l’<b>amélioration</b> de <b>${name(unit)}</b> sous la grille : tous les ${name(unit)} deviennent plus forts !`, sel);
      await untilEvent('powerup');
      await go(STEP.boss);
    }
    // 6. Le boss
    await next('Bien joué ! Attention… un <b>boss</b> arrive !', 'Prêt !', { place: 'center', dim: true });
    coach.hide();
    st.waveTimeLeft = 0.1;
    await untilEvent('bossSpawn');
    const bossEnemy = st.enemies.find((e) => e.bossId);
    if (bossEnemy) {
      // Boss faible, mais il doit vivre assez pour montrer son pouvoir.
      bossEnemy.hp = bossEnemy.maxHp = 1600;
      bossEnemy.x.powerIn = 3.2;
    }
    const pw = await untilEvent('bossPower');
    a.setRate(0.15);
    const def = BOSSES[pw.boss];
    await next(`<b>${def.power.name}</b> : ${POWER_EXPLAIN[pw.boss] ?? def.power.description}`, 'Compris !', {
      holes: pw.slots.map(cell), dim: true, place: 'top',
    });
    a.setRate(1);
    coach.show({ text: 'Invoque, fusionne, améliore : à toi de battre le boss !', allow: 'all', dim: false, place: 'top' });
    timers.push(window.setTimeout(() => { if (alive && stepNow === STEP.boss) coach.hide(); }, 3500));
  }

  async function guidedMerge(a: BattleTutoApi, text: string): Promise<Extract<EngineEvent, { type: 'merge' }> | null> {
    const grid = a.engine.state.players[0]!.grid;
    const pair = findPair(grid);
    if (!pair) return null;
    const [from, to] = pair;
    const unit = grid[from]!.unit;
    coach.show({
      text: text.replace('{u}', `<b>${name(unit)}</b>`),
      holes: [cell(from), cell(to)],
      hand: { from: cell(from), to: cell(to) },
      pad: 4,
      place: 'bottom',
    });
    a.showMerges(from);
    const glow = window.setInterval(() => { if (alive) a.showMerges(from); }, 900);
    timers.push(glow);
    const ev = await untilEvent('merge');
    window.clearInterval(glow);
    a.hideMerges();
    return ev;
  }

  // 7. Victoire : or, gemmes et XP expliqués.
  async function victory(): Promise<void> {
    stepNow = STEP.victory;
    coach.hide();
    await grantTutorialReward();
    await setStep(STEP.victory);
    if (!alive) return;
    const host = api?.root ?? root;
    const w = document.createElement('div');
    w.className = 'tu-win';
    w.innerHTML = `<div class="tu-win-box">
      <h2>Victoire !</h2>
      <div class="tu-win-row">
        <div>${icon('or')}<p><b>+${TUTORIAL_REWARD.gold} or</b><span>Pour faire monter tes héros de niveau (avec leurs cartes).</span></p></div>
        <div>${icon('gemmes')}<p><b>+${TUTORIAL_REWARD.shards} gemmes</b><span>Pour ouvrir des packs et trouver de nouveaux héros.</span></p></div>
        <div>${icon('xp')}<p><b>+${TUTORIAL_REWARD.xp} XP</b><span>Ton niveau de compte monte : nouveaux decks et nouveaux modes.</span></p></div>
      </div>
      <button class="mr-btn yellow" data-tuto="tuto-continue">Continuer</button></div>`;
    w.querySelector('button')!.addEventListener('click', async () => {
      await setStep(STEP.pack);
      if (alive) o.onDone();
    });
    window.setTimeout(() => { if (alive) host.appendChild(w); }, 700);
  }

  offs.push(onSkip(() => { alive = false; }));
  return () => {
    alive = false;
    for (const t of timers) { window.clearInterval(t); window.clearTimeout(t); }
    for (const f of offs) f();
    coach.hide();
    cleanupBattle?.();
  };
}
