<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click="closeOnOverlay && handleCancel()">
        <div class="modal-container add-field-selector" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">添加字段</h3>
            <button class="modal-close" @click="handleCancel()">&times;</button>
          </div>

          <div class="modal-body">
            <!-- 数据源信息 -->
            <div class="source-info">
              <span class="source-label">数据源：</span>
              <span class="source-name">{{ provider ? getProviderLabel(provider) : '' }}</span>
            </div>

            <!-- 可用字段列表 -->
            <div class="fields-container">
              <div class="fields-header">
                <span class="col-check">选择</span>
                <span class="col-name">字段名</span>
                <span class="col-type">类型</span>
              </div>
              <div class="fields-list">
                <div
                  v-for="field in availableFields"
                  :key="field.columnName"
                  class="field-item"
                  :class="{ selected: selectedFields.includes(field.columnName) }"
                  @click="toggleField(field.columnName)"
                >
                  <span class="col-check">
                    <input
                      type="checkbox"
                      :checked="selectedFields.includes(field.columnName)"
                      @click.stop
                      @change="toggleField(field.columnName)"
                    />
                  </span>
                  <span class="col-name">{{ field.columnName }}</span>
                  <span class="col-type">{{ field.columnType }}</span>
                </div>
                <div v-if="availableFields.length === 0" class="no-fields">
                  没有可添加的字段
                </div>
              </div>
            </div>

            <!-- 已选择数量 -->
            <div class="selection-info">
              已选择 {{ selectedFields.length }} 个字段
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" @click="handleCancel()">取消</button>
            <button class="btn btn-primary" :disabled="selectedFields.length === 0" @click="handleConfirm()">
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
import type { InputProvider, FieldMapping } from '@/types/nodes'

interface Props {
  modelValue: boolean
  provider?: InputProvider
  excludedFields?: string[]
  closeOnOverlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  excludedFields: () => [],
  closeOnOverlay: true
})

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', data: { selectedFields: FieldMapping[] }): void
  (e: 'cancel'): void
}

const emit = defineEmits<Emits>()

// 已选择的字段名列表
const selectedFields = ref<string[]>([])

// 可用字段（排除已添加的）
const availableFields = computed(() => {
  if (!props.provider?.fields) return []
  return props.provider.fields.filter(f => !props.excludedFields.includes(f.columnName))
})

// 获取数据源标签
function getProviderLabel(provider: InputProvider): string {
  return `${provider.participantId} - ${provider.dataset}`
}

// 切换字段选择
function toggleField(fieldName: string) {
  const index = selectedFields.value.indexOf(fieldName)
  if (index >= 0) {
    selectedFields.value.splice(index, 1)
  } else {
    selectedFields.value.push(fieldName)
  }
}

// 监听弹窗显示
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    selectedFields.value = []
  }
})

// 处理取消
function handleCancel() {
  emit('update:modelValue', false)
  emit('cancel')
}

// 处理确认
function handleConfirm() {
  if (selectedFields.value.length === 0 || !props.provider?.fields) return

  const fields = selectedFields.value.map(name => {
    const original = props.provider!.fields.find(f => f.columnName === name)
    return {
      columnName: name,
      columnType: original?.columnType || 'STRING',
      columnAlias: original?.columnAlias || name,
      isJoinField: false
    } as FieldMapping
  })

  emit('confirm', { selectedFields: fields })
  emit('update:modelValue', false)
}
</script>

<style scoped lang="scss">
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
  z-index: 1001;
}

.modal-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e8e8e8;

  .modal-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }

  .modal-close {
    background: none;
    border: none;
    font-size: 20px;
    color: #909399;
    cursor: pointer;
    padding: 0;
    line-height: 1;

    &:hover {
      color: #303133;
    }
  }
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.source-info {
  margin-bottom: 12px;
  padding: 10px 12px;
  background: #f5f7fa;
  border-radius: 4px;

  .source-label {
    font-weight: 500;
    color: #606266;
  }

  .source-name {
    color: #303133;
  }
}

.fields-container {
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  overflow: hidden;
}

.fields-header {
  display: flex;
  padding: 10px 12px;
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
  font-weight: 500;
  font-size: 13px;
  color: #606266;
}

.fields-list {
  max-height: 300px;
  overflow-y: auto;
}

.field-item {
  display: flex;
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #e6f7ff;
  }

  &.selected {
    background: #f6ffed;
  }
}

.col-check {
  width: 50px;
  display: flex;
  align-items: center;

  input {
    cursor: pointer;
  }
}

.col-name {
  flex: 1;
  font-size: 13px;
  color: #303133;
}

.col-type {
  width: 100px;
  font-size: 12px;
  color: #8c8c8c;
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 3px;
  text-align: center;
}

.no-fields {
  padding: 20px;
  text-align: center;
  color: #8c8c8c;
}

.selection-info {
  margin-top: 12px;
  font-size: 13px;
  color: #606266;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e8e8e8;
}

.btn {
  padding: 8px 20px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &.btn-primary {
    background: #1890ff;
    border: 1px solid #1890ff;
    color: white;

    &:hover:not(:disabled) {
      background: #40a9ff;
    }

    &:disabled {
      background: #d9d9d9;
      border-color: #d9d9d9;
      cursor: not-allowed;
    }
  }

  &.btn-secondary {
    background: white;
    border: 1px solid #d9d9d9;
    color: #606266;

    &:hover {
      border-color: #1890ff;
      color: #1890ff;
    }
  }
}

// 过渡动画
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;

  .modal-container {
    transition: transform 0.2s ease;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .modal-container {
    transform: scale(0.95);
  }
}
</style>
