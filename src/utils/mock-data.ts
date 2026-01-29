/**
 * Mock 数据工具
 * 提供模拟后端接口的数据和工厂函数
 */

import type {
  EnterpriseOption,
  Field,
  ResourceTypePriority
} from '@/types/contracts'

// ============ 企业 Mock 数据 ============

export interface Enterprise {
  id: string
  name: string
}

export const MOCK_ENTERPRISES: Enterprise[] = [
  { id: 'org-001', name: '租户一' },
  { id: 'org-002', name: '租户二' },
  { id: 'org-003', name: '租户三' },
  { id: 'org-004', name: '某某银行' },
  { id: 'org-005', name: '某某保险公司' }
]

// ============ 计算模型 Mock 数据 ============

export interface ComputeModel {
  modelId: string
  participantId: string
  name: string
  type: 'expression' | 'CodeBin-V2' | 'CodeBin-V3-1' | 'CodeBin-V3-2' | 'SPDZ'
  version: string
  description: string
  modelFileName: string
  methodName: string
  methodDescription: string
  programmingLanguage: string
  parameters?: ModelParameter[]
}

export interface ModelParameter {
  name: string
  type: string
  description: string
  defaultValue?: string
  required: boolean
}

export const MOCK_MODELS: ComputeModel[] = [
  {
    modelId: 'model-001',
    participantId: 'org-001',
    name: 'MUL-乘法运算',
    type: 'CodeBin-V2',
    version: '1.0.0',
    description: '两数相乘的安全乘法运算',
    modelFileName: 'mul.py',
    methodName: 'secure_mul',
    methodDescription: 'MPC安全乘法运算',
    programmingLanguage: 'Python',
    parameters: [
      { name: 'x', type: 'int', description: '第一个乘数', required: true },
      { name: 'y', type: 'int', description: '第二个乘数', required: true }
    ]
  },
  {
    modelId: 'model-002',
    participantId: 'org-001',
    name: 'ADD-加法运算',
    type: 'CodeBin-V2',
    version: '1.0.0',
    description: '两数相加的安全加法运算',
    modelFileName: 'add.py',
    methodName: 'secure_add',
    methodDescription: 'MPC安全加法运算',
    programmingLanguage: 'Python',
    parameters: [
      { name: 'x', type: 'int', description: '第一个加数', required: true },
      { name: 'y', type: 'int', description: '第二个加数', required: true }
    ]
  },
  {
    modelId: 'model-003',
    participantId: 'org-002',
    name: 'AVG-平均值计算',
    type: 'CodeBin-V3-1',
    version: '2.0.0',
    description: '安全平均值计算模型',
    modelFileName: 'avg.py',
    methodName: 'secure_avg',
    methodDescription: '多方安全平均值计算',
    programmingLanguage: 'Python',
    parameters: [
      { name: 'values', type: 'int[]', description: '数值数组', required: true }
    ]
  },
  {
    modelId: 'model-004',
    participantId: 'org-002',
    name: 'SUM-求和运算',
    type: 'SPDZ',
    version: '1.5.0',
    description: '安全求和运算',
    modelFileName: 'sum.py',
    methodName: 'secure_sum',
    methodDescription: 'SPDZ协议求和',
    programmingLanguage: 'Python',
    parameters: [
      { name: 'values', type: 'int[]', description: '数值数组', required: true }
    ]
  },
  {
    modelId: 'model-005',
    participantId: 'org-003',
    name: 'REGRESSION-线性回归',
    type: 'CodeBin-V3-2',
    version: '3.0.0',
    description: '安全线性回归模型',
    modelFileName: 'regression.py',
    methodName: 'secure_regression',
    methodDescription: 'MPC线性回归训练',
    programmingLanguage: 'Python',
    parameters: [
      { name: 'X', type: 'float[][]', description: '特征矩阵', required: true },
      { name: 'y', type: 'float[]', description: '标签数组', required: true },
      { name: 'epochs', type: 'int', description: '训练轮数', defaultValue: '100', required: false }
    ]
  }
]

