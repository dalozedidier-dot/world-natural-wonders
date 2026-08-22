import { Map as MlMap, NavigationControl, ScaleControl, type GeoJSONSource, type LngLatBoundsLike } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { darkStyle, addTerrain } from './basemap';
import { readState, writeState, asArray } from './urlstate';
import { read as readLists, toggle as toggleList } from './store';

interface Lite {
  id: string; name: string; country: string; region: string; family: string;
  types: string[]; badges: string[]; essential: boolean; lat: number; lng: number;
  bbox?: [number, number, number, number] | null; months: number[]; access: string;
  fragility: string; collections: string[]; lede: string; hints: string[];
  hero?: string | null; alt?: string | null; elevation?: number | null; search: string;
}

const root = document.getElementById('explorer');
if (root) init(root);

async function init(root: HTMLElement) {
  const BASE = (root.dataset.base || '').replace(/\/$/, '');
  const places: Lite[] = JSON.parse(document.getElementById('places-data')!.textContent!);
  const colors: Record<string, string> = JSON.parse(document.getElementById('family-colors')!.textContent!);
  const byId = new Map(places.map(p => [p.id, p]));

  const listEl = root.querySelector<HTMLElement>('[data-results]')!;
  const countEl = root.querySelector<HTMLElement>('[data-count]')!;
  const searchEl = root.querySelector<HTMLInputElement>('[data-search]')!;
  const panel = document.getElementById('panel')!;
  const panelBody = panel.querySelector<HTMLElement>('.panel-body')!;
  const scrim = document.getElementById('scrim')!;

  const state = readState();
  const filters = {
    region: asArray(state.region),
    family: asArray(state.family),
    type: asArray(state.type),
    collection: asArray(state.collection),
    access: asArray(state.access),
    month: asArray(state.month),
    essential: state.essential === '1',
    favorites: state.fav === '1',
    q: (state.q as string) || ''
  };
  searchEl.value = filters.q;

  // ---- carte ----
  const map = new MlMap({
    container: root.querySelector<HTMLElement>('#map')!,
    style: await darkStyle(),
    center: [12, 18],
    zoom: 1.35,
    minZoom: 0.6,
    maxZoom: 13,
    attributionControl: { compact: true },
    hash: false
  });
  map.addControl(new NavigationControl({ showCompass: false }), 'bottom-right');
  map.addControl(new ScaleControl({ maxWidth: 90, unit: 'metric' }), 'bottom-left');

  map.on('load', () => {
    addTerrain(map);
    map.addSource('places', {
      type: 'geojson',
      data: toGeoJSON(places),
      cluster: true,
      clusterMaxZoom: 4,
      clusterRadius: 46
    });
    map.addLayer({
      id: 'clusters', type: 'circle', source: 'places', filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#f2efe8',
        'circle-opacity': 0.92,
        'circle-radius': ['step', ['get', 'point_count'], 15, 5, 19, 12, 24, 25, 30],
        'circle-stroke-width': 2,
        'circle-stroke-color': 'rgba(7,16,15,.55)'
      }
    });
    map.addLayer({
      id: 'cluster-count', type: 'symbol', source: 'places', filter: ['has', 'point_count'],
      layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-font': ['Noto Sans Medium'], 'text-size': 12 },
      paint: { 'text-color': '#0d1413' }
    });
    map.addLayer({
      id: 'points', type: 'circle', source: 'places', filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': ['get', 'color'],
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 1, ['case', ['get', 'essential'], 5.5, 4], 8, ['case', ['get', 'essential'], 11, 8]],
        'circle-stroke-width': ['case', ['get', 'essential'], 2, 1.4],
        'circle-stroke-color': 'rgba(242,239,232,.9)'
      }
    });
    map.addLayer({
      id: 'points-halo', type: 'circle', source: 'places',
      filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'id'], '']],
      paint: { 'circle-color': 'transparent', 'circle-radius': 16, 'circle-stroke-width': 2, 'circle-stroke-color': '#e0ab68' }
    });

    for (const layer of ['points', 'clusters']) {
      map.on('mouseenter', layer, () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', layer, () => (map.getCanvas().style.cursor = ''));
    }
    map.on('click', 'points', e => {
      const id = e.features?.[0]?.properties?.id as string;
      if (id) select(id, true);
    });
    map.on('click', 'clusters', async e => {
      const f = e.features?.[0];
      if (!f) return;
      const src = map.getSource('places') as GeoJSONSource;
      const zoom = await src.getClusterExpansionZoom(f.properties!.cluster_id as number);
      map.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom, duration: 700 });
    });

    apply();
    if (state.lieu) select(state.lieu as string, true);
  });

  // ---- filtres ----
  root.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach(btn => {
    const kind = btn.dataset.filter as keyof typeof filters;
    const value = btn.dataset.value || '';
    const sync = () => {
      const arr = filters[kind];
      const on = Array.isArray(arr) ? (value ? arr.includes(value) : arr.length === 0) : Boolean(arr);
      btn.setAttribute('aria-pressed', String(on));
    };
    btn.addEventListener('click', () => {
      const cur = filters[kind];
      if (typeof cur === 'boolean') {
        (filters as any)[kind] = !cur;
      } else if (!value) {
        (filters as any)[kind] = [];
      } else {
        const arr = cur as string[];
        const i = arr.indexOf(value);
        if (i >= 0) arr.splice(i, 1); else arr.push(value);
      }
      apply();
    });
    document.addEventListener('wnw:filters', sync);
    sync();
  });

  let debounce = 0;
  searchEl.addEventListener('input', () => {
    window.clearTimeout(debounce);
    debounce = window.setTimeout(() => { filters.q = searchEl.value.trim(); apply(); }, 160);
  });
  root.querySelector('[data-clear]')?.addEventListener('click', () => {
    filters.region = []; filters.family = []; filters.type = []; filters.collection = [];
    filters.access = []; filters.month = []; filters.essential = false; filters.favorites = false;
    filters.q = ''; searchEl.value = ''; apply();
  });
  root.querySelector('[data-world]')?.addEventListener('click', () =>
    map.easeTo({ center: [12, 18], zoom: 1.35, duration: 900 }));
  root.querySelector('[data-random]')?.addEventListener('click', () => {
    const pool = current.length ? current : places;
    select(pool[Math.floor(Math.random() * pool.length)].id, true);
  });

  let current: Lite[] = places;

  function matches(p: Lite): boolean {
    const f = filters;
    if (f.region.length && !f.region.includes(p.region)) return false;
    if (f.family.length && !f.family.includes(p.family)) return false;
    if (f.type.length && !f.type.some(t => p.types.includes(t))) return false;
    if (f.collection.length && !f.collection.some(c => p.collections.includes(c))) return false;
    if (f.access.length && !f.access.includes(p.access)) return false;
    if (f.month.length && !f.month.some(m => p.months.includes(Number(m)))) return false;
    if (f.essential && !p.essential) return false;
    if (f.favorites && !readLists().favorites.includes(p.id)) return false;
    if (f.q && !p.search.includes(f.q.toLowerCase())) return false;
    return true;
  }

  function apply() {
    current = places.filter(matches);
    const src = map.getSource('places') as GeoJSONSource | undefined;
    src?.setData(toGeoJSON(current));
    renderList(current);
    countEl.textContent = current.length === 1 ? '1 lieu' : `${current.length} lieux`;
    writeState({
      region: filters.region, family: filters.family, type: filters.type,
      collection: filters.collection, access: filters.access, month: filters.month,
      essential: filters.essential ? '1' : undefined,
      fav: filters.favorites ? '1' : undefined,
      q: filters.q || undefined,
      lieu: (readState().lieu as string) || undefined
    });
    document.dispatchEvent(new Event('wnw:filters'));
    updateActive();
  }

  const activeEl = root.querySelector<HTMLElement>('[data-active-filters]');
  const clearBtn = root.querySelector<HTMLElement>('[data-clear-btn]');
  const refine = root.querySelector<HTMLDetailsElement>('details.refine');

  function updateActive() {
    if (!activeEl) return;
    const tags: string[] = [];
    root.querySelectorAll<HTMLButtonElement>('[data-filter][data-value]').forEach(b => {
      if (b.dataset.value && b.getAttribute('aria-pressed') === 'true') {
        tags.push((b.textContent || '').trim());
      }
    });
    if (filters.essential) tags.push('Incontournables');
    if (filters.favorites) tags.push('Favoris');
    if (filters.q) tags.push(`« ${filters.q} »`);
    activeEl.innerHTML = tags.length
      ? tags.map(t => `<span class="tag">${esc(t)}</span>`).join(' ')
      : '<span class="muted">Aucun filtre actif</span>';
    if (clearBtn) clearBtn.hidden = tags.length === 0;
    // ouvre le panneau Affiner si un filtre avancé y est actif
    if (refine && !refine.open) {
      const deep = filters.type.length || filters.collection.length || filters.access.length || filters.month.length;
      if (deep) refine.open = true;
    }
  }

  function renderList(items: Lite[]) {
    if (!items.length) {
      listEl.innerHTML = `<p class="muted" style="padding:1.4rem 1rem">Aucun lieu ne correspond. Retirez un filtre ou lancez « Surprends-moi ».</p>`;
      return;
    }
    listEl.innerHTML = items.map(p => `
      <button class="result" data-open="${p.id}" type="button">
        <span class="thumb">${p.hero ? `<img src="${src(p.hero, BASE)}" alt="" loading="lazy" decoding="async">` : ''}<span class="fam" style="background:${colors[p.family] || '#888'}"></span></span>
        <span>
          <h3>${esc(p.name)}${p.essential ? ' <span aria-label="incontournable">✦</span>' : ''}</h3>
          <p>${esc(p.country)}</p>
        </span>
      </button>`).join('');
    listEl.querySelectorAll<HTMLButtonElement>('[data-open]').forEach(b =>
      b.addEventListener('click', () => select(b.dataset.open!, true)));
  }

  // ---- panneau ----
  let openId: string | null = null;
  async function select(id: string, fly = false) {
    const p = byId.get(id);
    if (!p) return;
    openId = id;
    map.setFilter('points-halo', ['all', ['!', ['has', 'point_count']], ['==', ['get', 'id'], id]]);
    listEl.querySelectorAll('[data-open]').forEach(el =>
      el.setAttribute('aria-current', String((el as HTMLElement).dataset.open === id)));
    if (fly) {
      if (p.bbox) map.fitBounds(p.bbox as LngLatBoundsLike, { padding: 90, duration: 1100, maxZoom: 10 });
      else map.flyTo({ center: [p.lng, p.lat], zoom: 7.2, duration: 1100, essential: true });
    }
    writeState({ ...readState(), lieu: id });
    panel.classList.add('is-open'); scrim.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    panelBody.innerHTML = `<div style="padding:2rem" class="muted">Chargement…</div>`;
    try {
      const res = await fetch(`${BASE}/donnees/lieux/${id}.json`);
      panelBody.innerHTML = renderSheet(await res.json(), BASE);
      wireSheet(panelBody, id);
      panelBody.scrollTop = 0;
    } catch {
      panelBody.innerHTML = `<div style="padding:2rem" class="muted">Fiche indisponible. <a href="${BASE}/lieux/${id}">Ouvrir la page complète</a>.</div>`;
    }
  }

  function close() {
    panel.classList.remove('is-open'); scrim.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    map.setFilter('points-halo', ['all', ['!', ['has', 'point_count']], ['==', ['get', 'id'], '']]);
    const s = readState(); delete s.lieu; writeState(s);
    openId = null;
  }
  panel.querySelector('.panel-close')?.addEventListener('click', close);
  scrim.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && openId) close(); });

  function wireSheet(scope: HTMLElement, id: string) {
    scope.querySelectorAll<HTMLButtonElement>('[data-list]').forEach(btn => {
      const list = btn.dataset.list as 'favorites' | 'seen' | 'someday';
      const sync = () => btn.setAttribute('aria-pressed', String(readLists()[list].includes(id)));
      btn.addEventListener('click', () => { toggleList(list, id); sync(); });
      sync();
    });
  }
}

