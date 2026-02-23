/**
 * 分组统计工具函数
 */

/**
 * 从字段 ID 中提取字段名
 * @param fieldId 字段 ID（格式：input.nodeId.fieldName 或 model.modelId.fieldName）
 * @returns 字段名
 */
export function extractFieldName(fieldId: string): string {
  const parts = fieldId.split('.')
  return parts[parts.length - 1] || ''
}
