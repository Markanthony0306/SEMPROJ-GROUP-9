import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
  optimizeDeps: {
    // Prebundle the camera libraries and Paddle's CommonJS dependency.
    include: [
      'face-api.js',
      'jscanify/client',
      '@techstark/opencv-js',
      '@paddleocr/paddleocr-js > clipper-lib'
    ],
    // Paddle's ONNX loader resolves its WASM runtime next to the SDK bundle.
    exclude: ['@paddleocr/paddleocr-js']
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
