/**
 * PSI+MPC-TEE 流程端到端测试
 * Feature: 830PSI+MPC-TEE
 *
 * 测试流程:
 * 1. 拖拽企业A的"用户行为数据"数据源
 * 2. 拖拽企业B的"信贷客户数据"数据源
 * 3. 拖拽"PSI计算"任务，选择"硬件TEE"方案
 * 4. 连接"用户行为数据"到PSI任务
 * 5. 连接"信贷客户数据"到PSI任务
 * 6. 为"PSI计算"添加TEE算力
 * 7. 为"PSI计算"添加输出数据（ent_001，选择"用户行为数据"的全部字段）
 * 8. 为"PSI计算"添加输出数据（ent_002，选择"信贷客户数据"的全部字段）
 * 9. 拖拽"MPC计算"任务，选择"硬件TEE"方案
 * 10. 为"MPC计算"添加TEE算力
 * 11. 连接PSI计算的第一个输出数据到"MPC计算"任务
 * 12. 连接PSI计算的第二个输出数据到"MPC计算"任务
 * 13. 为"MPC计算"添加Codebin模型（V3.1类型，中小企业信用评分模型）
 * 14. 为"MPC计算"添加输出数据（ent_001，选择statistic_value字段）
 * 15. 导出JSON并保存到测试输出文件夹，打印文件名到标准输出
 */

import { test, expect, Page } from '@playwright/test'
import path from 'path'
import fs from 'fs'

// 配置测试为串行模式
test.describe.configure({ mode: 'serial' })

// 测试输出目录
const testOutputDir = './test-output'

// 确保测试输出目录存在
test.beforeAll(async () => {
  const testOutputPath = path.join(testOutputDir)
  if (!fs.existsSync(testOutputPath)) {
    fs.mkdirSync(testOutputPath, { recursive: true })
  }
})

/**
 * 拖拽节点到画布
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
 * 创建数据源节点
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
 * 创建计算任务节点
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

  // 处理技术路径选择对话框
  await handleTechPathSelector(page, techPath)
}

/**
 * 处理技术路径选择对话框
 */
async function handleTechPathSelector(page: Page, techPath: 'TEE' | 'SOFTWARE_CRYPTO') {
  await page.evaluate((techPath) => {
    const dialog = document.querySelector('.tech-path-dialog, .modal-container, .modal-overlay')
    if (!dialog) {
      console.log('Tech path dialog not found')
      return
    }

    // 找到 TEE 选项并选中
    const teeOption = Array.from(dialog.querySelectorAll('.tech-path-option, .radio-option')).find(
      el => el.textContent?.includes('硬件 TEE') || el.textContent?.includes('TEE')
    )
    if (teeOption) {
      ;(teeOption as HTMLElement).click()
    }

    // 点击确定按钮
    const confirmBtn = Array.from(dialog.querySelectorAll('button')).find(
      btn => btn.textContent?.includes('确定') || btn.textContent?.includes('确认')
    )
    if (confirmBtn) {
      ;(confirmBtn as HTMLElement).click()
    }
  })
  await page.waitForTimeout(500)
}

 /**
 * 夋理字段选择对话框
 */
async function handleFieldSelection(
  page: Page,
  fieldCount: number,
  selectAll: boolean,
  joinField: string
) {
  await page.waitForTimeout(500)

  await page.evaluate(({ selectAll, joinField }) => {
    const dialog = document.querySelector('.field-selector-modal, .modal-container')
    if (!dialog) {
      console.error('Field selector dialog not found')
      return
    }

    // 选择连接类型 - INNER
    const joinTypeSelect = dialog.querySelector('.join-type-select') as HTMLSelectElement
    if (joinTypeSelect) {
      joinTypeSelect.value = 'INNER'
      joinTypeSelect.dispatchEvent(new Event('change', { bubbles: true }))
    }

    // 获取所有字段行
    const fieldRows = dialog.querySelectorAll('.field-table tbody tr')
    if (!fieldRows || fieldRows.length === 0) {
      console.error('No field rows found')
      return
    }

    // 全选或取消全选
    for (const row of fieldRows) {
      const checkbox = row.querySelector('.col-select input[type="checkbox"]') as HTMLInputElement
      if (checkbox) {
        if (selectAll && !checkbox.checked) {
          checkbox.click()
        } else if (!selectAll && checkbox.checked) {
          checkbox.click()
        }
      }
    }

    // 设置 join 字段
    for (const row of fieldRows) {
      const fieldName = row.querySelector('.col-name')?.textContent
      const joinCheckbox = row.querySelector('.col-join input[type="checkbox"]') as HTMLInputElement
      if (joinCheckbox && fieldName === joinField) {
        joinCheckbox.click()
      }
    }

    // 点击确认
    const confirmBtn = Array.from(dialog.querySelectorAll('button')).find(
      btn => btn.textContent?.includes('确认') || btn.textContent?.includes('确定')
    )
    if (confirmBtn) {
      ;(confirmBtn as HTMLElement).click()
    }
  }, { selectAll, joinField })
  await page.waitForTimeout(500)
}

 /**
 * 添加算力资源
 */
