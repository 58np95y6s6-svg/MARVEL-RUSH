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

### Rythme des boss (choix du joueur, prompt §4.3)

Partout (Solo, Coop, campagnes et modes infinis) :
- **petit boss « lieutenant » toutes les 5 vagues** (5, 15, 25…) ;
- **gros boss toutes les 10 vagues** (10, 20, 30…), rotation des 6 sans répétition avant que les 6 soient passés ;
- **Thanos à la vague 50**, puis toutes les 50 vagues en mode infini, et au dernier niveau de la campagne. Il remplace le gros boss de cette vague.
- Les sbires du prochain gros boss se mêlent aux ennemis des 2 vagues qui le précèdent.
- Pendant un boss (petit ou gros), les apparitions s'arrêtent ; la vague suivante commence quand il est vaincu. Rage à 45 s : vitesse ×2.

L'ordre des gros boss est **tiré au début de la partie** (graine), pour que le lieutenant de la vague 5 annonce bien le gros boss de la vague 10, celui de la vague 15 le boss de la vague 20, etc.

### Petits boss : les lieutenants

Un lieutenant est un **sbire de son maître en version géante** (taille ×2, liseré argent), qui annonce le gros boss suivant : bandeau « Le maître arrive dans 5 vagues » avec le portrait du maître. Règles communes :
- **PV** : 12 × PV d'un ennemi normal de la vague (gros boss : 25 ×) ;
- **vitesse** : ×0,8 de celle d'un ennemi normal (sauf mention) ;
- **pouvoir affaibli toutes les 10 s** (le maître : toutes les 6 s) ;
- **mana** : 50 pour le coup final (gros boss : 100) ;
- s'il atteint la porte, il retire **toutes les vies**, comme un boss (§4.1) ;
- **pas d'arène** : la map reste, mais le ciel prend la teinte de l'arène du maître pendant le combat.

| Maître | Lieutenant | Allure | Pouvoir affaibli (toutes les 10 s) | Particularité |
|---|---|---|---|---|
| Jafar & Iago | **Cobra royal** | Cobra géant doré, capuchon rouge et or, yeux jaunes en spirale, langue fourchue | **Regard hypnotique** : hypnotise **1** unité pendant **2 s** (Jafar : 1 à 2 unités, 4 s) | Vitesse ×1,2 (se faufile) |
| Cruella | **Jasper, l'homme de main** | Grand escogriffe en manteau brun, bonnet, sac de toile sur l'épaule | **Larcin** : une unité perd **1 rang pendant 5 s**, puis le récupère (Cruella : perte définitive) ; vise seulement les rangs ≥ 2 | PV ×1,2 (résistant) ; arrive escorté de 2 hommes de main normaux |
| Ursula | **Flotsam, la murène** | Murène géante vert-gris, un œil blanc et un œil jaune brillant, nage en ondulant | **Petit contrat** : échange **2 unités voisines** de la même ligne (Ursula : 2 unités quelconques) | Accompagnée de Jetsam, murène normale à PV ×3 |
| Maléfique | **Capitaine gobelin** | Gobelin géant en armure noire à pointes, lance, groin, yeux verts | **Assoupissement** : endort **2 unités** au hasard pendant **2 s** (Maléfique : une ligne entière, 3 s) | Armure 50 % |
| Galactus | **Drone-sentinelle** | Grand drone cosmique violet et bleu, anneau d'énergie, œil unique lumineux | **Grignotage** : détruit une unité de **rang 1** au hasard ; s'il n'y en a pas, rien (Galactus : rang ≤ 3) | Volant : ignore ralentissements et déplacements forcés |
| Bouffon Vert | **Citrouille-bombe géante** | Citrouille géante au sourire de feu, mèche allumée, petites ailes de chauve-souris | **Pétard** : étourdit **2 unités** pendant **1 s** (Bouffon Vert : 3 unités, 2 s) | Volante ; explose à l'arrivée (retire les vies comme un boss) |
| Thanos (vague 45, puis toutes les 50) | **Outrider alpha** | Outrider géant à quatre bras, peau grise, crocs, marque dorée sur le front | **Hurlement** : vole **10 %** du mana d'un joueur | Vitesse ×1,5 ; arrive avec une meute de 4 Outriders |

Paramètres pour `src/data/bosses.ts` (à reprendre par l'agent qui tient ce fichier) : `{ units: 1, duration: 2 }` (Cobra), `{ units: 1, rankLoss: 1, duration: 5, minRank: 2 }` (Jasper), `{ units: 2, sameRow: 1 }` (Flotsam), `{ units: 2, duration: 2 }` (Capitaine gobelin), `{ maxRank: 1, units: 1 }` (Drone-sentinelle), `{ units: 2, duration: 1 }` (Citrouille-bombe), `{ manaSteal: 0.1 }` (Outrider alpha) ; `interval: 10`, `hpMul: 12`.

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
