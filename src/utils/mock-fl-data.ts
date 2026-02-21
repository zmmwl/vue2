/**
 * 联邦学习任务 Mock 数据
 * 包含已部署模型、参数模板等
 */

import type { DeployedModel } from '@/types/nodes'
import type { FLTaskParameterTemplate } from '@/types/fl-tasks'
import {
  FLParameterDataType,
  FLTaskCategory,
  FLMode
} from '@/types/fl-tasks'

// ========== 已部署模型 Mock 数据 ==========

export const DEPLOYED_MODELS: DeployedModel[] = [
  {
    modelId: 'model_001',
    modelName: '用户信用评分模型-v1',
    modelType: 'horizontal',
    participants: ['ent_001', 'ent_002'],
    createdAt: '2026-02-01'
  },
  {
    modelId: 'model_002',
    modelName: '欺诈检测模型-v2',
    modelType: 'vertical',
    participants: ['ent_001', 'ent_003'],
    createdAt: '2026-02-10'
  },
  {
    modelId: 'model_003',
    modelName: '客户分群模型-v1',
    modelType: 'horizontal',
    participants: ['ent_002', 'ent_003', 'ent_004'],
    createdAt: '2026-02-15'
  },
  {
    modelId: 'model_004',
    modelName: '推荐排序模型-v3',
    modelType: 'vertical',
    participants: ['ent_001', 'ent_002'],
    createdAt: '2026-02-18'
  }
]

// 兼容旧名称
export const MOCK_DEPLOYED_MODELS = DEPLOYED_MODELS

// ========== 预处理任务参数模板 ==========

export const PREPROCESS_TEMPLATES: FLTaskParameterTemplate[] = [
  {
    taskName: 'data_cleaning',
    displayName: '数据清洗',
    category: FLTaskCategory.PREPROCESS,
    mode: FLMode.TRAINING,
    icon: '🧹',
    description: '处理缺失值和异常值',
    parameters: [
      {
        name: 'missingValueStrategy',
        displayName: '缺失值处理策略',
        dataType: FLParameterDataType.SELECT,
        required: true,
        defaultValue: 'delete',
        options: [
          { value: 'delete', label: '删除' },
          { value: 'mean', label: '均值填充' },
          { value: 'median', label: '中位数填充' },
          { value: 'constant', label: '常数填充' }
        ]
      },
      {
        name: 'fillConstant',
        displayName: '填充常数值',
        dataType: FLParameterDataType.NUMBER,
        required: false,
        placeholder: '当策略为常数填充时必填'
      },
      {
        name: 'outlierMethod',
        displayName: '异常值处理',
        dataType: FLParameterDataType.SELECT,
        required: false,
        defaultValue: 'none',
        options: [
          { value: 'none', label: '不处理' },
          { value: 'delete', label: '删除' },
          { value: 'clip', label: '替换为边界值' }
        ]
      },
      {
        name: 'outlierThreshold',
        displayName: '异常值阈值(σ)',
        dataType: FLParameterDataType.NUMBER,
        required: false,
        defaultValue: 3,
        min: 1,
        max: 10
      }
    ]
  },
  {
    taskName: 'format_conversion',
    displayName: '格式转换',
    category: FLTaskCategory.PREPROCESS,
    mode: FLMode.TRAINING,
    icon: '🔄',
    description: '日期格式转换和类别编码',
    parameters: [
      {
        name: 'dateFormat',
        displayName: '日期目标格式',
        dataType: FLParameterDataType.TEXT,
        required: false,
        defaultValue: 'YYYY-MM-DD',
        placeholder: '如 YYYY-MM-DD'
      },
      {
        name: 'encodingMethod',
        displayName: '类别编码方式',
        dataType: FLParameterDataType.SELECT,
        required: false,
        defaultValue: 'label',
        options: [
          { value: 'label', label: 'LabelEncoding' },
          { value: 'onehot', label: 'OneHot' }
        ]
      }
    ]
  },
  {
    taskName: 'id_normalization',
    displayName: 'ID标准化',
    category: FLTaskCategory.PREPROCESS,
    mode: FLMode.TRAINING,
    icon: '🔢',
    description: 'ID格式标准化处理',
    parameters: [
      {
        name: 'idFormat',
        displayName: 'ID格式',
        dataType: FLParameterDataType.SELECT,
        required: true,
        defaultValue: 'phone',
        options: [
          { value: 'phone', label: '手机号11位' },
          { value: 'idcard', label: '身份证18位' },
          { value: 'custom', label: '自定义' }
        ]
      }
    ]
  }
]

