# Data Model: 数据资产选择与展示

**Feature Branch**: `001-data-asset-select` | **Date**: 2026-01-22
**Status**: Complete | Phase 1 Output

## Entity Relationship Diagram

```
┌─────────────────┐
│   Enterprise    │
└────────┬────────┘
         │ 1
         │ has
         │ N
┌────────▼────────┐     ┌─────────────────┐
│   AssetInfo     │────▶│ SelectedField   │
└────────┬────────┘     └─────────────────┘
         │                      │
         │ 1                    │ N
         │ selected by          │ belongs to
         │ N                    │
┌────────▼────────┐            ┌─────────────────┐
│  NodeData       │────────────┤  AssetInfo      │
│ (DataSourceNode)│  contains   │  (full info)    │
└─────────────────┘            └─────────────────┘
         │
         │ cached in
         │
┌────────▼────────┐
│  AssetCache     │
│  (Map)          │
└─────────────────┘
```

---

## Entity Definitions

### 1. Enterprise（企业）

表示数据资产的所属企业，从企业列表接口返回。

```typescript
interface Enterprise {
  participantId: string          // 平台 ID（唯一标识）
  entityName: string             // 企业名称
  enterpriseAssetList: AssetSummary[]  // 该企业的数据资产列表（简化信息）
}
```

**Relationships**:
- `Enterprise` 1:N `AssetSummary` - 一个企业有多个数据资产

**Validation Rules**:
- `participantId`: 必填，唯一标识
- `entityName`: 必填，非空字符串
- `enterpriseAssetList`: 可以为空数组（企业暂无资产）

---

### 2. AssetSummary（资产摘要）

数据资产的简化信息，用于企业列表中的展示。

```typescript
interface AssetSummary {
  assetId: string               // 数据资产唯一标识
  assetNumber: string           // 数据资产编号
  assetName: string             // 数据资产名称
  assetEnName?: string          // 数据资产英文简称（可选）
  intro?: string                // 资产描述（可选）
  holderCompany: string         // 资产所有者（企业名称）
}
```

**Relationships**:
- `AssetSummary` N:1 `Enterprise` - 多个资产属于一个企业

**Validation Rules**:
- `assetId`: 必填，唯一标识
- `assetName`: 必填，非空字符串
- `holderCompany`: 必填，非空字符串

---

### 3. AssetListItem（资产列表项）

数据资产在列表中的展示信息，从"获取企业数据资产列表"接口返回。相比 `AssetSummary`，它包含更多的展示信息（如规模、周期）。

```typescript
interface AssetListItem {
  assetId: string               // 数据资产唯一标识
  assetNumber: string           // 数据资产编号
  assetName: string             // 数据资产名称
  assetEnName?: string          // 数据资产英文简称（可选）
  intro?: string                // 资产描述（可选）
  holderCompany: string         // 资产所有者（企业名称）
  scale?: string                // 数据规模（可选）
  cycle?: string                // 更新周期（可选）
}
```

**Relationships**:
- `AssetListItem` N:1 `Enterprise` - 多个资产属于一个企业

**Validation Rules**:
- `assetId`: 必填，唯一标识
- `assetName`: 必填，非空字符串
- `holderCompany`: 必填，非空字符串

**Note**: 此接口支持分页，当企业下的数据资产数量较多时，可以分批加载。

---

### 4. AssetInfo（数据资产完整信息）

数据资产的完整信息，包含字段列表，从资产详情接口返回。

```typescript
interface AssetInfo {
  assetId: string               // 数据资产唯一标识
  assetNumber: string           // 数据资产编号
  assetName: string             // 数据资产名称
  assetEnName?: string          // 数据资产英文简称（可选）
  holderCompany: string         // 资产所有者（企业名称）
  participantId: string         // 平台 ID
  entityName: string            // 实体名称
  intro?: string                // 资产描述（可选）
  scale?: string                // 数据规模（可选）
  cycle?: string                // 更新周期（可选）
  timeSpan?: string             // 时间跨度（可选）
  dataInfo: DataInfo            // 数据集信息
}

interface DataInfo {
  databaseName: string          // 数据库名
  tableName: string             // 表名
  fieldList: FieldInfo[]        // 字段列表（所有可用字段）
}
```

**Relationships**:
- `AssetInfo` 1:N `FieldInfo` - 一个资产有多个字段

**Validation Rules**:
- `assetId`: 必填，唯一标识
- `assetName`: 必填，非空字符串
- `dataInfo.fieldList`: 必填，数组长度 >= 1

---

### 5. FieldInfo（字段信息）

数据资产中的单个字段定义。

```typescript
interface FieldInfo {
  name: string                  // 字段名称
  dataType: string              // 字段类型（VARCHAR, INT, DATETIME 等）
  dataLength?: number           // 字段长度（可选，适用于字符串类型）
  description?: string          // 字段描述（可选）
  isPrimaryKey?: boolean        // 是否主键（可选，默认 false）
  privacyQuery?: boolean        // 是否隐私查询（可选，默认 false）
}
```

