<template>
  <div class="local-task-node" :class="{ selected }" :data-testid="`node-${data.label}`">
    <!-- 固定的顶部输入连接点（支持多个输入） -->
    <Handle
      id="input"
      type="target"
      :position="Position.Top"
      :style="{ left: '50%' }"
      :class="['input-handle', { 'is-visible': isInputVisible }]"
    />

    <div class="node-card">
      <div class="node-icon-wrapper concat-icon">
        <div class="node-icon">{{ data.icon || '🔗' }}</div>
      </div>
      <div class="node-info">
        <div class="node-title">{{ data.label }}</div>
        <div v-if="localTaskData.participantId" class="node-participant">{{ localTaskData.participantId }}</div>
        <div v-if="inputProviders.length > 0" class="node-inputs">
          <span class="input-count">{{ inputProviders.length }} 个输入源</span>
        </div>
      </div>
    </div>

    <!-- 固定的底部输出连接点 -->
    <Handle
      id="output"
      type="source"
      :position="Position.Bottom"
      :style="{ left: '50%' }"
      :class="['output-handle', { 'is-visible': isOutputVisible }]"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import type { NodeData } from '@/types/nodes'
import type { LocalTaskNodeData } from '@/types/contracts'
import { useVueFlow } from '@vue-flow/core'

const props = defineProps<NodeProps<NodeData>>()

const { edges } = useVueFlow()

// 获取本地任务节点数据
const localTaskData = computed(() => props.data as Partial<LocalTaskNodeData>)

// 获取输入提供者列表
const inputProviders = computed(() => {
  return (localTaskData.value.inputProviders as any[]) || []
})

// 检查是否有输入连接
const isInputVisible = computed(() => {
  return edges.value.some(edge => edge.target === props.id && edge.targetHandle === 'input')
})

// 检查是否有输出连接
const isOutputVisible = computed(() => {
  return edges.value.some(edge => edge.source === props.id && edge.sourceHandle === 'output')
})
</script>

<style scoped lang="scss">
.local-task-node {
  position: relative;

  // 输入 handle - 长方形（顶部）
  .input-handle {
    width: 24px;
    height: 8px;
    background-color: #52C41A;
    border: 2px solid #ffffff;
    border-radius: 2px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    transform: translateX(-50%);
    opacity: 0.15;  // 改为 0.15 使 handle 始终可以接收事件
    transition: opacity 0.2s ease;

    &.is-visible {
      opacity: 1;
    }

    &:hover {
      opacity: 1;
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
    opacity: 0.15;  // 改为 0.15 使 handle 始终可以接收事件
    transition: opacity 0.2s ease;

    &.is-visible {
      opacity: 1;
    }

    &:hover {
      opacity: 1;
      background-color: #1890ff;
      transform: translateX(-50%) scale(1.2);
    }
  }

  // 鼠标悬停节点时显示所有 handle
  &:hover {
    .input-handle,
    .output-handle {
      opacity: 1;
    }
  }

  .node-card {
    background-color: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 12px 16px;
    min-width: 160px;
    max-width: 240px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    border-left: 3px solid #52C41A;
  }

  .concat-icon {
    background: linear-gradient(135deg, #F6FFED, #D9F7BE);
  }

  .node-icon-wrapper {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f5f5f5;
    border-radius: 8px;
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
    font-size: 13px;
    font-weight: 600;
    color: #000000;
    line-height: 1.4;
    margin-bottom: 4px;
  }

  .node-participant {
    font-size: 11px;
    color: #52C41A;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .node-inputs {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .input-count {
    font-size: 10px;
    padding: 2px 6px;
    background: rgba(82, 196, 26, 0.1);
    color: #389E0D;
    border-radius: 4px;
    font-weight: 600;
    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
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
