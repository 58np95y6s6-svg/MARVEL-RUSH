// Héros Pixar, planche B (design/planches/10-pixar-heros.html) : Rémy & Linguini, WALL-E & EVE, Luca & Alberto,
// Mei, Jessie & Pile-Poil, Ian & Barley, Joe & 22.
/* eslint-disable */
import { O, SK, SKD, f, shaded, gloss, limb, hand, glow, burst, beam, sparks, torso, head, face, mirror, shadow, tip, dirOf, type CharDef, type Ctx } from '../primitives';
import { shadedW, note } from '../kits/disneyB';
import { buddy, buddyArm, trashCube, hairS, mouth, smallMouth, sparkle, SKB, SKBD } from '../kits/pixar';

const POSES = [{ L: 12, R: -12 }, { L: 22, R: -150, body: [-3, -3, -6, 1, 1.02] }, { L: 30, R: -98, body: [7, 0, 7, 1, 1] }];

export const PIXAR_B: CharDef[] = [
{
  id: 'remy', name: 'Rémy & Linguini', role: 'Sacrifice / mana', rarity: 'Rare', rar: 'var(--rare)', tint: '#f0f0f8', tint2: '#b8b8d0', stats: [2, 3, 4],
  atk: 'Coups de louche ; Linguini renverse la marmite (coup de duo).', skill: 'Recette : du mana à chaque vague, et en sacrifice.',
  sh: { L: [70, 150], R: [130, 150] },
  poses: POSES,
  draw(this: CharDef, x: Ctx): string {
    const W = '#f4f4f8', WD = '#c8c8d6', H = '#c8542a', HD = '#8a3418', RT = '#7a84a8', RTD = '#4f5878', PK = '#ff9aa8', ST = '#c8a070';
    const armL = (sx: number, sy: number) => limb(sx, sy, sx, sy + 34, W, 13) + hand(sx, sy + 40, SK, 10);
    const ladle = (sx: number, sy: number) => `<path d="M${sx} ${sy + 40} V${sy + 74}" stroke="${O}" stroke-width="8" stroke-linecap="round"/><path d="M${sx} ${sy + 40} V${sy + 74}" stroke="#b8c0d0" stroke-width="4" stroke-linecap="round"/><path d="M${sx - 12} ${sy + 72} Q${sx} ${sy + 92} ${sx + 12} ${sy + 72}Z" fill="#b8c0d0" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/>`;
    const armR = (sx: number, sy: number) => limb(sx, sy, sx, sy + 34, W, 13) + ladle(sx, sy) + hand(sx, sy + 40, SK, 10);
    let b = '';
    b += torso(W, WD);
    b += [86, 114].map((bx) => [154, 172, 190].map((by) => `<circle cx="${bx}" cy="${by}" r="3" fill="${WD}" stroke="${O}" stroke-width="1.5"/>`).join('')).join('');
    b += `<path d="M76 140 Q100 152 124 140 L120 148 Q100 158 80 148Z" fill="#d84a4a" stroke="${O}" stroke-width="3"/>`;
    b += head(SK, SKD);
    b += x.byPose((p) => face(p, { eye: '#3a2a20', noMouth: true }) + mouth(p)) + `<g fill="#c87a5a" opacity=".6"><circle cx="72" cy="112" r="1.5"/><circle cx="78" cy="116" r="1.5"/><circle cx="124" cy="114" r="1.5"/><circle cx="130" cy="110" r="1.5"/></g>`;
    b += hairS('M46 90 Q40 46 70 40 L64 60 Q78 46 94 50 L90 64 Q108 50 132 56 L126 66 Q150 66 154 92 Q140 72 100 70 Q60 72 46 90Z', H, HD);
    // toque, et Rémy perché devant
    b += shaded((a) => `<path d="M60 52 Q54 10 82 14 Q92 -6 114 4 Q140 -4 146 22 Q160 34 140 52Z" ${a}/>`, W, WD, -4, -4);
    b += shaded((a) => `<rect x="60" y="44" width="80" height="14" rx="4" ${a}/>`, W, WD, -2, -2);
    b += x.byPose((p) => {
      let s = shadedW((a) => `<ellipse cx="106" cy="34" rx="13" ry="11" ${a}/>`, RT, RTD, -3, -3, 3.5);
      s += shadedW((a) => `<circle cx="94" cy="24" r="8" ${a}/>`, RT, RTD, -2, -2, 3) + shadedW((a) => `<circle cx="118" cy="24" r="8" ${a}/>`, RT, RTD, -2, -2, 3);
      s += `<circle cx="94" cy="24" r="4" fill="${PK}"/><circle cx="118" cy="24" r="4" fill="${PK}"/>`;
      s += [101, 111].map((ex) => `<ellipse cx="${ex}" cy="33" rx="2.6" ry="${p === 2 ? 2.4 : 3.2}" fill="${O}"/><circle cx="${ex + 0.8}" cy="32" r="1" fill="#fff"/>`).join('');
      s += `<ellipse cx="106" cy="41" rx="3.5" ry="2.5" fill="${PK}" stroke="${O}" stroke-width="1.5"/>`;
      s += p === 2 ? `<path d="M102 44 Q106 50 110 44" stroke="${O}" stroke-width="2" fill="#7a1f2b"/>` : '';
      return s;
    });
    b += x.arm('L', armL) + x.arm('R', armR);
    const [hx, hy] = tip(this, 'R', 2, 84);
    b += x.when([1], `<g class="fx"><path d="M150 60 q6 -10 0 -18 q-6 -8 0 -16" stroke="#fff" stroke-width="4" fill="none" opacity=".8" stroke-linecap="round"/></g>`);
    b += x.when([2], `<g class="fly"><circle cx="${f(hx + 24)}" cy="${f(hy - 6)}" r="8" fill="${ST}" stroke="${O}" stroke-width="2.5"/><circle cx="${f(hx + 44)}" cy="${f(hy + 6)}" r="6" fill="#e86a3a" stroke="${O}" stroke-width="2.5"/><circle cx="${f(hx + 36)}" cy="${f(hy - 22)}" r="5" fill="#8ae05a" stroke="${O}" stroke-width="2"/></g><g class="pop">${burst(f(hx + 50), f(hy - 4), 14, ST, '#fff')}</g>`);
    return shadow() + x.body(b);
  },
},
{
  id: 'walleeve', name: 'WALL-E & EVE', role: 'Dégâts / rayon', rarity: 'Légendaire', rar: 'var(--leg)', tint: '#fff0c8', tint2: '#e8c070', stats: [5, 3, 4],
  atk: 'WALL-E lance des cubes compactés.', skill: 'Directive : le rayon d’EVE frappe autour de la cible (coup de duo).',
  sh: { L: [66, 154], R: [134, 154] },
  poses: [{ L: 20, R: -20 }, { L: 30, R: -130 }, { L: 30, R: -100, body: [4, 0, 4, 1, 1] }],
  draw(this: CharDef, x: Ctx): string {
    const Y = '#e8b03a', YD = '#a87418', G = '#8a8a9a', GD = '#5a5a6a', W = '#f8f8fc', WD = '#c8ccd8', BL = '#5ad8ff';
    const arm = (sx: number, sy: number) => `<rect x="${sx - 7}" y="${sy}" width="14" height="30" rx="3" fill="${G}" stroke="${O}" stroke-width="3.5"/>` +
      `<path d="M${sx - 10} ${sy + 30} L${sx - 12} ${sy + 44} M${sx + 10} ${sy + 30} L${sx + 12} ${sy + 44}" stroke="${O}" stroke-width="8" stroke-linecap="round"/><path d="M${sx - 10} ${sy + 30} L${sx - 12} ${sy + 44} M${sx + 10} ${sy + 30} L${sx + 12} ${sy + 44}" stroke="${G}" stroke-width="4" stroke-linecap="round"/>`;
    let b = '';
    // chenilles
    b += [[66], [134]].map(([cx]) => `<rect x="${cx! - 22}" y="178" width="44" height="28" rx="12" fill="#3a3540" stroke="${O}" stroke-width="4"/><circle cx="${cx! - 10}" cy="192" r="6" fill="${GD}" stroke="${O}" stroke-width="2"/><circle cx="${cx! + 10}" cy="192" r="6" fill="${GD}" stroke="${O}" stroke-width="2"/>`).join('');
    b += shaded((a) => `<rect x="56" y="118" width="88" height="66" rx="6" ${a}/>`, Y, YD, -6, -4);
    b += `<rect x="64" y="126" width="72" height="12" rx="2" fill="${YD}" stroke="${O}" stroke-width="2.5"/><circle cx="74" cy="160" r="5" fill="#d84a4a" stroke="${O}" stroke-width="2"/><rect x="104" y="150" width="28" height="20" rx="2" fill="${G}" stroke="${O}" stroke-width="2.5"/>`;
    b += `<path d="M98 118 V96" stroke="${O}" stroke-width="12"/><path d="M98 118 V96" stroke="${G}" stroke-width="6"/>`;
    // tête jumelles
    b += x.byPose((p) => {
      const tilt = p === 1 ? -8 : p === 2 ? 6 : 0;
      let s = `<g transform="rotate(${tilt} 100 90)">`;
      for (const [ex, d] of [[78, -1], [120, 1]] as const) {
        s += shaded((a) => `<path d="M${ex - 20} 70 L${ex + 20} 66 L${ex + 22} 104 L${ex - 20} 106Z" ${a}/>`, G, GD, -3, -3);
        s += `<circle cx="${ex}" cy="86" r="13" fill="#2b2838" stroke="${O}" stroke-width="3"/><circle cx="${ex + 2 * d}" cy="86" r="${p === 2 ? 6 : 7.5}" fill="#4a4a5a"/><circle cx="${ex + 4}" cy="82" r="3" fill="#fff"/>`;
      }
      s += p === 1 ? `<path d="M60 64 L94 70 M140 60 L106 70" stroke="${O}" stroke-width="5" stroke-linecap="round"/>` : '';
      return s + '</g>';
    });
    b += x.arm('L', arm) + x.arm('R', arm);
    b += x.when([1], `<g class="fx">${trashCube(...tip(this, 'R', 1, 52), 1)}</g>`);
    const [hx, hy] = tip(this, 'R', 2, 50);
    b += x.when([2], `<g class="fly">${trashCube(hx + 40, hy - 8, 1.1)}</g>`);
    // EVE en vol à gauche
    b += x.byPose((p) => {
      const ey = p === 2 ? 102 : 112;
      let s = shadedW((a) => `<path d="M24 ${ey - 34} Q48 ${ey - 34} 46 ${ey + 10} Q42 ${ey + 50} 24 ${ey + 56} Q6 ${ey + 50} 2 ${ey + 10} Q0 ${ey - 34} 24 ${ey - 34}Z" ${a}/>`, W, WD, -4, -3, 4);
      s += `<path d="M6 ${ey - 4} Q24 ${ey - 22} 42 ${ey - 4} Q42 ${ey + 10} 24 ${ey + 10} Q6 ${ey + 10} 6 ${ey - 4}Z" fill="#1d1733"/>`;
      s += [16, 32].map((ex) => p === 2
        ? `<path d="M${ex - 5} ${ey - 2} Q${ex} ${ey - 8} ${ex + 5} ${ey - 2}" stroke="${BL}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
        : `<ellipse cx="${ex}" cy="${ey - 2}" rx="5" ry="3.5" fill="${BL}"/>`).join('');
      s += gloss(14, ey - 22, 5, 2.5, -30, 0.7);
      s += `<ellipse cx="24" cy="${ey + 70}" rx="12" ry="3" fill="${BL}" opacity=".35"/>`;
      if (p === 2) s += `<g class="grow">${beam(46, ey + 20, 200, ey + 50, 6, BL)}</g><g class="pop">${burst(198, ey + 50, 16, BL, '#fff')}</g>`;
      return s;
    });
    return shadow(76) + x.body(b);
  },
},
{
  id: 'lucaalberto', name: 'Luca & Alberto', role: 'Formation', rarity: 'Rare', rar: 'var(--rare)', tint: '#c8f0e8', tint2: '#5ac8b0', stats: [2, 3, 4],
  atk: 'Coups de nageoire ; une vague fait reculer la cible (coup de duo).', skill: 'Formation : plus fort à plusieurs, côte à côte.',
  sh: { L: [70, 150], R: [130, 150] },
  poses: POSES,
  draw(this: CharDef, x: Ctx): string {
    const T = '#4ac8b0', TD = '#2a8a78', FN = '#d86aa8', FND = '#a04078', ST = '#3a5ad8', P = '#a87ad8', PD = '#7048a8', OR = '#f0a03a';
    const arm = (sx: number, sy: number) => limb(sx, sy, sx, sy + 34, T, 12) + hand(sx, sy + 40, T, 10);
    const fins = (c: string, cd: string) => hairS('M46 70 Q30 44 50 34 Q54 50 64 48 Q62 26 82 22 Q86 38 96 38 Q100 16 120 20 Q118 38 130 40 Q142 26 156 38 Q148 52 154 70 Q120 44 100 46 Q72 46 46 70Z', c, cd);
    let b = '';
    b += torso('#f4f4f8', '#c8c8d6');
    b += [150, 166, 182, 198].map((y) => `<path d="M60 ${y} H140" stroke="${ST}" stroke-width="6" opacity=".9"/>`).join('');
    b += head(T, TD);
    b += `<g fill="${TD}" opacity=".7"><circle cx="66" cy="70" r="4"/><circle cx="136" cy="66" r="5"/><circle cx="124" cy="120" r="3"/><circle cx="72" cy="122" r="3"/></g>`;
    b += x.byPose((p) => face(p, { eye: '#3a2a20', noMouth: true }) + mouth(p));
    b += fins(FN, FND);
    b += shaded((a) => `<path d="M44 96 L26 84 L32 106Z" ${a}/>`, FN, FND, -2, -2) + mirror(shaded((a) => `<path d="M44 96 L26 84 L32 106Z" ${a}/>`, FN, FND, -2, -2));
    b += x.arm('L', arm) + x.arm('R', arm);
    // Alberto
    b += buddy(x, {
      cx: 22, body: OR, bodyD: '#b8701a', skin: P, skinD: PD, eye: '#2a1a10',
      hair: hairS('M-2 138 Q-12 120 4 116 Q4 106 16 110 Q20 98 30 108 Q40 100 44 114 Q56 116 46 138 Q24 122 -2 138Z', OR, '#b8701a'),
    });
    b += buddyArm(x, 22, P, P);
    const [hx, hy] = tip(this, 'R', 2, 44);
    b += x.when([2], `<g class="grow"><path d="M${f(hx)} ${f(hy + 10)} Q${f(hx + 30)} ${f(hy - 30)} ${f(hx + 70)} ${f(hy + 10)} Q${f(hx + 50)} ${f(hy)} ${f(hx + 40)} ${f(hy + 20)}Z" fill="#5ab8ff" stroke="${O}" stroke-width="4" stroke-linejoin="round"/></g><g class="pop">${sparks(hx + 50, hy, 20, '#c8f0ff', 7)}</g>`);
    return shadow() + x.body(b);
  },
},
{
  id: 'mei', name: 'Mei (panda roux)', role: 'Croissance', rarity: 'Épique', rar: 'var(--epi)', tint: '#ffd8c0', tint2: '#f08a5a', stats: [4, 2, 4],
  atk: 'Coups de patte qui écrasent autour.', skill: 'Panda géant : grandit à chaque élimination, sans plafond.',
  sh: { L: [56, 150], R: [144, 150] },
  poses: [{ L: 16, R: -16 }, { L: 40, R: -150, body: [0, -6, 0, 1.03, 1.04] }, { L: 30, R: -30, body: [0, 4, 0, 1.06, 0.95] }],
  draw(this: CharDef, x: Ctx): string {
    const R = '#d8582a', RD = '#9a3416', W = '#fff4e8', K = '#3a2420', KD = '#1d1210';
    const arm = (sx: number, sy: number) => limb(sx, sy, sx, sy + 34, K, 22) + hand(sx, sy + 42, K, 15) + `<path d="M${sx - 7} ${sy + 52} v5 M${sx} ${sy + 54} v5 M${sx + 7} ${sy + 52} v5" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;
    let b = '';
    b += torso(R, RD, 'M42 204 C38 150 62 130 100 128 C138 130 162 150 158 204Z');
    b += shaded((a) => `<ellipse cx="100" cy="176" rx="34" ry="28" ${a}/>`, '#e8784a', R, -3, -3);
    // oreilles
    const ear = shaded((a) => `<path d="M46 56 Q36 18 70 28 Q70 44 60 60Z" ${a}/>`, R, RD, -3, -3) + `<path d="M50 50 Q46 32 62 36" stroke="${K}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    b += ear + mirror(ear);
    b += head(R, RD);
    b += `<path d="M58 106 Q64 132 100 134 Q136 132 142 106 Q128 92 100 104 Q72 92 58 106Z" fill="${W}" stroke="${O}" stroke-width="3.5"/>`;
    b += `<path d="M66 66 Q74 74 72 84 M134 66 Q126 74 128 84" stroke="${W}" stroke-width="7" stroke-linecap="round" fill="none"/>`;
    b += x.byPose((p) => face(p, { eye: '#5a2a1a', noMouth: true }) + `<ellipse cx="100" cy="110" rx="7" ry="5" fill="${K}"/>` +
      (p === 2 ? `<path d="M86 118 Q100 116 114 118 Q110 132 100 132 Q90 132 86 118Z" fill="#7a1f2b" stroke="${O}" stroke-width="3"/><path d="M90 119 l3 6 l3 -6 M104 119 l3 6 l3 -6" fill="#fff"/>` : smallMouth(p, 100, 122)));
    b += x.arm('L', arm) + x.arm('R', arm);
    b += x.when([1], `<g class="fx"><circle cx="100" cy="110" r="96" fill="#ff8a5a" opacity=".14"/></g>`);
    b += x.when([2], `<g class="ring"><ellipse cx="100" cy="204" rx="90" ry="14" fill="none" stroke="${O}" stroke-width="8"/><ellipse cx="100" cy="204" rx="90" ry="14" fill="none" stroke="#ff8a5a" stroke-width="4"/></g><g class="pop">${burst(176, 196, 18, '#ff8a5a', '#fff3c0')}${burst(24, 196, 14, '#ff8a5a', '#fff3c0')}</g>`);
    return shadow(74) + x.body(b);
  },
},
{
  id: 'jessie', name: 'Jessie & Pile-Poil', role: 'Contrôle / malus', rarity: 'Épique', rar: 'var(--epi)', tint: '#ffe0d0', tint2: '#f09a7a', stats: [2, 4, 3],
  atk: 'Coups de lasso qui marquent la cible.', skill: 'Lasso : la cible recule, Pile-Poil galope (coup de duo).',
  sh: { L: [70, 150], R: [130, 150] },
  poses: [{ L: 12, R: -12 }, { L: 22, R: -170 }, { L: 30, R: -110, body: [6, 0, 6, 1, 1] }],
  draw(this: CharDef, x: Ctx): string {
    const H = '#d8382c', HD = '#9b1d20', W = '#f8f8fc', WD = '#c8c8d6', Y = '#f6c83a', BJ = '#4a7ad8', BR = '#9a6a3a', BRD = '#6a4422', RO = '#e8c070', K = '#3a2420';
    const arm = (sx: number, sy: number) => limb(sx, sy, sx, sy + 32, W, 12) + hand(sx, sy + 38, SK, 9);
    let b = '';
    b += hairS('M140 70 Q166 90 158 140 Q160 168 150 186 Q140 176 144 150 Q146 110 128 84Z', H, HD); // tresse
    b += `<circle cx="150" cy="188" r="6" fill="${Y}" stroke="${O}" stroke-width="2.5"/>`;
    b += torso(W, WD);
    b += `<path d="M62 160 Q62 140 78 138 L88 202 L60 202Z M138 160 Q138 140 122 138 L112 202 L140 202Z" fill="${W}" stroke="${O}" stroke-width="3.5"/><g fill="${O}"><ellipse cx="70" cy="160" rx="4" ry="5"/><ellipse cx="74" cy="184" rx="5" ry="4"/><ellipse cx="130" cy="170" rx="5" ry="4"/></g>`;
    b += `<path d="M80 138 L100 150 L120 138 L114 132 L100 140 L86 132Z" fill="${Y}" stroke="${O}" stroke-width="3"/>`;
    b += head(SK, SKD);
    b += x.byPose((p) => face(p, { eye: '#3a7a3a', noMouth: true }) + mouth(p));
    b += hairS('M46 90 Q44 50 100 46 Q156 50 154 90 Q140 64 100 64 Q60 64 46 90Z', H, HD);
    b += shaded((a) => `<ellipse cx="100" cy="50" rx="70" ry="12" ${a}/>`, H, HD, -3, -3);
    b += shaded((a) => `<path d="M64 50 Q60 4 100 6 Q140 4 136 50 Q100 40 64 50Z" ${a}/>`, H, HD, -4, -4) + `<path d="M64 44 Q100 34 136 44" stroke="${W}" stroke-width="5" fill="none"/>`;
    b += x.arm('L', arm);
    b += x.arm('R', (sx, sy) => arm(sx, sy) + x.when([1, 2], `<ellipse cx="${sx}" cy="${sy + 62}" rx="14" ry="20" fill="none" stroke="${O}" stroke-width="7"/><ellipse cx="${sx}" cy="${sy + 62}" rx="14" ry="20" fill="none" stroke="${RO}" stroke-width="3.5"/>`));
    const [hx, hy] = tip(this, 'R', 2, 40);
    b += x.when([2], `<g class="grow"><path d="M${f(hx)} ${f(hy)} Q${f(hx + 50)} ${f(hy - 40)} ${f(hx + 90)} ${f(hy + 10)}" stroke="${O}" stroke-width="7" fill="none"/><path d="M${f(hx)} ${f(hy)} Q${f(hx + 50)} ${f(hy - 40)} ${f(hx + 90)} ${f(hy + 10)}" stroke="${RO}" stroke-width="3.5" fill="none"/></g><g class="pop"><ellipse cx="${f(hx + 94)}" cy="${f(hy + 16)}" rx="14" ry="8" fill="none" stroke="${O}" stroke-width="7"/><ellipse cx="${f(hx + 94)}" cy="${f(hy + 16)}" rx="14" ry="8" fill="none" stroke="${RO}" stroke-width="3.5"/></g>`);
    // Pile-Poil : tête de cheval
    b += x.byPose((p) => {
      const lift = p === 2 ? -8 : 0;
      let s = `<g transform="translate(0 ${lift})">`;
      s += shadedW((a) => `<path d="M-2 206 Q-6 170 14 160 L40 160 Q52 176 48 206Z" ${a}/>`, BR, BRD, -3, -3, 4.5);
      s += shadedW((a) => `<path d="M4 168 Q-4 130 18 116 Q40 108 46 130 Q50 150 40 170 Q22 178 4 168Z" ${a}/>`, BR, BRD, -4, -3, 4.5);
      s += `<path d="M18 118 Q30 100 40 112 Q44 120 46 130 Q34 120 26 124Z" fill="${K}" stroke="${O}" stroke-width="3"/>`;
      s += `<path d="M12 120 L8 104 L20 114Z M30 114 L34 98 L40 112Z" fill="${BR}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`;
      s += shadedW((a) => `<ellipse cx="14" cy="160" rx="16" ry="11" ${a}/>`, '#e8c8a8', '#b89878', -2, -2, 3.5) + `<circle cx="8" cy="158" r="2" fill="${O}"/><circle cx="18" cy="158" r="2" fill="${O}"/>`;
      s += [20, 34].map((ex) => `<ellipse cx="${ex}" cy="136" rx="4" ry="${p === 2 ? 4 : 5}" fill="#2a1a10"/><circle cx="${ex + 1.2}" cy="134" r="1.4" fill="#fff"/>`).join('');
      s += p === 2 ? `<path d="M4 166 Q14 176 24 166" stroke="${O}" stroke-width="3" fill="#7a1f2b"/>` : `<path d="M6 166 Q14 170 22 166" stroke="${O}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
      return s + '</g>';
    });
    return shadow() + x.body(b);
  },
},
{
  id: 'ianbarley', name: 'Ian & Barley', role: 'Sorts aléatoires', rarity: 'Épique', rar: 'var(--epi)', tint: '#e0d8ff', tint2: '#9a8ae8', stats: [4, 3, 3],
  atk: 'Éclats du bâton magique.', skill: 'Bâton magique : un sort au hasard (feu, temps, croissance, rayon).',
  sh: { L: [70, 150], R: [130, 150] },
  poses: [{ L: 12, R: -24 }, { L: 22, R: -170 }, { L: 30, R: -120, body: [4, -2, 4, 1, 1] }],
  draw(this: CharDef, x: Ctx): string {
    const SB = '#7ab0e8', SBD = '#4a80c0', HO = '#b8484a', HOD = '#7e2830', H = '#3a2a3a', HD = '#1d141d', ST = '#9a6a3a', GM = '#ffb83a', DE = '#4a6aa8', BE = '#4a5a3a';
    const arm = (sx: number, sy: number) => limb(sx, sy, sx, sy + 32, HO, 12) + hand(sx, sy + 38, SB, 9);
    const staff = (sx: number, sy: number) => `<path d="M${sx} ${sy + 30} V${sy + 90}" stroke="${O}" stroke-width="10" stroke-linecap="round"/><path d="M${sx} ${sy + 30} V${sy + 90}" stroke="${ST}" stroke-width="6" stroke-linecap="round"/>` +
      `<path d="M${sx - 8} ${sy + 84} Q${sx} ${sy + 102} ${sx + 8} ${sy + 84}" stroke="${O}" stroke-width="8" fill="none"/><path d="M${sx - 8} ${sy + 84} Q${sx} ${sy + 102} ${sx + 8} ${sy + 84}" stroke="${ST}" stroke-width="4" fill="none"/><circle cx="${sx}" cy="${sy + 92}" r="7" fill="${GM}" stroke="${O}" stroke-width="3"/>`;
    let b = '';
    b += torso(HO, HOD);
    b += `<path d="M88 140 Q100 150 112 140" stroke="${HOD}" stroke-width="4" fill="none"/>`;
    b += shaded((a) => `<path d="M48 90 L22 70 L40 104Z" ${a}/>`, SB, SBD, -2, -2) + mirror(shaded((a) => `<path d="M48 90 L22 70 L40 104Z" ${a}/>`, SB, SBD, -2, -2));
    b += head(SB, SBD);
    b += x.byPose((p) => face(p, { eye: '#3a2a50', noMouth: true }) + mouth(p));
    b += hairS('M44 84 Q40 30 100 28 Q160 30 156 84 Q150 54 126 48 Q118 60 100 54 Q84 64 70 56 Q52 62 44 84Z', H, HD);
    b += x.arm('L', arm);
    b += x.arm('R', (sx, sy) => staff(sx, sy) + arm(sx, sy));
    const [hx, hy] = tip(this, 'R', 2, 92), [dx, dy] = dirOf(this, 'R', 2);
    b += x.when([1], glow(...tip(this, 'R', 1, 92), 16, GM));
    b += x.when([2], `<g class="grow">${beam(hx, hy, hx + dx * 80, hy + dy * 80, 8, GM)}</g><g class="pop">${burst(f(hx + dx * 84), f(hy + dy * 84), 18, '#ff6a3a', '#fff3c0')}${sparkle(hx, hy - 20, 8, '#fff')}</g>`);
    // Barley
    b += buddy(x, {
      cx: 22, body: DE, bodyD: '#2f4a80', skin: SB, skinD: SBD, eye: '#2a1a30', r: 25,
      extra: `<circle cx="14" cy="184" r="4" fill="#f6c83a" stroke="${O}" stroke-width="1.5"/><circle cx="32" cy="190" r="4" fill="#d84a4a" stroke="${O}" stroke-width="1.5"/>`,
      hairBack: hairS('M-6 160 Q-10 130 0 126 L44 126 Q54 130 50 160 L42 150 L4 150Z', H, HD),
      hair: hairS('M-4 134 Q-4 108 22 106 Q48 108 48 134 Q24 124 -4 134Z', BE, '#2a3420') + `<path d="M-2 132 Q22 122 46 132" stroke="#6a7a4a" stroke-width="4" fill="none"/>`,
    });
    b += buddyArm(x, 22, DE, SB);
    return shadow() + x.body(b);
  },
},
{
  id: 'joe', name: 'Joe & 22', role: 'Soutien / galvanisation', rarity: 'Légendaire', rar: 'var(--leg)', tint: '#d0f4f0', tint2: '#6ad8c8', stats: [4, 4, 4],
  atk: 'Notes de jazz ; l’étincelle de 22 double un coup (coup de duo).', skill: 'Musique de l’âme : toutes tes unités tirent plus vite.',
  sh: { L: [70, 150], R: [130, 150] },
  poses: [{ L: 12, R: -12 }, { L: 40, R: -40 }, { L: 120, R: -120, body: [0, -3, 0, 1, 1.02] }],
  draw(this: CharDef, x: Ctx): string {
    const SU = '#5a6a8a', SUD = '#3a4a68', HT = '#2b2838', HTD = '#15131f', MN = '#9af0d8', MND = '#5ac0a8', GD = '#ffd23f';
    const arm = (sx: number, sy: number) => limb(sx, sy, sx, sy + 32, SU, 13) + hand(sx, sy + 38, SKB, 10);
    let b = '';
    b += torso(SU, SUD);
    b += `<path d="M88 138 L100 160 L112 138" fill="#f4f4f8" stroke="${O}" stroke-width="3"/><path d="M96 146 L100 152 L104 146 L102 164 L98 164Z" fill="#d84a4a" stroke="${O}" stroke-width="2"/>`;
    b += head(SKB, SKBD);
    b += x.byPose((p) => face(p, { eye: '#2a1a10', noMouth: true, noCheeks: true }) + mouth(p));
    b += `<g fill="none" stroke="${O}" stroke-width="4.5"><rect x="64" y="82" width="30" height="24" rx="8"/><rect x="106" y="82" width="30" height="24" rx="8"/><path d="M94 92 H106"/></g>`;
    b += shaded((a) => `<ellipse cx="100" cy="44" rx="62" ry="11" ${a}/>`, HT, HTD, -3, -3);
    b += shaded((a) => `<path d="M64 44 Q62 10 100 12 Q138 10 136 44Z" ${a}/>`, HT, HTD, -4, -4) + `<path d="M64 38 H136" stroke="#8a6a3a" stroke-width="5"/>`;
    b += x.arm('L', arm) + x.arm('R', arm);
    b += x.when([1], `<g class="fx">${note(160, 70, 1, GD)}</g>`);
    b += x.when([2], `<g class="fly">${note(172, 60, 1.2, GD)}${note(196, 100, 1, MN)}${note(150, 34, 0.9, '#ff8ab8')}</g>`);
    // 22 : âme en forme de haricot menthe
    b += x.byPose((p) => {
      const y0 = p === 2 ? -6 : 0;
      let s = `<g transform="translate(0 ${y0})">`;
      s += `<ellipse cx="22" cy="208" rx="16" ry="3" fill="${MN}" opacity=".4"/>`;
      s += shadedW((a) => `<path d="M2 196 Q-2 150 8 130 Q22 112 36 130 Q46 150 42 196 Q22 206 2 196Z" ${a}/>`, MN, MND, -4, -3, 4);
      s += `<path d="M18 120 Q22 108 28 116" stroke="${MND}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
      s += [15, 29].map((ex) => `<ellipse cx="${ex}" cy="146" rx="3.6" ry="${p === 2 ? 3.6 : 4.8}" fill="#1d4a42"/><circle cx="${ex + 1.2}" cy="144.5" r="1.3" fill="#fff"/>`).join('');
      s += smallMouth(p, 22, 160);
      s += gloss(10, 134, 4, 2, -30, 0.6);
      if (p === 2) s += `<g class="pop">${sparkle(48, 128, 11, '#8af0ff')}${sparkle(-4, 116, 7, '#fff')}</g>`;
      return s + '</g>';
    });
    return shadow() + x.body(b);
  },
},
];
