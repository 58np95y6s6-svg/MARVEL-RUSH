// Sbires des méchants DC (design/planches/7-dc-mechants.html). Les lieutenants (petits boss)
// réutilisent le même dessin en taille ×2. Poses : 0 fiche (marche), 1 préparation, 2 action.
/* eslint-disable */
import { O, f, shaded, clip, gloss, limb, hand, star, glow, burst, beam, sparks, mirror, shadow, type CharDef, type Ctx } from '../primitives';
import { held, hoodShade, geyes, txt } from '../kits/villain';
import { SKT, SKTD } from '../kits/dc';

const legs = (c: string, shoe = O): string =>
  `<g class="legA">${limb(88, 190, 88, 202, c, 11)}</g><g class="legB">${limb(112, 190, 112, 202, c, 11)}</g><ellipse cx="86" cy="205" rx="10" ry="5" fill="${shoe}"/><ellipse cx="114" cy="205" rx="10" ry="5" fill="${shoe}"/>`;
const trunk = (c: string, d: string): string => shaded((a) => `<path d="M62 198 C60 166 72 148 100 146 C128 148 140 166 138 198Z" ${a}/>`, c, d, -8, -4);
const headC = (a: string): string => `<circle cx="100" cy="118" r="32" ${a}/>`;
const meanEyes = (p: number, c = O, y = 114): string =>
  `<ellipse cx="88" cy="${y}" rx="3.8" ry="${p == 1 ? 2 : 4}" fill="${c}"/><ellipse cx="112" cy="${y}" rx="3.8" ry="${p == 1 ? 2 : 4}" fill="${c}"/><path d="M80 ${y - 9} L94 ${y - 4} M120 ${y - 9} L106 ${y - 4}" stroke="${O}" stroke-width="3.5" stroke-linecap="round"/>`;
const gruntMouth = (p: number, y = 136): string => p == 2
  ? `<path d="M88 ${y - 2} Q100 ${y - 6} 112 ${y - 2} Q108 ${y + 8} 100 ${y + 8} Q92 ${y + 8} 88 ${y - 2}Z" fill="#5c0f22" stroke="${O}" stroke-width="3"/>`
  : `<path d="M90 ${y} Q100 ${y - 4} 110 ${y}" stroke="${O}" stroke-width="3" fill="none" stroke-linecap="round"/>`;

