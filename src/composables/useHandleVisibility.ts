import { computed } from 'vue'
import { useVueFlow } from '@vue-flow/core'

export function useHandleVisibility(nodeId: string) {
  const { edges } = useVueFlow()

  const hasDataInputConnection = computed(() =>
    edges.value.some(edge => edge.target === nodeId && edge.targetHandle === 'data-input')
  )

  const hasOutputConnection = computed(() =>
    edges.value.some(edge => edge.source === nodeId && edge.sourceHandle === 'output')
  )

  return {
    hasDataInputConnection,
    hasOutputConnection
  }
}
