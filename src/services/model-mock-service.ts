/**
 * 模型详情 Mock 服务
 * 用于模拟获取计算模型的详细信息，包括返回参数定义
 */

/**
 * 数据类型枚举（与接口文档中的 dataType 对应）
 */
export enum ModelDataType {
  STRING = 1,
  INT = 2,
  BIGINT = 3,
  FLOAT = 4,
  DOUBLE = 5,
  BOOLEAN = 6,
  DATETIME = 7
}

/**
 * 数据类型名称映射
 */
const DATA_TYPE_NAMES: Record<number, string> = {
  1: 'STRING',
  2: 'INT',
  3: 'BIGINT',
  4: 'FLOAT',
  5: 'DOUBLE',
  6: 'BOOLEAN',
  7: 'DATETIME'
}

/**
 * 模型返回参数
 */
export interface ModelReturnParameter {
  fid: string
  name: string
  dataType: number
  isRequired: number
  description: string
}

/**
 * 模型详情响应
 */
export interface ModelDetailResponse {
  code: number
  msg: string
  data: {
    id: string
    partyId: string
    chainId: number
    chainName: string
    name: string
    type: string
    version: string
    category: string
    description: string
    modelFileName: string
    modelFile: null
    modelFileHash: string
    sourceFile: null
    sourceFileName: string
    sourceFileHash: string
    programmingLanguage: string
    methodName: string
    methodDescription: string
    status: number
    createTime: string
    modelParameters: Array<{
      fid: string
      name: string
      dataSource: string
      dataType: number
      isEncrypt: number
      description: string
    }>
    returnParameters: ModelReturnParameter[]
  }
}

/**
 * Mock 模型数据存储
 * 使用 modelId 作为 key 存储模型详情
 */
