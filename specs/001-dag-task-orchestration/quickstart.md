# Quickstart: DAG隐私计算任务编排系统

**Feature**: DAG任务编排 | **Date**: 2026-01-29 | **Status**: Final

## 概述

本文档提供DAG任务编排功能的快速开发指南，帮助开发者快速上手项目结构、关键组件和开发流程。

---

## 项目结构导航

### 核心目录

```
src/
├── components/
│   ├── Flow/                    # 画布核心组件
│   │   ├── FlowCanvas.vue       # ⭐ 主画布（处理拖拽、连线）
│   │   ├── FlowSidebar.vue      # ⭐ 资源面板（新增：模型/算力/本地任务）
│   │   └── FlowDetailPanel.vue  # ⭐ 详情面板（JSON预览切换）
│   ├── Nodes/                   # 节点组件
│   │   ├── ComputeTaskNode.vue  # ⭐ 新增：计算任务节点
│   │   └── OutputDataNode.vue   # ⭐ 新增：输出数据节点
│   └── Modals/                  # ⭐ 新增目录：弹窗组件
│       ├── TechPathSelector.vue
│       ├── FieldSelector.vue
│       └── EnterpriseSelector.vue
├── types/
│   └── export.ts                # ⭐ 新增：导出JSON类型
├── utils/
│   ├── dag-export.ts            # ⭐ 新增：DAG转换逻辑
│   ├── enterprise-sorter.ts     # ⭐ 新增：企业排序
│   └── mock-data.ts             # ⭐ 新增：Mock数据
└── stores/
    └── graph-store.ts           # ⭐ 新增：图状态管理
```

---

## 开发环境设置

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
# 服务运行在 http://localhost:5172
```

### 3. 类型检查

```bash
npm run build  # 包含vue-tsc类型检查
```

---

## 核心组件开发指南

### 1. 扩展FlowSidebar（左侧资源面板）

**文件**: `src/components/Flow/FlowSidebar.vue`

**需要添加的内容**:

```vue
<template>
  <div class="flow-sidebar">
    <!-- 现有：数据源分类 -->
    <SidebarCategory title="数据源">
      <SidebarItem v-for="item in DATA_SOURCE_TEMPLATES"
                    :key="item.id"
                    :item="item"
                    @dragstart="onDragStart" />
    </SidebarCategory>

    <!-- 新增：计算任务分类 -->
    <SidebarCategory title="计算任务">
      <SidebarItem label="PSI计算" :disabled="false" />
      <SidebarItem label="PIR查询" :disabled="false" />
      <SidebarItem label="MPC计算" :disabled="false" />
      <SidebarItem label="联邦学习" :disabled="true" /> <!-- 置灰 -->
    </SidebarCategory>

    <!-- 新增：计算模型分类 -->
    <SidebarCategory title="计算模型">
      <SidebarItem label="MPC模型(表达式)" />
      <SidebarItem label="MPC模型(CodeBin-V2)" />
      <SidebarItem label="MPC模型(CodeBin-V3-1)" />
      <SidebarItem label="MPC模型(CodeBin-V3-2)" />
      <SidebarItem label="MPC模型(SPDZ)" />
    </SidebarCategory>

    <!-- 新增：算力资源分类 -->
    <SidebarCategory title="算力资源">
      <SidebarItem label="TEE板卡算力" />
    </SidebarCategory>

    <!-- 新增：本地计算任务分类 -->
    <SidebarCategory title="本地计算任务">
      <SidebarItem label="本地结果处理任务" />
      <SidebarItem label="本地Query任务" :disabled="true" />
    </SidebarCategory>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { SidebarItemData } from '@/types/nodes'

// 新增：计算任务模板
const COMPUTE_TASK_TEMPLATES: SidebarItemData[] = [
  { id: 'psi', label: 'PSI计算', type: 'compute-task', disabled: false },
  { id: 'pir', label: 'PIR查询', type: 'compute-task', disabled: false },
  { id: 'mpc', label: 'MPC计算', type: 'compute-task', disabled: false },
  { id: 'fl', label: '联邦学习', type: 'compute-task', disabled: true }
]

// 新增：计算模型模板
const MODEL_TEMPLATES: SidebarItemData[] = [
  { id: 'expr', label: 'MPC模型(表达式)', type: 'model' },
  { id: 'cbv2', label: 'MPC模型(CodeBin-V2)', type: 'model' },
  // ...
]

