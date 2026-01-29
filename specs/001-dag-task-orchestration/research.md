# Research: DAG隐私计算任务编排系统

**Feature**: DAG任务编排 | **Date**: 2026-01-29 | **Status**: Final

## Overview

本文档记录DAG任务编排功能的关键技术决策、最佳实践研究，以及选型理由。

---

## Decision 1: 代码编辑器选择

### Decision: Monaco Editor

### Rationale

- **VS Code同源**: Monaco是VS Code的编辑器核心，Python语法支持成熟
- **内置补全**: 提供完善的API实现变量自动补全（`monaco.languages.registerCompletionItemProvider`）
- **类型提示**: 支持Python的类型提示和参数签名帮助
- **社区支持**: Vue生态有成熟的monaco-editor-vue封装组件

### Alternatives Considered

| 方案 | 优势 | 劣势 | 结论 |
|------|------|------|------|
| Monaco Editor | VS Code同源、功能强大 | 包体积较大(~2MB) | ✅ 选择 - 功能需求优先 |
| CodeMirror | 轻量(~200KB)、可定制 | Python支持需额外配置 | ❌ 功能需额外开发 |
| TextArea + 原生补全 | 零依赖 | 无语法高亮、补全功能弱 | ❌ 不满足需求 |

### Implementation Notes

```bash
npm install monaco-editor monaco-editor-vue
```

```typescript
// 注册Python语言
import * as monaco from 'monaco-editor'

// 自定义补全提供者
monaco.languages.registerCompletionItemProvider('python', {
  provideCompletionItems: (model, position) => {
    // 从上下文提取变量：participantId.assetName.columnName
    const variables = extractInputDataColumns()
    return {
      suggestions: variables.map(v => ({
        label: v.fullName,
        kind: monaco.languages.CompletionItemKind.Variable,
        detail: `${v.participantId}.${v.assetName}.${v.columnName}`,
        insertText: v.fullName
      }))
    }
  }
})
```

---

## Decision 2: 状态管理方案

### Decision: Vue Composables + reactive()

### Rationale

- **Vue 3原生**: 无需额外依赖，Composition API + reactive()足够管理图状态
- **轻量级**: 图状态主要在FlowCanvas内部管理，不需要全局状态
- **响应式**: reactive()自动处理嵌套对象的响应式更新
- **宪章一致**: 符合宪章"前端自治"原则，最小化依赖

### Alternatives Considered

| 方案 | 优势 | 劣势 | 结论 |
|------|------|------|------|
| Composables + reactive | 零依赖、Vue 3原生 | 缺少时间旅行调试 | ✅ 选择 - 满足需求 |
| Pinia | Vue 3官方、DevTools | 增加依赖、学习成本 | ❌ 过度设计 |
| Zustand | 轻量、简洁 | 非Vue生态 | ❌ 生态不一致 |

### Implementation Pattern

```typescript
// composables/useGraphState.ts
import { reactive, computed } from 'vue'

export interface GraphState {
  nodes: Node[]
  edges: Edge[]
  selectedNodeId: string | null
  detailViewMode: 'node-detail' | 'json-preview'
}

export function useGraphState() {
  const state = reactive<GraphState>({
    nodes: [],
    edges: [],
    selectedNodeId: null,
    detailViewMode: 'node-detail'
  })

  // Actions
  const addNode = (node: Node) => state.nodes.push(node)
  const removeNode = (id: string) => {
    state.nodes = state.nodes.filter(n => n.id !== id)
    // 级联删除关联edges和output nodes
    cleanupAssociatedEdges(id)
    cleanupOutputNodes(id)
  }

  // Computed
  const selectedNode = computed(() =>
    state.nodes.find(n => n.id === state.selectedNodeId)
  )

  const exportJson = computed(() =>
    convertDagToJson(state.nodes, state.edges)
  )

  return {
    state,
    addNode,
    removeNode,
    selectedNode,
    exportJson
  }
}
```

---

## Decision 3: 企业排序算法

### Decision: 加权排序系统

### Rationale

- **优先级明确**: 数据资源 > 模型 > 算力 > 其他，符合业务逻辑
- **可扩展**: 新增资源类型时只需扩展权重映射
- **性能稳定**: O(n log n)排序，企业数量通常<100

### Implementation

