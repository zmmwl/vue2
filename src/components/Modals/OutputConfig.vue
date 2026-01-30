<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click="closeOnOverlay && handleCancel()">
        <div class="modal-container output-config-modal" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">配置输出数据</h3>
            <button class="modal-close" @click="handleCancel()">&times;</button>
          </div>

          <div class="modal-body">
            <div class="output-config">
              <!-- 企业选择 -->
              <div class="config-section">
                <div class="section-title">
                  <span>🏢</span>
                  <span>输出参与方企业</span>
                </div>
                <div class="enterprise-display">
                  <div class="enterprise-card" @click="showEnterpriseSelector = true">
                    <div class="enterprise-icon">
                      {{ selectedEnterpriseName?.charAt(0) || '?' }}
                    </div>
                    <div class="enterprise-info">
                      <div class="enterprise-name">
                        {{ selectedEnterpriseName || '请选择企业' }}
                      </div>
                      <div class="enterprise-hint">点击选择</div>
                    </div>
                    <span class="arrow-icon">→</span>
                  </div>
                </div>
              </div>

              <!-- 数据集名称 -->
              <div class="config-section">
                <div class="section-title">
                  <span>📄</span>
                  <span>输出数据集名称</span>
                </div>
                <input
                  v-model="datasetName"
                  type="text"
                  class="text-input"
                  placeholder="请输入数据集名称"
                />
              </div>

              <!-- 输出字段选择 -->
              <div class="config-section">
                <div class="section-title">
                  <span>📋</span>
                  <span>输出字段</span>
                  <span class="field-count">({{ selectedFieldIds.size }})</span>
                </div>
                <div v-if="availableFields.length === 0" class="empty-fields">
                  <span class="empty-icon">📄</span>
                  <p>暂无可选字段</p>
                  <p class="empty-hint">请先配置计算任务的输入数据</p>
                </div>
                <div v-else class="fields-list">
                  <div
                    v-for="field in availableFields"
                    :key="field.id"
                    class="field-item"
                    :class="{ 'is-selected': isFieldSelected(field.id) }"
                    @click="toggleField(field.id)"
                  >
                    <input
                      :id="`field-${field.id}`"
                      type="checkbox"
                      :checked="isFieldSelected(field.id)"
                      @change="toggleField(field.id)"
                    />
                    <div class="field-info">
                      <div class="field-name">{{ field.name }}</div>
                      <div class="field-source">{{ field.source }}</div>
                    </div>
                    <div class="field-type">{{ field.type }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" @click="handleCancel()">取消</button>
            <button
              class="btn btn-primary"
              :disabled="!isValid"
              @click="handleConfirm()"
            >
              确认
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- 企业选择器弹窗 -->
  <EnterpriseSelector
    v-model="showEnterpriseSelector"
    :enterprises="enterprises"
    @confirm="handleEnterpriseSelected"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import EnterpriseSelector from './EnterpriseSelector.vue'
import type { EnterpriseOption, OutputField } from '@/types/nodes'

interface AvailableField {
  id: string
  name: string
  type: string
  source: string
}

interface Props {
  modelValue: boolean
  taskId: string
  enterprises: EnterpriseOption[]
  inputFields: AvailableField[]
  modelOutputFields?: AvailableField[]
  initialConfig?: {
    participantId: string
    dataset: string
    fields: OutputField[]
  }
  closeOnOverlay?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', config: {
    participantId: string
    dataset: string
    fields: OutputField[]
  }): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  modelOutputFields: () => [],
  initialConfig: undefined,
  closeOnOverlay: true
})

const emit = defineEmits<Emits>()

// 企业选择器显示状态
const showEnterpriseSelector = ref(false)

// 选中的企业 ID
const selectedEnterpriseId = ref<string>('')

// 数据集名称
const datasetName = ref<string>('')

// 选中的字段 ID 集合
const selectedFieldIds = ref<Set<string>>(new Set())

// 所有可用字段
const availableFields = computed(() => {
  return [...props.inputFields, ...props.modelOutputFields]
})

// 选中的企业名称
const selectedEnterpriseName = computed(() => {
  if (!selectedEnterpriseId.value) return ''
  const enterprise = props.enterprises.find(e => e.id === selectedEnterpriseId.value)
  return enterprise?.name || ''
})

// 是否有效（必须选择企业和至少一个字段）
const isValid = computed(() => {
  return selectedEnterpriseId.value.length > 0 &&
         datasetName.value.trim().length > 0 &&
         selectedFieldIds.value.size > 0
})

// 监听 modelValue 变化
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    initializeConfig()
  }
})

/**
 * 初始化配置
 */
function initializeConfig() {
  if (props.initialConfig) {
    selectedEnterpriseId.value = props.initialConfig.participantId
    datasetName.value = props.initialConfig.dataset
    selectedFieldIds.value = new Set(
      props.initialConfig.fields.map(f => `${f.source}-${f.columnName}`)
    )
  } else {
    // 默认数据集名称
    datasetName.value = `output_${props.taskId}_${Date.now()}`
  }
}

/**
 * 判断字段是否被选中
 */
function isFieldSelected(fieldId: string): boolean {
  return selectedFieldIds.value.has(fieldId)
}

/**
 * 切换字段选中状态
 */