// ============ 算力资源 Mock 数据 ============

export interface ComputeResource {
  groupId: string
  participantId: string
  groupName: string
  nodeId: string
  nodeName: string
  nodeAddress: string
  nodeType: number
  cardSerial: string
  cardModel: string
  cardSpec: string
  cardVersion: string
  cardType: number
}

export const MOCK_COMPUTES: ComputeResource[] = [
  {
    groupId: 'group-001',
    participantId: 'org-001',
    groupName: 'TEE算力组1',
    nodeId: 'node-001',
    nodeName: '计算节点1',
    nodeAddress: '192.168.1.10',
    nodeType: 1,
    cardSerial: 'BCA253010012',
    cardModel: '海光TEE板卡',
    cardSpec: '32核',
    cardVersion: '2.0',
    cardType: 1
  },
  {
    groupId: 'group-001',
    participantId: 'org-001',
    groupName: 'TEE算力组1',
    nodeId: 'node-001',
    nodeName: '计算节点1',
    nodeAddress: '192.168.1.10',
    nodeType: 1,
    cardSerial: 'BCA253010013',
    cardModel: '海光TEE板卡',
    cardSpec: '32核',
    cardVersion: '2.0',
    cardType: 1
  },
  {
    groupId: 'group-002',
    participantId: 'org-002',
    groupName: 'TEE算力组2',
    nodeId: 'node-002',
    nodeName: '计算节点2',
    nodeAddress: '192.168.1.11',
    nodeType: 1,
    cardSerial: 'BCA253010014',
    cardModel: '海光TEE板卡',
    cardSpec: '64核',
    cardVersion: '2.0',
    cardType: 1
  },
  {
    groupId: 'group-003',
    participantId: 'org-003',
    groupName: 'TEE算力组3',
    nodeId: 'node-003',
    nodeName: '计算节点3',
    nodeAddress: '192.168.1.12',
    nodeType: 1,
    cardSerial: 'BCA253010015',
    cardModel: '海光TEE板卡',
    cardSpec: '32核',
    cardVersion: '2.0',
    cardType: 1
  }
]

// ============ 字段 Mock 数据 ============

export const MOCK_FIELDS: Field[] = [
  {
    columnName: 'id',
    type: 'bigint',
    length: '20',
    comments: '用户ID',
    visibleType: 1
  },
  {
    columnName: 'name',
    type: 'varchar',
    length: '100',
    comments: '用户姓名',
    visibleType: 1
  },
  {
    columnName: 'age',
    type: 'int',
    length: '11',
    comments: '年龄',
    visibleType: 1
  },
  {
    columnName: 'phone',
    type: 'varchar',
    length: '20',
    comments: '手机号',
    visibleType: 0
  },
  {
    columnName: 'email',
    type: 'varchar',
    length: '100',
    comments: '邮箱',
    visibleType: 0
  },
  {
    columnName: 'id_card',
    type: 'varchar',
    length: '18',
    comments: '身份证号',
    visibleType: 0
  },
  {
    columnName: 'balance',
    type: 'decimal',
    length: '18,2',
    comments: '账户余额',
    visibleType: 1
  },
  {
    columnName: 'credit_score',
    type: 'int',
    length: '11',
    comments: '信用分',
    visibleType: 1
  },
  {
    columnName: 'create_time',
    type: 'datetime',
    length: '0',
    comments: '创建时间',
    visibleType: 1
  },
  {
    columnName: 'update_time',
    type: 'datetime',
    length: '0',
    comments: '更新时间',
    visibleType: 1
  }
]

// ============ 企业选项（带资源类型优先级）============

export interface EnterpriseWithResource extends EnterpriseOption {
  originalName: string
  resourceCount: number
}

/**
 * 根据资源类型生成企业选项
 */
