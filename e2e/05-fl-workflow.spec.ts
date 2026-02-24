/**
 * 联邦学习 (FL) 工作流测试
 */

import { test, expect } from '@playwright/test'

test.describe('联邦学习工作流', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.vue-flow', { timeout: 10000 })
  })

  test('联邦学习卡片应该可见', async ({ page }) => {
    await expect(page.getByText('联邦学习')).toBeVisible()
  })

  test('联邦学习卡片应该有展开指示器', async ({ page }) => {
    const indicator = page.locator('.expand-indicator')
    await expect(indicator).toBeVisible()
  })
})
