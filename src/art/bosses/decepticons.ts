// Decepticons (design/planches/9-transformers-mechants.html), dans le traitement « méchant » des boss :
// chibi trapu, palette sombre, visage dans l'ombre, yeux rouges lumineux, trois poses (repos, préparation,
// pouvoir). Starscream, Soundwave, Shockwave, Devastator, Blitzwing, Megatron et Unicron.
/* eslint-disable */
import { O, f, shaded, gloss, limb, hand, star, glow, burst, beam, bolt, sparks, mirror, shadow, tip, type CharDef, type Ctx } from '../primitives';
import { hoodShade, geyes, evilMouth, txt, rnd, twinkle } from '../kits/villain';
import { decepticon, swoosh, shock } from '../kits/transformers';

const BUST = 'M24 206 C20 152 54 128 100 126 C146 128 180 152 176 206Z';
const bust = (c: string, d: string, path = BUST): string => shaded((a) => `<path d="${path}" ${a}/>`, c, d, -10, -4);
/** Épaulière carrée de robot (gauche ; `mirror` pour la droite). */
const padS = (a: string): string => `<path d="M20 160 L22 126 Q40 114 70 120 L76 150 Q48 164 20 160Z" ${a}/>`;
const pad = (c: string, d: string): string => shaded(padS, c, d, -4, -4) + gloss(38, 128, 9, 4, -20, 0.5);
/** Tête de robot méchant : visage sombre, yeux rouges, casque. */
const darkFace = (a: string): string => `<path d="M56 98 Q54 52 100 48 Q146 52 144 98 L140 128 Q132 156 100 160 Q68 156 60 128Z" ${a}/>`;
function villainHead(x: Ctx, face: string, faceD: string, eye = '#ff3b3b', mouth = true): string {
  let s = shaded(darkFace, face, faceD, -4, -4) + hoodShade(darkFace, 52, 116, 0.5, '#0a0716');
  s += x.byPose((p) => geyes(eye, { y: 100, s: 1.05, sq: p === 1 ? 0.75 : 1 }) + (mouth ? evilMouth(p, 100, 132, 13) : ''));
  return s;
}
/** Bras de robot épais. */
const arm = (sx: number, sy: number, c: string, d: string, fist: string, w = 22): string =>
  limb(sx, sy, sx, sy + 40, c, w) + shaded((a) => `<rect x="${sx - 14}" y="${sy + 16}" width="28" height="14" rx="5" ${a}/>`, d, O, -1, -1) + hand(sx, sy + 46, fist, 15);
const dstars = (seed: number, c = '#d8c4ff') => {
  const r = rnd(seed);
  let s = '';
  for (let i = 0; i < 9; i++) s += twinkle(f(-30 + r() * 260), f(-36 + r() * 120), f(3 + r() * 3), c, 0.5);
  return s;
};