// ========== 特征工程任务参数模板 ==========

export const FEATURE_ENGINEERING_TEMPLATES: FLTaskParameterTemplate[] = [
  {
    taskName: 'psi_alignment',
    displayName: '样本对齐(PSI)',
    category: FLTaskCategory.FEATURE_ENGINEERING,
    mode: FLMode.TRAINING,
    icon: '🔗',
    description: '隐私集合求交，对齐样本ID',
    parameters: [
      {
        name: 'hashAlgorithm',
        displayName: '哈希算法',
        dataType: FLParameterDataType.SELECT,
        required: true,
        defaultValue: 'SHA256',
        options: [
          { value: 'SHA256', label: 'SHA256' },
          { value: 'MD5', label: 'MD5' },
          { value: 'SM3', label: 'SM3' }
        ]
      },
      {
        name: 'saltEnabled',
        displayName: '启用加盐',
        dataType: FLParameterDataType.BOOLEAN,
        required: false,
        defaultValue: false
      },
      {
        name: 'saltValue',
        displayName: '盐值',
        dataType: FLParameterDataType.TEXT,
        required: false,
        placeholder: '加盐时必填'
      }
    ]
  },
  {
    taskName: 'feature_selection',
    displayName: '特征选择',
    category: FLTaskCategory.FEATURE_ENGINEERING,
    mode: FLMode.TRAINING,
    icon: '📊',
    description: '基于IV值/相关系数选择特征',
    parameters: [
      {
        name: 'selectionMethod',
        displayName: '选择方法',
        dataType: FLParameterDataType.SELECT,
        required: true,
        defaultValue: 'iv',
        options: [
          { value: 'iv', label: 'IV值' },
          { value: 'correlation', label: '相关系数' },
          { value: 'model', label: '模型重要性' }
        ]
      },
      {
        name: 'topK',
        displayName: '保留特征数',
        dataType: FLParameterDataType.NUMBER,
        required: false,
        defaultValue: 10,
        min: 1,
        max: 100
      },
      {
        name: 'threshold',
        displayName: '阈值筛选',
        dataType: FLParameterDataType.NUMBER,
        required: false,
        min: 0,
        max: 1,
        step: 0.01
      }
    ]
  },
  {
    taskName: 'feature_cross',
    displayName: '特征交叉',
    category: FLTaskCategory.FEATURE_ENGINEERING,
    mode: FLMode.TRAINING,
    icon: '✖️',
    description: '特征交叉组合',
    parameters: [
      {
        name: 'crossFeatures',
        displayName: '交叉特征对',
        dataType: FLParameterDataType.MULTISELECT,
        required: true,
        options: [] // 动态填充
      },
      {
        name: 'crossMethod',
        displayName: '交叉方式',
        dataType: FLParameterDataType.SELECT,
        required: true,
        defaultValue: 'multiply',
        options: [
          { value: 'multiply', label: '乘法' },
          { value: 'add', label: '加法' },
          { value: 'concat', label: '组合' }
        ]
      }
    ]
  },
  {
    taskName: 'normalization',
    displayName: '归一化',
    category: FLTaskCategory.FEATURE_ENGINEERING,
    mode: FLMode.TRAINING,
    icon: '📏',
    description: '特征归一化处理',
    parameters: [
      {
        name: 'normalizeMethod',
        displayName: '归一化方法',
        dataType: FLParameterDataType.SELECT,
        required: true,
        defaultValue: 'minmax',
        options: [
          { value: 'minmax', label: 'Min-Max' },
          { value: 'zscore', label: 'Z-Score' }
        ]
      },
      {
        name: 'useGlobalStats',
        displayName: '使用全局统计量',
        dataType: FLParameterDataType.BOOLEAN,
        required: true,
        defaultValue: true
      }
    ]
  }
]

