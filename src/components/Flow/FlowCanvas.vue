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
      :entity-name="selectedEntityName || ''"
      :model-type="selectedCodeBinType || ''"
      @confirm="handleModelSelected"
      @cancel="handleModelSelectorCancel"
    />

    <!-- 算力选择对话框 -->
    <ComputeSelector
      v-model="showComputeSelectorDialog"
      :participant-id="selectedParticipantId || ''"
      :entity-name="selectedEntityName || ''"
      @confirm="handleComputeSelected"
      @cancel="handleComputeSelectorCancel"
    />

    <!-- 表达式编辑对话框 -->
    <ExpressionEditor
      v-model="showExpressionEditorDialog"
      :initial-expression="pendingExpression || ''"
      :available-fields="expressionEditorAvailableFields"
      @confirm="handleExpressionConfirmed"
      @cancel="handleExpressionEditorCancel"
    />

    <!-- CodeBin 类型选择对话框 -->
    <CodeBinTypeSelector
      v-model="showCodeBinTypeSelectorDialog"
      @confirm="handleCodeBinTypeSelected"
      @cancel="handleCodeBinTypeSelectorCancel"
    />

    <!-- 本地任务企业选择对话框 -->
    <LocalTaskEnterpriseSelector
      v-model="showLocalTaskEnterpriseDialog"
      @confirm="handleLocalTaskEnterpriseSelected"
      @cancel="handleLocalTaskEnterpriseCancel"
    />

    <!-- 模型参数配置对话框 -->
    <ModelParameterConfig
      v-model="paramConfigVisible"
      :modelConfig="currentModelConfig!"
      :availableFields="availableFields"
      @confirm="handleParamConfigConfirm"
      @cancel="handleParamConfigCancel"
    />

    <!-- 统一资源选择器 -->
    <UnifiedResourceSelector
      v-model="showUnifiedSelector"
      :resourceType="selectorResourceType"
      :modelTypeFilter="selectorModelTypeFilter"
      @confirm="handleUnifiedSelectorConfirm"
      @cancel="handleUnifiedSelectorCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, markRaw, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import type { Node, Connection, EdgeChange, NodeChange, GraphNode } from '@vue-flow/core'
import type { DroppedNodeData } from '@/types/graph'
import { NodeCategory, ComputeTaskType, TechPath, ResourceTypePriority } from '@/types/nodes'
import type { NodeData, AssetInfo, FieldInfo, FieldMapping, ComputeTaskNodeData, OutputDataNodeData, OutputField, ComputeModelConfig, ModelParameter, AvailableFieldOption } from '@/types/nodes'
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
import CodeBinTypeSelector from '@/components/Modals/CodeBinTypeSelector.vue'
import ModelParameterConfig from '@/components/Modals/ModelParameterConfig.vue'
import UnifiedResourceSelector from '@/components/Modals/UnifiedResourceSelector.vue'
import { createUniqueEdge } from '@/utils/edge-utils'
import { generateAvailableFields } from '@/utils/model-config-utils'
import { logger } from '@/utils/logger'
import { downloadJsonFile } from '@/utils/file-downloader'
import { convertDagToJson } from '@/utils/dag-export'
import { importGraph, restoreNodes } from '@/utils/exportUtils'
import { assetCache } from '@/services/assetCache'
import { buildJoinConditions } from '@/utils/join-builder'
import { sortEnterprisesByPriority } from '@/utils/enterprise-sorter'
import { useGraphState } from '@/composables/useGraphState'
import { EXPRESSION_MODEL_OUTPUT, getDataTypeName, getModelInputSignatures } from '@/services/model-mock-service'
import { getEnterpriseList } from '@/services/enterpriseService'

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
  fieldSources?: Array<{ sourceType: 'model' | 'input'; sourceNodeId?: string; modelId?: string; modelNodeId?: string }>
} | undefined>(undefined)
const editingOutputNodeId = ref<string | undefined>(undefined)  // 正在编辑的输出节点 ID

// 企业选择对话框状态（用于模型和算力）
const showEnterpriseDialog = ref(false)
const selectedParticipantId = ref<string>('')
const selectedEntityName = ref<string>('')  // 选中的企业名称
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

// CodeBin 类型选择对话框状态
const showCodeBinTypeSelectorDialog = ref(false)
const pendingCodeBinData = ref<DroppedNodeData | null>(null)
const selectedCodeBinType = ref<string>('')

// 本地任务企业选择对话框状态
const showLocalTaskEnterpriseDialog = ref(false)
const pendingLocalTaskData = ref<DroppedNodeData | null>(null)

// 参数配置对话框状态
const paramConfigVisible = ref(false)
const currentModelConfig = ref<ComputeModelConfig | null>(null)
const currentTaskId = ref<string>('')
const availableFields = ref<AvailableFieldOption[]>([])

// 统一资源选择器状态
const showUnifiedSelector = ref(false)
const selectorResourceType = ref<'data' | 'model' | 'compute'>('data')
const selectorModelTypeFilter = ref<string>()
const pendingSelectorResult = ref<{
  data?: DroppedNodeData
  targetTaskNodeId?: string
}>()

/**
 * 可用的企业选项（按优先级排序）
 */
const availableEnterprises = ref<Array<{
  id: string
  name: string
  resourceType: ResourceTypePriority
}>>([])

/**
 * 加载企业列表
 */
async function loadEnterprises() {
  try {
    const enterprises = await getEnterpriseList()
    // 转换为 EnterpriseOption 格式
    availableEnterprises.value = enterprises.map(ent => ({
      id: ent.participantId,
      name: ent.entityName,
      resourceType: ResourceTypePriority.OTHER
    }))
    // 按优先级排序
    availableEnterprises.value = sortEnterprisesByPriority(availableEnterprises.value)
  } catch (error) {
    logger.error('[FlowCanvas] Failed to load enterprises', error)
    availableEnterprises.value = []
  }
}

// 组件挂载时加载企业列表
onMounted(() => {
  loadEnterprises()
})

/**
 * 获取可用的输入字段（来自所有输入数据源）
 * 按数据源分组返回，包含数据源节点信息
 */
