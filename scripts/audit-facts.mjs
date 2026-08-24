#!/usr/bin/env node
/**
 * Audit de provenance factuelle du corpus.
 *
 * Ce script ne prétend pas vérifier la vérité d'une affirmation. Il construit
 * une file de relecture en signalant les affirmations qui exigent une source
 * explicite et la qualité minimale du dossier documentaire de chaque lieu.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const placesDir = path.join(ROOT, 'data', 'places');
const files = fs.readdirSync(placesDir).filter(file => file.endsWith('.json')).sort();

const OFFICIAL_HOSTS = [
  'unesco.org', 'iucn.org', 'ramsar.org', 'nasa.gov', 'noaa.gov', 'usgs.gov',
  'gov.', 'gc.ca', 'canada.ca', 'parksaustralia.gov.au', 'doc.govt.nz',
  'antarctica.gov.au', 'bas.ac.uk', 'si.edu', 'gbif.org', 'birdlife.org'
];
const WEAK_HOSTS = [
  'wikipedia.org', 'britannica.com', 'tripadvisor.', 'lonelyplanet.',
  'nationalgeographic.com', 'worldatlas.com'
];
const RISK_PATTERNS = [
  ['nombre ou mesure', /\b\d+(?:[.,]\d+)?\s*(?:m|km|km²|ha|cm|mm|°c|ans?|années?|millions?|milliards?|heures?|minutes?|espèces?)\b/i],
  ['record ou superlatif', /\b(?:plus (?:grand|grande|haut|haute|long|longue|profond|profonde|ancien|ancienne|vaste|important|importante)|record|unique au monde|sans équivalent|premier|première)\b/i],
  ['affirmation absolue', /\b(?:toujours|jamais|aucun|aucune|seul|seule|exclusivement|entièrement)\b/i],
  ['datation', /\b(?:jurassique|crétacé|carbonifère|précambrien|quaternaire|miocène|pliocène|pléistocène|holocène)\b/i],
  ['conservation ou tendance', /\b(?:extinction|menacé|menacée|déclin|dégradation|réchauffement|niveau marin|braconnage)\b/i]
];

const editorialFields = [
  'lede', 'why_here', 'presentation', 'geology', 'dynamics',
  'biodiversity_text', 'in_motion'
];

const hostname = value => {
  try { return new URL(value).hostname.toLowerCase(); } catch { return ''; }
};
const sourceStrength = source => {
  const host = hostname(source.url);
  if (WEAK_HOSTS.some(token => host.includes(token))) return 'faible';
  if (source.type === 'officiel' || source.type === 'scientifique' || OFFICIAL_HOSTS.some(token => host.includes(token))) return 'forte';
  return 'secondaire';
};
const sentences = text => String(text ?? '')
  .replace(/\n+/g, ' ')
  .split(/(?<=[.!?])\s+/)
  .map(value => value.trim())
  .filter(Boolean);

const rows = [];
const riskyClaims = [];
const sourceHosts = new Map();
for (const file of files) {
  const doc = JSON.parse(fs.readFileSync(path.join(placesDir, file), 'utf8'));
  const strengths = (doc.sources ?? []).map(sourceStrength);
  const strong = strengths.filter(value => value === 'forte').length;
  const weak = strengths.filter(value => value === 'faible').length;
  for (const source of doc.sources ?? []) {
    const host = hostname(source.url) || '(URL invalide)';
    sourceHosts.set(host, (sourceHosts.get(host) ?? 0) + 1);
  }
  for (const field of editorialFields) {
    for (const sentence of sentences(doc.editorial?.[field])) {
      const risks = RISK_PATTERNS.filter(([, pattern]) => pattern.test(sentence)).map(([label]) => label);
      if (risks.length) riskyClaims.push({ id: doc.id, field, risks, sentence });
    }
  }
  for (const figure of doc.figures ?? []) {
    riskyClaims.push({ id: doc.id, field: 'figures', risks: ['chiffre mis en avant'], sentence: `${figure.label} : ${figure.value}` });
  }
  rows.push({ id: doc.id, status: doc.status, sources: strengths.length, strong, weak });
}

const withoutStrong = rows.filter(row => row.strong === 0);
const withWeak = rows.filter(row => row.weak > 0);
const factChecked = rows.filter(row => row.status === 'fact_checked').length;

console.log('AUDIT ANTI-INVENTION');
console.log('='.repeat(72));
console.log(`Fiches : ${rows.length}`);
console.log(`Statut fact_checked : ${factChecked}`);
console.log(`Affirmations à risque à vérifier manuellement : ${riskyClaims.length}`);
console.log(`Fiches sans source forte/officielle détectée : ${withoutStrong.length}`);
console.log(`Fiches utilisant au moins une source faible : ${withWeak.length}`);

if (withoutStrong.length) {
  console.log('\nFICHES SANS SOURCE FORTE');
  for (const row of withoutStrong) console.log(`- ${row.id} (${row.sources} source(s))`);
}
if (withWeak.length) {
  console.log('\nFICHES AVEC SOURCE FAIBLE');
  for (const row of withWeak) console.log(`- ${row.id} (${row.weak}/${row.sources})`);
}

console.log('\nDOMAINES LES PLUS UTILISÉS');
for (const [host, count] of [...sourceHosts].sort((a, b) => b[1] - a[1]).slice(0, 20)) {
  console.log(`- ${host}: ${count}`);
}

console.log('\nEXTRAIT DE LA FILE DE VÉRIFICATION (40 premières)');
for (const claim of riskyClaims.slice(0, 40)) {
  console.log(`- ${claim.id} · ${claim.field} · ${claim.risks.join(', ')}`);
  console.log(`  ${claim.sentence}`);
}

// Sortie non bloquante : ce diagnostic sert à organiser la relecture humaine.
// La CI ne doit devenir bloquante qu'après ajout d'une traçabilité par affirmation.
if (process.argv.includes('--strict') && (withoutStrong.length || withWeak.length)) {
  process.exitCode = 1;
}
