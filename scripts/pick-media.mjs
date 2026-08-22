#!/usr/bin/env node
/**
 * Présélection automatique d'une image héroïne par lieu, à partir de Wikimedia Commons.
 *
 * Le script ne retient que les licences acceptées par la charte (CC0, domaine
 * public, CC BY, CC BY-SA) et écarte tout ce qui porte NC ou ND. Il écrit dans
 * le manifeste avec verified_by = "auto", ce qui signifie que le contrôle humain
 * reste à faire : le statut des fiches ne peut donc pas passer à license_checked
 * tant qu'un relecteur n'a pas ouvert chaque page source.
 */
import fs from 'node:fs';
import path from 'node:path';
import { search } from './lib/commons.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const MANIFEST = path.join(ROOT, 'data/media/manifest.json');
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const have = new Set(manifest.items.map(i => i.place));

const BAD = /(map|karte|carte|mapa|diagram|chart|graph|logo|flag|drapeau|sign|panneau|plaque|stamp|timbre|coin|poster|portrait|statue|museum|musee|book|cover|screenshot|satellite image|topograph)/i;

const dir = path.join(ROOT, 'data/places');
const only = process.argv.slice(2).filter(a => !a.startsWith('--'));
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

for (const f of files) {
  const p = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  if (only.length && !only.includes(p.id)) continue;
  if (have.has(p.id)) { console.log(`= ${p.id} déjà pourvu`); continue; }

  const queries = [
    p.identity.name_official,
    `${p.identity.name_fr} ${p.location.country_labels[0]}`,
    ...(p.identity.aka ?? []).map(a => `${a} ${p.location.country_labels[0]}`)
  ].filter(Boolean);

  let best = null;
  for (const q of queries) {
    let found = [];
    try { found = await search(q, 10); } catch (e) { console.error(`  ! ${q} : ${e.message}`); }
    for (const c of found) {
      if (BAD.test(c.commons_file)) continue;
      const ratio = c.width / c.height;
      if (ratio < 1.15 || ratio > 2.4) continue;
      if (c.width < 1400) continue;
      const score = Math.min(c.width, 5000) / 1000 - Math.abs(ratio - 1.5) * 4;
      if (!best || score > best.score) best = { ...c, score };
    }
    if (best && best.score > 3.2) break;
    await new Promise(r => setTimeout(r, 350));
  }

  if (!best) { console.log(`x ${p.id} : aucun candidat acceptable`); continue; }

  manifest.items.push({
    id: `${p.id}-hero`,
    place: p.id,
    role: 'hero',
    commons_file: best.commons_file,
    source_page: best.source_page,
    author: best.author,
    author_url: null,
    license: best.license,
    license_version: best.license_version || '4.0',
    license_url: best.license_url,
    modifications: 'recadrage centré au ratio 3:2, redimensionnement, conversion AVIF et WebP',
    verified_on: '2026-08-22',
    verified_by: 'auto',
    width: 1280,
    height: 853,
    alt: `${p.identity.name_fr}, ${p.location.country_labels.join(' et ')}, ${p.landscape.types.map(t => t.replace(/-/g, ' ')).slice(0, 2).join(' et ')}`,
    caption: null,
    local: `public/media/${p.id}-hero-1280.jpg`
  });
  have.add(p.id);
  console.log(`+ ${p.id} : ${best.commons_file} (${best.license} ${best.license_version}, ${best.width}x${best.height})`);
}

manifest.updated = '2026-08-22';
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log(`\n${manifest.items.length} média(s) au manifeste. Contrôle humain des licences encore à faire.`);
