import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api_proxy': {
        target: 'https://missionfornationbackend.onrender.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api_proxy/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Remove Origin and Referer headers completely to match the working curl request
            proxyReq.removeHeader('Origin');
            proxyReq.removeHeader('Referer');
          });
        },
      },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
