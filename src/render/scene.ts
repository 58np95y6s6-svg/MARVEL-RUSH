// Scène PixiJS du combat, pilotée par le moteur (src/engine).
// Le moteur avance à pas fixe (20 ticks/s) ; la scène dessine à la fréquence de l'écran et interpole
// la position des ennemis entre deux ticks. Coordonnées : écran logique 1000 × 1600 (src/maps/layout.ts),
// mis à l'échelle et centré dans les zones sûres de l'écran.
import { Application, BitmapText, Container, Graphics, Rectangle, Sprite, Texture } from 'pixi.js';
import type { Engine, EngineEvent, EnemyInstance, LaneId, PlayerId, UnitInstance } from '../engine';
import { GRID_SIZE } from '../engine';
import type { BossId, UnitId } from '../data/types';
import type { MapDefX } from '../maps/kit';
import { SCREEN, layoutFor, type PathShape, type SoloLayout } from '../maps/layout';
import { arenaForBoss } from '../maps';
import type { AmbientAnim } from '../maps/kit';
import { loadTexture } from '../art';
import { UNITS } from '../data/units';
import { LaneSampler } from './path';
import {
  DMG_FONT, Numbers, Particles, Shots, formatDamage, installDamageFont, makeFxTextures, type FxTextures,
} from './fx';
import { fxSpec, UNIT_FX_COLOR } from './fxTable';
import {
  SIZES, bossTex, enemyTex, enemyWidth, loadLayer, minionTex, preloadBattle, preloadBoss, setRasterScale, tokenTex, type Pose,
} from './textures';

const INK = 0x1d1733;
const DT = 1 / 20;

/** Mise à l'échelle de l'écran logique. `extTop`/`extBottom` : marge libre (px logiques) entre l'écran logique et les zones sûres. */
export interface Fit { scale: number; x: number; y: number; width: number; height: number; extTop: number; extBottom: number }

export interface SceneOptions {
  engine: Engine;
  map: MapDefX;
  player: PlayerId;
  /** Zones sûres (px CSS) : haut, droite, bas, gauche. */
  safe?: () => [number, number, number, number];
}

// ---------------------------------------------------------------- vues

interface UnitView {
  uid: number;
  unit: UnitId;
  shown: UnitId;
  rank: number;
  slot: number;
  root: Container;
  body: Container;
  sprite: Sprite;
  pips: Graphics;
  pipsShown: number;
  glow: Sprite;
  status: BitmapText;
  statusKind: string;
  attackT: number; // < 0 : pas d'attaque en cours
  hopT: number;
  flashT: number;
  pipT: number;
  dragging: boolean;
  returnT: number;
  rx: number; ry: number; // position de retour
  dim: boolean;
  target: boolean;
}

interface EnemyView {
  uid: number;
  lane: LaneId;
  prevD: number;
  curD: number;
  seen: boolean;
  root: Container;
  sprite: Sprite;
  shadow: Sprite;
  barBg: Sprite;
  bar: Sprite;
  kind: 'enemy' | 'minion' | 'giant' | 'boss';
  enemy: EnemyInstance;
  width: number;
  phase: number;
  hitT: number;
  powerT: number;
  x: number; y: number;
  dmgAcc: number;
  dmgT: number;
}

export class BattleScene {
  readonly app = new Application();
  readonly layout: SoloLayout;
  fit: Fit = { scale: 1, x: 0, y: 0, width: 1000, height: 1600, extTop: 0, extBottom: 0 };

  private engine: Engine;
  private map: MapDefX;
  private player: PlayerId;
  private host!: HTMLElement;
  private safe: () => [number, number, number, number];

  private world = new Container();
  private sceneryLayer = new Container();
  private arena: Container | null = null;
  private arenaBoss: BossId | null = null;
  private arenaFade = 0; // 1 : apparition, −1 : disparition
  private tintOverlay = new Sprite(Texture.WHITE);
  private tintTarget = 0;
  private boardFx = new Container();
  private unitLayer = new Container();
  private enemyLayer = new Container();
  private shotLayer = new Container();
  private partLayer = new Container();
  private numLayer = new Container();
  private flashLayer = new Container();
  private flash = new Sprite(Texture.WHITE);

  private tex!: FxTextures;
  private parts!: Particles;
  private shots!: Shots;
  private numbers!: Numbers;

  private lanes = new Map<LaneId, LaneSampler>();
  private units: (UnitView | null)[] = Array.from({ length: GRID_SIZE }, () => null);
  private unitPool: UnitView[] = [];
  private enemies = new Map<number, EnemyView>();
  private enemyPool: EnemyView[] = [];
  private anims: { a: AmbientAnim; s: Sprite }[] = [];
  private targetRings: Sprite[] = [];
  private time = 0;
  private shakeAmp = 0;
  private shakeT = 0;
  private flashT = 0;
  private flashMax = 0;
  private dragFrom = -1;
  private destroyed = false;
  private onResize = () => this.resize();
  private ro?: ResizeObserver;

  private constructor(o: SceneOptions) {
    this.engine = o.engine;
    this.map = o.map;
    this.player = o.player;
    this.safe = o.safe ?? (() => [0, 0, 0, 0]);
    this.layout = layoutFor('solo', o.map.shape) as SoloLayout;
    this.lanes.set('a', new LaneSampler(this.layout.lane));
  }

  static async create(host: HTMLElement, o: SceneOptions): Promise<BattleScene> {
    const s = new BattleScene(o);
    await s.init(host);
    return s;
  }

  private get me() {
    return this.engine.state.players.find((p) => p.id === this.player) ?? this.engine.state.players[0]!;
  }

