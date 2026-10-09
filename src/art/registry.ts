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

export interface Entry {
  def: CharDef;
  opts: CtxOpts;
}

const units = new Map<string, Entry>();
for (const def of [...MARVEL_A, ...MARVEL_B, ...DISNEY_A, ...DISNEY_B, ...DC_A, ...DC_B]) units.set(def.id, { def, opts: { partMode: 'partT' } });

const bosses = new Map<string, Entry>();
for (const def of [...BOSSES, THANOS, ...DC_BOSSES]) bosses.set(def.id, { def, opts: { partMode: 'bodyT' } });

const minions = new Map<string, Entry>();
for (const [boss, def] of Object.entries({ ...MINIONS, ...DC_MINIONS })) minions.set(boss, { def, opts: { partMode: 'bodyT' } });
minions.set('thanos', { def: OUTRIDER, opts: { partMode: 'bodyT' } });

export const UNIT_IDS: readonly UnitId[] = [
  'ironman', 'spiderman', 'hulk', 'thor', 'strange', 'venom', 'cmarvel',
  'cap', 'loki', 'bucky', 'hawkeye', 'falcon', 'widow', 'shangchi',
  'moana', 'maui', 'pocahontas', 'mulan', 'merida', 'ariel', 'foxhound',
  'tiana', 'nemo', 'coco', 'nickjudy', 'buzzwoody', 'rapunzel', 'vanralph',
  'batman', 'superman', 'wonderwoman', 'flash', 'aquaman', 'greenlantern', 'cyborg', 'supergirl',
  'shazam', 'robin', 'batgirl', 'catwoman', 'harley', 'martian', 'greenarrow',
];
export const BOSS_IDS: readonly BossId[] = ['jafar', 'cruella', 'ursula', 'malefique', 'galactus', 'bouffon', 'thanos',
  'joker', 'luthor', 'bane', 'sinestro', 'blackadam', 'darkseid'];

function must(map: Map<string, Entry>, id: string, what: string): Entry {
  const e = map.get(id);
  if (!e) throw new Error(`art: ${what} inconnu « ${id} »`);
  return e;
}
export const unitEntry = (id: UnitId): Entry => must(units, id, 'personnage');
export const bossEntry = (id: BossId): Entry => must(bosses, id, 'boss');
export const minionEntry = (id: BossId): Entry => must(minions, id, 'sbire');