// ========== 横向模型任务参数模板 ==========

export const HORIZONTAL_MODEL_TEMPLATES: FLTaskParameterTemplate[] = [
  {
    taskName: 'logistic_regression',
    displayName: '逻辑回归',
    category: FLTaskCategory.HORIZONTAL_MODEL,
    mode: FLMode.TRAINING,
    icon: '📈',
    description: '横向联邦逻辑回归',
    parameters: [
      {
        name: 'learningRate',
        displayName: '学习率',
        dataType: FLParameterDataType.NUMBER,
        required: true,
        defaultValue: 0.01,
        min: 0.0001,
        max: 1,
        step: 0.001
      },
      {
        name: 'iterations',
        displayName: '迭代次数',
        dataType: FLParameterDataType.NUMBER,
        required: true,
        defaultValue: 100,
        min: 1,
        max: 10000
      },
      {
        name: 'batchSize',
        displayName: '批次大小',
        dataType: FLParameterDataType.NUMBER,
        required: false,
        defaultValue: 32,
        min: 1
      },
      {
        name: 'regularization',
        displayName: '正则化',
        dataType: FLParameterDataType.SELECT,
        required: false,
        defaultValue: 'none',
        options: [
          { value: 'none', label: '无' },
          { value: 'l1', label: 'L1' },
          { value: 'l2', label: 'L2' }
        ]
      },
      {
        name: 'regParam',
        displayName: '正则化系数',
        dataType: FLParameterDataType.NUMBER,
        required: false,
        defaultValue: 0.01,
        min: 0
      }
    ]
  },
  {
    taskName: 'xgboost',
    displayName: 'XGBoost',
    category: FLTaskCategory.HORIZONTAL_MODEL,
    mode: FLMode.TRAINING,
    icon: '🌳',
    description: '横向联邦XGBoost',
    parameters: [
      {
        name: 'numTrees',
        displayName: '树的数量',
        dataType: FLParameterDataType.NUMBER,
        required: true,
        defaultValue: 100,
        min: 1,
        max: 1000
      },
      {
        name: 'maxDepth',
        displayName: '最大深度',
        dataType: FLParameterDataType.NUMBER,
        required: true,
        defaultValue: 6,
        min: 1,
        max: 32
      },
      {
        name: 'learningRate',
        displayName: '学习率',
        dataType: FLParameterDataType.NUMBER,
        required: true,
        defaultValue: 0.1,
        min: 0.0001,
        max: 1
      },
      {
        name: 'minChildWeight',
        displayName: '最小子节点权重',
        dataType: FLParameterDataType.NUMBER,
        required: false,
        defaultValue: 1,
        min: 0
      },
      {
        name: 'subsample',
        displayName: '采样比例',
        dataType: FLParameterDataType.NUMBER,
        required: false,
        defaultValue: 0.8,
        min: 0.1,
        max: 1,
        step: 0.1
      }
    ]
  },
  {
    taskName: 'cnn',
    displayName: 'CNN',
    category: FLTaskCategory.HORIZONTAL_MODEL,
    mode: FLMode.TRAINING,
    icon: '🖼️',
    description: '横向联邦卷积神经网络',
    parameters: [
      {
        name: 'layers',
        displayName: '网络层配置',
        dataType: FLParameterDataType.ARRAY,
        required: true,
        defaultValue: []
      },
      {
        name: 'optimizer',
        displayName: '优化器',
        dataType: FLParameterDataType.SELECT,
        required: true,
        defaultValue: 'adam',
        options: [
          { value: 'sgd', label: 'SGD' },
          { value: 'adam', label: 'Adam' },
          { value: 'rmsprop', label: 'RMSprop' }
        ]
      },
      {
        name: 'learningRate',
        displayName: '学习率',
        dataType: FLParameterDataType.NUMBER,
        required: true,
        defaultValue: 0.001,
        min: 0.00001,
        max: 1
      },
      {
        name: 'epochs',
        displayName: '训练轮数',
        dataType: FLParameterDataType.NUMBER,
        required: true,
        defaultValue: 10,
        min: 1,
        max: 1000
      }
    ]
  },
  {
    taskName: 'transformer',
    displayName: 'Transformer',
    category: FLTaskCategory.HORIZONTAL_MODEL,
    mode: FLMode.TRAINING,
    icon: '🤖',
    description: '横向联邦Transformer',
    parameters: [
      {
        name: 'dModel',
        displayName: '模型维度',
        dataType: FLParameterDataType.NUMBER,
        required: true,
        defaultValue: 512,
        min: 64,
        max: 2048
      },
      {
        name: 'numHeads',
        displayName: '注意力头数',
        dataType: FLParameterDataType.NUMBER,
        required: true,
        defaultValue: 8,
        min: 1,
        max: 32
      },
      {
        name: 'numLayers',
        displayName: '编码器层数',
        dataType: FLParameterDataType.NUMBER,
        required: true,
        defaultValue: 6,
        min: 1,
        max: 24
      },
      {
        name: 'dFF',
        displayName: '前馈网络维度',
        dataType: FLParameterDataType.NUMBER,
        required: false,
        defaultValue: 2048,
        min: 64
      }
    ]
  }
]

