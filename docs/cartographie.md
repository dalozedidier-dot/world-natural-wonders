# Cartographie

Version 1.0 · 2026-08-22

## Pourquoi pas Leaflet et les tuiles OpenStreetMap

Le prototype utilisait Leaflet et `tile.openstreetmap.org`. Deux limites, sans rapport l'une avec l'autre :

1. **Le rendu.** À l'échelle d'un atlas mondial, on veut un globe, des tuiles vectorielles, un style sombre maîtrisé, du relief et une transition fluide du globe vers le site. MapLibre GL JS fait tout cela, y compris la projection globe, nativement.
2. **L'infrastructure.** La fondation OpenStreetMap rappelle que ses données sont libres mais que ses serveurs de tuiles ne sont pas une infrastructure gratuite illimitée, et qu'un usage applicatif soutenu peut être bloqué. Un atlas qui reçoit du trafic ne doit pas s'appuyer dessus.

## Choix retenu : PMTiles auto-hébergé

Un seul fichier `.pmtiles` sert l'ensemble du fond de carte, en lecture par plages HTTP. Aucune clé d'API, aucun quota, aucune dépendance commerciale, et un hébergement statique suffit.

- Style : `@protomaps/basemaps`, saveur sombre, retouchée pour laisser les marqueurs au premier plan.
- Données : OpenStreetMap sous ODbL, attribution affichée en permanence.
- Repli en développement : bucket de démonstration Protomaps, jamais en production.

### Produire son extrait

```
pmtiles extract https://build.protomaps.com/<AAAAMMJJ>.pmtiles basemap.pmtiles --maxzoom=8
```

Un extrait mondial au zoom 8 suffit largement pour cet usage et reste de taille raisonnable. Le fichier est ensuite publié comme actif de release GitHub ou sur un stockage objet, et son adresse renseignée dans `TILES_SOURCE` ou `PUBLIC_TILES_URL`.

## Relief et bathymétrie

`PUBLIC_TERRAIN_URL` active l'ombrage et le relief 3D à partir de tuiles terrain-RGB. Aucun fournisseur n'est câblé en dur : le choix se fait au déploiement, ce qui évite d'enfermer le projet dans un service.

## Règles d'affichage

- Aucun marqueur ne doit masquer le paysage : points de 4 à 11 pixels, halo discret sur le lieu actif.
- Regroupement automatique au-delà du zoom 4, cercles clairs sur fond sombre.
- Cadrage sur l'emprise réelle du site lorsque la `bbox` est renseignée, sinon vol vers le point.
- Le mouvement respecte `prefers-reduced-motion` : la rotation du globe s'arrête, les vols deviennent instantanés.
