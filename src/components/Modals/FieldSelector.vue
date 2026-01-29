<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click="onCancel">
        <div class="modal-container field-selector-modal" @click.stop>
          <!-- 标题栏 -->
          <div class="modal-header">
            <h3 class="modal-title">配置输入数据字段</h3>
            <button class="modal-close" @click="onCancel" aria-label="关闭">
              <span>✕</span>
            </button>
          </div>

          <!-- 内容区 -->
          <div class="modal-body">
            <!-- 数据源信息 -->
            <div class="source-info">
              <div class="source-info-label">数据源:</div>
              <div class="source-info-value">{{ dataSourceLabel }}</div>
            </div>

            <!-- 字段列表 -->
            <div class="field-list-section">
              <div class="section-header">
                <label class="select-all">
                  <input type="checkbox" v-model="selectAll" @change="onSelectAllChange" />
                  <span>选择字段</span>
                </label>
                <span class="selected-count">{{ selectedFields.length }}/{{ fields.length }}</span>
              </div>

              <div class="field-list">
                <div
                  v-for="field in fieldConfigs"
                  :key="field.columnName"
                  class="field-item"
                  :class="{ 'has-conflict': hasAliasConflict(field.columnName) }"
                >
                  <label class="field-checkbox">
                    <input
                      type="checkbox"
                      v-model="field.selected"
                      @change="onFieldChange"
                    />
                    <span class="field-checkbox-custom"></span>
                  </label>

                  <div class="field-info">
                    <div class="field-name">{{ field.columnName }}</div>
                    <div class="field-type">{{ field.type }}</div>
                  </div>

                  <div class="field-join">
                    <label class="join-checkbox" title="设为Join字段">
                      <input
                        type="checkbox"
                        v-model="field.isJoinField"
                        :disabled="!field.selected"
                        @change="onJoinFieldChange"
                      />
                      <span>Join</span>
                    </label>

                    <select
                      v-model="field.joinType"
                      :disabled="!field.isJoinField"
                      class="join-type-select"
                    >
                      <option value="INNER">INNER</option>
                      <option value="CROSS">CROSS</option>
                    </select>
                  </div>

                  <div class="field-alias">
                    <input
                      type="text"
                      v-model="field.columnAlias"
                      :disabled="!field.selected"
                      placeholder="别名"
                      class="alias-input"
                      @input="onAliasChange(field)"
                    />
                    <span v-if="hasAliasConflict(field.columnName)" class="conflict-badge" title="别名冲突">
                      *
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Join 条件预览 -->
            <div v-if="joinFields.length > 0" class="join-preview">
              <div class="join-preview-label">Join 条件:</div>
              <div class="join-preview-content">
                <div v-for="(condition, index) in joinConditions" :key="index" class="join-condition-item">
                  {{ condition.joinType }} ({{ condition.columnNames.join(', ') }})
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
              :disabled="selectedFields.length === 0 || hasJoinFieldError"
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
import type { Field, FieldMapping } from '@/types/contracts'

// 字段配置（包含UI状态）
interface FieldWithConfig {
  columnName: string
  type: string
  length: string
  comments: string
  visibleType?: number
  // UI 状态属性
  selected: boolean
  isJoinField: boolean
  joinType: 'INNER' | 'CROSS'
  columnAlias: string
}

interface Props {
  visible: boolean
  dataSourceId: string
  dataSourceLabel: string
  fields: Field[]
  initialConfig?: FieldMapping[]
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', config: FieldMapping[]): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  initialConfig: undefined
})

const emit = defineEmits<Emits>()

// 字段配置列表
const fieldConfigs = ref<FieldWithConfig[]>([])

// 全选状态
const selectAll = computed({
  get: () => fieldConfigs.value.length > 0 && fieldConfigs.value.every(f => f.selected),
  set: (value: boolean) => {
    fieldConfigs.value.forEach(f => {
      f.selected = value
      if (!value) {
        f.isJoinField = false
      }
    })
  }
})

// 已选字段
const selectedFields = computed(() => {
  return fieldConfigs.value.filter(f => f.selected)
})

// Join 字段
const joinFields = computed(() => {
  return fieldConfigs.value.filter(f => f.selected && f.isJoinField)
})

// Join 条件
const joinConditions = computed(() => {
  const conditions: { joinType: string; columnNames: string[] }[] = []

  // 按连接类型分组
  const innerJoinFields = joinFields.value.filter(f => f.joinType === 'INNER')
  const crossJoinFields = joinFields.value.filter(f => f.joinType === 'CROSS')

  if (innerJoinFields.length > 0) {
    conditions.push({
      joinType: 'INNER',
      columnNames: innerJoinFields.map(f => f.columnName)
    })
  }

  if (crossJoinFields.length > 0) {
    conditions.push({
      joinType: 'CROSS',
      columnNames: crossJoinFields.map(f => f.columnName)
    })
  }

  return conditions
})

// 是否有 Join 字段错误（至少需要一个 join 字段）
const hasJoinFieldError = computed(() => {
  // 至少需要一个 join 字段
  return joinFields.value.length === 0
})

// 别名冲突检测
const aliasConflicts = ref<Set<string>>(new Set())

// 初始化字段配置
function initFieldConfigs() {
  fieldConfigs.value = props.fields.map(field => {
    const initial = props.initialConfig?.find(c => c.columnName === field.columnName)

    return {
      ...field,
      selected: initial ? true : true, // 默认全选
      isJoinField: initial ? initial.isJoinField : false,
      joinType: initial ? initial.joinType || 'INNER' : 'INNER',
      columnAlias: initial ? initial.columnAlias : field.columnName
    }
  })

  checkAliasConflicts()
}

