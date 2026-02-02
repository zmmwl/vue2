import { test, expect } from '@playwright/test';
import { dragNodeToCanvas, setupChineseFontSupportOnly } from './test-utils';

/**
 * 表达式模型 E2E 测试
 *
 * 测试流程：
 * 1. 创建数据源节点并配置
 * 2. 创建计算任务节点
 * 3. 连接数据源到计算任务
 * 4. 拖拽表达式模型到计算任务上
 * 5. 验证表达式编辑器显示
 * 6. 输入表达式并保存
 * 7. 验证模型节点创建成功
 */

test.describe('表达式模型测试', () => {
  test.beforeEach(async ({ page }) => {
    // 设置中文字体支持（不启用测试模式，让对话框正常显示）
    await setupChineseFontSupportOnly(page);

    // 监听控制台日志
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[FlowCanvas]') || text.includes('===') || text.includes('表达式') || text.includes('test-drop')) {
        console.log('BROWSER:', text);
      }
    });

    await page.goto('/');
    await page.waitForSelector('.flow-sidebar', { timeout: 10000 });

    // 显式清除测试模式标志，确保模态框正常显示
    await page.evaluate(() => {
      (window as any).__PLAYWRIGHT_TEST__ = false;
    });
  });

  /**
   * 测试：表达式模型完整流程
   */
  test('应该能够创建表达式模型并保存', async ({ page }) => {
    // 步骤 1: 创建已配置的数据源节点
    await page.evaluate(() => {
      const mockData = {
        type: 'dataSource',
        label: 'MySQL 数据库',
        category: 'data_source',
        dataSourceType: 'mysql',
        icon: '🗄️',
        color: '#52C41A',
        description: '关系型数据库',
        assetInfo: {
          assetId: 'asset_001',
          assetNumber: 'ASSET001',
          assetName: '员工薪资数据',
          holderCompany: '企业A',
          participantId: 'companyA',
          entityName: '企业A',
          intro: '员工薪资数据资产',
          dataInfo: {
            databaseName: 'salary_db',
            tableName: 'employee_salaries',
            fieldList: [
              { name: 'employee_id', dataType: 'STRING', description: '员工ID', dataLength: 20 },
              { name: 'salary', dataType: 'DECIMAL', description: '薪资', dataLength: 10 },
              { name: 'bonus', dataType: 'DECIMAL', description: '奖金', dataLength: 10 }
            ]
          }
        },
        selectedFields: ['employee_id', 'salary', 'bonus']
      };

      window.dispatchEvent(new CustomEvent('create-test-node', {
        detail: { data: mockData, position: { x: 200, y: 100 } }
      }));
    });

    await page.waitForTimeout(500);

    // 验证数据源节点创建成功
    await expect(page.locator('.vue-flow__node')).toHaveCount(1);
    console.log('✓ 数据源节点创建成功');

    // 步骤 2: 创建 PSI 计算任务节点
    await page.evaluate(() => {
      const taskData = {
        type: 'compute_task',
        label: 'PSI',
        category: 'compute_task',
        taskType: 'psi',
        techPath: 'SOFTWARE',
        icon: '🔐',
        color: '#1890ff',
        description: '隐私集合求交'
      };

      window.dispatchEvent(new CustomEvent('create-test-task-node', {
        detail: { data: taskData, position: { x: 400, y: 300 } }
      }));
    });

    await page.waitForTimeout(500);

    // 验证计算任务节点创建成功
    await expect(page.locator('.vue-flow__node')).toHaveCount(2);
    console.log('✓ 计算任务节点创建成功');

    // 步骤 3: 连接数据源到计算任务
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
    if (await page.locator('.modal-title').filter({ hasText: '选择字段' }).isVisible()) {
      await page.waitForTimeout(500);

      // 选择所有字段
      const fieldCheckboxes = page.locator('table tbody input[type="checkbox"]');
      await expect(fieldCheckboxes.first()).toBeVisible({ timeout: 5000 });

      const count = await fieldCheckboxes.count();
      console.log('找到字段复选框数量:', count);

      for (let i = 0; i < Math.min(count, 3); i++) {
        await fieldCheckboxes.nth(i).check({ force: true });
        await page.waitForTimeout(100);
      }

      // 等待确认按钮启用
      const fieldConfirmBtn = page.locator('.modal-footer .btn.btn-primary');
      await expect(fieldConfirmBtn).toBeVisible({ timeout: 5000 });

      // 等待按钮启用
      await page.waitForFunction(() => {
        const btn = document.querySelector('.modal-footer .btn.btn-primary');
        return btn && !btn.hasAttribute('disabled');
      }, { timeout: 5000 });

      await fieldConfirmBtn.click({ force: true });
      await page.waitForTimeout(500);
    }

    // 验证连接创建成功
    await expect(page.locator('.vue-flow__edge')).toHaveCount(1);
    console.log('✓ 数据源连接到计算任务成功');

    // 步骤 4: 获取计算任务节点位置
    const taskNode = page.locator('.vue-flow__node').nth(1);
    const taskBox = await taskNode.boundingBox();
    expect(taskBox).toBeTruthy();

    if (taskBox) {
      // 步骤 5: 模拟拖拽表达式模型到计算任务上
      console.log('准备拖拽表达式模型到计算任务...');
      await page.evaluate((box) => {
        const data = {
          type: 'model',
          label: '表达式',
          category: 'model',
          modelType: 'expression',
          icon: '∑',
          color: '#8B5CF6',
          description: '使用 Python 表达式定义计算逻辑'
        };

        window.dispatchEvent(new CustomEvent('test-drop-model', {
          detail: { data, x: box.x + box.width / 2, y: box.y + box.height / 2 }
        }));
      }, taskBox);

      await page.waitForTimeout(3000);

      // 步骤 6: 等待表达式编辑器对话框显示
      console.log('等待表达式编辑器对话框...');

      // 等待表达式编辑器的模态框元素存在于 DOM 中
      await page.waitForFunction(() => {
        const modals = document.querySelectorAll('.modal-overlay');
        return Array.from(modals).some(m => m.textContent && m.textContent.includes('编辑表达式模型'));
      }, { timeout: 5000 });
      console.log('表达式编辑器模态框元素已附加到 DOM');

      console.log('表达式编辑器对话框已显示');

      // 步骤 7: 验证编辑器容器存在
      const expressionModal = page.locator('.modal-overlay').filter({ hasText: '编辑表达式模型' });
      const editorContainer = expressionModal.locator('.editor-container');
      await expect(editorContainer).toBeVisible({ timeout: 5000 });
      console.log('✓ 编辑器容器可见');

      // 等待 CodeMirror 编辑器初始化
      await page.waitForTimeout(2000);

      // 步骤 8: 验证 CodeMirror 编辑器已初始化
      const cmEditor = expressionModal.locator('.cm-editor');
      await expect(cmEditor).toBeVisible({ timeout: 10000 });
      console.log('✓ CodeMirror 编辑器已初始化');

      // 步骤 9: 输入表达式
      const cmContent = expressionModal.locator('.cm-content');
      await expect(cmContent).toBeVisible();

      // 点击编辑器使其获得焦点
      await cmEditor.click({ force: true });
      await page.waitForTimeout(200);

      // 输入表达式
      await page.keyboard.type('companyA.salary * 0.8 + companyA.bonus');
      await page.waitForTimeout(500);

      // 验证表达式已输入
      const editorText = await cmContent.textContent();
      console.log('编辑器内容:', editorText);
      expect(editorText).toContain('companyA');
      expect(editorText).toContain('salary');
      console.log('✓ 表达式输入成功');

      // 步骤 10: 点击保存按钮
      const saveBtn = expressionModal.locator('.modal-footer .btn.btn-confirm');
      await expect(saveBtn).toBeVisible();
      await expect(saveBtn).toBeEnabled();
      await saveBtn.click({ force: true });
      await page.waitForTimeout(1000);

      // 步骤 11: 等待模型节点创建完成
      await page.waitForFunction(() => {
        const nodes = document.querySelectorAll('.vue-flow__node');
        return nodes.length >= 3;
      }, { timeout: 5000 });
      console.log('✓ 模型节点已创建');

      // 步骤 12: 验证模型节点已创建
      await expect(page.locator('.vue-flow__node')).toHaveCount(3);
      console.log('✓ 模型节点创建成功');

      // 步骤 13: 验证模型节点显示表达式
      const modelNode = page.locator('.vue-flow__node').nth(2);
      await expect(modelNode).toContainText('表达式');
      await expect(modelNode).toContainText('companyA.salary');
      console.log('✓ 模型节点显示表达式正确');

      // 步骤 14: 验证连接已创建
      await expect(page.locator('.vue-flow__edge')).toHaveCount(2);
      console.log('✓ 模型到计算任务的连接创建成功');

      // 测试完成！
      console.log('✓✓✓ 表达式模型测试全部通过 ✓✓✓');
    }
  });
});
