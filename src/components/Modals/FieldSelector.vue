<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click="closeOnOverlay && handleCancel()">
        <div class="modal-container field-selector-modal" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">选择字段</h3>
            <button class="modal-close" @click="handleCancel()">&times;</button>
          </div>

          <div class="modal-body">
            <!-- 数据源信息 -->
            <div class="source-info">
              <span class="source-icon">🗄️</span>
              <span class="source-name">{{ sourceName }}</span>
              <span class="source-type">{{ sourceType }}</span>
            </div>

            <!-- Join类型选择 -->
            <div class="join-type-selector">
              <label class="join-type-label">Join 连接类型：</label>
              <select v-model="globalJoinType" class="join-type-select">
                <option value="INNER">INNER（内连接）</option>
                <option value="CROSS">CROSS（交叉连接）</option>
              </select>
              <span class="join-type-hint">
                {{ globalJoinType === 'INNER' ? '只保留匹配的数据行' : '保留所有数据行进行笛卡尔积' }}
              </span>
            </div>

            <!-- 字段表格 -->
            <div class="field-table-container">
              <table class="field-table">
                <thead>
                  <tr>
                    <th class="col-drag"></th>
                    <th class="col-select">选择</th>
                    <th class="col-name">字段名</th>
                    <th class="col-type">类型</th>
                    <th class="col-alias">别名</th>
                    <th class="col-join">Join</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(field, index) in fields"
                    :key="field.columnName"
                    :class="{
                      selected: field.selected,
                      dragging: dragState.index === index
                    }"
                    :draggable="field.selected"
                    @dragstart="handleDragStart($event, index)"
                    @dragend="handleDragEnd"
                    @dragover="handleDragOver($event, index)"
                    @drop="handleDrop($event, index)"
                  >
                    <td class="col-drag">
                      <span v-if="field.selected" class="drag-handle" title="拖拽排序">⋮⋮</span>
                    </td>
                    <td class="col-select">
                      <input
                        :id="`field-select-${index}`"
                        v-model="field.selected"
                        type="checkbox"
                        @change="onFieldSelectionChange(field)"
                      />
                    </td>
                    <td class="col-name">
                      <label :for="`field-select-${index}`">{{ field.columnName }}</label>
                    </td>
                    <td class="col-type">
                      <span class="field-type">{{ field.columnType }}</span>
                    </td>
                    <td class="col-alias">
                      <input
                        v-model="field.columnAlias"
                        type="text"
                        class="alias-input"
                        :class="{ conflicted: isAliasConflicted(field) }"
                        placeholder="默认=字段名"
                        :disabled="!field.selected"
                        @input="checkAliasConflict(field)"
                      />
                      <span v-if="isAliasConflicted(field)" class="conflict-mark">*</span>
                    </td>
                    <td class="col-join">
                      <input
                        :id="`field-join-${index}`"
                        v-model="field.isJoinField"
                        type="checkbox"
                        :disabled="!field.selected"
                        @change="onJoinFieldChange(field)"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 别名冲突提示 -->
            <div v-if="conflictedAliases.size > 0" class="alert alert-conflict">
              <span class="alert-icon">⚠️</span>
              <span>检测到别名冲突：{{ Array.from(conflictedAliases).join(', ') }}</span>
            </div>

            <!-- Join字段提示 -->
            <div v-if="joinFieldCount === 0 && selectedCount > 0" class="alert alert-warning">
              <span class="alert-icon">⚠️</span>
              <span>至少需要选择一个字段作为Join字段</span>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" @click="handleCancel()">取消</button>
            <button class="btn btn-primary" :disabled="!isValid" @click="handleConfirm()">
              确认
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import type { FieldInfo, FieldMapping } from '@/types/nodes'

interface FieldMappingWithSelection extends FieldMapping {
  selected: boolean
}

interface Props {
  modelValue: boolean
  sourceNodeId: string
  sourceName: string
  sourceType: string
  participantId: string
  dataset: string
  availableFields?: FieldInfo[]
  initialSelection?: FieldMapping[]
  closeOnOverlay?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', selection: {
    sourceNodeId: string
    sourceType: 'dataSource' | 'outputData'
    participantId: string
    dataset: string
    fields: FieldMapping[]
  }): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  availableFields: () => [],
  initialSelection: () => [],
  closeOnOverlay: true
})

const emit = defineEmits<Emits>()

