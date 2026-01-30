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
  COMPUTE_TASK = 'compute_task',
  MODEL = 'model',
  COMPUTE_RESOURCE = 'computeResource',
  OUTPUT_DATA = 'outputData',
  LOCAL_TASK = 'localTask'
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
  category: NodeCategory | string  // 允许字符串以支持自定义category
  taskType?: ComputeTaskType
  sourceType?: DataSourceType
  icon: string
  color: string
  description?: string
  modelType?: string  // 模型类型（用于模型节点）
}

// ========== DAG任务编排相关类型 ==========

/** 技术路径枚举 */
export enum TechPath {
  SOFTWARE = 'software',  // 软件密码学
  TEE = 'tee'             // 硬件 TEE
}

/** 模型类型枚举 */
export enum ModelType {
  EXPRESSION = 'expression',
  CODEBIN_V2 = 'CodeBin-V2',
  CODEBIN_V3_1 = 'CodeBin-V3-1',
  CODEBIN_V3_2 = 'CodeBin-V3-2',
  SPDZ = 'SPDZ'
}

/** 计算任务节点数据（扩展版） */
export interface ComputeTaskNodeData extends NodeData {
  category: NodeCategory.COMPUTE_TASK
  taskType: ComputeTaskType
  techPath?: TechPath        // 技术路径
  // 输入数据配置
  inputProviders?: InputProvider[]
  // Join条件
  joinConditions?: JoinCondition[]
  // 计算模型配置
  models?: ComputeModelConfig[]
  // MPC表达式（仅MPC类型且techPath=software时使用）
  expression?: string
  // 算力资源配置
  computeProviders?: ComputeResourceConfig[]
  // 输出数据配置
  outputs?: OutputDataConfig[]
}

/** 模型节点数据 */
export interface ModelNodeData extends NodeData {
  category: NodeCategory.MODEL
  type: 'expression' | ModelType  // 模型类型
  parentTaskId: string      // 所属计算任务ID
  participantId: string
  name?: string             // 模型名称
  expression?: string       // 表达式内容（仅expression类型）
  parameters?: ModelParameter[]  // 模型参数（非expression类型）
}

/** 算力资源节点数据 */
export interface ComputeResourceNodeData extends NodeData {
  category: NodeCategory.COMPUTE_RESOURCE
  resourceType: 'TEE'
  parentTaskId: string      // 所属计算任务ID
  participantId: string
  groupName: string
  cardSerial: string
}

/** 输出数据节点数据 */
export interface OutputDataNodeData extends NodeData {
  category: NodeCategory.OUTPUT_DATA
  parentTaskId: string      // 所属计算任务ID
  participantId: string     // 接收输出的企业
  dataset: string           // 输出数据集名称
  fields: OutputField[]
}

/** 本地任务节点数据 */
export interface LocalTaskNodeData extends NodeData {
  category: NodeCategory.LOCAL_TASK
  computeType: 'CONCAT'
  participantId: string     // 必选：执行本地任务的参与方企业
  inputProviders?: InputProvider[]
  outputs?: OutputDataConfig[]
}

// ========== 配置结构 ==========

/** 字段映射 */
export interface FieldMapping {
  columnName: string        // 原始字段名
  columnAlias: string       // 别名
  columnType: string        // varchar/int/bigint等
  isJoinField: boolean      // 是否为join字段
  joinType?: 'INNER' | 'CROSS'  // join字段类型
}

/** 输入数据提供者 */
export interface InputProvider {
  sourceNodeId: string      // 数据源节点ID或输出节点ID
  sourceType: 'dataSource' | 'outputData'
  participantId: string
  dataset: string
  fields: FieldMapping[]
  joinFields?: string[]     // 作为join条件的字段名
}

/** Join操作数 */
export interface JoinOperand {
  participantId: string
  dataset: string
  columnNames: string[]     // 参与join的字段列表
}

/** Join条件 */
export interface JoinCondition {
  joinType: 'INNER' | 'CROSS'
  operands: JoinOperand[]   // 至少2个
}

/** 计算模型配置 */
export interface ComputeModelConfig {
  id: string                // 模型唯一ID
  type: ModelType | 'expression'  // 模型类型（支持expression字符串）
  participantId: string
  name: string
  expression?: string       // 表达式内容（仅expression类型）
  parameters?: ModelParameter[]
  modelNodeId?: string      // 关联的模型节点ID
}

/** 模型参数 */
export interface ModelParameter {
  name: string              // 参数名
  bindingType: 'field' | 'fixed'  // 绑定类型
  fieldRef?: string         // 绑定的字段引用
  fixedValue?: string       // 固定值
}

/** 算力资源配置 */
export interface ComputeResourceConfig {
  id: string                // 算力资源唯一ID
  type: string              // 资源类型（如TEE_CPU）
  participantId: string
  groupId: string
  groupName: string
  nodeId: string
  cardSerial: string
  cardModel: string
  resourceNodeId?: string   // 关联的算力资源节点ID
}

/** 输出字段 */
export interface OutputField {
  source: 'input' | 'model'  // 字段来源
  columnName: string         // 字段名或表达式
  columnAlias: string
  columnType: string
}

/** 输出数据配置 */
export interface OutputDataConfig {
  id: string                // 输出配置唯一ID
  participantId: string     // 接收输出结果的参与方企业
  dataset: string           // 输出数据集名称
  outputFields: OutputField[]
  outputNodeId: string      // 关联的输出数据节点ID
}

/** 资源类型优先级（用于企业排序） */
export enum ResourceTypePriority {
  DATA = 3,      // 数据资源所属企业
  MODEL = 2,     // 模型所属企业
  COMPUTE = 1,   // 算力所属企业
  OTHER = 0      // 其他企业
}

/** 企业选项 */
export interface EnterpriseOption {
  id: string
  name: string
  resourceType: ResourceTypePriority
}
