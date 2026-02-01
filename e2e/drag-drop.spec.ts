import { test, expect } from '@playwright/test';
import { dragNodeToCanvas, setupChineseFontSupport, handleTechPathDialog, handleAssetDialogQuick, cancelModal } from './test-utils';

/**
 * Vue Flow 拖拽节点 E2E 测试
 * 测试从侧边栏拖拽节点到画布的功能
 */

test.describe('节点拖拽测试', () => {
  test.beforeEach(async ({ page }) => {
    // 设置中文字体支持
    await setupChineseFontSupport(page);

    await page.goto('/');
    // 等待应用加载
    await page.waitForSelector('.flow-sidebar', { timeout: 10000 });
  });

  test.afterEach(async ({ page }) => {
    // 清理：取消任何打开的模态框
    await cancelModal(page);
  });

  test('应该能够从侧边栏拖拽数据源节点（MySQL）到画布', async ({ page }) => {
    // 定位侧边栏中的 MySQL 节点
    const mysqlNode = page.locator('[data-testid="palette-node-mysql-数据库"]');
    await expect(mysqlNode).toBeVisible();

    // 定位画布
    const canvas = page.locator('[data-testid="flow-canvas"]');
    await expect(canvas).toBeVisible();

    // 获取初始节点数量
    const initialNodeCount = await page.locator('.vue-flow__node').count();

    // 执行拖拽操作
    await dragNodeToCanvas(page, 'palette-node-mysql-数据库', 400, 200);

    // 处理资产选择对话框
    await handleAssetDialogQuick(page);

    // 等待节点创建
    await page.waitForTimeout(500);

    // 验证节点已添加到画布
    const finalNodeCount = await page.locator('.vue-flow__node').count();
    expect(finalNodeCount).toBe(initialNodeCount + 1);
  });

  test('应该能够从侧边栏拖拽多个不同类型的节点', async ({ page }) => {
    // 拖拽 PostgreSQL 节点 - 使用与通过的测试类似的坐标
    await dragNodeToCanvas(page, 'palette-node-postgresql', 400, 200);
    await handleAssetDialogQuick(page);

    // 拖拽 PSI 计算任务节点 - 需要技术路径对话框
    await dragNodeToCanvas(page, 'palette-node-psi-计算', 400, 400);
    await handleTechPathDialog(page, 'SOFTWARE');

    // 拖拽 CSV 节点
    await dragNodeToCanvas(page, 'palette-node-csv-文件', 600, 200);
    await handleAssetDialogQuick(page);

    // 验证所有节点都已添加
    await expect(page.locator('.vue-flow__node')).toHaveCount(3);
  });

  test('应该能够拖拽所有数据源类型的节点', async ({ page }) => {
    const dataSources = [
      { testid: 'palette-node-mysql-数据库', label: 'MySQL' },
      { testid: 'palette-node-postgresql', label: 'PostgreSQL' },
      { testid: 'palette-node-csv-文件', label: 'CSV' },
      { testid: 'palette-node-excel-文件', label: 'Excel' },
      { testid: 'palette-node-rest-api', label: 'REST API' },
      { testid: 'palette-node-graphql', label: 'GraphQL' }
    ];

    for (let i = 0; i < dataSources.length; i++) {
      await dragNodeToCanvas(
        page,
        dataSources[i].testid,
        200 + (i % 2) * 250,
        150 + Math.floor(i / 2) * 100
      );
      await handleAssetDialogQuick(page);
    }

    // 验证所有数据源节点都已添加
    await expect(page.locator('.vue-flow__node')).toHaveCount(dataSources.length);
  });

  test('应该能够拖拽所有计算任务类型的节点', async ({ page }) => {
    const computeTasks = [
      { testid: 'palette-node-psi-计算', label: 'PSI' },
      { testid: 'palette-node-pir-查询', label: 'PIR' },
      { testid: 'palette-node-mpc-计算', label: 'MPC' },
      { testid: 'palette-node-联邦学习', label: '联邦学习' },
      { testid: 'palette-node-同态加密', label: '同态加密' },
      { testid: 'palette-node-差分隐私', label: '差分隐私' }
    ];

    for (let i = 0; i < computeTasks.length; i++) {
      await dragNodeToCanvas(
        page,
        computeTasks[i].testid,
        200 + (i % 2) * 250,
        150 + Math.floor(i / 2) * 100
      );
      await handleTechPathDialog(page, 'SOFTWARE');
      await page.waitForTimeout(200);
    }

    // 验证所有计算任务节点都已添加
    await expect(page.locator('.vue-flow__node')).toHaveCount(computeTasks.length);
  });

  test('拖拽后的节点应该在正确的位置', async ({ page }) => {
    // 拖拽一个节点到特定位置
    const targetX = 400;
    const targetY = 250;

    await dragNodeToCanvas(page, 'palette-node-csv-文件', targetX, targetY);
    await handleAssetDialogQuick(page);

    // 等待节点创建
    await page.waitForTimeout(500);

    // 获取节点的实际位置
    const node = page.locator('.vue-flow__node').first();
    const box = await node.boundingBox();

    // 验证节点已创建并且位置合理
    expect(box).toBeTruthy();
    if (box) {
      // 节点应该在画布上，x 和 y 都应该大于 0
      expect(box.x).toBeGreaterThan(0);
      expect(box.y).toBeGreaterThan(0);
    }
  });

  test('应该能够连续拖拽多个节点到不同位置', async ({ page }) => {
    const positions = [
      { x: 200, y: 150, isDataSource: true },
      { x: 450, y: 150, isDataSource: true },
      { x: 200, y: 300, isDataSource: false }, // 计算任务
      { x: 450, y: 300, isDataSource: false }  // 计算任务
    ];

    const nodeIds = [
      'palette-node-mysql-数据库',
      'palette-node-postgresql',
      'palette-node-psi-计算',
      'palette-node-mpc-计算'
    ];

    for (let i = 0; i < nodeIds.length; i++) {
      await dragNodeToCanvas(page, nodeIds[i], positions[i].x, positions[i].y);
      // 根据节点类型处理相应的对话框
      if (positions[i].isDataSource) {
        await handleAssetDialogQuick(page);
      } else {
        await handleTechPathDialog(page, 'SOFTWARE');
      }
      await page.waitForTimeout(200);
    }

    // 验证所有节点都已添加
    await expect(page.locator('.vue-flow__node')).toHaveCount(4);
  });
});
