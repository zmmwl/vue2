<template>
  <div class="flow-sidebar">
    <!-- 滚动内容容器 -->
    <div class="sidebar-content" ref="sidebarRef">
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
        <!-- 普通计算任务卡片 -->
        <div
          v-for="template in regularComputeTaskTemplates"
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

        <!-- 联邦学习卡片（可展开） -->
        <div
          class="palette-node fl-trigger-card"
          :class="{ 'is-expanded': flCardExpanded }"
          ref="flCardRef"
          @mouseenter="handleFLCardEnter"
          @mouseleave="handleFLCardLeave"
          @click="toggleFLCard"
        >
          <div class="palette-node-icon" style="color: #EB2F96">
            🔐
          </div>
          <div class="palette-node-content">
            <div class="palette-node-label">联邦学习</div>
            <div class="palette-node-desc">Federated Learning</div>
          </div>
          <span class="expand-indicator" :class="{ 'is-expanded': flCardExpanded }">▸</span>
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
          v-for="template in LOCAL_TASK_TEMPLATES"
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
    </div><!-- /.sidebar-content -->

    <!-- FL 卡片子菜单 - 使用 Teleport 渲染到 body -->
    <Teleport to="body">
      <Transition name="fl-card-slide">
        <div
          v-if="flCardExpanded"
          class="fl-card-submenu"
          :style="flCardSubmenuStyle"
          @mouseenter="handleFLSubmenuEnter"
          @mouseleave="handleFLSubmenuLeave"
        >
          <!-- 模式切换 Tab -->
          <div class="fl-mode-tabs">
            <div
              class="fl-mode-tab"
              :class="{ 'is-active': activeFLMode === FLMode.TRAINING }"
              @click="activeFLMode = FLMode.TRAINING"
            >
              <span class="tab-icon">🎓</span>
              <span>训练</span>
            </div>
            <div
              class="fl-mode-tab"
              :class="{ 'is-active': activeFLMode === FLMode.INFERENCE }"
              @click="activeFLMode = FLMode.INFERENCE"
            >
              <span class="tab-icon">🔮</span>
              <span>推断</span>
            </div>
          </div>

          <!-- 任务类别卡片 -->
          <div class="fl-category-cards">
            <div
              v-for="category in currentFLCategories"
              :key="category.category"
              class="fl-category-card"
              :class="{ 'is-hovered': hoveredCategory === category.category }"
              @mouseenter="handleCategoryEnter(category.category)"
              @mouseleave="handleCategoryLeave"
            >
              <div class="category-card-header" :style="{ borderColor: getFLCategoryColor(category.category) }">
                <span class="category-icon">{{ category.icon }}</span>
                <span class="category-name">{{ category.name }}</span>
                <span class="category-arrow">▸</span>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- 三级任务列表 -->
      <Transition name="fl-card-slide">
        <div
          v-if="flCardExpanded && hoveredCategory"
          class="fl-task-card"
          :style="flTaskCardStyle"
          @mouseenter="handleTaskCardEnter"
          @mouseleave="handleTaskCardLeave"
        >
          <div class="task-card-header" :style="{ backgroundColor: getFLCategoryColor(currentHoveredCategoryInfo?.category || '') }">
            <span class="header-icon">{{ currentHoveredCategoryInfo?.icon }}</span>
            <span class="header-title">{{ currentHoveredCategoryInfo?.name }}</span>
            <span class="header-badge">{{ activeFLMode === FLMode.TRAINING ? '训练' : '推断' }}</span>
          </div>
          <div class="task-card-list">
            <div
              v-for="task in currentHoveredTasks"
              :key="task.taskName"
              class="task-item"
              draggable="true"
              @dragstart="onDragStartFLTask($event, task, currentHoveredCategoryInfo?.category, activeFLMode)"
            >
              <div class="task-icon">{{ task.icon }}</div>
              <div class="task-content">
                <div class="task-name">{{ task.name }}</div>
                <div v-if="task.description" class="task-desc">{{ task.description }}</div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue'
