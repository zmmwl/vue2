<template>
  <div class="groupby-section">
    <!-- 分组字段选择 -->
    <div class="config-subsection">
      <div class="subsection-header">
        <span class="subsection-title">分组字段（可选）</span>
        <span class="subsection-hint">如果不选择分组字段，则对所有数据进行统计</span>
      </div>

      <div v-if="inputFields.length === 0" class="empty-state">
        <p>请先在字段选择中添加输入数据</p>
      </div>

      <div v-else class="fields-selector">
        <div
          v-for="field in inputFields"
          :key="field.id"
          class="field-item"
          :class="{ selected: isGroupByField(field.id) }"
          @click="toggleGroupByField(field)"
        >
          <span class="checkbox">{{ isGroupByField(field.id) ? '☑' : '☐' }}</span>
          <span class="field-info">
            <span class="field-name">{{ field.name }}</span>
            <span class="field-type">({{ field.type }})</span>
          </span>
          <span class="field-source">{{ field.source }}</span>
        </div>
      </div>

      <div class="selection-summary">
        已选择 {{ groupByFields.length }} 个分组字段
      </div>
    </div>

    <!-- 统计配置 -->
    <div class="config-subsection">
      <div class="subsection-header">
        <span class="subsection-title">统计配置</span>
      </div>

      <div v-if="statistics.length === 0" class="empty-state">
        <p>暂无分组统计配置</p>
        <p class="empty-hint">点击下方按钮添加统计</p>
      </div>

      <div v-else class="statistics-list">
        <div v-for="stat in statistics" :key="stat.id" class="stat-card">
          <div class="stat-header">
            <span class="stat-label">统计配置</span>
            <button class="delete-btn" @click="removeStatistic(stat.id)">删除</button>
          </div>

          <div class="stat-row">
            <label>聚合函数:</label>
            <select v-model="stat.functionType" @change="updateStatAlias(stat)">
              <option v-for="func in aggregationFunctions" :key="func" :value="func">
                {{ func }} - {{ getFunctionLabel(func) }}
              </option>
            </select>
          </div>

          <div class="stat-row">
            <label>统计字段:</label>
            <select v-model="stat.fieldId" @change="updateStatAlias(stat)">
              <option value="">-- 请选择字段 --</option>
              <!-- 输入字段分组 -->
              <optgroup label="输入字段">
                <option v-for="field in inputFields" :key="field.id" :value="field.id">
                  {{ field.name }} ({{ field.type }}) - {{ field.source }}
                </option>
              </optgroup>
              <!-- 表达式字段分组（如果有） -->
              <optgroup v-if="expressionFields.length > 0" label="表达式结果">
                <option v-for="field in expressionFields" :key="field.id" :value="field.id">
                  {{ field.name }} - {{ field.source }}
                </option>
              </optgroup>
            </select>
          </div>

          <div class="stat-row">
            <label>结果别名:</label>
            <input v-model="stat.resultAlias" type="text" placeholder="字段_函数" class="alias-input" />
          </div>
        </div>
      </div>

      <button class="add-stat-btn" @click="addStatistic">+ 添加统计</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { InputProvider, GroupByConfig, GroupByField, StatisticConfig, AggregationFunction, ExpressionConfig } from '@/types/nodes'
import { AggregationFunction as AggFunc } from '@/types/nodes'

interface Props {
  config?: GroupByConfig
  inputProviders: InputProvider[]
  expressions?: ExpressionConfig[]  // 新增：表达式列表
}

