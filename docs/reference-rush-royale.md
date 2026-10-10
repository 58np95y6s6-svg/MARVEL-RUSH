# Référence Rush Royale — ce que Marvel Rush reproduit

> Rédigé par l'agent **Game design et stratégie**. Chaque agent s'y réfère quand le prompt (`docs/prompt-jeu.md`) ne précise pas un détail : on reproduit Rush Royale, on n'invente pas (§0).
> Le prompt reste prioritaire : quand il s'écarte de Rush Royale, l'écart est signalé ici par **[ÉCART]** et c'est le prompt qui gagne.

## Sources et niveau de confiance

| Source | Accès | Utilisation |
|---|---|---|
| Captures fournies par l'utilisateur, `design/references/ecrans/*.jpg` et leur analyse `design/references/ecrans/README.md` | Lues | **Source visuelle principale** : écran de combat à deux plateaux, bandeau « 1 vague avant le boss », écran Donjons, écran Deck/Collection, plateau simple portail → porte de château. |
| Article Wikipédia « Rush Royale » (extraits obtenus via la recherche web ; la page elle-même est bloquée par le réseau) | Partiel | Grille 3×5, mana gagné en tuant des monstres, fusion de deux unités identiques en une unité aléatoire du deck, fin de vague puis boss, monstres tués envoyés chez l'adversaire en PvP, héros, talents interchangeables, 4 raretés et 5 factions. |
| Fiches App Store de Rush Royale (FR, US) | Lues via la recherche | Description officielle : PvP, Coop, Ascension et talents de combat. |
| Wiki Fandom `rushroyale.fandom.com`, guides BlueStacks, Wikipédia direct | **Bloqués** par le proxy réseau | Non consultés. |
| Connaissance du jeu par l'agent (versions 2021-2025) | — | Le reste. Les points dont l'agent n'est pas sûr sont marqués *(à confirmer)*. |

Rush Royale change ses chiffres à chaque saison : on reproduit **la structure et la sensation**, et nos chiffres sont ceux du prompt (§4), équilibrés par `docs/equilibrage.md`.

---

## 1. Écran de combat (portrait)

### 1.1 Disposition générale (Solo, Marvel Rush)

```
┌──────────────────────────────────┐
│ ♥♥♥   Vague 7   ⏱ 0:18   [⚙]     │  barre du haut : vies, vague, minuteur, pause
│ [▓▓▓▓▓▓▓▓░░░ Galactus 62 %]      │  barre du boss (seulement pendant le boss)
│  ╭───────── chemin ─────────╮    │
│  │ ┌──┬──┬──┬──┬──┐         │    │
│ ◉│ │  │  │  │  │  │         │ 🏰 │  portail d'entrée → plateau 3×5 → porte du château
│  │ ├──┼──┼──┼──┼──┤         │    │
│  │ │  │  │  │  │  │         │    │
│  │ ├──┼──┼──┼──┼──┤         │    │
│  │ │  │  │  │  │  │         │    │
│  │ └──┴──┴──┴──┴──┘         │    │
│  ╰──────────────────────────╯    │
│  ( 1 vague avant le boss Cruella ) │  bandeau pilule semi-transparent
│                                  │
│ 💧 140      [ INVOQUER ]   [😀]  │  mana à gauche, Invoquer au centre (coût), emotes à droite
│              ◆ 30                │
│ [Lv1][Lv2][Lv1][MAX][Lv1]        │  5 cartes du deck = 5 boutons d'amélioration + coût
│  100  200  100   —   100         │
└──────────────────────────────────┘
```

