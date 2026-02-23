import { test, expect } from '@playwright/test';
import { setupTestEnvironment } from './test-utils';

/**
 * PIR 实时输出测试 - 验证 PIR 任务有实时数据源输入时输出必须是实时数据
 *
 * 测试场景：
 * 1. 创建 PIR 任务
 * 2. 使用 __createEdge 连接实时数据源 + 普通数据源
 * 3. 添加输出
 * 4. 验证输出节点的 isRealtime 属性为 true
 */
test.describe.serial('PIR 实时输出验证', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
    await page.goto('/');
    await page.waitForSelector('.flow-sidebar', { timeout: 10000 });
    await page.waitForTimeout(500);

    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[FlowCanvas]') || text.includes('isRealtime') || text.includes('ERROR') || text.includes('Output config')) {
        console.log('BROWSER:', text);
      }
    });
  });

  test('PIR 任务连接实时+普通数据源时输出应该是实时输出', async ({ page }) => {
    test.setTimeout(120000);

    console.log('\n=== PIR 实时输出验证测试 ===\n');

    const canvas = page.locator('.flow-canvas');
    const canvasBounds = await canvas.boundingBox();

    // 步骤 1：创建数据库表数据源（普通数据源）
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
    await page.mouse.move(canvasBounds!.x + 100, canvasBounds!.y + 100, { steps: 15 });
    await page.mouse.up();
    await page.waitForTimeout(1000);

    // 步骤 2：创建实时数据源
    console.log('步骤 2：创建实时数据源');
    const realtimeTemplate = dataSourceSection.locator('.palette-node').filter({ hasText: '实时数据源' });
    await expect(realtimeTemplate).toBeVisible();

    const realtimeBounds = await realtimeTemplate.boundingBox();
    await page.mouse.move(realtimeBounds!.x + realtimeBounds!.width / 2, realtimeBounds!.y + realtimeBounds!.height / 2);
    await page.waitForTimeout(200);
    await page.mouse.down();
    await page.waitForTimeout(100);
    await page.mouse.move(canvasBounds!.x + 350, canvasBounds!.y + 100, { steps: 15 });
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
      await fieldInputs.first().fill('realtime_field');
    }

    const confirmBtn = realtimeConfigDialog.locator('button').filter({ hasText: '确认' });
    await confirmBtn.click({ force: true });
    await page.waitForTimeout(500);

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
    await page.mouse.move(canvasBounds!.x + 250, canvasBounds!.y + 300, { steps: 15 });
    await page.mouse.up();
    await page.waitForTimeout(1000);

    // 步骤 4：获取节点 ID
    console.log('步骤 4：获取节点 ID');
    let nodes = page.locator('.vue-flow__node');
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

    expect(realtimeNodeId).not.toBeNull();
    expect(dbNodeId).not.toBeNull();
    expect(pirNodeId).not.toBeNull();

    // 步骤 5：使用 __createEdge 连接实时数据源到 PIR
    console.log('步骤 5：连接实时数据源到 PIR');
    if (realtimeNodeId && pirNodeId) {
      await page.evaluate(({ sourceId, targetId }) => {
        if ((window as any).__createEdge) {
          (window as any).__createEdge(sourceId, 'output', targetId, 'data-input');
        }
      }, { sourceId: realtimeNodeId, targetId: pirNodeId });
      await page.waitForTimeout(500);
    }

    // 步骤 6：连接普通数据源到 PIR
    console.log('步骤 6：连接普通数据源到 PIR');
    if (dbNodeId && pirNodeId) {
      await page.evaluate(({ sourceId, targetId }) => {
        if ((window as any).__createEdge) {
          (window as any).__createEdge(sourceId, 'output', targetId, 'data-input');
        }
      }, { sourceId: dbNodeId, targetId: pirNodeId });
      await page.waitForTimeout(500);
    }

    // 步骤 7：验证连接已创建
    console.log('步骤 7：验证连接已创建');
    let edges = page.locator('.vue-flow__edge');
    let edgeCount = await edges.count();
    console.log(`  - 连接数: ${edgeCount}`);
    expect(edgeCount).toBeGreaterThanOrEqual(2);

    // 步骤 8：点击 PIR 节点查看详情
    console.log('步骤 8：点击 PIR 节点查看详情');
    if (pirNodeId) {
      const pirNode = page.locator(`[data-id="${pirNodeId}"]`);
      await pirNode.click({ force: true });
      await page.waitForTimeout(500);

      // 检查详情面板中的输入数据部分
      const detailPanel = page.locator('.flow-detail-panel');
      if (await detailPanel.isVisible()) {
        const inputSection = detailPanel.locator('.section-header').filter({ hasText: /输入数据/ });
        if (await inputSection.isVisible()) {
          const inputCount = await detailPanel.locator('.input-provider-item').count();
          console.log(`  - 详情面板显示输入数据数: ${inputCount}`);
        }
      }
    }

    // 步骤 9：为 PIR 添加输出（使用测试 API 绕过对话框交互）
    console.log('步骤 9：为 PIR 添加输出');
    if (pirNodeId) {
      const result = await page.evaluate((nodeId) => {
        if ((window as any).__addOutputForTask) {
          return (window as any).__addOutputForTask(nodeId, {
            datasetName: 'pir_realtime_output',
            fieldNames: ['realtime_field']  // 选择实时数据源的字段
          });
        }
        return { success: false, error: 'Test API not available' };
      }, pirNodeId);

      console.log(`  - 添加输出结果: ${JSON.stringify(result)}`);
      expect(result.success).toBe(true);
      await page.waitForTimeout(500);
    }

    // 步骤 10：验证输出节点已创建
    console.log('步骤 10：验证输出节点已创建');
    nodes = page.locator('.vue-flow__node');
    const nodeCount = await nodes.count();
    console.log(`  - 最终节点数: ${nodeCount}`);

    // 查找输出节点（只使用 ID 前缀匹配，因为这是最可靠的方式）
    const allNodesList = await nodes.all();
    let outputNodeId: string | null = null;

    // 首先打印所有节点信息
    for (const node of allNodesList) {
      const nodeId = await node.getAttribute('data-id');
      const nodeClasses = await node.getAttribute('class');
      console.log(`  - 节点: ${nodeId}, 类: ${nodeClasses}`);
    }

    // 查找真正的输出节点（ID 以 output_ 开头）
    for (const node of allNodesList) {
      const nodeId = await node.getAttribute('data-id');
      if (nodeId?.startsWith('output_')) {
        outputNodeId = nodeId;
        console.log(`  - 找到输出节点: ${outputNodeId}`);
        break;
      }
    }

    // 验证输出节点存在
    expect(nodeCount).toBeGreaterThanOrEqual(4); // 数据库表 + 实时数据源 + PIR + 输出
    expect(outputNodeId).not.toBeNull();

    // 步骤 11：验证输出节点的实时属性
    console.log('步骤 11：验证输出节点的实时属性');
    if (outputNodeId) {
      const outputNodeData = await page.evaluate((nodeId) => {
        const node = document.querySelector(`[data-id="${nodeId}"]`);
        if (node) {
          // 检查节点样式和内容
          const nodeCard = node.querySelector('.node-card');
          const bgColor = nodeCard ? window.getComputedStyle(nodeCard).backgroundColor : '';
          const borderColor = nodeCard ? window.getComputedStyle(nodeCard).borderColor : '';

          // 检查节点描述
          const titleEl = node.querySelector('.node-title');
          const title = titleEl?.textContent || '';

          // 检查是否有 PIR 输出相关的类名
          const classList = Array.from(node.classList);
          const hasPIRClass = classList.some(c => c.includes('pir') || c.includes('realtime'));

          // 检查是否有实时数据源标识
          const realtimeBadge = node.querySelector('.realtime-badge');
          const badgeText = realtimeBadge?.textContent || '';
          const hasRealtimeBadge = !!realtimeBadge;

          // 检查节点卡片样式
          const style = node.getAttribute('style') || '';
          const nodeCardStyle = nodeCard?.getAttribute('style') || '';

          return {
            bgColor,
            borderColor,
            title,
            hasPIRClass,
            hasRealtimeBadge,
            badgeText,
            classList,
            style,
            nodeCardStyle,
            isStreamOutput: hasPIRClass || hasRealtimeBadge || badgeText.includes('PIR') || badgeText.includes('实时')
          };
        }
        return null;
      }, outputNodeId);

      console.log(`  - 输出节点数据: ${JSON.stringify(outputNodeData, null, 2)}`);

      if (outputNodeData) {
        // 核心验证：输出应该是流式/实时输出
        console.log(`  - 是否流式输出: ${outputNodeData.isStreamOutput}`);
        console.log(`  - 标题: ${outputNodeData.title}`);
        console.log(`  - 标识文本: ${outputNodeData.badgeText}`);

        // 验证输出是 PIR 输出（有 PIR/实时相关类名或标识）
        expect(outputNodeData.hasRealtimeBadge || outputNodeData.badgeText.includes('PIR') || outputNodeData.badgeText.includes('实时')).toBe(true);
      }
    } else {
      console.log('  - 未找到输出节点，跳过实时属性验证');
    }

    console.log('\n=== PIR 实时输出验证测试完成 ===\n');
  });
});
