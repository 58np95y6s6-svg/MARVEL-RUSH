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
| Venom | Rare | Exécution + Croissance | 35 | 1,05 – 1,12 | Croissance sans plafond (+0,5 %/s, +2 %/élimination), 50 % gardés en fusion : surveiller les parties longues (vague 30+). |
| Captain Marvel | Rare | Dégâts monocible (pic) | 27,8 | 0,98 – 1,05 | Rare la plus forte en dégâts : rester sous 1,05. |
| Captain America | Légendaire | Soutien + rebonds | 20 × 3 | 1,08 – 1,14 | La valeur dépend du placement ; le joueur auto doit placer au centre. |
| Loki | Légendaire | Copieur | 22,5 | 1,03 – 1,08 | Copie une alliée de même rang à −25 % : sa valeur dépend du meilleur héros du deck. |
| Soldat de l'hiver | Épique | Critique + étourdissement | 37,5 (moyenne) | 1,05 – 1,10 | Équipe Les Agents (+30 % de critiques) le pousse fort. |
| Œil de faucon | Rare | Polyvalent | 25,7 | 0,97 – 1,03 | Bonne Rare de base, sans pic. |
| Falcon | Rare | Soutien (marque) | 25 | 0,95 – 1,02 | Valeur qui grandit avec les dégâts du deck ; c'est l'unité de remplacement du témoin. |
| Black Widow | Rare | Sacrifice → mana | 28 | 1,00 – 1,06 | Plus de ×2 contre les boss ; rend 10/25/45/70/100/140/190 de mana par fusion ou destruction. |
| Shang-Chi | Épique | Multi-cibles aléatoires | 30 + anneaux | 1,05 – 1,10 | Les anneaux ne doivent pas tout nettoyer avant la vague 10. |
| Vaïana & Pua | Épique | Contrôle (repousser) | 15 | 1,03 – 1,08 | Comme Strange : mesurer les vies sauvées. |
| Maui | Légendaire | Dégâts alternés | 33 (×2,5 requin) | 1,10 – 1,16 | Vérifier que les deux formes ont une valeur proche sur 16 s. |
| Pocahontas & Meeko | Rare | Soutien (cadence) + mana | 12,5 | 0,95 – 1,02 | IP calculé avec placement au centre. |
| Mulan & Mushu | Légendaire | Brûlure + nettoyage par vague | 30 (+60 % brûlure) | 1,10 – 1,16 | Avalanche = filet de sécurité ; une seule par vague. |
| Rebelle | Rare | Monocible sur la tête | 48,9 (crit) | 0,98 – 1,05 | DPS brut élevé mais monocible : à surveiller sur les boss. |
| Ariel & Sébastien | Légendaire | Contrôle de masse | 11 | 1,03 – 1,08 | Saignement plafonné sur boss (`bleedBossFactor`). |
| Rox & Rouky | Rare | Dégâts monocible | ~52 | 0,98 – 1,05 | Le doublé sur même cible rend Rox très bon contre les boss ; ajuster `secondHitBonus` d'abord. |
| Tiana & Naveen | Épique | Mana par élimination | 8 | 0,95 – 1,02 | +1/2/3/4/5/6/8 de mana par ennemi touché qui tombe (au lieu du mana de vague) ; mesurer le mana total gagné (+10 à 15 % visé). |
| Nemo & Dory | Rare | Aléatoire | 20 | 0,95 – 1,02 | Écart-type élevé accepté. |
| Coco (Miguel) | Légendaire | Booster de fusion + restaure | 10 | 1,03 – 1,08 | Fait monter d'un rang une alliée de même rang (en disparaissant) ; Remember Me contre Cruella et Galactus. |
| Nick & Judy | Rare | Contrôle + malus d'armure | 20 | 1,03 – 1,08 | Fort contre les blindés et Maléfique (gobelins). |
| Buzz & Woody | Épique | Perçant + contrôle | 27,5 (ligne) | 1,08 – 1,14 | Laser perçant : mesurer le nombre moyen d'ennemis touchés. |
| Raiponce & Pascal | Rare | Anti-contrôle de boss | 12 | 1,03 – 1,08 | Valeur contre Jafar, Maléfique, Bouffon Vert, Thanos. |
| Vanellope & Ralph | Épique | Anti-blindés/boucliers + soutien mobile | 32 | 1,08 – 1,14 | Téléportation aléatoire : écart-type élevé accepté. |

### 2 bis. Extension DC : bandes de puissance

Mêmes bandes que ci-dessus (Rare 0,95 – 1,05, Épique 1,03 – 1,12, Légendaire 1,08 – 1,18). IP mesuré le 9 octobre 2026 avec `scripts/simulate.ts` (80 parties, niveau 1, témoin `depart-marvel` = 10,24 vagues, Falcon remplacé par l'unité testée), **avec la portée globale** (le moteur de la branche DC n'applique pas encore les portées du §4.1). La colonne « Dégâts » donne la valeur actuelle, **compensation de portée comprise** (courte +20 %, courte-moyenne +15 %, moyenne +10 %) : à remesurer après la fusion de `main` qui applique les portées (fait : voir §2 quater).

| Unité | Rareté | Rôle | Portée | Dégâts / cadence | IP mesuré | Bande | Vigilance |
|---|---|---|---|---|---|---|---|
| Batman | Légendaire | Gadgets / malus (fumée, exposition) | moyenne 2,4 | 29 / 0,9 s | 1,09 | 1,08 – 1,14 | La fumée expose aussi les boss : mesurer le gain des alliés. |
| Superman | Légendaire | Dégâts + gel de masse | globale | 48 / 1,2 s | 1,06 (après +20 % de dégâts ; 1,03 avant) | 1,08 – 1,14 | Le gel de 4 ennemis toutes les 12 s sauve des vies ; à surveiller avec Lanternes et cosmiques. |
| Wonder Woman | Légendaire | Zone + anti-boss (exposition) | moyenne 2,4 | 44 / 1,1 s | 1,09 (après +18 % ; 1,05 avant) | 1,08 – 1,14 | — |
| Green Lantern | Légendaire | Constructions (mur, marteau, mitrailleuse) | longue 3,4 | 24 / 0,8 s | 1,05 (après +20 % et recharge 8 s ; 1,02 avant) | 1,08 – 1,14 | Encore un peu bas : prochain réglage `abilityCooldown` 7. |
| Flash | Épique | Multi-coups (anti-boucliers) | courte 1,6 | 6 × 3 / 0,5 s | 1,05 | 1,03 – 1,10 | Très fort contre les clowns à ballons et le Corps Sinestro. |
| Aquaman | Épique | Perçant + contrôle | courte-moyenne 2,0 | 32 / 1,1 s | 1,07 | 1,03 – 1,10 | — |
| Cyborg | Épique | Soutien (vitesse de tout le plateau) | globale | 21 / 0,8 s | 1,04 (après +17 % et +25 % de surcharge ; 1,01 avant) | 1,03 – 1,08 | Sa valeur grandit avec les dégâts du deck. |
| Supergirl | Épique | Montée en puissance (charges) | longue 3,4 | 28 / 1,0 s | 1,00 (après réglage ; 0,98 avant) | 1,03 – 1,10 | Encore basse : elle cible « fort » et élimine peu ; prochain réglage `maxCharges` 6. |
| Shazam | Légendaire | Transformation | moyenne 2,4 | 20 / 1,0 s | 1,08 | 1,03 – 1,10 | — |
| Martian Manhunter | Épique | Anti-boss (intangible) + contrôle | longue 3,4 | 24 / 1,0 s | 1,00 (après réglage ; 0,99 avant) | 1,03 – 1,08 | Sa valeur est surtout contre les boss qui rétrogradent ou détruisent : rapporter l'IP par boss. |
| Robin | Rare | Acrobate (balayage, Disciple) | courte 1,6 | 18 / 0,7 s | 1,00 | 0,95 – 1,05 | Avec Batman ou Batgirl à côté : +20 %. |
| Batgirl | Rare | Anti-armure / anti-bouclier | courte 1,6 | 20 / 0,75 s | 0,98 | 0,95 – 1,02 | Valeur contre robots LexCorp et mercenaires. |
| Catwoman | Rare | Économie + ralentissement | courte 1,6 | 17 / 0,6 s | 1,01 | 0,95 – 1,02 | Mesurer le mana volé (≈ +10 % visé). |
| Harley Quinn | Épique | Chaos | courte 1,6 | 17 / 0,8 s | 1,00 | 0,95 – 1,02 | Écart-type élevé accepté. |
| Green Arrow | Rare | Salves | globale | 16 / 0,8 s | 1,07 (salve à 80 % puis à 70 %) | 0,97 – 1,05 | Un peu haute : prochain réglage `abilityCooldown` 9. Avec Les Archers : vérifier ≤ +10 %. |

