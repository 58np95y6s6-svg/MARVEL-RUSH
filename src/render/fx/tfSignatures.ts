// Signatures visuelles des 15 Autobots (extension Transformers) : un tir et un impact par mode (robot et
// véhicule), la transformation (éclat, pièces qui volent, anneau) et les compétences. Appelées depuis
// signatures.ts (playAttack, playAbility), avec les mêmes primitives de CombatFx.
import type { UnitId } from '../../data/types';
import type { CombatFx, P } from './director';
import { BeamMode, Curve, type Mote } from './pools';

const fxOf = (m: Mote) => m.o as CombatFx;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

// ---------------------------------------------------------------- impacts

function hitBlast(m: Mote): void {
  const fx = fxOf(m);
  fx.pop(m.x, m.y, m.color, 0.9, 0.22);
  fx.sparks(m.x, m.y, m.color, fx.n(5), 360, 0.6);
}
function hitHeavy(m: Mote): void {
  const fx = fxOf(m);
  fx.pop(m.x, m.y, m.color, 1.3, 0.28);
  fx.ring(m.x, m.y, m.color, 70, 0.3);
  fx.debris(m.x, m.y, 'shard', 0xb8bdcc, fx.n(4), 380, 0.6);
  fx.host.shake(3, 0.12);
}
function hitFlame(m: Mote): void {
  const fx = fxOf(m);
  fx.pop(m.x, m.y, 0xff8a2a, 1, 0.24);
  fx.puffs(m.x, m.y, 0x5a4a4a, fx.n(3), 0.7, 140, 0.5);
  for (let i = 0; i < fx.n(4); i++) {
    const f = fx.put('flame', m.x + rnd(-24, 24), m.y + rnd(-10, 14), 0.45);
    f.vy = rnd(-120, -60); f.s0 = 0.6; f.s1 = 0.2;
  }
}
function hitSlash(m: Mote): void {
  const fx = fxOf(m);
  const s = fx.put('slash', m.x, m.y, 0.22);
  s.s.tint = m.color; s.rot = rnd(-0.8, 0.8); s.curve = Curve.Pop; s.s0 = 0.5; s.s1 = 1.2;
  fx.sparks(m.x, m.y, 0xffffff, fx.n(4), 300, 0.5);
}
function hitMark(m: Mote): void {
  const fx = fxOf(m);
  const r = fx.put('reticle', m.x, m.y, 0.6);
  r.s.tint = m.color; r.curve = Curve.Out; r.s0 = 1.6; r.s1 = 0.9; r.spin = 2; r.fout = 0.5;
  fx.pop(m.x, m.y, m.color, 0.7, 0.2);
}

// ---------------------------------------------------------------- attaques

