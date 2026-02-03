<template>
  <div
    :class="['compute-resource-node', { selected: isSelected }]"
    :style="nodeStyle"
    @click="handleClick"
  >
    <!-- 输出 Handle（左侧，连接到任务节点右侧） -->
    <Handle
      id="output"
      type="source"
      :position="Position.Left"
      class="handle-output"
    />

    <!-- 节点内容 -->
    <div class="node-content">
      <div class="node-header">
        <span class="node-icon">⚡</span>
        <span class="node-label">{{ nodeLabel }}</span>
      </div>
      <div class="node-info">
        <span class="info-text">{{ participantName }}</span>
      </div>
      <div class="resource-type">
        {{ resourceTypeLabel }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import type { ComputeResourceNodeData } from '@/types/nodes'

const props = defineProps<NodeProps<ComputeResourceNodeData>>()

// 节点标签
const nodeLabel = computed(() => {
  return props.data?.label || '算力资源'
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

// 资源类型标签
const resourceTypeLabel = computed(() => {
  const type = props.data?.resourceType
  const typeMap: Record<string, string> = {
    'TEE_CPU': 'TEE CPU',
    'TEE_GPU': 'TEE GPU',
    'TEE_FPGA': 'TEE FPGA'
  }
  return typeMap[type || ''] || type || 'TEE算力'
})

// 节点样式
const nodeStyle = computed(() => ({
  backgroundColor: props.data?.color || '#FA8C16',
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
.compute-resource-node {
  position: relative;
  min-width: 140px;
  max-width: 200px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #FA8C16 0%, #F5222D 100%);
  border: 2px solid transparent;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(250, 140, 22, 0.25);
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    box-shadow: 0 6px 16px rgba(250, 140, 22, 0.35);
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

.resource-type {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  background: rgba(0, 0, 0, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
  text-align: center;
}

// Handle 样式
:deep(.handle-output) {
  width: 12px;
  height: 12px;
  background: #ffffff;
  border: 2px solid #FA8C16;
  border-radius: 50%;
  transition: all 0.2s ease;

  &:hover {
    width: 16px;
    height: 16px;
    background: #FA8C16;
    border-color: #ffffff;
  }

  left: -7px;
  top: 50%;
  transform: translateY(-50%);
}
</style>
