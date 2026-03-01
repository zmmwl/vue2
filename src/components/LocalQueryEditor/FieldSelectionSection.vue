<template>
  <div class="field-selection-section">
    <!-- 数据源列表 -->
    <div class="providers-section">
      <div v-if="internalProviders.length === 0" class="empty-state">
        <div class="empty-icon">📊</div>
        <p>暂无输入数据</p>
        <p class="empty-hint">请从数据源节点拖拽连线到此任务</p>
      </div>

      <div v-else class="providers-list">
        <div
          v-for="(provider, index) in internalProviders"
          :key="provider.sourceNodeId"
          class="provider-card"
          :class="{ collapsed: collapsedProviders[provider.sourceNodeId] }"
        >
          <div class="provider-header" @click="toggleProvider(provider.sourceNodeId)">
            <span class="collapse-icon">{{ collapsedProviders[provider.sourceNodeId] ? '▶' : '▼' }}</span>
            <span class="provider-index">{{ index + 1 }}</span>
            <span class="provider-name">{{ provider.participantId }}</span>
            <span class="provider-dataset">{{ provider.dataset }}</span>
            <span class="field-count">{{ provider.fields.filter(f => f.selected).length }}/{{ provider.fields.length }} 个字段</span>
          </div>

          <!-- 可折叠内容 -->
          <div v-show="!collapsedProviders[provider.sourceNodeId]" class="provider-content">
            <!-- Join 类型选择 -->
            <div class="join-type-row">
              <label class="join-label">Join 类型:</label>
              <select
                :value="provider.fields[0]?.joinType || 'INNER'"
                class="join-select"
                @change="handleJoinTypeChange(provider.sourceNodeId, $event)"
              >
                <option value="INNER">INNER（内连接）</option>
                <option value="CROSS">CROSS（交叉连接）</option>
                <option value="Union">Union（横向拼接）</option>
                <option value="NoAssoc">NoAssoc（无关联）</option>
              </select>
            </div>

            <!-- 字段表格 -->
            <div class="fields-table-container">
              <table class="fields-table">
                <thead>
                  <tr>
                    <th class="col-drag"></th>
                    <th class="col-select">选择</th>
                    <th class="col-name">字段名</th>
                    <th class="col-type">类型</th>
                    <th class="col-alias">别名</th>
                    <th class="col-join">Join键</th>
                  </tr>
                </thead>
                <tbody ref="tableBody">
                  <tr
                    v-for="(field, fieldIndex) in provider.fields"
                    :key="field.columnName"
                    :class="{ selected: field.selected, dragging: dragState.field === field && dragState.providerId === provider.sourceNodeId }"
                    :draggable="true"
                    @dragstart="handleDragStart($event, provider.sourceNodeId, field, fieldIndex)"
                    @dragend="handleDragEnd"
                    @dragover="handleDragOver($event, fieldIndex)"
                    @drop="handleDrop($event, provider.sourceNodeId, fieldIndex)"
                  >
                    <td class="col-drag">
                      <span class="drag-handle" title="拖拽排序">⋮⋮</span>
                    </td>
                    <td class="col-select">
                      <input
                        v-model="field.selected"
                        type="checkbox"
                        @change="handleFieldChange"
                      />
                    </td>
                    <td class="col-name">{{ field.columnName }}</td>
                    <td class="col-type">
                      <span class="type-badge">{{ field.columnType }}</span>
                    </td>
                    <td class="col-alias">
                      <input
                        v-model="field.columnAlias"
                        type="text"
                        class="alias-input"
                        placeholder="默认=字段名"
                        @change="handleFieldChange"
                      />
                    </td>
                    <td class="col-join">
                      <input
                        v-model="field.isJoinField"
                        type="checkbox"
                        @change="handleFieldChange"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Join 条件预览 -->
    <div v-if="joinConditions.length > 0" class="join-conditions-section">
      <div class="section-subtitle">Join 条件</div>
      <div class="join-conditions-list">
        <div
          v-for="(condition, index) in joinConditions"
          :key="index"
          class="join-condition-item"
        >
          <span class="join-type-badge">{{ condition.joinType }}</span>
          <span class="join-operands">
            {{ formatJoinOperands(condition.operands) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, reactive } from 'vue'
import type { InputProvider, JoinCondition, FieldMapping, JoinType } from '@/types/nodes'

// 内部使用的字段类型（扩展 FieldMapping 添加 selected 属性）
interface InternalField extends FieldMapping {
  selected: boolean
}

// 内部使用的 InputProvider 类型
interface InternalInputProvider extends Omit<InputProvider, 'fields'> {
  fields: InternalField[]
}

interface Props {
  inputProviders: InputProvider[]
  joinConditions: JoinCondition[]
}

interface Emits {
  (e: 'update:inputProviders', providers: InputProvider[]): void
  (e: 'update:joinConditions', conditions: JoinCondition[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 内部状态
const internalProviders = ref<InternalInputProvider[]>([])
const collapsedProviders = ref<Record<string, boolean>>({})

// 拖拽状态
const dragState = reactive({
  providerId: '',
  field: null as InternalField | null,
  index: -1
})

// 监听 props 变化
watch(() => props.inputProviders, (newVal) => {
  // 深拷贝并添加 selected 属性
  internalProviders.value = newVal.map(provider => ({
    ...provider,
    fields: provider.fields.map(field => ({
      ...field,
      selected: true // 默认选中
    }))
  }))
}, { immediate: true, deep: true })

// 切换 provider 的展开/收起状态
function toggleProvider(sourceNodeId: string) {
  collapsedProviders.value[sourceNodeId] = !collapsedProviders.value[sourceNodeId]
}

// 处理 Join 类型变化
function handleJoinTypeChange(sourceNodeId: string, event: Event) {
  const joinType = (event.target as HTMLSelectElement).value as JoinType
  const provider = internalProviders.value.find(p => p.sourceNodeId === sourceNodeId)
  if (provider) {
    provider.fields.forEach(field => {
      field.joinType = joinType
    })
    emitChanges()
  }
}

// 处理字段变化
function handleFieldChange() {
  emitChanges()
}

// 拖拽开始
function handleDragStart(event: DragEvent, providerId: string, field: InternalField, index: number) {
  dragState.providerId = providerId
  dragState.field = field
  dragState.index = index

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', index.toString())
  }
}

// 拖拽结束
function handleDragEnd() {
  dragState.providerId = ''
  dragState.field = null
  dragState.index = -1
}

// 拖拽经过
function handleDragOver(event: DragEvent, _index: number) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

// 放置
function handleDrop(event: DragEvent, targetProviderId: string, targetIndex: number) {
  event.preventDefault()

  // 只在同一 provider 内允许拖拽排序
  if (dragState.providerId !== targetProviderId || dragState.index === -1 || dragState.index === targetIndex) {
    return
  }

  const provider = internalProviders.value.find(p => p.sourceNodeId === targetProviderId)
  if (!provider) return

  // 重新排序
  const fields = [...provider.fields]
  const removed = fields.splice(dragState.index, 1)
  if (removed.length > 0) {
    const movedField = removed[0] as InternalField
    fields.splice(targetIndex, 0, movedField)
    provider.fields = fields
  }

  // 重置拖拽状态
  handleDragEnd()

  // 发送更新
  emitChanges()
}

// 发送更新
function emitChanges() {
  // 过滤掉未选中的字段，并移除 selected 属性
  const providers: InputProvider[] = internalProviders.value.map(provider => ({
    ...provider,
    fields: provider.fields.filter(f => f.selected).map((f): FieldMapping => {
      const { selected, ...field } = f
      return field as FieldMapping
    })
  }))

  emit('update:inputProviders', providers)

  // 构建 Join 条件
  const conditions = buildJoinConditions(providers)
  emit('update:joinConditions', conditions)
}

// 构建 Join 条件
function buildJoinConditions(providers: InputProvider[]): JoinCondition[] {
  if (providers.length < 2) return []

  // 找出所有 Join 字段
  const joinFieldsByProvider = providers.map(provider => ({
    participantId: provider.participantId,
    dataset: provider.dataset,
    joinFields: provider.fields.filter(f => f.isJoinField).map(f => f.columnName)
  }))

  // 如果没有 Join 字段，返回 CROSS JOIN
  const hasJoinFields = joinFieldsByProvider.some(p => p.joinFields && p.joinFields.length > 0)
  if (!hasJoinFields) {
    return [{
      joinType: 'CROSS',
      operands: providers.map(p => ({
        participantId: p.participantId,
        dataset: p.dataset,
        columnNames: []
      }))
    }]
  }

  // 构建 INNER JOIN 条件
  const joinType = providers[0]?.fields?.find(f => f.isJoinField)?.joinType || 'INNER'
  return [{
    joinType,
    operands: joinFieldsByProvider.map(p => ({
      participantId: p.participantId,
      dataset: p.dataset,
      columnNames: p.joinFields || []
    }))
  }]
}

// 格式化 Join 操作数
function formatJoinOperands(operands: JoinCondition['operands']): string {
  return operands.map(op => {
    const fields = op.columnNames.length > 0 ? op.columnNames.join(', ') : '(全部)'
    return `${op.participantId}.${op.dataset}(${fields})`
  }).join(' ⨝ ')
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.field-selection-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.providers-section {
  // 样式继承自父组件
}

.section-subtitle {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 20px;
  text-align: center;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  border: 1px dashed rgba(0, 0, 0, 0.1);

  .empty-icon {
    font-size: 36px;
    margin-bottom: 8px;
    opacity: 0.5;
  }

  p {
    margin: 2px 0;
    color: var(--text-secondary);
    font-size: 13px;
  }

  .empty-hint {
    font-size: 11px;
    opacity: 0.8;
  }
}

.providers-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.provider-card {
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  padding: 12px;
  transition: all 0.2s;

  &:hover {
    border-color: rgba(19, 194, 194, 0.2);
  }

  &.collapsed {
    .provider-header {
      margin-bottom: 0;
    }
  }
}

.provider-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  cursor: pointer;
  user-select: none;

  &:hover {
    .collapse-icon {
      color: #13C2C2;
    }
  }

  .collapse-icon {
    font-size: 10px;
    color: var(--text-secondary);
    transition: all 0.2s;
    width: 12px;
  }

  .provider-index {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #13C2C2, #36cfc9);
    color: white;
    border-radius: 50%;
    font-size: 11px;
    font-weight: 600;
  }

  .provider-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .provider-dataset {
    font-size: 11px;
    color: var(--text-secondary);
    padding: 2px 6px;
    background: rgba(0, 0, 0, 0.04);
    border-radius: 3px;
  }

  .field-count {
    margin-left: auto;
    font-size: 11px;
    color: var(--text-secondary);
  }
}

.provider-content {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.join-type-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  padding: 6px 10px;
  background: rgba(24, 144, 255, 0.05);
  border-radius: 4px;
}

.join-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}

.join-select {
  padding: 4px 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  font-size: 12px;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #1890ff;
  }
}

.fields-table-container {
  overflow-x: auto;
}

.fields-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;

  th {
    padding: 8px 6px;
    text-align: left;
    font-weight: 600;
    color: var(--text-secondary);
    background: rgba(0, 0, 0, 0.02);
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    white-space: nowrap;
  }

  td {
    padding: 6px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr:hover {
    background: rgba(0, 0, 0, 0.02);
  }

  tr.selected {
    background: rgba(19, 194, 194, 0.04);
  }

  tr.dragging {
    opacity: 0.5;
    background: rgba(19, 194, 194, 0.1);
  }

  .col-drag {
    width: 30px;
    text-align: center;
  }

  .col-select,
  .col-join {
    text-align: center;
    width: 40px;
  }

  .col-name {
    width: 120px;
  }

  .col-type {
    width: 80px;
  }

  .col-alias {
    width: 120px;
  }
}

.drag-handle {
  display: inline-block;
  cursor: grab;
  color: var(--text-secondary);
  font-size: 12px;
  opacity: 0.5;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
    color: #13C2C2;
  }

  &:active {
    cursor: grabbing;
  }
}

.type-badge {
  display: inline-block;
  padding: 2px 6px;
  font-size: 10px;
  color: var(--text-secondary);
  background: rgba(0, 0, 0, 0.04);
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', monospace;
}

.alias-input {
  width: 100%;
  padding: 4px 6px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  font-size: 11px;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #13C2C2;
    box-shadow: 0 0 0 2px rgba(19, 194, 194, 0.1);
  }
}

.join-conditions-section {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 6px;
  padding: 12px;
}

.join-conditions-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.join-condition-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
}

.join-type-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px;
  background: linear-gradient(135deg, #e6f7ff, #bae7ff);
  color: #1890ff;
  border-radius: 3px;
}

.join-operands {
  font-size: 11px;
  color: var(--text-primary);
  font-family: 'Monaco', 'Menlo', monospace;
}
</style>