const availableInputFields = computed(() => {
  if (!pendingOutputTaskId.value) return []

  const taskNode = nodes.value.find(n => n.id === pendingOutputTaskId.value)
  if (!taskNode) return []

  const taskData = taskNode.data as ComputeTaskNodeData
  const fields: Array<{
    id: string
    name: string
    type: string
    source: string
    sourceNodeId: string
    sourceType: 'dataSource' | 'outputData'
    participantId: string
    dataset: string
  }> = []

  // 从 inputProviders 提取字段
  taskData.inputProviders?.forEach((provider) => {
    provider.fields.forEach(field => {
      fields.push({
        id: `input-${provider.sourceNodeId}-${field.columnName}`,
        name: field.columnName,
        type: field.columnType,
        source: `${provider.participantId}.${provider.dataset}`,
        sourceNodeId: provider.sourceNodeId,
        sourceType: provider.sourceType,
        participantId: provider.participantId,
        dataset: provider.dataset
      })
    })
  })

  return fields
})

/**
 * 获取可用的模型输出字段
 * 从计算模型的配置中提取输出字段
 * - 表达式模型：只有一个默认的浮点型输出字段 "result"
 * - 其他模型：从模型详情接口获取 returnParameters
 */
const availableModelFields = computed(() => {
  if (!pendingOutputTaskId.value) return []

  const taskNode = nodes.value.find(n => n.id === pendingOutputTaskId.value)
  if (!taskNode) return []

  const taskData = taskNode.data as ComputeTaskNodeData
  const fields: Array<{
    id: string
    name: string
    type: string
    source: string
    modelId: string
    modelType: string
    participantId: string
  }> = []

  // 遍历所有模型配置
  taskData.models?.forEach(async (model) => {
    if (model.type === 'expression') {
      // 表达式模型：只有一个默认输出字段，类型是浮点型
      fields.push({
        id: `model-${model.id || model.modelNodeId}-result`,
        name: EXPRESSION_MODEL_OUTPUT.name,
        type: getDataTypeName(EXPRESSION_MODEL_OUTPUT.dataType),
        source: `表达式模型: ${model.expression || '未设置表达式'}`,
        modelId: model.id || model.modelNodeId || '',
        modelType: 'expression',
        participantId: model.participantId || ''
      })
    } else {
      // 其他模型：需要调用接口获取模型详情
      // 这里使用同步方式，实际上应该是异步的，但在 computed 中需要使用缓存或提前加载
      // 为简化实现，这里先基于已知的模型类型返回默认字段
      const modelId = model.id || ''

      // 基于 ModelType 返回一些默认的输出字段作为占位符
      // 实际应用中应该在模型选择时就预加载模型详情
      if (model.type === 'CodeBin-V2') {
        fields.push({
          id: `model-${modelId}-intersection_result`,
          name: 'intersection_result',
          type: 'STRING',
          source: `PSI求交模型V2: ${model.name}`,
          modelId: modelId,
          modelType: model.type,
          participantId: model.participantId || ''
        })
        fields.push({
          id: `model-${modelId}-intersection_size`,
          name: 'intersection_size',
          type: 'INT',
          source: `PSI求交模型V2: ${model.name}`,
          modelId: modelId,
          modelType: model.type,
          participantId: model.participantId || ''
        })
      } else if (model.type === 'CodeBin-V3-1') {
        fields.push({
          id: `model-${modelId}-statistic_value`,
          name: 'statistic_value',
          type: 'DOUBLE',
          source: `MPC统计模型V3.1: ${model.name}`,
          modelId: modelId,
          modelType: model.type,
          participantId: model.participantId || ''
        })
      } else if (model.type === 'CodeBin-V3-2') {
        fields.push({
          id: `model-${modelId}-model_accuracy`,
          name: 'model_accuracy',
          type: 'DOUBLE',
          source: `联邦学习模型V3.2: ${model.name}`,
          modelId: modelId,
          modelType: model.type,
          participantId: model.participantId || ''
        })
        fields.push({
          id: `model-${modelId}-training_loss`,
          name: 'training_loss',
          type: 'DOUBLE',
          source: `联邦学习模型V3.2: ${model.name}`,
          modelId: modelId,
          modelType: model.type,
          participantId: model.participantId || ''
        })
      } else if (model.type === 'SPDZ') {
        fields.push({
          id: `model-${modelId}-compute_result`,
          name: 'compute_result',
          type: 'DOUBLE',
          source: `SPDZ计算模型: ${model.name}`,
          modelId: modelId,
          modelType: model.type,
          participantId: model.participantId || ''
        })
      }
    }
  })

  return fields
})

/**
 * 获取表达式编辑器可用的字段
 * 从目标任务节点的输入数据源中提取字段
 */
