// Signatures visuelles des 15 héros Pixar (extension Pixar) : un tir et un impact par héros, une variante pour le
// « coup de duo » (le partenaire frappe : Flèche, Martin, Linguini, EVE, Pile-Poil, 22…) et les compétences.
// Appelées depuis signatures.ts (playAttack, playAbility), avec les mêmes primitives de CombatFx.
import type { UnitId } from '../../data/types';
import type { CombatFx, P } from './director';
import { BeamMode, Curve, type Mote } from './pools';

const fxOf = (m: Mote) => m.o as CombatFx;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

// ---------------------------------------------------------------- impacts

function hitPop(m: Mote): void {
  const fx = fxOf(m);
  fx.pop(m.x, m.y, m.color, 0.9, 0.22);
  fx.sparks(m.x, m.y, m.color, fx.n(5), 340, 0.6);
}
function hitHeavy(m: Mote): void {
  const fx = fxOf(m);
  fx.pop(m.x, m.y, m.color, 1.3, 0.28);
  fx.ring(m.x, m.y, m.color, 70, 0.3);
  fx.debris(m.x, m.y, 'shard', 0xc8a070, fx.n(4), 380, 0.6);
  fx.host.shake(3, 0.12);
}
function hitIce(m: Mote): void {
  const fx = fxOf(m);
  fx.pop(m.x, m.y, 0xc8f0ff, 1, 0.24);
  fx.debris(m.x, m.y, 'snowflake', 0xc8f0ff, fx.n(4), 260, 0.6, 0.5);
}
function hitSplash(m: Mote): void {
  const fx = fxOf(m);
  fx.pop(m.x, m.y, m.color, 1.1, 0.26);
  fx.debris(m.x, m.y, 'drop', m.color, fx.n(5), 300, 0.7, 0.5);
}
function hitDuo(m: Mote): void {
  const fx = fxOf(m);
  fx.pop(m.x, m.y, 0xffffff, 1.2, 0.24);
  fx.ring(m.x, m.y, m.color, 60, 0.28);
  const s = fx.put('starInk', m.x, m.y - 30, 0.4);
  s.s.tint = m.color; s.curve = Curve.Pop; s.s0 = 0.4; s.s1 = 1; s.spin = 3;
}
function hitPoison(m: Mote): void {
  const fx = fxOf(m);
  fx.pop(m.x, m.y, m.color, 0.9, 0.22);
  fx.puffs(m.x, m.y, 0x6a8ae0, fx.n(3), 0.6, 100, 0.5);
}

// ---------------------------------------------------------------- attaques