/** Attaque d'un Autobot (`name` : partie après « unité: » de l'effet). Renvoie false si l'unité n'est pas un Autobot. */
export function playTfAttack(fx: CombatFx, slot: number, unit: UnitId, name: string, targets: readonly number[], o: P, b0: P, t0: number, col: number): boolean {
  switch (unit) {
    case 'optimus': {
      if (name === 'ralliement') { rally(fx, slot, targets, 0x5ab0ff); return true; }
      if (name === 'charge') {
        fx.beam(o, b0, 0xd8322c, 26, 0.18, BeamMode.Flash, t0, 0);
        fx.later(t0, 0.05, hitHeavy, 0xffb03a);
        return true;
      }
      const m = fx.shot('slash', o, t0, fx.travel(o, b0, 2200, 0.1, 0.3), hitHeavy, 0xff9a2a);
      m.face = true; m.s0 = 1; m.s1 = 1.4; m.s.tint = 0xff9a2a;
      targets.slice(1).forEach((t, i) => fx.later(t, 0.08 + i * 0.03, hitBlast, 0xff9a2a));
      return true;
    }
    case 'bumblebee': {
      if (name === 'rafale') {
        targets.forEach((t, i) => { const b = fx.body(t); if (b) fx.beam(o, b, 0xfff27a, 10 - i * 2, 0.12, BeamMode.Flash, t, 0, true, i * 0.04); fx.later(t, 0.03 + i * 0.04, hitBlast, 0xffe14a); });
        return true;
      }
      fx.muzzle(o, 0x5ad8ff);
      const m = fx.shot('photon', o, t0, fx.travel(o, b0, 2600), hitBlast, 0x5ad8ff);
      m.face = true; m.s.tint = 0x5ad8ff;
      return true;
    }
    case 'ironhide': {
      if (name === 'fourgon') {
        const m = fx.shot('boulder', o, t0, fx.travel(o, b0, 1500, 0.2, 0.4), hitHeavy, 0xffb347);
        m.arc = 60; m.spin = 5; m.s.tint = 0x9aa3b8;
        return true;
      }
      for (const t of targets) { const b = fx.body(t); if (!b) continue; fx.beam(o, b, 0xffb347, 12, 0.14, BeamMode.Flash, t, 0); fx.later(t, 0.03, hitBlast, 0xffb347); }
      fx.muzzle(o, 0xffb347, 1.2);
      return true;
    }
    case 'ratchet': {
      const m = fx.shot(name === 'sirene' ? 'spark' : 'square', o, t0, fx.travel(o, b0, 1800, 0.12, 0.36), hitBlast, name === 'sirene' ? 0xff5a5a : 0x7dffb0);
      m.spin = 10; m.s.tint = name === 'sirene' ? 0xff5a5a : 0xd9dee8;
      return true;
    }
    case 'jazz': {
      if (name === 'projecteur') {
        fx.beam(o, b0, 0xfff6a0, 30, 0.3, BeamMode.Flash, t0, 20);
        fx.later(t0, 0.03, hitMark, 0xfff6a0);
        fx.host.flash(0.08, 0.15, 0xfff6a0);
        return true;
      }
      const m = fx.shot(name === 'notes' ? 'note' : 'photon', o, t0, fx.travel(o, b0, 2200), hitBlast, 0x3a8ae0);
      m.s.tint = 0x3a8ae0; m.wob = 14; m.wobF = 2;
      return true;
    }
    case 'arcee': {
      if (name === 'moto') {
        fx.beam(o, b0, 0xff6fa8, 14, 0.12, BeamMode.Flash, t0, 0);
        fx.later(t0, 0.03, hitSlash, 0xff6fa8);
        return true;
      }
      fx.later(t0, 0.02, hitSlash, 0x5ad8ff);
      fx.later(t0, 0.09, hitSlash, 0xff6fa8);
      return true;
    }
    case 'grimlock': {
      if (name === 'feu') {
        const c = fx.host.cell(slot);
        for (let i = 0; i < fx.n(6); i++) {
          const f = fx.shotTo('fireball', { x: c.x + 20, y: c.y - 20 }, { x: b0.x + rnd(-40, 40), y: b0.y + rnd(-30, 30) }, 0.3 + i * 0.03, null, 0xff8a2a);
          f.s0 = 0.5; f.s1 = 1.1;
        }
        targets.forEach((t, i) => fx.later(t, 0.25 + i * 0.03, hitFlame, 0xff8a2a));
        return true;
      }
      fx.later(t0, 0.03, hitHeavy, 0xff9a2a);
      fx.later(t0, 0.03, hitSlash, 0xff9a2a);
      return true;
    }
    case 'wheeljack': {
      if (name === 'mine') {
        for (const t of targets) fx.later(t, 0.05, hitHeavy, 0xffe14a);
        const b = fx.feet(t0);
        if (b) { fx.ring(b.x, b.y, 0xffe14a, 120, 0.4, 'ground', 0.4); fx.host.shake(5, 0.2); }
        return true;
      }
      const m = fx.shot('bolt', o, t0, fx.travel(o, b0, 1500, 0.2, 0.42), name === 'grenade' ? hitHeavy : hitBlast, 0x3fae5a);
      m.arc = name === 'grenade' ? 90 : 0; m.spin = 8; m.s.tint = 0x3fae5a;
      return true;
    }
    case 'hotrod': {
      if (name === 'flammes') {
        targets.forEach((t, i) => fx.later(t, 0.04 + i * 0.03, hitFlame, 0xff8a2a));
        fx.beam(o, b0, 0xff8a2a, 18, 0.2, BeamMode.Flash, t0, 0);
        return true;
      }
      for (const k of [0, 0.07]) {
        const m = fx.shot('photon', o, t0, fx.travel(o, b0, 2400) + k, hitBlast, 0xff8a2a);
        m.face = true; m.s.tint = 0xff8a2a; m.delay = k;
      }
      return true;
    }
    case 'elita': {
      if (name === 'marque') { fx.later(t0, 0.02, hitMark, 0xff7ad8); return true; }
      fx.beam(o, b0, 0xff7ad8, 8, 0.12, BeamMode.Flash, t0, 0);
      fx.later(t0, 0.02, hitBlast, 0xff7ad8);
      return true;
    }
    case 'bulkhead': {
      const m = fx.shot('boulder', o, t0, fx.travel(o, b0, 1400, 0.2, 0.42), hitHeavy, 0xf2c33c);
      m.arc = name === 'ecrasement' ? 30 : 80; m.spin = 6; m.s.tint = 0x3a3550; m.s0 = 1; m.s1 = 1.2;
      return true;
    }
    case 'sideswipe': {
      if (name === 'traversee') {
        const far = targets.map((t) => fx.body(t)).filter((p): p is P => !!p).pop() ?? b0;
        fx.beam(o, far, 0xffffff, 14, 0.16, BeamMode.Flash, -1, 40);
        targets.forEach((t, i) => fx.later(t, 0.04 + i * 0.04, hitSlash, 0xff6a5a));
        return true;
      }
      const m = fx.shot('slash', o, t0, fx.travel(o, b0, 2000), hitSlash, 0xff6a5a);
      m.spin = 18; m.s.tint = 0xd9dee8;
      targets.slice(1).forEach((t, i) => fx.later(t, 0.1 + i * 0.03, hitSlash, 0xff6a5a));
      return true;
    }
    case 'prowl': {
      const sir = name === 'sirene';
      fx.beam(o, b0, sir ? 0x5ab0ff : 0x7dffb0, 9, 0.12, BeamMode.Flash, t0, 0);
      fx.later(t0, 0.02, sir ? hitMark : hitBlast, sir ? 0x5ab0ff : 0x7dffb0);
      return true;
    }
    case 'mirage': {
      if (name === 'invisible') {
        fx.beam(o, b0, 0x9adcff, 16, 0.2, BeamMode.Flash, t0, 0);
        fx.later(t0, 0.02, hitHeavy, 0x9adcff);
        return true;
      }
      const m = fx.shot('photon', o, t0, fx.travel(o, b0, 2400), hitBlast, 0x9adcff);
      m.face = true; m.s.tint = 0x9adcff; m.a0 = name === 'leurre' ? 0.6 : 1;
      if (name === 'leurre') fx.puffs(b0.x, b0.y, 0x9adcff, fx.n(4), 0.7, 120, 0.5);
      return true;
    }
    case 'ultramagnus': {
      if (name === 'porte-voitures') {
        const m = fx.shot('square', o, t0, fx.travel(o, b0, 1800, 0.15, 0.4), hitHeavy, 0xffd34a);
        m.arc = 50; m.spin = 6; m.s.tint = 0x5ab0f0;
        return true;
      }
      const m = fx.shot('hammer', o, t0, fx.travel(o, b0, 1700, 0.14, 0.36), hitHeavy, 0xffd34a);
      m.arc = 100; m.spin = 12; m.s.tint = 0x5a80e0;
      return true;
    }
    default:
      void col;
      return false;
  }
}

