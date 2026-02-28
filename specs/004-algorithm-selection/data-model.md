# Data Model: 隐私计算任务算法选择

**Date**: 2026-02-28
**Feature**: 004-algorithm-selection

## 实体定义

### 1. Algorithm (算法)

算法实体代表一个可执行的计算算法。

```typescript
interface Algorithm {
  // 唯一标识符 (格式: {name}-{version})
  id: string                    // 例: "SPDZ-v1.0"

  // 基本信息
  name: string                  // 算法名称 (如: "SPDZ协议算法")
  nameEn: string                // 英文名称 (如: "SPDZ")
  version: string               // 版本号 (如: "v1.0")
  description?: string          // 算法描述

  // 类型信息
  type: AlgorithmType           // 算法类型 (区分技术路径)

  // 算法包 (Mock场景为空)
  packageFileName?: string      // 文件名 (预留)
  packageSize?: number          // 文件大小 (预留)

  // 参数模板
  paramTemplate: AlgorithmParamTemplate[]

  // 元数据
  createdAt: number             // 创建时间戳 (毫秒)
  updatedAt?: number            // 更新时间戳
}
```

### 2. AlgorithmType (算法类型枚举)

```typescript
enum AlgorithmType {
  // 软件密码学
  PSI = 'PSI',           // 隐私集合求交
  PIR = 'PIR',           // 隐私信息检索
  MPC = 'MPC',           // 多方安全计算
  FL = 'FL',             // 联邦学习

  // 硬件TEE
  TEE_PSI = 'TEE_PSI',
  TEE_PIR = 'TEE_PIR',
  TEE_MPC = 'TEE_MPC',
  TEE_FL = 'TEE_FL'
}
```

### 3. AlgorithmParamTemplate (算法参数模板)

```typescript
interface AlgorithmParamTemplate {
  // 字段标识
  key: string                  // 参数键名 (如: "iterationCount")

  // 显示信息
  label: string                // 显示标签 (如: "迭代次数")
  description?: string         // 参数描述
  placeholder?: string         // 输入提示

  // 类型定义
  type: ParamType              // 参数类型

  // 验证规则
  required: boolean            // 是否必填
  validation?: ParamValidation // 验证规则

  // 默认值
  defaultValue?: ParamValue    // 默认值

  // 排序
  order: number                // 显示顺序
}

type ParamValue = string | number | boolean | Date | object | any[]
```

### 4. ParamType (参数类型枚举)

```typescript
enum ParamType {
  STRING = 'string',     // 字符串
  INTEGER = 'integer',   // 整数
  FLOAT = 'float',       // 浮点数
  BOOLEAN = 'boolean',   // 布尔值
  ENUM = 'enum',         // 枚举
  DATE = 'date',         // 日期
  JSON = 'json',         // JSON对象
  ARRAY = 'array'        // 数组
}
```

### 5. ParamValidation (参数验证规则)

```typescript
interface ParamValidation {
  // 字符串验证
  minLength?: number           // 最小长度
  maxLength?: number           // 最大长度
  pattern?: string             // 正则表达式

  // 数值验证
  min?: number                 // 最小值
  max?: number                 // 最大值

  // 枚举验证
  enumOptions?: EnumOption[]   // 枚举选项

  // 数组验证
  itemMinCount?: number        // 数组最小元素数
  itemMaxCount?: number        // 数组最大元素数
}

interface EnumOption {
  value: string                // 选项值
  label: string                // 显示文本
  description?: string         // 选项描述
}
```

### 6. TaskAlgorithmConfig (任务算法配置)

存储在任务节点中的算法配置信息。

```typescript
interface TaskAlgorithmConfig {
  // 算法引用
  algorithmId: string          // 算法ID (如: "SPDZ-v1.0")
  algorithmName: string        // 算法名称 (冗余存储，便于显示)
  algorithmVersion: string     // 算法版本

  // 用户填写的参数值
  algorithmParams: Record<string, ParamValue>
}
```

## 实体关系

```
┌─────────────────┐
│   Algorithm     │
│─────────────────│
│ id (PK)         │
│ name            │
│ type            │───────┐
│ paramTemplate[] │       │
│ createdAt       │       │
└─────────────────┘       │
                          │ 匹配
                          ▼
┌─────────────────┐    ┌─────────────────┐
│ ComputeTaskNode │    │ AlgorithmType   │
│─────────────────│    │─────────────────│
│ id              │    │ PSI             │
│ computeType     │────│ PIR             │
│ algorithmConfig │    │ MPC             │
│ ...             │    │ FL              │
└─────────────────┘    │ TEE_PSI         │
        │              │ TEE_PIR         │
        │              │ TEE_MPC         │
        ▼              │ TEE_FL          │
┌─────────────────┐    └─────────────────┘
│TaskAlgorithmConfig│
│─────────────────│
│ algorithmId     │
│ algorithmName   │
│ algorithmVersion│
│ algorithmParams │
└─────────────────┘
```

## 状态转换

### 算法生命周期 (Mock场景简化)

```
[创建] ──► [可用] ──► [删除]
              │
              └──► [被任务引用] (不可删除，显示警告)
```

### 任务算法配置流程

```
[拖拽任务节点]
      │
      ▼
[自动匹配算法] ──► [有匹配算法?] ──否──► [算法字段为空]
      │                    │
      是                   是
      │                    │
      ▼                    ▼
[显示默认算法]        [显示算法信息]
      │
      ▼
[用户可手动选择]
      │
      ▼
[切换算法?]
      │
      ├──是──► [清空参数] ──► [生成新表单]
      │
      否
      │
      ▼
[填写参数]
      │
      ▼
[保存到任务配置]
```

## 数据验证规则

### Algorithm 验证

| 字段 | 规则 |
|------|------|
| id | 格式: `{nameEn}-{version}`, 唯一 |
| name | 必填, 1-100字符 |
| nameEn | 必填, 字母数字下划线, 1-50字符 |
| version | 必填, 格式: `v{major}.{minor}` |
| type | 必填, 枚举值 |
| createdAt | 自动生成 |

### AlgorithmParamTemplate 验证

| 字段 | 规则 |
|------|------|
| key | 必填, 字母数字下划线, 同一算法内唯一 |
| label | 必填, 1-50字符 |
| type | 必填, 枚举值 |
| required | 默认 false |
| order | 同一算法内唯一 |

### TaskAlgorithmConfig 验证

| 字段 | 规则 |
|------|------|
| algorithmId | 必填, 引用有效算法 |
| algorithmParams | 根据算法参数模板验证 |

## 导出JSON格式

```json
{
  "taskList": [{
    "taskId": "task-001",
    "taskName": "MPC计算任务1",
    "computeType": "MPC",

    "algorithmId": "SPDZ-v1.0",
    "algorithmName": "SPDZ协议算法",
    "algorithmVersion": "v1.0",
    "algorithmParams": {
      "iterationCount": 100,
      "securityLevel": "high",
      "enableOptimization": true
    },

    "dataProviderList": [...],
    "modelProviderList": [...],
    "computeProviderList": [...],
    "resultConsumerList": [...]
  }]
}
```

## 存储实现

### 内存存储

使用 Map 进行内存缓存：

```typescript
// 算法缓存
const algorithmCache = new Map<string, Algorithm>()

// 按类型索引
const algorithmTypeIndex = new Map<AlgorithmType, Algorithm[]>()
```

### 持久化

通过 JSON 导出/导入实现：

```typescript
// 导出时包含算法配置
interface ExportData {
  algorithms: Algorithm[]      // 算法列表
  graph: GraphData            // 流程图数据 (包含任务算法配置)
}
```
