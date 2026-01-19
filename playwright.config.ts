import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 配置文件
 * 用于 Vue Flow 流程编辑器的 E2E 测试
 */
export default defineConfig({
  testDir: './e2e',

  /* 并行运行测试，加快执行速度 */
  fullyParallel: true,

  /* 在 CI 中禁止使用 test.only */
  forbidOnly: !!process.env.CI,

  /* CI 环境下失败重试 2 次 */
  retries: process.env.CI ? 2 : 0,

  /* CI 环境下使用单 worker */
  workers: process.env.CI ? 1 : undefined,

  /* 测试报告 */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],

  /* 共享配置 */
  use: {
    /* 基础 URL 对应 Vite 开发服务器 */
    baseURL: 'http://localhost:5172',

    /* 失败时自动捕获 trace */
    trace: 'on-first-retry',

    /* 失败时截图 */
    screenshot: 'only-on-failure',

    /* 测试视频 */
    video: 'retain-on-failure',
  },

  /* 不同浏览器配置 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* 启动开发服务器 */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5172',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
