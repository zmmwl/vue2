<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click="closeOnOverlay && handleCancel()">
        <div class="modal-container output-config-modal" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">配置输出数据</h3>
            <button class="modal-close" @click="handleCancel()">&times;</button>
          </div>

          <div class="modal-body">
            <div class="output-config">
              <!-- 企业选择 -->
              <div class="config-section">
                <div class="section-title">
                  <span>🏢</span>
                  <span>输出参与方企业</span>
                </div>
                <!-- 固定企业（只读显示） -->
                <div v-if="fixedEnterpriseId" class="enterprise-display locked">
                  <div class="enterprise-card locked">
                    <div class="enterprise-icon">
                      {{ fixedEnterpriseName?.charAt(0) || '?' }}
                    </div>
                    <div class="enterprise-info">
                      <div class="enterprise-name">{{ fixedEnterpriseName || fixedEnterpriseId }}</div>
                      <div class="enterprise-id">{{ fixedEnterpriseId }}</div>
                      <div class="enterprise-locked-hint">🔒 输出企业与任务所属企业一致</div>
                    </div>
                  </div>
                </div>
                <!-- 可选择企业 -->
                <div v-else class="enterprise-display">
                  <div class="enterprise-card" @click="showEnterpriseSelector = true">
                    <div class="enterprise-icon">
                      {{ selectedEnterpriseName?.charAt(0) || '?' }}
                    </div>
                    <div class="enterprise-info">
                      <div class="enterprise-name">
                        {{ selectedEnterpriseName || '请选择企业' }}
                      </div>
                      <div v-if="selectedEnterpriseId" class="enterprise-id">
                        {{ selectedEnterpriseId }}
                      </div>
                      <div v-else class="enterprise-hint">点击选择</div>
                    </div>
                    <span class="arrow-icon">→</span>
                  </div>
                </div>
              </div>

              <!-- 数据集名称 -->
              <div class="config-section">
                <div class="section-title">
                  <span>📄</span>
                  <span>输出数据集名称</span>
                </div>
                <input
                  v-model="datasetName"
                  type="text"
                  class="text-input"
                  placeholder="请输入数据集名称"
                />
              </div>

              <!-- 输出字段选择 -->
              <div class="config-section">
                <div class="section-title">
                  <span>📋</span>
                  <span>输出字段</span>
                  <span class="field-count">({{ selectedFieldIds.size }})</span>
                </div>
                <div v-if="availableFields.length === 0" class="empty-fields">
                  <span class="empty-icon">📄</span>
                  <p>暂无可选字段</p>
                  <p class="empty-hint">请先配置计算任务的输入数据</p>
                </div>
                <div v-else class="fields-list-grouped">
                  <!-- 按分组显示字段 -->
                  <div
                    v-for="group in fieldGroups"
                    :key="group.id"
                    class="field-group"
                  >
                    <!-- 分组标题 -->
                    <div class="group-header">
                      <span class="group-icon">{{ group.icon }}</span>
                      <span class="group-title">{{ group.title }}</span>
                      <span class="group-count">({{ group.fields.length }})</span>
                    </div>
                    <!-- 分组字段列表 -->
                    <div class="group-fields">
                      <div
                        v-for="field in group.fields"
                        :key="field.id"
                        class="field-item"
                        :class="{ 'is-selected': isFieldSelected(field.id) }"
                        @click="toggleField(field.id)"
                      >
                        <input
                          :id="`field-${field.id}`"
                          type="checkbox"
                          :checked="isFieldSelected(field.id)"
                          @change="toggleField(field.id)"
                        />
                        <div class="field-info">
                          <div class="field-name">{{ field.name }}</div>
                          <div class="field-source">{{ field.source }}</div>
                        </div>
                        <div class="field-type">{{ field.type }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" @click="handleCancel()">取消</button>
            <button
              class="btn btn-primary"
              :disabled="!isValid"
              @click="handleConfirm()"
            >
              确认
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- 企业选择器弹窗 -->
  <EnterpriseSelector
    v-model="showEnterpriseSelector"
    :enterprises="enterprises"
    @confirm="handleEnterpriseSelected"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import EnterpriseSelector from './EnterpriseSelector.vue'
import type { EnterpriseOption, OutputField, ExpressionConfig, GroupByConfig } from '@/types/nodes'

interface AvailableField {
  id: string
  name: string
  type: string
  source: string
  // 分组相关属性
  sourceNodeId?: string
  sourceType?: 'dataSource' | 'outputData' | 'model' | 'expression' | 'groupby' | 'statistic'
  participantId?: string
  dataset?: string
  modelId?: string
  modelType?: string
}

/**
 * 字段分组
 */
interface FieldGroup {
  id: string
  title: string
  icon: string
  fields: AvailableField[]
}

interface Props {
  modelValue: boolean
  taskId: string
  enterprises: EnterpriseOption[]
  inputFields: AvailableField[]
  modelOutputFields?: AvailableField[]
  taskData?: any  // 任务节点数据（用于检查是否有分组统计模型）
  initialConfig?: {
    participantId: string
    dataset: string
    fields: OutputField[]
    // 新增：字段完整来源信息，用于编辑模式匹配
    fieldSources?: Array<{
      sourceType: 'input' | 'model'
      sourceNodeId?: string  // input 字段的源节点 ID
      modelId?: string      // model 字段的模型 ID
      modelNodeId?: string  // 模型节点 ID（兼容）
    }>
  }
  closeOnOverlay?: boolean
  // 新增：固定企业（用于本地Query任务）
  fixedEnterpriseId?: string
  fixedEnterpriseName?: string
  // 新增：表达式配置（用于本地Query任务）
  expressions?: ExpressionConfig[]
  // 新增：分组统计配置（用于本地Query任务）
  groupByConfig?: GroupByConfig
  // 新增：源节点类型
  sourceNodeType?: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', config: {
    participantId: string
    dataset: string
    fields: OutputField[]
  }): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  modelOutputFields: () => [],
  initialConfig: undefined,
  closeOnOverlay: true,
  fixedEnterpriseId: undefined,
  fixedEnterpriseName: undefined,
  expressions: () => [],
  groupByConfig: undefined,
  sourceNodeType: undefined
})

