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
    await setupChineseFontSupportOnly(page);
    await page.goto('/');
    await page.waitForSelector('.flow-sidebar', { timeout: 10000 });
    await page.evaluate(() => {
      (window as any).__PLAYWRIGHT_TEST__ = false;
    });
  });

  /**
   * 测试：输出字段按输入表来源分组显示
   */
  test('应该能够按输入表来源分组显示输出字段', async ({ page }) => {
    // 创建两个数据源节点
    await page.evaluate(() => {
      const mockData1 = {
        type: 'dataSource',
        label: 'MySQL 数据库',
        category: 'DATA_SOURCE',
        dataSourceType: 'mysql',
        icon: '🗄️',
        color: '#52C41A',
        assetInfo: {
          assetId: 'asset_001',
          assetNumber: 'ASSET001',
          assetName: '用户交易数据',
          holderCompany: '数据提供商A',
          participantId: 'ent_001',
          entityName: '数据提供商A',
          dataInfo: {
            databaseName: 'transaction_db',
            tableName: 'user_transactions',
            fieldList: [
              { name: 'user_id', dataType: 'VARCHAR', isPrimaryKey: true },
              { name: 'amount', dataType: 'DECIMAL', isJoinField: true },
              { name: 'create_time', dataType: 'DATETIME', isJoinField: false }
            ]
          }
        },
        selectedFields: ['user_id', 'amount', 'create_time']
      };

      const mockData2 = {
        type: 'dataSource',
        label: 'PostgreSQL',
        category: 'DATA_SOURCE',
        dataSourceType: 'postgresql',
        icon: '🐘',
        color: '#52C41A',
        assetInfo: {
          assetId: 'asset_002',
          assetNumber: 'ASSET002',
          assetName: '用户信用数据',
          holderCompany: '数据提供商B',
          participantId: 'ent_002',
          entityName: '数据提供商B',
          dataInfo: {
            databaseName: 'credit_db',
            tableName: 'user_credits',
            fieldList: [
              { name: 'user_id', dataType: 'VARCHAR', isPrimaryKey: true },
              { name: 'credit_score', dataType: 'INT', isJoinField: false }
            ]
          }
        },
        selectedFields: ['user_id', 'credit_score']
      };

      window.dispatchEvent(new CustomEvent('create-test-node', {
        detail: { data: mockData1, position: { x: 200, y: 150 } }
      }));
      window.dispatchEvent(new CustomEvent('create-test-node', {
        detail: { data: mockData2, position: { x: 500, y: 150 } }
      }));
    });

    await page.waitForTimeout(500);

    // 创建 PSI 计算任务节点
    await page.evaluate(() => {
      (window as any).__PLAYWRIGHT_TEST__ = true;
    });

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
      const clientY = canvasRect.top + 350;

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
      Object.defineProperty(dropEvent, 'offsetY', { value: 350, writable: false });

      canvasEl.dispatchEvent(dropEvent);
    }, templateData);

    await page.waitForTimeout(500);
    await page.evaluate(() => {
      (window as any).__PLAYWRIGHT_TEST__ = false;
    });

    // 验证节点创建成功
    await expect(page.locator('.vue-flow__node')).toHaveCount(3);

    // 连接第一个数据源到计算任务
    await page.evaluate(() => {
      const nodes = document.querySelectorAll('.vue-flow__node');
      if (nodes.length >= 2) {
        const sourceId = nodes[0].getAttribute('data-id');
        const targetId = nodes[2].getAttribute('data-id');
        if (sourceId && targetId) {
          window.dispatchEvent(new CustomEvent('create-test-connection', {
            detail: { sourceNodeId: sourceId, targetNodeId: targetId }
          }));
        }
      }
    });

    await page.waitForTimeout(500);

    // 处理字段选择对话框 - 等待对话框完全显示（包括过渡动画）
    const modalVisible = await page.locator('.modal-title').filter({ hasText: '选择字段' }).isVisible().catch(() => false);
    if (modalVisible) {
      // 等待过渡动画完成
      await page.waitForTimeout(300);

      // 验证 Join 类型选择器显示
      await expect(page.locator('.join-type-selector')).toBeVisible();
      await expect(page.locator('.join-type-select')).toBeVisible();

      // 等待表格完全可见
      await page.waitForSelector('table tbody', { state: 'visible', timeout: 5000 });
      await page.waitForTimeout(200);

      // 选择字段
      const fieldCheckboxes = page.locator('table tbody input[type="checkbox"]');
      const fieldCount = await fieldCheckboxes.count();
      // 选择前三个字段（第一个数据源有 3 个字段）
      for (let i = 0; i < Math.min(3, fieldCount); i++) {
        await fieldCheckboxes.nth(i).check({ force: true });
        await page.waitForTimeout(50);
      }

      // 选择第一个字段的 Join 复选框
      const joinCheckbox = page.locator('table tbody tr:nth-child(1) td:last-child input[type="checkbox"]');
      if (await joinCheckbox.count() > 0) {
        await joinCheckbox.nth(0).check({ force: true });
        await page.waitForTimeout(100);
      }
    }

    // 点击确认按钮
    const fieldConfirmBtn = page.locator('.modal-footer .btn.btn-primary');
    await expect(fieldConfirmBtn).toBeVisible();
    await fieldConfirmBtn.click({ force: true });
    await page.waitForTimeout(300);

    // 连接第二个数据源到计算任务
    await page.evaluate(() => {
      const nodes = document.querySelectorAll('.vue-flow__node');
      if (nodes.length >= 2) {
        const sourceId = nodes[1].getAttribute('data-id');
        const targetId = nodes[2].getAttribute('data-id');
        if (sourceId && targetId) {
          window.dispatchEvent(new CustomEvent('create-test-connection', {
            detail: { sourceNodeId: sourceId, targetNodeId: targetId }
          }));
        }
      }
    });

    await page.waitForTimeout(500);

    // 处理第二个字段选择对话框 - 等待对话框完全显示（包括过渡动画）
    const modalVisible2 = await page.locator('.modal-title').filter({ hasText: '选择字段' }).isVisible().catch(() => false);
    if (modalVisible2) {
      // 等待过渡动画完成
      await page.waitForTimeout(300);

      // 验证 Join 类型选择器显示
      await expect(page.locator('.join-type-selector')).toBeVisible();
      await expect(page.locator('.join-type-select')).toBeVisible();

      // 等待表格完全可见
      await page.waitForSelector('table tbody', { state: 'visible', timeout: 5000 });
      await page.waitForTimeout(200);

      // 选择字段
      const fieldCheckboxes2 = page.locator('table tbody input[type="checkbox"]');
      const fieldCount2 = await fieldCheckboxes2.count();
      if (fieldCount2 > 0) {
        await fieldCheckboxes2.nth(0).check({ force: true });
        await page.waitForTimeout(100);

        const joinCheckbox2 = page.locator('table tbody tr:nth-child(1) td:last-child input[type="checkbox"]');
        if (await joinCheckbox2.count() > 0) {
          await joinCheckbox2.nth(0).check({ force: true });
          await page.waitForTimeout(100);
        }
      }
    }

    // 点击确认按钮
    const fieldConfirmBtn2 = page.locator('.modal-footer .btn.btn-primary');
    await expect(fieldConfirmBtn2).toBeVisible();
    await fieldConfirmBtn2.click({ force: true });
    await page.waitForTimeout(300);

    // 点击"添加输出"按钮
    // 等待 Vue Flow 更新和连接完成
    await page.waitForTimeout(500);

    // 使用 JavaScript 直接触发事件，绕过可见性问题
    await page.evaluate(() => {
      const nodes = document.querySelectorAll('.vue-flow__node');
      if (nodes.length >= 3) {
        const taskNode = nodes[2];
        const addOutputBtn = taskNode.querySelector('.add-output-btn');
        if (addOutputBtn) {
          (addOutputBtn as HTMLElement).click();
        }
      }
    });
    await page.waitForTimeout(800);

    // 验证输出配置对话框显示
    await expect(page.locator('.modal-container.output-config-modal')).toBeVisible({ timeout: 10000 });

    // 验证字段分组显示
    const fieldGroups = page.locator('.field-group');
    await expect(fieldGroups).toHaveCount(2);

    // 验证第一个分组
    const firstGroup = fieldGroups.nth(0);
    await expect(firstGroup.locator('.group-header')).toBeVisible();
    await expect(firstGroup.locator('.group-icon')).toContainText('🗄️');
    await expect(firstGroup.locator('.group-title')).toContainText('ent_001');
    // 测试选择了 3 个字段，所以期望显示 3
    await expect(firstGroup.locator('.group-count')).toContainText('(3)');

    // 验证第二个分组
    const secondGroup = fieldGroups.nth(1);
    await expect(secondGroup.locator('.group-header')).toBeVisible();
    await expect(secondGroup.locator('.group-icon')).toContainText('🗄️');
    await expect(secondGroup.locator('.group-title')).toContainText('ent_002');
    // 测试选择了 2 个字段（user_id 和 credit_score），所以期望显示 2
    await expect(secondGroup.locator('.group-count')).toContainText('(2)');
  });

  /**
   * 测试：表达式模型显示默认的浮点型输出字段
   */
  test('应该能够显示表达式模型的默认输出字段', async ({ page }) => {
    // 创建数据源节点
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
          assetName: '用户数据',
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
        detail: { data: mockData, position: { x: 200, y: 150 } }
      }));
    });

    await page.waitForTimeout(300);

    // 创建 MPC 计算任务节点
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
    await page.evaluate(() => {
      (window as any).__PLAYWRIGHT_TEST__ = false;
    });

    // 连接数据源到计算任务
    await page.evaluate(() => {
      const nodes = document.querySelectorAll('.vue-flow__node');
      if (nodes.length >= 2) {
        const sourceId = nodes[0].getAttribute('data-id');
        const targetId = nodes[1].getAttribute('data-id');
        if (sourceId && targetId) {
          window.dispatchEvent(new CustomEvent('create-test-connection', {
            detail: { sourceNodeId: sourceId, targetNodeId: targetId }
          }));
        }
      }
    });

    await page.waitForTimeout(500);

    // 处理字段选择对话框 - 等待对话框完全显示（包括过渡动画）
    const modalVisible = await page.locator('.modal-title').filter({ hasText: '选择字段' }).isVisible().catch(() => false);
    if (modalVisible) {
      // 等待过渡动画完成
      await page.waitForTimeout(300);

      // 验证 Join 类型选择器显示
      await expect(page.locator('.join-type-selector')).toBeVisible();
      await expect(page.locator('.join-type-select')).toBeVisible();

      // 等待表格完全可见
      await page.waitForSelector('table tbody', { state: 'visible', timeout: 5000 });
      await page.waitForTimeout(200);

      // 选择字段
      const fieldCheckboxes = page.locator('table tbody input[type="checkbox"]');
      const fieldCount = await fieldCheckboxes.count();
      if (fieldCount > 0) {
        await fieldCheckboxes.nth(0).check({ force: true });
        await page.waitForTimeout(100);

        const joinCheckbox = page.locator('table tbody tr:nth-child(1) td:last-child input[type="checkbox"]');
        if (await joinCheckbox.count() > 0) {
          await joinCheckbox.nth(0).check({ force: true });
          await page.waitForTimeout(100);
        }
      }
    }

    // 点击确认按钮
    const fieldConfirmBtn = page.locator('.modal-footer .btn.btn-primary');
    await expect(fieldConfirmBtn).toBeVisible();
    await fieldConfirmBtn.click({ force: true });
    await page.waitForTimeout(300);

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

    // 处理表达式编辑对话框
    const exprDialogVisible = await page.locator('.modal-title').filter({ hasText: '编辑表达式' }).isVisible().catch(() => false);
    if (exprDialogVisible) {
      const editorVisible = await page.locator('.cm-content').isVisible().catch(() => false);
      if (editorVisible) {
        await page.locator('.cm-content').click({ force: true });
        await page.waitForTimeout(100);
        await page.keyboard.type('x * 2 + 1');
      }

      const confirmBtn = page.locator('.btn.btn-confirm');
      await confirmBtn.click({ force: true });
      await page.waitForTimeout(500);
    }

    // 点击"添加输出"按钮
    // 使用 JavaScript 直接触发事件，绕过可见性问题
    await page.evaluate(() => {
      const nodes = document.querySelectorAll('.vue-flow__node');
      if (nodes.length >= 2) {
        const taskNode = nodes[1];
        const addOutputBtn = taskNode.querySelector('.add-output-btn');
        if (addOutputBtn) {
          (addOutputBtn as HTMLElement).click();
        }
      }
    });
    await page.waitForTimeout(800);

    // 验证输出配置对话框显示
    await expect(page.locator('.modal-container.output-config-modal')).toBeVisible({ timeout: 10000 });

    // 验证字段分组显示（输入数据源 + 表达式模型）
    const fieldGroups = page.locator('.field-group');
    await expect(fieldGroups).toHaveCount(2);

    // 验证表达式模型分组
    const modelGroup = fieldGroups.nth(1);
    await expect(modelGroup.locator('.group-icon')).toContainText('📝');
    await expect(modelGroup.locator('.group-title')).toContainText('表达式模型');
    await expect(modelGroup.locator('.group-count')).toContainText('(1)');

    // 验证表达式模型的默认输出字段
    const modelFields = modelGroup.locator('.group-fields .field-item');
    await expect(modelFields).toHaveCount(1);
    await expect(modelFields.nth(0).locator('.field-name')).toContainText('result');
    await expect(modelFields.nth(0).locator('.field-type')).toContainText('FLOAT');
  });
});
