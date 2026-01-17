import type { Edge } from '@vue-flow/core'

// 连接线数据接口
export interface EdgeData {
  label?: string
  condition?: string
}

// 自定义连接线类型
export interface CustomEdge extends Omit<Edge, 'data'> {
  data?: EdgeData
}
