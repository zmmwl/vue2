<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click="handleCancel">
        <div class="modal-content" @click.stop>
          <!-- 头部 -->
          <div class="modal-header">
            <h3 class="modal-title">选择参与方企业</h3>
            <button class="close-button" @click="handleCancel">✕</button>
          </div>

          <!-- 内容 -->
          <div class="modal-body">
            <div class="info-text">
              <p>本地结果处理任务需要一个参与方企业来执行</p>
            </div>

            <!-- 搜索框 -->
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input
                v-model="searchKeyword"
                type="text"
                class="search-input"
                placeholder="搜索企业名称..."
                @input="handleSearch"
              />
              <button v-if="searchKeyword" class="clear-btn" @click="clearSearch">✕</button>
            </div>

            <!-- 企业列表 -->
            <div v-if="filteredEnterprises.length > 0" class="enterprise-list">
              <div
                v-for="enterprise in filteredEnterprises"
                :key="enterprise.id"
                class="enterprise-item"
                :class="{ selected: selectedEnterpriseId === enterprise.id }"
                @click="handleSelectEnterprise(enterprise)"
              >
                <div class="enterprise-header">
                  <span class="enterprise-icon">🏢</span>
                  <span class="enterprise-name">{{ enterprise.name }}</span>
                  <span v-if="selectedEnterpriseId === enterprise.id" class="selected-icon">✓</span>
                </div>
                <div class="enterprise-id">ID: {{ enterprise.id }}</div>
              </div>
            </div>

            <!-- 搜索无结果 -->
            <div v-else-if="searchKeyword && availableEnterprises.length > 0" class="empty-state">
              <div class="empty-icon">🔍</div>
              <p class="empty-text">未找到匹配的企业</p>
              <p class="empty-hint">请尝试其他关键词</p>
            </div>

            <!-- 空状态 -->
            <div v-else class="empty-state">
              <div class="empty-icon">🏢</div>
              <p class="empty-text">暂无可用企业</p>
              <p class="empty-hint">请先添加企业信息</p>
            </div>
          </div>

          <!-- 底部 -->
          <div class="modal-footer">
            <button class="btn btn-cancel" @click="handleCancel">取消</button>
            <button
              class="btn btn-confirm"
              :disabled="!selectedEnterpriseId"
              @click="handleConfirm"
            >
              确认
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { getEnterpriseList } from '@/services/enterpriseService'
import { sortEnterprisesByPriority } from '@/utils/enterprise-sorter'
import { ResourceTypePriority } from '@/types/nodes'
import { logger } from '@/utils/logger'

interface EnterpriseOption {
  id: string
  name: string
  resourceType: ResourceTypePriority
}

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', participantId: string): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 选中的企业
const selectedEnterpriseId = ref<string>()

// 搜索关键词
const searchKeyword = ref('')

// 可用企业列表
const availableEnterprises = ref<EnterpriseOption[]>([])

// 过滤后的企业列表
const filteredEnterprises = computed(() => {
  if (!searchKeyword.value.trim()) {
    return availableEnterprises.value
  }
  const keyword = searchKeyword.value.toLowerCase().trim()
  return availableEnterprises.value.filter(enterprise =>
    enterprise.name.toLowerCase().includes(keyword) ||
    enterprise.id.toLowerCase().includes(keyword)
  )
})

/**
 * 加载企业列表
 */
async function loadEnterprises() {
  try {
    const enterprises = await getEnterpriseList()
    const enterpriseOptions = enterprises.map(ent => ({
      id: ent.participantId,
      name: ent.entityName,
      resourceType: ResourceTypePriority.OTHER
    }))
    availableEnterprises.value = sortEnterprisesByPriority(enterpriseOptions)
  } catch (error) {
    logger.error('[LocalTaskEnterpriseSelector] Failed to load enterprises', error)
    availableEnterprises.value = []
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadEnterprises()
})

// 监听对话框打开时重新加载
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    loadEnterprises()
    // 重置搜索
    searchKeyword.value = ''
  }
})

/**
 * 处理搜索
 */
function handleSearch() {
  // 搜索逻辑已在 computed 中实现
}

/**
 * 清除搜索
 */
function clearSearch() {
  searchKeyword.value = ''
}

/**
 * 选择企业
 */
function handleSelectEnterprise(enterprise: EnterpriseOption) {
  selectedEnterpriseId.value = enterprise.id
}

/**
 * 确认选择
 */
function handleConfirm() {
  if (!selectedEnterpriseId.value) return
  emit('confirm', selectedEnterpriseId.value)
  // 重置选择
  selectedEnterpriseId.value = undefined
}

/**
 * 取消
 */
function handleCancel() {
  emit('update:modelValue', false)
  emit('cancel')
  // 重置选择
  selectedEnterpriseId.value = undefined
}
</script>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #000000;
}

.close-button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  color: #666666;
  transition: all 0.2s ease;

  &:hover {
    background: #f5f5f5;
    color: #000000;
  }
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.info-text {
  padding: 12px 16px;
  background: #f0f5ff;
  border: 1px solid #d6e4ff;
  border-radius: 8px;
  margin-bottom: 16px;

  p {
    margin: 0;
    font-size: 13px;
    color: #666666;
    line-height: 1.5;
  }
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #f5f7fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 16px;
  transition: all 0.2s ease;

  &:focus-within {
    border-color: #722ed1;
    background: #ffffff;
    box-shadow: 0 0 0 2px rgba(114, 46, 209, 0.1);
  }

  .search-icon {
    font-size: 14px;
    opacity: 0.6;
  }

  .search-input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 14px;
    color: #333333;
    outline: none;

    &::placeholder {
      color: #999999;
    }
  }

  .clear-btn {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: #d9d9d9;
    border-radius: 50%;
    font-size: 10px;
    color: #666666;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #999999;
      color: #ffffff;
    }
  }
}

.enterprise-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.enterprise-item {
  padding: 16px;
  background: #ffffff;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #722ed1;
    box-shadow: 0 2px 8px rgba(114, 46, 209, 0.1);
  }

  &.selected {
    border-color: #722ed1;
    background: #f9f0ff;
  }
}

.enterprise-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.enterprise-icon {
  font-size: 20px;
}

.enterprise-name {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: #000000;
}

.selected-icon {
  font-size: 18px;
  color: #52c41a;
}

.enterprise-id {
  font-size: 12px;
  color: #999999;
  font-family: 'Monaco', 'Menlo', monospace;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666666;
}

.empty-hint {
  margin: 0;
  font-size: 12px;
  color: #999999;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
}

.btn {
  padding: 8px 20px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  &.btn-cancel {
    background: #ffffff;
    border: 1px solid #e0e0e0;
    color: #666666;

    &:hover {
      border-color: #722ed1;
      color: #722ed1;
    }
  }

  &.btn-confirm {
    background: #722ed1;
    color: #ffffff;

    &:hover:not(:disabled) {
      background: #9254de;
    }

    &:disabled {
      background: #d9d9d9;
      color: #ffffff;
      cursor: not-allowed;
    }
  }
}

// 过渡动画
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;

  .modal-content {
    transition: transform 0.3s ease;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .modal-content {
    transform: scale(0.9);
  }
}

.modal-enter-to,
.modal-leave-from {
  opacity: 1;

  .modal-content {
    transform: scale(1);
  }
}
</style>
