# Correspondance Marvel Rush → Rush Royale

> Agent **Moteur / équilibrage**, octobre 2026. Chaque héros Marvel Rush reprend le **profil** d'une unité
> Rush Royale (ciblage, cadence, dégâts relatifs, compétence et ses chiffres par rang et par niveau,
> talents). Les données et leurs sources sont dans `docs/rush-royale-donnees.md` (niveau de confiance
> A/B/C). Chaque unité Rush Royale n'est utilisée qu'une fois.
>
> **Ce qui ne change pas** : la rareté Marvel Rush (elle règle les tirages : voir « Écarts »), la portée
> (Rush Royale n'en a pas ; on garde notre système et on choisit la portée selon le personnage et
> l'attaque de l'unité copiée : voir « Portées »), les clés d'archétype du moteur (`copyDamageMul`, `promoteAlly`, `swapAlly`,
> `sacrificeMana`, `manaPerKill`, `auraAttackSpeed`, croissance…).

## Conversion des chiffres

- **Rang de fusion** : règle Rush Royale pour toutes les unités qui attaquent — **intervalle ÷ rang**
  (rang 7 = 7 fois plus de coups), dégâts par coup **indépendants du rang**. Les effets de soutien
  (Bannière, Statue, Meule, Chimiste) montent avec le rang comme dans Rush Royale (base × rang).
