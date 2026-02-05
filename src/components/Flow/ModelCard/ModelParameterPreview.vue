<template>
  <div v-if="summaries.length > 0" class="param-preview">
    <div class="preview-header" @click="toggleExpanded">
      <span class="preview-title">
        参数配置
        <span class="param-count">({{ totalCount }})</span>
      </span>
      <span class="expand-icon" :class="{ expanded: isExpanded }">▼</span>
    </div>

    <transition name="collapse">
      <div v-show="isExpanded" class="preview-list">
        <div
          v-for="summary in displaySummaries"
          :key="summary.name"
          class="param-preview-item"
          :class="{
            'is-configured': summary.isConfigured,
            'is-required': summary.isRequired,
            'is-unconfigured': !summary.isConfigured
          }"
        >
          <!-- 参数图标和名称 -->
          <div class="param-info">
            <span class="param-icon">{{ getParamIcon(summary) }}</span>
            <span class="param-name">{{ summary.name }}</span>
            <span v-if="summary.isRequired" class="required-mark">*</span>
            <span
              class="param-type-badge"
              :style="{ color: getDataTypeColor(summary.dataTypeNum) }"
            >
              {{ summary.dataType }}
            </span>
          </div>

          <!-- 配置值 -->
          <div class="param-value">
            <span v-if="summary.type === 'unconfigured'" class="unconfigured-text">
              未配置
            </span>
            <span v-else-if="summary.type === 'field'" class="field-binding">
              <span class="binding-label">字段绑定</span>
              <span class="field-path">{{ formatFieldPath(summary) }}</span>
            </span>
            <span v-else class="fixed-value">
              <span class="binding-label">固定值</span>
              <span class="value-text">{{ truncateValue(summary.displayValue) }}</span>
            </span>
          </div>
        </div>

        <!-- 显示更多按钮 -->
        <div
          v-if="summaries.length > defaultShowCount"
          class="show-more-btn"
          @click="toggleExpanded"
        >
          {{ isExpanded ? '收起' : `查看全部 ${summaries.length} 个参数` }}
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ModelParameterSignature, AvailableFieldOption } from '@/types/nodes'
import { getParamSummary, type ParamSummaryInfo, getDataTypeColor } from '@/utils/model-config-utils'

interface Props {
  signatures: ModelParameterSignature[]           // 参数签名定义列表
  parameters: any[]                                // 已配置参数列表
  availableFields: Array<{                        // 可用字段列表
    id: string
    participantId: string
    dataset: string
    fieldName: string
    fieldType: string
    sourceNodeId?: string                          // 可选的源节点ID
  }>
}

const props = defineProps<Props>()

// 默认显示前 3 个参数
const defaultShowCount = 3

// 展开状态
const isExpanded = ref(false)

// 切换展开状态
function toggleExpanded() {
  isExpanded.value = !isExpanded.value
}

// 生成参数摘要列表
const summaries = computed(() => {
  // 确保可用字段符合 AvailableFieldOption 类型
  const validFields: AvailableFieldOption[] = props.availableFields.map(f => ({
    id: f.id,
    participantId: f.participantId,
    dataset: f.dataset,
    fieldName: f.fieldName,
    fieldType: f.fieldType,
    sourceNodeId: f.sourceNodeId || ''
  }))

  return props.signatures.map(sig => {
    const param = props.parameters.find(p => p.name === sig.name)
    const summary = getParamSummary(param, sig, validFields)
    return {
      name: sig.name,
      dataTypeNum: sig.dataType,
      ...summary
    }
  })
})

// 总参数数量
const totalCount = computed(() => summaries.value.length)

// 显示的摘要列表（根据展开状态）
const displaySummaries = computed(() => {
  if (!isExpanded.value) {
    return summaries.value.slice(0, defaultShowCount)
  }
  return summaries.value
})

// 获取参数图标
function getParamIcon(summary: ParamSummaryInfo): string {
  if (summary.type === 'unconfigured') return '⚠️'
  if (summary.type === 'field') return '📋'
  return '⚙️'
}

