/**
 * 图状态管理 Composable
 * 使用 Vue 3 reactive() 实现零依赖状态管理
 */

import { ref, reactive, computed } from 'vue'
import type { Node, Edge, Connection } from '@vue-flow/core'
import type {
  NodeData,
  NodeType,
  ComputeTaskNodeData,
  ValidationResult
} from '@/types/contracts'
import type { ExportJson } from '@/types/contracts'

/**
 * 图状态接口
 */
interface GraphState {
  nodes: Map<string, Node<NodeData>>
  edges: Map<string, Edge>
  selectedNodeId: string | null
  detailViewMode: 'detail' | 'preview'
}

/**
 * 图状态管理 Hook
 */
export function useGraphState() {
  // 状态
  const selectedNodeId = ref<string | null>(null)
  const detailViewMode = ref<'detail' | 'preview'>('detail')

  // 使用 reactive 创建响应式状态
  const state = reactive<GraphState>({
    nodes: new Map(),
    edges: new Map(),
    selectedNodeId: null,
    detailViewMode: 'detail'
  })

  // ============ 节点操作 ============

  /**
   * 添加节点
   */
  const addNode = (node: Node<NodeData>) => {
    state.nodes.set(node.id, node)
  }

  /**
   * 删除节点
   * 同时删除相关的连线和子节点
   */
  const removeNode = (id: string) => {
    const node = state.nodes.get(id)
    if (!node) return

    // 删除相关连线
    const relatedEdges = Array.from(state.edges.values()).filter(
      edge => edge.source === id || edge.target === id
    )
    relatedEdges.forEach(edge => state.edges.delete(edge.id))

    // 如果是计算任务节点，删除子节点（模型、算力、输出）
    if (node.type === 'computeTask') {
      const childNodes = Array.from(state.nodes.values()).filter(n => {
        const data = n.data as ComputeTaskNodeData
        return (
          (n.type === 'modelNode' ||
            n.type === 'computeResource' ||
            n.type === 'outputData') &&
          (data as any).parentTaskId === id
        )
      })
      childNodes.forEach(child => state.nodes.delete(child.id))
    }

    // 删除节点
    state.nodes.delete(id)

    // 如果删除的是当前选中节点，清除选择
    if (state.selectedNodeId === id) {
      state.selectedNodeId = null
    }
  }

  /**
   * 更新节点数据
   */
  const updateNode = (id: string, data: Partial<NodeData>) => {
    const node = state.nodes.get(id)
    if (!node) return

    // 深度合并节点数据
    node.data = { ...node.data, ...data } as NodeData
    state.nodes.set(id, { ...node, data: node.data })
  }

  /**
   * 获取节点
   */
  const getNode = (id: string): Node<NodeData> | undefined => {
    return state.nodes.get(id)
  }

  // ============ 连线操作 ============

  /**
   * 添加连线
   */
  const addEdge = (edge: Edge) => {
    state.edges.set(edge.id, edge)
  }

  /**
   * 删除连线
   */
  const removeEdge = (id: string) => {
    state.edges.delete(id)
  }

  /**
   * 验证连线是否有效
   */
  const isValidConnection = (connection: Connection): boolean => {
    const { source, target } = connection

    if (!source || !target) return false

    const sourceNode = state.nodes.get(source)
    const targetNode = state.nodes.get(target)

    if (!sourceNode || !targetNode) return false

    const sourceType = sourceNode.type as NodeType
    const targetType = targetNode.type

    // 定义有效的连接关系
    const validConnections: Record<NodeType, NodeType[]> = {
      dataSource: ['computeTask', 'localTask'],
      computeTask: [], // 计算任务输出通过 OutputDataNode
      modelNode: ['computeTask'],
      computeResource: ['computeTask'],
      outputData: ['computeTask', 'localTask'],
      localTask: []
    }

    const allowedTargets = validConnections[sourceType] || []

    if (!allowedTargets.includes(targetType as NodeType)) {
      return false
    }

    // 检查是否会形成循环
    if (hasCycle(source, target)) {
      return false
    }

    return true
  }

  /**
   * 检测是否会形成循环
   */
  const hasCycle = (newSource: string, newTarget: string): boolean => {
    const visited = new Set<string>()
    const stack = [newTarget]

    while (stack.length > 0) {
      const current = stack.shift()!

      if (current === newSource) {
        return true // 形成循环
      }

      if (visited.has(current)) {
        continue
      }

      visited.add(current)

      // 找到从 current 出发的所有边
      const outgoingEdges = Array.from(state.edges.values()).filter(
        edge => edge.source === current
      )

      outgoingEdges.forEach(edge => {
        if (!visited.has(edge.target)) {
          stack.push(edge.target)
        }
      })
    }

    return false
  }

  // ============ 选择操作 ============

  /**
   * 设置选中节点
   */
  const setSelectedNode = (id: string | null) => {
    state.selectedNodeId = id
    selectedNodeId.value = id
  }

  /**
   * 设置详情面板视图模式
   */
  const setDetailViewMode = (mode: 'detail' | 'preview') => {
    state.detailViewMode = mode
    detailViewMode.value = mode
  }

  // ============ 导出操作 ============

  /**
   * 导出为 JSON
   * TODO: 实现完整的转换逻辑（Phase 6）
   */
  const exportJson = (): ExportJson | null => {
    // 暂时返回 null，完整实现在后续阶段
    console.warn('exportJson 尚未实现，将在 Phase 6 完成')
    return null
  }

  // ============ 计算属性 ============

  /**
   * 所有节点数组（用于 Vue Flow）
   */
  const nodesArray = computed(() => {
    return Array.from(state.nodes.values())
  })

  /**
   * 所有连线数组（用于 Vue Flow）
   */
  const edgesArray = computed(() => {
    return Array.from(state.edges.values())
  })

  /**
   * 当前选中节点
   */
  const selectedNode = computed(() => {
    if (!state.selectedNodeId) return null
    return state.nodes.get(state.selectedNodeId)
  })

  /**
   * 验证任务配置
   */
  const validateTaskConfig = (taskId: string): ValidationResult => {
    const node = state.nodes.get(taskId)
    if (!node || node.type !== 'computeTask') {
      return { valid: false, errors: ['任务不存在或不是计算任务节点'] }
    }

    const data = node.data as ComputeTaskNodeData
    const errors: string[] = []

    if (data.inputProviders.length === 0) {
      errors.push('至少需要配置一个输入数据源')
    }

    const hasJoinField = data.inputProviders.some(p =>
      p.fields.some(f => f.isJoinField)
    )
    if (!hasJoinField) {
      errors.push('至少需要选择一个join字段')
    }

    if (data.models.length === 0 && !data.expression) {
      errors.push('需要配置计算模型或表达式')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  return {
    // 状态
    state,
    selectedNodeId,
    detailViewMode,

    // 计算属性
    nodesArray,
    edgesArray,
    selectedNode,

    // 操作方法
    addNode,
    removeNode,
    updateNode,
    getNode,
    addEdge,
    removeEdge,
    isValidConnection,
    setSelectedNode,
    setDetailViewMode,
    exportJson,
    validateTaskConfig
  }
}

/**
 * 全局图状态单例
 * 用于跨组件共享状态
 */
let globalGraphState: ReturnType<typeof useGraphState> | null = null

export function useGlobalGraphState() {
  if (!globalGraphState) {
    globalGraphState = useGraphState()
  }
  return globalGraphState
}
