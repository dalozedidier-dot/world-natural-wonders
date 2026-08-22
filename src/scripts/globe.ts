import { Map as MlMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { darkStyle } from './basemap';

const el = document.getElementById('globe');
if (el) start(el);

async function start(el: HTMLElement) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const points: { id: string; lat: number; lng: number; color: string; essential: boolean }[] =
    JSON.parse(document.getElementById('globe-points')!.textContent!);
  const BASE = (el.dataset.base || '').replace(/\/$/, '');

  let style;
  try {
    style = await darkStyle();
  } catch {
    return; // pas de fond de carte joignable : la scène dessinée reste seule
  }
  const map = new MlMap({
    container: el,
    style,
    center: [8, 22],
    zoom: 1.1,
    interactive: !reduce,
    attributionControl: false,
    dragRotate: false,
    pitchWithRotate: false
  });
  // Projection globe : disponible nativement dans MapLibre GL JS.
  let painted = false;
  map.on('error', () => { if (!painted) el.innerHTML = ''; });
  map.on('idle', () => { painted = true; });
  map.on('style.load', () => {
    try { map.setProjection({ type: 'globe' }); } catch { /* repli mercator */ }
    map.setSky?.({
      'sky-color': '#0a1a2a', 'sky-horizon-blend': 0.55,
      'horizon-color': '#123', 'horizon-fog-blend': 0.6,
      'fog-color': '#07100f', 'fog-ground-blend': 0.75
    });
    map.addSource('pts', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: points.map(p => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
          properties: { id: p.id, color: p.color, essential: p.essential }
        }))
      }
    });
    map.addLayer({
      id: 'glow', type: 'circle', source: 'pts',
      paint: {
        'circle-color': ['get', 'color'], 'circle-opacity': 0.22,
        'circle-radius': ['case', ['get', 'essential'], 13, 9], 'circle-blur': 1
      }
    });
    map.addLayer({
      id: 'pins', type: 'circle', source: 'pts',
      paint: {
        'circle-color': ['get', 'color'],
        'circle-radius': ['case', ['get', 'essential'], 4.2, 2.8],
        'circle-stroke-width': 1, 'circle-stroke-color': 'rgba(242,239,232,.85)'
      }
    });
    if (!reduce) spin();
  });

  let paused = false;
  ['mousedown', 'touchstart', 'wheel'].forEach(ev => el.addEventListener(ev, () => (paused = true), { passive: true }));

  function spin() {
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(now - last, 60); last = now;
      if (!paused && !document.hidden) {
        const c = map.getCenter();
        map.jumpTo({ center: [c.lng + 0.0035 * dt, c.lat] });
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  map.on('click', 'pins', e => {
    const id = e.features?.[0]?.properties?.id;
    if (id) location.href = `${BASE}/?lieu=${id}#carte`;
  });
  map.on('mouseenter', 'pins', () => (map.getCanvas().style.cursor = 'pointer'));
  map.on('mouseleave', 'pins', () => (map.getCanvas().style.cursor = ''));
}
