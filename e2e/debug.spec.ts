import { test, expect } from '@playwright/test';

test.describe('调试测试 - data-testid 验证', () => {
  test.skip('检查渲染后的 HTML 属性', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 获取所有 palette-node 元素
    const nodes = page.locator('.palette-node');
    const count = await nodes.count();
    console.log('找到 palette 节点数量:', count);

    // 检查第一个节点的 HTML
    const firstNode = nodes.first();
    const html = await firstNode.innerHTML();
    console.log('第一个节点 innerHTML:', html);

    // 获取 outerHTML
    const outerHtml = await firstNode.evaluate((el: any) => el.outerHTML);
    console.log('第一个节点 outerHTML:', outerHtml);

    // 检查所有属性
    const attributes = await firstNode.evaluate((el: any) => {
      const attrs: Record<string, string> = {};
      for (let attr of el.attributes) {
        attrs[attr.name] = attr.value;
      }
      return attrs;
    });
    console.log('第一个节点的所有属性:', JSON.stringify(attributes, null, 2));

    // 截图
    await page.screenshot({ path: 'test-results/debug-html-check.png' });
  });

  test('使用不同方式选择元素', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 方式 1: 通过 class
    const byClass = page.locator('.palette-node').first();
    console.log('通过 class 可见:', await byClass.isVisible());

    // 方式 2: 通过文本内容
    const byText = page.locator('.palette-node', { hasText: 'MySQL' }).first();
    console.log('通过文本内容 可见:', await byText.isVisible());

    // 方式 3: 通过属性选择器（小写）
    const byAttrLower = page.locator('[data-testid]').first();
    console.log('通过 [data-testid] 可见:', await byAttrLower.isVisible());

    // 获取所有有 data-testid 的元素数量
    const withTestid = await page.locator('[data-testid]').count();
    console.log('有 data-testid 属性的元素数量:', withTestid);

    // 列出前几个 data-testid 的值
    const testids = await page.locator('[data-testid]').all();
    for (let i = 0; i < Math.min(5, testids.length); i++) {
      const value = await testids[i].getAttribute('data-testid');
      console.log(`元素 ${i} 的 data-testid:`, value);
    }
  });
});
