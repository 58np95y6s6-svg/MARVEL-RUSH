// Méchants Pixar (design/planches/11-pixar-mechants.html), dans le traitement « méchant » des boss : chibi trapu,
// palette sombre, sourire mauvais, trois poses (repos, préparation, pouvoir).
// Syndrome, Randall, Lotso, Le Borgne (Hopper), Charles Muntz et l’Empereur Zurg.
/* eslint-disable */
import { O, SK, SKD, f, shaded, gloss, limb, hand, star, glow, burst, beam, sparks, mirror, shadow, tip, type CharDef, type Ctx } from '../primitives';
import { hoodShade, geyes, evilMouth, rnd, twinkle, spiral } from '../kits/villain';

const BUST = 'M24 206 C20 152 54 128 100 126 C146 128 180 152 176 206Z';
const bust = (c: string, d: string, path = BUST): string => shaded((a) => `<path d="${path}" ${a}/>`, c, d, -10, -4);
const bigHead = (c: string, d: string, r = 58, cy = 92): string => shaded((a) => `<circle cx="100" cy="${cy}" r="${r}" ${a}/>`, c, d, -6, -6) + gloss(74, cy - 34, 14, 7);
const arm = (sx: number, sy: number, c: string, fist: string, w = 20): string => limb(sx, sy, sx, sy + 40, c, w) + hand(sx, sy + 46, fist, 14);
const stars = (seed: number, c = '#ffe9a0') => {
  const r = rnd(seed);
  let s = '';
  for (let i = 0; i < 9; i++) s += twinkle(f(-30 + r() * 260), f(-36 + r() * 120), f(3 + r() * 3), c, 0.5);
  return s;
};
const evilBrows = (p: number, c = O, y = 82): string =>
  `<path d="M66 ${y - (p === 1 ? 4 : 0)} L92 ${y + 8} M134 ${y - (p === 1 ? 4 : 0)} L108 ${y + 8}" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`;
