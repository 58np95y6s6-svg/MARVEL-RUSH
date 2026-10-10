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
| Venom | Épique | Exécution + Croissance | 35 | 1,05 – 1,12 | Croissance sans plafond (+0,5 %/s, +2 %/élimination), 50 % gardés en fusion : surveiller les parties longues (vague 30+). |
| Captain Marvel | Rare | Dégâts monocible (pic) | 27,8 | 0,98 – 1,05 | Rare la plus forte en dégâts : rester sous 1,05. |
| Captain America | Légendaire | Soutien + rebonds | 20 × 3 | 1,08 – 1,14 | La valeur dépend du placement ; le joueur auto doit placer au centre. |
| Loki | Épique | Copieur | 22,5 | 1,03 – 1,08 | Copie une alliée de même rang à −25 % : sa valeur dépend du meilleur héros du deck. |
| Soldat de l'hiver | Épique | Critique + étourdissement | 37,5 (moyenne) | 1,05 – 1,10 | Équipe Les Agents (+30 % de critiques) le pousse fort. |
| Œil de faucon | Rare | Polyvalent | 25,7 | 0,97 – 1,03 | Bonne Rare de base, sans pic. |
| Falcon | Rare | Soutien (marque) | 25 | 0,95 – 1,02 | Valeur qui grandit avec les dégâts du deck ; c'est l'unité de remplacement du témoin. |
| Black Widow | Épique | Sacrifice → mana | 28 | 1,00 – 1,06 | Plus de ×2 contre les boss ; rend 10/25/45/70/100/140/190 de mana par fusion ou destruction. |
| Shang-Chi | Épique | Multi-cibles aléatoires | 30 + anneaux | 1,05 – 1,10 | Les anneaux ne doivent pas tout nettoyer avant la vague 10. |
| Vaïana & Pua | Épique | Contrôle (repousser) | 15 | 1,03 – 1,08 | Comme Strange : mesurer les vies sauvées. |
| Maui | Légendaire | Dégâts alternés | 33 (×2,5 requin) | 1,10 – 1,16 | Vérifier que les deux formes ont une valeur proche sur 16 s. |
| Pocahontas & Meeko | Rare | Soutien (cadence) + mana | 12,5 | 0,95 – 1,02 | IP calculé avec placement au centre. |
| Mulan & Mushu | Légendaire | Brûlure + nettoyage par vague | 30 (+60 % brûlure) | 1,10 – 1,16 | Avalanche = filet de sécurité ; une seule par vague. |
| Rebelle | Rare | Monocible sur la tête | 48,9 (crit) | 0,98 – 1,05 | DPS brut élevé mais monocible : à surveiller sur les boss. |
| Ariel & Sébastien | Épique | Contrôle de masse | 11 | 1,03 – 1,08 | Saignement plafonné sur boss (`bleedBossFactor`). |
| Rox & Rouky | Rare | Dégâts monocible | ~52 | 0,98 – 1,05 | Le doublé sur même cible rend Rox très bon contre les boss ; ajuster `secondHitBonus` d'abord. |
| Tiana & Naveen | Rare | Mana par élimination | 8 | 0,95 – 1,02 | +1/2/3/4/5/6/8 de mana par ennemi touché qui tombe (au lieu du mana de vague) ; mesurer le mana total gagné (+10 à 15 % visé). |
| Nemo & Dory | Rare | Aléatoire | 20 | 0,95 – 1,02 | Écart-type élevé accepté. |
| Coco (Miguel) | Épique | Booster de fusion + restaure | 10 | 1,03 – 1,08 | Fait monter d'un rang une alliée de même rang (en disparaissant) ; Remember Me contre Cruella et Galactus. |
| Nick & Judy | Épique | Contrôle + malus d'armure | 20 | 1,03 – 1,08 | Fort contre les blindés et Maléfique (gobelins). |
| Buzz & Woody | Légendaire | Perçant + contrôle | 27,5 (ligne) | 1,08 – 1,14 | Laser perçant : mesurer le nombre moyen d'ennemis touchés. |
| Raiponce & Pascal | Épique | Anti-contrôle de boss | 12 | 1,03 – 1,08 | Valeur contre Jafar, Maléfique, Bouffon Vert, Thanos. |
| Vanellope & Ralph | Légendaire | Anti-blindés/boucliers + soutien mobile | 32 | 1,08 – 1,14 | Téléportation aléatoire : écart-type élevé accepté. |

