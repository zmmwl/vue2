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

    <!-- 技术路径选择对话框 -->
    <TechPathSelector
      v-model="showTechPathDialog"
      :compute-type="pendingComputeType"
      @confirm="handleTechPathSelected"
      @cancel="handleTechPathCancel"
    />

    <!-- 字段选择对话框 -->
    <FieldSelector
      v-model="showFieldSelectorDialog"
      :source-node-id="pendingConnectionSource || ''"
      :source-name="pendingSourceName || ''"
      :source-type="pendingSourceType || ''"
      :participant-id="pendingParticipantId || ''"
      :dataset="pendingDataset || ''"
      :available-fields="pendingAvailableFields || []"
      @confirm="handleFieldSelected"
      @cancel="handleFieldSelectorCancel"
    />

    <!-- 输出配置对话框 -->
    <OutputConfig
      v-model="showOutputConfigDialog"
      :task-id="pendingOutputTaskId || ''"
      :enterprises="availableEnterprises"
      :input-fields="availableInputFields"
      :model-output-fields="availableModelFields"
      :initial-config="pendingOutputConfig"
      @confirm="handleOutputConfigConfirmed"
      @cancel="handleOutputConfigCancelled"
    />

    <!-- 企业选择对话框（用于模型和算力） -->
    <EnterpriseSelector
      v-model="showEnterpriseDialog"
      :enterprises="availableEnterprises"
      @confirm="handleEnterpriseSelected"
      @cancel="handleEnterpriseDialogCancel"
    />

    <!-- 模型选择对话框 -->
    <ModelSelector
      v-model="showModelSelectorDialog"
      :participant-id="selectedParticipantId || ''"
      @confirm="handleModelSelected"
      @cancel="handleModelSelectorCancel"
    />

    <!-- 算力选择对话框 -->
    <ComputeSelector
      v-model="showComputeSelectorDialog"
      :participant-id="selectedParticipantId || ''"
      @confirm="handleComputeSelected"
      @cancel="handleComputeSelectorCancel"
    />

    <!-- 表达式编辑对话框 -->
    <ExpressionEditor
      v-model="showExpressionEditorDialog"
      :initial-expression="pendingExpression || ''"
      @confirm="handleExpressionConfirmed"
      @cancel="handleExpressionEditorCancel"
    />

    <!-- 本地任务企业选择对话框 -->
    <LocalTaskEnterpriseSelector
      v-model="showLocalTaskEnterpriseDialog"
      @confirm="handleLocalTaskEnterpriseSelected"
      @cancel="handleLocalTaskEnterpriseCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, markRaw, onMounted, onUnmounted, computed } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import type { Node, Connection, EdgeChange, NodeChange, GraphNode } from '@vue-flow/core'
import type { DroppedNodeData } from '@/types/graph'
import { NodeCategory, ComputeTaskType, TechPath, ResourceTypePriority } from '@/types/nodes'
import type { NodeData, AssetInfo, FieldInfo, FieldMapping, ComputeTaskNodeData, OutputField } from '@/types/nodes'
import DataSourceNode from '@/components/Nodes/DataSourceNode.vue'
import ComputeTaskNode from '@/components/Nodes/ComputeTaskNode.vue'
import OutputDataNode from '@/components/Nodes/OutputDataNode.vue'
import ModelNode from '@/components/Nodes/ModelNode.vue'
import ComputeResourceNode from '@/components/Nodes/ComputeResourceNode.vue'
import LocalTaskNode from '@/components/Nodes/LocalTaskNode.vue'
import FlowEdge from '@/components/Edges/FlowEdge.vue'
import AssetSelectorDialog from '@/components/Dialogs/AssetSelectorDialog.vue'
import TechPathSelector from '@/components/Modals/TechPathSelector.vue'
import FieldSelector from '@/components/Modals/FieldSelector.vue'
import OutputConfig from '@/components/Modals/OutputConfig.vue'
import EnterpriseSelector from '@/components/Modals/EnterpriseSelector.vue'
import ModelSelector from '@/components/Modals/ModelSelector.vue'
import ComputeSelector from '@/components/Modals/ComputeSelector.vue'
import ExpressionEditor from '@/components/Modals/ExpressionEditor.vue'
import LocalTaskEnterpriseSelector from '@/components/Modals/LocalTaskEnterpriseSelector.vue'
import { createUniqueEdge } from '@/utils/edge-utils'
import { logger } from '@/utils/logger'
import { downloadJsonFile } from '@/utils/file-downloader'
import { convertDagToJson } from '@/utils/dag-export'
import { importGraph, restoreNodes } from '@/utils/exportUtils'
import { assetCache } from '@/services/assetCache'
import { buildJoinConditions } from '@/utils/join-builder'
import { MOCK_ENTERPRISES } from '@/utils/mock-data'
import { sortEnterprisesByPriority } from '@/utils/enterprise-sorter'
import { useGraphState } from '@/composables/useGraphState'

