<template>
  <div class="flow-canvas" data-testid="flow-canvas" @drop="onDrop" @dragover="onDragOver">
    <VueFlow
      v-model:nodes="nodes"
      v-model:edges="edges"
      :node-types="nodeTypes"
      :edge-types="edgeTypes"
      :default-viewport="{ zoom: 1, x: 0, y: 0 }"
      :min-zoom="0.3"
      :max-zoom="2"
      :fit-view-on-init="false"
      :default-edge-options="{ type: 'smoothstep', style: { stroke: '#999999', strokeWidth: 1.5 } }"
      :delete-key-code="'Delete'"
      :is-valid-connection="isValidConnection"
      @connect="onConnect"
      @edges-change="onEdgesChange"
      @nodes-change="onNodesChange"
      @node-click="onNodeClick"
    >
      <Background pattern="dots" :gap="20" :size="1.5" color="#d1d5db" />
      <Controls />
      <MiniMap />
    </VueFlow>

    <!-- 数据资产选择对话框 -->
    <AssetSelectorDialog
      v-model="showAssetDialog"
      :node-id="editingNodeId"
      :initial-asset-info="editingNodeAssetInfo"
      :initial-selected-fields="editingNodeSelectedFields"
      @confirm="handleAssetSelected"
      @cancel="handleDialogCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, markRaw } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import type { Node, Edge, Connection, EdgeChange, NodeChange, GraphNode } from '@vue-flow/core'
import type { DroppedNodeData } from '@/types/graph'
import { NodeCategory } from '@/types/nodes'
import type { NodeData, AssetInfo, FieldInfo } from '@/types/nodes'
import DataSourceNode from '@/components/Nodes/DataSourceNode.vue'
import ComputeTaskNode from '@/components/Nodes/ComputeTaskNode.vue'
import FlowEdge from '@/components/Edges/FlowEdge.vue'
import AssetSelectorDialog from '@/components/Dialogs/AssetSelectorDialog.vue'
import { createUniqueEdge } from '@/utils/edge-utils'
import { logger } from '@/utils/logger'
import { exportGraph, downloadJson, importGraph, restoreNodes } from '@/utils/exportUtils'
import { assetCache } from '@/services/assetCache'

interface Emits {
  (e: 'node-selected', node: Node<NodeData> | null): void
  (e: 'edit-asset', nodeId: string): void
}

const emit = defineEmits<Emits>()

// 获取坐标投影函数（将屏幕坐标转换为画布坐标）
const { project } = useVueFlow()

// 注册自定义节点类型
const nodeTypes = {
  data_source: markRaw(DataSourceNode),
  compute_task: markRaw(ComputeTaskNode)
}

// 注册自定义连接线类型
const edgeTypes = {
  default: markRaw(FlowEdge)
}

// 节点和连接线数据
const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])

// 数据资产选择对话框状态
const showAssetDialog = ref(false)
const editingNodeId = ref<string>()
const editingNodeAssetInfo = ref<AssetInfo>()
const editingNodeSelectedFields = ref<string[]>()
const pendingNodePosition = ref<{ x: number; y: number } | null>(null)

/**
 * 验证连接是否有效
 * 业务规则：
 * 1. 两个数据源节点不能直接连接
 * 2. 连接必须从输出 handle 连接到输入 handle
 * 3. 不能连接到同一个节点
 */
const isValidConnection = (
  connection: Connection,
  { sourceNode, targetNode }: { sourceNode: GraphNode; targetNode: GraphNode }
): boolean => {
  // 不允许连接到同一个节点
  if (connection.source === connection.target) {
    return false
  }

  const sourceData = sourceNode.data as NodeData
  const targetData = targetNode.data as NodeData

  // 规则 1: 两个数据源节点不能直接连接
  if (sourceData.category === NodeCategory.DATA_SOURCE && targetData.category === NodeCategory.DATA_SOURCE) {
    console.warn('⚠️ 连接被拒绝：两个数据源节点不能直接连接')
    return false
  }

  // 规则 2: 数据源节点只能从输出 handle 连出，计算任务节点只能从输入 handle 连入
  // 在我们的实现中：
  // - 数据源节点只有输出 handle (id="output", type="source")
  // - 计算任务节点有输入 handle (id="input", type="target") 和输出 handle (id="output", type="source")
  // 所以我们需要验证：targetHandle 必须是 "input"（表示连接到目标节点的输入端）
  if (connection.targetHandle !== 'input') {
    console.warn('⚠️ 连接被拒绝：必须连接到目标节点的输入 handle (input)')
    return false
  }

  // 规则 3: 连接必须从源节点的输出 handle 开始
  if (connection.sourceHandle !== 'output') {
    console.warn('⚠️ 连接被拒绝：必须从源节点的输出 handle (output) 开始')
    return false
  }

  return true
}

