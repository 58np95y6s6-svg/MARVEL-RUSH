// Sbires des Decepticons (design/planches/9-transformers-mechants.html). Les lieutenants (petits boss)
// réutilisent le même dessin en taille ×2. Poses : 0 fiche (marche), 1 préparation, 2 action.
/* eslint-disable */
import { O, f, shaded, gloss, limb, hand, glow, burst, beam, sparks, mirror, shadow, type CharDef, type Ctx } from '../primitives';
import { geyes } from '../kits/villain';
import { decepticon } from '../kits/transformers';

const legs = (c: string, foot = O): string =>
  `<g class="legA">${limb(86, 188, 86, 202, c, 12)}</g><g class="legB">${limb(114, 188, 114, 202, c, 12)}</g><rect x="74" y="200" width="22" height="8" rx="3" fill="${foot}" stroke="${O}" stroke-width="3"/><rect x="104" y="200" width="22" height="8" rx="3" fill="${foot}" stroke="${O}" stroke-width="3"/>`;
const body = (c: string, d: string, w = 38, h = 46): string =>
  shaded((a) => `<rect x="${100 - w}" y="${192 - h}" width="${w * 2}" height="${h}" rx="14" ${a}/>`, c, d, -6, -4) + gloss(100 - w + 12, 192 - h + 8, 8, 3, -20, 0.5);
/** Tête de sbire : casque et visière rouge (ou yeux en amande). */
const head = (x: Ctx, c: string, d: string, visor = '#ff3b3b', eyes = false): string =>
  shaded((a) => `<rect x="70" y="94" width="60" height="50" rx="18" ${a}/>`, c, d, -5, -5) + gloss(84, 102, 8, 4, -30, 0.6) +
  (eyes
    ? x.byPose((p) => geyes(visor, { x: 89, y: 120, s: 0.6, sq: p === 1 ? 0.7 : 1 }))
    : `<g class="fx"><rect x="74" y="110" width="52" height="16" rx="8" fill="${visor}" opacity=".35"/></g><rect x="76" y="113" width="48" height="10" rx="5" fill="${visor}" stroke="${O}" stroke-width="3"/>`);
const armS = (x: Ctx, side: 'L' | 'R', c: string, fist: string, extra = ''): string =>
  x.arm(side, (sx, sy) => limb(sx, sy, sx, sy + 24, c, 11) + hand(sx, sy + 28, fist, 8) + extra);
const wings = (c: string, d: string, flap = true): string => {
  const w = shaded((a) => `<path d="M76 150 L20 120 L26 140 L70 168Z" ${a}/>`, c, d, -2, -2);
  return flap ? `<g class="flap" style="transform-origin:100px 150px">${w}${mirror(w)}</g>` : w + mirror(w);
};

