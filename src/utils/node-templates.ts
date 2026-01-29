import type { NodeTemplate } from '@/types/nodes'
import { NodeCategory, ComputeTaskType, DataSourceType } from '@/types/nodes'

/**
 * DAG 任务编排系统节点模板
 * 用于拖拽创建新节点
 */

// 侧边栏分类项（用于非拖拽场景）
export interface SidebarCategory {
  id: string
  label: string
  icon?: string
  items: SidebarItem[]
}

// 侧边栏项（用于拖拽场景）
export interface SidebarItem {
  id: string
  label: string
  type: string
  disabled?: boolean
  taskType?: ComputeTaskType
  icon?: string
  color?: string
  description?: string
}

// 数据源节点模板
export const DATA_SOURCE_TEMPLATES: NodeTemplate[] = [
  {
    type: 'data_source',
    label: 'MySQL 数据库',
    category: NodeCategory.DATA_SOURCE,
    sourceType: DataSourceType.DATABASE,
    icon: '🗄️',
    color: '#52C41A',
    description: '关系型数据库'
  },
  {
    type: 'data_source',
    label: 'PostgreSQL',
    category: NodeCategory.DATA_SOURCE,
    sourceType: DataSourceType.DATABASE,
    icon: '🐘',
    color: '#52C41A',
    description: '开源关系型数据库'
  },
  {
    type: 'data_source',
    label: 'CSV 文件',
    category: NodeCategory.DATA_SOURCE,
    sourceType: DataSourceType.FILE,
    icon: '📄',
    color: '#52C41A',
    description: '逗号分隔值文件'
  },
  {
    type: 'data_source',
    label: 'Excel 文件',
    category: NodeCategory.DATA_SOURCE,
    sourceType: DataSourceType.FILE,
    icon: '📊',
    color: '#52C41A',
    description: 'Excel 电子表格'
  },
  {
    type: 'data_source',
    label: 'REST API',
    category: NodeCategory.DATA_SOURCE,
    sourceType: DataSourceType.API,
    icon: '🌐',
    color: '#52C41A',
    description: 'RESTful API 接口'
  },
  {
    type: 'data_source',
    label: 'GraphQL',
    category: NodeCategory.DATA_SOURCE,
    sourceType: DataSourceType.API,
    icon: '◈',
    color: '#52C41A',
    description: 'GraphQL 查询接口'
  }
]

// 计算任务节点模板
export const COMPUTE_TASK_TEMPLATES: NodeTemplate[] = [
  {
    type: 'compute_task',
    label: 'PSI 计算',
    category: NodeCategory.COMPUTE_TASK,
    taskType: ComputeTaskType.PSI,
    icon: '🔐',
    color: '#1890FF',
    description: '隐私集合求交'
  },
  {
    type: 'compute_task',
    label: 'PIR 查询',
    category: NodeCategory.COMPUTE_TASK,
    taskType: ComputeTaskType.PIR,
    icon: '🔍',
    color: '#722ED1',
    description: '隐私信息检索'
  },
  {
    type: 'compute_task',
    label: 'MPC 计算',
    category: NodeCategory.COMPUTE_TASK,
    taskType: ComputeTaskType.MPC,
    icon: '🧮',
    color: '#FA8C16',
    description: '多方安全计算'
  },
  {
    type: 'compute_task',
    label: '联邦学习',
    category: NodeCategory.COMPUTE_TASK,
    taskType: ComputeTaskType.FL,
    icon: '🤖',
    color: '#EB2F96',
    description: 'Federated Learning'
  },
  {
    type: 'compute_task',
    label: '同态加密',
    category: NodeCategory.COMPUTE_TASK,
    taskType: ComputeTaskType.MPC,
    icon: '🔒',
    color: '#13C2C2',
    description: 'Homomorphic Encryption'
  },
  {
    type: 'compute_task',
    label: '差分隐私',
    category: NodeCategory.COMPUTE_TASK,
    taskType: ComputeTaskType.MPC,
    icon: '🛡️',
    color: '#F5222D',
    description: 'Differential Privacy'
  }
]

// ========== DAG 任务编排系统侧边栏分类 ==========

/**
 * DAG 计算任务侧边栏分类
 * 符合 FR-001: 支持拖拽 PSI/PIR/MPC 计算任务到画布
 * 符合 FR-005: 联邦学习暂时置灰
 */
