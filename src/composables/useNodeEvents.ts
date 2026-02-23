export function useNodeEvents() {
  function dispatchEvent(eventType: string, detail?: unknown): void {
    document.dispatchEvent(new CustomEvent(eventType, { detail, bubbles: true }))
  }

  function handleAddModelOutput(nodeId: string): void {
    dispatchEvent('add-fl-model-output', { nodeId })
  }

  function handleAddFLOutput(nodeId: string): void {
    dispatchEvent('add-fl-output', { nodeId })
  }

  return {
    handleAddModelOutput,
    handleAddFLOutput
  }
}
