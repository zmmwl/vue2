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
      let category = '';
      let taskType = '';
      let sourceType = '';

      if (icon.includes('🗄️') || label.includes('MySQL')) {
        type = 'data_source';
        sourceType = 'mysql';
      } else if (icon.includes('🐘') || label.includes('PostgreSQL')) {
        type = 'data_source';
        sourceType = 'postgresql';
      } else if (icon.includes('📄') || label.includes('CSV')) {
        type = 'data_source';
        sourceType = 'csv';
      } else if (icon.includes('📊') || label.includes('Excel')) {
        type = 'data_source';
        sourceType = 'excel';
      } else if (icon.includes('🌐') || label.includes('REST')) {
        type = 'data_source';
        sourceType = 'rest_api';
      } else if (icon.includes('◈') || label.includes('GraphQL')) {
        type = 'data_source';
        sourceType = 'graphql';
      } else if (icon.includes('🔐') || label.includes('PSI')) {
        type = 'compute_task';
        category = 'privacy_computation';
        taskType = 'psi';
      } else if (icon.includes('🔍') || label.includes('PIR')) {
        type = 'compute_task';
        category = 'privacy_computation';
        taskType = 'pir';
      } else if (icon.includes('🧮') || label.includes('MPC')) {
        type = 'compute_task';
        category = 'privacy_computation';
        taskType = 'mpc';
      } else if (icon.includes('🤖') || label.includes('联邦')) {
        type = 'compute_task';
        category = 'privacy_computation';
        taskType = 'federated_learning';
      } else if (icon.includes('🔒') || label.includes('同态')) {
        type = 'compute_task';
        category = 'privacy_computation';
        taskType = 'homomorphic_encryption';
      } else if (icon.includes('🛡️') || label.includes('差分')) {
        type = 'compute_task';
        category = 'privacy_computation';
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

      // 6. 找到画布元素
      const canvasEl = document.querySelector('[data-testid="flow-canvas"]') as HTMLElement;
      if (!canvasEl) {
        throw new Error('Canvas element not found');
      }

      // 7. 计算画布的偏移量，将相对坐标转换为视口坐标
      const canvasRect = canvasEl.getBoundingClientRect();
      const clientX = canvasRect.left + targetX;
      const clientY = canvasRect.top + targetY;

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

      canvasEl.dispatchEvent(dropEvent);

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