**Talents** : chaque option d'un palier doit donner un IP **dans ±3 %** de l'autre option du même palier (sinon le choix n'en est pas un). Gain cible par palier par rapport à l'unité sans talent : palier 1 ≈ +3 %, palier 2 ≈ +4 %, palier 3 ≈ +6 %.

**Équipes** : un bonus d'équipe actif doit valoir **+5 à +10 %** de vague moyenne par rapport au même deck sans bonus (mesuré en neutralisant le bonus). Avengers (5) reste ≤ +12 %.

**Niveau de collection** (+10 % de dégâts par niveau) : un deck niveau 10 doit tenir environ **+60 %** de vagues par rapport au même deck niveau 1.

## 2 bis. Portées d'attaque (§4.1, octobre 2026)

Chaque unité a une portée (`UnitDef.range`, en cases, depuis le centre de sa case jusqu'à l'ennemi en coordonnées de grille ; `src/engine/geometry.ts`). Une unité ne choisit sa **cible principale** que parmi les ennemis de sa zone ; les effets secondaires gardent leurs propres règles sur tout le chemin (éclaboussures de Hulk, rebonds de Thor et de Captain America, flèche électrique, Avalanche de Mulan, anneaux de Shang-Chi, laser d'Iron Man qui traverse toute la ligne de l'ennemi visé). Les compétences à recharge qui visent (Portail, Drone Redwing, Appel de l'océan, Chant de sirène, Lasso, Langue de Naveen, Arrestation) ne visent aussi que dans la zone. Boss compris.

Couverture moyenne du chemin Solo (part du chemin dans la zone, moyenne des 15 cases, chemin en U / en marches) : courte ≈ 10-12 % (6 cases sur 15 ne touchent rien : centre et bas de la grille), moyenne ≈ 27-30 %, longue ≈ 55-58 %. D'où la compensation, appliquée aux dégâts de base d'avant les portées : **globale ×1,22**, **longue ×1,22 × 1,4**, **moyenne ×1,22 × 1,7**, **courte ×1,22 × 3** (le ×1,22 commun compense aussi le passage du rang à « +51 % de dégâts et +12 % de cadence par rang », qui affaiblit les rangs 2 à 6). Rebelle, Tiana et Nemo & Dory ont reçu un petit bonus en plus pour garder le deck Disney de départ dans la cible.

| Portée | Valeur | Unités (dégâts de base) |
|---|---|---|
| Globale (toute la map) | `'globale'` | Iron Man 37, Doctor Strange 18, Captain Marvel 30, Œil de faucon 22, Falcon 18, Rebelle 32, Tiana & Naveen 11 |
| Longue | 3,4 | Thor 43, Loki 31, Soldat de l'hiver 51, Black Widow 24, Vaïana & Pua 26, Pocahontas & Meeko 17, Ariel & Sébastien 17, Nemo & Dory 26, Coco 17, Buzz & Woody 38 |
| Moyenne | 2,4 | Spider-Man 21, Captain America 41, Nick & Judy 33, Raiponce & Pascal 25 |
| Courte (corps à corps) | 1,6 | Hulk 220, Venom 128, Shang-Chi 44, Maui 146, Mulan & Mushu 110, Rox & Rouky 51, Vanellope & Ralph 165 |

Le joueur automatique du simulateur tient compte des portées : à rang égal, il fusionne en priorité la paire dont une unité couvre le moins de chemin, vers la case la mieux placée.

Mesures (`scripts/simulate.ts`, Solo Infini, niveau 1, toits de New York) :

| Deck | Avant (300 parties) | Après portées + rang (300 parties) |
|---|---|---|
| Départ Marvel | 10,60 | **10,46** |
| Départ Disney | 10,58 | **10,26** |
| Méta Marvel (Iron Man, Thor, Hulk, Cap, Widow) | 16,33 (100) | 15,85 |
| Méta Disney (Vaïana, Maui, Ariel, Nemo, Mulan) | 11,87 (100) | 9,66 |
| Départ Marvel en Coop (50 parties) | 9,46 | 9,38 |

À surveiller : les decks riches en corps à corps (méta Disney, `mixte-legendaires`, `arcanes`, `controle`) perdent 10 à 20 % avec le joueur automatique, qui place mal ; un joueur qui fusionne vers les cases du bord doit compenser. Si les journaux réels confirment l'écart, relever d'abord la portée courte (1,8) plutôt que les dégâts (déjà ×3,7).

## 2 ter. Archétypes de stratégie et début de partie (octobre 2026)

**Archétypes** (`src/engine/archetypes.ts`, docs/roadmap.md) : Black Widow perd son ×2 contre les boss (Sacrifice → mana : 10/25/45/70/100/140/190 une fois par fusion ou à la destruction), Loki sa transformation périodique (Copieur à −25 %, et Formation : +15 % par autre Loki aligné, +30 % max, zone à 40 % à 3 alignés), Venom son plafond de +40 % (Croissance : points +0,5/s et +0,02 par élimination, bonus = 0,28 × points^0,75, soit ≈ +100 % vers la vague 30 et +200 % vers la vague 60, 50 % du bonus gardé en fusion), Tiana son mana de vague (+1/2/3/4/5/6/8 par ennemi touché qui tombe), Vanellope sa téléportation aléatoire (Échangeur manuel, même bonus de cadence) ; Coco gagne le Booster de fusion.

**Économie** : « Mana + » (50/100/200/400/800, +20 % de mana par élimination et par vague et par niveau) ; récompense de boss = 2,5 / 5,5 / 8 × le coût d'invocation actuel (lieutenant / gros boss / Thanos), × rendement, pour chaque joueur ; amélioration d'un héros : +15 % de dégâts **et +6 % de cadence** par niveau.

**Début de partie allégé** (le joueur trouvait le premier niveau très dur) : 150 de mana au départ (au lieu de 100 : supprime les défaites en vague 1 quand les premières invocations tombent au centre, hors de portée) ; PV ×0,7 en vague 1, remontant jusqu'à ×1 en vague 12 (`earlyHpStart`, `earlyHpUntil`) ; la rampe tardive (×1,18 par vague) est inchangée. *(Allègement des PV remplacé en octobre 2026 par moins d’apparitions en début de partie : voir §2 quater.)*

**Joueur automatique** : la règle « fusionne aussi quand le mana manque » est retirée (elle vidait le plateau : l'ancien bot faisait moins bien qu'un joueur au hasard) ; le bot achète « Mana + » et les améliorations quand elles coûtent moins que la prochaine invocation, copie / booste plateau plein (il n'utilise ni l'échange ni la formation exprès). Nouveau `--casual` (réagit une fois par seconde, fusionne au hasard plateau plein, n'achète pas « Mana + ») : approximation d'un joueur débutant. `--no-manaup` désactive l'achat de « Mana + ». Le simulateur affiche aussi le taux de passage des vagues 5, 10 et 15.

Mesures (Solo Infini, niveau 1, toits de New York, graines 1..100) :

| Deck | Avant (ancien bot, anciennes règles) | Après, bot de référence | Après, `--casual` |
|---|---|---|---|
| Départ Marvel | 10,40 (vague 10 passée : ≈ 40 %) | **16,61** (vague 5 : 100 %, vague 10 : 100 %, vague 15 : 98 %) | **15,44** (100 % / 99 % / 69 %) |
| Départ Disney | 10,52 (≈ 40 %) | **17,67** (100 % / 99 % / 95 %) | **15,86** (100 % / 95 % / 74 %) |
| Départ Marvel en Coop (50 parties) | 9,38 | 15,78 | — |
| Widow, Loki, Coco, Venom, Tiana | 7,34 | 13,63 (vague 10 : 69 %) | — |

Étapes intermédiaires (départ Marvel / Disney) : archétypes seuls 10,25 / 10,37 ; + récompense de boss et nouveau bot 14,66 / 15,22 ; + PV allégés 14,95 / 15,78 ; + achats rentables du bot et 150 de mana 16,61 / 17,67.

**Risques d'équilibrage** (deck témoin T0 = Spider-Man, Œil de faucon, Falcon, Captain Marvel + 5e héros ; Rebelle = référence 17,20) :

| 5e héros | Vague moyenne | Écart |
|---|---|---|
| Rebelle (référence) | 17,20 | — |
| Captain America (Boost de vitesse) | 17,34 | +1 % |
| Venom (Croissance) | 17,05 | −1 % |
| Vanellope & Ralph (Échangeur, non utilisé par le bot) | 16,77 | −3 % |
| Black Widow (Sacrifice) | 16,61 | −3 % |
| Loki (Copieur ; formation non recherchée par le bot) | 16,38 | −5 % |
| Pocahontas (Boost de vitesse) | 16,35 | −5 % |
| Coco (Booster de fusion) | 16,10 | −6 % |
| Tiana (Mana par élimination) | 15,43 | −10 % |
| Deck « mana » (Spider-Man, Œil de faucon, Widow, Tiana, Pocahontas) | 15,99 (14,70 sans « Mana + ») | −7 % |

Aucun emballement économique : les decks « mana » restent sous le témoin (le mana ne compense pas les dégâts perdus). « Mana + » vaut +3 % (T0 : 16,75 → 17,20) à +9 % (deck mana : 14,70 → 15,99). À surveiller : Tiana un peu faible (−10 %) ; la Croissance de Venom en parties très longues (courbe en puissance 0,75, sans plafond) ; la Formation de Loki (+30 % et zone) n'est pas mesurée par le bot.

## 2 quater. Premières vagues plus solides et campagne longue (octobre 2026)

**Retour joueur** : « Dans les premières manches on one-shot quasi tous les sbires… c'est pas drôle. » Avant : 70 PV en vague 1 (allègement ×0,7), soit 1 à 3 coups pour un héros de départ (dégâts de rang 1, niveau 1 : 11 à 51, moyenne 25,2 pour les 10 héros des deux decks de départ). Après :
- `earlyHpStart` 0,7 → **1** : **100 PV en vague 1**, soit **4 coups en moyenne** (Rox & Rouky 2, Tiana 9), puis ×1,18 par vague, sans palier. Test : `tests/engine/difficulty.test.ts` (≥ 3 coups en moyenne, ≤ 5, aucun héros de départ ne tue en un coup).
- Accessibilité par le **nombre** d'ennemis plutôt que par des PV en papier : `spawnIntervalStart` 1,8 → **2,6 s**, `spawnIntervalStep` 0,06 → **0,1** (≈ 12 apparitions en vague 1 au lieu de 17 ; le plancher de 0,6 s est toujours atteint à la vague 21). Moins d'ennemis mais plus solides au début, puis de plus en plus nombreux et solides. Mana de départ inchangé (150).
- Solo Infini, niveau 1, 60 parties : départ Marvel **16,0** (`--casual`) / 16,9 (référence) ; départ Disney **16,2** / 17,6 (avant : 15,4 / 16,6 et 15,9 / 17,7). Cible ≈ 14-16 pour le joueur occasionnel tenue.

**Campagne longue** (« des parties de 4 manches c'est trop ridicule ! C'est 10-15 minimum ») : 10 → 50 vagues (`docs/campagne.md`). La difficulté d'un niveau = **effectif** (`script.enemyCountMultiplier`, divise l'intervalle d'apparition) et **PV** (`script.enemyHpMultiplier`, `script.bossHpMultiplier` pour les lieutenants et gros boss), en hausse régulière sur les 60 niveaux. Avec la rampe du Solo Infini (×1,18 par vague), aucune collection ne tiendrait 50 vagues (le deck méta niveau 9 meurt vers la vague 28) : la campagne adoucit la croissance par vague (`script.waveHpGrowth` : ×1,14 au chapitre 1, ×1,075 au 2, ×1,07 aux 3-5, ×1,0425 au 6). Repères mesurés (`--casual`, PV× et effectif× à 1) : le deck de départ niveau 1 tient ≈ 20 vagues à ×1,10, 26 à ×1,08, 40 à ×1,06 ; le deck Avengers niveau 8 (3 paliers) ≈ 42 à ×1,10, 53 à ×1,08, 69 à ×1,06. Taux de victoire par chapitre : `docs/campagne.md` §4.

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
4. plateau plein et rien à fusionner : copie (Loki) ou booste (Coco) l'alliée de même rang au plus fort DPS de base, sinon améliore.
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

## 6. Économie et Éveils : simulation de la progression

Modèle de **valeur attendue** jour par jour (script de travail de l'agent Game design, à reprendre dans `scripts/simulate.ts --economie` par l'agent Moteur ou Méta). Il vérifie le rythme visé du §6.6 : premier ★1 dans la première semaine, ★5 sur un Rare en 2 à 3 mois, ★10 sur un Légendaire en plus de 8 mois.

### Hypothèses : joueur régulier (30 à 45 min par jour)
| Poste | Hypothèse |
|---|---|
| Départ | 1 000 éclats, deck de départ |
| Campagne Solo | finie en 3 semaines : ≈ 12 000 éclats au total (étoiles, coffres d'étoiles, boss), soit ≈ 570 / jour ; 12 niveaux de boss à 3 étoiles = 300 ✦ |
| Solo Infini | **1 partie par jour** à partir du jour 3 ; vague atteinte : 15 (semaine 1), 20 (semaine 2), 30 (mois 2), 40 (mois 4), 50 (mois 8) |
| Coop Infini | **3 parties par semaine**, vague atteinte = Solo Infini + 10 % |
| Coffre quotidien | 150 éclats + 5 ✦ |
| Premier gros boss du jour | ✦ (voir tableaux) |
| Tirages | tout l'or part en lots de 10 (90 éclats le tirage) dans le **pack Marvel** |
| Probabilités par tirage | Rare 72 % (3 Rares Marvel → **24 %** pour un Rare donné) ; Légendaire 4 %, garantie au 40e → en moyenne 1 Légendaire tous les **20,1 tirages** (≈ 5 %) ; 4 Légendaires Marvel → **1,24 %** pour un Légendaire donné. Le pack Disney (5 Rares, 4 Légendaires) donne 14,4 % pour un Rare donné. |
| Cartes de coffre | les cartes des coffres d'Infini vont à une unité possédée au hasard (≈ 1/15 pour une unité donnée) |

Revenu obtenu avec les règles du prompt : ≈ **1 150 éclats / jour** en semaine 1, **1 950** au jour 30, **3 250** au jour 90 et **5 500** au jour 240 (les coffres de palier d'Infini dominent). Soit 13 à 60 tirages par jour.

### Résultat avec les chiffres actuels du prompt (§6.2 et §6.6)
| Objectif | Visé | Obtenu | Cause |
|---|---|---|---|
| Premier ★1 (meilleur Rare) | ≤ 7 jours | **≈ 119 jours** | L'éveil s'ouvre au niveau 10, et l'échelle de cartes 2, 4, 8… 512 demande **1 022 cartes** pour y arriver. |
| ★5 sur un Rare | 60 – 90 jours | ≈ 124 jours | Même cause (les cristaux ne bloquent pas). |
| ★10 sur un Légendaire | > 240 jours | **jamais** (≈ 1 470 copies à 0,25-1 copie/jour : plus de 4 ans) | 1 022 cartes de niveau + 450 copies, à 1,24 % par tirage. |
| Cristaux | — | ≈ 4 800 ✦ au jour 30 | Trop généreux : les 18 900 ✦ d'un ★10 arrivent vers le jour 120. |

**Conclusion : les chiffres du prompt ratent les trois cibles.** Le verrou est l'échelle des cartes de niveau (puissances de 2), qui rend le niveau 10 inaccessible pour un Légendaire et trop lent pour un Rare.

### Valeurs corrigées proposées (à valider par le chef de projet)
1. **Cartes de niveau** (§6.2) : 1, 1, 2, 2, 2, 3, 3, 3, 4 cartes pour passer les niveaux 2 à 10 (**21 cartes** au total, au lieu de 1 022). Le coût en éclats des montées de niveau reste le frein principal des premiers niveaux (proposition : 50, 100, 150, 250, 400, 600, 900, 1 300, 1 800 éclats). La progression longue passe à l'Éveil, comme le veut le §6.6.
2. **Copies d'éveil** (§6.6) : 2, 3, 5, 6, 8, 10, 13, 18, 25, 40 (**130 copies**, au lieu de 450), toujours identiques pour toutes les raretés.
3. **Coût en cristaux** : 50, 300, 600, 1 000, 2 000, 2 500, 3 000, 4 000, 5 000, 6 500 (**24 950 ✦**, au lieu de 18 900). Le ★1 devient presque gratuit, le ★5 coûte 3 950 ✦ en cumulé.
4. **Gains de cristaux** (divisés par 4 à 8) :
   - Solo Infini et Coop Infini : 5 ✦ au palier 10, 10 au 20, 20 au 30, 30 au 40, 60 au 50, puis +10 tous les 10 ;
   - premier gros boss du jour : 5 ✦ ; Thanos vaincu : 50 ✦ ;
   - campagne (3 étoiles sur un niveau de boss) : 25 ✦, inchangé ; coffre quotidien : 5 ✦, inchangé ;
   - doublons d'une unité à ★10 : 5 ✦, inchangé.

Résultats avec ces valeurs (même joueur) :

| Objectif | Visé | Obtenu |
|---|---|---|
| Premier ★1 (meilleur Rare Marvel) | ≤ 7 jours | **jour 8** (21 cartes + 2 copies vers le jour 8 ; les cristaux sont là dès le jour 3) |
| ★5 sur un Rare | 60 – 90 jours | **jour 66** (bloqué par les cristaux : ≈ 1 600 ✦ au jour 30) |
| ★10 sur un Légendaire | > 240 jours | **jour 262** (≈ 8,7 mois ; bloqué par les copies : ≈ 0,3 à 0,6 copie par jour) |

Sensibilité (vague atteinte en Infini multipliée par k) : k = 0,8 → ★5 au jour 94, ★10 Légendaire au jour 396 ; k = 0,7 → jours 110 et 530 ; k = 1,15 → jours 65 et 248. Le ★1 reste au jour 8 dans tous les cas.

### Points de vigilance
- **Inflation d'éclats** : avec les coffres de palier du §5.2, un joueur qui atteint la vague 50 chaque jour gagne ≈ 5 500 éclats par jour (≈ 60 tirages). Si la collection se remplit trop vite, réduire de moitié les éclats des coffres héroïque et légendaire, ou ne donner les coffres de palier qu'**une fois par jour et par mode** (hypothèse du modèle ; à écrire dans les règles).
- Le Légendaire garanti du coffre légendaire (vague 50) accélère le ★10 Légendaire si le joueur le choisit ; le modèle le compte comme aléatoire. Avec un Légendaire **au choix**, le ★10 tomberait vers le jour 200 : garder le tirage aléatoire.
- À mesurer dans les journaux de partie réels après un mois : vague moyenne atteinte en Infini, nombre de parties par jour, et revenu réel (éclats et ✦ par jour) pour recaler le facteur k.

## 7. Boucle de réglage

1. Lancer tous les decks de référence au niveau 1 puis au niveau 5 (1 000 parties chacun).
2. Corriger d'abord les ennemis si **tous** les decks sont hors cible dans le même sens.
3. Corriger ensuite les unités hors bande (IP), une variable à la fois, par pas de 10 %.
4. Relancer ; consigner chaque changement (valeur avant / après, effet mesuré) dans `docs/journal.md`.
5. Vérifier la campagne (`docs/campagne.md`, §4) après chaque réglage d'ennemis ou de boss.
