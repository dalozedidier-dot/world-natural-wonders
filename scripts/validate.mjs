#!/usr/bin/env node
/**
 * Validation éditoriale et structurelle du corpus.
 * Lancé en local (npm run validate) et en intégration continue.
 */
import fs from 'node:fs';
import path from 'node:path';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const ROOT = path.resolve(import.meta.dirname, '..');
const read = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

const tax = read('data/schema/taxonomies.json');
const placeSchema = read('data/schema/place.schema.json');
const mediaSchema = read('data/schema/media.schema.json');

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validatePlace = ajv.compile(placeSchema);
const validateMedia = ajv.compile(mediaSchema);

const errors = [];
const warnings = [];
const fail = (file, msg) => errors.push(`${file} :: ${msg}`);
const warn = (file, msg) => warnings.push(`${file} :: ${msg}`);

const ids = {
  landscape: new Set(tax.landscapes.map(l => l.id)),
  family: new Set(tax.families.map(f => f.id)),
  badge: new Set(tax.badges.map(b => b.id)),
  collection: new Set(tax.collections.map(c => c.id)),
  threat: new Set(tax.threats.map(t => t.id)),
  designation: new Set(tax.designations.map(d => d.id)),
  region: new Set(tax.regions.map(r => r.id))
};

const dir = path.join(ROOT, 'data/places');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort();
const places = [];

for (const f of files) {
  let doc;
  try {
    doc = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  } catch (e) {
    fail(f, `JSON invalide : ${e.message}`);
    continue;
  }
  places.push({ file: f, doc });

  if (!validatePlace(doc)) {
    for (const e of validatePlace.errors) fail(f, `schéma ${e.instancePath || '/'} ${e.message}`);
  }
  if (doc.id !== path.basename(f, '.json')) fail(f, `id "${doc.id}" différent du nom de fichier`);

  // vocabulaires contrôlés
  for (const t of doc.landscape?.types ?? []) if (!ids.landscape.has(t)) fail(f, `type de paysage inconnu : ${t}`);
  if (doc.landscape?.primary && !ids.landscape.has(doc.landscape.primary)) fail(f, `paysage principal inconnu : ${doc.landscape.primary}`);
  if (doc.landscape?.family && !ids.family.has(doc.landscape.family)) fail(f, `famille inconnue : ${doc.landscape.family}`);
  for (const c of doc.landscape?.collections ?? []) if (!ids.collection.has(c)) fail(f, `collection inconnue : ${c}`);
  for (const b of doc.editorial?.badges ?? []) if (!ids.badge.has(b)) fail(f, `badge inconnu : ${b}`);
  for (const t of doc.conservation?.threats ?? []) if (!ids.threat.has(t.type)) fail(f, `menace inconnue : ${t.type}`);
  for (const d of doc.protection?.designations ?? []) if (!ids.designation.has(d.type)) fail(f, `désignation inconnue : ${d.type}`);

  // cohérence géographique
  const { lat, lng } = doc.location ?? {};
  if (typeof lat === 'number' && typeof lng === 'number' && Math.abs(lat) < 0.5 && Math.abs(lng) < 0.5) {
    fail(f, 'coordonnées proches de 0,0 : très probablement une erreur');
  }
  if ((doc.location?.countries ?? []).length !== (doc.location?.country_labels ?? []).length) {
    fail(f, 'countries et country_labels de longueurs différentes');
  }
  const bbox = doc.location?.bbox;
  if (bbox) {
    const [w, s, e, n] = bbox;
    if (!(w < e && s < n)) fail(f, 'bbox mal ordonnée, attendu [ouest, sud, est, nord]');
    if (lat < s || lat > n || lng < w || lng > e) warn(f, 'le point ne tombe pas dans sa propre bbox');
  }

  // règles éditoriales
  const textFields = [
    doc.editorial?.lede, doc.editorial?.why_here, doc.editorial?.presentation,
    doc.editorial?.geology, doc.editorial?.dynamics, doc.editorial?.biodiversity_text,
    doc.editorial?.in_motion, doc.conservation?.state, doc.conservation?.message
  ].filter(Boolean);
  for (const t of textFields) {
    if (/—|--/.test(t)) fail(f, 'tiret cadratin ou double tiret interdit dans les textes éditoriaux');
  }
  const banned = /\b(vierge|intouché|intouchée|inexploré[e]?\s+par\s+l.homme)\b/i;
  for (const t of textFields) {
    if (banned.test(t)) warn(f, 'vocabulaire de nature « vierge » à revoir, voir charte section 4');
  }

  // conservation et sécurité
  if (doc.conservation?.understand_without_going && !doc.visit?.no_route_guidance) {
    fail(f, 'un site en « comprendre sans y aller » doit avoir visit.no_route_guidance = true');
  }
  if (doc.conservation?.fragility === 'critique' && doc.location?.coordinate_precision === 'site') {
    warn(f, 'fragilité critique avec coordonnées précises : vérifier que la publication ne nuit pas au site');
  }

  // statut éditorial
  if (doc.collection === 'hundred' && doc.status !== 'ready') {
    warn(f, `statut "${doc.status}" : un site des 100 doit atteindre "ready" avant publication`);
  }
  if ((doc.sources ?? []).length < 2) warn(f, 'moins de deux sources');
  const weakSourceHosts = /(?:^|\.)(?:wikipedia\.org|britannica\.com|worldatlas\.com)$/i;
  for (const source of doc.sources ?? []) {
    let host = '';
    try { host = new URL(source.url).hostname; } catch { fail(f, `URL de source invalide : ${source.url}`); }
    if (weakSourceHosts.test(host)) fail(f, `source encyclopédique non admise pour le fact-checking : ${host}`);
  }
  const strongSources = (doc.sources ?? []).filter(source => ['officiel', 'scientifique', 'jeu-de-donnees'].includes(source.type));
  if (!strongSources.length) fail(f, 'aucune source officielle, scientifique ou donnée primaire');
  if (!doc.editorial?.geology) warn(f, 'section géologie absente');
}

