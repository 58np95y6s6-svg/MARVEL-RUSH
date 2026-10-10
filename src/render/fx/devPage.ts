// Page de revue des effets (#dev/fx) : plateau de test où l'attaque et la compétence de chaque unité
// tournent en boucle sur des ennemis factices, avec un sélecteur, un mode « charge » (15 unités qui
// tirent en même temps sur 30 ennemis), un mode statuts et les pouvoirs de boss.
// Indépendante du moteur : on rejoue directement les chaînes `fx` et les noms de compétence.
import { Application, Container, Graphics, Sprite } from 'pixi.js';
import { loadTexture } from '../../art';
import { BOSS_IDS } from '../../art';
import { SNAP_NAME, THANOS_STONES } from '../../data/bosses';
import type { BossId, EnemyKind, UnitId } from '../../data/types';
import { UNIT_LIST } from '../../data/units';
import type { EnemyInstance } from '../../engine';
import { getMap } from '../../maps';
import { SCREEN, layoutFor, type SoloLayout } from '../../maps/layout';
import { Numbers, formatDamage, installDamageFont } from '../fx';
import { LaneSampler } from '../path';
import { SIZES, bossTex, enemyTex, enemyWidth, loadToken, preloadBattle, preloadBoss, setRasterScale, tokenTex } from '../textures';
import { CombatFx, type FxEnemy } from './director';

type Tgt = 'first' | 'line' | 'chain' | 'all' | 'rand';
interface Demo {
  atk: [string, Tgt][];
  ab: { name: string; fx?: string; tgt: Tgt; status?: Partial<EnemyInstance['effects']> };
  /** Effet d'état posé par l'attaque normale (pour voir les icônes). */
  status?: Partial<EnemyInstance['effects']>;
  crit?: boolean;
}

