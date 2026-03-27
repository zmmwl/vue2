import type { Node } from '@vue-flow/core'

// ========== 算法配置相关类型（从algorithm.ts导入） ==========

/** 参数值类型 */
export type ParamValue = string | number | boolean | Date | object | any[]

/** 任务算法配置（存储在任务节点中） */
export interface TaskAlgorithmConfig {
  // 算法引用
  algorithmId: string          // 算法ID (如: "SPDZ-v1.0")
  algorithmName: string        // 算法名称 (冗余存储，便于显示)
  algorithmVersion: string     // 算法版本

  // 用户填写的参数值
  algorithmParams: Record<string, ParamValue>
}

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

// 本地任务类型枚举（新增）
export enum LocalTaskType {
  CONCAT = 'CONCAT',           // 数据拼接
  LOCAL_QUERY = 'LOCAL_QUERY'  // 本地 Query
}

// 数据源类型枚举
export enum DataSourceType {
  DATABASE = 'database',  // 数据库
  FILE = 'file',          // 文件
  API = 'api',            // API 接口
  REALTIME = 'realtime'   // 实时数据源
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
  // 数据资产相关字段
  assetInfo?: AssetInfo         // 数据资产完整信息（已配置时存在）
  selectedFields?: string[]     // 已选字段名称列表（用于导出）
}

// 数据源节点类型
export interface DataSourceNode extends Node {
  type: 'data_source'
  data: NodeData & {
    category: NodeCategory.DATA_SOURCE
    sourceType: DataSourceType
  }
}

// 实时数据源节点数据（可拖拽的实时数据源）
export interface RealtimeDataSourceNodeData extends NodeData {
  category: NodeCategory.DATA_SOURCE
  sourceType: DataSourceType.REALTIME

  // 实时数据源配置
  realtimeConfig: {
    mode: 'datasource' | 'manual'  // 从现有数据源选择 | 手工录入
    fields: RealtimeFieldInfo[]     // 字段列表
    sourceNodeId?: string           // 关联的数据源节点ID（datasource模式时）
    sourceNodeName?: string         // 关联的数据源节点名称
  }

  // 是否已配置
  isConfigured?: boolean
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
  computeType?: LocalTaskType      // 本地任务类型（用于 LOCAL_TASK 类别）
  sourceType?: DataSourceType
  icon: string
  color: string
  description?: string
  modelType?: string  // 模型类型（用于模型节点）
  isCodeBin?: boolean // 是否为 CodeBin 组合模型（需要进一步选择类型）
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
  SPDZ = 'SPDZ',
  GROUP_STAT = 'GROUP_STAT'  // 分组统计模型
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
  // 算法配置（Feature: 004-algorithm-selection）
  algorithmConfig?: TaskAlgorithmConfig
}

/** 模型节点数据 */
export interface ModelNodeData extends NodeData {
  category: NodeCategory.MODEL
  type: 'expression' | ModelType  // 模型类型
  parentTaskId: string      // 所属计算任务ID
  participantId: string
  entityName?: string       // 企业名称（可选）
  name?: string             // 模型名称
  modelId?: string          // 模型ID（用于获取参数签名）
  expression?: string       // 表达式内容（仅expression类型）
  parameters?: ModelParameter[]  // 模型参数（非expression类型）
  groupByConfig?: GroupByConfig  // 分组统计配置（仅GROUP_STAT类型）
}

/** 算力资源节点数据 */
export interface ComputeResourceNodeData extends NodeData {
  category: NodeCategory.COMPUTE_RESOURCE
  resourceType: 'TEE'
  parentTaskId: string      // 所属计算任务ID
  participantId: string
  entityName?: string       // 企业名称（可选）
  groupName: string
  cardSerial: string
}

/** 输出数据节点数据 */
export interface OutputDataNodeData extends NodeData {
  category: NodeCategory.OUTPUT_DATA
  parentTaskId: string      // 所属计算任务ID
  participantId: string     // 接收输出的企业
  entityName?: string       // 企业名称（可选）
  dataset: string           // 输出数据集名称
  fields: OutputField[]
}

