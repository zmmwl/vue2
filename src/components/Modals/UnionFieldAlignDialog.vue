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
                {{ index + 1}}. {{ getProviderLabel(provider) }}
              </span>
            </div>

            <!-- 操作按钮 -->
            <div class="action-buttons">
              <button class="btn btn-secondary" @click="autoAlignByName" title="以第一个数据源为基准，对齐其他数据源中相同名称的字段">
                🔗 自动对齐相同名称
              </button>
              <button class="btn btn-secondary" @click="autoGenerateAliases" title="根据数据源1的字段自动生成别名">
                ✏️ 自动生成别名
              </button>
            </div>

            <!-- 独立列表格布局 -->
            <div class="align-tables-container">
              <!-- 统一别名列 -->
              <div class="align-column alias-column">
                <div class="column-header">
                  <span class="header-title">统一别名</span>
                  <span class="header-count">({{ aliasList.length }})</span>
                </div>
                <div class="column-body">
                  <div
                    v-for="(_alias, index) in aliasList"
                    :key="index"
                    class="column-row alias-row"
                  >
                    <div class="row-index">{{ index + 1 }}</div>
                    <input
                      v-model="aliasList[index]"
                      type="text"
                      class="alias-input"
                      placeholder="输入别名"
                      @input="handleAliasChange"
                    />
                  </div>
                </div>
              </div>

              <!-- 数据源列 -->
              <div
                v-for="(provider, pIndex) in providers"
                :key="provider.sourceNodeId"
                class="align-column source-column"
              >
                <div class="column-header">
                  <span class="header-title">数据源 {{ pIndex + 1 }}</span>
                  <span class="header-sub">({{ getProviderShortLabel(provider) }})</span>
                </div>
                <div class="column-body">
                  <div
                    v-for="(field, index) in providerFieldLists[pIndex]"
                    :key="field.key"
                    class="column-row field-row"
                    :class="{ dragging: dragState.isDragging && dragState.sourceProviderIndex === pIndex && dragState.sourceFieldIndex === index }"
                    draggable="true"
                    @dragstart="handleDragStart($event, pIndex, index)"
                    @dragover.prevent="handleDragOver($event, pIndex, index)"
                    @drop="handleDrop($event, pIndex, index)"
                    @dragend="handleDragEnd"
                  >
                    <div class="drag-handle" title="拖拽排序">⋮⋮</div>
                    <div class="row-index">{{ index + 1 }}</div>
                    <div class="field-info">
                      <span class="field-name">{{ field.columnName }}</span>
                      <span class="field-type">{{ field.columnType }}</span>
                    </div>
                    <div class="row-actions">
                      <button class="row-action-btn delete-btn" @click="removeField(pIndex, index)" title="删除">
                        ✕
                      </button>
                    </div>
                  </div>
                  <!-- 添加字段按钮 -->
                  <div class="add-field-row" @click="openFieldSelector(pIndex)">
                    <span class="add-icon">+</span>
                    <span class="add-text">添加字段</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 状态提示 -->
            <div class="status-section">
              <span class="status-item" :class="{ complete: isAllRowsComplete }">
                {{ isAllRowsComplete ? '✓' : '○' }} 所有字段已配置
              </span>
              <span class="status-item">
                别名数：{{ aliasList.length }}
              </span>
              <span class="status-item">
                数据源数：{{ providers.length }}
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

    <!-- 字段选择弹窗 -->
    <AddFieldSelector
      v-if="showFieldSelector"
      :model-value="showFieldSelector"
      :provider="currentProvider"
      :excluded-fields="excludedFields"
      @update:model-value="showFieldSelector = false"
      @confirm="handleFieldSelectConfirm"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import type { InputProvider, FieldMapping } from '@/types/nodes'
import AddFieldSelector from './AddFieldSelector.vue'

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

// 内部字段列表结构（带唯一key用于拖拽）
interface InternalField {
  columnName: string
  columnType: string
  key: string  // 唯一标识，用于拖拽
}

// 统一别名列表
const aliasList = ref<string[]>([])

// 各数据源的字段列表（独立管理）
const providerFieldLists = ref<InternalField[][]>([])

// 拖拽状态
const dragState = reactive({
  isDragging: false,
  sourceProviderIndex: -1,
  sourceFieldIndex: -1
})

