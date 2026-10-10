// Arènes des Decepticons (extension Transformers), une par boss : le ciel (Starscream), la station radar
// (Soundwave), le labo de Kaon (Shockwave), la carrière (Devastator), la toundra (Blitzwing), le Némésis
// (Megatron) et l'espace d'Unicron. Même construction que les autres arènes (fond, accessoires, porte,
// animations d'ambiance, effets pendant le boss).

import {
  type AnimSpec, type Ctx, type Painter, INK, P, across, at, cel, circleS, cloud, defineMap, glow, hills, light, n1, peaks, rectS,
  scene, sparkle, spots, stars,
} from './kit';
import { blastDoor, console_, emblem, energon, pylon, turret } from './tf-kit';

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

const jet = (x: number, y: number) =>
  `<path d="M${x - 40} ${y} L${x + 30} ${y - 6} L${x + 44} ${y} L${x + 30} ${y + 6}Z" fill="#c8ccd8" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M${x - 10} ${y} L${x - 24} ${y - 22} L${x + 4} ${y - 2}Z M${x - 10} ${y} L${x - 24} ${y + 22} L${x + 4} ${y + 2}Z" fill="#d8322c" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`;

const mountainProp = (c: string): Painter => P.rock(c);

/* ---------- Starscream : le ciel ---------- */
export const areneStarscream = defineMap({
  id: 'arene-starscream', name: 'Le ciel', tagline: 'Au-dessus des nuages, le terrain de chasse de Starscream.',
  universe: 'boss', heroes: [], boss: 'starscream', shape: 'arch',
  pathMaterial: 'Passerelle de nuages', pathKind: 'slabs', frameKind: 'metal',
  palette: pal({ sky1: '#5aa0e8', sky2: '#d8ecff', ground: '#c8dcf4', path: '#f4f8ff', accent: '#d8322c', pathEdge: '#9ab0d0' }),
  backdrop: (c) => scene(c, {
    texture: 'none', pad: '#a8c0e0', padMargin: 0.9,
    horizon: (base) => [80, 300, 560, 820].map((x, i) => cloud(x, base - 60 - (i % 2) * 50, 1.4)).join('') + cel(rectS(-20, base - 4, 1040, 26, 0), '#b8d0ec', { dx: 0, dy: 8 }),
  }),
  props: { big: [P.rock('#d8e6f8'), pylon('#8a90b0', '#d8322c')], med: [P.rock('#e8f0fc'), turret('#7a8098', '#ff5a5a')], small: [P.rock('#f0f6ff')] },
  gate: blastDoor('#8a90b0', '#d8322c'),
  anims: (c) => [across('Seekers en formation', c.mode === 'solo' ? 220 : 60, 7, (x, y) => jet(x, y), { w: 100, h: 50 }), ...glowAnims(c, '#ff8a2a', '#fff', 'Traînées de missiles', 'Reflets du soleil')],
  sound: 'ciel-reacteurs', unlock: { type: 'depart', value: 0 },
  bossFx: { description: 'Le ciel rougeoie, des traînées de missiles zèbrent l’écran.', effects: ['missiles', 'shake'], tint: '#ff5a3a', tintAlpha: 0.08 },
  mute: { sat: 0.8, lum: 0.95 },
});

/* ---------- Soundwave : la station radar ---------- */
const dish: Painter = (x, y, s) =>
  cel(rectS(x - 6 * s, y - 70 * s, 12 * s, 70 * s, 3), '#5a6080', { dx: 3, dy: 0 }) +
  `<path d="M${n1(x - 50 * s)} ${n1(y - 110 * s)} Q${n1(x)} ${n1(y - 40 * s)} ${n1(x + 50 * s)} ${n1(y - 110 * s)}Z" fill="#c8ccd8" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>` +
  `<circle cx="${n1(x)}" cy="${n1(y - 98 * s)}" r="${n1(6 * s)}" fill="#ff5ad8" stroke="${INK}" stroke-width="3"/>`;
