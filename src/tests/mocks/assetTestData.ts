import type { Enterprise, AssetInfo, FieldInfo } from '@/types/nodes'

/**
 * Mock 企业列表
 */
export const mockEnterpriseList: Enterprise[] = [
  // ===== 企业A: 电商平台 =====
  {
    participantId: 'ent_001',
    entityName: '企业A',
    enterpriseAssetList: [
      {
        assetId: 'asset_001',
        assetNumber: 'AST-2024-001',
        assetName: '用户行为数据',
        assetEnName: 'user_behavior',
        intro: '用户点击流数据',
        holderCompany: '企业A'
      },
      {
        assetId: 'asset_002',
        assetNumber: 'AST-2024-002',
        assetName: '交易数据',
        assetEnName: 'transaction',
        intro: '用户交易记录',
        holderCompany: '企业A'
      },
      {
        assetId: 'asset_003',
        assetNumber: 'AST-2024-003',
        assetName: '用户画像数据',
        assetEnName: 'user_profile',
        intro: '用户基本信息与偏好标签',
        holderCompany: '企业A'
      },
      {
        assetId: 'asset_004',
        assetNumber: 'AST-2024-004',
        assetName: '商品库存数据',
        assetEnName: 'inventory',
        intro: '商品库存与供应链数据',
        holderCompany: '企业A'
      },
      {
        assetId: 'asset_005',
        assetNumber: 'AST-2024-005',
        assetName: '营销活动数据',
        assetEnName: 'marketing_campaign',
        intro: '营销活动效果与投放数据',
        holderCompany: '企业A'
      }
    ]
  },
  // ===== 企业B: 金融银行 =====
  {
    participantId: 'ent_002',
    entityName: '企业B',
    enterpriseAssetList: [
      {
        assetId: 'asset_006',
        assetNumber: 'AST-2024-006',
        assetName: '信贷客户数据',
        assetEnName: 'credit_customer',
        intro: '信贷客户基本信息与信用评分',
        holderCompany: '企业B'
      },
      {
        assetId: 'asset_007',
        assetNumber: 'AST-2024-007',
        assetName: '贷款记录数据',
        assetEnName: 'loan_record',
        intro: '贷款申请与还款记录',
        holderCompany: '企业B'
      },
      {
        assetId: 'asset_008',
        assetNumber: 'AST-2024-008',
        assetName: '账户流水数据',
        assetEnName: 'account_flow',
        intro: '银行账户交易流水',
        holderCompany: '企业B'
      },
      {
        assetId: 'asset_009',
        assetNumber: 'AST-2024-009',
        assetName: '风险标记数据',
        assetEnName: 'risk_mark',
        intro: '风险客户标记与预警数据',
        holderCompany: '企业B'
      },
      {
        assetId: 'asset_010',
        assetNumber: 'AST-2024-010',
        assetName: '理财产品数据',
        assetEnName: 'wealth_product',
        intro: '理财产品销售与持有数据',
        holderCompany: '企业B'
      }
    ]
  },
  // ===== 企业C: 税务部门 =====
  {
    participantId: 'ent_003',
    entityName: '企业C',
    enterpriseAssetList: [
      {
        assetId: 'asset_011',
        assetNumber: 'AST-2024-011',
        assetName: '企业纳税数据',
        assetEnName: 'enterprise_tax',
        intro: '企业纳税申报与缴纳记录',
        holderCompany: '企业C'
      },
      {
        assetId: 'asset_012',
        assetNumber: 'AST-2024-012',
        assetName: '发票数据',
        assetEnName: 'invoice',
        intro: '增值税发票开具与抵扣数据',
        holderCompany: '企业C'
      },
      {
        assetId: 'asset_013',
        assetNumber: 'AST-2024-013',
        assetName: '企业工商数据',
        assetEnName: 'business_registry',
        intro: '企业注册与变更信息',
        holderCompany: '企业C'
      },
      {
        assetId: 'asset_014',
        assetNumber: 'AST-2024-014',
        assetName: '税收优惠数据',
        assetEnName: 'tax_incentive',
        intro: '企业享受税收优惠政策记录',
        holderCompany: '企业C'
      },
      {
        assetId: 'asset_015',
        assetNumber: 'AST-2024-015',
        assetName: '出口退税数据',
        assetEnName: 'export_rebate',
        intro: '出口企业退税申报数据',
        holderCompany: '企业C'
      }
    ]
  },
  // ===== 企业D: 社保中心 =====
  {
    participantId: 'ent_004',
    entityName: '企业D',
    enterpriseAssetList: [
      {
        assetId: 'asset_016',
        assetNumber: 'AST-2024-016',
        assetName: '社保缴纳数据',
        assetEnName: 'social_security',
        intro: '企业与个人社保缴纳记录',
        holderCompany: '企业D'
      },
      {
        assetId: 'asset_017',
        assetNumber: 'AST-2024-017',
        assetName: '公积金数据',
        assetEnName: 'housing_fund',
        intro: '住房公积金缴存与提取数据',
        holderCompany: '企业D'
      },
      {
        assetId: 'asset_018',
        assetNumber: 'AST-2024-018',
        assetName: '医保结算数据',
        assetEnName: 'medical_insurance',
        intro: '医疗保险费用结算记录',
        holderCompany: '企业D'
      },
      {
        assetId: 'asset_019',
        assetNumber: 'AST-2024-019',
        assetName: '养老保险数据',
        assetEnName: 'pension',
        intro: '养老保险参保与领取数据',
        holderCompany: '企业D'
      },
      {
        assetId: 'asset_020',
        assetNumber: 'AST-2024-020',
        assetName: '失业保险数据',
        assetEnName: 'unemployment_insurance',
        intro: '失业保险参保与领取数据',
        holderCompany: '企业D'
      }
    ]
  },
  // ===== 企业E: 电信运营商 =====
  {
    participantId: 'ent_005',
    entityName: '企业E',
    enterpriseAssetList: [
      {
        assetId: 'asset_021',
        assetNumber: 'AST-2024-021',
        assetName: '用户话单数据',
        assetEnName: 'call_detail',
        intro: '用户通话记录与时长数据',
        holderCompany: '企业E'
      },
      {
        assetId: 'asset_022',
        assetNumber: 'AST-2024-022',
        assetName: '流量使用数据',
        assetEnName: 'data_usage',
        intro: '用户流量使用与套餐数据',
        holderCompany: '企业E'
      },
      {
        assetId: 'asset_023',
        assetNumber: 'AST-2024-023',
        assetName: '基站位置数据',
        assetEnName: 'base_station',
        intro: '用户基站定位与移动轨迹',
        holderCompany: '企业E'
      },
      {
        assetId: 'asset_024',
        assetNumber: 'AST-2024-024',
        assetName: '短信记录数据',
        assetEnName: 'sms_record',
        intro: '短信发送与接收记录',
        holderCompany: '企业E'
      },
      {
        assetId: 'asset_025',
        assetNumber: 'AST-2024-025',
        assetName: '终端设备数据',
        assetEnName: 'device_info',
        intro: '用户终端设备信息',
        holderCompany: '企业E'
      }
    ]
  },
  // ===== 企业F: 医疗机构 =====
  {
    participantId: 'ent_006',
    entityName: '企业F',
    enterpriseAssetList: [
      {
        assetId: 'asset_026',
        assetNumber: 'AST-2024-026',
        assetName: '门诊就诊数据',
        assetEnName: 'outpatient',
        intro: '门诊挂号与就诊记录',
        holderCompany: '企业F'
      },
      {
        assetId: 'asset_027',
        assetNumber: 'AST-2024-027',
        assetName: '住院记录数据',
        assetEnName: 'hospitalization',
        intro: '住院治疗与出院记录',
        holderCompany: '企业F'
      },
      {
        assetId: 'asset_028',
        assetNumber: 'AST-2024-028',
        assetName: '检验检查数据',
        assetEnName: 'lab_test',
        intro: '医学检验与检查结果',
        holderCompany: '企业F'
      },
      {
        assetId: 'asset_029',
        assetNumber: 'AST-2024-029',
        assetName: '处方用药数据',
        assetEnName: 'prescription',
        intro: '医生处方与用药记录',
        holderCompany: '企业F'
      },
      {
        assetId: 'asset_030',
        assetNumber: 'AST-2024-030',
        assetName: '慢病管理数据',
        assetEnName: 'chronic_disease',
        intro: '慢性病患者随访与管理数据',
        holderCompany: '企业F'
      }
    ]
  }
]