- **Chemin** : il entoure la grille (en U sur le plateau simple, `rr-plateau-chemin.jpg`). Les ennemis entrent par un **portail** d'un côté et sortent par une **porte de château** de l'autre. Le chemin est en dalles ou en terre, plus clair que le décor.
- **Grille** : 3 lignes × 5 colonnes au centre, en damier clair, posée dans un **cadre épais** (pierre, créneaux, coins arrondis). C'est la zone la plus claire et la plus lisible de l'écran.
- **Bouton Invoquer** : en bas au centre, le plus gros bouton de l'écran, jaune quand on peut payer, grisé sinon. Le **coût** est affiché dessous (ou dedans) avec l'icône de mana.
- **Mana** : compteur en bas à gauche du bouton Invoquer, gros chiffre blanc à contour sombre, icône de mana.
- **Améliorations** : rangée des **5 cartes du deck** sous le bouton Invoquer, chacune avec le portrait, le niveau d'amélioration en cours (« Lv.1 » … « MAX ») et le coût de la prochaine amélioration. Une carte trop chère est grisée ; une carte au maximum affiche « MAX ».
- **Vague et minuteur** : en haut, « Vague N » et le compte à rebours de la vague. **[ÉCART]** Rush Royale place le compteur de vague dans un médaillon entre les deux plateaux ; en Solo nous le mettons en haut (le prompt §8.10 le demande).
- **Barre du boss** : en haut, sous la barre des vies, avec portrait, nom et PV en pourcentage ; elle n'apparaît que pendant un boss (petit boss « lieutenant » : barre plus courte, cadre argent ; gros boss et Thanos : barre pleine largeur, cadre rouge). Le minuteur de rage (§4.4 : 45 s) s'affiche à côté.
- **Vies** : 3 cœurs (Rush Royale les montre à côté de la porte du château ; nous les mettons en haut à gauche pour la lisibilité sur 375 px).
- **Bandeau d'annonce** : pilule sombre semi-transparente, texte blanc et icône du boss, entre le chemin et les boutons : « 1 vague avant le boss X » (copie directe de la capture), « Fusionne ! », « Plateau plein ».
- **Emotes** : un petit bouton rond (visage) en bas à droite. Il ouvre une roue de 6 bulles ; une bulle s'affiche 2 s au-dessus du plateau de l'émetteur. En Solo, il est caché.

### 1.2 PvP de Rush Royale — hors périmètre

**Choix de l'utilisateur (prompt §5.2) : pas de Duel.** Marvel Rush n'a que deux façons de jouer : Solo et Coop. Le PvP de Rush Royale (plateau adverse en haut, envoi des monstres tués, trophées) n'est **pas reproduit**. On en garde un seul élément visuel, réutilisé en Coop : la **rangée des 5 cartes du deck de l'autre joueur** en haut de l'écran, avec leurs badges d'amélioration (« MAX »), son avatar et son pseudo (capture `rr-combat-coop-donjons.jpg`, à gauche).

### 1.3 Coop : deux chemins qui se rejoignent

D'après la capture (gauche, partie à deux plateaux avec le bandeau « 1 wave before boss Plague Doctor »), la Coop de Rush Royale et le prompt §5.2 :

- **Deux plateaux** : celui de la partenaire en haut, le tien en bas, de taille presque égale (le haut légèrement plus petit sur 375 px).
- **Deux portails**, un de chaque côté. Chaque flot longe d'abord **le plateau d'un joueur** (branche du haut, branche du bas), puis les deux branches **se rejoignent au centre** en un **tronc commun** qui mène à la **porte du château**. **[ÉCART]** Dans Rush Royale, la Coop n'a qu'un chemin ; la jonction est propre à Marvel Rush.
- **Toutes les unités des deux joueurs** touchent tout ennemi, sur les deux branches et sur le tronc : il faut s'entraider.
- Les **petits et gros boss** arrivent **par le tronc commun** ; leurs pouvoirs visent un plateau au hasard.
- Tout en haut : la rangée des 5 cartes du deck de la partenaire avec leurs badges, son avatar et son pseudo.
- Le bandeau « N vague(s) avant le boss X » se place **entre les deux plateaux**, sur le tronc.
- Vies **partagées** : **3 vies** pour les deux joueurs. **[ÉCART]** La Coop de Rush Royale n'en a qu'une ; mana individuel (le coup final rapporte le mana).
- Bouton **« Offrir »** à côté des emotes, actif une fois par vague.

### 1.4 Style des éléments (captures)

- **Jetons d'unité** : écusson ou cercle à la couleur de l'unité, personnage en buste vu de face (chez nous) ; **pastilles de rang** sur le bas du jeton (1 à 7 points disposés comme sur un dé ou en arc) ; liseré de rareté.
- **Chiffres de dégâts** : jaunes et orange, contour sombre épais, qui montent et s'empilent ; les critiques sont **plus gros**, orange vif, avec un petit « ! » ou un éclat ; les gros nombres sont abrégés (« 51,9 M », « 8,3 k »).
- **Boutons** : gros, arrondis, dégradé vertical (bleu = action, jaune = action principale, vert = valider), liseré sombre, ombre portée vers le bas, texte Lilita One blanc contouré ; ils s'enfoncent à l'appui.
- **Cadres** : rien n'est plat ; plateaux, cartes et bannières ont un cadre épais avec relief (pierre, bois, métal riveté).

