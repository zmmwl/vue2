/**
 * 企业排序工具
 * 实现加权优先级排序系统
 */

import type { EnterpriseOption } from '@/types/contracts'

/**
 * 资源类型优先级权重
 * DATA (数据资源) > MODEL (模型) > COMPUTE (算力) > OTHER (其他)
 */
export const RESOURCE_WEIGHTS: Record<number, number> = {
  3: 100, // DATA - 最高优先级
  2: 75,  // MODEL
  1: 50,  // COMPUTE
  0: 25   // OTHER - 最低优先级
}

/**
 * 带资源类型的企业选项
 */
export interface EnterpriseWithResource extends EnterpriseOption {
  originalName: string
  resourceCount: number
}

/**
 * 对企业选项按资源类型优先级排序
 * 同优先级按企业名称拼音排序
 *
 * @param enterprises 企业选项列表
 * @returns 排序后的企业列表
 */
export function sortEnterprises(
  enterprises: EnterpriseOption[]
): EnterpriseOption[] {
  return [...enterprises].sort((a, b) => {
    // 1. 先按资源类型优先级排序（权重高的在前）
    const weightA = RESOURCE_WEIGHTS[a.resourceType] ?? 0
    const weightB = RESOURCE_WEIGHTS[b.resourceType] ?? 0
    const weightDiff = weightB - weightA
    if (weightDiff !== 0) {
      return weightDiff
    }

    // 2. 同优先级按企业名称拼音排序（升序）
    return a.name.localeCompare(b.name, 'zh-CN')
  })
}

/**
 * 对企业选项按资源类型优先级排序（增强版）
 *
 * @param enterprises 企业选项列表（带额外信息）
 * @returns 排序后的企业列表
 */
export function sortEnterprisesWithResource(
  enterprises: EnterpriseWithResource[]
): EnterpriseWithResource[] {
  return [...enterprises].sort((a, b) => {
    // 1. 先按资源类型优先级排序
    const weightA = RESOURCE_WEIGHTS[a.resourceType] ?? 0
    const weightB = RESOURCE_WEIGHTS[b.resourceType] ?? 0
    const weightDiff = weightB - weightA
    if (weightDiff !== 0) {
      return weightDiff
    }

    // 2. 同优先级按资源数量排序（多的在前）
    if (b.resourceCount !== a.resourceCount) {
      return b.resourceCount - a.resourceCount
    }

    // 3. 同资源数量按企业名称拼音排序
    return a.name.localeCompare(b.name, 'zh-CN')
  })
}

/**
 * 获取资源类型的优先级标签
 */
export function getResourceTypeLabel(resourceType: number): string {
  const labels: Record<number, string> = {
    3: '数据资源',
    2: '计算模型',
    1: '算力资源',
    0: '其他'
  }
  return labels[resourceType] || '未知'
}

/**
 * 获取资源类型的优先级颜色（用于UI显示）
 */
export function getResourceTypeColor(resourceType: number): string {
  const colors: Record<number, string> = {
    3: '#52C41A', // DATA - 绿色
    2: '#1890FF', // MODEL - 蓝色
    1: '#FA8C16', // COMPUTE - 橙色
    0: '#8C8C8C'  // OTHER - 灰色
  }
  return colors[resourceType] || '#8C8C8C'
}

/**
 * 按资源类型分组企业
 */
export function groupEnterprisesByResource(
  enterprises: EnterpriseOption[]
): Map<number, EnterpriseOption[]> {
  const groups = new Map<number, EnterpriseOption[]>()

  for (const enterprise of enterprises) {
    const type = enterprise.resourceType
    if (!groups.has(type)) {
      groups.set(type, [])
    }
    groups.get(type)!.push(enterprise)
  }

  // 对每个组内的企业按名称排序
  for (const [type, group] of groups) {
    groups.set(type, sortEnterprises(group))
  }

  return groups
}