**Équipes DC** (cible inchangée : +5 à +10 %) : Justice League (4 sur 8, +15 % / +10 % de vitesse), Trinité (+30 % contre les boss), Bat-famille (2 sur 3, +20 % de critiques), Lanternes et cosmiques (3 sur 5, recharges −20 %, contrôles +20 %), Sirènes de Gotham (+15 de mana par vague) ; inter-univers : Les Riches (Iron Man + Batman, +20 de mana par vague et +10 %), Les Archers (2 sur 3 parmi Œil de faucon, Green Arrow, Rebelle : +15 % de vitesse et +15 % de critiques).

**Résultats du simulateur** (Solo Infini, niveau 1, joueur automatique de `scripts/simulate.ts`, 9 octobre 2026) :

| Deck | Vague moyenne | Commentaire |
|---|---|---|
| `depart-marvel` (200 parties) | 10,34 | Témoin |
| `depart-disney` (100 parties) | 10,23 | — |
| `dc-rares` : Robin, Batgirl, Catwoman, Harley, Green Arrow (200 parties) | **10,54** | +2 % sur le témoin : dans les ±5 % des decks de départ |
| `bat-famille` : Batman, Robin, Batgirl, Catwoman, Harley | 12,06 | Bat-famille + Sirènes |
| `cosmiques` : Green Lantern, Martian, Superman, Supergirl, Shazam | 11,73 | Le plus faible des decks DC à Légendaires : contrôle et anti-boss, peu de zone |
| `meta-dc` : Superman, Batman, Wonder Woman, Green Lantern, Flash | **14,83** | Justice League + Trinité |
| `meta-marvel` : Iron Man, Thor, Hulk, Captain America, Black Widow | 16,39 | Écart avec `meta-dc` : 9,5 % (< 20 %) |
| Mixte : Batman, Œil de faucon, Green Arrow, Iron Man, Robin | **14,02** | Les Riches + Les Archers |

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

