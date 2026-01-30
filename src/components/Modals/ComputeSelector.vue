<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click="handleCancel">
        <div class="modal-content" @click.stop>
          <!-- 头部 -->
          <div class="modal-header">
            <h3 class="modal-title">选择算力资源</h3>
            <button class="close-button" @click="handleCancel">✕</button>
          </div>

          <!-- 内容 -->
          <div class="modal-body">
            <!-- 企业信息 -->
            <div class="enterprise-info">
              <span class="enterprise-label">已选企业:</span>
              <span class="enterprise-name">{{ enterpriseName }}</span>
            </div>

            <!-- 算力列表 -->
            <div v-if="availableComputes.length > 0" class="compute-list">
              <div
                v-for="compute in availableComputes"
                :key="compute.id"
                class="compute-item"
                :class="{ selected: selectedComputeId === compute.id }"
                @click="handleSelectCompute(compute)"
              >
                <div class="compute-header">
                  <span class="compute-icon">⚡</span>
                  <span class="compute-name">{{ compute.name }}</span>
                  <span v-if="selectedComputeId === compute.id" class="selected-icon">✓</span>
                </div>
                <div class="compute-description">{{ compute.description }}</div>
                <div class="compute-meta">
                  <span class="meta-item">类型: {{ compute.type }}</span>
                  <span class="meta-item">核心数: {{ compute.cores }}</span>
                </div>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-else class="empty-state">
              <div class="empty-icon">⚡</div>
              <p class="empty-text">该企业暂无可用算力资源</p>
              <p class="empty-hint">请选择其他企业或联系管理员添加算力资源</p>
            </div>
          </div>

          <!-- 底部 -->
          <div class="modal-footer">
            <button class="btn btn-cancel" @click="handleCancel">取消</button>
            <button
              class="btn btn-confirm"
              :disabled="!selectedCompute"
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
import { ref, computed } from 'vue'
import { getMockComputes } from '@/utils/mock-data'

interface ComputeInfo {
  id: string
  name: string
  description: string
  type: string
  cores: number
  participantId: string
}

interface Props {
  modelValue: boolean
  participantId: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', compute: ComputeInfo): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 选中的算力
const selectedComputeId = ref<string>()
const selectedCompute = ref<ComputeInfo>()

// 可用算力列表
const availableComputes = computed(() => {
  if (!props.participantId) return []
  return getMockComputes(props.participantId).map(compute => ({
    ...compute,
    description: `${compute.type} 算力资源`,
    participantId: props.participantId
  }))
})

// 企业名称
const enterpriseName = computed(() => {
  if (!props.participantId) return '未选择'
  return props.participantId
})

/**
 * 选择算力
 */
function handleSelectCompute(compute: ComputeInfo) {
  selectedComputeId.value = compute.id
  selectedCompute.value = compute
}

/**
 * 确认选择
 */
function handleConfirm() {
  if (!selectedCompute.value) return
  emit('confirm', selectedCompute.value)
  // 重置选择
  selectedComputeId.value = undefined
  selectedCompute.value = undefined
}

/**
 * 取消
 */
function handleCancel() {
  emit('update:modelValue', false)
  emit('cancel')
  // 重置选择
  selectedComputeId.value = undefined
  selectedCompute.value = undefined
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
  max-width: 600px;
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

.enterprise-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 8px;
  margin-bottom: 20px;
}

.enterprise-label {
  font-size: 13px;
  color: #666666;
  font-weight: 500;
}

.enterprise-name {
  font-size: 14px;
  color: #fa8c16;
  font-weight: 600;
}

.compute-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.compute-item {
  padding: 16px;
  background: #ffffff;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #fa8c16;
    box-shadow: 0 2px 8px rgba(250, 140, 22, 0.1);
  }

  &.selected {
    border-color: #fa8c16;
    background: #fff7e6;
  }
}

.compute-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.compute-icon {
  font-size: 20px;
}

.compute-name {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: #000000;
}

.selected-icon {
  font-size: 18px;
  color: #52c41a;
}

.compute-description {
  font-size: 13px;
  color: #666666;
  margin-bottom: 8px;
  line-height: 1.5;
}

.compute-meta {
  display: flex;
  gap: 16px;
}

.meta-item {
  font-size: 12px;
  color: #999999;
  padding: 2px 8px;
  background: #f5f5f5;
  border-radius: 4px;
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
      border-color: #fa8c16;
      color: #fa8c16;
    }
  }

  &.btn-confirm {
    background: #fa8c16;
    color: #ffffff;

    &:hover:not(:disabled) {
      background: #ffa940;
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
