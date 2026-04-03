/**
 * 联邦学习任务 Mock 数据
 * 包含已部署模型、参数模板等
 *
 * 执行类型说明：
 * - LOCAL: 单方本地任务，只能连接1个数据源，不显示"添加输出"按钮
 * - DYNAMIC: 动态任务，根据连接数量自动判定类型（1=LOCAL, 2+=MULTI_PARTY）
 * - MULTI_PARTY: 多方隐私任务，必须连接2+数据源，显示"添加输出"按钮
 */

import type { DeployedModel } from '@/types/nodes'
import type { FLTaskParameterTemplate, FLTaskSubType } from '@/types/fl-tasks'
import {
  FLParameterDataType,
  FLTaskCategory,
  FLMode,
  FLTaskExecutionType
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
  // ========== 数据清洗 - 单方本地任务 ==========
  {
    taskName: 'data_cleaning',
    displayName: '数据清洗',
    category: FLTaskCategory.PREPROCESS,
    mode: FLMode.TRAINING,
    icon: '🧹',
    description: '处理缺失值、异常值等问题',
    executionType: FLTaskExecutionType.LOCAL,
    subTypes: [
      {
        value: 'missing_value',
        label: '缺失值处理',
        description: '处理数据中的缺失值',
        parameters: [
          {
            name: 'strategy',
            displayName: '处理策略',
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
            name: 'fillValue',
            displayName: '填充值',
            dataType: FLParameterDataType.NUMBER,
            required: false,
            defaultValue: 0,
            placeholder: '当策略为常数填充时必填',
            showWhen: { param: 'strategy', value: 'constant' }
          },
          {
            name: 'columns',
            displayName: '处理列',
            dataType: FLParameterDataType.MULTISELECT,
            required: false,
            options: [],
            placeholder: '留空则处理所有列'
          }
        ]
      },
      {
        value: 'outlier',
        label: '异常值处理',
        description: '检测并处理异常值',
        parameters: [
          {
            name: 'method',
            displayName: '检测方法',
            dataType: FLParameterDataType.SELECT,
            required: true,
            defaultValue: 'zscore',
            options: [
              { value: 'zscore', label: '3σ原则' },
              { value: 'iqr', label: 'IQR(四分位距)' }
            ]
          },
          {
            name: 'action',
            displayName: '处理方式',
            dataType: FLParameterDataType.SELECT,
            required: true,
            defaultValue: 'delete',
            options: [
              { value: 'delete', label: '删除' },
              { value: 'clip', label: '替换为边界值' }
            ]
          },
          {
            name: 'threshold',
            displayName: '阈值',
            dataType: FLParameterDataType.NUMBER,
            required: false,
            defaultValue: 3,
            min: 1,
            max: 10,
            description: 'Z-Score阈值（仅zscore方法）'
          },
          {
            name: 'columns',
            displayName: '处理列',
            dataType: FLParameterDataType.MULTISELECT,
            required: false,
            options: []
          }
        ]
      },
      {
        value: 'dedup',
        label: '样本去重',
        description: '去除重复样本',
        parameters: [
          {
            name: 'subset',
            displayName: '去重依据列',
            dataType: FLParameterDataType.MULTISELECT,
            required: false,
            options: [],
            placeholder: '留空则全列去重'
          },
          {
            name: 'keep',
            displayName: '保留策略',
            dataType: FLParameterDataType.SELECT,
            required: true,
            defaultValue: 'first',
            options: [
              { value: 'first', label: '保留第一条' },
              { value: 'last', label: '保留最后一条' },
              { value: 'none', label: '删除全部' }
            ]
          }
        ]
      },
      {
        value: 'type_convert',
        label: '类型转换',
        description: '转换列数据类型',
        parameters: [
          {
            name: 'column',
            displayName: '目标列',
            dataType: FLParameterDataType.SELECT,
            required: true,
            options: []
          },
          {
            name: 'targetType',
            displayName: '目标类型',
            dataType: FLParameterDataType.SELECT,
            required: true,
            defaultValue: 'string',
            options: [
              { value: 'int', label: '整数' },
              { value: 'float', label: '浮点数' },
              { value: 'string', label: '字符串' },
              { value: 'bool', label: '布尔值' },
              { value: 'datetime', label: '日期时间' }
            ]
          },
          {
            name: 'format',
            displayName: '日期格式',
            dataType: FLParameterDataType.TEXT,
            required: false,
            defaultValue: '%Y-%m-%d',
            placeholder: '仅datetime类型',
            showWhen: { param: 'targetType', value: 'datetime' }
          }
        ]
      },
      {
        value: 'format_std',
        label: '格式标准化',
        description: '标准化文本格式',
        parameters: [
          {
            name: 'columns',
            displayName: '标准化列',
            dataType: FLParameterDataType.MULTISELECT,
            required: true,
            options: []
          },
          {
            name: 'trimWhitespace',
            displayName: '去除空白',
            dataType: FLParameterDataType.BOOLEAN,
            required: false,
            defaultValue: true
          },
          {
            name: 'lowercase',
            displayName: '转小写',
            dataType: FLParameterDataType.BOOLEAN,
            required: false,
            defaultValue: false
          },
          {
            name: 'uppercase',
            displayName: '转大写',
            dataType: FLParameterDataType.BOOLEAN,
            required: false,
            defaultValue: false
          }
        ]
      }
    ],
    parameters: []
  },
  // ========== 数据采样 - 动态任务 ==========
  {
    taskName: 'data_sampling',
    displayName: '数据采样',
    category: FLTaskCategory.PREPROCESS,
    mode: FLMode.TRAINING,
    icon: '📊',
    description: '数据采样处理',
    executionType: FLTaskExecutionType.DYNAMIC,
    joinTypesAllowed: ['INNER'],
    subTypes: [
      {
        value: 'random',
        label: '随机采样',
        parameters: [
          {
            name: 'ratio',
            displayName: '采样比例',
            dataType: FLParameterDataType.NUMBER,
            required: true,
            defaultValue: 0.8,
            min: 0.01,
            max: 1.0,
            step: 0.01
          },
          {
            name: 'randomState',
            displayName: '随机种子',
            dataType: FLParameterDataType.NUMBER,
            required: false,
            defaultValue: 42
          }
        ]
      },
      {
        value: 'stratified',
        label: '分层采样',
        parameters: [
          {
            name: 'stratifyColumn',
            displayName: '分层依据列',
            dataType: FLParameterDataType.SELECT,
            required: true,
            options: []
          },
          {
            name: 'ratio',
            displayName: '每层采样比例',
            dataType: FLParameterDataType.NUMBER,
            required: true,
            defaultValue: 0.8,
            min: 0.01,
            max: 1.0,
            step: 0.01
          },
          {
            name: 'randomState',
            displayName: '随机种子',
            dataType: FLParameterDataType.NUMBER,
            required: false,
            defaultValue: 42
          }
        ]
      },
      {
        value: 'proportion',
        label: '按比例采样',
        parameters: [
          {
            name: 'ratio',
            displayName: '采样比例',
            dataType: FLParameterDataType.NUMBER,
            required: true,
            defaultValue: 0.5,
            min: 0.01,
            max: 1.0,
            step: 0.01
          }
        ]
      },
      {
        value: 'count',
        label: '按数量采样',
        parameters: [
          {
            name: 'count',
            displayName: '采样数量',
            dataType: FLParameterDataType.NUMBER,
            required: true,
            defaultValue: 1000,
            min: 1,
            max: 1000000
          },
          {
            name: 'randomState',
            displayName: '随机种子',
            dataType: FLParameterDataType.NUMBER,
            required: false,
            defaultValue: 42
          }
        ]
      },
      {
        value: 'upsample',
        label: '上采样',
        parameters: [
          {
            name: 'targetColumn',
            displayName: '目标列',
            dataType: FLParameterDataType.SELECT,
            required: true,
            options: [],
            description: '少数类标签列'
          },
          {
            name: 'method',
            displayName: '上采样方法',
            dataType: FLParameterDataType.SELECT,
            required: true,
            defaultValue: 'oversample',
            options: [
              { value: 'oversample', label: '简单过采样' },
              { value: 'smote', label: 'SMOTE' }
            ]
          },
          {
            name: 'ratio',
            displayName: '目标比例',
            dataType: FLParameterDataType.NUMBER,
            required: true,
            defaultValue: 1.0,
            min: 0.1,
            max: 1.0,
            step: 0.1
          }
        ]
      }
    ],
    parameters: []
  }
]

