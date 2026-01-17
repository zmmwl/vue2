<template>
  <div class="compute-task-node" :class="{ selected }">
    <!-- 顶部输入连接点 -->
    <Handle
      type="target"
      :position="Position.Top"
      class="node-handle"
    />

    <!-- 动态附着端点（左侧） -->
    <div v-if="data.attachmentEndpoints && data.attachmentEndpoints.length > 0" class="attachment-endpoints">
      <div
        v-for="endpoint in data.attachmentEndpoints"
        :key="endpoint.id"
        class="attachment-endpoint"
      >
        <Handle
          :id="endpoint.id"
          type="target"
          :position="Position.Left"
          class="attachment-handle"
        />
        <span class="endpoint-label">{{ endpoint.label }}</span>
      </div>
    </div>

    <div class="node-card">
      <div class="node-icon-wrapper">
        <div class="node-icon">{{ data.icon }}</div>
      </div>
      <div class="node-info">
        <div class="node-title">{{ data.label }}</div>
        <div v-if="data.description" class="node-description">
          {{ data.description }}
        </div>
      </div>
    </div>

    <!-- 底部输出连接点 -->
    <Handle
      type="source"
      :position="Position.Bottom"
      class="node-handle"
    />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import type { NodeData } from '@/types/nodes'

defineProps<NodeProps<NodeData>>()
</script>

<style scoped lang="scss">
.compute-task-node {
  position: relative;

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

  // 附着端点容器
  .attachment-endpoints {
    position: absolute;
    left: -60px;
    top: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  // 单个附着端点
  .attachment-endpoint {
    position: relative;
    display: flex;
    align-items: center;
    gap: 6px;

    .attachment-handle {
      width: 10px;
      height: 10px;
      background-color: #52c41a;
      border: 2px solid #ffffff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);

      &:hover {
        background-color: #1890ff;
        transform: scale(1.2);
      }
    }

    .endpoint-label {
      font-size: 11px;
      color: #666666;
      white-space: nowrap;
      background-color: #f5f5f5;
      padding: 2px 6px;
      border-radius: 4px;
    }
  }

  .node-handle {
    width: 10px;
    height: 10px;
    background-color: #999999;
    border: 2px solid #ffffff;

    &:hover {
      background-color: #1890ff;
    }
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
