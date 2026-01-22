import type { Node } from '@vue-flow/core'
import type { AssetInfo } from '@/types/nodes'
import { logger } from '@/utils/logger'

/**
 * 数据资产缓存服务
 * 使用 Map 缓存避免重复调用同一资产的详情接口
 */
class AssetCacheService {
  private cache: Map<string, AssetInfo> = new Map()

  /**
   * 获取缓存
   * @param assetId 资产 ID
   * @returns 资产信息或 undefined
   */
  get(assetId: string): AssetInfo | undefined {
    const hit = this.cache.has(assetId)
    if (hit) {
      logger.debug(`Cache HIT: ${assetId}`)
      return this.cache.get(assetId)
    }
    logger.debug(`Cache MISS: ${assetId}`)
    return undefined
  }

  /**
   * 设置缓存
   * @param assetId 资产 ID
   * @param assetInfo 资产信息
   */
  set(assetId: string, assetInfo: AssetInfo): void {
    this.cache.set(assetId, assetInfo)
    logger.debug(`Cache SET: ${assetId}`, { assetName: assetInfo.assetName })
  }

  /**
   * 检查缓存是否存在
   * @param assetId 资产 ID
   * @returns 是否存在缓存
   */
  has(assetId: string): boolean {
    return this.cache.has(assetId)
  }

  /**
   * 删除缓存
   * @param assetId 资产 ID
   */
  delete(assetId: string): void {
    this.cache.delete(assetId)
    logger.debug(`Cache DELETE: ${assetId}`)
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    const size = this.cache.size
    this.cache.clear()
    logger.info(`Cache CLEARED: ${size} items`)
  }

  /**
   * 获取缓存大小
   * @returns 缓存项数量
   */
  get size(): number {
    return this.cache.size
  }

  /**
   * 从节点数据重建缓存
   * 用于导入 JSON 时恢复缓存，无需额外 API 调用
   * @param nodes 节点列表
   */
  rebuildFromNodes(nodes: Node[]): void {
    let rebuilt = 0
    let skipped = 0

    for (const node of nodes) {
      const assetInfo = (node.data as any)?.assetInfo as AssetInfo | undefined
      if (assetInfo && assetInfo.assetId) {
        // 只缓存有完整 assetInfo 的节点
        if (!this.cache.has(assetInfo.assetId)) {
          this.cache.set(assetInfo.assetId, assetInfo)
          rebuilt++
        } else {
          skipped++
        }
      }
    }

    logger.info(`Cache REBUILT from ${nodes.length} nodes: ${rebuilt} added, ${skipped} skipped (duplicates)`)
  }
}

// 导出单例
export const assetCache = new AssetCacheService()
