<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click="handleCancel">
        <div class="modal-content" @click.stop>
          <!-- 头部 -->
          <div class="modal-header">
            <h3 class="modal-title">选择 CodeBin 模型类型</h3>
            <button class="close-button" @click="handleCancel">✕</button>
          </div>

          <!-- 内容 -->
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">模型类型</label>
              <select
                v-model="selectedType"
                class="form-select"
              >
                <option value="" disabled>请选择模型类型</option>
                <option value="CodeBin-V2">CodeBin-V2 模型</option>
                <option value="CodeBin-V3-1">CodeBin-V3.1 模型</option>
                <option value="CodeBin-V3-2">CodeBin-V3.2 模型</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">描述</label>
              <div class="type-description">
                <div v-if="selectedType === 'CodeBin-V2'" class="description-item">
                  <span class="description-icon">📦</span>
                  <span>CodeBin-V2：PSI 求交模型，支持隐私集合求交计算</span>
                </div>
                <div v-else-if="selectedType === 'CodeBin-V3-1'" class="description-item">
                  <span class="description-icon">📊</span>
                  <span>CodeBin-V3.1：MPC 统计模型，支持多方安全统计计算</span>
                </div>
                <div v-else-if="selectedType === 'CodeBin-V3-2'" class="description-item">
                  <span class="description-icon">🤖</span>
                  <span>CodeBin-V3.2：联邦学习模型，支持机器学习训练</span>
                </div>
                <div v-else class="description-placeholder">
                  请从下拉框中选择模型类型
                </div>
              </div>
            </div>
          </div>

          <!-- 底部 -->
          <div class="modal-footer">
            <button class="btn btn-cancel" @click="handleCancel">取消</button>
            <button
              class="btn btn-confirm"
              :disabled="!selectedType"
              @click="handleConfirm"
            >
              下一步
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', modelType: string): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 选中的模型类型
const selectedType = ref<string>('')

// 监听对话框打开/关闭，重置选择
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    selectedType.value = ''
  }
})

/**
 * 确认选择
 */
function handleConfirm() {
  if (!selectedType.value) return
  emit('confirm', selectedType.value)
  selectedType.value = ''
}

/**
 * 取消
 */
function handleCancel() {
  emit('update:modelValue', false)
  emit('cancel')
  selectedType.value = ''
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
  max-width: 480px;
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
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333333;
  margin-bottom: 8px;
}

.form-select {
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #ffffff;
  color: #333333;
  cursor: pointer;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #1890ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
  }

  &:disabled {
    background: #f5f5f5;
    color: #999999;
    cursor: not-allowed;
  }

  option {
    padding: 8px;
  }

  option:disabled {
    color: #999999;
  }
}

.type-description {
  min-height: 80px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.description-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  color: #333333;
  font-size: 14px;
  line-height: 1.6;
}

.description-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.description-placeholder {
  color: #999999;
  font-size: 14px;
  text-align: center;
  padding: 20px 0;
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
