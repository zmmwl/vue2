# Quickstart Guide: 数据资产选择与展示

**Feature Branch**: `001-data-asset-select` | **Date**: 2026-01-22
**Status**: Complete | Phase 1 Output

## 快速开始

本文档提供数据资产选择与展示功能的快速上手指南。

---

## 开发环境设置

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

开发服务器将运行在 `http://localhost:5172`

### 3. 运行测试

```bash
# 运行 E2E 测试
npm run test

# 运行测试（带 UI）
npm run test:ui

# 运行测试（有头模式）
npm run test:headed
```

### 4. 构建项目

```bash
npm run build
```

---

## 功能概述

数据资产选择与展示功能包含以下核心能力：

1. **拖放节点后自动弹出选择对话框** - 拖拽数据源节点到画布释放后，自动弹出数据资产选择对话框
2. **多步骤向导选择** - 通过"选择企业 → 选择资产 → 选择字段"三步骤完成配置
3. **右侧详情面板** - 点击已配置节点，在右侧面板显示数据资产详情
4. **导出/导入支持** - 导出的 JSON 包含完整数据资产信息，支持导入恢复

---

## 核心交互流程

### 场景 1: 配置数据源节点

```
1. 从左侧面板拖拽数据源节点到画布
   ↓
2. 释放鼠标，自动弹出数据资产选择对话框
   ↓
3. 步骤 1/3: 选择企业（支持搜索）
   ↓
4. 步骤 2/3: 选择数据资产（支持搜索）
   ↓
5. 步骤 3/3: 选择字段（支持搜索和虚拟滚动）
   ↓
6. 点击确认，完成配置
   ↓
7. 节点标题旁显示已选资产名称
```

### 场景 2: 查看数据资产详情

```
1. 点击画布上已配置的数据源节点
   ↓
2. 右侧详情面板显示数据资产信息
   ↓
3. 查看基本信息（企业名称、资产名称、描述等）
   ↓
4. 查看已选字段列表
   ↓
5. 点击"重新配置"按钮可修改选择
```

### 场景 3: 导出任务图

```
1. 点击顶部工具栏的"导出"按钮
   ↓
2. 系统验证节点配置状态
   ↓
3. 如有未配置节点，弹出警告提示
   ↓
4. 导出 JSON 文件（包含完整数据资产信息）
```

---

## 组件使用指南

### AssetSelectorDialog（数据资产选择对话框）

**位置**: `src/components/Dialogs/AssetSelectorDialog.vue`

**Props**:
```typescript
interface Props {
  modelValue: boolean        // 对话框显示状态（v-model）
  nodeId?: string           // 节点 ID（编辑模式）
}
```

**Emits**:
```typescript
interface Emits {
  'update:modelValue': (value: boolean) => void
  'confirm': (assetInfo: AssetInfo, selectedFields: string[]) => void
  'cancel': () => void
}
```

**使用示例**:
```vue
<template>
  <AssetSelectorDialog
    v-model="showDialog"
    :node-id="selectedNodeId"
    @confirm="handleAssetSelected"
    @cancel="handleDialogCancel"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AssetSelectorDialog from '@/components/Dialogs/AssetSelectorDialog.vue'
import type { AssetInfo } from '@/types/nodes'

const showDialog = ref(false)
const selectedNodeId = ref<string>()

const handleAssetSelected = (assetInfo: AssetInfo, selectedFields: string[]) => {
  console.log('Selected asset:', assetInfo.assetName)
  console.log('Selected fields:', selectedFields)
}

const handleDialogCancel = () => {
  // 删除节点（取消配置）
}
</script>
```

---

### FlowDetailPanel（右侧详情面板）

**位置**: `src/components/Flow/FlowDetailPanel.vue`

**Props**:
```typescript
interface Props {
  node?: Node<NodeData>  // 当前选中的节点
}
```

**使用示例**:
```vue
<template>
  <div class="flow-editor">
    <FlowCanvas @node-click="handleNodeClick" />
    <FlowDetailPanel :node="selectedNode" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Node } from '@vue-flow/core'
import type { NodeData } from '@/types/nodes'

const selectedNode = ref<Node<NodeData>>()

const handleNodeClick = (node: Node<NodeData>) => {
  selectedNode.value = node
}
</script>
```

