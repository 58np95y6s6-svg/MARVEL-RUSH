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
