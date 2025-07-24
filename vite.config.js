import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/anthropic': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/anthropic/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Forward the API key from the original request
            if (req.headers['x-api-key']) {
              proxyReq.setHeader('x-api-key', req.headers['x-api-key']);
            }
            // Forward the anthropic-version header
            if (req.headers['anthropic-version']) {
              proxyReq.setHeader('anthropic-version', req.headers['anthropic-version']);
            }
            // Forward the browser access header
            if (req.headers['anthropic-dangerous-direct-browser-access']) {
              proxyReq.setHeader('anthropic-dangerous-direct-browser-access', req.headers['anthropic-dangerous-direct-browser-access']);
            }
          });
        }
      },
      '/api/openai': {
        target: 'https://api.openai.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openai/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Forward the Authorization header
            if (req.headers['authorization']) {
              proxyReq.setHeader('authorization', req.headers['authorization']);
            }
          });
        }
      },
      '/api/google': {
        target: 'https://generativelanguage.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/google/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Forward the Google API key
            if (req.headers['x-goog-api-key']) {
              proxyReq.setHeader('x-goog-api-key', req.headers['x-goog-api-key']);
            }
          });
        }
      }
    }
  }
})
