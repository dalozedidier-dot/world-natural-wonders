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

/** Style sombre, neutre, conçu pour laisser la photographie et les marqueurs au premier plan. */
export async function darkStyle(): Promise<StyleSpecification> {
  registerPmtiles();
  const { url } = await resolveTilesUrl();
  const flavor = namedFlavor('dark');
  // Le contraste doit rester lisible sur les écrans peu lumineux : l'ancien
  // trio était presque monochrome et donnait l'impression d'une carte vide.
  const tuned = { ...flavor, background: '#061315', earth: '#203b35', water: '#0b2934' };
  return {
    version: 8,
    glyphs: 'https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf',
    sprite: 'https://protomaps.github.io/basemaps-assets/sprites/v4/dark',
    sources: {
      protomaps: {
        type: 'vector',
        // Déclarer directement le gabarit de tuiles empêche MapLibre de
        // bloquer le chargement complet du style en attendant un TileJSON
        // produit par le protocole personnalisé. Le fond et les marqueurs
        // peuvent ainsi s'initialiser immédiatement, puis les plages PMTiles
        // sont lues à la demande.
        tiles: [`pmtiles://${url}/{z}/{x}/{y}`],
        minzoom: 0,
        maxzoom: 5,
        bounds: [-180, -85.0511287, 180, 85.0511287],
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
