<template>
  <div class="flow-sidebar">
    <!-- 数据源部分 -->
    <div class="sidebar-section">
      <div class="section-title">数据源</div>
      <div class="node-palette">
        <div
          v-for="template in DATA_SOURCE_TEMPLATES"
          :key="template.label"
          class="palette-node"
          draggable="true"
          @dragstart="onDragStart($event, template)"
        >
          <div class="palette-node-icon" :style="{ color: template.color }">
            {{ template.icon }}
          </div>
          <div class="palette-node-content">
            <div class="palette-node-label">{{ template.label }}</div>
            <div v-if="template.description" class="palette-node-desc">
              {{ template.description }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 计算任务部分 -->
    <div class="sidebar-section">
      <div class="section-title">计算任务</div>
      <div class="node-palette">
        <div
          v-for="template in COMPUTE_TASK_TEMPLATES"
          :key="template.label"
          class="palette-node"
          draggable="true"
          @dragstart="onDragStart($event, template)"
        >
          <div class="palette-node-icon" :style="{ color: template.color }">
            {{ template.icon }}
          </div>
          <div class="palette-node-content">
            <div class="palette-node-label">{{ template.label }}</div>
            <div v-if="template.description" class="palette-node-desc">
              {{ template.description }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DATA_SOURCE_TEMPLATES, COMPUTE_TASK_TEMPLATES } from '@/utils/node-templates'
import type { NodeTemplate } from '@/types/nodes'

/**
 * 处理拖拽开始事件
 */
const onDragStart = (event: DragEvent, template: NodeTemplate) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/vueflow', JSON.stringify(template))
    event.dataTransfer.effectAllowed = 'move'
  }
}
</script>

<style scoped lang="scss">
.flow-sidebar {
  width: 260px;
  height: 100%;
  background: #f8f9fa;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar-section {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;

  &:last-child {
    border-bottom: none;
  }
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #666666;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.node-palette {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.palette-node {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: grab;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  background: #ffffff;

  &:hover {
    background: #f5f5f5;
    border-color: #1890ff;
    transform: translateX(2px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  &:active {
    cursor: grabbing;
  }
}

.palette-node-icon {
  font-size: 20px;
  line-height: 1;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  border-radius: 6px;
}

.palette-node-content {
  flex: 1;
  min-width: 0;
}

.palette-node-label {
  font-size: 13px;
  font-weight: 500;
  color: #000000;
  margin-bottom: 2px;
}

.palette-node-desc {
  font-size: 11px;
  color: #666666;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
