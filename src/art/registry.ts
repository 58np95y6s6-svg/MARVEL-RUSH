// Registre des personnages : relie les identifiants du jeu aux fonctions de dessin des planches.
import type { BossId, UnitId } from '../data/types';
import type { CharDef, CtxOpts } from './primitives';
import { MARVEL_A } from './heroes/marvelA';
import { MARVEL_B } from './heroes/marvelB';
import { DISNEY_A } from './heroes/disneyA';
import { DISNEY_B } from './heroes/disneyB';
import { DC_A } from './heroes/dcA';
import { DC_B } from './heroes/dcB';
import { BOSSES } from './bosses/disneyVillains';
import { MINIONS } from './bosses/minions';
import { THANOS, OUTRIDER } from './bosses/thanos';
import { DC_BOSSES } from './bosses/dcVillains';
import { DC_MINIONS } from './bosses/dcMinions';
import { TF_A } from './heroes/transformersA';
import { TF_B } from './heroes/transformersB';
import { TF_VEHICLES } from './heroes/transformersVehicles';
import { TF_BOSSES } from './bosses/decepticons';
import { TF_MINIONS } from './bosses/decepticonMinions';

export interface Entry {
  def: CharDef;
  opts: CtxOpts;
}

const units = new Map<string, Entry>();
for (const def of [...MARVEL_A, ...MARVEL_B, ...DISNEY_A, ...DISNEY_B, ...DC_A, ...DC_B, ...TF_A, ...TF_B]) units.set(def.id, { def, opts: { partMode: 'partT' } });
/** Extension Transformers : mode véhicule des Autobots (clé = identifiant du héros). */
const vehicles = new Map<string, Entry>();
for (const def of TF_VEHICLES) vehicles.set(def.id, { def, opts: { partMode: 'partT' } });

const bosses = new Map<string, Entry>();
for (const def of [...BOSSES, THANOS, ...DC_BOSSES, ...TF_BOSSES]) bosses.set(def.id, { def, opts: { partMode: 'bodyT' } });

const minions = new Map<string, Entry>();
for (const [boss, def] of Object.entries({ ...MINIONS, ...DC_MINIONS, ...TF_MINIONS })) minions.set(boss, { def, opts: { partMode: 'bodyT' } });
minions.set('thanos', { def: OUTRIDER, opts: { partMode: 'bodyT' } });

export const UNIT_IDS: readonly UnitId[] = [
  'ironman', 'spiderman', 'hulk', 'thor', 'strange', 'venom', 'cmarvel',
  'cap', 'loki', 'bucky', 'hawkeye', 'falcon', 'widow', 'shangchi',
  'moana', 'maui', 'pocahontas', 'mulan', 'merida', 'ariel', 'foxhound',
  'tiana', 'nemo', 'coco', 'nickjudy', 'buzzwoody', 'rapunzel', 'vanralph',
  'batman', 'superman', 'wonderwoman', 'flash', 'aquaman', 'greenlantern', 'cyborg', 'supergirl',
  'shazam', 'robin', 'batgirl', 'catwoman', 'harley', 'martian', 'greenarrow',
  'optimus', 'bumblebee', 'ironhide', 'ratchet', 'jazz', 'arcee', 'grimlock', 'wheeljack',
  'hotrod', 'elita', 'bulkhead', 'sideswipe', 'prowl', 'mirage', 'ultramagnus',
];
export const BOSS_IDS: readonly BossId[] = ['jafar', 'cruella', 'ursula', 'malefique', 'galactus', 'bouffon', 'thanos',
  'joker', 'luthor', 'bane', 'sinestro', 'blackadam', 'darkseid',
  'starscream', 'soundwave', 'shockwave', 'devastator', 'blitzwing', 'megatron', 'unicron'];

function must(map: Map<string, Entry>, id: string, what: string): Entry {
  const e = map.get(id);
  if (!e) throw new Error(`art: ${what} inconnu « ${id} »`);
  return e;
}
export const unitEntry = (id: UnitId): Entry => must(units, id, 'personnage');
export const bossEntry = (id: BossId): Entry => must(bosses, id, 'boss');
export const minionEntry = (id: BossId): Entry => must(minions, id, 'sbire');
/** Mode véhicule d'un Autobot (undefined pour les héros qui ne se transforment pas). */
export const vehicleEntry = (id: UnitId): Entry | undefined => vehicles.get(id);
