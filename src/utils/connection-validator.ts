/**
 * 连线验证工具
 * 验证连线是否有效，包括循环依赖检测
 */

import type { Connection, Edge } from '@vue-flow/core'
import type { GraphNode } from '@vue-flow/core'
import type { NodeData } from '@/types/nodes'
import { NodeCategory } from '@/types/nodes'

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
  if (connection.targetHandle !== 'input' && connection.targetHandle !== 'right') {
    return false
  }

  // 规则 3: 源节点必须有输出 handle
  if (connection.sourceHandle !== 'output' && connection.sourceHandle !== 'left') {
    return false
  }

  // 规则 4: 阻止连线到不支持类型的节点（如联邦学习）
  // 这将在后续实现中根据实际需求添加

  return true
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