// 字段选择器状态
const showFieldSelector = ref(false)
const currentProviderIndex = ref(-1)
const currentProvider = computed(() => props.providers[currentProviderIndex.value])
const excludedFields = computed(() => {
  if (currentProviderIndex.value < 0) return []
  return providerFieldLists.value[currentProviderIndex.value]?.map(f => f.columnName) || []
})

// 获取数据源标签
function getProviderLabel(provider: InputProvider): string {
  return `${provider.participantId} - ${provider.dataset}`
}

function getProviderShortLabel(provider: InputProvider): string {
  return provider.dataset || provider.participantId
}

// 生成唯一key
function generateKey(): string {
  return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 初始化数据
function initializeData() {
  if (!props.providers || props.providers.length === 0) {
    aliasList.value = []
    providerFieldLists.value = []
    return
  }

  // 获取数据源1的字段作为基准
  const firstProvider = props.providers[0]
  const firstProviderFields = firstProvider?.fields || []

  // 初始化统一别名列表（与数据源1一致）
  aliasList.value = firstProviderFields.map(f => f.columnAlias || f.columnName)

  // 初始化各数据源的字段列表
  providerFieldLists.value = props.providers.map(provider => {
    return (provider.fields || []).map(f => ({
      columnName: f.columnName,
      columnType: f.columnType || 'STRING',
      key: generateKey()
    }))
  })
}

// 检查是否所有行都完整（每个数据源都有对应字段）
const isAllRowsComplete = computed(() => {
  if (aliasList.value.length === 0) return false
  // 检查每个数据源是否都有字段
  return providerFieldLists.value.every(list => list.length > 0)
})

// 是否有效
const isValid = computed(() => {
  return aliasList.value.length > 0 &&
         aliasList.value.every(a => a.trim() !== '') &&
         isAllRowsComplete.value
})

// 处理别名变化
function handleAliasChange() {
  // 别名变化不需要特殊处理
}

// 拖拽开始
function handleDragStart(event: DragEvent, providerIndex: number, fieldIndex: number) {
  dragState.isDragging = true
  dragState.sourceProviderIndex = providerIndex
  dragState.sourceFieldIndex = fieldIndex

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', `${providerIndex}-${fieldIndex}`)
  }
}

// 拖拽悬停
function handleDragOver(event: DragEvent, _providerIndex: number, _fieldIndex: number) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

// 放置
function handleDrop(event: DragEvent, targetProviderIndex: number, targetFieldIndex: number) {
  event.preventDefault()

  if (!dragState.isDragging) return
  if (dragState.sourceProviderIndex !== targetProviderIndex) return // 只允许同一数据源内拖拽

  const sourceIndex = dragState.sourceFieldIndex
  if (sourceIndex === targetFieldIndex) return

  const list = providerFieldLists.value[targetProviderIndex]
  if (!list) return

  // 移动元素
  const movedItems = list.splice(sourceIndex, 1)
  const movedItem = movedItems[0]
  if (movedItem) {
    list.splice(targetFieldIndex, 0, movedItem)
  }
}

// 拖拽结束
function handleDragEnd() {
  dragState.isDragging = false
  dragState.sourceProviderIndex = -1
  dragState.sourceFieldIndex = -1
}

// 删除字段
function removeField(providerIndex: number, fieldIndex: number) {
  providerFieldLists.value[providerIndex]?.splice(fieldIndex, 1)
}

// 打开字段选择器
function openFieldSelector(providerIndex: number) {
  currentProviderIndex.value = providerIndex
  showFieldSelector.value = true
}

// 处理字段选择确认
function handleFieldSelectConfirm(data: { selectedFields: FieldMapping[] }) {
  if (currentProviderIndex.value < 0) return

  const newFields: InternalField[] = data.selectedFields.map(f => ({
    columnName: f.columnName,
    columnType: f.columnType || 'STRING',
    key: generateKey()
  }))

  // 添加新字段到对应数据源
  const currentList = providerFieldLists.value[currentProviderIndex.value]
  if (!currentList) {
    providerFieldLists.value[currentProviderIndex.value] = []
  }
  providerFieldLists.value[currentProviderIndex.value]?.push(...newFields)

  showFieldSelector.value = false
  currentProviderIndex.value = -1
}

