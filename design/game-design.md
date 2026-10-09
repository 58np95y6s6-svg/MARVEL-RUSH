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
| Venom | Exécution | Épique | Coup de griffes | **Dévorer** : exécute un ennemi sous 15 % de PV ; **Croissance** sans plafond (temps sur le plateau et éliminations), gardée à moitié en fusion |
| Captain Marvel | Dégâts | Rare | Rafale photonique | **Mode binaire** : dégâts doublés 5 s après une charge |
| Captain America | Soutien / rebond | Légendaire | Bouclier qui rebondit sur 3 ennemis | **Leader** (Boost de vitesse) : +15 % de vitesse d'attaque aux héros adjacents |
| Loki | Trickster | Épique | Dague magique | **Illusion** (Copieur, Formation) : glissé sur un allié de même rang, devient sa copie à −25 % de dégâts ; 3 Loki alignés se renforcent (+30 %) et frappent en zone ; les ennemis touchés peuvent reculer |
| Soldat de l'hiver | Critique | Épique | Tir de précision | **Bras bionique** : chaque 4e attaque est un critique assommant |
| Œil de faucon | Polyvalent | Rare | Flèche simple | **Flèches spéciales** : explosive, glace, électrique en alternance |
| Falcon | Ciblage | Rare | Tir aérien | **Drone Redwing** : marque l'ennemi le plus fort (+25 % de dégâts subis) |
| Black Widow | Sacrifice | Épique | Tir rapide | **Morsure de la veuve** : paralyse 1 s ; **Sacrifice** : fusionnée ou détruite, rapporte 10 à 190 de mana selon son rang |
| Shang-Chi | Combo | Épique | Enchaînement d'arts martiaux | **Dix Anneaux** : frappent jusqu'à 10 ennemis |

## Pack Disney

| Unité | Rôle | Rareté | Attaque de base | Compétence |
|---|---|---|---|---|
| Vaïana & Pua | Contrôle | Épique | Coup de rame | **Appel de l'océan** : une vague repousse les ennemis |
| Maui | Dégâts / transformation | Légendaire | Coup d'hameçon | **Métamorphose** : faucon (rapide) ou requin (dégâts massifs) |
| Pocahontas & Meeko | Soutien | Rare | Tourbillon de feuilles | **Couleurs du vent** (Boost de vitesse) : +vitesse aux voisins ; Meeko vole un bonus |
| Mulan & Mushu | Dégâts / brûlure | Légendaire | Coup d'épée | **Souffle de Mushu** : brûlure ; **Avalanche** une fois par vague |
| Rebelle | Précision | Rare | Flèche longue portée | **Tir parfait** : 100 % de critiques sur la cible la plus éloignée |
| Ariel & Sébastien | Contrôle | Épique | Bulles | **Chant de sirène** : charme et arrête les ennemis ; Sébastien pince |
| Rox & Rouky | Duo | Rare | Morsure | **Meilleurs amis** : deux attaques par tour, plus fortes si l'autre a touché |
| Tiana & Naveen | Économie | Rare | Lumière de luciole | **Restaurant** (Mana par élimination) : chaque ennemi touché rapporte +1 à +8 de mana en tombant ; la grenouille attrape un ennemi |
| Nemo & Dory | Aléatoire | Rare | Tir de bulles | **Mémoire de poisson** : effet aléatoire à chaque tir |
| Coco (Miguel) | Soutien | Épique | Notes de musique | **Remember Me** : ressuscite un héros détruit ; **Booster de fusion** : glissée sur un allié de même rang, le fait monter d'un rang |
| Nick & Judy | Contrôle / malus | Épique | Tir de carotte | **Arrestation** : stoppe un ennemi 2 s ; Nick réduit l'armure |
| Buzz & Woody | Duo / polyvalent | Légendaire | Laser de Buzz | **Vers l'infini** : laser perçant ; le lasso de Woody attrape un ennemi |
| Raiponce & Pascal | Contrôle / soin | Épique | Coup de poêle | **Cheveux magiques** : soigne et renforce ; Pascal se camoufle |
| Vanellope & Ralph | Chaos | Légendaire | Coup de poing de Ralph | **Glitch** (Échangeur) : glissée sur un allié de même rang, Vanellope échange sa place avec lui et booste ses nouveaux voisins ; Ralph détruit les boucliers |