export const areneSoundwave = defineMap({
  id: 'arene-soundwave', name: 'La station radar', tagline: 'Soundwave écoute tout, depuis ses antennes.',
  universe: 'boss', heroes: [], boss: 'soundwave', shape: 'wave',
  pathMaterial: 'Caillebotis de la station', pathKind: 'belt', frameKind: 'metal',
  palette: pal({ sky1: '#1a2250', sky2: '#4a5aa0', ground: '#3a4068', path: '#c0c6de', accent: '#ff5ad8' }),
  backdrop: (c) => scene(c, {
    texture: 'tiles', pad: '#4a5078', padMargin: 0.9,
    horizon: (base) => stars(c, 30, { x: 0, y: 0, w: 1000, h: base - 40 }) + hills(base - 20, '#2a3058', 70, 'radar', 5) + cel(rectS(-20, base - 4, 1040, 26, 0), '#4a5078', { dx: 0, dy: 8 }),
  }),
  props: { big: [dish, pylon('#5a6080', '#ff5ad8')], med: [console_('#5a6080', '#ff5ad8'), dish], small: [energon('#ff5ad8')] },
  gate: blastDoor('#5a6080', '#ff5ad8'),
  anims: (c) => glowAnims(c, '#ff5ad8', '#fff', 'Ondes de brouillage', 'Voyants des antennes'),
  sound: 'radar-ondes', unlock: { type: 'depart', value: 0 },
  bossFx: { description: 'Parasites roses sur tout l’écran (brouillage).', effects: ['static', 'ripple'], tint: '#ff5ad8', tintAlpha: 0.08 },
  mute: { sat: 0.8, lum: 0.9 },
});

/* ---------- Shockwave : le labo de Kaon ---------- */
const tube: Painter = (x, y, s) =>
  cel(rectS(x - 26 * s, y - 12 * s, 52 * s, 12 * s, 3), '#4a3a68', { dx: 0, dy: 4 }) +
  `<rect x="${n1(x - 20 * s)}" y="${n1(y - 110 * s)}" width="${n1(40 * s)}" height="${n1(98 * s)}" rx="${n1(16 * s)}" fill="#ffd23a" fill-opacity=".3" stroke="${INK}" stroke-width="5"/>` +
  `<circle cx="${n1(x)}" cy="${n1(y - 60 * s)}" r="${n1(12 * s)}" fill="#ffd23a" opacity=".7"/>`;
export const areneShockwave = defineMap({
  id: 'arene-shockwave', name: 'Le labo de Kaon', tagline: 'Les expériences interdites de Shockwave.',
  universe: 'boss', heroes: [], boss: 'shockwave', shape: 'u',
  pathMaterial: 'Sol du laboratoire', pathKind: 'slabs', frameKind: 'metal',
  palette: pal({ sky1: '#2a1848', sky2: '#5a3a88', ground: '#3a2a58', path: '#d8d2e8', accent: '#ffd23a' }),
  backdrop: (c) => scene(c, {
    texture: 'tiles', pad: '#4a3a68', padMargin: 0.9,
    horizon: (base) => [0, 1, 2, 3, 4, 5].map((i) => cel(rectS(-10 + i * 180, base - 160, 120, 180, 6), i % 2 ? '#4a3a78' : '#3a2a68', { dx: 10, dy: 0 })).join('') + cel(rectS(-20, base - 4, 1040, 26, 0), '#4a3a68', { dx: 0, dy: 8 }),
  }),
  props: { big: [tube, console_('#4a3a68', '#ffd23a')], med: [tube, turret('#4a3a68', '#ffd23a')], small: [energon('#ffd23a')] },
  gate: blastDoor('#4a3a68', '#ffd23a'),
  anims: (c) => glowAnims(c, '#ffd23a', '#fff', 'Cuves d’expérience', 'Étincelles'),
  sound: 'kaon-labo', unlock: { type: 'depart', value: 0 },
  bossFx: { description: 'L’œil jaune de Shockwave balaie l’écran, lueur jaune pulsante.', effects: ['eye-sweep'], tint: '#ffd23a', tintAlpha: 0.08 },
  mute: { sat: 0.78, lum: 0.88 },
});

