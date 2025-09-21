import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Temporarily disabled PWA plugin for testing
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   workbox: {
    //     globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
    //     navigateFallback: '/index.html'
    //   },
    //   manifest: {
    //     name: 'Spelling Bee Practice',
    //     short_name: 'SpellingBee',
    //     description: 'Practice spelling with audio pronunciation',
    //     theme_color: '#ffffff',
    //     background_color: '#ffffff',
    //     display: 'standalone',
    //     start_url: '/',
    //     scope: '/'
    //   }
    // })
  ],
  server: {
    port: 3000,
    open: true,
    historyApiFallback: true
  }
})
