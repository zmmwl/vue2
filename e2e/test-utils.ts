import { Page, Locator } from '@playwright/test';

/**
 * HTML5 拖放测试辅助函数
 *
 * Playwright 的 dragTo 在无头模式下无法正确模拟 HTML5 原生拖放 API。
 * 这个函数直接在浏览器中模拟 HTML5 拖放事件。
 *
 * 参考: https://github.com/microsoft/playwright/issues/1306
 */

/**
 * 设置测试环境
 * 在 Linux 环境下注入中文字体样式，并设置测试模式标志
 */
export async function setupTestEnvironment(page: Page): Promise<void> {
  await page.addInitScript(`
    // 设置测试模式标志，让应用自动创建模拟数据
    window.__PLAYWRIGHT_TEST__ = true;

    // 中文字体栈
    const chineseFontStack = '"Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", "WenQuanYi Zenhei", sans-serif';

    // 注入全局字体样式
    const style = document.createElement('style');
    style.id = 'playwright-chinese-font-fix';
    style.textContent = \`
      * {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial,
                     \${chineseFontStack} !important;
      }
      /* 确保所有元素使用中文字体 */
      body, div, span, p, h1, h2, h3, h4, h5, h6,
      button, input, textarea, select, option,
      table, thead, tbody, tfoot, tr, th, td,
      .modal-title, .node-title, .field-name,
      .modal-overlay, .vue-flow__node {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial,
                     \${chineseFontStack} !important;
      }
      /* 确保 emoji 和图标正确显示 */
      .palette-node-icon, .node-icon {
        font-family: "Segoe UI Emoji", "Noto Color Emoji", "Apple Color Emoji", sans-serif !important;
      }
    \`;
    document.head.appendChild(style);
  `);
}

/**
 * 禁用测试模式（用于需要实际对话框交互的测试）
 */
export async function disableTestMode(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.__PLAYWRIGHT_TEST__ = false;
  });
}

/**
 * 设置中文字体支持（向后兼容）
 * 在 Linux 环境下注入中文字体样式，解决中文乱码问题
 */
export async function setupChineseFontSupport(page: Page): Promise<void> {
  await setupTestEnvironment(page);
}

/**
 * 设置中文字体支持但不启用测试模式
 * 用于需要实际对话框交互的测试
 */
export async function setupChineseFontSupportOnly(page: Page): Promise<void> {
  await page.addInitScript(`
    // 明确移除测试模式标志，让对话框正常显示
    window.__PLAYWRIGHT_TEST__ = false;

    // 中文字体栈
    const chineseFontStack = '"Noto Sans CJK SC", "PingFang SC", "Microsoft YaHei", "WenQuanYi Zenhei", sans-serif';

    // 注入全局字体样式
    const style = document.createElement('style');
    style.id = 'playwright-chinese-font-fix';
    style.textContent = \`
      * {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial,
                     \${chineseFontStack} !important;
      }
      /* 确保所有元素使用中文字体 */
      body, div, span, p, h1, h2, h3, h4, h5, h6,
      button, input, textarea, select, option,
      table, thead, tbody, tfoot, tr, th, td,
      .modal-title, .node-title, .field-name,
      .modal-overlay, .vue-flow__node {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial",
                     \${chineseFontStack} !important;
      }
      /* 确保 emoji 和图标正确显示 */
      .palette-node-icon, .node-icon {
        font-family: "Segoe UI Emoji", "Noto Color Emoji", "Apple Color Emoji", sans-serif !important;
      }
    \`;
    document.head.appendChild(style);
  `);
}

/**
 * 从侧边栏拖拽节点到画布的辅助函数
 * @param page Playwright Page 对象
 * @param dataTestId 节点的 data-testid 属性值
 * @param targetX 目标 X 坐标（相对于画布）
 * @param targetY 目标 Y 坐标（相对于画布）
 */
