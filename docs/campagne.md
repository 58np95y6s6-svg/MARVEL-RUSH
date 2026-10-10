# Campagne Solo — 9 chapitres × 10 niveaux (6 + 3 de l'extension DC)

> Rédigé par l'agent **Game design et stratégie** (§5.1 du prompt). Lu par l'agent **Campagne et progression** (`src/campaign/`) et l'agent **Interface**.
> Les chiffres sont un premier jet, à valider avec le simulateur (`docs/equilibrage.md`).

## 1. Présentation (modèle : écran « Donjons » de Rush Royale)

L'écran Campagne reprend l'écran **Donjons** de la capture `design/references/ecrans/rr-combat-coop-donjons.jpg` (à droite) :

- **En haut** : l'illustration du chapitre (la map principale avec ses héros et, en silhouette, le boss du chapitre), puis une **bannière titre en bois** avec deux écussons (« Chapitre 1 · New York ») et la jauge d'étoiles du chapitre (`12 / 30 ★`) avec ses 3 coffres d'étoiles.
- **Liste verticale de cartes de niveau** (comme « Étage 2 », « Étage 3 ») qui défile ; on arrive positionné sur le niveau suivant. Chaque carte montre :
  - le titre « Niveau 3 » en haut à gauche ;
  - une **mini-scène** : la map du niveau en fond, 2 ou 3 ennemis de la vague (et le lieutenant ou le boss pour les niveaux 5 et 10) ;
  - en haut à droite, à la place du coût d'entrée de Rush Royale : **le nombre de vagues à tenir** (icône de vague + « 15 ») ; la fiche du niveau donne aussi la durée estimée (≈ 0,55 min par vague) ;
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
- Configuration moteur (`GameConfig`) : `mode: 'solo'`, `targetWaves` = vagues à tenir, `mapId`, et les quatre réglages de difficulté du niveau (voir « Courbe de difficulté ») : `script.enemyHpMultiplier`, `script.enemyCountMultiplier`, `script.bossHpMultiplier`, `script.waveHpGrowth`.
- **Durée** (refonte d'octobre 2026, retour joueur : « des parties de 4 manches c'est trop ridicule ! C'est 10-15 minimum, et ça doit augmenter ») : **10 → 15 vagues au chapitre 1**, puis 15-20, 20-25, 25-30, 30-40 et 40-50. Dans un chapitre, les vagues montent de niveau en niveau ; les niveaux de boss (5 et 10) sont en haut de la fourchette. La campagne finit sur **Thanos à la vague 50** (niveau 6-10).
- **Rythme du prompt §4.3** : petit boss « lieutenant » aux vagues 5, 15, 25… ; gros boss aux vagues 10, 20, 30… ; Thanos seulement au dernier niveau. Tout niveau a donc au moins un lieutenant et un gros boss.
- **Gros boss avant le niveau 10** : tirés dans la rotation **sans le boss du chapitre** (`excludeBosses`), pour que celui-ci apparaisse pour la première fois au niveau 10. Le lieutenant d'une vague annonce toujours le gros boss suivant de la partie, même si le niveau finit avant.
- **Niveau 5** : le **lieutenant du boss du chapitre** est imposé **à la dernière vague** (`script.miniBoss` + `bossAtWave`) ; le niveau est **gagné quand il meurt** (`endOnBossKill`). Les vagues de petit boss d'avant gardent le lieutenant du gros boss suivant (`miniBoss` ne s'applique plus qu'à la vague désignée).
- **Niveau 10** : le **boss du chapitre** est imposé à la dernière vague, dans son arène (`bossId` + `bossAtWave`, même si cette vague est une vague de lieutenant du rythme, ex. vague 15 au chapitre 1) ; le niveau est **gagné quand il meurt**. Au chapitre 6 : **Maléfique** au niveau 8 (vague 48), **Thanos** au niveau 10 (vague 50).
- **Chapitres DC (7 à 9)** : les gros boss de la rotation sont tirés dans la rotation complète (11 boss, `bossPool: 'tous'`) sans le boss du chapitre ni le boss intermédiaire du niveau 8. Au chapitre 9, le boss final est **Darkseid** (vague 100).
- Modificateurs de map : **désactivés** en campagne, pour que la difficulté reste lisible.

### Sauvegarde et reprise
- Une partie de 15 à 50 vagues dure de 8 à 30 minutes : la partie Solo en cours (campagne **et** Solo Infini) est **sauvegardée au début de chaque vague ordinaire** à partir de la 2e (pas pendant un boss) : `engine.serialize()` + la configuration exacte vont dans `profile.savedGame` (`src/meta/savegame.ts`).
- L'accueil affiche alors **« Reprendre la partie »** (« Niveau 1-4 · vague 6 / 13 » ou « Solo Infini · vague 23 »), de même que l'écran Campagne en tête de liste ; la reprise (`#reprendre`) recrée le combat avec `createEngine(config, sauvegarde)`. Une seule partie à la fois : en lancer une autre remplace la sauvegarde à sa 2e vague.
- La sauvegarde est effacée à la fin de la partie (victoire ou défaite). Les statistiques des contraintes ★★★ repartent de la reprise (invocations, fusions…).

### Récompenses (§6.1)
Deux monnaies depuis octobre 2026 : l'**or** paie les montées de niveau, les **gemmes** paient les packs (détail et simulation : `docs/equilibrage.md` §6 bis).
- **Coffre de victoire** (ouvert avec une animation sur l'écran de résultats, puis récompenses détaillées) : rang selon le chapitre (1-2 **bois**, 3-4 **argent**, 5-6 **or**, 7-9 **héroïque**), **+1** si les 3 étoiles sont gagnées dans ce combat, **+1** au niveau 5, **+2** au niveau du boss (10, et 8 des ch. 6 à 9), plafonné à **légendaire**. **Rejouer** donne un coffre plus petit : un rang de moins, contenu × 0,5. Première victoire d'un niveau de boss : +10 ✦ (lieutenant) ou +20 ✦ (boss) dans le coffre. Contenu : beaucoup d'or, quelques gemmes, des cartes des héros possédés (deck actif en priorité), parfois un nouveau héros (`src/meta/chests.ts`).
- **Or des étoiles** : +20 par étoile la **première fois**, +8 par étoile en rejouant, **pour 10 vagues** (× vagues / 10, `lengthFactor`). **Gemmes** : +2 par étoile nouvelle. **Premières 3 étoiles** d'un niveau : +150 or et +5 gemmes.
- **Butin des boss** tués pendant le combat (même en cas de défaite) : +20 or par lieutenant, +60 par gros boss, +300 pour Thanos, +500 pour Darkseid.
- **Coffres d'étoiles** : 3 par chapitre, à 10, 20 et 30 étoiles du chapitre.
  - 10 ★ : 400 or + 40 gemmes + 5 cartes d'une unité possédée au hasard + **1 parchemin** ;
  - 20 ★ : 800 or + 60 gemmes + 10 cartes + **1 parchemin** ;
  - 30 ★ : 1 200 or + 80 gemmes + 1 tirage gratuit du pack au choix + **2 parchemins**.
- **Niveau 5** (lieutenant), première victoire : **1 parchemin** + 10 cartes d'une unité du deck.
- **Niveau 10** (boss), première victoire : **2 parchemins** + 100 gemmes + le **personnage garanti** du chapitre. S'il est déjà possédé : 20 cartes de ce personnage.
- **Total des parchemins** par chapitre : 1 + 1 + 2 (coffres) + 1 (niv. 5) + 2 (niv. 10) = **7**, soit **42** pour la campagne (**63** avec les 3 chapitres DC). Un palier coûte 1 / 2 / 3 parchemins (`TALENT_TIER_SCROLLS`, `src/data/talents.ts`) : la campagne complète ouvre les 3 paliers d'environ **7 unités**, ce qui pousse à choisir. Des parchemins viennent aussi des paliers du Solo Infini et de la Coop Infini (argent : 1, or : 2, héroïque : 3, puis 1 tous les 10).
- **Cristaux d'éveil** (§6.6) : 3 étoiles sur un niveau de boss (niveaux 5 et 10), la première fois : **25 ✦**.
- **XP de compte** : (20 par victoire + 10 par étoile nouvelle) × vagues / 10 ; ×2 sur les niveaux 10. Chaque niveau de compte se réclame sur la **Route des récompenses**.
- **Quêtes du jour** : « Gagne 3 niveaux de campagne », « Gagne 3 étoiles », « Bats 2 boss »… avancent avec chaque combat.
- **Totaux fixes d'une campagne à 3 étoiles** (`campaignTotals`, hors coffres de victoire tirés au hasard) : ≈ 33 200 or, 2 340 gemmes, 9 045 XP, **42 parchemins et 425 ✦**. Les 60 coffres de victoire (première victoire à 3 étoiles) ajoutent en moyenne ≈ 46 000 or et ≈ 1 400 gemmes, plus les cartes.

### Courbe de difficulté
Retour joueur : « L'évolution de la difficulté, c'est le nombre de sbires (les boss aussi) et leurs points de vie. » Chaque niveau règle donc (`src/campaign/levels.ts`, `DIFFICULTY`) :
- **Effectif×** (`enemyCountMultiplier`) : nombre d'ennemis par vague (l'intervalle d'apparition est divisé d'autant) ; de ×1,1 (niveau 1-1) à ×1,4 (niveau 6-10), en hausse régulière sur les 60 niveaux.
- **PV×** (`enemyHpMultiplier`) : PV de tous les ennemis, boss compris ; de ×1,3 à ×1,9.
- **PV boss×** (`bossHpMultiplier`) : PV des lieutenants et des gros boss, en plus ; de ×1,0 à ×1,3.
- **Croissance des PV par vague** (`waveHpGrowth`, Solo Infini : ×1,18) : plus douce dans les chapitres longs, pour que la vague 50 reste à la portée d'une collection de fin de campagne (au rythme du Solo Infini, une vague 50 aurait 3 300 fois les PV de la vague 1) : ch. 1 ×1,14, ch. 2 ×1,075, ch. 3 à 5 ×1,07, ch. 6 ×1,0425 ; extension DC : ch. 7 ×1,032, ch. 8 ×1,024, ch. 9 ×1,016 (§3 bis). Réglée au simulateur.

Les PV de base des premières vagues ont aussi été relevés (octobre 2026, « on one-shot quasi tous les sbires ») : 100 PV en vague 1 (au lieu de 70), soit 3 à 5 coups pour un héros de départ de rang 1 (moyenne 4), puis +18 % par vague ; en échange, moins d'apparitions au début (≈ 12 en vague 1 au lieu de 17, intervalle 2,6 s → 0,6 s à la vague 21). Voir `docs/equilibrage.md` §2 quater.

| Chapitre | Vagues | PV× | Effectif× | PV boss× | Croissance | Boss du niveau 10 | Niveau de collection attendu | Deck attendu (simulateur) |
|---|---|---|---|---|---|---|---|---|
| 1 | 10 → 15 | 1,30 → 1,39 | 1,10 → 1,15 | 1,00 → 1,05 | ×1,14 | vague 15 | 1 à 2 | Deck de départ, niveau 1 |
| 2 | 15 → 20 | 1,40 → 1,49 | 1,15 → 1,20 | 1,05 → 1,10 | ×1,075 | vague 20 | 2 à 3 | Départ + 1 Épique (Soldat de l'hiver), niveau 2 |
| 3 | 20 → 25 | 1,50 → 1,59 | 1,20 → 1,25 | 1,10 → 1,15 | ×1,07 | vague 25 | 3 à 5 | + Thor, niveau 4 |
| 4 | 25 → 30 | 1,61 → 1,70 | 1,25 → 1,30 | 1,15 → 1,20 | ×1,07 | vague 30 | 4 à 6 | 2 Légendaires, niveau 5, palier 1 |
| 5 | 30 → 40 | 1,71 → 1,80 | 1,30 → 1,35 | 1,20 → 1,25 | ×1,07 | vague 40 | 6 à 7 | Avengers (5), niveau 6, paliers 1-2 |
| 6 | 40 → 50 | 1,81 → 1,90 | 1,35 → 1,40 | 1,25 → 1,30 | ×1,0425 | vague 50 (Thanos) | 7 à 9 | Avengers (5), niveau 8, 3 paliers |
| 7 (DC) | 50 → 60 | 1,91 → 2,00 | 1,41 → 1,45 | 1,31 → 1,35 | ×1,032 | vague 60 (Joker) | 8 à 9 | Iron Man, Thor, Hulk, Cap + Superman, niveau 9, 3 paliers |
| 8 (DC) | 60 → 75 | 2,01 → 2,10 | 1,46 → 1,50 | 1,36 → 1,40 | ×1,024 | vague 75 (Lex Luthor) | 9 à 10 | Iron Man, Thor, Superman, Wonder Woman, Batman, niveau 10, ★2 |
| 9 (DC) | 75 → 100 | 2,11 → 2,21 | 1,51 → 1,55 | 1,41 → 1,45 | ×1,016 | vague 100 (Darkseid) | 10 | Iron Man, Thor, Superman, Batman, Green Lantern, niveau 10, ★4 |

Cibles pour le simulateur (`--campagne <c> --attendu`, joueur `--casual`) : chapitre 1 gagné à **≥ 85 %** par le deck de départ niveau 1 ; chaque chapitre gagné à **≥ 70 %** par la collection attendue ; le deck de départ niveau 1 doit **peiner dès le chapitre 3**. Résultats : §4.

### Identifiants de map
Les identifiants ci-dessous sont proposés à l'agent Maps (à aligner sur `src/maps/` quand il les aura fixés) :
`toits-new-york`, `atelier-stark`, `base-avengers`, `asgard-bifrost`, `sanctum`, `temple-dix-anneaux`, `motunui`, `palais-imperial`, `zootopie`, `chambre-andy`, `sugar-rush`, `royaume-des-morts`, et les variantes `foret-pocahontas`, `highlands`, `atlantica`, `bayou`, `recif-nemo`, `tour-raiponce`, `foret-rox-rouky`. Les arènes sont celles de `src/data/bosses.ts` (`arene-bouffon`, etc.).
Extension DC (identifiants de `src/maps/`) : `gotham-nuit`, `batcave`, `metropolis`, `themyscira`, `atlantis`, `oa`, et les arènes `arene-joker`, `arene-luthor`, `arene-bane`, `arene-sinestro`, `arene-blackadam`, `arene-darkseid` (Apokolips).

---

## 3. Les chapitres

Colonnes : **Niv.** · **Map** · **Vagues** à tenir · **PV×** (`enemyHpMultiplier`) · **Effectif×** (`enemyCountMultiplier`) · **PV boss×** (`bossHpMultiplier`) · **Boss** rencontrés (L = lieutenant, B = gros boss tiré dans la rotation sans le boss du chapitre ; en gras, le boss imposé de la dernière vague) · **Contrainte ★★★**. Récompenses spéciales : niveau 5, 1 parchemin + 10 cartes ; niveau 10, 2 parchemins + 100 gemmes + personnage garanti (ch. 6 : + cadre de profil et 100 ✦) , et à chaque victoire un coffre (bois → légendaire) ; voir §2.

### Chapitre 1 — New York
Boss : **Bouffon Vert** (`arene-bouffon`). Lieutenant : **Citrouille-bombe géante**. Personnage garanti : **Spider-Man** s'il manque (deck de départ Disney), sinon **Venom**.
Croissance des PV par vague : ×1,14.

| Niv. | Map | Vagues | PV× | Effectif× | PV boss× | Boss | Contrainte ★★★ |
|---|---|---|---|---|---|---|---|
| 1 | toits-new-york | 10 | 1,3 | 1,1 | 1 | L (5), B (10) | Fusionner au moins 3 fois |
| 2 | toits-new-york | 11 | 1,31 | 1,11 | 1,01 | L (5), B (10) | Sans perdre de vie |
| 3 | atelier-stark | 12 | 1,32 | 1,11 | 1,01 | L (5), B (10) | Améliorer une unité au niveau 3 |
| 4 | atelier-stark | 13 | 1,33 | 1,12 | 1,02 | L (5), B (10) | Atteindre une unité de rang 3 |
| 5 | toits-new-york | 15 | 1,34 | 1,12 | 1,02 | L (5), B (10), **L Citrouille-bombe géante** (15) | Lieutenant tué en moins de 25 s |
| 6 | base-avengers | 13 | 1,35 | 1,13 | 1,03 | L (5), B (10) | Moins de 30 invocations |
| 7 | base-avengers | 14 | 1,36 | 1,13 | 1,03 | L (5), B (10) | Sans perdre de vie |
| 8 | atelier-stark | 14 | 1,37 | 1,14 | 1,04 | L (5), B (10) | Avec au moins 3 unités Marvel |
| 9 | toits-new-york | 15 | 1,38 | 1,14 | 1,04 | L (5), B (10), L (15) | Garder 2 cases vides à la fin |
| 10 | toits-new-york → arène | 15 | 1,39 | 1,15 | 1,05 | L (5), B (10), **B Bouffon Vert** (15) | Boss tué en moins de 40 s |

### Chapitre 2 — Asgard et le Sanctum
Boss : **Galactus** (`arene-galactus`). Lieutenant : **Drone-sentinelle** (volant). Personnage garanti : **Thor**.
Croissance des PV par vague : ×1,075.

| Niv. | Map | Vagues | PV× | Effectif× | PV boss× | Boss | Contrainte ★★★ |
|---|---|---|---|---|---|---|---|
| 1 | asgard-bifrost | 15 | 1,4 | 1,15 | 1,05 | L (5), B (10), L (15) | Sans perdre de vie |
| 2 | asgard-bifrost | 16 | 1,41 | 1,16 | 1,06 | L (5), B (10), L (15) | Une unité de rang 4 |
| 3 | sanctum-sanctorum | 17 | 1,42 | 1,16 | 1,06 | L (5), B (10), L (15) | Avec Doctor Strange ou Loki dans le deck |
| 4 | sanctum-sanctorum | 18 | 1,43 | 1,17 | 1,07 | L (5), B (10), L (15) | Moins de 40 invocations |
| 5 | asgard-bifrost | 20 | 1,44 | 1,17 | 1,07 | L (5), B (10), L (15), **L Drone-sentinelle** (20) | Lieutenant tué en moins de 25 s |
| 6 | temple-dix-anneaux | 17 | 1,45 | 1,18 | 1,08 | L (5), B (10), L (15) | Aucune amélioration au-delà du niveau 2 |
| 7 | temple-dix-anneaux | 18 | 1,46 | 1,18 | 1,08 | L (5), B (10), L (15) | Sans perdre de vie |
| 8 | sanctum-sanctorum | 19 | 1,47 | 1,19 | 1,09 | L (5), B (10), L (15) | Un bonus d’équipe actif |
| 9 | asgard-bifrost | 20 | 1,48 | 1,19 | 1,09 | L (5), B (10), L (15), B (20) | Aucune unité détruite ou rétrogradée par un boss |
| 10 | asgard-bifrost → arène | 20 | 1,49 | 1,2 | 1,1 | L (5), B (10), L (15), **B Galactus** (20) | Boss tué en moins de 40 s |

### Chapitre 3 — L'Océan (Motunui et Atlantica)
Boss : **Ursula** (`arene-ursula`). Lieutenant : **Flotsam, la murène** (avec Jetsam). Personnage garanti : **Vaïana & Pua**.
Croissance des PV par vague : ×1,07.

| Niv. | Map | Vagues | PV× | Effectif× | PV boss× | Boss | Contrainte ★★★ |
|---|---|---|---|---|---|---|---|
| 1 | ile-motunui | 20 | 1,5 | 1,2 | 1,1 | L (5), B (10), L (15), B (20) | Avec au moins 2 unités Disney |
| 2 | ile-motunui | 21 | 1,51 | 1,21 | 1,11 | L (5), B (10), L (15), B (20) | Sans perdre de vie |
| 3 | atlantica | 22 | 1,52 | 1,21 | 1,11 | L (5), B (10), L (15), B (20) | Une unité de rang 5 |
| 4 | recif-nemo | 23 | 1,53 | 1,22 | 1,12 | L (5), B (10), L (15), B (20) | Au moins 2 unités de contrôle |
| 5 | atlantica | 25 | 1,54 | 1,22 | 1,12 | L (5), B (10), L (15), B (20), **L Flotsam, la murène** (25) | Flotsam tué en moins de 25 s |
| 6 | recif-nemo | 22 | 1,55 | 1,23 | 1,13 | L (5), B (10), L (15), B (20) | Moins de 50 invocations |
| 7 | ile-motunui | 23 | 1,56 | 1,23 | 1,13 | L (5), B (10), L (15), B (20) | Sans perdre de vie |
| 8 | atlantica | 24 | 1,57 | 1,24 | 1,14 | L (5), B (10), L (15), B (20) | Bonus d’équipe Océan actif |
| 9 | recif-nemo | 25 | 1,58 | 1,24 | 1,14 | L (5), B (10), L (15), B (20), L (25) | Finir avec 300 de mana ou plus |
| 10 | ile-motunui → arène | 25 | 1,59 | 1,25 | 1,15 | L (5), B (10), L (15), B (20), **B Ursula** (25) | Boss tué en moins de 40 s |

### Chapitre 4 — L'Empire (Palais impérial et Zootopie)
Boss : **Jafar & Iago** (`arene-jafar`). Lieutenant : **Cobra royal**. Personnage garanti : **Mulan & Mushu**.
Croissance des PV par vague : ×1,07.

| Niv. | Map | Vagues | PV× | Effectif× | PV boss× | Boss | Contrainte ★★★ |
|---|---|---|---|---|---|---|---|
| 1 | palais-imperial | 25 | 1,61 | 1,25 | 1,15 | L (5), B (10), L (15), B (20), L (25) | Sans perdre de vie |
| 2 | palais-imperial | 26 | 1,62 | 1,26 | 1,16 | L (5), B (10), L (15), B (20), L (25) | Une unité de rang 5 |
| 3 | zootopie | 27 | 1,63 | 1,26 | 1,16 | L (5), B (10), L (15), B (20), L (25) | Avec au moins 3 unités Disney |
| 4 | zootopie | 28 | 1,64 | 1,27 | 1,17 | L (5), B (10), L (15), B (20), L (25) | Aucun blindé ne passe |
| 5 | palais-imperial | 30 | 1,65 | 1,27 | 1,17 | L (5), B (10), L (15), B (20), L (25), **L Cobra royal** (30) | Cobra tué en moins de 25 s |
| 6 | highlands-rebelle | 27 | 1,66 | 1,28 | 1,18 | L (5), B (10), L (15), B (20), L (25) | Moins de 60 invocations |
| 7 | zootopie | 28 | 1,67 | 1,28 | 1,18 | L (5), B (10), L (15), B (20), L (25) | Sans perdre de vie |
| 8 | foret-pocahontas | 29 | 1,68 | 1,29 | 1,19 | L (5), B (10), L (15), B (20), L (25) | Bonus d’équipe Princesses actif |
| 9 | palais-imperial | 30 | 1,69 | 1,29 | 1,19 | L (5), B (10), L (15), B (20), L (25), B (30) | Une unité de rang 6 |
| 10 | palais-imperial → arène | 30 | 1,7 | 1,3 | 1,2 | L (5), B (10), L (15), B (20), L (25), **B Jafar & Iago** (30) | Boss tué en moins de 40 s |

### Chapitre 5 — Le Monde des jouets (Chambre d'Andy et Sugar Rush)
Boss : **Cruella** (`arene-cruella`). Lieutenant : **Jasper, l'homme de main**. Personnage garanti : **Buzz & Woody**.
Croissance des PV par vague : ×1,07.

| Niv. | Map | Vagues | PV× | Effectif× | PV boss× | Boss | Contrainte ★★★ |
|---|---|---|---|---|---|---|---|
| 1 | chambre-andy | 30 | 1,71 | 1,3 | 1,2 | L (5), B (10), L (15), B (20), L (25), B (30) | Sans perdre de vie |
| 2 | chambre-andy | 32 | 1,72 | 1,31 | 1,21 | L (5), B (10), L (15), B (20), L (25), B (30) | Bonus d’équipe Duos Pixar ou Animaux actif |
| 3 | sugar-rush | 34 | 1,73 | 1,31 | 1,21 | L (5), B (10), L (15), B (20), L (25), B (30) | Aucun bouclier ne passe |
| 4 | sugar-rush | 36 | 1,74 | 1,32 | 1,22 | L (5), B (10), L (15), B (20), L (25), B (30), L (35) | Une unité de rang 6 |
| 5 | chambre-andy | 40 | 1,75 | 1,32 | 1,22 | L (5), B (10), L (15), B (20), L (25), B (30), L (35), **L Jasper, l’homme de main** (40) | Jasper tué en moins de 25 s |
| 6 | foret-rox-rouky | 34 | 1,76 | 1,33 | 1,23 | L (5), B (10), L (15), B (20), L (25), B (30) | Moins de 75 invocations |
| 7 | sugar-rush | 36 | 1,77 | 1,33 | 1,23 | L (5), B (10), L (15), B (20), L (25), B (30), L (35) | Sans perdre de vie |
| 8 | chambre-andy | 38 | 1,78 | 1,34 | 1,24 | L (5), B (10), L (15), B (20), L (25), B (30), L (35) | Aucune unité ne perd de rang |
| 9 | bayou | 39 | 1,79 | 1,34 | 1,24 | L (5), B (10), L (15), B (20), L (25), B (30), L (35) | Avec au moins 1 unité de chaque pack |
| 10 | sugar-rush → arène | 40 | 1,8 | 1,35 | 1,25 | L (5), B (10), L (15), B (20), L (25), B (30), L (35), **B Cruella** (40) | Boss tué en moins de 40 s |

### Chapitre 6 — Le Royaume des morts
Boss intermédiaire : **Maléfique** (niveau 8, `arene-malefique`), lieutenant **Capitaine gobelin**. Boss final : **Thanos** (`arene-thanos`), lieutenant **Outrider alpha**. Personnage garanti : **Coco (Miguel)**, plus le cadre de profil « Vainqueur de Thanos ».
Croissance des PV par vague : ×1,0425.

| Niv. | Map | Vagues | PV× | Effectif× | PV boss× | Boss | Contrainte ★★★ |
|---|---|---|---|---|---|---|---|
| 1 | royaume-des-morts | 40 | 1,81 | 1,35 | 1,25 | L (5), B (10), L (15), B (20), L (25), B (30), L (35), B (40) | Sans perdre de vie |
| 2 | royaume-des-morts | 41 | 1,82 | 1,36 | 1,26 | L (5), B (10), L (15), B (20), L (25), B (30), L (35), B (40) | Une unité de rang 6 |
| 3 | tour-raiponce | 42 | 1,83 | 1,36 | 1,26 | L (5), B (10), L (15), B (20), L (25), B (30), L (35), B (40) | Aucune unité endormie plus de 3 s |
| 4 | royaume-des-morts | 44 | 1,84 | 1,37 | 1,27 | L (5), B (10), L (15), B (20), L (25), B (30), L (35), B (40) | Moins de 90 invocations |
| 5 | tour-raiponce | 45 | 1,85 | 1,37 | 1,27 | L (5), B (10), L (15), B (20), L (25), B (30), L (35), B (40), **L Capitaine gobelin** (45) | Capitaine tué en moins de 25 s |
| 6 | royaume-des-morts | 44 | 1,86 | 1,38 | 1,28 | L (5), B (10), L (15), B (20), L (25), B (30), L (35), B (40) | Sans perdre de vie |
| 7 | highlands-rebelle | 46 | 1,87 | 1,38 | 1,28 | L (5), B (10), L (15), B (20), L (25), B (30), L (35), B (40), L (45) | Une unité de rang 7 |
| 8 | royaume-des-morts → arène | 48 | 1,88 | 1,39 | 1,29 | L (5), B (10), L (15), B (20), L (25), B (30), L (35), B (40), L (45), **B Maléfique** (48) | Boss tué en moins de 40 s |
| 9 | royaume-des-morts | 48 | 1,89 | 1,39 | 1,29 | L (5), B (10), L (15), B (20), L (25), B (30), L (35), B (40), L (45) | Deux bonus d’équipe actifs |
| 10 | royaume-des-morts → arène | 50 | 1,9 | 1,4 | 1,3 | L (5), B (10), L (15), B (20), L (25), B (30), L (35), B (40), L (45), **B Thanos** (50) | Thanos tué sans perdre de vie |

---

## 3 bis. Extension DC Comics — chapitres 7 à 9

Les trois chapitres s'ouvrent après le chapitre 6 (Thanos vaincu) et les seuils d'étoiles du §2. Refonte d'octobre 2026 sur la structure longue (même règles que les chapitres 1 à 6) : **50 → 60 vagues** au chapitre 7, **60 → 75** au chapitre 8, **75 → 100** au chapitre 9, dont le niveau 10 finit sur **Darkseid à la vague 100**. Dans un chapitre, les vagues montent de niveau en niveau (les niveaux 5 et 10 en haut de la fourchette). Mêmes règles de boss : lieutenant du boss du chapitre imposé à la dernière vague du niveau 5, boss intermédiaire dans son arène à la dernière vague du niveau 8, boss du chapitre à la dernière vague du niveau 10 ; lieutenants aux vagues 5, 15, 25… et gros boss aux vagues 10, 20, 30… entre-temps (B rot. : rotation complète, 11 boss, sans le boss intermédiaire ni le boss du chapitre). Les lieutenants sont décrits dans `design/game-design.md` (§ Extension DC).

**Difficulté** : PV×, effectif× et PV boss× continuent la pente des 60 premiers niveaux (interpolation prolongée : niveau 9-10 à PV ×2,21, effectif ×1,55, PV boss ×1,45). Croissance des PV par vague : ch. 7 **×1,032**, ch. 8 **×1,024**, ch. 9 **×1,016** — chaque chapitre repart un peu en dessous de la fin du précédent puis le dépasse (PV d'un ennemi normal à la dernière vague : 7 700 au ch. 6, 7 800 au ch. 7, 9 700 au ch. 8, 11 800 au ch. 9). La croissance du ch. 9 est réglée pour que **Darkseid** (PV ×2, Rayons Oméga, Boom Tube et Équation d'Anti-Vie) soit battu par la collection attendue : à ×1,025, ses PV (5,2 M) le rendaient imbattable (0 %), le plafond de dégâts d'un plateau plein étant atteint vers la vague 80.

**Récompenses** : comme les chapitres 1 à 6 (§2), avec un **coffre de victoire héroïque** de base (légendaire sur les niveaux de boss) ; niveau 10 : 2 parchemins, 100 gemmes et le personnage garanti ; Darkseid vaincu (niveau 9-10) : **100 ✦** et le cadre de profil « Vainqueur de Darkseid ». Butin de boss en combat : Darkseid 500 or.

### Chapitre 7 — Gotham
Boss intermédiaire : **Bane** (niveau 8, `arene-bane`), lieutenant **Mercenaire géant**. Boss : **le Joker** (`arene-joker`), lieutenant **Clown géant**. Personnage garanti : **Batman** (s'il est déjà possédé : 20 cartes de Batman). Croissance des PV par vague : ×1,032.

| Niv. | Map | Vagues | PV× | Effectif× | PV boss× | Boss | Contrainte ★★★ |
|---|---|---|---|---|---|---|---|
| 1 | gotham-nuit | 50 | 1,91 | 1,41 | 1,31 | L tous les 5, B rot. tous les 10 ; B rot. (50) | Avec au moins 2 héros DC |
| 2 | gotham-nuit | 51 | 1,92 | 1,41 | 1,31 | L tous les 5, B rot. tous les 10 | Sans perdre de vie |
| 3 | batcave | 52 | 1,93 | 1,42 | 1,32 | L tous les 5, B rot. tous les 10 | Aucun bouclier ne passe |
| 4 | batcave | 54 | 1,94 | 1,42 | 1,32 | L tous les 5, B rot. tous les 10 | Une unité de rang 6 |
| 5 | gotham-nuit | 55 | 1,95 | 1,43 | 1,33 | L tous les 5, B rot. tous les 10 ; **L Clown géant** (55) | Clown tué en moins de 25 s |
| 6 | batcave | 54 | 1,96 | 1,43 | 1,33 | L tous les 5, B rot. tous les 10 | Moins de 100 invocations |
| 7 | gotham-nuit | 56 | 1,97 | 1,44 | 1,34 | L tous les 5, B rot. tous les 10 | Bonus d’équipe Bat-famille actif |
| 8 | batcave → arène | 58 | 1,98 | 1,44 | 1,34 | L tous les 5, B rot. tous les 10 ; **B Bane** (58) | Boss tué en moins de 40 s |
| 9 | gotham-nuit | 58 | 1,99 | 1,45 | 1,35 | L tous les 5, B rot. tous les 10 | Aucune unité ne perd de rang |
| 10 | gotham-nuit → arène | 60 | 2 | 1,45 | 1,35 | L tous les 5, B rot. tous les 10 ; **B Le Joker** (60) | Boss tué en moins de 40 s |

### Chapitre 8 — Metropolis et Themyscira
Boss intermédiaire : **Black Adam** (niveau 8, `arene-blackadam`), lieutenant **Soldat de Kahndaq géant**. Boss : **Lex Luthor** (`arene-luthor`), lieutenant **Robot LexCorp géant**. Personnage garanti : **Superman**. Croissance des PV par vague : ×1,024.

| Niv. | Map | Vagues | PV× | Effectif× | PV boss× | Boss | Contrainte ★★★ |
|---|---|---|---|---|---|---|---|
| 1 | metropolis | 60 | 2,01 | 1,46 | 1,36 | L tous les 5, B rot. tous les 10 ; B rot. (60) | Sans perdre de vie |
| 2 | metropolis | 62 | 2,02 | 1,46 | 1,36 | L tous les 5, B rot. tous les 10 | Aucun blindé ne passe |
| 3 | themyscira | 64 | 2,03 | 1,47 | 1,37 | L tous les 5, B rot. tous les 10 | Avec Wonder Woman dans le deck |
| 4 | atlantis | 67 | 2,04 | 1,47 | 1,37 | L tous les 5, B rot. tous les 10 | Une unité de rang 7 |
| 5 | metropolis | 70 | 2,05 | 1,48 | 1,38 | L tous les 5, B rot. tous les 10 ; **L Robot LexCorp géant** (70) | Robot tué en moins de 25 s |
| 6 | themyscira | 67 | 2,06 | 1,48 | 1,38 | L tous les 5, B rot. tous les 10 | Moins de 120 invocations |
| 7 | atlantis | 69 | 2,07 | 1,49 | 1,39 | L tous les 5, B rot. tous les 10 | Sans perdre de vie |
| 8 | themyscira → arène | 72 | 2,08 | 1,49 | 1,39 | L tous les 5, B rot. tous les 10 ; **B Black Adam** (72) | Boss tué en moins de 40 s |
| 9 | metropolis | 73 | 2,09 | 1,5 | 1,4 | L tous les 5, B rot. tous les 10 | Bonus d’équipe Justice League actif |
| 10 | metropolis → arène | 75 | 2,1 | 1,5 | 1,4 | L tous les 5, B rot. tous les 10 ; **B Lex Luthor** (75) | Boss tué en moins de 45 s |

### Chapitre 9 — Apokolips
Boss intermédiaire : **Sinestro** (niveau 8, `arene-sinestro`), lieutenant **Soldat Sinestro géant**. Boss final : **Darkseid** (`arene-darkseid`, Apokolips), lieutenant **Parademon géant**. Personnage garanti : **Green Lantern**, plus le cadre de profil « Vainqueur de Darkseid » et 100 ✦. Croissance des PV par vague : ×1,016.

| Niv. | Map | Vagues | PV× | Effectif× | PV boss× | Boss | Contrainte ★★★ |
|---|---|---|---|---|---|---|---|
| 1 | oa | 75 | 2,11 | 1,51 | 1,41 | L tous les 5, B rot. tous les 10 ; L (75) | Sans perdre de vie |
| 2 | oa | 80 | 2,12 | 1,51 | 1,41 | L tous les 5, B rot. tous les 10 ; B rot. (80) | Une unité de rang 7 |
| 3 | gotham-nuit | 85 | 2,13 | 1,52 | 1,42 | L tous les 5, B rot. tous les 10 ; L (85) | Aucun bouclier ne passe |
| 4 | metropolis | 90 | 2,14 | 1,52 | 1,42 | L tous les 5, B rot. tous les 10 ; B rot. (90) | Deux bonus d’équipe actifs |
| 5 | oa | 95 | 2,15 | 1,53 | 1,43 | L tous les 5, B rot. tous les 10 ; **L Soldat Sinestro géant** (95) | Soldat tué en moins de 25 s |
| 6 | themyscira | 85 | 2,16 | 1,53 | 1,43 | L tous les 5, B rot. tous les 10 ; L (85) | Moins de 150 invocations |
| 7 | atlantis | 90 | 2,17 | 1,54 | 1,44 | L tous les 5, B rot. tous les 10 ; B rot. (90) | Sans perdre de vie |
| 8 | oa → arène | 94 | 2,18 | 1,54 | 1,44 | L tous les 5, B rot. tous les 10 ; **B Sinestro** (94) | Boss tué en moins de 40 s |
| 9 | batcave | 97 | 2,19 | 1,55 | 1,45 | L tous les 5, B rot. tous les 10 | Avec au moins 1 héros de chaque pack (Marvel, Disney, DC) |
| 10 | oa → arène | 100 | 2,21 | 1,55 | 1,45 | L tous les 5, B rot. tous les 10 ; **B Darkseid** (100) | Darkseid tué sans perdre de vie |

Données : `src/campaign/levels.ts` (chapitres 7 à 9, `midBoss`, `bossPool: 'tous'` ; les chapitres 1 à 6 jouent la rotation `marvel-disney`). Configuration moteur d'un niveau 10 DC : `script: { enemyHpMultiplier, enemyCountMultiplier, bossHpMultiplier, waveHpGrowth, bossId, bossAtWave, endOnBossKill: true, excludeBosses: [boss du niveau 8, boss du chapitre] }` ; au chapitre 9, `bossId: 'darkseid'`, `bossAtWave: 100`.

---

## 4. Vérification par le simulateur

Commande : `npx vite-node scripts/simulate.ts -- 20 --campagne c3 --casual --attendu` (`--attendu` : deck, niveau de collection et paliers de talents attendus du chapitre, tableau `EXPECTED` du simulateur ; sans `--attendu`, le deck et `--level` donnés). Joueur `--casual` : réagit une fois par seconde, fusionne au hasard plateau plein, n'achète pas « Mana + » (proche d'un débutant). Sans `--casual` : joueur de référence.

Cibles : chapitre 1 gagné à ≥ 85 % par le deck de départ niveau 1 (`--casual`) ; chaque chapitre gagné à ≥ 70 % (`--casual`) avec la collection attendue ; le deck de départ niveau 1 doit peiner dès le chapitre 3.

Résultats (octobre 2026, refonte « parties longues » ; chapitres DC : profils Rush Royale, voir `docs/equilibrage.md` §2 sexies) — victoire moyenne du chapitre / pire niveau :

| Chapitre | Collection attendue | `--casual` (20 parties par niveau) | Joueur de référence (12 parties) | Deck de départ niveau 1, `--casual` (12 parties) |
|---|---|---|---|---|
| 1 (10-15 vagues) | départ, niv. 1 | **98 % / 85 %** (c1-n9) | 100 % / 100 % | = colonne de gauche (98 % / 83 %) |
| 2 (15-20) | + Soldat de l'hiver, niv. 2 | **95 % / 75 %** (c2-n8, c2-n9) | 99 % / 92 % | 88 % / 67 % |
| 3 (20-25) | + Thor, niv. 4 | **95 % / 85 %** (c3-n10) | 100 % / 100 % | **17 % / 0 %** (c3-n4 et suivants à 0-17 %) |
| 4 (25-30) | 2 Légendaires, niv. 5, palier 1 | **94 % / 80 %** (c4-n9) | 97 % / 83 % | — |
| 5 (30-40) | Avengers, niv. 6, paliers 1-2 | **97 % / 70 %** (c5-n10, Cruella) | 100 % / 100 % | — |
| 6 (40-50) | Avengers, niv. 8, 3 paliers | **99 % / 85 %** (c6-n10, Thanos) | 100 % / 100 % | — |
| 7 (50-60, DC) | méta + Superman, niv. 9, 3 paliers | **100 % / 100 %** (12 parties) | — | — |
| 8 (60-75, DC) | Iron Man, Thor, Superman, Wonder Woman, Batman, niv. 10, ★2 | **100 % / 100 %** (12 parties) | — | — |
| 9 (75-100, DC) | Iron Man, Thor, Superman, Batman, Green Lantern, niv. 10, ★4 | **99 % / 92 %** (c9-n10, Darkseid ; 12 parties) | — | — |

Lecture : les niveaux les plus durs d'un chapitre sont les niveaux 8-9 (dernière vague = gros boss tiré au hasard dans la rotation, à abattre avec tous les ennemis restants) et le niveau 10 (boss du chapitre ; Cruella et Thanos sont les plus solides). La ★★★ tombe à 0 % pour le joueur automatique sur les contraintes de deck (Doctor Strange ou Loki, unités Disney, bonus d'équipe, un de chaque pack) et de rang 6-7 (le joueur `--casual` fusionne au hasard) : c'est attendu.