import { DATA_SOURCE_TEMPLATES, COMPUTE_TASK_TEMPLATES, MODEL_TEMPLATES, RESOURCE_TEMPLATES, LOCAL_TASK_TEMPLATES } from '@/utils/node-templates'
import type { NodeTemplate } from '@/types/nodes'
import { ComputeTaskType, NodeCategory } from '@/types/nodes'
import { FL_TRAINING_MENU, FL_INFERENCE_MENU, getFLCategoryColor } from '@/utils/fl-task-templates'
import { FLTaskCategory, FLMode } from '@/types/fl-tasks'
import type { FLTaskMenuItem, FLTaskCategoryMenu } from '@/types/fl-tasks'

// 高亮状态
const highlightType = ref<'models' | 'computes' | null>(null)

// FL 卡片展开状态
const flCardExpanded = ref(false)
const activeFLMode = ref<FLMode>(FLMode.TRAINING)
const hoveredCategory = ref<FLTaskCategory | null>(null)

// 卡片位置
const flCardSubmenuStyle = ref<{ top: string; left: string }>({ top: '0px', left: '0px' })
const flTaskCardStyle = ref<{ top: string; left: string }>({ top: '0px', left: '0px' })

// 元素引用
const sidebarRef = ref<HTMLElement | null>(null)
const flCardRef = ref<HTMLElement | null>(null)
const modelSectionRef = ref<HTMLElement | null>(null)
const resourceSectionRef = ref<HTMLElement | null>(null)

// 过滤出非联邦学习的计算任务模板
const regularComputeTaskTemplates = computed(() => {
  return COMPUTE_TASK_TEMPLATES.filter(t => t.taskType !== ComputeTaskType.FL)
})

// 当前模式对应的类别
const currentFLCategories = computed(() => {
  return activeFLMode.value === FLMode.TRAINING
    ? FL_TRAINING_MENU.categories
    : FL_INFERENCE_MENU.categories
})

// 当前悬停类别的信息
const currentHoveredCategoryInfo = computed(() => {
  if (!hoveredCategory.value) return null
  return currentFLCategories.value.find(c => c.category === hoveredCategory.value)
})

// 当前悬停类别的任务列表
const currentHoveredTasks = computed(() => {
  return currentHoveredCategoryInfo.value?.tasks || []
})

/**
 * 更新 FL 卡片子菜单位置
 */
function updateFLCardSubmenuPosition() {
  if (!flCardRef.value) return
  const rect = flCardRef.value.getBoundingClientRect()

  const submenuWidth = 200
  const viewportHeight = window.innerHeight
  const headerHeight = 60
  const estimatedHeight = 280

  let top = rect.top

  // 确保不超出底部
  if (top + estimatedHeight > viewportHeight) {
    top = viewportHeight - estimatedHeight
  }

  // 确保不超出顶部
  top = Math.max(headerHeight, top)

  flCardSubmenuStyle.value = {
    top: `${top}px`,
    left: `${rect.right + 8}px`
  }
}

/**
 * 更新任务卡片位置
 */
function updateFLTaskCardPosition() {
  if (!flCardExpanded.value) return

  const submenuRect = document.querySelector('.fl-card-submenu')?.getBoundingClientRect()
  if (!submenuRect) return

  flTaskCardStyle.value = {
    top: `${submenuRect.top}px`,
    left: `${submenuRect.right + 8}px`
  }
}

/**
 * 处理 FL 卡片进入
 */
function handleFLCardEnter() {
  updateFLCardSubmenuPosition()
  flCardExpanded.value = true
}

/**
 * 处理 FL 卡片离开
 */
function handleFLCardLeave() {
  setTimeout(() => {
    if (!flCardExpanded.value) return
    const submenu = document.querySelector('.fl-card-submenu')
    const taskCard = document.querySelector('.fl-task-card')
    if ((submenu && submenu.matches(':hover')) || (taskCard && taskCard.matches(':hover'))) {
      return
    }
    flCardExpanded.value = false
    hoveredCategory.value = null
  }, 200)
}

