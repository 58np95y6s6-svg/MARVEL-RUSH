// Écran de combat Solo : moteur + scène PixiJS + interface HTML (HUD, commandes, glisser-fusionner).
import './battle.css';
import { bossSvg, unitSvg, minionSvg } from '../art';
import { BOSSES, LIEUTENANTS } from '../data/bosses';
import type { BossId, UnitId } from '../data/types';
import { UNITS } from '../data/units';
import {
  GRID_SIZE, MANA_UPGRADE_BONUS, MANA_UPGRADE_COSTS, MANA_UPGRADE_MAX, MAX_RANK, POWERUP_ATTACK_SPEED, POWERUP_COSTS,
  COOP_LIVES, POWERUP_DAMAGE, POWERUP_MAX, RANK_ATTACK_SPEED, START_LIVES, RANK_DAMAGE, TICKS_PER_SECOND, bossWaveKind, createEngine, dropAction,
  formationLength, growthBonus, growthPointsOf, rangeLabel,
  type Command, type Engine, type EngineEvent, type GameConfig, type PlayerId,
} from '../engine';
import { getMap } from '../maps';
import { BattleScene, type Fit } from '../render/scene';
import { createBattleTracker, type BattleOutcome } from '../campaign/tracker';
import { notifyBattleReady, type BattleTutoApi } from './battleHooks';

/** Résultat de fin de combat (campagne) : victoire, vague, vies restantes, deck et statistiques. */
export type BattleResult = BattleOutcome;

const DT = 1 / TICKS_PER_SECOND;

export interface BattleOptions {
  deck: UnitId[];
  mapId?: string;
  seed?: number;
  /** Accélération (développement) : nombre de ticks simulés par tick réel. */
  speed?: number;
  onHome: () => void;
  onReplay: () => void;
  // ---- Ajouts Campagne (optionnels, sans effet si absents) ----
  /** Configuration moteur fusionnée dans la configuration de base (targetWaves, script, players…). */
  config?: Partial<GameConfig>;
  /** Titre de la partie (ex. « Niveau 1-3 »), affiché dans la fenêtre de pause. */
  title?: string;
  /** Fin de partie, avec le résultat et les statistiques. Renvoie true pour remplacer la fenêtre de fin par défaut. */
  onEnd?: (result: BattleResult) => boolean | void;
  // ---- Ajouts Sauvegarde de partie (Campagne / Solo Infini, optionnels) ----
  /** Reprise : état sérialisé (`engine.serialize()`) d'une partie sauvegardée, avec `config` identique. */
  saved?: string;
  /** Début de chaque vague ordinaire (hors boss) à partir de la 2e : l'état à sauvegarder. */
  onWaveSave?: (wave: number, serialized: string) => void;
  // ---- Ajouts Tutoriel (optionnels, sans effet si absents) ----
  /** Scène prête : accès au moteur, aux cases à l'écran, au ralenti (tutoriel guidé, src/tutorial/). */
  onReady?: (api: BattleTutoApi) => void;
}

// ---- Ajout Tutoriel : crochets optionnels (types et abonnés dans ./battleHooks, module léger) ----
export { observeBattles, type BattleTutoApi, type ClientRect } from './battleHooks';

const MANA_SVG = `<svg viewBox="0 0 40 48" aria-hidden="true"><path d="M20 2 C26 14 36 22 36 31 A16 16 0 0 1 4 31 C4 22 14 14 20 2Z" fill="#5fc4ff" stroke="#1d1733" stroke-width="4" stroke-linejoin="round"/><path d="M13 30 a8 8 0 0 0 6 9" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/></svg>`;
const HEART_SVG = `<svg class="mr-heart" viewBox="0 0 58 52" aria-hidden="true"><path d="M29 48 C10 34 3 25 3 15 A12 12 0 0 1 29 9 A12 12 0 0 1 55 15 C55 25 48 34 29 48Z" fill="#ff4a5a" stroke="#1d1733" stroke-width="5" stroke-linejoin="round"/><ellipse cx="16" cy="16" rx="5" ry="3.5" fill="#fff" opacity=".7" transform="rotate(-30 16 16)"/></svg>`;
const TARGETING: Record<string, string> = { premier: 'Vise le plus avancé', aleatoire: 'Vise au hasard', fort: 'Vise le plus résistant' };

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', html = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

const urls: string[] = [];
function svgUrl(svg: string): string {
  const u = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  urls.push(u);
  return u;
}

function readSafeArea(): [number, number, number, number] {
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;visibility:hidden;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';
  document.body.appendChild(probe);
  const cs = getComputedStyle(probe);
  const r: [number, number, number, number] = [parseFloat(cs.paddingTop) || 0, parseFloat(cs.paddingRight) || 0, parseFloat(cs.paddingBottom) || 0, parseFloat(cs.paddingLeft) || 0];
  probe.remove();
  return r;
}

export interface BattleHandle { destroy(): void }

/**
 * Signale qu'une partie est en cours ou non (`mr-game`, detail.running), pour que rien
 * (ex. la proposition de mise à jour) n'interrompe un combat.
 */
