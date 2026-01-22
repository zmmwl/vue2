<template>
  <div class="flow-editor">
    <FlowHeader
      @export="handleExport"
      @import="handleImport"
    />
    <div class="editor-content">
      <FlowSidebar />
      <FlowCanvas
        ref="flowCanvasRef"
        @node-selected="handleNodeSelected"
      />
      <FlowDetailPanel
        :selected-node="selectedNode"
        @edit="handleEditAsset"
      />
    </div>
    <!-- 隐藏的文件输入用于导入 -->
    <input
      ref="fileInputRef"
      type="file"
      accept=".json"
      style="display: none"
      @change="handleFileChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Node } from '@vue-flow/core'
import type { NodeData } from '@/types/nodes'
import FlowHeader from '@/components/Flow/FlowHeader.vue'
import FlowSidebar from '@/components/Flow/FlowSidebar.vue'
import FlowCanvas from '@/components/Flow/FlowCanvas.vue'
import FlowDetailPanel from '@/components/Flow/FlowDetailPanel.vue'
import { logger } from '@/utils/logger'

// FlowCanvas 组件引用
const flowCanvasRef = ref<InstanceType<typeof FlowCanvas>>()
// 文件输入引用
const fileInputRef = ref<HTMLInputElement>()

// 当前选中的节点
const selectedNode = ref<Node<NodeData> | null>(null)

/**
 * 处理节点选中事件
 */
function handleNodeSelected(node: Node<NodeData> | null) {
  selectedNode.value = node
  logger.info('[FlowEditor] Node selected', {
    nodeId: node?.id,
    hasAssetInfo: !!node?.data?.assetInfo
  })
}

/**
 * 处理编辑资产事件
 */
function handleEditAsset(nodeId: string) {
  logger.info('[FlowEditor] Edit asset requested', { nodeId })
  flowCanvasRef.value?.openEditDialog(nodeId)
}

/**
 * 处理导出事件
 */
function handleExport() {
  flowCanvasRef.value?.handleExport()
}

/**
 * 处理导入事件
 */
function handleImport() {
  fileInputRef.value?.click()
}

/**
 * 处理文件选择变化
 */
async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  try {
    await flowCanvasRef.value?.handleImport(file)
    logger.info('[FlowEditor] Import successful')
  } catch (error) {
    logger.error('[FlowEditor] Import failed', error)
    // TODO: 显示错误提示
  } finally {
    // 重置文件输入
    target.value = ''
  }
}
</script>

<style scoped lang="scss">
.flow-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.editor-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}
</style>
