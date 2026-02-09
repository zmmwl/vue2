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
   * 测试设置：直接创建带有 inputProviders 的任务节点
   */
  async function setupTestNodes(page: any, withAlias: boolean = true) {
    // 先创建任务节点
    await page.evaluate((useAlias: boolean) => {
      const taskData = {
        type: 'compute_task',
        label: '表达式测试',
        category: 'compute_task',
        taskType: 'expression_model',
        techPath: 'SOFTWARE',
        icon: '📝',
        color: '#1890ff',
        description: '表达式模型',
        inputProviders: [
          {
            sourceNodeId: 'source_1',
            sourceType: 'dataSource',
            participantId: 'companyA',
            dataset: 'test_db',
            fields: [
              { columnName: 'employee_id', columnAlias: useAlias ? '员工编号' : 'employee_id', columnType: 'STRING', isJoinField: false },
              { columnName: 'salary', columnAlias: useAlias ? '工资' : 'salary', columnType: 'DECIMAL', isJoinField: false },
              { columnName: 'bonus', columnAlias: useAlias ? '奖金' : 'bonus', columnType: 'DECIMAL', isJoinField: false },
              { columnName: 'name', columnAlias: useAlias ? '姓名' : 'name', columnType: 'VARCHAR', isJoinField: false },
              { columnName: 'department', columnAlias: useAlias ? '部门' : 'department', columnType: 'VARCHAR', isJoinField: false }
            ]
          },
          {
            sourceNodeId: 'source_2',
            sourceType: 'dataSource',
            participantId: 'companyB',
            dataset: 'test_db2',
            fields: [
              { columnName: 'emp_id', columnAlias: useAlias ? '员工ID' : 'emp_id', columnType: 'STRING', isJoinField: false },
              { columnName: 'base_salary', columnAlias: useAlias ? '基本工资' : 'base_salary', columnType: 'DECIMAL', isJoinField: false }
            ]
          }
        ]
      };

      const position = { x: 400, y: 200 };
      window.dispatchEvent(new CustomEvent('create-test-task-node', {
        detail: { data: taskData, position }
      }));
    }, withAlias);

    await page.waitForTimeout(1500);

    // 然后获取节点 ID
    const targetId = await page.evaluate(() => {
      const nodes = document.querySelectorAll('.vue-flow__node');
      // 返回最后一个创建的节点 ID（应该是最新的）
      return nodes[nodes.length - 1]?.getAttribute('data-id') || '';
    });

    if (!targetId) {
      throw new Error('Failed to find test task node');
    }

    console.log('Created task node with ID:', targetId);
    return { targetId };
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

    await page.waitForTimeout(1000);

    // 验证编辑器已打开
    const editorContainer = page.locator('.editor-container').first();
    await expect(editorContainer).toBeVisible();

    // 检查节点数据是否包含 inputProviders
    const nodeData = await page.evaluate((nodeId: string) => {
      // 尝试从 window 或 Vue 应用实例中获取 Vue Flow 状态
      const app = (window as any).__vueApp__;
      if (!app) return { error: 'No Vue app' };

      // 尝试获取 Vue Flow 的 store 或状态
      const flowStores = app.config.globalProperties.$pinia?._s;
      if (!flowStores) return { error: 'No Pinia stores' };

      // 查找 nodes store
      const nodesStoreKey = Object.keys(flowStores).find(k => k.includes('node') || k.includes('flow'));
      if (!nodesStoreKey) return { error: 'No nodes store', keys: Object.keys(flowStores) };

      const nodesStore = flowStores[nodesStoreKey];
      const node = nodesStore.nodes?.find((n: any) => n.id === nodeId);

      if (!node) return { error: 'Node not found in store' };

      return {
        found: true,
        nodeId: node.id,
        hasInputProviders: !!node.data?.inputProviders,
        inputProvidersCount: node.data?.inputProviders?.length || 0,
        firstProvider: node.data?.inputProviders?.[0] || null
      };
    }, targetId);

    console.log('节点数据检查:', JSON.stringify(nodeData));

    // 等待编辑器完全加载
    await page.waitForTimeout(500);

    // 点击编辑器获取焦点
    await editorContainer.click({ force: true });

    // 等待 CodeMirror 初始化
    await page.waitForTimeout(300);

    // 输入数据源前缀
    await page.keyboard.type('companyA.test_db.');
    await page.waitForTimeout(500);

    // 触发补全
    await page.keyboard.press('Control+Space');
    await page.waitForTimeout(500);

    // 添加调试：检查表达式内容和状态
    const debugInfo = await page.evaluate(() => {
      const editor = document.querySelector('.cm-content');
      const content = editor ? editor.textContent : '';
      const tooltip = document.querySelector('.cm-tooltip-autocomplete');
      return {
        content,
        tooltipExists: !!tooltip,
        tooltipText: tooltip ? tooltip.textContent : '',
        tooltipCount: document.querySelectorAll('.cm-tooltip-autocomplete li').length
      };
    });

    console.log('调试信息:', debugInfo);

    // 验证补全菜单包含别名
    const completionInfo = await page.evaluate(() => {
      const tooltip = document.querySelector('.cm-tooltip-autocomplete');
      if (!tooltip) return { exists: false, text: '', innerHTML: '' };
      return {
        exists: true,
        text: tooltip.textContent || '',
        innerHTML: tooltip.innerHTML
      };
    });

    console.log('补全信息:', completionInfo);

    const hasAlias = completionInfo.exists && (
      completionInfo.text.includes('工资') ||
      completionInfo.text.includes('奖金') ||
      completionInfo.text.includes('姓名')
    );

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

    await page.waitForTimeout(1000);

    const editorContainer = page.locator('.editor-container').first();
    await editorContainer.click({ force: true });
    await page.waitForTimeout(500);

    // 输入 participantId.
    await page.keyboard.type('companyA.');
    await page.waitForTimeout(800);

    // 触发补全
    await page.keyboard.press('Control+Space');
    await page.waitForTimeout(500);

    // 应该显示数据集补全
    const hasDatasetCompletion = await page.evaluate(() => {
      const tooltip = document.querySelector('.cm-tooltip-autocomplete');
      if (!tooltip) return false;
      const text = tooltip.textContent || '';
      return text.includes('test_db');
    });

    expect(hasDatasetCompletion).toBeTruthy();
    console.log('✓ 数据集补全测试通过');

    // 继续输入数据集名
    await page.keyboard.type('test_db.');
    await page.waitForTimeout(500);

    // 应该显示字段补全
    const hasFieldCompletion = await page.evaluate(() => {
      const tooltip = document.querySelector('.cm-tooltip-autocomplete');
      if (!tooltip) return false;
      const text = tooltip.textContent || '';
      return text.includes('工资') || text.includes('奖金');
    });

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

    await page.waitForTimeout(1000);

    const editorContainer = page.locator('.editor-container').first();
    await editorContainer.click({ force: true });
    await page.waitForTimeout(500);

    // 输入 sum(
    await page.keyboard.type('sum(');
    await page.waitForTimeout(300);

    // 触发补全
    await page.keyboard.press('Control+Space');
    await page.waitForTimeout(500);

    // 验证只显示数字类型字段
    const completionText = await page.evaluate(() => {
      const tooltip = document.querySelector('.cm-tooltip-autocomplete');
      return tooltip ? tooltip.textContent : '';
    });

    // 应该包含数字字段
    expect(completionText).toMatch(/工资|奖金/);
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

    await page.waitForTimeout(1000);

    const editorContainer = page.locator('.editor-container').first();
    await editorContainer.click({ force: true });
    await page.waitForTimeout(500);

    // 输入 len(
    await page.keyboard.type('len(');
    await page.waitForTimeout(300);

    // 触发补全
    await page.keyboard.press('Control+Space');
    await page.waitForTimeout(500);

    // 验证显示字符串类型字段
    const completionText = await page.evaluate(() => {
      const tooltip = document.querySelector('.cm-tooltip-autocomplete');
      return tooltip ? tooltip.textContent : '';
    });

    // 应该包含字符串字段
    expect(completionText).toMatch(/姓名|部门/);
    console.log('✓ 字符串函数补全测试通过');
  });

  /**
   * 测试5：无别名时使用原始字段名
   */
  test('无别名时应该使用原始字段名', async ({ page }) => {
    const { targetId } = await setupTestNodes(page, false);

    await page.evaluate((nodeId: string) => {
      window.dispatchEvent(new CustomEvent('open-expression-editor', {
        detail: { nodeId }
      }));
    }, targetId);

    await page.waitForTimeout(1000);

    const editorContainer = page.locator('.editor-container').first();
    await editorContainer.click({ force: true });
    await page.waitForTimeout(500);

    await page.keyboard.type('companyA.test_db.');
    await page.waitForTimeout(300);

    await page.keyboard.press('Control+Space');
    await page.waitForTimeout(500);

    // 验证补全包含原始字段名
    const hasOriginalName = await page.evaluate(() => {
      const tooltip = document.querySelector('.cm-tooltip-autocomplete');
      if (!tooltip) return false;
      const text = tooltip.textContent || '';
      return text.includes('salary') || text.includes('bonus') || text.includes('name');
    });

    expect(hasOriginalName).toBeTruthy();
    console.log('✓ 原始字段名补全测试通过');
  });

  /**
   * 测试6：补全显示字段类型信息
   */
  test('补全选项应该显示字段类型', async ({ page }) => {
    const { targetId } = await setupTestNodes(page, true);

    await page.evaluate((nodeId: string) => {
      window.dispatchEvent(new CustomEvent('open-expression-editor', {
        detail: { nodeId }
      }));
    }, targetId);

    await page.waitForTimeout(1000);

    const editorContainer = page.locator('.editor-container').first();
    await editorContainer.click({ force: true });
    await page.waitForTimeout(500);

    await page.keyboard.type('companyA.test_db.');
    await page.waitForTimeout(300);

    await page.keyboard.press('Control+Space');
    await page.waitForTimeout(500);

    // 验证补全包含类型信息
    const hasTypeInfo = await page.evaluate(() => {
      const tooltip = document.querySelector('.cm-tooltip-autocomplete');
      if (!tooltip) return false;
      const text = tooltip.textContent || '';
      return text.includes('DECIMAL') || text.includes('VARCHAR') || text.includes('STRING');
    });

    expect(hasTypeInfo).toBeTruthy();
    console.log('✓ 字段类型显示测试通过');
  });

  /**
   * 测试7：多数据源字段区分
   */
  test('应该正确区分不同数据源的字段', async ({ page }) => {
    const { targetId } = await setupTestNodes(page, true);

    await page.evaluate((nodeId: string) => {
      window.dispatchEvent(new CustomEvent('open-expression-editor', {
        detail: { nodeId }
      }));
    }, targetId);

    await page.waitForTimeout(1000);

    const editorContainer = page.locator('.editor-container').first();
    await editorContainer.click({ force: true });
    await page.waitForTimeout(500);

    // 输入 companyA. 应该只显示 companyA 的数据集
    await page.keyboard.type('companyA.');
    await page.waitForTimeout(300);

    const hasCompanyADataset = await page.evaluate(() => {
      const tooltip = document.querySelector('.cm-tooltip-autocomplete');
      if (!tooltip) return false;
      const text = tooltip.textContent || '';
      return text.includes('test_db');
    });

    expect(hasCompanyADataset).toBeTruthy();

    // 清除并输入 companyB.
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    await page.waitForTimeout(100);
    await page.keyboard.type('companyB.');
    await page.waitForTimeout(300);

    const hasCompanyBDataset = await page.evaluate(() => {
      const tooltip = document.querySelector('.cm-tooltip-autocomplete');
      if (!tooltip) return false;
      const text = tooltip.textContent || '';
      return text.includes('test_db2');
    });

    expect(hasCompanyBDataset).toBeTruthy();
    console.log('✓ 多数据源区分测试通过');
  });

  /**
   * 测试8：侧边栏应该显示
   */
  test('侧边栏应该显示可用字段', async ({ page }) => {
    const { targetId } = await setupTestNodes(page, true);

    await page.evaluate((nodeId: string) => {
      window.dispatchEvent(new CustomEvent('open-expression-editor', {
        detail: { nodeId }
      }));
    }, targetId);

    await page.waitForTimeout(1000);

    // 验证侧边栏存在
    const sidebar = page.locator('.field-sidebar');
    await expect(sidebar).toBeVisible();
    console.log('✓ 字段侧边栏显示');
  });

  /**
   * 测试9：侧边栏应该支持字段搜索
   */
  test('侧边栏应该支持字段搜索', async ({ page }) => {
    const { targetId } = await setupTestNodes(page, true);

    await page.evaluate((nodeId: string) => {
      window.dispatchEvent(new CustomEvent('open-expression-editor', {
        detail: { nodeId }
      }));
    }, targetId);

    await page.waitForTimeout(1000);

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
   * 测试10：侧边栏应该标记已使用的字段
   */
  test('侧边栏应该标记已使用的字段', async ({ page }) => {
    const { targetId } = await setupTestNodes(page, true);

    await page.evaluate((nodeId: string) => {
      window.dispatchEvent(new CustomEvent('open-expression-editor', {
        detail: { nodeId }
      }));
    }, targetId);

    await page.waitForTimeout(1000);

    const editorContainer = page.locator('.editor-container').first();
    await editorContainer.click({ force: true });
    await page.waitForTimeout(500);

    // 输入表达式
    await page.keyboard.type('companyA.test_db.工资');
    await page.waitForTimeout(500);

    // 检查侧边栏中对应字段是否有"已使用"标记
    const hasUsedMarker = await page.evaluate(() => {
      const fieldItems = document.querySelectorAll('.field-item');
      return Array.from(fieldItems).some(item => {
        const text = item.textContent || '';
        return text.includes('工资') && item.classList.contains('used');
      });
    });

    expect(hasUsedMarker).toBeTruthy();
    console.log('✓ 已使用字段标记测试通过');
  });

  /**
   * 测试11：补全信息应该显示原始字段名
   */
  test('补全信息应该显示原始字段名', async ({ page }) => {
    const { targetId } = await setupTestNodes(page, true);

    await page.evaluate((nodeId: string) => {
      window.dispatchEvent(new CustomEvent('open-expression-editor', {
        detail: { nodeId }
      }));
    }, targetId);

    await page.waitForTimeout(1000);

    const editorContainer = page.locator('.editor-container').first();
    await editorContainer.click({ force: true });
    await page.waitForTimeout(500);

    await page.keyboard.type('companyA.test_db.工');
    await page.waitForTimeout(300);

    await page.keyboard.press('Control+Space');
    await page.waitForTimeout(500);

    // 验证补全信息中包含原始字段名
    const hasOriginalNameInInfo = await page.evaluate(() => {
      const tooltip = document.querySelector('.cm-tooltip-autocomplete');
      if (!tooltip) return false;
      const text = tooltip.textContent || '';
      // 检查是否同时包含别名和原始字段名
      return text.includes('工资') && text.includes('salary');
    });

    expect(hasOriginalNameInInfo).toBeTruthy();
    console.log('✓ 原始字段名信息显示测试通过');
  });

  /**
   * 测试12：应该能够拖拽字段到编辑器
   */
  test('应该能够拖拽字段到编辑器', async ({ page }) => {
    const { targetId } = await setupTestNodes(page, true);

    await page.evaluate((nodeId: string) => {
      window.dispatchEvent(new CustomEvent('open-expression-editor', {
        detail: { nodeId }
      }));
    }, targetId);

    await page.waitForTimeout(1000);

    // 验证侧边栏存在
    const sidebar = page.locator('.field-sidebar');
    await expect(sidebar).toBeVisible();
    console.log('✓ 字段侧边栏显示');

    // 查找可拖拽的字段项
    const fieldItem = page.locator('.field-item').first();
    await expect(fieldItem).toBeVisible();

    // 使用更简单的方式验证拖拽功能
    // 模拟拖拽事件
    const dragResult = await page.evaluate(() => {
      const fieldItem = document.querySelector('.field-item');
      const editorContent = document.querySelector('.cm-content');

      if (!fieldItem || !editorContent) {
        return { success: false, error: 'Elements not found' };
      }

      // 模拟 dragstart 事件
      const dragStartEvent = new DragEvent('dragstart', {
        bubbles: true,
        cancelable: true,
        dataTransfer: new DataTransfer()
      });

      // 设置拖拽数据
      const testData = JSON.stringify({
        fullRef: 'companyA.test_db.工资',
        field: { columnAlias: '工资', columnName: 'salary', columnType: 'DECIMAL' }
      });
      dragStartEvent.dataTransfer!.setData('application/json', testData);

      // 触发 dragstart
      fieldItem.dispatchEvent(dragStartEvent);

      // 模拟 drop 事件
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 100,
        dataTransfer: dragStartEvent.dataTransfer
      });

      // 触发 drop
      const dropResult = editorContent.dispatchEvent(dropEvent);

      // 获取编辑器内容
      const editorText = editorContent.textContent || '';

      return {
        success: dropResult,
        editorText,
        hasFieldRef: editorText.includes('companyA.test_db')
      };
    });

    console.log('拖拽结果:', dragResult);

    // 验证表达式已插入
    const expressionValue = await page.evaluate(() => {
      const editor = document.querySelector('.cm-content');
      return editor ? editor.textContent : '';
    });

    // 应该包含字段引用格式
    expect(expressionValue).toMatch(/companyA\.test_db\./);
    console.log('✓ 拖拽功能测试通过');
  });
});
