# API Contract: 数据资产选择与展示

**Feature Branch**: `001-data-asset-select` | **Date**: 2026-01-22
**Status**: Complete | Phase 1 Output

## Overview

本文档定义数据资产选择与展示功能所需的 API 契约。所有 API 调用必须提供对应的 Mock 实现（前端自治原则）。

---

## Base Configuration

```typescript
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,  // 10 秒超时
  retries: 3,      // 网络错误和超时重试次数
}
```

---

## Endpoints

### 1. 获取企业列表

获取用户可访问的企业及其数据资产列表。

**Endpoint**: `GET /asset/GetEnterpriseList`

**Authentication**: Bearer Token (required)

**Request**:
```typescript
// 无请求参数
// 需要在请求头中包含认证 Token
headers: {
  'Authorization': `Bearer ${token}`
}
```

**Response (200 OK)**:
```typescript
interface GetEnterpriseListResponse {
  code: number           // 状态码，0 表示成功
  message: string        // 响应消息
  data: Enterprise[]     // 企业列表
}

interface Enterprise {
  participantId: string
  entityName: string
  enterpriseAssetList: {
    assetId: string
    assetNumber: string
    assetName: string
    assetEnName?: string
    intro?: string
    holderCompany: string
  }[]
}
```

**Error Responses**:
| HTTP Status | Error Scenario | Response Body |
|-------------|----------------|---------------|
| 401 | Token 无效或过期 | `{ code: 401, message: "登录已过期，请重新登录" }` |
| 403 | 无权限访问 | `{ code: 403, message: "无权限访问企业列表" }` |
| 500 | 服务器内部错误 | `{ code: 500, message: "服务器内部错误" }` |

**Example**:
```typescript
// Request
GET /asset/GetEnterpriseList
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Response
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "participantId": "ent_001",
      "entityName": "某某企业",
      "enterpriseAssetList": [
        {
          "assetId": "asset_001",
          "assetNumber": "AST-2024-001",
          "assetName": "用户行为数据",
          "assetEnName": "user_behavior",
          "intro": "用户点击流数据",
          "holderCompany": "某某企业"
        }
      ]
    }
  ]
}
```

---

### 2. 获取企业数据资产列表

获取指定企业的数据资产列表，用于用户选择具体的数据资产。

**Endpoint**: `GET /asset/GetAssetListByEnterprise`

**Authentication**: Bearer Token (required)

**Request**:
```typescript
interface GetAssetListByEnterpriseRequest {
  participantId: string  // 企业平台 ID
  pageNumber?: number    // 页码（可选，默认 1）
  pageSize?: number      // 每页数量（可选，默认 50，最大 100）
}

// Query 参数
GET /asset/GetAssetListByEnterprise?participantId=ent_001&pageNumber=1&pageSize=50
headers: {
  'Authorization': `Bearer ${token}`
}
```

**Response (200 OK)**:
```typescript
interface GetAssetListByEnterpriseResponse {
  code: number                    // 状态码，0 表示成功
  message: string                 // 响应消息
  data: {
    total: number                 // 总数量
    pageNumber: number            // 当前页码
    pageSize: number              // 每页数量
    totalPages: number            // 总页数
    list: AssetListItem[]         // 数据资产列表
  }
}

interface AssetListItem {
  assetId: string                 // 数据资产唯一标识
  assetNumber: string             // 数据资产编号
  assetName: string               // 数据资产名称
  assetEnName?: string            // 数据资产英文简称（可选）
  intro?: string                  // 资产描述（可选）
  holderCompany: string           // 资产所有者（企业名称）
  scale?: string                  // 数据规模（可选）
  cycle?: string                  // 更新周期（可选）
}
```

**Error Responses**:
| HTTP Status | Error Scenario | Response Body |
|-------------|----------------|---------------|
| 400 | 请求参数错误 | `{ code: 400, message: "participantId 参数不能为空" }` |
| 401 | Token 无效或过期 | `{ code: 401, message: "登录已过期，请重新登录" }` |
| 403 | 无权限访问该企业资产 | `{ code: 403, message: "无权限访问该企业的数据资产" }` |
| 404 | 企业不存在 | `{ code: 404, message: "企业不存在" }` |
| 500 | 服务器内部错误 | `{ code: 500, message: "服务器内部错误" }` |