export const TF_BOSSES: CharDef[] = [
/* ---------- Starscream ---------- */
{
  id: 'starscream', name: 'Starscream', stats: [3, 5, 3], tint: '#5a6a9a', tint2: '#141a34', glow: '#ff5a5a',
  power: 'Missiles en piqué : 2 unités étourdies.', minionTxt: 'Seekers : volent vite, en duo.',
  sh: { L: [44, 152], R: [156, 152] },
  poses: [{ L: 18, R: -18 }, { L: 30, R: -150, body: [2, -6, 4, 1, 1.03] }, { L: 40, R: -100, body: [-6, -2, -6, 1, 1] }],
  bg() { return dstars(7) + `<path d="M-30 200 Q60 170 120 190 T250 180" stroke="#2a3466" stroke-width="18" fill="none" opacity=".5"/>`; },
  draw(this: CharDef, x: Ctx): string {
    const S = '#c8ccd8', SD = '#8a90a6', R = '#d8322c', RD = '#9b1d27', B = '#2f5fd0', BD = '#1f3f95', MS = '#ff8a2a';
    let b = '';
    /* ailes de jet dans le dos */
    const wing = shaded((a) => `<path d="M60 150 L-26 100 L-30 120 L44 178Z" ${a}/>`, S, SD, -3, -3) + `<path d="M-14 112 L30 146" stroke="${R}" stroke-width="6"/>`;
    b += wing + mirror(wing);
    b += bust(S, SD);
    b += shaded((a) => `<path d="M66 140 L134 140 L126 176 L74 176Z" ${a}/>`, B, BD, -3, -3);
    b += `<path d="M76 148 L96 148 L94 168 L80 168Z M104 148 L124 148 L120 168 L106 168Z" fill="#8fd0f4" stroke="${O}" stroke-width="3"/>`;
    b += decepticon(100, 192, 0.7);
    b += pad(R, RD) + mirror(pad(R, RD));
    b += villainHead(x, '#5a5f78', '#3a3f58');
    /* casque en couronne pointue */
    b += shaded((a) => `<path d="M48 104 L44 40 L72 62 L84 20 L100 50 L116 20 L128 62 L156 40 L152 104 Q148 70 100 64 Q52 70 48 104Z" ${a}/>`, S, SD, -4, -4);
    b += `<path d="M84 20 L100 50 L116 20" fill="${R}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`;
    b += x.arm('L', (sx, sy) => arm(sx, sy, R, RD, S));
    b += x.arm('R', (sx, sy) => arm(sx, sy, R, RD, S));
    const missile = (mx: number, my: number, a: number) => `<g transform="translate(${mx} ${my}) rotate(${a})"><rect x="-6" y="-24" width="12" height="40" rx="6" fill="${S}" stroke="${O}" stroke-width="3"/><path d="M-6 -16 L0 -32 L6 -16Z" fill="${R}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M-4 16 Q0 34 4 16" fill="${MS}" stroke="${O}" stroke-width="2.5"/></g>`;
    b += x.when([1], glow(...tip(this, 'R', 1, 46), 18, MS));
    b += x.when([2], `<g class="fly">${missile(196, 120, 120)}${missile(218, 170, 130)}</g><g class="pop">${burst(216, 196, 26, MS, '#ffe27a')}</g>`);
    return shadow(70, 207, 0.2) + x.body(b);
  },
},
/* ---------- Soundwave ---------- */
{
  id: 'soundwave', name: 'Soundwave', stats: [3, 3, 5], tint: '#3a4a8a', tint2: '#0e1430', glow: '#ff5ad8',
  power: 'Brouillage : 3 unités perdent leurs améliorations.', minionTxt: 'Insecticons : essaim de 4.',
  sh: { L: [44, 152], R: [156, 152] },
  poses: [{ L: 16, R: -16 }, { L: 26, R: -40, body: [0, -4, 0, 1, 1.03] }, { L: 30, R: -60, body: [-4, -2, -3, 1.02, 1] }],
  bg() { return dstars(13, '#9ab0ff') + [0, 1, 2].map((i) => `<path d="M-30 ${150 + i * 20} q20 -20 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#3a4a9a" stroke-width="4" fill="none" opacity=".5"/>`).join(''); },
  draw(this: CharDef, x: Ctx): string {
    const B = '#3a5ad0', BD = '#22398e', W = '#d8dce8', WD = '#9aa0b8', Y = '#f6c64a', V = '#ff5ad8';
    let b = '';
    b += bust(B, BD);
    /* lecteur de cassettes sur la poitrine */
    b += shaded((a) => `<rect x="62" y="140" width="76" height="50" rx="6" ${a}/>`, W, WD, -3, -3);
    b += `<rect x="70" y="148" width="60" height="30" rx="4" fill="${Y}" stroke="${O}" stroke-width="3"/><circle cx="86" cy="163" r="7" fill="${O}"/><circle cx="114" cy="163" r="7" fill="${O}"/><rect x="92" y="158" width="16" height="10" fill="#8a6a1a"/>`;
    b += x.when([1, 2], `<g class="spin fast"><circle cx="86" cy="163" r="5" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="3 3"/></g>`);
    b += pad(B, BD) + mirror(pad(B, BD));
    /* canon d'épaule */
    b += `<rect x="142" y="104" width="42" height="14" rx="5" fill="${WD}" stroke="${O}" stroke-width="3.5"/>`;
    /* tête : visière rose et plaque buccale */
    b += shaded(darkFace, '#2a2f4a', '#161a30', -4, -4);
    b += x.byPose((p) => `<g class="fx"><rect x="58" y="${p === 1 ? 86 : 88}" width="84" height="26" rx="12" fill="${V}" opacity=".35"/></g><path d="M60 92 Q100 ${p === 2 ? 84 : 86} 140 92 L136 110 Q100 104 64 110Z" fill="${V}" stroke="${O}" stroke-width="4" stroke-linejoin="round"/><path d="M68 95 Q84 91 98 93" stroke="#fff" stroke-width="3" fill="none" opacity=".8"/>`);
    b += shaded((a) => `<path d="M70 118 L130 118 L124 150 Q100 158 76 150Z" ${a}/>`, W, WD, -2, -2) + `<path d="M84 128 H116 M86 138 H114" stroke="${WD}" stroke-width="3"/>`;
    b += shaded((a) => `<path d="M48 108 L46 44 Q60 26 100 24 Q140 26 154 44 L152 108 L140 104 Q138 70 100 66 Q62 70 60 104Z" ${a}/>`, B, BD, -4, -4);
    b += shaded((a) => `<path d="M84 26 L100 4 L116 26Z" ${a}/>`, W, WD, -2, -2);
    b += x.arm('L', (sx, sy) => arm(sx, sy, W, WD, B));
    b += x.arm('R', (sx, sy) => arm(sx, sy, W, WD, B));
    b += x.when([2], `<g class="ring">${[0, 1, 2].map((i) => `<path d="M${180 + i * 18} 100 q16 40 0 80" stroke="${V}" stroke-width="${6 - i}" fill="none" stroke-linecap="round" opacity="${0.9 - i * 0.2}"/>`).join('')}</g><g class="pop">${txt(196, 86, 18, '#fff', 'BZZT !', 8)}</g>`);
    return shadow(70, 207, 0.2) + x.body(b);
  },
},
/* ---------- Shockwave ---------- */
{
  id: 'shockwave', name: 'Shockwave', stats: [4, 3, 4], tint: '#5a3a8a', tint2: '#180c30', glow: '#ffd23a',
  power: 'Rayon de Kaon : transforme une unité.', minionTxt: 'Drones Vehicons : blindés.',
  sh: { L: [44, 152], R: [156, 152] },
  poses: [{ L: 16, R: -16 }, { L: 24, R: -90, body: [0, -4, 0, 1, 1.03] }, { L: 30, R: -96, body: [-6, 0, -5, 1, 1] }],
  bg() { return dstars(21, '#ffe9a0') + `<g opacity=".4">${[0, 1, 2, 3].map((i) => `<rect x="${-30 + i * 70}" y="${150 - i * 8}" width="40" height="90" fill="#2a1848"/>`).join('')}</g>`; },
  draw(this: CharDef, x: Ctx): string {
    const P = '#7a4ab8', PD = '#4f2a86', G = '#9aa0b8', GD = '#6a7088', Y = '#ffd23a';
    let b = '';
    b += bust(P, PD);
    b += shaded((a) => `<path d="M64 140 L136 140 L130 184 L70 184Z" ${a}/>`, G, GD, -3, -3);
    b += decepticon(100, 162, 0.75);
    b += pad(P, PD) + mirror(pad(P, PD));
    /* tête sans visage : un seul grand œil jaune */
    const hs = (a: string) => `<path d="M58 140 L54 66 Q56 40 100 38 Q144 40 146 66 L142 140 Q100 152 58 140Z" ${a}/>`;
    b += shaded(hs, P, PD, -4, -4);
    b += `<path d="M54 66 L34 30 L60 50 M146 66 L166 30 L140 50" stroke="${O}" stroke-width="9" stroke-linecap="round"/><path d="M54 66 L34 30 L60 50 M146 66 L166 30 L140 50" stroke="${G}" stroke-width="5" stroke-linecap="round"/>`;
    b += `<circle cx="100" cy="94" r="30" fill="#1a1030" stroke="${O}" stroke-width="5"/>`;
    b += x.byPose((p) => `<g class="fx"><circle cx="100" cy="94" r="${p ? 30 : 24}" fill="${Y}" opacity=".35"/></g><circle cx="100" cy="94" r="${p === 1 ? 16 : 20}" fill="${Y}" stroke="${O}" stroke-width="3"/><circle cx="94" cy="88" r="5" fill="#fff"/>`);
    b += gloss(76, 56, 12, 5, -20, 0.4);
    b += x.arm('L', (sx, sy) => arm(sx, sy, G, GD, P));
    /* bras canon */
    b += x.arm('R', (sx, sy) => limb(sx, sy, sx, sy + 30, G, 22) + shaded((a) => `<rect x="${sx - 13}" y="${sy + 26}" width="26" height="42" rx="7" ${a}/>`, '#3a3550', O, -2, -2) + `<circle cx="${sx}" cy="${sy + 68}" r="7" fill="${Y}" stroke="${O}" stroke-width="3"/>`);
    const [hx, hy] = tip(this, 'R', 2, 70);
    b += x.when([2], `<g class="grow">${beam(hx, hy, hx + 90, hy + 6, 9, Y)}</g><g class="pop">${burst(f(hx + 90), f(hy + 6), 22, Y, '#fff')}</g>`);
    return shadow(70, 207, 0.2) + x.body(b);
  },
},
/* ---------- Devastator ---------- */
{
  id: 'devastator', name: 'Devastator', stats: [5, 1, 5], tint: '#4a6a3a', tint2: '#14200e', glow: '#ff4a3a', shake: true,
  power: 'Poing de Devastator : une colonne étourdie ; se reforme une fois.', minionTxt: 'Constructicons : lents et blindés.',
  sh: { L: [36, 150], R: [164, 150] },
  poses: [{ L: 14, R: -14 }, { L: 20, R: -160, body: [0, -6, 0, 1, 1.04] }, { L: 30, R: -60, body: [6, 6, 6, 1.04, 0.96] }],
  bg() { return `<g opacity=".5"><path d="M-40 200 L10 120 L60 200Z M150 210 L200 110 L250 210Z" fill="#2a3a1e"/></g>` + dstars(31, '#fff0b0'); },
  draw(this: CharDef, x: Ctx): string {
    const G = '#4f9a3a', GD = '#2f6a24', P = '#7a4ab8', PD = '#4f2a86', Y = '#f2c33c', YD = '#c48a1a';
    let b = '';
    b += bust(G, GD, 'M10 206 C6 142 50 118 100 116 C150 118 194 142 190 206Z');
    b += shaded((a) => `<path d="M58 132 L142 132 L136 186 L64 186Z" ${a}/>`, P, PD, -3, -3);
    b += `<path d="M66 144 H134 M68 158 H132 M70 172 H130" stroke="${PD}" stroke-width="4"/>`;
    b += decepticon(100, 158, 0.8);
    /* pièces de Constructicons : bennes et grues */
    b += shaded((a) => `<path d="M8 150 L14 112 L60 116 L58 150Z" ${a}/>`, Y, YD, -3, -3) + mirror(shaded((a) => `<path d="M8 150 L14 112 L60 116 L58 150Z" ${a}/>`, Y, YD, -3, -3));
    b += `<path d="M150 116 L196 40" stroke="${O}" stroke-width="10"/><path d="M150 116 L196 40" stroke="${Y}" stroke-width="5"/>`;
    b += villainHead(x, '#5a5f78', '#3a3f58', '#ff4a3a', false);
    b += shaded((a) => `<path d="M64 124 L136 124 L130 150 Q100 160 70 150Z" ${a}/>`, '#9aa0b8', '#6a7088', -2, -2) + `<path d="M80 134 H120 M84 142 H116" stroke="#6a7088" stroke-width="3"/>`;
    b += shaded((a) => `<path d="M46 110 L48 44 Q60 26 100 24 Q140 26 152 44 L154 110 L140 106 Q138 74 100 70 Q62 74 60 106Z" ${a}/>`, P, PD, -4, -4);
    b += `<rect x="80" y="30" width="40" height="12" rx="4" fill="${G}" stroke="${O}" stroke-width="3"/>`;
    b += x.arm('L', (sx, sy) => arm(sx, sy, G, GD, P, 28));
    b += x.arm('R', (sx, sy) => arm(sx, sy, G, GD, P, 28));
    b += x.when([2], `${shock(160, 210, 70, 16, Y)}<g class="pop">${burst(160, 196, 30, Y, '#fff')}</g><g class="pop">${txt(180, 150, 20, '#fff', 'BOUM !', -8)}</g>`);
    return shadow(86, 207, 0.22) + x.body(b);
  },
},
/* ---------- Blitzwing ---------- */
{
  id: 'blitzwing', name: 'Blitzwing', stats: [4, 3, 4], tint: '#4a3a7a', tint2: '#120c26', glow: '#7fd8ff',
  power: 'Glace et feu : gèle une ligne ou affaiblit 2 unités.', minionTxt: 'Sweeps : volent en duo.',
  sh: { L: [44, 152], R: [156, 152] },
  poses: [{ L: 16, R: -16 }, { L: 150, R: -150, body: [0, -6, 0, 1, 1.03] }, { L: 96, R: -96, body: [0, -2, 0, 1.03, 1] }],
  bg() { return `<rect x="-40" y="-46" width="140" height="280" fill="#2a4a7a" opacity=".35"/><rect x="100" y="-46" width="140" height="280" fill="#7a2a1a" opacity=".35"/>` + dstars(41, '#e0f4ff'); },
  draw(this: CharDef, x: Ctx): string {
    const P = '#6a4aa8', PD = '#45287a', BR = '#8a5a3a', BRD = '#5a3a24', IC = '#7fd8ff', FI = '#ff7a2a';
    let b = '';
    const wing = shaded((a) => `<path d="M56 148 L-20 120 L-16 142 L40 172Z" ${a}/>`, P, PD, -3, -3);
    b += wing + mirror(wing);
    b += bust(BR, BRD);
    b += shaded((a) => `<path d="M64 140 L136 140 L130 182 L70 182Z" ${a}/>`, P, PD, -3, -3);
    b += decepticon(100, 160, 0.72);
    b += pad(P, PD) + mirror(pad(P, PD));
    /* visage à double personnalité : moitié glace (bleue), moitié feu (rouge) */
    b += shaded(darkFace, '#3a3550', '#24203a', -4, -4);
    b += x.byPose((p) => {
      const ice = `<g class="fx"><circle cx="82" cy="100" r="18" fill="${IC}" opacity=".3"/><circle cx="118" cy="100" r="18" fill="${FI}" opacity=".3"/></g><rect x="68" y="${p === 1 ? 95 : 93}" width="28" height="${p === 1 ? 9 : 13}" rx="5" fill="${IC}" stroke="${O}" stroke-width="3"/>`;
      const fire = `<g transform="translate(118 100) scale(-1.05 1.05)"><path d="M-12 -6 L11 1 Q9 9 0 9 Q-11 8 -12 -6Z" fill="${FI}"/><path d="M-12 -6 L11 1" stroke="${O}" stroke-width="3.2" stroke-linecap="round"/><ellipse cx="-1" cy="3.5" rx="4.6" ry="2.6" fill="#fffbe6"/></g>`;
      return ice + fire + evilMouth(p, 100, 134, 13);
    });
    b += shaded((a) => `<path d="M46 108 L46 46 Q60 26 100 24 L100 66 Q62 70 60 104Z" ${a}/>`, IC, '#3a9ad0', -3, -3);
    b += shaded((a) => `<path d="M154 108 L154 46 Q140 26 100 24 L100 66 Q138 70 140 104Z" ${a}/>`, FI, '#c44a14', -3, -3);
    b += `<path d="M66 28 L60 6 L80 22 M134 28 L140 6 L120 22" stroke="${O}" stroke-width="7" stroke-linecap="round"/>`;
    b += x.arm('L', (sx, sy) => arm(sx, sy, BR, BRD, IC));
    b += x.arm('R', (sx, sy) => arm(sx, sy, BR, BRD, FI));
    b += x.when([1], glow(...tip(this, 'L', 1, 46), 18, IC) + glow(...tip(this, 'R', 1, 46), 18, FI));
    const [lx, ly] = tip(this, 'L', 2, 50), [rx, ry] = tip(this, 'R', 2, 50);
    b += x.when([2], `<g class="grow">${beam(lx, ly, lx - 60, ly + 60, 8, IC)}${beam(rx, ry, rx + 60, ry + 60, 8, FI)}</g><g class="pop">${burst(f(lx - 60), f(ly + 60), 20, IC, '#fff')}${burst(f(rx + 60), f(ry + 60), 20, FI, '#ffe27a')}</g>`);
    return shadow(70, 207, 0.2) + x.body(b);
  },
},
/* ---------- Megatron ---------- */
{
  id: 'megatron', name: 'Megatron', stats: [5, 3, 5], tint: '#4a4a6a', tint2: '#0e0c1a', glow: '#b05aff', shake: true,
  power: 'Canon à fusion, renforts Vehicons, Tyrannie à 30 % de PV.', minionTxt: 'Vehicons : soldats en trio.',
  sh: { L: [42, 150], R: [158, 150] },
  poses: [{ L: 16, R: -16 }, { L: 24, R: -100, body: [2, -4, 2, 1, 1.03] }, { L: 30, R: -94, body: [-8, 0, -6, 1, 1] }],
  bg() { return dstars(53, '#c8a0ff') + `<circle cx="200" cy="10" r="40" fill="#5a2a8a" opacity=".45"/>`; },
  draw(this: CharDef, x: Ctx): string {
    const S = '#b8bdcc', SD = '#7a8098', K = '#3a3550', KD = '#22202e', PU = '#b05aff', R = '#d8322c';
    let b = '';
    b += bust(S, SD, 'M16 206 C12 146 52 122 100 120 C148 122 188 146 184 206Z');
    b += shaded((a) => `<path d="M60 136 L140 136 L132 186 L68 186Z" ${a}/>`, K, KD, -3, -3);
    b += decepticon(100, 160, 0.95, PU);
    b += pad(S, SD) + mirror(pad(S, SD));
    b += villainHead(x, '#4a4a60', '#2e2e42');
    /* casque « seau » à crête */
    b += shaded((a) => `<path d="M44 110 L42 44 Q56 22 100 20 Q144 22 158 44 L156 110 L142 108 L140 76 Q132 66 100 64 Q68 66 60 76 L58 108Z" ${a}/>`, S, SD, -4, -4);
    b += shaded((a) => `<path d="M88 20 L100 -6 L112 20 L110 64 L90 64Z" ${a}/>`, K, KD, -2, -2);
    b += `<path d="M60 76 Q100 60 140 76" stroke="${R}" stroke-width="5" fill="none"/>`;
    b += x.arm('L', (sx, sy) => arm(sx, sy, S, SD, K, 24));
    /* canon à fusion sur le bras droit */
    b += x.arm('R', (sx, sy) => limb(sx, sy, sx, sy + 26, S, 24) + shaded((a) => `<rect x="${sx - 16}" y="${sy + 20}" width="32" height="54" rx="9" ${a}/>`, K, KD, -2, -2) + `<rect x="${sx - 12}" y="${sy + 70}" width="24" height="10" rx="3" fill="${S}" stroke="${O}" stroke-width="3"/>` + x.when([1, 2], `<g class="fx"><circle cx="${sx}" cy="${sy + 78}" r="14" fill="${PU}" opacity=".6"/></g>`));
    const [hx, hy] = tip(this, 'R', 2, 80);
    b += x.when([2], `<g class="grow">${beam(hx, hy, hx + 100, hy + 4, 14, PU)}</g><g class="pop">${burst(f(hx + 100), f(hy + 4), 30, PU, '#f0dcff')}</g>`);
    return shadow(80, 207, 0.22) + x.body(b);
  },
},
/* ---------- Unicron ---------- */
{
  id: 'unicron', name: 'Unicron', stats: [5, 2, 5], tint: '#8a4a1a', tint2: '#120806', glow: '#ff8a2a', shake: true,
  power: 'Dévoreur de mondes, Chaos et Faim cosmique.', minionTxt: 'Fragments d’Unicron : massifs et blindés.',
  sh: { L: [30, 160], R: [170, 160] },
  poses: [{ L: 10, R: -10 }, { L: 30, R: -30, body: [0, -6, 0, 1.03, 1.03] }, { L: 40, R: -40, body: [0, -2, 0, 1.06, 1.02] }],
  bg() { return dstars(61, '#ffe0b0') + dstars(62, '#ffffff') + `<circle cx="-10" cy="190" r="34" fill="#3a6aa0" opacity=".6"/>`; },
  draw(this: CharDef, x: Ctx): string {
    const OR = '#e8862a', ORD = '#a8541a', G = '#8a8a9a', GD = '#5a5a6a', K = '#2a2030', FI = '#ffb347';
    let b = '';
    /* anneau planétaire */
    b += `<ellipse cx="100" cy="150" rx="140" ry="34" fill="none" stroke="${O}" stroke-width="14"/><ellipse cx="100" cy="150" rx="140" ry="34" fill="none" stroke="${OR}" stroke-width="7"/>`;
    /* tête-planète */
    b += shaded((a) => `<circle cx="100" cy="120" r="88" ${a}/>`, G, GD, -10, -8) + gloss(56, 64, 22, 10, -30, 0.4);
    /* cornes et casque orange */
    const horn = shaded((a) => `<path d="M30 90 Q-10 40 6 -20 Q30 30 56 56Z" ${a}/>`, OR, ORD, -3, -3);
    b += horn + mirror(horn);
    b += shaded((a) => `<path d="M24 120 Q22 40 100 32 Q178 40 176 120 L156 120 Q150 70 100 66 Q50 70 44 120Z" ${a}/>`, OR, ORD, -4, -4);
    /* visage */
    b += shaded((a) => `<path d="M48 122 Q48 74 100 72 Q152 74 152 122 L146 170 Q100 196 54 170Z" ${a}/>`, K, '#14101c', -3, -3);
    b += x.byPose((p) => geyes('#ff3b3b', { y: 112, s: 1.4, sq: p === 1 ? 0.7 : 1 }) + (p === 2
      ? `<path d="M70 146 Q100 140 130 146 Q126 182 100 184 Q74 182 70 146Z" fill="${FI}" stroke="${O}" stroke-width="4"/><path d="M76 150 H124" stroke="#fff" stroke-width="4"/>`
      : `<path d="M72 152 Q100 ${p ? 164 : 158} 128 152" stroke="${FI}" stroke-width="6" fill="none" stroke-linecap="round"/>`));
    b += `<ellipse cx="100" cy="150" rx="140" ry="34" fill="none" stroke="${O}" stroke-width="14" stroke-dasharray="0 140 300 400" opacity="0"/>`;
    b += `<path d="M-40 150 A140 34 0 0 0 240 150" fill="none" stroke="${O}" stroke-width="14"/><path d="M-40 150 A140 34 0 0 0 240 150" fill="none" stroke="${OR}" stroke-width="7"/>`;
    b += x.when([2], `<g class="grow">${beam(100, 176, 100, 236, 18, FI)}</g><g class="pop">${burst(100, 226, 34, FI, '#fff3c0')}</g>`);
    b += x.when([1], `<g class="ring"><circle cx="100" cy="120" r="104" fill="none" stroke="${FI}" stroke-width="6" opacity=".5"/></g>`);
    return x.body(b);
  },
},
];

void star; void bolt; void sparks; void swoosh;
