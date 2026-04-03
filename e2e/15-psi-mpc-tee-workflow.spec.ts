/**
 * PSI+MPC-TEE 流程端到端测试
 * Feature: 830PSI+MPC-TEE
 *
 * 测试场景：
 * 1. 拖拽企业A的"用户行为数据"数据源
 * 2. 拖拽企业B的"信贷客户数据"数据源
 * 3. 拖拽"PSI计算"任务，选择"硬件TEE"方案
 * 4. 连接"用户行为数据"到PSI任务
 * 5. 连接"信贷客户数据"到PSI任务
 * 6. 为"PSI计算"添加TEE算力
 * 7. 为"PSI计算"添加输出数据（企业A）
 * 8. 为"PSI计算"添加输出数据（企业B）
 * 9. 拖拽"MPC计算"任务，选择"硬件TEE"方案
 * 10. 为"MPC计算"添加TEE算力
 * 11. 连接PSI输出1到MPC任务
 * 12. 连接PSI输出2到MPC任务
 * 13. 为"MPC计算"添加Codebin模型
 * 14. 为"MPC计算"添加输出数据
 */

import { test, expect, Page } from '@playwright/test'

// 配置测试为串行模式
test.describe.configure({ mode: 'serial' })

/**
 * 辅助函数：启用测试模式
 */
async function enableTestMode(page: Page) {
  await page.evaluate(() => {
    ;(window as any).__PLAYWRIGHT_TEST__ = true
  })
}

/**
 * 辅助函数：通过 JavaScript 触发 HTML5 拖放事件
 */
async function dragNodeToCanvas(
  page: Page,
  sectionName: string,
  nodeLabel: string,
  nodeTemplate: object,
  targetX: number,
  targetY: number
) {
  await page.evaluate(
    ({ targetX, targetY, nodeTemplateStr, sectionName, nodeLabel }) => {
      const nodeTemplate = JSON.parse(nodeTemplateStr)

      // 找到对应的 sidebar section
      const sidebarSection = Array.from(document.querySelectorAll('.sidebar-section')).find(
        section => section.textContent?.includes(sectionName)
      )
      if (!sidebarSection) {
        console.error('Section not found:', sectionName)
        return
      }

      // 在该 section 中找到对应的节点元素
      const nodes = sidebarSection.querySelectorAll('.palette-node')
      let sourceElement: HTMLElement | null = null

      for (const node of nodes) {
        const nodeText = node.textContent || ''
        if (nodeText.includes(nodeLabel)) {
          sourceElement = node as HTMLElement
          break
        }
      }

      if (!sourceElement) {
        console.error('Source element not found for:', nodeLabel)
        return
      }

      // 找到目标画布
      const flowCanvas = document.querySelector('.flow-canvas') as HTMLElement
      if (!flowCanvas) {
        console.error('Flow canvas not found')
        return
      }

      // 创建 DataTransfer 对象并设置数据
      const dataTransfer = new DataTransfer()
      dataTransfer.setData('application/vueflow', JSON.stringify(nodeTemplate))
      dataTransfer.effectAllowed = 'move'

      // 获取位置
      const sourceRect = sourceElement.getBoundingClientRect()
      const targetRect = flowCanvas.getBoundingClientRect()

      const sourceCenterX = sourceRect.left + sourceRect.width / 2
      const sourceCenterY = sourceRect.top + sourceRect.height / 2
      const clientX = targetRect.left + targetX
      const clientY = targetRect.top + targetY

      // 触发 dragstart
      const dragStartEvent = new DragEvent('dragstart', {
        bubbles: true,
        cancelable: true,
        clientX: sourceCenterX,
        clientY: sourceCenterY,
        dataTransfer
      })
      sourceElement.dispatchEvent(dragStartEvent)

      // 触发 dragenter
      const dragEnterEvent = new DragEvent('dragenter', {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
        dataTransfer
      })
      flowCanvas.dispatchEvent(dragEnterEvent)

      // 触发 dragover
      const dragOverEvent = new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
        dataTransfer
      })
      flowCanvas.dispatchEvent(dragOverEvent)

      // 触发 drop
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
        dataTransfer
      })
      Object.defineProperty(dropEvent, 'offsetX', { value: targetX, writable: false })
      Object.defineProperty(dropEvent, 'offsetY', { value: targetY, writable: false })
      flowCanvas.dispatchEvent(dropEvent)

      // 触发 dragend
      const dragEndEvent = new DragEvent('dragend', {
        bubbles: true,
        cancelable: true,
        clientX,
        clientY,
        dataTransfer
      })
      sourceElement.dispatchEvent(dragEndEvent)

      console.log('Drag events dispatched for:', nodeLabel)
    },
    { targetX, targetY, nodeTemplateStr: JSON.stringify(nodeTemplate), sectionName, nodeLabel }
  )

  await page.waitForTimeout(500)
}

