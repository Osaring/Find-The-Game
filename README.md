# Find The Game

Jeu multijoueur en **Node.js + Express + Socket.IO** : une image de jeu vidéo apparaît très pixelisée, puis devient de plus en plus nette toutes les **1,2 secondes**. Le premier joueur qui trouve le bon titre gagne la manche.

## Fonctionnalités

- Connexion rapide avec pseudo.
- Manche en temps réel partagée entre tous les joueurs.
- Dévoilement progressif de l'image (blur décroissant toutes les 1,2 s).
- Le premier à proposer la bonne réponse gagne la manche.
- Révélation de la réponse puis relance automatique de la manche.
- Interface simple pensée mobile.

## Structure

- `server.js` : serveur Express + Socket.IO et logique de jeu.
- `public/` : interface web (HTML/CSS/JS).
- `images/` : images des jeux à deviner.

## Préparer les images

Dépose des images dans le dossier `images/` (extensions supportées : `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`).

La réponse attendue est **le nom du fichier sans extension**, avec `-` et `_` convertis en espaces.

Exemples :

- `mario-kart.jpg` → `mario kart`
- `zelda_breath_of_the_wild.png` → `zelda breath of the wild`

## Lancer en local

1. Installer les dépendances :

```bash
npm install
```

2. Démarrer le serveur :

```bash
npm start
```

3. Ouvrir dans le navigateur :

```text
http://localhost:3000
```

Ouvre cette URL sur plusieurs appareils (ou onglets) pour jouer en multijoueur.