// ========== 特征工程任务参数模板 ==========

export const FEATURE_ENGINEERING_TEMPLATES: FLTaskParameterTemplate[] = [
  // ========== 特征分箱 - 动态任务 ==========
  {
    taskName: 'feature_binning',
    displayName: '特征分箱',
    category: FLTaskCategory.FEATURE_ENGINEERING,
    mode: FLMode.TRAINING,
    icon: '📦',
    description: '特征离散化处理',
    executionType: FLTaskExecutionType.DYNAMIC,
    joinTypesAllowed: ['INNER'],
    subTypes: [
      {
        value: 'equal_freq_woe',
        label: '等频分箱(输出WOE/IV)',
        parameters: [
          {
            name: 'nBins',
            displayName: '分箱数量',
            dataType: FLParameterDataType.NUMBER,
            required: true,
            defaultValue: 10,
            min: 2,
            max: 100
          },
          {
            name: 'columns',
            displayName: '分箱列',
            dataType: FLParameterDataType.MULTISELECT,
            required: true,
            options: []
          },
          {
            name: 'outputWOE',
            displayName: '输出WOE值',
            dataType: FLParameterDataType.BOOLEAN,
            required: false,
            defaultValue: true
          },
          {
            name: 'outputIV',
            displayName: '输出IV值',
            dataType: FLParameterDataType.BOOLEAN,
            required: false,
            defaultValue: true
          },
          {
            name: 'labelColumn',
            displayName: '标签列',
            dataType: FLParameterDataType.SELECT,
            required: true,
            options: [],
            description: '计算WOE/IV必需'
          }
        ]
      },
      {
        value: 'equal_width_woe',
        label: '等宽分箱(输出WOE/IV)',
        parameters: [
          {
            name: 'nBins',
            displayName: '分箱数量',
            dataType: FLParameterDataType.NUMBER,
            required: true,
            defaultValue: 10,
            min: 2,
            max: 100
          },
          {
            name: 'columns',
            displayName: '分箱列',
            dataType: FLParameterDataType.MULTISELECT,
            required: true,
            options: []
          },
          {
            name: 'outputWOE',
            displayName: '输出WOE值',
            dataType: FLParameterDataType.BOOLEAN,
            required: false,
            defaultValue: true
          },
          {
            name: 'outputIV',
            displayName: '输出IV值',
            dataType: FLParameterDataType.BOOLEAN,
            required: false,
            defaultValue: true
          },
          {
            name: 'labelColumn',
            displayName: '标签列',
            dataType: FLParameterDataType.SELECT,
            required: true,
            options: []
          }
        ]
      }
    ],
    parameters: []
  },
  // ========== 特征编码 - 单方本地任务 ==========
  {
    taskName: 'feature_encoding',
    displayName: '特征编码',
    category: FLTaskCategory.FEATURE_ENGINEERING,
    mode: FLMode.TRAINING,
    icon: '🔤',
    description: '类别特征编码',
    executionType: FLTaskExecutionType.LOCAL,
    subTypes: [
      {
        value: 'onehot',
        label: '独热编码',
        parameters: [
          {
            name: 'columns',
            displayName: '编码列',
            dataType: FLParameterDataType.MULTISELECT,
            required: true,
            options: []
          },
          {
            name: 'dropFirst',
            displayName: '删除第一列',
            dataType: FLParameterDataType.BOOLEAN,
            required: false,
            defaultValue: false,
            description: '避免共线性'
          },
          {
            name: 'handleUnknown',
            displayName: '未知类别处理',
            dataType: FLParameterDataType.SELECT,
            required: false,
            defaultValue: 'ignore',
            options: [
              { value: 'ignore', label: '忽略' },
              { value: 'error', label: '报错' }
            ]
          }
        ]
      },
      {
        value: 'label',
        label: '标签编码',
        parameters: [
          {
            name: 'columns',
            displayName: '编码列',
            dataType: FLParameterDataType.MULTISELECT,
            required: true,
            options: []
          },
          {
            name: 'handleUnknown',
            displayName: '未知类别处理',
            dataType: FLParameterDataType.SELECT,
            required: false,
            defaultValue: 'ignore',
            options: [
              { value: 'ignore', label: '忽略' },
              { value: 'error', label: '报错' }
            ]
          }
        ]
      }
    ],
    parameters: []
  },
  // ========== 特征变换 - 单方本地任务 ==========
  {
    taskName: 'feature_transform',
    displayName: '特征变换',
    category: FLTaskCategory.FEATURE_ENGINEERING,
    mode: FLMode.TRAINING,
    icon: '🔄',
    description: '特征数学变换',
    executionType: FLTaskExecutionType.LOCAL,
    subTypes: [
      {
        value: 'log',
        label: '对数变换',
        parameters: [
          {
            name: 'columns',
            displayName: '变换列',
            dataType: FLParameterDataType.MULTISELECT,
            required: true,
            options: []
          },
          {
            name: 'base',
            displayName: '对数底数',
            dataType: FLParameterDataType.SELECT,
            required: false,
            defaultValue: 'e',
            options: [
              { value: 'e', label: 'e (自然对数)' },
              { value: '2', label: '2' },
              { value: '10', label: '10' }
            ]
          },
          {
            name: 'offset',
            displayName: '偏移量',
            dataType: FLParameterDataType.NUMBER,
            required: false,
            defaultValue: 1,
            min: 0,
            description: '避免 log(0)'
          }
        ]
      },
      {
        value: 'power',
        label: '幂变换',
        parameters: [
          {
            name: 'columns',
            displayName: '变换列',
            dataType: FLParameterDataType.MULTISELECT,
            required: true,
            options: []
          },
          {
            name: 'exponent',
            displayName: '指数',
            dataType: FLParameterDataType.NUMBER,
            required: false,
            defaultValue: 2,
            min: -10,
            max: 10
          },
          {
            name: 'boxCox',
            displayName: 'Box-Cox变换',
            dataType: FLParameterDataType.BOOLEAN,
            required: false,
            defaultValue: false
          }
        ]
      }
    ],
    parameters: []
  },
  // ========== 特征选择 - 动态任务 ==========
  {
    taskName: 'feature_selection',
    displayName: '特征选择',
    category: FLTaskCategory.FEATURE_ENGINEERING,
    mode: FLMode.TRAINING,
    icon: '📊',
    description: '基于IV值选择特征',
    executionType: FLTaskExecutionType.DYNAMIC,
    joinTypesAllowed: ['INNER'],
    subTypes: [
      {
        value: 'threshold',
        label: '基于阈值(iv)',
        parameters: [
          {
            name: 'threshold',
            displayName: 'IV阈值',
            dataType: FLParameterDataType.NUMBER,
            required: true,
            defaultValue: 0.1,
            min: 0,
            max: 1,
            step: 0.01
          },
          {
            name: 'labelColumn',
            displayName: '标签列',
            dataType: FLParameterDataType.SELECT,
            required: true,
            options: []
          }
        ]
      },
      {
        value: 'topK',
        label: 'topK(iv)',
        parameters: [
          {
            name: 'k',
            displayName: '保留特征数',
            dataType: FLParameterDataType.NUMBER,
            required: true,
            defaultValue: 10,
            min: 1,
            max: 1000
          },
          {
            name: 'labelColumn',
            displayName: '标签列',
            dataType: FLParameterDataType.SELECT,
            required: true,
            options: []
          }
        ]
      },
      {
        value: 'topPercentile',
        label: 'topPercentile(iv)',
        parameters: [
          {
            name: 'percentile',
            displayName: '保留百分比',
            dataType: FLParameterDataType.NUMBER,
            required: true,
            defaultValue: 20,
            min: 1,
            max: 100
          },
          {
            name: 'labelColumn',
            displayName: '标签列',
            dataType: FLParameterDataType.SELECT,
            required: true,
            options: []
          }
        ]
      }
    ],
    parameters: []
  },
  // ========== 特征缩放 - 单方本地任务 ==========
  {
    taskName: 'feature_scaling',
    displayName: '特征缩放',
    category: FLTaskCategory.FEATURE_ENGINEERING,
    mode: FLMode.TRAINING,
    icon: '📏',
    description: '特征归一化/标准化',
    executionType: FLTaskExecutionType.LOCAL,
    subTypes: [
      {
        value: 'minmax',
        label: '归一化(MinMax)',
        parameters: [
          {
            name: 'columns',
            displayName: '缩放列',
            dataType: FLParameterDataType.MULTISELECT,
            required: true,
            options: []
          },
          {
            name: 'minRange',
            displayName: '最小值',
            dataType: FLParameterDataType.NUMBER,
            required: false,
            defaultValue: 0
          },
          {
            name: 'maxRange',
            displayName: '最大值',
            dataType: FLParameterDataType.NUMBER,
            required: false,
            defaultValue: 1
          }
        ]
      },
      {
        value: 'zscore',
        label: '标准化(Z-Score)',
        parameters: [
          {
            name: 'columns',
            displayName: '缩放列',
            dataType: FLParameterDataType.MULTISELECT,
            required: true,
            options: []
          },
          {
            name: 'withMean',
            displayName: '中心化',
            dataType: FLParameterDataType.BOOLEAN,
            required: false,
            defaultValue: true
          },
          {
            name: 'withStd',
            displayName: '标准化',
            dataType: FLParameterDataType.BOOLEAN,
            required: false,
            defaultValue: true
          }
        ]
      }
    ],
    parameters: []
  },
  // ========== 特征相关性分析 - 动态任务 ==========
  {
    taskName: 'feature_correlation',
    displayName: '特征相关性分析',
    category: FLTaskCategory.FEATURE_ENGINEERING,
    mode: FLMode.TRAINING,
    icon: '📈',
    description: '分析特征相关性',
    executionType: FLTaskExecutionType.DYNAMIC,
    joinTypesAllowed: ['INNER'],
    subTypes: [
      {
        value: 'pearson',
        label: '皮尔逊相关系数',
        parameters: [
          {
            name: 'columns',
            displayName: '分析列',
            dataType: FLParameterDataType.MULTISELECT,
            required: false,
            options: [],
            placeholder: '留空则全列分析'
          },
          {
            name: 'threshold',
            displayName: '高相关性阈值',
            dataType: FLParameterDataType.NUMBER,
            required: false,
            defaultValue: 0.5,
            min: 0,
            max: 1,
            step: 0.01
          }
        ]
      },
      {
        value: 'vif',
        label: '方差膨胀因子(VIF)',
        parameters: [
          {
            name: 'columns',
            displayName: '分析列',
            dataType: FLParameterDataType.MULTISELECT,
            required: true,
            options: []
          },
          {
            name: 'threshold',
            displayName: '多重共线性阈值',
            dataType: FLParameterDataType.NUMBER,
            required: false,
            defaultValue: 10,
            min: 1,
            max: 100
          }
        ]
      }
    ],
    parameters: []
  },
  // ========== 样本对齐(PSI) - 多方隐私任务 ==========
  {
    taskName: 'psi_alignment',
    displayName: '样本对齐(PSI)',
    category: FLTaskCategory.FEATURE_ENGINEERING,
    mode: FLMode.TRAINING,
    icon: '🔗',
    description: '隐私集合求交，对齐样本ID',
    executionType: FLTaskExecutionType.MULTI_PARTY,
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
  }
]

