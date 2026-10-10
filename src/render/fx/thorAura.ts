// Aura de l'Inquisiteur (Thor) sur le plateau : le jeton s'illumine en mode actif (1, 3, 5 ou 7 Thor),
// et prend la teinte de sa forme de chevalier (talent de palier 1) :
// - sans talent : lueur électrique blanc-bleu, seulement en mode actif ;
// - Chevalier de lumière : aura dorée, rayons sacrés, voile doré sur la figurine ;
// - Chevalier des ténèbres : aura violet-cramoisi, volutes de fumée sombre, voile violet.
// En mode actif, l'aura grossit, s'éclaire et pulse plus vite ; liseré lumineux sur la plaque de rang
// et petits arcs électriques avec étincelles. Fondu d'environ 200 ms aux changements de mode.
// Textures partagées (créées une fois), objets créés une fois par vue d'unité : aucune allocation par image.
import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { rankShape } from '../../art';
import type { ThorKnight, ThorMode } from '../../engine';

interface AuraTextures { glow: Texture; halo: Texture; rays: Texture; bolts: Texture[] }

let shared: AuraTextures | null = null;

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

function textures(): AuraTextures {
  if (shared) return shared;
  // Lueur : dégradé radial doux (blanc, teinté à l'usage).
  const [gc, g] = canvas(128, 128);
  const rg = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  rg.addColorStop(0, 'rgba(255,255,255,1)');
  rg.addColorStop(0.25, 'rgba(255,255,255,0.75)');
  rg.addColorStop(0.55, 'rgba(255,255,255,0.28)');
  rg.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = rg;
  g.fillRect(0, 0, 128, 128);
  // Halo : plateau large puis bord doux (seule la couronne déborde du jeton).
  const [hc, h] = canvas(128, 128);
  const hg = h.createRadialGradient(64, 64, 0, 64, 64, 64);
  hg.addColorStop(0, 'rgba(255,255,255,1)');
  hg.addColorStop(0.5, 'rgba(255,255,255,0.9)');
  hg.addColorStop(0.72, 'rgba(255,255,255,0.42)');
  hg.addColorStop(1, 'rgba(255,255,255,0)');
  h.fillStyle = hg;
  h.fillRect(0, 0, 128, 128);
  // Rayons sacrés : 12 pinceaux effilés, atténués vers l'extérieur.
  const [rc, r] = canvas(256, 256);
  r.translate(128, 128);
  for (let i = 0; i < 12; i++) {
    r.save();
    r.rotate((i / 12) * Math.PI * 2);
    const w = i % 2 ? 9 : 15;
    const len = i % 2 ? 104 : 126;
    const lg = r.createLinearGradient(0, 0, 0, -len);
    lg.addColorStop(0, 'rgba(255,255,255,0)');
    lg.addColorStop(0.3, 'rgba(255,255,255,0.9)');
    lg.addColorStop(1, 'rgba(255,255,255,0)');
    r.fillStyle = lg;
    r.beginPath();
    r.moveTo(-w, 0);
    r.lineTo(0, -len);
    r.lineTo(w, 0);
    r.closePath();
    r.fill();
    r.restore();
  }
  // Arcs électriques : 4 éclairs brisés (dessinés vers le haut, pied au centre bas).
  const bolts: Texture[] = [];
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let k = 0; k < 4; k++) {
    const [bc, b] = canvas(64, 128);
    const pts: [number, number][] = [[32, 124]];
    for (let s = 1; s <= 6; s++) pts.push([32 + (rnd() - 0.5) * 30, 124 - s * 19]);
    const stroke = (width: number, alpha: number, blur: number) => {
      b.strokeStyle = `rgba(255,255,255,${alpha})`;
      b.lineWidth = width;
      b.lineJoin = 'round';
      b.lineCap = 'round';
      b.shadowColor = 'rgba(255,255,255,1)';
      b.shadowBlur = blur;
      b.beginPath();
      pts.forEach(([x, y], i) => (i ? b.lineTo(x, y) : b.moveTo(x, y)));
      b.stroke();
    };
    stroke(9, 0.35, 10);
    stroke(4, 1, 6);
    // Petite fourche.
    const [fx, fy] = pts[3]!;
    b.beginPath();
    b.moveTo(fx, fy);
    b.lineTo(fx + (rnd() > 0.5 ? 16 : -16), fy - 22);
    b.lineWidth = 3;
    b.stroke();
    bolts.push(Texture.from(bc));
  }
  shared = { glow: Texture.from(gc), halo: Texture.from(hc), rays: Texture.from(rc), bolts };
  return shared;
}

