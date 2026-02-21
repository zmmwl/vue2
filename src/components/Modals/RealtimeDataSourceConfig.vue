<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="handleClose">
      <div class="modal-content realtime-config-modal">
        <div class="modal-header">
          <h3>配置实时数据源</h3>
          <button class="close-btn" @click="handleClose">×</button>
        </div>

        <div class="modal-body">
          <!-- 来源选择 -->
          <div class="source-type-selector">
            <label class="radio-label">
              <input type="radio" value="connection" v-model="sourceType" />
              <span class="radio-text">连线导入</span>
              <span class="radio-desc">从上游节点输出导入字段</span>
            </label>
            <label class="radio-label">
              <input type="radio" value="manual" v-model="sourceType" />
              <span class="radio-text">手工录入</span>
              <span class="radio-desc">手动输入字段信息</span>
            </label>
          </div>

          <!-- 连线导入模式 -->
          <div v-if="sourceType === 'connection'" class="connection-mode">
            <div v-if="sourceNodeId" class="connection-info">
              <span class="info-icon">🔗</span>
              <span>已连接上游节点，字段已自动导入</span>
            </div>
            <div v-else class="connection-hint">
              <span class="hint-icon">💡</span>
              <span>请先从上游节点拖拽连线到此PIR任务的实时数据源输入端</span>
            </div>

            <!-- 显示已导入的字段 -->
            <div v-if="importedFields && importedFields.length > 0" class="imported-fields">
              <div class="section-label">已导入字段 ({{ importedFields.length }})</div>
              <div class="field-list">
                <div v-for="field in importedFields" :key="field.name" class="field-item">
                  <span class="field-name">{{ field.name }}</span>
                  <span class="field-type">{{ field.dataType }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 手工录入模式 -->
          <div v-else class="manual-mode">
            <FieldEditor v-model="manualFields" />
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="handleClose">取消</button>
          <button class="btn-confirm" @click="handleConfirm" :disabled="!canConfirm">
            确认
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import FieldEditor from './FieldEditor.vue'
import type { RealtimeDataSourceInfo, RealtimeFieldInfo } from '@/types/nodes'

const props = defineProps<{
  modelValue: boolean
  initialData?: RealtimeDataSourceInfo
  sourceNodeId?: string
  importedFields?: RealtimeFieldInfo[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', data: RealtimeDataSourceInfo): void
}>()

// 来源类型
const sourceType = ref<'connection' | 'manual'>(
  props.initialData?.sourceType || 'manual'
)

// 手工录入字段
const manualFields = ref<RealtimeFieldInfo[]>(
  props.initialData?.sourceType === 'manual' ? [...(props.initialData.fields || [])] : []
)

// 是否可以确认
const canConfirm = computed(() => {
  if (sourceType.value === 'connection') {
    return (props.importedFields?.length || 0) > 0
  }
  return manualFields.value.length > 0
})

// 处理确认
const handleConfirm = () => {
  const data: RealtimeDataSourceInfo = {
    id: `realtime_${Date.now()}`,
    name: '实时数据源',
    sourceType: sourceType.value,
    fields: sourceType.value === 'connection'
      ? (props.importedFields || [])
      : manualFields.value,
    sourceNodeId: sourceType.value === 'connection' ? props.sourceNodeId : undefined
  }
  emit('confirm', data)
  emit('update:modelValue', false)
}

// 处理关闭
const handleClose = () => {
  emit('update:modelValue', false)
}

// 监听初始数据变化
watch(() => props.initialData, (newData) => {
  if (newData) {
    sourceType.value = newData.sourceType
    if (newData.sourceType === 'manual') {
      manualFields.value = [...(newData.fields || [])]
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

.realtime-config-modal {
  width: 560px;
  max-width: 90vw;
  background: var(--bg-secondary);
  border-radius: var(--dialog-border-radius);
  box-shadow: var(--shadow-dialog-overlay);
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
  padding: var(--dialog-body-padding);
}

.source-type-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.radio-label {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);

  &:hover {
    background: var(--list-item-hover-bg);
  }

  input[type="radio"] {
    margin-top: 3px;
    accent-color: var(--datasource-blue);
  }

  .radio-text {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
  }

  .radio-desc {
    flex: 1;
    font-size: 12px;
    color: var(--text-secondary);
  }
}

.connection-mode,
.manual-mode {
  min-height: 100px;
}

.connection-info,
.connection-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  font-size: 13px;
}

.connection-info {
  background: rgba(82, 196, 26, 0.08);
  color: #52C41A;
}

.connection-hint {
  background: rgba(0, 0, 0, 0.02);
  color: var(--text-secondary);
}

.imported-fields {
  margin-top: 16px;
}

.section-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.field-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: var(--radius-sm);

  .field-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
  }

  .field-type {
    font-size: 11px;
    padding: 2px 6px;
    background: rgba(14, 165, 233, 0.1);
    color: var(--datasource-blue);
    border-radius: 4px;
  }
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
    background: var(--color-primary);
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
