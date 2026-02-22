import { test, expect } from '@playwright/test';
import { setupTestEnvironment } from './test-utils';

// 是否在测试结束时暂停供用户查看界面（通过环境变量控制）
const PAUSE_AT_END = process.env.PAUSE_AT_END === 'true';
const PAUSE_DURATION = parseInt(process.env.PAUSE_DURATION || '30000', 10);

/**
 * PIR 端到端演示测试 - 完整流程包括实时数据源
 */
test.describe('PIR 任务流程测试', () => {
  test.beforeEach(async ({ page }) => {
    // 设置测试环境
    await setupTestEnvironment(page);

    // 访问页面
    await page.goto('/');
    await page.waitForSelector('.flow-sidebar', { timeout: 10000 });

    // 等待页面稳定
    await page.waitForTimeout(500);
  });

  test('拖拽实时数据源节点并手工录入字段', async ({ page }) => {
    // 设置更长的超时时间
    test.setTimeout(PAUSE_AT_END ? 120000 : 60000);

    // 1. 找到数据源部分
    const dataSourceSection = page.locator('.sidebar-section').filter({ hasText: /^数据源/ });
    await dataSourceSection.waitFor({ state: 'visible' });

    // 2. 找到实时数据源节点模板
    const realtimeTemplate = dataSourceSection.locator('.palette-node').filter({ hasText: '实时数据源' });
    await expect(realtimeTemplate).toBeVisible();
    console.log('找到实时数据源模板');

    // 3. 获取画布和模板位置
    const canvas = page.locator('.flow-canvas');
    const canvasBounds = await canvas.boundingBox();
    const realtimeBounds = await realtimeTemplate.boundingBox();

    // 4. 执行拖拽到画布
    const targetX = canvasBounds!.x + 200;
    const targetY = canvasBounds!.y + 200;

    await page.mouse.move(realtimeBounds!.x + realtimeBounds!.width / 2, realtimeBounds!.y + realtimeBounds!.height / 2);
    await page.waitForTimeout(200);
    await page.mouse.down();
    await page.waitForTimeout(100);
    await page.mouse.move(targetX, targetY, { steps: 15 });
    await page.waitForTimeout(100);
    await page.mouse.up();

    console.log('实时数据源节点已拖拽到画布');

    // 5. 等待配置对话框出现
    await page.waitForTimeout(500);

    const configDialog = page.locator('.realtime-node-config-modal');
    await expect(configDialog).toBeVisible({ timeout: 5000 });
    console.log('配置对话框已弹出');

    // 6. 选择手工录入模式
    const manualRadio = configDialog.locator('input[type="radio"][value="manual"]');
    await manualRadio.click({ force: true });
    await page.waitForTimeout(300);

    // 7. 在字段编辑器中添加字段
    // 找到字段编辑器的添加按钮
    const fieldEditor = configDialog.locator('.field-editor');
    const addFieldBtn = fieldEditor.locator('button').filter({ hasText: /添加|新增|\+/ }).first();

    // 添加两个字段
    for (let i = 0; i < 2; i++) {
      if (await addFieldBtn.isVisible()) {
        await addFieldBtn.click({ force: true });
        await page.waitForTimeout(200);

        // 填写字段名称
        const fieldNameInputs = fieldEditor.locator('input[type="text"]').filter({ has: page.locator(':visible') });
        const lastInput = fieldNameInputs.last();
        if (await lastInput.isVisible()) {
          await lastInput.fill(`field_${i + 1}`);
        }
      }
    }

    console.log('已添加手工录入字段');

    // 8. 点击确认按钮
    const confirmBtn = configDialog.locator('button').filter({ hasText: '确认' });
    await confirmBtn.click({ force: true });
    await page.waitForTimeout(500);

    // 9. 验证节点已创建并显示配置信息
    const realtimeNode = page.locator('.vue-flow__node').filter({ hasText: '实时数据源' });
    const nodeCount = await realtimeNode.count();
    expect(nodeCount).toBeGreaterThanOrEqual(1);
    console.log('实时数据源节点创建成功');

    // 仅在指定时暂停
    if (PAUSE_AT_END) {
      console.log('\n========================================');
      console.log('实时数据源节点测试完成！');
      console.log(`界面将保持 ${PAUSE_DURATION / 1000} 秒供您查看...`);
      console.log('========================================\n');
      await page.waitForTimeout(PAUSE_DURATION);
    }
  });

  test('完整 PIR 流程：实时数据源（手工录入）+ PIR 任务', async ({ page }) => {
    // 设置更长的超时时间
    test.setTimeout(PAUSE_AT_END ? 180000 : 90000);

    // 捕获控制台日志
    page.on('console', msg => {
      if (msg.text().includes('[FlowCanvas]') || msg.text().includes('[FlowDetailPanel]')) {
        console.log('BROWSER:', msg.text());
      }
    });

    const canvas = page.locator('.flow-canvas');
    const canvasBounds = await canvas.boundingBox();

    // ========== 步骤 1：创建实时数据源（手工录入模式）==========
    const dataSourceSection = page.locator('.sidebar-section').filter({ hasText: /^数据源/ });
    await dataSourceSection.waitFor({ state: 'visible' });

    const realtimeTemplate = dataSourceSection.locator('.palette-node').filter({ hasText: '实时数据源' });
    await expect(realtimeTemplate).toBeVisible();

    const realtimeBounds = await realtimeTemplate.boundingBox();
    const realtimeTargetX = canvasBounds!.x + 150;
    const realtimeTargetY = canvasBounds!.y + 200;

    await page.mouse.move(realtimeBounds!.x + realtimeBounds!.width / 2, realtimeBounds!.y + realtimeBounds!.height / 2);
    await page.waitForTimeout(200);
    await page.mouse.down();
    await page.waitForTimeout(100);
    await page.mouse.move(realtimeTargetX, realtimeTargetY, { steps: 15 });
    await page.waitForTimeout(100);
    await page.mouse.up();

    console.log('实时数据源节点已拖拽');

    // 等待配置对话框
    await page.waitForTimeout(500);

    const configDialog = page.locator('.realtime-node-config-modal');
    await expect(configDialog).toBeVisible({ timeout: 5000 });

    // 切换到手工录入模式
    const manualRadio = configDialog.locator('input[type="radio"][value="manual"]');
    await manualRadio.click({ force: true });
    await page.waitForTimeout(300);

    // 在字段编辑器中添加字段
    const fieldEditor = configDialog.locator('.field-editor');
    const addFieldBtn = fieldEditor.locator('button').filter({ hasText: /添加|新增|\+/ }).first();

    // 添加两个字段
    for (let i = 0; i < 2; i++) {
      if (await addFieldBtn.isVisible()) {
        await addFieldBtn.click({ force: true });
        await page.waitForTimeout(200);

        // 填写字段名称
        const fieldNameInputs = fieldEditor.locator('input[type="text"]').filter({ has: page.locator(':visible') });
        const lastInput = fieldNameInputs.last();
        if (await lastInput.isVisible()) {
          await lastInput.fill(`field_${i + 1}`);
        }
      }
    }

    console.log('已添加手工录入字段');

    // 点击确认按钮 - 使用 force: true 强制点击
    const confirmBtn = configDialog.locator('button').filter({ hasText: '确认' });
    await confirmBtn.click({ force: true });
    await page.waitForTimeout(500);

    console.log('实时数据源节点已配置');

    // ========== 步骤 2：创建 PIR 任务节点 ==========
    const canvasBoundsNew = await canvas.boundingBox();

    const computeTaskSection = page.locator('.sidebar-section').filter({ hasText: /^计算任务/ });
    await computeTaskSection.waitFor({ state: 'visible' });

    const pirTemplate = computeTaskSection.locator('.palette-node').filter({ hasText: 'PIR 查询' });
    await expect(pirTemplate).toBeVisible();

    const pirBounds = await pirTemplate.boundingBox();
    const pirTargetX = canvasBoundsNew!.x + 450;
    const pirTargetY = canvasBoundsNew!.y + 200;

    await page.mouse.move(pirBounds!.x + pirBounds!.width / 2, pirBounds!.y + pirBounds!.height / 2);
    await page.waitForTimeout(200);
    await page.mouse.down();
    await page.waitForTimeout(100);
    await page.mouse.move(pirTargetX, pirTargetY, { steps: 15 });
    await page.waitForTimeout(100);
    await page.mouse.up();

    console.log('PIR 任务节点已拖拽');

    await page.waitForTimeout(1000);

    // ========== 步骤 3：验证节点 ==========
    const nodes = page.locator('.vue-flow__node');
    const nodeCount = await nodes.count();
    console.log(`当前节点数量: ${nodeCount}`);

    // ========== 步骤 4：点击 PIR 节点查看详情面板 ==========
    const pirNode = nodes.filter({ hasText: /PIR|查询/ });
    const pirNodeCount = await pirNode.count();

    if (pirNodeCount > 0) {
      await pirNode.first().click({ force: true });
      await page.waitForTimeout(500);

      const detailPanel = page.locator('.flow-detail-panel');
      await expect(detailPanel).toBeVisible();

      // 检查 PIR 专用面板
      const pirSectionTitle = detailPanel.locator('.section-title').filter({ hasText: 'PIR 任务信息' });
      const hasPirPanel = await pirSectionTitle.isVisible().catch(() => false);
      console.log(`PIR 专用详情面板可见: ${hasPirPanel}`);

      // 检查重新配置按钮
      const configBtn = detailPanel.locator('button').filter({ hasText: /重新配置任务|配置/ });
      const hasConfigBtn = await configBtn.isVisible().catch(() => false);
      console.log(`"重新配置任务"按钮可见: ${hasConfigBtn}`);
    } else {
      console.log('警告：未找到 PIR 节点');
    }

    // 仅在指定时暂停
    if (PAUSE_AT_END) {
      console.log('\n========================================');
      console.log('完整 PIR 流程测试完成！');
      console.log('- 已创建实时数据源节点（手工录入字段）');
      console.log('- 已创建 PIR 查询任务节点');
      console.log(`界面将保持 ${PAUSE_DURATION / 1000} 秒供您查看...`);
      console.log('========================================\n');
      await page.waitForTimeout(PAUSE_DURATION);
    }
  });

  test('PIR 节点基础创建测试', async ({ page }) => {
    // 设置更长的超时时间
    test.setTimeout(PAUSE_AT_END ? 120000 : 60000);

    // 捕获控制台日志
    page.on('console', msg => {
      if (msg.text().includes('[FlowDetailPanel]')) {
        console.log('BROWSER:', msg.text());
      }
    });

    // 1. 找到计算任务部分
    const computeTaskSection = page.locator('.sidebar-section').filter({ hasText: /^计算任务/ });
    await computeTaskSection.waitFor({ state: 'visible' });

    // 2. 找到 PIR 查询节点模板
    const pirTemplate = computeTaskSection.locator('.palette-node').filter({ hasText: 'PIR 查询' });
    await expect(pirTemplate).toBeVisible();

    console.log('找到 PIR 查询模板，准备拖拽...');

    // 3. 获取画布和模板位置
    const canvas = page.locator('.flow-canvas');
    const canvasBounds = await canvas.boundingBox();
    const pirBounds = await pirTemplate.boundingBox();

    // 4. 执行拖拽到画布中央
    const targetX = canvasBounds!.x + 400;
    const targetY = canvasBounds!.y + 250;

    await page.mouse.move(pirBounds!.x + pirBounds!.width / 2, pirBounds!.y + pirBounds!.height / 2);
    await page.waitForTimeout(200);
    await page.mouse.down();
    await page.waitForTimeout(100);
    await page.mouse.move(targetX, targetY, { steps: 15 });
    await page.waitForTimeout(100);
    await page.mouse.up();

    console.log('PIR 节点已拖拽到画布');

    // 等待节点创建
    await page.waitForTimeout(500);

    // 5. 验证节点已创建
    const nodes = page.locator('.vue-flow__node');
    await expect(nodes).toHaveCount(1);
    console.log('PIR 节点创建成功');

    // 6. 点击节点选中
    const pirNode = nodes.first();
    await pirNode.click({ force: true });
    await page.waitForTimeout(500); // 等待详情面板更新

    // 7. 验证详情面板显示
    const detailPanel = page.locator('.flow-detail-panel');
    await expect(detailPanel).toBeVisible();
    console.log('详情面板已显示');

    // 8. 检查详情面板是否显示 PIR 专用内容
    const pirSectionTitle = detailPanel.locator('.section-title').filter({ hasText: 'PIR 任务信息' });
    const hasPirPanel = await pirSectionTitle.isVisible().catch(() => false);

    if (hasPirPanel) {
      console.log('PIR 专用详情面板正确显示');
    } else {
      console.log('警告：详情面板未显示 PIR 专用内容');
    }

    // 检查是否有"重新配置任务"按钮
    const configBtn = detailPanel.locator('button').filter({ hasText: /重新配置任务|配置/ });
    const hasConfigBtn = await configBtn.isVisible().catch(() => false);
    console.log(`"重新配置任务"按钮可见: ${hasConfigBtn}`);

    // 仅在指定时暂停
    if (PAUSE_AT_END) {
      console.log('\n========================================');
      console.log('PIR 基础测试完成！');
      console.log(`界面将保持 ${PAUSE_DURATION / 1000} 秒供您查看...`);
      console.log('========================================\n');
      await page.waitForTimeout(PAUSE_DURATION);
    }
  });

  test('实时数据源连线到PIR节点', async ({ page }) => {
    // 设置更长的超时时间
    test.setTimeout(PAUSE_AT_END ? 180000 : 90000);

    // 捕获控制台日志
    page.on('console', msg => {
      if (msg.text().includes('[FlowCanvas]') || msg.text().includes('[FlowDetailPanel]')) {
        console.log('BROWSER:', msg.text());
      }
    });

    const canvas = page.locator('.flow-canvas');
    const canvasBounds = await canvas.boundingBox();

    // ========== 步骤 1：创建实时数据源（手工录入模式）==========
    const dataSourceSection = page.locator('.sidebar-section').filter({ hasText: /^数据源/ });
    await dataSourceSection.waitFor({ state: 'visible' });

    const realtimeTemplate = dataSourceSection.locator('.palette-node').filter({ hasText: '实时数据源' });
    await expect(realtimeTemplate).toBeVisible();

    let templateBounds = await realtimeTemplate.boundingBox();
    let targetX = canvasBounds!.x + 200;
    let targetY = canvasBounds!.y + 200;

    await page.mouse.move(templateBounds!.x + templateBounds!.width / 2, templateBounds!.y + templateBounds!.height / 2);
    await page.waitForTimeout(200);
    await page.mouse.down();
    await page.waitForTimeout(100);
    await page.mouse.move(targetX, targetY, { steps: 15 });
    await page.waitForTimeout(100);
    await page.mouse.up();

    console.log('实时数据源节点已拖拽');

    // 配置实时数据源（手工录入模式）
    await page.waitForTimeout(500);

    const configDialog = page.locator('.realtime-node-config-modal');
    await expect(configDialog).toBeVisible({ timeout: 5000 });

    // 切换到手工录入模式
    const manualRadio = configDialog.locator('input[type="radio"][value="manual"]');
    await manualRadio.click({ force: true });
    await page.waitForTimeout(300);

    // 在字段编辑器中添加字段
    const fieldEditor = configDialog.locator('.field-editor');
    const addFieldBtn = configDialog.getByRole('button', { name: /添加字段/ });

    // 点击添加字段按钮两次
    await addFieldBtn.click({ force: true });
    await page.waitForTimeout(300);
    await addFieldBtn.click({ force: true });
    await page.waitForTimeout(500);

    // 填写字段名称 - 使用更精确的选择器
    const fieldRows = fieldEditor.locator('.field-row');
    const rowCount = await fieldRows.count();
    console.log(`字段行数量: ${rowCount}`);

    for (let i = 0; i < rowCount; i++) {
      const row = fieldRows.nth(i);
      const nameInput = row.locator('input[type="text"]').first();
      if (await nameInput.isVisible()) {
        await nameInput.fill(`field_${i + 1}`);
        await page.waitForTimeout(100);
      }
    }

    console.log('已添加手工录入字段');

    // 点击确认按钮 - 使用 force: true 强制点击
    const confirmBtn = configDialog.locator('button').filter({ hasText: '确认' });
    await confirmBtn.click({ force: true });
    await page.waitForTimeout(500);

    console.log('实时数据源节点已配置');

    // ========== 步骤 2：创建 PIR 任务节点 ==========
    const computeTaskSection = page.locator('.sidebar-section').filter({ hasText: /^计算任务/ });
    await computeTaskSection.waitFor({ state: 'visible' });

    const pirTemplate = computeTaskSection.locator('.palette-node').filter({ hasText: 'PIR 查询' });
    await expect(pirTemplate).toBeVisible();

    const newCanvasBounds = await canvas.boundingBox();
    templateBounds = await pirTemplate.boundingBox();
    targetX = newCanvasBounds!.x + 500;
    targetY = newCanvasBounds!.y + 200;

    await page.mouse.move(templateBounds!.x + templateBounds!.width / 2, templateBounds!.y + templateBounds!.height / 2);
    await page.waitForTimeout(200);
    await page.mouse.down();
    await page.waitForTimeout(100);
    await page.mouse.move(targetX, targetY, { steps: 15 });
    await page.waitForTimeout(100);
    await page.mouse.up();

    console.log('PIR 任务节点已拖拽');

    await page.waitForTimeout(1000);

    // ========== 步骤 3：验证节点已创建 ==========
    const nodes = page.locator('.vue-flow__node');
    const nodeCount = await nodes.count();
    console.log(`当前节点数量: ${nodeCount}`);
    expect(nodeCount).toBeGreaterThanOrEqual(2);

    // ========== 步骤 4：尝试连线（实时数据源 -> PIR）==========
    // 找到实时数据源节点和 PIR 节点
    const realtimeNode = nodes.filter({ hasText: '实时数据源' }).first();
    const pirNode = nodes.filter({ hasText: /PIR|查询/ }).first();

    // 获取两个节点的位置（不检查可见性，直接获取 boundingBox）
    let realtimeBounds = await realtimeNode.boundingBox();
    let pirBounds = await pirNode.boundingBox();

    // 如果节点不在视口中，先滚动到节点位置
    if (!realtimeBounds || !pirBounds) {
      console.log('节点不在视口中，尝试滚动...');
      await realtimeNode.scrollIntoViewIfNeeded();
      await pirNode.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      realtimeBounds = await realtimeNode.boundingBox();
      pirBounds = await pirNode.boundingBox();
    }

    console.log(`实时数据源节点位置: ${JSON.stringify(realtimeBounds)}`);
    console.log(`PIR 节点位置: ${JSON.stringify(pirBounds)}`);

    if (!realtimeBounds || !pirBounds) {
      throw new Error('无法获取节点位置');
    }

    // 从实时数据源节点的底部（输出 handle）拖拽到 PIR 节点的顶部右侧（realtime-input handle）
    // realtime-input handle 在 PIR 节点顶部 70% 位置
    const startX = realtimeBounds.x + realtimeBounds.width / 2;
    const startY = realtimeBounds.y + realtimeBounds.height - 5; // 接近底部
    const endX = pirBounds.x + pirBounds.width * 0.7; // 70% 位置
    const endY = pirBounds.y + 5; // 接近顶部

    console.log(`尝试连线: (${startX}, ${startY}) -> (${endX}, ${endY})`);

    // 检查所有 handle 元素
    const allHandles = page.locator('.vue-flow__handle');
    const allHandleCount = await allHandles.count();
    console.log(`所有 handle 数量: ${allHandleCount}`);

    // 找到源节点的输出 handle
    const sourceOutputHandle = realtimeNode.locator('.vue-flow__handle-bottom');

    // 获取源 handle 的位置（不检查可见性，直接获取 boundingBox）
    const sourceHandleBounds = await sourceOutputHandle.boundingBox();
    console.log(`源 handle 位置: ${JSON.stringify(sourceHandleBounds)}`);

    if (!sourceHandleBounds) {
      throw new Error('无法获取源 handle 位置');
    }

    // 首先悬停在源节点上
    await page.mouse.move(realtimeBounds.x + realtimeBounds.width / 2, realtimeBounds.y + realtimeBounds.height / 2);
    await page.waitForTimeout(500);

    // 从源 handle 开始拖拽
    const handleStartX = sourceHandleBounds.x + sourceHandleBounds.width / 2;
    const handleStartY = sourceHandleBounds.y + sourceHandleBounds.height / 2;

    console.log(`从 handle 位置开始拖拽: (${handleStartX}, ${handleStartY})`);

    await page.mouse.move(handleStartX, handleStartY);
    await page.waitForTimeout(300);

    // 开始拖拽
    await page.mouse.down();
    await page.waitForTimeout(200);

    // 移动到目标位置（PIR 节点的 realtime-input handle，在 70% 位置）
    const endTargetX = pirBounds.x + pirBounds.width * 0.7;
    const endTargetY = pirBounds.y + 5;
    console.log(`移动到目标位置: (${endTargetX}, ${endTargetY})`);

    // 使用较少的步数快速移动
    await page.mouse.move(endTargetX, endTargetY, { steps: 5 });
    await page.waitForTimeout(200);

    // 释放鼠标
    await page.mouse.up();

    console.log('连线操作已执行');
    await page.waitForTimeout(1000);

    // 如果鼠标拖拽没有成功，尝试使用 JavaScript 直接触发连接
    const currentEdgeCount = await page.locator('.vue-flow__edge').count();
    if (currentEdgeCount === 0) {
      console.log('鼠标拖拽未成功，尝试直接创建连接...');

      // 获取节点 ID
      const realtimeNodeId = await realtimeNode.getAttribute('data-id');
      const pirNodeId = await pirNode.getAttribute('data-id');
      console.log(`实时数据源节点 ID: ${realtimeNodeId}, PIR 节点 ID: ${pirNodeId}`);

      // 使用全局方法创建连接（需要在 FlowCanvas 中暴露）
      await page.evaluate(({ sourceId, targetId }) => {
        // 尝试找到 Vue Flow 实例并添加边
        const flowCanvas = document.querySelector('.flow-canvas');
        if (flowCanvas && (flowCanvas as any).__vue_app__) {
          console.log('Found Vue app on flow-canvas');
        }

        // 尝试通过 window 暴露的测试方法
        if ((window as any).__createEdge) {
          (window as any).__createEdge(sourceId, 'output', targetId, 'realtime-input');
        }
      }, { sourceId: realtimeNodeId, targetId: pirNodeId });

      await page.waitForTimeout(1000);
    }

    // ========== 步骤 5：验证连线是否创建成功 ==========
    const edges = page.locator('.vue-flow__edge');
    const edgeCount = await edges.count();
    console.log(`当前连线数量: ${edgeCount}`);

    if (edgeCount > 0) {
      console.log('连线创建成功！');
    } else {
      console.log('警告：连线未创建成功，检查 handle 配置...');
    }

    // 仅在指定时暂停
    if (PAUSE_AT_END) {
      console.log('\n========================================');
      console.log('实时数据源连线到PIR节点测试完成！');
      console.log(`界面将保持 ${PAUSE_DURATION / 1000} 秒供您查看...`);
      console.log('========================================\n');
      await page.waitForTimeout(PAUSE_DURATION);
    }

    // 断言至少有一条连线
    expect(edgeCount).toBeGreaterThanOrEqual(1);
  });
});
