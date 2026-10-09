// Longueurs de chemin des maps, seule donnée de map (avec les modificateurs) lue par le moteur.
// Les maps de src/maps/index.ts sont découvertes automatiquement ; registerMaps permet d'en
// ajouter ou d'en remplacer (tests, maps en cours d'écriture).

export interface MapLengths {
  id: string;
  pathLength: number;
  pathLengthCoop?: { a: number; b: number; tronc: number };
  /** Forme du chemin (src/maps/layout.ts) : sert à la géométrie des portées. Absente = 'u'. */
  shape?: string;
}

const registry = new Map<string, MapLengths>();

function discover(): void {
  const mods = import.meta.glob<Record<string, unknown>>('../maps/index.ts', { eager: true });
  for (const mod of Object.values(mods)) {
    const all = mod.ALL_MAPS ?? mod.MAPS;
    if (!Array.isArray(all)) continue;
    for (const m of all as MapLengths[]) {
      if (m && typeof m.id === 'string' && typeof m.pathLength === 'number') registry.set(m.id, m);
    }
  }
}
discover();

export function registerMaps(maps: readonly MapLengths[]): void {
  for (const m of maps) registry.set(m.id, m);
}

export function mapLengths(id: string): MapLengths | undefined {
  return registry.get(id);
}

/**
 * Modificateurs de map (§7 bis) lus par le moteur dans GameConfig.mapModifiers :
 *   fastSpeed          vitesse des rapides +x (0.1 = +10 %)
 *   beamDamage         dégâts des rayons (Uni-Beam, laser de Buzz) +x
 *   chainBounces       rebonds supplémentaires (Thor, flèche électrique)
 *   cooldownReduction  recharges des compétences −x
 *   comboDamage        dégâts des anneaux de Shang-Chi +x
 *   controlDuration    durée des contrôles +x
 *   burnDamage         brûlures +x
 *   extraRevive        résurrections de Coco en plus, par partie
 *   slowPower          force des ralentissements +x
 *   shieldHits         coups de bouclier ennemis (−1 = un de moins)
 */
export const MAP_MODIFIER_KEYS = [
  'fastSpeed', 'beamDamage', 'chainBounces', 'cooldownReduction', 'comboDamage',
  'controlDuration', 'burnDamage', 'extraRevive', 'slowPower', 'shieldHits',
] as const;
