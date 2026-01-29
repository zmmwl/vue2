<template>
  <div class="compute-resource-node" :class="{ selected }" :data-testid="`node-${data.label}`">
    <!-- 固定的右侧输出连接点 -->
    <Handle
      id="output"
      type="source"
      :position="Position.Right"
      :class="['output-handle', { 'is-visible': isOutputVisible }]"
    />

    <div class="node-card">
      <div class="node-icon-wrapper resource-icon">
        <div class="node-icon">{{ data.icon || '⚡' }}</div>
      </div>
      <div class="node-info">
        <div class="node-title">{{ data.label }}</div>
        <div v-if="resourceData.participantId" class="node-participant">{{ resourceData.participantId }}</div>
        <div v-if="hasResourceConfig" class="node-resources">
          <span class="resource-badge">CPU: {{ resourceData.cpu }}核</span>
          <span class="resource-badge">MEM: {{ resourceData.memory }}GB</span>
          <span v-if="resourceData.gpu" class="resource-badge">GPU: {{ resourceData.gpu }}</span>
        </div>
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

// 计算资源节点数据接口
interface ComputeResourceNodeData extends NodeData {
  participantId?: string
  cpu?: number
  memory?: number
  gpu?: number
  gpuType?: string
  resourceType?: string
}

const props = defineProps<NodeProps<NodeData>>()

const { edges } = useVueFlow()

// 获取计算资源节点数据
const resourceData = computed(() => props.data as ComputeResourceNodeData)

// 是否配置了资源
const hasResourceConfig = computed(() => {
  return !!(resourceData.value.cpu || resourceData.value.memory)
})

// 检查是否有输出连接
const isOutputVisible = computed(() => {
  return edges.value.some(edge => edge.source === props.id && edge.sourceHandle === 'output')
})
</script>

<style scoped lang="scss">
.compute-resource-node {
  position: relative;

  // 输出 handle - 菱形（右侧）
  .output-handle {
    width: 10px;
    height: 10px;
    background-color: #FA8C16;
    border: 2px solid #ffffff;
    border-radius: 2px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    transform: translateY(-50%) rotate(45deg);
    opacity: 0.15;  // 改为 0.15 使 handle 始终可以接收事件
    transition: opacity 0.2s ease;

    &.is-visible {
      opacity: 1;
    }

    &:hover {
      opacity: 1;
      background-color: #1890ff;
      transform: translateY(-50%) rotate(45deg) scale(1.2);
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
    border-right: 3px solid #FA8C16;
  }

  .resource-icon {
    background: linear-gradient(135deg, #FFF7E6, #FFD591);
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
    color: #FA8C16;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .node-resources {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .resource-badge {
    font-size: 10px;
    padding: 2px 6px;
    background: rgba(250, 140, 22, 0.1);
    color: #D46B08;
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
