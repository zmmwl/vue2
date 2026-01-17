import type { Connection, Edge } from '@vue-flow/core'
import type { CustomEdge } from '@/types/edges'

/**
 * 创建唯一的连接线
 * 确保每条连接线都有独立的 ID，不合并
 */
export const createUniqueEdge = (
  connection: Connection,
  existingEdges: Edge[]
): CustomEdge => {
  // 检查是否已存在完全相同的连接
  const exists = existingEdges.some(
    edge =>
      edge.source === connection.source &&
      edge.target === connection.target &&
      edge.sourceHandle === connection.sourceHandle &&
      edge.targetHandle === connection.targetHandle
  )

  if (exists && connection.sourceHandle && connection.targetHandle) {
    // 如果连接点已被使用，为当前连接创建新的 handle ID
    const sourceEdges = existingEdges.filter(e => e.source === connection.source)
    const targetEdges = existingEdges.filter(e => e.target === connection.target)

    const sourceIndex = sourceEdges.length + 1
    const targetIndex = targetEdges.length + 1

    return {
      ...connection,
      id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sourceHandle: `${connection.source}-output-${sourceIndex}`,
      targetHandle: `${connection.target}-input-${targetIndex}`,
      type: 'default',
      animated: false,
      style: {
        stroke: '#D9D9D9',
        strokeWidth: 2
      },
      markerEnd: {
        type: 'arrowclosed',
        color: '#D9D9D9'
      }
    } as CustomEdge
  }

  // 创建新连接
  return {
    ...connection,
    id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'default',
    animated: false,
    style: {
      stroke: '#D9D9D9',
      strokeWidth: 2
    },
    markerEnd: {
      type: 'arrowclosed',
      color: '#D9D9D9'
    }
  } as CustomEdge
}

/**
 * 生成连接点 ID
 * @param nodeId 节点 ID
 * @param type 连接点类型 (source/target)
 * @param index 索引
 */
export const generateHandleId = (
  nodeId: string,
  type: 'source' | 'target',
  index: number
): string => {
  return `${nodeId}-${type}-${index}`
}

/**
 * 获取节点的下一个可用连接点索引
 * @param nodeId 节点 ID
 * @param type 连接点类型
 * @param existingEdges 现有连接线列表
 */
export const getNextHandleIndex = (
  nodeId: string,
  type: 'source' | 'target',
  existingEdges: Edge[]
): number => {
  const connectedEdges = existingEdges.filter(
    edge => type === 'source' ? edge.source === nodeId : edge.target === nodeId
  )
  return connectedEdges.length + 1
}

/**
 * 验证连接是否有效
 * @param connection 连接对象
 * @param existingEdges 现有连接线列表
 */
export const isValidConnection = (
  connection: Connection,
  existingEdges: Edge[]
): boolean => {
  // 不允许自连接
  if (connection.source === connection.target) {
    return false
  }

  // 检查是否已存在完全相同的连接
  const exists = existingEdges.some(
    edge =>
      edge.source === connection.source &&
      edge.target === connection.target &&
      edge.sourceHandle === connection.sourceHandle &&
      edge.targetHandle === connection.targetHandle
  )

  return !exists
}