/** Cri de ralliement d'Optimus : anneau qui part de la case, impact sur chaque ennemi touché. */
function rally(fx: CombatFx, slot: number, targets: readonly number[], col: number): void {
  const c = fx.host.cell(slot);
  fx.ring(c.x, c.y, col, 200, 0.45);
  fx.glow(c.x, c.y, col, 3, 0.4);
  targets.forEach((t, i) => fx.later(t, 0.12 + i * 0.02, hitBlast, col));
  fx.host.shake(3, 0.2);
}

// ---------------------------------------------------------------- compétences

/** Transformation et compétences des Autobots. Renvoie false si rien n'est propre à l'extension. */
export function playTfAbility(fx: CombatFx, slot: number, unit: UnitId, name: string, targets: readonly number[], col: number): boolean {
  const c = fx.host.cell(slot);
  if (name.startsWith('Transformation')) {
    // Éclat blanc, pièces de métal qui volent, anneau à la couleur du héros.
    fx.glow(c.x, c.y, 0xffffff, 2.4, 0.3);
    fx.ring(c.x, c.y, col, 80, 0.32);
    fx.debris(c.x, c.y, 'square', 0xd9dee8, fx.n(6), 300, 0.5, 0.45);
    fx.sparks(c.x, c.y, col, fx.n(6), 260, 0.6);
    return true;
  }
  switch (name) {
    case 'Réparation':
      fx.ring(c.x, c.y, 0x7dffb0, 110, 0.4);
      fx.sparks(c.x, c.y, 0x7dffb0, fx.n(6), 220, 0.6);
      return true;
    case 'Bouclier d’équipe':
      fx.ring(c.x, c.y, 0xffd34a, 150, 0.5);
      fx.glow(c.x, c.y, 0xffd34a, 3, 0.45);
      return true;
    case 'Enchantement':
      fx.glow(c.x, c.y, 0xc8a0ff, 2.2, 0.4);
      fx.sparks(c.x, c.y, 0xc8a0ff, fx.n(6), 240, 0.6);
      return true;
    case 'Cri de ralliement':
    case 'Mine':
      return true; // déjà portées par l'effet d'attaque
    default:
      void targets; void unit;
      return false;
  }
}
