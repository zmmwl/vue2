# Data Model: 联邦学习任务重构

**Date**: 2026-03-27
**Branch**: `006-fl-task-restructure`

## 1. 核心枚举

### FLTaskExecutionType

```typescript
/**
 * 任务执行类型
 * - LOCAL: 单方本地任务，只能连接1个数据源
 * - DYNAMIC: 动态任务，根据连接数量自动判定类型
 * - MULTI_PARTY: 多方隐私任务，必须连接2+数据源
 */
export enum FLTaskExecutionType {
  LOCAL = 'local',
  DYNAMIC = 'dynamic',
  MULTI_PARTY = 'multi_party'
}
```

### FLTaskCategory（现有，扩展用途）

```typescript
export enum FLTaskCategory {
  PREPROCESS = 'preprocess',              // 预处理
  FEATURE_ENGINEERING = 'feature_engineering',  // 特征工程
  HORIZONTAL_MODEL = 'horizontal',        // 横向模型
  VERTICAL_MODEL = 'vertical'             // 纵向模型
}
```

### FLMode（现有）

```typescript
export enum FLMode {
  TRAINING = 'training',    // 训练模式
  INFERENCE = 'inference'   // 推断模式
}
```

## 2. 扩展接口

### FLTaskSubType

```typescript
/**
 * 任务子类型定义
 */
export interface FLTaskSubType {
  value: string                    // 子类型标识
  label: string                     // 显示名称
  description?: string              // 描述
  parameters: FLTaskParameterDef[]  // 该子类型的参数列表
}
```

### FLTaskParameterTemplate（扩展）

```typescript
/**
 * 任务参数模板（扩展版）
 */
export interface FLTaskParameterTemplate {
  taskName: string                    // 任务名称（英文标识）
  displayName: string                 // 显示名称（中文）
  category: FLTaskCategory            // 任务类别
  mode: FLMode                         // 训练/推断模式
  icon: string                         // 图标
  description?: string                 // 任务描述

  // === 新增字段 ===
  executionType: FLTaskExecutionType   // 执行类型
  subTypes?: FLTaskSubType[]           // 子类型列表（可选）

  // === 兼容现有字段 ===
  parameters: FLTaskParameterDef[]     // 参数定义列表（无子类型时使用）
}
```

### FLTaskConnectionConstraint（扩展）

```typescript
/**
 * 任务连接约束
 */
export interface FLTaskConnectionConstraint {
  minDataSources: number          // 最小数据源数量
  maxDataSources: number          // 最大数据源数量
  minParticipants: number         // 最小参与方数量
  maxParticipants: number         // 最大参与方数量
  allowOutputNode: boolean        // 是否允许输出节点
  joinTypesAllowed?: JoinType[]    // 允许的连接类型（动态任务）
}

/**
 * 各执行类型的默认约束
 */
export const FL_EXECUTION_TYPE_CONSTRAINTS: Record<FLTaskExecutionType, FLTaskConnectionConstraint> = {
  [FLTaskExecutionType.LOCAL]: {
    minDataSources: 1,
    maxDataSources: 1,
    minParticipants: 1,
    maxParticipants: 1,
    allowOutputNode: false
  },
  [FLTaskExecutionType.DYNAMIC]: {
    minDataSources: 1,
    maxDataSources: 10,
    minParticipants: 1,
    maxParticipants: 10,
    allowOutputNode: true,  // 多方时允许
    joinTypesAllowed: ['INNER']
  },
  [FLTaskExecutionType.MULTI_PARTY]: {
    minDataSources: 2,
    maxDataSources: 10,
    minParticipants: 2,
    maxParticipants: 10,
    allowOutputNode: true
  }
}
```

## 3. FLTaskNodeData（扩展）

