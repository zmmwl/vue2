import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 配置文件
 * 用于 Vue Flow 流程编辑器的 E2E 测试
 */
export default defineConfig({
  testDir: './e2e',

  /* 输出目录 - 使用新目录避免权限问题 */
  outputDir: 'test-results-output',

  /* 使用单个 worker，方便观察测试过程 */
  fullyParallel: false,
  workers: 1,

  /* 在 CI 中禁止使用 test.only */
  forbidOnly: !!process.env.CI,

  /* CI 环境下失败重试 2 次 */
  retries: process.env.CI ? 2 : 0,

  /* 全局超时配置（支持观察时间） */
  timeout: process.env.OBSERVE_TIME ? parseInt(process.env.OBSERVE_TIME) * 1000 + 30000 : 30000,

  /* 测试报告 */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list']
  ],

  /* 共享配置 */
  use: {
    /* 基础 URL 对应 Vite 开发服务器 */
    baseURL: 'http://localhost:5172',

    /* 默认无头模式 - 不显示浏览器窗口 */
    headless: true,

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

  // 禁用输出目录的自动清理（WSL 环境下可能有权限问题）
  ignoreSnapshots: true,
});