// 拖拽处理
const onDragStart = (event: DragEvent, item: SidebarItemData) => {
  event.dataTransfer.setData('application/vueflow', JSON.stringify(item))
}
</script>
```

---

### 2. 实现TechPathSelector弹窗

**文件**: `src/components/Modals/TechPathSelector.vue`

```vue
<template>
  <Modal v-model:visible="visible" title="选择技术路径">
    <div class="tech-path-selector">
      <p>任务类型: {{ taskType }}</p>
      <div class="options">
        <label>
          <input type="radio" value="software" v-model="selectedPath" />
          软件密码学
        </label>
        <label>
          <input type="radio" value="tee" v-model="selectedPath" />
          硬件TEE
        </label>
      </div>
      <div class="preview">
        <p>最终计算类型: <strong>{{ finalComputeType }}</strong></p>
      </div>
    </div>
    <template #footer>
      <button @click="onConfirm">确认</button>
      <button @click="onCancel">取消</button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  taskType: 'PSI' | 'PIR' | 'MPC'
}>()

const emit = defineEmits<{
  confirm: [path: 'software' | 'tee']
  cancel: []
}>()

const selectedPath = ref<'software' | 'tee'>('software')
const visible = defineModel<boolean>('visible', { default: true })

const finalComputeType = computed(() => {
  const mapping = {
    PSI: { software: 'PSI', tee: 'TEE_PSI' },
    PIR: { software: 'PIR', tee: 'TEE_PIR' },
    MPC: { software: 'MPC', tee: 'TEE_MPC' }
  }
  return mapping[props.taskType][selectedPath.value]
})

const onConfirm = () => {
  emit('confirm', selectedPath.value)
  visible.value = false
}

const onCancel = () => {
  emit('cancel')
  visible.value = false
}
</script>
```

---

### 3. 扩展FlowCanvas（主画布）

**文件**: `src/components/Flow/FlowCanvas.vue`

**关键添加**:

```typescript
import { useVueFlow } from '@vue-flow/core'
import type { Node, Edge } from '@vue-flow/core'

// 拖拽释放处理
const onDrop = (event: DragEvent) => {
  const itemData = JSON.parse(
    event.dataTransfer.getData('application/vueflow')
  )
  const position = project(event)

  if (itemData.type === 'compute-task') {
    // 弹出技术路径选择
    showTechPathSelector(itemData.label).then((result) => {
      addNodes({
        id: generateId(),
        type: 'computeTask',
        position,
        data: {
          label: itemData.label,
          computeType: result.finalComputeType,
          techPath: result.path,
          inputProviders: [],
          models: [],
          computeProviders: [],
          outputs: []
        }
      })
    })
  }
}

// 连线验证
const isValidConnection = (connection: Connection) => {
  const source = getNode(connection.source)
  const target = getNode(connection.target)

  // 输出节点只能连到计算任务
  if (source?.type === 'outputData') {
    return target?.type === 'computeTask' || target?.type === 'localTask'
  }

  // 计算任务只能从数据源或输出节点接收
  if (target?.type === 'computeTask') {
    return source?.type === 'dataSource' || source?.type === 'outputData'
  }

  return true
}

onConnect(({ isValidConnection }))
```

---

### 4. 创建DAG导出转换逻辑

**文件**: `src/utils/dag-export.ts`

```typescript
import type { ExportJson, Task } from '@/types/export'

/**
 * 主转换函数
 */
export function convertDagToJson(
  nodes: Node[],
  edges: Edge[]
): ExportJson {
  // 1. 拓扑排序
  const taskOrder = topologicalSort(nodes, edges)

  // 2. 提取参与方
  const participants = extractParticipants(nodes)

  // 3. 构建任务列表
  const taskList = buildTaskList(nodes, edges, taskOrder)

  return {
    jobId: generateJobId(),
    name: 'privacy-computation-job',
    description: '',
    status: 0,
    serviceType: 0,
    createParticipantId: participants[0]?.participantId || '',
    modelType: 0,
    tlsEnable: false,
    assetDetailList: [],
    participantList: participants,
    taskList
  }
}

/**
 * 构建单个任务
 */
