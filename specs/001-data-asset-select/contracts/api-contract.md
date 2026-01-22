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

### 2. 获取数据资产列表

获取数据资产列表，支持按资产所有者（企业）过滤和分页查询。

**Endpoint**: `POST /asset/GetAssetList`

**Authentication**: Bearer Token (required)

**Request**:
```typescript
interface GetAssetListRequest {
  pageNumber?: number    // 分页编码，默认 1
  pageSize?: number      // 分页大小，每页条数，默认 10
  filters?: Filter[]     // 过滤参数（按 holderCompany 过滤企业资产）
}

interface Filter {
  key: string            // 过滤字段（如 "holderCompany"）
  values: string[]       // 过滤值
}

// POST 请求体
POST /asset/GetAssetList
Content-Type: application/json
headers: {
  'Authorization': `Bearer ${token}`
}
body: {
  "pageNumber": 1,
  "pageSize": 50,
  "filters": [
    { "key": "holderCompany", "values": ["某某企业"] }
  ]
}
```

**Response (200 OK)**:
```typescript
interface GetAssetListResponse {
  code: number                    // 状态码，200 表示成功
  status: string                 // 状态，"success" 或 "failed"
  msg: string | null             // 消息
  data: {
    pagination: Pagination
    list: AssetItem[]            // 数据资产列表
  }
}

interface Pagination {
  total: number                  // 总数量
  pageSize: number               // 分页大小
  pageNumber: number             // 分页页码
}

interface AssetItem {
  assetId: string                // 主键 ID
  assetNumber: string            // 数据资产编号
  assetName: string              // 数据资产名称
  assetEnName?: string           // 资产英文名（可选）
  holderCompany: string          // 资产所有者
  intro?: string                 // 资产描述（可选）
  participantId: string           // 平台 ID
  entityName: string              // 实体名称
  dataProductType: number         // 数据资产类型：1 数据集
  enterpriseName: string          // 企业名称
}
```

**Error Responses**:
| HTTP Status | Error Scenario | Response Body |
|-------------|----------------|---------------|
| 501 | 查询失败 | `{ code: 501, status: "failed", msg: "查询失败", data: null }` |

**Example**:
```typescript
// Request
POST /asset/GetAssetList
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

body: {
  "pageNumber": 1,
  "pageSize": 50,
  "filters": [
    { "key": "holderCompany", "values": ["某某企业"] }
  ]
}

// Response
{
  "code": 200,
  "status": "success",
  "msg": null,
  "data": {
    "pagination": {
      "total": 150,
      "pageSize": 50,
      "pageNumber": 1
    },
    "list": [
      {
        "assetId": "asset_001",
        "assetNumber": "AST-2024-001",
        "assetName": "用户行为数据",
        "assetEnName": "user_behavior",
        "holderCompany": "某某企业",
        "intro": "用户点击流数据",
        "participantId": "ent_001",
        "entityName": "某某企业",
        "dataProductType": 1,
        "enterpriseName": "某某企业"
      },
      {
        "assetId": "asset_002",
        "assetNumber": "AST-2024-002",
        "assetName": "交易数据",
        "assetEnName": "transaction",
        "holderCompany": "某某企业",
        "intro": "用户交易记录",
        "participantId": "ent_001",
        "entityName": "某某企业",
        "dataProductType": 1,
        "enterpriseName": "某某企业"
      }
    ]
  }
}
```

**Note**:
1. 此接口使用 POST 请求，参数在请求体中
2. 支持按 `holderCompany` 过滤来获取特定企业的数据资产
3. 也可以直接使用企业列表接口返回的 `enterpriseAssetList`（适用于资产数量较少的情况）

---

### 3. 获取数据资产详情

根据数据资产 ID，获取数据资产详情（包括字段列表）。

**Endpoint**: `POST /asset/GetAsset`

**Authentication**: Bearer Token (required)

**Request**:
```typescript
interface GetAssetRequest {
  assetId?: string               // 数据资产 ID
  assetEnName?: string            // 数据资产英文名字
  assetOwnerParticipantId?: string // 数据资产的所属方的参与方的 ID
}
// assetId 和 (assetEnName + assetOwnerParticipantId) 不能同时为空

// POST 请求体
POST /asset/GetAsset
Content-Type: application/json
headers: {
  'Authorization': `Bearer ${token}`
}
body: {
  "assetId": "asset_001"
}
```

**Response (200 OK)**:
```typescript
interface GetAssetResponse {
  code: number           // 状态码，200 表示成功
  status: string         // 状态，"success" 或 "failed"
  msg: string | null     // 消息
  data: {
    assetInfo: AssetInfo
  }
}

interface AssetInfo {
  assetId: string                // 主键 ID
  assetNumber: string            // 数据产品编号
  holderCompany: string          // 数据产品所有者
  assetName: string              // 数据产品名称
  assetEnName: string            // 资产英文简称
  scale: string                  // 数据规模
  cycle: string                  // 更新周期
  timeSpan: string               // 时间跨度
  txId: string                   // 交易 ID
  intro: string                  // 数据产品简介
  assetType: number              // 数据类型：1-个人数据，2-企业数据，3-公共数据
  dataInfo: DataInfo             // 数据集信息
  participantId: string           // 平台 ID
  entityName: string              // 实体名称
  dataProductType: number        // 数据资产类型：1 数据集
  scaleUnit: number              // 数据规模单位：1-MB,2-GB,3-TB,4-PB,5-EB,6-ZB
}

interface DataInfo {
  dbName: string                 // 数据库名称
  tableName: string              // 数据表名称
  itemList: SaveTableColumnItem[] // 字段信息
}

interface SaveTableColumnItem {
  name: string                   // 字段名称
  dataType: string               // 字段类型
  dataLength: string             // 字段长度
  description: string            // 字段描述
  isPrimaryKey: number           // 是否为主键：1=否，2=是
  privacyQuery: number           // 是否隐私查询：1=是，0=否
}
```

