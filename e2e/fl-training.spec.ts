import { test, expect } from '@playwright/test';
import { setupTestEnvironment, createFLTaskNodeDirectly } from './test-utils';

test.describe('联邦学习卡片菜单测试', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
    await page.goto('/');
    await page.waitForSelector('.flow-sidebar', { timeout: 10000 });
  });

  test('应该显示联邦学习卡片', async ({ page }) => {
    const flCard = page.locator('.fl-trigger-card');
    await expect(flCard).toBeVisible();
    await expect(flCard.locator('.palette-node-label')).toHaveText('联邦学习');
  });

  test('悬停联邦学习卡片应该展开子菜单', async ({ page }) => {
    const flCard = page.locator('.fl-trigger-card');
    await flCard.hover();
    await page.waitForTimeout(500);

    // 检查子菜单是否出现
    const submenu = page.locator('.fl-card-submenu');
    await expect(submenu).toBeVisible();

    // 检查训练/推断 Tab 是否存在
    const tabs = submenu.locator('.fl-mode-tab');
    await expect(tabs).toHaveCount(2);
  });

  test('子菜单应该显示四个任务类别', async ({ page }) => {
    const flCard = page.locator('.fl-trigger-card');
    await flCard.hover();
    await page.waitForTimeout(500);

    const categories = page.locator('.fl-category-card');
    await expect(categories).toHaveCount(4);

    const categoryNames = await categories.locator('.category-name').allTextContents();
    expect(categoryNames).toContain('预处理');
    expect(categoryNames).toContain('特征工程');
    expect(categoryNames).toContain('横向模型');
    expect(categoryNames).toContain('纵向模型');
  });

  test('悬停类别应该显示任务列表', async ({ page }) => {
    const flCard = page.locator('.fl-trigger-card');
    await flCard.hover();
    await page.waitForTimeout(500);

    // 悬停第一个类别
    const firstCategory = page.locator('.fl-category-card').first();
    await firstCategory.hover();
    await page.waitForTimeout(300);

    // 检查任务卡片是否出现
    const taskCard = page.locator('.fl-task-card');
    await expect(taskCard).toBeVisible();

    // 检查任务列表是否有内容
    const tasks = taskCard.locator('.task-item');
    const count = await tasks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('切换到推断模式应该显示推断任务', async ({ page }) => {
    const flCard = page.locator('.fl-trigger-card');
    await flCard.hover();
    await page.waitForTimeout(500);

    // 点击推断 Tab
    const inferenceTab = page.locator('.fl-mode-tab').filter({ hasText: '推断' });
    await inferenceTab.click();
    await page.waitForTimeout(200);

    // 验证 Tab 状态
    await expect(inferenceTab).toHaveClass(/is-active/);
  });
});

test.describe('联邦学习任务节点创建', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
    await page.goto('/');
    await page.waitForSelector('.flow-sidebar', { timeout: 10000 });
  });

  test('应该能够创建预处理任务节点', async ({ page }) => {
    await createFLTaskNodeDirectly(page, 'preprocess_data_align', 'preprocess', 'training');

    // 验证节点创建成功
    const nodes = page.locator('.vue-flow__node');
    const count = await nodes.count();
    expect(count).toBeGreaterThan(0);
  });

  test('应该能够创建特征工程任务节点', async ({ page }) => {
    await createFLTaskNodeDirectly(page, 'feature_selection', 'feature_engineering', 'training');

    const nodes = page.locator('.vue-flow__node');
    const count = await nodes.count();
    expect(count).toBeGreaterThan(0);
  });

  test('应该能够创建横向模型任务节点', async ({ page }) => {
    await createFLTaskNodeDirectly(page, 'horizontal_lr', 'horizontal_model', 'training');

    const nodes = page.locator('.vue-flow__node');
    const count = await nodes.count();
    expect(count).toBeGreaterThan(0);
  });

  test('应该能够创建纵向模型任务节点', async ({ page }) => {
    await createFLTaskNodeDirectly(page, 'vertical_lr', 'vertical_model', 'training');

    const nodes = page.locator('.vue-flow__node');
    const count = await nodes.count();
    expect(count).toBeGreaterThan(0);
  });

  test('FL 任务节点应该可见', async ({ page }) => {
    await createFLTaskNodeDirectly(page, 'preprocess_data_align', 'preprocess', 'training');

    const node = page.locator('.vue-flow__node').first();
    await expect(node).toBeVisible();
  });
});

test.describe('联邦学习任务详情', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
    await page.goto('/');
    await page.waitForSelector('.flow-sidebar', { timeout: 10000 });
  });

  test('创建 FL 任务后详情面板应该可见', async ({ page }) => {
    await createFLTaskNodeDirectly(page, 'preprocess_data_align', 'preprocess', 'training');

    // 点击节点选中
    const node = page.locator('.vue-flow__node').first();
    await node.click();

    // 检查详情面板
    const detailPanel = page.locator('.flow-detail-panel');
    await expect(detailPanel).toBeVisible();
  });
});
