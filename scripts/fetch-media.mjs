#!/usr/bin/env node
/**
 * Assistant de recherche d'images. Ne modifie jamais le manifeste tout seul.
 *
 *   node scripts/fetch-media.mjs plitvice
 *   node scripts/fetch-media.mjs --all
 *
 * Il propose des candidats sous licence acceptable, avec toutes les métadonnées
 * nécessaires au crédit. La sélection et la vérification restent humaines :
 * Wikimedia rappelle elle-même qu'elle ne garantit pas l'exactitude juridique
 * des informations de licence de chaque fichier.
 */
import fs from 'node:fs';
import path from 'node:path';
import { search } from './lib/commons.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const dir = path.join(ROOT, 'data/places');
const ids = args.includes('--all')
  ? fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''))
  : args.filter(a => !a.startsWith('--'));

if (!ids.length) {
  console.log('Usage : node scripts/fetch-media.mjs <id-du-lieu> [...]  |  --all');
  process.exit(1);
}

const out = [];
for (const id of ids) {
  const file = path.join(dir, `${id}.json`);
  if (!fs.existsSync(file)) { console.error(`x ${id} : fiche introuvable`); continue; }
  const place = JSON.parse(fs.readFileSync(file, 'utf8'));
  const queries = [
    place.identity.name_official,
    `${place.identity.name_fr} ${place.location.country_labels[0]}`,
    ...(place.identity.aka ?? [])
  ].filter(Boolean);

  const seen = new Set();
  const candidates = [];
  for (const q of queries) {
    let found = [];
    try { found = await search(q, 8); } catch (e) { console.error(`  ! ${q} : ${e.message}`); }
    for (const c of found) {
      if (seen.has(c.commons_file)) continue;
      seen.add(c.commons_file);
      // on privilégie le paysage large, ratio proche de 3:2
      c.score = Math.min(c.width, 4000) / 1000 - Math.abs(c.width / c.height - 1.5) * 3;
      candidates.push(c);
    }
    await new Promise(r => setTimeout(r, 400));
  }
  candidates.sort((a, b) => b.score - a.score);
  out.push({ place: id, candidates: candidates.slice(0, 8) });
  console.log(`\n=== ${place.identity.name_fr} (${id}) ===`);
  for (const c of candidates.slice(0, 8)) {
    console.log(`  ${c.commons_file}`);
    console.log(`    ${c.width}x${c.height}  ${c.license} ${c.license_version}  ${c.author}`);
    console.log(`    ${c.source_page}`);
  }
}

const target = path.join(ROOT, 'data/media/candidates.json');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, JSON.stringify(out, null, 2));
console.log(`\nCandidats écrits dans data/media/candidates.json.`);
console.log('Étape suivante, manuelle : ouvrir chaque page source, vérifier la licence et la paternité,');
console.log("puis ajouter l'entrée retenue dans data/media/manifest.json avec verified_on et verified_by.");
