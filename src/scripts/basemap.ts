/**
 * Couche d'abstraction du fournisseur de fonds de carte.
 *
 * Choix du projet : PMTiles auto-hébergé (Protomaps). Un seul fichier .pmtiles
 * est servi en statique, sans clé API, sans quota, sans dépendance commerciale.
 * On n'utilise jamais tile.openstreetmap.org en production : l'OSMF rappelle
 * que ses serveurs de tuiles ne sont pas une infrastructure gratuite illimitée.
 *
 * Ordre de résolution :
 *   1. PUBLIC_TILES_URL (variable d'environnement de build)
 *   2. <base>/tiles/basemap.pmtiles s'il est présent
 *   3. bucket de démonstration Protomaps, uniquement en développement
 */
import { Protocol } from 'pmtiles';
import { layers, namedFlavor } from '@protomaps/basemaps';
import { addProtocol } from 'maplibre-gl';
import type { LayerSpecification, Map as MlMap, StyleSpecification } from 'maplibre-gl';

const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
const CONFIGURED = (import.meta.env.PUBLIC_TILES_URL as string | undefined) || '';
const OPENFREEMAP_NATURAL_EARTH = 'https://tiles.openfreemap.org/natural_earth/ne2sr/{z}/{x}/{y}.png';
const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

let pmtilesProtocol: Protocol | undefined;
export function registerPmtiles() {
  if (pmtilesProtocol) return;
  // Conserver l'instance pendant toute la vie de la page : elle porte le
  // cache des entêtes et des répertoires de l'archive PMTiles.
  pmtilesProtocol = new Protocol();
  addProtocol('pmtiles', pmtilesProtocol.tile);
}

export async function resolveTilesUrl(): Promise<{ url: string; local: boolean }> {
  if (CONFIGURED) return { url: CONFIGURED, local: !/^https?:\/\//.test(CONFIGURED) };
  // Le fond mondial fait partie de l'artefact publié. On évite une requête
  // HEAD préalable : certains navigateurs et CDN la gardent en attente sur
  // les gros fichiers, ce qui bloquait toute l'initialisation de l'explorateur.
  const local = `${window.location.origin}${BASE}/tiles/basemap.pmtiles?v=20260823`;
  return { url: local, local: true };
}

export const ATTRIBUTION =
  '<a href="https://github.com/protomaps/basemaps" target="_blank" rel="noopener">Protomaps</a> · ' +
  '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap</a>';

const flavor = namedFlavor('dark');
// Le contraste doit rester lisible sur les écrans peu lumineux : l'ancien
// trio était presque monochrome et donnait l'impression d'une carte vide.
const tuned = { ...flavor, background: '#061315', earth: '#203b35', water: '#0b2934' };
const basemapLayers = layers('protomaps', tuned, { lang: 'fr' }) as LayerSpecification[];

/**
 * Le style minimal démarre sans aucune ressource distante. La liste et les
 * marqueurs ne doivent jamais dépendre de la disponibilité du fond PMTiles.
 */
export function initialStyle(): StyleSpecification {
  const background = basemapLayers.find(layer => layer.id === 'background');
  if (!background) throw new Error('Couche de fond Protomaps absente');
  return {
    version: 8,
    glyphs: 'https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf',
    sprite: 'https://protomaps.github.io/basemaps-assets/sprites/v4/dark',
    sources: {},
    layers: [background]
  } as StyleSpecification;
}

/**
 * Style principal désormais fourni par OpenFreeMap, dont l'URL est conçue
 * pour MapLibre et ne nécessite ni compte ni clé. Le style minimal local
 * garantit que les marqueurs restent utilisables en cas de panne réseau.
 */
export async function mapStyle(): Promise<StyleSpecification> {
  try {
    const response = await fetch(OPENFREEMAP_STYLE, { mode: 'cors' });
    if (!response.ok) throw new Error(`OpenFreeMap ${response.status}`);
    const style = await response.json() as StyleSpecification;
    // L'URL du style sert aussi de base aux sprites/glyphes relatifs.
    // Les URL absolues actuelles sont conservées telles quelles.
    return style;
  } catch (error) {
    console.warn('[carte] fond vectoriel indisponible, utilisation du fond mondial de secours', error);
  }
  return {
    version: 8,
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: {
      world: {
        type: 'raster',
        tiles: [OPENFREEMAP_NATURAL_EARTH],
        tileSize: 256,
        minzoom: 0,
        maxzoom: 6,
        attribution: 'OpenFreeMap · Natural Earth · © OpenStreetMap'
      }
    },
    layers: [
      { id: 'background', type: 'background', paint: { 'background-color': '#061315' } },
      {
        id: 'world',
        type: 'raster',
        source: 'world',
        paint: { 'raster-saturation': -0.55, 'raster-brightness-min': 0.08, 'raster-brightness-max': 0.62 }
      }
    ]
  } as StyleSpecification;
}

/** Ajoute le fond géographique après l'initialisation de la carte interactive. */
export async function addBasemap(map: MlMap, beforeId: string) {
  registerPmtiles();
  const { url } = await resolveTilesUrl();
  if (map.getSource('protomaps')) return;
  map.addSource('protomaps', {
    type: 'vector',
    url: `pmtiles://${url}`,
    attribution: ATTRIBUTION
  });
  for (const layer of basemapLayers) {
    if (layer.id !== 'background' && !map.getLayer(layer.id)) map.addLayer(layer, beforeId);
  }
}

/** Style complet conservé pour les autres vues éventuelles. */
export async function darkStyle(): Promise<StyleSpecification> {
  registerPmtiles();
  const { url } = await resolveTilesUrl();
  return {
    version: 8,
    glyphs: 'https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf',
    sprite: 'https://protomaps.github.io/basemaps-assets/sprites/v4/dark',
    sources: {
      protomaps: {
        type: 'vector',
        url: `pmtiles://${url}`,
        attribution: ATTRIBUTION
      }
    },
    layers: basemapLayers
  } as StyleSpecification;
}

/**
 * Relief optionnel. Aucun fournisseur n'est câblé en dur : renseigner
 * PUBLIC_TERRAIN_URL (tuiles terrain-RGB) pour activer ombrage et relief 3D.
 */
export function addTerrain(map: MlMap) {
  const dem = import.meta.env.PUBLIC_TERRAIN_URL as string | undefined;
  if (!dem) return false;
  if (map.getSource('dem')) return true;
  map.addSource('dem', { type: 'raster-dem', tiles: [dem], tileSize: 256, maxzoom: 12 });
  map.addLayer({
    id: 'hillshade',
    type: 'hillshade',
    source: 'dem',
    paint: { 'hillshade-exaggeration': 0.35, 'hillshade-shadow-color': '#04100f' }
  }, map.getStyle().layers?.find(l => l.id.startsWith('roads'))?.id);
  return true;
}