**Relationships**:
- `FieldInfo` N:1 `AssetInfo` - 多个字段属于一个资产

**Validation Rules**:
- `name`: 必填，非空字符串
- `dataType`: 必填，非空字符串

---

### 6. SelectedField（已选字段）

用户从数据资产中选择的具体字段。

```typescript
interface SelectedField {
  name: string                  // 字段名称
  dataType: string              // 字段类型
  dataLength?: number           // 字段长度（可选）
  description?: string          // 字段描述（可选）
  isPrimaryKey?: boolean        // 是否主键（可选）
  privacyQuery?: boolean        // 是否隐私查询（可选）
}
```

**Note**: `SelectedField` 与 `FieldInfo` 结构相同，但语义不同。`FieldInfo` 是资产的所有可用字段，`SelectedField` 是用户选择的字段子集。

---

### 7. AssetCache（资产缓存）

内存缓存，用于避免重复调用同一资产的详情接口。

```typescript
interface AssetCache {
  // 缓存结构：Map<assetId, AssetInfo>
  get(assetId: string): AssetInfo | undefined
  set(assetId: string, assetInfo: AssetInfo): void
  has(assetId: string): boolean
  delete(assetId: string): void
  clear(): void
  rebuildFromNodes(nodes: Node[]): void  // 从节点数据重建缓存
}
```

**Lifecycle**:
- 创建：首次调用资产详情 API 后缓存
- 读取：后续选择同一资产时从缓存读取
- 失效：应用运行期间不主动失效，刷新页面后清空
- 重建：导入 JSON 时从节点数据重建

---

### 8. NodeData Extension（节点数据扩展）

扩展现有的 `NodeData` 接口，添加数据资产信息。

```typescript
// 扩展 src/types/nodes.ts 中的 NodeData 接口
interface NodeData {
  label: string
  category: NodeCategory
  taskType?: ComputeTaskType
  sourceType?: DataSourceType
  icon?: string
  color: string
  description?: string
  status?: 'idle' | 'running' | 'success' | 'error'
  config?: Record<string, any>

  // ========== 新增字段 ==========
  assetInfo?: AssetInfo         // 数据资产完整信息（已配置时存在）
  selectedFields?: string[]     // 已选字段名称列表（用于导出）
  // =================================
}
```

**State Transitions**:

| 状态 | assetInfo | selectedFields | 视觉表现 |
|-----|-----------|----------------|---------|
| 未配置 | `undefined` | `undefined` | 灰色"未配置"标签 |
| 配置中 | `undefined` | `undefined` | 对话框弹出，节点半透明 |
| 已配置 | `AssetInfo` | `string[]` | 标题旁显示资产名称 |
| 已取消 | `undefined` | `undefined` | 节点被删除 |

---

## State Machine

### 数据资产配置流程状态机

```
                    ┌──────────────┐
                    │   拖放节点    │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  节点创建    │──▶ 取消/关闭 ──▶ 删除节点
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  弹出对话框   │──▶ 取消/关闭 ──▶ 删除节点
                    └──────┬───────┘
                           │
                           ▼
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
   ┌──────────┐     ┌──────────┐     ┌──────────┐
   │选择企业  │     │选择资产  │     │选择字段  │
   └────┬─────┘     └────┬─────┘     └────┬─────┘
        │                │                │
        │ 上一步/下一步   │ 上一步/下一步  │ 上一步/确认
        └────────────────┴────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  保存配置    │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  更新节点    │
                    │  显示资产名  │
                    └──────────────┘
```

### API 调用流程状态机

```
┌──────────────┐
│  开始配置    │
└──────┬───────┘
       │
       ▼
┌──────────────────┐     ┌─────────────┐
│调用企业列表 API   │────▶│ 网络错误?   │──▶ 重试 2-3 次
└──────┬───────────┘     └─────────────┘
       │                          │ 成功
       ▼                          ▼
┌──────────────────┐     ┌──────────────────┐
│ 显示企业列表     │     │   显示错误信息   │
└──────┬───────────┘     └──────────────────┘
       │
       ▼
┌──────────────────┐     ┌─────────────┐
│ 用户选择企业     │     │ 缓存命中?   │──▶ 从缓存读取
└──────┬───────────┘     └─────────────┘
       │                          │ 否
       ▼                          ▼
┌──────────────────┐     ┌─────────────┐
│调用资产列表 API   │────▶│ 网络错误?   │──▶ 重试 2-3 次
│(GetAssetListBy    │     └─────────────┘
│ Enterprise)       │             │ 成功
└──────┬───────────┘             ▼
       │                ┌──────────────────┐
       ▼                │ 显示资产列表     │
┌──────────────────┐     └──────┬───────────┘
│ 用户选择资产     │            │
└──────┬───────────┘            ▼
       │                ┌──────────────────┐     ┌─────────────┐
       │                │调用资产详情 API   │────▶│ 网络错误?   │──▶ 重试 2-3 次
       │                └──────┬───────────┘     └─────────────┘
       │                       │ 成功
       ▼                       ▼
┌──────────────────┐     ┌──────────────────┐
│ 显示字段选择界面 │     │   显示错误信息   │
└──────┬───────────┘     └──────────────────┘
       │
       ▼
┌──────────────────┐
│ 用户选择字段     │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ 保存到节点 data  │
│ 写入缓存         │
└──────────────────┘
```

