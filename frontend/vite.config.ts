import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: [
        'favicon.svg',
        'favicon-32x32.png',
        'apple-touch-icon.png',
        'icons.svg',
        'manifest-vendor.json',
        'manifest-rider.json',
        'pwa-vendor-192x192.png',
        'pwa-vendor-512x512.png',
        'pwa-vendor-512x512-maskable.png',
        'pwa-rider-192x192.png',
        'pwa-rider-512x512.png',
        'pwa-rider-512x512-maskable.png',
      ],
      manifest: {
        id: '/',
        name: 'OneMed — Healthcare & Online Pharmacy',
        short_name: 'OneMed',
        description: 'Order medicines, track live order fulfillment, and access expert pharmacy services instantly.',
        theme_color: '#0f0f13',
        background_color: '#0f0f13',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        categories: ['shopping', 'medical', 'health'],
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/media/, /^\/admin/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 365 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Offline caching for Vendor Portal APIs (Stock, Profile, Dashboard)
            urlPattern: /\/api\/vendor\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'onemed-vendor-api-cache',
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Offline caching for Rider Logistics APIs (Assigned orders, Profile, Stats)
            urlPattern: /\/api\/rider\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'onemed-rider-api-cache',
              networkTimeoutSeconds: 4,
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Cache PWA sub-manifests and app icons
            urlPattern: /\/(?:manifest.*\.json|pwa-.*\.png)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'onemed-pwa-static-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
});
