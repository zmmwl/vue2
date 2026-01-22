import type {
  GetEnterpriseListResponse,
  GetAssetListResponse,
  GetAssetResponse
} from '@/types/api'
import { mockEnterpriseList, mockAssetInfoMap } from './assetTestData'

/**
 * Mock API 延迟（模拟网络请求）
 */
function mockDelay(ms: number = 300): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Mock 获取企业列表
 */
export async function mockGetEnterpriseList(): Promise<GetEnterpriseListResponse> {
  await mockDelay(300)

  return {
    code: 0,
    message: 'success',
    data: mockEnterpriseList
  }
}

/**
 * Mock 获取资产列表（按企业过滤）
 */
export async function mockGetAssetList(
  holderCompany: string = '',
  pageNumber: number = 1,
  pageSize: number = 50
): Promise<GetAssetListResponse> {
  await mockDelay(400)

  // 从企业列表中提取所有资产
  let allAssets: any[] = []

  if (holderCompany) {
    // 按企业过滤
    const enterprise = mockEnterpriseList.find(e => e.entityName === holderCompany)
    if (enterprise) {
      allAssets = enterprise.enterpriseAssetList.map(asset => ({
        ...asset,
        scale: '1000万条',
        cycle: '每日',
        participantId: enterprise.participantId,
        entityName: enterprise.entityName,
        dataProductType: 1,
        enterpriseName: enterprise.entityName
      }))
    }
  } else {
    // 返回所有企业的资产
    for (const enterprise of mockEnterpriseList) {
      const assets = enterprise.enterpriseAssetList.map(asset => ({
        ...asset,
        scale: '1000万条',
        cycle: '每日',
        participantId: enterprise.participantId,
        entityName: enterprise.entityName,
        dataProductType: 1,
        enterpriseName: enterprise.entityName
      }))
      allAssets = allAssets.concat(assets)
    }
  }

  const total = allAssets.length
  const startIndex = (pageNumber - 1) * pageSize
  const endIndex = startIndex + pageSize
  const list = allAssets.slice(startIndex, endIndex)

  return {
    code: 200,
    status: 'success',
    msg: null,
    data: {
      pagination: {
        total,
        pageSize,
        pageNumber
      },
      list
    }
  }
}

/**
 * Mock 获取资产详情
 */
export async function mockGetAsset(assetId: string): Promise<GetAssetResponse> {
  await mockDelay(500)

  const assetInfo = mockAssetInfoMap[assetId]

  if (!assetInfo) {
    throw {
      code: 404,
      status: 'failed',
      msg: '数据资产不存在',
      data: null
    }
  }

  return {
    code: 200,
    status: 'success',
    msg: null,
    data: {
      assetInfo
    }
  }
}
