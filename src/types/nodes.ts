import type { Node } from '@vue-flow/core'

// ========== 数据资产相关类型 ==========

/** 字段信息 */
export interface FieldInfo {
  name: string                  // 字段名称
  dataType: string              // 字段类型（VARCHAR, INT, DATETIME 等）
  dataLength?: number           // 字段长度（可选）
  description?: string          // 字段描述（可选）
  isPrimaryKey?: boolean        // 是否主键（可选，默认 false）
  privacyQuery?: boolean        // 是否隐私查询（可选，默认 false）
}

/** 数据集信息 */
export interface DataInfo {
  databaseName: string          // 数据库名
  tableName: string             // 表名
  fieldList: FieldInfo[]        // 字段列表（所有可用字段）
}

/** 数据资产完整信息 */
export interface AssetInfo {
  assetId: string               // 数据资产唯一标识
  assetNumber: string           // 数据资产编号
  assetName: string             // 数据资产名称
  assetEnName?: string          // 数据资产英文简称（可选）
  holderCompany: string         // 资产所有者（企业名称）
  participantId: string         // 平台 ID
  entityName: string            // 实体名称
  intro?: string                // 资产描述（可选）
  scale?: string                // 数据规模（可选）
  cycle?: string                // 更新周期（可选）
  timeSpan?: string             // 时间跨度（可选）
  dataInfo: DataInfo            // 数据集信息
}

/** 企业资产摘要 */
export interface AssetSummary {
  assetId: string               // 数据资产唯一标识
  assetNumber: string           // 数据资产编号
  assetName: string             // 数据资产名称
  assetEnName?: string          // 数据资产英文简称（可选）
  intro?: string                // 资产描述（可选）
  holderCompany: string         // 资产所有者（企业名称）
}

/** 企业信息 */
export interface Enterprise {
  participantId: string         // 平台 ID（唯一标识）
  entityName: string            // 企业名称
  enterpriseAssetList: AssetSummary[]  // 该企业的数据资产列表
}

/** 资产列表项 */
export interface AssetListItem {
  assetId: string               // 数据资产唯一标识
  assetNumber: string           // 数据资产编号
  assetName: string             // 数据资产名称
  assetEnName?: string          // 数据资产英文简称（可选）
  intro?: string                // 资产描述（可选）
  holderCompany: string         // 资产所有者（企业名称）
  scale?: string                // 数据规模（可选）
  cycle?: string                // 更新周期（可选）
  participantId?: string        // 平台 ID（可选）
  entityName?: string           // 实体名称（可选）
  dataProductType?: number      // 数据资产类型：1 数据集
  enterpriseName?: string       // 企业名称（可选）
}

/** 已选字段（与 FieldInfo 结构相同） */
export type SelectedField = FieldInfo

// ========== 节点类别枚举 ==========
export enum NodeCategory {
  DATA_SOURCE = 'data_source',
  COMPUTE_TASK = 'compute_task'
}

// 计算任务类型枚举
export enum ComputeTaskType {
  PSI = 'PSI',    // Private Set Intersection - 隐私集合求交
  PIR = 'PIR',    // Private Information Retrieval - 隐私信息检索
  MPC = 'MPC',    // Secure Multi-Party Computation - 多方安全计算
  FL = 'FL'       // Federated Learning - 联邦学习
}

// 数据源类型枚举
export enum DataSourceType {
  DATABASE = 'database',  // 数据库
  FILE = 'file',          // 文件
  API = 'api'             // API 接口
}

// 输入连接点接口
export interface InputHandle {
  id: string
  position: number  // 百分比位置 (0-100)
}

// 输出连接点接口
export interface OutputHandle {
  id: string
  position: number  // 百分比位置 (0-100)
}

// 附着端点接口（保留兼容性）
export interface AttachmentEndpoint {
  id: string
  label?: string
}

// 节点数据接口
export interface NodeData {
  label: string
  category: NodeCategory
  taskType?: ComputeTaskType
  sourceType?: DataSourceType
  icon?: string
  color: string
  description?: string
  status?: 'idle' | 'running' | 'success' | 'error'
  config?: Record<string, any>
  // ========== 数据资产相关字段 ==========
  assetInfo?: AssetInfo         // 数据资产完整信息（已配置时存在）
  selectedFields?: string[]     // 已选字段名称列表（用于导出）
  // =====================================
  // 节点的输入连接点列表（动态生成，顶部）
  inputHandles?: InputHandle[]
  // 节点的输出连接点列表（动态生成，底部）
  outputHandles?: OutputHandle[]
  // 任务节点的附着端点列表（用于连接数据源，已弃用）
  attachmentEndpoints?: AttachmentEndpoint[]
}

// 数据源节点类型
export interface DataSourceNode extends Node {
  type: 'data_source'
  data: NodeData & {
    category: NodeCategory.DATA_SOURCE
    sourceType: DataSourceType
  }
}

// 计算任务节点类型
export interface ComputeTaskNode extends Node {
  type: 'compute_task'
  data: NodeData & {
    category: NodeCategory.COMPUTE_TASK
    taskType: ComputeTaskType
  }
}

// 节点模板类型
export interface NodeTemplate {
  type: string
  label: string
  category: NodeCategory
  taskType?: ComputeTaskType
  sourceType?: DataSourceType
  icon: string
  color: string
  description?: string
}
