/**
 * 节点事件处理 composable
 * 提供统一的节点事件派发方法
 */
export function useNodeEvents() {
  /**
   * 派发自定义事件
   */
  function dispatchEvent(eventType: string, detail?: unknown): void {
    document.dispatchEvent(new CustomEvent(eventType, { detail, bubbles: true }))
  }

  // ========== FL 任务相关 ==========

  /**
   * 处理添加 FL 模型输出按钮点击
   */
  function handleAddModelOutput(nodeId: string): void {
    dispatchEvent('add-fl-model-output', { nodeId })
  }

  /**
   * 处理添加 FL 输出按钮点击
   */
  function handleAddFLOutput(nodeId: string): void {
    dispatchEvent('add-fl-output', { nodeId })
  }

  // ========== MPC/PIR 任务相关 ==========

  /**
   * 处理添加模型按钮点击
   */
  function handleAddModel(nodeId: string): void {
    dispatchEvent('add-model', { nodeId })
  }

  /**
   * 处理添加算力按钮点击
   */
  function handleAddCompute(nodeId: string): void {
    dispatchEvent('add-compute', { nodeId })
  }

  /**
   * 处理添加输出按钮点击
   */
  function handleAddOutput(nodeId: string, outputType?: string): void {
    dispatchEvent('add-output', { nodeId, outputType })
  }

  // ========== 高亮相关 ==========

  /**
   * 高亮左侧面板的模型节点
   */
  function handleHighlightModels(): void {
    dispatchEvent('highlight-models')
  }

  /**
   * 高亮左侧面板的算力节点
   */
  function handleHighlightComputes(): void {
    dispatchEvent('highlight-computes')
  }

  /**
   * 清除左侧面板的高亮
   */
  function handleClearHighlight(): void {
    dispatchEvent('clear-highlight')
  }

  // ========== 本地 Query 任务相关 ==========

  /**
   * 处理编辑本地 Query
   */
  function handleEditLocalQuery(nodeId: string): void {
    dispatchEvent('edit-local-query', { nodeId })
  }

  return {
    // FL 任务
    handleAddModelOutput,
    handleAddFLOutput,
    // MPC/PIR 任务
    handleAddModel,
    handleAddCompute,
    handleAddOutput,
    // 高亮
    handleHighlightModels,
    handleHighlightComputes,
    handleClearHighlight,
    // 本地 Query
    handleEditLocalQuery
  }
}
