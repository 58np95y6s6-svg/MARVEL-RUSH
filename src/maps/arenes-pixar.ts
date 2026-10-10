// Arènes des méchants Pixar (extension Pixar), une par boss : le repaire volcanique de Nomanisan (Syndrome), la
// salle des portes (Randall), la décharge de Sunnyside (Lotso), l'île des fourmis (Le Borgne), le dirigeable
// L'Esprit d'Aventure (Muntz) et la planète Z (Zurg). Même construction que les autres arènes.

import {
  type AnimSpec, type Ctx, INK, P, at, cel, circleS, cloud, defineMap, glow, hills, light, n1, peaks, rectS, scene, sparkle, spots, stars,
} from './kit';
import { closetDoor, crater, rocket, screamCan, toyBlock, vaultGate } from './px-kit';

type Pal = Parameters<typeof defineMap>[0]['palette'];

const pal = (o: Partial<Pal> & { sky1: string; sky2: string; ground: string; path: string; accent: string }): Pal => ({
  bg: '#141020', ground2: light(o.ground, 0.06), pathEdge: '#5a5a70', pathDeco: o.accent,
  frame: '#8a8aa0', frameLight: '#c8c8d8', frameShade: '#5a5a70', cellA: '#eeedf4', cellB: '#dcdae6', portal: '#8a3fd0',
  ...o,
});

function glowAnims(c: Ctx, col: string, col2: string, label: string, label2: string): AnimSpec[] {
  const [a, b, , d, e] = spots(c);
  return [
    at(label, 'pulse', a, 34, glow(a.x, a.y, 12, col), { period: 1.8, amp: 0.18 }),
    at(label, 'pulse', b, 34, glow(b.x, b.y, 12, col), { period: 2.2, amp: 0.18, phase: 0.4 }),
    at(label2, 'blink', d, 22, sparkle(d.x, d.y, 12, col2), { period: 1.6, min: 0 }),
    at(label2, 'blink', e, 22, sparkle(e.x, e.y, 10, col2), { period: 2.1, min: 0, phase: 0.5 }),
  ];
}
const ground = (base: number, c: string) => cel(rectS(-20, base - 4, 1040, 26, 0), c, { dx: 0, dy: 8 });

/* ---------- Syndrome : le repaire de Nomanisan ---------- */
export const areneSyndrome = defineMap({
  id: 'arene-syndrome', name: 'Île de Nomanisan', tagline: 'Le repaire volcanique de Syndrome.',
  universe: 'boss', heroes: [], boss: 'syndrome', shape: 'zigzag',
  pathMaterial: 'Passerelle d’acier au-dessus de la lave', pathKind: 'belt', frameKind: 'obsidian',
  palette: pal({ sky1: '#3a1a2a', sky2: '#d85a3a', ground: '#4a3a4a', path: '#c8c8d6', accent: '#7ad8ff' }),
  backdrop: (c) => scene(c, {
    texture: 'tiles', pad: '#5a4a5a', padMargin: 0.9,
    horizon: (base) => peaks(base - 10, '#2a1a2a', 160, 'nomanisan', 4, '#ff8a3a') + ground(base, '#5a4a5a'),
  }),
  props: { big: [P.rock('#4a3a4a'), rocket('#c8c8d6', '#2b2838')], med: [P.rock('#5a4a5a'), P.crystal('#7ad8ff')], small: [P.rock('#6a5a6a')] },
  gate: vaultGate('#5a5a70', '#7ad8ff'),
  anims: (c) => glowAnims(c, '#ff8a3a', '#7ad8ff', 'Coulées de lave', 'Rayons à point zéro'),
  sound: 'volcan-repaire', unlock: { type: 'depart', value: 0 },
  bossFx: { description: 'Le ciel rougeoie, des éclairs bleus du rayon à point zéro traversent l’écran.', effects: ['shake', 'lightning'], tint: '#ff5a3a', tintAlpha: 0.08 },
  mute: { sat: 0.8, lum: 0.92 },
});

