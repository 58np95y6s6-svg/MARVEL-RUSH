// Navigation par fragment d'URL.
//   (premier lancement)  création du profil puis deck de départ (src/ui/onboarding.ts)
//   #            accueil              ┐
//   #tirages     packs et ouverture   │ dans la coquille (en-tête + barre d'onglets, src/ui/shell.ts)
//   #collection  collection et deck   │
//   #decks       idem, deck en avant  │
//   #campagne[/<ch>[/<n>]]  campagne : chapitre, fiche de niveau ┘
//   #campagne/<ch>/<n>/jouer[/<vitesse>]  combat d'un niveau de campagne (plein écran)
//   #encyclopedie[/mechants|/heros/<id>|/mechant/<id>]  encyclopédie des héros et des méchants
//   #combat      combat Solo Infini (deck actif du profil, récompenses de fin)
//   #dev/fast    combat accéléré (×8 ; #dev/fast/16 pour ×16)
//   #dev/art     prévisualisation des personnages
//   #dev/maps    prévisualisation des maps
//   #dev/fx      revue des effets d'attaque et de compétence
import './base.css';
import './battle.css';
import { STARTER_DECKS } from '../data/units';
import { playerSetupFor } from '../meta/decks';
import { emitMeta } from '../meta/events';
import { activeDeck, getProfile, loadActiveProfile } from '../meta/profile';
import type { Shell, TabId } from './shell';

type Cleanup = () => void;
let cleanup: Cleanup | null = null;
let root: HTMLElement;
/** Écran Encyclopédie monté : ses sous-routes (onglet, fiche) le mettent à jour sans le remonter. */
let codex: { update(sub: string): void } | null = null;
/** Vrai si l'Encyclopédie a été ouverte depuis la coquille : son bouton retour revient en arrière. */
let codexFromHome = false;
/** Coquille (en-tête + onglets) montée : les onglets changent l'écran sans la remonter. */
let shell: Shell | null = null;
/** Création d'un deuxième profil demandée depuis la fiche Profil. */
let creatingProfile = false;

function go(hash: string): void {
  if (shell && hash.startsWith('#encyclopedie')) codexFromHome = true;
  if (location.hash === hash || (hash === '' && !location.hash)) void route();
  else location.hash = hash;
}

function teardown(): void {
  cleanup?.();
  cleanup = null;
  shell?.destroy();
  shell = null;
  root.innerHTML = '';
}

const SHELL_ROUTES: Record<string, TabId> = { '': 'accueil', tirages: 'tirages', collection: 'collection', decks: 'collection', campagne: 'campagne' };

