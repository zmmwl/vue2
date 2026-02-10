<template>
  <div class="flow-sidebar" ref="sidebarRef">
    <!-- 数据源部分 -->
    <div class="sidebar-section" ref="dataSourceSectionRef">
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
    <div class="sidebar-section" ref="computeTaskSectionRef">
      <div class="section-title">计算任务</div>
      <div class="node-palette">
        <div
          v-for="template in filteredComputeTaskTemplates"
          :key="template.label"
          class="palette-node"
          :class="{ 'is-disabled': template.taskType === ComputeTaskType.FL }"
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
          <div v-if="template.taskType === ComputeTaskType.FL" class="badge-coming-soon">
            待上线
          </div>
        </div>
      </div>
    </div>

    <!-- 计算模型部分 -->
    <div class="sidebar-section" ref="modelSectionRef">
      <div class="section-title">计算模型</div>
      <div class="node-palette">
        <div
          v-for="template in MODEL_TEMPLATES"
          :key="template.label"
          class="palette-node"
          :class="{ 'is-highlight': highlightType === 'models' }"
          draggable="true"
          :data-testid="`palette-node-${template.label.replace(/\s+/g, '-').toLowerCase()}`"
          @dragstart="onDragStartModel($event, template)"
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

    <!-- 算力资源部分 -->
    <div class="sidebar-section" ref="resourceSectionRef">
      <div class="section-title">算力资源</div>
      <div class="node-palette">
        <div
          v-for="template in RESOURCE_TEMPLATES"
          :key="template.label"
          class="palette-node"
          :class="{ 'is-highlight': highlightType === 'computes' }"
          draggable="true"
          :data-testid="`palette-node-${template.label.replace(/\s+/g, '-').toLowerCase()}`"
          @dragstart="onDragStartResource($event, template)"
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

    <!-- 本地计算任务部分 -->
    <div class="sidebar-section">
      <div class="section-title">本地计算任务</div>
      <div class="node-palette">
        <div
          class="palette-node"
          draggable="true"
          data-testid="palette-node-local-result-task"
          @dragstart="onDragStartLocalTask"
        >
          <div class="palette-node-icon" style="color: #722ED1">
            🔄
          </div>
          <div class="palette-node-content">
            <div class="palette-node-label">本地结果处理</div>
            <div class="palette-node-desc">拼接多个任务的输出结果</div>
          </div>
        </div>
        <div
          class="palette-node is-disabled"
          data-testid="palette-node-local-query"
        >
          <div class="palette-node-icon" style="color: #999999">
            📊
          </div>
          <div class="palette-node-content">
            <div class="palette-node-label">本地 Query</div>
            <div class="palette-node-desc">本地数据查询处理</div>
          </div>
          <div class="badge-coming-soon">待上线</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { DATA_SOURCE_TEMPLATES, COMPUTE_TASK_TEMPLATES, MODEL_TEMPLATES, RESOURCE_TEMPLATES } from '@/utils/node-templates'
import type { NodeTemplate } from '@/types/nodes'
import { ComputeTaskType } from '@/types/nodes'

// 高亮状态
const highlightType = ref<'models' | 'computes' | null>(null)

// Section 引用
const sidebarRef = ref<HTMLElement | null>(null)
const modelSectionRef = ref<HTMLElement | null>(null)
const resourceSectionRef = ref<HTMLElement | null>(null)

/**
 * 将元素滚动到视图中间
 */
function scrollIntoViewCenter(element: HTMLElement | null) {
  if (!element || !sidebarRef.value) return

  const sidebar = sidebarRef.value
  const sidebarHeight = sidebar.clientHeight
  const elementTop = element.offsetTop
  const elementHeight = element.clientHeight

  // 计算目标滚动位置，使元素在视图中居中
  const targetScrollTop = elementTop - (sidebarHeight / 2) + (elementHeight / 2)

  // 平滑滚动
  sidebar.scrollTo({
    top: targetScrollTop,
    behavior: 'smooth'
  })
}