/* ---------- Randall : la salle des portes ---------- */
export const areneRandall = defineMap({
  id: 'arene-randall', name: 'La salle des portes', tagline: 'Des milliers de portes de placard, et Randall caché parmi elles.',
  universe: 'boss', heroes: [], boss: 'randall', shape: 'steps',
  pathMaterial: 'Rail de convoyage des portes', pathKind: 'belt', frameKind: 'metal',
  palette: pal({ sky1: '#1a1a3a', sky2: '#4a4a8a', ground: '#3a3a5a', path: '#c8c8e0', accent: '#c88aff' }),
  backdrop: (c) => scene(c, {
    texture: 'tiles', pad: '#4a4a6a', padMargin: 0.9,
    horizon: (base) => [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => cel(rectS(-10 + i * 120, base - 150 - (i % 3) * 40, 60, 120, 4), ['#e85a8a', '#4ab8e8', '#f6c83a', '#8ae04a'][i % 4]!, { dx: 6, dy: 0 })).join('') + ground(base, '#4a4a6a'),
  }),
  props: { big: [closetDoor('#e85a8a'), closetDoor('#4ab8e8')], med: [closetDoor('#f6c83a', '#8ae04a'), screamCan()], small: [screamCan('#c88aff')] },
  gate: vaultGate('#5a5a78', '#c88aff'),
  anims: (c) => glowAnims(c, '#c88aff', '#ff3b3b', 'Reflets du caméléon', 'Voyants des portes'),
  sound: 'portes-rails', unlock: { type: 'depart', value: 0 },
  bossFx: { description: 'Le décor se brouille : Randall se fond dans le paysage.', effects: ['ripple'], tint: '#8a5ab8', tintAlpha: 0.1 },
  mute: { sat: 0.8, lum: 0.9 },
});

/* ---------- Lotso : la décharge ---------- */
export const areneLotso = defineMap({
  id: 'arene-lotso', name: 'La décharge des Trois-Comtés', tagline: 'Le tapis roulant de l’incinérateur, où Lotso trie les jouets.',
  universe: 'boss', heroes: [], boss: 'lotso', shape: 'u',
  pathMaterial: 'Tapis roulant de la décharge', pathKind: 'rubble', frameKind: 'toy',
  palette: pal({ sky1: '#4a2a2a', sky2: '#d88a5a', ground: '#6a5a4a', path: '#c8b898', accent: '#ff8ab8' }),
  backdrop: (c) => scene(c, {
    texture: 'spots', pad: '#7a6a5a', padMargin: 0.9,
    horizon: (base) => hills(base - 10, '#4a3a2a', 120, 'decharge', 7) + `<circle cx="500" cy="${base - 80}" r="80" fill="#ff8a3a" opacity=".35"/>` + ground(base, '#6a5a4a'),
  }),
  props: { big: [toyBlock('#d8382c', 'L'), toyBlock('#3a8ad8', 'O')], med: [toyBlock('#f6c83a', 'T'), P.crate('#8a6a4a')], small: [toyBlock('#7ad86a', 'S')] },
  gate: vaultGate('#6a5a5a', '#ff8a3a'),
  anims: (c) => glowAnims(c, '#ff8a3a', '#ff8ab8', 'Lueur de l’incinérateur', 'Odeur de fraise'),
  sound: 'decharge-tapis', unlock: { type: 'depart', value: 0 },
  bossFx: { description: 'Une lueur orange d’incinérateur monte du bas de l’écran.', effects: ['shake'], tint: '#ff8a3a', tintAlpha: 0.08 },
  mute: { sat: 0.8, lum: 0.92 },
});

/* ---------- Le Borgne : l'île des fourmis ---------- */
export const areneHopper = defineMap({
  id: 'arene-hopper', name: 'L’île des fourmis', tagline: 'Sous les brins d’herbe géants, la fourmilière rançonnée.',
  universe: 'boss', heroes: [], boss: 'hopper', shape: 'arch',
  pathMaterial: 'Sentier de fourmis', pathKind: 'dirt', frameKind: 'wood',
  palette: pal({ sky1: '#5a9a5a', sky2: '#d8f0c0', ground: '#7a9a4a', path: '#d8c098', accent: '#d8e04a' }),
  backdrop: (c) => scene(c, {
    texture: 'grass', pad: '#6a8a3a', padMargin: 0.9,
    horizon: (base) => [60, 180, 320, 520, 700, 880].map((x, i) => `<path d="M${x} ${base} Q${x + 20} ${base - 200 - (i % 3) * 40} ${x + 60} ${base - 260 - (i % 2) * 30}" stroke="${INK}" stroke-width="20" fill="none"/><path d="M${x} ${base} Q${x + 20} ${base - 200 - (i % 3) * 40} ${x + 60} ${base - 260 - (i % 2) * 30}" stroke="#5aa83a" stroke-width="12" fill="none"/>`).join('') + ground(base, '#6a8a3a'),
  }),
  props: { big: [P.tree('#6ab84a'), P.shroom('#d8584a')], med: [P.bush('#5aa83a'), P.rock('#a8885a')], small: [P.tuft('#5aa83a')] },
  gate: vaultGate('#7a6a4a', '#d8e04a'),
  anims: (c) => glowAnims(c, '#d8e04a', '#fff', 'Graines au soleil', 'Rosée'),
  sound: 'ile-criquets', unlock: { type: 'depart', value: 0 },
  bossFx: { description: 'Une nuée de sauterelles assombrit le ciel.', effects: ['shake'], tint: '#3a4a1a', tintAlpha: 0.12 },
  mute: { sat: 0.8, lum: 0.95 },
});

