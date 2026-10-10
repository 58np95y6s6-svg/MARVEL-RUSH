// Sbires des méchants Pixar (design/planches/11-pixar-mechants.html). Les lieutenants (petits boss) réutilisent le
// même dessin en taille ×2. Poses : 0 fiche (marche), 1 préparation, 2 action.
/* eslint-disable */
import { O, f, shaded, gloss, limb, hand, glow, burst, beam, sparks, mirror, shadow, type CharDef, type Ctx } from '../primitives';
import { geyes } from '../kits/villain';

const legs = (c: string, foot = O, w = 12): string =>
  `<g class="legA">${limb(86, 188, 86, 202, c, w)}</g><g class="legB">${limb(114, 188, 114, 202, c, w)}</g><rect x="74" y="200" width="22" height="8" rx="3" fill="${foot}" stroke="${O}" stroke-width="3"/><rect x="104" y="200" width="22" height="8" rx="3" fill="${foot}" stroke="${O}" stroke-width="3"/>`;
const pawLegs = (c: string): string =>
  `<g class="legA">${limb(76, 186, 72, 204, c, 11)}${limb(124, 186, 128, 204, c, 11)}</g><g class="legB">${limb(90, 188, 92, 204, c, 11)}${limb(110, 188, 108, 204, c, 11)}</g>`;
const armS = (x: Ctx, side: 'L' | 'R', c: string, fist: string, extra = ''): string =>
  x.arm(side, (sx, sy) => limb(sx, sy, sx, sy + 24, c, 11) + hand(sx, sy + 28, fist, 8) + extra);
const eyes2 = (p: number, cx: number, cy: number, gap: number, iris = O, r = 7): string =>
  [cx - gap, cx + gap].map((ex) => `<ellipse cx="${ex}" cy="${cy}" rx="${r}" ry="${p === 1 ? r * 0.6 : r}" fill="#fff" stroke="${O}" stroke-width="2.5"/><circle cx="${ex + 1.5}" cy="${cy + 1}" r="${r * 0.5}" fill="${iris}"/>`).join('');

