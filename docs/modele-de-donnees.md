# Modèle de données

Version 1.0 · 2026-08-22

## Principe

Un fichier JSON par lieu, dans `data/places/<id>.json`. Le nom du fichier fait foi : il doit être identique au champ `id`. Ce choix privilégie la lisibilité des différences dans Git et le travail éditorial fiche par fiche, plutôt qu'un fichier monolithique.

Les tables logiques annoncées dans le plan initial (`places`, `geography`, `ecosystem`, `geology`, `biodiversity`, `conservation`, `visit`, `seasonality`, `media`, `sources`, `licenses`) existent sous forme de blocs à l'intérieur du document, ce qui évite des jointures inutiles pour un corpus de cette taille tout en gardant la même séparation conceptuelle.

| Table du plan | Bloc du document |
| --- | --- |
| places | racine, `identity`, `editorial` |
| geography | `location` |
| ecosystem | `landscape` |
| geology | `geology` et `editorial.geology` |
| biodiversity | `biodiversity` et `editorial.biodiversity_text` |
| conservation | `conservation` |
| visit | `visit` |
| seasonality | `seasonality` |
| media | `data/media/manifest.json`, référencé par `media.hero` et `media.gallery` |
| sources | `sources` |
| licenses | champs de licence du manifeste média |

## Séparation des faits et de l'appréciation

- Les **faits** vivent dans `location`, `landscape`, `protection`, `figures`, `geology`, `biodiversity`, `seasonality`, `visit` et `conservation`. Chacun doit pouvoir être rattaché à une entrée de `sources`.
- Les **appréciations éditoriales** vivent dans `editorial` : `lede`, `why_here`, `presentation`, `geology`, `dynamics`, `in_motion`, `badges`. Elles sont assumées comme telles.
- La **notation de sélection** vit dans `score`. Elle est interne, jamais exposée : les points d'API la retirent explicitement du document servi.

## Fraîcheur

`last_verified` est obligatoire sur chaque fiche. Le workflow mensuel `verification.yml` signale toute fiche dont la vérification remonte à plus de dix-huit mois, ainsi que les liens externes morts.

## Vocabulaires contrôlés

`data/schema/taxonomies.json` est la seule source de vérité pour les régions, les types de paysage, les familles, les badges, les collections, les niveaux d'accessibilité et de fragilité, les menaces et les désignations de protection. Toute valeur employée dans une fiche et absente de ce fichier fait échouer la validation.

## Identifiants

`id` en minuscules, sans accent, mots séparés par des traits d'union. Il est stable : c'est l'URL publique de la fiche, la clé du manifeste média et la clé des listes personnelles enregistrées dans le navigateur. Un identifiant ne se renomme pas sans redirection.

## Coordonnées et protection des sites sensibles

`coordinate_precision` prend trois valeurs :

- `site` : position réelle du site, cas général ;
- `generalized` : position volontairement arrondie, employée pour les habitats fragiles ou les espèces sensibles ;
- `region` : simple repère régional.

La recommandation du GBIF est appliquée : lorsque la publication d'une localisation précise peut entraîner dérangement, prélèvement ou exploitation, la position est généralisée et la fiche le dit. Aucun itinéraire vers une zone interdite n'est publié, et `visit.no_route_guidance` le marque explicitement.

## Sorties publiques

| Chemin | Contenu |
| --- | --- |
| `/donnees/lieux.geojson` | points et propriétés essentielles, pour un SIG |
| `/donnees/lieux.json` | corpus complet sans les notations internes |
| `/donnees/lieux/<id>.json` | fiche individuelle, format du panneau latéral |
| `/donnees/taxonomies.json` | vocabulaires contrôlés |
