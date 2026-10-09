# Campagne Solo — 9 chapitres × 10 niveaux (6 + 3 de l'extension DC)

> Rédigé par l'agent **Game design et stratégie** (§5.1 du prompt). Lu par l'agent **Campagne et progression** (`src/campaign/`) et l'agent **Interface**.
> Les chiffres sont un premier jet, à valider avec le simulateur (`docs/equilibrage.md`).

## 1. Présentation (modèle : écran « Donjons » de Rush Royale)

L'écran Campagne reprend l'écran **Donjons** de la capture `design/references/ecrans/rr-combat-coop-donjons.jpg` (à droite) :

- **En haut** : l'illustration du chapitre (la map principale avec ses héros et, en silhouette, le boss du chapitre), puis une **bannière titre en bois** avec deux écussons (« Chapitre 1 · New York ») et la jauge d'étoiles du chapitre (`12 / 30 ★`) avec ses 3 coffres d'étoiles.
- **Liste verticale de cartes de niveau** (comme « Étage 2 », « Étage 3 ») qui défile ; on arrive positionné sur le niveau suivant. Chaque carte montre :
  - le titre « Niveau 3 » en haut à gauche ;
  - une **mini-scène** : la map du niveau en fond, 2 ou 3 ennemis de la vague (et le lieutenant ou le boss pour les niveaux 5 et 10) ;
  - en haut à droite, à la place du coût d'entrée de Rush Royale : **le nombre de vagues à tenir** (icône de vague + « 6 ») ;
  - à droite, le **coffre de récompense**, avec une **coche verte** une fois obtenu ;
  - sous le titre, les **3 étoiles** (pleines ou vides) et l'icône de la contrainte bonus ;
  - un **gros bouton « Jouer »** : **jaune** pour le prochain niveau, **bleu** pour un niveau déjà fait (rejouer), cadenas gris pour un niveau verrouillé.
- Les niveaux 5 et 10 ont une carte **plus haute** avec un cadre rouge (couleur Boss `#c0263a`) et le portrait du lieutenant (cadre argent) ou du boss (cadre rouge).
- En bas de la liste, la carte « Chapitre suivant » avec le personnage garanti à débloquer (silhouette) et le nombre d'étoiles requis.
- Toucher une carte ouvre une **fiche de niveau** : objectif, contrainte 3e étoile, boss attendu, récompenses, choix du deck, bouton « Jouer ».
- **Coût d'entrée** : aucun (les Donjons de Rush Royale coûtent des potions ; c'est hors périmètre).

## 2. Règles communes

### Étoiles
- ★ : **tenir toutes les vagues** du niveau (victoire). Une défaite ne donne rien.
- ★★ : victoire en gardant **au moins 2 vies**.
- ★★★ : victoire en respectant la **contrainte bonus** du niveau (indépendante de la 2e étoile : on peut avoir la 1re et la 3e sans la 2e ; le total compte).
- On garde le meilleur résultat de chaque étoile, gagnée séparément.

### Déblocage
- Les niveaux d'un chapitre s'ouvrent l'un après l'autre (victoire au niveau précédent).
- Un chapitre s'ouvre si le niveau 10 du chapitre précédent est gagné **et** si le total d'étoiles de la campagne atteint le seuil : ch. 2 = 0, ch. 3 = 30, ch. 4 = 60, ch. 5 = 95, ch. 6 = 130 (sur 180). **Extension DC** : ch. 7 = 165 (après Thanos), ch. 8 = 195, ch. 9 = 225 (sur 270).
- Le **Solo Infini** s'ouvre à la fin du chapitre 1.
- Le chapitre N de la **campagne Coop** s'ouvre quand les deux joueurs ont fini le chapitre N en Solo (`docs/campagne-coop.md`).