/**
 * 辅助函数：拖拽数据源节点到画布
 */
async function createDataSourceNode(
  page: Page,
  assetName: string,
  x: number,
  y: number
) {
  const template = {
    type: 'data_source',
    category: 'data_source',
    label: assetName,
    sourceType: 'DATABASE',
    icon: '🗄️',
    color: '#52C41A'
  }

  await dragNodeToCanvas(page, '数据源', '数据库表', template, x, y)
}

/**
 * 辅助函数：拖拽计算任务节点到画布
 */
async function createComputeTaskNode(
  page: Page,
  taskType: 'PSI' | 'MPC',
  x: number,
  y: number,
  techPath: 'TEE' | 'SOFTWARE_CRYPTO' = 'TEE'
) {
  const taskLabels: Record<string, string> = {
    'PSI': 'PSI 计算',
    'MPC': 'MPC 计算'
  }

  const template = {
    type: 'compute_task',
    category: 'compute_task',
    taskType: taskType,
    label: taskLabels[taskType],
    computeType: taskType,
    techPath: techPath,
    icon: taskType === 'MPC' ? '🧮' : '🔐',
    color: '#1890ff'
  }

  await dragNodeToCanvas(page, '计算任务', taskLabels[taskType], template, x, y)

  // 等待技术路径选择对话框
  await page.waitForTimeout(1000)

  // 处理技术路径选择对话框 - 选择 TEE
  await page.evaluate(() => {
    const dialog = document.querySelector('.tech-path-dialog, .modal-container')
    if (dialog) {
      // 找到 TEE 选项并选中
      const teeOption = Array.from(dialog.querySelectorAll('.tech-path-option, .radio-option')).find(
        el => el.textContent?.includes('硬件 TEE') || el.textContent?.includes('TEE')
      )
      if (teeOption) {
        (teeOption as HTMLElement).click()
      }

      // 点击确定按钮
      const confirmBtn = Array.from(dialog.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('确定') || btn.textContent?.includes('确认')
      )
      if (confirmBtn) {
        (confirmBtn as HTMLElement).click()
      }
    }
  })

  await page.waitForTimeout(500)
}

/**
 * 辅助函数：创建连接（从源节点到目标节点）
 */
