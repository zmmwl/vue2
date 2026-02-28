/**
 * 算法状态管理 Composable
 * Feature: 004-algorithm-selection
 * 管理算法列表、选中状态和参数配置
 */

import { ref, computed } from 'vue'
import type {
  Algorithm,
  TaskAlgorithmConfig,
  ParamValue
} from '@/types/algorithm'
import { AlgorithmType } from '@/types/algorithm'
import { algorithmService } from '@/services/algorithmService'

// 模块级状态
const algorithms = ref<Algorithm[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// 当前选中的算法（用于详情面板）
const selectedAlgorithm = ref<Algorithm | null>(null)

// 当前任务节点的算法配置
const currentTaskConfig = ref<TaskAlgorithmConfig | null>(null)

export function useAlgorithmState() {
  /**
   * 加载算法列表
   */
  async function loadAlgorithms(type?: AlgorithmType, keyword?: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await algorithmService.getList(type, keyword)
      if (response.code === 0 && response.data) {
        algorithms.value = response.data
      } else {
        error.value = response.message
      }
    } catch (e) {
      error.value = '加载算法列表失败'
      console.error('Failed to load algorithms:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * 加载指定类型的算法
   */
  async function loadAlgorithmsByType(type: AlgorithmType): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await algorithmService.getByType(type)
      if (response.code === 0 && response.data) {
        algorithms.value = response.data
      } else {
        error.value = response.message
      }
    } catch (e) {
      error.value = '加载算法列表失败'
      console.error('Failed to load algorithms by type:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取默认算法（创建时间最新）
   */
  async function getDefaultAlgorithm(type: AlgorithmType): Promise<Algorithm | null> {
    try {
      const response = await algorithmService.getDefault(type)
      if (response.code === 0 && response.data) {
        return response.data
      }
      return null
    } catch (e) {
      console.error('Failed to get default algorithm:', e)
      return null
    }
  }

  /**
   * 根据ID获取算法
   */
  async function getAlgorithmById(id: string): Promise<Algorithm | null> {
    try {
      const response = await algorithmService.getById(id)
      if (response.code === 0 && response.data) {
        return response.data
      }
      return null
    } catch (e) {
      console.error('Failed to get algorithm by id:', e)
      return null
    }
  }

  /**
   * 为任务节点初始化算法配置
   * 自动选择创建时间最新的匹配算法
   */
  async function initializeTaskAlgorithm(
    computeType: string,
    isTEE: boolean = false
  ): Promise<TaskAlgorithmConfig | null> {
    // 根据任务类型确定算法类型
    const algorithmType = getAlgorithmTypeFromComputeType(computeType, isTEE)

    // 获取默认算法
    const defaultAlgo = await getDefaultAlgorithm(algorithmType)
    if (!defaultAlgo) {
      return null
    }

    // 创建算法配置
    const config: TaskAlgorithmConfig = {
      algorithmId: defaultAlgo.id,
      algorithmName: defaultAlgo.name,
      algorithmVersion: defaultAlgo.version,
      algorithmParams: {}
    }

    // 设置当前配置
    currentTaskConfig.value = config
    selectedAlgorithm.value = defaultAlgo

    return config
  }

  /**
   * 选择算法（手动更换）
   */
  async function selectAlgorithm(algorithmId: string): Promise<boolean> {
    const algorithm = await getAlgorithmById(algorithmId)
    if (!algorithm) {
      return false
    }

    // 更新选中算法
    selectedAlgorithm.value = algorithm

    // 更新任务配置（清空参数）
    if (currentTaskConfig.value) {
      currentTaskConfig.value = {
        algorithmId: algorithm.id,
        algorithmName: algorithm.name,
        algorithmVersion: algorithm.version,
        algorithmParams: {}
      }
    }

    return true
  }

  /**
   * 更新参数值
   */
  function updateParamValue(key: string, value: ParamValue): void {
    if (currentTaskConfig.value) {
      currentTaskConfig.value.algorithmParams[key] = value
    }
  }

  /**
   * 批量更新参数值
   */
  function updateParamValues(params: Record<string, ParamValue>): void {
    if (currentTaskConfig.value) {
      currentTaskConfig.value.algorithmParams = { ...params }
    }
  }

  /**
   * 清空参数值
   */
  function clearParams(): void {
    if (currentTaskConfig.value) {
      currentTaskConfig.value.algorithmParams = {}
    }
  }

  /**
   * 设置当前任务配置
   */
  function setCurrentTaskConfig(config: TaskAlgorithmConfig | null): void {
    currentTaskConfig.value = config
    if (config) {
      // 加载对应的算法信息
      getAlgorithmById(config.algorithmId).then(algo => {
        selectedAlgorithm.value = algo
      })
    } else {
      selectedAlgorithm.value = null
    }
  }

  /**
   * 创建新算法
   */
  async function createAlgorithm(input: {
    name: string
    nameEn: string
    version: string
    description?: string
    type: AlgorithmType
    paramTemplate?: Algorithm['paramTemplate']
  }): Promise<Algorithm | null> {
    loading.value = true
    error.value = null

    try {
      const response = await algorithmService.create(input)
      if (response.code === 0 && response.data) {
        // 刷新列表
        await loadAlgorithms()
        return response.data
      } else {
        error.value = response.message
        return null
      }
    } catch (e) {
      error.value = '创建算法失败'
      console.error('Failed to create algorithm:', e)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除算法
   */
  async function deleteAlgorithm(
    id: string,
    usedByTasks?: Array<{ taskId: string; taskName: string }>
  ): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const response = await algorithmService.delete(id, usedByTasks)
      if (response.code === 0) {
        // 刷新列表
        await loadAlgorithms()
        return true
      } else {
        error.value = response.message
        return false
      }
    } catch (e) {
      error.value = '删除算法失败'
      console.error('Failed to delete algorithm:', e)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 清除错误信息
   */
  function clearError(): void {
    error.value = null
  }

  // 计算属性：是否有可用算法
  const hasAlgorithms = computed(() => algorithms.value.length > 0)

  // 计算属性：当前算法是否有参数模板
  const hasParamTemplate = computed(() =>
    (selectedAlgorithm.value?.paramTemplate?.length ?? 0) > 0
  )

  return {
    // 状态
    algorithms,
    loading,
    error,
    selectedAlgorithm,
    currentTaskConfig,

    // 计算属性
    hasAlgorithms,
    hasParamTemplate,

    // 方法
    loadAlgorithms,
    loadAlgorithmsByType,
    getDefaultAlgorithm,
    getAlgorithmById,
    initializeTaskAlgorithm,
    selectAlgorithm,
    updateParamValue,
    updateParamValues,
    clearParams,
    setCurrentTaskConfig,
    createAlgorithm,
    deleteAlgorithm,
    clearError
  }
}

/**
 * 根据任务类型和技术路径获取算法类型
 */
function getAlgorithmTypeFromComputeType(computeType: string, isTEE: boolean): AlgorithmType {
  const typeMap: Record<string, AlgorithmType> = {
    'PSI': isTEE ? AlgorithmType.TEE_PSI : AlgorithmType.PSI,
    'PIR': isTEE ? AlgorithmType.TEE_PIR : AlgorithmType.PIR,
    'MPC': isTEE ? AlgorithmType.TEE_MPC : AlgorithmType.MPC,
    'FL': isTEE ? AlgorithmType.TEE_FL : AlgorithmType.FL
  }
  return typeMap[computeType] || AlgorithmType.MPC
}