  private async init(host: HTMLElement): Promise<void> {
    this.host = host;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    await this.app.init({
      width: host.clientWidth || 375, height: host.clientHeight || 667,
      backgroundColor: this.map.palette['bg'] ?? '#2c2440',
      antialias: false, resolution: dpr, autoDensity: true,
      powerPreference: 'high-performance', preference: 'webgl',
    });
    this.app.ticker.stop();
    const cv = this.app.canvas;
    cv.style.position = 'absolute';
    cv.style.inset = '0';
    cv.style.width = '100%';
    cv.style.height = '100%';
    cv.style.touchAction = 'none';
    host.appendChild(cv);

    this.computeFit();
    setRasterScale(this.fit.scale, window.devicePixelRatio || 1);

    const stage = this.app.stage;
    stage.addChild(this.world);
    this.world.addChild(this.sceneryLayer, this.tintOverlay, this.boardFx, this.enemyLayer, this.unitLayer, this.shotLayer, this.partLayer, this.numLayer);
    stage.addChild(this.flashLayer);
    this.flashLayer.addChild(this.flash);
    this.flash.alpha = 0;
    this.flash.visible = false;
    this.enemyLayer.sortableChildren = true;
    this.unitLayer.sortableChildren = true;
    this.tintOverlay.position.set(-3000, -4000);
    this.tintOverlay.width = 7000;
    this.tintOverlay.height = 9600;
    this.tintOverlay.alpha = 0;

    try { await document.fonts.load('64px "Lilita One"'); } catch { /* police de repli */ }
    installDamageFont();
    this.tex = makeFxTextures(this.app.renderer);
    this.parts = new Particles(this.partLayer);
    this.shots = new Shots(this.shotLayer, this.tex, this.parts, (uid, out) => {
      const v = this.enemies.get(uid);
      if (!v) return false;
      out.x = v.x; out.y = v.y - v.width * 0.35;
      return true;
    });
    this.numbers = new Numbers(this.numLayer);

    for (let i = 0; i < 15; i++) {
      const r = new Sprite(this.tex.ring);
      r.anchor.set(0.5);
      r.visible = false;
      this.boardFx.addChild(r);
      this.targetRings.push(r);
    }

    await Promise.all([this.loadMap(), preloadBattle(this.me.deck)]);
    this.resize();
    window.addEventListener('resize', this.onResize);
    if (typeof ResizeObserver !== 'undefined') {
      this.ro = new ResizeObserver(this.onResize);
      this.ro.observe(host);
    }
    this.syncUnits(true);
  }

  /** Couleur moyenne d'une bande de la texture de fond (fractions de la largeur et de la hauteur). */
  private sample(t: Texture, x0: number, y0: number, x1: number, y1: number): number | undefined {
    const res = t.source.resource as unknown;
    if (!(res instanceof HTMLCanvasElement)) return undefined;
    try {
      // Réduit la bande à 8 × 1 px sur un petit canevas, puis moyenne.
      const c = document.createElement('canvas');
      c.width = 8; c.height = 1;
      const g = c.getContext('2d', { willReadFrequently: true });
      if (!g) return undefined;
      const W = res.width, H = res.height;
      g.drawImage(res, x0 * W, y0 * H, Math.max(1, (x1 - x0) * W), Math.max(1, (y1 - y0) * H), 0, 0, 8, 1);
      const d = g.getImageData(0, 0, 8, 1).data;
      let r = 0, gg = 0, b = 0;
      for (let i = 0; i < 32; i += 4) { r += d[i]!; gg += d[i + 1]!; b += d[i + 2]!; }
      return (Math.round(r / 8) << 16) | (Math.round(gg / 8) << 8) | Math.round(b / 8);
    } catch { return undefined; }
  }

  /**
   * Décor complet d'une map (ou d'une arène) avec le tracé de la map en cours : prolongement des bords,
   * fond, décor latéral, animations d'ambiance, chemin et plateau.
   */
  private async buildScenery(m: MapDefX, shape: PathShape): Promise<Container> {
    const box = new Container();
    const ext = new Graphics();
    box.addChild(ext);
    const ids: ('fond' | 'decor' | 'chemin')[] = ['fond', 'decor', 'chemin'];
    const texs = await Promise.all(ids.map((id) => {
      const layer = m.layers.find((l) => l.id === id);
      return layer ? loadLayer(`${m.id}-${shape}-${id}`, () => layer.svg('solo', shape)) : Promise.resolve(null);
    }));
    const list = m.anims('solo', shape);
    const loaded = await Promise.all(list.map((a) => loadTexture(a.svg, Math.max(8, a.box.w * this.fit.scale), Math.min(2, window.devicePixelRatio || 1)).catch(() => null)));
    // Les trois couches fixes (fond, décor, chemin et plateau) sont cuites en une seule texture à la
    // taille de l'écran : un seul quad plein écran au lieu de trois (mémoire et remplissage du GPU).
    const flat = new Container();
    for (const t of texs) {
      if (!t) continue;
      const sp = new Sprite(t);
      sp.width = SCREEN.w;
      sp.height = SCREEN.h;
      flat.addChild(sp);
    }
    const baked = this.app.renderer.generateTexture({
      target: flat, frame: new Rectangle(0, 0, SCREEN.w, SCREEN.h),
      resolution: Math.min(3, this.fit.scale * this.app.renderer.resolution),
    });
    flat.destroy({ children: true });
    const bg = new Sprite(baked);
    bg.width = SCREEN.w;
    bg.height = SCREEN.h;
    bg.label = 'baked';
    box.addChild(bg);
    // Animations d'ambiance (elles ne passent jamais sur le chemin ni sur la grille).
    list.forEach((a, i) => {
      const t = loaded[i];
      if (!t) return;
      const sp = new Sprite(t);
      const ox = a.ox ?? a.box.x + a.box.w / 2, oy = a.oy ?? a.box.y + a.box.h / 2;
      sp.anchor.set((ox - a.box.x) / a.box.w, (oy - a.box.y) / a.box.h);
      sp.width = a.box.w;
      sp.height = a.box.h;
      sp.position.set(ox, oy);
      box.addChild(sp);
      this.anims.push({ a, s: sp });
    });
    // Prolonge le décor au-delà de l'écran logique (téléphones plus allongés que 10:16)
    // avec les couleurs des bords de la couche de fond.
    const p = m.palette;
    const fond = texs[0];
    const top = fond ? this.sample(fond, 0, 0, 1, 0.004) : undefined;
    const bottom = fond ? this.sample(fond, 0, 0.996, 1, 1) : undefined;
    const left = fond ? this.sample(fond, 0, 0.3, 0.004, 0.9) : undefined;
    const right = fond ? this.sample(fond, 0.996, 0.3, 1, 0.9) : undefined;
    ext.rect(-3000, -4000, 7000, 4000 + 2).fill(top ?? p['sky1'] ?? '#4b3f7e');
    ext.rect(-3000, SCREEN.h - 2, 7000, 4000).fill(bottom ?? p['ground'] ?? '#54496a');
    ext.rect(-3000, 0, 3002, SCREEN.h).fill(left ?? p['ground'] ?? '#5f5374');
    ext.rect(SCREEN.w - 2, 0, 3002, SCREEN.h).fill(right ?? p['ground'] ?? '#5f5374');
    return box;
  }

