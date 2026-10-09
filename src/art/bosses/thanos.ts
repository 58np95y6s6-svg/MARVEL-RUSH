// Thanos (boss final) et ses Outriders, dessinés dans le traitement « méchant » de
// design/planches/5-boss-sbires.html : chibi trapu, visage dans l'ombre, yeux lumineux.
import { O, f, shaded, clip, gloss, limb, hand, star, glow, burst, sparks, mirror, shadow, tip, headS, type CharDef, type Ctx } from '../primitives';
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
  poses: [{ L: 18, R: -16 }, { L: 34, R: -166, body: [2, -6, 3, 1, 1.03] }, { L: 26, R: -128, body: [-5, 2, -5, 1.02, 0.98] }],
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
    // visage violet et menton strié (sous la capuche)
    b += shaded(headS, PU, PUD) ;
    const chin = (a: string): string => `<path d="M66 112 Q66 152 100 156 Q134 152 134 112 Q100 126 66 112Z" ${a}/>`;
    b += shaded(chin, PU, PUD, -3, -4);
    b += `<path d="M84 128 Q85 142 90 151 M100 131 V156 M116 128 Q115 142 110 151 M76 122 Q76 134 80 142 M124 122 Q124 134 120 142" stroke="${PUD}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    const win = (a: string): string => `<path d="M64 80 Q100 62 136 80 L136 130 Q100 146 64 130Z" ${a}/>`;
    b += hoodShade(win, 70, 112, 0.62);
    // capuche bleue
    b += shaded((a) => `<path d="M38 108 Q30 30 100 22 Q170 30 162 108 Q160 130 144 144 L136 100 Q134 74 100 70 Q66 74 64 100 L56 144 Q40 130 38 108Z" ${a}/>`, BL, BLD, -4, -4);
    // casque doré : dôme, crête, bandeau de front et protège-joues
    b += shaded((a) => `<path d="M44 76 Q44 22 100 16 Q156 22 156 76 Q132 58 100 60 Q68 58 44 76Z" ${a}/>`, G, GD, -4, -4) + gloss(72, 34, 14, 5, -25, 0.5);
    b += shaded((a) => `<path d="M90 70 L93 12 Q100 4 107 12 L110 70 Q100 64 90 70Z" ${a}/>`, GL, G, -2, -2);
    b += `<path d="M76 62 Q72 40 84 22 M124 62 Q128 40 116 22" stroke="${GD}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    const guard = `<path d="M60 80 L72 82 L74 120 L64 126 Q58 104 60 80Z" fill="${G}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/>`;
    b += guard + mirror(guard);
    b += shaded((a) => `<path d="M60 80 Q100 62 140 80 L136 90 Q100 74 64 90Z" ${a}/>`, G, GD, -2, -2);
    const ear = shaded((a) => `<circle cx="44" cy="100" r="13" ${a}/>`, G, GD, -2, -2) + `<circle cx="44" cy="100" r="6" fill="${GD}" stroke="${O}" stroke-width="2.5"/>`;
    b += ear + mirror(ear);
    // regard et bouche
    b += x.byPose((p) => {
      let s = geyes('#ffd23a', { x: 84, y: 100, s: p == 2 ? 1.05 : 0.95, sq: p == 1 ? 0.65 : 1 });
      s += evilMouth(p, 100, 122, 12);
      return s;
    });
    b += x.arm('L', armL) + x.arm('R', armR);
    // épaulières dorées par-dessus les bras
    b += shaded((a) => `<circle cx="50" cy="146" r="24" ${a}/>`, G, GD, -4, -4) + shaded((a) => `<circle cx="150" cy="146" r="24" ${a}/>`, G, GD, -4, -4);
    b += `<path d="M32 152 Q50 164 68 152 M132 152 Q150 164 168 152" stroke="${GD}" stroke-width="3" fill="none"/>` + gloss(43, 137, 8, 4, -30, 0.55) + gloss(143, 137, 8, 4, -30, 0.55);
    // préparation : le gant levé, les six Pierres s'allument
    const [gx, gy] = tip(this, 'R', 1, 52);
    const cols = Object.values(STONES);
    let rays = '';
    cols.forEach((c, i) => {
      const a = -Math.PI / 2 + (i - 2.5) * 0.42;
      const x1 = gx + Math.cos(a) * 26, y1 = gy + Math.sin(a) * 26, x2 = gx + Math.cos(a) * 52, y2 = gy + Math.sin(a) * 52;
      rays += `<path d="M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}" stroke="${O}" stroke-width="9" stroke-linecap="round"/><path d="M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`;
    });
    b += x.when([1], `<g class="fx"><circle cx="${f(gx)}" cy="${f(gy)}" r="40" fill="#fff6d0" opacity=".35"/></g>${rays}` + cols.map((c, i) => `<polygon points="${star(gx + Math.cos(i * 1.05) * 62, gy + 14 + Math.sin(i * 1.05) * 30, 7, 2.4, 4)}" fill="${c}" stroke="${O}" stroke-width="2"/>`).join(''));
    // claquement de doigts : éclair blanc
    const [sx2, sy2] = tip(this, 'R', 2, 72);
    const fxg = x.when([2],
      `<g class="pop"><circle cx="${f(sx2)}" cy="${f(sy2)}" r="150" fill="#fff" opacity=".42"/><circle cx="${f(sx2)}" cy="${f(sy2)}" r="86" fill="#fff" opacity=".55"/></g>` +
      `<g class="pop">${burst(f(sx2), f(sy2), 34, '#fff', '#fffbe6')}</g>` +
      `<g class="ring"><circle cx="${f(sx2)}" cy="${f(sy2)}" r="52" fill="none" stroke="#fff" stroke-width="6"/></g>` +
      `<g class="pop">${cols.map((c, i) => sparks(f(sx2 + Math.cos(i * 1.047 + 0.5) * 70), f(sy2 + Math.sin(i * 1.047 + 0.5) * 56), 12, c, 5)).join('')}</g>` +
      `<g class="pop">${txt(f(sx2 - 70), f(sy2 + 10), 26, '#fff', 'CLAC !', -10)}</g>`);
    return shadow(88) + x.body(b) + fxg;
  },
};

/* ---------- Outrider : bête grise et blanche à quatre bras, rapide, en meute ---------- */
export const OUTRIDER: CharDef = {
  id: 'outrider', name: 'Outriders',
  poses: [{}, { body: [-8, 4, -8, 1.02, 0.94] }, { body: [16, -6, 10, 1.05, 1.04] }],
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
    const reach = ([[150, 178], [138, 112], [176, 170]] as const)[p];
    b += limb(108, 158, reach[0] - 10, reach[1], DK, 10) + hand(reach[0] - 10, reach[1], W, 8) + claws(reach[0] - 12, reach[1] + 4);
    b += limb(126, 156, reach[0] + 6, reach[1] - 6, WD, 11) + hand(reach[0] + 6, reach[1] - 6, W, 9) + claws(reach[0] + 4, reach[1] - 2);
    const fxg = x.when([2], `<g class="pop"><path d="M170 150 l22 24 M180 144 l20 22 M190 140 l14 16" stroke="${O}" stroke-width="7" stroke-linecap="round"/><path d="M170 150 l22 24 M180 144 l20 22 M190 140 l14 16" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g>`) +
      x.when([1], sparks(140, 106, 18, '#ffe23a', 6));
    return shadow(54, 207, 0.18) + x.body(b) + fxg;
  },
};
