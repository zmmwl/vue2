/**
 * Join Types Extension E2E Tests
 * Feature: 005-join-types-extension
 *
 * Tests for Union, NoAssoc, and CROSS type configurations
 */

import { test, expect, Page } from '@playwright/test'

// 配置测试为串行模式，避免并行冲突
test.describe.configure({ mode: 'serial' })

/**
 * 辅助函数：通过 JavaScript 触发完整的 HTML5 拖放事件
 */
async function dragComputeTaskToCanvas(
  page: Page,
  taskType: 'MPC' | 'PSI' | 'PIR' | 'FL' = 'MPC',
  targetX: number = 200,
  targetY: number = 150
) {
  const taskLabels: Record<string, string> = {
    'MPC': 'MPC 计算',
    'PSI': 'PSI 计算',
    'PIR': 'PIR 查询',
    'FL': '联邦学习'
  }

  const nodeTemplate = {
    type: 'compute_task',
    category: 'compute_task',
    taskType: taskType,
    label: taskLabels[taskType],
    computeType: taskType,
    icon: taskType === 'MPC' ? '🔐' : taskType === 'PSI' ? '🔗' : taskType === 'PIR' ? '🔍' : '🎓',
    color: '#1890ff'
  }

  await page.evaluate(
    ({ targetX, targetY, nodeTemplateStr }) => {
      const nodeTemplate = JSON.parse(nodeTemplateStr)

      const computeTaskSection = Array.from(document.querySelectorAll('.sidebar-section')).find(
        section => section.textContent?.includes('计算任务')
      )
      if (!computeTaskSection) {
        console.error('Compute task section not found')
        return
      }

      const taskNodes = computeTaskSection.querySelectorAll('.palette-node')
      let sourceElement: HTMLElement | null = null
      for (const node of taskNodes) {
        if (node.textContent?.includes(nodeTemplate.label)) {
          sourceElement = node as HTMLElement
          break
        }
      }
      if (!sourceElement) {
        console.error('Source element not found for:', nodeTemplate.label)
        return
      }

      const flowCanvas = document.querySelector('.flow-canvas') as HTMLElement
      if (!flowCanvas) {
        console.error('Flow canvas not found')
        return
      }

      const dataTransfer = new DataTransfer()
      dataTransfer.setData('application/vueflow', JSON.stringify(nodeTemplate))
      dataTransfer.effectAllowed = 'move'

      const sourceRect = sourceElement.getBoundingClientRect()
      const targetRect = flowCanvas.getBoundingClientRect()

      const sourceCenterX = sourceRect.left + sourceRect.width / 2
      const sourceCenterY = sourceRect.top + sourceRect.height / 2
      const clientX = targetRect.left + targetX
      const clientY = targetRect.top + targetY

      const dragStartEvent = new DragEvent('dragstart', {
        bubbles: true,
        cancelable: true,
        clientX: sourceCenterX,
        clientY: sourceCenterY,
        dataTransfer
      })
      sourceElement.dispatchEvent(dragStartEvent)

      const dragEnterEvent = new DragEvent('dragenter', {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
        dataTransfer
      })
      flowCanvas.dispatchEvent(dragEnterEvent)

      const dragOverEvent = new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
        dataTransfer
      })
      flowCanvas.dispatchEvent(dragOverEvent)

      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
        dataTransfer
      })
      Object.defineProperty(dropEvent, 'offsetX', { value: targetX, writable: false })
      Object.defineProperty(dropEvent, 'offsetY', { value: targetY, writable: false })
      flowCanvas.dispatchEvent(dropEvent)

      const dragEndEvent = new DragEvent('dragend', {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
        dataTransfer
      })
      sourceElement.dispatchEvent(dragEndEvent)

      console.log('Drag events dispatched for:', nodeTemplate.label)
    },
    { targetX, targetY, nodeTemplateStr: JSON.stringify(nodeTemplate) }
  )

  await page.waitForTimeout(800)

  // 等待并处理技术路径选择对话框（MPC/PIR 任务会弹出）
  await page.waitForTimeout(2500)
  // 在页面上下文中直接查找并触发确定按钮点击
  await page.evaluate(() => {
    // 查找所有包含"确定"文本的按钮
    const buttons = Array.from(document.querySelectorAll('button'))
    const confirmBtn = buttons.find(btn => btn.textContent?.trim() === '确定')
    if (confirmBtn) {
      // 创建并派发鼠标事件来模拟真实点击
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      })
      confirmBtn.dispatchEvent(event)
    }
  })
  await page.waitForTimeout(1500)
}