/** 本地任务节点数据 */
export interface LocalTaskNodeData extends NodeData {
  category: NodeCategory.LOCAL_TASK
  computeType: LocalTaskType.CONCAT
  participantId: string     // 必选：执行本地任务的参与方企业
  entityName?: string       // 企业名称（可选）
  inputProviders?: InputProvider[]
  outputs?: OutputDataConfig[]
}

// ========== 配置结构 ==========

/**
 * 连接类型
 * - INNER: 内连接，需要指定 join 字段进行匹配
 * - CROSS: 交叉连接，笛卡尔积，不需要 join 字段
 * - Union: 横向拼接，需要字段对齐
 * - NoAssoc: 无关联，独立处理
 */
export type JoinType = 'INNER' | 'CROSS' | 'Union' | 'NoAssoc'

/** 字段映射 */
export interface FieldMapping {
  columnName: string        // 原始字段名
  columnAlias: string       // 别名
  columnType: string        // varchar/int/bigint等
  isJoinField: boolean      // 是否为join字段
  joinType?: JoinType       // join字段类型（扩展支持四种类型）
  mappingOrder?: number     // 字段映射顺序（Union 类型下使用）
}

/**
 * Union 专用字段映射
 * 用于记录不同数据源的字段如何映射到统一的输出字段
 */
export interface UnionFieldMapping {
  /** 目标字段的统一别名 */
  targetAlias: string
  /** 目标字段的数据类型 */
  targetType: string
  /** 字段顺序 */
  order: number
  /**
   * 各数据源对应的源字段
   * key: `${participantId}.${dataset}`
   * value: 源字段名（columnName）
   * 如果某数据源没有对应字段，值为 null
   */
  sourceFields: Record<string, string | null>
}

/** 输入数据提供者 */
export interface InputProvider {
  sourceNodeId: string      // 数据源节点ID或输出节点ID
  sourceType: 'dataSource' | 'outputData'
  participantId: string
  dataset: string
  fields: FieldMapping[]
  /** 该数据源的连接类型，每个输入源独立设置，默认为 'INNER' */
  joinType?: JoinType
  joinFields?: string[]     // 作为join条件的字段名
  isRealtime?: boolean      // 是否是实时数据源（PIR任务使用）
  /** Union 专用字段映射 */
  unionFieldMappings?: UnionFieldMapping[]
}

/** Join操作数 */
export interface JoinOperand {
  participantId: string
  dataset: string
  columnNames: string[]     // 参与join的字段列表
}

/** Join条件 */
export interface JoinCondition {
  joinType: JoinType        // 更新：使用新的联合类型
  operands: JoinOperand[]   // Union/NoAssoc 下可为空数组
}