const expressionEditorAvailableFields = computed(() => {
  if (!pendingTargetTaskNodeId.value) return []

  const taskNode = nodes.value.find(n => n.id === pendingTargetTaskNodeId.value)
  if (!taskNode) return []

  const taskData = taskNode.data as ComputeTaskNodeData
  const fields: Array<{ name: string; participantId: string; dataset: string; dataType?: string }> = []

  // 从 inputProviders 提取字段
  taskData.inputProviders?.forEach((provider) => {
    provider.fields.forEach(field => {
      fields.push({
        name: field.columnName,
        participantId: provider.participantId,
        dataset: provider.dataset,
        dataType: field.columnType
      })
    })
  })

  return fields
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

      // 只显示数据源节点中已选择的字段
      const selectedFieldNames = sourceData.selectedFields || []
      const allFields = sourceData.assetInfo.dataInfo.fieldList

      // 如果用户选择了特定字段，只返回这些字段；否则返回所有字段（向后兼容）
      const fieldsToInclude = selectedFieldNames.length > 0
        ? allFields.filter(field => selectedFieldNames.includes(field.name))
        : allFields

      pendingAvailableFields.value = fieldsToInclude.map(field => ({
        name: field.name,
        dataType: field.dataType,
        dataLength: field.dataLength,
        description: field.description,
        isPrimaryKey: field.isPrimaryKey || false
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
 * 处理节点变化（删除、选中状态变化等）
 * 删除节点时，自动删除所有连接到该节点的连接线
 * 删除计算任务节点时，级联删除关联的输出节点
 * 删除数据源节点时，级联删除计算任务中对应的输入数据配置
 * 删除模型节点时，级联删除计算任务中对应的模型配置
 */
const onNodesChange = (changes: NodeChange[]) => {
  for (const change of changes) {
    if (change.type === 'remove' && change.id) {
      const removedNode = nodes.value.find(n => n.id === change.id)

      if (removedNode) {
        const nodeData = removedNode.data as NodeData

        // 如果删除的是计算任务节点，级联删除其输出节点
        if (nodeData.category === NodeCategory.COMPUTE_TASK) {
          const taskData = removedNode.data as ComputeTaskNodeData
          if (taskData.outputs) {
            // 收集需要删除的输出节点ID
            const outputNodeIds = taskData.outputs.map(output => output.outputNodeId)
            // 级联删除输出节点
            setNodes(nodes.value.filter(n => !outputNodeIds.includes(n.id)))
            logger.info('[FlowCanvas] Cascade deleted output nodes', {
              taskId: change.id,
              outputNodeCount: outputNodeIds.length
            })
          }
        }

        // 如果删除的是数据源节点或输出节点，级联删除计算任务中对应的输入数据配置
        if (nodeData.category === NodeCategory.DATA_SOURCE || nodeData.category === NodeCategory.OUTPUT_DATA) {
          // 找到所有使用该数据源/输出节点的计算任务
          const affectedTaskNodes = nodes.value.filter(n => {
            const taskData = n.data as ComputeTaskNodeData
            return taskData.category === NodeCategory.COMPUTE_TASK &&
              taskData.inputProviders?.some(provider => provider.sourceNodeId === change.id)
          })

          // 更新受影响的计算任务节点
          affectedTaskNodes.forEach(taskNode => {
            const taskData = taskNode.data as ComputeTaskNodeData
            if (taskData.inputProviders) {
              // 移除对应的输入提供者
              taskData.inputProviders = taskData.inputProviders.filter(
                provider => provider.sourceNodeId !== change.id
              )

              // 重新构建 Join 条件
              taskData.joinConditions = buildJoinConditions(taskData.inputProviders)

              logger.info('[FlowCanvas] Cascade deleted input provider from task', {
                taskId: taskNode.id,
                removedSourceNodeId: change.id,
                remainingInputProviders: taskData.inputProviders.length
              })
            }
          })
        }

        // 如果删除的是模型节点，级联删除计算任务中对应的模型配置
        if (nodeData.category === 'model') {
          // 找到所有包含该模型节点的计算任务
          const affectedTaskNodes = nodes.value.filter(n => {
            const taskData = n.data as ComputeTaskNodeData
            return taskData.category === NodeCategory.COMPUTE_TASK &&
              taskData.models?.some(model => model.modelNodeId === change.id)
          })

          // 更新受影响的计算任务节点
          affectedTaskNodes.forEach(taskNode => {
            const taskData = taskNode.data as ComputeTaskNodeData
            if (taskData.models) {
              // 移除对应的模型配置
              taskData.models = taskData.models.filter(
                model => model.modelNodeId !== change.id
              )

              logger.info('[FlowCanvas] Cascade deleted model from task', {
                taskId: taskNode.id,
                removedModelNodeId: change.id,
                remainingModels: taskData.models.length
              })
            }
          })
        }
      }

      // 删除所有与该节点相关的连接线
      setEdges(edges.value.filter(
        edge => edge.source !== change.id && edge.target !== change.id
      ))
    }
    // 处理选中状态变化 - NodeSelectionChange.type 始终是 'select'，通过 selected 属性区分选中/取消选中
    else if (change.type === 'select' && 'id' in change && 'selected' in change) {
      const node = nodes.value.find(n => n.id === change.id)
      if (node) {
        // 更新节点的选中状态
        ;(node as any).selected = change.selected
        logger.info('[FlowCanvas] Node selection changed', {
          nodeId: change.id,
          selected: change.selected
        })
      }
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

    // 调试：输出拖放数据
    logger.info('[FlowCanvas] Drop data received', {
      category: data.category,
      label: data.label,
      NodeCategory_DATA_SOURCE: NodeCategory.DATA_SOURCE,
      match: data.category === NodeCategory.DATA_SOURCE
    })

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
      // 检查是否在测试模式（只检查明确设置的标志）
      const isTestMode = !!(window as any).__PLAYWRIGHT_TEST__

      if (isTestMode) {
        // 测试模式：直接使用模拟资产数据创建节点
        logger.info('[FlowCanvas] Test mode detected, creating node with mock asset data')
        const mockAssetInfo: AssetInfo = {
          assetId: 'test_asset_' + Date.now(),
          assetNumber: 'TEST_' + Date.now(),
          assetName: data.label || '测试数据资产',
          holderCompany: '测试企业',
          participantId: 'test_enterprise_001',
          entityName: '测试企业实体',
          intro: data.description || '用于测试的数据资产',
          dataInfo: {
            databaseName: 'test_db',
            tableName: 'test_table',
            fieldList: [
              { name: 'id', dataType: 'STRING', description: 'ID字段', dataLength: 10 },
              { name: 'name', dataType: 'STRING', description: '名称字段', dataLength: 20 },
              { name: 'value', dataType: 'INT', description: '数值字段', dataLength: 4 }
            ]
          }
        }

        const mockFields: FieldInfo[] = mockAssetInfo.dataInfo.fieldList.map(f => ({
          name: f.name,
          dataType: f.dataType,
          description: f.description
        }))

        // 直接调用 handleAssetSelected 创建节点
        handleAssetSelected({
          assetInfo: mockAssetInfo,
          selectedFields: mockFields
        })
      } else {
        // 数据源节点：使用统一资源选择器
        showUnifiedSelector.value = true
        selectorResourceType.value = 'data'
        logger.info('[FlowCanvas] Opening unified resource selector for data source')
      }
    } else if (data.category === NodeCategory.COMPUTE_TASK) {
      // 检查是否在测试模式（只检查明确设置的标志）
      const isTestMode = !!(window as any).__PLAYWRIGHT_TEST__

      if (isTestMode) {
        // 测试模式：直接使用默认技术路径（SOFTWARE）创建节点
        logger.info('[FlowCanvas] Test mode detected, creating compute task node with SOFTWARE tech path')
        const tempEvent = { offsetX: pendingNodePosition.value!.x + 100, offsetY: pendingNodePosition.value!.y + 30 } as any
        createNode(data, tempEvent, 'SOFTWARE' as TechPath)
      } else {
        // 计算任务节点：弹出技术路径选择对话框
        pendingNodeData.value = data
        pendingComputeType.value = (data.taskType as ComputeTaskType) || ComputeTaskType.PSI
        showTechPathDialog.value = true
        logger.info('[FlowCanvas] Opening tech path selector dialog for compute task')
      }
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
          } else if (data.modelType === 'codebin-select') {
            // CodeBin 组合模型：弹出类型选择对话框
            pendingCodeBinData.value = data
            pendingTargetTaskNodeId.value = targetNode.id
            selectedCodeBinType.value = ''
            showCodeBinTypeSelectorDialog.value = true
          } else {
            // 其他模型：使用统一资源选择器
            pendingSelectorResult.value = {
              data,
              targetTaskNodeId: targetNode.id
            }
            selectorResourceType.value = 'model'
            selectorModelTypeFilter.value = data.modelType
            showUnifiedSelector.value = true
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
          // 拖拽到计算任务上：使用统一资源选择器
          pendingSelectorResult.value = {
            data,
            targetTaskNodeId: targetNode.id
          }
          selectorResourceType.value = 'compute'
          showUnifiedSelector.value = true
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
      inputProviders: (data as any).inputProviders || [],
      joinConditions: (data as any).joinConditions || [],
      models: (data as any).models || [],
      computeProviders: (data as any).computeProviders || [],
      outputs: (data as any).outputs || []
    } as NodeData
  }

  logger.info('[FlowCanvas] Creating node with data:', {
    nodeId: newNode.id,
    dataCategory: data.category,
    nodeDataCategory: newNode.data.category,
    type: newNode.type,
    techPath: techPath
  })

  addNode(newNode)
  logger.info('[FlowCanvas] Node created', {
    nodeId: newNode.id,
    type: newNode.type,
    nodeCategory: newNode.data.category,
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
 * 手动设置节点的选中状态
 */
function onNodeClick(event: any) {
  const clickedNode = event.node as Node<NodeData>
  const clickedNodeId = clickedNode.id

  logger.info('[FlowCanvas] Node clicked', { nodeId: clickedNodeId })

  // 手动设置选中状态：取消所有节点的选中状态，然后选中被点击的节点
  setNodes(nodes.value.map(n => ({
    ...n,
    selected: n.id === clickedNodeId
  })))

  // 发出节点选中事件
  emit('node-selected', clickedNode)
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
 * 支持新建和编辑两种模式
 */
function handleOutputConfigConfirmed(config: {
  participantId: string
  dataset: string
  fields: OutputField[]
}) {
  logger.info('[FlowCanvas] Output config confirmed', {
    taskId: pendingOutputTaskId.value,
    isEditMode: !!editingOutputNodeId.value,
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

  // 根据 participantId 查找企业名称
  const enterprise = availableEnterprises.value.find(e => e.id === config.participantId)
  const entityName = enterprise?.name || ''

  // 编辑模式：更新现有输出节点
  if (editingOutputNodeId.value) {
    const outputNode = nodes.value.find(n => n.id === editingOutputNodeId.value)
    if (!outputNode) {
      logger.warn('[FlowCanvas] Output node not found for editing')
      return
    }

    // 更新输出节点数据
    outputNode.data = {
      ...outputNode.data,
      label: config.dataset,
      participantId: config.participantId,
      entityName: entityName,
      dataset: config.dataset,
      fields: config.fields
    } as OutputDataNodeData

    // 更新父任务的 outputs 配置
    if (taskData.outputs) {
      const outputConfig = taskData.outputs.find(o => o.outputNodeId === editingOutputNodeId.value)
      if (outputConfig) {
        outputConfig.participantId = config.participantId
        outputConfig.dataset = config.dataset
        outputConfig.outputFields = config.fields
      }
    }

    logger.info('[FlowCanvas] Output node updated', {
      outputNodeId: editingOutputNodeId.value,
      parentTaskId: pendingOutputTaskId.value
    })
  } else {
    // 新建模式：创建新的输出节点
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
        entityName: entityName,
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
  }

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
  editingOutputNodeId.value = undefined
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
  // 根据 participantId 查找企业名称
  const enterprise = availableEnterprises.value.find(e => e.id === participantId)
  selectedEntityName.value = enterprise?.name || ''

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
  selectedEntityName.value = ''
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
  selectedCodeBinType.value = ''  // 清空选中的模型类型
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
  selectedEntityName.value = ''
  selectedCodeBinType.value = ''  // 清空选中的模型类型
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
  selectedEntityName.value = ''
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

  // 对于表达式模型，使用空字符串作为 participantId（表达式不需要特定参与者）
  createModelNode(pendingExpressionData.value, expressionModel, '', expression)

  // 清理状态
  showExpressionEditorDialog.value = false
  pendingExpression.value = ''
  pendingExpressionData.value = null
  pendingTargetTaskNodeId.value = ''
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
 * 处理 CodeBin 类型选择确认
 */
function handleCodeBinTypeSelected(modelType: string) {
  logger.info('[FlowCanvas] CodeBin type selected', { modelType })

  if (!pendingCodeBinData.value) {
    logger.warn('[FlowCanvas] No pending CodeBin data')
    return
  }

  // 保存选中的模型类型
  selectedCodeBinType.value = modelType

  // 更新数据中的 modelType
  const updatedData = {
    ...pendingCodeBinData.value,
    modelType
  }

  // 关闭类型选择对话框，直接打开统一资源选择器（使用双搜索框模糊匹配）
  showCodeBinTypeSelectorDialog.value = false
  pendingSelectorResult.value = {
    data: updatedData,
    targetTaskNodeId: pendingTargetTaskNodeId.value
  }
  selectorResourceType.value = 'model'
  selectorModelTypeFilter.value = modelType
  showUnifiedSelector.value = true

  // 清理状态（但保留 selectedCodeBinType）
  pendingCodeBinData.value = null
  pendingTargetTaskNodeId.value = ''
}

/**
 * 处理 CodeBin 类型选择取消
 */
function handleCodeBinTypeSelectorCancel() {
  logger.info('[FlowCanvas] CodeBin type selector dialog cancelled')
  showCodeBinTypeSelectorDialog.value = false
  selectedCodeBinType.value = ''
  pendingCodeBinData.value = null
  pendingTargetTaskNodeId.value = ''
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
 * 处理配置参数事件（从 FlowDetailPanel 触发）
 */
function handleConfigParams(data: { modelId: string; modelConfig: ComputeModelConfig; taskId: string }) {
  logger.info('[FlowCanvas] Config params event received', data)

  currentModelConfig.value = data.modelConfig
  currentTaskId.value = data.taskId

  // 获取任务数据并生成可用字段列表
  const taskNode = nodes.value.find(n => n.id === data.taskId)
  if (taskNode) {
    const taskData = taskNode.data as ComputeTaskNodeData
    availableFields.value = generateAvailableFields(taskData)
  }

  paramConfigVisible.value = true
}

/**
 * 确认参数配置
 */
function handleParamConfigConfirm(parameters: ModelParameter[]) {
  logger.info('[FlowCanvas] Parameter config confirmed', {
    modelId: currentModelConfig.value?.id,
    paramCount: parameters.length
  })

  if (!currentModelConfig.value || !currentTaskId.value) return

  // 更新模型配置的参数
  const model = currentModelConfig.value
  model.parameters = parameters

  // 更新计算任务的 models 数组
  const taskNode = nodes.value.find(n => n.id === currentTaskId.value)
  if (taskNode) {
    const taskData = taskNode.data as ComputeTaskNodeData
    if (taskData.models) {
      const modelIndex = taskData.models.findIndex(m => m.id === model.id)
      if (modelIndex !== -1) {
        taskData.models[modelIndex] = model
        logger.info('[FlowCanvas] Model parameters updated in task', {
          taskId: currentTaskId.value,
          modelId: model.id
        })
      }
    }
  }

  paramConfigVisible.value = false
}

/**
 * 取消参数配置
 */
function handleParamConfigCancel() {
  logger.info('[FlowCanvas] Parameter config dialog cancelled')
  paramConfigVisible.value = false
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

  // 检查模型是否有输入参数，如果有则自动弹出参数配置对话框
  checkAndOpenParameterConfig(model.id, targetTaskNode.id, modelNodeId)
}

/**
 * 检查模型是否有输入参数，如果有则打开参数配置对话框
 */
async function checkAndOpenParameterConfig(modelId: string, taskId: string, modelNodeId: string) {
  try {
    const signatures = await getModelInputSignatures(modelId)

    // 如果模型有输入参数，自动打开参数配置对话框
    if (signatures && signatures.length > 0) {
      logger.info('[FlowCanvas] Model has input parameters, opening parameter config dialog', {
        modelId,
        parameterCount: signatures.length
      })

      // 查找任务节点
      const taskNode = nodes.value.find(n => n.id === taskId)
      if (!taskNode) {
        logger.warn('[FlowCanvas] Task node not found for parameter config', { taskId })
        return
      }

      const taskData = taskNode.data as ComputeTaskNodeData
      const modelInTask = taskData.models?.find(m => m.modelNodeId === modelNodeId)

      if (!modelInTask) {
        logger.warn('[FlowCanvas] Model not found in task data', { modelNodeId })
        return
      }

      // 设置配置对话框数据
      currentModelConfig.value = modelInTask
      currentTaskId.value = taskId
      availableFields.value = generateAvailableFields(taskData)

      // 打开参数配置对话框
      paramConfigVisible.value = true
    } else {
      logger.info('[FlowCanvas] Model has no input parameters, skipping parameter config', { modelId })
    }
  } catch (error) {
    logger.error('[FlowCanvas] Failed to check model input parameters', error)
  }
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

/**
 * 处理测试用的节点创建事件
 * 用于 E2E 测试中直接创建带有预设数据的节点
 */
function handleCreateTestNode(event: Event) {
  logger.info('[FlowCanvas] create-test-node event received')
  const customEvent = event as CustomEvent
  const { data, position } = customEvent.detail

  logger.info('[FlowCanvas] create-test-node data:', { category: data.category, position })

  // 保存节点位置
  pendingNodePosition.value = position

  // 支持 'DATA_SOURCE' 和 'data_source' 两种格式
  const category = data.category?.toLowerCase() || ''

  if (category === NodeCategory.DATA_SOURCE || category === 'data_source') {
    // 对于数据源节点，直接使用提供的资产信息创建
    const assetInfo = data.assetInfo as AssetInfo
    const selectedFields = data.selectedFields || []

    const fieldInfos: FieldInfo[] = selectedFields.map((name: string) => {
      const field = assetInfo.dataInfo.fieldList.find((f: any) => f.name === name)
      return {
        name,
        dataType: field?.dataType || 'STRING',
        description: field?.description || ''
      }
    })

    logger.info('[FlowCanvas] Creating data source node from test event', {
      assetName: assetInfo.assetName,
      fieldCount: fieldInfos.length
    })

    handleAssetSelected({
      assetInfo,
      selectedFields: fieldInfos
    })
  } else {
    logger.warn('[FlowCanvas] Unsupported category in create-test-node:', category)
  }
}

/**
 * 处理测试用的带输出节点的任务创建事件
 */
function handleCreateTestTaskWithOutput(event: Event) {
  logger.info('[FlowCanvas] create-test-task-with-output event received')
  const customEvent = event as CustomEvent
  const { taskData, outputData } = customEvent.detail

  // 创建计算任务节点
  const taskPosition = { x: 400, y: 200 }
  pendingNodePosition.value = taskPosition
  pendingNodeData.value = taskData

  const techPath = taskData.techPath || TechPath.SOFTWARE
  createNode(taskData as DroppedNodeData, { x: 0, y: 0 }, techPath)

  // 获取刚创建的计算任务节点
  const taskNode = nodes.value[nodes.value.length - 1]
  if (!taskNode) {
    logger.warn('[FlowCanvas] Failed to create task node')
    return
  }

  // 创建输出节点
  const outputPosition = { x: 400, y: 400 }

  // 根据 participantId 查找企业名称
  const enterprise = availableEnterprises.value.find(e => e.id === outputData.participantId)
  const entityName = enterprise?.name || ''

  const outputNode: Node = {
    id: outputData.id || `output_${Date.now()}`,
    type: 'outputData',
    position: outputPosition,
    data: {
      label: outputData.label || '输出数据',
      category: NodeCategory.OUTPUT_DATA,
      icon: '📊',
      color: '#1890ff',
      description: '计算任务输出',
      parentTaskId: taskNode.id,
      participantId: outputData.participantId || '',
      entityName: entityName,
      dataset: outputData.dataset || '',
      fields: outputData.fields || []
    } as any
  }

  addNode(outputNode)

  // 更新计算任务节点的输出配置
  const nodeData = taskNode.data as ComputeTaskNodeData
  if (!nodeData.outputs) {
    nodeData.outputs = []
  }
  nodeData.outputs.push({
    id: `output_config_${Date.now()}`,
    participantId: outputData.participantId || '',
    dataset: outputData.dataset || '',
    outputFields: outputData.fields || [],
    outputNodeId: outputNode.id
  })

  logger.info('[FlowCanvas] Created task with output', {
    taskId: taskNode.id,
    outputId: outputNode.id
  })
}

/**
 * 处理测试用的计算任务节点创建事件
 */
function handleCreateTestTaskNode(event: Event) {
  logger.info('[FlowCanvas] create-test-task-node event received')
  const customEvent = event as CustomEvent
  const { data, position } = customEvent.detail

  // 保存节点位置
  const nodePosition = position || { x: 300, y: 200 }
  pendingNodePosition.value = nodePosition
  pendingNodeData.value = data

  const techPath = data.techPath || TechPath.SOFTWARE
  // 使用 nodePosition 中的位置创建节点
  createNode(data as DroppedNodeData, nodePosition, techPath)
}

/**
 * 处理测试用的连接创建事件
 * 用于 E2E 测试中直接创建节点连接并触发字段选择对话框
 */
function handleCreateTestConnection(event: Event) {
  logger.info('[FlowCanvas] create-test-connection event received')
  const customEvent = event as CustomEvent
  const { sourceNodeId, targetNodeId } = customEvent.detail

  const sourceNode = nodes.value.find(n => n.id === sourceNodeId)
  const targetNode = nodes.value.find(n => n.id === targetNodeId)

  if (!sourceNode || !targetNode) {
    logger.warn('[FlowCanvas] Source or target node not found for test connection', { sourceNodeId, targetNodeId })
    return
  }

  const sourceData = sourceNode.data as NodeData
  const targetData = targetNode.data as ComputeTaskNodeData

  logger.info('[FlowCanvas] Creating test connection', {
    source: sourceNode.id,
    target: targetNode.id,
    sourceCategory: sourceData.category,
    targetCategory: targetData.category
  })

  // 构建连接对象
  let connection: Connection = {
    source: sourceNodeId,
    target: targetNodeId,
    sourceHandle: 'output'
  }

  // 根据源节点类型确定正确的 targetHandle
  if (targetData.category === NodeCategory.COMPUTE_TASK) {
    if (sourceData.category === NodeCategory.DATA_SOURCE || sourceData.category === NodeCategory.OUTPUT_DATA) {
      connection.targetHandle = 'data-input'
    } else if (sourceData.category === NodeCategory.MODEL) {
      connection.targetHandle = 'input'
    } else if (sourceData.category === NodeCategory.COMPUTE_RESOURCE) {
      connection.targetHandle = 'compute-input'
    }
  }

  // 保存待处理的连接
  pendingConnection.value = connection
  pendingConnectionSource.value = connection.source
  pendingSourceType.value = sourceData.category === NodeCategory.DATA_SOURCE ? 'dataSource' : 'outputData'

  // 获取源节点的字段信息
  if (sourceData.category === NodeCategory.DATA_SOURCE && sourceData.assetInfo) {
    // 数据源节点
    pendingSourceName.value = sourceData.assetInfo.assetName
    pendingParticipantId.value = sourceData.assetInfo.participantId
    pendingDataset.value = sourceData.assetInfo.assetId

    // 只显示数据源节点中已选择的字段
    const selectedFieldNames = sourceData.selectedFields || []
    const allFields = sourceData.assetInfo.dataInfo.fieldList

    // 如果用户选择了特定字段，只返回这些字段；否则返回所有字段（向后兼容）
    const fieldsToInclude = selectedFieldNames.length > 0
      ? allFields.filter(field => selectedFieldNames.includes(field.name))
      : allFields

    pendingAvailableFields.value = fieldsToInclude.map(field => ({
      name: field.name,
      dataType: field.dataType,
      dataLength: field.dataLength,
      description: field.description,
      isPrimaryKey: field.isPrimaryKey || false
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
    logger.warn('[FlowCanvas] Unsupported source node type for test connection')
    return
  }

  // 打开字段选择对话框
  showFieldSelectorDialog.value = true
  logger.info('[FlowCanvas] Opening field selector dialog for test connection')
}

/**
 * 处理测试用的模型节点拖放事件
 * 用于 E2E 测试中模拟拖拽模型节点到计算任务节点上
 */
function handleTestDropModel(event: Event) {
  logger.info('[FlowCanvas] test-drop-model event received')
  const customEvent = event as CustomEvent
  const { data } = customEvent.detail

  // 调试：打印所有节点的 category
  logger.info('[FlowCanvas] All nodes categories:', nodes.value.map(n => ({
    id: n.id,
    category: n.data?.category,
    label: n.data?.label
  })))

  // 查找第一个计算任务节点
  const targetTaskNode = nodes.value.find(n => n.data?.category === NodeCategory.COMPUTE_TASK)

  if (!targetTaskNode) {
    logger.warn('[FlowCanvas] No compute task node found for model drop')
    logger.warn('[FlowCanvas] NodeCategory.COMPUTE_TASK value:', NodeCategory.COMPUTE_TASK)
    return
  }

  logger.info('[FlowCanvas] Simulating model drop on compute task', {
    modelData: data,
    modelType: (data as any).modelType,
    targetNodeId: targetTaskNode.id
  })

  // 保存数据和状态
  pendingModelOrComputeData.value = data
  pendingResourceType.value = 'model'
  pendingTargetTaskNodeId.value = targetTaskNode.id

  // 检查是否是表达式模型
  if ((data as any).modelType === 'expression') {
    // 表达式模型：直接创建，不需要企业选择
    logger.info('[FlowCanvas] Opening expression editor dialog')
    pendingExpressionData.value = data
    pendingExpression.value = ''

    // 使用 nextTick 确保 Vue 响应式更新
    nextTick(() => {
      showExpressionEditorDialog.value = true
      logger.info('[FlowCanvas] showExpressionEditorDialog set to true in nextTick', {
        value: showExpressionEditorDialog.value
      })

      // 调试：检查 DOM 中是否有 modal-overlay
      setTimeout(() => {
        const modal = document.querySelector('.modal-overlay')
        logger.info('[FlowCanvas] Modal overlay check after 100ms', {
          exists: !!modal,
          display: modal ? window.getComputedStyle(modal).display : 'N/A'
        })
      }, 100)
    })
  } else {
    // 其他模型：弹出企业选择对话框
    logger.info('[FlowCanvas] Opening enterprise selector dialog')
    showEnterpriseDialog.value = true
  }
}

/**
 * 处理测试用的算力资源节点拖放事件
 * 用于 E2E 测试中模拟拖拽算力资源节点到计算任务节点上
 */
function handleTestDropCompute(event: Event) {
  logger.info('[FlowCanvas] test-drop-compute event received')
  const customEvent = event as CustomEvent
  const { data } = customEvent.detail

  // 查找第一个计算任务节点
  const targetTaskNode = nodes.value.find(n => n.data?.category === NodeCategory.COMPUTE_TASK)

  if (!targetTaskNode) {
    logger.warn('[FlowCanvas] No compute task node found for compute resource drop')
    return
  }

  logger.info('[FlowCanvas] Simulating compute resource drop on compute task', {
    computeData: data,
    targetNodeId: targetTaskNode.id
  })

  // 保存数据和状态
  pendingModelOrComputeData.value = data
  pendingResourceType.value = 'compute'
  pendingTargetTaskNodeId.value = targetTaskNode.id

  // 弹出企业选择对话框
  showEnterpriseDialog.value = true
}

/**
 * 统一资源选择器确认处理
 */
function handleUnifiedSelectorConfirm(result: any) {
  logger.info('[FlowCanvas] Unified selector confirmed', {
    resourceType: selectorResourceType.value,
    hasAssetInfo: !!result.assetInfo,
    hasModelInfo: !!result.modelInfo,
    hasComputeInfo: !!result.computeInfo
  })

  if (selectorResourceType.value === 'data' && result.assetInfo) {
    // 数据源选择确认
    handleAssetSelected({
      assetInfo: result.assetInfo,
      selectedFields: result.selectedFields
    })
  } else if (selectorResourceType.value === 'model' && result.modelInfo) {
    // 模型选择确认
    if (!pendingSelectorResult.value?.data) {
      logger.warn('[FlowCanvas] No pending model data')
      return
    }
    createModelNodeForTask(result.modelInfo)
  } else if (selectorResourceType.value === 'compute' && result.computeInfo) {
    // 算力选择确认
    if (!pendingSelectorResult.value?.data) {
      logger.warn('[FlowCanvas] No pending compute data')
      return
    }
    createComputeNodeForTask(result.computeInfo)
  }

  // 清理状态
  showUnifiedSelector.value = false
  selectorResourceType.value = 'data'
  selectorModelTypeFilter.value = undefined
  pendingSelectorResult.value = undefined
}

/**
 * 统一资源选择器取消处理
 */
function handleUnifiedSelectorCancel() {
  logger.info('[FlowCanvas] Unified selector cancelled')
  showUnifiedSelector.value = false
  selectorResourceType.value = 'data'
  selectorModelTypeFilter.value = undefined
  pendingSelectorResult.value = undefined
}

/**
 * 为计算任务创建模型节点
 */
function createModelNodeForTask(modelInfo: any) {
  if (!pendingSelectorResult.value?.data || !pendingSelectorResult.value.targetTaskNodeId) {
    logger.warn('[FlowCanvas] No pending model data or target task')
    return
  }

  const data = pendingSelectorResult.value.data
  const targetTaskNodeId = pendingSelectorResult.value.targetTaskNodeId
  const targetTaskNode = nodes.value.find(n => n.id === targetTaskNodeId)

  if (!targetTaskNode) {
    logger.warn('[FlowCanvas] Target task node not found')
    return
  }

  // 设置 pendingTargetTaskNodeId 供 createModelNode 使用
  pendingTargetTaskNodeId.value = targetTaskNodeId

  // 使用原有的 createModelNode 函数
  createModelNode(data, modelInfo, modelInfo.participantId)

  // 清理状态
  pendingSelectorResult.value = undefined
  pendingTargetTaskNodeId.value = ''
}

/**
 * 为计算任务创建算力节点
 */
function createComputeNodeForTask(computeInfo: any) {
  if (!pendingSelectorResult.value?.data || !pendingSelectorResult.value.targetTaskNodeId) {
    logger.warn('[FlowCanvas] No pending compute data or target task')
    return
  }

  const data = pendingSelectorResult.value.data
  const targetTaskNodeId = pendingSelectorResult.value.targetTaskNodeId
  const targetTaskNode = nodes.value.find(n => n.id === targetTaskNodeId)

  if (!targetTaskNode) {
    logger.warn('[FlowCanvas] Target task node not found')
    return
  }

  // 设置目标任务节点 ID（createComputeResourceNode 使用这个变量）
  pendingTargetTaskNodeId.value = targetTaskNode.id

  // 使用原有的 createComputeResourceNode 函数
  createComputeResourceNode(data, computeInfo, computeInfo.participantId)

  // 清理状态
  pendingSelectorResult.value = undefined
  pendingTargetTaskNodeId.value = ''
}

/**
 * 打开编辑输出配置对话框
 * @param outputNodeId 要编辑的输出节点 ID
 */
function openEditOutputDialog(outputNodeId: string) {
  const outputNode = nodes.value.find(n => n.id === outputNodeId)
  if (!outputNode) {
    logger.warn('[FlowCanvas] Output node not found for editing', { outputNodeId })
    return
  }

  const outputData = outputNode.data as any
  const parentTaskId = outputData.parentTaskId

  if (!parentTaskId) {
    logger.warn('[FlowCanvas] Output node has no parent task', { outputNodeId })
    return
  }

  // 获取父任务节点
  const taskNode = nodes.value.find(n => n.id === parentTaskId)
  if (!taskNode) {
    logger.warn('[FlowCanvas] Parent task node not found', { parentTaskId })
    return
  }

  const taskData = taskNode.data as ComputeTaskNodeData

  // 构建字段来源信息映射
  const fieldSourceMap = new Map<string, { sourceType: 'input' | 'model'; sourceNodeId?: string; modelId?: string; modelNodeId?: string }>()

  // 从 inputProviders 构建 input 字段来源映射
  taskData.inputProviders?.forEach((provider) => {
    provider.fields.forEach((field) => {
      const key = `input-${field.columnName}`
      fieldSourceMap.set(key, {
        sourceType: 'input',
        sourceNodeId: provider.sourceNodeId
      })
    })
  })

  // 从 models 构建 model 字段来源映射
  taskData.models?.forEach((model) => {
    const modelId = model.id || model.modelNodeId || ''
    if (model.type === 'expression') {
      // 表达式模型：输出字段固定为 result
      const key = `model-result`
      fieldSourceMap.set(key, {
        sourceType: 'model',
        modelId: modelId,
        modelNodeId: model.modelNodeId
      })
    } else {
      // 其他模型：根据输出字段类型确定字段名
      // 这里简化处理，假设常见输出字段
      const commonFields = ['result', 'accuracy', 'loss', 'intersection_result', 'intersection_size', 'statistic_value', 'model_accuracy', 'training_loss']
      commonFields.forEach(fieldName => {
        const key = `model-${fieldName}`
        if (!fieldSourceMap.has(key)) {
          fieldSourceMap.set(key, {
            sourceType: 'model',
            modelId: modelId,
            modelNodeId: model.modelNodeId
          })
        }
      })
    }
  })

  // 为每个输出字段构建来源信息
  const fieldSources = outputData.fields?.map((field: OutputField) => {
    const key = `${field.source}-${field.columnName}`
    return fieldSourceMap.get(key) || { sourceType: field.source }
  })

  // 设置编辑模式状态
  editingOutputNodeId.value = outputNodeId
  pendingOutputTaskId.value = parentTaskId
  pendingOutputConfig.value = {
    participantId: outputData.participantId,
    dataset: outputData.dataset,
    fields: outputData.fields || [],
    fieldSources: fieldSources
  }

  // 打开编辑对话框
  showOutputConfigDialog.value = true
  logger.info('[FlowCanvas] Opening output config dialog for editing', {
    outputNodeId,
    parentTaskId,
    fieldCount: outputData.fields?.length || 0
  })
}

// 暴露方法供父组件调用
defineExpose({
  openEditDialog,
  openEditOutputDialog,
  handleExport,
  handleImport,
  handleConfigParams
})

/**
 * 处理测试用的节点删除事件
 * 用于 E2E 测试中直接删除节点
 * 同时处理原始节点删除和级联删除
 */
function handleTestDeleteNode(event: Event) {
  const customEvent = event as CustomEvent
  const { nodeId } = customEvent.detail

  logger.info('[FlowCanvas] test-delete-node event received', { nodeId })

  // 先找到要删除的节点
  const nodeToDelete = nodes.value.find(n => n.id === nodeId)
  if (!nodeToDelete) {
    logger.warn('[FlowCanvas] Node not found for deletion', { nodeId })
    return
  }

  const nodeData = nodeToDelete.data as ComputeTaskNodeData

  // 收集需要级联删除的节点ID
  const nodesToDelete = [nodeId]

  // 如果删除的是计算任务节点，级联删除其输出节点
  if (nodeData.category === NodeCategory.COMPUTE_TASK && nodeData.outputs) {
    const outputNodeIds = nodeData.outputs.map(output => output.outputNodeId)
    nodesToDelete.push(...outputNodeIds)
    logger.info('[FlowCanvas] Cascade deleting output nodes', {
      taskId: nodeId,
      outputNodeIds
    })
  }

  // 同时删除原始节点和级联节点
  setNodes(nodes.value.filter(n => !nodesToDelete.includes(n.id)))

  // 删除相关连接线
  setEdges(edges.value.filter(
    edge => !nodesToDelete.includes(edge.source) && !nodesToDelete.includes(edge.target)
  ))

  logger.info('[FlowCanvas] Test node deleted', {
    nodeId,
    totalDeleted: nodesToDelete.length
  })
}

// 生命周期：注册全局事件监听器
onMounted(() => {
  document.addEventListener('add-output', handleAddOutput)
  // 监听 window 上的事件，与测试中的 window.dispatchEvent 匹配
  window.addEventListener('create-test-node', handleCreateTestNode)
  window.addEventListener('create-test-task-with-output', handleCreateTestTaskWithOutput)
  window.addEventListener('create-test-task-node', handleCreateTestTaskNode)
  window.addEventListener('create-test-connection', handleCreateTestConnection)
  window.addEventListener('test-drop-model', handleTestDropModel)
  window.addEventListener('test-drop-compute', handleTestDropCompute)
  window.addEventListener('test-delete-node', handleTestDeleteNode)
})

onUnmounted(() => {
  document.removeEventListener('add-output', handleAddOutput)
  window.removeEventListener('create-test-node', handleCreateTestNode)
  window.removeEventListener('create-test-task-with-output', handleCreateTestTaskWithOutput)
  window.removeEventListener('create-test-task-node', handleCreateTestTaskNode)
  window.removeEventListener('create-test-connection', handleCreateTestConnection)
  window.removeEventListener('test-drop-model', handleTestDropModel)
  window.removeEventListener('test-drop-compute', handleTestDropCompute)
  window.removeEventListener('test-delete-node', handleTestDeleteNode)
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
