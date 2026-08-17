import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

// QA environment
// URL: http://qa.peopleflow.local:5174  (after running scripts/setup-local-urls.ps1)
// Fallback: http://localhost:5174
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5174,
    host: '0.0.0.0',
    // Allow custom local hostnames (added via hosts file)
    allowedHosts: ['qa.peopleflow.local', 'localhost', '127.0.0.1'],
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  test: {
    environment: 'jsdom',
  },
})
