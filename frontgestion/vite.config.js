import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// Back Spring Boot
const BACK = 'http://localhost:8080'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Le front (5173) transmet ces URL au back (8080) : même origine pour le navigateur,
  // donc le cookie de session JSESSIONID marche et pas besoin de CORS.
  // (un seul bloc server : avec deux blocs, le second écrasait le premier)
  server: {
    port: 5173,
    proxy: {
      '/api': { target: BACK, changeOrigin: true },
      '/auth': { target: BACK, changeOrigin: true },   // login / logout / session (P1)
      '/uploads': { target: BACK, changeOrigin: true }, // fichiers enregistrés
    },
  },
})
