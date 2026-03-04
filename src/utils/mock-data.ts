/**
 * Mock 数据工厂
 * 生成模拟数据，确保与后端接口数据结构一致
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
  },
  // 新增模型提供企业
  {
    participantId: 'ent_bank_001',
    entityName: '工商银行',
    enterpriseAssetList: []
  },
  {
    participantId: 'ent_bank_002',
    entityName: '建设银行',
    enterpriseAssetList: []
  },
  {
    participantId: 'ent_bank_003',
    entityName: '招商银行',
    enterpriseAssetList: []
  },
  {
    participantId: 'ent_insurance_001',
    entityName: '中国人寿保险',
    enterpriseAssetList: []
  },
  {
    participantId: 'ent_fintech_001',
    entityName: '蚂蚁金服',
    enterpriseAssetList: []
  },
  {
    participantId: 'ent_fintech_002',
    entityName: '京东数科',
    enterpriseAssetList: []
  },
  {
    participantId: 'ent_microloan_001',
    entityName: '微粒贷科技',
    enterpriseAssetList: []
  },
  {
    participantId: 'ent_tax_001',
    entityName: '国家税务总局',
    enterpriseAssetList: []
  },
  {
    participantId: 'ent_tax_002',
    entityName: '航天信息股份',
    enterpriseAssetList: []
  },
  {
    participantId: 'ent_gov_001',
    entityName: '民政部',
    enterpriseAssetList: []
  },
  {
    participantId: 'ent_gov_002',
    entityName: '人力资源社会保障部',
    enterpriseAssetList: []
  },
  {
    participantId: 'ent_gov_003',
    entityName: '住房和城乡建设部',
    enterpriseAssetList: []
  },
  {
    participantId: 'ent_gov_004',
    entityName: '医疗保障局',
    enterpriseAssetList: []
  },
  {
    participantId: 'ent_auction_001',
    entityName: '中国拍卖行业协会',
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

/** Mock 计算模型 - CodeBin V2/V3.1/V3.2 算术表达式和业务逻辑模型 */
export const MOCK_MODELS: Record<string, Array<{ id: string; name: string; type: string }>> = {
  // 工商银行 - 3个模型
  'ent_bank_001': [
    { id: 'v2_credit_score_icbc', name: '个人信用评分卡模型', type: 'CodeBin-V2' },
    { id: 'v31_sme_credit_score', name: '中小企业信用评分模型', type: 'CodeBin-V3-1' },
    { id: 'v32_debt_ratio_calc', name: '负债率计算模型', type: 'CodeBin-V3-2' }
  ],
  // 建设银行 - 2个模型
  'ent_bank_002': [
    { id: 'v31_mortgage_score', name: '房贷审批评分模型', type: 'CodeBin-V3-1' },
    { id: 'v32_overdue_risk_score', name: '逾期风险预警模型', type: 'CodeBin-V3-2' }
  ],
  // 招商银行 - 2个模型
  'ent_bank_003': [
    { id: 'v31_card_limit_calc', name: '信用卡额度测算模型', type: 'CodeBin-V3-1' },
    { id: 'v32_car_loan_score', name: '车贷审批评分模型', type: 'CodeBin-V3-2' }
  ],
  // 蚂蚁金服 - 2个模型
  'ent_fintech_001': [
    { id: 'v2_antifraud_score', name: '反欺诈风险评分模型', type: 'CodeBin-V2' },
    { id: 'v31_marketing_response', name: '营销响应评分模型', type: 'CodeBin-V3-1' }
  ],
  // 京东数科 - 2个模型
  'ent_fintech_002': [
    { id: 'v31_user_value_score', name: '用户价值分层模型', type: 'CodeBin-V3-1' },
    { id: 'v32_churn_prediction_score', name: '客户流失风险评分模型', type: 'CodeBin-V3-2' }
  ],
  // 微粒贷科技 - 2个模型
  'ent_microloan_001': [
    { id: 'v2_loan_risk_score', name: '小额贷款风险评分模型', type: 'CodeBin-V2' },
    { id: 'v32_collection_priority', name: '催收优先级评分模型', type: 'CodeBin-V3-2' }
  ],
  // 中国人寿保险 - 3个模型
  'ent_insurance_001': [
    { id: 'v2_insurance_claim_calc', name: '保险理赔金额计算模型', type: 'CodeBin-V2' },
    { id: 'v31_premium_calculation', name: '保费精算模型', type: 'CodeBin-V3-1' },
    { id: 'v32_claim_fraud_detect', name: '理赔欺诈风险评分模型', type: 'CodeBin-V3-2' }
  ],
  // 国家税务总局 - 3个模型
  'ent_tax_001': [
    { id: 'v2_tax_credit_rating', name: '纳税信用评级模型', type: 'CodeBin-V2' },
    { id: 'v2_enterprise_tax_risk', name: '企业税务风险评估模型', type: 'CodeBin-V2' },
    { id: 'v32_vat_refund_calc', name: '增值税退税计算模型', type: 'CodeBin-V3-2' }
  ],
  // 航天信息股份 - 1个模型
  'ent_tax_002': [
    { id: 'v2_invoice_verify', name: '发票真伪核验模型', type: 'CodeBin-V2' }
  ],
  // 民政部 - 2个模型
  'ent_gov_001': [
    { id: 'v2_social_aid_eligibility', name: '社会救助资格评估模型', type: 'CodeBin-V2' },
    { id: 'v31_disaster_aid_calc', name: '灾害救助金计算模型', type: 'CodeBin-V3-1' }
  ],
  // 人力资源社会保障部 - 3个模型
  'ent_gov_002': [
    { id: 'v2_subsidy_calculation', name: '社保补贴计算模型', type: 'CodeBin-V2' },
    { id: 'v31_pension_calculation', name: '养老金计算模型', type: 'CodeBin-V3-1' },
    { id: 'v32_unemployment_calc', name: '失业金计算模型', type: 'CodeBin-V3-2' }
  ],
  // 住房和城乡建设部 - 2个模型
  'ent_gov_003': [
    { id: 'v2_housing_qualified', name: '公租房资格评分模型', type: 'CodeBin-V2' },
    { id: 'v32_property_tax_calc', name: '房产税计算模型', type: 'CodeBin-V3-2' }
  ],
  // 医疗保障局 - 2个模型
  'ent_gov_004': [
    { id: 'v31_medical_reimburse', name: '医保报销计算模型', type: 'CodeBin-V3-1' },
    { id: 'v32_medical_assistance', name: '医疗救助资格评估模型', type: 'CodeBin-V3-2' }
  ],
  // 中国拍卖行业协会 - 1个模型
  'ent_auction_001': [
    { id: 'v31_auction_reserve', name: '拍卖保留价估算模型', type: 'CodeBin-V3-1' }
  ],
  // SPDZ 模型
  'ent_003': [
    { id: 'spdz_001', name: 'SPDZ计算模型', type: 'SPDZ' }
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
