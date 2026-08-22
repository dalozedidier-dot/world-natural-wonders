/**
 * Visuel généré, déterministe, utilisé tant qu'aucune photographie vérifiée
 * n'est rattachée au lieu. Il évoque la famille de paysage plutôt que d'afficher
 * un aplat vide, et reste très léger puisqu'il s'agit d'un SVG en data-URI.
 */
import type { Place } from './types';

const PALETTE: Record<string, [string, string, string]> = {
  eau:        ['#07171d', '#123f52', '#4fa3bd'],
  relief:     ['#150f0a', '#4a3524', '#a5744b'],
  feu:        ['#170a07', '#5a2317', '#d2664a'],
  glace:      ['#08131b', '#2b4f68', '#a8cfe4'],
  desert:     ['#171105', '#5c4519', '#d9b269'],
  foret:      ['#06130c', '#1e4a2d', '#5aa76c'],
  cote:       ['#05171a', '#14515a', '#48b0aa'],
  marin:      ['#04121f', '#12405f', '#3c8ec4'],
  souterrain: ['#0d0a15', '#332a52', '#7d6bb0'],
  polaire:    ['#0a1219', '#33506a', '#9fc0d8'],
  vivant:     ['#111305', '#4d5417', '#a8b44a']
};

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
};

/** Silhouette caractéristique de la famille, tracée sur une largeur de 300. */
function skyline(family: string, seed: number): string {
  const r = (n: number, min: number, max: number) => min + ((seed >> (n * 3)) % 1000) / 1000 * (max - min);
  switch (family) {
    case 'relief':
    case 'polaire':
      return `M0,200 L${r(1, 30, 70)},${r(2, 95, 125)} L${r(3, 95, 125)},${r(4, 130, 155)} L${r(5, 150, 185)},${r(6, 75, 105)} L${r(7, 220, 250)},${r(8, 125, 150)} L300,${r(9, 105, 135)} L300,200 Z`;
    case 'glace':
      return `M0,200 L0,${r(1, 140, 160)} L${r(2, 55, 80)},${r(3, 115, 135)} L${r(4, 110, 140)},${r(5, 145, 162)} L${r(6, 175, 205)},${r(7, 110, 132)} L${r(8, 245, 275)},${r(9, 148, 165)} L300,${r(1, 130, 150)} L300,200 Z`;
    case 'feu':
      return `M0,200 L${r(1, 70, 100)},${r(2, 150, 168)} L${r(3, 135, 160)},${r(4, 78, 100)} L${r(5, 165, 185)},${r(6, 78, 100)} L${r(7, 210, 240)},${r(8, 150, 168)} L300,200 Z`;
    case 'desert':
      return `M0,200 L0,${r(1, 150, 168)} Q${r(2, 60, 90)},${r(3, 118, 138)} ${r(4, 130, 160)},${r(5, 152, 168)} Q${r(6, 205, 235)},${r(7, 128, 148)} 300,${r(8, 155, 172)} L300,200 Z`;
    case 'foret':
    case 'vivant':
      return `M0,200 L0,${r(1, 155, 172)} ${Array.from({ length: 9 }, (_, i) => {
        const x = i * 34 + 8;
        return `L${x},${r(i + 1, 128, 158)} L${x + 17},${r(i + 2, 148, 172)}`;
      }).join(' ')} L300,${r(9, 150, 170)} L300,200 Z`;
    case 'souterrain':
      return `M0,200 L0,${r(1, 60, 80)} ${Array.from({ length: 7 }, (_, i) => {
        const x = i * 44 + 10;
        return `L${x},${r(i + 1, 82, 118)} L${x + 22},${r(i + 2, 62, 84)}`;
      }).join(' ')} L300,${r(8, 60, 82)} L300,200 Z`;
    case 'marin':
    case 'cote':
      return `M0,200 L0,${r(1, 158, 172)} Q${r(2, 70, 100)},${r(3, 148, 162)} ${r(4, 145, 165)},${r(5, 160, 174)} Q${r(6, 215, 245)},${r(7, 150, 165)} 300,${r(8, 160, 175)} L300,200 Z`;
    default: // eau
      return `M0,200 L0,${r(1, 150, 166)} Q${r(2, 75, 105)},${r(3, 140, 156)} ${r(4, 148, 168)},${r(5, 152, 168)} Q${r(6, 210, 240)},${r(7, 142, 158)} 300,${r(8, 152, 170)} L300,200 Z`;
  }
}

export function placeholder(place: Place): string {
  const fam = place.landscape.family;
  const [deep, mid, light] = PALETTE[fam] ?? PALETTE.relief;
  const seed = hash(place.id);
  const sunX = 60 + (seed % 180);
  const sunY = 52 + ((seed >> 5) % 40);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" width="300" height="200">
<defs>
<linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="${deep}"/><stop offset=".55" stop-color="${mid}"/><stop offset="1" stop-color="${light}" stop-opacity=".55"/>
</linearGradient>
<radialGradient id="g" cx="${sunX / 300}" cy="${sunY / 200}" r=".55">
<stop offset="0" stop-color="${light}" stop-opacity=".85"/><stop offset="1" stop-color="${light}" stop-opacity="0"/>
</radialGradient>
</defs>
<rect width="300" height="200" fill="url(#s)"/>
<circle cx="${sunX}" cy="${sunY}" r="90" fill="url(#g)"/>
<circle cx="${sunX}" cy="${sunY}" r="11" fill="${light}" opacity=".5"/>
${[0, 1, 2].map(i => `<path d="${skyline(fam, seed + i * 977)}" fill="${deep}" opacity="${0.35 + i * 0.22}" transform="translate(0,${-i * 9})"/>`).join('')}
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace(/\n/g, ''))}`;
}
