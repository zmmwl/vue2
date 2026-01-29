# DAG 到 JSON 转换规范

**版本**: 1.0.0
**创建日期**: 2026-01-30
**用途**: 定义隐私计算 DAG 流程图转换为标准 JSON 格式的规则

---

## 概述

本文档定义了将隐私计算 DAG 流程图（基于 Vue Flow）转换为标准 JSON 格式的转换规则。该 JSON 格式用于提交到后端隐私计算服务执行任务。

---

## 输入格式

### 节点 (Node)

```typescript
interface Node {
  id: string                    // 节点唯一标识
  type: string                  // 节点类型
  position: { x: number; y: number }
  data: NodeData                // 节点数据
}
```

### 连接线 (Edge)

```typescript
interface Edge {
  id: string                    // 连接线唯一标识
  source: string                // 源节点 ID
  target: string                // 目标节点 ID
  sourceHandle: string          // 源 handle ID
  targetHandle: string          // 目标 handle ID
}
```

---

## 输出格式

### 顶层结构

```typescript
interface ExportJson {
  jobId: string                 // 任务 ID (UUID)
  taskList: Task[]              // 任务列表
  dataProviderList: DataProvider[]  // 数据提供方列表
  joinConditionList: JoinCondition[] // Join 条件列表
  modelProviderList: ModelProvider[] // 模型提供方列表
  expressionList: Expression[]  // 表达式列表
  computeProviderList: ComputeProvider[] // 算力提供方列表
  resultConsumerList: ResultConsumer[] // 结果消费方列表
}
```

### 任务 (Task)

```typescript
interface Task {
  taskId: string                // 任务 ID (节点 ID)
  computeType: ComputeType      // 计算类型 (PSI | PIR | MPC | TEE_PSI | TEE_PIR | TEE_MPC | CONCAT)
  isFinalTask: boolean          // 是否最终任务
  inputs: TaskInput[]           // 输入列表
}
```

#### 计算类型映射

| 任务类型 | 技术路径 | 计算类型 (computeType) |
|---------|---------|----------------------|
| PSI | software | PSI |
| PSI | tee | TEE_PSI |
| PIR | software | PIR |
| PIR | tee | TEE_PIR |
| MPC | software | MPC |
| MPC | tee | TEE_MPC |
| 本地结果处理 | - | CONCAT (isFinalTask: true) |

### 数据提供方 (DataProvider)

```typescript
interface DataProvider {
  participantId: string         // 参与方 ID
  dataset: string               // 数据集名称
  columns: Column[]             // 列信息
}
```

### Join 条件 (JoinCondition)

```typescript
interface JoinCondition {
  joinType: 'INNER' | 'CROSS'   // 连接类型
  operands: JoinOperand[]       // 操作数列表
}

interface JoinOperand {
  participantId: string
  dataset: string
  columnNames: string[]         // 连接字段名列表
}
```

### 模型提供方 (ModelProvider)

```typescript
interface ModelProvider {
  participantId: string         // 参与方 ID
  modelType: string             // 模型类型
  modelContent?: string         // 模型内容 (表达式或其他)
}
```

### 表达式 (Expression)

```typescript
interface Expression {
  expressionId: string          // 表达式 ID
  expressionContent: string     // 表达式内容
}
```

### 算力提供方 (ComputeProvider)

```typescript
interface ComputeProvider {
  participantId: string         // 参与方 ID
  cpu: number                   // CPU 核心数
  memory: number                // 内存 (GB)
  gpu?: number                  // GPU 数量 (可选)
  gpuType?: string              // GPU 类型 (可选)
}
```

### 结果消费方 (ResultConsumer)

```typescript
interface ResultConsumer {
  participantId: string         // 参与方 ID
  dataset: string               // 输出数据集名称
  columns: Column[]             // 输出列信息
}
```

### 列信息 (Column)

```typescript
interface Column {
  columnName: string            // 列名
  columnAlias?: string          // 列别名 (可选)
  columnType: string            // 列类型
}
```

---

## 转换规则

### 1. 任务提取 (buildTaskList)

从所有计算任务节点和本地任务节点中提取任务信息：

1. **计算任务节点** (`type: 'compute_task'`)
   - 设置 `computeType` = `getComputeType(taskType, techPath)`
   - 设置 `isFinalTask` = `false`
   - 从 `inputProviders` 构建 `inputs`

2. **本地任务节点** (`type: 'local_task'`)
   - 设置 `computeType` = `"CONCAT"`
   - 设置 `isFinalTask` = `true`
   - 从 `inputProviders` 构建 `inputs`

### 2. 数据提供方提取 (buildDataProviderList)

从计算任务节点的 `inputProviders` 中提取：