**Example**:
```typescript
// Request
GET /asset/GetAssetListByEnterprise?participantId=ent_001&pageNumber=1&pageSize=50
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Response
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 150,
    "pageNumber": 1,
    "pageSize": 50,
    "totalPages": 3,
    "list": [
      {
        "assetId": "asset_001",
        "assetNumber": "AST-2024-001",
        "assetName": "用户行为数据",
        "assetEnName": "user_behavior",
        "intro": "用户点击流数据",
        "holderCompany": "某某企业",
        "scale": "1000万条",
        "cycle": "每日"
      },
      {
        "assetId": "asset_002",
        "assetNumber": "AST-2024-002",
        "assetName": "交易数据",
        "assetEnName": "transaction",
        "intro": "用户交易记录",
        "holderCompany": "某某企业",
        "scale": "500万条",
        "cycle": "每周"
      }
    ]
  }
}
```

**Note**: 此接口支持分页，当企业下的数据资产数量较多时，可以分批加载。

---

### 3. 获取数据资产详情

获取指定数据资产的完整信息，包括字段列表。

**Endpoint**: `GET /asset/GetAsset`

**Authentication**: Bearer Token (required)

**Request**:
```typescript
interface GetAssetRequest {
  assetId: string  // 数据资产唯一标识
}

// Query 参数
GET /asset/GetAsset?assetId=asset_001
headers: {
  'Authorization': `Bearer ${token}`
}
```

**Response (200 OK)**:
```typescript
interface GetAssetResponse {
  code: number           // 状态码，0 表示成功
  message: string        // 响应消息
  data: AssetInfo        // 数据资产完整信息
}

interface AssetInfo {
  assetId: string
  assetNumber: string
  assetName: string
  assetEnName?: string
  holderCompany: string
  participantId: string
  entityName: string
  intro?: string
  scale?: string
  cycle?: string
  timeSpan?: string
  dataInfo: {
    databaseName: string
    tableName: string
    fieldList: {
      name: string
      dataType: string
      dataLength?: number
      description?: string
      isPrimaryKey?: boolean
      privacyQuery?: boolean
    }[]
  }
}
```

**Error Responses**:
| HTTP Status | Error Scenario | Response Body |
|-------------|----------------|---------------|
| 400 | 请求参数错误 | `{ code: 400, message: "assetId 参数不能为空" }` |
| 401 | Token 无效或过期 | `{ code: 401, message: "登录已过期，请重新登录" }` |
| 403 | 无权限访问该资产 | `{ code: 403, message: "无权限访问该数据资产" }` |
| 404 | 资产不存在 | `{ code: 404, message: "数据资产不存在" }` |
| 500 | 服务器内部错误 | `{ code: 500, message: "服务器内部错误" }` |

**Example**:
```typescript
// Request
GET /asset/GetAsset?assetId=asset_001
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Response
{
  "code": 0,
  "message": "success",
  "data": {
    "assetId": "asset_001",
    "assetNumber": "AST-2024-001",
    "assetName": "用户行为数据",
    "assetEnName": "user_behavior",
    "holderCompany": "某某企业",
    "participantId": "ent_001",
    "entityName": "某某企业",
    "intro": "用户点击流数据",
    "scale": "1000万条",
    "cycle": "每日",
    "timeSpan": "2024-01-01 至今",
    "dataInfo": {
      "databaseName": "user_db",
      "tableName": "user_behavior",
      "fieldList": [
        {
          "name": "user_id",
          "dataType": "VARCHAR",
          "dataLength": 64,
          "description": "用户 ID",
          "isPrimaryKey": true,
          "privacyQuery": false
        },
        {
          "name": "action_time",
          "dataType": "DATETIME",
          "dataLength": null,
          "description": "操作时间",
          "isPrimaryKey": false,
          "privacyQuery": false
        }
      ]
    }
  }
}
```

---

## Error Handling Strategy

### Error Categories

| 错误类型 | HTTP 状态码 | Axios Code | 处理策略 |
|---------|------------|-----------|---------|
| 网络错误 | - | ERR_NETWORK | 自动重试 2-3 次，指数退避 |
| 超时错误 | - | ECONNABORTED | 自动重试 2-3 次，指数退避 |
| 认证错误 | 401 | - | 不重试，显示"登录已过期" |
| 权限错误 | 403 | - | 不重试，显示"无权限访问" |
| 资源不存在 | 404 | - | 不重试，显示"资源不存在" |
| 业务错误 | 400 | - | 不重试，显示后端错误信息 |
| 服务器错误 | 500, 502, 503 | - | 自动重试 2-3 次，指数退避 |

