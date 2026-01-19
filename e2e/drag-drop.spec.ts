import { test, expect } from '@playwright/test';

/**
 * Vue Flow 拖拽节点 E2E 测试
 * 测试从侧边栏拖拽节点到画布的功能
 */

test.describe('节点拖拽测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 等待应用加载
    await page.waitForSelector('.flow-sidebar', { timeout: 10000 });
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
    await mysqlNode.dragTo(canvas, {
      targetPosition: { x: 400, y: 200 }
    });

    // 等待节点出现
    await page.waitForTimeout(500);

    // 验证节点已添加到画布
    const finalNodeCount = await page.locator('.vue-flow__node').count();
    expect(finalNodeCount).toBe(initialNodeCount + 1);

    // 验证新节点是数据源节点
    const newNode = page.locator('.vue-flow__node').nth(initialNodeCount);
    await expect(newNode).toContainText('MySQL');
  });

  test('应该能够从侧边栏拖拽多个不同类型的节点', async ({ page }) => {
    // 拖拽 PostgreSQL 节点
    const postgresNode = page.locator('[data-testid="palette-node-postgresql"]');
    await postgresNode.dragTo(page.locator('[data-testid="flow-canvas"]'), {
      targetPosition: { x: 300, y: 150 }
    });
    await page.waitForTimeout(300);

    // 拖拽 PSI 计算任务节点
    const psiNode = page.locator('[data-testid="palette-node-psi-计算"]');
    await psiNode.dragTo(page.locator('[data-testid="flow-canvas"]'), {
      targetPosition: { x: 300, y: 350 }
    });
    await page.waitForTimeout(300);

    // 拖拽 CSV 节点
    const csvNode = page.locator('[data-testid="palette-node-csv-文件"]');
    await csvNode.dragTo(page.locator('[data-testid="flow-canvas"]'), {
      targetPosition: { x: 500, y: 150 }
    });
    await page.waitForTimeout(300);

    // 验证所有节点都已添加
    await expect(page.locator('.vue-flow__node')).toHaveCount(3);

    // 验证节点类型正确
    await expect(page.locator('.vue-flow__node').filter({ hasText: 'PostgreSQL' })).toBeVisible();
    await expect(page.locator('.vue-flow__node').filter({ hasText: 'PSI' })).toBeVisible();
    await expect(page.locator('.vue-flow__node').filter({ hasText: 'CSV' })).toBeVisible();
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
      const node = page.locator(`[data-testid="${dataSources[i].testid}"]`);

      await node.dragTo(page.locator('[data-testid="flow-canvas"]'), {
        targetPosition: { x: 200 + (i % 2) * 250, y: 150 + Math.floor(i / 2) * 100 }
      });
      await page.waitForTimeout(200);
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
      const node = page.locator(`[data-testid="${computeTasks[i].testid}"]`);

      await node.dragTo(page.locator('[data-testid="flow-canvas"]'), {
        targetPosition: { x: 200 + (i % 2) * 250, y: 150 + Math.floor(i / 2) * 100 }
      });
      await page.waitForTimeout(200);
    }

    // 验证所有计算任务节点都已添加
    await expect(page.locator('.vue-flow__node')).toHaveCount(computeTasks.length);
  });

  test('拖拽后的节点应该在正确的位置', async ({ page }) => {
    // 拖拽一个节点到特定位置
    const csvNode = page.locator('[data-testid="palette-node-csv-文件"]');
    const targetX = 400;
    const targetY = 250;

    await csvNode.dragTo(page.locator('[data-testid="flow-canvas"]'), {
      targetPosition: { x: targetX, y: targetY }
    });
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
      { x: 200, y: 150 },
      { x: 450, y: 150 },
      { x: 200, y: 300 },
      { x: 450, y: 300 }
    ];

    const nodes = [
      page.locator('[data-testid="palette-node-mysql-数据库"]'),
      page.locator('[data-testid="palette-node-postgresql"]'),
      page.locator('[data-testid="palette-node-psi-计算"]'),
      page.locator('[data-testid="palette-node-mpc-计算"]')
    ];

    for (let i = 0; i < nodes.length; i++) {
      await nodes[i].dragTo(page.locator('[data-testid="flow-canvas"]'), {
        targetPosition: positions[i]
      });
      await page.waitForTimeout(200);
    }

    // 验证所有节点都已添加
    await expect(page.locator('.vue-flow__node')).toHaveCount(4);
  });
});
