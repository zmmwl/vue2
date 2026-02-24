/**
 * 节点操作测试
 */

import { test, expect } from '@playwright/test'

test.describe('节点操作测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.vue-flow', { timeout: 10000 })
  })

  test('应该能够使用画布控制按钮', async ({ page }) => {
    const minimap = page.locator('.vue-flow__minimap')
    await expect(minimap).toBeVisible()
  })

  test('侧边栏节点应该可拖拽', async ({ page }) => {
    const paletteNode = page.locator('.palette-node').first()
    await expect(paletteNode).toHaveAttribute('draggable', 'true')
  })

  test('画布应该显示背景网格', async ({ page }) => {
    const background = page.locator('.vue-flow__background')
    await expect(background).toBeVisible()
  })
})
