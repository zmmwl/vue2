/**
 * DAG流程编排端到端测试
 * Feature: 010-dag-orchestration
 *
 * 测试各种DAG流程编排场景，覆盖：
 * - 数据源节点：数据库表、CSV文件、实时数据源
 * - 计算任务节点：PSI、PIR、MPC、联邦学习
 * - 本地任务节点：本地结果处理、本地Query
 *
 * 场景包括：
 * - 简单流程：数据源 -> 计算任务
 * - 多数据源流程：多数据源 -> 计算任务
 * - 串联流程：计算任务1 -> 计算任务2
 * - 复杂DAG：多分支、多合并
 */

import { test, expect, Page } from '@playwright/test'

// 配置测试为串行模式以避免状态冲突
test.describe.configure({ mode: 'serial' })

/**
 * 辅助函数：启用测试模式
 * 设置 window.__PLAYWRIGHT_TEST__ = true，使 FlowCanvas 直接创建节点而不弹出对话框
 */
async function enableTestMode(page: Page) {
  await page.evaluate(() => {
    ;(window as any).__PLAYWRIGHT_TEST__ = true
  })
}

/**
 * 辅助函数：通过 JavaScript 触发 HTML5 拖放事件
 * 在指定的 sidebar section 中查找节点并拖放到画布
 */
async function dragNodeToCanvas(
  page: Page,
  sectionName: string,
  nodeLabel: string,
  nodeTemplate: object,
  targetX: number,
  targetY: number
) {
  await page.evaluate(
    ({ targetX, targetY, nodeTemplateStr, sectionName, nodeLabel }) => {
      const nodeTemplate = JSON.parse(nodeTemplateStr)

      // 找到对应的 sidebar section
      const sidebarSection = Array.from(document.querySelectorAll('.sidebar-section')).find(
        section => section.textContent?.includes(sectionName)
      )
      if (!sidebarSection) {
        console.error('Section not found:', sectionName)
        return
      }

      // 在该 section 中找到对应的节点元素
      const nodes = sidebarSection.querySelectorAll('.palette-node')
      let sourceElement: HTMLElement | null = null

      for (const node of nodes) {
        const nodeText = node.textContent || ''
        if (nodeText.includes(nodeLabel)) {
          sourceElement = node as HTMLElement
          break
        }
      }

      if (!sourceElement) {
        console.error('Source element not found for:', nodeLabel)
        return
      }

      // 找到目标画布
      const flowCanvas = document.querySelector('.flow-canvas') as HTMLElement
      if (!flowCanvas) {
        console.error('Flow canvas not found')
        return
      }

      // 创建 DataTransfer 对象并设置数据
      const dataTransfer = new DataTransfer()
      dataTransfer.setData('application/vueflow', JSON.stringify(nodeTemplate))
      dataTransfer.effectAllowed = 'move'

      // 获取位置
      const sourceRect = sourceElement.getBoundingClientRect()
      const targetRect = flowCanvas.getBoundingClientRect()

      const sourceCenterX = sourceRect.left + sourceRect.width / 2
      const sourceCenterY = sourceRect.top + sourceRect.height / 2
      const clientX = targetRect.left + targetX
      const clientY = targetRect.top + targetY

      // 触发 dragstart
      const dragStartEvent = new DragEvent('dragstart', {
        bubbles: true,
        cancelable: true,
        clientX: sourceCenterX,
        clientY: sourceCenterY,
        dataTransfer
      })
      sourceElement.dispatchEvent(dragStartEvent)

      // 触发 dragenter
      const dragEnterEvent = new DragEvent('dragenter', {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
        dataTransfer
      })
      flowCanvas.dispatchEvent(dragEnterEvent)

      // 触发 dragover
      const dragOverEvent = new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
        dataTransfer
      })
      flowCanvas.dispatchEvent(dragOverEvent)

      // 触发 drop
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

      // 触发 dragend
      const dragEndEvent = new DragEvent('dragend', {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
        dataTransfer
      })
      sourceElement.dispatchEvent(dragEndEvent)

      console.log('Drag events dispatched for:', nodeLabel)
    },
    { targetX, targetY, nodeTemplateStr: JSON.stringify(nodeTemplate), sectionName, nodeLabel }
  )

  await page.waitForTimeout(500)
}

