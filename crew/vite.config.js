export default {
  server: {
    proxy: {
      '/api': {
        target: 'https://runcrew-backend.popple1101.workers.dev',
        changeOrigin: true,
        secure: true,
        // 필요하면 쿠키 도메인 재작성
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            const setCookie = proxyRes.headers['set-cookie'];
            if (setCookie) {
              // Domain=... 있으면 제거 → localhost에 쿠키 심기
              proxyRes.headers['set-cookie'] = setCookie.map(c =>
                c.replace(/;\s*Domain=[^;]+/i, '')
              );
            }
          });
        },
      },
    },
  },
};