```typescript
// utils/enterprise-sorter.ts

export enum ResourceType {
  DATA = 'data',       // 权重 3
  MODEL = 'model',     // 权重 2
  COMPUTE = 'compute',  // 权重 1
  OTHER = 'other'       // 权重 0
}

const RESOURCE_WEIGHTS: Record<ResourceType, number> = {
  [ResourceType.DATA]: 3,
  [ResourceType.MODEL]: 2,
  [ResourceType.COMPUTE]: 1,
  [ResourceType.OTHER]: 0
}

export interface EnterpriseWithResource {
  id: string
  name: string
  resourceType: ResourceType
}

export function sortEnterprises(
  enterprises: EnterpriseWithResource[]
): EnterpriseWithResource[] {
  return [...enterprises].sort((a, b) => {
    // 1. 按资源类型权重降序
    const weightDiff = RESOURCE_WEIGHTS[b.resourceType] - RESOURCE_WEIGHTS[a.resourceType]
    if (weightDiff !== 0) return weightDiff

    // 2. 同类型内按名称字母序
    return a.name.localeCompare(b.name, 'zh-CN')
  })
}

// 使用示例
const availableEnterprises = [
  { id: 'org1', name: '租户一', resourceType: ResourceType.DATA },
  { id: 'org2', name: '租户二', resourceType: ResourceType.MODEL },
  { id: 'org3', name: '租户三', resourceType: RESOURCE.OTHER }
]
// 结果: org1 (data) > org2 (model) > org3 (other)
```

---

## Decision 4: DAG到JSON转换模块设计

### Decision: 纯函数转换器 + 类型安全

### Rationale

- **独立测试**: 纯函数易于单元测试，不依赖Vue组件
- **类型安全**: TypeScript interfaces确保输出格式正确
- **可维护**: 转换逻辑集中，后续修改JSON格式时只需修改一处
- **宪章符合**: FR-049要求"独立、清晰、隔离的导出转换逻辑模块"

### Architecture

```
┌─────────────────┐
│  Vue Components │  (调用者)
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│   dag-export.ts (主转换器)      │
│                                 │
│  function convertDAGToJson(     │
│    nodes: Node[],               │
│    edges: Edge[]                │
│  ): ExportJson                  │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  子转换器 (模块化)               │
│                                 │
│  ├─ extractParticipants()       │
│  ├─ extractTaskList()           │
│  ├─ buildDataProviderList()     │
│  ├─ buildJoinConditions()       │
│  ├─ buildModelProviderList()    │
│  ├─ buildComputeProviderList()  │
│  └─ buildResultConsumerList()   │
└─────────────────────────────────┘
```

### Implementation Outline

```typescript
// utils/dag-export.ts

import type { ExportJson, Task, ComputeType } from '@/types/export'

/**
 * 主转换函数：DAG图 -> 标准JSON
 *
 * @param nodes - 所有节点（包括计算任务、模型、算力、输出节点）
 * @param edges - 所有连线
 * @returns 符合样例格式的导出JSON
 */
export function convertDagToJson(
  nodes: Node[],
  edges: Edge[]
): ExportJson {
  // 1. 拓扑排序确定任务执行顺序
  const taskIds = topologicalSort(nodes, edges)

  // 2. 提取所有参与方企业
  const participants = extractParticipants(nodes, edges)

  // 3. 构建任务列表
  const taskList = buildTaskList(nodes, edges, taskIds)

  // 4. 构建资产详情列表（用于数据源字段信息）
  const assetDetailList = buildAssetDetailList(nodes)

  return {
    jobId: generateJobId(),
    name: 'privacy-computation-job',
    description: '',
    status: 0,
    serviceType: 0,
    createParticipantId: participants[0]?.participantId || '',
    modelType: 0,
    tlsEnable: false,
    assetDetailList,
    participantList: participants,
    taskList
  }
}

// 辅助函数：计算类型映射
function getComputeType(taskType: string, techPath: string): ComputeType {
  const mapping = {
    'PSI': { 'software': 'PSI', 'tee': 'TEE_PSI' },
    'PIR': { 'software': 'PIR', 'tee': 'TEE_PIR' },
    'MPC': { 'software': 'MPC', 'tee': 'TEE_MPC' },
    'CONCAT': { 'software': 'CONCAT', 'tee': 'CONCAT' }
  }
  return mapping[taskType]?.[techPath] || 'MPC'
}
```

---

## Decision 5: Mock数据结构设计

### Decision: 类型对齐 + 工厂函数

### Rationale

- **结构一致**: Mock接口返回结构与真实后端接口完全一致
- **易于切换**: 后端接口就绪后只需更改导入路径
- **类型验证**: 使用TypeScript确保编译时类型检查

### Mock Data Structure

