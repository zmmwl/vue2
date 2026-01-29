/**
 * 节点类型定义
 * DAG任务编排系统的核心节点实体
 */

/**
 * 节点类型枚举
 */
export type NodeType =
  | 'dataSource'      // 数据源节点
  | 'computeTask'     // 计算任务节点
  | 'modelNode'       // 计算模型节点
  | 'computeResource' // 算力资源节点
  | 'outputData'      // 输出数据节点
  | 'localTask'       // 本地结果处理任务

/**
 * 基础节点接口
 */
export interface BaseNode {
  id: string
  type: NodeType
  position: { x: number; y: number }
  data: NodeData
}

/**
 * 节点数据联合类型
 */
export type NodeData =
  | DataSourceNodeData
  | ComputeTaskNodeData
  | ModelNodeData
  | ComputeResourceNodeData
  | OutputDataNodeData
  | LocalTaskNodeData

/**
 * 数据源节点数据
 */
export interface DataSourceNodeData {
  label: string
  participantId: string
  assetName: string
  dbName: string
  tableName: string
  fields: Field[]
}

/**
 * 计算任务节点数据
 */
export interface ComputeTaskNodeData {
  label: string
  computeType: ComputeType
  techPath: TechPath

  // 输入数据配置
  inputProviders: InputProvider[]

  // Join条件
  joinConditions: JoinCondition[]

  // 计算模型配置
  models: ComputeModelConfig[]

  // MPC表达式（仅MPC类型且techPath=software时使用）
  expression?: string

  // 算力资源配置
  computeProviders: ComputeResourceConfig[]

  // 输出数据配置
  outputs: OutputDataConfig[]
}

/**
 * 本地任务节点数据
 */
export interface LocalTaskNodeData {
  label: string
  computeType: 'CONCAT'
  participantId: string        // 必选：执行本地任务的参与方企业
  inputProviders: InputProvider[]
  outputs: OutputDataConfig[]
}

/**
 * 计算模型节点数据
 */
export interface ModelNodeData {
  label: string
  modelType: ModelType
  parentTaskId: string
  participantId: string
  modelName: string
}

/**
 * 算力资源节点数据
 */
export interface ComputeResourceNodeData {
  label: string
  resourceType: 'TEE'
  parentTaskId: string
  participantId: string
  groupName: string
  cardSerial: string
}

/**
 * 输出数据节点数据
 */
export interface OutputDataNodeData {
  label: string
  parentTaskId: string
  participantId: string
  dataset: string
  fields: OutputField[]
}

// ============ 类型定义 ============

/**
 * 计算类型
 */
export type ComputeType =
  | 'PSI' | 'TEE_PSI'
  | 'PIR' | 'TEE_PIR'
  | 'MPC' | 'TEE_MPC'
  | 'CONCAT'

/**
 * 技术路径
 */
export type TechPath = 'software' | 'tee'

/**
 * 模型类型
 */
export type ModelType =
  | 'expression'
  | 'CodeBin-V2'
  | 'CodeBin-V3-1'
  | 'CodeBin-V3-2'
  | 'SPDZ'

// ============ 配置结构 ============

/**
 * 字段定义
 */
export interface Field {
  columnName: string
  type: string
  length: string
  comments: string
  visibleType?: number
}

/**
 * 输入数据提供者
 */
export interface InputProvider {
  sourceNodeId: string
  sourceType: 'dataSource' | 'outputData'
  participantId: string
  dataset: string
  fields: FieldMapping[]
}

/**
 * 字段映射
 */
export interface FieldMapping {
  columnName: string
  columnAlias: string
  columnType: string
  isJoinField: boolean
  joinType?: 'INNER' | 'CROSS'
}

/**
 * Join条件
 */
export interface JoinCondition {
  joinType: 'INNER' | 'CROSS'
  operands: JoinOperand[]
}

/**
 * Join操作数
 */
export interface JoinOperand {
  participantId: string
  dataset: string
  columnNames: string[]
}

/**
 * 计算模型配置
 */
export interface ComputeModelConfig {
  id: string
  type: ModelType
  participantId: string
  name: string
  parameters?: ModelParameter[]
}

/**
 * 模型参数
 */
export interface ModelParameter {
  name: string
  bindingType: 'field' | 'fixed'
  fieldRef?: string
  fixedValue?: string
}

/**
 * 算力资源配置
 */
export interface ComputeResourceConfig {
  id: string
  participantId: string
  groupId: string
  groupName: string
  nodeId: string
  cardSerial: string
  cardModel: string
}

/**
 * 输出数据配置
 */
export interface OutputDataConfig {
  id: string
  participantId: string
  dataset: string
  outputFields: OutputField[]
  outputNodeId: string
}

/**
 * 输出字段
 */
export interface OutputField {
  source: 'input' | 'model'
  columnName: string
  columnAlias: string
  columnType: string
}

// ============ 辅助类型 ============

/**
 * 资源类型优先级（用于企业排序）
 */
export enum ResourceTypePriority {
  DATA = 3,
  MODEL = 2,
  COMPUTE = 1,
  OTHER = 0
}

/**
 * 企业选项
 */
export interface EnterpriseOption {
  id: string
  name: string
  resourceType: ResourceTypePriority
}

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * 技术路径选择结果
 */
export interface TechPathSelection {
  computeType: 'PSI' | 'PIR' | 'MPC'
  techPath: 'software' | 'tee'
  finalComputeType: ComputeType
}
