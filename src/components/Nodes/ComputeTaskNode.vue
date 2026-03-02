<template>
  <div class="compute-task-node" :class="{ selected }" :data-testid="`node-${data.taskType || data.label}`">
    <!-- 顶部数据源输入连接点 -->
    <Handle
      id="data-input"
      type="target"
      :position="Position.Top"
      :style="{ left: '50%' }"
      :class="['data-input-handle', { 'is-visible': hasDataInputConnection }]"
    />

    <!-- 左侧输入连接点（模型节点） -->
    <Handle
      id="input"
      type="target"
      :position="Position.Left"
      :class="['input-handle', { 'is-visible': hasModelInputConnection }]"
    />

    <div class="node-card">
      <div class="node-icon-wrapper">
        <div class="node-icon">{{ data.icon }}</div>
      </div>
      <div class="node-info">
        <div class="node-title">{{ data.label }}</div>
        <div v-if="data.description" class="node-description">
          {{ data.description }}
        </div>
        <!-- 显示技术路径和计算类型信息 -->
        <div v-if="techPathLabel" class="node-meta">
          {{ techPathLabel }}
        </div>
        <!-- 显示算法信息 -->
        <div v-if="algorithmInfo" class="node-meta algorithm-meta">
          {{ algorithmInfo }}
        </div>
        <!-- 显示输入数据源数量 -->
        <div v-if="inputProvidersCount > 0" class="node-meta">
          输入: {{ inputProvidersCount }} 个数据源
        </div>
        <!-- 显示输出数量 -->
        <div v-if="outputsCount > 0" class="node-meta">
          输出: {{ outputsCount }} 个
        </div>
      </div>
    </div>

    <!-- 左侧"添加模型"按钮（PSI 节点不显示） -->
    <button
      v-if="showAddModelButton"
      class="add-model-btn"
      @click="() => handleAddModel(id)"
      @mouseenter="handleHighlightModels"
      @mouseleave="handleClearHighlight"
      @mousedown.stop
      title="添加模型"
    >
      <span>+</span>
    </button>

    <!-- 添加输出按钮 -->
    <button class="add-output-btn" @click="() => handleAddOutput(id)" @mousedown.stop title="添加输出">
      <span>+</span>
    </button>

    <!-- 右侧"添加算力"按钮 -->
    <button
      class="add-compute-btn"
      @click="() => handleAddCompute(id)"
      @mouseenter="handleHighlightComputes"
      @mouseleave="handleClearHighlight"
      @mousedown.stop
      title="添加算力"
    >
      <span>+</span>
    </button>

    <!-- 右侧算力输入连接点（算力节点） -->
    <Handle
      id="compute-input"
      type="target"
      :position="Position.Right"
      :class="['compute-input-handle', { 'is-visible': hasComputeInputConnection }]"
    />

    <!-- 固定的底部输出连接点 -->
    <Handle
      id="output"
      type="source"
      :position="Position.Bottom"
      :style="{ left: '50%' }"
      :class="['output-handle', { 'is-visible': hasOutputConnection }]"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import type { NodeData, ComputeTaskNodeData, ComputeTaskType } from '@/types/nodes'
import { useHandleVisibility } from '@/composables/useHandleVisibility'
import { useNodeEvents } from '@/composables/useNodeEvents'
import { getTechPathLabel } from '@/utils/task-utils'

const props = defineProps<NodeProps<NodeData>>()

// 使用 composables
const {
  hasDataInputConnection,
  hasOutputConnection,
  hasModelInputConnection,
  hasComputeInputConnection
} = useHandleVisibility(props.id)

const {
  handleAddModel,
  handleAddCompute,
  handleAddOutput,
  handleHighlightModels,
  handleHighlightComputes,
  handleClearHighlight
} = useNodeEvents()

// 节点 ID (简化模板使用)
const id = props.id

// 技术路径标签
const techPathLabel = computed(() => {
  const taskData = props.data as ComputeTaskNodeData
  return getTechPathLabel(taskData.techPath)
})

// 输入数据源数量
const inputProvidersCount = computed(() => {
  const taskData = props.data as ComputeTaskNodeData
  return taskData.inputProviders?.length || 0
})

// 输出数量
const outputsCount = computed(() => {
  const taskData = props.data as ComputeTaskNodeData
  return taskData.outputs?.length || 0
})

// 算法信息
const algorithmInfo = computed(() => {
  const taskData = props.data as ComputeTaskNodeData
  const config = taskData.algorithmConfig
  if (config) {
    return `${config.algorithmName} (${config.algorithmVersion})`
  }
  return null
})

// 是否显示"添加模型"按钮（PSI 节点不显示）
const showAddModelButton = computed(() => {
  const taskData = props.data as ComputeTaskNodeData
  return taskData.taskType !== 'PSI' as ComputeTaskType
})
</script>

