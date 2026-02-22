<template>
  <div
    class="realtime-datasource-node"
    :class="{ selected }"
    :data-testid="'node-realtime-datasource'"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div class="node-card" :class="cardClass">
      <!-- 流动动画背景 -->
      <div class="flow-animation" v-if="isConfigured">
        <div class="flow-line"></div>
        <div class="flow-line"></div>
        <div class="flow-line"></div>
      </div>

      <!-- 头部：类型徽章 + 状态点 -->
      <div class="node-header">
        <div class="type-badge">
          <span class="type-icon">{{ data.icon }}</span>
          <span class="type-name">{{ data.label }}</span>
        </div>
        <div class="status-dot" :class="statusClass"></div>
      </div>

      <!-- 标题 -->
      <div class="node-title-section">
        <div v-if="isConfigured" class="asset-name">
          {{ configMode === 'datasource' ? sourceNodeName : '手工录入数据源' }}
        </div>
        <div v-else class="unconfigured-state">未配置</div>
      </div>

      <!-- 元信息区域（仅已配置时显示） -->
      <div v-if="isConfigured" class="node-meta-info">
        <div class="meta-item">
          <span class="meta-label">模式</span>
          <span class="meta-value mode-badge">{{ configModeLabel }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">字段数</span>
          <span class="meta-value is-field-count">[{{ fieldCount }}]</span>
        </div>
      </div>

      <!-- 展开/收起按钮 -->
      <div
        v-if="isConfigured"
        class="expand-toggle"
        @click.stop="isExpanded = !isExpanded"
      >
        <span class="toggle-text">{{ isExpanded ? '收起字段' : '展开字段' }}</span>
        <span class="toggle-icon" :class="{ 'is-expanded': isExpanded }">▼</span>
      </div>

      <!-- 字段列表（展开时显示） -->
      <Transition name="expand">
        <div v-if="isConfigured && isExpanded" class="node-fields-list">
          <div
            v-for="field in fields"
            :key="field.name"
            class="field-item"
          >
            <span class="field-name">{{ field.name }}</span>
            <span class="field-type">{{ field.dataType }}</span>
          </div>
        </div>
      </Transition>
    </div>

    <!-- 固定的底部输出连接点 -->
    <Handle
      id="output"
      type="source"
      :position="Position.Bottom"
      :style="{ left: '50%', visibility: isOutputVisible || isHovered ? 'visible' : 'hidden', opacity: isOutputVisible || isHovered ? 1 : 0 }"
      :class="['output-handle', { 'is-visible': isOutputVisible || isHovered }]"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import type { RealtimeDataSourceNodeData, RealtimeFieldInfo } from '@/types/nodes'
import { useVueFlow } from '@vue-flow/core'

const props = defineProps<NodeProps<RealtimeDataSourceNodeData>>()

const { edges } = useVueFlow()

// 展开/收起状态
const isExpanded = ref(false)

// 检查是否已配置
const isConfigured = computed(() => {
  return !!(props.data as RealtimeDataSourceNodeData).realtimeConfig?.fields?.length
})

// 配置模式
const configMode = computed(() => {
  return (props.data as RealtimeDataSourceNodeData).realtimeConfig?.mode || 'manual'
})

// 配置模式标签
const configModeLabel = computed(() => {
  return configMode.value === 'datasource' ? '从数据源' : '手工录入'
})

// 来源节点名称
const sourceNodeName = computed(() => {
  return (props.data as RealtimeDataSourceNodeData).realtimeConfig?.sourceNodeName || '未知数据源'
})

// 字段列表
const fields = computed<RealtimeFieldInfo[]>(() => {
  return (props.data as RealtimeDataSourceNodeData).realtimeConfig?.fields || []
})

// 字段数量
const fieldCount = computed(() => {
  return fields.value.length
})

// 卡片样式类
const cardClass = computed(() => ({
  'is-configured': isConfigured.value,
  'is-unconfigured': !isConfigured.value
}))

// 状态点样式类
const statusClass = computed(() => ({
  'is-idle': !isConfigured.value,
  'is-success': isConfigured.value
}))

// 悬停状态
const isHovered = ref(false)

// 输出 handle 是否可见
const isOutputVisible = computed(() => {
  return isConfigured.value || edges.value.some(e => e.source === props.id)
})

// 选中状态
const selected = computed(() => props.selected)
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.realtime-datasource-node {
  position: relative;

  &.selected .node-card {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }
}

.node-card {
  min-width: 220px;
  max-width: 280px;
  background: var(--bg-secondary);
  border: 2px solid rgba(0, 0, 0, 0.08);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: var(--transition-base);
  position: relative;

  &.is-unconfigured {
    border-style: dashed;
    opacity: 0.8;
  }

  &.is-configured {
    border-color: rgba(250, 140, 22, 0.3);
  }
}

// 流动动画背景
.flow-animation {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  pointer-events: none;

  .flow-line {
    position: absolute;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(250, 140, 22, 0.3), transparent);
    animation: flowMove 2s linear infinite;

    &:nth-child(1) {
      top: 20%;
      animation-delay: 0s;
    }
    &:nth-child(2) {
      top: 50%;
      animation-delay: 0.5s;
    }
    &:nth-child(3) {
      top: 80%;
      animation-delay: 1s;
    }
  }
}

