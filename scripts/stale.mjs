#!/usr/bin/env node
/** Signale les fiches dont la dernière vérification remonte à plus de 18 mois. */
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(import.meta.dirname, '..');
const dir = path.join(ROOT, 'data/places');
const limit = Date.now() - 18 * 30 * 24 * 3600 * 1000;
let n = 0;
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
  const p = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  if (Date.parse(p.last_verified) < limit) { n++; console.log(`  ~ ${p.id} vérifié le ${p.last_verified}`); }
}
console.log(n ? `${n} fiche(s) à revérifier.` : 'Toutes les fiches ont été vérifiées récemment.');
