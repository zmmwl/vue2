/**
 * 算法管理Mock服务
 * Feature: 004-algorithm-selection
 * 提供算法的CRUD操作，模拟后端API行为
 */

import type {
  Algorithm,
  CreateAlgorithmInput,
  UpdateAlgorithmInput,
  AlgorithmUsage
} from '@/types/algorithm'
import { AlgorithmType } from '@/types/algorithm'
import { initializeMockData } from '@/utils/algorithm-mock-data'

/** 模拟网络延迟 */
function simulateDelay(minMs: number = 100, maxMs: number = 300): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
  return new Promise(resolve => setTimeout(resolve, delay))
}

/** API响应包装 */
interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

/** 成功响应 */
function success<T>(data: T): ApiResponse<T> {
  return { code: 0, message: 'success', data }
}

/** 错误响应 */
function error<T = null>(code: number, message: string): ApiResponse<T> {
  return { code, message, data: null as T }
}

/**
 * 算法服务类（单例模式）
 */
class AlgorithmService {
  private cache: Map<string, Algorithm>
  private static instance: AlgorithmService

  private constructor() {
    // 初始化Mock数据
    this.cache = initializeMockData()
  }

  /** 获取单例实例 */
  static getInstance(): AlgorithmService {
    if (!AlgorithmService.instance) {
      AlgorithmService.instance = new AlgorithmService()
    }
    return AlgorithmService.instance
  }

  /**
   * 获取算法列表
   * @param type 算法类型过滤（可选）
   * @param keyword 名称关键字搜索（可选）
   */
  async getList(type?: AlgorithmType, keyword?: string): Promise<ApiResponse<Algorithm[] | null>> {
    await simulateDelay()

    let algorithms = Array.from(this.cache.values())

    // 类型过滤
    if (type) {
      algorithms = algorithms.filter(algo => algo.type === type)
    }

    // 关键字搜索
    if (keyword && keyword.trim()) {
      const lowerKeyword = keyword.toLowerCase().trim()
      algorithms = algorithms.filter(algo =>
        algo.name.toLowerCase().includes(lowerKeyword) ||
        algo.nameEn.toLowerCase().includes(lowerKeyword) ||
        algo.description?.toLowerCase().includes(lowerKeyword)
      )
    }

    // 按创建时间倒序排序
    algorithms.sort((a, b) => b.createdAt - a.createdAt)

    return success(algorithms)
  }

  /**
   * 根据ID获取单个算法
   */
  async getById(id: string): Promise<ApiResponse<Algorithm | null>> {
    await simulateDelay()

    const algorithm = this.cache.get(id)
    if (!algorithm) {
      return error(404, '算法不存在')
    }
    return success(algorithm)
  }

  /**
   * 根据类型获取可用算法
   */
  async getByType(type: AlgorithmType): Promise<ApiResponse<Algorithm[] | null>> {
    await simulateDelay()

    const algorithms = Array.from(this.cache.values())
      .filter(algo => algo.type === type)
      .sort((a, b) => b.createdAt - a.createdAt)

    return success(algorithms)
  }

  /**
   * 获取默认算法（创建时间最新）
   */
  async getDefault(type: AlgorithmType): Promise<ApiResponse<Algorithm | null>> {
    await simulateDelay()

    const algorithms = Array.from(this.cache.values())
      .filter(algo => algo.type === type)

    if (algorithms.length === 0) {
      return error(404, '该类型暂无可用算法')
    }

    // 返回创建时间最新的
    const defaultAlgo = algorithms.reduce((latest, current) =>
      current.createdAt > latest.createdAt ? current : latest
    )

    return success(defaultAlgo)
  }

  /**
   * 创建算法
   */
  async create(input: CreateAlgorithmInput): Promise<ApiResponse<Algorithm | null>> {
    await simulateDelay(200, 500)

    // 验证必填字段
    if (!input.name || !input.nameEn || !input.version || !input.type) {
      return error(400, '缺少必填字段')
    }

    // 验证nameEn格式（字母数字下划线）
    if (!/^[a-zA-Z0-9_]+$/.test(input.nameEn)) {
      return error(400, '英文名称只能包含字母、数字和下划线')
    }

    // 验证版本号格式
    if (!/^v\d+\.\d+$/.test(input.version)) {
      return error(400, '版本号格式错误，应为 vX.Y 格式')
    }

    // 生成ID
    const id = `${input.nameEn}-${input.version}`

    // 检查ID是否已存在
    if (this.cache.has(id)) {
      return error(409, '算法ID已存在')
    }

    // 创建算法对象
    const algorithm: Algorithm = {
      id,
      name: input.name,
      nameEn: input.nameEn,
      version: input.version,
      description: input.description,
      type: input.type,
      paramTemplate: input.paramTemplate || [],
      createdAt: Date.now()
    }

    // 存入缓存
    this.cache.set(id, algorithm)

    return success(algorithm)
  }

  /**
   * 更新算法
   */
  async update(id: string, input: UpdateAlgorithmInput): Promise<ApiResponse<Algorithm | null>> {
    await simulateDelay()

    const existing = this.cache.get(id)
    if (!existing) {
      return error(404, '算法不存在')
    }

    // 更新算法
    const updated: Algorithm = {
      ...existing,
      ...input,
      id, // ID不可修改
      type: existing.type, // 类型不可修改
      version: existing.version, // 版本号不可修改
      nameEn: existing.nameEn, // 英文名不可修改
      updatedAt: Date.now()
    }

    this.cache.set(id, updated)

    return success(updated)
  }

  /**
   * 删除算法
   * @param id 算法ID
   * @param usedByTasks 被哪些任务使用（由调用方提供）
   */
  async delete(id: string, usedByTasks?: Array<{ taskId: string; taskName: string }>): Promise<ApiResponse<null>> {
    await simulateDelay()

    const existing = this.cache.get(id)
    if (!existing) {
      return error(404, '算法不存在')
    }

    // 检查是否被使用
    if (usedByTasks && usedByTasks.length > 0) {
      return error(409, '该算法正在被任务使用，无法删除')
    }

    this.cache.delete(id)

    return success(null)
  }

  /**
   * 检查算法使用情况
   * 注意：实际使用情况需要由调用方（useGraphState）提供
   */
  async getUsage(id: string): Promise<ApiResponse<AlgorithmUsage | null>> {
    await simulateDelay()

    const existing = this.cache.get(id)
    if (!existing) {
      return error(404, '算法不存在')
    }

    // Mock场景下，返回未使用状态
    // 实际使用情况由 useGraphState 检查
    return success({
      isUsed: false,
      usedByTaskCount: 0,
      usedByTasks: []
    })
  }

  /**
   * 重置为初始Mock数据（用于测试）
   */
  reset(): void {
    this.cache = initializeMockData()
  }

  /**
   * 获取缓存中的算法数量
   */
  size(): number {
    return this.cache.size
  }
}

// 导出单例实例
export const algorithmService = AlgorithmService.getInstance()

// 也导出类以便测试
export { AlgorithmService }
