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

## Mise à jour suivante : extension TRANSFORMERS

Idée du joueur, à détailler plus tard.
- **Pack Transformers** : les Autobots en héros. Par exemple Optimus Prime, Bumblebee, Ironhide, Ratchet, Jazz, Arcee, Grimlock, Wheeljack, Hot Rod, Elita-1.
- **Mécanique propre à cet univers : la transformation.** Chaque Autobot alterne entre un **mode robot** (attaque forte, lente) et un **mode véhicule** (rapide, attaque les ennemis les plus avancés). Elle se déclenche automatiquement, ou d'un appui sur l'unité, avec une animation de transformation.
- **Méchants Decepticons** : Starscream, Soundwave, Shockwave, Devastator (boss géant formé de plusieurs Decepticons), **Megatron** en boss final, et **Unicron** comme boss cosmique des modes infinis.
- **Maps** : Cybertron, une base Autobot, une autoroute, Kalis et l'Arche ; Unicron comme arène.
- **+30 niveaux** de campagne (3 chapitres, Solo et Coop), boss infinis prolongés.
- **Style** : rester dans le chibi des planches, avec des robots aux formes arrondies, des contours épais et des visières lumineuses.

## Puis : extension PIXAR

Idée du joueur, à détailler plus tard.
- **Pack Pixar** : de nouveaux personnages, par exemple :
  - les Indestructibles (M. Indestructible, Elastigirl, Violette, Flèche, Jack-Jack) ;
  - Monstres & Cie (Sulli et Bob) ;
  - Cars (Flash McQueen et Martin) ;
  - Là-haut (Carl et Russell) ;
  - Vice-Versa (Joie et Colère) ;
  - Ratatouille (Rémy) ;
  - WALL-E et EVE ;
  - Luca ;
  - Alerte Rouge (Mei en panda roux).
- **Personnages Pixar déjà dans le pack Disney** : Nemo & Dory, Coco, Buzz & Woody, Rebelle. **À décider avec le joueur** au moment de l'extension : soit ils restent dans le pack Disney (rien ne change pour les profils existants), soit ils passent dans le pack Pixar (les profils les gardent, seul le pack d'origine change).
- **Méchants Pixar** : Syndrome, Randall, Lotso, Chick Hicks, Charles Muntz, AUTO (le robot de WALL-E), et un boss final à choisir.
- **Maps** : Monstropolis, Radiator Springs, Paradise Falls, le quartier général des émotions, l'Axiom, Portorosso.
- **+30 niveaux** de campagne, boss infinis prolongés.

## Exigence dès la version 1 : un jeu extensible

Pour que les extensions DC, Transformers et Pixar (et d'autres) s'ajoute **sans réécrire le jeu**, tout le contenu reste **piloté par les données** :
- les packs, les univers, les unités, les boss, les lieutenants, les sbires, les maps, les chapitres de campagne, les paliers d'infini et les équipes sont **des listes dans `src/data/` et `src/maps/`**, jamais codés en dur dans les écrans ou le moteur ;
- l'interface affiche **autant de packs, de chapitres et d'univers qu'il y en a** dans les données (pas de mise en page figée sur 2 packs ou 6 chapitres) ;
- les sauvegardes de profil ont un **numéro de version** et une migration, pour que l'arrivée de nouveaux personnages ne casse pas les profils existants.
