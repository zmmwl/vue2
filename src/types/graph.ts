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
