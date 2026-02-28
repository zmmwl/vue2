import type { Node, Edge } from '@vue-flow/core'
import type { NodeData, ComputeTaskNodeData } from '@/types/nodes'
import type { TaskAlgorithmConfig } from '@/types/algorithm'
import { logger } from '@/utils/logger'
import { algorithmService } from '@/services/algorithmService'

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

/**
 * 算法验证结果
 */
export interface AlgorithmValidationResult {
  valid: boolean
  missingAlgorithms: Array<{
    nodeId: string
    nodeName: string
    algorithmId: string
    algorithmName: string
  }>
}

/**
 * 验证导入数据中的算法是否存在
 * @param nodes 导入的节点列表
 * @returns 验证结果，包含缺失的算法列表
 */
export async function validateAlgorithms(nodes: ExportedNode[]): Promise<AlgorithmValidationResult> {
  const missingAlgorithms: AlgorithmValidationResult['missingAlgorithms'] = []

  for (const node of nodes) {
    // 只检查计算任务节点
    if (node.type === 'compute_task' || node.type === 'pir_task' || node.type === 'fl_task') {
      const data = node.data as ComputeTaskNodeData
      const algorithmConfig = data.algorithmConfig as TaskAlgorithmConfig | undefined

      if (algorithmConfig?.algorithmId) {
        try {
          const response = await algorithmService.getById(algorithmConfig.algorithmId)
          if (response.code !== 0 || !response.data) {
            missingAlgorithms.push({
              nodeId: node.id,
              nodeName: data.label || node.id,
              algorithmId: algorithmConfig.algorithmId,
              algorithmName: algorithmConfig.algorithmName
            })
          }
        } catch {
          missingAlgorithms.push({
            nodeId: node.id,
            nodeName: data.label || node.id,
            algorithmId: algorithmConfig.algorithmId,
            algorithmName: algorithmConfig.algorithmName
          })
        }
      }
    }
  }

  return {
    valid: missingAlgorithms.length === 0,
    missingAlgorithms
  }
}
