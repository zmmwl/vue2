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

    <!-- DAG 节点：左侧模型输入连接点 (T035) -->
    <Handle
      v-if="isDagNode"
      id="model-input"
      type="target"
      :position="Position.Left"
      :style="{ top: '50%' }"
      :class="['model-input-handle', { 'is-visible': isModelInputVisible }]"
    />

    <!-- DAG 节点：右侧算力输入连接点 (T045) -->
    <Handle
      v-if="isDagNode"
      id="resource-input"
      type="target"
      :position="Position.Right"
      :style="{ top: '50%' }"
      :class="['resource-input-handle', { 'is-visible': isResourceInputVisible }]"
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

    <!-- DAG 节点：添加输出数据按钮 -->
    <div v-if="isDagNode" class="output-action">
      <button
        class="add-output-btn"
        @click.stop="onAddOutput"
        title="添加输出数据"
      >
        <span class="btn-icon">+</span>
        <span class="btn-text">输出</span>
      </button>
    </div>

    <!-- DAG 节点：添加模型按钮 (T039) -->
    <div v-if="isDagNode" class="model-action">
      <button
        class="add-model-btn"
        @click.stop="onAddModel"
        title="添加计算模型"
      >
        <span class="btn-icon">🧠</span>
      </button>
    </div>

    <!-- DAG 节点：添加算力按钮 (T049) -->
    <div v-if="isDagNode" class="resource-action">
      <button
        class="add-resource-btn"
        @click.stop="onAddResource"
        title="添加算力资源"
      >
        <span class="btn-icon">⚡</span>
      </button>
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
import { computed, inject } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import type { NodeData } from '@/types/nodes'
import type { ComputeTaskNodeData } from '@/types/contracts'
import { useVueFlow } from '@vue-flow/core'

const props = defineProps<NodeProps<NodeData>>()

const { edges } = useVueFlow()

// Inject addOutput handler from FlowCanvas (T029)
const addOutputHandler = inject<(nodeId: string) => void>('addOutputHandler', () => {})

// Inject addModel handler from FlowCanvas (T039)
const addModelHandler = inject<(nodeId: string, position: { x: number; y: number }) => void>('addModelHandler', () => {})

// Inject addResource handler from FlowCanvas (T049)
const addResourceHandler = inject<(nodeId: string, position: { x: number; y: number }) => void>('addResourceHandler', () => {})

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

// 检查是否有模型输入连接 (T035)
const isModelInputVisible = computed(() => {
  return edges.value.some(edge => edge.target === props.id && edge.targetHandle === 'model-input')
})

// 检查是否有算力输入连接 (T045)
const isResourceInputVisible = computed(() => {
  return edges.value.some(edge => edge.target === props.id && edge.targetHandle === 'resource-input')
})

// 检查是否有输出连接
const isOutputVisible = computed(() => {
  return edges.value.some(edge => edge.source === props.id && edge.sourceHandle === 'output')
})

// 添加输出数据节点 (T029)
function onAddOutput() {
  if (addOutputHandler) {
    addOutputHandler(props.id)
  }
}

// 添加模型节点 (T039)
function onAddModel() {
  if (addModelHandler) {
    // 计算模型节点位置（在计算任务节点左侧）
    const modelPosition = {
      x: (props.position?.x || 0) - 160,
      y: (props.position?.y || 0) + 20
    }
    addModelHandler(props.id, modelPosition)
  }
}

// 添加算力节点 (T049)
function onAddResource() {
  if (addResourceHandler) {
    // 计算算力节点位置（在计算任务节点右侧）
    const resourcePosition = {
      x: (props.position?.x || 0) + 280,
      y: (props.position?.y || 0) + 20
    }
    addResourceHandler(props.id, resourcePosition)
  }
}
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
    opacity: 0.15;  // 改为 0.15 使 handle 始终可以接收事件
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

  // 模型输入 handle - 正方形（左侧） (T035)
  .model-input-handle {
    width: 8px;
    height: 24px;
    background-color: #13C2C2;
    border: 2px solid #ffffff;
    border-radius: 2px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    transform: translateY(-50%);
    opacity: 0.15;  // 改为 0.15 使 handle 始终可以接收事件
    transition: opacity 0.2s ease;

    &.is-visible {
      opacity: 1;
    }

    &:hover {
      opacity: 1;
      background-color: #1890ff;
      transform: translateY(-50%) scale(1.1);
    }
  }

  // 算力输入 handle - 菱形（右侧） (T045)
  .resource-input-handle {
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

  // 输出 handle - 圆形（底部）
  .output-handle {
    width: 12px;
    height: 12px;
    background-color: #999999;
    border: 2px solid #ffffff;
    border-radius: 50%;
    transform: translateX(-50%);
    opacity: 0.15;  // 改为 0.15 使 handle 始终可以接收事件
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
    .model-input-handle,
    .resource-input-handle,
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

  // 输出操作区域
  .output-action {
    position: absolute;
    bottom: -28px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
  }

  .add-output-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    background: linear-gradient(135deg, #52C41A, #389E0D);
    border: none;
    border-radius: 12px;
    color: white;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(82, 196, 26, 0.3);
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 10px rgba(82, 196, 26, 0.4);
      background: linear-gradient(135deg, #5DD826, #43A516);
    }

    &:active {
      transform: translateY(0) scale(0.95);
    }

    .btn-icon {
      font-size: 14px;
      line-height: 1;
    }

    .btn-text {
      line-height: 1;
    }
  }

  // 模型操作区域 (T039)
  .model-action {
    position: absolute;
    top: 50%;
    left: -32px;
    transform: translateY(-50%);
    z-index: 10;
  }

  .add-model-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    background: linear-gradient(135deg, #13C2C2, #08979C);
    border: none;
    border-radius: 50%;
    color: white;
    font-size: 12px;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(19, 194, 194, 0.3);
    transition: all 0.2s ease;

    &:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 10px rgba(19, 194, 194, 0.4);
      background: linear-gradient(135deg, #36CFC9, #13C2C2);
    }

    &:active {
      transform: scale(0.95);
    }

    .btn-icon {
      line-height: 1;
    }
  }

  // 算力操作区域 (T049)
  .resource-action {
    position: absolute;
    top: 50%;
    right: -32px;
    transform: translateY(-50%);
    z-index: 10;
  }

  .add-resource-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    background: linear-gradient(135deg, #FA8C16, #D46B08);
    border: none;
    border-radius: 50%;
    color: white;
    font-size: 12px;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(250, 140, 22, 0.3);
    transition: all 0.2s ease;

    &:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 10px rgba(250, 140, 22, 0.4);
      background: linear-gradient(135deg, #FFA940, #FA8C16);
    }

    &:active {
      transform: scale(0.95);
    }

    .btn-icon {
      line-height: 1;
    }
  }
}
</style>
