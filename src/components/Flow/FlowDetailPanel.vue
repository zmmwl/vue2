<template>
  <div class="flow-detail-panel" data-testid="flow-detail-panel">
    <!-- 头部 -->
    <div class="detail-header">
      <h3 class="detail-title">节点详情</h3>
      <button
        v-if="selectedNode && isConfigured"
        class="edit-button"
        @click="handleEdit"
        aria-label="编辑配置"
      >
        重新配置
      </button>
    </div>

    <!-- 内容区域 -->
    <div class="detail-content">
      <!-- 未选中节点 -->
      <div v-if="!selectedNode" class="empty-state">
        <div class="empty-icon">📋</div>
        <p>请选择一个节点查看详情</p>
      </div>

      <!-- 未配置节点 -->
      <div v-else-if="!isConfigured" class="empty-state">
        <div class="empty-icon">⚠️</div>
        <p>该节点尚未配置数据资产</p>
        <button class="btn btn-primary" @click="handleEdit">
          立即配置
        </button>
      </div>

      <!-- 已配置节点 - 显示详情 -->
      <div v-else class="detail-info">
        <!-- 基本信息 -->
        <div class="info-section">
          <h4 class="section-title">基本信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">资产名称</span>
              <span class="info-value">{{ assetInfo?.assetName || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">资产编号</span>
              <span class="info-value">{{ assetInfo?.assetNumber || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">所属企业</span>
              <span class="info-value">{{ assetInfo?.entityName || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">数据规模</span>
              <span class="info-value">{{ assetInfo?.scale || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">更新周期</span>
              <span class="info-value">{{ assetInfo?.cycle || '-' }}</span>
            </div>
            <div class="info-item full-width">
              <span class="info-label">资产描述</span>
              <span class="info-value">{{ assetInfo?.intro || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- 数据库信息 -->
        <div class="info-section">
          <h4 class="section-title">数据库信息</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">数据库名</span>
              <span class="info-value">{{ dataInfo?.databaseName || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">表名</span>
              <span class="info-value">{{ dataInfo?.tableName || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- 已选字段 -->
        <div class="info-section">
          <h4 class="section-title">
            已选字段
            <span class="field-count">({{ selectedFields?.length || 0 }})</span>
          </h4>
          <div class="field-list">
            <div
              v-for="field in selectedFieldList"
              :key="field.name"
              class="field-item"
            >
              <div class="field-name">{{ field.name }}</div>
              <div class="field-type">{{ field.dataType }}</div>
              <div v-if="field.isPrimaryKey" class="field-tag primary-key">主键</div>
              <div v-if="field.privacyQuery" class="field-tag privacy">隐私</div>
            </div>
            <div v-if="!selectedFieldList || selectedFieldList.length === 0" class="empty-fields">
              未选择任何字段
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import type { Node } from '@vue-flow/core'
import type { NodeData } from '@/types/nodes'
import { logger } from '@/utils/logger'

interface Props {
  selectedNode: Node<NodeData> | null
}

interface Emits {
  (e: 'edit', nodeId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 判断节点是否已配置
const isConfigured = computed(() => {
  return !!(props.selectedNode?.data?.assetInfo && props.selectedNode?.data?.selectedFields)
})

// 获取资产信息
const assetInfo = computed(() => props.selectedNode?.data?.assetInfo)

// 获取数据集信息
const dataInfo = computed(() => props.selectedNode?.data?.assetInfo?.dataInfo)

// 获取已选字段名称列表
const selectedFields = computed(() => props.selectedNode?.data?.selectedFields)

// 获取已选字段详细信息
const selectedFieldList = computed(() => {
  if (!dataInfo.value || !selectedFields.value) {
    return []
  }

  const allFields = dataInfo.value.fieldList || []
  const selectedSet = new Set(selectedFields.value)

  return allFields.filter(field => selectedSet.has(field.name))
})

// 处理编辑按钮点击
function handleEdit() {
  if (!props.selectedNode) return

  logger.info('[FlowDetailPanel] Edit clicked', { nodeId: props.selectedNode.id })
  emit('edit', props.selectedNode.id)
}

// 监听选中节点变化
watch(() => props.selectedNode, (node) => {
  if (node) {
    logger.debug('[FlowDetailPanel] Node selected', {
      nodeId: node.id,
      isConfigured: isConfigured.value
    })
  }
}, { immediate: true })
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.flow-detail-panel {
  width: $detail-panel-width;
  height: 100%;
  background: var(--bg-primary);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.detail-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.edit-button {
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  background: $button-primary-bg;
  color: white;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: $button-primary-hover;
  }
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state p {
  margin: 0 0 20px 0;
  color: var(--text-secondary);
  font-size: 14px;
}

// 按钮
.btn {
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s;

  &.btn-primary {
    background: $button-primary-bg;
    color: white;

    &:hover {
      background: $button-primary-hover;
    }
  }
}

// 详情信息
.detail-info {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;

  .field-count {
    font-size: 12px;
    font-weight: normal;
    color: var(--text-secondary);
  }
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;

  &.full-width {
    grid-column: 1 / -1;
  }
}

.info-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.info-value {
  font-size: 14px;
  color: var(--text-primary);
  word-break: break-word;
}

// 字段列表
.field-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
}

.field-name {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}

.field-type {
  font-size: 11px;
  color: var(--text-secondary);
  padding: 2px 6px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  font-family: 'Courier New', monospace;
}

.field-tag {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;

  &.primary-key {
    background: $tag-primary-key-bg;
    color: $tag-primary-key-text;
  }

  &.privacy {
    background: $tag-privacy-bg;
    color: $tag-privacy-text;
  }
}

.empty-fields {
  padding: 20px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
}
</style>
