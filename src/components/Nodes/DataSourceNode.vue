<template>
  <div class="data-source-node" :class="{ selected }" :data-testid="`node-${data.sourceType || data.label}`">
    <div class="node-card" :class="{ 'is-configured': isConfigured, 'is-unconfigured': !isConfigured }">
      <div class="node-icon-wrapper">
        <div class="node-icon">{{ data.icon }}</div>
      </div>
      <div class="node-info">
        <div class="node-title">
          {{ data.label }}
          <!-- 资产名称显示 -->
          <span v-if="isConfigured && data.assetInfo?.assetName" class="asset-name">
            • {{ data.assetInfo.assetName }}
          </span>
          <!-- 未配置标签 -->
          <span v-else class="unconfigured-label">未配置</span>
        </div>
        <div v-if="data.description && !isConfigured" class="node-description">
          {{ data.description }}
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
import { useVueFlow } from '@vue-flow/core'

const props = defineProps<NodeProps<NodeData>>()

const { edges } = useVueFlow()

// 检查是否已配置数据资产
const isConfigured = computed(() => {
  return !!(props.data as NodeData).assetInfo
})

// 检查是否有输出连接
const isOutputVisible = computed(() => {
  return edges.value.some(edge => edge.source === props.id && edge.sourceHandle === 'output')
})
</script>

<style scoped lang="scss">
.data-source-node {
  position: relative;

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

  // 鼠标悬停节点时显示 handle
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
    display: flex;
    align-items: center;
    gap: 4px;
  }

  // 资产名称显示
  .asset-name {
    font-size: 12px;
    font-weight: 400;
    color: $node-configured-color;
    max-width: $node-asset-name-max-width;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  // 未配置标签
  .unconfigured-label {
    font-size: 11px;
    font-weight: 500;
    color: $node-unconfigured-color;
    padding: 2px 6px;
    background: $node-unconfigured-bg;
    border-radius: 4px;
  }

  .node-description {
    font-size: 12px;
    color: #666666;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  // 已配置状态样式
  .is-configured {
    border-color: $node-configured-border;
    background-color: $node-configured-bg;
  }

  // 未配置状态样式
  .is-unconfigured {
    border-color: $node-unconfigured-border;
    background-color: $node-unconfigured-bg;
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
