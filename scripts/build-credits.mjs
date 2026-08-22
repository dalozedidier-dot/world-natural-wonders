#!/usr/bin/env node
/** Génère CREDITS.md à partir du manifeste et des sources des fiches. */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const dir = path.join(ROOT, 'data/places');
const places = fs.readdirSync(dir).filter(f => f.endsWith('.json'))
  .map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
const byId = new Map(places.map(p => [p.id, p]));
const mPath = path.join(ROOT, 'data/media/manifest.json');
const media = fs.existsSync(mPath) ? JSON.parse(fs.readFileSync(mPath, 'utf8')).items : [];

const rows = media
  .sort((a, b) => (byId.get(a.place)?.identity.name_fr ?? '').localeCompare(byId.get(b.place)?.identity.name_fr ?? '', 'fr'))
  .map(m => `| ${byId.get(m.place)?.identity.name_fr ?? m.place} | ${m.author} | [${m.license} ${m.license_version}](${m.license_url}) | [fichier](${m.source_page}) | ${m.modifications ?? ''} | ${m.verified_on} |`);

const out = `# Crédits, licences et méthode

Fichier généré automatiquement par \`scripts/build-credits.mjs\`. Ne pas modifier à la main.

## Cartographie

Fonds vectoriels [Protomaps](https://github.com/protomaps/basemaps) au format PMTiles, auto-hébergés, construits à partir des données [OpenStreetMap](https://www.openstreetmap.org/copyright) sous licence ODbL. Rendu par [MapLibre GL JS](https://maplibre.org/). Le projet n'utilise pas les serveurs de tuiles publics d'OpenStreetMap.

## Photographies

${media.length} photographie(s) intégrée(s). Licences acceptées : CC0, domaine public, CC BY, CC BY-SA. Les clauses NC et ND sont refusées. Chaque fichier est vérifié manuellement sur sa page source avant intégration.

${media.length ? `| Lieu | Auteur | Licence | Source | Modifications | Vérifié le |
| --- | --- | --- | --- | --- | --- |
${rows.join('\n')}` : '_Aucune photographie intégrée à ce jour._'}

## Sources éditoriales

${places.length} fiche(s), ${places.reduce((n, p) => n + p.sources.length, 0)} source(s) citée(s). Le détail figure au bas de chaque fiche, avec la date de consultation.

## Licences du projet

- Code : MIT
- Données éditoriales du dépôt : CC BY 4.0
- Notations internes de sélection : non publiées
- Médias et données tierces : licences propres, indiquées ci-dessus
`;
fs.writeFileSync(path.join(ROOT, 'CREDITS.md'), out);
console.log(`CREDITS.md régénéré (${media.length} médias, ${places.length} fiches).`);
