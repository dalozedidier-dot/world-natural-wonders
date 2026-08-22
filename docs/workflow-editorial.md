# Workflow éditorial

Version 1.0 · 2026-08-22

## Les six statuts

| Statut | Ce qui est acquis |
| --- | --- |
| `draft` | le lieu est identifié, la fiche existe, rien n'est vérifié |
| `research` | sources rassemblées, chiffres collectés, texte rédigé |
| `fact_checked` | chaque chiffre et chaque affirmation vérifiés sur une source citée |
| `media_checked` | photographies choisies, cadrage et qualité validés |
| `license_checked` | licence, paternité et conditions vérifiées sur chaque page source |
| `ready` | publiable dans la collection des 100 |

Un lieu ne rejoint la collection publique qu'au statut `ready`. C'est la réponse directe au défaut du premier prototype : cent points obtenus vite, très peu de profondeur derrière.

## Ce que l'intégration continue refuse

- un fichier qui ne satisfait pas `place.schema.json` ;
- une valeur absente des vocabulaires contrôlés ;
- un identifiant dupliqué ou différent du nom de fichier ;
- des coordonnées aberrantes, une bbox mal ordonnée, un point hors de sa propre bbox ;
- une collection publique dont l'effectif n'est pas exactement 100 ;
- un quota régional, national, de famille ou de milieu non respecté ;
- un média référencé absent du manifeste, ou un crédit incomplet ;
- un tiret cadratin dans un texte éditorial ;
- un site en « comprendre sans y aller » qui publierait quand même un itinéraire.

## Ce que l'intégration continue signale sans bloquer

- statut inférieur à `ready` dans la collection publique ;
- moins de deux sources ;
- section géologie absente ;
- ratio photo différent de 3:2 ;
- vocabulaire de nature « vierge » ou « intouchée » ;
- fiche non revérifiée depuis plus de dix-huit mois ;
- lien externe mort.

## Cycle de révision

1. Le workflow mensuel liste les fiches périmées et les liens morts.
2. Toute correction factuelle met à jour `last_verified`.
3. Toute entrée ou sortie de la liste des 100 exige un motif écrit, la mise à jour des quotas et la promotion d'un réserviste.
4. La charte et la grille de notation sont révisées au maximum une fois par an.
