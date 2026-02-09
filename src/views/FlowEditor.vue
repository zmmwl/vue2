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
      <!-- 可拖拽的分隔条 -->
      <div
        class="resize-handle"
        @mousedown="startResize"
      >
        <div class="resize-handle-line"></div>
      </div>
      <FlowDetailPanel
        :panel-width="detailPanelWidth"
        :selected-node="selectedNode"
        :export-json="exportJson"
        :view-mode="detailViewMode"
        :nodes="nodes"
        @edit="handleEditAsset"
        @view-mode-change="handleViewModeChange"
        @config-params="handleConfigParams"
        @config-group-by="handleConfigGroupBy"
        @edit-output="handleEditOutput"
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
import { ref, computed, onUnmounted } from 'vue'
import type { Node } from '@vue-flow/core'
import type { NodeData } from '@/types/nodes'
import FlowHeader from '@/components/Flow/FlowHeader.vue'
import FlowSidebar from '@/components/Flow/FlowSidebar.vue'
import FlowCanvas from '@/components/Flow/FlowCanvas.vue'
import FlowDetailPanel from '@/components/Flow/FlowDetailPanel.vue'
import { useGraphState } from '@/composables/useGraphState'
import { logger } from '@/utils/logger'

// FlowCanvas 组件引用
const flowCanvasRef = ref<InstanceType<typeof FlowCanvas>>()
// 文件输入引用
const fileInputRef = ref<HTMLInputElement>()

// 使用图状态管理
const { nodes, selectedNodeId, exportJson, detailViewMode, selectNode, setDetailViewMode } = useGraphState()

// 详情面板宽度（像素）
const MIN_PANEL_WIDTH = 300
const MAX_PANEL_WIDTH = 800
const DEFAULT_PANEL_WIDTH = 400

const detailPanelWidth = ref(DEFAULT_PANEL_WIDTH)
const isResizing = ref(false)

// 当前选中的节点
const selectedNode = computed(() => {
  if (!selectedNodeId.value) return null
  return nodes.value.find(node => node.id === selectedNodeId.value) || null
})

/**
 * 处理节点选中事件
 */
function handleNodeSelected(node: Node<NodeData> | null) {
  selectNode(node?.id || null)
  logger.info('[FlowEditor] Node selected', {
    nodeId: node?.id,
    hasAssetInfo: !!node?.data?.assetInfo
  })
}

/**
 * 处理视图模式切换
 */
function handleViewModeChange(mode: 'detail' | 'preview') {
  setDetailViewMode(mode)
  logger.info('[FlowEditor] View mode changed', { mode })
}

/**
 * 处理编辑资产事件
 */
function handleEditAsset(nodeId: string) {
  logger.info('[FlowEditor] Edit asset requested', { nodeId })
  flowCanvasRef.value?.openEditDialog(nodeId)
}

/**
 * 处理配置参数事件
 */
function handleConfigParams(data: { modelId: string; modelConfig: any; taskId: string }) {
  logger.info('[FlowEditor] Config params event received', data)
  // 直接调用 FlowCanvas 中定义的处理函数
  const flowCanvas = flowCanvasRef.value as any
  if (flowCanvas && typeof flowCanvas.handleConfigParams === 'function') {
    flowCanvas.handleConfigParams(data)
  }
}

/**
 * 处理分组统计配置事件
 */
function handleConfigGroupBy(data: { modelId: string; taskId: string }) {
  logger.info('[FlowEditor] Config GroupBy event received', data)
  // 直接调用 FlowCanvas 中定义的处理函数
  const flowCanvas = flowCanvasRef.value as any
  if (flowCanvas && typeof flowCanvas.handleConfigGroupBy === 'function') {
    flowCanvas.handleConfigGroupBy(data)
  }
}

/**
 * 处理编辑输出节点事件
 */
function handleEditOutput(nodeId: string) {
  logger.info('[FlowEditor] Edit output requested', { nodeId })
  flowCanvasRef.value?.openEditOutputDialog(nodeId)
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

/**
 * 开始调整面板大小
 */
function startResize(event: MouseEvent) {
  isResizing.value = true
  event.preventDefault()

  const startX = event.clientX
  const startWidth = detailPanelWidth.value

  function onMouseMove(e: MouseEvent) {
    if (!isResizing.value) return

    const deltaX = startX - e.clientX
    const newWidth = startWidth + deltaX

    // 限制宽度范围
    detailPanelWidth.value = Math.max(
      MIN_PANEL_WIDTH,
      Math.min(MAX_PANEL_WIDTH, newWidth)
    )
  }

  function onMouseUp() {
    isResizing.value = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
  document.body.style.cursor = 'ew-resize'
  document.body.style.userSelect = 'none'
}

// 组件卸载时清理
onUnmounted(() => {
  if (isResizing.value) {
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }
})
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
  position: relative;
}

// 可拖拽的分隔条
.resize-handle {
  position: relative;
  width: 6px;
  cursor: ew-resize;
  background: transparent;
  flex-shrink: 0;
  z-index: 10;

  &:hover {
    background: rgba(24, 144, 255, 0.1);
  }

  &:active {
    background: rgba(24, 144, 255, 0.2);
  }
}

.resize-handle-line {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: transparent;
  transform: translateX(-50%);
  transition: background 0.2s ease;
  border-radius: 1px;

  .resize-handle:hover &,
  .resize-handle:active & {
    background: #1890ff;
  }
}
</style>