interface Emits {
  (e: 'node-selected', node: Node<NodeData> | null): void
  (e: 'edit-asset', nodeId: string): void
}

const emit = defineEmits<Emits>()

// 使用共享的图状态管理
const { nodes, edges, addNode, addEdge, setNodes, setEdges } = useGraphState()

// 获取坐标投影函数（将屏幕坐标转换为画布坐标）
const { project } = useVueFlow()

// 注册自定义节点类型
const nodeTypes = {
  data_source: markRaw(DataSourceNode),
  compute_task: markRaw(ComputeTaskNode),
  outputData: markRaw(OutputDataNode),
  modelNode: markRaw(ModelNode),
  computeResource: markRaw(ComputeResourceNode),
  localTask: markRaw(LocalTaskNode)
}

// 注册自定义连接线类型
const edgeTypes = {
  default: markRaw(FlowEdge)
}

// 数据资产选择对话框状态
const showAssetDialog = ref(false)
const editingNodeId = ref<string>()
const editingNodeAssetInfo = ref<AssetInfo>()
const editingNodeSelectedFields = ref<string[]>()
const pendingNodePosition = ref<{ x: number; y: number } | null>(null)

// 技术路径选择对话框状态
const showTechPathDialog = ref(false)
const pendingComputeType = ref<ComputeTaskType>(ComputeTaskType.PSI)
const pendingNodeData = ref<DroppedNodeData | null>(null)

// 字段选择对话框状态
const showFieldSelectorDialog = ref(false)
const pendingConnection = ref<Connection | null>(null)
const pendingConnectionSource = ref<string>('')
const pendingSourceName = ref<string>('')
const pendingSourceType = ref<string>('')
const pendingParticipantId = ref<string>('')
const pendingDataset = ref<string>('')
const pendingAvailableFields = ref<FieldInfo[]>([])

// 输出配置对话框状态
const showOutputConfigDialog = ref(false)
const pendingOutputTaskId = ref<string>('')
const pendingOutputConfig = ref<{
  participantId: string
  dataset: string
  fields: OutputField[]
} | undefined>(undefined)

// 企业选择对话框状态（用于模型和算力）
const showEnterpriseDialog = ref(false)
const selectedParticipantId = ref<string>('')
const pendingResourceType = ref<'model' | 'compute'>('model')
const pendingModelOrComputeData = ref<DroppedNodeData | null>(null)
const pendingTargetTaskNodeId = ref<string>('')  // 存储目标任务节点 ID

// 模型选择对话框状态
const showModelSelectorDialog = ref(false)

// 算力选择对话框状态
const showComputeSelectorDialog = ref(false)

// 表达式编辑对话框状态
const showExpressionEditorDialog = ref(false)
const pendingExpression = ref<string>('')
const pendingExpressionData = ref<DroppedNodeData | null>(null)

// 本地任务企业选择对话框状态
const showLocalTaskEnterpriseDialog = ref(false)
const pendingLocalTaskData = ref<DroppedNodeData | null>(null)

/**
 * 获取可用的企业列表（按优先级排序）
 */
const availableEnterprises = computed(() => {
  // 将 MOCK_ENTERPRISES 转换为 EnterpriseOption 格式
  const enterpriseOptions = MOCK_ENTERPRISES.map(ent => ({
    id: ent.participantId,
    name: ent.entityName,
    resourceType: ResourceTypePriority.OTHER
  }))
  return sortEnterprisesByPriority(enterpriseOptions)
})

/**
 * 获取可用的输入字段（来自所有输入数据源）
 */
const availableInputFields = computed(() => {
  if (!pendingOutputTaskId.value) return []

  const taskNode = nodes.value.find(n => n.id === pendingOutputTaskId.value)
  if (!taskNode) return []

  const taskData = taskNode.data as ComputeTaskNodeData
  const fields: Array<{ id: string; name: string; type: string; source: string }> = []

  // 从 inputProviders 提取字段
  taskData.inputProviders?.forEach((provider) => {
    provider.fields.forEach(field => {
      fields.push({
        id: `input-${field.columnName}`,
        name: field.columnName,
        type: field.columnType,
        source: `${provider.participantId}.${provider.dataset}`
      })
    })
  })

  return fields
})

/**
 * 获取可用的模型输出字段
 */
