/**
 * DAG 导出转换逻辑
 * 将画布中的节点和连线转换为标准 JSON 格式
 */

import type { Node, Edge } from '@vue-flow/core'
import type { ComputeTaskNodeData, OutputDataNodeData, LocalTaskNodeData } from '@/types/nodes'
import type { ExportJson, Task, Participant, DataProvider, JoinCondition, ModelProvider, ComputeProvider, ResultConsumer, Expression, ComputeType, TechPath } from '@/types/export'
import { ComputeTaskType, TechPath as NodeTechPath } from '@/types/nodes'

// ========== 主转换函数 ==========

/**
 * 将 DAG 图转换为 JSON 格式
 *
 * @param nodes - 节点列表
 * @param edges - 连线列表
 * @returns 导出的 JSON 对象
 */
export function convertDagToJson(nodes: Node[], edges: Edge[]): ExportJson {
  // 1. 生成 jobId
  const jobId = generateJobId()

  // 2. 提取所有计算任务节点和本地任务节点
  const taskNodes = nodes.filter(node =>
    node.type === 'compute_task' || node.type === 'localTask'
  ) as Array<Node<ComputeTaskNodeData | LocalTaskNodeData>>

  // 3. 拓扑排序确定任务执行顺序
  const sortedTasks = topologicalSort(taskNodes, edges)

  // 4. 提取参与方
  const participantList = extractParticipants(nodes)

  // 5. 构建任务列表
  const taskList = sortedTasks.map(taskNode => buildTask(taskNode, edges, nodes))

  return {
    jobId,
    participantList,
    taskList
  }
}

// ========== 辅助转换函数 ==========

/**
 * 生成唯一 jobId
 */
export function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * 拓扑排序确定任务执行顺序
 *
 * @param taskNodes - 任务节点列表
 * @param edges - 连线列表
 * @returns 拓扑排序后的任务节点列表
 */
export function topologicalSort(
  taskNodes: Array<Node<ComputeTaskNodeData | LocalTaskNodeData>>,
  edges: Edge[]
): Array<Node<ComputeTaskNodeData | LocalTaskNodeData>> {
  // 构建依赖图
  const inDegree = new Map<string, number>()
  const adjList = new Map<string, string[]>()

  // 初始化
  taskNodes.forEach(node => {
    inDegree.set(node.id, 0)
    adjList.set(node.id, [])
  })

  // 构建邻接表和入度
  edges.forEach(edge => {
    const targetNode = taskNodes.find(n => n.id === edge.target)

    // 只有当目标节点是任务节点时，才建立依赖关系
    if (targetNode) {
      // 检查源节点是否是其他任务节点的输出
      const sourceIsOutput = taskNodes.some(n =>
        n.data?.outputs?.some(o => o.outputNodeId === edge.source)
      )

      if (sourceIsOutput) {
        // 找到源任务节点
        const sourceTask = taskNodes.find(n =>
          n.data?.outputs?.some(o => o.outputNodeId === edge.source)
        )
        if (sourceTask) {
          adjList.get(sourceTask.id)?.push(edge.target)
          inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1)
        }
      }
    }
  })

  // Kahn 算法
  const queue: string[] = []
  const result: Array<Node<ComputeTaskNodeData | LocalTaskNodeData>> = []

  // 找到所有入度为0的节点
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) {
      queue.push(nodeId)
    }
  })

  while (queue.length > 0) {
    const nodeId = queue.shift()!
    const node = taskNodes.find(n => n.id === nodeId)
    if (node) {
      result.push(node)
    }

    // 减少邻接节点的入度
    adjList.get(nodeId)?.forEach(neighborId => {
      const newDegree = (inDegree.get(neighborId) || 0) - 1
      inDegree.set(neighborId, newDegree)
      if (newDegree === 0) {
        queue.push(neighborId)
      }
    })
  }

  // 如果存在循环依赖，返回原始顺序
  if (result.length !== taskNodes.length) {
    console.warn('检测到循环依赖，使用原始顺序')
    return taskNodes
  }

  return result
}

