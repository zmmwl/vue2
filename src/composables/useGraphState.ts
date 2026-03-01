/**
 * 图状态管理 Composable
 * 使用 Vue 3 Composition API 管理画布状态
 * 使用模块级单例状态，确保所有组件共享同一状态
 */

import { ref, computed } from 'vue'
import type { Node, Edge } from '@vue-flow/core'
import type { NodeData, ComputeTaskNodeData, InputProvider } from '@/types/nodes'
import type { ExportJson } from '@/types/export'
import { convertDagToJson } from '@/utils/dag-export'
import { logger } from '@/utils/logger'

// 模块级单例状态
const nodes = ref<Node<NodeData>[]>([])
const edges = ref<Edge[]>([])
const selectedNodeId = ref<string | null>(null)
const detailViewMode = ref<'detail' | 'preview'>('detail')

const selectedNode = computed(() => {
  if (!selectedNodeId.value) return null
  return nodes.value.find(node => node.id === selectedNodeId.value) || null
})

const exportJson = computed<ExportJson | null>(() => {
  if (nodes.value.length === 0) return null
  try {
    return convertDagToJson(nodes.value, edges.value)
  } catch (error) {
    console.error('Failed to convert DAG to JSON:', error)
    return null
  }
})

/**
 * 设置选中节点的 Union providers（用于测试）
 */
function setUnionProvidersForSelectedNode(providers: Partial<InputProvider>[]): boolean {
  logger.info('[useGraphState] setUnionProvidersForSelectedNode called', {
    selectedNodeId: selectedNodeId.value,
    providerCount: providers?.length
  })

  if (!selectedNodeId.value) {
    logger.warn('[useGraphState] No node selected')
    return false
  }

  if (!providers || providers.length === 0) {
    logger.warn('[useGraphState] Invalid providers data')
    return false
  }

  const nodeIndex = nodes.value.findIndex(n => n.id === selectedNodeId.value)
  if (nodeIndex === -1) {
    logger.warn('[useGraphState] Node not found')
    return false
  }

  const node = nodes.value[nodeIndex]
  if (!node || node.data?.category !== 'compute_task') {
    logger.warn('[useGraphState] Not a compute task node')
    return false
  }

  // 创建新的 inputProviders
  const newInputProviders: InputProvider[] = providers.map((p: any) => ({
    sourceNodeId: p.sourceNodeId,
    sourceType: 'dataSource' as const,
    participantId: p.participantId,
    dataset: p.dataset,
    fields: p.fields,
    joinType: 'Union' as const
  }))

  // 更新节点数据
  const taskData = node.data as ComputeTaskNodeData
  const updatedNode = {
    ...node,
    data: {
      ...taskData,
      inputProviders: newInputProviders,
      joinConditions: []
    }
  }

  // 使用数组替换来触发响应式更新
  const newNodes = [...nodes.value]
  newNodes[nodeIndex] = updatedNode as any
  nodes.value = newNodes

  logger.info('[useGraphState] Union providers set successfully', {
    nodeId: selectedNodeId.value,
    providerCount: newInputProviders.length
  })

  return true
}

// 注册全局测试函数和变量
if (typeof window !== 'undefined') {
  (window as any).__setUnionProvidersForTest = setUnionProvidersForSelectedNode
  logger.info('[useGraphState] __setUnionProvidersForTest registered globally')

  // 暴露 selectedNodeId 的 getter
  Object.defineProperty(window, '__selectedNodeId', {
    get: () => selectedNodeId.value,
    configurable: true
  })
}

export function useGraphState() {
  function setNodes(newNodes: Node<NodeData>[]) {
    nodes.value = newNodes
  }

  function setEdges(newEdges: Edge[]) {
    edges.value = newEdges
  }

  function addNode(node: Node<NodeData>) {
    nodes.value.push(node)
  }

  function addEdge(edge: Edge) {
    edges.value.push(edge)
  }

  function selectNode(nodeId: string | null) {
    selectedNodeId.value = nodeId
  }

  function setDetailViewMode(mode: 'detail' | 'preview') {
    detailViewMode.value = mode
  }

  return {
    nodes,
    edges,
    selectedNodeId,
    detailViewMode,
    selectedNode,
    exportJson,
    setNodes,
    setEdges,
    addNode,
    addEdge,
    selectNode,
    setDetailViewMode
  }
}
