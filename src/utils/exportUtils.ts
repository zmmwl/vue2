import type { Node, Edge } from '@vue-flow/core'
import type { NodeData } from '@/types/nodes'
import { logger } from '@/utils/logger'

/**
 * 导出数据结构
 */
export interface ExportedGraph {
  version: string          // 数据格式版本
  timestamp: number        // 导出时间戳
  nodes: ExportedNode[]    // 节点列表
  edges: Edge[]            // 连接线列表
}

export interface ExportedNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: NodeData
}

/**
 * 读取并解析 JSON 文件
 * @param file 文件对象
 * @returns 解析后的导出数据
 */
export async function importGraph(file: File): Promise<ExportedGraph> {
  logger.info('[exportUtils] Importing graph', { filename: file.name })

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const json = e.target?.result as string
        const data = JSON.parse(json) as ExportedGraph

        // 验证数据结构
        if (!data.version || !data.nodes || !Array.isArray(data.nodes)) {
          throw new Error('Invalid graph data: missing required fields')
        }

        // 验证版本
        if (data.version !== '1.0.0') {
          logger.warn('[exportUtils] Unknown version', { version: data.version })
        }

        logger.info('[exportUtils] Import complete', {
          version: data.version,
          nodeCount: data.nodes.length,
          edgeCount: data.edges?.length || 0
        })

        resolve(data)
      } catch (error) {
        logger.error('[exportUtils] Import failed', error)
        reject(error)
      }
    }

    reader.onerror = () => {
      const error = new Error('Failed to read file')
      logger.error('[exportUtils] File read error', error)
      reject(error)
    }

    reader.readAsText(file)
  })
}

/**
 * 将导出的节点转换为 Vue Flow 节点格式
 * @param exportedNodes 导出的节点列表
 * @returns Vue Flow 节点列表
 */
export function restoreNodes(exportedNodes: ExportedNode[]): Node[] {
  return exportedNodes.map(exportedNode => ({
    id: exportedNode.id,
    type: exportedNode.type,
    position: exportedNode.position,
    data: exportedNode.data
  }))
}
