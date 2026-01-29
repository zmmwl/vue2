/**
 * DAG到标准JSON格式转换工具
 * 将Vue Flow的节点和连线转换为后端服务接口规范的JSON格式
 *
 * 参考:
 * - specs/001-dag-task-orchestration/contracts/export.ts
 * - specs/001-dag-task-orchestration/data-model.md
 */

import type { Node, Edge } from '@vue-flow/core'
import type {
  ExportJson,
  Task,
  Participant,
  AssetDetail,
  ComputeType,
  JoinCondition,
  DataProvider,
  DatasetItem,
  ResultConsumer,
  Expression,
  ComputeProvider,
  ComputeNode,
  ComputeCard,
  ModelProvider,
  ModelParameter
} from '@/types/contracts/export'
import type {
  ComputeTaskNodeData,
  LocalTaskNodeData,
  InputProvider,
  JoinCondition as NodeJoinCondition,
  ComputeModelConfig,
  ComputeResourceConfig,
  OutputDataConfig
} from '@/types/contracts/nodes'
import { logger } from '@/utils/logger'

/**
 * 主转换函数：DAG图 -> 标准JSON
 *
 * @param nodes - 所有节点（包括计算任务、模型、算力、输出节点）
 * @param edges - 所有连线
 * @returns 符合样例格式的导出JSON
 */
export function convertDagToJson(
  nodes: Node[],
  edges: Edge[]
): ExportJson {
  logger.info('[dag-export] Converting DAG to JSON', {
    nodeCount: nodes.length,
    edgeCount: edges.length
  })

  // 1. 过滤出计算任务节点和本地任务节点
  const taskNodes = nodes.filter(n => n.type === 'computeTask' || n.type === 'localTask')

  if (taskNodes.length === 0) {
    logger.warn('[dag-export] No task nodes found')
    return createEmptyExport()
  }

  // 2. 拓扑排序确定任务执行顺序
  const taskOrder = topologicalSort(taskNodes, edges)
  logger.debug('[dag-export] Task order', { taskOrder })

  // 3. 提取所有参与方企业
  const participants = extractParticipants(nodes, taskNodes)

  // 4. 构建资产详情列表（从数据源节点）
  const assetDetailList = buildAssetDetailList(nodes)

  // 5. 构建任务列表
  const taskList = buildTaskList(taskNodes, edges, taskOrder)

  // 6. 生成导出JSON
  const exportJson: ExportJson = {
    jobId: generateJobId(),
    name: 'privacy-computation-job',
    description: '',
    status: 0,
    serviceType: 0,
    createParticipantId: participants[0]?.participantId || '',
    modelType: 0,
    tlsEnable: false,
    assetDetailList,
    participantList: participants,
    taskList
  }

  logger.info('[dag-export] Conversion complete', {
    jobId: exportJson.jobId,
    taskCount: taskList.length,
    participantCount: participants.length
  })

  return exportJson
}

/**
 * 拓扑排序：确定任务执行顺序
 */
function topologicalSort(taskNodes: Node[], edges: Edge[]): string[] {
  const taskIds = taskNodes.map(n => n.id)
  const inDegree: Record<string, number> = {}
  const adjacencyList: Record<string, string[]> = {}

  // 初始化
  taskIds.forEach(id => {
    inDegree[id] = 0
    adjacencyList[id] = []
  })

  // 构建邻接表和入度（只考虑任务节点之间的依赖）
  edges.forEach(edge => {
    const sourceIsTask = taskIds.includes(edge.source)
    const targetIsTask = taskIds.includes(edge.target)

    if (sourceIsTask && targetIsTask) {
      adjacencyList[edge.source]?.push(edge.target)
      inDegree[edge.target] = (inDegree[edge.target] ?? 0) + 1
    }
  })

  // Kahn算法
  const queue: string[] = []
  const result: string[] = []

  // 找到所有入度为0的节点
  taskIds.forEach(id => {
    if (inDegree[id] === 0) {
      queue.push(id)
    }
  })

  while (queue.length > 0) {
    const current = queue.shift()!
    result.push(current)

    // 减少邻接节点的入度
    adjacencyList[current]?.forEach(neighbor => {
      inDegree[neighbor] = (inDegree[neighbor] ?? 0) - 1
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor)
      }
    })
  }

  // 检测循环
  if (result.length !== taskIds.length) {
    logger.warn('[dag-export] Cycle detected in task graph')
    // 返回原始顺序作为fallback
    return taskIds
  }

  return result
}