- **Niveau de collection** : notre niveau 1 correspond au **niveau de carte 7** de Rush Royale (niveau de
  départ d'une légendaire), notre niveau 9 au niveau 15. Les **dégâts de base** sont ceux du niveau 7 de
  Rush Royale (interpolés quand le wiki ne donne que d'autres niveaux) ; les +10 % de dégâts par niveau
  de collection restent. Les compétences qui ont un tableau par niveau dans Rush Royale le suivent
  (clé `…PerLevel` dans `ability.params`).
- **Talents** : nos paliers 1/2/3 (niveaux 5/7/9) reprennent les talents des niveaux 9/11/13 de l'unité
  Rush Royale quand ils sont publiés ; sinon un talent de même famille, marqué *(C)*.

## Tableau

| Héros | Unité Rush Royale | Pourquoi |
|---|---|---|
| **Thor** | **Inquisiteur** | Demandé (« Thor ça doit être lui », fiche d'unité fournie). Le marteau de l'Inquisiteur devient Mjolnir : zone à 50 % des dégâts de base, +15 % de dégâts subis par coup consécutif sur la même cible (600 % au plus, remis à zéro au changement de cible), mode actif à 1/3/5/7 exemplaires (intervalle 1 s → 0,6 s, zone à 100 %). Arbre de talents complet, voir « Thor (Inquisiteur) » plus bas. Le Thunderer est libre. |
| **Hulk** | **Minotaure** | Demandé. Le Minotaure existe (légendaire, mise à jour 13.0) : Séisme périodique (ralentit, dégâts sur la durée), Éboulement à la fusion, talent Berserker. |
| **Iron Man** | **Tesla** | Demandé. Charges gagnées par les fusions adjacentes, plafond = rang, chargé : 4 cibles de plus à 50 %. |
| **Venom** | **Zélote** | Archétype croissance gardé : le symbiote « se nourrit » du mana en réserve (Zélote : dégâts ×2 vers 1 000 de mana, ×3 vers 60 000). Clé générique `growthPerMana` (points de croissance = mana en réserve), courbe `growthScale` 0,3105 × points^0,1693. L'Inquisitrice est passée à Thor. |
| **Loki** | **Arlequin** | Archétype copieur : la copie Rush Royale est celle de l'Arlequin (−35 % → −5 % selon le niveau). Le Mime ne copie pas. |
| **Coco (Miguel)** | **Dryade** | Archétype booster de fusion : glissée sur une alliée, elle lui donne +1 rang (la Meule, citée dans la demande, ne fait que des dégâts aux voisines dans Rush Royale). |
| **Vanellope & Ralph** | **Gardien du portail** | Archétype échangeur : échange avec une unité de même rang puis s'endort ; nettoie les effets négatifs. (Le « Trickster » est un héros dans Rush Royale, pas une unité.) |
| **Black Widow** | **Prêtresse** | Archétype sacrifice : fusionnée ou détruite, mana = 80 × rang. |
| **Tiana & Naveen** | **Vampire** | Archétype mana par élimination : la morsure marque la cible, qui rapporte du mana. |
| **Captain America** | **Statue de chevalier** | Boost de vitesse aux voisines ; en nombre pair, chance de critique 5 % × rang. Le Barde (mode Musique) est trop éloigné du « Leader ». |
| **Pocahontas & Meeko** | **Bannière** | Boost de vitesse aux 4 voisines, base × rang. |
| **Spider-Man** | **Trappeur** | Filets (toiles) lancés sur le chemin : ralentissent et font subir plus de dégâts, cumulables. |
| **Doctor Strange** | **Mage du portail** | Chance de renvoyer la cible au début du chemin (le portail de Strange). |
| **Œil de faucon** | **Archer** | Archer pur ; ses talents Rush Royale sont des flèches spéciales (empoisonnées, explosives), comme Clint. |
| **Falcon** | **Tireur d'élite** | Vise le plus de PV (Redwing marquait déjà le plus fort) ; Tir fou pendant les boss. |
| **Rebelle (Merida)** | **Chasseur** | Archère de la forêt : premier tir renforcé sur chaque nouvelle cible. |
| **Captain Marvel** | **Mage de feu** | Explosion autour de la cible à chaque tir (rafales photoniques). |
| **Soldat de l'hiver** | **Voleur (Rogue)** | Bonus de dégâts aléatoire jusqu'aux dégâts critiques à chaque coup. |
| **Shang-Chi** | **Danse-lames** | Les Dix Anneaux lancés ↔ les lames qui volent : plus rapide quand il est seul, chaque danseur isolé renforce les autres. Portée longue (voir « Portées »). |
| **Vaïana & Pua** | **Archer du vent** | Vent et océan : mode Ouragan périodique (cadence fortement augmentée), +dégâts et +durée par rang. Borée sert à Maui. |
| **Maui** | **Borée** | Deux formes en alternance (faucon / requin) ↔ deux phases de tir (cadence / cadence + critique). Le Chasseur de démons et le Maître des esprits ne changent pas de forme. |
| **Mulan & Mushu** | **Pyrotechnicien** | Feu de Mushu : zone en nombre impair, tir sur le premier en nombre pair. |
| **Ariel & Sébastien** | **Stase** | Le chant qui « arrête » les ennemis ↔ sphères qui figent le temps. Aucune « Sirène » dans Rush Royale ; la Banshee ne fait que des dégâts. |
| **Nemo & Dory** | **Chaudron magique** | Effets au hasard (potions) et mana : la mémoire de poisson de Dory. |
| **Nick & Judy** | **Chimiste** | Malus « destruction d'armure » (Nick cassait déjà l'armure), vise le premier ennemi pas encore touché. Le Bourreau reste libre. |
| **Buzz & Woody** | **Ingénieur** | Les jouets reliés : dégâts par Ingénieur adjacent relié. |
| **Raiponce & Pascal** | **Meule** | Soutien : dégâts des voisines selon le rang. Le nettoyage des effets de boss devient un talent. |
| **Rox & Rouky** | **Jumeaux** | Duo (Lune et Soleil). Mécanique chiffrée introuvable : on garde la double attaque *(C)*. |

## Portées (revue d'octobre 2026)

> Retour joueuse : « Shang-Chi a les mêmes capacités que Danse-lames, mais pas la même portée d'attaque… adapte
> les portées en fonction des persos. » Rush Royale n'a pas de portée ; chaque portée est choisie selon
> **(a)** le style de combat du personnage et **(b)** la façon dont l'unité Rush Royale copiée attaque
> (projectile qui vole jusqu'à la cible, sort à distance, coup au contact). Portées : globale (toute la map),
> longue 3,4, moyenne 2,4, courte 1,6 cases (`src/engine/geometry.ts`).
>
> **Compensation** : seule une unité qui **change de catégorie** voit ses dégâts recalculés, avec les facteurs
> du §2 bis de `docs/equilibrage.md` (globale 1 · longue 1,4 · moyenne 1,7 · courte 3) : dégâts × facteur
> nouveau / facteur ancien. Le pas par niveau du tableau Rush Royale (`damagePerLevel`) est multiplié par le
> même rapport, pour garder la forme du tableau (niv. 15 / niv. 7 inchangé). Les soutiens qui n'attaquent pas
> (Statue, Bannière, Meule) gardent une portée indicative.

| Héros | Unité Rush Royale | Avant → après | Pourquoi |
|---|---|---|---|
| Iron Man | Tesla | globale → **globale** | Répulseurs et uni-rayon ; la Tesla frappe à distance (éclair). |
| Spider-Man | Trappeur | longue → **longue** | Toiles tirées au loin ; le Trappeur lance ses filets sur le chemin. |
| Hulk | Minotaure | courte → **courte** | Poings et sol frappé ; Minotaure au contact (séisme). |
| Thor | Inquisiteur | longue → **longue** | Mjolnir lancé et éclairs ; marteau de l'Inquisiteur projeté. |
| Doctor Strange | Mage du portail | globale → **globale** | Sorts et portails ; sort à distance. |
| Venom | Zélote | moyenne → **moyenne** | Tentacules du symbiote : allonge, pas tir. |
| Captain Marvel | Mage de feu | globale → **globale** | Rafales photoniques ; boule de feu à distance. |
| Captain America | Statue de chevalier | moyenne → **moyenne** | Bouclier lancé qui revient ; n'attaque pas (soutien). |
| Loki | Arlequin | longue → **longue** | Dagues lancées et illusions ; cartes de l'Arlequin. |
| **Soldat de l'hiver** | Voleur | longue → **globale** (70 → 50) | Tireur d'élite (fusil) : la portée d'un sniper ; dagues lancées du Voleur. |
| Œil de faucon | Archer | globale → **globale** | Archer : flèches sur toute la map. |
| Falcon | Tireur d'élite | globale → **globale** | Tir aérien et drone Redwing. |
| Black Widow | Prêtresse | longue → **longue** | Pistolets et Morsure de veuve ; sort de la Prêtresse. |
| **Shang-Chi** | Danse-lames | courte → **longue** (215 → 100, +98,25 → +45,85/niv.) | Les Dix Anneaux sont lancés et reviennent, comme les lames du Danse-lames qui volent jusqu'à leurs cibles. |
| Vaïana & Pua | Archer du vent | longue → **longue** | Appel de l'océan, rame ; flèches de vent. |
| Maui | Borée | moyenne → **moyenne** | Hameçon géant et piqué du faucon : allonge sans tir. |
| Pocahontas & Meeko | Bannière | longue → **longue** | Couleurs du vent ; n'attaque pas (soutien). |
| **Mulan & Mushu** | Pyrotechnicien | moyenne → **longue** (229 → 189, +61,7 → +50,8/niv.) | La fusée de Mushu (l'Avalanche du film) ; le Pyrotechnicien tire des fusées au loin. |
| Rebelle | Chasseur | globale → **globale** | Archère : premier tir sur toute la map. |
| Ariel & Sébastien | Stase | longue → **longue** | Chant qui porte ; sphères de stase lancées. |
| Rox & Rouky | Jumeaux | courte → **courte** | Renard et chien : morsures au contact. |
| Tiana & Naveen | Vampire | globale → **globale** | Ray la luciole guide Tiana partout ; morsure marquée à distance. |
| Nemo & Dory | Chaudron magique | longue → **longue** | Potions lancées, courant marin. |
| Coco (Miguel) | Dryade | longue → **longue** | Guitare et chanson ; sort de la Dryade. |
| Nick & Judy | Chimiste | moyenne → **moyenne** | Enquête de terrain (stylo-carotte, menottes) ; fioles lancées de près. |
| Buzz & Woody | Ingénieur | longue → **longue** | Laser de Buzz, lasso de Woody ; tourelles reliées. |
| Raiponce & Pascal | Meule | moyenne → **moyenne** | Cheveux-fouet ; n'attaque pas (soutien). |
| Vanellope & Ralph | Gardien du portail | moyenne → **moyenne** | Kart qui « glitche », poings de Ralph. |

Catégories (Encyclopédie) mises à jour : Shang-Chi et Mulan ne sont plus « Corps à corps », le Soldat de
l'hiver devient « Tireur ».

## Thor (Inquisiteur) — fiche d'unité et arbre de talents

Source : 4 captures de la fiche « Inquisiteur » (design/references/ecrans/rr-fiche-unite-*.png), conf. A,
complétées par des recherches (alucare.fr, notes de mise à jour 17.0 et 21.0, forum : conf. B) ; *(C)* = adaptation.

- **Dégâts** : Offensif 834 au niveau de carte 12, +129 par niveau → **189 au niveau 7** (notre niveau 1).
  On garde ensuite la règle commune (+10 % par niveau de collection) au lieu des +129 linéaires, pour ne pas
  sortir Thor de l'échelle des autres héros. Intervalle 1 s, **0,6 s en mode actif**. Cible : premier.
- **Compétence** : zone = 50 % des dégâts de base (100 % actif) ; chaque coup consécutif sur la même cible :
  +15 % (plafond 600 %) ; remis à zéro au changement de cible ; actif si 1, 3, 5 ou 7 exemplaires (la fiche
  dit 1/3/5/7 ; l'ancien wiki disait 1/4/7/10). Temps de recharge du héros : ignoré (pas de héros chez nous).
- **Talents** (niveaux 9/11/13/15 de Rush Royale → nos paliers 1/2/3 aux niveaux 5/7/9 + talent ultime au niveau 10) :

| Palier | Option a | Option b |
|---|---|---|
| 1 (RR 9) | **Chevalier de lumière** (A, capture) : +6,5 % de dégâts par boss éliminé, 20 % de chance par petit boss ; fusionner un Thor → tous actifs 10 s. | **Chevalier des ténèbres** (B, alucare) : le premier Thor est toujours actif et prend 1 rang à un autre Thor toutes les 25 s. |
| 2 (RR 11) | **Purification** *(C)* : en mode actif, +30 % par coup au lieu de +15 %. Texte Rush Royale introuvable. | **Bouclier de foi** (B : un correctif fait passer son bouclier de 6 à 15 s) : toutes les 15 s, 5 s d'immunité aux pouvoirs de boss *(durée C)*. |
| 3 (RR 13) | **Ronin** (B : correctif « limite 1 100 → 800 ») : limite d'augmentation 800 %. | **Unité** (B, alucare : +15 % de dégâts au-delà de 4, critiques au-delà de 7 et 10) : +15 % de dégâts dès 4 Thor ; dès 7, 8 % de critique ×2,35 *(seuils adaptés à 1/3/5/7)*. |
| Ultime (RR 15) | **Marteau de foi** (A : 17.0, marteau qui étourdit périodiquement) : toutes les 8 s, 500 % autour de l'ennemi de tête et étourdissement 1 s *(chiffres C)*. | — |

## Écarts assumés

- **Raretés** : on garde les raretés Marvel Rush (elles règlent les tirages, domaine de l'agent Économie).
  Rush Royale : Tesla, Minotaure, Inquisiteur, Arlequin, Dryade, Statue, Trappeur, Danse-lames, Borée,
  Stase, Jumeaux = légendaires ; Zélote, Gardien du portail, Vampire, Mage du portail, Archer du vent,
  Pyrotechnicien, Ingénieur = épiques ; Prêtresse, Bannière, Tireur d'élite, Chaudron, Chimiste, Meule =
  rares ; Archer, Chasseur, Mage de feu, Voleur = communes. Spider-Man (épique chez nous) a donc le profil
  d'une légendaire, etc.
- **Unités sans attaque** : dans Rush Royale, la Statue de chevalier, la Bannière et la Meule n'attaquent
  pas (« pas de cible »). Captain America, Pocahontas et Raiponce n'attaquent donc plus.
- **Ennemis Blindé et Bouclier** : propres à Marvel Rush (des niveaux de campagne s'en servent) ; ils
  restent, plus rares.
- **Améliorations en partie** : bonus uniforme de Marvel Rush (+15 % de dégâts, +6 % de vitesse par
  niveau), sauf l'Archer (Œil de faucon) dont la vitesse monte davantage, comme dans Rush Royale.
- **Pas de critique de compte** : la chance de critique de base de Rush Royale (5 %) n'est pas reprise ;
  les critiques viennent des compétences (Statue, Borée, Voleur) et des équipes.

## Extension DC (15 héros)

> Même règle : chaque unité Rush Royale n'est utilisée qu'une fois, **aucune** de celles des 28 héros Marvel et
> Disney. Les archétypes DC sont gardés (clés génériques du moteur) et posés sur l'unité Rush Royale qui leur
> ressemble le plus. Portées : voir « Portées DC » ci-dessous. Sources : recherche web (extraits des guides alucare.fr, touchtapplay,
> wiki Fandom, tier lists 2024-2026) ; le wiki ne s'ouvre pas depuis l'environnement, d'où beaucoup de
> chiffres **(C)** (approximation) : ils ont été réglés au simulateur pour que les decks DC restent à ~10 % des
> decks Marvel (`docs/equilibrage.md` §2 sexies).

| Héros | Unité Rush Royale | Profil repris | Conf. |
|---|---|---|---|
| **Batman** | **Bourreau** (Executioner) | Achève tout ennemi sous un seuil de PV : **17,5 % (niv. 5) → 29,5 % (niv. 13)**, soit 20,5 % à notre niveau 1, +1,5 point par niveau ; seuil réduit de moitié contre boss et mini-boss. Le justicier qui met hors d'état de nuire. | A (seuils) / C (dégâts) |
| **Superman** | **Givre** (Frost) | Blizzard périodique sur tout le chemin, ralentissement qui monte avec le rang, cumulable 3 fois (souffle glacial). | A (mécanique) / C (chiffres : 4 % par rang, 6 s, 7 s) |
| **Wonder Woman** | **Moine** (Monk) | Renforcement **sans mana**, limité dans le temps, avec recharge ; plus fort avec d'autres Moines reliés (Fureur amazone partagée). | A (mécanique) / C (+60 % de cadence, zone 50 %, 5 s / 12 s) |
| **Green Lantern** | **Cultiste** (Cultist) | 132 dégâts / 0,8 s au niv. 7 ; chaque Cultiste voisin ajoute une cible (1 à 3), à 4 voisins les dégâts doublent → **archétype Formation** (groupe relié). | B |
| **Flash** | **Cogneur** (Bruiser) | Rage : au-delà de 7 monstres, 10 % de chance par monstre en plus d'entrer en furie (vitesse, dégâts, zone), sans recharge en PvE. **Archétype Échangeur** gardé (aucune unité d'échange libre : le Gardien du portail est pris). | B / C (×2 vitesse, +50 %, 5 s) |
| **Aquaman** | **Faucheuse** (Reaper) | Cible au hasard, chance d'**exécution instantanée** (5,4 % au niv. 7, +0,2 point par niveau), jamais sur les boss : le kraken qui engloutit. | A |
| **Cyborg** | **Génie** (Genie) | Les fusions chargent son « Vortex » : vitesse et dégâts en plus (vortex technologique). **Archétype Boost de vitesse** gardé (Bannière et Statue sont prises). | B (mécanique) / C (5 % par charge, 10 au plus) |
| **Supergirl** | **Barde** (Bard) | Accumule l'inspiration (dégâts proportionnels) → **archétype Croissance** (énergie solaire) ; à la fin du mode Musique, **+20 % de vitesse d'attaque pendant 10 s**. | B |
| **Shazam** | **Météore** (Meteor) | Frappe venue du ciel : zone et étourdissement périodiques (la foudre de SHAZAM !). | C |
| **Martian Manhunter** | **Mime** | Fusionne avec n'importe quelle unité de même rang « comme une copie » ; dégâts 30, 1 s → **archétype Copieur** (−25 %), Intangible gardé. | B |
| **Robin** | **Ferrailleur** (Scrapper) | Fait monter le rang d'une alliée, **20 % de chance de double montée au niv. 7, +2,5 %/niv.** → **archétype Booster de fusion**. | A |
| **Batgirl** | **Bombardier** | Commune, explosion de zone sur la cible (batarangs explosifs). | C |
| **Catwoman** | **Démonologue** (Demonologist) | Mana en plus sur les éliminations (doublé en Coop dans Rush Royale) → **archétype Mana par élimination** (barème ×2). | B |
| **Harley Quinn** | **Clown** | Fusion : chance de copie, sinon **mana** et perte de rang → **archétype Sacrifice → mana** (barème standard). | B |
| **Green Arrow** | **Mage de glace** (Cold Mage) | Chaque tir ralentit un peu plus la cible (6 % par flèche, 30 % au plus) : flèches cryogéniques. | C |

### Portées DC (revue d'octobre 2026)

Même règle que la section « Portées » (personnage + attaque de l'unité Rush Royale ; dégâts × facteur nouveau /
facteur ancien en cas de changement de catégorie).

| Héros | Unité Rush Royale | Avant → après | Pourquoi |
|---|---|---|---|
| Batman | Bourreau | moyenne → **moyenne** | Poings, grappin et batarangs de près ; la hache du Bourreau. |
| Superman | Givre | globale → **globale** | Vision thermique et souffle glacial sur tout le chemin. |
| Wonder Woman | Moine | moyenne → **moyenne** | Épée et lasso de vérité : allonge, pas tir. |
| Green Lantern | Cultiste | longue → **longue** | Constructions de l'anneau projetées ; rayon du Cultiste. |
| Flash | Cogneur | courte → **courte** | Poings à grande vitesse ; le Cogneur frappe au contact. |
| Aquaman | Faucheuse | moyenne → **moyenne** | Trident ; faux de la Faucheuse. |
| Cyborg | Génie | globale → **globale** | Canon sonique. |
| Supergirl | Barde | longue → **longue** | Vision thermique, ondes du Barde. |
| **Shazam** | Météore | moyenne → **longue** (90 → 74) | La foudre de SHAZAM ! tombe du ciel comme le Météore. |
| Martian Manhunter | Mime | longue → **longue** | Télépathie et rayons martiens. |
| Robin | Ferrailleur | courte → **courte** | Bâton bo au contact. |
| **Batgirl** | Bombardier | courte → **longue** (130 → 61) | Batarangs explosifs lancés, comme les bombes du Bombardier. |
| Catwoman | Démonologue | courte → **courte** | Griffes et fouet au contact. |
| Harley Quinn | Clown | courte → **courte** | Maillet géant. |
| Green Arrow | Mage de glace | globale → **globale** | Archer : flèches cryogéniques sur toute la map. |

Talents DC : Rush Royale ne publie pas les talents de ces unités dans les extraits trouvés ; chaque héros a
3 paliers de talents **de même famille** que son unité (seuil, cumuls, rage, charges, chance de double
montée…), marqués *(C)* dans `src/data/talents.ts`.

## Extension Transformers (15 Autobots)

> Même règle : chaque unité Rush Royale n'est utilisée qu'une fois, **aucune** de celles des 28 héros Marvel et Disney
> **ni des 15 héros DC** (Bourreau, Givre, Moine, Cultiste, Cogneur, Faucheuse, Génie, Barde, Météore, Mime, Ferrailleur,
> Bombardier, Démonologue, Clown, Mage de glace). Le wiki et les guides ne s'ouvrent pas depuis l'environnement : les
> descriptions viennent des extraits du **moteur de recherche** (table *Units* du wiki Fandom, tier lists 2023-2026,
> notes de mise à jour 34.0 à 38.0). Conf. **B** = mécanique lue dans un extrait, **C** = unité dont la mécanique n'a pas
> été trouvée (adaptation). Les dégâts sont réglés au simulateur (`docs/equilibrage.md` §2 septies).
>
> **Mécanique propre** (par-dessus le profil) : la **transformation**. Toutes les 8 s ou d'un appui, mode **robot**
> (×1,45 dégâts, ×0,75 cadence, vise le plus de PV) ↔ mode **véhicule** (×0,7 dégâts, ×1,6 cadence, vise le plus
> avancé) ; chaque héros a un effet propre à chaque mode (src/engine/transformers.ts).

| Héros | Unité Rush Royale | Profil repris | Archétype | Conf. |
|---|---|---|---|---|
| **Optimus Prime** | **Banshee** | « Attaque périodiquement les ennemis proches » → **Cri de ralliement** toutes les 6 s sur tous les ennemis à portée (150 %). Robot : hache, onde de choc 60 % ; camion : charge qui fait reculer. | — | B (mécanique) / C (chiffres) |
| **Bumblebee** | **Mage de foudre** (Lightning Mage) | Éclair sur les 3 premières cibles à 100 / 70 / 30 % → la rafale de la voiture jaune. | Échangeur | B |
| **Ironhide** | **Chasseur de démons** (Demon Hunter) | « Attaque autant de premières cibles que son rang » → double canon lourd (robot) ; fourgon : zone 50 %. | — | B |
| **Ratchet** | **Sorcière** (Witch) | En Coop, la fusion « enchante » une unité alliée → fusionné, +25 % de dégâts à une alliée 10 s ; robot : répare (retire les malus de boss) ; ambulance : vitesse aux voisines. | Boost de vitesse | B / C |
| **Jazz** | **Loup de mer** (Sea Dog) | Déterre des trésors et se renforce à chaque coffre → chaque ennemi touché rapporte du mana à sa mort, deux fois plus en voiture. | Mana par élimination | B (mécanique) / C (adaptation) |
| **Arcee** | **Cristallomancien** (Crystalmancer) | Dégâts qui montent à chaque coup sur la même cible (+12 %, +120 % au plus) ; lames à 20 % de critique ; moto : vise le plus rapide. | — | B |
| **Grimlock** | **Chaperon rouge** (Riding Hood) | Deux formes (la fillette et le loup) → robot / Dinobot T-rex (souffle de feu) ; croissance sans plafond. | Croissance | C |
| **Wheeljack** | **Corsaire** (Corsair) | « Pose des pièges explosifs, deux sortes de bombes » → grenades à effet aléatoire (robot), mine sous l'ennemi de tête (voiture de course). | Booster de fusion | B |
| **Hot Rod** | **Blazey** (légendaire de feu, mise à jour 37.0) | Tir double (robot), traînée de flammes qui brûle (bolide). | — | C |
| **Elita-1** | **Sentinelle** (Sentry) | « Premier ennemi, dégâts qui montent par paliers de 10 % » → +10 % par tir sur la même cible (+100 %) ; voiture : marque le plus fort (+15 % de dégâts subis). | — | B |
| **Bulkhead** | **Gargouille** (Gargoyle) | Gardien de pierre (unité citée dans les notes de mise à jour, mécanique introuvable) → boulet de démolition, écrasement. | Sacrifice → mana | C |
| **Sideswipe** | **Lanceur** (Thrower) | « Attaque une cible au hasard » → lames tournoyantes (robot) ; voiture : traverse la cible et 2 ennemis derrière. | — | B |
| **Prowl** | **Maléfice** (Hex) | « Renforce les 4 unités voisines (chance d'exécution) » → analyse : +12 % de dégâts aux voisines (robot) ; voiture de police : ralentit. | — | B (mécanique) / C (bonus) |
| **Mirage** | **Wukong** (mise à jour 35.0) | Le Roi singe et ses clones → hologramme d'une alliée (−25 %) ; robot invisible : un coup sur trois critique ×2,5 ; voiture : leurres. | Copieur | C |
| **Ultra Magnus** | **Épées enchantées** (Enchanted Sword) | « Les épées bleues augmentent les dégâts des unités » → Ultra Magnus alignés (+15 % chacun, zone à 3), bouclier d'équipe, porte-voitures : +10 % à toute la ligne. | Formation | B |

Talents : trois paliers de même famille que l'unité Rush Royale (rampe, cibles, bombes, aura, croissance…), marqués
*(C)* dans `src/data/talents.ts` ; Rush Royale ne publie pas les talents de ces unités dans les extraits trouvés.

### Portées Transformers (revue d'octobre 2026)

Le moteur n'a qu'une portée par unité (pas de portée par mode : `unitRange(effectiveDef(u))`) ; la portée est donc
choisie pour le héros, en pensant à ses deux modes, avec la même règle que la section « Portées » (dégâts × facteur
nouveau / facteur ancien en cas de changement de catégorie).

| Héros | Unité Rush Royale | Avant → après | Pourquoi |
|---|---|---|---|
| Optimus Prime | Banshee | moyenne → **moyenne** | Hache d'énergie et charge du camion ; le cri de la Banshee touche les ennemis proches. |
| Bumblebee | Mage de foudre | longue → **longue** | Canon du bras ; éclairs du Mage. |
| **Ironhide** | Chasseur de démons | moyenne → **longue** (270 → 222) | Double canon lourd sur plusieurs cibles, comme les carreaux du Chasseur. |
| Ratchet | Sorcière | longue → **longue** | Médecin qui soigne à distance ; sorts de la Sorcière. |
| Jazz | Loup de mer | longue → **longue** | Projecteur et blaster ; tir du pirate. |
| **Arcee** | Cristallomancien | courte → **moyenne** (150 → 85) | Blasters du bras et lames ; les cristaux sont tirés, mais elle reste une combattante rapprochée. |
| Grimlock | Chaperon rouge | courte → **courte** | Épée, mâchoires du T-rex ; le loup du Chaperon mord. |
| **Wheeljack** | Corsaire | moyenne → **longue** (130 → 107) | Grenades lancées et mines, comme les bombes du Corsaire. |
| Hot Rod | Blazey | moyenne → **moyenne** | Tir double de près, traînée de flammes du bolide. |
| Elita-1 | Sentinelle | globale → **globale** | Tireuse de précision. |
| Bulkhead | Gargouille | courte → **courte** | Boulet de démolition. |
| Sideswipe | Lanceur | moyenne → **moyenne** | Lames tournoyantes et voiture qui traverse. |
| Prowl | Maléfice | globale → **globale** | Tacticien : analyse et ralentit sur tout le chemin. |
| Mirage | Wukong | moyenne → **moyenne** | Tirs furtifs et leurres. |
| Ultra Magnus | Épées enchantées | moyenne → **moyenne** | Marteau du commandant. |

Unités Rush Royale encore libres après l'extension Transformers (pour l'extension Pixar) : Valkyrie, Rôdeur du
crépuscule (Twilight Ranger), Alchimiste, Maître des esprits, Chaman, Dryade des montagnes (Mountain Avens),
Invocateur, Empoisonneur, Médecin de peste, Robot, Tréant, Élémentaire de terre, Lierre, Archimage, Nécromancien,
Thunderer.

## Extension Pixar (15 héros, surtout des duos)

> Même règle : chaque unité Rush Royale n'est utilisée qu'une fois, **aucune** de celles des 28 héros Marvel et Disney,
> **ni des 15 héros DC** (Bourreau, Givre, Moine, Cultiste, Cogneur, Faucheuse, Génie, Barde, Météore, Mime,
> Ferrailleur, Bombardier, Démonologue, Clown, Mage de glace), **ni des 15 Autobots** (Banshee, Mage de foudre, Chasseur
> de démons, Sorcière, Loup de mer, Cristallomancien, Chaperon rouge, Corsaire, Blazey, Sentinelle, Gargouille, Lanceur,
> Maléfice, Wukong, Épées enchantées). Sources : extraits du moteur de recherche (table *Units* du wiki Fandom, tier
> lists, notes de mise à jour). Conf. **B** = mécanique lue dans un extrait, **C** = adaptation (mécanique non trouvée
> ou trop éloignée du héros). Les dégâts sont réglés au simulateur (`docs/equilibrage.md` §2 octies).
>
> **Mécanique propre** : le **coup de duo** (clé `duoEvery`, src/engine/pixar.ts). Toutes les N attaques, le partenaire
> du duo ajoute son propre coup : Flèche frappe deux fois de plus, Martin remorque, Tristesse donne un souvenir, Linguini
> renverse la marmite, EVE tire son rayon, Alberto lance une vague, Pile-Poil tire, 22 double le coup.

| Héros | Unité Rush Royale | Profil repris | Archétype | Conf. |
|---|---|---|---|---|
| **M. Indestructible** | **Valkyrie** | Frappe une ligne entière d'ennemis → **coup de poing sismique** toutes les 7 s : toute la ligne du chemin de l'ennemi de tête (250 %, étourdit 1,2 s). | — | C |
| **Elastigirl** | **Rôdeur du crépuscule** (Twilight Ranger) | Tireur à longue portée qui vise l'ennemi de tête → bras élastiques, +50 % sur la tête, ralentit 15 %. | — | C |
| **Frozone** | **Alchimiste** | Flaque qui ralentit et blesse autour de la cible → pont de glace toutes les 5 s (120 %, −45 % de vitesse 3 s). | — | B |
| **Violette & Flèche** | **Maître des esprits** (Spirit Master) | Échange de place avec une alliée → champ de force (l'alliée ignore les pouvoirs de boss 3 s) ; duo 1 sur 3 : Flèche frappe deux fois de plus. | Échangeur | B |
| **Sulli & Bob** | **Chaman** (Shaman) | Mana par ennemi tué → Bob compte les points (+2 à +12 de mana par élimination) ; rugissement toutes les 8 s (recul d'une case). | Mana par élimination | B |
| **Flash McQueen & Martin** | **Dryade des montagnes** (Mountain Avens) | Soutien qui accélère ses voisines → turbo +25 % de cadence aux 4 voisines ; duo 1 sur 5 : Martin remorque la cible. | Boost de vitesse | C |
| **Carl & Russell** | **Invocateur** (Summoner) | Fait monter une alliée de rang → booster de fusion ; les ballons soulèvent un ennemi 2 s toutes les 6 s. | Booster de fusion | B |
| **Joie & Tristesse** | **Empoisonneur** (Poisoner) | Poison qui monte avec le rang → mélancolie de Tristesse (8 % des dégâts par s et par rang, 3 s) ; copieur (−25 %) ; duo 1 sur 4 : souvenir doré ou bleu. | Copieur | B |
| **Rémy & Linguini** | **Médecin de peste** (Plague Doctor) | Unité qu'on sacrifie pour l'effet → recette : mana selon le rang en sacrifice, +4 de mana par rang à chaque vague ; duo 1 sur 4 : marmite renversée (60 % autour). | Sacrifice → mana | B |
| **WALL-E & EVE** | **Robot** | Unité à deux modes de tir → cubes compactés ; duo 1 sur 3 : rayon d'EVE (150 % à 1,5 case autour). | — | C |
| **Luca & Alberto** | **Tréant** | Plus fort à plusieurs, reliés → formation (+15 % par Luca & Alberto voisin, 3 au plus, zone à 3) ; duo 1 sur 5 : vague qui fait reculer. | Formation | C |
| **Mei (panda roux)** | **Élémentaire de terre** (Earth Elemental) | Grandit au fil du combat → croissance sans plafond (par seconde et par élimination), écrase autour (50 %). | Croissance | B |
| **Jessie & Pile-Poil** | **Lierre** (Ivy) | Entrave et affaiblit la cible → lasso : la cible subit +10 % de dégâts 4 s ; duo 1 sur 4 : Pile-Poil galope, la cible recule 1,5 s. | — | B |
| **Ian & Barley** | **Archimage** (Archmage) | Sorts au hasard → boule de feu, arrêt du temps, sort de croissance ou rayon, toutes les 6 s. | — | C |
| **Joe & 22** | **Nécromancien** (Necromancer) | Soutien de fin de partie → musique de l'âme : +25 % de cadence à tout le plateau 5 s toutes les 10 s ; duo 1 sur 5 : l'étincelle de 22 double le coup. | — | C |

### Portées Pixar (revue d'octobre 2026)

Même règle que la section « Portées » (personnage + attaque de l'unité Rush Royale ; dégâts × facteur nouveau /
facteur ancien en cas de changement de catégorie).

| Héros | Unité Rush Royale | Avant → après | Pourquoi |
|---|---|---|---|
| M. Indestructible | Valkyrie | courte → **courte** | Coups de poing qui fendent le sol ; la Valkyrie frappe au contact. |
| Elastigirl | Rôdeur du crépuscule | globale → **globale** | Bras qui s'étirent sur tout le chemin ; flèches du Rôdeur. |
| **Frozone** | Alchimiste | moyenne → **longue** (130 → 107) | Rafales de glace projetées et ponts de glace, comme les fioles lancées de l'Alchimiste. |
| Violette & Flèche | Maître des esprits | courte → **courte** | Flèche cogne en courant, Violette protège de près. |
| Sulli & Bob | Chaman | moyenne → **moyenne** | Rugissement qui porte à quelques cases. |
| Flash McQueen & Martin | Dryade des montagnes | moyenne → **moyenne** | Coups de pare-chocs et remorquage. |
| Carl & Russell | Invocateur | longue → **longue** | Ballons qui s'envolent loin. |
| Joie & Tristesse | Empoisonneur | longue → **longue** | Souvenirs lancés, larmes de Tristesse. |
| Rémy & Linguini | Médecin de peste | moyenne → **moyenne** | Cuisine de près, marmite renversée. |
| WALL-E & EVE | Robot | globale → **globale** | Rayon d'EVE, cubes lancés. |
| Luca & Alberto | Tréant | moyenne → **moyenne** | Vagues de mer près du bord. |
| Mei (panda roux) | Élémentaire de terre | courte → **courte** | Panda géant qui écrase. |
| Jessie & Pile-Poil | Lierre | moyenne → **moyenne** | Lasso : allonge moyenne. |
| Ian & Barley | Archimage | longue → **longue** | Sorts du bâton magique. |
| Joe & 22 | Nécromancien | longue → **longue** | La musique du piano porte loin. |

Talents : trois paliers de même famille que l'unité Rush Royale, marqués *(C)* dans `src/data/talents.ts`.

Unité Rush Royale encore libre après les extensions DC, Transformers et Pixar : Thunderer.
