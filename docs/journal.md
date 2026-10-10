# Journal de développement — Marvel Rush

Tenu par le chef de projet. Suit l'organisation du §1 bis de `docs/prompt-jeu.md`.

## Contrats (étape 0)

| Contrat | Fichier | Utilisé par |
|---|---|---|
| Contenu (unités, boss, équipes, packs, talents) | `src/data/types.ts` | game design, moteur, méta, campagne, interface |
| Moteur ↔ reste du jeu (`GameConfig`, `EngineState`, `Command`, `EngineEvent`, `Engine`) | `src/engine/types.ts` | moteur, rendu, réseau, tutoriel, campagne |
| Maps | `src/maps/types.ts` | maps, rendu, moteur (longueur du chemin et modificateurs) |
| Réseau (`NetMessage`, `Transport`) | `src/net/protocol.ts` | réseau, backend |

Règles :
- Un agent ne modifie pas les contrats ni les dossiers d'un autre agent. Il demande au chef de projet.
- Le moteur est une simulation pure : aucun accès au DOM, au temps réel ni à `Math.random` (graine uniquement).

## Avancement

| Étape | État | Agents |
|---|---|---|
| 0. Contrats et mise en ligne | Fait | Chef de projet |
| 1. Moteur et Solo | Fait : combat Solo jouable sur les Toits de New York | Moteur, Game design, Direction artistique, Maps, Rendu |
| 2. Toutes les unités, boss et maps | À faire | |
| 3. Profils, sauvegarde, tutoriel, campagne | À faire | |
| 4. Méta-jeu | À faire | |
| 5. Coop à 2 | À faire | |
| 6. Duel à 2 | À faire | |
| 7. PWA, lien secret, mise en ligne | Partiellement (squelette PWA, accès, workflow) | |
| 8. Finitions | À faire | |

## Décisions

- Étape 0 : Vite 6, TypeScript strict, PixiJS 8, Vitest 3, vite-plugin-pwa 1. Interface en TypeScript sans framework.
- Le site est servi sous `/MARVEL-RUSH/` (GitHub Pages). La variable `VITE_BASE` permet de changer ce chemin.
- Sans le secret `VITE_ACCESS_KEY_HASH`, l'accès reste libre, pour que le premier déploiement soit visible. Dès que le secret est ajouté, la page neutre « 404 » s'affiche sans la clé.

## Publications programmées

Tâches automatiques créées à la demande du joueur. À minuit (heure de Paris), chacune **réveille la session cloud du chef de projet**, qui a le droit de pousser sur le dépôt. Un test à blanc du 09/10 a montré qu'une session neuve créée par une tâche programmée ne peut pas pousser (erreur 403). Elle fusionne la branche de l'extension dans `main`, vérifie les tests et le build, puis pousse, ce qui déclenche la mise en ligne. **Elle ne publie que si la ligne ci-dessous indique « prête à publier ».**

| Date (minuit, Paris) | Extension | Branche | État |
|---|---|---|---|
| Dimanche 18/10/2026 | DC Comics | `extension/dc` | prête à publier (vérifiée le 10/10, d36f950) |
| Dimanche 25/10/2026 | Transformers | `extension/transformers` | prête à publier (vérifiée le 10/10, 737619b) |
| Dimanche 01/11/2026 | Pixar | `extension/pixar` | prête à publier (vérifiée le 10/10, 5df0740) |

Quand une extension est terminée et vérifiée sur sa branche, passer son état à « prête à publier », dans ce fichier sur `main` **et** sur la branche de l'extension.

**Branches empilées (10/10)** : `extension/dc` contient `main` (Jouer à deux, équilibrage Rush Royale) ; `extension/transformers` contient `extension/dc` ; `extension/pixar` contient `extension/transformers`. Chaque publication est donc une fusion simple de la branche du jour dans `main`, à condition de les publier dans l'ordre (DC, puis Transformers, puis Pixar).

## Extension DC — branche `extension/dc`

Préparée dans un dossier de travail séparé, `/home/user/marvel-rush-dc`. Contenu : la liste de `docs/roadmap.md`, validée par le joueur le 09/10.
- Héros (15) : batman, superman, wonderwoman, flash, aquaman, greenlantern, cyborg, supergirl, shazam, robin, batgirl, catwoman, harley, martian, greenarrow.
- Gros boss (5) : joker, luthor, bane, sinestro, blackadam. Boss final : darkseid.
- Agents : DC Contenu et moteur, DC Dessins, DC Maps.
- Fusion de `main` le 10/10 (Coop, présence, équilibrage Rush Royale) : les héros DC jouent en Coop Infini et en Coop Niveaux (chapitres 1 à 6) ; les chapitres Coop DC restent dans `docs/campagne-coop.md` (non codés).

