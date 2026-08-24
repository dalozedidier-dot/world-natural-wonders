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

let broken = 0;
let inconclusive = 0;
const list = [...urls.keys()];
console.log(`${list.length} URL uniques à contrôler.`);
for (let i = 0; i < list.length; i += 6) {
  await Promise.all(list.slice(i, i + 6).map(async u => {
    const origins = `[${[...urls.get(u)].join(', ')}]`;
    try {
      const options = {
        redirect: 'follow',
        signal: AbortSignal.timeout(15000),
        headers: {
          'user-agent': 'WorldNaturalWonders-LinkChecker/1.0 (+https://world-natural-wonders.be/)',
          accept: 'text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8',
        },
      };
      let r = await fetch(u, { ...options, method: 'HEAD' });

      // Un HEAD peut être refusé ou mal implémenté alors que la page existe.
      if (!r.ok) r = await fetch(u, { ...options, method: 'GET' });

      if (r.status === 404 || r.status === 410) {
        broken++;
        console.log(`  x ${r.status} ${u}  ${origins}`);
      } else if (!r.ok) {
        inconclusive++;
        console.log(`  ? ${r.status} ${u}  ${origins}`);
      }
    } catch (e) {
      inconclusive++;
      console.log(`  ? ${e.name} ${u}  ${origins}`);
    }
  }));
}
console.log(`${broken} lien(s) réellement cassé(s), ${inconclusive} contrôle(s) non concluant(s).`);
if (broken && strict) process.exit(1);
