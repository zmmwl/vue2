<template>
  <div v-if="visible" class="modal-overlay" @click.self="handleCancel">
    <div class="modal-content" @click.stop>
      <!-- 头部 -->
      <div class="modal-header">
        <h3 class="modal-title">配置模型参数</h3>
        <button class="close-button" @click="handleCancel" aria-label="关闭">&times;</button>
      </div>

      <!-- 模型信息 -->
      <div class="model-info">
        <div class="info-row">
          <span class="label">模型:</span>
          <span class="value">{{ modelTypeLabel }} / {{ modelConfig.name }}</span>
        </div>
        <div class="info-row">
          <span class="label">企业:</span>
          <span class="value">{{ getEnterpriseDisplayName(modelConfig.participantId) }}</span>
        </div>
      </div>

      <!-- 参数列表 -->
      <div class="params-section">
        <div class="params-header">
          <span>参数列表</span>
          <span class="count">({{ paramItems.length }})</span>
        </div>

        <div v-if="paramItems.length === 0" class="empty-params">
          该模型无需配置输入参数
        </div>

        <div v-else class="params-list">
          <div
            v-for="item in paramItems"
            :key="item.fid"
            class="param-card"
            :class="{ 'has-error': item.isEncrypt === 1 && !item.isConfigured }"
          >
            <!-- 参数头部 -->
            <div class="param-header">
              <span class="param-name">
                {{ item.name }}
                <span v-if="item.isEncrypt === 1" class="required-mark">*</span>
              </span>
              <span class="param-type" :style="{ color: getDataTypeColor(item.dataType) }">
                {{ getDataTypeName(item.dataType) }}
              </span>
            </div>

            <!-- 绑定类型切换 -->
            <div class="binding-type-toggle">
              <label class="radio-option">
                <input
                  type="radio"
                  :name="`binding-${item.fid}`"
                  value="field"
                  v-model="item.bindingType"
                />
                <span>绑定字段</span>
              </label>
              <label class="radio-option">
                <input
                  type="radio"
                  :name="`binding-${item.fid}`"
                  value="fixed"
                  v-model="item.bindingType"
                />
                <span>固定值</span>
              </label>
            </div>

            <!-- 字段选择器 -->
            <div v-if="item.bindingType === 'field'" class="field-selector">
              <select v-model="item.fieldRef" class="field-select">
                <option value="">请选择字段</option>
                <optgroup
                  v-for="group in fieldGroups"
                  :key="`${group.participantId}.${group.dataset}`"
                  :label="`${group.participantId} / ${group.dataset}`"
                >
                  <option
                    v-for="field in group.fields"
                    :key="field.id"
                    :value="field.id"
                  >
                    {{ field.fieldName }} ({{ field.fieldType }})
                  </option>
                </optgroup>
              </select>
            </div>

            <!-- 固定值输入 -->
            <div v-else class="fixed-value-input">
              <input
                v-if="item.dataType === 1"
                type="text"
                v-model="item.fixedValue"
                placeholder="请输入固定值"
              />
              <input
                v-else-if="item.dataType === 2 || item.dataType === 3"
                type="number"
                v-model="item.fixedValue"
                placeholder="请输入数字"
              />
              <input
                v-else-if="item.dataType === 4 || item.dataType === 5"
                type="number"
                step="0.01"
                v-model="item.fixedValue"
                placeholder="请输入数字"
              />
              <select v-else-if="item.dataType === 6" v-model="item.fixedValue">
                <option value="">请选择</option>
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
              <input
                v-else-if="item.dataType === 7"
                type="datetime-local"
                v-model="item.fixedValue"
              />
            </div>

            <!-- 参数描述 -->
            <div v-if="item.description" class="param-description">
              {{ item.description }}
            </div>
          </div>
        </div>
      </div>

      <!-- 错误提示 -->
      <div v-if="errors.length > 0" class="error-messages">
        <div v-for="error in errors" :key="error" class="error-item">
          ⚠️ {{ error }}
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="handleCancel">取消</button>
        <button class="btn btn-primary" @click="handleConfirm" :disabled="!canSave">
          保存配置
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { ComputeModelConfig, AvailableFieldOption, ParameterConfigItem, ModelParameter } from '@/types/nodes'
import { getDataTypeName, getDataTypeColor, isParameterConfigured, convertToModelParameters, groupFieldsByParticipant } from '@/utils/model-config-utils'
import { getEnterpriseList } from '@/services/enterpriseService'
import { getModelInputSignatures } from '@/services/model-mock-service'
import { logger } from '@/utils/logger'

// 企业数据缓存
const enterpriseCache = ref<Map<string, { name: string; participantId: string }>>(new Map())

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
    logger.error('[ModelParameterConfig] Failed to load enterprises', error)
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadEnterprises()
  // 当对话框打开时也重新加载企业数据
  watch(() => props.modelValue, (newValue) => {
    if (newValue) {
      loadEnterprises()
    }
  })
})

