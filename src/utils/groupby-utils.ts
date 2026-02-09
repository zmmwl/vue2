import type { GroupByConfig } from '@/types/nodes'

/**
 * 生成分组统计模型的输出字段
 * @param groupByConfig 分组统计配置
 * @param _inputProviders 输入数据提供者列表（保留参数兼容性，未使用）
 * @returns 输出字段列表
 */
export function generateGroupByOutputFields(
  groupByConfig: GroupByConfig,
  _inputProviders: any[]
): Array<{ name: string; type: string; source: 'group' | 'stat' }> {
  const fields: Array<{ name: string; type: string; source: 'group' | 'stat' }> = []

  // 添加分组字段
  groupByConfig.groupByFields.forEach(field => {
    fields.push({
      name: field.fieldAlias || field.fieldName,
      type: field.fieldType,
      source: 'group'
    })
  })

  // 添加统计字段
  groupByConfig.statistics.forEach(stat => {
    const resultType = inferAggregationType(stat.functionType)
    fields.push({
      name: stat.resultAlias,
      type: resultType,
      source: 'stat'
    })
  })

  return fields
}

/**
 * 推断聚合函数结果类型
 * @param func 聚合函数类型
 * @returns 结果数据类型
 */
function inferAggregationType(func: string): string {
  switch (func) {
    case 'SUM':
    case 'AVG':
      return 'DOUBLE'
    case 'COUNT':
      return 'BIGINT'
    case 'MAX':
    case 'MIN':
      return 'VARCHAR'  // 需要根据输入字段推断
    default:
      return 'VARCHAR'
  }
}

/**
 * 生成 SQL 预览
 * @param config 分组统计配置
 * @returns SQL 语句字符串
 */
export function generateGroupBySQL(config: GroupByConfig): string {
  if (config.groupByFields.length === 0 && config.statistics.length === 0) {
    return '-- 请配置分组字段和统计'
  }

  const groupByClause = config.groupByFields
    .map(f => f.fieldAlias || f.fieldName)
    .join(', ')

  const selectItems: string[] = []

  // 分组字段
  config.groupByFields.forEach(f => {
    selectItems.push(f.fieldAlias || f.fieldName)
  })

  // 统计字段
  config.statistics.forEach(stat => {
    const fieldName = extractFieldName(stat.fieldId)
    selectItems.push(`${stat.functionType}(${fieldName}) AS ${stat.resultAlias}`)
  })

  const selectClause = selectItems.join(',\n  ')
  const groupByText = groupByClause ? `GROUP BY ${groupByClause}` : ''

  return `SELECT\n  ${selectClause}\nFROM source_table${groupByText ? '\n' + groupByText : ''}`
}

/**
 * 从字段 ID 中提取字段名
 * @param fieldId 字段 ID（格式：input.nodeId.fieldName 或 model.modelId.fieldName）
 * @returns 字段名
 */
export function extractFieldName(fieldId: string): string {
  const parts = fieldId.split('.')
  return parts[parts.length - 1] || ''
}

/**
 * 获取分组统计模型的输出字段信息
 * @param taskModels 任务模型列表
 * @returns 分组统计输出字段列表
 */
export function getGroupByModelOutputFields(taskModels: any[]): Array<{ name: string; type: string }> {
  const groupByModel = taskModels.find(m => m.type === 'GROUP_STAT')
  if (!groupByModel || !groupByModel.groupByConfig) {
    return []
  }

  const fields: Array<{ name: string; type: string }> = []
  const config = groupByModel.groupByConfig

  // 添加分组字段
  config.groupByFields.forEach((field: any) => {
    fields.push({
      name: field.fieldAlias || field.fieldName,
      type: field.fieldType
    })
  })

  // 添加统计字段
  config.statistics.forEach((stat: any) => {
    const resultType = inferAggregationType(stat.functionType)
    fields.push({
      name: stat.resultAlias,
      type: resultType
    })
  })

  return fields
}

/**
 * 验证分组统计配置是否有效
 * @param config 分组统计配置
 * @returns 验证结果对象
 */
export function validateGroupByConfig(config: GroupByConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // 分组字段可以为空，所以不验证

  if (config.statistics.length === 0) {
    errors.push('请至少添加一个统计配置')
  }

  for (const stat of config.statistics) {
    if (!stat.fieldId) {
      errors.push(`统计配置 ${stat.id} 必须选择一个字段`)
    }

    if (!stat.resultAlias) {
      errors.push(`统计配置 ${stat.id} 必须设置结果别名`)
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
