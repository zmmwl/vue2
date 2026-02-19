<template>
  <div class="field-selection-tab">
    <!-- 数据源列表 -->
    <div class="providers-section">
      <div class="section-header">
        <h4 class="section-title">已连接数据源</h4>
        <span class="section-count">({{ internalProviders.length }})</span>
      </div>

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
        >
          <div class="provider-header">
            <span class="provider-index">{{ index + 1 }}</span>
            <span class="provider-name">{{ provider.participantId }}</span>
            <span class="provider-dataset">{{ provider.dataset }}</span>
            <span class="field-count">{{ provider.fields.length }} 个字段</span>
          </div>

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
            </select>
          </div>

          <!-- 字段表格 -->
          <div class="fields-table-container">
            <table class="fields-table">
              <thead>
                <tr>
                  <th class="col-select">选择</th>
                  <th class="col-name">字段名</th>
                  <th class="col-type">类型</th>
                  <th class="col-alias">别名</th>
                  <th class="col-join">Join键</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="field in provider.fields"
                  :key="field.columnName"
                  :class="{ selected: field.selected }"
                >
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

    <!-- Join 条件预览 -->
    <div v-if="joinConditions.length > 0" class="join-conditions-section">
      <div class="section-header">
        <h4 class="section-title">Join 条件</h4>
      </div>
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
import { ref, watch } from 'vue'
import type { InputProvider, JoinCondition, FieldMapping } from '@/types/nodes'

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

// 处理 Join 类型变化
function handleJoinTypeChange(sourceNodeId: string, event: Event) {
  const joinType = (event.target as HTMLSelectElement).value as 'INNER' | 'CROSS'
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

.field-selection-tab {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.section-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.section-count {
  font-size: 13px;
  color: var(--text-secondary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 20px;
  text-align: center;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  border: 1px dashed rgba(0, 0, 0, 0.1);

  .empty-icon {
    font-size: 48px;
    margin-bottom: 12px;
    opacity: 0.6;
  }

  p {
    margin: 4px 0;
    color: var(--text-secondary);
    font-size: 14px;
  }

  .empty-hint {
    font-size: 12px;
    opacity: 0.8;
  }
}

.providers-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.provider-card {
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s;

  &:hover {
    border-color: rgba(19, 194, 194, 0.3);
    box-shadow: 0 2px 8px rgba(19, 194, 194, 0.08);
  }
}

.provider-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;

  .provider-index {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #13C2C2, #36cfc9);
    color: white;
    border-radius: 50%;
    font-size: 12px;
    font-weight: 600;
  }

  .provider-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .provider-dataset {
    font-size: 12px;
    color: var(--text-secondary);
    padding: 2px 8px;
    background: rgba(0, 0, 0, 0.04);
    border-radius: 4px;
  }

  .field-count {
    margin-left: auto;
    font-size: 12px;
    color: var(--text-secondary);
  }
}

.join-type-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: rgba(24, 144, 255, 0.06);
  border-radius: 6px;
}

.join-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.join-select {
  padding: 6px 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  font-size: 13px;
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
  font-size: 13px;

  th {
    padding: 10px 8px;
    text-align: left;
    font-weight: 600;
    color: var(--text-secondary);
    background: rgba(0, 0, 0, 0.02);
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    white-space: nowrap;
  }

  td {
    padding: 8px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr:hover {
    background: rgba(0, 0, 0, 0.02);
  }

  .col-select,
  .col-join {
    text-align: center;
    width: 50px;
  }

  .col-name {
    width: 150px;
  }

  .col-type {
    width: 100px;
  }

  .col-alias {
    width: 150px;
  }
}

.type-badge {
  display: inline-block;
  padding: 2px 8px;
  font-size: 11px;
  color: var(--text-secondary);
  background: rgba(0, 0, 0, 0.04);
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', monospace;
}

.alias-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  font-size: 12px;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #13C2C2;
    box-shadow: 0 0 0 2px rgba(19, 194, 194, 0.1);
  }
}

.join-conditions-section {
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  padding: 16px;
}

.join-conditions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.join-condition-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 6px;
}

.join-type-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  background: linear-gradient(135deg, #e6f7ff, #bae7ff);
  color: #1890ff;
  border-radius: 4px;
}

.join-operands {
  font-size: 12px;
  color: var(--text-primary);
  font-family: 'Monaco', 'Menlo', monospace;
}
</style>
