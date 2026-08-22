#!/usr/bin/env node
/**
 * Récupère un fond de carte PMTiles auto-hébergé.
 *
 * Le projet ne dépend pas des serveurs publics d'OpenStreetMap. Deux options :
 *   1. TILES_SOURCE pointe vers un .pmtiles déjà construit (release GitHub, S3, R2)
 *   2. à défaut, on ne télécharge rien et le code bascule sur le bucket de
 *      démonstration Protomaps, acceptable en développement seulement.
 *
 * Pour produire son propre extrait :
 *   pmtiles extract https://build.protomaps.com/<date>.pmtiles basemap.pmtiles --maxzoom=8
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const target = path.join(ROOT, 'public/tiles/basemap.pmtiles');
const source = process.env.TILES_SOURCE;

if (!source) {
  console.log('TILES_SOURCE non défini : aucun fond de carte téléchargé.');
  console.log('Le site utilisera le bucket de démonstration Protomaps. Voir docs/cartographie.md.');
  process.exit(0);
}
if (fs.existsSync(target)) { console.log('Fond de carte déjà présent.'); process.exit(0); }

fs.mkdirSync(path.dirname(target), { recursive: true });
const res = await fetch(source);
if (!res.ok) { console.error(`Téléchargement impossible : ${res.status}`); process.exit(1); }
fs.writeFileSync(target, Buffer.from(await res.arrayBuffer()));
console.log(`Fond de carte écrit : ${(fs.statSync(target).size / 1e6).toFixed(1)} Mo`);