  private async loadMap(): Promise<void> {
    const box = await this.buildScenery(this.map, this.map.shape);
    this.sceneryLayer.addChild(box);
  }

  /** Arrivée d'un gros boss : la map se transforme en son arène (fondu de 1 s, même tracé). */
  private async enterArena(boss: BossId): Promise<void> {
    const arena = arenaForBoss(boss);
    if (!arena || this.arenaBoss === boss) return;
    this.arenaBoss = boss;
    const box = await this.buildScenery(arena, this.map.shape);
    if (this.destroyed || this.arenaBoss !== boss) { this.dropScenery(box); return; }
    if (this.arena) this.dropScenery(this.arena);
    this.arena = box;
    box.alpha = 0;
    this.sceneryLayer.addChild(box);
    this.arenaFade = 1;
    const fx = arena.bossFx;
    this.tintOverlay.tint = fx?.tint ? Number.parseInt(fx.tint.replace('#', ''), 16) : 0x000000;
    this.tintTarget = fx?.tint ? (fx.tintAlpha ?? 0.15) : 0;
  }

  private dropScenery(box: Container): void {
    // Les sprites d'ambiance du décor quittent la liste d'animation avant d'être détruits.
    this.anims = this.anims.filter((x) => x.s.parent !== box);
    const baked = box.children.find((c) => c.label === 'baked') as Sprite | undefined;
    baked?.texture.destroy(true);
    box.destroy({ children: true });
  }

  /** Mort du boss : retour à la map de départ. */
  private leaveArena(): void {
    if (!this.arenaBoss) return;
    this.arenaBoss = null;
    this.arenaFade = -1;
    this.tintTarget = 0;
  }

  // ---------------------------------------------------------------- mise à l'échelle

  private computeFit(): void {
    const W = this.host.clientWidth || window.innerWidth, H = this.host.clientHeight || window.innerHeight;
    const [st, sr, sb, sl] = this.safe();
    const aw = Math.max(100, W - sl - sr), ah = Math.max(100, H - st - sb);
    const scale = Math.min(aw / SCREEN.w, ah / SCREEN.h);
    const w = SCREEN.w * scale, h = SCREEN.h * scale;
    const x = sl + (aw - w) / 2;
    // Écran plus allongé que 10:16 : on garde un peu plus d'espace en haut (barre d'état, encoche).
    // Écran plus allongé que 10:16 : la barre du haut et les commandes se collent aux bords (zones sûres
    // comprises), le plateau descend un peu pour rester près des commandes.
    const spare = ah - h;
    const y = st + spare * 0.62;
    this.fit = { scale, x, y, width: w, height: h, extTop: (y - st) / scale, extBottom: (spare - (y - st)) / scale };
  }

  resize(): void {
    if (this.destroyed) return;
    const W = this.host.clientWidth || window.innerWidth, H = this.host.clientHeight || window.innerHeight;
    this.app.renderer.resize(W, H);
    this.computeFit();
    this.world.scale.set(this.fit.scale);
    this.world.position.set(this.fit.x, this.fit.y);
    this.flash.width = W;
    this.flash.height = H;
    this.onFit?.(this.fit);
  }

  onFit?: (f: Fit) => void;

  /** Coordonnées logiques d'un point écran (px CSS relatifs à l'hôte). */
  toLogical(clientX: number, clientY: number, out: { x: number; y: number }): void {
    const r = this.host.getBoundingClientRect();
    out.x = (clientX - r.left - this.fit.x) / this.fit.scale;
    out.y = (clientY - r.top - this.fit.y) / this.fit.scale;
  }

  /** Case de la grille sous un point logique, ou −1. */
  slotAt(x: number, y: number): number {
    const g = this.layout.board.grid, c = this.layout.board.cell;
    if (x < g.x || y < g.y || x >= g.x + g.w || y >= g.y + g.h) return -1;
    return Math.floor((y - g.y) / c) * 5 + Math.floor((x - g.x) / c);
  }

  cellCenter(slot: number): { x: number; y: number } {
    const r = this.layout.board.cells[slot]!;
    return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
  }

  // ---------------------------------------------------------------- unités

  private newUnitView(): UnitView {
    const v = this.unitPool.pop();
    if (v) { v.root.visible = true; return v; }
    const root = new Container();
    const body = new Container();
    const sprite = new Sprite();
    sprite.anchor.set(0.5, 0.5);
    const pips = new Graphics();
    const glow = new Sprite(this.tex.dot);
    glow.anchor.set(0.5);
    glow.scale.set(3.2);
    glow.blendMode = 'add';
    glow.visible = false;
    const status = new BitmapText({ text: '', style: { fontFamily: DMG_FONT, fontSize: 34 } });
    status.anchor.set(0.5);
    status.position.set(30, -48);
    status.visible = false;
    const k = SIZES.token / 200;
    body.position.set(0, SIZES.token * 0.42);
    sprite.position.set(0, -SIZES.token * 0.42);
    pips.position.set(-100 * k, -SIZES.token * 0.42 - 100 * k);
    pips.scale.set(k);
    body.addChild(sprite, pips);
    root.addChild(glow, body, status);
    this.unitLayer.addChild(root);
    return {
      uid: 0, unit: 'spiderman', shown: 'spiderman', rank: 1, slot: 0, root, body, sprite, pips, pipsShown: 0, glow, status, statusKind: '',
      attackT: -1, hopT: -1, flashT: -1, pipT: 0, dragging: false, returnT: -1, rx: 0, ry: 0, dim: false, target: false,
    };
  }

  private drawPips(v: UnitView, n: number): void {
    const g = v.pips;
    g.clear();
    if (n <= 0) return;
    // Pastilles plus grosses que sur la planche : lisibles à 375 px de large.
    const gap = 25, w = v.rank * gap + 12, x0 = 100 - w / 2, cy = 178;
    const rc = rarityColor(v.unit);
    g.roundRect(x0, cy - 16, w, 32, 16).fill(INK).stroke({ color: rc, width: 3.5 });
    for (let i = 0; i < n; i++) {
      const cx = x0 + 6 + gap / 2 + i * gap;
      g.circle(cx, cy, 9).fill(0xfff4c2).stroke({ color: rc, width: 3 });
      g.circle(cx - 2.6, cy - 2.6, 2.8).fill(0xffffff);
    }
    v.pipsShown = n;
  }

