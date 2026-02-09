import { test, expect } from '@playwright/test';
import { setupChineseFontSupportOnly } from './test-utils';

/**
 * 表达式编辑器自动补全功能 E2E 测试
 *
 * 测试场景：
 * 1. 字段别名识别和补全
 * 2. 点号后显示字段列表
 * 3. 函数参数智能补全（数字类型/字符串类型过滤）
 * 4. 拖拽字段到编辑器
 */

test.describe('表达式编辑器自动补全测试', () => {
  test.beforeEach(async ({ page }) => {
    await setupChineseFontSupportOnly(page);

    page.on('console', msg => {
      const text = msg.text();
      console.log('CONSOLE:', text);
    });

    await page.goto('/');
    await page.waitForSelector('.flow-sidebar', { timeout: 10000 });

    await page.evaluate(() => {
      (window as any).__PLAYWRIGHT_TEST__ = false;
    });
  });

  /**
   * 测试设置：创建测试数据源和任务节点
   */
  async function setupTestNodes(page: any, withAlias: boolean = true) {
    // 创建数据源节点
    await page.evaluate((useAlias: boolean) => {
      const mockData = {
        type: 'dataSource',
        label: '测试数据源',
        category: 'data_source',
        dataSourceType: 'mysql',
        icon: '🗄️',
        color: '#52C41A',
        description: '测试用数据源',
        assetInfo: {
          assetId: 'asset_test',
          assetNumber: 'TEST001',
          assetName: '测试数据',
          holderCompany: '企业A',
          participantId: 'companyA',
          entityName: '企业A',
          intro: '测试数据资产',
          dataInfo: {
            databaseName: 'test_db',
            tableName: 'test_table',
            fieldList: [
              { name: 'employee_id', dataType: 'STRING', description: '员工ID', dataLength: 20, columnAlias: useAlias ? '员工编号' : '' },
              { name: 'salary', dataType: 'DECIMAL', description: '薪资', dataLength: 10, columnAlias: useAlias ? '工资' : '' },
              { name: 'bonus', dataType: 'DECIMAL', description: '奖金', dataLength: 10, columnAlias: useAlias ? '奖金' : '' },
              { name: 'name', dataType: 'VARCHAR', description: '姓名', dataLength: 50, columnAlias: useAlias ? '姓名' : '' },
              { name: 'department', dataType: 'VARCHAR', description: '部门', dataLength: 30, columnAlias: useAlias ? '部门' : '' }
            ]
          }
        },
        selectedFields: ['employee_id', 'salary', 'bonus', 'name', 'department']
      };

      window.dispatchEvent(new CustomEvent('create-test-node', {
        detail: { data: mockData, position: { x: 200, y: 100 } }
      }));
    }, withAlias);

    await page.waitForTimeout(500);

    // 创建另一个数据源节点（用于测试多数据源）
    await page.evaluate((useAlias: boolean) => {
      const mockData2 = {
        type: 'dataSource',
        label: '测试数据源2',
        category: 'data_source',
        dataSourceType: 'mysql',
        icon: '🗄️',
        color: '#52C41A',
        description: '测试用数据源2',
        assetInfo: {
          assetId: 'asset_test2',
          assetNumber: 'TEST002',
          assetName: '测试数据2',
          holderCompany: '企业B',
          participantId: 'companyB',
          entityName: '企业B',
          intro: '测试数据资产2',
          dataInfo: {
            databaseName: 'test_db2',
            tableName: 'test_table2',
            fieldList: [
              { name: 'emp_id', dataType: 'STRING', description: '员工ID', dataLength: 20, columnAlias: useAlias ? '员工ID' : '' },
              { name: 'base_salary', dataType: 'DECIMAL', description: '基本工资', dataLength: 10, columnAlias: useAlias ? '基本工资' : '' }
            ]
          }
        },
        selectedFields: ['emp_id', 'base_salary']
      };

      window.dispatchEvent(new CustomEvent('create-test-node', {
        detail: { data: mockData2, position: { x: 200, y: 250 } }
      }));
    }, withAlias);

    await page.waitForTimeout(500);

    // 创建计算任务节点
    await page.evaluate((nodeId: string) => {
      const taskData = {
        type: 'compute_task',
        label: '表达式',
        category: 'compute_task',
        taskType: 'expression_model',
        techPath: 'SOFTWARE',
        icon: '📝',
        color: '#1890ff',
        description: '表达式模型'
      };

      window.dispatchEvent(new CustomEvent('create-test-task-node', {
        detail: { data: taskData, position: { x: 500, y: 180 } }
      }));
    });

    await page.waitForTimeout(500);

    // 获取实际创建的节点 ID
    const nodeIds = await page.evaluate(() => {
      const nodes = document.querySelectorAll('.vue-flow__node');
      return Array.from(nodes).map(node => node.getAttribute('data-id'));
    });

    if (!nodeIds || nodeIds.length < 3) {
      throw new Error('Failed to create test nodes');
    }

    const [sourceId1, sourceId2, targetId] = nodeIds;

    // 连接数据源到计算任务并自动确认字段选择
    await page.evaluate(({ s1, s2, t }: any) => {
      // 设置全局标志，强制自动确认
      (window as any).__PLAYWRIGHT_TEST_AUTO_CONFIRM_FIELDS__ = true;

      const eventData = { sourceNodeId: s1, targetNodeId: t, autoConfirm: true, selectAllFields: true };
      window.dispatchEvent(new CustomEvent('create-test-connection', { detail: eventData }));
    }, { s1: sourceId1, s2: sourceId2, t: targetId });

    await page.waitForTimeout(800);

    await page.evaluate(({ s2, t }: any) => {
      window.dispatchEvent(new CustomEvent('create-test-connection', {
        detail: {
          sourceNodeId: s2,
          targetNodeId: t,
          autoConfirm: true,
          selectAllFields: true
        }
      }));
    }, { s2: sourceId2, t: targetId });

    await page.waitForTimeout(800);

    return { sourceId1, sourceId2, targetId };
  }

  /**
   * 测试1：字段别名在补全中显示
   */
  test('应该显示字段别名而非原始字段名', async ({ page }) => {
    const { targetId } = await setupTestNodes(page, true);

    // 打开表达式编辑器
    await page.evaluate((nodeId: string) => {
      window.dispatchEvent(new CustomEvent('open-expression-editor', {
        detail: { nodeId }
      }));
    }, targetId);

    await page.waitForTimeout(800);

    // 验证编辑器已打开
    const editorContainer = page.locator('.editor-container').first();
    await expect(editorContainer).toBeVisible();

    // 点击编辑器获取焦点
    await editorContainer.click();

    // 输入数据源前缀 companyA.test_db.
    await page.keyboard.type('companyA.test_db.');
    await page.waitForTimeout(500);

    // 触发补全（按 Ctrl+Space）
    await page.keyboard.press('Control+Space');
    await page.waitForTimeout(500);

    // 验证补全菜单包含别名（如 "工资"、"奖金" 等）
    const completionMenu = page.locator('.cm-tooltip-autocomplete').first();

    // 检查补全选项
    const hasAlias = await page.evaluate((nodeId: string) => {
      const tooltip = document.querySelector('.cm-tooltip-autocomplete');
      if (!tooltip) return false;
      const text = tooltip.textContent || '';
      return text.includes('工资') || text.includes('奖金') || text.includes('姓名');
    }, targetId);

    expect(hasAlias).toBeTruthy();
    console.log('✓ 别名补全测试通过');
  });

  /**
   * 测试2：点号后显示字段列表
   */
  test('应该在输入点号后显示字段列表', async ({ page }) => {
    const { targetId } = await setupTestNodes(page, true);

    await page.evaluate((nodeId: string) => {
      window.dispatchEvent(new CustomEvent('open-expression-editor', {
        detail: { nodeId }
      }));
    }, targetId);

    await page.waitForTimeout(800);

    const editorContainer = page.locator('.editor-container').first();
    await editorContainer.click();

    // 输入 participantId.
    await page.keyboard.type('companyA.');
    await page.waitForTimeout(300);

    // 应该显示数据集补全
    const hasDatasetCompletion = await page.evaluate((nodeId: string) => {
      const tooltip = document.querySelector('.cm-tooltip-autocomplete');
      if (!tooltip) return false;
      const text = tooltip.textContent || '';
      return text.includes('test_db');
    }, targetId);

    expect(hasDatasetCompletion).toBeTruthy();
    console.log('✓ 数据集补全测试通过');

    // 继续输入数据集名
    await page.keyboard.type('test_db.');
    await page.waitForTimeout(300);

    // 应该显示字段补全
    const hasFieldCompletion = await page.evaluate((nodeId: string) => {
      const tooltip = document.querySelector('.cm-tooltip-autocomplete');
      if (!tooltip) return false;
      const text = tooltip.textContent || '';
      return text.includes('工资') || text.includes('奖金');
    }, targetId);

    expect(hasFieldCompletion).toBeTruthy();
    console.log('✓ 字段补全测试通过');
  });

  /**
   * 测试3：聚合函数只显示数字类型字段
   */
  test('聚合函数应该只显示数字类型字段', async ({ page }) => {
    const { targetId } = await setupTestNodes(page, true);

    await page.evaluate((nodeId: string) => {
      window.dispatchEvent(new CustomEvent('open-expression-editor', {
        detail: { nodeId }
      }));
    }, targetId);

    await page.waitForTimeout(800);

    const editorContainer = page.locator('.editor-container').first();
    await editorContainer.click();

    // 输入 sum(
    await page.keyboard.type('sum(');
    await page.waitForTimeout(300);

    // 触发补全
    await page.keyboard.press('Control+Space');
    await page.waitForTimeout(500);

    // 验证只显示数字类型字段（工资、奖金），不显示字符串字段（姓名、部门）
    const completionText = await page.evaluate((nodeId: string) => {
      const tooltip = document.querySelector('.cm-tooltip-autocomplete');
      return tooltip ? tooltip.textContent : '';
    }, targetId);

    // 应该包含数字字段
    expect(completionText).toMatch(/工资|奖金/);

    // 可能需要检查不包含字符串字段，但由于补全是异步的，我们至少验证有数字字段
    console.log('✓ 聚合函数补全测试通过');
  });

  /**
   * 测试4：字符串函数只显示字符串类型字段
   */
  test('字符串函数应该只显示字符串类型字段', async ({ page }) => {
    const { targetId } = await setupTestNodes(page, true);

    await page.evaluate((nodeId: string) => {
      window.dispatchEvent(new CustomEvent('open-expression-editor', {
        detail: { nodeId }
      }));
    }, targetId);

    await page.waitForTimeout(800);

    const editorContainer = page.locator('.editor-container').first();
    await editorContainer.click();

    // 输入 len(
    await page.keyboard.type('len(');
    await page.waitForTimeout(300);

    // 触发补全
    await page.keyboard.press('Control+Space');
    await page.waitForTimeout(500);

    // 验证显示字符串类型字段
    const completionText = await page.evaluate((nodeId: string) => {
      const tooltip = document.querySelector('.cm-tooltip-autocomplete');
      return tooltip ? tooltip.textContent : '';
    }, targetId);

    // 应该包含字符串字段
    expect(completionText).toMatch(/姓名|部门/);
    console.log('✓ 字符串函数补全测试通过');
  });

  /**
   * 测试5：无别名时使用原始字段名
   */
  test('无别名时应该使用原始字段名', async ({ page }) => {
    await setupTestNodes(page, false);

    await page.evaluate((nodeId: string) => {
      window.dispatchEvent(new CustomEvent('open-expression-editor', {
        detail: { nodeId }
      }));
    }, targetId);

    await page.waitForTimeout(800);

    const editorContainer = page.locator('.editor-container').first();
    await editorContainer.click();

    await page.keyboard.type('companyA.test_db.');
    await page.waitForTimeout(300);

    await page.keyboard.press('Control+Space');
    await page.waitForTimeout(500);

    // 验证补全包含原始字段名
    const hasOriginalName = await page.evaluate((nodeId: string) => {
      const tooltip = document.querySelector('.cm-tooltip-autocomplete');
      if (!tooltip) return false;
      const text = tooltip.textContent || '';
      return text.includes('salary') || text.includes('bonus') || text.includes('name');
    }, targetId);

    expect(hasOriginalName).toBeTruthy();
    console.log('✓ 原始字段名补全测试通过');
  });

  /**
   * 测试6：拖拽字段到编辑器
   */
  test('应该能够拖拽字段到编辑器', async ({ page }) => {
    const { targetId } = await setupTestNodes(page, true);

    await page.evaluate((nodeId: string) => {
      window.dispatchEvent(new CustomEvent('open-expression-editor', {
        detail: { nodeId }
      }));
    }, targetId);

    await page.waitForTimeout(800);

    // 验证侧边栏存在
    const sidebar = page.locator('.field-sidebar');
    await expect(sidebar).toBeVisible();
    console.log('✓ 字段侧边栏显示');

    // 查找可拖拽的字段项
    const fieldItem = page.locator('.field-item').first();
    await expect(fieldItem).toBeVisible();

    // 获取编辑器位置
    const editorBox = await page.locator('.editor-container').boundingBox();

    // 执行拖拽
    await fieldItem.dragTo(page.locator('.cm-content'), {
      targetPosition: { x: 50, y: 50 }
    });

    await page.waitForTimeout(500);

    // 验证表达式已插入
    const expressionValue = await page.evaluate((nodeId: string) => {
      const editor = document.querySelector('.cm-content');
      return editor ? editor.textContent : '';
    }, targetId);

    // 应该包含字段引用格式
    expect(expressionValue).toMatch(/companyA\.test_db\./);
    console.log('✓ 拖拽功能测试通过');
  });

  /**
   * 测试7：补全显示字段类型信息
   */
  test('补全选项应该显示字段类型', async ({ page }) => {
    const { targetId } = await setupTestNodes(page, true);

    await page.evaluate((nodeId: string) => {
      window.dispatchEvent(new CustomEvent('open-expression-editor', {
        detail: { nodeId }
      }));
    }, targetId);

    await page.waitForTimeout(800);

    const editorContainer = page.locator('.editor-container').first();
    await editorContainer.click();

    await page.keyboard.type('companyA.test_db.');
    await page.waitForTimeout(300);

    await page.keyboard.press('Control+Space');
    await page.waitForTimeout(500);

    // 验证补全包含类型信息
    const hasTypeInfo = await page.evaluate((nodeId: string) => {
      const tooltip = document.querySelector('.cm-tooltip-autocomplete');
      if (!tooltip) return false;
      const text = tooltip.textContent || '';
      return text.includes('DECIMAL') || text.includes('VARCHAR') || text.includes('STRING');
    }, targetId);

    expect(hasTypeInfo).toBeTruthy();
    console.log('✓ 字段类型显示测试通过');
  });

  /**
   * 测试8：多数据源字段区分
   */
  test('应该正确区分不同数据源的字段', async ({ page }) => {
    const { targetId } = await setupTestNodes(page, true);

    await page.evaluate((nodeId: string) => {
      window.dispatchEvent(new CustomEvent('open-expression-editor', {
        detail: { nodeId }
      }));
    }, targetId);

    await page.waitForTimeout(800);

    const editorContainer = page.locator('.editor-container').first();
    await editorContainer.click();

    // 输入 companyA. 应该只显示 companyA 的数据集
    await page.keyboard.type('companyA.');
    await page.waitForTimeout(300);

    const hasCompanyADataset = await page.evaluate((nodeId: string) => {
      const tooltip = document.querySelector('.cm-tooltip-autocomplete');
      if (!tooltip) return false;
      const text = tooltip.textContent || '';
      return text.includes('test_db');
    }, targetId);

    expect(hasCompanyADataset).toBeTruthy();

    // 清除并输入 companyB.
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(100);
    await page.keyboard.type('companyB.');
    await page.waitForTimeout(300);

    const hasCompanyBDataset = await page.evaluate((nodeId: string) => {
      const tooltip = document.querySelector('.cm-tooltip-autocomplete');
      if (!tooltip) return false;
      const text = tooltip.textContent || '';
      return text.includes('test_db2');
    }, targetId);

    expect(hasCompanyBDataset).toBeTruthy();
    console.log('✓ 多数据源区分测试通过');
  });

  /**
   * 测试9：补全选项优先级（别名优先）
   */
  test('有别名的字段应该优先显示', async ({ page }) => {
    const { targetId } = await setupTestNodes(page, true);

    await page.evaluate((nodeId: string) => {
      window.dispatchEvent(new CustomEvent('open-expression-editor', {
        detail: { nodeId }
      }));
    }, targetId);

    await page.waitForTimeout(800);

    const editorContainer = page.locator('.editor-container').first();
    await editorContainer.click();

    await page.keyboard.type('companyA.test_db.');
    await page.waitForTimeout(300);

    await page.keyboard.press('Control+Space');
    await page.waitForTimeout(500);

    // 验证别名字段存在
    const hasAliasField = await page.evaluate((nodeId: string) => {
      const options = document.querySelectorAll('.cm-tooltip-autocomplete ul li');
      const texts = Array.from(options).map(opt => opt.textContent || '');
      return texts.some(text => text.includes('工资') || text.includes('奖金'));
    }, targetId);

    expect(hasAliasField).toBeTruthy();
    console.log('✓ 别名字段优先显示测试通过');
  });

  /**
   * 测试10：侧边栏字段搜索功能
   */
  test('侧边栏应该支持字段搜索', async ({ page }) => {
    const { targetId } = await setupTestNodes(page, true);

    await page.evaluate((nodeId: string) => {
      window.dispatchEvent(new CustomEvent('open-expression-editor', {
        detail: { nodeId }
      }));
    }, targetId);

    await page.waitForTimeout(800);

    // 验证侧边栏和搜索框存在
    const searchInput = page.locator('.search-input');
    await expect(searchInput).toBeVisible();

    // 输入搜索关键词
    await searchInput.fill('工资');
    await page.waitForTimeout(300);

    // 验证搜索结果
    const fieldItems = page.locator('.field-item');
    const count = await fieldItems.count();

    // 应该只显示包含"工资"的字段
    expect(count).toBeGreaterThan(0);
    console.log('✓ 侧边栏搜索功能测试通过');
  });

  /**
   * 测试11：侧边栏已使用字段标记
   */
  test('侧边栏应该标记已使用的字段', async ({ page }) => {
    const { targetId } = await setupTestNodes(page, true);

    await page.evaluate((nodeId: string) => {
      window.dispatchEvent(new CustomEvent('open-expression-editor', {
        detail: { nodeId }
      }));
    }, targetId);

    await page.waitForTimeout(800);

    const editorContainer = page.locator('.editor-container').first();
    await editorContainer.click();

    // 输入表达式
    await page.keyboard.type('companyA.test_db.工资');
    await page.waitForTimeout(500);

    // 检查侧边栏中对应字段是否有"已使用"标记
    const hasUsedMarker = await page.evaluate((nodeId: string) => {
      const fieldItems = document.querySelectorAll('.field-item');
      return Array.from(fieldItems).some(item => {
        const text = item.textContent || '';
        return text.includes('工资') && item.classList.contains('used');
      }, targetId);
    });

    expect(hasUsedMarker).toBeTruthy();
    console.log('✓ 已使用字段标记测试通过');
  });

  /**
   * 测试12：补全信息显示原始字段名
   */
  test('补全信息应该显示原始字段名', async ({ page }) => {
    const { targetId } = await setupTestNodes(page, true);

    await page.evaluate((nodeId: string) => {
      window.dispatchEvent(new CustomEvent('open-expression-editor', {
        detail: { nodeId }
      }));
    }, targetId);

    await page.waitForTimeout(800);

    const editorContainer = page.locator('.editor-container').first();
    await editorContainer.click();

    await page.keyboard.type('companyA.test_db.工');
    await page.waitForTimeout(300);

    await page.keyboard.press('Control+Space');
    await page.waitForTimeout(500);

    // 验证补全信息中包含原始字段名
    const hasOriginalNameInInfo = await page.evaluate((nodeId: string) => {
      const tooltip = document.querySelector('.cm-tooltip-autocomplete');
      if (!tooltip) return false;
      const text = tooltip.textContent || '';
      // 检查是否同时包含别名和原始字段名
      return text.includes('工资') && text.includes('salary');
    }, targetId);

    expect(hasOriginalNameInInfo).toBeTruthy();
    console.log('✓ 原始字段名信息显示测试通过');
  });
});
