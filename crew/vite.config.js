// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const TARGET = 'https://runcrew-backend.popple1101.workers.dev';

// 쿠키 Domain 제거(개발에서 localhost에 심기)
const stripCookieDomain = (proxy) => {
  proxy.on('proxyRes', (proxyRes) => {
    const setCookie = proxyRes.headers['set-cookie'];
    if (setCookie) {
      proxyRes.headers['set-cookie'] = setCookie.map(c =>
        c.replace(/;\s*Domain=[^;]+/i, '')
      );
    }
  });
};

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // API는 그대로
      '/api': {
        target: TARGET,
        changeOrigin: true,
        secure: true,
        configure: stripCookieDomain,
        // 백엔드가 /me 처럼 api prefix가 없다면 주석 해제:
        // rewrite: p => p.replace(/^\/api/, ''),
      },
      // ✅ OAuth 시작/콜백은 /auth로 프록시 (여기에 /api 붙이지 않음)
      '/auth': {
        target: TARGET,
        changeOrigin: true,
        secure: true,
        configure: stripCookieDomain,
      },
    },
  },
});
