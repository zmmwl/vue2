<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click="closeOnOverlay && handleCancel()">
        <div class="modal-container union-align-dialog" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">Union 字段对齐配置</h3>
            <button class="modal-close" @click="handleCancel()">&times;</button>
          </div>

          <div class="modal-body">
            <!-- 数据源列表 -->
            <div class="providers-info">
              <span class="info-label">已连接数据源：</span>
              <span v-for="(provider, index) in providers" :key="provider.sourceNodeId" class="provider-badge">
                {{ index + 1 }}. {{ getProviderLabel(provider) }}
              </span>
            </div>

            <!-- 操作按钮 -->
            <div class="action-buttons">
              <button class="btn btn-secondary" @click="autoAlignByName" title="以第一个数据源为基准，对齐其他数据源中相同名称的字段">
                🔗 自动对齐相同名称
              </button>
              <button class="btn btn-secondary" @click="autoGenerateAliases" title="根据对齐的字段自动生成别名">
                ✏️ 自动生成别名
              </button>
            </div>

            <!-- 字段对齐表格 -->
            <div class="align-table-container">
              <table class="align-table">
                <thead>
                  <tr>
                    <th class="col-index">#</th>
                    <th class="col-alias">统一别名</th>
                    <th
                      v-for="(provider, pIndex) in providers"
                      :key="provider.sourceNodeId"
                      class="col-source"
                    >
                      数据源 {{ pIndex + 1 }}
                      <span class="source-name">({{ getProviderShortLabel(provider) }})</span>
                    </th>
                    <th class="col-actions">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(row, rowIndex) in alignRows"
                    :key="rowIndex"
                    class="align-row"
                    :class="{ 'row-warning': !isRowComplete(rowIndex) }"
                  >
                    <td class="col-index">{{ rowIndex + 1 }}</td>
                    <td class="col-alias">
                      <input
                        v-model="row.alias"
                        type="text"
                        class="alias-input"
                        placeholder="输入别名"
                        @input="handleAliasChange"
                      />
                    </td>
                    <td
                      v-for="(provider, pIndex) in providers"
                      :key="provider.sourceNodeId"
                      class="col-source"
                    >
                      <div class="field-cell">
                        <select
                          v-model="row.fieldIndices[pIndex]"
                          class="field-select"
                          @change="handleFieldChange"
                        >
                          <option :value="null">-- 选择字段 --</option>
                          <option
                            v-for="field in getAvailableFieldsForSlot(pIndex, rowIndex)"
                            :key="field.columnName"
                            :value="field.columnName"
                          >
                            {{ field.columnName }} ({{ field.columnType }})
                          </option>
                        </select>
                        <div class="field-actions">
                          <button
                            class="move-btn"
                            :disabled="rowIndex === 0"
                            @click="moveRowUp(rowIndex)"
                            title="上移"
                          >↑</button>
                          <button
                            class="move-btn"
                            :disabled="rowIndex === alignRows.length - 1"
                            @click="moveRowDown(rowIndex)"
                            title="下移"
                          >↓</button>
                        </div>
                      </div>
                    </td>
                    <td class="col-actions">
                      <button class="delete-btn" @click="removeRow(rowIndex)" title="删除此行">
                        ✕
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 添加行按钮 -->
            <div class="add-row-section">
              <button class="add-row-btn" @click="addRow">
                + 添加字段行
              </button>
            </div>

            <!-- 状态提示 -->
            <div class="status-section">
              <span class="status-item" :class="{ complete: isAllRowsComplete }">
                {{ isAllRowsComplete ? '✓' : '○' }} 所有字段已配置
              </span>
              <span class="status-item">
                字段数：{{ alignRows.length }}
              </span>
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
import { ref, computed, watch } from 'vue'
import type { InputProvider, FieldMapping } from '@/types/nodes'

interface Props {
  modelValue: boolean
  providers: InputProvider[]
  closeOnOverlay?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', data: { updatedProviders: InputProvider[] }): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  closeOnOverlay: true
})

const emit = defineEmits<Emits>()

// 对齐行数据结构
interface AlignRow {
  alias: string
  fieldIndices: (string | null)[]  // 每个数据源选中的字段名
}

