# Research: 数据资产选择与展示

**Feature Branch**: `001-data-asset-select` | **Date**: 2026-01-22
**Status**: Complete | Phase 0 Output

## Overview

本文档记录数据资产选择与展示功能的技术调研与决策结果。所有决策基于规格说明中的澄清会话结果和技术约束。

---

## 1. 向导对话框交互模式

### Decision: 多步骤向导模式（上一步/下一步按钮）

**Rationale**:
- 用户需要依次完成三个选择：企业 → 资产 → 字段
- 分步骤设计降低认知负担，每步聚焦单一选择任务
- 支持返回修改（上一步按钮），提高容错性
- 符合业界标准模式（如安装向导、表单向导）

**Alternatives Considered**:
- **单页面长表单**: 被拒绝 - 字段数量庞大（最多 500 个），单页面会导致滚动过长，用户容易迷失
- **Tab 切换模式**: 被拒绝 - Tab 模式隐藏了步骤顺序，用户可能不清楚后续还有哪些步骤
- **多个独立对话框**: 被拒绝 - 增加开发复杂度，对话框管理困难

**Implementation Notes**:
- 使用 `currentStep` 状态跟踪当前步骤（1/3, 2/3, 3/3）
- 未完成当前步骤选择时，"下一步"按钮置灰（`:disabled`）
- 最后一步的确认按钮完成整个配置流程

---

## 2. 虚拟滚动技术选型

### Decision: 自实现虚拟滚动（基于 Vue 3 Composition API）

**Rationale**:
- 字段数量上限 500 个，传统渲染会创建 500 个 DOM 节点，影响性能
- 虚拟滚动只渲染可视区域的节点（约 20-30 个），大幅提升性能
- Vue 3 Composition API 提供响应式计算能力，易于实现
- 无需引入额外依赖（如 vue-virtual-scroller），保持依赖轻量

**Alternatives Considered**:
- **vue-virtual-scroller**: 被拒绝 - 增加额外依赖，项目已有 Vue Flow 等依赖
- **分页模式**: 被拒绝 - 用户体验差，无法快速浏览和搜索
- **原生滚动**: 被拒绝 - 500 个字段场景下性能问题明显

**Implementation Notes**:
- 监听容器 `scroll` 事件，动态计算渲染范围
- 使用 `transform: translateY()` 定位可见项
- 保留上下缓冲区（各 5 项），避免滚动时出现白屏
- 缓存已渲染项的 DOM 引用，减少重复创建

---

## 3. API 错误处理策略

### Decision: 智能分类处理策略

**Rationale**:
- 不同错误类型需要不同的处理策略
- 网络错误可能是暂时的，重试可能成功
- 认证/权限错误重试无意义，应立即提示用户
- 统一的错误处理提升用户体验

**Error Categories**:

| 错误类型 | HTTP 状态码 | 处理策略 |
|---------|------------|---------|
| 网络错误 | ERR_NETWORK, ERR_INTERNET_DISCONNECTED | 自动重试 2-3 次 |
| 超时错误 | 超时 10 秒 | 自动重试 2-3 次 |
| 认证错误 | 401 | 不重试，显示"登录已过期，请重新登录" |
| 权限错误 | 403 | 不重试，显示"无权限访问该数据资产" |
| 资源不存在 | 404 | 不重试，显示"数据资产不存在" |
| 业务错误 | 400 | 不重试，显示后端返回的具体错误信息 |
| 服务器错误 | 500, 502, 503 | 自动重试 2-3 次 |

**Implementation Notes**:
- 使用 axios interceptor 统一处理错误
- 重试间隔采用指数退避策略（1s, 2s, 4s）
- 所有错误记录到 console.error（生产环境可上报监控系统）

---

## 4. 数据资产缓存策略

### Decision: 内存 Map 缓存（生命周期：应用运行期间）

**Rationale**:
- 多个节点可能选择同一数据资产，避免重复调用 API
- 缓存完整信息（包括字段列表），导出时无需额外请求
- 内存缓存速度快，无序列化开销
- 加载 JSON 时从节点数据重建缓存，无需额外 API 调用

**Cache Structure**:
```typescript
interface AssetCache {
  // 缓存类型：Map<assetId, AssetInfo>
  get(assetId: string): AssetInfo | undefined
  set(assetId: string, assetInfo: AssetInfo): void
  has(assetId: string): boolean
  rebuildFromNodes(nodes: Node[]): void  // 从节点数据重建缓存
}
```

**Cache Invalidation**:
- 应用运行期间不主动失效（数据资产字段信息相对静态）
- 用户刷新页面后缓存清空，重新从 API 加载
- 导入 JSON 时从节点数据重建缓存

---

## 5. 日志与监控策略

### Decision: 实用级日志（console API 级别控制）

**Rationale**:
- 前端应用无法使用后端日志系统
- console API 是浏览器原生支持，无需额外依赖
- 级别控制（error/warn/info）便于过滤

**Log Levels**:

| 级别 | 用途 | 示例场景 |
|-----|------|---------|
| `console.error` | 错误 | API 调用失败、配置验证失败 |
| `console.warn` | 警告 | 节点未配置数据资产、部分导出警告 |
| `console.info` | 关键操作 | 配置完成、导出/导入成功 |
| `console.log` | 调试信息 | 当前开发阶段使用，生产环境可移除 |

**Monitored Operations**:
1. API 调用（请求 URL、响应时间、成功/失败）
2. 数据资产配置（开始配置、完成配置、取消配置）
3. 导出/导入（开始导出、导出完成、导入成功/失败）

**Implementation Notes**:
- 封装 `logger.ts` 工具，提供统一日志接口
- 生产环境可通过环境变量 `NODE_ENV=production` 禁用 `console.log`

