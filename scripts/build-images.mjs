#!/usr/bin/env node
/**
 * Télécharge les fichiers du manifeste, conserve l'original, produit
 * les dérivés AVIF et WebP en ratio 3:2 strict, met à jour les dimensions.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { byTitle } from './lib/commons.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const MANIFEST = path.join(ROOT, 'data/media/manifest.json');
const ORIGINALS = path.join(ROOT, 'data/media/originals');
const DERIVED = path.join(ROOT, 'public/media');
const WIDTHS = [480, 960, 1280, 1920];
const UA = 'world-natural-wonders/2.0 (projet éditorial)';

if (!fs.existsSync(MANIFEST)) { console.log('Aucun manifeste. Rien à faire.'); process.exit(0); }
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
fs.mkdirSync(ORIGINALS, { recursive: true });
fs.mkdirSync(DERIVED, { recursive: true });

let changed = false;
for (const item of manifest.items) {
  let origPath = null;
  for (const e of ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tif', '.tiff']) {
    const candidate = path.join(ORIGINALS, `${item.id}${e}`);
    if (fs.existsSync(candidate)) { origPath = candidate; break; }
  }
  if (!origPath) origPath = path.join(ORIGINALS, `${item.id}${path.extname(item.commons_file) || '.jpg'}`);

  if (!fs.existsSync(origPath)) {
    const info = await byTitle(item.commons_file);
    if (!info) { console.error(`x ${item.id} : fichier introuvable ou licence non acceptable sur Commons`); continue; }
    if (info.license !== item.license) {
      console.error(`x ${item.id} : licence Commons "${info.license}" différente du manifeste "${item.license}". Vérification manuelle requise.`);
      continue;
    }
    const res = await fetch(info.original, { headers: { 'user-agent': UA } });
    if (!res.ok) { console.error(`x ${item.id} : téléchargement ${res.status}`); continue; }
    fs.writeFileSync(origPath, Buffer.from(await res.arrayBuffer()));
    console.log(`+ original ${item.id}`);
    await new Promise(r => setTimeout(r, 350));
  }

  const src = sharp(origPath, { failOn: 'none' });
  const meta = await src.metadata();
  // recadrage centré au ratio 3:2, sans déformation
  const targetH = Math.round(meta.width / 1.5);
  const crop = targetH <= meta.height
    ? { width: meta.width, height: targetH }
    : { width: Math.round(meta.height * 1.5), height: meta.height };

  for (const w of WIDTHS) {
    if (w > crop.width * 1.05) continue;
    for (const [fmt, opts] of [['avif', { quality: 52, effort: 5 }], ['webp', { quality: 80 }]]) {
      const outPath = path.join(DERIVED, `${item.id}-${w}.${fmt}`);
      if (fs.existsSync(outPath)) continue;
      await sharp(origPath, { failOn: 'none' })
        .resize({ width: crop.width, height: crop.height, fit: 'cover', position: 'attention' })
        .resize({ width: w })
        .toFormat(fmt, opts)
        .toFile(outPath);
      console.log(`+ ${path.basename(outPath)}`);
    }
  }
  const jpg = path.join(DERIVED, `${item.id}-1280.jpg`);
  if (!fs.existsSync(jpg)) {
    await sharp(origPath, { failOn: 'none' })
      .resize({ width: crop.width, height: crop.height, fit: 'cover', position: 'attention' })
      .resize({ width: 1280 }).jpeg({ quality: 82, mozjpeg: true }).toFile(jpg);
  }

  const finalW = Math.min(1280, crop.width);
  const finalH = Math.round(finalW / 1.5);
  if (item.width !== finalW || item.height !== finalH || item.local !== `public/media/${item.id}-1280.jpg`) {
    item.width = finalW; item.height = finalH;
    item.local = `public/media/${item.id}-1280.jpg`;
    item.modifications = item.modifications || 'recadrage centré au ratio 3:2, redimensionnement, conversion AVIF et WebP';
    changed = true;
  }
}

if (changed) {
  manifest.updated = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  console.log('Manifeste mis à jour.');
}