/* ---------- Devastator : la carrière ---------- */
const crane: Painter = (x, y, s) =>
  cel(rectS(x - 30 * s, y - 30 * s, 60 * s, 30 * s, 6 * s), '#f2c33c', { dx: 6, dy: 0 }) +
  `<path d="M${n1(x)} ${n1(y - 30 * s)} L${n1(x + 50 * s)} ${n1(y - 120 * s)}" stroke="${INK}" stroke-width="12"/><path d="M${n1(x)} ${n1(y - 30 * s)} L${n1(x + 50 * s)} ${n1(y - 120 * s)}" stroke="#f2c33c" stroke-width="6"/>` +
  `<path d="M${n1(x + 50 * s)} ${n1(y - 120 * s)} V${n1(y - 70 * s)}" stroke="${INK}" stroke-width="4"/>` + cel(circleS(x + 50 * s, y - 64 * s, 8 * s), '#5a5a6a', { dx: 2, dy: 2 });
export const areneDevastator = defineMap({
  id: 'arene-devastator', name: 'La carrière', tagline: 'Les Constructicons s’y assemblent en Devastator.',
  universe: 'boss', heroes: [], boss: 'devastator', shape: 'zigzag',
  pathMaterial: 'Piste de terre battue', pathKind: 'dirt', frameKind: 'stone',
  palette: pal({ sky1: '#e8b07a', sky2: '#fff0d0', ground: '#c89a6a', path: '#d8b48a', accent: '#f2c33c', pathEdge: '#9a7a5a' }),
  backdrop: (c) => scene(c, {
    texture: 'spots', pad: '#a8805a', padMargin: 0.9,
    horizon: (base) => peaks(base - 30, '#b8885a', 150, 'carriere', 5) + hills(base, '#c89a6a', 60, 'carriere2', 6) + cel(rectS(-20, base - 4, 1040, 26, 0), '#a8805a', { dx: 0, dy: 8 }),
  }),
  props: { big: [crane, mountainProp('#b8885a')], med: [P.rock('#c8a07a'), P.crate('#f2c33c')], small: [P.rock('#d8b48a')] },
  anims: (c) => glowAnims(c, '#f2c33c', '#fff', 'Gyrophares des engins', 'Poussière'),
  sound: 'carriere-engins', unlock: { type: 'depart', value: 0 },
  bossFx: { description: 'Le sol tremble à chaque pas du géant, poussière orange.', effects: ['shake', 'dust'], tint: '#c8702a', tintAlpha: 0.08 },
  mute: { sat: 0.8, lum: 0.92 },
});

/* ---------- Blitzwing : la toundra ---------- */
export const areneBlitzwing = defineMap({
  id: 'arene-blitzwing', name: 'La toundra', tagline: 'Glace d’un côté, feu de l’autre : Blitzwing hésite.',
  universe: 'boss', heroes: [], boss: 'blitzwing', shape: 'wave',
  pathMaterial: 'Glace craquelée', pathKind: 'stone', frameKind: 'stone',
  palette: pal({ sky1: '#8ab8e8', sky2: '#eef6ff', ground: '#dce8f4', path: '#f4faff', accent: '#7fd8ff', pathEdge: '#9ab8d8' }),
  backdrop: (c) => scene(c, {
    texture: 'none', pad: '#c0d4ea', padMargin: 0.9,
    horizon: (base) => peaks(base - 20, '#a8c4e0', 170, 'toundra', 6, '#ffffff') + cel(rectS(-20, base - 4, 1040, 26, 0), '#c8dcf0', { dx: 0, dy: 8 }),
  }),
  props: { big: [P.pine('#5a8a7a'), P.crystal('#9adcff')], med: [P.crystal('#7fd8ff'), P.rock('#e0ecf8')], small: [P.rock('#eef6ff')] },
  anims: (c) => glowAnims(c, '#7fd8ff', '#ff8a2a', 'Givre', 'Braises'),
  sound: 'toundra-vent', unlock: { type: 'depart', value: 0 },
  bossFx: { description: 'Moitié de l’écran gelée, moitié rougeoyante.', effects: ['frost', 'embers'], tint: '#7fd8ff', tintAlpha: 0.1 },
  mute: { sat: 0.8, lum: 0.95 },
});

