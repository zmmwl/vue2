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
    await flCard.waitFor({ state: 'visible' });
    await page.waitForTimeout(300);
    await flCard.click({ force: true });
    await page.waitForTimeout(1000);

    const submenu = page.locator('.fl-card-submenu');
    await expect(submenu).toBeVisible({ timeout: 10000 });

    // 检查 Tab 是否存在
    const tabs = submenu.locator('.fl-mode-tab');
    await expect(tabs).toHaveCount(2);

    // 检查训练 Tab 默认激活
    const trainingTab = submenu.locator('.fl-mode-tab').filter({ hasText: '训练' });
    await expect(trainingTab).toHaveClass(/is-active/);
  });

  test('推断模式应该显示所有类别', async ({ page }) => {
    const flCard = page.locator('.fl-trigger-card');
    await flCard.waitFor({ state: 'visible' });
    await page.waitForTimeout(300);
    await flCard.click({ force: true });
    await page.waitForTimeout(1000);

    const submenu = page.locator('.fl-card-submenu');
    await expect(submenu).toBeVisible({ timeout: 10000 });

    // 先悬停在子菜单上
    await submenu.hover({ force: true });
    await page.waitForTimeout(200);

    // 点击推断 Tab
    const inferenceTab = submenu.locator('.fl-mode-tab').filter({ hasText: '推断' });
    await inferenceTab.dispatchEvent('click');
    await page.waitForTimeout(500);

    // 检查类别数量
    const categories = submenu.locator('.fl-category-card');
    await expect(categories).toHaveCount(4);
  });

  test('应该能够创建推断任务节点', async ({ page }) => {
    await createFLTaskNodeDirectly(page, {
      taskName: 'preprocess_data_align',
      taskDisplayName: '数据对齐',
      category: 'preprocessing',
      mode: 'inference'
    });

    const nodes = page.locator('.vue-flow__node');
    const count = await nodes.count();
    expect(count).toBeGreaterThan(0);
  });

  test('推断任务节点应该可见', async ({ page }) => {
    await createFLTaskNodeDirectly(page, {
      taskName: 'feature_selection',
      taskDisplayName: '特征选择',
      category: 'feature_engineering',
      mode: 'inference'
    });

    // 检查节点是否存在
    const nodes = page.locator('.vue-flow__node');
    const count = await nodes.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('联邦学习推断任务详情', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
    await page.goto('/');
    await page.waitForSelector('.flow-sidebar', { timeout: 10000 });
  });

  test('选中推断任务应该显示详情面板', async ({ page }) => {
    await createFLTaskNodeDirectly(page, {
      taskName: 'preprocess_data_align',
      taskDisplayName: '数据对齐',
      category: 'preprocessing',
      mode: 'inference'
    });

    const node = page.locator('.vue-flow__node').first();
    await node.click({ force: true });

    const detailPanel = page.locator('.flow-detail-panel');
    await expect(detailPanel).toBeVisible();
  });
});
