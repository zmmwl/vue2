import type { NodeTemplate } from '@/types/nodes'
import { NodeCategory, ComputeTaskType, DataSourceType, LocalTaskType } from '@/types/nodes'

// 数据源节点模板
export const DATA_SOURCE_TEMPLATES: NodeTemplate[] = [
  {
    type: 'data_source',
    label: '数据库表',
    category: NodeCategory.DATA_SOURCE,
    sourceType: DataSourceType.DATABASE,
    icon: '🗄️',
    color: '#52C41A',
    description: '关系型数据库表'
  },
  {
    type: 'data_source',
    label: 'CSV 文件',
    category: NodeCategory.DATA_SOURCE,
    sourceType: DataSourceType.FILE,
    icon: '📄',
    color: '#52C41A',
    description: '逗号分隔值文件'
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
  }
]

// 本地任务节点模板（新增）
export const LOCAL_TASK_TEMPLATES: NodeTemplate[] = [
  {
    type: 'local_query',
    label: '本地Query',
    category: NodeCategory.LOCAL_TASK,
    computeType: LocalTaskType.LOCAL_QUERY,
    icon: '🔎',
    color: '#13C2C2',
    description: '本地 SQL 查询计算'
  }
]

// 计算模型节点模板
export const MODEL_TEMPLATES: NodeTemplate[] = [
  {
    type: 'model',
    label: '表达式模型',
    category: 'model' as any,
    icon: '📝',
    color: '#722ED1',
    description: 'Python表达式模型'
  },
  {
    type: 'model',
    label: 'CodeBin模型',
    category: 'model' as any,
    icon: '📦',
    color: '#13C2C2',
    description: 'CodeBin系列模型（含V2/V3.1/V3.2）',
    isCodeBin: true  // 标记为 CodeBin 模型，需要进一步选择类型
  },
  {
    type: 'model',
    label: 'SPDZ模型',
    category: 'model' as any,
    icon: '🔐',
    color: '#13C2C2',
    description: 'SPDZ协议模型'
  },
  {
    type: 'model',
    label: '分组统计',
    category: 'model' as any,
    icon: '📊',
    color: '#13C2C2',
    description: '分组统计聚合（GROUP BY）',
    modelType: 'GROUP_STAT'
  }
]

// 算力资源节点模板
export const RESOURCE_TEMPLATES: NodeTemplate[] = [
  {
    type: 'computeResource',
    label: 'TEE算力',
    category: 'computeResource' as any,
    icon: '⚡',
    color: '#FA8C16',
    description: '可信执行环境算力'
  }
]