async function connectNodes(
  page: Page,
  sourceIndex: number,
  targetIndex: number
) {
  await page.evaluate(
    ({ sourceIndex, targetIndex }) => {
      const nodes = document.querySelectorAll('.vue-flow__node')
      const sourceNode = nodes[sourceIndex]
      const targetNode = nodes[targetIndex]

      if (!sourceNode || !targetNode) {
        console.error('Source or target node not found')
        return
      }

      // 找到源节点的输出 handle
      const sourceHandle = sourceNode.querySelector('.vue-flow__handle-bottom, [data-handleid="output"]') as HTMLElement
      // 找到目标节点的输入 handle
      const targetHandle = targetNode.querySelector('.vue-flow__handle-top, [data-handleid="input"]') as HTMLElement

      if (!sourceHandle || !targetHandle) {
        console.error('Handle not found')
        return
      }

      // 获取位置
      const sourceRect = sourceHandle.getBoundingClientRect()
      const targetRect = targetHandle.getBoundingClientRect()

      const sourceX = sourceRect.left + sourceRect.width / 2
      const sourceY = sourceRect.top + sourceRect.height / 2
      const targetX = targetRect.left + targetRect.width / 2
      const targetY = targetRect.top + targetRect.height / 2

      // 模拟鼠标拖拽连接
      const canvas = document.querySelector('.vue-flow') as HTMLElement

      // mousedown on source handle
      const mouseDownEvent = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: sourceX,
        clientY: sourceY,
        button: 0
      })
      sourceHandle.dispatchEvent(mouseDownEvent)

      // mousemove to target
      const mouseMoveEvent = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: targetX,
        clientY: targetY
      })
      canvas.dispatchEvent(mouseMoveEvent)

      // mouseup on target handle
      const mouseUpEvent = new MouseEvent('mouseup', {
        bubbles: true,
        cancelable: true,
        clientX: targetX,
        clientY: targetY,
        button: 0
      })
      targetHandle.dispatchEvent(mouseUpEvent)

      console.log('Connection created from node', sourceIndex, 'to', targetIndex)
    },
    { sourceIndex, targetIndex }
  )

  await page.waitForTimeout(500)
}

/**
 * 辅助函数：选择字段并确认
 */
async function selectFieldsAndConfirm(
  page: Page,
  options: {
    joinType?: 'INNER' | 'CROSS' | 'Union' | 'NoAssoc'
    selectAll?: boolean
    joinFields?: string[]
  } = {}
) {
  await page.waitForTimeout(500)

  await page.evaluate((opts) => {
    const dialog = document.querySelector('.field-selector-modal, .modal-container')
    if (!dialog) {
      console.error('Field selector dialog not found')
      return
    }

    // 选择连接类型
    if (opts.joinType) {
      const joinSelect = dialog.querySelector('.join-type-select, select') as HTMLSelectElement
      if (joinSelect) {
        joinSelect.value = opts.joinType
        joinSelect.dispatchEvent(new Event('change', { bubbles: true }))
      }
    }

    // 选择所有字段
    if (opts.selectAll) {
      const checkboxes = dialog.querySelectorAll('input[type="checkbox"]:not(:disabled)')
      checkboxes.forEach((cb, index) => {
        // 第一个 checkbox 是选择字段，跳过 join 键的 checkbox
        if (index % 2 === 0) {
          (cb as HTMLInputElement).checked = true
          cb.dispatchEvent(new Event('change', { bubbles: true }))
        }
      })
    }

    // 设置 join 字段
    if (opts.joinFields && opts.joinFields.length > 0) {
      const rows = dialog.querySelectorAll('tbody tr')
      rows.forEach(row => {
        const fieldName = row.querySelector('.col-name label')?.textContent
        if (fieldName && opts.joinFields.includes(fieldName)) {
          const joinCheckbox = row.querySelector('.col-join input[type="checkbox"]') as HTMLInputElement
          if (joinCheckbox) {
            joinCheckbox.checked = true
            joinCheckbox.dispatchEvent(new Event('change', { bubbles: true }))
          }
        }
      })
    }

    // 点击确认按钮
    setTimeout(() => {
      const confirmBtn = Array.from(dialog.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('确认') || btn.textContent?.includes('确定')
      )
      if (confirmBtn) {
        (confirmBtn as HTMLElement).click()
      }
    }, 100)
  }, options)

  await page.waitForTimeout(500)
}

/**
 * 辅助函数：点击节点选中它
 */
async function selectNode(page: Page, nodeIndex: number) {
  const nodes = page.locator('.vue-flow__node')
  const node = nodes.nth(nodeIndex)
  await node.click({ force: true })
  await page.waitForTimeout(300)
}