### Retry Strategy

```typescript
interface RetryConfig {
  maxRetries: 3          // 最大重试次数
  retryDelay: 1000       // 初始重试延迟（毫秒）
  retryMultiplier: 2     // 退避乘数（指数退避）
  retryableErrors: Array<'ERR_NETWORK' | 'ECONNABORTED' | 500 | 502 | 503>
}

// 重试延迟计算：1000ms, 2000ms, 4000ms
```

### Error Response Format

所有错误响应遵循统一格式：

```typescript
interface ErrorResponse {
  code: number           // HTTP 状态码或业务错误码
  message: string        // 用户友好的错误消息
  details?: string       // 详细错误信息（可选，用于调试）
}
```

---

## TypeScript 类型定义

```typescript
// ========== API 请求类型 ==========

interface GetEnterpriseListRequest {
  // 无参数
}

interface GetAssetListByEnterpriseRequest {
  participantId: string
  pageNumber?: number
  pageSize?: number
}

interface GetAssetRequest {
  assetId: string
}

// ========== API 响应类型 ==========

interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

interface GetEnterpriseListResponse {
  code: number
  message: string
  data: Enterprise[]
}

interface GetAssetListByEnterpriseResponse {
  code: number
  message: string
  data: {
    total: number
    pageNumber: number
    pageSize: number
    totalPages: number
    list: AssetListItem[]
  }
}

interface GetAssetResponse {
  code: number
  message: string
  data: AssetInfo
}

// ========== 错误响应类型 ==========

interface ErrorResponse {
  code: number
  message: string
  details?: string
}

// ========== 实体类型（与 data-model.md 一致） ==========

interface Enterprise {
  participantId: string
  entityName: string
  enterpriseAssetList: AssetSummary[]
}

interface AssetSummary {
  assetId: string
  assetNumber: string
  assetName: string
  assetEnName?: string
  intro?: string
  holderCompany: string
}

interface AssetListItem {
  assetId: string
  assetNumber: string
  assetName: string
  assetEnName?: string
  intro?: string
  holderCompany: string
  scale?: string
  cycle?: string
}

interface AssetInfo {
  assetId: string
  assetNumber: string
  assetName: string
  assetEnName?: string
  holderCompany: string
  participantId: string
  entityName: string
  intro?: string
  scale?: string
  cycle?: string
  timeSpan?: string
  dataInfo: DataInfo
}

interface DataInfo {
  databaseName: string
  tableName: string
  fieldList: FieldInfo[]
}

interface FieldInfo {
  name: string
  dataType: string
  dataLength?: number
  description?: string
  isPrimaryKey?: boolean
  privacyQuery?: boolean
}
```

---

## OpenAPI Specification

