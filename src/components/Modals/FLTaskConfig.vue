<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="handleClose">
      <div class="modal-content fl-config-modal">
        <div class="modal-header">
          <h3>{{ title }}</h3>
          <button class="close-btn" @click="handleClose">×</button>
        </div>

        <div class="modal-body">
          <!-- 任务信息 -->
          <div class="task-info">
            <span class="task-icon">{{ taskInfo?.icon || '⚙️' }}</span>
            <div class="task-meta">
              <div class="task-name">{{ taskInfo?.name || taskName }}</div>
              <div class="task-desc">{{ taskInfo?.description || '' }}</div>
            </div>
          </div>

          <!-- 子类型选择器 -->
          <div v-if="hasSubTypes" class="subtype-selector-section">
            <label class="section-label">任务子类型 <span class="required">*</span></label>
            <div class="subtype-options">
              <div
                v-for="subType in subTypes"
                :key="subType.value"
                class="subtype-option"
                :class="{ 'is-selected': selectedSubType === subType.value }"
                @click="handleSubTypeChange(subType.value)"
              >
                <div class="subtype-label">{{ subType.label }}</div>
                <div v-if="subType.description" class="subtype-desc">{{ subType.description }}</div>
              </div>
            </div>
          </div>

          <!-- 推断任务：已部署模型选择 -->
          <div v-if="isInference" class="model-selector-section">
            <label class="section-label">已部署模型</label>
            <!-- 模型已删除警告 -->
            <div v-if="modelDeleted" class="model-deleted-warning">
              <span class="warning-icon">⚠️</span>
              <span class="warning-text">原先选择的模型已被删除，请重新选择</span>
            </div>
            <div v-if="!selectedModel" class="model-selector-hint" @click="showModelSelector = true">
              <span class="hint-icon">🔗</span>
              <span>点击选择已部署的模型</span>
            </div>
            <div v-else class="selected-model">
              <span class="model-name">{{ selectedModel.modelName }}</span>
              <span class="model-id">{{ selectedModel.modelId }}</span>
              <button class="change-model-btn" @click="showModelSelector = true">更换</button>
            </div>
          </div>

          <!-- 参数配置 - 只有在没有子类型或已选择子类型时才显示 -->
          <div v-if="(!hasSubTypes || selectedSubType) && parameters.length > 0" class="parameters-section">
            <label class="section-label">参数配置</label>
            <div class="parameter-list">
              <ParameterInput
                v-for="param in parameters"
                :key="param.name"
                :parameter="param"
                :value="paramValues[param.name]"
                @update:value="updateParam(param.name, $event)"
              />
            </div>
          </div>

          <!-- 有子类型但未选择时的提示 -->
          <div v-else-if="hasSubTypes && !selectedSubType && !isLoadingParams" class="select-subtype-hint">
            <span>请先选择任务子类型</span>
          </div>

          <!-- 无参数提示 -->
          <div v-else-if="!hasSubTypes && parameters.length === 0 && !isLoadingParams" class="no-params-hint">
            <span>该任务无需配置额外参数</span>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="handleClose">取消</button>
          <button class="btn-confirm" @click="handleConfirm" :disabled="!canConfirm">
            确认
          </button>
        </div>

        <!-- 已部署模型选择器弹窗 -->
        <DeployedModelSelector
          v-model="showModelSelector"
          :model-type-filter="modelTypeFilter"
          @select="handleModelSelect"
        />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import ParameterInput from './ParameterInput.vue'
import DeployedModelSelector from './DeployedModelSelector.vue'
import type { FLTaskNodeData, DeployedModel } from '@/types/nodes'
import type { FLTaskParameterDef, FLTaskSubType } from '@/types/fl-tasks'
import { FLMode, FLTaskCategory } from '@/types/fl-tasks'
import { getFLTaskInfo } from '@/utils/fl-task-templates'
import { getParametersForTask, getSubTypesForTask, DEPLOYED_MODELS } from '@/utils/mock-fl-data'

const props = defineProps<{
  modelValue: boolean
  initialData?: FLTaskNodeData
  taskName?: string
  flMode?: FLMode
  flCategory?: FLTaskCategory
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', data: Partial<FLTaskNodeData>): void
}>()

// 任务信息
const taskInfo = computed(() => {
  const name = props.taskName || props.initialData?.taskName
  if (!name) return null
  return getFLTaskInfo(name)
})

// 标题
const title = computed(() => {
  const mode = props.flMode || props.initialData?.flMode || FLMode.TRAINING
  const modeText = mode === FLMode.TRAINING ? '训练' : '推断'
  const categoryText = getCategoryLabel(props.flCategory || props.initialData?.flCategory)
  return `配置${categoryText}${modeText}任务`
})

