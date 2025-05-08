import { defineConfig } from 'cypress';
import codeCoverageTask from '@cypress/code-coverage/task.js';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    viewportWidth: 1280,
    viewportHeight: 800,
    defaultCommandTimeout: 10000,
    setupNodeEvents(on, config) {
      // 启用代码覆盖率收集
      codeCoverageTask(on, config);
      return config;
    },
  },
  // Allow videos to be created in CI environments
  video: true,
  // Automatically take screenshots on test failures
  screenshotOnRunFailure: true,
  // 配置Mochawesome报告
  reporter: 'mochawesome',
  reporterOptions: {
    reportDir: 'cypress/reports/mochawesome-report',
    overwrite: false,
    html: true,
    json: true
  }
}); 