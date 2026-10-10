// Pièces communes aux Transformers (design/planches/8-transformers-*.html) : casques de robot, plaque
// faciale, insignes Autobot et Decepticon, bras mécaniques, véhicules (mode véhicule des Autobots).
// Même trait que les autres planches : contours #1d1733, cel-shading en deux tons, reflets.
import { O, f, shaded, gloss, limb, hand, mirror, face, glow, burst, sparks, type Num, type Shape, type Ctx } from '../primitives';

/** Métal clair de la plaque faciale, et son ombre. */
export const MET = '#d9dee8', METD = '#9aa3b8';
/** Yeux bleus des Autobots, rouges des Decepticons. */
export const EYE_AUTOBOT = '#5ad8ff', EYE_DECEPTICON = '#ff3b3b';

/* ---------- tête de robot ---------- */
/** Casque : couvre le haut et les côtés de la tête, laisse le visage (plaque claire) au centre. */
export const helmS: Shape = (a) =>
  `<path d="M40 104 L40 54 Q44 22 100 20 Q156 22 160 54 L160 104 L152 128 L138 130 L136 98 Q134 74 100 72 Q66 74 64 98 L62 130 L48 128Z" ${a}/>`;
/** Visage (disque de la tête), couleur métal. */
export const faceS: Shape = (a) => `<circle cx="100" cy="88" r="54" ${a}/>`;

export interface HeadOpts {
  helm: string; helmD: string;
  face?: string; faceD?: string;
  eye?: string;
  /** Plaque buccale (Optimus, Ultra Magnus, Wheeljack) au lieu de la bouche. */
  mouthplate?: boolean;
  /** Visière (Jazz, Grimlock) à la place des yeux : couleur de la visière. */
  visor?: string;
  /** Pas de joues (robots plus durs). */
  hard?: boolean;
}