export async function dragNodeToCanvas(
  page: Page,
  dataTestId: string,
  targetX: number,
  targetY: number
): Promise<void> {
  const selector = `[data-testid="${dataTestId}"]`;

  // 首先确保元素可见
  await page.waitForSelector(selector, { state: 'visible', timeout: 10000 });

  // 等待一小段时间确保 DOM 完全渲染
  await page.waitForTimeout(100);

  // 直接在浏览器中执行拖放操作
  await page.evaluate(
    ({ sourceSelector, targetX, targetY }) => {
      // 1. 找到源元素
      const sourceEl = document.querySelector(sourceSelector) as HTMLElement;
      if (!sourceEl) {
        throw new Error(`Source element not found: ${sourceSelector}`);
      }

      // 2. 从元素中提取模板数据
      const labelEl = sourceEl.querySelector('.palette-node-label');
      const descEl = sourceEl.querySelector('.palette-node-desc');
      const iconEl = sourceEl.querySelector('.palette-node-icon');

      const label = labelEl?.textContent || '';
      const desc = descEl?.textContent || '';
      const icon = iconEl?.textContent || '';

      // 3. 根据图标确定类型
      let type = 'data_source';
      let category = 'data_source';  // 默认为数据源类别
      let taskType = '';
      let sourceType = '';

      if (icon.includes('🗄️') || label.includes('MySQL')) {
        type = 'data_source';
        category = 'data_source';
        sourceType = 'mysql';
      } else if (icon.includes('🐘') || label.includes('PostgreSQL')) {
        type = 'data_source';
        category = 'data_source';
        sourceType = 'postgresql';
      } else if (icon.includes('📄') || label.includes('CSV')) {
        type = 'data_source';
        category = 'data_source';
        sourceType = 'csv';
      } else if (icon.includes('📊') || label.includes('Excel')) {
        type = 'data_source';
        category = 'data_source';
        sourceType = 'excel';
      } else if (icon.includes('🌐') || label.includes('REST')) {
        type = 'data_source';
        category = 'data_source';
        sourceType = 'rest_api';
      } else if (icon.includes('◈') || label.includes('GraphQL')) {
        type = 'data_source';
        category = 'data_source';
        sourceType = 'graphql';
      } else if (icon.includes('🔎') || label.includes('本地Query') || label.includes('本地 Query')) {
        // 本地Query节点
        type = 'local_query';
        category = 'localTask';
      } else if (icon.includes('🔄') || label.includes('本地结果处理') || label.includes('拼接')) {
        // 本地结果处理节点
        type = 'local_task';
        category = 'localTask';
      } else if (icon.includes('🔐') || label.includes('PSI')) {
        type = 'compute_task';
        category = 'compute_task';
        taskType = 'psi';
      } else if (icon.includes('🔍') || label.includes('PIR')) {
        type = 'compute_task';
        category = 'compute_task';
        taskType = 'pir';
      } else if (icon.includes('🧮') || label.includes('MPC')) {
        type = 'compute_task';
        category = 'compute_task';
        taskType = 'mpc';
      } else if (icon.includes('🤖') || label.includes('联邦')) {
        type = 'compute_task';
        category = 'compute_task';
        taskType = 'federated_learning';
      } else if (icon.includes('🔒') || label.includes('同态')) {
        type = 'compute_task';
        category = 'compute_task';
        taskType = 'homomorphic_encryption';
      } else if (icon.includes('🛡️') || label.includes('差分')) {
        type = 'compute_task';
        category = 'compute_task';
        taskType = 'differential_privacy';
      }

      // 4. 确定颜色
      let color = '#52C41A';
      if (type === 'compute_task') {
        color = '#1890ff';
      }

      // 5. 创建模板数据
      const templateData = {
        type,
        label,
        description: desc,
        icon,
        color,
        category,
        taskType,
        sourceType
      };

      // 调试：输出模板数据
      console.log('[dragNodeToCanvas] Template data:', templateData);

      // 6. 找到画布元素
      const canvasEl = document.querySelector('[data-testid="flow-canvas"]') as HTMLElement;
      if (!canvasEl) {
        throw new Error('Canvas element not found');
      }

      console.log('[dragNodeToCanvas] Canvas element found:', canvasEl);

      // 7. 计算画布的偏移量，将相对坐标转换为视口坐标
      const canvasRect = canvasEl.getBoundingClientRect();
      const clientX = canvasRect.left + targetX;
      const clientY = canvasRect.top + targetY;

      console.log('[dragNodeToCanvas] Canvas rect:', canvasRect);
      console.log('[dragNodeToCanvas] Calculated clientX:', clientX, 'clientY:', clientY);

      // 8. 创建拖放事件并触发
      // 创建 DataTransfer 对象
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('application/vueflow', JSON.stringify(templateData));
      dataTransfer.effectAllowed = 'move';

      // 触发 dragstart 事件
      const dragStartEvent = new DragEvent('dragstart', {
        bubbles: true,
        cancelable: true,
        composed: true,
        dataTransfer
      });
      sourceEl.dispatchEvent(dragStartEvent);

      // 触发 dragover 事件
      const dragOverEvent = new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        composed: true,
        clientX,
        clientY,
        dataTransfer
      });
      canvasEl.dispatchEvent(dragOverEvent);

      // 触发 drop 事件
      // 注意：offsetX/offsetY 在某些浏览器中是只读的，
      // 我们需要在触发时通过实际鼠标位置来让浏览器计算
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        composed: true,
        clientX,
        clientY,
        dataTransfer
      });

      // 手动设置 offsetX 和 offsetY（因为 DragEvent 构造函数不支持）
      Object.defineProperty(dropEvent, 'offsetX', {
        value: targetX,
        writable: false
      });
      Object.defineProperty(dropEvent, 'offsetY', {
        value: targetY,
        writable: false
      });

      console.log('[dragNodeToCanvas] Dispatching drop event');
      const dropResult = canvasEl.dispatchEvent(dropEvent);
      console.log('[dragNodeToCanvas] Drop event dispatched, result:', dropResult);

      // 触发 dragend 事件
      const dragEndEvent = new DragEvent('dragend', {
        bubbles: true,
        cancelable: true,
        composed: true,
        dataTransfer
      });
      sourceEl.dispatchEvent(dragEndEvent);
    },
    { sourceSelector: selector, targetX, targetY }
  );
}

