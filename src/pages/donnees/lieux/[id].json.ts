import type { APIRoute } from 'astro';
import { allPlaces, heroFor, label, taxonomies } from '../../../data/places';

export function getStaticPaths() {
  return allPlaces.map(p => ({ params: { id: p.id } }));
}

export const GET: APIRoute = ({ params }) => {
  const p = allPlaces.find(x => x.id === params.id);
  if (!p) return new Response('null', { status: 404 });
  const hero = heroFor(p);
  const payload = {
    ...p,
    score: undefined, // la notation interne n'est jamais exposée
    __hero: hero
      ? {
          src: hero.local.replace(/^public\//, '/'),
          alt: hero.alt,
          author: hero.author,
          license: hero.license,
          license_version: hero.license_version,
          source_page: hero.source_page
        }
      : null,
    __badgeLabels: Object.fromEntries(taxonomies.badges.map(b => [b.id, b.label])),
    __threatLabels: Object.fromEntries(taxonomies.threats.map(t => [t.id, t.label])),
    __familyLabel: label.family(p.landscape.family)
  };
  return new Response(JSON.stringify(payload), {
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
};