```yaml
openapi: 3.0.0
info:
  title: 数据资产选择 API
  version: 1.0.0
  description: 隐私计算流程编辑器 - 数据资产选择与展示功能 API

servers:
  - url: /api
    description: Base API URL

security:
  - BearerAuth: []

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    Enterprise:
      type: object
      required:
        - participantId
        - entityName
        - enterpriseAssetList
      properties:
        participantId:
          type: string
          description: 平台 ID
        entityName:
          type: string
          description: 企业名称
        enterpriseAssetList:
          type: array
          items:
            $ref: '#/components/schemas/AssetSummary'

    AssetSummary:
      type: object
      required:
        - assetId
        - assetNumber
        - assetName
        - holderCompany
      properties:
        assetId:
          type: string
          description: 数据资产唯一标识
        assetNumber:
          type: string
          description: 数据资产编号
        assetName:
          type: string
          description: 数据资产名称
        assetEnName:
          type: string
          description: 数据资产英文简称
        intro:
          type: string
          description: 资产描述
        holderCompany:
          type: string
          description: 资产所有者

    AssetListItem:
      type: object
      required:
        - assetId
        - assetNumber
        - assetName
        - holderCompany
      properties:
        assetId:
          type: string
          description: 数据资产唯一标识
        assetNumber:
          type: string
          description: 数据资产编号
        assetName:
          type: string
          description: 数据资产名称
        assetEnName:
          type: string
          description: 数据资产英文简称
        intro:
          type: string
          description: 资产描述
        holderCompany:
          type: string
          description: 资产所有者
        scale:
          type: string
          description: 数据规模
        cycle:
          type: string
          description: 更新周期

    AssetInfo:
      type: object
      required:
        - assetId
        - assetNumber
        - assetName
        - holderCompany
        - participantId
        - entityName
        - dataInfo
      properties:
        assetId:
          type: string
        assetNumber:
          type: string
        assetName:
          type: string
        assetEnName:
          type: string
        holderCompany:
          type: string
        participantId:
          type: string
        entityName:
          type: string
        intro:
          type: string
        scale:
          type: string
        cycle:
          type: string
        timeSpan:
          type: string
        dataInfo:
          $ref: '#/components/schemas/DataInfo'

    DataInfo:
      type: object
      required:
        - databaseName
        - tableName
        - fieldList
      properties:
        databaseName:
          type: string
        tableName:
          type: string
        fieldList:
          type: array
          items:
            $ref: '#/components/schemas/FieldInfo'

    FieldInfo:
      type: object
      required:
        - name
        - dataType
      properties:
        name:
          type: string
        dataType:
          type: string
        dataLength:
          type: integer
        description:
          type: string
        isPrimaryKey:
          type: boolean
        privacyQuery:
          type: boolean

    ErrorResponse:
      type: object
      required:
        - code
        - message
      properties:
        code:
          type: integer
        message:
          type: string
        details:
          type: string

paths:
  /asset/GetEnterpriseList:
    get:
      summary: 获取企业列表
      description: 获取用户可访问的企业及其数据资产列表
      tags:
        - Asset
      responses:
        '200':
          description: 成功
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                  message:
                    type: string
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Enterprise'
        '401':
          description: 未授权
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '403':
          description: 禁止访问
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '500':
          description: 服务器错误
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /asset/GetAssetListByEnterprise:
    get:
      summary: 获取企业数据资产列表
      description: 获取指定企业的数据资产列表，支持分页
      tags:
        - Asset
      parameters:
        - name: participantId
          in: query
          required: true
          schema:
            type: string
          description: 企业平台 ID
        - name: pageNumber
          in: query
          required: false
          schema:
            type: integer
            default: 1
          description: 页码
        - name: pageSize
          in: query
          required: false
          schema:
            type: integer
            default: 50
            maximum: 100
          description: 每页数量
      responses:
        '200':
          description: 成功
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                  message:
                    type: string
                  data:
                    type: object
                    properties:
                      total:
                        type: integer
                        description: 总数量
                      pageNumber:
                        type: integer
                        description: 当前页码
                      pageSize:
                        type: integer
                        description: 每页数量
                      totalPages:
                        type: integer
                        description: 总页数
                      list:
                        type: array
                        items:
                          $ref: '#/components/schemas/AssetListItem'
        '400':
          description: 请求参数错误
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '401':
          description: 未授权
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '403':
          description: 禁止访问
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '404':
          description: 企业不存在
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '500':
          description: 服务器错误
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /asset/GetAsset:
    get:
      summary: 获取数据资产详情
      description: 获取指定数据资产的完整信息，包括字段列表
      tags:
        - Asset
      parameters:
        - name: assetId
          in: query
          required: true
          schema:
            type: string
          description: 数据资产唯一标识
      responses:
        '200':
          description: 成功
          content:
            application/json:
              schema:
                type: object
                properties:
                  code:
                    type: integer
                  message:
                    type: string
                  data:
                    $ref: '#/components/schemas/AssetInfo'
        '400':
          description: 请求参数错误
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '401':
          description: 未授权
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '403':
          description: 禁止访问
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '404':
          description: 资产不存在
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '500':
          description: 服务器错误
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
```

---

## Mock Implementation

根据前端自治原则，所有 API 必须提供 Mock 实现。Mock 数据定义在 `tests/mocks/assetApiMock.ts`。