---

## 6. 对话框取消策略

### Decision: 立即删除节点，保持画布整洁

**Rationale**:
- 未配置的数据资产节点无实际意义，保留会混淆用户
- 立即删除符合用户预期（取消 = 不想要这个节点）
- 避免画布上出现大量"未配置"节点

**Implementation Notes**:
- 用户点击取消、关闭对话框、按 ESC 键 → 触发节点删除
- 删除前不显示确认对话框（保持简洁）
- 删除后触发 Vue Flow 的 `onNodesChange` 事件，清理相关连接线

---

## 7. 节点配置状态展示

### Decision: 节点标题旁显示已选资产名称

**Rationale**:
- 用户需要在画布上快速识别已配置的节点
- 资产名称是唯一的标识，比"已配置"标签更有信息量
- 符合可视化优先原则（Visual-First Design）

**Visual States**:

| 节点状态 | 视觉表现 |
|---------|---------|
| 未配置 | 标签"未配置"，灰色标识 |
| 已配置 | 节点标题旁显示 `• {assetName}`，绿色标识 |
| 配置中 | 对话框弹出，节点半透明 |
| 选中 | 蓝色边框（现有样式） |

**Implementation Notes**:
- 修改 `DataSourceNode.vue`，在节点标题右侧显示资产名称
- 使用 `data.assetInfo?.assetName` 判断是否已配置
- 未配置时显示灰色徽章"未配置"

---

## 8. 导出 JSON 格式设计

### Decision: 节点 data 包含完整资产信息

**Rationale**:
- 导出的 JSON 需要包含完整编排信息，以便后续执行
- 完整信息存储在节点 data 中，导入时无需额外 API 调用
- 向后兼容：旧版本 JSON 中的节点没有 assetInfo 字段，显示为"未配置"

**JSON Structure**:
```json
{
  "nodes": [
    {
      "id": "node_123",
      "type": "data_source",
      "position": { "x": 100, "y": 100 },
      "data": {
        "label": "MySQL 数据源",
        "category": "data_source",
        "sourceType": "database",
        "icon": "database",
        "color": "#52C41A",
        "assetInfo": {
          "assetId": "asset_001",
          "assetNumber": "AST-2024-001",
          "assetName": "用户行为数据",
          "holderCompany": "某某企业",
          "intro": "用户点击流数据",
          "scale": "1000万条",
          "cycle": "每日",
          "timeSpan": "2024-01-01 至今",
          "dataInfo": {
            "databaseName": "user_db",
            "tableName": "user_behavior",
            "fieldList": [
              { "name": "user_id", "dataType": "VARCHAR", "dataLength": 64, "description": "用户 ID", "isPrimaryKey": true },
              { "name": "action_time", "dataType": "DATETIME", "dataLength": null, "description": "操作时间" }
            ]
          },
          "selectedFields": ["user_id", "action_time"]
        }
      }
    }
  ],
  "edges": []
}
```

**Implementation Notes**:
- 导出前验证每个节点的 assetInfo 完整性
- 未配置节点的 assetInfo 为 `null`
- 导入时从节点 data 重建缓存

---

## 9. 浏览器兼容性

### Decision: 现代浏览器（Chrome >= 90, Edge >= 90, Firefox >= 88, Safari >= 14）

**Rationale**:
- Vue 3 使用 ES2020+ 特性（Optional Chaining、Nullish Coalescing）
- @vue-flow/core 需要现代浏览器 API
- 目标用户为企业用户，现代浏览器覆盖率 > 95%

**Required Features**:
- Optional Chaining (`?.`)
- Nullish Coalescing (`??`)
- `Array.prototype.includes()`
- `String.prototype.startsWith()`
- `IntersectionObserver`（虚拟滚动使用）

**Implementation Notes**:
- 不使用 Polyfill（减少 bundle 体积）
- Vite 默认配置支持 `modules: true`，假设现代浏览器环境

---

## 10. 搜索与过滤性能优化

### Decision: 客户端过滤（适用于 < 1000 项场景）

**Rationale**:
- 企业列表和数据资产列表通常 < 100 项，客户端过滤足够快
- 避免额外的 API 调用，减少网络开销
- 即时反馈，用户体验更好

**Implementation Notes**:
- 使用 `Array.prototype.filter()` 进行过滤
- 使用 `Array.prototype.some()` 支持模糊搜索
- 防抖输入（300ms），避免频繁过滤
- 大数据场景（> 1000 项）考虑后端搜索

---

## Summary

| 决策项 | 选择 | 关键原因 |
|-------|------|---------|
| 向导交互模式 | 多步骤向导（上一步/下一步） | 降低认知负担，支持返回修改 |
| 虚拟滚动 | 自实现（Vue 3 Composition API） | 无额外依赖，性能优化 |
| 错误处理 | 智能分类（网络/超时重试，其他不重试） | 区分错误类型，提升用户体验 |
| 缓存策略 | 内存 Map 缓存 | 避免重复 API 调用，速度快 |
| 日志策略 | console API 级别控制 | 原生支持，无需依赖 |
| 取消策略 | 立即删除节点 | 保持画布整洁 |
| 状态展示 | 标题旁显示资产名称 | 快速识别，信息丰富 |
| 导出格式 | 节点 data 包含完整信息 | 导入时无需额外 API |
| 浏览器兼容 | 现代浏览器 | Vue 3 特性支持 |
| 搜索过滤 | 客户端过滤 | 即时反馈，减少 API 调用 |

**Phase 0 Complete**: 所有技术决策已确定，可以进入 Phase 1（设计与契约）。