```typescript
inputProviders: {
  sourceType: 'dataSource',
  participantId: string,
  dataset: string,
  fields: Array<{
    columnName: string,
    columnAlias: string,
    columnType: string
  }>
}
```

转换为：

```typescript
DataProvider {
  participantId,
  dataset,
  columns: fields.map(f => ({
    columnName: f.columnName,
    columnAlias: f.columnAlias || f.columnName,
    columnType: f.columnType
  }))
}
```

### 3. Join 条件提取 (buildJoinConditionList)

从计算任务节点的 `joinConditions` 中直接提取。

### 4. 模型提供方提取 (buildModelProviderList)

从计算任务节点的 `models` 中提取：

```typescript
models: Array<{
  modelType: string,
  participantId: string,
  expression?: string,
  modelId?: string
}>
```

对于表达式模型 (`modelType: 'expression'`)，还需要生成 `expressionList`。

### 5. 表达式提取 (buildExpressionList)

从表达式模型中提取：

```typescript
Expression {
  expressionId: `expr_${modelId}_${index}`,
  expressionContent: model.expression
}
```

### 6. 算力提供方提取 (buildComputeProviderList)

从计算任务节点的 `computeProviders` 中提取：

```typescript
computeProviders: Array<{
  participantId: string,
  cpu: number,
  memory: number,
  gpu?: number,
  gpuType?: string
}>
```

### 7. 结果消费方提取 (buildResultConsumerList)

从计算任务节点的 `outputs` 中提取：

```typescript
outputs: Array<{
  participantId: string,
  dataset: string,
  outputFields: Array<{
    columnName: string,
    columnAlias: string,
    columnType: string,
    source: 'input' | 'model'
  }>
}>
```

---

## 示例

### 输入：DAG 流程图

```json
{
  "nodes": [
    {
      "id": "node_1",
      "type": "data_source",
      "position": { "x": 100, "y": 100 },
      "data": {
        "label": "数据源A",
        "category": "data_source",
        "assetInfo": {
          "participantId": "company_a",
          "dataInfo": { "tableName": "table_a" }
        }
      }
    },
    {
      "id": "node_2",
      "type": "compute_task",
      "position": { "x": 100, "y": 300 },
      "data": {
        "label": "PSI 计算",
        "category": "compute_task",
        "computeType": "PSI",
        "techPath": "software",
        "inputProviders": [
          {
            "sourceNodeId": "node_1",
            "participantId": "company_a",
            "dataset": "table_a",
            "fields": [
              { "columnName": "id", "columnAlias": "id", "columnType": "int", "isJoinField": true, "joinType": "INNER" }
            ]
          }
        ],
        "joinConditions": [
          {
            "joinType": "INNER",
            "operands": [
              { "participantId": "company_a", "dataset": "table_a", "columnNames": ["id"] }
            ]
          }
        ]
      }
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "source": "node_1",
      "target": "node_2",
      "sourceHandle": "output",
      "targetHandle": "input"
    }
  ]
}
```

### 输出：标准 JSON

```json
{
  "jobId": "job_1234567890",
  "taskList": [
    {
      "taskId": "node_2",
      "computeType": "PSI",
      "isFinalTask": false,
      "inputs": [
        {
          "dataProviderId": 0,
          "inputId": "input_0"
        }
      ]
    }
  ],
  "dataProviderList": [
    {
      "participantId": "company_a",
      "dataset": "table_a",
      "columns": [
        { "columnName": "id", "columnAlias": "id", "columnType": "int" }
      ]
    }
  ],
  "joinConditionList": [
    {
      "joinType": "INNER",
      "operands": [
        { "participantId": "company_a", "dataset": "table_a", "columnNames": ["id"] }
      ]
    }
  ],
  "modelProviderList": [],
  "expressionList": [],
  "computeProviderList": [],
  "resultConsumerList": []
}
```

---

## 验证规则

导出前需要验证以下规则：

1. **输入验证**
   - 每个计算任务至少有一个输入数据源
   - 输入字段配置完整

2. **模型验证**（如适用）
   - 如果任务需要模型，必须配置至少一个模型
   - 表达式模型必须有有效的表达式内容

3. **算力验证**（如适用）
   - 如果任务需要算力，必须配置至少一个算力资源
   - CPU 和内存值必须大于 0

4. **输出验证**
   - 每个计算任务至少有一个输出配置

---

## 实现位置

- **转换逻辑**: `src/utils/dag-export.ts`
- **验证逻辑**: `src/utils/dag-export.ts` - `validateExportConfig()`
- **使用位置**: `src/components/Flow/FlowCanvas.vue` - `handleExport()`

---

## 更新日志

| 版本 | 日期 | 更新内容 |
|------|------|---------|
| 1.0.0 | 2026-01-30 | 初始版本 |
