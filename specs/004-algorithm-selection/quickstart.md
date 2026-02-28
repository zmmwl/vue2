# Quick Start: 算法选择功能

**Feature**: 004-algorithm-selection
**Date**: 2026-02-28

## 概述

本文档提供算法选择功能的快速开发指南，帮助开发者快速理解和实现该功能。

## 核心概念

### 算法 (Algorithm)

算法是隐私计算任务的执行实现。每种任务类型（PSI/PIR/MPC/FL）都有对应的算法实现，区分软件版和TEE版。

```
任务类型 (computeType) ←→ 算法类型 (type)
     MPC        ←→     MPC / TEE_MPC
     PSI        ←→     PSI / TEE_PSI
     PIR        ←→     PIR / TEE_PIR
     FL         ←→     FL / TEE_FL
```

### 参数模板 (ParamTemplate)

参数模板定义算法执行时需要的附加参数。每个算法可以定义0-N个参数，参数有类型和验证规则。

### 任务算法配置 (TaskAlgorithmConfig)

存储在任务节点中，记录用户选择的算法和填写的参数值。

## 开发环境设置

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行测试
npm run test
```

## 文件结构

```
src/
├── types/
│   └── algorithm.ts           # 算法类型定义
├── services/
│   └── algorithmService.ts    # 算法服务
├── utils/
│   └── algorithm-mock-data.ts # Mock数据
├── composables/
│   └── useAlgorithmState.ts   # 状态管理
├── views/
│   └── AlgorithmManager.vue   # 管理页面
└── components/Algorithm/
    ├── AlgorithmList.vue       # 列表组件
    ├── AlgorithmForm.vue       # 注册表单
    ├── AlgorithmSelector.vue   # 选择组件
    ├── ParamTemplateEditor.vue # 模板编辑器
    └── DynamicParamForm.vue    # 动态表单
```

## 实现步骤

### Step 1: 类型定义

```typescript
// src/types/algorithm.ts
export enum AlgorithmType {
  PSI = 'PSI',
  TEE_PSI = 'TEE_PSI',
  PIR = 'PIR',
  TEE_PIR = 'TEE_PIR',
  MPC = 'MPC',
  TEE_MPC = 'TEE_MPC',
  FL = 'FL',
  TEE_FL = 'TEE_FL'
}

export interface Algorithm {
  id: string
  name: string
  nameEn: string
  version: string
  type: AlgorithmType
  paramTemplate: AlgorithmParamTemplate[]
  createdAt: number
}
```

### Step 2: Mock服务

```typescript
// src/services/algorithmService.ts
class AlgorithmService {
  private cache = new Map<string, Algorithm>()

  async getList(type?: AlgorithmType): Promise<Algorithm[]> {
    // 实现获取列表逻辑
  }

  async getDefault(type: AlgorithmType): Promise<Algorithm | null> {
    // 返回创建时间最新的算法
  }

  async create(data: CreateAlgorithmInput): Promise<Algorithm> {
    // 生成ID: nameEn-version
    // 设置createdAt时间戳
  }
}

export const algorithmService = new AlgorithmService()
```

### Step 3: 状态管理

```typescript
// src/composables/useAlgorithmState.ts
export function useAlgorithmState() {
  const algorithms = ref<Algorithm[]>([])
  const loading = ref(false)

  async function loadAlgorithms(type?: AlgorithmType) {
    loading.value = true
    algorithms.value = await algorithmService.getList(type)
    loading.value = false
  }

  return { algorithms, loading, loadAlgorithms }
}
```

### Step 4: 集成到任务节点

```typescript
// 在 FlowDetailPanel.vue 中
<AlgorithmSelector
  v-model="taskData.algorithmConfig"
  :compute-type="taskData.computeType"
  @change="handleAlgorithmChange"
/>

<DynamicParamForm
  v-if="selectedAlgorithm?.paramTemplate?.length"
  v-model="taskData.algorithmConfig.algorithmParams"
  :template="selectedAlgorithm.paramTemplate"
/>
```

### Step 5: 扩展导出逻辑

```typescript
// 在 dag-export.ts 中
function exportTask(task: ComputeTaskNode): TaskExportData {
  return {
    ...existingFields,
    algorithmId: task.algorithmConfig?.algorithmId,
    algorithmName: task.algorithmConfig?.algorithmName,
    algorithmVersion: task.algorithmConfig?.algorithmVersion,
    algorithmParams: task.algorithmConfig?.algorithmParams || {}
  }
}
```

## 关键交互流程

### 1. 拖拽任务节点

```
用户拖拽MPC任务 → 创建节点 → 调用getDefaultAlgorithm('MPC')
→ 自动填充algorithmConfig → 显示算法信息
```

### 2. 手动选择算法

```
用户点击算法选择 → 调用getAlgorithmsByType('MPC')
→ 显示算法列表 → 用户选择 → 清空algorithmParams
→ 根据新模板生成表单
```

### 3. 填写参数

```
用户填写表单 → 实时验证 → 更新algorithmParams
→ 导出时包含在JSON中
```

## 测试要点

### 单元测试

- [ ] 算法ID生成逻辑
- [ ] 默认算法选择逻辑（创建时间最新）
- [ ] 参数验证规则

### E2E测试

```typescript
// tests/e2e/algorithm.spec.ts
test('拖拽MPC任务自动选择默认算法', async ({ page }) => {
  await page.dragAndDrop('[data-testid=palette-node-mpc]', '.vue-flow')
  await expect(page.locator('.algorithm-name')).toBeVisible()
})

test('切换算法清空参数值', async ({ page }) => {
  // 填写参数
  // 切换算法
  // 验证参数已清空
})
```

## 常见问题

### Q: 算法类型与任务类型如何匹配？

A: 任务节点的 `computeType` 与算法的 `type` 一一对应：
- `computeType: 'MPC'` → `type: AlgorithmType.MPC`
- `computeType: 'TEE_MPC'` → `type: AlgorithmType.TEE_MPC`

### Q: 如何处理没有可用算法的情况？

A: 节点仍可创建，`algorithmConfig` 为空，显示"暂无可用算法"提示。

### Q: 参数模板支持嵌套结构吗？

A: 支持。使用 `JSON` 类型参数可以定义复杂的嵌套结构。

## 参考文档

- [spec.md](./spec.md) - 功能规格说明
- [data-model.md](./data-model.md) - 数据模型定义
- [contracts/algorithm-api.md](./contracts/algorithm-api.md) - API接口契约
