# Campagne Solo — 6 chapitres × 10 niveaux

> Rédigé par l'agent **Game design et stratégie** (§5.1 du prompt). Lu par l'agent **Campagne et progression** (`src/campaign/`) et l'agent **Interface**.
> Les chiffres sont un premier jet, à valider avec le simulateur (`docs/equilibrage.md`).

## 1. Présentation (modèle : écran « Donjons » de Rush Royale)

L'écran Campagne reprend l'écran **Donjons** de la capture `design/references/ecrans/rr-combat-coop-donjons.jpg` (à droite) :

- **En haut** : l'illustration du chapitre (la map principale avec ses héros et, en silhouette, le boss du chapitre), puis une **bannière titre en bois** avec deux écussons (« Chapitre 1 · New York ») et la jauge d'étoiles du chapitre (`12 / 30 ★`) avec ses 3 coffres d'étoiles.
- **Liste verticale de cartes de niveau** (comme « Étage 2 », « Étage 3 ») qui défile ; on arrive positionné sur le niveau suivant. Chaque carte montre :
  - le titre « Niveau 3 » en haut à gauche ;
  - une **mini-scène** : la map du niveau en fond, 2 ou 3 ennemis de la vague (et le sbire géant ou le boss pour les niveaux 5 et 10) ;
  - en haut à droite, à la place du coût d'entrée de Rush Royale : **le nombre de vagues à tenir** (icône de vague + « 6 ») ;
  - à droite, le **coffre de récompense**, avec une **coche verte** une fois obtenu ;
  - sous le titre, les **3 étoiles** (pleines ou vides) et l'icône de la contrainte bonus ;
  - un **gros bouton « Jouer »** : **jaune** pour le prochain niveau, **bleu** pour un niveau déjà fait (rejouer), cadenas gris pour un niveau verrouillé.
- Les niveaux 5 et 10 ont une carte **plus haute** avec un cadre rouge (couleur Boss `#c0263a`) et le portrait du sbire géant ou du boss.
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
- Un chapitre s'ouvre si le niveau 10 du chapitre précédent est gagné **et** si le total d'étoiles de la campagne atteint le seuil : ch. 2 = 0, ch. 3 = 30, ch. 4 = 60, ch. 5 = 95, ch. 6 = 130 (sur 180).
- La **Survie** s'ouvre à la fin du chapitre 1.

### Combat
- Configuration moteur (`GameConfig`) : `mode: 'solo'`, `targetWaves` = vagues à tenir, `mapId`, et `script.enemyHpMultiplier` = multiplicateur de PV du niveau.
- Les boss de la rotation arrivent normalement (vague 3, puis toutes les 3 vagues, §4.3) **sauf** sur les niveaux 5 et 10 où le boss est imposé (`script.bossId`, `script.bossAtWave`).
- Le niveau 10 est **gagné quand le boss est tué** (et non quand le minuteur de la dernière vague finit) ; son arrivée déclenche la transition vers son arène (§7 bis).
- **Mini-boss (niveau 5)** : un **sbire géant** du boss du chapitre. Il utilise l'ennemi de type `sbire` du boss, avec PV ×12 (au lieu de ×25 pour un boss), taille ×2, vitesse ×0,7, rage à 45 s, **sans pouvoir de boss** ; il retire toutes les vies s'il passe. L'agent moteur l'expose via `script.bossId` + un indicateur `miniBoss` à ajouter au contrat (demande au chef de projet), ou à défaut un boss à PV réduits par `enemyHpMultiplier`.
- Modificateurs de map : **désactivés** en campagne (sauf indication), pour que la difficulté reste lisible.

### Récompenses (§6.1)
- **Éclats** : +30 par étoile la **première fois**, +10 par étoile en rejouant (déjà dans le prompt).
- **Coffres d'étoiles** : 3 par chapitre, à 10, 20 et 30 étoiles du chapitre.
  - 10 ★ : 150 éclats + 5 cartes d'une unité possédée au hasard + **1 parchemin** ;
  - 20 ★ : 250 éclats + 10 cartes + **1 parchemin** ;
  - 30 ★ : 400 éclats + 1 tirage gratuit du pack au choix + **2 parchemins**.
