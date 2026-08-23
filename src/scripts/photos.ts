/**
 * Chargement des photographies depuis Wikimedia Commons, côté navigateur.
 *
 * Le dépôt vise à terme des images téléchargées au build, avec manifeste de
 * licences vérifié à la main. Tant que ce manifeste n'est pas rempli, le
 * navigateur du visiteur interroge Commons directement : il n'y a alors aucune
 * image stockée dans le dépôt, mais l'auteur et la licence restent affichés.
 *
 * Licences acceptées : CC0, domaine public, CC BY, CC BY-SA.
 * Toute clause NC ou ND est refusée, comme toute licence non reconnue.
 */
const API = 'https://commons.wikimedia.org/w/api.php';
const CACHE = 'wnw:photos:v2';

export interface Photo {
  url: string; author: string; license: string; page: string; width: number; height: number;
}

const REJECT = /(\bnc\b|noncommercial|non-commercial|\bnd\b|noderiv|fair\s*use|all rights reserved)/i;
const ACCEPT: [RegExp, string][] = [
  [/^cc0/i, 'CC0 1.0'],
  [/public\s*domain|^pd/i, 'Domaine public'],
  [/^cc[- ]by[- ]sa[- ]?([\d.]+)?/i, 'CC BY-SA'],
  [/^cc[- ]by[- ]?([\d.]+)?/i, 'CC BY']
];
const BAD_TITLE = /(map|karte|carte|mapa|diagram|chart|graph|logo|flag|drapeau|sign|plaque|stamp|coin|poster|screenshot|topograph|profile|seal|banner)/i;

const memory = new Map<string, Photo[] | null>();

function readCache(): Record<string, Photo[]> {
  try { return JSON.parse(sessionStorage.getItem(CACHE) || '{}'); } catch { return {}; }
}
function writeCache(key: string, value: Photo[]) {
  try {
    const c = readCache(); c[key] = value;
    sessionStorage.setItem(CACHE, JSON.stringify(c));
  } catch { /* stockage indisponible, on garde le cache mémoire */ }
}

function normalise(pages: any[]): Photo[] {
  const out: Photo[] = [];
  for (const page of pages) {
    const info = page?.imageinfo?.[0];
    if (!info) continue;
    if (BAD_TITLE.test(page.title || '')) continue;
    const meta = info.extmetadata ?? {};
    const raw = String(meta.LicenseShortName?.value ?? meta.License?.value ?? '').replace(/<[^>]+>/g, '').trim();
    if (!raw || REJECT.test(raw)) continue;
    let license = '';
    for (const [re, label] of ACCEPT) {
      const m = re.exec(raw);
      if (!m) continue;
      license = m[1] ? `${label} ${m[1]}` : label;
      break;
    }
    if (!license) continue;
    const ratio = info.width / info.height;
    if (ratio < 1.2 || ratio > 2.6) continue;
    if (info.width < 1200) continue;
    const author = String(meta.Artist?.value ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() || 'Auteur non précisé';
    out.push({
      url: info.thumburl || info.url,
      author, license,
      page: info.descriptionurl,
      width: info.width, height: info.height
    });
  }
  // le plus proche du 3:2 et le plus défini en premier
  return out.sort((a, b) =>
    (Math.abs(a.width / a.height - 1.5) - Math.abs(b.width / b.height - 1.5)) || (b.width - a.width));
}

/**
 * L'audit d'accessibilité et de performance doit porter sur un DOM stable.
 * PUBLIC_DISABLE_RUNTIME_PHOTOS=1 coupe l'appel réseau : le site s'appuie
 * alors uniquement sur les images vérifiées du manifeste.
 */
const RUNTIME_DISABLED = import.meta.env.PUBLIC_DISABLE_RUNTIME_PHOTOS === '1';

export async function findPhotos(query: string, limit = 6): Promise<Photo[]> {
  if (!query || RUNTIME_DISABLED) return [];
  if (memory.has(query)) return memory.get(query) ?? [];
  const cached = readCache()[query];
  if (cached) { memory.set(query, cached); return cached; }

  const url = `${API}?${new URLSearchParams({
    action: 'query', format: 'json', formatversion: '2', origin: '*',
    generator: 'search', gsrsearch: `filetype:bitmap ${query}`,
    gsrnamespace: '6', gsrlimit: String(limit * 3),
    prop: 'imageinfo', iiprop: 'url|size|extmetadata', iiurlwidth: '1600'
  })}`;

  try {
    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    const photos = normalise(data?.query?.pages ?? []).slice(0, limit);
    memory.set(query, photos);
    if (photos.length) writeCache(query, photos);
    return photos;
  } catch {
    memory.set(query, null);
    return [];
  }
}

export async function firstPhoto(query: string): Promise<Photo | null> {
  const list = await findPhotos(query, 4);
  return list[0] ?? null;
}

/** Remplace le visuel généré d'un <img> par une photographie, en fondu. */
export async function illustrate(img: HTMLImageElement, query: string, onCredit?: (p: Photo) => void) {
  const photo = await firstPhoto(query);
  if (!photo) return;
  const probe = new Image();
  probe.decoding = 'async';
  probe.src = photo.url;
  try { await probe.decode(); } catch { return; }
  img.style.transition = 'opacity .6s ease';
  img.style.opacity = '0';
  window.setTimeout(() => {
    img.src = photo.url;
    img.style.opacity = '1';
    img.dataset.photo = 'commons';
    onCredit?.(photo);
  }, 260);
}

/** Observe les images marquées data-illustrate et les remplace quand elles approchent du viewport. */
export function illustrateOnScroll(root: ParentNode = document) {
  if (RUNTIME_DISABLED) return;
  const targets = Array.from(root.querySelectorAll<HTMLImageElement>('img[data-illustrate]'));
  if (!targets.length) return;
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const img = e.target as HTMLImageElement;
      io.unobserve(img);
      const q = img.dataset.illustrate;
      if (q) illustrate(img, q, p => {
        const holder = img.closest('[data-credit-holder]')?.querySelector('[data-credit]');
        if (holder) holder.innerHTML = `${p.author} · <a href="${p.page}" target="_blank" rel="noopener">${p.license}</a>`;
      });
    }
  }, { rootMargin: '400px' });
  targets.forEach(t => io.observe(t));
}
