import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 8084,
    proxy: {
      '/api': {
        target: 'http://localhost:8083',
        changeOrigin: true
      }
      // Note: /dev-login is intentionally NOT proxied - it should be called directly
      // at http://localhost:8083/dev-login. This is a security feature to prevent
      // dev-login from being accessible through the SPA proxy in production.
    }
  }
})

