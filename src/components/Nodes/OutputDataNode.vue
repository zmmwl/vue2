<template>
  <div class="output-data-node" :class="{ selected }" :data-testid="`node-${data.label}`">
    <!-- 固定的顶部输入连接点 -->
    <Handle
      id="input"
      type="target"
      :position="Position.Top"
      :style="{ left: '50%' }"
      :class="['input-handle', { 'is-visible': isInputVisible }]"
    />

    <div class="node-card">
      <div class="node-icon-wrapper output-icon">
        <div class="node-icon">📤</div>
      </div>
      <div class="node-info">
        <div class="node-title">{{ data.label }}</div>
        <div v-if="nodeData?.participantId" class="node-participant">
          {{ participantLabel }}
        </div>
        <div v-if="outputFields.length > 0" class="node-fields">
          <span class="field-count">{{ outputFields.length }} 个字段</span>
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
import type { OutputField } from '@/types/contracts'
import { useVueFlow } from '@vue-flow/core'

const props = defineProps<NodeProps<NodeData>>()

const { edges } = useVueFlow()

// 获取输出数据节点数据
const nodeData = computed(() => props.data as any)

// 参与方标签
const participantLabel = computed(() => {
  const id = nodeData.value?.participantId
  return id || '未知企业'
})

// 输出字段列表
const outputFields = computed((): OutputField[] => {
  return (nodeData.value.fields as OutputField[]) || []
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
    opacity: 0;
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
    opacity: 0;
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
    min-width: 180px;
    max-width: 280px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    border-left: 3px solid #52C41A;
  }

  .output-icon {
    background: linear-gradient(135deg, #F6FFED, #D9F7BE);
  }

  .node-icon-wrapper {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f5f5f5;
    border-radius: 8px;
  }

  .node-icon {
    font-size: 22px;
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
    line-height: 1.4;
    margin-bottom: 4px;
  }

  .node-participant {
    font-size: 12px;
    color: #52C41A;
    font-weight: 500;
    margin-bottom: 4px;
  }

  .node-fields {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .field-count {
    font-size: 11px;
    color: #666666;
    padding: 2px 8px;
    background: #F5F5F5;
    border-radius: 4px;
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
