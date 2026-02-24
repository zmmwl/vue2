/**
 * 基础 UI 测试
 */

import { test, expect } from '@playwright/test'

test.describe('基础 UI 测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.vue-flow', { timeout: 10000 })
  })

  test('应该成功加载主页面并显示所有核心组件', async ({ page }) => {
    await expect(page.locator('.flow-editor')).toBeVisible()
    await expect(page.locator('.flow-header')).toBeVisible()
    await expect(page.locator('.flow-sidebar')).toBeVisible()
    await expect(page.locator('.vue-flow')).toBeVisible()
    await expect(page.locator('.flow-detail-panel')).toBeVisible()
  })

  test('侧边栏应该显示数据源节点', async ({ page }) => {
    await expect(page.getByText('数据库表', { exact: true })).toBeVisible()
    await expect(page.getByText('CSV 文件', { exact: true })).toBeVisible()
    await expect(page.getByText('实时数据源', { exact: true })).toBeVisible()
  })

  test('侧边栏应该显示计算任务节点', async ({ page }) => {
    await expect(page.getByText('PSI 计算')).toBeVisible()
    await expect(page.getByText('PIR 查询')).toBeVisible()
    await expect(page.getByText('MPC 计算')).toBeVisible()
  })

  test('画布应该显示小地图', async ({ page }) => {
    const minimap = page.locator('.vue-flow__minimap')
    await expect(minimap).toBeVisible()
  })

  test('工具栏应该显示按钮', async ({ page }) => {
    await expect(page.locator('button:has-text("导出")')).toBeVisible()
    await expect(page.locator('button:has-text("导入")')).toBeVisible()
    await expect(page.locator('button:has-text("自动布局")')).toBeVisible()
  })

  test('侧边栏节点应该可拖拽', async ({ page }) => {
    const paletteNode = page.locator('.palette-node').first()
    await expect(paletteNode).toHaveAttribute('draggable', 'true')
  })
})
