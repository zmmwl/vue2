/**
 * 连线验证工具
 * 验证连线是否有效，包括循环依赖检测
 */

import type { Connection, Edge } from '@vue-flow/core'
import type { GraphNode } from '@vue-flow/core'
import type { NodeData, FLTaskNodeData } from '@/types/nodes'
import { NodeCategory } from '@/types/nodes'
import { FLTaskCategory, FLMode } from '@/types/fl-tasks'

/**
 * 验证连接是否有效
 *
 * @param connection - 连接对象
 * @param nodes - 源节点和目标节点
 * @returns 是否有效
 */
export function isValidConnection(
  connection: Connection,
  { sourceNode, targetNode }: { sourceNode: GraphNode; targetNode: GraphNode }
): boolean {
  // 不允许连接到同一个节点
  if (connection.source === connection.target) {
    return false
  }

  const sourceData = sourceNode.data as NodeData
  const targetData = targetNode.data as NodeData

  // 规则 1: 两个数据源节点不能直接连接
  if (sourceData.category === NodeCategory.DATA_SOURCE && targetData.category === NodeCategory.DATA_SOURCE) {
    return false
  }

  // 规则 2: 目标节点必须有输入 handle
  if (connection.targetHandle !== 'input' && connection.targetHandle !== 'right' && connection.targetHandle !== 'preload-input' && connection.targetHandle !== 'realtime-input') {
    return false
  }

  // 规则 3: 源节点必须有输出 handle
  if (connection.sourceHandle !== 'output' && connection.sourceHandle !== 'left') {
    return false
  }

  // 规则 4: FL 任务节点连接验证
  if (targetNode.type === 'fl_task') {
    const flTaskData = targetData as FLTaskNodeData

    // 数据源只能连接到数据源输入（不是模型/算力输入）
    if (sourceData.category === NodeCategory.DATA_SOURCE) {
      // 对于推断任务，必须先选择已部署模型
      if (flTaskData.flMode === FLMode.INFERENCE && !flTaskData.deployedModelId) {
        return false
      }
    }
  }

  // 规则 5: 验证 FL 任务是否需要更多输入
  if (targetNode.type === 'fl_task') {
    const flTaskData = targetData as FLTaskNodeData

    // 预处理任务只接受一个数据源
    if (flTaskData.flCategory === FLTaskCategory.PREPROCESS) {
      // 这里不检查连接数量，由 FlowCanvas 处理
      // 但可以添加其他验证逻辑
    }
  }

  return true
}

/**
 * 获取 FL 任务的最大输入数量
 * 根据任务类别返回允许的最大数据源连接数
 */
export function getFLTaskMaxInputs(category: FLTaskCategory, mode: FLMode): number {
  // 预处理任务只接受一个数据源
  if (category === FLTaskCategory.PREPROCESS) {
    return 1
  }

  // 特征工程和模型训练可以接受多个数据源
  if (mode === FLMode.TRAINING) {
    // 特征工程和模型训练：最多4个参与方
    if (category === FLTaskCategory.FEATURE_ENGINEERING ||
        category === FLTaskCategory.HORIZONTAL_MODEL ||
        category === FLTaskCategory.VERTICAL_MODEL) {
      return 4
    }
  }

  // 推断模式：参与方数量由已部署模型决定
  if (mode === FLMode.INFERENCE) {
    // 这里返回一个较高的值，实际限制由已部署模型的参与方数量决定
    return 10
  }

  // 默认无限制
  return Infinity
}

/**
 * 验证 FL 任务是否可以接受更多数据源输入
 */
export function canFLTaskAcceptMoreInputs(
  node: GraphNode,
  currentInputCount: number
): boolean {
  if (node.type !== 'fl_task') return true

  const flTaskData = node.data as FLTaskNodeData
  const maxInputs = getFLTaskMaxInputs(flTaskData.flCategory, flTaskData.flMode)

  // 对于推断任务，需要检查已部署模型的参与方数量
  if (flTaskData.flMode === FLMode.INFERENCE && flTaskData.trainingParticipants) {
    return currentInputCount < flTaskData.trainingParticipants.length
  }

  return currentInputCount < maxInputs
}

/**
 * 检测添加新连线是否会形成循环依赖
 *
 * @param newConnection - 新连接
 * @param existingEdges - 已存在的连线列表
 * @returns 是否会形成循环
 */
export function hasCycle(
  newConnection: Connection,
  existingEdges: Edge[]
): boolean {
  // 构建邻接表
  const adjList = new Map<string, string[]>()

  // 添加现有连线
  existingEdges.forEach(edge => {
    if (!adjList.has(edge.source)) {
      adjList.set(edge.source, [])
    }
    adjList.get(edge.source)!.push(edge.target)
  })

  // 添加新连线
  if (!adjList.has(newConnection.source!)) {
    adjList.set(newConnection.source!, [])
  }
  adjList.get(newConnection.source!)!.push(newConnection.target!)

  // DFS 检测环
  const visited = new Set<string>()
  const recursionStack = new Set<string>()

  function dfs(node: string): boolean {
    visited.add(node)
    recursionStack.add(node)

    const neighbors = adjList.get(node) || []
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) {
          return true
        }
      } else if (recursionStack.has(neighbor)) {
        // 找到环
        return true
      }
    }

    recursionStack.delete(node)
    return false
  }

  // 对所有节点进行 DFS
  const allNodes = new Set([
    ...Array.from(adjList.keys()),
    ...Array.from(adjList.values()).flat()
  ])

  for (const node of allNodes) {
    if (!visited.has(node)) {
      if (dfs(node)) {
        return true
      }
    }
  }

  return false
}

/**
 * 验证连线是否会导致重复连接
 *
 * @param connection - 新连接
 * @param existingEdges - 已存在的连线列表
 * @returns 是否重复
 */
export function isDuplicateConnection(
  connection: Connection,
  existingEdges: Edge[]
): boolean {
  return existingEdges.some(edge =>
    edge.source === connection.source &&
    edge.target === connection.target &&
    edge.sourceHandle === connection.sourceHandle &&
    edge.targetHandle === connection.targetHandle
  )
}

/**
 * 验证节点是否可以接受更多输入
 *
 * @param nodeId - 节点 ID
 * @param edges - 连线列表
 * @param maxInputs - 最大输入数量（默认无限制）
 * @returns 是否可以接受更多输入
 */
export function canAcceptMoreInputs(
  nodeId: string,
  edges: Edge[],
  maxInputs?: number
): boolean {
  const inputCount = edges.filter(edge => edge.target === nodeId).length
  return maxInputs === undefined || inputCount < maxInputs
}
