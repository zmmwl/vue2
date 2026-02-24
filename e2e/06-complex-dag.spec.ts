/**
 * 复杂 DAG 编排测试
 */

import { test, expect } from '@playwright/test'

test.describe('复杂 DAG 编排', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.vue-flow', { timeout: 10000 })
  })

  test('所有数据源类型应该可见', async ({ page }) => {
    await expect(page.getByText('数据库表', { exact: true })).toBeVisible()
    await expect(page.getByText('CSV 文件', { exact: true })).toBeVisible()
    await expect(page.getByText('实时数据源', { exact: true })).toBeVisible()
  })

  test('所有计算任务类型应该可见', async ({ page }) => {
    await expect(page.getByText('PSI 计算')).toBeVisible()
    await expect(page.getByText('PIR 查询')).toBeVisible()
    await expect(page.getByText('MPC 计算')).toBeVisible()
  })
})
