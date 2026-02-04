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
    id: 'codebin_v3_1_001',
    name: 'MPC统计模型V3.1',
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
