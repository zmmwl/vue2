import { test, expect } from '@playwright/test';
import { setupTestEnvironment, createFLTaskNodeDirectly } from './test-utils';

test.describe('联邦学习推断功能测试', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
    await page.goto('/');
    await page.waitForSelector('.flow-sidebar', { timeout: 10000 });
  });

  test('联邦学习卡片应该可见', async ({ page }) => {
    const flCard = page.locator('.fl-trigger-card');
    await expect(flCard).toBeVisible();
  });

  test('展开子菜单后切换到推断模式', async ({ page }) => {
    const flCard = page.locator('.fl-trigger-card');
    await flCard.hover();
    await page.waitForTimeout(500);

    const submenu = page.locator('.fl-card-submenu');
    await expect(submenu).toBeVisible();

    // 点击推断 Tab
    const inferenceTab = page.locator('.fl-mode-tab').filter({ hasText: '推断' });
    await inferenceTab.click();
    await page.waitForTimeout(200);

    await expect(inferenceTab).toHaveClass(/is-active/);
  });

  test('推断模式应该显示所有类别', async ({ page }) => {
    const flCard = page.locator('.fl-trigger-card');
    await flCard.hover();
    await page.waitForTimeout(500);

    // 点击推断 Tab
    const inferenceTab = page.locator('.fl-mode-tab').filter({ hasText: '推断' });
    await inferenceTab.click();
    await page.waitForTimeout(200);

    // 检查类别数量
    const categories = page.locator('.fl-category-card');
    await expect(categories).toHaveCount(4);
  });

  test('应该能够创建推断任务节点', async ({ page }) => {
    await createFLTaskNodeDirectly(page, 'preprocess_data_align', 'preprocess', 'inference');

    const nodes = page.locator('.vue-flow__node');
    const count = await nodes.count();
    expect(count).toBeGreaterThan(0);
  });

  test('推断任务节点应该可见', async ({ page }) => {
    await createFLTaskNodeDirectly(page, 'feature_selection', 'feature_engineering', 'inference');

    const node = page.locator('.vue-flow__node').first();
    await expect(node).toBeVisible();
  });
});

test.describe('联邦学习推断任务详情', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
    await page.goto('/');
    await page.waitForSelector('.flow-sidebar', { timeout: 10000 });
  });

  test('选中推断任务应该显示详情面板', async ({ page }) => {
    await createFLTaskNodeDirectly(page, 'preprocess_data_align', 'preprocess', 'inference');

    const node = page.locator('.vue-flow__node').first();
    await node.click();

    const detailPanel = page.locator('.flow-detail-panel');
    await expect(detailPanel).toBeVisible();
  });
});