/**
 * 提取所有参与方企业
 */
function extractParticipants(
  allNodes: Node[],
  taskNodes: Node[]
): Participant[] {
  const participantMap = new Map<string, Participant>()

  // 从数据源节点提取
  allNodes
    .filter(n => n.type === 'dataSource')
    .forEach(node => {
      const data = node.data as any
      const pid = data.participantId || data.assetInfo?.entityId
      const name = data.entityName || data.assetInfo?.entityName || pid

      if (pid && !participantMap.has(pid)) {
        participantMap.set(pid, {
          participantId: pid,
          entityName: name || pid
        })
      }
    })

  // 从计算任务节点提取（从inputProviders）
  taskNodes.forEach(node => {
    const data = node.data as ComputeTaskNodeData | LocalTaskNodeData

    // 从inputProviders提取
    data.inputProviders?.forEach(provider => {
      const pid = provider.participantId
      if (pid && !participantMap.has(pid)) {
        participantMap.set(pid, {
          participantId: pid,
          entityName: pid
        })
      }
    })

    // 从models提取
    const models = (data as ComputeTaskNodeData).models
    models?.forEach(model => {
      const pid = model.participantId
      if (pid && !participantMap.has(pid)) {
        participantMap.set(pid, {
          participantId: pid,
          entityName: pid
        })
      }
    })

    // 从computeProviders提取
    const providers = (data as ComputeTaskNodeData).computeProviders
    providers?.forEach(provider => {
      const pid = provider.participantId
      if (pid && !participantMap.has(pid)) {
        participantMap.set(pid, {
          participantId: pid,
          entityName: pid
        })
      }
    })

    // 从outputs提取
    const outputs = data.outputs
    outputs?.forEach(output => {
      const pid = output.participantId
      if (pid && !participantMap.has(pid)) {
        participantMap.set(pid, {
          participantId: pid,
          entityName: pid
        })
      }
    })

    // 从本地任务节点提取
    const localTaskData = data as LocalTaskNodeData
    if (localTaskData.participantId && !participantMap.has(localTaskData.participantId)) {
      participantMap.set(localTaskData.participantId, {
        participantId: localTaskData.participantId,
        entityName: localTaskData.participantId
      })
    }
  })

  return Array.from(participantMap.values())
}

/**
 * 构建资产详情列表（从数据源节点）
 */
function buildAssetDetailList(nodes: Node[]): AssetDetail[] {
  const assetDetails: AssetDetail[] = []

  nodes
    .filter(n => n.type === 'dataSource')
    .forEach(node => {
      const data = node.data as any
      const assetInfo = data.assetInfo
      const dataInfo = assetInfo?.dataInfo

      if (!dataInfo) return

      // 为每个字段创建一个AssetDetail
      dataInfo.fieldList?.forEach((field: any) => {
        assetDetails.push({
          assetId: assetInfo.assetId || node.id,
          participantId: assetInfo.entityId || data.participantId || '',
          entityName: assetInfo.entityName || data.entityName || '',
          assetName: assetInfo.assetName || data.assetName || '',
          dbName: dataInfo.databaseName || '',
          tableName: dataInfo.tableName || '',
          columnName: field.name || field.columnName || '',
          type: field.dataType || field.type || '',
          length: field.length || '',
          comments: field.comments || field.comment || '',
          holderCompany: assetInfo.entityName || data.entityName || '',
          visibleType: field.visibleType || 0
        })
      })
    })

  return assetDetails
}

/**
 * 构建任务列表
 */
function buildTaskList(
  taskNodes: Node[],
  edges: Edge[],
  taskOrder: string[]
): Task[] {
  return taskOrder.map(taskId => {
    const node = taskNodes.find(n => n.id === taskId)
    if (!node) {
      logger.warn('[dag-export] Task node not found', { taskId })
      return createEmptyTask(taskId)
    }

    return buildTask(node, edges, taskNodes)
  })
}

/**
 * 构建单个任务
 */
