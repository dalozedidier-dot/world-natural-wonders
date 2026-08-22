import type { APIRoute } from 'astro';
import { places, label } from '../../data/places';

export const GET: APIRoute = () =>
  new Response(JSON.stringify({
    type: 'FeatureCollection',
    name: '100 joyaux naturels de la Terre',
    features: places.map(p => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.location.lng, p.location.lat] },
      bbox: p.location.bbox ?? undefined,
      properties: {
        id: p.id,
        nom: p.identity.name_fr,
        pays: p.location.country_labels.join(', '),
        region: label.region(p.location.region),
        famille: label.family(p.landscape.family),
        paysages: p.landscape.types,
        badges: p.editorial.badges,
        incontournable: Boolean(p.editorial.essential),
        superficie_km2: p.location.area_km2 ?? null,
        precision: p.location.coordinate_precision,
        meilleurs_mois: p.seasonality.best_months,
        fragilite: p.conservation.fragility,
        verifie_le: p.last_verified
      }
    }))
  }, null, 1), { headers: { 'content-type': 'application/geo+json; charset=utf-8' } });
