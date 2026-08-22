#!/usr/bin/env node
/** Contrôle des liens externes des fiches. Signale, n'échoue pas le build par défaut. */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const dir = path.join(ROOT, 'data/places');
const strict = process.argv.includes('--strict');
const urls = new Map();

for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
  const p = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const add = (u) => { if (u) urls.set(u, (urls.get(u) ?? new Set()).add(f)); };
  for (const s of p.sources ?? []) add(s.url);
  for (const d of p.protection?.designations ?? []) add(d.url);
  add(p.protection?.managing_body?.url);
  add(p.visit?.official_url);
}

let bad = 0;
const list = [...urls.keys()];
console.log(`${list.length} URL uniques à contrôler.`);
for (let i = 0; i < list.length; i += 6) {
  await Promise.all(list.slice(i, i + 6).map(async u => {
    try {
      const ctrl = AbortSignal.timeout(12000);
      let r = await fetch(u, { method: 'HEAD', redirect: 'follow', signal: ctrl });
      if (r.status === 405 || r.status === 403) r = await fetch(u, { method: 'GET', redirect: 'follow', signal: ctrl });
      if (!r.ok) { bad++; console.log(`  x ${r.status} ${u}  [${[...urls.get(u)].join(', ')}]`); }
    } catch (e) {
      bad++; console.log(`  x ${e.name} ${u}  [${[...urls.get(u)].join(', ')}]`);
    }
  }));
}
console.log(bad ? `${bad} lien(s) en échec.` : 'Tous les liens répondent.');
if (bad && strict) process.exit(1);