- **Niveau 5** (mini-boss), première victoire : **1 parchemin** + 10 cartes d'une unité du deck.
- **Niveau 10** (boss), première victoire : **2 parchemins** + 300 éclats + le **personnage garanti** du chapitre. S'il est déjà possédé : 20 cartes de ce personnage.
- **Total des parchemins** par chapitre : 1 + 1 + 2 (coffres) + 1 (niv. 5) + 2 (niv. 10) = **7**, soit **42** pour la campagne. Un palier coûte 1 / 2 / 3 parchemins (`TALENT_TIER_SCROLLS`, `src/data/talents.ts`) : la campagne complète ouvre les 3 paliers d'environ **7 unités**, ce qui pousse à choisir. Des parchemins viennent aussi des paliers de Survie (10, 20, 30 vagues : 1, 1, 2).
- **XP de compte** : 20 par victoire + 10 par étoile nouvelle ; ×2 sur les niveaux 10.

### Courbe de difficulté
| Chapitre | Vagues | PV × | Niveau de collection attendu | Deck attendu |
|---|---|---|---|---|
| 1 | 3 → 9 | 0,55 → 0,85 | 1 à 2 | Deck de départ (5 Rares/Épique) |
| 2 | 6 → 12 | 0,85 → 1,0 | 2 à 3 | Départ + 1-2 Épiques |
| 3 | 8 → 12 | 1,0 → 1,15 | 3 à 5 | 1 Légendaire, premiers talents |
| 4 | 9 → 15 | 1,15 → 1,3 | 4 à 6 | 2 Légendaires, palier 1 de talents |
| 5 | 10 → 15 | 1,3 → 1,5 | 6 à 7 | Équipe complète, palier 2 |
| 6 | 12 → 15 | 1,5 → 1,8 | 7 à 9 | Deck « méta », palier 3 |

Cible pour le simulateur : avec le deck de départ (niveau 1, sans talent), **taux de victoire ≥ 90 %** sur les niveaux 1 à 9 du chapitre 1 et **≥ 70 %** sur le niveau 10 ; chaque niveau 10 du chapitre N doit être gagné à ≥ 60 % avec le « deck attendu » du chapitre N et à ≤ 30 % avec celui du chapitre N−1 (voir `docs/equilibrage.md`).

### Identifiants de map
Les identifiants ci-dessous sont proposés à l'agent Maps (à aligner sur `src/maps/` quand il les aura fixés) :
`toits-new-york`, `atelier-stark`, `base-avengers`, `asgard-bifrost`, `sanctum`, `temple-dix-anneaux`, `motunui`, `palais-imperial`, `zootopie`, `chambre-andy`, `sugar-rush`, `royaume-des-morts`, et les variantes `foret-pocahontas`, `highlands`, `atlantica`, `bayou`, `recif-nemo`, `tour-raiponce`, `foret-rox-rouky`. Les arènes sont celles de `src/data/bosses.ts` (`arene-bouffon`, etc.).

---

## 3. Les chapitres