export const DAG_SIDEBAR_CATEGORIES: SidebarCategory[] = [
  {
    id: 'compute-tasks',
    label: '计算任务',
    items: [
      {
        id: 'psi',
        label: 'PSI计算',
        type: 'compute_task',
        taskType: ComputeTaskType.PSI,
        icon: '🔐',
        color: '#1890FF',
        description: '隐私集合求交',
        disabled: false
      },
      {
        id: 'pir',
        label: 'PIR查询',
        type: 'compute_task',
        taskType: ComputeTaskType.PIR,
        icon: '🔍',
        color: '#722ED1',
        description: '隐私信息检索',
        disabled: false
      },
      {
        id: 'mpc',
        label: 'MPC计算',
        type: 'compute_task',
        taskType: ComputeTaskType.MPC,
        icon: '🧮',
        color: '#FA8C16',
        description: '多方安全计算',
        disabled: false
      },
      {
        id: 'fl',
        label: '联邦学习',
        type: 'compute_task',
        taskType: ComputeTaskType.FL,
        icon: '🤖',
        color: '#EB2F96',
        description: 'Federated Learning',
        disabled: true // 置灰，暂不可用
      }
    ]
  },
  {
    id: 'compute-models',
    label: '计算模型',
    items: [
      {
        id: 'expr',
        label: 'MPC模型(表达式)',
        type: 'model',
        icon: '📝',
        color: '#13C2C2',
        description: 'Python表达式模型',
        disabled: false
      },
      {
        id: 'cbv2',
        label: 'MPC模型(CodeBin-V2)',
        type: 'model',
        icon: '📦',
        color: '#13C2C2',
        description: 'CodeBin V2版本',
        disabled: false
      },
      {
        id: 'cbv3-1',
        label: 'MPC模型(CodeBin-V3-1)',
        type: 'model',
        icon: '📦',
        color: '#13C2C2',
        description: 'CodeBin V3.1版本',
        disabled: false
      },
      {
        id: 'cbv3-2',
        label: 'MPC模型(CodeBin-V3-2)',
        type: 'model',
        icon: '📦',
        color: '#13C2C2',
        description: 'CodeBin V3.2版本',
        disabled: false
      },
      {
        id: 'spdz',
        label: 'MPC模型(SPDZ)',
        type: 'model',
        icon: '📦',
        color: '#13C2C2',
        description: 'SPDZ协议模型',
        disabled: false
      }
    ]
  },
  {
    id: 'compute-resources',
    label: '算力资源',
    items: [
      {
        id: 'tee',
        label: 'TEE板卡算力',
        type: 'compute_resource',
        icon: '🔧',
        color: '#FA8C16',
        description: '可信执行环境算力',
        disabled: false
      }
    ]
  },
  {
    id: 'local-tasks',
    label: '本地计算任务',
    items: [
      {
        id: 'concat',
        label: '本地结果处理任务',
        type: 'local_task',
        icon: '🔗',
        color: '#52C41A',
        description: 'CONCAT 数据合并',
        disabled: false
      },
      {
        id: 'query',
        label: '本地Query任务',
        type: 'local_task',
        icon: '📋',
        color: '#8C8C8C',
        description: '本地查询任务',
        disabled: true // 置灰，暂不可用
      }
    ]
  }
]

/**
 * 技术路径映射表
 * 符合 FR-003: 选择技术路径后锁定不可更改
 */
export const TECH_PATH_MAPPING: Record<ComputeTaskType, { software: string; tee: string }> = {
  [ComputeTaskType.PSI]: { software: 'PSI', tee: 'TEE_PSI' },
  [ComputeTaskType.PIR]: { software: 'PIR', tee: 'TEE_PIR' },
  [ComputeTaskType.MPC]: { software: 'MPC', tee: 'TEE_MPC' },
  [ComputeTaskType.FL]: { software: 'FL', tee: 'TEE_FL' }
}

/**
 * 根据任务类型和技术路径获取最终计算类型
 */
export function getComputeType(taskType: ComputeTaskType, techPath: 'software' | 'tee'): string {
  return TECH_PATH_MAPPING[taskType]?.[techPath] || taskType
}