const emit = defineEmits<Emits>()

// 企业选择器显示状态
const showEnterpriseSelector = ref(false)

// 选中的企业 ID
const selectedEnterpriseId = ref<string>('')

// 数据集名称
const datasetName = ref<string>('')

// 选中的字段 ID 集合
const selectedFieldIds = ref<Set<string>>(new Set())

// 检查是否有分组统计配置（支持 taskData.models 和 props.groupByConfig 两种方式）
const hasGroupByConfig = computed(() => {
  // 方式1：从 taskData.models 检查
  if (props.taskData?.models?.some((m: any) => m.type === 'GROUP_STAT')) {
    return true
  }
  // 方式2：从 props.groupByConfig 检查
  if (props.groupByConfig && props.groupByConfig.statistics.length > 0) {
    return true
  }
  return false
})

// 所有可用字段
const availableFields = computed(() => {
  // 如果有分组统计配置，只返回分组统计的字段
  if (hasGroupByConfig.value) {
    return getGroupByFields()
  }

  // 否则返回输入字段、模型字段和表达式字段
  const allFields: AvailableField[] = [...props.inputFields, ...props.modelOutputFields]

  // 添加表达式字段（新增：用于本地Query任务）
  if (props.expressions && props.expressions.length > 0) {
    props.expressions.forEach(expr => {
      if (expr.resultAlias) {
        const exprPreview = expr.expression && expr.expression.length > 15
          ? `${expr.expression.substring(0, 15)}...`
          : expr.expression || ''
        allFields.push({
          id: `expr-${expr.id}`,
          name: expr.resultAlias,
          type: 'DOUBLE',
          source: `表达式: ${exprPreview}`,
          sourceType: 'expression'
        })
      }
    })
  }

  return allFields
})

/**
 * 获取分组统计字段（用于本地Query任务）
 */
