# Grille de notation interne

Version 1.0 · dernière révision : 2026-08-22

Douze critères, notés de 0 à 5. La note est un outil de construction de la sélection. Elle n'est jamais publiée sous forme de classement.

## Critères

| # | Critère | Question posée | Pondération |
| --- | --- | --- | --- |
| 1 | Puissance visuelle | Le paysage produit-il un effet immédiat, indépendamment de toute explication ? | ×3 |
| 2 | Singularité | Existe-t-il beaucoup d'équivalents visuels dans le monde ? | ×3 |
| 3 | Rareté géologique ou écologique | Le phénomène est-il rare à l'échelle planétaire ? | ×3 |
| 4 | Diversité interne | Le site combine-t-il plusieurs milieux ou plusieurs échelles de paysage ? | ×2 |
| 5 | Intégrité | Le paysage est-il peu fragmenté, peu artificialisé, encore fonctionnel ? | ×2 |
| 6 | Monumentalité | Dimensions, dénivelés, surfaces, volumes. | ×2 |
| 7 | Phénomènes actifs | Volcanisme, hydrothermalisme, marées, crues, migrations, vêlage glaciaire. | ×2 |
| 8 | Richesse biologique | Endémisme, densité spécifique, rôle d'habitat critique. | ×2 |
| 9 | Photogénie | Le site tient-il sur plusieurs lumières et plusieurs saisons, sans dépendre d'un unique cadrage ? | ×1 |
| 10 | Valeur pédagogique | Le lieu permet-il de comprendre quelque chose de la Terre ? | ×3 |
| 11 | État de conservation | Gestion effective, tendance de l'état du site. | ×1 |
| 12 | Complémentarité | Qu'apporte ce site que les autres n'apportent pas ? | ×3 |

Score maximum théorique : 5 × 27 = 135.

## Lecture des seuils

- **≥ 105** : entrée quasi certaine dans les 100, candidat naturel au groupe des vingt.
- **90 à 104** : entrée probable, sous réserve des quotas.
- **75 à 89** : réserviste ou entrée si le quota d'une région ou d'une famille l'exige.
- **< 75** : écarté.

Le critère 12 est le seul qui dépende de la liste entière. Il est renoté après chaque itération : un site dont l'apport est déjà couvert par un autre voit sa note chuter, même s'il est superbe. C'est ce critère qui empêche la sélection de devenir une collection de six canyons de grès américains.

## Ordre des opérations

1. Notation individuelle des critères 1 à 11 sur la longlist complète.
2. Tri décroissant, coupe provisoire au rang 140.
3. Application des quotas régionaux, nationaux, de milieux et de familles.
4. Notation du critère 12 sur les survivants, en comparant chaque site aux autres retenus.
5. Arbitrages : substitution des redondances par les meilleurs candidats des quotas déficitaires.
6. Arrêt des 100, puis des 30 réservistes.
7. Composition du groupe des vingt, à quotas régionaux proportionnels.

## Règles d'arbitrage

- À score égal, le site le moins représenté médiatiquement l'emporte.
- À score égal, le site dont la fiche est la plus documentée l'emporte, car il produira une meilleure page.
- Un site dont le score de conservation est inférieur ou égal à 1 est écarté même si le reste est excellent : le projet ne veut pas envoyer de public sur un site en effondrement.
- Un site dont la fréquentation cause un dommage documenté peut être retenu, mais sa fiche porte alors le message « comprendre ce lieu sans nécessairement y aller » et n'indique aucun itinéraire.

## Traçabilité

Les notes sont conservées dans `data/longlist.json`, champ `score`, avec le détail par critère et la date de notation. Elles ne sont pas exposées dans l'interface publique.
