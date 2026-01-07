import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true
  },
  test: {
    // API Mock. Todo: Expand coverage threshold and reporters once CI is wired to real services.
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true
  }
})
