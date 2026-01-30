/**
 * Join 条件构建工具
 * 从字段映射配置构建 Join 条件结构
 */

import type { FieldMapping, InputProvider, JoinCondition, JoinOperand } from '@/types/nodes'

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

  // 按 joinType 分组字段
  const innerJoinFields = new Map<string, JoinOperand[]>()
  const crossJoinFields = new Map<string, JoinOperand[]>()

  inputProviders.forEach(provider => {
    provider.fields.forEach(field => {
      if (field.isJoinField) {
        const joinType = field.joinType || 'INNER'
        const key = `${provider.participantId}.${provider.dataset}.${field.columnName}`

        const operand: JoinOperand = {
          participantId: provider.participantId,
          dataset: provider.dataset,
          columnNames: [field.columnName]
        }

        if (joinType === 'INNER') {
          if (!innerJoinFields.has(key)) {
            innerJoinFields.set(key, [])
          }
          innerJoinFields.get(key)!.push(operand)
        } else {
          if (!crossJoinFields.has(key)) {
            crossJoinFields.set(key, [])
          }
          crossJoinFields.get(key)!.push(operand)
        }
      }
    })
  })

  const conditions: JoinCondition[] = []

  // 构建 INNER JOIN 条件
  if (innerJoinFields.size > 0) {
    // 收集所有 INNER JOIN 的操作数
    const allInnerOperands: JoinOperand[] = []
    innerJoinFields.forEach(operands => {
      // 合并相同字段的操作数
      operands.forEach(operand => {
        const existing = allInnerOperands.find(
          o => o.participantId === operand.participantId && o.dataset === operand.dataset
        )
        if (existing) {
          // 合并字段名
          operand.columnNames.forEach(name => {
            if (!existing.columnNames.includes(name)) {
              existing.columnNames.push(name)
            }
          })
        } else {
          allInnerOperands.push({ ...operand, columnNames: [...operand.columnNames] })
        }
      })
    })

    if (allInnerOperands.length >= 2) {
      conditions.push({
        joinType: 'INNER',
        operands: allInnerOperands
      })
    }
  }

  // 构建 CROSS JOIN 条件
  crossJoinFields.forEach(operands => {
    if (operands.length >= 2) {
      conditions.push({
        joinType: 'CROSS',
        operands
      })
    }
  })

  return conditions
}

/**
 * 从字段映射列表构建 Join 操作数
 *
 * @param fields - 字段映射列表
 * @param participantId - 参与方 ID
 * @param dataset - 数据集名称
 * @returns Join 操作数
 */
export function buildJoinOperand(
  fields: FieldMapping[],
  participantId: string,
  dataset: string
): JoinOperand {
  return {
    participantId,
    dataset,
    columnNames: fields.filter(f => f.isJoinField).map(f => f.columnName)
  }
}

/**
 * 合并相同参与方的 Join 操作数
 *
 * @param operands - Join 操作数列表
 * @returns 合并后的 Join 操作数列表
 */
export function mergeJoinOperands(operands: JoinOperand[]): JoinOperand[] {
  const merged = new Map<string, JoinOperand>()

  operands.forEach(operand => {
    const key = `${operand.participantId}.${operand.dataset}`

    if (merged.has(key)) {
      const existing = merged.get(key)!
      // 合并字段名，去重
      operand.columnNames.forEach(name => {
        if (!existing.columnNames.includes(name)) {
          existing.columnNames.push(name)
        }
      })
    } else {
      merged.set(key, {
        participantId: operand.participantId,
        dataset: operand.dataset,
        columnNames: [...operand.columnNames]
      })
    }
  })

  return Array.from(merged.values())
}

/**
 * 验证 Join 条件是否有效
 *
 * @param condition - Join 条件
 * @returns 是否有效
 */
export function isValidJoinCondition(condition: JoinCondition): boolean {
  if (!condition.operands || condition.operands.length < 2) {
    return false
  }

  // 检查每个操作数都有至少一个字段
  for (const operand of condition.operands) {
    if (!operand.columnNames || operand.columnNames.length === 0) {
      return false
    }
  }

  // 检查 joinType 是否有效
  if (condition.joinType !== 'INNER' && condition.joinType !== 'CROSS') {
    return false
  }

  return true
}

/**
 * 检查是否至少有一个 Join 字段
 *
 * @param inputProviders - 输入数据提供者列表
 * @returns 是否有 Join 字段
 */
export function hasJoinField(inputProviders: InputProvider[]): boolean {
  if (!inputProviders || inputProviders.length === 0) {
    return false
  }

  return inputProviders.some(provider =>
    provider.fields.some(field => field.isJoinField)
  )
}

/**
 * 获取所有 Join 字段的名称列表
 *
 * @param inputProviders - 输入数据提供者列表
 * @returns Join 字段名称列表
 */
export function getJoinFieldNames(inputProviders: InputProvider[]): string[] {
  const joinFields = new Set<string>()

  inputProviders.forEach(provider => {
    provider.fields
      .filter(field => field.isJoinField)
      .forEach(field => {
        joinFields.add(field.columnAlias || field.columnName)
      })
  })

  return Array.from(joinFields)
}