interface Palette { halo: number; core: number; rays: number; rim: number; bolt: number; spark: number; veil: number; smoke: number }

const PAL: Record<'normal' | 'lumiere' | 'tenebres', Palette> = {
  normal: { halo: 0x3d9cff, core: 0xeaf7ff, rays: 0x6cc0ff, rim: 0xc4ecff, bolt: 0x2f8cff, spark: 0x4aa8ff, veil: 0x8fcfff, smoke: 0 },
  lumiere: { halo: 0xffb31a, core: 0xfff4c8, rays: 0xffc62e, rim: 0xffe7a0, bolt: 0xffa800, spark: 0xffc21a, veil: 0xffc94a, smoke: 0 },
  tenebres: { halo: 0x8a1fe0, core: 0xff2f68, rays: 0xb02cff, rim: 0xe08aff, bolt: 0xe0124f, spark: 0xd01a6a, veil: 0x8a2cff, smoke: 0x2a0636 },
};

/** Émetteur d'étincelles (coordonnées locales au jeton, couleur). */
export type SparkFn = (x: number, y: number, color: number) => void;

const SMOKE = 4;
const BOLTS = 2;

/**
 * Habillage lumineux d'une vue d'unité. `body` est le conteneur du jeton (plaque de rang + figurine) ;
 * `figure` la figurine, `plate` la plaque de rang (mêmes position et échelle sont reprises pour le liseré).
 */
export class ThorAura {
  private readonly back = new Container();
  private readonly halo: Sprite;
  private readonly core: Sprite;
  private readonly rays: Sprite;
  private readonly smoke: Sprite[] = [];
  private readonly rim = new Graphics();
  private readonly veil = new Sprite();
  private readonly front = new Container();
  private readonly bolts: Sprite[] = [];
  private readonly boltLife: number[] = [];
  private rimRank = -1;
  private uid = -1;
  private act = 0;
  private form = 0;
  private knight: ThorKnight = null;
  private phase = 0;
  private boltIn = 0.4;
  private time = 0;

  constructor(body: Container, private readonly figure: Sprite, plate: Graphics, private readonly size: number) {
    const tx = textures();
    const mk = (t: Texture, blend: 'add' | 'normal' = 'add') => {
      const s = new Sprite(t);
      s.anchor.set(0.5);
      s.blendMode = blend;
      return s;
    };
    // Halo et rayons en mélange normal (teinte saturée) : lisibles sur les cases claires du plateau
    // comme sur un décor sombre ; cœur et voile en lumière additive.
    this.halo = mk(tx.halo, 'normal');
    this.core = mk(tx.glow);
    this.rays = mk(tx.rays, 'normal');
    for (let i = 0; i < SMOKE; i++) this.smoke.push(mk(tx.glow, 'normal'));
    this.back.addChild(this.rays, this.halo, ...this.smoke, this.core);
    this.back.position.copyFrom(figure.position);
    this.rim.position.copyFrom(plate.position);
    this.rim.scale.copyFrom(plate.scale);
    this.rim.blendMode = 'add';
    this.veil.anchor.set(0.5);
    this.veil.blendMode = 'add';
    this.veil.position.copyFrom(figure.position);
    for (let i = 0; i < BOLTS; i++) {
      const b = new Sprite(tx.bolts[i]!);
      b.anchor.set(0.5, 1);
      b.visible = false;
      this.bolts.push(b);
      this.boltLife.push(-1);
    }
    this.front.position.copyFrom(figure.position);
    this.front.addChild(...this.bolts);
    // Ordre : aura derrière la plaque ; liseré sur la plaque ; voile et arcs devant la figurine.
    body.addChildAt(this.back, 0);
    body.addChildAt(this.rim, body.getChildIndex(plate) + 1);
    body.addChildAt(this.veil, body.getChildIndex(figure) + 1);
    body.addChild(this.front);
    this.hide();
  }

