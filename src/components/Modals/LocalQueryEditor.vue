<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click.self="handleCancel">
        <div class="modal-container local-query-editor-modal" @click.stop>
          <!-- 头部 -->
          <div class="modal-header">
            <h3 class="modal-title">编辑本地Query任务</h3>
            <button class="close-btn" @click="handleCancel">×</button>
          </div>

          <!-- 顶部信息区域（只读显示企业信息） -->
          <div class="top-info">
            <div class="info-row">
              <div class="info-item">
                <span class="info-label">任务所属企业:</span>
                <span class="info-value">{{ nodeData?.entityName || nodeData?.participantId || '未设置' }}</span>
              </div>
            </div>
          </div>

          <!-- Section 内容区域 -->
          <div class="modal-body">
            <!-- 字段选择 Section -->
            <CollapsibleSection
              title="字段选择"
              :count="selectedFieldCount"
              :default-expanded="true"
            >
              <FieldSelectionSection
                :input-providers="inputProviders"
                :join-conditions="joinConditions"
                @update:inputProviders="handleInputProvidersUpdate"
                @update:joinConditions="handleJoinConditionsUpdate"
              />
            </CollapsibleSection>

            <!-- 表达式编辑 Section -->
            <CollapsibleSection
              title="表达式编辑"
              :count="expressions.length"
              :default-expanded="true"
            >
              <ExpressionSection
                v-model="expressions"
                :input-providers="inputProviders"
              />
            </CollapsibleSection>

            <!-- 分组统计 Section -->
            <CollapsibleSection
              title="分组统计"
              :count="groupByConfig?.statistics.length || 0"
              :default-expanded="false"
            >
              <GroupBySection
                v-model:config="groupByConfig"
                :input-providers="inputProviders"
                :expressions="expressions"
              />
            </CollapsibleSection>
          </div>

          <!-- SQL 预览区域 -->
          <div class="sql-preview-section" :class="{ collapsed: sqlPreviewCollapsed }">
            <div class="preview-header" @click="sqlPreviewCollapsed = !sqlPreviewCollapsed">
              <span class="preview-title">SQL 预览</span>
              <span class="preview-toggle">{{ sqlPreviewCollapsed ? '▶' : '▼' }}</span>
            </div>
            <pre v-if="!sqlPreviewCollapsed" class="sql-preview">{{ sqlPreview }}</pre>
          </div>

          <!-- 底部按钮 -->
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="handleCancel">取消</button>
            <button class="btn btn-primary" :disabled="!isValid" @click="handleConfirm">
              保存配置
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { InputProvider, JoinCondition, GroupByConfig, LocalQueryNodeData, ExpressionConfig } from '@/types/nodes'
import CollapsibleSection from '@/components/LocalQueryEditor/CollapsibleSection.vue'
import FieldSelectionSection from '@/components/LocalQueryEditor/FieldSelectionSection.vue'
import ExpressionSection from '@/components/LocalQueryEditor/ExpressionSection.vue'
import GroupBySection from '@/components/LocalQueryEditor/GroupBySection.vue'

