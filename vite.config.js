import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
  optimizeDeps: {
    // Prepare the lazy-loaded camera library before serving its first import.
    include: ['face-api.js']
  },
  server: {
    fs: {
      deny: [
        '.env',
        '.env.*',
        '*.{crt,pem}',
        '**/.git/**',
        '**/server/**',
        '**/scripts/**',
        '**/vendor/**',
        '**/graphify-out/**'
      ]
    }
  }
})