async function handleAddComputeProvider(page: Page) {
  await page.waitForTimeout(500)

  // 找到添加算力按钮
  const addComputeBtn = page.locator('.detail-panel .add-compute-btn')
  await addComputeBtn.click()
  await page.waitForTimeout(500)

  // 处理算力选择对话框
  await page.evaluate(() => {
    const dialog = document.querySelector('.compute-selector-modal, .modal-container')
    if (!dialog) {
      console.error('Compute selector dialog not found')
      return
    }

    // 选择第一个算力资源
    const firstResource = dialog.querySelector('.compute-resource-item')
    if (!firstResource) {
      console.error('No compute resources found')
      return
    }
    ;(firstResource as HTMLElement).click()

    // 点击确认
    const confirmBtn = Array.from(dialog.querySelectorAll('button')).find(
      btn => btn.textContent?.includes('确认') || btn.textContent?.includes('确定')
    )
    if (confirmBtn) {
      ;(confirmBtn as HTMLElement).click()
    }
  })
  await page.waitForTimeout(500)
}

 /**
 * 添加输出数据
 */
async function handleAddOutputData(
  page: Page,
  participantId: string,
  fieldNames: string[]
) {
  await page.waitForTimeout(500)

  // 找到添加输出按钮
  const addOutputBtn = page.locator('.detail-panel .add-output-btn')
  await addOutputBtn.click()
  await page.waitForTimeout(500)

  // 处理输出配置对话框
  await page.evaluate(({ participantId, fieldNames }) => {
    const dialog = document.querySelector('.output-config-modal, .modal-container')
    if (!dialog) {
      console.error('Output config dialog not found')
      return
    }

    // 选择参与方
    const participantCards = dialog.querySelectorAll('.enterprise-card-mini')
    const targetCard = Array.from(participantCards).find(
      card => card.dataset.participantId === participantId || card.textContent?.includes(participantId)
    )
    if (targetCard) {
      ;(targetCard as HTMLElement).click()
    }

    // 选择字段
    const fieldContainer = dialog.querySelector('.field-table-container')
    if (!fieldContainer) {
      const fieldRows = fieldContainer.querySelectorAll('tbody tr')
      for (const fieldName of fieldNames) {
        const row = Array.from(fieldRows).find(
          r => r.querySelector('.col-name')?.textContent === fieldName
        )
        if (row) {
          const checkbox = row.querySelector('.col-select input[type="checkbox"]') as HTMLInputElement
          if (checkbox && !checkbox.checked) {
            checkbox.click()
          }
        }
      }
    }

    // 点击确认
    const confirmBtn = Array.from(dialog.querySelectorAll('button')).find(
      btn => btn.textContent?.includes('确认') || btn.textContent?.includes('确定')
    )
    if (confirmBtn) {
      ;(confirmBtn as HTMLElement).click()
    }
  }, { participantId, fieldNames })
  await page.waitForTimeout(500)
}

 /**
 * 添加模型
 */
async function handleAddModel(
  page: Page,
  modelType: string,
  modelName: string,
  fieldBindings?: Record<string, string>
) {
  await page.waitForTimeout(500)

  // 找到添加模型按钮
  const addModelBtn = page.locator('.detail-panel .add-model-btn, .detail-panel .btn-add-model')
  await addModelBtn.click()
  await page.waitForTimeout(500)

  // 处理模型配置对话框
  await page.evaluate(({ modelType, modelName, fieldBindings }) => {
    const dialog = document.querySelector('.model-config-modal, .modal-container')
    if (!dialog) {
      console.error('Model config dialog not found')
      return
    }

    // 选择模型类型
    const typeSelect = dialog.querySelector('.model-type-select') as HTMLSelectElement
    if (typeSelect) {
      const option = Array.from(typeSelect.querySelectorAll('option')).find(
        opt => opt.textContent?.includes(modelType) || opt.value === modelType
      )
      if (option) {
        typeSelect.value = option.value
        typeSelect.dispatchEvent(new Event('change', { bubbles: true }))
      }
    }

    // 选择模型
    const modelSelect = dialog.querySelector('.model-select') as HTMLSelectElement
    if (modelSelect) {
      const modelOption = Array.from(modelSelect.querySelectorAll('option')).find(
        opt => opt.textContent?.includes(modelName)
      )
      if (modelOption) {
        modelSelect.value = modelOption.value
        modelSelect.dispatchEvent(new Event('change', { bubbles: true }))
      }
    }

    // 设置字段绑定
    if (fieldBindings) {
      const bindingRows = dialog.querySelectorAll('.param-binding-row')
      for (const [paramName, bindingValue] of Object.entries(fieldBindings)) {
        const row = Array.from(bindingRows).find(
          r => r.querySelector('.param-name')?.textContent?.trim() === paramName
        )
        if (row) {
          const fieldSelect = row.querySelector('.field-select') as HTMLSelectElement
          if (fieldSelect) {
            const option = Array.from(fieldSelect.querySelectorAll('option')).find(
              opt => opt.value?.includes(bindingValue) || opt.textContent?.includes(bindingValue)
            )
            if (option) {
              fieldSelect.value = option.value
              fieldSelect.dispatchEvent(new Event('change', { bubbles: true }))
            }
          }
        }
      }
    }

    // 点击确认
    const confirmBtn = Array.from(dialog.querySelectorAll('button')).find(
      btn => btn.textContent?.includes('确认') || btn.textContent?.includes('确定')
    )
    if (confirmBtn) {
      ;(confirmBtn as HTMLElement).click()
    }
  }, { modelType, modelName, fieldBindings })
  await page.waitForTimeout(500)
}