export function getEnterprisesByResource(
  resourceType: ResourceTypePriority
): EnterpriseWithResource[] {
  const mockData: Record<ResourcePriority, { enterprises: string[]; count: number }> = {
    3: { enterprises: ['org-001', 'org-004'], count: 5 }, // DATA
    2: { enterprises: ['org-001', 'org-002', 'org-003'], count: 5 }, // MODEL
    1: { enterprises: ['org-001', 'org-002', 'org-003'], count: 4 }, // COMPUTE
    0: { enterprises: ['org-005'], count: 1 } // OTHER
  }

  const data = mockData[resourceType]
  return data.enterprises.map(id => {
    const enterprise = MOCK_ENTERPRISES.find(e => e.id === id)!
    return {
      id: enterprise.id,
      name: enterprise.name,
      originalName: enterprise.name,
      resourceType,
      resourceCount: data.count
    }
  })
}

type ResourcePriority = 3 | 2 | 1 | 0

// ============ Mock API 工厂 ============

/**
 * 创建 Mock API 实例
 * 模拟后端接口调用
 */
export function createMockApi() {
  return {
    /**
     * 获取所有企业列表
     */
    async getEnterprises(): Promise<Enterprise[]> {
      // 模拟网络延迟
      await delay(100)
      return [...MOCK_ENTERPRISES]
    },

    /**
     * 根据资源类型获取企业列表
     */
    async getEnterprisesByResource(
      resourceType: ResourceTypePriority
    ): Promise<EnterpriseWithResource[]> {
      await delay(100)
      return getEnterprisesByResource(resourceType)
    },

    /**
     * 获取企业的计算模型列表
     */
    async getModels(participantId: string): Promise<ComputeModel[]> {
      await delay(150)
      return MOCK_MODELS.filter(m => m.participantId === participantId)
    },

    /**
     * 根据模型类型获取计算模型列表
     */
    async getModelsByType(
      participantId: string,
      modelType: string
    ): Promise<ComputeModel[]> {
      await delay(150)
      return MOCK_MODELS.filter(
        m => m.participantId === participantId && m.type === modelType
      )
    },

    /**
     * 获取单个模型详情
     */
    async getModel(modelId: string): Promise<ComputeModel | null> {
      await delay(100)
      return MOCK_MODELS.find(m => m.modelId === modelId) || null
    },

    /**
     * 获取企业的算力资源列表
     */
    async getComputes(participantId: string): Promise<ComputeResource[]> {
      await delay(150)
      return MOCK_COMPUTES.filter(c => c.participantId === participantId)
    },

    /**
     * 获取算力组详情
     */
    async getComputeGroup(groupId: string): Promise<ComputeResource[]> {
      await delay(100)
      return MOCK_COMPUTES.filter(c => c.groupId === groupId)
    },

    /**
     * 获取数据源字段列表
     */
    async getFields(_participantId: string, _dataset: string): Promise<Field[]> {
      await delay(100)
      // 返回 Mock 字段数据
      return [...MOCK_FIELDS]
    },

    /**
     * 搜索企业
     */
    async searchEnterprises(keyword: string): Promise<Enterprise[]> {
      await delay(100)
      return MOCK_ENTERPRISES.filter(e =>
        e.name.toLowerCase().includes(keyword.toLowerCase())
      )
    }
  }
}

/**
 * 延迟工具函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ============ 导出 Mock API 单例 ============

export const mockApi = createMockApi()

// ============ 辅助函数 ============

/**
 * 根据 ID 获取企业名称
 */
export function getEnterpriseName(id: string): string {
  const enterprise = MOCK_ENTERPRISES.find(e => e.id === id)
  return enterprise?.name || id
}

/**
 * 获取所有企业 ID
 */
export function getAllEnterpriseIds(): string[] {
  return MOCK_ENTERPRISES.map(e => e.id)
}

/**
 * 生成唯一 ID
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 9)
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`
}
