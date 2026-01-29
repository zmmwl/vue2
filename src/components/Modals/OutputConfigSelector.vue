<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click="onCancel">
        <div class="modal-container output-config-modal" @click.stop>
          <!-- 标题栏 -->
          <div class="modal-header">
            <h3 class="modal-title">配置输出数据</h3>
            <button class="modal-close" @click="onCancel" aria-label="关闭">
              <span>✕</span>
            </button>
          </div>

          <!-- 内容区 -->
          <div class="modal-body">
            <!-- 选择参与方企业 -->
            <div class="config-section">
              <div class="section-title">
                <span class="step-number">1</span>
                选择输出参与方企业
              </div>
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

            <!-- 选择输出字段 -->
            <div v-if="selectedEnterpriseId" class="config-section">
              <div class="section-title">
                <span class="step-number">2</span>
                选择输出字段
              </div>

              <!-- 字段来源选项卡 -->
              <div class="field-source-tabs">
                <button
                  class="tab-btn"
                  :class="{ active: activeTab === 'input' }"
                  @click="activeTab = 'input'"
                  :disabled="availableInputFields.length === 0"
                >
                  输入字段 ({{ availableInputFields.length }})
                </button>
                <button
                  class="tab-btn"
                  :class="{ active: activeTab === 'model' }"
                  @click="activeTab = 'model'"
                  :disabled="availableModelFields.length === 0"
                >
                  模型输出 ({{ availableModelFields.length }})
                </button>
              </div>

              <!-- 字段列表 -->
              <div class="field-list">
                <div
                  v-for="field in currentFieldList"
                  :key="field.name"
                  class="field-item"
                  :class="{ 'is-source': field.source }"
                >
                  <label class="field-checkbox">
                    <input
                      type="checkbox"
                      v-model="field.selected"
                      @change="onFieldChange"
                    />
                  </label>
                  <div class="field-info">
                    <div class="field-name">{{ field.name }}</div>
                    <div class="field-meta">
                      <span class="field-type">{{ field.type }}</span>
                      <span class="field-source-badge">{{ field.source === 'input' ? '输入' : '模型' }}</span>
                    </div>
                  </div>
                </div>
                <div v-if="currentFieldList.length === 0" class="empty-fields">
                  {{ activeTab === 'input' ? '暂无输入字段' : '暂无模型输出字段' }}
                </div>
              </div>

              <!-- 已选字段摘要 -->
              <div v-if="selectedFields.length > 0" class="selected-summary">
                <span class="summary-label">已选:</span>
                <span class="summary-count">{{ selectedFields.length }} 个字段</span>
                <div class="summary-tags">
                  <span
                    v-for="field in selectedFields"
                    :key="field.name"
                    class="summary-tag"
                  >
                    {{ field.alias || field.name }}
                  </span>
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

interface FieldOption {
  name: string
  type: string
  source: 'input' | 'model'
  selected: boolean
  alias?: string
}

interface AvailableField {
  name: string
  type: string
  source: 'input' | 'model'
}

interface OutputConfig {
  participantId: string
  fields: Array<{ name: string; type: string; source: 'input' | 'model'; alias?: string }>
}

interface Props {
  visible: boolean
  // 推荐的企业列表（来自当前任务的相关资源方）
  recommendedEnterprises?: EnterpriseOption[]
  // 可用字段列表
  availableFields?: AvailableField[]
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', config: OutputConfig): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  recommendedEnterprises: () => [],
  availableFields: () => []
})

const emit = defineEmits<Emits>()

// 所有企业列表（推荐企业 + 模拟的其他企业）
const allEnterprises = computed(() => {
  // 如果有推荐企业，使用推荐企业；否则使用模拟企业
  if (props.recommendedEnterprises.length > 0) {
    return props.recommendedEnterprises
  }
  // 模拟企业列表
  return [
    { id: 'org-001', name: '租户一', resourceType: 3 },
    { id: 'org-002', name: '租户二', resourceType: 3 },
    { id: 'org-003', name: '租户三', resourceType: 2 },
    { id: 'org-004', name: '某某银行', resourceType: 3 },
    { id: 'org-005', name: '某某保险公司', resourceType: 2 }
  ] as EnterpriseOption[]
})

// 企业排序（按资源类型优先级）
const sortedEnterprises = computed(() => {
  return [...allEnterprises.value].sort((a, b) => {
    const weightDiff = (b.resourceType ?? 0) - (a.resourceType ?? 0)
    if (weightDiff !== 0) return weightDiff
    return a.name.localeCompare(b.name, 'zh-CN')
  })
})

// 选中的企业 ID
const selectedEnterpriseId = ref<string>('')

// 当前激活的选项卡
const activeTab = ref<'input' | 'model'>('input')

// 字段选项列表
const fieldOptions = ref<FieldOption[]>([])

