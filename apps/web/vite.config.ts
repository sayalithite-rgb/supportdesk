import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => ({
  plugins: [
    react({}),
    tailwindcss(),
    ...(mode === 'analyze'
      ? [visualizer({ emitFile: true, filename: 'stats.html', gzipSize: true, brotliSize: true })]
      : []),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'react-vendor', test: /node_modules\/(react|react-dom|scheduler)\// },
            { name: 'router-vendor', test: /node_modules\/react-router(-dom)?\// },
            { name: 'query-vendor', test: /node_modules\/@tanstack\/react-query\// },
            { name: 'forms-vendor', test: /node_modules\/(@hookform\/resolvers|react-hook-form|zod)\// },
          ],
        },
      },
    },
  },
}))