const DEMO: Record<UnitId, Demo> = {
  ironman: { atk: [['ironman:repulseur', 'first']], ab: { name: 'Uni-Beam', fx: 'ironman:unibeam', tgt: 'line' } },
  spiderman: { atk: [['spiderman:toile', 'first']], ab: { name: 'Toile collante', fx: 'spiderman:toile', tgt: 'first', status: { stunFor: 1 } }, status: { slow: 0.1, slowFor: 2 } },
  hulk: { atk: [['hulk:coup', 'chain']], ab: { name: 'Hulk Smash', fx: 'hulk:smash', tgt: 'chain', status: { stunFor: 1 } } },
  thor: { atk: [['thor:marteau', 'chain'], ['thor:foudre', 'chain']], ab: { name: 'Marteau de foi', fx: 'thor:marteau-foi', tgt: 'chain', status: { stunFor: 1 } } },
  strange: { atk: [['strange:magie', 'first']], ab: { name: 'Portail', tgt: 'first' } },
  venom: { atk: [['venom:griffes', 'first']], ab: { name: 'Dévorer', fx: 'venom:devorer', tgt: 'first' } },
  cmarvel: { atk: [['cmarvel:rafale', 'first'], ['cmarvel:rafale', 'first'], ['cmarvel:binaire', 'first']], ab: { name: 'Mode binaire', tgt: 'first' } },
  cap: { atk: [['cap:bouclier', 'chain']], ab: { name: 'Bouclier', fx: 'cap:bouclier', tgt: 'chain' } },
  loki: { atk: [['loki:dague', 'first']], ab: { name: 'Illusion', fx: 'loki:dague', tgt: 'first' } },
  bucky: { atk: [['bucky:tir', 'first'], ['bucky:tir', 'first'], ['bucky:tir', 'first'], ['bucky:critique', 'first']], ab: { name: 'Bras bionique', fx: 'bucky:critique', tgt: 'first', status: { stunFor: 0.5 } }, crit: true },
  hawkeye: { atk: [['hawkeye:explosive', 'chain'], ['hawkeye:glace', 'first'], ['hawkeye:electrique', 'chain']], ab: { name: 'Flèches', fx: 'hawkeye:explosive', tgt: 'chain' }, status: { slow: 0.25, slowFor: 2 } },
  falcon: { atk: [['falcon:tir-aerien', 'first']], ab: { name: 'Drone Redwing', tgt: 'first', status: { marked: 0.25, markedFor: 4 } } },
  widow: { atk: [['widow:tir', 'first']], ab: { name: 'Morsure de la veuve', fx: 'widow:morsure', tgt: 'first', status: { stunFor: 1 } } },
  shangchi: { atk: [['shangchi:combo', 'first']], ab: { name: 'Dix Anneaux', fx: 'shangchi:anneaux', tgt: 'rand' } },
  moana: { atk: [['moana:rame', 'first']], ab: { name: 'Appel de l’océan', tgt: 'line' } },
  maui: { atk: [['maui:faucon', 'first'], ['maui:faucon', 'first'], ['maui:requin', 'chain']], ab: { name: 'Métamorphose : requin', tgt: 'first' } },
  pocahontas: { atk: [['pocahontas:feuilles', 'first']], ab: { name: 'Esprit de la forêt', fx: 'pocahontas:feuilles', tgt: 'first' } },
  mulan: { atk: [['mulan:souffle', 'first']], ab: { name: 'Avalanche', fx: 'mulan:avalanche', tgt: 'all' }, status: { burn: 1, burnFor: 3 } },
  merida: { atk: [['merida:tir-parfait', 'first']], ab: { name: 'Tir parfait', fx: 'merida:tir-parfait', tgt: 'first' }, crit: true },
  ariel: { atk: [['ariel:bulles', 'first']], ab: { name: 'Chant de sirène', tgt: 'line', status: { stunFor: 1.5 } } },
  foxhound: { atk: [['foxhound:double', 'chain']], ab: { name: 'Double', fx: 'foxhound:double', tgt: 'first' } },
  tiana: { atk: [['tiana:luciole', 'first']], ab: { name: 'Langue de Naveen', tgt: 'first' } },
  nemo: { atk: [['nemo:ralenti', 'first'], ['nemo:double', 'first'], ['nemo:poison', 'first'], ['nemo:cadence', 'first']], ab: { name: 'Hasard', fx: 'nemo:double+poison', tgt: 'first' } },
  coco: { atk: [['coco:notes', 'first']], ab: { name: 'Remember Me', tgt: 'first' } },
  nickjudy: { atk: [['nickjudy:carotte', 'first']], ab: { name: 'Arrestation', tgt: 'first', status: { stunFor: 2 } }, status: { armorBreak: 0.2 } },
  buzzwoody: { atk: [['buzzwoody:laser', 'line']], ab: { name: 'Lasso de Woody', tgt: 'first' } },
  rapunzel: { atk: [['rapunzel:poele', 'first']], ab: { name: 'Fleur magique', fx: 'rapunzel:poele', tgt: 'first' } },
  vanralph: { atk: [['vanralph:poing', 'first'], ['vanralph:brise-bouclier', 'first']], ab: { name: 'Glitch', tgt: 'first' } },
  // Extension Pixar (coup normal puis coup de duo ; compétence)
  mrincredible: { atk: [['mrincredible:poing', 'first']], ab: { name: 'Coup de poing sismique', tgt: 'line', status: { stunFor: 1.2 } } },
  elastigirl: { atk: [['elastigirl:bras', 'first']], ab: { name: 'Bras élastiques', tgt: 'first' }, status: { slow: 0.15, slowFor: 1 } },
  frozone: { atk: [['frozone:glace', 'first']], ab: { name: 'Pont de glace', tgt: 'chain', status: { slow: 0.45, slowFor: 3 } } },
  violetflash: { atk: [['violetflash:coup', 'first'], ['violetflash:duo', 'first']], ab: { name: 'Champ de force', tgt: 'first' } },
  sullimike: { atk: [['sullimike:griffe', 'first']], ab: { name: 'Rugissement', tgt: 'chain' } },
  mcqueen: { atk: [['mcqueen:turbo', 'first'], ['mcqueen:duo', 'first']], ab: { name: 'Turbo', tgt: 'first' } },
  carlrussell: { atk: [['carlrussell:canne', 'first']], ab: { name: 'Ballons', tgt: 'first', status: { stunFor: 2 } } },
  joysadness: { atk: [['joysadness:souvenir', 'first'], ['joysadness:duo', 'first']], ab: { name: 'Souvenir bleu', tgt: 'first' }, status: { burn: 1, burnFor: 3 } },
  remy: { atk: [['remy:louche', 'first'], ['remy:duo', 'chain']], ab: { name: 'Recette', tgt: 'first' } },
  walleeve: { atk: [['walleeve:cube', 'first'], ['walleeve:duo', 'chain']], ab: { name: 'Directive', tgt: 'first' } },
  lucaalberto: { atk: [['lucaalberto:vague', 'first'], ['lucaalberto:duo', 'first']], ab: { name: 'Silenzio, Bruno !', tgt: 'first' } },
  mei: { atk: [['mei:panda', 'chain']], ab: { name: 'Panda géant', tgt: 'first' } },
  jessie: { atk: [['jessie:lasso', 'first'], ['jessie:duo', 'first']], ab: { name: 'Lasso', tgt: 'first' }, status: { marked: 0.1, markedFor: 4 } },
  ianbarley: { atk: [['ianbarley:baton', 'first']], ab: { name: 'Boule de feu', tgt: 'chain' } },
  joe: { atk: [['joe:notes', 'first'], ['joe:duo', 'first']], ab: { name: 'Musique de l’âme', tgt: 'first' }, crit: true },
};