## Archétypes de stratégie

Six capacités génériques (clés de paramètres lues par `src/engine/archetypes.ts`), que chaque extension attribue à ses héros (docs/roadmap.md) : **Sacrifice → mana** (Black Widow), **Copieur** (Loki), **Booster de fusion** (Coco), **Croissance** (Venom), **Mana par élimination** (Tiana), **Boost de vitesse** (Captain America, Pocahontas), **Échangeur** (Vanellope & Ralph), **Formation** (Loki). Les cases compatibles avec Loki, Coco et Vanellope s'illuminent comme des partenaires de fusion.

Économie de partie : bouton **Mana +** (5 niveaux, +20 % de mana chacun), **récompense de boss** (2,5 / 5,5 / 8 × le coût d'invocation), amélioration des héros à **+15 % de dégâts et +6 % de cadence** par niveau, 150 de mana au départ, premières vagues allégées.

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

---

# Extension DC Comics

Valeurs dans `src/data/units.ts`, `bosses.ts`, `teams.ts`, `talents.ts`, `awakenings.ts`, `milestones.ts` ; bandes de puissance dans `docs/equilibrage.md` §2 bis.

## Pack DC

Même prix, mêmes taux et même garantie que les packs Marvel et Disney (compteur de garantie propre au pack). 4 Légendaires, 6 Épiques, 5 Rares.

| Héros | Rôle | Rareté | Ciblage | Portée | Attaque de base | Compétence |
|---|---|---|---|---|---|---|
| Batman | Gadgets / malus | Légendaire | premier | moyenne | Batarang | **Batceinture** : une attaque sur 3, 3 batarangs à 80 % ; toutes les 10 s, **bombe fumigène** autour de l'ennemi de tête : ralentit de 40 % et expose (+20 % de dégâts subis) 3 s |
| Superman | Dégâts / contrôle | Légendaire | fort | globale | **Vision thermique** (brûle 15 %/s, 2 s) | **Souffle glacial** toutes les 12 s : gèle les 4 ennemis de tête 1,5 s ; les boss sont ralentis de 30 % |
| Wonder Woman | Zone / anti-boss | Légendaire | premier | moyenne | Coup d'épée (éclaboussure 35 %) | **Lasso de vérité** toutes les 10 s : ligote l'ennemi de tête 1,5 s ; un boss est exposé (+30 % de dégâts subis, 4 s) |
| Green Lantern | Constructions | Légendaire | aléatoire | longue | Rayon de l'anneau | **Construction** toutes les 8 s, à tour de rôle : **mur** (arrête la ligne de tête 1,5 s), **marteau** (300 % au plus fort, étourdit 1 s), **mitrailleuse** (8 tirs à 60 %) ; archétype **Formation** : +15 % par Green Lantern aligné (+30 % max), zone à 40 % à 3 alignés |
| Flash | Multi-coups | Épique | premier | courte | 3 coups éclair par attaque (anti-boucliers) | **Tour du chemin** toutes les 12 s : chaque ennemi à 300 % ; archétype **Échangeur** : glissé sur une alliée de même rang, échange sa case (sans limite), +20 % de cadence 5 s aux nouvelles voisines |
| Aquaman | Perçant / contrôle | Épique | premier | moyenne | Trident qui transperce (50 % à l'ennemi suivant) | **Kraken** toutes les 10 s : saisit les 2 ennemis de tête (150 %, arrêt 2 s) |
| Cyborg | Soutien technologique | Épique | fort | globale | Canon sonique (armure −10 %) | Archétype **Boost de vitesse** : +15 % de vitesse d'attaque aux voisines ; **Surcharge système** toutes les 12 s : +20 % de vitesse d'attaque à tout le plateau pendant 4 s |
| Supergirl | Montée en puissance | Épique | fort | longue | Coup de poing | Archétype **Croissance** (énergie solaire) : dégâts qui grandissent sans plafond avec le temps et les éliminations, moitié gardée en fusion ; à 8 éliminations, **Éruption solaire** à 400 % sur la ligne de la cible |
| Shazam | Transformation | Épique | aléatoire | moyenne | Coup de poing | **SHAZAM !** toutes les 12 s : la foudre frappe 3 ennemis à 200 %, puis 6 s transformé (×2, rebonds sur 2 ennemis à 60 %) |
| Martian Manhunter | Anti-boss / contrôle | Épique | premier | longue | Rayon martien | Archétype **Copieur** (métamorphe) : glissé sur une alliée de même rang, devient sa copie à −25 % ; **Intangibilité** : insensible à tous les pouvoirs de boss ; **Télépathie** toutes les 10 s : les 2 ennemis de tête reculent 2,5 s |
| Robin | Acrobate | Rare | premier | courte | Bâton | Archétype **Booster de fusion** : glissé sur une alliée de même rang, disparaît et la fait monter d'un rang ; une attaque sur 3 **balaie** 2 ennemis ; **Disciple** : +20 % à côté de Batman ou Batgirl |
| Batgirl | Anti-armure | Rare | fort | courte | Coup de pied | **Piratage d'Oracle** toutes les 8 s : le plus fort perd son bouclier et 30 % d'armure |
| Catwoman | Économie / ralentissement | Rare | aléatoire | courte | Fouet | Archétype **Mana par élimination** (**Cambriolage**) : chaque ennemi touché rapporte +1 à +8 de mana selon son rang quand il tombe ; un coup sur 5 ralentit de 30 % |
| Harley Quinn | Chaos | Rare | aléatoire | courte | Maillet | **Maillet chaotique** au hasard : gros maillet (×2,5, recul), confettis (éclaboussure 60 %), tarte (étourdit 1 s) ou « Oups ! » (×0,5) ; archétype **Sacrifice → mana** : fusionnée ou détruite, 10 à 190 de mana selon son rang |
| Green Arrow | Salves | Rare | premier | globale | Flèche | Une flèche sur 4 est une **flèche-filet** (arrêt 1 s) ; **salve** toutes les 8 s : 5 flèches à 70 % sur les ennemis de tête |

Talents (3 paliers × 2) et passifs d'éveil (★2, ★4, ★6, ★8, ★10) : `src/data/talents.ts` et `src/data/awakenings.ts`, tous lus par le moteur. Ultimes : Batman « Chevalier noir » (fumée sur tout le chemin), Superman « Homme de demain » (gèle tout le chemin), Wonder Woman « Lasso divin » (5 ennemis), Green Lantern « Le Corps des Green Lantern » (3 constructions à la fois), Flash « Force véloce absolue » (2 tours), Aquaman « Seigneur des océans » (transperce 3 ennemis), Cyborg « Réseau mondial » (recharge les compétences de 30 %), Supergirl « Éruption totale » (tout le chemin), Shazam « Champion éternel » (transformé en permanence), Martian « Lien psychique » (+3 cibles, même volantes), Robin « Nightwing » (Disciple toujours actif), Batgirl « Oracle » (4 cibles), Catwoman « Vol du siècle » (mana par élimination ×2), Harley « Reine du chaos » (2 effets par coup), Green Arrow « Flèches explosives » (salve qui éclabousse).

## Boss DC & sbires

| Boss | Pouvoir (toutes les 6 s) | Sbire | Particularité du sbire | Arène |
|---|---|---|---|---|
| Le Joker | **Rire du Joker** : échange les rangs de 2 unités (la plus forte devient la plus faible) | Hommes de main clowns | En bande de 3, ballons qui absorbent 2 coups | `arene-joker` |
| Lex Luthor | **Rayon de kryptonite** : l'unité de plus haut rang perd 50 % de ses dégâts 6 s ; **armure de guerre** 30 % | Robots LexCorp | Lents, blindés (40 %) | `arene-luthor` |
| Bane | **Brise-échine** : l'unité de plus haut rang perd 2 rangs ; **Venin** une fois à 50 % de PV : +15 % de PV, vitesse ×1,3 | Mercenaires | Résistants (PV ×1,5, armure 20 %), en duo | `arene-bane` |
| Sinestro | **Cage de la peur** : une colonne entière emprisonnée 3 s | Corps Sinestro | Volants, bouclier jaune (1 coup), en duo | `arene-sinestro` |
| Black Adam | **Foudre de Kahndaq** : une unité étourdie 3 s, ses voisines 1,5 s | Soldats de Kahndaq | Rapides, bouclier (1 coup), en duo | `arene-blackadam` |
| **Darkseid** (boss final DC) | Toutes les 8 s, en alternance : **Rayons Oméga** (2 unités −1 rang et étourdies 2 s) et **Boom Tube** (4 Parademons surgissent) ; à 30 % de PV, une fois, **Équation d'Anti-Vie** (annonce, puis 1 s après : 3 meilleures unités −1 rang, tout le plateau hypnotisé 2 s). PV ×2 | Parademons | Volants, très rapides, en meute de 3 | `arene-darkseid` (Apokolips) |

**Darkseid** arrive au niveau 10 du chapitre 9 et à la **vague 100** des modes infinis (puis toutes les 100) ; Thanos garde la vague 50 (puis 150, 250…). Option de rotation : tous les univers (11 gros boss, par défaut), Marvel et Disney, ou DC seul.

### Lieutenants DC (pouvoir affaibli toutes les 10 s)

| Maître | Lieutenant | Pouvoir affaibli |
|---|---|---|
| Le Joker | **Clown géant** | Échange les rangs de 2 unités qui ont au plus 2 rangs d'écart |
| Lex Luthor | **Robot LexCorp géant** | Une unité au hasard perd 30 % de ses dégâts 4 s |
| Bane | **Mercenaire géant** | L'unité de plus haut rang perd 1 rang (si rang ≥ 4) |
| Sinestro | **Soldat Sinestro géant** (volant) | Emprisonne 2 unités d'une même colonne 2 s |
| Black Adam | **Soldat de Kahndaq géant** | Étourdit 1 unité 2 s, sans rebond |
| Darkseid (vague 95, puis toutes les 100) | **Parademon géant** (volant) | En alternance : Rayon Oméga (1 unité étourdie 2 s) ou Boom Tube (2 Parademons) |

## Bonus d'équipe DC et inter-univers

| Équipe | Héros | Bonus |
|---|---|---|
| Justice League (4 sur 8) | Superman, Batman, Wonder Woman, Flash, Aquaman, Green Lantern, Cyborg, Martian Manhunter | +15 % de dégâts, +10 % de vitesse |
| Trinité (3) | Batman, Superman, Wonder Woman | +30 % de dégâts contre les boss |
| Bat-famille (2 sur 3) | Batman, Robin, Batgirl | +20 % de critiques ×2 |
| Lanternes et cosmiques (3 sur 5) | Green Lantern, Martian Manhunter, Superman, Supergirl, Shazam | Compétences −20 % de recharge, contrôles +20 % |
| Sirènes de Gotham (2) | Harley Quinn, Catwoman | +15 de mana par vague |
| **Les Riches** (inter-univers) | Iron Man, Batman | +20 de mana par vague, +10 % de dégâts |
| **Les Archers** (inter-univers, 2 sur 3) | Œil de faucon, Green Arrow, Rebelle | +15 % de vitesse, +15 % de critiques ×2 |
