<template>
  <el-dialog
    v-model="visible"
    title="选择字段"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="field-selector">
      <!-- 数据源信息 -->
      <div class="source-info">
        <span>🗄️</span>
        <span class="source-name">{{ sourceName }}</span>
        <span class="source-type">{{ sourceType }}</span>
      </div>

      <!-- 字段列表 -->
      <div class="field-list-container">
        <el-table
          :data="fields"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="columnName" label="字段名" width="180" />
          <el-table-column prop="columnType" label="类型" width="120" />
          <el-table-column label="别名" width="180">
            <template #default="{ row }">
              <el-input
                v-model="row.columnAlias"
                placeholder="默认=字段名"
                size="small"
                @input="checkAliasConflict(row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="Join字段" width="100" align="center">
            <template #default="{ row }">
              <el-checkbox
                v-model="row.isJoinField"
                :disabled="!row.selected"
              />
            </template>
          </el-table-column>
          <el-table-column label="连接类型" width="120">
            <template #default="{ row }">
              <el-select
                v-model="row.joinType"
                placeholder="选择类型"
                size="small"
                :disabled="!row.isJoinField"
              >
                <el-option label="INNER" value="INNER" />
                <el-option label="CROSS" value="CROSS" />
              </el-select>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 别名冲突提示 -->
      <div v-if="conflictedAliases.size > 0" class="conflict-warning">
        <span style="color: #E6A23C;">⚠️</span>
        <span>检测到别名冲突：{{ Array.from(conflictedAliases).join(', ') }}</span>
      </div>

      <!-- Join字段提示 -->
      <div v-if="joinFieldCount === 0 && selectedCount > 0" class="join-warning">
        <span style="color: #E6A23C;">⚠️</span>
        <span>至少需要选择一个字段作为Join字段</span>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button
          type="primary"
          :disabled="!isValid"
          @click="handleConfirm"
        >
          确认
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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
  initialSelection: () => []
})

const emit = defineEmits<Emits>()

// 对话框可见性
const visible = ref(false)

// 字段列表（带选择状态）
const fields = ref<FieldMappingWithSelection[]>([])

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
  visible.value = newVal
  if (newVal) {
    initializeFields()
  }
})

// 监听 visible 变化
watch(visible, (newVal) => {
  if (!newVal) {
    emit('update:modelValue', false)
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
    isJoinField: false,
    joinType: 'INNER',
    selected: false
  }))

  // 如果有初始选择，恢复选择状态
  if (props.initialSelection && props.initialSelection.length > 0) {
    props.initialSelection.forEach(initial => {
      const field = initialFields.find(f => f.columnName === initial.columnName)
      if (field) {
        field.selected = true
        field.columnAlias = initial.columnAlias
        field.isJoinField = initial.isJoinField
        field.joinType = initial.joinType || 'INNER'
      }
    })
  }

  fields.value = initialFields
  updateSelectedCount()
  checkAllAliases()
}

/**
 * 处理选择变化
 */
function handleSelectionChange(selection: FieldMappingWithSelection[]) {
  // 更新所有字段的选择状态
  const selectedIds = new Set(selection.map(f => f.columnName))
  fields.value.forEach(field => {
    field.selected = selectedIds.has(field.columnName)
    // 如果取消选择，清除 isJoinField
    if (!field.selected) {
      field.isJoinField = false
    }
  })

  updateSelectedCount()
  checkAllAliases()
}

/**
 * 更新已选择字段数量
 */
function updateSelectedCount() {
  selectedCount.value = fields.value.filter(f => f.selected).length
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

/**
 * 获取选中的字段映射
 */
function getSelectedFields(): FieldMapping[] {
  return fields.value
    .filter(f => f.selected)
    .map(({ selected, ...rest }) => rest)
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
  visible.value = false
  fields.value = []
  conflictedAliases.value.clear()
}
</script>

<style scoped lang="scss">
.field-selector {
  .source-info {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background-color: #f5f7fa;
    border-radius: 6px;
    margin-bottom: 16px;

    .source-name {
      flex: 1;
      font-weight: 600;
      color: #303133;
    }

    .source-type {
      font-size: 12px;
      color: #909399;
      padding: 2px 8px;
      background-color: #e4e7ed;
      border-radius: 4px;
    }
  }

  .field-list-container {
    margin-bottom: 16px;
  }

  .conflict-warning,
  .join-warning {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background-color: #fdf6ec;
    border: 1px solid #faecd8;
    border-radius: 6px;
    color: #e6a23c;
    font-size: 14px;
    margin-top: 12px;
  }

  .conflict-warning {
    background-color: #fef0f0;
    border-color: #fde2e2;
    color: #f56c6c;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

:deep(.el-dialog__body) {
  padding: 16px 20px;
}

:deep(.el-table) {
  font-size: 13px;

  .el-table__header {
    th {
      background-color: #f5f7fa;
      font-weight: 600;
      color: #606266;
    }
  }

  .el-table__body {
    tr:hover {
      background-color: #f5f7fa;
    }
  }
}
</style>
