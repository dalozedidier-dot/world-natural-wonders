# 100 joyaux naturels de la Terre

Atlas éditorial et cartographique consacré à cent paysages naturels précis.

Le choix des cent est subjectif, et le projet ne prétend pas le contraire : aucune science ne dit ce qu'est un joyau. Ce qui est publié, c'est la méthode employée pour trancher, afin que le lecteur puisse la discuter. Ce qui est sourcé, ce sont les faits de chaque fiche : géologie, dimensions, statuts, espèces, saisons.

Aucune ville, aucun monument, aucun jardin, aucun lac de barrage. Uniquement des lieux dont la forme vient de l'eau, de la roche, de la glace, du feu ou du vivant, et dont on peut expliquer le mécanisme.

## État du projet

| | |
| --- | --- |
| Socle technique | complet et fonctionnel |
| Fiches rédigées | 33 sur 100 |
| Photographies | Chargées à la volée depuis Wikimedia Commons par le navigateur du visiteur, avec filtrage des licences et affichage de l'auteur. Le pipeline de téléchargement au build reste la cible : `npm run media:pick` ou `npm run media:local`, puis `npm run media:build`. |
| Fond de carte | PMTiles auto-hébergé, repli de démonstration en développement |

Le détail de ce qui reste figure dans [`docs/reste-a-faire.md`](docs/reste-a-faire.md).

## Démarrer

```bash
npm install
npm run dev        # http://localhost:4321
npm run validate   # schéma, vocabulaires, quotas, règles éditoriales
npm test           # tests unitaires du corpus
npm run build      # validation puis build Astro puis régénération des crédits
```

Node 22 requis.

## Architecture

```
data/
  schema/         place.schema.json, media.schema.json, taxonomies.json
  places/         une fiche JSON par lieu, le nom du fichier fait foi
  media/          manifest.json, originals/, candidates.json
docs/             charte, grille de notation, modèle de données, workflow, pipeline photo, cartographie, feuille de route
scripts/          validate, fetch-media, build-images, build-credits, check-links, fetch-tiles, stale, tests
src/
  data/           types TypeScript, chargeur, rendu Markdown
  layouts/        gabarit de base
  components/     carte de lieu, grille
  pages/          accueil, fiches, collections, régions, paysages, calendrier, devinette, Terre en mouvement, comparateur, favoris, crédits, données
  scripts/        globe, explorateur cartographique, abstraction de fond de carte, listes locales, état d'URL
  styles/         système visuel
.github/workflows/ ci, deploy-pages, verification
```

## Ce que fait le site

- **Globe 3D** au chargement, projection globe native de MapLibre, rotation douce respectant `prefers-reduced-motion`.
- **Carte mondiale** avec regroupement automatique, marqueurs colorés par famille de paysage, cadrage sur l'emprise réelle du site quand elle est connue.
- **Filtres combinables** par région, milieu, type de paysage, collection, accessibilité et mois. Chaque combinaison produit une URL partageable.
- **Fiche en panneau latéral** sur ordinateur, en feuille inférieure sur mobile, plus une page complète par lieu.
- **Quatre niveaux de lecture** : dix secondes, deux minutes, dix minutes, sources.
- **Calendrier naturel mensuel** : quels lieux sont à leur meilleur, et quels phénomènes se produisent.
- **Mode devinette** : une photo, des indices, puis la révélation.
- **La Terre en mouvement** : construction, démolition, glace, accumulation, le vivant comme force géologique.
- **Comparateur** de deux lieux, **listes personnelles** favoris, déjà vus, un jour, sans compte ni serveur.
- **Données ouvertes** en JSON et GeoJSON, **page de crédits** générée automatiquement.

## Choix techniques

- **Astro et TypeScript**, une page HTML générée par lieu, aucun serveur applicatif nécessaire.
- **MapLibre GL JS** à la place de Leaflet, pour le globe, les tuiles vectorielles et le relief.
- **PMTiles auto-hébergé** avec le style Protomaps, à la place des serveurs publics d'OpenStreetMap, qui ne sont pas une infrastructure destinée à un usage applicatif soutenu. Aucune clé d'API, aucun quota. Voir [`docs/cartographie.md`](docs/cartographie.md).
- **Photographies téléchargées au build**, manifeste de licences versionné, ratio 3:2 strict, dérivés AVIF et WebP. Licences acceptées : CC0, domaine public, CC BY, CC BY-SA. NC et ND refusées. Voir [`docs/pipeline-photos.md`](docs/pipeline-photos.md).
- **Statuts éditoriaux** draft, research, fact_checked, media_checked, license_checked, ready. L'intégration continue refuse le déploiement si le schéma, les vocabulaires ou les quotas ne sont pas respectés. Voir [`docs/workflow-editorial.md`](docs/workflow-editorial.md).

Tant que la collection publique compte moins de cent lieux, les contrôles de quotas sont indicatifs. Ils redeviennent bloquants dès le centième lieu, ou immédiatement avec `STRICT_QUOTAS=1 npm run validate`.

## Documentation

- [Charte de sélection](docs/charte-selection.md)
- [Grille de notation](docs/grille-scoring.md)
- [Modèle de données](docs/modele-de-donnees.md)
- [Workflow éditorial](docs/workflow-editorial.md)
- [Pipeline photographique et licences](docs/pipeline-photos.md)
- [Cartographie](docs/cartographie.md)
- [Feuille de route](docs/feuille-de-route.md)
- [Reste à faire](docs/reste-a-faire.md)
- [Brief de rédaction d'une fiche](docs/BRIEF-REDACTION.md)

## Licences

Code sous MIT. Données éditoriales du dépôt sous CC BY 4.0. Les notations internes de sélection ne sont pas publiées. Médias et données tierces sous leurs licences propres, détaillées dans `CREDITS.md`.
