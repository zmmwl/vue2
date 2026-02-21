/**
 * 联邦学习任务类型定义
 * 包含任务参数模板、菜单结构等
 */

import type { DeployedModel } from './nodes'
import { FLTaskCategory, FLMode } from './nodes'

// 重新导出 FLTaskCategory 和 FLMode
export { FLTaskCategory, FLMode }

// ========== 参数定义相关类型 ==========

/** 参数数据类型 */
export enum FLParameterDataType {
  NUMBER = 'number',
  TEXT = 'text',
  SELECT = 'select',
  BOOLEAN = 'boolean',
  MULTISELECT = 'multiselect',
  ARRAY = 'array'
}

/** 参数选项（用于 select 和 multiselect 类型） */
export interface FLParameterOption {
  value: string
  label: string
  description?: string
}

/** 参数定义 */
export interface FLTaskParameterDef {
  name: string                    // 参数名称（英文标识）
  displayName: string             // 显示名称（中文）
  dataType: FLParameterDataType   // 参数数据类型
  required: boolean               // 是否必填
  defaultValue?: any              // 默认值
  description?: string            // 参数描述
  options?: FLParameterOption[]   // 选项列表（select/multiselect 类型）
  min?: number                    // 最小值（number 类型）
  max?: number                    // 最大值（number 类型）
  step?: number                   // 步进值（number 类型）
  placeholder?: string            // 占位符文本
  validate?: {
    pattern?: RegExp              // 正则验证
    min?: number                  // 最小值
    max?: number                  // 最大值
    message?: string              // 验证失败提示
  }
}

/** 联邦学习任务参数模板 */
export interface FLTaskParameterTemplate {
  taskName: string                // 任务名称（英文标识）
  displayName: string             // 显示名称（中文）
  category: FLTaskCategory        // 任务类别
  mode: FLMode                    // 训练/推断模式
  icon: string                    // 图标
  description?: string            // 任务描述
  parameters: FLTaskParameterDef[]  // 参数定义列表
}

// ========== 菜单结构相关类型 ==========

/** 联邦学习任务菜单项 */
export interface FLTaskMenuItem {
  name: string                    // 任务名称
  taskName: string                // 任务标识（用于创建节点）
  icon: string                    // 图标
  description?: string            // 任务描述
}

/** 联邦学习任务类别菜单 */
export interface FLTaskCategoryMenu {
  name: string                    // 类别名称（预处理、特征工程、横向模型、纵向模型）
  category: FLTaskCategory        // 类别标识
  icon: string                    // 类别图标
  tasks: FLTaskMenuItem[]         // 该类别下的任务列表
}

/** 联邦学习菜单结构 */
export interface FLMenuSection {
  title: string                   // 菜单标题
  mode: FLMode                    // 训练/推断模式
  categories: FLTaskCategoryMenu[] // 类别列表
}

// ========== API 响应类型 ==========

/** 获取已部署模型列表响应 */
export interface GetDeployedModelsResponse {
  success: boolean
  data: DeployedModel[]
  message?: string
}

/** 获取任务参数模板响应 */
export interface GetTaskParameterTemplateResponse {
  success: boolean
  data: FLTaskParameterTemplate
  message?: string
}

// ========== 参数值类型 ==========

/** 参数配置值 */
export interface FLParameterValue {
  name: string
  value: any
  isValid: boolean
  errorMessage?: string
}

/** 任务配置结果 */
export interface FLTaskConfig {
  taskName: string
  taskDisplayName: string
  category: FLTaskCategory
  mode: FLMode
  parameters: Record<string, any>
  deployedModelId?: string
  deployedModelName?: string
  trainingParticipants?: string[]
}

// ========== 连接验证相关类型 ==========

/** 联邦学习任务连接约束 */
export interface FLTaskConnectionConstraint {
  minDataSources: number          // 最小数据源数量
  maxDataSources: number          // 最大数据源数量
  minParticipants: number         // 最小参与方数量
  maxParticipants: number         // 最大参与方数量
  allowOutputNode: boolean        // 是否生成输出节点
}

/** 各类别任务的连接约束 */
export const FL_TASK_CONSTRAINTS: Record<FLTaskCategory, FLTaskConnectionConstraint> = {
  [FLTaskCategory.PREPROCESS]: {
    minDataSources: 1,
    maxDataSources: 1,
    minParticipants: 1,
    maxParticipants: 1,
    allowOutputNode: false
  },
  [FLTaskCategory.FEATURE_ENGINEERING]: {
    minDataSources: 2,
    maxDataSources: 10,
    minParticipants: 2,
    maxParticipants: 10,
    allowOutputNode: true
  },
  [FLTaskCategory.HORIZONTAL_MODEL]: {
    minDataSources: 2,
    maxDataSources: 10,
    minParticipants: 2,
    maxParticipants: 10,
    allowOutputNode: true
  },
  [FLTaskCategory.VERTICAL_MODEL]: {
    minDataSources: 2,
    maxDataSources: 10,
    minParticipants: 2,
    maxParticipants: 10,
    allowOutputNode: true
  }
}
