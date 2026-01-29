# Data Model: DAG隐私计算任务编排系统

**Feature**: DAG任务编排 | **Date**: 2026-01-29 | **Status**: Final

## Overview

本文档定义DAG任务编排系统的核心数据实体、关系和验证规则。

---

## Entity Relationship Diagram

```
┌──────────────────┐     连接      ┌──────────────────┐
│  DataSourceNode  │──────────────>│  ComputeTaskNode │
└──────────────────┘               └────────┬─────────┘
                                            │
                                            │ 连接
                                            ▼
                                   ┌──────────────────┐
                                   │ OutputDataNode   │
                                   └──────────────────┘

┌──────────────────┐     连接      ┌──────────────────┐
│    ModelNode     │──────────────>│  ComputeTaskNode │
└──────────────────┘               └──────────────────┘

┌──────────────────┐     连接      ┌──────────────────┐
│ ComputeResource  │──────────────>│  ComputeTaskNode │
│     Node         │               └──────────────────┘
└──────────────────┘
```

---

## Core Entities

### 1. ComputeTaskNode (计算任务节点)

表示隐私计算任务，支持PSI/PIR/MPC三种类型。

```typescript
interface ComputeTaskNodeData {
  // 基础信息
  id: string
  label: string
  computeType: 'PSI' | 'PIR' | 'MPC' | 'CONCAT'
  techPath: 'software' | 'tee'  // 技术路径，一经选定不可更改

  // 输入数据配置
  inputProviders: InputProvider[]

  // Join条件
  joinConditions: JoinCondition[]

  // 计算模型配置
  models: ComputeModel[]

  // MPC表达式（仅MPC类型且techPath=software时使用）
  expression?: string

  // 算力资源配置
  computeProviders: ComputeResource[]

  // 输出数据配置
  outputs: OutputDataConfig[]
}

interface InputProvider {
  sourceNodeId: string           // 数据源节点ID或输出节点ID
  sourceType: 'dataSource' | 'outputData'
  participantId: string
  dataset: string
  fields: FieldMapping[]         // 选定的字段列表
  joinFields: string[]          // 作为join条件的字段名
}

interface FieldMapping {
  columnName: string            // 原始字段名
  columnAlias: string           // 别名（默认=columnName）
  columnType: string            // varchar/int/bigint等
  isJoinField: boolean          // 是否为join字段
  joinType?: 'INNER' | 'CROSS'  // join字段类型
}

interface JoinCondition {
  joinType: 'INNER' | 'CROSS'
  operands: JoinOperand[]       // 至少2个
}

interface JoinOperand {
  participantId: string
  dataset: string
  columnNames: string[]         // 参与join的字段列表
}

interface ComputeModel {
  id: string                    // 模型唯一ID
  type: 'expression' | 'CodeBin-V2' | 'CodeBin-V3-1' | 'CodeBin-V3-2' | 'SPDZ'
  participantId: string         // 所属企业
  name: string
  parameters?: ModelParameter[]  // 非表达式模型的参数映射
}

interface ModelParameter {
  name: string                  // 参数名
  bindingType: 'field' | 'fixed'  // 绑定类型
  fieldRef?: string            // 绑定的字段引用（participantId.dataset.columnName）
  fixedValue?: string          // 固定值
}

interface ComputeResource {
  id: string                    // 算力资源唯一ID
  participantId: string         // 所属企业
  groupId: string
  groupName: string
  nodeId: string
  cardSerial: string
  cardModel: string
}

interface OutputDataConfig {
  id: string                    // 输出配置唯一ID
  participantId: string         // 接收输出结果的参与方企业
  dataset: string               // 输出数据集名称
  outputFields: OutputField[]   // 输出字段列表
  outputNodeId: string          // 关联的输出数据节点ID
}

interface OutputField {
  source: 'input' | 'model'     // 字段来源
  columnName: string            // 字段名或表达式
  columnAlias: string
  columnType: string
}
```

**Validation Rules**:
- `computeType`和`techPath`组合必须有效（PSI+tee → TEE_PSI）
- 至少有1个`inputProvider`，每个至少1个`field`
- `joinFields`不能为空
- `outputs`可以为空（中间任务），但最终任务必须有输出

**State Transitions**:
```
[创建] → [配置输入] → [配置模型] → [配置算力] → [配置输出] → [完成]
```

---

### 2. ModelNode (计算模型节点)

表示连接到计算任务的计算模型子节点。

```typescript
interface ModelNodeData {
  id: string
  label: string
  modelType: 'expression' | 'CodeBin-V2' | 'CodeBin-V3-1' | 'CodeBin-V3-2' | 'SPDZ'
  parentTaskId: string          // 所属计算任务ID
  participantId: string
  modelName: string
}
```

**Lifecycle**:
- 依附于父计算任务
- 连线删除时弹出确认，确认后删除

---

### 3. ComputeResourceNode (算力资源节点)

表示连接到计算任务的算力资源子节点。

```typescript
interface ComputeResourceNodeData {
  id: string
  label: string
  resourceType: 'TEE'
  parentTaskId: string          // 所属计算任务ID
  participantId: string
  groupName: string
  cardSerial: string
}
```

**Lifecycle**:
- 依附于父计算任务
- 连线删除时弹出确认，确认后删除

---

### 4. OutputDataNode (输出数据节点)

表示计算任务的输出结果节点，可作为其他任务的输入。