/**
 * 生成 Mock 字段列表
 * @param count 字段数量
 */
export function generateMockFields(count: number): FieldInfo[] {
  const types: string[] = ['VARCHAR', 'INT', 'DATETIME', 'DECIMAL', 'TEXT']
  return Array.from({ length: count }, (_, i) => {
    const type = types[i % types.length] as string
    return {
      name: `field_${i + 1}`,
      dataType: type,
      dataLength: type === 'VARCHAR' ? 64 : undefined,
      description: `字段 ${i + 1} 的描述`,
      isPrimaryKey: i === 0,
      privacyQuery: i % 5 === 0
    }
  })
}

/**
 * Mock 资产详情映射表
 */
export const mockAssetInfoMap: Record<string, AssetInfo> = {
  // ===== 企业A: 电商平台 =====
  'asset_001': {
    assetId: 'asset_001',
    assetNumber: 'AST-2024-001',
    assetName: '用户行为数据',
    assetEnName: 'user_behavior',
    holderCompany: '企业A',
    participantId: 'ent_001',
    entityName: '企业A',
    intro: '用户点击流数据',
    scale: '1000万条',
    cycle: '每日',
    timeSpan: '2024-01-01 至今',
    dataInfo: {
      databaseName: 'user_db',
      tableName: 'user_behavior',
      fieldList: [
        { name: 'user_id', dataType: 'VARCHAR', dataLength: 64, description: '用户 ID', isPrimaryKey: true, privacyQuery: false },
        { name: 'action_time', dataType: 'DATETIME', description: '操作时间', isPrimaryKey: false, privacyQuery: false },
        { name: 'page_url', dataType: 'VARCHAR', dataLength: 512, description: '页面 URL', isPrimaryKey: false, privacyQuery: false },
        { name: 'action_type', dataType: 'VARCHAR', dataLength: 32, description: '操作类型', isPrimaryKey: false, privacyQuery: false },
        { name: 'device_type', dataType: 'VARCHAR', dataLength: 16, description: '设备类型', isPrimaryKey: false, privacyQuery: false },
        { name: 'user_agent', dataType: 'VARCHAR', dataLength: 256, description: '用户代理', isPrimaryKey: false, privacyQuery: false },
        { name: 'ip_address', dataType: 'VARCHAR', dataLength: 64, description: 'IP 地址', isPrimaryKey: false, privacyQuery: true },
        { name: 'session_id', dataType: 'VARCHAR', dataLength: 64, description: '会话 ID', isPrimaryKey: false, privacyQuery: false }
      ]
    }
  },
  'asset_002': {
    assetId: 'asset_002',
    assetNumber: 'AST-2024-002',
    assetName: '交易数据',
    assetEnName: 'transaction',
    holderCompany: '企业A',
    participantId: 'ent_001',
    entityName: '企业A',
    intro: '用户交易记录',
    scale: '500万条',
    cycle: '每周',
    timeSpan: '2023-01-01 至今',
    dataInfo: {
      databaseName: 'trade_db',
      tableName: 'transactions',
      fieldList: [
        { name: 'transaction_id', dataType: 'VARCHAR', dataLength: 64, description: '交易 ID', isPrimaryKey: true, privacyQuery: false },
        { name: 'user_id', dataType: 'VARCHAR', dataLength: 64, description: '用户 ID', isPrimaryKey: false, privacyQuery: false },
        { name: 'amount', dataType: 'DECIMAL', description: '交易金额', isPrimaryKey: false, privacyQuery: true },
        { name: 'currency', dataType: 'VARCHAR', dataLength: 8, description: '货币类型', isPrimaryKey: false, privacyQuery: false },
        { name: 'status', dataType: 'VARCHAR', dataLength: 16, description: '交易状态', isPrimaryKey: false, privacyQuery: false },
        { name: 'created_at', dataType: 'DATETIME', description: '创建时间', isPrimaryKey: false, privacyQuery: false }
      ]
    }
  },
  'asset_003': {
    assetId: 'asset_003',
    assetNumber: 'AST-2024-003',
    assetName: '用户画像数据',
    assetEnName: 'user_profile',
    holderCompany: '企业A',
    participantId: 'ent_001',
    entityName: '企业A',
    intro: '用户基本信息与偏好标签',
    scale: '200万条',
    cycle: '每月',
    timeSpan: '2023-06-01 至今',
    dataInfo: {
      databaseName: 'user_db',
      tableName: 'user_profile',
      fieldList: [
        { name: 'user_id', dataType: 'VARCHAR', dataLength: 64, description: '用户 ID', isPrimaryKey: true, privacyQuery: false },
        { name: 'gender', dataType: 'VARCHAR', dataLength: 8, description: '性别', isPrimaryKey: false, privacyQuery: false },
        { name: 'age_range', dataType: 'VARCHAR', dataLength: 16, description: '年龄段', isPrimaryKey: false, privacyQuery: false },
        { name: 'city', dataType: 'VARCHAR', dataLength: 64, description: '所在城市', isPrimaryKey: false, privacyQuery: false },
        { name: 'member_level', dataType: 'VARCHAR', dataLength: 16, description: '会员等级', isPrimaryKey: false, privacyQuery: false },
        { name: 'preference_tags', dataType: 'VARCHAR', dataLength: 512, description: '偏好标签', isPrimaryKey: false, privacyQuery: false }
      ]
    }
  },
  'asset_004': {
    assetId: 'asset_004',
    assetNumber: 'AST-2024-004',
    assetName: '商品库存数据',
    assetEnName: 'inventory',
    holderCompany: '企业A',
    participantId: 'ent_001',
    entityName: '企业A',
    intro: '商品库存与供应链数据',
    scale: '50万条',
    cycle: '每日',
    timeSpan: '2024-01-01 至今',
    dataInfo: {
      databaseName: 'supply_db',
      tableName: 'inventory',
      fieldList: [
        { name: 'sku_id', dataType: 'VARCHAR', dataLength: 64, description: 'SKU ID', isPrimaryKey: true, privacyQuery: false },
        { name: 'product_name', dataType: 'VARCHAR', dataLength: 128, description: '商品名称', isPrimaryKey: false, privacyQuery: false },
        { name: 'stock_qty', dataType: 'INT', description: '库存数量', isPrimaryKey: false, privacyQuery: false },
        { name: 'warehouse', dataType: 'VARCHAR', dataLength: 64, description: '仓库位置', isPrimaryKey: false, privacyQuery: false },
        { name: 'update_time', dataType: 'DATETIME', description: '更新时间', isPrimaryKey: false, privacyQuery: false }
      ]
    }
  },
  'asset_005': {
    assetId: 'asset_005',
    assetNumber: 'AST-2024-005',
    assetName: '营销活动数据',
    assetEnName: 'marketing_campaign',
    holderCompany: '企业A',
    participantId: 'ent_001',
    entityName: '企业A',
    intro: '营销活动效果与投放数据',
    scale: '100万条',
    cycle: '每日',
    timeSpan: '2024-01-01 至今',
    dataInfo: {
      databaseName: 'marketing_db',
      tableName: 'campaign',
      fieldList: [
        { name: 'campaign_id', dataType: 'VARCHAR', dataLength: 64, description: '活动 ID', isPrimaryKey: true, privacyQuery: false },
        { name: 'campaign_name', dataType: 'VARCHAR', dataLength: 128, description: '活动名称', isPrimaryKey: false, privacyQuery: false },
        { name: 'channel', dataType: 'VARCHAR', dataLength: 32, description: '投放渠道', isPrimaryKey: false, privacyQuery: false },
        { name: 'impressions', dataType: 'INT', description: '曝光量', isPrimaryKey: false, privacyQuery: false },
        { name: 'clicks', dataType: 'INT', description: '点击量', isPrimaryKey: false, privacyQuery: false },
        { name: 'conversions', dataType: 'INT', description: '转化量', isPrimaryKey: false, privacyQuery: false }
      ]
    }
  },
  // ===== 企业B: 金融银行 =====
  'asset_006': {
    assetId: 'asset_006',
    assetNumber: 'AST-2024-006',
    assetName: '信贷客户数据',
    assetEnName: 'credit_customer',
    holderCompany: '企业B',
    participantId: 'ent_002',
    entityName: '企业B',
    intro: '信贷客户基本信息与信用评分',
    scale: '300万条',
    cycle: '每月',
    timeSpan: '2022-01-01 至今',
    dataInfo: {
      databaseName: 'credit_db',
      tableName: 'customer',
      fieldList: [
        { name: 'customer_id', dataType: 'VARCHAR', dataLength: 64, description: '客户 ID', isPrimaryKey: true, privacyQuery: false },
        { name: 'name', dataType: 'VARCHAR', dataLength: 64, description: '姓名', isPrimaryKey: false, privacyQuery: true },
        { name: 'id_card', dataType: 'VARCHAR', dataLength: 18, description: '身份证号', isPrimaryKey: false, privacyQuery: true },
        { name: 'credit_score', dataType: 'INT', description: '信用评分', isPrimaryKey: false, privacyQuery: false },
        { name: 'risk_level', dataType: 'VARCHAR', dataLength: 16, description: '风险等级', isPrimaryKey: false, privacyQuery: false }
      ]
    }
  },
  'asset_007': {
    assetId: 'asset_007',
    assetNumber: 'AST-2024-007',
    assetName: '贷款记录数据',
    assetEnName: 'loan_record',
    holderCompany: '企业B',
    participantId: 'ent_002',
    entityName: '企业B',
    intro: '贷款申请与还款记录',
    scale: '500万条',
    cycle: '每日',
    timeSpan: '2020-01-01 至今',
    dataInfo: {
      databaseName: 'credit_db',
      tableName: 'loan_record',
      fieldList: [
        { name: 'loan_id', dataType: 'VARCHAR', dataLength: 64, description: '贷款 ID', isPrimaryKey: true, privacyQuery: false },
        { name: 'customer_id', dataType: 'VARCHAR', dataLength: 64, description: '客户 ID', isPrimaryKey: false, privacyQuery: false },
        { name: 'loan_amount', dataType: 'DECIMAL', description: '贷款金额', isPrimaryKey: false, privacyQuery: true },
        { name: 'loan_term', dataType: 'INT', description: '贷款期限(月)', isPrimaryKey: false, privacyQuery: false },
        { name: 'interest_rate', dataType: 'DECIMAL', description: '利率', isPrimaryKey: false, privacyQuery: false },
        { name: 'status', dataType: 'VARCHAR', dataLength: 16, description: '贷款状态', isPrimaryKey: false, privacyQuery: false }
      ]
    }
  },
  'asset_008': {
    assetId: 'asset_008',
    assetNumber: 'AST-2024-008',
    assetName: '账户流水数据',
    assetEnName: 'account_flow',
    holderCompany: '企业B',
    participantId: 'ent_002',
    entityName: '企业B',
    intro: '银行账户交易流水',
    scale: '1亿条',
    cycle: '每日',
    timeSpan: '2023-01-01 至今',
    dataInfo: {
      databaseName: 'account_db',
      tableName: 'account_flow',
      fieldList: [
        { name: 'flow_id', dataType: 'VARCHAR', dataLength: 64, description: '流水 ID', isPrimaryKey: true, privacyQuery: false },
        { name: 'account_id', dataType: 'VARCHAR', dataLength: 64, description: '账户 ID', isPrimaryKey: false, privacyQuery: false },
        { name: 'amount', dataType: 'DECIMAL', description: '交易金额', isPrimaryKey: false, privacyQuery: true },
        { name: 'balance', dataType: 'DECIMAL', description: '账户余额', isPrimaryKey: false, privacyQuery: true },
        { name: 'trans_type', dataType: 'VARCHAR', dataLength: 16, description: '交易类型', isPrimaryKey: false, privacyQuery: false },
        { name: 'trans_time', dataType: 'DATETIME', description: '交易时间', isPrimaryKey: false, privacyQuery: false }
      ]
    }
  },
  'asset_009': {
    assetId: 'asset_009',
    assetNumber: 'AST-2024-009',
    assetName: '风险标记数据',
    assetEnName: 'risk_mark',
    holderCompany: '企业B',
    participantId: 'ent_002',
    entityName: '企业B',
    intro: '风险客户标记与预警数据',
    scale: '50万条',
    cycle: '每日',
    timeSpan: '2023-01-01 至今',
    dataInfo: {
      databaseName: 'risk_db',
      tableName: 'risk_mark',
      fieldList: [
        { name: 'mark_id', dataType: 'VARCHAR', dataLength: 64, description: '标记 ID', isPrimaryKey: true, privacyQuery: false },
        { name: 'customer_id', dataType: 'VARCHAR', dataLength: 64, description: '客户 ID', isPrimaryKey: false, privacyQuery: false },
        { name: 'risk_type', dataType: 'VARCHAR', dataLength: 32, description: '风险类型', isPrimaryKey: false, privacyQuery: false },
        { name: 'risk_level', dataType: 'VARCHAR', dataLength: 16, description: '风险等级', isPrimaryKey: false, privacyQuery: false },
        { name: 'mark_time', dataType: 'DATETIME', description: '标记时间', isPrimaryKey: false, privacyQuery: false }
      ]
    }
  },
  'asset_010': {
    assetId: 'asset_010',
    assetNumber: 'AST-2024-010',
    assetName: '理财产品数据',
    assetEnName: 'wealth_product',
    holderCompany: '企业B',
    participantId: 'ent_002',
    entityName: '企业B',
    intro: '理财产品销售与持有数据',
    scale: '200万条',
    cycle: '每日',
    timeSpan: '2023-01-01 至今',
    dataInfo: {
      databaseName: 'wealth_db',
      tableName: 'product_holding',
      fieldList: [
        { name: 'holding_id', dataType: 'VARCHAR', dataLength: 64, description: '持有 ID', isPrimaryKey: true, privacyQuery: false },
        { name: 'customer_id', dataType: 'VARCHAR', dataLength: 64, description: '客户 ID', isPrimaryKey: false, privacyQuery: false },
        { name: 'product_code', dataType: 'VARCHAR', dataLength: 32, description: '产品代码', isPrimaryKey: false, privacyQuery: false },
        { name: 'holding_amount', dataType: 'DECIMAL', description: '持有金额', isPrimaryKey: false, privacyQuery: true },
        { name: 'purchase_date', dataType: 'DATE', description: '购买日期', isPrimaryKey: false, privacyQuery: false }
      ]
    }
  },
  // ===== 企业C: 税务部门 =====
  'asset_011': {
    assetId: 'asset_011',
    assetNumber: 'AST-2024-011',
    assetName: '企业纳税数据',
    assetEnName: 'enterprise_tax',
    holderCompany: '企业C',
    participantId: 'ent_003',
    entityName: '企业C',
    intro: '企业纳税申报与缴纳记录',
    scale: '500万条',
    cycle: '每月',
    timeSpan: '2018-01-01 至今',
    dataInfo: {
      databaseName: 'tax_db',
      tableName: 'enterprise_tax',
      fieldList: [
        { name: 'tax_id', dataType: 'VARCHAR', dataLength: 64, description: '纳税记录 ID', isPrimaryKey: true, privacyQuery: false },
        { name: 'enterprise_code', dataType: 'VARCHAR', dataLength: 18, description: '企业统一社会信用代码', isPrimaryKey: false, privacyQuery: false },
        { name: 'tax_type', dataType: 'VARCHAR', dataLength: 32, description: '税种', isPrimaryKey: false, privacyQuery: false },
        { name: 'tax_amount', dataType: 'DECIMAL', description: '应纳税额', isPrimaryKey: false, privacyQuery: true },
        { name: 'paid_amount', dataType: 'DECIMAL', description: '实缴税额', isPrimaryKey: false, privacyQuery: true },
        { name: 'tax_period', dataType: 'VARCHAR', dataLength: 8, description: '税款所属期', isPrimaryKey: false, privacyQuery: false }
      ]
    }
  },
  'asset_012': {
    assetId: 'asset_012',
    assetNumber: 'AST-2024-012',
    assetName: '发票数据',
    assetEnName: 'invoice',
    holderCompany: '企业C',
    participantId: 'ent_003',
    entityName: '企业C',
    intro: '增值税发票开具与抵扣数据',
    scale: '5000万条',
    cycle: '每日',
    timeSpan: '2020-01-01 至今',
    dataInfo: {
      databaseName: 'invoice_db',
      tableName: 'invoice',
      fieldList: [
        { name: 'invoice_id', dataType: 'VARCHAR', dataLength: 64, description: '发票 ID', isPrimaryKey: true, privacyQuery: false },
        { name: 'invoice_code', dataType: 'VARCHAR', dataLength: 20, description: '发票代码', isPrimaryKey: false, privacyQuery: false },
        { name: 'invoice_no', dataType: 'VARCHAR', dataLength: 8, description: '发票号码', isPrimaryKey: false, privacyQuery: false },
        { name: 'seller_code', dataType: 'VARCHAR', dataLength: 18, description: '销方税号', isPrimaryKey: false, privacyQuery: false },
        { name: 'buyer_code', dataType: 'VARCHAR', dataLength: 18, description: '购方税号', isPrimaryKey: false, privacyQuery: false },
        { name: 'amount', dataType: 'DECIMAL', description: '金额', isPrimaryKey: false, privacyQuery: true },
        { name: 'tax_amount', dataType: 'DECIMAL', description: '税额', isPrimaryKey: false, privacyQuery: true }
      ]
    }
  },
  'asset_013': {
    assetId: 'asset_013',
    assetNumber: 'AST-2024-013',
    assetName: '企业工商数据',
    assetEnName: 'business_registry',
    holderCompany: '企业C',
    participantId: 'ent_003',
    entityName: '企业C',
    intro: '企业注册与变更信息',
    scale: '1000万条',
    cycle: '每月',
    timeSpan: '2010-01-01 至今',
    dataInfo: {
      databaseName: 'business_db',
      tableName: 'enterprise_info',
      fieldList: [
        { name: 'enterprise_code', dataType: 'VARCHAR', dataLength: 18, description: '统一社会信用代码', isPrimaryKey: true, privacyQuery: false },
        { name: 'enterprise_name', dataType: 'VARCHAR', dataLength: 128, description: '企业名称', isPrimaryKey: false, privacyQuery: false },
        { name: 'legal_person', dataType: 'VARCHAR', dataLength: 32, description: '法定代表人', isPrimaryKey: false, privacyQuery: true },
        { name: 'register_capital', dataType: 'DECIMAL', description: '注册资本', isPrimaryKey: false, privacyQuery: false },
        { name: 'establish_date', dataType: 'DATE', description: '成立日期', isPrimaryKey: false, privacyQuery: false },
        { name: 'business_status', dataType: 'VARCHAR', dataLength: 16, description: '经营状态', isPrimaryKey: false, privacyQuery: false }
      ]
    }
  },
  'asset_014': {
    assetId: 'asset_014',
    assetNumber: 'AST-2024-014',
    assetName: '税收优惠数据',
    assetEnName: 'tax_incentive',
    holderCompany: '企业C',
    participantId: 'ent_003',
    entityName: '企业C',
    intro: '企业享受税收优惠政策记录',
    scale: '200万条',
    cycle: '每月',
    timeSpan: '2018-01-01 至今',
    dataInfo: {
      databaseName: 'tax_db',
      tableName: 'tax_incentive',
      fieldList: [
        { name: 'incentive_id', dataType: 'VARCHAR', dataLength: 64, description: '优惠记录 ID', isPrimaryKey: true, privacyQuery: false },
        { name: 'enterprise_code', dataType: 'VARCHAR', dataLength: 18, description: '企业统一社会信用代码', isPrimaryKey: false, privacyQuery: false },
        { name: 'incentive_type', dataType: 'VARCHAR', dataLength: 64, description: '优惠类型', isPrimaryKey: false, privacyQuery: false },
        { name: 'incentive_rate', dataType: 'DECIMAL', description: '优惠税率', isPrimaryKey: false, privacyQuery: false },
        { name: 'start_date', dataType: 'DATE', description: '起始日期', isPrimaryKey: false, privacyQuery: false },
        { name: 'end_date', dataType: 'DATE', description: '截止日期', isPrimaryKey: false, privacyQuery: false }
      ]
    }
  },
  'asset_015': {
    assetId: 'asset_015',
    assetNumber: 'AST-2024-015',
    assetName: '出口退税数据',
    assetEnName: 'export_rebate',
    holderCompany: '企业C',
    participantId: 'ent_003',
    entityName: '企业C',
    intro: '出口企业退税申报数据',
    scale: '100万条',
    cycle: '每月',
    timeSpan: '2018-01-01 至今',
    dataInfo: {
      databaseName: 'tax_db',
      tableName: 'export_rebate',
      fieldList: [
        { name: 'rebate_id', dataType: 'VARCHAR', dataLength: 64, description: '退税记录 ID', isPrimaryKey: true, privacyQuery: false },
        { name: 'enterprise_code', dataType: 'VARCHAR', dataLength: 18, description: '企业统一社会信用代码', isPrimaryKey: false, privacyQuery: false },
        { name: 'export_amount', dataType: 'DECIMAL', description: '出口金额(美元)', isPrimaryKey: false, privacyQuery: true },
        { name: 'rebate_amount', dataType: 'DECIMAL', description: '退税金额', isPrimaryKey: false, privacyQuery: true },
        { name: 'declare_date', dataType: 'DATE', description: '申报日期', isPrimaryKey: false, privacyQuery: false }
      ]
    }
  },
  // ===== 企业D: 社保中心 =====
  'asset_016': {
    assetId: 'asset_016',
    assetNumber: 'AST-2024-016',
    assetName: '社保缴纳数据',
    assetEnName: 'social_security',
    holderCompany: '企业D',
    participantId: 'ent_004',
    entityName: '企业D',
    intro: '企业与个人社保缴纳记录',
    scale: '3000万条',
    cycle: '每月',
    timeSpan: '2015-01-01 至今',
    dataInfo: {
      databaseName: 'social_db',
      tableName: 'social_security',
      fieldList: [
        { name: 'record_id', dataType: 'VARCHAR', dataLength: 64, description: '缴纳记录 ID', isPrimaryKey: true, privacyQuery: false },
        { name: 'person_id', dataType: 'VARCHAR', dataLength: 64, description: '个人 ID', isPrimaryKey: false, privacyQuery: false },
        { name: 'enterprise_code', dataType: 'VARCHAR', dataLength: 18, description: '企业统一社会信用代码', isPrimaryKey: false, privacyQuery: false },
        { name: 'base_amount', dataType: 'DECIMAL', description: '缴费基数', isPrimaryKey: false, privacyQuery: true },
        { name: 'person_amount', dataType: 'DECIMAL', description: '个人缴纳金额', isPrimaryKey: false, privacyQuery: true },
        { name: 'company_amount', dataType: 'DECIMAL', description: '企业缴纳金额', isPrimaryKey: false, privacyQuery: true }
      ]
    }
  },
  'asset_017': {
    assetId: 'asset_017',
    assetNumber: 'AST-2024-017',
    assetName: '公积金数据',
    assetEnName: 'housing_fund',
    holderCompany: '企业D',
    participantId: 'ent_004',
    entityName: '企业D',
    intro: '住房公积金缴存与提取数据',
    scale: '2000万条',
    cycle: '每月',
    timeSpan: '2015-01-01 至今',
    dataInfo: {
      databaseName: 'fund_db',
      tableName: 'housing_fund',
      fieldList: [
        { name: 'record_id', dataType: 'VARCHAR', dataLength: 64, description: '公积金记录 ID', isPrimaryKey: true, privacyQuery: false },
        { name: 'person_id', dataType: 'VARCHAR', dataLength: 64, description: '个人 ID', isPrimaryKey: false, privacyQuery: false },
        { name: 'account_balance', dataType: 'DECIMAL', description: '账户余额', isPrimaryKey: false, privacyQuery: true },
        { name: 'monthly_deposit', dataType: 'DECIMAL', description: '月缴存额', isPrimaryKey: false, privacyQuery: true },
        { name: 'deposit_ratio', dataType: 'DECIMAL', description: '缴存比例', isPrimaryKey: false, privacyQuery: false }
      ]
    }
  },
  'asset_018': {
    assetId: 'asset_018',
    assetNumber: 'AST-2024-018',
    assetName: '医保结算数据',
    assetEnName: 'medical_insurance',
    holderCompany: '企业D',
    participantId: 'ent_004',
    entityName: '企业D',
    intro: '医疗保险费用结算记录',
    scale: '1亿条',
    cycle: '每日',
    timeSpan: '2018-01-01 至今',
    dataInfo: {
      databaseName: 'medical_db',
      tableName: 'insurance_settlement',
      fieldList: [
        { name: 'settlement_id', dataType: 'VARCHAR', dataLength: 64, description: '结算 ID', isPrimaryKey: true, privacyQuery: false },
        { name: 'person_id', dataType: 'VARCHAR', dataLength: 64, description: '个人 ID', isPrimaryKey: false, privacyQuery: false },
        { name: 'hospital_code', dataType: 'VARCHAR', dataLength: 32, description: '医疗机构代码', isPrimaryKey: false, privacyQuery: false },
        { name: 'total_fee', dataType: 'DECIMAL', description: '总费用', isPrimaryKey: false, privacyQuery: true },
        { name: 'insurance_pay', dataType: 'DECIMAL', description: '医保支付', isPrimaryKey: false, privacyQuery: true },
        { name: 'personal_pay', dataType: 'DECIMAL', description: '个人支付', isPrimaryKey: false, privacyQuery: true }
      ]
    }
  },
  'asset_019': {
    assetId: 'asset_019',
    assetNumber: 'AST-2024-019',
    assetName: '养老保险数据',
    assetEnName: 'pension',
    holderCompany: '企业D',
    participantId: 'ent_004',
    entityName: '企业D',
    intro: '养老保险参保与领取数据',
    scale: '1000万条',
    cycle: '每月',
    timeSpan: '2010-01-01 至今',
    dataInfo: {
      databaseName: 'pension_db',
      tableName: 'pension',
      fieldList: [
        { name: 'record_id', dataType: 'VARCHAR', dataLength: 64, description: '养老记录 ID', isPrimaryKey: true, privacyQuery: false },
        { name: 'person_id', dataType: 'VARCHAR', dataLength: 64, description: '个人 ID', isPrimaryKey: false, privacyQuery: false },
        { name: 'pension_type', dataType: 'VARCHAR', dataLength: 16, description: '养老类型', isPrimaryKey: false, privacyQuery: false },
        { name: 'monthly_pension', dataType: 'DECIMAL', description: '月养老金', isPrimaryKey: false, privacyQuery: true },
        { name: 'start_date', dataType: 'DATE', description: '领取起始日期', isPrimaryKey: false, privacyQuery: false }
      ]
    }
  },
  'asset_020': {
    assetId: 'asset_020',
    assetNumber: 'AST-2024-020',
    assetName: '失业保险数据',
    assetEnName: 'unemployment_insurance',
    holderCompany: '企业D',
    participantId: 'ent_004',
    entityName: '企业D',
    intro: '失业保险参保与领取数据',
    scale: '500万条',
    cycle: '每月',
    timeSpan: '2015-01-01 至今',
    dataInfo: {
      databaseName: 'unemploy_db',
      tableName: 'unemployment',
      fieldList: [
        { name: 'record_id', dataType: 'VARCHAR', dataLength: 64, description: '失业保险记录 ID', isPrimaryKey: true, privacyQuery: false },
        { name: 'person_id', dataType: 'VARCHAR', dataLength: 64, description: '个人 ID', isPrimaryKey: false, privacyQuery: false },
        { name: 'unemploy_reason', dataType: 'VARCHAR', dataLength: 32, description: '失业原因', isPrimaryKey: false, privacyQuery: false },
        { name: 'monthly_benefit', dataType: 'DECIMAL', description: '月失业金', isPrimaryKey: false, privacyQuery: true },
        { name: 'benefit_months', dataType: 'INT', description: '领取月数', isPrimaryKey: false, privacyQuery: false }
      ]
    }
  },
  // ===== 企业E: 电信运营商 =====
  'asset_021': {
    assetId: 'asset_021',
    assetNumber: 'AST-2024-021',
    assetName: '用户话单数据',
    assetEnName: 'call_detail',
    holderCompany: '企业E',
    participantId: 'ent_005',
    entityName: '企业E',
    intro: '用户通话记录与时长数据',
    scale: '10亿条',
    cycle: '每日',
    timeSpan: '2023-01-01 至今',
    dataInfo: {
      databaseName: 'telecom_db',
      tableName: 'call_detail',
      fieldList: [
        { name: 'cdr_id', dataType: 'VARCHAR', dataLength: 64, description: '话单 ID', isPrimaryKey: true, privacyQuery: false },
        { name: 'caller_number', dataType: 'VARCHAR', dataLength: 11, description: '主叫号码', isPrimaryKey: false, privacyQuery: true },
        { name: 'called_number', dataType: 'VARCHAR', dataLength: 11, description: '被叫号码', isPrimaryKey: false, privacyQuery: true },
        { name: 'call_duration', dataType: 'INT', description: '通话时长(秒)', isPrimaryKey: false, privacyQuery: false },
        { name: 'call_time', dataType: 'DATETIME', description: '通话时间', isPrimaryKey: false, privacyQuery: false }
      ]
    }
  },
  'asset_022': {
    assetId: 'asset_022',
    assetNumber: 'AST-2024-022',
    assetName: '流量使用数据',
    assetEnName: 'data_usage',
    holderCompany: '企业E',
    participantId: 'ent_005',
    entityName: '企业E',
    intro: '用户流量使用与套餐数据',
    scale: '5000万条',
    cycle: '每日',
    timeSpan: '2023-01-01 至今',
    dataInfo: {
      databaseName: 'telecom_db',
      tableName: 'data_usage',
      fieldList: [
        { name: 'usage_id', dataType: 'VARCHAR', dataLength: 64, description: '使用记录 ID', isPrimaryKey: true, privacyQuery: false },
        { name: 'user_number', dataType: 'VARCHAR', dataLength: 11, description: '用户号码', isPrimaryKey: false, privacyQuery: true },
        { name: 'data_volume', dataType: 'BIGINT', description: '流量使用量(MB)', isPrimaryKey: false, privacyQuery: false },
        { name: 'package_name', dataType: 'VARCHAR', dataLength: 64, description: '套餐名称', isPrimaryKey: false, privacyQuery: false },
        { name: 'usage_date', dataType: 'DATE', description: '使用日期', isPrimaryKey: false, privacyQuery: false }
      ]
    }
  },
  'asset_023': {
    assetId: 'asset_023',
    assetNumber: 'AST-2024-023',
    assetName: '基站位置数据',
    assetEnName: 'base_station',
    holderCompany: '企业E',
    participantId: 'ent_005',
    entityName: '企业E',
    intro: '用户基站定位与移动轨迹',
    scale: '5亿条',
    cycle: '每小时',
    timeSpan: '2024-01-01 至今',
    dataInfo: {
      databaseName: 'location_db',
      tableName: 'base_station',
      fieldList: [
        { name: 'location_id', dataType: 'VARCHAR', dataLength: 64, description: '定位记录 ID', isPrimaryKey: true, privacyQuery: false },
        { name: 'user_number', dataType: 'VARCHAR', dataLength: 11, description: '用户号码', isPrimaryKey: false, privacyQuery: true },
        { name: 'station_id', dataType: 'VARCHAR', dataLength: 32, description: '基站 ID', isPrimaryKey: false, privacyQuery: false },
        { name: 'latitude', dataType: 'DECIMAL', description: '纬度', isPrimaryKey: false, privacyQuery: true },
        { name: 'longitude', dataType: 'DECIMAL', description: '经度', isPrimaryKey: false, privacyQuery: true },
        { name: 'record_time', dataType: 'DATETIME', description: '记录时间', isPrimaryKey: false, privacyQuery: false }
      ]
    }
  },
  'asset_024': {
    assetId: 'asset_024',
    assetNumber: 'AST-2024-024',
    assetName: '短信记录数据',
    assetEnName: 'sms_record',
    holderCompany: '企业E',
    participantId: 'ent_005',
    entityName: '企业E',
    intro: '短信发送与接收记录',
    scale: '20亿条',
    cycle: '每日',
    timeSpan: '2023-01-01 至今',
    dataInfo: {
      databaseName: 'sms_db',
      tableName: 'sms_record',
      fieldList: [
        { name: 'sms_id', dataType: 'VARCHAR', dataLength: 64, description: '短信 ID', isPrimaryKey: true, privacyQuery: false },
        { name: 'sender_number', dataType: 'VARCHAR', dataLength: 11, description: '发送方号码', isPrimaryKey: false, privacyQuery: true },
        { name: 'receiver_number', dataType: 'VARCHAR', dataLength: 11, description: '接收方号码', isPrimaryKey: false, privacyQuery: true },
        { name: 'sms_type', dataType: 'VARCHAR', dataLength: 16, description: '短信类型', isPrimaryKey: false, privacyQuery: false },
        { name: 'send_time', dataType: 'DATETIME', description: '发送时间', isPrimaryKey: false, privacyQuery: false }
      ]
    }
  },
  'asset_025': {
    assetId: 'asset_025',
    assetNumber: 'AST-2024-025',
    assetName: '终端设备数据',
    assetEnName: 'device_info',
    holderCompany: '企业E',
    participantId: 'ent_005',
    entityName: '企业E',
    intro: '用户终端设备信息',
    scale: '3000万条',
    cycle: '每月',
    timeSpan: '2023-01-01 至今',
    dataInfo: {
      databaseName: 'device_db',
      tableName: 'device_info',
      fieldList: [
        { name: 'device_id', dataType: 'VARCHAR', dataLength: 64, description: '设备 ID', isPrimaryKey: true, privacyQuery: false },
        { name: 'user_number', dataType: 'VARCHAR', dataLength: 11, description: '用户号码', isPrimaryKey: false, privacyQuery: true },
        { name: 'device_brand', dataType: 'VARCHAR', dataLength: 32, description: '设备品牌', isPrimaryKey: false, privacyQuery: false },
        { name: 'device_model', dataType: 'VARCHAR', dataLength: 64, description: '设备型号', isPrimaryKey: false, privacyQuery: false },
        { name: 'os_version', dataType: 'VARCHAR', dataLength: 32, description: '系统版本', isPrimaryKey: false, privacyQuery: false }
      ]
    }
  },
  // ===== 企业F: 医疗机构 =====
  'asset_026': {
    assetId: 'asset_026',
    assetNumber: 'AST-2024-026',
    assetName: '门诊就诊数据',
    assetEnName: 'outpatient',
    holderCompany: '企业F',
    participantId: 'ent_006',
    entityName: '企业F',
    intro: '门诊挂号与就诊记录',
    scale: '2000万条',
    cycle: '每日',
    timeSpan: '2020-01-01 至今',
    dataInfo: {
      databaseName: 'medical_db',
      tableName: 'outpatient',
      fieldList: [
        { name: 'visit_id', dataType: 'VARCHAR', dataLength: 64, description: '就诊 ID', isPrimaryKey: true, privacyQuery: false },
        { name: 'patient_id', dataType: 'VARCHAR', dataLength: 64, description: '患者 ID', isPrimaryKey: false, privacyQuery: false },
        { name: 'patient_name', dataType: 'VARCHAR', dataLength: 32, description: '患者姓名', isPrimaryKey: false, privacyQuery: true },
        { name: 'dept_name', dataType: 'VARCHAR', dataLength: 64, description: '科室名称', isPrimaryKey: false, privacyQuery: false },
        { name: 'doctor_name', dataType: 'VARCHAR', dataLength: 32, description: '医生姓名', isPrimaryKey: false, privacyQuery: false },
        { name: 'visit_date', dataType: 'DATETIME', description: '就诊时间', isPrimaryKey: false, privacyQuery: false },
        { name: 'diagnosis', dataType: 'VARCHAR', dataLength: 256, description: '诊断结果', isPrimaryKey: false, privacyQuery: true }
      ]
    }
  },
  'asset_027': {
    assetId: 'asset_027',
    assetNumber: 'AST-2024-027',
    assetName: '住院记录数据',
    assetEnName: 'hospitalization',
    holderCompany: '企业F',
    participantId: 'ent_006',
    entityName: '企业F',
    intro: '住院治疗与出院记录',
    scale: '500万条',
    cycle: '每日',
    timeSpan: '2018-01-01 至今',
    dataInfo: {
      databaseName: 'medical_db',
      tableName: 'hospitalization',
      fieldList: [
        { name: 'admission_id', dataType: 'VARCHAR', dataLength: 64, description: '住院 ID', isPrimaryKey: true, privacyQuery: false },
        { name: 'patient_id', dataType: 'VARCHAR', dataLength: 64, description: '患者 ID', isPrimaryKey: false, privacyQuery: false },
        { name: 'admission_date', dataType: 'DATETIME', description: '入院日期', isPrimaryKey: false, privacyQuery: false },
        { name: 'discharge_date', dataType: 'DATETIME', description: '出院日期', isPrimaryKey: false, privacyQuery: false },
        { name: 'dept_name', dataType: 'VARCHAR', dataLength: 64, description: '住院科室', isPrimaryKey: false, privacyQuery: false },
        { name: 'diagnosis', dataType: 'VARCHAR', dataLength: 256, description: '出院诊断', isPrimaryKey: false, privacyQuery: true }
      ]
    }
  },
  'asset_028': {
    assetId: 'asset_028',
    assetNumber: 'AST-2024-028',
    assetName: '检验检查数据',
    assetEnName: 'lab_test',
    holderCompany: '企业F',
    participantId: 'ent_006',
    entityName: '企业F',
    intro: '医学检验与检查结果',
    scale: '1亿条',
    cycle: '每日',
    timeSpan: '2018-01-01 至今',
    dataInfo: {
      databaseName: 'lab_db',
      tableName: 'lab_test',
      fieldList: [
        { name: 'test_id', dataType: 'VARCHAR', dataLength: 64, description: '检验 ID', isPrimaryKey: true, privacyQuery: false },
        { name: 'patient_id', dataType: 'VARCHAR', dataLength: 64, description: '患者 ID', isPrimaryKey: false, privacyQuery: false },
        { name: 'test_type', dataType: 'VARCHAR', dataLength: 32, description: '检验类型', isPrimaryKey: false, privacyQuery: false },
        { name: 'test_item', dataType: 'VARCHAR', dataLength: 64, description: '检验项目', isPrimaryKey: false, privacyQuery: false },
        { name: 'result_value', dataType: 'VARCHAR', dataLength: 64, description: '检验结果', isPrimaryKey: false, privacyQuery: true },
        { name: 'test_date', dataType: 'DATETIME', description: '检验日期', isPrimaryKey: false, privacyQuery: false }
      ]
    }
  },
  'asset_029': {
    assetId: 'asset_029',
    assetNumber: 'AST-2024-029',
    assetName: '处方用药数据',
    assetEnName: 'prescription',
    holderCompany: '企业F',
    participantId: 'ent_006',
    entityName: '企业F',
    intro: '医生处方与用药记录',
    scale: '5000万条',
    cycle: '每日',
    timeSpan: '2018-01-01 至今',
    dataInfo: {
      databaseName: 'prescription_db',
      tableName: 'prescription',
      fieldList: [
        { name: 'prescription_id', dataType: 'VARCHAR', dataLength: 64, description: '处方 ID', isPrimaryKey: true, privacyQuery: false },
        { name: 'patient_id', dataType: 'VARCHAR', dataLength: 64, description: '患者 ID', isPrimaryKey: false, privacyQuery: false },
        { name: 'drug_name', dataType: 'VARCHAR', dataLength: 128, description: '药品名称', isPrimaryKey: false, privacyQuery: false },
        { name: 'dosage', dataType: 'VARCHAR', dataLength: 32, description: '剂量', isPrimaryKey: false, privacyQuery: false },
        { name: 'frequency', dataType: 'VARCHAR', dataLength: 32, description: '用药频次', isPrimaryKey: false, privacyQuery: false },
        { name: 'prescribe_date', dataType: 'DATETIME', description: '开方日期', isPrimaryKey: false, privacyQuery: false }
      ]
    }
  },
  'asset_030': {
    assetId: 'asset_030',
    assetNumber: 'AST-2024-030',
    assetName: '慢病管理数据',
    assetEnName: 'chronic_disease',
    holderCompany: '企业F',
    participantId: 'ent_006',
    entityName: '企业F',
    intro: '慢性病患者随访与管理数据',
    scale: '300万条',
    cycle: '每月',
    timeSpan: '2018-01-01 至今',
    dataInfo: {
      databaseName: 'chronic_db',
      tableName: 'chronic_disease',
      fieldList: [
        { name: 'record_id', dataType: 'VARCHAR', dataLength: 64, description: '档案 ID', isPrimaryKey: true, privacyQuery: false },
        { name: 'patient_id', dataType: 'VARCHAR', dataLength: 64, description: '患者 ID', isPrimaryKey: false, privacyQuery: false },
        { name: 'disease_type', dataType: 'VARCHAR', dataLength: 32, description: '慢病类型', isPrimaryKey: false, privacyQuery: false },
        { name: 'diagnosis_date', dataType: 'DATE', description: '确诊日期', isPrimaryKey: false, privacyQuery: false },
        { name: 'follow_up_date', dataType: 'DATE', description: '随访日期', isPrimaryKey: false, privacyQuery: false },
        { name: 'health_status', dataType: 'VARCHAR', dataLength: 32, description: '健康状况', isPrimaryKey: false, privacyQuery: false }
      ]
    }
  }
}

/**
 * 大规模字段测试数据（500 个字段）
 */
export const largeFieldList: FieldInfo[] = generateMockFields(500)
