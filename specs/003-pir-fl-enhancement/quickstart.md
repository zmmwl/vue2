# Quickstart: 隐匿查询功能完善与联邦学习任务上线

**Date**: 2026-02-21
**Feature**: 003-pir-fl-enhancement

## 开发环境设置

### 1. 切换到功能分支
```bash
git checkout 003-pir-fl-enhancement
```

### 2. 安装依赖
```bash
npm install
```

### 3. 启动开发服务器
```bash
npm run dev
```

开发服务器将在 `http://localhost:5172` 启动。

---

## 功能开发指南

### Phase 1: PIR实时数据源

#### 1.1 添加类型定义
文件: `src/types/nodes.ts`

```typescript
// 添加实时数据源类型
export interface RealtimeDataSourceInfo {
  id: string
  name: string
  sourceType: 'connection' | 'manual'
  fields: RealtimeFieldInfo[]
  sourceNodeId?: string
}

// 扩展PIR任务节点数据
export interface PIRTaskNodeData extends NodeData {
  category: NodeCategory.COMPUTE_TASK
  taskType: ComputeTaskType.PIR
  preloadDataSource?: InputProvider
  realtimeDataSource?: RealtimeDataSourceInfo
  // ...
}
```

#### 1.2 创建实时数据源配置弹窗
文件: `src/components/Modals/RealtimeDataSourceConfig.vue`

```vue
<template>
  <div class="modal-overlay">
    <div class="modal-content">
      <h3>配置实时数据源</h3>

      <!-- 来源选择 -->
      <div class="source-type-selector">
        <label>
          <input type="radio" value="connection" v-model="sourceType" />
          连线导入
        </label>
        <label>
          <input type="radio" value="manual" v-model="sourceType" />
          手工录入
        </label>
      </div>

      <!-- 连线导入模式 -->
      <div v-if="sourceType === 'connection'">
        <FieldImporter :sourceNodeId="sourceNodeId" @fields-imported="handleFieldsImported" />
      </div>

      <!-- 手工录入模式 -->
      <div v-else>
        <FieldEditor v-model="fields" />
      </div>
    </div>
  </div>
</template>
```

#### 1.3 修改连接验证
文件: `src/utils/connection-validator.ts`

```typescript
// 添加PIR输出连接限制
export function validatePIRConnection(
  sourceNode: Node,
  targetNode: Node
): ValidationResult {
  // PIR输出只能连接到PIR任务
  if (sourceNode.data.taskType === ComputeTaskType.PIR) {
    if (targetNode.data.taskType !== ComputeTaskType.PIR) {
      return {
        valid: false,
        reason: 'PIR输出只能连接到PIR任务'
      }
    }
  }
  return { valid: true }
}
```

---

### Phase 2: 联邦学习菜单

#### 2.1 创建FL任务模板
文件: `src/utils/fl-task-templates.ts`

```typescript
export const FL_TRAINING_MENU: FLMenuSection = {
  title: '联邦学习训练',
  categories: [
    {
      name: '预处理',
      tasks: [
        { name: '数据清洗', taskName: 'data_cleaning', icon: '🧹' },
        { name: '格式转换', taskName: 'format_conversion', icon: '🔄' },
        { name: 'ID标准化', taskName: 'id_normalization', icon: '🔢' }
      ]
    },
    {
      name: '特征工程',
      tasks: [
        { name: '样本对齐', taskName: 'psi_alignment', icon: '🔗' },
        { name: '特征选择', taskName: 'feature_selection', icon: '📊' },
        { name: '特征交叉', taskName: 'feature_cross', icon: '✖️' }
      ]
    },
    // ... 横向模型、纵向模型
  ]
}

export const FL_INFERENCE_MENU: FLMenuSection = {
  title: '联邦学习推断',
  // ... 类似结构
}
```

#### 2.2 修改侧边栏组件
文件: `src/components/Flow/FlowSidebar.vue`

```vue
<template>
  <div class="flow-sidebar">
    <!-- 数据源部分 -->
    <div class="sidebar-section">...</div>

    <!-- 联邦学习训练 (新增三级菜单) -->
    <div class="sidebar-section fl-section"
         @mouseenter="flTrainingExpanded = true"
         @mouseleave="flTrainingExpanded = false">
      <div class="section-title">联邦学习训练</div>

      <Transition name="slide">
        <div v-if="flTrainingExpanded" class="submenu">
          <div v-for="category in FL_TRAINING_MENU.categories"
               :key="category.name"
               class="submenu-category"
               @mouseenter="activeCategory = category.name"
               @mouseleave="activeCategory = null">
            <div class="category-title">{{ category.name }} ▸</div>

            <Transition name="slide">
              <div v-if="activeCategory === category.name" class="task-list">
                <div v-for="task in category.tasks"
                     :key="task.taskName"
                     class="palette-node"
                     draggable="true"
                     @dragstart="onDragStartFLTask($event, task)">
                  <span class="task-icon">{{ task.icon }}</span>
                  <span class="task-label">{{ task.name }}</span>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </Transition>
    </div>

    <!-- 联邦学习推断 (新增) -->
    <div class="sidebar-section fl-section">...</div>
  </div>
</template>
```

---

### Phase 3: FL任务节点

#### 3.1 创建FL任务节点组件
文件: `src/components/Nodes/FLTaskNode.vue`

