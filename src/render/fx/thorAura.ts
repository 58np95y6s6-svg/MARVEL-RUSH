// Lueur de l'Inquisiteur (Thor) sur le plateau : c'est LA FIGURINE qui s'illumine (la plaque de rang ne bouge pas).
// - mode actif (1, 3, 5 ou 7 Thor), sans talent : lueur jaune doré ;
// - Chevalier de lumière (talent de palier 1) : lueur bleu ciel électrique ;
// - Chevalier des ténèbres : lueur rouge cramoisi profond, volutes de fumée sombre.
// Une forme de chevalier luit déjà hors mode actif ; le mode actif l'intensifie (plus large, plus vive,
// pouls plus rapide). Lueur = copie de la silhouette de la figurine, derrière elle, floutée et colorée
// (filtres partagés par toutes les vues) ; voile lumineux sur la figurine ; petits éclairs et étincelles
// partant du contour. Fondu d'environ 200 ms aux changements de mode.
// Textures et filtres partagés (créés une fois), objets créés une fois par vue : aucune allocation par image.
import { BlurFilter, ColorMatrixFilter, Container, Sprite, Texture, type Filter } from 'pixi.js';
import type { ThorKnight, ThorMode } from '../../engine';

type Look = 'normal' | 'lumiere' | 'tenebres';

interface Palette { glow: number; veil: number; bolt: number; spark: number; smoke: number }

const PAL: Record<Look, Palette> = {
  normal: { glow: 0xffc21a, veil: 0xffd84a, bolt: 0xffb000, spark: 0xffc400, smoke: 0 },
  lumiere: { glow: 0x2a9dff, veil: 0x6cc4ff, bolt: 0x1f8fff, spark: 0x3aa8ff, smoke: 0 },
  tenebres: { glow: 0xd0102e, veil: 0xc0142e, bolt: 0xe0102a, spark: 0xd8182e, smoke: 0x2a0610 },
};

interface Shared { puff: Texture; bolts: Texture[]; filters: Record<Look, Filter[]> }

let shared: Shared | null = null;

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

/** Silhouette floutée → couleur pleine de la palette, alpha renforcé (contour de lueur bien lisible). */
function solid(color: number): ColorMatrixFilter {
  const f = new ColorMatrixFilter();
  const r = ((color >> 16) & 255) / 255, g = ((color >> 8) & 255) / 255, b = (color & 255) / 255;
  f.matrix = [0, 0, 0, 0, r, 0, 0, 0, 0, g, 0, 0, 0, 0, b, 0, 0, 0, 2.2, 0];
  return f;
}

function res(): Shared {
  if (shared) return shared;
  // Bouffée de fumée : dégradé radial doux.
  const [pc, p] = canvas(64, 64);
  const rg = p.createRadialGradient(32, 32, 0, 32, 32, 32);
  rg.addColorStop(0, 'rgba(255,255,255,1)');
  rg.addColorStop(0.45, 'rgba(255,255,255,0.55)');
  rg.addColorStop(1, 'rgba(255,255,255,0)');
  p.fillStyle = rg;
  p.fillRect(0, 0, 64, 64);
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
    const [fx, fy] = pts[3]!;
    b.beginPath();
    b.moveTo(fx, fy);
    b.lineTo(fx + (rnd() > 0.5 ? 16 : -16), fy - 22);
    b.lineWidth = 3;
    b.stroke();
    bolts.push(Texture.from(bc));
  }
  const blur = new BlurFilter({ strength: 5, quality: 2 });
  shared = {
    puff: Texture.from(pc),
    bolts,
    filters: { normal: [blur, solid(PAL.normal.glow)], lumiere: [blur, solid(PAL.lumiere.glow)], tenebres: [blur, solid(PAL.tenebres.glow)] },
  };
  return shared;
}

/** Émetteur d'étincelles (coordonnées locales au conteneur du jeton, couleur). */
export type SparkFn = (x: number, y: number, color: number) => void;

const SMOKE = 4;
const BOLTS = 2;

/**
 * Lueur d'une vue d'unité. `body` : conteneur du jeton (plaque de rang + figurine) ; `figure` : la figurine.
 * La lueur se glisse juste derrière la figurine, donc devant la plaque, qui reste intacte.
 */
export class ThorAura {
  private readonly glowBox = new Container();
  private readonly glowOuter = new Sprite();
  private readonly glowInner = new Sprite();
  private readonly smokeBox = new Container();
  private readonly smoke: Sprite[] = [];
  private readonly veil = new Sprite();
  private readonly front = new Container();
  private readonly bolts: Sprite[] = [];
  private readonly boltLife: number[] = [];
  private look: Look | null = null;
  private uid = -1;
  private act = 0;
  private form = 0;
  private knight: ThorKnight = null;
  private phase = 0;
  private boltIn = 0.4;
  private time = 0;

  constructor(body: Container, private readonly figure: Sprite, private readonly size: number) {
    const r = res();
    this.glowOuter.anchor.set(0.5);
    this.glowInner.anchor.set(0.5);
    this.veil.anchor.set(0.5);
    this.glowBox.addChild(this.glowOuter, this.glowInner);
    this.glowBox.position.copyFrom(figure.position);
    for (let i = 0; i < SMOKE; i++) {
      const s = new Sprite(r.puff);
      s.anchor.set(0.5);
      this.smoke.push(s);
    }
    this.smokeBox.addChild(...this.smoke);
    this.smokeBox.position.copyFrom(figure.position);
    this.veil.position.copyFrom(figure.position);
    for (let i = 0; i < BOLTS; i++) {
      const b = new Sprite(r.bolts[i]!);
      b.anchor.set(0.5, 1);
      b.visible = false;
      this.bolts.push(b);
      this.boltLife.push(-1);
    }
    this.front.position.copyFrom(figure.position);
    this.front.addChild(...this.bolts);
    // Ordre : fumée et lueur juste derrière la figurine (devant la plaque) ; voile et éclairs devant.
    const at = body.getChildIndex(figure);
    body.addChildAt(this.glowBox, at);
    body.addChildAt(this.smokeBox, at);
    body.addChildAt(this.veil, body.getChildIndex(figure) + 1);
    body.addChild(this.front);
    this.hide();
  }