@keyframes flowMove {
  0% {
    left: -100%;
    width: 50%;
  }
  100% {
    left: 100%;
    width: 50%;
  }
}

.node-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px 6px;
  position: relative;
  z-index: 1;
}

.type-badge {
  display: flex;
  align-items: center;
  gap: 6px;

  .type-icon {
    font-size: 16px;
  }

  .type-name {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-primary);
  }
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--border-color);

  &.is-idle {
    background: var(--border-color);
  }

  &.is-success {
    background: #52C41A;
    box-shadow: 0 0 6px rgba(82, 196, 26, 0.5);
  }
}

.node-title-section {
  padding: 0 12px 8px;
  position: relative;
  z-index: 1;

  .asset-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .unconfigured-state {
    font-size: 12px;
    color: var(--text-placeholder);
  }
}

.node-meta-info {
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.02);
  position: relative;
  z-index: 1;
}

.meta-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 11px;

  .meta-label {
    color: var(--text-secondary);
  }

  .meta-value {
    color: var(--text-primary);
    font-weight: 500;

    &.mode-badge {
      padding: 2px 6px;
      background: rgba(250, 140, 22, 0.1);
      color: #FA8C16;
      border-radius: 4px;
      font-size: 10px;
    }

    &.is-field-count {
      color: var(--text-secondary);
    }
  }
}

.expand-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 11px;
  color: var(--text-secondary);
  background: rgba(0, 0, 0, 0.02);
  transition: var(--transition-fast);
  position: relative;
  z-index: 1;

  &:hover {
    background: rgba(0, 0, 0, 0.04);
    color: var(--text-primary);
  }

  .toggle-icon {
    font-size: 8px;
    transition: transform 0.2s;

    &.is-expanded {
      transform: rotate(180deg);
    }
  }
}

.node-fields-list {
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.02);
  max-height: 150px;
  overflow-y: auto;
  position: relative;
  z-index: 1;
}

.field-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 11px;

  .field-name {
    flex: 1;
    color: var(--text-primary);
  }

  .field-type {
    font-size: 10px;
    padding: 1px 4px;
    background: rgba(250, 140, 22, 0.1);
    color: #FA8C16;
    border-radius: 3px;
  }
}

// 展开动画
.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 150px;
}

// Handle 样式
.output-handle {
  width: 12px;
  height: 12px;
  background: #FA8C16;
  border: 2px solid white;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.2s;

  &.is-visible {
    opacity: 1 !important;
    visibility: visible !important;
  }
}

.realtime-datasource-node:hover .output-handle {
  opacity: 1 !important;
  visibility: visible !important;
}
</style>
