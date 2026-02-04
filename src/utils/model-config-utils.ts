/**
 * 模型参数配置工具函数
 */

import type { ComputeTaskNodeData, AvailableFieldOption, ParameterConfigItem, ModelParameter } from '@/types/nodes'

/**
 * 从计算任务的 inputProviders 生成可用字段列表
 */
export function generateAvailableFields(taskData: ComputeTaskNodeData): AvailableFieldOption[] {
  const fields: AvailableFieldOption[] = []

  taskData.inputProviders?.forEach(provider => {
    provider.fields.forEach(field => {
      fields.push({
        id: `${provider.participantId}.${provider.dataset}.${field.columnName}`,
        participantId: provider.participantId,
        dataset: provider.dataset,
        fieldName: field.columnName,
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
