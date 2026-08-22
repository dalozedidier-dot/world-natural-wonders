# 100 joyaux naturels du monde

Carte interactive statique consacrée à une sélection de 100 paysages naturels spectaculaires à travers le monde.

## Fonctionnalités

- 100 lieux naturels répartis sur 7 grandes régions
- carte mondiale Leaflet / OpenStreetMap
- filtres par continent et famille de paysage
- recherche plein texte
- 20 coups de cœur
- favoris locaux
- bouton « Surprends-moi »
- fiches détaillées avec coordonnées et période indicative
- photographies réelles chargées depuis Wikimedia Commons
- filtrage automatique des licences libres
- auteur, licence et lien source affichés pour chaque photo
- ratio photo uniforme 3:2
- responsive mobile / tablette / ordinateur

## Photographies

Le site interroge Wikimedia Commons à la demande. Les images NC et ND sont rejetées. Les licences acceptées sont CC0, domaine public, CC BY et CC BY-SA.

Cette stratégie évite de stocker dans le dépôt une centaine de photographies dont il faudrait maintenir manuellement les droits et les crédits, tout en conservant une traçabilité visible pour l’utilisateur.

## Déploiement GitHub Pages

Le workflow `.github/workflows/deploy-pages.yml` déploie automatiquement le site à chaque push sur `main`.

Dans le dépôt GitHub :

1. ouvrir **Settings → Pages** ;
2. choisir **GitHub Actions** comme source ;
3. pousser le projet sur `main`.

## Structure

- `index.html` — interface
- `assets/styles.css` — design responsive
- `assets/app.js` — carte, filtres, favoris, photos Commons
- `data/places.js` — base des 100 lieux
- `CREDITS.md` — licences et méthode
- `.github/workflows/deploy-pages.yml` — déploiement

## Licence

Code : MIT. Les médias et données externes conservent leurs licences propres.
