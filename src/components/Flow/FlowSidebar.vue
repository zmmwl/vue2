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
          :data-testid="`palette-node-${template.label.replace(/\s+/g, '-').toLowerCase()}`"
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
          :data-testid="`palette-node-${template.label.replace(/\s+/g, '-').toLowerCase()}`"
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
@use '@/assets/styles/variables.scss' as *;

.flow-sidebar {
  width: 280px;
  height: 100%;
  background: var(--panel-bg);
  backdrop-filter: var(--panel-blur);
  -webkit-backdrop-filter: var(--panel-blur);
  border-right: 1px solid var(--glass-border);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  box-shadow: 4px 0 16px rgba(0, 0, 0, 0.05);

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

.sidebar-section {
  padding: 20px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 16px;
    right: 16px;
    height: 1px;
    background: linear-gradient(90deg,
      transparent 0%,
      var(--datasource-blue) 50%,
      transparent 100%
    );
    opacity: 0.15;
  }

  &:last-child {
    border-bottom: none;

    &::after {
      display: none;
    }
  }
}

.section-title {
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, var(--datasource-blue), #0284C7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: flex;
  align-items: center;
  gap: 8px;

  &::before {
    content: '';
    width: 4px;
    height: 16px;
    background: linear-gradient(180deg, var(--datasource-blue), #38BDF8);
    border-radius: 2px;
  }
}

.node-palette {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.palette-node {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--list-item-radius);
  cursor: grab;
  transition: var(--button-transition);
  border: 1px solid rgba(0, 0, 0, 0.05);
  background: var(--info-card-bg);
  backdrop-filter: blur(8px);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--datasource-blue);
    transform: scaleY(0);
    transition: transform var(--transition-base) var(--easing-smooth);
  }

  &:hover {
    background: var(--list-item-hover-bg);
    border-color: var(--list-item-selected-border);
    transform: translateX(4px);
    box-shadow: 0 2px 8px rgba(14, 165, 233, 0.1);

    &::before {
      transform: scaleY(1);
    }

    .palette-node-icon {
      background: linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(14, 165, 233, 0.05));
      transform: scale(1.05);
    }

    .palette-node-label {
      color: var(--datasource-blue);
    }
  }

  &:active {
    cursor: grabbing;
    transform: translateX(2px) scale(0.98);
  }
}

.palette-node-icon {
  font-size: 20px;
  line-height: 1;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.04);
  border-radius: var(--button-sm-radius);
  transition: var(--button-transition);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.palette-node-content {
  flex: 1;
  min-width: 0;
}

.palette-node-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 3px;
  transition: color var(--transition-base) var(--easing-smooth);
}

.palette-node-desc {
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
