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
const FULL_RESPONSIVE = new Set([
  'raja-ampat-hero', 'daintree-paradise', 'lencois-maranhenses-hero',
  'shark-bay-hero', 'halong-hero'
]);
const UA = 'world-natural-wonders/2.0 (projet éditorial)';
async function download(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    let res;
    try { res = await fetch(url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(30000) }); }
    catch (error) {
      if (attempt === 3) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000));
      continue;
    }
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    if (res.status !== 429 && res.status < 500) throw new Error(`téléchargement ${res.status}`);
    const retryAfter = Number(res.headers.get('retry-after')) || 2 ** attempt;
    await new Promise(resolve => setTimeout(resolve, Math.min(10, retryAfter) * 1000));
  }
  throw new Error('téléchargement temporairement indisponible');
}

if (!fs.existsSync(MANIFEST)) { console.log('Aucun manifeste. Rien à faire.'); process.exit(0); }
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const only = new Set(process.argv.slice(2).filter(arg => !arg.startsWith('--')));
const force = process.argv.includes('--force');
fs.mkdirSync(ORIGINALS, { recursive: true });
fs.mkdirSync(DERIVED, { recursive: true });

let changed = false;
for (const item of manifest.items) {
  if (only.size && !only.has(item.id) && !only.has(item.place)) continue;
  let origPath = null;
  for (const e of ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tif', '.tiff']) {
    const candidate = path.join(ORIGINALS, `${item.id}${e}`);
    if (fs.existsSync(candidate)) {
      if (force) fs.rmSync(candidate);
      else { origPath = candidate; break; }
    }
  }
  if (!origPath) origPath = path.join(ORIGINALS, `${item.id}${path.extname(item.commons_file) || '.jpg'}`);

  if (!fs.existsSync(origPath)) {
    let info = null;
    try { info = await byTitle(item.commons_file); }
    catch (error) { console.error(`x ${item.id} : ${error.message}`); continue; }
    if (!info) { console.error(`x ${item.id} : fichier introuvable ou licence non acceptable sur Commons`); continue; }
    if (info.license !== item.license) {
      console.error(`x ${item.id} : licence Commons "${info.license}" différente du manifeste "${item.license}". Vérification manuelle requise.`);
      continue;
    }
    // Le dérivé Commons de 2 000 px suffit pour les sorties web jusqu'à 1 920 px
    // et évite de versionner plusieurs gigaoctets d'originaux TIFF/JPEG.
    const redirect = `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(info.commons_file)}?width=2000`;
    try { fs.writeFileSync(origPath, await download(redirect)); }
    catch (redirectError) {
      try { fs.writeFileSync(origPath, await download(info.thumb || info.original)); }
      catch { console.error(`x ${item.id} : ${redirectError.message}`); continue; }
    }
    console.log(`+ original ${item.id}`);
    await new Promise(r => setTimeout(r, 700));
  }

  const src = sharp(origPath, { failOn: 'none' });
  const meta = await src.metadata();
  // recadrage centré au ratio 3:2, sans déformation
  const targetH = Math.round(meta.width / 1.5);
  const crop = targetH <= meta.height
    ? { width: meta.width, height: targetH }
    : { width: Math.round(meta.height * 1.5), height: meta.height };

  // Les cartes et fiches utilisent le JPEG 1280. Seuls les cinq panoramas du
  // diaporama nécessitent toute la pyramide AVIF/WebP responsive.
  for (const w of (FULL_RESPONSIVE.has(item.id) ? WIDTHS : [])) {
    if (w > crop.width * 1.05) continue;
    for (const [fmt, opts] of [['avif', { quality: 52, effort: 3 }], ['webp', { quality: 80 }]]) {
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
  if (force && fs.existsSync(jpg)) fs.rmSync(jpg);
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
