<template>
  <div
    class="output-data-node"
    :class="{
      selected,
      'is-realtime': isRealtimeDataSource,
      'is-pir-output': isPIROutput
    }"
    :data-testid="`node-${data.label}`"
  >
    <!-- 固定的顶部输入连接点 -->
    <Handle
      id="input"
      type="target"
      :position="Position.Top"
      :style="{ left: '50%' }"
      class="input-handle"
    />

    <div class="node-card" :class="{ 'is-expanded': isExpanded }">
      <!-- 头部：图标 + 标题 -->
      <div class="node-header">
        <div class="node-icon-wrapper">
          <div class="node-icon">{{ nodeIcon }}</div>
        </div>
        <div class="node-title-section">
          <div class="node-title" :title="outputDataset">{{ displayTitle }}</div>
          <div v-if="participantDisplay" class="node-meta">
            {{ isPIROutput ? '实时数据源' : '接收方' }}: <span class="participant-text">{{ participantDisplay }}</span>
          </div>
        </div>
      </div>

      <!-- 实时数据源标识 -->
      <div v-if="isPIROutput" class="realtime-badge">
        <span class="badge-icon">⚡</span>
        <span class="badge-text">PIR输出 · 实时数据源</span>
      </div>

      <!-- 字段信息 -->
      <div v-if="hasFields" class="node-meta-info">
        <div class="meta-item">
          <span class="meta-label">字段数</span>
          <span class="meta-value is-field-count">[{{ outputFieldsCount }}]</span>
        </div>
      </div>

      <!-- 展开/收起按钮（仅当有字段时显示） -->
      <div
        v-if="hasFields"
        class="expand-toggle"
        @click.stop="isExpanded = !isExpanded"
      >
        <span class="toggle-text">{{ isExpanded ? '收起字段' : '展开字段' }}</span>
        <span class="toggle-icon" :class="{ 'is-expanded': isExpanded }">▼</span>
      </div>

      <!-- 字段列表（展开时显示） -->
      <Transition name="expand">
        <div v-if="hasFields && isExpanded" class="node-fields-list">
          <div
            v-for="field in displayFields"
            :key="field.columnName"
            class="field-item"
          >
            <span class="field-name" :title="field.columnAlias || field.columnName">
              {{ field.columnAlias || field.columnName }}
            </span>
            <span class="field-type" :title="field.columnType">{{ field.columnType }}</span>
          </div>
        </div>
      </Transition>
    </div>

    <!-- 固定的底部输出连接点 -->
    <Handle
      id="output"
      type="source"
      :position="Position.Bottom"
      :style="{ left: '50%' }"
      class="output-handle"
      :class="{ 'is-realtime': isPIROutput }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import type { NodeData, OutputDataNodeData } from '@/types/nodes'

const props = defineProps<NodeProps<NodeData>>()

// 展开/收起状态
const isExpanded = ref(false)

// 输出数据节点数据
const outputData = computed(() => props.data as OutputDataNodeData)

// 是否是 PIR 输出（实时数据源）
const isPIROutput = computed(() => {
  return !!(outputData.value as any)?.isPIROutput
})

// 是否是实时数据源样式
const isRealtimeDataSource = computed(() => isPIROutput.value)

// 节点图标
const nodeIcon = computed(() => {
  return isPIROutput.value ? '⚡' : '📤'
})

// 输出数据集名称
const outputDataset = computed(() => outputData.value?.dataset || '')

// 输出字段数量
const outputFieldsCount = computed(() => {
  return outputData.value?.fields?.length || 0
})

// 是否有字段
const hasFields = computed(() => outputFieldsCount.value > 0)

// 显示的标题（截断过长的名称）
const displayTitle = computed(() => {
  const dataset = outputDataset.value
  if (!dataset) return isPIROutput.value ? 'PIR输出' : '输出数据'
  if (dataset.length > 15) {
    return dataset.substring(0, 15) + '...'
  }
  return dataset
})

// 参与方显示（同时显示企业名称和ID）
const participantDisplay = computed(() => {
  if (isPIROutput.value) {
    return '可连接下游PIR任务'
  }
  const { participantId, entityName } = outputData.value || {}
  if (entityName && participantId) {
    return `${entityName} (${participantId})`
  }
  if (participantId) {
    return participantId
  }
  return ''
})

// 显示的字段列表
const displayFields = computed(() => {
  const fields = outputData.value?.fields || []
  return fields.map(field => ({
    columnName: field.columnName,
    columnAlias: field.columnAlias || field.columnName,
    columnType: field.columnType
  }))
})
</script>