/** Attaque d'un héros Pixar (`name` : partie après « unité: » de l'effet). Renvoie false si l'unité n'est pas Pixar. */
export function playPxAttack(fx: CombatFx, slot: number, unit: UnitId, name: string, targets: readonly number[], o: P, b0: P, t0: number, col: number): boolean {
  const duo = name === 'duo';
  switch (unit) {
    case 'mrincredible': {
      const m = fx.shot('fist', o, t0, fx.travel(o, b0, 2000, 0.1, 0.32), hitHeavy, 0xffb347);
      m.face = true; m.s0 = 0.9; m.s1 = 1.3; m.s.tint = 0x2b2838;
      return true;
    }
    case 'elastigirl':
      fx.beam(o, b0, 0xd8322c, 16, 0.16, BeamMode.Flash, t0, 0);
      fx.later(t0, 0.04, hitPop, 0xff8a6a);
      return true;
    case 'frozone': {
      fx.beam(o, b0, 0xc8f0ff, 12, 0.18, BeamMode.Flash, t0, 0);
      fx.later(t0, 0.04, hitIce, 0xc8f0ff);
      return true;
    }
    case 'violetflash': {
      if (duo) {
        for (let k = 0; k < 3; k++) fx.later(t0, 0.03 + k * 0.06, hitPop, 0xffd84a);
        fx.beam(o, b0, 0xffd84a, 8, 0.12, BeamMode.Flash, t0, 0);
        return true;
      }
      const m = fx.shot('photon', o, t0, fx.travel(o, b0, 2400), hitPop, 0xb08aff);
      m.face = true; m.s.tint = 0xb08aff;
      return true;
    }
    case 'sullimike': {
      fx.later(t0, 0.03, (m) => { const f = fxOf(m); const c = f.put('claw', m.x, m.y, 0.25); c.s.tint = 0x4ab8e8; c.curve = Curve.Pop; c.s0 = 0.6; c.s1 = 1.2; hitPop(m); }, 0x4ab8e8);
      return true;
    }
    case 'mcqueen': {
      if (duo) {
        fx.beam(o, b0, 0xa8643a, 6, 0.3, BeamMode.Flash, t0, 0);
        const h = fx.shot('hook', o, t0, fx.travel(o, b0, 1800), hitHeavy, 0xa8643a);
        h.s.tint = 0x8a7a6a;
        return true;
      }
      fx.beam(o, b0, 0xe8282c, 18, 0.12, BeamMode.Flash, t0, 0);
      fx.later(t0, 0.03, hitPop, 0xffd23f);
      return true;
    }
    case 'carlrussell': {
      const m = fx.shot('dotInk', o, t0, fx.travel(o, b0, 1800, 0.12, 0.36), hitPop, 0x9a6a3a);
      m.s.tint = 0x9a6a3a; m.arc = 30;
      return true;
    }
    case 'joysadness': {
      const gold = !duo || Math.random() < 0.5;
      const m = fx.shot('bubble', o, t0, fx.travel(o, b0, 1900), duo ? hitDuo : hitPoison, gold ? 0xffd23f : 0x6a8ae0);
      m.s.tint = gold ? 0xffd23f : 0x7ab0f0; m.wob = 10; m.wobF = 2;
      return true;
    }
    case 'remy': {
      if (duo) {
        const m = fx.shot('pan', o, t0, fx.travel(o, b0, 1500, 0.2, 0.4), hitSplash, 0xe8a03a);
        m.arc = 70; m.spin = 8;
        targets.slice(1).forEach((t, i) => fx.later(t, 0.32 + i * 0.03, hitSplash, 0xe8a03a));
        return true;
      }
      const m = fx.shot('drop', o, t0, fx.travel(o, b0, 2000), hitSplash, 0xe86a3a);
      m.s.tint = 0xe86a3a; m.arc = 40;
      return true;
    }
    case 'walleeve': {
      if (duo) {
        fx.beam(o, b0, 0x5ad8ff, 22, 0.24, BeamMode.Flash, t0, 20);
        targets.forEach((t, i) => fx.later(t, 0.05 + i * 0.02, hitHeavy, 0x5ad8ff));
        fx.host.flash(0.06, 0.12, 0x5ad8ff);
        return true;
      }
      const m = fx.shot('square', o, t0, fx.travel(o, b0, 1700, 0.15, 0.38), hitHeavy, 0xe8b03a);
      m.arc = 60; m.spin = 6; m.s.tint = 0xa8885a;
      return true;
    }
    case 'lucaalberto': {
      if (duo) {
        const w = fx.shot('wave', o, t0, fx.travel(o, b0, 1600, 0.15, 0.4), hitSplash, 0x5ab8ff);
        w.s.tint = 0x5ab8ff; w.s0 = 0.5; w.s1 = 1;
        return true;
      }
      const m = fx.shot('drop', o, t0, fx.travel(o, b0, 2200), hitSplash, 0x4ac8b0);
      m.s.tint = 0x4ac8b0;
      return true;
    }
    case 'mei': {
      fx.later(t0, 0.03, (m) => { const f = fxOf(m); const p = f.put('paw', m.x, m.y, 0.3); p.s.tint = 0xd8582a; p.curve = Curve.Pop; p.s0 = 0.7; p.s1 = 1.4; hitHeavy(m); }, 0xff8a5a);
      targets.slice(1).forEach((t, i) => fx.later(t, 0.08 + i * 0.02, hitPop, 0xff8a5a));
      return true;
    }
    case 'jessie': {
      const m = fx.shot('lasso', o, t0, fx.travel(o, b0, 1900), duo ? hitHeavy : hitPop, 0xe8c070);
      m.spin = 6; m.s.tint = 0xe8c070;
      return true;
    }
    case 'ianbarley': {
      const m = fx.shot('starInk', o, t0, fx.travel(o, b0, 2200), hitPop, 0xffb83a);
      m.s.tint = 0xffb83a; m.spin = 8; m.wob = 8;
      return true;
    }
    case 'joe': {
      const m = fx.shot('note', o, t0, fx.travel(o, b0, 2000), duo ? hitDuo : hitPop, duo ? 0x8af0ff : 0xffd23f);
      m.s.tint = duo ? 0x8af0ff : 0xffd23f; m.wob = 14; m.wobF = 2;
      return true;
    }
    default:
      void col; void slot; void rnd;
      return false;
  }
}