---

## 2. Gestes et retours

| Geste | Rush Royale | Marvel Rush |
|---|---|---|
| **Invoquer** | Toucher le bouton. Une unité aléatoire du deck apparaît au **rang 1** sur une **case vide aléatoire**, avec un éclat lumineux ; le coût augmente aussitôt. Plateau plein : le bouton est grisé. | Identique. Portail lumineux + petit rebond du jeton. Plateau plein → bandeau « Plateau plein : fusionne ! ». |
| **Fusionner** | Appuyer sur une unité et la **faire glisser** : les unités **compatibles** (même unité, même rang) **s'illuminent**, les autres s'assombrissent. Lâcher sur une compatible : les deux disparaissent, une unité **aléatoire du deck** de **rang +1** apparaît **sur la case de destination**. Lâcher ailleurs : l'unité revient à sa place. | Identique. Les incompatibles passent à 50 % d'opacité, les compatibles pulsent avec un liseré blanc. Résultat : éclat + petit saut, pastilles qui s'ajoutent une à une. |
| **Fusion au rang max** | Impossible : deux unités au rang 7 ne s'illuminent pas. | Identique. |
| **Améliorer** | Toucher la carte du deck en bas. Mana débité, toutes les unités de ce type sur le plateau font un petit flash ; le badge de niveau monte ; le coût suivant s'affiche. | Identique. Coûts 100 / 200 / 400 / 700 (4 améliorations, niveaux 1 à 5). |
| **Info d'unité** | Toucher une carte du deck en combat ou une unité ouvre une **bulle d'info** (nom, dégâts, cadence, compétence) sans mettre en pause *(à confirmer : en combat Rush Royale se contente surtout de la fiche hors combat)*. | **Appui long** (400 ms) sur une unité du plateau ou une carte du deck : bulle d'info (nom, rang, dégâts actuels, cadence, compétence, ciblage, talents actifs). Le jeu ne se met pas en pause en multi ; en Solo, il ralentit à 25 %. |
| **Chiffres de dégâts** | Flottants au-dessus de l'ennemi, critiques plus gros. | Identique ; regroupés si plus de 20 par seconde sur la même cible (lisibilité). |
| **Annonce du boss** | Bandeau « 1 vague avant le boss X » la vague d'avant ; à l'arrivée : annonce plein écran avec le portrait, le nom et l'écran qui tremble ; barre de PV du boss. | Identique, plus la transition vers l'arène (§7 bis). Pour Thanos : illustration de fiche dans l'annonce (§6.5). |
| **Pouvoir de boss** | Le boss s'arrête, joue une animation, une icône/effet apparaît sur les unités touchées. | Identique ; l'unité touchée porte l'icône de l'effet (spirale = hypnose, Zzz = sommeil, étoiles = étourdi) et un compte à rebours circulaire. |
| **Perte de vie** | La porte du château tremble, un cœur se brise. | Identique, plus une vibration courte (si activée). |
| **Fin de partie** | Écran Victoire/Défaite, trophées et récompenses qui volent dans les compteurs, bouton « Continuer ». | Écran Victoire/Défaite, vague atteinte, étoiles (campagne), coffre à ouvrir puis or, gemmes et cartes qui volent dans la barre des monnaies, XP, bouton « Rejouer » et « Continuer ». |

---

## 3. Règles de combat en détail