/**
 * 辅助函数：创建数据源节点
 */
async function createDataSourceNode(
  page: Page,
  sourceType: 'database' | 'csv' | 'realtime',
  x: number,
  y: number
) {
  const configs: Record<string, { label: string; sourceTypeValue: string; type: string }> = {
    database: { label: '数据库表', sourceTypeValue: 'DATABASE', type: 'data_source' },
    csv: { label: 'CSV 文件', sourceTypeValue: 'FILE', type: 'data_source' },
    realtime: { label: '实时数据源', sourceTypeValue: 'REALTIME', type: 'realtime_datasource' }
  }

  const config = configs[sourceType]
  const template = {
    type: config.type,
    category: 'data_source',
    label: config.label,
    sourceType: config.sourceTypeValue,
    icon: sourceType === 'database' ? '🗄️' : sourceType === 'csv' ? '📄' : '⚡',
    color: '#52C41A'
  }

  await dragNodeToCanvas(page, '数据源', config.label, template, x, y)
}

/**
 * 辅助函数：创建计算任务节点
 */
async function createComputeTaskNode(
  page: Page,
  taskType: 'PSI' | 'PIR' | 'MPC' | 'FL',
  x: number,
  y: number
) {
  const configs: Record<string, { label: string; type: string }> = {
    PSI: { label: 'PSI 计算', type: 'compute_task' },
    PIR: { label: 'PIR 查询', type: 'pir_task' },
    MPC: { label: 'MPC 计算', type: 'compute_task' },
    FL: { label: '联邦学习', type: 'fl_task' }
  }

  const config = configs[taskType]
  const template = {
    type: config.type,
    category: 'compute_task',
    label: config.label,
    taskType: taskType,
    computeType: taskType,
    icon: taskType === 'MPC' ? '🧮' : taskType === 'PSI' ? '🔐' : taskType === 'PIR' ? '🔍' : '🤖',
    color: '#1890FF',
    flTask: taskType === 'FL' ? 'horizontal' : undefined
  }

  await dragNodeToCanvas(page, '计算任务', config.label, template, x, y)
}

/**
 * 辅助函数：创建本地任务节点
 */
async function createLocalTaskNode(
  page: Page,
  taskType: 'localResult' | 'localQuery',
  x: number,
  y: number
) {
  const configs: Record<string, { label: string; type: string; category: string }> = {
    localResult: { label: '本地结果处理', type: 'localTask', category: 'localTask' },
    localQuery: { label: '本地Query', type: 'local_query', category: 'local_task' }
  }

  const config = configs[taskType]
  const template = {
    type: config.type,
    category: config.category,
    label: config.label,
    computeType: taskType === 'localQuery' ? 'LOCAL_QUERY' : undefined,
    icon: taskType === 'localResult' ? '🔄' : '🔎',
    color: '#722ED1'
  }

  await dragNodeToCanvas(page, '本地计算任务', config.label, template, x, y)
}

/**
 * 辅助函数：验证节点数量
 */
async function verifyNodeCount(page: Page, expectedCount: number) {
  const nodes = page.locator('.vue-flow__node')
  const count = await nodes.count()
  expect(count).toBe(expectedCount)
}

// ==================== 基础场景测试 - 数据源 ====================

test.describe('基础场景 - 数据源节点创建', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.vue-flow', { timeout: 10000 })
    await enableTestMode(page)
  })

  test('创建数据库表数据源节点', async ({ page }) => {
    await createDataSourceNode(page, 'database', 200, 100)
    await verifyNodeCount(page, 1)
  })

  test('创建CSV文件数据源节点', async ({ page }) => {
    await createDataSourceNode(page, 'csv', 200, 100)
    await verifyNodeCount(page, 1)
  })

  test('创建实时数据源节点', async ({ page }) => {
    await createDataSourceNode(page, 'realtime', 200, 100)
    await verifyNodeCount(page, 1)
  })
})

// ==================== 基础场景测试 - 计算任务 ====================

