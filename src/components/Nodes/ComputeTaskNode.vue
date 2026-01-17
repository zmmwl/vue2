<template>
  <div class="compute-task-node" :class="{ selected }">
    <!-- 顶部动态输入连接点（长方形） -->
    <div class="input-handles-container">
      <Handle
        v-for="handle in data.inputHandles"
        :key="handle.id"
        :id="handle.id"
        type="target"
        :position="Position.Top"
        :style="{ left: handle.position + '%' }"
        class="input-handle connected"
      />
    </div>

    <!-- 顶部悬停区域 - 用于创建新的输入连接 -->
    <div class="hover-input-zone" :class="{ 'has-connections': data.inputHandles && data.inputHandles.length > 0 }">
      <Handle
        type="target"
        :position="Position.Top"
        class="input-handle hover-handle"
        :style="{ left: '50%' }"
      />
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

    <!-- 底部动态输出连接点（圆形） -->
    <div class="output-handles-container">
      <Handle
        v-for="handle in data.outputHandles"
        :key="handle.id"
        :id="handle.id"
        type="source"
        :position="Position.Bottom"
        :style="{ left: handle.position + '%' }"
        class="output-handle connected"
      />
    </div>

    <!-- 底部悬停区域 - 用于创建新的输出连接 -->
    <div class="hover-output-zone" :class="{ 'has-connections': data.outputHandles && data.outputHandles.length > 0 }">
      <Handle
        type="source"
        :position="Position.Bottom"
        class="output-handle hover-handle"
        :style="{ left: '50%' }"
      />
    </div>
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

  .input-handles-container {
    position: absolute;
    top: -6px;
    left: 0;
    right: 0;
    height: 12px;
    pointer-events: none;
  }

  .output-handles-container {
    position: absolute;
    bottom: -6px;
    left: 0;
    right: 0;
    height: 12px;
    pointer-events: none;
  }

  // 悬停区域
  .hover-input-zone,
  .hover-output-zone {
    position: absolute;
    left: 0;
    right: 0;
    height: 16px;
    opacity: 0;
    transition: opacity 0.2s ease;
    z-index: 10;

    &:hover {
      opacity: 1;
    }

    &.has-connections {
      // 已有连接时也显示
    }
  }

  .hover-input-zone {
    top: -8px;

    .hover-handle {
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    &:hover .hover-handle {
      opacity: 1;
    }
  }

  .hover-output-zone {
    bottom: -8px;

    .hover-handle {
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    &:hover .hover-handle {
      opacity: 1;
    }
  }

  // 节点悬停时也显示悬停 handle
  &:hover {
    .hover-input-zone,
    .hover-output-zone {
      opacity: 1;
    }

    .hover-input-zone .hover-handle,
    .hover-output-zone .hover-handle {
      opacity: 1;
    }
  }

  // 输入 handle - 长方形（连入）
  .input-handle {
    width: 24px;
    height: 8px;
    background-color: #52c41a;
    border: 2px solid #ffffff;
    border-radius: 2px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    transform: translateX(-50%);

    &.connected {
      pointer-events: auto;
    }

    &.hover-handle {
      background-color: #52c41a;
      opacity: 0.3;
    }

    &:hover {
      background-color: #1890ff;
      transform: translateX(-50%) scale(1.1);
    }
  }

  // 输出 handle - 圆形（连出）
  .output-handle {
    width: 12px;
    height: 12px;
    background-color: #999999;
    border: 2px solid #ffffff;
    border-radius: 50%;
    transform: translateX(-50%);

    &.connected {
      pointer-events: auto;
    }

    &.hover-handle {
      background-color: #999999;
      opacity: 0.3;
    }

    &:hover {
      background-color: #1890ff;
      transform: translateX(-50%) scale(1.2);
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

  &.selected .node-card {
    border-color: #1890ff;
    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
  }

  &:hover .node-card {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
  }
}
</style>