/**
 * 等待节点出现的辅助函数
 */
export async function waitForNodeCount(page: Page, count: number, timeout = 5000): Promise<void> {
  await page.waitForFunction(
    (expectedCount) => {
      const nodes = document.querySelectorAll('.vue-flow__node');
      return nodes.length === expectedCount;
    },
    count,
    { timeout }
  );
}

/**
 * 处理技术路径选择对话框
 * 在测试模式下，应用会自动创建节点，此函数只需等待节点创建完成
 */
export async function handleTechPathDialog(page: Page, techPath?: 'SOFTWARE' | 'TEE'): Promise<void> {
  // 在测试模式下，应用检测到 window.__PLAYWRIGHT_TEST__ 或 navigator.webdriver
  // 会自动创建节点，不需要手动处理对话框
  // 只需等待一小段时间让节点被创建
  await page.waitForTimeout(500);

  // 如果对话框仍然出现（非测试模式），则处理它
  const dialogVisible = await page.locator('.modal-overlay').isVisible().catch(() => false);
  if (dialogVisible) {
    await page.waitForTimeout(200);

    // 选择技术路径（如果指定）
    if (techPath === 'SOFTWARE') {
      // 软件密码学默认已选中，但如果需要可以点击
      const softwareOption = page.locator('role=radio').filter({ hasText: '软件密码学' });
      if (await softwareOption.isVisible().catch(() => false)) {
        await softwareOption.click();
      }
    } else if (techPath === 'TEE') {
      const teeOption = page.locator('role=radio').filter({ hasText: '硬件 TEE' });
      await teeOption.click();
    }

    await page.waitForTimeout(200);

    // 点击确认按钮 - 使用按钮文本定位
    const confirmBtn = page.locator('button').filter({ hasText: '确定' });
    await confirmBtn.click();
    await page.waitForTimeout(300);
  }
}

/**
 * 处理资产选择对话框的快速确认（测试模式）
 * 在测试模式下，应用会自动创建模拟数据，此函数只需等待节点创建完成
 */
export async function handleAssetDialogQuick(page: Page): Promise<void> {
  // 在测试模式下，应用检测到 window.__PLAYWRIGHT_TEST__ 或 navigator.webdriver
  // 会自动创建模拟资产数据，不需要手动处理对话框
  // 只需等待节点被创建即可
  await page.waitForTimeout(500);
}

/**
 * 取消模态框
 */
export async function cancelModal(page: Page): Promise<void> {
  const modal = page.locator('.modal-overlay');
  const isVisible = await modal.isVisible().catch(() => false);

  if (isVisible) {
    // 尝试点击关闭按钮
    const closeBtn = page.locator('.modal-close, .close-button');
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
    } else {
      // 按 ESC 键
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(300);
  }
}

/**
 * 直接创建本地Query节点（用于测试）
 * 通过 window.dispatchEvent 触发 create-test-node 事件
 */