// 组件挂载时添加事件监听
onMounted(() => {
  document.addEventListener('highlight-models', () => {
    highlightType.value = 'models'
    scrollIntoViewCenter(modelSectionRef.value)
  })
  document.addEventListener('highlight-computes', () => {
    highlightType.value = 'computes'
    scrollIntoViewCenter(resourceSectionRef.value)
  })
  document.addEventListener('clear-highlight', () => { highlightType.value = null })
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener('highlight-models', () => {})
  document.removeEventListener('highlight-computes', () => {})
  document.removeEventListener('clear-highlight', () => {})
})

// 过滤计算任务模板（联邦学习置灰但不隐藏）
const filteredComputeTaskTemplates = computed(() => {
  return COMPUTE_TASK_TEMPLATES
})

/**
 * 处理拖拽开始事件
 */
const onDragStart = (event: DragEvent, template: NodeTemplate) => {
  if (event.dataTransfer) {
    // 联邦学习暂时不可用
    if (template.taskType === ComputeTaskType.FL) {
      event.preventDefault()
      return
    }
    event.dataTransfer.setData('application/vueflow', JSON.stringify(template))
    event.dataTransfer.effectAllowed = 'move'
  }
}

/**
 * 处理模型拖拽开始事件
 */
const onDragStartModel = (event: DragEvent, template: NodeTemplate) => {
  if (event.dataTransfer) {
    // 确定模型类型
    let modelType = 'CodeBin-V2'
    if (template.label.includes('表达式')) {
      modelType = 'expression'
    } else if (template.label.includes('SPDZ')) {
      modelType = 'SPDZ'
    } else if (template.isCodeBin) {
      // CodeBin 组合模型，标记需要进一步选择
      modelType = 'codebin-select'
    } else if (template.modelType === 'GROUP_STAT') {
      // 分组统计模型
      modelType = 'GROUP_STAT'
    }

    const data = {
      ...template,
      modelType
    }
    event.dataTransfer.setData('application/vueflow', JSON.stringify(data))
    event.dataTransfer.effectAllowed = 'move'
  }
}

/**
 * 处理算力资源拖拽开始事件
 */
const onDragStartResource = (event: DragEvent, template: NodeTemplate) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/vueflow', JSON.stringify(template))
    event.dataTransfer.effectAllowed = 'move'
  }
}

/**
 * 处理本地任务拖拽
 */
const onDragStartLocalTask = (event: DragEvent) => {
  if (event.dataTransfer) {
    const localTaskTemplate: NodeTemplate = {
      type: 'localTask',
      label: '本地结果处理',
      category: 'localTask' as any,
      icon: '🔄',
      color: '#722ED1',
      description: '拼接多个任务的输出结果'
    }
    event.dataTransfer.setData('application/vueflow', JSON.stringify(localTaskTemplate))
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

.palette-node.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: rgba(0, 0, 0, 0.02);

  &:hover {
    background: rgba(0, 0, 0, 0.02);
    border-color: rgba(0, 0, 0, 0.05);
    transform: none;
    box-shadow: none;

    .palette-node-icon {
      background: rgba(0, 0, 0, 0.04);
      transform: none;
    }

    .palette-node-label {
      color: var(--text-primary);
    }
  }

  &:active {
    transform: none;
  }
}

.badge-coming-soon {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, #999999, #777777);
  border-radius: 4px;
  pointer-events: none;
}

// 高亮闪烁样式
.palette-node.is-highlight {
  animation: pulse-highlight 1s ease-in-out infinite;
}

@keyframes pulse-highlight {
  0%, 100% {
    background: var(--list-item-hover-bg);
    border-color: var(--list-item-selected-border);
    box-shadow: 0 2px 8px rgba(14, 165, 233, 0.1);
  }
  50% {
    background: #e6f7ff;
    border-color: #1890ff;
    box-shadow: 0 4px 16px rgba(24, 144, 255, 0.3);
  }
}
</style>
