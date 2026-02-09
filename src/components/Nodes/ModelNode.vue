<template>
  <div
    :class="['model-node', { selected: isSelected }]"
    :style="nodeStyle"
    :data-node-type="props.data?.type"
    @click="handleClick"
  >
    <!-- 输入 Handle（顶部） - CodeBin、SPDZ、分组统计不需要 -->
    <Handle
      v-if="showInputHandle"
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
      <!-- 只有 CodeBin 和 SPDZ 模型需要显示企业信息 -->
      <div v-if="showEnterpriseInfo" class="node-info">
        <span class="info-text">{{ participantName }}</span>
      </div>
      <div v-if="isExpression" class="expression-preview">
        {{ expressionPreview }}
      </div>
      <template v-else-if="isGroupStatModel">
        <!-- 未配置状态 -->
        <div v-if="!isGroupStatConfigured" class="groupstat-unconfigured">
          待配置
        </div>
        <!-- 已配置状态 - 紧凑展示 -->
        <div v-else class="groupstat-summary">
          <div class="summary-item">
            <span class="summary-text">分组: {{ groupByFieldsCount }}个</span>
          </div>
          <div class="summary-item">
            <span class="summary-text">统计: {{ statisticsTypesText }}</span>
          </div>
        </div>
      </template>
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
import { computed, ref, onMounted } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import type { ModelNodeData } from '@/types/nodes'
import { ModelType } from '@/types/nodes'
import { getModelInputSignatures } from '@/services/model-mock-service'

// 模型参数签名缓存
const modelSignaturesCache = ref<Map<string, number>>(new Map())

const props = defineProps<NodeProps<ModelNodeData>>()

// 组件挂载时加载模型参数签名
onMounted(async () => {
  if (props.data?.modelId && props.data?.type !== 'expression') {
    try {
      const signatures = await getModelInputSignatures(props.data.modelId)
      modelSignaturesCache.value.set(props.data.modelId, signatures.length)
    } catch (error) {
      console.error('[ModelNode] Failed to load model signatures', error)
      modelSignaturesCache.value.set(props.data.modelId, 0)
    }
  }
})

// 是否为表达式模型
const isExpression = computed(() => props.data?.type === 'expression')

// 是否为分组统计模型
const isGroupStatModel = computed(() => props.data?.type === ModelType.GROUP_STAT)

// 是否为需要企业信息的模型类型（CodeBin 和 SPDZ 需要预先注册企业）
const showEnterpriseInfo = computed(() => {
  const type = props.data?.type
  return type === ModelType.CODEBIN_V2 ||
         type === ModelType.CODEBIN_V3_1 ||
         type === ModelType.CODEBIN_V3_2 ||
         type === ModelType.SPDZ
})

// 是否显示顶部输入 handle（CodeBin、SPDZ、分组统计都不需要）
const showInputHandle = computed(() => false)

// 分组统计配置（从 props.data.groupByConfig 获取）
const groupByConfig = computed(() => props.data?.groupByConfig)

// 分组字段数量
const groupByFieldsCount = computed(() => {
  return groupByConfig.value?.groupByFields?.length || 0
})

// 统计配置数量
const statisticsCount = computed(() => {
  return groupByConfig.value?.statistics?.length || 0
})

// 统计函数类型列表（紧凑展示）
const statisticsTypes = computed(() => {
  if (!groupByConfig.value?.statistics?.length) return []
  const types = groupByConfig.value.statistics.map(s => s.functionType)
  // 去重并限制显示数量
  return [...new Set(types)].slice(0, 3)
})

// 统计函数类型格式化字符串
const statisticsTypesText = computed(() => {
  if (statisticsTypes.value.length === 0) return ''
  if (statisticsTypes.value.length < 3) {
    return statisticsTypes.value.join(', ')
  }
  return statisticsTypes.value.join(', ') + '+'
})

// 是否已配置
const isGroupStatConfigured = computed(() => {
  return statisticsCount.value > 0
})

// 模型图标
const modelIcon = computed(() => {
  if (isExpression.value) return '∑'

  const type = props.data?.type
  switch (type) {
    case ModelType.GROUP_STAT:
      return '📊'
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
    [ModelType.GROUP_STAT]: '分组统计',
    [ModelType.CODEBIN_V2]: 'CodeBin-V2',
    [ModelType.CODEBIN_V3_1]: 'CodeBin-V3.1',
    [ModelType.CODEBIN_V3_2]: 'CodeBin-V3.2',
    [ModelType.SPDZ]: 'SPDZ模型'
  }
  return typeMap[type || ''] || props.data?.name || '模型'
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

// 表达式预览
const expressionPreview = computed(() => {
  const expr = props.data?.expression || ''
  return expr.length > 30 ? expr.substring(0, 30) + '...' : expr
})

// 参数数量（从签名获取，而不是已配置参数）
const paramsCount = computed(() => {
  // 表达式模型没有参数
  if (isExpression.value) return 0

  // 从缓存获取签名数量
  if (props.data?.modelId) {
    return modelSignaturesCache.value.get(props.data.modelId) ?? 0
  }

  // 降级：显示已配置参数数量
  return props.data?.parameters?.length || 0
})

// 节点样式
const nodeStyle = computed(() => {
  let bgColor = props.data?.color || '#8B5CF6'

  // 分组统计节点使用琥珀色
  if (props.data?.type === ModelType.GROUP_STAT) {
    bgColor = '#F59E0B'
  }

  return {
    backgroundColor: bgColor,
    borderColor: props.selected ? '#1890ff' : 'transparent',
    // 未配置的分组统计节点半透明
    opacity: (props.data?.type === ModelType.GROUP_STAT && !isGroupStatConfigured.value) ? 0.6 : 1
  }
})

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

// 分组统计节点特殊样式
.groupstat-unconfigured {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  text-align: center;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}

.groupstat-summary {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 6px;
}

.summary-item {
  display: flex;
  align-items: center;
}

.summary-text {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.9);
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

// 分组统计节点的动态 handle 颜色
.model-node[data-node-type="GROUP_STAT"] {
  :deep(.handle-input),
  :deep(.handle-output) {
    border-color: #F59E0B;

    &:hover {
      background: #F59E0B;
    }
  }
}
</style>