### Combat et rythme des boss
- Configuration moteur (`GameConfig`) : `mode: 'solo'`, `targetWaves` = vagues à tenir, `mapId`, et `script.enemyHpMultiplier` = multiplicateur de PV du niveau.
- **Rythme du prompt §4.3, sans exception** : petit boss « lieutenant » aux vagues 5, 15, 25… ; gros boss aux vagues 10, 20, 30… ; Thanos seulement au dernier niveau de la campagne. Les lieutenants sont décrits dans `design/game-design.md`.
- Un niveau de **moins de 5 vagues** n'a pas de boss ; de **5 à 9 vagues**, il croise le lieutenant de la vague 5 ; **à partir de 10 vagues**, il affronte au moins un gros boss.
- **Gros boss avant le niveau 10** : tirés dans la rotation **sans le boss du chapitre**, pour que celui-ci apparaisse pour la première fois au niveau 10. Le lieutenant d'une vague annonce toujours le gros boss suivant de la partie, même si le niveau finit avant.
- **Niveau 5** : le **lieutenant du boss du chapitre** est imposé (vague 5 ou 15) ; le niveau est **gagné quand il meurt**.
- **Niveau 10** : le **boss du chapitre** est imposé à la dernière vague (10 ou 20), dans son arène ; le niveau est **gagné quand il meurt**. Au chapitre 6, c'est **Thanos** (vague 20) ; au chapitre 9, **Darkseid** (vague 20).
- **Chapitres DC (7 à 9)** : les gros boss « rot. » sont tirés dans la rotation complète (11 boss, `bossPool: 'tous'`) sans le boss du chapitre ni le boss intermédiaire du niveau 8.
- Besoins de contrat (demande au chef de projet, `src/engine/types.ts`) : `script.bossOrder?: BossId[]` (ordre imposé des gros boss de la partie), `script.excludeBosses?: BossId[]` (boss retirés de la rotation) et `script.endOnBossKill?: boolean` (victoire à la mort du boss de la dernière vague). Le lieutenant se déduit du gros boss suivant.
- Modificateurs de map : **désactivés** en campagne, pour que la difficulté reste lisible.

### Récompenses (§6.1)
- **Éclats** : +30 par étoile la **première fois**, +10 par étoile en rejouant (déjà dans le prompt).
- **Coffres d'étoiles** : 3 par chapitre, à 10, 20 et 30 étoiles du chapitre.
  - 10 ★ : 150 éclats + 5 cartes d'une unité possédée au hasard + **1 parchemin** ;
  - 20 ★ : 250 éclats + 10 cartes + **1 parchemin** ;
  - 30 ★ : 400 éclats + 1 tirage gratuit du pack au choix + **2 parchemins**.
- **Niveau 5** (lieutenant), première victoire : **1 parchemin** + 10 cartes d'une unité du deck.
- **Niveau 10** (boss), première victoire : **2 parchemins** + 300 éclats + le **personnage garanti** du chapitre. S'il est déjà possédé : 20 cartes de ce personnage.
- **Total des parchemins** par chapitre : 1 + 1 + 2 (coffres) + 1 (niv. 5) + 2 (niv. 10) = **7**, soit **42** pour la campagne (**63** avec les 3 chapitres DC). Un palier coûte 1 / 2 / 3 parchemins (`TALENT_TIER_SCROLLS`, `src/data/talents.ts`) : la campagne complète ouvre les 3 paliers d'environ **7 unités**, ce qui pousse à choisir. Des parchemins viennent aussi des paliers du Solo Infini et de la Coop Infini (argent : 1, or : 2, héroïque : 3, puis 1 tous les 10).
- **Cristaux d'éveil** (§6.6) : 3 étoiles sur un niveau de boss (niveaux 5 et 10), la première fois : **25 ✦**.
- **XP de compte** : 20 par victoire + 10 par étoile nouvelle ; ×2 sur les niveaux 10.

### Courbe de difficulté
| Chapitre | Vagues | PV × | Boss du niveau 10 | Niveau de collection attendu | Deck attendu |
|---|---|---|---|---|---|
| 1 | 3 → 10 | 0,55 → 0,8 | vague 10 | 1 à 2 | Deck de départ |
| 2 | 5 → 13 | 0,85 → 1,0 | vague 10 | 2 à 3 | Départ + 1-2 Épiques |
| 3 | 8 → 20 | 0,95 → 1,05 | vague 20 | 3 à 5 | 1 Légendaire, premiers talents |
| 4 | 10 → 20 | 1,05 → 1,25 | vague 20 | 4 à 6 | 2 Légendaires, palier 1 |
| 5 | 12 → 20 | 1,25 → 1,5 | vague 20 | 6 à 7 | Équipe complète, palier 2 |
| 6 | 14 → 20 | 1,5 → 1,8 | vague 20 (Thanos) | 7 à 9 | Deck « méta », palier 3 |
| 7 (DC) | 15 → 20 | 1,8 → 2,1 | vague 20 (Joker) | 8 à 9 | Deck méta + 1-2 héros DC, palier 3, premiers éveils |
| 8 (DC) | 16 → 20 | 2,1 → 2,4 | vague 20 (Lex Luthor) | 9 à 10 | Équipe DC ou inter-univers, ★2 (passif 1) |
| 9 (DC) | 17 → 20 | 2,4 → 2,8 | vague 20 (Darkseid) | 10 | Deck complet, ★2 à ★4 sur 2-3 unités |