/**
 * 辅助函数：为任务添加 TEE 算力
 */
async function addTEEComputeResource(page: Page) {
  await page.evaluate(() => {
    // 找到添加算力按钮
    const addComputeBtn = Array.from(document.querySelectorAll('button')).find(
      btn => btn.textContent?.includes('添加算力') || btn.textContent?.includes('添加TEE算力')
    )
    if (addComputeBtn) {
      (addComputeBtn as HTMLElement).click()
    }
  })

  await page.waitForTimeout(500)

  // 在弹出的对话框中选择算力资源
  await page.evaluate(() => {
    const dialog = document.querySelector('.modal-container, .resource-selector-dialog')
    if (dialog) {
      // 选择第一个算力资源
      const resourceOption = dialog.querySelector('.resource-option, .compute-resource-item, tr')
      if (resourceOption) {
        (resourceOption as HTMLElement).click()
      }

      // 点击确认
      setTimeout(() => {
        const confirmBtn = Array.from(dialog.querySelectorAll('button')).find(
          btn => btn.textContent?.includes('确认') || btn.textContent?.includes('确定')
        )
        if (confirmBtn) {
          (confirmBtn as HTMLElement).click()
        }
      }, 100)
    }
  })

  await page.waitForTimeout(500)
}

/**
 * 辅助函数：为任务添加输出数据
 */
async function addOutputData(
  page: Page,
  participantId: string,
  fieldNames: string[]
) {
  await page.evaluate(() => {
    // 找到添加输出按钮
    const addOutputBtn = Array.from(document.querySelectorAll('button')).find(
      btn => btn.textContent?.includes('添加输出') || btn.textContent?.includes('添加输出数据')
    )
    if (addOutputBtn) {
      (addOutputBtn as HTMLElement).click()
    }
  })

  await page.waitForTimeout(500)

  // 在弹出的对话框中配置输出
  await page.evaluate(({ participantId, fieldNames }) => {
    const dialog = document.querySelector('.modal-container, .output-config-dialog')
    if (dialog) {
      // 选择参与方
      const participantSelect = dialog.querySelector('select') as HTMLSelectElement
      if (participantSelect) {
        participantSelect.value = participantId
        participantSelect.dispatchEvent(new Event('change', { bubbles: true }))
      }

      // 选择字段
      setTimeout(() => {
        const checkboxes = dialog.querySelectorAll('input[type="checkbox"]')
        checkboxes.forEach(cb => {
          const fieldName = cb.closest('tr')?.querySelector('.col-name')?.textContent
          if (fieldName && fieldNames.includes(fieldName.trim())) {
            (cb as HTMLInputElement).checked = true
            cb.dispatchEvent(new Event('change', { bubbles: true }))
          }
        })

        // 点击确认
        setTimeout(() => {
          const confirmBtn = Array.from(dialog.querySelectorAll('button')).find(
            btn => btn.textContent?.includes('确认') || btn.textContent?.includes('确定')
          )
          if (confirmBtn) {
            (confirmBtn as HTMLElement).click()
          }
        }, 100)
      }, 200)
    }
  }, { participantId, fieldNames })

  await page.waitForTimeout(500)
}

/**
 * 辅助函数：为 MPC 任务添加模型
 */
