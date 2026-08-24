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
import type { Map as MlMap, StyleSpecification } from 'maplibre-gl';

const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
const CONFIGURED = (import.meta.env.PUBLIC_TILES_URL as string | undefined) || '';

let protocolRegistered = false;
export function registerPmtiles() {
  if (protocolRegistered) return;
  const protocol = new Protocol();
  addProtocol('pmtiles', protocol.tile);
  protocolRegistered = true;
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

/** Style sombre, neutre, conçu pour laisser la photographie et les marqueurs au premier plan. */
export async function darkStyle(): Promise<StyleSpecification> {
  registerPmtiles();
  const { url } = await resolveTilesUrl();
  const flavor = namedFlavor('dark');
  // On assombrit encore le fond pour que les marqueurs ressortent.
  const tuned = { ...flavor, background: '#07100f', earth: '#0b1817', water: '#081e26' };
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
    layers: layers('protomaps', tuned, { lang: 'fr' })
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