const availableModelFields = computed(() => {
  // TODO: 当实现模型配置后，从模型中提取输出字段
  return []
})

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

  // 规则 2: 连接到计算任务节点时，根据源节点类型自动修正 targetHandle
  if (targetData.category === NodeCategory.COMPUTE_TASK) {
    // 根据源节点类型确定正确的 targetHandle
    let correctHandle: string
    if (sourceData.category === NodeCategory.DATA_SOURCE || sourceData.category === NodeCategory.OUTPUT_DATA) {
      correctHandle = 'data-input' // 顶部
    } else if (sourceData.category === NodeCategory.MODEL) {
      correctHandle = 'input' // 左侧
    } else if (sourceData.category === NodeCategory.COMPUTE_RESOURCE) {
      correctHandle = 'compute-input' // 右侧
    } else {
      correctHandle = connection.targetHandle || 'data-input'
    }

    // 直接修改 connection 对象的 targetHandle
    // 这样 Vue Flow 在后续处理和渲染时会使用正确的 handle
    if (connection.targetHandle !== correctHandle) {
      // TypeScript 不允许直接修改 Connection 的属性，所以需要类型断言
      ;(connection as any).targetHandle = correctHandle
    }
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
 * - 任务节点的输入: 根据源节点类型自动选择
 *   - 数据源节点 → "data-input" (顶部)
 *   - 模型节点 → "input" (左侧)
 *   - 算力节点 → "compute-input" (右侧)
 */
const onConnect = (connection: Connection) => {
  const sourceNode = nodes.value.find(n => n.id === connection.source)
  const targetNode = nodes.value.find(n => n.id === connection.target)

  if (!sourceNode || !targetNode) {
    logger.warn('[FlowCanvas] Source or target node not found for connection')
    return
  }

  const sourceData = sourceNode.data as NodeData
  const targetData = targetNode.data as ComputeTaskNodeData

  // 根据源节点类型自动设置正确的 targetHandle
  let correctedTargetHandle = connection.targetHandle
  if (targetData.category === NodeCategory.COMPUTE_TASK) {
    if (sourceData.category === NodeCategory.DATA_SOURCE || sourceData.category === NodeCategory.OUTPUT_DATA) {
      // 数据源/输出节点连接到计算任务的顶部 data-input handle
      correctedTargetHandle = 'data-input'
    } else if (sourceData.category === NodeCategory.MODEL) {
      // 模型节点连接到计算任务的左侧 input handle
      correctedTargetHandle = 'input'
    } else if (sourceData.category === NodeCategory.COMPUTE_RESOURCE) {
      // 算力节点连接到计算任务的右侧 compute-input handle
      correctedTargetHandle = 'compute-input'
    }
  }

  // 创建修正后的连接对象
  const correctedConnection: Connection = {
    ...connection,
    targetHandle: correctedTargetHandle
  }

  // 检查是否连接到计算任务节点
  if (targetData.category === NodeCategory.COMPUTE_TASK) {
    // 保存待处理的连接（使用修正后的连接）
    pendingConnection.value = correctedConnection
    pendingConnectionSource.value = correctedConnection.source
    pendingSourceType.value = sourceData.category === NodeCategory.DATA_SOURCE ? 'dataSource' : 'outputData'

    // 获取源节点的字段信息
    if (sourceData.category === NodeCategory.DATA_SOURCE && sourceData.assetInfo) {
      // 数据源节点
      pendingSourceName.value = sourceData.assetInfo.assetName
      pendingParticipantId.value = sourceData.assetInfo.participantId
      pendingDataset.value = sourceData.assetInfo.assetId
      pendingAvailableFields.value = sourceData.assetInfo.dataInfo.fieldList.map(field => ({
        name: field.name,
        dataType: field.dataType,
        dataLength: field.dataLength,
        description: field.description
      }))
    } else if (sourceData.category === NodeCategory.OUTPUT_DATA) {
      // 输出节点 - 从父任务的输出配置获取字段
      const outputData = sourceData as any
      pendingSourceName.value = outputData.dataset || '输出数据'
      pendingParticipantId.value = outputData.participantId || ''
      pendingDataset.value = outputData.dataset || ''

      // 获取输出字段
      const outputFields = outputData.fields || []
      pendingAvailableFields.value = outputFields.map((field: any) => ({
        name: field.columnName,
        dataType: field.columnType,
        description: field.columnAlias
      }))
    } else {
      logger.warn('[FlowCanvas] Unsupported source node type for field selection')
      return
    }

    // 打开字段选择对话框
    showFieldSelectorDialog.value = true
    logger.info('[FlowCanvas] Opening field selector dialog for connection')
  } else {
    // 直接创建连接（非计算任务节点）
    const newEdge = createUniqueEdge({
      source: correctedConnection.source,
      target: correctedConnection.target,
      sourceHandle: correctedConnection.sourceHandle || 'output',
      targetHandle: correctedConnection.targetHandle || 'input'
    }, edges.value)
    addEdge(newEdge)
  }
}

/**
 * 处理节点变化（删除等）
 * 删除节点时，自动删除所有连接到该节点的连接线
 * 删除计算任务节点时，级联删除关联的输出节点
 */
const onNodesChange = (changes: NodeChange[]) => {
  for (const change of changes) {
    if (change.type === 'remove' && change.id) {
      const removedNode = nodes.value.find(n => n.id === change.id)

      // 如果删除的是计算任务节点，级联删除其输出节点
      if (removedNode) {
        const nodeData = removedNode.data as ComputeTaskNodeData
        if (nodeData.category === NodeCategory.COMPUTE_TASK && nodeData.outputs) {
          // 收集需要删除的输出节点ID
          const outputNodeIds = nodeData.outputs.map(output => output.outputNodeId)
          // 级联删除输出节点
          setNodes(nodes.value.filter(n => !outputNodeIds.includes(n.id)))
          logger.info('[FlowCanvas] Cascade deleted output nodes', {
            taskId: change.id,
            outputNodeCount: outputNodeIds.length
          })
        }
      }

      // 删除所有与该节点相关的连接线
      setEdges(edges.value.filter(
        edge => edge.source !== change.id && edge.target !== change.id
      ))
    }
  }
}

/**
 * 处理连接线变化（删除等）
 * 删除输出节点的连线时，自动删除该输出节点
 */
const onEdgesChange = (changes: EdgeChange[]) => {
  for (const change of changes) {
    if (change.type === 'remove' && change.id) {
      // 查找被删除的边
      const removedEdge = edges.value.find(e => e.id === change.id)

      if (removedEdge) {
        // 检查是否是从计算任务到输出节点的连接
        const targetNode = nodes.value.find(n => n.id === removedEdge.target)
        if (targetNode) {
          const targetData = targetNode.data as NodeData
          if (targetData.category === NodeCategory.OUTPUT_DATA) {
            // 删除输出节点
            setNodes(nodes.value.filter(n => n.id !== targetNode.id))

            // 从父任务的 outputs 数组中移除该输出配置
            const sourceNode = nodes.value.find(n => n.id === removedEdge.source)
            if (sourceNode) {
              const sourceData = sourceNode.data as ComputeTaskNodeData
              if (sourceData.outputs) {
                sourceData.outputs = sourceData.outputs.filter(
                  output => output.outputNodeId !== targetNode.id
                )
                logger.info('[FlowCanvas] Auto-deleted output node on edge removal', {
                  outputNodeId: targetNode.id,
                  parentTaskId: sourceNode.id
                })
              }
            }
          }
        }
      }
    }
  }
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

    // 计算位置
    const projected = project({
      x: event.offsetX,
      y: event.offsetY
    })
    pendingNodePosition.value = {
      x: projected.x - 100,
      y: projected.y - 30
    }

    // 处理不同类型的节点
    if (data.category === NodeCategory.DATA_SOURCE) {
      // 数据源节点：弹出资产选择对话框
      showAssetDialog.value = true
      logger.info('[FlowCanvas] Opening asset selector dialog for new node')
    } else if (data.category === NodeCategory.COMPUTE_TASK) {
      // 计算任务节点：弹出技术路径选择对话框
      pendingNodeData.value = data
      pendingComputeType.value = (data.taskType as ComputeTaskType) || ComputeTaskType.PSI
      showTechPathDialog.value = true
      logger.info('[FlowCanvas] Opening tech path selector dialog for compute task')
    } else if (data.category === 'model') {
      // 模型节点：检查是否拖拽到计算任务节点上
      const targetElement = document.elementFromPoint(event.clientX, event.clientY)
      const targetNodeElement = targetElement?.closest('.vue-flow__node')

      if (targetNodeElement) {
        const nodeId = targetNodeElement.getAttribute('data-id')
        const targetNode = nodes.value.find(n => n.id === nodeId)

        if (targetNode && targetNode.data?.category === NodeCategory.COMPUTE_TASK) {
          // 拖拽到计算任务上：保存目标任务节点 ID
          pendingModelOrComputeData.value = data
          pendingResourceType.value = 'model'
          pendingTargetTaskNodeId.value = targetNode.id

          // 检查是否是表达式模型
          if (data.modelType === 'expression') {
            // 表达式模型：直接创建，不需要企业选择
            pendingExpressionData.value = data
            pendingExpression.value = ''
            showExpressionEditorDialog.value = true
          } else {
            // 其他模型：弹出企业选择对话框
            showEnterpriseDialog.value = true
          }
        } else {
          logger.warn('[FlowCanvas] Model nodes can only be dropped on compute task nodes')
        }
      } else {
        logger.warn('[FlowCanvas] No target node found for model drop')
      }
    } else if (data.category === 'computeResource') {
      // 算力资源节点：检查是否拖拽到计算任务节点上
      const targetElement = document.elementFromPoint(event.clientX, event.clientY)
      const targetNodeElement = targetElement?.closest('.vue-flow__node')

      if (targetNodeElement) {
        const nodeId = targetNodeElement.getAttribute('data-id')
        const targetNode = nodes.value.find(n => n.id === nodeId)

        if (targetNode && targetNode.data?.category === NodeCategory.COMPUTE_TASK) {
          // 拖拽到计算任务上：弹出企业选择对话框
          pendingModelOrComputeData.value = data
          pendingResourceType.value = 'compute'
          pendingTargetTaskNodeId.value = targetNode.id  // 保存目标任务节点 ID
          showEnterpriseDialog.value = true
        } else {
          logger.warn('[FlowCanvas] Compute resource nodes can only be dropped on compute task nodes')
        }
      } else {
        logger.warn('[FlowCanvas] No target node found for compute resource drop')
      }
    } else if (data.category === 'localTask') {
      // 本地任务节点：弹出企业选择对话框
      pendingLocalTaskData.value = data
      showLocalTaskEnterpriseDialog.value = true
      logger.info('[FlowCanvas] Opening local task enterprise selector dialog')
    } else {
      // 其他节点类型直接创建
      createNode(data, event)
    }
  } catch (error) {
    logger.error('[FlowCanvas] Failed to parse dropped data', error)
  }
}

