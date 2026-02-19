<template>
  <div class="local-query-node" :class="{ selected }" :data-testid="`node-${data.taskType || data.label}`" @dblclick="handleDoubleClick">
    <!-- 顶部数据源输入连接点 -->
    <Handle
      id="data-input"
      type="target"
      :position="Position.Top"
      :style="{ left: '50%' }"
      :class="['data-input-handle', { 'is-visible': isDataInputVisible }]"
    />

    <div class="node-card">
      <div class="node-icon-wrapper">
        <div class="node-icon">{{ data.icon }}</div>
      </div>
      <div class="node-info">
        <div class="node-title">{{ data.label }}</div>
        <div v-if="data.description" class="node-description">
          {{ data.description }}
        </div>
        <!-- 显示执行企业 -->
        <div v-if="entityName" class="node-meta">
          执行企业: {{ entityName }}
        </div>
        <!-- 显示输入数据源数量 -->
        <div v-if="inputProvidersCount > 0" class="node-meta">
          输入: {{ inputProvidersCount }} 个数据源
        </div>
        <!-- 显示配置状态 -->
        <div class="node-config-status">
          <span v-if="hasFields" class="status-badge fields">字段 ✓</span>
          <span v-else class="status-badge pending">字段 ✗</span>
          <span v-if="expressionsCount > 0" class="status-badge expression">
            表达式 {{ expressionsCount }}
          </span>
          <span v-if="hasGroupBy" class="status-badge groupby">分组统计 ✓</span>
        </div>
      </div>
    </div>

    <!-- 添加输出按钮 -->
    <button class="add-output-btn" @click="handleAddOutput" @mousedown.stop title="添加输出">
      <span>+</span>
    </button>

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
import type { NodeData, LocalQueryNodeData } from '@/types/nodes'
import { useVueFlow } from '@vue-flow/core'

const props = defineProps<NodeProps<NodeData>>()

const { edges } = useVueFlow()

// 检查是否有数据源输入连接
const isDataInputVisible = computed(() => {
  return edges.value.some(edge => edge.target === props.id && edge.targetHandle === 'data-input')
})

// 检查是否有输出连接
const isOutputVisible = computed(() => {
  return edges.value.some(edge => edge.source === props.id && edge.sourceHandle === 'output')
})

// 获取节点数据
const nodeData = computed(() => props.data as LocalQueryNodeData)

// 执行企业名称
const entityName = computed(() => nodeData.value.entityName || '')

// 输入数据源数量
const inputProvidersCount = computed(() => {
  return nodeData.value.inputProviders?.length || 0
})

// 是否有字段选择
const hasFields = computed(() => {
  return nodeData.value.inputProviders?.some(p => p.fields.length > 0) || false
})

// 表达式数量
const expressionsCount = computed(() => {
  return nodeData.value.expressions?.length || 0
})

// 是否有分组统计配置
const hasGroupBy = computed(() => {
  return !!nodeData.value.groupByConfig &&
    nodeData.value.groupByConfig.statistics.length > 0
})

/**
 * 处理双击事件 - 打开编辑弹窗
 */
function handleDoubleClick() {
  const event = new CustomEvent('edit-local-query', {
    detail: { nodeId: props.id },
    bubbles: true
  })
  document.dispatchEvent(event)
}

/**
 * 处理添加输出按钮点击
 */
function handleAddOutput() {
  const event = new CustomEvent('add-output', {
    detail: { nodeId: props.id },
    bubbles: true
  })
  document.dispatchEvent(event)
}
</script>

<style scoped lang="scss">
.local-query-node {
  position: relative;

  // 数据源输入 handle - 长方形（顶部）
  .data-input-handle {
    width: 24px;
    height: 8px;
    background-color: #13C2C2;
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
    .data-input-handle,
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
    cursor: pointer;

    &:hover {
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
    }
  }

  .node-icon-wrapper {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #e6fffb;
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

  .node-meta {
    font-size: 11px;
    color: #999999;
    line-height: 1.3;
    margin-top: 2px;
  }

  .node-config-status {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 6px;

    .status-badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 3px;
      font-weight: 500;

      &.fields {
        background-color: #f6ffed;
        color: #52c41a;
        border: 1px solid #b7eb8f;
      }

      &.expression {
        background-color: #e6fffb;
        color: #13c2c2;
        border: 1px solid #87e8de;
      }

      &.groupby {
        background-color: #e6fffb;
        color: #13c2c2;
        border: 1px solid #87e8de;
      }

      &.pending {
        background-color: #fff7e6;
        color: #fa8c16;
        border: 1px solid #ffd591;
      }
    }
  }

  &.selected .node-card {
    border-color: #13C2C2;
    box-shadow: 0 2px 8px rgba(19, 194, 194, 0.3);
  }

  // 添加输出按钮 - 线条引出 + 加号方块
  .add-output-btn {
    position: absolute;
    bottom: -32px;
    left: 50%;
    transform: translateX(-50%);
    width: 18px;
    height: 18px;
    padding: 0;
    background: linear-gradient(135deg, #13C2C2, #36cfc9);
    border: 2px solid #fff;
    border-radius: 4px;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(19, 194, 194, 0.3);
    transition: all 0.2s ease;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;

    // 引出线
    &::before {
      content: '';
      position: absolute;
      top: -14px;
      left: 50%;
      transform: translateX(-50%);
      width: 2px;
      height: 14px;
      background: linear-gradient(180deg, #13C2C2, rgba(19, 194, 194, 0.3));
      border-radius: 1px;
    }

    // 加号
    &::after {
      content: '+';
      color: white;
      font-size: 14px;
      font-weight: bold;
      line-height: 1;
    }

    // 隐藏原来的文字
    span {
      display: none;
    }

    &:hover {
      background: linear-gradient(135deg, #36cfc9, #5cdbd3);
      box-shadow: 0 3px 8px rgba(19, 194, 194, 0.4);
      transform: translateX(-50%) scale(1.1);

      &::before {
        height: 16px;
        background: linear-gradient(180deg, #36cfc9, rgba(54, 207, 201, 0.4));
      }
    }

    &:active {
      transform: translateX(-50%) scale(0.95);
    }
  }
}
</style>
