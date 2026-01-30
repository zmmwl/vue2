<template>
  <div
    :class="['model-node', { selected: isSelected }]"
    :style="nodeStyle"
    @click="handleClick"
  >
    <!-- 输入 Handle（顶部） -->
    <Handle
      v-if="!isExpression"
      id="input"
      type="target"
      :position="Position.Top"
      class="handle-input"
    />

    <!-- 节点内容 -->
    <div class="node-content">
      <div class="node-header">
        <span class="node-icon">{{ modelIcon }}</span>
        <span class="node-label">{{ nodeLabel }}</span>
      </div>
      <div class="node-info">
        <span class="info-text">{{ participantName }}</span>
      </div>
      <div v-if="isExpression" class="expression-preview">
        {{ expressionPreview }}
      </div>
      <div v-else class="params-count">
        {{ paramsCount }} 个参数
      </div>
    </div>

    <!-- 输出 Handle（右侧，连接到任务节点左侧） -->
    <Handle
      id="output"
      type="source"
      :position="Position.Right"
      class="handle-output"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import type { ModelNodeData } from '@/types/nodes'
import { ModelType } from '@/types/nodes'

const props = defineProps<NodeProps<ModelNodeData>>()

// 是否为表达式模型
const isExpression = computed(() => props.data?.type === 'expression')

// 模型图标
const modelIcon = computed(() => {
  if (isExpression.value) return '∑'

  const type = props.data?.type
  switch (type) {
    case ModelType.CODEBIN_V2:
      return '📦'
    case ModelType.CODEBIN_V3_1:
      return '📦'
    case ModelType.CODEBIN_V3_2:
      return '📦'
    case ModelType.SPDZ:
      return '🔐'
    default:
      return '📦'
  }
})

// 节点标签
const nodeLabel = computed(() => {
  if (isExpression.value) return '表达式'

  const type = props.data?.type
  const typeMap: Record<string, string> = {
    [ModelType.CODEBIN_V2]: 'CodeBin-V2',
    [ModelType.CODEBIN_V3_1]: 'CodeBin-V3.1',
    [ModelType.CODEBIN_V3_2]: 'CodeBin-V3.2',
    [ModelType.SPDZ]: 'SPDZ模型'
  }
  return typeMap[type || ''] || props.data?.name || '模型'
})

// 参与方名称
const participantName = computed(() => {
  return props.data?.participantId || '未选择企业'
})

// 表达式预览
const expressionPreview = computed(() => {
  const expr = props.data?.expression || ''
  return expr.length > 30 ? expr.substring(0, 30) + '...' : expr
})

// 参数数量
const paramsCount = computed(() => {
  return props.data?.parameters?.length || 0
})

// 节点样式
const nodeStyle = computed(() => ({
  backgroundColor: props.data?.color || '#8B5CF6',
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
.model-node {
  position: relative;
  min-width: 140px;
  max-width: 200px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
  border: 2px solid transparent;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.25);
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    box-shadow: 0 6px 16px rgba(139, 92, 246, 0.35);
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

.expression-preview {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  font-family: 'Monaco', 'Menlo', monospace;
  background: rgba(0, 0, 0, 0.2);
  padding: 6px 8px;
  border-radius: 4px;
  line-height: 1.4;
  word-break: break-all;
}

.params-count {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

// Handle 样式
:deep(.handle-input),
:deep(.handle-output) {
  width: 12px;
  height: 12px;
  background: #ffffff;
  border: 2px solid #8B5CF6;
  border-radius: 50%;
  transition: all 0.2s ease;

  &:hover {
    width: 16px;
    height: 16px;
    background: #8B5CF6;
    border-color: #ffffff;
  }
}

:deep(.handle-input) {
  top: -7px;
  left: 50%;
  transform: translateX(-50%);
}

:deep(.handle-output) {
  right: -7px;
  top: 50%;
  transform: translateY(-50%);
}
</style>
