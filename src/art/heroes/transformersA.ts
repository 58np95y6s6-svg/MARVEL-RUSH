// Autobots, planche A (design/planches/8-transformers-heros.html) : mode robot, même style et même API que
// les héros Marvel (chibi, grosse tête casquée, visage de métal clair, yeux bleus lumineux).
/* eslint-disable */
import { O, f, shaded, gloss, limb, hand, glow, burst, beam, bolt, sparks, torso, shadow, mirror, tip, type CharDef, type Ctx } from '../primitives';
import { MET, METD, robotHead, sideFins, crest, horns, autobot, chestWindows, grille, robotArm, shoulderPad, swoosh, shock } from '../kits/transformers';

const POSES = [{ L: 12, R: -12 }, { L: 22, R: -150, body: [-3, -3, -6, 1, 1.02] }, { L: 30, R: -98, body: [7, 0, 7, 1, 1] }];

export const TF_A: CharDef[] = [
{
  id: 'optimus', name: 'Optimus Prime', role: 'Zone / transformation', rarity: 'Légendaire', rar: 'var(--leg)', tint: '#dbe6ff', tint2: '#8fa8e8', stats: [5, 3, 4],
  atk: 'Hache d’énergie et onde de choc ; en camion, charge qui repousse.', skill: 'Cri de ralliement : frappe tous les ennemis à portée.',
  sh: { L: [66, 150], R: [134, 150] },
  poses: POSES,
  draw(this: CharDef, x: Ctx): string {
    const R = '#d8322c', RD = '#9b1d27', B = '#2f5fd0', BD = '#1f3f95', AX = '#ff9a2a';
    const armIn = (sx: number, sy: number) => robotArm(sx, sy, B, BD, B);
    const axe = (sx: number, sy: number) => `<g transform="translate(${sx} ${sy + 40}) rotate(-90)"><rect x="-4" y="-34" width="8" height="40" rx="3" fill="${METD}" stroke="${O}" stroke-width="3"/>` +
      `<path d="M2 -34 Q30 -40 34 -18 Q24 -10 2 -14Z" fill="${AX}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/><path d="M8 -30 Q24 -32 28 -20" stroke="#fff3c0" stroke-width="3" fill="none" stroke-linecap="round"/></g>`;
    const armR = (sx: number, sy: number) => robotArm(sx, sy, B, BD, B) + x.when([1, 2], axe(sx, sy));
    let b = '';
    b += torso(R, RD);
    b += chestWindows();
    b += autobot(100, 162, 0.55);
    b += shaded((a) => `<path d="M58 186 Q100 194 142 186 L142 200 Q100 208 58 200Z" ${a}/>`, B, BD, -3, -3);
    b += grille(MET, 184);
    b += shoulderPad(R, RD);
    b += robotHead(x, { helm: B, helmD: BD, mouthplate: true });
    b += sideFins(B, BD, 26) + crest(B, BD, 10);
    b += x.arm('L', armIn) + x.arm('R', armR);
    const [hx, hy] = tip(this, 'R', 2, 46);
    b += x.when([2], `<g class="grow" style="transform-origin:${f(hx)}px ${f(hy)}px">${swoosh(`M${f(hx - 20)} ${f(hy - 40)} Q${f(hx + 40)} ${f(hy - 30)} ${f(hx + 50)} ${f(hy + 30)}`, AX, 12)}</g>` +
      `${shock(hx + 50, hy + 34, 40, 12, AX)}<g class="pop">${burst(hx + 52, hy + 30, 22, AX, '#fff3c0')}</g>`);
    return shadow() + x.body(b);
  },
},
{
  id: 'bumblebee', name: 'Bumblebee', role: 'Échangeur', rarity: 'Rare', rar: 'var(--rare)', tint: '#fff2c0', tint2: '#f2c84a', stats: [2, 4, 3],
  atk: 'Canon du bras ; en voiture jaune, rafales rapides.', skill: 'Éclaireur : échange sa place avec une alliée.',
  sh: { L: [68, 150], R: [132, 150] },
  poses: POSES,
  draw(this: CharDef, x: Ctx): string {
    const Y = '#f6c83a', YD = '#c99418', K = '#2b2838', KD = '#15131f', BL = '#5ad8ff';
    const armIn = (sx: number, sy: number) => robotArm(sx, sy, Y, YD, K);
    const cannon = (sx: number, sy: number) => `<rect x="${sx - 8}" y="${sy + 28}" width="16" height="24" rx="5" fill="${K}" stroke="${O}" stroke-width="3.5"/><circle cx="${sx}" cy="${sy + 52}" r="5" fill="${BL}" stroke="${O}" stroke-width="2.5"/>`;
    const armR = (sx: number, sy: number) => limb(sx, sy, sx, sy + 30, Y, 15) + cannon(sx, sy);
    let b = '';
    b += torso(Y, YD);
    b += `<path d="M90 140 V202 M110 140 V202" stroke="${K}" stroke-width="7"/>`;
    b += `<path d="M66 150 Q78 146 88 150 L86 168 Q76 170 68 166Z" fill="#8fd0f4" stroke="${O}" stroke-width="3"/>` + mirror(`<path d="M66 150 Q78 146 88 150 L86 168 Q76 170 68 166Z" fill="#8fd0f4" stroke="${O}" stroke-width="3"/>`);
    b += autobot(100, 182, 0.5);
    b += robotHead(x, { helm: Y, helmD: YD });
    b += horns(K, KD, 70, 30, 18);
    b += `<path d="M86 30 Q100 20 114 30" stroke="${K}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    b += x.arm('L', armIn) + x.arm('R', armR);
    const [hx, hy] = tip(this, 'R', 2, 54), [dx, dy] = [1, 0];
    b += x.when([1], glow(...tip(this, 'R', 1, 52), 10, BL));
    b += x.when([2], `<g class="grow">${beam(hx, hy, hx + dx * 70 + 20, hy + dy * 70, 7, BL)}</g><g class="pop">${burst(f(hx + 4), f(hy), 15, BL, '#fff')}</g>`);
    return shadow() + x.body(b);
  },
},
{
  id: 'ironhide', name: 'Ironhide', role: 'Multi-cibles', rarity: 'Épique', rar: 'var(--epi)', tint: '#ffd8d0', tint2: '#e88a7a', stats: [4, 2, 4],
  atk: 'Double canon lourd sur plusieurs ennemis ; en fourgon, dégâts de zone.', skill: 'Vétéran : autant de cibles que son rang.',
  sh: { L: [62, 150], R: [138, 150] },
  poses: POSES,
  draw(this: CharDef, x: Ctx): string {
    const R = '#b8282c', RD = '#7e1620', G = '#6a7088', GD = '#454a60';
    const gun = (sx: number, sy: number) => `<rect x="${sx - 13}" y="${sy + 22}" width="26" height="30" rx="6" fill="${G}" stroke="${O}" stroke-width="3.5"/><rect x="${sx - 10}" y="${sy + 50}" width="8" height="10" rx="2" fill="${GD}" stroke="${O}" stroke-width="2.5"/><rect x="${sx + 2}" y="${sy + 50}" width="8" height="10" rx="2" fill="${GD}" stroke="${O}" stroke-width="2.5"/>`;
    const arm = (sx: number, sy: number) => limb(sx, sy, sx, sy + 26, R, 18) + gun(sx, sy);
    let b = '';
    b += torso(R, RD, 'M54 202 C52 156 68 136 100 134 C132 136 148 156 146 202Z');
    b += `<rect x="72" y="150" width="56" height="26" rx="6" fill="${G}" stroke="${O}" stroke-width="3.5"/>` + [80, 92, 104, 116].map((xx) => `<rect x="${xx}" y="155" width="6" height="16" rx="2" fill="#8fd0f4" stroke="${O}" stroke-width="2"/>`).join('');
    b += autobot(100, 188, 0.5);
    b += shoulderPad(R, RD);
    b += robotHead(x, { helm: R, helmD: RD, face: '#c8ccd8', hard: true });
    b += shaded((a) => `<path d="M52 60 L148 60 L150 74 L50 74Z" ${a}/>`, G, GD, -2, -2);
    b += x.arm('L', arm) + x.arm('R', arm);
    const [hx, hy] = tip(this, 'R', 2, 60);
    b += x.when([2], `<g class="grow">${beam(hx - 4, hy, hx + 70, hy - 10, 6, '#ffb347')}${beam(hx + 4, hy + 8, hx + 74, hy + 4, 6, '#ffb347')}</g><g class="pop">${burst(f(hx + 74), f(hy - 2), 18, '#ffb347', '#fff')}</g>`);
    return shadow() + x.body(b);
  },
},
{
  id: 'ratchet', name: 'Ratchet', role: 'Soutien', rarity: 'Rare', rar: 'var(--rare)', tint: '#f4f6fb', tint2: '#d0d6e6', stats: [1, 3, 5],
  atk: 'Clé à molette ; en ambulance, accélère ses voisines.', skill: 'Médecin des Autobots : répare ses voisines.',
  sh: { L: [68, 150], R: [132, 150] },
  poses: POSES,
  draw(this: CharDef, x: Ctx): string {
    const W = '#eef0f6', WD = '#b8bfd0', R = '#e0323e', RD = '#a01c28', GL = '#7dffb0';
    const armIn = (sx: number, sy: number) => robotArm(sx, sy, W, WD, R);
    const wrench = (sx: number, sy: number) => `<g transform="translate(${sx} ${sy + 46}) rotate(-80)"><rect x="-3.5" y="-30" width="7" height="30" rx="3" fill="${MET}" stroke="${O}" stroke-width="3"/><path d="M-10 -40 Q0 -48 10 -40 L6 -32 L0 -36 L-6 -32Z" fill="${MET}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/></g>`;
    const armR = (sx: number, sy: number) => robotArm(sx, sy, W, WD, R) + x.when([1, 2], wrench(sx, sy));
    let b = '';
    b += torso(W, WD);
    b += `<rect x="58" y="160" width="84" height="12" fill="${R}" stroke="${O}" stroke-width="3"/>`;
    b += `<g transform="translate(100 150)"><path d="M-4 -11 H4 V-4 H11 V4 H4 V11 H-4 V4 H-11 V-4 H-4Z" fill="${R}" stroke="${O}" stroke-width="2.5" stroke-linejoin="round"/></g>`;
    b += autobot(100, 188, 0.48);
    b += robotHead(x, { helm: W, helmD: WD });
    b += `<rect x="86" y="14" width="28" height="14" rx="5" fill="${R}" stroke="${O}" stroke-width="3.5"/><g class="fx"><circle cx="100" cy="20" r="14" fill="#ff5a5a" opacity=".3"/></g>`;
    b += shaded((a) => `<path d="M40 92 L30 80 L34 64 L46 70Z" ${a}/>`, R, RD, -2, -2) + mirror(shaded((a) => `<path d="M40 92 L30 80 L34 64 L46 70Z" ${a}/>`, R, RD, -2, -2));
    b += x.arm('L', armIn) + x.arm('R', armR);
    b += x.when([1, 2], `<g class="ring">${[0, 1].map((i) => `<circle cx="100" cy="150" r="${70 + i * 18}" fill="none" stroke="${GL}" stroke-width="5" opacity="${0.6 - i * 0.25}"/>`).join('')}</g>`);
    b += x.when([2], `<g class="pop">${sparks(150, 150, 34, GL, 8)}</g>`);
    return shadow() + x.body(b);
  },
},
{
  id: 'jazz', name: 'Jazz', role: 'Mana', rarity: 'Rare', rar: 'var(--rare)', tint: '#e0f0ff', tint2: '#8fb8e8', stats: [2, 4, 3],
  atk: 'Projecteur aveuglant ; en voiture de sport, mana à chaque élimination.', skill: 'Rythme et trésors : les ennemis touchés rapportent du mana.',
  sh: { L: [68, 150], R: [132, 150] },
  poses: POSES,
  draw(this: CharDef, x: Ctx): string {
    const W = '#eef0f6', WD = '#b8bfd0', K = '#2b2838', KD = '#15131f', BL = '#3a8ae0', V = '#5ad8ff', SP = '#fff6a0';
    const armIn = (sx: number, sy: number) => robotArm(sx, sy, K, KD, W);
    const lampHand = (sx: number, sy: number) => robotArm(sx, sy, K, KD, W) + x.when([1, 2], `<rect x="${sx - 9}" y="${sy + 40}" width="18" height="14" rx="4" fill="${MET}" stroke="${O}" stroke-width="3"/><circle cx="${sx}" cy="${sy + 54}" r="6" fill="${SP}" stroke="${O}" stroke-width="2.5"/>`);
    let b = '';
    b += torso(W, WD);
    b += `<path d="M58 172 L142 160 L142 176 L58 188Z" fill="${BL}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`;
    b += `<text x="100" y="158" text-anchor="middle" font-family="Lilita One, Arial Rounded MT Bold, sans-serif" font-size="15" fill="${K}">4</text>`;
    b += autobot(124, 150, 0.42);
    b += robotHead(x, { helm: K, helmD: KD, visor: V });
    b += horns(W, WD, 52, 54, 22);
    b += x.arm('L', armIn) + x.arm('R', lampHand);
    const [hx, hy] = tip(this, 'R', 2, 56);
    b += x.when([2], `<g class="grow" style="transform-origin:${f(hx)}px ${f(hy)}px"><path d="M${f(hx)} ${f(hy - 6)} L${f(hx + 110)} ${f(hy - 40)} L${f(hx + 110)} ${f(hy + 40)} L${f(hx)} ${f(hy + 6)}Z" fill="${SP}" opacity=".55"/></g><g class="pop">${burst(f(hx), f(hy), 16, SP, '#fff')}</g>`);
    b += x.when([1], `<g class="fx"><text x="160" y="74" font-size="26" fill="${BL}" stroke="${O}" stroke-width="4" paint-order="stroke">♪</text><text x="30" y="96" font-size="22" fill="${BL}" stroke="${O}" stroke-width="4" paint-order="stroke">♫</text></g>`);
    return shadow() + x.body(b);
  },
},
{
  id: 'arcee', name: 'Arcee', role: 'Critique', rarity: 'Épique', rar: 'var(--epi)', tint: '#ffe0f0', tint2: '#f09ac8', stats: [3, 5, 2],
  atk: 'Blasters du bras et lames en combo ; en moto, vise les plus rapides.', skill: 'Lames d’Arcee : critiques et dégâts qui montent.',
  sh: { L: [70, 150], R: [130, 150] },
  poses: [{ L: 12, R: -12 }, { L: 40, R: -140, body: [-4, -2, -8, 1, 1.02] }, { L: -30, R: -96, body: [10, 0, 10, 1, 1] }],
  draw(this: CharDef, x: Ctx): string {
    const P = '#ff6fa8', PD = '#c43c78', W = '#f4f1f6', WD = '#c9c0d8', BL = '#5ad8ff';
    const blade = (sx: number, sy: number) => `<path d="M${sx - 4} ${sy + 40} L${sx} ${sy + 82} L${sx + 6} ${sy + 40}Z" fill="${MET}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/><path d="M${sx} ${sy + 46} L${sx + 1} ${sy + 72}" stroke="#fff" stroke-width="2" opacity=".8"/>`;
    const arm = (sx: number, sy: number) => blade(sx, sy) + robotArm(sx, sy, P, PD, W, 13);
    let b = '';
    b += torso(W, WD, 'M64 202 C62 162 74 140 100 138 C126 140 138 162 136 202Z');
    b += shaded((a) => `<path d="M70 146 Q100 170 130 146 L126 170 Q100 184 74 170Z" ${a}/>`, P, PD, -2, -2);
    b += autobot(100, 186, 0.45);
    b += robotHead(x, { helm: P, helmD: PD });
    b += shaded((a) => `<path d="M48 70 L34 38 L60 52Z" ${a}/>`, P, PD, -2, -2) + mirror(shaded((a) => `<path d="M48 70 L34 38 L60 52Z" ${a}/>`, P, PD, -2, -2));
    b += `<path d="M88 116 Q100 120 112 116" stroke="#d24a8a" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
    b += x.arm('L', arm) + x.arm('R', arm);
    b += x.when([2], `<g class="grow">${swoosh('M150 60 Q210 110 160 180', BL, 10)}${swoosh('M40 70 Q-10 120 40 180', P, 8)}</g><g class="pop">${sparks(186, 120, 26, '#fff', 6)}</g>`);
    return shadow() + x.body(b);
  },
},
{
  id: 'grimlock', name: 'Grimlock', role: 'Croissance', rarity: 'Légendaire', rar: 'var(--leg)', tint: '#fff0c8', tint2: '#d8b45a', stats: [5, 2, 4],
  atk: 'Épée et bouclier ; en T-rex, souffle de feu.', skill: 'Moi, Grimlock ! Il grandit à chaque élimination.',
  sh: { L: [62, 150], R: [138, 150] },
  poses: POSES,
  draw(this: CharDef, x: Ctx): string {
    const G = '#9aa3b8', GD = '#6a7088', Y = '#f2c33c', YD = '#c48a1a', RV = '#ff4a3a', SW = '#ff9a2a';
    const shield = (sx: number, sy: number) => shaded((a) => `<path d="M${sx - 20} ${sy + 18} L${sx + 20} ${sy + 18} L${sx + 18} ${sy + 50} L${sx} ${sy + 62} L${sx - 18} ${sy + 50}Z" ${a}/>`, Y, YD, -3, -3) + autobot(sx, sy + 38, 0.5);
    const sword = (sx: number, sy: number) => `<g transform="translate(${sx} ${sy + 40}) rotate(-70)"><rect x="-3" y="-60" width="10" height="56" rx="3" fill="${SW}" stroke="${O}" stroke-width="3.5"/><path d="M1 -56 V-12" stroke="#fff3c0" stroke-width="3" stroke-linecap="round"/><rect x="-9" y="-6" width="22" height="7" rx="3" fill="${Y}" stroke="${O}" stroke-width="3"/></g>`;
    const armL = (sx: number, sy: number) => robotArm(sx, sy, G, GD, Y, 17) + shield(sx, sy);
    const armR = (sx: number, sy: number) => robotArm(sx, sy, G, GD, Y, 17) + x.when([1, 2], sword(sx, sy));
    let b = '';
    b += torso(G, GD, 'M54 202 C52 156 68 136 100 134 C132 136 148 156 146 202Z');
    b += shaded((a) => `<path d="M66 146 L134 146 L128 176 L72 176Z" ${a}/>`, Y, YD, -3, -3);
    b += `<path d="M78 152 L90 168 M110 168 L122 152" stroke="${O}" stroke-width="3" opacity=".5"/>`;
    b += shaded((a) => `<path d="M58 184 Q100 192 142 184 L142 200 Q100 208 58 200Z" ${a}/>`, GD, O, -3, -3);
    b += robotHead(x, { helm: G, helmD: GD, visor: RV, hard: true });
    b += shaded((a) => `<path d="M76 30 L100 2 L124 30 L114 40 L100 26 L86 40Z" ${a}/>`, Y, YD, -2, -2);
    b += x.arm('L', armL) + x.arm('R', armR);
    const [hx, hy] = tip(this, 'R', 2, 46);
    b += x.when([2], `<g class="grow">${swoosh(`M${f(hx - 30)} ${f(hy - 50)} Q${f(hx + 50)} ${f(hy - 40)} ${f(hx + 46)} ${f(hy + 40)}`, SW, 13)}</g><g class="pop">${burst(f(hx + 48), f(hy + 34), 22, SW, '#fff3c0')}</g>`);
    return shadow() + x.body(b);
  },
},
{
  id: 'wheeljack', name: 'Wheeljack', role: 'Booster de fusion', rarity: 'Épique', rar: 'var(--epi)', tint: '#e8f8e8', tint2: '#9ad89a', stats: [3, 3, 4],
  atk: 'Grenades expérimentales ; en voiture de course, mines sur le chemin.', skill: 'Inventions : fait monter une alliée d’un rang.',
  sh: { L: [68, 150], R: [132, 150] },
  poses: POSES,
  draw(this: CharDef, x: Ctx): string {
    const W = '#eef0f6', WD = '#b8bfd0', GR = '#3fae5a', GRD = '#26803a', R = '#e0323e', BL = '#5ab0ff';
    const nade = (sx: number, sy: number) => `<circle cx="${sx}" cy="${sy + 50}" r="10" fill="${GR}" stroke="${O}" stroke-width="3"/><path d="M${sx - 3} ${sy + 40} l3 -6 l3 6" fill="${MET}" stroke="${O}" stroke-width="2.5"/>`;
    const armIn = (sx: number, sy: number) => robotArm(sx, sy, W, WD, GR);
    const armR = (sx: number, sy: number) => robotArm(sx, sy, W, WD, GR) + x.when([1], nade(sx, sy));
    let b = '';
    b += torso(W, WD);
    b += `<path d="M58 154 L142 154" stroke="${GR}" stroke-width="10"/><path d="M58 166 L142 166" stroke="${R}" stroke-width="8"/>`;
    b += autobot(100, 186, 0.48);
    b += robotHead(x, { helm: W, helmD: WD, mouthplate: true, face: '#c8ccd8' });
    const ear = `<rect x="30" y="76" width="16" height="30" rx="6" fill="${BL}" stroke="${O}" stroke-width="3.5"/><g class="fx"><rect x="26" y="72" width="24" height="38" rx="9" fill="${BL}" opacity=".3"/></g>`;
    b += x.byPose((p) => (p === 2 ? `<g class="fx"><circle cx="38" cy="90" r="20" fill="#9fd8ff" opacity=".5"/><circle cx="162" cy="90" r="20" fill="#9fd8ff" opacity=".5"/></g>` : '')) + ear + mirror(ear);
    b += `<rect x="78" y="34" width="44" height="10" rx="4" fill="${GR}" stroke="${O}" stroke-width="3"/>`;
    b += x.arm('L', armIn) + x.arm('R', armR);
    b += x.when([2], `<g class="pop">${burst(180, 120, 24, '#ffe14a', '#fff')}</g><g class="pop">${sparks(180, 120, 36, GR, 8)}</g><g class="fx"><circle cx="150" cy="60" r="8" fill="#9aa3b8" opacity=".7"/><circle cx="164" cy="44" r="11" fill="#9aa3b8" opacity=".5"/></g>`);
    return shadow() + x.body(b);
  },
},
];
