# Brief de rédaction d'une fiche (usage interne)

Tu produis un fichier JSON par lieu dans `/home/claude/wnw/data/places/<id>.json`.

## Référence obligatoire

- Schéma : `/home/claude/wnw/data/schema/place.schema.json` (respect strict, `additionalProperties:false` partout)
- Vocabulaires contrôlés : `/home/claude/wnw/data/schema/taxonomies.json` (toute valeur d'id doit exister)
- Exemple modèle, à imiter en niveau de détail et de ton : `/home/claude/wnw/data/places/plitvice.json`
- Validation : `node scripts/validate.mjs` (ignore les erreurs de quotas tant que le corpus est incomplet)

## Règles de langue, non négociables

1. Français soutenu, éditorial, précis. Registre d'un grand magazine de sciences naturelles.
2. **Aucun tiret cadratin ni demi-cadratin (— ou –) dans les textes.** Utiliser virgules, deux-points, parenthèses ou point-virgule. Le validateur rejette les fichiers qui en contiennent.
3. Pas de superlatifs creux, pas de langage promotionnel touristique. On explique, on ne vend pas.
4. Ne jamais écrire qu'un lieu est « vierge », « intouché » ou « inexploré ». Nommer les peuples autochtones quand leur lien est établi, employer les toponymes autochtones officiels.
5. Chiffres : unités SI, espace insécable évitée (écrire « 296 km² » avec une espace simple), virgule décimale française.
6. Jamais d'itinéraire vers une zone interdite, jamais de coordonnées précises d'espèce rare ou de site fragile. Dans ce cas mettre `coordinate_precision: "generalized"` et arrondir la position.

## Contenu attendu, champ par champ

- `editorial.lede` : 1 phrase, 150 à 300 signes, l'image mentale du lieu. Niveau « 10 secondes ».
- `editorial.why_here` : 3 à 5 phrases. Pourquoi ce site mérite sa place dans une sélection de 100, en termes de processus naturel et de complémentarité, pas de beauté générique.
- `editorial.presentation` : 250 à 400 mots, 3 à 5 paragraphes séparés par `\n\n`. Niveau « 2 minutes ».
- `editorial.geology` : 250 à 400 mots. Vraie histoire de la Terre : quelles roches, quels âges, quels processus, quelle chronologie, pourquoi le paysage a cette forme précise. C'est le cœur du projet.
- `editorial.dynamics` : 120 à 220 mots. Comment le système fonctionne aujourd'hui : hydrologie, climat, marées, activité, saisonnalité physique.
- `editorial.biodiversity_text` : 100 à 200 mots.
- `editorial.in_motion` : 80 à 150 mots. Ce qui change à l'échelle humaine, y compris sous l'effet du climat.
- `editorial.guess_hints` : 3 à 4 indices pour le mode devinette. Ils ne doivent jamais nommer le lieu, le pays ni un toponyme identifiable. Exemples valides : « forêt nuageuse », « 3 000 m d'altitude », « Amérique du Sud », « roche volcanique acide ».
- `figures` : 5 à 9 chiffres marquants, valeur formatée en français.
- `seasonality.phenomena` : 2 à 5 phénomènes datés, avec `kind` pris dans l'énumération du schéma.
- `visit.rules` : 3 à 6 règles concrètes, spécifiques au site.
- `conservation` : état réel, tendance, menaces avec niveau. Si le site est en danger ou si la fréquentation nuit, mettre `understand_without_going: true` **et** `visit.no_route_guidance: true`.
- `sources` : 3 à 6 sources, dont au moins une officielle (gestionnaire du site, agence nationale, UNESCO, Protected Planet, GVP). URLs réelles et vérifiées. `accessed: "2026-08-22"`.
- `score` : notation honnête des 12 critères de `docs/grille-scoring.md`, chacun de 0 à 5, plus le total pondéré.
- `last_verified: "2026-08-22"`, `status: "ready"` pour les 100, `status: "research"` pour les réservistes.

## Vérification factuelle

Utilise WebSearch et WebFetch pour vérifier : superficie, altitudes, dates d'inscription, références UNESCO, numéro GVP pour les volcans, statut UICN des espèces citées, nom exact de l'organisme gestionnaire, URL officielle. N'invente jamais une URL. Si un chiffre n'est pas vérifiable, ne l'écris pas plutôt que de l'approximer silencieusement.

## Pondérations du score

visuel ×3, singularite ×3, rarete ×3, diversite ×2, integrite ×2, monumentalite ×2, actif ×2, biologique ×2, photogenie ×1, pedagogie ×3, conservation ×1, complementarite ×3.

## Sortie

Écris directement les fichiers. Ne renvoie pas le JSON dans ta réponse finale : renvoie seulement la liste des identifiants écrits et les points de doute factuel rencontrés.
