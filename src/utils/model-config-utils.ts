/**
 * 模型参数配置工具函数
 */

import type { ComputeTaskNodeData, AvailableFieldOption, ParameterConfigItem, ModelParameter, ModelParameterSignature } from '@/types/nodes'

/**
 * 从计算任务的 inputProviders 生成可用字段列表
 */
export function generateAvailableFields(taskData: ComputeTaskNodeData): AvailableFieldOption[] {
  const fields: AvailableFieldOption[] = []

  taskData.inputProviders?.forEach(provider => {
    provider.fields.forEach(field => {
      const fieldName = field.columnAlias || field.columnName
      fields.push({
        id: `${provider.participantId}.${provider.dataset}.${fieldName}`,
        participantId: provider.participantId,
        dataset: provider.dataset,
        fieldName: fieldName,
        fieldType: field.columnType,
        sourceNodeId: provider.sourceNodeId
      })
    })
  })

  return fields
}

/**
 * 验证必填参数是否已配置
 */
export function validateRequiredParams(items: ParameterConfigItem[]): string[] {
  const errors: string[] = []

  items.forEach(item => {
    if (item.isEncrypt === 1 && !item.isConfigured) {
      errors.push(`参数 "${item.name}" 为必填项，请配置`)
    }
  })

  return errors
}

/**
 * 获取数据类型名称
 */
export function getDataTypeName(dataType: number): string {
  const names: Record<number, string> = {
    1: 'STRING',
    2: 'INT',
    3: 'BIGINT',
    4: 'FLOAT',
    5: 'DOUBLE',
    6: 'BOOLEAN',
    7: 'DATETIME'
  }
  return names[dataType] || 'UNKNOWN'
}

/**
 * 获取数据类型颜色
 */
export function getDataTypeColor(dataType: number): string {
  const colors: Record<number, string> = {
    1: '#1890ff',  // STRING - 蓝色
    2: '#52c41a',  // INT - 绿色
    3: '#52c41a',  // BIGINT - 绿色
    4: '#fa8c16',  // FLOAT - 橙色
    5: '#fa8c16',  // DOUBLE - 橙色
    6: '#722ed1',  // BOOLEAN - 紫色
    7: '#13c2c2'   // DATETIME - 青色
  }
  return colors[dataType] || '#999999'
}

/**
 * 判断参数是否已配置
 */
export function isParameterConfigured(item: ParameterConfigItem): boolean {
  if (item.bindingType === 'field') {
    return !!item.fieldRef
  } else {
    return item.fixedValue !== undefined && item.fixedValue !== ''
  }
}

/**
 * 将参数配置项转换为 ModelParameter 格式
 */
export function convertToModelParameters(items: ParameterConfigItem[]): ModelParameter[] {
  return items.map(item => ({
    name: item.name,
    bindingType: item.bindingType,
    fieldRef: item.bindingType === 'field' ? item.fieldRef : undefined,
    fixedValue: item.bindingType === 'fixed' ? item.fixedValue : undefined
  }))
}

/**
 * 将可用字段按参与方分组
 */
export function groupFieldsByParticipant(fields: AvailableFieldOption[]): Array<{
  participantId: string
  dataset: string
  fields: AvailableFieldOption[]
}> {
  const groups: Map<string, {
    participantId: string
    dataset: string
    fields: AvailableFieldOption[]
  }> = new Map()

  fields.forEach(field => {
    const key = `${field.participantId}.${field.dataset}`
    if (!groups.has(key)) {
      groups.set(key, {
        participantId: field.participantId,
        dataset: field.dataset,
        fields: []
      })
    }
    groups.get(key)!.fields.push(field)
  })

  return Array.from(groups.values())
}

/**
 * 计算参数配置进度
 * @param parameters - 模型已配置的参数列表
 * @param signatures - 模型参数签名定义列表
 * @returns 进度信息对象
 */
export interface ParamProgressInfo {
  percentage: number        // 配置进度百分比 (0-100)
  configuredCount: number    // 已配置参数数量
  totalCount: number         // 总参数数量
  requiredMissing: number    // 未配置的必填参数数量
  status: 'unconfigured' | 'partial' | 'complete'  // 配置状态
}

export function calculateParamProgress(
  parameters: ModelParameter[],
  signatures: ModelParameterSignature[]
): ParamProgressInfo {
  if (!signatures || signatures.length === 0) {
    return {
      percentage: 100,
      configuredCount: 0,
      totalCount: 0,
      requiredMissing: 0,
      status: 'complete'
    }
  }

  // 创建已配置参数的名称映射
  const configuredParamNames = new Set(parameters?.map(p => p.name) || [])

  // 统计已配置和未配置的必填参数
  let configuredCount = 0
  let requiredMissing = 0

  signatures.forEach(sig => {
    const isConfigured = configuredParamNames.has(sig.name)
    if (isConfigured) {
      configuredCount++
    } else if (sig.isEncrypt === 1) {
      requiredMissing++
    }
  })

  const totalCount = signatures.length
  const percentage = totalCount > 0 ? Math.round((configuredCount / totalCount) * 100) : 0

  // 判断配置状态
  let status: 'unconfigured' | 'partial' | 'complete'
  if (configuredCount === 0) {
    status = 'unconfigured'
  } else if (configuredCount === totalCount) {
    status = 'complete'
  } else {
    status = 'partial'
  }

  return {
    percentage,
    configuredCount,
    totalCount,
    requiredMissing,
    status
  }
}

/**
 * 获取单个参数的配置摘要信息
 * @param param - 参数配置（可能未定义）
 * @param signature - 参数签名定义
 * @param availableFields - 可用字段列表
 * @returns 摘要信息对象
 */
export interface ParamSummaryInfo {
  type: 'field' | 'fixed' | 'unconfigured'  // 配置类型
  displayValue: string                        // 显示值
  dataType: string                            // 数据类型
  isConfigured: boolean                       // 是否已配置
  isRequired: boolean                         // 是否必填
  fieldInfo?: {                               // 字段信息（如果是字段绑定）
    participantId: string
    dataset: string
    fieldName: string
  }
}

export function getParamSummary(
  param: ModelParameter | undefined,
  signature: ModelParameterSignature,
  availableFields: AvailableFieldOption[]
): ParamSummaryInfo {
  const dataType = getDataTypeName(signature.dataType)
  const isRequired = signature.isEncrypt === 1

  // 如果没有配置
  if (!param || !isParameterConfigured({
    ...signature,
    bindingType: param.bindingType,
    fieldRef: param.fieldRef,
    fixedValue: param.fixedValue,
    isConfigured: false
  })) {
    return {
      type: 'unconfigured',
      displayValue: '未配置',
      dataType,
      isConfigured: false,
      isRequired
    }
  }

  // 字段绑定类型
  if (param.bindingType === 'field' && param.fieldRef) {
    const field = availableFields.find(f => f.id === param.fieldRef)
    if (field) {
      return {
        type: 'field',
        displayValue: `${field.participantId}.${field.dataset}.${field.fieldName}`,
        dataType,
        isConfigured: true,
        isRequired,
        fieldInfo: {
          participantId: field.participantId,
          dataset: field.dataset,
          fieldName: field.fieldName
        }
      }
    }
    return {
      type: 'field',
      displayValue: param.fieldRef,
      dataType,
      isConfigured: true,
      isRequired
    }
  }

  // 固定值类型
  return {
    type: 'fixed',
    displayValue: param.fixedValue || '',
    dataType,
    isConfigured: true,
    isRequired
  }
}
