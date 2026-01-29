import type { Node, Edge } from '@vue-flow/core'
import type { NodeData, NodeCategory } from './nodes'

// 流程图数据接口
export interface FlowGraphData {
  nodes: Node<NodeData>[]
  edges: Edge[]
}

// 拖拽事件数据
export interface DroppedNodeData {
  label: string
  category: NodeCategory
  taskType?: string
  sourceType?: string
  modelType?: string  // 模型类型（用于计算模型节点）
  resourceType?: string  // 资源类型（用于算力资源节点）
  localTaskType?: string  // 本地任务类型
  icon: string
  color: string
  description?: string
  type: string
}

// 流程验证结果
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}
