import { test, expect } from '@playwright/test'

/**
 * E2E 测试：分组统计模型功能
 */

test.describe('分组统计模型', () => {
  test.beforeEach(async ({ page }) => {
    // 设置中文字体支持（不启用测试模式，让对话框正常显示）
    await page.evaluate(() => {
      // 设置字体
      document.body.style.fontFamily = '"Microsoft YaHei", "SimHei", Arial, sans-serif'
    })

    // 监听控制台日志
    page.on('console', msg => {
      const text = msg.text()
      if (text.includes('[FlowCanvas]') || text.includes('分组统计') || text.includes('test-drop')) {
        console.log('BROWSER:', text)
      }
    })

    await page.goto('/')
    await page.waitForSelector('.flow-sidebar', { timeout: 10000 })

    // 不设置测试模式标志，让对话框正常显示
    // await page.evaluate(() => {
    //   (window as any).__PLAYWRIGHT_TEST__ = false
    // })
  })

  /**
   * 测试：分组统计模型完整流程
   */
  test('拖拽分组统计模型到计算任务后应打开配置对话框', async ({ page }) => {
    // 步骤 1: 创建已配置的数据源节点
    await page.evaluate(() => {
      const mockData = {
        type: 'dataSource',
        label: 'MySQL 数据库',
        category: 'data_source',
        dataSourceType: 'mysql',
        icon: '🗄️',
        color: '#52C41A',
        description: '关系型数据库',
        assetInfo: {
          assetId: 'asset_001',
          assetNumber: 'ASSET001',
          assetName: '员工薪资数据',
          holderCompany: '企业A',
          participantId: 'companyA',
          entityName: '企业A',
          intro: '员工薪资数据资产',
          dataInfo: {
            databaseName: 'salary_db',
            tableName: 'employee_salaries',
            fieldList: [
              { name: 'employee_id', dataType: 'STRING', description: '员工ID', dataLength: 20 },
              { name: 'department', dataType: 'VARCHAR', description: '部门', dataLength: 50 },
              { name: 'salary', dataType: 'DECIMAL', description: '薪资', dataLength: 10 },
              { name: 'bonus', dataType: 'DECIMAL', description: '奖金', dataLength: 10 }
            ]
          }
        },
        selectedFields: ['employee_id', 'department', 'salary', 'bonus']
      }

      window.dispatchEvent(new CustomEvent('create-test-node', {
        detail: { data: mockData, position: { x: 200, y: 100 } }
      }))
    })

    await page.waitForTimeout(500)

    // 验证数据源节点创建成功
    await expect(page.locator('.vue-flow__node')).toHaveCount(1)
    console.log('✓ 数据源节点创建成功')

    // 步骤 2: 创建 PSI 计算任务节点
    await page.evaluate(() => {
      const taskData = {
        type: 'compute_task',
        label: 'PSI',
        category: 'compute_task',
        taskType: 'psi',
        techPath: 'SOFTWARE',
        icon: '🔐',
        color: '#1890ff',
        description: '隐私集合求交'
      }

      window.dispatchEvent(new CustomEvent('create-test-task-node', {
        detail: { data: taskData, position: { x: 400, y: 300 } }
      }))
    })

    await page.waitForTimeout(500)

    // 验证计算任务节点创建成功
    await expect(page.locator('.vue-flow__node')).toHaveCount(2)
    console.log('✓ 计算任务节点创建成功')

    // 步骤 3: 连接数据源到计算任务
    await page.evaluate(() => {
      const nodes = document.querySelectorAll('.vue-flow__node')
      if (nodes.length >= 2) {
        const sourceNode = nodes[0]
        const targetNode = nodes[1]
        const sourceId = sourceNode.getAttribute('data-id')
        const targetId = targetNode.getAttribute('data-id')

        if (sourceId && targetId) {
          window.dispatchEvent(new CustomEvent('create-test-connection', {
            detail: { sourceNodeId: sourceId, targetNodeId: targetId }
          }))
        }
      }
    })

    await page.waitForTimeout(500)

    // 处理字段选择对话框
    if (await page.locator('.modal-title').filter({ hasText: '选择字段' }).isVisible()) {
      await page.waitForTimeout(500)

      // 选择字段 - 需要同时选中"选择"复选框和"Join"复选框
      const tableRows = page.locator('table tbody tr')
      const rowCount = await tableRows.count()
      console.log('找到表格行数:', rowCount)

      // 对前几行进行操作：先选中字段，然后选中Join字段
      for (let i = 0; i < Math.min(rowCount, 3); i++) {
        // 第一列的复选框是"选择"复选框
        const selectCheckbox = tableRows.nth(i).locator('td input[type="checkbox"]').first()
        await selectCheckbox.check({ force: true })
        await page.waitForTimeout(100)

        // 最后一列的复选框是"Join"复选框
        const joinCheckbox = tableRows.nth(i).locator('td input[type="checkbox"]').last()
        await joinCheckbox.check({ force: true })
        await page.waitForTimeout(100)
      }

      // 等待确认按钮启用
      const fieldConfirmBtn = page.locator('.modal-footer .btn.btn-primary')
      await expect(fieldConfirmBtn).toBeVisible({ timeout: 5000 })

      // 等待按钮启用
      await page.waitForFunction(() => {
        const btn = document.querySelector('.modal-footer .btn.btn-primary')
        return btn && !btn.hasAttribute('disabled')
      }, { timeout: 5000 })

      await fieldConfirmBtn.click({ force: true })
      await page.waitForTimeout(500)
    }

    // 验证连接创建成功
    await expect(page.locator('.vue-flow__edge')).toHaveCount(1)
    console.log('✓ 数据源连接到计算任务成功')

    // 步骤 4: 获取计算任务节点位置
    const taskNode = page.locator('.vue-flow__node').nth(1)
    const taskBox = await taskNode.boundingBox()
    expect(taskBox).toBeTruthy()

    if (taskBox) {
      // 步骤 5: 模拟拖拽分组统计模型到计算任务上
      console.log('准备拖拽分组统计模型到计算任务...')
      await page.evaluate((box) => {
        const data = {
          type: 'model',
          label: '分组统计',
          category: 'model',
          modelType: 'GROUP_STAT',
          icon: '📊',
          color: '#13C2C2',
          description: '分组统计聚合（GROUP BY）'
        }

        window.dispatchEvent(new CustomEvent('test-drop-model', {
          detail: { data, x: box.x + box.width / 2, y: box.y + box.height / 2 }
        }))
      }, taskBox)

      await page.waitForTimeout(3000)

      // 步骤 6: 等待分组统计配置对话框显示
      console.log('等待分组统计配置对话框...')

      // 等待分组统计配置对话框
      await page.waitForFunction(() => {
        const modals = document.querySelectorAll('.modal-overlay')
        return Array.from(modals).some(m => m.textContent && m.textContent.includes('配置分组统计模型'))
      }, { timeout: 5000 })

      console.log('✓ 分组统计配置对话框已显示')

      // 验证对话框标题（GroupByConfig 使用 h3 标签，不是 modal-title 类）
      const modalTitle = page.locator('.groupby-config-modal h3').filter({ hasText: '配置分组统计模型' })
      await expect(modalTitle).toBeVisible({ timeout: 5000 })
      console.log('✓ 对话框标题正确')

      // 验证步骤指示器显示"步骤 1"（GroupByConfig 使用 .steps-indicator .step.active）
      const stepIndicator = page.locator('.steps-indicator .step.active')
      await expect(stepIndicator).toHaveCount(1, { timeout: 5000 })
      console.log('✓ 步骤指示器正确（步骤 1）')

      // 验证分组字段选择区域（GroupByConfig 使用 .fields-selector）
      const groupBySection = page.locator('.fields-selector')
      await expect(groupBySection).toBeVisible({ timeout: 5000 })
      console.log('✓ 分组字段选择区域可见')

      // 测试完成！
      console.log('✓✓✓ 分组统计模型测试全部通过 ✓✓✓')
    }
  })

  /**
   * 测试：配置分组统计（无分组字段）
   */
  test('应该能够配置分组统计模型（仅统计字段）', async ({ page }) => {
    // 创建数据源和计算任务（与上面相同）
    await page.evaluate(() => {
      const mockData = {
        type: 'dataSource',
        label: 'MySQL 数据库',
        category: 'data_source',
        dataSourceType: 'mysql',
        icon: '🗄️',
        color: '#52C41A',
        assetInfo: {
          assetId: 'asset_001',
          assetName: '测试数据',
          holderCompany: '企业A',
          participantId: 'companyA',
          dataInfo: {
            fieldList: [
              { name: 'salary', dataType: 'DECIMAL' },
              { name: 'bonus', dataType: 'DECIMAL' }
            ]
          }
        },
        selectedFields: ['salary', 'bonus']
      }

      window.dispatchEvent(new CustomEvent('create-test-node', {
        detail: { data: mockData, position: { x: 200, y: 100 } }
      }))
    })

    await page.waitForTimeout(300)

    await page.evaluate(() => {
      const taskData = {
        type: 'compute_task',
        label: 'PSI',
        category: 'compute_task',
        taskType: 'psi',
        techPath: 'SOFTWARE',
        icon: '🔐',
        color: '#1890ff'
      }

      window.dispatchEvent(new CustomEvent('create-test-task-node', {
        detail: { data: taskData, position: { x: 400, y: 300 } }
      }))
    })

    await page.waitForTimeout(300)

    // 连接节点
    await page.evaluate(() => {
      const nodes = document.querySelectorAll('.vue-flow__node')
      if (nodes.length >= 2) {
        const sourceId = nodes[0].getAttribute('data-id')
        const targetId = nodes[1].getAttribute('data-id')
        if (sourceId && targetId) {
          window.dispatchEvent(new CustomEvent('create-test-connection', {
            detail: { sourceNodeId: sourceId, targetNodeId: targetId }
          }))
        }
      }
    })

    await page.waitForTimeout(300)

    // 处理字段选择对话框
    if (await page.locator('.modal-title').filter({ hasText: '选择字段' }).isVisible()) {
      // 选择字段 - 需要同时选中"选择"复选框和"Join"复选框
      const tableRows = page.locator('table tbody tr')
      const rowCount = await tableRows.count()

      // 对前几行进行操作：先选中字段，然后选中Join字段
      for (let i = 0; i < Math.min(rowCount, 2); i++) {
        // 第一列的复选框是"选择"复选框
        const selectCheckbox = tableRows.nth(i).locator('td input[type="checkbox"]').first()
        await selectCheckbox.check({ force: true })
        await page.waitForTimeout(50)

        // 最后一列的复选框是"Join"复选框
        const joinCheckbox = tableRows.nth(i).locator('td input[type="checkbox"]').last()
        await joinCheckbox.check({ force: true })
        await page.waitForTimeout(50)
      }

      // 等待确认按钮启用
      await page.waitForFunction(() => {
        const btn = document.querySelector('.modal-footer .btn.btn-primary')
        return btn && !btn.hasAttribute('disabled')
      }, { timeout: 5000 })
      await page.locator('.modal-footer .btn.btn-primary').click({ force: true })
      await page.waitForTimeout(300)
    }

    // 拖拽分组统计模型
    const taskBox = await page.locator('.vue-flow__node').nth(1).boundingBox()
    if (taskBox) {
      await page.evaluate((box) => {
        const data = {
          type: 'model',
          label: '分组统计',
          category: 'model',
          modelType: 'GROUP_STAT',
          icon: '📊',
          color: '#13C2C2'
        }
        window.dispatchEvent(new CustomEvent('test-drop-model', {
          detail: { data, x: box.x + box.width / 2, y: box.y + box.height / 2 }
        }))
      }, taskBox)

      await page.waitForTimeout(2000)

      // 等待配置对话框（GroupByConfig 使用 h3 标签，不是 modal-title 类）
      await expect(page.locator('.groupby-config-modal h3').filter({ hasText: '配置分组统计模型' })).toBeVisible({ timeout: 5000 })

      // 直接点击下一步（不选择分组字段）
      // GroupByConfig 使用 .modal-footer .btn-primary 作为下一步按钮
      await page.waitForTimeout(500) // 等待对话框完全加载
      const nextBtn = page.locator('.modal-footer .btn-primary').filter({ hasText: '下一步' })
      await expect(nextBtn).toBeVisible()
      await nextBtn.click({ force: true, timeout: 10000 })
      await page.waitForTimeout(1000) // 等待步骤切换完成

      // 验证步骤 2（GroupByConfig 使用 .steps-indicator .step.active）
      // 注意：.steps-indicator 的子元素是 .step, .step-line, .step，所以第二个 step 是第3个子元素
      // 或者更简单地，查找带有"统计配置"文本的活动步骤
      const step2Indicator = page.locator('.steps-indicator .step.active').filter({ hasText: '统计配置' })
      await expect(step2Indicator).toBeVisible({ timeout: 8000 })

      // 添加统计配置
      await page.waitForTimeout(800)
      const addStatBtn = page.locator('.add-stat-btn')
      await expect(addStatBtn).toBeVisible()
      await addStatBtn.click({ force: true })
      await page.waitForTimeout(800)

      // 选择函数类型（GroupByConfig 使用 select 元素）
      const funcSelect = page.locator('.stat-card select').first()
      await funcSelect.selectOption({ index: 1 }) // SUM
      await page.waitForTimeout(300)

      // 选择字段（第一个选项是占位符，所以选择 index 1）
      const fieldSelect = page.locator('.stat-card select').nth(1)
      // 先获取选项数量来确保有字段可选
      await page.waitForTimeout(300)
      await fieldSelect.selectOption({ index: 1 }) // 第一个实际字段（跳过占位符）
      await page.waitForTimeout(300)

      // 输入结果别名
      const aliasInput = page.locator('.stat-card .alias-input').first()
      await aliasInput.fill('total_salary')
      await page.waitForTimeout(300)

      // 点击保存（GroupByConfig 使用 .modal-footer .btn-primary 作为保存按钮）
      const saveBtn = page.locator('.modal-footer .btn-primary').filter({ hasText: '保存配置' })
      await expect(saveBtn).toBeVisible()
      await saveBtn.click({ force: true })
      await page.waitForTimeout(1500)

      // 验证模型节点创建
      await expect(page.locator('.vue-flow__node')).toHaveCount(3)
      console.log('✓ 分组统计模型（无分组字段）配置成功')
    }
  })
})
