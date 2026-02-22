<template>
  <div
    class="pir-task-node"
    :class="{ selected, 'is-configured': isConfigured }"
    :data-testid="`node-pir-task`"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- 顶部数据源输入连接点（和 MPC 一样）-->
    <Handle
      id="data-input"
      type="target"
      :position="Position.Top"
      :style="{ left: '50%', visibility: isDataInputVisible || isHovered ? 'visible' : 'hidden', opacity: isDataInputVisible || isHovered ? 1 : 0 }"
      :class="['data-input-handle', { 'is-visible': isDataInputVisible }]"
    />

    <!-- 左侧输入连接点（模型节点）-->
    <Handle
      id="input"
      type="target"
      :position="Position.Left"
      :style="{ visibility: isInputVisible || isHovered ? 'visible' : 'hidden', opacity: isInputVisible || isHovered ? 1 : 0 }"
      :class="['input-handle', { 'is-visible': isInputVisible }]"
    />

    <div class="node-card">
      <div class="node-icon-wrapper">
        <div class="node-icon">{{ data.icon || '🔍' }}</div>
      </div>
      <div class="node-info">
        <div class="node-title">{{ data.label }}</div>
        <div class="node-description">PIR 隐私信息检索</div>
        <!-- 显示技术路径信息 -->
        <div v-if="techPathLabel" class="node-meta">
          {{ techPathLabel }}
        </div>
        <!-- 显示输入数据源信息 -->
        <div v-if="inputDataSourcesCount > 0" class="node-meta">
          输入: {{ inputDataSourcesCount }} 个数据源
          <span v-if="hasRealtimeDataSource" class="realtime-badge">⚡实时</span>
        </div>
        <!-- 显示输出数量 -->
        <div v-if="outputsCount > 0" class="node-meta">
          输出: {{ outputsCount }} 个
        </div>
      </div>
    </div>

    <!-- 左侧"添加模型"按钮 -->
    <button
      class="add-model-btn"
      @click="handleAddModel"
      @mouseenter="handleHighlightModels"
      @mouseleave="handleClearHighlight"
      @mousedown.stop
      title="添加模型"
    >
      <span>+</span>
    </button>

    <!-- 添加输出按钮 -->
    <button class="add-output-btn" @click="handleAddOutput" @mousedown.stop title="添加输出">
      <span>+</span>
    </button>

    <!-- 右侧"添加算力"按钮 -->
    <button
      class="add-compute-btn"
      @click="handleAddCompute"
      @mouseenter="handleHighlightComputes"
      @mouseleave="handleClearHighlight"
      @mousedown.stop
      title="添加算力"
    >
      <span>+</span>
    </button>

    <!-- 右侧算力输入连接点（算力节点）-->
    <Handle
      id="compute-input"
      type="target"
      :position="Position.Right"
      :style="{ visibility: isComputeInputVisible || isHovered ? 'visible' : 'hidden', opacity: isComputeInputVisible || isHovered ? 1 : 0 }"
      :class="['compute-input-handle', { 'is-visible': isComputeInputVisible }]"
    />

    <!-- 底部输出连接点 -->
    <Handle
      id="output"
      type="source"
      :position="Position.Bottom"
      :style="{ left: '50%', visibility: isOutputVisible || isHovered ? 'visible' : 'hidden', opacity: isOutputVisible || isHovered ? 1 : 0 }"
      :class="['output-handle', { 'is-visible': isOutputVisible }]"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import type { PIRTaskNodeData, NodeData } from '@/types/nodes'
import { useVueFlow } from '@vue-flow/core'
import { TechPath } from '@/types/nodes'

const props = defineProps<NodeProps<NodeData>>()

const { edges } = useVueFlow()

// 悬停状态
const isHovered = ref(false)

// 获取 PIR 任务数据
const pirData = computed(() => props.data as unknown as PIRTaskNodeData)

// 是否已配置
const isConfigured = computed(() => {
  return !!(pirData.value.preloadDataSource || pirData.value.realtimeDataSource)
})

// 是否有实时数据源
const hasRealtimeDataSource = computed(() => {
  return !!pirData.value.realtimeDataSource?.fields?.length
})

// 是否有预加载数据源
const hasPreloadDataSource = computed(() => {
  return !!pirData.value.preloadDataSource
})

// 输入数据源总数
const inputDataSourcesCount = computed(() => {
  let count = 0
  if (hasPreloadDataSource.value) count++
  if (hasRealtimeDataSource.value) count++
  return count
})

// 输出数量
const outputsCount = computed(() => {
  return pirData.value.outputs?.length || 0
})

// 技术路径标签
const techPathLabel = computed(() => {
  if (pirData.value.techPath === TechPath.TEE) {
    return '硬件 TEE'
  } else if (pirData.value.techPath === TechPath.SOFTWARE) {
    return '软件密码学'
  }
  return ''
})

// Handle 可见性
const isDataInputVisible = computed(() => {
  return hasPreloadDataSource.value || hasRealtimeDataSource.value ||
    edges.value.some(e => e.target === props.id && e.targetHandle === 'data-input')
})

const isInputVisible = computed(() => {
  return edges.value.some(e => e.target === props.id && e.targetHandle === 'input')
})