test.describe('基础场景 - 计算任务节点创建', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.vue-flow', { timeout: 10000 })
    await enableTestMode(page)
  })

  test('创建PSI计算任务节点', async ({ page }) => {
    await createComputeTaskNode(page, 'PSI', 200, 200)
    await verifyNodeCount(page, 1)
  })

  test('创建PIR查询任务节点', async ({ page }) => {
    await createComputeTaskNode(page, 'PIR', 200, 200)
    await verifyNodeCount(page, 1)
  })

  test('创建MPC计算任务节点', async ({ page }) => {
    await createComputeTaskNode(page, 'MPC', 200, 200)
    await verifyNodeCount(page, 1)
  })

  test('创建联邦学习任务节点', async ({ page }) => {
    await createComputeTaskNode(page, 'FL', 200, 200)
    await verifyNodeCount(page, 1)
  })
})

// ==================== 基础场景测试 - 本地任务 ====================

test.describe('基础场景 - 本地任务节点创建', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.vue-flow', { timeout: 10000 })
    await enableTestMode(page)
  })

  test('创建本地结果处理节点', async ({ page }) => {
    await createLocalTaskNode(page, 'localResult', 200, 200)
    await verifyNodeCount(page, 1)
  })

  test('创建本地Query节点', async ({ page }) => {
    await createLocalTaskNode(page, 'localQuery', 200, 200)
    await verifyNodeCount(page, 1)
  })
})

// ==================== 简单流程测试 ====================

test.describe('简单流程 - 数据源到计算任务', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.vue-flow', { timeout: 10000 })
    await enableTestMode(page)
  })

  test('数据库表 -> PSI计算 简单流程', async ({ page }) => {
    await createDataSourceNode(page, 'database', 150, 100)
    await createComputeTaskNode(page, 'PSI', 150, 250)
    await verifyNodeCount(page, 2)
  })

  test('CSV文件 -> MPC计算 简单流程', async ({ page }) => {
    await createDataSourceNode(page, 'csv', 150, 100)
    await createComputeTaskNode(page, 'MPC', 150, 250)
    await verifyNodeCount(page, 2)
  })

  test('实时数据源 -> PIR查询 简单流程', async ({ page }) => {
    await createDataSourceNode(page, 'realtime', 150, 100)
    await createComputeTaskNode(page, 'PIR', 150, 250)
    await verifyNodeCount(page, 2)
  })
})

// ==================== 多数据源流程测试 ====================

test.describe('多数据源流程', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.vue-flow', { timeout: 10000 })
    await enableTestMode(page)
  })

  test('两个数据源 -> PSI计算', async ({ page }) => {
    await createDataSourceNode(page, 'database', 100, 100)
    await createDataSourceNode(page, 'database', 250, 100)
    await createComputeTaskNode(page, 'PSI', 175, 280)
    await verifyNodeCount(page, 3)
  })

  test('数据库表 + CSV -> MPC计算', async ({ page }) => {
    await createDataSourceNode(page, 'database', 100, 100)
    await createDataSourceNode(page, 'csv', 250, 100)
    await createComputeTaskNode(page, 'MPC', 175, 280)
    await verifyNodeCount(page, 3)
  })

  test('三个数据源 -> MPC计算', async ({ page }) => {
    await createDataSourceNode(page, 'database', 50, 100)
    await createDataSourceNode(page, 'csv', 175, 100)
    await createDataSourceNode(page, 'database', 300, 100)
    await createComputeTaskNode(page, 'MPC', 175, 280)
    await verifyNodeCount(page, 4)
  })
})

// ==================== 计算任务串联测试 ====================

test.describe('计算任务串联流程', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.vue-flow', { timeout: 10000 })
    await enableTestMode(page)
  })

  test('PSI -> MPC 串联流程', async ({ page }) => {
    await createDataSourceNode(page, 'database', 100, 50)
    await createDataSourceNode(page, 'database', 250, 50)
    await createComputeTaskNode(page, 'PSI', 175, 180)
    await createComputeTaskNode(page, 'MPC', 175, 320)
    await verifyNodeCount(page, 4)
  })

  test('MPC -> 本地结果处理 串联流程', async ({ page }) => {
    await createDataSourceNode(page, 'database', 100, 50)
    await createDataSourceNode(page, 'csv', 250, 50)
    await createComputeTaskNode(page, 'MPC', 175, 180)
    await createLocalTaskNode(page, 'localResult', 175, 320)
    await verifyNodeCount(page, 4)
  })

  test('PSI -> MPC -> 本地Query 三级串联', async ({ page }) => {
    await createDataSourceNode(page, 'database', 100, 30)
    await createDataSourceNode(page, 'database', 250, 30)
    await createComputeTaskNode(page, 'PSI', 175, 140)
    await createComputeTaskNode(page, 'MPC', 175, 260)
    await createLocalTaskNode(page, 'localQuery', 175, 380)
    await verifyNodeCount(page, 5)
  })
})

