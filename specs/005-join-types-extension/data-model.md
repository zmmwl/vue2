# Data Model: Join 类型扩展

**Feature**: 005-join-types-extension
**Date**: 2026-03-01

## 1. 类型定义更新

### 1.1 JoinType 联合类型（新增）

```typescript
// src/types/nodes.ts

/**
 * 连接类型
 * - INNER: 内连接，需要指定 join 字段进行匹配
 * - CROSS: 交叉连接，笛卡尔积，不需要 join 字段
 * - Union: 横向拼接，需要字段对齐
 * - NoAssoc: 无关联，独立处理
 */
export type JoinType = 'INNER' | 'CROSS' | 'Union' | 'NoAssoc'
```

### 1.2 FieldMapping 接口更新

```typescript
// src/types/nodes.ts

export interface FieldMapping {
  columnName: string        // 原始字段名
  columnAlias: string       // 别名
  columnType: string        // varchar/int/bigint等
  isJoinField: boolean      // 是否为 join 字段
  joinType?: JoinType       // 更新：支持四种类型
  mappingOrder?: number     // 字段映射顺序（Union 类型下使用）
}
```

### 1.3 InputProvider 接口更新

```typescript
// src/types/nodes.ts

export interface InputProvider {
  sourceNodeId: string
  sourceType: 'dataSource' | 'outputData'
  participantId: string
  dataset: string
  fields: FieldMapping[]

  // 新增：该数据源的连接类型
  joinType?: JoinType  // 默认为 'INNER'

  joinFields?: string[]
  isRealtime?: boolean

  // 新增：Union 专用字段映射
  unionFieldMappings?: UnionFieldMapping[]
}
```

### 1.4 UnionFieldMapping 接口（新增）

```typescript
// src/types/nodes.ts

/**
 * Union 专用字段映射
 * 用于记录不同数据源的字段如何映射到统一的输出字段
 */
export interface UnionFieldMapping {
  /** 目标字段的统一别名 */
  targetAlias: string

  /** 目标字段的数据类型 */
  targetType: string

  /** 字段顺序 */
  order: number

  /**
   * 各数据源对应的源字段
   * key: `${participantId}.${dataset}`
   * value: 源字段名（columnName）
   * 如果某数据源没有对应字段，值为 null
   */
  sourceFields: Record<string, string | null>
}
```

### 1.5 JoinCondition 接口更新

```typescript
// src/types/nodes.ts

export interface JoinCondition {
  joinType: JoinType  // 更新：使用新的联合类型
  operands: JoinOperand[]  // Union/NoAssoc 下可为空数组
}
```

## 2. 验证规则

### 2.1 类型共存规则

```typescript
// src/utils/join-validation.ts

/**
 * 类型兼容性矩阵
 * true = 可共存, false = 不可共存
 */
const COMPATIBILITY_MATRIX: Record<JoinType, Record<JoinType, boolean>> = {
  INNER: {
    INNER: true,
    CROSS: true,      // 只允许一个 CROSS
    Union: false,     // 不能共存
    NoAssoc: true
  },
  CROSS: {
    INNER: true,
    CROSS: false,     // 只允许一个 CROSS
    Union: true,
    NoAssoc: true
  },
  Union: {
    INNER: false,     // 不能共存
    CROSS: true,
    Union: true,
    NoAssoc: true
  },
  NoAssoc: {
    INNER: true,
    CROSS: true,
    Union: true,
    NoAssoc: true     // 可与所有类型共存
  }
}

/**
 * CROSS 类型的特殊规则：只允许一个输入源
 */
const MAX_CROSS_COUNT = 1
```

### 2.2 字段校验规则

| Join 类型 | join 字段要求 | 字段对齐要求 |
|-----------|---------------|--------------|
| INNER | 必填，至少 1 个 | 无 |
| CROSS | 可选，不参与计算 | 无 |
| Union | 不需要 | 必填，需要配置字段映射 |
| NoAssoc | 可选，不参与计算 | 无 |

## 3. 状态转换

### 3.1 类型切换时的数据处理

```typescript
// 当用户从类型 A 切换到类型 B 时：

function handleJoinTypeChange(
  oldType: JoinType,
  newType: JoinType,
  provider: InputProvider
): InputProvider {
  // 清除不适用的配置
  const clearedProvider = { ...provider }

  switch (newType) {
    case 'INNER':
      // 从其他类型切换到 INNER
      // 保留 joinFields，清除 unionFieldMappings
      delete clearedProvider.unionFieldMappings
      break

    case 'CROSS':
    case 'NoAssoc':
      // 清除 join 相关配置
      clearedProvider.fields = clearedProvider.fields.map(f => ({
        ...f,
        isJoinField: false,
        joinType: newType
      }))
      delete clearedProvider.unionFieldMappings
      break

    case 'Union':
      // 清除 joinFields，初始化 unionFieldMappings
      clearedProvider.fields = clearedProvider.fields.map(f => ({
        ...f,
        isJoinField: false,
        joinType: 'Union'
      }))
      // 初始化 unionFieldMappings（基于现有字段）
      clearedProvider.unionFieldMappings = initializeUnionMappings(provider)
      break
  }

  clearedProvider.joinType = newType
  return clearedProvider
}
```

## 4. 数据流

### 4.1 配置保存流程

```
用户选择 Join 类型
    ↓
校验类型兼容性 (join-validation.ts)
    ↓ (通过)
更新 InputProvider.joinType
    ↓
根据类型显示/隐藏配置区域
    ↓
用户配置字段（join 字段 / Union 映射）
    ↓
校验必填项
    ↓ (通过)
保存到节点数据
    ↓
触发 joinConditions 重建 (join-builder.ts)
```

### 4.2 导出格式

```typescript
// src/types/export.ts 更新

export interface ExportJoinCondition {
  joinType: JoinType
  participantIdList: string[]
  joinFieldList: string[]  // Union/NoAssoc 下为空
  unionFieldMappings?: ExportUnionMapping[]  // Union 专用
}

export interface ExportUnionMapping {
  targetAlias: string
  targetType: string
  sourceFields: Record<string, string | null>
}
```

## 5. 默认值

| 字段 | 默认值 | 说明 |
|------|--------|------|
| InputProvider.joinType | 'INNER' | 保持向后兼容 |
| FieldMapping.isJoinField | false | 需要用户显式选择 |
| FieldMapping.joinType | 继承自 InputProvider | 字段级别可覆盖 |
| UnionFieldMapping.order | 按创建顺序递增 | 从 0 开始 |
