# Data Model: 隐匿查询功能完善与联邦学习任务上线

**Date**: 2026-02-21
**Feature**: 003-pir-fl-enhancement

## 1. 实时数据源 (RealtimeDataSource)

### Entity Definition
```typescript
/**
 * 实时数据源 - PIR任务专用数据源类型
 */
export interface RealtimeDataSourceInfo {
  /** 唯一标识 */
  id: string
  /** 数据源名称 */
  name: string
  /** 字段来源类型 */
  sourceType: 'connection' | 'manual'
  /** 字段列表 */
  fields: RealtimeFieldInfo[]
  /** 连线导入时的源节点ID */
  sourceNodeId?: string
  /** 创建时间 */
  createdAt?: string
}

/**
 * 实时数据源字段
 */
export interface RealtimeFieldInfo {
  /** 字段名称 */
  name: string
  /** 字段类型 */
  dataType: 'STRING' | 'INT' | 'BIGINT' | 'FLOAT' | 'DOUBLE' | 'BOOLEAN' | 'DATETIME'
  /** 字段描述 */
  description?: string
}
```

### Relationships
- `RealtimeDataSourceInfo` → `PIRTaskNodeData` (1:1, 作为realtimeDataSource字段)
- `RealtimeDataSourceInfo` → `OutputDataNodeData` (N:1, 来源节点引用)

### Validation Rules
- `fields` 数组不能为空（至少一个字段）
- `sourceType` 为 `connection` 时，`sourceNodeId` 必填

---

## 2. PIR任务节点数据 (PIRTaskNodeData)

### Entity Definition
```typescript
/**
 * PIR任务节点数据
 */
export interface PIRTaskNodeData extends NodeData {
  category: NodeCategory.COMPUTE_TASK
  taskType: ComputeTaskType.PIR

  /** 预加载数据源配置 */
  preloadDataSource?: InputProvider

  /** 实时数据源配置 */
  realtimeDataSource?: RealtimeDataSourceInfo

  /** 计算模型配置 */
  models?: ComputeModelConfig[]

  /** 算力资源配置 */
  computeProviders?: ComputeResourceConfig[]

  /** 输出数据配置 */
  outputs?: PIROutputConfig[]
}

/**
 * PIR输出配置
 */
export interface PIROutputConfig {
  id: string
  participantId: string
  dataset: string
  outputFields: OutputField[]
  outputNodeId: string
  /** 标记为实时数据源类型输出 */
  isRealtimeOutput: true
}
```

### State Transitions
```
[新建] → [配置预加载数据源] → [配置实时数据源] → [配置输出] → [完成]
         ↓                      ↓
      [未配置]              [未配置]
```

### Validation Rules
- 必须配置一个预加载数据源
- 必须配置一个实时数据源
- PIR输出节点标记为 `isRealtimeOutput: true`

---

## 3. 联邦学习任务节点数据 (FLTaskNodeData)

### Entity Definition
```typescript
/**
 * 联邦学习任务类别
 */
export enum FLTaskCategory {
  PREPROCESS = 'preprocess',           // 预处理
  FEATURE_ENGINEERING = 'feature_engineering',  // 特征工程
  HORIZONTAL = 'horizontal',           // 横向模型
  VERTICAL = 'vertical'                // 纵向模型
}

/**
 * 联邦学习模式
 */
export enum FLMode {
  TRAINING = 'training',   // 训练
  INFERENCE = 'inference'  // 推断
}

/**
 * 联邦学习任务节点数据
 */
export interface FLTaskNodeData extends NodeData {
  category: NodeCategory.FL_TASK
  /** FL任务类别 */
  flCategory: FLTaskCategory
  /** 具体任务名称 */
  taskName: string
  /** 训练/推断模式 */
  mode: FLMode

  /** 输入数据配置 */
  inputProviders?: InputProvider[]

  /** 任务参数配置 */
  parameters: FLTaskParameters

  /** 已部署模型（仅推断模式） */
  deployedModel?: DeployedModelInfo

  /** 输出数据配置（特征工程和模型任务） */
  outputs?: OutputDataConfig[]
}

/**
 * 联邦学习任务参数
 */
export interface FLTaskParameters {
  [key: string]: string | number | boolean | string[] | undefined
}

/**
 * 已部署模型信息
 */
export interface DeployedModelInfo {
  id: string
  name: string
  version: string
  type: string
  /** 训练参与方列表 */
  trainingParticipants: string[]
  entityName?: string
}
```

### Relationships
- `FLTaskNodeData` → `InputProvider` (1:N, 输入数据源)
- `FLTaskNodeData` → `DeployedModelInfo` (1:1, 仅推断模式)
- `FLTaskNodeData` → `OutputDataConfig` (1:N, 特征工程和模型任务)

### Validation Rules by Category

