# FL Task API Contracts

**Date**: 2026-03-27
**Branch**: `006-fl-task-restructure`

## 1. 模型列表 API

### GET /api/fl/models

获取已部署的联邦学习模型列表， 用于推断任务选择模型。

**Request:**
```typescript
interface GetFLModelsRequest {
  taskType: 'horizontal' | 'vertical'  // 任务类型
  modelType?: string                       // 模型类型（可选）
}
```

**Response:**
```typescript
interface GetFLModelsResponse {
  success: boolean
  data: DeployedModel[]
  message?: string
}

interface DeployedModel {
  modelId: string           // 模型ID
  modelName: string         // 模型名称
  modelType: string         // 模型类型（horizontal/vertical）
  participants: string[]     // 训练参与方ID列表
  createdAt: string         // 创建时间
}
```

**Example:**
```json
{
  "success": true,
  "data": [
    {
      "modelId": "model_001",
      "modelName": "用户信用评分模型-v1",
      "modelType": "horizontal",
      "participants": ["ent_001", "ent_002"],
      "createdAt": "2026-03-01"
    }
  ]
}
```

## 2. 任务参数模板 API

### GET /api/fl/task-templates

获取所有任务参数模板。

**Response:**
```typescript
interface GetTaskTemplatesResponse {
  success: boolean
  data: FLTaskParameterTemplate[]
  message?: string
}
```

### GET /api/fl/task-templates/:taskName

获取指定任务的参数模板。

**Response:**
```typescript
interface GetTaskTemplateResponse {
  success: boolean
  data: FLTaskParameterTemplate
  message?: string
}
```

## 3. Mock 实现说明

在前端自治原则下， 所有 API 调用必须有对应的 Mock 实现。

**Mock 文件位置**: `src/utils/mock-fl-data.ts`

**Mock 函数**:
```typescript
// 获取已部署模型列表
export function getDeployedModels(
  taskType: 'horizontal' | 'vertical',
  modelType?: string
): Promise<DeployedModel[]>

// 获取任务参数模板
export function getTaskTemplate(
  taskName: string
): Promise<FLTaskParameterTemplate | undefined>

// 获取所有任务模板
export function getAllTaskTemplates(): Promise<FLTaskParameterTemplate[]>
```

## 4. 错误处理

### 错误响应格式

```typescript
interface ErrorResponse {
  success: false
  message: string
  code?: number
}
```

### 常见错误码

| 错误码 | 说明 |
|-------|------|
| 404 | 任务模板不存在 |
| 400 | 请求参数无效 |
| 500 | 服务器内部错误 |

## 5. 前端 Mock 数据

项目使用本地 Mock 数据， 不依赖真实后端服务。

**Mock 数据位置**: `src/utils/mock-fl-data.ts`

**Mock 数据示例**:
```typescript
export const DEPLOYED_MODELS: DeployedModel[] = [
  {
    modelId: 'model_001',
    modelName: '用户信用评分模型-v1',
    modelType: 'horizontal',
    participants: ['ent_001', 'ent_002'],
    createdAt: '2026-03-01'
  },
  // ... 更多模型
]
```