// 检测别名冲突
function checkAliasConflicts() {
  const aliasMap = new Map<string, string[]>()
  const conflicts = new Set<string>()

  fieldConfigs.value.forEach(f => {
    if (!f.selected) return

    const alias = (f.columnAlias?.trim() || f.columnName)
    if (!aliasMap.has(alias)) {
      aliasMap.set(alias, [])
    }
    aliasMap.get(alias)!.push(f.columnName)
  })

  // 找出有冲突的别名
  aliasMap.forEach((columns) => {
    if (columns.length > 1) {
      columns.forEach(col => conflicts.add(col))
    }
  })

  aliasConflicts.value = conflicts
}

// 检测单个字段是否有别名冲突
function hasAliasConflict(columnName: string): boolean {
  return aliasConflicts.value.has(columnName)
}

// 全选变化
function onSelectAllChange() {
  // selectAll 是 computed，会自动处理
}

// 字段选择变化
function onFieldChange() {
  checkAliasConflicts()
}

// Join 字段变化
function onJoinFieldChange() {
  // 检查至少需要一个 join 字段
  if (joinFields.value.length === 0) {
    // 可以在这里显示提示
  }
}

// 别名变化
function onAliasChange(_field: FieldWithConfig) {
  checkAliasConflicts()
}

// 确认
function onConfirm() {
  if (selectedFields.value.length === 0) {
    return
  }

  if (hasJoinFieldError.value) {
    return
  }

  // 构建字段映射配置
  const config: FieldMapping[] = selectedFields.value.map(field => ({
    columnName: field.columnName,
    columnAlias: field.columnAlias || field.columnName,
    columnType: field.type,
    isJoinField: field.isJoinField,
    joinType: field.isJoinField ? field.joinType : undefined
  }))

  emit('confirm', config)
  emit('update:visible', false)
}

// 取消
function onCancel() {
  emit('cancel')
  emit('update:visible', false)
}

// 监听 visible 变化，初始化字段配置
watch(() => props.visible, (visible) => {
  if (visible) {
    initFieldConfigs()
  }
})

// 监听 fields 变化
watch(() => props.fields, () => {
  if (props.visible) {
    initFieldConfigs()
  }
}, { deep: true })
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
  max-width: 640px;
  max-height: 80vh;
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

.source-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(14, 165, 233, 0.05);
  border: 1px solid rgba(14, 165, 233, 0.2);
  border-radius: 8px;
  margin-bottom: 20px;
}

.source-info-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.source-info-value {
  font-size: 14px;
  color: var(--datasource-blue);
  font-weight: 600;
}

.field-list-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.select-all {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: var(--datasource-blue);
    cursor: pointer;
  }
}

.selected-count {
  font-size: 12px;
  color: var(--text-secondary);
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 8px;
  border-radius: 4px;
}

.field-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-item {
  display: grid;
  grid-template-columns: 40px 1fr 120px 140px;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  background: var(--info-card-bg);
  transition: var(--button-transition);

  &:hover {
    background: var(--list-item-hover-bg);
  }

  &.has-conflict {
    border-color: rgba(255, 77, 79, 0.3);
    background: rgba(255, 77, 79, 0.03);
  }
}

.field-checkbox {
  display: flex;
  align-items: center;
  cursor: pointer;

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: var(--datasource-blue);
    cursor: pointer;

    &:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }
}

.field-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.field-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.field-type {
  font-size: 11px;
  color: var(--text-secondary);
  font-family: 'Courier New', monospace;
}

.field-join {
  display: flex;
  align-items: center;
  gap: 8px;
}

.join-checkbox {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-secondary);
  cursor: pointer;

  input[type="checkbox"] {
    width: 14px;
    height: 14px;
    accent-color: #FA8C16;
    cursor: pointer;

    &:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }

  &:has(input:disabled) {
    opacity: 0.5;
  }
}

.join-type-select {
  flex: 1;
  padding: 4px 8px;
  font-size: 11px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  background: white;
  color: var(--text-primary);

  &:disabled {
    background: rgba(0, 0, 0, 0.03);
    color: var(--text-secondary);
    cursor: not-allowed;
  }
}

.field-alias {
  position: relative;
  display: flex;
  align-items: center;
}

.alias-input {
  width: 100%;
  padding: 6px 28px 6px 10px;
  font-size: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  background: white;
  color: var(--text-primary);
  transition: var(--button-transition);

  &:focus {
    outline: none;
    border-color: var(--datasource-blue);
    box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.1);
  }

  &:disabled {
    background: rgba(0, 0, 0, 0.03);
    color: var(--text-secondary);
    cursor: not-allowed;
  }

  &.has-conflict {
    border-color: rgba(255, 77, 79, 0.5);
    padding-right: 40px;
  }
}

.conflict-badge {
  position: absolute;
  right: 8px;
  color: #FF4D4F;
  font-weight: bold;
  font-size: 14px;
  pointer-events: none;
}

.join-preview {
  padding: 16px;
  background: rgba(250, 140, 22, 0.05);
  border: 1px solid rgba(250, 140, 22, 0.2);
  border-radius: 8px;
}

.join-preview-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.join-preview-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.join-condition-item {
  font-size: 13px;
  color: #D46B08;
  font-family: 'Courier New', monospace;
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