État : prête à publier (18/10).

## Extension Transformers — branche `extension/transformers`

Préparée dans un dossier de travail séparé, `/home/user/marvel-rush-tf`, à partir de `main` (sans l'extension DC). Contenu : la liste définitive de `docs/roadmap.md`.
- Héros (15) : optimus, bumblebee, ironhide, ratchet, jazz, arcee, grimlock, wheeljack, hotrod, elita, bulkhead, sideswipe, prowl, mirage, ultramagnus. Mécanique propre : transformation robot ↔ véhicule (`src/engine/transformers.ts`, commande `transform`).
- Gros boss (5) : starscream, soundwave, shockwave, devastator, blitzwing. Boss final : megatron (dans la rotation). Boss cosmique des modes infinis : unicron (vague 150).
- Chapitres 10 à 12 (numéros libres de toute collision avec DC 7 à 9) ; la campagne suit l'ordre des numéros installés.
- Fusion avec DC faite le 10/10 (la branche contient `extension/dc`, donc `main`) : `cyborg` dans l'équipe `machines` ; `BossPool` = `tous` | `marvel-disney` | `dc` | `transformers` ; chapitres 7 à 9 (DC) puis 10 à 12 (seuils 255, 285, 315 étoiles).
- Boss final des modes infinis (`finalBossAt`), par ordre de priorité quand deux paliers tombent sur la même vague : **Unicron (150, 300…) > Darkseid (100, 200…) > Thanos (50, 150…)**. Rotation `tous` : 50 Thanos, 100 Darkseid, 150 Unicron, 200 Darkseid, 250 Thanos, 300 Unicron ; `marvel-disney` : Thanos seul ; `dc` : Darkseid à chaque palier ; `transformers` : Unicron seul. En campagne, les boss finaux sont ceux des niveaux (Thanos 6-10, Darkseid 9-10, Megatron 12-10).

État : prête à publier (25/10).

## Extension Pixar — branche `extension/pixar`

Préparée dans un dossier de travail séparé, `/home/user/marvel-rush-pixar`, à partir de `main` (sans les extensions DC et Transformers). Contenu : la liste définitive de `docs/roadmap.md`.
- Héros (15) : mrincredible, elastigirl, frozone, violetflash, sullimike, mcqueen, carlrussell, joysadness, remy, walleeve, lucaalberto, mei, jessie, ianbarley, joe. Mécanique propre : le coup de duo (`duoEvery`, `src/engine/pixar.ts`), le partenaire frappe toutes les N attaques.
- Gros boss (5) : syndrome, randall, lotso, hopper (Le Borgne), muntz. Boss final : zurg (dans la rotation, « Je suis ton père » à 30 % de PV).
- Chapitres 13 à 15 (numéros libres de toute collision avec DC 7 à 9 et Transformers 10 à 12) ; la campagne suit l'ordre des numéros installés (écran Campagne générique, repris de la branche Transformers).
- Rotations de boss : `BossPool` = `tous` | `marvel-disney` | `pixar` ; les chapitres 1 à 6 jouent `marvel-disney`, les chapitres d'extension `tous`.
- Fusion avec Transformers et DC faite le 10/10 (la branche contient `extension/transformers`, donc DC et `main`) : `BossPool` = `tous` | `marvel-disney` | `dc` | `transformers` | `pixar` (rotation `tous` : 23 gros boss, Megatron et Zurg compris) ; chapitres 13 à 15 après le 12 (seuils 345, 375, 405 étoiles) ; tableaux `growth`, `EXT_ROWS`, `EXPECTED`, sections de `heroStats`, équipes et planches réunis.
- Boss finaux : en campagne, Zurg à la vague 200 (15-10). Modes infinis (`finalBossAt`) : Unicron (150) > Darkseid (100) > Thanos (50) en rotation `tous` ; rotation `pixar` : aucun boss final (Zurg est dans la rotation).
- Simulateur d'économie (`src/meta/economySim.ts`) : joue la campagne de base (chapitres 1 à 6) seulement ; avec les 150 niveaux des trois extensions, le ★5 d'un Rare tombait au jour 50 (garde-fou : 55 à 100), il revient au jour 84.

État : prête à publier (01/11).

