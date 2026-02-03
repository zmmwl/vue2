<template>
  <div
    :class="['local-task-node', { selected: isSelected }]"
    :style="nodeStyle"
    @click="handleClick"
  >
    <!-- 输入 Handle（顶部） -->
    <Handle
      type="target"
      :position="Position.Top"
      :id="HANDLE_IDS.input"
      class="handle-input"
    />

    <!-- 节点内容 -->
    <div class="node-content">
      <div class="node-header">
        <span class="node-icon">🔄</span>
        <span class="node-label">{{ nodeLabel }}</span>
      </div>
      <div class="node-info">
        <span class="info-text">{{ participantName }}</span>
      </div>
      <div class="task-type">
        CONCAT - 结果拼接
      </div>
    </div>

    <!-- 输出 Handle（底部） -->
    <Handle
      type="source"
      :position="Position.Bottom"
      :id="HANDLE_IDS.output"
      class="handle-output"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import type { LocalTaskNodeData } from '@/types/nodes'

const props = defineProps<NodeProps<LocalTaskNodeData>>()

// Handle ID 常量
const HANDLE_IDS = {
  input: 'input',
  output: 'output'
}

// 节点标签
const nodeLabel = computed(() => {
  return props.data?.label || '本地结果处理'
})

// 参与方名称（同时显示企业名称和ID）
const participantName = computed(() => {
  const { participantId, entityName } = props.data || {}
  if (entityName && participantId) {
    return `${entityName} (${participantId})`
  }
  if (participantId) {
    return participantId
  }
  return '未选择企业'
})

// 节点样式
const nodeStyle = computed(() => ({
  backgroundColor: props.data?.color || '#722ED1',
  borderColor: props.selected ? '#1890ff' : 'transparent'
}))

// 是否选中
const isSelected = computed(() => props.selected)

/**
 * 处理节点点击
 */
function handleClick() {
  // 点击事件由 Vue Flow 处理
}
</script>

<style scoped lang="scss">
.local-task-node {
  position: relative;
  min-width: 160px;
  max-width: 220px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #722ED1 0%, #531DAB 100%);
  border: 2px solid transparent;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(114, 46, 209, 0.25);
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    box-shadow: 0 6px 16px rgba(114, 46, 209, 0.35);
    transform: translateY(-2px);
  }

  &.selected {
    border-color: #1890ff;
    box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.2);
  }
}

.node-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.node-icon {
  font-size: 18px;
  line-height: 1;
}

.node-label {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  flex: 1;
}

.node-info {
  display: flex;
  align-items: center;
}

.info-text {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.task-type {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  background: rgba(0, 0, 0, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
  text-align: center;
}

// Handle 样式
:deep(.handle-input),
:deep(.handle-output) {
  width: 12px;
  height: 12px;
  background: #ffffff;
  border: 2px solid #722ED1;
  border-radius: 50%;
  transition: all 0.2s ease;

  &:hover {
    width: 16px;
    height: 16px;
    background: #722ED1;
    border-color: #ffffff;
  }
}

:deep(.handle-input) {
  top: -7px;
  left: 50%;
  transform: translateX(-50%);
}

:deep(.handle-output) {
  bottom: -7px;
  left: 50%;
  transform: translateX(-50%);
}
</style>
