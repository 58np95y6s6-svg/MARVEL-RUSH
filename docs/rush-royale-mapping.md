# Correspondance Marvel Rush → Rush Royale

> Agent **Moteur / équilibrage**, octobre 2026. Chaque héros Marvel Rush reprend le **profil** d'une unité
> Rush Royale (ciblage, cadence, dégâts relatifs, compétence et ses chiffres par rang et par niveau,
> talents). Les données et leurs sources sont dans `docs/rush-royale-donnees.md` (niveau de confiance
> A/B/C). Chaque unité Rush Royale n'est utilisée qu'une fois.
>
> **Règle des raretés (octobre 2026)** : chaque héros a la **même rareté que son unité Rush Royale**
> (notre Rare ↔ commune ou rare, Épique ↔ épique, Légendaire ↔ légendaire). Voir « Raretés » plus bas.
>
> **Ce qui ne change pas** : la portée (Rush Royale n'en a pas ; on garde notre système et on choisit la portée
> selon le personnage et l'attaque de l'unité copiée : voir « Portées »), les clés d'archétype du moteur
> (`copyDamageMul`, `promoteAlly`, `swapAlly`, `sacrificeMana`, `manaPerKill`, `auraAttackSpeed`, croissance…).

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
| **Spider-Man** | **Catapulte** | *(raretés, octobre 2026)* Épique ↔ épique (le Trappeur est légendaire). La boule de toile tirée sur le premier ennemi colle tout le groupe (étourdissement de zone), un même ennemi pas avant 9 s ; le rang monte les dégâts, pas la cadence, comme la Catapulte. Chiffres non publiés *(C)*. |
| **Doctor Strange** | **Mage du portail** | Chance de renvoyer la cible au début du chemin (le portail de Strange). |
| **Œil de faucon** | **Archer** | Archer pur ; ses talents Rush Royale sont des flèches spéciales (empoisonnées, explosives), comme Clint. |
| **Falcon** | **Tireur d'élite** | Vise le plus de PV (Redwing marquait déjà le plus fort) ; Tir fou pendant les boss. |
| **Rebelle (Merida)** | **Chasseur** | Archère de la forêt : premier tir renforcé sur chaque nouvelle cible. |
| **Captain Marvel** | **Mage de feu** | Explosion autour de la cible à chaque tir (rafales photoniques). |
| **Soldat de l'hiver** | **Bourreau** | *(raretés)* Épique ↔ épique (le Voleur est commun). Le sniper achève les cibles affaiblies : 20,5 % des PV au niveau 1 (+1,5 point par niveau), moitié contre les boss. |
| **Shang-Chi** | **Tonnerre** | *(raretés)* Épique ↔ épique (la Danse-lames est légendaire et passe à Mulan). Les Dix Anneaux rebondissent d'ennemi en ennemi comme l'éclair en chaîne du Tonnerre : la cible et les ennemis qui la suivent, autant que le rang, étourdis un instant. |
| **Vaïana & Pua** | **Archer du vent** | Vent et océan : mode Ouragan périodique (cadence fortement augmentée), +dégâts et +durée par rang. Borée sert à Maui. |
| **Maui** | **Borée** | Deux formes en alternance (faucon / requin) ↔ deux phases de tir (cadence / cadence + critique). Le Chasseur de démons et le Maître des esprits ne changent pas de forme. |
| **Mulan & Mushu** | **Danse-lames** | *(raretés)* Légendaire ↔ légendaire (le Pyrotechnicien est épique : Mulan était faible). L'épée de Mulan danse comme les lames : plus rapide seule, chaque danseuse renforce les autres. Profil et tableau par niveau de la Danse-lames (215 → 1 001), portée longue. |
| **Ariel & Sébastien** | **Stase** | Le chant qui « arrête » les ennemis ↔ sphères qui figent le temps. Aucune « Sirène » dans Rush Royale ; la Banshee ne fait que des dégâts. |
| **Nemo & Dory** | **Chaudron magique** | Effets au hasard (potions) et mana : la mémoire de poisson de Dory. |
| **Nick & Judy** | **Chimiste** | Malus « destruction d'armure » (Nick cassait déjà l'armure), vise le premier ennemi pas encore touché. Le Bourreau reste libre. |
| **Buzz & Woody** | **Ingénieur** | Les jouets reliés : dégâts par Ingénieur adjacent relié. |
| **Raiponce & Pascal** | **Meule** | Soutien : dégâts des voisines selon le rang. Le nettoyage des effets de boss devient un talent. |
| **Rox & Rouky** | **Voleur (Rogue)** | *(raretés)* Rare ↔ commune (les Jumeaux sont légendaires). Les ruses du renard : chaque morsure ajoute un bonus aléatoire jusqu'aux dégâts critiques. |

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
| Spider-Man | Catapulte | longue → **longue** | Toiles tirées au loin ; boule de toile lancée comme le projectile de la Catapulte. |
| Hulk | Minotaure | courte → **courte** | Poings et sol frappé ; Minotaure au contact (séisme). |
| Thor | Inquisiteur | longue → **longue** | Mjolnir lancé et éclairs ; marteau de l'Inquisiteur projeté. |
| Doctor Strange | Mage du portail | globale → **globale** | Sorts et portails ; sort à distance. |
| Venom | Zélote | moyenne → **moyenne** | Tentacules du symbiote : allonge, pas tir. |
| Captain Marvel | Mage de feu | globale → **globale** | Rafales photoniques ; boule de feu à distance. |
| Captain America | Statue de chevalier | moyenne → **moyenne** | Bouclier lancé qui revient ; n'attaque pas (soutien). |
| Loki | Arlequin | longue → **longue** | Dagues lancées et illusions ; cartes de l'Arlequin. |
| **Soldat de l'hiver** | Bourreau | longue → **globale** (Bourreau : 141, +18,5/niv., table du niveau 7) | Tireur d'élite (fusil) : la portée d'un sniper. |
| Œil de faucon | Archer | globale → **globale** | Archer : flèches sur toute la map. |
| Falcon | Tireur d'élite | globale → **globale** | Tir aérien et drone Redwing. |
| Black Widow | Prêtresse | longue → **longue** | Pistolets et Morsure de veuve ; sort de la Prêtresse. |
| **Shang-Chi** | Tonnerre | longue → **longue** (100 *(C)*) | Les Dix Anneaux lancés rebondissent d'un ennemi à l'autre. |
| Vaïana & Pua | Archer du vent | longue → **longue** | Appel de l'océan, rame ; flèches de vent. |
| Maui | Borée | moyenne → **moyenne** | Hameçon géant et piqué du faucon : allonge sans tir. |
| Pocahontas & Meeko | Bannière | longue → **longue** | Couleurs du vent ; n'attaque pas (soutien). |
| **Mulan & Mushu** | Danse-lames | longue → **longue** (215 → 100, +98,25 → +45,85/niv.) | Les lames volent jusqu'à leurs cibles (profil repris de Shang-Chi). |
| Rebelle | Chasseur | globale → **globale** | Archère : premier tir sur toute la map. |
| Ariel & Sébastien | Stase | longue → **longue** | Chant qui porte ; sphères de stase lancées. |
| Rox & Rouky | Voleur | courte → **courte** (70 longue → 150, arrondi à 140) | Renard et chien : morsures au contact. |
| Tiana & Naveen | Vampire | globale → **globale** | Ray la luciole guide Tiana partout ; morsure marquée à distance. |
| Nemo & Dory | Chaudron magique | longue → **longue** | Potions lancées, courant marin. |
| Coco (Miguel) | Dryade | longue → **longue** | Guitare et chanson ; sort de la Dryade. |
| Nick & Judy | Chimiste | moyenne → **moyenne** | Enquête de terrain (stylo-carotte, menottes) ; fioles lancées de près. |
| Buzz & Woody | Ingénieur | longue → **longue** | Laser de Buzz, lasso de Woody ; tourelles reliées. |
| Raiponce & Pascal | Meule | moyenne → **moyenne** | Cheveux-fouet ; n'attaque pas (soutien). |
| Vanellope & Ralph | Gardien du portail | moyenne → **moyenne** | Kart qui « glitche », poings de Ralph. |

