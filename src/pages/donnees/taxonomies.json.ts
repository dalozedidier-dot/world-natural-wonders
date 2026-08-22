import type { APIRoute } from 'astro';
import { taxonomies } from '../../data/places';
export const GET: APIRoute = () =>
  new Response(JSON.stringify(taxonomies, null, 1),
    { headers: { 'content-type': 'application/json; charset=utf-8' } });