  private setupUnit(v: UnitView, u: UnitInstance, slot: number, appear: 'summon' | 'merge' | 'none'): void {
    v.uid = u.uid;
    v.unit = u.unit;
    v.shown = u.status.transformedInto ?? u.unit;
    v.rank = u.rank;
    v.slot = slot;
    const c = this.cellCenter(slot);
    v.root.position.set(c.x, c.y);
    v.rx = c.x; v.ry = c.y;
    v.root.zIndex = slot;
    v.root.alpha = 1;
    v.attackT = -1;
    v.returnT = -1;
    v.dragging = false;
    v.statusKind = '';
    v.status.visible = false;
    v.sprite.tint = 0xffffff;
    v.body.scale.set(1);
    v.hopT = appear === 'none' ? -1 : 0;
    v.flashT = appear === 'merge' ? 0 : -1;
    v.pipT = 0;
    v.sprite.texture = tokenTex(v.shown, 0) ?? Texture.EMPTY;
    v.sprite.width = SIZES.token;
    v.sprite.height = SIZES.token;
    this.drawPips(v, appear === 'merge' ? Math.max(0, v.rank - 1) : v.rank);
  }

  /** Met les vues d'unités en accord avec la grille du joueur. */
  private syncUnits(initial = false): void {
    const grid = this.me.grid;
    for (let i = 0; i < GRID_SIZE; i++) {
      const u = grid[i];
      let v = this.units[i];
      if (!u) {
        if (v) { this.releaseUnit(v); this.units[i] = null; }
        continue;
      }
      if (v && v.uid !== u.uid) {
        this.releaseUnit(v);
        v = null;
      }
      if (!v) {
        v = this.newUnitView();
        this.setupUnit(v, u, i, initial ? 'none' : 'none');
        this.units[i] = v;
      } else {
        const shown = u.status.transformedInto ?? u.unit;
        if (shown !== v.shown) { v.shown = shown; v.flashT = 0; }
        if (u.rank !== v.rank) { v.rank = u.rank; this.drawPips(v, u.rank); v.flashT = 0; }
      }
      const st = u.status;
      const kind = (st.sleepingFor ?? 0) > 0 ? 'zzz' : (st.hypnotizedFor ?? 0) > 0 ? 'hyp' : (st.stunnedFor ?? 0) > 0 ? 'stun' : '';
      if (kind !== v.statusKind) {
        v.statusKind = kind;
        v.status.visible = kind !== '';
        v.status.text = kind === 'zzz' ? 'Zzz' : kind === 'hyp' ? '!!' : kind === 'stun' ? '!' : '';
        v.status.tint = kind === 'zzz' ? 0x9fd8ff : kind === 'hyp' ? 0xd28cff : 0xffe14a;
        v.sprite.tint = kind ? 0x9a94b8 : 0xffffff;
      }
    }
  }

  private releaseUnit(v: UnitView): void {
    v.root.visible = false;
    v.glow.visible = false;
    this.unitPool.push(v);
  }

  // ---------------------------------------------------------------- ennemis

  private newEnemyView(e: EnemyInstance): EnemyView {
    let v = this.enemyPool.pop();
    if (!v) {
      const root = new Container();
      const shadow = new Sprite(this.tex.dot);
      shadow.anchor.set(0.5);
      shadow.tint = 0x000000;
      shadow.alpha = 0.35;
      const sprite = new Sprite();
      const barBg = new Sprite(Texture.WHITE);
      const bar = new Sprite(Texture.WHITE);
      barBg.tint = INK;
      barBg.anchor.set(0, 0.5);
      bar.anchor.set(0, 0.5);
      root.addChild(shadow, sprite, barBg, bar);
      this.enemyLayer.addChild(root);
      v = {
        uid: 0, lane: 'a', prevD: 0, curD: 0, seen: true, root, sprite, shadow, barBg, bar, kind: 'enemy', enemy: e,
        width: 100, phase: 0, hitT: -1, powerT: -1, x: 0, y: 0, dmgAcc: 0, dmgT: 0,
      };
    }
    v.root.visible = true;
    v.root.alpha = 1;
    v.uid = e.uid;
    v.enemy = e;
    v.lane = e.lane;
    v.prevD = v.curD = e.distance;
    v.kind = e.bossId ? 'boss' : e.giant ? 'giant' : e.kind === 'sbire' ? 'minion' : 'enemy';
    v.width = v.kind === 'boss' ? SIZES.boss : v.kind === 'giant' ? SIZES.giant : enemyWidth(e.kind);
    v.phase = (e.uid * 0.37) % 1;
    v.hitT = -1;
    v.powerT = -1;
    v.dmgAcc = 0;
    v.dmgT = 0;
    v.sprite.texture = Texture.EMPTY;
    // Ancre aux pieds (cadres des planches) : unités ennemies 190×190 → 0,858 ; boss 280×280 → 0,904.
    v.sprite.anchor.set(0.5, v.kind === 'boss' ? 0.904 : 0.858);
    v.shadow.scale.set(v.width / 70, v.width / 260);
    const bw = v.kind === 'giant' ? 150 : 80;
    v.barBg.width = bw + 6; v.barBg.height = v.kind === 'giant' ? 18 : 14;
    v.bar.height = v.kind === 'giant' ? 12 : 8;
    v.barBg.position.set(-(bw + 6) / 2, -v.width * (v.kind === 'giant' ? 0.78 : 0.82));
    v.bar.position.set(-bw / 2, v.barBg.y);
    v.barBg.visible = v.bar.visible = v.kind !== 'boss';
    return v;
  }

  private enemyTexture(v: EnemyView, t: number): Texture | null {
    const e = v.enemy;
    const step: Pose = Math.floor(t * 4 + v.phase * 2) % 2 === 0 ? 0 : 1;
    if (v.kind === 'boss') return bossTex(e.bossId as BossId, v.powerT >= 0 ? (v.powerT < 0.25 ? 1 : 2) : 0);
    if (v.kind === 'giant') return minionTex(e.minionOf as BossId, v.powerT >= 0 ? 2 : step, true);
    if (v.kind === 'minion') return minionTex(e.minionOf as BossId, step);
    return enemyTex(e.kind as Exclude<typeof e.kind, 'sbire'>, v.uid % 3);
  }