```typescript
/**
 * FL 任务节点数据（扩展版）
 */
export interface FLTaskNodeData extends NodeData {
  category: NodeCategory.COMPUTE_TASK
  taskType: ComputeTaskType.FL

  // FL 任务类别
  flCategory: FLTaskCategory
  // FL 模式（训练/推断）
  flMode: FLMode
  // 具体任务名称
  taskName: string
  // 任务显示名称
  taskDisplayName: string

  // === 新增字段 ===
  // 执行类型
  executionType: FLTaskExecutionType
  // 选中的子类型
  selectedSubType?: string

  // 输入数据源配置
  inputProviders?: InputProvider[]
  // 参数配置
  parameters?: Record<string, any>

  // 已部署模型（仅推断模式）
  deployedModelId?: string
  deployedModelName?: string
  trainingParticipants?: string[]

  // 输出节点ID
  outputNodeId?: string
}
```

## 4. 任务模板数据结构

### 预处理任务

```typescript
// 数据清洗 - 单方本地任务
const DATA_CLEANING_TEMPLATE: FLTaskParameterTemplate = {
  taskName: 'data_cleaning',
  displayName: '数据清洗',
  category: FLTaskCategory.PREPROCESS,
  mode: FLMode.TRAINING,
  icon: '🧹',
  executionType: FLTaskExecutionType.LOCAL,
  subTypes: [
    {
      value: 'missing_value',
      label: '缺失值处理',
      parameters: [
        { name: 'strategy', displayName: '处理策略', dataType: FLParameterDataType.SELECT, required: true, options: [...] },
        { name: 'fillValue', displayName: '填充值', dataType: FLParameterDataType.NUMBER, required: false },
        { name: 'columns', displayName: '处理列', dataType: FLParameterDataType.MULTISELECT, required: false }
      ]
    },
    // ... 其他4个子类型
  ],
  parameters: []  // 有 subTypes 时不使用
}

// 数据采样 - 动态任务
const DATA_SAMPLING_TEMPLATE: FLTaskParameterTemplate = {
  taskName: 'data_sampling',
  displayName: '数据采样',
  category: FLTaskCategory.PREPROCESS,
  mode: FLMode.TRAINING,
  icon: '📊',
  executionType: FLTaskExecutionType.DYNAMIC,
  subTypes: [
    {
      value: 'random',
      label: '随机采样',
      parameters: [
        { name: 'ratio', displayName: '采样比例', dataType: FLParameterDataType.NUMBER, required: true, min: 0.01, max: 1.0 },
        { name: 'randomState', displayName: '随机种子', dataType: FLParameterDataType.NUMBER, required: false }
      ]
    },
    // ... 其他4个子类型
  ],
  parameters: []
}
```

### 特征工程任务

```typescript
// 特征分箱 - 动态任务
const FEATURE_BINNING_TEMPLATE: FLTaskParameterTemplate = {
  taskName: 'feature_binning',
  displayName: '特征分箱',
  category: FLTaskCategory.FEATURE_ENGINEERING,
  mode: FLMode.TRAINING,
  icon: '📦',
  executionType: FLTaskExecutionType.DYNAMIC,
  subTypes: [
    {
      value: 'equal_freq_woe',
      label: '等频分箱(输出WOE/IV)',
      parameters: [
        { name: 'nBins', displayName: '分箱数量', dataType: FLParameterDataType.NUMBER, required: true, min: 2, max: 100 },
        { name: 'columns', displayName: '分箱列', dataType: FLParameterDataType.MULTISELECT, required: true },
        { name: 'outputWOE', displayName: '输出WOE值', dataType: FLParameterDataType.BOOLEAN, required: false },
        { name: 'outputIV', displayName: '输出IV值', dataType: FLParameterDataType.BOOLEAN, required: false },
        { name: 'labelColumn', displayName: '标签列', dataType: FLParameterDataType.SELECT, required: true }
      ]
    },
    // ... 等宽分箱
  ],
  parameters: []
}

// 特征编码 - 单方本地任务
const FEATURE_ENCODING_TEMPLATE: FLTaskParameterTemplate = {
  taskName: 'feature_encoding',
  displayName: '特征编码',
  category: FLTaskCategory.FEATURE_ENGINEERING,
  mode: FLMode.TRAINING,
  icon: '🔤',
  executionType: FLTaskExecutionType.LOCAL,
  subTypes: [
    { value: 'onehot', label: '独热编码', parameters: [...] },
    { value: 'label', label: '标签编码', parameters: [...] }
  ],
  parameters: []
}
```

