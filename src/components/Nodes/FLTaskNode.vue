<template>
  <div
    class="fl-task-node"
    :class="{ 'is-selected': selected, 'is-configured': isConfigured }"
    :style="{ '--node-color': color, '--node-bg': nodeBg }"
  >
    <!-- 节点头部 -->
    <div class="node-header">
      <span class="node-icon">{{ icon }}</span>
      <span class="node-label">{{ label }}</span>
      <span
        class="mode-badge"
        :class="modeClass"
      >
        {{ modeLabel }}
      </span>
    </div>

    <!-- 节点内容 -->
    <div class="node-content">
      <div class="task-name">{{ taskDisplayName }}</div>
      <div v-if="configSummary" class="config-summary">
        {{ configSummary }}
      </div>
      <div v-else class="config-hint">
        点击配置参数
      </div>
    </div>

    <!-- Handle 连接点 -->
    <!-- 顶部数据源输入连接点 -->
    <Handle
      type="target"
      :position="Position.Top"
      id="data-input"
      :style="{ left: '50%' }"
      :class="['data-input-handle', { 'is-visible': isDataInputVisible }]"
    />
    <Handle
      v-if="hasOutput"
      type="source"
      :position="Position.Bottom"
      id="output"
      :style="{ left: '50%' }"
      :class="['output-handle', { 'is-visible': isOutputVisible }]"
    />

    <!-- 特征工程任务：添加输出按钮 -->
    <button
      v-if="isFeatureEngineering"
      class="add-output-btn"
      @click="onAddOutput"
      @mousedown.stop
      title="添加输出"
    >
      <span>+</span>
    </button>

    <!-- 横向/纵向模型任务：添加模型输出按钮 -->
    <button
      v-if="isModelTask"
      class="add-model-output-btn"
      @click="onAddModelOutput"
      @mousedown.stop
      title="添加模型输出"
    >
      <span>+</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import type { FLTaskNodeData, NodeData } from '@/types/nodes'
import { FLTaskCategory, FLMode } from '@/types/fl-tasks'
import { getFLCategoryColor, getFLModeLabel } from '@/utils/fl-task-templates'
import { useHandleVisibility } from '@/composables/useHandleVisibility'
import { useNodeEvents } from '@/composables/useNodeEvents'

const props = defineProps<NodeProps<NodeData>>()

// 使用 composables
const { hasDataInputConnection, hasOutputConnection } = useHandleVisibility(props.id)
const { handleAddFLOutput, handleAddModelOutput } = useNodeEvents()

// 获取 FL 任务数据
const flData = computed(() => props.data as unknown as FLTaskNodeData)

// 节点颜色
const color = computed(() => getFLCategoryColor(flData.value.flCategory))

// 节点背景色
const nodeBg = computed(() => {
  if (flData.value.flCategory === FLTaskCategory.PREPROCESS) {
    return 'var(--fl-preprocess-bg)'
  } else if (flData.value.flCategory === FLTaskCategory.FEATURE_ENGINEERING) {
    return 'var(--fl-feature-bg)'
  } else if (flData.value.flCategory === FLTaskCategory.HORIZONTAL_MODEL) {
    return 'var(--fl-horizontal-bg)'
  } else {
    return 'var(--fl-vertical-bg)'
  }
})

// 节点标签
const label = computed(() => props.data.label || '联邦学习任务')

// 节点图标
const icon = computed(() => props.data.icon || '⚙️')

// 任务显示名称
const taskDisplayName = computed(() => flData.value.taskDisplayName || flData.value.taskName || '未知任务')

// 模式标签
const modeLabel = computed(() => getFLModeLabel(flData.value.flMode))

// 模式样式类
const modeClass = computed(() => {
  return flData.value.flMode === FLMode.TRAINING ? 'training' : 'inference'
})

// 是否已配置
const isConfigured = computed(() => {
  return !!(flData.value.parameters && Object.keys(flData.value.parameters).length > 0)
})

// 配置摘要
const configSummary = computed(() => {
  if (!flData.value.parameters) return ''
  const keys = Object.keys(flData.value.parameters)
  if (keys.length === 0) return ''
  // 显示前2个参数
  const summary = keys.slice(0, 2).map(k => `${k}: ${flData.value.parameters![k]}`).join(', ')
  return keys.length > 2 ? `${summary}...` : summary
})