  /** Avant un tick : mémorise la distance de chaque ennemi pour l'interpolation. */
  beforeTick(): void {
    for (const e of this.engine.state.enemies) {
      const v = this.enemies.get(e.uid);
      if (v) { v.prevD = e.distance; v.lane = e.lane; }
    }
  }

  /** Après un tick : crée et retire les vues, puis joue les événements. */
  afterTick(events: EngineEvent[]): void {
    const list = this.engine.state.enemies;
    for (const v of this.enemies.values()) v.seen = false;
    for (const e of list) {
      let v = this.enemies.get(e.uid);
      if (!v) {
        v = this.newEnemyView(e);
        this.enemies.set(e.uid, v);
        this.placeEnemy(v, e.distance);
      }
      v.enemy = e;
      v.seen = true;
      if (v.lane !== e.lane) { v.prevD = e.distance; v.lane = e.lane; }
      v.curD = e.distance;
      if (Math.abs(v.curD - v.prevD) > 1.2) v.prevD = v.curD; // téléportation (portail, recul) : pas d'interpolation
    }
    for (const [uid, v] of this.enemies) {
      if (v.seen) continue;
      this.enemies.delete(uid);
      v.root.visible = false;
      this.enemyPool.push(v);
    }
    for (const ev of events) this.onEvent(ev);
    this.syncUnits();
  }

  private placeEnemy(v: EnemyView, d: number): void {
    const s = this.lanes.get(v.lane) ?? this.lanes.get('a')!;
    s.at(Math.max(0, d));
    v.x = s.x; v.y = s.y;
  }

  // ---------------------------------------------------------------- événements

  private onEvent(ev: EngineEvent): void {
    switch (ev.type) {
      case 'summon': {
        if (ev.player !== this.player) break;
        this.syncUnits();
        const v = this.units[ev.slot];
        if (v) { v.hopT = 0; }
        const c = this.cellCenter(ev.slot);
        this.shots.ring(c.x, c.y, 0x9fd8ff, 80, 0.45);
        this.shots.ring(c.x, c.y, 0xffffff, 55, 0.3);
        this.parts.burst(this.tex.spark, c.x, c.y, 12, 0x9fd8ff, 380, 0.45, 0.7);
        for (let i = 0; i < 6; i++) this.parts.emit(this.tex.dot, c.x + (Math.random() - 0.5) * 80, c.y + 40, { color: 0x7fc4ff, vy: -220 - Math.random() * 120, life: 0.6, s0: 0.8, s1: 0.1 });
        break;
      }
      case 'merge': {
        if (ev.player !== this.player) break;
        this.syncUnits();
        const v = this.units[ev.to];
        if (v && v.uid) { v.hopT = 0; v.flashT = 0; v.pipT = 0; this.drawPips(v, ev.rank - 1); }
        const c = this.cellCenter(ev.to);
        this.shots.ring(c.x, c.y, 0xffe27a, 110, 0.4);
        this.parts.burst(this.tex.star, c.x, c.y, 10, 0xffe27a, 480, 0.55, 0.6);
        this.parts.emit(this.tex.dot, c.x, c.y, { color: 0xffffff, life: 0.3, s0: 2.6, s1: 4.5, a0: 0.9 });
        break;
      }
      case 'powerup': {
        if (ev.player !== this.player) break;
        for (const v of this.units) {
          if (!v || v.unit !== ev.unit) continue;
          v.flashT = 0;
          this.parts.burst(this.tex.spark, v.rx, v.ry, 8, 0x8dff9a, 300, 0.5, 0.5);
          for (let i = 0; i < 4; i++) this.parts.emit(this.tex.star, v.rx + (Math.random() - 0.5) * 70, v.ry + 30, { color: 0x8dff9a, vy: -260, life: 0.6, s0: 0.5, s1: 0.1 });
        }
        break;
      }
      case 'attack': {
        if (ev.player !== this.player) break;
        const v = this.units[ev.slot];
        if (v && (v.attackT < 0 || v.attackT > 0.19)) v.attackT = 0;
        this.attackFx(ev.slot, ev.unit, ev.fx, ev.targets);
        break;
      }
      case 'ability': {
        if (ev.player !== this.player) break;
        const v = this.units[ev.slot];
        if (v && v.attackT < 0) v.attackT = 0;
        const c = this.cellCenter(ev.slot);
        const col = UNIT_FX_COLOR[ev.unit] ?? 0xffffff;
        this.shots.ring(c.x, c.y, col, 95, 0.4);
        for (const t of ev.targets) {
          const e = this.enemies.get(t);
          if (e) this.shots.ring(e.x, e.y - 30, col, 70, 0.35);
        }
        break;
      }
      case 'hit': {
        const v = this.enemies.get(ev.enemy);
        if (!v) break;
        v.hitT = 0;
        if (ev.damage <= 0) {
          this.numbers.show('Bloqué', v.x, v.y - v.width * 0.8, { color: 0x9fd8ff, size: 26, life: 0.6 });
        } else if (ev.crit) {
          this.numbers.show(formatDamage(ev.damage) + '!', v.x, v.y - v.width * 0.8, { color: 0xffd23a, size: 62, life: 1 });
          this.parts.burst(this.tex.star, v.x, v.y - v.width * 0.4, 5, 0xffb03a, 320, 0.35, 0.5);
        } else {
          v.dmgAcc += ev.damage;
        }
        break;
      }
      case 'kill': {
        const v = this.enemies.get(ev.enemy);
        if (!v) break;
        this.flushDamage(v);
        const y = v.y - v.width * 0.35;
        this.parts.burst(this.tex.dot, v.x, y, v.kind === 'boss' ? 26 : 9, 0xfff0d0, v.kind === 'boss' ? 700 : 300, 0.45, v.kind === 'boss' ? 1.6 : 0.8);
        this.parts.burst(this.tex.spark, v.x, y, 6, 0x7fc4ff, 260, 0.5, 0.45);
        if (v.kind === 'boss' || v.kind === 'giant') { this.shake(14, 0.6); this.screenFlash(0.5, 0.35); }
        break;
      }
      case 'bossSpawn':
        this.shake(16, 0.9);
        preloadBoss(ev.boss);
        void this.enterArena(ev.boss);
        break;
      case 'miniBossSpawn':
        this.shake(16, 0.9);
        preloadBoss(ev.boss);
        break;
      case 'bossPower': {
        for (const v of this.enemies.values()) if (v.kind === 'boss' || v.kind === 'giant') v.powerT = 0;
        if (ev.player === this.player) for (const s of ev.slots) {
          const c = this.cellCenter(s);
          this.shots.ring(c.x, c.y, 0xc0263a, 100, 0.5);
          this.parts.burst(this.tex.spark, c.x, c.y, 10, 0xff5a7a, 340, 0.5, 0.6);
        }
        this.shake(6, 0.3);
        break;
      }
      case 'lifeLost': {
        this.shake(12, 0.4);
        const s = this.lanes.get('a')!;
        s.at(s.cells);
        this.parts.burst(this.tex.spark, s.x, s.y - 40, 14, 0xff4a4a, 420, 0.5, 0.8);
        this.screenFlash(0.25, 0.3, 0xff2a2a);
        break;
      }
      case 'waveStart':
        this.leaveArena();
        if (this.engine.state.upcomingBoss) preloadBoss(this.engine.state.upcomingBoss.boss);
        break;
      default:
        break;
    }
  }

