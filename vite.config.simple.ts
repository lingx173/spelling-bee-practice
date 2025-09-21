import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Minimal Vite config for testing
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    historyApiFallback: true
  },
  build: {
    outDir: 'dist-simple',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})
