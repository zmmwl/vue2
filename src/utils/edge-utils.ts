import type { Connection, Edge } from '@vue-flow/core'
import type { CustomEdge } from '@/types/edges'

/**
 * 创建唯一的连接线
 * 确保每条连接线都有独立的 ID，不合并
 * @param connection 连接信息
 * @param existingEdges 现有连接线列表
 * @param sourceCategory 源节点类型（用于决定连线路径类型）
 */
export const createUniqueEdge = (
  connection: Connection,
  existingEdges: Edge[],
  sourceCategory?: string
): CustomEdge => {
  // 检查是否已存在完全相同的连接
  const exists = existingEdges.some(
    edge =>
      edge.source === connection.source &&
      edge.target === connection.target &&
      edge.sourceHandle === connection.sourceHandle &&
      edge.targetHandle === connection.targetHandle
  )

  // 判断是否使用虚线样式（模型和算力资源使用虚线、无箭头）
  const isDashedLine = sourceCategory === 'model' || sourceCategory === 'computeResource'

  const edgeData = sourceCategory ? {
    sourceCategory,
    isDashed: isDashedLine,
    noArrow: isDashedLine
  } : undefined

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
      data: edgeData
    } as CustomEdge
  }

  // 创建新连接
  return {
    ...connection,
    id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'default',
    animated: false,
    data: edgeData
  } as CustomEdge
}
