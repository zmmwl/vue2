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
        <!-- DAG 计算任务节点 -->
        <template v-if="isDagComputeTask">
          <!-- 计算任务信息 -->
          <div class="info-section">
            <h4 class="section-title">计算任务</h4>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">计算类型</span>
                <span class="info-value compute-type" :style="{ color: computeTypeColor }">
                  {{ computeTaskData?.computeType || '-' }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">技术路径</span>
                <span class="info-value tech-path">
                  {{ computeTaskData?.techPath === 'tee' ? '硬件 TEE' : '软件密码学' }}
                </span>
              </div>
            </div>
          </div>

          <!-- 输入数据 -->
          <div class="info-section">
            <h4 class="section-title">
              输入数据
              <span class="field-count">({{ inputProviders.length }})</span>
            </h4>
            <div v-if="inputProviders.length > 0" class="provider-list">
              <div
                v-for="(provider, idx) in inputProviders"
                :key="provider.sourceNodeId"
                class="provider-card"
              >
                <div class="provider-header">
                  <span class="provider-index">#{{ idx + 1 }}</span>
                  <span class="provider-source">{{ provider.participantId }}</span>
                </div>
                <div class="provider-body">
                  <div class="provider-dataset">📊 {{ provider.dataset }}</div>
                  <div class="provider-fields">
                    <span class="field-count-label">{{ provider.fields.length }} 个字段:</span>
                    <div class="field-chips">
                      <span
                        v-for="field in provider.fields"
                        :key="field.columnName"
                        class="field-chip"
                        :class="{ 'is-join': field.isJoinField }"
                      >
                        {{ field.columnAlias || field.columnName }}
                        <span v-if="field.isJoinField" class="join-badge">{{ field.joinType }}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-providers">
              <div class="empty-icon">🔗</div>
              <p>尚未连接输入数据源</p>
            </div>
          </div>

          <!-- Join 条件 -->
          <div v-if="joinConditions.length > 0" class="info-section">
            <h4 class="section-title">
              Join 条件
              <span class="field-count">({{ joinConditions.length }})</span>
            </h4>
            <div class="join-conditions">
              <div
                v-for="(condition, idx) in joinConditions"
                :key="idx"
                class="join-condition-item"
              >
                <span class="join-type-badge" :class="condition.joinType.toLowerCase()">
                  {{ condition.joinType }}
                </span>
                <div class="join-operands">
                  <span
                    v-for="(operand, oIdx) in condition.operands"
                    :key="oIdx"
                    class="join-operand"
                  >
                    {{ operand.participantId }}.{{ operand.dataset }}
                    <span class="operand-fields">({{ operand.columnNames.join(', ') }})</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 输出数据 (T032-T034) -->
          <div class="info-section">
            <h4 class="section-title">
              输出数据
              <span class="field-count">({{ outputConfigs.length }})</span>
            </h4>
            <div v-if="outputConfigs.length > 0" class="output-list">
              <div
                v-for="(output, idx) in outputConfigs"
                :key="output.id"
                class="output-card"
              >
                <div class="output-header">
                  <span class="output-index">#{{ idx + 1 }}</span>
                  <span class="output-participant">{{ output.participantId }}</span>
                  <span class="output-dataset">{{ output.dataset }}</span>
                </div>
                <div class="output-body">
                  <div class="output-fields">
                    <span class="field-count-label">{{ output.outputFields.length }} 个字段:</span>
                    <div class="field-chips">
                      <span
                        v-for="field in output.outputFields"
                        :key="field.columnName"
                        class="field-chip"
                      >
                        {{ field.columnAlias || field.columnName }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-outputs">
              <div class="empty-icon">📤</div>
              <p>尚未配置输出数据</p>
            </div>
          </div>
        </template>

        <!-- 数据源节点 -->
        <template v-else>
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
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import type { Node } from '@vue-flow/core'
import type { NodeData } from '@/types/nodes'
import type { InputProvider, JoinCondition } from '@/types/contracts'
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
  const nodeData = props.selectedNode?.data
  // 数据源节点
  const isDataSourceConfigured = !!(nodeData?.assetInfo && nodeData?.selectedFields)
  // DAG 计算任务节点
  const isComputeTaskConfigured = !!(nodeData as any)?.computeType
  return isDataSourceConfigured || isComputeTaskConfigured
})

// 判断是否是 DAG 计算任务节点
const isDagComputeTask = computed(() => {
  const nodeData = props.selectedNode?.data as any
  return !!(nodeData?.computeType)
})

// 获取计算任务节点数据
const computeTaskData = computed(() => {
  if (!isDagComputeTask.value) return null
  return props.selectedNode?.data as any
})