Catégories (Encyclopédie) mises à jour : Shang-Chi et Mulan ne sont plus « Corps à corps », le Soldat de
l'hiver devient « Tireur ».

## Raretés (octobre 2026)

> Retour de joueuse : « Les persos Légendaires devraient copier des persos Légendaires de Rush Royale… Mulan est
> Légendaire mais copie un Rare, elle est donc faible. » Puis : « Ralph (Vanellope & Ralph), qui reprend le
> Gardien du portail de Rush Royale, ne devrait être qu'Épique. » Raretés Rush Royale : tableau complet dans
> `docs/rush-royale-donnees.md` §4.

Pour chaque héros dont la rareté différait de celle de son unité, deux possibilités : **(a)** garder la rareté du
héros et lui donner une unité libre de la bonne rareté qui colle à son style ; **(b)** garder l'unité (quand elle
va très bien au personnage, ou qu'elle a été choisie par la joueuse) et changer la rareté du héros. Contrainte :
garder chaque univers équilibré (environ 3 à 5 Légendaires, 5 à 7 Épiques, 4 à 6 Rares). Changer de rareté ne
touche que les tirages et la couleur du cadre : les joueurs gardent leurs héros, niveaux et cartes.

| Héros | Rareté avant → après | Unité avant → après | Choix |
|---|---|---|---|
| Spider-Man | Épique | Trappeur (lég.) → **Catapulte** (ép.) | (a) : reste Épique et dans le deck de départ ; la boule de toile colle le groupe. |
| Soldat de l'hiver | Épique | Voleur (comm.) → **Bourreau** (ép.) | (a) : le sniper achève ; le Voleur va à Rox & Rouky. |
| Shang-Chi | Épique | Danse-lames (lég.) → **Tonnerre** (ép.) | (a) : anneaux en chaîne ; la Danse-lames va à Mulan. |
| Loki | Épique → **Légendaire** | Arlequin (lég.) | (b) : choix de la joueuse, aucun copieur épique (le Mime ne copie pas). |
| Venom | Épique → **Rare** | Zélote (rare) | (b) : choix de la joueuse, aucun « mana en réserve » épique. |
| Black Widow | Épique → **Rare** | Prêtresse (rare) | (b) : choix de la joueuse, aucun sacrifice épique. |
| Mulan & Mushu | Légendaire | Pyrotechnicien (ép.) → **Danse-lames** (lég.) | (a) : demandée Légendaire forte. |
| Rox & Rouky | Rare | Jumeaux (lég.) → **Voleur** (comm.) | (a) : un duo Rare ; les Jumeaux étaient de toute façon recopiés à l'aveugle *(C)*. |
| Vanellope & Ralph | Légendaire → **Épique** | Gardien du portail (ép.) | (b) : demandé par la joueuse. |
| Buzz & Woody | Légendaire → **Épique** | Ingénieur (ép.) | (b) : les jouets reliés vont très bien à l'Ingénieur (archétype Formation). |
| Tiana & Naveen | Rare → **Épique** | Vampire (ép.) | (b) : la morsure qui rapporte du mana ; aucune unité rare de mana par élimination. |
| Ariel & Sébastien | Épique → **Légendaire** | Stase (lég.) | (b) : le chant qui fige ↔ la Stase. |
| Coco (Miguel) | Épique → **Légendaire** | Dryade (lég.) | (b) : choix de la joueuse (booster de fusion). |
| Nick & Judy | Épique → **Rare** | Chimiste (rare) | (b) : la fiche de police ↔ destruction d'armure. |
| Raiponce & Pascal | Épique → **Rare** | Meule (rare) | (b) : soutien qui n'attaque pas. |