/** 模型输出参数（从模型详情接口获取） */
export interface ModelReturnParameter {
  fid: string               // 参数唯一ID
  name: string              // 参数名称
  dataType: number          // 数据类型（对应 ModelDataType 枚举）
  isRequired: number        // 是否必填（0/1）
  description: string       // 参数描述
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
  groupByConfig?: GroupByConfig  // 分组统计配置（仅GROUP_STAT类型）
  returnParameters?: ModelReturnParameter[]  // 模型输出参数（CodeBin等模型）
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
  isRealtime?: boolean      // 是否为实时输出（当任一输入为实时数据源时为 true）
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

// ========== 模型参数配置相关类型 ==========

/** 参数绑定类型 */
export type ParameterBindingType = 'field' | 'fixed'

/** 参数数据类型（复用 model-mock-service 的枚举值） */
export enum ParameterDataType {
  STRING = 1,
  INT = 2,
  BIGINT = 3,
  FLOAT = 4,
  DOUBLE = 5,
  BOOLEAN = 6,
  DATETIME = 7
}

/** 模型输入参数签名（从 modelParameters 获取） */
export interface ModelParameterSignature {
  fid: string                    // 参数唯一ID
  name: string                   // 参数名称
  dataSource: string             // 数据来源描述
  dataType: ParameterDataType    // 参数数据类型
  isEncrypt: number              // 是否加密（0/1，用作必填标识）
  description: string            // 参数描述
}

/** 可用字段选项（用于字段绑定） */
export interface AvailableFieldOption {
  id: string                     // 字段唯一ID（格式：participantId.dataset.fieldName）
  participantId: string          // 参与方ID
  dataset: string                // 数据集名称
  fieldName: string              // 字段名称
  fieldType: string              // 字段类型
  sourceNodeId: string           // 来源节点ID
}

/** 参数配置项（运行时状态） */
export interface ParameterConfigItem extends ModelParameterSignature {
  bindingType: ParameterBindingType  // 绑定类型
  fieldRef?: string                   // 绑定的字段引用
  fixedValue?: string                 // 固定值
  isConfigured: boolean               // 是否已配置
}

// ========== 统一资源选择器相关类型 ==========

/** 统一资源选择结果 */
export interface ResourceSelectionResult {
  assetInfo?: AssetInfo       // 数据源类型
  selectedFields?: FieldInfo[]
  modelInfo?: ModelInfo       // 模型类型
  computeInfo?: ComputeInfo   // 算力类型
}

/** 模型信息（用于统一选择器） */
export interface ModelInfo {
  id: string
  name: string
  type: string
  participantId: string
  entityName?: string
  description?: string
  version?: string
}

/** 算力信息（用于统一选择器） */
export interface ComputeInfo {
  id: string
  name: string
  type: string
  participantId: string
  entityName?: string
  groupId: string
  groupName: string
  nodeId: string
  cardSerial: string
  cardModel: string
  cores?: number
  description?: string
}

// ========== 分组统计相关类型 ==========

/** SQL 聚合函数类型 */
export enum AggregationFunction {
  SUM = 'SUM',
  COUNT = 'COUNT',
  AVG = 'AVG',
  MAX = 'MAX',
  MIN = 'MIN'
}

/** 分组字段配置 */
export interface GroupByField {
  fieldId: string              // 字段唯一ID（格式：participantId.dataset.fieldName）
  fieldName: string            // 字段名称
  fieldAlias: string           // 别名（默认与字段名相同）
  fieldType: string            // 字段类型
}

/** 统计配置 */
export interface StatisticConfig {
  id: string                   // 统计配置唯一ID
  functionType: AggregationFunction  // 聚合函数类型
  fieldId: string              // 要统计的字段ID（单个字段）
  fieldSource: 'input' | 'model'     // 字段来源
  resultAlias: string          // 结果别名
}

/** 分组统计配置 */
export interface GroupByConfig {
  id: string                   // 配置唯一ID
  groupByFields: GroupByField[]   // 分组字段列表
  statistics: StatisticConfig[]   // 统计配置列表
}

// ========== 本地Query任务相关类型 ==========

/** 表达式配置（新增） */
export interface ExpressionConfig {
  id: string               // 唯一ID
  expression: string       // 表达式内容
  resultAlias: string      // 结果别名
  description?: string     // 描述（可选）
}

/** 本地Query节点数据 */
export interface LocalQueryNodeData extends NodeData {
  category: NodeCategory.LOCAL_TASK  // 从 COMPUTE_TASK 改为 LOCAL_TASK
  computeType: LocalTaskType.LOCAL_QUERY

  // 执行企业（用户手动选择）
  participantId: string
  entityName?: string

  // 输入数据配置（复用现有 InputProvider 结构）
  inputProviders?: InputProvider[]

  // Join 条件（复用现有 JoinCondition 结构）
  joinConditions?: JoinCondition[]

  // 多个表达式配置（从单个字符串改为数组）
  expressions: ExpressionConfig[]

  // 分组统计配置（内联配置，可选）
  groupByConfig?: GroupByConfig