// 计算类型颜色
const computeTypeColor = computed(() => {
  const computeType = computeTaskData.value?.computeType
  const colors: Record<string, string> = {
    'PSI': '#1890FF',
    'TEE_PSI': '#1890FF',
    'PIR': '#722ED1',
    'TEE_PIR': '#722ED1',
    'MPC': '#FA8C16',
    'TEE_MPC': '#FA8C16',
    'CONCAT': '#52C41A'
  }
  return colors[computeType || ''] || '#1890FF'
})

// 获取输入数据提供者列表
const inputProviders = computed((): InputProvider[] => {
  return (computeTaskData.value?.inputProviders as InputProvider[]) || []
})

// 获取 Join 条件列表
const joinConditions = computed((): JoinCondition[] => {
  return (computeTaskData.value?.joinConditions as JoinCondition[]) || []
})

// 获取输出数据配置列表 (T032-T034)
const outputConfigs = computed(() => {
  return (computeTaskData.value?.outputs as any[]) || []
})

// ========== 数据源节点相关 ==========

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
      isDagComputeTask: isDagComputeTask.value,
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

// ========== DAG 计算任务节点样式 ==========

.compute-type {
  font-weight: 700;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
}

.tech-path {
  padding: 4px 10px;
  background: rgba(14, 165, 233, 0.1);
  border-radius: 4px;
  font-weight: 600;
  color: var(--datasource-blue);
  font-size: 13px;
}

// 输入数据提供者列表
.provider-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.provider-card {
  background: var(--glass-bg);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 10px;
  overflow: hidden;
  transition: all var(--transition-base) var(--easing-smooth);

  &:hover {
    border-color: rgba(14, 165, 233, 0.2);
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.1);
  }
}

.provider-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(14, 165, 233, 0.05);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.provider-index {
  font-size: 11px;
  font-weight: 700;
  color: var(--datasource-blue);
  padding: 2px 8px;
  background: rgba(14, 165, 233, 0.15);
  border-radius: 4px;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
}

.provider-source {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.provider-body {
  padding: 12px 14px;
}

.provider-dataset {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
  margin-bottom: 8px;
}

.provider-fields {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-count-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.field-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.field-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 4px;
  font-size: 12px;
  color: var(--text-primary);
  font-weight: 500;

  &.is-join {
    background: rgba(250, 140, 22, 0.08);
    border-color: rgba(250, 140, 22, 0.2);
    color: #D46B08;
  }
}

.join-badge {
  font-size: 10px;
  padding: 1px 5px;
  background: rgba(250, 140, 22, 0.2);
  border-radius: 3px;
  font-weight: 700;
  text-transform: uppercase;
}

.empty-providers {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;

  .empty-icon {
    font-size: 40px;
    margin-bottom: 12px;
    opacity: 0.6;
  }

  p {
    margin: 0;
  }
}

// Join 条件
.join-conditions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.join-condition-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  background: rgba(250, 140, 22, 0.03);
  border: 1px solid rgba(250, 140, 22, 0.15);
  border-radius: 8px;
}

.join-type-badge {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  flex-shrink: 0;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;

  &.inner {
    background: linear-gradient(135deg, #E6F7FF, #BAE7FF);
    color: #1890FF;
    border: 1px solid rgba(24, 144, 255, 0.2);
  }

  &.cross {
    background: linear-gradient(135deg, #FFF7E6, #FFD591);
    color: #D46B08;
    border: 1px solid rgba(250, 140, 22, 0.2);
  }
}

.join-operands {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.join-operand {
  font-size: 12px;
  color: var(--text-primary);
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  background: rgba(0, 0, 0, 0.03);
  padding: 4px 8px;
  border-radius: 4px;
}

.operand-fields {
  color: var(--text-secondary);
  font-size: 11px;
  margin-left: 4px;
}

// ========== 输出数据节点样式 (T032-T034) ==========

.output-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.output-card {
  background: var(--glass-bg);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 10px;
  overflow: hidden;
  transition: all var(--transition-base) var(--easing-smooth);

  &:hover {
    border-color: rgba(82, 196, 26, 0.2);
    box-shadow: 0 4px 12px rgba(82, 196, 26, 0.1);
  }
}

.output-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(82, 196, 26, 0.05);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.output-index {
  font-size: 11px;
  font-weight: 700;
  color: #52C41A;
  padding: 2px 8px;
  background: rgba(82, 196, 26, 0.15);
  border-radius: 4px;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
}

.output-participant {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.output-dataset {
  font-size: 12px;
  color: var(--text-secondary);
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  background: rgba(0, 0, 0, 0.03);
  padding: 2px 8px;
  border-radius: 4px;
}

.output-body {
  padding: 12px 14px;
}

.output-fields {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.empty-outputs {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;

  .empty-icon {
    font-size: 40px;
    margin-bottom: 12px;
    opacity: 0.6;
  }

  p {
    margin: 0;
  }
}
</style>
