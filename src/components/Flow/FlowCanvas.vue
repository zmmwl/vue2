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
      :default-edge-options="{ type: 'default' }"
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
      :fixed-enterprise-id="pendingOutputFixedEnterprise?.id"
      :fixed-enterprise-name="pendingOutputFixedEnterprise?.name"
      :expressions="pendingOutputLocalQueryData?.expressions"
      :group-by-config="pendingOutputLocalQueryData?.groupByConfig"
      :source-node-type="pendingOutputSourceType"
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
      :input-providers="expressionEditorInputProviders"
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

    <!-- 分组统计配置对话框 -->
    <GroupByConfig
      v-model="showGroupByConfigDialog"
      :taskData="getGroupByTaskData()"
      :initialConfig="getInitialGroupByConfig()"
      :modelId="currentGroupByModelId"
      @confirm="handleGroupByConfigConfirm"
      @cancel="handleGroupByConfigCancel"
    />

    <!-- 类型选择对话框 -->
    <TypeSelector
      v-model="showTypeSelectorDialog"
      :title="typeSelectorTitle"
      :options="typeSelectorOptions"
      @select="handleTypeSelectorSelected"
      @cancel="handleTypeSelectorCancel"
    />

    <!-- 本地Query编辑弹窗 -->
    <LocalQueryEditor
      v-model="showLocalQueryEditorDialog"
      :node-data="pendingLocalQueryNodeData"
      :enterprises="availableEnterprises.map(e => ({ id: e.id, name: e.name }))"
      @confirm="handleLocalQueryEditorConfirm"
      @cancel="handleLocalQueryEditorCancel"
    />

    <!-- 实时数据源配置弹窗 -->
    <RealtimeDataSourceConfig
      v-model="showRealtimeDataSourceDialog"
      :initial-data="pendingRealtimeDataSource"
      :source-node-id="realtimeSourceNodeId"
      :imported-fields="importedRealtimeFields"
      @confirm="handleRealtimeDataSourceConfirm"
    />

    <!-- FL 任务配置弹窗 -->
    <FLTaskConfig
      v-model="showFLTaskConfigDialog"
      :initial-data="pendingFLTaskData"
      :task-name="pendingFLTaskData?.taskName"
      :fl-mode="pendingFLTaskData?.flMode"
      :fl-category="pendingFLTaskData?.flCategory"
      @confirm="handleFLTaskConfigConfirm"
    />

    <!-- 实时数据源节点配置弹窗 -->
    <RealtimeDataSourceNodeConfig
      v-model="showRealtimeDataSourceNodeDialog"
      :initial-data="pendingRealtimeNodeData"
      @confirm="handleRealtimeDataSourceNodeConfirm"
      @select-datasource="handleRealtimeSelectDatasource"
    />

    <!-- 错误提示 Toast -->
    <Transition name="toast">
      <div v-if="showErrorToast" class="error-toast">
        <span class="toast-icon">⚠️</span>
        <span class="toast-message">{{ errorMessage }}</span>
        <button class="toast-close" @click="showErrorToast = false">×</button>
      </div>
    </Transition>
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
import { NodeCategory, ComputeTaskType, TechPath, ResourceTypePriority, ModelType, DataSourceType } from '@/types/nodes'
import type { NodeData, AssetInfo, FieldInfo, FieldMapping, ComputeTaskNodeData, OutputDataNodeData, OutputField, ComputeModelConfig, ModelParameter, AvailableFieldOption, LocalQueryNodeData, ExpressionConfig, GroupByConfig as GroupByConfigType } from '@/types/nodes'
import { LocalTaskType } from '@/types/nodes'
import DataSourceNode from '@/components/Nodes/DataSourceNode.vue'
import ComputeTaskNode from '@/components/Nodes/ComputeTaskNode.vue'
import OutputDataNode from '@/components/Nodes/OutputDataNode.vue'
import ModelNode from '@/components/Nodes/ModelNode.vue'
import ComputeResourceNode from '@/components/Nodes/ComputeResourceNode.vue'
import LocalTaskNode from '@/components/Nodes/LocalTaskNode.vue'
import LocalQueryNode from '@/components/Nodes/LocalQueryNode.vue'
import FLTaskNode from '@/components/Nodes/FLTaskNode.vue'
import PIRTaskNode from '@/components/Nodes/PIRTaskNode.vue'
import RealtimeDataSourceNode from '@/components/Nodes/RealtimeDataSourceNode.vue'
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
import GroupByConfig from '@/components/Modals/GroupByConfig.vue'
import TypeSelector from '@/components/Modals/TypeSelector.vue'
import LocalQueryEditor from '@/components/Modals/LocalQueryEditor.vue'
import RealtimeDataSourceConfig from '@/components/Modals/RealtimeDataSourceConfig.vue'
import RealtimeDataSourceNodeConfig from '@/components/Modals/RealtimeDataSourceNodeConfig.vue'
import FLTaskConfig from '@/components/Modals/FLTaskConfig.vue'
import { MODEL_TEMPLATES, RESOURCE_TEMPLATES } from '@/utils/node-templates'
import { createUniqueEdge } from '@/utils/edge-utils'
import { layoutGraph } from '@/utils/layout-utils'
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
import { algorithmService } from '@/services/algorithmService'
import { getAlgorithmTypeByTask } from '@/types/algorithm'
import type { TaskAlgorithmConfig } from '@/types/algorithm'

interface Emits {
  (e: 'node-selected', node: Node<NodeData> | null): void
}

const emit = defineEmits<Emits>()

// 使用共享的图状态管理
const { nodes, edges, addNode, addEdge, setNodes, setEdges } = useGraphState()

// 获取坐标投影函数（将屏幕坐标转换为画布坐标）
const { project, fitView, addEdges } = useVueFlow()

