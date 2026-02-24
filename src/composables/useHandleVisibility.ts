import { computed, type Ref } from 'vue'
import { useVueFlow } from '@vue-flow/core'
import type { Edge } from '@vue-flow/core'

/**
 * 创建连接检测器
 * @param edges - 边列表
 * @param nodeId - 节点 ID
 * @param type - 连接类型 ('source' | 'target')
 * @param handleId - Handle ID
 */
function createConnectionChecker(
  edges: Ref<Edge[]>,
  nodeId: string,
  type: 'source' | 'target',
  handleId: string
) {
  const handleKey = type === 'source' ? 'sourceHandle' : 'targetHandle'
  return computed(() =>
    edges.value.some(edge => edge[type] === nodeId && edge[handleKey] === handleId)
  )
}

/**
 * Handle 可见性检测 composable
 * 用于检测节点的各个连接点是否有连接
 */
export function useHandleVisibility(nodeId: string) {
  const { edges } = useVueFlow()

  return {
    hasDataInputConnection: createConnectionChecker(edges, nodeId, 'target', 'data-input'),
    hasOutputConnection: createConnectionChecker(edges, nodeId, 'source', 'output'),
    hasModelInputConnection: createConnectionChecker(edges, nodeId, 'target', 'input'),
    hasComputeInputConnection: createConnectionChecker(edges, nodeId, 'target', 'compute-input')
  }
}
