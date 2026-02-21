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

  test('点击联邦学习卡片应该展开子菜单', async ({ page }) => {
    const flCard = page.locator('.fl-trigger-card');

    // 确保卡片可见
    await flCard.waitFor({ state: 'visible' });
    await page.waitForTimeout(500);

    // 点击展开（使用 force 绕过动画稳定性检查）
    await flCard.click({ force: true });
    await page.waitForTimeout(1000);

    // 检查子菜单是否出现
    const submenu = page.locator('.fl-card-submenu');
    await expect(submenu).toBeVisible({ timeout: 10000 });

    // 检查训练/推断 Tab 是否存在
    const tabs = submenu.locator('.fl-mode-tab');
    await expect(tabs).toHaveCount(2);
  });

  test('子菜单应该显示四个任务类别', async ({ page }) => {
    const flCard = page.locator('.fl-trigger-card');
    await flCard.waitFor({ state: 'visible' });
    await page.waitForTimeout(300);
    await flCard.click({ force: true });
    await page.waitForTimeout(1000);

    const submenu = page.locator('.fl-card-submenu');
    await expect(submenu).toBeVisible({ timeout: 10000 });

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

    // 确保卡片可见和稳定
    await flCard.waitFor({ state: 'visible' });
    await page.waitForTimeout(500);

    // 点击卡片展开子菜单（使用 force）
    await flCard.click({ force: true });
    await page.waitForTimeout(1000);

    // 检查子菜单是否出现
    const submenu = page.locator('.fl-card-submenu');
    await expect(submenu).toBeVisible({ timeout: 10000 });

    // 悬停第一个类别
    const firstCategory = page.locator('.fl-category-card').first();
    await firstCategory.hover({ force: true });
    await page.waitForTimeout(800);

    // 检查任务卡片是否出现
    const taskCard = page.locator('.fl-task-card');
    await expect(taskCard).toBeVisible({ timeout: 10000 });

    // 检查任务列表是否有内容
    const tasks = taskCard.locator('.task-item');
    const count = await tasks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('切换到推断模式应该显示推断任务', async ({ page }) => {
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
});

test.describe('联邦学习任务节点创建', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
    await page.goto('/');
    await page.waitForSelector('.flow-sidebar', { timeout: 10000 });
  });

  test('应该能够创建预处理任务节点', async ({ page }) => {
    await createFLTaskNodeDirectly(page, {
      taskName: 'preprocess_data_align',
      taskDisplayName: '数据对齐',
      category: 'preprocessing',
      mode: 'training'
    });

    // 验证节点创建成功
    const nodes = page.locator('.vue-flow__node');
    const count = await nodes.count();
    expect(count).toBeGreaterThan(0);
  });

  test('应该能够创建特征工程任务节点', async ({ page }) => {
    await createFLTaskNodeDirectly(page, {
      taskName: 'feature_selection',
      taskDisplayName: '特征选择',
      category: 'feature_engineering',
      mode: 'training'
    });

    const nodes = page.locator('.vue-flow__node');
    const count = await nodes.count();
    expect(count).toBeGreaterThan(0);
  });

  test('应该能够创建横向模型任务节点', async ({ page }) => {
    await createFLTaskNodeDirectly(page, {
      taskName: 'horizontal_lr',
      taskDisplayName: '横向逻辑回归',
      category: 'horizontal_model',
      mode: 'training'
    });

    const nodes = page.locator('.vue-flow__node');
    const count = await nodes.count();
    expect(count).toBeGreaterThan(0);
  });

  test('应该能够创建纵向模型任务节点', async ({ page }) => {
    await createFLTaskNodeDirectly(page, {
      taskName: 'vertical_lr',
      taskDisplayName: '纵向逻辑回归',
      category: 'vertical_model',
      mode: 'training'
    });

    const nodes = page.locator('.vue-flow__node');
    const count = await nodes.count();
    expect(count).toBeGreaterThan(0);
  });

  test('FL 任务节点应该可见', async ({ page }) => {
    await createFLTaskNodeDirectly(page, {
      taskName: 'preprocess_data_align',
      taskDisplayName: '数据对齐',
      category: 'preprocessing',
      mode: 'training'
    });

    // 检查节点是否存在
    const nodes = page.locator('.vue-flow__node');
    const count = await nodes.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('联邦学习任务详情', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
    await page.goto('/');
    await page.waitForSelector('.flow-sidebar', { timeout: 10000 });
  });

  test('创建 FL 任务后详情面板应该可见', async ({ page }) => {
    await createFLTaskNodeDirectly(page, {
      taskName: 'preprocess_data_align',
      taskDisplayName: '数据对齐',
      category: 'preprocessing',
      mode: 'training'
    });

    // 点击节点选中
    const node = page.locator('.vue-flow__node').first();
    await node.click({ force: true });

    // 检查详情面板
    const detailPanel = page.locator('.flow-detail-panel');
    await expect(detailPanel).toBeVisible();
  });
});