interface Props {
  modelValue: boolean
  nodeData?: LocalQueryNodeData
  enterprises: Array<{ id: string; name: string }>
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', data: Partial<LocalQueryNodeData>): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// ESC 键关闭弹窗
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.modelValue) {
    handleCancel()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// 配置数据
const inputProviders = ref<InputProvider[]>([])
const joinConditions = ref<JoinCondition[]>([])
const expressions = ref<ExpressionConfig[]>([])
const groupByConfig = ref<GroupByConfig | undefined>(undefined)
const sqlPreviewCollapsed = ref<boolean>(true)

// 已选字段数量
const selectedFieldCount = computed(() => {
  return inputProviders.value.reduce((count, provider) => count + provider.fields.length, 0)
})

// 验证（不再需要企业验证，因为已在拖拽时选定）
const isValid = computed(() => {
  return selectedFieldCount.value > 0
})

// SQL 预览
const sqlPreview = computed(() => {
  if (selectedFieldCount.value === 0) {
    return '-- 请先选择字段'
  }

  // 构建 SELECT 子句
  const selectItems: string[] = []

  inputProviders.value.forEach(provider => {
    provider.fields.forEach(field => {
      const fieldRef = `${provider.participantId}.${provider.dataset}.${field.columnName}`
      if (field.columnAlias && field.columnAlias !== field.columnName) {
        selectItems.push(`${fieldRef} AS ${field.columnAlias}`)
      } else {
        selectItems.push(fieldRef)
      }
    })
  })

  // 添加表达式（如果有）
  if (expressions.value.length > 0) {
    expressions.value.forEach(expr => {
      if (expr.expression.trim()) {
        selectItems.push(`${expr.expression} AS ${expr.resultAlias}`)
      }
    })
  }

  // 添加分组统计（如果有）
  if (groupByConfig.value) {
    if (groupByConfig.value.statistics.length > 0) {
      selectItems.push('-- 分组统计:')
      groupByConfig.value.statistics.forEach(stat => {
        if (stat.fieldId) {
          selectItems.push(`${stat.functionType}(${stat.fieldId}) AS ${stat.resultAlias}`)
        }
      })
    }
  }

  // 构建 FROM 子句
  const fromClauses: string[] = []
  inputProviders.value.forEach(provider => {
    fromClauses.push(`${provider.participantId}.${provider.dataset}`)
  })

  // 构建 JOIN 子句
  let joinClause = ''
  if (joinConditions.value.length > 0) {
    joinConditions.value.forEach(condition => {
      const joinType = condition.joinType
      const firstOperand = condition.operands[0]
      if (!firstOperand) return

      condition.operands.forEach((operand, index) => {
        if (index > 0) {
          joinClause += `\n${joinType} JOIN ${operand.participantId}.${operand.dataset} ON `
          joinClause += firstOperand.columnNames.map((col, i) => {
            const operandCol = operand.columnNames[i] || col
            return `${firstOperand.participantId}.${firstOperand.dataset}.${col} = ${operand.participantId}.${operand.dataset}.${operandCol}`
          }).join(' AND ')
        }
      })
    })
  }

  // 构建 GROUP BY 子句
  let groupByClause = ''
  if (groupByConfig.value && groupByConfig.value.groupByFields.length > 0) {
    groupByClause = `\nGROUP BY ${groupByConfig.value.groupByFields.map(f => f.fieldId).join(', ')}`
  }

  const selectClause = selectItems.join(',\n  ')
  const fromClause = fromClauses.length > 0 ? `FROM ${fromClauses[0]}` : 'FROM ...'

  let sql = `SELECT\n  ${selectClause}\n${fromClause}`
  if (joinClause) {
    sql += joinClause
  }
  if (groupByClause) {
    sql += groupByClause
  }

  return sql
})

// 初始化
watch(() => props.modelValue, (newVal) => {
  if (newVal && props.nodeData) {
    inputProviders.value = props.nodeData.inputProviders ? [...props.nodeData.inputProviders] : []
    joinConditions.value = props.nodeData.joinConditions ? [...props.nodeData.joinConditions] : []
    // 兼容旧的单表达式数据
    if (props.nodeData.expressions && props.nodeData.expressions.length > 0) {
      expressions.value = [...props.nodeData.expressions]
    } else if ((props.nodeData as any).expression) {
      // 向后兼容：将旧的单表达式转换为新格式
      expressions.value = [{
        id: `expr_${Date.now()}`,
        expression: (props.nodeData as any).expression || '',
        resultAlias: 'result'
      }]
    } else {
      expressions.value = []
    }
    groupByConfig.value = props.nodeData.groupByConfig ? { ...props.nodeData.groupByConfig } : undefined
  }
})

// 处理子组件更新
function handleInputProvidersUpdate(providers: InputProvider[]) {
  inputProviders.value = providers
}

function handleJoinConditionsUpdate(conditions: JoinCondition[]) {
  joinConditions.value = conditions
}

// 确认（不再发送企业信息，因为已在拖拽时选定）
function handleConfirm() {
  if (!isValid.value) return

  emit('confirm', {
    inputProviders: inputProviders.value,
    joinConditions: joinConditions.value,
    expressions: expressions.value,
    groupByConfig: groupByConfig.value
  })
  emit('update:modelValue', false)
}

// 取消
function handleCancel() {
  emit('cancel')
  emit('update:modelValue', false)
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
}

.modal-container {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  border-radius: var(--dialog-border-radius);
  width: 90%;
  max-width: 1000px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-dialog-overlay);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.8);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  font-size: 20px;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.06);
    color: var(--text-primary);
  }
}

.top-info {
  padding: 14px 20px;
  background: rgba(255, 255, 255, 0.6);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.info-row {
  display: flex;
  gap: 20px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  white-space: nowrap;
}

.info-value {
  font-size: 13px;
  font-weight: 500;
  color: #13C2C2;
  padding: 4px 10px;
  background: rgba(19, 194, 194, 0.08);
  border-radius: 4px;
}

.modal-body {
  flex: 1;
  min-height: 0; // 关键：允许 flex 子元素收缩并启用滚动
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px 20px;

  // 自定义滚动条
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 3px;

    &:hover {
      background: rgba(0, 0, 0, 0.25);
    }
  }
}

.sql-preview-section {
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(0, 0, 0, 0.02);
  transition: all 0.2s ease;

  &.collapsed {
    background: transparent;
  }
}

.preview-header {
  padding: 8px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.02);
  }

  .collapsed & {
    border-bottom: none;
  }
}

.preview-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.preview-toggle {
  font-size: 10px;
  color: var(--text-secondary);
  transition: transform 0.2s;
}

.sql-preview {
  margin: 0;
  padding: 10px 20px;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 11px;
  line-height: 1.4;
  color: var(--text-primary);
  background: transparent;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 80px;
  overflow-y: auto;

  // 自定义滚动条
  &::-webkit-scrollbar {
    width: 3px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 2px;
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  background: rgba(255, 255, 255, 0.8);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.btn {
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-secondary {
  background: rgba(0, 0, 0, 0.04);
  color: var(--text-primary);
  border: 1px solid rgba(0, 0, 0, 0.1);

  &:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.08);
    border-color: rgba(0, 0, 0, 0.2);
  }
}

.btn-primary {
  background: linear-gradient(135deg, #13C2C2, #36cfc9);
  color: white;
  box-shadow: 0 2px 8px rgba(19, 194, 194, 0.3);

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #36cfc9, #5cdbd3);
    box-shadow: 0 4px 12px rgba(19, 194, 194, 0.4);
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
}

// Modal transition
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s;

  .modal-container {
    transition: transform 0.3s;
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