/**
 * 处理连接事件
 * 所有连接都使用固定的 handle ID：
 * - 数据源/任务节点的输出: "output"
 * - 任务节点的输入: "input"
 */
const onConnect = (connection: Connection) => {
  // 创建连接 - 使用固定的 handle ID
  const newEdge = createUniqueEdge({
    source: connection.source,
    target: connection.target,
    sourceHandle: 'output',
    targetHandle: 'input'
  }, edges.value)
  edges.value.push(newEdge)
}

/**
 * 处理节点变化（删除等）
 * 删除节点时，自动删除所有连接到该节点的连接线
 */
const onNodesChange = (changes: NodeChange[]) => {
  for (const change of changes) {
    if (change.type === 'remove' && change.id) {
      // 删除所有与该节点相关的连接线
      edges.value = edges.value.filter(
        edge => edge.source !== change.id && edge.target !== change.id
      )
    }
  }
}

/**
 * 处理连接线变化（删除等）
 */
const onEdgesChange = (_changes: EdgeChange[]) => {
  // 固定 handle 系统不需要在删除 edge 时做额外处理
}

/**
 * 处理拖放事件 - 拖拽经过
 */
const onDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

/**
 * 处理拖放事件 - 放置节点
 */
const onDrop = (event: DragEvent) => {
  const rawData = event.dataTransfer?.getData('application/vueflow')
  if (!rawData) return

  try {
    const data: DroppedNodeData = JSON.parse(rawData)

    // 只对数据源节点弹出选择对话框
    if (data.category !== NodeCategory.DATA_SOURCE) {
      // 非数据源节点直接创建
      createNode(data, event)
      return
    }

    // 数据源节点：保存位置信息，弹出对话框
    const projected = project({
      x: event.offsetX,
      y: event.offsetY
    })

    pendingNodePosition.value = {
      x: projected.x - 100,
      y: projected.y - 30
    }

    // 打开选择对话框
    showAssetDialog.value = true
    logger.info('[FlowCanvas] Opening asset selector dialog for new node')
  } catch (error) {
    logger.error('[FlowCanvas] Failed to parse dropped data', error)
  }
}

/**
 * 创建节点
 */
function createNode(data: DroppedNodeData, event: DragEvent | { x: number; y: number }) {
  const position = 'offsetX' in event
    ? (() => {
        const projected = project({ x: event.offsetX, y: event.offsetY })
        return {
          x: projected.x - 100,
          y: projected.y - 30
        }
      })()
    : pendingNodePosition.value || { x: 100, y: 100 }

  const newNode: Node = {
    id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: data.type,
    position,
    data: {
      label: data.label,
      category: data.category,
      taskType: data.taskType,
      sourceType: data.sourceType,
      icon: data.icon,
      color: data.color,
      description: data.description
    }
  }

  nodes.value.push(newNode)
  logger.info('[FlowCanvas] Node created', { nodeId: newNode.id, type: newNode.type })
}

/**
 * 处理资产选择确认
 */
function handleAssetSelected(selection: { assetInfo: AssetInfo; selectedFields: FieldInfo[] }) {
  // 如果有编辑中的节点 ID，更新该节点
  // 否则创建新节点
  if (editingNodeId.value) {
    const node = nodes.value.find(n => n.id === editingNodeId.value)
    if (node) {
      ;(node.data as NodeData).assetInfo = selection.assetInfo
      ;(node.data as NodeData).selectedFields = selection.selectedFields.map(f => f.name)
      logger.info('[FlowCanvas] Node asset updated', { nodeId: editingNodeId.value })
    }
    editingNodeId.value = undefined
  } else {
    // 创建新节点
    const nodeData: DroppedNodeData = {
      type: 'data_source',
      label: selection.assetInfo.assetName,
      category: NodeCategory.DATA_SOURCE,
      sourceType: 'database' as any,
      icon: 'database',
      color: '#52C41A',
      description: selection.assetInfo.intro
    }

    // 临时事件对象用于 createNode
    const tempEvent = { offsetX: pendingNodePosition.value!.x + 100, offsetY: pendingNodePosition.value!.y + 30 } as any
    createNode(nodeData, tempEvent)

    // 将资产信息保存到新创建的节点
    const newNode = nodes.value[nodes.value.length - 1]
    if (newNode) {
      ;(newNode.data as NodeData).assetInfo = selection.assetInfo
      ;(newNode.data as NodeData).selectedFields = selection.selectedFields.map(f => f.name)
      logger.info('[FlowCanvas] New node asset saved', { nodeId: newNode.id })
    }
  }

  // 清理状态
  pendingNodePosition.value = null
  showAssetDialog.value = false
}

