import { computed, type UnwrapRef } from 'vue'

/**
 * 参与方数据接口
 */
interface ParticipantData {
  participantId?: string
  entityName?: string
}

/**
 * 参与方名称显示 composable
 * 用于统一格式化参与方名称显示
 */
export function useParticipantDisplay(data: ParticipantData | UnwrapRef<ParticipantData>) {
  /**
   * 格式化的参与方名称
   * 格式: "企业名称 (平台ID)" 或 "平台ID" 或 "未选择企业"
   */
  const participantName = computed(() => {
    // 处理可能是 reactive 包装的数据
    const participantId = data?.participantId
    const entityName = data?.entityName

    if (entityName && participantId) {
      return `${entityName} (${participantId})`
    }
    if (participantId) {
      return participantId
    }
    return '未选择企业'
  })

  return {
    participantName
  }
}
