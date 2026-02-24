/**
 * 高级功能测试
 */

import { test, expect } from '@playwright/test'

test.describe('高级功能测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.vue-flow', { timeout: 10000 })
  })

  test('计算模型应该可见', async ({ page }) => {
    await expect(page.locator('.section-title:has-text("计算模型")')).toBeVisible()
  })

  test('本地Query任务应该可见', async ({ page }) => {
    await expect(page.getByText('本地Query')).toBeVisible()
  })
})