// unicité
const seenId = new Map();
for (const { file, doc } of places) {
  if (seenId.has(doc.id)) fail(file, `id dupliqué avec ${seenId.get(doc.id)}`);
  seenId.set(doc.id, file);
}
const seenCoord = new Map();
for (const { file, doc } of places) {
  const key = `${doc.location?.lat?.toFixed(2)},${doc.location?.lng?.toFixed(2)}`;
  if (seenCoord.has(key)) warn(file, `coordonnées quasi identiques à ${seenCoord.get(key)}`);
  seenCoord.set(key, file);
}

// comptage et quotas
const hundred = places.filter(p => (p.doc.collection ?? 'hundred') === 'hundred');
const reserve = places.filter(p => p.doc.collection === 'reserve');

// Tant que le corpus est en cours de constitution, les règles de cardinalité et
// de quotas sont signalées mais ne bloquent pas le build. Elles redeviennent
// bloquantes dès que la collection publique atteint 100 lieux, ou si la variable
// d'environnement STRICT_QUOTAS vaut 1.
const COMPLETE = hundred.length >= 100 || process.env.STRICT_QUOTAS === '1';
const quota = (file, msg) => (COMPLETE ? fail(file, msg) : warn(file, msg));

if (hundred.length !== 100) quota('collection', `la collection publique compte ${hundred.length} lieux au lieu de 100`);
if (reserve.length < 20) warn('collection', `seulement ${reserve.length} réservistes`);

