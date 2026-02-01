<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click="closeOnOverlay && $emit('cancel')">
        <div class="modal-container" @click.stop tabindex="0" @keydown.esc="$emit('cancel')">
          <div class="modal-header">
            <h3 class="modal-title">选择技术路径</h3>
            <button class="modal-close" @click="$emit('cancel')">&times;</button>
          </div>

          <div class="modal-body">
            <p class="modal-description">请为 {{ computeTypeLabel }} 计算任务选择技术实现路径</p>

            <div class="tech-path-options">
              <label
                v-for="option in techPathOptions"
                :key="option.value"
                class="tech-path-option"
                :class="{ selected: selectedTechPath === option.value }"
              >
                <input
                  :id="`tech-path-${option.value}`"
                  v-model="selectedTechPath"
                  type="radio"
                  :value="option.value"
                  name="tech-path"
                />
                <span class="option-radio"></span>
                <div class="option-content">
                  <div class="option-label">{{ option.label }}</div>
                  <div class="option-description">{{ option.description }}</div>
                </div>
              </label>
            </div>

            <div v-if="selectedTechPath" class="tech-path-preview">
              <div class="preview-label">最终计算类型：</div>
              <div class="preview-value">{{ finalComputeType }}</div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" @click="$emit('cancel')">取消</button>
            <button class="btn btn-primary" :disabled="!selectedTechPath" @click="handleConfirm">
              确定
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
import { TechPath } from '@/types/nodes'
import { mapComputeType } from '@/utils/dag-export'

interface Props {
  modelValue: boolean
  computeType: ComputeTaskType
  closeOnOverlay?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', techPath: TechPath): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  closeOnOverlay: true
})

const emit = defineEmits<Emits>()

// 选中的技术路径
const selectedTechPath = ref<TechPath>(TechPath.SOFTWARE)

// 技术路径选项
const techPathOptions = [
  {
    value: TechPath.SOFTWARE,
    label: '软件密码学',
    description: '基于密码学算法的纯软件实现'
  },
  {
    value: TechPath.TEE,
    label: '硬件 TEE',
    description: '基于可信执行环境的硬件加速方案'
  }
]

// 计算类型标签
const computeTypeLabel = computed(() => {
  const labels: Record<ComputeTaskType, string> = {
    [ComputeTaskType.PSI]: 'PSI 隐私集合求交',
    [ComputeTaskType.PIR]: 'PIR 隐私信息检索',
    [ComputeTaskType.MPC]: 'MPC 多方安全计算',
    [ComputeTaskType.FL]: 'FL 联邦学习'
  }
  return labels[props.computeType] || props.computeType
})

// 最终计算类型
const finalComputeType = computed(() => {
  if (!selectedTechPath.value) return ''
  return mapComputeType(props.computeType, selectedTechPath.value)
})

// 监听弹窗打开，重置选择
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    selectedTechPath.value = TechPath.SOFTWARE
  }
})

// 处理确认
function handleConfirm() {
  if (selectedTechPath.value) {
    emit('confirm', selectedTechPath.value)
    emit('update:modelValue', false)
  }
}
</script>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background-color: #ffffff;
  border-radius: 8px;
  width: 90%;
  max-width: 560px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e8e8e8;
}

.modal-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #000000;
}

.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  font-size: 24px;
  color: #999999;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background-color: #f5f5f5;
    color: #000000;
  }
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  max-height: calc(90vh - 140px);
}

.modal-description {
  margin: 0 0 20px 0;
  font-size: 14px;
  color: #666666;
}

.tech-path-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.tech-path-option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;

  input[type="radio"] {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .option-radio {
    width: 20px;
    height: 20px;
    border: 2px solid #d9d9d9;
    border-radius: 50%;
    position: relative;
    flex-shrink: 0;
    margin-top: 2px;
    transition: all 0.2s;

    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0);
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: #1890ff;
      transition: transform 0.2s;
    }
  }

  &:hover {
    border-color: #1890ff;

    .option-radio {
      border-color: #1890ff;
    }
  }

  &.selected {
    border-color: #1890ff;
    background-color: #e6f7ff;

    .option-radio {
      border-color: #1890ff;

      &::after {
        transform: translate(-50%, -50%) scale(1);
      }
    }
  }

  input[type="radio"]:checked + .option-radio {
    border-color: #1890ff;

    &::after {
      transform: translate(-50%, -50%) scale(1);
    }
  }
}

.option-content {
  flex: 1;
}

.option-label {
  font-size: 14px;
  font-weight: 600;
  color: #000000;
  margin-bottom: 4px;
}

.option-description {
  font-size: 12px;
  color: #666666;
  line-height: 1.5;
}

.tech-path-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: #f5f5f5;
  border-radius: 6px;

  .preview-label {
    font-size: 13px;
    color: #666666;
    font-weight: 500;
  }

  .preview-value {
    font-size: 13px;
    color: #1890ff;
    font-weight: 600;
    font-family: 'Courier New', monospace;
  }
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e8e8e8;
}

.btn {
  padding: 8px 20px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-secondary {
  background-color: #ffffff;
  border-color: #d9d9d9;
  color: #000000;

  &:hover:not(:disabled) {
    border-color: #1890ff;
    color: #1890ff;
  }
}

.btn-primary {
  background-color: #1890ff;
  border-color: #1890ff;
  color: #ffffff;

  &:hover:not(:disabled) {
    background-color: #40a9ff;
    border-color: #40a9ff;
  }
}

// Transition 动画
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s;

  .modal-container {
    transition: transform 0.2s;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .modal-container {
    transform: scale(0.9);
  }
}
</style>