```typescript
// tests/mocks/assetApiMock.ts

export const mockEnterpriseList: Enterprise[] = [
  {
    participantId: 'ent_001',
    entityName: '某某企业',
    enterpriseAssetList: [
      {
        assetId: 'asset_001',
        assetNumber: 'AST-2024-001',
        assetName: '用户行为数据',
        assetEnName: 'user_behavior',
        intro: '用户点击流数据',
        holderCompany: '某某企业'
      },
      {
        assetId: 'asset_002',
        assetNumber: 'AST-2024-002',
        assetName: '交易数据',
        assetEnName: 'transaction',
        intro: '用户交易记录',
        holderCompany: '某某企业'
      }
    ]
  },
  {
    participantId: 'ent_002',
    entityName: '另一企业',
    enterpriseAssetList: [
      {
        assetId: 'asset_003',
        assetNumber: 'AST-2024-003',
        assetName: '产品数据',
        assetEnName: 'product',
        intro: '产品信息数据',
        holderCompany: '另一企业'
      }
    ]
  }
]

export const mockAssetInfoMap: Record<string, AssetInfo> = {
  'asset_001': {
    assetId: 'asset_001',
    assetNumber: 'AST-2024-001',
    assetName: '用户行为数据',
    assetEnName: 'user_behavior',
    holderCompany: '某某企业',
    participantId: 'ent_001',
    entityName: '某某企业',
    intro: '用户点击流数据',
    scale: '1000万条',
    cycle: '每日',
    timeSpan: '2024-01-01 至今',
    dataInfo: {
      databaseName: 'user_db',
      tableName: 'user_behavior',
      fieldList: [
        { name: 'user_id', dataType: 'VARCHAR', dataLength: 64, description: '用户 ID', isPrimaryKey: true },
        { name: 'action_time', dataType: 'DATETIME', description: '操作时间' },
        { name: 'page_url', dataType: 'VARCHAR', dataLength: 512, description: '页面 URL' },
        { name: 'action_type', dataType: 'VARCHAR', dataLength: 32, description: '操作类型' }
        // ... 模拟最多 500 个字段的场景
      ]
    }
  },
  'asset_002': { /* ... */ },
  'asset_003': { /* ... */ }
}

// Mock 函数
export function mockGetEnterpriseList(): Promise<GetEnterpriseListResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 0,
        message: 'success',
        data: mockEnterpriseList
      })
    }, 300) // 模拟网络延迟
  })
}

// 企业资产列表 Mock 数据（模拟分页）
const mockAssetListByEnterprise: Record<string, AssetListItem[]> = {
  'ent_001': [
    {
      assetId: 'asset_001',
      assetNumber: 'AST-2024-001',
      assetName: '用户行为数据',
      assetEnName: 'user_behavior',
      intro: '用户点击流数据',
      holderCompany: '某某企业',
      scale: '1000万条',
      cycle: '每日'
    },
    {
      assetId: 'asset_002',
      assetNumber: 'AST-2024-002',
      assetName: '交易数据',
      assetEnName: 'transaction',
      intro: '用户交易记录',
      holderCompany: '某某企业',
      scale: '500万条',
      cycle: '每周'
    }
  ],
  'ent_002': [
    {
      assetId: 'asset_003',
      assetNumber: 'AST-2024-003',
      assetName: '产品数据',
      assetEnName: 'product',
      intro: '产品信息数据',
      holderCompany: '另一企业',
      scale: '100万条',
      cycle: '每月'
    }
  ]
}

export function mockGetAssetListByEnterprise(
  participantId: string,
  pageNumber: number = 1,
  pageSize: number = 50
): Promise<GetAssetListByEnterpriseResponse> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const allAssets = mockAssetListByEnterprise[participantId] || []
      const total = allAssets.length
      const totalPages = Math.ceil(total / pageSize)
      const startIndex = (pageNumber - 1) * pageSize
      const endIndex = startIndex + pageSize
      const list = allAssets.slice(startIndex, endIndex)

      resolve({
        code: 0,
        message: 'success',
        data: {
          total,
          pageNumber,
          pageSize,
          totalPages,
          list
        }
      })
    }, 400) // 模拟网络延迟
  })
}

export function mockGetAsset(assetId: string): Promise<GetAssetResponse> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const assetInfo = mockAssetInfoMap[assetId]
      if (assetInfo) {
        resolve({
          code: 0,
          message: 'success',
          data: assetInfo
        })
      } else {
        reject({
          code: 404,
          message: '数据资产不存在'
        })
      }
    }, 500) // 模拟网络延迟
  })
}
```

---

**Phase 1 Complete**: API 契约定义完成，包含请求/响应格式、错误处理策略和 Mock 实现。
