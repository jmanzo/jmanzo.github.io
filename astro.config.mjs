// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import rehypeExternalLinks from './src/plugins/rehype-external-links.mjs';

export default defineConfig({
  site: 'https://jeanmanzo.com',
  integrations: [mdx(), sitemap()],
  markdown: {
    rehypePlugins: [[rehypeExternalLinks, { siteHost: 'jeanmanzo.com' }]],
    shikiConfig: {
      // Both palettes are emitted as CSS variables; global.css swaps to the
      // dark one alongside the rest of the theme tokens.
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },
});
