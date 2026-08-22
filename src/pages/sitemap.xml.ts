import type { APIRoute } from 'astro';
import { allPlaces, taxonomies, places } from '../data/places';

export const GET: APIRoute = ({ site }) => {
  const origin = (site?.href ?? 'https://example.org/').replace(/\/$/, '');
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const urls = [
    '', '/collections', '/calendrier', '/explorer', '/terre-en-mouvement',
    '/comparer', '/favoris', '/methode', '/credits', '/donnees',
    ...allPlaces.map(p => `/lieux/${p.id}`),
    ...taxonomies.collections.map(c => `/collections/${c.id}`),
    ...taxonomies.regions.map(r => `/regions/${r.id}`),
    ...taxonomies.landscapes.filter(l => places.some(p => p.landscape.types.includes(l.id))).map(l => `/paysages/${l.id}`)
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${origin}${base}${u}</loc></url>`).join('\n')}
</urlset>`;
  return new Response(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