function toGeoJSON(items: Lite[]): GeoJSON.FeatureCollection {
  const colors: Record<string, string> = JSON.parse(document.getElementById('family-colors')!.textContent!);
  return {
    type: 'FeatureCollection',
    features: items.map(p => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      properties: { id: p.id, name: p.name, color: colors[p.family] || '#c98a3f', essential: p.essential }
    }))
  };
}

const src = (u: string | null | undefined, base: string) => (!u ? '' : u.startsWith('data:') ? u : base + u);
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const para = (t?: string) => (t ? t.split('\n\n').map(x => `<p>${esc(x)}</p>`).join('') : '');
const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

function renderSheet(p: any, BASE: string): string {
  const hero = p.__hero;
  const months = Array.from({ length: 12 }, (_, i) =>
    `<span class="${p.seasonality.best_months.includes(i + 1) ? 'on' : ''}">${MONTHS[i]}</span>`).join('');
  const figures = (p.figures ?? []).slice(0, 6).map((f: any) =>
    `<div class="fact"><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join('');
  const threats = (p.conservation.threats ?? []).map((t: any) =>
    `<div class="threat"><span class="lvl lvl-${t.level}">${t.level}</span><span><strong>${esc(p.__threatLabels[t.type] ?? t.type)}</strong>${t.note ? ` ${esc(t.note)}` : ''}</span></div>`).join('');
  const sources = (p.sources ?? []).map((s: any) =>
    `<li><a href="${s.url}" target="_blank" rel="noopener">${esc(s.title)}</a>${s.publisher ? ` <span class="muted">${esc(s.publisher)}</span>` : ''}</li>`).join('');

  return `
  <div class="sheet-hero">
    ${hero ? `<img src="${src(hero.src, BASE)}" alt="${esc(hero.alt || '')}">` : ''}
    ${hero && !hero.generated ? `<p class="credit">${esc(hero.author)} · <a href="${hero.source_page}" target="_blank" rel="noopener">${esc(hero.license)} ${esc(hero.license_version)}</a></p>` : ''}
  </div>
  <div class="sheet-inner">
    <p class="sheet-kicker">${esc(p.location.country_labels.join(' et '))}${p.location.subdivision ? ' · ' + esc(p.location.subdivision) : ''}</p>
    <h2>${esc(p.identity.name_fr)}</h2>
    ${p.identity.name_local?.length ? `<p class="muted" style="margin-top:-.6rem">${p.identity.name_local.map((n: any) => esc(n.value)).join(' · ')}</p>` : ''}
    <div class="chiprow">${(p.editorial.badges ?? []).map((b: string) => `<span class="badge">${esc(p.__badgeLabels[b] ?? b)}</span>`).join('')}</div>
    <p class="lead">${esc(p.editorial.lede)}</p>
    <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin:1rem 0 .4rem">
      <button class="btn" data-list="favorites" aria-pressed="false">♡ Favori</button>
      <button class="btn" data-list="seen" aria-pressed="false">✓ Déjà vu</button>
      <button class="btn" data-list="someday" aria-pressed="false">◷ Un jour</button>
      <a class="btn btn--accent" href="${BASE}/lieux/${p.id}">Fiche complète</a>
    </div>
    <dl class="factgrid">${figures}</dl>
    <h3 style="font-size:.7rem;letter-spacing:.16em;text-transform:uppercase;font-family:var(--sans);color:var(--paper-mute)">Meilleure période</h3>
    <div class="months">${months}</div>
    ${p.conservation.understand_without_going ? `<div class="callout callout--alert"><strong>Comprendre ce lieu sans nécessairement y aller.</strong> ${esc(p.conservation.message ?? '')}</div>` : ''}
    <details class="section" open><summary>Pourquoi ce lieu</summary><div class="body">${para(p.editorial.why_here)}</div></details>
    <details class="section"><summary>Présentation</summary><div class="body">${para(p.editorial.presentation)}</div></details>
    ${p.editorial.geology ? `<details class="section"><summary>Histoire géologique</summary><div class="body">${para(p.editorial.geology)}</div></details>` : ''}
    ${p.editorial.dynamics ? `<details class="section"><summary>Comment cela fonctionne aujourd'hui</summary><div class="body">${para(p.editorial.dynamics)}</div></details>` : ''}
    ${p.editorial.biodiversity_text ? `<details class="section"><summary>Le vivant</summary><div class="body">${para(p.editorial.biodiversity_text)}</div></details>` : ''}
    <details class="section"><summary>Conservation et fragilité</summary><div class="body">${para(p.conservation.state)}${threats}</div></details>
    <details class="section"><summary>Sources et vérification</summary><div class="body"><ul>${sources}</ul><p class="muted">Dernière vérification : ${esc(p.last_verified)} · statut éditorial : ${esc(p.status)}</p></div></details>
  </div>`;
}
