/**
 * Mock 数据工厂
 * 生成模拟数据，确保与后端接口数据结构一致
 * 对应 FR-057~FR-061
 */

import type { Enterprise, AssetInfo } from '@/types/nodes'

// ========== Mock 企业数据 ==========

/** Mock 企业列表 */
export const MOCK_ENTERPRISES: Enterprise[] = [
  {
    participantId: 'ent_001',
    entityName: '数据提供商A',
    enterpriseAssetList: [
      {
        assetId: 'asset_001',
        assetNumber: 'ASSET001',
        assetName: '用户交易数据',
        holderCompany: '数据提供商A'
      },
      {
        assetId: 'asset_002',
        assetNumber: 'ASSET002',
        assetName: '用户信用数据',
        holderCompany: '数据提供商A'
      }
    ]
  },
  {
    participantId: 'ent_002',
    entityName: '数据提供商B',
    enterpriseAssetList: [
      {
        assetId: 'asset_003',
        assetNumber: 'ASSET003',
        assetName: '用户行为数据',
        holderCompany: '数据提供商B'
      },
      {
        assetId: 'asset_004',
        assetNumber: 'ASSET004',
        assetName: '用户画像数据',
        holderCompany: '数据提供商B'
      }
    ]
  },
  {
    participantId: 'ent_003',
    entityName: '模型提供商C',
    enterpriseAssetList: []
  },
  {
    participantId: 'ent_004',
    entityName: '算力提供商D',
    enterpriseAssetList: []
  }
]

// ========== Mock 数据资产详情 ==========

/** Mock 数据资产详情 */
export const MOCK_ASSET_DETAILS: Record<string, AssetInfo> = {
  'asset_001': {
    assetId: 'asset_001',
    assetNumber: 'ASSET001',
    assetName: '用户交易数据',
    holderCompany: '数据提供商A',
    participantId: 'ent_001',
    entityName: '数据提供商A',
    intro: '包含用户交易记录、金额、时间等信息',
    scale: '100万条',
    cycle: '每日更新',
    dataInfo: {
      databaseName: 'transaction_db',
      tableName: 'user_transactions',
      fieldList: [
        {
          name: 'user_id',
          dataType: 'VARCHAR',
          dataLength: 64,
          description: '用户ID',
          isPrimaryKey: true
        },
        {
          name: 'transaction_amount',
          dataType: 'DECIMAL',
          dataLength: 18,
          description: '交易金额'
        },
        {
          name: 'transaction_time',
          dataType: 'DATETIME',
          description: '交易时间'
        },
        {
          name: 'merchant_id',
          dataType: 'VARCHAR',
          dataLength: 64,
          description: '商户ID'
        }
      ]
    }
  },
  'asset_002': {
    assetId: 'asset_002',
    assetNumber: 'ASSET002',
    assetName: '用户信用数据',
    holderCompany: '数据提供商A',
    participantId: 'ent_001',
    entityName: '数据提供商A',
    intro: '用户信用评分、信用等级等信息',
    scale: '50万条',
    cycle: '每周更新',
    dataInfo: {
      databaseName: 'credit_db',
      tableName: 'user_credit',
      fieldList: [
        {
          name: 'user_id',
          dataType: 'VARCHAR',
          dataLength: 64,
          description: '用户ID',
          isPrimaryKey: true
        },
        {
          name: 'credit_score',
          dataType: 'INT',
          description: '信用评分'
        },
        {
          name: 'credit_level',
          dataType: 'VARCHAR',
          dataLength: 10,
          description: '信用等级'
        }
      ]
    }
  },
  'asset_003': {
    assetId: 'asset_003',
    assetNumber: 'ASSET003',
    assetName: '用户行为数据',
    holderCompany: '数据提供商B',
    participantId: 'ent_002',
    entityName: '数据提供商B',
    intro: '用户浏览、点击等行为数据',
    scale: '500万条',
    cycle: '实时更新',
    dataInfo: {
      databaseName: 'behavior_db',
      tableName: 'user_behavior',
      fieldList: [
        {
          name: 'user_id',
          dataType: 'VARCHAR',
          dataLength: 64,
          description: '用户ID',
          isPrimaryKey: true
        },
        {
          name: 'action_type',
          dataType: 'VARCHAR',
          dataLength: 20,
          description: '行为类型'
        },
        {
          name: 'page_url',
          dataType: 'VARCHAR',
          dataLength: 512,
          description: '页面URL'
        },
        {
          name: 'action_time',
          dataType: 'DATETIME',
          description: '行为时间'
        }
      ]
    }
  },
  'asset_004': {
    assetId: 'asset_004',
    assetNumber: 'ASSET004',
    assetName: '用户画像数据',
    holderCompany: '数据提供商B',
    participantId: 'ent_002',
    entityName: '数据提供商B',
    intro: '用户标签、画像信息',
    scale: '80万条',
    cycle: '每月更新',
    dataInfo: {
      databaseName: 'profile_db',
      tableName: 'user_profile',
      fieldList: [
        {
          name: 'user_id',
          dataType: 'VARCHAR',
          dataLength: 64,
          description: '用户ID',
          isPrimaryKey: true
        },
        {
          name: 'age',
          dataType: 'INT',
          description: '年龄'
        },
        {
          name: 'gender',
          dataType: 'VARCHAR',
          dataLength: 10,
          description: '性别'
        },
        {
          name: 'city',
          dataType: 'VARCHAR',
          dataLength: 50,
          description: '城市'
        }
      ]
    }
  }
}

