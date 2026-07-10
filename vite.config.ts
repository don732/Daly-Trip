import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/icon.svg', 'icons/maskable-icon.svg', 'apple-touch-icon.svg'],
      manifest: {
        name: 'Daly Trips',
        short_name: 'Daly Trips',
        description: 'The operating system for golf trips — live scoring, skins, leaderboards, and settlement.',
        theme_color: '#C8102E',
        background_color: '#FAFAF6',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        categories: ['sports', 'entertainment'],
        icons: [
          {
            src: '/icons/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/icons/maskable-icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
          },
          {
            src: '/icons/icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2}'],
        navigateFallback: '/index.html',
        runtimeCaching: [],
        importScripts: ['push-sw.js']
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/api/starter': {
        target: process.env.VITE_SUPABASE_URL || 'https://example.supabase.co',
        changeOrigin: true,
        rewrite: () => '/functions/v1/starter-reply'
      },
      '/api/push/send': {
        target: process.env.VITE_SUPABASE_URL || 'https://example.supabase.co',
        changeOrigin: true,
        rewrite: () => '/functions/v1/push-send'
      },
      '/api/push/subscribe': {
        target: process.env.VITE_SUPABASE_URL || 'https://example.supabase.co',
        changeOrigin: true,
        rewrite: () => '/functions/v1/push-subscribe'
      }
    }
  }
})