  private attackFx(slot: number, unit: UnitId, fx: string, targets: number[]): void {
    const spec = fxSpec(fx, unit);
    const c = this.cellCenter(slot);
    const first = targets.length ? this.enemies.get(targets[0]!) : undefined;
    // Départ au bord du jeton, du côté de la cible : l'effet ne couvre pas le personnage.
    let x0 = c.x, y0 = c.y - 20;
    if (first) {
      const dx = first.x - c.x, dy = first.y - 40 - c.y, L = Math.hypot(dx, dy) || 1;
      x0 = c.x + (dx / L) * 58; y0 = c.y + (dy / L) * 58;
    }
    if (spec.shake) this.shake(spec.shake, 0.18);
    if (spec.beam && targets.length) {
      // Rayon vers la cible la plus éloignée de l'unité.
      let far = first, best = -1;
      for (const t of targets) {
        const e = this.enemies.get(t);
        if (!e) continue;
        const d = Math.hypot(e.x - x0, e.y - y0);
        if (d > best) { best = d; far = e; }
      }
      if (far) {
        const dx = far.x - x0, dy = far.y - 30 - y0, L = Math.hypot(dx, dy) || 1;
        const x1 = x0 + (dx / L) * (L + 200), y1 = y0 + (dy / L) * (L + 200);
        this.shots.beam(x0, y0, x1, y1, spec.color, spec.beam, 0.3);
        this.shots.beam(x0, y0, x1, y1, 0xffffff, spec.beam * 0.35, 0.3);
      }
      for (const t of targets) { const e = this.enemies.get(t); if (e) this.parts.burst(this.tex.spark, e.x, e.y - 30, 4, spec.color, 240, 0.3, 0.5); }
      return;
    }
    if (spec.chain) {
      let px = x0, py = y0;
      for (const t of targets) {
        const e = this.enemies.get(t);
        if (!e) continue;
        const ey = e.y - e.width * 0.35;
        if (spec.style === 'orb' || spec.style === 'arrow') {
          if (px === x0 && py === y0) this.shots.fire(spec.style, px, py, t, spec.color, spec.size ?? 1);
          else this.shots.bolt(px, py, e.x, ey, spec.color, 6);
        } else {
          this.shots.bolt(px, py, e.x, ey, spec.color, 9);
        }
        px = e.x; py = ey;
      }
      return;
    }
    if (spec.all) {
      for (const t of targets) this.shots.fire(spec.style, x0, y0, t, spec.color, spec.size ?? 1);
    } else if (targets.length) {
      this.shots.fire(spec.style, x0, y0, targets[0]!, spec.color, spec.size ?? 1);
      for (let i = 1; i < targets.length; i++) {
        const e = this.enemies.get(targets[i]!);
        if (e) this.parts.burst(this.tex.spark, e.x, e.y - 30, 4, spec.color, 220, 0.3, 0.45);
      }
    }
    if (spec.ring && first) this.shots.ring(first.x, first.y - first.width * 0.3, spec.color, spec.ring, 0.35);
    // Éclair de tir au départ.
    this.parts.emit(this.tex.dot, x0, y0, { color: spec.color, life: 0.12, s0: 0.5, s1: 0.9, a0: 0.8 });
  }

  private flushDamage(v: EnemyView): void {
    if (v.dmgAcc <= 0) return;
    this.numbers.show(formatDamage(v.dmgAcc), v.x, v.y - v.width * 0.8, { color: 0xffe9a0, size: v.dmgAcc > 1000 ? 44 : 38 });
    v.dmgAcc = 0;
    v.dmgT = 0;
  }

  // ---------------------------------------------------------------- effets d'écran

  shake(amp: number, dur: number): void {
    if (amp >= this.shakeAmp * (this.shakeT > 0 ? 1 : 0)) { this.shakeAmp = amp; this.shakeT = dur; }
  }

  screenFlash(alpha: number, dur: number, color = 0xffffff): void {
    this.flash.tint = color;
    this.flash.alpha = alpha;
    this.flashT = dur;
    this.flashMax = alpha;
  }

  // ---------------------------------------------------------------- glisser-fusionner

  /** Début du glisser : illumine les unités compatibles (même unité, même rang), assombrit les autres. */
  startDrag(slot: number): boolean {
    const v = this.units[slot];
    const u = this.me.grid[slot];
    if (!v || !u) return false;
    this.dragFrom = slot;
    v.dragging = true;
    v.returnT = -1;
    v.root.zIndex = 100;
    v.glow.visible = true;
    v.glow.tint = 0xffffff;
    let k = 0;
    for (let i = 0; i < GRID_SIZE; i++) {
      const w = this.units[i];
      const o = this.me.grid[i];
      if (!w || !o || i === slot) continue;
      const ok = o.unit === u.unit && o.rank === u.rank && u.rank < 7;
      w.dim = !ok;
      w.target = ok;
      if (ok) {
        const r = this.targetRings[k++]!;
        r.visible = true;
        r.position.set(w.rx, w.ry);
      }
    }
    return true;
  }

  moveDrag(x: number, y: number): void {
    const v = this.dragFrom >= 0 ? this.units[this.dragFrom] : null;
    if (!v) return;
    v.root.position.set(x, y - 30);
  }