const MOCK_MODEL_DATA: Record<string, ModelDetailResponse['data']> = {
  // CodeBin-V2 模型示例
  'codebin_v2_001': {
    id: 'codebin_v2_001',
    partyId: 'ent_003',
    chainId: 1,
    chainName: '测试链',
    name: 'PSI求交模型V2',
    type: 'CodeBin-V2',
    version: '2.0',
    category: '["隐私求交"]',
    description: '基于CodeBin V2的高性能PSI求交模型',
    modelFileName: 'psi_v2.py',
    modelFile: null,
    modelFileHash: 'abc123',
    sourceFile: null,
    sourceFileName: 'psi_data.bin',
    sourceFileHash: 'def456',
    programmingLanguage: 'Python',
    methodName: 'psi_compute',
    methodDescription: 'PSI求交计算方法',
    status: 1,
    createTime: '2024-01-15 10:30:00',
    modelParameters: [
      {
        fid: 'param_001',
        name: 'input_data',
        dataSource: '数据输入',
        dataType: 1,
        isEncrypt: 1,
        description: '输入数据集'
      }
    ],
    returnParameters: [
      {
        fid: 'ret_001',
        name: 'intersection_result',
        dataType: 1,
        isRequired: 1,
        description: '求交结果集'
      },
      {
        fid: 'ret_002',
        name: 'intersection_size',
        dataType: 2,
        isRequired: 1,
        description: '求交结果数量'
      },
      {
        fid: 'ret_003',
        name: 'compute_time',
        dataType: 4,
        isRequired: 0,
        description: '计算耗时（毫秒）'
      }
    ]
  },
  // CodeBin-V3-1 模型示例
  'codebin_v3_1_001': {
    id: 'codebin_v3_1_001',
    partyId: 'ent_003',
    chainId: 1,
    chainName: '测试链',
    name: 'MPC统计模型V3.1',
    type: 'CodeBin-V3-1',
    version: '3.1',
    category: '["统计分析"]',
    description: '基于CodeBin V3.1的安全多方统计模型',
    modelFileName: 'mpc_stat_v3_1.py',
    modelFile: null,
    modelFileHash: 'ghi789',
    sourceFile: null,
    sourceFileName: 'stat_data.bin',
    sourceFileHash: 'jkl012',
    programmingLanguage: 'Python',
    methodName: 'secure_statistics',
    methodDescription: '安全统计计算方法',
    status: 1,
    createTime: '2024-02-20 14:20:00',
    modelParameters: [],
    returnParameters: [
      {
        fid: 'ret_004',
        name: 'statistic_value',
        dataType: 5,
        isRequired: 1,
        description: '统计结果值'
      },
      {
        fid: 'ret_005',
        name: 'confidence_level',
        dataType: 4,
        isRequired: 0,
        description: '置信水平'
      }
    ]
  },
  // CodeBin-V3-2 模型示例
  'codebin_v3_2_001': {
    id: 'codebin_v3_2_001',
    partyId: 'ent_003',
    chainId: 1,
    chainName: '测试链',
    name: '联邦学习模型V3.2',
    type: 'CodeBin-V3-2',
    version: '3.2',
    category: '["机器学习"]',
    description: '基于CodeBin V3.2的联邦学习模型',
    modelFileName: 'fl_v3_2.py',
    modelFile: null,
    modelFileHash: 'mno345',
    sourceFile: null,
    sourceFileName: 'fl_model.bin',
    sourceFileHash: 'pqr678',
    programmingLanguage: 'Python',
    methodName: 'federated_train',
    methodDescription: '联邦训练方法',
    status: 1,
    createTime: '2024-03-10 09:15:00',
    modelParameters: [],
    returnParameters: [
      {
        fid: 'ret_006',
        name: 'model_accuracy',
        dataType: 5,
        isRequired: 1,
        description: '模型准确率'
      },
      {
        fid: 'ret_007',
        name: 'training_loss',
        dataType: 5,
        isRequired: 1,
        description: '训练损失'
      },
      {
        fid: 'ret_008',
        name: 'iteration_count',
        dataType: 2,
        isRequired: 1,
        description: '迭代次数'
      },
      {
        fid: 'ret_009',
        name: 'converged',
        dataType: 6,
        isRequired: 0,
        description: '是否收敛'
      }
    ]
  },
  // SPDZ 模型示例
  'spdz_001': {
    id: 'spdz_001',
    partyId: 'ent_003',
    chainId: 1,
    chainName: '测试链',
    name: 'SPDZ计算模型',
    type: 'SPDZ',
    version: '1.0',
    category: '["通用计算"]',
    description: '基于SPDZ协议的安全多方计算模型',
    modelFileName: 'spdz_compute.py',
    modelFile: null,
    modelFileHash: 'stu901',
    sourceFile: null,
    sourceFileName: 'spdz_data.bin',
    sourceFileHash: 'vwx234',
    programmingLanguage: 'Python',
    methodName: 'spdz_compute',
    methodDescription: 'SPDZ计算方法',
    status: 1,
    createTime: '2024-04-05 16:45:00',
    modelParameters: [],
    returnParameters: [
      {
        fid: 'ret_010',
        name: 'compute_result',
        dataType: 5,
        isRequired: 1,
        description: '计算结果'
      },
      {
        fid: 'ret_011',
        name: 'party_contributions',
        dataType: 1,
        isRequired: 0,
        description: '各方贡献度'
      }
    ]
  },
  // 数据清洗模型 - CodeBin-V2，带多个输入参数
  'codebin_v2_data_clean': {
    id: 'codebin_v2_data_clean',
    partyId: 'ent_003',
    chainId: 1,
    chainName: '测试链',
    name: '数据清洗模型',
    type: 'CodeBin-V2',
    version: '2.0',
    category: '["数据预处理"]',
    description: '对输入数据进行去重、空值处理、异常值检测等清洗操作',
    modelFileName: 'data_clean.py',
    modelFile: null,
    modelFileHash: 'clean001',
    sourceFile: null,
    sourceFileName: 'clean.bin',
    sourceFileHash: 'clean002',
    programmingLanguage: 'Python',
    methodName: 'clean_data',
    methodDescription: '数据清洗方法',
    status: 1,
    createTime: '2024-05-10 10:00:00',
    modelParameters: [
      {
        fid: 'param_input_data',
        name: 'input_data',
        dataSource: '数据输入',
        dataType: 1,
        isEncrypt: 1,
        description: '待清洗的输入数据集'
      },
      {
        fid: 'param_remove_duplicates',
        name: 'remove_duplicates',
        dataSource: '参数配置',
        dataType: 6,
        isEncrypt: 0,
        description: '是否去除重复数据'
      },
      {
        fid: 'param_fill_na_method',
        name: 'fill_na_method',
        dataSource: '参数配置',
        dataType: 1,
        isEncrypt: 0,
        description: '空值填充方式：mean/median/drop'
      },
      {
        fid: 'param_outlier_threshold',
        name: 'outlier_threshold',
        dataSource: '参数配置',
        dataType: 4,
        isEncrypt: 0,
        description: '异常值检测阈值（标准差倍数）'
      },
      {
        fid: 'param_min_sample_size',
        name: 'min_sample_size',
        dataSource: '参数配置',
        dataType: 2,
        isEncrypt: 0,
        description: '最小样本数量'
      }
    ],
    returnParameters: [
      {
        fid: 'ret_clean_data',
        name: 'cleaned_data',
        dataType: 1,
        isRequired: 1,
        description: '清洗后的数据'
      },
      {
        fid: 'ret_clean_report',
        name: 'clean_report',
        dataType: 1,
        isRequired: 1,
        description: '清洗报告（JSON格式）'
      },
      {
        fid: 'ret_rows_removed',
        name: 'rows_removed',
        dataType: 2,
        isRequired: 0,
        description: '删除的行数'
      }
    ]
  },
  // 特征工程模型 - CodeBin-V3-1，带输入参数
  'codebin_v3_1_feature': {
    id: 'codebin_v3_1_feature',
    partyId: 'ent_003',
    chainId: 1,
    chainName: '测试链',
    name: '特征工程模型',
    type: 'CodeBin-V3-1',
    version: '3.1',
    category: '["特征工程"]',
    description: '进行特征提取、特征转换、特征选择等操作',
    modelFileName: 'feature_engineering.py',
    modelFile: null,
    modelFileHash: 'feat001',
    sourceFile: null,
    sourceFileName: 'feature.bin',
    sourceFileHash: 'feat002',
    programmingLanguage: 'Python',
    methodName: 'feature_engineering',
    methodDescription: '特征工程处理方法',
    status: 1,
    createTime: '2024-06-15 14:30:00',
    modelParameters: [
      {
        fid: 'param_raw_features',
        name: 'raw_features',
        dataSource: '数据输入',
        dataType: 1,
        isEncrypt: 1,
        description: '原始特征数据'
      },
      {
        fid: 'param_feature_types',
        name: 'feature_types',
        dataSource: '参数配置',
        dataType: 1,
        isEncrypt: 0,
        description: '特征类型配置（JSON）'
      },
      {
        fid: 'param_normalization',
        name: 'normalization',
        dataSource: '参数配置',
        dataType: 1,
        isEncrypt: 0,
        description: '归一化方法：minmax/zscore/none'
      },
      {
        fid: 'param_feature_count',
        name: 'max_features',
        dataSource: '参数配置',
        dataType: 2,
        isEncrypt: 0,
        description: '最大特征数量'
      }
    ],
    returnParameters: [
      {
        fid: 'ret_engineered_features',
        name: 'engineered_features',
        dataType: 1,
        isRequired: 1,
        description: '工程化后的特征'
      },
      {
        fid: 'ret_feature_importance',
        name: 'feature_importance',
        dataType: 1,
        isRequired: 0,
        description: '特征重要性评分'
      }
    ]
  },
  // 联合建模模型 - CodeBin-V3-2，带输入参数
  'codebin_v3_2_joint_train': {
    id: 'codebin_v3_2_joint_train',
    partyId: 'ent_003',
    chainId: 1,
    chainName: '测试链',
    name: '联合建模训练模型',
    type: 'CodeBin-V3-2',
    version: '3.2',
    category: '["机器学习"]',
    description: '多方联合进行模型训练，支持横向和纵向联邦学习',
    modelFileName: 'joint_training.py',
    modelFile: null,
    modelFileHash: 'train001',
    sourceFile: null,
    sourceFileName: 'train.bin',
    sourceFileHash: 'train002',
    programmingLanguage: 'Python',
    methodName: 'joint_train',
    methodDescription: '联合训练方法',
    status: 1,
    createTime: '2024-07-20 09:00:00',
    modelParameters: [
      {
        fid: 'param_train_data',
        name: 'train_data',
        dataSource: '数据输入',
        dataType: 1,
        isEncrypt: 1,
        description: '训练数据集'
      },
      {
        fid: 'param_model_type',
        name: 'model_type',
        dataSource: '参数配置',
        dataType: 1,
        isEncrypt: 0,
        description: '模型类型：lr/dt/xgb'
      },
      {
        fid: 'param_learning_rate',
        name: 'learning_rate',
        dataSource: '参数配置',
        dataType: 4,
        isEncrypt: 0,
        description: '学习率'
      },
      {
        fid: 'param_max_iterations',
        name: 'max_iterations',
        dataSource: '参数配置',
        dataType: 2,
        isEncrypt: 0,
        description: '最大迭代次数'
      },
      {
        fid: 'param_batch_size',
        name: 'batch_size',
        dataSource: '参数配置',
        dataType: 2,
        isEncrypt: 0,
        description: '批次大小'
      },
      {
        fid: 'param_early_stop',
        name: 'early_stop',
        dataSource: '参数配置',
        dataType: 6,
        isEncrypt: 0,
        description: '是否启用早停'
      },
      {
        fid: 'param_validation_ratio',
        name: 'validation_ratio',
        dataSource: '参数配置',
        dataType: 4,
        isEncrypt: 0,
        description: '验证集比例'
      }
    ],
    returnParameters: [
      {
        fid: 'ret_trained_model',
        name: 'trained_model',
        dataType: 1,
        isRequired: 1,
        description: '训练好的模型'
      },
      {
        fid: 'ret_training_metrics',
        name: 'training_metrics',
        dataType: 1,
        isRequired: 1,
        description: '训练指标（JSON）'
      },
      {
        fid: 'ret_loss_history',
        name: 'loss_history',
        dataType: 1,
        isRequired: 0,
        description: '损失历史记录'
      }
    ]
  },
  // 差分隐私模型 - CodeBin-V2，带输入参数
  'codebin_v2_dp_noise': {
    id: 'codebin_v2_dp_noise',
    partyId: 'ent_003',
    chainId: 1,
    chainName: '测试链',
    name: '差分隐私噪声模型',
    type: 'CodeBin-V2',
    version: '2.0',
    category: '["隐私保护"]',
    description: '为数据添加差分隐私噪声，保护个人隐私',
    modelFileName: 'dp_noise.py',
    modelFile: null,
    modelFileHash: 'dp001',
    sourceFile: null,
    sourceFileName: 'dp.bin',
    sourceFileHash: 'dp002',
    programmingLanguage: 'Python',
    methodName: 'add_dp_noise',
    methodDescription: '添加差分隐私噪声',
    status: 1,
    createTime: '2024-08-05 11:20:00',
    modelParameters: [
      {
        fid: 'param_input_query',
        name: 'input_query',
        dataSource: '数据输入',
        dataType: 1,
        isEncrypt: 1,
        description: '输入查询结果'
      },
      {
        fid: 'param_epsilon',
        name: 'epsilon',
        dataSource: '参数配置',
        dataType: 5,
        isEncrypt: 0,
        description: '隐私预算 epsilon 值'
      },
      {
        fid: 'param_sensitivity',
        name: 'sensitivity',
        dataSource: '参数配置',
        dataType: 5,
        isEncrypt: 0,
        description: '查询的全局敏感度'
      },
      {
        fid: 'param_mechanism',
        name: 'mechanism',
        dataSource: '参数配置',
        dataType: 1,
        isEncrypt: 0,
        description: '噪声机制：laplace/gaussian'
      },
      {
        fid: 'param_delta',
        name: 'delta',
        dataSource: '参数配置',
        dataType: 5,
        isEncrypt: 0,
        description: '(可选)高斯机制的delta参数'
      }
    ],
    returnParameters: [
      {
        fid: 'ret_noisy_result',
        name: 'noisy_result',
        dataType: 1,
        isRequired: 1,
        description: '添加噪声后的结果'
      },
      {
        fid: 'ret_privacy_spent',
        name: 'privacy_spent',
        dataType: 5,
        isRequired: 1,
        description: '已使用的隐私预算'
      },
      {
        fid: 'ret_noise_added',
        name: 'noise_added',
        dataType: 5,
        isRequired: 0,
        description: '实际添加的噪声值'
      }
    ]
  },
  // SQL 聚合计算模型 - CodeBin-V3-1，带输入参数
  'codebin_v3_1_sql_agg': {
    id: 'codebin_v3_1_sql_agg',
    partyId: 'ent_003',
    chainId: 1,
    chainName: '测试链',
    name: 'SQL聚合计算模型',
    type: 'CodeBin-V3-1',
    version: '3.1',
    category: '["SQL计算"]',
    description: '支持SQL语句的安全聚合计算，包括SUM、COUNT、AVG等',
    modelFileName: 'sql_aggregate.py',
    modelFile: null,
    modelFileHash: 'sql001',
    sourceFile: null,
    sourceFileName: 'sql.bin',
    sourceFileHash: 'sql002',
    programmingLanguage: 'Python',
    methodName: 'sql_aggregate',
    methodDescription: 'SQL聚合计算',
    status: 1,
    createTime: '2024-09-01 16:00:00',
    modelParameters: [
      {
        fid: 'param_sql_query',
        name: 'sql_query',
        dataSource: '参数配置',
        dataType: 1,
        isEncrypt: 1,
        description: 'SQL查询语句'
      },
      {
        fid: 'param_table_name',
        name: 'table_name',
        dataSource: '参数配置',
        dataType: 1,
        isEncrypt: 0,
        description: '表名'
      },
      {
        fid: 'param_group_by_keys',
        name: 'group_by_keys',
        dataSource: '参数配置',
        dataType: 1,
        isEncrypt: 0,
        description: '分组键（逗号分隔）'
      },
      {
        fid: 'param_agg_functions',
        name: 'agg_functions',
        dataSource: '参数配置',
        dataType: 1,
        isEncrypt: 0,
        description: '聚合函数列表（JSON）'
      },
      {
        fid: 'param_having_clause',
        name: 'having_clause',
        dataSource: '参数配置',
        dataType: 1,
        isEncrypt: 0,
        description: 'Having条件（可选）'
      },
      {
        fid: 'param_limit_rows',
        name: 'limit_rows',
        dataSource: '参数配置',
        dataType: 2,
        isEncrypt: 0,
        description: '返回行数限制（可选）'
      }
    ],
    returnParameters: [
      {
        fid: 'ret_agg_result',
        name: 'agg_result',
        dataType: 1,
        isRequired: 1,
        description: '聚合结果（JSON格式）'
      },
      {
        fid: 'ret_row_count',
        name: 'row_count',
        dataType: 2,
        isRequired: 1,
        description: '结果行数'
      },
      {
        fid: 'ret_execution_time',
        name: 'execution_time',
        dataType: 3,
        isRequired: 0,
        description: '执行耗时（毫秒）'
      }
    ]
  }
}

