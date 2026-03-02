<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click="closeOnOverlay && handleCancel()">
        <div class="modal-container input-provider-config-modal" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">配置输入数据源</h3>
            <button class="modal-close" @click="handleCancel()">&times;</button>
          </div>

          <div class="modal-body">
            <!-- 数据源信息 -->
            <div class="source-info">
              <span class="source-icon">🗄️</span>
              <div class="source-details">
                <span class="source-name">{{ participantName }}</span>
                <span class="source-dataset">{{ dataset }}</span>
              </div>
            </div>

            <!-- Join 类型选择 -->
            <div class="join-type-selector">
              <label class="join-type-label">Join 连接类型：</label>
              <select v-model="globalJoinType" class="join-type-select">
                <option value="INNER">INNER（内连接）</option>
                <option value="CROSS">CROSS（交叉连接）</option>
                <option value="Union">UNION（横向拼接）</option>
                <option value="NoAssoc">NOASSOC（无关联）</option>
              </select>
              <span class="join-type-hint">
                {{ joinTypeHint }}
              </span>
            </div>

            <!-- 字段表格（支持拖拽排序） -->
            <div class="field-table-container">
              <table class="field-table">
                <thead>
                  <tr>
                    <th class="col-drag"></th>
                    <th class="col-select">选择</th>
                    <th class="col-name">字段名</th>
                    <th class="col-type">类型</th>
                    <th class="col-alias">别名</th>
                    <th class="col-join" :class="{ 'col-disabled': !needsJoinFields }">Join键</th>
                  </tr>
                </thead>
                <tbody ref="tableBody">
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
                    <td class="col-join" :class="{ 'col-disabled': !needsJoinFields }">
                      <input
                        :id="`field-join-${index}`"
                        v-model="field.isJoinField"
                        type="checkbox"
                        :disabled="!field.selected || !needsJoinFields"
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

            <!-- Join字段提示（仅 INNER 类型显示） -->
            <div v-if="needsJoinFields && joinFieldCount === 0 && selectedCount > 0" class="alert alert-warning">
              <span class="alert-icon">⚠️</span>
              <span>建议至少选择一个字段作为Join键</span>
            </div>

            <!-- 字段统计 -->
            <div class="field-stats">
              <span class="stat-item">
                已选择 <strong>{{ selectedCount }}</strong> 个字段
              </span>
              <span v-if="needsJoinFields" class="stat-item">
                Join键 <strong>{{ joinFieldCount }}</strong> 个
              </span>
            </div>

            <!-- Union 字段对齐配置已移至详情面板的 Join 条件 section -->
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
import type { FieldMapping, InputProvider, FieldInfo, JoinType } from '@/types/nodes'
// 内部使用的字段类型（扩展 FieldMapping 添加 selected 和排序属性）
interface InternalField extends FieldMapping {
  selected: boolean
}

interface Props {
  modelValue: boolean
  provider: InputProvider | null
  availableFields: FieldInfo[]
  participantName?: string
  closeOnOverlay?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', data: {
    sourceNodeId: string
    fields: FieldMapping[]
    joinType?: JoinType
  }): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  participantName: '',
  closeOnOverlay: true
})

const emit = defineEmits<Emits>()

// 数据源信息
const dataset = computed(() => props.provider?.dataset || '')
const participantName = computed(() => props.participantName || props.provider?.participantId || '')

// 全局 Join 类型
const globalJoinType = ref<JoinType>('INNER')

// 字段列表（带选择状态）
const fields = ref<InternalField[]>([])

// 拖拽状态
const dragState = reactive({
  index: -1
})

// 冲突的别名集合
const conflictedAliases = ref<Set<string>>(new Set())

// 已选择的字段数量
const selectedCount = computed(() => {
  return fields.value.filter(f => f.selected).length
})

// Join字段数量
const joinFieldCount = computed(() => {
  return fields.value.filter(f => f.selected && f.isJoinField).length
})

// 是否有效（至少选择一个字段）
const isValid = computed(() => {
  return selectedCount.value > 0 && conflictedAliases.value.size === 0
})

// Join 类型提示文本
const joinTypeHint = computed(() => {
  switch (globalJoinType.value) {
    case 'INNER':
      return '只保留匹配的数据行'
    case 'CROSS':
      return '保留所有数据行进行笛卡尔积'
    case 'Union':
      return '横向拼接多个数据源，需要字段对齐'
    case 'NoAssoc':
      return '独立处理，不参与关联'
    default:
      return ''
  }
})

// 是否需要 join 字段（INNER 类型需要）
const needsJoinFields = computed(() => {
  return globalJoinType.value === 'INNER'
})

// 监听 modelValue 变化，初始化数据
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    initializeFields()
  }
})

