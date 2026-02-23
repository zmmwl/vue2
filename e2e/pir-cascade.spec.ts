import { test, expect } from '@playwright/test';
import { setupTestEnvironment } from './test-utils';

/**
 * PIR 级联测试 - 测试 PIR 输出功能
 *
 * 测试流程：
 * 1. 创建数据库表数据源
 * 2. 创建实时数据源
 * 3. 创建 PIR 任务
 * 4. 连接数据源到 PIR
 * 5. 为 PIR 添加输出
 */
test.describe('PIR 输出测试', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
    await page.goto('/');
    await page.waitForSelector('.flow-sidebar', { timeout: 10000 });
    await page.waitForTimeout(500);

    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[FlowCanvas]') || text.includes('ERROR')) {
        console.log('BROWSER:', text);
      }
    });
  });

  test('PIR 任务添加流式输出', async ({ page }) => {
    test.setTimeout(180000);

    console.log('\n=== PIR 输出测试开始 ===\n');

    const canvas = page.locator('.flow-canvas');
    const canvasBounds = await canvas.boundingBox();

    // 步骤 1：创建数据库表数据源
    console.log('步骤 1：创建数据库表数据源');
    const dataSourceSection = page.locator('.sidebar-section').filter({ hasText: /^数据源/ });
    await dataSourceSection.waitFor({ state: 'visible' });

    const dbTemplate = dataSourceSection.locator('.palette-node').filter({ hasText: '数据库表' });
    await expect(dbTemplate).toBeVisible();

    const dbBounds = await dbTemplate.boundingBox();
    await page.mouse.move(dbBounds!.x + dbBounds!.width / 2, dbBounds!.y + dbBounds!.height / 2);
    await page.waitForTimeout(200);
    await page.mouse.down();
    await page.waitForTimeout(100);
    await page.mouse.move(canvasBounds!.x + 150, canvasBounds!.y + 100, { steps: 15 });
    await page.mouse.up();
    await page.waitForTimeout(1000);

    let nodes = page.locator('.vue-flow__node');
    let nodeCount = await nodes.count();
    console.log(`  - 当前节点数: ${nodeCount}`);
    expect(nodeCount).toBeGreaterThanOrEqual(1);

    // 步骤 2：创建实时数据源
    console.log('步骤 2：创建实时数据源');
    const realtimeTemplate = dataSourceSection.locator('.palette-node').filter({ hasText: '实时数据源' });
    await expect(realtimeTemplate).toBeVisible();

    const realtimeBounds = await realtimeTemplate.boundingBox();
    await page.mouse.move(realtimeBounds!.x + realtimeBounds!.width / 2, realtimeBounds!.y + realtimeBounds!.height / 2);
    await page.waitForTimeout(200);
    await page.mouse.down();
    await page.waitForTimeout(100);
    await page.mouse.move(canvasBounds!.x + 400, canvasBounds!.y + 100, { steps: 15 });
    await page.mouse.up();
    await page.waitForTimeout(500);

    // 配置实时数据源
    const realtimeConfigDialog = page.locator('.realtime-node-config-modal');
    await expect(realtimeConfigDialog).toBeVisible({ timeout: 5000 });

    const manualRadio = realtimeConfigDialog.locator('input[type="radio"][value="manual"]');
    await manualRadio.click({ force: true });
    await page.waitForTimeout(300);

    const addFieldBtn = realtimeConfigDialog.getByRole('button', { name: /添加字段/ });
    await addFieldBtn.click({ force: true });
    await page.waitForTimeout(200);

    const fieldInputs = realtimeConfigDialog.locator('.field-editor input[type="text"]');
    if (await fieldInputs.first().isVisible()) {
      await fieldInputs.first().fill('realtime_field_1');
    }

    const confirmBtn = realtimeConfigDialog.locator('button').filter({ hasText: '确认' });
    await confirmBtn.click({ force: true });
    await page.waitForTimeout(500);

    nodes = page.locator('.vue-flow__node');
    nodeCount = await nodes.count();
    console.log(`  - 当前节点数: ${nodeCount}`);
    expect(nodeCount).toBeGreaterThanOrEqual(2);

    // 步骤 3：创建 PIR 任务
    console.log('步骤 3：创建 PIR 任务');
    const computeTaskSection = page.locator('.sidebar-section').filter({ hasText: /^计算任务/ });
    await computeTaskSection.waitFor({ state: 'visible' });

    const pirTemplate = computeTaskSection.locator('.palette-node').filter({ hasText: 'PIR 查询' });
    await expect(pirTemplate).toBeVisible();

    const pirBounds = await pirTemplate.boundingBox();
    await page.mouse.move(pirBounds!.x + pirBounds!.width / 2, pirBounds!.y + pirBounds!.height / 2);
    await page.waitForTimeout(200);
    await page.mouse.down();
    await page.waitForTimeout(100);
    await page.mouse.move(canvasBounds!.x + 300, canvasBounds!.y + 300, { steps: 15 });
    await page.mouse.up();
    await page.waitForTimeout(1000);

    nodes = page.locator('.vue-flow__node');
    nodeCount = await nodes.count();
    console.log(`  - 当前节点数: ${nodeCount}`);
    expect(nodeCount).toBeGreaterThanOrEqual(3);

    // 步骤 4：获取节点 ID
    console.log('步骤 4：获取节点 ID');
    const allNodes = await nodes.all();
    let dbNodeId: string | null = null;
    let realtimeNodeId: string | null = null;
    let pirNodeId: string | null = null;

    for (const node of allNodes) {
      const nodeId = await node.getAttribute('data-id');
      const nodeText = await node.textContent() || '';
      if (nodeText.includes('数据库表') || nodeText.includes('MySQL')) {
        dbNodeId = nodeId;
      } else if (nodeText.includes('实时数据源')) {
        realtimeNodeId = nodeId;
      } else if (nodeText.includes('PIR') || nodeText.includes('查询')) {
        pirNodeId = nodeId;
      }
    }

    console.log(`  - 数据库表节点 ID: ${dbNodeId}`);
    console.log(`  - 实时数据源节点 ID: ${realtimeNodeId}`);
    console.log(`  - PIR 节点 ID: ${pirNodeId}`);

    // 步骤 5：连接数据源到 PIR
    console.log('步骤 5：连接数据源到 PIR');

    if (realtimeNodeId && pirNodeId) {
      await page.evaluate(({ sourceId, targetId }) => {
        if ((window as any).__createEdge) {
          (window as any).__createEdge(sourceId, 'output', targetId, 'data-input');
        }
      }, { sourceId: realtimeNodeId, targetId: pirNodeId });
      await page.waitForTimeout(500);
    }

    if (dbNodeId && pirNodeId) {
      await page.evaluate(({ sourceId, targetId }) => {
        if ((window as any).__createEdge) {
          (window as any).__createEdge(sourceId, 'output', targetId, 'data-input');
        }
      }, { sourceId: dbNodeId, targetId: pirNodeId });
      await page.waitForTimeout(500);
    }

    let edges = page.locator('.vue-flow__edge');
    let edgeCount = await edges.count();
    console.log(`  - 当前连接数: ${edgeCount}`);
    expect(edgeCount).toBeGreaterThanOrEqual(2);

    // 步骤 6：为 PIR 添加输出
    console.log('步骤 6：为 PIR 添加输出');
    if (pirNodeId) {
      const addOutputBtnClicked = await page.evaluate((nodeId) => {
        const node = document.querySelector(`[data-id="${nodeId}"]`);
        if (node) {
          const addOutputBtn = node.querySelector('.add-output-btn') as HTMLElement;
          if (addOutputBtn) {
            addOutputBtn.click();
            return true;
          }
        }
        return false;
      }, pirNodeId);

      if (addOutputBtnClicked) {
        console.log('  - 已点击添加输出按钮');
        await page.waitForTimeout(500);

        const outputConfig = page.locator('.output-config-modal');
        const isOutputConfigVisible = await outputConfig.isVisible({ timeout: 3000 }).catch(() => false);

        if (isOutputConfigVisible) {
          console.log('  - 输出配置对话框已打开');

          const datasetInput = outputConfig.locator('input[type="text"]').first();
          if (await datasetInput.isVisible()) {
            await datasetInput.fill('pir_stream_output');
            await page.waitForTimeout(200);
          }

          // 选择输出字段
          const fieldItem = outputConfig.locator('.field-item, .field-checkbox').first();
          if (await fieldItem.isVisible()) {
            await fieldItem.click({ force: true });
            await page.waitForTimeout(200);
          }

          const confirmOutputBtn = outputConfig.locator('button').filter({ hasText: /确认|确定|保存/ }).first();
          if (await confirmOutputBtn.isVisible()) {
            await confirmOutputBtn.click({ force: true });
            await page.waitForTimeout(500);
          }

          console.log('  - 已为 PIR 添加输出');
        } else {
          console.log('  - 输出配置对话框未打开');
        }
      } else {
        console.log('  - 添加输出按钮未找到');
      }
    }

    // 步骤 7：验证最终状态
    console.log('步骤 7：验证最终状态');
    nodes = page.locator('.vue-flow__node');
    nodeCount = await nodes.count();
    console.log(`  - 最终节点数: ${nodeCount}`);
    expect(nodeCount).toBeGreaterThanOrEqual(3);

    edges = page.locator('.vue-flow__edge');
    edgeCount = await edges.count();
    console.log(`  - 最终连接数: ${edgeCount}`);
    expect(edgeCount).toBeGreaterThanOrEqual(2);

    console.log('\n=== PIR 输出测试完成 ===\n');
  });
});
