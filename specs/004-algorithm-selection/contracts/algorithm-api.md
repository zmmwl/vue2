# Algorithm API Contract

**Version**: 1.0.0
**Date**: 2026-02-28
**Feature**: 004-algorithm-selection

## 概述

本文档定义算法管理服务的API接口契约。所有接口均为Mock实现，模拟后端服务行为。

## 基础信息

- **Base URL**: `/api/algorithms` (Mock)
- **Content-Type**: `application/json`
- **认证**: 无 (Mock场景)

---

## API 端点

### 1. 获取算法列表

获取所有已注册算法的列表，支持分页和筛选。

**Request**
```
GET /api/algorithms
```

**Query Parameters**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 否 | 算法类型过滤 |
| keyword | string | 否 | 名称关键字搜索 |
| page | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认20 |

**Response**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 15,
    "page": 1,
    "pageSize": 20,
    "list": [
      {
        "id": "SPDZ-v1.0",
        "name": "SPDZ协议算法",
        "nameEn": "SPDZ",
        "version": "v1.0",
        "description": "基于秘密分享的安全多方计算协议",
        "type": "MPC",
        "paramTemplate": [...],
        "createdAt": 1709078400000
      }
    ]
  }
}
```

---

### 2. 获取单个算法

根据ID获取算法详情。

**Request**
```
GET /api/algorithms/:id
```

**Path Parameters**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 算法ID |

**Response**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "SPDZ-v1.0",
    "name": "SPDZ协议算法",
    "nameEn": "SPDZ",
    "version": "v1.0",
    "description": "基于秘密分享的安全多方计算协议",
    "type": "MPC",
    "paramTemplate": [
      {
        "key": "iterationCount",
        "label": "迭代次数",
        "type": "integer",
        "required": true,
        "validation": {
          "min": 1,
          "max": 10000
        },
        "defaultValue": 100,
        "order": 1
      }
    ],
    "createdAt": 1709078400000
  }
}
```

**Error Response**
```json
{
  "code": 404,
  "message": "算法不存在",
  "data": null
}
```

---

### 3. 根据类型获取可用算法

获取指定类型的所有可用算法，用于任务编排时的算法选择。

**Request**
```
GET /api/algorithms/by-type/:type
```

**Path Parameters**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | 算法类型 (MPC/TEE_MPC/PSI等) |

**Response**
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": "SPDZ-v1.0",
      "name": "SPDZ协议算法",
      "version": "v1.0",
      "type": "MPC",
      "createdAt": 1709078400000
    },
    {
      "id": "ABY3-v1.0",
      "name": "ABY3协议算法",
      "version": "v1.0",
      "type": "MPC",
      "createdAt": 1709164800000
    }
  ]
}
```

---

### 4. 获取默认算法

获取指定类型的默认算法（创建时间最新的算法）。

**Request**
```
GET /api/algorithms/default/:type
```

**Path Parameters**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 是 | 算法类型 |

**Response**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "ABY3-v1.0",
    "name": "ABY3协议算法",
    "nameEn": "ABY3",
    "version": "v1.0",
    "type": "MPC",
    "paramTemplate": [...],
    "createdAt": 1709164800000
  }
}
```

**Error Response (无可用算法)**
```json
{
  "code": 404,
  "message": "该类型暂无可用算法",
  "data": null
}
```

---

### 5. 创建算法

注册新算法。

**Request**
```
POST /api/algorithms
```

**Request Body**
```json
{
  "name": "SPDZ协议算法",
  "nameEn": "SPDZ",
  "version": "v1.0",
  "description": "基于秘密分享的安全多方计算协议",
  "type": "MPC",
  "paramTemplate": [
    {
      "key": "iterationCount",
      "label": "迭代次数",
      "type": "integer",
      "required": true,
      "validation": {
        "min": 1,
        "max": 10000
      },
      "defaultValue": 100,
      "order": 1
    }
  ]
}
```

**Response**
```json
{
  "code": 0,
  "message": "创建成功",
  "data": {
    "id": "SPDZ-v1.0",
    "name": "SPDZ协议算法",
    "nameEn": "SPDZ",
    "version": "v1.0",
    "type": "MPC",
    "paramTemplate": [...],
    "createdAt": 1709251200000
  }
}
```

**Validation Errors**
```json
{
  "code": 400,
  "message": "验证失败",
  "data": {
    "errors": [
      { "field": "nameEn", "message": "英文名称只能包含字母数字下划线" },
      { "field": "version", "message": "版本号格式错误，应为 vX.Y 格式" }
    ]
  }
}
```

**Conflict Error**
```json
{
  "code": 409,
  "message": "算法ID已存在",
  "data": null
}
```

---

### 6. 更新算法

更新现有算法信息。

**Request**
```
PUT /api/algorithms/:id
```

**Path Parameters**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 算法ID |

**Request Body**
```json
{
  "name": "SPDZ协议算法(优化版)",
  "description": "基于秘密分享的安全多方计算协议 - 优化版本",
  "paramTemplate": [...]
}
```

**Response**
```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "id": "SPDZ-v1.0",
    "name": "SPDZ协议算法(优化版)",
    "updatedAt": 1709337600000
  }
}
```

---

### 7. 删除算法

删除指定算法。

**Request**
```
DELETE /api/algorithms/:id
```

**Path Parameters**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 算法ID |

**Response (成功)**
```json
{
  "code": 0,
  "message": "删除成功",
  "data": null
}
```

**Error Response (算法被使用)**
```json
{
  "code": 409,
  "message": "该算法正在被任务使用，无法删除",
  "data": {
    "usedByTaskIds": ["task-001", "task-003"]
  }
}
```

---

### 8. 检查算法使用情况

检查指定算法是否被任务使用。

**Request**
```
GET /api/algorithms/:id/usage
```

**Path Parameters**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 算法ID |

**Response**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "isUsed": true,
    "usedByTaskCount": 2,
    "usedByTasks": [
      {
        "taskId": "task-001",
        "taskName": "MPC计算任务1"
      },
      {
        "taskId": "task-003",
        "taskName": "MPC计算任务3"
      }
    ]
  }
}
```

---

## 类型定义

```typescript
// API响应包装
interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// 分页响应
interface PagedResponse<T> {
  total: number
  page: number
  pageSize: number
  list: T[]
}

// 算法类型枚举
enum AlgorithmType {
  PSI = 'PSI',
  TEE_PSI = 'TEE_PSI',
  PIR = 'PIR',
  TEE_PIR = 'TEE_PIR',
  MPC = 'MPC',
  TEE_MPC = 'TEE_MPC',
  FL = 'FL',
  TEE_FL = 'TEE_FL'
}

// 参数类型枚举
enum ParamType {
  STRING = 'string',
  INTEGER = 'integer',
  FLOAT = 'float',
  BOOLEAN = 'boolean',
  ENUM = 'enum',
  DATE = 'date',
  JSON = 'json',
  ARRAY = 'array'
}
```

---

## Mock实现要求

1. **延迟模拟**: 所有API响应延迟100-300ms，模拟网络延迟
2. **数据持久化**: 内存存储，刷新后重置为初始状态
3. **ID生成**: 自动生成 `{nameEn}-{version}` 格式的ID
4. **时间戳**: 创建时自动生成 `createdAt` 字段
5. **验证**: 完整的输入验证，返回适当的错误码

---

## 错误码

| Code | 说明 |
|------|------|
| 0 | 成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如ID重复、被引用等） |
| 500 | 服务器内部错误 |