Bilan par univers : **Marvel** 5 Légendaires (Iron Man, Hulk, Thor, Captain America, Loki), 4 Épiques
(Spider-Man, Doctor Strange, Soldat de l'hiver, Shang-Chi), 5 Rares ; **Disney** 4 Légendaires (Maui, Mulan,
Ariel, Coco), 4 Épiques (Vaïana, Tiana, Buzz & Woody, Vanellope & Ralph), 6 Rares. Avant : Marvel 4/7/3, Disney
4/5/5. Decks de départ inchangés (Marvel : 1 Épique, Spider-Man ; Disney : 1 Épique, Tiana).

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

- **Raretés** : remplacé par la règle « même rareté que l'unité Rush Royale » (section « Raretés »).
- **Unités sans attaque** : dans Rush Royale, la Statue de chevalier, la Bannière et la Meule n'attaquent
  pas (« pas de cible »). Captain America, Pocahontas et Raiponce n'attaquent donc plus.
- **Ennemis Blindé et Bouclier** : propres à Marvel Rush (des niveaux de campagne s'en servent) ; ils
  restent, plus rares.
- **Améliorations en partie** : bonus uniforme de Marvel Rush (+15 % de dégâts, +6 % de vitesse par
  niveau), sauf l'Archer (Œil de faucon) dont la vitesse monte davantage, comme dans Rush Royale.
- **Pas de critique de compte** : la chance de critique de base de Rush Royale (5 %) n'est pas reprise ;
  les critiques viennent des compétences (Statue, Borée, Voleur) et des équipes.
