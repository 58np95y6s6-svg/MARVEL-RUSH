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
| **Thor** | **Thunderer** (éclair en chaîne) + talent **Marteau de la foi** | La demande cite « le Paladin (marteau) » : **aucune unité Paladin n'existe** dans Rush Royale (liste complète du wiki, recherches en anglais et en français). Le seul marteau d'unité est le talent *Marteau de la foi* de l'Inquisitrice ; Thor prend donc l'unité de l'éclair (Thunderer : +1 cible par rang) et le marteau devient son talent de palier 3. |
| **Hulk** | **Minotaure** | Demandé. Le Minotaure existe (légendaire, mise à jour 13.0) : Séisme périodique (ralentit, dégâts sur la durée), Éboulement à la fusion, talent Berserker. |
| **Iron Man** | **Tesla** | Demandé. Charges gagnées par les fusions adjacentes, plafond = rang, chargé : 4 cibles de plus à 50 %. |
| **Venom** | **Inquisitrice** | Archétype croissance : dégâts qui montent à chaque coup sur la même cible (×2 vers 23 coups, ×3 vers 154), activation à 1/4/7/10 exemplaires. |
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

## Écarts assumés

- **Raretés** : on garde les raretés Marvel Rush (elles règlent les tirages, domaine de l'agent Économie).
  Rush Royale : Tesla, Minotaure, Inquisitrice, Arlequin, Dryade, Statue, Trappeur, Danse-lames, Borée,
  Stase, Jumeaux = légendaires ; Thunderer, Gardien du portail, Vampire, Mage du portail, Archer du vent,
  Pyrotechnicien, Ingénieur = épiques ; Prêtresse, Bannière, Tireur d'élite, Chaudron, Chimiste, Meule =
  rares ; Archer, Chasseur, Mage de feu, Voleur = communes. Thor (légendaire chez nous) a donc le profil
  d'une épique, Spider-Man (épique) celui d'une légendaire, etc.
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
> ressemble le plus. Portées inchangées. Sources : recherche web (extraits des guides alucare.fr, touchtapplay,
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

Talents DC : Rush Royale ne publie pas les talents de ces unités dans les extraits trouvés ; chaque héros a
3 paliers de talents **de même famille** que son unité (seuil, cumuls, rage, charges, chance de double
montée…), marqués *(C)* dans `src/data/talents.ts`.