const byRegion = {};
const byCountry = {};
const byFamily = {};
for (const { doc } of hundred) {
  byRegion[doc.location.region] = (byRegion[doc.location.region] ?? 0) + 1;
  for (const c of doc.location.countries) byCountry[c] = (byCountry[c] ?? 0) + 1;
  byFamily[doc.landscape.family] = (byFamily[doc.landscape.family] ?? 0) + 1;
}
for (const r of tax.regions) {
  const n = byRegion[r.id] ?? 0;
  if (n < r.quota[0] || n > r.quota[1]) quota('quotas', `${r.label} : ${n} sites, quota ${r.quota[0]} à ${r.quota[1]}`);
}
const bigCountries = new Set(['CN', 'US', 'BR', 'AU', 'RU', 'CA', 'ID']);
for (const [c, n] of Object.entries(byCountry)) {
  const cap = bigCountries.has(c) ? 6 : 5;
  if (n > cap) quota('quotas', `pays ${c} : ${n} sites, plafond ${cap}`);
}
for (const [fam, n] of Object.entries(byFamily)) {
  if (n > 18) quota('quotas', `famille ${fam} : ${n} sites, plafond 18`);
}
const essentials = hundred.filter(p => p.doc.editorial.essential).length;
if (essentials !== 20) warn('collection', `${essentials} incontournables au lieu de 20`);

// milieux minimaux
const has = (doc, ...t) => t.some(x => doc.landscape.types.includes(x));
const counts = {
  'marins ou côtiers': hundred.filter(p => has(p.doc, 'atoll', 'ocean', 'ile', 'falaise', 'fjord', 'mangrove')).length,
  'eau douce': hundred.filter(p => has(p.doc, 'lac', 'cascade', 'fleuve', 'zone-humide')).length,
  'souterrains': hundred.filter(p => has(p.doc, 'grotte')).length,
  'forestiers': hundred.filter(p => has(p.doc, 'foret-temperee', 'foret-tropicale', 'foret-nuageuse', 'foret-boreale', 'mangrove')).length
};
const minima = { 'marins ou côtiers': 12, 'eau douce': 8, souterrains: 4, forestiers: 10 };
for (const [k, min] of Object.entries(minima)) {
  if (counts[k] < min) quota('quotas', `milieux ${k} : ${counts[k]} sites, minimum ${min}`);
}

// médias
const manifestPath = path.join(ROOT, 'data/media/manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = read('data/media/manifest.json');
  if (!validateMedia(manifest)) {
    for (const e of validateMedia.errors) fail('manifest.json', `schéma ${e.instancePath || '/'} ${e.message}`);
  }
  const mediaIds = new Set(manifest.items.map(i => i.id));
  const placeIds = new Set(places.map(p => p.doc.id));
  for (const item of manifest.items) {
    if (!placeIds.has(item.place)) fail('manifest.json', `média ${item.id} rattaché à un lieu inconnu : ${item.place}`);
    if (!item.license) fail('manifest.json', `média ${item.id} sans licence`);
    if (!item.author || !item.source_page || !item.license_url) fail('manifest.json', `crédit incomplet pour ${item.id}`);
    const ratio = item.width / item.height;
    if (Math.abs(ratio - 1.5) > 0.02) warn('manifest.json', `${item.id} : ratio ${ratio.toFixed(3)} au lieu de 3:2`);
  }
  for (const { file, doc } of places) {
    for (const m of [doc.media?.hero, ...(doc.media?.gallery ?? [])].filter(Boolean)) {
      if (!mediaIds.has(m)) fail(file, `média référencé absent du manifeste : ${m}`);
    }
  }
} else {
  warn('manifest.json', 'manifeste des médias absent');
}

// rapport
const line = '-'.repeat(64);
console.log(line);
console.log(`Lieux analysés : ${places.length}  (100 publics : ${hundred.length}, réserve : ${reserve.length})`);
console.log('Répartition par région :', byRegion);
console.log('Répartition par famille :', byFamily);
console.log('Milieux :', counts);
console.log(COMPLETE ? 'Contrôle des quotas : BLOQUANT (corpus complet)' : `Contrôle des quotas : indicatif, corpus en cours (${hundred.length}/100)`);
console.log(line);
if (warnings.length) {
  console.log(`\n${warnings.length} avertissement(s) :`);
  for (const w of warnings) console.log('  ~ ' + w);
}
if (errors.length) {
  console.log(`\n${errors.length} erreur(s) :`);
  for (const e of errors) console.log('  x ' + e);
  process.exit(1);
}
console.log('\nValidation réussie.');