Colonnes : **Niv.** · **Map** · **Vagues** à tenir · **PV×** (`enemyHpMultiplier`) · **Boss imposé** · **Contrainte ★★★** · **Récompense spéciale** (en plus des éclats d'étoiles).

### Chapitre 1 — New York
Boss du chapitre : **Bouffon Vert** (arène `arene-bouffon`). Mini-boss : **Citrouille volante géante**. Personnage garanti : **Spider-Man** s'il manque (deck Disney), sinon **Venom**.

| Niv. | Map | Vagues | PV× | Boss imposé | Contrainte ★★★ | Récompense spéciale |
|---|---|---|---|---|---|---|
| 1 | toits-new-york | 3 | 0,55 | — (boss de rotation à la vague 3, PV ×0,5) | Fusionner au moins 3 fois | — |
| 2 | toits-new-york | 4 | 0,6 | — | Sans perdre de vie | — |
| 3 | atelier-stark | 4 | 0,65 | — | Améliorer une unité au niveau 3 | — |
| 4 | atelier-stark | 5 | 0,7 | — | Atteindre une unité de rang 3 | — |
| 5 | toits-new-york | 5 | 0,7 | **Citrouille géante** (vague 5) | Mini-boss tué en moins de 30 s | 1 parchemin |
| 6 | base-avengers | 6 | 0,75 | — | Moins de 12 invocations | — |
| 7 | base-avengers | 6 | 0,75 | — | Sans perdre de vie | — |
| 8 | atelier-stark | 7 | 0,8 | — | Avec au moins 3 unités Marvel | — |
| 9 | toits-new-york | 8 | 0,8 | — | Garder 2 cases vides à la fin | — |
| 10 | toits-new-york → arène | 9 | 0,85 | **Bouffon Vert** (vague 9) | Boss tué en moins de 40 s | 2 parchemins, personnage garanti |

### Chapitre 2 — Asgard et le Sanctum
Boss : **Galactus** (`arene-galactus`). Mini-boss : **Drone cosmique géant** (volant : ignore ralentissements et déplacements forcés). Personnage garanti : **Thor**.

| Niv. | Map | Vagues | PV× | Boss imposé | Contrainte ★★★ | Récompense spéciale |
|---|---|---|---|---|---|---|
| 1 | asgard-bifrost | 6 | 0,85 | — | Sans perdre de vie | — |
| 2 | asgard-bifrost | 7 | 0,85 | — | Une unité de rang 4 | — |
| 3 | sanctum | 7 | 0,9 | — | Avec Doctor Strange ou Loki dans le deck | — |
| 4 | sanctum | 8 | 0,9 | — | Moins de 15 invocations | — |
| 5 | asgard-bifrost | 8 | 0,9 | **Drone cosmique géant** (vague 8) | Mini-boss tué en moins de 25 s | 1 parchemin |
| 6 | temple-dix-anneaux | 9 | 0,95 | — | Aucune amélioration au-delà du niveau 2 | — |
| 7 | temple-dix-anneaux | 9 | 0,95 | — | Sans perdre de vie | — |
| 8 | sanctum | 10 | 0,95 | — | Un bonus d'équipe actif | — |
| 9 | asgard-bifrost | 11 | 1,0 | — | Aucune unité détruite par Galactus | — |
| 10 | asgard-bifrost → arène | 12 | 1,0 | **Galactus** (vague 12) | Boss tué en moins de 35 s | 2 parchemins, personnage garanti |

### Chapitre 3 — L'Océan (Motunui et Atlantica)
Boss : **Ursula** (`arene-ursula`). Mini-boss : **Murène géante** (avance en duo avec une murène normale). Personnage garanti : **Vaïana & Pua**.

| Niv. | Map | Vagues | PV× | Boss imposé | Contrainte ★★★ | Récompense spéciale |
|---|---|---|---|---|---|---|
| 1 | motunui | 8 | 1,0 | — | Avec au moins 2 unités Disney | — |
| 2 | motunui | 8 | 1,0 | — | Sans perdre de vie | — |
| 3 | atlantica | 9 | 1,05 | — | Une unité de rang 5 | — |
| 4 | recif-nemo | 9 | 1,05 | — | Au moins 2 unités de contrôle (ralentir, arrêter, repousser) | — |
| 5 | atlantica | 9 | 1,05 | **Murène géante** (vague 9) | Mini-boss tué en moins de 25 s | 1 parchemin |
| 6 | recif-nemo | 10 | 1,1 | — | Moins de 18 invocations | — |
| 7 | motunui | 10 | 1,1 | — | Sans perdre de vie | — |
| 8 | atlantica | 11 | 1,1 | — | Bonus d'équipe Océan actif | — |
| 9 | recif-nemo | 11 | 1,15 | — | Finir avec 300 de mana ou plus | — |
| 10 | motunui → arène | 12 | 1,15 | **Ursula** (vague 12) | Boss tué en moins de 35 s | 2 parchemins, personnage garanti |

### Chapitre 4 — L'Empire (Palais impérial et Zootopie)
Boss : **Jafar & Iago** (`arene-jafar`). Mini-boss : **Cobra géant** (rapide, se faufile). Personnage garanti : **Mulan & Mushu**.

| Niv. | Map | Vagues | PV× | Boss imposé | Contrainte ★★★ | Récompense spéciale |
|---|---|---|---|---|---|---|
| 1 | palais-imperial | 9 | 1,15 | — | Sans perdre de vie | — |
| 2 | palais-imperial | 10 | 1,15 | — | Une unité de rang 5 | — |
| 3 | zootopie | 10 | 1,2 | — | Avec au moins 3 unités Disney | — |
| 4 | zootopie | 11 | 1,2 | — | Aucun blindé ne passe | — |
| 5 | palais-imperial | 11 | 1,2 | **Cobra géant** (vague 11) | Mini-boss tué en moins de 20 s | 1 parchemin |
| 6 | highlands | 12 | 1,25 | — | Moins de 20 invocations | — |
| 7 | zootopie | 12 | 1,25 | — | Sans perdre de vie | — |
| 8 | foret-pocahontas | 13 | 1,25 | — | Bonus d'équipe Princesses actif | — |
| 9 | palais-imperial | 14 | 1,3 | — | Une unité de rang 6 | — |
| 10 | palais-imperial → arène | 15 | 1,3 | **Jafar & Iago** (vague 15) | Boss tué en moins de 30 s | 2 parchemins, personnage garanti |

### Chapitre 5 — Le Monde des jouets (Chambre d'Andy et Sugar Rush)
Boss : **Cruella** (`arene-cruella`). Mini-boss : **Homme de main géant** (résistant, escorté de 2 hommes de main). Personnage garanti : **Buzz & Woody**.

| Niv. | Map | Vagues | PV× | Boss imposé | Contrainte ★★★ | Récompense spéciale |
|---|---|---|---|---|---|---|
| 1 | chambre-andy | 10 | 1,3 | — | Sans perdre de vie | — |
| 2 | chambre-andy | 11 | 1,3 | — | Bonus d'équipe Duos Pixar ou Animaux actif | — |
| 3 | sugar-rush | 11 | 1,35 | — | Aucun bouclier ne passe | — |
| 4 | sugar-rush | 12 | 1,35 | — | Une unité de rang 6 | — |
| 5 | chambre-andy | 12 | 1,35 | **Homme de main géant** (vague 12) | Mini-boss tué en moins de 20 s | 1 parchemin |
| 6 | foret-rox-rouky | 13 | 1,4 | — | Moins de 22 invocations | — |
| 7 | sugar-rush | 13 | 1,4 | — | Sans perdre de vie | — |
| 8 | chambre-andy | 14 | 1,45 | — | Aucune unité ne perd de rang (Cruella) | — |
| 9 | bayou | 14 | 1,5 | — | Avec au moins 1 unité de chaque pack | — |
| 10 | sugar-rush → arène | 15 | 1,5 | **Cruella** (vague 15) | Boss tué en moins de 30 s | 2 parchemins, personnage garanti |

### Chapitre 6 — Le Royaume des morts
Boss intermédiaire : **Maléfique** (niveau 8, `arene-malefique`). Mini-boss : **Garde gobelin géant** (armure 50 %). Boss final : **Thanos** (`arene-thanos`). Personnage garanti : **Coco (Miguel)**, plus le cadre de profil « Vainqueur de Thanos ».

| Niv. | Map | Vagues | PV× | Boss imposé | Contrainte ★★★ | Récompense spéciale |
|---|---|---|---|---|---|---|
| 1 | royaume-des-morts | 12 | 1,5 | — | Sans perdre de vie | — |
| 2 | royaume-des-morts | 12 | 1,55 | — | Une unité de rang 6 | — |
| 3 | tour-raiponce | 13 | 1,55 | — | Aucune unité endormie plus de 3 s (Raiponce conseillée) | — |
| 4 | royaume-des-morts | 13 | 1,6 | — | Moins de 24 invocations | — |
| 5 | tour-raiponce | 13 | 1,6 | **Garde gobelin géant** (vague 13) | Mini-boss tué en moins de 20 s | 1 parchemin |
| 6 | royaume-des-morts | 14 | 1,65 | — | Sans perdre de vie | — |
| 7 | highlands | 14 | 1,7 | — | Une unité de rang 7 | — |
| 8 | royaume-des-morts → arène | 14 | 1,7 | **Maléfique** (vague 12) | Boss tué en moins de 30 s | 1 parchemin |
| 9 | royaume-des-morts | 15 | 1,75 | — | Deux bonus d'équipe actifs | — |
| 10 | royaume-des-morts → Titan | 15 | 1,8 | **Thanos** (vague 15, PV ×2 des boss, Gant de l'infini, Claquement à 30 %) | Thanos tué sans perdre de vie | 2 parchemins, personnage garanti, cadre de profil |

Note : au niveau 10 du chapitre 6, les boss de rotation des vagues 3, 6, 9 et 12 restent présents ; seul le boss de la vague 15 est imposé (Thanos). Les Outriders arrivent à la vague 14.

---

## 4. Vérification par le simulateur

Pour chaque niveau, l'agent Campagne exporte sa configuration (`GameConfig`) et le simulateur (`scripts/simulate.ts`) joue 200 parties avec le deck attendu du chapitre (tableau du §2) et un joueur automatique simple (invoque dès que possible, fusionne le plus bas rang, améliore quand le mana dépasse le coût + 100). Résultats attendus :
- chapitre 1 avec le deck de départ niveau 1 : ≥ 90 % de victoires (niv. 1-9), ≥ 70 % (niv. 10) ;
- ★★★ atteignable dans ≥ 30 % des victoires (sinon la contrainte est trop dure) ;
- aucun niveau dont le taux de victoire **remonte** de plus de 15 points par rapport au niveau précédent du même chapitre (courbe régulière).
