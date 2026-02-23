/**
 * 连线验证工具
 * 验证连线是否有效
 */

import type { Connection } from '@vue-flow/core'
import type { GraphNode } from '@vue-flow/core'
import type { NodeData, FLTaskNodeData } from '@/types/nodes'
import { NodeCategory } from '@/types/nodes'
import { FLMode } from '@/types/fl-tasks'

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

  return true
}