// ========== 纵向模型任务参数模板 ==========

export const VERTICAL_MODEL_TEMPLATES: FLTaskParameterTemplate[] = [
  {
    taskName: 'ss_lr',
    displayName: 'SS-LR',
    category: FLTaskCategory.VERTICAL_MODEL,
    mode: FLMode.TRAINING,
    icon: '🔐',
    description: '纵向安全逻辑回归',
    parameters: [
      {
        name: 'learningRate',
        displayName: '学习率',
        dataType: FLParameterDataType.NUMBER,
        required: true,
        defaultValue: 0.01,
        min: 0.0001,
        max: 1
      },
      {
        name: 'iterations',
        displayName: '迭代次数',
        dataType: FLParameterDataType.NUMBER,
        required: true,
        defaultValue: 100,
        min: 1,
        max: 10000
      },
      {
        name: 'encryptionMethod',
        displayName: '加密方式',
        dataType: FLParameterDataType.SELECT,
        required: true,
        defaultValue: 'paillier',
        options: [
          { value: 'paillier', label: 'Paillier' },
          { value: 'ckks', label: 'CKKS' }
        ]
      },
      {
        name: 'batchSize',
        displayName: '批次大小',
        dataType: FLParameterDataType.NUMBER,
        required: false,
        defaultValue: 32,
        min: 1
      }
    ]
  },
  {
    taskName: 'secureboost',
    displayName: 'SecureBoost',
    category: FLTaskCategory.VERTICAL_MODEL,
    mode: FLMode.TRAINING,
    icon: '🔒',
    description: '纵向联邦SecureBoost',
    parameters: [
      {
        name: 'numTrees',
        displayName: '树的数量',
        dataType: FLParameterDataType.NUMBER,
        required: true,
        defaultValue: 100,
        min: 1,
        max: 1000
      },
      {
        name: 'maxDepth',
        displayName: '最大深度',
        dataType: FLParameterDataType.NUMBER,
        required: true,
        defaultValue: 6,
        min: 1,
        max: 32
      },
      {
        name: 'learningRate',
        displayName: '学习率',
        dataType: FLParameterDataType.NUMBER,
        required: true,
        defaultValue: 0.1,
        min: 0.0001,
        max: 1
      },
      {
        name: 'secureMethod',
        displayName: '安全方法',
        dataType: FLParameterDataType.SELECT,
        required: true,
        defaultValue: 'he',
        options: [
          { value: 'he', label: '同态加密' },
          { value: 'ss', label: '秘密分享' }
        ]
      },
      {
        name: 'minSampleSplit',
        displayName: '分裂最小样本数',
        dataType: FLParameterDataType.NUMBER,
        required: false,
        defaultValue: 2,
        min: 2
      }
    ]
  },
  {
    taskName: 'fm',
    displayName: 'FM',
    category: FLTaskCategory.VERTICAL_MODEL,
    mode: FLMode.TRAINING,
    icon: '🎯',
    description: '纵向联邦因子分解机',
    parameters: [
      {
        name: 'factorDim',
        displayName: '隐向量维度',
        dataType: FLParameterDataType.NUMBER,
        required: true,
        defaultValue: 10,
        min: 1,
        max: 100
      },
      {
        name: 'learningRate',
        displayName: '学习率',
        dataType: FLParameterDataType.NUMBER,
        required: true,
        defaultValue: 0.01,
        min: 0.0001,
        max: 1
      },
      {
        name: 'regularization',
        displayName: '正则化类型',
        dataType: FLParameterDataType.SELECT,
        required: false,
        defaultValue: 'l2',
        options: [
          { value: 'none', label: '无' },
          { value: 'l1', label: 'L1' },
          { value: 'l2', label: 'L2' }
        ]
      }
    ]
  },
  {
    taskName: 'split_learning',
    displayName: '拆分学习',
    category: FLTaskCategory.VERTICAL_MODEL,
    mode: FLMode.TRAINING,
    icon: '🔀',
    description: '纵向拆分学习',
    parameters: [
      {
        name: 'splitPoint',
        displayName: '网络分割点',
        dataType: FLParameterDataType.NUMBER,
        required: true,
        defaultValue: 2,
        min: 1
      },
      {
        name: 'epochs',
        displayName: '训练轮数',
        dataType: FLParameterDataType.NUMBER,
        required: true,
        defaultValue: 10,
        min: 1,
        max: 1000
      },
      {
        name: 'batchSize',
        displayName: '批次大小',
        dataType: FLParameterDataType.NUMBER,
        required: true,
        defaultValue: 32,
        min: 1
      },
      {
        name: 'gradientCompression',
        displayName: '梯度压缩',
        dataType: FLParameterDataType.BOOLEAN,
        required: false,
        defaultValue: false
      }
    ]
  }
]

