import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'My Calendar Assistant',
        short_name: 'CalAssist',
        description: 'Capture events, review drafts, sync to Google Calendar',
        theme_color: '#7c3aed',
        background_color: '#f1f0ee',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Don't intercept /api/* navigations — let server redirects (e.g. OAuth) go through
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // API fetch calls only — exclude navigate mode so OAuth redirects aren't intercepted
            urlPattern: ({ request, url }) =>
              url.pathname.startsWith('/api/') && request.mode !== 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 8,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    minify: 'esbuild',
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