/**
 * 连接两个节点
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

      console.log(`Connection created from node ${sourceIndex} to node ${targetIndex}`)
    },
    { sourceIndex, targetIndex }
  )

  await page.waitForTimeout(500)
}

/**
 * 选中节点
 */
async function selectNode(page: Page, nodeIndex: number) {
  const nodes = page.locator('.vue-flow__node')
  const node = nodes.nth(nodeIndex)
  await node.click({ force: true })
  await page.waitForTimeout(300)
}

/**
 * 获取节点数量
 */
async function getNodeCount(page: Page): Promise<number> {
  const nodes = page.locator('.vue-flow__node')
  return await nodes.count()
}

/**
 * 导出 JSON 并保存到文件
 */
async function handleExportJSON(page: Page, outputDir: string): Promise<string> {
  try {
    // 确保输出目录存在
    const testOutputPath = path.join(outputDir)
    if (!fs.existsSync(testOutputPath)) {
      fs.mkdirSync(testOutputPath, { recursive: true })
    }

    // 点击导出按钮
    const exportBtn = page.locator('.header-btn:has-text("导出")')
    await expect(exportBtn).toBeVisible()

    // 监听下载
    const downloadPromise = page.waitForEvent('download')

    await exportBtn.click()

    // 等待下载完成
    const download = await downloadPromise

    // 获取下载的文件名
    const filename = download.suggestedFilename()
    if (!filename) {
      throw new Error('导出文件名获取失败')
    }

    // 保存文件到测试输出目录
    const outputPath = path.join(testOutputPath, filename)
    await download.saveAs(outputPath)

    // 打印文件名到标准输出
    console.log(`导出成功，文件名: ${filename}`)

    // 读取并打印 JSON 内容
    const jsonContent = await fs.promises.readFile(outputPath, 'utf-8')
    console.log('导出的 JSON 内容:')
    console.log(jsonContent)

    return filename
  } catch (error) {
    console.error('导出 JSON 失败:', error)
    throw error
  }
}

