# Pipeline photographique et licences

Version 1.0 · 2026-08-22

## Choix retenu

Téléchargement au moment de la construction, manifeste de licences versionné. Le dépôt ne dépend d'aucun appel réseau à l'affichage, ce qui garantit la stabilité, la performance et surtout la traçabilité juridique.

## Étapes

1. **Découverte.** `npm run media:fetch -- <id>` interroge l'API Wikimedia Commons et propose des candidats, en écartant d'emblée toute licence NC ou ND. Le résultat est écrit dans `data/media/candidates.json`. Ce fichier est une aide, jamais une décision.
2. **Vérification manuelle.** Ouvrir chaque page source, contrôler la paternité, la licence exacte, sa version, et l'absence de mention contradictoire. Wikimedia avertit elle-même que les conditions diffèrent selon chaque fichier et qu'elle ne garantit pas juridiquement l'exactitude de toutes les informations de licence. Openverse formule le même avertissement.
3. **Inscription au manifeste.** Ajouter l'entrée dans `data/media/manifest.json` avec `verified_on` et `verified_by`.
4. **Construction.** `npm run media:build` télécharge l'original, le conserve dans `data/media/originals`, recadre au ratio 3:2 strict sans déformation, produit les dérivés AVIF et WebP en 480, 960, 1600 et 2400 pixels de large, ainsi qu'un JPEG de repli, et met à jour les dimensions du manifeste.
5. **Crédits.** `npm run media:credits` régénère `CREDITS.md` et alimente la page publique des crédits. L'intégration continue échoue si le fichier n'est pas à jour.

## Licences acceptées

CC0, domaine public, CC BY, CC BY-SA.

Refusées : toute clause NC, qui fermerait tout usage commercial futur, et toute clause ND, incompatible avec le recadrage 3:2 imposé par la charte visuelle.

## Champs obligatoires par fichier

auteur, page source, licence, version de licence, URL de la licence, modifications effectuées, date de vérification, dimensions, chemin local, texte alternatif.

Le texte alternatif décrit ce que montre l'image, pas le nom du lieu. « Barrages de travertin étagés entre des lacs turquoise, sous une forêt de hêtres » vaut mieux que « Lacs de Plitvice ».

## Règle de repli

Si aucune photographie libre acceptable n'existe pour un lieu, la fiche affiche un aplat coloré dérivé de la famille de paysage. Le projet préfère une absence assumée à une image aux droits incertains.
