/**
 * 算法Mock数据
 * Feature: 004-algorithm-selection
 * 预置10-15条算法，覆盖8种算法类型
 */

import type { Algorithm } from '@/types/algorithm'
import { AlgorithmType, ParamType } from '@/types/algorithm'

/** 生成时间戳（按偏移量递减，模拟不同创建时间） */
function createTimestamp(offsetDays: number): number {
  const baseDate = new Date('2026-02-01')
  return baseDate.getTime() + offsetDays * 24 * 60 * 60 * 1000
}

/** 预置算法数据 */
export const MOCK_ALGORITHMS: Algorithm[] = [
  // ========== PSI 类型 ==========
  {
    id: 'PSI-ECDH-v1.0',
    name: 'ECDH隐私集合求交',
    nameEn: 'PSI-ECDH',
    version: 'v1.0',
    description: '基于椭圆曲线Diffie-Hellman的隐私集合求交协议，适用于大数据量场景',
    type: AlgorithmType.PSI,
    paramTemplate: [
      {
        key: 'hashAlgorithm',
        label: '哈希算法',
        type: ParamType.ENUM,
        required: true,
        defaultValue: 'SHA256',
        order: 1,
        validation: {
          enumOptions: [
            { value: 'SHA256', label: 'SHA-256' },
            { value: 'SHA512', label: 'SHA-512' },
            { value: 'SM3', label: 'SM3 (国密)' }
          ]
        }
      },
      {
        key: 'batchSize',
        label: '批次大小',
        type: ParamType.INTEGER,
        required: false,
        defaultValue: 10000,
        order: 2,
        validation: { min: 100, max: 100000 }
      }
    ],
    createdAt: createTimestamp(0)
  },
  {
    id: 'PSI-KKRT-v1.0',
    name: 'KKRT隐私集合求交',
    nameEn: 'PSI-KKRT',
    version: 'v1.0',
    description: '基于Cuckoo哈希的高性能PSI协议，性能优于ECDH',
    type: AlgorithmType.PSI,
    paramTemplate: [],
    createdAt: createTimestamp(5)
  },

  // ========== TEE_PSI 类型 ==========
  {
    id: 'TEE-PSI-SGX-v1.0',
    name: 'SGX硬件加速PSI',
    nameEn: 'TEE-PSI-SGX',
    version: 'v1.0',
    description: '基于Intel SGX的可信执行环境PSI，性能更高',
    type: AlgorithmType.TEE_PSI,
    paramTemplate: [
      {
        key: 'enclaveSize',
        label: 'Enclave内存大小(MB)',
        type: ParamType.INTEGER,
        required: false,
        defaultValue: 128,
        order: 1,
        validation: { min: 64, max: 512 }
      }
    ],
    createdAt: createTimestamp(2)
  },

  // ========== PIR 类型 ==========
  {
    id: 'PIR-Keyword-v1.0',
    name: '关键字隐私检索',
    nameEn: 'PIR-Keyword',
    version: 'v1.0',
    description: '支持按关键字进行隐私检索，保护查询隐私',
    type: AlgorithmType.PIR,
    paramTemplate: [
      {
        key: 'responseSize',
        label: '响应包大小(KB)',
        type: ParamType.INTEGER,
        required: false,
        defaultValue: 64,
        order: 1,
        validation: { min: 1, max: 1024 }
      }
    ],
    createdAt: createTimestamp(1)
  },
  {
    id: 'PIR-SealPIR-v1.0',
    name: 'SealPIR协议',
    nameEn: 'SealPIR',
    version: 'v1.0',
    description: '基于Microsoft SEAL库的同态加密PIR实现',
    type: AlgorithmType.PIR,
    paramTemplate: [],
    createdAt: createTimestamp(6)
  },

  // ========== TEE_PIR 类型 ==========
  {
    id: 'TEE-PIR-SGX-v1.0',
    name: 'SGX硬件加速PIR',
    nameEn: 'TEE-PIR-SGX',
    version: 'v1.0',
    description: '基于SGX的高性能PIR实现',
    type: AlgorithmType.TEE_PIR,
    paramTemplate: [],
    createdAt: createTimestamp(3)
  },

  // ========== MPC 类型 ==========
  {
    id: 'SPDZ-v1.0',
    name: 'SPDZ协议算法',
    nameEn: 'SPDZ',
    version: 'v1.0',
    description: '基于秘密分享的安全多方计算协议，支持通用计算',
    type: AlgorithmType.MPC,
    paramTemplate: [
      {
        key: 'iterationCount',
        label: '迭代次数',
        type: ParamType.INTEGER,
        required: true,
        defaultValue: 100,
        order: 1,
        validation: { min: 1, max: 10000 }
      },
      {
        key: 'securityLevel',
        label: '安全等级',
        type: ParamType.ENUM,
        required: false,
        defaultValue: 'high',
        order: 2,
        validation: {
          enumOptions: [
            { value: 'low', label: '低 (更快)' },
            { value: 'medium', label: '中 (平衡)' },
            { value: 'high', label: '高 (更安全)' }
          ]
        }
      },
      {
        key: 'enableOptimization',
        label: '启用优化',
        type: ParamType.BOOLEAN,
        required: false,
        defaultValue: true,
        order: 3
      }
    ],
    createdAt: createTimestamp(0)
  },
  {
    id: 'ABY3-v1.0',
    name: 'ABY3协议算法',
    nameEn: 'ABY3',
    version: 'v1.0',
    description: '三方安全计算协议，性能优于SPDZ，适用于三方场景',
    type: AlgorithmType.MPC,
    paramTemplate: [
      {
        key: 'partyCount',
        label: '参与方数量',
        type: ParamType.INTEGER,
        required: true,
        defaultValue: 3,
        order: 1,
        validation: { min: 3, max: 3 }
      }
    ],
    createdAt: createTimestamp(10) // 最新的MPC算法
  },
  {
    id: 'MPC-Cheeta-v1.0',
    name: 'Cheeta协议算法',
    nameEn: 'MPC-Cheeta',
    version: 'v1.0',
    description: '优化的两方安全计算协议',
    type: AlgorithmType.MPC,
    paramTemplate: [],
    createdAt: createTimestamp(4)
  },

  // ========== TEE_MPC 类型 ==========
  {
    id: 'TEE-MPC-SGX-v1.0',
    name: 'SGX硬件加速MPC',
    nameEn: 'TEE-MPC-SGX',
    version: 'v1.0',
    description: '基于SGX的可信多方计算，性能更高',
    type: AlgorithmType.TEE_MPC,
    paramTemplate: [
      {
        key: 'enclaveSize',
        label: 'Enclave内存大小(MB)',
        type: ParamType.INTEGER,
        required: false,
        defaultValue: 256,
        order: 1
      }
    ],
    createdAt: createTimestamp(7)
  },

  // ========== FL 类型 ==========
  {
    id: 'FL-LogisticRegression-v1.0',
    name: '联邦逻辑回归',
    nameEn: 'FL-LogReg',
    version: 'v1.0',
    description: '横向联邦学习逻辑回归算法',
    type: AlgorithmType.FL,
    paramTemplate: [
      {
        key: 'learningRate',
        label: '学习率',
        type: ParamType.FLOAT,
        required: true,
        defaultValue: 0.01,
        order: 1,
        validation: { min: 0.0001, max: 1 }
      },
      {
        key: 'epochs',
        label: '训练轮数',
        type: ParamType.INTEGER,
        required: true,
        defaultValue: 10,
        order: 2,
        validation: { min: 1, max: 1000 }
      },
      {
        key: 'batchSize',
        label: '批次大小',
        type: ParamType.INTEGER,
        required: false,
        defaultValue: 32,
        order: 3
      }
    ],
    createdAt: createTimestamp(2)
  },
  {
    id: 'FL-SecureBoost-v1.0',
    name: '联邦SecureBoost',
    nameEn: 'FL-SecureBoost',
    version: 'v1.0',
    description: '纵向联邦学习树模型算法',
    type: AlgorithmType.FL,
    paramTemplate: [
      {
        key: 'numTrees',
        label: '树的数量',
        type: ParamType.INTEGER,
        required: true,
        defaultValue: 10,
        order: 1,
        validation: { min: 1, max: 100 }
      },
      {
        key: 'maxDepth',
        label: '最大深度',
        type: ParamType.INTEGER,
        required: false,
        defaultValue: 5,
        order: 2,
        validation: { min: 1, max: 10 }
      }
    ],
    createdAt: createTimestamp(8) // 最新的FL算法
  },

  // ========== TEE_FL 类型 ==========
  {
    id: 'TEE-FL-SGX-v1.0',
    name: 'SGX硬件加速联邦学习',
    nameEn: 'TEE-FL-SGX',
    version: 'v1.0',
    description: '基于SGX的可信联邦学习',
    type: AlgorithmType.TEE_FL,
    paramTemplate: [],
    createdAt: createTimestamp(5)
  }
]

/** 按类型获取Mock算法 */
export function getMockAlgorithmsByType(type: AlgorithmType): Algorithm[] {
  return MOCK_ALGORITHMS.filter(algo => algo.type === type)
}

/** 获取默认算法（创建时间最新） */
export function getDefaultMockAlgorithm(type: AlgorithmType): Algorithm | null {
  const algorithms = getMockAlgorithmsByType(type)
  if (algorithms.length === 0) return null
  return algorithms.reduce((latest, current) =>
    current.createdAt > latest.createdAt ? current : latest
  )
}

/** 初始化Mock数据到缓存 */
export function initializeMockData(): Map<string, Algorithm> {
  const cache = new Map<string, Algorithm>()
  MOCK_ALGORITHMS.forEach(algo => {
    cache.set(algo.id, { ...algo })
  })
  return cache
}
