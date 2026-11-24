import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const backend = { target: 'http://localhost:3000', changeOrigin: true }

export default defineConfig({
  plugins: [react({}), tailwindcss()],
  server: {
    proxy: {
      '/auth': backend,
      '/tickets': backend,
    },
  },
})