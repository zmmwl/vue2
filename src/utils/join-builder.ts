/**
 * Join 条件构建工具
 * 从字段映射配置构建 Join 条件结构
 */

import type { InputProvider, JoinCondition, JoinOperand, JoinType } from '@/types/nodes'

/**
 * 从输入提供者列表构建 Join 条件列表
 *
 * @param inputProviders - 输入数据提供者列表
 * @returns Join 条件列表
 */
export function buildJoinConditions(inputProviders: InputProvider[]): JoinCondition[] {
  if (!inputProviders || inputProviders.length < 2) {
    return []
  }

  // 按连接类型分组
  const innerProviders: InputProvider[] = []
  const crossProviders: InputProvider[] = []
  const unionProviders: InputProvider[] = []
  const noAssocProviders: InputProvider[] = []

  inputProviders.forEach(provider => {
    const joinType = provider.joinType || 'INNER'
    switch (joinType) {
      case 'INNER':
        innerProviders.push(provider)
        break
      case 'CROSS':
        crossProviders.push(provider)
        break
      case 'Union':
        unionProviders.push(provider)
        break
      case 'NoAssoc':
        noAssocProviders.push(provider)
        break
    }
  })

  const conditions: JoinCondition[] = []

  // 构建 INNER JOIN 条件
  if (innerProviders.length >= 2) {
    const innerOperands = buildInnerOperands(innerProviders)
    if (innerOperands.length >= 2) {
      conditions.push({
        joinType: 'INNER',
        operands: innerOperands
      })
    }
  }

  // 构建 CROSS JOIN 条件（只允许一个 CROSS 类型）
  if (crossProviders.length === 1) {
    // CROSS 可以与 INNER 或 Union 共存
    const crossOperands: JoinOperand[] = crossProviders.map(provider => ({
      participantId: provider.participantId,
      dataset: provider.dataset,
      columnNames: []
    }))

    // 如果有 INNER 提供者，将 CROSS 与 INNER 组合
    if (innerProviders.length > 0) {
      const innerOperands = buildInnerOperands(innerProviders)
      conditions.push({
        joinType: 'CROSS',
        operands: [...crossOperands, ...innerOperands]
      })
    } else if (unionProviders.length > 0) {
      // CROSS 与 Union 组合
      const unionOperands = unionProviders.map(provider => ({
        participantId: provider.participantId,
        dataset: provider.dataset,
        columnNames: []
      }))
      conditions.push({
        joinType: 'CROSS',
        operands: [...crossOperands, ...unionOperands]
      })
    } else {
      // 单独的 CROSS
      conditions.push({
        joinType: 'CROSS',
        operands: crossOperands
      })
    }
  }

  // 构建 Union 条件（空操作数）
  if (unionProviders.length >= 2) {
    conditions.push({
      joinType: 'Union',
      operands: unionProviders.map(provider => ({
        participantId: provider.participantId,
        dataset: provider.dataset,
        columnNames: []
      }))
    })
  }

  // NoAssoc 不生成 Join 条件，独立处理
  // 但如果有多个 NoAssoc 提供者，可以生成一个标记
  if (noAssocProviders.length > 0 && innerProviders.length === 0 && crossProviders.length === 0 && unionProviders.length === 0) {
    // 全部是 NoAssoc，每个独立处理
    noAssocProviders.forEach(provider => {
      conditions.push({
        joinType: 'NoAssoc',
        operands: [{
          participantId: provider.participantId,
          dataset: provider.dataset,
          columnNames: []
        }]
      })
    })
  }

  return conditions
}

/**
 * 构建 INNER JOIN 操作数
 * 收集所有标记为 join 字段的字段
 */
function buildInnerOperands(providers: InputProvider[]): JoinOperand[] {
  const joinFieldMap = new Map<string, JoinOperand>()

  providers.forEach(provider => {
    const joinFields = provider.fields
      .filter(f => f.isJoinField)
      .map(f => f.columnName)

    if (joinFields.length > 0) {
      const key = `${provider.participantId}.${provider.dataset}`
      if (joinFieldMap.has(key)) {
        // 合并字段
        const existing = joinFieldMap.get(key)!
        joinFields.forEach(name => {
          if (!existing.columnNames.includes(name)) {
            existing.columnNames.push(name)
          }
        })
      } else {
        joinFieldMap.set(key, {
          participantId: provider.participantId,
          dataset: provider.dataset,
          columnNames: joinFields
        })
      }
    }
  })

  return Array.from(joinFieldMap.values())
}

/**
 * 验证 Join 类型兼容性
 *
 * @param inputProviders - 输入数据提供者列表
 * @returns 验证结果和错误信息
 */
export function validateJoinCompatibility(inputProviders: InputProvider[]): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!inputProviders || inputProviders.length === 0) {
    return { valid: true, errors: [] }
  }

  // 统计各类型数量
  const typeCounts = new Map<JoinType, number>()
  inputProviders.forEach(provider => {
    const joinType = provider.joinType || 'INNER'
    typeCounts.set(joinType, (typeCounts.get(joinType) || 0) + 1)
  })

  const hasInner = (typeCounts.get('INNER') || 0) > 0
  const hasUnion = (typeCounts.get('Union') || 0) > 0
  const crossCount = typeCounts.get('CROSS') || 0

  // 规则1: Union 与 INNER 不能共存
  if (hasInner && hasUnion) {
    errors.push('Union(横向拼接)与 INNER(内连接)不能共存')
  }

  // 规则2: 只允许一个 CROSS 类型
  if (crossCount > 1) {
    errors.push('只允许一个输入源使用 CROSS(交叉连接)类型')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