---

### VirtualScrollList（虚拟滚动列表）

**位置**: `src/components/Common/VirtualScrollList.vue`

**Props**:
```typescript
interface Props {
  items: any[]              // 列表数据
  itemHeight: number        // 单项高度（px）
  containerHeight: number   // 容器高度（px）
  searchQuery?: string      // 搜索关键词（可选）
  searchField?: string      // 搜索字段（可选）
}
```

**使用示例**:
```vue
<template>
  <VirtualScrollList
    :items="fieldList"
    :item-height="40"
    :container-height="400"
    :search-query="searchQuery"
    search-field="name"
  >
    <template #default="{ item, index }">
      <div class="field-item">
        <span>{{ index + 1 }}. {{ item.name }}</span>
        <span class="field-type">{{ item.dataType }}</span>
      </div>
    </template>
  </VirtualScrollList>
</template>
```

---

## 服务层使用指南

### assetApi（数据资产 API 服务）

**位置**: `src/services/assetApi.ts`

**方法**:
```typescript
class AssetApiService {
  // 获取企业列表
  getEnterpriseList(): Promise<GetEnterpriseListResponse>

  // 获取数据资产详情
  getAsset(assetId: string): Promise<GetAssetResponse>
}
```

**使用示例**:
```typescript
import { assetApi } from '@/services/assetApi'

// 获取企业列表
const { data: enterprises } = await assetApi.getEnterpriseList()

// 获取数据资产详情
const { data: assetInfo } = await assetApi.getAsset('asset_001')
```

---

### assetCache（数据资产缓存服务）

**位置**: `src/services/assetCache.ts`

**方法**:
```typescript
class AssetCacheService {
  // 获取缓存
  get(assetId: string): AssetInfo | undefined

  // 设置缓存
  set(assetId: string, assetInfo: AssetInfo): void

  // 检查缓存是否存在
  has(assetId: string): boolean

  // 从节点数据重建缓存
  rebuildFromNodes(nodes: Node[]): void

  // 清空缓存
  clear(): void
}
```

**使用示例**:
```typescript
import { assetCache } from '@/services/assetCache'

// 检查缓存
if (assetCache.has('asset_001')) {
  // 从缓存读取
  const assetInfo = assetCache.get('asset_001')
} else {
  // 调用 API 并缓存
  const { data: assetInfo } = await assetApi.getAsset('asset_001')
  assetCache.set('asset_001', assetInfo)
}

// 从节点数据重建缓存（导入时）
assetCache.rebuildFromNodes(nodes.value)
```

---

## 类型定义

### 核心类型（src/types/nodes.ts 扩展）

```typescript
// 数据资产完整信息
interface AssetInfo {
  assetId: string
  assetNumber: string
  assetName: string
  assetEnName?: string
  holderCompany: string
  participantId: string
  entityName: string
  intro?: string
  scale?: string
  cycle?: string
  timeSpan?: string
  dataInfo: DataInfo
}

// 数据集信息
interface DataInfo {
  databaseName: string
  tableName: string
  fieldList: FieldInfo[]
}

// 字段信息
interface FieldInfo {
  name: string
  dataType: string
  dataLength?: number
  description?: string
  isPrimaryKey?: boolean
  privacyQuery?: boolean
}

// 扩展节点数据
interface NodeData {
  // ... 现有字段 ...
  assetInfo?: AssetInfo         // 数据资产完整信息
  selectedFields?: string[]     // 已选字段名称列表
}
```

---

## 样式变量

SCSS 变量定义在 `src/assets/styles/variables.scss`：

```scss
// 数据资产选择对话框
$asset-dialog-width: 600px;
$asset-dialog-max-height: 80vh;

// 步骤指示器
$step-indicator-size: 32px;
$step-indicator-active-color: #1890ff;
$step-indicator-inactive-color: #d9d9d9;

// 字段列表
$field-item-height: 40px;
$field-item-hover-bg: #f5f5f5;
$field-item-selected-bg: #e6f7ff;

// 详情面板
$detail-panel-width: 360px;
$detail-panel-bg: #fafafa;

// 节点状态
$node-unconfigured-color: #8c8c8c;
$node-configured-color: #52c41a;
```

