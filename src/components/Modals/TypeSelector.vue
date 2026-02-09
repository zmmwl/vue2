<template>
  <div v-if="modelValue" class="modal-overlay" @click="handleCancel">
    <div class="type-selector-modal" @click.stop>
      <h3 class="modal-title">{{ title }}</h3>

      <div class="type-list">
        <div
          v-for="option in options"
          :key="option.label"
          class="type-item"
          :class="{ 'is-disabled': option.disabled }"
          @click="handleSelect(option)"
        >
          <div class="type-icon" :style="{ color: option.color }">
            {{ option.icon }}
          </div>
          <div class="type-content">
            <div class="type-label">{{ option.label }}</div>
            <div v-if="option.description" class="type-description">
              {{ option.description }}
            </div>
          </div>
          <div v-if="option.disabled" class="badge-coming-soon">待上线</div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="handleCancel">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface TypeOption {
  label: string
  icon: string
  color: string
  description?: string
  disabled?: boolean
}

interface Props {
  modelValue: boolean
  title: string
  options: TypeOption[]
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'select', option: TypeOption): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

function handleSelect(option: TypeOption) {
  if (option.disabled) return
  emit('select', option)
}

function handleCancel() {
  emit('update:modelValue', false)
  emit('cancel')
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

.type-selector-modal {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  width: 420px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-title {
  padding: 20px 24px 16px;
  font-size: 18px;
  font-weight: 600;
  color: #000000;
  border-bottom: 1px solid #f0f0f0;
  margin: 0;
}

.type-list {
  padding: 16px 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f5f5f5;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #d9d9d9;
    border-radius: 3px;

    &:hover {
      background: #bfbfbf;
    }
  }
}

.type-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #f0f0f0;
  background: #fafafa;
  position: relative;

  &:hover {
    background: #f5f5f5;
    border-color: #d9d9d9;
    transform: translateX(4px);
  }

  &.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;

    &:hover {
      background: #fafafa;
      border-color: #f0f0f0;
      transform: none;
    }
  }
}

.type-icon {
  font-size: 24px;
  line-height: 1;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 8px;
}

.type-content {
  flex: 1;
  min-width: 0;
}

.type-label {
  font-size: 14px;
  font-weight: 600;
  color: #000000;
  margin-bottom: 2px;
}

.type-description {
  font-size: 12px;
  color: #666666;
  line-height: 1.4;
}

.badge-coming-soon {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, #999999, #777777);
  border-radius: 4px;
  pointer-events: none;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-cancel {
  padding: 8px 20px;
  background: #ffffff;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  font-size: 14px;
  color: #666666;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #f5f5f5;
    border-color: #bfbfbf;
    color: #000000;
  }
}
</style>
