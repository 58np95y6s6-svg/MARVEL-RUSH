# Plan d'équilibrage

> Rédigé par l'agent **Game design et stratégie**. Données concernées : `src/data/units.ts`, `bosses.ts`, `enemies.ts`, `teams.ts`, `talents.ts`. Outil : le simulateur headless `scripts/simulate.ts` (agent Moteur).
> Critère de fin du §1 bis : **1 000 parties par deck**, et **aucun deck ne domine** : l'écart de vague moyenne entre le meilleur et le moins bon deck de référence de même niveau reste **< 20 %**.

## 1. Principes

1. **Une rareté = une bande de puissance, pas un saut.** Comme dans Rush Royale, une Rare bien placée doit rester jouable en fin de campagne ; un Légendaire apporte surtout une **mécanique** (zone, contrôle de masse, anti-boss) plutôt que des dégâts bruts.
2. **Chaque unité a un rôle clair** (dégâts monocible, zone, contrôle, soutien, économie, anti-boss). Un deck qui couvre 3 rôles doit battre un deck de 5 dégâts purs sur les vagues tardives.
3. **Les boss sont le vrai test.** Rythme du prompt §4.3 : petit boss « lieutenant » toutes les 5 vagues, gros boss toutes les 10, Thanos à la 50. Un deck sans réponse aux boss (dégâts monocible ou anti-contrôle) doit tomber sur le gros boss de la vague 10 ou 20 ; les decks de contrôle pur doivent tomber sur les boss, pas sur les vagues.
4. **On équilibre avec un seul fichier par catégorie** et des multiplicateurs, jamais en codant des exceptions dans le moteur.
5. **Ordre de réglage** : ennemis et vagues → unités de rareté Rare (deck de départ) → Épiques → Légendaires → équipes → talents → boss.

## 2. Rôle et bande de puissance par unité