export async function createLocalQueryNodeDirectly(
  page: Page,
  position: { x: number; y: number } = { x: 400, y: 200 }
): Promise<void> {
  await page.evaluate((pos) => {
    const localQueryData = {
      type: 'local_query',
      label: '本地Query',
      category: 'localTask',
      computeType: 'LOCAL_QUERY',
      icon: '🔎',
      color: '#13C2C2',
      description: '本地 SQL 查询计算'
    };

    window.dispatchEvent(new CustomEvent('create-test-node', {
      detail: { data: localQueryData, position: pos }
    }));
  }, position);

  // Wait for the node to be added to DOM (check count, not visibility)
  await page.waitForFunction(
    () => document.querySelectorAll('.vue-flow__node').length > 0,
    { timeout: 5000 }
  );
}

/**
 * FL 任务类型定义
 */
export type FLMode = 'training' | 'inference';
export type FLTaskCategory = 'preprocessing' | 'feature_engineering' | 'horizontal_model' | 'vertical_model' | 'inference';

/**
 * 直接创建 FL 任务节点（用于测试）
 */
export async function createFLTaskNodeDirectly(
  page: Page,
  options: {
    taskName: string;
    taskDisplayName: string;
    category: FLTaskCategory;
    mode: FLMode;
    icon?: string;
    position?: { x: number; y: number };
  }
): Promise<void> {
  const { taskName, taskDisplayName, category, mode, icon = '🎓', position = { x: 400, y: 200 } } = options;

  await page.evaluate((opts) => {
    const categoryColors: Record<string, string> = {
      preprocessing: '#52C41A',
      feature_engineering: '#1890FF',
      horizontal_model: '#722ED1',
      vertical_model: '#EB2F96',
      inference: '#FA8C16'
    };

    const flTaskData = {
      type: 'fl_task',
      label: opts.taskDisplayName,
      category: 'compute_task',
      taskType: 'federated_learning',
      icon: opts.icon,
      color: categoryColors[opts.category] || '#1890FF',
      flTask: {
        taskName: opts.taskName,
        taskDisplayName: opts.taskDisplayName,
        category: opts.category,
        mode: opts.mode
      }
    };

    window.dispatchEvent(new CustomEvent('create-test-node', {
      detail: { data: flTaskData, position: opts.position }
    }));
  }, { taskName, taskDisplayName, category, mode, icon, position });

  // Wait for the node to be added to DOM
  await page.waitForFunction(
    () => document.querySelectorAll('.vue-flow__node').length > 0,
    { timeout: 5000 }
  );
}

/**
 * 悬停并展开 FL 训练菜单
 */
export async function hoverAndExpandFLTrainingMenu(page: Page): Promise<void> {
  // 使用 JavaScript 直接触发 mouseenter 事件
  await page.evaluate(() => {
    const flSections = document.querySelectorAll('.fl-section');
    flSections.forEach((section) => {
      if (section.textContent?.includes('联邦学习训练')) {
        const event = new MouseEvent('mouseenter', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        section.dispatchEvent(event);
      }
    });
  });

  await page.waitForTimeout(300);

  // 等待子菜单出现
  const submenu = page.locator('.fl-submenu');
  await submenu.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
}

/**
 * 悬停并展开 FL 推断菜单
 */
export async function hoverAndExpandFLInferenceMenu(page: Page): Promise<void> {
  // 使用 JavaScript 直接触发 mouseenter 事件
  await page.evaluate(() => {
    const flSections = document.querySelectorAll('.fl-section');
    flSections.forEach((section) => {
      if (section.textContent?.includes('联邦学习推断')) {
        const event = new MouseEvent('mouseenter', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        section.dispatchEvent(event);
      }
    });
  });

  await page.waitForTimeout(300);

  // 等待子菜单出现
  const submenu = page.locator('.fl-submenu');
  await submenu.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
}

/**
 * 悬停并展开 FL 分类菜单
 */
export async function hoverAndExpandFLCategory(page: Page, categoryName: string): Promise<void> {
  // 使用 JavaScript 直接触发 mouseenter 事件
  await page.evaluate((name) => {
    const categories = document.querySelectorAll('.fl-category');
    categories.forEach((category) => {
      if (category.textContent?.includes(name)) {
        const event = new MouseEvent('mouseenter', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        category.dispatchEvent(event);
      }
    });
  }, categoryName);

  await page.waitForTimeout(300);

  // 等待任务列表出现
  const taskList = page.locator('.fl-task-list');
  await taskList.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
}