```typescript
// tests/mocks/enterprises.ts

export interface Enterprise {
  participantId: string
  entityName: string
}

export const MOCK_ENTERPRISES: Enterprise[] = [
  { participantId: 'org1', entityName: '租户一' },
  { participantId: 'org2', entityName: '租户二' },
  { participantId: 'org3', entityName: '租户三' }
]

// Mock API工厂函数
export function createMockEnterpriseApi() {
  return {
    async listAll(): Promise<Enterprise[]> {
      return Promise.resolve(MOCK_ENTERPRISES)
    },

    async getByParticipantId(id: string): Promise<Enterprise | null> {
      const enterprise = MOCK_ENTERPRISES.find(e => e.participantId === id)
      return Promise.resolve(enterprise || null)
    }
  }
}

// tests/mocks/models.ts
export interface ComputeModel {
  modelId: string
  participantId: string
  name: string
  type: 'CodeBin-V2' | 'CodeBin-V3-1' | 'CodeBin-V3-2' | 'SPDZ'
  version: string
  description: string
}

export const MOCK_MODELS: ComputeModel[] = [
  {
    modelId: 'model-001',
    participantId: 'org1',
    name: 'MUL-乘法运算',
    type: 'CodeBin-V2',
    version: '1.0.0',
    description: '支持两数相乘的MPC模型'
  },
  // ... 更多模型
]

// tests/mocks/computes.ts
export interface ComputeResource {
  groupId: string
  participantId: string
  groupName: string
  nodeAddress: string
  cardSerial: string
  cardModel: string
}

export const MOCK_COMPUTES: ComputeResource[] = [
  {
    groupId: 'group-001',
    participantId: 'org1',
    groupName: 'org1',
    nodeAddress: '192.168.1.100',
    cardSerial: 'BCA253010012',
    cardModel: 'ChainMaker 510'
  }
]
```

---

## Best Practices: Vue Flow集成

### 节点数据管理

```typescript
// 使用@vue-flow/core的useVueFlow hook
import { useVueFlow, useNodeData } from '@vue-flow/core'

export function useFlowCanvas() {
  const { nodes, edges, addNodes, addEdges, onConnect } = useVueFlow()

  // 拖拽释放处理
  const onDrop = (event: DragEvent) => {
    const nodeData = JSON.parse(event.dataTransfer.getData('application/vueflow'))
    const position = project(event.clientX, event.clientY)

    if (nodeData.type === 'compute-task') {
      // 弹出技术路径选择窗口
      showTechPathSelector().then(techPath => {
        addNodes({
          id: generateId(),
          type: 'computeTask',
          position,
          data: {
            label: nodeData.label,
            computeType: nodeData.computeType,
            techPath,
            // 初始化空配置
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
    const sourceNode = nodes.value.find(n => n.id === connection.source)
    const targetNode = nodes.value.find(n => n.id === connection.target)

    // 输出节点只能连到计算任务或本地任务
    if (sourceNode?.type === 'outputData') {
      return ['computeTask', 'localTask'].includes(targetNode?.type)
    }

    // 计算任务只能从数据源或输出节点接收输入
    if (targetNode?.type === 'computeTask') {
      return ['dataSource', 'outputData'].includes(sourceNode?.type)
    }

    return true
  }

  return { onDrop, onConnect, isValidConnection }
}
```

---

## Best Practices: 变量补全实现

```typescript
// composables/useCodeCompletion.ts

import * as monaco from 'monaco-editor'
import { computed } from 'vue'

export function useCodeCompletion(inputDataColumns: Ref<Column[]>) {

  const completionProvider = monaco.languages.registerCompletionItemProvider('python', {
    provideCompletionItems: (model, position) => {
      const wordUntil = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: wordUntil.startColumn,
        endColumn: wordUntil.endColumn
      }

      // 提取已输入的前缀
      const prefix = model.getValueInRange(range)

      // 生成建议列表
      const suggestions = inputDataColumns.value
        .filter(col => col.fullName.startsWith(prefix))
        .map(col => ({
          label: col.fullName,
          kind: monaco.languages.CompletionItemKind.Variable,
          detail: `${col.participantId}.${col.assetName}.${col.columnName} (${col.type})`,
          documentation: `输入数据列\n来源: ${col.participantId}.${col.assetName}`,
          insertText: col.fullName,
          range
        }))

      return { suggestions }
    }
  })

  // 清理
  onUnmounted(() => {
    completionProvider.dispose()
  })

  return { completionProvider }
}
```

---

## Summary

| 决策点 | 选择 | 核心理由 |
|--------|------|----------|
| 代码编辑器 | Monaco Editor | VS Code同源、Python支持完善 |
| 状态管理 | Composables + reactive | Vue 3原生、零依赖 |
| 企业排序 | 加权排序系统 | 业务逻辑清晰、可扩展 |
| DAG转换 | 纯函数转换器 | 独立测试、易维护 |
| Mock数据 | 类型对齐工厂函数 | 结构一致、易于切换 |

**下一步**: Phase 1 - 设计数据模型和API契约
