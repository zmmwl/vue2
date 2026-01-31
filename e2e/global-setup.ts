import { FullConfig } from '@playwright/test';

/**
 * Playwright 全局设置
 * 在所有测试运行前执行
 */
async function globalSetup(config: FullConfig) {
  // 设置环境变量确保中文正确显示
  process.env.LC_ALL = 'zh_CN.UTF-8';
  process.env.LANG = 'zh_CN.UTF-8';

  // 设置 Node.js 编码
  if (process.stdout.isTTY) {
    process.stdout.write('\x1b]0;setenvs\x07');
  }
}

export default globalSetup;