export const DC_MINIONS: Record<string, CharDef> = {
/* Hommes de main clowns : tarte à la crème */
joker: {
  id: 'clown', name: 'Hommes de main clowns',
  sh: { L: [74, 156], R: [126, 156] },
  poses: [{ L: 14, R: -14 }, { L: 24, R: -160, body: [0, 2, 4, 1, 1] }, { L: 20, R: -70, body: [8, 2, -6, 1, 1] }],
  draw(this: CharDef, x: Ctx): string {
    const PU = '#7b3fb0', PUD = '#53278a', GR = '#3faa4a', W = '#f4f1f6', WD = '#c9c0d8', R = '#e0323e', HR = '#f28a2a', CR = '#fff6e0', PI = '#d9a05a';
    const pie = (cx: number, cy: number): string => `<ellipse cx="${cx}" cy="${cy + 4}" rx="16" ry="6" fill="${PI}" stroke="${O}" stroke-width="3"/><path d="M${cx - 15} ${cy + 2} Q${cx - 12} ${cy - 10} ${cx} ${cy - 10} Q${cx + 12} ${cy - 10} ${cx + 15} ${cy + 2}Z" fill="${CR}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><circle cx="${cx}" cy="${cy - 12}" r="4" fill="${R}" stroke="${O}" stroke-width="2"/>`;
    let b = legs('#3a2a50');
    b += trunk(PU, PUD);
    b += clip((a) => `<path d="M62 198 C60 166 72 148 100 146 C128 148 140 166 138 198Z" ${a}/>`, `${[156, 172, 188].map((y) => `<rect x="60" y="${y}" width="80" height="7" fill="${GR}"/>`).join('')}`) + `<path d="M62 198 C60 166 72 148 100 146 C128 148 140 166 138 198Z" fill="none" stroke="${O}" stroke-width="5" stroke-linejoin="round"/>`;
    b += `<path d="M80 148 L88 158 L96 150 L104 158 L112 150 L120 158 Q100 142 80 148Z" fill="${W}" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>`;
    /* touffes de cheveux */
    const tuft = `<circle cx="70" cy="104" r="11" fill="${HR}" stroke="${O}" stroke-width="3.5"/><circle cx="66" cy="116" r="9" fill="${HR}" stroke="${O}" stroke-width="3.5"/>`;
    b += tuft + mirror(tuft);
    b += shaded(headC, W, WD, -5, -5) + hoodShade(headC, 96, 122, 0.45, '#2a1440');
    b += x.byPose((p) => {
      let s = `<path d="M82 106 L88 112 L94 106 M106 106 L112 112 L118 106" stroke="#3a6ad0" stroke-width="2.5" fill="none"/>` + meanEyes(p, O, 116);
      s += p == 2 ? `<path d="M80 132 Q100 128 120 132 Q114 146 100 146 Q86 146 80 132Z" fill="#5c0f22" stroke="${O}" stroke-width="3"/>` : `<path d="M80 132 Q100 146 120 132" stroke="${R}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M84 134 Q100 142 116 134" stroke="${O}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
      return s;
    });
    b += `<circle cx="100" cy="124" r="7" fill="${R}" stroke="${O}" stroke-width="3"/><circle cx="98" cy="122" r="2" fill="#fff"/>`;
    /* petit chapeau pointu */
    b += `<path d="M84 90 L102 62 L118 90Z" fill="${GR}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/><circle cx="102" cy="62" r="5" fill="${R}" stroke="${O}" stroke-width="2.5"/>`;
    b += x.arm('L', (sx, sy) => limb(sx, sy, sx, sy + 26, PU, 11) + hand(sx, sy + 30, W, 8));
    b += x.arm('R', (sx, sy) => limb(sx, sy, sx, sy + 26, PU, 11) + x.when([0, 1], pie(sx, sy + 40)) + hand(sx, sy + 30, W, 8));
    const fxg = x.when([2], `<g class="pop">${burst(170, 140, 18, CR, '#fff')}<path d="M152 132 q-8 4 -6 12 M186 128 q8 4 6 12 M168 158 q2 8 -4 12" stroke="${CR}" stroke-width="6" fill="none" stroke-linecap="round"/></g><g class="pop">${txt(166, 112, 16, '#fff', 'SPLAT !', 8)}</g>`);
    return shadow(44, 207, 0.18) + `<g class="${x.A ? 'walk' : ''}">${x.body(b)}</g>` + fxg;
  },
},
/* Robots LexCorp : laser vert */
luthor: {
  id: 'lexbot', name: 'Robots LexCorp',
  sh: { L: [66, 156], R: [134, 156] },
  poses: [{ L: 10, R: -10 }, { L: 16, R: -60, body: [0, 2, 0, 1, 1] }, { L: 16, R: -92, body: [-4, 0, -4, 1, 1] }],
  draw(this: CharDef, x: Ctx): string {
    const M = '#c9d0de', MD = '#8c95ab', G = '#3f9a52', GD = '#26703a', PU = '#6b3fa0', K = '#7dff5a';
    let b = `<g class="legA">${limb(86, 186, 86, 202, MD, 12)}</g><g class="legB">${limb(114, 186, 114, 202, MD, 12)}</g><rect x="74" y="200" width="22" height="8" rx="3" fill="${G}" stroke="${O}" stroke-width="3"/><rect x="104" y="200" width="22" height="8" rx="3" fill="${G}" stroke="${O}" stroke-width="3"/>`;
    b += shaded((a) => `<rect x="62" y="146" width="76" height="46" rx="16" ${a}/>`, G, GD, -6, -4) + gloss(76, 154, 8, 3, -20, 0.5);
    b += `<rect x="86" y="156" width="28" height="22" rx="5" fill="${M}" stroke="${O}" stroke-width="3"/><path d="M93 160 V174 H107" stroke="${PU}" stroke-width="4.5" fill="none" stroke-linejoin="round"/>`;
    b += `<path d="M100 92 V78" stroke="${O}" stroke-width="4" stroke-linecap="round"/><g class="fx"><circle cx="100" cy="76" r="5" fill="${K}" stroke="${O}" stroke-width="2.5"/></g>`;
    b += shaded((a) => `<rect x="70" y="92" width="60" height="50" rx="18" ${a}/>`, M, MD, -5, -5) + gloss(84, 100, 8, 4, -30, 0.7);
    b += `<rect x="76" y="106" width="48" height="20" rx="10" fill="#2a2440" stroke="${O}" stroke-width="3.5"/>`;
    b += x.byPose((p) => `<g class="fx"><rect x="80" y="110" width="40" height="12" rx="6" fill="${K}" opacity=".35"/></g><rect x="${p == 1 ? 84 : 82}" y="${p == 1 ? 114 : 113}" width="${p == 1 ? 32 : 36}" height="${p == 1 ? 4 : 6}" rx="3" fill="${K}"/>`);
    b += `<circle cx="70" cy="118" r="7" fill="${PU}" stroke="${O}" stroke-width="3"/><circle cx="130" cy="118" r="7" fill="${PU}" stroke="${O}" stroke-width="3"/>`;
    b += x.arm('L', (sx, sy) => limb(sx, sy, sx, sy + 24, MD, 10) + hand(sx, sy + 28, G, 9));
    b += x.arm('R', (sx, sy) => limb(sx, sy, sx, sy + 24, MD, 10) + shaded((a) => `<rect x="${sx - 9}" y="${sy + 20}" width="18" height="22" rx="5" ${a}/>`, G, GD, -2, -2) + x.when([1, 2], glow(sx, sy + 44, 10, K)));
    const fxg = x.when([2], `<g class="grow" style="transform-origin:150px 160px">${beam(150, 160, 194, 160, 6, K)}</g><g class="pop">${burst(188, 160, 14, K)}</g>`);
    return shadow(44, 207, 0.18) + `<g class="${x.A ? 'walk' : ''}">${x.body(b)}</g>` + fxg;
  },
},
/* Mercenaires au venin : coup de poing */
bane: {
  id: 'mercenaire', name: 'Mercenaires au venin',
  sh: { L: [70, 156], R: [130, 156] },
  poses: [{ L: 14, R: -14 }, { L: 24, R: 50, body: [-4, 2, -6, 1.04, 0.96] }, { L: 20, R: -92, body: [10, 0, 8, 1, 1] }],
  draw(this: CharDef, x: Ctx): string {
    const K = '#2c2a38', KD = '#16141e', S = '#d9a77a', SD = '#a87650', V = '#5aff4a', VD = '#2a9a2a', CA = '#6b6a4a', CAD = '#4a4a30';
    let b = legs('#3a3a2a');
    b += shaded((a) => `<path d="M56 198 C52 164 68 144 100 142 C132 144 148 164 144 198Z" ${a}/>`, CA, CAD, -8, -4);
    b += `<path d="M76 146 L92 198 M124 146 L108 198" stroke="${KD}" stroke-width="6"/><rect x="58" y="182" width="84" height="8" fill="${KD}" stroke="${O}" stroke-width="2.5"/>`;
    b += x.when([1, 2], glow(100, 186, 10, V)) + `<rect x="94" y="180" width="12" height="12" rx="3" fill="${V}" stroke="${O}" stroke-width="2.5"/>`;
    b += shaded(headC, K, KD, -5, -5) + gloss(88, 98, 7, 3, -30, 0.35);
    b += `<rect x="72" y="106" width="56" height="18" rx="9" fill="#4a4458" stroke="${O}" stroke-width="3"/>`;
    b += x.byPose((p) => `<circle cx="88" cy="115" r="7" fill="${p ? V : '#ff5a3a'}" stroke="${O}" stroke-width="2.5"/><circle cx="112" cy="115" r="7" fill="${p ? V : '#ff5a3a'}" stroke="${O}" stroke-width="2.5"/><circle cx="86" cy="113" r="2" fill="#fff"/><circle cx="110" cy="113" r="2" fill="#fff"/>` + gruntMouth(p, 138));
    const arm = (sx: number, sy: number): string => limb(sx, sy, sx, sy + 26, S, 15) + x.when([1, 2], `<path d="M${sx - 3} ${sy + 6} l4 6 l-4 6" stroke="${V}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`) + hand(sx, sy + 32, K, 11);
    b += x.arm('L', arm) + x.arm('R', arm);
    b += `<path d="M84 140 Q70 146 68 156" stroke="${O}" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M84 140 Q70 146 68 156" stroke="${VD}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    const fxg = x.when([2], `<g class="pop">${burst(170, 158, 18, '#f2c95a', '#fff')}</g><g class="pop">${sparks(170, 158, 26, V, 7)}</g>`);
    return shadow(48, 207, 0.18) + `<g class="${x.A ? 'walk' : ''}">${x.body(b)}</g>` + fxg;
  },
},
/* Corps Sinestro : vol, tir jaune */
sinestro: {
  id: 'corps', name: 'Corps Sinestro',
  sh: { L: [72, 150], R: [128, 150] },
  poses: [{ L: 20, R: -20 }, { L: 30, R: -140, body: [0, -4, 0, 1.04, 1.04] }, { L: 26, R: -96, body: [-4, 0, -4, 1, 1] }],
  draw(this: CharDef, x: Ctx): string {
    const K = '#24202e', KD = '#110e18', Y = '#ffd23a', YD = '#c89a1a', S = '#8a6ab0', SD = '#5e4486', LY = '#ffe23a';
    let b = '';
    b += x.byPose((p) => `<g class="fx"><path d="M84 184 Q100 ${p == 1 ? 224 : 214} 116 184Z" fill="${LY}" opacity=".55"/><path d="M92 186 Q100 ${p == 1 ? 206 : 200} 108 186Z" fill="#fff8c8"/></g>`);
    b += shaded((a) => `<path d="M66 184 C62 158 74 142 100 140 C126 142 138 158 134 184 Q100 196 66 184Z" ${a}/>`, K, KD, -8, -4);
    b += shaded((a) => `<path d="M84 142 Q100 138 116 142 L110 188 L90 188Z" ${a}/>`, Y, YD, -3, -2);
    b += `<circle cx="100" cy="160" r="9" fill="${K}" stroke="${O}" stroke-width="3"/><path d="M95 155 H105 L103 159 H97Z M97 161 H103 V166 Q100 168 97 166Z" fill="${LY}"/>`;
    /* tête d'extraterrestre à crête */
    b += `<path d="M70 104 L52 88 L72 96Z M130 104 L148 88 L128 96Z" fill="${S}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`;
    const hs = (a: string): string => `<path d="M68 112 Q66 76 100 74 Q134 76 132 112 Q130 142 100 146 Q70 142 68 112Z" ${a}/>`;
    b += shaded(hs, S, SD, -5, -5) + hoodShade(hs, 80, 116, 0.45, '#1a0a2a');
    b += `<path d="M100 76 V98 M86 80 Q90 92 88 100 M114 80 Q110 92 112 100" stroke="${SD}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    b += x.byPose((p) => geyes(LY, { x: 88, y: 116, s: 0.55, sq: p == 1 ? 0.6 : 1 }) + gruntMouth(p, 134));
    b += x.arm('L', (sx, sy) => limb(sx, sy, sx, sy + 24, K, 10) + hand(sx, sy + 28, Y, 8));
    b += x.arm('R', (sx, sy) => limb(sx, sy, sx, sy + 24, K, 10) + x.when([1, 2], glow(sx, sy + 32, 12, LY)) + hand(sx, sy + 28, Y, 8));
    const fxg = x.when([2], `<g class="grow" style="transform-origin:150px 146px">${beam(150, 146, 192, 158, 7, LY)}</g><g class="pop">${burst(186, 158, 15, LY)}</g>`);
    return shadow(34, 207, 0.14) + `<g class="${x.A ? 'float' : ''}">${x.body(b)}</g>` + fxg;
  },
},
/* Soldats de Kahndaq : lance et bouclier */
blackadam: {
  id: 'kahndaq', name: 'Soldats de Kahndaq',
  sh: { L: [74, 158], R: [126, 158] },
  poses: [{ L: 12, R: -10, sp: [0, 0, 10] }, { L: 24, R: -36, sp: [0, 0, 40], body: [-6, 2, -6, 1, 1] }, { L: 18, R: -62, sp: [0, 0, 96], body: [-6, 0, 2, 1, 1] }],
  draw(this: CharDef, x: Ctx): string {
    const SA = '#e2c88a', SAD = '#b89a58', G = '#f6c64a', GD = '#c58f25', RE = '#b8322f', M = '#cfd5e0';
    const P = [126, 192] as const;
    const spear = `<rect x="${P[0] - 3.5}" y="${P[1] - 62}" width="7" height="92" rx="3" fill="#8a5a32" stroke="${O}" stroke-width="3"/><polygon points="${P[0]},${P[1] - 86} ${P[0] - 8},${P[1] - 60} ${P[0] + 8},${P[1] - 60}" fill="${G}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M${P[0] - 1} ${P[1] - 80} V${P[1] - 64}" stroke="#fff" stroke-width="2" opacity=".7"/><rect x="${P[0] - 8}" y="${P[1] - 62}" width="16" height="5" rx="2" fill="${RE}" stroke="${O}" stroke-width="2"/>`;
    let b = legs('#6a4a2a', '#4a3020');
    b += trunk(SA, SAD);
    b += `<path d="M64 182 Q100 192 136 182" stroke="${O}" stroke-width="7" fill="none"/><path d="M64 182 Q100 192 136 182" stroke="${RE}" stroke-width="4" fill="none"/>`;
    b += `<path d="M100 148 L100 176" stroke="${SAD}" stroke-width="2.5"/><circle cx="100" cy="164" r="6" fill="${G}" stroke="${O}" stroke-width="2.5"/>`;
    b += shaded(headC, SKT, SKTD, -5, -5);
    /* coiffe enroulée avec bandeau doré */
    b += shaded((a) => `<path d="M66 114 Q62 82 100 80 Q138 82 134 114 Q100 100 66 114Z" ${a}/>`, SA, SAD, -3, -3) + `<path d="M66 112 Q100 98 134 112" stroke="${G}" stroke-width="5" fill="none"/><path d="M66 112 Q100 98 134 112" stroke="${O}" stroke-width="1.5" fill="none" opacity=".5"/>`;
    b += shaded((a) => `<path d="M68 116 Q60 140 74 152 L80 130Z" ${a}/>`, SA, SAD, -2, -2);
    b += hoodShade(headC, 104, 126, 0.45);
    b += x.byPose((p) => meanEyes(p, '#ffe27a', 118) + gruntMouth(p, 138));
    /* bouclier rond au bras gauche */
    const shield = (sx: number, sy: number): string => shaded((a) => `<circle cx="${sx - 4}" cy="${sy + 30}" r="20" ${a}/>`, G, GD, -3, -3) + `<circle cx="${sx - 4}" cy="${sy + 30}" r="12" fill="none" stroke="${GD}" stroke-width="3"/><path d="M${sx - 7} ${sy + 22} l6 -2 l-4 9 l6 -1 l-8 12 l2 -9 l-5 1Z" fill="${RE}" stroke="${O}" stroke-width="1.5"/>` + gloss(sx - 12, sy + 20, 6, 3, -30, 0.6);
    b += x.arm('L', (sx, sy) => limb(sx, sy, sx, sy + 26, SA, 11) + hand(sx, sy + 30, SKT, 8) + shield(sx, sy));
    b += x.arm('R', (sx, sy) => limb(sx, sy, sx, sy + 28, SA, 11) + x.part('sp', P[0], P[1], spear) + hand(sx, sy + 34, SKT, 8));
    const [kx, ky] = held(this, 'R', 'sp', 2, [126, 106], P);
    const fxg = x.when([2], `<g class="pop">${sparks(kx + 4, ky, 18, '#ffe27a', 6)}</g>`);
    return shadow(44, 207, 0.18) + `<g class="${x.A ? 'walk' : ''}">${x.body(b)}</g>` + fxg;
  },
},
/* Parademons : vol en essaim, tir rouge */
darkseid: {
  id: 'parademon', name: 'Parademons',
  sh: { L: [74, 152], R: [126, 152] },
  poses: [{ L: 18, R: -18 }, { L: 30, R: -120, body: [0, -6, -6, 1.04, 1.04] }, { L: 26, R: -84, body: [8, 4, 10, 1, 1] }],
  draw(this: CharDef, x: Ctx): string {
    const SK2 = '#8a9a6a', SKD2 = '#5e6e44', AR = '#4a3a3a', ARD = '#2a1e1e', RE = '#ff3b2a', WG = '#5a4a5a';
    let b = '';
    const wing = `<g class="flap" style="transform-origin:76px 140px"><path d="M76 140 Q48 98 18 104 Q30 114 26 124 Q38 120 40 132 Q48 126 54 138 Q62 132 70 146Z" fill="${WG}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/><path d="M72 140 L30 110 M70 144 L46 128" stroke="#3a2e3a" stroke-width="2.5" fill="none"/></g>`;
    b += wing + mirror(wing);
    b += x.byPose((p) => `<g class="fx"><path d="M90 186 Q100 ${p == 1 ? 216 : 206} 110 186Z" fill="#ff8a3a" stroke="${O}" stroke-width="2.5"/></g>`);
    b += shaded((a) => `<path d="M66 186 C62 158 74 142 100 140 C126 142 138 158 134 186 Q100 196 66 186Z" ${a}/>`, AR, ARD, -8, -4);
    b += `<path d="M76 154 L100 164 L124 154 M80 172 L100 180 L120 172" stroke="${RE}" stroke-width="3" fill="none" stroke-linejoin="round" opacity=".8"/>`;
    const hs = (a: string): string => `<path d="M70 114 Q68 82 100 80 Q132 82 130 114 Q128 142 100 146 Q72 142 70 114Z" ${a}/>`;
    b += shaded(hs, SK2, SKD2, -5, -5);
    b += `<path d="M76 92 L66 72 L84 86 M124 92 L134 72 L116 86" fill="${SKD2}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`;
    b += shaded((a) => `<path d="M72 104 Q100 94 128 104 L126 122 Q100 116 74 122Z" ${a}/>`, ARD, '#120a0a', -2, -2);
    b += x.byPose((p) => `<g class="fx"><circle cx="88" cy="111" r="9" fill="${RE}" opacity=".35"/><circle cx="112" cy="111" r="9" fill="${RE}" opacity=".35"/></g><circle cx="88" cy="111" r="${p == 1 ? 4 : 5.5}" fill="${RE}" stroke="${O}" stroke-width="2"/><circle cx="112" cy="111" r="${p == 1 ? 4 : 5.5}" fill="${RE}" stroke="${O}" stroke-width="2"/>` +
      `<path d="M86 132 Q100 ${p == 2 ? 146 : 138} 114 132Z" fill="#5c0f22" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/><path d="M90 133 l2 5 l2 -5 M106 133 l2 5 l2 -5" fill="#fff" stroke="${O}" stroke-width="1.2"/>`);
    b += x.arm('L', (sx, sy) => limb(sx, sy, sx, sy + 24, SK2, 10) + hand(sx, sy + 28, ARD, 8));
    b += x.arm('R', (sx, sy) => limb(sx, sy, sx, sy + 24, SK2, 10) + `<rect x="${sx - 4}" y="${sy + 20}" width="8" height="40" rx="3" fill="#6a6f80" stroke="${O}" stroke-width="3"/>` + x.when([1, 2], glow(sx, sy + 62, 10, RE)) + hand(sx, sy + 28, ARD, 8));
    const fxg = x.when([2], `<g class="grow" style="transform-origin:160px 150px">${beam(160, 150, 196, 176, 6, RE)}</g><g class="pop">${burst(190, 174, 14, RE, '#ffd0c8')}</g>`);
    return shadow(34, 207, 0.14) + `<g class="${x.A ? 'float' : ''}">${x.body(b)}</g>` + fxg;
  },
},
};
