#!/usr/bin/env node
/**
 * Enregistre des photographies que tu déposes toi-même, sans aucun accès réseau.
 *
 * 1. Dépose tes fichiers dans data/media/incoming/ en les nommant par identifiant
 *    de lieu, par exemple : plitvice.jpg, plitvice-2.jpg, halong.jpg
 * 2. Crée data/media/incoming/credits.json pour déclarer les droits :
 *    {
 *      "plitvice.jpg": {
 *        "author": "Nom de l'auteur",
 *        "license": "CC BY-SA", "license_version": "4.0",
 *        "license_url": "https://creativecommons.org/licenses/by-sa/4.0/",
 *        "source_page": "https://commons.wikimedia.org/wiki/File:...",
 *        "alt": "Description de ce que montre l'image"
 *      }
 *    }
 *    Pour tes propres photos, mets author avec ton nom et license "CC BY".
 * 3. node scripts/add-local-media.mjs
 * 4. npm run media:build   puis   npm run media:credits
 *
 * Un fichier sans entrée dans credits.json est refusé : le projet n'affiche
 * aucune image dont les droits ne sont pas déclarés.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const IN = path.join(ROOT, 'data/media/incoming');
const ORIG = path.join(ROOT, 'data/media/originals');
const MANIFEST = path.join(ROOT, 'data/media/manifest.json');

if (!fs.existsSync(IN)) {
  fs.mkdirSync(IN, { recursive: true });
  console.log(`Dossier créé : data/media/incoming/`);
  console.log('Dépose tes images dedans, nommées par identifiant de lieu, puis relance.');
  process.exit(0);
}

const creditsPath = path.join(IN, 'credits.json');
const credits = fs.existsSync(creditsPath) ? JSON.parse(fs.readFileSync(creditsPath, 'utf8')) : {};
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const placeIds = new Set(
  fs.readdirSync(path.join(ROOT, 'data/places')).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''))
);
const known = new Set(manifest.items.map(i => i.id));
fs.mkdirSync(ORIG, { recursive: true });

const ALLOWED = ['CC0', 'PD', 'PD-Mark', 'CC BY', 'CC BY-SA'];
const today = new Date().toISOString().slice(0, 10);
let added = 0;

for (const file of fs.readdirSync(IN).filter(f => /\.(jpe?g|png|webp|avif|tiff?)$/i.test(f))) {
  const stem = path.basename(file, path.extname(file));
  const m = /^([a-z0-9-]+?)(?:-(\d+))?$/.exec(stem);
  const placeId = m?.[1];
  const rank = Number(m?.[2] ?? 1);

  if (!placeId || !placeIds.has(placeId)) { console.error(`x ${file} : aucun lieu nommé "${placeId}"`); continue; }
  const c = credits[file];
  if (!c) { console.error(`x ${file} : absent de credits.json, droits non déclarés, ignoré`); continue; }
  if (!ALLOWED.includes(c.license)) { console.error(`x ${file} : licence "${c.license}" non acceptée`); continue; }
  if (!c.author || !c.license_url || !c.alt) { console.error(`x ${file} : author, license_url et alt sont obligatoires`); continue; }

  const id = rank === 1 ? `${placeId}-hero` : `${placeId}-${rank}`;
  if (known.has(id)) { console.log(`= ${id} déjà au manifeste`); continue; }

  const ext = path.extname(file).toLowerCase();
  fs.copyFileSync(path.join(IN, file), path.join(ORIG, `${id}${ext}`));

  manifest.items.push({
    id, place: placeId, role: rank === 1 ? 'hero' : 'gallery',
    commons_file: c.source_page?.includes('commons.wikimedia.org') ? decodeURIComponent(c.source_page.split('File:').pop()) : file,
    source_page: c.source_page || 'fichier fourni localement',
    author: c.author, author_url: c.author_url ?? null,
    license: c.license, license_version: c.license_version ?? '4.0', license_url: c.license_url,
    modifications: 'recadrage centré au ratio 3:2, redimensionnement, conversion AVIF et WebP',
    verified_on: today, verified_by: c.verified_by ?? 'dépôt local',
    width: 1280, height: 853,
    alt: c.alt, caption: c.caption ?? null,
    local: `public/media/${id}-1280.jpg`
  });
  known.add(id);
  added++;
  console.log(`+ ${id} : ${c.author}, ${c.license} ${c.license_version ?? ''}`);
}

if (added) {
  manifest.updated = today;
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`\n${added} image(s) ajoutée(s). Lance maintenant : npm run media:build && npm run media:credits`);
} else {
  console.log('\nAucune image ajoutée.');
}