const UNIT_IDS = UNIT_LIST.map((u) => u.id);

interface DevEnemy extends FxEnemy { sprite: Sprite; d: number; speed: number; kind: 'enemy' | 'boss' }

export function mountFxPreview(root: HTMLElement): () => void {
  let stopped = false;
  const app = new Application();
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;inset:0;background:#2c2440;overflow:hidden;touch-action:none';
  root.appendChild(host);
  const ui = document.createElement('div');
  ui.style.cssText = 'position:fixed;left:0;right:0;bottom:0;padding:8px 10px calc(8px + env(safe-area-inset-bottom));background:rgba(29,23,51,.88);color:#fff;font:600 13px Nunito,system-ui,sans-serif;display:flex;flex-wrap:wrap;gap:6px;align-items:center;z-index:5';
  root.appendChild(ui);
  const stats = document.createElement('div');
  stats.style.cssText = 'position:fixed;left:8px;top:8px;padding:4px 8px;border-radius:8px;background:rgba(29,23,51,.75);color:#fff;font:600 12px ui-monospace,monospace;z-index:5;white-space:pre';
  root.appendChild(stats);

  const sel = document.createElement('select');
  sel.style.cssText = 'font:inherit;padding:6px;border-radius:8px;max-width:160px';
  sel.innerHTML = UNIT_IDS.map((id) => `<option value="${id}">${UNIT_LIST.find((u) => u.id === id)!.name}</option>`).join('');
  const btn = (label: string, fn: () => void) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.style.cssText = 'font:inherit;padding:6px 10px;border-radius:8px;border:0;background:#f6c64a;color:#1d1733';
    b.onclick = fn;
    ui.appendChild(b);
    return b;
  };
  ui.appendChild(sel);

  const map = getMap('toits-new-york');
  const layout = layoutFor('solo', map.shape) as SoloLayout;
  const lane = new LaneSampler(layout.lane);
  const world = new Container();
  const scenery = new Container(), groundL = new Container(), enemyL = new Container(), unitL = new Container(), shotL = new Container(), topL = new Container(), numL = new Container();
  enemyL.sortableChildren = true;
  world.addChild(scenery, groundL, enemyL, unitL, shotL, topL, numL);

  const enemies = new Map<number, DevEnemy>();
  const tokens: (Sprite | null)[] = Array.from({ length: 15 }, () => null);
  const tokenUnit: (UnitId | null)[] = Array.from({ length: 15 }, () => null);
  const attackT = new Array<number>(15).fill(-1);
  let uidSeq = 1;
  let fx!: CombatFx;
  let nums!: Numbers;
  let shakeAmp = 0, shakeT = 0, fitX = 0, fitY = 0, scale = 1;
  const flash = new Sprite();

  const cell = (slot: number) => { const r = layout.board.cells[slot]!; return { x: r.x + r.w / 2, y: r.y + r.h / 2 }; };

  // --- état de la démo
  let unit: UnitId = 'ironman';
  let mode: 'unit' | 'load' | 'boss' = 'unit';
  let auto = true;
  let atkIdx = 0, atkT = 0, abT = 1.6, bossT = 0, bossIdx = 0;
  const pendingNums: { t: number; uid: number; dmg: number; crit: boolean }[] = [];

  function addEnemy(kind: EnemyKind | 'boss', d: number, boss?: BossId): DevEnemy {
    const uid = uidSeq++;
    const sprite = new Sprite();
    sprite.anchor.set(0.5, 0.95);
    enemyL.addChild(sprite);
    const isBoss = kind === 'boss';
    const width = isBoss ? SIZES.boss : enemyWidth(kind as EnemyKind);
    const enemy: EnemyInstance = {
      uid, kind: isBoss ? 'normal' : (kind as EnemyKind), lane: 'a', distance: d, speed: 0.5, hp: 100, maxHp: 100, armor: 0, shieldHits: 0, effects: {},
      ...(isBoss && boss ? { bossId: boss } : {}),
    };
    const e: DevEnemy = { x: 0, y: 0, width, enemy, sprite, d, speed: isBoss ? 0 : 0.45 + Math.random() * 0.2, kind: isBoss ? 'boss' : 'enemy' };
    enemies.set(uid, e);
    return e;
  }
  function clearEnemies(): void {
    for (const e of enemies.values()) e.sprite.destroy();
    enemies.clear();
  }
  function resetEnemies(n: number): void {
    clearEnemies();
    const kinds: EnemyKind[] = ['normal', 'rapide', 'gros', 'blinde', 'bouclier'];
    for (let i = 0; i < n; i++) addEnemy(kinds[i % kinds.length]!, 1 + (i * (lane.cells - 2)) / n);
  }

  function placeUnits(): void {
    for (let i = 0; i < 15; i++) { tokens[i]?.destroy(); tokens[i] = null; tokenUnit[i] = null; }
    const put = (slot: number, id: UnitId) => {
      const s = new Sprite();
      s.anchor.set(0.5);
      const c = cell(slot);
      s.position.set(c.x, c.y);
      unitL.addChild(s);
      tokens[slot] = s; tokenUnit[slot] = id;
    };
    if (mode === 'load') for (let i = 0; i < 15; i++) put(i, UNIT_IDS[(i * 13) % UNIT_IDS.length]!);
    else put(7, unit);
  }

  function pickTargets(t: Tgt, from: { x: number; y: number }): number[] {
    const list = [...enemies.values()].filter((e) => e.kind === 'enemy' || mode === 'boss');
    if (!list.length) return [];
    const lead = list.reduce((a, b) => (b.d > a.d ? b : a));
    const near = (n: number) => list.slice().sort((a, b) => Math.hypot(a.x - lead.x, a.y - lead.y) - Math.hypot(b.x - lead.x, b.y - lead.y)).slice(0, n);
    void from;
    switch (t) {
      case 'first': return [lead.enemy.uid];
      case 'line': return near(4).map((e) => e.enemy.uid);
      case 'chain': return near(3).map((e) => e.enemy.uid);
      case 'all': return list.map((e) => e.enemy.uid);
      case 'rand': return [lead.enemy.uid, ...list.slice().sort(() => Math.random() - 0.5).slice(0, 10).map((e) => e.enemy.uid)];
    }
  }

  function applyStatus(targets: number[], st?: Partial<EnemyInstance['effects']>): void {
    if (!st) return;
    for (const t of targets) { const e = enemies.get(t); if (e) Object.assign(e.enemy.effects, st); }
  }

  function queueNums(targets: number[], crit: boolean): void {
    for (const t of targets) pendingNums.push({ t: 0.25, uid: t, dmg: crit ? 2400 + Math.random() * 900 : 300 + Math.random() * 600, crit });
  }

  function fireAttack(slot: number, id: UnitId, k: number): void {
    const d = DEMO[id];
    const [key, tgt] = d.atk[k % d.atk.length]!;
    const targets = pickTargets(tgt, cell(slot));
    if (!targets.length) return;
    attackT[slot] = 0;
    fx.attack(slot, id, key, targets);
    applyStatus(targets, d.status);
    queueNums(targets.slice(0, 3), !!d.crit && (key.includes('critique') || id === 'merida'));
  }

  function fireAbility(slot: number, id: UnitId): void {
    const d = DEMO[id].ab;
    let targets = pickTargets(d.tgt, cell(slot));
    attackT[slot] = 0;
    if (d.fx) fx.attack(slot, id, d.fx, targets);
    if (id === 'loki') targets = Math.random() < 0.5 ? [] : targets;
    if (id === 'vanralph') {
      // Glitch : la nouvelle case est `slot`, l'ancienne est dans les cibles.
      const to = slot === 7 ? 2 : 7;
      fx.ability(to, id, d.name, [slot]);
      return;
    }
    if (id === 'tiana' && Math.random() < 0.35) { fx.ability(slot, id, 'Restaurant', []); return; }
    if (id === 'maui') { fx.ability(slot, id, Math.random() < 0.5 ? 'Métamorphose : requin' : 'Métamorphose : faucon', []); return; }
    fx.ability(slot, id, d.name, id === 'cmarvel' || id === 'coco' ? [] : targets);
    applyStatus(targets, d.status);
    if (d.fx) queueNums(targets.slice(0, 4), id === 'bucky' || id === 'merida');
  }

  function fireBoss(): void {
    const boss = BOSS_IDS[bossIdx % BOSS_IDS.length] as BossId;
    bossIdx++;
    let name = 'Pouvoir';
    if (boss === 'thanos') { const k = bossIdx % 7; name = k === 6 ? SNAP_NAME : THANOS_STONES[k]!.name; }
    if (![...enemies.values()].some((e) => e.enemy.bossId === boss)) {
      for (const e of [...enemies.values()]) if (e.kind === 'boss') { e.sprite.destroy(); enemies.delete(e.enemy.uid); }
      preloadBoss(boss);
      addEnemy('boss', lane.cells * 0.55, boss);
    }
    const slots = [Math.floor(Math.random() * 15), Math.floor(Math.random() * 15)];
    fx.bossPower(boss, slots, name);
    bossLabel = `${boss} · ${name}`;
  }
  let bossLabel = '';

  // --- boutons
  btn('Attaque', () => fireAttack(7, unit, atkIdx++));
  btn('Compétence', () => fireAbility(7, unit));
  const autoB = btn('Auto : oui', () => { auto = !auto; autoB.textContent = `Auto : ${auto ? 'oui' : 'non'}`; });
  btn('Charge ×15', () => setMode(mode === 'load' ? 'unit' : 'load'));
  btn('Boss', () => setMode(mode === 'boss' ? 'unit' : 'boss'));
  btn('Statuts', () => {
    const sts: Partial<EnemyInstance['effects']>[] = [{ stunFor: 3 }, { slow: 0.2, slowFor: 3 }, { burn: 1, burnFor: 3 }, { marked: 0.2, markedFor: 3 }, { armorBreak: 0.2 }];
    [...enemies.values()].forEach((e, i) => Object.assign(e.enemy.effects, sts[i % sts.length]));
  });
  sel.onchange = () => { unit = sel.value as UnitId; atkIdx = 0; atkT = 0; abT = 1.6; if (mode !== 'unit') setMode('unit'); else { fx.clear(); placeUnits(); } };

  function setMode(m: typeof mode): void {
    mode = m;
    fx.clear();
    resetEnemies(m === 'load' ? 30 : 8);
    for (const e of enemies.values()) e.enemy.effects = {};
    placeUnits();
  }

  // --- rendu
  let last = performance.now();
  let frameAvg = 16, renderAvg = 0;
  const loadT = new Array<number>(15).fill(0).map(() => Math.random());
  const loadAb = new Array<number>(15).fill(0).map(() => 2 + Math.random() * 4);

  let frozen = false;
  function frame(now: number): void {
    if (stopped) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    frameAvg += ((now - last) - frameAvg) * 0.05;
    last = now;
    if (!frozen) { step(dt); draw(); }
    requestAnimationFrame(frame);
  }

  function step(dt: number): void {
    // Ennemis.
    for (const e of enemies.values()) {
      if (e.kind === 'enemy') {
        e.d += e.speed * dt;
        if (e.d > lane.cells - 0.3) { e.d = 0.4; e.enemy.effects = {}; }
      }
      lane.at(e.d);
      e.x = lane.x; e.y = lane.y;
      const tex = e.kind === 'boss' ? bossTex(e.enemy.bossId!, 0) : enemyTex(e.enemy.kind as Exclude<EnemyKind, 'sbire'>, e.enemy.uid % 3);
      if (tex && e.sprite.texture !== tex) { e.sprite.texture = tex; e.sprite.width = e.width; e.sprite.height = (e.width * tex.height) / tex.width; }
      e.sprite.position.set(e.x, e.y);
      e.sprite.zIndex = e.y;
      const f = e.enemy.effects;
      for (const k of ['stunFor', 'slowFor', 'burnFor', 'markedFor'] as const) if (f[k]) { f[k] = Math.max(0, f[k]! - dt); if (!f[k]) delete f[k]; }
      e.sprite.tint = (f.stunFor ?? 0) > 0 ? 0xfff2a0 : (f.slowFor ?? 0) > 0 ? 0xa8d8ff : (f.burnFor ?? 0) > 0 ? 0xffb080 : (f.markedFor ?? 0) > 0 ? 0xff9a9a : 0xffffff;
    }
    // Unités.
    for (let i = 0; i < 15; i++) {
      const s = tokens[i], id = tokenUnit[i];
      if (!s || !id) continue;
      let pose: 0 | 1 | 2 = 0;
      if (attackT[i]! >= 0) { attackT[i]! += dt; pose = attackT[i]! < 0.09 ? 1 : attackT[i]! < 0.2 ? 2 : 0; if (attackT[i]! > 0.26) attackT[i] = -1; }
      const tex = tokenTex(id, pose) ?? tokenTex(id, 0);
      if (tex && s.texture !== tex) { s.texture = tex; s.width = SIZES.token; s.height = SIZES.token; }
    }
    // Déclenchements.
    if (auto) {
      if (mode === 'unit') {
        atkT -= dt; abT -= dt;
        if (atkT <= 0) { atkT = 0.95; fireAttack(7, unit, atkIdx++); }
        if (abT <= 0) { abT = 3.2; fireAbility(7, unit); }
      } else if (mode === 'load') {
        for (let i = 0; i < 15; i++) {
          const id = tokenUnit[i];
          if (!id) continue;
          loadT[i]! -= dt; loadAb[i]! -= dt;
          if (loadT[i]! <= 0) { loadT[i] = 0.6 + Math.random() * 0.6; fireAttack(i, id, Math.floor(Math.random() * 4)); }
          if (loadAb[i]! <= 0) { loadAb[i] = 4 + Math.random() * 4; fireAbility(i, id); }
        }
      } else {
        bossT -= dt;
        if (bossT <= 0) { bossT = 2.2; fireBoss(); }
      }
    }
    for (let i = pendingNums.length - 1; i >= 0; i--) {
      const p = pendingNums[i]!;
      p.t -= dt;
      if (p.t > 0) continue;
      pendingNums.splice(i, 1);
      const e = enemies.get(p.uid);
      if (!e) continue;
      if (p.crit) { nums.show(formatDamage(p.dmg) + '!', e.x, e.y - e.width * 0.8, { color: 0xffd23a, size: 62, life: 1, crit: true }); fx.crit(e.x, e.y - e.width * 0.4); }
      else nums.show(formatDamage(p.dmg), e.x, e.y - e.width * 0.8, { color: 0xffe9a0, size: 40 });
    }
    fx.update(dt);
    nums.update(dt);
    if (shakeT > 0) {
      shakeT -= dt;
      const a = Math.min(shakeAmp, Math.max(0, shakeT) * shakeAmp * 2) * scale;
      world.position.set(fitX + (Math.random() - 0.5) * a * 2, fitY + (Math.random() - 0.5) * a * 2);
      if (shakeT <= 0) world.position.set(fitX, fitY);
    }
    if (flash.alpha > 0) flash.alpha = Math.max(0, flash.alpha - dt * 1.2);
  }

  function draw(): void {
    const r0 = performance.now();
    app.render();
    renderAvg += (performance.now() - r0 - renderAvg) * 0.05;
    stats.textContent = `${(1000 / frameAvg).toFixed(0)} i/s  image ${frameAvg.toFixed(1)} ms\neffets ${fx.perf.avg.toFixed(2)} ms (pic ${fx.perf.peak.toFixed(2)})  rendu ${renderAvg.toFixed(2)} ms\nobjets ${fx.count}  qualité ${fx.q.toFixed(2)}${mode === 'boss' ? `\n${bossLabel}` : ''}`;
  }

  const fit = () => {
    const W = host.clientWidth, H = host.clientHeight;
    app.renderer.resize(W, H);
    scale = Math.min(W / SCREEN.w, (H - 70) / SCREEN.h);
    fitX = (W - SCREEN.w * scale) / 2; fitY = Math.max(0, (H - 70 - SCREEN.h * scale) / 2);
    world.scale.set(scale);
    world.position.set(fitX, fitY);
    flash.width = W; flash.height = H;
  };

  void (async () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    await app.init({ width: host.clientWidth || 390, height: host.clientHeight || 844, backgroundColor: '#2c2440', antialias: false, resolution: dpr, autoDensity: true, preference: 'webgl' });
    if (stopped) { app.destroy(true); return; }
    app.ticker.stop();
    host.appendChild(app.canvas);
    app.stage.addChild(world);
    const { Texture } = await import('pixi.js');
    flash.texture = Texture.WHITE; flash.alpha = 0;
    app.stage.addChild(flash);
    fit();
    window.addEventListener('resize', fit);
    setRasterScale(scale, window.devicePixelRatio || 1);
    try { await document.fonts.load('64px "Lilita One"'); } catch { /* repli */ }
    installDamageFont();
    // Décor de la map.
    for (const layer of map.layers) {
      const tex = await loadTexture(layer.svg('solo', map.shape), Math.round(1000 * scale), Math.min(2, dpr));
      const s = new Sprite(tex);
      s.width = 1000; s.height = 1600;
      scenery.addChild(s);
    }
    const g = new Graphics();
    for (const r of layout.board.cells) g.roundRect(r.x, r.y, r.w, r.h, 18).fill({ color: 0x1d1733, alpha: 0.25 });
    scenery.addChild(g);
    fx = new CombatFx(app.renderer, { ground: groundL, shots: shotL, top: topL }, {
      cell,
      enemy: (uid) => enemies.get(uid),
      enemies: () => enemies.values(),
      shake: (a, d) => { if (a >= shakeAmp || shakeT <= 0) { shakeAmp = a; shakeT = d; } },
      flash: (a, _d, c = 0xffffff) => { flash.tint = c; flash.alpha = a; },
    });
    nums = new Numbers(numL);
    await preloadBattle(UNIT_IDS.slice(0, 5));
    void Promise.all(UNIT_IDS.map((id) => Promise.all([loadToken(id, 0), loadToken(id, 1), loadToken(id, 2)])));
    setMode('unit');
    (window as unknown as { __fxDev: unknown }).__fxDev = {
      select: (id: UnitId) => { sel.value = id; sel.onchange?.(new Event('change')); },
      attack: () => fireAttack(7, unit, atkIdx++),
      ability: () => fireAbility(7, unit),
      setAuto: (on: boolean) => { auto = on; },
      /** Fige la boucle et avance la simulation de `sec` secondes par pas de 1/60 (captures exactes). */
      freeze: (on: boolean) => { frozen = on; },
      advance: (sec: number) => { const n = Math.round(sec * 60); let ms = 0; for (let i = 0; i < n; i++) { const t = performance.now(); step(1 / 60); ms += performance.now() - t; } draw(); return ms / Math.max(1, n); },
      mode: (m: typeof mode) => setMode(m),
      status: () => (ui.querySelector('button:nth-of-type(6)') as HTMLButtonElement | null)?.click(),
      perf: () => ({ fxAvg: fx.perf.avg, fxPeak: fx.perf.peak, frame: frameAvg, render: renderAvg, objects: fx.count, q: fx.q }),
      units: UNIT_IDS,
    };
    requestAnimationFrame(frame);
  })();

  return () => {
    stopped = true;
    window.removeEventListener('resize', fit);
    try { fx?.clear(); app.destroy(true, { children: true }); } catch { /* déjà détruit */ }
    host.remove(); ui.remove(); stats.remove();
  };
}