// 是否是推断模式
const isInference = computed(() => {
  return (props.flMode || props.initialData?.flMode) === FLMode.INFERENCE
})

// 模型类型过滤
const modelTypeFilter = computed(() => {
  const category = props.flCategory || props.initialData?.flCategory
  if (category === FLTaskCategory.HORIZONTAL_MODEL) return 'horizontal'
  if (category === FLTaskCategory.VERTICAL_MODEL) return 'vertical'
  return undefined
})

// 子类型相关
const subTypes = ref<FLTaskSubType[]>([])
const selectedSubType = ref<string>('')
const hasSubTypes = computed(() => subTypes.value.length > 0)
const selectedSubTypeInfo = computed(() => {
  if (!selectedSubType.value) return null
  return subTypes.value.find(s => s.value === selectedSubType.value)
})

// 参数列表
const parameters = ref<FLTaskParameterDef[]>([])
const isLoadingParams = ref(false)

// 参数值
const paramValues = ref<Record<string, any>>({})

// 已部署模型选择
const showModelSelector = ref(false)
const selectedModel = ref<DeployedModel | null>(null)
const modelDeleted = ref(false)  // 标记原先选择的模型是否已被删除

// 是否可以确认
const canConfirm = computed(() => {
  // 有子类型时必须选择子类型
  if (hasSubTypes.value && !selectedSubType.value) {
    return false
  }
  if (isInference.value && !selectedModel.value) {
    return false
  }
  // 检查必填参数
  for (const param of parameters.value) {
    if (param.required && (paramValues.value[param.name] === undefined || paramValues.value[param.name] === '')) {
      return false
    }
  }
  return true
})

// 获取类别标签
function getCategoryLabel(category?: FLTaskCategory): string {
  switch (category) {
    case FLTaskCategory.PREPROCESS: return '预处理'
    case FLTaskCategory.FEATURE_ENGINEERING: return '特征工程'
    case FLTaskCategory.HORIZONTAL_MODEL: return '横向模型'
    case FLTaskCategory.VERTICAL_MODEL: return '纵向模型'
    default: return '联邦学习'
  }
}

// 更新参数值
function updateParam(name: string, value: any) {
  paramValues.value[name] = value
}

// 处理模型选择
function handleModelSelect(model: DeployedModel) {
  selectedModel.value = model
  showModelSelector.value = false
}

// 处理确认
function handleConfirm() {
  const data: Partial<FLTaskNodeData> = {
    taskName: props.taskName || props.initialData?.taskName,
    taskDisplayName: taskInfo.value?.name,
    parameters: { ...paramValues.value }
  }

  // 保存子类型
  if (selectedSubType.value) {
    data.subType = selectedSubType.value
    data.subTypeLabel = selectedSubTypeInfo.value?.label
  }

  if (isInference.value && selectedModel.value) {
    data.deployedModelId = selectedModel.value.modelId
    data.deployedModelName = selectedModel.value.modelName
    data.trainingParticipants = selectedModel.value.participants
  }

  emit('confirm', data)
  emit('update:modelValue', false)
}

// 处理关闭
function handleClose() {
  emit('update:modelValue', false)
}

// 加载子类型和参数模板
async function loadParameters() {
  const taskName = props.taskName || props.initialData?.taskName
  if (!taskName) return

  isLoadingParams.value = true
  try {
    // 获取子类型列表
    const taskSubTypes = getSubTypesForTask(taskName)
    subTypes.value = taskSubTypes

    // 恢复已选择的子类型
    const initialSubType = props.initialData?.subType || ''
    if (initialSubType && taskSubTypes.some(s => s.value === initialSubType)) {
      selectedSubType.value = initialSubType
    } else if (taskSubTypes.length > 0) {
      // 默认不选择，让用户主动选择
      selectedSubType.value = ''
    }

    // 加载参数（如果有子类型且已选择子类型，则加载子类型参数）
    loadParametersForSubType(selectedSubType.value)
  } finally {
    isLoadingParams.value = false
  }
}

// 根据子类型加载参数
function loadParametersForSubType(subType: string) {
  const taskName = props.taskName || props.initialData?.taskName
  if (!taskName) return

  // 从 mock 数据获取参数模板
  const params = getParametersForTask(taskName, subType || undefined)
  parameters.value = params

  // 初始化参数值
  const initialValues: Record<string, any> = {}
  for (const param of params) {
    if (props.initialData?.parameters?.[param.name] !== undefined) {
      initialValues[param.name] = props.initialData.parameters[param.name]
    } else if (param.defaultValue !== undefined) {
      initialValues[param.name] = param.defaultValue
    }
  }
  paramValues.value = initialValues
}