// 是否有输出（所有 FL 任务都有输出，预处理任务的输出结构和输入一致）
const hasOutput = computed(() => {
  // 预处理任务需要配置后才有输出
  if (flData.value.flCategory === FLTaskCategory.PREPROCESS) {
    return !!(flData.value.inputProviders && flData.value.inputProviders.length > 0)
  }
  return true
})

// 使用 composable 提供的 Handle 可见性计算属性
const isDataInputVisible = hasDataInputConnection
const isOutputVisible = hasOutputConnection

// 是否是特征工程任务
const isFeatureEngineering = computed(() => {
  return flData.value.flCategory === FLTaskCategory.FEATURE_ENGINEERING
})

// 是否是模型任务（横向或纵向）
const isModelTask = computed(() => {
  return flData.value.flCategory === FLTaskCategory.HORIZONTAL_MODEL ||
         flData.value.flCategory === FLTaskCategory.VERTICAL_MODEL
})

/**
 * 处理添加输出按钮点击（特征工程任务）
 */
function onAddOutput() {
  handleAddFLOutput(props.id)
}

/**
 * 处理添加模型输出按钮点击（横向/纵向模型任务）
 */
function onAddModelOutput() {
  handleAddModelOutput(props.id)
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;
@use '@/assets/styles/_node-handles.scss' as *;
@use '@/assets/styles/_node-buttons.scss' as *;

.fl-task-node {
  min-width: 180px;
  max-width: 220px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: var(--radius-md);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.06),
    0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
  cursor: pointer;
  overflow: hidden;

  &:hover {
    box-shadow:
      0 4px 8px rgba(0, 0, 0, 0.08),
      0 8px 24px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);

    // 悬停时显示所有 Handle
    .data-input-handle,
    .output-handle {
      opacity: 1;
      visibility: visible;
    }
  }

  &.is-selected {
    border-color: var(--color-primary);
    box-shadow:
      0 2px 8px rgba(24, 144, 255, 0.15),
      0 4px 16px rgba(24, 144, 255, 0.2);

    .data-input-handle,
    .output-handle {
      opacity: 1;
      visibility: visible;
    }
  }

  &.is-configured {
    .node-header {
      background: linear-gradient(135deg, var(--node-color), color-mix(in srgb, var(--node-color) 60%, white));
    }
  }
}

.node-header {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: linear-gradient(135deg, var(--node-color, var(--datasource-blue)), color-mix(in srgb, var(--node-color) 70%, white));
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  color: white;
  font-size: 12px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.node-icon {
  font-size: 16px;
}

.node-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mode-badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  backdrop-filter: brightness(0.95);

  &.training {
    background: rgba(255, 255, 255, 0.25);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  &.inference {
    background: rgba(255, 255, 255, 0.25);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
}

.node-content {
  padding: 12px;
  background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
  border-radius: 0 0 calc(var(--radius-md) - 1px) calc(var(--radius-md) - 1px);
}

.task-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.config-summary {
  font-size: 11px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.config-hint {
  font-size: 11px;
  color: var(--text-disabled);
  font-style: italic;
}

// Handle 样式 - 与计算任务节点保持一致

// 数据源输入 handle - 长方形（顶部）- 绿色
.data-input-handle {
  width: 24px;
  height: 8px;
  background-color: #52c41a;
  border: 2px solid #ffffff;
  border-radius: 2px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity 0.2s ease;

  &.is-visible {
    opacity: 1;
    visibility: visible;
  }

  &:hover {
    opacity: 1;
    visibility: visible;
    background-color: #1890ff;
    transform: translateX(-50%) scale(1.1);
  }
}

// 输出 handle - 圆形（底部）- 灰色
.output-handle {
  width: 12px;
  height: 12px;
  background-color: #999999;
  border: 2px solid #ffffff;
  border-radius: 50%;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity 0.2s ease;

  &.is-visible {
    opacity: 1;
    visibility: visible;
  }

  &:hover {
    opacity: 1;
    visibility: visible;
    background-color: #1890ff;
    transform: translateX(-50%) scale(1.2);
  }
}

// 添加输出按钮（特征工程任务）- 使用共享 mixin
.add-output-btn {
  @include add-fl-output-button;
}

// 添加模型输出按钮（横向/纵向模型任务）- 使用共享 mixin
.add-model-output-btn {
  @include add-model-output-button;
}
</style>
