import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const dir = path.join(ROOT, 'data/places');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
const places = files.map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));

test('chaque fiche a un identifiant conforme au nom de fichier', () => {
  for (const f of files) {
    const doc = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    assert.equal(doc.id, path.basename(f, '.json'));
  }
});

test('les coordonnées sont plausibles', () => {
  for (const p of places) {
    assert.ok(p.location.lat >= -90 && p.location.lat <= 90, `${p.id} latitude`);
    assert.ok(p.location.lng >= -180 && p.location.lng <= 180, `${p.id} longitude`);
    assert.ok(!(Math.abs(p.location.lat) < 0.5 && Math.abs(p.location.lng) < 0.5), `${p.id} proche de 0,0`);
  }
});

test('aucun tiret cadratin dans les textes éditoriaux', () => {
  for (const p of places) {
    const texts = Object.values(p.editorial).filter(v => typeof v === 'string');
    for (const t of texts) assert.ok(!/—|–/.test(t), `${p.id} contient un tiret cadratin`);
  }
});

test('les meilleurs mois sont valides et non vides', () => {
  for (const p of places) {
    assert.ok(p.seasonality.best_months.length > 0, `${p.id} sans mois`);
    for (const m of p.seasonality.best_months) assert.ok(m >= 1 && m <= 12, `${p.id} mois ${m}`);
  }
});

test('un site en « comprendre sans y aller » ne publie pas d itinéraire', () => {
  for (const p of places) {
    if (p.conservation.understand_without_going) {
      assert.equal(p.visit.no_route_guidance, true, `${p.id}`);
    }
  }
});

test('chaque fiche cite au moins une source avec une URL absolue', () => {
  for (const p of places) {
    assert.ok(p.sources.length >= 1, `${p.id} sans source`);
    for (const s of p.sources) assert.match(s.url, /^https?:\/\//, `${p.id} source ${s.title}`);
  }
});

test('les indices du mode devinette ne nomment pas le lieu', () => {
  for (const p of places) {
    const name = p.identity.name_fr.toLowerCase();
    for (const h of p.editorial.guess_hints ?? []) {
      assert.ok(!h.toLowerCase().includes(name), `${p.id} indice trop explicite`);
    }
  }
});
