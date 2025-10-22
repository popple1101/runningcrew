import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',      // ← 여기 localhost
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8787', // ← 여기 localhost
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
})
