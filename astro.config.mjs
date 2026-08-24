import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://world-natural-wonders.be',
  base: '/',
  trailingSlash: 'ignore',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  vite: {
    build: { assetsInlineLimit: 2048 },
    resolve: { alias: { '@': '/src' } }
  }
});
