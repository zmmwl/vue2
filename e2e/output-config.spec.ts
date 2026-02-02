import { test, expect } from '@playwright/test';
import { setupChineseFontSupportOnly } from './test-utils';

/**
 * 输出配置 E2E 测试
 *
 * 覆盖功能点：
 * 1. 输出字段按输入表来源分组显示
 * 2. 表达式模型默认输出浮点型字段
 * 3. 其他模型显示定义的输出参数
 * 4. 字段选择和分组标题显示正确
 */

test.describe('输出配置测试', () => {
  test.beforeEach(async ({ page }) => {
    // 设置中文字体支持（不启用测试模式，让对话框正常显示）
    await setupChineseFontSupportOnly(page);

    await page.goto('/');
    await page.waitForSelector('.flow-sidebar', { timeout: 10000 });

    // 显式清除测试模式标志，确保模态框正常显示
    await page.evaluate(() => {
      (window as any).__PLAYWRIGHT_TEST__ = false;
    });
  });

  /**
   * 测试：输出字段按输入表来源分组显示
   * 1. 创建多个数据源节点
   * 2. 创建计算任务节点
   * 3. 连接数据源到计算任务
   * 4. 打开输出配置对话框
   * 5. 验证字段按输入表来源分组显示
   */
  test('应该能够按输入表来源分组显示输出字段', async ({ page }) => {
    // 创建第一个数据源节点
    await page.evaluate(() => {
      const mockData = {
        type: 'dataSource',
        label: 'MySQL 数据库',
        category: 'DATA_SOURCE',
        dataSourceType: 'mysql',
        icon: '🗄️',
        color: '#52C41A',
        description: '关系型数据库',
        assetInfo: {
          assetId: 'asset_001',
          assetNumber: 'ASSET001',
          assetName: '用户交易数据',
          holderCompany: '数据提供商A',
          participantId: 'ent_001',
          entityName: '数据提供商A',
          intro: '用户交易数据资产',
          dataInfo: {
            databaseName: 'transaction_db',
            tableName: 'user_transactions',
            fieldList: [
              { name: 'user_id', dataType: 'VARCHAR', isPrimaryKey: true },
              { name: 'amount', columnAlias: 'amount', columnType: 'DECIMAL', isJoinField: true },
              { name: 'create_time', columnAlias: 'create_time', columnType: 'DATETIME', isJoinField: false }
            ]
          }
        },
        selectedFields: ['user_id', 'amount', 'create_time']
      };

      window.dispatchEvent(new CustomEvent('create-test-node', {
        detail: { data: mockData, position: { x: 200, y: 100 } }
      }));
    });

    await page.waitForTimeout(300);

    // 创建第二个数据源节点
    await page.evaluate(() => {
      const mockData = {
        type: 'dataSource',
        label: 'PostgreSQL',
        category: 'DATA_SOURCE',
        dataSourceType: 'postgresql',
        icon: '🐘',
        color: '#52C41A',
        description: '开源关系型数据库',
        assetInfo: {
          assetId: 'asset_002',
          assetNumber: 'ASSET002',
          assetName: '用户信用数据',
          holderCompany: '数据提供商B',
          participantId: 'ent_002',
          entityName: '数据提供商B',
          intro: '用户信用数据资产',
          dataInfo: {
            databaseName: 'credit_db',
            tableName: 'user_credits',
            fieldList: [
              { name: 'user_id', dataType: 'VARCHAR', isPrimaryKey: true },
              { name: 'credit_score', columnAlias: 'credit_score', columnType: 'INT', isJoinField: false }
            ]
          }
        },
        selectedFields: ['user_id', 'credit_score']
      };

      window.dispatchEvent(new CustomEvent('create-test-node', {
        detail: { data: mockData, position: { x: 500, y: 100 } }
      }));
    });

    await page.waitForTimeout(300);

    // 启用测试模式并创建 PSI 计算任务节点
    await page.evaluate(() => {
      (window as any).__PLAYWRIGHT_TEST__ = true;
    });

    // 使用拖拽方式创建计算任务节点
    const templateData = {
      type: 'compute_task',
      label: 'PSI',
      description: '隐私集合求交',
      icon: '🔐',
      color: '#1890ff',
      category: 'compute_task',
      taskType: 'psi'
    };

    await page.evaluate((data) => {
      const canvasEl = document.querySelector('[data-testid="flow-canvas"]') as HTMLElement;
      if (!canvasEl) return;

      const canvasRect = canvasEl.getBoundingClientRect();
      const clientX = canvasRect.left + 350;
      const clientY = canvasRect.top + 300;

      const dataTransfer = new DataTransfer();
      dataTransfer.setData('application/vueflow', JSON.stringify(data));
      dataTransfer.effectAllowed = 'move';

      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        composed: true,
        clientX,
        clientY,
        dataTransfer
      });

      Object.defineProperty(dropEvent, 'offsetX', { value: 350, writable: false });
      Object.defineProperty(dropEvent, 'offsetY', { value: 300, writable: false });

      canvasEl.dispatchEvent(dropEvent);
    }, templateData);

    await page.waitForTimeout(500);

    // 关闭测试模式
    await page.evaluate(() => {
      (window as any).__PLAYWRIGHT_TEST__ = false;
    });

    // 验证节点创建成功
    await expect(page.locator('.vue-flow__node')).toHaveCount(3);

    // 获取计算任务节点
    const taskNode = page.locator('.vue-flow__node').nth(2);
    await expect(taskNode).toBeVisible();

    // 连接第一个数据源到计算任务
    await page.evaluate(() => {
      const nodes = document.querySelectorAll('.vue-flow__node');
      if (nodes.length >= 2) {
        const sourceNode = nodes[0];
        const targetNode = nodes[2];
        const sourceId = sourceNode.getAttribute('data-id');
        const targetId = targetNode.getAttribute('data-id');

        if (sourceId && targetId) {
          window.dispatchEvent(new CustomEvent('create-test-connection', {
            detail: { sourceNodeId: sourceId, targetNodeId: targetId }
          }));
        }
      }
    });

    await page.waitForTimeout(500);

    // 处理第一个字段选择对话框
    const fieldDialogVisible = await page.locator('.modal-title').filter({ hasText: '选择字段' }).isVisible().catch(() => false);
    if (fieldDialogVisible) {
      const fieldCheckboxes = page.locator('table tbody input[type="checkbox"]');
      if (await fieldCheckboxes.count() > 0) {
        await fieldCheckboxes.nth(0).check();
        await page.waitForTimeout(100);

        // 选择 Join 字段
        const joinCheckbox = page.locator('table tbody tr:nth-child(1) td:last-child input[type="checkbox"]');
        if (await joinCheckbox.count() > 0) {
          await joinCheckbox.nth(0).check();
          await page.waitForTimeout(100);
        }
      }

      const fieldConfirmBtn = page.locator('.modal-footer .btn.btn-primary');
      await fieldConfirmBtn.click();
      await page.waitForTimeout(300);
    }

    // 连接第二个数据源到计算任务
    await page.evaluate(() => {
      const nodes = document.querySelectorAll('.vue-flow__node');
      if (nodes.length >= 3) {
        const sourceNode = nodes[1];
        const targetNode = nodes[2];
        const sourceId = sourceNode.getAttribute('data-id');
        const targetId = targetNode.getAttribute('data-id');

        if (sourceId && targetId) {
          window.dispatchEvent(new CustomEvent('create-test-connection', {
            detail: { sourceNodeId: sourceId, targetNodeId: targetId }
          }));
        }
      }
    });

    await page.waitForTimeout(500);

    // 处理第二个字段选择对话框
    const secondFieldDialogVisible = await page.locator('.modal-title').filter({ hasText: '选择字段' }).isVisible().catch(() => false);
    if (secondFieldDialogVisible) {
      const fieldCheckboxes = page.locator('table tbody input[type="checkbox"]');
      if (await fieldCheckboxes.count() > 0) {
        await fieldCheckboxes.nth(0).check();
        await page.waitForTimeout(100);

        const joinCheckbox = page.locator('table tbody tr:nth-child(1) td:last-child input[type="checkbox"]');
        if (await joinCheckbox.count() > 0) {
          await joinCheckbox.nth(0).check();
          await page.waitForTimeout(100);
        }
      }

      const fieldConfirmBtn = page.locator('.modal-footer .btn.btn-primary');
      await fieldConfirmBtn.click();
      await page.waitForTimeout(300);
    }

    // 点击"添加输出"按钮
    const addOutputBtn = taskNode.locator('.add-output-btn');
    await expect(addOutputBtn).toBeVisible();
    await addOutputBtn.click();
    await page.waitForTimeout(300);

    // 验证输出配置对话框显示
    await expect(page.locator('.modal-overlay')).toBeVisible();
    await expect(page.locator('.output-config-modal .modal-title')).toContainText('配置输出数据');

    // 验证字段分组显示
    const fieldGroups = page.locator('.field-group');
    await expect(fieldGroups).toHaveCount(2); // 两个输入数据源，应该有2个分组

    // 验证第一个分组（ent_001.user_transactions）
    const firstGroup = fieldGroups.nth(0);
    await expect(firstGroup.locator('.group-header')).toBeVisible();
    await expect(firstGroup.locator('.group-icon')).toContainText('🗄️');
    await expect(firstGroup.locator('.group-title')).toContainText('ent_001.user_transactions');
    await expect(firstGroup.locator('.group-count')).toContainText('(3)');

    // 验证第一个分组中的字段
    const firstGroupFields = firstGroup.locator('.group-fields .field-item');
    await expect(firstGroupFields).toHaveCount(3);

    // 验证第二个分组（ent_002.user_credits）
    const secondGroup = fieldGroups.nth(1);
    await expect(secondGroup.locator('.group-header')).toBeVisible();
    await expect(secondGroup.locator('.group-icon')).toContainText('🗄️');
    await expect(secondGroup.locator('.group-title')).toContainText('ent_002.user_credits');
    await expect(secondGroup.locator('.group-count')).toContainText('(2)');
  });

  /**
   * 测试：表达式模型显示默认的浮点型输出字段
   */
  test('应该能够显示表达式模型的默认输出字段', async ({ page }) => {
    // 创建数据源和计算任务
    await page.evaluate(() => {
      const mockData = {
        type: 'dataSource',
        label: 'MySQL 数据库',
        category: 'DATA_SOURCE',
        dataSourceType: 'mysql',
        icon: '🗄️',
        color: '#52C41A',
        assetInfo: {
          assetId: 'asset_001',
          assetName: '用户交易数据',
          holderCompany: '数据提供商A',
          participantId: 'ent_001',
          dataInfo: {
            fieldList: [
              { name: 'x', dataType: 'INT', isPrimaryKey: true }
            ]
          }
        },
        selectedFields: ['x']
      };

      window.dispatchEvent(new CustomEvent('create-test-node', {
        detail: { data: mockData, position: { x: 200, y: 100 } }
      }));
    });

    await page.waitForTimeout(300);

    // 创建计算任务并添加表达式模型
    await page.evaluate(() => {
      (window as any).__PLAYWRIGHT_TEST__ = true;
    });

    const templateData = {
      type: 'compute_task',
      label: 'MPC',
      description: '多方安全计算',
      icon: '🧮',
      color: '#1890ff',
      category: 'compute_task',
      taskType: 'mpc'
    };

    await page.evaluate((data) => {
      const canvasEl = document.querySelector('[data-testid="flow-canvas"]') as HTMLElement;
      if (!canvasEl) return;

      const canvasRect = canvasEl.getBoundingClientRect();
      const clientX = canvasRect.left + 350;
      const clientY = canvasRect.top + 250;

      const dataTransfer = new DataTransfer();
      dataTransfer.setData('application/vueflow', JSON.stringify(data));
      dataTransfer.effectAllowed = 'move';

      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        composed: true,
        clientX,
        clientY,
        dataTransfer
      });

      Object.defineProperty(dropEvent, 'offsetX', { value: 350, writable: false });
      Object.defineProperty(dropEvent, 'offsetY', { value: 250, writable: false });

      canvasEl.dispatchEvent(dropEvent);
    }, templateData);

    await page.waitForTimeout(500);

    await page.evaluate(() => {
      (window as any).__PLAYWRIGHT_TEST__ = false;
    });

    // 连接数据源到计算任务
    await page.evaluate(() => {
      const nodes = document.querySelectorAll('.vue-flow__node');
      if (nodes.length >= 2) {
        const sourceNode = nodes[0];
        const targetNode = nodes[1];
        const sourceId = sourceNode.getAttribute('data-id');
        const targetId = targetNode.getAttribute('data-id');

        if (sourceId && targetId) {
          window.dispatchEvent(new CustomEvent('create-test-connection', {
            detail: { sourceNodeId: sourceId, targetNodeId: targetId }
          }));
        }
      }
    });

    await page.waitForTimeout(500);

    // 处理字段选择对话框
    const fieldDialogVisible = await page.locator('.modal-title').filter({ hasText: '选择字段' }).isVisible().catch(() => false);
    if (fieldDialogVisible) {
      const fieldCheckboxes = page.locator('table tbody input[type="checkbox"]');
      if (await fieldCheckboxes.count() > 0) {
        await fieldCheckboxes.nth(0).check();
        await page.waitForTimeout(100);

        const joinCheckbox = page.locator('table tbody tr:nth-child(1) td:last-child input[type="checkbox"]');
        if (await joinCheckbox.count() > 0) {
          await joinCheckbox.nth(0).check();
          await page.waitForTimeout(100);
        }
      }

      const fieldConfirmBtn = page.locator('.modal-footer .btn.btn-primary');
      await fieldConfirmBtn.click();
      await page.waitForTimeout(300);
    }

    // 添加表达式模型到计算任务
    await page.evaluate(() => {
      const nodes = document.querySelectorAll('.vue-flow__node');
      const targetNode = nodes[1];
      if (!targetNode) return;

      const targetBox = targetNode.getBoundingClientRect();

      const data = {
        type: 'model',
        label: '表达式模型',
        category: 'model',
        modelType: 'expression',
        icon: '📝',
        color: '#8B5CF6'
      };

      window.dispatchEvent(new CustomEvent('test-drop-model', {
        detail: { data, x: targetBox.left + targetBox.width / 2, y: targetBox.top + targetBox.height / 2 }
      }));
    });

    await page.waitForTimeout(500);

    // 选择表达式
    const expressionDialogVisible = await page.locator('.modal-title').filter({ hasText: '编辑表达式' }).isVisible().catch(() => false);
    if (expressionDialogVisible) {
      // 输入表达式
      const editorElement = await page.locator('.cm-content').isVisible();
      if (editorElement) {
        await page.locator('.cm-content').click();
        await page.keyboard.type('x * 2 + 1');
      }

      const confirmBtn = page.locator('.btn.btn-confirm');
      await confirmBtn.click();
      await page.waitForTimeout(500);
    }

    // 点击"添加输出"按钮
    const taskNode = page.locator('.vue-flow__node').nth(1);
    const addOutputBtn = taskNode.locator('.add-output-btn');
    await expect(addOutputBtn).toBeVisible();
    await addOutputBtn.click();
    await page.waitForTimeout(300);

    // 验证输出配置对话框显示
    await expect(page.locator('.modal-overlay')).toBeVisible();

    // 验证字段分组显示（输入数据源 + 表达式模型）
    const fieldGroups = page.locator('.field-group');
    await expect(fieldGroups).toHaveCount(2);

    // 验证表达式模型分组
    const modelGroup = fieldGroups.nth(1);
    await expect(modelGroup.locator('.group-icon')).toContainText('📝');
    await expect(modelGroup.locator('.group-title')).toContainText('表达式模型:');
    await expect(modelGroup.locator('.group-count')).toContainText('(1)');

    // 验证表达式模型的默认输出字段
    const modelFields = modelGroup.locator('.group-fields .field-item');
    await expect(modelFields).toHaveCount(1);
    await expect(modelFields.nth(0).locator('.field-name')).toContainText('result');
    await expect(modelFields.nth(0).locator('.field-type')).toContainText('FLOAT');
  });
});
