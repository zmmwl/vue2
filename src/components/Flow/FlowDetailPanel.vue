<template>
  <div class="flow-detail-panel" :style="{ width: panelWidth + 'px' }" data-testid="flow-detail-panel">
    <!-- 头部 -->
    <div class="detail-header">
      <div class="header-left">
        <h3 class="detail-title">{{ viewMode === 'detail' ? '节点详情' : 'JSON预览' }}</h3>
      </div>
      <div class="header-right">
        <!-- 视图切换按钮 -->
        <div class="view-toggle">
          <button
            class="toggle-button"
            :class="{ active: viewMode === 'detail' }"
            @click="handleViewModeChange('detail')"
          >
            节点详情
          </button>
          <button
            class="toggle-button"
            :class="{ active: viewMode === 'preview' }"
            @click="handleViewModeChange('preview')"
          >
            JSON预览
          </button>
        </div>
        <button
          v-if="viewMode === 'detail' && selectedNode && isDataSourceNode && isConfigured"
          class="edit-button"
          @click="handleEdit"
          aria-label="编辑配置"
        >
          重新配置
        </button>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="detail-content">
      <!-- JSON预览模式 -->
      <template v-if="viewMode === 'preview'">
        <JsonPreviewPanel :json="exportJson" />
      </template>

      <!-- 节点详情模式 -->
      <!-- 未选中节点 -->
      <div v-if="!selectedNode" class="empty-state">
        <div class="empty-icon">📋</div>
        <p>请选择一个节点查看详情</p>
      </div>

      <!-- 数据源节点 - 未配置 -->
      <div v-else-if="isDataSourceNode && !isConfigured" class="empty-state">
        <div class="empty-icon">⚠️</div>
        <p>该节点尚未配置数据资产</p>
        <button class="btn btn-primary" @click="handleEdit">
          立即配置
        </button>
      </div>

      <!-- 数据源节点 - 已配置 -->
      <div v-else-if="isDataSourceNode && isConfigured" class="detail-info">
        <!-- 基本信息 -->
        <div class="info-section">
          <h4 class="section-title">基本信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">资产名称</span>
              <span class="info-value">{{ assetInfo?.assetName || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">资产编号</span>
              <span class="info-value">{{ assetInfo?.assetNumber || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">所属企业</span>
              <span class="info-value">{{ assetInfo?.participantId ? getEnterpriseDisplayName(assetInfo.participantId) : (assetInfo?.entityName || '-') }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">数据规模</span>
              <span class="info-value">{{ assetInfo?.scale || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">更新周期</span>
              <span class="info-value">{{ assetInfo?.cycle || '-' }}</span>
            </div>
            <div class="info-item full-width">
              <span class="info-label">资产描述</span>
              <span class="info-value">{{ assetInfo?.intro || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- 数据库信息 -->
        <div class="info-section">
          <h4 class="section-title">数据库信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">数据库名</span>
              <span class="info-value">{{ dataInfo?.databaseName || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">表名</span>
              <span class="info-value">{{ dataInfo?.tableName || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- 已选字段 -->
        <div class="info-section">
          <h4 class="section-title">
            已选字段
            <span class="field-count">({{ selectedFields?.length || 0 }})</span>
          </h4>
          <div class="field-list">
            <div
              v-for="field in selectedFieldList"
              :key="field.name"
              class="field-item"
            >
              <div class="field-name">{{ field.name }}</div>
              <div class="field-type">{{ field.dataType }}</div>
              <div v-if="field.isPrimaryKey" class="field-tag primary-key">主键</div>
              <div v-if="field.privacyQuery" class="field-tag privacy">隐私</div>
            </div>
            <div v-if="!selectedFieldList || selectedFieldList.length === 0" class="empty-fields">
              未选择任何字段
            </div>
          </div>
        </div>
      </div>

      <!-- 计算任务节点 -->
      <div v-else-if="isComputeTaskNode" class="detail-info">
        <!-- 任务基本信息 -->
        <div class="info-section">
          <h4 class="section-title">任务信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">任务名称</span>
              <span class="info-value">{{ selectedNode?.data?.label || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">计算类型</span>
              <span class="info-value">{{ taskTypeLabel || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">技术路径</span>
              <span class="info-value">{{ techPathLabel || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- 输入数据 -->
        <CollapsibleSection title="输入数据" :count="inputProvidersCount">
          <div v-if="!inputProviders || inputProviders.length === 0" class="empty-inputs">
            <div class="empty-icon">📊</div>
            <p>暂无输入数据</p>
            <p class="empty-hint">从数据源节点拖拽连线到此任务</p>
          </div>
          <div v-else class="input-providers-list">
            <div
              v-for="(provider, index) in inputProviders"
              :key="index"
              class="provider-card"
            >
              <div class="provider-header">
                <span class="provider-index">{{ index + 1 }}</span>
                <span class="provider-name">{{ getEnterpriseDisplayName(provider.participantId) }}</span>
                <span class="provider-dataset">{{ provider.dataset }}</span>
              </div>
              <div class="provider-fields">
                <div class="fields-header">
                  <span>字段 ({{ provider.fields.length }})</span>
                </div>
                <div class="fields-list">
                  <div
                    v-for="field in provider.fields"
                    :key="field.columnName"
                    class="field-chip"
                    :class="{ 'is-join': field.isJoinField }"
                  >
                    <span class="field-alias">{{ field.columnAlias || field.columnName }}</span>
                    <span v-if="field.isJoinField" class="join-badge">{{ field.joinType }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        <!-- Join 条件 -->
        <CollapsibleSection v-if="joinConditions && joinConditions.length > 0" title="Join 条件" :count="joinConditions.length">
          <div class="join-conditions-list">
            <div
              v-for="(condition, index) in joinConditions"
              :key="index"
              class="join-condition-card"
            >
              <div class="condition-type">{{ condition.joinType }}</div>
              <div class="condition-operands">
                <div
                  v-for="(operand, opIndex) in condition.operands"
                  :key="opIndex"
                  class="operand-item"
                >
                  <span class="operand-participant">{{ getEnterpriseDisplayName(operand.participantId) }}</span>
                  <span class="operand-dataset">{{ operand.dataset }}</span>
                  <span class="operand-fields">{{ operand.columnNames.join(', ') }}</span>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        <!-- 计算模型 -->
        <CollapsibleSection title="计算模型" :count="modelsCount">
          <div v-if="!models || models.length === 0" class="empty-inputs">
            <div class="empty-icon">📦</div>
            <p>暂无计算模型</p>
            <p class="empty-hint">从左侧拖拽模型到此任务</p>
          </div>
          <div v-else class="models-list">
            <div
              v-for="(model, index) in models"
              :key="index"
              class="model-card"
            >
              <div class="model-header">
                <span class="model-icon">📦</span>
                <span class="model-type">{{ modelTypeLabel(model) }}</span>
                <span class="model-participant">{{ getEnterpriseDisplayName(model.participantId) }}</span>
              </div>
              <div v-if="model.type === 'expression'" class="model-expression">
                {{ expressionPreview(model) }}
              </div>
              <div v-else class="model-params-content">
                <!-- 进度条组件 -->
                <ModelParamProgress
                  v-if="getModelProgressInfo(model)"
                  :progress-info="getModelProgressInfo(model)!"
                />

                <!-- 参数预览组件 -->
                <ModelParameterPreview
                  v-if="getModelSignatures(model.id)"
                  :signatures="getModelSignatures(model.id) || []"
                  :parameters="model.parameters || []"
                  :available-fields="getAvailableFieldsForModel()"
                />

                <!-- 配置按钮 -->
                <div class="model-params">
                  <span class="params-count">
                    {{ getModelParamCount(model.id) }} 个参数
                    <span v-if="hasUnconfiguredParams(model)" class="unconfigured-hint">
                      (未配置)
                    </span>
                  </span>
                  <button
                    class="config-params-btn"
                    @click="handleConfigParams(model)"
                    :title="'配置参数'"
                  >
                    ⚙️ 配置
                  </button>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        <!-- 算力资源 -->
        <CollapsibleSection title="算力资源" :count="computeProvidersCount">
          <div v-if="!computeProviders || computeProviders.length === 0" class="empty-inputs">
            <div class="empty-icon">⚡</div>
            <p>暂无算力资源</p>
            <p class="empty-hint">从左侧拖拽算力到此任务</p>
          </div>
          <div v-else class="compute-list">
            <div
              v-for="(compute, index) in computeProviders"
              :key="index"
              class="compute-card"
            >
              <div class="compute-header">
                <span class="compute-icon">⚡</span>
                <span class="compute-name">{{ compute.id }}</span>
                <span class="compute-participant">{{ getEnterpriseDisplayName(compute.participantId) }}</span>
              </div>
              <div class="compute-type">{{ compute.type }}</div>
            </div>
          </div>
        </CollapsibleSection>

        <!-- 输出数据 -->
        <CollapsibleSection title="输出数据" :count="outputsCount">
          <div v-if="!outputs || outputs.length === 0" class="empty-inputs">
            <div class="empty-icon">📤</div>
            <p>暂无输出配置</p>
            <p class="empty-hint">点击任务节点下方的"添加输出"按钮</p>
          </div>
          <div v-else class="outputs-list">
            <div
              v-for="(output, index) in outputs"
              :key="index"
              class="output-card"
            >
              <div class="output-header">
                <span class="output-index">{{ index + 1 }}</span>
                <span class="output-participant">{{ getEnterpriseDisplayName(output.participantId) }}</span>
              </div>
              <div class="output-dataset">{{ output.dataset }}</div>
              <div class="output-fields">
                <span class="fields-count">{{ output.outputFields?.length || 0 }} 个字段</span>
              </div>
            </div>
          </div>
        </CollapsibleSection>
      </div>

      <!-- 其他节点类型 -->
      <div v-else class="empty-state">
        <div class="empty-icon">ℹ️</div>
        <p>该节点类型暂不支持详情查看</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref, onMounted } from 'vue'
import type { Node } from '@vue-flow/core'
import type { NodeData, ComputeTaskNodeData, ModelParameterSignature, AvailableFieldOption } from '@/types/nodes'
import type { ExportJson } from '@/types/export'
import { NodeCategory, TechPath } from '@/types/nodes'
import { logger } from '@/utils/logger'
import { getEnterpriseList } from '@/services/enterpriseService'
import { getModelInputSignatures } from '@/services/model-mock-service'
import { generateAvailableFields, calculateParamProgress } from '@/utils/model-config-utils'
import CollapsibleSection from './CollapsibleSection.vue'
import JsonPreviewPanel from './JsonPreviewPanel.vue'
import ModelParamProgress from './ModelCard/ModelParamProgress.vue'
import ModelParameterPreview from './ModelCard/ModelParameterPreview.vue'

// 企业数据缓存
const enterpriseCache = ref<Map<string, { name: string; participantId: string }>>(new Map())

// 模型参数签名缓存
const modelSignaturesCache = ref<Map<string, ModelParameterSignature[]>>(new Map())

/**
 * 加载企业数据
 */
async function loadEnterprises() {
  try {
    const enterprises = await getEnterpriseList()
    enterpriseCache.value = new Map(
      enterprises.map(e => [e.participantId, { name: e.entityName, participantId: e.participantId }])
    )
  } catch (error) {
    logger.error('[FlowDetailPanel] Failed to load enterprises', error)
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadEnterprises()
})

/**
 * 加载模型参数签名
 * 在开始加载时就放入空数组占位符，确保响应式追踪
 */
async function loadModelSignatures(modelId: string) {
  // 如果已经缓存，直接返回
  if (modelSignaturesCache.value.has(modelId)) {
    logger.debug('[FlowDetailPanel] Model signatures cached', { modelId, count: modelSignaturesCache.value.get(modelId)!.length })
    return modelSignaturesCache.value.get(modelId)!
  }

  logger.debug('[FlowDetailPanel] Loading model signatures', { modelId })

  // 先放入空数组占位符，触发响应式更新
  modelSignaturesCache.value.set(modelId, [])

  try {
    const signatures = await getModelInputSignatures(modelId)
    // 加载完成后更新缓存
    modelSignaturesCache.value.set(modelId, signatures)
    logger.debug('[FlowDetailPanel] Model signatures loaded', { modelId, count: signatures.length })
    return signatures
  } catch (error) {
    logger.error('[FlowDetailPanel] Failed to load model signatures', { modelId, error })
    // 失败时保持空数组
    return []
  }
}

/**
 * 获取模型参数签名
 * 确保总是返回缓存中的引用，支持响应式更新
 */
function getModelSignatures(modelId: string): ModelParameterSignature[] {
  if (!modelId) {
    logger.warn('[FlowDetailPanel] getModelSignatures called with empty modelId')
    return []
  }

  if (!modelSignaturesCache.value.has(modelId)) {
    // 如果缓存中没有，立即创建空数组占位符
    modelSignaturesCache.value.set(modelId, [])
    logger.debug('[FlowDetailPanel] Created empty signature cache for modelId', { modelId })
  }

  const signatures = modelSignaturesCache.value.get(modelId)!
  logger.debug('[FlowDetailPanel] getModelSignatures', { modelId, count: signatures.length })
  return signatures
}

/**
 * 获取模型可用字段列表
 */
function getAvailableFieldsForModel(): AvailableFieldOption[] {
  if (!taskData.value) return []
  return generateAvailableFields(taskData.value)
}

/**
 * 获取模型配置进度信息
 */
function getModelProgressInfo(model: any) {
  if (model.type === 'expression') return undefined

  const signatures = getModelSignatures(model.id)
  if (!signatures || signatures.length === 0) return undefined

  return calculateParamProgress(model.parameters || [], signatures)
}

/**
 * 获取模型参数总数（从签名中获取）
 */
function getModelParamCount(modelId: string): number {
  const signatures = getModelSignatures(modelId)
  logger.debug('[FlowDetailPanel] getModelParamCount', { modelId, count: signatures?.length || 0 })
  return signatures?.length || 0
}

interface Props {
  panelWidth?: number
  selectedNode: Node<NodeData> | null
  exportJson: ExportJson | null
  viewMode: 'detail' | 'preview'
}

interface Emits {
  (e: 'edit', nodeId: string): void
  (e: 'viewModeChange', mode: 'detail' | 'preview'): void
  (e: 'configParams', data: { modelId: string; modelConfig: any; taskId: string }): void
}

const props = withDefaults(defineProps<Props>(), {
  panelWidth: 400
})
const emit = defineEmits<Emits>()

// 判断是否为数据源节点
const isDataSourceNode = computed(() => {
  return props.selectedNode?.data?.category === NodeCategory.DATA_SOURCE
})

// 判断是否为计算任务节点
const isComputeTaskNode = computed(() => {
  return props.selectedNode?.data?.category === NodeCategory.COMPUTE_TASK
})

// 判断数据源节点是否已配置
const isConfigured = computed(() => {
  return !!(props.selectedNode?.data?.assetInfo && props.selectedNode?.data?.selectedFields)
})

// 获取资产信息
const assetInfo = computed(() => props.selectedNode?.data?.assetInfo)

// 获取数据集信息
const dataInfo = computed(() => props.selectedNode?.data?.assetInfo?.dataInfo)

// 获取已选字段名称列表
const selectedFields = computed(() => props.selectedNode?.data?.selectedFields)

// 获取已选字段详细信息
const selectedFieldList = computed(() => {
  if (!dataInfo.value || !selectedFields.value) {
    return []
  }

  const allFields = dataInfo.value.fieldList || []
  const selectedSet = new Set(selectedFields.value)

  return allFields.filter(field => selectedSet.has(field.name))
})

// 计算任务节点相关
const taskData = computed(() => {
  if (!isComputeTaskNode.value) return null
  return props.selectedNode?.data as ComputeTaskNodeData
})

// 任务类型标签
const taskTypeLabel = computed(() => {
  if (!taskData.value) return ''
  const typeMap: Record<string, string> = {
    'PSI': '隐私集合求交',
    'PIR': '隐私信息检索',
    'MPC': '多方安全计算',
    'FL': '联邦学习',
    'CONCAT': '结果拼接'
  }
  return typeMap[taskData.value.taskType || ''] || ''
})

// 技术路径标签
const techPathLabel = computed(() => {
  if (!taskData.value?.techPath) return ''
  return taskData.value.techPath === TechPath.TEE ? '硬件 TEE' : '软件密码学'
})

// 输入数据提供者列表
const inputProviders = computed(() => {
  return taskData.value?.inputProviders || []
})

// 输入数据提供者数量
const inputProvidersCount = computed(() => inputProviders.value.length)

// Join 条件列表
const joinConditions = computed(() => {
  return taskData.value?.joinConditions || []
})

// 计算模型列表
const models = computed(() => {
  return taskData.value?.models || []
})

// 计算模型数量
const modelsCount = computed(() => models.value.length)

// 算力资源列表
const computeProviders = computed(() => {
  return taskData.value?.computeProviders || []
})

// 算力资源数量
const computeProvidersCount = computed(() => computeProviders.value.length)

// 输出列表
const outputs = computed(() => {
  return taskData.value?.outputs || []
})

// 输出数量
const outputsCount = computed(() => outputs.value.length)

/**
 * 获取模型类型标签
 */
function modelTypeLabel(model: any): string {
  const typeMap: Record<string, string> = {
    'expression': '表达式',
    'CodeBin-V2': 'CodeBin-V2',
    'CodeBin-V3-1': 'CodeBin-V3.1',
    'CodeBin-V3-2': 'CodeBin-V3.2',
    'SPDZ': 'SPDZ'
  }
  return typeMap[model.type || ''] || model.type || '未知类型'
}

/**
 * 获取表达式预览
 */
function expressionPreview(model: any): string {
  const expr = model.expression || ''
  return expr.length > 50 ? expr.substring(0, 50) + '...' : expr
}

/**
 * 获取企业显示名称（同时显示企业名称和 participantId）
 */
function getEnterpriseDisplayName(participantId: string): string {
  if (!participantId) return '-'
  const enterprise = enterpriseCache.value.get(participantId)
  if (enterprise) {
    return `${enterprise.name} (${participantId})`
  }
  return participantId
}

// 处理编辑按钮点击
function handleEdit() {
  if (!props.selectedNode) return

  logger.info('[FlowDetailPanel] Edit clicked', { nodeId: props.selectedNode.id })
  emit('edit', props.selectedNode.id)
}

// 处理视图模式切换
function handleViewModeChange(mode: 'detail' | 'preview') {
  logger.info('[FlowDetailPanel] View mode change', { mode })
  emit('viewModeChange', mode)
}

/**
 * 判断模型是否有未配置的参数
 * 表达式模型无需配置参数
 */
function hasUnconfiguredParams(model: any): boolean {
  if (model.type === 'expression') return false
  // 如果参数为空，表示需要配置
  return !model.parameters || model.parameters.length === 0
}

/**
 * 处理配置参数
 */
function handleConfigParams(model: any) {
  if (!props.selectedNode) return

  logger.info('[FlowDetailPanel] Config params clicked', {
    modelId: model.id,
    taskId: props.selectedNode.id
  })

  emit('configParams', {
    modelId: model.id,
    modelConfig: model,
    taskId: props.selectedNode.id
  })
}

// 监听选中节点变化
watch(() => props.selectedNode, (node) => {
  if (node) {
    logger.debug('[FlowDetailPanel] Node selected', {
      nodeId: node.id,
      nodeType: node.data?.category,
      isConfigured: isConfigured.value
    })

    // 如果是计算任务节点，加载所有模型的参数签名
    if (isComputeTaskNode.value && taskData.value?.models) {
      logger.debug('[FlowDetailPanel] Loading signatures for models', {
        modelCount: taskData.value.models.length,
        models: taskData.value.models.map(m => ({ id: m.id, name: m.name, type: m.type }))
      })
      taskData.value.models.forEach(model => {
        if (model.type !== 'expression') {
          loadModelSignatures(model.id)
        }
      })
    }
  }
}, { immediate: true })
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

// 浮动动画
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.flow-detail-panel {
  width: var(--panel-width);
  height: 100%;
  background: var(--panel-bg);
  backdrop-filter: var(--panel-blur);
  -webkit-backdrop-filter: var(--panel-blur);
  border-left: 1px solid var(--glass-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(135deg,
    rgba(14, 165, 233, 0.05) 0%,
    rgba(255, 255, 255, 0.95) 100%
  );
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg,
      transparent 0%,
      var(--datasource-blue) 50%,
      transparent 100%
    );
    opacity: 0.3;
  }
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

// 视图切换按钮
.view-toggle {
  display: flex;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 8px;
  padding: 2px;
}

.toggle-button {
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  &.active {
    background: white;
    color: var(--datasource-blue);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  &:hover:not(.active) {
    color: var(--text-primary);
  }
}

.detail-title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--datasource-blue), #0284C7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.edit-button {
  padding: 8px 14px;
  border-radius: var(--button-sm-radius);
  font-size: 13px;
  font-weight: 500;
  background: linear-gradient(135deg, var(--datasource-blue), #0284C7);
  color: white;
  border: none;
  cursor: pointer;
  transition: var(--button-transition);
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.25);

  &:hover {
    background: linear-gradient(135deg, #0284C7, #0369A1);
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.35);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0) scale(0.98);
  }
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--panel-padding);
  background: var(--glass-bg);

  &::-webkit-scrollbar {
    width: 5px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.08);
    border-radius: 3px;

    &:hover {
      background: rgba(0, 0, 0, 0.12);
    }
  }
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
  animation: fadeIn 0.5s ease;
}

.empty-icon {
  font-size: 56px;
  margin-bottom: 20px;
  opacity: 0.7;
  animation: float 3s ease-in-out infinite;
}

.empty-state p {
  margin: 0 0 24px 0;
  color: var(--text-secondary);
  font-size: 14px;
}

// 按钮
.btn {
  padding: var(--button-md-padding);
  border-radius: var(--button-md-radius);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: var(--button-transition);

  &.btn-primary {
    background: linear-gradient(135deg, var(--datasource-blue), #0284C7);
    color: white;
    box-shadow: 0 2px 8px rgba(14, 165, 233, 0.25);

    &:hover {
      background: linear-gradient(135deg, #0284C7, #0369A1);
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.35);
      transform: translateY(-2px);
    }

    &:active {
      transform: translateY(0) scale(0.98);
    }
  }
}

// 详情信息
.detail-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: fadeIn 0.4s ease;
}

.info-section {
  background: var(--info-card-bg);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: var(--info-card-radius);
  padding: var(--info-card-padding);
  box-shadow: var(--shadow-card-sm);
  transition: all var(--transition-base) var(--easing-smooth);

  &:hover {
    box-shadow: var(--shadow-card-md);
    border-color: rgba(14, 165, 233, 0.1);
  }
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  &::before {
    content: '';
    width: 3px;
    height: 16px;
    background: linear-gradient(180deg, var(--datasource-blue), #38BDF8);
    border-radius: 2px;
  }

  .field-count {
    font-size: 12px;
    font-weight: 400;
    color: var(--text-secondary);
    padding: 2px 8px;
    background: rgba(0, 0, 0, 0.04);
    border-radius: var(--field-tag-radius);
  }
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &.full-width {
    grid-column: 1 / -1;
  }
}

.info-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.info-value {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
  word-break: break-word;
  line-height: 1.5;
}

// 字段列表
.field-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: var(--glass-bg);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  transition: all var(--transition-base) var(--easing-smooth);

  &:hover {
    background: var(--list-item-hover-bg);
    border-color: rgba(14, 165, 233, 0.2);
    transform: translateX(4px);
    box-shadow: 0 2px 8px rgba(14, 165, 233, 0.08);
  }
}

.field-name {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 600;
}

.field-type {
  font-size: 11px;
  color: var(--text-secondary);
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 4px;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-weight: 500;
}

.field-tag {
  font-size: 11px;
  padding: var(--field-tag-padding);
  border-radius: var(--field-tag-radius);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;

  &.primary-key {
    background: linear-gradient(135deg, #E6F7FF, #BAE7FF);
    color: #1890FF;
    border: 1px solid rgba(24, 144, 255, 0.2);
  }

  &.privacy {
    background: linear-gradient(135deg, #FFF1F0, #FFCCC7);
    color: #F5222D;
    border: 1px solid rgba(245, 34, 45, 0.2);
  }
}

.empty-fields {
  padding: 32px 20px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
  background: var(--info-card-bg);
  border-radius: var(--info-card-radius);
  border: 1px dashed rgba(0, 0, 0, 0.1);
}

// 空输入状态
.empty-inputs {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-secondary);

  .empty-icon {
    font-size: 48px;
    margin-bottom: 12px;
    opacity: 0.6;
  }

  p {
    margin: 8px 0;
    font-size: 14px;
  }

  .empty-hint {
    font-size: 12px;
    color: var(--text-secondary);
    opacity: 0.8;
  }
}

// 输入提供者列表
.input-providers-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.provider-card {
  background: var(--glass-bg);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  padding: 12px;
  transition: all var(--transition-base) var(--easing-smooth);

  &:hover {
    border-color: rgba(14, 165, 233, 0.2);
    box-shadow: 0 2px 8px rgba(14, 165, 233, 0.08);
  }
}

.provider-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  .provider-index {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--datasource-blue), #38BDF8);
    color: white;
    border-radius: 50%;
    font-size: 12px;
    font-weight: 600;
  }

  .provider-name {
    flex: 1;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .provider-dataset {
    font-size: 12px;
    color: var(--text-secondary);
    padding: 2px 8px;
    background: rgba(0, 0, 0, 0.04);
    border-radius: 4px;
  }
}

.provider-fields {
  .fields-header {
    font-size: 12px;
    color: var(--text-secondary);
    margin-bottom: 8px;
  }

  .fields-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .field-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    background: rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 6px;
    font-size: 12px;
    transition: all var(--transition-base) var(--easing-smooth);

    &:hover {
      background: rgba(14, 165, 233, 0.08);
      border-color: rgba(14, 165, 233, 0.2);
    }

    &.is-join {
      background: linear-gradient(135deg, #E6F7FF, #BAE7FF);
      border-color: rgba(24, 144, 255, 0.3);
    }

    .field-alias {
      font-weight: 500;
      color: var(--text-primary);
    }

    .join-badge {
      font-size: 10px;
      padding: 2px 6px;
      background: rgba(24, 144, 255, 0.2);
      color: #1890FF;
      border-radius: 4px;
      font-weight: 600;
    }
  }
}

// Join 条件列表
.join-conditions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.join-condition-card {
  background: var(--glass-bg);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  padding: 12px;
  transition: all var(--transition-base) var(--easing-smooth);

  &:hover {
    border-color: rgba(24, 144, 255, 0.2);
    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.08);
  }

  .condition-type {
    display: inline-block;
    padding: 4px 12px;
    background: linear-gradient(135deg, #E6F7FF, #BAE7FF);
    color: #1890FF;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 10px;
  }

  .condition-operands {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .operand-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.02);
    border-radius: 6px;
    font-size: 12px;

    .operand-participant {
      font-weight: 600;
      color: var(--text-primary);
    }

    .operand-dataset {
      color: var(--text-secondary);
    }

    .operand-fields {
      flex: 1;
      color: var(--text-secondary);
      font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
      font-size: 11px;
    }
  }
}

// 计算模型列表
.models-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.model-card {
  background: var(--glass-bg);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  padding: 12px;
  transition: all var(--transition-base) var(--easing-smooth);

  &:hover {
    border-color: rgba(139, 92, 246, 0.2);
    box-shadow: 0 2px 8px rgba(139, 92, 246, 0.08);
  }
}

.model-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  .model-icon {
    font-size: 18px;
  }

  .model-type {
    flex: 1;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .model-participant {
    font-size: 11px;
    color: var(--text-secondary);
    padding: 2px 8px;
    background: rgba(0, 0, 0, 0.04);
    border-radius: 4px;
  }
}

.model-expression {
  font-size: 11px;
  color: var(--text-secondary);
  font-family: 'Monaco', 'Menlo', monospace;
  background: rgba(0, 0, 0, 0.02);
  padding: 8px;
  border-radius: 4px;
  line-height: 1.4;
  word-break: break-all;
}

.model-params-content {
  // 为参数预览组件留出空间
  .model-params {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);

    .params-count {
      font-size: 11px;
      color: var(--text-secondary);
      font-weight: 500;
      flex: 1;

      .unconfigured-hint {
        color: #fa8c16;
        margin-left: 4px;
      }
    }

    .config-params-btn {
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 500;
      color: #1890ff;
      background: rgba(24, 144, 255, 0.06);
      border: 1px solid rgba(24, 144, 255, 0.2);
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(24, 144, 255, 0.1);
        border-color: rgba(24, 144, 255, 0.4);
      }
    }
  }
}

.model-params {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  .params-count {
    font-size: 11px;
    color: var(--text-secondary);
    font-weight: 500;
    flex: 1;

    .unconfigured-hint {
      color: #fa8c16;
      margin-left: 4px;
    }
  }

  .config-params-btn {
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 500;
    color: #1890ff;
    background: rgba(24, 144, 255, 0.06);
    border: 1px solid rgba(24, 144, 255, 0.2);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(24, 144, 255, 0.1);
      border-color: rgba(24, 144, 255, 0.4);
    }
  }
}

// 算力资源列表
.compute-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.compute-card {
  background: var(--glass-bg);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  padding: 12px;
  transition: all var(--transition-base) var(--easing-smooth);

  &:hover {
    border-color: rgba(250, 140, 22, 0.2);
    box-shadow: 0 2px 8px rgba(250, 140, 22, 0.08);
  }
}

.compute-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;

  .compute-icon {
    font-size: 18px;
  }

  .compute-name {
    flex: 1;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .compute-participant {
    font-size: 11px;
    color: var(--text-secondary);
    padding: 2px 8px;
    background: rgba(0, 0, 0, 0.04);
    border-radius: 4px;
  }
}

.compute-type {
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 500;
}

// 输出列表
.outputs-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.output-card {
  background: var(--glass-bg);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  padding: 12px;
  transition: all var(--transition-base) var(--easing-smooth);

  &:hover {
    border-color: rgba(82, 196, 26, 0.2);
    box-shadow: 0 2px 8px rgba(82, 196, 26, 0.08);
  }
}

.output-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;

  .output-index {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #52C41A, #389e0d);
    color: white;
    border-radius: 50%;
    font-size: 12px;
    font-weight: 600;
  }

  .output-participant {
    flex: 1;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
  }
}

.output-dataset {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.output-fields {
  .fields-count {
    font-size: 11px;
    color: var(--text-secondary);
    font-weight: 500;
  }
}
</style>
