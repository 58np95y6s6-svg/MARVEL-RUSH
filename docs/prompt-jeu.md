# Prompt de développement — Marvel Rush

> Copie tout ce qui suit dans un agent de code (Claude Code, Cursor…), idéalement ouvert dans le dépôt `MARVEL-RUSH`, qui contient les planches de personnages et le game design.

---

## 0. Ton rôle et l'objectif

Tu es un développeur de jeux web senior. Tu construis **Marvel Rush**, un clone jouable du jeu mobile **Rush Royale** (tower defense avec fusion d'unités), avec :

- les personnages **Marvel** et **Disney** du dépôt, dans le style graphique de ses planches ;
- un système de **tirages** avec deux packs, **Marvel** et **Disney** ;
- trois modes : **Solo**, **Coop à 2** et **Duel à 2** ;
- une **PWA** installable, accessible uniquement par un **lien secret** (usage privé entre deux personnes).

Toute l'interface est **en français**. Le jeu est **mobile d'abord**, en portrait, et doit être fluide sur un iPhone ou un Android récent.

Usage strictement personnel : pas de monétisation, pas de vraie monnaie, pas d'indexation publique.

---

## 1. Sources à lire dans le dépôt avant de coder

| Fichier | Ce que tu en tires |
|---|---|
| `design/game-design.md` | Rôles, attaques, compétences, boss, sbires et bonus d'équipe. C'est la **source de vérité du gameplay**. |
| `design/planches/1-marvel-a.html` à `4-disney-b.html` | Le **code SVG de chaque personnage** : fonction `draw(ctx)`, 3 poses (repos, préparation, frappe), effets, palette. |
| `design/planches/5-boss-sbires.html` | Le code SVG des 6 boss et de leurs sbires, dans le traitement « méchant » (visage dans l'ombre, yeux lumineux). |
| `design/references/style-*.jpg` | Les références de style : chibi, contours épais, ombrage cel-shading, reflets brillants. |

**Réutilise le code de dessin des planches.** Ne redessine pas les personnages. Extrais les primitives (`shaded`, `limb`, `hand`, `glow`, `burst`, `beam`, `bolt`, `sparks`, `mandala`, `face`, `mirror`…) et les fonctions `draw` de chaque personnage dans un module `src/art/`. Ce module génère, pour chaque unité, une chaîne SVG par pose (0 repos, 1 préparation, 2 frappe), que tu convertis en textures au chargement.

---

## 2. Stack technique imposée

- **Vite + TypeScript** (mode strict).
- **PixiJS v8** pour le plateau de jeu (canvas WebGL). Le reste de l'interface (menus, collection, tirages) est en HTML/CSS, avec Preact ou Vanilla TS.
- **Moteur de simulation pur TypeScript**, totalement séparé du rendu : il tourne à pas de temps fixe (20 ticks/s), sans accès au DOM. Il prend des **commandes** en entrée et produit un **état** et des **événements** en sortie. Il utilise un générateur aléatoire à **graine** (par exemple mulberry32).
- **Réseau : PeerJS** (WebRTC DataChannel, P2P, sans serveur de jeu). Isole-le derrière une interface `Transport` pour pouvoir le remplacer par Supabase Realtime si le P2P échoue sur certains réseaux.
- **PWA** : `vite-plugin-pwa` (manifest et service worker). Le mode Solo doit marcher hors ligne.
- **Stockage** : IndexedDB (via `idb-keyval`) pour le profil, la collection, les decks et la monnaie, avec une sauvegarde de secours dans `localStorage`.
- **Hébergement** : statique (GitHub Pages, Netlify ou Vercel). Déploiement en une commande, documenté dans le README.
- **Tests** : Vitest sur le moteur (fusion, mana, tirages, compétences, synchronisation).

---

## 3. Accès par lien secret

- Le site n'affiche le jeu que si l'URL contient la bonne clé : `https://<site>/#k=<CLE_SECRETE>`.
- La clé est définie au build (`VITE_ACCESS_KEY_HASH` = hash SHA-256 de la clé). Au chargement, l'app hache la clé de l'URL et la compare. Si elle est bonne, elle mémorise l'accès (IndexedDB) et retire la clé de la barre d'adresse.
- Sans la clé : une page neutre « Page introuvable », sans aucune mention du jeu.
- Ajoute `<meta name="robots" content="noindex,nofollow">` et un `robots.txt` qui interdit tout.
- Documente dans le README comment générer une clé et le lien à envoyer.
- Ce n'est pas une vraie sécurité, seulement une discrétion suffisante pour un usage privé. Dis-le dans le README.

---

## 4. Règles de combat (copie de Rush Royale)

### 4.1 Plateau
- Chaque joueur a une grille de **3 lignes × 5 colonnes** (15 cases).
- Les ennemis suivent un **chemin** qui longe le plateau. Toutes les unités du plateau peuvent toucher n'importe quel ennemi du chemin : la portée est globale, comme dans Rush Royale. Seule la stratégie de **ciblage** compte.
- **3 vies** par joueur. Un ennemi normal qui atteint la fin du chemin retire 1 vie. Un boss qui l'atteint retire toutes les vies.

### 4.2 Mana, invocation, fusion, amélioration
- La partie commence avec **100 de mana**. Chaque ennemi tué rapporte du mana : 10 pour un ennemi normal, 30 pour un gros, 100 pour un boss.
- **Invoquer** pose une unité **aléatoire de ton deck**, au **rang 1**, sur une **case vide aléatoire**. Le coût commence à **10** et augmente de **10** à chaque invocation.
- **Fusionner** : faire glisser une unité sur une unité **identique de même rang** donne une unité **aléatoire du deck** au **rang +1**, sur la case de destination. Le rang maximal est **7**, affiché par des pastilles (points) sur l'unité.
- **Améliorer en partie** : chaque unité du deck a un bouton d'amélioration (niveaux 1 à 5, coûts 100 / 200 / 400 / 700). Chaque niveau donne **+15 % de dégâts** à toutes les unités de ce type sur le plateau.
- **Effet du rang** : dégâts × rang. Certaines compétences progressent aussi avec le rang (voir le tableau).

### 4.3 Vagues
- Une vague dure **30 s** pendant lesquelles des ennemis apparaissent, suivie d'un **boss** à partir de la vague 3, puis toutes les 3 vagues.
- PV des ennemis : `100 × 1,18^(vague-1)`. PV des boss : `25 × PV d'un ennemi normal`.
- Types d'ennemis :
  - **normal** ;
  - **rapide** : vitesse ×2, PV ×0,5 ;
  - **gros** : vitesse ×0,6, PV ×3 ;
  - **blindé** : armure 30 % ;
  - **bouclier** : absorbe les 5 premiers coups.
- Les **sbires** du prochain boss arrivent dans la vague qui le précède, avec leurs particularités (voir `game-design.md`).

### 4.4 Boss
Six boss en rotation aléatoire. Chacun applique son **pouvoir toutes les 6 s** tant qu'il est en vie :

| Boss | Pouvoir |
|---|---|
| Jafar & Iago | Hypnose : 1 à 2 unités cessent d'attaquer pendant 4 s |
| Cruella | Vol de manteau : une unité perd 1 rang |
| Ursula | Contrat : échange la position de 2 unités, ce qui casse les combos d'adjacence |
| Maléfique | Sommeil maudit : endort une ligne entière pendant 3 s |
| Galactus | Dévoreur : détruit une unité aléatoire de rang ≤ 3 |
| Bouffon Vert | Bombes citrouilles : étourdit 3 unités pendant 2 s |

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

## 5. Les trois modes de jeu

### 5.1 Solo — Survie
- Un seul plateau. Il faut tenir le plus de vagues possible.
- Le meilleur score (vague atteinte) est enregistré localement.
- Fonctionne **hors ligne**.

### 5.2 Coop à 2 (comme la coop de Rush Royale)
- **Deux plateaux** : le tien en bas, celui de ton partenaire en haut, de part et d'autre d'un **chemin commun**. Les unités des deux joueurs attaquent les mêmes ennemis.
- **Vies partagées** (3). Le mana est individuel, et celui des éliminations va au joueur qui a donné le coup final.
- Les pouvoirs de boss visent un plateau au hasard.
- Score commun : la vague atteinte.
- **Échange d'unité** : un bouton « Offrir » envoie une unité de ton plateau sur une case vide du plateau de ton partenaire, une fois par vague.

### 5.3 Duel à 2 (comme le PvP de Rush Royale)
- Chaque joueur a **son propre chemin**, avec des vagues identiques (même graine).
- Chaque joueur a 3 vies. Les boss arrivent aux mêmes vagues pour les deux.
- Tu vois en haut le plateau de l'adversaire, en miniature et en lecture seule.
- Le premier à 0 vie perd. Si les deux tiennent jusqu'à la vague 15, c'est la mort subite : les PV des ennemis doublent à chaque vague.

### 5.4 Architecture du multijoueur
- **L'hôte fait autorité** : le joueur qui crée la partie fait tourner le moteur complet (les deux plateaux et le chemin).
- L'invité envoie seulement des **commandes** (`summon`, `merge {from,to}`, `powerup {unitId}`, `gift {slot}`, `emote`).
- L'hôte diffuse un **instantané compact** de l'état 10 fois par seconde, plus les **événements** (coups, éliminations, pouvoirs) pour que les effets visuels se déclenchent chez l'invité. L'invité interpole entre deux instantanés.
- Messages typés et versionnés (`{v:1, t:'snapshot', …}`). Gère la reconnexion : si l'invité revient dans les 30 s, il reprend la partie ; sinon l'hôte gagne (en duel) ou continue seul (en coop).
- **Salon** :
  1. Le joueur A choisit Coop ou Duel, puis « Créer une partie ».
  2. L'app génère un identifiant de salon et le lien `https://<site>/#k=<CLE>&room=<ID>` (la clé secrète est conservée).
  3. Le bouton « Inviter » ouvre le partage natif (Web Share API), ou copie le lien.
  4. Le joueur B ouvre le lien et arrive dans le salon.
  5. Chacun choisit son deck et clique sur « Prêt ».
  6. Compte à rebours de 3 s, puis début de la partie.
- **Emotes** rapides pendant la partie : 6 bulles avec les visages des personnages (« Bien joué ! », « Aide-moi ! », « Fusionne ! », « 😂 »…).

---

## 6. Collection, tirages et progression

### 6.1 Monnaie (fictive, aucun achat réel)
- **Éclats** : +100 par victoire en duel ou par vague 10 atteinte, +40 par défaite, +10 par vague en survie, et un coffre quotidien de +150.
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
- **Doublons** : ils deviennent des cartes de niveau. Il faut 2, 4, 8, 16… cartes pour passer chaque niveau, jusqu'au niveau 10. Améliorer un niveau coûte aussi des éclats.

### 6.3 Skins
- **3 skins par unité** : Classique, Hiver et Néon, obtenus par palette alternative appliquée au SVG.
- Le skin Hiver se débloque au niveau 5 de l'unité, le skin Néon au niveau 10. Il y a aussi 2 % de chance par tirage d'obtenir un skin aléatoire d'une unité possédée.

### 6.4 Decks
- **5 unités différentes** par deck, en mélangeant librement les packs. Jusqu'à 3 decks enregistrés.
- L'écran Deck montre les bonus d'équipe actifs ou presque actifs (« Il manque Thor pour Avengers 3 »).

Chaque appareil a sa propre collection. Ta copine et toi aurez chacun la vôtre.

---

## 7. Direction artistique

- **Exactement le style des planches du dépôt** : chibi, grosse tête, buste coupé à la taille, vue de face, contours épais `#1d1733`, ombrage cel-shading en deux tons, reflets blancs, ombre au sol.
- **Polices** : Lilita One pour les titres et les boutons, Nunito pour le texte.
- **Logo** : « MARVEL RUSH », jaune `#f6c64a` (« RUSH » en rouge `#e8413b`), contour sombre épais et relief, comme dans l'en-tête des planches.
- **Couleurs de rareté** : Rare `#3c8bf0`, Épique `#9b59e6`, Légendaire `#f2a93b`, Boss `#c0263a`.
- **Plateau** : cases arrondies façon jetons, fond clair. Le chemin est une piste pavée qui contourne la grille. Décor selon le mode : ville Marvel en solo, île océane en coop, arène en duel.
- **Unités sur le plateau** : jeton rond avec le personnage en buste, les **pastilles de rang** (1 à 7) en bas et un liseré de couleur de rareté.
- **Animation d'attaque** : alterne les textures de pose (repos → préparation → frappe), avec un léger écrasement-étirement et les effets de la planche (rayon, éclair, toile, bulles…), adaptés pour PixiJS (particules et sprites).
- **Ennemis** : les sbires des planches, plus des ennemis génériques dans le même style (créatures-feuilles, slimes, robots). Barre de PV au-dessus de chaque ennemi.
- **Boss** : grand sprite, barre de PV en haut de l'écran avec nom et portrait, annonce « BOSS ! » plein écran avec un tremblement de l'écran.
- **Retours visuels** : chiffres de dégâts flottants (critiques en gros et en jaune), fusion avec éclat et petit saut, invocation avec un portail lumineux.
- **Son** : effets simples (invocation, fusion, coups, boss, victoire) générés en WebAudio, avec un bouton muet.

---

## 8. Écrans

1. **Accueil** : logo animé, boutons **Solo**, **Coop à 2**, **Duel à 2**, puis **Tirages**, **Collection**, **Decks**, et un compteur d'éclats.
2. **Tirages** : les deux packs côte à côte, prix, taux, compteur de garantie.
3. **Collection** : grille de toutes les unités, celles qu'on n'a pas en silhouette. La fiche d'une unité montre sa boucle d'attaque animée, ses statistiques, sa compétence, son niveau, ses cartes et ses skins.
4. **Decks** : composition par glisser-déposer, bonus d'équipe.
5. **Salon multi** : créer, inviter, attendre, choix du deck, « Prêt ».
6. **Partie** :
   - en haut : vies, vague, minuteur, barre du boss ;
   - au milieu : chemin et plateau(x) ;
   - en bas : mana, bouton **Invoquer** avec son coût, les 5 boutons d'amélioration du deck, emotes.
7. **Fin de partie** : vague atteinte ou victoire/défaite, éclats gagnés, bouton « Rejouer » (qui renvoie au salon en multi).
8. **Réglages** : pseudo, son, vibrations, réinitialiser la sauvegarde (avec confirmation dans la page).

---

## 9. Organisation du code

```
src/
  art/        primitives et personnages SVG extraits des planches, skins, génération des textures
  data/       units.ts, bosses.ts, enemies.ts, teams.ts, packs.ts
  engine/     simulation pure : état, ticks, ciblage, compétences, vagues, boss, rng, commandes
  net/        Transport (PeerJS), protocole, hôte et invité, reconnexion
  render/     scène PixiJS, plateau, unités, ennemis, effets, interpolation
  ui/         écrans HTML/CSS
  meta/       collection, tirages, monnaie, decks, sauvegarde
  pwa/        manifest, icônes, service worker
  access/     vérification du lien secret
tests/        tests du moteur, des tirages et de la synchronisation
```

---

## 10. Étapes de livraison

Livre dans cet ordre. Chaque étape doit être jouable et testée, avec un commit par étape.

1. **Moteur et Solo** : plateau, invocation, fusion, mana, vagues, 6 unités Marvel, ennemis, un boss. Jouable en local.
2. **Toutes les unités et tous les boss** : les 28 unités, les 6 boss avec leurs sbires, les bonus d'équipe. Tests sur chaque compétence.
3. **Méta-jeu** : collection, packs Marvel et Disney, animation d'ouverture, decks, niveaux, skins, sauvegarde.
4. **Coop à 2** en P2P : salon, lien d'invitation, synchronisation, reconnexion.
5. **Duel à 2**.
6. **PWA et lien secret** : installation, hors ligne pour le Solo, `noindex`, page neutre sans la clé.
7. **Finitions** : sons, vibrations, performances (60 i/s visés avec 15 unités et 60 ennemis par plateau sur un téléphone moyen), README de déploiement.

---

## 11. Critères d'acceptation

- [ ] Ouvrir le site sans la clé affiche « Page introuvable » ; avec la clé, le jeu s'ouvre et l'accès est mémorisé.
- [ ] Le jeu s'installe sur l'écran d'accueil (iOS et Android) et le Solo marche en mode avion.
- [ ] Invocation, fusion (même unité et même rang uniquement), amélioration et coût croissant fonctionnent comme dans Rush Royale.
- [ ] Les 28 unités et les 6 boss ont leurs compétences et leurs animations, dans le style des planches.
- [ ] Les deux packs respectent les taux affichés et la garantie (testé sur 100 000 tirages simulés).
- [ ] Deux téléphones sur des réseaux différents (4G et Wi-Fi) jouent ensemble en Coop puis en Duel grâce au lien d'invitation, avec un décalage perçu inférieur à 150 ms.
- [ ] Si l'invité ferme l'onglet et revient dans les 30 s, la partie reprend.
- [ ] Toute l'interface est en français, lisible sur un écran de 375 px de large.

---

## 12. Ce que tu me rends à chaque étape

- Ce qui marche, comment le tester (commande et URL), et les limites connues.
- Pour l'étape 4 : la procédure exacte pour jouer à deux (créer, partager le lien, rejoindre).
- À la fin : le lien de déploiement à garder secret et la façon de changer la clé.
