/**
 * MPC (多方安全计算) 工作流测试
 */

import { test, expect } from '@playwright/test'

test.describe('MPC 工作流', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.vue-flow', { timeout: 10000 })
  })

  test('MPC 计算节点应该可见', async ({ page }) => {
    await expect(page.getByText('MPC 计算')).toBeVisible()
  })

  test('MPC 节点应该可拖拽', async ({ page }) => {
    const mpcNode = page.locator('.palette-node:has-text("MPC 计算")')
    await expect(mpcNode).toHaveAttribute('draggable', 'true')
  })
})
