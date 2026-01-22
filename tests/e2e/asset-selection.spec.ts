import { test, expect } from '@playwright/test'

/**
 * E2E 测试：数据资产选择功能
 * Feature: 数据资产选择与展示
 */

test.describe('数据资产选择', () => {
  // 基础配置
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  /**
   * T016: 完整选择流程测试
   * User Story 1 - 拖放节点后选择数据资产
   */
  test('应该能够完成完整的数据资产选择流程', async ({ page }) => {
    // 1. 从左侧面板拖拽数据源节点到画布
    const dataSourceNode = page.locator('[data-testid="data-source-node"]').first()
    const canvas = page.locator('[data-testid="flow-canvas"]')

    // 等待节点可见
    await expect(dataSourceNode).toBeVisible()

    // 拖放到画布
    await canvas.dragAndDrop(dataSourceNode, canvas)

    // 2. 验证对话框自动弹出
    await expect(page.locator('.asset-selector-dialog')).toBeVisible()
    await expect(page.locator('text=选择企业')).toBeVisible()

    // 3. 步骤 1/3: 选择企业
    await page.click('text=某某企业')
    await page.click('button:has-text("下一步")')

    // 4. 步骤 2/3: 选择数据资产
    await expect(page.locator('text=选择数据资产')).toBeVisible()
    await page.click('text=用户行为数据')
    await page.click('button:has-text("下一步")')

    // 5. 步骤 3/3: 选择字段
    await expect(page.locator('text=选择字段')).toBeVisible()
    await page.check('.field-item input[value="user_id"]')
    await page.check('.field-item input[value="action_time"]')
    await page.click('button:has-text("确认")')

    // 6. 验证节点显示资产名称
    await expect(page.locator('.data-source-node')).toContainText('用户行为数据')
  })

  /**
   * 取消配置时节点应被删除
   */
  test('取消配置时节点应被删除', async ({ page }) => {
    // 拖放节点到画布
    const dataSourceNode = page.locator('[data-testid="data-source-node"]').first()
    const canvas = page.locator('[data-testid="flow-canvas"]')

    await canvas.dragAndDrop(dataSourceNode, canvas)

    // 记录节点数量
    const nodeCountBefore = await page.locator('.data-source-node').count()

    // 点击取消按钮
    await page.click('button:has-text("取消")')

    // 验证节点被删除
    const nodeCountAfter = await page.locator('.data-source-node').count()
    expect(nodeCountAfter).toBe(nodeCountBefore - 1)
  })

  /**
   * 验证步骤导航逻辑
   */
  test('向导步骤导航应该正常工作', async ({ page }) => {
    // 拖放节点
    const dataSourceNode = page.locator('[data-testid="data-source-node"]').first()
    const canvas = page.locator('[data-testid="flow-canvas"]')
    await canvas.dragAndDrop(dataSourceNode, canvas)

    // 初始状态：下一步按钮应该禁用
    await expect(page.locator('button:has-text("下一步")')).toBeDisabled()

    // 选择企业后：下一步按钮启用
    await page.click('text=某某企业')
    await expect(page.locator('button:has-text("下一步")')).not.toBeDisabled()

    // 进入步骤 2
    await page.click('button:has-text("下一步")')
    await expect(page.locator('text=选择数据资产')).toBeVisible()

    // 上一步按钮应该可用
    await expect(page.locator('button:has-text("上一步")')).not.toBeDisabled()

    // 返回步骤 1
    await page.click('button:has-text("上一步")')
    await expect(page.locator('text=选择企业')).toBeVisible()
  })
})

test.describe('数据资产选择 - 错误处理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  /**
   * 字段未选择时不能确认
   */
  test('未选择字段时确认按钮应该禁用', async ({ page }) => {
    // 拖放节点并完成到步骤 3
    const dataSourceNode = page.locator('[data-testid="data-source-node"]').first()
    const canvas = page.locator('[data-testid="flow-canvas"]')
    await canvas.dragAndDrop(dataSourceNode, canvas)

    await page.click('text=某某企业')
    await page.click('button:has-text("下一步")')
    await page.click('text=用户行为数据')
    await page.click('button:has-text("下一步")')

    // 在步骤 3，未选择字段时确认按钮应该禁用
    await expect(page.locator('button:has-text("确认")')).toBeDisabled()

    // 选择字段后确认按钮启用
    await page.check('.field-item input[value="user_id"]')
    await expect(page.locator('button:has-text("确认")')).not.toBeDisabled()
  })
})
