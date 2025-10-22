// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const DEV_TARGET = 'http://localhost:8787'
const REPO_BASE = '/runningcrew/' // GitHub Pages용 베이스 경로

export default defineConfig(({ command }) => {
  const isDev = command === 'serve'

  return {
    plugins: [react()],
    // GH Pages 배포 시 /runningcrew/ 로 빌드, 로컬 dev는 /
    base: isDev ? '/' : REPO_BASE,

    server: {
      proxy: {
        '/api': {
          target: DEV_TARGET,
          changeOrigin: true,
          secure: false,
          // /api → '' 로 바꿔서 백엔드의 /me 등으로 전달
          rewrite: (path) => path.replace(/^\/api/, ''),
          // 로컬에서 Set-Cookie의 Domain 제거 → localhost에 세션 저장
          configure: (proxy) => {
            proxy.on('proxyRes', (res) => {
              const sc = res.headers['set-cookie']
              if (sc) {
                res.headers['set-cookie'] = sc.map((c) =>
                  c.replace(/;\s*Domain=[^;]+/i, '')
                )
              }
            })
          },
        },
        // OAuth 시작/콜백은 /auth 그대로 프록시
        '/auth': { target: DEV_TARGET, changeOrigin: true, secure: false },
      },
    },
  }
})
