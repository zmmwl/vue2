import type { Enterprise, AssetInfo, FieldInfo } from '@/types/nodes'

/**
 * Mock 企业列表
 */
export const mockEnterpriseList: Enterprise[] = [
  {
    participantId: 'ent_001',
    entityName: '某某企业',
    enterpriseAssetList: [
      {
        assetId: 'asset_001',
        assetNumber: 'AST-2024-001',
        assetName: '用户行为数据',
        assetEnName: 'user_behavior',
        intro: '用户点击流数据',
        holderCompany: '某某企业'
      },
      {
        assetId: 'asset_002',
        assetNumber: 'AST-2024-002',
        assetName: '交易数据',
        assetEnName: 'transaction',
        intro: '用户交易记录',
        holderCompany: '某某企业'
      }
    ]
  },
  {
    participantId: 'ent_002',
    entityName: '另一企业',
    enterpriseAssetList: [
      {
        assetId: 'asset_003',
        assetNumber: 'AST-2024-003',
        assetName: '产品数据',
        assetEnName: 'product',
        intro: '产品信息数据',
        holderCompany: '另一企业'
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
  'asset_001': {
    assetId: 'asset_001',
    assetNumber: 'AST-2024-001',
    assetName: '用户行为数据',
    assetEnName: 'user_behavior',
    holderCompany: '某某企业',
    participantId: 'ent_001',
    entityName: '某某企业',
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
    holderCompany: '某某企业',
    participantId: 'ent_001',
    entityName: '某某企业',
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
    assetName: '产品数据',
    assetEnName: 'product',
    holderCompany: '另一企业',
    participantId: 'ent_002',
    entityName: '另一企业',
    intro: '产品信息数据',
    scale: '100万条',
    cycle: '每月',
    timeSpan: '2024-01-01 至今',
    dataInfo: {
      databaseName: 'product_db',
      tableName: 'products',
      fieldList: [
        { name: 'product_id', dataType: 'VARCHAR', dataLength: 64, description: '产品 ID', isPrimaryKey: true, privacyQuery: false },
        { name: 'product_name', dataType: 'VARCHAR', dataLength: 128, description: '产品名称', isPrimaryKey: false, privacyQuery: false },
        { name: 'category', dataType: 'VARCHAR', dataLength: 64, description: '产品分类', isPrimaryKey: false, privacyQuery: false },
        { name: 'price', dataType: 'DECIMAL', description: '产品价格', isPrimaryKey: false, privacyQuery: false },
        { name: 'stock', dataType: 'INT', description: '库存数量', isPrimaryKey: false, privacyQuery: false }
      ]
    }
  }
}

/**
 * 大规模字段测试数据（500 个字段）
 */
export const largeFieldList: FieldInfo[] = generateMockFields(500)
