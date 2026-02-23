import { test, expect, Page } from '@playwright/test';
import { setupTestEnvironment, createFLTaskNodeDirectly, connectNodes } from './test-utils';

/**
 * FL 任务 DAG 流水线端到端测试
 *
 * 测试场景：
 * 数据源 -> 预处理 -> 特征工程 -> (横向模型, 纵向模型)
 *
 * 验证点：
 * 1. 预处理任务展示输入/输出字段
 * 2. 特征工程任务有添加输出的 ➕ handle
 * 3. 横向/纵向模型任务有添加模型输出的 ➕ handle
 * 4. 可以通过 ➕ handle 添加输出
 * 5. 整个 DAG 可以正确连接
 */

// FL 任务类别
type FLTaskCategory = 'preprocessing' | 'feature_engineering' | 'horizontal_model' | 'vertical_model';
type FLMode = 'training' | 'inference';

/**
 * 创建带配置的 FL 任务节点（使用 flTask 格式）
 */
async function createFLTaskNodeWithConfig(
  page: Page,
  options: {
    taskName: string;
    taskDisplayName: string;
    category: FLTaskCategory;
    mode: FLMode;
    position?: { x: number; y: number };
    inputProviders?: any[];
  }
): Promise<void> {
  const { taskName, taskDisplayName, category, mode, position = { x: 400, y: 200 }, inputProviders } = options;

  const categoryColors: Record<string, string> = {
    preprocessing: '#52C41A',
    feature_engineering: '#1890FF',
    horizontal_model: '#722ED1',
    vertical_model: '#EB2F96'
  };

  await page.evaluate((opts) => {
    // 使用 flTask 格式，这样会被 handleCreateTestNode 识别并调用 createFLTaskNode
    const flTaskData = {
      type: 'fl_task',
      label: opts.taskDisplayName,
      category: 'compute_task',
      taskType: 'FL',
      icon: opts.category === 'preprocessing' ? '🔧' :
            opts.category === 'feature_engineering' ? '📊' :
            opts.category === 'horizontal_model' ? '🤖' : '🎯',
      color: opts.categoryColors[opts.category] || '#1890FF',
      description: '',
      // 使用 flTask 格式
      flTask: {
        taskName: opts.taskName,
        taskDisplayName: opts.taskDisplayName,
        category: opts.category,
        mode: opts.mode
      },
      // 额外的配置数据
      flCategory: opts.category,
      flMode: opts.mode,
      taskName: opts.taskName,
      taskDisplayName: opts.taskDisplayName,
      inputProviders: opts.inputProviders || [],
      parameters: {}
    };

    window.dispatchEvent(new CustomEvent('create-test-node', {
      detail: { data: flTaskData, position: opts.position }
    }));
  }, { taskName, taskDisplayName, category, mode, position, inputProviders, categoryColors });

  await page.waitForTimeout(300);

  // 等待节点创建
  await page.waitForFunction(
    () => document.querySelectorAll('.vue-flow__node').length > 0,
    { timeout: 5000 }
  );

  // 关闭可能自动打开的 FL 配置弹窗
  // 使用 force click 和更宽松的选择器
  const modal = page.locator('.fl-config-modal');
  if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
    // 尝试按 ESC 键关闭
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // 如果还在，尝试点击关闭按钮
    if (await modal.isVisible({ timeout: 500 }).catch(() => false)) {
      const closeBtn = modal.locator('.close-btn, button.close, .modal-close').first();
      if (await closeBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await closeBtn.click({ force: true });
        await page.waitForTimeout(300);
      }
    }
  }
}

/**
 * 创建数据源节点（带完整的 assetInfo）
 */
