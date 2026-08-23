/**
 * Rendu Markdown minimal, suffisant pour les documents de méthode du projet
 * (titres, paragraphes, listes, tableaux, gras, italique, code, liens).
 * Entrée maîtrisée : ces fichiers sont écrits et versionnés dans le dépôt.
 */
const esc = (s: string) => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));

function inline(s: string): string {
  return esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/(^|\s)(https?:\/\/[^\s<]+)/g, '$1<a href="$2" rel="noopener" target="_blank">$2</a>');
}

export function renderMarkdown(src: string, shift = 1): string {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let i = 0;
  const flushList = (tag: string, items: string[]) => {
    if (items.length) out.push(`<${tag}>${items.map(x => `<li>${inline(x)}</li>`).join('')}</${tag}>`);
  };

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) { i++; continue; }

    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      // La page porte déjà un h1 : les titres du document descendent d'un niveau
      // pour ne pas créer de second h1 ni de saut de niveau.
      const lvl = Math.min(6, h[1].length + shift);
      out.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`);
      i++; continue;
    }

    if (/^\s*[-*]{3,}\s*$/.test(line)) { out.push('<hr />'); i++; continue; }

    // tableau
    if (line.trim().startsWith('|') && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1] ?? '')) {
      const cells = (r: string) => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const head = cells(line);
      i += 2;
      const body: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) { body.push(cells(lines[i])); i++; }
      out.push(
        `<div class="scroll-x"><table class="data"><thead><tr>${head.map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead>` +
        `<tbody>${body.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
      );
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*]\s+/, '')); i++; }
      flushList('ul', items); continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*\d+\.\s+/, '')); i++; }
      flushList('ol', items); continue;
    }

    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|\s*[-*]\s|\s*\d+\.\s|\|)/.test(lines[i])) {
      para.push(lines[i]); i++;
    }
    if (para.length) out.push(`<p>${inline(para.join(' '))}</p>`);
  }
  return out.join('\n');
}
