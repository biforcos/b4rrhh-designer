import path from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // El designer no vive en su propio dominio: cuelga de /designer/ del mismo
  // origen que el backoffice. Mismo origen es lo que hace que compartan el
  // localStorage y, con el, la sesion: se entra por el menu y ya estas dentro.
  // Sin este base, los assets se pedirian a /assets/... y los serviria el
  // Angular de al lado, que devolveria su index.html con 200 y un MIME que no
  // es JavaScript. Eso se ve como una pagina en blanco sin error claro.
  base: '/designer/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Sin rewrite: el backend sirve bajo context-path /api, asi que la ruta
      // se pasa tal cual. Quitarle el prefijo aqui, como se hacia antes, le
      // manda /concepts a un backend que espera /api/concepts.
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
    exclude: ['**/node_modules/**', '**/.worktrees/**'],
  },
})
