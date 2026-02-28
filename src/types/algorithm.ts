/**
 * 算法相关类型定义
 * Feature: 004-algorithm-selection
 */

// ========== 算法类型枚举 ==========

/** 算法类型（区分技术路径） */
export enum AlgorithmType {
  // 软件密码学
  PSI = 'PSI',           // 隐私集合求交
  PIR = 'PIR',           // 隐私信息检索
  MPC = 'MPC',           // 多方安全计算
  FL = 'FL',             // 联邦学习

  // 硬件TEE
  TEE_PSI = 'TEE_PSI',
  TEE_PIR = 'TEE_PIR',
  TEE_MPC = 'TEE_MPC',
  TEE_FL = 'TEE_FL'
}

/** 参数类型枚举 */
export enum ParamType {
  STRING = 'string',     // 字符串
  INTEGER = 'integer',   // 整数
  FLOAT = 'float',       // 浮点数
  BOOLEAN = 'boolean',   // 布尔值
  ENUM = 'enum',         // 枚举
  DATE = 'date',         // 日期
  JSON = 'json',         // JSON对象
  ARRAY = 'array'        // 数组
}

// ========== 参数相关类型 ==========

/** 参数值类型 */
export type ParamValue = string | number | boolean | Date | object | any[]

/** 枚举选项 */
export interface EnumOption {
  value: string                // 选项值
  label: string                // 显示文本
  description?: string         // 选项描述
}

/** 参数验证规则 */
export interface ParamValidation {
  // 字符串验证
  minLength?: number           // 最小长度
  maxLength?: number           // 最大长度
  pattern?: string             // 正则表达式

  // 数值验证
  min?: number                 // 最小值
  max?: number                 // 最大值

  // 枚举验证
  enumOptions?: EnumOption[]   // 枚举选项

  // 数组验证
  itemMinCount?: number        // 数组最小元素数
  itemMaxCount?: number        // 数组最大元素数
}

/** 算法参数模板 */
export interface AlgorithmParamTemplate {
  // 字段标识
  key: string                  // 参数键名 (如: "iterationCount")

  // 显示信息
  label: string                // 显示标签 (如: "迭代次数")
  description?: string         // 参数描述
  placeholder?: string         // 输入提示

  // 类型定义
  type: ParamType              // 参数类型

  // 验证规则
  required: boolean            // 是否必填
  validation?: ParamValidation // 验证规则

  // 默认值
  defaultValue?: ParamValue    // 默认值

  // 排序
  order: number                // 显示顺序
}

// ========== 算法实体 ==========

/** 算法实体 */
export interface Algorithm {
  // 唯一标识符 (格式: {nameEn}-{version})
  id: string                    // 例: "SPDZ-v1.0"

  // 基本信息
  name: string                  // 算法名称 (如: "SPDZ协议算法")
  nameEn: string                // 英文名称 (如: "SPDZ")
  version: string               // 版本号 (如: "v1.0")
  description?: string          // 算法描述

  // 类型信息
  type: AlgorithmType           // 算法类型 (区分技术路径)

  // 算法包 (Mock场景为空)
  packageFileName?: string      // 文件名 (预留)
  packageSize?: number          // 文件大小 (预留)

  // 参数模板
  paramTemplate: AlgorithmParamTemplate[]

  // 元数据
  createdAt: number             // 创建时间戳 (毫秒)
  updatedAt?: number            // 更新时间戳
}

// ========== 任务算法配置 ==========

/** 任务算法配置（存储在任务节点中） */
export interface TaskAlgorithmConfig {
  // 算法引用
  algorithmId: string          // 算法ID (如: "SPDZ-v1.0")
  algorithmName: string        // 算法名称 (冗余存储，便于显示)
  algorithmVersion: string     // 算法版本

  // 用户填写的参数值
  algorithmParams: Record<string, ParamValue>
}

// ========== API相关类型 ==========

/** 创建算法输入 */
export interface CreateAlgorithmInput {
  name: string
  nameEn: string
  version: string
  description?: string
  type: AlgorithmType
  paramTemplate?: AlgorithmParamTemplate[]
}

/** 更新算法输入 */
export interface UpdateAlgorithmInput {
  name?: string
  description?: string
  paramTemplate?: AlgorithmParamTemplate[]
}

/** 算法使用情况 */
export interface AlgorithmUsage {
  isUsed: boolean
  usedByTaskCount: number
  usedByTasks: Array<{
    taskId: string
    taskName: string
  }>
}

// ========== 工具函数类型 ==========

/** 算法类型与任务类型映射 */
export const AlgorithmTypeToComputeTaskType: Record<AlgorithmType, string> = {
  [AlgorithmType.PSI]: 'PSI',
  [AlgorithmType.TEE_PSI]: 'PSI',  // TEE_PSI也对应PSI任务
  [AlgorithmType.PIR]: 'PIR',
  [AlgorithmType.TEE_PIR]: 'PIR',
  [AlgorithmType.MPC]: 'MPC',
  [AlgorithmType.TEE_MPC]: 'MPC',
  [AlgorithmType.FL]: 'FL',
  [AlgorithmType.TEE_FL]: 'FL'
}

/** 根据任务类型和技术路径获取算法类型 */
export function getAlgorithmTypeByTask(taskType: string, isTEE: boolean = false): AlgorithmType {
  const typeMap: Record<string, AlgorithmType> = {
    'PSI': isTEE ? AlgorithmType.TEE_PSI : AlgorithmType.PSI,
    'PIR': isTEE ? AlgorithmType.TEE_PIR : AlgorithmType.PIR,
    'MPC': isTEE ? AlgorithmType.TEE_MPC : AlgorithmType.MPC,
    'FL': isTEE ? AlgorithmType.TEE_FL : AlgorithmType.FL
  }
  return typeMap[taskType] || AlgorithmType.MPC
}

/** 所有算法类型列表 */
export const ALL_ALGORITHM_TYPES: AlgorithmType[] = [
  AlgorithmType.PSI,
  AlgorithmType.TEE_PSI,
  AlgorithmType.PIR,
  AlgorithmType.TEE_PIR,
  AlgorithmType.MPC,
  AlgorithmType.TEE_MPC,
  AlgorithmType.FL,
  AlgorithmType.TEE_FL
]

/** 算法类型显示名称 */
export const AlgorithmTypeLabels: Record<AlgorithmType, string> = {
  [AlgorithmType.PSI]: 'PSI (隐私集合求交)',
  [AlgorithmType.TEE_PSI]: 'TEE-PSI (硬件加速)',
  [AlgorithmType.PIR]: 'PIR (隐私信息检索)',
  [AlgorithmType.TEE_PIR]: 'TEE-PIR (硬件加速)',
  [AlgorithmType.MPC]: 'MPC (多方安全计算)',
  [AlgorithmType.TEE_MPC]: 'TEE-MPC (硬件加速)',
  [AlgorithmType.FL]: 'FL (联邦学习)',
  [AlgorithmType.TEE_FL]: 'TEE-FL (硬件加速)'
}
