/**
 * 企业数据服务
 * 根据 VITE_USE_MOCK 环境变量自动切换 Mock/生产数据
 */

import { MOCK_ENTERPRISES } from '@/utils/mock-data'
import type { Enterprise } from '@/types/nodes'
import { logger } from '@/utils/logger'

/**
 * 判断是否使用 Mock 数据
 */
function isMockMode(): boolean {
  // 优先使用环境变量，默认为 true（开发环境）
  const useMock = import.meta.env.VITE_USE_MOCK
  if (useMock !== undefined) {
    return useMock === 'true'
  }
  // 默认使用 Mock 模式
  return true
}

/**
 * 获取企业列表
 * Mock 模式：返回本地 Mock 数据
 * 生产模式：调用后端 API
 */
export async function getEnterpriseList(): Promise<Enterprise[]> {
  if (isMockMode()) {
    logger.info('[enterpriseService] Using MOCK data for enterprise list')
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 100))
    return MOCK_ENTERPRISES
  }

  // 生产模式：调用真实 API
  logger.info('[enterpriseService] Fetching from REAL API')
  // TODO: 实现真实的 API 调用
  // const response = await fetch('/api/enterprises')
  // const data = await response.json()
  // return data.enterprises

  // 暂时返回空数组，待实现真实 API
  logger.warn('[enterpriseService] Real API not implemented yet, returning empty array')
  return []
}

/**
 * 根据 participantId 获取企业信息
 */
export async function getEnterpriseById(participantId: string): Promise<Enterprise | undefined> {
  const enterprises = await getEnterpriseList()
  return enterprises.find(ent => ent.participantId === participantId)
}

/**
 * 获取指定类型的企业列表
 * @param resourceType 资源类型 - 'data' | 'model' | 'compute'
 */
export async function getEnterprisesByResourceType(resourceType: 'data' | 'model' | 'compute'): Promise<Enterprise[]> {
  const enterprises = await getEnterpriseList()

  // 根据资源类型过滤
  if (resourceType === 'data') {
    // 有数据资产的企业
    return enterprises.filter(ent => ent.enterpriseAssetList && ent.enterpriseAssetList.length > 0)
  } else if (resourceType === 'model') {
    // 有模型的企业 - 当前 Mock 数据中 ent_003 是模型提供商
    return enterprises.filter(ent => ent.participantId === 'ent_003')
  } else if (resourceType === 'compute') {
    // 有算力的企业 - 当前 Mock 数据中 ent_004 是算力提供商
    return enterprises.filter(ent => ent.participantId === 'ent_004')
  }

  return []
}