// 本地对齐行数据
const alignRows = ref<AlignRow[]>([])

// 获取数据源标签
function getProviderLabel(provider: InputProvider): string {
  return `${provider.participantId} - ${provider.dataset}`
}

function getProviderShortLabel(provider: InputProvider): string {
  return provider.dataset || provider.participantId
}

// 获取某个槽位可用的字段列表
function getAvailableFieldsForSlot(providerIndex: number, rowIndex: number): FieldMapping[] {
  const provider = props.providers[providerIndex]
  if (!provider?.fields) return []

  // 获取当前行已选择的字段
  const currentSelected = alignRows.value[rowIndex]?.fieldIndices[providerIndex]

  // 获取其他行已选择的字段
  const otherSelected = new Set<string>()
  alignRows.value.forEach((row, idx) => {
    if (idx !== rowIndex && row.fieldIndices[providerIndex]) {
      otherSelected.add(row.fieldIndices[providerIndex]!)
    }
  })

  // 返回未被其他行选择的字段（当前行已选择的也要包含）
  return provider.fields.filter(f =>
    !otherSelected.has(f.columnName) || f.columnName === currentSelected
  )
}

// 检查行是否完整（所有数据源都选择了字段）
function isRowComplete(rowIndex: number): boolean {
  const row = alignRows.value[rowIndex]
  if (!row) return false
  return row.fieldIndices.every(f => f !== null)
}

// 是否所有行都完整
const isAllRowsComplete = computed(() => {
  if (alignRows.value.length === 0) return false
  return alignRows.value.every((_, idx) => isRowComplete(idx))
})

// 是否有效（至少有一行完整的配置）
const isValid = computed(() => {
  return alignRows.value.length > 0 && isAllRowsComplete.value
})

// 处理别名变化
function handleAliasChange() {
  // 别名变化不需要特殊处理
}

// 处理字段选择变化
function handleFieldChange() {
  // 字段变化不需要特殊处理
}

// 添加新行
function addRow() {
  alignRows.value.push({
    alias: '',
    fieldIndices: props.providers.map(() => null)
  })
}

// 删除行
function removeRow(rowIndex: number) {
  alignRows.value.splice(rowIndex, 1)
}

// 上移行
function moveRowUp(rowIndex: number) {
  if (rowIndex <= 0) return
  const rows = alignRows.value
  const temp = rows[rowIndex]
  const prevTemp = rows[rowIndex - 1]
  if (temp && prevTemp) {
    rows[rowIndex] = prevTemp
    rows[rowIndex - 1] = temp
  }
}

// 下移行
function moveRowDown(rowIndex: number) {
  if (rowIndex >= alignRows.value.length - 1) return
  const rows = alignRows.value
  const temp = rows[rowIndex]
  const nextTemp = rows[rowIndex + 1]
  if (temp && nextTemp) {
    rows[rowIndex] = nextTemp
    rows[rowIndex + 1] = temp
  }
}

// 自动对齐相同名称
function autoAlignByName() {
  if (props.providers.length < 2) return

  const baseProvider = props.providers[0]
  if (!baseProvider?.fields) return

  // 清空现有行
  alignRows.value = []

  // 以第一个数据源为基准
  baseProvider.fields.forEach(baseField => {
    const row: AlignRow = {
      alias: baseField.columnAlias || baseField.columnName,
      fieldIndices: [baseField.columnName]
    }

    // 在其他数据源中查找同名字段
    for (let i = 1; i < props.providers.length; i++) {
      const provider = props.providers[i]
      const matchingField = provider?.fields?.find(
        f => f.columnName === baseField.columnName
      )
      row.fieldIndices.push(matchingField ? matchingField.columnName : null)
    }

    alignRows.value.push(row)
  })
}

// 自动生成别名
function autoGenerateAliases() {
  alignRows.value.forEach(row => {
    if (!row.alias) {
      // 找到第一个非空的字段名作为别名
      const firstFieldName = row.fieldIndices.find(f => f !== null)
      if (firstFieldName) {
        row.alias = firstFieldName
      }
    }
  })
}