const isComputeInputVisible = computed(() => {
  return edges.value.some(e => e.target === props.id && e.targetHandle === 'compute-input')
})

const isOutputVisible = computed(() => {
  return outputsCount.value > 0 || edges.value.some(e => e.source === props.id)
})

/**
 * 处理添加模型按钮点击
 */
function handleAddModel() {
  const event = new CustomEvent('add-model', {
    detail: { nodeId: props.id },
    bubbles: true
  })
  document.dispatchEvent(event)
}

/**
 * 处理添加输出按钮点击
 */
function handleAddOutput() {
  const event = new CustomEvent('add-output', {
    detail: {
      nodeId: props.id,
      outputType: 'stream'  // PIR 输出固定为流式类型
    },
    bubbles: true
  })
  document.dispatchEvent(event)
}

/**
 * 处理添加算力按钮点击
 */
function handleAddCompute() {
  const event = new CustomEvent('add-compute', {
    detail: { nodeId: props.id },
    bubbles: true
  })
  document.dispatchEvent(event)
}

/**
 * 高亮左侧面板的模型节点
 */
function handleHighlightModels() {
  const event = new CustomEvent('highlight-models', { bubbles: true })
  document.dispatchEvent(event)
}

/**
 * 高亮左侧面板的算力节点
 */
function handleHighlightComputes() {
  const event = new CustomEvent('highlight-computes', { bubbles: true })
  document.dispatchEvent(event)
}

/**
 * 清除高亮
 */
function handleClearHighlight() {
  const event = new CustomEvent('clear-highlight', { bubbles: true })
  document.dispatchEvent(event)
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.pir-task-node {
  min-width: 200px;
  max-width: 240px;
  background: var(--info-card-bg);
  border: 2px solid var(--datasource-blue);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card-sm);
  transition: var(--button-transition);
  position: relative;

  &:hover {
    box-shadow: var(--shadow-card-hover);
    transform: translateY(-2px);

    .add-model-btn,
    .add-output-btn,
    .add-compute-btn {
      opacity: 1;
    }

    // 鼠标悬停节点时显示所有 handle
    .data-input-handle,
    .input-handle,
    .output-handle,
    .compute-input-handle {
      opacity: 1;
      visibility: visible !important;
    }
  }

  &.selected {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-selected);
  }

  &.is-configured {
    .node-icon-wrapper {
      background: linear-gradient(135deg, var(--datasource-blue), #38BDF8);
    }
  }
}

.node-card {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  background-color: #ffffff;
  gap: 12px;
}

.node-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--datasource-blue), #38BDF8);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.node-icon {
  font-size: 20px;
}

.node-info {
  flex: 1;
  min-width: 0;
}

.node-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-description {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-meta {
  font-size: 11px;
  color: #888;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.realtime-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  background: rgba(250, 140, 22, 0.15);
  color: #FA8C16;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
}

// 添加模型按钮
.add-model-btn {
  position: absolute;
  left: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #9333EA;
  background: white;
  color: #9333EA;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s;
  z-index: 10;

  &:hover {
    background: #9333EA;
    color: white;
    transform: translateY(-50%) scale(1.1);
  }
}

// 添加输出按钮
.add-output-btn {
  position: absolute;
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #999;
  background: white;
  color: #999;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s;
  z-index: 10;

  &:hover {
    background: #999;
    color: white;
    transform: translateX(-50%) scale(1.1);
  }
}

// 添加算力按钮
.add-compute-btn {
  position: absolute;
  right: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #FA8C16;
  background: white;
  color: #FA8C16;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s;
  z-index: 10;

  &:hover {
    background: #FA8C16;
    color: white;
    transform: translateY(-50%) scale(1.1);
  }
}

// Handle 样式
.data-input-handle {
  width: 12px;
  height: 12px;
  background: #1890ff;
  border: 2px solid #ffffff;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity 0.2s ease;

  &.is-visible {
    opacity: 1;
    visibility: visible !important;
  }

  &:hover {
    opacity: 1;
    background-color: #1890ff;
    transform: translateX(-50%) scale(1.2);
  }
}

.input-handle {
  width: 8px;
  height: 24px;
  background: #722ED1;
  border: 2px solid #ffffff;
  border-radius: 2px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 0.2s ease;

  &.is-visible {
    opacity: 1;
    visibility: visible !important;
  }

  &:hover {
    opacity: 1;
    background-color: #9254de;
    transform: translateY(-50%) scale(1.1);
  }
}

.output-handle {
  width: 12px;
  height: 12px;
  background: #999;
  border: 2px solid #ffffff;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity 0.2s ease;

  &.is-visible {
    opacity: 1;
    visibility: visible !important;
  }

  &:hover {
    opacity: 1;
    background-color: #1890ff;
    transform: translateX(-50%) scale(1.2);
  }
}

.compute-input-handle {
  width: 8px;
  height: 24px;
  background: #FA8C16;
  border: 2px solid #ffffff;
  border-radius: 2px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 0.2s ease;

  &.is-visible {
    opacity: 1;
    visibility: visible !important;
  }

  &:hover {
    opacity: 1;
    background-color: #1890ff;
    transform: translateY(-50%) scale(1.1);
  }
}
</style>
