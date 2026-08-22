# Crédits, licences et méthode

## Carte

La carte interactive utilise **Leaflet** et les tuiles **OpenStreetMap**.

- OpenStreetMap contributors — données sous Open Database License (ODbL) : https://www.openstreetmap.org/copyright
- Leaflet — bibliothèque JavaScript open source : https://leafletjs.com/

## Photographies

Le projet ne contient pas une collection d’images prises au hasard sur le Web.

Les photographies sont demandées au moment de l’affichage depuis **Wikimedia Commons** via l’API MediaWiki. Le code inspecte les métadonnées de licence renvoyées par Commons et n’accepte que les familles suivantes :

- CC0
- domaine public / Public Domain Mark
- Creative Commons Attribution (CC BY)
- Creative Commons Attribution – Partage dans les mêmes conditions (CC BY-SA)

Les licences comportant une restriction **NC** (non commercial) ou **ND** (pas de modification) sont volontairement rejetées.

Pour chaque photographie effectivement affichée, la fiche du lieu montre l’auteur, la licence et un lien vers la page source Wikimedia Commons. L’image est demandée dans une largeur adaptée, puis affichée dans un ratio uniforme **3:2** avec `object-fit: cover`, sans déformation.

Si aucune photographie libre acceptable n’est trouvée pour un lieu, le site affiche un visuel neutre au lieu d’utiliser une image aux droits incertains.

Documentation technique des métadonnées Commons : https://www.mediawiki.org/wiki/Extension:CommonsMetadata

## Sélection des 100 lieux

La liste est une **sélection éditoriale**, pas un classement scientifique ou absolu. Le critère principal est que l’intérêt du lieu provienne directement d’un phénomène naturel : géologie, eau, glace, volcanisme, forêt, biodiversité, relief, littoral ou milieu marin.

Les villes, monuments, jardins aménagés et paysages dont l’attrait repose principalement sur une construction humaine sont exclus.

Les coordonnées sont destinées au repérage cartographique général. Pour les très grands parcs, archipels, récifs ou régions naturelles, le repère indique un point représentatif et non une limite officielle.

## Conditions de visite

Les périodes indiquées sont des repères généraux. Météo, accès, fermetures, risques volcaniques, conditions de glace, restrictions environnementales et règles locales peuvent changer. Toujours vérifier les sources officielles du lieu avant un voyage.

## Code

Le code du projet peut être réutilisé sous licence MIT. Les photographies, données cartographiques et contenus provenant de services tiers conservent leurs licences propres.
