// Premier lancement (§5.4, §6.1) : pseudo et avatar, puis deck de départ Marvel ou Disney.
// Le profil est créé dès la première étape ; s'il n'a pas encore de deck de départ, on reprend à la
// deuxième. Le choix du départ offre un lot de 10 tirages gratuits dans le pack de l'univers choisi.
import { STARTER_DECKS, UNITS } from '../data/units';
import type { UnitId } from '../data/types';
import { applyStarter, type Starter } from '../meta/decks';
import { emitMeta } from '../meta/events';
import { createProfile, getProfile, updateProfile } from '../meta/profile';
import { createView } from './view';
import { esc, portraitUrl, tokenUrl } from './kit';

const AVATARS: UnitId[] = [...STARTER_DECKS.marvel, ...STARTER_DECKS.disney];
const GUIDE: Record<Starter, UnitId> = { marvel: 'spiderman', disney: 'pocahontas' };

export function mountOnboarding(root: HTMLElement, o: { onDone: () => void; onCancel?: () => void }): () => void {
  const header = document.createElement('header');
  header.className = 'ob-head';
  const content = document.createElement('div');
  content.className = 'ob-main';
  const view = createView({ header, content });
  view.classList.add('ob');
  root.appendChild(view);

  function stepProfile(): void {
    let avatar: UnitId = AVATARS[0]!;
    header.innerHTML = `<h1 class="mr-logo ob-logo"><span>MARVEL</span> <em>RUSH</em></h1>`;
    content.innerHTML = `
      <div class="ob-card ob-enter">
        <h2>Crée ton profil</h2>
        <label class="ob-field"><span>Ton pseudo</span>
          <input data-tuto="ob-pseudo" maxlength="16" autocomplete="off" autocapitalize="words" spellcheck="false" placeholder="Pseudo" enterkeyhint="done"></label>
        <span class="ob-lbl">Ton avatar</span>
        <div class="ob-avatars">${AVATARS.map((id) => `<button class="ob-av${id === avatar ? ' on' : ''}" data-av="${id}" aria-label="${esc(UNITS[id].name)}"><img src="${portraitUrl(id)}" alt=""></button>`).join('')}</div>
        <p class="ob-avname">${esc(UNITS[avatar].name)}</p>
        <div class="ob-actions">
          ${o.onCancel ? '<button class="mr-btn" data-a="cancel">Retour</button>' : ''}
          <button class="mr-btn yellow" data-a="next" data-tuto="ob-next" disabled>Continuer</button>
        </div>
      </div>`;
    const input = content.querySelector<HTMLInputElement>('input')!;
    const next = content.querySelector<HTMLButtonElement>('[data-a="next"]')!;
    const avName = content.querySelector<HTMLElement>('.ob-avname')!;
    input.addEventListener('input', () => { next.disabled = input.value.trim().length < 2; });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); });
    content.querySelectorAll<HTMLButtonElement>('[data-av]').forEach((b) => b.addEventListener('click', () => {
      avatar = b.dataset['av'] as UnitId;
      content.querySelectorAll('.ob-av').forEach((x) => x.classList.toggle('on', x === b));
      avName.textContent = UNITS[avatar].name;
    }));
    content.querySelector('[data-a="cancel"]')?.addEventListener('click', () => o.onCancel?.());
    next.addEventListener('click', async () => {
      const name = input.value.trim().slice(0, 16);
      if (name.length < 2) return;
      next.disabled = true;
      try {
        const p = await createProfile(name, avatar);
        emitMeta('profileCreated', { id: p.id });
        stepStarter();
      } catch (err) {
        next.disabled = false;
        content.querySelector('.ob-card')!.insertAdjacentHTML('beforeend', `<p class="ob-err">${esc((err as Error).message)}</p>`);
      }
    });
  }

  function stepStarter(): void {
    const p = getProfile();
    header.innerHTML = `<h1 class="ob-title">Choisis ton équipe de départ</h1><p class="ob-sub">Bienvenue, <b>${esc(p?.name ?? '')}</b> ! Tu gardes ces 5 héros, et tu reçois <b>1 000 gemmes</b>, <b>2 000 or</b> et <b>10 tirages offerts</b>.</p>`;
    content.innerHTML = (['marvel', 'disney'] as Starter[]).map((s, i) => `
      <button class="ob-starter ${s} ob-enter" style="--d:${i * 90}ms" data-s="${s}" data-tuto="ob-starter-${s}">
        <span class="ob-st-name">${s === 'marvel' ? 'Marvel' : 'Disney'}</span>
        <span class="ob-st-guide"><img src="${portraitUrl(GUIDE[s])}" alt=""><em>${s === 'marvel' ? '« On y va, l’équipe ! »' : '« L’océan nous appelle ! »'}</em></span>
        <span class="ob-st-deck">${STARTER_DECKS[s].map((id, k) => `<img src="${tokenUrl(id)}" alt="${esc(UNITS[id].name)}" style="--k:${k}">`).join('')}</span>
        <span class="ob-st-names">${STARTER_DECKS[s].map((id) => esc(UNITS[id].name)).join(' · ')}</span>
      </button>`).join('');
    content.querySelectorAll<HTMLButtonElement>('[data-s]').forEach((b) => b.addEventListener('click', async () => {
      const s = b.dataset['s'] as Starter;
      b.classList.add('picked');
      content.querySelectorAll('[data-s]').forEach((x) => { if (x !== b) x.classList.add('dim'); });
      await updateProfile((q) => applyStarter(q, s));
      emitMeta('starterChosen', { starter: s });
      window.setTimeout(o.onDone, 380);
    }));
  }

  const p = getProfile();
  if (p && !p.starter) stepStarter(); else stepProfile();
  return () => view.remove();
}