async function route(): Promise<void> {
  const h = location.hash.replace(/^#/, '');
  if (h === 'encyclopedie' || h.startsWith('encyclopedie/')) {
    const sub = h.slice('encyclopedie'.length).replace(/^\//, '');
    if (codex) { codex.update(sub); return; }
    teardown();
    const { mountCodex } = await import('./codex');
    const c = mountCodex(root, {
      onHome: () => { if (codexFromHome) { codexFromHome = false; history.back(); } else go(''); },
    }, sub);
    codex = c;
    cleanup = () => { c.destroy(); codex = null; };
    emitMeta('screen', { route: 'encyclopedie' });
    return;
  }
  codexFromHome = false;
  // La clé d'accès (#k=…) a déjà été retirée par la porte d'entrée.
  if (h.startsWith('dev/art')) {
    teardown();
    const { mountArtPreview } = await import('../art/preview');
    unlockScroll(true);
    mountArtPreview(root);
    cleanup = () => unlockScroll(false);
    return;
  }
  if (h.startsWith('dev/maps')) {
    teardown();
    const { mountMapPreview } = await import('../maps/preview');
    unlockScroll(true);
    const stop = mountMapPreview(root);
    cleanup = () => { stop(); unlockScroll(false); };
    return;
  }
  if (h.startsWith('dev/fx')) {
    teardown();
    const { mountFxPreview } = await import('../render/fx/devPage');
    cleanup = mountFxPreview(root);
    return;
  }

  // Premier lancement : pas de profil, ou profil sans deck de départ.
  const p = getProfile();
  if (!p || !p.starter || creatingProfile) {
    teardown();
    const { mountOnboarding } = await import('./onboarding');
    cleanup = mountOnboarding(root, {
      onDone: () => { creatingProfile = false; go('#tirages'); },
      onCancel: creatingProfile && p?.starter ? () => { creatingProfile = false; void route(); } : undefined,
    });
    emitMeta('screen', { route: 'creation' });
    return;
  }

  if (h === 'combat' || h.startsWith('dev/fast')) {
    teardown();
    const m = /^dev\/fast\/?(\d+)?/.exec(h);
    const speed = m ? Number(m[1] ?? 8) : 1;
    const { mountBattle } = await import('./battle');
    const { showInfiniteRewards } = await import('./rewards');
    // Méta : deck actif du profil, avec ses niveaux, talents et éveils.
    const deck = activeDeck(p, STARTER_DECKS.marvel);
    const b = mountBattle(root, {
      deck,
      mapId: 'toits-new-york',
      speed,
      onHome: () => go(''),
      onReplay: () => void route(),
      config: { players: [{ id: 'p1', deck: deck.slice(), ...playerSetupFor(p, deck) }] },
      onEnd: (r) => {
        // Méta : récompenses du Solo Infini à la place de la fenêtre de fin par défaut.
        window.setTimeout(() => void showInfiniteRewards(root, { won: r.won, wave: r.wave, bossKills: r.bossKills }, {
          onReplay: () => void route(), onHome: () => go(''),
        }), 900);
        return true;
      },
    });
    cleanup = () => b.destroy();
    emitMeta('screen', { route: 'combat' });
    return;
  }

  // Campagne : combat d'un niveau, plein écran (#campagne/<chapitre>/<niveau>/jouer[/<vitesse de dev>]).
  const cm = /^campagne\/(\d+)\/(\d+)\/jouer(?:\/(\d+))?$/.exec(h);
  if (cm) {
    teardown();
    const ch = Number(cm[1]);
    const { mountCampaignBattle } = await import('./campaign');
    const stop = await mountCampaignBattle(root, `c${ch}-n${cm[2]}`, {
      speed: cm[3] ? Number(cm[3]) : 1,
      onExit: (c) => location.replace(`#campagne/${c}`),
      onReplay: () => void route(),
      onNext: (id) => { const [c, n] = id.slice(1).split('-n'); location.replace(`#campagne/${c}/${n}`); },
    });
    cleanup = stop;
    emitMeta('screen', { route: 'campagne-combat' });
    return;
  }

  const tab = SHELL_ROUTES[h] ?? (h.startsWith('campagne/') ? 'campagne' : 'accueil');
  if (!shell) {
    teardown();
    const { mountShell } = await import('./shell');
    const { openProfileSheet } = await import('./profileSheet');
    shell = mountShell(root, {
      go,
      onProfile: () => {
        if (!shell) return;
        void openProfileSheet(shell.overlay, {
          onNewProfile: () => { creatingProfile = true; void route(); },
          onSwitched: () => { teardown(); void route(); },
        });
      },
    });
  }
  const s = shell;
  const route_ = h in SHELL_ROUTES || tab === 'campagne' ? h : '';
  if (tab === 'tirages') {
    const { mountPulls } = await import('./pulls');
    s.show(tab, route_, (host) => mountPulls(host, { overlay: s.overlay, go }));
  } else if (tab === 'collection') {
    const { mountCollection } = await import('./collection');
    s.show(tab, route_, (host) => mountCollection(host, { overlay: s.overlay, go, focusDeck: h === 'decks' }));
  } else if (tab === 'campagne') {
    // Campagne : #campagne (chapitre courant), #campagne/<chapitre>, #campagne/<chapitre>/<niveau> (fiche ouverte).
    const [, chS, nS] = h.split('/');
    const { mountCampaign } = await import('./campaign');
    s.show(tab, route_, (host) => mountCampaign(host, {
      chapter: chS ? Number(chS) : undefined,
      openLevel: chS && nS ? `c${chS}-n${nS}` : undefined,
      overlay: s.overlay,
      onChapter: (n) => go(`#campagne/${n}`),
      onPlay: (id) => { const [c, n] = id.slice(1).split('-n'); go(`#campagne/${c}/${n}/jouer`); },
    }));
  } else {
    const { mountHome } = await import('./home');
    s.show(tab, route_, (host) => mountHome(host, { go, onInfinite: () => go('#combat') }));
  }
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
  void loadActiveProfile().catch(() => null).then(() => route());
}