function getGroupByFields(): AvailableField[] {
  const fields: AvailableField[] = []

  // 优先使用 props.groupByConfig
  const config = props.groupByConfig
  if (config) {
    // 添加分组字段
    config.groupByFields.forEach(field => {
      fields.push({
        id: `groupby-${field.fieldId}`,
        name: field.fieldAlias || field.fieldName,
        type: field.fieldType,
        source: '分组字段',
        sourceType: 'groupby'
      })
    })

    // 添加统计字段
    config.statistics.forEach(stat => {
      if (stat.fieldId) {
        fields.push({
          id: `stat-${stat.id}`,
          name: stat.resultAlias,
          type: inferAggregationType(stat.functionType),
          source: `统计: ${stat.functionType}`,
          sourceType: 'statistic'
        })
      }
    })
  }

  return fields
}

/**
 * 推断聚合函数结果类型
 */
function inferAggregationType(func: string): string {
  switch (func) {
    case 'SUM':
    case 'AVG':
      return 'DOUBLE'
    case 'COUNT':
      return 'BIGINT'
    case 'MAX':
    case 'MIN':
      return 'VARCHAR'
    default:
      return 'VARCHAR'
  }
}

/**
 * 将字段按来源分组
 * 1. 输入数据源字段：按数据源分组
 * 2. 模型输出字段：按模型分组
 * 3. 分组统计字段：单独一个分组
 * 4. 表达式字段：单独一个分组
 */
const fieldGroups = computed<FieldGroup[]>(() => {
  const groups: FieldGroup[] = []

  // 如果有分组统计配置，按分组字段和统计字段分组
  if (hasGroupByConfig.value) {
    // 分组字段
    const groupByFields = availableFields.value.filter(f => f.sourceType === 'groupby')
    if (groupByFields.length > 0) {
      groups.push({
        id: 'groupby-fields',
        title: '分组字段',
        icon: '📊',
        fields: groupByFields
      })
    }
    // 统计字段
    const statFields = availableFields.value.filter(f => f.sourceType === 'statistic')
    if (statFields.length > 0) {
      groups.push({
        id: 'stat-fields',
        title: '统计结果',
        icon: '📈',
        fields: statFields
      })
    }
    return groups
  }

  // 原有逻辑：按数据源和模型分组

  // 处理输入数据源字段 - 按数据源分组
  const dataSourceGroups = new Map<string, AvailableField[]>()
  props.inputFields.forEach(field => {
    const key = field.sourceNodeId || field.participantId || field.source
    if (!dataSourceGroups.has(key)) {
      dataSourceGroups.set(key, [])
    }
    dataSourceGroups.get(key)!.push(field)
  })

  // 为每个数据源创建一个分组
  dataSourceGroups.forEach((fields, key) => {
    const firstField = fields[0]
    if (firstField) {
      groups.push({
        id: `input-${key}`,
        title: firstField.source,
        icon: '🗄️',
        fields
      })
    }
  })

  // 处理模型输出字段 - 按模型分组
  const modelGroups = new Map<string, AvailableField[]>()
  props.modelOutputFields.forEach(field => {
    const key = field.modelId || field.modelType || field.source
    if (!modelGroups.has(key)) {
      modelGroups.set(key, [])
    }
    modelGroups.get(key)!.push(field)
  })

  // 为每个模型创建一个分组
  modelGroups.forEach((fields, key) => {
    const firstField = fields[0]
    if (firstField) {
      const icon = firstField.modelType === 'expression' ? '📝' : '📦'
      groups.push({
        id: `model-${key}`,
        title: firstField.source,
        icon,
        fields
      })
    }
  })

  // 添加表达式分组（新增：用于本地Query任务）
  const exprFields = availableFields.value.filter(f => f.sourceType === 'expression')
  if (exprFields.length > 0) {
    groups.push({
      id: 'expressions',
      title: '表达式结果',
      icon: '📝',
      fields: exprFields
    })
  }

  return groups
})

// 选中的企业名称
const selectedEnterpriseName = computed(() => {
  if (!selectedEnterpriseId.value) return ''
  const enterprise = props.enterprises.find(e => e.id === selectedEnterpriseId.value)
  return enterprise?.name || ''
})

