<template>
  <div class="groupby-tab">
    <!-- 分组字段选择 -->
    <div class="config-section">
      <div class="section-header">
        <h4 class="section-title">分组字段（可选）</h4>
        <span class="section-hint">如果不选择分组字段，则对所有数据进行统计</span>
      </div>

      <div v-if="availableFields.length === 0" class="empty-state">
        <p>请先在字段选择中添加输入数据</p>
      </div>

      <div v-else class="fields-selector">
        <div
          v-for="field in availableFields"
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
    <div class="config-section">
      <div class="section-header">
        <h4 class="section-title">统计配置</h4>
      </div>

      <div v-if="statistics.length === 0" class="empty-state">
        <p>请点击下方按钮添加统计配置</p>
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
              <option v-for="field in availableFields" :key="field.id" :value="field.id">
                {{ field.name }} ({{ field.type }}) - {{ field.source }}
              </option>
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
import type { InputProvider, GroupByConfig, GroupByField, StatisticConfig, AggregationFunction } from '@/types/nodes'
import { AggregationFunction as AggFunc } from '@/types/nodes'

interface Props {
  config?: GroupByConfig
  inputProviders: InputProvider[]
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

// 获取可用字段
const availableFields = computed(() => {
  const fields: Array<{
    id: string
    name: string
    type: string
    source: string
    participantId: string
    dataset: string
  }> = []

  props.inputProviders.forEach(provider => {
    provider.fields.forEach(field => {
      fields.push({
        id: `${provider.participantId}.${provider.dataset}.${field.columnAlias || field.columnName}`,
        name: field.columnAlias || field.columnName,
        type: field.columnType,
        source: `${provider.participantId}.${provider.dataset}`,
        participantId: provider.participantId,
        dataset: provider.dataset
      })
    })
  })

  return fields
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

.groupby-tab {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.config-section {
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  padding: 16px;
}

.section-header {
  margin-bottom: 12px;
}

.section-title {
  margin: 0 0 4px 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.section-hint {
  font-size: 12px;
  color: var(--text-secondary);
}

.empty-state {
  padding: 24px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 6px;
}

.fields-selector {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 6px;
  max-height: 200px;
  overflow-y: auto;
}

.field-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
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
    background: rgba(19, 194, 194, 0.08);
  }
}

.checkbox {
  font-size: 16px;
  color: #13C2C2;
  width: 20px;
}

.field-info {
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex: 1;
}

.field-name {
  font-weight: 500;
  color: var(--text-primary);
}

.field-type {
  font-size: 12px;
  color: var(--text-secondary);
}

.field-source {
  font-size: 11px;
  color: var(--text-secondary);
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 4px;
}

.selection-summary {
  margin-top: 12px;
  padding: 8px 12px;
  background: rgba(19, 194, 194, 0.08);
  border-radius: 4px;
  font-size: 13px;
  color: #13C2C2;
}

.statistics-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}

.stat-card {
  padding: 16px;
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.stat-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.delete-btn {
  padding: 4px 10px;
  font-size: 12px;
  color: #ff4d4f;
  background: transparent;
  border: 1px solid rgba(255, 77, 79, 0.3);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 77, 79, 0.08);
  }
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;

  &:last-child {
    margin-bottom: 0;
  }

  label {
    min-width: 80px;
    font-size: 13px;
    color: var(--text-secondary);
  }

  select,
  .alias-input {
    flex: 1;
    padding: 8px 10px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 4px;
    font-size: 13px;
    background: white;

    &:focus {
      outline: none;
      border-color: #13C2C2;
    }
  }
}

.add-stat-btn {
  width: 100%;
  padding: 12px;
  background: rgba(19, 194, 194, 0.08);
  color: #13C2C2;
  border: 1px dashed rgba(19, 194, 194, 0.3);
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(19, 194, 194, 0.12);
    border-color: rgba(19, 194, 194, 0.5);
  }
}
</style>
