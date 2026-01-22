import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173
  },
  build: {
    target: 'esnext',
    minify: 'esbuild', // Minificación rápida y efectiva (default en Vite)
    sourcemap: false, // Desactiva sourcemaps en prod para reducir tamaño
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query', 'axios'],
          'ui': ['clsx', 'tailwind-merge']
        }
      }
    }
  },
  esbuild: {
    drop: ['console', 'debugger'] // Elimina console.logs y debugger en prod
  }
})
