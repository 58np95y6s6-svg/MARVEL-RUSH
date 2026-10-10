# Feuille de route — Marvel Rush

## Version 1 (en cours)
Le contenu du prompt `docs/prompt-jeu.md` : packs Marvel et Disney, campagne Solo et Coop (6 chapitres × 10 niveaux chacune), Solo Infini et Coop Infini, éveils, tutoriel, PWA à lien secret.

## Prochaine mise à jour : extension DC Comics

Idée validée par le joueur, à détailler quand la version 1 sera terminée.

### Contenu
- **Pack DC** : un 3e pack de tirage, avec les mêmes prix, taux et garantie que les deux autres.
- **Héros DC** (une quinzaine, la liste reste à valider) : Batman, Superman, Wonder Woman, Flash, Aquaman, Green Lantern, Cyborg, Supergirl, Shazam, Robin, Batgirl, Catwoman, Harley Quinn (anti-héroïne), Martian Manhunter, Green Arrow.
- **Méchants DC** : de nouveaux gros boss avec leurs lieutenants et leurs sbires. Par exemple :
  - Joker, avec des hommes de main clowns ;
  - Lex Luthor, avec des robots LexCorp ;
  - Bane, avec des mercenaires ;
  - Sinestro, avec le Corps Sinestro ;
  - Black Adam ;
  - et **Darkseid** en boss final de l'extension, avec des Parademons.
- **Maps DC** : Gotham City la nuit, Metropolis, Themyscira, Atlantis, la Batcave, l'Oa des Green Lanterns, et Apokolips comme arène de Darkseid.
- **Équipes DC** : Justice League, Trinité (Batman, Superman, Wonder Woman), Bat-famille, Green Lanterns… avec des bonus d'équipe **inter-univers** possibles (par exemple « Les Riches » : Iron Man et Batman).

### Campagne
- **+30 niveaux** : 3 nouveaux chapitres (7 : Gotham, 8 : Metropolis et Themyscira, 9 : Apokolips), en Solo et en Coop, avec le même rythme : petit boss au niveau 5, gros boss au niveau 10, Darkseid au dernier niveau.
- Ils s'ouvrent après le chapitre 6 (Thanos).

### Modes infinis adaptés
- Les gros boss DC rejoignent la rotation des gros boss.
- **Paliers prolongés** : Darkseid à la vague 100, avec un nouveau coffre « Cosmique » à 75 et à 100 vagues, et des cristaux d'éveil en conséquence.
- Option de rotation : « Tous les univers » (par défaut), « Marvel et Disney », ou « DC seul ».

### Éveils, talents, illustrations
- Mêmes règles d'éveil (★1 à ★10) et de talents pour les héros DC, plus 5 passifs par héros.
- Illustrations de fiches DC à ajouter dans le dépôt privé, puis à chiffrer comme les autres.

## Règle pour chaque extension : les archétypes de stratégie

Demande du joueur : chaque extension doit proposer des capacités de stratégie du même genre que celles de la version 1. Le moteur les gère de façon **générique** (clés de paramètres de compétence), donc une extension n'a qu'à les attribuer à ses héros.

| Archétype | Effet | Version 1 | DC |
|---|---|---|---|
| Sacrifice → mana | Fusionnée ou détruite : gain de mana croissant avec le niveau (10, 25, 45, 70, 100, 140, 190) | Black Widow | Harley Quinn |
| Copieur | Glissé sur un allié de même niveau, devient sa copie à −25 % d'attaque, sans limite | Loki | Martian Manhunter |
| Booster de fusion | Glissé sur un allié de même niveau, disparaît et le fait monter d'un niveau (il garde son identité) | Coco (Miguel) | Robin |
| Croissance | Dégâts qui grandissent avec le temps et les éliminations, sans plafond, gardés en partie à la fusion | Venom | Supergirl |
| Mana par élimination | Mana à chaque élimination, croissant avec le niveau | Tiana & Naveen | Catwoman |
| Boost de vitesse | Aura de cadence aux voisins | Captain America, Pocahontas | Cyborg |
| Échangeur | Glissé sur un allié de même niveau, échange sa place avec lui, sans limite | Vanellope & Ralph | Flash |
| Formation | Exemplaires alignés (ligne ou colonne) : +15 % de dégâts par allié aligné (max 3), attaques de zone à 3 | Loki | à attribuer |

