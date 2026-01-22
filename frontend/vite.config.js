import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    host: true,
    strictPort: true,
    allowedHosts: 'all',
  },

  build: {
    chunkSizeWarningLimit: 1000
  }
})
