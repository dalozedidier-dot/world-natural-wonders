import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');

test('les documents de méthode existent et sont non vides', () => {
  for (const f of ['docs/charte-selection.md', 'docs/grille-scoring.md']) {
    const p = path.join(ROOT, f);
    assert.ok(fs.existsSync(p), `${f} manquant`);
    assert.ok(fs.readFileSync(p, 'utf8').length > 500, `${f} trop court`);
  }
});

test('les vocabulaires contrôlés sont cohérents', () => {
  const tax = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/schema/taxonomies.json'), 'utf8'));
  const families = new Set(tax.families.map(f => f.id));
  for (const l of tax.landscapes) assert.ok(families.has(l.family), `famille inconnue pour ${l.id}`);
  const total = tax.regions.reduce((n, r) => n + r.quota[0], 0);
  assert.ok(total <= 100, 'la somme des quotas minimaux dépasse 100');
  assert.ok(tax.regions.reduce((n, r) => n + r.quota[1], 0) >= 100, 'la somme des quotas maximaux est inférieure à 100');
});
