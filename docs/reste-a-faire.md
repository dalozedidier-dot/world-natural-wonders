# Reste à faire

Mis à jour le 2026-08-23.

## 1. Corpus principal

Les 100 joyaux sont désormais rédigés, structurés et intégrés. La validation bloquante des quotas s'applique à ce corpus complet.

### Europe, 0 restante sur 14

Complète : plitvice, dolomites, geirangerfjord, lofoten, vatnajokull-jokulsarlon, landmannalaugar, chaussee-des-geants, skocjan, aletsch, laurisilva-madere, delta-danube, bialowieza, tara-durmitor, gavarnie-mont-perdu.

### Asie, 0 restante sur 22

Complète : zhangjiajie, jiuzhaigou, huangshan, guilin-li, danxia-zhangye, halong, phong-nha, bromo-tengger-semeru, raja-ampat, komodo, gunung-mulu, tubbataha, sundarbans, yakushima, shiretoko, baikal, kamtchatka, socotra, wadi-rum, sagarmatha, nanda-devi, tian-shan-occidental.

### Afrique, 0 restante sur 15

Complète : victoria-falls, okavango, namib-sossusvlei, serengeti, ngorongoro, nyiragongo-virunga, bwindi, rwenzori, kilimandjaro, simien, tsingy-bemaraha, banc-arguin, tassili-najjer, region-florale-cap, danakil-erta-ale.

### Amérique du Nord et centrale, 0 restante sur 15

Complète : grand-canyon, yellowstone, yosemite, redwood, denali, everglades, rocheuses-canadiennes, nahanni, gros-morne, baie-de-fundy, barranca-del-cobre, sac-actun, morne-trois-pitons, belize-blue-hole, corcovado.

### Amérique du Sud, 0 restante sur 15

Complète : iguazu, torres-del-paine, perito-moreno, salar-uyuni, valle-de-la-luna, lencois-maranhenses, chapada-diamantina, pantanal, canaima-salto-angel, galapagos, cano-cristales, huascaran, colca, manu, kaieteur.

### Océanie, 0 restante sur 11

Complète : grande-barriere, daintree, uluru-kata-tjuta, purnululu, shark-bay, tongariro, fiordland-piopiotahi, aoraki, palau-rock-islands, mont-yasur, lagon-nouvelle-caledonie.

### Régions polaires, 0 restante sur 8

Complète : peninsule-antarctique-lemaire, deception-island, vallees-seches-mcmurdo, georgie-du-sud, ilulissat, svalbard-austfonna, wrangel, auyuittuq.

## 2. Les 30 réservistes

Sélection arrêtée, fiches à rédiger au statut `research` avec `"collection": "reserve"` :

kinabalu, el-nido, chocolate-hills, jeju, kawah-ijen, saut-du-tigre, annapurna, pamukkale, fish-river-canyon, blyde-river-canyon, desert-blanc-egypte, isalo, semuc-champey, sian-kaan, quilotoa, tayrona, moraine-lake, maligne-lake, na-pali, bryce-canyon, zion, verdon, lauterbrunnen, sete-cidades, triglav, samaria, ha-giang, altiplano-lauca, cape-york, macquarie.

## 3. Photographies

1. `npm run media:fetch -- <id>` pour obtenir des candidats sous licence acceptable.
2. Ouvrir chaque page source, vérifier paternité et licence à la main.
3. Ajouter l'entrée dans `data/media/manifest.json` avec `verified_on` et `verified_by`.
4. `npm run media:build` puis `npm run media:credits`.

Compter environ trois à cinq images par lieu, une héroïne et le reste en galerie.

## 4. Fond de carte

Produire l'extrait PMTiles, le publier, et renseigner `TILES_SOURCE` ou `PUBLIC_TILES_URL`. Voir `docs/cartographie.md`. Tant que ce n'est pas fait, le site utilise le bucket de démonstration Protomaps, ce qui est acceptable en développement mais pas en production.

## 5. Longlist des 300

Le travail de présélection existe mais n'est pas encore versionné avec le détail des notations. Créer `data/longlist.json` avec, pour chaque candidat, l'identifiant, le nom, le pays, la famille, la source de présélection et les douze notes.

## 6. Autres chantiers ouverts

- Passage de `fact_checked` à `ready` : relecture ligne à ligne des chiffres et des URLs, contrôle des liens par `node scripts/check-links.mjs`.
- Couches scientifiques optionnelles : aires protégées, UNESCO, KBA, Ramsar, géoparcs, relief, volcanisme actif, glaciers, récifs.
- Couches dynamiques : Smithsonian Global Volcanism Program, NOAA Coral Reef Watch, GLIMS.
- Comparaisons satellite avant et après pour les sites en transformation rapide.
- Internationalisation anglaise, puis espagnole.
