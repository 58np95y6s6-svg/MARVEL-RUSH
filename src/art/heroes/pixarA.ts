// Héros Pixar, planche A (design/planches/10-pixar-heros.html) : même chibi et même API que les héros Marvel et
// Disney. La plupart sont des DUOS : le partenaire (Flèche, Bob, Martin, Russell, Tristesse…) se tient au pied du
// héros, à gauche, comme Woody à côté de Buzz ; en pose 2 il porte le « coup de duo ».
/* eslint-disable */
import { O, SK, SKD, f, shaded, gloss, limb, hand, glow, burst, beam, sparks, torso, head, face, mirror, shadow, tip, dirOf, type CharDef, type Ctx } from '../primitives';
import { shadedW } from '../kits/disneyB';
import { mask, maskEyes, iLogo, buddy, buddyArm, balloon, BALLOON_COLORS, iceShard, hairS, mouth, smallMouth, sparkle, SKB, SKBD } from '../kits/pixar';

const POSES = [{ L: 12, R: -12 }, { L: 22, R: -150, body: [-3, -3, -6, 1, 1.02] }, { L: 30, R: -98, body: [7, 0, 7, 1, 1] }];
const RS = '#d8322c', RSD = '#9b1d27'; // costume des Indestructibles
const speedLines = (x0: number, y0: number, k: number, c = '#fff'): string =>
  `<g class="fx">${Array.from({ length: k }, (_, i) => `<path d="M${x0} ${y0 + i * 9} h${-22 - (i % 2) * 12}" stroke="${O}" stroke-width="6" stroke-linecap="round"/><path d="M${x0} ${y0 + i * 9} h${-22 - (i % 2) * 12}" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`).join('')}</g>`;

