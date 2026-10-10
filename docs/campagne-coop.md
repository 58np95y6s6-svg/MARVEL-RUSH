# Campagne Coop — 9 chapitres × 10 niveaux à deux (6 + 3 de l'extension DC)

> Rédigé par l'agent **Game design et stratégie** (§5.2 du prompt, « Coop — Niveaux à gagner »). Lu par les agents **Campagne et progression**, **Réseau**, **Backend** et **Interface**.
> Base commune avec la campagne Solo : `docs/campagne.md` (présentation en cartes « Donjons », étoiles, identifiants de map). Seules les différences sont décrites ici. Chiffres à valider au simulateur (`docs/equilibrage.md`, `--coop-campaign`).

## 1. Règles propres à la Coop

### Plateau
- Deux plateaux (le tien en bas, celui de ta partenaire en haut), **deux portails**, deux branches qui longent chacune un plateau puis **se rejoignent au centre** en un tronc commun vers la porte du château (§5.2). Les maps utilisent leur tracé `pathCoop`.
- Toutes les unités des deux joueurs touchent tout ennemi. **Vies partagées (3)**, mana individuel (le coup final rapporte le mana), bouton « Offrir » une fois par vague.
- **Petits et gros boss arrivent par le tronc commun** ; leurs pouvoirs visent un plateau au hasard.
- Rythme des boss identique au Solo, **sans exception** : lieutenant aux vagues 5, 15, 25… ; gros boss aux vagues 10, 20, 30… ; Thanos au dernier niveau (chapitre 6, niveau 10, **vague 50**, comme en Solo). Les gros boss tirés avant le niveau 10 excluent le boss du chapitre.

### Difficulté
- **Refonte d'octobre 2026 (alignement sur la campagne Solo, `docs/campagne.md` §2)** : un niveau Coop compte **le même nombre de vagues** que le niveau Solo de même numéro (10 → 15 au chapitre 1, puis 15-20, 20-25, 25-30, 30-40, 40-50, Thanos à la vague 50), et reprend ses quatre réglages de difficulté : PV× (`enemyHpMultiplier`), effectif× (`enemyCountMultiplier`), PV des boss× (`bossHpMultiplier`) et croissance des PV par vague (`waveHpGrowth`). Les colonnes « Vagues » et « PV× » des tableaux du §3 datent de l'ancienne campagne courte (3 à 20 vagues) : elles seront recalculées quand la campagne Coop sera codée ; les cartes, maps et contraintes restent valables. Le boss ou lieutenant imposé des niveaux 5 et 10 arrive à la dernière vague du niveau. Les parties longues se sauvegardent à chaque vague (voir « Progression du duo »).
- Les vagues Coop sont **plus nombreuses et plus fortes** que celles du Solo : le moteur applique la base Coop (PV ×1,6 et 1,5 fois plus d'apparitions, répartis entre les deux portails ; réglage final par l'agent Moteur), puis les multiplicateurs du niveau.
- Le niveau visé suppose que **les deux joueurs** ont le niveau de collection attendu du chapitre Solo correspondant.

### Ouverture des chapitres
- Le chapitre N de la Coop s'ouvre quand **les deux joueurs** ont gagné le niveau 10 du chapitre N **en Solo**. L'écran Coop affiche, sur la carte du chapitre verrouillé, l'état de chacun (« Toi ✓ · Elle : chapitre 2, niveau 7 »).
- Dans un chapitre, les niveaux s'ouvrent l'un après l'autre (victoire au niveau précédent).
- Aucun seuil d'étoiles supplémentaire.

