// Écran d'accueil minimal (étape 1) : logo, « Jouer » (Solo Infini, deck Marvel de départ), tutoriel à venir.
import './home.css';
import { createView } from './view';
import { tokenSvg } from '../art';
import { STARTER_DECKS, UNITS } from '../data/units';

export function mountHome(root: HTMLElement, o: { onPlay: () => void }): () => void {
  const header = document.createElement('header');
  header.className = 'mr-home-head';
  header.innerHTML = `<h1 class="mr-logo"><span>MARVEL</span> <em>RUSH</em></h1>`;
  const content = document.createElement('div');
  content.className = 'mr-home-main';
  const urls: string[] = [];
  const deck = STARTER_DECKS.marvel;
  const tokens = deck.map((id, i) => {
    const u = URL.createObjectURL(new Blob([tokenSvg(id, 1, 'classique', { rarity: UNITS[id].rarity })], { type: 'image/svg+xml' }));
    urls.push(u);
    return `<img src="${u}" alt="${UNITS[id].name}" style="--i:${i}">`;
  }).join('');
  content.innerHTML = `
    <div class="mr-home-deck" aria-label="Ton deck">${tokens}</div>
    <p class="mr-home-mode">Solo Infini · Toits de New York</p>
    <button class="mr-btn yellow mr-play" data-a="play">Jouer</button>
    <button class="mr-btn mr-tuto" disabled>Tutoriel <small>bientôt</small></button>`;
  const footer = document.createElement('footer');
  footer.className = 'mr-home-foot';
  footer.textContent = 'Tiens le plus de vagues possible !';
  const view = createView({ header, content, footer });
  view.classList.add('mr-home');
  root.appendChild(view);
  content.querySelector('[data-a="play"]')!.addEventListener('click', o.onPlay);
  return () => { view.remove(); for (const u of urls) URL.revokeObjectURL(u); };
}
