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

    <!-- 技术路径选择对话框 (DAG 任务编排) -->
    <TechPathSelector
      v-model:visible="showTechPathDialog"
      :task-type="pendingTaskType!"
      @confirm="handleTechPathSelected"
      @cancel="handleTechPathCancel"
    />

    <!-- 字段选择对话框 (DAG 任务编排 - US2) -->
    <FieldSelector
      v-model:visible="showFieldSelectorDialog"
      :data-source-id="pendingSourceNodeData?.assetInfo?.assetId || ''"
      :data-source-label="pendingSourceNodeData?.label || ''"
      :fields="pendingSourceNodeData?.assetInfo?.dataInfo?.fieldList || []"
      @confirm="handleFieldSelected"
      @cancel="handleFieldSelectorCancel"
    />

    <!-- 输出数据配置对话框 (T028-T030) -->
    <OutputConfigSelector
      v-model:visible="showOutputConfigDialog"
      :recommended-enterprises="recommendedEnterprises"
      :available-fields="availableOutputFields"
      @confirm="handleOutputConfigConfirm"
      @cancel="handleOutputConfigCancel"
    />

    <!-- 模型配置对话框 (T039-T041) -->
    <ModelSelector
      v-model:visible="showModelDialog"
      :model-type="pendingModelType"
      :available-variables="getAvailableVariables()"
      @confirm="handleModelConfigConfirm"
      @cancel="handleModelConfigCancel"
    />

    <!-- 算力资源配置对话框 (T048-T050) -->
    <ResourceSelector
      v-model:visible="showResourceDialog"
      :recommended-enterprises="recommendedEnterprises"
      @confirm="handleResourceConfigConfirm"
      @cancel="handleResourceConfigCancel"
    />

    <!-- JSON 预览对话框 (T063-T065) -->
    <JsonPreviewModal
      v-model:visible="showJsonPreview"
      :json-data="previewJsonData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, markRaw, provide } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import type { Node, Edge, Connection, EdgeChange, NodeChange, GraphNode } from '@vue-flow/core'
import type { DroppedNodeData } from '@/types/graph'
import { NodeCategory, ComputeTaskType } from '@/types/nodes'
import type { NodeData, AssetInfo, FieldInfo } from '@/types/nodes'
import type { ComputeTaskNodeData } from '@/types/contracts'
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
import OutputConfigSelector from '@/components/Modals/OutputConfigSelector.vue'
import ModelSelector from '@/components/Modals/ModelSelector.vue'
import ResourceSelector from '@/components/Modals/ResourceSelector.vue'
import JsonPreviewModal from '@/components/Modals/JsonPreviewModal.vue'
import { createUniqueEdge } from '@/utils/edge-utils'
import { getComputeType } from '@/utils/node-templates'
import { logger } from '@/utils/logger'
import { importGraph, restoreNodes, downloadJson } from '@/utils/exportUtils'
import { convertDagToJson, validateExportConfig } from '@/utils/dag-export'
import { assetCache } from '@/services/assetCache'

interface Emits {
  (e: 'node-selected', node: Node<NodeData> | null): void
  (e: 'edit-asset', nodeId: string): void
}

const emit = defineEmits<Emits>()

// 获取坐标投影函数（将屏幕坐标转换为画布坐标）
const { project } = useVueFlow()

