import type { APIRoute } from 'astro';
import { allPlaces } from '../../data/places';
export const GET: APIRoute = () =>
  new Response(JSON.stringify(allPlaces.map(({ score, ...rest }) => rest), null, 1),
    { headers: { 'content-type': 'application/json; charset=utf-8' } });
