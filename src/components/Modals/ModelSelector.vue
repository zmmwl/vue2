<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click="onCancel">
        <div class="modal-container model-selector-modal" @click.stop>
          <!-- 标题栏 -->
          <div class="modal-header">
            <h3 class="modal-title">配置计算模型</h3>
            <button class="modal-close" @click="onCancel" aria-label="关闭">
              <span>✕</span>
            </button>
          </div>

          <!-- 内容区 -->
          <div class="modal-body">
            <!-- MPC模型(表达式) -->
            <div v-if="modelType === 'expression'" class="expression-mode">
              <div class="expression-info">
                <div class="info-icon">📝</div>
                <div class="info-text">
                  <p class="info-title">MPC 模型(表达式)</p>
                  <p class="info-desc">使用 Python 表达式编写计算逻辑</p>
                </div>
              </div>

              <!-- 可用变量提示 -->
              <div v-if="availableVariables.length > 0" class="variables-section">
                <h4 class="variables-title">可用变量</h4>
                <div class="variables-list">
                  <span
                    v-for="v in availableVariables"
                    :key="v"
                    class="variable-chip"
                  >
                    {{ v }}
                  </span>
                </div>
              </div>

              <!-- 表达式编辑器 -->
              <div class="expression-editor">
                <textarea
                  v-model="expression"
                  class="expression-textarea"
                  placeholder="输入 Python 表达式，例如: input1.col_int * input2.col_int"
                  @input="onExpressionChange"
                ></textarea>
              </div>

              <!-- 表达式预览 -->
              <div v-if="expression" class="expression-preview">
                <span class="preview-label">表达式:</span>
                <code class="preview-code">{{ expression }}</code>
              </div>
            </div>

            <!-- 其他模型类型 -->
            <div v-else class="model-select-mode">
              <p class="model-type-label">模型类型: <strong>{{ modelTypeLabel }}</strong></p>

              <!-- 企业选择 -->
              <div class="select-section">
                <label class="select-label">选择企业</label>
                <div class="enterprise-list">
                  <div
                    v-for="enterprise in sortedEnterprises"
                    :key="enterprise.id"
                    class="enterprise-option"
                    :class="{ selected: selectedEnterpriseId === enterprise.id }"
                    @click="onSelectEnterprise(enterprise.id)"
                  >
                    <div class="enterprise-radio">
                      <input
                        type="radio"
                        :name="'enterprise'"
                        :value="enterprise.id"
                        v-model="selectedEnterpriseId"
                      />
                    </div>
                    <div class="enterprise-info">
                      <div class="enterprise-name">{{ enterprise.name }}</div>
                      <div class="enterprise-type">{{ getResourceTypeLabel(enterprise.resourceType) }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 模型选择 -->
              <div v-if="selectedEnterpriseId" class="select-section">
                <label class="select-label">选择模型</label>
                <div class="model-list">
                  <div
                    v-for="model in availableModels"
                    :key="model.modelId"
                    class="model-option"
                    :class="{ selected: selectedModelId === model.modelId }"
                    @click="onSelectModel(model.modelId)"
                  >
                    <div class="model-radio">
                      <input
                        type="radio"
                        :name="'model'"
                        :value="model.modelId"
                        v-model="selectedModelId"
                      />
                    </div>
                    <div class="model-info">
                      <div class="model-name">{{ model.name }}</div>
                      <div class="model-id">{{ model.modelId }}</div>
                    </div>
                  </div>
                </div>
                <div v-if="availableModels.length === 0" class="empty-models">
                  该企业暂无可用模型
                </div>
              </div>

              <!-- 模型参数配置 -->
              <div v-if="selectedModel" class="params-section">
                <h4 class="params-title">模型参数配置</h4>
                <div class="params-list">
                  <div
                    v-for="param in modelParameters"
                    :key="param.name"
                    class="param-item"
                  >
                    <span class="param-name">{{ param.name }}</span>
                    <select
                      v-model="param.bindingType"
                      class="param-type-select"
                    >
                      <option value="field">字段绑定</option>
                      <option value="fixed">固定值</option>
                    </select>
                    <input
                      v-if="param.bindingType === 'field'"
                      v-model="param.fieldRef"
                      class="param-input"
                      placeholder="字段引用，如: input1.col_int"
                    />
                    <input
                      v-else
                      v-model="param.fixedValue"
                      class="param-input"
                      placeholder="输入固定值"
                    />
                  </div>
                </div>
                <div v-if="modelParameters.length === 0" class="empty-params">
                  该模型无需配置参数
                </div>
              </div>
            </div>
          </div>

          <!-- 底部按钮 -->
          <div class="modal-footer">
            <button class="btn btn-cancel" @click="onCancel">
              取消
            </button>
            <button
              class="btn btn-confirm"
              :disabled="!canConfirm"
              @click="onConfirm"
            >
              确认
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { EnterpriseOption } from '@/types/contracts'

interface ModelParameter {
  name: string
  bindingType: 'field' | 'fixed'
  fieldRef?: string
  fixedValue?: string
}

interface ComputeModel {
  modelId: string
  participantId: string
  name: string
  type: string
  parameters?: ModelParameter[]
}

interface ModelConfig {
  modelType: string
  participantId?: string
  modelId?: string
  expression?: string
  parameters?: ModelParameter[]
}

interface Props {
  visible: boolean
  modelType: string
  recommendedEnterprises?: EnterpriseOption[]
  availableModels?: ComputeModel[]
  availableVariables?: string[]
  initialConfig?: ModelConfig
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', config: ModelConfig): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  recommendedEnterprises: () => [],
  availableModels: () => [],
  availableVariables: () => [],
  initialConfig: undefined
})