**Revue des portées par personnage (octobre 2026, `docs/rush-royale-mapping.md` « Portées »)** : portée choisie
selon le style du personnage et l'attaque de l'unité Rush Royale copiée. Trois changements de catégorie, dégâts
(et pas par niveau) × facteur nouveau / facteur ancien (globale 1 · longue 1,4 · moyenne 1,7 · courte 3) :
Shang-Chi courte → longue (215 → 100, +98,25 → +45,85), Mulan & Mushu moyenne → longue (229 → 189, +61,7 →
+50,8), Soldat de l'hiver longue → globale (70 → 50). Mesures (`--casual`, niveau 1, Solo Infini) : départs
inchangés (Marvel 18,32, Disney 14,97, 40 parties ; référence 19,85 / 17,55) ; méta Disney (Mulan) 17,0 → 19,2,
Arcanes (Shang-Chi) 21,0 → 22,6, Agents + Ailes (Soldat de l'hiver) 18,25 → 18,20, Légendaires mixtes 20,3 →
20,3 (20 parties) ; campagne `--attendu` ch. 1 97 % (pire 75 %), ch. 4 100 % (12 / 8 parties par niveau), inchangés.

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

## 2 quinquies. Extension DC : portées, archétypes et rééquilibrage (octobre 2026, remplacé par le §2 sexies)

Après la fusion de `main` (portées, cadence par rang, archétypes, économie), les valeurs du §2 bis (mesurées en portée globale) sont remplacées par celles-ci.

**Portées** : globale Superman, Cyborg, Green Arrow ; longue (3,4) Green Lantern, Supergirl, Martian Manhunter ; moyenne (2,4) Batman, Wonder Woman, Shazam, Aquaman (2,0 auparavant, seules quatre valeurs sont permises) ; courte (1,6) Flash, Robin, Batgirl, Catwoman, Harley Quinn.

**Dégâts** : même mise à l'échelle que Marvel et Disney, appliquée aux dégâts DC sans leur ancienne compensation de portée (÷1,2 courte, ÷1,15 Aquaman, ÷1,1 moyenne) : globale ×1,22, longue ×1,22 × 1,4, moyenne ×1,22 × 1,7, courte ×1,22 × 3. Puis, les quatre Rares de courte portée étant trop faibles ensemble (deck `dc-rares` à 13,65 contre 16,72 pour le départ Marvel, mur au premier gros boss), +75 % pour elles et +20 % pour Flash : leur DPS (≈ 135-145/s) reste sous Rox & Rouky (≈ 210/s).

| Héros | Portée | Dégâts / cadence | Archétype |
|---|---|---|---|
| Batman | moyenne | 55 / 0,9 s | — |
| Superman | globale | 59 / 1,2 s | — |
| Wonder Woman | moyenne | 83 / 1,1 s | — |
| Green Lantern | longue | 41 / 0,8 s | Formation (+15 % par Lantern aligné, zone 40 % à 3) |
| Flash | courte | 22 × 3 / 0,5 s | Échangeur (+20 % de cadence 5 s aux nouvelles voisines) |
| Aquaman | moyenne | 58 / 1,1 s | — |
| Cyborg | globale | 26 / 0,8 s | Boost de vitesse (+15 % aux voisines ; surcharge ramenée à +20 %) |
| Supergirl | longue | 48 / 1,0 s | Croissance (+0,004/s, +0,03 par élimination, 0,28 × points^0,75, moitié gardée en fusion ; l'Éruption à 8 éliminations reste) |
| Shazam | moyenne | 38 / 1,0 s | — |
| Martian Manhunter | longue | 41 / 1,0 s | Copieur (−25 %) |
| Robin | courte | 96 / 0,7 s | Booster de fusion (talent/éveil : +25 / +10 de mana par promotion, clé générique `promoteMana`) |
| Batgirl | courte | 100 / 0,75 s | — |
| Catwoman | courte | 86 / 0,6 s | Mana par élimination (remplace le vol de mana) |
| Harley Quinn | courte | 90 / 0,8 s | Sacrifice → mana |
| Green Arrow | globale | 20 / 0,8 s | — |

**Indice de puissance** (deck témoin Spider-Man, Œil de faucon, Captain Marvel, Black Widow + le héros testé, 100 parties ; Falcon = 16,72) : Robin 17,32, Batgirl 17,07, Catwoman 17,23, Harley 17,34, Green Arrow 17,38, Flash 17,14, Aquaman 17,17, Cyborg 17,46, Supergirl 16,94, Shazam 17,41, Martian 16,92, Batman 17,30, Superman 17,07, Wonder Woman 17,31, Green Lantern 17,15 (Batman à Green Lantern mesurés avant le dernier réglage des Rares). Tous entre 1,01 et 1,04 : dans les bandes (le témoin écrase les écarts entre raretés).

**Résultats** (Solo Infini, niveau 1, toits de New York, graines 1..100, rotation « tous les univers ») :

| Deck | Bot de référence | `--casual` |
|---|---|---|
| Départ Marvel | 16,72 | 15,53 |
| Départ Disney | 17,41 | 16,03 |
| Méta Marvel (Iron Man, Thor, Hulk, Cap, Widow) | **20,22** | **19,65** |
| Méta Disney | 17,19 | — |
| `dc-rares` (Robin, Batgirl, Catwoman, Harley, Green Arrow) | 17,23 (avant réglage : 13,65) | 12,43 (avant : 10,01) |
| `meta-dc` (Superman, Batman, Wonder Woman, Green Lantern, Flash) | **19,11** (−5,5 % du méta Marvel) | **17,89** (−9,0 %) |
| `bat-famille` | 19,09 | 14,09 |
| `cosmiques` | 17,88 | — |
| `riches-archers` | 18,98 | — |
| Archétypes DC (Harley, Martian, Robin, Supergirl, Catwoman) | 17,84 | — |
| Coop (50 parties) : départ Marvel / méta Marvel / méta DC / `dc-rares` | 15,24 / 15,16 / 18,86 / 9,60 | — |

**À surveiller** :
- `dc-rares` avec le joueur occasionnel (12,43, vague 10 passée à 37 %) : quatre corps à corps placés au hasard tapent peu le gros boss. Un débutant qui ne joue que des Rares DC bute sur la vague 10 ; les decks de départ restent Marvel et Disney.
- Coop et corps à corps : `dc-rares` (9,60) et un deck de corps à corps de la version 1 (Rox & Rouky, Shang-Chi, Venom, Mulan, Œil de faucon : 9,67) ne passent jamais la vague 10 en Coop avec le bot. Problème des portées courtes en Coop, pas propre à DC : à traiter sur `main` (portée courte 1,8 ou placement du bot).
- Le bot n'exploite ni l'échange (Flash) ni la formation (Green Lantern) : leur valeur réelle est sous-estimée.

## 2 sexies. Extension DC : profils Rush Royale et chapitres longs (octobre 2026)

Après la « copie Rush Royale » de `main`, les 15 héros DC reprennent chacun une unité Rush Royale non utilisée par Marvel et Disney (`docs/rush-royale-mapping.md`, « Extension DC »). Règle de fusion de Rush Royale (intervalle ÷ rang, dégâts inchangés), portées inchangées. Les dégâts des unités dont Rush Royale ne publie pas les chiffres (C) ont été réglés au simulateur ; les mêlées (portée 1,6) gardent des dégâts plus hauts, comme Hulk et Shang-Chi.

| Héros | Unité RR | Dégâts / intervalle (rang 1, niv. 1) | Portée |
|---|---|---|---|
| Batman | Chasseur de démons | 270 / 1,0 s (Bourreau 200 avant la revue des raretés) | moyenne |
| Superman | Givre | 150 / 1,0 s | globale |
| Wonder Woman | Moine | 170 / 1,0 s | moyenne |
| Green Lantern | Cultiste | 132 / 0,8 s | longue |
| Flash | Cogneur | 135 / 0,6 s | courte |
| Aquaman | Faucheuse | 140 / 1,0 s | moyenne |
| Cyborg | Génie | 90 / 0,8 s | globale |
| Supergirl | Barde | 100 / 1,0 s | longue |
| Shazam | Météore | 74 / 1,0 s (90 avant la revue des portées) | longue |
| Martian Manhunter | Mime | 30 / 1,0 s | longue |
| Robin | Ferrailleur | 140 / 0,8 s | courte |
| Batgirl | Bombardier | 61 / 0,8 s (130 avant la revue des portées) | longue |
| Catwoman | Démonologue | 140 / 0,7 s | courte |
| Harley Quinn | Clown | 150 / 0,8 s | courte |
| Green Arrow | Mage de glace | 82 / 0,5 s | globale |

**Revue des portées DC** (`docs/rush-royale-mapping.md` « Portées DC ») : Shazam moyenne → longue (90 → 74), Batgirl
courte → longue (130 → 61). `--casual`, niveau 1 : `dc-rares` 16,70 → 17,53 (30 parties), `bat-famille` 13,60 →
14,90, `cosmiques` 16,85 → 17,65, `meta-dc` 20,80 inchangé, départ Marvel 18,00 inchangé (20 parties) ; chapitre 7
`--attendu` 100 % (pire 100 %).

**Solo Infini**, niveau 1, toits de New York, graines 1..60, rotation « tous les univers » (vague moyenne) :

| Deck | Référence | `--casual` | Écart au deck Marvel comparable |
|---|---|---|---|
| Départ Marvel | 19,27 | 17,38 | — |
| Départ Disney | 15,77 | 13,98 | — |
| Méta Marvel (Iron Man, Thor, Hulk, Cap, Widow) | 25,27 | 21,52 | — |
| `meta-dc` (Superman, Batman, Wonder Woman, Green Lantern, Flash) | **23,25** | **20,17** | −8,0 % / −6,3 % (méta Marvel) |
| `dc-rares` (Robin, Batgirl, Catwoman, Harley, Green Arrow) | **17,60** | **15,77** | −8,7 % / −9,3 % (départ Marvel) ; au-dessus du départ Disney |
| `dc-epics` (Aquaman, Cyborg, Supergirl, Shazam, Flash) | 18,30 | 15,18 | — |
| `cosmiques` | 18,60 | 16,87 | — |
| `bat-famille` (Batman + 4 Rares de mêlée) | 13,85 | 9,78 | à surveiller (4 corps à corps) |

**Campagne, chapitres 7 à 9** (`--campagne c7|c8|c9 --attendu --casual`, 12 parties par niveau) : 100 % sur tous les niveaux des chapitres 7 et 8, 100 % sur les niveaux 9-1 à 9-9, **92 % sur Darkseid** (9-10). Collection attendue : ch. 7 Iron Man, Thor, Hulk, Cap, Superman niveau 9 (3 paliers) ; ch. 8 Iron Man, Thor, Superman, Wonder Woman, Batman niveau 10, ★2 ; ch. 9 Iron Man, Thor, Superman, Batman, Green Lantern niveau 10, ★4. Croissance des PV par vague réglée pour Darkseid (PV ×2) : ch. 7 ×1,032, ch. 8 ×1,024, ch. 9 ×1,016 (à ×1,025, Darkseid 0 %).

**À surveiller** :
- Darkseid avec un deck **100 % DC** (Superman, Batman, Wonder Woman, Green Lantern, Flash, même collection) : 42 % (8 % avant le relèvement de Flash à 135) contre 83 % pour le méta Marvel ; avec Cyborg à la place de Flash 67 %, avec Aquaman et Cyborg 75 %. Le Cogneur (Flash) n'entre en rage qu'avec plus de 7 ennemis sur le chemin, jamais seul face à un boss.
- Sans talents ni éveils, au niveau 10, Darkseid tient (méta Marvel 17 %, méta DC 0 %) : le boss final demande les paliers de talents et quelques éveils, comme prévu.
- `bat-famille` (quatre Rares de mêlée) reste faible pour le joueur occasionnel.

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
- Thanos (vague 50) est vaincu par **60 à 70 %** des collections fortes (niveau 10, 3 paliers, ★3) en Solo (§10 ; avant : moins de 25 % des decks méta niveau 10), et par **30 à 50 %** des duos méta niveau 10 en Coop Infini.

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
| `dc-rares` | Robin, Batgirl, Catwoman, Harley Quinn, Green Arrow | Témoin « deck de départ » DC (`DC_REFERENCE_DECKS`, `src/data/units.ts`) |
| `meta-dc` | Superman, Batman, Wonder Woman, Green Lantern, Flash | « Méta » DC : Justice League + Trinité |
| `bat-famille` | Batman, Robin, Batgirl, Catwoman, Harley Quinn | Bat-famille + Sirènes de Gotham |
| `cosmiques` | Green Lantern, Martian Manhunter, Superman, Supergirl, Shazam | Lanternes et cosmiques |
| `riches-archers` | Batman, Iron Man, Œil de faucon, Green Arrow, Robin | Équipes inter-univers |

Ces decks sont à mettre dans un fichier de données du simulateur (par exemple `scripts/decks-reference.json`, à créer par l'agent Moteur).

## 5. Coop Infini : paliers de récompenses

Coffres du prompt §5.2, donnés **à chacun** à la fin de la partie, selon le palier atteint (un palier est « atteint » quand la vague correspondante est terminée, boss compris) :

| Palier | Coffre (pour chacun) |
|---|---|
| Vague 10 | coffre en bois (§6 bis) |
| Vague 20 | coffre d'argent, 1 parchemin |
| Vague 30 | coffre d'or, 2 parchemins, 1 carte Épique garantie |
| Vague 40 | coffre héroïque, 3 parchemins, 1 skin au hasard |
| Vague 50 (Thanos vaincu) | coffre légendaire, 1 Légendaire garanti, cadre « Vainqueur de Thanos » |
| Ensuite, tous les 10 | coffre d'or et 1 parchemin |
| Vague 75 (extension DC) | coffre légendaire, 4 parchemins, 1 Légendaire garanti |
| Vague 100 (Darkseid vaincu, extension DC) | coffre légendaire, 5 parchemins, 1 Légendaire garanti, cadre « Vainqueur de Darkseid » |

Les paliers sont des données (`src/data/milestones.ts`, `INFINITE_MILESTONES`) ; le moteur émet `milestone` tous les 10 et à la 75 (avec `chest`).

**Extension DC — boss des modes infinis** : les 5 gros boss DC rejoignent la rotation (11 boss sans répétition). **Thanos** reste à la vague 50 (puis 150, 250…), **Darkseid** arrive à la vague **100** (puis toutes les 100) et a la priorité. Option de rotation (`GameConfig.bossPool`) : « Tous les univers » (`tous`, par défaut), « Marvel et Disney » (`marvel-disney` : 6 boss, Thanos à chaque palier final, pas de Darkseid) ou « DC seul » (`dc` : 5 boss, Darkseid à chaque palier final, 50 comprise). Cible : Darkseid (PV ×2 à la vague 100, soit ≈ 37 fois les PV de Thanos à la 50) n'est battu que par des decks méta niveau 10 avec éveils ★4 et plus : **< 10 %** en Solo, **15 – 30 %** en Coop.

À cela s'ajoutent +15 or par vague pour chacun et le butin d'or des boss (§6.1 du prompt). Les coffres se cumulent (atteindre la vague 30 donne bronze + argent + or).

**Cibles** (simulateur `--coop`, deux joueurs automatiques, 1 000 parties par paire de decks) :

| Duo | Vague 10 | Vague 20 | Vague 30 | Vague 40 | Vague 50 |
|---|---|---|---|---|---|
| Deux decks de départ, niveau 1-2 | ≥ 75 % | 15 – 30 % | < 5 % | — | — |
| Decks intermédiaires, niveau 5, palier 1 | ≥ 95 % | ≥ 60 % | 20 – 35 % | < 5 % | — |
| Decks méta, niveau 7, paliers 1-2 | 100 % | ≥ 90 % | ≥ 60 % | 20 – 35 % | < 5 % |
| Decks méta, niveau 10, 3 paliers | 100 % | 100 % | ≥ 90 % | ≥ 60 % | **30 – 50 %** |

Règles de cohérence :
- un duo tient en moyenne **+30 à +50 %** de vagues de plus que le meilleur des deux decks seul en Solo Infini (deux plateaux, mais des vagues Coop plus fortes : PV ×1,6 et 1,5 fois plus d'apparitions, à régler par l'agent Moteur) ;
- **économie** : une partie Coop Infini rapporte environ **50 à 80 or par minute** et par joueur jusqu'à la vague 30, contre 15 à 25 en campagne Solo ; c'est voulu (jouer ensemble est la récompense), mais **les parchemins Coop** (0 à 6 par partie jusqu'à la vague 40) ne doivent pas dépasser **40 %** des parchemins gagnés par un profil sur une semaine de jeu type (mesurer avec les journaux de partie) ;
- **contribution** : aucun des deux joueurs ne doit faire plus de **65 %** des dégâts dans une paire de decks de même niveau (sinon la jonction des chemins avantage trop un côté).

Paires de decks de référence pour la Coop : `depart-marvel` + `depart-disney` ; `meta-marvel` + `meta-disney` ; `agents-ailes` + `princesses` ; `arcanes` + `pixar-animaux` ; `controle` + `anti-boss`.

## 6. Économie et Éveils : simulation de la progression

> **Octobre 2026 : deux monnaies.** Les « éclats » payaient à la fois les packs et les montées de niveau ; ils sont remplacés par l'**or** (montées de niveau) et les **gemmes** (packs), avec des coffres partout. La simulation à jour, faite avec les vraies règles du jeu, est au **§6 bis** ; ce qui suit est l'historique du réglage des éveils (toujours valable pour les cartes, copies et cristaux).

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
   - Solo Infini et Coop Infini : 5 ✦ au palier 10, 10 au 20, 20 au 30, 30 au 40, 60 au 50, puis +10 tous les 10 ; **extension DC** : 80 ✦ au palier 75 (coffre cosmique) et 150 ✦ au palier 100 (coffre cosmique suprême), en plus des +10 des vagues 60, 70, 80 et 90 ; Darkseid vaincu : 75 ✦ (comme Thanos : 50 ✦) ;
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

### Extension DC : effet sur le rythme des éveils
- Les paliers 75 et 100 ne sont atteints qu'en fin de partie longue : le joueur type du modèle n'atteint la vague 50 qu'au mois 8. Avec 80 + 150 ✦ (+ 75 ✦ pour Darkseid) et l'hypothèse « vague 75 au mois 10, vague 100 au mois 12 », le ★10 Légendaire reste vers le **jour 255** (≈ 8,5 mois, toujours bloqué par les copies), au-dessus de la cible de 8 mois.
- Le pack DC ajoute 4 Légendaires DC : un Légendaire donné reste à 1,24 % par tirage dans son pack ; le revenu étant partagé entre trois packs, le ★10 d'un Légendaire donné ne s'accélère pas.
- 3 chapitres de plus = 21 parchemins, 9 niveaux de boss à 3 étoiles (225 ✦) et ≈ 6 000 éclats : un coup de pouce ponctuel, absorbé en 2 à 3 semaines.

### Points de vigilance
- **Inflation d'éclats** : avec les coffres de palier du §5.2, un joueur qui atteint la vague 50 chaque jour gagne ≈ 5 500 éclats par jour (≈ 60 tirages). Si la collection se remplit trop vite, réduire de moitié les éclats des coffres héroïque et légendaire, ou ne donner les coffres de palier qu'**une fois par jour et par mode** (hypothèse du modèle ; à écrire dans les règles).
- Le Légendaire garanti du coffre légendaire (vague 50) accélère le ★10 Légendaire si le joueur le choisit ; le modèle le compte comme aléatoire. Avec un Légendaire **au choix**, le ★10 tomberait vers le jour 200 : garder le tirage aléatoire.
- À mesurer dans les journaux de partie réels après un mois : vague moyenne atteinte en Infini, nombre de parties par jour, et revenu réel (éclats et ✦ par jour) pour recaler le facteur k.

## 6 bis. Deux monnaies, coffres, quêtes et Route des récompenses (octobre 2026)

Retour joueur : « La même monnaie pour pack et pour évoluer c'est nul… Les récompenses c'est pas dingue non plus. » Refonte façon Rush Royale :
- **Or** (abondant) : seulement les montées de niveau (avec les cartes) ; **gemmes** : seulement les packs (100 le tirage, 900 les 10). Cristaux ✦ et parchemins inchangés.
- Départ : 1 000 gemmes + 2 000 or + le lot de 10 offert. Profils existants : éclats → gemmes, or = 2 000 + 120/étoile + 60/vague de record + 1/XP (≤ 40 000), migration v1 → v2 (`migrateProfile`).

### Chiffres (code : `src/meta/chests.ts`, `economy.ts`, `quests.ts`, `road.ts`, `src/campaign/progress.ts`)
| Poste | Valeur |
|---|---|
| Montées de niveau (or) | 300, 700, 1 200, 2 000, 3 000, 4 500, 6 500, 9 000, 12 000 → **39 200 or** du niveau 1 au 10 (+ 21 cartes, inchangé) |
| Coffres (or ±10 % · gemmes · cartes) | bois 120 · 4 · 6 R + 1 É (50 %) ; argent 250 · 8 · 12 R, 3 É, 1 L (10 %) ; or 500 · 16 · 24 R, 6 É, 1 L (35 %) ; héroïque 1 000 · 30 · 40 R, 13 É, 1 L (75 %) ; légendaire 2 000 · 60 · 60 R, 20 É, 2-3 L. Nouveau héros : 0 / 2 / 5 / 10 / 25 %. Piles : deck actif 6 fois sur 10 |
| Campagne, victoire | coffre : rang du chapitre (1-2 bois, 3-4 argent, 5-6 or), +1 si 3 ★ dans le combat, +1 niveau 5, +2 niveau du boss ; rejouer : −1 rang, contenu × 0,5 ; 1re victoire d'un niveau de boss : +10 ✦ (lieutenant) / +20 ✦ (boss) dans le coffre |
| Campagne, fixe | +20 or par étoile nouvelle (+8 refaite) × vagues / 10 ; +2 gemmes par étoile nouvelle ; **1re victoire d'un niveau : +400 / 300 / 150 gemmes (ch. 1 / 2 / 3)** ; premières 3 ★ : +150 or + 30 / 15 / 5 gemmes (ch. 1-2 / 3 / 4-6) ; coffres d'étoiles 10/20/30 ★ : 400/800/1 200 or + 40/60/80 gemmes (+ parchemins, cartes, tirage, inchangés) ; boss de chapitre : +100 gemmes |
| Butin des boss (combat) | lieutenant 20 or, gros boss 60, Thanos 300 |
| Solo Infini | 15 or par vague ; paliers 10/20/30/40/50 : coffres bois/argent/or/héroïque/légendaire (+ ✦ et parchemins inchangés), puis coffre d'or tous les 10 ; record battu : +500 or +50 gemmes |
| Coffre quotidien | coffre d'argent + 40 gemmes + 10 ✦ (minuit, heure locale) |
| Quêtes du jour | 3 par jour parmi 8, 250 à 500 or + 25 à 35 gemmes chacune (+20 gemmes « débutant » sous le niveau de compte 15) ; coffre de la semaine (12 quêtes) : coffre légendaire + 150 gemmes + 40 ✦ + un lot de 10 offert |
| Route des récompenses | niveau n : 100 + 40 n or ; **niveaux 2 à 15 : 200 gemmes (pair) ou 150 gemmes + 30 ✦ (impair), lot de 10 offert aux niveaux 5, 10 (+300 gemmes) et 15** ; ensuite 40 gemmes (pair) ou 30 ✦ (impair) ; tous les 5 : coffre (or, héroïque dès 20, légendaire dès 40) ; tous les 10 : lot de 10 tirages offert ; cadres aux niveaux 5, 10, 20, 30, 50 |
| Calendrier de bienvenue | 7 jours de connexion (un par jour, sans obligation d'enchaîner) : 300 + lot de 10, 400, 500, 300 + lot de 10, 600, 700, 500 + lot de 10 → **3 300 gemmes + 30 tirages** |
| Packs | ×1 : Rare 72 %, Épique 24 %, Légendaire 4 % ; **lot de 10 : 60 / 30 / 10 % par carte**, ≥ 1 Épique ; Légendaire garanti au **30e** tirage (compteur par pack) ; **1er lot de 10 payé de chaque pack : Légendaire garanti** |

### Pluie de gemmes des débutants et lot de 10 boosté (octobre 2026)
Retour joueur : « Comment je gagne de la monnaie de tirage ? Je devrais pouvoir en faire beaucoup dans les bas niveaux… 10 persos par tirage c'est trop équilibré » (trop de Rares, pas de surprise). Réglage :
- **Premières victoires** des chapitres 1 à 3 : +400 / 300 / 150 gemmes par niveau (≈ un lot de 10 tous les 2 à 3 niveaux aux chapitres 1-2 ; 8 500 gemmes en tout) ; affiché sur la fiche du niveau (« Première victoire : +400 💎 »). Rien aux chapitres 4 à 6 : le rythme long reste celui du §6 bis.
- **Calendrier de bienvenue** (7 jours, 3 300 gemmes + 3 lots de 10), **Route** très généreuse jusqu'au niveau de compte 15 (≈ 2 250 gemmes + 3 lots de 10), **quêtes** +20 gemmes sous le niveau 15, **3 ★** à +30 gemmes aux chapitres 1-2.
- **Lot de 10 boosté** : 60 / 30 / 10 % par carte (un lot donne en moyenne 1 Légendaire, contre 0,4 à l'unité) ; garantie Légendaire au 30e tirage (au lieu de 40) ; le **1er lot de 10 payé de chaque pack** contient un Légendaire. Les lots offerts ont aussi les taux boostés, mais pas la garantie du 1er lot.
- **Profils existants** : le calendrier démarre à la mise à jour ; les gemmes de première victoire des niveaux déjà gagnés sont versées une fois (drapeau `gemsRetro`, `migrateProfile`), sans plafond.
- Code : `src/meta/gems.ts` (montants, calendrier, rattrapage), `pulls.ts`, `road.ts`, `quests.ts`, `src/campaign/progress.ts` ; écran Tirages : calendrier, taux ×1 / ×10, feuille « Comment gagner des gemmes ? » (`src/ui/gemsSheet.ts`).

### Simulation (`npx vite-node scripts/economie.ts -- --seeds 20 --days 400`, moteur `src/meta/economySim.ts`)
Mêmes hypothèses de joueur régulier que plus haut, mais **avec les vraies fonctions du jeu** (coffres tirés au hasard à graine, cartes réparties sur la collection réelle, packs « Complet », montées de niveau et éveils) : 3 niveaux de campagne gagnés à 3 ★ par jour (campagne finie au jour 20), puis 2 niveaux rejoués par jour ; 1 partie de Solo Infini par jour (vague 15 → 20 → 30 au jour 60 → 40 au jour 120 → 50 au jour 240) ; coffre quotidien, 3 quêtes et coffre de la semaine ; la route réclamée chaque jour ; le calendrier de bienvenue réclamé chaque jour ; un lot de 10 acheté dès 900 gemmes (le 1er de chaque pack d'abord) ; tous les tirages offerts ouverts ; l'or va d'abord au héros visé, puis au deck. Les éveils se mesurent héros par héros (un Rare du deck de départ, ou le premier Légendaire obtenu).

| Revenu moyen par jour | Or | Gemmes | ✦ | Lots de 10 ouverts (achetés + offerts) |
|---|---|---|---|---|
| Jours 1-7 | 4 990 | **2 080** | 46 | **22,2** (17 achetés) : 3,2 par jour |
| Jours 8-14 | 7 130 | **680** | 45 | **8,2** (6 achetés) : 1,2 par jour |
| Jours 15-30 | 6 400 | 290 | 57 | 6,3 : un tous les 2,5 jours |
| Jours 31-90 | 4 800 | 217 | 43 | 15,8 : un tous les 3,8 jours |
| Jours 91-240 | 6 170 | 246 | 77 | 44 : un tous les 3,4 jours |
| Jours 241-400 | 8 540 | 307 | 192 | un acheté tous les 2,9 jours |

Les 14 premiers jours : **≈ 30 lots de 10** (≈ 300 tirages, 2,2 lots par jour en moyenne, 3 la 1re semaine puis 1 la 2e). Ensuite le rythme d'avant ne change pas (un lot tous les 3 à 4 jours). Avant ce réglage : 4,3 lots la 1re semaine, 4,1 la 2e. Niveau de compte : 9 au jour 7, 24 au jour 30, 38 au jour 90, 62 au jour 240.

Sources des jours 1 à 30 (or · gemmes · ✦ par jour) : campagne, étoiles, premières victoires et boss 700 · 345 · 14 ; calendrier de bienvenue 0 · 110 · 0 (+ 3 lots de 10) ; quêtes 1 000 · 108 · 0 ; route 510 · 81 · 9 (+ lots de 10) ; coffres de victoire 1 780 · 54 · 7 ; coffre quotidien 250 · 48 · 10 ; coffres d'étoiles 480 · 36 · 0 ; coffre de la semaine 260 · 28 · 5 ; Solo Infini 770 · 21 · 10 ; butin des boss 610 · 0 · 0.

| Objectif | Visé | Obtenu (20 joueurs) | Sensibilité k = 0,8 / 1,15 |
|---|---|---|---|
| Premier ★1 | 1re semaine | **jour 8** (l'or limite, pas les cartes) | 8 / 8 |
| ★5 sur un Rare | 60 – 90 jours | **jour 84** | 105 / 77 |
| ★10 sur un Légendaire | > 240 jours | **jour 288** (≈ 9,5 mois) | > 400 / 236 |
| Lots de 10, jours 1-14 | 2 à 3 par jour au début, puis moins | **22 la 1re semaine, 8 la 2e** | — |
| Lot de 10, ensuite | tous les 3 – 4 jours | **3,4 à 3,8 jours** (jours 31-240) | — |
| Deck niveau 9 | fin de campagne (≈ jour 21) | **9,2 au jour 21**, 10 au jour 30 | — |

Garde-fous automatiques : `tests/meta/economySim.test.ts` (★1 ≤ 12 jours, ★5 Rare entre 55 et 100 jours, 14 à 28 lots de 10 la 1re semaine et moins la 2e, un lot de 10 tous les 2,5 à 4,5 jours des jours 31 à 120, pas de ★10 Légendaire avant 245 jours), `tests/meta/rewards.test.ts` (coffres à graine, quêtes, route, migration), `tests/meta/gems.test.ts` (premières victoires, calendrier, rattrapage), `tests/meta/economy.test.ts` (taux ×1 / ×10, 1er lot, garantie au 30e).

Points de vigilance :
- Les deux premières semaines sont volontairement très généreuses (≈ 30 lots de 10) : la collection se construit vite, mais l'éveil reste limité par l'or et les cristaux (★10 Légendaire inchangé, ≈ jour 288). Si c'est trop, baisser d'abord les premières victoires (400 / 300 / 150) puis le calendrier ; si le lot de 10 paraît encore « moyen », monter son Légendaire (10 %) avant de toucher au tirage à l'unité.
- k = 1,15 donne un ★10 Légendaire au jour 236, juste sous les 8 mois (inchangé par ce réglage).
- L'or ne limite plus la fin de partie (8 500 or par jour au-delà du jour 240) : il sert alors à monter toute la collection (28 héros × 39 200 or ≈ 1,1 million). Si l'or s'accumule, ajouter un coût en or aux éveils.
- Les Légendaires du coffre de palier 50 et des coffres légendaires accélèrent le ★10 si k ≥ 1,15 (jour 236) : garder le Légendaire garanti du palier 50 au hasard.

## 7. Boucle de réglage

1. Lancer tous les decks de référence au niveau 1 puis au niveau 5 (1 000 parties chacun).
2. Corriger d'abord les ennemis si **tous** les decks sont hors cible dans le même sens.
3. Corriger ensuite les unités hors bande (IP), une variable à la fois, par pas de 10 %.
4. Relancer ; consigner chaque changement (valeur avant / après, effet mesuré) dans `docs/journal.md`.
5. Vérifier la campagne (`docs/campagne.md`, §4) après chaque réglage d'ennemis ou de boss.

## 8. Profils et monstres de Rush Royale (octobre 2026)

> Agent Moteur / équilibrage. Demande : « copie complète Rush Royale ». Données et sources :
> `docs/rush-royale-donnees.md` ; correspondance des 28 héros : `docs/rush-royale-mapping.md`.

**Ce qui change dans le moteur**

- **Rang de fusion** (règle Rush Royale) : intervalle ÷ rang, dégâts par coup indépendants du rang
  (`RANK_ATTACK_SPEED = 1`, `RANK_DAMAGE = 0`) ; jusqu'à 3 coups par tick pour les cadences élevées.
- **Unités** : dégâts de base = niveau de carte 7 de Rush Royale (notre niveau 1) ; compétences, ciblage et
  intervalles de l'unité Rush Royale correspondante ; tableaux par niveau via les clés `…PerLevel`, effets
  par rang via `…PerRank`. Statue (Captain America), Bannière (Pocahontas) et Meule (Raiponce) n'attaquent pas.
- **Monstres** (Coop de Rush Royale) : 10 monstres par vague (× `enemyCountMultiplier`), vague suivante
  quand le terrain est nettoyé ; PV qui montent à chaque nouveau monstre, taux de croissance +25 % (de sa
  valeur de départ) à chaque bloc de 10 vagues ; rapide PV ×0,5 vitesse ×2 ; gros PV ×5, vitesse ×0,8,
  mana ×5, 2 vies ; mana d'élimination 10, +10 toutes les 10 vagues, 50 au plus ; mini-boss avec des
  monstres communs ; après la vague 60 (modes infinis), boss aux vagues paires et mini-boss aux impaires.
- **Valeurs Marvel Rush** (Rush Royale ne les publie pas) : PV de base 200 en vague 1, croissance ×1,17 par
  vague au 1er bloc (`WAVE_RULES.hpGrowth`, remplacée par `script.waveHpGrowth` en campagne) ; PV des boss
  inchangés (×12 lieutenant, ×25 gros boss, × PV d'un normal au début de la vague ; lieutenant ×5 depuis le §9).
- Économie : améliorations 100/200/400/**800** (Rush Royale) ; mana de départ gardé à 150 (Rush Royale :
  100 ; à 100, le deck Disney de départ perdait parfois dès la vague 1).

**Mesures** (simulateur, octobre 2026)

| Mesure | Avant | Après |
|---|---|---|
| Solo Infini, départ Marvel, niveau 1 (référence / `--casual`, 20 parties) | 16,9 / 16,0 | 19,9 / 17,8 |
| Solo Infini, départ Disney, niveau 1 (référence / `--casual`) | 17,6 / 16,2 | 17,4 / 14,3 |
| Campagne `--casual --attendu`, victoire moyenne (pire niveau), 12 parties par niveau | — | ch. 1 99 % (92 %) · ch. 2-4 100 % · ch. 5 87 % (58 %, c5-n10) · ch. 6 98 % (92 %) |
| Deck de départ niveau 1 sur le chapitre 3 (`--casual`, 8 parties) | 17 % | 40 % (avec la croissance relevée ci-dessous ; 100 % sans) |

Réglage de campagne (`src/campaign/levels.ts`, `DIFFICULTY.growth`) : ×1,14 / **1,10 / 1,10 / 1,09** /
1,07 / 1,0425 (avant : 1,075 / 1,07 / 1,07 aux chapitres 2 à 4) pour que le deck de départ peine dès le
chapitre 3. Le deck Disney de départ est plus faible que le Marvel (deux soutiens qui n'attaquent pas ou peu :
Bannière, Chaudron) : c'est le profil Rush Royale.

## 9. Copie de l'équilibrage Rush Royale (octobre 2026)

> Agent Équilibrage. Demande : « On copie l'équilibrage de Rush Royale : vitesse des sbires, PV, etc. »
> Recherche, sources et niveaux de confiance (A : chiffre lu dans le wiki, une note officielle ou les
> **textes du jeu** ; B : guide tiers ou déduction directe ; C : valeur Marvel Rush) :
> `docs/rush-royale-donnees.md` (§1, §2 et §2.4 « introuvable »).

**Valeurs reprises de Rush Royale**

| Règle | Avant | Après | Conf. |
|---|---|---|---|
| Composition des vagues (modes infinis) | normaux, rapides dès la vague 2, gros dès 4, blindés dès 6, boucliers dès 8 | **monstres communs seulement** ; la vague du mini-boss (5, 15, 25…) = mini-boss + **9 rapides** (10 monstres) | A (9 : B) |
| Composition (campagne) | idem | communs, plus gros / blindés / boucliers (ennemis propres à Marvel Rush, les contraintes « aucun blindé ne passe » en ont besoin) ; vague du lieutenant = 9 rapides | A + C |
| PV du mini-boss (lieutenant) | ×12 d'un normal | **×5** | B |
| Vitesse du mini-boss | 0,5 case/s (comme un gros boss) | **×0,8 d'un normal** (1,6 case/s, « un peu plus lent ») | B |
| Mana du mini-boss | ×1 | **×5** du mana d'élimination | A/B |
| Vies retirées à la porte | normal 1, gros 2, boss et lieutenant : toutes | normal 1, **gros, lieutenant et boss 2** ; niveau de boss : laisser passer le boss imposé = défaite | A |
| Vies en Coop | 3 | **3 partagées** (Rush Royale : 1 seule ; écart voulu par la joueuse, octobre 2026) | — |
| Vies en Solo | 3 | 3 (PvP de Rush Royale) | B |
| Chance de critique de base | 0 % | **5 %** (dégâts ×2, valeur Marvel Rush) | A (5 %) / C (×2) |
| Mana de départ | 150 | **100** | B |
| Dégâts par niveau de collection | +10 % pour tous | tableau de l'unité Rush Royale (notre niveau 1 = niveau de carte 7) pour 9 héros : Iron Man +107,25, Thor +129, Shang-Chi +98,25, Mulan +61,7, Vanellope +32,2, Black Widow +16,6, Vaïana +12,2, Captain Marvel +6,2, Œil de faucon +5 par niveau ; +10 % pour les autres | A |
| Inchangé, déjà Rush Royale | — | 10 monstres par vague, vague suivante au nettoyage, rapide PV ×0,5 vitesse ×2, gros PV ×5 mana ×5, mana d'élimination 10 → 50, invocation 10 +10, améliorations 100/200/400/800, rang = cadence, alternance boss / mini-boss après la vague 60 | A/B |

**Gardé faute de chiffre Rush Royale** (aucune source accessible, voir `docs/rush-royale-donnees.md` §2.4) :
vitesses absolues (normal 2 cases/s, gros boss 0,5), longueur du chemin, rythme d'apparition (2,6 s → 0,6 s),
PV absolus et croissance (`baseHp` 200 → **220**, seul réglage hors campagne, pour garder le Solo Infini
dans la cible ; croissance ×1,17 par vague et +25 % par bloc de 10), PV des gros boss (×25), rage (45 s),
pouvoirs des boss, dégâts critiques (×2), effet des améliorations (+15 % de dégâts, +6 % de cadence).

**Mesures** (`scripts/simulate.ts`, joueur `--casual` sauf mention ; avant = commit 4135a21)

| Mesure | Avant | Après | Cible |
|---|---|---|---|
| Solo Infini, départ Marvel niveau 1 (40 parties) | 17,63 | **18,32** | ≈ 14-18 |
| Solo Infini, départ Disney niveau 1 (40 parties) | 13,20 | **14,97** | ≈ 14-18 |
| Solo Infini, départ Marvel, bot de référence | 19,80 | 19,85 | — |
| Solo Infini, méta Marvel (Iron Man, Thor, Hulk, Cap, Widow) niveau 1 / niveau 8 (10 parties) | 25,1 / 27,7 | 24,3 / **32,6** | — |
| Coop Infini, départ Marvel × 2, bot de référence (20 parties) | 18,55 | 15,75 (mesuré avec 1 seule vie, avant le retour à 3 vies partagées) | — |
| Campagne, collection attendue : victoire moyenne (pire niveau), 10 parties par niveau | c1 99 % (90) · c2-c5 100 % · c6 99 % (90) | c1 97 % (80) — 96 % (80) sur 30 parties par niveau, avant 98 % (87) · c2 100 % · c3 99 % (90) · c4-c6 100 % | ≥ 85 % au ch. 1, ≥ 70 % ensuite |
| Deck de départ niveau 1 : ch. 1 / ch. 2 / ch. 3 | 99 % / 96 % / 40 % (pire 0) | 97 % / 89 % / **27 %** (pire 0) | peine dès le ch. 3 |

Le Disney de départ perd encore 5 % de ses parties dès la vague 1 en `--casual` (déjà le cas avant, à 150 de
mana : quatre premières invocations tombées sur Pocahontas, Nemo ou Rox hors de portée).

**Campagne** : les cibles tiennent sans retoucher les multiplicateurs (`DIFFICULTY` inchangé : PV× 1,3 → 1,9,
effectif× 1,1 → 1,4, boss× 1,0 → 1,3, croissance 1,14 / 1,10 / 1,10 / 1,09 / 1,07 / 1,0425). Les tableaux de
niveau rendent les Légendaires bien plus forts aux niveaux 6 à 8 (méta niveau 8 : +18 % de vagues en Solo) ;
les chapitres 4 à 6 restent à 100 % avec la collection attendue. Si les joueurs les trouvent trop faciles,
relever d'abord `DIFFICULTY.hp[1]` (fin de campagne).

## 10. Fin de partie des modes infinis : plus de mur vers la vague 35 (octobre 2026)

> Retours de joueuse : « En illimité, à partir de la vague 35 c'est impossible » ; « tuer un monstre revient
> à tuer un boss » ; « Maléfique à la vague 40, je lui fais 4 % de dégâts » ; 7 Thor de rangs 4 à 6 : 20 %
> des PV de Jafar à la vague 40.

**Cause** : la règle des blocs (taux de croissance +25 % par bloc de 10 vagues) faisait monter les PV de
25 % par vague dans les vagues 21-30, 30 % dans les 31-40, 34 % dans les 41-50. Les dégâts d'un plateau
plafonnent (rang 7, améliorations, éveils) : toutes les collections butaient entre la vague 32 et la 44.
Le boss de la vague 40 avait 18,3 M PV ; sur les toits de New York, il traverse le chemin (14 cases à
0,5 case/s) en **28 s**, avant même la rage (45 s) : 7 Thor de rang 5 au niveau 6 (335 k DPS mesurés,
340 k attendus, rampe +600 % atteinte en 4,7 s : pas de bogue) ne lui retirent que 22 à 26 %.

**Règle** (`src/data/enemies.ts`, `waveGrowth`) : modes infinis seulement (sans `script.waveHpGrowth`),
inchangé jusqu'à la vague 20 ; ensuite le taux redescend vers un plancher :
croissance(v) = 1 + 0,06 + (0,2125 − 0,06) × e^(−(v − 20)/15) (`lateFrom` 20, `lateFloor` 0,06,
`lateDecay` 15), soit +20 % à la vague 21, +14 % à la 30, +10 % à la 40, +8 % à la 50, +7 % à la 60, +6 %
au-delà. Mini-boss ×5 et gros boss ×25 (Thanos ×50) restent les pics. La campagne garde la règle des blocs
(simulations c1, c3, c6 identiques à l'unité près).

| Vague | PV d'un commun avant → après | Mini-boss (×5) | Gros boss (×25) |
|---|---|---|---|
| 20 | 6,0 k → 6,0 k | 30 k → 30 k | 150 k → 150 k |
| 30 | 56 k → 30 k | 280 k → 150 k | 1,40 M → 750 k |
| 40 | 734 k → 92 k | 3,7 M → 462 k | 18,3 M → 2,31 M |
| 50 (Thanos ×2) | 13,3 M → 219 k | 66 M → 1,1 M | 663 M → 11,0 M |
| 60 | 328 M → 455 k | 1,6 G → 2,3 M | 8,2 G → 11,4 M |
| 80 | 4,9 × 10¹¹ → 1,6 M | — | 1,2 × 10¹³ → 41 M |

**Mesures** (`scripts/simulate.ts --max 150`, 20 parties, joueur `--casual` / bot de référence ;
`--paliers` et `--eveil` ajoutés pour les collections) :

| Collection | Avant | Après | Cible (occasionnel) |
|---|---|---|---|
| Départ Marvel, niveau 1 | 18,1 / 19,6 | 18,1 / 19,6 | 16-19 |
| Moyenne : Thor, Iron Man, Spider-Man, Soldat de l'hiver, Black Widow ; niveau 6, 1 palier, ★1 | 31,7 / 32,1 | **38,6** / 42,8 | 35-45 |
| Forte : Iron Man, Thor, Hulk, Cap, Black Widow ; niveau 10, 3 paliers, ★3 | 38,0 / 39,2 | **64,7** / 70,0 | 55-70 |
| Maximale : idem, ★10 | 42,0 / 44,3 | **99,2** / 106,1 | 80-100+ |
| Coop Infini, départ × 2 | 17,6 / 19,5 | 17,6 / 19,5 | — |
| Coop Infini, moyenne × 2 | 31,5 / 33,3 | 36,0 / 40,9 | — |

Boss (occasionnel, tués / atteints) : collection moyenne, boss de la vague 30 19/19 en 16 s, mini-boss 35
9/18 en 10 s, boss 40 6/6 en 23 s (30 % des parties l'atteignent et le battent) ; forte, boss 40 20/20 en
8 s, **Thanos 14/18 (70 % des parties)** en 16 s, boss 60 8/12 ; maximale, Thanos 19/19. Monstre commun
(PV ÷ PV retirés par seconde) aux vagues 29-33 de la collection moyenne : 0,9-1,5 s → 0,75-1,0 s ; durée
de vie 4-5,6 s → 2,2-3,3 s. Sans étourdissement : Iron Man, Œil de faucon, Falcon, Captain Marvel, Rebelle
(niveau 6) 30,8 contre 32,8 pour le même deck avec Spider-Man (−6 %) ; départ avec Rebelle à la place de
Spider-Man 19,3 contre 18,1. La cible du §3 « Thanos battu par moins de 25 % des decks méta niveau 10 »
est remplacée par ≈ 60-70 %.

## 11. Raretés alignées sur Rush Royale (octobre 2026)

> Retours de joueuse : « Les persos Légendaires devraient copier des persos Légendaires de Rush Royale… Mulan est
> Légendaire mais copie un Rare, elle est donc faible » ; « Ralph ne devrait être qu'Épique ». Choix héros par héros :
> `docs/rush-royale-mapping.md` (« Raretés ») ; raretés de toutes les unités Rush Royale : `docs/rush-royale-donnees.md` §4.

**Changements** : nouveaux profils pour Spider-Man (Catapulte : zone + collage, le rang monte les dégâts, clé moteur
`rankDamage`), Shang-Chi (Tonnerre : chaîne de `rang` cibles à 50 %), Soldat de l'hiver (Bourreau : 141, +18,5/niv.,
exécution 20,5 % +1,5 pt/niv.), Mulan (Danse-lames, profil repris de Shang-Chi), Rox & Rouky (Voleur, portée courte,
140) ; raretés changées pour 10 héros (Loki, Ariel, Coco → Légendaires ; Vanellope, Buzz & Woody, Tiana → Épiques ;
Venom, Black Widow, Nick & Judy, Raiponce → Rares). Decks de départ inchangés.

**Mesures** (`scripts/simulate.ts`, joueur `--casual` ; avant = commit 8b50af7)

| Mesure | Avant | Après | Cible |
|---|---|---|---|
| Solo Infini, départ Marvel niveau 1 (40 parties) | 18,32 | 17,98 | 16-19 |
| Solo Infini, départ Disney niveau 1 (40 parties) | 14,97 | 15,80 | ≈ 14-18 |
| Méta Marvel niveau 8 (10 parties) | 41,1 | 41,1 | — |
| Collection moyenne (Thor, Iron Man, Spider-Man, Soldat de l'hiver, Black Widow ; niv. 6, 1 palier, ★1 ; 20 parties) | 38,55 | 38,8 | 35-45 |
| Collection forte (niv. 10, 3 paliers, ★3 ; 20 parties) | 64,7 | 64,7 | 55-70 |
| Campagne `--attendu`, 10 parties par niveau : victoire moyenne (pire niveau) | — | c1 96 % (80) · c2-c6 100 % | ≥ 85 % au ch. 1, ≥ 70 % ensuite |

**Légendaire contre Rare au même niveau** : DPS effectif (2 exemplaires de rang 3, 8 ennemis immortels, 60 s, × facteur
de couverture de la portée ; soutiens exclus ; mesure qui sous-estime le contrôle, la copie, le booster et l'exécution),
médiane par rareté au niveau 1 : **Légendaires 838** (avant 520), Épiques 719 (avant 343), Rares 513 (avant 513) ;
au niveau 8 : Légendaires 1 452, Épiques 1 540, Rares 873. Mulan : 520 → **838** au niveau 1, 3 528 au niveau 8 (×4 une
Rare médiane). Les Légendaires restent sous les Épiques au niveau 8 dans cette mesure parce que quatre d'entre elles
sont des unités d'effet (Hulk au contact, Loki copieur, Ariel qui fige, Coco booster) ; en Solo Infini, Iron Man et Thor
dominent (IP ×1,34 et ×1,09 au niveau 8).