Transformers (`extension/transformers`) : sacrifice Bulkhead, copieur Mirage, booster Wheeljack, croissance Grimlock, mana par élimination Jazz, vitesse Ratchet, échangeur Bumblebee, formation Ultra Magnus.

Transformers et Pixar devront couvrir les huit archétypes (au moins un héros chacun), en plus de leur mécanique propre.

## Mise à jour suivante : extension TRANSFORMERS (publication le 25/10) — prête sur `extension/transformers`

Liste définitive, établie par le chef de projet à la demande du joueur.

**Mécanique propre à l'extension : la transformation.** Chaque Autobot alterne entre un **mode robot** (frappe forte et lente, sur l'ennemi le plus fort) et un **mode véhicule** (rapide, sur l'ennemi le plus avancé), toutes les 8 s ou d'un appui sur l'unité, avec une animation de transformation.

**Pack Transformers : 15 Autobots**

| id | Héros | Rareté | Mode robot | Mode véhicule |
|---|---|---|---|---|
| optimus | Optimus Prime | Légendaire | Hache d'énergie, onde de choc | Camion : charge qui repousse |
| bumblebee | Bumblebee | Rare | Canon du bras | Voiture jaune : rafales rapides |
| ironhide | Ironhide | Épique | Double canon lourd | Fourgon : dégâts de zone |
| ratchet | Ratchet | Rare | Soigne : retire les malus des voisins | Ambulance : vitesse aux voisins |
| jazz | Jazz | Rare | Projecteur aveuglant (étourdit) | Voiture de sport : mana à chaque élimination |
| arcee | Arcee | Épique | Lames, coups critiques | Moto : vise les plus rapides |
| grimlock | Grimlock | Légendaire | Épée et bouclier | Dinobot T-rex : souffle de feu |
| wheeljack | Wheeljack | Épique | Grenades expérimentales (effet aléatoire) | Voiture de course : piège sur le chemin |
| hotrod | Hot Rod | Épique | Tir double | Bolide : traînée de flammes |
| elita | Elita-1 | Rare | Tir de précision | Voiture : marque l'ennemi le plus fort |
| bulkhead | Bulkhead | Rare | Boulet de démolition | Tout-terrain : écrasement |
| sideswipe | Sideswipe | Rare | Lames tournoyantes | Voiture : traverse plusieurs ennemis |
| prowl | Prowl | Rare | Analyse : +dégâts aux voisins | Voiture de police : ralentit |
| mirage | Mirage | Épique | Invisibilité, critiques garantis | Voiture : leurres |
| ultramagnus | Ultra Magnus | Légendaire | Marteau, bouclier d'équipe | Porte-voitures : renforce toute la ligne |

**Decepticons**
- 5 gros boss : **Starscream** (missiles en piqué), **Soundwave** (brouillage : désactive les améliorations), **Shockwave** (rayon qui transforme une unité), **Devastator** (géant formé de 6 Constructicons, se reforme une fois), **Blitzwing** (alterne glace et feu).
- Boss final : **Megatron**.
- Boss cosmique des modes infinis : **Unicron**, à la vague 150.
- Sbires : drones Vehicons, Insecticons, Constructicons, Seekers, Sweeps.

**Maps** : Cybertron, la base Autobot, l'autoroute, Mission City, l'Arche, la Lune de Cybertron.
**Arènes** : le ciel (Starscream), la station radar (Soundwave), le labo de Kaon (Shockwave), la carrière (Devastator), la toundra (Blitzwing), le Némésis (Megatron), l'espace d'Unicron.
**Campagne** : chapitres 10 à 12 (+30 niveaux Solo et +30 Coop), Megatron au chapitre 12, niveau 10.
**Équipes** : Autobots, Dinobots, Aériens ; inter-univers « Les Machines » (Iron Man, Cyborg, Optimus Prime).

## Puis : extension PIXAR (publication le 01/11)

Liste définitive, établie par le chef de projet à la demande du joueur.

**Décision sur les personnages Pixar déjà dans le pack Disney** (Nemo & Dory, Coco, Buzz & Woody, Rebelle) : **ils restent dans le pack Disney**. Rien ne change pour les profils existants. Le pack Pixar n'apporte que des personnages nouveaux.

**Pack Pixar : 15 unités** (beaucoup de duos, comme le pack Disney)

| id | Unité | Rareté | Compétence (idée) |
|---|---|---|---|
| mrincredible | M. Indestructible | Légendaire | Coup de poing qui étourdit toute une ligne |
| elastigirl | Elastigirl | Épique | Bras élastiques : frappe les ennemis de tête de loin |
| frozone | Frozone | Épique | Pont de glace : gèle le chemin, ralentit |
| violetflash | Violette & Flèche | Rare | Champ de force (Violette) et frappes ultra-rapides (Flèche) |
| sullimike | Sulli & Bob | Épique | Rugissement qui fait reculer, Bob compte les points |
| mcqueen | Flash McQueen & Martin | Rare | Turbo : vitesse d'attaque, Martin remorque un ennemi en arrière |
| carlrussell | Carl & Russell | Rare | Ballons : soulèvent un ennemi hors du chemin pendant 2 s |
| joysadness | Joie & Tristesse | Épique | Souvenirs : bonus ou malus aléatoires |
| remy | Rémy & Linguini | Rare | Recette : mana bonus à chaque vague |
| walleeve | WALL-E & EVE | Légendaire | Compacteur et rayon d'EVE |
| lucaalberto | Luca & Alberto | Rare | Vague de mer, transformation en monstre marin |
| mei | Mei (panda roux) | Épique | Panda géant : écrase les ennemis |
| jessie | Jessie & Pile-Poil | Rare | Lasso et galop : tire les ennemis en arrière |
| ianbarley | Ian & Barley | Épique | Sorts aléatoires du bâton magique |
| joe | Joe & 22 | Légendaire | Musique de l'âme : galvanise tout le plateau |

**Méchants**
- 5 gros boss : **Syndrome** (Omnidroïde), **Randall** (camouflage), **Lotso** (benne, tri des jouets), **Hopper** (nuée de sauterelles), **Charles Muntz** (dirigeable, chiens).
- Boss final : **l'Empereur Zurg**.
- Sbires : robots de Syndrome, monstres de Monstropolis, jouets de Sunnyside, sauterelles, chiens de Muntz, robots de Zurg.

**Maps** : Metroville, Monstropolis, Radiator Springs, Paradise Falls, le quartier général des émotions, l'Axiom, Portorosso.
**Arènes** : l'île de Nomanisan (Syndrome), l'usine de portes (Randall), Sunnyside (Lotso), l'île aux fourmis (Hopper), le dirigeable (Muntz), la planète Z (Zurg).
**Campagne** : chapitres 13 à 15 (+30 niveaux Solo et +30 Coop), Zurg au chapitre 15, niveau 10.
**Équipes** : Les Indestructibles, Monstres & Cie, Émotions ; inter-univers « Toy Story » (Buzz & Woody + Jessie & Pile-Poil).

## Exigence dès la version 1 : un jeu extensible

Pour que les extensions DC, Transformers et Pixar (et d'autres) s'ajoutent **sans réécrire le jeu**, tout le contenu reste **piloté par les données** :
- les packs, les univers, les unités, les boss, les lieutenants, les sbires, les maps, les chapitres de campagne, les paliers d'infini et les équipes sont **des listes dans `src/data/` et `src/maps/`**, jamais codés en dur dans les écrans ou le moteur ;
- l'interface affiche **autant de packs, de chapitres et d'univers qu'il y en a** dans les données (pas de mise en page figée sur 2 packs ou 6 chapitres) ;
- les sauvegardes de profil ont un **numéro de version** et une migration, pour que l'arrivée de nouveaux personnages ne casse pas les profils existants.
