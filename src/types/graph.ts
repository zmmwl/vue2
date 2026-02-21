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
  category: NodeCategory | string  // 允许字符串以支持自定义category
  taskType?: string
  computeType?: string  // 本地任务类型（用于 LOCAL_TASK 类别）
  sourceType?: string
  icon: string
  color: string
  description?: string
  type: string
  modelType?: string  // 模型类型（用于模型节点）
  participantId?: string  // 参与方ID（用于算力资源配置）
  flTask?: {  // FL 任务信息（用于联邦学习任务）
    taskName: string
    taskDisplayName: string
    category: string
    mode: string
  }
}

// 流程验证结果
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}
