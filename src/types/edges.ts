import type { Edge } from '@vue-flow/core'

// 连接线数据接口
export interface EdgeData {
  label?: string
  condition?: string
  // 源节点颜色（用于渐变）
  sourceColor?: string
  // 目标节点颜色（用于渐变）
  targetColor?: string
  // 源节点类型（用于决定连线路径类型）
  sourceCategory?: string
}

// 自定义连接线类型
export interface CustomEdge extends Omit<Edge, 'data'> {
  data?: EdgeData
}
