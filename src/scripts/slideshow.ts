/**
 * Diaporama du hero. Fondu lent, arrêt au survol et hors onglet actif,
 * navigation par pastilles, et respect de prefers-reduced-motion.
 */
import { firstPhoto, type Photo } from './photos';

const container = document.querySelector<HTMLElement>('[data-slides]');
const dataEl = document.getElementById('slides-data');

if (container && dataEl) {
  interface Slide { id: string; name: string; country: string; q: string; credit: string | null; creditUrl: string | null; photo: boolean }
  const slides: Slide[] = JSON.parse(dataEl.textContent || '[]');
  const figures = Array.from(container.querySelectorAll<HTMLElement>('[data-slide]'));
  const dots = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-dot]'));
  const caption = document.querySelector<HTMLElement>('[data-caption-text]');
  const base = (document.getElementById('globe')?.dataset.base || '').replace(/\/$/, '');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DUREE = 9000;

  let index = 0;
  let timer = 0;
  let paused = false;

  const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

  function show(next: number) {
    index = (next + figures.length) % figures.length;
    figures.forEach((f, i) => f.setAttribute('data-active', String(i === index)));
    dots.forEach((d, i) => d.setAttribute('aria-current', String(i === index)));
    const s = slides[index];
    if (caption && s) {
      caption.innerHTML =
        `<a href="${base}/lieux/${s.id}"><b>${esc(s.name)}</b></a> <span class="muted">${esc(s.country)}</span>` +
        (s.credit && s.creditUrl ? ` <a href="${s.creditUrl}" target="_blank" rel="noopener">${esc(s.credit)}</a>` : '') +
        (s.photo ? '' : ' <span class="muted">visuel généré, photographie à venir</span>');
    }
  }

  function schedule() {
    window.clearTimeout(timer);
    if (reduce || paused || figures.length < 2) return;
    timer = window.setTimeout(() => { show(index + 1); schedule(); }, DUREE);
  }

  dots.forEach((d, i) => d.addEventListener('click', () => { show(i); schedule(); }));

  const hero = container.closest('.hero');
  hero?.addEventListener('pointerenter', () => { paused = true; window.clearTimeout(timer); });
  hero?.addEventListener('pointerleave', () => { paused = false; schedule(); });
  document.addEventListener('visibilitychange', () => { paused = document.hidden; schedule(); });

  show(0);
  schedule();

  // Illustration progressive depuis Wikimedia Commons, dans l'ordre d'apparition.
  (async () => {
    for (let i = 0; i < slides.length; i++) {
      const s = slides[i];
      if (s.photo || !s.q) continue;
      const photo: Photo | null = await firstPhoto(s.q);
      if (!photo) continue;
      const probe = new Image();
      probe.decoding = 'async';
      probe.src = photo.url;
      try { await probe.decode(); } catch { continue; }
      const img = figures[i]?.querySelector('img');
      if (!img) continue;
      img.src = photo.url;
      s.photo = true;
      s.credit = `${photo.author} · ${photo.license}`;
      s.creditUrl = photo.page;
      if (i === index) show(index);
    }
  })();
}
