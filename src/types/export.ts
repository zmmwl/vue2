/**
 * DAG 导出 JSON 类型定义
 * 这些类型用于将画布中的节点和连线转换为标准 JSON 格式
 */

// ========== 参与方相关类型 ==========

/** 参与方企业信息 */
export interface Participant {
  participantId: string        // 平台 ID（唯一标识）
  entityName: string           // 企业名称
}

// ========== 数据提供者相关类型 ==========

/** 字段映射信息 */
export interface FieldMapping {
  fieldName: string            // 字段名称
  alias?: string               // 字段别名（可选）
  isJoinField?: boolean        // 是否为 join 字段（可选）
}

/** 数据提供者配置 */
export interface DataProvider {
  participantId: string        // 参与方 ID
  assetId: string              // 数据资产 ID
  fieldList: FieldMapping[]    // 字段列表（包含别名和 join 标记）
}

/** Join 条件 */
export interface JoinCondition {
  participantIdList: string[]  // 参与 join 的参与方 ID 列表
  joinFieldList: string[]      // join 字段名称列表
}

// ========== 模型提供者相关类型 ==========

/** 模型参数绑定 */
export interface ModelParamBinding {
  name: string                 // 参数名称
  value: string                // 参数值（绑定字段或固定值）
  type: 'field' | 'value'      // 值类型：field-字段引用, value-固定值
}

/** 模型提供者配置 */
export interface ModelProvider {
  participantId: string        // 参与方 ID
  modelId: string              // 模型 ID
  paramList: ModelParamBinding[]  // 模型参数列表
}

/** 表达式配置 */
export interface Expression {
  participantId: string        // 参与方 ID
  expression: string           // Python 表达式内容
}

// ========== 算力提供者相关类型 ==========

/** 算力提供者配置 */
export interface ComputeProvider {
  participantId: string        // 参与方 ID
  resourceId: string           // 算力资源 ID
}

// ========== 结果消费者相关类型 ==========

/** 输出字段 */
export interface OutputField {
  fieldName: string            // 字段名称
  alias?: string               // 字段别名（可选）
}

/** 结果消费者配置 */
export interface ResultConsumer {
  participantId: string        // 接收结果的参与方 ID
  fieldList: OutputField[]     // 输出字段列表
}

// ========== 任务相关类型 ==========

/** 计算类型枚举 */
export enum ComputeType {
  PSI = 'PSI',                    // 隐私集合求交
  PIR = 'PIR',                    // 隐私信息检索
  MPC = 'MPC',                    // 多方安全计算
  FEDERATED_LEARNING = 'FEDERATED_LEARNING',  // 联邦学习
  CONCAT = 'CONCAT'               // 结果拼接
}

/** 技术路径枚举 */
export enum TechPath {
  SOFTWARE_CRYPTO = 'SOFTWARE_CRYPTO',  // 软件密码学
  TEE = 'TEE'                           // 硬件 TEE
}

/** 计算任务配置 */
export interface Task {
  taskId: string               // 任务唯一标识
  computeType: ComputeType     // 计算类型
  techPath?: TechPath          // 技术路径（可选）
  taskSrcIdList?: string[]     // 源任务 ID 列表（用于任务依赖）
  dataProviderList: DataProvider[]  // 数据提供者列表
  joinConditionList?: JoinCondition[]  // Join 条件列表
  modelProviderList?: ModelProvider[]  // 模型提供者列表
  expressionList?: Expression[]  // 表达式列表
  computeProviderList?: ComputeProvider[]  // 算力提供者列表
  resultConsumerList: ResultConsumer[]  // 结果消费者列表
  isFinalTask?: boolean        // 是否为最终任务（可选）
}

// ========== 导出 JSON 结构 ==========

/** 完整导出 JSON 结构 */
export interface ExportJson {
  jobId: string                // 作业唯一标识
  participantList: Participant[]  // 参与方列表
  taskList: Task[]              // 任务列表
}