export const TF_MINIONS: Record<string, CharDef> = {
/* Seekers : jets de Starscream */
starscream: {
  id: 'seeker', name: 'Seekers',
  sh: { L: [66, 156], R: [134, 156] },
  poses: [{ L: 12, R: -12 }, { L: 20, R: -60 }, { L: 20, R: -96, body: [6, 0, -6, 1, 1] }],
  draw(this: CharDef, x: Ctx): string {
    const S = '#7a8aaa', SD = '#4f5a78', B = '#3a5ad0', R = '#d8322c';
    let b = wings(S, SD) + legs(SD, B);
    b += body(B, '#22398e', 34, 44) + decepticon(100, 170, 0.5);
    b += head(x, S, SD);
    b += `<path d="M78 94 L84 76 L94 92 M122 94 L116 76 L106 92" fill="${R}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`;
    b += armS(x, 'L', S, SD) + armS(x, 'R', S, SD);
    b += x.when([2], `<g class="grow">${beam(150, 160, 186, 166, 4, '#ff8a2a')}</g><g class="pop">${burst(186, 166, 12, '#ff8a2a', '#fff')}</g>`);
    return shadow(40, 207, 0.18) + x.body(b);
  },
},
/* Insecticons : robots-insectes de Soundwave */
soundwave: {
  id: 'insecticon', name: 'Insecticons',
  sh: { L: [70, 162], R: [130, 162] },
  poses: [{ L: 30, R: -30 }, { L: 50, R: -50 }, { L: 70, R: -70, body: [8, 4, 0, 1, 1] }],
  draw(this: CharDef, x: Ctx): string {
    const P = '#6a3fa8', PD = '#43257a', Y = '#f2c33c', G = '#7dff5a';
    let b = `<g class="flap" style="transform-origin:100px 140px"><ellipse cx="66" cy="128" rx="30" ry="12" fill="#c8e8ff" opacity=".7" stroke="${O}" stroke-width="3" transform="rotate(-24 66 128)"/><ellipse cx="134" cy="128" rx="30" ry="12" fill="#c8e8ff" opacity=".7" stroke="${O}" stroke-width="3" transform="rotate(24 134 128)"/></g>`;
    b += `<g class="legA">${limb(78, 186, 66, 204, PD, 7)}${limb(100, 188, 100, 204, PD, 7)}</g><g class="legB">${limb(122, 186, 134, 204, PD, 7)}</g>`;
    b += shaded((a) => `<ellipse cx="100" cy="172" rx="36" ry="24" ${a}/>`, P, PD, -5, -4) + `<path d="M74 168 H126 M78 180 H122" stroke="${Y}" stroke-width="4"/>`;
    b += shaded((a) => `<ellipse cx="100" cy="132" rx="28" ry="24" ${a}/>`, P, PD, -4, -4);
    b += x.byPose((p) => `<g class="fx"><circle cx="88" cy="130" r="10" fill="${G}" opacity=".35"/><circle cx="112" cy="130" r="10" fill="${G}" opacity=".35"/></g><ellipse cx="88" cy="130" rx="7" ry="${p === 1 ? 5 : 8}" fill="${G}" stroke="${O}" stroke-width="2.5"/><ellipse cx="112" cy="130" rx="7" ry="${p === 1 ? 5 : 8}" fill="${G}" stroke="${O}" stroke-width="2.5"/>`);
    b += `<path d="M90 110 Q80 90 70 92 M110 110 Q120 90 130 92" stroke="${O}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    b += `<path d="M92 150 L96 158 L100 150 L104 158 L108 150" stroke="${O}" stroke-width="3" fill="none"/>`;
    b += x.when([2], `<g class="pop">${sparks(150, 150, 24, G, 6)}</g>`);
    return shadow(38, 207, 0.18) + x.body(b);
  },
},
/* Drones Vehicons (Shockwave) : petits blindés */
shockwave: {
  id: 'drone', name: 'Drones Vehicons',
  sh: { L: [62, 156], R: [138, 156] },
  poses: [{ L: 10, R: -10 }, { L: 16, R: -60 }, { L: 16, R: -92, body: [-4, 0, -4, 1, 1] }],
  draw(this: CharDef, x: Ctx): string {
    const G = '#5a5f78', GD = '#3a3f58', P = '#8a5ad0', Y = '#ffd23a';
    let b = legs(GD, P);
    b += body(G, GD, 40, 48);
    b += shaded((a) => `<rect x="80" y="152" width="40" height="26" rx="5" ${a}/>`, P, '#5a3a98', -2, -2) + decepticon(100, 165, 0.45, '#2a1848');
    b += head(x, G, GD, Y);
    b += armS(x, 'L', GD, P) + armS(x, 'R', GD, P, `<rect x="134" y="170" width="0" height="0"/>`);
    b += x.when([2], `<g class="grow">${beam(150, 166, 188, 170, 5, Y)}</g><g class="pop">${burst(188, 170, 12, Y, '#fff')}</g>`);
    return shadow(44, 207, 0.18) + x.body(b);
  },
},
/* Constructicons (Devastator) : engins de chantier */
devastator: {
  id: 'constructicon', name: 'Constructicons',
  sh: { L: [58, 156], R: [142, 156] },
  poses: [{ L: 10, R: -10 }, { L: 16, R: -150 }, { L: 16, R: -60, body: [6, 6, 4, 1.04, 0.96] }],
  draw(this: CharDef, x: Ctx): string {
    const G = '#4f9a3a', GD = '#2f6a24', Y = '#f2c33c', YD = '#c48a1a', P = '#7a4ab8';
    let b = legs(GD, Y);
    b += body(G, GD, 44, 52);
    b += shaded((a) => `<path d="M60 148 L140 148 L134 166 L66 166Z" ${a}/>`, Y, YD, -2, -2) + `<path d="M68 152 L76 162 M84 152 L92 162 M100 152 L108 162 M116 152 L124 162" stroke="${O}" stroke-width="3"/>`;
    b += decepticon(100, 180, 0.45, P);
    b += head(x, P, '#4f2a86', '#ff4a3a', true);
    b += `<rect x="92" y="80" width="16" height="16" rx="4" fill="${Y}" stroke="${O}" stroke-width="3"/><g class="fx"><circle cx="100" cy="86" r="10" fill="#ffb347" opacity=".4"/></g>`;
    b += armS(x, 'L', G, Y) + armS(x, 'R', G, Y);
    b += x.when([2], `<g class="pop">${burst(160, 196, 18, Y, '#fff')}</g>`);
    return shadow(50, 207, 0.2) + x.body(b);
  },
},
/* Sweeps (Blitzwing) : volants à bouclier */
blitzwing: {
  id: 'sweep', name: 'Sweeps',
  sh: { L: [66, 156], R: [134, 156] },
  poses: [{ L: 12, R: -12 }, { L: 20, R: -70 }, { L: 20, R: -96 }],
  draw(this: CharDef, x: Ctx): string {
    const B = '#3a4a8a', BD = '#22305e', P = '#8a5ad0', IC = '#7fd8ff';
    let b = wings(B, BD);
    b += `<path d="M86 186 Q100 206 114 186" fill="${P}" stroke="${O}" stroke-width="3"/>`;
    b += body(B, BD, 32, 42) + decepticon(100, 170, 0.48, P);
    b += shaded((a) => `<path d="M70 140 Q70 96 100 92 Q130 96 130 140Z" ${a}/>`, P, '#5a3a98', -4, -4);
    b += x.byPose((p) => geyes('#ff5ad8', { x: 89, y: 122, s: 0.6, sq: p === 1 ? 0.7 : 1 }));
    b += `<path d="M84 92 Q100 70 116 92" fill="none" stroke="${O}" stroke-width="6"/><path d="M84 92 Q100 70 116 92" fill="none" stroke="${IC}" stroke-width="3"/>`;
    b += armS(x, 'L', BD, P) + armS(x, 'R', BD, P);
    b += x.when([2], `<g class="grow">${beam(150, 160, 186, 170, 5, IC)}</g><g class="pop">${burst(186, 170, 12, IC, '#fff')}</g>`);
    return shadow(38, 207, 0.16) + x.body(b);
  },
},
/* Vehicons (Megatron) : soldats Decepticons */
megatron: {
  id: 'vehicon', name: 'Vehicons',
  sh: { L: [64, 156], R: [136, 156] },
  poses: [{ L: 10, R: -10 }, { L: 16, R: -80 }, { L: 16, R: -94, body: [-4, 0, -4, 1, 1] }],
  draw(this: CharDef, x: Ctx): string {
    const G = '#3a3550', GD = '#22202e', S = '#9aa0b8', P = '#b05aff';
    let b = legs(GD, S);
    b += body(G, GD, 38, 46);
    b += `<path d="M64 158 L100 176 L136 158" stroke="${P}" stroke-width="5" fill="none"/>` + decepticon(100, 160, 0.42, P);
    b += head(x, S, '#6a7088', P);
    b += `<path d="M72 108 L60 90 L80 100 M128 108 L140 90 L120 100" stroke="${O}" stroke-width="5" stroke-linecap="round"/>`;
    b += armS(x, 'L', G, S) + armS(x, 'R', G, S);
    b += x.when([2], `<g class="grow">${beam(148, 168, 186, 172, 5, P)}</g><g class="pop">${burst(186, 172, 12, P, '#fff')}</g>`);
    return shadow(42, 207, 0.18) + x.body(b);
  },
},
/* Fragments d'Unicron : rocs de métal en fusion */
unicron: {
  id: 'fragment', name: 'Fragments d’Unicron',
  sh: { L: [56, 156], R: [144, 156] },
  poses: [{ L: 14, R: -14 }, { L: 24, R: -40 }, { L: 30, R: -60, body: [6, 4, 4, 1.04, 0.96] }],
  draw(this: CharDef, x: Ctx): string {
    const G = '#5a5a6a', GD = '#3a3a48', OR = '#e8862a', FI = '#ffb347';
    let b = legs(GD, OR);
    b += shaded((a) => `<path d="M58 192 L54 152 L72 120 L100 108 L130 118 L146 150 L142 192Z" ${a}/>`, G, GD, -6, -4);
    b += `<path d="M70 140 L86 156 L80 176 M120 132 L112 150 L128 166" stroke="${FI}" stroke-width="5" fill="none" stroke-linejoin="round"/><path d="M70 140 L86 156 L80 176 M120 132 L112 150 L128 166" stroke="#fff3c0" stroke-width="2" fill="none" stroke-linejoin="round"/>`;
    b += shaded((a) => `<path d="M64 112 L72 82 L84 100 L100 72 L116 100 L128 82 L136 112Z" ${a}/>`, OR, '#a8541a', -2, -2);
    b += x.byPose((p) => geyes('#ff3b3b', { x: 88, y: 132, s: 0.7, sq: p === 1 ? 0.7 : 1 }));
    b += armS(x, 'L', GD, G) + armS(x, 'R', GD, G);
    b += x.when([2], `<g class="pop">${burst(156, 192, 18, FI, '#fff')}${sparks(156, 192, 24, FI, 6)}</g>`);
    return shadow(50, 207, 0.2) + x.body(b) + glow(100, 150, 4, FI).replace('class="fx"', 'class="fx" opacity=".0"');
  },
},
};
void f;
