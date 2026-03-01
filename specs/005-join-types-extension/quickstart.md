# Quickstart: Join 类型扩展

**Feature**: 005-join-types-extension
**Date**: 2026-03-01

## 概述

本功能为计算任务节点新增两种 join 类型：
- **Union（横向拼接）**：将多个数据源的记录按字段对齐后合并
- **NoAssoc（无关联）**：标记数据源为独立处理，不参与关联操作

同时优化现有 **CROSS（交叉连接）** 类型的用户体验。

## 快速开始

### 1. 添加新的 join 类型

在 `InputProviderConfig.vue` 中选择数据源后，可以通过下拉菜单选择连接类型：

```
INNER（内连接）    - 只保留匹配的数据行
CROSS（交叉连接）  - 笛卡尔积，不需要 join 字段
Union（横向拼接）  - 横向合并数据，需要字段对齐
NoAssoc（无关联）  - 独立处理，不参与关联
```

### 2. 配置 Union 类型

选择 Union 类型后：

1. 系统隐藏 join 字段选择复选框
2. 显示字段对齐配置界面
3. 选择偏好的对齐模式：
   - **表格模式**：直接在表格中填写统一别名
   - **列对齐模式**：拖拽各数据源的列来对齐
   - **逐字段映射模式**：创建目标字段，选择对应的源字段

### 3. 类型共存规则

系统会自动校验类型兼容性：

| 已有类型 | 尝试添加 | 结果 |
|----------|----------|------|
| INNER | Union | ❌ 阻止，显示冲突提示 |
| Union | INNER | ❌ 阻止，显示冲突提示 |
| CROSS | CROSS | ❌ 阻止，只允许一个 CROSS |
| 任意 | NoAssoc | ✅ 允许 |

### 4. 类型切换

切换 join 类型时：
- 系统自动清除不适用的配置
- 显示提示引导用户重新配置
- 不会保留可能导致混淆的残留配置

## 开发指南

### 文件修改清单

```
src/
├── types/
│   └── nodes.ts              # 类型定义更新
├── components/
│   └── Modals/
│       └── InputProviderConfig.vue  # UI 更新
├── utils/
│   ├── join-builder.ts       # 业务逻辑更新
│   └── join-validation.ts    # 新增：校验逻辑
└── types/
    └── export.ts             # 导出格式更新
```

### 关键接口

```typescript
// 新增类型
type JoinType = 'INNER' | 'CROSS' | 'Union' | 'NoAssoc'

// InputProvider 扩展
interface InputProvider {
  joinType?: JoinType
  unionFieldMappings?: UnionFieldMapping[]
  // ...
}

// Union 字段映射
interface UnionFieldMapping {
  targetAlias: string
  targetType: string
  order: number
  sourceFields: Record<string, string | null>
}
```

### 校验函数

```typescript
// src/utils/join-validation.ts

function validateJoinCompatibility(
  providers: InputProvider[]
): ValidationResult {
  // 检查 Union/INNER 共存冲突
  // 检查 CROSS 数量限制
  // 返回 { isValid, conflicts, suggestions }
}
```

## 测试场景

### 手动测试清单

- [ ] 选择 INNER 类型，验证 join 字段必填
- [ ] 选择 CROSS 类型，验证 join 字段可选/禁用
- [ ] 选择 Union 类型，验证字段对齐界面显示
- [ ] 选择 NoAssoc 类型，验证无校验要求
- [ ] 尝试 Union + INNER 组合，验证冲突提示
- [ ] 尝试多个 CROSS，验证限制提示
- [ ] 切换类型，验证配置清除和提示
- [ ] 保存配置，验证数据持久化正确

### Playwright 测试

测试文件位置：`tests/join-types.spec.ts`

```typescript
// 测试用例示例
test('Union 与 INNER 不能共存', async ({ page }) => {
  // 添加 INNER 类型数据源
  // 尝试添加 Union 类型数据源
  // 验证显示冲突提示
  // 验证保存按钮被禁用
})
```

## 注意事项

1. **向后兼容**：现有的 INNER/CROSS 配置不受影响
2. **数据迁移**：旧数据会自动设置 `joinType: 'INNER'`
3. **性能考虑**：字段对齐界面支持虚拟滚动，适用于大量字段场景