// 是否有效（必须选择企业和至少一个字段）
const isValid = computed(() => {
  return selectedEnterpriseId.value.length > 0 &&
         datasetName.value.trim().length > 0 &&
         selectedFieldIds.value.size > 0
})

// 监听 modelValue 变化
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    initializeConfig()
  }
})

/**
 * 初始化配置
 */
function initializeConfig() {
  // 如果有固定企业，直接使用
  if (props.fixedEnterpriseId) {
    selectedEnterpriseId.value = props.fixedEnterpriseId
  } else if (props.initialConfig) {
    selectedEnterpriseId.value = props.initialConfig.participantId
    datasetName.value = props.initialConfig.dataset

    // 使用完整来源信息生成正确的字段 ID
    const fieldIds: string[] = []
    props.initialConfig.fields.forEach((field, index) => {
      const fieldSource = props.initialConfig?.fieldSources?.[index]

      if (field.source === 'input' && fieldSource?.sourceNodeId) {
        // 输入字段：使用 sourceNodeId 生成 ID
        fieldIds.push(`input-${fieldSource.sourceNodeId}-${field.columnName}`)
      } else if (field.source === 'model' && (fieldSource?.modelId || fieldSource?.modelNodeId)) {
        // 模型字段：使用 modelId/modelNodeId 生成 ID
        const modelId = fieldSource.modelId || fieldSource.modelNodeId || ''
        // 根据字段名确定（表达式模型固定为 result）
        const fieldName = field.columnName
        fieldIds.push(`model-${modelId}-${fieldName}`)
      } else {
        // 兼容旧格式：如果没有来源信息，使用简单格式
        fieldIds.push(`${field.source}-${field.columnName}`)
      }
    })

    selectedFieldIds.value = new Set(fieldIds)
  } else {
    // 默认数据集名称
    datasetName.value = `output_${props.taskId}_${Date.now()}`
  }
}

/**
 * 判断字段是否被选中
 */
function isFieldSelected(fieldId: string): boolean {
  return selectedFieldIds.value.has(fieldId)
}

/**
 * 切换字段选中状态
 */
function toggleField(fieldId: string) {
  if (selectedFieldIds.value.has(fieldId)) {
    selectedFieldIds.value.delete(fieldId)
  } else {
    selectedFieldIds.value.add(fieldId)
  }
  // 强制更新响应式
  selectedFieldIds.value = new Set(selectedFieldIds.value)
}

/**
 * 处理企业选择确认
 */
function handleEnterpriseSelected(enterpriseId: string) {
  selectedEnterpriseId.value = enterpriseId
}

/**
 * 获取选中的输出字段
 */
function getSelectedFields(): OutputField[] {
  const fields: OutputField[] = []
  const allFields = availableFields.value

  selectedFieldIds.value.forEach(fieldId => {
    const field = allFields.find(f => f.id === fieldId)
    if (field) {
      const [source] = fieldId.split('-')
      fields.push({
        source: source as 'input' | 'model',
        columnName: field.name,
        columnAlias: field.name,
        columnType: field.type
      })
    }
  })

  return fields
}

/**
 * 处理确认
 */
