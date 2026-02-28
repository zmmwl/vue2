<template>
  <div class="algorithm-selector" ref="selectorRef">
    <!-- 有可用算法时显示 -->
    <div v-if="algorithm" class="algorithm-info" @click="toggleDropdown">
      <div class="algorithm-main">
        <div class="algorithm-name">{{ algorithm.name }}</div>
        <div class="algorithm-version">{{ algorithm.version }}</div>
      </div>
      <div class="algorithm-actions">
        <button class="change-btn" @click.stop="toggleDropdown" title="更换算法">
          {{ showDropdown ? '收起' : '更换' }}
        </button>
        <span class="dropdown-icon" :class="{ open: showDropdown }">▼</span>
      </div>
    </div>

    <!-- 算法下拉列表 -->
    <div v-if="showDropdown" class="algorithm-dropdown">
      <div v-if="loadingList" class="dropdown-loading">
        加载中...
      </div>
      <template v-else>
        <div
          v-for="algo in availableAlgorithms"
          :key="algo.id"
          class="dropdown-item"
          :class="{ selected: algo.id === algorithm?.id }"
          @click="handleSelectAlgorithm(algo)"
        >
          <div class="item-main">
            <span class="item-name">{{ algo.name }}</span>
            <span class="item-version">{{ algo.version }}</span>
          </div>
          <span v-if="algo.id === algorithm?.id" class="check-icon">✓</span>
        </div>
        <div v-if="availableAlgorithms.length === 0" class="dropdown-empty">
          暂无其他可用算法
        </div>
      </template>
    </div>

    <!-- 无可用算法时显示空状态 -->
    <div v-if="!algorithm && !isLoading" class="algorithm-empty">
      <span class="empty-icon">⚠️</span>
      <span class="empty-text">暂无可用算法</span>
    </div>

    <!-- 加载中状态 -->
    <div v-if="!algorithm && isLoading" class="algorithm-loading">
      <span class="loading-text">加载中...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import type { Algorithm, TaskAlgorithmConfig } from '@/types/algorithm'
import { AlgorithmType } from '@/types/algorithm'
import { algorithmService } from '@/services/algorithmService'

interface Props {
  computeType: string
  isTEE?: boolean
  modelValue?: TaskAlgorithmConfig | null
}

interface Emits {
  (e: 'update:modelValue', value: TaskAlgorithmConfig | null): void
  (e: 'change', algorithm: Algorithm | null): void
}

const props = withDefaults(defineProps<Props>(), {
  isTEE: false,
  modelValue: null
})

const emit = defineEmits<Emits>()

// 组件内部状态（不使用共享状态）
const algorithm = ref<Algorithm | null>(null)
const isLoading = ref(true)

// 下拉列表状态
const selectorRef = ref<HTMLElement | null>(null)
const showDropdown = ref(false)
const loadingList = ref(false)
const availableAlgorithms = ref<Algorithm[]>([])

/**
 * 切换下拉列表
 */
function toggleDropdown() {
  showDropdown.value = !showDropdown.value
  if (showDropdown.value) {
    loadAvailableAlgorithms()
  }
}

/**
 * 关闭下拉列表
 */
function closeDropdown() {
  showDropdown.value = false
}

/**
 * 点击外部关闭下拉
 */