// ========== 横向模型任务参数模板 ==========

export const HORIZONTAL_MODEL_TEMPLATES: FLTaskParameterTemplate[] = [
  {
    taskName: 'horizontal_logistic_regression',
    displayName: '横向逻辑回归',
    category: FLTaskCategory.HORIZONTAL_MODEL,
    mode: FLMode.TRAINING,
    icon: '📈',
    description: '横向联邦逻辑回归',
    executionType: FLTaskExecutionType.MULTI_PARTY,
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
        min: 1,
        max: 10000
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
        min: 0,
        max: 1
      },
      {
        name: 'earlyStop',
        displayName: '早停策略',
        dataType: FLParameterDataType.BOOLEAN,
        required: false,
        defaultValue: true
      },
      {
        name: 'tolerance',
        displayName: '收敛阈值',
        dataType: FLParameterDataType.NUMBER,
        required: false,
        defaultValue: 0.0001,
        min: 0,
        max: 0.1
      }
    ]
  },
  {
    taskName: 'horizontal_neural_network',
    displayName: '横向神经网络',
    category: FLTaskCategory.HORIZONTAL_MODEL,
    mode: FLMode.TRAINING,
    icon: '🧠',
    description: '横向联邦神经网络',
    executionType: FLTaskExecutionType.MULTI_PARTY,
    parameters: [
      {
        name: 'hiddenLayers',
        displayName: '隐藏层结构',
        dataType: FLParameterDataType.ARRAY,
        required: true,
        defaultValue: [64, 32],
        description: '如 [64, 32] 表示两个隐藏层'
      },
      {
        name: 'activation',
        displayName: '激活函数',
        dataType: FLParameterDataType.SELECT,
        required: true,
        defaultValue: 'relu',
        options: [
          { value: 'relu', label: 'ReLU' },
          { value: 'sigmoid', label: 'Sigmoid' },
          { value: 'tanh', label: 'Tanh' }
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
      },
      {
        name: 'batchSize',
        displayName: '批次大小',
        dataType: FLParameterDataType.NUMBER,
        required: false,
        defaultValue: 32,
        min: 1,
        max: 10000
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
        name: 'dropout',
        displayName: 'Dropout比例',
        dataType: FLParameterDataType.NUMBER,
        required: false,
        defaultValue: 0.5,
        min: 0,
        max: 0.9,
        step: 0.1
      }
    ]
  },
  {
    taskName: 'horizontal_xgboost',
    displayName: '横向XGBoost',
    category: FLTaskCategory.HORIZONTAL_MODEL,
    mode: FLMode.TRAINING,
    icon: '🌳',
    description: '横向联邦XGBoost',
    executionType: FLTaskExecutionType.MULTI_PARTY,
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
        min: 0,
        max: 100
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
      },
      {
        name: 'colSampleByTree',
        displayName: '列采样比例',
        dataType: FLParameterDataType.NUMBER,
        required: false,
        defaultValue: 0.8,
        min: 0.1,
        max: 1,
        step: 0.1
      },
      {
        name: 'lambda',
        displayName: 'L2正则化',
        dataType: FLParameterDataType.NUMBER,
        required: false,
        defaultValue: 1,
        min: 0,
        max: 100
      },
      {
        name: 'alpha',
        displayName: 'L1正则化',
        dataType: FLParameterDataType.NUMBER,
        required: false,
        defaultValue: 0,
        min: 0,
        max: 100
      }
    ]
  },
  {
    taskName: 'horizontal_kmeans',
    displayName: '横向KMeans',
    category: FLTaskCategory.HORIZONTAL_MODEL,
    mode: FLMode.TRAINING,
    icon: '🎯',
    description: '横向联邦KMeans聚类',
    executionType: FLTaskExecutionType.MULTI_PARTY,
    parameters: [
      {
        name: 'nClusters',
        displayName: '聚类数',
        dataType: FLParameterDataType.NUMBER,
        required: true,
        defaultValue: 3,
        min: 1,
        max: 1000
      },
      {
        name: 'maxIterations',
        displayName: '最大迭代次数',
        dataType: FLParameterDataType.NUMBER,
        required: false,
        defaultValue: 300,
        min: 1,
        max: 10000
      },
      {
        name: 'tol',
        displayName: '收敛阈值',
        dataType: FLParameterDataType.NUMBER,
        required: false,
        defaultValue: 0.0001,
        min: 0,
        max: 0.1
      },
      {
        name: 'initMethod',
        displayName: '初始化方法',
        dataType: FLParameterDataType.SELECT,
        required: false,
        defaultValue: 'k-means++',
        options: [
          { value: 'random', label: '随机' },
          { value: 'k-means++', label: 'K-Means++' }
        ]
      },
      {
        name: 'nInit',
        displayName: '初始化次数',
        dataType: FLParameterDataType.NUMBER,
        required: false,
        defaultValue: 10,
        min: 1,
        max: 100
      }
    ]
  },
  {
    taskName: 'horizontal_knn',
    displayName: '横向KNN',
    category: FLTaskCategory.HORIZONTAL_MODEL,
    mode: FLMode.TRAINING,
    icon: '📍',
    description: '横向联邦K近邻',
    executionType: FLTaskExecutionType.MULTI_PARTY,
    parameters: [
      {
        name: 'nNeighbors',
        displayName: '近邻数',
        dataType: FLParameterDataType.NUMBER,
        required: true,
        defaultValue: 5,
        min: 1,
        max: 100
      },
      {
        name: 'weights',
        displayName: '权重方式',
        dataType: FLParameterDataType.SELECT,
        required: false,
        defaultValue: 'uniform',
        options: [
          { value: 'uniform', label: '均匀' },
          { value: 'distance', label: '距离加权' }
        ]
      },
      {
        name: 'algorithm',
        displayName: '算法',
        dataType: FLParameterDataType.SELECT,
        required: false,
        defaultValue: 'auto',
        options: [
          { value: 'auto', label: '自动' },
          { value: 'ball_tree', label: 'Ball Tree' },
          { value: 'kd_tree', label: 'KD Tree' }
        ]
      },
      {
        name: 'metric',
        displayName: '距离度量',
        dataType: FLParameterDataType.SELECT,
        required: false,
        defaultValue: 'minkowski',
        options: [
          { value: 'euclidean', label: '欧氏距离' },
          { value: 'manhattan', label: '曼哈顿距离' },
          { value: 'minkowski', label: '闵可夫斯基距离' }
        ]
      },
      {
        name: 'p',
        displayName: 'Minkowski参数',
        dataType: FLParameterDataType.NUMBER,
        required: false,
        defaultValue: 2,
        min: 1,
        max: 10
      }
    ]
  }
]