/**
 * 辅助函数：使用测试事件打开输入源配置对话框
 */
async function openInputProviderConfigWithTestEvent(page: Page) {
  // 使用测试事件打开配置对话框
  await page.evaluate(() => {
    const event = new CustomEvent('test-open-input-provider-config', {
      detail: {
        provider: {
          id: 'test-provider-1',
          participantId: 'participant-1',
          dataset: '测试数据集',
          fields: [
            { name: 'id', type: 'string', selected: true },
            { name: 'name', type: 'string', selected: true },
            { name: 'value', type: 'number', selected: true }
          ],
          joinType: 'INNER'
        }
      }
    })
    window.dispatchEvent(event)
  })

  await page.waitForTimeout(500)

  // 等待配置对话框
  const modal = page.locator('.input-provider-config-modal')
  await expect(modal).toBeVisible({ timeout: 5000 })

  return modal
}

// ==================== Join Types Tests ====================

test.describe('Join Types Extension', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.vue-flow', { timeout: 10000 })
  })

  test.describe('Union Type Configuration', () => {
    test('should display Union option in join type selector', async ({ page }) => {
      await dragComputeTaskToCanvas(page, 'MPC', 200, 150)

      const computeNode = page.locator('.compute-task-node')
      // 使用 toBeAttached 检查节点是否在 DOM 中(而不是 toBeVisible)
      await expect(computeNode).toBeAttached({ timeout: 5000 })
      // 等待节点渲染完成
      await page.waitForTimeout(1000)

      await openInputProviderConfigWithTestEvent(page)

      // 检查连接类型选择器
      const joinTypeSelect = page.locator('select.join-type-select')
      await expect(joinTypeSelect).toBeVisible({ timeout: 5000 })

      // 选择 Union 类型
      await joinTypeSelect.selectOption('Union')
      await expect(joinTypeSelect).toHaveValue('Union')
    })

    test('should show hint text for Union type', async ({ page }) => {
      await dragComputeTaskToCanvas(page, 'MPC', 200, 150)

      const computeNode = page.locator('.compute-task-node')
      // 使用 toBeAttached 检查节点是否在 DOM 中(而不是 toBeVisible)
      await expect(computeNode).toBeAttached({ timeout: 5000 })
      // 等待节点渲染完成
      await page.waitForTimeout(1000)

      await openInputProviderConfigWithTestEvent(page)

      const joinTypeSelect = page.locator('select.join-type-select')
      await joinTypeSelect.selectOption('Union')

      // 验证提示文本包含横向拼接相关说明
      const hint = page.locator('.join-type-hint')
      await expect(hint).toBeVisible({ timeout: 3000 })
      await expect(hint).toContainText('横向拼接')
    })
  })

  test.describe('NoAssoc Type Configuration', () => {
    test('should display NoAssoc option in join type selector', async ({ page }) => {
      await dragComputeTaskToCanvas(page, 'MPC', 200, 150)

      const computeNode = page.locator('.compute-task-node')
      // 使用 toBeAttached 检查节点是否在 DOM 中(而不是 toBeVisible)
      await expect(computeNode).toBeAttached({ timeout: 5000 })
      // 等待节点渲染完成
      await page.waitForTimeout(1000)

      await openInputProviderConfigWithTestEvent(page)

      const joinTypeSelect = page.locator('select.join-type-select')
      await expect(joinTypeSelect).toBeVisible({ timeout: 5000 })

      await joinTypeSelect.selectOption('NoAssoc')
      await expect(joinTypeSelect).toHaveValue('NoAssoc')
    })

    test('should show hint text for NoAssoc type', async ({ page }) => {
      await dragComputeTaskToCanvas(page, 'MPC', 200, 150)

      const computeNode = page.locator('.compute-task-node')
      // 使用 toBeAttached 检查节点是否在 DOM 中(而不是 toBeVisible)
      await expect(computeNode).toBeAttached({ timeout: 5000 })
      // 等待节点渲染完成
      await page.waitForTimeout(1000)

      await openInputProviderConfigWithTestEvent(page)

      const joinTypeSelect = page.locator('select.join-type-select')
      await joinTypeSelect.selectOption('NoAssoc')

      const hint = page.locator('.join-type-hint')
      await expect(hint).toBeVisible({ timeout: 3000 })
      await expect(hint).toContainText('独立')
    })
  })

  test.describe('CROSS Type Optimization', () => {
    test('should have CROSS option available', async ({ page }) => {
      await dragComputeTaskToCanvas(page, 'MPC', 200, 150)

      const computeNode = page.locator('.compute-task-node')
      // 使用 toBeAttached 检查节点是否在 DOM 中(而不是 toBeVisible)
      await expect(computeNode).toBeAttached({ timeout: 5000 })
      // 等待节点渲染完成
      await page.waitForTimeout(1000)

      await openInputProviderConfigWithTestEvent(page)

      const joinTypeSelect = page.locator('select.join-type-select')
      await expect(joinTypeSelect).toBeVisible({ timeout: 5000 })

      await joinTypeSelect.selectOption('CROSS')
      await expect(joinTypeSelect).toHaveValue('CROSS')
    })

    test('should show hint text for CROSS type', async ({ page }) => {
      await dragComputeTaskToCanvas(page, 'MPC', 200, 150)

      const computeNode = page.locator('.compute-task-node')
      // 使用 toBeAttached 检查节点是否在 DOM 中(而不是 toBeVisible)
      await expect(computeNode).toBeAttached({ timeout: 5000 })
      // 等待节点渲染完成
      await page.waitForTimeout(1000)

      await openInputProviderConfigWithTestEvent(page)

      const joinTypeSelect = page.locator('select.join-type-select')
      await joinTypeSelect.selectOption('CROSS')

      const hint = page.locator('.join-type-hint')
      await expect(hint).toBeVisible({ timeout: 3000 })
      await expect(hint).toContainText('笛卡尔')
    })
  })

  test.describe('Type Compatibility Validation', () => {
    test('should show all four join type options', async ({ page }) => {
      await dragComputeTaskToCanvas(page, 'MPC', 200, 150)

      const computeNode = page.locator('.compute-task-node')
      // 使用 toBeAttached 检查节点是否在 DOM 中(而不是 toBeVisible)
      await expect(computeNode).toBeAttached({ timeout: 5000 })
      // 等待节点渲染完成
      await page.waitForTimeout(1000)

      await openInputProviderConfigWithTestEvent(page)

      const joinTypeSelect = page.locator('select.join-type-select')
      await expect(joinTypeSelect).toBeVisible({ timeout: 5000 })

      // 验证所有四个选项都存在（使用 count 而不是可见性检查）
      const innerOption = joinTypeSelect.locator('option[value="INNER"]')
      const crossOption = joinTypeSelect.locator('option[value="CROSS"]')
      const unionOption = joinTypeSelect.locator('option[value="Union"]')
      const noAssocOption = joinTypeSelect.locator('option[value="NoAssoc"]')

      // 选项存在于 DOM 中
      await expect(innerOption).toHaveCount(1)
      await expect(crossOption).toHaveCount(1)
      await expect(unionOption).toHaveCount(1)
      await expect(noAssocOption).toHaveCount(1)

      // 可以实际选择每个选项
      await joinTypeSelect.selectOption('INNER')
      await expect(joinTypeSelect).toHaveValue('INNER')

      await joinTypeSelect.selectOption('CROSS')
      await expect(joinTypeSelect).toHaveValue('CROSS')

      await joinTypeSelect.selectOption('Union')
      await expect(joinTypeSelect).toHaveValue('Union')

      await joinTypeSelect.selectOption('NoAssoc')
      await expect(joinTypeSelect).toHaveValue('NoAssoc')
    })
  })
})
