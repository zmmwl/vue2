/**
 * Union 字段对齐按钮测试
 * Feature: 005-join-types-extension - 验证"配置字段对齐"按钮显示
 */

import { test, expect, Page } from '@playwright/test'

// 配置测试为串行模式
test.describe.configure({ mode: 'serial' })

/**
 * 辅助函数：通过 JavaScript 触发完整的 HTML5 拖放事件创建计算任务节点
 */
async function dragComputeTaskToCanvas(
  page: Page,
  taskType: 'MPC' | 'PSI' | 'PIR' | 'FL' = 'MPC',
  targetX: number = 400,
  targetY: number = 200
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

  // 检查是否出现了技术路径选择对话框
  const techPathDialog = page.locator('text=选择技术路径')
  const hasTechPathDialog = await techPathDialog.count() > 0

  if (hasTechPathDialog) {
    await page.waitForTimeout(300)
    const confirmBtn = page.locator('.modal-container button:has-text("确定")')
    await confirmBtn.click()
    await page.waitForTimeout(500)
  }
}

// ==================== Union 配置字段对齐按钮测试 ====================

test.describe('Union 字段对齐按钮显示', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.vue-flow', { timeout: 10000 })
  })

  test('当详情面板显示计算任务时，应该能看到输入数据section', async ({ page }) => {
    // 创建 MPC 任务节点
    await dragComputeTaskToCanvas(page, 'MPC', 300, 200)

    // 验证节点创建
    const taskNode = page.locator('.compute-task-node')
    await expect(taskNode).toBeVisible({ timeout: 5000 })

    // 点击任务节点
    await taskNode.click()
    await page.waitForTimeout(300)

    // 等待详情面板
    const detailPanel = page.locator('.flow-detail-panel')
    await expect(detailPanel).toBeVisible({ timeout: 5000 })

    // 验证输入数据 section 存在
    const inputDataSection = detailPanel.locator('h4:has-text("输入数据")')
    await expect(inputDataSection).toBeVisible({ timeout: 5000 })
  })

  test('Union类型应该在Join类型下拉菜单中可用', async ({ page }) => {
    // 创建 MPC 任务节点
    await dragComputeTaskToCanvas(page, 'MPC', 300, 200)

    // 验证节点创建
    const taskNode = page.locator('.compute-task-node')
    await expect(taskNode).toBeVisible({ timeout: 5000 })

    // 点击任务节点
    await taskNode.click()
    await page.waitForTimeout(300)

    // 等待详情面板
    const detailPanel = page.locator('.flow-detail-panel')
    await expect(detailPanel).toBeVisible({ timeout: 5000 })

    // 使用测试事件打开配置对话框
    await page.evaluate(() => {
      const event = new CustomEvent('test-open-input-provider-config', {
        detail: {
          provider: {
            id: 'test-provider-1',
            sourceNodeId: 'test-source-1',
            participantId: 'participant-1',
            dataset: '测试数据集',
            fields: [
              { columnName: 'id', columnType: 'STRING', isJoinField: true },
              { columnName: 'name', columnType: 'STRING', isJoinField: false }
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

    // 验证所有四个 Join 类型选项都存在
    const joinTypeSelect = modal.locator('select.join-type-select')

    const innerOption = joinTypeSelect.locator('option[value="INNER"]')
    const crossOption = joinTypeSelect.locator('option[value="CROSS"]')
    const unionOption = joinTypeSelect.locator('option[value="Union"]')
    const noAssocOption = joinTypeSelect.locator('option[value="NoAssoc"]')

    await expect(innerOption).toHaveCount(1)
    await expect(crossOption).toHaveCount(1)
    await expect(unionOption).toHaveCount(1)
    await expect(noAssocOption).toHaveCount(1)

    // 选择 Union 并验证
    await joinTypeSelect.selectOption('Union')
    await expect(joinTypeSelect).toHaveValue('Union')

    // 验证提示文本
    const hint = modal.locator('.join-type-hint')
    await expect(hint).toContainText('横向拼接')

    // 关闭对话框
    const cancelBtn = modal.locator('button:has-text("取消")')
    await cancelBtn.click()
  })

  test('当有多个Union类型数据源时，应该显示Union section和配置按钮', async ({ page }) => {
    // 捕获控制台日志
    page.on('console', msg => {
      if (msg.text().includes('[') || msg.text().includes('Flow') || msg.text().includes('provider')) {
        console.log('BROWSER:', msg.text())
      }
    })

    // 创建 MPC 任务节点
    await dragComputeTaskToCanvas(page, 'MPC', 300, 200)

    // 验证节点创建
    const taskNode = page.locator('.compute-task-node')
    await expect(taskNode).toBeVisible({ timeout: 5000 })

    // 获取创建的节点 ID
    // VueFlow 节点使用 data-id 属性
    const nodeElement = page.locator('.vue-flow__node.compute-task-node, .vue-flow__node[data-id]').first()
    const vueFlowNodeId = await nodeElement.getAttribute('data-id')
    console.log('VueFlow node ID (data-id):', vueFlowNodeId)

    // 获取所有节点的 data-id
    const allNodeDataIds = await page.evaluate(() => {
      const nodes = document.querySelectorAll('.vue-flow__node')
      return Array.from(nodes).map(n => n.getAttribute('data-id'))
    })
    console.log('All node data-ids:', allNodeDataIds)

    // 点击任务节点
    await taskNode.click()
    await page.waitForTimeout(500)

    // 检查节点的选中状态
    const isSelected = await taskNode.evaluate((el) => {
      return el.classList.contains('selected') || el.closest('.vue-flow__node.selected') !== null
    })
    console.log('Node selected class:', isSelected)

    // 等待详情面板
    const detailPanel = page.locator('.flow-detail-panel')
    await expect(detailPanel).toBeVisible({ timeout: 5000 })

    // 获取当前选中的节点 ID
    const selectedNodeId = await page.evaluate(() => {
      return (window as any).__selectedNodeId || null
    })
    console.log('Selected node ID from global:', selectedNodeId)

    // 检查详情面板是否显示了正确的节点
    const detailPanelTitle = await detailPanel.locator('h4:has-text("任务信息")').first().textContent()
    console.log('Detail panel shows:', detailPanelTitle)

    // 获取任务名称来确认正确的节点被选中
    const taskName = await detailPanel.locator('.info-value').first().textContent()
    console.log('Task name in detail panel:', taskName)

    // 添加第一个 Union 类型的数据源
    await page.evaluate(() => {
      const event = new CustomEvent('test-open-input-provider-config', {
        detail: {
          provider: {
            id: 'test-provider-1',
            sourceNodeId: 'test-source-1',
            participantId: 'participant-1',
            dataset: '数据源1',
            fields: [
              { columnName: 'id', columnType: 'STRING', isJoinField: false },
              { columnName: 'name', columnType: 'STRING', isJoinField: false }
            ],
            joinType: 'INNER'
          }
        }
      })
      window.dispatchEvent(event)
    })

    await page.waitForTimeout(500)

    // 等待配置对话框并选择 Union
    const modal = page.locator('.input-provider-config-modal')
    await expect(modal).toBeVisible({ timeout: 5000 })

    // 等待字段加载
    await page.waitForTimeout(300)

    const joinTypeSelect = modal.locator('select.join-type-select')
    await joinTypeSelect.selectOption('Union')
    await page.waitForTimeout(200)

    const confirmBtn = modal.locator('button:has-text("确认")')

    // 确认按钮是否可点击
    const isDisabled = await confirmBtn.isDisabled()
    console.log('Confirm button disabled:', isDisabled)

    if (isDisabled) {
      // 如果按钮被禁用，检查是否有选中的字段
      const fieldCount = await modal.locator('input[type="checkbox"]:checked').count()
      console.log('Checked field count:', fieldCount)
    }

    await confirmBtn.click()
    await page.waitForTimeout(500)

    // 检查第一个 provider 是否被添加
    const inputCount1 = await detailPanel.locator('h4:has-text("输入数据")').textContent()
    console.log('After first confirm - Input count:', inputCount1)

    // 添加第二个 Union 类型的数据源
    await page.evaluate(() => {
      const event = new CustomEvent('test-open-input-provider-config', {
        detail: {
          provider: {
            id: 'test-provider-2',
            sourceNodeId: 'test-source-2',
            participantId: 'participant-2',
            dataset: '数据源2',
            fields: [
              { columnName: 'id', columnType: 'STRING', isJoinField: false },
              { columnName: 'value', columnType: 'INT', isJoinField: false }
            ],
            joinType: 'INNER'
          }
        }
      })
      window.dispatchEvent(event)
    })

    await page.waitForTimeout(500)

    // 等待配置对话框并选择 Union
    await expect(modal).toBeVisible({ timeout: 5000 })
    await page.waitForTimeout(300)
    await joinTypeSelect.selectOption('Union')
    await page.waitForTimeout(200)
    await confirmBtn.click()
    await page.waitForTimeout(500)

    // 检查第二个 provider 是否被添加
    const inputCount2 = await detailPanel.locator('h4:has-text("输入数据")').textContent()
    console.log('After second confirm - Input count:', inputCount2)

    // 验证 Union 配置区域出现
    const unionConfig = detailPanel.locator('.union-align-config')
    await expect(unionConfig).toBeVisible({ timeout: 5000 })

    // 验证"配置"按钮存在
    const configButton = unionConfig.locator('button:has-text("配置")')
    await expect(configButton).toBeVisible({ timeout: 5000 })

    // 验证按钮可点击
    await expect(configButton).toBeEnabled()
  })
})
