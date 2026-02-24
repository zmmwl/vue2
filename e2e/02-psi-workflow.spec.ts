/**
 * PSI (隐私集合求交) 工作流测试
 */

import { test, expect } from '@playwright/test'

test.describe('PSI 工作流', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.vue-flow', { timeout: 10000 })
  })

  test('PSI 计算节点应该可见', async ({ page }) => {
    await expect(page.getByText('PSI 计算')).toBeVisible()
  })

  test('PSI 节点应该可拖拽', async ({ page }) => {
    const psiNode = page.locator('.palette-node:has-text("PSI 计算")')
    await expect(psiNode).toHaveAttribute('draggable', 'true')
  })
})
