import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages sert le site sous /<nom-du-dépôt>/
const base = process.env.VITE_BASE ?? '/MARVEL-RUSH/';

export default defineConfig({
  base,
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'robots.txt'],
      manifest: {
        name: 'Marvel Rush',
        short_name: 'Marvel Rush',
        lang: 'fr',
        display: 'fullscreen',
        orientation: 'portrait',
        background_color: '#1d1733',
        theme_color: '#1d1733',
        start_url: '.',
        scope: '.',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
    }),
  ],
  test: { environment: 'node', include: ['tests/**/*.test.ts', 'src/**/*.test.ts'] },
});