function toggleField(fieldId: string) {
  if (selectedFieldIds.value.has(fieldId)) {
    selectedFieldIds.value.delete(fieldId)
  } else {
    selectedFieldIds.value.add(fieldId)
  }
  // 强制更新响应式
  selectedFieldIds.value = new Set(selectedFieldIds.value)
}

/**
 * 处理企业选择确认
 */
function handleEnterpriseSelected(enterpriseId: string) {
  selectedEnterpriseId.value = enterpriseId
}

/**
 * 获取选中的输出字段
 */
function getSelectedFields(): OutputField[] {
  const fields: OutputField[] = []
  const allFields = availableFields.value

  selectedFieldIds.value.forEach(fieldId => {
    const field = allFields.find(f => f.id === fieldId)
    if (field) {
      const [source] = fieldId.split('-')
      fields.push({
        source: source as 'input' | 'model',
        columnName: field.name,
        columnAlias: field.name,
        columnType: field.type
      })
    }
  })

  return fields
}

/**
 * 处理确认
 */
function handleConfirm() {
  if (!isValid.value) return

  emit('confirm', {
    participantId: selectedEnterpriseId.value,
    dataset: datasetName.value.trim(),
    fields: getSelectedFields()
  })

  handleClose()
}

/**
 * 处理取消
 */
function handleCancel() {
  emit('cancel')
  handleClose()
}

/**
 * 处理关闭
 */
function handleClose() {
  emit('update:modelValue', false)
  selectedEnterpriseId.value = ''
  datasetName.value = ''
  selectedFieldIds.value.clear()
}
</script>

<style scoped lang="scss">
.output-config-modal {
  max-width: 800px;
}

.output-config {
  .config-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 12px;

    .field-count {
      margin-left: auto;
      font-size: 12px;
      font-weight: 400;
      color: #909399;
      padding: 2px 8px;
      background: #f5f7fa;
      border-radius: 4px;
    }
  }

  .text-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #dcdfe6;
    border-radius: 6px;
    font-size: 14px;
    transition: all 0.2s;

    &:focus {
      outline: none;
      border-color: #409eff;
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
    }

    &::placeholder {
      color: #c0c4cc;
    }
  }

  .enterprise-display {
    .enterprise-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: #f5f7fa;
      border: 2px solid #dcdfe6;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: #ecf5ff;
        border-color: #409eff;
      }
    }

    .enterprise-icon {
      flex-shrink: 0;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #409eff, #66b1ff);
      color: white;
      border-radius: 8px;
      font-size: 20px;
      font-weight: 600;
    }

    .enterprise-info {
      flex: 1;
      min-width: 0;
    }

    .enterprise-name {
      font-size: 15px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 2px;
    }

    .enterprise-hint {
      font-size: 12px;
      color: #909399;
    }

    .arrow-icon {
      flex-shrink: 0;
      color: #c0c4cc;
    }
  }

  .empty-fields {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 50px 20px;
    background: #f5f7fa;
    border-radius: 8px;
    color: #909399;

    .empty-icon {
      font-size: 40px;
      margin-bottom: 12px;
      opacity: 0.6;
    }

    p {
      margin: 4px 0;
      font-size: 14px;
    }

    .empty-hint {
      font-size: 12px;
      color: #c0c4cc;
    }
  }

  .fields-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 300px;
    overflow-y: auto;
    padding: 4px;
  }

  .field-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    background: #f5f7fa;
    border: 2px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #ecf5ff;
      border-color: #b3d8ff;
    }

    &.is-selected {
      background: #f0f9ff;
      border-color: #409eff;
    }

    input[type="checkbox"] {
      width: 16px;
      height: 16px;
      cursor: pointer;
    }
  }

  .field-info {
    flex: 1;
    min-width: 0;
  }

  .field-name {
    font-size: 14px;
    font-weight: 500;
    color: #303133;
    margin-bottom: 2px;
  }

  .field-source {
    font-size: 12px;
    color: #909399;
  }

  .field-type {
    flex-shrink: 0;
    font-size: 12px;
    color: #606266;
    padding: 4px 8px;
    background: #e4e7ed;
    border-radius: 4px;
    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  }
}

// 模态框基础样式
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background-color: #ffffff;
  border-radius: 8px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e8e8e8;
}

.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #000000;
}

.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  font-size: 24px;
  color: #999999;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background-color: #f5f5f5;
    color: #000000;
  }
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  max-height: calc(90vh - 140px);
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e8e8e8;
}

.btn {
  padding: 8px 20px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-secondary {
  background-color: #ffffff;
  border-color: #d9d9d9;
  color: #000000;

  &:hover:not(:disabled) {
    border-color: #1890ff;
    color: #1890ff;
  }
}

.btn-primary {
  background-color: #1890ff;
  border-color: #1890ff;
  color: #ffffff;

  &:hover:not(:disabled) {
    background-color: #40a9ff;
    border-color: #40a9ff;
  }
}

// 自定义滚动条
.fields-list::-webkit-scrollbar {
  width: 6px;
}

.fields-list::-webkit-scrollbar-track {
  background: #f5f7fa;
  border-radius: 3px;
}

.fields-list::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;

  &:hover {
    background: #c0c4cc;
  }
}

// Transition 动画
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s;

  .modal-container {
    transition: transform 0.2s;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .modal-container {
    transform: scale(0.9);
  }
}
</style>
