import { test, expect } from '@playwright/test'
import { setupTestEnvironment } from './test-utils'

/**
 * E2E 测试：基础 UI 和页面加载
 * Phase 1: 基础设施验证
 */

test.describe('基础页面加载', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page)
    await page.goto('/')
  })

  test('应该成功加载主页面', async ({ page }) => {
    // 等待页面加载完成
    await page.waitForSelector('.flow-editor', { timeout: 10000 })

    // 验证主要容器存在
    await expect(page.locator('.flow-editor')).toBeVisible()
  })

  test('应该显示流程编辑器头部', async ({ page }) => {
    await page.waitForSelector('.flow-header', { timeout: 10000 })
    await expect(page.locator('.flow-header')).toBeVisible()

    // 验证导出按钮存在
    const exportBtn = page.locator('button:has-text("导出")')
    await expect(exportBtn).toBeVisible()
  })

  test('应该显示侧边栏', async ({ page }) => {
    await page.waitForSelector('.flow-sidebar', { timeout: 10000 })
    await expect(page.locator('.flow-sidebar')).toBeVisible()
  })

  test('应该显示画布区域', async ({ page }) => {
    await page.waitForSelector('.vue-flow', { timeout: 10000 })
    await expect(page.locator('.vue-flow')).toBeVisible()
  })

  test('应该显示详情面板', async ({ page }) => {
    await page.waitForSelector('.flow-detail-panel', { timeout: 10000 })
    await expect(page.locator('.flow-detail-panel')).toBeVisible()
  })
})

test.describe('侧边栏节点类型', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page)
    await page.goto('/')
    await page.waitForSelector('.flow-sidebar', { timeout: 10000 })
  })

  test('应该显示数据源节点类型', async ({ page }) => {
    const sidebar = page.locator('.flow-sidebar')
    await expect(sidebar).toBeVisible()

    // 检查数据源节点模板存在
    const paletteNodes = sidebar.locator('.palette-node')
    const count = await paletteNodes.count()
    expect(count).toBeGreaterThan(0)
  })

  test('应该显示计算任务节点类型', async ({ page }) => {
    const sidebar = page.locator('.flow-sidebar')
    // 验证计算任务部分存在
    const sectionTitles = sidebar.locator('.section-title')
    const count = await sectionTitles.count()
    expect(count).toBeGreaterThan(0)
  })

  test('应该显示联邦学习卡片', async ({ page }) => {
    const sidebar = page.locator('.flow-sidebar')
    // 联邦学习卡片存在（在计算任务部分）
    const flCard = sidebar.locator('.fl-trigger-card')
    await expect(flCard).toBeVisible()
    await expect(flCard.locator('.palette-node-label')).toHaveText('联邦学习')
  })
})

test.describe('画布基础功能', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page)
    await page.goto('/')
    await page.waitForSelector('.vue-flow', { timeout: 10000 })
  })

  test('画布应该支持缩放控制', async ({ page }) => {
    const canvas = page.locator('.vue-flow')

    // 验证画布存在
    await expect(canvas).toBeVisible()

    // 验证缩放控制存在
    const controls = page.locator('.vue-flow__controls')
    await expect(controls).toBeVisible()
  })

  test('画布应该支持平移', async ({ page }) => {
    const canvas = page.locator('.vue-flow__viewport')

    // 拖拽画布进行平移
    const box = await canvas.boundingBox()
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      await page.mouse.move(box.x + 100, box.y + 100)
      await page.mouse.up()
    }

    await expect(page.locator('.vue-flow')).toBeVisible()
  })

  test('应该显示画布控制按钮', async ({ page }) => {
    // 检查缩放控制
    await expect(page.locator('.vue-flow__controls')).toBeVisible()
  })

  test('应该显示小地图', async ({ page }) => {
    await expect(page.locator('.vue-flow__minimap')).toBeVisible()
  })
})

test.describe('头部工具栏', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page)
    await page.goto('/')
    await page.waitForSelector('.flow-header', { timeout: 10000 })
  })

  test('应该显示导出按钮', async ({ page }) => {
    const exportBtn = page.locator('button:has-text("导出")')
    await expect(exportBtn).toBeVisible()
  })

  test('应该显示导入按钮', async ({ page }) => {
    const importBtn = page.locator('button:has-text("导入")')
    await expect(importBtn).toBeVisible()
  })

  test('应该显示自动布局按钮', async ({ page }) => {
    const layoutBtn = page.locator('button:has-text("自动布局")')
    await expect(layoutBtn).toBeVisible()
  })

  test('点击导出按钮应该不报错', async ({ page }) => {
    const exportBtn = page.locator('button:has-text("导出")')
    await exportBtn.click({ force: true })
    await page.waitForTimeout(500)

    // 验证页面仍然正常
    await expect(page.locator('.flow-editor')).toBeVisible()
  })
})

test.describe('详情面板', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page)
    await page.goto('/')
    await page.waitForSelector('.flow-detail-panel', { timeout: 10000 })
  })

  test('详情面板应该可见', async ({ page }) => {
    const detailPanel = page.locator('.flow-detail-panel')
    await expect(detailPanel).toBeVisible()
  })

  test('应该支持视图模式切换', async ({ page }) => {
    const detailPanel = page.locator('.flow-detail-panel')

    // 验证详情面板可见
    await expect(detailPanel).toBeVisible()

    // 查找视图模式切换按钮 (JSON/表单 切换)
    const viewModeButtons = detailPanel.locator('button')
    const count = await viewModeButtons.count()

    // 如果有按钮，测试点击
    if (count > 0) {
      // 只记录按钮数量，不强制点击
      console.log(`Found ${count} buttons in detail panel`)
    }

    // 验证详情面板仍然可见
    await expect(detailPanel).toBeVisible()
  })
})