  isTarget(slot: number): boolean {
    return !!this.units[slot]?.target;
  }

  /** Fin du glisser : `merged` vrai si une fusion a été demandée (la vue reste sur la cible en attendant le tick). */
  endDrag(dropSlot: number, merged: boolean): void {
    const v = this.dragFrom >= 0 ? this.units[this.dragFrom] : null;
    for (const w of this.units) if (w) { w.dim = false; w.target = false; }
    for (const r of this.targetRings) r.visible = false;
    if (v) {
      v.dragging = false;
      v.glow.visible = false;
      if (merged && dropSlot >= 0) {
        const c = this.cellCenter(dropSlot);
        v.root.position.set(c.x, c.y);
        v.root.alpha = 0.7;
        v.returnT = -2; // en attente : si l'unité est encore là au prochain tick, elle revient
      } else {
        v.returnT = 0;
      }
    }
    this.dragFrom = -1;
  }

  // ---------------------------------------------------------------- image

  /** Dessine une image. `alpha` ∈ [0, 1] : position entre les deux derniers ticks. */
  render(dt: number, alpha: number, paused: boolean): void {
    if (this.destroyed) return;
    this.time += dt;
    const t = this.time;
    const a = paused ? 1 : Math.min(1, Math.max(0, alpha));

    // Fondu vers l'arène du boss, et retour.
    if (this.arena && this.arenaFade !== 0) {
      this.arena.alpha = Math.max(0, Math.min(1, this.arena.alpha + this.arenaFade * dt));
      if (this.arenaFade < 0 && this.arena.alpha <= 0) {
        this.dropScenery(this.arena);
        this.arena = null;
        this.arenaFade = 0;
      } else if (this.arenaFade > 0 && this.arena.alpha >= 1) this.arenaFade = 0;
    }
    if (this.tintOverlay.alpha !== this.tintTarget) {
      const d = this.tintTarget - this.tintOverlay.alpha;
      this.tintOverlay.alpha = Math.abs(d) < 0.01 ? this.tintTarget : this.tintOverlay.alpha + Math.sign(d) * Math.min(Math.abs(d), dt * 0.4);
    }
    this.tintOverlay.visible = this.tintOverlay.alpha > 0.005;

    // Décor animé.
    for (const { a: an, s } of this.anims) animate(an, s, t);

    // Unités.
    const pulse = 0.5 + 0.5 * Math.sin(t * 9);
    for (let i = 0; i < GRID_SIZE; i++) {
      const v = this.units[i];
      if (!v) continue;
      this.renderUnit(v, dt, pulse);
    }
    for (const r of this.targetRings) if (r.visible) { r.scale.set(1.45 + 0.12 * pulse); r.alpha = 0.6 + 0.4 * pulse; }

    // Ennemis (positions interpolées).
    for (const v of this.enemies.values()) {
      const d = v.prevD + (v.curD - v.prevD) * a;
      this.placeEnemy(v, d);
      this.renderEnemy(v, dt, t, d);
    }

    this.shots.update(dt);
    this.parts.update(dt);
    this.numbers.update(dt);

    // Tremblement d'écran.
    if (this.shakeT > 0) {
      this.shakeT -= dt;
      const k = Math.max(0, this.shakeT) * this.shakeAmp * 2;
      const amp = Math.min(this.shakeAmp, k);
      this.world.position.set(this.fit.x + (Math.random() - 0.5) * amp * this.fit.scale * 2, this.fit.y + (Math.random() - 0.5) * amp * this.fit.scale * 2);
      if (this.shakeT <= 0) { this.shakeAmp = 0; this.world.position.set(this.fit.x, this.fit.y); }
    }
    if (this.flashT > 0) {
      this.flashT -= dt;
      this.flash.alpha = Math.max(0, this.flashMax * (this.flashT / 0.35));
      this.flash.visible = true;
    } else if (this.flash.visible) { this.flash.alpha = 0; this.flash.visible = false; }

    this.app.render();
  }

  private renderUnit(v: UnitView, dt: number, pulse: number): void {
    // Pose d'attaque : repos → préparation (0,08 s) → frappe (0,14 s) → repos, avec écrasement-étirement.
    let pose: Pose = 0, sx = 1, sy = 1;
    if (v.attackT >= 0) {
      v.attackT += dt;
      const t = v.attackT;
      if (t < 0.09) { pose = 1; const k = t / 0.09; sx = 1 + 0.08 * k; sy = 1 - 0.08 * k; }
      else if (t < 0.19) { pose = 2; const k = (t - 0.09) / 0.1; sx = 1.08 - 0.14 * Math.sin(k * Math.PI) - 0.08 * k; sy = 0.92 + 0.2 * Math.sin(k * Math.PI) + 0.08 * k; }
      else if (t < 0.26) pose = 0;
      else v.attackT = -1;
    }
    const tex = tokenTex(v.shown, pose) ?? tokenTex(v.shown, 0);
    if (tex && v.sprite.texture !== tex) {
      v.sprite.texture = tex;
      v.sprite.width = SIZES.token;
      v.sprite.height = SIZES.token;
    }
    // Petit saut (invocation, fusion).
    let hop = 0, hs = 1;
    if (v.hopT >= 0) {
      v.hopT += dt;
      const k = v.hopT / 0.35;
      if (k >= 1) v.hopT = -1;
      else {
        hop = Math.sin(k * Math.PI) * 34;
        hs = k < 0.3 ? 0.3 + (k / 0.3) * 0.85 : 1.15 - ((k - 0.3) / 0.7) * 0.15;
        if (k > 0.75) { sx *= 1 + 0.12 * (1 - k) * 4 * 0.25; sy *= 1 - 0.12 * (1 - k) * 4 * 0.25; }
      }
    }
    v.body.scale.set(sx * hs, sy * hs);
    v.body.y = SIZES.token * 0.42 - hop;
    // Pastilles qui s'ajoutent une à une après une fusion.
    if (v.pipsShown < v.rank) {
      v.pipT += dt;
      if (v.pipT > 0.09) { v.pipT = 0; this.drawPips(v, v.pipsShown + 1); }
    }
    // Éclat (fusion, amélioration).
    if (v.flashT >= 0) {
      v.flashT += dt;
      const k = v.flashT / 0.4;
      if (k >= 1) { v.flashT = -1; v.glow.visible = v.dragging; }
      else { v.glow.visible = true; v.glow.tint = 0xfff2a0; v.glow.alpha = 1 - k; }
    } else if (v.dragging) {
      v.glow.alpha = 0.6 + 0.4 * pulse;
    }
    // Retour à la case (glisser annulé).
    if (v.returnT === -2) {
      // en attente du tick suivant
    } else if (v.returnT >= 0) {
      v.returnT += dt;
      const k = Math.min(1, v.returnT / 0.16);
      v.root.x += (v.rx - v.root.x) * k;
      v.root.y += (v.ry - v.root.y) * k;
      v.root.alpha = 1;
      if (k >= 1) { v.returnT = -1; v.root.zIndex = v.slot; v.root.position.set(v.rx, v.ry); }
    }
    v.root.alpha = v.dim ? 0.45 : v.returnT === -2 ? 0.7 : 1;
    if (v.statusKind) v.status.y = -50 + Math.sin(this.time * 5) * 4;
  }