/**
 * 切换 FL 卡片展开状态
 */
function toggleFLCard() {
  flCardExpanded.value = !flCardExpanded.value
  if (flCardExpanded.value) {
    updateFLCardSubmenuPosition()
  }
}

/**
 * 处理子菜单进入
 */
function handleFLSubmenuEnter() {
  flCardExpanded.value = true
}

/**
 * 处理子菜单离开
 */
function handleFLSubmenuLeave() {
  setTimeout(() => {
    const taskCard = document.querySelector('.fl-task-card')
    if (taskCard && taskCard.matches(':hover')) {
      return
    }
    flCardExpanded.value = false
    hoveredCategory.value = null
  }, 200)
}

/**
 * 处理类别进入
 */
function handleCategoryEnter(category: FLTaskCategory) {
  hoveredCategory.value = category
  nextTick(() => {
    updateFLTaskCardPosition()
  })
}

/**
 * 处理类别离开
 */
function handleCategoryLeave() {
  setTimeout(() => {
    const taskCard = document.querySelector('.fl-task-card')
    if (taskCard && taskCard.matches(':hover')) {
      return
    }
    hoveredCategory.value = null
  }, 200)
}

/**
 * 处理任务卡片进入
 */
function handleTaskCardEnter() {
  // 保持状态
}

/**
 * 处理任务卡片离开
 */
function handleTaskCardLeave() {
  hoveredCategory.value = null
}

/**
 * 将元素滚动到视图中间
 */
function scrollIntoViewCenter(element: HTMLElement | null) {
  if (!element || !sidebarRef.value) return

  const sidebar = sidebarRef.value
  const sidebarHeight = sidebar.clientHeight
  const elementTop = element.offsetTop
  const elementHeight = element.clientHeight

  const targetScrollTop = elementTop - (sidebarHeight / 2) + (elementHeight / 2)

  sidebar.scrollTo({
    top: targetScrollTop,
    behavior: 'smooth'
  })
}

// 监听滚动事件
function handleScroll() {
  if (flCardExpanded.value) {
    updateFLCardSubmenuPosition()
    if (hoveredCategory.value) {
      updateFLTaskCardPosition()
    }
  }
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

  if (sidebarRef.value) {
    sidebarRef.value.addEventListener('scroll', handleScroll)
  }
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener('highlight-models', () => {})
  document.removeEventListener('highlight-computes', () => {})
  document.removeEventListener('clear-highlight', () => {})

  if (sidebarRef.value) {
    sidebarRef.value.removeEventListener('scroll', handleScroll)
  }
})

/**
 * 处理拖拽开始事件
 */
const onDragStart = (event: DragEvent, template: NodeTemplate) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/vueflow', JSON.stringify(template))
    event.dataTransfer.effectAllowed = 'move'
  }
}

/**
 * 处理 FL 任务拖拽开始事件
 */
const onDragStartFLTask = (
  event: DragEvent,
  task: FLTaskMenuItem,
  category: FLTaskCategory | undefined,
  mode: FLMode
) => {
  if (!category) return

  if (event.dataTransfer) {
    const flTaskTemplate: NodeTemplate = {
      type: 'fl_task',
      label: task.name,
      category: NodeCategory.COMPUTE_TASK,
      taskType: ComputeTaskType.FL,
      icon: task.icon,
      color: getFLCategoryColor(category),
      description: task.description
    }
    const data = {
      ...flTaskTemplate,
      flTask: {
        taskName: task.taskName,
        taskDisplayName: task.name,
        category,
        mode
      }
    }
    event.dataTransfer.setData('application/vueflow', JSON.stringify(data))
    event.dataTransfer.effectAllowed = 'move'
  }
}

/**
 * 处理模型拖拽开始事件
 */
