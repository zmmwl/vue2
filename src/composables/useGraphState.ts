/**
 * 图状态管理 Composable
 * 使用 Vue 3 Composition API 管理画布状态
 */

import { ref, computed } from 'vue'
import type { Node, Edge } from '@vue-flow/core'
import type { NodeData } from '@/types/nodes'
import type { ExportJson } from '@/types/export'
import { convertDagToJson } from '@/utils/dag-export'

/**
 * 图状态管理接口
 */
export interface GraphState {
  nodes: Node<NodeData>[]
  edges: Edge[]
  selectedNodeId: string | null
  detailViewMode: 'detail' | 'preview'
}

/**
 * 图状态管理 Composable
 */
export function useGraphState() {
  // 节点和连线数据
  const nodes = ref<Node<NodeData>[]>([])
  const edges = ref<Edge[]>([])

  // 当前选中的节点ID
  const selectedNodeId = ref<string | null>(null)

  // 详情面板视图模式
  const detailViewMode = ref<'detail' | 'preview'>('detail')

  // 获取当前选中的节点
  const selectedNode = computed(() => {
    if (!selectedNodeId.value) return null
    return nodes.value.find(node => node.id === selectedNodeId.value) || null
  })

  /**
   * 设置节点列表
   */
  function setNodes(newNodes: Node<NodeData>[]) {
    nodes.value = newNodes
  }

  /**
   * 设置连线列表
   */
  function setEdges(newEdges: Edge[]) {
    edges.value = newEdges
  }

  /**
   * 添加节点
   */
  function addNode(node: Node<NodeData>) {
    nodes.value.push(node)
  }

  /**
   * 添加多个节点
   */
  function addNodes(newNodes: Node<NodeData>[]) {
    nodes.value.push(...newNodes)
  }

  /**
   * 删除节点
   */
  function removeNode(nodeId: string) {
    const index = nodes.value.findIndex(node => node.id === nodeId)
    if (index !== -1) {
      nodes.value.splice(index, 1)
      // 删除相关连线
      edges.value = edges.value.filter(
        edge => edge.source !== nodeId && edge.target !== nodeId
      )
    }
  }

  /**
   * 更新节点数据
   */
  function updateNode(nodeId: string, newData: Partial<NodeData>) {
    const node = nodes.value.find(n => n.id === nodeId)
    if (node) {
      node.data = { ...node.data, ...newData } as NodeData
    }
  }

  /**
   * 添加连线
   */
  function addEdge(edge: Edge) {
    edges.value.push(edge)
  }

  /**
   * 删除连线
   */
  function removeEdge(edgeId: string) {
    const index = edges.value.findIndex(edge => edge.id === edgeId)
    if (index !== -1) {
      edges.value.splice(index, 1)
    }
  }

  /**
   * 选中节点
   */
  function selectNode(nodeId: string | null) {
    selectedNodeId.value = nodeId
  }

  /**
   * 切换详情面板视图模式
   */
  function toggleDetailViewMode() {
    detailViewMode.value = detailViewMode.value === 'detail' ? 'preview' : 'detail'
  }

  /**
   * 设置详情面板视图模式
   */
  function setDetailViewMode(mode: 'detail' | 'preview') {
    detailViewMode.value = mode
  }

  /**
   * 清空所有数据
   */
  function clear() {
    nodes.value = []
    edges.value = []
    selectedNodeId.value = null
  }

  /**
   * 导出 JSON（响应式计算）
   * 实时将画布状态转换为标准 JSON 格式
   */
  const exportJson = computed<ExportJson | null>(() => {
    if (nodes.value.length === 0) return null

    try {
      return convertDagToJson(nodes.value, edges.value)
    } catch (error) {
      console.error('Failed to convert DAG to JSON:', error)
      return null
    }
  })

  return {
    // 状态
    nodes,
    edges,
    selectedNodeId,
    detailViewMode,
    selectedNode,
    exportJson,

    // 方法
    setNodes,
    setEdges,
    addNode,
    addNodes,
    removeNode,
    updateNode,
    addEdge,
    removeEdge,
    selectNode,
    toggleDetailViewMode,
    setDetailViewMode,
    clear
  }
}