// ========== 纵向模型任务参数模板 ==========

export const VERTICAL_MODEL_TEMPLATES: FLTaskParameterTemplate[] = [
  {
    taskName: 'vertical_ss_lr',
    displayName: '纵向逻辑回归(SS-LR)',
    category: FLTaskCategory.VERTICAL_MODEL,
    mode: FLMode.TRAINING,
    icon: '🔐',
    description: '纵向安全逻辑回归',
    executionType: FLTaskExecutionType.MULTI_PARTY,
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
        name: 'batchSize',
        displayName: '批次大小',
        dataType: FLParameterDataType.NUMBER,
        required: false,
        defaultValue: 32,
        min: 1,
        max: 10000
      },
      {
        name: 'encryptionMethod',
        displayName: '加密方法',
        dataType: FLParameterDataType.SELECT,
        required: true,
        defaultValue: 'paillier',
        options: [
          { value: 'paillier', label: 'Paillier' },
          { value: 'ckks', label: 'CKKS' }
        ]
      },
      {
        name: 'earlyStop',
        displayName: '早停策略',
        dataType: FLParameterDataType.BOOLEAN,
        required: false,
        defaultValue: true
      }
    ]
  },
  {
    taskName: 'vertical_linear_regression',
    displayName: '纵向线性回归',
    category: FLTaskCategory.VERTICAL_MODEL,
    mode: FLMode.TRAINING,
    icon: '📉',
    description: '纵向联邦线性回归',
    executionType: FLTaskExecutionType.MULTI_PARTY,
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
        name: 'batchSize',
        displayName: '批次大小',
        dataType: FLParameterDataType.NUMBER,
        required: false,
        defaultValue: 32,
        min: 1,
        max: 10000
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
      },
      {
        name: 'regParam',
        displayName: '正则化系数',
        dataType: FLParameterDataType.NUMBER,
        required: false,
        defaultValue: 0.01,
        min: 0,
        max: 1
      }
    ]
  },
  {
    taskName: 'vertical_neural_network',
    displayName: '纵向神经网络',
    category: FLTaskCategory.VERTICAL_MODEL,
    mode: FLMode.TRAINING,
    icon: '🔀',
    description: '纵向拆分学习神经网络',
    executionType: FLTaskExecutionType.MULTI_PARTY,
    parameters: [
      {
        name: 'splitPoint',
        displayName: '网络分割点',
        dataType: FLParameterDataType.NUMBER,
        required: true,
        defaultValue: 2,
        min: 1,
        max: 100
      },
      {
        name: 'hiddenLayers',
        displayName: '隐藏层结构',
        dataType: FLParameterDataType.ARRAY,
        required: true,
        defaultValue: [64, 32]
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
      },
      {
        name: 'batchSize',
        displayName: '批次大小',
        dataType: FLParameterDataType.NUMBER,
        required: false,
        defaultValue: 32,
        min: 1,
        max: 10000
      },
      {
        name: 'gradientCompression',
        displayName: '梯度压缩',
        dataType: FLParameterDataType.BOOLEAN,
        required: false,
        defaultValue: false
      }
    ]
  },
  {
    taskName: 'vertical_xgboost',
    displayName: '纵向XGBoost(SecureBoost)',
    category: FLTaskCategory.VERTICAL_MODEL,
    mode: FLMode.TRAINING,
    icon: '🔒',
    description: '纵向联邦SecureBoost',
    executionType: FLTaskExecutionType.MULTI_PARTY,
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
        min: 2,
        max: 1000
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
    taskName: 'vertical_deepfm',
    displayName: '纵向DeepFM',
    category: FLTaskCategory.VERTICAL_MODEL,
    mode: FLMode.TRAINING,
    icon: '🎯',
    description: '纵向联邦DeepFM',
    executionType: FLTaskExecutionType.MULTI_PARTY,
    parameters: [
      {
        name: 'embeddingSize',
        displayName: '嵌入维度',
        dataType: FLParameterDataType.NUMBER,
        required: true,
        defaultValue: 10,
        min: 1,
        max: 100
      },
      {
        name: 'hiddenLayers',
        displayName: '隐藏层结构',
        dataType: FLParameterDataType.ARRAY,
        required: true,
        defaultValue: [64, 32]
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
      },
      {
        name: 'batchSize',
        displayName: '批次大小',
        dataType: FLParameterDataType.NUMBER,
        required: false,
        defaultValue: 32,
        min: 1,
        max: 10000
      },
      {
        name: 'dropout',
        displayName: 'Dropout比例',
        dataType: FLParameterDataType.NUMBER,
        required: false,
        defaultValue: 0.5,
        min: 0,
        max: 0.9,
        step: 0.1
      }
    ]
  },
  {
    taskName: 'vertical_kmeans',
    displayName: '纵向KMeans',
    category: FLTaskCategory.VERTICAL_MODEL,
    mode: FLMode.TRAINING,
    icon: '🎯',
    description: '纵向联邦KMeans聚类',
    executionType: FLTaskExecutionType.MULTI_PARTY,
    parameters: [
      {
        name: 'nClusters',
        displayName: '聚类数',
        dataType: FLParameterDataType.NUMBER,
        required: true,
        defaultValue: 3,
        min: 1,
        max: 1000
      },
      {
        name: 'maxIterations',
        displayName: '最大迭代次数',
        dataType: FLParameterDataType.NUMBER,
        required: false,
        defaultValue: 300,
        min: 1,
        max: 10000
      },
      {
        name: 'tol',
        displayName: '收敛阈值',
        dataType: FLParameterDataType.NUMBER,
        required: false,
        defaultValue: 0.0001,
        min: 0,
        max: 0.1
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
      }
    ]
  },
  {
    taskName: 'vertical_naive_bayes',
    displayName: '纵向朴素贝叶斯',
    category: FLTaskCategory.VERTICAL_MODEL,
    mode: FLMode.TRAINING,
    icon: '📊',
    description: '纵向联邦朴素贝叶斯',
    executionType: FLTaskExecutionType.MULTI_PARTY,
    parameters: [
      {
        name: 'alpha',
        displayName: 'Laplace平滑参数',
        dataType: FLParameterDataType.NUMBER,
        required: false,
        defaultValue: 1.0,
        min: 0,
        max: 10
      },
      {
        name: 'fitPrior',
        displayName: '学习先验概率',
        dataType: FLParameterDataType.BOOLEAN,
        required: false,
        defaultValue: true
      },
      {
        name: 'classPrior',
        displayName: '先验概率',
        dataType: FLParameterDataType.ARRAY,
        required: false,
        defaultValue: [],
        description: '空则自动学习'
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

// ========== 获取任务的参数定义列表 ==========

export function getParametersForTask(taskName: string, subType?: string): import('@/types/fl-tasks').FLTaskParameterDef[] {
  const template = getParameterTemplateByTaskName(taskName)
  if (!template) return []

  // 如果有子类型且指定了子类型，返回该子类型的参数
  if (template.subTypes && template.subTypes.length > 0) {
    if (subType) {
      const subTypeDef = template.subTypes.find(s => s.value === subType)
      return subTypeDef?.parameters || []
    }
    // 未指定子类型时返回空（需要先选择子类型）
    return []
  }

  // 无子类型时直接返回参数
  return template.parameters || []
}

// ========== 获取任务的子类型列表 ==========

export function getSubTypesForTask(taskName: string): FLTaskSubType[] {
  const template = getParameterTemplateByTaskName(taskName)
  if (!template || !template.subTypes) return []
  return template.subTypes
}

// ========== 获取任务的执行类型 ==========

export function getExecutionTypeForTask(taskName: string): FLTaskExecutionType | undefined {
  const template = getParameterTemplateByTaskName(taskName)
  return template?.executionType
}