const onDragStartModel = (event: DragEvent, template: NodeTemplate) => {
  if (event.dataTransfer) {
    let modelType = 'CodeBin-V2'
    if (template.label.includes('表达式')) {
      modelType = 'expression'
    } else if (template.label.includes('SPDZ')) {
      modelType = 'SPDZ'
    } else if (template.isCodeBin) {
      modelType = 'codebin-select'
    } else if (template.modelType === 'GROUP_STAT') {
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
  overflow: visible;
  position: relative;
  box-shadow: 4px 0 16px rgba(0, 0, 0, 0.05);
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: visible;

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

// FL 触发卡片样式
.fl-trigger-card {
  cursor: pointer;

  .expand-indicator {
    margin-left: auto;
    font-size: 12px;
    color: var(--text-secondary);
    transition: transform 0.2s ease;

    &.is-expanded {
      transform: rotate(90deg);
    }
  }

  &.is-expanded {
    border-color: #EB2F96;
    background: rgba(235, 47, 150, 0.05);

    &::before {
      background: #EB2F96;
      transform: scaleY(1);
    }

    .palette-node-label {
      color: #EB2F96;
    }
  }
}
</style>

<!-- 全局样式：用于 Teleport 到 body 的子菜单 -->
<style lang="scss">
@use '@/assets/styles/variables.scss' as *;

// FL 卡片子菜单
.fl-card-submenu {
  position: fixed;
  width: 200px;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(0, 0, 0, 0.08);
  z-index: 1000;
  overflow: hidden;
}

// 模式切换 Tab
.fl-mode-tabs {
  display: flex;
  background: rgba(0, 0, 0, 0.02);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.fl-mode-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 2px solid transparent;

  .tab-icon {
    font-size: 16px;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.02);
    color: var(--text-primary);
  }

  &.is-active {
    color: #1890ff;
    background: #fff;
    border-bottom-color: #1890ff;
  }
}

// 任务类别卡片容器
.fl-category-cards {
  padding: 8px;
}

.fl-category-card {
  border-radius: var(--radius-md);
  margin-bottom: 4px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:last-child {
    margin-bottom: 0;
  }

  &:hover,
  &.is-hovered {
    background: rgba(24, 144, 255, 0.08);
  }

  .category-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-left: 3px solid transparent;
    border-radius: 0 6px 6px 0;
  }

  .category-icon {
    font-size: 16px;
  }

  .category-name {
    flex: 1;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
  }

  .category-arrow {
    font-size: 11px;
    color: var(--text-secondary);
    transition: transform 0.2s ease;
  }

  &.is-hovered .category-arrow {
    transform: translateX(2px);
  }
}

// 任务卡片
.fl-task-card {
  position: fixed;
  width: 220px;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.08);
  z-index: 1001;
  overflow: hidden;
}

.task-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  color: #fff;

  .header-icon {
    font-size: 18px;
  }

  .header-title {
    flex: 1;
    font-size: 14px;
    font-weight: 600;
  }

  .header-badge {
    font-size: 11px;
    padding: 2px 8px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 10px;
  }
}

.task-card-list {
  padding: 8px;
  max-height: 300px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 2px;
  }
}

.task-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  cursor: grab;
  transition: all 0.2s ease;
  border: 1px solid transparent;

  &:hover {
    background: var(--list-item-hover-bg);
    border-color: var(--list-item-selected-border);
    transform: translateX(2px);
  }

  &:active {
    cursor: grabbing;
    transform: scale(0.98);
  }

  .task-icon {
    font-size: 18px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.04);
    border-radius: var(--button-sm-radius);
  }

  .task-content {
    flex: 1;
    min-width: 0;
  }

  .task-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
  }

  .task-desc {
    font-size: 11px;
    color: var(--text-secondary);
    margin-top: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

// 卡片滑入动画
.fl-card-slide-enter-active,
.fl-card-slide-leave-active {
  transition: all 0.2s ease-out;
}

.fl-card-slide-enter-from,
.fl-card-slide-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}
</style>