const villainEyes = (p: number, iris: string, y = 96): string =>
  [80, 120].map((x) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="${p === 1 ? 5 : 7}" fill="#fff" stroke="${O}" stroke-width="2.5"/><circle cx="${x + 2}" cy="${y + 1}" r="4" fill="${iris}"/><circle cx="${x + 2}" cy="${y + 1}" r="2" fill="${O}"/>`).join('');
const grin = (p: number, cy = 124): string =>
  p === 2
    ? `<path d="M76 ${cy - 4} Q100 ${cy - 8} 124 ${cy - 4} Q118 ${cy + 18} 100 ${cy + 18} Q82 ${cy + 18} 76 ${cy - 4}Z" fill="#5a1020" stroke="${O}" stroke-width="3.5"/><path d="M80 ${cy - 3} H120" stroke="#fff" stroke-width="4"/>`
    : `<path d="M78 ${cy} Q100 ${cy + 14} 124 ${cy - 4}" stroke="${O}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M118 ${cy - 6} l8 2" stroke="${O}" stroke-width="3" stroke-linecap="round"/>`;

export const PIXAR_BOSSES: CharDef[] = [
/* ---------- Syndrome ---------- */
{
  id: 'syndrome', name: 'Syndrome', stats: [4, 4, 3], tint: '#5a6aa8', tint2: '#141a3a', glow: '#7ad8ff',
  power: 'Rayon à point zéro : 2 unités figées ; armure 25 %.', minionTxt: 'Robots de Syndrome : blindés, en duo.',
  sh: { L: [46, 152], R: [154, 152] },
  poses: [{ L: 18, R: -18 }, { L: 30, R: -150, body: [2, -6, 4, 1, 1.03] }, { L: 40, R: -96, body: [-6, -2, -6, 1, 1] }],
  bg() { return stars(5, '#bfefff') + `<path d="M-30 196 L40 150 L90 180 L150 140 L250 190" stroke="#2a3466" stroke-width="16" fill="none" opacity=".5"/>`; },
  draw(this: CharDef, x: Ctx): string {
    const K = '#2b2838', KD = '#15131f', W = '#f4f4f8', WD = '#c8c8d6', H = '#f08a2a', HD = '#b85a16', CY = '#7ad8ff';
    let b = '';
    // cape blanche
    b += shaded((a) => `<path d="M40 150 Q10 190 -6 206 L206 206 Q190 190 160 150Z" ${a}/>`, W, WD, -4, -4);
    b += bust(K, KD);
    b += shaded((a) => `<path d="M70 140 Q100 150 130 140 L124 180 Q100 188 76 180Z" ${a}/>`, W, WD, -3, -3);
    b += `<path d="M84 150 L100 172 L116 150" stroke="${K}" stroke-width="7" fill="none"/>`;
    b += bigHead(SK, SKD, 54, 98);
    b += `<path d="M48 90 Q60 74 80 82 Q100 90 120 82 Q140 74 152 90 Q144 108 122 106 Q100 104 78 106 Q56 108 48 90Z" fill="${K}" stroke="${O}" stroke-width="3.5"/>`;
    b += x.byPose((p) => villainEyes(p, '#4a7ad8', 94) + evilBrows(p, O, 74) + grin(p, 126));
    // cheveux en flamme dressée
    b += shaded((a) => `<path d="M54 74 Q46 30 72 10 Q74 30 86 26 Q86 -6 112 -16 Q106 10 118 14 Q134 -2 150 4 Q138 22 146 42 Q156 56 148 76 Q120 52 100 56 Q76 52 54 74Z" ${a}/>`, H, HD, -4, -4);
    b += x.arm('L', (sx, sy) => arm(sx, sy, K, W));
    b += x.arm('R', (sx, sy) => arm(sx, sy, K, W) + `<rect x="${sx - 10}" y="${sy + 24}" width="20" height="16" rx="4" fill="${W}" stroke="${O}" stroke-width="3"/><circle cx="${sx}" cy="${sy + 32}" r="4" fill="${CY}"/>`);
    b += x.when([1], glow(...tip(this, 'R', 1, 46), 20, CY));
    const [hx, hy] = tip(this, 'R', 2, 48);
    b += x.when([2], `<g class="grow">${beam(hx, hy, 236, hy + 14, 10, CY)}</g><g class="pop"><circle cx="236" cy="${f(hy + 14)}" r="24" fill="${CY}" opacity=".35" stroke="${CY}" stroke-width="4"/>${sparks(236, hy + 14, 30, '#fff', 8)}</g>`);
    return shadow(74, 207, 0.2) + x.body(b);
  },
},
/* ---------- Randall ---------- */
{
  id: 'randall', name: 'Randall', stats: [3, 5, 3], tint: '#8a5ab8', tint2: '#1e1236', glow: '#c88aff',
  power: 'Camouflage : 2 unités hypnotisées ; il se soigne.', minionTxt: 'Monstres de Monstropolis : rapides, en trio.',
  sh: { L: [44, 150], R: [156, 150], L2: [52, 176], R2: [148, 176] },
  poses: [{ L: 20, R: -20, L2: 30, R2: -30 }, { L: 40, R: -150, L2: 50, R2: -60, body: [0, -6, 0, 1, 1.03] }, { L: 60, R: -100, L2: 70, R2: -110, body: [-6, 0, -4, 1, 1] }],
  bg() { return `<g opacity=".45">${[0, 1, 2, 3].map((i) => `<rect x="${-30 + i * 72}" y="${40 + (i % 2) * 20}" width="44" height="80" rx="4" fill="#3a2a5a" stroke="#5a4a8a" stroke-width="3"/>`).join('')}</g>`; },
  draw(this: CharDef, x: Ctx): string {
    const P = '#9a6ad0', PD = '#6a3e98', SC = '#c8a0f0', G = '#7ad86a';
    let b = '';
    b += bust(P, PD);
    b += [0, 1, 2, 3].map((i) => `<path d="M${60 + i * 6} ${150 + i * 14} Q100 ${160 + i * 14} ${140 - i * 6} ${150 + i * 14}" stroke="${PD}" stroke-width="4" fill="none" opacity=".7"/>`).join('');
    b += x.arm('L2', (sx, sy) => arm(sx, sy, P, P, 14)) + x.arm('R2', (sx, sy) => arm(sx, sy, P, P, 14));
    // tête de lézard, longue et plate
    b += shaded((a) => `<path d="M34 96 Q36 40 100 36 Q164 40 166 96 Q160 140 100 146 Q40 140 34 96Z" ${a}/>`, P, PD, -6, -6) + gloss(70, 56, 14, 6);
    b += `<path d="M60 44 L56 24 L72 40 M100 36 L100 14 L110 36 M140 44 L148 24 L132 40" fill="${SC}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`;
    b += x.byPose((p) => [76, 124].map((ex) => `<ellipse cx="${ex}" cy="86" rx="13" ry="${p === 1 ? 6 : 11}" fill="${G}" stroke="${O}" stroke-width="3"/><ellipse cx="${ex}" cy="86" rx="2.5" ry="${p === 1 ? 5 : 9}" fill="${O}"/>`).join('') + evilBrows(p, O, 68) +
      (p === 2 ? `<path d="M56 114 Q100 108 144 114 Q130 138 100 138 Q70 138 56 114Z" fill="#5a1020" stroke="${O}" stroke-width="3.5"/><path d="M60 115 L68 124 L76 115 L84 124 L92 115 L100 124 L108 115 L116 124 L124 115 L132 124 L140 115" fill="#fff" stroke="${O}" stroke-width="1.5"/>` : `<path d="M58 116 Q100 132 142 116" stroke="${O}" stroke-width="4" fill="none" stroke-linecap="round"/>`));
    b += x.arm('L', (sx, sy) => arm(sx, sy, P, P)) + x.arm('R', (sx, sy) => arm(sx, sy, P, P));
    // camouflage : moitié du corps qui s’efface
    b += x.when([1, 2], `<g class="fx"><path d="M100 0 L220 0 L220 210 L100 210Z" fill="#2a1a4a" opacity="${x.mode === 2 ? 0.45 : 0.25}"/></g>`);
    b += x.when([2], `<g class="pop">${spiral(206, 120, 22, '#c88aff')}${spiral(-6, 110, 16, '#c88aff')}</g>`);
    return shadow(74, 207, 0.2) + x.body(b);
  },
},
/* ---------- Lotso ---------- */
{
  id: 'lotso', name: 'Lotso', stats: [3, 3, 5], tint: '#d88aa8', tint2: '#3a1428', glow: '#ff8ab8',
  power: 'Tri des jouets : la plus petite unité part à la benne, une autre perd 1 rang.', minionTxt: 'Jouets de Sunnyside : bouclier, en bande.',
  sh: { L: [48, 154], R: [152, 154] },
  poses: [{ L: 18, R: -18 }, { L: 30, R: -160, body: [2, -4, 2, 1, 1.02] }, { L: 30, R: -60, body: [6, 2, 6, 1, 1] }],
  bg() { return `<g opacity=".45"><rect x="-30" y="120" width="260" height="90" fill="#3a2a2a"/><path d="M-30 120 L230 120" stroke="#5a4a3a" stroke-width="6"/>${[0, 1, 2].map((i) => `<circle cx="${10 + i * 90}" cy="${90}" r="14" fill="#4a3a5a"/>`).join('')}</g>`; },
  draw(this: CharDef, x: Ctx): string {
    const PK = '#e88ab0', PKD = '#b05a80', MZ = '#f8d0e0', BR = '#7a4a2a', ST = '#c84a4a';
    let b = '';
    b += bust(PK, PKD) + shaded((a) => `<ellipse cx="100" cy="176" rx="40" ry="30" ${a}/>`, MZ, '#d8a8c0', -3, -3);
    const ear = shaded((a) => `<circle cx="52" cy="42" r="22" ${a}/>`, PK, PKD, -3, -3) + `<circle cx="52" cy="42" r="11" fill="${MZ}"/>`;
    b += ear + mirror(ear);
    b += bigHead(PK, PKD, 56, 92);
    b += shaded((a) => `<ellipse cx="100" cy="118" rx="30" ry="22" ${a}/>`, MZ, '#d8a8c0', -3, -3);
    b += `<ellipse cx="100" cy="106" rx="10" ry="7" fill="#7a2a4a" stroke="${O}" stroke-width="2.5"/>`;
    b += x.byPose((p) => [76, 124].map((ex) => `<circle cx="${ex}" cy="86" r="6" fill="${O}"/><circle cx="${ex + 2}" cy="84" r="2" fill="#fff"/>`).join('') + evilBrows(p, BR, 70) + grin(p, 124));
    b += x.arm('L', (sx, sy) => arm(sx, sy, PK, PK));
    b += x.arm('R', (sx, sy) => arm(sx, sy, PK, PK) + `<path d="M${sx} ${sy + 46} V${sy + 104} M${sx} ${sy + 46} q-14 -12 -22 2" stroke="${O}" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M${sx} ${sy + 46} V${sy + 104} M${sx} ${sy + 46} q-14 -12 -22 2" stroke="${ST}" stroke-width="5" fill="none" stroke-linecap="round"/>`);
    b += `<circle cx="100" cy="186" r="9" fill="${ST}" stroke="${O}" stroke-width="3"/>`;
    b += x.when([2], `<g class="pop"><path d="M188 150 L232 150 L226 206 L194 206Z" fill="#5a6a5a" stroke="${O}" stroke-width="4"/><path d="M196 162 H224 M198 176 H222 M200 190 H220" stroke="#3a4a3a" stroke-width="3"/>${burst(210, 140, 16, '#ff8ab8', '#fff')}</g>`);
    b += x.when([1], `<g class="fx"><circle cx="100" cy="92" r="72" fill="#ff8ab8" opacity=".12"/></g>`);
    return shadow(74, 207, 0.2) + x.body(b);
  },
},
/* ---------- Le Borgne (Hopper) ---------- */
{
  id: 'hopper', name: 'Le Borgne', stats: [4, 4, 3], tint: '#7a8a5a', tint2: '#1a2010', glow: '#d8e04a',
  power: 'Nuée : il appelle 4 sauterelles et étourdit une unité.', minionTxt: 'Sauterelles : volent vite, en essaim.',
  sh: { L: [46, 150], R: [154, 150] },
  poses: [{ L: 18, R: -18 }, { L: 40, R: -150, body: [0, -6, 0, 1, 1.03] }, { L: 60, R: -60, body: [-4, 2, -4, 1, 1] }],
  bg() { return `<g opacity=".4"><path d="M-30 206 Q20 140 60 206 M40 206 Q90 120 130 206 M150 206 Q190 150 230 206" stroke="#3a4a1a" stroke-width="10" fill="none"/></g>` + stars(17, '#e8f0a0'); },
  draw(this: CharDef, x: Ctx): string {
    const G = '#8a9a5a', GD = '#5a6a32', GL = '#b8c87a', SC = '#c8b088';
    let b = '';
    // ailes
    const wing = `<ellipse cx="44" cy="130" rx="44" ry="18" transform="rotate(-30 44 130)" fill="#d8e8c0" opacity=".6" stroke="${O}" stroke-width="3"/>`;
    b += x.mode === 2 ? `<g class="flap">${wing}${mirror(wing)}</g>` : '';
    b += bust(G, GD);
    b += [150, 166, 182].map((y) => `<path d="M50 ${y} Q100 ${y + 10} 150 ${y}" stroke="${GD}" stroke-width="4" fill="none"/>`).join('');
    // tête allongée, mandibules, antennes
    b += `<path d="M80 40 Q60 0 30 -4 M120 40 Q140 0 170 -4" stroke="${O}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M80 40 Q60 0 30 -4 M120 40 Q140 0 170 -4" stroke="${GL}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    b += shaded((a) => `<path d="M48 84 Q48 34 100 32 Q152 34 152 84 Q150 128 124 146 L76 146 Q50 128 48 84Z" ${a}/>`, G, GD, -6, -6) + gloss(74, 50, 12, 6);
    b += x.byPose((p) => {
      let s = `<ellipse cx="70" cy="80" rx="18" ry="${p === 1 ? 10 : 14}" fill="#c84a2a" stroke="${O}" stroke-width="3"/><circle cx="74" cy="80" r="5" fill="${O}"/><circle cx="76" cy="77" r="2" fill="#fff"/>`;
      s += `<ellipse cx="130" cy="80" rx="18" ry="14" fill="#6a5a3a" stroke="${O}" stroke-width="3"/><path d="M112 62 L150 100" stroke="${SC}" stroke-width="7" stroke-linecap="round"/><path d="M118 70 l8 -4 M130 82 l8 -4 M142 94 l8 -4" stroke="${O}" stroke-width="2.5"/>`;
      s += evilBrows(p, O, 60);
      s += p === 2 ? `<path d="M82 124 L74 146 L92 132 M118 124 L126 146 L108 132" fill="${GL}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M86 120 Q100 116 114 120 Q108 134 100 134 Q92 134 86 120Z" fill="#3a1010" stroke="${O}" stroke-width="3"/>` : `<path d="M84 124 Q100 132 116 122" stroke="${O}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
      return s;
    });
    b += x.arm('L', (sx, sy) => arm(sx, sy, G, GD, 16)) + x.arm('R', (sx, sy) => arm(sx, sy, G, GD, 16));
    b += x.when([2], `<g class="pop">${burst(210, 110, 18, '#d8e04a', '#fff')}</g>`);
    return shadow(74, 207, 0.2) + x.body(b);
  },
},
/* ---------- Charles Muntz ---------- */
{
  id: 'muntz', name: 'Charles Muntz', stats: [3, 4, 4], tint: '#a88a5a', tint2: '#2a1e10', glow: '#ffb347',
  power: 'En alternance : la meute (3 chiens) ou le dirigeable (une colonne étourdie).', minionTxt: 'Chiens de Muntz : très rapides, en meute.',
  sh: { L: [46, 152], R: [154, 152] },
  poses: [{ L: 18, R: -18 }, { L: 30, R: -150, body: [2, -6, 4, 1, 1.03] }, { L: 40, R: -96, body: [-6, -2, -6, 1, 1] }],
  bg() { return `<g opacity=".5"><ellipse cx="170" cy="20" rx="80" ry="26" fill="#6a5a4a"/><rect x="150" y="44" width="40" height="14" rx="3" fill="#4a3a2a"/></g>` + stars(23); },
  draw(this: CharDef, x: Ctx): string {
    const J = '#8a6a3a', JD = '#5e4422', W = '#f4f4f8', WD = '#c8c8d6', SC = '#c84a2a', GG = '#7ad8ff';
    let b = '';
    b += bust(J, JD);
    b += `<path d="M70 132 L100 170 L130 132" fill="${W}" stroke="${O}" stroke-width="3.5"/><path d="M84 138 L100 150 L116 138" fill="${SC}" stroke="${O}" stroke-width="3"/>`;
    b += [60, 140].map((px) => `<rect x="${px - 10}" y="160" width="20" height="18" rx="3" fill="${JD}" stroke="${O}" stroke-width="2.5"/>`).join('');
    b += bigHead(SK, SKD, 52, 96);
    b += x.byPose((p) => villainEyes(p, '#4a6aa8', 96) + `<path d="M64 ${p === 1 ? 76 : 80} Q78 72 92 84 M136 ${p === 1 ? 76 : 80} Q122 72 108 84" stroke="${W}" stroke-width="7" fill="none" stroke-linecap="round"/>` +
      `<path d="M66 116 Q82 108 100 114 Q118 108 134 116 Q128 126 116 122 Q100 118 84 122 Q72 126 66 116Z" fill="${W}" stroke="${O}" stroke-width="3"/>` + (p === 2 ? `<path d="M88 126 Q100 124 112 126 Q108 140 100 140 Q92 140 88 126Z" fill="#5a1020" stroke="${O}" stroke-width="3"/>` : ''));
    b += `<path d="M50 80 Q46 64 56 56 M150 80 Q154 64 144 56" stroke="${W}" stroke-width="8" fill="none" stroke-linecap="round"/>`;
    // casque d’aviateur et lunettes
    b += shaded((a) => `<path d="M48 82 Q46 34 100 34 Q154 34 152 82 Q140 56 100 54 Q60 56 48 82Z" ${a}/>`, J, JD, -4, -4);
    b += `<g><circle cx="80" cy="54" r="12" fill="${GG}" fill-opacity=".7" stroke="${O}" stroke-width="4"/><circle cx="120" cy="54" r="12" fill="${GG}" fill-opacity=".7" stroke="${O}" stroke-width="4"/><path d="M92 54 H108" stroke="${O}" stroke-width="4"/></g>`;
    b += x.arm('L', (sx, sy) => arm(sx, sy, J, SK));
    b += x.arm('R', (sx, sy) => arm(sx, sy, J, SK) + `<rect x="${sx - 4}" y="${sy + 50}" width="8" height="40" rx="3" fill="#6a5a4a" stroke="${O}" stroke-width="3"/>`);
    b += x.when([1], `<g class="fx"><path d="M190 60 q8 -8 16 0 q-8 8 -16 0Z" fill="#ffb347" stroke="${O}" stroke-width="2"/></g>`);
    b += x.when([2], `<g class="pop">${burst(214, 120, 22, '#ffb347', '#fff3c0')}<path d="M200 70 L214 98 M230 70 L218 98" stroke="${O}" stroke-width="4"/></g>`);
    return shadow(74, 207, 0.2) + x.body(b);
  },
},
/* ---------- Empereur Zurg ---------- */
{
  id: 'zurg', name: 'Empereur Zurg', stats: [5, 4, 5], tint: '#6a4ab8', tint2: '#120a2a', glow: '#ff3b6a',
  power: 'En alternance : pistolet à ions ou robots ; à 30 % : « Je suis ton père ».', minionTxt: 'Robots de Zurg : bouclier, en trio.',
  sh: { L: [40, 154], R: [160, 154] },
  poses: [{ L: 18, R: -18 }, { L: 30, R: -150, body: [2, -6, 4, 1, 1.03] }, { L: 40, R: -94, body: [-6, -2, -6, 1, 1] }],
  bg() { return stars(41, '#ff9ab8') + `<circle cx="200" cy="10" r="30" fill="#4a2a6a" opacity=".6"/><circle cx="-10" cy="40" r="16" fill="#3a2a5a" opacity=".6"/>`; },
  draw(this: CharDef, x: Ctx): string {
    const P = '#7a4ac8', PD = '#4a2a8a', K = '#2b2838', KD = '#15131f', R = '#e8283c', Y = '#f6c83a', MG = '#ff3b6a';
    let b = '';
    // cape à grand col
    b += shaded((a) => `<path d="M30 120 Q0 160 -10 206 L210 206 Q200 160 170 120Z" ${a}/>`, K, KD, -4, -4);
    b += shaded((a) => `<path d="M36 112 L20 70 L70 110Z" ${a}/>`, K, KD, -3, -3) + mirror(shaded((a) => `<path d="M36 112 L20 70 L70 110Z" ${a}/>`, K, KD, -3, -3));
    b += bust(P, PD);
    b += shaded((a) => `<path d="M64 140 L136 140 L128 190 L72 190Z" ${a}/>`, K, KD, -3, -3);
    b += `<rect x="80" y="150" width="40" height="24" rx="4" fill="${R}" stroke="${O}" stroke-width="3"/><path d="M86 162 H114" stroke="${Y}" stroke-width="4"/>`;
    // tête : casque violet et cornes
    b += shaded((a) => `<path d="M52 72 L30 14 L70 52Z" ${a}/>`, '#c8c8d6', '#8a8aa0', -3, -3) + mirror(shaded((a) => `<path d="M52 72 L30 14 L70 52Z" ${a}/>`, '#c8c8d6', '#8a8aa0', -3, -3));
    b += shaded((a) => `<path d="M46 96 Q44 40 100 36 Q156 40 154 96 L148 138 Q100 154 52 138Z" ${a}/>`, P, PD, -6, -6) + gloss(72, 52, 12, 6);
    b += shaded((a) => `<path d="M62 120 Q100 112 138 120 L134 146 Q100 158 66 146Z" ${a}/>`, K, KD, -2, -2);
    b += x.byPose((p) => geyes(MG, { y: 92, s: 1.1, sq: p === 1 ? 0.7 : 1 }) + evilMouth(p, 100, 136, 14));
    b += x.arm('L', (sx, sy) => arm(sx, sy, P, K, 22));
    b += x.arm('R', (sx, sy) => arm(sx, sy, P, K, 22) + `<rect x="${sx - 12}" y="${sy + 30}" width="24" height="34" rx="5" fill="${K}" stroke="${O}" stroke-width="3.5"/><rect x="${sx - 6}" y="${sy + 62}" width="12" height="16" rx="3" fill="#8a8aa0" stroke="${O}" stroke-width="3"/>`);
    b += x.when([1], glow(...tip(this, 'R', 1, 74), 20, MG));
    const [hx, hy] = tip(this, 'R', 2, 76);
    b += x.when([2], `<g class="grow">${beam(hx, hy, 240, hy + 10, 12, MG)}</g><g class="pop">${burst(240, hy + 10, 26, MG, '#ffd0dc')}</g>`);
    return shadow(80, 207, 0.22) + x.body(b);
  },
},
];