/** Tête de robot chibi complète : visage métal, yeux lumineux, casque par-dessus. Ajouter les ornements après. */
export function robotHead(x: Ctx, o: HeadOpts): string {
  const fc = o.face ?? MET, fd = o.faceD ?? METD, eye = o.eye ?? EYE_AUTOBOT;
  let s = shaded(faceS, fc, fd) + gloss(78, 58, 12, 7);
  s += x.byPose((p) => {
    let e = '';
    if (o.visor) {
      e += `<g class="fx"><rect x="62" y="82" width="76" height="22" rx="11" fill="${o.visor}" opacity=".35"/></g>`;
      e += `<path d="M64 86 Q100 ${p === 2 ? 80 : 82} 136 86 L134 100 Q100 ${p === 2 ? 96 : 98} 66 100Z" fill="${o.visor}" stroke="${O}" stroke-width="4" stroke-linejoin="round"/>`;
      e += `<path d="M72 89 Q86 86 98 88" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".85"/>`;
      if (p > 0) e += `<path d="M66 ${p === 2 ? 78 : 80} L90 84 M134 ${p === 2 ? 78 : 80} L110 84" stroke="${O}" stroke-width="5" stroke-linecap="round"/>`;
      if (!o.mouthplate) e += p === 2
        ? `<path d="M88 114 Q100 112 112 114 Q110 126 100 127 Q90 126 88 114Z" fill="#3a3550" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/>`
        : `<path d="M90 118 Q100 ${p ? 116 : 122} 110 118" stroke="${O}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    } else {
      e += `<g class="fx"><circle cx="80" cy="95" r="15" fill="${eye}" opacity=".28"/><circle cx="120" cy="95" r="15" fill="${eye}" opacity=".28"/></g>`;
      e += face(p, { eye, noMouth: !!o.mouthplate, noCheeks: !!o.hard || !!o.mouthplate });
    }
    return e;
  });
  if (o.mouthplate) s += mouthplate(fc, fd);
  s += shaded(helmS, o.helm, o.helmD) + gloss(70, 42, 14, 6, -30, 0.45);
  return s;
}

/** Plaque buccale à rainures (Optimus). */
export function mouthplate(c: string, d: string): string {
  return shaded((a) => `<path d="M72 110 L128 110 L122 132 Q100 140 78 132Z" ${a}/>`, c, d, -2, -2) +
    `<path d="M84 118 H96 M104 118 H116 M88 126 H112" stroke="${d}" stroke-width="3" stroke-linecap="round"/>`;
}

/** Antennes en « oreilles » sur les côtés du casque (Optimus, Ultra Magnus). */
export function sideFins(c: string, d: string, h = 30): string {
  const e = shaded((a) => `<path d="M42 84 L30 ${56 - h * 0.3} Q26 ${48 - h * 0.4} 34 ${44 - h * 0.4} L46 66Z" ${a}/>`, c, d, -2, -2);
  return e + mirror(e);
}
/** Crête centrale du casque. */
export function crest(c: string, d: string, h = 18): string {
  return shaded((a) => `<path d="M90 30 L100 ${22 - h} L110 30 L106 64 L94 64Z" ${a}/>`, c, d, -2, -2);
}
/** Petites cornes / antennes rondes (Bumblebee, Wheeljack). */
export function horns(c: string, d: string, x = 66, y = 34, len = 20): string {
  const e = shaded((a) => `<rect x="${x - 6}" y="${y - len}" width="12" height="${len + 4}" rx="6" ${a}/>`, c, d, -2, -2);
  return e + mirror(e);
}

/* ---------- insignes ---------- */
/** Insigne Autobot (visage stylisé), centré en (x, y), largeur ≈ 30 × s. */
export function autobot(x: Num, y: Num, s = 1, c = '#d8322c'): string {
  const d = 'M0 -15 L5 -11 L13 -14 L14 -4 L9 4 L11 13 L5 15 L0 10 L-5 15 L-11 13 L-9 4 L-14 -4 L-13 -14 L-5 -11Z';
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="${d}" fill="${c}" stroke="${O}" stroke-width="${f(3 / s)}" stroke-linejoin="round"/>` +
    `<path d="M-8 -4 L-3 -2 L-3 1 L-8 1Z M8 -4 L3 -2 L3 1 L8 1Z M-2 -10 H2 V-4 H-2Z" fill="${O}" opacity=".55"/></g>`;
}
/** Insigne Decepticon (visage anguleux violet). */
export function decepticon(x: Num, y: Num, s = 1, c = '#8a3fd0'): string {
  const d = 'M0 -14 L6 -4 L15 -15 L13 2 L7 6 L4 15 L0 11 L-4 15 L-7 6 L-13 2 L-15 -15 L-6 -4Z';
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="${d}" fill="${c}" stroke="${O}" stroke-width="${f(3 / s)}" stroke-linejoin="round"/>` +
    `<path d="M-9 -3 L-3 0 L-6 3Z M9 -3 L3 0 L6 3Z" fill="${O}" opacity=".6"/></g>`;
}

/* ---------- corps ---------- */
/** Vitres de cabine sur le torse (Optimus, Ultra Magnus). */
export function chestWindows(glass = '#7fc8f0', frame = O): string {
  const w = `<path d="M66 148 L94 146 L94 172 L70 174Z" fill="${glass}" stroke="${frame}" stroke-width="3.5" stroke-linejoin="round"/><path d="M72 152 L86 151" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>`;
  return w + mirror(w);
}
/** Calandre (grille) sur le ventre. */
export function grille(c: string, y = 180): string {
  return `<rect x="80" y="${y}" width="40" height="18" rx="4" fill="${c}" stroke="${O}" stroke-width="3"/>` +
    [86, 93, 100, 107, 114].map((xx) => `<path d="M${xx} ${y + 3} V${y + 15}" stroke="${O}" stroke-width="2" opacity=".6"/>`).join('');
}
/** Bras de robot : segment, coude à rivet, poing. */
export function robotArm(sx: number, sy: number, c: string, d: string, fist: string, w = 15): string {
  return limb(sx, sy, sx, sy + 38, c, w) +
    shaded((a) => `<rect x="${sx - 11}" y="${sy + 14}" width="22" height="12" rx="4" ${a}/>`, d, O, -1, -1) +
    `<circle cx="${sx}" cy="${sy + 20}" r="2.5" fill="${MET}"/>` + hand(sx, sy + 38, fist, 11);
}
/** Épaulière (gauche ; `mirror` pour la droite). */
export function shoulderPad(c: string, d: string): string {
  const e = shaded((a) => `<path d="M52 150 Q50 130 70 128 Q86 130 84 146 Q68 154 52 150Z" ${a}/>`, c, d, -3, -3) + gloss(62, 136, 6, 3, -30, 0.5);
  return e + mirror(e);
}

/* ---------- mode véhicule ---------- */
export type VehicleKind = 'truck' | 'carrier' | 'van' | 'ambulance' | 'sport' | 'race' | 'police' | 'jeep' | 'beetle' | 'moto';

export interface VehicleOpts {
  kind: VehicleKind;
  body: string; bodyD: string;
  accent?: string; accentD?: string;
  glass?: string;
  /** Rayures longitudinales (Bumblebee), flammes (Hot Rod, Optimus). */
  stripes?: string;
  flames?: string;
  /** Insigne Autobot sur la portière. */
  badge?: boolean;
}

const wheel = (x: number, y: number, r = 17): string =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="#2b2540" stroke="${O}" stroke-width="4"/><circle cx="${x}" cy="${y}" r="${f(r * 0.48)}" fill="${MET}" stroke="${O}" stroke-width="2.5"/><circle cx="${f(x - r * 0.15)}" cy="${f(y - r * 0.15)}" r="${f(r * 0.16)}" fill="#fff"/>`;
const headlight = (x: number, y: number, r = 6): string =>
  `<g class="fx"><circle cx="${x}" cy="${y}" r="${r * 2.2}" fill="#fff6b0" opacity=".35"/></g><circle cx="${x}" cy="${y}" r="${r}" fill="#fff6c0" stroke="${O}" stroke-width="3"/>`;

/**
 * Véhicule chibi vu de profil, tourné vers la droite (sens d'attaque), roues au sol (y ≈ 190).
 * Les formes sont trapues et arrondies comme les héros : grosse cabine, petites roues rondes.
 */
export function vehicleBody(o: VehicleOpts): string {
  const B = o.body, BD = o.bodyD, A = o.accent ?? o.bodyD, AD = o.accentD ?? O, G = o.glass ?? '#8fd0f4';
  let s = '';
  const glassS = (d: string) => `<path d="${d}" fill="${G}" stroke="${O}" stroke-width="3.5" stroke-linejoin="round"/>`;
  switch (o.kind) {
    case 'truck':
    case 'carrier': {
      // Semi-remorque : cabine haute à droite, châssis, cheminées.
      if (o.kind === 'carrier') {
        s += shaded((a) => `<path d="M10 120 L96 112 L96 176 L10 176Z" ${a}/>`, A, AD, -4, -4);
        s += `<path d="M14 142 L94 136" stroke="${O}" stroke-width="5"/>`;
        // petites voitures chargées
        for (const [cx, cy, col] of [[34, 108, '#f6c64a'], [74, 104, '#5ab0f0']] as const)
          s += `<path d="M${cx - 20} ${cy} L${cx - 20} ${cy - 8} Q${cx - 12} ${cy - 10} ${cx - 8} ${cy - 18} L${cx + 8} ${cy - 18} Q${cx + 14} ${cy - 10} ${cx + 20} ${cy - 8} L${cx + 20} ${cy}Z" fill="${col}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>` +
            `<circle cx="${cx - 11}" cy="${cy}" r="4.5" fill="#2b2540" stroke="${O}" stroke-width="2"/><circle cx="${cx + 11}" cy="${cy}" r="4.5" fill="#2b2540" stroke="${O}" stroke-width="2"/>`;
      } else {
        s += shaded((a) => `<rect x="18" y="150" width="84" height="26" rx="6" ${a}/>`, '#6a7088', '#4a4f66', -3, -3);
      }
      for (const xx of [128, 140]) s += `<rect x="${xx}" y="58" width="8" height="46" rx="4" fill="${MET}" stroke="${O}" stroke-width="3"/>`;
      s += shaded((a) => `<path d="M96 178 L96 92 Q96 78 110 78 L150 78 Q160 78 162 90 L166 118 L186 124 Q192 126 192 136 L192 178Z" ${a}/>`, B, BD, -6, -4);
      if (o.flames) s += `<path d="M98 150 Q120 140 130 150 Q142 128 156 146 Q168 132 186 140 L190 178 L98 178Z" fill="${o.flames}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`;
      s += glassS('M136 86 L156 86 L162 116 L136 116Z');
      s += `<path d="M140 90 L150 90" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>`;
      s += `<rect x="176" y="140" width="14" height="30" rx="3" fill="${MET}" stroke="${O}" stroke-width="3"/>` +
        [146, 152, 158, 164].map((y) => `<path d="M178 ${y} H188" stroke="${O}" stroke-width="2"/>`).join('');
      s += headlight(186, 132);
      s += wheel(48, 186) + wheel(118, 186) + wheel(166, 186);
      break;
    }
    case 'van':
    case 'ambulance': {
      s += shaded((a) => `<path d="M20 178 L20 96 Q20 84 34 84 L140 84 Q156 84 164 104 L182 124 Q190 130 190 140 L190 178Z" ${a}/>`, B, BD, -6, -4);
      s += glassS('M144 92 Q156 94 164 116 L144 116Z');
      if (o.kind === 'ambulance') {
        s += `<rect x="20" y="138" width="170" height="12" fill="${A}" stroke="${O}" stroke-width="3"/>`;
        s += `<g transform="translate(70 112)"><path d="M-6 -16 H6 V-6 H16 V6 H6 V16 H-6 V6 H-16 V-6 H-6Z" fill="${A}" stroke="${O}" stroke-width="3" stroke-linejoin="round"/></g>`;
        s += `<rect x="120" y="72" width="26" height="12" rx="4" fill="#ff4a4a" stroke="${O}" stroke-width="3"/><g class="fx"><circle cx="133" cy="76" r="14" fill="#ff4a4a" opacity=".3"/></g>`;
      } else {
        s += `<rect x="34" y="98" width="96" height="40" rx="6" fill="${A}" opacity=".35"/>`;
      }
      s += headlight(184, 140);
      s += wheel(54, 186) + wheel(152, 186);
      break;
    }
    case 'jeep': {
      s += shaded((a) => `<path d="M16 176 L16 112 Q16 100 30 98 L58 96 L76 70 Q80 64 90 64 L140 64 Q150 64 154 74 L164 102 L184 108 Q192 112 192 124 L192 176Z" ${a}/>`, B, BD, -6, -4);
      s += glassS('M84 74 L136 74 L146 100 L72 100Z');
      s += `<path d="M110 74 L110 100" stroke="${O}" stroke-width="3.5"/>`;
      s += `<rect x="176" y="118" width="16" height="40" rx="4" fill="#3a3550" stroke="${O}" stroke-width="3"/>`;
      s += headlight(186, 114);
      s += wheel(50, 182, 20) + wheel(152, 182, 20);
      break;
    }
    case 'beetle': {
      s += shaded((a) => `<path d="M18 176 Q14 136 40 124 Q62 84 104 82 Q148 84 166 120 Q190 128 190 160 L188 176Z" ${a}/>`, B, BD, -6, -4);
      s += glassS('M60 122 Q72 96 100 94 L100 122Z') + glassS('M108 94 Q138 96 150 122 L108 122Z');
      s += headlight(180, 146);
      s += wheel(54, 182) + wheel(150, 182);
      break;
    }
    case 'police':
    case 'sport':
    case 'race': {
      const low = o.kind !== 'police';
      const top = low ? 104 : 90;
      s += shaded((a) => `<path d="M10 176 Q8 142 30 136 L64 132 Q78 ${top} 108 ${top - 2} Q138 ${top} 152 130 L184 138 Q196 142 194 162 L192 176Z" ${a}/>`, B, BD, -6, -4);
      s += glassS(`M74 132 Q86 ${top + 8} 108 ${top + 6} L108 132Z`) + glassS(`M114 ${top + 6} Q136 ${top + 8} 144 132 L114 132Z`);
      if (o.kind === 'police') {
        s += `<rect x="92" y="${top - 12}" width="34" height="10" rx="4" fill="#3a6ad0" stroke="${O}" stroke-width="3"/><rect x="109" y="${top - 12}" width="17" height="10" rx="4" fill="#e8413b" stroke="${O}" stroke-width="3"/>`;
        s += `<g class="fx"><circle cx="100" cy="${top - 8}" r="12" fill="#5ab0ff" opacity=".3"/><circle cx="118" cy="${top - 8}" r="12" fill="#ff5a5a" opacity=".3"/></g>`;
        s += `<path d="M20 150 H186" stroke="${A}" stroke-width="7"/>`;
      }
      if (o.kind === 'race') s += shaded((a) => `<path d="M6 118 L36 118 L36 128 L14 132Z" ${a}/>`, A, AD, -2, -2) + `<path d="M24 128 V138" stroke="${O}" stroke-width="5"/>`;
      s += headlight(188, 150, 5);
      s += wheel(46, 182) + wheel(156, 182);
      break;
    }
    case 'moto': {
      s += wheel(46, 178, 22) + wheel(160, 178, 22);
      s += shaded((a) => `<path d="M40 160 Q60 118 104 116 L150 112 Q172 116 168 142 L132 160Z" ${a}/>`, B, BD, -5, -4);
      s += shaded((a) => `<path d="M140 112 L172 92 L182 100 L160 128Z" ${a}/>`, A, AD, -2, -2);
      s += glassS('M150 104 L170 90 L176 96 L156 112Z');
      s += `<path d="M46 178 L80 150 M160 178 L148 140" stroke="${O}" stroke-width="7" stroke-linecap="round"/><path d="M46 178 L80 150 M160 178 L148 140" stroke="${MET}" stroke-width="3.5" stroke-linecap="round"/>`;
      s += headlight(176, 108, 5);
      break;
    }
  }
  if (o.stripes) s += `<path d="M24 150 H186 M24 160 H186" stroke="${o.stripes}" stroke-width="5" fill="none"/>`;
  if (o.flames && o.kind !== 'truck' && o.kind !== 'carrier') s += `<path d="M150 170 Q140 150 120 156 Q118 140 98 146 Q92 132 70 140 Q66 152 64 170Z" fill="${o.flames}" stroke="${O}" stroke-width="3" stroke-linejoin="round" opacity=".95"/>`;
  if (o.badge !== false) s += autobot(o.kind === 'moto' ? 104 : o.kind === 'truck' || o.kind === 'carrier' ? 120 : 92, o.kind === 'moto' ? 138 : 152, 0.75);
  s += gloss(70, o.kind === 'jeep' ? 92 : 126, 16, 5, -10, 0.45);
  return s;
}

/** Véhicule animé (poses : 0 repos, 1 démarrage, 2 attaque avec traînée de vitesse et effet `hit`). */
export function vehicleDraw(x: Ctx, o: VehicleOpts, hit: string, col: string): string {
  const shadowV = `<ellipse cx="100" cy="200" rx="86" ry="8" fill="${O}" opacity=".18"/>`;
  const body = vehicleBody(o);
  const pose = x.byPose((p) => {
    if (p === 0) return `<g>${body}</g>`;
    if (p === 1) return `<g transform="translate(-4 2) rotate(-3 100 190)">${body}</g>`;
    return `<g transform="translate(10 -2) rotate(2 100 190)">${body}</g>`;
  });
  const fx = x.when([1], `<g class="fx">${[132, 150, 168].map((y, i) => `<path d="M${6 - i * 4} ${y} H${-24 - i * 6}" stroke="${O}" stroke-width="7" stroke-linecap="round"/><path d="M${6 - i * 4} ${y} H${-24 - i * 6}" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>`).join('')}</g>`)
    + x.when([2], `<g class="fx">${[128, 146, 164].map((y, i) => `<path d="M${10 - i * 4} ${y} H${-36 - i * 8}" stroke="${O}" stroke-width="7" stroke-linecap="round"/><path d="M${10 - i * 4} ${y} H${-36 - i * 8}" stroke="${col}" stroke-width="3.4" stroke-linecap="round"/>`).join('')}</g>${hit}`);
  return shadowV + pose + fx;
}

/** Impact générique en bout de course (pose 2 des véhicules). */
export const impact = (x: number, y: number, c: string): string => `<g class="pop">${burst(x, y, 20, c, '#fff')}</g><g class="pop">${sparks(x, y, 30, '#fff', 8)}</g>`;
export const lamp = (x: number, y: number, c: string): string => glow(x, y, 14, c);

/** Lignes de vitesse horizontales (traînée derrière un objet ou un coup). */
export function speedLines(x: number, y: number, len: number, c = '#fff', k = 3, gap = 9): string {
  let s = '';
  for (let i = 0; i < k; i++) {
    const yy = y + (i - (k - 1) / 2) * gap, l = len * (i % 2 ? 0.7 : 1);
    s += `<path d="M${f(x)} ${f(yy)} H${f(x - l)}" stroke="${O}" stroke-width="7" stroke-linecap="round"/><path d="M${f(x)} ${f(yy)} H${f(x - l)}" stroke="${c}" stroke-width="3.4" stroke-linecap="round"/>`;
  }
  return s;
}
/** Arc de mouvement (coup d'épée, de hache, de marteau). */
export function swoosh(d: string, c = '#fff', w = 12): string {
  return `<path d="${d}" stroke="${c}" stroke-width="${w + 10}" fill="none" stroke-linecap="round" opacity=".22"/><path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round" opacity=".55"/><path d="${d}" stroke="#fff" stroke-width="${f(w * 0.35)}" fill="none" stroke-linecap="round"/>`;
}
/** Onde de choc (anneaux elliptiques). */
export const shock = (x: Num, y: Num, rx: number, ry: number, c: string): string =>
  `<g class="ring"><ellipse cx="${f(x)}" cy="${f(y)}" rx="${rx}" ry="${ry}" fill="none" stroke="${O}" stroke-width="9"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="${rx}" ry="${ry}" fill="none" stroke="${c}" stroke-width="5"/></g>`;