| 类别 | 输入限制 | 输出节点 | 参与方校验 |
|------|---------|---------|-----------|
| 预处理 | 单数据源 | 无 | 单方 |
| 特征工程 | 多数据源 | 有 | 多方 |
| 横向模型 | 多数据源 | 有 | 多方 |
| 纵向模型 | 多数据源 | 有 | 多方 |

---

## 4. 联邦学习任务参数模板 (FLTaskParameterTemplate)

### Entity Definition
```typescript
/**
 * 参数数据类型
 */
export type FLParameterDataType = 'select' | 'number' | 'text' | 'boolean' | 'multiselect' | 'array'

/**
 * FL任务参数定义
 */
export interface FLTaskParameterDef {
  /** 参数名（API字段名） */
  name: string
  /** 显示名称 */
  displayName: string
  /** 数据类型 */
  dataType: FLParameterDataType
  /** 是否必填 */
  required: boolean
  /** 默认值 */
  defaultValue?: string | number | boolean | string[]
  /** 可选值（select/multiselect类型用） */
  options?: FLParameterOption[]
  /** 数值范围验证 */
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
  /** 描述信息 */
  description?: string
  /** 条件显示（当其他参数满足条件时显示） */
  showWhen?: {
    paramName: string
    value: any
  }
}

/**
 * 参数选项
 */
export interface FLParameterOption {
  label: string
  value: string | number
  description?: string
}
```

---

## 5. 节点类型扩展

### NodeCategory 枚举扩展
```typescript
export enum NodeCategory {
  DATA_SOURCE = 'data_source',
  COMPUTE_TASK = 'compute_task',
  MODEL = 'model',
  COMPUTE_RESOURCE = 'computeResource',
  OUTPUT_DATA = 'outputData',
  LOCAL_TASK = 'localTask',
  FL_TASK = 'fl_task',           // 新增：联邦学习任务
  REALTIME_DATASOURCE = 'realtime_datasource'  // 新增：实时数据源
}
```

### ComputeTaskType 扩展
```typescript
export enum ComputeTaskType {
  PSI = 'PSI',
  PIR = 'PIR',   // 已有，需要特殊处理
  MPC = 'MPC',
  FL = 'FL'      // 保留，用于菜单分组
}
```

---

## 6. 连接验证规则扩展

### PIR连接规则
```typescript
interface PIRConnectionRule {
  /** PIR输出只能连接到PIR任务 */
  pirOutputToNonPir: {
    allowed: false
    reason: 'PIR输出只能连接到PIR任务'
  }
  /** PIR只能有一个预加载数据源输入 */
  pirPreloadInput: {
    maxCount: 1
  }
  /** PIR只能有一个实时数据源输入 */
  pirRealtimeInput: {
    maxCount: 1
  }
}
```

### FL任务连接规则
```typescript
interface FLConnectionRule {
  /** 预处理任务只能有一个数据源输入 */
  preprocessInput: {
    maxCount: 1
  }
  /** 推断任务的数据源必须来自训练参与方 */
  inferenceParticipant: {
    mustMatch: 'deployedModel.trainingParticipants'
  }
}
```

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         PIRTaskNodeData                         │
├─────────────────────────────────────────────────────────────────┤
│ - preloadDataSource: InputProvider                              │
│ - realtimeDataSource: RealtimeDataSourceInfo                    │
│ - outputs: PIROutputConfig[] (isRealtimeOutput: true)           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         ▼                                   ▼
┌─────────────────────┐           ┌─────────────────────┐
│   InputProvider     │           │ RealtimeDataSource  │
│   (预加载数据源)     │           │   (实时数据源)       │
└─────────────────────┘           └──────────┬──────────┘
                                             │
                                             ▼
                                  ┌─────────────────────┐
                                  │  PIR Output Node    │
                                  │  (实时数据源样式)    │
                                  └──────────┬──────────┘
                                             │
                                             ▼ (只能连接到PIR)
                                  ┌─────────────────────┐
                                  │   PIRTaskNodeData   │
                                  │   (下游PIR任务)      │
                                  └─────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        FLTaskNodeData                           │
├─────────────────────────────────────────────────────────────────┤
│ - flCategory: FLTaskCategory                                    │
│ - taskName: string                                              │
│ - mode: FLMode                                                  │
│ - parameters: FLTaskParameters                                  │
│ - deployedModel?: DeployedModelInfo (推断模式)                   │
│ - outputs?: OutputDataConfig[] (特征工程/模型)                   │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ PREPROCESS      │  │ FEATURE_ENG     │  │ HORIZONTAL/     │
│ - 单数据源输入   │  │ - 多数据源输入   │  │ VERTICAL        │
│ - 无输出节点     │  │ - 有输出节点     │  │ - 多数据源输入   │
│                 │  │                 │  │ - 有输出节点     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```