// 全局 Join 类型（整个数据源统一）
const globalJoinType = ref<'INNER' | 'CROSS'>('INNER')

// 字段列表（带选择状态）
const fields = ref<FieldMappingWithSelection[]>([])

// 拖拽状态
const dragState = reactive({
  index: -1
})

// 已选择的字段数量
const selectedCount = ref(0)

// Join字段数量
const joinFieldCount = computed(() => {
  return fields.value.filter(f => f.selected && f.isJoinField).length
})

// 冲突的别名集合
const conflictedAliases = ref<Set<string>>(new Set())

// 是否有效（至少选择一个字段且有Join字段）
const isValid = computed(() => {
  return selectedCount.value > 0 && joinFieldCount.value > 0
})

// 监听 modelValue 变化
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    initializeFields()
  }
})

/**
 * 初始化字段列表
 */
function initializeFields() {
  // 从可用字段初始化
  const initialFields: FieldMappingWithSelection[] = props.availableFields.map(field => ({
    columnName: field.name,
    columnAlias: field.name,
    columnType: field.dataType,
    isJoinField: field.isPrimaryKey || false,  // 主键默认为 join 键
    joinType: 'INNER' as const,
    selected: true  // 默认选中所有字段
  }))

  // 如果有初始选择，恢复选择状态（覆盖默认值）
  if (props.initialSelection && props.initialSelection.length > 0) {
    // 先将所有字段设为未选中
    initialFields.forEach(field => {
      field.selected = false
      field.isJoinField = false
    })

    // 然后根据初始选择恢复
    props.initialSelection.forEach(initial => {
      const field = initialFields.find(f => f.columnName === initial.columnName)
      if (field) {
        field.selected = true
        field.columnAlias = initial.columnAlias
        field.isJoinField = initial.isJoinField || false
        field.joinType = initial.joinType || 'INNER'
      }
    })
  }

  fields.value = initialFields
  updateSelectedCount()
  checkAllAliases()
}

/**
 * 处理字段选择变化
 */
function onFieldSelectionChange(field: FieldMappingWithSelection) {
  // 如果取消选择，清除 isJoinField
  if (!field.selected) {
    field.isJoinField = false
  }

  updateSelectedCount()
  checkAllAliases()
}

/**
 * 处理Join字段变化
 */
function onJoinFieldChange(_field: FieldMappingWithSelection) {
  // Join字段变化时需要重新检查
}

/**
 * 更新已选择字段数量
 */
function updateSelectedCount() {
  selectedCount.value = fields.value.filter(f => f.selected).length
}

/**
 * 检查单个字段的别名是否冲突
 */
function isAliasConflicted(field: FieldMappingWithSelection): boolean {
  if (!field.selected) return false
  const alias = field.columnAlias || field.columnName
  return conflictedAliases.value.has(alias)
}

/**
 * 检查别名冲突
 */
function checkAliasConflict(_field: FieldMappingWithSelection) {
  checkAllAliases()
}

/**
 * 检查所有别名冲突
 */
function checkAllAliases() {
  const aliasCount = new Map<string, number>()
  const conflicts = new Set<string>()

  // 只统计已选择字段的别名
  fields.value.forEach(field => {
    if (field.selected) {
      const alias = field.columnAlias || field.columnName
      aliasCount.set(alias, (aliasCount.get(alias) || 0) + 1)
    }
  })

  // 找出重复的别名
  aliasCount.forEach((count, alias) => {
    if (count > 1) {
      conflicts.add(alias)
    }
  })

  conflictedAliases.value = conflicts
}

// ========== 拖拽排序相关 ==========

/**
 * 拖拽开始
 */
function handleDragStart(event: DragEvent, index: number) {
  dragState.index = index

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', index.toString())
  }
}

/**
 * 拖拽结束
 */
function handleDragEnd() {
  dragState.index = -1
}

/**
 * 拖拽经过
 */
function handleDragOver(event: DragEvent, _index: number) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

/**
 * 放置
 */
function handleDrop(event: DragEvent, targetIndex: number) {
  event.preventDefault()

  if (dragState.index === -1 || dragState.index === targetIndex) {
    return
  }

  // 重新排序
  const fieldsList = [...fields.value]
  const removed = fieldsList.splice(dragState.index, 1)
  const movedField = removed[0]
  if (movedField) {
    fieldsList.splice(targetIndex, 0, movedField)
    fields.value = fieldsList
  }

  // 重置拖拽状态
  handleDragEnd()
}