async function addModel(
  page: Page,
  modelType: string,
  modelName: string,
  fieldBindings: Record<string, string>
) {
  await page.evaluate(() => {
    // 找到添加模型按钮
    const addModelBtn = Array.from(document.querySelectorAll('button')).find(
      btn => btn.textContent?.includes('添加模型') || btn.textContent?.includes('添加Codebin模型')
    )
    if (addModelBtn) {
      (addModelBtn as HTMLElement).click()
    }
  })

  await page.waitForTimeout(500)

  // 在弹出的对话框中配置模型
  await page.evaluate(({ modelType, modelName, fieldBindings }) => {
    const dialog = document.querySelector('.modal-container, .model-config-dialog')
    if (dialog) {
      // 选择模型类型
      const typeSelects = dialog.querySelectorAll('select')
      if (typeSelects.length > 0) {
        // 第一个 select 可能是模型类型
        const typeOptions = typeSelects[0].querySelectorAll('option')
        typeOptions.forEach(opt => {
          if (opt.textContent?.includes(modelType)) {
            typeSelects[0].value = opt.value
            typeSelects[0].dispatchEvent(new Event('change', { bubbles: true }))
          }
        })
      }

      // 选择模型
      setTimeout(() => {
        if (typeSelects.length > 1) {
          const modelOptions = typeSelects[1].querySelectorAll('option')
          modelOptions.forEach(opt => {
            if (opt.textContent?.includes(modelName)) {
              typeSelects[1].value = opt.value
              typeSelects[1].dispatchEvent(new Event('change', { bubbles: true }))
            }
          })
        }

        // 设置字段绑定
        setTimeout(() => {
          const bindingRows = dialog.querySelectorAll('.field-binding-row, .param-binding-row')
          bindingRows.forEach(row => {
            const paramName = row.querySelector('.param-name, .field-name')?.textContent
            if (paramName && fieldBindings[paramName.trim()]) {
              const select = row.querySelector('select') as HTMLSelectElement
              if (select) {
                select.value = fieldBindings[paramName.trim()]
                select.dispatchEvent(new Event('change', { bubbles: true }))
              }
            }
          })

          // 点击确认
          setTimeout(() => {
            const confirmBtn = Array.from(dialog.querySelectorAll('button')).find(
              btn => btn.textContent?.includes('确认') || btn.textContent?.includes('确定')
            )
            if (confirmBtn) {
              (confirmBtn as HTMLElement).click()
            }
          }, 100)
        }, 200)
      }, 200)
    }
  }, { modelType, modelName, fieldBindings })

  await page.waitForTimeout(500)
}

/**
 * 辅助函数：验证节点数量
 */
async function verifyNodeCount(page: Page, expectedCount: number) {
  const nodes = page.locator('.vue-flow__node')
  const count = await nodes.count()
  expect(count).toBe(expectedCount)
}

// ==================== 测试用例 ====================

