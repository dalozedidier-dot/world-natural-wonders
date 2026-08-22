import { defineConfig } from 'astro/config';

// GitHub Pages : le site est publié sous /<repo>/ sauf domaine personnalisé.
const REPO = 'world-natural-wonders';
const isPages = process.env.GITHUB_ACTIONS === 'true' && !process.env.CUSTOM_DOMAIN;

export default defineConfig({
  site: process.env.CUSTOM_DOMAIN || `https://dalozedidier-dot.github.io/${REPO}`,
  base: isPages ? `/${REPO}` : '/',
  trailingSlash: 'ignore',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  vite: {
    build: { assetsInlineLimit: 2048 },
    resolve: { alias: { '@': '/src' } }
  }
});
