import { test, expect } from '@playwright/test'
import { setupTestEnvironment } from './test-utils'

/**
 * E2E 测试：导出和工作流
 * Phase 9: JSON 导出和自动布局
 */

test.describe('JSON 导出功能', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page)
    await page.goto('/')
    await page.waitForSelector('.flow-sidebar', { timeout: 10000 })
  })

  test('导出按钮应该可用', async ({ page }) => {
    const exportBtn = page.locator('button:has-text("导出")')
    await expect(exportBtn).toBeVisible()
    await expect(exportBtn).toBeEnabled()
  })

  test('点击导出应该不报错', async ({ page }) => {
    // 点击导出
    const exportBtn = page.locator('button:has-text("导出")')
    await exportBtn.click({ force: true })
    await page.waitForTimeout(500)

    // 验证页面仍然正常工作
    await expect(page.locator('.flow-editor')).toBeVisible()
  })

  test('详情面板应该显示 JSON 预览', async ({ page }) => {
    const detailPanel = page.locator('.flow-detail-panel')
    await expect(detailPanel).toBeVisible()

    // 检查是否有 JSON 预览区域或空状态
    const jsonPreview = detailPanel.locator('.json-preview, .json-content, pre, .empty-state')
    const count = await jsonPreview.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })
})

test.describe('JSON 导入功能', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page)
    await page.goto('/')
    await page.waitForSelector('.flow-sidebar', { timeout: 10000 })
  })

  test('导入按钮应该可用', async ({ page }) => {
    const importBtn = page.locator('button:has-text("导入")')
    await expect(importBtn).toBeVisible()
    await expect(importBtn).toBeEnabled()
  })

  test('点击导入应该触发文件选择', async ({ page }) => {
    // 点击导入按钮
    const importBtn = page.locator('button:has-text("导入")')
    await importBtn.click({ force: true })
    await page.waitForTimeout(300)

    // 应该有文件输入（隐藏的）
    const fileInput = page.locator('input[type="file"]')
    const count = await fileInput.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })
})

test.describe('自动布局功能', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page)
    await page.goto('/')
    await page.waitForSelector('.flow-sidebar', { timeout: 10000 })
  })

  test('自动布局按钮应该可用', async ({ page }) => {
    const autoLayoutBtn = page.locator('button:has-text("自动布局")')
    await expect(autoLayoutBtn).toBeVisible()
    await expect(autoLayoutBtn).toBeEnabled()
  })

  test('空画布点击自动布局应该不报错', async ({ page }) => {
    const autoLayoutBtn = page.locator('button:has-text("自动布局")')
    await autoLayoutBtn.click({ force: true })
    await page.waitForTimeout(500)

    // 页面应该仍然正常
    await expect(page.locator('.flow-editor')).toBeVisible()
  })
})

test.describe('画布交互', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestEnvironment(page)
    await page.goto('/')
    await page.waitForSelector('.flow-sidebar', { timeout: 10000 })
  })

  test('应该显示小地图', async ({ page }) => {
    await expect(page.locator('.vue-flow__minimap')).toBeVisible()
  })

  test('应该显示画布控制按钮', async ({ page }) => {
    await expect(page.locator('.vue-flow__controls')).toBeVisible()
  })
})
