import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig(({ mode }) => {
  const { PORT } = loadEnv(mode, process.cwd(), 'PORT')
  const proxy = { '/api': `http://127.0.0.1:${PORT || 3001}` }
  return {
    base: process.env.BASE_PATH || '/',
    plugins: [react()],
    server: {
      proxy,
      watch: { ignored: ['**/.taste-skill/**', '**/.venv-id-ocr/**', '**/graphify-out/**', '**/output/**'] },
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
    },
    preview: { proxy }
  }
})