function buildTask(
  node: Node,
  edges: Edge[],
  allTaskNodes: Node[]
): Task {
  const data = node.data as ComputeTaskNodeData | LocalTaskNodeData
  const isLocalTask = node.type === 'localTask'

  // 获取依赖任务ID列表
  const taskSrcIdList = getDependencyTaskIds(node.id, edges, allTaskNodes)

  // 判断是否为最终任务（有输出或无下游任务）
  const isFinalTask = checkIsFinalTask(node.id, edges, allTaskNodes, data)

  if (isLocalTask) {
    return buildLocalTask(node.id, data as LocalTaskNodeData, taskSrcIdList, isFinalTask)
  }

  return buildComputeTask(node.id, data as ComputeTaskNodeData, taskSrcIdList, isFinalTask)
}

/**
 * 构建计算任务
 */
function buildComputeTask(
  taskId: string,
  data: ComputeTaskNodeData,
  taskSrcIdList: string[],
  isFinalTask: boolean
): Task {
  const computeType = getComputeType(data.computeType, data.techPath)

  const task: Task = {
    kind: 'Task',
    taskId,
    name: data.label || `Task-${taskId.slice(0, 8)}`,
    taskSrcIdList: taskSrcIdList.length > 0 ? taskSrcIdList : undefined,
    isFinalTask,
    serviceType: 0, // 待定义
    computeType,
    implementation: data.techPath === 'tee' ? 'TEE' : 'SOFTWARE',
    dataProviderList: buildDataProviderList(data.inputProviders),
    participantList: [], // 从各个配置中提取
    resultConsumerList: buildResultConsumerList(data.outputs)
  }

  // 添加join条件
  if (data.joinConditions && data.joinConditions.length > 0) {
    task.joinConditionList = buildJoinConditionList(data.joinConditions)
  }

  // 添加表达式（MPC + software）
  if (data.expression && data.computeType === 'MPC' && data.techPath === 'software') {
    task.expressionList = buildExpressionList(data.expression)
  }

  // 添加算力提供者
  if (data.computeProviders && data.computeProviders.length > 0) {
    task.computeProviderList = buildComputeProviderList(data.computeProviders)
  }

  // 添加模型提供者（排除expression类型）
  const nonExpressionModels = data.models?.filter(m => m.type !== 'expression')
  if (nonExpressionModels && nonExpressionModels.length > 0) {
    task.modelProviderList = buildModelProviderList(nonExpressionModels)
  }

  // 提取参与方列表
  task.participantList = extractTaskParticipants(data)

  return task
}

/**
 * 构建本地任务（CONCAT）
 */
function buildLocalTask(
  taskId: string,
  data: LocalTaskNodeData,
  taskSrcIdList: string[],
  isFinalTask: boolean
): Task {
  const task: Task = {
    kind: 'Task',
    taskId,
    name: data.label || `CONCAT-${taskId.slice(0, 8)}`,
    taskSrcIdList: taskSrcIdList.length > 0 ? taskSrcIdList : undefined,
    isFinalTask,
    serviceType: 0,
    computeType: 'CONCAT',
    implementation: 'SOFTWARE',
    dataProviderList: buildDataProviderList(data.inputProviders),
    participantList: [{
      participantId: data.participantId,
      entityName: data.participantId
    }],
    resultConsumerList: buildResultConsumerList(data.outputs)
  }

  return task
}

/**
 * 获取依赖任务ID列表
 */
function getDependencyTaskIds(
  taskId: string,
  edges: Edge[],
  allTaskNodes: Node[]
): string[] {
  const taskIds = new Set(allTaskNodes.map(n => n.id))
  const dependencies: string[] = []

  edges.forEach(edge => {
    // 找到以当前任务为目标的边
    if (edge.target === taskId) {
      const sourceNode = allTaskNodes.find(n => n.id === edge.source)
      if (sourceNode && taskIds.has(edge.source)) {
        dependencies.push(edge.source)
      }
    }
  })

  return dependencies
}

/**
 * 检查是否为最终任务
 */
function checkIsFinalTask(
  taskId: string,
  edges: Edge[],
  allTaskNodes: Node[],
  data: ComputeTaskNodeData | LocalTaskNodeData
): boolean {
  // 如果有输出配置，则是最终任务
  if (data.outputs && data.outputs.length > 0) {
    return true
  }

  // 如果没有下游任务，则是最终任务
  const taskIds = new Set(allTaskNodes.map(n => n.id))
  const hasDownstream = edges.some(edge =>
    edge.source === taskId && taskIds.has(edge.target)
  )

  return !hasDownstream
}

/**
 * 计算类型映射
 * taskType + techPath -> ComputeType
 */
