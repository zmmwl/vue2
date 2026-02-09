<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { GroupByConfig, GroupByField, StatisticConfig, AggregationFunction } from '@/types/nodes'
import { AggregationFunction as AggFunc } from '@/types/nodes'
import type { ComputeTaskNodeData } from '@/types/nodes'

interface Props {
  modelValue: boolean
  taskData?: ComputeTaskNodeData
  initialConfig?: GroupByConfig
  modelId: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', config: GroupByConfig): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 步骤：1-分组字段，2-统计配置
const currentStep = ref<1 | 2>(1)

// 内部状态
const groupByFields = ref<GroupByField[]>([])
const statistics = ref<StatisticConfig[]>([])

// 可用字段列表（输入字段 + 模型输出字段）
const availableFields = computed(() => {
  const fields: Array<{
    id: string
    name: string
    type: string
    source: string
    sourceType: 'input' | 'model'
    participant: string
    dataset: string
    modelId?: string
  }> = []

  const providers = props.taskData?.inputProviders || []

  // 添加输入字段
  providers.forEach(provider => {
    provider.fields.forEach(field => {
      fields.push({
        id: `input.${provider.sourceNodeId}.${field.columnName}`,
        name: field.columnName,
        type: field.columnType,
        source: `${provider.participantId}.${provider.dataset}`,
        sourceType: 'input',
        participant: provider.participantId,
        dataset: provider.dataset
      })
    })
  })

  // 添加其他模型的输出字段
  const models = props.taskData?.models || []
  models.forEach(model => {
    if (model.type !== 'GROUP_STAT' && model.id !== props.modelId) {
      // 对于表达式模型
      if (model.type === 'expression') {
        fields.push({
          id: `model.${model.id}.expression_result`,
          name: `${model.name}_result`,
          type: 'DOUBLE',
          source: model.name,
          sourceType: 'model',
          participant: model.participantId,
          dataset: '',
          modelId: model.id
        })
      }
      // 对于其他模型，可以添加更多字段
    }
  })

  return fields
})

// SQL 预览
const sqlPreview = computed(() => {
  if (groupByFields.value.length === 0 && statistics.value.length === 0) {
    return '-- 请配置分组字段和统计'
  }

  const groupByClause = groupByFields.value
    .map(f => f.fieldAlias || f.fieldName)
    .join(', ')

  const selectItems: string[] = []

  // 分组字段
  groupByFields.value.forEach(f => {
    selectItems.push(f.fieldAlias || f.fieldName)
  })

  // 统计字段
  statistics.value.forEach(stat => {
    const fieldName = extractFieldName(stat.fieldId)
    selectItems.push(`${stat.functionType}(${fieldName}) AS ${stat.resultAlias}`)
  })

  const selectClause = selectItems.join(',\n  ')
  const groupByText = groupByClause ? `GROUP BY ${groupByClause}` : ''

  return `SELECT\n  ${selectClause}\nFROM source_table${groupByText ? '\n' + groupByText : ''}`
})

// 初始化配置
watch(() => props.modelValue, (newVal) => {
  if (newVal && props.initialConfig) {
    groupByFields.value = [...props.initialConfig.groupByFields]
    statistics.value = [...props.initialConfig.statistics]
  } else if (newVal) {
    // 重置为空
    groupByFields.value = []
    statistics.value = []
    currentStep.value = 1
  }
})

// 切换分组字段选择
function toggleGroupByField(fieldId: string) {
  const index = groupByFields.value.findIndex(f => f.fieldId === fieldId)
  if (index >= 0) {
    groupByFields.value.splice(index, 1)
  } else {
    const field = availableFields.value.find(f => f.id === fieldId)
    if (field) {
      groupByFields.value.push({
        fieldId: field.id,
        fieldName: field.name,
        fieldAlias: field.name,
        fieldType: field.type
      })
    }
  }
}

// 检查字段是否被选为分组字段
function isGroupByField(fieldId: string): boolean {
  return groupByFields.value.some(f => f.fieldId === fieldId)
}

// 添加统计配置
function addStatistic() {
  const newStat: StatisticConfig = {
    id: `stat-${Date.now()}`,
    functionType: AggFunc.SUM,
    fieldId: '',
    fieldSource: 'input',
    resultAlias: ''
  }
  statistics.value.push(newStat)
}

// 删除统计配置
function removeStatistic(statId: string) {
  const index = statistics.value.findIndex(s => s.id === statId)
  if (index >= 0) {
    statistics.value.splice(index, 1)
  }
}

// 更新统计配置的字段
function updateStatField(statId: string, fieldId: string) {
  const stat = statistics.value.find(s => s.id === statId)
  if (stat) {
    stat.fieldId = fieldId
    const field = availableFields.value.find(f => f.id === fieldId)
    if (field) {
      stat.fieldSource = field.sourceType
      // 自动生成结果别名
      stat.resultAlias = `${field.name}_${stat.functionType.toLowerCase()}`
    }
  }
}

// 更新统计函数
function updateStatFunction(statId: string, funcType: AggregationFunction) {
  const stat = statistics.value.find(s => s.id === statId)
  if (stat) {
    stat.functionType = funcType
    // 更新别名
    const field = availableFields.value.find(f => f.id === stat.fieldId)
    if (field) {
      stat.resultAlias = `${field.name}_${funcType.toLowerCase()}`
    }
  }
}

// 提取字段名
function extractFieldName(fieldId: string): string {
  const parts = fieldId.split('.')
  return parts[parts.length - 1] || ''
}

// 取消
function handleCancel() {
  emit('update:modelValue', false)
  emit('cancel')
}

// 下一步
function handleNext() {
  currentStep.value = 2
}

// 上一步
function handlePrev() {
  currentStep.value = 1
}

// 确认
function handleConfirm() {
  if (statistics.value.length === 0) {
    alert('请至少添加一个统计配置')
    return
  }

  // 验证每个统计配置已选择字段
  for (const stat of statistics.value) {
    if (!stat.fieldId) {
      alert('请为每个统计配置选择字段')
      return
    }
  }

  const config: GroupByConfig = {
    id: `groupby-${Date.now()}`,
    groupByFields: [...groupByFields.value],
    statistics: [...statistics.value]
  }

  emit('confirm', config)
  emit('update:modelValue', false)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click.self="handleCancel">
        <div class="modal-container groupby-config-modal">
          <div class="modal-header">
            <h3>配置分组统计模型</h3>
            <button class="close-btn" @click="handleCancel">×</button>
          </div>

          <div class="modal-body">
            <!-- 步骤指示器 -->
            <div class="steps-indicator">
              <div class="step" :class="{ active: currentStep === 1, completed: currentStep > 1 }">
                <div class="step-number">1</div>
                <div class="step-label">分组字段</div>
              </div>
              <div class="step-line"></div>
              <div class="step" :class="{ active: currentStep === 2 }">
                <div class="step-number">2</div>
                <div class="step-label">统计配置</div>
              </div>
            </div>

            <!-- 步骤1：分组字段选择 -->
            <section v-if="currentStep === 1" class="config-section">
              <h4 class="section-title">选择分组字段（可选）</h4>
              <p class="section-hint">如果不选择分组字段，则对所有数据进行统计</p>

              <div class="fields-selector">
                <div
                  v-for="field in availableFields"
                  :key="field.id"
                  class="field-item"
                  :class="{ selected: isGroupByField(field.id) }"
                  @click="toggleGroupByField(field.id)"
                >
                  <span class="checkbox">{{ isGroupByField(field.id) ? '☑' : '☐' }}</span>
                  <span class="field-info">
                    <span class="field-name">{{ field.name }}</span>
                    <span class="field-type">({{ field.type }})</span>
                  </span>
                  <span class="field-source">{{ field.source }}</span>
                </div>
                <div v-if="availableFields.length === 0" class="empty-tip">
                  暂无可用字段，请先配置输入数据
                </div>
              </div>

              <div class="selected-summary">
                已选择 {{ groupByFields.length }} 个分组字段
              </div>
            </section>

            <!-- 步骤2：统计配置 -->
            <section v-if="currentStep === 2" class="config-section">
              <h4 class="section-title">配置统计函数</h4>
              <p class="section-hint">添加需要执行的聚合统计</p>

              <div class="statistics-list">
                <div v-if="statistics.length === 0" class="empty-tip">
                  请点击下方按钮添加统计配置
                </div>

                <div v-for="stat in statistics" :key="stat.id" class="stat-card">
                  <div class="stat-header">
                    <span class="stat-label">统计配置</span>
                    <button class="delete-btn" @click="removeStatistic(stat.id)">删除</button>
                  </div>

                  <div class="stat-config-row">
                    <label>聚合函数:</label>
                    <select :value="stat.functionType" @change="updateStatFunction(stat.id, ($event.target as HTMLSelectElement).value as AggregationFunction)">
                      <option :value="AggFunc.SUM">SUM - 求和</option>
                      <option :value="AggFunc.COUNT">COUNT - 计数</option>
                      <option :value="AggFunc.AVG">AVG - 平均值</option>
                      <option :value="AggFunc.MAX">MAX - 最大值</option>
                      <option :value="AggFunc.MIN">MIN - 最小值</option>
                    </select>
                  </div>

                  <div class="stat-config-row">
                    <label>统计字段:</label>
                    <select :value="stat.fieldId" @change="updateStatField(stat.id, ($event.target as HTMLSelectElement).value)">
                      <option value="">-- 请选择字段 --</option>
                      <optgroup label="输入字段">
                        <option
                          v-for="field in availableFields.filter(f => f.sourceType === 'input')"
                          :key="field.id"
                          :value="field.id"
                        >
                          {{ field.name }} ({{ field.type }}) - {{ field.source }}
                        </option>
                      </optgroup>
                      <optgroup label="模型输出字段">
                        <option
                          v-for="field in availableFields.filter(f => f.sourceType === 'model')"
                          :key="field.id"
                          :value="field.id"
                        >
                          {{ field.name }} ({{ field.type }}) - {{ field.source }}
                        </option>
                      </optgroup>
                    </select>
                  </div>

                  <div class="stat-config-row">
                    <label>结果别名:</label>
                    <input
                      :value="stat.resultAlias"
                      @input="(stat.resultAlias = ($event.target as HTMLInputElement).value)"
                      placeholder="字段_函数"
                      class="alias-input"
                    />
                  </div>
                </div>
              </div>

              <button class="add-stat-btn" @click="addStatistic">+ 添加统计</button>

              <!-- SQL 预览 -->
              <div class="sql-preview-section">
                <h4 class="section-title">SQL 预览</h4>
                <pre class="sql-preview">{{ sqlPreview }}</pre>
              </div>
            </section>
          </div>

          <div class="modal-footer">
            <button v-if="currentStep === 1" class="btn-secondary" @click="handleCancel">取消</button>
            <button v-if="currentStep === 1" class="btn-primary" @click="handleNext">下一步</button>
            <button v-if="currentStep === 2" class="btn-secondary" @click="handlePrev">上一步</button>
            <button v-if="currentStep === 2" class="btn-primary" @click="handleConfirm">保存配置</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Modal 基础样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 700px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.groupby-config-modal {
  width: 800px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #262626;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: #999;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #262626;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
}

.btn-primary {
  background: #1890ff;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #40a9ff;
}

.btn-secondary {
  background: white;
  color: #595959;
  border: 1px solid #d9d9d9;
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  border-color: #1890ff;
  color: #1890ff;
}

/* 步骤指示器 */
.steps-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f0f0f0;
  color: #8c8c8c;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.step.active .step-number {
  background: #1890ff;
  color: white;
}

.step.completed .step-number {
  background: #52c41a;
  color: white;
}

.step-label {
  font-size: 12px;
  color: #8c8c8c;
}

.step.active .step-label {
  color: #1890ff;
  font-weight: 500;
}

.step-line {
  width: 100px;
  height: 2px;
  background: #f0f0f0;
  margin: 0 8px;
  margin-bottom: 24px;
}

/* 配置区域样式 */
.config-section {
  margin-bottom: 24px;
}

.section-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.section-hint {
  margin: 0 0 16px 0;
  font-size: 13px;
  color: #8c8c8c;
}

/* 字段选择器 */
.fields-selector {
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  max-height: 250px;
  overflow-y: auto;
}

.field-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}

