/**
 * PIR (隐私信息检索) 工作流测试
 */

import { test, expect } from '@playwright/test'

test.describe('PIR 工作流', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.vue-flow', { timeout: 10000 })
  })

  test('PIR 查询节点应该可见', async ({ page }) => {
    await expect(page.getByText('PIR 查询')).toBeVisible()
  })

  test('实时数据源节点应该可见', async ({ page }) => {
    await expect(page.getByText('实时数据源')).toBeVisible()
  })
})