async function createDataSourceWithAsset(
  page: Page,
  position: { x: number; y: number } = { x: 200, y: 200 }
): Promise<void> {
  await page.evaluate((pos) => {
    const dataSourceData = {
      type: 'data_source',
      label: 'MySQL数据源',
      category: 'data_source',
      sourceType: 'mysql',
      icon: '🗄️',
      color: '#52C41A',
      description: 'MySQL数据库',
      // 添加 assetInfo 以便正确创建
      assetInfo: {
        assetId: 'test_asset_001',
        assetName: 'test_dataset',
        participantId: 'enterprise_001',
        dataInfo: {
          fieldList: [
            { name: 'id', dataType: 'STRING', description: '用户ID' },
            { name: 'name', dataType: 'STRING', description: '用户名' },
            { name: 'age', dataType: 'INT', description: '年龄' },
            { name: 'feature1', dataType: 'FLOAT', description: '特征1' },
            { name: 'feature2', dataType: 'FLOAT', description: '特征2' },
            { name: 'label', dataType: 'INT', description: '标签' }
          ]
        }
      },
      selectedFields: ['id', 'name', 'age', 'feature1', 'feature2', 'label']
    };

    window.dispatchEvent(new CustomEvent('create-test-node', {
      detail: { data: dataSourceData, position: pos }
    }));
  }, position);

  await page.waitForTimeout(300);

  // 等待节点创建
  await page.waitForFunction(
    () => document.querySelectorAll('.vue-flow__node').length > 0,
    { timeout: 5000 }
  );
}

/**
 * 获取节点 ID
 */
async function getNodeId(page: Page, index: number): Promise<string> {
  const nodes = await page.locator('.vue-flow__node').all();
  if (index >= nodes.length) {
    throw new Error(`Node index ${index} out of range, only ${nodes.length} nodes exist`);
  }
  const node = nodes[index];
  const id = await node.getAttribute('data-id');
  return id || '';
}

/**
 * 验证节点数量
 */
async function expectNodeCount(page: Page, expected: number): Promise<void> {
  const nodes = page.locator('.vue-flow__node');
  await expect(nodes).toHaveCount(expected, { timeout: 5000 });
}

/**
 * 验证边数量
 */
async function expectEdgeCount(page: Page, expected: number): Promise<void> {
  const edges = page.locator('.vue-flow__edge');
  await expect(edges).toHaveCount(expected, { timeout: 5000 });
}