// ---------------------------------------------------------------- compétences

/** Compétences des héros Pixar. Renvoie false si rien n'est propre à l'extension. */
export function playPxAbility(fx: CombatFx, slot: number, unit: UnitId, name: string, targets: readonly number[], col: number): boolean {
  const c = fx.host.cell(slot);
  const each = (end: (m: Mote) => void, color: number, d = 0.1) => targets.forEach((t, i) => fx.later(t, d + i * 0.02, end, color));
  switch (name) {
    case 'Coup de poing sismique':
      fx.ring(c.x, c.y, 0xffb347, 160, 0.4);
      each(hitHeavy, 0xffb347);
      fx.host.shake(6, 0.25);
      return true;
    case 'Pont de glace':
      each(hitIce, 0xc8f0ff, 0.08);
      fx.glow(c.x, c.y, 0xc8f0ff, 2.4, 0.4);
      return true;
    case 'Rugissement':
      fx.ring(c.x, c.y, 0x4ab8e8, 200, 0.45);
      fx.ring(c.x, c.y, 0x8a4ac8, 140, 0.35);
      each(hitPop, 0x4ab8e8, 0.12);
      fx.host.shake(4, 0.2);
      return true;
    case 'Ballons':
      fx.glow(c.x, c.y, 0xff5a6a, 2, 0.4);
      fx.debris(c.x, c.y, 'bubble', 0xffd23f, fx.n(6), 220, 0.7, 0.6);
      each(hitPop, 0xff5a6a);
      return true;
    case 'Boule de feu':
      fx.glow(c.x, c.y, 0xff6a3a, 2, 0.3);
      each((m) => { const f = fxOf(m); f.pop(m.x, m.y, 0xff6a3a, 1.4, 0.3); f.put('fireball', m.x, m.y, 0.3); }, 0xff6a3a);
      return true;
    case 'Arrêt du temps':
      fx.host.flash(0.1, 0.2, 0xc8b0ff);
      each(hitDuo, 0xc8b0ff, 0.05);
      return true;
    case 'Sort de croissance':
    case 'Musique de l’âme':
    case 'Souvenir doré':
      fx.ring(c.x, c.y, name === 'Musique de l’âme' ? 0x8af0d8 : 0xffd23f, 150, 0.5);
      fx.glow(c.x, c.y, col, 2.6, 0.45);
      fx.debris(c.x, c.y, 'note', col, fx.n(name === 'Musique de l’âme' ? 6 : 2), 240, 0.7, 0.6);
      return true;
    case 'Souvenir bleu':
      each(hitPoison, 0x6a8ae0, 0.05);
      return true;
    case 'Rayon arcanique':
      targets.forEach((t, i) => { const b = fx.body(t); if (b) fx.beam(c, b, 0xffb83a, 10, 0.18, BeamMode.Flash, t, 0, true, i * 0.05); fx.later(t, 0.05 + i * 0.05, hitPop, 0xffb83a); });
      return true;
    case 'Champ de force':
      fx.ring(c.x, c.y, 0xb08aff, 100, 0.45);
      fx.glow(c.x, c.y, 0xb08aff, 2.4, 0.45);
      return true;
    case 'Souvenirs':
      fx.glow(c.x, c.y, 0xffd23f, 2.4, 0.4);
      fx.sparks(c.x, c.y, 0x7ab0f0, fx.n(6), 240, 0.6);
      return true;
    case 'Recette':
      fx.glow(c.x, c.y, 0xe8a03a, 2, 0.35);
      return true;
    default:
      void unit;
      return false;
  }
}