function buildTask(
  node: ComputeTaskNode,
  context: DagContext
): Task {
  return {
    kind: 'Task',
    taskId: node.id,
    name: node.data.label,
    taskSrcIdList: getDependencyIds(node.id, context.edges),
    isFinalTask: node.data.outputs.length > 0,
    serviceType: 0,
    computeType: node.data.computeType,
    implementation: getImplementation(node.data.computeType),
    dataProviderList: buildDataProviderList(node.data.inputProviders),
    joinConditionList: node.data.joinConditions,
    modelProviderList: buildModelProviderList(node.data.models),
    expressionList: node.data.expression
      ? [{ expressionParamList: null, expression: node.data.expression }]
      : undefined,
    computeProviderList: buildComputeProviderList(node.data.computeProviders),
    resultConsumerList: buildResultConsumerList(node.data.outputs),
    participantList: getTaskParticipants(node.data)
  }
}
```

---

### 5. 创建Mock数据

**文件**: `src/utils/mock-data.ts`

```typescript
// 企业Mock数据
export const MOCK_ENTERPRISES = [
  { id: 'org1', name: '租户一' },
  { id: 'org2', name: '租户二' }
]

// 计算模型Mock数据
export const MOCK_MODELS = [
  {
    modelId: 'model-001',
    participantId: 'org1',
    name: 'MUL-乘法运算',
    type: 'CodeBin-V2'
  }
]

// 算力资源Mock数据
export const MOCK_COMPUTES = [
  {
    groupId: 'group-001',
    participantId: 'org1',
    cardSerial: 'BCA253010012'
  }
]

// Mock API工厂
export function createMockApi() {
  return {
    async getEnterprises() {
      return Promise.resolve(MOCK_ENTERPRISES)
    },
    async getModels(participantId: string) {
      return Promise.resolve(
        MOCK_MODELS.filter(m => m.participantId === participantId)
      )
    },
    async getComputes(participantId: string) {
      return Promise.resolve(
        MOCK_COMPUTES.filter(c => c.participantId === participantId)
      )
    }
  }
}
```

---

## 开发检查清单

### Phase 1: 基础节点支持

- [ ] FlowSidebar添加"计算任务"、"计算模型"、"算力资源"、"本地计算任务"分类
- [ ] 实现TechPathSelector弹窗
- [ ] 实现ComputeTaskNode组件
- [ ] 实现ModelNode组件
- [ ] 实现ComputeResourceNode组件
- [ ] 实现OutputDataNode组件

### Phase 2: 拖拽与连线

- [ ] 拖拽计算任务到画布，弹出技术路径选择
- [ ] 技术路径选择后创建计算任务节点
- [ ] 拖拽计算模型到计算任务节点
- [ ] 拖拽算力资源到计算任务节点
- [ ] 连线验证：输出节点→计算任务
- [ ] 连线验证：模型→计算任务
- [ ] 连线验证：算力→计算任务

### Phase 3: 弹窗与配置

- [ ] 实现FieldSelector弹窗（字段选择、join字段、别名）
- [ ] 实现EnterpriseSelector弹窗（带优先级排序）
- [ ] 实现ModelSelector弹窗
- [ ] 实现ComputeSelector弹窗
- [ ] 实现OutputConfig弹窗

### Phase 4: 详情面板

- [ ] FlowDetailPanel支持可折叠sections
- [ ] 输入数据section展示和编辑
- [ ] 计算模型section展示和编辑
- [ ] 算力资源section展示和编辑
- [ ] 输出数据section展示和编辑
- [ ] JSON预览切换按钮
- [ ] 实时JSON预览

### Phase 5: 导出功能

- [ ] 实现dag-export.ts转换逻辑
- [ ] 添加导出按钮到FlowHeader
- [ ] 验证导出JSON格式符合样例

### Phase 6: Mock数据

- [ ] 创建enterprises.ts Mock
- [ ] 创建models.ts Mock
- [ ] 创建computes.ts Mock
- [ ] 创建fields.ts Mock

### Phase 7: 测试

- [ ] Playwright测试：拖拽计算任务
- [ ] Playwright测试：配置输入数据
- [ ] Playwright测试：配置模型
- [ ] Playwright测试：导出功能
- [ ] 边缘情况测试

---

## 常见问题

### Q: 如何添加新的计算任务类型？

1. 在`src/utils/node-templates.ts`添加新模板
2. 在`src/types/nodes.ts`添加`ComputeType`类型
3. 更新`FlowSidebar.vue`添加新选项
4. 更新导出映射逻辑

### Q: 如何修改企业排序规则？

修改`src/utils/enterprise-sorter.ts`中的`RESOURCE_WEIGHTS`映射。

### Q: 如何添加新的Mock数据？

编辑`src/utils/mock-data.ts`中的对应数组。

---

## 下一步

1. 实现Phase 1：基础节点支持
2. 运行`npm run dev`启动开发服务器
3. 访问 http://localhost:5172 验证功能
4. 运行`npm run build`进行类型检查

需要帮助？查看 [research.md](./research.md) 了解技术决策细节。
