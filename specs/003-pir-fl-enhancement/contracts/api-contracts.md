# API Contracts: 隐匿查询功能完善与联邦学习任务上线

**Date**: 2026-02-21
**Feature**: 003-pir-fl-enhancement

## 1. 已部署模型列表 API

### Endpoint
```
GET /api/v1/deployed-models
```

### Description
获取可用于推断的已部署模型列表。

### Request
```typescript
interface GetDeployedModelsRequest {
  // 可选过滤参数
  type?: 'horizontal' | 'vertical'  // 按模型类型过滤
  participantId?: string            // 按参与方过滤
}
```

### Response
```typescript
interface DeployedModel {
  id: string
  name: string
  version: string
  type: string                      // 模型类型，如 'horizontal_lr'
  trainingParticipants: string[]    // 训练参与方ID列表
  entityName?: string               // 模型所属企业名称
  createdAt: string
  description?: string
}

interface GetDeployedModelsResponse {
  code: number
  data: DeployedModel[]
  message?: string
}
```

### Mock Response
```json
{
  "code": 0,
  "data": [
    {
      "id": "model_001",
      "name": "用户信用评分模型-v1",
      "version": "1.0.0",
      "type": "horizontal_lr",
      "trainingParticipants": ["ent_001", "ent_002"],
      "entityName": "数据提供商A",
      "createdAt": "2026-02-01T10:00:00Z"
    }
  ]
}
```

---

## 2. FL任务参数模板 API

### Endpoint
```
GET /api/v1/fl-tasks/{taskName}/parameters
```

### Description
获取指定联邦学习任务的参数配置模板。

### Path Parameters
- `taskName`: 任务名称，如 `logistic_regression`, `secureboost`

### Response
```typescript
interface FLTaskParameterTemplate {
  taskName: string
  displayName: string
  category: 'preprocess' | 'feature_engineering' | 'horizontal' | 'vertical'
  parameters: FLTaskParameterDef[]
}

interface GetFLTaskParametersResponse {
  code: number
  data: FLTaskParameterTemplate
  message?: string
}
```

### Mock Response
```json
{
  "code": 0,
  "data": {
    "taskName": "logistic_regression",
    "displayName": "逻辑回归",
    "category": "horizontal",
    "parameters": [
      {
        "name": "learningRate",
        "displayName": "学习率",
        "dataType": "number",
        "required": true,
        "defaultValue": 0.01,
        "validation": { "min": 0.0001, "max": 1 }
      },
      {
        "name": "iterations",
        "displayName": "迭代次数",
        "dataType": "number",
        "required": true,
        "defaultValue": 100,
        "validation": { "min": 1, "max": 10000 }
      }
    ]
  }
}
```

---

## 3. DAG导出格式扩展

### Export Format
PIR和FL任务节点的导出JSON格式。

### PIR Task Node Export
```typescript
interface ExportedPIRTaskNode {
  id: string
  type: 'compute_task'
  taskType: 'PIR'
  position: { x: number; y: number }
  data: {
    label: string
    preloadDataSource: {
      participantId: string
      dataset: string
      fields: FieldMapping[]
    }
    realtimeDataSource: {
      sourceType: 'connection' | 'manual'
      fields: RealtimeFieldInfo[]
      sourceNodeId?: string
    }
    outputs: PIROutputConfig[]
  }
}
```

### FL Task Node Export
```typescript
interface ExportedFLTaskNode {
  id: string
  type: 'fl_task'
  position: { x: number; y: number }
  data: {
    label: string
    flCategory: FLTaskCategory
    taskName: string
    mode: FLMode
    inputProviders: InputProvider[]
    parameters: FLTaskParameters
    deployedModel?: DeployedModelInfo
    outputs?: OutputDataConfig[]
  }
}
```

---

## 4. Mock Data Implementation

### File Location
`src/utils/mock-fl-data.ts`

### Mock Data Structure
```typescript
// 已部署模型Mock
export const MOCK_DEPLOYED_MODELS: DeployedModel[] = [
  {
    id: 'model_001',
    name: '用户信用评分模型-v1',
    version: '1.0.0',
    type: 'horizontal_lr',
    trainingParticipants: ['ent_001', 'ent_002'],
    entityName: '数据提供商A',
    createdAt: '2026-02-01T10:00:00Z'
  },
  {
    id: 'model_002',
    name: '欺诈检测模型-v2',
    version: '2.1.0',
    type: 'vertical_secureboost',
    trainingParticipants: ['ent_001', 'ent_003'],
    entityName: '数据提供商B',
    createdAt: '2026-01-15T08:30:00Z'
  }
]

// FL任务参数模板Mock
export const MOCK_FL_PARAMETER_TEMPLATES: Record<string, FLTaskParameterTemplate> = {
  'logistic_regression': {
    taskName: 'logistic_regression',
    displayName: '逻辑回归',
    category: 'horizontal',
    parameters: [
      // ... 参数定义
    ]
  },
  // ... 其他任务模板
}
```

### Mock Service
```typescript
// src/services/mock-fl-api.ts
export async function getDeployedModels(): Promise<DeployedModel[]> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 200))
  return MOCK_DEPLOYED_MODELS
}

export async function getFLTaskParameters(taskName: string): Promise<FLTaskParameterTemplate> {
  await new Promise(resolve => setTimeout(resolve, 100))
  return MOCK_FL_PARAMETER_TEMPLATES[taskName]
}
```