// ========== Mock 计算模型 ==========

/** Mock 计算模型 */
export const MOCK_MODELS: Record<string, Array<{ id: string; name: string; type: string }>> = {
  'ent_003': [
    {
      id: 'codebin_v2_001',
      name: 'PSI求交模型V2',
      type: 'CodeBin-V2'
    },
    {
      id: 'codebin_v2_data_clean',
      name: '数据清洗模型',
      type: 'CodeBin-V2'
    },
    {
      id: 'codebin_v2_dp_noise',
      name: '差分隐私噪声模型',
      type: 'CodeBin-V2'
    },
    {
      id: 'codebin_v3_1_001',
      name: 'MPC统计模型V3.1',
      type: 'CodeBin-V3-1'
    },
    {
      id: 'codebin_v3_1_feature',
      name: '特征工程模型',
      type: 'CodeBin-V3-1'
    },
    {
      id: 'codebin_v3_1_sql_agg',
      name: 'SQL聚合计算模型',
      type: 'CodeBin-V3-1'
    },
    {
      id: 'codebin_v3_2_001',
      name: '联邦学习模型V3.2',
      type: 'CodeBin-V3-2'
    },
    {
      id: 'codebin_v3_2_joint_train',
      name: '联合建模训练模型',
      type: 'CodeBin-V3-2'
    },
    {
      id: 'spdz_001',
      name: 'SPDZ计算模型',
      type: 'SPDZ'
    }
  ]
}

// ========== Mock 算力资源 ==========

/** Mock 算力资源 */
export const MOCK_COMPUTE_RESOURCES: Record<string, Array<{
  id: string
  groupId: string
  groupName: string
  nodeId: string
  cardSerial: string
  cardModel: string
}>> = {
  'ent_004': [
    {
      id: 'compute_001',
      groupId: 'group_001',
      groupName: 'TEE算力组A',
      nodeId: 'node_001',
      cardSerial: 'TEE-001-A',
      cardModel: '华为海思TEE板卡'
    },
    {
      id: 'compute_002',
      groupId: 'group_001',
      groupName: 'TEE算力组A',
      nodeId: 'node_002',
      cardSerial: 'TEE-002-A',
      cardModel: '华为海思TEE板卡'
    }
  ]
}

// ========== Mock 字段列表 ==========

/** Mock 字段列表（用于字段选择器） */
export const MOCK_FIELDS = [
  { name: 'user_id', type: 'VARCHAR', length: '64', description: '用户ID' },
  { name: 'name', type: 'VARCHAR', length: '100', description: '姓名' },
  { name: 'age', type: 'INT', length: '', description: '年龄' },
  { name: 'email', type: 'VARCHAR', length: '255', description: '邮箱' },
  { name: 'phone', type: 'VARCHAR', length: '20', description: '电话' },
  { name: 'amount', type: 'DECIMAL', length: '18,2', description: '金额' },
  { name: 'create_time', type: 'DATETIME', length: '', description: '创建时间' }
]

/**
 * 根据 assetId 获取数据资产详情
 */
export function getMockAssetDetail(assetId: string): AssetInfo | undefined {
  return MOCK_ASSET_DETAILS[assetId]
}

/**
 * 根据 participantId 获取企业信息
 */
export function getMockEnterprise(participantId: string): Enterprise | undefined {
  return MOCK_ENTERPRISES.find(ent => ent.participantId === participantId)
}

/**
 * 根据 participantId 获取模型列表
 */
export function getMockModels(participantId: string): Array<{ id: string; name: string; type: string }> {
  return MOCK_MODELS[participantId] || []
}

/**
 * 根据 participantId 获取算力资源列表
 */
export function getMockComputeResources(participantId: string): Array<{
  id: string
  groupId: string
  groupName: string
  nodeId: string
  cardSerial: string
  cardModel: string
  type: string
  cores: number
}> {
  const resources = MOCK_COMPUTE_RESOURCES[participantId] || []
  return resources.map(r => ({
    ...r,
    type: 'TEE_CPU',
    cores: 8
  }))
}