**Error Responses**:
| HTTP Status | Error Scenario | Response Body |
|-------------|----------------|---------------|
| 501 | 获取详情失败 | `{ code: 501, status: "failed", msg: "获取详情失败", data: null }` |

**Example**:
```typescript
// Request
POST /asset/GetAsset
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

body: {
  "assetId": "asset_001"
}

// Response
{
  "code": 200,
  "status": "success",
  "msg": null,
  "data": {
    "assetInfo": {
      "assetId": "1001",
      "assetNumber": "100012",
      "holderCompany": "组织1",
      "assetName": "Asset Name",
      "assetEnName": "Asset En Name",
      "scale": "100M",
      "cycle": "7天",
      "timeSpan": "2022年1月1日-2022年12月1日",
      "txId": "0x122121212",
      "intro": "数据产品简介",
      "dataInfo": {
        "dbName": "数据库名称",
        "tableName": "数据表名称",
        "itemList": [
          {
            "name": "字段名称",
            "dataType": "字段类型",
            "dataLength": "字段长度",
            "description": "字段描述",
            "isPrimaryKey": 2,
            "privacyQuery": 1
          },
          {
            "name": "action_time",
            "dataType": "DATETIME",
            "dataLength": "",
            "description": "操作时间",
            "isPrimaryKey": 1,
            "privacyQuery": 0
          }
        ]
      },
      "participantId": "ent_001",
      "entityName": "某某企业",
      "dataProductType": 1
    }
  }
}
```

**Note**: 字段信息在 `dataInfo.itemList` 中，`isPrimaryKey` 值为 1=否，2=是

---

## Error Handling Strategy

### Error Categories

| 错误类型 | HTTP 状态码 | Response Code | 处理策略 |
|---------|------------|--------------|---------|
| 网络错误 | - | ERR_NETWORK | 自动重试 2-3 次，指数退避 |
| 超时错误 | - | ECONNABORTED | 自动重试 2-3 次，指数退避 |
| 业务错误 | 501 | - | 不重试，显示 `msg` 字段错误信息 |
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

所有错误响应遵循统一格式（基于实际 API 返回）：

```typescript
interface ErrorResponse {
  code: number           // 业务错误码（如 501）
  status: string         // "success" 或 "failed"
  msg: string            // 错误消息
  data: null             // 错误时为 null
}
```

---

## TypeScript 类型定义

```typescript
// ========== API 请求类型 ==========

interface GetEnterpriseListRequest {
  assetName?: string
  assetEnName?: string
  dataProductTypes?: Array<string>
}

interface GetAssetListRequest {
  pageNumber?: number
  pageSize?: number
  filters?: Array<{
    key: string
    values: string[]
  }>
}

interface GetAssetRequest {
  assetId?: string
  assetEnName?: string
  assetOwnerParticipantId?: string
}

// ========== API 响应类型 ==========

interface GetEnterpriseListResponse {
  code: number
  status: string
  msg: string | null
  data: {
    enterpriseList: Enterprise[]
  }
}

interface GetAssetListResponse {
  code: number
  status: string
  msg: string | null
  data: {
    pagination: Pagination
    list: AssetItem[]
  }
}

interface GetAssetResponse {
  code: number
  status: string
  msg: string | null
  data: {
    assetInfo: AssetInfo
  }
}

// ========== 错误响应类型 ==========

interface ErrorResponse {
  code: number           // 如 501
  status: string         // "failed"
  msg: string            // 错误消息
  data: null
}

// ========== 实体类型（与实际 API 一致） ==========

interface Enterprise {
  participantId: string
  entityName: string
  enterpriseAssetList: EnterpriseAsset[]
}

interface EnterpriseAsset {
  assetId: string
  assetNumber: string
  assetEnName?: string
  assetName: string
  dataProductType: number
}

interface AssetItem {
  assetId: string
  assetNumber: string
  assetName: string
  assetEnName?: string
  holderCompany: string
  intro?: string
  participantId: string
  entityName: string
  dataProductType: number
  enterpriseName: string
}

interface Pagination {
  total: number
  pageSize: number
  pageNumber: number
}

interface AssetInfo {
  assetId: string
  assetNumber: string
  holderCompany: string
  assetName: string
  assetEnName: string
  scale: string
  cycle: string
  timeSpan: string
  txId: string
  intro: string
  assetType: number
  dataInfo: DataInfo
  participantId: string
  entityName: string
  dataProductType: number
  scaleUnit: number
}

interface DataInfo {
  dbName: string
  tableName: string
  itemList: SaveTableColumnItem[]
}

interface SaveTableColumnItem {
  name: string
  dataType: string
  dataLength: string
  description: string
  isPrimaryKey: number      // 1=否，2=是
  privacyQuery: number      // 1=是，0=否
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