// 注册自定义节点类型 (T038: ModelNode, T048: ComputeResourceNode, T053: LocalTaskNode)
const nodeTypes = {
  data_source: markRaw(DataSourceNode),
  compute_task: markRaw(ComputeTaskNode),
  output_data: markRaw(OutputDataNode),
  model: markRaw(ModelNode),
  compute_resource: markRaw(ComputeResourceNode),
  local_task: markRaw(LocalTaskNode)
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

// 技术路径选择对话框状态 (DAG 任务编排)
const showTechPathDialog = ref(false)
const pendingTaskType = ref<ComputeTaskType>()
const pendingTaskLabel = ref<string>()
const pendingTaskIcon = ref<string>()
const pendingTaskColor = ref<string>()

// 字段选择对话框状态 (DAG 任务编排 - US2)
const showFieldSelectorDialog = ref(false)
const pendingConnection = ref<Connection | null>(null)
const pendingSourceNodeData = ref<any>()

// 输出数据配置对话框状态 (T029-T031)
const showOutputConfigDialog = ref(false)
const pendingOutputTaskNodeId = ref<string>()

// 可用输出字段列表（用于输出配置）
const availableOutputFields = ref<Array<{ name: string; type: string; source: 'input' | 'model' }>>([])

// 推荐企业列表（从当前任务的相关资源方获取）
const recommendedEnterprises = ref<any[]>([])

// 模型配置对话框状态 (T039-T041)
const showModelDialog = ref(false)
const pendingModelType = ref<string>('expression')  // 待配置的模型类型
const pendingModelTaskNodeId = ref<string>()  // 待配置模型的计算任务节点 ID
const pendingModelPosition = ref<{ x: number; y: number } | null>(null)  // 模型节点位置

// 算力资源配置对话框状态 (T048-T050)
const showResourceDialog = ref(false)
const pendingResourceTaskNodeId = ref<string>()  // 待配置资源的计算任务节点 ID
const pendingResourcePosition = ref<{ x: number; y: number } | null>(null)  // 算力资源节点位置

// JSON 预览对话框状态 (T063-T065)
const showJsonPreview = ref(false)
const previewJsonData = ref<any>(null)  // 预览的 JSON 数据

/**
 * 验证连接是否有效
 * 业务规则：
 * 1. 两个数据源节点不能直接连接
 * 2. 连接必须从输出 handle 连接到输入 handle
 * 3. 不能连接到同一个节点
 * T038: 模型节点可以连接到计算任务节点的模型输入 handle
 * T048: 算力资源节点可以连接到计算任务节点的算力输入 handle
 * T054: 本地任务节点（CONCAT）可以接受多个输入
 */
const isValidConnection = (
  connection: Connection,
  { sourceNode, targetNode }: { sourceNode: GraphNode; targetNode: GraphNode }
): boolean => {
  // 检查节点是否存在（拖动过程中可能还未找到目标节点）
  if (!sourceNode || !targetNode) {
    return false
  }

  // 调试日志
  console.log('[isValidConnection] 验证连接:', {
    source: connection.source,
    target: connection.target,
    sourceHandle: connection.sourceHandle,
    targetHandle: connection.targetHandle,
    sourceNodeType: sourceNode.type,
    targetNodeType: targetNode.type,
    sourceCategory: (sourceNode.data as NodeData)?.category,
    targetCategory: (targetNode.data as NodeData)?.category
  })

  // 不允许连接到同一个节点
  if (connection.source === connection.target) {
    console.warn('[isValidConnection] 拒绝：自连接')
    return false
  }

  const sourceData = sourceNode.data as NodeData
  const targetData = targetNode.data as NodeData
  const targetNodeType = targetNode.type

  // 规则 1: 两个数据源节点不能直接连接
  if (sourceData.category === NodeCategory.DATA_SOURCE && targetData.category === NodeCategory.DATA_SOURCE) {
    console.warn('⚠️ 连接被拒绝：两个数据源节点不能直接连接')
    return false
  }

  // T038: 模型节点可以连接到计算任务节点的模型输入 handle
  if (connection.targetHandle === 'model-input') {
    const sourceNodeType = sourceNode.type
    if (sourceNodeType !== 'model') {
      console.warn('⚠️ 连接被拒绝：只有模型节点可以连接到模型输入 handle')
      return false
    }
    if (connection.sourceHandle !== 'output') {
      console.warn('⚠️ 连接被拒绝：必须从源节点的输出 handle (output) 开始')
      return false
    }
    return true
  }

  // T048: 算力资源节点可以连接到计算任务节点的算力输入 handle
  if (connection.targetHandle === 'resource-input') {
    const sourceNodeType = sourceNode.type
    if (sourceNodeType !== 'compute_resource') {
      console.warn('⚠️ 连接被拒绝：只有算力资源节点可以连接到算力输入 handle')
      return false
    }
    if (connection.sourceHandle !== 'output') {
      console.warn('⚠️ 连接被拒绝：必须从源节点的输出 handle (output) 开始')
      return false
    }
    return true
  }

  // T054: 本地任务节点（CONCAT）允许来自数据源、输出数据节点或其他计算任务节点的输入
  if (targetNodeType === 'local_task' && connection.targetHandle === 'input') {
    const sourceNodeType = sourceNode.type
    const validSourceTypes = ['data_source', 'compute_task', 'output_data']
    if (!validSourceTypes.includes(sourceNodeType)) {
      console.warn('⚠️ 连接被拒绝：本地任务节点只接受来自数据源、计算任务或输出数据节点的输入')
      return false
    }
    if (connection.sourceHandle !== 'output') {
      console.warn('⚠️ 连接被拒绝：必须从源节点的输出 handle (output) 开始')
      return false
    }
    return true
  }

  // 规则 2: 数据源节点只能从输出 handle 连出，计算任务节点只能从输入 handle 连入
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
 *
 * T022: 连接到计算任务时弹出字段选择窗口
 * T038: 模型节点连接到计算任务节点的模型输入 handle
 * T054: 本地任务节点接受多个输入连接
 */
const onConnect = (connection: Connection) => {
  console.log('[onConnect] 连接事件触发:', {
    source: connection.source,
    target: connection.target,
    sourceHandle: connection.sourceHandle,
    targetHandle: connection.targetHandle
  })

  const sourceNode = nodes.value.find(n => n.id === connection.source)
  const targetNode = nodes.value.find(n => n.id === connection.target)

  if (!sourceNode || !targetNode) {
    console.error('[onConnect] 节点未找到:', { sourceNode: !!sourceNode, targetNode: !!targetNode })
    logger.warn('[FlowCanvas] Cannot connect: node not found')
    return
  }

  const sourceData = sourceNode.data as NodeData
  const targetData = targetNode.data as NodeData
  const targetNodeType = targetNode.type

  console.log('[onConnect] 节点数据:', {
    sourceNodeType: sourceNode.type,
    targetNodeType: targetNode.type,
    sourceCategory: sourceData.category,
    targetCategory: targetData.category,
    hasAssetInfo: !!sourceData.assetInfo,
    hasComputeType: !!(targetData as any).computeType
  })

  // T038: 如果连接到模型输入 handle，直接创建连接
  if (connection.targetHandle === 'model-input') {
    const newEdge = createUniqueEdge({
      source: connection.source,
      target: connection.target,
      sourceHandle: 'output',
      targetHandle: 'model-input'
    }, edges.value)
    edges.value.push(newEdge)
    logger.info('[FlowCanvas] Model node connected to compute task', {
      source: sourceNode.id,
      target: targetNode.id
    })
    return
  }

  // T048: 如果连接到算力输入 handle，直接创建连接
  if (connection.targetHandle === 'resource-input') {
    const newEdge = createUniqueEdge({
      source: connection.source,
      target: connection.target,
      sourceHandle: 'output',
      targetHandle: 'resource-input'
    }, edges.value)
    edges.value.push(newEdge)
    logger.info('[FlowCanvas] Resource node connected to compute task', {
      source: sourceNode.id,
      target: targetNode.id
    })
    return
  }

  // T054: 如果目标节点是本地任务节点（CONCAT），直接创建连接并添加输入提供者
  if (targetNodeType === 'local_task') {
    const newEdge = createUniqueEdge({
      source: connection.source,
      target: connection.target,
      sourceHandle: 'output',
      targetHandle: 'input'
    }, edges.value)
    edges.value.push(newEdge)

    // 添加输入提供者信息到本地任务节点
    const targetNodeData = targetNode.data as any
    if (!targetNodeData.inputProviders) {
      targetNodeData.inputProviders = []
    }

    // 从源节点获取输入提供者信息
    let inputProvider: any = null
    if (sourceNode.type === 'data_source') {
      // 数据源节点
      inputProvider = {
        sourceNodeId: sourceNode.id,
        sourceType: 'dataSource',
        participantId: sourceData.assetInfo?.participantId || '',
        dataset: sourceData.assetInfo?.assetName || '',
        fields: [] // CONCAT 不需要详细字段信息
      }
    } else if (sourceNode.type === 'compute_task' || sourceNode.type === 'output_data') {
      // 计算任务或输出数据节点
      inputProvider = {
        sourceNodeId: sourceNode.id,
        sourceType: 'outputData',
        participantId: (sourceData as any).participantId || '',
        dataset: (sourceData as any).dataset || sourceData.label || '',
        fields: []
      }
    }

    if (inputProvider) {
      targetNodeData.inputProviders.push(inputProvider)
    }

    logger.info('[FlowCanvas] Connected to local task node (CONCAT)', {
      source: sourceNode.id,
      target: targetNode.id
    })
    return
  }

  // 检查是否为 DAG 计算任务节点
  const isTargetDagTask = targetData.category === NodeCategory.COMPUTE_TASK &&
    (targetData as any).computeType

  // 检查是否为数据源节点（带有资产信息）
  const isSourceDataSource = sourceData.category === NodeCategory.DATA_SOURCE &&
    sourceData.assetInfo

  if (isTargetDagTask && isSourceDataSource) {
    // 保存连接信息，等待用户完成字段选择
    pendingConnection.value = connection
    pendingSourceNodeData.value = sourceData

    showFieldSelectorDialog.value = true
    logger.info('[FlowCanvas] Opening field selector for connection', {
      source: sourceNode.id,
      target: targetNode.id
    })
    return
  }

  // 其他连接直接创建
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
 * T031: 删除计算任务节点时，自动删除关联的输出数据节点
 * T041: 删除模型节点时，清理计算任务节点中的模型配置
 * T054: 删除源节点时，清理本地任务节点中的输入提供者
 */
const onNodesChange = (changes: NodeChange[]) => {
  for (const change of changes) {
    if (change.type === 'remove' && change.id) {
      const removedNode = nodes.value.find(n => n.id === change.id)
      const removedNodeType = removedNode?.type

      // T054: 如果删除的节点连接到本地任务节点，先清理输入提供者
      const connectedLocalTaskEdges = edges.value.filter(
        e => e.source === change.id && nodes.value.find(n => n.id === e.target)?.type === 'local_task'
      )
      for (const edge of connectedLocalTaskEdges) {
        const localTaskNode = nodes.value.find(n => n.id === edge.target)
        if (localTaskNode) {
          const localTaskData = localTaskNode.data as any
          if (localTaskData.inputProviders && Array.isArray(localTaskData.inputProviders)) {
            localTaskData.inputProviders = localTaskData.inputProviders.filter(
              (p: any) => p.sourceNodeId !== change.id
            )
            logger.info('[FlowCanvas] Removed input provider from local task node', {
              removedNodeId: change.id,
              localTaskNodeId: edge.target
            })
          }
        }
      }

      // 删除所有与该节点相关的连接线
      edges.value = edges.value.filter(
        edge => edge.source !== change.id && edge.target !== change.id
      )

      // T041: 如果删除的是模型节点，清理关联计算任务节点的模型配置
      if (removedNodeType === 'model' && removedNode) {
        // 查找所有连接到此模型节点的目标节点（计算任务节点）
        const targetNodeIds = edges.value
          .filter(e => e.source === change.id && e.targetHandle === 'model-input')
          .map(e => e.target)

        for (const taskNodeId of targetNodeIds) {
          const taskNode = nodes.value.find(n => n.id === taskNodeId)
          if (taskNode) {
            const taskData = taskNode.data as any
            // 移除对应的模型配置
            if (taskData.models && Array.isArray(taskData.models)) {
              taskData.models = taskData.models.filter((m: any) => m.sourceNodeId !== change.id)
              logger.info('[FlowCanvas] Removed model config from compute task', {
                modelNodeId: change.id,
                taskNodeId
              })
            }
          }
        }
      }

      // T048-T050: 如果删除的是算力资源节点，清理关联计算任务节点的算力配置
      if (removedNodeType === 'compute_resource' && removedNode) {
        // 查找所有连接到此算力资源节点的目标节点（计算任务节点）
        const targetNodeIds = edges.value
          .filter(e => e.source === change.id && e.targetHandle === 'resource-input')
          .map(e => e.target)

        for (const taskNodeId of targetNodeIds) {
          const taskNode = nodes.value.find(n => n.id === taskNodeId)
          if (taskNode) {
            const taskData = taskNode.data as any
            // 移除对应的算力配置
            if (taskData.computeProviders && Array.isArray(taskData.computeProviders)) {
              taskData.computeProviders = taskData.computeProviders.filter((p: any) => p.sourceNodeId !== change.id)
              logger.info('[FlowCanvas] Removed resource config from compute task', {
                resourceNodeId: change.id,
                taskNodeId
              })
            }
          }
        }
      }

      // T031: 如果删除的是计算任务节点，找出并删除所有关联的输出数据节点
      if (removedNode) {
        const nodeData = removedNode.data as any
        // 检查是否是计算任务节点（有 outputs 数组）
        if (nodeData.outputs && Array.isArray(nodeData.outputs)) {
          // 找出所有关联的输出数据节点并删除
          const outputNodeIds = nodeData.outputs.map((o: any) => o.outputNodeId)
          if (outputNodeIds.length > 0) {
            nodes.value = nodes.value.filter(n => !outputNodeIds.includes(n.id))
            logger.info('[FlowCanvas] Auto-deleted output nodes for removed compute task', {
              computeTaskNodeId: change.id,
              deletedOutputNodeIds: outputNodeIds
            })
          }
        }

        // T041: 删除计算任务节点时，也删除关联的模型节点
        if (nodeData.models && Array.isArray(nodeData.models)) {
          const modelNodeIds = nodeData.models.map((m: any) => m.sourceNodeId).filter(Boolean)
          if (modelNodeIds.length > 0) {
            nodes.value = nodes.value.filter(n => !modelNodeIds.includes(n.id))
            logger.info('[FlowCanvas] Auto-deleted model nodes for removed compute task', {
              computeTaskNodeId: change.id,
              deletedModelNodeIds: modelNodeIds
            })
          }
        }

        // T050: 删除计算任务节点时，也删除关联的算力资源节点
        if (nodeData.computeProviders && Array.isArray(nodeData.computeProviders)) {
          const resourceNodeIds = nodeData.computeProviders.map((p: any) => p.sourceNodeId).filter(Boolean)
          if (resourceNodeIds.length > 0) {
            nodes.value = nodes.value.filter(n => !resourceNodeIds.includes(n.id))
            logger.info('[FlowCanvas] Auto-deleted resource nodes for removed compute task', {
              computeTaskNodeId: change.id,
              deletedResourceNodeIds: resourceNodeIds
            })
          }
        }
      }
    }
  }
}

/**
 * 处理连接线变化（删除等）
 * T062: 删除模型连线时，清理计算任务节点中的模型配置
 */
const onEdgesChange = (changes: EdgeChange[]) => {
  for (const change of changes) {
    if (change.type === 'remove' && change.id) {
      const removedEdge = edges.value.find(e => e.id === change.id)

      if (removedEdge) {
        const sourceNodeType = nodes.value.find(n => n.id === removedEdge.source)?.type

        // T062: 如果删除的是模型连线，清理目标计算任务节点中的模型配置
        if (sourceNodeType === 'model' && removedEdge.targetHandle === 'model-input') {
          const targetNode = nodes.value.find(n => n.id === removedEdge.target)
          if (targetNode) {
            const targetData = targetNode.data as any
            if (targetData.models && Array.isArray(targetData.models)) {
              // 移除与该模型连线相关的配置
              targetData.models = targetData.models.filter((m: any) => m.sourceNodeId !== removedEdge.source)
              logger.info('[FlowCanvas] Model edge removed, cleaned up model config', {
                edgeId: change.id,
                sourceNodeId: removedEdge.source,
                targetNodeId: removedEdge.target
              })
            }
          }
        }

        // T062: 如果删除的是算力资源连线，清理目标计算任务节点中的算力配置
        if (sourceNodeType === 'compute_resource' && removedEdge.targetHandle === 'resource-input') {
          const targetNode = nodes.value.find(n => n.id === removedEdge.target)
          if (targetNode) {
            const targetData = targetNode.data as any
            if (targetData.computeProviders && Array.isArray(targetData.computeProviders)) {
              // 移除与该算力资源连线相关的配置
              targetData.computeProviders = targetData.computeProviders.filter((p: any) => p.sourceNodeId !== removedEdge.source)
              logger.info('[FlowCanvas] Resource edge removed, cleaned up resource config', {
                edgeId: change.id,
                sourceNodeId: removedEdge.source,
                targetNodeId: removedEdge.target
              })
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
 * T012: 计算任务节点弹出技术路径选择对话框
 * T061: 模型节点需要检测是否拖拽到计算任务节点上
 */
const onDrop = (event: DragEvent) => {
  const rawData = event.dataTransfer?.getData('application/vueflow')
  if (!rawData) return

  try {
    const data: DroppedNodeData = JSON.parse(rawData)

    // 数据源节点：保存位置信息，弹出资产选择对话框
    if (data.category === NodeCategory.DATA_SOURCE) {
      const projected = project({
        x: event.offsetX,
        y: event.offsetY
      })

      pendingNodePosition.value = {
        x: projected.x - 100,
        y: projected.y - 30
      }

      showAssetDialog.value = true
      logger.info('[FlowCanvas] Opening asset selector dialog for new node')
      return
    }

    // 计算任务节点：弹出技术路径选择对话框 (T012)
    if (data.category === NodeCategory.COMPUTE_TASK && data.taskType) {
      const projected = project({
        x: event.offsetX,
        y: event.offsetY
      })

      pendingNodePosition.value = {
        x: projected.x - 100,
        y: projected.y - 30
      }

      // 保存任务信息，等待用户选择技术路径
      pendingTaskType.value = data.taskType as ComputeTaskType
      pendingTaskLabel.value = data.label
      pendingTaskIcon.value = data.icon
      pendingTaskColor.value = data.color

      showTechPathDialog.value = true
      logger.info('[FlowCanvas] Opening tech path selector for compute task', { taskType: data.taskType })
      return
    }

    // T061: 模型节点拖拽处理 - 检测是否拖拽到计算任务节点上
    if (data.type === 'model') {
      const projected = project({
        x: event.offsetX,
        y: event.offsetY
      })

      // 查找拖拽位置下方的节点
      const targetNode = findNodeAtPosition(projected.x, projected.y)

      if (targetNode && targetNode.type === 'compute_task') {
        // 拖拽到计算任务节点上，打开模型配置对话框
        pendingModelPosition.value = {
          x: targetNode.position.x - 150,
          y: targetNode.position.y
        }
        pendingModelTaskNodeId.value = targetNode.id
        pendingModelType.value = data.modelType || 'expression'

        showModelDialog.value = true

        logger.info('[FlowCanvas] Model dragged to compute task, opening config dialog', {
          taskNodeId: targetNode.id,
          modelType: data.modelType
        })
      } else {
        // 没有拖拽到计算任务节点上，直接创建模型节点
        createNode(data, event)
      }
      return
    }

    // 其他节点直接创建
    createNode(data, event)
  } catch (error) {
    logger.error('[FlowCanvas] Failed to parse dropped data', error)
  }
}

/**
 * 查找指定位置下的节点
 * 用于检测拖拽释放位置是否有节点
 */
function findNodeAtPosition(x: number, y: number): Node | null {
  const threshold = 50 // 节点中心点的阈值距离

  for (const node of nodes.value) {
    const nodeCenterX = node.position.x + 100 // 假设节点宽度约200
    const nodeCenterY = node.position.y + 30 // 假设节点高度约60

    const distance = Math.sqrt(
      Math.pow(x - nodeCenterX, 2) + Math.pow(y - nodeCenterY, 2)
    )

    if (distance < threshold) {
      return node
    }
  }

  return null
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
 * 处理技术路径选择确认 (T013)
 * 创建计算任务节点并设置 computeType 和 techPath
 */
function handleTechPathSelected(techPath: 'software' | 'tee') {
  if (!pendingTaskType.value || !pendingTaskLabel.value) {
    logger.warn('[FlowCanvas] No pending task data')
    return
  }

  // 计算最终计算类型
  const computeType = getComputeType(pendingTaskType.value, techPath)

  // 创建计算任务节点数据
  const newNodeData: ComputeTaskNodeData = {
    label: pendingTaskLabel.value,
    computeType: computeType as any,
    techPath: techPath,
    inputProviders: [],
    joinConditions: [],
    models: [],
    computeProviders: [],
    outputs: []
  }

  // 创建节点
  const newNode: Node = {
    id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'compute_task',
    position: pendingNodePosition.value || { x: 100, y: 100 },
    data: {
      ...newNodeData,
      icon: pendingTaskIcon.value || '🧮',
      color: pendingTaskColor.value || '#1890FF',
      category: NodeCategory.COMPUTE_TASK,
      taskType: pendingTaskType.value
    } as any
  }

  nodes.value.push(newNode)
  logger.info('[FlowCanvas] Compute task node created with tech path', {
    nodeId: newNode.id,
    taskType: pendingTaskType.value,
    techPath,
    computeType
  })

  // 清理状态
  pendingNodePosition.value = null
  pendingTaskType.value = undefined
  pendingTaskLabel.value = undefined
  pendingTaskIcon.value = undefined
  pendingTaskColor.value = undefined
  showTechPathDialog.value = false
}

/**
 * 处理技术路径选择取消
 */
function handleTechPathCancel() {
  logger.info('[FlowCanvas] Tech path selector dialog cancelled')

  // 清理状态
  pendingNodePosition.value = null
  pendingTaskType.value = undefined
  pendingTaskLabel.value = undefined
  pendingTaskIcon.value = undefined
  pendingTaskColor.value = undefined
  showTechPathDialog.value = false
}

/**
 * 处理字段选择确认 (T022)
 * 创建连接并保存字段配置到目标计算任务节点
 */
function handleFieldSelected(fieldMappings: any[]) {
  if (!pendingConnection.value || !pendingSourceNodeData.value) {
    logger.warn('[FlowCanvas] No pending connection data')
    return
  }

  const connection = pendingConnection.value
  const targetNode = nodes.value.find(n => n.id === connection.target)

  if (!targetNode) {
    logger.warn('[FlowCanvas] Target node not found')
    return
  }

  // 保存字段配置到计算任务节点
  const targetData = targetNode.data as any
  if (!targetData.inputProviders) {
    targetData.inputProviders = []
  }

  // 添加输入提供者配置
  targetData.inputProviders.push({
    sourceNodeId: connection.source,
    sourceType: 'dataSource',
    participantId: pendingSourceNodeData.value.assetInfo?.participantId || '',
    dataset: pendingSourceNodeData.value.assetInfo?.dataInfo?.tableName || '',
    fields: fieldMappings
  })

  // 构建 Join 条件
  const joinFields = fieldMappings.filter(f => f.isJoinField)
  if (joinFields.length > 0) {
    // 按连接类型分组
    const innerJoinFields = joinFields.filter(f => f.joinType === 'INNER')
    const crossJoinFields = joinFields.filter(f => f.joinType === 'CROSS')

    if (innerJoinFields.length > 0) {
      targetData.joinConditions = targetData.joinConditions || []
      targetData.joinConditions.push({
        joinType: 'INNER',
        operands: [{
          participantId: pendingSourceNodeData.value.assetInfo?.participantId || '',
          dataset: pendingSourceNodeData.value.assetInfo?.dataInfo?.tableName || '',
          columnNames: innerJoinFields.map(f => f.columnName)
        }]
      })
    }

    if (crossJoinFields.length > 0) {
      targetData.joinConditions = targetData.joinConditions || []
      targetData.joinConditions.push({
        joinType: 'CROSS',
        operands: [{
          participantId: pendingSourceNodeData.value.assetInfo?.participantId || '',
          dataset: pendingSourceNodeData.value.assetInfo?.dataInfo?.tableName || '',
          columnNames: crossJoinFields.map(f => f.columnName)
        }]
      })
    }
  }

  // 创建连接 (T023: 用户确认后才创建连接)
  const newEdge = createUniqueEdge({
    source: connection.source,
    target: connection.target,
    sourceHandle: 'output',
    targetHandle: 'input'
  }, edges.value)
  edges.value.push(newEdge)

  logger.info('[FlowCanvas] Connection created with field configuration', {
    source: connection.source,
    target: connection.target,
    fieldCount: fieldMappings.length,
    joinFieldCount: joinFields.length
  })

  // 清理状态
  pendingConnection.value = null
  pendingSourceNodeData.value = null
  showFieldSelectorDialog.value = false
}

/**
 * 处理字段选择取消 (T023)
 * 取消时不创建连接
 */
function handleFieldSelectorCancel() {
  logger.info('[FlowCanvas] Field selector dialog cancelled - connection not created')

  // 清理状态，不创建连接
  pendingConnection.value = null
  pendingSourceNodeData.value = null
  showFieldSelectorDialog.value = false
}

/**
 * 处理添加输出数据节点 (T029)
 * 打开输出配置对话框
 */
function handleAddOutput(nodeId: string) {
  const taskNode = nodes.value.find(n => n.id === nodeId)
  if (!taskNode) {
    logger.warn('[FlowCanvas] Task node not found', { nodeId })
    return
  }

  const taskData = taskNode.data as any

  // 收集可用输出字段（从输入数据提供者中获取）
  const fields: Array<{ name: string; type: string; source: 'input' | 'model' }> = []

  // 从输入提供者获取字段
  if (taskData.inputProviders && Array.isArray(taskData.inputProviders)) {
    for (const provider of taskData.inputProviders) {
      if (provider.fields && Array.isArray(provider.fields)) {
        for (const field of provider.fields) {
          fields.push({
            name: `${provider.participantId}.${provider.dataset}.${field.columnName}`,
            type: field.columnType,
            source: 'input' as const
          })
        }
      }
    }
  }

  // TODO: 从模型输出获取字段（需要模型配置后实现）

  availableOutputFields.value = fields
  pendingOutputTaskNodeId.value = nodeId

  // 收集推荐企业（从当前任务的相关资源方获取）
  const enterprises = new Map<string, { id: string; name: string; resourceType: number }>()

  // 添加输入数据所属企业
  if (taskData.inputProviders && Array.isArray(taskData.inputProviders)) {
    for (const provider of taskData.inputProviders) {
      const participantId = provider.participantId
      if (!enterprises.has(participantId)) {
        enterprises.set(participantId, {
          id: participantId,
          name: participantId, // 简化：实际应该从企业列表获取名称
          resourceType: 3 // DATA 资源
        })
      }
    }
  }

  // TODO: 添加模型、算力所属企业

  recommendedEnterprises.value = Array.from(enterprises.values())

  showOutputConfigDialog.value = true
  logger.info('[FlowCanvas] Opening output config dialog', {
    taskNodeId: nodeId,
    availableFields: fields.length,
    recommendedEnterprises: recommendedEnterprises.value.length
  })
}

// Provide addOutput handler for child nodes (T029)
provide('addOutputHandler', handleAddOutput)

/**
 * 处理输出配置确认 (T030)
 * 创建输出数据节点并连接到计算任务节点
 */
function handleOutputConfigConfirm(config: { participantId: string; fields: Array<{ name: string; type: string; source: 'input' | 'model'; alias?: string }> }) {
  if (!pendingOutputTaskNodeId.value) {
    logger.warn('[FlowCanvas] No pending task node for output')
    return
  }

  const taskNode = nodes.value.find(n => n.id === pendingOutputTaskNodeId.value)
  if (!taskNode) {
    logger.warn('[FlowCanvas] Task node not found', { nodeId: pendingOutputTaskNodeId.value })
    return
  }

  const taskData = taskNode.data as any

  // 计算输出节点位置（在计算任务节点下方）
  const outputPosition = {
    x: taskNode.position.x,
    y: taskNode.position.y + 120
  }

  // 创建输出数据节点
  const outputNodeId = `output_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const outputNode: Node = {
    id: outputNodeId,
    type: 'output_data',
    position: outputPosition,
    data: {
      label: `输出-${config.participantId}`,
      participantId: config.participantId,
      parentTaskId: pendingOutputTaskNodeId.value,
      dataset: `output_${Date.now()}`,
      fields: config.fields.map(f => ({
        source: f.source,
        columnName: f.name,
        columnAlias: f.alias || f.name,
        columnType: f.type
      })),
      category: NodeCategory.OUTPUT_DATA
    } as any
  }

  nodes.value.push(outputNode)

  // 添加输出配置到计算任务节点
  if (!taskData.outputs) {
    taskData.outputs = []
  }

  taskData.outputs.push({
    id: `output_config_${Date.now()}`,
    participantId: config.participantId,
    dataset: outputNode.data.dataset,
    outputFields: config.fields.map(f => ({
      source: f.source,
      columnName: f.name,
      columnAlias: f.alias || f.name,
      columnType: f.type
    })),
    outputNodeId: outputNodeId
  })

  // 创建从计算任务到输出数据节点的连接
  const newEdge = createUniqueEdge({
    source: pendingOutputTaskNodeId.value,
    target: outputNodeId,
    sourceHandle: 'output',
    targetHandle: 'input'
  }, edges.value)
  edges.value.push(newEdge)

  logger.info('[FlowCanvas] Output data node created and connected', {
    outputNodeId,
    taskNodeId: pendingOutputTaskNodeId.value,
    participantId: config.participantId,
    fieldCount: config.fields.length
  })

  // 清理状态
  pendingOutputTaskNodeId.value = undefined
  showOutputConfigDialog.value = false
}

/**
 * 处理输出配置取消
 */
function handleOutputConfigCancel() {
  logger.info('[FlowCanvas] Output config dialog cancelled')

  // 清理状态
  pendingOutputTaskNodeId.value = undefined
  showOutputConfigDialog.value = false
}

/**
 * 获取可用变量列表（从输入提供者中收集）(T039)
 */
function getAvailableVariables(): string[] {
  const variables: string[] = []

  for (const node of nodes.value) {
    const nodeData = node.data as any
    // 从计算任务节点的输入提供者获取字段
    if (nodeData.inputProviders && Array.isArray(nodeData.inputProviders)) {
      for (const provider of nodeData.inputProviders) {
        if (provider.fields && Array.isArray(provider.fields)) {
          for (const field of provider.fields) {
            variables.push(`${provider.participantId}.${provider.dataset}.${field.columnName}`)
          }
        }
      }
    }
  }

  return variables
}

/**
 * 处理添加模型节点 (T039)
 * 打开模型配置对话框
 */
function handleAddModel(taskNodeId: string, position: { x: number; y: number }) {
  const taskNode = nodes.value.find(n => n.id === taskNodeId)
  if (!taskNode) {
    logger.warn('[FlowCanvas] Task node not found', { nodeId: taskNodeId })
    return
  }

  pendingModelTaskNodeId.value = taskNodeId
  pendingModelPosition.value = position

  showModelDialog.value = true
  logger.info('[FlowCanvas] Opening model config dialog', { taskNodeId })
}

// Provide addModel handler for child nodes (T039)
provide('addModelHandler', handleAddModel)

/**
 * 处理模型配置确认 (T040)
 * 创建模型节点并连接到计算任务节点
 */
function handleModelConfigConfirm(config: {
  modelType: string
  participantId?: string
  modelId?: string
  expression?: string
  parameters?: any[]
}) {
  if (!pendingModelTaskNodeId.value || !pendingModelPosition.value) {
    logger.warn('[FlowCanvas] No pending task node for model')
    return
  }

  const taskNode = nodes.value.find(n => n.id === pendingModelTaskNodeId.value)
  if (!taskNode) {
    logger.warn('[FlowCanvas] Task node not found', { nodeId: pendingModelTaskNodeId.value })
    return
  }

  const taskData = taskNode.data as any

  // 创建模型节点
  const modelNodeId = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const newNode: Node = {
    id: modelNodeId,
    type: 'model',
    position: pendingModelPosition.value,
    data: {
      label: config.modelId ? `模型-${config.modelId}` : '表达式模型',
      modelType: config.modelType,
      participantId: config.participantId,
      modelId: config.modelId,
      expression: config.expression,
      parameters: config.parameters,
      icon: '🧠',
      color: '#13C2C2',
      category: 'model'
    } as any
  }

  nodes.value.push(newNode)

  // 添加模型配置到计算任务节点
  if (!taskData.models) {
    taskData.models = []
  }

  taskData.models.push({
    id: `model_config_${Date.now()}`,
    modelType: config.modelType,
    participantId: config.participantId,
    modelId: config.modelId,
    expression: config.expression,
    parameters: config.parameters,
    sourceNodeId: modelNodeId
  })

  // 创建从模型节点到计算任务节点的连接（连接到模型输入 handle）
  const newEdge = createUniqueEdge({
    source: modelNodeId,
    target: pendingModelTaskNodeId.value,
    sourceHandle: 'output',
    targetHandle: 'model-input'
  }, edges.value)
  edges.value.push(newEdge)

  logger.info('[FlowCanvas] Model node created and connected to compute task', {
    modelNodeId,
    taskNodeId: pendingModelTaskNodeId.value,
    modelType: config.modelType
  })

  // 清理状态
  pendingModelTaskNodeId.value = undefined
  pendingModelPosition.value = null
  showModelDialog.value = false
}

/**
 * 处理模型配置取消 (T041)
 */
function handleModelConfigCancel() {
  logger.info('[FlowCanvas] Model config dialog cancelled')

  // 清理状态
  pendingModelTaskNodeId.value = undefined
  pendingModelPosition.value = null
  showModelDialog.value = false
}

/**
 * 处理添加算力资源节点 (T049)
 * 打开算力资源配置对话框
 */
function handleAddResource(taskNodeId: string, position: { x: number; y: number }) {
  const taskNode = nodes.value.find(n => n.id === taskNodeId)
  if (!taskNode) {
    logger.warn('[FlowCanvas] Task node not found', { nodeId: taskNodeId })
    return
  }

  pendingResourceTaskNodeId.value = taskNodeId
  pendingResourcePosition.value = position

  showResourceDialog.value = true
  logger.info('[FlowCanvas] Opening resource config dialog', { taskNodeId })
}

// Provide addResource handler for child nodes (T049)
provide('addResourceHandler', handleAddResource)

/**
 * 处理算力资源配置确认 (T050)
 * 创建算力资源节点并连接到计算任务节点
 */
function handleResourceConfigConfirm(config: {
  participantId: string
  cpu: number
  memory: number
  gpu?: number
  gpuType?: string
}) {
  if (!pendingResourceTaskNodeId.value || !pendingResourcePosition.value) {
    logger.warn('[FlowCanvas] No pending task node for resource')
    return
  }

  const taskNode = nodes.value.find(n => n.id === pendingResourceTaskNodeId.value)
  if (!taskNode) {
    logger.warn('[FlowCanvas] Task node not found', { nodeId: pendingResourceTaskNodeId.value })
    return
  }

  const taskData = taskNode.data as any

  // 创建算力资源节点
  const resourceNodeId = `resource_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const newNode: Node = {
    id: resourceNodeId,
    type: 'compute_resource',
    position: pendingResourcePosition.value,
    data: {
      label: `算力-${config.cpu}核`,
      participantId: config.participantId,
      cpu: config.cpu,
      memory: config.memory,
      gpu: config.gpu,
      gpuType: config.gpuType,
      icon: '⚡',
      color: '#FA8C16',
      category: 'compute_resource'
    } as any
  }

  nodes.value.push(newNode)

  // 添加算力配置到计算任务节点
  if (!taskData.computeProviders) {
    taskData.computeProviders = []
  }

  taskData.computeProviders.push({
    id: `resource_config_${Date.now()}`,
    participantId: config.participantId,
    cpu: config.cpu,
    memory: config.memory,
    gpu: config.gpu,
    gpuType: config.gpuType,
    sourceNodeId: resourceNodeId
  })

  // 创建从算力资源节点到计算任务节点的连接（连接到算力输入 handle）
  const newEdge = createUniqueEdge({
    source: resourceNodeId,
    target: pendingResourceTaskNodeId.value,
    sourceHandle: 'output',
    targetHandle: 'resource-input'
  }, edges.value)
  edges.value.push(newEdge)

  logger.info('[FlowCanvas] Resource node created and connected to compute task', {
    resourceNodeId,
    taskNodeId: pendingResourceTaskNodeId.value,
    cpu: config.cpu,
    memory: config.memory
  })

  // 清理状态
  pendingResourceTaskNodeId.value = undefined
  pendingResourcePosition.value = null
  showResourceDialog.value = false
}

/**
 * 处理算力资源配置取消 (T050)
 */
function handleResourceConfigCancel() {
  logger.info('[FlowCanvas] Resource config dialog cancelled')

  // 清理状态
  pendingResourceTaskNodeId.value = undefined
  pendingResourcePosition.value = null
  showResourceDialog.value = false
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
 * 导出任务图 (T063-T065)
 * 支持两种导出格式：
 * 1. 图结构格式（用于保存和加载）
 * 2. 标准JSON格式（用于提交到后端服务）
 */
function handleExport() {
  try {
    // 验证配置
    const validation = validateExportConfig(nodes.value, edges.value)

    if (!validation.valid) {
      logger.error('[FlowCanvas] Export validation failed', {
        errors: validation.errors,
        warnings: validation.warnings
      })
      // TODO: 显示错误提示给用户
      alert(`导出验证失败：\n${validation.errors.join('\n')}`)
      return
    }

    if (validation.warnings.length > 0) {
      logger.warn('[FlowCanvas] Export warnings', { warnings: validation.warnings })
    }

    // 转换为标准JSON格式
    const exportJson = convertDagToJson(nodes.value, edges.value)

    // 设置预览数据
    previewJsonData.value = exportJson
    showJsonPreview.value = true

    logger.info('[FlowCanvas] Export successful', {
      jobId: exportJson.jobId,
      taskCount: exportJson.taskList.length
    })
  } catch (error) {
    logger.error('[FlowCanvas] Export failed', error)
    alert(`导出失败：${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 下载导出的JSON文件
 */
function downloadExportJson() {
  try {
    const validation = validateExportConfig(nodes.value, edges.value)

    if (!validation.valid) {
      alert(`配置验证失败，请修复以下问题：\n${validation.errors.join('\n')}`)
      return
    }

    const exportJson = convertDagToJson(nodes.value, edges.value)
    const json = JSON.stringify(exportJson, null, 2)
    const filename = `privacy-job-${exportJson.jobId}.json`

    downloadJson(json, filename)

    logger.info('[FlowCanvas] JSON downloaded', { filename })
  } catch (error) {
    logger.error('[FlowCanvas] Download failed', error)
    alert(`下载失败：${error instanceof Error ? error.message : '未知错误'}`)
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
  downloadExportJson,
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
