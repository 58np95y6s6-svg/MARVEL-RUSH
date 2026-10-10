// Autobots, planche B (design/planches/8-transformers-heros.html) : mode robot de Hot Rod, Elita-1, Bulkhead,
// Sideswipe, Prowl, Mirage et Ultra Magnus.
/* eslint-disable */
import { O, f, shaded, gloss, limb, hand, glow, burst, beam, sparks, torso, shadow, mirror, tip, type CharDef, type Ctx } from '../primitives';
import { MET, METD, robotHead, sideFins, crest, horns, autobot, chestWindows, grille, robotArm, shoulderPad, swoosh, shock, speedLines } from '../kits/transformers';

const POSES = [{ L: 12, R: -12 }, { L: 22, R: -150, body: [-3, -3, -6, 1, 1.02] }, { L: 30, R: -98, body: [7, 0, 7, 1, 1] }];
const flame = (d: string, c = '#ffb347', c2 = '#ffe27a') => `<path d="${d}" fill="${c}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`;

export const TF_B: CharDef[] = [
{
  id: 'hotrod', name: 'Hot Rod', role: 'Brûlure', rarity: 'Épique', rar: 'var(--epi)', tint: '#ffe4cc', tint2: '#f6a05a', stats: [4, 4, 2],
  atk: 'Tir double ; en bolide, traînée de flammes.', skill: 'Flamme de Rodimus : brûle les ennemis.',
  sh: { L: [68, 150], R: [132, 150] },
  poses: POSES,
  draw(this: CharDef, x: Ctx): string {
    const R = '#e8452c', RD = '#a8261a', Y = '#f6c64a', YD = '#cf962a', F = '#ff8a2a';
    const blaster = (sx: number, sy: number) => `<rect x="${sx - 7}" y="${sy + 30}" width="14" height="22" rx="4" fill="${METD}" stroke="${O}" stroke-width="3"/>`;
    const arm = (sx: number, sy: number) => robotArm(sx, sy, R, RD, Y) + x.when([1, 2], blaster(sx, sy));
    let b = '';
    b += torso(R, RD);
    b += flame('M60 196 Q66 172 78 182 Q80 160 96 176 Q102 154 112 174 Q124 158 128 180 Q138 168 140 196Z', Y);
    b += flame('M74 196 Q80 182 88 188 Q94 176 102 188 Q110 178 116 190 Q122 186 126 196Z', F);
    b += `<path d="M66 148 L94 146 L92 166 L70 168Z" fill="#8fd0f4" stroke="${O}" stroke-width="3"/>` + mirror(`<path d="M66 148 L94 146 L92 166 L70 168Z" fill="#8fd0f4" stroke="${O}" stroke-width="3"/>`);
    b += autobot(100, 160, 0.42);
    b += robotHead(x, { helm: R, helmD: RD });
    b += shaded((a) => `<path d="M46 74 L28 46 L58 56Z" ${a}/>`, Y, YD, -2, -2) + mirror(shaded((a) => `<path d="M46 74 L28 46 L58 56Z" ${a}/>`, Y, YD, -2, -2));
    b += crest(Y, YD, 8);
    b += x.arm('L', arm) + x.arm('R', arm);
    const [hx, hy] = tip(this, 'R', 2, 54);
    b += x.when([2], `<g class="grow">${beam(hx, hy - 5, hx + 74, hy - 14, 6, F)}${beam(hx, hy + 5, hx + 74, hy + 8, 6, F)}</g><g class="pop">${burst(f(hx + 74), f(hy - 3), 17, F, '#fff3c0')}</g>`);
    return shadow() + x.body(b);
  },
},
{
  id: 'elita', name: 'Elita-1', role: 'Précision', rarity: 'Rare', rar: 'var(--rare)', tint: '#fbe0f4', tint2: '#d88ac8', stats: [3, 3, 3],
  atk: 'Tir de précision ; en voiture, marque l’ennemi le plus fort.', skill: 'Tir de précision : dégâts qui montent sur la même cible.',
  sh: { L: [70, 150], R: [130, 150] },
  poses: POSES,
  draw(this: CharDef, x: Ctx): string {
    const M = '#c4389a', MD = '#8a1f6a', W = '#f4f1f6', WD = '#c9c0d8', LZ = '#ff7ad8';
    const rifle = (sx: number, sy: number) => `<g transform="translate(${sx} ${sy + 34}) rotate(-90)"><rect x="-6" y="-46" width="12" height="52" rx="4" fill="${METD}" stroke="${O}" stroke-width="3"/><rect x="-9" y="-30" width="18" height="10" rx="3" fill="${M}" stroke="${O}" stroke-width="2.5"/></g>`;
    const armL = (sx: number, sy: number) => robotArm(sx, sy, M, MD, W, 13);
    const armR = (sx: number, sy: number) => robotArm(sx, sy, M, MD, W, 13) + x.when([1, 2], rifle(sx, sy));
    let b = '';
    b += torso(W, WD, 'M64 202 C62 162 74 140 100 138 C126 140 138 162 136 202Z');
    b += shaded((a) => `<path d="M66 146 Q100 164 134 146 L130 172 Q100 182 70 172Z" ${a}/>`, M, MD, -2, -2);
    b += autobot(100, 188, 0.45);
    b += robotHead(x, { helm: M, helmD: MD });
    b += shaded((a) => `<path d="M84 26 L100 0 L116 26Z" ${a}/>`, W, WD, -2, -2);
    b += `<path d="M88 116 Q100 120 112 116" stroke="#d24a8a" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    b += x.arm('L', armL) + x.arm('R', armR);
    const [hx, hy] = tip(this, 'R', 2, 82);
    b += x.when([1], `<g class="fx"><circle cx="196" cy="118" r="16" fill="none" stroke="${LZ}" stroke-width="4"/><path d="M196 96 V108 M196 128 V140 M174 118 H186 M206 118 H218" stroke="${LZ}" stroke-width="4"/></g>`);
    b += x.when([2], `<g class="grow">${beam(hx, hy, hx + 80, hy - 6, 5, LZ)}</g><g class="pop">${burst(f(hx + 80), f(hy - 6), 15, LZ, '#fff')}</g>`);
    return shadow() + x.body(b);
  },
},
{
  id: 'bulkhead', name: 'Bulkhead', role: 'Sacrifice', rarity: 'Épique', rar: 'var(--epi)', tint: '#e0f4d0', tint2: '#8ac46a', stats: [4, 1, 4],
  atk: 'Boulet de démolition ; en tout-terrain, écrase.', skill: 'Démolition : rapporte du mana quand il est fusionné.',
  sh: { L: [58, 152], R: [142, 152] },
  poses: POSES,
  draw(this: CharDef, x: Ctx): string {
    const G = '#4f9a3a', GD = '#2f6a24', Y = '#f2c33c', K = '#3a3550';
    const ball = (sx: number, sy: number) => `<path d="M${sx} ${sy + 50} L${sx} ${sy + 64}" stroke="${O}" stroke-width="5"/><circle cx="${sx}" cy="${sy + 72}" r="15" fill="${K}" stroke="${O}" stroke-width="4"/>${gloss(sx - 5, sy + 66, 5, 3)}`;
    const armL = (sx: number, sy: number) => limb(sx, sy, sx, sy + 34, G, 22) + hand(sx, sy + 40, GD, 15);
    const armR = (sx: number, sy: number) => limb(sx, sy, sx, sy + 34, G, 22) + hand(sx, sy + 40, GD, 15) + x.when([0, 1], ball(sx, sy));
    let b = '';
    b += torso(G, GD, 'M46 202 C44 150 64 132 100 130 C136 132 156 150 154 202Z');
    b += `<rect x="70" y="150" width="60" height="30" rx="8" fill="#8fd0f4" stroke="${O}" stroke-width="3.5"/><path d="M100 150 V180" stroke="${O}" stroke-width="3"/>`;
    b += `<path d="M56 190 H144" stroke="${Y}" stroke-width="6" stroke-dasharray="10 8"/>`;
    b += autobot(100, 196, 0.42);
    b += shoulderPad(G, GD);
    b += robotHead(x, { helm: G, helmD: GD, face: '#c8ccd8' });
    b += shaded((a) => `<path d="M60 40 L140 40 L134 56 L66 56Z" ${a}/>`, GD, O, -2, -2);
    b += x.arm('L', armL) + x.arm('R', armR);
    const [hx, hy] = tip(this, 'R', 2, 40);
    b += x.when([2], `<g class="grow">${swoosh(`M${f(hx - 20)} ${f(hy - 40)} Q${f(hx + 40)} ${f(hy - 40)} ${f(hx + 56)} ${f(hy + 20)}`, '#fff', 10)}</g><circle cx="${f(hx + 58)}" cy="${f(hy + 26)}" r="17" fill="${K}" stroke="${O}" stroke-width="4"/>${shock(hx + 58, hy + 46, 44, 12, Y)}<g class="pop">${burst(f(hx + 58), f(hy + 26), 26, Y, '#fff')}</g>`);
    return shadow(64) + x.body(b);
  },
},
{
  id: 'sideswipe', name: 'Sideswipe', role: 'Zone', rarity: 'Rare', rar: 'var(--rare)', tint: '#ffd8d4', tint2: '#ea7a6e', stats: [3, 4, 2],
  atk: 'Lames tournoyantes ; en voiture, traverse plusieurs ennemis.', skill: 'Lames tournoyantes : frappe autour de la cible.',
  sh: { L: [68, 150], R: [132, 150] },
  poses: [{ L: 12, R: -12 }, { L: 60, R: -60, body: [0, -3, 0, 1, 1.02] }, { L: 120, R: -120, body: [0, -6, 0, 1.04, 1] }],
  draw(this: CharDef, x: Ctx): string {
    const R = '#d8322c', RD = '#9b1d27', S = '#c8ccd8', SD = '#8a90a6';
    const blade = (sx: number, sy: number) => `<path d="M${sx - 5} ${sy + 40} L${sx} ${sy + 86} L${sx + 6} ${sy + 40}Z" fill="${MET}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`;
    const arm = (sx: number, sy: number) => blade(sx, sy) + robotArm(sx, sy, R, RD, S, 14);
    let b = '';
    b += torso(R, RD);
    b += shaded((a) => `<path d="M70 146 L130 146 L124 176 L76 176Z" ${a}/>`, S, SD, -2, -2);
    b += `<path d="M80 154 H120 M82 162 H118 M84 170 H116" stroke="${SD}" stroke-width="2.5"/>`;
    b += autobot(100, 188, 0.45);
    b += robotHead(x, { helm: R, helmD: RD });
    b += horns(S, SD, 62, 36, 16);
    b += x.arm('L', arm) + x.arm('R', arm);
    b += x.when([2], `<g class="grow"><g class="spin fast"><circle cx="100" cy="150" r="88" fill="none" stroke="#fff" stroke-width="6" stroke-dasharray="40 30" opacity=".7"/></g></g><g class="pop">${sparks(30, 150, 24, '#fff', 6)}${sparks(170, 150, 24, '#fff', 6)}</g>`);
    return shadow() + x.body(b);
  },
},
{
  id: 'prowl', name: 'Prowl', role: 'Soutien / ralentissement', rarity: 'Rare', rar: 'var(--rare)', tint: '#eef0f6', tint2: '#9aa3b8', stats: [2, 3, 4],
  atk: 'Analyse tactique ; en voiture de police, ralentit la cible.', skill: 'Analyse : renforce ses voisines.',
  sh: { L: [68, 150], R: [132, 150] },
  poses: POSES,
  draw(this: CharDef, x: Ctx): string {
    const W = '#f4f5fa', WD = '#c0c6d6', K = '#2b2838', KD = '#15131f', R = '#e8413b', BL = '#3a6ad0', SC = '#7dffb0';
    const arm = (sx: number, sy: number) => robotArm(sx, sy, K, KD, W);
    let b = '';
    // ailes de portière dans le dos
    const wing = shaded((a) => `<path d="M60 150 L20 118 L26 160 L58 176Z" ${a}/>`, W, WD, -2, -2);
    b += wing + mirror(wing);
    b += torso(W, WD);
    b += `<path d="M58 172 H142" stroke="${K}" stroke-width="14"/>`;
    b += `<path d="M66 148 L94 146 L92 164 L70 166Z" fill="#8fd0f4" stroke="${O}" stroke-width="3"/>` + mirror(`<path d="M66 148 L94 146 L92 164 L70 166Z" fill="#8fd0f4" stroke="${O}" stroke-width="3"/>`);
    b += autobot(100, 190, 0.45);
    b += robotHead(x, { helm: K, helmD: KD });
    b += shaded((a) => `<path d="M68 34 L100 52 L132 34 L126 24 L100 38 L74 24Z" ${a}/>`, R, '#a01c28', -2, -2);
    b += `<rect x="88" y="10" width="12" height="10" rx="3" fill="${R}" stroke="${O}" stroke-width="3"/><rect x="100" y="10" width="12" height="10" rx="3" fill="${BL}" stroke="${O}" stroke-width="3"/>`;
    b += x.arm('L', arm) + x.arm('R', arm);
    b += x.when([1, 2], `<g class="fx">${[0, 1, 2].map((i) => `<path d="M${40 + i * 60} 40 h20 v14" stroke="${SC}" stroke-width="3" fill="none" opacity=".8"/>`).join('')}<rect x="150" y="70" width="44" height="28" rx="4" fill="${SC}" opacity=".25" stroke="${SC}" stroke-width="2"/></g>`);
    const [hx, hy] = tip(this, 'R', 2, 44);
    b += x.when([2], `<g class="grow">${beam(hx, hy, hx + 70, hy - 12, 5, SC)}</g><g class="pop">${burst(f(hx + 70), f(hy - 12), 14, SC, '#fff')}</g>`);
    return shadow() + x.body(b);
  },
},
{
  id: 'mirage', name: 'Mirage', role: 'Copieur', rarity: 'Légendaire', rar: 'var(--leg)', tint: '#e4eeff', tint2: '#8aa8e0', stats: [3, 3, 3],
  atk: 'Tirs furtifs ; en voiture, leurres.', skill: 'Hologrammes : devient la copie d’une alliée.',
  sh: { L: [70, 150], R: [130, 150] },
  poses: POSES,
  draw(this: CharDef, x: Ctx): string {
    const W = '#f4f5fa', WD = '#c0c6d6', B = '#2f6ad8', BD = '#1d4590', H = '#9adcff';
    const gun = (sx: number, sy: number) => `<rect x="${sx - 6}" y="${sy + 30}" width="12" height="24" rx="4" fill="${METD}" stroke="${O}" stroke-width="3"/>`;
    const arm = (sx: number, sy: number) => robotArm(sx, sy, B, BD, W, 13);
    const armR = (sx: number, sy: number) => arm(sx, sy) + x.when([1, 2], gun(sx, sy));
    let b = '';
    b += x.when([1, 2], `<g class="fx" opacity=".35"><g transform="translate(-34 4)"><path d="M64 202 C62 162 74 140 100 138 C126 140 138 162 136 202Z" fill="${H}"/><circle cx="100" cy="88" r="54" fill="${H}"/></g><g transform="translate(34 4)"><path d="M64 202 C62 162 74 140 100 138 C126 140 138 162 136 202Z" fill="${H}"/><circle cx="100" cy="88" r="54" fill="${H}"/></g></g>`);
    b += torso(W, WD, 'M64 202 C62 162 74 140 100 138 C126 140 138 162 136 202Z');
    b += `<path d="M64 166 L136 150 L136 162 L64 178Z" fill="${B}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`;
    b += autobot(100, 190, 0.44);
    b += robotHead(x, { helm: W, helmD: WD });
    b += shaded((a) => `<path d="M70 26 L100 14 L130 26 L126 40 L74 40Z" ${a}/>`, B, BD, -2, -2);
    b += shaded((a) => `<path d="M44 80 L34 60 L48 58Z" ${a}/>`, B, BD, -2, -2) + mirror(shaded((a) => `<path d="M44 80 L34 60 L48 58Z" ${a}/>`, B, BD, -2, -2));
    b += x.arm('L', arm) + x.arm('R', armR);
    const [hx, hy] = tip(this, 'R', 2, 54);
    b += x.when([2], `<g class="grow">${beam(hx, hy, hx + 74, hy - 8, 5, H)}</g><g class="pop">${burst(f(hx + 74), f(hy - 8), 15, H, '#fff')}</g>`);
    return shadow() + x.body(b);
  },
},
{
  id: 'ultramagnus', name: 'Ultra Magnus', role: 'Formation / soutien', rarity: 'Légendaire', rar: 'var(--leg)', tint: '#e8eeff', tint2: '#8fa8e8', stats: [4, 2, 5],
  atk: 'Marteau ; en porte-voitures, renforce toute la ligne.', skill: 'Commandant de la ville : bouclier d’équipe.',
  sh: { L: [62, 150], R: [138, 150] },
  poses: POSES,
  draw(this: CharDef, x: Ctx): string {
    const W = '#f4f5fa', WD = '#c0c6d6', B = '#2f5fd0', BD = '#1f3f95', R = '#d8322c', RD = '#9b1d27', HM = '#ffd34a';
    const hammer = (sx: number, sy: number) => `<g transform="translate(${sx} ${sy + 40}) rotate(-80)"><rect x="-4" y="-44" width="8" height="46" rx="3" fill="${METD}" stroke="${O}" stroke-width="3"/><rect x="-18" y="-62" width="36" height="22" rx="5" fill="${B}" stroke="${O}" stroke-width="3.5"/><rect x="-14" y="-58" width="10" height="14" rx="3" fill="${HM}"/></g>`;
    const armL = (sx: number, sy: number) => robotArm(sx, sy, B, BD, B, 17);
    const armR = (sx: number, sy: number) => robotArm(sx, sy, B, BD, B, 17) + x.when([1, 2], hammer(sx, sy));
    let b = '';
    b += torso(W, WD, 'M52 202 C50 154 68 134 100 132 C132 134 150 154 148 202Z');
    b += shaded((a) => `<path d="M52 186 Q100 196 148 186 L148 200 Q100 208 52 200Z" ${a}/>`, B, BD, -3, -3);
    b += chestWindows();
    b += `<path d="M58 178 H142" stroke="${R}" stroke-width="6"/>`;
    b += autobot(100, 162, 0.5);
    b += grille(MET, 184);
    b += shoulderPad(W, WD);
    b += robotHead(x, { helm: B, helmD: BD, mouthplate: true });
    b += sideFins(W, WD, 20) + crest(R, RD, 6);
    b += x.arm('L', armL) + x.arm('R', armR);
    b += x.when([1], `<g class="ring"><ellipse cx="100" cy="150" rx="92" ry="86" fill="${HM}" opacity=".12" stroke="${HM}" stroke-width="5"/></g>`);
    const [hx, hy] = tip(this, 'R', 2, 46);
    b += x.when([2], `<g class="grow">${swoosh(`M${f(hx - 30)} ${f(hy - 50)} Q${f(hx + 46)} ${f(hy - 44)} ${f(hx + 48)} ${f(hy + 30)}`, HM, 12)}</g>${shock(hx + 50, hy + 40, 46, 13, HM)}<g class="pop">${burst(f(hx + 50), f(hy + 30), 24, HM, '#fff')}</g>`);
    return shadow(64) + x.body(b);
  },
},
];