// 注册自定义节点类型
const nodeTypes = {
  data_source: markRaw(DataSourceNode),
  compute_task: markRaw(ComputeTaskNode),
  outputData: markRaw(OutputDataNode),
  modelNode: markRaw(ModelNode),
  computeResource: markRaw(ComputeResourceNode),
  localTask: markRaw(LocalTaskNode),
  local_query: markRaw(LocalQueryNode),
  fl_task: markRaw(FLTaskNode),
  pir_task: markRaw(PIRTaskNode),
  realtime_datasource: markRaw(RealtimeDataSourceNode)
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

// 错误提示状态
const showErrorToast = ref(false)
const errorMessage = ref('')

// 显示错误提示
function showError(message: string) {
  errorMessage.value = message
  showErrorToast.value = true
  // 3秒后自动关闭
  setTimeout(() => {
    showErrorToast.value = false
  }, 3000)
}

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

// 本地Query输出配置相关状态
const pendingOutputFixedEnterprise = ref<{ id: string; name: string } | undefined>(undefined)
const pendingOutputLocalQueryData = ref<{
  expressions?: ExpressionConfig[]
  groupByConfig?: GroupByConfigType
} | undefined>(undefined)
const pendingOutputSourceType = ref<string>('')

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

// 分组统计配置对话框状态
const showGroupByConfigDialog = ref(false)
const currentGroupByModelId = ref<string>('')
const currentGroupByTaskId = ref<string>('')

// 类型选择对话框状态
const showTypeSelectorDialog = ref(false)
const typeSelectorTitle = ref('选择类型')
const typeSelectorOptions = ref<Array<{ label: string; icon: string; color: string; description?: string }>>([])
const pendingTypeSelectionTaskId = ref<string>('')
const pendingTypeSelectionKind = ref<'model' | 'compute'>('model')

// 本地Query编辑弹窗状态
const showLocalQueryEditorDialog = ref(false)
const pendingLocalQueryNodeId = ref<string>('')
const pendingLocalQueryNodeData = ref<LocalQueryNodeData | undefined>(undefined)

// 实时数据源配置弹窗状态
const showRealtimeDataSourceDialog = ref(false)
const pendingPIRTaskNodeId = ref<string>('')
const pendingRealtimeDataSource = ref<import('@/types/nodes').RealtimeDataSourceInfo | undefined>(undefined)
const realtimeSourceNodeId = ref<string>('')
const importedRealtimeFields = ref<import('@/types/nodes').RealtimeFieldInfo[]>([])

// FL 任务配置弹窗状态
const showFLTaskConfigDialog = ref(false)
const pendingFLTaskNodeId = ref<string>('')
const pendingFLTaskData = ref<import('@/types/nodes').FLTaskNodeData | undefined>(undefined)

// 实时数据源节点配置弹窗状态
const showRealtimeDataSourceNodeDialog = ref(false)
const pendingRealtimeNodeData = ref<{
  mode: 'datasource' | 'manual'
  fields: import('@/types/nodes').RealtimeFieldInfo[]
  sourceNodeId?: string
  sourceNodeName?: string
} | undefined>(undefined)
const pendingRealtimeNodeId = ref<string>('')

// 标记是否是从实时数据源节点触发的数据源选择
const isRealtimeDatasourceSelection = ref(false)

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
/**
 * 更新 PIR 节点的数据源信息
 * 当连接到 PIR 节点的 data-input 时调用
 * PIR 任务只能接入两个数据源：一个实时数据源 + 一个普通数据源
 */
function updatePIRNodeData(
  sourceId: string,
  targetId: string,
  _targetHandle: string
) {
  const sourceNode = nodes.value.find(n => n.id === sourceId)
  const targetNode = nodes.value.find(n => n.id === targetId)

  if (!sourceNode || !targetNode || targetNode.type !== 'pir_task') {
    return
  }

  const sourceData = sourceNode.data as NodeData
  const pirData = targetNode.data as import('@/types/nodes').PIRTaskNodeData

  // 判断源节点是否是实时数据源（使用多种方式判断）
  const isRealtimeSource = sourceNode.type === 'realtime_datasource' ||
    (sourceData as any).dataSourceType === 'realtime' ||
    (sourceData as any).sourceType === DataSourceType.REALTIME

  if (isRealtimeSource) {
    // 更新实时数据源
    logger.info('[FlowCanvas] PIR connection: realtime datasource -> data-input')
    if (sourceData.category === NodeCategory.DATA_SOURCE) {
      const realtimeData = sourceData as import('@/types/nodes').RealtimeDataSourceNodeData
      if (realtimeData.realtimeConfig) {
        pirData.realtimeDataSource = {
          id: sourceId,
          name: sourceData.label || '实时数据源',
          sourceType: realtimeData.realtimeConfig.mode === 'datasource' ? 'connection' : 'manual',
          fields: realtimeData.realtimeConfig.fields,
          sourceNodeId: realtimeData.realtimeConfig.sourceNodeId
        }
      }
    }
  } else {
    // 更新预加载数据源
    logger.info('[FlowCanvas] PIR connection: normal datasource -> data-input')
    if (sourceData.category === NodeCategory.DATA_SOURCE && sourceData.assetInfo) {
      pirData.preloadDataSource = {
        sourceNodeId: sourceId,
        sourceType: 'dataSource',
        participantId: sourceData.assetInfo.participantId,
        dataset: sourceData.assetInfo.assetId,
        fields: (sourceData.selectedFields || []).map(name => {
          const field = sourceData.assetInfo!.dataInfo.fieldList.find(f => f.name === name)
          return {
            columnName: name,
            columnAlias: name,
            columnType: field?.dataType || 'STRING',
            isJoinField: false
          }
        })
      }
    }
  }
}

/**
 * 验证 PIR 任务的数据源连接
 * 规则：只能接入两个数据源，且必须是一个实时数据源 + 一个普通数据源
 */
function validatePIRDataSourceConnection(
  sourceId: string,
  targetId: string
): { valid: boolean; errorMessage?: string } {
  const sourceNode = nodes.value.find(n => n.id === sourceId)
  const targetNode = nodes.value.find(n => n.id === targetId)

  if (!sourceNode || !targetNode) {
    return { valid: false, errorMessage: '节点不存在' }
  }

  const sourceData = sourceNode.data as NodeData
  const pirData = targetNode.data as import('@/types/nodes').PIRTaskNodeData

  // 判断源节点是否是实时数据源
  // 1. 检查是否是实时数据源节点
  // 2. 检查是否是实时输出节点（PIR 任务的实时输出）
  let isRealtimeSource = sourceNode.type === 'realtime_datasource' ||
    (sourceData as any).dataSourceType === 'realtime' ||
    (sourceData as any).sourceType === DataSourceType.REALTIME

  // 如果源节点是输出节点，检查其 isRealtime 属性
  if (!isRealtimeSource && sourceNode.type === 'outputData') {
    const outputData = sourceNode.data as any
    isRealtimeSource = outputData.isRealtime === true || outputData.isStreamOutput === true
    logger.info('[FlowCanvas] PIR connection: output node detected, checking isRealtime', {
      sourceId,
      isRealtime: outputData.isRealtime,
      isStreamOutput: outputData.isStreamOutput,
      isRealtimeSource
    })
  }

  // 使用 inputProviders 检查已有数据源
  const inputProviders = pirData.inputProviders || []

  // 检查总数据源数量（不能超过2个）
  if (inputProviders.length >= 2) {
    return { valid: false, errorMessage: 'PIR 任务最多只能连接两个数据源' }
  }

  // 检查是否已有相同类型的数据源
  const hasRealtimeSource = inputProviders.some((p: import('@/types/nodes').InputProvider) => p.isRealtime)
  const hasNormalSource = inputProviders.some((p: import('@/types/nodes').InputProvider) => !p.isRealtime)

  if (isRealtimeSource && hasRealtimeSource) {
    return { valid: false, errorMessage: 'PIR 任务只能连接一个实时数据源' }
  }

  if (!isRealtimeSource && hasNormalSource) {
    return { valid: false, errorMessage: 'PIR 任务只能连接一个普通数据源' }
  }

  return { valid: true }
}

onMounted(() => {
  loadEnterprises()

  // 暴露测试用的全局方法
  ;(window as any).__createEdge = (
    sourceId: string,
    sourceHandle: string,
    targetId: string,
    targetHandle: string
  ) => {
    logger.info('[FlowCanvas] __createEdge called', { sourceId, sourceHandle, targetId, targetHandle })

    // 检查目标节点是否是 PIR 任务，如果是则验证连接
    const targetNode = nodes.value.find(n => n.id === targetId)
    if (targetNode?.type === 'pir_task' && targetHandle === 'data-input') {
      const validation = validatePIRDataSourceConnection(sourceId, targetId)
      if (!validation.valid) {
        logger.warn('[FlowCanvas] PIR connection validation failed:', validation.errorMessage)
        return // 不创建无效连接
      }
    }

    const newEdge = {
      id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: sourceId,
      sourceHandle,
      target: targetId,
      targetHandle,
      type: 'default'
    }

    addEdges([newEdge])

    // 更新 PIR 节点数据（如果目标是 PIR 任务）
    if (targetNode?.type === 'pir_task') {
      updatePIRNodeData(sourceId, targetId, targetHandle)

      // 同时更新 inputProviders（用于详情面板显示）
      const sourceNode = nodes.value.find(n => n.id === sourceId)
      const pirData = targetNode.data as import('@/types/nodes').PIRTaskNodeData
      const sourceData = sourceNode?.data as NodeData

      if (sourceData && pirData) {
        // 判断是否是实时数据源
        // 1. 检查是否是实时数据源节点
        // 2. 检查是否是实时输出节点（PIR 任务的实时输出）
        let isRealtimeSource = sourceNode?.type === 'realtime_datasource' ||
          (sourceData as any).dataSourceType === 'realtime' ||
          (sourceData as any).sourceType === DataSourceType.REALTIME

        // 如果源节点是输出节点，检查其 isRealtime 属性
        if (!isRealtimeSource && sourceNode?.type === 'outputData') {
          const outputData = sourceNode.data as any
          isRealtimeSource = outputData.isRealtime === true || outputData.isStreamOutput === true
        }

        // 初始化 inputProviders
        if (!pirData.inputProviders) {
          pirData.inputProviders = []
        }

        // 创建 InputProvider
        const newProvider: import('@/types/nodes').InputProvider = {
          sourceNodeId: sourceId,
          sourceType: sourceNode?.type === 'outputData' ? 'outputData' : 'dataSource',  // 区分输出节点和数据源
          participantId: sourceData.assetInfo?.participantId || '',
          dataset: sourceData.assetInfo?.assetName || sourceData.label || '',
          fields: (sourceData.selectedFields || []).map(name => {
            const field = sourceData.assetInfo?.dataInfo?.fieldList.find(f => f.name === name)
            return {
              columnName: name,
              columnAlias: name,
              columnType: field?.dataType || 'STRING',
              isJoinField: false
            }
          }),
          isRealtime: isRealtimeSource
        }

        // 实时数据源的字段可能来自 realtimeConfig
        if (isRealtimeSource && (sourceData as any).realtimeConfig?.fields) {
          newProvider.fields = (sourceData as any).realtimeConfig.fields.map((f: any, index: number) => ({
            columnName: f.name,
            columnAlias: f.name,
            columnType: f.dataType || 'STRING',
            isJoinField: index === 0  // 实时数据源默认第一个字段为 join 键
          }))
        }

        // 输出节点的字段来自 fields 属性
        if (sourceNode?.type === 'outputData' && (sourceData as any).fields) {
          newProvider.fields = ((sourceData as any).fields || []).map((f: any, index: number) => ({
            columnName: f.columnName,
            columnAlias: f.columnAlias || f.columnName,
            columnType: f.columnType || 'STRING',
            isJoinField: index === 0  // 实时输出默认第一个字段为 join 键
          }))
        }

        pirData.inputProviders.push(newProvider)
        logger.info('[FlowCanvas] PIR inputProviders updated via test API', {
          taskId: targetId,
          inputProviderCount: pirData.inputProviders.length,
          isRealtime: isRealtimeSource
        })
      }
    }

    // 更新普通计算任务节点数据（如果目标是 compute_task 类型，如 MPC）
    if (targetNode?.type === 'compute_task' && targetHandle === 'data-input') {
      const sourceNode = nodes.value.find(n => n.id === sourceId)
      const taskData = targetNode.data as ComputeTaskNodeData
      const sourceData = sourceNode?.data as NodeData

      if (sourceData && taskData) {
        // 判断是否是实时数据源
        const isRealtimeSource = sourceNode?.type === 'realtime_datasource' ||
          (sourceData as any).dataSourceType === 'realtime' ||
          (sourceData as any).sourceType === DataSourceType.REALTIME

        // 初始化 inputProviders
        if (!taskData.inputProviders) {
          taskData.inputProviders = []
        }

        // 创建 InputProvider
        const newProvider: import('@/types/nodes').InputProvider = {
          sourceNodeId: sourceId,
          sourceType: 'dataSource',
          participantId: sourceData.assetInfo?.participantId || '',
          dataset: sourceData.assetInfo?.assetName || sourceData.label || '',
          fields: (sourceData.selectedFields || []).map(name => {
            const field = sourceData.assetInfo?.dataInfo?.fieldList.find(f => f.name === name)
            return {
              columnName: name,
              columnAlias: name,
              columnType: field?.dataType || 'STRING',
              isJoinField: false
            }
          }),
          isRealtime: isRealtimeSource
        }

        // 实时数据源的字段可能来自 realtimeConfig
        if (isRealtimeSource && (sourceData as any).realtimeConfig?.fields) {
          newProvider.fields = (sourceData as any).realtimeConfig.fields.map((f: any, index: number) => ({
            columnName: f.name,
            columnAlias: f.name,
            columnType: f.dataType || 'STRING',
            isJoinField: index === 0  // 实时数据源默认第一个字段为 join 键
          }))
        }

        taskData.inputProviders.push(newProvider)
        logger.info('[FlowCanvas] Compute task inputProviders updated via test API', {
          taskId: targetId,
          inputProviderCount: taskData.inputProviders.length,
          isRealtime: isRealtimeSource
        })
      }
    }

    logger.info('[FlowCanvas] Edge created via test API', { edgeId: newEdge.id })
  }

  // 暴露测试用的全局方法：触发带字段选择对话框的连接
  ;(window as any).__connectWithFieldSelector = (
    sourceId: string,
    sourceHandle: string,
    targetId: string,
    targetHandle: string
  ) => {
    logger.info('[FlowCanvas] __connectWithFieldSelector called', { sourceId, sourceHandle, targetId, targetHandle })

    // 触发 onConnect 事件，这会打开字段选择对话框
    const connection = {
      source: sourceId,
      sourceHandle,
      target: targetId,
      targetHandle
    }

    // 调用 onConnect 处理器
    onConnect(connection)

    return true
  }

  // 暴露测试用的全局方法：直接为任务添加输出（绕过对话框）
  ;(window as any).__addOutputForTask = (
    taskId: string,
    options?: {
      participantId?: string
      datasetName?: string
      fieldNames?: string[]
    }
  ) => {
    logger.info('[FlowCanvas] __addOutputForTask called', { taskId, options })

    const taskNode = nodes.value.find(n => n.id === taskId)
    if (!taskNode) {
      logger.warn('[FlowCanvas] Task node not found:', taskId)
      return { success: false, error: 'Task node not found' }
    }

    // 设置 pending 状态
    pendingOutputTaskId.value = taskId
    pendingOutputSourceType.value = 'task'

    // 获取可用字段
    const fields = availableInputFields.value
    if (fields.length === 0) {
      logger.warn('[FlowCanvas] No available fields for output')
      clearOutputConfigState()
      return { success: false, error: 'No available fields' }
    }

    // 确定要输出的字段
    const selectedFieldNames = options?.fieldNames || fields.slice(0, 1).map(f => f.name)
    const outputFields: OutputField[] = selectedFieldNames.map(name => {
      const field = fields.find(f => f.name === name)
      return {
        source: 'input' as const,
        columnName: name,
        columnAlias: name,
        columnType: field?.type || 'STRING'
      }
    })

    // 获取企业 ID
    const participantId = options?.participantId || availableEnterprises.value[0]?.id || 'ent_001'
    const datasetName = options?.datasetName || `test_output_${Date.now()}`

    // 调用输出配置确认函数
    handleOutputConfigConfirmed({
      participantId,
      dataset: datasetName,
      fields: outputFields
    })

    logger.info('[FlowCanvas] Output added via test API', { taskId, participantId, datasetName, fieldCount: outputFields.length })
    return { success: true, participantId, datasetName, fieldCount: outputFields.length }
  }
})

onUnmounted(() => {
  delete (window as any).__createEdge
  delete (window as any).__connectWithFieldSelector
  delete (window as any).__addOutputForTask
})

/**
 * 获取可用的输入字段（来自所有输入数据源）
 * 按数据源分组返回，包含数据源节点信息
 * 支持普通计算任务、本地查询任务和 PIR 任务
 */
const availableInputFields = computed(() => {
  if (!pendingOutputTaskId.value) return []

  const taskNode = nodes.value.find(n => n.id === pendingOutputTaskId.value)
  if (!taskNode) return []

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

  // 检查是否是 PIR 任务节点
  if (taskNode.type === 'pir_task') {
    const pirData = taskNode.data as import('@/types/nodes').PIRTaskNodeData

    // 优先从 inputProviders 提取字段（新的连接方式）
    if (pirData.inputProviders && pirData.inputProviders.length > 0) {
      pirData.inputProviders.forEach((provider) => {
        provider.fields.forEach(field => {
          fields.push({
            id: `input-${provider.sourceNodeId}-${field.columnName}`,
            name: field.columnName,
            type: field.columnType,
            source: `${provider.isRealtime ? '实时数据源' : '数据源'}: ${provider.dataset}`,
            sourceNodeId: provider.sourceNodeId,
            sourceType: provider.sourceType,
            participantId: provider.participantId,
            dataset: provider.dataset
          })
        })
      })
    } else {
      // 兼容旧逻辑：从预加载数据源提取字段
      if (pirData.preloadDataSource) {
        pirData.preloadDataSource.fields.forEach(field => {
          fields.push({
            id: `input-preload-${field.columnName}`,
            name: field.columnName,
            type: field.columnType,
            source: `预加载数据源: ${pirData.preloadDataSource?.dataset || '未知'}`,
            sourceNodeId: pirData.preloadDataSource?.sourceNodeId || '',
            sourceType: 'dataSource',
            participantId: pirData.preloadDataSource?.participantId || '',
            dataset: pirData.preloadDataSource?.dataset || ''
          })
        })
      }

      // 从实时数据源提取字段
      if (pirData.realtimeDataSource?.fields) {
        pirData.realtimeDataSource.fields.forEach(field => {
          fields.push({
            id: `input-realtime-${field.name}`,
            name: field.name,
            type: field.dataType,
            source: `实时数据源: ${pirData.realtimeDataSource?.name || '未知'}`,
            sourceNodeId: pirData.realtimeDataSource?.sourceNodeId || '',
            sourceType: 'dataSource',
            participantId: '',
            dataset: pirData.realtimeDataSource?.name || ''
          })
        })
      }
    }

    return fields
  }

  // 普通计算任务：从 inputProviders 提取字段
  const taskData = taskNode.data as ComputeTaskNodeData
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
 * 支持普通计算任务和 PIR 任务
 */
const availableModelFields = computed(() => {
  if (!pendingOutputTaskId.value) return []

  const taskNode = nodes.value.find(n => n.id === pendingOutputTaskId.value)
  if (!taskNode) return []

  const fields: Array<{
    id: string
    name: string
    type: string
    source: string
    modelId: string
    modelType: string
    participantId: string
  }> = []

  // 获取模型配置（支持普通计算任务和 PIR 任务）
  let models: any[] = []
  if (taskNode.type === 'pir_task') {
    const pirData = taskNode.data as import('@/types/nodes').PIRTaskNodeData
    models = pirData.models || []
  } else {
    const taskData = taskNode.data as ComputeTaskNodeData
    models = taskData.models || []
  }

  // 遍历所有模型配置
  models.forEach((model) => {
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
  const fields: Array<{ name: string; columnName: string; participantId: string; dataset: string; dataType?: string }> = []

  // 从 inputProviders 提取字段
  taskData.inputProviders?.forEach((provider) => {
    provider.fields.forEach(field => {
      fields.push({
        name: field.columnAlias || field.columnName,  // 使用别名
        columnName: field.columnName,  // 保留原始字段名
        participantId: provider.participantId,
        dataset: provider.dataset,
        dataType: field.columnType
      })
    })
  })

  return fields
})

/**
 * 获取表达式编辑器的 InputProvider
 * 从目标任务节点的输入数据源中提取
 */
const expressionEditorInputProviders = computed(() => {
  if (!pendingTargetTaskNodeId.value) return []

  const taskNode = nodes.value.find(n => n.id === pendingTargetTaskNodeId.value)
  if (!taskNode) return []

  const taskData = taskNode.data as ComputeTaskNodeData
  return taskData.inputProviders || []
})

/**
 * 验证连接是否有效
 * 业务规则：
 * 1. 两个数据源节点不能直接连接
 * 2. 连接必须从输出 handle 连接到输入 handle
 * 3. 不能连接到同一个节点
 * 4. PIR 任务节点有两种输入：预加载数据源(preload-input)和实时数据源(realtime-input)
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

  // 规则 2: 连接到 PIR 任务节点时，统一使用 data-input handle
  if (targetNode.type === 'pir_task' || (targetData as ComputeTaskNodeData).taskType === ComputeTaskType.PIR) {
    // PIR 任务现在使用统一的 data-input handle（和 MPC 任务一样）
    ;(connection as any).targetHandle = 'data-input'
    logger.info('[FlowCanvas] PIR connection: datasource -> data-input')
  }
  // 规则 3: 连接到其他计算任务节点或本地任务节点时，根据源节点类型自动修正 targetHandle
  else if (targetData.category === NodeCategory.COMPUTE_TASK || targetData.category === NodeCategory.LOCAL_TASK) {
    // 根据源节点类型确定正确的 targetHandle
    let correctHandle: string
    // 判断源节点是否是 FL 任务节点（预处理任务可以作为数据源）
    const isFLTaskAsDataSource = sourceData.category === NodeCategory.COMPUTE_TASK &&
      (sourceData as ComputeTaskNodeData).taskType === ComputeTaskType.FL
    if (sourceData.category === NodeCategory.DATA_SOURCE || sourceData.category === NodeCategory.OUTPUT_DATA || isFLTaskAsDataSource) {
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

  // 规则 4: 连接必须从源节点的输出 handle 开始
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
 *   - 数据源节点 → "data-input" (顶部) - 包括 PIR 任务
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

  // 调试日志：显示连接尝试的详细信息
  logger.info('[FlowCanvas] onConnect called', {
    sourceId: connection.source,
    targetId: connection.target,
    sourceType: sourceNode.type,
    targetType: targetNode.type,
    sourceCategory: sourceData.category,
    targetCategory: targetData.category,
    sourceSourceType: (sourceData as any).sourceType,
    targetTaskType: (targetData as any).taskType
  })

  // 根据源节点类型和目标节点类型自动设置正确的 targetHandle
  let correctedTargetHandle = connection.targetHandle
  // 判断源节点是否是 FL 任务节点（预处理任务可以作为数据源）
  const isFLTaskAsDataSource = sourceData.category === NodeCategory.COMPUTE_TASK &&
    (sourceData as ComputeTaskNodeData).taskType === ComputeTaskType.FL
  if (targetData.category === NodeCategory.COMPUTE_TASK) {
    if (sourceData.category === NodeCategory.DATA_SOURCE || sourceData.category === NodeCategory.OUTPUT_DATA || isFLTaskAsDataSource) {
      // 所有计算任务（包括 PIR）都使用 data-input
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

  // PIR 任务现在走和 MPC 一样的字段选择流程，不再单独处理
  // PIR 连接验证会在字段选择确认后进行

  // 检查是否连接到计算任务节点或本地任务节点
  if (targetData.category === NodeCategory.COMPUTE_TASK || targetData.category === NodeCategory.LOCAL_TASK) {
    // 保存待处理的连接（使用修正后的连接）
    pendingConnection.value = correctedConnection
    pendingConnectionSource.value = correctedConnection.source
    pendingSourceType.value = sourceData.category === NodeCategory.DATA_SOURCE ? 'dataSource' : 'outputData'

    // 获取源节点的字段信息
    if (sourceData.category === NodeCategory.DATA_SOURCE && sourceData.assetInfo) {
      // 普通数据源节点
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
    } else if (sourceNode.type === 'realtime_datasource' || (sourceData as any).realtimeConfig) {
      // 实时数据源节点
      const realtimeData = sourceData as import('@/types/nodes').RealtimeDataSourceNodeData
      const realtimeConfig = realtimeData.realtimeConfig

      pendingSourceName.value = sourceData.label || '实时数据源'
      pendingParticipantId.value = ''  // 实时数据源没有企业ID
      pendingDataset.value = sourceData.label || 'realtime'

      // 从实时数据源配置获取字段
      if (realtimeConfig?.fields) {
        pendingAvailableFields.value = realtimeConfig.fields.map(field => ({
          name: field.name,
          dataType: field.dataType,
          dataLength: undefined,
          description: undefined,
          isPrimaryKey: false
        }))
      } else {
        pendingAvailableFields.value = []
      }

      logger.info('[FlowCanvas] Realtime datasource fields prepared for selection', {
        fieldCount: pendingAvailableFields.value.length
      })
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
    } else if (isFLTaskAsDataSource) {
      // FL 任务节点作为数据源（预处理任务的输出结构和输入一致）
      const flTaskData = sourceData as import('@/types/nodes').FLTaskNodeData
      pendingSourceName.value = flTaskData.taskDisplayName || flTaskData.label || 'FL任务'
      // 预处理任务可能有多个参与方，这里取第一个
      const firstProvider = flTaskData.inputProviders?.[0]
      pendingParticipantId.value = firstProvider?.participantId || ''
      pendingDataset.value = `${flTaskData.taskDisplayName || 'fl'}_output`
      pendingSourceType.value = 'flTask'

      // 从 inputProviders 获取所有字段（输出结构和输入一致）
      const allFields: { name: string; dataType: string; description?: string }[] = []
      flTaskData.inputProviders?.forEach(provider => {
        provider.fields.forEach(field => {
          // 避免重复字段
          if (!allFields.some(f => f.name === field.columnName)) {
            allFields.push({
              name: field.columnName,
              dataType: field.columnType,
              description: field.columnAlias
            })
          }
        })
      })

      pendingAvailableFields.value = allFields.map(field => ({
        name: field.name,
        dataType: field.dataType,
        dataLength: undefined,
        description: field.description,
        isPrimaryKey: false
      }))

      logger.info('[FlowCanvas] FL task as datasource fields prepared for selection', {
        taskName: flTaskData.taskName,
        fieldCount: pendingAvailableFields.value.length,
        providerCount: flTaskData.inputProviders?.length || 0
      })
    } else {
      logger.warn('[FlowCanvas] Unsupported source node type for field selection')
      return
    }

    // 校验：本地Query节点的数据来源企业必须与任务执行企业一致
    if (targetNode.type === 'local_query') {
      const localQueryData = targetData as unknown as LocalQueryNodeData
      const sourceParticipantId = pendingParticipantId.value
      const targetParticipantId = localQueryData.participantId

      if (sourceParticipantId !== targetParticipantId) {
        const sourceEnterpriseName = availableEnterprises.value.find(e => e.id === sourceParticipantId)?.name || sourceParticipantId
        const targetEnterpriseName = localQueryData.entityName || targetParticipantId

        showError(`连接失败：数据来源企业 (${sourceEnterpriseName}) 与任务执行企业 (${targetEnterpriseName}) 不一致。本地Query任务只能使用本企业的数据。`)
        logger.warn('[FlowCanvas] Connection rejected: enterprise mismatch', {
          sourceParticipantId,
          targetParticipantId
        })
        return
      }
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
    }, edges.value, sourceData.category)
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

        // 如果删除的是算力资源节点，级联删除计算任务中对应的算力资源配置
        if (nodeData.category === 'computeResource') {
          // 找到所有包含该算力资源节点的计算任务
          const affectedTaskNodes = nodes.value.filter(n => {
            const taskData = n.data as ComputeTaskNodeData
            return taskData.category === NodeCategory.COMPUTE_TASK &&
              taskData.computeProviders?.some(provider => provider.resourceNodeId === change.id)
          })

          // 更新受影响的计算任务节点
          affectedTaskNodes.forEach(taskNode => {
            const taskData = taskNode.data as ComputeTaskNodeData
            if (taskData.computeProviders) {
              // 移除对应的算力资源配置
              taskData.computeProviders = taskData.computeProviders.filter(
                provider => provider.resourceNodeId !== change.id
              )

              logger.info('[FlowCanvas] Cascade deleted compute resource from task', {
                taskId: taskNode.id,
                removedResourceNodeId: change.id,
                remainingProviders: taskData.computeProviders.length
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
 * 删除数据源到计算任务的连线时，清除计算任务的输入配置
 */
const onEdgesChange = (changes: EdgeChange[]) => {
  for (const change of changes) {
    if (change.type === 'remove' && change.id) {
      // 查找被删除的边
      const removedEdge = edges.value.find(e => e.id === change.id)

      if (removedEdge) {
        const sourceNode = nodes.value.find(n => n.id === removedEdge.source)
        const targetNode = nodes.value.find(n => n.id === removedEdge.target)

        if (sourceNode && targetNode) {
          const sourceData = sourceNode.data as NodeData
          const targetData = targetNode.data as NodeData

          // 情况1: 从计算任务到输出节点的连接
          if (targetData.category === NodeCategory.OUTPUT_DATA) {
            // 删除输出节点
            setNodes(nodes.value.filter(n => n.id !== targetNode.id))

            // 从父任务的 outputs 数组中移除该输出配置
            if (sourceData.category === NodeCategory.COMPUTE_TASK) {
              const sourceTaskData = sourceData as ComputeTaskNodeData
              if (sourceTaskData.outputs) {
                sourceTaskData.outputs = sourceTaskData.outputs.filter(
                  output => output.outputNodeId !== targetNode.id
                )
                logger.info('[FlowCanvas] Auto-deleted output node on edge removal', {
                  outputNodeId: targetNode.id,
                  parentTaskId: sourceNode.id
                })
              }
            }
          }

          // 情况2: 从数据源节点到计算任务的连接
          if (sourceData.category === NodeCategory.DATA_SOURCE &&
              targetData.category === NodeCategory.COMPUTE_TASK) {
            const taskData = targetData as ComputeTaskNodeData
            // 从计算任务的 inputProviders 中移除对应的输入配置
            if (taskData.inputProviders) {
              const beforeCount = taskData.inputProviders.length
              taskData.inputProviders = taskData.inputProviders.filter(
                provider => provider.sourceNodeId !== sourceNode.id
              )

              if (taskData.inputProviders.length < beforeCount) {
                // 重新构建 Join 条件
                taskData.joinConditions = buildJoinConditions(taskData.inputProviders)

                logger.info('[FlowCanvas] Input provider removed from task on edge deletion', {
                  sourceNodeId: sourceNode.id,
                  targetTaskId: targetNode.id,
                  removedCount: beforeCount - taskData.inputProviders.length,
                  remainingCount: taskData.inputProviders.length
                })
              }
            }
          }

          // 情况3: 从模型节点到计算任务的连接 - 删除模型节点
          if (sourceData.category === NodeCategory.MODEL &&
              targetData.category === NodeCategory.COMPUTE_TASK) {
            const taskData = targetData as ComputeTaskNodeData
            // 从计算任务的 models 数组中移除对应的模型配置
            if (taskData.models) {
              const beforeCount = taskData.models.length
              taskData.models = taskData.models.filter(
                model => model.modelNodeId !== sourceNode.id
              )

              if (taskData.models.length < beforeCount) {
                logger.info('[FlowCanvas] Model removed from task on edge deletion', {
                  modelNodeId: sourceNode.id,
                  targetTaskId: targetNode.id,
                  removedCount: beforeCount - taskData.models.length,
                  remainingCount: taskData.models.length
                })
              }
            }

            // 删除模型节点
            setNodes(nodes.value.filter(n => n.id !== sourceNode.id))

            logger.info('[FlowCanvas] Auto-deleted model node on edge removal', {
              modelNodeId: sourceNode.id,
              parentTaskId: targetNode.id
            })
          }

          // 情况4: 从算力资源节点到计算任务的连接 - 删除算力资源节点
          if (sourceData.category === NodeCategory.COMPUTE_RESOURCE &&
              targetData.category === NodeCategory.COMPUTE_TASK) {
            const taskData = targetData as ComputeTaskNodeData
            // 从计算任务的 computeProviders 数组中移除对应的算力资源配置
            if (taskData.computeProviders) {
              const beforeCount = taskData.computeProviders.length
              taskData.computeProviders = taskData.computeProviders.filter(
                provider => provider.resourceNodeId !== sourceNode.id
              )

              if (taskData.computeProviders.length < beforeCount) {
                logger.info('[FlowCanvas] Compute provider removed from task on edge deletion', {
                  resourceNodeId: sourceNode.id,
                  targetTaskId: targetNode.id,
                  removedCount: beforeCount - taskData.computeProviders.length,
                  remainingCount: taskData.computeProviders.length
                })
              }
            }

            // 删除算力资源节点
            setNodes(nodes.value.filter(n => n.id !== sourceNode.id))

            logger.info('[FlowCanvas] Auto-deleted compute resource node on edge removal', {
              computeNodeId: sourceNode.id,
              parentTaskId: targetNode.id
            })
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
      // 检查是否是实时数据源类型
      if (data.sourceType === DataSourceType.REALTIME) {
        // 检查是否在测试模式
        const isTestMode = !!(window as any).__PLAYWRIGHT_TEST__

        if (isTestMode) {
          // 测试模式：直接创建实时数据源节点
          logger.info('[FlowCanvas] Test mode detected, creating realtime datasource node with mock data')
          const position = pendingNodePosition.value || { x: 100, y: 100 }
          const nodeData: import('@/types/nodes').RealtimeDataSourceNodeData = {
            label: '实时数据源',
            category: NodeCategory.DATA_SOURCE,
            sourceType: DataSourceType.REALTIME,
            icon: '⚡',
            color: '#FA8C16',
            description: '流式数据输入源',
            realtimeConfig: {
              mode: 'manual',
              fields: [
                { name: 'id', dataType: 'STRING', description: 'ID字段' },
                { name: 'timestamp', dataType: 'INTEGER', description: '时间戳字段' },
                { name: 'value', dataType: 'STRING', description: '值字段' }
              ]
            },
            isConfigured: true
          }

          const newNode: Node = {
            id: `realtime_node_${Date.now()}`,
            type: 'realtime_datasource',
            position,
            data: nodeData as any
          }

          addNode(newNode)
          logger.info('[FlowCanvas] Realtime datasource node created in test mode', {
            nodeId: newNode.id,
            position
          })
        } else {
          // 实时数据源节点：弹出配置对话框
          pendingRealtimeNodeId.value = `realtime_node_${Date.now()}`
          pendingRealtimeNodeData.value = undefined
          showRealtimeDataSourceNodeDialog.value = true
          logger.info('[FlowCanvas] Opening realtime datasource config dialog')
        }
      } else {
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
      }
    } else if (data.type === 'fl_task' && (data as any).flTask) {
      // 联邦学习任务节点：优先检查，直接创建，稍后配置参数
      logger.info('[FlowCanvas] Creating FL task node', { flTask: (data as any).flTask })
      createFLTaskNode(data as any)
    } else if (data.category === NodeCategory.COMPUTE_TASK) {
      // 计算任务节点：需要技术路径选择
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
          } else if (data.modelType === 'GROUP_STAT') {
            // 分组统计模型：直接打开配置对话框
            currentGroupByTaskId.value = targetNode.id
            // 生成临时模型ID用于配置
            currentGroupByModelId.value = `groupby_temp_${Date.now()}`
            showGroupByConfigDialog.value = true
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
    } else if (data.category === 'localTask' || data.category === NodeCategory.LOCAL_TASK) {
      // 本地任务节点
      const isTestMode = !!(window as any).__PLAYWRIGHT_TEST__

      pendingLocalTaskData.value = data
      // 保存节点位置，用于创建节点时使用
      if ('offsetX' in event) {
        pendingNodePosition.value = { x: event.offsetX, y: event.offsetY }
      }

      if (isTestMode) {
        // 测试模式：直接使用默认企业创建节点
        logger.info('[FlowCanvas] Test mode detected, creating local task node with default enterprise')
        const defaultParticipantId = 'test_enterprise_001'
        if (data.computeType === LocalTaskType.LOCAL_QUERY || data.type === 'local_query') {
          createLocalQueryNode(data, defaultParticipantId)
        } else {
          createLocalTaskNode(data, defaultParticipantId)
        }
        // 清理状态
        pendingLocalTaskData.value = null
        pendingNodePosition.value = null
      } else {
        // 非测试模式：弹出企业选择对话框
        showLocalTaskEnterpriseDialog.value = true
        logger.info('[FlowCanvas] Opening local task enterprise selector dialog')
      }
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
      outputs: (data as any).outputs || [],
      // 算法配置（初始为空，稍后自动匹配）
      algorithmConfig: undefined
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

  // 自动匹配默认算法（仅对计算任务节点）
  if (data.category === NodeCategory.COMPUTE_TASK && data.taskType && techPath) {
    autoMatchAlgorithm(newNode.id, data.taskType, techPath)
  }
}

/**
 * 自动匹配默认算法
 */
async function autoMatchAlgorithm(
  nodeId: string,
  taskType: string,
  techPath: TechPath
) {
  try {
    const isTEE = techPath === TechPath.TEE
    const algorithmType = getAlgorithmTypeByTask(taskType, isTEE)

    const response = await algorithmService.getDefault(algorithmType)
    if (response.code === 0 && response.data) {
      const algo = response.data
      const config: TaskAlgorithmConfig = {
        algorithmId: algo.id,
        algorithmName: algo.name,
        algorithmVersion: algo.version,
        algorithmParams: {}
      }

      // 更新节点的算法配置
      const nodeIndex = nodes.value.findIndex(n => n.id === nodeId)
      if (nodeIndex !== -1) {
        const existingNode = nodes.value[nodeIndex]
        if (existingNode) {
          nodes.value[nodeIndex] = {
            ...existingNode,
            data: {
              ...existingNode.data,
              algorithmConfig: config
            } as NodeData
          }

          logger.info('[FlowCanvas] Auto-matched algorithm for node', {
            nodeId,
            algorithmId: algo.id,
            algorithmName: algo.name
          })
        }
      }
    }
  } catch (error) {
    logger.warn('[FlowCanvas] Failed to auto-match algorithm', { nodeId, error })
  }
}

/**
 * 创建本地Query节点
 */
function createLocalQueryNode(
  data: DroppedNodeData,
  participantId: string
) {
  // 使用保存的位置或默认位置
  const position = pendingNodePosition.value
    ? (() => {
        const projected = project({ x: pendingNodePosition.value!.x, y: pendingNodePosition.value!.y })
        return {
          x: projected.x - 100,
          y: projected.y - 30
        }
      })()
    : { x: 100, y: 100 }

  // 获取企业名称
  const entityName = availableEnterprises.value.find(e => e.id === participantId)?.name || ''

  const newNode: Node = {
    id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'local_query',
    position,
    data: {
      label: data.label,
      category: NodeCategory.LOCAL_TASK,
      computeType: LocalTaskType.LOCAL_QUERY,
      icon: data.icon,
      color: data.color,
      description: data.description,
      // 本地Query特有字段 - 使用选定的企业
      participantId,
      entityName,
      inputProviders: [],
      joinConditions: [],
      expressions: [],
      groupByConfig: undefined,
      outputDataset: ''
    } as LocalQueryNodeData
  }

  addNode(newNode)
  logger.info('[FlowCanvas] Local query node created', {
    nodeId: newNode.id,
    type: newNode.type,
    participantId,
    entityName
  })
}

/**
 * 创建联邦学习任务节点
 */
function createFLTaskNode(data: DroppedNodeData & { flTask: {
  taskName: string
  taskDisplayName: string
  category: any
  mode: any
} }) {
  // 使用保存的位置或默认位置
  const position = pendingNodePosition.value || { x: 100, y: 100 }

  const flTask = data.flTask

  const newNode: Node = {
    id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'fl_task',
    position,
    data: {
      label: flTask.taskDisplayName,
      category: NodeCategory.COMPUTE_TASK,
      taskType: ComputeTaskType.FL,
      icon: data.icon,
      color: data.color,
      description: data.description,
      // FL 任务特有字段
      flCategory: flTask.category,
      flMode: flTask.mode,
      taskName: flTask.taskName,
      taskDisplayName: flTask.taskDisplayName,
      inputProviders: [],
      parameters: {}
    } as any
  }

  addNode(newNode)
  logger.info('[FlowCanvas] FL task node created', {
    nodeId: newNode.id,
    type: newNode.type,
    taskName: flTask.taskName,
    category: flTask.category,
    mode: flTask.mode
  })

  // 创建节点后立即打开配置弹窗（测试模式下跳过）
  // 使用 nextTick 确保节点已添加到画布
  const isTestMode = !!(window as any).__PLAYWRIGHT_TEST__
  if (!isTestMode) {
    nextTick(() => {
      openFLTaskConfig(newNode.id)
    })
  }
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

  // 获取目标节点信息
  const targetNode = nodes.value.find(n => n.id === pendingConnection.value!.target)
  const sourceNode = nodes.value.find(n => n.id === pendingConnection.value!.source)

  if (!targetNode) {
    logger.warn('[FlowCanvas] Target node not found')
    clearFieldSelectorState()
    return
  }

  const targetData = targetNode.data as NodeData
  const sourceData = sourceNode?.data as NodeData

  // PIR 任务验证：只能接入两个数据源（一个实时 + 一个普通）
  if (targetNode.type === 'pir_task' || (targetData as any).taskType === ComputeTaskType.PIR) {
    const validation = validatePIRDataSourceConnection(pendingConnection.value.source, pendingConnection.value.target)
    if (!validation.valid) {
      showError(validation.errorMessage || '连接验证失败')
      logger.warn('[FlowCanvas] PIR connection validation failed:', validation.errorMessage)
      clearFieldSelectorState()
      return
    }
  }

  // 创建连接
  const sourceCategory = sourceData?.category
  const newEdge = createUniqueEdge({
    source: pendingConnection.value.source,
    target: pendingConnection.value.target,
    sourceHandle: 'output',
    targetHandle: 'data-input'  // 所有计算任务都使用 data-input
  }, edges.value, sourceCategory)
  edges.value.push(newEdge)

  // 更新目标计算任务节点的输入配置
  if (targetData.category === NodeCategory.COMPUTE_TASK || targetData.category === NodeCategory.LOCAL_TASK) {
    const taskData = targetData as ComputeTaskNodeData

    // 初始化 inputProviders 数组
    if (!taskData.inputProviders) {
      taskData.inputProviders = []
    }

    // 判断是否是实时数据源
    // 1. 检查是否是实时数据源节点
    // 2. 检查是否是实时输出节点（PIR 任务的实时输出）
    let isRealtimeSource = sourceNode?.type === 'realtime_datasource' ||
      (sourceData as any)?.dataSourceType === 'realtime' ||
      (sourceData as any)?.sourceType === DataSourceType.REALTIME

    // 如果源节点是输出节点，检查其 isRealtime 属性
    if (!isRealtimeSource && sourceNode?.type === 'outputData') {
      const outputData = sourceNode.data as any
      isRealtimeSource = outputData.isRealtime === true || outputData.isStreamOutput === true
      logger.info('[FlowCanvas] Field selection: output node detected, checking isRealtime', {
        sourceNodeId: selection.sourceNodeId,
        isRealtime: outputData.isRealtime,
        isStreamOutput: outputData.isStreamOutput,
        isRealtimeSource
      })
    }

    // 添加新的输入提供者
    const newInputProvider = {
      sourceNodeId: selection.sourceNodeId,
      sourceType: selection.sourceType,
      participantId: selection.participantId,
      dataset: selection.dataset,
      fields: selection.fields,
      isRealtime: isRealtimeSource  // 标记是否是实时数据源
    }

    taskData.inputProviders.push(newInputProvider)

    // 构建 Join 条件
    taskData.joinConditions = buildJoinConditions(taskData.inputProviders)

    logger.info('[FlowCanvas] Input provider added to task', {
      taskId: targetNode.id,
      inputProviderCount: taskData.inputProviders.length,
      joinConditionsCount: taskData.joinConditions.length,
      isRealtime: isRealtimeSource
    })

    // 更新 PIR 节点的特有数据（兼容旧逻辑）
    if (targetNode.type === 'pir_task' || (taskData as any).taskType === ComputeTaskType.PIR) {
      updatePIRNodeData(pendingConnection.value.source, pendingConnection.value.target, 'data-input')
    }
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

  // 注意：PIR 任务点击时不打开任何弹窗
  // PIR 任务的实时数据源是通过连线接入的，不需要手工配置

  // 注意：FL 任务点击时不打开配置弹窗
  // FL 任务通过"重新配置"按钮打开配置弹窗
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
 * 一键自动布局
 * 使用自定义布局算法：
 * - 主数据流自上而下
 * - 模型节点在所属计算任务左侧
 * - 算力节点在所属计算任务右侧
 */
function handleAutoLayout() {
  if (nodes.value.length === 0) {
    logger.warn('[FlowCanvas] No nodes to layout')
    return
  }

  logger.info('[FlowCanvas] Starting auto layout', {
    nodeCount: nodes.value.length,
    edgeCount: edges.value.length
  })

  // 执行布局计算
  const layoutedNodes = layoutGraph(nodes.value, edges.value, {
    nodeWidth: 280,
    nodeHeight: 120,
    verticalSpacing: 180,     // 层级间距
    horizontalSpacing: 400,   // 节点水平间距
    sideNodeOffset: 300       // 侧边节点偏移
  })

  // 更新节点位置
  setNodes(layoutedNodes)

  // 适应视口
  nextTick(() => {
    fitView({ padding: 0.2, duration: 300 })
  })

  logger.info('[FlowCanvas] Auto layout completed')
}

/**
 * 处理添加输出按钮点击
 */
function handleAddOutput(event: Event) {
  const customEvent = event as CustomEvent
  // 支持 nodeId 和 taskId 两种参数名（PIR节点使用taskId）
  const nodeId = customEvent.detail.nodeId || customEvent.detail.taskId

  const taskNode = nodes.value.find(n => n.id === nodeId)
  if (!taskNode) {
    logger.warn('[FlowCanvas] Task node not found for output addition', { nodeId })
    return
  }

  // 检查是否是 PIR 任务节点
  const isPIRTask = taskNode.type === 'pir_task'
  if (isPIRTask) {
    // PIR 任务节点：直接打开输出配置
    const pirData = taskNode.data as import('@/types/nodes').PIRTaskNodeData

    // 检查是否已配置数据源（支持 inputProviders 或旧的 preloadDataSource/realtimeDataSource）
    const hasInputProviders = pirData.inputProviders && pirData.inputProviders.length > 0
    const hasLegacyDataSources = pirData.preloadDataSource || pirData.realtimeDataSource

    if (!hasInputProviders && !hasLegacyDataSources) {
      logger.warn('[FlowCanvas] Cannot add output for PIR: no data source configured')
      return
    }

    pendingOutputTaskId.value = nodeId
    pendingOutputConfig.value = undefined
    pendingOutputSourceType.value = 'pir_task'
    pendingOutputFixedEnterprise.value = undefined
    pendingOutputLocalQueryData.value = undefined

    showOutputConfigDialog.value = true
    logger.info('[FlowCanvas] Opening output config dialog for PIR task', {
      taskId: nodeId,
      hasInputProviders,
      hasLegacyDataSources
    })
    return
  }

  const taskData = taskNode.data as ComputeTaskNodeData | LocalQueryNodeData

  // 检查是否是 local_query 节点
  const isLocalQuery = taskNode.type === 'local_query'

  // 检查是否已配置输入数据（非PIR任务且非本地查询）
  if (!isLocalQuery && (!taskData.inputProviders || taskData.inputProviders.length === 0)) {
    logger.warn('[FlowCanvas] Cannot add output: no input providers configured')
    // TODO: 显示提示信息
    return
  }

  // 设置待处理的输出任务
  pendingOutputTaskId.value = nodeId
  pendingOutputConfig.value = undefined

  if (isLocalQuery) {
    const localQueryData = taskData as LocalQueryNodeData
    pendingOutputFixedEnterprise.value = {
      id: localQueryData.participantId,
      name: localQueryData.entityName || localQueryData.participantId
    }
    pendingOutputLocalQueryData.value = {
      expressions: localQueryData.expressions,
      groupByConfig: localQueryData.groupByConfig
    }
    pendingOutputSourceType.value = 'local_query'
  } else {
    pendingOutputFixedEnterprise.value = undefined
    pendingOutputLocalQueryData.value = undefined
    pendingOutputSourceType.value = 'compute_task'
  }

  // 打开输出配置对话框
  showOutputConfigDialog.value = true
  logger.info('[FlowCanvas] Opening output config dialog', { taskId: nodeId, isLocalQuery })
}

/**
 * 处理添加模型按钮点击
 */
function handleAddModel(event: Event) {
  const customEvent = event as CustomEvent
  // 支持 nodeId 和 taskId 两种参数名（PIR节点使用taskId）
  const nodeId = customEvent.detail.nodeId || customEvent.detail.taskId

  const taskNode = nodes.value.find(n => n.id === nodeId)
  if (!taskNode) {
    logger.warn('[FlowCanvas] Task node not found for model addition', { nodeId })
    return
  }

  // 打开类型选择对话框，显示模型类型选项
  pendingTypeSelectionTaskId.value = nodeId
  pendingTypeSelectionKind.value = 'model'
  typeSelectorTitle.value = '选择计算模型类型'
  typeSelectorOptions.value = MODEL_TEMPLATES.map(t => ({
    label: t.label,
    icon: t.icon,
    color: t.color,
    description: t.description
  }))
  showTypeSelectorDialog.value = true
  logger.info('[FlowCanvas] Opening type selector for model', { taskId: nodeId })
}

/**
 * 处理添加算力按钮点击
 */
function handleAddCompute(event: Event) {
  const customEvent = event as CustomEvent
  const { nodeId } = customEvent.detail

  const taskNode = nodes.value.find(n => n.id === nodeId)
  if (!taskNode) {
    logger.warn('[FlowCanvas] Task node not found for compute addition', { nodeId })
    return
  }

  // 打开类型选择对话框，显示算力资源类型选项
  pendingTypeSelectionTaskId.value = nodeId
  pendingTypeSelectionKind.value = 'compute'
  typeSelectorTitle.value = '选择算力资源类型'
  typeSelectorOptions.value = RESOURCE_TEMPLATES.map(t => ({
    label: t.label,
    icon: t.icon,
    color: t.color,
    description: t.description
  }))
  showTypeSelectorDialog.value = true
  logger.info('[FlowCanvas] Opening type selector for compute', { taskId: nodeId })
}

/**
 * 处理编辑本地Query节点事件
 */
function handleEditLocalQuery(event: Event) {
  const customEvent = event as CustomEvent
  const { nodeId } = customEvent.detail

  const node = nodes.value.find(n => n.id === nodeId)
  if (!node) {
    logger.warn('[FlowCanvas] Local query node not found', { nodeId })
    return
  }

  pendingLocalQueryNodeId.value = nodeId
  pendingLocalQueryNodeData.value = node.data as LocalQueryNodeData
  showLocalQueryEditorDialog.value = true
  logger.info('[FlowCanvas] Opening local query editor', { nodeId })
}

/**
 * 处理本地Query编辑确认
 */
function handleLocalQueryEditorConfirm(data: Partial<LocalQueryNodeData>) {
  const node = nodes.value.find(n => n.id === pendingLocalQueryNodeId.value)
  if (!node) {
    logger.warn('[FlowCanvas] Local query node not found for update', { nodeId: pendingLocalQueryNodeId.value })
    return
  }

  // 更新节点数据
  const nodeData = node.data as LocalQueryNodeData
  Object.assign(nodeData, data)

  logger.info('[FlowCanvas] Local query node updated', {
    nodeId: pendingLocalQueryNodeId.value,
    participantId: data.participantId,
    outputDataset: data.outputDataset
  })

  // 关闭弹窗
  showLocalQueryEditorDialog.value = false
  pendingLocalQueryNodeId.value = ''
  pendingLocalQueryNodeData.value = undefined
}

/**
 * 处理本地Query编辑取消
 */
function handleLocalQueryEditorCancel() {
  logger.info('[FlowCanvas] Local query editor cancelled')
  showLocalQueryEditorDialog.value = false
  pendingLocalQueryNodeId.value = ''
  pendingLocalQueryNodeData.value = undefined
}

/**
 * 处理实时数据源配置确认
 */
function handleRealtimeDataSourceConfirm(data: import('@/types/nodes').RealtimeDataSourceInfo) {
  const node = nodes.value.find(n => n.id === pendingPIRTaskNodeId.value)
  if (!node) {
    logger.warn('[FlowCanvas] PIR task node not found for realtime datasource update', { nodeId: pendingPIRTaskNodeId.value })
    return
  }

  // 更新节点数据
  const nodeData = node.data as import('@/types/nodes').PIRTaskNodeData
  nodeData.realtimeDataSource = data

  logger.info('[FlowCanvas] PIR task realtime datasource updated', {
    nodeId: pendingPIRTaskNodeId.value,
    sourceType: data.sourceType,
    fieldCount: data.fields?.length || 0
  })

  // 关闭弹窗
  showRealtimeDataSourceDialog.value = false
  pendingPIRTaskNodeId.value = ''
  pendingRealtimeDataSource.value = undefined
}

/**
 * 打开实时数据源配置弹窗
 */
function openRealtimeDataSourceConfig(nodeId: string) {
  const node = nodes.value.find(n => n.id === nodeId)
  if (!node) {
    logger.warn('[FlowCanvas] PIR task node not found', { nodeId })
    return
  }

  const nodeData = node.data as import('@/types/nodes').PIRTaskNodeData

  // 设置待处理状态
  pendingPIRTaskNodeId.value = nodeId
  pendingRealtimeDataSource.value = nodeData.realtimeDataSource

  // 检查是否有上游连接到 realtime-input handle
  const incomingEdge = edges.value.find(e =>
    e.target === nodeId && e.targetHandle === 'realtime-input'
  )

  if (incomingEdge) {
    realtimeSourceNodeId.value = incomingEdge.source
    // 获取上游节点的字段信息
    const sourceNode = nodes.value.find(n => n.id === incomingEdge.source)
    if (sourceNode && sourceNode.data) {
      const sourceData = sourceNode.data
      // 如果上游是 OutputDataNode 且是 PIR 输出
      if ((sourceData as any).isPIROutput) {
        importedRealtimeFields.value = (sourceData as any).fields?.map((f: any) => ({
          name: f.columnName || f.name,
          dataType: f.columnType || f.dataType || 'STRING',
          description: f.columnAlias || f.description || ''
        })) || []
      } else if ((sourceData as any).selectedFields) {
        // 如果是普通数据源节点
        importedRealtimeFields.value = (sourceData as any).selectedFields.map((f: string) => ({
          name: f,
          dataType: 'STRING',
          description: ''
        }))
      }
    }
  } else {
    realtimeSourceNodeId.value = ''
    importedRealtimeFields.value = []
  }

  showRealtimeDataSourceDialog.value = true
  logger.info('[FlowCanvas] Opening realtime datasource config', {
    nodeId,
    hasConnection: !!incomingEdge,
    importedFieldCount: importedRealtimeFields.value.length
  })
}

/**
 * 打开 FL 任务配置弹窗
 */
function openFLTaskConfig(nodeId: string) {
  const node = nodes.value.find(n => n.id === nodeId)
  if (!node) {
    logger.warn('[FlowCanvas] FL task node not found', { nodeId })
    return
  }

  const nodeData = node.data as import('@/types/nodes').FLTaskNodeData

  pendingFLTaskNodeId.value = nodeId
  pendingFLTaskData.value = nodeData

  showFLTaskConfigDialog.value = true
  logger.info('[FlowCanvas] Opening FL task config', {
    nodeId,
    taskName: nodeData.taskName,
    flMode: nodeData.flMode,
    flCategory: nodeData.flCategory
  })
}

/**
 * 处理 FL 任务配置确认
 */
function handleFLTaskConfigConfirm(data: Partial<import('@/types/nodes').FLTaskNodeData>) {
  const node = nodes.value.find(n => n.id === pendingFLTaskNodeId.value)
  if (!node) {
    logger.warn('[FlowCanvas] FL task node not found for update', { nodeId: pendingFLTaskNodeId.value })
    return
  }

  // 更新节点数据
  const nodeData = node.data as import('@/types/nodes').FLTaskNodeData
  Object.assign(nodeData, data)

  logger.info('[FlowCanvas] FL task node updated', {
    nodeId: pendingFLTaskNodeId.value,
    taskName: data.taskName,
    hasParameters: !!data.parameters
  })

  // 对于特征工程和模型任务，自动生成输出节点
  if (nodeData.flCategory !== 'preprocess' && nodeData.inputProviders && nodeData.inputProviders.length > 0) {
    // 先清理旧的输出节点
    if (nodeData.outputNodeId) {
      const oldOutputNode = nodes.value.find(n => n.id === nodeData.outputNodeId)
      if (oldOutputNode) {
        setNodes(nodes.value.filter(n => n.id !== nodeData.outputNodeId))
        // 删除相关连线
        setEdges(edges.value.filter(e => e.source !== nodeData.outputNodeId && e.target !== nodeData.outputNodeId))
      }
    }

    // 创建新的输出节点（所有参与方共享一个输出）
    const participantIds = [...new Set(nodeData.inputProviders.map(p => p.participantId))]
    const outputNodeId = `fl_output_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 收集所有字段
    const allFields: import('@/types/nodes').OutputField[] = []
    nodeData.inputProviders.forEach(provider => {
      provider.fields.forEach(field => {
        allFields.push({
          source: 'input',
          columnName: field.columnName,
          columnAlias: field.columnAlias,
          columnType: field.columnType
        })
      })
    })

    // 输出节点位置
    const outputPosition = {
      x: node.position.x,
      y: node.position.y + 150
    }

    const outputNode: Node = {
      id: outputNodeId,
      type: 'outputData',
      position: outputPosition,
      data: {
        label: `${nodeData.taskDisplayName || 'FL任务'}输出`,
        category: NodeCategory.OUTPUT_DATA,
        color: '#722ed1',
        icon: '📤',
        description: `联邦学习任务输出`,
        parentTaskId: pendingFLTaskNodeId.value,
        participantId: participantIds[0] || '',
        entityName: participantIds.length > 1 ? `${participantIds.length}个参与方` : '',
        dataset: `${nodeData.taskDisplayName || 'fl'}_output`,
        fields: allFields
      } as any
    }

    addNode(outputNode)

    // 创建连线
    const outputEdge = createUniqueEdge({
      source: pendingFLTaskNodeId.value,
      target: outputNodeId,
      sourceHandle: 'output',
      targetHandle: 'input'
    }, edges.value, NodeCategory.COMPUTE_TASK)
    edges.value.push(outputEdge)

    // 更新节点的输出节点ID
    nodeData.outputNodeId = outputNodeId

    logger.info('[FlowCanvas] FL task output node created', {
      taskId: pendingFLTaskNodeId.value,
      outputNodeId,
      participantCount: participantIds.length
    })
  }

  // 关闭弹窗
  showFLTaskConfigDialog.value = false
  pendingFLTaskNodeId.value = ''
  pendingFLTaskData.value = undefined
}

/**
 * 处理实时数据源节点配置确认
 */
function handleRealtimeDataSourceNodeConfirm(data: {
  mode: 'datasource' | 'manual'
  fields: import('@/types/nodes').RealtimeFieldInfo[]
  sourceNodeId?: string
  sourceNodeName?: string
}) {
  logger.info('[FlowCanvas] Realtime datasource node config confirmed', {
    mode: data.mode,
    fieldCount: data.fields.length,
    sourceNodeId: data.sourceNodeId
  })

  // 创建实时数据源节点
  const position = pendingNodePosition.value || { x: 100, y: 100 }
  const nodeData: import('@/types/nodes').RealtimeDataSourceNodeData = {
    label: '实时数据源',
    category: NodeCategory.DATA_SOURCE,
    sourceType: DataSourceType.REALTIME,
    icon: '⚡',
    color: '#FA8C16',
    description: '流式数据输入源',
    realtimeConfig: {
      mode: data.mode,
      fields: data.fields,
      sourceNodeId: data.sourceNodeId,
      sourceNodeName: data.sourceNodeName
    },
    isConfigured: data.fields.length > 0
  }

  const newNode: Node = {
    id: pendingRealtimeNodeId.value || `realtime_node_${Date.now()}`,
    type: 'realtime_datasource',
    position,
    data: nodeData as any
  }

  addNode(newNode)
  logger.info('[FlowCanvas] Realtime datasource node created', {
    nodeId: newNode.id,
    position
  })

  // 关闭弹窗
  showRealtimeDataSourceNodeDialog.value = false
  pendingRealtimeNodeId.value = ''
  pendingRealtimeNodeData.value = undefined
}

/**
 * 处理实时数据源节点选择"从现有数据源选择"（打开统一资源选择器）
 */
function handleRealtimeSelectDatasource() {
  logger.info('[FlowCanvas] Opening unified selector for realtime datasource')
  isRealtimeDatasourceSelection.value = true
  showUnifiedSelector.value = true
  selectorResourceType.value = 'data'
}

/**
 * 从资产选择结果创建实时数据源节点
 */
function createRealtimeDataSourceNodeFromAsset(
  assetInfo: AssetInfo,
  selectedFields: FieldInfo[]
) {
  const position = pendingNodePosition.value || { x: 100, y: 100 }

  // 将字段转换为 RealtimeFieldInfo 格式
  const realtimeFields: import('@/types/nodes').RealtimeFieldInfo[] = selectedFields.map(f => ({
    name: f.name,
    dataType: convertToRealtimeDataType(f.dataType),
    description: f.description
  }))

  const nodeData: import('@/types/nodes').RealtimeDataSourceNodeData = {
    label: assetInfo.assetName,
    category: NodeCategory.DATA_SOURCE,
    sourceType: DataSourceType.REALTIME,
    icon: '⚡',
    color: '#FA8C16',
    description: assetInfo.intro || '流式数据输入源',
    realtimeConfig: {
      mode: 'datasource',
      fields: realtimeFields,
      sourceNodeName: assetInfo.assetName
    },
    isConfigured: true
  }

  const newNode: Node = {
    id: pendingRealtimeNodeId.value || `realtime_node_${Date.now()}`,
    type: 'realtime_datasource',
    position,
    data: nodeData as any
  }

  addNode(newNode)
  logger.info('[FlowCanvas] Realtime datasource node created from asset', {
    nodeId: newNode.id,
    assetName: assetInfo.assetName,
    fieldCount: realtimeFields.length
  })

  // 清理状态
  pendingRealtimeNodeId.value = ''
  pendingNodePosition.value = null
}

/**
 * 将数据类型转换为实时数据源支持的类型
 */
function convertToRealtimeDataType(dataType: string): 'STRING' | 'INTEGER' | 'FLOAT' | 'BOOLEAN' | 'DATE' | 'TIMESTAMP' {
  const upperType = dataType?.toUpperCase() || 'STRING'
  if (['INT', 'BIGINT', 'SMALLINT', 'TINYINT', 'INTEGER'].includes(upperType)) {
    return 'INTEGER'
  }
  if (['FLOAT', 'DOUBLE', 'DECIMAL', 'NUMERIC'].includes(upperType)) {
    return 'FLOAT'
  }
  if (['BOOLEAN', 'BOOL'].includes(upperType)) {
    return 'BOOLEAN'
  }
  if (['DATE'].includes(upperType)) {
    return 'DATE'
  }
  if (['DATETIME', 'TIMESTAMP', 'TIMESTAMP'].includes(upperType)) {
    return 'TIMESTAMP'
  }
  return 'STRING'
}

/**
 * 处理类型选择确认
 */
function handleTypeSelectorSelected(option: { label: string; icon: string; color: string; description?: string }) {
  const nodeId = pendingTypeSelectionTaskId.value
  const kind = pendingTypeSelectionKind.value

  if (!nodeId) {
    logger.warn('[FlowCanvas] No task node ID for type selection')
    showTypeSelectorDialog.value = false
    return
  }

  logger.info('[FlowCanvas] Type selected', { kind, option: option.label, nodeId })

  if (kind === 'model') {
    // 根据选择的模型类型处理
    const template = MODEL_TEMPLATES.find(t => t.label === option.label)
    if (!template) {
      logger.warn('[FlowCanvas] Model template not found', { label: option.label })
      showTypeSelectorDialog.value = false
      return
    }

    // 保存目标任务节点 ID
    pendingTargetTaskNodeId.value = nodeId

    // 检查是否是表达式模型
    if (template.label.includes('表达式')) {
      // 表达式模型：直接打开表达式编辑器
      pendingExpressionData.value = template
      pendingExpression.value = ''
      showExpressionEditorDialog.value = true
    } else if (template.isCodeBin) {
      // CodeBin 组合模型：弹出类型选择对话框
      pendingCodeBinData.value = template
      showCodeBinTypeSelectorDialog.value = true
    } else if (template.modelType === 'GROUP_STAT') {
      // 分组统计模型：直接打开配置对话框
      currentGroupByTaskId.value = nodeId
      currentGroupByModelId.value = `groupby_temp_${Date.now()}`
      showGroupByConfigDialog.value = true
    } else {
      // 其他模型（SPDZ）：使用统一资源选择器
      pendingSelectorResult.value = {
        data: template,
        targetTaskNodeId: nodeId
      }
      selectorResourceType.value = 'model'
      selectorModelTypeFilter.value = template.modelType
      showUnifiedSelector.value = true
    }
  } else if (kind === 'compute') {
    // 算力资源：使用统一资源选择器
    const template = RESOURCE_TEMPLATES.find(t => t.label === option.label)
    if (!template) {
      logger.warn('[FlowCanvas] Compute template not found', { label: option.label })
      showTypeSelectorDialog.value = false
      return
    }

    pendingSelectorResult.value = {
      data: template,
      targetTaskNodeId: nodeId
    }
    selectorResourceType.value = 'compute'
    showUnifiedSelector.value = true
  }

  showTypeSelectorDialog.value = false
}

/**
 * 处理类型选择取消
 */
function handleTypeSelectorCancel() {
  logger.info('[FlowCanvas] Type selector cancelled')
  showTypeSelectorDialog.value = false
  pendingTypeSelectionTaskId.value = ''
  pendingTypeSelectionKind.value = 'model'
}

/**
 * 处理输出配置确认
 * 支持新建和编辑两种模式
 * 支持普通计算任务、本地查询任务和 PIR 任务
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
    fieldCount: config.fields.length,
    sourceType: pendingOutputSourceType.value
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

  // 检查是否是 PIR 任务
  const isPIRTask = taskNode.type === 'pir_task'

  // 检查是否有实时数据源输入（任一输入为实时数据源，输出也应为实时）
  const taskData = taskNode.data as ComputeTaskNodeData | import('@/types/nodes').PIRTaskNodeData
  const hasRealtimeInput = taskData.inputProviders?.some(p => p.isRealtime === true) || false

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
    const isStreamOutput = isPIRTask || hasRealtimeInput
    const existingData = outputNode.data as OutputDataNodeData
    outputNode.data = {
      ...existingData,
      label: config.dataset,
      participantId: config.participantId,
      entityName: entityName,
      dataset: config.dataset,
      fields: config.fields,
      color: isStreamOutput ? '#FA8C16' : '#52C41A',
      description: isStreamOutput ? `流式输出到 ${config.participantId}` : `输出到 ${config.participantId}`,
      isStreamOutput,
      isRealtime: hasRealtimeInput,
      isPIROutput: isPIRTask
    } as OutputDataNodeData

    // 更新父任务的 outputs 配置
    if (isPIRTask) {
      const pirData = taskNode.data as import('@/types/nodes').PIRTaskNodeData
      if (pirData.outputs) {
        const outputConfig = pirData.outputs.find(o => o.outputNodeId === editingOutputNodeId.value)
        if (outputConfig) {
          outputConfig.name = config.dataset
          outputConfig.fields = config.fields.map(f => ({
            source: f.source,
            columnName: f.columnName,
            columnAlias: f.columnAlias,
            columnType: f.columnType
          }))
          outputConfig.isRealtime = hasRealtimeInput
        }
      }
    } else {
      const taskData = taskNode.data as ComputeTaskNodeData
      if (taskData.outputs) {
        const outputConfig = taskData.outputs.find(o => o.outputNodeId === editingOutputNodeId.value)
        if (outputConfig) {
          outputConfig.participantId = config.participantId
          outputConfig.dataset = config.dataset
          outputConfig.outputFields = config.fields
          outputConfig.isRealtime = hasRealtimeInput
        }
      }
    }

    logger.info('[FlowCanvas] Output node updated', {
      outputNodeId: editingOutputNodeId.value,
      parentTaskId: pendingOutputTaskId.value,
      isRealtime: hasRealtimeInput
    })
  } else {
    // 新建模式：创建新的输出节点
    const outputNodeId = `output_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const outputPosition = {
      x: taskNode.position.x,
      y: taskNode.position.y + 150
    }

    // PIR 输出节点或包含实时数据源输入的任务使用流式样式
    const isStreamOutput = isPIRTask || hasRealtimeInput

    const outputNode: Node = {
      id: outputNodeId,
      type: 'outputData',
      position: outputPosition,
      data: {
        label: config.dataset,
        category: NodeCategory.OUTPUT_DATA,
        color: isStreamOutput ? '#FA8C16' : '#52C41A',  // 流式输出使用橙色
        icon: 'download',
        description: isStreamOutput ? `流式输出到 ${config.participantId}` : `输出到 ${config.participantId}`,
        parentTaskId: pendingOutputTaskId.value,
        participantId: config.participantId,
        entityName: entityName,
        dataset: config.dataset,
        fields: config.fields,
        isStreamOutput,  // 标记为流式输出
        isRealtime: hasRealtimeInput,  // 标记是否为实时输出
        isPIROutput: isPIRTask  // 标记是否为 PIR 输出（用于 OutputDataNode 组件显示特殊样式）
      } as any
    }

    addNode(outputNode)

    // 创建从计算任务到输出节点的连接
    const taskCategory = isPIRTask ? NodeCategory.COMPUTE_TASK : (taskNode.data as any).category
    const outputEdge = createUniqueEdge({
      source: pendingOutputTaskId.value,
      target: outputNodeId,
      sourceHandle: 'output',
      targetHandle: 'input'
    }, edges.value, taskCategory)
    edges.value.push(outputEdge)

    // 更新任务的 outputs 数组
    if (isPIRTask) {
      const pirData = taskNode.data as import('@/types/nodes').PIRTaskNodeData
      if (!pirData.outputs) {
        pirData.outputs = []
      }

      pirData.outputs.push({
        id: `pir_output_${Date.now()}`,
        name: config.dataset,
        type: 'stream',
        fields: config.fields.map(f => ({
          source: f.source,
          columnName: f.columnName,
          columnAlias: f.columnAlias,
          columnType: f.columnType
        })),
        outputNodeId: outputNodeId,
        isRealtime: hasRealtimeInput
      })
    } else {
      const taskData = taskNode.data as ComputeTaskNodeData
      if (!taskData.outputs) {
        taskData.outputs = []
      }

      taskData.outputs.push({
        id: `output_config_${Date.now()}`,
        participantId: config.participantId,
        dataset: config.dataset,
        outputFields: config.fields,
        outputNodeId: outputNodeId,
        isRealtime: hasRealtimeInput
      })
    }

    logger.info('[FlowCanvas] Output node created and linked', {
      outputNodeId,
      parentTaskId: pendingOutputTaskId.value,
      edgeId: outputEdge.id,
      isStreamOutput,
      isRealtime: hasRealtimeInput
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
  // 清理本地Query相关状态
  pendingOutputFixedEnterprise.value = undefined
  pendingOutputLocalQueryData.value = undefined
  pendingOutputSourceType.value = ''
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

  // 情况1：编辑现有表达式模型
  if (currentModelConfig.value && currentTaskId.value) {
    logger.info('[FlowCanvas] Updating existing expression model', {
      modelId: currentModelConfig.value.id,
      taskId: currentTaskId.value
    })

    // 更新模型配置的表达式
    currentModelConfig.value.expression = expression

    // 更新计算任务的 models 数组
    const taskNode = nodes.value.find(n => n.id === currentTaskId.value)
    if (taskNode) {
      const taskData = taskNode.data as ComputeTaskNodeData
      if (taskData.models) {
        const modelIndex = taskData.models.findIndex(m => m.id === currentModelConfig.value!.id)
        if (modelIndex !== -1 && taskData.models[modelIndex]) {
          taskData.models[modelIndex].expression = expression
          logger.info('[FlowCanvas] Expression model updated in task')
        }
      }
    }

    // 清理状态
    showExpressionEditorDialog.value = false
    pendingExpression.value = ''
    currentModelConfig.value = null
    currentTaskId.value = ''
    pendingTargetTaskNodeId.value = ''
    return
  }

  // 情况2：创建新的表达式模型
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
  currentModelConfig.value = null
  currentTaskId.value = ''
  pendingTargetTaskNodeId.value = ''
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

  // 根据任务类型创建不同的节点
  if (pendingLocalTaskData.value.computeType === LocalTaskType.LOCAL_QUERY ||
      pendingLocalTaskData.value.type === 'local_query') {
    // 创建本地Query节点
    createLocalQueryNode(pendingLocalTaskData.value, participantId)
  } else {
    // 创建其他本地任务节点
    createLocalTaskNode(pendingLocalTaskData.value, participantId)
  }

  // 清理状态
  showLocalTaskEnterpriseDialog.value = false
  pendingLocalTaskData.value = null
  pendingNodePosition.value = null
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
 * 处理分组统计配置事件（从 FlowDetailPanel 触发）
 */
function handleConfigGroupBy(data: { modelId: string; taskId: string }) {
  logger.info('[FlowCanvas] Config GroupBy event received', data)

  currentGroupByModelId.value = data.modelId
  currentGroupByTaskId.value = data.taskId

  showGroupByConfigDialog.value = true
}

/**
 * 处理表达式模型配置事件（从 FlowDetailPanel 触发）
 */
function handleConfigExpression(data: { modelId: string; taskId: string }) {
  logger.info('[FlowCanvas] Config Expression event received', data)

  // 查找计算任务节点
  const taskNode = nodes.value.find(n => n.id === data.taskId)
  if (!taskNode) {
    logger.warn('[FlowCanvas] Task node not found', { taskId: data.taskId })
    return
  }

  const taskData = taskNode.data as ComputeTaskNodeData
  const model = taskData.models?.find(m => m.id === data.modelId)
  if (!model) {
    logger.warn('[FlowCanvas] Model not found', { modelId: data.modelId })
    return
  }

  // 设置当前编辑的表达式模型
  currentModelConfig.value = model
  currentTaskId.value = data.taskId

  // 设置表达式编辑器的输入数据
  pendingExpression.value = model.expression || ''
  pendingExpressionData.value = null
  pendingTargetTaskNodeId.value = data.taskId

  // 打开表达式编辑器
  showExpressionEditorDialog.value = true
}

/**
 * 处理算力资源配置事件（从 FlowDetailPanel 触发）
 */
function handleConfigCompute(data: { computeId: string; taskId: string }) {
  logger.info('[FlowCanvas] Config Compute event received', data)

  // 查找计算任务节点
  const taskNode = nodes.value.find(n => n.id === data.taskId)
  if (!taskNode) {
    logger.warn('[FlowCanvas] Task node not found', { taskId: data.taskId })
    return
  }

  const taskData = taskNode.data as ComputeTaskNodeData
  const compute = taskData.computeProviders?.find(c => c.id === data.computeId)
  if (!compute) {
    logger.warn('[FlowCanvas] Compute provider not found', { computeId: data.computeId })
    return
  }

  // 打开统一资源选择器进行重新配置
  // 设置选择器结果以便重新配置
  pendingSelectorResult.value = {
    data: {
      label: compute.id,
      category: 'computeResource',
      type: 'compute_resource',
      icon: '⚡',
      color: '#13c2c2',
      sourceType: compute.type,
      participantId: compute.participantId
    },
    targetTaskNodeId: data.taskId
  }

  showUnifiedSelector.value = true
}

/**
 * 处理输出数据配置事件（从 FlowDetailPanel 触发）
 */
function handleConfigOutput(data: { outputIndex: number; taskId: string }) {
  logger.info('[FlowCanvas] Config Output event received', data)

  // 查找计算任务节点
  const taskNode = nodes.value.find(n => n.id === data.taskId)
  if (!taskNode) {
    logger.warn('[FlowCanvas] Task node not found', { taskId: data.taskId })
    return
  }

  const taskData = taskNode.data as ComputeTaskNodeData

  // 从 outputs 数组获取对应索引的输出配置
  const outputConfig = taskData.outputs?.[data.outputIndex]
  if (!outputConfig || !outputConfig.outputNodeId) {
    logger.warn('[FlowCanvas] Output config not found or missing outputNodeId', {
      outputIndex: data.outputIndex,
      outputs: taskData.outputs
    })
    return
  }

  // 打开输出配置弹窗进行重新配置
  openEditOutputDialog(outputConfig.outputNodeId)
}

/**
 * 处理模型节点配置事件（从 FlowDetailPanel 触发）
 */
function handleConfigModelNode(data: { nodeId: string; modelType: string }) {
  logger.info('[FlowCanvas] Config Model Node event received', data)

  // 查找模型节点
  const modelNode = nodes.value.find(n => n.id === data.nodeId)
  if (!modelNode) {
    logger.warn('[FlowCanvas] Model node not found', { nodeId: data.nodeId })
    return
  }

  // 通过边查找模型节点连接的任务节点
  const modelEdge = edges.value.find(e => e.source === data.nodeId)
  if (!modelEdge) {
    logger.warn('[FlowCanvas] No edge found from model node', { nodeId: data.nodeId })
    return
  }

  const parentTaskId = modelEdge.target
  const taskNode = nodes.value.find(n => n.id === parentTaskId)
  if (!taskNode) {
    logger.warn('[FlowCanvas] Parent task node not found', { parentTaskId })
    return
  }

  const taskData = taskNode.data as ComputeTaskNodeData

  // 从任务节点的 models 数组中找到对应的模型配置
  const modelConfig = taskData.models?.find(m => m.modelNodeId === data.nodeId)
  if (!modelConfig) {
    logger.warn('[FlowCanvas] Model config not found in task', { nodeId: data.nodeId, parentTaskId })
    return
  }

  // 根据模型类型打开对应的编辑器，传递完整的任务上下文
  if (data.modelType === 'expression') {
    // 设置表达式编辑器的输入数据
    currentModelConfig.value = modelConfig
    currentTaskId.value = parentTaskId
    pendingExpression.value = modelConfig.expression || ''
    pendingExpressionData.value = null
    pendingTargetTaskNodeId.value = parentTaskId
    showExpressionEditorDialog.value = true
  } else if (data.modelType === 'GROUP_STAT') {
    // 打开分组统计配置
    currentGroupByModelId.value = modelConfig.id
    currentGroupByTaskId.value = parentTaskId
    showGroupByConfigDialog.value = true
  } else {
    // 打开模型参数配置
    currentModelConfig.value = modelConfig
    currentTaskId.value = parentTaskId
    availableFields.value = generateAvailableFields(taskData)
    paramConfigVisible.value = true
  }
}

/**
 * 处理输入数据源配置事件（从 FlowDetailPanel 触发）
 */
function handleConfigInputProvider(data: { taskId: string; sourceNodeId: string; fields: FieldMapping[] }) {
  logger.info('[FlowCanvas] Config input provider event received', data)

  // 查找计算任务节点
  const taskNode = nodes.value.find(n => n.id === data.taskId)
  if (!taskNode) {
    logger.warn('[FlowCanvas] Task node not found', { taskId: data.taskId })
    return
  }

  const taskData = taskNode.data as ComputeTaskNodeData
  if (!taskData.inputProviders) {
    taskData.inputProviders = []
  }

  // 查找对应的输入提供者
  const providerIndex = taskData.inputProviders.findIndex(
    p => p.sourceNodeId === data.sourceNodeId
  )

  if (providerIndex !== -1 && taskData.inputProviders[providerIndex]) {
    // 更新字段配置
    taskData.inputProviders[providerIndex].fields = data.fields

    // 重新构建 Join 条件
    taskData.joinConditions = buildJoinConditions(taskData.inputProviders)

    logger.info('[FlowCanvas] Input provider updated', {
      taskId: data.taskId,
      sourceNodeId: data.sourceNodeId,
      fieldCount: data.fields.length,
      joinConditionsCount: taskData.joinConditions.length
    })
  } else {
    logger.warn('[FlowCanvas] Input provider not found', {
      taskId: data.taskId,
      sourceNodeId: data.sourceNodeId
    })
  }
}

/**
 * 处理 PIR 任务配置事件（从 FlowDetailPanel 触发）
 */
function handleConfigPIRTask(nodeId: string) {
  logger.info('[FlowCanvas] Config PIR task event received', { nodeId })

  // 查找 PIR 任务节点
  const taskNode = nodes.value.find(n => n.id === nodeId)
  if (!taskNode) {
    logger.warn('[FlowCanvas] PIR task node not found', { nodeId })
    return
  }

  // 打开 PIR 任务配置弹窗
  openRealtimeDataSourceConfig(nodeId)
}

/**
 * 处理 FL 任务配置事件（从 FlowDetailPanel 触发）
 */
function handleConfigFLTask(nodeId: string) {
  logger.info('[FlowCanvas] Config FL task event received', { nodeId })

  // 查找 FL 任务节点
  const taskNode = nodes.value.find(n => n.id === nodeId)
  if (!taskNode) {
    logger.warn('[FlowCanvas] FL task node not found', { nodeId })
    return
  }

  // 打开 FL 任务配置弹窗
  openFLTaskConfig(nodeId)
}

/**
 * 处理 FL 特征工程输出配置
 */
function handleConfigFLOutput(data: { taskId: string; outputIndex: number }) {
  logger.info('[FlowCanvas] Config FL output event received', data)

  const taskNode = nodes.value.find(n => n.id === data.taskId)
  if (!taskNode) {
    logger.warn('[FlowCanvas] FL task node not found', { taskId: data.taskId })
    return
  }

  const taskData = taskNode.data as any
  const outputs = taskData.outputs || []
  const output = outputs[data.outputIndex]

  if (!output) {
    logger.warn('[FlowCanvas] FL output not found', { outputIndex: data.outputIndex })
    return
  }

  // 复用 MPC 的输出配置逻辑
  pendingOutputTaskId.value = data.taskId
  pendingOutputConfig.value = {
    participantId: output.participantId,
    dataset: output.dataset,
    fields: output.outputFields || [],
    fieldSources: output.fieldSources
  }
  editingOutputNodeId.value = output.outputNodeId
  pendingOutputSourceType.value = 'fl_task'

  showOutputConfigDialog.value = true
  logger.info('[FlowCanvas] Opening FL output config dialog', {
    taskId: data.taskId,
    outputIndex: data.outputIndex
  })
}

/**
 * 处理 FL 模型输出配置
 */
function handleConfigFLModelOutput(data: { taskId: string; outputIndex: number }) {
  logger.info('[FlowCanvas] Config FL model output event received', data)

  const taskNode = nodes.value.find(n => n.id === data.taskId)
  if (!taskNode) {
    logger.warn('[FlowCanvas] FL task node not found', { taskId: data.taskId })
    return
  }

  const taskData = taskNode.data as any
  const modelOutputs = taskData.modelOutputs || []
  const modelOutput = modelOutputs[data.outputIndex]

  if (!modelOutput) {
    logger.warn('[FlowCanvas] FL model output not found', { outputIndex: data.outputIndex })
    return
  }

  // TODO: 打开模型输出配置弹窗
  logger.info('[FlowCanvas] FL model output config', {
    taskId: data.taskId,
    outputIndex: data.outputIndex,
    modelOutput
  })
}

/**
 * 处理添加 FL 输出（特征工程任务）
 */
function handleAddFLOutput(nodeId: string) {
  logger.info('[FlowCanvas] Add FL output event received', { nodeId })

  const taskNode = nodes.value.find(n => n.id === nodeId)
  if (!taskNode) {
    logger.warn('[FlowCanvas] FL task node not found', { nodeId })
    return
  }

  const taskData = taskNode.data as any

  // 检查是否有输入数据
  if (!taskData.inputProviders || taskData.inputProviders.length === 0) {
    showError('请先配置输入数据源')
    return
  }

  // 初始化 outputs 数组
  if (!taskData.outputs) {
    taskData.outputs = []
  }

  // 设置待处理的输出配置
  pendingOutputTaskId.value = nodeId
  pendingOutputConfig.value = undefined
  editingOutputNodeId.value = undefined
  pendingOutputSourceType.value = 'fl_task'

  showOutputConfigDialog.value = true
  logger.info('[FlowCanvas] Opening FL output config dialog for new output', {
    taskId: nodeId
  })
}

/**
 * 处理添加 FL 模型输出（横向/纵向模型任务）
 */
function handleAddFLModelOutput(nodeId: string) {
  logger.info('[FlowCanvas] Add FL model output event received', { nodeId })

  const taskNode = nodes.value.find(n => n.id === nodeId)
  if (!taskNode) {
    logger.warn('[FlowCanvas] FL task node not found', { nodeId })
    return
  }

  const taskData = taskNode.data as any

  // 检查是否有输入数据
  if (!taskData.inputProviders || taskData.inputProviders.length === 0) {
    showError('请先配置输入数据源')
    return
  }

  // 初始化 modelOutputs 数组
  if (!taskData.modelOutputs) {
    taskData.modelOutputs = []
  }

  // 创建新的模型输出
  const newModelOutput = {
    id: `fl_model_${Date.now()}`,
    participantId: taskData.inputProviders[0]?.participantId || '',
    modelName: `${taskData.taskDisplayName || '模型'}_${taskData.modelOutputs.length + 1}`,
    modelType: taskData.flCategory === 'horizontal' ? '横向模型' : '纵向模型',
    outputNodeId: ''
  }

  taskData.modelOutputs.push(newModelOutput)

  // 创建模型输出节点
  const outputNodeId = `fl_model_node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const outputPosition = {
    x: taskNode.position.x + 100 * (taskData.modelOutputs.length - 1),
    y: taskNode.position.y + 150
  }

  const outputNode: Node = {
    id: outputNodeId,
    type: 'fl_model_output',
    position: outputPosition,
    data: {
      label: newModelOutput.modelName,
      category: NodeCategory.OUTPUT_DATA,
      color: taskData.flCategory === 'horizontal' ? '#722ed1' : '#fa8c16',
      icon: '🤖',
      description: '联邦学习模型输出',
      parentTaskId: nodeId,
      participantId: newModelOutput.participantId,
      modelType: newModelOutput.modelType
    } as any
  }

  addNode(outputNode)

  // 创建连线
  const outputEdge = createUniqueEdge({
    source: nodeId,
    target: outputNodeId,
    sourceHandle: 'output',
    targetHandle: 'input'
  }, edges.value, NodeCategory.COMPUTE_TASK)
  edges.value.push(outputEdge)

  // 更新模型输出的 outputNodeId
  newModelOutput.outputNodeId = outputNodeId

  logger.info('[FlowCanvas] FL model output created', {
    taskId: nodeId,
    outputNodeId,
    modelName: newModelOutput.modelName
  })
}

/**
 * 处理 FL 特征工程添加输出事件（从 FLTaskNode 发出）
 */
function handleAddFLOutputEvent(event: Event) {
  const customEvent = event as CustomEvent
  const nodeId = customEvent.detail.nodeId
  logger.info('[FlowCanvas] Add FL output event received from FLTaskNode', { nodeId })
  handleAddFLOutput(nodeId)
}

/**
 * 处理 FL 模型添加模型输出事件（从 FLTaskNode 发出）
 */
function handleAddFLModelOutputEvent(event: Event) {
  const customEvent = event as CustomEvent
  const nodeId = customEvent.detail.nodeId
  logger.info('[FlowCanvas] Add FL model output event received from FLTaskNode', { nodeId })
  handleAddFLModelOutput(nodeId)
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
 * 获取分组统计对话框的任务数据
 */
function getGroupByTaskData() {
  const taskNode = nodes.value.find(n => n.id === currentGroupByTaskId.value)
  return taskNode?.data as ComputeTaskNodeData | undefined
}

/**
 * 获取分组统计初始配置
 */
function getInitialGroupByConfig() {
  // 新建模型时不返回初始配置
  if (currentGroupByModelId.value.startsWith('groupby_temp_')) {
    return undefined
  }

  const taskNode = nodes.value.find(n => n.id === currentGroupByTaskId.value)
  if (!taskNode) return undefined

  const taskData = taskNode.data as ComputeTaskNodeData
  const model = taskData.models?.find(m => m.id === currentGroupByModelId.value)
  return model?.groupByConfig
}

/**
 * 确认分组统计配置
 */
function handleGroupByConfigConfirm(config: any) {
  logger.info('[FlowCanvas] GroupBy config confirmed', {
    modelId: currentGroupByModelId.value,
    taskId: currentGroupByTaskId.value
  })

  const taskNode = nodes.value.find(n => n.id === currentGroupByTaskId.value)
  if (!taskNode) {
    logger.warn('[FlowCanvas] Task node not found')
    showGroupByConfigDialog.value = false
    return
  }

  const taskData = taskNode.data as ComputeTaskNodeData

  // 检查是否是新建模型（临时ID）
  const isNewModel = currentGroupByModelId.value.startsWith('groupby_temp_')

  if (isNewModel) {
    // 新建模型：创建模型节点和连接线
    const modelNodeId = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const modelPosition = {
      x: taskNode.position.x - 200,
      y: taskNode.position.y
    }

    // 生成正式的模型ID
    const finalModelId = `groupby_${Date.now()}`

    // 创建模型节点
    const modelNode: Node = {
      id: modelNodeId,
      type: 'modelNode',
      position: modelPosition,
      data: {
        label: '分组统计',
        category: 'model',
        color: '#13C2C2',
        icon: '📊',
        type: ModelType.GROUP_STAT,
        participantId: taskData.inputProviders?.[0]?.participantId || '', // 使用第一个输入提供者的企业
        name: '分组统计',
        modelId: finalModelId,
        groupByConfig: config  // 添加分组统计配置到节点数据
      } as any
    }

    addNode(modelNode)

    // 创建连接线
    const modelEdge = createUniqueEdge({
      source: modelNodeId,
      target: taskNode.id,
      sourceHandle: 'output',
      targetHandle: 'input'
    }, edges.value, 'model')
    edges.value.push(modelEdge)

    // 将模型添加到任务的 models 列表
    const newModel: ComputeModelConfig = {
      id: finalModelId,
      type: ModelType.GROUP_STAT,
      participantId: taskData.inputProviders?.[0]?.participantId || '',
      name: '分组统计',
      groupByConfig: config,
      modelNodeId: modelNodeId
    }

    const updatedModels = [...(taskData.models || []), newModel]
    setNodes(
      nodes.value.map(n =>
        n.id === currentGroupByTaskId.value
          ? { ...n, data: { ...(n.data || {}), models: updatedModels } as any }
          : n
      ) as any
    )

    logger.info('[FlowCanvas] GroupBy model created', {
      modelId: finalModelId,
      modelNodeId,
      taskId: currentGroupByTaskId.value
    })
  } else {
    // 编辑现有模型：更新配置
    if (taskData.models) {
      // 找到对应的模型配置，获取模型节点ID
      const targetModel = taskData.models.find(m => m.id === currentGroupByModelId.value)
      const modelNodeId = targetModel?.modelNodeId

      const updatedModels = taskData.models.map(m => {
        if (m.id === currentGroupByModelId.value) {
          return { ...m, groupByConfig: config }
        }
        return m
      })

      setNodes(
        nodes.value.map(n => {
          // 更新任务节点的 models 列表
          if (n.id === currentGroupByTaskId.value) {
            return { ...n, data: { ...(n.data || {}), models: updatedModels } as any }
          }
          // 同时更新模型节点的 groupByConfig
          if (modelNodeId && n.id === modelNodeId) {
            return { ...n, data: { ...(n.data || {}), groupByConfig: config } as any }
          }
          return n
        }) as any
      )

      logger.info('[FlowCanvas] GroupBy model config updated', {
        modelId: currentGroupByModelId.value,
        modelNodeId
      })
    }
  }

  showGroupByConfigDialog.value = false
}

/**
 * 取消分组统计配置
 */
function handleGroupByConfigCancel() {
  logger.info('[FlowCanvas] GroupBy config dialog cancelled')
  showGroupByConfigDialog.value = false
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
      parentTaskId: targetTaskNode.id,  // 添加父任务ID
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
  }, edges.value, 'model')
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
  }, edges.value, 'computeResource')
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

  logger.info('[FlowCanvas] create-test-node data:', { category: data.category, type: data.type, position })

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
  } else if (category === 'localtask' || category === 'local_task') {
    // 对于本地任务节点，使用默认企业创建
    logger.info('[FlowCanvas] Creating local task node from test event', {
      type: data.type,
      computeType: data.computeType
    })

    const defaultParticipantId = 'test_enterprise_001'

    if (data.computeType === LocalTaskType.LOCAL_QUERY || data.type === 'local_query') {
      createLocalQueryNode(data, defaultParticipantId)
    } else {
      createLocalTaskNode(data, defaultParticipantId)
    }

    // 清理状态
    pendingLocalTaskData.value = null
    pendingNodePosition.value = null
  } else if (category === 'compute_task' || category === NodeCategory.COMPUTE_TASK || data.type === 'fl_task') {
    // 对于计算任务节点（包括 FL 任务）
    logger.info('[FlowCanvas] Creating compute task node from test event', {
      type: data.type,
      taskType: data.taskType,
      flTask: data.flTask
    })

    // 如果有 flTask 属性，使用 createFLTaskNode
    if (data.flTask) {
      createFLTaskNode(data as any)
    } else {
      // 使用默认技术路径创建
      const techPath = TechPath.SOFTWARE

      // 创建节点数据
      const nodeData: DroppedNodeData = {
        type: data.type || 'compute_task',
        label: data.label,
        category: NodeCategory.COMPUTE_TASK,
        taskType: data.taskType || ComputeTaskType.FL,
        icon: data.icon || '🎓',
        color: data.color || '#1890ff',
        description: data.description || ''
      }

      // 直接创建节点
      createNode(nodeData, position || { x: 400, y: 200 }, techPath)
    }

    // 清理状态
    pendingNodeData.value = null
    pendingNodePosition.value = null
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

  // 创建从计算任务到输出节点的连接
  const outputEdge = createUniqueEdge({
    source: taskNode.id,
    target: outputNode.id,
    sourceHandle: 'output',
    targetHandle: 'input'
  }, edges.value, nodeData.category)
  edges.value.push(outputEdge)

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
    outputId: outputNode.id,
    edgeId: outputEdge.id
  })
}

/**
 * 处理测试用的带模型节点的任务创建事件
 * 用于 E2E 测试中直接创建已连接模型节点的计算任务
 */
function handleCreateTestTaskWithModel(event: Event) {
  logger.info('[FlowCanvas] create-test-task-with-model event received')
  const customEvent = event as CustomEvent
  const { taskData, modelData, position: taskPos } = customEvent.detail

  // 创建计算任务节点
  const taskPosition = taskPos || { x: 400, y: 200 }
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

  logger.info('[FlowCanvas] Creating model node for test', {
    taskId: taskNode.id,
    modelData
  })

  // 创建模型节点
  const modelNodeId = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const modelPosition = {
    x: taskNode.position.x - 200,
    y: taskNode.position.y
  }

  const modelNode: Node = {
    id: modelNodeId,
    type: 'modelNode',
    position: modelPosition,
    data: {
      label: modelData.name || '测试模型',
      category: 'model',
      color: '#8B5CF6',
      icon: '📦',
      type: modelData.type || 'CodeBin-V3-1',
      modelId: modelData.id || 'test_model',
      participantId: modelData.participantId || 'test_participant',
      expression: modelData.expression,
      parameters: []
    } as any
  }

  addNode(modelNode)

  // 创建连接
  const modelEdge = createUniqueEdge({
    source: modelNodeId,
    target: taskNode.id,
    sourceHandle: 'output',
    targetHandle: 'input'
  }, edges.value, 'model')
  edges.value.push(modelEdge)

  // 更新计算任务的 models 数组
  const nodeData = taskNode.data as ComputeTaskNodeData
  if (!nodeData.models) {
    nodeData.models = []
  }

  nodeData.models.push({
    type: modelData.type || 'CodeBin-V3-1',
    id: modelData.id || 'test_model',
    name: modelData.name || '测试模型',
    participantId: modelData.participantId || 'test_participant',
    expression: modelData.expression,
    parameters: [],
    modelNodeId: modelNodeId
  })

  logger.info('[FlowCanvas] Created task with model', {
    taskId: taskNode.id,
    modelNodeId,
    totalModels: nodeData.models.length
  })
}

/**
 * 处理测试用的带算力资源节点的任务创建事件
 * 用于 E2E 测试中直接创建已连接算力资源节点的计算任务
 */
function handleCreateTestTaskWithCompute(event: Event) {
  logger.info('[FlowCanvas] create-test-task-with-compute event received')
  const customEvent = event as CustomEvent
  const { taskData, computeData, position: taskPos } = customEvent.detail

  // 创建计算任务节点
  const taskPosition = taskPos || { x: 400, y: 200 }
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

  logger.info('[FlowCanvas] Creating compute resource node for test', {
    taskId: taskNode.id,
    computeData
  })

  // 创建算力资源节点
  const computeNodeId = `compute_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const computePosition = {
    x: taskNode.position.x + 300,
    y: taskNode.position.y
  }

  const computeNode: Node = {
    id: computeNodeId,
    type: 'computeResource',
    position: computePosition,
    data: {
      label: computeData.name || '测试算力',
      category: 'computeResource',
      color: '#FA8C16',
      icon: '⚡',
      participantId: computeData.participantId || 'test_participant',
      resourceId: computeData.id || 'test_compute',
      resourceType: computeData.type || 'TEE_CPU'
    } as any
  }

  addNode(computeNode)

  // 创建连接
  const computeEdge = createUniqueEdge({
    source: computeNodeId,
    target: taskNode.id,
    sourceHandle: 'output',
    targetHandle: 'compute-input'
  }, edges.value, 'computeResource')
  edges.value.push(computeEdge)

  // 更新计算任务的 computeProviders 数组
  const nodeData = taskNode.data as ComputeTaskNodeData
  if (!nodeData.computeProviders) {
    nodeData.computeProviders = []
  }

  nodeData.computeProviders.push({
    participantId: computeData.participantId || 'test_participant',
    id: computeData.id || 'test_compute',
    type: computeData.type || 'TEE_CPU',
    groupId: computeData.groupId || 'test_group',
    groupName: computeData.groupName || '测试组',
    nodeId: computeData.nodeId || 'test_node',
    cardSerial: computeData.cardSerial || 'SN001',
    cardModel: computeData.cardModel || 'TestModel',
    resourceNodeId: computeNodeId
  })

  logger.info('[FlowCanvas] Created task with compute resource', {
    taskId: taskNode.id,
    computeNodeId,
    totalProviders: nodeData.computeProviders.length
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
 * 处理测试用的算力资源节点创建事件
 */
function handleCreateTestComputeResourceNode(event: Event) {
  logger.info('[FlowCanvas] create-test-compute-resource-node event received')
  const customEvent = event as CustomEvent
  const { position } = customEvent.detail

  // 保存节点位置
  const nodePosition = position || { x: 150, y: 300 }
  pendingNodePosition.value = nodePosition

  // 创建算力资源节点
  const computeResourceId = `compute_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const computePosition = nodePosition

  const computeResourceNode: Node = {
    id: computeResourceId,
    type: 'computeResource',
    position: computePosition,
    data: {
      label: '测试算力资源',
      category: 'computeResource',
      color: '#FA8C16',
      icon: '⚡',
      participantId: 'test-participant',
      resourceId: 'test-compute-id',
      resourceType: 'TEE_CPU'
    } as any
  }

  addNode(computeResourceNode)
  logger.info('[FlowCanvas] Test compute resource node created', {
    computeResourceId,
    position: computePosition
  })
}

/**
 * 处理测试用的连接创建事件
 * 用于 E2E 测试中直接创建节点连接并触发字段选择对话框
 */
function handleCreateTestConnection(event: Event) {
  const customEvent = event as CustomEvent
  // 先检查 detail 是否存在
  if (!customEvent.detail) {
    logger.warn('[FlowCanvas] create-test-connection event has no detail')
    return
  }

  // 检查 detail 中的所有键
  const detailKeys = Object.keys(customEvent.detail)
  logger.info('[FlowCanvas] create-test-connection detail keys:', detailKeys)

  const { sourceNodeId, targetNodeId, autoConfirm, selectAllFields } = customEvent.detail

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

  // 检查是否应该自动确认（支持 autoConfirm 参数或全局测试标志）
  const shouldAutoConfirm = autoConfirm || (window as any).__PLAYWRIGHT_TEST_AUTO_CONFIRM_FIELDS__

  if (shouldAutoConfirm) {
    logger.info('[FlowCanvas] Auto-confirming field selection')
    nextTick(() => {
      // 自动选择所有字段并确认
      const selection = {
        sourceNodeId,
        sourceType: pendingSourceType.value as 'dataSource' | 'outputData',
        participantId: pendingParticipantId.value,
        dataset: pendingDataset.value,
        // 如果 selectAllFields 为 true，选择所有可用字段
        fields: selectAllFields
          ? pendingAvailableFields.value.map(field => ({
              columnName: field.name,
              columnAlias: field.name,  // 默认使用字段名作为别名
              columnType: field.dataType,
              isJoinField: field.isPrimaryKey || false
            }))
          : pendingAvailableFields.value.slice(0, 1).map(field => ({
              columnName: field.name,
              columnAlias: field.name,
              columnType: field.dataType,
              isJoinField: field.isPrimaryKey || false
            }))
      }
      handleFieldSelected(selection)
      logger.info('[FlowCanvas] Auto-confirmed field selection for test connection', {
        fieldCount: selection.fields.length
      })
    })
  }
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
  } else if ((data as any).modelType === 'GROUP_STAT') {
    // 分组统计模型：直接打开配置对话框
    logger.info('[FlowCanvas] Opening GroupBy config dialog')
    currentGroupByTaskId.value = targetTaskNode.id
    currentGroupByModelId.value = `groupby_temp_${Date.now()}`

    nextTick(() => {
      showGroupByConfigDialog.value = true
      logger.info('[FlowCanvas] showGroupByConfigDialog set to true')
    })
  } else {
    // 其他模型：弹出企业选择对话框
    logger.info('[FlowCanvas] Opening enterprise selector dialog')
    showEnterpriseDialog.value = true
  }
}

/**
 * 处理测试用的打开表达式编辑器事件
 * 用于 E2E 测试中直接打开表达式编辑器
 */
function handleOpenExpressionEditor(event: Event) {
  logger.info('[FlowCanvas] open-expression-editor event received')
  const customEvent = event as CustomEvent
  const { nodeId } = customEvent.detail

  // 查找目标任务节点
  const targetTaskNode = nodes.value.find(n => n.id === nodeId)

  if (!targetTaskNode) {
    logger.warn('[FlowCanvas] Target task node not found for expression editor', { nodeId })
    return
  }

  logger.info('[FlowCanvas] Opening expression editor for task node', {
    nodeId,
    taskType: targetTaskNode.data?.taskType
  })

  // 设置状态并打开表达式编辑器
  pendingTargetTaskNodeId.value = nodeId
  pendingExpression.value = ''
  pendingExpressionData.value = null

  nextTick(() => {
    showExpressionEditorDialog.value = true
    logger.info('[FlowCanvas] Expression editor dialog opened')
  })
}

/**
 * 处理测试用的算力资源节点拖放事件
 * 用于 E2E 测试中模拟拖拽算力资源节点到计算任务节点上
 */
function handleTestDropCompute(event: Event) {
  logger.info('[FlowCanvas] ===== test-drop-compute event START =====')
  const customEvent = event as CustomEvent
  const { data } = customEvent.detail

  logger.info('[FlowCanvas] test-drop-compute data received', {
    data: data,
    dataKeys: data ? Object.keys(data) : 'no data'
  })

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

  // 关闭所有可能打开的对话框
  logger.info('[FlowCanvas] Closing all dialogs before opening unified selector')
  showEnterpriseDialog.value = false
  showModelSelectorDialog.value = false
  showComputeSelectorDialog.value = false

  // 等待一下确保对话框关闭状态生效
  setTimeout(() => {
    // 使用统一资源选择器（与当前实现保持一致）
    pendingSelectorResult.value = {
      data,
      targetTaskNodeId: targetTaskNode.id
    }
    selectorResourceType.value = 'compute'
    showUnifiedSelector.value = true

    logger.info('[FlowCanvas] ===== Unified selector opened =====', {
      resourceType: selectorResourceType.value,
      showDialog: showUnifiedSelector.value,
      showEnterpriseDialog: showEnterpriseDialog.value
    })
  }, 50)
}

/**
 * 统一资源选择器确认处理
 */
function handleUnifiedSelectorConfirm(result: any) {
  logger.info('[FlowCanvas] Unified selector confirmed', {
    resourceType: selectorResourceType.value,
    hasAssetInfo: !!result.assetInfo,
    hasModelInfo: !!result.modelInfo,
    hasComputeInfo: !!result.computeInfo,
    isRealtimeDatasource: isRealtimeDatasourceSelection.value
  })

  if (selectorResourceType.value === 'data' && result.assetInfo) {
    // 检查是否是从实时数据源节点触发的选择
    if (isRealtimeDatasourceSelection.value) {
      // 创建实时数据源节点
      createRealtimeDataSourceNodeFromAsset(result.assetInfo, result.selectedFields)
    } else {
      // 普通数据源选择确认
      handleAssetSelected({
        assetInfo: result.assetInfo,
        selectedFields: result.selectedFields
      })
    }
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
  isRealtimeDatasourceSelection.value = false
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
  isRealtimeDatasourceSelection.value = false
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
  handleAutoLayout,
  handleConfigParams,
  handleConfigGroupBy,
  handleConfigExpression,
  handleConfigCompute,
  handleConfigOutput,
  handleConfigModelNode,
  handleConfigInputProvider,
  handleConfigPIRTask,
  handleConfigFLTask,
  handleConfigFLOutput,
  handleConfigFLModelOutput,
  handleAddFLOutput,
  handleAddFLModelOutput
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
    cascadedCount: nodesToDelete.length - 1
  })
}

/**
 * 处理测试用的连接线删除事件
 * 用于 E2E 测试中直接删除连接线并验证级联删除
 */
function handleTestDeleteEdge(event: Event) {
  const customEvent = event as CustomEvent
  const { edgeId } = customEvent.detail

  logger.info('[FlowCanvas] test-delete-edge event received', { edgeId })

  // 找到要删除的连接线
  const edgeToDelete = edges.value.find(e => e.id === edgeId)
  if (!edgeToDelete) {
    logger.warn('[FlowCanvas] Edge not found for deletion', { edgeId })
    return
  }

  const sourceNode = nodes.value.find(n => n.id === edgeToDelete.source)
  const targetNode = nodes.value.find(n => n.id === edgeToDelete.target)

  // 处理不同类型的连接删除
  if (sourceNode && targetNode) {
    const sourceData = sourceNode.data as NodeData
    const targetData = targetNode.data as NodeData

    // 情况1: 从数据源到计算任务的连接 - 清除输入配置
    if (sourceData.category === NodeCategory.DATA_SOURCE &&
        targetData.category === NodeCategory.COMPUTE_TASK) {
      const taskData = targetData as ComputeTaskNodeData
      if (taskData.inputProviders) {
        const beforeCount = taskData.inputProviders.length
        taskData.inputProviders = taskData.inputProviders.filter(
          provider => provider.sourceNodeId !== sourceNode.id
        )

        if (taskData.inputProviders.length < beforeCount) {
          taskData.joinConditions = buildJoinConditions(taskData.inputProviders)
          logger.info('[FlowCanvas] Input provider removed from task on edge deletion (test)', {
            sourceNodeId: sourceNode.id,
            targetTaskId: targetNode.id,
            removedCount: beforeCount - taskData.inputProviders.length,
            remainingCount: taskData.inputProviders.length
          })
        }
      }
    }

    // 情况2: 从模型节点到计算任务的连接 - 删除模型节点
    if (sourceData.category === NodeCategory.MODEL &&
        targetData.category === NodeCategory.COMPUTE_TASK) {
      const taskData = targetData as ComputeTaskNodeData
      if (taskData.models) {
        const beforeCount = taskData.models.length
        taskData.models = taskData.models.filter(
          model => model.modelNodeId !== sourceNode.id
        )

        if (taskData.models.length < beforeCount) {
          logger.info('[FlowCanvas] Model removed from task on edge deletion (test)', {
            modelNodeId: sourceNode.id,
            targetTaskId: targetNode.id,
            removedCount: beforeCount - taskData.models.length,
            remainingCount: taskData.models.length
          })
        }
      }

      // 删除模型节点
      setNodes(nodes.value.filter(n => n.id !== sourceNode.id))

      logger.info('[FlowCanvas] Auto-deleted model node on edge removal (test)', {
        modelNodeId: sourceNode.id,
        parentTaskId: targetNode.id
      })
    }

    // 情况3: 从算力资源节点到计算任务的连接 - 删除算力资源节点
    if (sourceData.category === NodeCategory.COMPUTE_RESOURCE &&
        targetData.category === NodeCategory.COMPUTE_TASK) {
      const taskData = targetData as ComputeTaskNodeData
      if (taskData.computeProviders) {
        const beforeCount = taskData.computeProviders.length
        taskData.computeProviders = taskData.computeProviders.filter(
          provider => provider.resourceNodeId !== sourceNode.id
        )

        if (taskData.computeProviders.length < beforeCount) {
          logger.info('[FlowCanvas] Compute provider removed from task on edge deletion (test)', {
            resourceNodeId: sourceNode.id,
            targetTaskId: targetNode.id,
            removedCount: beforeCount - taskData.computeProviders.length,
            remainingCount: taskData.computeProviders.length
          })
        }
      }

      // 删除算力资源节点
      setNodes(nodes.value.filter(n => n.id !== sourceNode.id))

      logger.info('[FlowCanvas] Auto-deleted compute resource node on edge removal (test)', {
        computeNodeId: sourceNode.id,
        parentTaskId: targetNode.id
      })
    }

    // 情况4: 从计算任务到输出节点的连接 - 删除输出节点
    if (sourceData.category === NodeCategory.COMPUTE_TASK &&
        targetData.category === NodeCategory.OUTPUT_DATA) {
      // 删除输出节点
      setNodes(nodes.value.filter(n => n.id !== targetNode.id))

      // 从父任务的 outputs 数组中移除该输出配置
      const sourceTaskData = sourceData as ComputeTaskNodeData
      if (sourceTaskData.outputs) {
        sourceTaskData.outputs = sourceTaskData.outputs.filter(
          output => output.outputNodeId !== targetNode.id
        )
        logger.info('[FlowCanvas] Auto-deleted output node on edge removal (test)', {
          outputNodeId: targetNode.id,
          parentTaskId: sourceNode.id
        })
      }
    }
  }

  // 从 edges 数组中删除连接线
  setEdges(edges.value.filter(e => e.id !== edgeId))

  logger.info('[FlowCanvas] Test edge deleted', { edgeId })
}

/**
 * 处理测试用的节点选中事件
 */
function handleTestSelectNode(event: Event) {
  const customEvent = event as CustomEvent
  const { nodeId } = customEvent.detail

  logger.info('[FlowCanvas] test-select-node event received', { nodeId })

  // 找到要选中的节点
  const nodeToSelect = nodes.value.find(n => n.id === nodeId)
  if (!nodeToSelect) {
    logger.warn('[FlowCanvas] Node not found for selection', { nodeId })
    return
  }

  // 手动设置选中状态
  setNodes(nodes.value.map(n => ({
    ...n,
    selected: n.id === nodeId
  })))

  // 发出节点选中事件
  emit('node-selected', nodeToSelect)
}

// 生命周期：注册全局事件监听器
onMounted(() => {
  document.addEventListener('add-output', handleAddOutput)
  document.addEventListener('add-model', handleAddModel)
  document.addEventListener('add-compute', handleAddCompute)
  document.addEventListener('edit-local-query', handleEditLocalQuery)
  document.addEventListener('add-fl-output', handleAddFLOutputEvent)
  document.addEventListener('add-fl-model-output', handleAddFLModelOutputEvent)
  // 监听 window 上的事件，与测试中的 window.dispatchEvent 匹配
  window.addEventListener('create-test-node', handleCreateTestNode)
  window.addEventListener('create-test-task-with-output', handleCreateTestTaskWithOutput)
  window.addEventListener('create-test-task-with-model', handleCreateTestTaskWithModel)
  window.addEventListener('create-test-task-with-compute', handleCreateTestTaskWithCompute)
  window.addEventListener('create-test-task-node', handleCreateTestTaskNode)
  window.addEventListener('create-test-compute-resource-node', handleCreateTestComputeResourceNode)
  window.addEventListener('create-test-connection', handleCreateTestConnection)
  window.addEventListener('open-expression-editor', handleOpenExpressionEditor)
  window.addEventListener('test-drop-model', handleTestDropModel)
  window.addEventListener('test-drop-compute', handleTestDropCompute)
  window.addEventListener('test-delete-node', handleTestDeleteNode)
  window.addEventListener('test-delete-edge', handleTestDeleteEdge)
  window.addEventListener('test-select-node', handleTestSelectNode)
})

onUnmounted(() => {
  document.removeEventListener('add-output', handleAddOutput)
  document.removeEventListener('add-model', handleAddModel)
  document.removeEventListener('add-compute', handleAddCompute)
  document.removeEventListener('edit-local-query', handleEditLocalQuery)
  document.removeEventListener('add-fl-output', handleAddFLOutputEvent)
  document.removeEventListener('add-fl-model-output', handleAddFLModelOutputEvent)
  window.removeEventListener('create-test-node', handleCreateTestNode)
  window.removeEventListener('create-test-task-with-output', handleCreateTestTaskWithOutput)
  window.removeEventListener('create-test-task-with-model', handleCreateTestTaskWithModel)
  window.removeEventListener('create-test-task-with-compute', handleCreateTestTaskWithCompute)
  window.removeEventListener('create-test-task-node', handleCreateTestTaskNode)
  window.removeEventListener('create-test-compute-resource-node', handleCreateTestComputeResourceNode)
  window.removeEventListener('create-test-connection', handleCreateTestConnection)
  window.removeEventListener('open-expression-editor', handleOpenExpressionEditor)
  window.removeEventListener('test-drop-model', handleTestDropModel)
  window.removeEventListener('test-drop-compute', handleTestDropCompute)
  window.removeEventListener('test-delete-node', handleTestDeleteNode)
  window.removeEventListener('test-delete-edge', handleTestDeleteEdge)
  window.removeEventListener('test-select-node', handleTestSelectNode)
})
</script>

<style scoped lang="scss">
.flow-canvas {
  width: 100%;
  height: 100%;
  background-color: #ffffff;
  overflow: hidden;
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

// 选中节点样式 - 移除 outline，由节点组件内部的 border 表示选中状态
:deep(.vue-flow__node.selected) {
  outline: none;
}

// 移除节点焦点时的默认 outline
:deep(.vue-flow__node:focus),
:deep(.vue-flow__node:focus-visible) {
  outline: none;
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

// 错误提示 Toast 样式
.error-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: rgba(255, 77, 79, 0.95);
  color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.3);
  font-size: 14px;
  max-width: 500px;

  .toast-icon {
    font-size: 18px;
  }

  .toast-message {
    flex: 1;
    line-height: 1.4;
  }

  .toast-close {
    background: transparent;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
    padding: 0 5px;
    opacity: 0.8;
    transition: opacity 0.2s;

    &:hover {
      opacity: 1;
    }
  }
}

// Toast 动画
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}
</style>
