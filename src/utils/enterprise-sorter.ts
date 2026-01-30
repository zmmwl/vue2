/**
 * 企业排序工具函数
 * 按资源类型优先级排序企业列表
 */

import type { EnterpriseOption } from '@/types/nodes'
import { ResourceTypePriority } from '@/types/nodes'

/**
 * 按资源类型优先级对企业列表进行排序
 * 优先级顺序: DATA > MODEL > COMPUTE > OTHER
 *
 * @param enterprises - 企业选项列表
 * @returns 排序后的企业列表
 */
export function sortEnterprisesByPriority(enterprises: EnterpriseOption[]): EnterpriseOption[] {
  return [...enterprises].sort((a, b) => {
    const priorityA = a.resourceType ?? ResourceTypePriority.OTHER
    const priorityB = b.resourceType ?? ResourceTypePriority.OTHER

    // 优先级高的排在前面
    return priorityB - priorityA
  })
}

/**
 * 创建企业选项列表
 *
 * @param id - 企业 ID (participantId)
 * @param name - 企业名称
 * @param resourceType - 资源类型优先级
 * @returns 企业选项对象
 */
export function createEnterpriseOption(
  id: string,
  name: string,
  resourceType: ResourceTypePriority
): EnterpriseOption {
  return {
    id,
    name,
    resourceType
  }
}