interface Emits {
  (e: 'update:config', config: GroupByConfig | undefined): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 聚合函数列表
const aggregationFunctions = Object.values(AggFunc)

// 内部状态
const groupByFields = ref<GroupByField[]>([])
const statistics = ref<StatisticConfig[]>([])

// 字段类型定义
interface AvailableField {
  id: string
  name: string
  type: string
  source: string
  participantId: string
  dataset: string
  sourceType: 'input' | 'expression'  // 标记来源类型
}

// 获取可用字段（包含输入字段和表达式别名）
const availableFields = computed(() => {
  const fields: AvailableField[] = []

  // 1. 添加输入字段
  props.inputProviders.forEach(provider => {
    provider.fields.forEach(field => {
      fields.push({
        id: `${provider.participantId}.${provider.dataset}.${field.columnAlias || field.columnName}`,
        name: field.columnAlias || field.columnName,
        type: field.columnType,
        source: `${provider.participantId}.${provider.dataset}`,
        participantId: provider.participantId,
        dataset: provider.dataset,
        sourceType: 'input'
      })
    })
  })

  // 2. 添加表达式别名（新增）
  if (props.expressions && props.expressions.length > 0) {
    props.expressions.forEach(expr => {
      if (expr.resultAlias) {
        const exprPreview = expr.expression && expr.expression.length > 20
          ? `${expr.expression.substring(0, 20)}...`
          : expr.expression || ''
        fields.push({
          id: `expression.${expr.id}.${expr.resultAlias}`,
          name: expr.resultAlias,
          type: 'DOUBLE',  // 表达式结果默认为 DOUBLE
          source: `表达式: ${exprPreview}`,
          participantId: '',
          dataset: '',
          sourceType: 'expression'
        })
      }
    })
  }

  return fields
})

// 输入字段列表（用于分组字段选择）
const inputFields = computed(() => {
  return availableFields.value.filter(f => f.sourceType === 'input')
})

// 表达式字段列表
const expressionFields = computed(() => {
  return availableFields.value.filter(f => f.sourceType === 'expression')
})

// 初始化
watch(() => props.config, (newConfig) => {
  if (newConfig) {
    groupByFields.value = [...newConfig.groupByFields]
    statistics.value = [...newConfig.statistics]
  } else {
    groupByFields.value = []
    statistics.value = []
  }
}, { immediate: true })

// 检查字段是否被选为分组字段
function isGroupByField(fieldId: string): boolean {
  return groupByFields.value.some(f => f.fieldId === fieldId)
}

// 切换分组字段
function toggleGroupByField(field: typeof availableFields.value[0]) {
  const index = groupByFields.value.findIndex(f => f.fieldId === field.id)
  if (index >= 0) {
    groupByFields.value.splice(index, 1)
  } else {
    groupByFields.value.push({
      fieldId: field.id,
      fieldName: field.name,
      fieldAlias: field.name,
      fieldType: field.type
    })
  }
  emitConfig()
}

// 添加统计配置
function addStatistic() {
  statistics.value.push({
    id: `stat-${Date.now()}`,
    functionType: AggFunc.SUM,
    fieldId: '',
    fieldSource: 'input',
    resultAlias: ''
  })
  emitConfig()
}

// 删除统计配置
function removeStatistic(statId: string) {
  const index = statistics.value.findIndex(s => s.id === statId)
  if (index >= 0) {
    statistics.value.splice(index, 1)
  }
  emitConfig()
}

// 更新统计别名
function updateStatAlias(stat: StatisticConfig) {
  const field = availableFields.value.find(f => f.id === stat.fieldId)
  if (field) {
    stat.resultAlias = `${field.name}_${stat.functionType.toLowerCase()}`
  }
  emitConfig()
}

// 获取函数标签
function getFunctionLabel(func: AggregationFunction): string {
  const labels: Record<AggregationFunction, string> = {
    [AggFunc.SUM]: '求和',
    [AggFunc.COUNT]: '计数',
    [AggFunc.AVG]: '平均值',
    [AggFunc.MAX]: '最大值',
    [AggFunc.MIN]: '最小值'
  }
  return labels[func] || ''
}

// 发送配置更新
function emitConfig() {
  if (groupByFields.value.length === 0 && statistics.value.length === 0) {
    emit('update:config', undefined)
    return
  }

  emit('update:config', {
    id: `groupby-${Date.now()}`,
    groupByFields: [...groupByFields.value],
    statistics: [...statistics.value]
  })
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.groupby-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-subsection {
  // 继承父组件样式
}

.subsection-header {
  margin-bottom: 8px;
}

.subsection-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.subsection-hint {
  font-size: 11px;
  color: var(--text-secondary);
  margin-left: 8px;
}

.empty-state {
  padding: 20px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 6px;
  border: 1px dashed rgba(0, 0, 0, 0.08);

  p {
    margin: 2px 0;
  }

  .empty-hint {
    font-size: 11px;
    opacity: 0.8;
  }
}

.fields-selector {
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 6px;
  max-height: 160px;
  overflow-y: auto;
}

.field-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  cursor: pointer;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  transition: all 0.2s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.02);
  }

  &.selected {
    background: rgba(19, 194, 194, 0.06);
  }
}

.checkbox {
  font-size: 14px;
  color: #13C2C2;
  width: 16px;
}

.field-info {
  display: flex;
  align-items: baseline;
  gap: 4px;
  flex: 1;
}

.field-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
}

.field-type {
  font-size: 10px;
  color: var(--text-secondary);
}

.field-source {
  font-size: 10px;
  color: var(--text-secondary);
  padding: 1px 5px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 3px;
}

.selection-summary {
  margin-top: 8px;
  padding: 6px 10px;
  background: rgba(19, 194, 194, 0.06);
  border-radius: 4px;
  font-size: 11px;
  color: #13C2C2;
}

.statistics-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 10px;
}

.stat-card {
  padding: 12px;
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 6px;
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.stat-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.delete-btn {
  padding: 3px 8px;
  font-size: 11px;
  color: #ff4d4f;
  background: transparent;
  border: 1px solid rgba(255, 77, 79, 0.25);
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 77, 79, 0.06);
  }
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }

  label {
    min-width: 70px;
    font-size: 12px;
    color: var(--text-secondary);
  }

  select,
  .alias-input {
    flex: 1;
    padding: 6px 8px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    font-size: 12px;
    background: white;

    &:focus {
      outline: none;
      border-color: #13C2C2;
    }
  }
}

.add-stat-btn {
  width: 100%;
  padding: 10px;
  background: rgba(19, 194, 194, 0.06);
  color: #13C2C2;
  border: 1px dashed rgba(19, 194, 194, 0.25);
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(19, 194, 194, 0.1);
    border-color: rgba(19, 194, 194, 0.4);
  }
}
</style>
