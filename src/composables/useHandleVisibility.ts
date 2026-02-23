import { computed } from 'vue'
import { useVueFlow } from '@vue-flow/core'

/**
 * Handle 可见性检测 composable
 * 用于检测节点的各个连接点是否有连接
 */
export function useHandleVisibility(nodeId: string) {
  const { edges } = useVueFlow()

  /**
   * 检测是否有数据源输入连接 (data-input handle)
   */
  const hasDataInputConnection = computed(() =>
    edges.value.some(edge => edge.target === nodeId && edge.targetHandle === 'data-input')
  )

  /**
   * 检测是否有输出连接 (output handle)
   */
  const hasOutputConnection = computed(() =>
    edges.value.some(edge => edge.source === nodeId && edge.sourceHandle === 'output')
  )

  /**
   * 检测是否有模型输入连接 (input handle - 左侧紫色)
   */
  const hasModelInputConnection = computed(() =>
    edges.value.some(edge => edge.target === nodeId && edge.targetHandle === 'input')
  )

  /**
   * 检测是否有算力输入连接 (compute-input handle - 右侧橙色)
   */
  const hasComputeInputConnection = computed(() =>
    edges.value.some(edge => edge.target === nodeId && edge.targetHandle === 'compute-input')
  )

  return {
    hasDataInputConnection,
    hasOutputConnection,
    hasModelInputConnection,
    hasComputeInputConnection
  }
}
