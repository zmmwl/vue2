/**
 * ID 生成工具
 * 统一的唯一 ID 生成函数
 */

/**
 * 生成唯一 ID
 * @param prefix ID 前缀（如 'node', 'edge', 'job'）
 * @returns 唯一 ID 字符串
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}
