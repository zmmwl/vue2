import { test, expect } from '@playwright/test';
import {
  setupTestEnvironment,
  createFLTaskNodeDirectly,
  hoverAndExpandFLTrainingMenu,
  hoverAndExpandFLCategory
} from './test-utils';

/**
 * E2E 测试：联邦学习训练功能
 * 测试 FL 训练菜单展开、任务拖拽、节点配置
 */

test.describe('联邦学习训练菜单', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
    await page.goto('/');
    await page.waitForSelector('.flow-sidebar', { timeout: 10000 });
  });

  test('应该显示联邦学习训练菜单入口', async ({ page }) => {
    const flSection = page.locator('.fl-section').filter({ hasText: '联邦学习训练' });
    await expect(flSection).toBeVisible();
    await expect(flSection.locator('.section-title')).toContainText('联邦学习训练');
  });

  test('悬停联邦学习训练应该展开子菜单', async ({ page }) => {
    await hoverAndExpandFLTrainingMenu(page);

    // 验证子菜单出现
    const submenu = page.locator('.fl-submenu');
    const count = await submenu.count();
    expect(count).toBeGreaterThan(0);
  });

  test('应该显示四个任务类型类别', async ({ page }) => {
    await hoverAndExpandFLTrainingMenu(page);

    // 验证四个类别存在
    const categories = ['预处理', '特征工程', '横向模型', '纵向模型'];
    for (const cat of categories) {
      const categoryLocator = page.locator('.fl-category-title').filter({ hasText: cat });
      const count = await categoryLocator.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('悬停预处理类别应该显示任务列表', async ({ page }) => {
    await hoverAndExpandFLTrainingMenu(page);
    await hoverAndExpandFLCategory(page, '预处理');

    // 验证任务节点出现
    const taskNodes = page.locator('.fl-task-node');
    const count = await taskNodes.count();
    expect(count).toBeGreaterThan(0);
  });

  test('悬停特征工程类别应该显示任务列表', async ({ page }) => {
    await hoverAndExpandFLTrainingMenu(page);
    await hoverAndExpandFLCategory(page, '特征工程');

    // 验证任务节点出现
    const taskNodes = page.locator('.fl-task-node');
    const count = await taskNodes.count();
    expect(count).toBeGreaterThan(0);
  });

  test('悬停横向模型类别应该显示任务列表', async ({ page }) => {
    await hoverAndExpandFLTrainingMenu(page);
    await hoverAndExpandFLCategory(page, '横向模型');

    // 验证任务节点出现
    const taskNodes = page.locator('.fl-task-node');
    const count = await taskNodes.count();
    expect(count).toBeGreaterThan(0);
  });

  test('悬停纵向模型类别应该显示任务列表', async ({ page }) => {
    await hoverAndExpandFLTrainingMenu(page);
    await hoverAndExpandFLCategory(page, '纵向模型');

    // 验证任务节点出现
    const taskNodes = page.locator('.fl-task-node');
    const count = await taskNodes.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('联邦学习训练节点创建', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
    await page.goto('/');
    await page.waitForSelector('.flow-sidebar', { timeout: 10000 });
  });

  test('应该能够创建预处理任务节点', async ({ page }) => {
    await createFLTaskNodeDirectly(page, {
      taskName: 'data_cleaning',
      taskDisplayName: '数据清洗',
      category: 'preprocessing',
      mode: 'training',
      icon: '🧹'
    });

    // 验证节点创建
    const nodes = page.locator('.vue-flow__node');
    await expect(nodes).toHaveCount(1);

    // 验证节点标签
    const node = nodes.first();
    await expect(node).toContainText('数据清洗');
  });

  test('应该能够创建特征工程任务节点', async ({ page }) => {
    await createFLTaskNodeDirectly(page, {
      taskName: 'feature_selection',
      taskDisplayName: '特征选择',
      category: 'feature_engineering',
      mode: 'training',
      icon: '🔬'
    });

    // 验证节点创建
    const nodes = page.locator('.vue-flow__node');
    await expect(nodes).toHaveCount(1);

    // 验证节点标签
    const node = nodes.first();
    await expect(node).toContainText('特征选择');
  });

  test('应该能够创建横向模型任务节点', async ({ page }) => {
    await createFLTaskNodeDirectly(page, {
      taskName: 'horizontal_lr',
      taskDisplayName: '横向逻辑回归',
      category: 'horizontal_model',
      mode: 'training',
      icon: '📊'
    });

    // 验证节点创建
    const nodes = page.locator('.vue-flow__node');
    await expect(nodes).toHaveCount(1);
  });

  test('应该能够创建纵向模型任务节点', async ({ page }) => {
    await createFLTaskNodeDirectly(page, {
      taskName: 'vertical_nn',
      taskDisplayName: '纵向神经网络',
      category: 'vertical_model',
      mode: 'training',
      icon: '🧠'
    });

    // 验证节点创建
    const nodes = page.locator('.vue-flow__node');
    await expect(nodes).toHaveCount(1);
  });

  test('FL 任务节点应该可见', async ({ page }) => {
    await createFLTaskNodeDirectly(page, {
      taskName: 'data_cleaning',
      taskDisplayName: '数据清洗',
      category: 'preprocessing',
      mode: 'training',
      icon: '🧹'
    });

    // 验证节点存在
    const nodes = page.locator('.vue-flow__node');
    const count = await nodes.count();
    expect(count).toBe(1);
  });
});

test.describe('联邦学习训练任务详情', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
    await page.goto('/');
    await page.waitForSelector('.flow-sidebar', { timeout: 10000 });
  });

  test('创建 FL 任务后详情面板应该可见', async ({ page }) => {
    await createFLTaskNodeDirectly(page, {
      taskName: 'data_cleaning',
      taskDisplayName: '数据清洗',
      category: 'preprocessing',
      mode: 'training',
      icon: '🧹'
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