test.describe('FL 任务 DAG 流水线测试', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page);
    await page.goto('/');
    await page.waitForSelector('.flow-sidebar', { timeout: 10000 });
  });

  test('预处理任务应该展示输入和输出字段', async ({ page }) => {
    // 1. 创建数据源节点
    await createDataSourceWithAsset(page, { x: 100, y: 200 });
    await expectNodeCount(page, 1);
    const datasourceId = await getNodeId(page, 0);

    // 2. 创建预处理任务节点（带输入配置）
    await createFLTaskNodeWithConfig(page, {
      taskName: 'preprocess_data_align',
      taskDisplayName: '数据对齐',
      category: 'preprocessing',
      mode: 'training',
      position: { x: 350, y: 200 },
      inputProviders: [{
        sourceNodeId: datasourceId,
        sourceType: 'dataSource',
        participantId: 'enterprise_001',
        dataset: 'user_data',
        fields: [
          { columnName: 'id', columnType: 'STRING', columnAlias: 'id', isJoinField: false },
          { columnName: 'name', columnType: 'STRING', columnAlias: 'name', isJoinField: false },
          { columnName: 'age', columnType: 'INT', columnAlias: 'age', isJoinField: false }
        ],
        isRealtime: false
      }]
    });
    await expectNodeCount(page, 2);

    // 3. 点击预处理任务节点
    const preprocessNode = page.locator('.vue-flow__node-fl_task, .vue-flow__node').nth(1);
    await preprocessNode.click({ force: true });
    await page.waitForTimeout(500);

    // 4. 验证详情面板显示
    const detailPanel = page.locator('.flow-detail-panel');
    await expect(detailPanel).toBeVisible({ timeout: 5000 });

    // 验证联邦学习任务信息标题存在
    const titleSection = detailPanel.locator('.section-title').filter({ hasText: '联邦学习任务信息' });
    await expect(titleSection).toBeVisible({ timeout: 5000 });

    // 验证输入数据源部分
    const inputSection = detailPanel.locator('.collapsible-section, .info-section').filter({ hasText: '输入数据源' });
    await expect(inputSection).toBeVisible({ timeout: 5000 });

    // 验证输出字段部分（预处理任务输出与输入一致）
    const outputSection = detailPanel.locator('.collapsible-section').filter({ hasText: '输出字段' });
    await expect(outputSection).toBeVisible({ timeout: 5000 });

    // 验证输出字段提示
    await expect(outputSection.locator('.output-hint')).toContainText('预处理任务的输出结构与输入一致');
  });

  test('特征工程任务应该有添加输出的➕按钮', async ({ page }) => {
    // 1. 创建数据源节点
    await createDataSourceWithAsset(page, { x: 100, y: 200 });
    await expectNodeCount(page, 1);
    const datasourceId = await getNodeId(page, 0);

    // 2. 创建特征工程任务节点（带输入配置）
    await createFLTaskNodeWithConfig(page, {
      taskName: 'feature_psi',
      taskDisplayName: '样本对齐(PSI)',
      category: 'feature_engineering',
      mode: 'training',
      position: { x: 350, y: 200 },
      inputProviders: [{
        sourceNodeId: datasourceId,
        sourceType: 'dataSource',
        participantId: 'enterprise_001',
        dataset: 'user_data',
        fields: [
          { columnName: 'id', columnType: 'STRING', columnAlias: 'id', isJoinField: false },
          { columnName: 'feature1', columnType: 'FLOAT', columnAlias: 'feature1', isJoinField: false }
        ],
        isRealtime: false
      }]
    });
    await expectNodeCount(page, 2);

    // 3. 悬停特征工程任务节点
    const featureNode = page.locator('.vue-flow__node-fl_task, .vue-flow__node').nth(1);
    await featureNode.waitFor({ state: 'visible' });
    await page.waitForTimeout(300);
    await featureNode.hover({ force: true });
    await page.waitForTimeout(500);

    // 4. 验证添加输出按钮存在
    const addOutputBtn = featureNode.locator('.add-output-btn');
    await expect(addOutputBtn).toBeVisible({ timeout: 5000 });
  });

  test('横向模型任务应该有添加模型输出的➕按钮', async ({ page }) => {
    // 1. 创建数据源节点
    await createDataSourceWithAsset(page, { x: 100, y: 200 });
    await expectNodeCount(page, 1);
    const datasourceId = await getNodeId(page, 0);

    // 2. 创建横向模型任务节点（带输入配置）
    await createFLTaskNodeWithConfig(page, {
      taskName: 'horizontal_lr',
      taskDisplayName: '横向逻辑回归',
      category: 'horizontal_model',
      mode: 'training',
      position: { x: 350, y: 200 },
      inputProviders: [{
        sourceNodeId: datasourceId,
        sourceType: 'dataSource',
        participantId: 'enterprise_001',
        dataset: 'training_data',
        fields: [
          { columnName: 'id', columnType: 'STRING', columnAlias: 'id', isJoinField: false },
          { columnName: 'label', columnType: 'INT', columnAlias: 'label', isJoinField: false }
        ],
        isRealtime: false
      }]
    });
    await expectNodeCount(page, 2);

    // 3. 悬停横向模型任务节点
    const modelNode = page.locator('.vue-flow__node-fl_task, .vue-flow__node').nth(1);
    await modelNode.waitFor({ state: 'visible' });
    await page.waitForTimeout(300);
    await modelNode.hover({ force: true });
    await page.waitForTimeout(500);

    // 4. 验证添加模型输出按钮存在
    const addModelBtn = modelNode.locator('.add-model-output-btn');
    await expect(addModelBtn).toBeVisible({ timeout: 5000 });
  });

  test('纵向模型任务应该有添加模型输出的➕按钮', async ({ page }) => {
    // 1. 创建数据源节点
    await createDataSourceWithAsset(page, { x: 100, y: 200 });
    await expectNodeCount(page, 1);
    const datasourceId = await getNodeId(page, 0);

    // 2. 创建纵向模型任务节点（带输入配置）
    await createFLTaskNodeWithConfig(page, {
      taskName: 'vertical_lr',
      taskDisplayName: '纵向逻辑回归',
      category: 'vertical_model',
      mode: 'training',
      position: { x: 350, y: 200 },
      inputProviders: [{
        sourceNodeId: datasourceId,
        sourceType: 'dataSource',
        participantId: 'enterprise_001',
        dataset: 'training_data',
        fields: [
          { columnName: 'id', columnType: 'STRING', columnAlias: 'id', isJoinField: false },
          { columnName: 'label', columnType: 'INT', columnAlias: 'label', isJoinField: false }
        ],
        isRealtime: false
      }]
    });
    await expectNodeCount(page, 2);

    // 3. 悬停纵向模型任务节点
    const modelNode = page.locator('.vue-flow__node-fl_task, .vue-flow__node').nth(1);
    await modelNode.waitFor({ state: 'visible' });
    await page.waitForTimeout(300);
    await modelNode.hover({ force: true });
    await page.waitForTimeout(500);

    // 4. 验证添加模型输出按钮存在
    const addModelBtn = modelNode.locator('.add-model-output-btn');
    await expect(addModelBtn).toBeVisible({ timeout: 5000 });
  });

  test('完整的 FL DAG 流水线：数据源->预处理->特征工程->(横向模型,纵向模型)', async ({ page }) => {
    // === 第一步：创建数据源节点 ===
    await createDataSourceWithAsset(page, { x: 100, y: 300 });
    await expectNodeCount(page, 1);
    const datasourceId = await getNodeId(page, 0);

    // === 第二步：创建预处理任务节点 ===
    await createFLTaskNodeWithConfig(page, {
      taskName: 'preprocess_data_align',
      taskDisplayName: '数据对齐',
      category: 'preprocessing',
      mode: 'training',
      position: { x: 300, y: 300 },
      inputProviders: [{
        sourceNodeId: datasourceId,
        sourceType: 'dataSource',
        participantId: 'enterprise_001',
        dataset: 'raw_data',
        fields: [
          { columnName: 'id', columnType: 'STRING', columnAlias: '用户ID', isJoinField: true },
          { columnName: 'feature1', columnType: 'FLOAT', columnAlias: '特征1', isJoinField: false },
          { columnName: 'feature2', columnType: 'FLOAT', columnAlias: '特征2', isJoinField: false },
          { columnName: 'label', columnType: 'INT', columnAlias: '标签', isJoinField: false }
        ],
        isRealtime: false
      }]
    });
    await expectNodeCount(page, 2);
    const preprocessId = await getNodeId(page, 1);

    // 连接数据源 -> 预处理
    await connectNodes(page, datasourceId, preprocessId, 'output', 'data-input');
    await expectEdgeCount(page, 1);

    // === 第三步：创建特征工程任务节点 ===
    await createFLTaskNodeWithConfig(page, {
      taskName: 'feature_psi',
      taskDisplayName: '样本对齐(PSI)',
      category: 'feature_engineering',
      mode: 'training',
      position: { x: 500, y: 300 },
      inputProviders: [{
        sourceNodeId: preprocessId,
        sourceType: 'flTask',
        participantId: 'enterprise_001',
        dataset: '数据对齐_output',
        fields: [
          { columnName: 'id', columnType: 'STRING', columnAlias: '用户ID', isJoinField: true },
          { columnName: 'feature1', columnType: 'FLOAT', columnAlias: '特征1', isJoinField: false },
          { columnName: 'feature2', columnType: 'FLOAT', columnAlias: '特征2', isJoinField: false },
          { columnName: 'label', columnType: 'INT', columnAlias: '标签', isJoinField: false }
        ],
        isRealtime: false
      }]
    });
    await expectNodeCount(page, 3);
    const featureEngId = await getNodeId(page, 2);

    // 连接预处理 -> 特征工程
    await connectNodes(page, preprocessId, featureEngId, 'output', 'data-input');
    await expectEdgeCount(page, 2);

    // === 第四步：点击特征工程的添加输出按钮 ===
    const featureNode = page.locator('.vue-flow__node').nth(2);
    await featureNode.hover();
    await page.waitForTimeout(300);

    // 验证添加输出按钮存在
    const addOutputBtn = featureNode.locator('.add-output-btn, .add-fl-output-btn');
    await expect(addOutputBtn).toBeVisible({ timeout: 3000 });

    // 点击添加输出按钮
    await addOutputBtn.click();
    await page.waitForTimeout(500);

    // 验证输出节点被创建
    await expectNodeCount(page, 4);

    // === 第五步：创建横向模型任务节点 ===
    await createFLTaskNodeWithConfig(page, {
      taskName: 'horizontal_lr',
      taskDisplayName: '横向逻辑回归',
      category: 'horizontal_model',
      mode: 'training',
      position: { x: 700, y: 200 },
      inputProviders: [{
        sourceNodeId: featureEngId,
        sourceType: 'flTask',
        participantId: 'enterprise_001',
        dataset: '样本对齐_output',
        fields: [
          { columnName: 'id', columnType: 'STRING', columnAlias: '用户ID', isJoinField: true },
          { columnName: 'feature1', columnType: 'FLOAT', columnAlias: '特征1', isJoinField: false },
          { columnName: 'feature2', columnType: 'FLOAT', columnAlias: '特征2', isJoinField: false },
          { columnName: 'label', columnType: 'INT', columnAlias: '标签', isJoinField: false }
        ],
        isRealtime: false
      }]
    });

    // === 第六步：创建纵向模型任务节点 ===
    await createFLTaskNodeWithConfig(page, {
      taskName: 'vertical_lr',
      taskDisplayName: '纵向逻辑回归',
      category: 'vertical_model',
      mode: 'training',
      position: { x: 700, y: 400 },
      inputProviders: [{
        sourceNodeId: featureEngId,
        sourceType: 'flTask',
        participantId: 'enterprise_001',
        dataset: '样本对齐_output',
        fields: [
          { columnName: 'id', columnType: 'STRING', columnAlias: '用户ID', isJoinField: true },
          { columnName: 'feature1', columnType: 'FLOAT', columnAlias: '特征1', isJoinField: false },
          { columnName: 'feature2', columnType: 'FLOAT', columnAlias: '特征2', isJoinField: false },
          { columnName: 'label', columnType: 'INT', columnAlias: '标签', isJoinField: false }
        ],
        isRealtime: false
      }]
    });

    // === 第七步：验证横向模型有添加模型输出按钮 ===
    const horizontalNode = page.locator('.vue-flow__node-fl_task').first();
    await horizontalNode.hover();
    await page.waitForTimeout(300);

    const addHorizontalModelBtn = horizontalNode.locator('.add-model-output-btn, .add-output-btn');
    await expect(addHorizontalModelBtn).toBeVisible({ timeout: 3000 });

    // 点击添加模型输出
    await addHorizontalModelBtn.click();
    await page.waitForTimeout(500);

    // === 第八步：验证纵向模型有添加模型输出按钮 ===
    const verticalNode = page.locator('.vue-flow__node-fl_task').last();
    await verticalNode.hover();
    await page.waitForTimeout(300);

    const addVerticalModelBtn = verticalNode.locator('.add-model-output-btn, .add-output-btn');
    await expect(addVerticalModelBtn).toBeVisible({ timeout: 3000 });

    // 点击添加模型输出
    await addVerticalModelBtn.click();
    await page.waitForTimeout(500);

    // === 第九步：验证整个 DAG 结构 ===
    // 验证详情面板中特征工程任务的输出数据部分
    await featureNode.click({ force: true });
    await page.waitForTimeout(300);

    const detailPanel = page.locator('.flow-detail-panel');
    const outputSection = detailPanel.locator('.collapsible-section').filter({ hasText: '输出数据' });
    await expect(outputSection).toBeVisible();
  });

  test('预处理任务可以作为数据源连接到特征工程任务', async ({ page }) => {
    // 1. 创建数据源
    await createDataSourceWithAsset(page, { x: 100, y: 200 });
    const datasourceId = await getNodeId(page, 0);

    // 2. 创建预处理任务（带输入）
    await createFLTaskNodeWithConfig(page, {
      taskName: 'preprocess_data_align',
      taskDisplayName: '数据对齐',
      category: 'preprocessing',
      mode: 'training',
      position: { x: 300, y: 200 },
      inputProviders: [{
        sourceNodeId: datasourceId,
        sourceType: 'dataSource',
        participantId: 'enterprise_001',
        dataset: 'raw_data',
        fields: [
          { columnName: 'id', columnType: 'STRING', columnAlias: 'id', isJoinField: false }
        ],
        isRealtime: false
      }]
    });
    const preprocessId = await getNodeId(page, 1);

    // 3. 验证预处理任务有输出 handle（配置后）
    const preprocessNode = page.locator('.vue-flow__node').nth(1);
    await preprocessNode.hover();
    await page.waitForTimeout(300);

    // 预处理任务配置后应该有输出 handle
    const outputHandle = preprocessNode.locator('.output-handle, [data-handleid="output"]');
    await expect(outputHandle).toBeVisible({ timeout: 3000 });

    // 4. 创建特征工程任务
    await createFLTaskNodeWithConfig(page, {
      taskName: 'feature_psi',
      taskDisplayName: '样本对齐(PSI)',
      category: 'feature_engineering',
      mode: 'training',
      position: { x: 500, y: 200 },
      inputProviders: []
    });
    const featureEngId = await getNodeId(page, 2);

    // 5. 连接预处理 -> 特征工程
    await connectNodes(page, preprocessId, featureEngId, 'output', 'data-input');

    // 6. 验证连接成功
    await expectEdgeCount(page, 1);
  });
});
