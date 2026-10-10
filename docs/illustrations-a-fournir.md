# Illustrations de fiches à fournir

Le joueur fournit ces images plus tard. **Le jeu fonctionne sans elles** : la fiche affiche alors le personnage chibi en grand, sur un fond aux couleurs de son univers.

Pour chaque image reçue :
1. la recadrer sur l'illustration ;
2. la ranger dans le dépôt privé `D-p-t-photo-marvel` (`originaux/` et `recadrees/<id>.webp`) ;
3. la chiffrer dans le jeu avec `node scripts/encrypt-assets.mjs <clé> <dossier>`.

✅ = déjà fournie.

## Version 1

**Marvel** : ✅ ironman, ✅ spiderman, ✅ hulk, ✅ thor, ✅ strange (Doctor Strange), ✅ venom, ✅ cmarvel, ✅ cap, ✅ loki, ✅ bucky (Soldat de l'hiver), ✅ hawkeye, ✅ falcon, ✅ widow, ✅ shangchi.

**Disney** : ✅ moana (Vaïana & Pua), ✅ maui, ✅ pocahontas (& Meeko), ✅ mulan (& Mushu), ✅ merida (Rebelle), ✅ ariel (& Sébastien), ✅ foxhound (Rox & Rouky), ✅ tiana (& Naveen), ✅ nemo (& Dory), ✅ coco (Miguel), ✅ nickjudy (Nick & Judy), ✅ buzzwoody (Buzz & Woody), ✅ rapunzel (Raiponce & Pascal), ✅ vanralph (Vanellope & Ralph).

**Boss** : ✅ jafar (& Iago), ✅ cruella, ✅ ursula, ✅ malefique, ✅ galactus, ✅ bouffon (Bouffon Vert), ✅ thanos.

## Extension DC (18/10)

batman, superman, wonderwoman, flash, aquaman, greenlantern, cyborg, supergirl, shazam, robin, batgirl, catwoman, harley, martian (Martian Manhunter), greenarrow.
Boss : joker, luthor (Lex Luthor), bane, sinestro, blackadam, darkseid.

## Extension Transformers (25/10)

optimus, bumblebee, ironhide, ratchet, jazz, arcee, grimlock, wheeljack, hotrod (Hot Rod), elita (Elita-1), bulkhead, sideswipe, prowl, mirage, ultramagnus.
Boss : starscream, soundwave, shockwave, devastator, blitzwing, megatron, unicron.

## Extension Pixar (01/11)

mrincredible, elastigirl, frozone, violetflash (Violette & Flèche), sullimike (Sulli & Bob), mcqueen (& Martin), carlrussell (Carl & Russell), joysadness (Joie & Tristesse), remy (& Linguini), walleeve (WALL-E & EVE), lucaalberto (Luca & Alberto), mei, jessie (& Pile-Poil), ianbarley (Ian & Barley), joe (& 22).
Boss : syndrome, randall, lotso, hopper, muntz, zurg.

## Unités Rush Royale

La fiche de chaque héros affiche l'unité Rush Royale qu'il copie (onglet Principal : petit badge ; onglet
Info → Carte : grand cadre). Sans image, un cadre aux couleurs de la rareté avec les initiales de l'unité.
Pas d'image tierce en clair dans ce dépôt public : ranger les images dans le dépôt privé `D-p-t-photo-marvel`,
dossier `rr/`, nommées `<id>.png`, `<id>.jpg` ou `<id>.webp` (carré, l'unité centrée ; une capture de la carte
de l'unité convient), puis les chiffrer avec
`node scripts/encrypt-assets.mjs <clé> <dossier rr/ complet> public/rr`.

| id | Unité | Rareté Rush Royale | Héros |
|---|---|---|---|
| `tesla` | Tesla | légendaire | Iron Man |
| `catapult` | Catapulte | épique | Spider-Man |
| `minotaur` | Minotaure | légendaire | Hulk |
| `inquisitor` | Inquisiteur | légendaire | Thor |
| `portal-mage` | Mage du portail | épique | Doctor Strange |
| `zealot` | Zélote | rare | Venom |
| `fire-mage` | Mage de feu | commune | Captain Marvel |
| `knight-statue` | Statue de chevalier | légendaire | Captain America |
| `harlequin` | Arlequin | légendaire | Loki |
| `executioner` | Bourreau | épique | Soldat de l’hiver |
| `archer` | Archer | commune | Œil de faucon |
| `sharpshooter` | Tireur d’élite | rare | Falcon |
| `priestess` | Prêtresse | rare | Black Widow |
| `thunderer` | Tonnerre | épique | Shang-Chi |
| `wind-archer` | Archer du vent | épique | Vaïana & Pua |
| `boreas` | Borée | légendaire | Maui |
| `banner` | Bannière | rare | Pocahontas & Meeko |
| `blade-dancer` | Danse-lames | légendaire | Mulan & Mushu |
| `hunter` | Chasseur | commune | Rebelle |
| `stasis` | Stase | légendaire | Ariel & Sébastien |
| `rogue` | Voleur | commune | Rox & Rouky |
| `vampire` | Vampire | épique | Tiana & Naveen |
| `magic-cauldron` | Chaudron magique | rare | Nemo & Dory |
| `dryad` | Dryade | légendaire | Coco (Miguel) |
| `chemist` | Chimiste | rare | Nick & Judy |
| `engineer` | Ingénieur | épique | Buzz & Woody |
| `grindstone` | Meule | rare | Raiponce & Pascal |
| `portal-keeper` | Gardien du portail | épique | Vanellope & Ralph |

Les extensions ajoutent leurs unités sur leur branche (même tableau, même dossier `rr/`).

## Conseils pour les images

- Une illustration **en hauteur** (portrait), où le personnage est **entier ou en plan américain**, sans texte par-dessus.
- Une capture d'écran convient : je recadre moi-même.
- Pour un duo, une image où les deux personnages apparaissent ensemble.
