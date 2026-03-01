# Research: Join 类型扩展

**Feature**: 005-join-types-extension
**Date**: 2026-03-01

## 1. 当前实现分析

### 1.1 Join 类型系统

**位置**: `src/types/nodes.ts`

当前支持的类型：
- `INNER`: 内连接，需要指定 join 字段
- `CROSS`: 交叉连接，不需要 join 字段

**关键接口**：
```typescript
// FieldMapping (第271-278行)
interface FieldMapping {
  columnName: string
  columnAlias: string
  columnType: string
  isJoinField: boolean
  joinType?: 'INNER' | 'CROSS'
}

// JoinCondition (第298-302行)
interface JoinCondition {
  joinType: 'INNER' | 'CROSS'
  operands: JoinOperand[]
}
```

### 1.2 UI 组件

**InputProviderConfig.vue** (src/components/Modals/):
- 全局 join 类型选择器（select 下拉框）
- 字段表格中 join 复选框
- 字段拖拽排序

**FieldSelector.vue** (src/components/Modals/):
- 字段选择对话框
- 别名配置
- join 字段标记

### 1.3 业务逻辑

**join-builder.ts** (src/utils/):
- 按 joinType 分组字段
- 构建 INNER/CROSS 条件
- 合并相同字段的操作数

## 2. 技术决策

### 2.1 类型扩展方案

**Decision**: 扩展现有类型定义，新增 Union 和 NoAssoc 类型

**Rationale**:
- 保持与现有架构一致
- 最小化修改范围
- 便于后续维护

**Alternatives considered**:
- 创建独立的 UnionCondition 接口 - 拒绝，因为会增加复杂度
- 使用泛型重构整个 join 系统 - 拒绝，过度设计

### 2.2 字段对齐界面实现

**Decision**: 创建专用 UnionFieldAligner 组件，支持三种交互模式

**Rationale**:
- 用户可选择偏好的交互方式
- 三种模式共享同一数据模型
- 便于单独测试每种模式

**模式实现方案**:
| 模式 | 实现技术 | 复杂度 |
|------|----------|--------|
| 列对齐 | CSS Grid + 原生拖拽 | 中 |
| 逐字段映射 | 树形组件 + 拖拽 | 高 |
| 表格模式 | 表格 + 输入框 | 低 |

### 2.3 类型共存校验

**Decision**: 创建独立的 join-validation.ts 工具函数

**Rationale**:
- 校验逻辑集中管理
- 便于在多处复用（FlowCanvas、InputProviderConfig）
- 易于单元测试

### 2.4 错误提示方式

**Decision**: 内联警告条 + 禁用保存按钮

**Rationale**:
- 不打断用户操作流程
- 明确告知错误原因
- 防止错误配置被提交

## 3. 现有可复用资源

### 3.1 组件
- `CollapsibleSection.vue` - 可折叠区块
- `VirtualScrollList.vue` - 虚拟滚动列表
- `FieldSelector.vue` - 字段选择器

### 3.2 工具函数
- `join-builder.ts` - Join 条件构建
- `node-templates.ts` - 节点模板

### 3.3 样式系统
- `variables.scss` - 完整的设计变量
- n8n 风格设计语言

### 3.4 拖拽实现
- 原生 HTML5 拖拽 API
- `FlowSidebar.vue` 中的节点拖拽
- `FieldGroupCard.vue` 中的字段拖拽

## 4. 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 三种模式开发量大 | 高 | 优先实现表格模式，其他模式可迭代 |
| 类型切换时数据丢失 | 中 | 提供确认提示，自动清除不适用的配置 |
| 多数据源字段数量不一致 | 低 | 允许空值填充，显示警告 |

## 5. 实现优先级

1. **P1 - 基础类型扩展**
   - 更新类型定义
   - 更新 InputProviderConfig.vue 的 join 类型选择器
   - 实现 NoAssoc 和 CROSS 的 join 字段禁用

2. **P1 - 类型共存校验**
   - 创建 join-validation.ts
   - 集成到 InputProviderConfig.vue
   - 实现内联警告提示

3. **P2 - Union 字段对齐界面**
   - 先实现表格模式（最简单）
   - 再实现列对齐模式
   - 最后实现逐字段映射模式

4. **P2 - 测试和文档**
   - Playwright 测试
   - 更新导出逻辑