export const PIXAR_A: CharDef[] = [
{
  id: 'mrincredible', name: 'M. Indestructible', role: 'Contrôle de zone', rarity: 'Légendaire', rar: 'var(--leg)', tint: '#ffd8c8', tint2: '#e88a6a', stats: [5, 2, 4],
  atk: 'Coups de poing massifs.', skill: 'Coup de poing sismique : toute la ligne de l’ennemi de tête est frappée et étourdie.',
  sh: { L: [60, 150], R: [140, 150] },
  poses: [{ L: 14, R: -14 }, { L: 24, R: -160, body: [-2, -6, -4, 1, 1.03] }, { L: 30, R: -20, body: [4, 4, 6, 1.02, 0.96] }],
  draw(this: CharDef, x: Ctx): string {
    const BL = '#f2c84a', BLD = '#c99418', K = '#2b2838';
    const arm = (sx: number, sy: number) => limb(sx, sy, sx, sy + 34, RS, 22) + hand(sx, sy + 42, K, 15);
    let b = '';
    b += torso(RS, RSD, 'M48 204 C44 150 66 132 100 130 C134 132 156 150 152 204Z');
    b += `<path d="M58 190 Q100 198 142 190 L144 204 L56 204Z" fill="${K}" stroke="${O}" stroke-width="4" stroke-linejoin="round"/>` + iLogo(100, 162, 1.2);
    b += head(SK, SKD);
    b += shaded((a) => `<path d="M60 112 Q64 142 100 144 Q136 142 140 112 Q120 128 100 128 Q80 128 60 112Z" ${a}/>`, SK, SKD, -3, -3); // mâchoire carrée
    b += x.byPose((p) => mask() + maskEyes(p) + mouth(p));
    b += hairS('M44 80 Q36 26 98 22 Q156 22 158 72 Q146 48 120 46 Q132 38 116 32 Q100 46 72 48 Q52 54 44 80Z', BL, BLD);
    b += x.arm('L', arm) + x.arm('R', arm);
    b += x.when([1], glow(...tip(this, 'R', 1, 44), 18, '#ffb347'));
    b += x.when([2], `<g class="ring"><ellipse cx="140" cy="204" rx="58" ry="12" fill="none" stroke="${O}" stroke-width="8"/><ellipse cx="140" cy="204" rx="58" ry="12" fill="none" stroke="#ffb347" stroke-width="4"/></g>` +
      `<g class="pop">${burst(150, 196, 24, '#ffb347', '#fff3c0')}<path d="M176 200 L188 176 L196 190 L210 170" stroke="${O}" stroke-width="6" fill="none" stroke-linejoin="round"/><path d="M176 200 L188 176 L196 190 L210 170" stroke="#c8a070" stroke-width="3" fill="none"/></g>`);
    return shadow(66) + x.body(b);
  },
},
{
  id: 'elastigirl', name: 'Elastigirl', role: 'Tir de tête', rarity: 'Épique', rar: 'var(--epi)', tint: '#ffd0d0', tint2: '#e87a7a', stats: [3, 5, 3],
  atk: 'Bras élastique qui s’étire sur tout le chemin.', skill: 'Frappe l’ennemi de tête et le ralentit.',
  sh: { L: [68, 150], R: [132, 150] },
  poses: [{ L: 12, R: -12 }, { L: 22, R: -40 }, { L: 30, R: -92, body: [6, 0, 6, 1, 1] }],
  draw(this: CharDef, x: Ctx): string {
    const H = '#8a3a2a', HD = '#5e2418', K = '#2b2838';
    const armL = (sx: number, sy: number) => limb(sx, sy, sx, sy + 34, RS, 14) + hand(sx, sy + 40, K, 10);
    const armR = (sx: number, sy: number) => {
      const L = x.mode === 2 ? 118 : x.mode === 1 ? 52 : 34;
      return `<path d="M${sx} ${sy} Q${sx + 10} ${sy + L * 0.5} ${sx} ${sy + L}" stroke="${O}" stroke-width="22" fill="none" stroke-linecap="round"/><path d="M${sx} ${sy} Q${sx + 10} ${sy + L * 0.5} ${sx} ${sy + L}" stroke="${RS}" stroke-width="13" fill="none" stroke-linecap="round"/>` + hand(sx, sy + L + 6, K, 12);
    };
    let b = '';
    b += hairS('M48 96 Q36 40 100 26 Q164 40 152 96 Q160 120 146 134 L132 110 Q100 60 68 110 L54 134 Q40 120 48 96Z', H, HD);
    b += torso(RS, RSD);
    b += `<path d="M64 186 Q100 194 136 186 L138 200 L62 200Z" fill="${K}" stroke="${O}" stroke-width="4"/>` + iLogo(100, 160);
    b += head(SK, SKD);
    b += x.byPose((p) => mask() + maskEyes(p, '#6a4a2a') + mouth(p));
    b += hairS('M46 88 Q42 34 100 30 Q158 34 154 88 Q140 58 112 54 Q88 64 60 62 Q50 72 46 88Z', H, HD);
    b += x.arm('L', armL) + x.arm('R', armR);
    const [hx, hy] = tip(this, 'R', 2, 124);
    b += x.when([2], `<g class="pop">${burst(f(hx + 10), f(hy), 18, '#ff8a6a', '#fff')}</g>`);
    return shadow() + x.body(b);
  },
},
{
  id: 'frozone', name: 'Frozone', role: 'Ralentissement / zone', rarity: 'Épique', rar: 'var(--epi)', tint: '#d8f0ff', tint2: '#7ac0f0', stats: [3, 3, 5],
  atk: 'Rafale de glace qui ralentit.', skill: 'Pont de glace : gèle le chemin autour de l’ennemi de tête.',
  sh: { L: [68, 150], R: [132, 150] },
  poses: POSES,
  draw(this: CharDef, x: Ctx): string {
    const B = '#5ab8ff', BD = '#2f7ac8', W = '#f4f8ff', WD = '#c8d8ec', GG = '#bfefff';
    const arm = (sx: number, sy: number) => limb(sx, sy, sx, sy + 34, B, 14) + hand(sx, sy + 40, W, 11);
    let b = '';
    b += torso(B, BD);
    b += shaded((a) => `<path d="M80 136 L100 176 L120 136 L128 140 L104 202 L96 202 L72 140Z" ${a}/>`, W, WD, -2, -2);
    b += head(SKB, SKBD);
    b += x.byPose((p) => face(p, { eye: '#3a2418', noMouth: true, noCheeks: true }) + mouth(p));
    b += `<path d="M70 118 Q100 150 130 118 Q126 140 100 146 Q74 140 70 118Z" fill="#2b2026" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`; // barbe
    b += x.byPose((p) => (p === 1 ? '' : `<path d="M90 120 Q100 124 110 120" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>`));
    // lunettes de glace
    b += `<path d="M56 86 Q100 70 144 86 L142 104 Q120 110 100 100 Q80 110 58 104Z" fill="${GG}" fill-opacity=".85" stroke="${O}" stroke-width="4" stroke-linejoin="round"/>` + gloss(70, 88, 8, 3, -10, 0.8);
    b += `<path d="M48 82 Q100 58 152 82" stroke="${B}" stroke-width="7" fill="none"/>`;
    b += x.arm('L', arm) + x.arm('R', arm);
    const [hx, hy] = tip(this, 'R', 2, 44), [dx, dy] = dirOf(this, 'R', 2);
    b += x.when([1], glow(...tip(this, 'R', 1, 44), 14, GG));
    b += x.when([2], `<g class="grow">${beam(hx, hy, hx + dx * 90, hy + dy * 90, 8, GG)}</g><g class="pop">${iceShard(hx + dx * 96, hy + dy * 96 - 10, 1.2, 10)}${iceShard(hx + dx * 84, hy + dy * 84 + 16, 0.9, -30)}${iceShard(hx + dx * 108, hy + dy * 108 + 10, 0.8, 40)}</g>`);
    return shadow() + x.body(b);
  },
},
{
  id: 'violetflash', name: 'Violette & Flèche', role: 'Échangeur', rarity: 'Rare', rar: 'var(--rare)', tint: '#e8d8ff', tint2: '#a88ae8', stats: [2, 4, 3],
  atk: 'Coups rapides ; Flèche frappe deux fois de plus (coup de duo).', skill: 'Champ de force : échange sa place avec une alliée et la protège.',
  sh: { L: [70, 150], R: [130, 150] },
  poses: [{ L: 12, R: -12 }, { L: 40, R: -140 }, { L: 120, R: -120, body: [0, -2, 0, 1, 1] }],
  draw(this: CharDef, x: Ctx): string {
    const H = '#24203a', HD = '#120f20', K = '#2b2838', FF = '#b08aff', BL = '#f6d04a', BLD = '#c99f26';
    const arm = (sx: number, sy: number) => limb(sx, sy, sx, sy + 32, RS, 12) + hand(sx, sy + 38, K, 9);
    let b = '';
    b += x.when([2], `<g class="pop"><circle cx="100" cy="120" r="94" fill="${FF}" fill-opacity=".22" stroke="${FF}" stroke-width="5"/>${gloss(52, 60, 16, 6, -40, 0.6)}</g>`);
    b += hairS('M44 100 Q34 30 100 24 Q166 30 156 100 L160 190 L136 190 L138 110 Q100 70 62 110 L64 190 L40 190Z', H, HD);
    b += torso(RS, RSD, 'M62 202 C60 160 72 140 100 138 C128 140 140 160 138 202Z');
    b += iLogo(100, 162, 0.9);
    b += head(SK, SKD);
    b += x.byPose((p) => mask() + maskEyes(p, '#6a4ab8') + mouth(p));
    b += hairS('M44 96 Q40 30 100 28 Q160 32 156 92 Q150 60 120 50 Q94 60 84 96 Q74 120 62 132 Q46 120 44 96Z', H, HD); // mèche sur l’œil
    b += x.arm('L', arm) + x.arm('R', arm);
    // Flèche
    b += buddy(x, {
      cx: 24, body: RS, bodyD: RSD, eye: '#3a6ad8', under: `<path d="M8 140 Q24 134 40 140 L38 150 Q24 146 10 150Z" fill="${K}"/>`,
      hair: hairS('M2 140 Q-2 112 24 116 Q34 106 48 120 L40 122 L48 132 L38 130 Q24 124 10 132Z', BL, BLD),
      extra: iLogo(24, 186, 0.55),
    });
    b += buddyArm(x, 24, RS, K);
    b += x.when([2], speedLines(0, 168, 4, '#ffd84a') + `<g class="pop">${burst(54, 176, 13, '#ffd84a', '#fff')}</g>`);
    return shadow(64, 207) + x.body(b);
  },
},
{
  id: 'sullimike', name: 'Sulli & Bob', role: 'Mana / recul', rarity: 'Épique', rar: 'var(--epi)', tint: '#d0f0ff', tint2: '#6ac0e8', stats: [3, 3, 4],
  atk: 'Coups de griffe ; Bob compte les éliminations (mana).', skill: 'Rugissement : les ennemis à portée reculent.',
  sh: { L: [62, 150], R: [138, 150] },
  poses: [{ L: 14, R: -14 }, { L: 40, R: -40, body: [0, -4, 0, 1, 1.03] }, { L: 110, R: -110, body: [0, -4, 0, 1.03, 1.03] }],
  draw(this: CharDef, x: Ctx): string {
    const F = '#4ab8e8', FD = '#2a7ab0', SP = '#8a4ac8', HO = '#e8dcc0', G = '#8ae04a', GD = '#5aa82a';
    const arm = (sx: number, sy: number) => limb(sx, sy, sx, sy + 34, F, 20) + hand(sx, sy + 42, F, 14) +
      `<path d="M${sx - 8} ${sy + 52} l-2 6 M${sx} ${sy + 54} v6 M${sx + 8} ${sy + 52} l2 6" stroke="${HO}" stroke-width="3.5" stroke-linecap="round"/>`;
    const spots = (pts: number[][]) => pts.map(([a, c, r]) => `<circle cx="${a}" cy="${c}" r="${r}" fill="${SP}" opacity=".85"/>`).join('');
    let b = '';
    b += torso(F, FD, 'M46 204 C42 152 64 132 100 130 C136 132 158 152 154 204Z') + spots([[70, 168, 7], [120, 156, 6], [134, 186, 8], [92, 190, 5]]);
    b += shaded((a) => `<path d="M58 54 Q50 30 62 22 Q70 40 74 50Z" ${a}/>`, HO, '#b8a888', -2, -2) + mirror(shaded((a) => `<path d="M58 54 Q50 30 62 22 Q70 40 74 50Z" ${a}/>`, HO, '#b8a888', -2, -2));
    b += head(F, FD) + spots([[70, 52, 6], [132, 58, 7], [114, 36, 5], [60, 76, 4]]);
    b += x.byPose((p) => face(p, { eye: '#3a7ad8', noMouth: true, noCheeks: true }) +
      (p === 2 ? `<path d="M80 108 Q100 104 120 108 Q118 134 100 136 Q82 134 80 108Z" fill="#7a1f2b" stroke="${O}" stroke-width="3.5"/><path d="M84 110 l4 8 l4 -8 M108 110 l4 8 l4 -8" fill="#fff" stroke="${O}" stroke-width="1.5"/>` : mouth(p)));
    b += x.arm('L', arm) + x.arm('R', arm);
    b += x.when([2], `<g class="ring"><path d="M150 70 Q176 100 150 130 M164 60 Q196 100 164 140 M178 50 Q214 100 178 150" stroke="${F}" stroke-width="5" fill="none" stroke-linecap="round"/></g>`);
    // Bob : boule verte à un œil
    b += x.byPose((p) => {
      let s = shadedW((a) => `<circle cx="24" cy="178" r="26" ${a}/>`, G, GD, -5, -4, 4.5) + gloss(14, 162, 5, 3, -30, 0.5);
      s += `<path d="M10 158 L6 148 M38 158 L42 148" stroke="${HO}" stroke-width="4" stroke-linecap="round"/>`;
      s += `<circle cx="24" cy="172" r="12" fill="#fff" stroke="${O}" stroke-width="3"/><circle cx="25" cy="173" r="6" fill="#4ab84a"/><circle cx="25" cy="173" r="3" fill="${O}"/><circle cx="27" cy="170" r="1.6" fill="#fff"/>`;
      s += p === 1 ? `<path d="M12 158 Q24 154 36 158" stroke="${O}" stroke-width="3" fill="none"/>` : '';
      s += smallMouth(p, 24, 194);
      s += `<g>${limb(8, 204, 6, 206, G, 6)}${limb(40, 204, 42, 206, G, 6)}</g>`;
      return s;
    });
    b += x.when([2], `<g class="pop">${sparkle(52, 150, 9, '#7ad8ff')}${sparkle(4, 140, 7, '#7ad8ff')}</g>`);
    return shadow(68) + x.body(b);
  },
},
{
  id: 'mcqueen', name: 'Flash McQueen & Martin', role: 'Soutien / vitesse', rarity: 'Rare', rar: 'var(--rare)', tint: '#ffd8c8', tint2: '#f08a6a', stats: [2, 5, 3],
  atk: 'Fonce et percute ; Martin remorque l’ennemi (coup de duo).', skill: 'Turbo : ses voisines tirent plus vite.',
  sh: { L: [70, 160], R: [150, 160] },
  poses: [{ L: 0, R: 0 }, { L: 0, R: 0, body: [-4, 0, -4, 1, 1] }, { L: 0, R: 0, body: [10, 0, 3, 1.02, 0.98] }],
  draw(this: CharDef, x: Ctx): string {
    const R = '#e8282c', RD = '#a01820', Y = '#ffd23f', GL = '#bfe6ff', RU = '#a8643a', RUD = '#6e3e22';
    const wheel = (cx: number) => `<circle cx="${cx}" cy="192" r="15" fill="#2b2838" stroke="${O}" stroke-width="4"/><circle cx="${cx}" cy="192" r="7" fill="#e83a3a" stroke="${O}" stroke-width="2.5"/>`;
    let b = '';
    let car = '';
    // Flash : la carrosserie remplit le cadre, les yeux dans le pare-brise
    car += wheel(78) + wheel(168);
    car += shaded((a) => `<path d="M50 192 Q46 150 70 140 L98 106 Q130 92 160 110 L188 144 Q200 158 196 192Z" ${a}/>`, R, RD, -6, -5);
    car += shaded((a) => `<path d="M88 140 L104 112 Q130 102 154 116 L172 142Z" ${a}/>`, GL, '#8ab8d8', -3, -3);
    car += x.byPose((p) => {
      const ry = p === 2 ? 9 : 11;
      return [114, 142].map((ex) => `<ellipse cx="${ex}" cy="128" rx="10" ry="${ry}" fill="#fff" stroke="${O}" stroke-width="2.5"/><circle cx="${ex + 3}" cy="129" r="5.5" fill="#3a7ad8"/><circle cx="${ex + 3}" cy="129" r="2.6" fill="${O}"/><circle cx="${ex + 5}" cy="126" r="1.5" fill="#fff"/>`).join('') +
        (p > 0 ? `<path d="M100 114 L126 120 M156 114 L132 120" stroke="${O}" stroke-width="4" stroke-linecap="round"/>` : '') +
        (p === 2 ? `<path d="M160 168 Q178 166 190 170 Q186 184 174 184 Q162 182 160 168Z" fill="#7a1f2b" stroke="${O}" stroke-width="3"/><path d="M162 170 H188" stroke="#fff" stroke-width="2.5"/>` : `<path d="M160 170 Q176 180 190 168" stroke="${O}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`);
    });
    car += `<path d="M66 162 L96 154 L90 164 L118 158 L84 176 L90 166 L64 172Z" fill="${Y}" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/>`;
    car += `<text x="134" y="176" text-anchor="middle" font-family="'Lilita One',sans-serif" font-size="20" fill="#fff" stroke="${O}" stroke-width="4" paint-order="stroke">95</text>`;
    car += shaded((a) => `<path d="M48 150 L40 132 L66 136 L68 148Z" ${a}/>`, R, RD, -2, -2); // aileron
    car += gloss(150, 112, 12, 4, 20, 0.6);
    b += `<g transform="translate(124 206) scale(1.22) translate(-124 -206)">${car}</g>`;
    // Martin : petite dépanneuse rouillée à gauche
    b += x.byPose((p) => {
      let s = `<circle cx="8" cy="198" r="9" fill="#2b2838" stroke="${O}" stroke-width="3"/><circle cx="38" cy="198" r="9" fill="#2b2838" stroke="${O}" stroke-width="3"/>`;
      s += shadedW((a) => `<path d="M-6 200 L-6 170 L12 168 L18 146 L42 146 L48 170 L50 200Z" ${a}/>`, RU, RUD, -3, -3, 4);
      s += `<path d="M-4 168 L-20 ${p === 2 ? 130 : 150}" stroke="${O}" stroke-width="7"/><path d="M-4 168 L-20 ${p === 2 ? 130 : 150}" stroke="#8a7a6a" stroke-width="3.5"/><path d="M-20 ${p === 2 ? 130 : 150} q-6 6 0 10" stroke="${O}" stroke-width="3" fill="none"/>`;
      s += `<rect x="20" y="150" width="20" height="14" rx="3" fill="${GL}" stroke="${O}" stroke-width="2.5"/>`;
      s += [26, 35].map((ex) => `<ellipse cx="${ex}" cy="157" rx="3.5" ry="${p === 2 ? 3.5 : 4.5}" fill="#6a4a2a"/><circle cx="${ex + 1}" cy="155.5" r="1.2" fill="#fff"/>`).join('');
      s += `<path d="M28 180 h10 v5 h-10Z" fill="#fff" stroke="${O}" stroke-width="2"/>` + smallMouth(p, 33, 176);
      return s;
    });
    b += x.when([1], speedLines(40, 130, 3, '#ffd23f'));
    b += x.when([2], speedLines(36, 120, 5, '#ffd23f') + `<g class="pop">${burst(204, 170, 16, '#ffd23f', '#fff')}</g>`);
    return shadow(90, 207) + x.body(b);
  },
},
{
  id: 'carlrussell', name: 'Carl & Russell', role: 'Booster de fusion', rarity: 'Rare', rar: 'var(--rare)', tint: '#e0f0ff', tint2: '#8ac0f0', stats: [2, 3, 4],
  atk: 'Coups de canne ; les ballons soulèvent un ennemi.', skill: 'Booster : fait monter de rang une alliée.',
  sh: { L: [70, 150], R: [130, 150] },
  poses: [{ L: 14, R: -12 }, { L: 24, R: -120 }, { L: 20, R: -100, body: [4, -4, 4, 1, 1] }],
  draw(this: CharDef, x: Ctx): string {
    const G = '#7a7f98', GD = '#4f5468', W = '#f4f4f8', WD = '#c8c8d6', SC = '#f2c84a', OR = '#f08a2a', BR = '#7a4a2a';
    const armL = (sx: number, sy: number) => limb(sx, sy, sx, sy + 34, G, 13) + hand(sx, sy + 40, SK, 10);
    const armR = (sx: number, sy: number) => limb(sx, sy, sx, sy + 34, G, 13) + hand(sx, sy + 40, SK, 10) +
      `<path d="M${sx} ${sy + 40} V${sy + 92} M${sx} ${sy + 40} q-12 -10 -20 0" stroke="${O}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M${sx} ${sy + 40} V${sy + 92} M${sx} ${sy + 40} q-12 -10 -20 0" stroke="${BR}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    let b = '';
    // grappe de ballons derrière
    b += x.byPose((p) => {
      let s = '';
      const pts = [[150, 30], [174, 50], [130, 14], [166, 8], [190, 22], [146, 54], [118, 40]];
      pts.forEach(([bx, by], i) => { s += balloon(bx!, by! - (p === 2 ? 8 : 0), 13, BALLOON_COLORS[i % 6]!, 138, 132); });
      return s;
    });
    b += torso(G, GD);
    b += `<path d="M90 140 L100 152 L110 140 L106 202 L94 202Z" fill="${W}" stroke="${O}" stroke-width="3"/><path d="M92 146 L100 152 L108 146 L104 160 L96 160Z" fill="${BR}" stroke="${O}" stroke-width="2.5"/>`;
    b += shaded((a) => `<path d="M48 84 Q46 30 100 28 Q154 30 152 84 L148 128 Q140 146 100 146 Q60 146 52 128Z" ${a}/>`, SK, SKD, -6, -5); // tête carrée
    b += x.byPose((p) => face(p, { eye: '#3a2a20', brow: '#d8d8e0', noMouth: true }) + `<path d="M90 118 Q100 ${p === 2 ? 126 : 114} 110 118" stroke="${O}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`);
    b += `<g fill="none" stroke="${O}" stroke-width="5"><rect x="66" y="82" width="28" height="26" rx="4"/><rect x="106" y="82" width="28" height="26" rx="4"/><path d="M94 92 H106"/></g>`;
    b += `<path d="M48 70 Q40 56 50 50 Q56 62 60 64 M152 70 Q160 56 150 50 Q144 62 140 64" fill="${W}" stroke="${O}" stroke-width="3"/>`;
    b += `<path d="M64 74 Q100 60 136 74" stroke="${W}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    b += x.arm('L', armL) + x.arm('R', armR);
    // Russell
    b += buddy(x, {
      cx: 24, body: SC, bodyD: '#c99f26', skin: '#e8b88a', skinD: '#c08a5e', eye: '#2a1a10', r: 25,
      extra: `<path d="M6 172 L40 202" stroke="${OR}" stroke-width="7"/><circle cx="22" cy="186" r="3" fill="#d84a4a"/><circle cx="30" cy="192" r="3" fill="#4a8ad8"/>`,
      hair: shadedW((a) => `<path d="M-2 136 Q0 112 24 112 Q48 112 50 136 Q24 126 -2 136Z" ${a}/>`, '#3a5ad8', '#22398e', -2, -2, 4) + `<path d="M48 134 Q60 134 62 140 L46 140Z" fill="#3a5ad8" stroke="${O}" stroke-width="3"/><circle cx="24" cy="122" r="5" fill="${SC}" stroke="${O}" stroke-width="2"/>`,
    });
    b += buddyArm(x, 24, SC, '#e8b88a');
    b += x.when([2], `<g class="pop">${sparkle(200, 80, 10, '#ffd23f')}${sparkle(186, 110, 7, '#fff')}</g>`);
    return shadow() + x.body(b);
  },
},
{
  id: 'joysadness', name: 'Joie & Tristesse', role: 'Copieur', rarity: 'Épique', rar: 'var(--epi)', tint: '#fff4c0', tint2: '#f0d060', stats: [3, 3, 4],
  atk: 'Billes de souvenirs ; Tristesse empoisonne de mélancolie.', skill: 'Souvenirs : copie une alliée.',
  sh: { L: [70, 150], R: [130, 150] },
  poses: [{ L: 12, R: -12 }, { L: 30, R: -150 }, { L: 140, R: -100, body: [4, -4, 4, 1, 1] }],
  draw(this: CharDef, x: Ctx): string {
    const Y = '#ffe27a', YD = '#e8b84a', BH = '#3a5ad8', BHD = '#22398e', GR = '#8ae05a', GRD = '#5aa82a', SB = '#7ab0f0', SBD = '#4a7ac8';
    const arm = (sx: number, sy: number) => limb(sx, sy, sx, sy + 32, Y, 11) + hand(sx, sy + 38, Y, 9);
    const orb = (cx: number, cy: number, r: number, c: string) => `<circle cx="${cx}" cy="${cy}" r="${r + 6}" fill="${c}" opacity=".25"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}" stroke="${O}" stroke-width="3"/>` + gloss(cx - r * 0.35, cy - r * 0.4, r * 0.3, r * 0.15, -35, 0.8);
    let b = '';
    b += `<circle cx="100" cy="100" r="88" fill="#fff6c0" opacity=".25"/>`;
    b += torso(GR, GRD, 'M64 202 C62 160 74 140 100 138 C126 140 138 160 136 202Z');
    b += `<path d="M76 168 l4 4 M118 158 l4 4 M98 186 l4 4" stroke="#2b8a2a" stroke-width="3" stroke-linecap="round"/>`;
    b += head(Y, YD);
    b += x.byPose((p) => face(p, { eye: '#3a6ad8', noMouth: true }) + mouth(p));
    b += hairS('M44 84 Q34 26 100 26 Q160 24 158 80 Q150 58 136 56 L140 70 Q122 48 104 54 L106 42 Q84 58 66 54 L68 68 Q54 64 44 84Z', BH, BHD);
    b += x.arm('L', arm) + x.arm('R', arm);
    b += x.when([1], orb(...tip(this, 'R', 1, 52), 12, '#ffd23f'));
    const [hx, hy] = tip(this, 'R', 2, 50);
    b += x.when([2], `<g class="fly">${orb(hx + 30, hy - 4, 13, '#ffd23f')}${orb(hx + 60, hy + 14, 10, SB)}</g>`);
    // Tristesse
    b += buddy(x, {
      cx: 22, body: '#e8e8f0', bodyD: '#b8b8c8', skin: SB, skinD: SBD, eye: '#22398e', glasses: true,
      hairBack: hairS('M-4 154 Q-8 116 22 114 Q52 116 48 154 L40 154 Q38 128 22 126 Q6 128 4 154Z', '#2a3a9a', '#18226a'),
      hair: hairS('M-2 138 Q0 116 22 116 Q44 116 46 138 Q36 126 22 126 Q8 126 -2 138Z', '#2a3a9a', '#18226a'),
    });
    b += x.when([2], `<g class="pop">${orb(54, 150, 8, SB)}</g>`);
    return shadow() + x.body(b);
  },
},
];
