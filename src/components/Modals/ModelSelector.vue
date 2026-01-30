<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click="handleCancel">
        <div class="modal-content" @click.stop>
          <!-- 头部 -->
          <div class="modal-header">
            <h3 class="modal-title">选择计算模型</h3>
            <button class="close-button" @click="handleCancel">✕</button>
          </div>

          <!-- 内容 -->
          <div class="modal-body">
            <!-- 企业信息 -->
            <div class="enterprise-info">
              <span class="enterprise-label">已选企业:</span>
              <span class="enterprise-name">{{ enterpriseName }}</span>
            </div>

            <!-- 模型列表 -->
            <div v-if="availableModels.length > 0" class="model-list">
              <div
                v-for="model in availableModels"
                :key="model.id"
                class="model-item"
                :class="{ selected: selectedModelId === model.id }"
                @click="handleSelectModel(model)"
              >
                <div class="model-header">
                  <span class="model-icon">📦</span>
                  <span class="model-name">{{ model.name }}</span>
                  <span v-if="selectedModelId === model.id" class="selected-icon">✓</span>
                </div>
                <div class="model-description">{{ model.description }}</div>
                <div class="model-meta">
                  <span class="meta-item">版本: {{ model.version }}</span>
                  <span class="meta-item">类型: {{ model.type }}</span>
                </div>
              </div>
            </div>

            <!-- 空状态 -->
            <div v-else class="empty-state">
              <div class="empty-icon">📦</div>
              <p class="empty-text">该企业暂无可用模型</p>
              <p class="empty-hint">请选择其他企业或联系管理员添加模型</p>
            </div>
          </div>

          <!-- 底部 -->
          <div class="modal-footer">
            <button class="btn btn-cancel" @click="handleCancel">取消</button>
            <button
              class="btn btn-confirm"
              :disabled="!selectedModel"
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
import { getMockModels } from '@/utils/mock-data'

interface ModelInfo {
  id: string
  name: string
  description: string
  version: string
  type: string
  participantId: string
}

interface Props {
  modelValue: boolean
  participantId: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', model: ModelInfo): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 选中的模型
const selectedModelId = ref<string>()
const selectedModel = ref<ModelInfo>()

// 可用模型列表
const availableModels = computed(() => {
  if (!props.participantId) return []
  return getMockModels(props.participantId).map(model => ({
    ...model,
    description: `${model.type} 模型`,
    version: '1.0.0',
    participantId: props.participantId
  }))
})

// 企业名称
const enterpriseName = computed(() => {
  if (!props.participantId) return '未选择'
  return props.participantId
})

/**
 * 选择模型
 */
function handleSelectModel(model: ModelInfo) {
  selectedModelId.value = model.id
  selectedModel.value = model
}

/**
 * 确认选择
 */
function handleConfirm() {
  if (!selectedModel.value) return
  emit('confirm', selectedModel.value)
  // 重置选择
  selectedModelId.value = undefined
  selectedModel.value = undefined
}

/**
 * 取消
 */
function handleCancel() {
  emit('update:modelValue', false)
  emit('cancel')
  // 重置选择
  selectedModelId.value = undefined
  selectedModel.value = undefined
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
  background: #f0f5ff;
  border: 1px solid #d6e4ff;
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
  color: #1890ff;
  font-weight: 600;
}

.model-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.model-item {
  padding: 16px;
  background: #ffffff;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #1890ff;
    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
  }

  &.selected {
    border-color: #1890ff;
    background: #f0f5ff;
  }
}

.model-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.model-icon {
  font-size: 20px;
}

.model-name {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: #000000;
}

.selected-icon {
  font-size: 18px;
  color: #52c41a;
}

.model-description {
  font-size: 13px;
  color: #666666;
  margin-bottom: 8px;
  line-height: 1.5;
}

.model-meta {
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
      border-color: #1890ff;
      color: #1890ff;
    }
  }

  &.btn-confirm {
    background: #1890ff;
    color: #ffffff;

    &:hover:not(:disabled) {
      background: #40a9ff;
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
