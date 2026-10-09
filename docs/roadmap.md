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

## Exigence dès la version 1 : un jeu extensible

Pour que l'extension DC (ou une autre) s'ajoute **sans réécrire le jeu**, tout le contenu reste **piloté par les données** :
- les packs, les univers, les unités, les boss, les lieutenants, les sbires, les maps, les chapitres de campagne, les paliers d'infini et les équipes sont **des listes dans `src/data/` et `src/maps/`**, jamais codés en dur dans les écrans ou le moteur ;
- l'interface affiche **autant de packs, de chapitres et d'univers qu'il y en a** dans les données (pas de mise en page figée sur 2 packs ou 6 chapitres) ;
- les sauvegardes de profil ont un **numéro de version** et une migration, pour que l'arrivée de nouveaux personnages ne casse pas les profils existants.
