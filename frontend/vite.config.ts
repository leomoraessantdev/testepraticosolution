/// <reference types="vitest/config" />
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    // Alias "@" apontando para src: imports absolutos nao quebram quando um
    // componente muda de pasta, e e o que o shadcn/ui gera por padrao.
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },

  test: {
    // jsdom porque parte dos testes monta componente. Os testes de funcao pura
    // rodariam sem ele, mas manter dois ambientes so complicaria o comando.
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/teste/setup.ts'],
  },

  server: {
    // Porta fixa: o backend libera exatamente http://localhost:5173 no CORS
    // (app.cors.origens). Se a porta variasse, o navegador bloquearia.
    port: 5173,
    strictPort: true,
  },
})
