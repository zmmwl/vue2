/**
 * 配置验证工具
 * 验证任务配置的完整性和正确性
 */

import type { ComputeTaskNodeData, LocalTaskNodeData, JoinCondition, FieldMapping, NodeData } from '@/types/nodes'
import type { Node as FlowNode } from '@vue-flow/core'

/**
 * 验证结果接口
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * 验证任务配置
 *
 * @param taskData - 任务节点数据
 * @returns 验证结果
 */
export function validateTaskConfig(taskData: ComputeTaskNodeData | LocalTaskNodeData): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // 验证输入数据提供者
  if (!taskData.inputProviders || taskData.inputProviders.length === 0) {
    errors.push('至少需要配置一个输入数据源')
  } else {
    taskData.inputProviders.forEach((provider, index) => {
      if (!provider.participantId) {
        errors.push(`输入数据源 ${index + 1}: 缺少参与方 ID`)
      }
      if (!provider.dataset) {
        errors.push(`输入数据源 ${index + 1}: 缺少数据集名称`)
      }
      if (!provider.fields || provider.fields.length === 0) {
        errors.push(`输入数据源 ${index + 1}: 至少需要选择一个字段`)
      }
    })
  }

  // 验证 Join 条件（仅 ComputeTaskNodeData 有）
  if ('joinConditions' in taskData && taskData.joinConditions && taskData.joinConditions.length > 0) {
    const joinValidation = validateJoinConditions(taskData.joinConditions)
    errors.push(...joinValidation.errors)
    warnings.push(...joinValidation.warnings)
  } else if (taskData.inputProviders && taskData.inputProviders.length > 1) {
    // 多个输入数据源时，Join 条件是必需的
    warnings.push('多个输入数据源建议配置 Join 条件')
  }

  // 验证模型配置（仅对 MPC 类型的 ComputeTaskNodeData）
  if ('taskType' in taskData && (taskData.taskType === 'MPC')) {
    if ('models' in taskData && (!taskData.models || taskData.models.length === 0)) {
      if ('expression' in taskData && !taskData.expression) {
        errors.push('MPC 计算任务需要配置模型或表达式')
      }
    }
  }

  // 验证输出配置
  if (!taskData.outputs || taskData.outputs.length === 0) {
    warnings.push('任务未配置输出，可能无法获取计算结果')
  }

  // 验证算力资源（仅对 TEE 技术路径的 ComputeTaskNodeData）
  if ('techPath' in taskData && taskData.techPath === 'tee') {
    if ('computeProviders' in taskData && (!taskData.computeProviders || taskData.computeProviders.length === 0)) {
      errors.push('TEE 技术路径需要配置算力资源')
    }
  }

  // 本地任务特殊验证
  if ('computeType' in taskData && taskData.computeType === 'CONCAT') {
    if ('participantId' in taskData && !taskData.participantId) {
      errors.push('本地任务必须指定执行参与方')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * 验证 Join 条件
 *
 * @param joinConditions - Join 条件列表
 * @returns 验证结果
 */
export function validateJoinConditions(joinConditions: JoinCondition[]): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!joinConditions || joinConditions.length === 0) {
    return {
      valid: false,
      errors: ['至少需要一个 Join 条件'],
      warnings: []
    }
  }

  joinConditions.forEach((condition, index) => {
    // 验证操作数
    if (!condition.operands || condition.operands.length < 2) {
      errors.push(`Join 条件 ${index + 1}: 至少需要 2 个操作数`)
    } else {
      condition.operands.forEach((operand, opIndex) => {
        if (!operand.participantId) {
          errors.push(`Join 条件 ${index + 1}, 操作数 ${opIndex + 1}: 缺少参与方 ID`)
        }
        if (!operand.dataset) {
          errors.push(`Join 条件 ${index + 1}, 操作数 ${opIndex + 1}: 缺少数据集名称`)
        }
        if (!operand.columnNames || operand.columnNames.length === 0) {
          errors.push(`Join 条件 ${index + 1}, 操作数 ${opIndex + 1}: 至少需要一个 Join 字段`)
        }
      })
    }

    // 验证 Join 类型
    if (condition.joinType !== 'INNER' && condition.joinType !== 'CROSS') {
      errors.push(`Join 条件 ${index + 1}: 无效的 Join 类型`)
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * 验证输入数据提供者中是否至少有一个 Join 字段
 *
 * @param inputProviders - 输入数据提供者列表
 * @returns 验证结果
 */
export function validateJoinFields(inputProviders: any[]): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!inputProviders || inputProviders.length === 0) {
    return {
      valid: false,
      errors: ['至少需要一个输入数据源'],
      warnings: []
    }
  }

  let hasJoinField = false

  inputProviders.forEach((provider) => {
    if (provider.fields && provider.fields.length > 0) {
      const hasJoin = provider.fields.some((field: FieldMapping) => field.isJoinField)
      if (hasJoin) {
        hasJoinField = true
      }
    }
  })

  if (!hasJoinField) {
    errors.push('至少需要选择一个字段作为 Join 字段')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * 验证字段映射配置
 *
 * @param fields - 字段映射列表
 * @returns 验证结果
 */
export function validateFieldMappings(fields: FieldMapping[]): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!fields || fields.length === 0) {
    return {
      valid: false,
      errors: ['至少需要一个字段'],
      warnings: []
    }
  }

  const aliases = new Set<string>()

  fields.forEach((field, index) => {
    if (!field.columnName) {
      errors.push(`字段 ${index + 1}: 缺少字段名称`)
    }
    if (!field.columnType) {
      errors.push(`字段 ${index + 1}: 缺少字段类型`)
    }

    // 检查别名重复
    const alias = field.columnAlias || field.columnName
    if (aliases.has(alias)) {
      errors.push(`字段 ${index + 1}: 别名 "${alias}" 重复`)
    } else {
      aliases.add(alias)
    }

    // 检查 Join 字段
    if (field.isJoinField && !field.joinType) {
      warnings.push(`字段 ${index + 1}: Join 字段建议指定 Join 类型`)
    }
  })

  // 检查是否至少有一个 Join 字段
  const hasJoinField = fields.some(f => f.isJoinField)
  if (!hasJoinField) {
    warnings.push('没有选择 Join 字段，可能无法正确关联数据')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * 验证表达式配置
 *
 * @param expression - 表达式字符串
 * @returns 验证结果
 */
export function validateExpression(expression: string): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!expression || expression.trim().length === 0) {
    return {
      valid: false,
      errors: ['表达式不能为空'],
      warnings: []
    }
  }

  // 基本语法检查
  // 检查是否有未闭合的括号
  let parenCount = 0
  for (const char of expression) {
    if (char === '(') parenCount++
    if (char === ')') parenCount--
    if (parenCount < 0) {
      errors.push('括号不匹配：右括号过多')
      break
    }
  }
  if (parenCount > 0) {
    errors.push('括号不匹配：左括号未闭合')
  }

  // 检查是否包含基本运算符
  const hasOperator = /[+\-*/%=<>!&|^]/.test(expression)
  if (!hasOperator && !expression.includes('.')) {
    warnings.push('表达式可能不完整：缺少运算符或字段引用')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * 验证导出前的配置完整性
 *
 * @param nodes - 节点列表
 * @returns 验证结果
 */
export function validateExportConfig(nodes: Array<FlowNode<NodeData>>): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  let hasTaskNode = false
  let hasOutputNode = false

  nodes.forEach(node => {
    if (node.type === 'compute_task' || node.type === 'localTask') {
      hasTaskNode = true
      const taskValidation = validateTaskConfig(node.data as ComputeTaskNodeData | LocalTaskNodeData)
      const label = node.data?.label || '未知节点'
      errors.push(...taskValidation.errors.map(e => `${label}: ${e}`))
      warnings.push(...taskValidation.warnings.map(w => `${label}: ${w}`))

      // 检查输出
      const data = node.data as ComputeTaskNodeData | LocalTaskNodeData
      if ('outputs' in data && data.outputs && data.outputs.length > 0) {
        hasOutputNode = true
      }
    }
  })

  if (!hasTaskNode) {
    errors.push('画布中没有计算任务节点')
  }

  if (!hasOutputNode) {
    warnings.push('没有配置输出节点，导出的任务可能无法获取结果')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}
