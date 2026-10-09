// États visibles sur les ennemis : étourdi (étoiles qui tournent), ralenti (flocon + givre),
// brûlure (petites flammes), marqué (cible rouge), armure brisée (bouclier fêlé).
// Une petite vue par ennemi concerné, en réserve, rangée au-dessus des ennemis.
import { Container, Sprite } from 'pixi.js';
import type { EnemyInstance } from '../../engine';
import type { FxAtlas } from './atlas';

export interface StatusEnemy { x: number; y: number; width: number; enemy: EnemyInstance }

interface View {
  uid: number;
  root: Container;
  stars: Sprite[];
  flames: Sprite[];
  frost: Sprite;
  reticle: Sprite;
  armor: Sprite;
  seen: number;
  phase: number;
}

/** Rappel d'émission de particules d'ambiance (braises, givre) : x, y, type 0 = braise, 1 = givre. */
export type Ambient = (x: number, y: number, kind: 0 | 1, w: number) => void;

export class StatusFx {
  private readonly views = new Map<number, View>();
  private readonly pool: View[] = [];
  private frame = 0;
  private time = 0;
  private emberAcc = 0;

  constructor(private readonly layer: Container, private readonly tex: FxAtlas, private readonly ambient: Ambient) {}

  private take(uid: number): View {
    let v = this.pool.pop();
    if (!v) {
      const mk = (t: keyof FxAtlas) => { const s = new Sprite(this.tex[t]); s.anchor.set(0.5); return s; };
      const root = new Container();
      v = {
        uid, root,
        stars: [mk('stunStar'), mk('stunStar'), mk('stunStar')],
        flames: [mk('flame'), mk('flame')],
        frost: mk('snowflake'),
        reticle: mk('reticle'),
        armor: mk('crackShield'),
        seen: 0, phase: Math.random() * 6,
      };
      root.addChild(v.reticle, v.frost, ...v.flames, v.armor, ...v.stars);
      this.layer.addChild(root);
    }
    v.uid = uid;
    v.root.visible = true;
    this.views.set(uid, v);
    return v;
  }

  update(dt: number, enemies: Iterable<StatusEnemy>, q: number): void {
    this.frame++;
    this.time += dt;
    this.emberAcc += dt;
    const emit = this.emberAcc > 0.16 && q > 0.5;
    if (emit) this.emberAcc = 0;
    const t = this.time;
    for (const e of enemies) {
      const f = e.enemy.effects;
      const stun = (f.stunFor ?? 0) > 0;
      const slow = (f.slowFor ?? 0) > 0;
      const burn = (f.burnFor ?? 0) > 0;
      const mark = (f.markedFor ?? 0) > 0;
      const armor = (f.armorBreak ?? 0) > 0;
      let v = this.views.get(e.enemy.uid);
      if (!stun && !slow && !burn && !mark && !armor) {
        if (v) this.drop(v);
        continue;
      }
      if (!v) v = this.take(e.enemy.uid);
      v.seen = this.frame;
      const k = e.width / 118;
      const cx = e.x, cy = e.y - e.width * 0.35, head = e.y - e.width * 0.78;
      // Étourdi : trois étoiles en orbite au-dessus de la tête.
      for (let i = 0; i < 3; i++) {
        const s = v.stars[i]!;
        s.visible = stun;
        if (!stun) continue;
        const a = t * 6 + v.phase + (i * Math.PI * 2) / 3;
        s.position.set(cx + Math.cos(a) * 30 * k, head + Math.sin(a) * 9 * k);
        s.scale.set((0.85 + 0.25 * Math.sin(a)) * k);
        s.rotation = t * 4;
        s.alpha = 0.75 + 0.25 * Math.sin(a);
      }
      // Ralenti : flocon qui tourne au pied, givre.
      v.frost.visible = slow;
      if (slow) {
        v.frost.position.set(cx - e.width * 0.36, e.y - e.width * 0.12);
        v.frost.rotation = t * 1.5;
        v.frost.scale.set(0.9 * k);
        if (emit && Math.random() < 0.5) this.ambient(cx, cy, 1, e.width);
      }
      // Brûlure : deux flammes qui vacillent sur le corps, braises qui montent.
      for (let i = 0; i < 2; i++) {
        const s = v.flames[i]!;
        s.visible = burn;
        if (!burn) continue;
        const fl = Math.sin(t * 22 + i * 2 + v.phase);
        s.position.set(cx + (i ? 22 : -20) * k, cy + (i ? -2 : 8) * k);
        s.scale.set((0.62 + 0.06 * fl) * k, (0.7 + 0.12 * fl) * k);
        s.rotation = fl * 0.08;
      }
      if (burn && emit) this.ambient(cx + (Math.random() - 0.5) * e.width * 0.5, cy, 0, e.width);
      // Marqué : cible rouge qui tourne et respire.
      v.reticle.visible = mark;
      if (mark) {
        v.reticle.position.set(cx, cy);
        v.reticle.rotation = t * 1.8;
        v.reticle.scale.set((1.45 + 0.1 * Math.sin(t * 7)) * k);
        v.reticle.alpha = 0.85;
      }
      // Armure brisée : bouclier fêlé à droite de la barre de vie.
      v.armor.visible = armor;
      if (armor) {
        v.armor.position.set(cx + e.width * 0.5, e.y - e.width * 0.86);
        v.armor.scale.set(0.85 * Math.max(0.8, k));
      }
    }
    for (const v of this.views.values()) if (v.seen !== this.frame) this.drop(v);
  }

  private drop(v: View): void {
    v.root.visible = false;
    this.views.delete(v.uid);
    this.pool.push(v);
  }

  clear(): void {
    for (const v of [...this.views.values()]) this.drop(v);
  }
}
