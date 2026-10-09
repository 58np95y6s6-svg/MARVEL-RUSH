// Notes de version affichées dans « Quoi de neuf » après une mise à jour.
// Ajouter une entrée EN TÊTE de liste à chaque mise à jour qui change quelque chose pour les joueurs.
// L'id doit être unique et croissant (date, puis lettre si plusieurs le même jour).

export interface ReleaseNote {
  id: string;          // ex. '2026-10-09a'
  title: string;       // ex. 'Installation sur l’écran d’accueil'
  date: string;        // affichée telle quelle
  items: string[];     // une phrase courte par nouveauté
}

export const CHANGELOG: ReleaseNote[] = [
  {
    id: '2026-10-18a',
    title: 'Extension DC Comics',
    date: '18 octobre 2026',
    items: [
      'Nouveau Pack DC, aux mêmes prix, taux et garantie que les packs Marvel et Disney.',
      '15 héros DC : Batman, Superman, Wonder Woman, Green Lantern, Flash, Aquaman, Cyborg, Supergirl, Shazam, Martian Manhunter, Robin, Batgirl, Catwoman, Harley Quinn et Green Arrow, chacun avec sa compétence, ses talents et ses 5 passifs d’éveil.',
      'Les stratégies arrivent chez DC : Harley Quinn se sacrifie pour du mana, Martian Manhunter copie un allié, Robin fait monter un allié d’un niveau, Supergirl grandit sans limite, Catwoman rapporte du mana sur chaque ennemi touché, Cyborg accélère ses voisins, Flash échange sa place et les Green Lantern alignés se renforcent.',
      'Chaque héros DC a sa portée (toute la map, longue, moyenne ou courte), sa couleur de jeton et ses effets d’attaque : batarangs, vision thermique, lasso de vérité, constructions de l’anneau, éclairs de Flash, kraken, foudre de Shazam, maillet de Harley…',
      'Nouvelles équipes : Justice League, Trinité, Bat-famille, Lanternes et cosmiques, Sirènes de Gotham, et deux équipes entre univers, Les Riches (Iron Man et Batman) et Les Archers (Œil de faucon, Green Arrow et Rebelle).',
      'Cinq nouveaux méchants : le Joker, Lex Luthor, Bane, Sinestro et Black Adam, avec leurs lieutenants et leurs sbires (clowns, robots LexCorp, mercenaires, Corps Sinestro, soldats de Kahndaq).',
      'Darkseid, boss final de l’extension : Rayons Oméga, Boom Tube et Équation d’Anti-Vie.',
      'Nouvelles maps : Gotham City la nuit, la Batcave, Metropolis, Themyscira, Atlantis et Oa, et six arènes de boss dont Apokolips.',
      '30 nouveaux niveaux : chapitres 7 (Gotham), 8 (Metropolis et Themyscira) et 9 (Apokolips), en Solo et en Coop, ouverts après Thanos.',
      'Modes infinis prolongés : les boss DC rejoignent la rotation, Darkseid arrive à la vague 100, et deux coffres « Cosmique » attendent aux vagues 75 et 100.',
      'Nouvelle option de rotation des boss en mode infini : tous les univers, Marvel et Disney, ou DC seul.',
    ],
  },
  {
    id: '2026-10-10g',
    title: 'Campagne, tirages et collection',
    date: '10 octobre 2026',
    items: [
      'Crée ton profil (pseudo, avatar) et choisis ton équipe de départ Marvel ou Disney, avec 10 tirages offerts.',
      'Tirages : nouveau Pack Complet et packs par univers, contenu et probabilités affichés, garantie Légendaire, ouverture animée des cartes.',
      'Collection et decks : cartes de héros façon Rush Royale, amélioration, éveils, talents, 3 decks et bonus d’équipe.',
      'Campagne : 6 chapitres de 10 niveaux, lieutenant au niveau 5, boss du chapitre au niveau 10, Thanos à la fin.',
      'Jusqu’à 3 étoiles par niveau, coffres d’étoiles, parchemins, cristaux et un personnage offert à chaque chapitre terminé.',
      'Solo Infini (débloqué après le chapitre 1) : éclats par vague, coffres de palier, record, et un coffre quotidien sur l’accueil.',
    ],
  },
  {
    id: '2026-10-10f',
    title: 'Compte à rebours',
    date: '10 octobre 2026',
    items: [
      'Chaque partie commence par un compte à rebours 3, 2, 1, GO ! : place déjà tes héros avant l’arrivée des ennemis.',
      'Pocahontas a de nouveaux cheveux au vent, en mèches souples.',
    ],
  },
  {
    id: '2026-10-10e',
    title: 'Nouvelles stratégies et équilibrage',
    date: '10 octobre 2026',
    items: [
      'Black Widow se sacrifie (mana selon son rang quand elle fusionne ou tombe) ; Tiana rapporte du mana sur chaque ennemi qu’elle a touché.',
      'Glisse Loki sur un allié de même rang : il devient sa copie (−25 % de dégâts). Trois Loki alignés se renforcent et frappent en zone.',
      'Glisse Coco sur un allié de même rang : il gagne un rang. Glisse Vanellope : elle échange sa place et booste ses nouveaux voisins.',
      'Venom grandit sans limite (de plus en plus lentement) et garde la moitié de sa force en fusion.',
      'Nouveau bouton « Mana + » : jusqu’à +100 % de mana par élimination et par vague.',
      'Améliorer un héros donne maintenant +15 % de dégâts et +6 % de cadence par niveau, affichés sur sa carte.',
      'Battre un lieutenant ou un boss rapporte une grosse réserve de mana.',
      'Début de partie plus facile : 150 de mana au départ et premières vagues moins résistantes.',
    ],
  },
  {
    id: '2026-10-10d',
    title: 'Attaques revisitées',
    date: '10 octobre 2026',
    items: [
      'Chaque héros a maintenant son attaque bien à lui : répulseur d’Iron Man, toile de Spider-Man, rocher de Hulk, éclairs ramifiés de Thor, bouclier de Cap qui ricoche, poêle de Raiponce (BONK !)…',
      'Les compétences ont leur grand effet : Uni-Beam, Hulk Smash et ses fissures, portail de Strange, Dix Anneaux en orbite, vague de Vaïana, chant d’Ariel, menottes de Judy, lasso de Woody, glitch de Vanellope.',
      'L’état des ennemis se voit d’un coup d’œil : étoiles (étourdi), flocon (ralenti), petites flammes (brûlure), cible rouge (marqué), bouclier fêlé (armure brisée).',
      'Les coups critiques rebondissent, et les pouvoirs des boss partent du boss jusqu’aux cases touchées.',
      'Effets dessinés dans le style des planches, pensés pour rester lisibles et fluides avec 15 héros qui tirent en même temps.',
    ],
  },
  {
    id: '2026-10-10c',
    title: 'Portées d’attaque',
    date: '10 octobre 2026',
    items: [
      'Chaque héros a sa zone de touche : toute la map pour les tireurs (Iron Man, Œil de faucon, Rebelle…), longue, moyenne ou courte pour le corps à corps (Hulk, Venom, Mulan…).',
      'Garde le doigt appuyé sur un héros pour voir sa zone et la partie du chemin qu’il couvre ; ses jumeaux fusionnables s’illuminent.',
      'La place compte : un héros de courte portée doit être collé au chemin, mais il frappe beaucoup plus fort.',
      'Pendant une fusion, la zone de la case visée s’affiche ; la portée apparaît aussi dans la fiche du héros.',
      'Plus le niveau de fusion est élevé, plus le héros tire vite.',
    ],
  },
  {
    id: '2026-10-10b2',
    title: 'Nouveaux jetons',
    date: '10 octobre 2026',
    items: [
      'Plus de cadre rond : chaque héros est posé directement dans la forme de son niveau.',
      'Chaque héros a sa propre couleur de forme, pour le reconnaître d’un coup d’œil.',
      'Un fin liseré intérieur rappelle la rareté (bleu, violet, or).',
    ],
  },
  {
    id: '2026-10-10b',
    title: 'Niveaux de fusion façon Rush Royale',
    date: '10 octobre 2026',
    items: [
      'La forme du jeton donne le niveau de fusion : le nombre d’angles = le niveau.',
      'Rond, amande, triangle, losange, pentagone, hexagone, heptagone (niveau 7).',
      'À chaque fusion, la forme gagne ses angles un à un.',
    ],
  },
  {
    id: '2026-10-10a',
    title: 'Premier combat jouable',
    date: '10 octobre 2026',
    items: [
      'Solo Infini sur les Toits de New York avec le deck Marvel de départ.',
      'Invoque, fais glisser une unité sur sa jumelle pour la fusionner, améliore ton deck en partie.',
      'Lieutenant toutes les 5 vagues, gros boss toutes les 10, avec annonce, barre de vie et arène.',
      'Touche une unité pour lire sa compétence ; le jeu ralentit le temps de la lire.',
    ],
  },
  {
    id: '2026-10-09b',
    title: 'Installation simplifiée',
    date: '9 octobre 2026',
    items: [
      'Une page explique comment installer l’app sur l’écran d’accueil.',
      'L’app installée demande le code d’accès une seule fois.',
      'Nouvelle icône « Marvel Rush » sur l’écran d’accueil.',
      'Une fenêtre prévient quand une nouvelle version est disponible.',
    ],
  },
];

export const LATEST = CHANGELOG[0]!;
