# DAG到JSON转换规则规范

**Version**: 1.0.0
**Created**: 2026-01-30
**Feature**: DAG隐私计算任务编排系统 (002-dag-task-orchestration)

## 概述

本文档定义了将前端DAG流程图转换为后端标准JSON格式的完整规则。转换逻辑实现在 `src/utils/dag-export.ts` 中。

---

## JSON结构定义

### 顶层结构

```typescript
interface ExportJson {
  jobId: string              // 唯一任务ID，格式: "job-{timestamp}-{random}"
  name: string               // 任务名称，默认为"隐私计算任务"
  description: string        // 任务描述
  status: number             // 任务状态，固定为0
  serviceType: number        // 服务类型，固定为0
  createParticipantId: string // 创建者ID
  modelType: number          // 模型类型，固定为0
  tlsEnable: boolean         // TLS启用状态，默认false
  assetDetailList: AssetDetail[]     // 资产详情列表（数据源字段信息）
  participantList: Participant[]     // 参与方企业列表
  taskList: Task[]                   // 任务列表（拓扑排序后）
}
```

---

## 转换步骤

### Step 1: 拓扑排序 (topologicalSort)

**目的**: 确定任务的执行顺序

**算法**:
1. 从所有节点中识别计算任务节点 (type: 'compute_task' 和 type: 'local_task')
2. 构建依赖关系图：从edges中提取任务间的依赖关系
3. 使用Kahn算法进行拓扑排序
4. 返回排序后的任务ID数组

**输入**: `nodes: Node[], edges: Edge[]`
**输出**: `string[]` - 任务ID数组（按执行顺序）

---

### Step 2: 提取参与方 (extractParticipants)

**目的**: 收集所有涉及的企业

**规则**:
1. 遍历所有节点的data属性
2. 从inputProviders中提取参与方
3. 从modelProviders中提取参与方
4. 从computeProviders中提取参与方
5. 从resultConsumers中提取参与方
6. 去重并生成参与者列表

**输入**: `nodes: Node[]`
**输出**: `Participant[]`

---

### Step 3: 构建任务依赖 (getDependencyIds)

**目的**: 确定每个任务的依赖任务

**规则**:
1. 遍历edges，筛选source和target都是计算任务的连线
2. 为每个任务收集其依赖的taskId列表
3. 返回Map<taskId, dependentIds>

**输入**: `nodes: Node[], edges: Edge[]`
**输出**: `Map<string, string[]>`

---

### Step 4: 构建数据提供者列表 (buildDataProviderList)

**目的**: 转换输入数据配置

**字段映射规则**:
- `participantId`: 直接使用
- `entityName`: 企业名称
- `datasetList`:
  - `singleRow`: true (单行数据源)
  - `dataset`: 数据源名称
  - `columnNameList`: 选中的字段名列表
  - `columnAliasList`: 字段别名列表
  - `columnTypeList`: 字段类型列表
  - `customParam`: 空对象 `{}`

**输入**: `inputProviders: InputProvider[]`
**输出**: `DataProvider[]`

---

### Step 5: 构建Join条件 (buildJoinConditions)

**目的**: 转换连线配置的Join条件

**字段映射规则**:
- `joinType`: 'INNER' 或 'CROSS'
- `joinOperands`:
  - `participantId`: 数据所属企业
  - `entityName`: 企业名称
  - `dataset`: 数据源名称
  - `columnNameList`: join字段列表

**注意**: columnNameList使用原始字段名（非别名）

**输入**: `joinConditions: JoinCondition[]`
**输出**: `JoinCondition[]`

---

### Step 6: 构建结果消费者 (buildResultConsumerList)

**目的**: 转换输出数据配置

**字段映射规则**:
- `participantId`: 输出参与方ID
- `entityName`: 企业名称
- `isEncrypted`: false (暂不支持加密配置)
- `datasetList`: 输出字段配置

