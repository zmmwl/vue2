import type { Node, NodeProps } from '@vue-flow/core'

// 节点类别枚举
export enum NodeCategory {
  DATA_SOURCE = 'data_source',
  COMPUTE_TASK = 'compute_task'
}

// 计算任务类型枚举
export enum ComputeTaskType {
  PSI = 'PSI',    // Private Set Intersection - 隐私集合求交
  PIR = 'PIR',    // Private Information Retrieval - 隐私信息检索
  MPC = 'MPC',    // Secure Multi-Party Computation - 多方安全计算
  FL = 'FL'       // Federated Learning - 联邦学习
}

// 数据源类型枚举
export enum DataSourceType {
  DATABASE = 'database',  // 数据库
  FILE = 'file',          // 文件
  API = 'api'             // API 接口
}

// 附着端点接口
export interface AttachmentEndpoint {
  id: string
  label?: string
}

// 节点数据接口
export interface NodeData {
  label: string
  category: NodeCategory
  taskType?: ComputeTaskType
  sourceType?: DataSourceType
  icon?: string
  color: string
  description?: string
  status?: 'idle' | 'running' | 'success' | 'error'
  config?: Record<string, any>
  // 任务节点的附着端点列表（用于连接数据源）
  attachmentEndpoints?: AttachmentEndpoint[]
}

// 数据源节点类型
export interface DataSourceNode extends Node {
  type: 'data_source'
  data: NodeData & {
    category: NodeCategory.DATA_SOURCE
    sourceType: DataSourceType
  }
}

// 计算任务节点类型
export interface ComputeTaskNode extends Node {
  type: 'compute_task'
  data: NodeData & {
    category: NodeCategory.COMPUTE_TASK
    taskType: ComputeTaskType
  }
}

// 节点模板类型
export interface NodeTemplate {
  type: string
  label: string
  category: NodeCategory
  taskType?: ComputeTaskType
  sourceType?: DataSourceType
  icon: string
  color: string
  description?: string
}