<style scoped lang="scss">
.output-data-node {
  position: relative;

  // 输入 handle - 长方形（顶部）
  .input-handle {
    width: 24px;
    height: 8px;
    background-color: #52c41a;
    border: 2px solid #ffffff;
    border-radius: 2px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    transform: translateX(-50%);
    opacity: 1;
    transition: opacity 0.2s ease;

    &:hover {
      background-color: #1890ff;
      transform: translateX(-50%) scale(1.1);
    }
  }

  // 输出 handle - 圆形（底部）
  .output-handle {
    width: 12px;
    height: 12px;
    background-color: #999999;
    border: 2px solid #ffffff;
    border-radius: 50%;
    transform: translateX(-50%);
    opacity: 1;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 1;
      background-color: #1890ff;
      transform: translateX(-50%) scale(1.2);
    }
  }

  .node-card {
    width: 240px;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border: 1px solid #bae6fd;
    border-radius: 12px;
    padding: 12px 14px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .node-header {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  .node-icon-wrapper {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #ffffff;
    border-radius: 8px;
    border: 1px solid #bae6fd;
  }

  .node-icon {
    font-size: 18px;
    line-height: 1;
  }

  .node-title-section {
    flex: 1;
    min-width: 0;
  }

  .node-title {
    font-size: 13px;
    font-weight: 600;
    color: #0369a1;
    line-height: 1.3;
    margin-bottom: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: help;
    position: relative;

    // CSS Tooltip
    &:hover::after {
      content: attr(title);
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      padding: 6px 10px;
      background: rgba(0, 0, 0, 0.85);
      color: #ffffff;
      font-size: 12px;
      font-weight: 400;
      white-space: nowrap;
      border-radius: 6px;
      pointer-events: none;
      z-index: 1000;
      margin-bottom: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    &:hover::before {
      content: '';
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-bottom: 6px solid rgba(0, 0, 0, 0.85);
      margin-bottom: 0;
      z-index: 1000;
    }
  }

  .node-meta {
    font-size: 10px;
    color: #0c4a6e;
    line-height: 1.3;
    margin-top: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    .participant-text {
      font-weight: 500;
    }
  }

  .node-meta-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-top: 8px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }

  .meta-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11px;
    line-height: 1.4;

    .meta-label {
      color: #8C8C8C;
      font-weight: 400;
      flex-shrink: 0;
    }

    .meta-value {
      color: #262626;
      font-weight: 500;
      text-align: right;

      &.is-field-count {
        color: #52c41a;
        font-weight: 600;
      }
    }
  }

  // 展开/收起按钮
  .expand-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 6px 10px;
    margin-top: 2px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    cursor: pointer;
    transition: all 0.2s ease;
    border-radius: 0 0 12px 12px;

    .toggle-text {
      font-size: 10px;
      font-weight: 500;
      color: #8C8C8C;
    }

    .toggle-icon {
      font-size: 9px;
      color: #8C8C8C;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &.is-expanded {
        transform: rotate(180deg);
      }
    }

    &:hover {
      background-color: rgba(0, 0, 0, 0.02);

      .toggle-text,
      .toggle-icon {
        color: #0369a1;
      }
    }
  }

  // 字段列表
  .node-fields-list {
    padding: 6px 10px;
    margin-top: 2px;
    background-color: rgba(0, 0, 0, 0.02);
    border-radius: 0 0 12px 12px;
    max-height: 180px;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.1);
      border-radius: 2px;

      &:hover {
        background: rgba(0, 0, 0, 0.15);
      }
    }
  }

  .field-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 4px 0;
    font-size: 10px;

    &:not(:last-child) {
      border-bottom: 1px solid rgba(0, 0, 0, 0.04);
    }
  }

  .field-name {
    flex: 1;
    color: #262626;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: help;
    position: relative;

    // CSS Tooltip
    &:hover::after {
      content: attr(title);
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      padding: 4px 8px;
      background: rgba(0, 0, 0, 0.85);
      color: #ffffff;
      font-size: 11px;
      font-weight: 400;
      white-space: nowrap;
      border-radius: 4px;
      pointer-events: none;
      z-index: 1000;
      margin-bottom: 4px;
    }

    &:hover::before {
      content: '';
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 4px solid transparent;
      border-right: 4px solid transparent;
      border-bottom: 4px solid rgba(0, 0, 0, 0.85);
      margin-bottom: 0;
      z-index: 1000;
    }
  }

  .field-type {
    color: #8C8C8C;
    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
    font-size: 9px;
    background: rgba(0, 0, 0, 0.04);
    padding: 2px 4px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  // 展开/收起过渡动画
  .expand-enter-active,
  .expand-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
  }

  .expand-enter-from,
  .expand-leave-to {
    max-height: 0;
    opacity: 0;
    padding-top: 0;
    padding-bottom: 0;
  }

  .expand-enter-to,
  .expand-leave-from {
    max-height: 180px;
    opacity: 1;
  }

  // 实时数据源样式
  &.is-realtime,
  &.is-pir-output {
    .node-card {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f7fa 100%);
      border: 2px dashed var(--realtime-datasource-color, #13c2c2);
    }
  }

  .realtime-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: linear-gradient(135deg, rgba(19, 194, 194, 0.1), rgba(19, 194, 194, 0.05));
    border: 1px dashed rgba(19, 194, 194, 0.4);
    border-radius: 6px;
    margin-top: 4px;

    .badge-icon {
      font-size: 14px;
    }

    .badge-text {
      font-size: 11px;
      font-weight: 500;
      color: #0891b2;
    }
  }

  // 实时数据源输出 handle 样式
  .output-handle.is-realtime {
    background: var(--realtime-datasource-color, #13c2c2);
    border: 2px dashed #ffffff;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(19, 194, 194, 0.4);
    }
    50% {
      box-shadow: 0 0 0 4px rgba(19, 194, 194, 0);
    }
  }

  &.selected .node-card {
    border-color: #1890ff;
    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
  }

  &:hover .node-card {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
  }
}
</style>