// ==================== 复杂DAG测试 ====================

test.describe('复杂DAG流程', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.vue-flow', { timeout: 10000 })
    await enableTestMode(page)
  })

  test('双分支流程：两个独立的数据源-计算任务链', async ({ page }) => {
    await createDataSourceNode(page, 'database', 80, 100)
    await createComputeTaskNode(page, 'PSI', 80, 250)
    await createDataSourceNode(page, 'csv', 270, 100)
    await createComputeTaskNode(page, 'MPC', 270, 250)
    await verifyNodeCount(page, 4)
  })

  test('汇聚流程：两个计算任务输出到同一个本地任务', async ({ page }) => {
    await createDataSourceNode(page, 'database', 50, 50)
    await createDataSourceNode(page, 'database', 200, 50)
    await createComputeTaskNode(page, 'PSI', 125, 180)
    await createDataSourceNode(page, 'csv', 300, 50)
    await createDataSourceNode(page, 'csv', 450, 50)
    await createComputeTaskNode(page, 'MPC', 375, 180)
    await createLocalTaskNode(page, 'localResult', 250, 320)
    await verifyNodeCount(page, 7)
  })

  test('菱形流程：数据源分支后合并', async ({ page }) => {
    await createDataSourceNode(page, 'database', 200, 50)
    await createComputeTaskNode(page, 'PSI', 100, 180)
    await createComputeTaskNode(page, 'MPC', 300, 180)
    await createLocalTaskNode(page, 'localResult', 200, 320)
    await verifyNodeCount(page, 4)
  })
})

// ==================== PIR特殊流程测试 ====================

test.describe('PIR特殊流程', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.vue-flow', { timeout: 10000 })
    await enableTestMode(page)
  })

  test('PIR查询需要普通数据源和实时数据源', async ({ page }) => {
    await createDataSourceNode(page, 'database', 100, 100)
    await createDataSourceNode(page, 'realtime', 250, 100)
    await createComputeTaskNode(page, 'PIR', 175, 250)
    await verifyNodeCount(page, 3)
  })

  test('PIR -> 本地结果处理流程', async ({ page }) => {
    await createDataSourceNode(page, 'database', 100, 50)
    await createDataSourceNode(page, 'realtime', 250, 50)
    await createComputeTaskNode(page, 'PIR', 175, 180)
    await createLocalTaskNode(page, 'localResult', 175, 320)
    await verifyNodeCount(page, 4)
  })
})

// ==================== 联邦学习流程测试 ====================

test.describe('联邦学习流程', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.vue-flow', { timeout: 10000 })
    await enableTestMode(page)
  })

  test('联邦学习基本流程', async ({ page }) => {
    await createDataSourceNode(page, 'database', 100, 100)
    await createDataSourceNode(page, 'database', 250, 100)
    await createComputeTaskNode(page, 'FL', 175, 250)
    await verifyNodeCount(page, 3)
  })

  test('联邦学习 -> 本地Query流程', async ({ page }) => {
    await createDataSourceNode(page, 'csv', 100, 50)
    await createDataSourceNode(page, 'csv', 250, 50)
    await createComputeTaskNode(page, 'FL', 175, 180)
    await createLocalTaskNode(page, 'localQuery', 175, 320)
    await verifyNodeCount(page, 4)
  })
})

// ==================== 大规模流程测试 ====================