/**
 * 提取参与方列表
 *
 * @param nodes - 节点列表
 * @returns 参与方列表
 */
export function extractParticipants(nodes: Node[]): Participant[] {
  const participants = new Map<string, Participant>()

  nodes.forEach(node => {
    const data = node.data as any

    // 从输入提供者中提取
    if (data.inputProviders) {
      data.inputProviders.forEach((provider: any) => {
        if (!participants.has(provider.participantId)) {
          participants.set(provider.participantId, {
            participantId: provider.participantId,
            entityName: provider.participantId // 简化处理，实际应从企业信息获取
          })
        }
      })
    }

    // 从模型中提取
    if (data.models) {
      data.models.forEach((model: any) => {
        if (!participants.has(model.participantId)) {
          participants.set(model.participantId, {
            participantId: model.participantId,
            entityName: model.participantId
          })
        }
      })
    }

    // 从算力中提取
    if (data.computeProviders) {
      data.computeProviders.forEach((compute: any) => {
        if (!participants.has(compute.participantId)) {
          participants.set(compute.participantId, {
            participantId: compute.participantId,
            entityName: compute.participantId
          })
        }
      })
    }

    // 从输出中提取
    if (data.outputs) {
      data.outputs.forEach((output: any) => {
        if (!participants.has(output.participantId)) {
          participants.set(output.participantId, {
            participantId: output.participantId,
            entityName: output.participantId
          })
        }
      })
    }

    // 本地任务的 participantId
    if (data.participantId) {
      if (!participants.has(data.participantId)) {
        participants.set(data.participantId, {
          participantId: data.participantId,
          entityName: data.participantId
        })
      }
    }
  })

  return Array.from(participants.values())
}

/**
 * 构建任务依赖 ID 列表
 *
 * @param taskId - 任务 ID
 * @param edges - 连线列表
 * @param nodes - 节点列表
 * @returns 依赖任务 ID 列表
 */
export function getDependencyIds(taskId: string, edges: Edge[], nodes: Node[]): string[] {
  const dependencies: string[] = []

  edges.forEach(edge => {
    if (edge.target === taskId) {
      // 找到连接到这个任务的源节点
      const sourceNode = nodes.find(n => n.id === edge.source)
      if (sourceNode && (sourceNode.type === 'compute_task' || sourceNode.type === 'localTask')) {
        dependencies.push(sourceNode.id)
      } else {
        // 源节点可能是输出节点，找到父任务
        const sourceData = sourceNode?.data as OutputDataNodeData
        if (sourceData?.parentTaskId) {
          dependencies.push(sourceData.parentTaskId)
        }
      }
    }
  })

  return dependencies
}

/**
 * 构建数据提供者列表
 *
 * @param inputProviders - 输入提供者配置
 * @returns 数据提供者列表
 */
export function buildDataProviderList(inputProviders: any[]): DataProvider[] {
  return inputProviders.map(provider => ({
    participantId: provider.participantId,
    assetId: provider.dataset, // 简化处理，使用 dataset 作为 assetId
    fieldList: provider.fields.map((field: any) => ({
      fieldName: field.columnAlias || field.columnName,
      alias: field.columnAlias !== field.columnName ? field.columnAlias : undefined
    }))
  }))
}

/**
 * 构建 Join 条件列表
 *
 * @param joinConditions - Join 条件配置
 * @returns Join 条件列表
 */
export function buildJoinConditions(joinConditions: any[]): JoinCondition[] {
  if (!joinConditions) return []

  return joinConditions.map(condition => ({
    participantIdList: condition.operands.map((op: any) => op.participantId),
    joinFieldList: condition.operands.flatMap((op: any) => op.columnNames)
  }))
}

/**
 * 构建模型提供者列表
 *
 * @param models - 模型配置列表
 * @returns 模型提供者列表
 */
export function buildModelProviderList(models: any[]): ModelProvider[] {
  if (!models) return []

  return models
    .filter(model => model.type !== 'expression') // 表达式类型单独处理
    .map(model => ({
      participantId: model.participantId,
      modelId: model.id,
      paramList: model.parameters?.map((param: any) => ({
        name: param.name,
        value: param.bindingType === 'field' ? (param.fieldRef || '') : (param.fixedValue || ''),
        type: param.bindingType
      })) || []
    }))
}