/**
 * 获取选中的字段映射
 */
function getSelectedFields(): FieldMapping[] {
  return fields.value
    .filter(f => f.selected)
    .map(({ selected, joinType, ...rest }) => ({
      ...rest,
      joinType: globalJoinType.value
    }))
}

/**
 * 处理确认
 */
function handleConfirm() {
  if (!isValid.value) return

  emit('confirm', {
    sourceNodeId: props.sourceNodeId,
    sourceType: props.sourceType === 'data_source' ? 'dataSource' : 'outputData',
    participantId: props.participantId,
    dataset: props.dataset,
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
  fields.value = []
  conflictedAliases.value.clear()
  dragState.index = -1
}
</script>

<style scoped lang="scss">
.field-selector-modal {
  max-width: 900px;
}

.source-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-radius: 6px;
  margin-bottom: 16px;

  .source-icon {
    font-size: 18px;
  }

  .source-name {
    flex: 1;
    font-weight: 600;
    color: #303133;
  }

  .source-type {
    font-size: 12px;
    color: #909399;
    padding: 4px 10px;
    background-color: #e4e7ed;
    border-radius: 4px;
  }
}

.join-type-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background-color: #f0f7ff;
  border: 1px solid #d6e4ff;
  border-radius: 6px;
  margin-bottom: 16px;

  .join-type-label {
    font-size: 13px;
    font-weight: 600;
    color: #303133;
    white-space: nowrap;
  }

  .join-type-select {
    padding: 6px 12px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    font-size: 13px;
    background-color: #ffffff;
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
  }

  .join-type-hint {
    font-size: 12px;
    color: #606266;
  }
}

.field-table-container {
  margin-bottom: 16px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  overflow: hidden;
}

.field-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  thead {
    background-color: #f5f7fa;

    th {
      padding: 12px 8px;
      text-align: left;
      font-weight: 600;
      color: #606266;
      border-bottom: 1px solid #e8e8e8;
      white-space: nowrap;

      &.col-drag {
        width: 40px;
        text-align: center;
      }

      &.col-select {
        width: 50px;
        text-align: center;
      }

      &.col-name {
        width: 150px;
      }

      &.col-type {
        width: 100px;
      }

      &.col-alias {
        width: 180px;
      }

      &.col-join {
        width: 60px;
        text-align: center;
      }
    }
  }

  tbody {
    tr {
      border-bottom: 1px solid #f0f0f0;
      transition: background-color 0.2s;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background-color: #fafafa;
      }

      &.selected {
        background-color: #e6f7ff;
      }

      &.dragging {
        opacity: 0.5;
        background-color: #bae7ff;
      }

      td {
        padding: 10px 8px;

        &.col-drag,
        &.col-select,
        &.col-join {
          text-align: center;
        }
      }
    }
  }
}

.drag-handle {
  display: inline-block;
  cursor: grab;
  color: #bfbfbf;
  font-size: 14px;
  opacity: 0.6;
  transition: all 0.2s;
  padding: 4px;

  &:hover {
    opacity: 1;
    color: #1890ff;
  }

  &:active {
    cursor: grabbing;
  }
}

.field-type {
  display: inline-block;
  padding: 2px 8px;
  font-size: 11px;
  color: #606266;
  background-color: #f0f2f5;
  border-radius: 3px;
}

.alias-input {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #1890ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
  }

  &:disabled {
    background-color: #f5f5f5;
    color: #bfbfbf;
    cursor: not-allowed;
  }

  &.conflicted {
    border-color: #ff4d4f;

    &:focus {
      border-color: #ff4d4f;
      box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.1);
    }
  }
}

.conflict-mark {
  position: absolute;
  margin-left: -18px;
  margin-top: 6px;
  color: #ff4d4f;
  font-weight: bold;
  font-size: 14px;
}

.alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  margin-top: 12px;

  &.alert-conflict {
    background-color: #fff2f0;
    border: 1px solid #ffccc7;
    color: #ff4d4f;
  }

  &.alert-warning {
    background-color: #fef0f0;
    border: 1px solid #fde2e2;
    color: #e6a23c;
    background-color: #fdf6ec;
    border-color: #faecd8;
  }

  .alert-icon {
    font-size: 16px;
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