test.describe('大规模流程', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.vue-flow', { timeout: 10000 })
    await enableTestMode(page)
  })

  test('5个节点的中等规模流程', async ({ page }) => {
    await createDataSourceNode(page, 'database', 50, 50)
    await createDataSourceNode(page, 'database', 150, 50)
    await createDataSourceNode(page, 'csv', 250, 50)
    await createComputeTaskNode(page, 'PSI', 100, 180)
    await createComputeTaskNode(page, 'MPC', 250, 180)
    await verifyNodeCount(page, 5)
  })

  test('6个节点的完整流程', async ({ page }) => {
    await createDataSourceNode(page, 'database', 50, 30)
    await createDataSourceNode(page, 'database', 150, 30)
    await createDataSourceNode(page, 'csv', 250, 30)
    await createDataSourceNode(page, 'csv', 350, 30)
    await createComputeTaskNode(page, 'PSI', 100, 150)
    await createComputeTaskNode(page, 'MPC', 300, 150)
    await verifyNodeCount(page, 6)
  })

  test('8个节点的大型流程', async ({ page }) => {
    await createDataSourceNode(page, 'database', 50, 30)
    await createDataSourceNode(page, 'database', 130, 30)
    await createDataSourceNode(page, 'csv', 210, 30)
    await createDataSourceNode(page, 'csv', 290, 30)
    await createComputeTaskNode(page, 'PSI', 90, 140)
    await createComputeTaskNode(page, 'MPC', 250, 140)
    await createLocalTaskNode(page, 'localResult', 170, 260)
    await createComputeTaskNode(page, 'FL', 370, 140)
    await verifyNodeCount(page, 8)
  })
})

// ==================== 边缘情况测试 ====================

test.describe('边缘情况', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.vue-flow', { timeout: 10000 })
    await enableTestMode(page)
  })

  test('只创建数据源节点不创建计算任务', async ({ page }) => {
    await createDataSourceNode(page, 'database', 200, 100)
    await createDataSourceNode(page, 'csv', 200, 250)
    await verifyNodeCount(page, 2)
  })

  test('只创建计算任务节点不创建数据源', async ({ page }) => {
    await createComputeTaskNode(page, 'MPC', 200, 200)
    await verifyNodeCount(page, 1)
  })

  test('多个相同类型的节点', async ({ page }) => {
    await createDataSourceNode(page, 'database', 50, 100)
    await createDataSourceNode(page, 'database', 150, 100)
    await createDataSourceNode(page, 'database', 250, 100)
    await verifyNodeCount(page, 3)
  })

  test('混合所有类型节点', async ({ page }) => {
    await createDataSourceNode(page, 'database', 50, 50)
    await createDataSourceNode(page, 'realtime', 150, 50)
    await createComputeTaskNode(page, 'PSI', 50, 180)
    await createComputeTaskNode(page, 'PIR', 150, 180)
    await createLocalTaskNode(page, 'localResult', 100, 320)
    await verifyNodeCount(page, 5)
  })
})

// ==================== 节点操作测试 ====================

test.describe('节点操作', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.vue-flow', { timeout: 10000 })
    await enableTestMode(page)
  })

  test('点击节点应显示详情面板', async ({ page }) => {
    await createDataSourceNode(page, 'database', 200, 100)

    const node = page.locator('.vue-flow__node').first()
    await node.click()
    await page.waitForTimeout(300)

    const detailPanel = page.locator('.flow-detail-panel')
    await expect(detailPanel).toBeVisible()
  })

  test('创建节点后画布应正确缩放', async ({ page }) => {
    await createDataSourceNode(page, 'database', 200, 100)
    await createComputeTaskNode(page, 'MPC', 200, 300)

    const canvas = page.locator('.vue-flow')
    await expect(canvas).toBeVisible()
    await verifyNodeCount(page, 2)
  })
})

// ==================== 页面状态测试 ====================

test.describe('页面状态', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.vue-flow', { timeout: 10000 })
    await enableTestMode(page)
  })

  test('页面刷新后画布应清空', async ({ page }) => {
    await createDataSourceNode(page, 'database', 200, 100)
    await verifyNodeCount(page, 1)

    await page.reload()
    await page.waitForSelector('.vue-flow', { timeout: 10000 })

    // 刷新后节点应该清空（内存存储）
    await verifyNodeCount(page, 0)
  })

  test('未保存提示应显示', async ({ page }) => {
    await createDataSourceNode(page, 'database', 200, 100)

    const unsavedBadge = page.locator('text=未保存')
    await expect(unsavedBadge).toBeVisible()
  })

  test('侧边栏应正确显示所有节点类型', async ({ page }) => {
    await expect(page.getByText('数据源', { exact: true })).toBeVisible()
    await expect(page.getByText('计算任务', { exact: true })).toBeVisible()
    await expect(page.getByText('计算模型', { exact: true })).toBeVisible()
    await expect(page.getByText('本地计算任务', { exact: true })).toBeVisible()
  })
})
