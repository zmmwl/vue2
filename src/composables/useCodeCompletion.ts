/**
 * 代码补全 Composable
 * 用于表达式编辑器的自动补全功能
 */

import { ref, computed } from 'vue'

export interface CompletionField {
  name: string
  participantId: string
  dataset: string
  dataType?: string
}

/**
 * 代码补全 Composable
 */
export function useCodeCompletion(availableFields: CompletionField[]) {
  // 常用 Python 函数
  const commonFunctions = ref([
    { name: 'sum', detail: '求和', documentation: 'sum(array) - 计算数组元素的和' },
    { name: 'avg', detail: '平均值', documentation: 'avg(array) - 计算数组元素的平均值' },
    { name: 'mean', detail: '平均值', documentation: 'mean(array) - 计算数组元素的平均值（同avg）' },
    { name: 'count', detail: '计数', documentation: 'count(array) - 计算数组元素的数量' },
    { name: 'max', detail: '最大值', documentation: 'max(array) - 返回数组中的最大值' },
    { name: 'min', detail: '最小值', documentation: 'min(array) - 返回数组中的最小值' },
    { name: 'abs', detail: '绝对值', documentation: 'abs(x) - 返回x的绝对值' },
    { name: 'round', detail: '四舍五入', documentation: 'round(x, n) - 返回x的四舍五入值，n为小数位数' },
    { name: 'len', detail: '长度', documentation: 'len(array) - 返回数组或字符串的长度' },
    { name: 'sqrt', detail: '平方根', documentation: 'sqrt(x) - 返回x的平方根' },
    { name: 'pow', detail: '幂运算', documentation: 'pow(x, y) - 返回x的y次幂' }
  ])

  // 常用操作符
  const commonOperators = ref([
    { name: '+', detail: '加法', documentation: 'a + b - 加法运算' },
    { name: '-', detail: '减法', documentation: 'a - b - 减法运算' },
    { name: '*', detail: '乘法', documentation: 'a * b - 乘法运算' },
    { name: '/', detail: '除法', documentation: 'a / b - 除法运算' },
    { name: '%', detail: '取模', documentation: 'a % b - 取模运算' },
    { name: '==', detail: '等于', documentation: 'a == b - 等于比较' },
    { name: '!=', detail: '不等于', documentation: 'a != b - 不等于比较' },
    { name: '>', detail: '大于', documentation: 'a > b - 大于比较' },
    { name: '<', detail: '小于', documentation: 'a < b - 小于比较' },
    { name: '>=', detail: '大于等于', documentation: 'a >= b - 大于等于比较' },
    { name: '<=', detail: '小于等于', documentation: 'a <= b - 小于等于比较' },
    { name: 'and', detail: '逻辑与', documentation: 'a and b - 逻辑与运算' },
    { name: 'or', detail: '逻辑或', documentation: 'a or b - 逻辑或运算' },
    { name: 'not', detail: '逻辑非', documentation: 'not a - 逻辑非运算' }
  ])

  /**
   * 格式化变量引用
   * participantId.assetName.columnName
   */
  function formatVariableRef(
    participantId: string,
    dataset: string,
    columnName: string
  ): string {
    return `${participantId}.${dataset}.${columnName}`
  }

  /**
   * 解析变量引用
   */
  function parseVariableRef(ref: string): {
    participantId: string
    dataset: string
    columnName: string
  } | null {
    const parts = ref.split('.')
    if (parts.length !== 3) return null

    return {
      participantId: parts[0] || '',
      dataset: parts[1] || '',
      columnName: parts[2] || ''
    }
  }

  /**
   * 获取所有可用变量
   */
  const allVariables = computed(() => {
    return availableFields.map(field => ({
      ref: formatVariableRef(field.participantId, field.dataset, field.name),
      ...field
    }))
  })

  return {
    // 状态
    commonFunctions,
    commonOperators,
    allVariables,

    // 方法
    formatVariableRef,
    parseVariableRef
  }
}
