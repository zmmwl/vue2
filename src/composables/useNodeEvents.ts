/**
 * 节点事件处理 composable
 * 提供统一的节点事件派发方法
 */

/** 事件类型常量 */
const EVENT_TYPES = {
  // FL 任务
  ADD_FL_MODEL_OUTPUT: 'add-fl-model-output',
  ADD_FL_OUTPUT: 'add-fl-output',
  // MPC/PIR 任务
  ADD_MODEL: 'add-model',
  ADD_COMPUTE: 'add-compute',
  ADD_OUTPUT: 'add-output',
  // 高亮
  HIGHLIGHT_MODELS: 'highlight-models',
  HIGHLIGHT_COMPUTES: 'highlight-computes',
  CLEAR_HIGHLIGHT: 'clear-highlight',
  // 本地 Query
  EDIT_LOCAL_QUERY: 'edit-local-query'
} as const

/**
 * 派发自定义事件
 */
function dispatchEvent(eventType: string, detail?: unknown): void {
  document.dispatchEvent(new CustomEvent(eventType, { detail, bubbles: true }))
}

export function useNodeEvents() {
  return {
    // FL 任务
    handleAddModelOutput: (nodeId: string) => dispatchEvent(EVENT_TYPES.ADD_FL_MODEL_OUTPUT, { nodeId }),
    handleAddFLOutput: (nodeId: string) => dispatchEvent(EVENT_TYPES.ADD_FL_OUTPUT, { nodeId }),
    // MPC/PIR 任务
    handleAddModel: (nodeId: string) => dispatchEvent(EVENT_TYPES.ADD_MODEL, { nodeId }),
    handleAddCompute: (nodeId: string) => dispatchEvent(EVENT_TYPES.ADD_COMPUTE, { nodeId }),
    handleAddOutput: (nodeId: string, outputType?: string) => dispatchEvent(EVENT_TYPES.ADD_OUTPUT, { nodeId, outputType }),
    // 高亮
    handleHighlightModels: () => dispatchEvent(EVENT_TYPES.HIGHLIGHT_MODELS),
    handleHighlightComputes: () => dispatchEvent(EVENT_TYPES.HIGHLIGHT_COMPUTES),
    handleClearHighlight: () => dispatchEvent(EVENT_TYPES.CLEAR_HIGHLIGHT),
    // 本地 Query
    handleEditLocalQuery: (nodeId: string) => dispatchEvent(EVENT_TYPES.EDIT_LOCAL_QUERY, { nodeId })
  }
}