```vue
<template>
  <div class="fl-task-node" :class="nodeClass">
    <!-- 节点头部 -->
    <div class="node-header">
      <span class="node-icon">{{ taskIcon }}</span>
      <span class="node-label">{{ label }}</span>
      <span class="mode-badge" :class="mode">{{ modeLabel }}</span>
    </div>

    <!-- 节点内容 -->
    <div class="node-content">
      <div class="task-name">{{ taskDisplayName }}</div>
      <div v-if="isConfigured" class="config-summary">
        {{ configSummary }}
      </div>
    </div>

    <!-- Handle连接点 -->
    <Handle type="target" position="top" id="input" />
    <Handle type="source" position="bottom" id="output" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { FLTaskNodeData } from '@/types/nodes'

const props = defineProps<{
  id: string
  data: FLTaskNodeData
}>()

const taskIcon = computed(() => {
  const icons: Record<string, string> = {
    'preprocess': '🧹',
    'feature_engineering': '📊',
    'horizontal': '🤖',
    'vertical': '🔗'
  }
  return icons[props.data.flCategory] || '⚙️'
})
</script>
```

#### 3.2 创建FL任务配置弹窗
文件: `src/components/Modals/FLTaskConfig.vue`

```vue
<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content fl-config-modal">
      <h3>{{ taskDisplayName }} - 参数配置</h3>

      <!-- 已部署模型选择 (推断模式) -->
      <div v-if="mode === 'inference'" class="model-selector">
        <label>选择已部署模型</label>
        <DeployedModelSelector v-model="deployedModel" />
      </div>

      <!-- 参数配置 -->
      <div class="parameters-section">
        <div v-for="param in parameterDefs" :key="param.name" class="param-item">
          <label>
            {{ param.displayName }}
            <span v-if="param.required" class="required">*</span>
          </label>

          <!-- 根据参数类型渲染不同输入组件 -->
          <ParameterInput
            :def="param"
            v-model="parameters[param.name]" />
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="modal-actions">
        <button class="btn-cancel" @click="$emit('close')">取消</button>
        <button class="btn-confirm" @click="handleConfirm">确认</button>
      </div>
    </div>
  </div>
</template>
```

---

### Phase 4: Mock数据和测试

#### 4.1 添加Mock数据
文件: `src/utils/mock-fl-data.ts`

```typescript
// 已部署模型Mock
export const MOCK_DEPLOYED_MODELS: DeployedModel[] = [
  {
    id: 'model_001',
    name: '用户信用评分模型-v1',
    version: '1.0.0',
    type: 'horizontal_lr',
    trainingParticipants: ['ent_001', 'ent_002'],
    entityName: '数据提供商A',
    createdAt: '2026-02-01'
  }
]

// FL参数模板Mock
export const MOCK_FL_PARAMETER_TEMPLATES: Record<string, FLTaskParameterTemplate> = {
  'logistic_regression': {
    taskName: 'logistic_regression',
    displayName: '逻辑回归',
    category: 'horizontal',
    parameters: [
      { name: 'learningRate', displayName: '学习率', dataType: 'number', required: true, defaultValue: 0.01 },
      { name: 'iterations', displayName: '迭代次数', dataType: 'number', required: true, defaultValue: 100 }
    ]
  }
}
```

#### 4.2 E2E测试
文件: `tests/e2e/fl-task-workflow.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('联邦学习任务工作流', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.flow-canvas')
  })

  test('应该能够拖拽逻辑回归任务到画布并配置参数', async ({ page }) => {
    // 1. 悬停联邦学习训练菜单
    await page.hover('.fl-section:has(.section-title:has-text("联邦学习训练"))')

    // 2. 悬停横向模型类型
    await page.hover('.submenu-category:has(.category-title:has-text("横向模型"))')

    // 3. 拖拽逻辑回归到画布
    const taskNode = page.locator('.task-list .palette-node:has-text("逻辑回归")')
    const canvas = page.locator('.flow-canvas')

    await taskNode.dragTo(canvas, { targetPosition: { x: 400, y: 300 } })

    // 4. 验证配置弹窗出现
    await expect(page.locator('.fl-config-modal')).toBeVisible()

    // 5. 填写参数
    await page.fill('input[name="learningRate"]', '0.05')
    await page.fill('input[name="iterations"]', '200')

    // 6. 确认配置
    await page.click('.btn-confirm')

    // 7. 验证节点创建成功
    await expect(page.locator('.fl-task-node')).toBeVisible()
  })
})
```

---

## 验证清单

### PIR实时数据源
- [ ] PIR任务可配置预加载数据源
- [ ] PIR任务可配置实时数据源（手工录入）
- [ ] PIR任务可配置实时数据源（连线导入）
- [ ] PIR输出节点显示为实时数据源样式
- [ ] PIR输出只能连接到PIR任务

### 联邦学习菜单
- [ ] "联邦学习训练"菜单显示正确
- [ ] 悬停展开四个任务类型
- [ ] 悬停类型展开具体任务列表
- [ ] 拖拽任务触发配置弹窗

### FL任务节点
- [ ] 预处理节点只接受单数据源
- [ ] 特征工程节点支持多数据源
- [ ] 模型节点参数配置正确
- [ ] 推断节点可选择已部署模型
- [ ] 选择模型后参与方自动确定

### 测试
- [ ] npm run build 通过
- [ ] E2E测试通过
- [ ] 手动验证主要流程