/**
 * 创建节点
 */
function createNode(
  data: DroppedNodeData,
  event: DragEvent | { x: number; y: number },
  techPath?: TechPath
) {
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
      description: data.description,
      // DAG任务编排相关字段
      techPath: techPath,
      inputProviders: [],
      joinConditions: [],
      models: [],
      computeProviders: [],
      outputs: []
    } as NodeData
  }

  addNode(newNode)
  logger.info('[FlowCanvas] Node created', {
    nodeId: newNode.id,
    type: newNode.type,
    techPath: techPath
  })
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
 * 处理技术路径选择确认
 */
function handleTechPathSelected(techPath: TechPath) {
  logger.info('[FlowCanvas] Tech path selected', { techPath })

  if (pendingNodeData.value) {
    // 创建计算任务节点
    createNode(pendingNodeData.value, { x: 0, y: 0 }, techPath)
  }

  // 清理状态
  pendingNodeData.value = null
  pendingNodePosition.value = null
  showTechPathDialog.value = false
}

/**
 * 处理技术路径选择取消
 */
function handleTechPathCancel() {
  logger.info('[FlowCanvas] Tech path selector dialog cancelled')

  // 清理状态
  pendingNodeData.value = null
  pendingNodePosition.value = null
  showTechPathDialog.value = false
}

