<template>
  <div class="data-source-node" :class="{ selected }" :data-testid="`node-${data.sourceType || data.label}`">
    <div class="node-card" :class="cardClass">
      <!-- 头部：类型徽章 + 状态点 -->
      <div class="node-header">
        <div class="type-badge">
          <span class="type-icon">{{ data.icon }}</span>
          <span class="type-name">{{ data.label }}</span>
        </div>
        <div class="status-dot" :class="statusClass"></div>
      </div>

      <!-- 标题：资产名称或未配置提示 -->
      <div class="node-title-section">
        <div v-if="isConfigured" class="asset-name">
          {{ data.assetInfo?.assetName }}
        </div>
        <div v-else class="unconfigured-state">未配置数据资产</div>
      </div>

      <!-- 元信息区域（仅已配置时显示） -->
      <div v-if="isConfigured" class="node-meta-info">
        <div class="meta-item">
          <span class="meta-label">所有者</span>
          <span class="meta-value">{{ data.assetInfo?.holderCompany }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">数据表</span>
          <span class="meta-value is-table-name">{{ tableName }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">字段数</span>
          <span class="meta-value is-field-count">[{{ fieldCount }}]</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">规模</span>
          <span class="meta-value">{{ displayScale }}</span>
        </div>
      </div>

      <!-- 展开/收起按钮（仅已配置时显示） -->
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
            v-for="field in displayFields"
            :key="field.name"
            class="field-item"
          >
            <span v-if="field.isPrimaryKey" class="field-key-icon">🔑</span>
            <span v-else class="field-key-spacer"></span>
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
      :style="{ left: '50%' }"
      :class="['output-handle', { 'is-visible': isOutputVisible }]"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import type { NodeData } from '@/types/nodes'
import { useVueFlow } from '@vue-flow/core'

const props = defineProps<NodeProps<NodeData>>()

const { edges } = useVueFlow()

// 展开/收起状态（每个节点独立维护）
const isExpanded = ref(false)

// 检查是否已配置数据资产
const isConfigured = computed(() => {
  return !!(props.data as NodeData).assetInfo
})

// 卡片样式类
const cardClass = computed(() => ({
  'is-configured': isConfigured.value,
  'is-unconfigured': !isConfigured.value,
  'is-expanded': isExpanded.value
}))

// 状态点样式类
const statusClass = computed(() => ({
  'is-configured': isConfigured.value,
  'is-unconfigured': !isConfigured.value
}))

// 完整数据表名
const tableName = computed(() => {
  if (isConfigured.value && props.data.assetInfo?.dataInfo) {
    const { databaseName, tableName: tblName } = props.data.assetInfo.dataInfo
    return `${databaseName}.${tblName}`
  }
  return ''
})

// 字段数量
const fieldCount = computed(() => {
  if (isConfigured.value && props.data.assetInfo?.dataInfo) {
    return props.data.assetInfo.dataInfo.fieldList.length
  }
  return 0
})

// 数据规模显示
const displayScale = computed(() => {
  return props.data.assetInfo?.scale || '未提供'
})

// 显示的字段列表（限制最多显示 10 个）
const displayFields = computed(() => {
  if (isConfigured.value && props.data.assetInfo?.dataInfo) {
    return props.data.assetInfo.dataInfo.fieldList.slice(0, 10)
  }
  return []
})

// 检查是否有输出连接
const isOutputVisible = computed(() => {
  return edges.value.some(edge => edge.source === props.id && edge.sourceHandle === 'output')
})
</script>

<style scoped lang="scss">
.data-source-node {
  position: relative;

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

  // 鼠标悬停节点时显示 handle
  &:hover {
    .output-handle {
      opacity: 1;
    }
  }

  // ==================== 卡片基础样式 ====================
  .node-card {
    width: 280px;
    background-color: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: 16px;
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.04),
      0 4px 12px rgba(0, 0, 0, 0.08),
      0 0 0 1px rgba(255, 255, 255, 0.4) inset;
    padding: 16px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  // ==================== 头部区域 ====================
  .node-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  .type-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    background: linear-gradient(135deg, rgba(82, 196, 26, 0.12) 0%, rgba(82, 196, 26, 0.06) 100%);
    border-radius: 8px;

    .type-icon {
      font-size: 14px;
      line-height: 1;
    }

    .type-name {
      font-size: 11px;
      font-weight: 600;
      color: #52C41A;
      letter-spacing: 0.3px;
      text-transform: uppercase;
    }
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;

    &.is-configured {
      background-color: #52C41A;
      box-shadow: 0 0 8px rgba(82, 196, 26, 0.5);
    }

    &.is-unconfigured {
      background-color: #D9D9D9;
    }
  }

  // ==================== 标题区域 ====================
  .node-title-section {
    min-height: 24px;
  }

  .asset-name {
    font-size: 15px;
    font-weight: 600;
    color: #262626;
    line-height: 1.5;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .unconfigured-state {
    font-size: 13px;
    color: #8C8C8C;
    font-weight: 400;
    display: flex;
    align-items: center;
    gap: 6px;

    &::before {
      content: '';
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background-color: #D9D9D9;
    }
  }

  // ==================== 元信息区域 ====================
  .node-meta-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 12px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
  }

  .meta-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    line-height: 1.4;

    .meta-label {
      color: #8C8C8C;
      font-weight: 400;
      flex-shrink: 0;
    }

    .meta-value {
      color: #262626;
      font-weight: 500;
      text-align: right;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 160px;

      &.is-table-name {
        font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
        font-size: 11px;
        background: rgba(0, 0, 0, 0.04);
        padding: 2px 6px;
        border-radius: 4px;
      }

      &.is-field-count {
        color: #1890FF;
        font-weight: 600;
      }
    }
  }

  // ==================== 展开/收起按钮 ====================
  .expand-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 12px;
    margin-top: 4px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    cursor: pointer;
    transition: all 0.2s ease;
    border-radius: 0 0 16px 16px;

    .toggle-text {
      font-size: 11px;
      font-weight: 500;
      color: #8C8C8C;
    }

    .toggle-icon {
      font-size: 10px;
      color: #8C8C8C;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &.is-expanded {
        transform: rotate(180deg);
      }
    }

    &:hover {
      background-color: rgba(0, 0, 0, 0.02);

      .toggle-text,
      .toggle-icon {
        color: #1890FF;
      }
    }
  }

  // ==================== 字段列表 ====================
  .node-fields-list {
    padding: 8px 12px;
    margin-top: 4px;
    background-color: rgba(0, 0, 0, 0.02);
    border-radius: 0 0 16px 16px;
    max-height: 200px;
    overflow-y: auto;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.1);
      border-radius: 2px;

      &:hover {
        background: rgba(0, 0, 0, 0.15);
      }
    }
  }

  .field-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 0;
    font-size: 11px;

    &:not(:last-child) {
      border-bottom: 1px solid rgba(0, 0, 0, 0.04);
    }
  }

  .field-key-icon {
    font-size: 10px;
    flex-shrink: 0;
  }

  .field-key-spacer {
    width: 12px;
    flex-shrink: 0;
  }

  .field-name {
    flex: 1;
    color: #262626;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .field-type {
    color: #8C8C8C;
    font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
    font-size: 10px;
    background: rgba(0, 0, 0, 0.04);
    padding: 2px 6px;
    border-radius: 4px;
    flex-shrink: 0;
  }

  // ==================== 展开/收起过渡动画 ====================
  .expand-enter-active,
  .expand-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
  }

  .expand-enter-from,
  .expand-leave-to {
    max-height: 0;
    opacity: 0;
    padding-top: 0;
    padding-bottom: 0;
  }

  .expand-enter-to,
  .expand-leave-from {
    max-height: 200px;
    opacity: 1;
  }

  // ==================== 状态样式 ====================
  .node-card.is-unconfigured {
    background: linear-gradient(135deg, rgba(250, 250, 250, 0.9) 0%, rgba(245, 245, 245, 0.85) 100%);

    .type-badge {
      opacity: 0.6;
    }
  }

  .node-card.is-configured {
    background: linear-gradient(135deg, rgba(246, 255, 237, 0.9) 0%, rgba(255, 255, 255, 0.85) 100%);
    border-color: rgba(82, 196, 26, 0.2);
  }

  // ==================== 交互状态 ====================
  &:hover .node-card {
    transform: translateY(-2px);
    box-shadow:
      0 4px 8px rgba(0, 0, 0, 0.06),
      0 12px 24px rgba(0, 0, 0, 0.12),
      0 0 0 1px rgba(255, 255, 255, 0.6) inset;
    border-color: rgba(255, 255, 255, 0.8);
  }

  &.selected .node-card {
    border-color: rgba(24, 144, 255, 0.5);
    box-shadow:
      0 4px 12px rgba(24, 144, 255, 0.15),
      0 0 0 3px rgba(24, 144, 255, 0.1),
      0 0 0 1px rgba(255, 255, 255, 0.8) inset;

    .type-badge {
      background: linear-gradient(135deg, rgba(24, 144, 255, 0.12) 0%, rgba(24, 144, 255, 0.06) 100%);

      .type-name {
        color: #1890FF;
      }
    }

    .status-dot.is-configured {
      background-color: #1890FF;
      box-shadow: 0 0 12px rgba(24, 144, 255, 0.6);
    }
  }
}
</style>
