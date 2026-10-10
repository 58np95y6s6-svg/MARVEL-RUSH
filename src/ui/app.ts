// Navigation par fragment d'URL.
//   (premier lancement)  création du profil puis deck de départ (src/ui/onboarding.ts)
//   #            accueil              ┐
//   #tirages     packs et ouverture   │ dans la coquille (en-tête + barre d'onglets, src/ui/shell.ts)
//   #collection  collection et deck   │
//   #decks       idem, deck en avant  │
//   #quetes      quêtes du jour       │
//   #route       Route des récompenses│
//   #campagne[/<ch>[/<n>]]  campagne : chapitre, fiche de niveau ┘
//   #campagne/<ch>/<n>/jouer[/<vitesse>]  combat d'un niveau de campagne (plein écran)
//   #encyclopedie[/mechants|/heros/<id>|/mechant/<id>]  encyclopédie des héros et des méchants
//   #tutoriel    tutoriel guidé, partie 1 : combat scénarisé (src/tutorial/)
//   #coop        jouer à deux : invitation, salon (#coop/salon), combat (#coop/combat), code (#coop/rejoindre/<code>)
//   #combat      combat Solo Infini (deck actif du profil, récompenses de fin)
//   #reprendre   reprise de la partie Solo sauvegardée (campagne ou Solo Infini, src/meta/savegame.ts)
//   #dev/fast    combat accéléré (×8 ; #dev/fast/16 pour ×16)
//   #dev/art     prévisualisation des personnages
//   #dev/maps    prévisualisation des maps
//   #dev/fx      revue des effets d'attaque et de compétence
import './base.css';
import './battle.css';
import { STARTER_DECKS } from '../data/units';
import type { GameConfig } from '../engine/types';
import { playerSetupFor } from '../meta/decks';
import { emitMeta } from '../meta/events';
import { activeDeck, getProfile, loadActiveProfile } from '../meta/profile';
import { hashParams } from '../access/gate';
import type { Shell, TabId } from './shell';
import { afterOnboardingRoute, initTutorial, migrateTutorial, replayTutorial, wantsTutorialBattle } from '../tutorial';

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