  // 输出数据集名称（仅输出到执行企业本地）
  outputDataset?: string
}

// ========== PIR 实时数据源相关类型 ==========

/** 实时数据源字段信息 */
export interface RealtimeFieldInfo {
  name: string                  // 字段名称
  dataType: 'STRING' | 'INTEGER' | 'FLOAT' | 'BOOLEAN' | 'DATE' | 'TIMESTAMP'  // 字段类型
  description?: string          // 字段描述（可选）
}

/** 实时数据源信息 */
export interface RealtimeDataSourceInfo {
  id: string                    // 实时数据源唯一ID
  name: string                  // 实时数据源名称
  sourceType: 'connection' | 'manual'  // 来源类型：连线导入 | 手工录入
  fields: RealtimeFieldInfo[]   // 字段列表
  sourceNodeId?: string         // 连线来源节点ID（连线导入时存在）
}

/** PIR输出配置（流式类型） */
export interface PIROutputConfig {
  id: string                      // 输出唯一ID
  name: string                    // 输出名称
  type: 'stream'                  // PIR输出固定为流式类型
  fields: OutputField[]           // 输出字段列表
  description?: string            // 描述
  outputNodeId?: string           // 关联的输出节点ID
  isRealtime?: boolean            // 是否为实时输出（当任一输入为实时数据源时为 true）
}

/** PIR任务节点数据 */
export interface PIRTaskNodeData extends NodeData {
  category: NodeCategory.COMPUTE_TASK
  taskType: ComputeTaskType.PIR

  // 技术路径（硬件TEE或软件密码学）
  techPath?: TechPath

  // 输入数据源（和 MPC 一样的配置方式）
  inputProviders?: InputProvider[]

  // Join条件（和 MPC 一样）
  joinConditions?: JoinCondition[]

  // 预加载数据源（来自数据资产，兼容旧逻辑）
  preloadDataSource?: InputProvider

  // 实时数据源（来自连线或手工配置，兼容旧逻辑）
  realtimeDataSource?: RealtimeDataSourceInfo

  // 计算模型配置列表（类似MPC任务）
  models?: ComputeModelConfig[]

  // 输出配置列表（PIR输出为流式类型）
  outputs?: PIROutputConfig[]

  // 算力资源配置
  computeResourceId?: string
  computeResourceName?: string

  // 输出数据节点ID（PIR输出以实时数据源样式展示）
  outputNodeId?: string
}

// ========== 联邦学习任务相关类型 ==========

/** 联邦学习任务类别 */
export enum FLTaskCategory {
  PREPROCESS = 'preprocess',        // 预处理
  FEATURE_ENGINEERING = 'feature_engineering',  // 特征工程
  HORIZONTAL_MODEL = 'horizontal',  // 横向模型
  VERTICAL_MODEL = 'vertical'       // 纵向模型
}

/** 联邦学习模式 */
export enum FLMode {
  TRAINING = 'training',    // 训练模式
  INFERENCE = 'inference'   // 推断模式
}

/** 联邦学习任务节点数据 */
export interface FLTaskNodeData extends NodeData {
  category: NodeCategory.COMPUTE_TASK
  taskType: ComputeTaskType.FL

  // FL任务类别
  flCategory: FLTaskCategory
  // FL模式（训练/推断）
  flMode: FLMode
  // 具体任务名称（如 logistic_regression, secureboost 等）
  taskName: string
  // 任务显示名称
  taskDisplayName: string

  // 子类型（如缺失值处理、异常值处理等）
  subType?: string
  subTypeLabel?: string

  // 输入数据源配置
  inputProviders?: InputProvider[]

  // 参数配置
  parameters?: Record<string, any>

  // 已部署模型（仅推断模式）
  deployedModelId?: string
  deployedModelName?: string
  trainingParticipants?: string[]  // 训练参与方列表

  // 输出节点ID
  outputNodeId?: string
}

/** 已部署模型信息 */
export interface DeployedModel {
  modelId: string                    // 模型ID
  modelName: string                  // 模型名称
  modelType?: string                 // 模型类型（horizontal, vertical）
  participants: string[]             // 训练参与方ID列表
  createdAt: string                  // 创建时间
}