// 自动对齐相同名称（都向数据源1对齐）
function autoAlignByName() {
  if (props.providers.length < 1) return

  const firstProviderFields = providerFieldLists.value[0]
  if (!firstProviderFields || firstProviderFields.length === 0) return

  // 对其他数据源进行对齐
  for (let pIndex = 1; pIndex < providerFieldLists.value.length; pIndex++) {
    const currentList = providerFieldLists.value[pIndex]
    if (!currentList) continue

    const originalFields = [...currentList] // 保存原始字段

    // 创建新的对齐后的列表
    const alignedList: InternalField[] = []

    // 按数据源1的顺序对齐
    for (const baseField of firstProviderFields) {
      const matchingFieldIndex = originalFields.findIndex(f => f.columnName === baseField.columnName)
      const matchingField = originalFields[matchingFieldIndex]
      if (matchingFieldIndex >= 0 && matchingField) {
        alignedList.push(matchingField)
        // 从原始列表中移除已匹配的字段
        originalFields.splice(matchingFieldIndex, 1)
      }
    }

    // 将未匹配的字段添加到末尾
    alignedList.push(...originalFields)

    providerFieldLists.value[pIndex] = alignedList
  }
}

// 自动生成别名（从数据源1复制）
function autoGenerateAliases() {
  const firstProviderFields = providerFieldLists.value[0]
  if (!firstProviderFields || firstProviderFields.length === 0) return

  // 别名的数量和名称都从数据源1复制
  aliasList.value = firstProviderFields.map(f => f.columnName)
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
    fields: (providerFieldLists.value[pIndex] || []).map((field, fIndex) => {
      // 查找原始字段信息
      const originalField = provider.fields?.find(f => f.columnName === field.columnName)
      // 获取对应的别名（如果有的话）
      const alias = aliasList.value[fIndex] || field.columnName

      return {
        ...(originalField || {}),
        columnName: field.columnName,
        columnAlias: alias,
        columnType: field.columnType || 'STRING',
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
  width: 95%;
  max-width: 1200px;
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

// 独立列表格布局
.align-tables-container {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 12px;
  min-height: 300px;
}

.align-column {
  flex-shrink: 0;
  min-width: 180px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  background: #fff;
  display: flex;
  flex-direction: column;

  &.alias-column {
    .column-header {
      background: #f6ffed;
      border-color: #b7eb8f;
    }
  }
}

.column-header {
  padding: 10px 12px;
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;

  .header-title {
    color: #303133;
  }

  .header-sub {
    font-weight: 400;
    color: #909399;
    font-size: 12px;
  }

  .header-count {
    font-weight: 400;
    color: #909399;
    font-size: 12px;
  }
}

.column-body {
  flex: 1;
  overflow-y: auto;
  max-height: 350px;
}

.column-row {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-bottom: 1px solid #f0f0f0;
  gap: 8px;
  min-height: 42px;

  &:last-child {
    border-bottom: none;
  }
}

.drag-handle {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #bfbfbf;
  font-size: 14px;
  cursor: grab;
  flex-shrink: 0;
  opacity: 0.4;
  transition: all 0.2s;

  &:hover {
    opacity: 1;
    color: #1890ff;
  }

  &:active {
    cursor: grabbing;
  }
}

.row-index {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
  flex-shrink: 0;
}

.alias-row {
  background: #fafafa;

  .alias-input {
    flex: 1;
    padding: 4px 8px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    font-size: 13px;

    &:focus {
      border-color: #1890ff;
      outline: none;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    }
  }
}

.field-row {
  cursor: grab;
  transition: all 0.2s;

  &:hover {
    background: #e6f7ff;
  }

  &:active {
    cursor: grabbing;
  }

  &.dragging {
    opacity: 0.5;
    background: #f0f0f0;
  }
}

.field-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  .field-name {
    font-size: 13px;
    color: #303133;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .field-type {
    font-size: 11px;
    color: #8c8c8c;
    background: #f5f5f5;
    padding: 1px 4px;
    border-radius: 2px;
    width: fit-content;
  }
}

.row-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;

  .field-row:hover & {
    opacity: 1;
  }
}

.row-action-btn {
  padding: 2px 6px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;

  &.delete-btn {
    background: transparent;
    color: #ff4d4f;

    &:hover {
      background: #fff1f0;
    }
  }
}

.add-field-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border: 1px dashed #d9d9d9;
  margin: 8px;
  border-radius: 4px;
  cursor: pointer;
  color: #8c8c8c;
  transition: all 0.2s;

  &:hover {
    border-color: #1890ff;
    color: #1890ff;
    background: #e6f7ff;
  }

  .add-icon {
    font-size: 16px;
    font-weight: 500;
  }

  .add-text {
    font-size: 13px;
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
