/**
 * 图状态管理 Composable
 * 使用 Vue 3 Composition API 管理画布状态
 * 使用模块级单例状态，确保所有组件共享同一状态
 */

import { ref, computed } from 'vue'
import type { Node, Edge } from '@vue-flow/core'
import type { NodeData } from '@/types/nodes'
import type { ExportJson } from '@/types/export'
import { convertDagToJson } from '@/utils/dag-export'

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
