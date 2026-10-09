// Thanos (boss final) et ses Outriders, dessinés dans le traitement « méchant » de
// design/planches/5-boss-sbires.html : chibi trapu, visage dans l'ombre, yeux lumineux.
import { O, f, uid, shaded, clip, gloss, limb, hand, star, glow, burst, sparks, mirror, shadow, tip, headS, type CharDef, type Ctx } from '../primitives';
import { hoodShade, geyes, evilMouth, txt, rnd, twinkle } from '../kits/villain';

/** Couleurs des six Pierres d'infinité (code couleur du pouvoir annoncé en jeu). */
export const STONES = {
  puissance: '#a64dff',
  espace: '#3c8bf0',
  realite: '#ff3048',
  ame: '#ff8a1e',
  temps: '#3ee06a',
  esprit: '#ffd400',
} as const;

const BL = '#3557b0', BLD = '#22397a', G = '#f2c14e', GD = '#c58f25', GL = '#fff0b8';
const PU = '#9b7bc0', PUD = '#6c4e94';

/** Gant de l'infini dans le repère du bras (épaule en sx, sy ; le bras pend vers le bas). */
function gauntlet(sx: number, sy: number, lit: boolean, snap: boolean): string {
  const hx = sx, hy = sy + 52;
  let s = shaded((a) => `<rect x="${sx - 16}" y="${sy + 24}" width="32" height="20" rx="7" ${a}/>`, G, GD, -3, -3);
  s += `<path d="M${sx - 16} ${sy + 34} H${sx + 16}" stroke="${GD}" stroke-width="3"/>`;
  // poing doré
  s += shaded((a) => `<path d="M${hx - 17} ${hy - 12} Q${hx} ${hy - 20} ${hx + 17} ${hy - 12} L${hx + 18} ${hy + 8} Q${hx} ${hy + 20} ${hx - 18} ${hy + 8}Z" ${a}/>`, G, GD, -3, -3);
  // doigts repliés (ou claquement : majeur et pouce tendus)
  if (snap) {
    s += shaded((a) => `<path d="M${hx - 4} ${hy + 10} L${hx - 7} ${hy + 30} Q${hx - 2} ${hy + 35} ${hx + 3} ${hy + 30} L${hx + 5} ${hy + 10}Z" ${a}/>`, G, GD, -2, -2);
    s += `<path d="M${hx - 16} ${hy + 10} Q${hx - 18} ${hy + 18} ${hx - 10} ${hy + 18} M${hx + 8} ${hy + 12} Q${hx + 16} ${hy + 20} ${hx + 18} ${hy + 10}" stroke="${O}" stroke-width="3" fill="${G}" stroke-linejoin="round"/>`;
  } else {
    s += `<path d="M${hx - 9} ${hy + 4} V${hy + 14} M${hx} ${hy + 6} V${hy + 16} M${hx + 9} ${hy + 4} V${hy + 14}" stroke="${GD}" stroke-width="2.6" stroke-linecap="round"/>`;
  }
  // pouce
  s += shaded((a) => `<ellipse cx="${hx + 17}" cy="${hy - 2}" rx="7" ry="10" ${a}/>`, G, GD, -2, -2);
  s += gloss(hx - 8, hy - 9, 6, 3, -20, 0.6);
  // six pierres
  const st: [number, number, number, string][] = [
    [hx, hy - 2, 5.6, STONES.ame],
    [hx - 13, hy + 9, 3.2, STONES.puissance],
    [hx - 4.5, hy + 12, 3.2, STONES.espace],
    [hx + 4.5, hy + 12, 3.2, STONES.realite],
    [hx + 13, hy + 9, 3.2, STONES.esprit],
    [hx + 18, hy - 4, 3.2, STONES.temps],
  ];
  if (lit) s += st.map(([x, y, r, c]) => glow(x, y, r * 3.2, c)).join('');
  s += st.map(([x, y, r, c]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="${O}" stroke-width="2.4"/><circle cx="${f(x - r * 0.35)}" cy="${f(y - r * 0.35)}" r="${f(r * 0.35)}" fill="#fff" opacity=".85"/>`).join('');
  return s;
}

export const THANOS: CharDef = {
  id: 'thanos', name: 'Thanos', stats: [5, 2, 5], tint: '#c76a35', tint2: '#2a1236', mt: '#efe2fb', mt2: '#c9b0e6', glow: '#ffd400', shake: true,
  power: 'Gant de l’infini : une Pierre au hasard toutes les 8 s ; claquement de doigts à 30 % de PV.', minionTxt: 'Outriders : très rapides, en meute.',
  sh: { L: [52, 152], R: [148, 152] },
  poses: [{ L: 18, R: -16 }, { L: 34, R: -150, body: [2, -6, 3, 1, 1.03] }, { L: 26, R: -128, body: [-5, 2, -5, 1.02, 0.98] }],
  bg() {
    let s = '';
    const r = rnd(23);
    for (let i = 0; i < 9; i++) s += twinkle(f(-24 + r() * 250), f(-30 + r() * 120), f(3 + r() * 4), '#ffd9a8', 0.5);
    const rock = (x: number, y: number, k: number): string =>
      `<path d="M${x - 14 * k} ${y} L${x - 8 * k} ${y - 9 * k} L${x + 6 * k} ${y - 10 * k} L${x + 15 * k} ${y - 2 * k} L${x + 8 * k} ${y + 7 * k} L${x - 9 * k} ${y + 6 * k}Z" fill="#3a1a2e" opacity=".6"/>`;
    s += rock(-18, 40, 1) + rock(214, 18, 0.8) + rock(196, 110, 0.6);
    const cols = Object.values(STONES);
    cols.forEach((c, i) => {
      const a = -Math.PI * 0.9 + (i * Math.PI * 0.8) / 5;
      s += `<circle cx="${f(100 + Math.cos(a) * 150)}" cy="${f(96 + Math.sin(a) * 130)}" r="5" fill="${c}" opacity=".55"/>`;
    });
    return s;
  },
  draw(this: CharDef, x: Ctx): string {
    const armL = (sx: number, sy: number): string =>
      limb(sx, sy, sx, sy + 38, BL, 24) + shaded((a) => `<rect x="${sx - 15}" y="${sy + 24}" width="30" height="18" rx="6" ${a}/>`, G, GD, -3, -3) +
      `<path d="M${sx - 15} ${sy + 33} H${sx + 15}" stroke="${GD}" stroke-width="3"/>` + hand(sx, sy + 50, BL, 15);
    const armR = (sx: number, sy: number): string => limb(sx, sy, sx, sy + 38, BL, 24) + gauntlet(sx, sy, x.mode > 0, x.mode === 2);
    let b = '';
    // cape-col doré derrière la tête
    b += shaded((a) => `<path d="M40 146 Q36 112 58 98 L142 98 Q164 112 160 146Z" ${a}/>`, GD, '#9a6c18', 4, -4);
    // buste en armure bleue
    b += shaded((a) => `<path d="M24 206 C20 152 54 128 100 126 C146 128 180 152 176 206Z" ${a}/>`, BL, BLD, -10, -4) + gloss(50, 166, 12, 5, -55, 0.22);
    b += `<path d="M58 160 L100 178 L142 160 M66 176 L100 190 L134 176" stroke="${BLD}" stroke-width="3.5" fill="none" stroke-linejoin="round"/><path d="M100 140 V176" stroke="${BLD}" stroke-width="3"/>`;
    // bandoulière dorée
    b += shaded((a) => `<path d="M128 132 L150 140 L124 192 L104 188Z" ${a}/>`, G, GD, -3, -3) + `<path d="M138 140 L116 188" stroke="${GD}" stroke-width="2.5"/>`;
    // ceinture et médaillon
    b += shaded((a) => `<path d="M26 182 Q100 198 174 182 L175 202 Q100 216 25 202Z" ${a}/>`, G, GD, -3, -3) + `<path d="M28 192 Q100 207 172 192" stroke="${GD}" stroke-width="2.5" fill="none"/>`;
    b += x.when([1, 2], glow(100, 197, 16, '#ffe27a'));
    b += shaded((a) => `<circle cx="100" cy="197" r="11" ${a}/>`, G, GD, -2, -2) + `<circle cx="100" cy="197" r="4.5" fill="#fff3b0" stroke="${O}" stroke-width="2"/>`;
    // col doré
    b += shaded((a) => `<path d="M66 132 Q100 148 134 132 L130 146 Q100 160 70 146Z" ${a}/>`, G, GD, -3, -3);
    // capuche bleue (derrière le visage)
    b += shaded((a) => `<path d="M32 114 Q26 30 100 20 Q174 30 168 114 Q168 142 146 154 L54 154 Q32 142 32 114Z" ${a}/>`, BL, BLD, -5, -4);
    // visage violet, large menton strié
    const faceS = (a: string): string => `<path d="M58 92 Q58 64 100 62 Q142 64 142 92 L141 128 Q138 160 100 163 Q62 160 59 128Z" ${a}/>`;
    b += shaded(faceS, PU, PUD, -4, -4);
    b += `<path d="M80 140 Q82 151 88 158 M100 143 V162 M120 140 Q118 151 112 158 M68 128 Q70 140 76 148 M132 128 Q130 140 124 148" stroke="${PUD}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    b += `<path d="M90 118 Q100 114 110 118" stroke="${PUD}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    b += hoodShade(faceS, 64, 112, 0.5);
    // casque doré : dôme, crête, bandeau de front, protège-joues et disques
    b += shaded((a) => `<path d="M42 86 Q40 18 100 12 Q160 18 158 86 Q150 72 140 68 Q100 56 60 68 Q50 72 42 86Z" ${a}/>`, G, GD, -4, -4) + gloss(70, 32, 14, 5, -25, 0.5);
    b += shaded((a) => `<path d="M90 66 L92 8 Q100 0 108 8 L110 66 Q100 60 90 66Z" ${a}/>`, GL, G, -2, -2);
    b += `<path d="M74 64 Q70 40 82 20 M126 64 Q130 40 118 20" stroke="${GD}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    const guard = `<path d="M56 88 L66 90 L67 126 L59 122Z" fill="${G}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`;
    b += guard + mirror(guard);
    b += shaded((a) => `<path d="M56 86 Q100 64 144 86 L141 96 Q100 76 59 96Z" ${a}/>`, G, GD, -2, -2);
    const ear = shaded((a) => `<circle cx="40" cy="106" r="13" ${a}/>`, G, GD, -2, -2) + `<circle cx="40" cy="106" r="6" fill="${GD}" stroke="${O}" stroke-width="2.5"/>`;
    b += ear + mirror(ear);
    // regard et bouche
    b += x.byPose((p) => {
      let s = geyes('#ffd23a', { x: 82, y: 104, s: p == 2 ? 1.08 : 1, sq: p == 1 ? 0.65 : 1 });
      s += evilMouth(p, 100, 131, 13);
      return s;
    });
    // épaulières dorées par-dessus les bras (le bras du gant passe devant quand il est levé)
    const pad = (a: string): string => `<path d="M24 156 Q22 124 50 120 Q78 124 78 152 Q50 164 24 156Z" ${a}/>`;
    const pads = shaded(pad, G, GD, -4, -4) + `<path d="M28 146 Q50 154 76 144" stroke="${GD}" stroke-width="3" fill="none"/>` + gloss(40, 130, 9, 4, -30, 0.55);
    const [gx, gy] = tip(this, 'R', 1, 52);
    b += x.when([1], `<g class="fx"><circle cx="${f(gx)}" cy="${f(gy)}" r="44" fill="#fff6d0" opacity=".28"/></g>`);
    b += x.arm('L', armL) + pads;
    b += x.mode > 0 ? mirror(pads) + x.arm('R', armR) : x.arm('R', armR) + mirror(pads);
    // préparation : le gant levé, les six Pierres s'allument
    const cols = Object.values(STONES);
    let rays = '';
    cols.forEach((c, i) => {
      const a = -Math.PI / 2 + (i - 2.5) * 0.42;
      const x1 = gx + Math.cos(a) * 26, y1 = gy + Math.sin(a) * 26, x2 = gx + Math.cos(a) * 52, y2 = gy + Math.sin(a) * 52;
      rays += `<path d="M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}" stroke="${O}" stroke-width="9" stroke-linecap="round"/><path d="M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`;
    });
    b += x.when([1], rays + cols.map((c, i) => `<polygon points="${star(gx + Math.cos(i * 1.05) * 62, gy + 14 + Math.sin(i * 1.05) * 30, 7, 2.4, 4)}" fill="${c}" stroke="${O}" stroke-width="2"/>`).join(''));
    // claquement de doigts : éclair blanc
    const [sx2, sy2] = tip(this, 'R', 2, 72);
    const fl = uid('flash');
    const fxg = x.when([2],
      `<radialGradient id="${fl}"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>` +
      `<g class="pop"><circle cx="${f(sx2)}" cy="${f(sy2)}" r="118" fill="url(#${fl})"/></g>` +
      `<g class="pop">${burst(f(sx2), f(sy2), 34, '#fff', '#fffbe6')}</g>` +
      `<g class="ring"><circle cx="${f(sx2)}" cy="${f(sy2)}" r="52" fill="none" stroke="#fff" stroke-width="6"/></g>` +
      `<g class="pop">${cols.map((c, i) => sparks(f(sx2 + Math.cos(i * 1.047 + 0.5) * 70), f(sy2 + Math.sin(i * 1.047 + 0.5) * 56), 12, c, 5)).join('')}</g>` +
      `<g class="pop">${txt(166, 6, 28, '#fff', 'CLAC !', 8)}</g>`);
    return shadow(88) + x.body(b) + fxg;
  },
};

/* ---------- Outrider : bête grise et blanche à quatre bras, rapide, en meute ---------- */
export const OUTRIDER: CharDef = {
  id: 'outrider', name: 'Outriders',
  poses: [{}, { body: [-8, 4, -8, 1.02, 0.94] }, { body: [6, -4, 6, 1.04, 1.03] }],
  draw(this: CharDef, x: Ctx): string {
    const W = '#e4e5ec', WD = '#a5a8b8', DK = '#4a4858', DKD = '#2b2a36', BO = '#fffbe6';
    const p = x.mode;
    let b = '';
    // pattes arrière (marche)
    b += `<g class="legA">${limb(80, 182, 74, 204, WD, 11)}</g><g class="legB">${limb(96, 184, 98, 204, W, 12)}</g>`;
    b += `<path d="M66 205 l8 -6 l6 6 M90 205 l8 -6 l6 6" stroke="${O}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    // bras inférieurs (posés au sol, comme un fauve)
    b += limb(124, 168, 136, 202, WD, 11) + `<path d="M128 205 l6 -5 l4 5 l4 -5 l4 5" stroke="${O}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    // corps voûté
    const bodyS = (a: string): string => `<path d="M56 186 Q46 150 76 136 Q110 124 134 144 Q148 160 138 182 Q100 198 56 186Z" ${a}/>`;
    b += shaded(bodyS, W, WD, -6, -5) + gloss(78, 146, 10, 4, -30, 0.5);
    b += clip(bodyS, `<path d="M60 170 Q92 160 126 170 M64 180 Q96 172 130 180" stroke="${WD}" stroke-width="2.5" fill="none"/>`);
    // crête dorsale
    b += `<g fill="${DK}" stroke="${O}" stroke-width="3" stroke-linejoin="round"><polygon points="66,146 64,128 78,140"/><polygon points="82,138 84,118 96,134"/><polygon points="100,134 106,114 114,134"/></g>`;
    // tête allongée vers l'avant
    const headSh = (a: string): string => `<path d="M114 150 Q116 120 146 116 Q176 116 182 138 Q184 156 164 162 Q138 168 114 150Z" ${a}/>`;
    b += shaded(headSh, W, WD, -4, -4) + hoodShade(headSh, 112, 146, 0.5) + gloss(136, 124, 8, 3, -20, 0.55);
    // gueule pleine de crocs
    const jaw = p == 2 ? 14 : p == 1 ? 4 : 8;
    b += `<path d="M138 146 Q160 ${146 + jaw} 182 ${142 + jaw * 0.3} Q170 148 160 146Z" fill="#5c0f22" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`;
    let teeth = '';
    for (let i = 0; i < 5; i++) teeth += `<polygon points="${142 + i * 8},145 ${148 + i * 8},145 ${145 + i * 8},${151 + (i % 2) * 2}"/>`;
    b += `<g fill="${BO}" stroke="${O}" stroke-width="1.6" stroke-linejoin="round">${teeth}</g>`;
    // orbites sombres et yeux lumineux
    const eye = (ex: number, ey: number, k: number): string =>
      `<ellipse cx="${ex}" cy="${ey}" rx="${f(8 * k)}" ry="${f(5.5 * k)}" fill="${DKD}" stroke="${O}" stroke-width="2.2"/>` +
      `<g class="fx"><ellipse cx="${ex}" cy="${ey}" rx="${f(9 * k)}" ry="${f(6 * k)}" fill="#ffe23a" opacity=".3"/></g>` +
      `<path d="M${f(ex - 5 * k)} ${f(ey - 2 * k)} L${f(ex + 5 * k)} ${f(ey + (p == 1 ? 0 : 1) * k)} Q${f(ex)} ${f(ey + 3.5 * k)} ${f(ex - 5 * k)} ${f(ey - 2 * k)}Z" fill="#ffe23a"/>`;
    b += eye(148, 132, 1) + eye(166, 130, 0.8);
    // bras supérieurs griffus
    const claws = (cx: number, cy: number): string =>
      `<g fill="${BO}" stroke="${O}" stroke-width="2.2" stroke-linejoin="round"><polygon points="${cx - 5},${cy} ${cx - 2},${cy + 12} ${cx + 1},${cy}"/><polygon points="${cx + 1},${cy + 1} ${cx + 5},${cy + 12} ${cx + 7},${cy}"/><polygon points="${cx + 6},${cy - 2} ${cx + 13},${cy + 7} ${cx + 11},${cy - 4}"/></g>`;
    // [épaule, coude, main] pour chaque bras supérieur
    const A1 = ([[[116, 152], [130, 180], [156, 186]], [[116, 152], [112, 122], [130, 100]], [[116, 152], [140, 158], [164, 148]]] as const)[p];
    const A2 = ([[[128, 154], [150, 178], [176, 176]], [[128, 154], [134, 122], [152, 104]], [[128, 154], [152, 146], [176, 130]]] as const)[p];
    const arm = (q: readonly (readonly [number, number])[], c: string, w: number): string => {
      const [s0, e0, h0] = [q[0]!, q[1]!, q[2]!];
      return limb(s0[0], s0[1], e0[0], e0[1], c, w) + limb(e0[0], e0[1], h0[0], h0[1], c, w - 1) +
        `<circle cx="${e0[0]}" cy="${e0[1]}" r="${w / 2 + 1}" fill="${c}"/>` + hand(h0[0], h0[1], c, 8) + claws(h0[0] - 1, h0[1] + 4);
    };
    b += arm(A1, WD, 10) + arm(A2, W, 11);
    const fxg = x.when([2], `<g class="pop"><path d="M160 96 l16 24 M170 90 l16 24 M180 88 l10 16" stroke="${O}" stroke-width="7" stroke-linecap="round"/><path d="M160 96 l16 24 M170 90 l16 24 M180 88 l10 16" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g>`) +
      x.when([1], sparks(140, 106, 18, '#ffe23a', 6));
    return shadow(54, 207, 0.18) + x.body(b) + fxg;
  },
};