---

## Validation Rules

### 客户端验证规则

| 规则 | 字段 | 验证逻辑 | 错误提示 |
|-----|------|---------|---------|
| 必选字段 | 企业 | `selectedEnterprise !== undefined` | "请选择一个企业" |
| 必选字段 | 资产 | `selectedAsset !== undefined` | "请选择一个数据资产" |
| 必选字段 | 字段 | `selectedFields.length >= 1` | "请至少选择一个字段" |
| 唯一性 | 资产 | 单个节点只能配置一个资产 | - |
| 完整性 | 导出 | 所有节点的 assetInfo 必须完整 | "部分节点未配置数据资产，仍导出吗？" |

### 服务端验证规则（假设）

| 规则 | 字段 | 验证逻辑 | HTTP 状态码 |
|-----|------|---------|------------|
| 认证 | 所有 API | 请求头包含有效 Token | 401 |
| 权限 | 资产详情 | 用户有权限访问该资产 | 403 |
| 存在性 | 资产详情 | assetId 对应的资产存在 | 404 |
| 业务规则 | 资产详情 | 字段列表不为空 | 400 |

---

## Data Flow

### 配置流程数据流

```
┌─────────────┐
│ 用户拖放节点 │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  FlowCanvas.vue: onDrop()           │
│  - 创建节点 (nodes.value.push)       │
│  - 触发对话框弹出                    │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  AssetSelectorDialog.vue            │
│  - 步骤 1: 调用 getEnterpriseList() │
│  - 步骤 2: 调用 getAssetListByEnterprise() │
│  - 步骤 3: 调用 getAsset(assetId)   │
│  - 步骤 4: 用户选择字段              │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  保存到节点 data                     │
│  node.data.assetInfo = assetInfo     │
│  node.data.selectedFields = [...]    │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  AssetCache.set(assetId, assetInfo) │
│  - 缓存资产信息，避免重复调用        │
└─────────────────────────────────────┘
```

### 导出流程数据流

```
┌─────────────┐
│ 用户点击导出 │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  exportGraph()                      │
│  - 遍历所有节点                     │
│  - 验证 assetInfo 完整性             │
│  - 未配置节点显示警告                │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  JSON.stringify({ nodes, edges })   │
│  - 节点 data 包含完整 assetInfo      │
│  - selectedFields 包含字段名列表     │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────┐
│ 下载 JSON   │
└─────────────┘
```

### 导入流程数据流

```
┌─────────────┐
│ 用户上传 JSON│
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│  importGraph(json)                  │
│  - JSON.parse()                     │
│  - 验证 JSON 结构                   │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  恢复节点和连接线                   │
│  nodes.value = json.nodes           │
│  edges.value = json.edges           │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  AssetCache.rebuildFromNodes(nodes) │
│  - 从节点 data 提取 assetInfo        │
│  - 重建缓存，无需额外 API 调用       │
└─────────────────────────────────────┘
```

---

## Schema Definitions

### TypeScript 类型定义（新增到 src/types/nodes.ts）

```typescript
// ========== 数据资产相关类型 ==========

/** 企业信息（从企业列表接口返回） */
export interface Enterprise {
  participantId: string
  entityName: string
  enterpriseAssetList: AssetSummary[]
}

/** 资产摘要（用于企业列表中的展示） */
export interface AssetSummary {
  assetId: string
  assetNumber: string
  assetName: string
  assetEnName?: string
  intro?: string
  holderCompany: string
}

/** 资产列表项（从获取企业资产列表接口返回，支持分页） */
export interface AssetListItem {
  assetId: string
  assetNumber: string
  assetName: string
  assetEnName?: string
  intro?: string
  holderCompany: string
  scale?: string
  cycle?: string
}

/** 数据资产完整信息（从资产详情接口返回） */
export interface AssetInfo {
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

/** 数据集信息 */
export interface DataInfo {
  databaseName: string
  tableName: string
  fieldList: FieldInfo[]
}

/** 字段信息 */
export interface FieldInfo {
  name: string
  dataType: string
  dataLength?: number
  description?: string
  isPrimaryKey?: boolean
  privacyQuery?: boolean
}

/** 已选字段（与 FieldInfo 结构相同） */
export type SelectedField = FieldInfo

// 扩展现有 NodeData 接口
export interface NodeData {
  // ... 现有字段 ...
  assetInfo?: AssetInfo
  selectedFields?: string[]
}
```

---

**Phase 1 Complete**: 数据模型设计完成，所有实体、关系、验证规则已定义。