let gameRunning = false;
function signalGame(running: boolean): void {
  if (running === gameRunning) return;
  gameRunning = running;
  window.dispatchEvent(new CustomEvent('mr-game', { detail: { running } }));
}
export function isGameRunning(): boolean { return gameRunning; }

export function mountBattle(root: HTMLElement, o: BattleOptions): BattleHandle {
  const me: PlayerId = 'p1';
  const map = getMap(o.config?.mapId ?? o.mapId ?? 'toits-new-york');
  const config: GameConfig = {
    mode: 'solo',
    seed: o.seed ?? (Math.random() * 2 ** 31) >>> 0,
    mapId: map.id,
    players: [{ id: me, deck: o.deck.slice(), levels: {}, talents: {} }],
    prepTime: 3, // compte à rebours de début de partie : on peut déjà placer des unités
    ...o.config, // Campagne : configuration du niveau
  };
  config.mapId = map.id;
  const engine: Engine = createEngine(config, o.saved); // Sauvegarde : reprise si `saved`
  const tracker = createBattleTracker(me); // Campagne : statistiques pour les contraintes d'étoiles

  // ---------------------------------------------------------------- squelette DOM
  const wrap = el('div', 'mr-battle');
  const host = el('div');
  host.style.cssText = 'position:absolute;inset:0';
  const stage = el('div', 'mr-stage');
  const loading = el('div', 'mr-loading', '<span>Chargement…</span>');
  wrap.append(host, stage, loading);
  root.appendChild(wrap);

  // Barre du haut
  const top = el('div', 'mr-top');
  const lives = el('div', 'mr-lives', HEART_SVG.repeat(config.mode === 'coop' ? COOP_LIVES : START_LIVES));
  const wave = el('div', 'mr-wave', '<div class="mr-wave-n mr-outline">Vague 1</div><div class="mr-wave-t mr-outline">0:30</div>');
  const pauseBtn = el('button', 'mr-pause', '<i></i>');
  pauseBtn.setAttribute('aria-label', 'Pause');
  // Vitesse ×1 / ×2 (Solo : campagne et infini), mémorisée sur l'appareil.
  const speedBtn = el('button', 'mr-speed mr-outline-s');
  speedBtn.setAttribute('data-tuto', 'speed');
  let userSpeed = 1;
  try { if (localStorage.getItem('mr-speed') === '2') userSpeed = 2; } catch { /* stockage indisponible */ }
  const showSpeed = (): void => { speedBtn.textContent = `×${userSpeed}`; speedBtn.classList.toggle('on', userSpeed === 2); };
  // Tutoriel : toujours ×1, bouton masqué.
  if (config.mode === 'tutoriel') { userSpeed = 1; speedBtn.hidden = true; }
  showSpeed();
  speedBtn.addEventListener('click', () => {
    userSpeed = userSpeed === 2 ? 1 : 2;
    try { localStorage.setItem('mr-speed', String(userSpeed)); } catch { /* stockage indisponible */ }
    showSpeed();
  });
  const topRight = el('div', 'mr-top-r');
  topRight.append(speedBtn, pauseBtn);
  top.append(lives, wave, topRight);
  const waveN = wave.firstElementChild as HTMLElement, waveT = wave.lastElementChild as HTMLElement;
  const hearts = [...lives.querySelectorAll<SVGElement>('.mr-heart')];

  // Barre du boss
  const bossBar = el('div', 'mr-bossbar', `<div class="mr-boss-face"><img alt=""></div><div class="mr-boss-main"><div class="mr-boss-name mr-outline"><span></span><small></small></div><div class="mr-boss-track"><div class="mr-boss-fill"></div><div class="mr-boss-pct mr-outline">100 %</div></div></div>`);
  const bossImg = bossBar.querySelector('img')!, bossName = bossBar.querySelector('.mr-boss-name span') as HTMLElement;
  const bossRage = bossBar.querySelector('.mr-boss-name small') as HTMLElement;
  const bossFill = bossBar.querySelector('.mr-boss-fill') as HTMLElement, bossPct = bossBar.querySelector('.mr-boss-pct') as HTMLElement;

  // Bandeaux
  const banner = el('div', 'mr-banner', '<img alt=""><span></span>');
  const bannerImg = banner.querySelector('img')!, bannerTxt = banner.querySelector('span')!;
  const toast = el('div', 'mr-toast');
  const wavePop = el('div', 'mr-wavepop mr-outline');

  // Commandes
  const mana = el('div', 'mr-mana', `${MANA_SVG}<b class="mr-outline">100</b>`);
  const manaN = mana.querySelector('b')!;
  /** Libellé court qui monte au-dessus des commandes (amélioration d'un héros, « Mana + »). */
  function floatLabel(text: string): void {
    const f = el('div', 'mr-float-label mr-outline-s');
    f.textContent = text;
    stage.appendChild(f);
    window.setTimeout(() => f.remove(), 1700);
  }
  /** Victoire sur un boss : grosse gerbe « +X mana » au-dessus du plateau. */
  function bossBurst(amount: number): void {
    const f = el('div', 'mr-boss-mana mr-outline-s', `${MANA_SVG}<span>+${amount}</span>`);
    stage.appendChild(f);
    window.setTimeout(() => f.remove(), 2200);
    floatMana(amount);
  }
  /** « +X » qui s'envole du compteur de mana (sacrifice, copie). */
  function floatMana(amount: number): void {
    const f = el('span', 'mr-mana-float mr-outline-s', `+${amount}`);
    mana.appendChild(f);
    window.setTimeout(() => f.remove(), 1200);
  }
  const summon = el('button', 'mr-summon', `<span class="lbl mr-outline">Invoquer</span><span class="cost mr-outline">${MANA_SVG}<span>10</span></span>`);
  summon.dataset['tuto'] = 'summon'; // Méta : repère stable pour le tutoriel guidé
  const summonCost = summon.querySelector('.cost > span') as HTMLElement;
  const extra = el('div', 'mr-extra', '<span class="mr-board-count">0/15</span>');
  const boardCount = extra.firstElementChild as HTMLElement;
  // Rendement du mana (« Mana + ») : +20 % de mana par élimination et par vague, 5 niveaux.
  const manaUp = el('button', 'mr-manaup', `<span class="t mr-outline-s">Mana +</span><span class="lv mr-outline-s">+0 %</span><span class="cost mr-outline-s">${MANA_SVG}<span>50</span></span>`);
  manaUp.setAttribute('aria-label', 'Augmenter le rendement du mana');
  const manaUpLv = manaUp.querySelector('.lv') as HTMLElement, manaUpCost = manaUp.querySelector('.cost > span') as HTMLElement;
  extra.prepend(manaUp);
  const cards = el('div', 'mr-cards');
  const deck = engine.state.players[0]!.deck;
  const cardEls = deck.map((id) => {
    const c = el('button', `mr-card rarity-${UNITS[id].rarity}`, `<img alt="" src="${svgUrl(unitSvg(id, 0))}"><span class="lv mr-outline">Nv.1</span><span class="pct mr-outline-s"></span><span class="cost mr-outline">${MANA_SVG}<span>100</span></span>`);
    c.setAttribute('aria-label', `Améliorer ${UNITS[id].name}`);
    c.dataset['tuto'] = `powerup-${id}`; // Tutoriel : repère du bouton d'amélioration
    cards.appendChild(c);
    return { id, el: c, lv: c.querySelector('.lv') as HTMLElement, pct: c.querySelector('.pct') as HTMLElement, cost: c.querySelector('.cost > span') as HTMLElement, costBox: c.querySelector('.cost') as HTMLElement };
  });
  const info = el('div', 'mr-info');
  const rangeTag = el('div', 'mr-range-tag mr-outline-s');
  const dock = el('div', 'mr-dock');
  dock.append(banner, toast, mana, summon, extra, cards);
  stage.append(top, bossBar, wavePop, dock, info, rangeTag);

  // Fenêtres plein écran (en px CSS)
  const announce = el('div', 'mr-announce', '<div class="box"><div class="tag mr-outline-s">BOSS !</div><img alt=""><div class="name mr-outline-s"></div><div class="sub"></div></div>');
  const pauseModal = el('div', 'mr-modal', `<div class="mr-panel"><h2 class="mr-outline-s">Pause</h2><p>${o.title ? `${o.title}<br>` : ''}La partie est en attente.</p><div class="row"><button class="mr-btn green" data-a="resume">Reprendre</button><button class="mr-btn" data-a="home">Abandonner</button></div></div>`);
  const endModal = el('div', 'mr-modal');
  wrap.append(announce, pauseModal, endModal);
  // Compte à rebours de début de partie (3, 2, 1, GO !) : les unités se placent déjà.
  const countdown = el('div', 'mr-countdown');
  wrap.append(countdown);
  let countdownShown = -1;
  let pendingWavePop = 0;
  function updateCountdown(left: number): void {
    const n = left > 0 ? Math.ceil(left - 1e-6) : 0;
    if (n === countdownShown) return;
    countdownShown = n;
    countdown.innerHTML = n > 0
      ? `<span class="mr-outline">${n}</span><small>Place tes héros !</small>`
      : '<span class="mr-outline go">GO !</span>';
    countdown.classList.remove('tick'); void countdown.offsetWidth; countdown.classList.add('tick');
    if (n === 0) setTimeout(() => {
      countdown.remove();
      if (pendingWavePop) { popWave(pendingWavePop); pendingWavePop = 0; }
    }, 700);
  }

  // ---------------------------------------------------------------- état local
  let scene: BattleScene | null = null;
  let destroyed = false;
  let raf = 0;
  let last = 0;
  let acc = 0;
  let userPaused = false;
  let over = false;
  const speed = Math.max(1, o.speed ?? 1);
  let infoSlot = -1;
  let infoUnit: UnitId | null = null;
  let toastTimer = 0;

  const apply = (c: Command) => engine.apply(c);
  // Tutoriel : ralenti, gel et abonnés aux événements (voir BattleTutoApi).
  let tutoRate = 1;
  let tutoHeld = false;
  const tutoListeners = new Set<(evs: EngineEvent[]) => void>();

  // ---------------------------------------------------------------- mise à l'échelle de l'interface
  const onFit = (f: Fit) => {
    stage.style.transform = `translate(${f.x}px, ${f.y}px) scale(${f.scale})`;
    stage.style.setProperty('--ext-top', `${f.extTop}px`);
    stage.style.setProperty('--ext-bottom', `${f.extBottom}px`);
  };

  // ---------------------------------------------------------------- HUD
  const cache = { manaUp: '', mana: -1, cost: -1, wave: -1, time: '', lives: -1, count: -1, summonOff: null as boolean | null, cards: [] as string[], banner: '', bossKey: '', bossPct: -1, rage: '' };

  function showToast(msg: string): void {
    toast.textContent = msg;
    toast.classList.remove('on');
    void toast.offsetWidth;
    toast.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('on'), 1600);
  }

  function shakeEl(e: HTMLElement): void {
    e.classList.remove('mr-shake');
    void e.offsetWidth;
    e.classList.add('mr-shake');
  }

  function updateHud(): void {
    const st = engine.state;
    if (countdown.isConnected) updateCountdown(st.countdown ?? 0);
    const p = st.players[0]!;
    const m = Math.floor(p.mana);
    if (m !== cache.mana) {
      if (m > cache.mana && cache.mana >= 0) { mana.classList.remove('gain'); void mana.offsetWidth; mana.classList.add('gain'); }
      cache.mana = m;
      manaN.textContent = String(m);
    }
    if (p.summonCost !== cache.cost) { cache.cost = p.summonCost; summonCost.textContent = String(p.summonCost); }
    let count = 0;
    for (let i = 0; i < GRID_SIZE; i++) if (p.grid[i]) count++;
    if (count !== cache.count) { cache.count = count; boardCount.textContent = `${count}/${GRID_SIZE}`; }
    const off = p.mana < p.summonCost || count >= GRID_SIZE;
    if (off !== cache.summonOff) { cache.summonOff = off; summon.classList.toggle('off', off); summon.classList.toggle('ready', !off); }

    cardEls.forEach((c, i) => {
      const lv = p.powerUps[c.id] ?? 1;
      const max = lv >= POWERUP_MAX;
      const cost = max ? 0 : POWERUP_COSTS[lv - 1]!;
      const off2 = max || p.mana < cost;
      const key = `${lv}|${off2 ? 1 : 0}`;
      if (cache.cards[i] === key) return;
      cache.cards[i] = key;
      c.lv.textContent = max ? 'MAX' : `Nv.${lv}`;
      c.pct.textContent = lv > 1 ? `+${Math.round(POWERUP_DAMAGE * 100 * (lv - 1))} %` : '';
      c.cost.textContent = max ? 'MAX' : String(cost);
      (c.costBox.firstElementChild as HTMLElement).style.display = max ? 'none' : '';
      c.el.classList.toggle('off', off2 && !max);
      c.el.classList.toggle('max', max);
    });

    const ml = p.manaLevel ?? 0;
    const mmax = ml >= MANA_UPGRADE_MAX;
    const mkey = `${ml}|${mmax || p.mana < MANA_UPGRADE_COSTS[ml]! ? 1 : 0}`;
    if (mkey !== cache.manaUp) {
      cache.manaUp = mkey;
      manaUpLv.textContent = `+${Math.round(MANA_UPGRADE_BONUS * 100 * ml)} %`;
      manaUpCost.textContent = mmax ? 'MAX' : String(MANA_UPGRADE_COSTS[ml]);
      (manaUp.querySelector('.cost svg') as SVGElement).style.display = mmax ? 'none' : '';
      manaUp.classList.toggle('off', mkey.endsWith('1') && !mmax);
      manaUp.classList.toggle('max', mmax);
    }

    if (st.wave !== cache.wave) {
      cache.wave = st.wave;
      waveN.textContent = engine.config.targetWaves ? `Vague ${st.wave}/${engine.config.targetWaves}` : `Vague ${st.wave}`;
    }
    const isBoss = st.phase === 'boss' || (st.phase === 'pause' && engine.state.enemies.some((e) => e.bossId || e.giant));
    const secs = isBoss ? -1 : Math.ceil(st.waveTimeLeft);
    const tt = isBoss ? 'BOSS' : `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    if (tt !== cache.time) { cache.time = tt; waveT.textContent = tt; waveT.classList.toggle('boss', isBoss); }

    if (st.lives !== cache.lives) {
      hearts.forEach((h, i) => {
        const lost = i >= st.lives;
        if (lost && !h.classList.contains('lost')) { h.classList.add('breaking'); window.setTimeout(() => h.classList.remove('breaking'), 650); }
        h.classList.toggle('lost', lost);
      });
      cache.lives = st.lives;
    }

    // Barre du boss
    const boss = st.enemies.find((e) => e.bossId || e.giant);
    if (boss) {
      const small = !boss.bossId;
      const id = (boss.bossId ?? boss.minionOf) as BossId;
      const key = `${boss.uid}`;
      if (cache.bossKey !== key) {
        cache.bossKey = key;
        bossImg.src = svgUrl(small ? minionSvg(id, 0) : bossSvg(id, 0));
        bossName.textContent = small ? LIEUTENANTS[id].name : BOSSES[id].name;
        bossBar.classList.add('on');
        bossBar.classList.toggle('small', small);
        cache.bossPct = -1;
      }
      const pct = Math.max(0, Math.min(1, boss.hp / boss.maxHp));
      if (Math.abs(pct - cache.bossPct) > 0.002) {
        cache.bossPct = pct;
        bossFill.style.transform = `scaleX(${pct})`;
        bossPct.textContent = `${Math.ceil(pct * 100)} %`;
      }
      const r = st.bossRageIn;
      const rage = r === undefined ? '' : r <= 0 ? 'RAGE !' : `Rage ${Math.ceil(r)} s`;
      if (rage !== cache.rage) { cache.rage = rage; bossRage.textContent = rage; bossRage.classList.toggle('mr-rage', r !== undefined && r <= 0); }
    } else if (cache.bossKey) {
      cache.bossKey = '';
      bossBar.classList.remove('on');
    }

    // Bandeau d'annonce (« 1 vague avant le boss X », lieutenant).
    let text = '', img = '';
    const up = st.upcomingBoss;
    if (!over && up) {
      if (boss && !boss.bossId) {
        text = `Le maître arrive dans ${up.inWaves} vague${up.inWaves > 1 ? 's' : ''} : ${BOSSES[up.boss].name}`;
        img = `b:${up.boss}`;
      } else if (st.phase === 'vague' && up.inWaves === 1) {
        text = `1 vague avant le boss ${BOSSES[up.boss].name}`;
        img = `b:${up.boss}`;
      } else if (st.phase === 'vague' && bossWaveKind(engine.config, st.wave + 1) === 'petit') {
        text = '1 vague avant le lieutenant';
        img = `m:${up.boss}`;
      }
    }
    if (text !== cache.banner) {
      cache.banner = text;
      banner.classList.toggle('on', !!text);
      bannerTxt.textContent = text;
      if (img) {
        const [k, b] = img.split(':') as ['b' | 'm', BossId];
        bannerImg.src = svgUrl(k === 'b' ? bossSvg(b, 0) : minionSvg(b, 0));
      }
    }
  }

  function announceBoss(boss: BossId, small: boolean): void {
    const img = announce.querySelector('img')!;
    img.src = svgUrl(small ? minionSvg(boss, 2) : bossSvg(boss, 1));
    (announce.querySelector('.tag') as HTMLElement).textContent = small ? 'LIEUTENANT !' : 'BOSS !';
    (announce.querySelector('.name') as HTMLElement).textContent = small ? LIEUTENANTS[boss].name : BOSSES[boss].name;
    const up = engine.state.upcomingBoss;
    (announce.querySelector('.sub') as HTMLElement).textContent = small
      ? `${LIEUTENANTS[boss].power.name} : ${LIEUTENANTS[boss].power.description}${up ? ` Le maître arrive dans ${up.inWaves} vagues.` : ''}`
      : `${BOSSES[boss].power.name} : ${BOSSES[boss].power.description}`;
    announce.classList.remove('on');
    void announce.offsetWidth;
    announce.classList.add('on');
    navigator.vibrate?.(80);
  }

  function popWave(n: number): void {
    wavePop.textContent = `Vague ${n}`;
    wavePop.classList.remove('on');
    void wavePop.offsetWidth;
    wavePop.classList.add('on');
  }

  function onEvents(evs: EngineEvent[]): void {
    for (const ev of evs) {
      switch (ev.type) {
        case 'rejected': {
          if (ev.command === 'pause') break;
          showToast(ev.reason);
          if (ev.command === 'summon') shakeEl(summon);
          break;
        }
        case 'powerup': {
          const c = cardEls.find((x) => x.id === ev.unit);
          if (c) { c.el.classList.remove('flash'); void c.el.offsetWidth; c.el.classList.add('flash'); }
          if (ev.player === me) {
            const n = ev.level - 1;
            floatLabel(`${UNITS[ev.unit].name} niv. ${ev.level} : +${Math.round(POWERUP_DAMAGE * 100 * n)} % de dégâts, +${Math.round(POWERUP_ATTACK_SPEED * 100 * n)} % de cadence`);
          }
          break;
        }
        case 'manaUpgrade':
          if (ev.player === me) {
            manaUp.classList.remove('flash'); void manaUp.offsetWidth; manaUp.classList.add('flash');
            floatLabel(`Mana + niv. ${ev.level} : +${Math.round(MANA_UPGRADE_BONUS * 100 * ev.level)} % de mana`);
          }
          break;
        case 'waveStart':
          if (bossWaveKind(engine.config, ev.wave) === null) {
            if ((engine.state.countdown ?? 0) > 0) pendingWavePop = ev.wave; // après le « GO ! »
            else popWave(ev.wave);
            // Sauvegarde de partie : début de vague ordinaire (aucun boss en jeu).
            if (o.onWaveSave && ev.wave > 1) o.onWaveSave(ev.wave, engine.serialize());
          }
          break;
        case 'bossSpawn':
          announceBoss(ev.boss, false);
          break;
        case 'miniBossSpawn':
          announceBoss(ev.boss, true);
          break;
        case 'bossPower':
          showToast(`${ev.name} !`);
          break;
        case 'mana':
          if (ev.player !== me) break;
          if (ev.reason === 'boss') bossBurst(ev.amount);
          else floatMana(ev.amount);
          break;
        case 'lifeLost':
          navigator.vibrate?.(60);
          break;
        case 'gameOver': {
          // Campagne : le résultat part à `onEnd`, qui peut remplacer la fenêtre de fin.
          const st = engine.state;
          const result: BattleResult = {
            ...tracker.stats(st), won: ev.outcome === 'victoire', wave: ev.wave, livesLeft: st.lives,
            deck: st.players[0]!.deck.slice(), seed: engine.config.seed,
          };
          const handled = o.onEnd?.(result) === true;
          if (!handled) window.setTimeout(() => showEnd(ev.outcome, ev.wave), 900);
          over = true;
          signalGame(false);
          hideInfo();
          break;
        }
        default:
          break;
      }
    }
  }

  // ---------------------------------------------------------------- fin, pause
  function showEnd(outcome: 'victoire' | 'defaite', w: number): void {
    if (destroyed) return;
    const win = outcome === 'victoire';
    endModal.innerHTML = `<div class="mr-panel"><h2 class="mr-outline-s ${win ? 'win' : 'lose'}">${win ? 'Victoire !' : 'Défaite'}</h2>
      <p>Vague atteinte<span class="big mr-outline-s">${w}</span></p>
      <div class="row"><button class="mr-btn yellow" data-a="replay">Rejouer</button><button class="mr-btn" data-a="home">Accueil</button></div></div>`;
    endModal.classList.add('on');
  }
  endModal.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest('button')?.dataset['a'];
    if (a === 'replay') o.onReplay();
    if (a === 'home') o.onHome();
  });

  function setPaused(p: boolean): void {
    if (over) return;
    userPaused = p;
    apply({ type: 'pause', paused: p });
    pauseModal.classList.toggle('on', p);
  }
  pauseBtn.addEventListener('click', () => setPaused(true));
  pauseModal.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest('button')?.dataset['a'];
    if (a === 'resume') setPaused(false);
    if (a === 'home') o.onHome();
  });
  const onVis = () => { if (document.hidden && !over) setPaused(true); };
  document.addEventListener('visibilitychange', onVis);

  // ---------------------------------------------------------------- commandes
  summon.addEventListener('click', () => {
    if (over) return;
    hideInfo();
    apply({ type: 'summon', player: me });
  });
  manaUp.addEventListener('click', () => {
    if (over) return;
    hideInfo();
    const p = engine.state.players[0]!;
    const ml = p.manaLevel ?? 0;
    if (ml >= MANA_UPGRADE_MAX) { showToast('Rendement du mana au maximum.'); shakeEl(manaUp); return; }
    if (p.mana < MANA_UPGRADE_COSTS[ml]!) { showToast('Pas assez de mana.'); shakeEl(manaUp); return; }
    apply({ type: 'manaUpgrade', player: me });
  });
  cardEls.forEach((c) => c.el.addEventListener('click', () => {
    if (over) return;
    hideInfo();
    const p = engine.state.players[0]!;
    const lv = p.powerUps[c.id] ?? 1;
    if (lv >= POWERUP_MAX) { showToast('Amélioration maximale atteinte.'); shakeEl(c.el); return; }
    if (p.mana < POWERUP_COSTS[lv - 1]!) { showToast('Pas assez de mana.'); shakeEl(c.el); return; }
    apply({ type: 'powerup', player: me, unit: c.id });
  }));

  // Bulle d'info
  function showInfo(slot: number): void {
    const u = engine.state.players[0]!.grid[slot];
    if (!u || !scene) return;
    const id = u.status.transformedInto ?? u.unit;
    const d = UNITS[id];
    const lv = engine.state.players[0]!.powerUps[u.unit] ?? 1;
    const copyMul = u.status.copyMul ?? 1;
    const growth = growthBonus(d.ability.params, growthPointsOf(d.ability.params, u, engine.state.players[0]!.mana));
    const formation = d.ability.params.formationDamagePerAlly && u.unit === id
      ? d.ability.params.formationDamagePerAlly * (Math.min(formationLength(engine.state.players[0]!.grid, slot), d.ability.params.formationMax ?? 3) - 1) : 0;
    const formationTag = formation > 0 ? `<span class="grow">Formation +${Math.round(formation * 100)} %</span>` : '';
    const nextUp = lv < POWERUP_MAX
      ? `<p class="next">Prochaine amélioration (Nv.${lv + 1}, ${POWERUP_COSTS[lv - 1]} mana) : +${Math.round(POWERUP_DAMAGE * 100)} % de dégâts et +${Math.round(POWERUP_ATTACK_SPEED * 100)} % de cadence pour tous les ${d.name}.</p>`
      : '<p class="next">Amélioration maximale.</p>';
    const copyNote = u.status.copyOf
      ? `<p class="arch">Copie par ${UNITS[u.status.copyOf].name} : ${copyMul < 1 ? `−${Math.round((1 - copyMul) * 100)} % de dégâts` : 'dégâts complets'}.</p>` : '';
    const growthTag = growth > 0.0049 ? `<span class="grow">Croissance +${Math.round(growth * 100)} %</span>` : '';
    info.innerHTML = `<h3>${d.name}<small>Rang ${u.rank}/${MAX_RANK}</small></h3>
      <p><span class="abl">${d.ability.name}</span> : ${d.ability.description}</p>${copyNote}
      <div class="meta"><span class="rng">Portée : ${rangeLabel(id)}</span><span>${TARGETING[d.targeting] ?? ''}</span><span>Dégâts ${Math.round(d.damage * (1 + RANK_DAMAGE * (u.rank - 1)) * (1 + POWERUP_DAMAGE * (lv - 1)) * copyMul * (1 + growth) * (1 + formation))}</span>${growthTag}${formationTag}<span>Cadence ${(d.attackInterval / ((1 + RANK_ATTACK_SPEED * (u.rank - 1)) * (1 + POWERUP_ATTACK_SPEED * (lv - 1)))).toFixed(2).replace(/0$/, '').replace('.', ',')} s</span><span>Amélioration Nv.${lv}</span></div>${nextUp}`;
    const c = scene.cellCenter(slot);
    const x = Math.max(20, Math.min(1000 - 20 - 560, c.x - 280));
    info.style.left = `${x}px`;
    info.classList.add('on');
    // Au-dessus de la case si la place le permet, sinon en dessous.
    const h = info.offsetHeight || 260;
    info.style.top = `${c.y - 90 - h > 120 ? c.y - 90 - h : c.y + 90}px`;
    infoSlot = slot;
    infoUnit = u.unit;
  }
  function hideInfo(): void {
    info.classList.remove('on');
    infoSlot = -1;
    infoUnit = null;
  }

  // Zone de touche : appui long (≥ 300 ms sans bouger) sur une unité, tant que le doigt reste posé.
  const HOLD_MS = 300;
  let holdTimer = 0;
  function showRangeTag(slot: number): void {
    const u = engine.state.players[0]!.grid[slot];
    if (!u) return;
    rangeTag.textContent = `Portée : ${rangeLabel(u.status.transformedInto ?? u.unit)}`;
    // Sous l'aire de jeu, au-dessus des améliorations.
    rangeTag.style.top = `${scene ? scene.layout.controls.upgrades[0]!.y - 70 : 1120}px`;
    rangeTag.classList.add('on');
  }
  function endHold(): void {
    clearTimeout(holdTimer);
    holdTimer = 0;
    rangeTag.classList.remove('on');
    scene?.hideHold();
  }

  // Glisser-fusionner (toucher et souris)
  const pt = { x: 0, y: 0 };
  let press: { id: number; slot: number; x: number; y: number; dragging: boolean; held: boolean; unit: UnitId } | null = null;
  function onDown(e: PointerEvent): void {
    if (!scene || over || userPaused || press) return;
    scene.toLogical(e.clientX, e.clientY, pt);
    const slot = scene.slotAt(pt.x, pt.y);
    const u = slot >= 0 ? engine.state.players[0]!.grid[slot] : null;
    if (!u) { hideInfo(); return; }
    press = { id: e.pointerId, slot, x: pt.x, y: pt.y, dragging: false, held: false, unit: u.unit };
    try { host.setPointerCapture(e.pointerId); } catch { /* ignoré */ }
    e.preventDefault();
    const p = press;
    clearTimeout(holdTimer);
    holdTimer = window.setTimeout(() => {
      holdTimer = 0;
      if (!scene || press !== p || p.dragging || over) return;
      if (engine.state.players[0]!.grid[p.slot]?.unit !== p.unit) return;
      hideInfo();
      p.held = scene.showHold(p.slot);
      if (p.held) { showRangeTag(p.slot); navigator.vibrate?.(15); }
    }, HOLD_MS);
  }
  function onMove(e: PointerEvent): void {
    if (!scene || !press || e.pointerId !== press.id) return;
    scene.toLogical(e.clientX, e.clientY, pt);
    if (!press.dragging && Math.hypot(pt.x - press.x, pt.y - press.y) > 22) {
      // Le doigt bouge : glisser-fusionner (même après un appui long).
      endHold();
      press.held = false;
      if (!engine.state.players[0]!.grid[press.slot]) { press = null; return; }
      press.dragging = scene.startDrag(press.slot);
      hideInfo();
    }
    if (press.dragging) scene.moveDrag(pt.x, pt.y);
  }
  function onUp(e: PointerEvent): void {
    if (!scene || !press || e.pointerId !== press.id) return;
    const p = press;
    press = null;
    scene.toLogical(e.clientX, e.clientY, pt);
    if (p.held) { endHold(); return; }
    clearTimeout(holdTimer);
    holdTimer = 0;
    if (!p.dragging) {
      if (infoSlot === p.slot) hideInfo(); else showInfo(p.slot);
      return;
    }
    const to = scene.slotAt(pt.x, pt.y);
    const grid = engine.state.players[0]!.grid;
    const a = grid[p.slot], b = to >= 0 && to !== p.slot ? grid[to] : null;
    // Fusion, ou archétypes Copieur (Loki) et Booster de fusion (Coco) : même règle que le moteur.
    const action = dropAction(a, b);
    if (action) {
      apply({ type: action, player: me, from: p.slot, to });
      scene.endDrag(to, true);
    } else {
      scene.endDrag(-1, false);
      if (a && b) showToast(dropHint(a.unit, a.rank, b.unit, b.rank));
    }
  }
  function dropHint(a: UnitId, ra: number, b: UnitId, rb: number): string {
    const prm = UNITS[a].ability.params;
    if (a !== b && (prm.copyDamageMul || prm.promoteAlly)) {
      if (ra !== rb) return 'Glisse-la sur une alliée de même rang.';
      if (prm.promoteAlly && rb >= MAX_RANK) return 'Rang maximal atteint.';
    }
    return ra >= MAX_RANK && a === b ? 'Rang maximal atteint.' : 'Fusionne deux unités identiques de même rang.';
  }
  function onCancel(e: PointerEvent): void {
    if (!scene || !press || e.pointerId !== press.id) return;
    if (press.dragging) scene.endDrag(-1, false);
    endHold();
    press = null;
  }
  host.addEventListener('pointerdown', onDown);
  host.addEventListener('pointermove', onMove);
  host.addEventListener('pointerup', onUp);
  host.addEventListener('pointercancel', onCancel);
  const noMenu = (e: Event) => e.preventDefault();
  wrap.addEventListener('contextmenu', noMenu);

  // ---------------------------------------------------------------- boucle à pas fixe
  function frame(now: number): void {
    if (destroyed || !scene) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
    last = now;
    // En Solo, la partie ralentit à 25 % pendant la lecture d'une bulle d'info.
    const rate = speed * userSpeed * (infoSlot >= 0 ? 0.25 : 1) * tutoRate;
    acc += tutoHeld ? 0 : dt * rate;
    let steps = 0;
    const maxSteps = Math.max(4, Math.ceil(speed * userSpeed * 3));
    while (acc >= DT && steps < maxSteps) {
      acc -= DT;
      steps++;
      scene.beforeTick();
      tracker.before(engine.state);
      engine.tick();
      const evs = engine.drainEvents();
      tracker.after(engine.state, evs);
      scene.afterTick(evs);
      scene.settleDrops();
      onEvents(evs);
      if (tutoListeners.size && evs.length) for (const fn of tutoListeners) { try { fn(evs); } catch (err) { console.error(err); } }
    }
    if (steps >= maxSteps) acc = Math.min(acc, DT);
    if (infoSlot >= 0) {
      const u = engine.state.players[0]!.grid[infoSlot];
      if (!u || u.unit !== infoUnit) hideInfo();
    }
    if (press?.held && (over || engine.state.players[0]!.grid[press.slot]?.unit !== press.unit)) { endHold(); press.held = false; }
    updateHud();
    scene.render(dt, acc / DT, engine.state.phase === 'pause' || over);
  }

  // ---------------------------------------------------------------- démarrage
  void (async () => {
    try {
      const s = await BattleScene.create(host, { engine, map, player: me, safe: readSafeArea });
      if (destroyed) { s.destroy(); return; }
      scene = s;
      s.onFit = onFit;
      onFit(s.fit);
      s.resize();
      engine.drainEvents();
      updateHud();
      popWave(1);
      signalGame(true);
      loading.classList.add('done');
      last = performance.now();
      raf = requestAnimationFrame(frame);
      // Accès de débogage (tests de bout en bout).
      (window as unknown as { __marvelRush?: unknown }).__marvelRush = { engine, scene: s };
      // Tutoriel : accès optionnel au combat.
      const api: BattleTutoApi = {
        engine, root: wrap, title: o.title,
        cellRect(slot) {
          const r = s.layout.board.cells[slot];
          if (!r || destroyed) return null;
          const hr = host.getBoundingClientRect();
          const f = s.fit;
          return { x: hr.left + f.x + r.x * f.scale, y: hr.top + f.y + r.y * f.scale, w: r.w * f.scale, h: r.h * f.scale };
        },
        onEvents(fn) { tutoListeners.add(fn); return () => { tutoListeners.delete(fn); }; },
        setRate(r) { tutoRate = Math.max(0.05, r); },
        hold(on) { tutoHeld = on; },
        showMerges(slot) { if (!press) s.showHold(slot); },
        hideMerges() { if (!press) s.hideHold(); },
        isOver: () => over,
        isDestroyed: () => destroyed,
        toast: showToast,
      };
      o.onReady?.(api);
      notifyBattleReady(api);
    } catch (err) {
      loading.innerHTML = `<span>Impossible de lancer le combat.</span>`;
      console.error(err);
    }
  })();

  return {
    destroy() {
      destroyed = true;
      signalGame(false);
      cancelAnimationFrame(raf);
      tutoListeners.clear();
      clearTimeout(toastTimer);
      clearTimeout(holdTimer);
      document.removeEventListener('visibilitychange', onVis);
      scene?.destroy();
      wrap.remove();
      for (const u of urls.splice(0)) URL.revokeObjectURL(u);
      delete (window as unknown as { __marvelRush?: unknown }).__marvelRush;
    },
  };
}
