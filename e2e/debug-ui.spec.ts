import { test, expect } from '@playwright/test';
import { dragNodeToCanvas, setupChineseFontSupport, handleAssetDialogQuick } from './test-utils';

test.describe('调试 UI 元素', () => {
  test.beforeEach(async ({ page }) => {
    // 设置中文字体支持
    await setupChineseFontSupport(page);

    await page.goto('/');
    await page.waitForSelector('.flow-sidebar', { timeout: 10000 });
  });

  test('检查控制按钮 class 名称', async ({ page }) => {
    // 创建一个节点
    await dragNodeToCanvas(page, 'palette-node-mysql-数据库', 300, 200);
    await handleAssetDialogQuick(page);
    await page.waitForTimeout(500);

    // 查找控制按钮
    const controls = page.locator('.vue-flow__controls button');
    const count = await controls.count();
    console.log('找到控制按钮数量:', count);

    // 列出所有按钮的 class
    for (let i = 0; i < count; i++) {
      const btn = controls.nth(i);
      const className = await btn.getAttribute('class');
      const ariaLabel = await btn.getAttribute('aria-label');
      console.log(`按钮 ${i}: class="${className}", aria-label="${ariaLabel}"`);
    }

    // 截图
    await page.screenshot({ path: 'test-results/debug-controls.png' });
  });

  test('检查节点选中后的 class', async ({ page }) => {
    // 创建一个节点
    await dragNodeToCanvas(page, 'palette-node-mysql-数据库', 300, 200);
    await handleAssetDialogQuick(page);
    await page.waitForTimeout(500);

    // 等待节点出现
    await page.waitForSelector('.vue-flow__node', { timeout: 5000 });
    const node = page.locator('.vue-flow__node').first();

    // 选中前的 class
    const classBefore = await node.getAttribute('class');
    console.log('选中前 class:', classBefore);

    // 点击选中
    await node.click();
    await page.waitForTimeout(500);

    // 选中后的 class
    const classAfter = await node.getAttribute('class');
    console.log('选中后 class:', classAfter);

    // 尝试 Shift+Click 多选
    await page.keyboard.down('Shift');
    await node.click();
    await page.keyboard.up('Shift');
    await page.waitForTimeout(500);

    const classAfterShift = await node.getAttribute('class');
    console.log('Shift+Click 后 class:', classAfterShift);
  });
});