function getComputeType(
  taskType: string,
  techPath: string
): ComputeType {
  const mapping: Record<string, Record<string, ComputeType>> = {
    'PSI': { 'software': 'PSI', 'tee': 'TEE_PSI' },
    'PIR': { 'software': 'PIR', 'tee': 'TEE_PIR' },
    'MPC': { 'software': 'MPC', 'tee': 'TEE_MPC' },
    'CONCAT': { 'software': 'CONCAT', 'tee': 'CONCAT' }
  }

  return mapping[taskType]?.[techPath] || 'MPC'
}

/**
 * 构建数据提供者列表
 */
function buildDataProviderList(inputProviders: InputProvider[]): DataProvider[] {
  if (!inputProviders || inputProviders.length === 0) {
    return []
  }

  // 按参与方分组
  const grouped = new Map<string, InputProvider[]>()

  inputProviders.forEach(provider => {
    const pid = provider.participantId
    if (!grouped.has(pid)) {
      grouped.set(pid, [])
    }
    grouped.get(pid)!.push(provider)
  })

  return Array.from(grouped.entries()).map(([pid, providers]) => {
    const datasetList: DatasetItem[] = providers.map(p => ({
      singleRow: false,
      dataset: p.dataset,
      columnNameList: p.fields.map(f => f.columnName),
      columnAliasList: p.fields.map(f => f.columnAlias || f.columnName),
      columnTypeList: p.fields.map(f => f.columnType),
      customParam: {}
    }))

    return {
      participantId: pid,
      entityName: pid,
      datasetList
    }
  })
}

/**
 * 构建Join条件列表
 */
function buildJoinConditionList(
  joinConditions: NodeJoinCondition[]
): JoinCondition[] {
  const result: JoinCondition[] = joinConditions.map(jc => ({
    joinType: jc.joinType,
    joinOperands: jc.operands.map(op => ({
      participantId: op.participantId,
      entityName: op.participantId,
      dataset: op.dataset,
      columnNameList: op.columnNames
    }))
  }))
  return result
}

/**
 * 构建表达式列表
 */
function buildExpressionList(expression: string): Expression[] {
  return [{
    expressionParamList: null,
    expression
  }]
}

/**
 * 构建算力提供者列表
 */
function buildComputeProviderList(
  computeProviders: ComputeResourceConfig[]
): ComputeProvider[] {
  // 按参与方分组
  const grouped = new Map<string, ComputeResourceConfig[]>()

  computeProviders.forEach(provider => {
    const pid = provider.participantId
    if (!grouped.has(pid)) {
      grouped.set(pid, [])
    }
    grouped.get(pid)!.push(provider)
  })

  return Array.from(grouped.entries()).map(([_pid, providers]) => {
    // 按组分组
    const groupMap = new Map<string, ComputeResourceConfig[]>()

    providers.forEach(p => {
      const gid = p.groupId
      if (!groupMap.has(gid)) {
        groupMap.set(gid, [])
      }
      groupMap.get(gid)!.push(p)
    })

    const computeNodeList: ComputeNode[] = Array.from(groupMap.entries()).map(([_gid, ps]) => {
      const first = ps[0]
      if (!first) return null

      const computeCardList: ComputeCard[] = ps.map(p => ({
        cardSerial: p.cardSerial,
        cardModel: p.cardModel,
        cardSpec: '', // 待补充
        cardVersion: '',
        cardType: 0
      }))

      return {
        nodeId: first.nodeId,
        nodeName: first.groupName,
        nodeAddress: '', // 待补充
        nodeType: 0,
        computeCardList
      }
    }).filter((n): n is ComputeNode => n !== null)

    const firstProvider = providers[0]
    if (!firstProvider) {
      return null
    }

    return {
      groupId: firstProvider.groupId,
      participantId: firstProvider.participantId,
      entityName: firstProvider.participantId,
      groupName: firstProvider.groupName,
      groupType: 0,
      computeNodeList
    }
  }).filter((p): p is ComputeProvider => p !== null)
}

/**
 * 构建模型提供者列表
 */
