# Rush Royale — données relevées (unités et monstres)

> Rédigé par l'agent **Moteur / équilibrage** (octobre 2026) pour la demande « copie complète Rush Royale » :
> profils des unités Rush Royale recopiés sur les héros Marvel Rush (voir `docs/rush-royale-mapping.md`)
> et modèle de PV des monstres.
>
> **Accès aux sources.** Depuis l'environnement de travail, les pages web ne s'ouvrent pas directement
> (wiki Fandom, Reddit, BlueStacks, Game8 : bloqués par le réseau). Tout ce qui suit vient du **moteur de
> recherche web**, qui renvoie des extraits des pages citées. Les tableaux du wiki arrivent parfois
> tronqués ou avec des en-têtes mélangés : chaque chiffre porte un **niveau de confiance**.
>
> - **A** : chiffre lu tel quel dans un extrait du wiki Fandom ou d'une note de mise à jour officielle.
> - **B** : chiffre lu dans un guide tiers (alucare.fr, thegameguides.com…) ou dans un tableau du wiki aux en-têtes douteux.
> - **C** : approximation de l'agent (interpolation, valeur non publiée), signalée comme telle.
>
> Rush Royale change ses chiffres à chaque saison ; les extraits datent de 2021 à 2026.

## Sources

| Source | Contenu utilisé | Âge des extraits |
|---|---|---|
| [Wiki Fandom Rush Royale](https://rushroyale.fandom.com/wiki/Units) : pages *Units, Co-op, Monsters, Bosses, PvP, Patchnotes, Critical Damage* et une page par unité | Mécaniques, tableaux par niveau, règle du rang de fusion, monstres, Coop | 2 mois à 4 ans selon la page |
| Notes de mise à jour officielles ([13.0](https://rr.my.games/en/news/1/welcome-to-update-130), [17.0](https://rushroyale.my.games/en/news/12/welcome-to-update-170), 24.1, 26.0) | Minotaure (13.0), PV des boss (17.0), talents | officielles |
| [alucare.fr](https://www.alucare.fr/en/minotaur/) (guides par unité, en anglais et en français) | Talents chiffrés, détails de mécanique | ~2 ans |
| [thegameguides.com](https://thegameguides.com/rush-royale/bosses/) | Formule des PV de boss (PvP) | ~4 ans |
| [Level Winner](https://www.levelwinner.com/rush-royale-beginners-guide-tips-tricks-strategies-to-dominate-your-opponents/), Notes Read | Mana de départ, coûts d'amélioration, 3 vies en PvP | ~5 ans |
| **Textes du jeu** (fichier de localisation anglais extrait du client, publié dans le dépôt public [Hona/rushroyale.xyz](https://github.com/Hona/rushroyale.xyz), `wwwroot/data-mine/localizations.json`) | Règles de la Coop, composition des vagues, dégâts à la porte, mini-boss, effet du rang, boss | textes officiels du jeu (version ~2022) |
| [alucare.fr : coût des améliorations](https://www.alucare.fr/en/cost-of-improvements-to-rush-royale-cards/) | Bonus de dégâts critiques par niveau de carte | ~2 ans |
| Notes de mise à jour 8.0, 24.0, 26.1, 35.1 (extraits) | Critique fixe des modes à règles égales, vitesse et PV des monstres en PvP | officielles |
| [lucasrendon.github.io/rush](https://lucasrendon.github.io/rush/bosses.html) | Ordre des boss et mini-boss après la vague 60 | ~3 ans |

**Deuxième passe (octobre 2026, demande « on copie l'équilibrage de Rush Royale »)** : les textes du jeu
(localisation extraite du client) ont fourni des règles de **confiance A** qui manquaient (composition des
vagues de Coop, vie unique de la porte en Coop, dégâts à la porte, mana des mini-boss). Les chiffres absolus
(vitesses, PV, longueur du chemin) n'apparaissent dans aucune source accessible : voir la fin du §2.

**Introuvable malgré les recherches** : une unité « Paladin » (aucune dans la liste du wiki, ni en
anglais ni en français, ni dans les notes de mise à jour) ; les **PV absolus** des monstres par vague en Coop
(aucune page ne publie de tableau ni de formule chiffrée) ; les tableaux complets de dégâts de plusieurs
unités (Rogue, Twins, Bard, Knight Statue : seules les mécaniques sont publiées).

---

## 1. Règles de combat communes

| Règle | Rush Royale | Conf. |
|---|---|---|
| **Effet du rang de fusion** | Pour une unité de dégâts, « le rang ne fait qu'augmenter la vitesse d'attaque : intervalle ÷ rang » (un rang 3 tire 3 fois plus vite qu'un rang 1). Les dégâts par coup ne dépendent pas du rang. Phrase répétée sur les pages Archer, Thunderer, Executioner, Engineer, Reaper, Sharpshooter, Wind Archer, Pyrotechnic. | A |
| Unités de soutien | Le rang augmente l'effet (Banner, Chemist, Knight Statue : « valeur de base × (rang − 1) ») et la cadence. | A |
| Effet du rang (texte du jeu) | « Au rang 2, les unités sont deux fois plus fortes ; au rang 3, trois fois… » ; « après une fusion, la vitesse d'attaque des unités qui attaquent augmente en proportion du rang ; pour les soutiens, la puissance du bonus ». | A |
| Critique | **5 % de chance par défaut** (wiki *Critical Damage*). Les **dégâts critiques** sont une stat de compte qui monte à chaque niveau de n'importe quelle carte : +1 à +4 % par niveau d'une Commune (+45 % au total au niveau 15), +59 % au total pour une Rare (alucare) ; les modes à règles égales fixent 500 % (normal) et 1 000 % (Ligues) (8.0). Valeur de départ d'un compte : non publiée. | A (chance) / B (dégâts) |
| Mana de départ | 100 (guides ; une bénédiction de faction « Mana de départ » existe dans les textes du jeu). | B |
| Coût d'invocation | Augmente à chaque invocation (10, 20, 30…). | B |
| Améliorations en partie | 4 au plus, coûts 100 / 200 / 400 / 800 (doublement). Effet par unité (Archer : dégâts et cadence +10 % → 38 %) : pas de règle commune publiée. | B (guides anciens) |
| Vies | **PvP : 3** par joueur (guide). **Coop : la porte commune n'a qu'une vie** : « laisser passer un monstre met fin à la partie » (texte du jeu). | B / A |
| Dégâts à la porte | « Un monstre ordinaire inflige 1 dégât à la porte, les **mini-boss et les boss 2** » (texte du jeu, tutoriel). | A |
| Niveau de carte | Pas de règle commune : chaque unité a son tableau (dégâts par niveau). Relevés utilisés (dégâts du niv. 7 → pas par niveau) : Tesla 260 → +107,25 (1 118 au niv. 15) ; Inquisiteur 189 → +129 (fiche) ; Danse-lames 215 → +98,25 ; Pyrotechnicien 229 → +61,7 ; Gardien du portail 45 → +32,2 ; Prêtresse 43 → +16,6 ; Archer du vent 59 → +12,2 ; Mage de feu 55 → +6,2 ; Archer 59 → +5. Les Légendaires gagnent 40 à 70 % de leurs dégâts du niv. 7 par niveau, les Communes 8 à 11 %. | A (tableaux du wiki, deux points chacun) |
| Talents | Après l'Ascension : 3 paires de talents aux niveaux 9, 11 et 13, un talent final au niveau 15 ; modifiables hors combat. | A |
| Niveaux de carte | Commune dès le niveau 1, rare 3, épique 5, légendaire 7 ; maximum 15. | A |

---

## 2. Monstres (Coop et PvP)

### 2.1 Types de monstres (page *Monsters*)

| Type | PV | Vitesse | Mana | Dégâts à la porte | Conf. |
|---|---|---|---|---|---|
| Normal | ×1 | ×1 | ×1 | 1 | A |
| Rapide | **×0,5** | **×2** | ×1 | 1 | A |
| Gros (« mini boss » sur la page *Monsters*) | **×5** | « un peu plus lent » | **×5** | **2** | A (vitesse : C, on prend ×0,8) |
| Mini-boss de Coop (Bannerlord, Vortex) | ×5 (même page ; pas de chiffre propre à la Coop) | « un peu plus lent » ; Vortex : aura +10 % de vitesse | « plus de mana » (texte du jeu) ; ×5 | **2** | B (PV, vitesse, mana) / A (porte) |
| Limace (événement « Slug Rush ») | ×0,5 en Coop (×2 en PvP) | — | ×0,5 | — | A |

### 2.2 Coop (page *Co-op*)

| Règle | Valeur | Conf. |
|---|---|---|
| Monstres par vague | **10** jusqu'à la vague 60. | A |
| Composition (texte du jeu) | « La **5e vague de chaque dizaine** contient **un mini-boss et des monstres rapides**, la 10e un boss ; **les autres vagues ne contiennent que des monstres communs**. » Le nombre de rapides n'est pas donné : 9 + le mini-boss (10 monstres par vague). | A (9 : B) |
| Vies | La porte commune n'a **qu'une vie**. Marvel Rush garde volontairement **3 vies partagées** en Coop. | A |
| Fin de vague | La vague suivante ne commence **qu'une fois le dernier monstre éliminé**. | A |
| Croissance des PV | « Les PV augmentent **à chaque nouveau monstre** et **toutes les 10 vagues** ; le **taux de croissance augmente lui aussi** toutes les 10 vagues. » Aucun chiffre publié. | A (forme) / C (chiffres) |
| Mana par élimination | Augmente de **10 toutes les 10 vagues**, plafonné à **50** vers la vague 50. | A |
| Mini-boss | **Toutes les 5 vagues** : 1 mini-boss **et des monstres communs**. | A |
| Boss | **Toutes les 10 vagues** (Tamer 10, Gorgon 20, Bedlam 30, Warlock 40, Tribunal 50, Puppeteer 60) ; après la vague 60, boss à chaque vague paire et mini-boss à chaque vague impaire ; à partir de la vague 100, deux boss. | A |
| PV des boss | **Fixes pour une vague donnée** en Coop (le boss apparaît après le nettoyage du terrain) ; les boss tardifs dépassent 200 M de PV. | A / B |
| Mana | Une élimination donne du mana aux deux joueurs ; une seule porte (vies communes). | A |

### 2.3 PvP (pour mémoire)

- PV de boss : **n × 50 000 + PV restants des monstres** du joueur (n = numéro du boss) ; variante d'un guide :
  50 000 × vague + 12 000 × (vague − 1) + PV restants (exemple : vague 4, 89 000 PV restants → 325 000). Conf. A/B.
- Les monstres communs gagnent des PV **toutes les 10 secondes**. Conf. A.
- Mise à jour 17.0 : les PV de base des mini-boss et des boss montent « beaucoup plus vite à partir de la vague 4 ». Conf. A.
- Mode Ligues : monstres +20 % de PV et +10 % de vitesse. Conf. A.
- 24.0 : les PV montent plus nettement dès la 3e vague, et à partir de la vague 10 les monstres accélèrent de vague en vague ; 26.1 (« vague de la mort ») : après la 10e vague, PV effectifs +10 à 15 % toutes les 10 s ; 35.1 : PV un peu relevés dès la vague 5. Conf. A (sans valeurs de base).
- Le premier boss arrive après 2 minutes (guide BlueStacks). Conf. B.

### 2.4 Ce qui reste introuvable (deuxième passe, octobre 2026)

Recherché sans résultat chiffré (moteur de recherche, wiki, notes de mise à jour, textes du jeu ; les pages
Fandom, Reddit et les sites de statistiques sont bloqués par le réseau) :
- **vitesses absolues** des monstres (normal, rapide, gros, boss), **longueur du chemin** et temps de traversée ;
- **PV absolus** des monstres par vague en Coop, taux de croissance chiffrés, PV des mini-boss et des boss de Coop
  (seulement « fixes pour un étage » et « plus de 200 M » pour les boss tardifs), PV des étages de Donjon ;
- **intervalles des pouvoirs de boss** (Gorgone : 2 unités pétrifiées « périodiquement » ; une Gorgone modifiée
  d'événement : 8 s de pétrification) ;
- **rythme d'apparition** des monstres dans une vague de Coop (il n'y a pas de minuteur de vague en Coop : la vague
  suivante attend le nettoyage) ;
- mana d'élimination de la vague 1 (seulement « +10 toutes les 10 vagues, 50 au plus vers la vague 50 ») ;
- **dégâts critiques** de départ d'un compte ;
- effet chiffré commun des améliorations en partie (chaque unité a le sien).

---

## 3. Unités utilisées par Marvel Rush

Valeurs « niv. N » = niveau de **carte** Rush Royale. « Rang » = rang de fusion 1–7.

### Minotaure (légendaire, Royaume de Lumière, dégâts) → Hulk

- Ajouté en **13.0**. Toutes les quelques secondes, **Séisme** : piège qui **ralentit** les monstres dans son rayon et inflige des **dégâts périodiques**. À la **fusion**, **Éboulement** : dégâts périodiques selon les **PV déjà perdus** par les monstres ; durée **5 s → 4 s** (patch). Conf. A.
- Talents (alucare, conf. B) : **Berserker** à l'apparition ou à la fusion, 15 s, **+50 % de dégâts de Séisme** — ou 20 s, **+400 % de vitesse d'attaque** et zone = 100 % des dégâts du Séisme, mais plus de Séismes ; rang 3 : **Brèche** +5 % de dégâts de Séisme par Faille active (max 300 %) — ou **chaque attaque +10 % de dégâts** (max +400 %), remis à zéro au changement de cible ; un talent étourdit ; talent final : chance de critique selon le nombre de Minotaures. Les Ascensions augmentent les dégâts du piège.
- Dégâts et intervalle : non publiés dans les extraits (conf. C).

### Tesla (légendaire) → Iron Man

- Gagne **1 charge** quand une unité **adjacente** fusionne ou monte de rang ; charges max = **rang de fusion** (1 à 7). Chargé (charges = rang) : attaque **4 cibles de plus à 50 %** des dégâts. Conf. A.
- Dégâts : base **260 / +360 par charge** au niv. 7 → **1 118 / 1 766** au niv. 15 ; niv. 9 : 374 / 535. Intervalle **0,6 s** au rang 1 (0,09 s au rang 7 = 0,6 ÷ 7). Conf. A (tableau aux en-têtes mélangés : B pour « par charge »).
- 15.0 : dégâts légèrement réduits à tous les niveaux. Conf. A.

### Inquisiteur (légendaire, dégâts, premier) → Thor

- **Fiche de l'unité (captures fournies, conf. A)** : Offensif **834 au niv. 12, +129 par niveau** ; intervalle **1 s**, **0,6 s actif** ; dégâts augmentés **15 %** par coup consécutif, limite **600 %** ; zone = **moitié des dégâts de base** (100 % actif) ; actif quand le nombre d'Inquisiteurs vaut **1, 3, 5 ou 7** ; changer de cible (morte ou hors de portée) remet l'augmentation à zéro ; le bonus persiste au changement de mode. Faction Royaume de la lumière, type Dégâts, cible Premier.
- Talents : niv. 9 Chevalier de lumière / Chevalier des ténèbres, niv. 11 Purification / Bouclier de foi, niv. 13 Ronin / Unité, niv. 15 Marteau de foi. Détails et niveaux de confiance dans docs/rush-royale-mapping.md.
- Anciennes données (wiki, avant la refonte) : dégâts qui montent ≈ ×2 après 30 coups, ×3 après 200 ; activation à 1/4/7/10 ; dégâts niv. 7 : 145. Remplacées par la fiche.

### Zélote → Venom

- Dégâts selon le **mana en réserve** : ×2 vers 1 000, ×3 vers 60 000 (conf. B). Talents non trouvés (augmentent vitesse d'attaque et dégâts, conf. C).
- (Thunderer, épique : éclair en chaîne, +1 cible par rang ; n'est plus utilisé.)

### Arlequin (légendaire, spécial) → Loki

- Fusionné avec une unité **de même rang**, il en crée une **copie**. La copie a des **dégâts réduits : −35 % au niveau de départ, jusqu'à −5 %** au niveau max ; la pénalité ne touche pas les effets de soutien ; elle disparaît si la copie fusionne ou est déplacée par le Gardien du portail. Talents : cartes à jouer (bonus de dégâts), coup de marteau autour de la copie. Conf. A (pénalité) / B (talents).
- (Mime, épique : fusionne avec **n'importe quelle** unité de même rang, sans copie. Clown : chance de copier, sinon mana et perte de rang.)

### Dryade (légendaire, soutien, premier) → Coco

- Glissée sur **n'importe quelle unité**, elle **augmente son rang de 1** (ce n'est pas une fusion au sens des compteurs de fusion). Le rang de la Dryade n'augmente que sa cadence. Conf. A.
- (Ferrailleur, légendaire : absorbe des alliées pour gagner des charges — 3 → 4 en 12.0 — puis monte le rang d'une autre unité, 20 % de double montée au niv. 7, +2,5 %/niv.)

### Gardien du portail (épique) → Vanellope & Ralph

- **Échange sa place** avec n'importe quelle unité **de même rang**, puis reste **inactif** un moment (endormi : ni déplacement, ni fusion, ni attaque) ; retire les effets négatifs des unités échangées (alucare) et la pénalité de copie de l'Arlequin (patch). Dégâts niv. 9 : **109** → niv. 15 : 302 ; intervalle **0,62 s → 0,50 s**. Conf. A/B.
- (« Trickster » est un **héros** dans les versions récentes, pas une unité.)

### Prêtresse (rare, soutien/malus) → Black Widow

- Fusionnée **ou tuée**, elle donne du mana : **mana de base × rang** (exemple du wiki : rang 6 → 480, base 80). Dégâts niv. 8 : 60 → niv. 13 : 143. Talents (alucare) : cases spéciales qui donnent du mana quand on fusionne dessus ; chance de doubler le mana ; recevoir son mana donne **+15 % de cadence à toutes les unités pendant 6 s** et +30 % à la Prêtresse. Conf. A / B.

### Vampire (épique, soutien) → Tiana & Naveen

- Sa **morsure** marque la cible, qui donne du mana tant qu'elle vit (base 1 → 2 en 2.1) ; talents : chauves-souris 1 % des PV actuels, **+30 % de mana** pour chaque monstre mordu éliminé. Conf. A / B.
- (Démonologue, légendaire : formule de mana en PvE 10 × mana du monstre + 8 × mana × rang ; mana doublé en Coop.)

### Statue de chevalier (légendaire, soutien) → Captain America

- **Vitesse d'attaque des voisines** selon le rang (exemple : 124 % au rang 7) ; avec un **nombre pair de Statues** : en plus, **chance de critique = 5 % × rang** (35 % au rang 7). 12.0 : bonus de critique par rang réduit de moitié. Conf. A.

### Bannière (rare, soutien) → Pocahontas & Meeko

- **+vitesse d'attaque des 4 voisines orthogonales** : base **10 % au niv. 3, +0,5 %/niv.** (15 % au niv. 13) ; total = amélioration au mana + base × (rang − 1) — exemple : 21 + 15 × 6 = 111 % (niv. 13, rang 7, amélioration 5). Conf. A.

### Trappeur (légendaire, malus) → Spider-Man

- Toutes les **6 s** (7 → 6, −0,3 s par niveau), lance **2 filets** à des points aléatoires du chemin : **ralentit** les monstres et leur fait **subir plus de dégâts** ; les filets se cumulent. Dégâts du piège niv. 7 : **123** → niv. 12 : 217 ; les niveaux ajoutent **3 % de réduction d'armure**. Conf. A.

### Mage du portail (épique, malus, premier) → Doctor Strange

- Ses attaques ont une **chance de téléporter la cible au début du chemin** (5 % selon un guide) ; la chance diminue à chaque nouvelle téléportation de la même cible. Conf. A (mécanique) / B (5 %).

### Archer (commun, premier) → Œil de faucon

- Intervalle **0,45 s** ; dégâts **29 au niv. 1 → 99 au niv. 15** ; les améliorations au mana ajoutent dégâts et cadence (10 % → 38 %). Talents niv. 9 : **Flèches empoisonnées** (15 % de chance de toucher 2 cibles aléatoires) ; **Flèches explosives** (15 % : flèche de zone sur une cible aléatoire) ; Ranger +2,5 % de critique. Conf. A.

### Tireur d'élite (rare) → Falcon

- Vise la cible qui a **le plus de PV actuels** ; **Tir fou** pendant une vague de boss : dégâts et cadence augmentés. Conf. A (chiffres du Tir fou : C).

### Chasseur (commun, aléatoire) → Rebelle (Merida)

- **Premier tir sur chaque nouvelle cible : +150 % de dégâts au niv. 1 → +290 % au niv. 15** (+10 %/niv.) ; le rang augmente ce bonus (3.1.1) ; dégâts niv. 1 : 67 → 78 (12.0). Talents (alucare) : trophée de boss +4 % ; 7 % de gland ; change de cible tous les 15 tirs ; 50 % de chance de +150 % au premier tir ; rang ≥ 3 : 50 % de zone, ou +10 % de critique. Conf. A / B.

### Mage de feu (commun) → Captain Marvel

- Chaque attaque **explose** autour de la cible ; intervalle **0,80 s (niv. 1) → 0,66 s (niv. 15)** ; dégâts directs 36 (niv. 4) → 104 (niv. 15), de zone 27 → 86 (≈ 75-80 % des directs). Conf. A.

### Voleur (Rogue, commun, premier) → Soldat de l'hiver

- Chaque attaque ajoute un **bonus aléatoire entre 1 et la valeur de dégâts critiques** du compte. Conf. A (dégâts : C).

### Danse-lames (légendaire) → Shang-Chi

- **Sans Danse-lames adjacente** : gros bonus de **vitesse d'attaque** (mode renforcé) ; avec 2 Danse-lames ou plus non reliées, chacune **augmente les dégâts des autres**. Dégâts niv. 7 : **215** → niv. 15 : 1 001. Talents (alucare) : fleur à chaque déplacement (+2 % de dégâts à toutes, 50 max) ; +30 % contre boss et mini-boss en dansant ; bonus max à 8. Conf. A / B.

### Archer du vent (épique, premier) → Vaïana & Pua

- **Mode Ouragan** périodique (toutes les **4 s** depuis 3.1.1, avant 7 s) : cadence fortement augmentée ; durée **3,0 s au niv. 5 → 6 s au niv. 15** ; dégâts 35 (niv. 5) → 157 (niv. 15) ; **chaque rang : +30 dégâts et +0,3 s d'ouragan**. Intervalle 0,6 s au rang 1. Conf. A.

### Borée (légendaire, dégâts) → Maui

- **Alterne deux phases de tir** : phase 1 = cadence augmentée ; phase 2 = cadence **et chance de critique** augmentées ; durées selon le niveau. Talents (alucare) : en phase 2, 20 % de tirer 2 flèches qui ralentissent ; 30 % de pluie de flèches (200 dégâts, toujours critique). Conf. A / B.

### Pyrotechnicien (épique) → Mulan & Mushu

- **Nombre impair** de Pyrotechniciens sur le terrain : cadence réduite, cible **aléatoire**, dégâts de **zone** (la zone grandit avec le rang) ; nombre pair : dégâts réduits, cible = premier. Dégâts niv. 6 : **167** → niv. 13 : 599. Conf. A / B.

### Stase (légendaire, malus) → Ariel & Sébastien

- Lance périodiquement des **sphères de contrôle du temps qui arrêtent les ennemis** ; intervalle **4,0 s au rang 1 → 1,8 s au rang 7** (5 s au départ depuis 8.1) ; durée **2,5 s** (6.1, avant 2 s) + 0,4 s par amélioration au mana, monte avec le niveau. Conf. A.

### Chaudron magique (rare, soutien) → Nemo & Dory

- Produit du **mana** toutes les quelques secondes ; potions et élixirs (11.0) au hasard : **renforcer une unité** (+25 % de dégâts pendant 15 s), **blesser** les monstres, **+mana des éliminations**, **ralentir fortement** ; 30 % de chance d'un élixir en plus. Conf. A / B.

### Chimiste (rare, malus, premier sans effet) → Nick & Judy

- **Destruction d'armure** : la cible subit plus de dégâts ; base **3 % (niv. 3) → 9 % (niv. 15)** (+0,5 %/niv.), total = amélioration + base × (rang − 1) (exemple : 48 + 8 × 6 = 96 %). Vise le premier ennemi **qui n'a pas encore l'effet**. Dégâts niv. 3 : 39. Conf. A.

### Ingénieur (épique, dégâts) → Buzz & Woody

- Les Ingénieurs **adjacents se relient** : +dégâts **par Ingénieur relié**, **4 % (niv. 5) → 9 % (niv. 15)** ; 10 reliés au plus ; 13 ou plus : +30 % (alucare). Ascension max : les pièces produites font monter le rang. Conf. A / B.

### Meule (rare, soutien) → Raiponce & Pascal

- Augmente les **dégâts des unités adjacentes** selon son rang (16.0 : plus de critique, des dégâts ; effet réduit pour les dégâts de zone). Chiffres du tableau illisibles (176 au niv. 7, 325 au niv. 12, unité inconnue). Conf. A (mécanique) / C (chiffres).

### Jumeaux (légendaire d'événement, Conseil magique, dégâts, premier) → Rox & Rouky

- Apparaissent en **Lune** ou en **Soleil** ; leur rang monte par fusion ou par la Dryade. Mécanique chiffrée **introuvable**. Conf. A (forme) / C (reste).

### Autres unités relevées (non utilisées)

Thunderer, Bourreau (exécute sous **17,5 % (niv. 5) → 29,5 % (niv. 13)** des PV, moitié contre les boss, dégâts 104 → 252), Cogneur (rage : 10 % de chance par nouveau monstre au-delà de 7), Barde (mode Musique, talents chiffrés), Démonologue, Banshee, Cultiste, Mime, Ferrailleur.