// ========== 获取所有参数模板 ==========

export function getAllParameterTemplates(): FLTaskParameterTemplate[] {
  return [
    ...PREPROCESS_TEMPLATES,
    ...FEATURE_ENGINEERING_TEMPLATES,
    ...HORIZONTAL_MODEL_TEMPLATES,
    ...VERTICAL_MODEL_TEMPLATES
  ]
}

// ========== 根据 taskName 获取参数模板 ==========

export function getParameterTemplateByTaskName(taskName: string): FLTaskParameterTemplate | undefined {
  return getAllParameterTemplates().find(t => t.taskName === taskName)
}

// ========== 模拟 API 调用 ==========

/** 获取已部署模型列表 */
export async function fetchDeployedModels(): Promise<DeployedModel[]> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500))
  return MOCK_DEPLOYED_MODELS
}

/** 获取任务参数模板 */
export async function fetchTaskParameterTemplate(taskName: string): Promise<FLTaskParameterTemplate | null> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 300))
  return getParameterTemplateByTaskName(taskName) || null
}

/** 获取任务的参数定义列表 */
export function getParametersForTask(taskName: string): import('@/types/fl-tasks').FLTaskParameterDef[] {
  const template = getParameterTemplateByTaskName(taskName)
  if (!template) return []
  return template.parameters || []
}