// ==================== 测试用例 ====================

 test('完整流程: PSI+MPC-TEE 端到端测试', async ({ page }) => {
  console.log('测试开始...')

  // 步骤1-2: 创建两个数据源节点
  console.log('步骤1: 拖拽企业A的"用户行为数据"数据源')
  await createDataSourceNode(page, '用户行为数据', 100, 100)
  console.log('步骤2: 拖拽企业B的"信贷客户数据"数据源')
  await createDataSourceNode(page, '信贷客户数据', 300, 100)
  const nodeCount = await getNodeCount(page)
  console.log(`当前节点数量: ${nodeCount}`)
  expect(nodeCount).toBe(2)

  // 步骤3: 创建 PSI 计算任务节点(选择 TEE 方案)
  console.log('步骤3: 拖拽"PSI计算"任务，选择"硬件TEE"方案')
  await createComputeTaskNode(page, 'PSI', 200, 200, 'TEE')
  const nodeCount = await getNodeCount(page)
  console.log(`当前节点数量: ${nodeCount}`)
  expect(nodeCount).toBe(3)

  // 步骤4: 连接"用户行为数据"到 PSI 任务
  console.log('步骤4: 连接"用户行为数据"到 PSI 任务')
  await connectNodes(page, 0, 2)
  await handleFieldSelection(page, 8, true, 'user_id')
  const nodeCount = await getNodeCount(page)
  console.log(`当前节点数量: ${nodeCount}`)

  // 步骤5: 连接"信贷客户数据"到 PSI 任务
  console.log('步骤5: 连接"信贷客户数据"到 PSI 任务')
  await connectNodes(page, 1, 2)
  await handleFieldSelection(page, 12, true, 'customer_id')
  // 选中 PSI 任务节点
  await selectNode(page, 2)
  const detailPanel = page.locator('.detail-panel')
  await expect(detailPanel).toBeVisible()
  await page.waitForTimeout(500)

  // 步骤6: 为 PSI 任务添加 TEE 算力
  console.log('步骤6: 为 PSI 任务添加 TEE 算力')
  await handleAddComputeProvider(page)

  // 步骤7: 为 PSI 任务添加输出数据(企业A - ent_001)
  console.log('步骤7: 为 PSI 任务添加输出数据(企业A - ent_001) 选择"用户行为数据"的全部字段')
  await handleAddOutputData(page, 'ent_001', [
    'user_id', 'action_time', 'page_url', 'action_type', 'device_type', 'user_agent', 'ip_address', 'session_id'
  ])

  // 步骤8: 为 PSI 任务添加输出数据(企业B - ent_002)
  console.log('步骤8: 为 PSI 任务添加输出数据(企业B - ent_002) 选择"信贷客户数据"的全部字段')
  await handleAddOutputData(page, 'ent_002', [
    'customer_id', 'name', 'id_card', 'credit_score', 'risk_level'
  )

  // 获取 PSI 输出节点
  const nodes = page.locator('.vue-flow__node')
  const psiOutputs = (await nodes.allInnerTexts()).filter(n => n.type === 'output-node')
  console.log(`PSI 输出节点数量: ${psiOutputs.length}`)
  expect(psiOutputs.length).toBe(2)

  // 步骤9: 创建 MPC 计算任务节点(选择 TEE 方案)
  console.log('步骤9: 拖拽"MPC计算"任务, 选择"硬件TEE"方案')
  await createComputeTaskNode(page, 'MPC', 200, 400, 'TEE')
  const nodeCount = await getNodeCount(page)
  console.log(`当前节点数量: ${nodeCount}`)
  // MPC 节点创建在索引 6， PSI 在节点在索引 2
  expect(nodeCount).toBe(6)

  // 选中 MPC 任务节点
  await selectNode(page, 5)
  const detailPanel = page.locator('.detail-panel')
  await expect(detailPanel).toBeVisible()
  await page.waitForTimeout(500)

  // 步骤10: 为 MPC 任务添加 TEE 算力
  console.log('步骤10: 为 MPC 任务添加 TEE 算力')
  await handleAddComputeProvider(page)

  // 步骤11: 连接 PSI 输出1 到 MPC 任务
  console.log('步骤11: 连接 PSI 输出1 到 MPC 任务')
  await connectNodes(page, 3, 5)  // PSI 输出1 是企业A的输出
  await handleFieldSelection(page, 8, true, 'user_id')

  // 步骤12: 连接 PSI 输出2 到 MPC 任务
  console.log('步骤12: 连接 PSI 输出2 到 MPC 任务')
  await connectNodes(page, 4, 5)  // PSI 输出2 是企业B的输出
  await handleFieldSelection(page, 8, true, 'customer_id')

  // 选中 MPC 任务节点
  await selectNode(page, 5)
  const detailPanel = page.locator('.detail-panel')
  await expect(detailPanel).toBeVisible()
  await page.waitForTimeout(500)

  // 步骤13: 为 MPC 任务添加 Codebin 模型(选择 V3.1 类型, 选择"中小企业信用评分模型")
  console.log('步骤13: 为 MPC 任务添加 Codebin模型(选择 V3.1类型, 选择"中小企业信用评分模型")')
  await handleAddModel(page, 'v3.1', '中小企业信用评分模型', {
    'revenue': 'action_time',
    'net_profit': 'action_time',
    'asset_liability_ratio': 'action_type',
    'current_ratio': 'page_url',
    'operation_years': 'action_type',
    'industry_risk_factor': ''
  })

  // 步骤14: 为 MPC 任务添加输出数据(企业A - ent_001, 选择"statistic_value"字段)
  console.log('步骤14: 为 MPC 任务添加输出数据(企业A - ent_001, 选择"statistic_value"字段)')
  await handleAddOutputData(page, 'ent_001', ['statistic_value'])

  // 步骤15: 导出 JSON 并保存到文件
  console.log('步骤15: 导出 JSON 并保存到文件')
  const filename = await handleExportJSON(page, testOutputDir)
  console.log(`\n========================================`)
  console.log(`测试完成! 导出文件: ${filename}`)
  console.log(`========================================\n`)
  expect(filename).toBeTruthy()
})
)