import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import istanbul from 'vite-plugin-istanbul'

// 检查是否需要启用代码覆盖率检测
const enableCoverage = process.env.VITE_COVERAGE === 'true';

export default defineConfig({
  plugins: [
    react(),
    istanbul({
      exclude: ['node_modules', 'tests/mocks/**', '**/*.test.{js,jsx,ts,tsx}', 'cypress/'],
      extension: ['.js', '.jsx', '.ts', '.tsx'],
      requireEnv: false,
      enabled: enableCoverage
    })
  ],
  server: {
    port: 5173, 
    strictPort: false, 
    force: true, 
    headers: {
      
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Credentials': 'true'
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setupTests.js',
    globals: true,
    css: true,
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/mocks/**',
        '**/*.d.ts',
        '**/*.test.{js,jsx,ts,tsx}',
        'cypress/'
      ],
      all: true
    }
  }
})
