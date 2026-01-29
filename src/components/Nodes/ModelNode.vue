<template>
  <div class="model-node" :class="{ selected }" :data-testid="`node-${data.label}`">
    <!-- 固定的左侧输出连接点 -->
    <Handle
      id="output"
      type="source"
      :position="Position.Left"
      :class="['output-handle', { 'is-visible': isOutputVisible }]"
    />

    <div class="node-card">
      <div class="node-icon-wrapper model-icon">
        <div class="node-icon">{{ data.icon || '📦' }}</div>
      </div>
      <div class="node-info">
        <div class="node-title">{{ data.label }}</div>
        <div v-if="modelData.modelType" class="node-model-type">{{ modelTypeLabel }}</div>
        <div v-if="modelData.participantId" class="node-participant">{{ modelData.participantId }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import type { NodeData } from '@/types/nodes'
import { useVueFlow } from '@vue-flow/core'

// 模型节点数据接口
interface ModelNodeData extends NodeData {
  modelType?: string
  participantId?: string
  modelId?: string
  expression?: string
  parameters?: any[]
}

const props = defineProps<NodeProps<NodeData>>()

const { edges } = useVueFlow()

// 获取模型节点数据
const modelData = computed(() => props.data as ModelNodeData)

// 模型类型标签
const modelTypeLabel = computed(() => {
  const type = modelData.value.modelType as string
  const labels: Record<string, string> = {
    'expression': 'MPC模型(表达式)',
    'CodeBin-V2': 'CodeBin-V2',
    'CodeBin-V3-1': 'CodeBin-V3-1',
    'CodeBin-V3-2': 'CodeBin-V3-2',
    'SPDZ': 'SPDZ'
  }
  return labels[type] || type
})

// 检查是否有输出连接
const isOutputVisible = computed(() => {
  return edges.value.some(edge => edge.source === props.id && edge.sourceHandle === 'output')
})
</script>

<style scoped lang="scss">
.model-node {
  position: relative;

  // 输出 handle - 正方形（左侧）
  .output-handle {
    width: 8px;
    height: 24px;
    background-color: #13C2C2;
    border: 2px solid #ffffff;
    border-radius: 2px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    opacity: 0;
    transition: opacity 0.2s ease;

    &.is-visible {
      opacity: 1;
    }

    &:hover {
      opacity: 1;
      background-color: #1890ff;
      transform: scale(1.1);
    }
  }

  // 鼠标悬停节点时显示所有 handle
  &:hover {
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
    border-left: 3px solid #13C2C2;
  }

  .model-icon {
    background: linear-gradient(135deg, #E6FFFB, #B5F5EC);
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

  .node-model-type {
    font-size: 11px;
    color: #13C2C2;
    font-weight: 600;
    margin-bottom: 2px;
  }

  .node-participant {
    font-size: 11px;
    color: #666666;
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
