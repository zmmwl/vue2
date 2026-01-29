<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click="onCancel">
        <div class="modal-container" @click.stop>
          <!-- 标题栏 -->
          <div class="modal-header">
            <h3 class="modal-title">选择技术路径</h3>
            <button class="modal-close" @click="onCancel" aria-label="关闭">
              <span>✕</span>
            </button>
          </div>

          <!-- 内容区 -->
          <div class="modal-body">
            <p class="task-type">任务类型: <strong>{{ taskTypeLabel }}</strong></p>

            <div class="tech-path-options">
              <label
                class="path-option"
                :class="{ selected: selectedPath === 'software' }"
              >
                <input
                  type="radio"
                  value="software"
                  v-model="selectedPath"
                  :disabled="!!lockedPath"
                />
                <div class="option-content">
                  <div class="option-icon">💻</div>
                  <div class="option-info">
                    <div class="option-title">软件密码学</div>
                    <div class="option-desc">基于密码学算法的纯软件实现</div>
                  </div>
                </div>
              </label>

              <label
                class="path-option"
                :class="{ selected: selectedPath === 'tee' }"
              >
                <input
                  type="radio"
                  value="tee"
                  v-model="selectedPath"
                  :disabled="!!lockedPath"
                />
                <div class="option-content">
                  <div class="option-icon">🔧</div>
                  <div class="option-info">
                    <div class="option-title">硬件 TEE</div>
                    <div class="option-desc">基于可信执行环境的硬件加速</div>
                  </div>
                </div>
              </label>
            </div>

            <!-- 锁定提示 -->
            <div v-if="lockedPath" class="locked-notice">
              <span class="notice-icon">🔒</span>
              技术路径已锁定，无法修改
            </div>

            <!-- 预览区 -->
            <div class="preview-section">
              <div class="preview-label">最终计算类型:</div>
              <div class="preview-value">
                <strong>{{ finalComputeType }}</strong>
              </div>
            </div>
          </div>

          <!-- 底部按钮 -->
          <div class="modal-footer">
            <button class="btn btn-cancel" @click="onCancel">
              取消
            </button>
            <button
              class="btn btn-confirm"
              :disabled="!selectedPath"
              @click="onConfirm"
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
import { ref, computed, watch } from 'vue'
import { ComputeTaskType } from '@/types/nodes'
import { getComputeType } from '@/utils/node-templates'

interface Props {
  visible: boolean
  taskType: ComputeTaskType
  lockedPath?: 'software' | 'tee' // 锁定的技术路径
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'confirm', path: 'software' | 'tee'): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  lockedPath: undefined
})

const emit = defineEmits<Emits>()

// 选中的技术路径
const selectedPath = ref<'software' | 'tee'>('software')

// 监听锁定路径变化
watch(() => props.lockedPath, (newPath) => {
  if (newPath) {
    selectedPath.value = newPath
  }
}, { immediate: true })

// 任务类型标签
const taskTypeLabel = computed(() => {
  const labels: Record<ComputeTaskType, string> = {
    [ComputeTaskType.PSI]: 'PSI - 隐私集合求交',
    [ComputeTaskType.PIR]: 'PIR - 隐私信息检索',
    [ComputeTaskType.MPC]: 'MPC - 多方安全计算',
    [ComputeTaskType.FL]: 'FL - 联邦学习'
  }
  return labels[props.taskType] || props.taskType
})

// 最终计算类型
const finalComputeType = computed(() => {
  return getComputeType(props.taskType, selectedPath.value)
})

// 确认选择
const onConfirm = () => {
  if (!selectedPath.value) return
  emit('confirm', selectedPath.value)
  emit('update:visible', false)
}

// 取消
const onCancel = () => {
  emit('cancel')
  emit('update:visible', false)
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-container {
  width: 100%;
  max-width: 480px;
  background: var(--panel-bg);
  backdrop-filter: var(--panel-blur);
  border-radius: 16px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--glass-border);
  overflow: hidden;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: translateY(-20px) scale(0.95);
  opacity: 0;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 18px;
  transition: var(--button-transition);

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: var(--text-primary);
  }
}

.modal-body {
  padding: 24px;
}

.task-type {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 20px;

  strong {
    color: var(--text-primary);
  }
}

.tech-path-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.path-option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border: 2px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  cursor: pointer;
  transition: var(--button-transition);
  background: var(--info-card-bg);

  input[type="radio"] {
    margin-top: 4px;
    width: 18px;
    height: 18px;
    accent-color: var(--datasource-blue);
    cursor: pointer;

    &:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }

  &.selected {
    border-color: var(--datasource-blue);
    background: rgba(14, 165, 233, 0.05);
  }

  &:hover:not(.has input:disabled) {
    border-color: var(--list-item-selected-border);
    background: var(--list-item-hover-bg);
  }
}

.option-content {
  display: flex;
  gap: 12px;
  flex: 1;
}

.option-icon {
  font-size: 24px;
  line-height: 1;
}

.option-info {
  flex: 1;
}

.option-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.option-desc {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.locked-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(250, 140, 22, 0.1);
  border: 1px solid rgba(250, 140, 22, 0.3);
  border-radius: 8px;
  font-size: 13px;
  color: #D46B08;
  margin-bottom: 20px;
}

.notice-icon {
  font-size: 16px;
}

.preview-section {
  padding: 16px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.preview-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.preview-value {
  font-size: 14px;
  color: var(--datasource-blue);

  strong {
    font-size: 16px;
  }
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(0, 0, 0, 0.02);
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--button-transition);
  border: none;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-cancel {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: var(--text-secondary);

  &:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.04);
    border-color: rgba(0, 0, 0, 0.15);
  }
}

.btn-confirm {
  background: linear-gradient(135deg, var(--datasource-blue), #0284C7);
  color: white;
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.3);

  &:hover:not(:disabled) {
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4);
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
}
</style>