function buildModelProviderList(
  models: ComputeModelConfig[]
): ModelProvider[] {
  return models.map(model => {
    const paramList: ModelParameter[] = []

    // 转换参数 - 从节点模块的 ModelParameter 转换到导出模块的 ModelParameter
    model.parameters?.forEach(param => {
      const paramItem: ModelParameter = {
        participantId: model.participantId,
        entityName: model.participantId,
        dataset: '',
        columnNameList: [],
        columnAliasList: [],
        customParam: ''
      }

      if (param.bindingType === 'field') {
        paramItem.columnNameList = [param.fieldRef || '']
        paramItem.columnAliasList = [param.fieldRef || '']
        paramItem.customParam = param.name || ''
      } else {
        paramItem.customParam = param.fixedValue || param.name || ''
      }

      paramList.push(paramItem)
    })

    const result: ModelProvider = {
      modelId: model.id,
      participantId: model.participantId,
      entityName: model.participantId,
      name: model.name,
      type: model.type,
      version: '1.0.0',
      description: '',
      modelFileName: '',
      methodName: '',
      methodDescription: '',
      programmingLanguage: model.type === 'expression' ? 'Python' : 'Unknown',
      onChainContent: '',
      modelParameterList: paramList
    }
    return result
  })
}

/**
 * 构建结果消费者列表
 */
function buildResultConsumerList(
  outputs: OutputDataConfig[]
): ResultConsumer[] | undefined {
  if (!outputs || outputs.length === 0) {
    return undefined
  }

  return outputs.map(output => {
    const datasetList: DatasetItem[] = [{
      singleRow: false,
      dataset: output.dataset,
      columnNameList: output.outputFields.map(f => f.columnName),
      columnAliasList: output.outputFields.map(f => f.columnAlias || f.columnName),
      columnTypeList: output.outputFields.map(f => f.columnType),
      customParam: {}
    }]

    return {
      participantId: output.participantId,
      entityName: output.participantId,
      isEncrypted: false,
      encType: '',
      encKey: '',
      encKeyName: '',
      datasetList
    }
  })
}

/**
 * 提取任务参与方列表
 */
function extractTaskParticipants(
  data: ComputeTaskNodeData
): Participant[] {
  const participants = new Set<string>()

  data.inputProviders?.forEach(p => participants.add(p.participantId))
  data.models?.forEach(m => participants.add(m.participantId))
  data.computeProviders?.forEach(p => participants.add(p.participantId))
  data.outputs?.forEach(o => participants.add(o.participantId))

  return Array.from(participants).map(pid => ({
    participantId: pid,
    entityName: pid
  }))
}

/**
 * 生成作业ID
 */
function generateJobId(): string {
  return `job-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * 创建空导出（无任务时）
 */
function createEmptyExport(): ExportJson {
  return {
    jobId: generateJobId(),
    name: 'empty-job',
    description: '',
    status: 0,
    serviceType: 0,
    createParticipantId: '',
    modelType: 0,
    tlsEnable: false,
    assetDetailList: [],
    participantList: [],
    taskList: []
  }
}

/**
 * 创建空任务
 */
function createEmptyTask(taskId: string): Task {
  return {
    kind: 'Task',
    taskId,
    name: `Unknown-${taskId.slice(0, 8)}`,
    isFinalTask: false,
    serviceType: 0,
    computeType: 'MPC',
    implementation: 'SOFTWARE',
    dataProviderList: [],
    participantList: []
  }
}

/**
 * 验证导出配置完整性
 */
export function validateExportConfig(nodes: Node[], _edges: Edge[]): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  const taskNodes = nodes.filter(n => n.type === 'computeTask')

  if (taskNodes.length === 0) {
    errors.push('没有配置任何计算任务')
    return { valid: false, errors, warnings }
  }

  taskNodes.forEach(node => {
    const data = node.data as ComputeTaskNodeData

    // 检查输入数据
    if (!data.inputProviders || data.inputProviders.length === 0) {
      errors.push(`任务 "${data.label}" 缺少输入数据配置`)
    }

    // 检查join字段
    const hasJoinField = data.inputProviders?.some(p =>
      p.fields.some(f => f.isJoinField)
    )
    if (!hasJoinField) {
      warnings.push(`任务 "${data.label}" 未配置join字段`)
    }

    // 检查计算模型
    if (!data.models || data.models.length === 0) {
      if (!data.expression) {
        errors.push(`任务 "${data.label}" 缺少计算模型或表达式配置`)
      }
    }

    // 检查算力资源（TEE路径时必需）
    if (data.techPath === 'tee') {
      if (!data.computeProviders || data.computeProviders.length === 0) {
        errors.push(`任务 "${data.label}" 使用TEE技术路径但未配置算力资源`)
      }
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}
