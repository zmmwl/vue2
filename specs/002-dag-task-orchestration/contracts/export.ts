/**
 * 导出JSON Schema定义
 * 符合后端服务接口规范的JSON格式
 */

/**
 * 完整导出JSON结构
 */
export interface ExportJson {
  jobId: string
  name: string
  description: string
  status: number
  serviceType: number
  createParticipantId: string
  modelType: number
  tlsEnable: boolean
  assetDetailList: AssetDetail[]
  participantList: Participant[]
  taskList: Task[]
}

/**
 * 资产详情
 */
export interface AssetDetail {
  assetId: string
  participantId: string
  entityName: string
  assetName: string
  dbName: string
  tableName: string
  columnName: string
  type: string
  length: string
  comments: string
  holderCompany: string
  visibleType: number
}

/**
 * 参与方企业
 */
export interface Participant {
  participantId: string
  entityName: string
  role?: number
}

/**
 * 任务
 */
export interface Task {
  kind: 'Task'
  taskId: string
  name: string
  labelList?: string[]
  taskSrcIdList?: string[]      // 依赖任务ID列表
  isFinalTask: boolean
  serviceType: number
  computeType: ComputeType
  implementation: string
  joinConditionList?: JoinCondition[]
  queryConditionList?: QueryCondition[]
  dataProviderList: DataProvider[]
  resultConsumerList?: ResultConsumer[]
  participantList: Participant[]
  operationList?: Operation[]
  aggregation?: Aggregation
  expressionList?: Expression[]
  computeProviderList?: ComputeProvider[]
  modelProviderList?: ModelProvider[]
  chainInfoId?: string
  chainName?: string
  chainAccountAddress?: string
  txId?: string
  onChainStatus?: number
  onChainTime?: string
  createTime?: string
  updateTime?: string
}

/**
 * 计算类型
 */
export type ComputeType =
  | 'PSI' | 'TEE_PSI'
  | 'PIR' | 'TEE_PIR'
  | 'MPC' | 'TEE_MPC'
  | 'CONCAT'

/**
 * Join条件
 */
export interface JoinCondition {
  joinType: 'INNER' | 'CROSS'
  joinOperands: JoinOperand[]
}

/**
 * Join操作数
 */
export interface JoinOperand {
  participantId: string
  entityName: string
  dataset: string
  columnNameList: string[]
}

/**
 * 查询条件
 */
export interface QueryCondition {
  participantId: string
  entityName: string
  dataset: string
  columnNameList: string[]
  columnAliasList: string[]
  customParam: string
}

/**
 * 数据提供者
 */
export interface DataProvider {
  participantId: string
  entityName: string
  datasetList: DatasetItem[]
}

/**
 * 数据集项
 */
export interface DatasetItem {
  singleRow: boolean
  dataset: string
  columnNameList: string[]
  columnAliasList: string[]
  columnTypeList?: string[]
  customParam: Record<string, unknown>
}

/**
 * 结果消费者
 */
export interface ResultConsumer {
  participantId: string
  entityName: string
  isEncrypted?: boolean
  encType?: string
  encKey?: string
  encKeyName?: string
  datasetList: DatasetItem[]
}

/**
 * 表达式
 */
export interface Expression {
  expressionParamList: unknown[] | null
  expression: string
}

/**
 * 算力提供者
 */
export interface ComputeProvider {
  groupId: string
  participantId: string
  entityName: string
  groupName: string
  groupType: number
  computeNodeList: ComputeNode[]
}

/**
 * 计算节点
 */
export interface ComputeNode {
  nodeId: string
  nodeName: string
  nodeAddress: string
  nodeType: number
  computeCardList: ComputeCard[]
}

/**
 * 计算板卡
 */
export interface ComputeCard {
  cardSerial: string
  cardModel: string
  cardSpec: string
  cardVersion: string
  cardType: number
}

/**
 * 模型提供者
 */
export interface ModelProvider {
  modelId: string
  participantId: string
  entityName: string
  name: string
  type: string
  version: string
  description: string
  modelFileName: string
  methodName: string
  methodDescription: string
  programmingLanguage: string
  onChainContent: string
  modelParameterList: ModelParameter[]
}

/**
 * 模型参数
 */
export interface ModelParameter {
  participantId: string
  entityName: string
  dataset: string
  columnNameList: string[]
  columnAliasList: string[]
  customParam: string
}

/**
 * 操作
 */
export interface Operation {
  // 待定义
  [key: string]: unknown
}

/**
 * 聚合
 */
export interface Aggregation {
  groupByList: unknown[]
  functionList: unknown[]
  havingList: unknown[]
}

// ============ 转换工具类型 ============

/**
 * DAG节点到任务的映射上下文
 */
export interface DagToTaskContext {
  nodes: Map<string, unknown>
  edges: unknown[]
  taskOrder: string[]           // 拓扑排序的任务ID顺序
  participantSet: Set<string>   // 所有参与方企业
}

/**
 * 转换选项
 */
export interface ConvertOptions {
  generateJobId?: boolean
  prettyPrint?: boolean
  validate?: boolean
}

/**
 * 转换结果
 */
export interface ConvertResult {
  json: ExportJson
  errors: string[]
  warnings: string[]
}