// 监听 joinType 变化
watch(globalJoinType, () => {
  // 切换类型时不需要特殊处理
})

/**
 * 初始化字段列表
 */
function initializeFields() {
  // 从可用字段初始化
  const initialFields: InternalField[] = props.availableFields.map(field => ({
    columnName: field.name,
    columnAlias: field.name,
    columnType: field.dataType,
    isJoinField: field.isPrimaryKey || false,
    joinType: 'INNER' as const,
    selected: true  // 默认选中所有字段
  }))

  // 如果有已有配置，恢复选择状态
  if (props.provider && props.provider.fields.length > 0) {
    // 先将所有字段设为未选中
    initialFields.forEach(field => {
      field.selected = false
      field.isJoinField = false
    })

    // 根据已有配置恢复，并保持顺序
    const configuredFields: InternalField[] = []
    const unconfiguredFields: InternalField[] = []

    props.provider.fields.forEach(configuredField => {
      const field = initialFields.find(f => f.columnName === configuredField.columnName)
      if (field) {
        field.selected = true
        field.columnAlias = configuredField.columnAlias
        field.isJoinField = configuredField.isJoinField || false
        field.joinType = configuredField.joinType || 'INNER'
        configuredFields.push(field)
      }
    })

    // 未配置的字段按原始顺序添加
    initialFields.forEach(field => {
      if (!field.selected) {
        unconfiguredFields.push(field)
      }
    })

    // 已配置的字段排在前面，未配置的排在后面
    fields.value = [...configuredFields, ...unconfiguredFields]

    // 从已有配置中获取 Join 类型
    if (props.provider.joinType) {
      globalJoinType.value = props.provider.joinType
    } else if (props.provider.fields.length > 0 && props.provider.fields[0]?.joinType) {
      globalJoinType.value = props.provider.fields[0].joinType
    }
  } else {
    fields.value = initialFields
  }

  checkAllAliases()
}

/**
 * 处理字段选择变化
 */
function onFieldSelectionChange(field: InternalField) {
  // 如果取消选择，清除 isJoinField
  if (!field.selected) {
    field.isJoinField = false
  }
  checkAllAliases()
}

/**
 * 处理Join字段变化
 */
function onJoinFieldChange(_field: InternalField) {
  // Join字段变化时需要重新检查
}

/**
 * 检查单个字段的别名是否冲突
 */
function isAliasConflicted(field: InternalField): boolean {
  if (!field.selected) return false
  const alias = field.columnAlias || field.columnName
  return conflictedAliases.value.has(alias)
}

/**
 * 检查别名冲突
 */
function checkAliasConflict(_field: InternalField) {
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

/**
 * 获取选中的字段映射
 */
function getSelectedFields(): FieldMapping[] {
  return fields.value
    .filter(f => f.selected)
    .map(({ selected, ...rest }) => ({
      ...rest,
      joinType: globalJoinType.value
    }))
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
 * 处理确认
 */
function handleConfirm() {
  if (!isValid.value || !props.provider) return

  emit('confirm', {
    sourceNodeId: props.provider.sourceNodeId,
    fields: getSelectedFields(),
    joinType: globalJoinType.value
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
.input-provider-config-modal {
  max-width: 800px;
  width: 90%;
}

.source-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f0f7ff 0%, #e6f7ff 100%);
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid #d6e4ff;

  .source-icon {
    font-size: 24px;
  }

  .source-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .source-name {
    font-weight: 600;
    color: #303133;
    font-size: 14px;
  }

  .source-dataset {
    font-size: 12px;
    color: #606266;
    padding: 2px 8px;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 4px;
    display: inline-block;
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
  max-height: 400px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f5f5f5;
  }

  &::-webkit-scrollbar-thumb {
    background: #d9d9d9;
    border-radius: 3px;

    &:hover {
      background: #bfbfbf;
    }
  }
}

.field-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  thead {
    background-color: #f5f7fa;
    position: sticky;
    top: 0;
    z-index: 1;

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

        &.col-disabled {
          opacity: 0.5;
        }
      }
    }
  }

  tbody {
    tr {
      border-bottom: 1px solid #f0f0f0;
      transition: all 0.2s;

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

          &.col-disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
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

.field-stats {
  display: flex;
  gap: 16px;
  padding: 10px 16px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 13px;
  color: #606266;

  .stat-item {
    strong {
      color: #1890ff;
      font-weight: 600;
    }
  }
}

.alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  margin-bottom: 12px;

  &.alert-conflict {
    background-color: #fff2f0;
    border: 1px solid #ffccc7;
    color: #ff4d4f;
  }

  &.alert-warning {
    background-color: #fdf6ec;
    border: 1px solid #faecd8;
    color: #e6a23c;
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
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
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
  flex: 1;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e8e8e8;
  flex-shrink: 0;
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