.field-item:last-child {
  border-bottom: none;
}

.field-item:hover {
  background: #fafafa;
}

.field-item.selected {
  background: #e6f7ff;
}

.checkbox {
  font-size: 16px;
  color: #1890ff;
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
  color: #262626;
}

.field-type {
  font-size: 12px;
  color: #8c8c8c;
}

.field-source {
  font-size: 12px;
  color: #8c8c8c;
}

.selected-summary {
  margin-top: 12px;
  padding: 8px 12px;
  background: #f0f7ff;
  border-radius: 4px;
  font-size: 13px;
  color: #1890ff;
}

/* 统计配置列表 */
.statistics-list {
  margin-bottom: 16px;
}

.stat-card {
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  background: #fafafa;
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.stat-label {
  font-weight: 600;
  font-size: 14px;
  color: #262626;
}

.delete-btn {
  background: none;
  border: none;
  color: #ff4d4f;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}

.delete-btn:hover {
  background: #fff1f0;
}

.stat-config-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.stat-config-row:last-child {
  margin-bottom: 0;
}

.stat-config-row > label {
  min-width: 80px;
  font-size: 13px;
  color: #595959;
}

.stat-config-row > select {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
}

.alias-input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
}

.add-stat-btn {
  width: 100%;
  padding: 10px;
  background: #f0f7ff;
  color: #1890ff;
  border: 1px dashed #1890ff;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.add-stat-btn:hover {
  background: #e6f4ff;
  border-color: #40a9ff;
}

/* SQL 预览 */
.sql-preview-section {
  margin-top: 24px;
}

.sql-preview {
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  padding: 12px;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 13px;
  color: #262626;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}

/* 空状态提示 */
.empty-tip {
  text-align: center;
  padding: 24px;
  color: #8c8c8c;
  font-size: 14px;
}

/* 动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95);
}
</style>