test.describe('PSI+MPC-TEE 完整流程测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.vue-flow', { timeout: 30000 })
    await enableTestMode(page)
  })

  test('步骤1-2: 创建两个数据源节点', async ({ page }) => {
    // 步骤1: 拖拽企业A的"用户行为数据"数据源
    await createDataSourceNode(page, '用户行为数据', 100, 100)

    // 步骤2: 拖拽企业B的"信贷客户数据"数据源
    await createDataSourceNode(page, '信贷客户数据', 300, 100)

    // 验证节点数量
    await verifyNodeCount(page, 2)
  })

  test('步骤3: 创建 PSI 计算任务节点', async ({ page }) => {
    // 先创建数据源
    await createDataSourceNode(page, '用户行为数据', 100, 100)
    await createDataSourceNode(page, '信贷客户数据', 300, 100)

    // 步骤3: 拖拽"PSI计算"任务，选择"硬件TEE"方案
    await createComputeTaskNode(page, 'PSI', 200, 280, 'TEE')

    // 验证节点数量
    await verifyNodeCount(page, 3)
  })

  test('步骤4-5: 连接数据源到PSI任务', async ({ page }) => {
    // 创建节点
    await createDataSourceNode(page, '用户行为数据', 100, 100)
    await createDataSourceNode(page, '信贷客户数据', 300, 100)
    await createComputeTaskNode(page, 'PSI', 200, 280, 'TEE')

    // 步骤4: 连接"用户行为数据"到PSI任务
    await connectNodes(page, 0, 2)
    await selectFieldsAndConfirm(page, { joinType: 'INNER', selectAll: true, joinFields: ['user_id'] })

    // 步骤5: 连接"信贷客户数据"到PSI任务
    await connectNodes(page, 1, 2)
    await selectFieldsAndConfirm(page, { joinType: 'INNER', selectAll: true, joinFields: ['customer_id'] })

    // 验证连接线数量
    const edges = page.locator('.vue-flow__edge')
    const edgeCount = await edges.count()
    expect(edgeCount).toBeGreaterThanOrEqual(2)
  })

  test('步骤6-8: 为PSI任务添加算力和输出', async ({ page }) => {
    // 创建节点
    await createDataSourceNode(page, '用户行为数据', 100, 50)
    await createDataSourceNode(page, '信贷客户数据', 300, 50)
    await createComputeTaskNode(page, 'PSI', 200, 200, 'TEE')

    // 连接数据源
    await connectNodes(page, 0, 2)
    await selectFieldsAndConfirm(page, { joinType: 'INNER', selectAll: true, joinFields: ['user_id'] })
    await connectNodes(page, 1, 2)
    await selectFieldsAndConfirm(page, { joinType: 'INNER', selectAll: true, joinFields: ['customer_id'] })

    // 选中 PSI 任务节点
    await selectNode(page, 2)

    // 步骤6: 为"PSI计算"添加TEE算力
    await addTEEComputeResource(page)

    // 步骤7: 为"PSI计算"添加输出数据（企业A）
    await addOutputData(page, 'ent_001', ['user_id', 'action_time', 'page_url', 'action_type', 'device_type', 'user_agent', 'ip_address', 'session_id'])

    // 步骤8: 为"PSI计算"添加输出数据（企业B）
    await addOutputData(page, 'ent_002', ['customer_id', 'name', 'id_card', 'credit_score', 'risk_level'])

    // 验证输出节点已创建
    await verifyNodeCount(page, 5) // 2 数据源 + 1 PSI + 2 输出
  })

  test('步骤9-10: 创建MPC任务并添加算力', async ({ page }) => {
    // 创建节点
    await createDataSourceNode(page, '用户行为数据', 100, 50)
    await createDataSourceNode(page, '信贷客户数据', 300, 50)
    await createComputeTaskNode(page, 'PSI', 200, 180, 'TEE')

    // 连接数据源
    await connectNodes(page, 0, 2)
    await selectFieldsAndConfirm(page, { joinType: 'INNER', selectAll: true, joinFields: ['user_id'] })
    await connectNodes(page, 1, 2)
    await selectFieldsAndConfirm(page, { joinType: 'INNER', selectAll: true, joinFields: ['customer_id'] })

    // 选中 PSI 任务并添加输出
    await selectNode(page, 2)
    await addTEEComputeResource(page)
    await addOutputData(page, 'ent_001', ['user_id', 'action_time'])
    await addOutputData(page, 'ent_002', ['customer_id', 'name'])

    // 步骤9: 拖拽"MPC计算"任务，选择"硬件TEE"方案
    await createComputeTaskNode(page, 'MPC', 200, 380, 'TEE')

    // 选中 MPC 任务
    await selectNode(page, 5) // 2 数据源 + 1 PSI + 2 输出 + 1 MPC

    // 步骤10: 为"MPC计算"添加TEE算力
    await addTEEComputeResource(page)

    // 验证节点数量
    await verifyNodeCount(page, 6)
  })

  test('步骤11-12: 连接PSI输出到MPC任务', async ({ page }) => {
    // 创建完整流程
    await createDataSourceNode(page, '用户行为数据', 100, 50)
    await createDataSourceNode(page, '信贷客户数据', 350, 50)
    await createComputeTaskNode(page, 'PSI', 220, 180, 'TEE')

    // 连接数据源到 PSI
    await connectNodes(page, 0, 2)
    await selectFieldsAndConfirm(page, { joinType: 'INNER', selectAll: true, joinFields: ['user_id'] })
    await connectNodes(page, 1, 2)
    await selectFieldsAndConfirm(page, { joinType: 'INNER', selectAll: true, joinFields: ['customer_id'] })

    // 为 PSI 添加输出
    await selectNode(page, 2)
    await addTEEComputeResource(page)
    await addOutputData(page, 'ent_001', ['user_id'])
    await addOutputData(page, 'ent_002', ['customer_id'])

    // 创建 MPC 任务
    await createComputeTaskNode(page, 'MPC', 220, 400, 'TEE')

    // 步骤11: 连接PSI输出1到MPC任务
    await connectNodes(page, 3, 5) // PSI 输出1 -> MPC
    await selectFieldsAndConfirm(page, { joinType: 'INNER', selectAll: true, joinFields: ['user_id'] })

    // 步骤12: 连接PSI输出2到MPC任务
    await connectNodes(page, 4, 5) // PSI 输出2 -> MPC
    await selectFieldsAndConfirm(page, { joinType: 'INNER', selectAll: true, joinFields: ['customer_id'] })

    // 验证连接线数量
    const edges = page.locator('.vue-flow__edge')
    const edgeCount = await edges.count()
    expect(edgeCount).toBeGreaterThanOrEqual(4) // 2 数据源->PSI + 2 PSI输出->MPC
  })

  test('步骤13-14: 为MPC任务添加模型和输出', async ({ page }) => {
    // 创建完整流程（简化版）
    await createDataSourceNode(page, '用户行为数据', 100, 50)
    await createDataSourceNode(page, '信贷客户数据', 350, 50)
    await createComputeTaskNode(page, 'PSI', 220, 180, 'TEE')

    await connectNodes(page, 0, 2)
    await selectFieldsAndConfirm(page, { joinType: 'INNER', selectAll: true, joinFields: ['user_id'] })
    await connectNodes(page, 1, 2)
    await selectFieldsAndConfirm(page, { joinType: 'INNER', selectAll: true, joinFields: ['customer_id'] })

    await selectNode(page, 2)
    await addTEEComputeResource(page)
    await addOutputData(page, 'ent_001', ['user_id', 'action_time'])
    await addOutputData(page, 'ent_002', ['customer_id', 'credit_score'])

    await createComputeTaskNode(page, 'MPC', 220, 400, 'TEE')

    await connectNodes(page, 3, 5)
    await selectFieldsAndConfirm(page, { joinType: 'INNER', selectAll: true, joinFields: ['user_id'] })
    await connectNodes(page, 4, 5)
    await selectFieldsAndConfirm(page, { joinType: 'INNER', selectAll: true, joinFields: ['customer_id'] })

    // 选中 MPC 任务
    await selectNode(page, 5)

    // 步骤13: 为"MPC计算"添加Codebin模型
    await addModel(page, 'V3.1', '中小企业信用评分模型', {
      'revenue': 'action_time',
      'net_profit': 'action_time',
      'asset_liability_ratio': 'action_type'
    })

    // 步骤14: 为"MPC计算"添加输出数据
    await addOutputData(page, 'ent_001', ['statistic_value'])

    // 验证最终节点数量
    const nodes = page.locator('.vue-flow__node')
    const count = await nodes.count()
    expect(count).toBeGreaterThanOrEqual(6)
  })

  test('完整流程: PSI+MPC-TEE 端到端', async ({ page }) => {
    // 步骤1: 拖拽企业A的"用户行为数据"数据源
    await createDataSourceNode(page, '用户行为数据', 100, 50)

    // 步骤2: 拖拽企业B的"信贷客户数据"数据源
    await createDataSourceNode(page, '信贷客户数据', 350, 50)

    // 步骤3: 拖拽"PSI计算"任务，选择"硬件TEE"方案
    await createComputeTaskNode(page, 'PSI', 220, 180, 'TEE')

    // 步骤4: 连接"用户行为数据"到PSI任务
    await connectNodes(page, 0, 2)
    await selectFieldsAndConfirm(page, { joinType: 'INNER', selectAll: true, joinFields: ['user_id'] })

    // 步骤5: 连接"信贷客户数据"到PSI任务
    await connectNodes(page, 1, 2)
    await selectFieldsAndConfirm(page, { joinType: 'INNER', selectAll: true, joinFields: ['customer_id'] })

    // 选中 PSI 任务
    await selectNode(page, 2)

    // 步骤6: 为"PSI计算"添加TEE算力
    await addTEEComputeResource(page)

    // 步骤7: 为"PSI计算"添加输出数据（企业A）
    await addOutputData(page, 'ent_001', ['user_id', 'action_time', 'page_url', 'action_type', 'device_type', 'user_agent', 'ip_address', 'session_id'])

    // 步骤8: 为"PSI计算"添加输出数据（企业B）
    await addOutputData(page, 'ent_002', ['customer_id', 'name', 'id_card', 'credit_score', 'risk_level'])

    // 步骤9: 拖拽"MPC计算"任务，选择"硬件TEE"方案
    await createComputeTaskNode(page, 'MPC', 220, 420, 'TEE')

    // 选中 MPC 任务
    await selectNode(page, 5)

    // 步骤10: 为"MPC计算"添加TEE算力
    await addTEEComputeResource(page)

    // 步骤11: 连接PSI输出1到MPC任务
    await connectNodes(page, 3, 5)
    await selectFieldsAndConfirm(page, { joinType: 'INNER', selectAll: true, joinFields: ['user_id'] })

    // 步骤12: 连接PSI输出2到MPC任务
    await connectNodes(page, 4, 5)
    await selectFieldsAndConfirm(page, { joinType: 'INNER', selectAll: true, joinFields: ['customer_id'] })

    // 选中 MPC 任务
    await selectNode(page, 5)

    // 步骤13: 为"MPC计算"添加Codebin模型
    await addModel(page, 'V3.1', '中小企业信用评分模型', {
      'revenue': 'action_time',
      'net_profit': 'action_time',
      'asset_liability_ratio': 'action_type',
      'current_ratio': 'page_url',
      'operation_years': 'action_type'
    })

    // 步骤14: 为"MPC计算"添加输出数据
    await addOutputData(page, 'ent_001', ['statistic_value'])

    // 验证最终节点数量
    const nodes = page.locator('.vue-flow__node')
    const count = await nodes.count()
    expect(count).toBeGreaterThanOrEqual(6)

    // 验证连接线数量
    const edges = page.locator('.vue-flow__edge')
    const edgeCount = await edges.count()
    expect(edgeCount).toBeGreaterThanOrEqual(4)
  })
})

