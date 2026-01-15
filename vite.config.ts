import { defineConfig, Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// Plugin to handle /auth/login redirect in dev mode
const authLoginRedirectPlugin = (): Plugin => {
  return {
    name: 'auth-login-redirect',
    enforce: 'pre', // Run before other plugins
    configureServer(server) {
      // Insert middleware at the beginning of the stack to ensure it runs first
      const authLoginHandler = (req: any, res: any, next: any) => {
        if (req.url && (req.url === '/auth/login' || req.url.startsWith('/auth/login?'))) {
          // Get IDP_LOGIN_URI from env (should be full URI like http://localhost:8084/login)
          const idpLoginUri = process.env.IDP_LOGIN_URI || 'http://localhost:8084/login'
          // Extract query string from the request if present
          const queryString = req.url.includes('?') ? req.url.split('?')[1] : ''
          
          // Parse the IDP_LOGIN_URI to extract the path for same-origin redirects
          let redirectPath: string
          try {
            const url = new URL(idpLoginUri)
            // If it's the same origin (localhost:8084), use relative path
            const isSameOrigin = url.hostname === 'localhost' && (url.port === '8084' || (!url.port && server.config.server?.port === 8084))
            if (isSameOrigin) {
              redirectPath = url.pathname
            } else {
              // External URL - use full URI
              redirectPath = idpLoginUri
            }
          } catch {
            // If parsing fails, assume it's already a path
            redirectPath = idpLoginUri
          }
          
          // Construct redirect URL with query string
          const hasQueryParams = redirectPath.includes('?')
          const redirectUrl = queryString 
            ? `${redirectPath}${hasQueryParams ? '&' : '?'}${queryString}`
            : redirectPath
          
          res.writeHead(302, { Location: redirectUrl })
          res.end()
          return
        }
        next()
      }
      // Insert at the very beginning to ensure it runs before Vite's SPA fallback
      server.middlewares.stack.unshift({ route: '', handle: authLoginHandler })
    }
  }
}

export default defineConfig({
  plugins: [vue(), authLoginRedirectPlugin()],
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
      },
      // Proxy /dev-login in development (always enabled in dev server)
      '/dev-login': {
        target: 'http://localhost:8083',
        changeOrigin: true
      }
    }
  }
})

