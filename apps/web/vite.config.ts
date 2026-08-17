import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

// Dev environment
// URL: http://dev.peopleflow.local:5173  (after running scripts/setup-local-urls.ps1)
// Fallback: http://localhost:5173
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    // Allow custom local hostnames (added via hosts file)
    allowedHosts: ['dev.peopleflow.local', 'localhost', '127.0.0.1'],
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  test: {
    environment: 'jsdom',
  },
})
