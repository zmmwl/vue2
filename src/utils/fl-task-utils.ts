/**
 * 联邦学习任务工具函数
 */

import type { Edge, Node } from '@vue-flow/core'
import { FLTaskExecutionType } from '@/types/fl-tasks'
import { getExecutionTypeForTask } from '@/utils/mock-fl-data'

/**
 * 根据连接数量确定动态任务的实际执行类型
 * @param taskName - 任务名称
 * @param connectionCount - 输入连接数量
 * @returns 实际的执行类型
 */
export function determineDynamicExecutionType(
  taskName: string,
  connectionCount: number
): FLTaskExecutionType | undefined {
  const baseType = getExecutionTypeForTask(taskName)

  // 如果没有找到执行类型，返回 undefined
  if (!baseType) {
    return undefined
  }

  // 非动态任务直接返回原类型
  if (baseType !== FLTaskExecutionType.DYNAMIC) {
    return baseType
  }

  // 动态任务：1个连接=LOCAL，2+连接=MULTI_PARTY
  return connectionCount === 1
    ? FLTaskExecutionType.LOCAL
    : FLTaskExecutionType.MULTI_PARTY
}

/**
 * 检查连接是否满足任务的约束
 * @param taskName - 任务名称
 * @param connectionCount - 输入连接数量
 * @returns 验证结果 { valid: boolean, message?: string }
 */
export function validateConnectionConstraint(
  taskName: string,
  connectionCount: number
): { valid: boolean; message?: string } {
  const baseType = getExecutionTypeForTask(taskName)

  switch (baseType) {
    case FLTaskExecutionType.LOCAL:
      // 单方本地任务只能连接1个数据源
      if (connectionCount > 1) {
        return {
          valid: false,
          message: '该任务只能连接1个数据源，当前已连接多个数据源'
        }
      }
      return { valid: true }

    case FLTaskExecutionType.MULTI_PARTY:
      // 多方隐私任务：允许连接1-10个数据源（执行时检查至少2个）
      if (connectionCount > 10) {
        return {
          valid: false,
          message: '该任务最多连接10个数据源'
        }
      }
      return { valid: true }

    case FLTaskExecutionType.DYNAMIC:
      // 动态任务最少1个数据源，最多10个
      if (connectionCount < 1) {
        return {
          valid: false,
          message: '该任务至少需要连接1个数据源'
        }
      }
      if (connectionCount > 10) {
        return {
          valid: false,
          message: '该任务最多连接10个数据源'
        }
      }
      return { valid: true }

    default:
      return { valid: true }
  }
}

/**
 * 获取节点当前的有效执行类型（考虑动态任务）
 * @param node - 节点对象
 * @param edges - 所有边列表
 * @returns 有效的执行类型
 */
export function getEffectiveExecutionType(
  node: Node,
  edges: Edge[]
): FLTaskExecutionType | undefined {
  const taskName = node.data?.taskName
  if (!taskName) return undefined

  // 计算指向该节点的连接数量
  const connectionCount = edges.filter(e => e.target === node.id).length

  return determineDynamicExecutionType(taskName, connectionCount)
}

/**
 * 检查是否应该显示"添加输出"按钮
 * @param taskName - 任务名称
 * @param connectionCount - 输入连接数量
 * @returns 是否显示添加输出按钮
 */
export function shouldShowAddOutputButton(
  taskName: string,
  connectionCount: number
): boolean {
  const effectiveType = determineDynamicExecutionType(taskName, connectionCount)
  return effectiveType === FLTaskExecutionType.MULTI_PARTY
}