  private hide(): void {
    this.back.visible = false;
    this.rim.visible = false;
    this.veil.visible = false;
    this.front.visible = false;
  }

  private drawRim(rank: number): void {
    const g = this.rim;
    g.clear();
    this.rimRank = rank;
    if (rank <= 0) return;
    const sh = rankShape(rank, 100, 100, 96);
    const path = () => {
      if (sh.kind === 'circle') g.circle(sh.cx, sh.cy, sh.r);
      else if (sh.kind === 'lens') {
        g.moveTo(sh.cx - sh.r, sh.cy)
          .quadraticCurveTo(sh.cx, sh.cy - sh.bulge, sh.cx + sh.r, sh.cy)
          .quadraticCurveTo(sh.cx, sh.cy + sh.bulge, sh.cx - sh.r, sh.cy)
          .closePath();
      } else g.poly(sh.points.flat(), true);
    };
    path();
    g.stroke({ color: 0xffffff, width: 26, alpha: 0.22, join: 'round' });
    path();
    g.stroke({ color: 0xffffff, width: 14, alpha: 0.35, join: 'round' });
    path();
    g.stroke({ color: 0xffffff, width: 5, alpha: 0.95, join: 'round' });
  }

  /**
   * Une image. `mode` : état de l'Inquisiteur (`null` si l'unité n'en est pas un) ; `uid` : unité affichée
   * (une autre unité dans la même vue repart de zéro) ; `rank` : plaque affichée.
   */
  update(dt: number, uid: number, mode: ThorMode | null, rank: number, spark: SparkFn): void {
    if (uid !== this.uid) { this.uid = uid; this.act = 0; this.form = 0; this.knight = null; this.boltIn = 0.3; }
    const ta = mode?.active ? 1 : 0;
    const tf = mode?.knight ? 1 : 0;
    if (mode?.knight) this.knight = mode.knight;
    const step = dt / 0.2;
    this.act += Math.max(-step, Math.min(step, ta - this.act));
    this.form += Math.max(-step, Math.min(step, tf - this.form));
    const a = this.act, f = this.form;
    if (a < 0.005 && f < 0.005) {
      if (this.back.visible) this.hide();
      if (!mode?.knight) this.knight = null;
      return;
    }
    this.back.visible = true;
    this.rim.visible = true;
    this.veil.visible = true;
    this.front.visible = true;
    this.time += dt;
    const kn = this.knight;
    const pal = PAL[kn ?? 'normal'];
    const T = this.size;
    // Pouls : lent en forme seule, rapide en mode actif (plus encore en chevalier actif).
    this.phase += dt * (2.4 + 4.6 * a + 2.2 * a * f);
    const p = 0.5 + 0.5 * Math.sin(this.phase);

    // Halo et cœur lumineux derrière la figurine.
    const amp = 0.04 + 0.07 * a;
    const hs = ((1.4 + 0.22 * f + 0.3 * a + 0.12 * a * f) * T / 128) * (1 - amp + 2 * amp * p);
    this.halo.scale.set(hs);
    this.halo.tint = pal.halo;
    this.halo.alpha = Math.max(0.58 * f, a * (0.7 + 0.2 * f)) * (0.8 + 0.2 * p);
    this.core.scale.set(((0.72 + 0.22 * a + 0.12 * a * f) * T / 128) * (0.95 + 0.1 * p));
    this.core.tint = pal.core;
    this.core.alpha = Math.min(1, 0.25 * f + a * (0.6 + 0.4 * p));

    // Halo : plateau large puis bord doux (seule la couronne déborde du jeton).
  const [hc, h] = canvas(128, 128);
  const hg = h.createRadialGradient(64, 64, 0, 64, 64, 64);
  hg.addColorStop(0, 'rgba(255,255,255,1)');
  hg.addColorStop(0.5, 'rgba(255,255,255,0.9)');
  hg.addColorStop(0.72, 'rgba(255,255,255,0.42)');
  hg.addColorStop(1, 'rgba(255,255,255,0)');
  h.fillStyle = hg;
  h.fillRect(0, 0, 128, 128);
  // Rayons sacrés (lumière) ; rayons cramoisis discrets (ténèbres) ; rayons fins en mode actif seul.
    const rayA = kn === 'lumiere' ? f * (0.5 + 0.45 * a) : kn === 'tenebres' ? f * 0.25 * a : 0.3 * a;
    this.rays.visible = rayA > 0.01;
    if (this.rays.visible) {
      this.rays.tint = pal.rays;
      this.rays.alpha = rayA * (0.8 + 0.2 * p);
      this.rays.rotation += dt * (0.25 + 0.75 * a) * (kn === 'tenebres' ? -1 : 1);
      this.rays.scale.set(((1.05 + 0.3 * a + 0.15 * a * f) * T) / 256);
    }

    // Fumée sombre qui monte (ténèbres).
    const smokeOn = kn === 'tenebres' && f > 0.01;
    for (let i = 0; i < SMOKE; i++) {
      const s = this.smoke[i]!;
      s.visible = smokeOn;
      if (!smokeOn) continue;
      const u = (this.time * (0.32 + 0.3 * a) + i / SMOKE) % 1;
      s.position.set(Math.sin(i * 2.4 + this.time * 0.9) * T * 0.44, T * 0.3 - u * T * 0.85);
      s.scale.set(((0.3 + 0.45 * u) * T) / 128);
      s.tint = i % 2 ? pal.smoke : 0x5a0f3a;
      s.alpha = Math.sin(u * Math.PI) * f * (0.75 + 0.25 * a);
    }

    // Liseré lumineux sur la plaque de rang.
    if (rank !== this.rimRank) this.drawRim(rank);
    this.rim.tint = pal.rim;
    this.rim.alpha = Math.max(0.42 * f, a * (0.6 + 0.4 * p));

    // Voile coloré sur la figurine (même texture, en lumière additive).
    const fig = this.figure;
    if (this.veil.texture !== fig.texture) this.veil.texture = fig.texture;
    this.veil.width = fig.width;
    this.veil.height = fig.height;
    // Ténèbres : lavis violet (mélange normal, assombrit) ; lumière et mode actif seul : éclaircissement doré / bleuté.
    const veilBlend = kn === 'tenebres' ? 'normal' : 'add';
    if (this.veil.blendMode !== veilBlend) this.veil.blendMode = veilBlend;
    this.veil.tint = pal.veil;
    this.veil.alpha = kn === 'tenebres' ? f * (0.3 + 0.08 * a + 0.05 * a * p) : kn ? f * (0.3 + 0.12 * a + 0.08 * a * p) : a * (0.1 + 0.06 * p);

    // Arcs électriques et étincelles, de temps en temps, en mode actif.
    for (let i = 0; i < BOLTS; i++) {
      const b = this.bolts[i]!;
      if (this.boltLife[i]! < 0) continue;
      this.boltLife[i]! += dt;
      const k = this.boltLife[i]! / 0.16;
      if (k >= 1) { this.boltLife[i] = -1; b.visible = false; continue; }
      b.alpha = a * (k < 0.25 ? 1 : 1 - (k - 0.25) / 0.75);
    }
    if (a > 0.5) {
      this.boltIn -= dt;
      if (this.boltIn <= 0) {
        this.boltIn = (f > 0.5 ? 0.3 : 0.55) + Math.random() * (f > 0.5 ? 0.45 : 0.8);
        const i = this.boltLife[0]! < 0 ? 0 : 1;
        const b = this.bolts[i]!;
        const ang = Math.random() * Math.PI * 2;
        const r0 = T * 0.2;
        b.texture = textures().bolts[(Math.random() * 4) | 0]!;
        b.position.set(Math.cos(ang) * r0, Math.sin(ang) * r0);
        b.rotation = ang + Math.PI / 2;
        b.scale.set((T / 128) * (0.42 + Math.random() * 0.22) * (Math.random() < 0.5 ? -1 : 1), (T / 128) * (0.38 + Math.random() * 0.2));
        b.tint = pal.bolt;
        b.visible = true;
        this.boltLife[i] = 0;
        const tipR = T * 0.52;
        const tx = Math.cos(ang) * tipR + this.front.x, ty = Math.sin(ang) * tipR + this.front.y;
        for (let s = 0; s < 3; s++) spark(tx, ty, pal.spark);
      }
    }
  }
}