// 可用的输入字段
const availableInputFields = computed(() => {
  return props.availableFields.filter(f => f.source === 'input')
})

// 可用的模型输出字段
const availableModelFields = computed(() => {
  return props.availableFields.filter(f => f.source === 'model')
})

// 当前选项卡的字段列表
const currentFieldList = computed(() => {
  if (activeTab.value === 'input') {
    return fieldOptions.value.filter(f => f.source === 'input')
  }
  return fieldOptions.value.filter(f => f.source === 'model')
})

// 已选字段
const selectedFields = computed(() => {
  return fieldOptions.value.filter(f => f.selected)
})

// 是否可以确认
const canConfirm = computed(() => {
  return selectedEnterpriseId.value && selectedFields.value.length > 0
})

// 获取资源类型标签
function getResourceTypeLabel(type: number): string {
  const labels: Record<number, string> = {
    3: '数据资源',
    2: '模型资源',
    1: '算力资源',
    0: '其他'
  }
  return labels[type] || '未知'
}

// 选择企业
function onSelectEnterprise(id: string) {
  selectedEnterpriseId.value = id
}

// 字段选择变化
function onFieldChange() {
  // 状态更新会自动反映到 computed
}

// 初始化字段选项
function initFieldOptions() {
  fieldOptions.value = (props.availableFields || []).map(field => ({
    name: field.name,
    type: field.type,
    source: field.source,
    selected: true, // 默认全选
    alias: field.name
  }))

  // 根据可用字段自动选择激活的选项卡
  if (availableInputFields.value.length > 0) {
    activeTab.value = 'input'
  } else if (availableModelFields.value.length > 0) {
    activeTab.value = 'model'
  }
}

// 确认
function onConfirm() {
  if (!canConfirm.value) return

  const config: OutputConfig = {
    participantId: selectedEnterpriseId.value,
    fields: selectedFields.value.map(f => ({
      name: f.name,
      type: f.type,
      source: f.source,
      alias: f.alias || f.name
    }))
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
  activeTab.value = 'input'
  fieldOptions.value = []
}

// 监听 visible 变化
watch(() => props.visible, (visible) => {
  if (visible) {
    reset()
    initFieldOptions()
    // 如果只有一个企业，自动选中
    if (sortedEnterprises.value.length === 1) {
      selectedEnterpriseId.value = sortedEnterprises.value[0]?.id || ''
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
  max-width: 680px;
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
}

.config-section {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 14px;
}

.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, var(--datasource-blue), #0284C7);
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
}

.enterprise-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.enterprise-option {
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
    border-color: var(--datasource-blue);
    background: rgba(14, 165, 233, 0.05);
  }

  &:hover {
    border-color: var(--list-item-selected-border);
    background: var(--list-item-hover-bg);
  }
}

.enterprise-radio {
  input[type="radio"] {
    width: 18px;
    height: 18px;
    accent-color: var(--datasource-blue);
    cursor: pointer;
  }
}

.enterprise-info {
  flex: 1;
}

.enterprise-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.enterprise-type {
  font-size: 12px;
  color: var(--text-secondary);
}

.field-source-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
  background: rgba(0, 0, 0, 0.03);
  padding: 4px;
  border-radius: 8px;
}

.tab-btn {
  flex: 1;
  padding: 8px 12px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--button-transition);

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &.active {
    background: white;
    color: var(--datasource-blue);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
}

.field-list {
  max-height: 250px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;

  &::-webkit-scrollbar {
    width: 5px;
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

.field-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  background: var(--info-card-bg);
  transition: var(--button-transition);

  &:hover {
    background: var(--list-item-hover-bg);
  }

  &.is-source {
    border-left: 3px solid #52C41A;
  }
}

.field-checkbox {
  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: var(--datasource-blue);
    cursor: pointer;
  }
}

.field-info {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.field-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.field-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

.field-type {
  font-size: 11px;
  color: var(--text-secondary);
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 4px;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
}

.field-source-badge {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  text-transform: uppercase;

  .field-item.is-source & {
    background: rgba(82, 196, 26, 0.1);
    color: #52C41A;
  }
}

.empty-fields {
  padding: 32px 20px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
  background: var(--info-card-bg);
  border-radius: 8px;
  border: 1px dashed rgba(0, 0, 0, 0.1);
}

.selected-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  background: rgba(82, 196, 26, 0.05);
  border: 1px solid rgba(82, 196, 26, 0.2);
  border-radius: 8px;
}

.summary-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.summary-count {
  font-size: 13px;
  font-weight: 700;
  color: #52C41A;
}

.summary-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.summary-tag {
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(82, 196, 26, 0.1);
  color: #52C41A;
  border-radius: 4px;
  font-weight: 500;
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
  background: linear-gradient(135deg, var(--datasource-blue), #0284C7);
  color: white;
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.3);

  &:hover:not(:disabled) {
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4);
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
}
</style>