function handleClickOutside(event: MouseEvent) {
  if (selectorRef.value && !selectorRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

/**
 * 加载可用算法列表
 */
async function loadAvailableAlgorithms() {
  loadingList.value = true
  try {
    const type = getAlgorithmType(props.computeType, props.isTEE)
    const response = await algorithmService.getByType(type)
    if (response.code === 0 && response.data) {
      availableAlgorithms.value = response.data
    }
  } catch (error) {
    console.error('Failed to load available algorithms:', error)
  } finally {
    loadingList.value = false
  }
}

/**
 * 选择算法
 */
async function handleSelectAlgorithm(algo: Algorithm) {
  if (algo.id === algorithm.value?.id) {
    closeDropdown()
    return
  }

  // 更新选中的算法
  algorithm.value = algo

  // 创建新的算法配置（清空参数）
  const config: TaskAlgorithmConfig = {
    algorithmId: algo.id,
    algorithmName: algo.name,
    algorithmVersion: algo.version,
    algorithmParams: {}
  }

  emit('update:modelValue', config)
  emit('change', algo)

  closeDropdown()
}

/**
 * 自动匹配默认算法
 */
async function autoMatchAlgorithm() {
  isLoading.value = true

  try {
    // 如果已有配置，加载对应的算法信息
    if (props.modelValue?.algorithmId) {
      const response = await algorithmService.getById(props.modelValue.algorithmId)
      if (response.code === 0 && response.data) {
        algorithm.value = response.data
      }
      return
    }

    // 获取默认算法
    const type = getAlgorithmType(props.computeType, props.isTEE)
    const response = await algorithmService.getDefault(type)

    if (response.code === 0 && response.data) {
      const defaultAlgo = response.data
      algorithm.value = defaultAlgo

      // 创建算法配置
      const config: TaskAlgorithmConfig = {
        algorithmId: defaultAlgo.id,
        algorithmName: defaultAlgo.name,
        algorithmVersion: defaultAlgo.version,
        algorithmParams: {}
      }

      emit('update:modelValue', config)
      emit('change', defaultAlgo)
    } else {
      algorithm.value = null
      emit('update:modelValue', null)
      emit('change', null)
    }
  } catch (error) {
    console.error('Failed to auto-match algorithm:', error)
    algorithm.value = null
  } finally {
    isLoading.value = false
  }
}

/**
 * 根据任务类型获取算法类型
 */
function getAlgorithmType(computeType: string, isTEE: boolean): AlgorithmType {
  const typeMap: Record<string, AlgorithmType> = {
    'PSI': isTEE ? AlgorithmType.TEE_PSI : AlgorithmType.PSI,
    'PIR': isTEE ? AlgorithmType.TEE_PIR : AlgorithmType.PIR,
    'MPC': isTEE ? AlgorithmType.TEE_MPC : AlgorithmType.MPC,
    'FL': isTEE ? AlgorithmType.TEE_FL : AlgorithmType.FL
  }
  return typeMap[computeType] || AlgorithmType.MPC
}

// 监听任务类型变化
watch(
  () => [props.computeType, props.isTEE],
  () => {
    closeDropdown()
    autoMatchAlgorithm()
  }
)

// 监听 modelValue 变化（外部更新时重新加载）
watch(
  () => props.modelValue?.algorithmId,
  (newId, oldId) => {
    if (newId && newId !== oldId && newId !== algorithm.value?.id) {
      // 外部更新了算法配置，重新加载
      algorithmService.getById(newId).then(response => {
        if (response.code === 0 && response.data) {
          algorithm.value = response.data
        }
      })
    }
  }
)

// 组件挂载时自动匹配
onMounted(() => {
  autoMatchAlgorithm()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped lang="scss">
.algorithm-selector {
  position: relative;
}

.algorithm-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #1890ff;
    background: #fafafa;
  }
}

.algorithm-main {
  display: flex;
  align-items: center;
  gap: 10px;
}

.algorithm-name {
  font-size: 13px;
  font-weight: 500;
  color: #111827;
}

.algorithm-version {
  font-size: 11px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 4px;
}

.algorithm-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.change-btn {
  font-size: 12px;
  color: #1890ff;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;

  &:hover {
    background: #e6f7ff;
  }
}

.dropdown-icon {
  font-size: 10px;
  color: #9ca3af;
  transition: transform 0.2s;

  &.open {
    transform: rotate(180deg);
  }
}

.algorithm-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
  max-height: 240px;
  overflow-y: auto;
}

.dropdown-loading {
  padding: 16px;
  text-align: center;
  color: #6b7280;
  font-size: 13px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: #f3f4f6;
  }

  &.selected {
    background: #e6f7ff;
  }
}

.item-main {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-name {
  font-size: 13px;
  color: #111827;
}

.item-version {
  font-size: 11px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 1px 6px;
  border-radius: 3px;
}

.check-icon {
  color: #1890ff;
  font-size: 14px;
}

.dropdown-empty {
  padding: 16px;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
}

.algorithm-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 6px;
}

.empty-icon {
  font-size: 16px;
}

.empty-text {
  font-size: 13px;
  color: #92400e;
}

.algorithm-loading {
  padding: 12px;
  text-align: center;
}

.loading-text {
  font-size: 13px;
  color: #6b7280;
}
</style>