// 格式化字段路径（简化显示）
function formatFieldPath(summary: ParamSummaryInfo): string {
  if (summary.type !== 'field' || !summary.fieldInfo) {
    return summary.displayValue
  }

  const { participantId, dataset, fieldName } = summary.fieldInfo
  // 如果路径太长，简化显示
  const fullPath = `${participantId}.${dataset}.${fieldName}`
  if (fullPath.length > 30) {
    return `${participantId}...${fieldName}`
  }
  return fullPath
}

// 截断过长的值
function truncateValue(value: string): string {
  if (value.length > 25) {
    return value.substring(0, 25) + '...'
  }
  return value
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.param-preview {
  margin-top: 10px;
  background: var(--param-preview-bg);
  border: 1px solid var(--param-preview-border);
  border-radius: 8px;
  overflow: hidden;
  transition: all var(--transition-base) var(--easing-smooth);

  &:hover {
    background: var(--param-preview-hover);
    border-color: rgba(14, 165, 233, 0.1);
  }
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  cursor: pointer;
  user-select: none;
  transition: background var(--transition-fast) var(--easing-smooth);

  &:hover {
    background: rgba(0, 0, 0, 0.02);
  }
}

.preview-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);

  .param-count {
    font-size: 11px;
    font-weight: 400;
    color: var(--text-secondary);
    margin-left: 4px;
  }
}

.expand-icon {
  font-size: 10px;
  color: var(--text-secondary);
  transition: transform var(--transition-base) var(--easing-smooth);

  &.expanded {
    transform: rotate(180deg);
  }
}

// 折叠动画
.collapse-enter-active,
.collapse-leave-active {
  transition: all var(--transition-base) var(--easing-smooth);
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  max-height: 500px;
  opacity: 1;
}

.preview-list {
  padding: 0 12px 12px;
}

.param-preview-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.04);
  border-radius: 6px;
  margin-bottom: 8px;
  transition: all var(--transition-base) var(--easing-smooth);

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    border-color: rgba(14, 165, 233, 0.15);
    box-shadow: 0 2px 6px rgba(14, 165, 233, 0.06);
  }

  &.is-unconfigured {
    background: linear-gradient(135deg, rgba(250, 140, 22, 0.03), rgba(250, 140, 22, 0.05));
    border-color: rgba(250, 140, 22, 0.1);
  }

  &.is-configured {
    background: linear-gradient(135deg, rgba(82, 196, 26, 0.02), rgba(82, 196, 26, 0.04));
    border-color: rgba(82, 196, 26, 0.08);
  }
}

.param-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.param-icon {
  font-size: 14px;
  line-height: 1;
}

.param-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}

.required-mark {
  font-size: 12px;
  color: var(--param-status-partial);
  font-weight: 600;
  margin-left: 2px;
}

.param-type-badge {
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 3px;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-weight: 500;
  margin-left: auto;
}

.param-value {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  padding-left: 22px; // 对齐参数名称（跳过图标）
}

.unconfigured-text {
  color: var(--param-status-unconfigured);
  font-weight: 500;
}

.field-binding,
.fixed-value {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
}

.binding-label {
  padding: 2px 6px;
  background: rgba(14, 165, 233, 0.08);
  color: var(--datasource-blue);
  border-radius: 3px;
  font-weight: 500;
  font-size: 10px;
  white-space: nowrap;
}

.field-path,
.value-text {
  color: var(--text-primary);
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  word-break: break-all;
}

.show-more-btn {
  text-align: center;
  padding: 8px;
  margin-top: 8px;
  font-size: 11px;
  color: var(--datasource-blue);
  cursor: pointer;
  user-select: none;
  border-radius: 4px;
  transition: background var(--transition-fast) var(--easing-smooth);

  &:hover {
    background: rgba(14, 165, 233, 0.08);
  }
}
</style>
