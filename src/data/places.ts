import type { Place, MediaItem, Taxonomies } from './types';
import { placeholder } from './placeholder';

const placeModules = import.meta.glob<Place>('../../data/places/*.json', { eager: true, import: 'default' });
export const allPlaces: Place[] = Object.values(placeModules)
  .map(p => ({ collection: 'hundred', ...p } as Place))
  .sort((a, b) => a.identity.name_fr.localeCompare(b.identity.name_fr, 'fr'));

export const places: Place[] = allPlaces.filter(p => p.collection !== 'reserve');
export const reserve: Place[] = allPlaces.filter(p => p.collection === 'reserve');

import taxonomiesJson from '../../data/schema/taxonomies.json';
export const taxonomies = taxonomiesJson as unknown as Taxonomies;

let mediaItems: MediaItem[] = [];
try {
  const m = import.meta.glob<{ items: MediaItem[] }>('../../data/media/manifest.json', { eager: true, import: 'default' });
  mediaItems = Object.values(m)[0]?.items ?? [];
} catch { mediaItems = []; }
export const media: MediaItem[] = mediaItems;

export const mediaById = new Map(media.map(m => [m.id, m]));
const heroByPlace = new Map(media.filter(m => m.role === 'hero').map(m => [m.place, m]));
export const placeById = new Map(allPlaces.map(p => [p.id, p]));

export const label = {
  region: (id: string) => taxonomies.regions.find(r => r.id === id)?.label ?? id,
  landscape: (id: string) => taxonomies.landscapes.find(l => l.id === id)?.label ?? id,
  family: (id: string) => taxonomies.families.find(f => f.id === id)?.label ?? id,
  familyColor: (id: string) => taxonomies.families.find(f => f.id === id)?.color ?? '#8a8a8a',
  badge: (id: string) => taxonomies.badges.find(b => b.id === id)?.label ?? id,
  badgeDesc: (id: string) => taxonomies.badges.find(b => b.id === id)?.desc ?? '',
  collection: (id: string) => taxonomies.collections.find(c => c.id === id)?.label ?? id,
  threat: (id: string) => taxonomies.threats.find(t => t.id === id)?.label ?? id,
  designation: (id: string) => taxonomies.designations.find(d => d.id === id)?.label ?? id,
  accessibility: (id: string) => taxonomies.accessibility.find(a => a.id === id)?.label ?? id,
  fragility: (id: string) => taxonomies.fragility.find(f => f.id === id)?.label ?? id,
  month: (n: number) => taxonomies.months[n - 1] ?? String(n)
};

export { placeholder };
export const heroFor = (p: Place) =>
  (p.media?.hero ? mediaById.get(p.media.hero) : undefined) ?? heroByPlace.get(p.id);
export const galleryFor = (p: Place) => (p.media?.gallery ?? []).map(id => mediaById.get(id)).filter(Boolean) as MediaItem[];

/** Charge utile compacte envoyée au client pour la carte et les filtres. */
export interface PlaceLite {
  id: string; name: string; country: string; region: string;
  family: string; types: string[]; badges: string[]; essential: boolean;
  lat: number; lng: number; bbox?: [number, number, number, number] | null;
  months: number[]; access: string; fragility: string; collections: string[];
  lede: string; hints: string[]; hero?: string | null; hasPhoto: boolean; alt?: string | null; q?: string | null;
  elevation?: number | null; search: string;
}

export const toLite = (p: Place): PlaceLite => {
  const hero = heroFor(p);
  return {
    id: p.id,
    name: p.identity.name_fr,
    country: p.location.country_labels.join(' et '),
    region: p.location.region,
    family: p.landscape.family,
    types: p.landscape.types,
    badges: p.editorial.badges,
    essential: Boolean(p.editorial.essential),
    lat: p.location.lat,
    lng: p.location.lng,
    bbox: p.location.bbox ?? null,
    months: p.seasonality.best_months,
    access: p.visit.accessibility,
    fragility: p.conservation.fragility,
    collections: p.landscape.collections ?? [],
    lede: p.editorial.lede,
    hints: p.editorial.guess_hints ?? [],
    hero: hero ? hero.local.replace(/^public\//, '/') : placeholder(p),
    hasPhoto: Boolean(hero),
    q: p.media?.query ?? `${p.identity.name_official ?? p.identity.name_fr} ${p.location.country_labels[0]}`,
    alt: hero?.alt ?? `${p.identity.name_fr}, visuel généré en attendant une photographie sous licence libre`,
    elevation: p.location.elevation_max_m ?? null,
    search: [
      p.identity.name_fr, p.identity.name_official, ...(p.identity.aka ?? []),
      ...(p.identity.name_local ?? []).map(n => n.value),
      ...(p.identity.name_indigenous ?? []).map(n => n.value),
      ...p.location.country_labels, p.location.subdivision,
      ...p.landscape.types
    ].filter(Boolean).join(' ').toLowerCase()
  };
};

export const lite: PlaceLite[] = places.map(toLite);
