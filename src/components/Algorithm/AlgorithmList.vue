<template>
  <div class="algorithm-list">
    <!-- 筛选区域 -->
    <div class="filter-section">
      <div class="filter-row">
        <!-- 类型筛选 -->
        <select v-model="filterType" class="filter-select">
          <option value="">全部类型</option>
          <option v-for="type in algorithmTypes" :key="type.value" :value="type.value">
            {{ type.label }}
          </option>
        </select>

        <!-- 搜索框 -->
        <input
          v-model="searchKeyword"
          type="text"
          class="search-input"
          placeholder="搜索算法名称..."
        />
      </div>
    </div>

    <!-- 算法列表 -->
    <div class="list-content">
      <div v-if="loading" class="loading-state">
        加载中...
      </div>

      <div v-else-if="filteredAlgorithms.length === 0" class="empty-state">
        <div class="empty-icon">📦</div>
        <p>暂无算法数据</p>
      </div>

      <div v-else class="algorithm-cards">
        <div
          v-for="algo in filteredAlgorithms"
          :key="algo.id"
          class="algorithm-card"
        >
          <div class="card-header">
            <div class="algo-name">{{ algo.name }}</div>
            <div class="algo-version">{{ algo.version }}</div>
          </div>
          <div class="card-body">
            <div class="algo-meta">
              <span class="meta-item">
                <span class="meta-label">类型:</span>
                <span class="meta-value">{{ getTypeLabel(algo.type) }}</span>
              </span>
              <span class="meta-item">
                <span class="meta-label">参数:</span>
                <span class="meta-value">{{ algo.paramTemplate?.length || 0 }} 个</span>
              </span>
            </div>
            <div v-if="algo.description" class="algo-desc">
              {{ algo.description }}
            </div>
          </div>
          <div class="card-footer">
            <span class="create-time">{{ formatTime(algo.createdAt) }}</span>
            <button
              class="delete-btn"
              :disabled="deletingId === algo.id"
              @click="handleDelete(algo)"
            >
              {{ deletingId === algo.id ? '删除中...' : '删除' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Algorithm } from '@/types/algorithm'
import { AlgorithmType, AlgorithmTypeLabels } from '@/types/algorithm'
import { algorithmService } from '@/services/algorithmService'

// 状态
const algorithms = ref<Algorithm[]>([])
const loading = ref(true)
const filterType = ref('')
const searchKeyword = ref('')
const deletingId = ref<string | null>(null)

// 算法类型选项
const algorithmTypes = computed(() => {
  return Object.entries(AlgorithmTypeLabels).map(([value, label]) => ({
    value,
    label
  }))
})

// 筛选后的算法列表
const filteredAlgorithms = computed(() => {
  let result = algorithms.value

  // 类型筛选
  if (filterType.value) {
    result = result.filter(algo => algo.type === filterType.value)
  }

  // 关键字搜索
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase().trim()
    result = result.filter(algo =>
      algo.name.toLowerCase().includes(keyword) ||
      algo.nameEn.toLowerCase().includes(keyword) ||
      algo.description?.toLowerCase().includes(keyword)
    )
  }

  return result
})

/**
 * 获取类型标签
 */
function getTypeLabel(type: AlgorithmType): string {
  return AlgorithmTypeLabels[type] || type
}

/**
 * 格式化时间
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * 加载算法列表
 */
async function loadAlgorithms() {
  loading.value = true
  try {
    const response = await algorithmService.getList()
    if (response.code === 0 && response.data) {
      algorithms.value = response.data
    }
  } catch (error) {
    console.error('Failed to load algorithms:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 处理删除
 */
async function handleDelete(algo: Algorithm) {
  if (!confirm(`确定要删除算法 "${algo.name}" 吗？`)) {
    return
  }

  deletingId.value = algo.id
  try {
    const response = await algorithmService.delete(algo.id)
    if (response.code === 0) {
      // 从列表中移除
      algorithms.value = algorithms.value.filter(a => a.id !== algo.id)
    } else {
      alert(response.message || '删除失败')
    }
  } catch (error) {
    console.error('Failed to delete algorithm:', error)
    alert('删除失败')
  } finally {
    deletingId.value = null
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadAlgorithms()
})
</script>

<style scoped lang="scss">
.algorithm-list {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.filter-section {
  padding: 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.filter-row {
  display: flex;
  gap: 12px;
}

.filter-select {
  padding: 8px 12px;
  font-size: 13px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #ffffff;
  min-width: 180px;

  &:focus {
    outline: none;
    border-color: #1890ff;
  }
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  font-size: 13px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #ffffff;

  &:focus {
    outline: none;
    border-color: #1890ff;
  }

  &::placeholder {
    color: #9ca3af;
  }
}

.list-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
  font-size: 14px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #9ca3af;

  .empty-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }

  p {
    font-size: 14px;
  }
}

.algorithm-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.algorithm-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.algo-name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.algo-version {
  font-size: 12px;
  color: #6b7280;
  background: #e5e7eb;
  padding: 2px 8px;
  border-radius: 4px;
}

.card-body {
  padding: 12px 16px;
}

.algo-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
}

.meta-item {
  font-size: 12px;
  color: #6b7280;
}

.meta-label {
  color: #9ca3af;
}

.meta-value {
  color: #374151;
}

.algo-desc {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-top: 1px solid #e5e7eb;
  background: #fafafa;
}

.create-time {
  font-size: 11px;
  color: #9ca3af;
}

.delete-btn {
  padding: 4px 12px;
  font-size: 12px;
  color: #ef4444;
  background: transparent;
  border: 1px solid #fecaca;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #fef2f2;
    border-color: #ef4444;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
