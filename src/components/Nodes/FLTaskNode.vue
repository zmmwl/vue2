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
      <!-- 配置警告：有连接但列参数未配置 -->
      <div v-if="hasMissingColumnParams" class="config-warning">
        ⚠️ 请配置列选择
      </div>
      <div v-else-if="configSummary" class="config-summary">
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

    <!-- 预处理任务：添加输出按钮 - 基于执行类型控制显示 -->
    <button
      v-if="showPreprocessBtn"
      class="add-output-btn preprocess-output-btn"
      @click="onAddOutput"
      @mousedown.stop
      title="添加输出"
    >
      <span>+</span>
    </button>

    <!-- 特征工程任务：添加输出按钮 - 基于执行类型控制显示 -->
    <button
      v-if="showFeatureEngineeringBtn"
      class="add-output-btn"
      @click="onAddOutput"
      @mousedown.stop
      title="添加输出"
    >
      <span>+</span>
    </button>

    <!-- 横向/纵向模型任务：添加模型输出按钮 - 基于执行类型控制显示 -->
    <button
      v-if="showModelBtn"
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
import { FLTaskCategory, FLMode, FLTaskExecutionType } from '@/types/fl-tasks'
import { getFLCategoryColor, getFLModeLabel } from '@/utils/fl-task-templates'
import { getExecutionTypeForTask, getParametersForTask } from '@/utils/mock-fl-data'
import { useHandleVisibility } from '@/composables/useHandleVisibility'
import { useNodeEvents } from '@/composables/useNodeEvents'

const props = defineProps<NodeProps<NodeData>>()

// 使用 composables
const { hasDataInputConnection, hasOutputConnection, getInputConnectionCount } = useHandleVisibility(props.id)
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

// 任务显示名称（包含子类型）
const taskDisplayName = computed(() => {
  const baseName = flData.value.taskDisplayName || flData.value.taskName || '未知任务'
  if (flData.value.subTypeLabel) {
    return `${baseName} - ${flData.value.subTypeLabel}`
  }
  return baseName
})

// 模式标签
const modeLabel = computed(() => getFLModeLabel(flData.value.flMode))

// 模式样式类
const modeClass = computed(() => {
  return flData.value.flMode === FLMode.TRAINING ? 'training' : 'inference'
})

// 列选择参数名称列表
const COLUMN_PARAM_NAMES = ['columns', 'column', 'subset', 'stratifyColumn', 'labelColumn', 'targetColumn']

// 获取当前任务的参数模板中的列选择参数名称
const taskColumnParamNames = computed(() => {
  const taskName = flData.value.taskName
  const subType = flData.value.subType
  if (!taskName) return []

  const paramDefs = getParametersForTask(taskName, subType || undefined)
  return paramDefs
    .filter(p => COLUMN_PARAM_NAMES.includes(p.name))
    .map(p => p.name)
})

// 检查是否有缺失的必选列参数
const hasMissingColumnParams = computed(() => {
  // 没有连接数据源时不显示警告
  if (!flData.value.inputProviders || flData.value.inputProviders.length === 0) {
    return false
  }

  // 没有需要配置的列参数时不显示警告
  if (taskColumnParamNames.value.length === 0) {
    return false
  }

  const params = flData.value.parameters || {}
  // 只检查当前任务实际拥有的列选择参数
  return taskColumnParamNames.value.some(name =>
    params[name] === undefined ||
    (Array.isArray(params[name]) && (params[name] as any[]).length === 0)
  )
})

