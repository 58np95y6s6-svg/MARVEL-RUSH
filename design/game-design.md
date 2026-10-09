# Game design — Marvel Rush

Les chiffres (%, secondes, rebonds) sont des valeurs de départ à équilibrer en test.

## Pack Marvel

| Héros | Rôle | Rareté | Attaque de base | Compétence |
|---|---|---|---|---|
| Iron Man | Dégâts | Légendaire | Rayon répulseur sur la cible la plus proche | **Uni-Beam** : toutes les 10 s, un laser transperce toute la ligne |
| Spider-Man | Contrôle | Épique | Tir de toile rapide | **Toile collante** : ralentit de 30 %, cumulable jusqu'à immobiliser |
| Hulk | Dégâts de zone | Légendaire | Coup de poing lent et puissant | **Rage** puis **Hulk Smash** : étourdit tous les ennemis autour |
| Thor | Dégâts en chaîne | Légendaire | Coup de marteau électrique | **Éclair en chaîne** : rebondit sur 3 à 5 ennemis |
| Doctor Strange | Soutien / contrôle | Épique | Projectile magique | **Portail** : renvoie un ennemi au début du chemin |
| Venom | Exécution | Épique | Coup de griffes | **Dévorer** : exécute un ennemi sous 15 % de PV |
| Captain Marvel | Dégâts | Rare | Rafale photonique | **Mode binaire** : dégâts doublés 5 s après une charge |
| Captain America | Soutien / rebond | Légendaire | Bouclier qui rebondit sur 3 ennemis | **Leader** : +15 % de vitesse d'attaque aux héros adjacents |
| Loki | Trickster | Épique | Dague magique | **Illusion** : se copie en un autre héros 10 s ; les ennemis touchés s'attaquent entre eux |
| Soldat de l'hiver | Critique | Épique | Tir de précision | **Bras bionique** : chaque 4e attaque est un critique assommant |
| Œil de faucon | Polyvalent | Rare | Flèche simple | **Flèches spéciales** : explosive, glace, électrique en alternance |
| Falcon | Ciblage | Rare | Tir aérien | **Drone Redwing** : marque l'ennemi le plus fort (+25 % de dégâts subis) |
| Black Widow | Anti-boss | Épique | Tir rapide | **Morsure de la veuve** : paralyse 1 s ; dégâts doublés contre les boss |
| Shang-Chi | Combo | Épique | Enchaînement d'arts martiaux | **Dix Anneaux** : frappent jusqu'à 10 ennemis |

## Pack Disney

| Unité | Rôle | Rareté | Attaque de base | Compétence |
|---|---|---|---|---|
| Vaïana & Pua | Contrôle | Épique | Coup de rame | **Appel de l'océan** : une vague repousse les ennemis |
| Maui | Dégâts / transformation | Légendaire | Coup d'hameçon | **Métamorphose** : faucon (rapide) ou requin (dégâts massifs) |
| Pocahontas & Meeko | Soutien | Rare | Tourbillon de feuilles | **Couleurs du vent** : +vitesse aux voisins ; Meeko vole un bonus |
| Mulan & Mushu | Dégâts / brûlure | Légendaire | Coup d'épée | **Souffle de Mushu** : brûlure ; **Avalanche** une fois par vague |
| Rebelle | Précision | Rare | Flèche longue portée | **Tir parfait** : 100 % de critiques sur la cible la plus éloignée |
| Ariel & Sébastien | Contrôle | Épique | Bulles | **Chant de sirène** : charme et arrête les ennemis ; Sébastien pince |
| Rox & Rouky | Duo | Rare | Morsure | **Meilleurs amis** : deux attaques par tour, plus fortes si l'autre a touché |
| Tiana & Naveen | Économie | Rare | Lumière de luciole | **Restaurant** : mana bonus à chaque vague ; la grenouille attrape un ennemi |
| Nemo & Dory | Aléatoire | Rare | Tir de bulles | **Mémoire de poisson** : effet aléatoire à chaque tir |
| Coco (Miguel) | Soutien | Épique | Notes de musique | **Remember Me** : ressuscite un héros détruit |
| Nick & Judy | Contrôle / malus | Épique | Tir de carotte | **Arrestation** : stoppe un ennemi 2 s ; Nick réduit l'armure |
| Buzz & Woody | Duo / polyvalent | Légendaire | Laser de Buzz | **Vers l'infini** : laser perçant ; le lasso de Woody attrape un ennemi |
| Raiponce & Pascal | Contrôle / soin | Épique | Coup de poêle | **Cheveux magiques** : soigne et renforce ; Pascal se camoufle |
| Vanellope & Ralph | Chaos | Légendaire | Coup de poing de Ralph | **Glitch** : Vanellope se téléporte ; Ralph détruit les boucliers |

## Boss & sbires

| Boss | Pouvoir | Sbire | Particularité du sbire |
|---|---|---|---|
| Jafar & Iago | **Hypnose** : un héros arrête d'attaquer | Cobras | Rapides, se faufilent |
| Cruella | **Vol de manteau** : vole le bonus de fusion d'un héros | Hommes de main | Résistants, en groupe |
| Ursula | **Contrat** : échange la position de 2 héros | Murènes | Avancent en duo |
| Maléfique | **Sommeil maudit** : endort une ligne de héros | Gardes gobelins | Armure élevée |
| Galactus | **Dévoreur** : détruit un héros aléatoire toutes les X s | Drones cosmiques | Volent, ignorent certains contrôles |
| Bouffon Vert | **Bombes citrouilles** : bombardent et étourdissent | Citrouilles volantes | Explosent à l'arrivée |
| **Thanos** (boss final) | **Gant de l'infini** : toutes les 8 s, le pouvoir d'une Pierre au hasard ; à 30 % de PV, **Claquement de doigts** | Outriders | Très rapides, arrivent en meute |

## Bonus d'équipe

| Équipe | Héros | Bonus |
|---|---|---|
| Avengers (3) | Iron Man, Thor, Hulk | +20 % de dégâts |
| Avengers (5) | + Captain America, Black Widow | +35 % de dégâts, +10 % de vitesse |
| Asgard (2) | Thor, Loki | Les éclairs appliquent l'illusion |
| Les Agents (3) | Black Widow, Œil de faucon, Soldat de l'hiver | +30 % de critiques |
| Arcanes (3) | Doctor Strange, Loki, Shang-Chi | Compétences rechargées 25 % plus vite |
| Les Ailes (2-3) | Falcon, Captain America, Soldat de l'hiver | Les cibles marquées sont ralenties |
| Océan (3-4) | Vaïana, Maui, Ariel, Nemo & Dory | Contrôles +50 % de durée |
| Princesses (3-5) | Mulan, Rebelle, Tiana, Raiponce, Pocahontas | +mana par vague |
| Duos Pixar (3) | Buzz & Woody, Nemo & Dory, Coco | Chance de double attaque |
| Animaux (3) | Rox & Rouky, Nick & Judy, Nemo & Dory | +vitesse d'attaque |
