// Méchants DC (design/planches/7-dc-mechants.html), dans le traitement « méchant » des boss :
// chibi trapu, palette sombre, visage dans l'ombre, yeux lumineux, trois poses (repos, préparation, pouvoir).
/* eslint-disable */
import { O, f, uid, shaded, clip, gloss, limb, hand, star, glow, burst, beam, bolt, sparks, mirror, shadow, tip, type CharDef, type Ctx } from '../primitives';
import { hoodShade, geyes, evilMouth, txt, rnd, twinkle, token, rot } from '../kits/villain';
import { SKT, SKTD, boltSym, shock } from '../kits/dc';

const BUST = 'M24 206 C20 152 54 128 100 126 C146 128 180 152 176 206Z';
const bust = (c: string, d: string, path = BUST): string => shaded((a) => `<path d="${path}" ${a}/>`, c, d, -10, -4);
/** Épaulière arrondie (côté gauche ; `mirror` pour la droite). */
const padS = (a: string): string => `<path d="M24 156 Q22 124 50 120 Q78 124 78 152 Q50 164 24 156Z" ${a}/>`;
const pad = (c: string, d: string, trim?: string): string =>
  shaded(padS, c, d, -4, -4) + (trim ? `<path d="M28 146 Q50 154 76 144" stroke="${trim}" stroke-width="3.5" fill="none"/>` : '') + gloss(40, 130, 9, 4, -30, 0.5);
/** Nuage de gaz (bulles cernées). */
const cloud = (pts: readonly (readonly [number, number, number])[], c: string, c2: string): string =>
  pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + 4}" fill="${O}"/>`).join('') +
  pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join('') +
  pts.map(([x, y, r]) => `<circle cx="${f(x - r * 0.3)}" cy="${f(y - r * 0.3)}" r="${f(r * 0.45)}" fill="${c2}" opacity=".8"/>`).join('');
/** Silhouettes de toits (décor de ville). */
function skyline(seed: number, col: string, lit: string): string {
  const r = rnd(seed);
  let s = '', xx = -44;
  while (xx < 244) {
    const w = 16 + r() * 22, h = 30 + r() * 70, y = 232 - h;
    s += `<rect x="${f(xx)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${col}"/>`;
    for (let i = 0; i < 3; i++) if (r() > 0.45) s += `<rect x="${f(xx + 4 + r() * (w - 10))}" y="${f(y + 6 + r() * (h - 20))}" width="3.5" height="5" fill="${lit}" opacity=".7"/>`;
    xx += w + 2;
  }
  return `<g opacity=".55">${s}</g>`;
}
/** Rayon brisé (rayons Oméga, éclairs épais). */
function zap(pts: readonly (readonly number[])[], c: string, w = 9): string {
  const d = 'M' + pts.map((p) => p.map(f).join(' ')).join(' L');
  return `<g class="fx"><path d="${d}" stroke="${c}" stroke-width="${w + 16}" fill="none" stroke-linejoin="round" stroke-linecap="round" opacity=".25"/><path d="${d}" stroke="${O}" stroke-width="${w + 7}" fill="none" stroke-linejoin="round" stroke-linecap="round"/><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linejoin="round" stroke-linecap="round"/><path d="${d}" stroke="#fff" stroke-width="${f(w * 0.35)}" fill="none" stroke-linejoin="round" stroke-linecap="round"/></g>`;
}
/** Symbole Oméga. */
const omega = (x: number, y: number, s: number, c: string): string => {
  const d = 'M-11 9 H-4 Q-13 1 -11 -6 Q-8 -14 0 -14 Q8 -14 11 -6 Q13 1 4 9 H11';
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})"><path d="${d}" stroke="${O}" stroke-width="8" fill="none" stroke-linejoin="round" stroke-linecap="round"/><path d="${d}" stroke="${c}" stroke-width="4" fill="none" stroke-linejoin="round" stroke-linecap="round"/></g>`;
};