// 初始化数据
function initializeData() {
  if (!props.providers || props.providers.length === 0) {
    alignRows.value = []
    return
  }

  // 检查是否已有对齐数据（通过检查所有 provider 的字段顺序是否一致）
  const firstProvider = props.providers[0]
  if (!firstProvider?.fields?.length) {
    alignRows.value = []
    return
  }

  // 初始化对齐行
  const rows: AlignRow[] = []
  const maxFields = Math.max(...props.providers.map(p => p.fields?.length || 0))

  for (let i = 0; i < maxFields; i++) {
    const row: AlignRow = {
      alias: '',
      fieldIndices: props.providers.map(p => p.fields?.[i]?.columnName || null)
    }

    // 如果第一个数据源有这个字段，设置别名
    const firstProviderField = firstProvider.fields?.[i]
    if (firstProviderField) {
      row.alias = firstProviderField.columnAlias || firstProviderField.columnName
    }

    rows.push(row)
  }

  alignRows.value = rows
}

// 监听弹窗显示
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    initializeData()
  }
})

// 处理取消
function handleCancel() {
  emit('update:modelValue', false)
  emit('cancel')
}

// 处理确认
function handleConfirm() {
  if (!isValid.value) return

  // 构建更新后的 providers
  const updatedProviders = props.providers.map((provider, pIndex) => ({
    ...provider,
    fields: alignRows.value
      .filter(row => row.fieldIndices[pIndex] !== null)
      .map(row => {
        const fieldName = row.fieldIndices[pIndex]!
        const originalField = provider.fields?.find(f => f.columnName === fieldName)
        return {
          ...(originalField || {}),
          columnName: fieldName,
          columnAlias: row.alias || fieldName,
          columnType: originalField?.columnType || 'STRING',
          isJoinField: false
        } as FieldMapping
      })
  }))

  emit('confirm', { updatedProviders })
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
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 900px;
  max-height: 85vh;
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
  padding: 20px;
}

.providers-info {
  margin-bottom: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;

  .info-label {
    font-weight: 600;
    color: #606266;
    margin-right: 8px;
  }

  .provider-badge {
    display: inline-block;
    margin-right: 8px;
    padding: 2px 8px;
    background: #e6f7ff;
    border-radius: 4px;
    font-size: 12px;
    color: #1890ff;
  }
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.align-table-container {
  overflow-x: auto;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
}

.align-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  th, td {
    padding: 10px 12px;
    border: 1px solid #e8e8e8;
    text-align: left;
  }

  th {
    background: #fafafa;
    font-weight: 600;
    color: #303133;
    white-space: nowrap;

    .source-name {
      font-weight: 400;
      color: #909399;
      font-size: 11px;
    }
  }

  .col-index {
    width: 40px;
    text-align: center;
  }

  .col-alias {
    width: 140px;
  }

  .col-source {
    min-width: 180px;
  }

  .col-actions {
    width: 60px;
    text-align: center;
  }

  .align-row {
    &.row-warning {
      background: #fffbe6;
    }
  }

  .alias-input {
    width: 100%;
    padding: 6px 8px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    font-size: 13px;

    &:focus {
      border-color: #1890ff;
      outline: none;
    }
  }

  .field-cell {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .field-select {
    flex: 1;
    padding: 6px 8px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    font-size: 13px;
    min-width: 120px;

    &:focus {
      border-color: #1890ff;
      outline: none;
    }
  }

  .field-actions {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .move-btn {
    padding: 2px 6px;
    border: 1px solid #d9d9d9;
    background: #fff;
    border-radius: 2px;
    font-size: 10px;
    cursor: pointer;
    line-height: 1;

    &:hover:not(:disabled) {
      background: #f0f0f0;
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  .delete-btn {
    padding: 4px 8px;
    border: none;
    background: #ff4d4f;
    color: white;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;

    &:hover {
      background: #ff7875;
    }
  }
}

.add-row-section {
  margin-top: 12px;
}

.add-row-btn {
  padding: 8px 16px;
  border: 1px dashed #d9d9d9;
  background: #fafafa;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  width: 100%;

  &:hover {
    border-color: #1890ff;
    color: #1890ff;
  }
}

.status-section {
  margin-top: 16px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
  display: flex;
  gap: 16px;

  .status-item {
    font-size: 12px;
    color: #909399;

    &.complete {
      color: #52c41a;
    }
  }
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