// 是否已配置
const isConfigured = computed(() => {
  // 有子类型时必须选择子类型
  const hasSubTypeConfig = flData.value.subType ? true : !hasSubTypes.value
  const hasParams = !!(flData.value.parameters && Object.keys(flData.value.parameters).length > 0)

  // 如果有连接但有必选列参数未配置，标记为未完全配置
  if (flData.value.inputProviders && flData.value.inputProviders.length > 0) {
    return hasSubTypeConfig && hasParams && !hasMissingColumnParams.value
  }

  return hasSubTypeConfig && hasParams
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

// 获取任务的执行类型
const executionType = computed(() => {
  const taskName = flData.value.taskName
  return getExecutionTypeForTask(taskName)
})

// 检查任务是否有子类型
const hasSubTypes = computed(() => {
  // 通过 executionType 来判断，有子类型的任务需要选择后才能确认
  return flData.value.subType !== undefined || !executionType.value
})

// 是否有输出（根据执行类型和连接数量判断）
const hasOutput = computed(() => {
  const execType = executionType.value

  // LOCAL: 有输出 handle
  if (execType === FLTaskExecutionType.LOCAL) {
    return true
  }

  // MULTI_PARTY: 不显示默认输出 handle（需要点击"添加输出"按钮）
  if (execType === FLTaskExecutionType.MULTI_PARTY) {
    return false
  }

  // DYNAMIC: 根据连接数量判断
  // 1个连接 = LOCAL 模式（显示输出 handle）
  // 2+连接 = MULTI_PARTY 模式（不显示默认输出 handle，需要点击按钮）
  if (execType === FLTaskExecutionType.DYNAMIC) {
    return inputConnectionCount.value < 2
  }

  return true
})

// 使用 composable 提供的 Handle 可见性计算属性
const isDataInputVisible = hasDataInputConnection
const isOutputVisible = hasOutputConnection

// 输入连接数量
const inputConnectionCount = computed(() => getInputConnectionCount())

// 是否显示"添加输出"按钮 - 基于执行类型判断
const shouldShowAddOutputBtn = computed(() => {
  const execType = executionType.value

  // LOCAL: 不显示添加输出按钮
  if (execType === FLTaskExecutionType.LOCAL) {
    return false
  }

  // MULTI_PARTY: 显示添加输出按钮
  if (execType === FLTaskExecutionType.MULTI_PARTY) {
    return true
  }

  // DYNAMIC: 根据连接数量动态判断
  // 1个连接 = LOCAL 模式（不显示）
  // 2+连接 = MULTI_PARTY 模式（显示）
  if (execType === FLTaskExecutionType.DYNAMIC) {
    return inputConnectionCount.value >= 2
  }

  return false
})

// 是否是预处理任务
const isPreprocess = computed(() => {
  return flData.value.flCategory === FLTaskCategory.PREPROCESS
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

// 是否显示预处理输出按钮
const showPreprocessBtn = computed(() => {
  return isPreprocess.value && shouldShowAddOutputBtn.value
})

// 是否显示特征工程输出按钮
const showFeatureEngineeringBtn = computed(() => {
  return isFeatureEngineering.value && shouldShowAddOutputBtn.value
})

// 是否显示模型输出按钮
const showModelBtn = computed(() => {
  return isModelTask.value && shouldShowAddOutputBtn.value
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

.fl-task-node {
  min-width: 180px;
  max-width: 220px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: var(--radius-md);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.06),
    0 4px 12px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.2s ease;
  cursor: pointer;

  &:hover {
    box-shadow:
      0 4px 8px rgba(0, 0, 0, 0.08),
      0 8px 24px rgba(0, 0, 0, 0.12);

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
  border-radius: calc(var(--radius-md) - 1px) calc(var(--radius-md) - 1px) 0 0;
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

.config-warning {
  font-size: 11px;
  color: #d48806;
  background: rgba(250, 173, 20, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
  margin-top: 4px;
}

// Handle 样式 - 与计算任务节点保持一致

// 数据源输入 handle - 长方形（顶部）- 使用节点颜色
.data-input-handle {
  width: 24px;
  height: 8px;
  background-color: var(--node-color, #52c41a);
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

// 添加输出按钮（特征工程任务）- 使用节点颜色
.add-output-btn {
  position: absolute;
  bottom: -32px;
  left: 50%;
  transform: translateX(-50%);
  width: 18px;
  height: 18px;
  padding: 0;
  background: linear-gradient(135deg, var(--node-color, #52C41A), var(--node-color, #73d13d));
  border: 2px solid #fff;
  border-radius: 4px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  transition: box-shadow 0.2s ease;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;

  // 引出线
  &::before {
    content: '';
    position: absolute;
    top: -14px;
    left: 50%;
    transform: translateX(-50%);
    width: 2px;
    height: 14px;
    background: linear-gradient(180deg, var(--node-color, #52C41A), rgba(82, 196, 26, 0.3));
    border-radius: 1px;
  }

  // 加号
  &::after {
    content: '+';
    color: white;
    font-size: 14px;
    font-weight: bold;
    line-height: 1;
  }

  // 隐藏原来的文字
  span {
    display: none;
  }

  &:hover {
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);

    &::before {
      height: 16px;
    }
  }

  &:active {
    transform: translateX(-50%) scale(0.95);
  }
}

// 添加模型输出按钮（横向/纵向模型任务）- 使用节点颜色
.add-model-output-btn {
  position: absolute;
  bottom: -32px;
  left: 50%;
  transform: translateX(-50%);
  width: 18px;
  height: 18px;
  padding: 0;
  background: linear-gradient(135deg, var(--node-color, #722ED1), var(--node-color, #9254de));
  border: 2px solid #fff;
  border-radius: 4px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  transition: box-shadow 0.2s ease;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;

  // 引出线
  &::before {
    content: '';
    position: absolute;
    top: -14px;
    left: 50%;
    transform: translateX(-50%);
    width: 2px;
    height: 14px;
    background: linear-gradient(180deg, var(--node-color, #722ED1), rgba(114, 46, 209, 0.3));
    border-radius: 1px;
  }

  // 加号
  &::after {
    content: '+';
    color: white;
    font-size: 14px;
    font-weight: bold;
    line-height: 1;
  }

  // 隐藏原来的文字
  span {
    display: none;
  }

  &:hover {
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);

    &::before {
      height: 16px;
    }
  }

  &:active {
    transform: translateX(-50%) scale(0.95);
  }
}
</style>
