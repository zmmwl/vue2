<template>
  <div class="compute-task-node" :class="{ selected, 'dag-node': isDagNode }" :data-testid="`node-${data.taskType || data.label}`">
    <!-- 固定的顶部输入连接点 -->
    <Handle
      id="input"
      type="target"
      :position="Position.Top"
      :style="{ left: '50%' }"
      :class="['input-handle', { 'is-visible': isInputVisible }]"
    />

    <div class="node-card">
      <div class="node-icon-wrapper" :style="{ background: iconBg }">
        <div class="node-icon">{{ data.icon || '🧮' }}</div>
      </div>
      <div class="node-info">
        <div class="node-title">{{ data.label }}</div>
        <div v-if="data.description" class="node-description">
          {{ data.description }}
        </div>

        <!-- DAG 节点特有信息 -->
        <template v-if="isDagNode">
          <div class="node-meta">
            <span class="compute-type-badge" :style="{ background: computeTypeColor }">
              {{ computeTypeLabel }}
            </span>
            <span v-if="isTechPathLocked" class="tech-path-badge" title="技术路径已锁定">
              🔒 {{ techPathLabel }}
            </span>
          </div>
        </template>
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
import type { ComputeTaskNodeData } from '@/types/contracts'
import { useVueFlow } from '@vue-flow/core'

const props = defineProps<NodeProps<NodeData>>()

const { edges } = useVueFlow()

// 检查是否为 DAG 节点
const isDagNode = computed(() => {
  const dagData = props.data as Partial<ComputeTaskNodeData>
  return !!(
    dagData.computeType &&
    dagData.techPath
  )
})

// 检查技术路径是否锁定
const isTechPathLocked = computed(() => {
  const dagData = props.data as Partial<ComputeTaskNodeData>
  return !!dagData.techPath
})

// 计算类型标签
const computeTypeLabel = computed(() => {
  const dagData = props.data as Partial<ComputeTaskNodeData>
  return dagData.computeType || ''
})

// 技术路径标签
const techPathLabel = computed(() => {
  const dagData = props.data as Partial<ComputeTaskNodeData>
  return dagData.techPath === 'tee' ? 'TEE' : '软件密码学'
})

// 计算类型颜色
const computeTypeColor = computed(() => {
  const colors: Record<string, string> = {
    'PSI': '#1890FF',
    'TEE_PSI': '#1890FF',
    'PIR': '#722ED1',
    'TEE_PIR': '#722ED1',
    'MPC': '#FA8C16',
    'TEE_MPC': '#FA8C16',
    'CONCAT': '#52C41A'
  }
  return colors[computeTypeLabel.value] || '#1890FF'
})

// 图标背景色
const iconBg = computed(() => {
  const color = props.data.color || '#1890FF'
  return `${color}15`
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
.compute-task-node {
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

  .node-description {
    font-size: 12px;
    color: #666666;
    line-height: 1.4;
    margin-bottom: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  // DAG 节点元信息
  .node-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }

  .compute-type-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    color: white;
    white-space: nowrap;
  }

  .tech-path-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
    background: rgba(250, 140, 22, 0.1);
    border: 1px solid rgba(250, 140, 22, 0.3);
    color: #D46B08;
    white-space: nowrap;
  }

  &.selected .node-card {
    border-color: #1890ff;
    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
  }

  &:hover .node-card {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
  }

  // DAG 节点特殊样式
  &.dag-node .node-card {
    border-left-width: 3px;
    border-left-color: v-bind('computeTypeColor');
  }
}
</style>