/**
 * 构建表达式列表
 *
 * @param models - 模型配置列表
 * @returns 表达式列表
 */
export function buildExpressionList(models: any[]): Expression[] {
  if (!models) return []

  const expressionModel = models.find(m => m.type === 'expression')
  if (!expressionModel) return []

  return [{
    participantId: expressionModel.participantId,
    expression: expressionModel.expression || ''
  }]
}

/**
 * 构建算力提供者列表
 *
 * @param computeProviders - 算力资源配置列表
 * @returns 算力提供者列表
 */
export function buildComputeProviderList(computeProviders: any[]): ComputeProvider[] {
  if (!computeProviders) return []

  return computeProviders.map(compute => ({
    participantId: compute.participantId,
    resourceId: compute.id
  }))
}

/**
 * 构建结果消费者列表
 *
 * @param outputs - 输出配置列表
 * @returns 结果消费者列表
 */
export function buildResultConsumerList(outputs: any[]): ResultConsumer[] {
  if (!outputs) return []

  return outputs.map(output => ({
    participantId: output.participantId,
    fieldList: output.outputFields.map((field: any) => ({
      fieldName: field.columnAlias || field.columnName,
      alias: field.columnAlias !== field.columnName ? field.columnAlias : undefined
    }))
  }))
}

/**
 * 将 computeType 和 techPath 组合映射到最终的计算类型
 *
 * @param computeType - 计算类型
 * @param techPath - 技术路径
 * @returns 最终计算类型
 */
export function mapComputeType(computeType: string, techPath?: string): ComputeType {
  if (techPath === NodeTechPath.TEE) {
    switch (computeType) {
      case ComputeTaskType.PSI:
        return 'TEE_PSI' as ComputeType
      case ComputeTaskType.PIR:
        return 'TEE_PIR' as ComputeType
      case ComputeTaskType.MPC:
        return 'TEE_MPC' as ComputeType
      default:
        return computeType as ComputeType
    }
  }
  return computeType as ComputeType
}

/**
 * 构建完整任务
 *
 * @param taskNode - 任务节点
 * @param edges - 连线列表
 * @param nodes - 节点列表
 * @returns 任务对象
 */
export function buildTask(
  taskNode: Node<ComputeTaskNodeData | LocalTaskNodeData>,
  edges: Edge[],
  nodes: Node[]
): Task {
  const data = taskNode.data as any

  // 确定计算类型
  const computeType = data.computeType === 'CONCAT'
    ? ('CONCAT' as ComputeType)
    : mapComputeType(data.taskType || data.computeType, data.techPath)

  // 获取依赖任务 ID
  const taskSrcIdList = getDependencyIds(taskNode.id, edges, nodes)

  // 判断是否为最终任务（有输出或没有下游任务）
  const hasOutputs = data.outputs && data.outputs.length > 0
  const hasDownstream = edges.some(e => {
    const sourceIsOutput = data.outputs?.some((o: any) => o.outputNodeId === e.source)
    return sourceIsOutput
  })
  const isFinalTask = hasOutputs && !hasDownstream

  return {
    taskId: taskNode.id,
    computeType,
    techPath: data.techPath === NodeTechPath.TEE ? ('TEE' as TechPath) : ('SOFTWARE_CRYPTO' as TechPath),
    taskSrcIdList: taskSrcIdList.length > 0 ? taskSrcIdList : undefined,
    dataProviderList: buildDataProviderList(data.inputProviders || []),
    joinConditionList: buildJoinConditions(data.joinConditions || []),
    modelProviderList: buildModelProviderList(data.models || []),
    expressionList: buildExpressionList(data.models || []),
    computeProviderList: buildComputeProviderList(data.computeProviders || []),
    resultConsumerList: buildResultConsumerList(data.outputs || []),
    isFinalTask: isFinalTask || data.computeType === 'CONCAT'
  }
}