---

## 常见问题

### Q1: 如何启用 Mock 模式？

在 `.env` 文件中设置：

```bash
VITE_USE_MOCK=true
```

或在代码中使用：

```typescript
import { assetApi } from '@/services/assetApi'

// Mock 模式
const mockMode = import.meta.env.VITE_USE_MOCK === 'true'
```

### Q2: 如何处理 API 错误？

所有 API 错误会自动分类处理：
- **网络错误/超时**: 自动重试 2-3 次
- **认证错误 (401)**: 显示"登录已过期"提示
- **权限错误 (403)**: 显示"无权限访问"提示
- **资源不存在 (404)**: 显示"资源不存在"提示

监听错误事件：

```typescript
import { assetApi } from '@/services/assetApi'

try {
  const { data } = await assetApi.getAsset('asset_001')
} catch (error) {
  // 错误已自动处理，这里可以做额外记录
  console.error('Asset fetch failed:', error)
}
```

### Q3: 如何测试大规模字段场景？

Mock 数据中包含大规模字段测试数据（500 个字段）：

```typescript
// tests/mocks/assetTestData.ts
export const largeFieldList: FieldInfo[] = generateMockFields(500)

function generateMockFields(count: number): FieldInfo[] {
  return Array.from({ length: count }, (_, i) => ({
    name: `field_${i + 1}`,
    dataType: i % 3 === 0 ? 'VARCHAR' : i % 3 === 1 ? 'INT' : 'DATETIME',
    dataLength: i % 3 === 0 ? 64 : undefined,
    description: `字段 ${i + 1} 的描述`,
    isPrimaryKey: i === 0,
    privacyQuery: false
  }))
}
```

### Q4: 如何自定义对话框样式？

覆盖 SCSS 变量：

```scss
// 在你的组件样式中
.asset-selector-dialog {
  --dialog-width: 800px;  // 自定义宽度
}
```

---

## 测试指南

### E2E 测试示例

```typescript
// tests/e2e/asset-selection.spec.ts
import { test, expect } from '@playwright/test'

test.describe('数据资产选择', () => {
  test('应该能够完成完整的选择流程', async ({ page }) => {
    await page.goto('/')

    // 1. 拖拽数据源节点到画布
    await page.dragAndDrop(
      '[data-testid="data-source-node"]',
      '[data-testid="flow-canvas"]'
    )

    // 2. 验证对话框弹出
    await expect(page.locator('.asset-selector-dialog')).toBeVisible()

    // 3. 选择企业
    await page.click('text=某某企业')
    await page.click('button:has-text("下一步")')

    // 4. 选择数据资产
    await page.click('text=用户行为数据')
    await page.click('button:has-text("下一步")')

    // 5. 选择字段
    await page.check('.field-item input[value="user_id"]')
    await page.check('.field-item input[value="action_time"]')
    await page.click('button:has-text("确认")')

    // 6. 验证节点显示资产名称
    await expect(page.locator('.data-source-node')).toContainText('用户行为数据')
  })

  test('应该能够查看数据资产详情', async ({ page }) => {
    // ... 先配置一个数据源节点 ...

    // 点击节点
    await page.click('.data-source-node')

    // 验证详情面板显示
    await expect(page.locator('.detail-panel')).toBeVisible()
    await expect(page.locator('.detail-panel')).toContainText('用户行为数据')
    await expect(page.locator('.detail-panel')).toContainText('user_id')
  })
})
```

---

## 下一步

1. 阅读 [data-model.md](./data-model.md) 了解数据模型设计
2. 阅读 [contracts/api-contract.md](./contracts/api-contract.md) 了解 API 契约
3. 运行 `/speckit.tasks` 生成详细的实施任务列表

---

**Phase 1 Complete**: 快速开始指南已完成，提供组件使用、服务调用、类型定义和测试示例。
