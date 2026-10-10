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
    id: '2026-10-25a',
    title: 'Extension Transformers',
    date: '25 octobre 2026',
    items: [
      'Nouveau Pack Transformers, aux mêmes prix, taux et garantie que les autres packs, avec 15 Autobots : Optimus Prime, Bumblebee, Ironhide, Ratchet, Jazz, Arcee, Grimlock, Wheeljack, Hot Rod, Elita-1, Bulkhead, Sideswipe, Prowl, Mirage et Ultra Magnus.',
      'Autobots, transformation ! Chaque Autobot passe toutes les 8 s du mode robot (frappe lente et forte sur l’ennemi le plus résistant) au mode véhicule (rapide, sur l’ennemi le plus avancé). Touche-le pour le transformer tout de suite.',
      'Copie Rush Royale ici aussi : Optimus la Banshee, Bumblebee le Mage de foudre, Grimlock le Chaperon rouge… et toutes les stratégies : Bulkhead se sacrifie pour du mana, Mirage copie, Wheeljack fait monter un allié, Grimlock grandit, Jazz rapporte du mana, Ratchet accélère, Bumblebee échange sa place, les Ultra Magnus alignés frappent plus fort.',
      'Les Decepticons attaquent : Starscream, Soundwave, Shockwave, Devastator (qui se reforme une fois) et Blitzwing, puis Megatron, boss final de l’extension ; nouvelles équipes Autobots, Dinobots, Aériens et Les Machines (Iron Man, Optimus et, avec l’extension DC, Cyborg).',
      '30 nouveaux niveaux longs, chapitres 10 à 12 (Cybertron, la Terre, le Némésis), de 100 à 150 vagues, avec Megatron à la vague 150 ; nouvelles maps Cybertron, base Autobot et Mission City, et 7 arènes.',
      'Modes infinis : Unicron, le dévoreur de mondes, arrive à la vague 150, avec un nouveau palier légendaire.',
    ],
  },
  {
    id: '2026-10-18a',
    title: 'Extension DC Comics',
    date: '18 octobre 2026',
    items: [
      'Nouveau Pack DC, aux mêmes prix, taux et garantie que les packs Marvel et Disney.',
      '15 héros DC : Batman, Superman, Wonder Woman, Green Lantern, Flash, Aquaman, Cyborg, Supergirl, Shazam, Martian Manhunter, Robin, Batgirl, Catwoman, Harley Quinn et Green Arrow, chacun avec sa compétence, ses talents et ses 5 passifs d’éveil.',
      'Copie Rush Royale chez DC aussi : chaque héros reprend le profil d’une unité de Rush Royale encore libre. Batman le Bourreau, Superman le Givre, Wonder Woman le Moine, Green Lantern le Cultiste, Flash le Cogneur, Aquaman la Faucheuse, Cyborg le Génie, Supergirl le Barde, Shazam le Météore…',
      'Les stratégies restent : Harley Quinn (le Clown) se sacrifie pour du mana, Martian Manhunter (le Mime) copie un allié, Robin (le Ferrailleur) fait monter un allié d’un rang, parfois de deux, Supergirl grandit sans limite, Catwoman (la Démonologue) rapporte du mana sur chaque ennemi touché, Cyborg accélère ses voisins, Flash échange sa place et les Green Lantern reliés tirent sur plus d’ennemis.',
      'Chaque héros DC a une portée qui lui ressemble (toute la map, longue, moyenne ou courte) : la foudre de Shazam tombe de loin, les batarangs de Batgirl volent loin ; Flash, Robin, Catwoman et Harley frappent au contact.',
      'Nouvelles équipes : Justice League, Trinité, Bat-famille, Lanternes et cosmiques, Sirènes de Gotham, et deux équipes entre univers, Les Riches (Iron Man et Batman) et Les Archers (Œil de faucon, Green Arrow et Rebelle).',
      'Cinq nouveaux méchants : le Joker, Lex Luthor, Bane, Sinestro et Black Adam, avec leurs lieutenants et leurs sbires (clowns, robots LexCorp, mercenaires, Corps Sinestro, soldats de Kahndaq).',
      'Darkseid, boss final de l’extension : Rayons Oméga, Boom Tube et Équation d’Anti-Vie.',
      'Nouvelles maps : Gotham City la nuit, la Batcave, Metropolis, Themyscira, Atlantis et Oa, et six arènes de boss dont Apokolips.',
      '30 nouveaux niveaux, des parties longues comme le reste de la campagne : chapitre 7 (Gotham) de 50 à 60 vagues, chapitre 8 (Metropolis et Themyscira) de 60 à 75, chapitre 9 (Apokolips) de 75 à 100, avec Darkseid à la vague 100. Ouverts après Thanos, en Solo et en Coop.',
      'Modes infinis prolongés : les boss DC rejoignent la rotation, Darkseid arrive à la vague 100, et deux nouveaux paliers attendent aux vagues 75 et 100 (coffres légendaires, parchemins et un Légendaire garanti).',
      'Nouvelle option de rotation des boss en mode infini : tous les univers, Marvel et Disney, ou DC seul.',
    ],
  },
  {
    id: '2026-10-10s',
    title: 'Portées revues',
    date: '10 octobre 2026',
    items: [
      'Shang-Chi lance maintenant ses Dix Anneaux au loin (portée longue), comme les lames du Danse-lames : moins de dégâts par coup, mais il touche bien plus souvent.',
      'Portées revues selon chaque héros : la fusée de Mushu porte loin (Mulan & Mushu : longue) et le Soldat de l’hiver tire en sniper sur toute la map.',
      'Les dégâts de ces trois héros sont ajustés à leur nouvelle portée pour garder l’équilibre.',
    ],
  },
  {
    id: '2026-10-10r2',
    title: 'Coco booste Coco',
    date: '10 octobre 2026',
    items: [
      'Glisse un Coco sur un autre Coco du même rang : il disparaît et l’autre Coco monte d’un rang (il reste Coco), au lieu d’une fusion au hasard.',
    ],
  },
  {
    id: '2026-10-10r',
    title: 'Jouer à deux',
    date: '10 octobre 2026',
    items: [
      'Nouveau : « Jouer à deux » ! Vois si ton ou ta partenaire est en ligne et invite-le d’un geste en Coop Infini ou en Coop Niveaux.',
      'Combat à deux : vos deux plateaux, chemins qui se rejoignent, 3 vies partagées, bouton « Offrir » une fois par vague et 6 emotes.',
      'Coop Infini : des coffres pour chacun selon le palier atteint (bois, argent, or + Épique, héroïque, légendaire + Légendaire), or et gemmes à chaque vague, record du duo.',
      'Coop Niveaux : 60 niveaux à deux avec des étoiles communes ; chaque chapitre s’ouvre quand vous avez fini tous les deux le chapitre Solo.',
    ],
  },
  {
    id: '2026-10-10q',
    title: 'Équilibrage façon Rush Royale',
    date: '10 octobre 2026',
    items: [
      'Équilibrage copié sur Rush Royale : vagues de monstres communs, et toutes les 5 vagues un lieutenant (PV ×5, plus rapide) escorté de monstres rapides.',
      'Un lieutenant ou un boss qui passe la porte retire 2 vies (au lieu de toutes) ; en Coop, la porte n’a plus qu’une vie, comme dans Rush Royale.',
      'Départ à 100 de mana, 5 % de coups critiques pour tous les héros, et les Légendaires gagnent bien plus de dégâts par niveau (tableaux de Rush Royale : Thor +129, Iron Man +107 par niveau…).',
    ],
  },
  {
    id: '2026-10-10p',
    title: 'Couleurs de Loki et Coco',
    date: '10 octobre 2026',
    items: [
      'Loki a maintenant une forme blanche et Coco une forme vert clair, pour les repérer d’un coup d’œil sur le plateau.',
    ],
  },
  {
    id: '2026-10-10o',
    title: 'Nouveau style façon Rush Royale',
    date: '10 octobre 2026',
    items: [
      'Toute l’app adopte le style de la nouvelle fiche de héros façon Rush Royale : cadres bleu ardoise, contenus clairs, tuiles, gros boutons orange et bleus, croix rouge ronde.',
      'Nouvelle barre de monnaies en haut (gemmes, or, cristaux, parchemins) : chaque ➕ explique comment en gagner et mène au bon écran.',
      'Nouvelle barre d’onglets en bas, à grandes icônes, avec l’onglet actif surélevé ; tous les écrans sont harmonisés.',
    ],
  },
  {
    id: '2026-10-10n',
    title: 'Thor s’illumine',
    date: '10 octobre 2026',
    items: [
      'Thor s’illumine : en mode actif (1, 3, 5 ou 7 Thor), sa silhouette se nimbe d’une lueur jaune pulsante avec petits éclairs ; en Chevalier de lumière, lueur bleue, en Chevalier des ténèbres, lueur rouge cramoisi et fumée sombre, plus intenses quand le mode actif s’ajoute.',
    ],
  },
  {
    id: '2026-10-10m',
    title: 'Coffre de la semaine',
    date: '10 octobre 2026',
    items: [
      'Le coffre de la semaine (12 quêtes) contient maintenant un lot de 10 tirages offert : avec tes gemmes, ça fait au moins 2 lots de 10 par semaine, même après les premières semaines.',
    ],
  },
  {
    id: '2026-10-10l',
    title: 'Thor Inquisiteur et nouvelle fiche',
    date: '10 octobre 2026',
    items: [
      'Thor devient l’Inquisiteur de Rush Royale : Mjolnir frappe une zone, chaque coup sur la même cible fait monter les dégâts (+15 %, jusqu’à 600 %), et 1, 3, 5 ou 7 Thor passent en mode actif (0,6 s, zone à 100 %).',
      'Nouvel arbre de talents de Thor (Chevalier de lumière ou des ténèbres, Purification, Bouclier de foi, Ronin, Unité) et talent ultime « Marteau de foi » au niveau 10 ; Venom (Zélote) se nourrit de ton mana en réserve.',
      'Nouvelle fiche de héros façon Rush Royale, la même partout (Collection, Decks, Encyclopédie) : onglets Principal, Stats, Talents en arbre, Éveil et Info, avec flèches pour passer d’un héros à l’autre.',
    ],
  },
  {
    id: '2026-10-10k',
    title: 'Pluie de gemmes',
    date: '10 octobre 2026',
    items: [
      '💎 Pluie de gemmes pour bien démarrer : chaque première victoire des chapitres 1 à 3 rapporte 400 / 300 / 150 gemmes, la Route des récompenses est très généreuse jusqu’au niveau 15 (3 lots de 10 offerts) et un calendrier de bienvenue de 7 jours offre 3 300 gemmes et 3 lots de 10. Tu reçois aussi les gemmes des niveaux déjà gagnés !',
      '🎉 Le lot de 10 devient excitant : 10 % de Légendaire par carte (60 % Rare, 30 % Épique), Légendaire garanti au 30e tirage au lieu du 40e, et ton premier lot de 10 de chaque pack contient un Légendaire.',
      '❓ Nouveau « Comment gagner des gemmes ? » sur l’écran Tirages : toutes les sources avec leurs montants et ce qu’il te reste à prendre. Les taux ×1 et ×10 sont affichés sur chaque pack.',
    ],
  },
  {
    id: '2026-10-10j',
    title: 'Copie Rush Royale, or et gemmes, coffres',
    date: '10 octobre 2026',
    items: [
      'Les 28 héros reprennent le profil d’une unité de Rush Royale : Thor l’éclair du Thunderer (et le Marteau de la foi en talent), Hulk le Minotaure, Iron Man la Tesla, Venom l’Inquisitrice, Loki l’Arlequin…',
      'Règle de fusion de Rush Royale : chaque rang fait attaquer plus souvent ; Captain America, Pocahontas et Raiponce deviennent des soutiens qui n’attaquent pas.',
      'Vagues comme en Coop de Rush Royale : 10 monstres par vague, de plus en plus solides, vague suivante une fois le terrain nettoyé, gros monstres à 5 fois les PV qui coûtent 2 vies.',
      'Deux monnaies : l’or fait monter tes héros de niveau, les gemmes ouvrent les packs. Tes éclats deviennent des gemmes, et tu reçois de l’or selon ta progression.',
      'Des coffres partout (bois, argent, or, héroïque, légendaire) : à chaque victoire de campagne, aux paliers du Solo Infini et chaque jour. Ils éclatent et le butin s’envole dans tes compteurs.',
      'Nouvelles quêtes du jour (avec un coffre de la semaine) et Route des récompenses : chaque niveau de compte rapporte quelque chose. Les boss vaincus lâchent de l’or.',
    ],
  },
  {
    id: '2026-10-10i',
    title: 'Campagne longue et tutoriel',
    date: '10 octobre 2026',
    items: [
      'Campagne : des parties enfin longues, de 10 à 15 vagues au chapitre 1 jusqu’à 50 au chapitre 6, avec un lieutenant toutes les 5 vagues, un gros boss toutes les 10, et Thanos à la vague 50.',
      'La difficulté monte au fil des 60 niveaux : plus de sbires et plus de points de vie (boss compris). Les sbires des premières vagues ne tombent plus en un coup.',
      'Partie sauvegardée à chaque vague (campagne et Solo Infini) : « Reprendre la partie » depuis l’accueil ou la campagne.',
      'Nouveau tutoriel guidé avec Spider-Man ou Vaïana : un premier combat sans risque pour apprendre à invoquer, fusionner, améliorer et battre un boss, puis ton premier pack et ton deck.',
      'Des astuces apparaissent une seule fois au bon moment (ciblage, talents, bonus d’équipe, pouvoirs des boss, héros spéciaux, vitesse ×2). Le tutoriel se revoit depuis ton profil.',
    ],
  },
  {
    id: '2026-10-10h',
    title: 'Ouverture de packs',
    date: '10 octobre 2026',
    items: [
      'Ouverture de pack façon booster : déchire le sachet du doigt, la lumière qui s’en échappe annonce ta meilleure carte (et ça tremble fort pour un Légendaire !).',
      'Révélation des cartes : retourne-les une à une ou d’un coup, les Épiques et Légendaires arrivent en grand (ralenti doré pour un Légendaire), avec « NOUVEAU ! » ou la barre de cartes qui se remplit.',
      'Nouveau récapitulatif du lot avec les nouveaux héros en tête, et un bouton « Encore ! » pour enchaîner un tirage.',
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
      'Nouveau bouton ×2 en haut de l’écran de combat (campagne et Solo Infini) : la partie va deux fois plus vite, ton choix est mémorisé.',
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
