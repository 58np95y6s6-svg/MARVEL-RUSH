# Prompt de développement — Marvel Rush

> Copie tout ce qui suit dans un agent de code (Claude Code, Cursor…), idéalement ouvert dans le dépôt `MARVEL-RUSH`, qui contient les planches de personnages et le game design.

---

## 0. Ton rôle et l'objectif

Tu es un développeur de jeux web senior et le chef de projet. Tu construis **Marvel Rush**, un clone jouable du jeu mobile **Rush Royale** (tower defense avec fusion d'unités), avec :

- les personnages **Marvel** et **Disney** du dépôt, dans le style graphique de ses planches ;
- un système de **tirages** avec deux packs, **Marvel** et **Disney** ;
- un **mode Solo central** : une campagne qui fait progresser le compte et débloque des personnages et des talents (§5.1) ;
- une **Coop à deux** (vos deux chemins se rejoignent en un seul), en **niveaux à gagner** ou en **mode infini** avec des récompenses par palier, pour jouer ensemble quand on le décide. **Pas de mode Duel** : on ne joue jamais l'un contre l'autre ;
- **deux profils sauvegardés en ligne** (toi et ta partenaire) : chacun progresse de son côté, et les deux se retrouvent dans une partie commune (§5.4) ;
- des **maps par univers** et des **arènes de boss** (§7 bis) ;
- une **PWA** installable, accessible par un **lien secret** (usage privé entre deux personnes) ;
- un code **publié sur GitHub en dépôt public** et un jeu **déployé sur GitHub Pages**. Tu me fournis tous les liens (§12).

Tu pilotes une **équipe d’agents spécialisés** (§1 bis) : un agent par grosse tâche.

**Principe directeur : tout est calé sur Rush Royale**, qui est très bien fait. Quand ce prompt ne précise pas un détail, reproduis ce que fait Rush Royale, et ne réinvente rien. Cela vaut pour :
- la disposition de l'écran de combat : chemin en haut, grille au centre, bouton Invoquer en bas au centre avec son coût, mana à gauche, améliorations du deck en rangée sous la grille ;
- le geste de fusion (glisser une unité sur sa jumelle, les cases compatibles s'illuminent) ;
- le rythme des vagues, l'annonce et la barre du boss ;
- l'écran de fin de partie et ses récompenses ;
- la navigation par onglets en bas de l'écran (Boutique/Tirages, Collection/Deck, Combat au centre, Campagne, Profil) ;
- les coffres, les cartes, les montées de niveau et les talents.

L'agent **Game design** rédige `docs/reference-rush-royale.md`, qui liste les écrans, les gestes et les règles de Rush Royale à reproduire, et chaque agent s'y réfère.

Toute l'interface est **en français**. Le jeu est **mobile d'abord**, en portrait, et doit être fluide sur un iPhone ou un Android récent.

Usage strictement personnel : pas de monétisation, pas de vraie monnaie, pas d'indexation publique.

**Pensé pour durer.** Des **extensions** sont prévues après la version 1, chacune avec son pack, ses héros, ses méchants, ses maps et +30 niveaux de campagne : **DC Comics**, puis **Transformers**, puis **Pixar** (voir `docs/roadmap.md`). Tout le contenu est donc **piloté par les données** : packs, univers, unités, boss, maps, chapitres et paliers sont des listes, jamais codés en dur. L'interface affiche autant de packs et de chapitres qu'il y en a, et les sauvegardes sont versionnées avec une migration.

---

## 1. Sources à lire dans le dépôt avant de coder

| Fichier | Ce que tu en tires |
|---|---|
| `design/game-design.md` | Rôles, attaques, compétences, boss, sbires et bonus d'équipe. C'est la **source de vérité du gameplay**. |
| `design/planches/1-marvel-a.html` à `4-disney-b.html` | Le **code SVG de chaque personnage** : fonction `draw(ctx)`, 3 poses (repos, préparation, frappe), effets, palette. |
| `design/planches/5-boss-sbires.html` | Le code SVG des 6 boss et de leurs sbires, dans le traitement « méchant » (visage dans l'ombre, yeux lumineux). |
| `design/references/style-*.jpg` | Les références de style : chibi, contours épais, ombrage cel-shading, reflets brillants. |
| `design/references/ecrans/` | **Captures d'écrans de Rush Royale** (combat à deux plateaux, Donjons, Deck et Collection, plateau simple) et leur analyse dans `README.md` : **le modèle visuel de toute l'interface**. |
| `public/fiches/` | Les **illustrations de fiches** (art de comics réaliste) de 10 personnages, dont Thanos, **chiffrées**. Voir §6.5. |

**Réutilise le code de dessin des planches.** Ne redessine pas les personnages. Extrais les primitives (`shaded`, `limb`, `hand`, `glow`, `burst`, `beam`, `bolt`, `sparks`, `mandala`, `face`, `mirror`…) et les fonctions `draw` de chaque personnage dans un module `src/art/`. Ce module génère, pour chaque unité, une chaîne SVG par pose (0 repos, 1 préparation, 2 frappe), que tu convertis en textures au chargement.

---

## 1 bis. Organisation : une équipe d'agents spécialisés

Tu es l'**agent chef de projet**. Tu ne codes pas tout toi-même : pour chaque grosse tâche, tu **engages un sous-agent spécialisé** (outil Agent ou Task, ou une session séparée), avec une mission, des fichiers attribués et des critères de fin clairs.

Les agents travaillent **en parallèle** quand leurs tâches sont indépendantes, chacun dans son dossier ou sa branche (`git worktree` si possible). Tous partagent les **contrats** que tu fixes en premier :
- les types de données dans `src/data/` ;
- le protocole réseau dans `src/net/protocol.ts` ;
- l'interface moteur ↔ rendu (`EngineState`, `EngineEvent`, `Command`).

| Agent | Mission | Fichiers attribués | Livrable et critère de fin |
|---|---|---|---|
| **Chef de projet** (toi) | Découper le travail, fixer les contrats, lancer et relancer les agents, relire, fusionner et tenir le journal d'avancement | `docs/`, contrats, README | Chaque étape du §10 livrée, testée et commitée |
| **Game design et stratégie** | Règles de combat, chiffres des unités, pouvoirs des boss, courbe des vagues, bonus d'équipe, synergies, et un deck « méta » par pack | `src/data/*`, `docs/equilibrage.md` | Un simulateur headless qui joue 1 000 parties par deck et montre qu'aucun deck ne domine (écart de vague moyenne < 20 %) |
| **Direction artistique (personnages)** | Extraire le SVG des planches, générer les textures des 3 poses, les skins Hiver et Néon, les jetons de plateau et les effets | `src/art/` | Atlas de textures de toutes les unités et de tous les boss, plus une page de prévisualisation `/#dev/art` |
| **Maps et environnements** | Concevoir et dessiner les maps par univers et les arènes de boss (§7 bis) : chemins, décors, animations d'ambiance, transitions | `src/maps/`, `src/art/maps/` | 12 maps, 7 variantes et 6 arènes jouables, avec une page de prévisualisation `/#dev/maps` |
| **Moteur de jeu** | Simulation pure à pas fixe : plateau, invocation, fusion, mana, ciblage, compétences, vagues, boss, rng | `src/engine/` | Tests Vitest verts sur chaque règle et chaque compétence ; même graine = même partie |
| **Rendu et animations** | Scène PixiJS, interpolation, animations d'attaque, particules, chiffres de dégâts, tremblements d'écran | `src/render/` | 60 i/s avec 15 unités et 60 ennemis par plateau sur un téléphone moyen |
| **Réseau multijoueur** | PeerJS, salon, lien d'invitation, hôte qui fait autorité, instantanés, reconnexion | `src/net/` | Coop (niveaux et infini) jouable entre deux téléphones en 4G et en Wi-Fi ; test de déconnexion et reconnexion |
| **Méta et économie** | Collection, packs Marvel et Disney, taux, garantie, doublons, niveaux, **éveils et cristaux d'éveil**, skins, monnaies | `src/meta/` | Test de 100 000 tirages conforme aux taux |
| **Campagne et progression** | Les 6 chapitres et 60 niveaux, objectifs et étoiles, récompenses, talents (2 options × 3 paliers × 28 unités), niveau de compte, Solo Infini et records | `src/campaign/`, `src/data/talents.ts` | Campagne jouable de bout en bout ; un nouveau profil débloque un personnage en moins de 20 min de jeu |
| **Backend, profils et sauvegarde** | Supabase : profils, code de récupération, liaison du duo, présence, invitations, sauvegarde local d'abord avec synchronisation, parties en cours, règles RLS | `src/cloud/`, `supabase/` | Deux profils sur deux téléphones gardent chacun leur progression ; une partie Coop arrêtée reprend plus tard ; mode avion puis resynchronisation sans perte |
| **Interface et expérience** | Tous les écrans HTML/CSS, navigation par onglets façon Rush Royale, animation d'ouverture des packs, accessibilité, lisibilité à 375 px | `src/ui/` | Parcours complet sans blocage, de l'accueil à la fin de partie |
| **Tutoriel et prise en main** | Tutoriel guidé du §5.0 : scénario, main animée, assombrissement, bulles du guide, combat scénarisé, astuces contextuelles, sauvegarde par étape | `src/tutorial/` | Un joueur qui n'a jamais vu Rush Royale finit le tutoriel seul en moins de 4 minutes ; reprise à la bonne étape après fermeture |
| **Audio** | Effets WebAudio (invocation, fusion, coups, boss) et une ambiance musicale par univers | `src/audio/` | Sons sur chaque événement clé, bouton muet persistant |
| **PWA, déploiement et accès** | Manifest, icônes, service worker, lien secret, `noindex`, dépôt GitHub public, GitHub Actions et GitHub Pages, secrets | `src/pwa/`, `src/access/`, `.github/workflows/` | Installation sur iOS et Android, Solo hors ligne, page neutre sans la clé, déploiement automatique à chaque push, aucun secret dans le dépôt |
| **Qualité (QA)** | Relire chaque livraison, écrire les tests de bout en bout (Playwright), tester sur mobile, ouvrir les bugs aux bons agents | `tests/`, `e2e/` | Les critères d'acceptation du §11 passent tous |

Règles de travail :
- **Brief.** Chaque brief d'agent contient : la mission, les fichiers attribués, les contrats à respecter, les sections de ce prompt à lire, le critère de fin et le format du compte rendu (5 lignes maximum, plus les limites connues).
- **Contrats.** Un agent ne modifie pas les fichiers d'un autre. S'il a besoin d'un changement de contrat, il te le demande.
- **Relecture.** Après chaque livraison, l'agent QA relit et teste avant que tu fusionnes.
- **Journal.** Tiens `docs/journal.md` à jour : qui fait quoi, l'état de chaque agent, les décisions prises.

---

## 2. Stack technique imposée

- **Vite + TypeScript** (mode strict).
- **PixiJS v8** pour le plateau de jeu (canvas WebGL). Le reste de l'interface (menus, collection, tirages) est en HTML/CSS, avec Preact ou Vanilla TS.
- **Moteur de simulation pur TypeScript**, totalement séparé du rendu : il tourne à pas de temps fixe (20 ticks/s), sans accès au DOM. Il prend des **commandes** en entrée et produit un **état** et des **événements** en sortie. Il utilise un générateur aléatoire à **graine** (par exemple mulberry32).
- **Réseau : PeerJS** (WebRTC DataChannel, P2P, sans serveur de jeu). Isole-le derrière une interface `Transport` pour pouvoir le remplacer par Supabase Realtime si le P2P échoue sur certains réseaux.
- **PWA** : `vite-plugin-pwa` (manifest et service worker). Le mode Solo doit marcher hors ligne.
- **Sauvegarde en ligne et présence : Supabase** (offre gratuite) :
  - authentification anonyme et code de récupération ;
  - une table `profiles` (progression complète en JSON, avec version et date de mise à jour) ;
  - une table `saved_games` (parties en cours) ;
  - Realtime Presence pour savoir si l'autre joueur est en ligne et l'inviter.
  - Les clés publiques Supabase passent par des variables d'environnement (secrets GitHub Actions), jamais en dur dans le code.
- **Stockage local** : IndexedDB (via `idb-keyval`) en **local d'abord** : le jeu marche hors ligne et se synchronise avec Supabase dès que le réseau revient. En cas de conflit, la version la plus récente l'emporte, avec une fusion par champ pour la collection (on ne perd jamais une unité obtenue).
- **Code et hébergement** :
  - code dans un **dépôt GitHub public** ;
  - déploiement automatique sur **GitHub Pages** par GitHub Actions à chaque push sur `main` ;
  - script SQL de création des tables Supabase versionné dans `supabase/`.
- **Tests** : Vitest sur le moteur (fusion, mana, tirages, compétences, synchronisation).

---

## 3. Accès par lien secret

- Le site n'affiche le jeu que si l'URL contient la bonne clé : `https://<site>/#k=<CLE_SECRETE>`.
- La clé est définie au build (`VITE_ACCESS_KEY_HASH` = hash SHA-256 de la clé). Au chargement, l'app hache la clé de l'URL et la compare. Si elle est bonne, elle mémorise l'accès (IndexedDB) et retire la clé de la barre d'adresse.
- Sans la clé : une page neutre « Page introuvable », sans aucune mention du jeu.
- Ajoute `<meta name="robots" content="noindex,nofollow">` et un `robots.txt` qui interdit tout.
- Documente dans le README comment générer une clé et le lien à envoyer.
- Ce n'est pas une vraie sécurité, seulement une discrétion suffisante pour un usage privé. Dis-le dans le README.
- Comme le **dépôt est public**, la clé elle-même ne doit **jamais** apparaître dans le code ni dans l'historique git : seul son hash, injecté par un secret GitHub Actions au build. Les données Supabase sont protégées par des règles RLS : chaque profil ne lit et n'écrit que ses propres données, et une partie commune n'est accessible qu'à ses deux joueurs.

---

## 4. Règles de combat (copie de Rush Royale)

### 4.1 Plateau
- Chaque joueur a une grille de **3 lignes × 5 colonnes** (15 cases).
- Les ennemis suivent un **chemin** qui longe le plateau.
- **Portées d'attaque (choix du joueur, différent de Rush Royale)** : chaque unité a une zone de touche. **La place d'une unité sur la grille devient stratégique.**
  - **Globale** : tout le chemin (tireurs : Iron Man, Œil de faucon, Rebelle, Captain Marvel, Falcon…).
  - **Longue** (≈ 3,4 cases), **moyenne** (≈ 2,4 cases) et **courte** (≈ 1,6 case, corps à corps : Hulk, Venom, Mulan, Rox & Rouky, Vanellope & Ralph, Shang-Chi…).
  - La portée se mesure depuis le centre de la case de l'unité jusqu'à l'ennemi, en cases. Une unité ne vise que les ennemis dans sa zone ; le ciblage (premier, aléatoire, fort) s'applique ensuite.
  - Plus la portée est courte, plus l'unité frappe fort : les valeurs sont équilibrées au simulateur.
  - **Garder le doigt appuyé sur une unité** affiche sa zone de touche, en surlignant la partie du chemin couverte. Pendant le glisser d'une fusion, la zone de la case visée s'affiche aussi. Une pression courte ouvre la fiche.
  - Le tutoriel l'explique avec une astuce dès la première unité à courte portée.
- **3 vies** par joueur. Un ennemi normal qui atteint la fin du chemin retire 1 vie. Un boss qui l'atteint retire toutes les vies.

### 4.2 Mana, invocation, fusion, amélioration
- La partie commence avec **100 de mana**. Chaque ennemi tué rapporte du mana : 10 pour un ennemi normal, 30 pour un gros, 100 pour un boss.
- **Invoquer** pose une unité **aléatoire de ton deck**, au **rang 1**, sur une **case vide aléatoire**. Le coût commence à **10** et augmente de **10** à chaque invocation.
- **Fusionner** : faire glisser une unité sur une unité **identique de même rang** donne une unité **aléatoire du deck** au **rang +1**, sur la case de destination. Le rang maximal est **7**, affiché par des pastilles (points) sur l'unité.
- **Améliorer en partie** : chaque unité du deck a un bouton d'amélioration (niveaux 1 à 5, coûts 100 / 200 / 400 / 700). Chaque niveau donne **+15 % de dégâts** à toutes les unités de ce type sur le plateau.
- **Effet du rang** : dégâts × rang. Certaines compétences progressent aussi avec le rang (voir le tableau).

### 4.3 Vagues
- Une vague dure **30 s**, pendant lesquelles des ennemis apparaissent.
- **Rythme des boss** (choix du joueur, à respecter partout) :
  - **un petit boss toutes les 5 vagues** (vagues 5, 15, 25…) ;
  - **un gros boss toutes les 10 vagues** (vagues 10, 20, 30…) ;
  - **Thanos** à la vague 50 en mode infini, puis toutes les 50 vagues, et au dernier niveau de la campagne.
- Pendant un boss, les apparitions s'arrêtent ; la vague suivante commence quand le boss est vaincu.
- PV des ennemis : `100 × 1,18^(vague-1)`. PV d'un petit boss : `12 × PV d'un ennemi normal`. PV d'un gros boss : `25 ×`.
- Types d'ennemis :
  - **normal** ;
  - **rapide** : vitesse ×2, PV ×0,5 ;
  - **gros** : vitesse ×0,6, PV ×3 ;
  - **blindé** : armure 30 % ;
  - **bouclier** : absorbe les 5 premiers coups.
- Les **sbires** du prochain gros boss se mêlent aux ennemis des 2 vagues qui le précèdent, avec leurs particularités (voir `game-design.md`).

### 4.4 Boss

**Petits boss (toutes les 5 vagues)** : c'est le **lieutenant** du prochain gros boss, un de ses sbires en version géante (taille ×2), avec une version affaiblie du pouvoir de son maître toutes les 10 s. Par exemple, avant Jafar, un cobra géant qui hypnotise 1 unité pendant 2 s. Ils annoncent le gros boss qui suit : « Le maître arrive dans 5 vagues ».

**Gros boss (toutes les 10 vagues)** : six boss en rotation aléatoire, sans répétition avant que les six soient passés. Chacun applique son **pouvoir toutes les 6 s** tant qu'il est en vie :

| Boss | Pouvoir |
|---|---|
| Jafar & Iago | Hypnose : 1 à 2 unités cessent d'attaquer pendant 4 s |
| Cruella | Vol de manteau : une unité perd 1 rang |
| Ursula | Contrat : échange la position de 2 unités, ce qui casse les combos d'adjacence |
| Maléfique | Sommeil maudit : endort une ligne entière pendant 3 s |
| Galactus | Dévoreur : détruit une unité aléatoire de rang ≤ 3 |
| Bouffon Vert | Bombes citrouilles : étourdit 3 unités pendant 2 s |

**Thanos, boss final** (hors rotation) :
- Il arrive au **dernier niveau de la campagne** (chapitre 6, niveau 10) et à la **vague 50** des modes infinis (puis toutes les 50 vagues).
- PV ×2 par rapport aux autres boss.
- **Gant de l'infini** : toutes les 8 s, il utilise le pouvoir d'une Pierre au hasard, annoncé par la couleur de la Pierre :
  - Puissance (violet) : étourdit 3 unités pendant 2 s ;
  - Espace (bleu) : échange 2 unités ;
  - Réalité (rouge) : transforme une unité en une autre unité du deck, au même rang ;
  - Âme (orange) : vole 20 % du mana ;
  - Temps (vert) : soigne Thanos de 5 % ;
  - Esprit (jaune) : hypnotise 2 unités pendant 4 s.
- **Claquement de doigts**, une fois, à 30 % de PV : fond blanc, silence d'une seconde, puis 3 unités au hasard perdent la moitié de leurs rangs (minimum 1).
- **Sbires** : les Outriders, très rapides, en meute.
- **Arène** : Titan, planète en ruines au ciel orange, avec les six Pierres qui brillent en fond.

Si le boss n'est pas tué en **45 s**, il passe en **rage** : vitesse ×2.

### 4.5 Données des unités

Le **niveau de collection** (permanent, de 1 à 10) donne **+10 % de dégâts par niveau**.

Ciblage :
- **premier** : l'ennemi le plus avancé sur le chemin ;
- **aléatoire** : un ennemi au hasard ;
- **fort** : l'ennemi qui a le plus de PV.

| id | Unité | Pack | Rareté | Ciblage | Dégâts | Cadence (s) | Compétence (paramètres de départ) |
|---|---|---|---|---|---|---|---|
| ironman | Iron Man | Marvel | Légendaire | premier | 30 | 0,8 | Uni-Beam toutes les 10 s : 200 % de dégâts à tous les ennemis d'une ligne du chemin |
| spiderman | Spider-Man | Marvel | Épique | premier | 10 | 0,5 | Ralentit de 10 % par coup, cumulable 3 fois ; à 3 cumuls, immobilise 1 s |
| hulk | Hulk | Marvel | Légendaire | premier | 60 | 1,6 | Éclaboussure de 40 % autour de la cible ; Rage +5 % de dégâts par coup (max +50 %) ; tous les 8 coups, Smash étourdit tous les ennemis proches 1 s |
| thor | Thor | Marvel | Légendaire | aléatoire | 25 | 1,0 | Éclair en chaîne sur 3 ennemis, +1 rebond tous les 2 rangs (max 5), −20 % de dégâts par rebond |
| strange | Doctor Strange | Marvel | Épique | premier | 15 | 1,0 | Portail toutes les 12 s : renvoie l'ennemi de tête au début du chemin (sauf boss) |
| venom | Venom | Marvel | Épique | premier | 35 | 1,0 | Exécute un ennemi sous 15 % de PV (sauf boss) ; +2 % de dégâts par élimination (max +40 %) |
| cmarvel | Captain Marvel | Marvel | Rare | fort | 25 | 0,9 | Après 10 attaques, mode binaire : dégâts ×2 pendant 5 s |
| cap | Captain America | Marvel | Légendaire | premier | 20 | 1,0 | Bouclier qui rebondit sur 3 ennemis ; aura de +15 % de vitesse d'attaque aux unités adjacentes |
| loki | Loki | Marvel | Épique | aléatoire | 18 | 0,8 | Toutes les 15 s, se transforme en une autre unité du deck pendant 10 s (même rang) ; 10 % de chance de faire reculer l'ennemi touché pendant 2 s |
| bucky | Soldat de l'hiver | Marvel | Épique | fort | 30 | 1,2 | Une attaque sur 4 est un critique ×3 qui étourdit 0,5 s |
| hawkeye | Œil de faucon | Marvel | Rare | premier | 18 | 0,7 | Alterne les flèches : explosive (éclaboussure 50 %), glace (ralentit de 25 % pendant 2 s), électrique (chaîne sur 2 ennemis) |
| falcon | Falcon | Marvel | Rare | fort | 15 | 0,6 | Redwing marque l'ennemi le plus fort toutes les 6 s : +25 % de dégâts subis pendant 4 s |
| widow | Black Widow | Marvel | Épique | premier | 14 | 0,5 | Un coup sur 5 paralyse 1 s ; dégâts ×2 contre les boss |
| shangchi | Shang-Chi | Marvel | Épique | aléatoire | 12 | 0,4 | Tous les 10 coups, 10 anneaux frappent 10 ennemis aléatoires à 100 % |
| moana | Vaïana & Pua | Disney | Épique | premier | 15 | 1,0 | Vague toutes les 10 s : repousse de 1,5 case les ennemis de tête (sauf boss) |
| maui | Maui | Disney | Légendaire | premier | 40 | 1,2 | Alterne toutes les 8 s : faucon (cadence ×2, dégâts ×0,5) ou requin (dégâts ×2,5 avec éclaboussure) |
| pocahontas | Pocahontas & Meeko | Disney | Rare | aléatoire | 10 | 0,8 | +10 % de vitesse d'attaque aux unités adjacentes (+5 % par rang) ; Meeko : 5 % de chance de +5 de mana par élimination |
| mulan | Mulan & Mushu | Disney | Légendaire | premier | 30 | 1,0 | Brûlure : 20 % des dégâts par seconde pendant 3 s ; une fois par vague, Avalanche : 300 % de dégâts à tous les ennemis |
| merida | Rebelle | Disney | Rare | premier | 22 | 0,9 | 100 % de critiques ×2 sur l'ennemi le plus avancé |
| ariel | Ariel & Sébastien | Disney | Épique | premier | 10 | 0,9 | Chant toutes les 8 s : arrête 3 ennemis pendant 1,5 s ; Sébastien : saignement de 5 % par seconde |
| foxhound | Rox & Rouky | Disney | Rare | premier | 14 | 0,6 | Double attaque ; le second coup fait +50 % si le premier a touché la même cible |
| tiana | Tiana & Naveen | Disney | Rare | aléatoire | 8 | 1,0 | +10 de mana au début de chaque vague (+5 par rang) ; toutes les 12 s, la langue tire un ennemi 1 case en arrière |
| nemo | Nemo & Dory | Disney | Rare | aléatoire | 14 | 0,7 | Effet aléatoire à chaque tir : ralentissement, dégâts ×2, poison, ou +20 % de cadence à une unité alliée au hasard |
| coco | Coco (Miguel) | Disney | Épique | aléatoire | 10 | 1,0 | Remember Me : une fois par vague, restaure une unité détruite ou rétrogradée par un boss ; +5 % de dégâts aux unités adjacentes |
| nickjudy | Nick & Judy | Disney | Épique | premier | 16 | 0,8 | Judy arrête l'ennemi le plus fort (sauf boss) pendant 2 s toutes les 6 s ; les coups de Nick réduisent l'armure de 20 % |
| buzzwoody | Buzz & Woody | Disney | Légendaire | premier | 22 | 0,8 | Le laser transperce toute la ligne ; toutes les 10 s, le lasso ramène l'ennemi de tête 2 cases en arrière |
| rapunzel | Raiponce & Pascal | Disney | Épique | aléatoire | 12 | 1,0 | Retire les effets de boss (sommeil, hypnose, étourdissement) des unités adjacentes et leur donne +15 % de dégâts ; Pascal la rend insensible aux pouvoirs des boss |
| vanralph | Vanellope & Ralph | Disney | Légendaire | premier | 45 | 1,4 | Ralph détruit les boucliers et fait +100 % contre les blindés ; toutes les 12 s, Vanellope se téléporte sur une autre case et donne +20 % de cadence à ses voisines pendant 5 s |

Mets ces données dans `src/data/units.ts`, typées. Les valeurs sont un premier jet : expose-les dans un seul fichier pour les équilibrer facilement.

### 4.6 Bonus d'équipe
Le bonus s'active si le **deck** contient l'équipe complète. Liste complète dans `design/game-design.md` : Avengers 3 et 5, Asgard, Les Agents, Arcanes, Les Ailes, Océan, Princesses, Duos Pixar, Animaux. Affiche les bonus actifs pendant la composition du deck et en partie (petites icônes).

---

## 5. Modes de jeu

### 5.0 Tutoriel guidé (premier lancement)

Comme dans Rush Royale, le joueur ne lit rien : il **apprend en jouant**, avec une main animée qui montre quoi toucher, un **assombrissement** de tout le reste de l'écran et des **bulles courtes** dites par un personnage guide (Spider-Man pour le pack Marvel, Vaïana pour le pack Disney, selon le deck de départ choisi). Pendant une étape, seule l'action demandée est possible.

**Partie 1 — Premier combat (scénarisé, impossible à perdre)**
1. « Des ennemis arrivent ! Touche **Invoquer**. » Une unité apparaît. Les ennemis sont très faibles et le mana est fourni.
2. Le joueur invoque encore jusqu'à avoir **deux unités identiques**. Le tirage est truqué pour que ça arrive vite.
3. « Fais glisser une unité sur sa **jumelle** pour les **fusionner**. » La main montre le geste et les cases compatibles brillent. On voit le rang passer à 2 pastilles et la nouvelle unité aléatoire.
4. « Les unités plus fortes ont **plus de pastilles**. » Une deuxième fusion est guidée.
5. « Touche le bouton d'**amélioration** sous la grille : toutes les unités de ce type deviennent plus fortes. »
6. « Un **boss** arrive ! » Annonce plein écran, puis un boss faible avec un pouvoir montré au ralenti et expliqué en une phrase.
7. Victoire : l'écran de fin explique les **éclats** et l'**XP**.

**Partie 2 — Le méta-jeu, guidé dans les menus**
8. « Ouvre ton **premier pack** » : un tirage gratuit garanti Épique, avec l'animation complète.
9. « Mets ta nouvelle unité dans ton **deck** » : glisser-déposer guidé, explication du bonus d'équipe s'il y en a un.
10. « Lance le **niveau 1** de la campagne » : premier vrai niveau, avec juste des rappels discrets (« Pense à fusionner ! » si le plateau est plein).

**Plus tard, des astuces au bon moment** (une seule fois chacune), comme dans Rush Royale :
- le ciblage des unités (premier, aléatoire, fort), quand on obtient une unité « fort » ;
- les talents, à la première unité niveau 5 ;
- les bonus d'équipe, quand une équipe est presque complète ;
- les pouvoirs de chaque boss, à sa première apparition ;
- « Jouer à deux », quand on atteint le niveau de compte 3.

**Règles**
- Le tutoriel est **sauvegardé étape par étape** : si on ferme l'app, on reprend à la même étape.
- Il propose « **Passer le tutoriel** » (avec confirmation dans la page) et « **Revoir le tutoriel** » dans les Réglages.
- La partenaire suit **le même tutoriel** à la création de son profil. « Jouer à deux » ne s'ouvre qu'après la partie 1, ou en rejoignant une invitation (avec un mini-tutoriel de 3 bulles sur la Coop).
- Durée visée : **moins de 4 minutes** pour les parties 1 et 2.

### 5.1 Solo — le cœur de la progression

Le Solo est le **mode principal** : c'est là que chaque joueur avance à son rythme, de son côté, et débloque l'essentiel du contenu. Il marche **hors ligne** et se synchronise ensuite.

**Campagne**
- **6 chapitres**, un par grande zone : New York, Asgard et le Sanctum, l'Océan (Motunui et Atlantica), l'Empire (Palais impérial et Zootopie), le Monde des jouets (Chambre d'Andy et Sugar Rush), le Royaume des morts.
- Chaque chapitre compte **10 niveaux** sur les maps de sa zone. Le niveau 5 est un **mini-boss** (un sbire géant), le niveau 10 un **boss** dans son arène.
- **Objectif de chaque niveau** : tenir un nombre de vagues fixé, plus une **contrainte bonus** pour la 3e étoile (« sans perdre de vie », « avec au moins 2 unités Disney », « boss tué en moins de 30 s »…).
- **1 à 3 étoiles** par niveau. Les étoiles ouvrent les chapitres suivants et les coffres d'étoiles.

**Ce que le Solo débloque**
- **Personnages** : chaque chapitre terminé offre un personnage garanti de sa zone, en plus des tirages. Exemple : finir « Océan » donne Vaïana & Pua.
- **Talents** (compétences avancées, comme dans Rush Royale) : chaque unité a **3 paliers de talents**, aux niveaux 5, 7 et 9. À chaque palier, on choisit **1 talent parmi 2**. Exemples :
  - Thor : « Éclair +2 rebonds » ou « Étourdit 0,3 s » ;
  - Hulk : « Smash tous les 6 coups » ou « Rage max +80 % ».

  Les paliers se débloquent avec des **parchemins de talent** gagnés en campagne. L'agent game design écrit les 2 options de chaque palier pour les 28 unités.
- **Niveau de compte** (XP gagnée dans tous les modes) : il débloque les maps, les emplacements de deck (jusqu'à 3), le coffre quotidien et les cadres de profil.
- **Éclats** pour les tirages, et cartes d'unités en récompense.

**Solo Infini**
- Il se débloque après le chapitre 1 de la campagne. Seul, on tient le plus de vagues possible : un petit boss toutes les 5 vagues, un gros toutes les 10, Thanos à la 50.
- **Récompenses par palier atteint**, comme en Coop Infini (§5.2), mais en version solo : bronze à 10, argent à 20, or à 30, héroïque à 40, légendaire à 50 (Thanos vaincu), puis +300 éclats et 1 parchemin tous les 10. C'est la **principale source de cristaux d'éveil** (§6.6).
- **Record personnel** sauvegardé, et un **classement à deux** (ton record contre celui de ta partenaire).
- Une partie se met en pause et se reprend plus tard (sauvegarde à chaque vague).

**Sauvegarde des parties en cours**
- Une partie Solo est **sauvegardée automatiquement à chaque vague**.
- Si on ferme l'app, on reprend exactement là où on en était, sur n'importe quel appareil connecté au même profil.

### 5.2 Coop à deux : les chemins se rejoignent

Il n'y a **que deux façons de jouer** : seul (Solo, §5.1) ou à deux en Coop. **Pas de Duel.**

**Le plateau Coop**
- **Deux plateaux** : le tien en bas, celui de ta partenaire en haut.
- **Deux chemins qui se rejoignent.** Les ennemis entrent par deux portails, un de chaque côté, et chaque flot longe d'abord le plateau d'un joueur. Les deux chemins **se rejoignent ensuite au centre** en un seul chemin commun qui mène à la porte du château.
- **Toutes les unités des deux joueurs** peuvent toucher n'importe quel ennemi, sur les deux branches et sur le tronc commun. Il faut donc s'entraider.
- **Vies partagées** (3). Le mana est individuel, et celui des éliminations va au joueur qui a donné le coup final.
- Les petits et les gros boss arrivent **par le tronc commun**. Leurs pouvoirs visent un plateau au hasard.
- **Offrir une unité** : un bouton envoie une unité de ton plateau sur une case vide du plateau de ta partenaire, une fois par vague.

**Coop — Niveaux à gagner**
- Une **campagne à deux** de 6 chapitres × 10 niveaux, sur les mêmes maps que le Solo, avec des vagues plus nombreuses et plus fortes.
- Chaque niveau se gagne en tenant un nombre de vagues fixé, avec 1 à 3 étoiles **communes** au duo.
- Les récompenses vont **à chacun**, sur son propre profil.
- La progression Coop est **propre au duo** (enregistrée sur les deux profils liés). Un chapitre Coop s'ouvre quand les deux joueurs ont fini le chapitre Solo correspondant.

**Coop — Infini**
- On tient le plus de vagues possible, avec un petit boss toutes les 5 vagues, un gros toutes les 10 et Thanos à la 50.
- **Récompenses par palier atteint**, données à chacun à la fin de la partie. Chaque coffre de palier se gagne **une fois par jour et par mode** ; au-delà, seuls les éclats par vague comptent (contre l'inflation, voir `docs/equilibrage.md`).

| Palier | Récompense (pour chacun) |
|---|---|
| Vague 10 | coffre bronze : 150 éclats, 10 cartes |
| Vague 20 | coffre argent : 300 éclats, 1 parchemin de talent, 20 cartes |
| Vague 30 | coffre or : 500 éclats, 2 parchemins, 1 carte Épique garantie |
| Vague 40 | coffre héroïque : 800 éclats, 3 parchemins, 1 skin au hasard |
| Vague 50 (Thanos vaincu) | coffre légendaire : 1 500 éclats, 1 Légendaire garanti, cadre de profil « Vainqueur de Thanos » |
| Ensuite, tous les 10 | +300 éclats et 1 parchemin |

- **Record du duo** affiché sur l'écran Coop, et historique des meilleures parties.
- Une partie infinie se **met en pause et se reprend** plus tard, à deux (§5.4).

### 5.4 Deux profils : jouer chacun de son côté ou ensemble

- **Deux profils**, un par joueur. Au premier lancement, chacun crée le sien : pseudo et avatar (un personnage possédé). L'app affiche un **code de récupération** (12 caractères) pour retrouver le profil sur un autre appareil.
- **Chacun sa progression** : campagne, collection, niveaux, talents, éclats, decks et records sont propres à chaque profil et **sauvegardés en ligne** (§2). Jouer seul ne touche jamais à la progression de l'autre.
- **Lier les deux profils** : dans « Mon duo », un joueur génère un code ou un lien de liaison et l'autre l'accepte. Les profils deviennent **partenaires**.
- **Jouer ensemble quand on le décide** :
  - **Présence** : on voit si sa partenaire est en ligne et ce qu'elle fait (« en campagne, chapitre 3 », « dans les tirages »…).
  - Le bouton **« Inviter à jouer »** choisit le mode (Coop Niveaux ou Coop Infini) et le niveau ou la map, puis envoie l'invitation, qui s'affiche chez l'autre. Si elle est hors ligne, l'invitation attend et une notification PWA est envoyée si elle l'a autorisée.
  - Le **lien d'invitation** du §5.5 reste disponible en secours.
- **Une partie commune profite aux deux** : chaque joueur gagne son XP, ses éclats et ses récompenses sur son propre profil. Les cartes ne s'échangent pas, mais on peut offrir une unité *pendant* la partie (Coop).
- **Parties communes sauvegardées** : l'hôte enregistre l'état complet de la partie Coop à chaque vague dans `saved_games`. Les deux joueurs peuvent **arrêter et reprendre plus tard** depuis « Parties en cours ».
- **Historique à deux** : les dernières parties communes (mode, map, vague atteinte, vainqueur) et le score du duo (étoiles Coop, record en Coop Infini).

### 5.5 Architecture du multijoueur
- **L'hôte fait autorité** : le joueur qui crée la partie fait tourner le moteur complet (les deux plateaux et le chemin).
- L'invité envoie seulement des **commandes** (`summon`, `merge {from,to}`, `powerup {unitId}`, `gift {slot}`, `emote`).
- L'hôte diffuse un **instantané compact** de l'état 10 fois par seconde, plus les **événements** (coups, éliminations, pouvoirs) pour que les effets visuels se déclenchent chez l'invité. L'invité interpole entre deux instantanés.
- Messages typés et versionnés (`{v:1, t:'snapshot', …}`). Gère la reconnexion : si l'invité revient dans les 30 s, il reprend la partie ; sinon l'hôte continue seul, et la partie est sauvegardée pour être reprise à deux plus tard.
- **Salon** :
  1. Le joueur A choisit Coop Niveaux (et le niveau) ou Coop Infini, puis « Créer une partie ».
  2. L'app génère un identifiant de salon et le lien `https://<site>/#k=<CLE>&room=<ID>` (la clé secrète est conservée).
  3. Le bouton « Inviter » ouvre le partage natif (Web Share API), ou copie le lien.
  4. Le joueur B ouvre le lien et arrive dans le salon.
  5. Chacun choisit son deck et clique sur « Prêt ».
  6. Compte à rebours de 3 s, puis début de la partie.
- **Emotes** rapides pendant la partie : 6 bulles avec les visages des personnages (« Bien joué ! », « Aide-moi ! », « Fusionne ! », « 😂 »…).

---

## 6. Collection, tirages et progression

### 6.1 Monnaie (fictive, aucun achat réel)
- **Éclats** :
  - campagne : +30 par étoile la première fois, +10 en rejouant ;
  - Solo Infini : +10 par vague et les coffres de palier ;
  - Coop Niveaux : +30 par étoile la première fois, pour chacun ;
  - Coop Infini : +10 par vague et les coffres de palier (§5.2), pour chacun ;
  - coffre quotidien : +150.
- **Parchemins de talent** : gagnés en campagne (coffres d'étoiles et boss de chapitre).
- Au premier lancement : **1 000 éclats** offerts et un deck de départ de 5 unités, au choix :
  - **Marvel** : Spider-Man, Œil de faucon, Falcon, Captain Marvel, Black Widow ;
  - **Disney** : Pocahontas, Rebelle, Tiana, Nemo & Dory, Rox & Rouky.

### 6.2 Packs
- Deux packs, **Pack Marvel** et **Pack Disney**, qui ne contiennent que les unités de leur univers.
- Prix : **100** éclats le tirage, **900** les 10 tirages, avec au moins 1 Épique garanti dans un lot de 10.
- Taux : **Rare 72 %**, **Épique 24 %**, **Légendaire 4 %**.
- **Garantie** : un Légendaire au plus tard au 40e tirage, compteur séparé par pack et affiché.
- Affiche les taux exacts sur l'écran du pack.
- **Animation d'ouverture** soignée :
  1. la carte tombe et tremble ;
  2. la lueur prend la couleur de la rareté (bleu Rare, violet Épique, or Légendaire avec des rayons) ;
  3. la carte se retourne ;
  4. le personnage joue sa **boucle d'attaque** ;
  5. le bouton « Passer » révèle tout d'un coup pour un lot de 10.
- **Doublons** : ils deviennent des cartes de niveau. Il faut 1, 1, 2, 2, 2, 3, 3, 3, 4 cartes pour passer les niveaux 2 à 10 (21 au total), plus 50, 100, 150, 250, 400, 600, 900, 1 300, 1 800 éclats. Au-delà du niveau 10, les doublons servent à l'**Éveil** (§6.6), qui porte la progression longue.

### 6.3 Skins
- **3 skins par unité** : Classique, Hiver et Néon, obtenus par palette alternative appliquée au SVG.
- Le skin Hiver se débloque au niveau 5 de l'unité, le skin Néon au niveau 10. Il y a aussi 2 % de chance par tirage d'obtenir un skin aléatoire d'une unité possédée.

### 6.4 Decks
- **5 unités différentes** par deck, en mélangeant librement les packs. Jusqu'à 3 decks enregistrés.
- L'écran Deck montre les bonus d'équipe actifs ou presque actifs (« Il manque Thor pour Avengers 3 »).

Chaque **profil** a sa propre collection, sauvegardée en ligne et retrouvée sur n'importe quel appareil.


### 6.5 Illustrations de fiches
- Certains personnages ont une **grande illustration** (art de comics) : Spider-Man, Iron Man, Thor, Œil de faucon, Captain Marvel, Captain America, Black Widow, Venom, Hulk, et Thanos pour les boss. D'autres s'ajouteront.
- Où elle s'affiche :
  - en fond de la **fiche de collection**, plein cadre, avec un dégradé sombre en bas ; le personnage **chibi animé** est posé par-dessus, en bas à gauche, avec ses statistiques ;
  - à l'**ouverture d'un pack**, au moment où la carte se retourne, quand le personnage tiré en a une ;
  - dans l'**annonce plein écran du boss** pour Thanos.
- Un personnage sans illustration garde une fiche avec son chibi en grand sur un fond aux couleurs de son univers.
- **Les illustrations ne sont jamais en clair dans le dépôt public.**
  - Les originaux sont dans le dépôt **privé** `D-p-t-photo-marvel`.
  - Le dépôt public ne contient que les copies **chiffrées** (`public/fiches/<id>.bin`, AES-GCM, clé dérivée du lien secret par PBKDF2) et `index.json`.
  - Le jeu les déchiffre sur l'appareil avec `src/access/fiches.ts` (`ficheUrl(id)`). Sans la clé, la fonction renvoie `null`.
  - Pour en ajouter : `node scripts/encrypt-assets.mjs <clé> <dossier des originaux>`.


### 6.6 Éveils des personnages

L'**Éveil** est la progression la plus longue du jeu, au-delà du niveau 10. Chaque éveil rend un personnage plus fort pour toujours, sur ton profil, et débloque des **passifs**. **L'éveil maximal doit demander des mois de jeu** : c'est l'objectif à long terme.

**Conditions**
- L'éveil s'ouvre quand le personnage atteint le **niveau de collection 10**.
- Chaque éveil demande **des copies du même personnage** (doublons obtenus aux tirages, en plus de ceux qui servent aux niveaux) **et des cristaux d'éveil** (✦), une monnaie dédiée.

| Éveil | Copies du personnage | Cristaux ✦ | Gain (cumulé) | Débloque |
|---|---|---|---|---|
| ★1 | 2 | 50 | Attaque +6 %, vitesse d'attaque +4 % | — |
| ★2 | 3 | 300 | +12 % / +8 % | **Passif 1** |
| ★3 | 5 | 600 | +18 % / +12 % | — |
| ★4 | 6 | 1 000 | +24 % / +16 % | **Passif 2** |
| ★5 | 8 | 2 000 | +30 % / +20 % | Aura sur le jeton |
| ★6 | 10 | 2 500 | +36 % / +24 % | **Passif 3** |
| ★7 | 13 | 3 000 | +42 % / +28 % | — |
| ★8 | 18 | 4 000 | +48 % / +32 % | **Passif 4** |
| ★9 | 25 | 5 000 | +54 % / +36 % | — |
| ★10 (max) | 40 | 6 500 | +60 % / +40 % | **Passif ultime** et apparence « Éveillé » (cadre doré animé, effets d'attaque améliorés) |
| **Total** | **130 copies** | **24 950 ✦** | | |

- Les copies demandées sont les mêmes pour toutes les raretés. Un Légendaire, tiré à 4 %, est donc **bien plus long** à éveiller qu'un Rare : c'est voulu.
- **Passifs** : 5 par personnage (★2, ★4, ★6, ★8, ★10), dans l'esprit de sa compétence. Exemples :
  - Hulk : « Chaque Smash rend 5 de mana », « La Rage ne retombe plus entre deux vagues », puis en ultime « Hulk Smash frappe tout le chemin » ;
  - Spider-Man : « Les toiles ralentissent aussi les boss de 10 % », puis en ultime « Toile géante : immobilise toute la vague 2 s une fois par vague ».

  L'agent Game design écrit les 140 passifs (28 × 5), chiffrés, dans `src/data/awakenings.ts`.

**Cristaux d'éveil (✦), gagnés lentement**
- Solo Infini et Coop Infini : 5 ✦ au palier 10, 10 au 20, 20 au 30, 30 au 40, 60 au 50, puis +10 tous les 10.
- Premier gros boss vaincu de la journée : 5 ✦. Thanos vaincu : 50 ✦.
- Campagne : 3 étoiles sur un niveau de boss, la première fois : 25 ✦.
- Coffre quotidien : 5 ✦.
- Doublons d'un personnage déjà à ★10 : convertis en 5 ✦ chacun.
- **Rythme visé** (l'agent Game design le vérifie et l'écrit dans `docs/equilibrage.md`) :
  - premier ★1 dans la première semaine de jeu régulier ;
  - ★5 sur un personnage Rare en 2 à 3 mois ;
  - ★10 sur un Légendaire en **plus de 8 mois**.
- Ces valeurs viennent de la simulation d'économie de `docs/equilibrage.md` §6 : premier ★1 vers le jour 8, ★5 sur un Rare vers le jour 66, ★10 sur un Légendaire vers le jour 262 (≈ 8,7 mois).
- **Aucun achat**, aucun raccourci.

**Affichage**
- Étoiles d'éveil sur la carte et sur le jeton de plateau. Aura à partir de ★5, cadre doré animé à ★10.
- Écran **Éveil** depuis la fiche du personnage : les 10 étoiles, les copies et cristaux possédés et demandés, l'aperçu des gains et du prochain passif, et une animation d'éveil soignée (le personnage s'illumine, les étoiles se remplissent, le passif se révèle).

**Moteur** : `PlayerSetup.awakening` (0 à 10 par unité). Les gains de l'éveil s'ajoutent au niveau et aux talents, et les passifs sont lus dans `src/data/awakenings.ts`.
---

## 7. Direction artistique

- **Exactement le style des planches du dépôt** : chibi, grosse tête, buste coupé à la taille, vue de face, contours épais `#1d1733`, ombrage cel-shading en deux tons, reflets blancs, ombre au sol.
- **Polices** : Lilita One pour les titres et les boutons, Nunito pour le texte.
- **Logo** : « MARVEL RUSH », jaune `#f6c64a` (« RUSH » en rouge `#e8413b`), contour sombre épais et relief, comme dans l'en-tête des planches.
- **Couleurs de rareté** : Rare `#3c8bf0`, Épique `#9b59e6`, Légendaire `#f2a93b`, Boss `#c0263a`.
- **Plateau** : cases arrondies façon jetons, posées sur la map de la partie (§7 bis). Le chemin change de forme et de matière selon la map.
- **Unités sur le plateau** : personnage posé **directement, sans cadre rond**, sur une **plaque dont la forme donne le niveau de fusion** (couleur propre à chaque héros, contrastée avec ses couleurs et distincte des autres ; fin liseré intérieur de la couleur de rareté) : le nombre d'angles = le niveau (1 rond, 2 amande, 3 triangle, 4 losange, 5 pentagone, 6 hexagone, 7 heptagone). À chaque fusion, la forme gagne ses angles un à un.
- **Animation d'attaque** : alterne les textures de pose (repos → préparation → frappe), avec un léger écrasement-étirement et les effets de la planche (rayon, éclair, toile, bulles…), adaptés pour PixiJS (particules et sprites).
- **Ennemis** : les sbires des planches, plus des ennemis génériques dans le même style (créatures-feuilles, slimes, robots). Barre de PV au-dessus de chaque ennemi.
- **Boss** : grand sprite, barre de PV en haut de l'écran avec nom et portrait, annonce « BOSS ! » plein écran avec un tremblement de l'écran.
- **Retours visuels** : chiffres de dégâts flottants (critiques en gros et en jaune), fusion avec éclat et petit saut, invocation avec un portail lumineux.
- **Son** : effets simples (invocation, fusion, coups, boss, victoire) générés en WebAudio, avec un bouton muet.

---

## 7 bis. Maps par univers et arènes de boss

Chaque partie se joue sur une **map** liée à l'univers d'un personnage. Quand un boss arrive, la map se **transforme en son arène** : fondu de 1 s, le ciel change, le décor bascule et la musique change. À la mort du boss, on revient à la map de départ.

### Règles communes
- **Même style que les personnages** : formes rondes, contours épais `#1d1733`, ombrage en deux tons, couleurs saturées, vue de dessus légèrement inclinée (comme Rush Royale).
- **Lisibilité d'abord** : le décor reste **désaturé et plus sombre** que les unités et les ennemis, et rien d'animé ne passe sur le chemin ou sur la grille.
- Chaque map définit :
  - un **tracé de chemin** (en U, en S, en spirale ou en zigzag autour de la grille, même longueur totale à ±10 % pour rester équitable) ;
  - une **matière de chemin** ;
  - **3 couches de décor** (fond, décor latéral, détails animés) ;
  - **2 ou 3 animations d'ambiance** ;
  - une **palette** ;
  - une **ambiance sonore**.
- En **Coop**, la map est symétrique : deux portails, un de chaque côté, deux branches qui longent chacune un plateau, puis le tronc commun au centre qui mène au château.
- **Choix de la map** :
  - en Solo, l'univers majoritaire du deck décide, ou le joueur choisit parmi les maps débloquées ;
  - en multi, l'hôte choisit.
  - Une nouvelle map se débloque toutes les 5 vagues atteintes.
- **Modificateur léger par map** (option activable dans les réglages), par exemple « Océan : ralentissements +10 % ».

### Maps Marvel

| Map | Univers | Chemin | Décor et ambiance | Modificateur (option) |
|---|---|---|---|---|
| Toits de New York | Spider-Man | Toits reliés par des passerelles | Château d'eau, gratte-ciel au coucher du soleil, toiles entre les antennes, taxis jaunes en bas | Rapides +10 % de vitesse |
| Atelier Stark | Iron Man | Tapis roulant métallique | Hologrammes bleus, bras robotisés, armures en vitrine, étincelles | Dégâts des rayons +10 % |
| Asgard et le Bifrost | Thor, Loki | Pont arc-en-ciel | Palais doré, montagnes flottantes, aurores, éclairs lointains | Chaînes +1 rebond |
| Sanctum Sanctorum | Doctor Strange | Parquet qui se replie (effet kaléidoscope) | Bibliothèque, artefacts flottants, portails orange | Recharges de compétences −10 % |
| Base des Avengers | Captain America, Black Widow, Falcon, Œil de faucon, Soldat de l'hiver | Piste d'entraînement | Hangar, Quinjet, cibles d'entraînement, drapeau | Aucun |
| Temple des Dix Anneaux | Shang-Chi, Captain Marvel | Pont de pierre au-dessus de l'eau | Forêt de bambous, lanternes, dragon d'eau en fond | Combos +10 % |

### Maps Disney

| Map | Univers | Chemin | Décor et ambiance | Modificateur (option) |
|---|---|---|---|---|
| Île de Motunui | Vaïana, Maui | Sable et rochers au bord du lagon | Cocotiers, pirogue, vagues animées, Te Fiti en fond | Contrôles +10 % de durée |
| Palais impérial | Mulan | Pavés de la Cité interdite | Toits rouges, lanternes, cerisiers, feux d'artifice | Brûlures +10 % |
| Royaume des morts | Coco | Pont de pétales de souci | Ville colorée la nuit, alebrijes lumineux, guirlandes | Une résurrection de plus par partie |
| Zootopie | Judy & Nick | Avenue de Savanna Central | Quartiers climatisés (toundra et jungle), voitures miniatures | Ralentissements +10 % |
| Chambre d'Andy | Buzz & Woody | Circuit de petites voitures | Lit, cubes, papier peint à nuages, jouets qui bougent | Aucun |
| Sugar Rush | Vanellope & Ralph | Piste de course en bonbons | Montagnes de gâteaux, sucettes, glitchs de pixels | Boucliers ennemis −1 coup |

Les autres personnages Disney (Pocahontas, Rebelle, Ariel, Tiana, Nemo & Dory, Raiponce, Rox & Rouky) déclinent ces maps en **variantes** à débloquer : Forêt de Pocahontas, Highlands de Rebelle, Atlantica, Bayou de La Nouvelle-Orléans, Récif de Nemo, Tour de Raiponce, Forêt de Rox & Rouky. Chacune garde un tracé existant avec un nouveau décor.

### Arènes de boss

| Boss | Arène | Décor et effets | Pendant le boss |
|---|---|---|---|
| Jafar & Iago | Caverne aux Merveilles / palais d'Agrabah | Tête de tigre en sable, trésors, fumée rouge, sable qui coule | Spirales hypnotiques au sol, ciel rouge |
| Cruella | Manoir De Vil, Londres | Salon noir et blanc, fourrures, voiture rouge, brouillard vert | Le décor passe en noir et blanc, seuls les effets restent colorés |
| Ursula | Antre sous-marin | Squelette de baleine, âmes-polypes, bulles, lumière de nautile | Ondulation de tout l'écran, bulles qui remontent |
| Maléfique | Montagne interdite | Château noir, ronces, corbeaux, flammes vertes | Ronces qui poussent sur les bords, flammes vertes |
| Galactus | Planète dévorée, espace | Planète qui se fissure, étoiles, nébuleuse violette | Fond qui tourne lentement, débris qui flottent, écran qui tremble par moments |
| Bouffon Vert | New York, nuit d'Halloween / Oscorp | Pleine lune, citrouilles, tour Oscorp, chauves-souris | Éclairs verts, explosions de citrouilles en fond |
| Thanos | Titan | Planète en ruines, ciel orange, débris en orbite, les six Pierres en fond | La Pierre utilisée colore tout l'écran ; flash blanc et silence au Claquement de doigts |

### Mise en œuvre
- Tout est en **SVG converti en textures** (comme les personnages), avec un parallaxe léger sur 2 ou 3 couches. Pas d'images externes.
- Chaque map est un fichier de données (`src/maps/<id>.ts`) : tracé du chemin (points), palette, couches, animations, son, modificateur. Le moteur ne lit que le **tracé** et le **modificateur** ; tout le reste sert au rendu.
- Une page de prévisualisation `/#dev/maps` montre chaque map et chaque arène, avec la transition vers le boss.

---

## 8. Écrans

Chaque écran suit les captures et les règles de `design/references/ecrans/README.md` : cadres épais avec relief, gros boutons en dégradé, cartes à cadre de rareté, bandeaux d'information semi-transparents.

**Style application, jamais de page web.** L'interface doit donner l'impression d'une vraie app mobile native, propre et claire :
- **La page ne défile jamais.** `html` et `body` font exactement la hauteur de l'écran (`100dvh`), avec `overflow: hidden` et `overscroll-behavior: none` : pas de rebond, pas de pull-to-refresh, pas de barre d'adresse qui bouge.
- **Chaque écran est une vue plein écran** en trois zones fixes : un en-tête (monnaies et profil), un contenu, et la **barre d'onglets en bas**, fixe, façon Rush Royale.
- **Seul le contenu peut défiler**, et seulement quand il est plus haut que l'écran (grille de collection, liste des niveaux de campagne, historique) : défilement interne (`overflow-y: auto`, `-webkit-overflow-scrolling: touch`), avec une barre de défilement discrète et des fondus en haut et en bas de la zone.
- **L'écran de combat ne défile jamais**, même dans sa zone de contenu : tout tient à l'écran, du 375 × 667 au 430 × 932.
- **Respect des zones sûres** (encoche, barre d'accueil) avec `env(safe-area-inset-*)`.
- **Gestes d'app** :
  - pas de sélection de texte ni de menu contextuel sur les éléments de jeu (`user-select: none`, `-webkit-touch-callout: none`) ;
  - pas de zoom (`touch-action: manipulation`) ;
  - pas de surlignage bleu au toucher ;
  - un retour visuel immédiat à chaque pression.
- **Navigation par transitions** (glissement ou fondu de 200 à 250 ms) entre les vues, jamais par rechargement. Les fenêtres (fiche d'unité, confirmation, récompenses) s'ouvrent en **panneaux qui montent du bas** ou en modales centrées, avec un fond assombri.
- Ce qui précède est garanti par une feuille de style de base commune (`src/ui/base.css`) et un composant de vue (`src/ui/view.ts`) que tous les écrans utilisent.

1. **Accueil** : logo animé sur la map préférée en fond, gros bouton **Campagne** (avec la reprise de la partie en cours s'il y en a une), puis **Solo Infini**, **Jouer à deux**, **Tirages**, **Collection**, **Decks**, **Maps**. En haut : avatar, niveau de compte, éclats, et la pastille de présence de la partenaire.
2. **Campagne** : carte des 6 chapitres, niveaux avec leurs étoiles, coffres d'étoiles, prochain personnage à débloquer.
3. **Jouer à deux / Mon duo** : liaison des profils, présence, « Inviter à jouer », invitations reçues, **parties communes en cours** à reprendre, historique et score du duo.
4. **Talents** : depuis la fiche d'une unité, les 3 paliers et le choix entre 2 talents à chaque palier.
5. **Maps** : galerie des maps et des arènes, avec l'aperçu animé, l'univers, le modificateur et la condition de déblocage.
6. **Tirages** : les deux packs côte à côte, prix, taux, compteur de garantie.
7. **Collection** : grille de toutes les unités, celles qu'on n'a pas en silhouette. La fiche d'une unité montre sa boucle d'attaque animée, ses statistiques, sa compétence, son niveau, ses cartes et ses skins.
8. **Decks** : composition par glisser-déposer, bonus d'équipe.
9. **Salon multi** : créer, inviter, attendre, choix du deck, « Prêt ».
10. **Partie** :
   - en haut : vies, vague, minuteur, barre du boss ;
   - au milieu : chemin et plateau(x) ;
   - en bas : mana, bouton **Invoquer** avec son coût, les 5 boutons d'amélioration du deck, emotes.
11. **Fin de partie** : vague atteinte ou victoire/défaite, éclats gagnés, bouton « Rejouer » (qui renvoie au salon en multi).
12. **Réglages et profil** : pseudo, avatar, code de récupération (afficher et copier), récupérer un profil, son, vibrations, notifications, état de la synchronisation, réinitialiser (avec confirmation dans la page).

---

## 8 bis. Mises à jour de l'app

- Quand une nouvelle version est en ligne, une fenêtre **« Nouvelle version disponible »** propose **Mettre à jour** (ou Plus tard). Elle apparaît aussi quand l'app est déjà ouverte : l'app vérifie toutes les 20 min et à chaque retour dans l'app.
- Après la mise à jour, une fenêtre **« Quoi de neuf ? »** liste les nouveautés, une seule fois par version.
- **Chaque mise à jour visible par les joueurs ajoute une entrée en tête de `src/pwa/changelog.ts`** (id croissant, titre, date, phrases courtes). Les publications d'extensions (DC, Transformers, Pixar) en ajoutent une détaillée.
- Ne jamais mettre à jour en pleine partie : si une partie est en cours, la fenêtre attend la fin de la partie.

## 9. Organisation du code

```
src/
  art/        primitives et personnages SVG extraits des planches, skins, génération des textures
  data/       units.ts, bosses.ts, enemies.ts, teams.ts, packs.ts
  engine/     simulation pure : état, ticks, ciblage, compétences, vagues, boss, rng, commandes
  net/        Transport (PeerJS), protocole, hôte et invité, reconnexion
  render/     scène PixiJS, plateau, unités, ennemis, effets, interpolation
  maps/       données des maps et des arènes de boss (tracé, palette, couches, modificateur)
  audio/      effets et ambiances WebAudio
  ui/         écrans HTML/CSS
  tutorial/   scénario du tutoriel, surcouche de guidage, astuces contextuelles
  meta/       collection, tirages, monnaie, decks
  campaign/   chapitres, niveaux, étoiles, récompenses, talents, éveils, niveau de compte, Solo Infini
  cloud/      Supabase : profils, sync local d'abord, présence, invitations, parties sauvegardées
  pwa/        manifest, icônes, service worker
  access/     vérification du lien secret
supabase/     schéma SQL, règles RLS, fonctions
.github/workflows/  build, tests et déploiement GitHub Pages
tests/        tests du moteur, des tirages et de la synchronisation
```

---

## 10. Étapes de livraison

Livre dans cet ordre. Chaque étape doit être jouable et testée, avec un commit par étape. Entre parenthèses, les agents engagés (§1 bis) ; ceux d'une même étape travaillent en parallèle.

0. **Contrats et mise en ligne** (chef de projet, PWA et déploiement) : types, protocole, interface moteur ↔ rendu, squelette du projet, journal ; dépôt GitHub public créé et poussé, workflow GitHub Pages actif dès le premier jour (même avec une page vide), pour que chaque étape soit testable en ligne.
1. **Moteur et Solo** (moteur, game design, rendu, direction artistique, QA) : plateau, invocation, fusion, mana, vagues, 6 unités Marvel, ennemis, un boss, la map « Toits de New York ». Jouable en local.
2. **Toutes les unités, tous les boss et toutes les maps** (game design, direction artistique, maps, moteur, QA) : les 28 unités, les 6 boss avec leurs sbires et leurs arènes, les 12 maps et leurs variantes, les bonus d'équipe. Tests sur chaque compétence, simulateur d'équilibrage.
3. **Profils, sauvegarde, tutoriel et campagne Solo** (backend, campagne et progression, tutoriel, interface, QA) : profils, code de récupération, sauvegarde en ligne local d'abord, reprise des parties Solo, **tutoriel guidé**, les 6 chapitres, étoiles, talents, niveau de compte, Solo Infini.
4. **Méta-jeu** (méta et économie, interface, direction artistique) : collection, packs Marvel et Disney, animation d'ouverture, decks, niveaux, skins.
5. **Jouer à deux : Coop** (réseau, backend, interface, QA) : liaison du duo, présence, invitations, salon, lien de secours, synchronisation, reconnexion, map symétrique, sauvegarde et reprise des parties communes.
6. **Coop Niveaux et Coop Infini** (réseau, campagne, game design, QA) : campagne à deux, paliers et coffres de l'infini, record et historique du duo.
7. **PWA, lien secret et mise en ligne** (PWA et déploiement, QA) : installation, hors ligne pour le Solo, `noindex`, page neutre sans la clé, dépôt public, déploiement GitHub Pages automatique.
8. **Finitions** (audio, rendu, QA) : sons et ambiances par map, vibrations, performances (60 i/s visés avec 15 unités et 60 ennemis par plateau sur un téléphone moyen), README de déploiement.

---

## 11. Critères d'acceptation

- [ ] Ouvrir le site sans la clé affiche « Page introuvable » ; avec la clé, le jeu s'ouvre et l'accès est mémorisé.
- [ ] Le jeu s'installe sur l'écran d'accueil (iOS et Android) et le Solo marche en mode avion.
- [ ] Invocation, fusion (même unité et même rang uniquement), amélioration et coût croissant fonctionnent comme dans Rush Royale.
- [ ] Les 28 unités et les 6 boss ont leurs compétences et leurs animations, dans le style des planches.
- [ ] Les 12 maps, leurs 7 variantes et les 6 arènes de boss sont jouables, et la transition vers l'arène se déclenche à l'arrivée de chaque boss.
- [ ] Le journal `docs/journal.md` montre quel agent a livré chaque partie, et chaque livraison a été relue par l'agent QA.
- [ ] Les deux packs respectent les taux affichés et la garantie (testé sur 100 000 tirages simulés).
- [ ] Deux téléphones sur des réseaux différents (4G et Wi-Fi) jouent ensemble en Coop Niveaux puis en Coop Infini grâce à l'invitation, avec un décalage perçu inférieur à 150 ms.
- [ ] Si l'invité ferme l'onglet et revient dans les 30 s, la partie reprend.
- [ ] Toute l'interface est en français, lisible sur un écran de 375 px de large.
- [ ] Aucun écran ne fait défiler la page : seules les zones de contenu prévues défilent en interne ; pas de rebond, de zoom ni de sélection de texte ; l'écran de combat tient sans défilement du 375 × 667 au 430 × 932.
- [ ] Un nouveau profil est guidé pas à pas (invoquer, fusionner, améliorer, boss, pack, deck, niveau 1) en moins de 4 minutes, sans pouvoir se bloquer ; le tutoriel reprend à la bonne étape après fermeture.
- [ ] Une personne qui connaît Rush Royale retrouve ses repères : mêmes gestes, même disposition de l'écran de combat, même boucle de progression.
- [ ] Deux profils sur deux téléphones progressent chacun de leur côté ; après réinstallation, le code de récupération restaure toute la progression.
- [ ] Une partie Solo fermée en cours de route reprend à la même vague, y compris sur un autre appareil.
- [ ] Une partie Coop arrêtée se retrouve dans « Parties en cours » chez les deux joueurs et reprend à la même vague.
- [ ] L'invitation depuis « Mon duo » arrive chez la partenaire en ligne en moins de 3 s.
- [ ] L'Éveil fonctionne de ★1 à ★10 (copies + cristaux), avec ses gains et ses 5 passifs, et le simulateur d'économie confirme qu'un ★10 Légendaire demande plus de 8 mois de jeu régulier.
- [ ] Le Solo Infini donne ses coffres de palier et ses cristaux d'éveil, et se reprend après fermeture.
- [ ] La campagne (6 chapitres) est jouable de bout en bout, débloque des personnages et des talents, et un nouveau profil peut finir le chapitre 1 avec son deck de départ.
- [ ] Le dépôt GitHub est public, ne contient aucun secret (clé d'accès, clés Supabase), et chaque push sur `main` redéploie GitHub Pages.

---

## 12. Ce que tu me rends à chaque étape

- Ce qui marche, comment le tester (commande **et URL en ligne**), et les limites connues.
- **Tous les liens, à chaque étape** :
  - le **dépôt GitHub public** (`https://github.com/<compte>/<depot>`) ;
  - la page **GitHub Actions** du dernier déploiement ;
  - l'**URL GitHub Pages** du jeu ;
  - le **lien secret complet** à ouvrir sur mon téléphone (`https://<compte>.github.io/<depot>/#k=<CLE>`), donné **uniquement dans ta réponse**, jamais commité ;
  - le **lien à envoyer à ma partenaire** (le même lien secret ; elle crée son profil à la première ouverture).
- Pour l'étape 5 : la procédure exacte pour jouer à deux (lier nos profils, voir l'autre en ligne, inviter, reprendre une partie commune).
- La procédure pour **créer le projet Supabase** (offre gratuite), exécuter le schéma de `supabase/` et ajouter les secrets dans GitHub : écris-la pas à pas pour quelqu'un qui ne code pas, et fais toi-même tout ce que tes accès te permettent.
- À la fin : comment changer la clé d'accès et comment récupérer un profil sur un nouveau téléphone.