const emit = defineEmits<Emits>()

// 选中的企业 ID
const selectedEnterpriseId = ref<string>('')

// 选中的模型 ID
const selectedModelId = ref<string>('')

// 表达式内容
const expression = ref<string>('')

// 模型参数列表
const modelParameters = ref<ModelParameter[]>([])

// 企业排序（按资源类型优先级）
const sortedEnterprises = computed(() => {
  return [...props.recommendedEnterprises].sort((a, b) => {
    const weightDiff = (b.resourceType ?? 0) - (a.resourceType ?? 0)
    if (weightDiff !== 0) return weightDiff
    return a.name.localeCompare(b.name, 'zh-CN')
  })
})

// 可用模型列表
const availableModels = computed(() => {
  if (!selectedEnterpriseId.value) return []
  return props.availableModels.filter(m => m.participantId === selectedEnterpriseId.value)
})

// 选中的模型
const selectedModel = computed(() => {
  if (!selectedModelId.value) return null
  return availableModels.value.find(m => m.modelId === selectedModelId.value)
})

// 模型类型标签
const modelTypeLabel = computed(() => {
  const labels: Record<string, string> = {
    'expression': 'MPC模型(表达式)',
    'CodeBin-V2': 'CodeBin-V2',
    'CodeBin-V3-1': 'CodeBin-V3-1',
    'CodeBin-V3-2': 'CodeBin-V3-2',
    'SPDZ': 'SPDZ'
  }
  return labels[props.modelType] || props.modelType
})

// 获取资源类型标签
function getResourceTypeLabel(type: number): string {
  const labels: Record<number, string> = {
    3: '模型资源',
    2: '模型资源',
    1: '算力资源',
    0: '其他'
  }
  return labels[type] || '未知'
}

// 是否可以确认
const canConfirm = computed(() => {
  if (props.modelType === 'expression') {
    return expression.value.trim().length > 0
  }
  return !!selectedModelId.value
})

// 选择企业
function onSelectEnterprise(id: string) {
  selectedEnterpriseId.value = id
  selectedModelId.value = ''
  modelParameters.value = []
}

// 选择模型
function onSelectModel(modelId: string) {
  selectedModelId.value = modelId
  initModelParameters()
}

// 初始化模型参数
function initModelParameters() {
  const model = selectedModel.value
  if (!model?.parameters) {
    modelParameters.value = []
    return
  }

  modelParameters.value = model.parameters.map(param => ({
    name: param.name,
    bindingType: 'field',
    fieldRef: '',
    fixedValue: param.fixedValue || ''
  }))
}

// 表达式变化
function onExpressionChange() {
  // 表达式验证逻辑可以后续添加
}

// 确认
function onConfirm() {
  const config: ModelConfig = {
    modelType: props.modelType,
    expression: expression.value || undefined,
    participantId: selectedEnterpriseId.value,
    modelId: selectedModelId.value,
    parameters: modelParameters.value.length > 0 ? modelParameters.value : undefined
  }

  emit('confirm', config)
  emit('update:visible', false)
}

// 取消
function onCancel() {
  emit('cancel')
  emit('update:visible', false)
}

// 重置状态
function reset() {
  selectedEnterpriseId.value = ''
  selectedModelId.value = ''
  expression.value = ''
  modelParameters.value = []
}