```typescript
interface OutputDataNodeData {
  id: string
  label: string
  parentTaskId: string          // 所属计算任务ID
  participantId: string         // 接收输出的企业
  dataset: string               // 输出数据集名称
  fields: OutputField[]         // 输出字段列表
}
```

**Lifecycle**:
- 从属于父计算任务
- 父任务删除时自动删除
- 连线删除时自动删除

---

### 5. LocalTaskNode (本地结果处理任务)

特殊的计算任务，computeType固定为"CONCAT"。

```typescript
interface LocalTaskNodeData extends Omit<ComputeTaskNodeData, 'computeType' | 'techPath'> {
  computeType: 'CONCAT'
  participantId: string         // 必选：执行本地任务的参与方企业
}
```

**Special Rules**:
- `techPath`不适用（CONCAT无技术路径概念）
- 必须指定`participantId`
- 仅支持从其他任务的输出节点接收输入

---

## Collection Types

### 企业排序优先级

```typescript
enum ResourceTypePriority {
  DATA = 3,      // 数据资源所属企业
  MODEL = 2,     // 模型所属企业
  COMPUTE = 1,   // 算力所属企业
  OTHER = 0      // 其他企业
}

interface EnterpriseOption {
  id: string
  name: string
  resourceType: ResourceTypePriority
}
```

---

## Export JSON Schema

最终导出的JSON结构（参考样例格式）：

```typescript
interface ExportJson {
  jobId: string
  name: string
  description: string
  status: number
  serviceType: number
  createParticipantId: string
  modelType: number
  tlsEnable: boolean
  assetDetailList: AssetDetail[]
  participantList: Participant[]
  taskList: Task[]
}

interface Task {
  kind: 'Task'
  taskId: string
  name: string
  taskSrcIdList?: string[]      // 依赖的任务ID列表
  isFinalTask: boolean
  serviceType: number
  computeType: ComputeType
  implementation: string
  joinConditionList?: JoinCondition[]
  dataProviderList: DataProvider[]
  resultConsumerList?: ResultConsumer[]
  participantList: Participant[]
  expressionList?: Expression[]
  computeProviderList?: ComputeProvider[]
  modelProviderList?: ModelProvider[]
}

type ComputeType =
  | 'PSI' | 'TEE_PSI'
  | 'PIR' | 'TEE_PIR'
  | 'MPC' | 'TEE_MPC'
  | 'CONCAT'
```

**Mapping Rules**:
- `computeType` = `{taskType}_{techPath}` (PSI + software → PSI, PSI + tee → TEE_PSI)
- `taskSrcIdList` = 从输入连线推断（上游任务ID列表）
- `dataProviderList` = 从`inputProviders`转换
- `joinConditionList` = 从`joinConditions`转换
- `modelProviderList` = 从`models`转换（expression类型除外）
- `expressionList` = 从`expression`字段转换（仅MPC+software）
- `computeProviderList` = 从`computeProviders`转换
- `resultConsumerList` = 从`outputs`转换

---

## State Management

### Graph State

```typescript
interface GraphState {
  nodes: Map<string, Node>
  edges: Map<string, Edge>
  selectedNodeId: string | null
  detailViewMode: 'detail' | 'preview'
}

// Actions
interface GraphActions {
  addNode(node: Node): void
  removeNode(id: string): void
  updateNode(id: string, data: Partial<NodeData>): void
  addEdge(edge: Edge): void
  removeEdge(id: string): void
  setSelectedNode(id: string | null): void
  setDetailViewMode(mode: 'detail' | 'preview'): void
  exportJson(): ExportJson
}
```

---

## Validation Functions

```typescript
// 连线验证
function isValidConnection(
  sourceType: NodeType,
  targetType: NodeType
): boolean {
  const validConnections = {
    dataSource: ['computeTask', 'localTask'],
    outputData: ['computeTask', 'localTask'],
    computeTask: [],  // 计算任务输出通过OutputDataNode
    modelNode: ['computeTask'],
    computeResource: ['computeTask'],
    localTask: []
  }

  return validConnections[sourceType]?.includes(targetType) ?? false
}

// 循环依赖检测
function hasCycle(
  nodes: Node[],
  edges: Edge[],
  newEdge: Edge
): boolean {
  // 使用DFS检测是否有环
  const graph = buildGraph(nodes, edges, newEdge)
  return detectCycleDFS(graph)
}

// 配置完整性检查
function validateTaskConfig(task: ComputeTaskNode): ValidationResult {
  const errors: string[] = []

  if (task.inputProviders.length === 0) {
    errors.push('至少需要配置一个输入数据源')
  }

  const hasJoinField = task.inputProviders.some(p =>
    p.fields.some(f => f.isJoinField)
  )
  if (!hasJoinField) {
    errors.push('至少需要选择一个join字段')
  }

  if (task.models.length === 0 && !task.expression) {
    errors.push('需要配置计算模型或表达式')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
```

---

## Summary

| 实体 | 作用 | 关键属性 |
|------|------|----------|
| ComputeTaskNode | 计算任务 | computeType, techPath, inputs, models, computes, outputs |
| ModelNode | 计算模型 | type, parentTaskId |
| ComputeResourceNode | 算力资源 | resourceType, parentTaskId |
| OutputDataNode | 输出数据 | parentTaskId, fields |
| LocalTaskNode | 本地任务 | computeType=CONCAT |

**下一步**: 生成contracts/契约文档
