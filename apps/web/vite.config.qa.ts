import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

// QA environment — proxies to API on port 3001
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5174,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  test: {
    environment: 'jsdom',
  },
})
