/**
 * Globe orthographique dessiné et animé, sans aucune dépendance réseau.
 * Les cent lieux y tournent réellement, et disparaissent au limbe.
 */
const svg = document.querySelector<SVGSVGElement>('[data-orb]');
const dataEl = document.getElementById('globe-points');

if (svg && dataEl) {
  interface Pt { id: string; lat: number; lng: number; color: string; essential: boolean }
  const points: Pt[] = JSON.parse(dataEl.textContent || '[]');
  const R = 92, CX = 100, CY = 100;
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const meridians = Array.from(svg.querySelectorAll<SVGEllipseElement>('[data-mer]'));
  const layer = svg.querySelector<SVGGElement>('[data-pts]')!;
  const rad = (d: number) => (d * Math.PI) / 180;

  const nodes = points.map(p => {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('r', String(p.essential ? 2.7 : 1.8));
    c.setAttribute('fill', p.color);
    layer.appendChild(c);
    const halo = document.createElementNS(NS, 'circle');
    halo.setAttribute('r', String(p.essential ? 6.5 : 4.5));
    halo.setAttribute('fill', p.color);
    halo.setAttribute('opacity', '0.16');
    layer.insertBefore(halo, c);
    return { p, c, halo };
  });

  let lon = -18;
  let last = performance.now();
  let running = true;

  function draw() {
    for (const { p, c, halo } of nodes) {
      const la = rad(p.lat), lo = rad(p.lng - lon);
      const cosLa = Math.cos(la);
      const x = CX + R * cosLa * Math.sin(lo);
      const y = CY - R * Math.sin(la);
      const z = cosLa * Math.cos(lo);           // > 0 : face visible
      const edge = Math.max(0, Math.min(1, z * 3.2));   // atténuation au limbe
      c.setAttribute('cx', x.toFixed(2)); c.setAttribute('cy', y.toFixed(2));
      halo.setAttribute('cx', x.toFixed(2)); halo.setAttribute('cy', y.toFixed(2));
      c.setAttribute('opacity', (z > 0 ? 0.35 + edge * 0.65 : 0).toFixed(3));
      halo.setAttribute('opacity', (z > 0 ? edge * 0.18 : 0).toFixed(3));
    }
    meridians.forEach((m, i) => {
      const theta = rad(i * (180 / meridians.length) - lon);
      m.setAttribute('rx', Math.abs(R * Math.sin(theta)).toFixed(2));
      m.setAttribute('opacity', (0.16 + Math.abs(Math.sin(theta)) * 0.3).toFixed(3));
    });
  }

  function frame(now: number) {
    const dt = Math.min(now - last, 80); last = now;
    if (running && !document.hidden) lon = (lon + dt * 0.0042) % 360;   // environ un tour en 24 s
    draw();
    requestAnimationFrame(frame);
  }

  draw();
  if (!reduce) requestAnimationFrame(frame);

  const hero = svg.closest('.hero');
  hero?.addEventListener('pointerenter', () => { running = false; });
  hero?.addEventListener('pointerleave', () => { running = true; last = performance.now(); });
}