/**
 * 处理字段选择确认
 */
function handleFieldSelected(selection: {
  sourceNodeId: string
  sourceType: 'dataSource' | 'outputData'
  participantId: string
  dataset: string
  fields: FieldMapping[]
}) {
  logger.info('[FlowCanvas] Field selection confirmed', {
    sourceNodeId: selection.sourceNodeId,
    fieldCount: selection.fields.length
  })

  if (!pendingConnection.value) {
    logger.warn('[FlowCanvas] No pending connection to apply field selection')
    return
  }

  // 创建连接
  const newEdge = createUniqueEdge({
    source: pendingConnection.value.source,
    target: pendingConnection.value.target,
    sourceHandle: 'output',
    targetHandle: 'input'
  }, edges.value)
  edges.value.push(newEdge)

  // 更新目标计算任务节点的输入配置
  const targetNode = nodes.value.find(n => n.id === pendingConnection.value!.target)
  if (targetNode) {
    const taskData = targetNode.data as ComputeTaskNodeData

    // 初始化 inputProviders 数组
    if (!taskData.inputProviders) {
      taskData.inputProviders = []
    }

    // 添加新的输入提供者
    const newInputProvider = {
      sourceNodeId: selection.sourceNodeId,
      sourceType: selection.sourceType,
      participantId: selection.participantId,
      dataset: selection.dataset,
      fields: selection.fields
    }

    taskData.inputProviders.push(newInputProvider)

    // 构建 Join 条件
    taskData.joinConditions = buildJoinConditions(taskData.inputProviders)

    logger.info('[FlowCanvas] Input provider added to task', {
      taskId: targetNode.id,
      inputProviderCount: taskData.inputProviders.length,
      joinConditionsCount: taskData.joinConditions.length
    })
  }

  // 清理状态
  clearFieldSelectorState()
}

/**
 * 处理字段选择取消
 */
function handleFieldSelectorCancel() {
  logger.info('[FlowCanvas] Field selector dialog cancelled')

  // 清理状态，不创建连接
  clearFieldSelectorState()
}

/**
 * 清理字段选择器状态
 */
