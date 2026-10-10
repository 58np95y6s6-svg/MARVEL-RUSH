# Correspondance Marvel Rush → Rush Royale

> Agent **Moteur / équilibrage**, octobre 2026. Chaque héros Marvel Rush reprend le **profil** d'une unité
> Rush Royale (ciblage, cadence, dégâts relatifs, compétence et ses chiffres par rang et par niveau,
> talents). Les données et leurs sources sont dans `docs/rush-royale-donnees.md` (niveau de confiance
> A/B/C). Chaque unité Rush Royale n'est utilisée qu'une fois.
>
> **Ce qui ne change pas** : la rareté Marvel Rush (elle règle les tirages : voir « Écarts »), la portée
> (Rush Royale n'en a pas ; on garde notre système et on choisit une portée cohérente avec le type
> d'unité), les clés d'archétype du moteur (`copyDamageMul`, `promoteAlly`, `swapAlly`,
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
| **Shang-Chi** | **Danse-lames** | Combattant au corps à corps : plus rapide quand il est seul, chaque danseur isolé renforce les autres. |
| **Vaïana & Pua** | **Archer du vent** | Vent et océan : mode Ouragan périodique (cadence fortement augmentée), +dégâts et +durée par rang. Borée sert à Maui. |
| **Maui** | **Borée** | Deux formes en alternance (faucon / requin) ↔ deux phases de tir (cadence / cadence + critique). Le Chasseur de démons et le Maître des esprits ne changent pas de forme. |
| **Mulan & Mushu** | **Pyrotechnicien** | Feu de Mushu : zone en nombre impair, tir sur le premier en nombre pair. |
| **Ariel & Sébastien** | **Stase** | Le chant qui « arrête » les ennemis ↔ sphères qui figent le temps. Aucune « Sirène » dans Rush Royale ; la Banshee ne fait que des dégâts. |
| **Nemo & Dory** | **Chaudron magique** | Effets au hasard (potions) et mana : la mémoire de poisson de Dory. |
| **Nick & Judy** | **Chimiste** | Malus « destruction d'armure » (Nick cassait déjà l'armure), vise le premier ennemi pas encore touché. Le Bourreau reste libre. |
| **Buzz & Woody** | **Ingénieur** | Les jouets reliés : dégâts par Ingénieur adjacent relié. |
| **Raiponce & Pascal** | **Meule** | Soutien : dégâts des voisines selon le rang. Le nettoyage des effets de boss devient un talent. |
| **Rox & Rouky** | **Jumeaux** | Duo (Lune et Soleil). Mécanique chiffrée introuvable : on garde la double attaque *(C)*. |

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

Talents : trois paliers de même famille que l'unité Rush Royale, marqués *(C)* dans `src/data/talents.ts`.

Unité Rush Royale encore libre après les extensions DC, Transformers et Pixar : Thunderer.