export const PIXAR_MINIONS: Record<string, CharDef> = {
/* Robots de Syndrome : boules noires à pattes */
syndrome: {
  id: 'omnidroid', name: 'Robots de Syndrome',
  sh: { L: [62, 160], R: [138, 160] },
  poses: [{ L: 20, R: -20 }, { L: 30, R: -70 }, { L: 30, R: -100, body: [6, 0, -6, 1, 1] }],
  draw(this: CharDef, x: Ctx): string {
    const K = '#2b2838', KD = '#15131f', R = '#e8283c', G = '#8a8aa0';
    let b = `<g class="legA">${limb(70, 176, 56, 204, G, 8)}${limb(130, 176, 144, 204, G, 8)}</g><g class="legB">${limb(84, 180, 80, 204, G, 8)}${limb(116, 180, 120, 204, G, 8)}</g>`;
    b += shaded((a) => `<ellipse cx="100" cy="152" rx="44" ry="38" ${a}/>`, K, KD, -6, -5) + gloss(80, 130, 10, 5, -30, 0.5);
    b += `<rect x="70" y="138" width="60" height="16" rx="8" fill="${R}" stroke="${O}" stroke-width="3"/><g class="fx"><rect x="66" y="134" width="68" height="24" rx="12" fill="${R}" opacity=".3"/></g>`;
    b += armS(x, 'L', G, K) + armS(x, 'R', G, K);
    b += x.when([2], `<g class="grow">${beam(150, 160, 190, 166, 4, R)}</g><g class="pop">${burst(190, 166, 12, R, '#fff')}</g>`);
    return shadow(44, 207, 0.18) + x.body(b);
  },
},
/* Monstres de Monstropolis : petit monstre rond orange à cornes */
randall: {
  id: 'monstre', name: 'Monstres de Monstropolis',
  sh: { L: [66, 160], R: [134, 160] },
  poses: [{ L: 14, R: -14 }, { L: 30, R: -60 }, { L: 40, R: -110, body: [6, -4, 6, 1, 1] }],
  draw(this: CharDef, x: Ctx): string {
    const C = '#f08a3a', CD = '#b85a16', H = '#f4f0d8';
    let b = legs(C, CD, 12);
    b += `<path d="M78 110 L70 88 L88 104Z M122 110 L130 88 L112 104Z" fill="${H}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`;
    b += shaded((a) => `<ellipse cx="100" cy="150" rx="40" ry="42" ${a}/>`, C, CD, -6, -5) + gloss(84, 122, 9, 5, -30, 0.5);
    b += `<g fill="${CD}" opacity=".7"><circle cx="76" cy="160" r="5"/><circle cx="124" cy="172" r="6"/><circle cx="110" cy="182" r="3"/></g>`;
    b += x.byPose((p) => eyes2(p, 100, 138, 13, '#5a2a8a', 8) + (p === 2 ? `<path d="M84 156 Q100 152 116 156 Q110 172 100 172 Q90 172 84 156Z" fill="#5a1020" stroke="${O}" stroke-width="3"/><path d="M88 157 l3 6 l3 -6 M106 157 l3 6 l3 -6" fill="#fff"/>` : `<path d="M86 158 Q100 166 114 156" stroke="${O}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`));
    b += armS(x, 'L', C, CD) + armS(x, 'R', C, CD);
    return shadow(40, 207, 0.18) + x.body(b);
  },
},
/* Jouets de Sunnyside : singe à cymbales */
lotso: {
  id: 'singe', name: 'Jouets de Sunnyside',
  sh: { L: [64, 160], R: [136, 160] },
  poses: [{ L: 40, R: -40 }, { L: 80, R: -80 }, { L: 40, R: -40, body: [0, -4, 0, 1, 1.03] }],
  draw(this: CharDef, x: Ctx): string {
    const B = '#8a5a3a', BD = '#5e3b22', MZ = '#e8c8a0', R = '#d8382c', Y = '#f6c83a';
    let b = legs(B, BD, 12);
    b += shaded((a) => `<rect x="70" y="148" width="60" height="44" rx="14" ${a}/>`, R, '#9b1d20', -5, -4);
    b += shaded((a) => `<circle cx="100" cy="126" r="32" ${a}/>`, B, BD, -5, -5) + `<circle cx="66" cy="124" r="10" fill="${MZ}" stroke="${O}" stroke-width="3"/><circle cx="134" cy="124" r="10" fill="${MZ}" stroke="${O}" stroke-width="3"/>`;
    b += shaded((a) => `<ellipse cx="100" cy="138" rx="22" ry="16" ${a}/>`, MZ, '#c8a880', -2, -2);
    b += x.byPose((p) => eyes2(p, 100, 118, 11, '#c82a2a', 7) + `<path d="M88 144 Q100 ${p === 2 ? 156 : 150} 112 144" stroke="${O}" stroke-width="3" fill="${p === 2 ? '#5a1020' : 'none'}"/>`);
    const cym = (sx: number, sy: number) => `<ellipse cx="${sx}" cy="${sy + 34}" rx="14" ry="5" fill="${Y}" stroke="${O}" stroke-width="3"/>`;
    b += armS(x, 'L', B, MZ, cym(64, 160)) + armS(x, 'R', B, MZ, cym(136, 160));
    b += x.when([2], `<g class="pop">${sparks(100, 100, 30, Y, 8)}</g>`);
    return shadow(40, 207, 0.18) + x.body(b);
  },
},
/* Sauterelles */
hopper: {
  id: 'sauterelle', name: 'Sauterelles',
  sh: { L: [72, 162], R: [128, 162] },
  poses: [{ L: 30, R: -30 }, { L: 50, R: -50 }, { L: 70, R: -70, body: [8, 4, 0, 1, 1] }],
  draw(this: CharDef, x: Ctx): string {
    const G = '#9aa85a', GD = '#6a7832', W = '#d8e8c0';
    let b = `<g class="flap" style="transform-origin:100px 140px"><ellipse cx="64" cy="132" rx="32" ry="12" fill="${W}" opacity=".7" stroke="${O}" stroke-width="3" transform="rotate(-24 64 132)"/><ellipse cx="136" cy="132" rx="32" ry="12" fill="${W}" opacity=".7" stroke="${O}" stroke-width="3" transform="rotate(24 136 132)"/></g>`;
    b += `<g class="legA"><path d="M80 176 L60 150 L56 204" stroke="${O}" stroke-width="10" fill="none" stroke-linejoin="round"/><path d="M80 176 L60 150 L56 204" stroke="${GD}" stroke-width="5" fill="none" stroke-linejoin="round"/></g><g class="legB"><path d="M120 176 L140 150 L144 204" stroke="${O}" stroke-width="10" fill="none" stroke-linejoin="round"/><path d="M120 176 L140 150 L144 204" stroke="${GD}" stroke-width="5" fill="none" stroke-linejoin="round"/></g>`;
    b += shaded((a) => `<ellipse cx="100" cy="166" rx="30" ry="26" ${a}/>`, G, GD, -5, -4);
    b += shaded((a) => `<ellipse cx="100" cy="126" rx="26" ry="24" ${a}/>`, G, GD, -5, -5);
    b += `<path d="M90 106 Q80 80 66 76 M110 106 Q120 80 134 76" stroke="${O}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    b += x.byPose((p) => geyes('#d84a2a', { x: 89, y: 124, s: 0.6, sq: p === 1 ? 0.7 : 1 }));
    b += `<path d="M92 142 L88 150 M108 142 L112 150" stroke="${O}" stroke-width="3" stroke-linecap="round"/>`;
    return shadow(36, 207, 0.18) + x.body(b);
  },
},
/* Chiens de Muntz : dogue à collier traducteur */
muntz: {
  id: 'chien', name: 'Chiens de Muntz',
  sh: { L: [70, 168], R: [130, 168] },
  poses: [{ L: 0, R: 0 }, { L: 0, R: 0, body: [0, 2, -4, 1, 1] }, { L: 0, R: 0, body: [8, -4, 6, 1, 1] }],
  draw(this: CharDef, x: Ctx): string {
    const D = '#4a4a5a', DD = '#2b2b38', T = '#a88a6a', C = '#c8c8d6', G = '#7ad8ff';
    let b = pawLegs(D);
    b += shaded((a) => `<ellipse cx="100" cy="172" rx="38" ry="22" ${a}/>`, D, DD, -5, -4);
    b += `<path d="M64 112 L52 94 L58 132Z M136 112 L148 94 L142 132Z" fill="${DD}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`;
    b += shaded((a) => `<ellipse cx="100" cy="128" rx="36" ry="30" ${a}/>`, D, DD, -5, -5) + gloss(84, 108, 8, 4, -30, 0.5);
    b += shaded((a) => `<ellipse cx="100" cy="144" rx="20" ry="13" ${a}/>`, T, '#7a5e42', -2, -2) + `<ellipse cx="100" cy="136" rx="7" ry="5" fill="${O}"/>`;
    b += x.byPose((p) => geyes('#ffcc3a', { x: 86, y: 120, s: 0.55, sq: p === 1 ? 0.6 : 1 }) + (p === 2 ? `<path d="M88 150 Q100 162 112 150Z" fill="#5a1020" stroke="${O}" stroke-width="2.5"/><path d="M90 151 l2 5 M110 151 l-2 5" stroke="#fff" stroke-width="2.5"/>` : ''));
    b += `<rect x="78" y="154" width="44" height="10" rx="4" fill="${C}" stroke="${O}" stroke-width="2.5"/><circle cx="100" cy="159" r="4" fill="${G}" stroke="${O}" stroke-width="1.5"/>`;
    return shadow(42, 207, 0.18) + x.body(b);
  },
},
/* Robots de Zurg */
zurg: {
  id: 'robotzurg', name: 'Robots de Zurg',
  sh: { L: [64, 158], R: [136, 158] },
  poses: [{ L: 12, R: -12 }, { L: 20, R: -60 }, { L: 20, R: -96, body: [6, 0, -6, 1, 1] }],
  draw(this: CharDef, x: Ctx): string {
    const P = '#7a4ac8', PD = '#4a2a8a', K = '#2b2838', R = '#ff3b6a';
    let b = legs(K, PD);
    b += shaded((a) => `<rect x="66" y="146" width="68" height="46" rx="12" ${a}/>`, P, PD, -6, -4) + gloss(78, 154, 8, 3, -20, 0.5);
    b += `<rect x="86" y="156" width="28" height="18" rx="4" fill="${K}" stroke="${O}" stroke-width="2.5"/><circle cx="100" cy="165" r="5" fill="${R}"/>`;
    b += shaded((a) => `<path d="M72 144 Q70 96 100 94 Q130 96 128 144Z" ${a}/>`, K, '#15131f', -5, -5);
    b += `<path d="M76 106 L66 84 L84 98 M124 106 L134 84 L116 98" fill="#c8c8d6" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`;
    b += x.byPose((p) => geyes(R, { x: 89, y: 122, s: 0.6, sq: p === 1 ? 0.7 : 1 }));
    b += armS(x, 'L', P, K) + armS(x, 'R', P, K, `<rect x="128" y="182" width="16" height="10" rx="3" fill="${K}" stroke="${O}" stroke-width="2.5"/>`);
    b += x.when([2], `<g class="grow">${beam(150, 166, 190, 170, 4, R)}</g><g class="pop">${burst(190, 170, 12, R, '#fff')}</g>`);
    return shadow(40, 207, 0.18) + x.body(b);
  },
},
};
