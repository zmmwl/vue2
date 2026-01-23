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

// 浮动动画
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.flow-detail-panel {
  width: var(--panel-width);
  height: 100%;
  background: var(--panel-bg);
  backdrop-filter: var(--panel-blur);
  -webkit-backdrop-filter: var(--panel-blur);
  border-left: 1px solid var(--glass-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.05);
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(135deg,
    rgba(14, 165, 233, 0.05) 0%,
    rgba(255, 255, 255, 0.95) 100%
  );
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg,
      transparent 0%,
      var(--datasource-blue) 50%,
      transparent 100%
    );
    opacity: 0.3;
  }
}

.detail-title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--datasource-blue), #0284C7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.edit-button {
  padding: 8px 14px;
  border-radius: var(--button-sm-radius);
  font-size: 13px;
  font-weight: 500;
  background: linear-gradient(135deg, var(--datasource-blue), #0284C7);
  color: white;
  border: none;
  cursor: pointer;
  transition: var(--button-transition);
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.25);

  &:hover {
    background: linear-gradient(135deg, #0284C7, #0369A1);
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.35);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0) scale(0.98);
  }
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--panel-padding);
  background: var(--glass-bg);

  &::-webkit-scrollbar {
    width: 5px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.08);
    border-radius: 3px;

    &:hover {
      background: rgba(0, 0, 0, 0.12);
    }
  }
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
  animation: fadeIn 0.5s ease;
}

.empty-icon {
  font-size: 56px;
  margin-bottom: 20px;
  opacity: 0.7;
  animation: float 3s ease-in-out infinite;
}

.empty-state p {
  margin: 0 0 24px 0;
  color: var(--text-secondary);
  font-size: 14px;
}

// 按钮
.btn {
  padding: var(--button-md-padding);
  border-radius: var(--button-md-radius);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: var(--button-transition);

  &.btn-primary {
    background: linear-gradient(135deg, var(--datasource-blue), #0284C7);
    color: white;
    box-shadow: 0 2px 8px rgba(14, 165, 233, 0.25);

    &:hover {
      background: linear-gradient(135deg, #0284C7, #0369A1);
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.35);
      transform: translateY(-2px);
    }

    &:active {
      transform: translateY(0) scale(0.98);
    }
  }
}

// 详情信息
.detail-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
  animation: fadeIn 0.4s ease;
}

.info-section {
  background: var(--info-card-bg);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: var(--info-card-radius);
  padding: var(--info-card-padding);
  box-shadow: var(--shadow-card-sm);
  transition: all var(--transition-base) var(--easing-smooth);

  &:hover {
    box-shadow: var(--shadow-card-md);
    border-color: rgba(14, 165, 233, 0.1);
  }
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  &::before {
    content: '';
    width: 3px;
    height: 16px;
    background: linear-gradient(180deg, var(--datasource-blue), #38BDF8);
    border-radius: 2px;
  }

  .field-count {
    font-size: 12px;
    font-weight: 400;
    color: var(--text-secondary);
    padding: 2px 8px;
    background: rgba(0, 0, 0, 0.04);
    border-radius: var(--field-tag-radius);
  }
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &.full-width {
    grid-column: 1 / -1;
  }
}

.info-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.info-value {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
  word-break: break-word;
  line-height: 1.5;
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
  gap: 10px;
  padding: 12px 14px;
  background: var(--glass-bg);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  transition: all var(--transition-base) var(--easing-smooth);

  &:hover {
    background: var(--list-item-hover-bg);
    border-color: rgba(14, 165, 233, 0.2);
    transform: translateX(4px);
    box-shadow: 0 2px 8px rgba(14, 165, 233, 0.08);
  }
}

.field-name {
  flex: 1;
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 600;
}

.field-type {
  font-size: 11px;
  color: var(--text-secondary);
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 4px;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-weight: 500;
}

.field-tag {
  font-size: 11px;
  padding: var(--field-tag-padding);
  border-radius: var(--field-tag-radius);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;

  &.primary-key {
    background: linear-gradient(135deg, #E6F7FF, #BAE7FF);
    color: #1890FF;
    border: 1px solid rgba(24, 144, 255, 0.2);
  }

  &.privacy {
    background: linear-gradient(135deg, #FFF1F0, #FFCCC7);
    color: #F5222D;
    border: 1px solid rgba(245, 34, 45, 0.2);
  }
}

.empty-fields {
  padding: 32px 20px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
  background: var(--info-card-bg);
  border-radius: var(--info-card-radius);
  border: 1px dashed rgba(0, 0, 0, 0.1);
}
</style>