/**
 * 表达式模型的默认返回参数
 * 表达式模型只有一个默认输出，类型是浮点型
 */
export const EXPRESSION_MODEL_OUTPUT: ModelReturnParameter = {
  fid: 'expr_output_001',
  name: 'result',
  dataType: ModelDataType.FLOAT,
  isRequired: 1,
  description: '表达式计算结果'
}

/**
 * 获取模型详情（Mock 接口）
 * @param modelId 模型ID
 * @returns Promise<ModelDetailResponse>
 */
export async function getModelDetail(modelId: string): Promise<ModelDetailResponse> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 100))

  const modelData = MOCK_MODEL_DATA[modelId]

  if (modelData) {
    return {
      code: 200,
      msg: 'success',
      data: modelData
    }
  }

  // 如果找不到模型，返回错误
  return {
    code: 404,
    msg: 'Model not found',
    data: {} as any
  }
}

/**
 * 获取数据类型名称
 * @param dataType 数据类型编号
 * @returns 数据类型名称
 */
export function getDataTypeName(dataType: number): string {
  return DATA_TYPE_NAMES[dataType] || 'UNKNOWN'
}

/**
 * 为模型选择器提供 Mock 模型列表
 */
export const MOCK_MODELS = [
  {
    id: 'codebin_v2_001',
    name: 'PSI求交模型V2',
    type: 'CodeBin-V2',
    participantId: 'ent_003'
  },
  {
    id: 'codebin_v2_data_clean',
    name: '数据清洗模型',
    type: 'CodeBin-V2',
    participantId: 'ent_003'
  },
  {
    id: 'codebin_v2_dp_noise',
    name: '差分隐私噪声模型',
    type: 'CodeBin-V2',
    participantId: 'ent_003'
  },
  {
    id: 'codebin_v3_1_001',
    name: 'MPC统计模型V3.1',
    type: 'CodeBin-V3-1',
    participantId: 'ent_003'
  },
  {
    id: 'codebin_v3_1_feature',
    name: '特征工程模型',
    type: 'CodeBin-V3-1',
    participantId: 'ent_003'
  },
  {
    id: 'codebin_v3_1_sql_agg',
    name: 'SQL聚合计算模型',
    type: 'CodeBin-V3-1',
    participantId: 'ent_003'
  },
  {
    id: 'codebin_v3_2_001',
    name: '联邦学习模型V3.2',
    type: 'CodeBin-V3-2',
    participantId: 'ent_003'
  },
  {
    id: 'codebin_v3_2_joint_train',
    name: '联合建模训练模型',
    type: 'CodeBin-V3-2',
    participantId: 'ent_003'
  },
  {
    id: 'spdz_001',
    name: 'SPDZ计算模型',
    type: 'SPDZ',
    participantId: 'ent_003'
  }
]

/**
 * 获取模型输入参数签名
 * @param modelId 模型ID
 * @returns Promise<ModelParameterSignature[]>
 */
export async function getModelInputSignatures(modelId: string): Promise<Array<{
  fid: string
  name: string
  dataSource: string
  dataType: number
  isEncrypt: number
  description: string
}>> {
  const response = await getModelDetail(modelId)
  if (response.code !== 200) {
    throw new Error(response.msg)
  }
  return response.data.modelParameters
}
