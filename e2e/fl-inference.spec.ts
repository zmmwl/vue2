import { test, expect } from '@playwright/test';
import {
  setupTestEnvironment,
  createFLTaskNodeDirectly,
  hoverAndExpandFLInferenceMenu
} from './test-utils';

/**
 * E2E 测试：联邦学习推断功能
 * 测试 FL 推断菜单展开、任务拖拽、节点配置
 */

test.describe('联邦学习推断菜单', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
    await page.goto('/');
    await page.waitForSelector('.flow-sidebar', { timeout: 10000 });
  });

  test('应该显示联邦学习推断菜单入口', async ({ page }) => {
    const flSection = page.locator('.fl-section').filter({ hasText: '联邦学习推断' });
    await expect(flSection).toBeVisible();
    await expect(flSection.locator('.section-title')).toContainText('联邦学习推断');
  });

  test('悬停联邦学习推断应该展开子菜单', async ({ page }) => {
    await hoverAndExpandFLInferenceMenu(page);

    // 验证子菜单出现
    const submenu = page.locator('.fl-submenu');
    const count = await submenu.count();
    expect(count).toBeGreaterThan(0);
  });

  test('推断菜单应该显示任务类别', async ({ page }) => {
    await hoverAndExpandFLInferenceMenu(page);

    // 验证类别存在（预处理、特征工程等）
    const categories = page.locator('.fl-category-title');
    const count = await categories.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('联邦学习推断节点创建', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
    await page.goto('/');
    await page.waitForSelector('.flow-sidebar', { timeout: 10000 });
  });

  test('应该能够创建推断任务节点', async ({ page }) => {
    await createFLTaskNodeDirectly(page, {
      taskName: 'model_inference',
      taskDisplayName: '模型推断',
      category: 'inference',
      mode: 'inference',
      icon: '🔮'
    });

    // 验证节点创建
    const nodes = page.locator('.vue-flow__node');
    await expect(nodes).toHaveCount(1);

    // 验证节点标签
    const node = nodes.first();
    await expect(node).toContainText('模型推断');
  });

  test('推断任务节点应该可见', async ({ page }) => {
    await createFLTaskNodeDirectly(page, {
      taskName: 'model_inference',
      taskDisplayName: '模型推断',
      category: 'inference',
      mode: 'inference',
      icon: '🔮'
    });

    // 验证节点存在
    const nodes = page.locator('.vue-flow__node');
    const count = await nodes.count();
    expect(count).toBe(1);
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
      taskName: 'model_inference',
      taskDisplayName: '模型推断',
      category: 'inference',
      mode: 'inference',
      icon: '🔮'
    });

    // 验证节点存在
    const nodes = page.locator('.vue-flow__node');
    const count = await nodes.count();
    expect(count).toBe(1);

    // 详情面板应该可见
    const detailPanel = page.locator('.flow-detail-panel');
    await expect(detailPanel).toBeVisible();
  });
});
