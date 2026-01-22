import type {
  GetAssetListResponse,
  GetAssetListRequest,
  GetAssetRequest
} from '@/types/api'
import type { Enterprise, AssetInfo } from '@/types/nodes'
import { logger } from '@/utils/logger'

/**
 * API 配置
 */
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,  // 10 秒超时
  maxRetries: 3,   // 最大重试次数
}

/**
 * 错误类型枚举
 */
enum ErrorType {
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  AUTHENTICATION = 'authentication',
  PERMISSION = 'permission',
  NOT_FOUND = 'not_found',
  BUSINESS = 'business',
  SERVER = 'server'
}

/**
 * 分类错误类型
 */
function classifyError(error: any): ErrorType {
  // 网络错误
  if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
    return ErrorType.NETWORK
  }

  // 超时错误
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return ErrorType.TIMEOUT
  }

  // HTTP 状态码错误
  if (error.response) {
    const status = error.response.status
    if (status === 401) return ErrorType.AUTHENTICATION
    if (status === 403) return ErrorType.PERMISSION
    if (status === 404) return ErrorType.NOT_FOUND
    if (status >= 400 && status < 500) return ErrorType.BUSINESS
    if (status >= 500) return ErrorType.SERVER
  }

  // 默认为网络错误
  return ErrorType.NETWORK
}

/**
 * 判断错误是否可重试
 */
function isRetryable(errorType: ErrorType): boolean {
  return [ErrorType.NETWORK, ErrorType.TIMEOUT, ErrorType.SERVER].includes(errorType)
}

/**
 * 睡眠函数
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 带重试的请求封装
 * TODO: 在真实 API 实现时使用此函数包装所有 API 请求
 * @ts-expect-error - 暂时未使用，保留供未来实现
 */
async function fetchWithRetry<T>(
  requestFn: () => Promise<T>,
  context: string
): Promise<T> {
  let lastError: any
  const maxRetries = API_CONFIG.maxRetries
  const retryDelay = 1000  // 初始重试延迟 1 秒

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await requestFn()
      if (attempt > 0) {
        logger.info(`${context} retry succeeded`, { attempt })
      }
      return response
    } catch (error: any) {
      lastError = error
      const errorType = classifyError(error)

      logger.error(`${context} attempt ${attempt + 1} failed`, {
        errorType,
        message: error.message,
        code: error.code
      })

      // 如果不可重试或已达到最大重试次数，抛出错误
      if (!isRetryable(errorType) || attempt >= maxRetries) {
        break
      }

      // 指数退避
      const delay = retryDelay * Math.pow(2, attempt)
      logger.info(`${context} retrying in ${delay}ms...`)
      await sleep(delay)
    }
  }

  // 所有重试都失败，抛出最后错误
  throw lastError
}

/**
 * 数据资产 API 服务
 */
class AssetApiService {
  /**
   * 获取企业列表
   */
  async getEnterpriseList(): Promise<Enterprise[]> {
    logger.info('API: getEnterpriseList')

    try {
      // TODO: 实际实现时替换为真实的 API 调用
      // const response = await axios.get(`${API_CONFIG.baseURL}/asset/GetEnterpriseList`, {
      //   timeout: API_CONFIG.timeout
      // })

      // 临时使用 Mock 实现
      const { mockGetEnterpriseList } = await import('@/tests/mocks/assetApiMock')
      const response = await mockGetEnterpriseList()

      logger.info('API: getEnterpriseList success', {
        count: response.data?.length || 0
      })

      return response.data || []
    } catch (error: any) {
      logger.error('API: getEnterpriseList failed', error)
      throw error
    }
  }

  /**
   * 获取数据资产列表
   */
  async getAssetList(params: GetAssetListRequest = {}): Promise<GetAssetListResponse> {
    logger.info('API: getAssetList', params)

    try {
      // TODO: 实际实现时替换为真实的 API 调用
      // const response = await axios.post(`${API_CONFIG.baseURL}/asset/GetAssetList`, params, {
      //   timeout: API_CONFIG.timeout
      // })

      // 临时使用 Mock 实现
      const { mockGetAssetList } = await import('@/tests/mocks/assetApiMock')
      const response = await mockGetAssetList(
        params.filters?.[0]?.values?.[0] || '',  // holderCompany
        params.pageNumber || 1,
        params.pageSize || 50
      )

      logger.info('API: getAssetList success', {
        total: response.data?.pagination?.total || 0,
        count: response.data?.list?.length || 0
      })

      return response
    } catch (error: any) {
      logger.error('API: getAssetList failed', error)
      throw error
    }
  }

  /**
   * 获取数据资产详情
   */
  async getAsset(request: GetAssetRequest): Promise<AssetInfo> {
    logger.info('API: getAsset', { assetId: request.assetId })

    try {
      // TODO: 实际实现时替换为真实的 API 调用
      // const response = await axios.post(`${API_CONFIG.baseURL}/asset/GetAsset`, request, {
      //   timeout: API_CONFIG.timeout
      // })

      // 临时使用 Mock 实现
      const { mockGetAsset } = await import('@/tests/mocks/assetApiMock')
      const response = await mockGetAsset(request.assetId || '')

      logger.info('API: getAsset success', {
        assetId: response.data?.assetInfo?.assetId,
        assetName: response.data?.assetInfo?.assetName
      })

      return response.data?.assetInfo
    } catch (error: any) {
      logger.error('API: getAsset failed', error)
      throw error
    }
  }
}

// 导出单例
export const assetApi = new AssetApiService()

// 导出重试函数供未来使用
export { fetchWithRetry }