  private hide(): void {
    this.glowBox.visible = false;
    this.smokeBox.visible = false;
    this.veil.visible = false;
    this.front.visible = false;
  }

  /**
   * Une image. `mode` : état de l'Inquisiteur (`null` si l'unité n'en est pas un) ; `uid` : unité affichée
   * (une autre unité dans la même vue repart de zéro).
   */
  update(dt: number, uid: number, mode: ThorMode | null, spark: SparkFn): void {
    if (uid !== this.uid) { this.uid = uid; this.act = 0; this.form = 0; this.knight = null; this.boltIn = 0.3; }
    const ta = mode?.active ? 1 : 0;
    const tf = mode?.knight ? 1 : 0;
    if (mode?.knight) this.knight = mode.knight;
    const step = dt / 0.2;
    this.act += Math.max(-step, Math.min(step, ta - this.act));
    this.form += Math.max(-step, Math.min(step, tf - this.form));
    const a = this.act, f = this.form;
    if (a < 0.005 && f < 0.005) {
      if (this.glowBox.visible) this.hide();
      if (!mode?.knight) this.knight = null;
      return;
    }
    this.glowBox.visible = true;
    this.veil.visible = true;
    this.front.visible = true;
    this.time += dt;
    const kn = this.knight;
    const look: Look = kn ?? 'normal';
    const pal = PAL[look];
    if (look !== this.look) { this.look = look; this.glowBox.filters = res().filters[look]; }
    const T = this.size;
    // Pouls : lent en forme seule, rapide en mode actif (plus encore en chevalier actif).
    this.phase += dt * (2.4 + 4.6 * a + 2.2 * a * f);
    const p = 0.5 + 0.5 * Math.sin(this.phase);

    // Lueur épousant la silhouette : deux copies (large et serrée) floutées et colorées.
    const fig = this.figure;
    const tex = fig.texture;
    const fw = fig.width, fh = fig.height;
    const outer = 1.05 + 0.02 * f + 0.04 * a + 0.03 * a * f + (0.01 + 0.025 * a) * p;
    if (this.glowOuter.texture !== tex) { this.glowOuter.texture = tex; this.glowInner.texture = tex; this.veil.texture = tex; }
    this.glowOuter.width = fw * outer;
    this.glowOuter.height = fh * outer;
    this.glowInner.width = fw * 1.03;
    this.glowInner.height = fh * 1.03;
    this.glowOuter.alpha = 0.55 + 0.45 * Math.max(a, f * 0.6);
    this.glowBox.alpha = Math.min(1, Math.max(0.7 * f, a * (0.85 + 0.15 * f))) * (0.72 + 0.28 * p);

    // Voile lumineux sur la figurine (même texture) : éclaircissement coloré, rouge sombre pour les ténèbres.
    const veilBlend = kn === 'tenebres' ? 'normal' : 'add';
    if (this.veil.blendMode !== veilBlend) this.veil.blendMode = veilBlend;
    this.veil.width = fw;
    this.veil.height = fh;
    this.veil.tint = pal.veil;
    this.veil.alpha = kn === 'tenebres' ? f * (0.14 + 0.06 * a + 0.05 * a * p) : kn ? f * (0.3 + 0.12 * a + 0.1 * a * p) : a * (0.2 + 0.12 * p);

    // Fumée sombre qui monte des épaules (ténèbres).
    const smokeOn = kn === 'tenebres' && f > 0.01;
    this.smokeBox.visible = smokeOn;
    if (smokeOn) {
      for (let i = 0; i < SMOKE; i++) {
        const s = this.smoke[i]!;
        const u = (this.time * (0.32 + 0.3 * a) + i / SMOKE) % 1;
        const side = i % 2 ? 1 : -1;
        s.position.set(side * T * (0.2 + 0.12 * u) + Math.sin(i * 2.4 + this.time * 1.3) * T * 0.05, -T * 0.05 - u * T * 0.55);
        s.scale.set(((0.28 + 0.4 * u) * T) / 64);
        s.tint = i % 2 ? pal.smoke : 0x4a0a14;
        s.alpha = Math.sin(u * Math.PI) * f * (0.6 + 0.3 * a);
      }
    }

    // Éclairs et étincelles partant du contour de la figurine, en mode actif.
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
        // Point du contour (ellipse de la silhouette), éclair dirigé vers l'extérieur.
        const ang = Math.random() * Math.PI * 2;
        const ox = Math.cos(ang) * T * 0.3, oy = Math.sin(ang) * T * 0.36;
        const len = 0.22 + Math.random() * 0.14;
        b.texture = res().bolts[(Math.random() * 4) | 0]!;
        b.position.set(ox, oy);
        b.rotation = ang + Math.PI / 2;
        b.scale.set((T / 128) * 0.4 * (Math.random() < 0.5 ? -1 : 1), (T / 128) * len);
        b.tint = pal.bolt;
        b.visible = true;
        this.boltLife[i] = 0;
        const tip = T * len;
        const tx = ox + Math.cos(ang) * tip + this.front.x, ty = oy + Math.sin(ang) * tip + this.front.y;
        for (let s = 0; s < 3; s++) spark(tx, ty, pal.spark);
      }
    }
  }
}
