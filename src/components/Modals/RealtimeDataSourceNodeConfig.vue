<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay" @click.self="handleClose">
      <div class="modal-content realtime-node-config-modal">
        <div class="modal-header">
          <h3>配置实时数据源</h3>
          <button class="close-btn" @click="handleClose">×</button>
        </div>

        <div class="modal-body">
          <!-- 来源选择 -->
          <div class="source-type-selector">
            <label class="radio-label" :class="{ 'is-selected': configMode === 'datasource' }">
              <input type="radio" value="datasource" v-model="configMode" />
              <div class="radio-content">
                <span class="radio-text">从现有数据源选择</span>
                <span class="radio-desc">从数据资产中选择已有的数据源</span>
              </div>
            </label>
            <label class="radio-label" :class="{ 'is-selected': configMode === 'manual' }">
              <input type="radio" value="manual" v-model="configMode" />
              <div class="radio-content">
                <span class="radio-text">手工录入字段</span>
                <span class="radio-desc">手动输入字段名称和类型</span>
              </div>
            </label>
          </div>

          <!-- 从现有数据源选择模式 - 显示提示 -->
          <div v-if="configMode === 'datasource'" class="datasource-mode">
            <div class="datasource-hint">
              <span class="hint-icon">💡</span>
              <span>点击"下一步"将从数据资产中选择数据源</span>
            </div>
          </div>

          <!-- 手工录入模式 -->
          <div v-else class="manual-mode">
            <FieldEditor v-model="manualFields" />
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="handleClose">取消</button>
          <button class="btn-next" @click="handleNext" :disabled="!canProceed">
            {{ configMode === 'datasource' ? '下一步' : '确认' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import FieldEditor from './FieldEditor.vue'
import type { RealtimeFieldInfo } from '@/types/nodes'

const props = defineProps<{
  modelValue: boolean
  initialData?: {
    mode: 'datasource' | 'manual'
    fields: RealtimeFieldInfo[]
    sourceNodeId?: string
    sourceNodeName?: string
  }
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', data: {
    mode: 'datasource' | 'manual'
    fields: RealtimeFieldInfo[]
    sourceNodeId?: string
    sourceNodeName?: string
  }): void
  (e: 'select-datasource'): void
}>()

// 配置模式
const configMode = ref<'datasource' | 'manual'>(
  props.initialData?.mode || 'datasource'
)

// 手工录入字段
const manualFields = ref<RealtimeFieldInfo[]>(
  props.initialData?.mode === 'manual' ? [...(props.initialData.fields || [])] : []
)

// 是否可以进行下一步
const canProceed = computed(() => {
  if (configMode.value === 'datasource') {
    return true // 从数据源选择模式始终可以进入下一步
  }
  return manualFields.value.length > 0
})

// 处理下一步/确认
const handleNext = () => {
  if (configMode.value === 'datasource') {
    // 从数据源选择模式：关闭当前对话框，通知父组件打开统一资源选择器
    emit('update:modelValue', false)
    emit('select-datasource')
  } else {
    // 手工录入模式：直接确认
    const data = {
      mode: 'manual' as const,
      fields: manualFields.value
    }
    emit('confirm', data)
    emit('update:modelValue', false)
  }
}

// 处理关闭
const handleClose = () => {
  emit('update:modelValue', false)
}

// 监听初始数据变化
watch(() => props.initialData, (newData) => {
  if (newData) {
    configMode.value = newData.mode
    if (newData.mode === 'manual') {
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

.realtime-node-config-modal {
  width: 500px;
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
  border: 2px solid rgba(0, 0, 0, 0.08);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);

  &:hover {
    background: var(--list-item-hover-bg);
  }

  &.is-selected {
    border-color: var(--color-primary);
    background: rgba(24, 144, 255, 0.04);
  }

  input[type="radio"] {
    margin-top: 3px;
    accent-color: var(--color-primary);
  }

  .radio-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .radio-text {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
  }

  .radio-desc {
    font-size: 12px;
    color: var(--text-secondary);
  }
}

.datasource-mode,
.manual-mode {
  min-height: 80px;
}

.datasource-hint {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  background: rgba(24, 144, 255, 0.06);
  border-radius: var(--radius-md);
  font-size: 13px;
  color: var(--text-secondary);

  .hint-icon {
    font-size: 18px;
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
.btn-next {
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

.btn-next {
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
