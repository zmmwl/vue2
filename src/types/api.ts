import type { AssetInfo, Enterprise, AssetListItem } from './nodes'

// ========== API 响应基础类型 ==========

/** 通用 API 响应包装 */
export interface ApiResponse<T = any> {
  code: number           // 状态码
  message?: string       // 响应消息
  data?: T              // 响应数据
}

/** 错误响应 */
export interface ErrorResponse {
  code: number           // 业务错误码
  status: string         // "success" 或 "failed"
  msg: string            // 错误消息
  data: null             // 错误时为 null
}

// ========== 企业列表 API ==========

/** 获取企业列表响应 */
export interface GetEnterpriseListResponse {
  code: number           // 状态码，0 表示成功
  message: string        // 响应消息
  data: Enterprise[]     // 企业列表
}

// ========== 资产列表 API ==========

/** 分页信息 */
export interface Pagination {
  total: number          // 总数量
  pageSize: number       // 分页大小
  pageNumber: number     // 分页页码
}

/** 获取资产列表响应 */
export interface GetAssetListResponse {
  code: number           // 状态码，200 表示成功
  status: string         // 状态，"success" 或 "failed"
  msg: string | null     // 消息
  data: {
    pagination: Pagination
    list: AssetListItem[]           // 数据资产列表
  }
}

// ========== 资产详情 API ==========

/** 获取资产详情响应 */
export interface GetAssetResponse {
  code: number           // 状态码，200 表示成功
  status: string         // 状态，"success" 或 "failed"
  msg: string | null     // 消息
  data: {
    assetInfo: AssetInfo
  }
}

// ========== API 请求类型 ==========

/** 获取资产列表请求参数 */
export interface GetAssetListRequest {
  pageNumber?: number    // 分页编码，默认 1
  pageSize?: number      // 分页大小，每页条数，默认 10
  filters?: Filter[]     // 过滤参数（按 holderCompany 过滤企业资产）
}

/** 过滤条件 */
export interface Filter {
  key: string            // 过滤字段（如 "holderCompany"）
  values: string[]       // 过滤值
}

/** 获取资产详情请求参数 */
export interface GetAssetRequest {
  assetId?: string               // 数据资产 ID
  assetEnName?: string            // 数据资产英文名字
  assetOwnerParticipantId?: string // 数据资产的所属方的参与方的 ID
}