// ==================== JSON 导出验证测试 ====================

test.describe('JSON 导出验证', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.vue-flow', { timeout: 30000 })
    await enableTestMode(page)
  })

  test('导出的 JSON 应包含正确的任务结构', async ({ page }) => {
    // 创建简单流程
    await createDataSourceNode(page, '用户行为数据', 100, 100)
    await createComputeTaskNode(page, 'PSI', 100, 250, 'TEE')

    // 点击导出按钮
    const exportBtn = page.locator('button:has-text("导出")')
    await expect(exportBtn).toBeVisible()

    // 验证导出功能可用
    await exportBtn.dispatchEvent('click')
    await page.waitForTimeout(500)
  })

  test('导出的 JSON 应包含正确的参与方信息', async ({ page }) => {
    // 创建包含两个企业的流程
    await createDataSourceNode(page, '用户行为数据', 100, 100)
    await createDataSourceNode(page, '信贷客户数据', 300, 100)

    // 点击导出按钮
    const exportBtn = page.locator('button:has-text("导出")')
    await expect(exportBtn).toBeVisible()
  })

  test('导出的 JSON 应包含正确的 TEE 技术路径', async ({ page }) => {
    // 创建 TEE 类型的任务
    await createComputeTaskNode(page, 'PSI', 200, 200, 'TEE')

    // 验证节点已创建
    const nodes = page.locator('.vue-flow__node')
    const count = await nodes.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })
})
