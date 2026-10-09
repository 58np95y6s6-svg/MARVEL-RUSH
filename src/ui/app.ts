// Navigation par fragment d'URL : accueil, combat, pages de développement.
//   #            accueil
//   #combat      combat Solo Infini (deck Marvel de départ, Toits de New York)
//   #dev/fast    combat accéléré (×8 ; #dev/fast/16 pour ×16)
//   #dev/art     prévisualisation des personnages
//   #dev/maps    prévisualisation des maps
//   #dev/fx      revue des effets d'attaque et de compétence
import './base.css';
import './battle.css';
import { STARTER_DECKS } from '../data/units';

type Cleanup = () => void;
let cleanup: Cleanup | null = null;
let root: HTMLElement;

function go(hash: string): void {
  if (location.hash === hash || (hash === '' && !location.hash)) void route();
  else location.hash = hash;
}

async function route(): Promise<void> {
  cleanup?.();
  cleanup = null;
  root.innerHTML = '';
  const h = location.hash.replace(/^#/, '');
  // La clé d'accès (#k=…) a déjà été retirée par la porte d'entrée.
  if (h.startsWith('dev/art')) {
    const { mountArtPreview } = await import('../art/preview');
    unlockScroll(true);
    mountArtPreview(root);
    cleanup = () => unlockScroll(false);
    return;
  }
  if (h.startsWith('dev/maps')) {
    const { mountMapPreview } = await import('../maps/preview');
    unlockScroll(true);
    const stop = mountMapPreview(root);
    cleanup = () => { stop(); unlockScroll(false); };
    return;
  }
  if (h.startsWith('dev/fx')) {
    const { mountFxPreview } = await import('../render/fx/devPage');
    const stop = mountFxPreview(root);
    cleanup = stop;
    return;
  }
  if (h === 'combat' || h.startsWith('dev/fast')) {
    const m = /^dev\/fast\/?(\d+)?/.exec(h);
    const speed = m ? Number(m[1] ?? 8) : 1;
    const { mountBattle } = await import('./battle');
    const b = mountBattle(root, {
      deck: STARTER_DECKS.marvel.slice(),
      mapId: 'toits-new-york',
      speed,
      onHome: () => go(''),
      onReplay: () => void route(),
    });
    cleanup = () => b.destroy();
    return;
  }
  const { mountHome } = await import('./home');
  cleanup = mountHome(root, { onPlay: () => go('#combat') });
}

/** Les pages de développement sont des pages longues : on y autorise le défilement. */
function unlockScroll(on: boolean): void {
  const els = [document.documentElement, document.body, root];
  for (const e of els) {
    e.style.overflow = on ? 'auto' : '';
    e.style.position = on ? 'static' : '';
    e.style.height = on ? 'auto' : '';
  }
  document.documentElement.style.touchAction = on ? 'auto' : '';
}

export function startApp(el: HTMLElement): void {
  root = el;
  window.addEventListener('hashchange', () => void route());
  void route();
}