Cible pour le simulateur : avec le deck de départ (niveau 1, sans talent), **taux de victoire ≥ 90 %** sur les niveaux 1 à 9 du chapitre 1 et **≥ 70 %** sur le niveau 10 ; chaque niveau 10 du chapitre N doit être gagné à ≥ 60 % avec le « deck attendu » du chapitre N et à ≤ 30 % avec celui du chapitre N−1 (voir `docs/equilibrage.md`).

### Identifiants de map
Les identifiants ci-dessous sont proposés à l'agent Maps (à aligner sur `src/maps/` quand il les aura fixés) :
`toits-new-york`, `atelier-stark`, `base-avengers`, `asgard-bifrost`, `sanctum`, `temple-dix-anneaux`, `motunui`, `palais-imperial`, `zootopie`, `chambre-andy`, `sugar-rush`, `royaume-des-morts`, et les variantes `foret-pocahontas`, `highlands`, `atlantica`, `bayou`, `recif-nemo`, `tour-raiponce`, `foret-rox-rouky`. Les arènes sont celles de `src/data/bosses.ts` (`arene-bouffon`, etc.).
Extension DC (identifiants de `src/maps/`) : `gotham-nuit`, `batcave`, `metropolis`, `themyscira`, `atlantis`, `oa`, et les arènes `arene-joker`, `arene-luthor`, `arene-bane`, `arene-sinestro`, `arene-blackadam`, `arene-darkseid` (Apokolips).

---

## 3. Les chapitres