const SHELL_ROUTES: Record<string, TabId> = {
  coop: 'accueil', 'coop/salon': 'accueil',
  '': 'accueil', tirages: 'tirages', collection: 'collection', decks: 'collection', campagne: 'campagne', quetes: 'accueil', route: 'accueil',
};

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
      onDone: () => { creatingProfile = false; go(afterOnboardingRoute()); },
      onCancel: creatingProfile && p?.starter ? () => { creatingProfile = false; void route(); } : undefined,
    });
    emitMeta('screen', { route: 'creation' });
    return;
  }

  // Tutoriel guidé (§5.0), partie 1 : combat scénarisé. Reprise à l'étape sauvegardée.
  await migrateTutorial();
  if (wantsTutorialBattle() || h === 'tutoriel') {
    if (!wantsTutorialBattle()) { location.replace('#'); return; }
    if (h !== 'tutoriel') { location.replace('#tutoriel'); return; }
    teardown();
    const { mountTutorialBattle } = await import('../tutorial/part1');
    cleanup = mountTutorialBattle(root, { onDone: () => go('#tirages'), onExit: () => void route() });
    emitMeta('screen', { route: 'tutoriel' });
    return;
  }

  // Reprise de la partie sauvegardée : la campagne rouvre son niveau, le Solo Infini son combat.
  if (h === 'reprendre') {
    const { currentSavedGame } = await import('../meta/savegame');
    const sg = currentSavedGame();
    if (!sg) { location.replace('#'); return; }
    if (sg.kind === 'campagne' && sg.levelId) {
      teardown();
      const ch = Number(/^c(\d+)/.exec(sg.levelId)?.[1] ?? 1);
      const { mountCampaignBattle } = await import('./campaign');
      cleanup = await mountCampaignBattle(root, sg.levelId, {
        resume: sg,
        onExit: (c) => location.replace(`#campagne/${c}`),
        onReplay: () => location.replace(`#campagne/${ch}/${sg.levelId!.split('-n')[1]}/jouer`),
        onNext: (id) => { const [c, n] = id.slice(1).split('-n'); location.replace(`#campagne/${c}/${n}`); },
      });
      emitMeta('screen', { route: 'campagne-combat' });
      return;
    }
  }

  if (h === 'combat' || h === 'reprendre' || h.startsWith('dev/fast')) {
    teardown();
    const m = /^dev\/fast\/?(\d+)?/.exec(h);
    const speed = m ? Number(m[1] ?? 8) : 1;
    const { clearSavedGame, currentSavedGame, saveGame } = await import('../meta/savegame');
    const resume = h === 'reprendre' ? currentSavedGame() : null;
    const { mountBattle } = await import('./battle');
    const { showInfiniteRewards } = await import('./rewards');
    // Méta : deck actif du profil, avec ses niveaux, talents et éveils.
    const deck = activeDeck(p, STARTER_DECKS.marvel);
    // Configuration complète (gardée telle quelle dans la sauvegarde pour la reprise).
    const cfg: GameConfig = resume ? resume.state.config : {
      mode: 'solo', seed: (Math.random() * 2 ** 31) >>> 0, mapId: 'toits-new-york', prepTime: 3,
      players: [{ id: 'p1', deck: deck.slice(), ...playerSetupFor(p, deck) }],
    };
    const b = mountBattle(root, {
      deck,
      mapId: 'toits-new-york',
      speed,
      onHome: () => go(''),
      onReplay: () => (h === 'reprendre' ? location.replace('#combat') : void route()),
      config: cfg,
      saved: resume?.state.engine,
      onWaveSave: speed === 1 ? (w, s) => { void saveGame('infini', undefined, cfg, s, w).catch(() => undefined); } : undefined,
      onEnd: (r) => {
        void clearSavedGame().catch(() => undefined);
        // Méta : récompenses du Solo Infini à la place de la fenêtre de fin par défaut.
        window.setTimeout(() => void showInfiniteRewards(root, { won: r.won, wave: r.wave, bossKills: r.bossKills, merges: r.merges, summons: r.summons }, {
          onReplay: () => void route(), onHome: () => go(''),
        }), 900);
        return true;
      },
    });
    cleanup = () => b.destroy();
    emitMeta('screen', { route: 'combat' });
    return;
  }

  // Coop : combat à deux, plein écran.
  if (h === 'coop/combat') {
    teardown();
    const { mountCoopBattle } = await import('./coop');
    cleanup = await mountCoopBattle(root, { go });
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
  if (h.startsWith('coop')) { void ensureCoop(); }
  if (!shell) {
    teardown();
    const { mountShell } = await import('./shell');
    const { openProfileSheet } = await import('./profileSheet');
    // Deux routes simultanées (ex. navigation du tutoriel) : une seule coquille.
    if (!shell) shell = mountShell(root, {
      go,
      onProfile: () => {
        if (!shell) return;
        void openProfileSheet(shell.overlay, {
          onNewProfile: () => { creatingProfile = true; void route(); },
          onSwitched: () => { teardown(); void route(); },
          onReplayTutorial: () => void replayTutorial(),
        });
      },
    });
  }
  const s = shell;
  const route_ = h in SHELL_ROUTES || tab === 'campagne' || h.startsWith('coop') ? h : '';
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
  } else if (h === 'coop' || h.startsWith('coop/')) {
    const { mountCoop, mountCoopLobby } = await import('./coop');
    const code = /^coop\/rejoindre\/([A-Za-z0-9]{6})$/.exec(h)?.[1];
    if (h === 'coop/salon') s.show(tab, h, (host) => mountCoopLobby(host, { go, overlay: s.overlay }));
    else s.show(tab, h, (host) => mountCoop(host, { go, overlay: s.overlay, joinCode: code?.toUpperCase() }));
  } else if (h === 'quetes') {
    const { mountQuests } = await import('./quests');
    s.show(tab, route_, (host) => mountQuests(host, { overlay: s.overlay, go }));
  } else if (h === 'route') {
    const { mountRoad } = await import('./road');
    s.show(tab, route_, (host) => mountRoad(host, { overlay: s.overlay, go }));
  } else {
    const { mountHome } = await import('./home');
    s.show(tab, route_, (host) => mountHome(host, { go, onInfinite: () => go('#combat'), overlay: s.overlay }));
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

/** Coop : présence du duo et invitations reçues, actives sur tous les écrans (après le profil). */
let coopReady: Promise<void> | null = null;
function ensureCoop(): Promise<void> {
  return (coopReady ??= (async () => {
    const [{ coopService }, { installInvitePopup }] = await Promise.all([import('../net/service'), import('./coop')]);
    installInvitePopup(go);
    await coopService.start().catch(() => undefined);
  })());
}

export function startApp(el: HTMLElement): void {
  root = el;
  // Lien d'invitation (secours) : #k=<clé>&room=<CODE> → écran Coop, connexion directe au salon.
  const roomCode = hashParams().get('room');
  if (roomCode && /^[A-Za-z0-9]{6}$/.test(roomCode)) history.replaceState(null, '', `#coop/rejoindre/${roomCode.toUpperCase()}`);
  window.addEventListener('hashchange', () => void route());
  initTutorial({ go });
  void loadActiveProfile().catch(() => null).then(() => { void ensureCoop(); return route(); });
}