### Progression du duo
- La progression Coop (niveaux gagnés, étoiles) est **propre au duo** : elle est enregistrée à l'identique sur les deux profils liés (§5.4). Si un profil est lié à une nouvelle partenaire, la progression Coop de ce nouveau duo repart de zéro (l'ancienne est conservée, rattachée à l'ancien duo).
- Une partie Coop Niveaux peut être **arrêtée et reprise** à deux (sauvegarde à chaque vague par l'hôte, « Parties en cours »).

### Étoiles (communes au duo)
- ★ : tenir toutes les vagues (le niveau 5 et le niveau 10 se gagnent à la mort du boss imposé).
- ★★ : victoire en gardant **au moins 2 vies** partagées.
- ★★★ : victoire en respectant la **contrainte bonus**, souvent une contrainte d'entraide.
- Les étoiles sont **communes** : une étoile gagnée l'est pour le duo, sur les deux profils.

### Récompenses (pour chacun, sur son propre profil)
- **Coffre de victoire** et **or des étoiles** comme en Solo (`docs/campagne.md` §2 : +20 or par étoile la première fois, +8 en rejouant, +2 gemmes par étoile nouvelle), pour chacun.
- **Coffres d'étoiles Coop** : 3 par chapitre, à 10, 20 et 30 étoiles du chapitre, ouverts **par chacun** :
  - 10 ★ : 500 or + 50 gemmes + 10 cartes d'une unité possédée + 1 parchemin ;
  - 20 ★ : 1 000 or + 75 gemmes + 15 cartes + 1 parchemin ;
  - 30 ★ : 1 500 or + 100 gemmes + 1 tirage gratuit + 2 parchemins + 30 ✦.
- **Niveau 5** (lieutenant), première victoire : 1 parchemin chacun.
- **Niveau 10** (gros boss), première victoire : 2 parchemins + 100 gemmes chacun + **20 cartes d'une unité au choix** (la Coop ne donne pas de personnage garanti : il vient du Solo). Chapitre 6 : cadre de profil « Duo invincible » pour les deux.
- **Cristaux d'éveil** : 3 étoiles sur un niveau de boss (5 ou 10), la première fois : 25 ✦ chacun (même règle que la campagne Solo, §6.6). Thanos vaincu : 100 ✦ chacun.
- **XP** : comme le Solo, pour chacun.

### Contraintes d'entraide (★★★)
Vérifiables par le moteur à partir des événements (`gift`, `hit`, `kill`, `lifeLost`…) :
- « Offrir au moins N unités » (événement `gift`) ;
- « Chaque joueur fait au moins 35 % des dégâts » ;
- « Aucun ennemi ne passe par la branche du haut / du bas sans être touché par les deux joueurs » (simplifié : les deux joueurs ont touché le boss) ;
- « Les deux joueurs ont une unité de rang N » ;
- « Bonus d'équipe actif chez les deux joueurs » ;
- et les contraintes Solo (sans perdre de vie, boss tué en moins de N s, moins de N invocations chacun).

---

## 2. Les chapitres

Colonnes : **Niv.** · **Map** (tracé Coop) · **Vagues** · **PV×** · **Boss** (L = lieutenant, B = gros boss, « rot. » = rotation sans le boss du chapitre) · **Contrainte ★★★**.

### Chapitre 1 — New York (s'ouvre après le chapitre 1 Solo des deux joueurs)
Boss : **Bouffon Vert**. Lieutenant : **Citrouille-bombe géante**.

| Niv. | Map | Vagues | PV× | Boss | Contrainte ★★★ |
|---|---|---|---|---|---|
| 1 | toits-new-york | 6 | 0,6 | L rot. (5) | Offrir au moins 1 unité |
| 2 | toits-new-york | 7 | 0,65 | L rot. (5) | Sans perdre de vie |
| 3 | atelier-stark | 8 | 0,65 | L rot. (5) | Chaque joueur fait au moins 35 % des dégâts |
| 4 | atelier-stark | 9 | 0,7 | L rot. (5) | Les deux joueurs ont une unité de rang 3 |
| 5 | toits-new-york | 5 | 0,8 | **L Citrouille-bombe géante** (5) | Lieutenant tué en moins de 20 s |
| 6 | base-avengers | 10 | 0,7 | L (5), B rot. (10) | Offrir au moins 2 unités |
| 7 | base-avengers | 11 | 0,75 | L (5), B rot. (10) | Sans perdre de vie |
| 8 | atelier-stark | 12 | 0,75 | L (5), B rot. (10) | Moins de 15 invocations chacun |
| 9 | toits-new-york | 13 | 0,8 | L (5), B rot. (10) | Les deux joueurs ont touché chaque boss |
| 10 | toits-new-york → arène | 10 | 0,9 | L Citrouille (5), **B Bouffon Vert** (10) | Bouffon Vert tué en moins de 35 s |

### Chapitre 2 — Asgard et le Sanctum
Boss : **Galactus**. Lieutenant : **Drone-sentinelle**.

| Niv. | Map | Vagues | PV× | Boss | Contrainte ★★★ |
|---|---|---|---|---|---|
| 1 | asgard-bifrost | 9 | 0,85 | L rot. (5) | Offrir au moins 2 unités |
| 2 | asgard-bifrost | 10 | 0,85 | L (5), B rot. (10) | Sans perdre de vie |
| 3 | sanctum | 11 | 0,9 | L (5), B rot. (10) | Bonus d'équipe actif chez les deux joueurs |
| 4 | sanctum | 12 | 0,9 | L (5), B rot. (10) | Chaque joueur fait au moins 35 % des dégâts |
| 5 | asgard-bifrost | 15 | 0,85 | L (5), B rot. (10), **L Drone-sentinelle** (15) | Drone tué en moins de 20 s |
| 6 | temple-dix-anneaux | 13 | 0,95 | L (5), B rot. (10) | Moins de 18 invocations chacun |
| 7 | temple-dix-anneaux | 14 | 0,95 | L (5), B rot. (10) | Sans perdre de vie |
| 8 | sanctum | 15 | 1,0 | L (5), B rot. (10), L (15) | Les deux joueurs ont une unité de rang 5 |
| 9 | asgard-bifrost | 15 | 1,0 | L (5), B rot. (10), L (15) | Aucune unité détruite ou rétrogradée par un boss |
| 10 | asgard-bifrost → arène | 20 | 0,95 | L (5), B rot. (10), L Drone (15), **B Galactus** (20) | Galactus tué en moins de 35 s |

### Chapitre 3 — L'Océan
Boss : **Ursula**. Lieutenant : **Flotsam, la murène**.

| Niv. | Map | Vagues | PV× | Boss | Contrainte ★★★ |
|---|---|---|---|---|---|
| 1 | motunui | 12 | 0,95 | L (5), B rot. (10) | Au moins 2 unités Disney chez chaque joueur |
| 2 | motunui | 13 | 0,95 | L (5), B rot. (10) | Sans perdre de vie |
| 3 | atlantica | 14 | 1,0 | L (5), B rot. (10) | Offrir au moins 3 unités |
| 4 | recif-nemo | 15 | 1,0 | L (5), B rot. (10), L (15) | Chaque joueur fait au moins 35 % des dégâts |
| 5 | atlantica | 15 | 1,0 | L (5), B rot. (10), **L Flotsam** (15) | Flotsam tué en moins de 20 s |
| 6 | recif-nemo | 16 | 1,0 | L (5), B rot. (10), L (15) | Moins de 22 invocations chacun |
| 7 | motunui | 17 | 1,05 | L (5), B rot. (10), L (15) | Sans perdre de vie |
| 8 | atlantica | 18 | 1,05 | L (5), B rot. (10), L (15) | Bonus d'équipe Océan actif chez au moins un joueur |
| 9 | recif-nemo | 19 | 1,05 | L (5), B rot. (10), L (15) | Les deux joueurs ont une unité de rang 6 |
| 10 | motunui → arène | 20 | 1,05 | L (5), B rot. (10), L Flotsam (15), **B Ursula** (20) | Ursula tuée en moins de 35 s |

### Chapitre 4 — L'Empire
Boss : **Jafar & Iago**. Lieutenant : **Cobra royal**.

| Niv. | Map | Vagues | PV× | Boss | Contrainte ★★★ |
|---|---|---|---|---|---|
| 1 | palais-imperial | 14 | 1,05 | L (5), B rot. (10) | Sans perdre de vie |
| 2 | palais-imperial | 15 | 1,1 | L (5), B rot. (10), L (15) | Offrir au moins 3 unités |
| 3 | zootopie | 16 | 1,1 | L (5), B rot. (10), L (15) | Aucun blindé ne passe |
| 4 | zootopie | 17 | 1,15 | L (5), B rot. (10), L (15) | Chaque joueur fait au moins 35 % des dégâts |
| 5 | palais-imperial | 15 | 1,15 | L (5), B rot. (10), **L Cobra royal** (15) | Cobra tué en moins de 20 s |
| 6 | highlands | 18 | 1,15 | L (5), B rot. (10), L (15) | Moins de 24 invocations chacun |
| 7 | zootopie | 19 | 1,2 | L (5), B rot. (10), L (15) | Sans perdre de vie |
| 8 | foret-pocahontas | 20 | 1,2 | L (5), B rot. (10), L (15), B rot. (20) | Bonus d'équipe Princesses actif chez au moins un joueur |
| 9 | palais-imperial | 22 | 1,2 | L (5), B rot. (10), L (15), B rot. (20) | Les deux joueurs ont une unité de rang 6 |
| 10 | palais-imperial → arène | 20 | 1,25 | L (5), B rot. (10), L Cobra (15), **B Jafar & Iago** (20) | Boss tué en moins de 30 s |

### Chapitre 5 — Le Monde des jouets
Boss : **Cruella**. Lieutenant : **Jasper, l'homme de main**.

| Niv. | Map | Vagues | PV× | Boss | Contrainte ★★★ |
|---|---|---|---|---|---|
| 1 | chambre-andy | 16 | 1,25 | L (5), B rot. (10), L (15) | Sans perdre de vie |
| 2 | chambre-andy | 17 | 1,3 | L (5), B rot. (10), L (15) | Bonus Duos Pixar ou Animaux chez un joueur |
| 3 | sugar-rush | 18 | 1,3 | L (5), B rot. (10), L (15) | Aucun bouclier ne passe |
| 4 | sugar-rush | 20 | 1,3 | L (5), B rot. (10), L (15), B rot. (20) | Offrir au moins 4 unités |
| 5 | chambre-andy | 15 | 1,35 | L (5), B rot. (10), **L Jasper** (15) | Jasper tué en moins de 20 s |
| 6 | foret-rox-rouky | 21 | 1,35 | L (5), B (10), L (15), B (20) | Moins de 26 invocations chacun |
| 7 | sugar-rush | 22 | 1,4 | L (5), B (10), L (15), B (20) | Sans perdre de vie |
| 8 | chambre-andy | 23 | 1,4 | L (5), B (10), L (15), B (20) | Aucune unité ne perd de rang |
| 9 | bayou | 24 | 1,45 | L (5), B (10), L (15), B (20) | Un joueur Marvel majoritaire, l'autre Disney majoritaire |
| 10 | sugar-rush → arène | 30 | 1,3 | L (5), B rot. (10), L (15), B rot. (20), L Jasper (25), **B Cruella** (30) | Cruella tuée en moins de 30 s |

### Chapitre 6 — Le Royaume des morts
Boss intermédiaire : **Maléfique** (niveau 8). Boss final : **Thanos** (niveau 10, vague 30), lieutenant **Outrider alpha** (vague 25).

| Niv. | Map | Vagues | PV× | Boss | Contrainte ★★★ |
|---|---|---|---|---|---|
| 1 | royaume-des-morts | 20 | 1,45 | L (5), B (10), L (15), B (20) | Sans perdre de vie |
| 2 | royaume-des-morts | 21 | 1,5 | L, B, L, B | Les deux joueurs ont une unité de rang 6 |
| 3 | tour-raiponce | 22 | 1,5 | L, B, L, B | Aucune unité endormie plus de 3 s |
| 4 | royaume-des-morts | 23 | 1,55 | L, B, L, B | Offrir au moins 5 unités |
| 5 | tour-raiponce | 15 | 1,6 | L (5), B rot. (10), **L Capitaine gobelin** (15) | Capitaine tué en moins de 20 s |
| 6 | royaume-des-morts | 24 | 1,6 | L, B, L, B | Chaque joueur fait au moins 35 % des dégâts |
| 7 | highlands | 25 | 1,65 | L, B, L, B, L (25) | Sans perdre de vie |
| 8 | royaume-des-morts → arène | 20 | 1,65 | L (5), B rot. (10), L Capitaine (15), **B Maléfique** (20) | Maléfique tuée en moins de 30 s |
| 9 | royaume-des-morts | 28 | 1,7 | L, B, L, B, L (25) | Deux bonus d'équipe actifs (un chez chaque joueur) |
| 10 | royaume-des-morts → Titan | 30 | 1,7 | L (5), B (10), L (15), B (20), **L Outrider alpha** (25), **Thanos** (30) | Thanos tué sans perdre de vie |

---

## 2 bis. Extension DC Comics — chapitres 7 à 9

Le chapitre N (7, 8 ou 9) de la Coop s'ouvre quand les deux joueurs ont gagné le niveau 10 du chapitre N en Solo (`docs/campagne.md`, §3 bis). Même rythme : lieutenant au niveau 5 (vague 15), boss intermédiaire au niveau 8 (vague 20), gros boss au niveau 10 (vague 30, annoncé par son lieutenant à la vague 25) ; **Darkseid** au niveau 10 du chapitre 9. Gros boss « rot. » tirés dans la rotation complète (11 boss) sans les boss du chapitre. Récompenses identiques aux chapitres 1 à 6 ; le niveau 10 du chapitre 9 donne en plus le cadre « Duo cosmique » et **100 ✦** chacun (Darkseid vaincu).

### Chapitre 7 — Gotham
Boss intermédiaire : **Bane** (niveau 8). Boss : **le Joker** (niveau 10, vague 30), lieutenant **Clown géant** (vague 25).

| Niv. | Map | Vagues | PV× | Boss | Contrainte ★★★ |
|---|---|---|---|---|---|
| 1 | gotham-nuit | 20 | 1,7 | L (5), B (10), L (15), B (20) | Au moins 2 héros DC chez chaque joueur |
| 2 | gotham-nuit | 21 | 1,75 | L, B, L, B | Sans perdre de vie |
| 3 | batcave | 22 | 1,75 | L, B, L, B | Aucun bouclier ne passe |
| 4 | batcave | 23 | 1,8 | L, B, L, B | Offrir au moins 5 unités |
| 5 | gotham-nuit | 15 | 1,8 | L (5), B rot. (10), **L Clown géant** (15) | Clown tué en moins de 20 s |
| 6 | batcave | 24 | 1,85 | L, B, L, B | Chaque joueur fait au moins 35 % des dégâts |
| 7 | gotham-nuit | 25 | 1,9 | L, B, L, B, L (25) | Bonus Bat-famille actif chez au moins un joueur |
| 8 | batcave → arène | 20 | 1,9 | L (5), B rot. (10), L Mercenaire (15), **B Bane** (20) | Bane tué en moins de 30 s |
| 9 | gotham-nuit | 28 | 1,95 | L, B, L, B, L (25) | Aucune unité ne perd de rang |
| 10 | gotham-nuit → arène | 30 | 2,0 | L (5), B (10), L (15), B (20), **L Clown géant** (25), **B Joker** (30) | Joker tué en moins de 30 s |

### Chapitre 8 — Metropolis et Themyscira
Boss intermédiaire : **Black Adam** (niveau 8). Boss : **Lex Luthor** (niveau 10, vague 30), lieutenant **Robot LexCorp géant** (vague 25).

| Niv. | Map | Vagues | PV× | Boss | Contrainte ★★★ |
|---|---|---|---|---|---|
| 1 | metropolis | 21 | 2,0 | L, B, L, B | Sans perdre de vie |
| 2 | metropolis | 22 | 2,05 | L, B, L, B | Aucun blindé ne passe |
| 3 | themyscira | 23 | 2,05 | L, B, L, B | Bonus Trinité ou Justice League chez au moins un joueur |
| 4 | atlantis | 24 | 2,1 | L, B, L, B | Les deux joueurs ont une unité de rang 6 |
| 5 | metropolis | 15 | 2,1 | L (5), B rot. (10), **L Robot LexCorp géant** (15) | Robot tué en moins de 20 s |
| 6 | themyscira | 25 | 2,15 | L, B, L, B, L (25) | Offrir au moins 5 unités |
| 7 | atlantis | 26 | 2,2 | L, B, L, B, L (25) | Sans perdre de vie |
| 8 | themyscira → arène | 20 | 2,2 | L (5), B rot. (10), L Soldat de Kahndaq (15), **B Black Adam** (20) | Black Adam tué en moins de 30 s |
| 9 | metropolis | 28 | 2,25 | L, B, L, B, L (25) | Chaque joueur fait au moins 35 % des dégâts |
| 10 | metropolis → arène | 30 | 2,3 | L (5), B (10), L (15), B (20), **L Robot LexCorp géant** (25), **B Lex Luthor** (30) | Luthor tué en moins de 35 s |

### Chapitre 9 — Apokolips
Boss intermédiaire : **Sinestro** (niveau 8). Boss final : **Darkseid** (niveau 10, vague 30, à la place du gros boss de cette vague), lieutenant **Parademon géant** (vague 25).

| Niv. | Map | Vagues | PV× | Boss | Contrainte ★★★ |
|---|---|---|---|---|---|
| 1 | oa | 22 | 2,3 | L, B, L, B | Sans perdre de vie |
| 2 | oa | 23 | 2,35 | L, B, L, B | Les deux joueurs ont une unité de rang 7 |
| 3 | gotham-nuit | 24 | 2,4 | L, B, L, B | Aucun volant ne passe |
| 4 | metropolis | 25 | 2,4 | L, B, L, B, L (25) | Offrir au moins 6 unités |
| 5 | oa | 15 | 2,45 | L (5), B rot. (10), **L Soldat Sinestro géant** (15) | Soldat tué en moins de 20 s |
| 6 | themyscira | 26 | 2,5 | L, B, L, B, L (25) | Chaque joueur fait au moins 35 % des dégâts |
| 7 | atlantis | 27 | 2,55 | L, B, L, B, L (25) | Sans perdre de vie |
| 8 | oa → arène | 20 | 2,55 | L (5), B rot. (10), L Soldat Sinestro (15), **B Sinestro** (20) | Aucune unité emprisonnée plus de 3 s |
| 9 | batcave | 29 | 2,6 | L, B, L, B, L (25) | Deux bonus d'équipe actifs (un chez chaque joueur) |
| 10 | oa → Apokolips | 30 | 2,6 | L (5), B (10), L (15), B (20), **L Parademon géant** (25), **Darkseid** (30) | Darkseid tué sans perdre de vie |

---

## 3. Vérification au simulateur

Simulateur `--coop-campaign <chapitre>` : deux joueurs automatiques, chacun avec le « deck attendu » du chapitre Solo correspondant (`docs/campagne.md`, §2), 200 parties par niveau. Cibles :
- taux de victoire **≥ 80 %** sur les niveaux 1-9 et **≥ 60 %** sur le niveau 10 de chaque chapitre ;
- avec un seul des deux joueurs au niveau attendu et l'autre au chapitre précédent : **≥ 50 %** (le duo doit pouvoir porter un joueur en retard) ;
- contraintes ★★★ atteintes dans **≥ 30 %** des victoires ;
- aucun joueur ne fait plus de **65 %** des dégâts en moyenne.