/**
 * 处理对话框取消
 */
function handleDialogCancel() {
  logger.info('[FlowCanvas] Asset selector dialog cancelled')

  // 如果是编辑模式，只关闭对话框，保持原有配置不变
  // 如果是新建模式，删除节点（已在对话框中处理，这里只需关闭）
  showAssetDialog.value = false
  editingNodeId.value = undefined
  editingNodeAssetInfo.value = undefined
  editingNodeSelectedFields.value = undefined
  pendingNodePosition.value = null
}

/**
 * 处理节点点击事件
 */
function onNodeClick(event: any) {
  const node = event.node as Node<NodeData>
  emit('node-selected', node)
  logger.info('[FlowCanvas] Node clicked', { nodeId: node.id })
}

/**
 * 打开编辑对话框
 */
function openEditDialog(nodeId: string) {
  const node = nodes.value.find(n => n.id === nodeId)
  if (!node) {
    logger.warn('[FlowCanvas] Node not found for editing', { nodeId })
    return
  }

  const nodeData = node.data as NodeData

  // 设置编辑状态
  editingNodeId.value = nodeId
  editingNodeAssetInfo.value = nodeData.assetInfo
  editingNodeSelectedFields.value = nodeData.selectedFields

  showAssetDialog.value = true
  logger.info('[FlowCanvas] Opening edit dialog', {
    nodeId,
    hasAssetInfo: !!nodeData.assetInfo
  })
}

/**
 * 导出任务图
 */
function handleExport() {
  try {
    const json = exportGraph(nodes.value, edges.value)
    downloadJson(json)
    logger.info('[FlowCanvas] Export successful')
  } catch (error) {
    logger.error('[FlowCanvas] Export failed', error)
    // TODO: 显示错误提示
  }
}

/**
 * 导入任务图
 */
async function handleImport(file: File) {
  try {
    const data = await importGraph(file)

    // 恢复节点和边
    nodes.value = restoreNodes(data.nodes)
    edges.value = data.edges || []

    // 重建缓存
    assetCache.rebuildFromNodes(nodes.value)

    logger.info('[FlowCanvas] Import successful', {
      nodeCount: nodes.value.length,
      edgeCount: edges.value.length
    })
  } catch (error) {
    logger.error('[FlowCanvas] Import failed', error)
    // TODO: 显示错误提示
    throw error
  }
}

// 暴露方法供父组件调用
defineExpose({
  openEditDialog,
  handleExport,
  handleImport
})
</script>

<style scoped lang="scss">
.flow-canvas {
  width: 100%;
  height: 100%;
  background-color: #ffffff;
}

// n8n 风格控制按钮样式
:deep(.vue-flow__controls) {
  button {
    background-color: #ffffff;
    border: 1px solid #e0e0e0;
    color: #666666;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);

    &:hover {
      background-color: #f5f5f5;
      border-color: #1890ff;
      color: #1890ff;
    }

    &:active {
      background-color: #e6e6e6;
    }
  }
}

// n8n 风格连接线样式
:deep(.vue-flow__edge-path) {
  stroke: #999999;
  stroke-width: 1.5;
}

:deep(.vue-flow__edge.selected .vue-flow__edge-path) {
  stroke: #1890ff;
}

// n8n 风格选中节点样式
:deep(.vue-flow__node.selected) {
  outline: 2px solid #1890ff;
  outline-offset: 2px;
}

// n8n 风格 Minimap 样式
:deep(.vue-flow__minimap) {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  .vue-flow__minimap-mask {
    fill: rgba(24, 144, 255, 0.1);
    stroke: #1890ff;
    stroke-width: 2;
  }

  .vue-flow__minimap-node {
    fill: #52C41A;
    stroke: #389e0d;
    stroke-width: 1;
  }
}
</style>