function clearFieldSelectorState() {
  pendingConnection.value = null
  pendingConnectionSource.value = ''
  pendingSourceName.value = ''
  pendingSourceType.value = ''
  pendingParticipantId.value = ''
  pendingDataset.value = ''
  pendingAvailableFields.value = []
  showFieldSelectorDialog.value = false
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
    const json = convertDagToJson(nodes.value, edges.value)
    downloadJsonFile(json)
    logger.info('[FlowCanvas] Export successful', {
      jobId: json.jobId,
      taskCount: json.taskList.length
    })
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
    setNodes(restoreNodes(data.nodes))
    setEdges(data.edges || [])

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

/**
 * 处理添加输出按钮点击
 */
function handleAddOutput(event: Event) {
  const customEvent = event as CustomEvent
  const { nodeId } = customEvent.detail

  const taskNode = nodes.value.find(n => n.id === nodeId)
  if (!taskNode) {
    logger.warn('[FlowCanvas] Task node not found for output addition', { nodeId })
    return
  }

  const taskData = taskNode.data as ComputeTaskNodeData

  // 检查是否已配置输入数据
  if (!taskData.inputProviders || taskData.inputProviders.length === 0) {
    logger.warn('[FlowCanvas] Cannot add output: no input providers configured')
    // TODO: 显示提示信息
    return
  }

  // 设置待处理的输出任务
  pendingOutputTaskId.value = nodeId
  pendingOutputConfig.value = undefined

  // 打开输出配置对话框
  showOutputConfigDialog.value = true
  logger.info('[FlowCanvas] Opening output config dialog', { taskId: nodeId })
}

/**
 * 处理输出配置确认
 */
function handleOutputConfigConfirmed(config: {
  participantId: string
  dataset: string
  fields: OutputField[]
}) {
  logger.info('[FlowCanvas] Output config confirmed', {
    taskId: pendingOutputTaskId.value,
    participantId: config.participantId,
    fieldCount: config.fields.length
  })

  if (!pendingOutputTaskId.value) {
    logger.warn('[FlowCanvas] No pending task for output configuration')
    return
  }

  const taskNode = nodes.value.find(n => n.id === pendingOutputTaskId.value)
  if (!taskNode) {
    logger.warn('[FlowCanvas] Task node not found for output configuration')
    return
  }

  const taskData = taskNode.data as ComputeTaskNodeData

  // 在计算任务下方创建输出节点
  const outputNodeId = `output_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const outputPosition = {
    x: taskNode.position.x,
    y: taskNode.position.y + 150
  }

  const outputNode: Node = {
    id: outputNodeId,
    type: 'outputData',
    position: outputPosition,
    data: {
      label: config.dataset,
      category: NodeCategory.OUTPUT_DATA,
      color: '#52C41A',
      icon: 'download',
      description: `输出到 ${config.participantId}`,
      parentTaskId: pendingOutputTaskId.value,
      participantId: config.participantId,
      dataset: config.dataset,
      fields: config.fields
    } as any
  }

  addNode(outputNode)

  // 创建从计算任务到输出节点的连接
  const outputEdge = createUniqueEdge({
    source: pendingOutputTaskId.value,
    target: outputNodeId,
    sourceHandle: 'output',
    targetHandle: 'input'
  }, edges.value)
  edges.value.push(outputEdge)

  // 更新计算任务的 outputs 数组
  if (!taskData.outputs) {
    taskData.outputs = []
  }

  taskData.outputs.push({
    id: `output_config_${Date.now()}`,
    participantId: config.participantId,
    dataset: config.dataset,
    outputFields: config.fields,
    outputNodeId: outputNodeId
  })

  logger.info('[FlowCanvas] Output node created and linked', {
    outputNodeId,
    parentTaskId: pendingOutputTaskId.value,
    edgeId: outputEdge.id
  })

  // 清理状态
  clearOutputConfigState()
}

/**
 * 处理输出配置取消
 */
function handleOutputConfigCancelled() {
  logger.info('[FlowCanvas] Output config dialog cancelled')

  // 清理状态
  clearOutputConfigState()
}

/**
 * 清理输出配置状态
 */
function clearOutputConfigState() {
  pendingOutputTaskId.value = ''
  pendingOutputConfig.value = undefined
  showOutputConfigDialog.value = false
}

/**
 * 处理企业选择确认（用于模型和算力）
 */
function handleEnterpriseSelected(participantId: string) {
  logger.info('[FlowCanvas] Enterprise selected for resource', {
    participantId,
    resourceType: pendingResourceType.value
  })

  selectedParticipantId.value = participantId

  if (pendingResourceType.value === 'model') {
    // 打开模型选择对话框
    showModelSelectorDialog.value = true
    showEnterpriseDialog.value = false
  } else {
    // 打开算力选择对话框
    showComputeSelectorDialog.value = true
    showEnterpriseDialog.value = false
  }
}

/**
 * 处理企业选择对话框取消
 */
function handleEnterpriseDialogCancel() {
  logger.info('[FlowCanvas] Enterprise selector dialog cancelled')
  showEnterpriseDialog.value = false
  selectedParticipantId.value = ''
  pendingModelOrComputeData.value = null
  pendingTargetTaskNodeId.value = ''
}

/**
 * 处理模型选择确认
 */
function handleModelSelected(model: any) {
  logger.info('[FlowCanvas] Model selected', {
    modelId: model.id,
    participantId: selectedParticipantId.value
  })

  if (!pendingModelOrComputeData.value) {
    logger.warn('[FlowCanvas] No pending model data')
    return
  }

  // 创建模型节点
  createModelNode(pendingModelOrComputeData.value, model, selectedParticipantId.value)

  // 清理状态
  showModelSelectorDialog.value = false
  selectedParticipantId.value = ''
  pendingModelOrComputeData.value = null
  pendingTargetTaskNodeId.value = ''
}

/**
 * 处理模型选择取消
 */
function handleModelSelectorCancel() {
  logger.info('[FlowCanvas] Model selector dialog cancelled')
  showModelSelectorDialog.value = false
  selectedParticipantId.value = ''
  pendingModelOrComputeData.value = null
  pendingTargetTaskNodeId.value = ''
}

/**
 * 处理算力选择确认
 */
function handleComputeSelected(compute: any) {
  logger.info('[FlowCanvas] Compute resource selected', {
    computeId: compute.id,
    participantId: selectedParticipantId.value
  })

  if (!pendingModelOrComputeData.value) {
    logger.warn('[FlowCanvas] No pending compute data')
    return
  }

  // 创建算力节点
  createComputeResourceNode(pendingModelOrComputeData.value, compute, selectedParticipantId.value)

  // 清理状态
  showComputeSelectorDialog.value = false
  selectedParticipantId.value = ''
  pendingModelOrComputeData.value = null
  pendingTargetTaskNodeId.value = ''
}

/**
 * 处理算力选择取消
 */
function handleComputeSelectorCancel() {
  logger.info('[FlowCanvas] Compute selector dialog cancelled')
  showComputeSelectorDialog.value = false
  selectedParticipantId.value = ''
  pendingModelOrComputeData.value = null
  pendingTargetTaskNodeId.value = ''
}

/**
 * 处理表达式确认
 */
function handleExpressionConfirmed(expression: string) {
  logger.info('[FlowCanvas] Expression confirmed')

  if (!pendingExpressionData.value) {
    logger.warn('[FlowCanvas] No pending expression data')
    return
  }

  // 创建表达式模型节点
  const expressionModel = {
    id: 'expression_' + Date.now(),
    name: '表达式',
    type: 'expression'
  }

  // 获取目标计算任务节点
  const targetElement = document.querySelector('.vue-flow__node.selected')
  const targetNodeId = targetElement?.getAttribute('data-id')
  const targetTaskNode = nodes.value.find(n => n.id === targetNodeId)

  if (targetTaskNode) {
    createModelNode(pendingExpressionData.value, expressionModel, targetTaskNode.data?.label as string, expression)
  }

  // 清理状态
  showExpressionEditorDialog.value = false
  pendingExpression.value = ''
  pendingExpressionData.value = null
}

/**
 * 处理表达式编辑取消
 */
function handleExpressionEditorCancel() {
  logger.info('[FlowCanvas] Expression editor dialog cancelled')
  showExpressionEditorDialog.value = false
  pendingExpression.value = ''
  pendingExpressionData.value = null
}

/**
 * 处理本地任务企业选择确认
 */
function handleLocalTaskEnterpriseSelected(participantId: string) {
  logger.info('[FlowCanvas] Local task enterprise selected', { participantId })

  if (!pendingLocalTaskData.value) {
    logger.warn('[FlowCanvas] No pending local task data')
    return
  }

  // 创建本地任务节点
  createLocalTaskNode(pendingLocalTaskData.value, participantId)

  // 清理状态
  showLocalTaskEnterpriseDialog.value = false
  pendingLocalTaskData.value = null
}

/**
 * 处理本地任务企业选择取消
 */
function handleLocalTaskEnterpriseCancel() {
  logger.info('[FlowCanvas] Local task enterprise selector dialog cancelled')
  showLocalTaskEnterpriseDialog.value = false
  pendingLocalTaskData.value = null
}

/**
 * 创建模型节点
 */
function createModelNode(
  data: DroppedNodeData,
  model: any,
  participantId: string,
  expression?: string
) {
  // 使用保存的目标任务节点 ID
  const targetTaskNode = nodes.value.find(n => n.id === pendingTargetTaskNodeId.value)

  if (!targetTaskNode) {
    logger.warn('[FlowCanvas] No target compute task node found')
    return
  }

  const taskData = targetTaskNode.data as ComputeTaskNodeData

  // 在计算任务左侧创建模型节点
  const modelNodeId = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const modelPosition = {
    x: targetTaskNode.position.x - 200,
    y: targetTaskNode.position.y
  }

  const modelNode: Node = {
    id: modelNodeId,
    type: 'modelNode',
    position: modelPosition,
    data: {
      label: model.name,
      category: 'model',
      color: '#8B5CF6',
      icon: '📦',
      type: data.modelType || model.type,
      participantId: participantId,
      modelId: model.id,
      expression: expression,
      parameters: []
    } as any
  }

  addNode(modelNode)

  // 创建从模型节点到计算任务的连接
  const modelEdge = createUniqueEdge({
    source: modelNodeId,
    target: targetTaskNode.id,
    sourceHandle: 'output',
    targetHandle: 'input'
  }, edges.value)
  edges.value.push(modelEdge)

  // 更新计算任务的 models 数组
  if (!taskData.models) {
    taskData.models = []
  }

  taskData.models.push({
    type: data.modelType || model.type,
    id: model.id,
    name: model.name,
    participantId: participantId,
    expression: expression,
    parameters: [],
    modelNodeId: modelNodeId
  })

  logger.info('[FlowCanvas] Model node created and linked', {
    modelNodeId,
    parentTaskId: targetTaskNode.id,
    edgeId: modelEdge.id
  })
}

/**
 * 创建算力资源节点
 */
function createComputeResourceNode(
  _data: DroppedNodeData,
  compute: any,
  participantId: string
) {
  // 使用保存的目标任务节点 ID
  const targetTaskNode = nodes.value.find(n => n.id === pendingTargetTaskNodeId.value)

  if (!targetTaskNode) {
    logger.warn('[FlowCanvas] No target compute task node found')
    return
  }

  const taskData = targetTaskNode.data as ComputeTaskNodeData

  // 在计算任务右侧创建算力节点
  const computeNodeId = `compute_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const computePosition = {
    x: targetTaskNode.position.x + 350,
    y: targetTaskNode.position.y
  }

  const computeNode: Node = {
    id: computeNodeId,
    type: 'computeResource',
    position: computePosition,
    data: {
      label: compute.name,
      category: 'computeResource',
      color: '#FA8C16',
      icon: '⚡',
      participantId: participantId,
      resourceId: compute.id,
      resourceType: compute.type
    } as any
  }

  addNode(computeNode)

  // 创建从算力节点到计算任务的连接
  const computeEdge = createUniqueEdge({
    source: computeNodeId,
    target: targetTaskNode.id,
    sourceHandle: 'output',
    targetHandle: 'compute-input'
  }, edges.value)
  edges.value.push(computeEdge)

  // 更新计算任务的 computeProviders 数组
  if (!taskData.computeProviders) {
    taskData.computeProviders = []
  }

  taskData.computeProviders.push({
    participantId: participantId,
    id: compute.id,
    type: compute.type,
    groupId: compute.groupId || '',
    groupName: compute.groupName || '',
    nodeId: compute.nodeId || '',
    cardSerial: compute.cardSerial || '',
    cardModel: compute.cardModel || '',
    resourceNodeId: computeNodeId
  })

  logger.info('[FlowCanvas] Compute resource node created and linked', {
    computeNodeId,
    parentTaskId: targetTaskNode.id,
    edgeId: computeEdge.id
  })
}

/**
 * 创建本地任务节点
 */
function createLocalTaskNode(data: DroppedNodeData, participantId: string) {
  const position = pendingNodePosition.value || { x: 100, y: 100 }

  const localTaskNode: Node = {
    id: `localTask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'localTask',
    position: {
      x: position.x,
      y: position.y
    },
    data: {
      label: data.label,
      category: 'localTask',
      computeType: 'CONCAT',
      icon: data.icon,
      color: data.color,
      description: data.description,
      participantId: participantId,
      inputProviders: [],
      joinConditions: [],
      outputs: []
    } as any
  }

  addNode(localTaskNode)
  logger.info('[FlowCanvas] Local task node created', {
    nodeId: localTaskNode.id,
    participantId
  })

  // 清理状态
  pendingNodePosition.value = null
}

// 暴露方法供父组件调用
defineExpose({
  openEditDialog,
  handleExport,
  handleImport
})

// 生命周期：注册全局事件监听器
onMounted(() => {
  document.addEventListener('add-output', handleAddOutput)
})

onUnmounted(() => {
  document.removeEventListener('add-output', handleAddOutput)
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