### 横向/纵向模型任务

```typescript
// 横向逻辑回归 - 多方隐私任务
const HORIZONTAL_LR_TEMPLATE: FLTaskParameterTemplate = {
  taskName: 'horizontal_logistic_regression',
  displayName: '横向逻辑回归',
  category: FLTaskCategory.HORIZONTAL_MODEL,
  mode: FLMode.TRAINING,
  icon: '📈',
  executionType: FLTaskExecutionType.MULTI_PARTY,
  // 无 subTypes，直接使用 parameters
  parameters: [
    { name: 'learningRate', displayName: '学习率', dataType: FLParameterDataType.NUMBER, required: true, defaultValue: 0.01, min: 0.0001, max: 1 },
    { name: 'iterations', displayName: '迭代次数', dataType: FLParameterDataType.NUMBER, required: true, defaultValue: 100, min: 1, max: 10000 },
    { name: 'batchSize', displayName: '批次大小', dataType: FLParameterDataType.NUMBER, required: false, defaultValue: 32, min: 1 },
    { name: 'regularization', displayName: '正则化', dataType: FLParameterDataType.SELECT, required: false, options: [...] },
    { name: 'regParam', displayName: '正则化系数', dataType: FLParameterDataType.NUMBER, required: false, defaultValue: 0.01 }
  ]
}
```

## 5. 状态转换

### 任务节点状态

```typescript
type FLTaskNodeStatus = 'idle' | 'configured' | 'connected' | 'ready'

// 状态转换规则：
// idle -> configured: 用户完成参数配置
// configured -> connected: 用户连接了数据源
// connected -> ready: 满足所有约束条件
```

### 动态任务类型判定

```typescript
function determineDynamicExecutionType(
  node: FLTaskNodeData,
  connections: Edge[]
): FLTaskExecutionType {
  const inputCount = connections.filter(e => e.target === node.id).length

  if (inputCount <= 1) {
    return FLTaskExecutionType.LOCAL
  }
  return FLTaskExecutionType.MULTI_PARTY
}
```

## 6. 验证规则

### 连接验证

```typescript
interface ConnectionValidation {
  isValid: boolean
  error?: string
}

function validateConnection(
  sourceNode: Node,
  targetNode: FLTaskNodeData,
  existingConnections: Edge[]
): ConnectionValidation {
  const targetConstraint = getConstraintForTask(targetNode)

  // 检查最大数据源限制
  const currentInputCount = existingConnections.filter(e => e.target === targetNode.id).length
  if (currentInputCount >= targetConstraint.maxDataSources) {
    return { isValid: false, error: `该任务最多只能连接 ${targetConstraint.maxDataSources} 个数据源` }
  }

  // 检查最小数据源限制（仅多方隐私任务）
  if (targetNode.executionType === FLTaskExecutionType.MULTI_PARTY) {
    if (currentInputCount + 1 < targetConstraint.minDataSources) {
      // 允许连接，但提示还需更多数据源
    }
  }

  return { isValid: true }
}
```

### 参数验证

```typescript
function validateParameters(
  template: FLTaskParameterTemplate,
  values: Record<string, any>,
  selectedSubType?: string
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // 获取要验证的参数列表
  const paramsToValidate = selectedSubType
    ? template.subTypes?.find(s => s.value === selectedSubType)?.parameters ?? []
    : template.parameters

  for (const param of paramsToValidate) {
    const value = values[param.name]

    // 必填检查
    if (param.required && (value === undefined || value === null || value === '')) {
      errors.push(`${param.displayName} 为必填项`)
      continue
    }

    // 范围检查
    if (param.dataType === FLParameterDataType.NUMBER && value !== undefined) {
      if (param.min !== undefined && value < param.min) {
        errors.push(`${param.displayName} 不能小于 ${param.min}`)
      }
      if (param.max !== undefined && value > param.max) {
        errors.push(`${param.displayName} 不能大于 ${param.max}`)
      }
    }
  }

  return { isValid: errors.length === 0, errors }
}
```