// 处理子类型变更
function handleSubTypeChange(subType: string) {
  selectedSubType.value = subType
  // 子类型变更时重新加载参数
  loadParametersForSubType(subType)
}

// 初始化
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    // 重置状态
    subTypes.value = []
    selectedSubType.value = ''
    parameters.value = []
    paramValues.value = {}
    modelDeleted.value = false

    loadParameters()

    // 从已有数据恢复选择的模型
    if (props.initialData?.deployedModelId && props.initialData?.deployedModelName) {
      // 检查模型是否仍然存在
      const existingModel = DEPLOYED_MODELS.find(m => m.modelId === props.initialData?.deployedModelId)
      if (existingModel) {
        selectedModel.value = existingModel
      } else {
        // 模型已被删除，显示警告
        modelDeleted.value = true
        selectedModel.value = null
      }
    } else {
      selectedModel.value = null
    }
  }
}, { immediate: true })
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.fl-config-modal {
  width: 520px;
  max-width: 90vw;
  max-height: 80vh;
  background: var(--bg-secondary);
  border-radius: var(--dialog-border-radius);
  box-shadow: var(--shadow-dialog-overlay);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--dialog-header-padding);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .close-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    font-size: 20px;
    color: var(--text-secondary);
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: var(--transition-fast);

    &:hover {
      background: rgba(0, 0, 0, 0.06);
      color: var(--text-primary);
    }
  }
}

.modal-body {
  flex: 1;
  padding: var(--dialog-body-padding);
  overflow-y: auto;
}

.task-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: var(--radius-sm);
  margin-bottom: 20px;

  .task-icon {
    font-size: 24px;
  }

  .task-meta {
    flex: 1;

    .task-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 4px;
    }

    .task-desc {
      font-size: 12px;
      color: var(--text-secondary);
    }
  }
}

.section-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;

  .required {
    color: #ff4d4f;
  }
}

.subtype-selector-section {
  margin-bottom: 20px;
}

.subtype-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.subtype-option {
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);

  &:hover {
    background: rgba(0, 0, 0, 0.04);
    border-color: var(--color-primary);
  }

  &.is-selected {
    background: rgba(24, 144, 255, 0.08);
    border-color: var(--color-primary);

    .subtype-label {
      color: var(--color-primary);
      font-weight: 600;
    }
  }

  .subtype-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
  }

  .subtype-desc {
    font-size: 11px;
    color: var(--text-secondary);
    margin-top: 4px;
  }
}

.select-subtype-hint {
  text-align: center;
  padding: 24px;
  color: var(--text-secondary);
  font-size: 13px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: var(--radius-sm);
}

.model-selector-section {
  margin-bottom: 20px;
}

.model-selector-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.02);
  border: 1px dashed rgba(0, 0, 0, 0.15);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);

  &:hover {
    background: rgba(0, 0, 0, 0.04);
    border-color: var(--color-primary);
  }

  .hint-icon {
    font-size: 16px;
  }
}

.model-deleted-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(250, 173, 20, 0.1);
  border: 1px solid rgba(250, 173, 20, 0.3);
  border-radius: var(--radius-sm);
  margin-bottom: 10px;

  .warning-icon {
    font-size: 16px;
  }

  .warning-text {
    font-size: 12px;
    color: #d48806;
    font-weight: 500;
  }
}

.selected-model {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(82, 196, 26, 0.08);
  border: 1px solid rgba(82, 196, 26, 0.2);
  border-radius: var(--radius-sm);

  .model-name {
    flex: 1;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
  }

  .model-id {
    font-size: 11px;
    color: var(--text-secondary);
    font-family: monospace;
  }

  .change-model-btn {
    padding: 4px 10px;
    border: 1px solid var(--border-color);
    background: transparent;
    color: var(--text-secondary);
    font-size: 12px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: var(--transition-fast);

    &:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }
  }
}

.parameters-section {
  margin-bottom: 20px;
}

.parameter-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.no-params-hint {
  text-align: center;
  padding: 24px;
  color: var(--text-secondary);
  font-size: 13px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: var(--dialog-footer-padding);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.btn-cancel,
.btn-confirm {
  padding: var(--button-sm-padding);
  border-radius: var(--button-sm-radius);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--button-transition);
}

.btn-cancel {
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-primary);

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
}

.btn-confirm {
  border: none;
  background: var(--color-primary);
  color: white;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
