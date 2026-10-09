// Composant de vue commun (§8) : en-tête, contenu (défilement interne optionnel), barre du bas.
import './base.css';

export interface ViewParts { header?: HTMLElement; content: HTMLElement; footer?: HTMLElement; scroll?: boolean }

export function createView({ header, content, footer, scroll = false }: ViewParts): HTMLElement {
  const view = document.createElement('section');
  view.className = 'view';
  const top = header ?? document.createElement('div');
  top.classList.add('view-header');
  content.classList.add(scroll ? 'scroll' : 'no-scroll');
  const bottom = footer ?? document.createElement('div');
  bottom.classList.add('view-footer');
  view.append(top, content, bottom);
  return view;
}
