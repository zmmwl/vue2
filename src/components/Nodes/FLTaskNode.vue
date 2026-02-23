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
      class="node-handle input-handle"
      :class="{ 'is-visible': isDataInputVisible }"
    />
    <Handle
      v-if="hasOutput"
      type="source"
      :position="Position.Bottom"
      id="output"
      class="node-handle output-handle"
      :class="{ 'is-visible': isOutputVisible }"
    />

    <!-- 特征工程任务：添加输出按钮 -->
    <button
      v-if="isFeatureEngineering"
      class="add-output-btn"
      @click="handleAddOutput"
      @mousedown.stop
      title="添加输出"
    >
      <span>+</span>
    </button>

    <!-- 横向/纵向模型任务：添加模型输出按钮 -->
    <button
      v-if="isModelTask"
      class="add-model-output-btn"
      @click="handleAddModelOutput"
      @mousedown.stop
      title="添加模型输出"
    >
      <span>+</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import type { FLTaskNodeData, NodeData } from '@/types/nodes'
import { FLTaskCategory, FLMode } from '@/types/fl-tasks'
import { getFLCategoryColor, getFLModeLabel } from '@/utils/fl-task-templates'

const props = defineProps<NodeProps<NodeData>>()
const { edges } = useVueFlow()

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

// 检查是否有数据源输入连接
const isDataInputVisible = computed(() => {
  return edges.value.some(edge => edge.target === props.id && edge.targetHandle === 'data-input')
})

// 检查是否有输出连接
const isOutputVisible = computed(() => {
  return edges.value.some(edge => edge.source === props.id && edge.sourceHandle === 'output')
})

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
function handleAddOutput() {
  const event = new CustomEvent('add-fl-output', {
    detail: { nodeId: props.id },
    bubbles: true
  })
  document.dispatchEvent(event)
}

/**
 * 处理添加模型输出按钮点击（横向/纵向模型任务）
 */
function handleAddModelOutput() {
  const event = new CustomEvent('add-fl-model-output', {
    detail: { nodeId: props.id },
    bubbles: true
  })
  document.dispatchEvent(event)
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.fl-task-node {
  min-width: 180px;
  max-width: 220px;
  background: var(--node-bg, var(--info-card-bg));
  border: 2px solid var(--node-color, var(--datasource-blue));
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card-sm);
  transition: var(--button-transition);
  cursor: pointer;

  &:hover {
    box-shadow: var(--shadow-card-hover);
    transform: translateY(-2px);
  }

  &.is-selected {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-selected);
  }

  &.is-configured {
    .node-header {
      background: linear-gradient(135deg, var(--node-color), transparent);
      opacity: 0.9;
    }
  }
}

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: linear-gradient(135deg, var(--node-color, var(--datasource-blue)), transparent);
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  color: white;
  font-size: 12px;
  font-weight: 600;
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
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;

  &.training {
    background: var(--fl-training-badge-bg);
    color: var(--fl-training-badge-text);
  }

  &.inference {
    background: var(--fl-inference-badge-bg);
    color: var(--fl-inference-badge-text);
  }
}

.node-content {
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
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

.node-handle {
  width: 12px;
  height: 12px;
  background: var(--node-color, var(--datasource-blue));
  border: 2px solid white;
  border-radius: 50%;
  transition: all 0.2s ease;
  opacity: 0;
}

.input-handle {
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
}

.output-handle {
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
}

.fl-task-node:hover .node-handle,
.fl-task-node.is-selected .node-handle {
  opacity: 1;
  visibility: visible;
}

.node-handle:hover {
  transform: translateX(-50%) scale(1.3);
}

// 添加输出按钮（特征工程任务）
.add-output-btn {
  position: absolute;
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 24px;
  background: var(--node-color, #1890ff);
  border: 2px solid white;
  border-radius: 4px;
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);

  &:hover {
    transform: translateX(-50%) scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .fl-task-node:hover & {
    opacity: 1;
  }
}

// 添加模型输出按钮（横向/纵向模型任务）
.add-model-output-btn {
  position: absolute;
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 24px;
  background: var(--node-color, #722ed1);
  border: 2px solid white;
  border-radius: 4px;
  color: white;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);

  &:hover {
    transform: translateX(-50%) scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .fl-task-node:hover & {
    opacity: 1;
  }
}
</style>
