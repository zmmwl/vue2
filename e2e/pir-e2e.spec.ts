import { test, expect } from '@playwright/test';
import { setupTestEnvironment } from './test-utils';

/**
 * PIR 端到端测试 - 完整数据流
 *
 * 场景描述：
 * 1. 数据源节点 -> PIR-1 预加载数据源输入（固定数据）
 * 2. 手工录入 -> PIR-1 实时数据源输入（流式输入）
 * 3. PIR-1 输出 -> PIR-2 实时数据源输入（流式输出 -> 流式输入）
 */
test('PIR 完整端到端流程', async ({ page }) => {
  // 设置更长的超时时间
  test.setTimeout(180000);  // 3 分钟

  // 捕获控制台日志（用于调试）
  page.on('console', msg => {
    const text = msg.text();
    // 只输出错误和警告
    if (text.includes('ERROR') || text.includes('warn') || text.includes('error')) {
      console.log('BROWSER:', text);
    }
  });

  // 设置测试环境
  await setupTestEnvironment(page);

  // 访问页面
  await page.goto('/');
  await page.waitForSelector('.flow-sidebar', { timeout: 10000 });
  await page.waitForTimeout(1000);

  console.log('\n========================================');
  console.log('PIR 完整端到端流程测试开始');
  console.log('========================================\n');

  // ==================== 步骤 1: 创建数据源节点 ====================
  console.log('步骤 1: 创建数据源节点（预加载数据）');

  const dataSourceSection = page.locator('.sidebar-section').filter({ hasText: '数据源' });
  await dataSourceSection.waitFor({ state: 'visible' });

  // 找到数据库表模板
  const dbTemplate = dataSourceSection.locator('.palette-node').filter({ hasText: '数据库表' });
  await expect(dbTemplate).toBeVisible();

  // 拖拽数据源到画布
  const canvas = page.locator('.flow-canvas');
  const canvasBounds = await canvas.boundingBox();
  const dbBounds = await dbTemplate.boundingBox();

  await page.mouse.move(dbBounds!.x + dbBounds!.width / 2, dbBounds!.y + dbBounds!.height / 2);
  await page.waitForTimeout(200);
  await page.mouse.down();
  await page.waitForTimeout(100);
  await page.mouse.move(canvasBounds!.x + 150, canvasBounds!.y + 150, { steps: 15 });
  await page.mouse.up();
  await page.waitForTimeout(500);

  // 应该弹出数据资产选择器
  const assetSelector = page.locator('.data-asset-selector, .modal-overlay');
  const isAssetSelectorVisible = await assetSelector.isVisible({ timeout: 3000 }).catch(() => false);

  if (isAssetSelectorVisible) {
    console.log('  - 数据资产选择器已打开');
    // 选择第一个数据资产
    const firstAsset = page.locator('.asset-item, .data-asset-item').first();
    if (await firstAsset.isVisible()) {
      await firstAsset.click();
      await page.waitForTimeout(300);

      // 点击确认按钮
      const confirmBtn = page.locator('.btn-confirm, button').filter({ hasText: /确认|确定/ }).first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
        await page.waitForTimeout(500);
      }
    }
  }

  // 验证数据源节点已创建
  let nodes = page.locator('.vue-flow__node');
  let nodeCount = await nodes.count();
  console.log(`  - 当前节点数: ${nodeCount}`);
  expect(nodeCount).toBeGreaterThanOrEqual(1);

  // ==================== 步骤 2: 创建第一个 PIR 节点 ====================
  console.log('步骤 2: 创建第一个 PIR 节点（PIR-1）');

  const computeTaskSection = page.locator('.sidebar-section').filter({ hasText: /^计算任务/ });
  await computeTaskSection.waitFor({ state: 'visible' });

  const pirTemplate = computeTaskSection.locator('.palette-node').filter({ hasText: 'PIR 查询' });
  await expect(pirTemplate).toBeVisible();

  const pirBounds = await pirTemplate.boundingBox();

  await page.mouse.move(pirBounds!.x + pirBounds!.width / 2, pirBounds!.y + pirBounds!.height / 2);
  await page.waitForTimeout(200);
  await page.mouse.down();
  await page.waitForTimeout(100);
  await page.mouse.move(canvasBounds!.x + 400, canvasBounds!.y + 250, { steps: 15 });
  await page.mouse.up();
  await page.waitForTimeout(500);

  nodes = page.locator('.vue-flow__node');
  nodeCount = await nodes.count();
  console.log(`  - 当前节点数: ${nodeCount}`);
  expect(nodeCount).toBeGreaterThanOrEqual(2);

  // ==================== 步骤 3: 连接数据源到 PIR-1 的预加载输入 ====================
  console.log('步骤 3: 连接数据源到 PIR-1 的预加载数据源输入');

  // 获取数据源节点和 PIR 节点的位置
  const dataSourceNode = nodes.first();
  const pir1Node = nodes.nth(1);

  const dsBounds = await dataSourceNode.boundingBox();
  const pir1Bounds = await pir1Node.boundingBox();

  // 从数据源节点底部拖拽到 PIR 节点顶部左侧（预加载输入）
  await page.mouse.move(dsBounds!.x + dsBounds!.width / 2, dsBounds!.y + dsBounds!.height - 5);
  await page.waitForTimeout(200);
  await page.mouse.down();
  await page.waitForTimeout(100);
  await page.mouse.move(pir1Bounds!.x + pir1Bounds!.width * 0.3, pir1Bounds!.y + 5, { steps: 15 });
  await page.mouse.up();
  await page.waitForTimeout(500);

  // 验证连接已创建
  const edges = page.locator('.vue-flow__edge');
  const edgeCount = await edges.count();
  console.log(`  - 当前连接数: ${edgeCount}`);

  // ==================== 步骤 4: 配置 PIR-1 的实时数据源（手工录入） ====================
  console.log('步骤 4: 配置 PIR-1 的实时数据源（手工录入）');

  // 点击 PIR-1 节点选中
  await pir1Node.click({ force: true });
  await page.waitForTimeout(500);

  // 验证详情面板显示
  const detailPanel = page.locator('.flow-detail-panel');
  await expect(detailPanel).toBeVisible();

  // 等待 PIR 专用面板内容出现
  const pirTaskInfo = detailPanel.locator('.section-title').filter({ hasText: 'PIR 任务信息' });
  await expect(pirTaskInfo).toBeVisible({ timeout: 5000 });
  console.log('  - PIR 专用面板已显示');

  // 点击"重新配置任务"按钮（使用更精确的定位器）
  const configBtn = detailPanel.locator('button.config-params-btn').filter({ hasText: /重新配置任务/ });
  await expect(configBtn).toBeVisible({ timeout: 3000 });
  await configBtn.click();
  console.log('  - 已点击"重新配置任务"按钮');
  await page.waitForTimeout(500);

  // 等待实时数据源配置弹窗
  const realtimeModal = page.locator('.realtime-config-modal');
  await expect(realtimeModal).toBeVisible({ timeout: 5000 });

  // 选择"手工录入"模式
  const manualRadio = realtimeModal.locator('input[type="radio"][value="manual"]');
  await manualRadio.click();
  await page.waitForTimeout(200);

  // 点击"添加字段"按钮
  const addFieldBtn = realtimeModal.locator('.add-btn');
  await addFieldBtn.click();
  await page.waitForTimeout(100);
  await addFieldBtn.click();
  await page.waitForTimeout(100);

  // 填写字段信息
  const fieldRows = realtimeModal.locator('.field-row');

  // 第一个字段
  await fieldRows.nth(0).locator('input[placeholder*="字段名"]').fill('query_id');
  await fieldRows.nth(0).locator('select').selectOption('STRING');

  // 第二个字段
  await fieldRows.nth(1).locator('input[placeholder*="字段名"]').fill('user_key');
  await fieldRows.nth(1).locator('select').selectOption('INTEGER');

  console.log('  - 已添加 2 个字段: query_id (STRING), user_key (INTEGER)');

  // 点击确认按钮
  const confirmBtn = realtimeModal.locator('.btn-confirm');
  await expect(confirmBtn).toBeEnabled();
  await confirmBtn.click();
  await page.waitForTimeout(300);

  // 验证弹窗关闭
  await expect(realtimeModal).not.toBeVisible({ timeout: 3000 });
  console.log('  - PIR-1 实时数据源配置完成');

  // ==================== 步骤 5: 创建第二个 PIR 节点 ====================
  console.log('步骤 5: 创建第二个 PIR 节点（PIR-2）');

  // 重新获取 PIR 模板位置
  const pirBounds2 = await pirTemplate.boundingBox();

  await page.mouse.move(pirBounds2!.x + pirBounds2!.width / 2, pirBounds2!.y + pirBounds2!.height / 2);
  await page.waitForTimeout(200);
  await page.mouse.down();
  await page.waitForTimeout(100);
  await page.mouse.move(canvasBounds!.x + 650, canvasBounds!.y + 400, { steps: 15 });
  await page.mouse.up();
  await page.waitForTimeout(500);

  nodes = page.locator('.vue-flow__node');
  nodeCount = await nodes.count();
  console.log(`  - 当前节点数: ${nodeCount}`);
  expect(nodeCount).toBeGreaterThanOrEqual(3);

  // ==================== 步骤 6: 连接 PIR-1 输出到 PIR-2 的实时输入 ====================
  console.log('步骤 6: 连接 PIR-1 输出到 PIR-2 实时数据源输入（流式输出 -> 流式输入）');

  // 重新获取节点位置
  const pir1BoundsNew = await nodes.nth(1).boundingBox();
  const pir2Node = nodes.nth(2);
  const pir2Bounds = await pir2Node.boundingBox();

  // 从 PIR-1 底部拖拽到 PIR-2 顶部右侧（实时输入）
  await page.mouse.move(pir1BoundsNew!.x + pir1BoundsNew!.width / 2, pir1BoundsNew!.y + pir1BoundsNew!.height - 5);
  await page.waitForTimeout(200);
  await page.mouse.down();
  await page.waitForTimeout(100);
  await page.mouse.move(pir2Bounds!.x + pir2Bounds!.width * 0.7, pir2Bounds!.y + 5, { steps: 15 });
  await page.mouse.up();
  await page.waitForTimeout(500);

  // 验证连接
  const edgesFinal = page.locator('.vue-flow__edge');
  const finalEdgeCount = await edgesFinal.count();
  console.log(`  - 最终连接数: ${finalEdgeCount}`);
  expect(finalEdgeCount).toBeGreaterThanOrEqual(2);

  // ==================== 步骤 7: 验证 PIR-2 的实时数据源状态 ====================
  console.log('步骤 7: 验证 PIR-2 的实时数据源状态');

  // 点击 PIR-2 节点
  await pir2Node.click({ force: true });
  await page.waitForTimeout(300);

  // 检查详情面板中实时数据源状态
  const pir2RealtimeStatus = detailPanel.locator('.realtime-source, .provider-card').filter({ hasText: /实时|字段/ });
  const isRealtimeConfigured = await pir2RealtimeStatus.isVisible().catch(() => false);

  if (isRealtimeConfigured) {
    console.log('  - PIR-2 实时数据源已通过连线导入配置');
  } else {
    console.log('  - PIR-2 实时数据源状态待确认');
  }

  // ==================== 完成提示 ====================
  console.log('\n========================================');
  console.log('PIR 完整端到端流程测试完成！');
  console.log('');
  console.log('数据流:');
  console.log('  数据源节点 ────(预加载输入)────> PIR-1');
  console.log('  手工录入   ────(实时输入)──────> PIR-1');
  console.log('  PIR-1 输出  ────(实时输入)──────> PIR-2');
  console.log('');
  console.log('界面将保持 30 秒供您查看...');
  console.log('========================================\n');

  // 截图保存最终状态
  await page.screenshot({ path: 'test-results/pir-e2e-final.png', fullPage: true });
  console.log('截图已保存: test-results/pir-e2e-final.png');

  // 暂停让用户查看
  await page.waitForTimeout(30000);
});
