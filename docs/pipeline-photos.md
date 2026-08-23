# Pipeline photographique et licences

Version 1.0 · 2026-08-22

## Deux régimes

**Aujourd'hui, chargement à l'exécution.** Le navigateur du visiteur interroge l'API Wikimedia Commons et affiche la première image acceptable pour chaque lieu. Le module `src/scripts/photos.ts` rejette toute licence portant NC ou ND, ne retient que CC0, domaine public, CC BY et CC BY-SA, écarte les cartes, schémas et logos par leur titre, exige au moins 1 200 pixels de large et un rapport compris entre 1,2 et 2,6, puis affiche l'auteur et la licence sous l'image. Les résultats sont mis en cache dans la session. La requête employée par lieu est le champ `media.query` de sa fiche, ce qui permet de la corriger au cas par cas.

Avantage : le site est illustré immédiatement, sans un octet d'image dans le dépôt. Limite : dépendance à la disponibilité de Commons, et vérification des licences automatique et non humaine.

**Cible, téléchargement au build.** Dès qu'une entrée existe au manifeste pour un lieu, elle l'emporte sur le chargement à l'exécution, et aucun appel réseau n'est fait pour ce lieu. C'est le régime décrit ci-dessous.

## Choix retenu

Téléchargement au moment de la construction, manifeste de licences versionné. Le dépôt ne dépend d'aucun appel réseau à l'affichage, ce qui garantit la stabilité, la performance et surtout la traçabilité juridique.

## À lancer depuis une machine ayant accès à Internet

Les sessions Claude tournent derrière une liste blanche réseau qui ne contient pas `commons.wikimedia.org`. Les deux commandes suivantes doivent donc être exécutées sur ta machine, pas depuis une session assistée :

```bash
npm run media:pick      # présélection automatique d'une héroïne par lieu
npm run media:build     # téléchargement, recadrage 3:2, AVIF et WebP
npm run media:credits   # régénération de CREDITS.md
```

`media:pick` écrit dans le manifeste avec `verified_by: "auto"`. Tant qu'un relecteur humain n'a pas ouvert chaque page source, aucune fiche ne peut passer au statut `license_checked`.

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

## Déposer ses propres images, sans accès réseau

Quand l'API Commons n'est pas joignable, ou pour utiliser des photographies que tu as toi-même prises ou sourcées :

1. `npm run media:local` une première fois pour créer `data/media/incoming/`.
2. Dépose tes fichiers dedans, nommés par identifiant de lieu : `plitvice.jpg` devient l'héroïne, `plitvice-2.jpg` et `plitvice-3.jpg` alimentent la galerie.
3. Crée `data/media/incoming/credits.json` :

```json
{
  "plitvice.jpg": {
    "author": "Nom de l'auteur",
    "license": "CC BY-SA",
    "license_version": "4.0",
    "license_url": "https://creativecommons.org/licenses/by-sa/4.0/",
    "source_page": "https://commons.wikimedia.org/wiki/File:...",
    "alt": "Barrages de travertin étagés entre des lacs turquoise, sous une forêt de hêtres"
  }
}
```

4. `npm run media:local` puis `npm run media:build` puis `npm run media:credits`.

Un fichier absent de `credits.json`, ou portant une licence hors CC0, domaine public, CC BY et CC BY-SA, est refusé. Les originaux sont versionnés dans `data/media/originals/` pour que l'intégration continue puisse régénérer les dérivés sans accès à Commons ; seuls les dérivés de `public/media/` sont ignorés par Git.

Le diaporama d'accueil et les fiches basculent automatiquement du visuel généré vers la photographie dès qu'une entrée existe au manifeste. Aucune modification de code n'est nécessaire.
