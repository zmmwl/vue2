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

    <!-- 联邦学习训练部分 (触发器) -->
    <div
      class="sidebar-section fl-section"
      ref="flTrainingSectionRef"
      @mouseenter="handleFLTrainingEnter"
      @mouseleave="handleFLTrainingLeave"
    >
      <div class="section-title">
        <span class="section-icon">🎓</span>
        联邦学习训练
        <span class="expand-arrow">▸</span>
      </div>
    </div>

    <!-- 联邦学习推断部分 (触发器) -->
    <div
      class="sidebar-section fl-section"
      ref="flInferenceSectionRef"
      @mouseenter="handleFLInferenceEnter"
      @mouseleave="handleFLInferenceLeave"
    >
      <div class="section-title">
        <span class="section-icon">🔮</span>
        联邦学习推断
        <span class="expand-arrow">▸</span>
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

    <!-- FL 训练子菜单 - 在 sidebar-content 外面，使用 fixed 定位 -->
    <Transition name="slide">
      <div
        v-if="flTrainingExpanded"
        class="fl-submenu fl-submenu-fixed"
        :style="flTrainingSubmenuStyle"
        @mouseenter="flTrainingExpanded = true"
        @mouseleave="handleFLTrainingSubmenuLeave"
      >
        <div
          v-for="category in FL_TRAINING_MENU.categories"
          :key="category.category"
          class="fl-category"
          @mouseenter="activeFlTrainingCategory = category.category"
        >
          <div class="fl-category-title">
            <span class="category-icon">{{ category.icon }}</span>
            {{ category.name }}
            <span class="expand-arrow">▸</span>
          </div>

          <!-- 三级菜单：具体任务 -->
          <Transition name="slide">
            <div
              v-if="activeFlTrainingCategory === category.category"
              class="fl-task-list fl-task-list-fixed"
              :style="{ top: '0px' }"
            >
              <div
                v-for="task in category.tasks"
                :key="task.taskName"
                class="palette-node fl-task-node"
                draggable="true"
                :style="{ '--fl-color': getFLCategoryColor(category.category) }"
                @dragstart="onDragStartFLTask($event, task, category.category, FLMode.TRAINING)"
              >
                <div class="palette-node-icon">{{ task.icon }}</div>
                <div class="palette-node-content">
                  <div class="palette-node-label">{{ task.name }}</div>
                  <div v-if="task.description" class="palette-node-desc">
                    {{ task.description }}
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>

    <!-- FL 推断子菜单 - 在 sidebar-content 外面，使用 fixed 定位 -->
    <Transition name="slide">
      <div
        v-if="flInferenceExpanded"
        class="fl-submenu fl-submenu-fixed"
        :style="flInferenceSubmenuStyle"
        @mouseenter="flInferenceExpanded = true"
        @mouseleave="handleFLInferenceSubmenuLeave"
      >
        <div
          v-for="category in FL_INFERENCE_MENU.categories"
          :key="category.category"
          class="fl-category"
          @mouseenter="activeFlInferenceCategory = category.category"
        >
          <div class="fl-category-title">
            <span class="category-icon">{{ category.icon }}</span>
            {{ category.name }}
            <span class="expand-arrow">▸</span>
          </div>

          <!-- 三级菜单：具体任务 -->
          <Transition name="slide">
            <div
              v-if="activeFlInferenceCategory === category.category"
              class="fl-task-list fl-task-list-fixed"
              :style="{ top: '0px' }"
            >
              <div
                v-for="task in category.tasks"
                :key="task.taskName"
                class="palette-node fl-task-node"
                draggable="true"
                :style="{ '--fl-color': getFLCategoryColor(category.category) }"
                @dragstart="onDragStartFLTask($event, task, category.category, FLMode.INFERENCE)"
              >
                <div class="palette-node-icon">{{ task.icon }}</div>
                <div class="palette-node-content">
                  <div class="palette-node-label">{{ task.name }}</div>
                  <div v-if="task.description" class="palette-node-desc">
                    {{ task.description }}
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { DATA_SOURCE_TEMPLATES, COMPUTE_TASK_TEMPLATES, MODEL_TEMPLATES, RESOURCE_TEMPLATES, LOCAL_TASK_TEMPLATES } from '@/utils/node-templates'
import type { NodeTemplate } from '@/types/nodes'
import { ComputeTaskType, NodeCategory } from '@/types/nodes'
import { FL_TRAINING_MENU, FL_INFERENCE_MENU, getFLCategoryColor } from '@/utils/fl-task-templates'
import { FLTaskCategory, FLMode } from '@/types/fl-tasks'
import type { FLTaskMenuItem } from '@/types/fl-tasks'

// 高亮状态
const highlightType = ref<'models' | 'computes' | null>(null)

// FL 菜单展开状态
const flTrainingExpanded = ref(false)
const flInferenceExpanded = ref(false)
const activeFlTrainingCategory = ref<FLTaskCategory | null>(null)
const activeFlInferenceCategory = ref<FLTaskCategory | null>(null)

// FL 子菜单位置
const flTrainingSubmenuStyle = ref<{ top: string; left: string }>({ top: '0px', left: '0px' })
const flInferenceSubmenuStyle = ref<{ top: string; left: string }>({ top: '0px', left: '0px' })

// Section 引用
const sidebarRef = ref<HTMLElement | null>(null)
const modelSectionRef = ref<HTMLElement | null>(null)
const resourceSectionRef = ref<HTMLElement | null>(null)
const flTrainingSectionRef = ref<HTMLElement | null>(null)
const flInferenceSectionRef = ref<HTMLElement | null>(null)