interface Props {
  modelValue: boolean
  modelConfig: ComputeModelConfig
  availableFields: AvailableFieldOption[]
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', parameters: ModelParameter[]): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 对话框显示状态
const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 参数配置项列表
const paramItems = ref<ParameterConfigItem[]>([])

// 错误列表
const errors = ref<string[]>([])

// 字段分组
const fieldGroups = computed(() => groupFieldsByParticipant(props.availableFields))

// 是否可以保存（所有必填项已配置）
const canSave = computed(() => {
  return errors.value.length === 0 && paramItems.value.length > 0
})

// 模型类型标签
const modelTypeLabel = computed(() => {
  const typeMap: Record<string, string> = {
    'CodeBin-V2': 'CodeBin-V2',
    'CodeBin-V3-1': 'CodeBin-V3.1',
    'CodeBin-V3-2': 'CodeBin-V3.2',
    'SPDZ': 'SPDZ',
    'expression': '表达式'
  }
  return typeMap[props.modelConfig.type || ''] || props.modelConfig.type || '未知类型'
})

/**
 * 获取企业显示名称
 */
function getEnterpriseDisplayName(participantId: string): string {
  if (!participantId) return '-'
  const enterprise = enterpriseCache.value.get(participantId)
  if (enterprise) {
    return `${enterprise.name} (${participantId})`
  }
  return participantId
}

/**
 * 加载模型参数签名
 */
async function loadParameterSignatures() {
  if (props.modelConfig.type === 'expression') {
    paramItems.value = []
    return
  }

  try {
    const signatures = await getModelInputSignatures(props.modelConfig.id)

    // 转换为参数配置项，合并已保存的配置
    paramItems.value = signatures.map(sig => {
      const savedParam = props.modelConfig.parameters?.find(p => p.name === sig.name)

      return {
        ...sig,
        bindingType: savedParam?.bindingType || 'field',
        fieldRef: savedParam?.fieldRef,
        fixedValue: savedParam?.fixedValue,
        isConfigured: false
      }
    })

    // 刷新配置状态
    updateConfiguredStatus()
  } catch (error) {
    console.error('加载模型参数失败:', error)
    paramItems.value = []
  }
}

/**
 * 更新参数配置状态
 */
function updateConfiguredStatus() {
  paramItems.value.forEach(item => {
    item.isConfigured = isParameterConfigured(item)
  })

  // 验证必填参数
  errors.value = paramItems.value
    .filter(item => item.isEncrypt === 1 && !item.isConfigured)
    .map(item => `参数 "${item.name}" 为必填项，请配置`)
}

/**
 * 处理确认
 */
function handleConfirm() {
  if (!canSave.value) return

  const parameters = convertToModelParameters(paramItems.value)
  emit('confirm', parameters)
  visible.value = false
}

/**
 * 处理取消
 */
function handleCancel() {
  emit('cancel')
  visible.value = false
}

// 监听参数变化，更新配置状态
watch(() => [paramItems.value.map(i => ({ bindingType: i.bindingType, fieldRef: i.fieldRef, fixedValue: i.fixedValue }))], () => {
  updateConfiguredStatus()
}, { deep: true })

// 监听对话框打开，加载参数
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    loadParameterSignatures()
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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.close-button {
  background: none;
  border: none;
  font-size: 28px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    background: #f5f5f5;
    color: #333;
  }
}

.model-info {
  padding: 16px 24px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;

  .info-row {
    display: flex;
    align-items: center;
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }

    .label {
      font-size: 12px;
      color: var(--text-secondary);
      width: 50px;
      font-weight: 500;
    }

    .value {
      font-size: 13px;
      color: var(--text-primary);
      font-weight: 500;
    }
  }
}

.params-section {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;

    &:hover {
      background: rgba(0, 0, 0, 0.15);
    }
  }
}

.params-header {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;

  .count {
    font-size: 12px;
    font-weight: 400;
    color: var(--text-secondary);
    margin-left: 4px;
  }
}

.empty-params {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);
  font-size: 14px;
}

.params-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.param-card {
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s;

  &.has-error {
    border-color: #ff4d4f;
    background: #fff2f0;
  }

  &:hover {
    border-color: #d9d9d9;
  }
}

.param-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.param-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);

  .required-mark {
    color: #ff4d4f;
    margin-left: 2px;
  }
}

.param-type {
  font-size: 11px;
  padding: 4px 8px;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-weight: 500;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
}

.binding-type-toggle {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;

  input[type="radio"] {
    cursor: pointer;
  }

  span {
    cursor: pointer;
  }
}

.field-selector {
  .field-select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    font-size: 13px;
    color: var(--text-primary);
    background: white;
    cursor: pointer;
    transition: all 0.2s;

    &:focus {
      outline: none;
      border-color: #1890ff;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
    }

    &:hover {
      border-color: #40a9ff;
    }

    option {
      padding: 8px;
    }

    optgroup {
      font-weight: 600;
      color: var(--text-secondary);
    }
  }
}

.fixed-value-input {
  input, select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    font-size: 13px;
    color: var(--text-primary);
    background: white;
    transition: all 0.2s;

    &:focus {
      outline: none;
      border-color: #1890ff;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
    }

    &:hover {
      border-color: #40a9ff;
    }

    &::placeholder {
      color: #bfbfbf;
    }
  }
}

.param-description {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.error-messages {
  padding: 12px 24px;
  background: #fff2f0;
  border-top: 1px solid #ffccc7;
}

.error-item {
  font-size: 12px;
  color: #ff4d4f;
  margin-bottom: 4px;

  &:last-child {
    margin-bottom: 0;
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
}

.btn {
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;

  &.btn-secondary {
    background: #f5f5f5;
    color: var(--text-primary);
    border: 1px solid #d9d9d9;

    &:hover {
      background: #e6e6e6;
      border-color: #bfbfbf;
    }
  }

  &.btn-primary {
    background: linear-gradient(135deg, #1890ff, #096dd9);
    color: white;

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #40a9ff, #1890ff);
      box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
    }

    &:disabled {
      background: #d9d9d9;
      cursor: not-allowed;
    }
  }
}
</style>