**输入**: `outputs: OutputData[]`
**输出**: `ResultConsumer[]`

---

### Step 7: 构建模型提供者 (buildModelProviderList)

**目的**: 转换计算模型配置

**排除**: expression类型的模型不在此处理

**字段映射规则**:
- `modelId`: 模型唯一ID
- `participantId`: 模型所属企业
- `entityName`: 企业名称
- `name`: 模型名称
- `type`: 模型类型 (CodeBin-V2, CodeBin-V3-1, etc.)
- `version`: 版本号
- `description`: 描述
- `modelFileName`: 模型文件名
- `methodName`: 方法名称
- `methodDescription`: 方法描述
- `programmingLanguage`: 编程语言
- `onChainContent`: 链上内容
- `modelParameterList`: 参数配置

**输入**: `models: ComputeModel[]`
**输出**: `ModelProvider[]`

---

### Step 8: 构建表达式列表 (buildExpressionList)

**目的**: 转换MPC表达式模型

**字段映射规则**:
- `expressionParamList`: null
- `expression`: Python表达式字符串

**输入**: `expression: string`
**输出**: `Expression[]`

---

### Step 9: 构建算力提供者 (buildComputeProviderList)

**目的**: 转换TEE算力资源配置

**字段映射规则**:
- `groupId`: 算力组ID
- `participantId`: 算力所属企业
- `entityName`: 企业名称
- `groupName`: 算力组名称
- `groupType`: 算力组类型
- `computeNodeList`: 计算节点列表

**输入**: `computeProviders: ComputeResource[]`
**输出**: `ComputeProvider[]`

---

## computeType映射规则

| 任务类型 | 技术路径 | computeType |
|----------|----------|-------------|
| PSI | 软件密码学 | PSI |
| PSI | 硬件TEE | TEE_PSI |
| PIR | 软件密码学 | PIR |
| PIR | 硬件TEE | TEE_PIR |
| MPC | 软件密码学 | MPC |
| MPC | 硬件TEE | TEE_MPC |
| 本地结果处理 | - | CONCAT |

---

## 特殊处理规则

### 1. 表达式模型 (Expression Models)
- 表达式类型模型不生成modelProviderList
- 表达式内容生成到expressionList
- 变量引用格式: `participantId.assetName.columnName`

### 2. 本地结果处理任务 (CONCAT)
- computeType固定为"CONCAT"
- isFinalTask固定为true
- 支持从其他任务的输出节点连线作为输入

### 3. 输出数据节点
- 输出节点从属于父计算任务
- 父任务删除时级联删除输出节点
- 连线删除时自动删除输出节点

---

## 验证规则

### 必填项检查
1. 每个计算任务必须有至少一个输入数据源
2. Join条件必须至少有一个join字段
3. 输出节点必须有输出参与方和输出字段

### 格式验证
1. 所有participantId必须有效
2. 字段名映射必须正确（原始字段名 vs 别名）
3. 循环依赖检测
4. 任务依赖关系完整性

---

## 示例输出

```json
{
  "jobId": "job-1738250000000-abc123",
  "name": "隐私计算任务",
  "description": "DAG编排的隐私计算任务",
  "status": 0,
  "serviceType": 0,
  "createParticipantId": "org1",
  "modelType": 0,
  "tlsEnable": false,
  "assetDetailList": [],
  "participantList": [
    {"participantId": "org1", "entityName": "机构A"},
    {"participantId": "org2", "entityName": "机构B"}
  ],
  "taskList": [
    {
      "kind": "Task",
      "taskId": "task-001",
      "name": "PSI计算任务",
      "computeType": "PSI",
      "isFinalTask": false,
      "dataProviderList": [...],
      "resultConsumerList": [...]
    }
  ]
}
```

---

## 变更历史

| Version | Date | 作者 | 变更说明 |
|---------|------|------|----------|
| 1.0.0 | 2026-01-30 | Claude | 初始版本 |