/* ---------- Megatron : le Némésis ---------- */
export const areneMegatron = defineMap({
  id: 'arene-megatron', name: 'Le Némésis', tagline: 'Le vaisseau amiral des Decepticons.',
  universe: 'boss', heroes: [], boss: 'megatron', shape: 'u',
  pathMaterial: 'Pont de métal sombre', pathKind: 'belt', frameKind: 'obsidian',
  palette: pal({ sky1: '#1a1428', sky2: '#3a2a58', ground: '#2a2438', path: '#8a8aa0', accent: '#b05aff', pathEdge: '#4a4a60' }),
  backdrop: (c) => scene(c, {
    texture: 'tiles', pad: '#3a3448', padMargin: 0.9,
    horizon: (base) => stars(c, 24, { x: 0, y: 0, w: 1000, h: base - 120 }) + [0, 1, 2, 3, 4].map((i) => cel(rectS(-20 + i * 220, base - 110, 180, 130, 10), '#3a3450', { dx: 12, dy: 0 })).join('') +
      `<rect x="-20" y="${base - 90}" width="1040" height="8" fill="#b05aff" opacity=".6"/>` + cel(rectS(-20, base - 4, 1040, 26, 0), '#3a3448', { dx: 0, dy: 8 }),
  }),
  props: { big: [emblem('#b05aff', '#3a3450', true), turret('#4a4a60', '#b05aff')], med: [console_('#3a3450', '#b05aff'), turret('#4a4a60', '#ff3b3b')], small: [energon('#b05aff')] },
  gate: blastDoor('#3a3450', '#b05aff'),
  anims: (c) => glowAnims(c, '#b05aff', '#ff3b3b', 'Énergon noir', 'Alarmes'),
  sound: 'nemesis-moteurs', unlock: { type: 'depart', value: 0 },
  bossFx: { description: 'Lueur violette du canon à fusion, alarmes rouges.', effects: ['alarm', 'shake'], tint: '#8a3fd0', tintAlpha: 0.12 },
  mute: { sat: 0.78, lum: 0.86 },
});

/* ---------- Unicron : l'espace ---------- */
export const areneUnicron = defineMap({
  id: 'arene-unicron', name: 'L’espace d’Unicron', tagline: 'Le dévoreur de mondes approche.',
  universe: 'boss', heroes: [], boss: 'unicron', shape: 'arch',
  pathMaterial: 'Chemin d’étoiles', pathKind: 'cosmic', frameKind: 'cosmic',
  palette: pal({ sky1: '#0a0818', sky2: '#3a1a2a', ground: '#1a1428', path: '#2a2040', accent: '#ff8a2a', pathEdge: '#4a3a60' }),
  backdrop: (c) => scene(c, {
    texture: 'none', pad: '#1a1428', padMargin: 0.9,
    horizon: (base) => stars(c, 60, { x: 0, y: 0, w: 1000, h: base }) + `<circle cx="760" cy="${base - 150}" r="110" fill="#e8862a" opacity=".35"/><circle cx="760" cy="${base - 150}" r="80" fill="#5a5a6a" stroke="${INK}" stroke-width="6"/><ellipse cx="760" cy="${base - 150}" rx="160" ry="30" fill="none" stroke="#e8862a" stroke-width="8"/><circle cx="160" cy="${base - 80}" r="46" fill="#3a6aa0" stroke="${INK}" stroke-width="5"/>`,
  }),
  props: { big: [P.crystal('#ff8a2a'), P.rock('#4a3a58')], med: [P.crystal('#ffb347'), P.rock('#3a2a48')], small: [P.rock('#5a4a68')] },
  anims: (c) => glowAnims(c, '#ff8a2a', '#fff', 'Énergie cosmique', 'Étoiles'),
  sound: 'unicron-grondement', unlock: { type: 'depart', value: 0 },
  bossFx: { description: 'Lueur orange d’Unicron, l’écran tremble.', effects: ['shake', 'rotate-bg'], tint: '#ff8a2a', tintAlpha: 0.12 },
  mute: { sat: 0.82, lum: 0.9 },
});
