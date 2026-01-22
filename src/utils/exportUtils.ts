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
 * 导出任务图为 JSON
 * @param nodes 节点列表
 * @param edges 连接线列表
 * @returns JSON 字符串
 */
export function exportGraph(nodes: Node[], edges: Edge[]): string {
  logger.info('[exportUtils] Exporting graph', {
    nodeCount: nodes.length,
    edgeCount: edges.length
  })

  // 检测未配置的数据源节点
  const unconfiguredNodes = nodes.filter(node => {
    const nodeData = node.data as NodeData
    return nodeData.category === 'data_source' && !nodeData.assetInfo
  })

  if (unconfiguredNodes.length > 0) {
    logger.warn('[exportUtils] Exporting with unconfigured nodes', {
      count: unconfiguredNodes.length,
      nodeIds: unconfiguredNodes.map(n => n.id)
    })
  }

  // 构建导出数据
  const exportedNodes: ExportedNode[] = nodes.map(node => {
    const nodeData = node.data as NodeData
    return {
      id: node.id,
      type: node.type || 'default',
      position: node.position,
      data: {
        ...nodeData,
        // 确保导出完整的资产信息
        assetInfo: nodeData.assetInfo ? {
          ...nodeData.assetInfo,
          dataInfo: {
            ...nodeData.assetInfo.dataInfo,
            fieldList: nodeData.assetInfo.dataInfo.fieldList || []
          }
        } : undefined,
        selectedFields: nodeData.selectedFields || []
      }
    }
  })

  const exportedGraph: ExportedGraph = {
    version: '1.0.0',
    timestamp: Date.now(),
    nodes: exportedNodes,
    edges: edges.map(edge => ({
      ...edge,
      // 确保导出完整数据
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle || 'output',
      targetHandle: edge.targetHandle || 'input'
    }))
  }

  const json = JSON.stringify(exportedGraph, null, 2)

  logger.info('[exportUtils] Export complete', {
    size: json.length,
    hasUnconfigured: unconfiguredNodes.length > 0
  })

  return json
}

/**
 * 触发下载 JSON 文件
 * @param json JSON 字符串
 * @param filename 文件名（可选）
 */
export function downloadJson(json: string, filename?: string): void {
  const defaultFilename = `flow-graph-${new Date().toISOString().slice(0, 10)}.json`
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename || defaultFilename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)

  logger.info('[exportUtils] File downloaded', { filename: filename || defaultFilename })
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