  /** Appelé après chaque tick pour renvoyer une unité restée sur place après une fusion refusée. */
  settleDrops(): void {
    for (const v of this.units) if (v && v.returnT === -2) v.returnT = 0;
  }

  private renderEnemy(v: EnemyView, dt: number, t: number, d: number): void {
    const e = v.enemy;
    const tex = this.enemyTexture(v, t);
    if (tex && v.sprite.texture !== tex) {
      v.sprite.texture = tex;
      const w = v.width;
      v.sprite.width = w;
      v.sprite.height = (w * tex.height) / tex.width;
    }
    const sampler = this.lanes.get(v.lane) ?? this.lanes.get('a')!;
    const dir = sampler.dirX(d);
    // Marche : petit rebond pour les ennemis génériques (une seule image).
    const stunned = (e.effects.stunFor ?? 0) > 0;
    const bob = stunned ? 0 : v.kind === 'enemy' ? Math.abs(Math.sin((t + v.phase) * 9)) * 10 : 0;
    let sx = 1, sy = 1;
    if (v.kind === 'enemy' && !stunned) { const q = Math.sin((t + v.phase) * 18); sx = 1 + 0.04 * q; sy = 1 - 0.04 * q; }
    if (v.hitT >= 0) {
      v.hitT += dt;
      const k = v.hitT / 0.12;
      if (k >= 1) v.hitT = -1;
      else { sx *= 1 + 0.1 * Math.sin(k * Math.PI); sy *= 1 - 0.1 * Math.sin(k * Math.PI); }
    }
    if (v.powerT >= 0) { v.powerT += dt; if (v.powerT > 0.7) v.powerT = -1; }
    const baseW = v.sprite.texture.width || 1;
    const k = v.width / baseW;
    v.sprite.scale.set(k * sx * (dir < 0 ? -1 : 1), k * sy);
    v.sprite.y = -bob;
    v.root.position.set(v.x, v.y);
    v.root.zIndex = v.y;
    v.root.alpha = d < 0 ? Math.max(0, 1 + d * 2) : 1;
    // Teinte des effets : ralenti (bleu), brûlure (orange), marqué (rouge).
    const f = e.effects;
    v.sprite.tint = stunned ? 0xfff2a0 : (f.slowFor ?? 0) > 0 ? 0xa8d8ff : (f.burnFor ?? 0) > 0 ? 0xffb080 : (f.markedFor ?? 0) > 0 ? 0xff9a9a : 0xffffff;
    if (v.bar.visible) {
      const r = Math.max(0, Math.min(1, e.hp / e.maxHp));
      const bw = v.kind === 'giant' ? 150 : 80;
      v.bar.width = Math.max(1, bw * r);
      v.bar.tint = e.shieldHits > 0 ? 0x6fb6ff : e.armor > 0 ? 0xc9c9d6 : r > 0.5 ? 0x6ee04f : r > 0.25 ? 0xffc83a : 0xff4a3a;
      v.barBg.alpha = v.bar.alpha = r < 1 || v.kind === 'giant' ? 1 : 0.0;
    }
    // Chiffres regroupés : un chiffre toutes les 0,25 s par ennemi.
    v.dmgT += dt;
    if (v.dmgAcc > 0 && v.dmgT > 0.25) this.flushDamage(v);
  }

  /** Position écran logique d'un ennemi (pour l'interface). */
  enemyPos(uid: number): { x: number; y: number } | null {
    const v = this.enemies.get(uid);
    return v ? { x: v.x, y: v.y } : null;
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    window.removeEventListener('resize', this.onResize);
    this.ro?.disconnect();
    this.shots?.clear();
    this.parts?.clear();
    this.numbers?.clear();
    this.app.destroy({ removeView: true }, { children: true, texture: false, textureSource: false });
  }
}

function rarityColor(id: UnitId): number {
  const r = RARITY[id];
  return r === 'legendaire' ? 0xf2a93b : r === 'epique' ? 0x9b59e6 : 0x3c8bf0;
}
const RARITY: Record<string, string> = Object.fromEntries(Object.values(UNITS).map((u) => [u.id, u.rarity]));

/** Animation d'ambiance d'une map (mêmes règles que src/maps/preview.ts). */
function animate(a: AmbientAnim, s: Sprite, t: number): void {
  const ph = ((t / a.period + (a.phase ?? 0)) % 1 + 1) % 1;
  const sin = Math.sin(ph * Math.PI * 2);
  const ox = a.ox ?? a.box.x + a.box.w / 2, oy = a.oy ?? a.box.y + a.box.h / 2;
  switch (a.kind) {
    case 'drift': s.position.set(ox + (a.dx ?? 0) * ph, oy + (a.dy ?? 0) * ph); break;
    case 'bob': s.position.set(ox, oy + (a.amp ?? 6) * sin); break;
    case 'sway': s.rotation = ((a.amp ?? 8) * sin * Math.PI) / 180; break;
    case 'spin': s.rotation = ph * Math.PI * 2; break;
    case 'pulse': { const k = 1 + (a.amp ?? 0.1) * sin; s.scale.set((a.box.w / (s.texture.width || 1)) * k, (a.box.h / (s.texture.height || 1)) * k); break; }
    case 'blink': s.alpha = (a.min ?? 0.2) + (1 - (a.min ?? 0.2)) * (0.5 + 0.5 * sin); break;
  }
}
