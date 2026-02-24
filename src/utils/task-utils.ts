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
