import { TechPath } from '@/types/nodes'

/**
 * 获取技术路径的显示标签
 * @param techPath 技术路径枚举值
 * @returns 格式化的标签字符串
 */
export function getTechPathLabel(techPath?: TechPath): string {
  if (techPath === TechPath.TEE) {
    return '硬件 TEE'
  }
  if (techPath === TechPath.SOFTWARE) {
    return '软件密码学'
  }
  return ''
}

/**
 * 获取资源类型的显示标签
 * @param resourceType 资源类型
 * @returns 格式化的标签字符串
 */
export function getResourceTypeLabel(resourceType?: string): string {
  const typeMap: Record<string, string> = {
    'TEE_CPU': 'TEE CPU',
    'TEE_GPU': 'TEE GPU',
    'TEE_FPGA': 'TEE FPGA'
  }
  return typeMap[resourceType || ''] || resourceType || 'TEE算力'
}