Colonnes : **Niv.** · **Map** · **Vagues** à tenir · **PV×** (`enemyHpMultiplier`) · **Boss** rencontrés (L = lieutenant, B = gros boss ; « rot. » = tiré dans la rotation sans le boss du chapitre) · **Contrainte ★★★** · **Récompense spéciale** (en plus des éclats d'étoiles).

### Chapitre 1 — New York
Boss : **Bouffon Vert** (`arene-bouffon`). Lieutenant : **Citrouille-bombe géante**. Personnage garanti : **Spider-Man** s'il manque (deck de départ Disney), sinon **Venom**.

| Niv. | Map | Vagues | PV× | Boss | Contrainte ★★★ | Récompense spéciale |
|---|---|---|---|---|---|---|
| 1 | toits-new-york | 3 | 0,55 | — | Fusionner au moins 3 fois | — |
| 2 | toits-new-york | 4 | 0,6 | — | Sans perdre de vie | — |
| 3 | atelier-stark | 4 | 0,65 | — | Améliorer une unité au niveau 3 | — |
| 4 | atelier-stark | 4 | 0,7 | — | Atteindre une unité de rang 3 | — |
| 5 | toits-new-york | 5 | 0,7 | **L Citrouille-bombe géante** (5) | Lieutenant tué en moins de 25 s | 1 parchemin |
| 6 | base-avengers | 6 | 0,7 | L rot. (5) | Moins de 12 invocations | — |
| 7 | base-avengers | 7 | 0,75 | L rot. (5) | Sans perdre de vie | — |
| 8 | atelier-stark | 8 | 0,75 | L rot. (5) | Avec au moins 3 unités Marvel | — |
| 9 | toits-new-york | 9 | 0,8 | L rot. (5) | Garder 2 cases vides à la fin | — |
| 10 | toits-new-york → arène | 10 | 0,8 | L Citrouille (5), **B Bouffon Vert** (10) | Boss tué en moins de 40 s | 2 parchemins, personnage garanti |

### Chapitre 2 — Asgard et le Sanctum
Boss : **Galactus** (`arene-galactus`). Lieutenant : **Drone-sentinelle** (volant). Personnage garanti : **Thor**.

| Niv. | Map | Vagues | PV× | Boss | Contrainte ★★★ | Récompense spéciale |
|---|---|---|---|---|---|---|
| 1 | asgard-bifrost | 6 | 0,85 | L rot. (5) | Sans perdre de vie | — |
| 2 | asgard-bifrost | 7 | 0,85 | L rot. (5) | Une unité de rang 4 | — |
| 3 | sanctum | 8 | 0,9 | L rot. (5) | Avec Doctor Strange ou Loki dans le deck | — |
| 4 | sanctum | 9 | 0,9 | L rot. (5) | Moins de 15 invocations | — |
| 5 | asgard-bifrost | 5 | 1,0 | **L Drone-sentinelle** (5) | Lieutenant tué en moins de 20 s | 1 parchemin |
| 6 | temple-dix-anneaux | 10 | 0,9 | L (5), B rot. (10) | Aucune amélioration au-delà du niveau 2 | — |
| 7 | temple-dix-anneaux | 11 | 0,95 | L (5), B rot. (10) | Sans perdre de vie | — |
| 8 | sanctum | 12 | 0,95 | L (5), B rot. (10) | Un bonus d'équipe actif | — |
| 9 | asgard-bifrost | 13 | 1,0 | L (5), B rot. (10) | Aucune unité détruite ou rétrogradée par un boss | — |
| 10 | asgard-bifrost → arène | 10 | 1,0 | L Drone (5), **B Galactus** (10) | Boss tué en moins de 35 s | 2 parchemins, personnage garanti |

### Chapitre 3 — L'Océan (Motunui et Atlantica)
Boss : **Ursula** (`arene-ursula`). Lieutenant : **Flotsam, la murène** (avec Jetsam). Personnage garanti : **Vaïana & Pua**.

| Niv. | Map | Vagues | PV× | Boss | Contrainte ★★★ | Récompense spéciale |
|---|---|---|---|---|---|---|
| 1 | motunui | 8 | 0,95 | L rot. (5) | Avec au moins 2 unités Disney | — |
| 2 | motunui | 10 | 0,95 | L (5), B rot. (10) | Sans perdre de vie | — |
| 3 | atlantica | 11 | 1,0 | L (5), B rot. (10) | Une unité de rang 5 | — |
| 4 | recif-nemo | 12 | 1,0 | L (5), B rot. (10) | Au moins 2 unités de contrôle (ralentir, arrêter, repousser) | — |
| 5 | atlantica | 15 | 0,95 | L (5), B rot. (10), **L Flotsam** (15) | Flotsam tué en moins de 20 s | 1 parchemin |
| 6 | recif-nemo | 13 | 1,0 | L (5), B rot. (10) | Moins de 20 invocations | — |
| 7 | motunui | 14 | 1,0 | L (5), B rot. (10) | Sans perdre de vie | — |
| 8 | atlantica | 15 | 1,05 | L (5), B rot. (10), L (15) | Bonus d'équipe Océan actif | — |
| 9 | recif-nemo | 16 | 1,05 | L (5), B rot. (10), L (15) | Finir avec 300 de mana ou plus | — |
| 10 | motunui → arène | 20 | 1,0 | L (5), B rot. (10), L Flotsam (15), **B Ursula** (20) | Ursula tuée en moins de 35 s | 2 parchemins, personnage garanti |

### Chapitre 4 — L'Empire (Palais impérial et Zootopie)
Boss : **Jafar & Iago** (`arene-jafar`). Lieutenant : **Cobra royal**. Personnage garanti : **Mulan & Mushu**.

| Niv. | Map | Vagues | PV× | Boss | Contrainte ★★★ | Récompense spéciale |
|---|---|---|---|---|---|---|
| 1 | palais-imperial | 10 | 1,05 | L (5), B rot. (10) | Sans perdre de vie | — |
| 2 | palais-imperial | 11 | 1,1 | L (5), B rot. (10) | Une unité de rang 5 | — |
| 3 | zootopie | 12 | 1,1 | L (5), B rot. (10) | Avec au moins 3 unités Disney | — |
| 4 | zootopie | 13 | 1,15 | L (5), B rot. (10) | Aucun blindé ne passe | — |
| 5 | palais-imperial | 15 | 1,15 | L (5), B rot. (10), **L Cobra royal** (15) | Cobra tué en moins de 20 s | 1 parchemin |
| 6 | highlands | 15 | 1,15 | L (5), B rot. (10), L (15) | Moins de 22 invocations | — |
| 7 | zootopie | 16 | 1,2 | L (5), B rot. (10), L (15) | Sans perdre de vie | — |
| 8 | foret-pocahontas | 17 | 1,2 | L (5), B rot. (10), L (15) | Bonus d'équipe Princesses actif | — |
| 9 | palais-imperial | 18 | 1,25 | L (5), B rot. (10), L (15) | Une unité de rang 6 | — |
| 10 | palais-imperial → arène | 20 | 1,25 | L (5), B rot. (10), L Cobra (15), **B Jafar & Iago** (20) | Boss tué en moins de 30 s | 2 parchemins, personnage garanti |

### Chapitre 5 — Le Monde des jouets (Chambre d'Andy et Sugar Rush)
Boss : **Cruella** (`arene-cruella`). Lieutenant : **Jasper, l'homme de main**. Personnage garanti : **Buzz & Woody**.

| Niv. | Map | Vagues | PV× | Boss | Contrainte ★★★ | Récompense spéciale |
|---|---|---|---|---|---|---|
| 1 | chambre-andy | 12 | 1,25 | L (5), B rot. (10) | Sans perdre de vie | — |
| 2 | chambre-andy | 13 | 1,3 | L (5), B rot. (10) | Bonus d'équipe Duos Pixar ou Animaux actif | — |
| 3 | sugar-rush | 14 | 1,3 | L (5), B rot. (10) | Aucun bouclier ne passe | — |
| 4 | sugar-rush | 15 | 1,35 | L (5), B rot. (10), L (15) | Une unité de rang 6 | — |
| 5 | chambre-andy | 15 | 1,35 | L (5), B rot. (10), **L Jasper** (15) | Jasper tué en moins de 20 s | 1 parchemin |
| 6 | foret-rox-rouky | 16 | 1,35 | L (5), B rot. (10), L (15) | Moins de 24 invocations | — |
| 7 | sugar-rush | 17 | 1,4 | L (5), B rot. (10), L (15) | Sans perdre de vie | — |
| 8 | chambre-andy | 18 | 1,45 | L (5), B rot. (10), L (15) | Aucune unité ne perd de rang | — |
| 9 | bayou | 19 | 1,5 | L (5), B rot. (10), L (15) | Avec au moins 1 unité de chaque pack | — |
| 10 | sugar-rush → arène | 20 | 1,5 | L (5), B rot. (10), L Jasper (15), **B Cruella** (20) | Boss tué en moins de 30 s | 2 parchemins, personnage garanti |

### Chapitre 6 — Le Royaume des morts
Boss intermédiaire : **Maléfique** (niveau 8, `arene-malefique`), lieutenant **Capitaine gobelin**. Boss final : **Thanos** (`arene-thanos`), lieutenant **Outrider alpha**. Personnage garanti : **Coco (Miguel)**, plus le cadre de profil « Vainqueur de Thanos ».

| Niv. | Map | Vagues | PV× | Boss | Contrainte ★★★ | Récompense spéciale |
|---|---|---|---|---|---|---|
| 1 | royaume-des-morts | 14 | 1,5 | L (5), B rot. (10) | Sans perdre de vie | — |
| 2 | royaume-des-morts | 15 | 1,55 | L (5), B rot. (10), L (15) | Une unité de rang 6 | — |
| 3 | tour-raiponce | 16 | 1,55 | L (5), B rot. (10), L (15) | Aucune unité endormie plus de 3 s | — |
| 4 | royaume-des-morts | 17 | 1,6 | L (5), B rot. (10), L (15) | Moins de 26 invocations | — |
| 5 | tour-raiponce | 15 | 1,6 | L (5), B rot. (10), **L Capitaine gobelin** (15) | Capitaine tué en moins de 20 s | 1 parchemin |
| 6 | royaume-des-morts | 18 | 1,65 | L (5), B rot. (10), L (15) | Sans perdre de vie | — |
| 7 | highlands | 19 | 1,7 | L (5), B rot. (10), L (15) | Une unité de rang 7 | — |
| 8 | royaume-des-morts → arène | 20 | 1,7 | L (5), B rot. (10), L Capitaine (15), **B Maléfique** (20) | Boss tué en moins de 30 s | 1 parchemin |
| 9 | royaume-des-morts | 20 | 1,75 | L (5), B rot. (10), L (15), B rot. (20) | Deux bonus d'équipe actifs | — |
| 10 | royaume-des-morts → Titan | 20 | 1,8 | L (5), B rot. (10), **L Outrider alpha** (15), **Thanos** (20) | Thanos tué sans perdre de vie | 2 parchemins, personnage garanti, cadre de profil, 100 ✦ (Thanos vaincu) |

Note : au niveau 10 du chapitre 6, Thanos remplace le gros boss de la vague 20 (exception de campagne au rythme « Thanos à la 50 », voulue par le prompt) ; les Outriders se mêlent aux vagues 18 et 19.

---

## 3 bis. Extension DC Comics — chapitres 7 à 9

Les trois chapitres s'ouvrent après le chapitre 6 (Thanos vaincu) et les seuils d'étoiles du §2. Même rythme : lieutenant au niveau 5, boss intermédiaire au niveau 8, gros boss au niveau 10 ; **Darkseid** au niveau 10 du chapitre 9. Les lieutenants sont décrits dans `design/game-design.md` (§ Extension DC).

### Chapitre 7 — Gotham
Boss intermédiaire : **Bane** (niveau 8, `arene-bane`), lieutenant **Mercenaire géant**. Boss : **le Joker** (`arene-joker`), lieutenant **Clown géant**. Personnage garanti : **Batman** (s'il est déjà possédé : 20 cartes de Batman).

| Niv. | Map | Vagues | PV× | Boss | Contrainte ★★★ | Récompense spéciale |
|---|---|---|---|---|---|---|
| 1 | gotham-nuit | 15 | 1,8 | L (5), B rot. (10), L (15) | Avec au moins 2 héros DC | — |
| 2 | gotham-nuit | 16 | 1,85 | L (5), B rot. (10), L (15) | Sans perdre de vie | — |
| 3 | batcave | 17 | 1,85 | L (5), B rot. (10), L (15) | Aucun bouclier ne passe (clowns à ballons) | — |
| 4 | batcave | 18 | 1,9 | L (5), B rot. (10), L (15) | Une unité de rang 6 | — |
| 5 | gotham-nuit | 15 | 1,9 | L (5), B rot. (10), **L Clown géant** (15) | Clown tué en moins de 20 s | 1 parchemin |
| 6 | batcave | 18 | 1,95 | L (5), B rot. (10), L (15) | Moins de 26 invocations | — |
| 7 | gotham-nuit | 19 | 2,0 | L (5), B rot. (10), L (15) | Bonus d'équipe Bat-famille actif | — |
| 8 | batcave → arène | 20 | 2,0 | L (5), B rot. (10), L Mercenaire (15), **B Bane** (20) | Bane tué avant son Venin (au-dessus de 50 % de PV pendant moins de 15 s) | 1 parchemin |
| 9 | gotham-nuit | 20 | 2,05 | L (5), B rot. (10), L (15), B rot. (20) | Aucune unité ne perd de rang | — |
| 10 | gotham-nuit → arène | 20 | 2,1 | L (5), B rot. (10), **L Clown géant** (15), **B Joker** (20) | Joker tué en moins de 30 s | 2 parchemins, personnage garanti |

### Chapitre 8 — Metropolis et Themyscira
Boss intermédiaire : **Black Adam** (niveau 8, `arene-blackadam`), lieutenant **Soldat de Kahndaq géant**. Boss : **Lex Luthor** (`arene-luthor`), lieutenant **Robot LexCorp géant**. Personnage garanti : **Superman**.

| Niv. | Map | Vagues | PV× | Boss | Contrainte ★★★ | Récompense spéciale |
|---|---|---|---|---|---|---|
| 1 | metropolis | 16 | 2,1 | L (5), B rot. (10), L (15) | Sans perdre de vie | — |
| 2 | metropolis | 17 | 2,15 | L (5), B rot. (10), L (15) | Aucun blindé ne passe (robots LexCorp) | — |
| 3 | themyscira | 18 | 2,15 | L (5), B rot. (10), L (15) | Avec Wonder Woman ou un bonus Trinité | — |
| 4 | atlantis | 18 | 2,2 | L (5), B rot. (10), L (15) | Une unité de rang 6 | — |
| 5 | metropolis | 15 | 2,2 | L (5), B rot. (10), **L Robot LexCorp géant** (15) | Robot tué en moins de 20 s | 1 parchemin |
| 6 | themyscira | 19 | 2,25 | L (5), B rot. (10), L (15) | Moins de 27 invocations | — |
| 7 | atlantis | 19 | 2,3 | L (5), B rot. (10), L (15) | Sans perdre de vie | — |
| 8 | themyscira → arène | 20 | 2,3 | L (5), B rot. (10), L Soldat de Kahndaq (15), **B Black Adam** (20) | Black Adam tué en moins de 30 s | 1 parchemin |
| 9 | metropolis | 20 | 2,35 | L (5), B rot. (10), L (15), B rot. (20) | Bonus Justice League actif | — |
| 10 | metropolis → arène | 20 | 2,4 | L (5), B rot. (10), **L Robot LexCorp géant** (15), **B Lex Luthor** (20) | Luthor tué en moins de 35 s (armure 30 %) | 2 parchemins, personnage garanti |

### Chapitre 9 — Apokolips
Boss intermédiaire : **Sinestro** (niveau 8, `arene-sinestro`), lieutenant **Soldat Sinestro géant**. Boss final : **Darkseid** (`arene-darkseid`, Apokolips), lieutenant **Parademon géant**. Personnage garanti : **Green Lantern**, plus le cadre de profil « Vainqueur de Darkseid ».

| Niv. | Map | Vagues | PV× | Boss | Contrainte ★★★ | Récompense spéciale |
|---|---|---|---|---|---|---|
| 1 | oa | 17 | 2,4 | L (5), B rot. (10), L (15) | Sans perdre de vie | — |
| 2 | oa | 18 | 2,45 | L (5), B rot. (10), L (15) | Une unité de rang 7 | — |
| 3 | gotham-nuit | 18 | 2,5 | L (5), B rot. (10), L (15) | Aucun volant ne passe (Corps Sinestro, Parademons) | — |
| 4 | metropolis | 19 | 2,5 | L (5), B rot. (10), L (15) | Deux bonus d'équipe actifs | — |
| 5 | oa | 15 | 2,55 | L (5), B rot. (10), **L Soldat Sinestro géant** (15) | Soldat tué en moins de 20 s | 1 parchemin |
| 6 | themyscira | 19 | 2,6 | L (5), B rot. (10), L (15) | Moins de 28 invocations | — |
| 7 | atlantis | 20 | 2,65 | L (5), B rot. (10), L (15), B rot. (20) | Sans perdre de vie | — |
| 8 | oa → arène | 20 | 2,65 | L (5), B rot. (10), L Soldat Sinestro (15), **B Sinestro** (20) | Aucune unité emprisonnée plus de 3 s | 1 parchemin |
| 9 | batcave | 20 | 2,7 | L (5), B rot. (10), L (15), B rot. (20) | Avec au moins 1 héros de chaque pack | — |
| 10 | oa → Apokolips | 20 | 2,8 | L (5), B rot. (10), **L Parademon géant** (15), **Darkseid** (20) | Darkseid tué sans perdre de vie | 2 parchemins, personnage garanti, cadre de profil, 100 ✦ (Darkseid vaincu) |

Configuration moteur des niveaux 10 DC : `script: { bossId, bossAtWave: 20, endOnBossKill: true, excludeBosses: [boss du niveau 8, boss du chapitre] }` ; au chapitre 9, `bossId: 'darkseid'` (PV ×2, Rayons Oméga et Boom Tube en alternance, Équation d'Anti-Vie à 30 %) ; les Parademons se mêlent aux vagues 18 et 19.

---

## 4. Vérification par le simulateur

Pour chaque niveau, l'agent Campagne exporte sa configuration (`GameConfig`) et le simulateur (`scripts/simulate.ts`) joue 200 parties avec le deck attendu du chapitre (tableau du §2) et un joueur automatique simple (invoque dès que possible, fusionne le plus bas rang, améliore quand le mana dépasse le coût + 100). Résultats attendus :
- chapitre 1 avec le deck de départ niveau 1 : ≥ 90 % de victoires (niv. 1-9), ≥ 70 % (niv. 10) ;
- ★★★ atteignable dans ≥ 30 % des victoires (sinon la contrainte est trop dure) ;
- aucun niveau dont le taux de victoire **remonte** de plus de 15 points par rapport au niveau précédent du même chapitre (courbe régulière).