| Règle | Rush Royale | Marvel Rush (prompt) |
|---|---|---|
| Grille | 3 × 5 = 15 cases par joueur. | Identique (§4.1). |
| Portée | Globale : toute unité touche tout ennemi, selon son ciblage. | Identique. |
| Ciblage | Premier (le plus avancé), aléatoire, le plus fort (PV max) selon l'unité. | Identique (premier, aléatoire, fort). |
| Mana de départ | 100 (guides). | 100 (octobre 2026, copie de l'équilibrage ; avant : 150). |
| Mana par élimination | Coop : +10 toutes les 10 vagues, 50 au plus ; gros monstre et mini-boss ×5 ; « tuer un boss ou un mini-boss rapporte plus ». | 10 (+10 toutes les 10 vagues, 50 au plus) × 1 normal, × 5 gros et mini-boss ; 100 pour un gros boss, plus la récompense de boss (docs/rush-royale-donnees.md §2). |
| Coût d'invocation | **10**, puis **+10** à chaque invocation (10, 20, 30…). Le coût ne redescend pas. | Identique. |
| Fusion | Deux unités **identiques de même rang** → une unité **aléatoire du deck** au **rang +1**, sur la case de destination. Rang max **7**, affiché en pastilles. Certaines unités ont des fusions spéciales (Mime, Arlequin…) — **hors périmètre** chez nous. | Identique (§4.2). |
| Effet du rang | Unités de dégâts : intervalle ÷ rang (« au rang 2, deux fois plus fortes ») ; soutiens : effet × rang. | Identique depuis octobre 2026. |
| Niveau de carte | Tableau propre à chaque unité (les Légendaires gagnent 40 à 70 % de leurs dégâts du niveau 7 par niveau, les Communes 8 à 11 %). | Tableau Rush Royale pour les 9 héros dont il est publié (`UnitDef.damagePerLevel`), +10 % par niveau pour les autres. |
| Améliorations en partie | Bouton par carte du deck, coûts **100 / 200 / 400 / 800**, niveaux 1 à 5 ; bonus propre à chaque unité. | Identique, mais bonus uniforme : **+15 % de dégâts et +6 % de cadence** par niveau. **[ÉCART]** |
| Vagues | PvP : minuteur par vague, puis boss. Coop : **10 monstres par vague**, la suivante commence quand le terrain est nettoyé ; vague de mini-boss = **un mini-boss et des rapides** ; vague de boss = le boss ; **les autres vagues ne contiennent que des monstres communs** (textes du jeu). | Règles de la Coop partout : 10 monstres (× effectif de la campagne), vague de mini-boss = lieutenant + 9 rapides, vagues normales de monstres communs. La campagne y mêle gros, blindés et boucliers (ses contraintes en ont besoin). **[ÉCART]** |
| Cadence des boss | PvP : un boss à la fin de chaque vague. Coop : **un boss toutes les 10 vagues** (10, 20, 30…), plus fort à chaque fois, avec des vagues denses entre-temps. | Calé sur la Coop de Rush Royale, partout (Solo, Coop, campagnes) : **petit boss « lieutenant » toutes les 5 vagues** (5, 15, 25…, PV ×5 et vitesse ×0,8 d'un monstre commun comme le mini-boss de Rush Royale, pouvoir affaibli toutes les 10 s) ; **gros boss toutes les 10 vagues** (10, 20, 30…, PV ×25, pouvoir toutes les 6 s), rotation des 6 sans répétition ; **Thanos à la vague 50** puis toutes les 50 en mode infini, et au dernier niveau de la campagne (§4.3, §4.4). Le petit boss est un **[ÉCART]** (ajout). |
| Sbires | Les monstres de la vague portent les traits du boss à venir *(à confirmer)*. | Les sbires du prochain gros boss se mêlent aux 2 vagues qui le précèdent. |
| Rage du boss | Le boss accélère s'il traîne *(à confirmer)*. | Rage à 45 s : vitesse ×2. |
| Vies | PvP : 3 vies par joueur. Coop : **une seule vie** pour la porte commune. Un monstre commun retire 1 vie, **un mini-boss ou un boss 2** (textes du jeu). | Solo et campagne : 3 vies ; Coop : 3 vies partagées (écart voulu). Normal −1, gros, lieutenant et boss −2 ; dans un niveau de boss, laisser passer le boss imposé fait perdre. |
| PvP (fin de partie, envoi des monstres tués, mort subite) | Premier à 0 vie perd ; les monstres tués partent chez l'adversaire. | **Hors périmètre, par choix de l'utilisateur** : pas de Duel (§5.2). |
| Héros | Un héros par joueur avec une compétence active (Trainer au départ). | **Hors périmètre** (pas de héros). |
| Coup critique | Chance de critique (5 % de base, plus pour certaines unités) × **dégâts critiques** du compte. | **5 % de base** pour toutes les unités (octobre 2026), dégâts ×2 ; pas de stat de compte (les dégâts critiques de départ d'un compte ne sont pas publiés). |

---

## 4. Méta-jeu

| Élément Rush Royale | Ce que c'est dans Rush Royale | Statut chez nous |
|---|---|---|
| **Navigation par onglets en bas** | Boutique · Cartes (deck/collection) · **Combat au centre** · Clan · Événements/Quêtes. | **Adapté** : Tirages · Collection/Deck · **Combat** (centre) · Campagne · Profil (§0). |
| **Écran Deck/Collection** | Onglets « Unités / Héros / Emotes », rangée des 5 cartes du deck avec « Lv.13 », encart de l'unité choisie, grille de collection à cadre de rareté avec barre de cartes (« 0/2 »). Barre du haut : niveau du joueur, or, gemmes, chacun avec « + ». | **À reproduire** avec onglets « Unités / Équipes / Emotes » (pas de héros) ; barre du haut : niveau de compte, éclats, parchemins (sans « + », rien à acheter). |
| **Coffres** | Coffres de victoire, de saison, de boutique ; animation d'ouverture. | **Adapté** : coffres d'étoiles de la campagne et coffre quotidien, même animation. |
| **Cartes et niveaux** | Doublons → cartes de niveau ; or pour monter ; niveaux 1 à 15. | **Adapté** : niveaux 1 à 10, 1, 1, 2, 2, 2, 3, 3, 3, 4 cartes + or (§6.2) ; packs payés en gemmes (deux monnaies, comme Rush Royale). |
| **Raretés** | Commun, rare, épique, légendaire (+ ascension). | **Adapté** : rare, épique, légendaire. |
| **Talents** | À certains niveaux de carte (9, 11, 13, 15 dans les versions récentes), on **choisit 1 talent parmi 2** ; le choix se change librement hors combat. | **Adapté** : paliers aux niveaux **5, 7, 9**, 1 parmi 2, ouverts par des **parchemins de talent** gagnés en campagne ; le choix reste modifiable gratuitement hors combat, comme dans Rush Royale. Données : `src/data/talents.ts`. |
| **Dégâts critiques (stat de compte)** | Chaque montée de niveau d'une carte augmente les dégâts critiques de tout le compte. | **Hors périmètre** (remplacé par le gain de dégâts par niveau de collection : tableau Rush Royale de l'unité, sinon +10 %). |
| **Decks** | 5 unités, plusieurs emplacements de deck. | **À reproduire** : 5 unités, jusqu'à 3 decks (§6.4). |
| **Factions** | 5 factions, bonus hebdomadaire. | **Adapté** : bonus d'équipe (§4.6). |
| **PvP** | Mode principal de Rush Royale. | **Hors périmètre, par choix de l'utilisateur** : seulement Solo et Coop (§5.2). |
| **Coop** | Partie à deux, vagues infinies, récompenses selon la vague atteinte. | **Adapté** : Coop Niveaux (campagne à deux, `docs/campagne-coop.md`) et Coop Infini avec coffres par palier (§5.2, `docs/equilibrage.md`). |
| **Trophées et ligues/arènes** | Trophées gagnés/perdus en PvP, ligues. | **Hors périmètre** ; remplacé par les étoiles Coop et le record du duo (§5.4). |
| **Route des trophées / Passe de saison** | Paliers de récompenses gratuits et payants. | **Hors périmètre** (pas de monétisation) ; le niveau de compte joue ce rôle. |
| **Quêtes quotidiennes** | 3 quêtes par jour. | **Adapté** : seulement le coffre quotidien (§6.1). Option future, non demandée. |
| **Donjons** | Mode avec des étages (« Étage 2 », « Étage 3 »), chaque étage a sa mini-scène, son coffre, son coût et un bouton « Jouer ». | **Adapté** : modèle visuel de la **Campagne** (voir `docs/campagne.md`). |
| **Clans, tournois, chat** | — | **Hors périmètre**. |
| **Boutique, gemmes, or, publicité** | — | **Hors périmètre** (aucune vraie monnaie, §0). |
| **Emotes** | Débloquées et équipées dans l'onglet Emotes. | **À reproduire** : 6 emotes fixes (§5.5). |

---

## 5. Tutoriel de Rush Royale (inspiration pour §5.0)

Déroulé de Rush Royale au premier lancement (de mémoire, *à confirmer dans le détail*) :

1. Le jeu ouvre **directement un combat** contre un adversaire scénarisé, sans menu ni texte d'accueil.
2. Une **main animée** pointe le bouton **Invoquer** ; le reste de l'écran est assombri ; seul ce bouton répond. Les premières invocations donnent des unités prévues.
3. Après deux invocations identiques, la main montre le **glisser** d'une unité sur sa jumelle ; la fusion donne une unité **différente** et le jeu le fait remarquer.
4. Une bulle montre le **bouton d'amélioration** d'une carte du deck, avec la main.
5. Arrivée du **boss** avec son annonce ; le joueur gagne sans pouvoir perdre.
6. Écran de victoire et récompenses, puis menus guidés : **ouvrir un coffre**, **améliorer une carte**, **mettre une carte dans le deck**, lancer le **premier vrai combat**.
7. Les fonctions avancées (talents, Coop, clans, héros) s'ouvrent plus tard avec une bulle unique quand elles se débloquent.

Principes à garder : **aucun texte long**, une action à la fois, tout le reste désactivé, un tirage truqué pour que la fusion arrive vite, et un premier combat impossible à perdre. Le prompt §5.0 suit déjà ce déroulé ; le moteur fournit `script.forcedSummons`, `enemyHpMultiplier`, `noLifeLoss` et `paused` pour le réaliser.

---

## 6. Checklist de fidélité (pour l'agent QA)

1. La grille fait 3 × 5 cases, au centre de l'écran, dans un cadre épais en relief.
2. Le chemin entoure la grille, entre par un portail et sort par une porte de château.
3. Le bouton **Invoquer** est en bas au centre, le plus gros, avec son coût visible.
4. Le mana est affiché à gauche du bouton Invoquer.
5. Le coût d'invocation vaut 10 puis augmente de 10 à chaque invocation.
6. Une invocation pose une unité aléatoire du deck, rang 1, sur une case vide aléatoire.
7. Le bouton Invoquer est grisé quand le mana manque ou que le plateau est plein.
8. Pendant un glisser, seules les unités identiques de même rang s'illuminent ; les autres s'assombrissent.
9. Une fusion donne une unité aléatoire du deck au rang +1, sur la case de destination.
10. Lâcher une unité hors d'une cible compatible la remet à sa place, sans rien coûter.
11. Deux unités au rang 7 ne peuvent pas fusionner.
12. Le rang se lit en pastilles sur le jeton (1 à 7).
13. La rangée des 5 cartes du deck sous le bouton sert aux améliorations, avec coût et badge de niveau (« MAX » au maximum).
14. Les améliorations coûtent 100, 200, 400 puis 700 et touchent toutes les unités de ce type.
15. Vies, vague et minuteur sont en haut ; la barre du boss apparaît seulement pendant le boss.
16. Un bandeau « 1 vague avant le boss X » apparaît la vague qui précède un boss ; un petit boss toutes les 5 vagues, un gros toutes les 10, et le lieutenant annonce « Le maître arrive dans 5 vagues ».
17. L'arrivée du boss déclenche une annonce plein écran et un tremblement d'écran.
18. Les chiffres de dégâts flottent ; les critiques sont plus gros et plus vifs.
19. Un appui long sur une unité ouvre sa bulle d'info sans bloquer la partie.
20. Aucun mode Duel/PvP n'existe ; en Coop, la rangée des 5 cartes de la partenaire (badges « MAX ») est en haut de l'écran.
21. En Coop, deux portails, deux branches qui longent chacune un plateau puis se rejoignent en un tronc commun vers la porte ; les boss arrivent par le tronc ; vies partagées.
22. Les boutons sont gros, arrondis, en dégradé, avec liseré sombre et ombre, et s'enfoncent à l'appui.
23. La navigation principale est une barre d'onglets en bas avec **Combat au centre**.
24. L'écran Deck montre les 5 cartes du deck en haut et la collection en grille à cadres de rareté avec barre de cartes.
25. La campagne se présente en cartes de niveau verticales (mini-scène, coffre, gros bouton « Jouer » jaune pour le suivant, bleu pour un niveau fait).
26. Les talents se choisissent 1 parmi 2 par palier et peuvent être changés hors combat.
27. Le tutoriel ouvre directement sur un combat, avec main animée, assombrissement et une seule action possible.
28. L'écran de fin montre victoire/défaite, récompenses qui volent et « Rejouer ».
