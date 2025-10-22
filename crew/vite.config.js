// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const TARGET = 'https://runcrew-backend.popple1101.workers.dev'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: TARGET,
        changeOrigin: true,
        secure: true,
        // ✅ /api → '' 로 바꿔서 백엔드의 /me 로 전달
        rewrite: (path) => path.replace(/^\/api/, ''),
        // (선택) 쿠키 Domain 제거: localhost에 세션 저장
        configure: (proxy) => {
          proxy.on('proxyRes', (res) => {
            const sc = res.headers['set-cookie']
            if (sc) res.headers['set-cookie'] = sc.map(c => c.replace(/;\s*Domain=[^;]+/i, ''))
          })
        },
      },
      // OAuth 시작/콜백은 /auth 그대로 프록시
      '/auth': { target: TARGET, changeOrigin: true, secure: true },
    },
  },
})