/**
 * 计算 FL 训练子菜单位置
 */
function updateFLTrainingSubmenuPosition() {
  if (!flTrainingSectionRef.value) return
  const rect = flTrainingSectionRef.value.getBoundingClientRect()
  flTrainingSubmenuStyle.value = {
    top: `${rect.top}px`,
    left: `${rect.right}px`
  }
}

/**
 * 计算 FL 推断子菜单位置
 */
function updateFLInferenceSubmenuPosition() {
  if (!flInferenceSectionRef.value) return
  const rect = flInferenceSectionRef.value.getBoundingClientRect()
  flInferenceSubmenuStyle.value = {
    top: `${rect.top}px`,
    left: `${rect.right}px`
  }
}

/**
 * 处理 FL 训练菜单进入
 */
function handleFLTrainingEnter() {
  updateFLTrainingSubmenuPosition()
  flTrainingExpanded.value = true
}

/**
 * 处理 FL 训练菜单离开
 */
function handleFLTrainingLeave() {
  // 延迟关闭，给用户时间移动到子菜单
  setTimeout(() => {
    if (!flTrainingExpanded.value) return
    // 检查鼠标是否在子菜单上
    const submenu = document.querySelector('.fl-submenu-fixed')
    if (submenu && submenu.matches(':hover')) {
      return
    }
    flTrainingExpanded.value = false
    activeFlTrainingCategory.value = null
  }, 100)
}

/**
 * 处理 FL 训练子菜单离开
 */
function handleFLTrainingSubmenuLeave() {
  flTrainingExpanded.value = false
  activeFlTrainingCategory.value = null
}

/**
 * 处理 FL 推断菜单进入
 */
function handleFLInferenceEnter() {
  updateFLInferenceSubmenuPosition()
  flInferenceExpanded.value = true
}

/**
 * 处理 FL 推断菜单离开
 */
function handleFLInferenceLeave() {
  setTimeout(() => {
    if (!flInferenceExpanded.value) return
    const submenus = document.querySelectorAll('.fl-submenu-fixed')
    let isHovering = false
    submenus.forEach((submenu) => {
      if (submenu.matches(':hover')) {
        isHovering = true
      }
    })
    if (!isHovering) {
      flInferenceExpanded.value = false
      activeFlInferenceCategory.value = null
    }
  }, 100)
}

/**
 * 处理 FL 推断子菜单离开
 */
function handleFLInferenceSubmenuLeave() {
  flInferenceExpanded.value = false
  activeFlInferenceCategory.value = null
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

  // 计算目标滚动位置，使元素在视图中居中
  const targetScrollTop = elementTop - (sidebarHeight / 2) + (elementHeight / 2)

  // 平滑滚动
  sidebar.scrollTo({
    top: targetScrollTop,
    behavior: 'smooth'
  })
}

// 监听滚动事件，更新子菜单位置
function handleScroll() {
  if (flTrainingExpanded.value) {
    updateFLTrainingSubmenuPosition()
  }
  if (flInferenceExpanded.value) {
    updateFLInferenceSubmenuPosition()
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

  // 监听滚动事件
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
 * 处理 FL 任务拖拽开始事件
 */
const onDragStartFLTask = (
  event: DragEvent,
  task: FLTaskMenuItem,
  category: FLTaskCategory,
  mode: FLMode
) => {
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
    // 附加 FL 任务信息
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

// ========== 联邦学习三级菜单样式 ==========

.fl-section {
  position: relative;

  .section-title {
    cursor: pointer;
    user-select: none;
    margin-bottom: 0;  // FL section 没有子内容，取消底部间距

    .section-icon {
      margin-right: 8px;
    }

    .expand-arrow {
      margin-left: auto;
      font-size: 12px;
      color: var(--text-secondary);
      transition: transform 0.2s ease;
    }
  }

  &:hover .expand-arrow {
    transform: translateX(2px);
  }
}

// 使用 fixed 定位的子菜单
.fl-submenu-fixed {
  position: fixed;
  width: 200px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  border: 1px solid rgba(0, 0, 0, 0.08);
  z-index: 1000;
  padding: 8px 0;
}

.fl-category {
  position: relative;

  .fl-category-title {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s ease;

    .category-icon {
      font-size: 16px;
    }

    .expand-arrow {
      margin-left: auto;
      font-size: 11px;
      color: var(--text-secondary);
      transition: transform 0.2s ease;
    }

    &:hover {
      background: var(--list-item-hover-bg);
    }
  }

  &:hover .expand-arrow {
    transform: translateX(2px);
  }
}

// 使用 fixed 定位的三级菜单
.fl-task-list-fixed {
  position: fixed;
  left: auto;
  width: 180px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  border: 1px solid rgba(0, 0, 0, 0.08);
  z-index: 1001;
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

.fl-task-node {
  --fl-color: var(--datasource-blue);
  padding: 10px 12px;
  margin-bottom: 6px;

  &:last-child {
    margin-bottom: 0;
  }

  &::before {
    background: var(--fl-color);
  }

  &:hover {
    border-color: var(--fl-color);

    .palette-node-label {
      color: var(--fl-color);
    }
  }

  .palette-node-icon {
    background: linear-gradient(135deg, var(--fl-color), var(--fl-color) 100%);
    background-size: 0% 100%;
    background-position: left;
    background-repeat: no-repeat;
    transition: background-size 0.2s ease;

    &:hover {
      background-size: 100% 100%;
    }
  }
}

// 滑入动画
.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease-out;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}
</style>