<style scoped lang="scss">
.compute-task-node {
  position: relative;

  // 数据源输入 handle - 长方形（顶部）
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

  // 输入 handle - 长方形（左侧）- 紫色表示模型输入
  .input-handle {
    width: 8px;
    height: 24px;
    background-color: #722ED1;
    border: 2px solid #ffffff;
    border-radius: 2px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    transform: translateY(-50%);
    opacity: 0;
    transition: opacity 0.2s ease;

    &.is-visible {
      opacity: 1;
      visibility: visible;
    }

    &:hover {
      opacity: 1;
      visibility: visible;
      background-color: #9254de;
      transform: translateY(-50%) scale(1.1);
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

  // 算力输入 handle - 长方形（右侧）
  .compute-input-handle {
    width: 8px;
    height: 24px;
    background-color: #FA8C16;
    border: 2px solid #ffffff;
    border-radius: 2px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    transform: translateY(-50%);
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
      transform: translateY(-50%) scale(1.1);
    }
  }

  // 鼠标悬停节点时显示所有 handle
  &:hover {
    .data-input-handle,
    .input-handle,
    .output-handle,
    .compute-input-handle {
      opacity: 1;
      visibility: visible;
    }
  }

  .node-card {
    background-color: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 12px 16px;
    min-width: 180px;
    max-width: 240px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .node-icon-wrapper {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f5f5f5;
    border-radius: 6px;
  }

  .node-icon {
    font-size: 20px;
    line-height: 1;
  }

  .node-info {
    flex: 1;
    min-width: 0;
  }

  .node-title {
    font-size: 14px;
    font-weight: 600;
    color: #000000;
    line-height: 1.3;
    margin-bottom: 2px;
  }

  .node-description {
    font-size: 12px;
    color: #666666;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .node-meta {
    font-size: 11px;
    color: #999999;
    line-height: 1.3;
    margin-top: 2px;
  }

  &.selected .node-card {
    border-color: #1890ff;
    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
  }

  &:hover .node-card {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
  }

  // 添加输出按钮 - 线条引出 + 加号方块
  .add-output-btn {
    position: absolute;
    bottom: -32px;
    left: 50%;
    transform: translateX(-50%);
    width: 18px;
    height: 18px;
    padding: 0;
    background: linear-gradient(135deg, #52C41A, #73d13d);
    border: 2px solid #fff;
    border-radius: 4px;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(82, 196, 26, 0.3);
    transition: all 0.2s ease;
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
      background: linear-gradient(180deg, #52C41A, rgba(82, 196, 26, 0.3));
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
      background: linear-gradient(135deg, #73d13d, #95de64);
      box-shadow: 0 3px 8px rgba(82, 196, 26, 0.4);
      transform: translateX(-50%) scale(1.1);

      &::before {
        height: 16px;
        background: linear-gradient(180deg, #73d13d, rgba(115, 209, 61, 0.4));
      }
    }

    &:active {
      transform: translateX(-50%) scale(0.95);
    }
  }

  // 左侧"添加模型"按钮 - 线条引出 + 加号方块
  .add-model-btn {
    position: absolute;
    left: -32px;
    top: 50%;
    transform: translateY(-50%);
    width: 18px;
    height: 18px;
    padding: 0;
    background: linear-gradient(135deg, #722ED1, #9254de);
    border: 2px solid #fff;
    border-radius: 4px;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(114, 46, 209, 0.3);
    transition: all 0.2s ease;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;

    // 引出线
    &::before {
      content: '';
      position: absolute;
      right: -14px;
      top: 50%;
      transform: translateY(-50%);
      width: 14px;
      height: 2px;
      background: linear-gradient(90deg, #722ED1, rgba(114, 46, 209, 0.3));
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
      background: linear-gradient(135deg, #9254de, #b37feb);
      box-shadow: 0 3px 8px rgba(114, 46, 209, 0.4);
      transform: translateY(-50%) scale(1.1);

      &::before {
        width: 16px;
        background: linear-gradient(90deg, #9254de, rgba(146, 84, 222, 0.4));
      }
    }

    &:active {
      transform: translateY(-50%) scale(0.95);
    }
  }

  // 右侧"添加算力"按钮 - 线条引出 + 加号方块
  .add-compute-btn {
    position: absolute;
    right: -32px;
    top: 50%;
    transform: translateY(-50%);
    width: 18px;
    height: 18px;
    padding: 0;
    background: linear-gradient(135deg, #FA8C16, #ffa940);
    border: 2px solid #fff;
    border-radius: 4px;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(250, 140, 22, 0.3);
    transition: all 0.2s ease;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;

    // 引出线
    &::before {
      content: '';
      position: absolute;
      left: -14px;
      top: 50%;
      transform: translateY(-50%);
      width: 14px;
      height: 2px;
      background: linear-gradient(90deg, rgba(250, 140, 22, 0.3), #FA8C16);
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
      background: linear-gradient(135deg, #ffa940, #ffcb6f);
      box-shadow: 0 3px 8px rgba(250, 140, 22, 0.4);
      transform: translateY(-50%) scale(1.1);

      &::before {
        width: 16px;
        background: linear-gradient(90deg, rgba(255, 169, 64, 0.4), #ffa940);
      }
    }

    &:active {
      transform: translateY(-50%) scale(0.95);
    }
  }
}
</style>