export const DC_BOSSES: CharDef[] = [
/* ---------- Joker ---------- */
{
  id: 'joker', name: 'Joker', stats: [3, 4, 4], tint: '#5e3a8c', tint2: '#1a1030', mt: '#f2e6fb', mt2: '#cdb2ea', glow: '#9dff5a', shake: true,
  power: 'Gaz hilarant : un nuage vert fait rire 3 héros, qui ratent leurs attaques pendant 4 s.', minionTxt: 'Hommes de main clowns : nombreux, lancent des tartes piégées.',
  sh: { L: [52, 152], R: [148, 152] },
  poses: [{ L: 18, R: -18 }, { L: 30, R: -150, body: [2, -4, 4, 1, 1.03] }, { L: 40, R: -96, body: [-6, 0, -6, 1, 1] }],
  bg() {
    let s = skyline(5, '#120a22', '#ffe27a');
    const r = rnd(41);
    for (let i = 0; i < 8; i++) s += twinkle(f(-26 + r() * 250), f(-36 + r() * 110), f(3 + r() * 3), '#d8c4ff', 0.5);
    const card = (x: number, y: number, a: number): string => `<g transform="rotate(${a} ${x} ${y})" opacity=".45"><rect x="${x - 9}" y="${y - 13}" width="18" height="26" rx="3" fill="#f4f1f6"/><path d="M${x} ${y - 5} l4 5 l-4 5 l-4 -5Z" fill="#d0283a"/></g>`;
    return s + card(-16, 24, -20) + card(208, 6, 18) + card(222, 92, -12);
  },
  draw(this: CharDef, x: Ctx): string {
    const PU = '#7b3fb0', PUD = '#53278a', GR = '#3faa4a', GRD = '#26803a', OR = '#f28a2a', ORD = '#c45e14', W = '#f4f1f6', WD = '#c9c0d8', H = '#5ec84a', HD = '#2f8a2f', GAS = '#9dff5a', GAS2 = '#e6ffd0', Y = '#ffe23a';
    const armIn = (sx: number, sy: number): string => limb(sx, sy, sx, sy + 38, PU, 22) + `<rect x="${sx - 14}" y="${sy + 28}" width="28" height="9" rx="3" fill="${W}" stroke="${O}" stroke-width="3"/>` + hand(sx, sy + 48, PUD, 14);
    const armR = (sx: number, sy: number): string => armIn(sx, sy) + x.when([1], glow(sx, sy + 52, 20, Y) + `<circle cx="${sx}" cy="${sy + 52}" r="7" fill="#cfd5e0" stroke="${O}" stroke-width="2.5"/>`);
    let b = '';
    b += bust(PU, PUD) + gloss(48, 166, 12, 5, -55, 0.22);
    /* gilet vert, chemise orange, nœud papillon */
    b += shaded((a) => `<path d="M72 132 Q100 140 128 132 L118 206 L82 206Z" ${a}/>`, GR, GRD, -4, -3);
    b += `<circle cx="100" cy="174" r="3.5" fill="${Y}" stroke="${O}" stroke-width="2"/><circle cx="100" cy="190" r="3.5" fill="${Y}" stroke="${O}" stroke-width="2"/>`;
    b += shaded((a) => `<path d="M86 132 Q100 138 114 132 L100 160Z" ${a}/>`, OR, ORD, -2, -2);
    b += `<path d="M86 140 L100 146 L86 152Z M114 140 L100 146 L114 152Z" fill="${PUD}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><circle cx="100" cy="146" r="4" fill="${PU}" stroke="${O}" stroke-width="2.5"/>`;
    /* revers du veston et fleur à la boutonnière */
    const lapel = `<path d="M70 132 L82 206 L60 186 L64 156 L54 146Z" fill="${PUD}" stroke="${O}" stroke-width="4" stroke-linejoin="round"/>`;
    b += lapel + mirror(lapel);
    b += x.when([1, 2], glow(66, 160, 14, GAS));
    b += `<g stroke="${O}" stroke-width="2.5">${[0, 1, 2, 3, 4].map((i) => `<circle cx="${f(66 + Math.cos(i * 1.256) * 6)}" cy="${f(160 + Math.sin(i * 1.256) * 6)}" r="5" fill="${W}"/>`).join('')}</g><circle cx="66" cy="160" r="4" fill="${Y}" stroke="${O}" stroke-width="2"/>`;
    /* tête : visage blanc allongé, cheveux verts */
    const faceS = (a: string): string => `<path d="M54 96 Q52 50 100 46 Q148 50 146 96 L144 126 Q138 164 100 168 Q62 164 56 126Z" ${a}/>`;
    b += shaded(faceS, W, WD, -4, -4);
    b += hoodShade(faceS, 56, 108, 0.42, '#2a1440');
    b += shaded((a) => `<path d="M46 108 Q34 60 54 34 Q60 4 92 6 Q100 -10 116 2 Q146 0 154 30 Q172 52 156 106 Q154 76 140 64 Q148 50 136 44 Q126 58 104 52 Q96 62 78 56 Q60 60 62 72 Q50 82 46 108Z" ${a}/>`, H, HD, -4, -4);
    b += `<path d="M64 36 Q74 18 92 18 M110 14 Q130 14 142 30 M54 60 Q54 46 64 40" stroke="#a6f08a" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    b += `<path d="M64 86 Q80 80 94 92 M136 86 Q120 80 106 92" stroke="#3a2152" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    b += `<ellipse cx="80" cy="100" rx="17" ry="13" fill="#6a3f8a" opacity=".45"/><ellipse cx="120" cy="100" rx="17" ry="13" fill="#6a3f8a" opacity=".45"/>`;
    b += x.byPose((p) => {
      let s = geyes('#c6ff4a', { x: 81, y: 100, s: p == 2 ? 1.05 : 0.95, sq: p == 1 ? 0.7 : 1 });
      const open = [140, 148, 156][p]!;
      s += `<path d="M58 118 Q100 ${open - 10} 142 118 Q132 ${open + 4} 100 ${open + 6} Q68 ${open + 4} 58 118Z" fill="${p ? '#4a0f22' : '#fff'}" stroke="${O}" stroke-width="4" stroke-linejoin="round"/>`;
      if (p) s += `<path d="M62 120 Q100 ${open - 6} 138 120 L134 126 Q100 ${open - 2} 66 126Z" fill="#fff" stroke="${O}" stroke-width="2"/><path d="M84 ${open} Q100 ${open - 6} 116 ${open}" stroke="#e85a6e" stroke-width="4" fill="none"/>`;
      else for (let i = 1; i < 9; i++) { const t = i / 9, xx = 58 + 84 * t; s += `<path d="M${f(xx)} ${f(118 + Math.sin(t * Math.PI) * (open - 128))} V${f(118 + Math.sin(t * Math.PI) * (open - 114))}" stroke="${O}" stroke-width="1.8"/>`; }
      s += `<path d="M58 118 Q100 ${open - 10} 142 118 Q132 ${open + 4} 100 ${open + 6} Q68 ${open + 4} 58 118Z" fill="none" stroke="#d0283a" stroke-width="3" stroke-linejoin="round" opacity=".9"/>`;
      s += `<path d="M52 112 Q56 120 58 118 M148 112 Q144 120 142 118" stroke="${O}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      return s;
    });
    const pads = pad(PU, PUD);
    b += x.arm('L', armIn) + pads + x.arm('R', armR) + mirror(pads);
    /* buzzer : étincelles ; pouvoir : nuage de gaz hilarant et cartes */
    const [bx, by] = tip(this, 'R', 1, 52);
    b += x.when([1], sparks(bx, by, 26, Y, 8) + `<g class="fx">${txt(18, 4, 22, GAS, 'HI HI', -12)}</g>`);
    const [hx, hy] = tip(this, 'R', 2, 50), T = [198, 168] as const;
    const gas = cloud([[T[0] - 22, T[1] - 14, 15], [T[0], T[1] - 26, 18], [T[0] + 24, T[1] - 12, 16], [T[0] - 14, T[1] + 12, 16], [T[0] + 18, T[1] + 16, 18], [T[0] + 34, T[1] - 34, 11], [hx + 8, hy + 2, 10]], GAS, GAS2);
    const card = (cx: number, cy: number, a: number): string => `<g transform="rotate(${a} ${cx} ${cy})"><rect x="${cx - 11}" y="${cy - 15}" width="22" height="30" rx="4" fill="#fff" stroke="${O}" stroke-width="3"/><path d="M${cx} ${cy - 7} l5 7 l-5 7 l-5 -7Z" fill="#d0283a" stroke="${O}" stroke-width="1.5"/></g>`;
    const fxg = x.when([2], `<g class="pop">${gas}</g><g class="pop">${token(T[0], T[1], 13, '#3c8bf0', `<path d="M${T[0] - 6} ${T[1] + 2} q6 6 12 0" stroke="#fff" stroke-width="2.5" fill="none"/>`)}</g>` +
      `<g class="pop">${card(T[0] - 40, T[1] - 64, -18)}${card(T[0] + 4, T[1] - 74, 14)}</g><g class="pop">${txt(T[0] - 10, T[1] + 52, 22, GAS, 'HA HA HA !', -6)}</g>`);
    return shadow(88) + x.body(b) + fxg;
  },
},
/* ---------- Lex Luthor ---------- */
{
  id: 'luthor', name: 'Lex Luthor', stats: [4, 2, 4], tint: '#3f7a5a', tint2: '#10261c', mt: '#e2f5e6', mt2: '#a9d8b2', glow: '#7dff5a',
  power: 'Armure de guerre : rayon de kryptonite qui désactive 2 héros pendant 5 s.', minionTxt: 'Robots LexCorp : blindés, résistent aux premiers coups.',
  sh: { L: [52, 152], R: [148, 152] },
  poses: [{ L: 16, R: -16 }, { L: 26, R: -70, body: [-2, -4, -3, 1, 1.02] }, { L: 30, R: -112, body: [-8, 0, -6, 1, 1] }],
  bg() {
    let s = skyline(17, '#0b1a14', '#9dff7a');
    const r = rnd(29);
    for (let i = 0; i < 8; i++) s += twinkle(f(-26 + r() * 250), f(-36 + r() * 100), f(3 + r() * 3), '#c8ffd0', 0.5);
    return s + `<g opacity=".45"><rect x="166" y="-30" width="34" height="200" fill="#16302a"/><text x="183" y="-6" text-anchor="middle" font-family="Lilita One, Arial Rounded MT Bold, sans-serif" font-size="22" fill="#9dff7a">L</text></g>`;
  },
  draw(this: CharDef, x: Ctx): string {
    const G = '#3f9a52', GD = '#26703a', PU = '#6b3fa0', PUD = '#47267a', M = '#c9d0de', MD = '#8c95ab', K = '#7dff5a', SKN = '#f2c39a', SKND = '#c98f68';
    const gaunt = (sx: number, sy: number): string => shaded((a) => `<rect x="${sx - 17}" y="${sy + 24}" width="34" height="30" rx="9" ${a}/>`, PU, PUD, -3, -3) + `<path d="M${sx - 17} ${sy + 36} H${sx + 17}" stroke="${PUD}" stroke-width="3"/>`;
    const armL = (sx: number, sy: number): string => limb(sx, sy, sx, sy + 34, G, 24) + gaunt(sx, sy) + hand(sx, sy + 56, PU, 15);
    const armR = (sx: number, sy: number): string => limb(sx, sy, sx, sy + 34, G, 24) + gaunt(sx, sy) +
      shaded((a) => `<rect x="${sx - 13}" y="${sy + 50}" width="26" height="18" rx="5" ${a}/>`, M, MD, -2, -2) + x.byPose((p) => (p ? glow(sx, sy + 70, p == 2 ? 22 : 16, K) : '')) +
      x.byPose((p) => `<ellipse cx="${sx}" cy="${sy + 70}" rx="10" ry="5" fill="${p ? '#e8ffe0' : '#2a5a3a'}" stroke="${O}" stroke-width="3"/>`);
    let b = '';
    b += bust(G, GD) + gloss(48, 166, 12, 5, -55, 0.25);
    b += shaded((a) => `<path d="M58 140 Q100 124 142 140 L134 196 Q100 210 66 196Z" ${a}/>`, PU, PUD, -4, -4);
    b += `<path d="M66 160 Q100 172 134 160 M70 182 Q100 194 130 182" stroke="${PUD}" stroke-width="3" fill="none"/>`;
    b += x.when([1, 2], glow(100, 166, 28, K));
    b += x.byPose((p) => `<path d="M100 150 L114 158 L114 174 L100 182 L86 174 L86 158Z" fill="${p ? '#d8ffc8' : K}" stroke="${O}" stroke-width="4" stroke-linejoin="round"/>`) + `<path d="M95 160 L100 156 L105 160" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    /* col d'armure */
    b += shaded((a) => `<path d="M56 140 Q54 116 66 106 L134 106 Q146 116 144 140 Q100 152 56 140Z" ${a}/>`, G, GD, -3, -3) + `<path d="M64 128 Q100 138 136 128" stroke="${GD}" stroke-width="3" fill="none"/>`;
    /* tête chauve */
    const faceS = (a: string): string => `<path d="M56 90 Q54 40 100 38 Q146 40 144 90 L142 120 Q136 150 100 152 Q64 150 58 120Z" ${a}/>`;
    b += shaded(faceS, SKN, SKND, -4, -4) + gloss(78, 54, 16, 8, -30, 0.6) + gloss(118, 48, 5, 3, 20, 0.5);
    b += hoodShade(faceS, 70, 110, 0.4, '#102a1e');
    const ear = `<path d="M58 94 Q46 90 46 102 Q48 114 60 112Z" fill="${SKN}" stroke="${O}" stroke-width="3.5"/>`;
    b += ear + mirror(ear);
    b += `<path d="M62 84 L94 92 M138 84 L106 92" stroke="${O}" stroke-width="5.5" stroke-linecap="round"/>`;
    b += x.byPose((p) => geyes(K, { x: 81, y: 100, s: 0.95, sq: p == 1 ? 0.65 : 0.9 }) + evilMouth(p, 100, 128, 13) + `<path d="M96 108 Q100 116 104 108" stroke="${SKND}" stroke-width="2.5" fill="none"/>`);
    /* épaulières violettes */
    const pads = pad(PU, PUD, G);
    b += x.arm('L', armL) + pads + x.arm('R', armR) + mirror(pads);
    const [cx, cy] = tip(this, 'R', 1, 70);
    b += x.when([1], sparks(cx, cy, 26, K, 8));
    const [hx, hy] = tip(this, 'R', 2, 72), T = [202, 182] as const;
    const fxg = x.when([2], `<g class="grow" style="transform-origin:${f(hx)}px ${f(hy)}px">${beam(hx, hy, T[0], T[1], 14, K)}</g><g class="pop">${burst(f(hx), f(hy), 20, K)}</g>` +
      `<g class="pop">${token(T[0], T[1], 15, '#3c8bf0')}<circle cx="${T[0]}" cy="${T[1]}" r="26" fill="${K}" opacity=".35"/>${sparks(T[0], T[1], 34, K, 8)}</g>` +
      `<g class="pop">${token(T[0] - 44, T[1] + 14, 12, '#9b59e6')}<circle cx="${T[0] - 44}" cy="${T[1] + 14}" r="20" fill="${K}" opacity=".3"/></g>`);
    return shadow(88) + x.body(b) + fxg;
  },
},
/* ---------- Bane ---------- */
{
  id: 'bane', name: 'Bane', stats: [5, 2, 3], tint: '#5a5a6a', tint2: '#14121c', mt: '#e8e6ee', mt2: '#bdb8cc', glow: '#5aff4a', shake: true,
  power: 'Venin : grossit et devient insensible aux ralentissements, puis frappe le sol et étourdit une rangée.', minionTxt: 'Mercenaires au venin : lents mais très résistants.',
  sh: { L: [44, 150], R: [156, 150] },
  poses: [{ L: 16, R: -16 }, { L: 150, R: -150, body: [0, -10, 0, 1.08, 1.06] }, { L: 22, R: -22, body: [0, 6, 0, 1.12, 0.9] }],
  bg() {
    let s = '';
    for (let r = 0; r < 6; r++) for (let i = 0; i < 7; i++) s += `<rect x="${-44 + i * 44 + (r % 2) * 22}" y="${-46 + r * 30}" width="40" height="26" rx="3" fill="#2a2636" opacity=".55"/>`;
    const r = rnd(13);
    for (let i = 0; i < 6; i++) { const xx = -30 + r() * 260, yy = -40 + r() * 90; s += `<path d="M${f(xx)} ${f(yy)} q3 10 0 16 q-3 -6 0 -16Z" fill="#5aff4a" opacity=".35"/>`; }
    return s;
  },
  draw(this: CharDef, x: Ctx): string {
    const K = '#2c2a38', KD = '#16141e', S = '#d9a77a', SD = '#a87650', V = '#5aff4a', VD = '#2a9a2a', MS = '#3a3648', GY = '#9aa3b5';
    const veins = (sx: number, sy: number): string => x.when([1, 2], `<path d="M${sx - 6} ${sy + 8} l5 8 l-4 6 l5 8 M${sx + 6} ${sy + 12} l-4 7 l5 7" stroke="${V}" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);
    const armIn = (sx: number, sy: number): string => limb(sx, sy, sx, sy + 40, S, 28) + veins(sx, sy) + shaded((a) => `<rect x="${sx - 17}" y="${sy + 30}" width="34" height="16" rx="5" ${a}/>`, K, KD, -2, -2) + hand(sx, sy + 54, K, 19);
    let b = '';
    b += bust(K, KD, 'M14 206 C10 148 50 124 100 122 C150 124 190 148 186 206Z') + gloss(42, 162, 12, 5, -55, 0.2);
    b += `<path d="M58 160 Q78 176 98 162 M102 162 Q122 176 142 160 M80 186 H120" stroke="${KD}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M60 156 Q78 168 96 158" stroke="#5a5670" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    /* ceinture et pompe à venin */
    b += shaded((a) => `<path d="M16 186 Q100 202 184 186 L185 204 Q100 218 15 204Z" ${a}/>`, '#4a4458', KD, -3, -3);
    b += x.when([1, 2], glow(100, 194, 20, V));
    b += shaded((a) => `<rect x="86" y="182" width="28" height="22" rx="6" ${a}/>`, GY, '#646c80', -2, -2) + `<rect x="92" y="186" width="16" height="14" rx="3" fill="${V}" stroke="${O}" stroke-width="2.5"/><path d="M95 189 V197" stroke="#fff" stroke-width="2" opacity=".8"/>`;
    /* tuyaux de venin, de la nuque aux bras */
    const tube = (d: string): string => `<path d="${d}" stroke="${O}" stroke-width="12" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${VD}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${V}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".85"/>`;
    b += tube('M62 128 Q30 120 26 144') + mirror(tube('M62 128 Q30 120 26 144'));
    /* tête : masque de catcheur */
    const hs = (a: string): string => `<path d="M50 96 Q48 34 100 30 Q152 34 150 96 L148 124 Q142 158 100 160 Q58 158 52 124Z" ${a}/>`;
    b += shaded(hs, MS, '#1e1b2a', -4, -4) + gloss(76, 50, 14, 6, -30, 0.35);
    b += `<path d="M100 32 V70 M66 50 Q84 62 100 62 Q116 62 134 50 M58 120 Q70 132 78 150 M142 120 Q130 132 122 150" stroke="${GY}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    b += x.byPose((p) => {
      const hole = `<path d="M60 86 Q80 78 96 96 Q94 110 80 112 Q62 110 60 86Z" fill="#120f1a" stroke="${GY}" stroke-width="3"/>`;
      let s = hole + mirror(hole) + geyes(p ? V : '#ff5a3a', { x: 80, y: 98, s: 0.85, sq: p == 1 ? 0.7 : 0.9 });
      s += `<path d="M76 122 Q100 116 124 122 Q120 146 100 148 Q80 146 76 122Z" fill="${S}" stroke="${GY}" stroke-width="3"/>`;
      s += evilMouth(p, 100, 132, 11);
      return s;
    });
    /* tuyaux autour du masque */
    b += `<path d="M54 112 Q46 100 52 86 M146 112 Q154 100 148 86" stroke="${O}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M54 112 Q46 100 52 86 M146 112 Q154 100 148 86" stroke="${VD}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    const pads = shaded((a) => `<circle cx="40" cy="146" r="22" ${a}/>`, S, SD, -4, -4) + gloss(32, 136, 7, 3, -30, 0.5);
    b += x.arm('L', armIn) + pads + x.arm('R', armIn) + mirror(pads);
    b += x.when([1], `<g class="fx">${txt(100, -26, 24, V, 'VENIN !', -4)}</g>`);
    const [lx, ly] = tip(this, 'L', 2, 56), [rx, ry] = tip(this, 'R', 2, 56);
    let rocks = '';
    ([[ -16, 176], [214, 170], [-30, 150], [228, 140], [24, 150], [178, 146]] as const).forEach(([cx, cy], i) => { rocks += `<polygon points="${cx},${cy} ${cx + 12},${cy - 8} ${cx + 16},${cy + 6} ${cx + 4},${cy + 10}" transform="rotate(${i * 40} ${cx} ${cy})"/>`; });
    const fxg = x.when([2], shock(100, 206, 130, 18, V) + `<g class="ring"><ellipse cx="100" cy="206" rx="90" ry="12" fill="${V}" opacity=".3"/></g>` +
      `<g class="pop">${burst(f(lx), f(ly), 26, '#f2c95a')}</g><g class="pop">${burst(f(rx), f(ry), 26, '#f2c95a')}</g>` +
      `<g class="pop" fill="#7a6f8a" stroke="${O}" stroke-width="3" stroke-linejoin="round">${rocks}</g>` +
      `<g class="pop">${txt(176, 96, 26, '#fff', 'BOUM !', 10)}</g>`);
    return shadow(96) + x.body(b) + fxg;
  },
},
/* ---------- Sinestro ---------- */
{
  id: 'sinestro', name: 'Sinestro', stats: [4, 3, 5], tint: '#8a7a2a', tint2: '#1c1606', mt: '#fff7d6', mt2: '#f2dc8a', glow: '#ffe23a',
  power: 'Anneau jaune de la peur : une griffe géante saisit un héros et le fait reculer d’une case.', minionTxt: 'Corps Sinestro : volent au-dessus du chemin et tirent de loin.',
  sh: { L: [52, 152], R: [148, 152] },
  poses: [{ L: 18, R: -14 }, { L: 24, R: -158, body: [2, -6, 4, 1, 1.03] }, { L: 30, R: -112, body: [-6, 0, -6, 1, 1] }],
  bg() {
    let s = '';
    const r = rnd(53);
    for (let i = 0; i < 12; i++) s += twinkle(f(-26 + r() * 250), f(-40 + r() * 240), f(2.5 + r() * 3.5), '#fff2a0', 0.5);
    s += `<g opacity=".18" fill="none" stroke="#ffe23a" stroke-width="8"><circle cx="100" cy="76" r="104"/><path d="M28 30 H172 M28 122 H172"/></g>`;
    return s;
  },
  draw(this: CharDef, x: Ctx): string {
    const K = '#24202e', KD = '#110e18', Y = '#ffd23a', YD = '#c89a1a', S = '#d9508a', SD = '#a8346a', H = '#1c1622', LY = '#ffe23a';
    const armIn = (sx: number, sy: number): string => limb(sx, sy, sx, sy + 38, K, 22) + shaded((a) => `<rect x="${sx - 14}" y="${sy + 26}" width="28" height="14" rx="5" ${a}/>`, Y, YD, -2, -2) + hand(sx, sy + 50, K, 14);
    const armR = (sx: number, sy: number): string => armIn(sx, sy) + x.byPose((p) => (p ? glow(sx, sy + 56, p == 2 ? 22 : 18, LY) : '')) + `<rect x="${sx - 6}" y="${sy + 50}" width="12" height="10" rx="3" fill="${LY}" stroke="${O}" stroke-width="2.5"/>`;
    let b = '';
    /* haut col pointu derrière la tête */
    const collar = `<path d="M48 150 Q22 100 40 44 Q56 96 78 132Z" fill="${K}" stroke="${O}" stroke-width="5" stroke-linejoin="round"/><path d="M44 132 Q32 100 40 64" stroke="${Y}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    b += collar + mirror(collar);
    b += bust(K, KD) + gloss(48, 166, 12, 5, -55, 0.22);
    b += shaded((a) => `<path d="M60 138 Q100 128 140 138 L128 206 L72 206Z" ${a}/>`, Y, YD, -4, -3);
    b += x.when([1, 2], glow(100, 170, 26, LY));
    b += `<circle cx="100" cy="170" r="18" fill="${K}" stroke="${O}" stroke-width="4"/><path d="M92 160 H108 L106 166 H94Z M94 168 H106 V178 Q100 182 94 178Z" fill="${LY}" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>`;
    b += shaded((a) => `<path d="M26 186 Q100 200 174 186 L175 202 Q100 216 25 202Z" ${a}/>`, K, KD, -3, -3);
    /* tête : visage magenta, front haut, pointe de veuve */
    const faceS = (a: string): string => `<path d="M56 86 Q54 30 100 26 Q146 30 144 86 L142 122 Q136 158 100 162 Q64 158 58 122Z" ${a}/>`;
    b += shaded(faceS, S, SD, -4, -4) + gloss(80, 48, 14, 6, -30, 0.45);
    b += hoodShade(faceS, 60, 108, 0.45, '#2a0a1e');
    b += shaded((a) => `<path d="M54 92 Q50 40 74 28 Q100 16 126 28 Q150 40 146 92 Q140 62 128 54 L100 76 L72 54 Q60 62 54 92Z" ${a}/>`, '#3a3046', H, -3, -3);
    const ear = `<path d="M58 92 L40 80 L46 106 L58 112Z" fill="${S}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/>`;
    b += ear + mirror(ear);
    b += `<path d="M64 84 L94 94 M136 84 L106 94" stroke="${O}" stroke-width="5" stroke-linecap="round"/>`;
    b += x.byPose((p) => geyes(LY, { x: 81, y: 100, s: 0.95, sq: p == 1 ? 0.6 : 0.85 }) + evilMouth(p, 100, 134, 12) +
      `<path d="M82 124 Q92 118 100 122 Q108 118 118 124" stroke="${H}" stroke-width="4" fill="none" stroke-linecap="round"/>`);
    const pads = pad(K, KD, Y);
    b += x.arm('L', armIn) + pads + x.arm('R', armR) + mirror(pads);
    /* préparation : le symbole du Corps s'allume au-dessus de l'anneau */
    const [rx, ry] = tip(this, 'R', 1, 56);
    b += x.when([1], `<g class="fx"><circle cx="${f(rx)}" cy="${f(ry - 34)}" r="22" fill="${LY}" opacity=".3"/><path d="M${f(rx - 12)} ${f(ry - 46)} H${f(rx + 12)} L${f(rx + 9)} ${f(ry - 38)} H${f(rx - 9)}Z M${f(rx - 9)} ${f(ry - 34)} H${f(rx + 9)} V${f(ry - 22)} Q${f(rx)} ${f(ry - 16)} ${f(rx - 9)} ${f(ry - 22)}Z" fill="${LY}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/></g>` + sparks(rx, ry, 24, LY, 7));
    /* pouvoir : griffe jaune géante qui saisit un héros */
    const [hx, hy] = tip(this, 'R', 2, 56), T = [196, 178] as const;
    let claw = '';
    for (let i = 0; i < 4; i++) {
      const a = -0.9 + i * 0.6, x1 = T[0] + Math.cos(a - Math.PI / 2) * 6, y1 = T[1] - 30;
      const x2 = T[0] + Math.sin(a) * 38, y2 = T[1] - 10 + Math.cos(a) * 6;
      claw += `<path d="M${f(x1)} ${f(y1)} Q${f(x2)} ${f(y1 - 8)} ${f(x2 * 0.9 + T[0] * 0.1)} ${f(y2 + 22)}" stroke="${O}" stroke-width="13" fill="none" stroke-linecap="round"/><path d="M${f(x1)} ${f(y1)} Q${f(x2)} ${f(y1 - 8)} ${f(x2 * 0.9 + T[0] * 0.1)} ${f(y2 + 22)}" stroke="${LY}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".9"/>`;
    }
    const fxg = x.when([2], `<g class="grow" style="transform-origin:${f(hx)}px ${f(hy)}px">${beam(hx, hy, T[0], T[1] - 34, 9, LY)}</g>` +
      `<g class="pop">${token(T[0], T[1], 14, '#3c8bf0')}</g><g class="pop"><ellipse cx="${T[0]}" cy="${T[1] - 30}" rx="18" ry="12" fill="${LY}" stroke="${O}" stroke-width="4"/>${claw}</g>` +
      `<g class="pop">${sparks(T[0], T[1], 42, LY, 8)}</g>`);
    return shadow(88) + x.body(b) + fxg;
  },
},
/* ---------- Black Adam ---------- */
{
  id: 'blackadam', name: 'Black Adam', stats: [5, 3, 4], tint: '#8a6a2a', tint2: '#22160a', mt: '#fbefd6', mt2: '#e8cc8e', glow: '#ffe066', shake: true,
  power: 'Foudre de Kahndaq : la foudre s’abat sur la colonne la plus puissante et étourdit 2 s.', minionTxt: 'Soldats de Kahndaq : lances et boucliers, avancent en rangs.',
  sh: { L: [52, 152], R: [148, 152] },
  poses: [{ L: 16, R: -16 }, { L: 156, R: -156, body: [0, -8, 0, 1, 1.04] }, { L: 30, R: -104, body: [-6, 0, -6, 1, 1] }],
  bg() {
    let s = `<circle cx="10" cy="4" r="26" fill="#ffe8a8" opacity=".55"/>`;
    s += `<path d="M-44 232 L-44 170 L-2 120 L40 170 L60 150 L96 190 L130 150 L176 196 L210 164 L244 190 L244 232Z" fill="#3a2410" opacity=".55"/>`;
    s += `<path d="M150 232 L196 120 L244 232Z" fill="#4a3014" opacity=".5"/>`;
    const r = rnd(61);
    for (let i = 0; i < 6; i++) s += twinkle(f(-26 + r() * 250), f(-36 + r() * 90), f(3 + r() * 3), '#fff0b8', 0.45);
    return s;
  },
  draw(this: CharDef, x: Ctx): string {
    const K = '#272230', KD = '#120f18', G = '#f6c64a', GD = '#c58f25', H = '#1c1622', LT = '#ffe066';
    const armIn = (sx: number, sy: number): string => limb(sx, sy, sx, sy + 38, K, 23) + shaded((a) => `<rect x="${sx - 15}" y="${sy + 24}" width="30" height="18" rx="6" ${a}/>`, G, GD, -3, -3) + `<path d="M${sx - 15} ${sy + 33} H${sx + 15}" stroke="${GD}" stroke-width="2.5"/>` + hand(sx, sy + 50, SKT, 14);
    const armX = (sx: number, sy: number): string => armIn(sx, sy) + x.when([1, 2], glow(sx, sy + 52, 22, LT));
    let b = '';
    /* cape noire à capuche rabattue */
    b += shaded((a) => `<path d="M38 134 Q2 176 6 206 L194 206 Q198 176 162 134Z" ${a}/>`, '#3a3446', KD, 8, -4) + `<path d="M10 204 Q8 180 40 140 M190 204 Q192 180 160 140" stroke="${G}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    b += shaded((a) => `<path d="M40 128 Q36 104 56 92 L144 92 Q164 104 160 128 Q100 146 40 128Z" ${a}/>`, '#3a3446', KD, -3, -3);
    b += bust(K, KD) + gloss(48, 166, 12, 5, -55, 0.22);
    b += shaded((a) => `<path d="M26 186 Q100 200 174 186 L175 202 Q100 216 25 202Z" ${a}/>`, G, GD, -3, -3) + `<path d="M28 195 Q100 209 172 195" stroke="${GD}" stroke-width="2.5" fill="none"/>`;
    b += x.when([1, 2], glow(100, 182, 30, LT));
    b += boltSym(100, 180, 1.25, G, 4.5);
    /* tête */
    const faceS = (a: string): string => `<path d="M56 86 Q54 36 100 34 Q146 36 144 86 L142 122 Q136 158 100 162 Q64 158 58 122Z" ${a}/>`;
    b += shaded(faceS, SKT, SKTD, -4, -4) + gloss(80, 56, 14, 6, -30, 0.4);
    b += hoodShade(faceS, 60, 110, 0.5, '#1e1008');
    b += shaded((a) => `<path d="M50 96 Q44 28 100 22 Q156 28 150 96 Q146 66 132 58 Q116 66 100 60 Q84 66 68 58 Q54 66 50 96Z" ${a}/>`, '#3a3046', H, -3, -3) + `<path d="M100 60 L96 72 L104 72Z" fill="${H}" stroke="${O}" stroke-width="2"/>`;
    const ear = `<path d="M58 94 Q46 90 46 102 Q48 114 60 112Z" fill="${SKT}" stroke="${O}" stroke-width="3.5"/>`;
    b += ear + mirror(ear);
    b += `<path d="M62 84 L95 94 M138 84 L105 94" stroke="${O}" stroke-width="6" stroke-linecap="round"/>`;
    b += x.byPose((p) => geyes(p ? '#fffbe0' : LT, { x: 81, y: 101, s: 0.95, sq: p == 1 ? 0.65 : 0.85 }) + evilMouth(p, 100, 134, 12) + `<path d="M96 110 Q100 118 104 110" stroke="${SKTD}" stroke-width="2.5" fill="none"/>`);
    const pads = pad(K, KD, G);
    b += x.arm('L', armX) + pads + x.arm('R', armX) + mirror(pads);
    /* préparation : la foudre tombe dans ses mains levées */
    const [lx, ly] = tip(this, 'L', 1, 52), [rx, ry] = tip(this, 'R', 1, 52);
    b += x.when([1], `<g class="pop">${bolt([[lx - 14, -46], [lx + 6, -20], [lx - 8, -14], [lx, ly - 14]], LT)}${bolt([[rx + 14, -46], [rx - 6, -20], [rx + 8, -14], [rx, ry - 14]], LT)}</g>` + sparks(lx, ly, 22, LT, 6) + sparks(rx, ry, 22, LT, 6));
    const [hx, hy] = tip(this, 'R', 2, 54), T = [200, 180] as const;
    const fxg = x.when([2], `<g class="pop">${zap([[hx, hy], [hx + 18, hy + 4], [hx + 12, hy + 18], [T[0] - 22, T[1] - 12], [T[0] - 8, T[1] - 8]], LT, 7)}</g>` +
      `<g class="pop">${zap([[T[0] + 14, -46], [T[0] - 10, 20], [T[0] + 10, 30], [T[0] - 6, 100], [T[0] + 6, 108], [T[0], T[1] - 14]], LT, 8)}</g>` +
      `<g class="pop">${token(T[0], T[1], 14, '#3c8bf0')}${burst(T[0], T[1] - 18, 22, LT, '#fff')}</g>` + shock(T[0], T[1] + 16, 40, 9, LT) +
      `<g class="pop">${txt(36, -24, 24, LT, 'SHAZAM !', -10)}</g>`);
    return shadow(88) + x.body(b) + fxg;
  },
},
/* ---------- Darkseid (boss final de l'extension) ---------- */
{
  id: 'darkseid', name: 'Darkseid', stats: [5, 2, 5], tint: '#b0402a', tint2: '#200808', mt: '#f2e2e0', mt2: '#d6aaa4', glow: '#ff3b2a', shake: true,
  power: 'Rayons Oméga : deux rayons rebondissent entre les héros et en désactivent 3 ; à 30 % de PV, le Sanction Oméga frappe tout le plateau.', minionTxt: 'Parademons : volent en essaim, très rapides.',
  sh: { L: [40, 150], R: [160, 150] },
  poses: [{ L: 18, R: -18 }, { L: 40, R: -40, body: [0, -8, 0, 1.02, 1.04], head: [0, -4, 1.04] }, { L: 30, R: -30, body: [0, -4, 0, 1.04, 1.02], head: [0, -2, 1.06] }],
  bg() {
    let s = '';
    const r = rnd(97);
    s += `<path d="M-44 232 L-44 120 L-30 120 L-30 60 L-18 60 L-18 110 L4 110 L4 150 L24 150 L24 232Z M176 232 L176 140 L190 140 L190 70 L204 70 L204 30 L216 30 L216 120 L244 120 L244 232Z" fill="#1a0606" opacity=".7"/>`;
    s += `<ellipse cx="100" cy="236" rx="190" ry="40" fill="#ff5a1a" opacity=".22"/>`;
    for (let i = 0; i < 14; i++) s += `<circle cx="${f(-30 + r() * 260)}" cy="${f(-30 + r() * 250)}" r="${f(1.5 + r() * 2.5)}" fill="#ff8a3a" opacity="${f(0.3 + r() * 0.4)}"/>`;
    return s;
  },
  draw(this: CharDef, x: Ctx): string {
    const BL = '#3b4f9a', BLD = '#26346e', ST = '#8a8f9e', STD = '#5c6070', DK = '#23202e', DKD = '#110f18', RE = '#ff3b2a';
    const K = 1.12, sc = (px: number, py: number): [number, number] => [100 + (px - 100) * K, 206 + (py - 206) * K];
    const crack = (sx: number, sy: number): string => `<path d="M${sx - 8} ${sy + 8} l6 6 l-3 7 M${sx + 6} ${sy + 4} l-3 8" stroke="${STD}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    const armIn = (sx: number, sy: number): string => limb(sx, sy, sx, sy + 40, ST, 28) + crack(sx, sy) + shaded((a) => `<rect x="${sx - 18}" y="${sy + 30}" width="36" height="22" rx="7" ${a}/>`, BL, BLD, -3, -3) + `<path d="M${sx - 18} ${sy + 41} H${sx + 18}" stroke="${BLD}" stroke-width="3"/>` + hand(sx, sy + 58, ST, 18);
    let b = '';
    /* buste massif en armure bleue */
    const BIG = 'M4 208 C0 142 46 116 100 114 C154 116 200 142 196 208Z';
    b += bust(BL, BLD, BIG) + gloss(36, 160, 14, 5, -55, 0.22);
    b += `<path d="M44 150 L100 176 L156 150 M54 172 L100 192 L146 172" stroke="${BLD}" stroke-width="4" fill="none" stroke-linejoin="round"/>`;
    b += shaded((a) => `<path d="M10 184 Q100 202 190 184 L192 206 Q100 222 8 206Z" ${a}/>`, DK, DKD, -3, -3);
    b += x.when([1, 2], glow(100, 196, 20, RE));
    b += `<circle cx="100" cy="196" r="14" fill="${DK}" stroke="${O}" stroke-width="4"/>` + x.byPose((p) => omega(100, 197, 0.75, p ? '#ffb0a0' : RE));
    /* col sombre */
    b += shaded((a) => `<path d="M58 126 Q100 142 142 126 L138 144 Q100 160 62 144Z" ${a}/>`, DK, DKD, -3, -3);
    /* tête : casque bleu et visage de pierre */
    let h = '';
    h += shaded((a) => `<path d="M30 122 Q20 22 100 6 Q180 22 170 122 Q170 150 148 160 L52 160 Q30 150 30 122Z" ${a}/>`, BL, BLD, -5, -4) + gloss(64, 34, 16, 6, -30, 0.35);
    h += `<path d="M60 20 Q100 6 140 20 M40 70 Q36 100 44 130 M160 70 Q164 100 156 130" stroke="${BLD}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    const faceS = (a: string): string => `<path d="M54 82 Q54 52 100 50 Q146 52 146 82 L146 124 Q142 164 100 168 Q58 164 54 124Z" ${a}/>`;
    h += shaded(faceS, ST, STD, -4, -4);
    h += clip(faceS, `<g stroke="${STD}" stroke-width="3" fill="none" stroke-linecap="round"><path d="M62 112 Q66 128 62 146 M138 112 Q134 128 138 146 M80 134 Q86 150 84 162 M120 134 Q114 150 116 162 M88 64 l6 8 l-4 6 M118 62 l-4 10"/></g><path d="M54 140 Q100 176 146 140 V180 H54Z" fill="${STD}" opacity=".45"/>`);
    h += hoodShade(faceS, 54, 106, 0.55, '#120406');
    /* arcade sourcilière massive */
    h += shaded((a) => `<path d="M56 84 Q76 72 98 86 L100 92 L102 86 Q124 72 144 84 L142 96 Q122 88 104 98 L96 98 Q78 88 58 96Z" ${a}/>`, ST, STD, -2, -3);
    h += `<path d="M94 100 L92 116 Q100 122 108 116 L106 100" fill="${ST}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`;
    h += x.byPose((p) => {
      let s = geyes(RE, { x: 80, y: 104, s: p ? 1.15 : 1, sq: p == 1 ? 0.7 : 0.8 });
      if (p) s += `<g class="fx"><circle cx="80" cy="104" r="${p == 2 ? 26 : 20}" fill="${RE}" opacity=".3"/><circle cx="120" cy="104" r="${p == 2 ? 26 : 20}" fill="${RE}" opacity=".3"/></g>`;
      s += p == 2 ? evilMouth(2, 100, 136, 14) : `<path d="M84 136 Q100 ${p ? 130 : 132} 116 136" stroke="${O}" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M80 140 Q100 146 120 140" stroke="${STD}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
      return s;
    });
    b += x.head(h);
    /* épaulières énormes */
    const padD = (a: string): string => `<path d="M6 160 Q2 118 38 110 Q74 112 76 150 Q40 168 6 160Z" ${a}/>`;
    const pads = shaded(padD, BL, BLD, -4, -4) + `<path d="M12 148 Q40 158 72 146" stroke="${DK}" stroke-width="4" fill="none"/>` + gloss(28, 124, 10, 4, -30, 0.5);
    b += x.arm('L', armIn) + pads + x.arm('R', armIn) + mirror(pads);
    /* préparation : symboles Oméga autour de la tête */
    b += x.when([1], `<g class="fx">${[[-2, 46], [202, 46], [2, 126], [198, 126]].map(([cx, cy]) => omega(cx!, cy!, 1.2, RE)).join('')}</g>`);
    b = `<g transform="translate(100 206) scale(${K}) translate(-100 -206)">${b}</g>`;
    /* pouvoir : rayons Oméga en zigzag vers deux héros */
    const T1 = [196, 176] as const, T2 = [10, 196] as const;
    const [e1x, e1y] = sc(80, 100), [e2x, e2y] = sc(120, 100);
    const fxg = x.when([2], `<g class="pop">${zap([[e1x, e1y], [44, 84], [-14, 110], [16, 150], [T2[0], T2[1] - 16]], RE, 9)}</g>` +
      `<g class="pop">${zap([[e2x, e2y], [168, 84], [224, 112], [190, 146], [T1[0], T1[1] - 16]], RE, 9)}</g>` +
      `<g class="pop">${token(T1[0], T1[1], 14, '#3c8bf0')}${burst(T1[0], T1[1] - 14, 22, RE, '#ffd0c8')}</g>` +
      `<g class="pop">${token(T2[0], T2[1], 14, '#9b59e6')}${burst(T2[0], T2[1] - 14, 22, RE, '#ffd0c8')}</g>` +
      `<g class="pop">${omega(224, 112, 1.1, '#fff')}${omega(-14, 110, 1.1, '#fff')}</g>`);
    return shadow(100) + x.body(b) + fxg;
  },
}];
