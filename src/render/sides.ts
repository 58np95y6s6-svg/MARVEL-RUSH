// Côtés des plateaux en Coop (pur calcul, sans PixiJS) : chaque joueur voit SON plateau en bas et celui de sa
// partenaire en haut, rangées retournées (rangée 0 côté tronc commun pour les deux). Utilisé par la scène et
// vérifié par les tests (une unité invoquée par l'invitée apparaît en bas chez elle, en haut chez l'hôte).

import type { PlayerId } from '../engine/types';
import type { CoopLayout } from '../maps/layout';

export type BoardSide = 'self' | 'partner';

/** Plateau où dessiner les unités de `owner` pour la joueuse `viewer`. */
export function boardSide(viewer: PlayerId, owner: PlayerId): BoardSide {
  return owner === viewer ? 'self' : 'partner';
}

/** Centre (écran logique) de la case `slot` du plateau `side`. */
export function coopCellCenter(L: CoopLayout, side: BoardSide, slot: number): { x: number; y: number } {
  if (side === 'self') {
    const r = L.self.cells[slot]!;
    return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
  }
  const row = Math.floor(slot / 5), col = slot % 5;
  const r = L.partner.cells[(2 - row) * 5 + col]!;
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}
