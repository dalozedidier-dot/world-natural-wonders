/**
 * Accès à l'API Wikimedia Commons.
 * Aucune image n'est retenue automatiquement : ce module ne fait que rapporter
 * les métadonnées, la décision et la vérification restent manuelles.
 */
const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'world-natural-wonders/2.0 (projet éditorial; contact via le dépôt GitHub)';
const MIN_INTERVAL_MS = 700;
let lastRequestAt = 0;

const ACCEPTED = [
  { test: /^cc0/i, license: 'CC0', version: '1.0', url: 'https://creativecommons.org/publicdomain/zero/1.0/' },
  { test: /^pd|public\s*domain/i, license: 'PD', version: '', url: 'https://commons.wikimedia.org/wiki/Commons:Licensing' },
  { test: /^cc[- ]by[- ]sa[- ]?([\d.]+)/i, license: 'CC BY-SA', url: v => `https://creativecommons.org/licenses/by-sa/${v}/` },
  { test: /^cc[- ]by[- ]?([\d.]+)/i, license: 'CC BY', url: v => `https://creativecommons.org/licenses/by/${v}/` }
];
const REJECTED = /(\bnc\b|noncommercial|\bnd\b|noderiv|fair\s*use|copyright)/i;

async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: 'json', formatversion: '2', origin: '*', ...params })}`;
  for (let attempt = 0; attempt < 5; attempt++) {
    const wait = Math.max(0, MIN_INTERVAL_MS - (Date.now() - lastRequestAt));
    if (wait) await new Promise(resolve => setTimeout(resolve, wait));
    lastRequestAt = Date.now();
    const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/json' } });
    if (res.ok) return res.json();
    if (res.status !== 429 && res.status < 500) throw new Error(`Commons ${res.status} sur ${url}`);
    const retryAfter = Number(res.headers.get('retry-after')) || 2 ** attempt;
    await new Promise(resolve => setTimeout(resolve, Math.min(30, retryAfter) * 1000));
  }
  throw new Error(`Commons temporairement indisponible sur ${url}`);
}

export async function search(query, limit = 12) {
  const data = await api({
    action: 'query', generator: 'search', gsrsearch: `filetype:bitmap ${query}`,
    gsrnamespace: '6', gsrlimit: String(limit),
    prop: 'imageinfo', iiprop: 'url|size|extmetadata|mime', iiurlwidth: '1200'
  });
  return (data.query?.pages ?? []).map(normalize).filter(Boolean);
}

export async function byTitle(title) {
  const data = await api({
    action: 'query', titles: title.startsWith('File:') ? title : `File:${title}`,
    prop: 'imageinfo', iiprop: 'url|size|extmetadata|mime', iiurlwidth: '2000'
  });
  const page = data.query?.pages?.[0];
  return page ? normalize(page) : null;
}

function normalize(page) {
  const info = page.imageinfo?.[0];
  if (!info) return null;
  const meta = info.extmetadata ?? {};
  const raw = (meta.LicenseShortName?.value ?? meta.License?.value ?? '').replace(/<[^>]+>/g, '').trim();
  if (!raw || REJECTED.test(raw)) return null;
  let license = null, version = '', url = '';
  for (const rule of ACCEPTED) {
    const m = rule.test.exec(raw);
    if (!m) continue;
    license = rule.license;
    version = m[1] ?? rule.version ?? '';
    url = typeof rule.url === 'function' ? rule.url(version || '4.0') : rule.url;
    break;
  }
  if (!license) return null;
  const strip = s => (s ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  return {
    commons_file: page.title.replace(/^File:/, ''),
    source_page: info.descriptionurl,
    author: strip(meta.Artist?.value) || 'Auteur non précisé sur Commons',
    credit: strip(meta.Credit?.value),
    description: strip(meta.ImageDescription?.value),
    license, license_version: version, license_url: url,
    width: info.width, height: info.height, mime: info.mime,
    original: info.url, thumb: info.thumburl
  };
}