// 监听 visible 变化
watch(() => props.visible, (visible) => {
  if (visible) {
    reset()
    // 如果有初始配置，加载初始配置
    if (props.initialConfig) {
      if (props.modelType === 'expression') {
        expression.value = props.initialConfig.expression || ''
      } else {
        selectedEnterpriseId.value = props.initialConfig.participantId || ''
        selectedModelId.value = props.initialConfig.modelId || ''
        if (selectedModelId.value) {
          initModelParameters()
        }
      }
    }
  }
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-container {
  width: 100%;
  max-width: 600px;
  max-height: 85vh;
  background: var(--panel-bg);
  backdrop-filter: var(--panel-blur);
  border-radius: 16px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--glass-border);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: translateY(-20px) scale(0.95);
  opacity: 0;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 18px;
  transition: var(--button-transition);

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: var(--text-primary);
  }
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;

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

// 表达式模式
.expression-mode {
  .expression-info {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px;
    background: rgba(19, 194, 194, 0.05);
    border: 1px solid rgba(19, 194, 194, 0.2);
    border-radius: 10px;
    margin-bottom: 20px;
  }

  .info-icon {
    font-size: 32px;
  }

  .info-text {
    flex: 1;

    .info-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 4px 0;
    }

    .info-desc {
      font-size: 13px;
      color: var(--text-secondary);
      margin: 0;
    }
  }

  .variables-section {
    margin-bottom: 16px;
  }

  .variables-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 8px;
  }

  .variables-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .variable-chip {
    padding: 4px 10px;
    background: rgba(19, 194, 194, 0.1);
    border: 1px solid rgba(19, 194, 194, 0.2);
    border-radius: 4px;
    font-size: 12px;
    color: #13C2C2;
    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  }

  .expression-editor {
    margin-bottom: 16px;
  }

  .expression-textarea {
    width: 100%;
    min-height: 120px;
    padding: 12px;
    font-size: 14px;
    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    background: white;
    color: var(--text-primary);
    resize: vertical;
    line-height: 1.5;
    transition: var(--button-transition);

    &:focus {
      outline: none;
      border-color: #13C2C2;
      box-shadow: 0 0 0 2px rgba(19, 194, 194, 0.1);
    }
  }

  .expression-preview {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background: rgba(0, 0, 0, 0.03);
    border-radius: 6px;
  }

  .preview-label {
    font-size: 12px;
    color: var(--text-secondary);
  }

  .preview-code {
    flex: 1;
    font-size: 13px;
    color: #13C2C2;
    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
    word-break: break-all;
  }
}

// 模型选择模式
.model-select-mode {
  .model-type-label {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 16px;

    strong {
      color: var(--text-primary);
    }
  }

  .select-section {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .select-label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 10px;
  }

  .enterprise-list,
  .model-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .enterprise-option,
  .model-option {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    border: 2px solid rgba(0, 0, 0, 0.08);
    border-radius: 10px;
    cursor: pointer;
    transition: var(--button-transition);
    background: var(--info-card-bg);

    &.selected {
      border-color: #13C2C2;
      background: rgba(19, 194, 194, 0.05);
    }

    &:hover {
      border-color: rgba(19, 194, 194, 0.2);
      background: var(--list-item-hover-bg);
    }

    input[type="radio"] {
      width: 18px;
      height: 18px;
      accent-color: #13C2C2;
      cursor: pointer;
    }
  }

  .enterprise-info,
  .model-info {
    flex: 1;
  }

  .enterprise-name,
  .model-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 2px;
  }

  .enterprise-type,
  .model-id {
    font-size: 12px;
    color: var(--text-secondary);
  }

  .empty-models {
    padding: 20px;
    text-align: center;
    color: var(--text-secondary);
    font-size: 13px;
    background: var(--info-card-bg);
    border-radius: 8px;
  }

  .params-section {
    margin-top: 20px;
  }

  .params-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 10px;
  }

  .params-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .param-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: rgba(0, 0, 0, 0.03);
    border-radius: 6px;
  }

  .param-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    min-width: 100px;
  }

  .param-type-select {
    padding: 4px 8px;
    font-size: 12px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    background: white;
    color: var(--text-primary);
  }

  .param-input {
    flex: 1;
    padding: 6px 10px;
    font-size: 13px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    background: white;
    color: var(--text-primary);

    &:focus {
      outline: none;
      border-color: #13C2C2;
      box-shadow: 0 0 0 2px rgba(19, 194, 194, 0.1);
    }
  }

  .empty-params {
    padding: 16px;
    text-align: center;
    color: var(--text-secondary);
    font-size: 13px;
    background: var(--info-card-bg);
    border-radius: 6px;
  }
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(0, 0, 0, 0.02);
  flex-shrink: 0;
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--button-transition);
  border: none;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-cancel {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: var(--text-secondary);

  &:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.04);
    border-color: rgba(0, 0, 0, 0.15);
  }
}

.btn-confirm {
  background: linear-gradient(135deg, #13C2C2, #0D9778);
  color: white;
  box-shadow: 0 2px 8px rgba(19, 194, 194, 0.3);

  &:hover:not(:disabled) {
    box-shadow: 0 4px 12px rgba(19, 194, 194, 0.4);
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
}
</style>
