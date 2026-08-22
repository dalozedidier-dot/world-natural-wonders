// Types du modèle éditorial. Miroir de data/schema/place.schema.json.

export type EditorialStatus =
  | 'draft' | 'research' | 'fact_checked' | 'media_checked' | 'license_checked' | 'ready';

export type RegionId =
  | 'afrique' | 'asie' | 'europe' | 'amerique-nord' | 'amerique-sud' | 'oceanie' | 'polaire';

export type Accessibility = 'facile' | 'modere' | 'difficile' | 'expedition';
export type Fragility = 'faible' | 'moderee' | 'elevee' | 'critique';
export type Level = 'faible' | 'modere' | 'eleve' | 'critique';

export interface LocalName { lang: string; value: string; note?: string }
export interface IndigenousName { people: string; value: string; meaning?: string }

export interface Identity {
  name_fr: string;
  name_official?: string | null;
  name_local?: LocalName[];
  name_indigenous?: IndigenousName[] | null;
  aka?: string[];
}

export interface Location {
  countries: string[];
  country_labels: string[];
  subdivision?: string | null;
  region: RegionId;
  lat: number;
  lng: number;
  coordinate_precision: 'site' | 'generalized' | 'region';
  bbox?: [number, number, number, number] | null;
  area_km2?: number | null;
  elevation_min_m?: number | null;
  elevation_max_m?: number | null;
  depth_max_m?: number | null;
  timezone?: string | null;
}

export interface Landscape {
  primary: string;
  types: string[];
  family: string;
  iucn_ecosystem?: string[];
  biome?: string | null;
  climate?: string | null;
  collections?: string[];
}

export interface Designation {
  type: string; name: string; ref?: string | null; since?: number | null;
  iucn_category?: string | null; criteria?: string[]; url?: string | null;
}

export interface Protection {
  designations: Designation[];
  managing_body?: { name: string; url?: string | null; note?: string } | null;
}

export interface Editorial {
  badges: string[];
  essential?: boolean;
  lede: string;
  why_here: string;
  presentation: string;
  geology?: string;
  dynamics?: string;
  biodiversity_text?: string;
  in_motion?: string;
  guess_hints?: string[];
}

export interface Figure { label: string; value: string; source?: string | null }

export interface Species {
  name_fr: string; name_sci?: string | null; group?: string | null;
  iucn_status?: string | null; note?: string | null;
}

export interface Biodiversity {
  flagship_species?: Species[];
  endemism_level?: 'nul' | 'faible' | 'modere' | 'eleve' | 'exceptionnel' | null;
  endemism_note?: string | null;
  species_counts?: Record<string, number | string | null> | null;
}

export interface Phenomenon { label: string; kind?: string; months: number[]; note?: string | null }

export interface Seasonality {
  best_months: number[];
  avoid_months?: number[];
  phenomena?: Phenomenon[];
  notes?: string | null;
}

export interface Visit {
  accessibility: Accessibility;
  suggested_duration: string;
  difficulty?: string | null;
  extreme_conditions?: string[];
  permits?: string | null;
  rules?: string[];
  official_url?: string | null;
  no_route_guidance?: boolean;
}

export interface Threat { type: string; level: Level; note?: string | null }

export interface Conservation {
  fragility: Fragility;
  state: string;
  trend?: 'amelioration' | 'stable' | 'degradation' | 'inconnue' | null;
  threats: Threat[];
  understand_without_going?: boolean;
  message?: string | null;
}

export interface Source {
  title: string; publisher?: string | null; url: string;
  type: 'officiel' | 'scientifique' | 'jeu-de-donnees' | 'encyclopedique' | 'media';
  accessed?: string | null;
}

export interface Place {
  id: string;
  collection?: 'hundred' | 'reserve';
  status: EditorialStatus;
  last_verified: string;
  identity: Identity;
  location: Location;
  landscape: Landscape;
  protection: Protection;
  editorial: Editorial;
  figures?: Figure[];
  geology?: {
    age?: string | null; processes?: string[]; rock_types?: string[];
    volcanic?: { gvp_number?: string | null; type?: string | null; last_eruption?: string | null; status?: string | null } | null;
  };
  biodiversity?: Biodiversity;
  seasonality: Seasonality;
  visit: Visit;
  conservation: Conservation;
  media?: { hero?: string | null; gallery?: string[] };
  sources: Source[];
  score?: Record<string, unknown> | null;
}

export interface MediaItem {
  id: string; place: string; role: 'hero' | 'gallery';
  commons_file: string; source_page: string;
  author: string; author_url?: string | null;
  license: 'CC0' | 'PD' | 'PD-Mark' | 'CC BY' | 'CC BY-SA';
  license_version: string; license_url: string;
  modifications?: string; verified_on: string; verified_by?: string | null;
  width: number; height: number; alt: string; caption?: string | null; local: string;
}

export interface Taxonomies {
  version: string; updated: string;
  regions: { id: RegionId; label: string; quota: [number, number] }[];
  landscapes: { id: string; label: string; family: string; icon: string }[];
  families: { id: string; label: string; color: string }[];
  badges: { id: string; label: string; desc: string }[];
  collections: { id: string; label: string; desc: string }[];
  accessibility: { id: string; label: string; desc: string }[];
  fragility: { id: string; label: string }[];
  threats: { id: string; label: string }[];
  designations: { id: string; label: string }[];
  editorialStatus: string[];
  months: string[];
}
