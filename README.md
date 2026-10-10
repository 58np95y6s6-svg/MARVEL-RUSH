# Marvel Rush

Jeu mobile de tower defense inspiré du système de Rush Royale : fusion d'unités, plateau, vagues d'ennemis et boss.

- Deux packs de tirage : **Marvel** et **Disney**
- Bonus de synergie pour certaines équipes de 3, 4 ou 5 héros
- 3 skins par personnage
- Personnages vus de face uniquement : une fiche et deux poses d'action

## Contenu du dépôt

| Dossier | Contenu |
|---|---|
| `design/planches/` | Planches de personnages animées (HTML/SVG, à ouvrir dans un navigateur) |
| `design/references/` | Références de style et galerie de références des personnages |
| `design/game-design.md` | Rôles, attaques, compétences, boss et bonus d'équipe |
| `docs/prompt-jeu.md` | Prompt complet pour développer le jeu (combat, tirages, solo, coop et duel en PWA) |

### Planches

| Fichier | Contenu |
|---|---|
| `1-marvel-a.html` | Iron Man, Spider-Man, Hulk, Thor, Doctor Strange, Venom, Captain Marvel |
| `2-marvel-b.html` | Captain America, Loki, Soldat de l'hiver, Œil de faucon, Falcon, Black Widow, Shang-Chi |
| `3-disney-a.html` | Vaïana & Pua, Maui, Pocahontas & Meeko, Mulan & Mushu, Rebelle, Ariel & Sébastien, Rox & Rouky |
| `4-disney-b.html` | Tiana & Naveen, Nemo & Dory, Coco, Nick & Judy, Buzz & Woody, Raiponce & Pascal, Vanellope & Ralph |
| `5-boss-sbires.html` | Jafar, Cruella, Ursula, Maléfique, Galactus, Bouffon Vert et leurs sbires |

Chaque planche montre, pour chaque personnage, une boucle d'attaque animée, les trois poses clés (fiche, action 1, action 2), sa rareté et ses statistiques.

## Jouer à deux (Coop)

- Les deux téléphones se trouvent tout seuls : ouvrez le jeu (avec le même lien secret), le bouton « Jouer à deux » de l'accueil indique si l'autre est en ligne. « Inviter » envoie une invitation qui s'affiche chez l'autre (Accepter / Refuser), puis salon : chacun choisit son deck et touche « Prêt ».
- Réseau : WebRTC pair à pair via PeerJS (serveur de rendez-vous public `0.peerjs.com`, STUN Google). L'espace de rendez-vous est dérivé du hash de la clé secrète : la clé n'apparaît jamais dans les identifiants.
- Limite : certains réseaux mobiles (NAT symétrique) bloquent la connexion directe ; on passe alors par les relais TURN publics de PeerJS, sans garantie de disponibilité. Passer un des deux téléphones en Wi-Fi règle en général le problème. Un TURN peut être ajouté au build : `VITE_TURN_URL`, `VITE_TURN_USER`, `VITE_TURN_PASS`.
- Serveur PeerJS privé (facultatif, aussi pour les tests) : `VITE_PEER_HOST`, `VITE_PEER_PORT`, `VITE_PEER_PATH`, `VITE_PEER_SECURE`, `VITE_PEER_KEY`.
- Secours : « Autres options » crée une partie avec un code de 6 caractères et un lien `#k=<CLE>&room=<CODE>` à partager.

## Droits

Les personnages appartiennent à Marvel et Disney. Ce projet est un prototype à usage personnel : les visuels sont des dessins SVG de prototypage, à ne pas diffuser publiquement ni monétiser sans licence.
