# Feuille de route

Version 1.0 · 2026-08-22

## Fait

- Phase 1, charte de sélection écrite et publiée sur le site.
- Phase 3, grille de notation à douze critères, pondérée, avec règles d'arbitrage.
- Phase 4, sélection des 100 arrêtée, quotas régionaux et typologiques appliqués et contrôlés par l'intégration continue.
- Phase 5, modèle de données définitif, schéma JSON Schema 2020-12, vocabulaires contrôlés, statuts éditoriaux.
- Phase 7, interface Astro et MapLibre : globe au chargement, carte détaillée, panneau latéral sur ordinateur, feuille inférieure sur mobile, URL partageable pour chaque filtre et chaque lieu.
- Phase 8, pipeline photographique et licences en place, manifeste versionné, génération AVIF et WebP, page de crédits générée.
- Points 10, 11, 16 et 17 : collections thématiques, calendrier naturel mensuel, mode devinette, section « La Terre en mouvement », comparateur, listes personnelles.
- Points 21 et 22 : validation de schéma, doublons, coordonnées, comptage, quotas, médias sans licence, tests, build, audit d'accessibilité, déploiement conditionnel.

## En cours

- Phase 9, rédaction des fiches restantes et montée progressive au statut `ready`.
- Phase 8 bis, vérification manuelle des licences fichier par fichier, puis intégration des photographies.

## À venir

- Phase 2, longlist complète de 300 candidats formalisée dans `data/longlist.json` avec les notations détaillées.
- Phase 10, relecture scientifique externe des fiches de géologie.
- Phase 11, optimisation mobile fine, budget de performance, audit d'accessibilité manuel.
- Phase 13, couches scientifiques optionnelles : aires protégées, UNESCO, KBA, Ramsar, géoparcs, écosystèmes, relief, volcanisme actif, glaciers, récifs.
- Couches dynamiques : activité volcanique Smithsonian, stress thermique des récifs NOAA, évolution glaciaire GLIMS.
- Comparaisons satellite avant et après pour quelques sites en transformation rapide.
- Internationalisation : anglais puis espagnol, avec séparation stricte des traductions et des données géographiques.

## Dette assumée

- Les fiches rédigées à partir de sources documentaires mais non encore contrôlées ligne à ligne portent le statut `fact_checked` et non `ready`. L'intégration continue les signale.
- La longlist de 300 candidats existe sous forme de travail préparatoire mais n'est pas encore versionnée avec le détail des notations.
- Aucune photographie n'est intégrée tant que la vérification manuelle des licences n'a pas été faite, lieu par lieu.