**Indice de puissance (IP)** : on part du **deck témoin** (deck de départ Marvel, niveau 1, sans talent), on remplace l'unité la plus faible du témoin par l'unité testée, et on mesure la vague moyenne en Solo Infini (1 000 parties). IP = vague moyenne obtenue / vague moyenne du témoin. Pour une unité du témoin, on la remplace par Falcon (ou par Tiana si c'est Falcon).

Bandes cibles (au même niveau de collection) :
- **Rare** : IP 0,95 – 1,05 ;
- **Épique** : IP 1,03 – 1,12 ;
- **Légendaire** : IP 1,08 – 1,18 ;
- aucune unité au-dessus de **1,20** (alerte « trop forte »), aucune sous **0,92** (alerte « inutile »).

DPS brut de départ (rang 1, niveau 1, sans compétence) = dégâts / cadence ; donné pour repère.

| Unité | Rareté | Rôle cible | DPS brut | Bande cible | Points de vigilance |
|---|---|---|---|---|---|
| Iron Man | Légendaire | Dégâts + zone en ligne | 37,5 | 1,10 – 1,16 | L'Uni-Beam sur toute une ligne peut écraser les vagues denses ; surveiller la part de dégâts du Beam (< 45 %). |
| Spider-Man | Épique | Contrôle (ralentir, immobiliser) | 20 | 1,03 – 1,08 | Immobilisation en chaîne = blocage total ; limiter à 1 immobilisation par ennemi toutes les 3 s si besoin. |
| Hulk | Légendaire | Zone + étourdissement | 37,5 | 1,10 – 1,16 | Rage + Smash : vérifier le DPS à la 60e seconde d'un boss. |
| Thor | Légendaire | Dégâts en chaîne | ~61 (3 cibles) | 1,10 – 1,16 | Fort sur les vagues, faible sur boss seul ; c'est voulu. |
| Doctor Strange | Épique | Contrôle de position | 15 | 1,03 – 1,08 | Le Portail sauve des vies ; mesurer « vies sauvées » plutôt que les dégâts. |
| Venom | Épique | Exécution + montée en puissance | 35 | 1,05 – 1,12 | Bonus par élimination plafonné ; inefficace sur boss, voulu. |
| Captain Marvel | Rare | Dégâts monocible (pic) | 27,8 | 0,98 – 1,05 | Rare la plus forte en dégâts : rester sous 1,05. |
| Captain America | Légendaire | Soutien + rebonds | 20 × 3 | 1,08 – 1,14 | La valeur dépend du placement ; le joueur auto doit placer au centre. |
| Loki | Épique | Imprévisible | 22,5 | 1,03 – 1,08 | Sa transformation copie le meilleur du deck : IP très variable, viser l'écart-type. |
| Soldat de l'hiver | Épique | Critique + étourdissement | 37,5 (moyenne) | 1,05 – 1,10 | Équipe Les Agents (+30 % de critiques) le pousse fort. |
| Œil de faucon | Rare | Polyvalent | 25,7 | 0,97 – 1,03 | Bonne Rare de base, sans pic. |
| Falcon | Rare | Soutien (marque) | 25 | 0,95 – 1,02 | Valeur qui grandit avec les dégâts du deck ; c'est l'unité de remplacement du témoin. |
| Black Widow | Épique | Anti-boss | 28 (56 vs boss) | 1,04 – 1,10 | Mesurer le temps de mort des boss avec / sans elle (−20 % visé). |
| Shang-Chi | Épique | Multi-cibles aléatoires | 30 + anneaux | 1,05 – 1,10 | Les anneaux ne doivent pas tout nettoyer avant la vague 10. |
| Vaïana & Pua | Épique | Contrôle (repousser) | 15 | 1,03 – 1,08 | Comme Strange : mesurer les vies sauvées. |
| Maui | Légendaire | Dégâts alternés | 33 (×2,5 requin) | 1,10 – 1,16 | Vérifier que les deux formes ont une valeur proche sur 16 s. |
| Pocahontas & Meeko | Rare | Soutien (cadence) + mana | 12,5 | 0,95 – 1,02 | IP calculé avec placement au centre. |
| Mulan & Mushu | Légendaire | Brûlure + nettoyage par vague | 30 (+60 % brûlure) | 1,10 – 1,16 | Avalanche = filet de sécurité ; une seule par vague. |
| Rebelle | Rare | Monocible sur la tête | 48,9 (crit) | 0,98 – 1,05 | DPS brut élevé mais monocible : à surveiller sur les boss. |
| Ariel & Sébastien | Épique | Contrôle de masse | 11 | 1,03 – 1,08 | Saignement plafonné sur boss (`bleedBossFactor`). |
| Rox & Rouky | Rare | Dégâts monocible | ~52 | 0,98 – 1,05 | Le doublé sur même cible rend Rox très bon contre les boss ; ajuster `secondHitBonus` d'abord. |
| Tiana & Naveen | Rare | Économie | 8 | 0,95 – 1,02 | Mesurer le mana total gagné (+10 à 15 % visé). |
| Nemo & Dory | Rare | Aléatoire | 20 | 0,95 – 1,02 | Écart-type élevé accepté. |
| Coco (Miguel) | Épique | Soutien anti-boss (restaure) | 10 | 1,03 – 1,08 | Sa valeur n'apparaît que contre Cruella et Galactus : rapporter l'IP par boss. |
| Nick & Judy | Épique | Contrôle + malus d'armure | 20 | 1,03 – 1,08 | Fort contre les blindés et Maléfique (gobelins). |
| Buzz & Woody | Légendaire | Perçant + contrôle | 27,5 (ligne) | 1,08 – 1,14 | Laser perçant : mesurer le nombre moyen d'ennemis touchés. |
| Raiponce & Pascal | Épique | Anti-contrôle de boss | 12 | 1,03 – 1,08 | Valeur contre Jafar, Maléfique, Bouffon Vert, Thanos. |
| Vanellope & Ralph | Légendaire | Anti-blindés/boucliers + soutien mobile | 32 | 1,08 – 1,14 | Téléportation aléatoire : écart-type élevé accepté. |

**Talents** : chaque option d'un palier doit donner un IP **dans ±3 %** de l'autre option du même palier (sinon le choix n'en est pas un). Gain cible par palier par rapport à l'unité sans talent : palier 1 ≈ +3 %, palier 2 ≈ +4 %, palier 3 ≈ +6 %.

**Équipes** : un bonus d'équipe actif doit valoir **+5 à +10 %** de vague moyenne par rapport au même deck sans bonus (mesuré en neutralisant le bonus). Avengers (5) reste ≤ +12 %.

**Niveau de collection** (+10 % de dégâts par niveau) : un deck niveau 10 doit tenir environ **+60 %** de vagues par rapport au même deck niveau 1.

## 3. Le simulateur (`scripts/simulate.ts`)

Le simulateur est écrit par l'agent Moteur en parallèle ; il n'existe pas encore au moment de ce document. Usage attendu :

```
npx tsx scripts/simulate.ts --deck thor,hulk,ironman,cap,widow --level 1 --games 1000 --mode solo-infini --seed 1
npx tsx scripts/simulate.ts --decks docs/decks-reference.json --level 5 --games 1000 --csv out/equilibrage.csv
npx tsx scripts/simulate.ts --ip spiderman --level 1          # indice de puissance (§2)
npx tsx scripts/simulate.ts --campaign 1 --games 200          # taux de victoire des 10 niveaux du chapitre 1
npx tsx scripts/simulate.ts --coop deckA,deckB --games 1000   # Coop Infini à deux joueurs automatiques
npx tsx scripts/simulate.ts --coop-campaign 1 --games 200     # taux de victoire de la campagne Coop (docs/campagne-coop.md)
```

(Le format exact des options est à la main de l'agent Moteur ; les **sorties** ci-dessous sont, elles, demandées.)

### Joueur automatique de référence
Le même pour tous les decks, simple et déterministe à graine égale :
1. invoque dès que le mana ≥ coût d'invocation et qu'une case est libre ;
2. fusionne dès que deux unités identiques de même rang existent, en priorité le plus bas rang ; garde en revanche les unités de **soutien** (Captain America, Pocahontas, Raiponce, Coco) si elles sont au centre ;
3. améliore l'unité du deck qui a le plus d'exemplaires sur le plateau quand le mana ≥ coût d'amélioration + coût d'invocation ;
4. plateau plein et rien à fusionner : améliore.
Variante « joueur expert » (optionnelle) : place les soutiens au centre, garde un rang 1 de chaque unité pour Loki/Coco.

### Mesures à rapporter (par deck)
| Mesure | Pourquoi |
|---|---|
| Vague moyenne, médiane, écart-type, p10, p90 (Solo Infini) | Critère principal ; l'écart-type repère les decks trop aléatoires. |
| Taux de victoire par niveau de campagne (avec `targetWaves`) | Courbe de `docs/campagne.md`. |
| Part des dégâts par unité et par source (attaque, compétence, brûlure, éclaboussure) | Repérer une compétence qui fait tout le travail. |
| DPS effectif moyen par unité, par rang | Comparer aux bandes du §2. |
| Temps moyen pour tuer chaque lieutenant et chaque gros boss, et % passés en rage | Les boss sont le vrai test. |
| Cause de la défaite : vague normale, sbires, boss (lequel), rage | Savoir quoi régler. |
| Vies perdues par vague | Montrer où la pression monte. |
| Mana gagné, dépensé en invocations, en améliorations | Économie (Tiana, Pocahontas, Venom). |
| Rang max atteint et vague de premier rang 5 / 7 | Rythme de fusion. |
| Effets de boss : unités touchées, rangs perdus, unités détruites, effets retirés (Raiponce) ou restaurés (Coco) | Valeur des unités anti-boss. |
| Bonus d'équipe actifs et leur gain (partie miroir sans bonus) | §2, équipes. |
| En Coop : vague moyenne du duo, part des dégâts et du mana par joueur, dégâts faits sur la branche de l'autre, paliers atteints (§5) | Coop Infini et campagne Coop. |
| Durée de calcul par partie | Le simulateur doit tenir 1 000 parties en moins de 2 min. |

Sortie : un tableau texte lisible plus un CSV, pour suivre les réglages d'une version à l'autre (garder les CSV dans `out/`, non commités).

### Cibles chiffrées

Solo Infini, joueur automatique (petit boss aux vagues 5, 15, 25… ; gros boss aux vagues 10, 20, 30, 40 ; Thanos à la 50) :

| Situation | Vague moyenne visée | Mur attendu |
|---|---|---|
| Deck de départ (Marvel ou Disney), niveau 1, sans talent | **9 – 12** | 1er gros boss (vague 10) |
| Deck de départ, niveau 3 | 13 – 17 | lieutenant 15 / gros boss 20 |
| Deck « méta » d'un pack, niveau 5, palier 1 | 20 – 25 | gros boss 20 |
| Deck « méta », niveau 7, paliers 1-2 | 28 – 35 | gros boss 30 |
| Deck « méta », niveau 10, 3 paliers | **40 – 48** | gros boss 40, puis **Thanos à la 50** |

Contraintes :
- les deux decks de départ (Marvel et Disney) à **±5 %** l'un de l'autre ;
- entre tous les decks de référence de même niveau : **écart < 20 %** entre le meilleur et le moins bon (critère du §1 bis) ;
- un lieutenant est tué en **15 à 25 s** par un deck du niveau attendu, un gros boss en **25 à 40 s** (la rage à 45 s doit rester rare : < 15 % des boss) ;
- Thanos (vague 50) est vaincu par **moins de 25 %** des decks méta niveau 10 en Solo, et par **30 à 50 %** des duos méta niveau 10 en Coop Infini.

## 4. Decks de référence

| Id | Deck | Intention |
|---|---|---|
| `depart-marvel` | Spider-Man, Œil de faucon, Falcon, Captain Marvel, Black Widow | Deck de départ Marvel (témoin) |
| `depart-disney` | Pocahontas, Rebelle, Tiana, Nemo & Dory, Rox & Rouky | Deck de départ Disney |
| `meta-marvel` | Iron Man, Thor, Hulk, Captain America, Black Widow | « Méta » Marvel : Avengers (5) |
| `meta-disney` | Vaïana, Maui, Ariel, Nemo & Dory, Mulan | « Méta » Disney : Océan (4) + Mulan |
| `agents-ailes` | Black Widow, Œil de faucon, Soldat de l'hiver, Falcon, Captain America | Critiques et marques (Les Agents + Les Ailes) |
| `arcanes` | Doctor Strange, Loki, Shang-Chi, Thor, Coco | Recharges et compétences (Arcanes + Asgard) |
| `princesses` | Mulan, Rebelle, Tiana, Raiponce, Pocahontas | Économie et soutien (Princesses 5) |
| `pixar-animaux` | Buzz & Woody, Nemo & Dory, Coco, Rox & Rouky, Nick & Judy | Mixte Disney (Duos Pixar + Animaux) |
| `controle` | Spider-Man, Vaïana, Ariel, Nick & Judy, Venom | Contrôle pur + exécution : doit tomber sur les boss |
| `anti-boss` | Black Widow, Rebelle, Soldat de l'hiver, Raiponce, Coco | Monocible : doit tomber sur les vagues denses |
| `chaos` | Vanellope & Ralph, Loki, Nemo & Dory, Thor, Captain America | Aléatoire : écart-type maximal toléré |
| `mixte-legendaires` | Iron Man, Mulan, Maui, Buzz & Woody, Vanellope & Ralph | 5 Légendaires sans équipe : ne doit pas battre `meta-marvel` de plus de 5 % |

Ces decks sont à mettre dans un fichier de données du simulateur (par exemple `scripts/decks-reference.json`, à créer par l'agent Moteur).

## 5. Coop Infini : paliers de récompenses

Coffres du prompt §5.2, donnés **à chacun** à la fin de la partie, selon le palier atteint (un palier est « atteint » quand la vague correspondante est terminée, boss compris) :

| Palier | Coffre (pour chacun) |
|---|---|
| Vague 10 | bronze : 150 éclats, 10 cartes |
| Vague 20 | argent : 300 éclats, 1 parchemin, 20 cartes |
| Vague 30 | or : 500 éclats, 2 parchemins, 1 carte Épique garantie |
| Vague 40 | héroïque : 800 éclats, 3 parchemins, 1 skin au hasard |
| Vague 50 (Thanos vaincu) | légendaire : 1 500 éclats, 1 Légendaire garanti, cadre « Vainqueur de Thanos » |
| Ensuite, tous les 10 | +300 éclats et 1 parchemin |

À cela s'ajoutent +10 éclats par vague pour chacun (§6.1). Les coffres se cumulent (atteindre la vague 30 donne bronze + argent + or).

**Cibles** (simulateur `--coop`, deux joueurs automatiques, 1 000 parties par paire de decks) :

| Duo | Vague 10 | Vague 20 | Vague 30 | Vague 40 | Vague 50 |
|---|---|---|---|---|---|
| Deux decks de départ, niveau 1-2 | ≥ 75 % | 15 – 30 % | < 5 % | — | — |
| Decks intermédiaires, niveau 5, palier 1 | ≥ 95 % | ≥ 60 % | 20 – 35 % | < 5 % | — |
| Decks méta, niveau 7, paliers 1-2 | 100 % | ≥ 90 % | ≥ 60 % | 20 – 35 % | < 5 % |
| Decks méta, niveau 10, 3 paliers | 100 % | 100 % | ≥ 90 % | ≥ 60 % | **30 – 50 %** |

Règles de cohérence :
- un duo tient en moyenne **+30 à +50 %** de vagues de plus que le meilleur des deux decks seul en Solo Infini (deux plateaux, mais des vagues Coop plus fortes : PV ×1,6 et 1,5 fois plus d'apparitions, à régler par l'agent Moteur) ;
- **économie** : une partie Coop Infini rapporte environ **50 à 80 éclats par minute** et par joueur jusqu'à la vague 30, contre 15 à 25 en campagne Solo ; c'est voulu (jouer ensemble est la récompense), mais **les parchemins Coop** (0 à 6 par partie jusqu'à la vague 40) ne doivent pas dépasser **40 %** des parchemins gagnés par un profil sur une semaine de jeu type (mesurer avec les journaux de partie) ;
- **contribution** : aucun des deux joueurs ne doit faire plus de **65 %** des dégâts dans une paire de decks de même niveau (sinon la jonction des chemins avantage trop un côté).

Paires de decks de référence pour la Coop : `depart-marvel` + `depart-disney` ; `meta-marvel` + `meta-disney` ; `agents-ailes` + `princesses` ; `arcanes` + `pixar-animaux` ; `controle` + `anti-boss`.

## 6. Boucle de réglage

1. Lancer tous les decks de référence au niveau 1 puis au niveau 5 (1 000 parties chacun).
2. Corriger d'abord les ennemis si **tous** les decks sont hors cible dans le même sens.
3. Corriger ensuite les unités hors bande (IP), une variable à la fois, par pas de 10 %.
4. Relancer ; consigner chaque changement (valeur avant / après, effet mesuré) dans `docs/journal.md`.
5. Vérifier la campagne (`docs/campagne.md`, §4) après chaque réglage d'ennemis ou de boss.
