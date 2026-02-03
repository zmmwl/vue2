<template>
  <div class="output-data-node" :class="{ selected }" :data-testid="`node-${data.label}`">
    <!-- 固定的顶部输入连接点 -->
    <Handle
      id="input"
      type="target"
      :position="Position.Top"
      :style="{ left: '50%' }"
      class="input-handle"
    />

    <div class="node-card">
      <div class="node-icon-wrapper">
        <div class="node-icon">📤</div>
      </div>
      <div class="node-info">
        <div class="node-title">{{ data.label || '输出数据' }}</div>
        <div v-if="(data as any).participantId" class="node-meta">
          接收方: {{ (data as any).entityName || (data as any).participantId }}<template v-if="(data as any).participantId"> ({{ (data as any).participantId }})</template>
        </div>
        <div v-if="outputFieldsCount > 0" class="node-meta">
          字段: {{ outputFieldsCount }} 个
        </div>
      </div>
    </div>

    <!-- 固定的底部输出连接点 -->
    <Handle
      id="output"
      type="source"
      :position="Position.Bottom"
      :style="{ left: '50%' }"
      class="output-handle"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import type { NodeData, OutputDataNodeData } from '@/types/nodes'

const props = defineProps<NodeProps<NodeData>>()

// 输出字段数量
const outputFieldsCount = computed(() => {
  const outputData = props.data as OutputDataNodeData
  return outputData.fields?.length || 0
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
    opacity: 1; // 输出节点始终显示输入 handle
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
    opacity: 1; // 输出节点始终显示输出 handle
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 1;
      background-color: #1890ff;
      transform: translateX(-50%) scale(1.2);
    }
  }

  .node-card {
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border: 1px solid #bae6fd;
    border-radius: 8px;
    padding: 12px 16px;
    min-width: 160px;
    max-width: 200px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .node-icon-wrapper {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #ffffff;
    border-radius: 6px;
    border: 1px solid #bae6fd;
  }

  .node-icon {
    font-size: 18px;
    line-height: 1;
  }

  .node-info {
    flex: 1;
    min-width: 0;
  }

  .node-title {
    font-size: 13px;
    font-weight: 600;
    color: #0369a1;
    line-height: 1.3;
    margin-bottom: 2px;
  }

  .node-meta {
    font-size: 11px;
    color: #0c4a6e;
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
}
</style>
