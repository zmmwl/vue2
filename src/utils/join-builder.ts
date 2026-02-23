/**
 * Join 条件构建工具
 * 从字段映射配置构建 Join 条件结构
 */

import type { InputProvider, JoinCondition, JoinOperand } from '@/types/nodes'

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
