import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Vite is the tool that runs the app while you develop (npm run dev)
// and packs it into plain files for the web (npm run build).
export default defineConfig({
  // './' makes all paths relative, so the built app works on GitHub Pages
  // no matter what the repository is called.
  base: './',
  // The QR libraries load only when a code is shown or scanned. Preparing
  // them up front keeps the dev server from reloading the page that moment.
  optimizeDeps: { include: ['jsqr', 'qrcode-generator'] },
  plugins: [
    react(),

    // This plugin turns the app into a PWA: it writes the manifest
    // (name, icon, colours) and the service worker (offline support).
    VitePWA({
      // 'prompt': we decide when to switch to a new version (src/updates.js).
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Workout',
        short_name: 'Workout',
        description: 'Log workouts and track progress, offline.',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#111315',
        theme_color: '#111315',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
});