/* ---------- Muntz : le dirigeable ---------- */
export const areneMuntz = defineMap({
  id: 'arene-muntz', name: 'L’Esprit d’Aventure', tagline: 'Le dirigeable de Charles Muntz, amarré au-dessus des chutes.',
  universe: 'boss', heroes: [], boss: 'muntz', shape: 'wave',
  pathMaterial: 'Pont de bois du dirigeable', pathKind: 'planks', frameKind: 'wood',
  palette: pal({ sky1: '#6aa0d8', sky2: '#f0e0c0', ground: '#8a6a4a', path: '#d8b888', accent: '#ffb347' }),
  backdrop: (c) => scene(c, {
    texture: 'none', pad: '#7a5a3a', padMargin: 0.9,
    horizon: (base) => [100, 420, 760].map((x, i) => cloud(x, base - 70 - (i % 2) * 40, 1.3)).join('') + `<ellipse cx="500" cy="${base - 210}" rx="300" ry="70" fill="#8a7a6a" stroke="${INK}" stroke-width="6"/>` + ground(base, '#7a5a3a'),
  }),
  props: { big: [P.crate('#a8885a'), P.lantern('#ffb347')], med: [P.crate('#8a6a4a'), P.lantern('#ffd27a')], small: [P.crate('#c8a07a')] },
  gate: vaultGate('#7a5a3a', '#ffb347'),
  anims: (c) => glowAnims(c, '#ffb347', '#fff', 'Lanternes du dirigeable', 'Reflets des hublots'),
  sound: 'dirigeable-moteurs', unlock: { type: 'depart', value: 0 },
  bossFx: { description: 'Le dirigeable tangue, des aboiements résonnent.', effects: ['shake', 'ripple'], tint: '#a8885a', tintAlpha: 0.08 },
  mute: { sat: 0.8, lum: 0.95 },
});

/* ---------- Zurg : la planète Z ---------- */
export const areneZurg = defineMap({
  id: 'arene-zurg', name: 'La planète Z', tagline: 'La forteresse de l’Empereur Zurg, au fond de la galaxie.',
  universe: 'boss', heroes: [], boss: 'zurg', shape: 'zigzag',
  pathMaterial: 'Chaussée cosmique de la forteresse', pathKind: 'cosmic', frameKind: 'cosmic',
  palette: pal({ sky1: '#120a2a', sky2: '#4a2a7a', ground: '#3a2a5a', path: '#c8b8e8', accent: '#ff3b6a', portal: '#ff3b6a' }),
  backdrop: (c) => scene(c, {
    texture: 'spots', pad: '#4a3a6a', padMargin: 0.9,
    horizon: (base) => stars(c, 40, { x: 0, y: 0, w: 1000, h: base - 40 }) + cel(circleS(820, base - 220, 60), '#7a4ac8', { dx: 8, dy: 8 }) + peaks(base - 10, '#2a1a4a', 140, 'zurg', 5, '#ff3b6a') + ground(base, '#4a3a6a'),
  }),
  props: { big: [rocket('#7a4ac8', '#ff3b6a'), rocket('#c8c8d6', '#7a4ac8')], med: [crater('#4a3a6a', '#ff3b6a'), P.crystal('#c88aff')], small: [crater('#5a4a7a', '#8af0ff')] },
  gate: vaultGate('#4a3a6a', '#ff3b6a'),
  anims: (c) => glowAnims(c, '#ff3b6a', '#8af0ff', 'Cratères ioniques', 'Étoiles lointaines'),
  sound: 'planete-z', unlock: { type: 'depart', value: 0 },
  bossFx: { description: 'Lueur rouge ionique ; à 30 %, l’écran tremble : « Je suis ton père ».', effects: ['shake', 'snap-flash'], tint: '#ff3b6a', tintAlpha: 0.1 },
  mute: { sat: 0.8, lum: 0.9 },
});
void n1;