function handleConfirm() {
  if (!isValid.value) return

  emit('confirm', {
    participantId: selectedEnterpriseId.value,
    dataset: datasetName.value.trim(),
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
  selectedEnterpriseId.value = ''
  datasetName.value = ''
  selectedFieldIds.value.clear()
}
</script>

<style scoped lang="scss">
.output-config-modal {
  max-width: 800px;
}

.output-config {
  .config-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 12px;

    .field-count {
      margin-left: auto;
      font-size: 12px;
      font-weight: 400;
      color: #909399;
      padding: 2px 8px;
      background: #f5f7fa;
      border-radius: 4px;
    }
  }

  .text-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #dcdfe6;
    border-radius: 6px;
    font-size: 14px;
    transition: all 0.2s;

    &:focus {
      outline: none;
      border-color: #409eff;
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
    }

    &::placeholder {
      color: #c0c4cc;
    }
  }

  .enterprise-display {
    .enterprise-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: #f5f7fa;
      border: 2px solid #dcdfe6;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: #ecf5ff;
        border-color: #409eff;
      }
    }

    // 固定企业卡片样式（锁定状态）
    .enterprise-card.locked {
      cursor: default;
      background: #f0f9ff;
      border-color: #13C2C2;

      &:hover {
        background: #f0f9ff;
        border-color: #13C2C2;
      }
    }

    .enterprise-icon {
      flex-shrink: 0;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #409eff, #66b1ff);
      color: white;
      border-radius: 8px;
      font-size: 20px;
      font-weight: 600;
    }

    .enterprise-info {
      flex: 1;
      min-width: 0;
    }

    .enterprise-name {
      font-size: 15px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 2px;
    }

    .enterprise-id {
      font-size: 11px;
      color: #909399;
      font-family: 'Monaco', 'Menlo', monospace;
      padding: 2px 6px;
      background: rgba(0, 0, 0, 0.03);
      border-radius: 4px;
      display: inline-block;
    }

    .enterprise-hint {
      font-size: 12px;
      color: #909399;
    }

    .enterprise-locked-hint {
      font-size: 11px;
      color: #13C2C2;
      margin-top: 4px;
    }

    .arrow-icon {
      flex-shrink: 0;
      color: #c0c4cc;
    }
  }

  .empty-fields {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 50px 20px;
    background: #f5f7fa;
    border-radius: 8px;
    color: #909399;

    .empty-icon {
      font-size: 40px;
      margin-bottom: 12px;
      opacity: 0.6;
    }

    p {
      margin: 4px 0;
      font-size: 14px;
    }

    .empty-hint {
      font-size: 12px;
      color: #c0c4cc;
    }
  }

  .fields-list-grouped {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-height: 350px;
    overflow-y: auto;
    padding: 4px;
  }

  // 字段分组卡片样式（参考节点详情面板）
  .field-group {
    background: #ffffff;
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 12px;
    padding: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    transition: all 0.2s ease;

    &:hover {
      box-shadow: 0 2px 8px rgba(14, 165, 233, 0.1);
      border-color: rgba(14, 165, 233, 0.15);
    }

    .group-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-bottom: 10px;
      margin-bottom: 10px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      position: relative;

      // 蓝色渐变装饰条
      &::before {
        content: '';
        position: absolute;
        left: -12px;
        top: 0;
        bottom: -10px;
        width: 3px;
        background: linear-gradient(180deg, #0EA5E9, #38BDF8);
        border-radius: 2px;
      }

      .group-icon {
        font-size: 16px;
      }

      .group-title {
        flex: 1;
        font-size: 13px;
        font-weight: 600;
        color: #303133;
      }

      .group-count {
        font-size: 11px;
        color: #909399;
        padding: 3px 8px;
        background: rgba(0, 0, 0, 0.04);
        border-radius: 10px;
        font-weight: 500;
      }
    }

    .group-fields {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
  }

  .fields-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 300px;
    overflow-y: auto;
    padding: 4px;
  }

  .field-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    background: #f5f7fa;
    border: 2px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #ecf5ff;
      border-color: #b3d8ff;
    }

    &.is-selected {
      background: #f0f9ff;
      border-color: #409eff;
    }

    input[type="checkbox"] {
      width: 16px;
      height: 16px;
      cursor: pointer;
    }
  }

  .field-info {
    flex: 1;
    min-width: 0;
  }

  .field-name {
    font-size: 14px;
    font-weight: 500;
    color: #303133;
    margin-bottom: 2px;
  }

  .field-source {
    font-size: 12px;
    color: #909399;
  }

  .field-type {
    flex-shrink: 0;
    font-size: 12px;
    color: #606266;
    padding: 4px 8px;
    background: #e4e7ed;
    border-radius: 4px;
    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
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

// 自定义滚动条
.fields-list::-webkit-scrollbar {
  width: 6px;
}

.fields-list::-webkit-scrollbar-track {
  background: #f5f7fa;
  border-radius: 3px;
}

.fields-list::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;

  &:hover {
    background: #c0c4cc;
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
