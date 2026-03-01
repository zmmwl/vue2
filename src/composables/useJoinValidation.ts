/**
 * Join 类型校验 Composable
 * 提供响应式的类型兼容性校验
 */

import { computed, type Ref } from 'vue'
import type { InputProvider, JoinType } from '@/types/nodes'

export interface JoinValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Join 类型兼容性矩阵
 */
const COMPATIBILITY_MATRIX: Record<JoinType, JoinType[]> = {
  'INNER': ['INNER', 'CROSS', 'NoAssoc'],
  'CROSS': ['INNER', 'CROSS', 'Union', 'NoAssoc'],
  'Union': ['Union', 'CROSS', 'NoAssoc'],
  'NoAssoc': ['INNER', 'CROSS', 'Union', 'NoAssoc']
}

/**
 * 检查两种类型是否兼容
 */
export function areTypesCompatible(type1: JoinType, type2: JoinType): boolean {
  return COMPATIBILITY_MATRIX[type1].includes(type2)
}

/**
 * 验证 Join 类型兼容性
 */
export function validateJoinTypes(inputProviders: InputProvider[]): JoinValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!inputProviders || inputProviders.length === 0) {
    return { valid: true, errors: [], warnings: [] }
  }

  // 统计各类型数量
  const typeCounts = new Map<JoinType, number>()
  const providersByType = new Map<JoinType, InputProvider[]>()

  inputProviders.forEach(provider => {
    const joinType = provider.joinType || 'INNER'
    typeCounts.set(joinType, (typeCounts.get(joinType) || 0) + 1)

    if (!providersByType.has(joinType)) {
      providersByType.set(joinType, [])
    }
    providersByType.get(joinType)!.push(provider)
  })

  const hasInner = (typeCounts.get('INNER') || 0) > 0
  const hasUnion = (typeCounts.get('Union') || 0) > 0
  const crossCount = typeCounts.get('CROSS') || 0
  const noAssocCount = typeCounts.get('NoAssoc') || 0

  // 规则1: Union 与 INNER 不能共存
  if (hasInner && hasUnion) {
    errors.push('Union(横向拼接)与 INNER(内连接)不能共存')
  }

  // 规则2: 只允许一个 CROSS 类型
  if (crossCount > 1) {
    errors.push('只允许一个输入源使用 CROSS(交叉连接)类型')
  }

  // 警告: 只有 NoAssoc 类型
  if (noAssocCount > 0 && inputProviders.length === noAssocCount) {
    warnings.push('所有数据源都配置为 NoAssoc(无关联)类型，每个数据源将独立处理')
  }

  // 警告: 单个数据源
  if (inputProviders.length === 1) {
    warnings.push('只有一个数据源，Join 类型设置可能不影响结果')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * useJoinValidation Composable
 * 提供响应式的 Join 类型校验
 */
export function useJoinValidation(inputProviders: Ref<InputProvider[]>) {
  // 计算校验结果
  const validationResult = computed<JoinValidationResult>(() => {
    return validateJoinTypes(inputProviders.value)
  })

  // 是否有效
  const isValid = computed(() => validationResult.value.valid)

  // 错误列表
  const errors = computed(() => validationResult.value.errors)

  // 警告列表
  const warnings = computed(() => validationResult.value.warnings)

  // 是否有冲突
  const hasConflicts = computed(() => !isValid.value)

  // 错误数量
  const errorCount = computed(() => errors.value.length)

  // 警告数量
  const warningCount = computed(() => warnings.value.length)

  // 获取类型统计
  const typeStats = computed(() => {
    const stats = new Map<JoinType, number>()
    inputProviders.value.forEach(provider => {
      const joinType = provider.joinType || 'INNER'
      stats.set(joinType, (stats.get(joinType) || 0) + 1)
    })
    return stats
  })

  // 获取 CROSS 类型数量
  const crossCount = computed(() => typeStats.value.get('CROSS') || 0)

  // 是否有 INNER 类型
  const hasInnerType = computed(() => (typeStats.value.get('INNER') || 0) > 0)

  // 是否有 Union 类型
  const hasUnionType = computed(() => (typeStats.value.get('Union') || 0) > 0)

  return {
    validationResult,
    isValid,
    errors,
    warnings,
    hasConflicts,
    errorCount,
    warningCount,
    typeStats,
    crossCount,
    hasInnerType,
    hasUnionType,
    validateJoinTypes,
    areTypesCompatible
  }
}
