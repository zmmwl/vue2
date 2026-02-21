<template>
  <div
    class="pir-task-node"
    :class="{ 'is-selected': selected, 'is-configured': isConfigured }"
  >
    <!-- 预加载数据源输入 Handle -->
    <Handle
      id="preload-input"
      type="target"
      :position="Position.Top"
      :style="{ left: '30%' }"
      class="node-handle preload-handle"
    />

    <!-- 实时数据源输入 Handle -->
    <Handle
      id="realtime-input"
      type="target"
      :position="Position.Top"
      :style="{ left: '70%' }"
      class="node-handle realtime-handle"
    />

    <div class="node-card">
      <!-- 节点头部 -->
      <div class="node-header">
        <span class="node-icon">{{ data.icon || '🔍' }}</span>
        <span class="node-label">{{ data.label }}</span>
        <span class="task-type-badge">PIR</span>
      </div>

      <!-- 节点内容 -->
      <div class="node-content">
        <!-- 预加载数据源状态 -->
        <div class="data-source-row">
          <span class="source-label">
            <span class="label-icon">📦</span>
            预加载
          </span>
          <span class="source-status" :class="{ 'is-configured': hasPreloadDataSource }">
            {{ preloadDataSourceLabel }}
          </span>
        </div>

        <!-- 实时数据源状态 -->
        <div class="data-source-row">
          <span class="source-label">
            <span class="label-icon">⚡</span>
            实时
          </span>
          <span class="source-status" :class="{ 'is-configured': hasRealtimeDataSource }">
            {{ realtimeDataSourceLabel }}
          </span>
        </div>
      </div>
    </div>

    <!-- 输出 Handle (实时数据源样式) -->
    <Handle
      id="output"
      type="source"
      :position="Position.Bottom"
      class="node-handle output-handle"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import type { PIRTaskNodeData, NodeData } from '@/types/nodes'

const props = defineProps<NodeProps<NodeData>>()

// 获取 PIR 任务数据
const pirData = computed(() => props.data as unknown as PIRTaskNodeData)

// 是否已配置
const isConfigured = computed(() => {
  return !!(pirData.value.preloadDataSource || pirData.value.realtimeDataSource)
})

// 是否有预加载数据源
const hasPreloadDataSource = computed(() => {
  return !!pirData.value.preloadDataSource
})

// 是否有实时数据源
const hasRealtimeDataSource = computed(() => {
  return !!pirData.value.realtimeDataSource?.fields?.length
})

// 预加载数据源标签
const preloadDataSourceLabel = computed(() => {
  if (hasPreloadDataSource.value) {
    const ds = pirData.value.preloadDataSource
    return ds?.dataset || '已配置'
  }
  return '未配置'
})

// 实时数据源标签
const realtimeDataSourceLabel = computed(() => {
  if (hasRealtimeDataSource.value) {
    const rs = pirData.value.realtimeDataSource
    const fieldCount = rs?.fields?.length || 0
    return `${fieldCount} 字段`
  }
  return '未配置'
})
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

  &:hover {
    box-shadow: var(--shadow-card-hover);
    transform: translateY(-2px);
  }

  &.is-selected {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-selected);
  }

  &.is-configured {
    .node-header {
      background: linear-gradient(135deg, var(--datasource-blue), #38BDF8);
    }
  }
}

.node-card {
  overflow: hidden;
  border-radius: inherit;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: linear-gradient(135deg, var(--datasource-blue), #38BDF8);
  color: white;
}

.node-icon {
  font-size: 16px;
}

.node-label {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-type-badge {
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
}

.node-content {
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.95);
}

.data-source-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;

  &:not(:last-child) {
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  }
}

.source-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);

  .label-icon {
    font-size: 14px;
  }
}

.source-status {
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 4px;
  color: var(--text-secondary);

  &.is-configured {
    background: rgba(82, 196, 26, 0.1);
    color: #52C41A;
  }
}

// Handle 样式
.node-handle {
  width: 12px;
  height: 12px;
  border: 2px solid white;
  border-radius: 50%;
  transition: all 0.2s ease;
  opacity: 0;
}

.preload-handle {
  background: var(--datasource-blue);
}

.realtime-handle {
  background: var(--realtime-datasource-color);
  border-style: var(--realtime-datasource-border-style);
}

.output-handle {
  background: var(--realtime-datasource-color);
  border-style: var(--realtime-datasource-border-style);
}

.pir-task-node:hover .node-handle,
.pir-task-node.is-selected .node-handle {
  opacity: 1;
}

.node-handle:hover {
  transform: scale(1.3);
}
</style>
